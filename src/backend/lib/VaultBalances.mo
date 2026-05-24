import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Types "../types";
import VaultLib "Vault";

/// VaultBalances — HTTP outcalls to check USDT/USDC balances on each chain.
///
/// Supported chains:
///   ERC20 / Polygon / Avalanche  — eth_call JSON-RPC (balanceOf)
///   TRC20                        — TronGrid account token balance endpoint
///   BEP20                        — BSCScan tokenbalance endpoint
///   SPL                          — Solana getTokenAccountsByOwner RPC
///
/// Balances are cached for 60 seconds (TTL). Returns cached result if fresh.
module {

  // ─── HTTPS outcall types ──────────────────────────────────────────────────

  type HttpHeader  = { name : Text; value : Text };

  type HttpRequestArgs = {
    url                : Text;
    max_response_bytes : ?Nat64;
    headers            : [HttpHeader];
    body               : ?Blob;
    method             : { #get; #post; #head };
    transform          : ?{
      function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
      context  : Blob;
    };
  };

  type HttpResponse = {
    status  : Nat;
    headers : [HttpHeader];
    body    : Blob;
  };

  public type HttpTransform = {
    function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
    context  : Blob;
  };

  let ic : actor { http_request : HttpRequestArgs -> async HttpResponse } =
    actor "aaaaa-aa";

  // ─── Balance result type ──────────────────────────────────────────────────

  public type BalanceResult = {
    chain       : VaultLib.ChainType;
    usdtBalance : Nat;   // in smallest unit (e.g. 6 decimals = millionths)
    usdcBalance : Nat;
    lastChecked : Int;
    error       : ?Text;
  };

  public type BalanceCacheKey = Text;

  let CACHE_TTL_NS : Nat = 60_000_000_000; // 60 seconds in nanoseconds

  // ─── Known contract addresses ─────────────────────────────────────────────

  let USDT_ERC20   = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  let USDC_ERC20   = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  let USDT_BEP20   = "0x55d398326f99059fF775485246999027B3197955";
  let USDC_BEP20   = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  let USDT_POLYGON = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  let USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  let USDT_AVAX    = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";
  let USDC_AVAX    = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
  let USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
  let USDC_TRC20_CONTRACT = "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8";
  let USDT_SPL     = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
  let USDC_SPL     = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  // ─── Cache helpers ────────────────────────────────────────────────────────

  public func balanceCacheKey(userId : Types.UserId, chain : VaultLib.ChainType) : BalanceCacheKey {
    "bal:" # userId.toText() # ":" # VaultLib.chainTag(chain)
  };

  func isCacheFresh(result : BalanceResult) : Bool {
    Time.now() - result.lastChecked < CACHE_TTL_NS
  };

  // ─── HTTP helpers ─────────────────────────────────────────────────────────

  func bodyText(body : Blob) : Text {
    switch (body.decodeUtf8()) {
      case (?t) t;
      case null "";
    }
  };

  /// Extract a JSON field value (string or number) for a key — naive scanner.
  /// Finds `"key":VALUE` and returns VALUE as text (strips surrounding quotes).
  func jsonExtract(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    // Split on the needle and take the piece after the first occurrence
    var parts = json.tokens(#text needle);
    ignore parts.next(); // discard head (before needle)
    switch (parts.next()) {
      case null null;
      case (?segment) {
        // segment starts right after `"key":` — trim whitespace
        let seg = segment.trimStart(#char ' ');
        if (seg.size() == 0) return null;
        // Determine if value is a quoted string or bare number/null
        let first = seg.toArray()[0];
         if (first == '\"') {
           // Quoted string: collect chars until the closing quote
           var val = "";
           var seenOpen = false;
           label L for (c in seg.toIter()) {
             if (not seenOpen) {
               if (c == '\"') { seenOpen := true };
             } else {
               if (c == '\"') break L;
               val := val # Text.fromChar(c);
             };
           };
           ?val
        } else {
          // Bare value: collect until comma, }, ] or whitespace
          var val = "";
          for (c in seg.toIter()) {
            if (c == ',' or c == '}' or c == ']' or c == ' ' or c == '\n') {
              // stop — but we can't break out of for, so collect until end
              // and we trim after
            } else {
              val := val # Text.fromChar(c);
            };
          };
          // Trim at first delimiter
          var result = "";
          for (c in val.toIter()) {
            if (c == ',' or c == '}' or c == ']') return ?result;
            result := result # Text.fromChar(c);
          };
          if (result.size() == 0) null else ?result
        }
      };
    }
  };

  /// Parse a decimal integer string to Nat (returns 0 on failure).
  func parseNat(s : Text) : Nat {
    switch (Nat.fromText(s.trim(#char ' ').trim(#char '\"'))) {
      case (?n) n;
      case null 0;
    }
  };

  // ─── EVM balanceOf call ───────────────────────────────────────────────────

  /// ABI-encode `balanceOf(address)` — selector 0x70a08231 + zero-padded addr.
  func encodeBalanceOf(addr : Text) : Text {
    let stripped = switch (addr.stripStart(#text "0x")) {
      case (?s) s;
      case null addr;
    };
    let padded = padLeft(stripped, 64, '0');
    "0x70a08231000000000000000000000000" # padded
  };

  func padLeft(s : Text, width : Nat, c : Char) : Text {
    let sz = s.size();
    if (sz >= width) return s;
    var padding = "";
    var i = 0;
    while (i < width - sz) {
      padding := padding # Text.fromChar(c);
      i += 1;
    };
    padding # s
  };

  func ethCallBody(contractAddr : Text, data : Text) : Blob {
    let json = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":"
      # "[{\"to\":\"" # contractAddr # "\",\"data\":\"" # data # "\"},\"latest\"],\"id\":1}";
    json.encodeUtf8()
  };

  /// Parse hex result from eth_call ("0x" + 64 hex chars) into Nat.
  func hexResultToNat(hexStr : Text) : Nat {
    let stripped = switch (hexStr.trim(#char ' ').stripStart(#text "0x")) {
      case (?s) s;
      case null hexStr.trim(#char ' ');
    };
    var result : Nat = 0;
    for (c in stripped.toIter()) {
      let digit : Nat = switch c {
        case '0' 0; case '1' 1; case '2' 2; case '3' 3;
        case '4' 4; case '5' 5; case '6' 6; case '7' 7;
        case '8' 8; case '9' 9;
        case 'a' 10; case 'b' 11; case 'c' 12;
        case 'd' 13; case 'e' 14; case 'f' 15;
        case 'A' 10; case 'B' 11; case 'C' 12;
        case 'D' 13; case 'E' 14; case 'F' 15;
        case _ 0;
      };
      result := result * 16 + digit;
    };
    result
  };

  func fetchEvmBalance(
    rpcUrl : Text,
    contractAddr : Text,
    walletAddr : Text,
    transform : ?HttpTransform,
  ) : async Nat {
    let callData = encodeBalanceOf(walletAddr);
    let response = await ic.http_request({
      url                = rpcUrl;
      max_response_bytes = ?2048;
      headers            = [{ name = "Content-Type"; value = "application/json" }];
      body               = ?(ethCallBody(contractAddr, callData));
      method             = #post;
      transform          = transform;
    });
    let text = bodyText(response.body);
    switch (jsonExtract(text, "result")) {
      case (?hexVal) hexResultToNat(hexVal);
      case null      0;
    }
  };

  // ─── EVM multi-chain fetcher ──────────────────────────────────────────────

  func evmRpcUrl(chain : VaultLib.ChainType, infuraKey : Text) : Text {
    switch chain {
      case (#ERC20)     "https://mainnet.infura.io/v3/" # infuraKey;
      case (#Polygon)   "https://polygon-mainnet.infura.io/v3/" # infuraKey;
      case (#Avalanche) "https://avalanche-mainnet.infura.io/v3/" # infuraKey;
      case _            Runtime.trap("not an EVM chain");
    }
  };

  func evmContracts(chain : VaultLib.ChainType) : (Text, Text) {
    switch chain {
      case (#ERC20)     (USDT_ERC20,   USDC_ERC20);
      case (#Polygon)   (USDT_POLYGON, USDC_POLYGON);
      case (#Avalanche) (USDT_AVAX,    USDC_AVAX);
      case _            Runtime.trap("not an EVM chain");
    }
  };

  func fetchEvmChainBalance(
    chain     : VaultLib.ChainType,
    address   : Text,
    infuraKey : Text,
    transform : ?HttpTransform,
  ) : async BalanceResult {
    let rpc = evmRpcUrl(chain, infuraKey);
    let (usdtContract, usdcContract) = evmContracts(chain);
    let usdtBal = await fetchEvmBalance(rpc, usdtContract, address, transform);
    let usdcBal = await fetchEvmBalance(rpc, usdcContract, address, transform);
    { chain; usdtBalance = usdtBal; usdcBalance = usdcBal; lastChecked = Time.now(); error = null }
  };

  // ─── TRC20 (TronGrid) ─────────────────────────────────────────────────────

  func parseTronTokenBalance(json : Text, contractAddr : Text) : Nat {
    if (not json.contains(#text contractAddr)) return 0;
    var parts = json.tokens(#text contractAddr);
    ignore parts.next();
    switch (parts.next()) {
      case null 0;
      case (?tail) {
        let snippet = if (tail.size() > 300) Text.fromIter(tail.toIter().take(300)) else tail;
        switch (jsonExtract(snippet, "balance")) {
          case (?val) parseNat(val);
          case null   0;
        }
      };
    }
  };

  func fetchTrc20Balance(
    address : Text,
    tronGridKey : Text,
    transform : ?HttpTransform,
  ) : async BalanceResult {
    let url = "https://api.trongrid.io/v1/accounts/" # address # "/tokens?limit=100";
    let response = await ic.http_request({
      url                = url;
      max_response_bytes = ?8192;
      headers            = [
        { name = "TRON-PRO-API-KEY"; value = tronGridKey },
        { name = "Accept";           value = "application/json" },
      ];
      body = null; method = #get; transform = transform;
    });
    if (response.status != 200) {
      return {
        chain = #TRC20; usdtBalance = 0; usdcBalance = 0;
        lastChecked = Time.now();
        error = ?("TronGrid HTTP " # debug_show(response.status));
      };
    };
    let text = bodyText(response.body);
    {
      chain       = #TRC20;
      usdtBalance = parseTronTokenBalance(text, USDT_TRC20_CONTRACT);
      usdcBalance = parseTronTokenBalance(text, USDC_TRC20_CONTRACT);
      lastChecked = Time.now();
      error       = null;
    }
  };

  // ─── BEP20 (BSCScan) ─────────────────────────────────────────────────────

  func fetchBep20Balance(
    address : Text,
    bscScanKey : Text,
    transform : ?HttpTransform,
  ) : async BalanceResult {
    let base = "https://api.bscscan.com/api?module=account&action=tokenbalance&tag=latest&apikey="
      # bscScanKey # "&address=" # address # "&contractaddress=";
    let usdtResp = await ic.http_request({
      url = base # USDT_BEP20; max_response_bytes = ?2048;
      headers = [{ name = "Accept"; value = "application/json" }];
      body = null; method = #get; transform = transform;
    });
    let usdcResp = await ic.http_request({
      url = base # USDC_BEP20; max_response_bytes = ?2048;
      headers = [{ name = "Accept"; value = "application/json" }];
      body = null; method = #get; transform = transform;
    });
    {
      chain       = #BEP20;
      usdtBalance = switch (jsonExtract(bodyText(usdtResp.body), "result")) { case (?v) parseNat(v); case null 0 };
      usdcBalance = switch (jsonExtract(bodyText(usdcResp.body), "result")) { case (?v) parseNat(v); case null 0 };
      lastChecked = Time.now();
      error       = null;
    }
  };

  // ─── SPL (Solana RPC) ─────────────────────────────────────────────────────

  func splBody(walletAddress : Text, mint : Text) : Blob {
    (
      "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\","
      # "\"params\":[\"" # walletAddress # "\","
      # "{\"mint\":\"" # mint # "\"},"
      # "{\"encoding\":\"jsonParsed\"}]}"
    ).encodeUtf8()
  };

  func fetchSplBalance(address : Text, transform : ?HttpTransform) : async BalanceResult {
    let rpc = "https://api.mainnet-beta.solana.com";
    let usdtResp = await ic.http_request({
      url = rpc; max_response_bytes = ?8192;
      headers = [{ name = "Content-Type"; value = "application/json" }];
      body = ?(splBody(address, USDT_SPL)); method = #post; transform = transform;
    });
    let usdcResp = await ic.http_request({
      url = rpc; max_response_bytes = ?8192;
      headers = [{ name = "Content-Type"; value = "application/json" }];
      body = ?(splBody(address, USDC_SPL)); method = #post; transform = transform;
    });
    {
      chain       = #SPL;
      usdtBalance = switch (jsonExtract(bodyText(usdtResp.body), "amount")) { case (?v) parseNat(v); case null 0 };
      usdcBalance = switch (jsonExtract(bodyText(usdcResp.body), "amount")) { case (?v) parseNat(v); case null 0 };
      lastChecked = Time.now();
      error       = null;
    }
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  /// Fetch (or return cached) balance for a single (userId, chain) pair.
  public func getOrFetchBalance(
    balanceCache : Map.Map<BalanceCacheKey, BalanceResult>,
    userId       : Types.UserId,
    chain        : VaultLib.ChainType,
    address      : Text,
    infuraKey    : Text,
    tronGridKey  : Text,
    bscScanKey   : Text,
    transform    : ?HttpTransform,
  ) : async BalanceResult {
    let key = balanceCacheKey(userId, chain);
    switch (balanceCache.get(key)) {
      case (?cached) {
        if (isCacheFresh(cached)) return cached;
      };
      case null {};
    };
    let result : BalanceResult = try {
      switch chain {
        case (#ERC20)     await fetchEvmChainBalance(chain, address, infuraKey, transform);
        case (#Polygon)   await fetchEvmChainBalance(chain, address, infuraKey, transform);
        case (#Avalanche) await fetchEvmChainBalance(chain, address, infuraKey, transform);
        case (#TRC20)     await fetchTrc20Balance(address, tronGridKey, transform);
        case (#BEP20)     await fetchBep20Balance(address, bscScanKey, transform);
        case (#SPL)       await fetchSplBalance(address, transform);
      }
    } catch (_) {
      {
        chain = chain; usdtBalance = 0; usdcBalance = 0;
        lastChecked = Time.now();
        error = ?"Fetch error: HTTP outcall failed";
      }
    };
    balanceCache.add(key, result);
    result
  };

  /// Return a cached balance without making an HTTP call. Null if not yet fetched.
  public func getCachedBalance(
    balanceCache : Map.Map<BalanceCacheKey, BalanceResult>,
    userId       : Types.UserId,
    chain        : VaultLib.ChainType,
  ) : ?BalanceResult {
    balanceCache.get(balanceCacheKey(userId, chain))
  };

}
