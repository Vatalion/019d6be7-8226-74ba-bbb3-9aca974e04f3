import Text "mo:core/Text";
import Types "../types";
import Payments "../lib/Payments";
import HttpJsonRpc "HttpJsonRpc";

/// EVM wallet signature verification for MetaMask personal_sign (E4.S7 / FR-28).
/// Uses HTTPS JSON-RPC personal_ecRecover — fail-closed when RPC unavailable.
module {

  public func isValidEvmSignatureFormat(signatureHex : Text) : Bool {
    let stripped = switch (signatureHex.stripStart(#text "0x")) {
      case (?s) s;
      case null signatureHex;
    };
    stripped.size() == 130
  };

  public func isValidSignatureForChain(chain : Types.WalletChain, signatureHex : Text) : Bool {
    switch (chain) {
      case (#tron) false;
      case (#evm_bsc or #evm_eth) isValidEvmSignatureFormat(signatureHex);
    }
  };

  public func evmRpcUrl(
    chain : Types.WalletChain,
    infuraApiKey : Text,
    bscScanApiKey : Text,
  ) : Text {
    switch (chain) {
      case (#evm_eth) {
        if (infuraApiKey.size() > 0) {
          Payments.infuraUrl("ethereum", infuraApiKey)
        } else {
          ""
        }
      };
      case (#evm_bsc) {
        if (bscScanApiKey.size() > 0) {
          "https://bsc-dataseed.binance.org/"
        } else {
          "https://bsc-dataseed.binance.org/"
        }
      };
      case (#tron) "";
    }
  };

  public func addressesMatch(chain : Types.WalletChain, expected : Text, recovered : Text) : Bool {
    let a = HttpJsonRpc.normalizeEvmAddress(expected);
    let b = HttpJsonRpc.normalizeEvmAddress(recovered);
    a == b
  };

  /// Verify personal_sign signature via JSON-RPC personal_ecRecover.
  public func verifyPersonalSign(
    chain : Types.WalletChain,
    expectedAddress : Text,
    message : Text,
    signatureHex : Text,
    infuraApiKey : Text,
    bscScanApiKey : Text,
    transform : ?HttpJsonRpc.JsonRpcTransform,
  ) : async Bool {
    if (not isValidEvmSignatureFormat(signatureHex)) return false;
    let rpc = evmRpcUrl(chain, infuraApiKey, bscScanApiKey);
    if (rpc.size() == 0) return false;
    switch (await HttpJsonRpc.personalEcRecover(rpc, message, signatureHex, transform)) {
      case null false;
      case (?recovered) addressesMatch(chain, expectedAddress, recovered);
    }
  };

};
