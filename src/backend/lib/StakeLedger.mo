import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types";
import Escrow "../lib/Escrow";
import Admin "../lib/Admin";
import DigitalEncryption "DigitalEncryption";

/// On-chain stake ledger moves for ckUSDC/ckUSDT (E6.S8 depth).
/// Manual-chain tokens remain internal-ledger only with honest UI copy.
module {

  public type StakeLedger = Escrow.Icrc1Ledger;

  public func isOnChainStakeToken(token : Types.TradeToken) : Bool {
    Escrow.isOnChainToken(token)
  };

  public func stakeOnChainActive(settings : Admin.SystemSettings, token : Types.TradeToken) : Bool {
    isOnChainStakeToken(token) and settings.stakeOnChainEnabled
  };

  /// Platform-wide stake pool subaccount on this canister.
  public func platformStakeSubaccount() : Blob {
    Blob.fromArray(DigitalEncryption.deriveKey(Principal.fromText("aaaaa-aa"), "platform-stake-v1"))
  };

  /// Per-seller stake subaccount for accounting separation.
  public func sellerStakeSubaccount(seller : Types.UserId) : Blob {
    Blob.fromArray(DigitalEncryption.deriveKey(seller, "seller-stake-v1"))
  };

  public func ledgerPrincipal(settings : Admin.SystemSettings, token : Types.TradeToken) : ?Principal {
    switch (Escrow.ledgerCanisterId(token, settings.ckUsdcLedgerId, settings.ckUsdtLedgerId)) {
      case null null;
      case (?p) {
        let idText = p.toText();
        if (idText.size() < 5 or idText == "aaaaa-aa") null else ?p
      };
    }
  };

  public func ledgerActor(settings : Admin.SystemSettings, token : Types.TradeToken) : ?StakeLedger {
    switch (ledgerPrincipal(settings, token)) {
      case null null;
      case (?p) ?(actor (p.toText()) : StakeLedger);
    }
  };

  /// Pull ck stake from seller into platform stake subaccount (requires ICRC-2 allowance).
  public func depositOnChain(
    settings : Admin.SystemSettings,
    canisterId : Principal,
    seller : Types.UserId,
    token : Types.TradeToken,
    amount : Nat,
  ) : async Types.Result<Nat> {
    if (not stakeOnChainActive(settings, token)) {
      return #err(#invalid_input("On-chain stake not enabled for this token."));
    };
    switch (ledgerActor(settings, token)) {
      case null return #err(#invalid_input("Stake ledger not configured."));
      case (?ledger) {
        let sub = platformStakeSubaccount();
        let result = await ledger.icrc2_transfer_from({
          from = { owner = seller; subaccount = null };
          to = { owner = canisterId; subaccount = ?sub };
          amount;
          fee = null;
          memo = null;
          spender_subaccount = null;
          created_at_time = null;
        });
        switch (result) {
          case (#Ok(idx)) #ok(idx);
          case (#Err(e)) #err(#escrow_error("Stake ICRC deposit failed: " # debug_show(e)));
        };
      };
    }
  };

  /// Return seized/released stake to seller principal.
  public func transferToSeller(
    settings : Admin.SystemSettings,
    canisterId : Principal,
    seller : Types.UserId,
    token : Types.TradeToken,
    amount : Nat,
  ) : async Types.Result<Nat> {
    switch (ledgerActor(settings, token)) {
      case null return #err(#invalid_input("Stake ledger not configured."));
      case (?ledger) {
        let result = await ledger.icrc1_transfer({
          to = { owner = seller; subaccount = null };
          amount;
          fee = null;
          memo = null;
          from_subaccount = ?platformStakeSubaccount();
          created_at_time = null;
        });
        switch (result) {
          case (#Ok(idx)) #ok(idx);
          case (#Err(e)) #err(#escrow_error("Stake ICRC release failed: " # debug_show(e)));
        };
      };
    }
  };

  /// Move seized stake to treasury on seller-fault.
  public func transferToTreasury(
    settings : Admin.SystemSettings,
    treasuryId : Principal,
    token : Types.TradeToken,
    amount : Nat,
  ) : async Types.Result<Nat> {
    switch (ledgerActor(settings, token)) {
      case null return #err(#invalid_input("Stake ledger not configured."));
      case (?ledger) {
        let result = await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount;
          fee = null;
          memo = null;
          from_subaccount = ?platformStakeSubaccount();
          created_at_time = null;
        });
        switch (result) {
          case (#Ok(idx)) #ok(idx);
          case (#Err(e)) #err(#escrow_error("Stake ICRC seize transfer failed: " # debug_show(e)));
        };
      };
    }
  };

}
