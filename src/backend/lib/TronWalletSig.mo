import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Char "mo:core/Char";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Text "mo:core/Text";
import Base58 "Base58";
import Sha256 "Sha256";
import HttpJsonRpc "HttpJsonRpc";

/// Tron wallet signature verification for TronLink signMessageV2 (E4.S7).
/// Recovers signer via JSON-RPC personal_ecRecover, then maps 0x → base58 Tron address.
module {

  public func tronRpcUrl(tronGridApiKey : Text) : Text {
    if (tronGridApiKey.size() > 0) {
      "https://api.trongrid.io/jsonrpc?TRON-PRO-API-KEY=" # tronGridApiKey
    } else {
      "https://api.trongrid.io/jsonrpc"
    }
  };

  /// TronLink signMessageV2 prefix: 0x19 + TRON Signed Message:\\n{len}{message}
  public func tronSignedMessage(message : Text) : Text {
    let len = message.size();
    Text.fromChar(Char.fromNat32(25)) # "TRON Signed Message:\n" # len.toText() # message
  };

  func hexToBytes(hex : Text) : [Nat8] {
    let stripped = switch (hex.stripStart(#text "0x")) {
      case (?s) s;
      case null hex;
    };
    let len = stripped.size() / 2;
    Array.tabulate<Nat8>(len, func(i : Nat) : Nat8 {
      let hi = hexNibble(stripped.toArray()[i * 2]);
      let lo = hexNibble(stripped.toArray()[i * 2 + 1]);
      Nat8.fromNat(hi * 16 + lo)
    })
  };

  func hexNibble(c : Char) : Nat {
    switch (c) {
      case '0' 0; case '1' 1; case '2' 2; case '3' 3;
      case '4' 4; case '5' 5; case '6' 6; case '7' 7;
      case '8' 8; case '9' 9;
      case 'a' 10; case 'b' 11; case 'c' 12; case 'd' 13;
      case 'e' 14; case 'f' 15;
      case 'A' 10; case 'B' 11; case 'C' 12; case 'D' 13;
      case 'E' 14; case 'F' 15;
      case _ 0;
    }
  };

  /// Convert recovered EVM hex address to Tron base58check (T…).
  public func evmHexToTronBase58(evmHex : Text) : Text {
    let hexStr = switch (evmHex.stripStart(#text "0x")) {
      case (?s) s;
      case null evmHex;
    };
    let payloadBytes = hexToBytes(hexStr);
    let versioned = Array.tabulate<Nat8>(21, func(i) {
      if (i == 0) 0x41 else payloadBytes[i - 1]
    });
    let hash1 = Sha256.sha256(Blob.fromArray(versioned));
    let hash2 = Sha256.sha256(hash1);
    let hashBytes = hash2.toArray();
    let checksum = Array.tabulate(4, func(i : Nat) : Nat8 { hashBytes[i] });
    Base58.encode(versioned.concat(checksum))
  };

  public func normalizeTronAddress(addr : Text) : Text {
    addr.trim(#char ' ')
  };

  func recoverTronAddress(
    rpc : Text,
    message : Text,
    signatureHex : Text,
    transform : ?HttpJsonRpc.JsonRpcTransform,
  ) : async ?Text {
    switch (await HttpJsonRpc.personalEcRecover(rpc, message, signatureHex, transform)) {
      case null null;
      case (?evmAddr) ?evmHexToTronBase58(evmAddr);
    }
  };

  public func verifyTronSignMessage(
    tronGridApiKey : Text,
    expectedAddress : Text,
    message : Text,
    signatureHex : Text,
    transform : ?HttpJsonRpc.JsonRpcTransform,
  ) : async Bool {
    let rpc = tronRpcUrl(tronGridApiKey);
    let expected = normalizeTronAddress(expectedAddress);
    switch (await recoverTronAddress(rpc, message, signatureHex, transform)) {
      case (?addr) {
        if (normalizeTronAddress(addr) == expected) return true;
      };
      case null {};
    };
    switch (await recoverTronAddress(rpc, tronSignedMessage(message), signatureHex, transform)) {
      case null false;
      case (?addr) normalizeTronAddress(addr) == expected;
    }
  };

}
