import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types";

/// Treasury — tracks accumulated platform fees, total balance, and withdrawal history.
/// All functions are pure (state injected).
module {

  // ─── Types ────────────────────────────────────────────────────────────────

  public type FeeRecord = {
    tradeId   : Types.TradeId;
    amount    : Nat;
    token     : Types.TradeToken;
    recordedAt : Types.Timestamp;
  };

  public type WithdrawalRecord = {
    id          : Nat;
    proposalId  : Nat;
    recipient   : Principal;
    amount      : Nat;
    executedAt  : Types.Timestamp;
  };

  // ─── recordFee ────────────────────────────────────────────────────────────

  /// Record a platform fee for a completed trade.
  /// Idempotent: if tradeId already recorded, does nothing (no double-counting).
  public func recordFee(
    fees    : Map.Map<Types.TradeId, FeeRecord>,
    tradeId : Types.TradeId,
    amount  : Nat,
    token   : Types.TradeToken,
  ) : () {
    if (fees.containsKey(tradeId)) return;
    let rec : FeeRecord = {
      tradeId;
      amount;
      token;
      recordedAt = Types.now();
    };
    fees.add(tradeId, rec);
  };

  // ─── getBalance ───────────────────────────────────────────────────────────

  /// Returns total accumulated fee amount (all tokens summed as raw Nat).
  /// Governance proposals should specify a particular token; raw sum is for display.
  public func getBalance(
    fees        : Map.Map<Types.TradeId, FeeRecord>,
    withdrawals : List.List<WithdrawalRecord>,
  ) : Nat {
    let totalFees = fees.foldLeft(
      0 : Nat,
      func(acc : Nat, _tid : Types.TradeId, rec : FeeRecord) : Nat { acc + rec.amount },
    );
    let totalWithdrawn = withdrawals.foldLeft(
      0 : Nat,
      func(acc : Nat, w : WithdrawalRecord) : Nat { acc + w.amount },
    );
    if (totalFees > totalWithdrawn) totalFees - totalWithdrawn else 0
  };

  // ─── transferToWinner ─────────────────────────────────────────────────────

  /// Record a treasury withdrawal after a governance proposal execution.
  /// Returns the new withdrawal id (nextWithdrawalId + 1).
  public func transferToWinner(
    fees        : Map.Map<Types.TradeId, FeeRecord>,
    withdrawals : List.List<WithdrawalRecord>,
    nextId      : Nat,
    proposalId  : Nat,
    recipient   : Principal,
    amount      : Nat,
  ) : Nat {
    let balance = getBalance(fees, withdrawals);
    if (amount > balance) {
      Runtime.trap("insufficient treasury balance: requested " # debug_show(amount)
        # " available " # debug_show(balance));
    };
    let rec : WithdrawalRecord = {
      id         = nextId;
      proposalId;
      recipient;
      amount;
      executedAt = Types.now();
    };
    withdrawals.add(rec);
    nextId + 1
  };

  // ─── getWithdrawalHistory ─────────────────────────────────────────────────

  public func getWithdrawalHistory(
    withdrawals : List.List<WithdrawalRecord>,
  ) : [WithdrawalRecord] {
    withdrawals.toArray()
  };
}
