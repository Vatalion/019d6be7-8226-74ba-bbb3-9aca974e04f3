import Map "mo:core/Map";
import Queue "mo:core/Queue";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types";
import Admin "Admin";

/// Payments — pure stateless domain logic for token metadata, amount formatting,
/// validation, transaction history queries, and Phase-2 payment verification helpers.
module {

  // ─── Token metadata ────────────────────────────────────────────────────────

  public type TokenNetwork = {
    #internet_computer;
    #tron;
    #bsc;
    #solana;
    #ethereum;
    #polygon;
    #avalanche;
  };

  public type TokenInfo = {
    token    : Types.TradeToken;
    symbol   : Text;
    name     : Text;
    network  : Text;          // human-readable network label
    decimals : Nat;
    priority : Nat;           // 1 = highest display priority
    isNative : Bool;          // true = ICP-native (ck* tokens), false = external
  };

  // Static metadata for all supported stablecoin tokens. Priority order matches UX spec.
  public let TOKEN_METADATA : [TokenInfo] = [
    {
      token    = #ckUSDC;
      symbol   = "ckUSDC";
      name     = "USD Coin (ICP-native)";
      network  = "Internet Computer";
      decimals = 6;
      priority = 1;
      isNative = true;
    },
    {
      token    = #ckUSDT;
      symbol   = "ckUSDT";
      name     = "Tether USD (ICP-native)";
      network  = "Internet Computer";
      decimals = 6;
      priority = 2;
      isNative = true;
    },
    {
      token    = #USDT_TRC20;
      symbol   = "USDT";
      name     = "Tether USD (TRC-20)";
      network  = "Tron";
      decimals = 6;
      priority = 3;
      isNative = false;
    },
    {
      token    = #USDT_BEP20;
      symbol   = "USDT";
      name     = "Tether USD (BEP-20)";
      network  = "BNB Smart Chain";
      decimals = 18;
      priority = 4;
      isNative = false;
    },
    {
      token    = #USDC_SPL;
      symbol   = "USDC";
      name     = "USD Coin (SPL)";
      network  = "Solana";
      decimals = 6;
      priority = 5;
      isNative = false;
    },
    {
      token    = #USDT_ERC20;
      symbol   = "USDT";
      name     = "Tether USD (ERC-20)";
      network  = "Ethereum";
      decimals = 6;
      priority = 6;
      isNative = false;
    },
    {
      token    = #USDC_ERC20;
      symbol   = "USDC";
      name     = "USD Coin (ERC-20)";
      network  = "Ethereum";
      decimals = 6;
      priority = 7;
      isNative = false;
    },
    {
      token    = #USDT_POLYGON;
      symbol   = "USDT";
      name     = "Tether USD (Polygon)";
      network  = "Polygon";
      decimals = 6;
      priority = 8;
      isNative = false;
    },
    {
      token    = #USDC_POLYGON;
      symbol   = "USDC";
      name     = "USD Coin (Polygon)";
      network  = "Polygon";
      decimals = 6;
      priority = 9;
      isNative = false;
    },
    {
      token    = #USDT_AVAX;
      symbol   = "USDT";
      name     = "Tether USD (Avalanche)";
      network  = "Avalanche";
      decimals = 6;
      priority = 10;
      isNative = false;
    },
    {
      token    = #USDC_AVAX;
      symbol   = "USDC";
      name     = "USD Coin (Avalanche)";
      network  = "Avalanche";
      decimals = 6;
      priority = 11;
      isNative = false;
    },
  ];

  // ─── Token queries ─────────────────────────────────────────────────────────

  /// Returns all supported tokens sorted by priority (ascending).
  public func getSupportedTokens() : [TokenInfo] {
    TOKEN_METADATA
  };

  /// Returns metadata for a specific token variant, or null if unknown.
  public func getTokenDisplayInfo(token : Types.TradeToken) : ?TokenInfo {
    TOKEN_METADATA.find(func(info : TokenInfo) : Bool {
      switch (info.token, token) {
        case (#ckUSDC,       #ckUSDC)       true;
        case (#ckUSDT,       #ckUSDT)       true;
        case (#USDT_TRC20,   #USDT_TRC20)   true;
        case (#USDT_BEP20,   #USDT_BEP20)   true;
        case (#USDC_SPL,     #USDC_SPL)     true;
        case (#USDT_ERC20,   #USDT_ERC20)   true;
        case (#USDC_ERC20,   #USDC_ERC20)   true;
        case (#USDT_POLYGON, #USDT_POLYGON) true;
        case (#USDC_POLYGON, #USDC_POLYGON) true;
        case (#USDT_AVAX,    #USDT_AVAX)    true;
        case (#USDC_AVAX,    #USDC_AVAX)    true;
        case (_,             _)             false;
      };
    })
  };

  // ─── Amount formatting ─────────────────────────────────────────────────────

  /// Formats a raw Nat amount into a human-readable decimal string.
  /// e.g. formatAmount(1_000_000, 6) → "1.000000"
  ///      formatAmount(100_000_000, 8) → "1.00000000"
  public func formatAmount(amount : Nat, decimals : Nat) : Text {
    if (decimals == 0) {
      return amount.toText();
    };

    // Build 10^decimals divisor
    var divisor : Nat = 1;
    var i = 0;
    while (i < decimals) {
      divisor := divisor * 10;
      i += 1;
    };

    let whole    = amount / divisor;
    let fraction = amount % divisor;

    // Pad fraction with leading zeros to `decimals` width
    let fracText  = fraction.toText();
    var padded    = fracText;
    var padNeeded = decimals;
    if (fracText.size() < padNeeded) {
      padNeeded := padNeeded - fracText.size();
      var padding = "";
      var p = 0;
      while (p < padNeeded) {
        padding := "0" # padding;
        p += 1;
      };
      padded := padding # fracText;
    };

    whole.toText() # "." # padded
  };

  /// Formats amount using the token's native decimals.
  public func formatTokenAmount(amount : Nat, token : Types.TradeToken) : Text {
    let decimals = switch (getTokenDisplayInfo(token)) {
      case (?info) info.decimals;
      case null    8; // safe fallback
    };
    formatAmount(amount, decimals)
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  /// Returns #ok(()) when the amount is valid: > 0 and >= minTradeAmount.
  /// minTradeAmount is expressed in the token's smallest unit.
  public func validatePaymentAmount(
    amount         : Nat,
    minTradeAmount : Nat,
  ) : Types.Result<()> {
    if (amount == 0) {
      return #err(#invalid_input("amount must be greater than zero"));
    };
    if (amount < minTradeAmount) {
      return #err(#invalid_input(
        "amount " # amount.toText() # " is below minimum trade amount " # minTradeAmount.toText()
      ));
    };
    #ok(())
  };

  // ─── Transaction history ───────────────────────────────────────────────────

  public type TxHistoryFilter = {
    token  : ?Types.TradeToken;
    status : ?Types.TradeStatus;
    from   : ?Types.Timestamp;   // inclusive lower bound
    to     : ?Types.Timestamp;   // inclusive upper bound
  };

  public type Page<T> = {
    items      : [T];
    totalCount : Nat;
    offset     : Nat;
    limit      : Nat;
  };

  func tokensMatch(a : Types.TradeToken, b : Types.TradeToken) : Bool {
    switch (a, b) {
      case (#ckUSDC,       #ckUSDC)       true;
      case (#ckUSDT,       #ckUSDT)       true;
      case (#USDT_TRC20,   #USDT_TRC20)   true;
      case (#USDT_BEP20,   #USDT_BEP20)   true;
      case (#USDC_SPL,     #USDC_SPL)     true;
      case (#USDT_ERC20,   #USDT_ERC20)   true;
      case (#USDC_ERC20,   #USDC_ERC20)   true;
      case (#USDT_POLYGON, #USDT_POLYGON) true;
      case (#USDC_POLYGON, #USDC_POLYGON) true;
      case (#USDT_AVAX,    #USDT_AVAX)    true;
      case (#USDC_AVAX,    #USDC_AVAX)    true;
      case (_,             _)             false;
    }
  };

  func statusesMatch(a : Types.TradeStatus, b : Types.TradeStatus) : Bool {
    switch (a, b) {
      case (#pending,          #pending)          true;
      case (#funded,           #funded)           true;
      case (#buyer_confirmed,  #buyer_confirmed)  true;
      case (#payment_verified, #payment_verified) true;
      case (#complete,         #complete)         true;
      case (#refunded,         #refunded)         true;
      case (#disputed,         #disputed)         true;
      case (#cancelled,        #cancelled)        true;
      case (_,                 _)                 false;
    }
  };

  /// Returns paginated trade history for a user (as buyer or seller).
  /// Filters by token, status, and optional date range.
  public func getTransactionHistory(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    filter  : TxHistoryFilter,
    offset  : Nat,
    limit   : Nat,
  ) : Page<Types.TradeView> {
    // Collect all trades for this user matching the filter
    let matched = trades.values().filter(func(t : Types.Trade) : Bool {
      // Must be a party
      let isParty = Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller);
      if (not isParty) return false;

      // Token filter
      let tokenOk = switch (filter.token) {
        case null    true;
        case (?tok)  tokensMatch(t.token, tok);
      };
      if (not tokenOk) return false;

      // Status filter
      let statusOk = switch (filter.status) {
        case null    true;
        case (?st)   statusesMatch(t.status, st);
      };
      if (not statusOk) return false;

      // Date range filter (on createdAt)
      let fromOk = switch (filter.from) {
        case null    true;
        case (?from) t.createdAt >= from;
      };
      if (not fromOk) return false;

      let toOk = switch (filter.to) {
        case null  true;
        case (?to) t.createdAt <= to;
      };
      toOk
    });

    let all        = matched.map(func(t : Types.Trade) : Types.TradeView {
      {
        id                  = t.id;
        listing             = t.listing;
        buyer               = t.buyer;
        seller              = t.seller;
        amount              = t.amount;
        token               = t.token;
        status              = t.status;
        createdAt           = t.createdAt;
        fundedAt            = t.fundedAt;
        confirmedAt         = t.confirmedAt;
        completedAt         = t.completedAt;
        refundDeadline      = t.refundDeadline;
        escrowAccount       = t.escrowAccount;
        shippingSelection   = t.shippingSelection;
        ttnNumber           = t.ttnNumber;
        ttnCreationStatus   = t.ttnCreationStatus;
        digitalDelivery     = t.digitalDelivery;
      }
    }).toArray();
    let totalCount = all.size();

    // Apply pagination
    let safeOffset = if (offset >= totalCount) totalCount else offset;
    let end        = Nat.min(safeOffset + limit, totalCount);
    let items      = all.sliceToArray(safeOffset, end);

    { items; totalCount; offset = safeOffset; limit }
  };

  // ─── Price oracle cache ────────────────────────────────────────────────────

  /// Price oracle cache entry. Stored in a Map keyed by TradeToken.
  public type RateCacheEntry = {
    rateInCents : Nat;   // USD per 1 token unit, scaled by 100 (e.g. 100 = $1.00)
    fetchedAt   : Int;   // timestamp in nanoseconds (Time.now())
  };

  /// Maps our TradeToken variants to CoinGecko coin IDs.
  func coinGeckoId(token : Types.TradeToken) : Text {
    switch (token) {
      case (#ckUSDC)       "usd-coin";
      case (#USDC_SPL)     "usd-coin";
      case (#USDC_ERC20)   "usd-coin";
      case (#USDC_POLYGON) "usd-coin";
      case (#USDC_AVAX)    "usd-coin";
      case (#ckUSDT)       "tether";
      case (#USDT_TRC20)   "tether";
      case (#USDT_BEP20)   "tether";
      case (#USDT_ERC20)   "tether";
      case (#USDT_POLYGON) "tether";
      case (#USDT_AVAX)    "tether";
    }
  };

  /// Compare function for TradeToken — required for Map.Map<TradeToken, _>.
  /// Converts each variant to a stable Nat index for ordering.
  public func compareTradeToken(a : Types.TradeToken, b : Types.TradeToken) : { #less; #equal; #greater } {
    func rank(t : Types.TradeToken) : Nat {
      switch (t) {
        case (#ckUSDC)       0;
        case (#ckUSDT)       1;
        case (#USDT_TRC20)   2;
        case (#USDT_BEP20)   3;
        case (#USDC_SPL)     4;
        case (#USDT_ERC20)   5;
        case (#USDC_ERC20)   6;
        case (#USDT_POLYGON) 7;
        case (#USDC_POLYGON) 8;
        case (#USDT_AVAX)    9;
        case (#USDC_AVAX)    10;
      }
    };
    let ra = rank(a);
    let rb = rank(b);
    if (ra < rb) #less
    else if (ra > rb) #greater
    else #equal
  };

  // ─── Price estimation ──────────────────────────────────────────────────────

  /// Returns an estimated token amount for a given USD value.
  /// Uses cached CoinGecko rate if fresh (< 5 min), otherwise falls back to $1.00.
  /// usdCents is in cents (e.g. 100 = $1.00).
  public func estimateTokenAmount(
    usdCents  : Nat,
    token     : Types.TradeToken,
    rateCache : Map.Map<Types.TradeToken, RateCacheEntry>,
  ) : ?Nat {
    let info = switch (getTokenDisplayInfo(token)) {
      case null    return null;
      case (?info) info;
    };

    let rateInCents : Nat = switch (rateCache.get(compareTradeToken, token)) {
      case null 100; // no cache → fallback $1.00
      case (?entry) {
        let ageNs : Int = Time.now() - entry.fetchedAt;
        let fiveMinNs : Int = 300_000_000_000;
        if (ageNs < fiveMinNs) entry.rateInCents else 100
      };
    };

    var multiplier : Nat = 1;
    var d = 0;
    while (d < info.decimals) {
      multiplier := multiplier * 10;
      d += 1;
    };
    ?( (usdCents * multiplier) / rateInCents )
  };

  /// Parse CoinGecko simple/price JSON and update the rate cache.
  /// Expected JSON: {"tether":{"usd":0.9994},"usd-coin":{"usd":1.0}}
  /// Returns the number of token rates successfully updated.
  public func updateRatesFromCoinGecko(
    rateCache : Map.Map<Types.TradeToken, RateCacheEntry>,
    json      : Text,
  ) : Nat {
    var updated = 0;
    let now = Time.now();
    let tokens : [Types.TradeToken] = [
      #ckUSDC, #ckUSDT, #USDT_TRC20, #USDT_BEP20, #USDC_SPL,
      #USDT_ERC20, #USDC_ERC20, #USDT_POLYGON, #USDC_POLYGON, #USDT_AVAX, #USDC_AVAX
    ];
    for (token in tokens.vals()) {
      let id = coinGeckoId(token);
      let searchPrefix = "\"" # id # "\":{\"usd\":";
      switch (extractRateCents(json, searchPrefix)) {
        case null {};
        case (?rateInCents) {
          rateCache.add(compareTradeToken, token, { rateInCents; fetchedAt = now });
          updated += 1;
        };
      };
    };
    updated
  };

  /// Find prefix in text, extract the decimal number immediately following it,
  /// and return it directly as cents (Nat). Avoids Float.fromText uncertainty.
  /// Reads up to 3 decimal places, rounding the 3rd digit.
  /// Returns null if prefix not found or parsed value is 0.
  func extractRateCents(text : Text, prefix : Text) : ?Nat {
    let prefixChars = prefix.toArray();
    let textChars   = text.toArray();
    let prefixLen   = prefixChars.size();
    let textLen     = textChars.size();
    if (textLen < prefixLen) return null;

    // Search for prefix start index
    var i = 0;
    var found = false;
    var foundAt = 0;
    label searchLoop while (i <= textLen - prefixLen) {
      var match = true;
      var j = 0;
      label matchLoop while (j < prefixLen) {
        if (textChars[i + j] != prefixChars[j]) {
          match := false;
          j := prefixLen; // break inner
        };
        j += 1;
      };
      if (match) {
        found   := true;
        foundAt := i;
        i := textLen; // break outer
      };
      i += 1;
    };
    if (not found) return null;

    // Parse number starting immediately after prefix
    var pos        = foundAt + prefixLen;
    var intPart    : Nat = 0;
    var fracPart   : Nat = 0;
    var fracDigits : Nat = 0;
    var seenDot    = false;
    var done       = false;

    while (pos < textLen and not done) {
      let c = textChars[pos];
      if (c >= '0' and c <= '9') {
        let d : Nat = c.toNat32().toNat() - 48;
        if (seenDot) {
          if (fracDigits < 2) {
            fracPart   := fracPart * 10 + d;
            fracDigits += 1;
          } else if (fracDigits == 2) {
            // 3rd decimal digit — use for rounding only
            if (d >= 5) { fracPart += 1 };
            fracDigits += 1;
            done := true;
          };
        } else {
          intPart := intPart * 10 + d;
        };
        pos += 1;
      } else if (c == '.' and not seenDot) {
        seenDot := true;
        pos += 1;
      } else {
        done := true;
      };
    };

    // Pad fracPart to 2 digits if fewer decimal places were found
    while (fracDigits < 2) {
      fracPart   := fracPart * 10;
      fracDigits += 1;
    };

    let cents = intPart * 100 + fracPart;
    if (cents == 0) null else ?cents
  };

  // ─── Payment status query ─────────────────────────────────────────────────

  public type TradePaymentStatus = {
    tradeId         : Types.TradeId;
    token           : Types.TradeToken;
    tokenInfo       : ?TokenInfo;
    amount          : Nat;
    formattedAmount : Text;
    status          : Types.TradeStatus;
    isManual        : Bool;
    verificationResult : ?Types.PaymentVerificationResult;
  };

  /// Returns payment method and status for a given trade.
  /// Returns null if trade not found or caller is not a party.
  public func getTradePaymentStatus(
    trades                 : Map.Map<Types.TradeId, Types.Trade>,
    verificationResults    : Map.Map<Types.TradeId, Types.PaymentVerificationResult>,
    caller                 : Principal,
    tradeId                : Types.TradeId,
  ) : ?TradePaymentStatus {
    let trade = switch (trades.get(tradeId)) {
      case null    return null;
      case (?t)    t;
    };

    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) return null;

    let tokenInfo          = getTokenDisplayInfo(trade.token);
    let formattedAmount    = formatTokenAmount(trade.amount, trade.token);
    let verificationResult = verificationResults.get(tradeId);

    // isManual = true only when no verification result exists yet
    let isManual = switch (verificationResult) {
      case null true;
      case _    false;
    };

    ?{
      tradeId;
      token           = trade.token;
      tokenInfo;
      amount          = trade.amount;
      formattedAmount;
      status          = trade.status;
      isManual;
      verificationResult;
    }
  };

  // ─── Rate limiting helpers ─────────────────────────────────────────────────

  /// 5-minute window in nanoseconds, max 10 calls per trade per window.
  let RATE_LIMIT_WINDOW_NS : Int = 300_000_000_000;
  let RATE_LIMIT_MAX_CALLS : Nat = 10;

  /// Returns true if the caller is within the rate limit for a given tradeId.
  /// Mutates rateLimitVerify to track calls.
  public func checkAndRecordRateLimit(
    rateLimitVerify : Map.Map<Types.TradeId, (Nat, Types.Timestamp)>,
    tradeId         : Types.TradeId,
  ) : Bool {
    let now = Time.now();
    switch (rateLimitVerify.get(tradeId)) {
      case null {
        rateLimitVerify.add(tradeId, (1, now));
        true
      };
      case (?(count, windowStart)) {
        if (now - windowStart > RATE_LIMIT_WINDOW_NS) {
          // New window — reset
          rateLimitVerify.add(tradeId, (1, now));
          true
        } else if (count >= RATE_LIMIT_MAX_CALLS) {
          false
        } else {
          rateLimitVerify.add(tradeId, (count + 1, windowStart));
          true
        };
      };
    }
  };

  // ─── Error ring buffer helpers ─────────────────────────────────────────────

  let ERROR_LOG_MAX : Nat = 500;

  /// Appends an error entry to the ring buffer, evicting oldest if at cap.
  public func logVerificationError(
    errorLog  : Queue.Queue<Admin.PaymentVerificationError>,
    tradeId   : Types.TradeId,
    txHash    : Text,
    network   : Text,
    reason    : Text,
  ) : () {
    if (errorLog.size() >= ERROR_LOG_MAX) {
      ignore errorLog.popFront();
    };
    errorLog.pushBack({
      tradeId;
      txHash;
      network;
      reason;
      timestamp = Time.now();
    });
  };

  // ─── Blockchain URL / body builders ───────────────────────────────────────

  /// TronGrid — GET /v1/transactions/{txHash}
  public func tronGridUrl(txHash : Text) : Text {
    "https://api.trongrid.io/v1/transactions/" # txHash
  };

  /// BSCScan — transaction receipt status
  public func bscScanUrl(txHash : Text, apiKey : Text) : Text {
    "https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash="
      # txHash # "&apikey=" # apiKey
  };

  /// Solana RPC — getTransaction (configurable endpoint)
  public func solanaRpcBody(txHash : Text) : Text {
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTransaction\"," #
    "\"params\":[\"" # txHash # "\",{\"encoding\":\"jsonParsed\",\"maxSupportedTransactionVersion\":0}]}"
  };

  /// Infura EVM RPC — eth_getTransactionReceipt (works for ETH, Polygon, Avalanche)
  /// Uses Infura project key if provided, otherwise falls back to public endpoints.
  public func infuraUrl(network : Text, projectId : Text) : Text {
    if (projectId != "") {
      switch (network) {
        case "polygon"   "https://polygon-mainnet.infura.io/v3/" # projectId;
        case "avalanche" "https://avalanche-mainnet.infura.io/v3/" # projectId;
        case _           "https://mainnet.infura.io/v3/" # projectId; // Ethereum default
      }
    } else {
      // Public fallback RPC endpoints
      switch (network) {
        case "polygon"   "https://polygon-rpc.com";
        case "avalanche" "https://api.avax.network/ext/bc/C/rpc";
        case _           "https://cloudflare-eth.com";
      }
    }
  };

  public func infuraRpcBody(txHash : Text) : Text {
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getTransactionReceipt\"," #
    "\"params\":[\"" # txHash # "\"]}"
  };

  // ─── Response parsers ──────────────────────────────────────────────────────

  // Minimal JSON field extraction

  func extractJsonField(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\":\"";
    let parts = json.split(#text needle);
    var firstSeen = false;
    for (part in parts) {
      if (firstSeen) {
        let valueParts = part.split(#text "\"");
        var inner : ?Text = null;
        for (vp in valueParts) {
          if (inner == null) { inner := ?vp };
        };
        return inner;
      };
      firstSeen := true;
    };
    null
  };

  func extractJsonNumber(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\":";
    let parts = json.split(#text needle);
    var firstSeen = false;
    for (part in parts) {
      if (firstSeen) {
        var result = "";
        var done = false;
        for (ch in part.toIter()) {
          if (not done) {
            if ((ch >= '0' and ch <= '9') or ch == '.') {
              result := result # Text.fromChar(ch);
            } else {
              done := true;
            };
          };
        };
        if (result != "") return ?result;
      };
      firstSeen := true;
    };
    null
  };

  /// Parse TronGrid transaction response.
  /// Returns (recipient, amountStr, blockNumber) on success.
  public func parseTronGridResponse(json : Text) : ?{ recipient : Text; amount : Text; blockNumber : Nat } {
    // TronGrid wraps data in {"data":[{...}]} — check for "success" or "data"
    if (not json.contains(#text "\"data\"")) return null;
    // Extract "to_address" and "amount" from contract data
    let recipient = switch (extractJsonField(json, "to_address")) {
      case (?r) r;
      case null return null;
    };
    let amount = switch (extractJsonNumber(json, "amount")) {
      case (?a) a;
      case null "0";
    };
    let blockNumber = switch (extractJsonNumber(json, "blockNumber")) {
      case (?b) { switch (Nat.fromText(b)) { case (?n) n; case null 0 } };
      case null 0;
    };
    ?{ recipient; amount; blockNumber }
  };

  /// Parse BSCScan receipt status response.
  /// Returns true when status == "1" (success).
  public func parseBscScanResponse(json : Text) : ?{ success : Bool; blockNumber : Nat } {
    if (not json.contains(#text "\"status\":\"1\"")) {
      // Check if request itself succeeded (message == "OK")
      if (json.contains(#text "\"message\":\"NOTOK\"")) return null;
      return ?{ success = false; blockNumber = 0 };
    };
    let blockNumber = switch (extractJsonField(json, "blockNumber")) {
      case (?b) { switch (Nat.fromText(b)) { case (?n) n; case null 0 } };
      case null 0;
    };
    ?{ success = true; blockNumber }
  };

  /// Parse Solana RPC getTransaction response.
  /// Returns (recipient, amount, slot) on success.
  public func parseSolanaResponse(json : Text) : ?{ recipient : Text; amount : Text; blockNumber : Nat } {
    if (json.contains(#text "\"result\":null")) return null;
    if (not json.contains(#text "\"result\"")) return null;
    let recipient = switch (extractJsonField(json, "destination")) {
      case (?r) r;
      case null {
        switch (extractJsonField(json, "account")) {
          case (?r2) r2;
          case null  return null;
        };
      };
    };
    let amount = switch (extractJsonNumber(json, "uiAmount")) {
      case (?a) a;
      case null {
        switch (extractJsonNumber(json, "amount")) {
          case (?a2) a2;
          case null  "0";
        };
      };
    };
    let slot = switch (extractJsonNumber(json, "slot")) {
      case (?s) { switch (Nat.fromText(s)) { case (?n) n; case null 0 } };
      case null 0;
    };
    ?{ recipient; amount; blockNumber = slot }
  };

  /// Parse Infura/EVM eth_getTransactionReceipt response.
  /// status == "0x1" → success.
  public func parseEvmResponse(json : Text) : ?{ recipient : Text; blockNumber : Nat } {
    if (json.contains(#text "\"result\":null")) return null;
    // status 0x1 = success
    let success = json.contains(#text "\"status\":\"0x1\"");
    if (not success) return ?{ recipient = ""; blockNumber = 0 };
    let recipient = switch (extractJsonField(json, "to")) {
      case (?r) r;
      case null "";
    };
    let blockHex = switch (extractJsonField(json, "blockNumber")) {
      case (?b) b;
      case null "0x0";
    };
    // Convert hex block number to Nat (best-effort: strips "0x" prefix)
    let blockNumber : Nat = if (blockHex.size() > 2) {
      var result : Nat = 0;
      let skipPrefix = 2; // skip first 2 chars ("0x")
      var pos = 0;
      for (ch in blockHex.toIter()) {
        if (pos >= skipPrefix) {
          let digit : Nat = if (ch >= '0' and ch <= '9') {
            switch ch { case '0' 0; case '1' 1; case '2' 2; case '3' 3; case '4' 4;
                        case '5' 5; case '6' 6; case '7' 7; case '8' 8; case '9' 9; case _ 0 }
          } else if (ch >= 'a' and ch <= 'f') {
            switch ch { case 'a' 10; case 'b' 11; case 'c' 12;
                        case 'd' 13; case 'e' 14; case 'f' 15; case _ 0 }
          } else if (ch >= 'A' and ch <= 'F') {
            switch ch { case 'A' 10; case 'B' 11; case 'C' 12;
                        case 'D' 13; case 'E' 14; case 'F' 15; case _ 0 }
          } else 0;
          result := result * 16 + digit;
        };
        pos += 1;
      };
      result
    } else 0;
    ?{ recipient; blockNumber }
  };

  // ─── Reputation gate helper ───────────────────────────────────────────────

  /// Roughly converts a token amount to USD cents, assuming $1.00 per token unit.
  /// Uses the token's native decimals to normalize.
  /// Returns 0 if token info not found.
  /// This is a rough approximation — precision not critical, used only for reputation gates.
  public func tokenAmountToUsdCents(amount : Nat, token : Types.TradeToken) : Nat {
    let info = switch (getTokenDisplayInfo(token)) {
      case null    return 0;
      case (?i)    i;
    };
    var divisor : Nat = 1;
    var d = 0;
    while (d < info.decimals) {
      divisor := divisor * 10;
      d += 1;
    };
    // amount / divisor = whole tokens; * 100 = cents
    (amount * 100) / divisor
  };

  // ─── Network name helper ───────────────────────────────────────────────────

  public func networkName(token : Types.TradeToken) : Text {
    switch token {
      case (#USDT_TRC20)   "TRC20";
      case (#USDT_BEP20)   "BEP20";
      case (#USDC_SPL)     "SPL";
      case (#USDT_ERC20)   "ERC20";
      case (#USDC_ERC20)   "ERC20";
      case (#USDT_POLYGON) "Polygon";
      case (#USDC_POLYGON) "Polygon";
      case (#USDT_AVAX)    "Avalanche";
      case (#USDC_AVAX)    "Avalanche";
      case (#ckUSDC)       "Internet Computer";
      case (#ckUSDT)       "Internet Computer";
    };
  };

  /// Returns the EVM network key used in infuraUrl() for a token.
  public func evmNetworkKey(token : Types.TradeToken) : Text {
    switch token {
      case (#USDT_POLYGON) "polygon";
      case (#USDC_POLYGON) "polygon";
      case (#USDT_AVAX)    "avalanche";
      case (#USDC_AVAX)    "avalanche";
      case _               "ethereum";
    }
  };

}
