import Blob "mo:core/Blob";
import Text "mo:core/Text";

/// Minimal HTTPS JSON-RPC helpers for wallet signature verification (E4.S7).
module {

  type HttpHeader = { name : Text; value : Text };

  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?Blob;
    method : { #get; #post; #head };
    transform : ?{
      function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
      context : Blob;
    };
  };

  public type HttpResponse = {
    status : Nat;
    headers : [HttpHeader];
    body : Blob;
  };

  public type JsonRpcTransform = {
    function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
    context : Blob;
  };

  let ic : actor { http_request : HttpRequestArgs -> async HttpResponse } =
    actor "aaaaa-aa";

  /// IC HTTP outcall cycle budget for JSON-RPC (ecrecover).
  let JSON_RPC_CYCLES : Nat = 230_949_972_665;

  func bodyText(body : Blob) : Text {
    switch (body.decodeUtf8()) {
      case (?t) t;
      case null "";
    };
  };

  /// Naive JSON string field extractor — finds `"key":VALUE`.
  public func jsonExtract(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    var parts = json.tokens(#text needle);
    ignore parts.next();
    switch (parts.next()) {
      case null null;
      case (?segment) {
        let seg = segment.trimStart(#char ' ');
        if (seg.size() == 0) return null;
        let first = seg.toArray()[0];
        if (first == '\"') {
          var val = "";
          var seenOpen = false;
          label L for (c in seg.toIter()) {
            if (not seenOpen) {
              if (c == '\"') seenOpen := true;
            } else {
              if (c == '\"') break L;
              val := val # Text.fromChar(c);
            };
          };
          ?val
        } else {
          var val = "";
          for (c in seg.toIter()) {
            if (c == ',' or c == '}' or c == ']') return ?val;
            val := val # Text.fromChar(c);
          };
          if (val.size() == 0) null else ?val
        }
      };
    }
  };

  public func hexEncodeText(message : Text) : Text {
    let bytes = message.encodeUtf8().toArray();
    var hex = "0x";
    for (b in bytes.vals()) {
      let hi = b.toNat() / 16;
      let lo = b.toNat() % 16;
      hex := hex # hexChar(hi) # hexChar(lo);
    };
    hex
  };

  func hexChar(n : Nat) : Text {
    switch n {
      case 0 "0"; case 1 "1"; case 2 "2"; case 3 "3";
      case 4 "4"; case 5 "5"; case 6 "6"; case 7 "7";
      case 8 "8"; case 9 "9"; case 10 "a"; case 11 "b";
      case 12 "c"; case 13 "d"; case 14 "e"; case 15 "f";
      case _ "0";
    }
  };

  public func jsonRpcPost(
    rpcUrl : Text,
    body : Text,
    transform : ?JsonRpcTransform,
  ) : async ?Text {
    if (rpcUrl.size() == 0) return null;
    try {
      let response = await (with cycles = JSON_RPC_CYCLES) ic.http_request({
        url = rpcUrl;
        max_response_bytes = ?4096;
        headers = [{ name = "Content-Type"; value = "application/json" }];
        body = ?body.encodeUtf8();
        method = #post;
        transform = transform;
      });
      if (response.status != 200) return null;
      jsonExtract(bodyText(response.body), "result")
    } catch (_) {
      null
    }
  };

  /// Geth-compatible personal_ecRecover — node hashes the message internally.
  public func personalEcRecover(
    rpcUrl : Text,
    message : Text,
    signatureHex : Text,
    transform : ?JsonRpcTransform,
  ) : async ?Text {
    let msgHex = hexEncodeText(message);
    let sig = ensure0x(signatureHex);
    let body =
      "{\"jsonrpc\":\"2.0\",\"method\":\"personal_ecRecover\",\"params\":[\"" #
      msgHex # "\",\"" # sig # "\"],\"id\":1}";
    switch (await jsonRpcPost(rpcUrl, body, transform)) {
      case null null;
      case (?addr) ?normalizeEvmAddress(addr);
    }
  };

  func ensure0x(sig : Text) : Text {
    if (sig.startsWith(#text "0x")) sig else "0x" # sig
  };

  public func normalizeEvmAddress(addr : Text) : Text {
    let trimmed = addr.trim(#char ' ').trim(#char '\"');
    let lower = lowercaseAscii(trimmed);
    if (lower.startsWith(#text "0x")) lower else "0x" # lower
  };

  func lowercaseAscii(t : Text) : Text {
    var out = "";
    for (c in t.chars()) {
      out #= switch c {
        case 'A' "a"; case 'B' "b"; case 'C' "c"; case 'D' "d";
        case 'E' "e"; case 'F' "f"; case 'G' "g"; case 'H' "h";
        case 'I' "i"; case 'J' "j"; case 'K' "k"; case 'L' "l";
        case 'M' "m"; case 'N' "n"; case 'O' "o"; case 'P' "p";
        case 'Q' "q"; case 'R' "r"; case 'S' "s"; case 'T' "t";
        case 'U' "u"; case 'V' "v"; case 'W' "w"; case 'X' "x";
        case 'Y' "y"; case 'Z' "z";
        case _ Text.fromChar(c);
      };
    };
    out
  };

}
