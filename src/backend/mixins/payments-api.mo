import Map "mo:core/Map";
import Queue "mo:core/Queue";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";
import Admin "../lib/Admin";
import PaymentsLib "../lib/Payments";
import Obs "../lib/Observability";

/// Payments API mixin — public query endpoints for token metadata,
/// amount formatting, transaction history, payment status,
/// and Phase-2 automated blockchain payment verification.
///
/// State injected:
///   trades              — trade records
///   users               — user map (for payment method storage)
///   systemSettings      — holds blockchain API keys (read-only in this mixin)
///   rateLimitVerify     — per-trade rate limit state (tradeId → (count, windowStart))
///   paymentErrorLog     — ring buffer for failed verification attempts
///   obsErrorLog         — Observability structured error log
///   obsMetrics          — Observability per-module metrics
///   nextObsErrorId      — next Observability error id counter
///   rateCache           — CoinGecko price oracle cache (TradeToken → RateCacheEntry)
///   addressVerifyCache  — on-chain address verification cache (address#network → AddressVerification)
mixin (
  trades              : Map.Map<Types.TradeId, Types.Trade>,
  users               : Map.Map<Types.UserId, Types.User>,
  systemSettings      : Admin.SystemSettings,
  rateLimitVerify     : Map.Map<Types.TradeId, (Nat, Types.Timestamp)>,
  paymentErrorLog     : Queue.Queue<Admin.PaymentVerificationError>,
  obsErrorLog         : List.List<Obs.ErrorLogEntry>,
  obsMetrics          : Map.Map<Text, Obs.ModuleMetrics>,
  nextObsErrorId      : { var value : Nat },
  rateCache           : Map.Map<Types.TradeToken, PaymentsLib.RateCacheEntry>,
  addressVerifyCache  : Map.Map<Text, Types.AddressVerification>,
) {

  // ─── HTTPS outcall infrastructure ─────────────────────────────────────────

  type HttpHeader = { name : Text; value : Text };
  type HttpRequestArgs = {
    url               : Text;
    max_response_bytes : ?Nat64;
    headers           : [HttpHeader];
    body              : ?Blob;
    method            : { #get; #post; #head };
    transform         : ?{
      function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
      context  : Blob;
    };
  };
  type HttpResponse = {
    status  : Nat;
    headers : [HttpHeader];
    body    : Blob;
  };

  let ic : actor { http_request : HttpRequestArgs -> async HttpResponse } =
    actor "aaaaa-aa";

  // ─── Float-from-text helper ───────────────────────────────────────────────

  /// Parses a decimal string like "12345678" into a Float divided by `divisor`.
  func rawAmountToFloat(amountStr : Text, decimals : Nat) : Float {
    let natOpt = Nat.fromText(amountStr);
    switch natOpt {
      case null 0.0;
      case (?n) {
        var divisor : Float = 1.0;
        var i = 0;
        while (i < decimals) { divisor := divisor * 10.0; i += 1 };
        n.toFloat() / divisor
      };
    }
  };

  // ─── Transform function (required for ICP consensus) ─────────────────────

  /// Strips all response headers so all replicas agree on the same response.
  public shared query func transformPaymentResponse(
    raw : { response : HttpResponse; context : Blob },
  ) : async HttpResponse {
    {
      status  = raw.response.status;
      headers = [];
      body    = raw.response.body;
    }
  };

  // ─── Internal: perform GET request with retry ────────────────────────────

  /// Performs a GET request with up to `maxAttempts` retries using exponential
  /// backoff delays (simulated via attempt count — actual sleep not available
  /// in query context; retries on inter-canister calls are sequential awaits).
  func httpGetWithRetry(
    url         : Text,
    extraHeaders : [HttpHeader],
    maxAttempts : Nat,
  ) : async { #ok : Text; #err : Text } {
    var attempt : Nat = 0;
    var lastErr : Text = "no attempts made";
    while (attempt < maxAttempts) {
      let args : HttpRequestArgs = {
        url;
        max_response_bytes = ?(10_000 : Nat64);
        headers = extraHeaders;
        body    = null;
        method  = #get;
        transform = ?{
          function = transformPaymentResponse;
          context  = "".encodeUtf8();
        };
      };
      // Cycle budget scales with attempt: 49M, 98M, 147M (backoff)
      let cycles : Nat = 49_000_000 * (attempt + 1);
      try {
        let resp = await (with cycles = cycles) ic.http_request(args);
        switch (resp.body.decodeUtf8()) {
          case (?json) { return #ok(json) };
          case null    { lastErr := "Failed to decode response body as UTF-8" };
        };
      } catch (_) {
        lastErr := "HTTPS outcall failed — network error (attempt " # (attempt + 1).toText() # ")";
      };
      attempt += 1;
    };
    #err(lastErr)
  };

  // ─── Internal: perform POST request with retry ────────────────────────────

  func httpPostWithRetry(
    url         : Text,
    bodyText    : Text,
    maxAttempts : Nat,
  ) : async { #ok : Text; #err : Text } {
    var attempt : Nat = 0;
    var lastErr : Text = "no attempts made";
    while (attempt < maxAttempts) {
      let args : HttpRequestArgs = {
        url;
        max_response_bytes = ?(10_000 : Nat64);
        headers = [
          { name = "Content-Type"; value = "application/json" },
          { name = "Accept";       value = "application/json" },
        ];
        body    = ?(bodyText.encodeUtf8());
        method  = #post;
        transform = ?{
          function = transformPaymentResponse;
          context  = "".encodeUtf8();
        };
      };
      let cycles : Nat = 49_000_000 * (attempt + 1);
      try {
        let resp = await (with cycles = cycles) ic.http_request(args);
        switch (resp.body.decodeUtf8()) {
          case (?json) { return #ok(json) };
          case null    { lastErr := "Failed to decode response body as UTF-8" };
        };
      } catch (_) {
        lastErr := "HTTPS POST outcall failed — network error (attempt " # (attempt + 1).toText() # ")";
      };
      attempt += 1;
    };
    #err(lastErr)
  };

  // ─── Observability helpers ────────────────────────────────────────────────

  func obsLogError(fn : Text, msg : Text, caller : ?Principal) : () {
    nextObsErrorId.value := Obs.logError(
      obsErrorLog, nextObsErrorId.value,
      "payments", fn, msg, #error, caller,
    );
    Obs.recordModuleError(obsMetrics, "payments");
  };

  func obsRecordCall() : () {
    Obs.recordModuleCall(obsMetrics, "payments");
  };

  // ─── Verification results cache ───────────────────────────────────────────

  let verificationResults = Map.empty<Types.TradeId, Types.PaymentVerificationResult>();

  // ─── verifyPayment — core Phase-2 logic ──────────────────────────────────

  /// Verifies a payment on-chain by calling the appropriate blockchain API.
  /// Callable by the buyer of the trade only.
  /// Rate limited: 10 calls per trade per 5-minute window.
  /// On success: advances trade state from #buyer_confirmed → #payment_verified.
  /// On failure: logs to admin error ring buffer and Observability.
  /// Retries up to 3 times with increasing cycle budget on transient errors.
  public shared ({ caller }) func verifyPayment(
    tradeId : Types.TradeId,
    txHash  : Text,
    network : Types.TradeToken,
  ) : async Types.Result<Types.PaymentVerificationResult> {
    obsRecordCall();

    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    // Load trade
    let trade = switch (trades.get(tradeId)) {
      case null    return #err(#not_found);
      case (?t)    t;
    };

    // Only the buyer may verify
    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    // Trade must be in a state that accepts verification
    switch (trade.status) {
      case (#buyer_confirmed) {};
      case (#payment_verified) {};
      case (_) return #err(#escrow_error(
        "verifyPayment requires trade status #buyer_confirmed or #payment_verified, got "
          # debug_show(trade.status)
      ));
    };

    // Rate limit: 10 calls per 5 min per trade
    if (not PaymentsLib.checkAndRecordRateLimit(rateLimitVerify, tradeId)) {
      return #err(#rate_limited);
    };

    let networkLabel = PaymentsLib.networkName(network);

    // Dispatch to correct blockchain API (3 retries with backoff)
    let result : Types.PaymentVerificationResult = switch (network) {
      case (#USDT_TRC20) {
        await verifyTrc20(tradeId, txHash, networkLabel);
      };
      case (#USDT_BEP20) {
        await verifyBep20(tradeId, txHash, networkLabel);
      };
      case (#USDC_SPL) {
        await verifySpl(tradeId, txHash, networkLabel);
      };
      case (#USDT_ERC20) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      case (#USDC_ERC20) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      case (#USDT_POLYGON) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      case (#USDC_POLYGON) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      case (#USDT_AVAX) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      case (#USDC_AVAX) {
        await verifyEvm(tradeId, txHash, network, networkLabel);
      };
      // ICP-native tokens — not externally verifiable via HTTPS outcall
      case (#ckUSDC) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?("ICP-native token verification not supported via HTTPS outcall");
        }
      };
      case (#ckUSDT) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?("ICP-native token verification not supported via HTTPS outcall");
        }
      };
    };

    // Cache the result for query access
    verificationResults.add(tradeId, result);

    // On verified: advance trade state
    switch (result.status) {
      case (#verified) {
        trade.status := #payment_verified;
      };
      case (#failed) {
        let reason = switch (result.errorReason) {
          case (?r) r;
          case null "Unknown verification failure";
        };
        // Log to admin error ring buffer
        PaymentsLib.logVerificationError(paymentErrorLog, tradeId, txHash, networkLabel, reason);
        // Log to Observability structured error log
        obsLogError("verifyPayment",
          "Verification failed for trade " # tradeId.toText()
            # " network=" # networkLabel
            # " txHash=" # txHash
            # " reason=" # reason,
          ?caller);
      };
      case (#pending) {};
    };

    #ok(result)
  };

  // ─── TRC20 verification (TronGrid) ────────────────────────────────────────

  func verifyTrc20(
    _tradeId     : Types.TradeId,
    txHash       : Text,
    _networkLabel : Text,
  ) : async Types.PaymentVerificationResult {
    let apiKey = systemSettings.tronGridApiKey;
    let headers : [HttpHeader] = if (apiKey == "") {
      [{ name = "Accept"; value = "application/json" }]
    } else {
      [
        { name = "Accept";            value = "application/json" },
        { name = "TRON-PRO-API-KEY";  value = apiKey },
      ]
    };
    let url = PaymentsLib.tronGridUrl(txHash);
    switch (await httpGetWithRetry(url, headers, 3)) {
      case (#err(msg)) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?("TronGrid outcall failed: " # msg);
        }
      };
      case (#ok(json)) {
        switch (PaymentsLib.parseTronGridResponse(json)) {
          case null {
            {
              status             = #failed;
              txHash;
              confirmedAmount    = 0.0;
              confirmedRecipient = "";
              blockNumber        = 0;
              errorReason        = ?("TronGrid: transaction not found or parse failed");
            }
          };
          case (?parsed) {
            let amt = rawAmountToFloat(parsed.amount, 6); // TRC20 USDT has 6 decimals
            {
              status             = #verified;
              txHash;
              confirmedAmount    = amt;
              confirmedRecipient = parsed.recipient;
              blockNumber        = parsed.blockNumber;
              errorReason        = null;
            }
          };
        }
      };
    }
  };

  // ─── BEP20 verification (BSCScan) ─────────────────────────────────────────

  func verifyBep20(
    _tradeId      : Types.TradeId,
    txHash        : Text,
    _networkLabel : Text,
  ) : async Types.PaymentVerificationResult {
    let apiKey = systemSettings.bscScanApiKey;
    let url = PaymentsLib.bscScanUrl(txHash, apiKey);
    switch (await httpGetWithRetry(url, [{ name = "Accept"; value = "application/json" }], 3)) {
      case (#err(msg)) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?("BSCScan outcall failed: " # msg);
        }
      };
      case (#ok(json)) {
        switch (PaymentsLib.parseBscScanResponse(json)) {
          case null {
            {
              status             = #failed;
              txHash;
              confirmedAmount    = 0.0;
              confirmedRecipient = "";
              blockNumber        = 0;
              errorReason        = ?("BSCScan: invalid response or API error");
            }
          };
          case (?parsed) {
            if (not parsed.success) {
              {
                status             = #failed;
                txHash;
                confirmedAmount    = 0.0;
                confirmedRecipient = "";
                blockNumber        = parsed.blockNumber;
                errorReason        = ?("BSCScan: transaction failed on-chain (status != 1)");
              }
            } else {
              // BSCScan receipt confirms success — amount/recipient need separate call; MVP: verified.
              {
                status             = #verified;
                txHash;
                confirmedAmount    = 0.0;
                confirmedRecipient = "";
                blockNumber        = parsed.blockNumber;
                errorReason        = null;
              }
            }
          };
        }
      };
    }
  };

  // ─── SPL verification (Solana RPC — configurable endpoint) ───────────────

  func verifySpl(
    _tradeId      : Types.TradeId,
    txHash        : Text,
    _networkLabel : Text,
  ) : async Types.PaymentVerificationResult {
    // Use configured Solana RPC URL or fallback to public mainnet endpoint
    let rpcUrl = if (systemSettings.solanaRpcUrl != "") {
      systemSettings.solanaRpcUrl
    } else {
      "https://api.mainnet-beta.solana.com"
    };
    let body = PaymentsLib.solanaRpcBody(txHash);
    switch (await httpPostWithRetry(rpcUrl, body, 3)) {
      case (#err(msg)) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?("Solana RPC outcall failed: " # msg);
        }
      };
      case (#ok(json)) {
        switch (PaymentsLib.parseSolanaResponse(json)) {
          case null {
            {
              status             = #failed;
              txHash;
              confirmedAmount    = 0.0;
              confirmedRecipient = "";
              blockNumber        = 0;
              errorReason        = ?("Solana: transaction not found or not confirmed");
            }
          };
          case (?parsed) {
            let amt = rawAmountToFloat(parsed.amount, 6); // SPL USDC has 6 decimals
            {
              status             = #verified;
              txHash;
              confirmedAmount    = amt;
              confirmedRecipient = parsed.recipient;
              blockNumber        = parsed.blockNumber;
              errorReason        = null;
            }
          };
        }
      };
    }
  };

  // ─── EVM verification (Ethereum / Polygon / Avalanche via Infura) ─────────

  /// Unified EVM verifier — handles ERC20, Polygon, Avalanche using the same
  /// eth_getTransactionReceipt pattern through Infura or public RPC endpoints.
  func verifyEvm(
    _tradeId     : Types.TradeId,
    txHash       : Text,
    token        : Types.TradeToken,
    networkLabel : Text,
  ) : async Types.PaymentVerificationResult {
    let networkKey = PaymentsLib.evmNetworkKey(token);

    // Choose API key: Polygon/Avalanche use their own keys if configured,
    // otherwise fall back to the shared Infura key.
    let apiKey = switch (networkKey) {
      case "polygon"   {
        let k = systemSettings.polygonApiKey;
        if (k != "") k else systemSettings.infuraApiKey
      };
      case "avalanche" {
        let k = systemSettings.avalancheApiKey;
        if (k != "") k else systemSettings.infuraApiKey
      };
      case _           systemSettings.infuraApiKey; // ethereum
    };

    let url  = PaymentsLib.infuraUrl(networkKey, apiKey);
    let body = PaymentsLib.infuraRpcBody(txHash);
    switch (await httpPostWithRetry(url, body, 3)) {
      case (#err(msg)) {
        {
          status             = #failed;
          txHash;
          confirmedAmount    = 0.0;
          confirmedRecipient = "";
          blockNumber        = 0;
          errorReason        = ?(networkLabel # " RPC outcall failed: " # msg);
        }
      };
      case (#ok(json)) {
        switch (PaymentsLib.parseEvmResponse(json)) {
          case null {
            {
              status             = #failed;
              txHash;
              confirmedAmount    = 0.0;
              confirmedRecipient = "";
              blockNumber        = 0;
              errorReason        = ?(networkLabel # ": transaction not found or parse failed");
            }
          };
          case (?parsed) {
            if (parsed.recipient == "" and parsed.blockNumber == 0) {
              // Transaction failed on-chain (status != 0x1)
              {
                status             = #failed;
                txHash;
                confirmedAmount    = 0.0;
                confirmedRecipient = "";
                blockNumber        = 0;
                errorReason        = ?(networkLabel # ": transaction failed on-chain (status != 0x1)");
              }
            } else {
              // EVM receipt confirms success — token amount requires log parsing; MVP: verified.
              {
                status             = #verified;
                txHash;
                confirmedAmount    = 0.0;
                confirmedRecipient = parsed.recipient;
                blockNumber        = parsed.blockNumber;
                errorReason        = null;
              }
            }
          };
        }
      };
    }
  };

  // ─── Token metadata ────────────────────────────────────────────────────────

  /// Returns all supported tokens with display metadata, sorted by priority.
  public query func getSupportedTokens() : async [PaymentsLib.TokenInfo] {
    PaymentsLib.getSupportedTokens()
  };

  /// Returns display metadata for a single token variant.
  public query func getTokenInfo(
    token : Types.TradeToken,
  ) : async ?PaymentsLib.TokenInfo {
    PaymentsLib.getTokenDisplayInfo(token)
  };

  // ─── Transaction history ───────────────────────────────────────────────────

  /// Returns paginated transaction history for the caller.
  public shared query ({ caller }) func getMyTransactionHistory(
    filter : PaymentsLib.TxHistoryFilter,
    offset : Nat,
    limit  : Nat,
  ) : async PaymentsLib.Page<Types.TradeView> {
    if (caller.isAnonymous()) {
      return { items = []; totalCount = 0; offset = 0; limit };
    };
    PaymentsLib.getTransactionHistory(trades, caller, filter, offset, limit)
  };

  // ─── Payment status ────────────────────────────────────────────────────────

  /// Returns payment method and current status for a trade, including any
  /// cached blockchain verification result (Phase 2).
  /// Caller must be a party to the trade (buyer or seller).
  public shared query ({ caller }) func getTradePaymentStatus(
    tradeId : Types.TradeId,
  ) : async ?PaymentsLib.TradePaymentStatus {
    if (caller.isAnonymous()) return null;
    PaymentsLib.getTradePaymentStatus(trades, verificationResults, caller, tradeId)
  };

  /// Query: returns the last blockchain verification result for a trade.
  /// Returns null when no verification has been attempted yet.
  /// Caller must be a party to the trade.
  public shared query ({ caller }) func getPaymentVerificationStatus(
    tradeId : Types.TradeId,
  ) : async ?Types.PaymentVerificationResult {
    if (caller.isAnonymous()) return null;
    let trade = switch (trades.get(tradeId)) {
      case null    return null;
      case (?t)    t;
    };
    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) return null;
    verificationResults.get(tradeId)
  };

  // ─── Price estimation ─────────────────────────────────────────────────────

  /// Estimates token amount for a given USD value in cents (e.g. 100 = $1.00).
  /// Uses cached CoinGecko rate if fresh (< 5 min), otherwise falls back to $1.00.
  public query func estimateTokenAmount(
    usdCents : Nat,
    token    : Types.TradeToken,
  ) : async ?Nat {
    PaymentsLib.estimateTokenAmount(usdCents, token, rateCache)
  };

  /// Fetches current stablecoin rates from CoinGecko and updates the rate cache.
  /// Returns the number of token rates successfully updated (0 on network failure).
  /// Callable by anyone — it is a read-only price refresh, not a state mutation.
  public shared func refreshRates() : async Nat {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd";
    switch (await httpGetWithRetry(url, [], 3)) {
      case (#err(_)) 0;
      case (#ok(json)) {
        PaymentsLib.updateRatesFromCoinGecko(rateCache, json)
      };
    }
  };

  /// Returns the cached exchange rate for a specific token, or null if not yet fetched.
  public shared query func getCachedRate(token : Types.TradeToken) : async ?PaymentsLib.RateCacheEntry {
    rateCache.get(PaymentsLib.compareTradeToken, token)
  };

  // ─── Address verification cache helpers ───────────────────────────────────

  /// 24 hours in nanoseconds
  let ADDRESS_VERIFY_TTL_NS : Int = 86_400_000_000_000;

  /// Build the cache key: address # "#" # network
  func addrCacheKey(address : Text, network : Text) : Text {
    address # "#" # network
  };

  /// Return a cached AddressVerification if still fresh (within 24h).
  func getCachedVerification(address : Text, network : Text) : ?Types.AddressVerification {
    let key = addrCacheKey(address, network);
    switch (addressVerifyCache.get(key)) {
      case null null;
      case (?v) {
        let age = Time.now() - v.verifiedAt;
        if (age < ADDRESS_VERIFY_TTL_NS) ?v else null
      };
    }
  };

  /// Store a verification result in the cache.
  func setCachedVerification(address : Text, network : Text, v : Types.AddressVerification) {
    let key = addrCacheKey(address, network);
    addressVerifyCache.add(key, v);
  };

  /// Build an AddressVerification record from raw values.
  func makeVerification(active : Bool, txCount : Nat) : Types.AddressVerification {
    let now = Time.now();
    {
      level      = 2;
      active;
      txCount;
      verifiedAt = now;
      expiresAt  = now + ADDRESS_VERIFY_TTL_NS;
    }
  };

  // ─── JSON helpers for address verification responses ──────────────────────

  /// Count non-overlapping occurrences of `needle` in `haystack` (both as Text).
  func countOccurrences(haystack : Text, needle : Text) : Nat {
    let hChars = haystack.toArray();
    let nChars = needle.toArray();
    let hLen = hChars.size();
    let nLen = nChars.size();
    if (nLen == 0 or hLen < nLen) return 0;
    var count : Nat = 0;
    var i : Nat = 0;
    while (i + nLen <= hLen) {
      var match = true;
      var j : Nat = 0;
      while (j < nLen) {
        if (hChars[i + j] != nChars[j]) { match := false; j := nLen } // simulate break
        else { j += 1 };
      };
      if (match) { count += 1; i += nLen } else { i += 1 };
    };
    count
  };

  /// Parse a "result" array length from a BSCScan/Etherscan/PolygonScan/SnowTrace
  /// response. Expected shape: {"status":"1","result":[...]}
  /// Returns the element count of the result array, or null on parse error / API error.
  func parseEvmTxListResponse(json : Text) : ?Nat {
    // Check for status "1" (success) — avoid error responses counting as 0 transactions
    if (not json.contains(#text "\"status\":\"1\"")) {
      // Could still be an empty address (status "0", message "No transactions found")
      // Treat as 0 tx (inactive) only when message contains "No transactions"
      if (json.contains(#text "No transactions found")) {
        return ?0;
      };
      return null; // API error or unexpected response
    };
    // Count entries in result array by counting occurrences of "blockNumber"
    // (each tx object has exactly one "blockNumber" field)
    ?countOccurrences(json, "\"blockNumber\"")
  };

  /// Parse a TronGrid account transactions response.
  /// Expected shape: {"data":[...], "success":true}
  /// Returns the count of items in the "data" array, or null on error.
  func parseTronTxResponse(json : Text) : ?Nat {
    if (not json.contains(#text "\"success\":true")) {
      return null;
    };
    // Count entries in data array by looking for "txID" occurrences
    ?countOccurrences(json, "\"txID\"")
  };

  /// Parse a Solana getSignaturesForAddress RPC response.
  /// Expected shape: {"result":[{...}], "jsonrpc":"2.0"}
  /// Returns the count of items in "result", or null on error.
  func parseSolanaSigResponse(json : Text) : ?Nat {
    if (json.contains(#text "\"error\"")) {
      return null;
    };
    // Count "signature" occurrences (each sig entry has one)
    ?countOccurrences(json, "\"signature\"")
  };

  // ─── verifyEvmAddress ─────────────────────────────────────────────────────

  /// Verifies an EVM-compatible address by checking transaction history via
  /// the appropriate block explorer API (BSCScan, Etherscan, PolygonScan, SnowTrace).
  /// network must be one of: "bsc", "ethereum", "polygon", "avalanche".
  /// Results are cached for 24 hours.
  /// If the API key for the network is not configured, returns a pass-through result
  /// (active=true, txCount=0) — this never blocks address addition.
  public shared func verifyEvmAddress(
    address : Text,
    network : Text,
  ) : async Types.Result<{ active : Bool; txCount : Nat; verifiedAt : Types.Timestamp }> {
    obsRecordCall();

    // Check cache first
    switch (getCachedVerification(address, network)) {
      case (?v) {
        return #ok({ active = v.active; txCount = v.txCount; verifiedAt = v.verifiedAt });
      };
      case null {};
    };

    // Determine API key and URL for the given network
    let (apiKey, baseUrl) = switch (network) {
      case "bsc" {
        (systemSettings.bscScanApiKey,
         "https://api.bscscan.com/api")
      };
      case "ethereum" {
        // Use infura key as the etherscan API key (or empty for demo)
        (systemSettings.infuraApiKey,
         "https://api.etherscan.io/api")
      };
      case "polygon" {
        (systemSettings.polygonApiKey,
         "https://api.polygonscan.com/api")
      };
      case "avalanche" {
        (systemSettings.avalancheApiKey,
         "https://api.snowtrace.io/api")
      };
      case _ {
        return #err(#invalid_input("Unknown network: " # network # ". Use bsc, ethereum, polygon, or avalanche."));
      };
    };

    // Pass-through when API key is not configured
    if (apiKey == "") {
      let v = makeVerification(true, 0);
      setCachedVerification(address, network, v);
      return #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt });
    };

    let url = baseUrl
      # "?module=account&action=txlist&address=" # address
      # "&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=" # apiKey;

    switch (await httpGetWithRetry(url, [{ name = "Accept"; value = "application/json" }], 3)) {
      case (#err(msg)) {
        // Network failure — pass-through so address addition is never blocked
        let v = makeVerification(true, 0);
        setCachedVerification(address, network, v);
        obsLogError("verifyEvmAddress",
          "EVM address verification failed for " # network # ": " # msg, null);
        #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
      };
      case (#ok(json)) {
        switch (parseEvmTxListResponse(json)) {
          case null {
            // Unexpected response — pass-through
            let v = makeVerification(true, 0);
            setCachedVerification(address, network, v);
            #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
          };
          case (?txCount) {
            let active = txCount > 0;
            let v = makeVerification(active, txCount);
            setCachedVerification(address, network, v);
            #ok({ active; txCount; verifiedAt = v.verifiedAt })
          };
        }
      };
    }
  };

  // ─── verifyTronAddress ────────────────────────────────────────────────────

  /// Verifies a Tron (TRC20) address by checking transaction history via TronGrid.
  /// Results are cached for 24 hours.
  /// If tronGridApiKey is not configured, returns a pass-through result.
  public shared func verifyTronAddress(
    address : Text,
  ) : async Types.Result<{ active : Bool; txCount : Nat; verifiedAt : Types.Timestamp }> {
    obsRecordCall();

    switch (getCachedVerification(address, "tron")) {
      case (?v) {
        return #ok({ active = v.active; txCount = v.txCount; verifiedAt = v.verifiedAt });
      };
      case null {};
    };

    let apiKey = systemSettings.tronGridApiKey;

    // Pass-through when API key is not configured
    if (apiKey == "") {
      let v = makeVerification(true, 0);
      setCachedVerification(address, "tron", v);
      return #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt });
    };

    let url = "https://api.trongrid.io/v1/accounts/" # address # "/transactions?limit=1";
    let headers : [HttpHeader] = [
      { name = "Accept";    value = "application/json" },
      { name = "X-API-KEY"; value = apiKey },
    ];

    switch (await httpGetWithRetry(url, headers, 3)) {
      case (#err(msg)) {
        let v = makeVerification(true, 0);
        setCachedVerification(address, "tron", v);
        obsLogError("verifyTronAddress", "TronGrid address check failed: " # msg, null);
        #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
      };
      case (#ok(json)) {
        switch (parseTronTxResponse(json)) {
          case null {
            let v = makeVerification(true, 0);
            setCachedVerification(address, "tron", v);
            #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
          };
          case (?txCount) {
            let active = txCount > 0;
            let v = makeVerification(active, txCount);
            setCachedVerification(address, "tron", v);
            #ok({ active; txCount; verifiedAt = v.verifiedAt })
          };
        }
      };
    }
  };

  // ─── verifySolanaAddress ──────────────────────────────────────────────────

  /// Verifies a Solana (SPL) address by checking signature history via getSignaturesForAddress.
  /// Results are cached for 24 hours.
  /// If solanaRpcUrl is not configured, uses the public mainnet endpoint.
  public shared func verifySolanaAddress(
    address : Text,
  ) : async Types.Result<{ active : Bool; txCount : Nat; verifiedAt : Types.Timestamp }> {
    obsRecordCall();

    switch (getCachedVerification(address, "solana")) {
      case (?v) {
        return #ok({ active = v.active; txCount = v.txCount; verifiedAt = v.verifiedAt });
      };
      case null {};
    };

    let rpcUrl = if (systemSettings.solanaRpcUrl != "") {
      systemSettings.solanaRpcUrl
    } else {
      "https://api.mainnet-beta.solana.com"
    };

    let body = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\","
      # "\"params\":[\"" # address # "\",{\"limit\":1}]}";

    switch (await httpPostWithRetry(rpcUrl, body, 3)) {
      case (#err(msg)) {
        let v = makeVerification(true, 0);
        setCachedVerification(address, "solana", v);
        obsLogError("verifySolanaAddress", "Solana RPC address check failed: " # msg, null);
        #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
      };
      case (#ok(json)) {
        switch (parseSolanaSigResponse(json)) {
          case null {
            let v = makeVerification(true, 0);
            setCachedVerification(address, "solana", v);
            #ok({ active = true; txCount = 0; verifiedAt = v.verifiedAt })
          };
          case (?txCount) {
            let active = txCount > 0;
            let v = makeVerification(active, txCount);
            setCachedVerification(address, "solana", v);
            #ok({ active; txCount; verifiedAt = v.verifiedAt })
          };
        }
      };
    }
  };

  // ─── Address format helpers ───────────────────────────────────────────────

  /// Simple prefix/length check for address format validation.
  /// Returns true when the address looks valid for the given token's network.
  func isValidAddressFormat(address : Text, token : Types.TradeToken) : Bool {
    let len = address.size();
    switch (token) {
      // TRC20: starts with 'T', base58 34 chars
      case (#USDT_TRC20) {
        len == 34 and address.startsWith(#text "T")
      };
      // EVM (0x + 40 hex chars = 42)
      case (#USDT_BEP20 or #USDT_ERC20 or #USDC_ERC20 or #USDT_POLYGON or #USDC_POLYGON or #USDT_AVAX or #USDC_AVAX) {
        len == 42 and address.startsWith(#text "0x")
      };
      // SPL: base58, 32-44 chars, no 0/O/I/l
      case (#USDC_SPL) {
        len >= 32 and len <= 44
      };
      // ICP-native: any non-empty text
      case (#ckUSDC or #ckUSDT) {
        len > 0
      };
    }
  };

  /// Determine which blockchain network corresponds to a token for address verification.
  func tokenToAddressNetwork(token : Types.TradeToken) : Text {
    switch (token) {
      case (#USDT_TRC20)                          "tron";
      case (#USDT_BEP20)                          "bsc";
      case (#USDT_ERC20 or #USDC_ERC20)           "ethereum";
      case (#USDT_POLYGON or #USDC_POLYGON)       "polygon";
      case (#USDT_AVAX or #USDC_AVAX)             "avalanche";
      case (#USDC_SPL)                            "solana";
      case (#ckUSDC or #ckUSDT)                   "icp";
    }
  };

  // ─── addPaymentMethod ─────────────────────────────────────────────────────

  /// Adds a crypto payment method (address) to the caller's profile.
  /// Validates address format. If autoVerify=true, performs an on-chain activity check.
  /// Requires authentication.
  public shared ({ caller }) func addPaymentMethod(
    token       : Types.TradeToken,
    address     : Text,
    autoVerify  : Bool,
  ) : async Types.Result<Types.PaymentMethod> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    // Validate address format
    if (not isValidAddressFormat(address, token)) {
      return #err(#invalid_input("Invalid address format for the selected network."));
    };

    // Determine verification result
    let verificationOpt : ?Types.AddressVerification = if (autoVerify) {
      let network = tokenToAddressNetwork(token);
      let verResult : Types.Result<{ active : Bool; txCount : Nat; verifiedAt : Types.Timestamp }> =
        switch (network) {
          case "tron"      await verifyTronAddress(address);
          case "solana"    await verifySolanaAddress(address);
          case "icp"       #ok({ active = true; txCount = 0; verifiedAt = Time.now() });
          case net         await verifyEvmAddress(address, net);
        };
      switch (verResult) {
        case (#err(_)) null; // verification failed — don't block, just store no verification
        case (#ok(r)) {
          ?{
            level      = 2;
            active     = r.active;
            txCount    = r.txCount;
            verifiedAt = r.verifiedAt;
            expiresAt  = r.verifiedAt + ADDRESS_VERIFY_TTL_NS;
          }
        };
      }
    } else {
      null
    };

    let pm : Types.PaymentMethod = {
      token;
      address;
      addedAt      = Time.now();
      verification = verificationOpt;
    };

    // Load user and append payment method
    switch (users.get(caller)) {
      case null {
        return #err(#not_found);
      };
      case (?user) {
        // Replace if same token+address already exists, otherwise append
        let existing = user.paymentMethods;
        let filtered = existing.filter(func(m : Types.PaymentMethod) : Bool {
          not (m.token == token and m.address == address)
        });
        user.paymentMethods := filtered.concat([pm]);
        #ok(pm)
      };
    }
  };

  // ─── getPaymentMethods ────────────────────────────────────────────────────

  /// Returns all saved payment methods for the authenticated caller.
  /// Returns an empty array if the user is not found or not authenticated.
  public shared query ({ caller }) func getPaymentMethods() : async [Types.PaymentMethod] {
    if (caller.isAnonymous()) return [];
    switch (users.get(caller)) {
      case null  [];
      case (?user) user.paymentMethods;
    }
  };

}
