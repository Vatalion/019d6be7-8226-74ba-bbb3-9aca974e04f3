import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";
import Reputation "../lib/Reputation";
import Stake "../lib/Stake";
import Payments "../lib/Payments";
import InsuranceReserve "../lib/InsuranceReserve";

/// Cross-collateral liability waterfall — manual vs ck honest copy (E6.S7 / D-023, D-041).
module {

  public let MIN_STAKE_USD_CENTS : Nat = 1_000; // 10 USDT

  public func settlementPath(trade : Types.Trade) : Types.SettlementPath {
    switch (trade.escrowAccount) {
      case (?_) #on_chain_ck;
      case null {
        switch (trade.paymentIntent) {
          case (?intent) {
            switch (intent.path) {
              case (#ck) #on_chain_ck;
              case (#manual) #manual;
            };
          };
          case null #manual;
        };
      };
    }
  };

  public func buyerObligationCents(trade : Types.Trade) : Nat {
    Payments.tokenAmountToUsdCents(trade.amount, trade.token)
  };

  /// S = max(0.05×P, 10 USDT) in USD cents (AC5).
  public func requiredStakeSeizureCents(buyerObligationCents : Nat) : Nat {
    let pct = buyerObligationCents * 5 / 100;
    if (pct > MIN_STAKE_USD_CENTS) pct else MIN_STAKE_USD_CENTS
  };

  func minNat(a : Nat, b : Nat) : Nat {
    if (a < b) a else b
  };

  func findLiabilityForTrade(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    tradeId : Types.TradeId,
  ) : ?Types.LiabilityRecord {
    for ((_, rec) in records.entries()) {
      switch (rec.tradeId) {
        case (?tid) {
          if (tid == tradeId) return ?rec;
        };
        case null {};
      };
    };
    null
  };

  func findInsurancePayoutForLiability(
    payouts : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
    liabilityId : Nat,
  ) : ?Nat {
    for ((id, req) in payouts.entries()) {
      if (req.liabilityId == liabilityId) return ?id;
    };
    null
  };

  func stakeSeizedFromAudit(rec : Types.LiabilityRecord) : Nat {
    var total : Nat = 0;
    for (entry in rec.auditTrail.vals()) {
      switch (entry.action) {
        case (#stake_applied) { total += entry.amount };
        case (_) {};
      };
    };
    total
  };

  public func evaluateCopyTier(
    path : Types.SettlementPath,
    residualCents : Nat,
    onChainRefundExpected : Bool,
  ) : Types.SettlementCopyTier {
    switch (path) {
      case (#manual) #manual_restriction_only;
      case (#on_chain_ck) {
        if (residualCents > 0) #partial_recovery
        else if (onChainRefundExpected) #on_chain_recovery
        else #partial_recovery
      };
    }
  };

  public func buildSettlementView(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    payouts : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
    trade : Types.Trade,
  ) : ?Types.SellerFaultSettlementView {
    switch (findLiabilityForTrade(records, trade.id)) {
      case null null;
      case (?rec) {
        let path = settlementPath(trade);
        let onChainRefund = path == #on_chain_ck and trade.escrowAccount != null;
        let stakeSeized = stakeSeizedFromAudit(rec);
        let copyTier = evaluateCopyTier(path, rec.remainingBalance, onChainRefund);
        ?{
          tradeId = trade.id;
          liabilityId = ?rec.id;
          path;
          copyTier;
          buyerObligationCents = rec.originalAmount;
          stakeSeizedCents = stakeSeized;
          insurancePayoutId = findInsurancePayoutForLiability(payouts, rec.id);
          residualCents = rec.remainingBalance;
          onChainRefundExpected = onChainRefund;
        }
      };
    }
  };

  public type WaterfallOutcome = {
    liabilityId : Nat;
    path : Types.SettlementPath;
    stakeSeizedCents : Nat;
    insurancePayoutId : ?Nat;
    residualCents : Nat;
    copyTier : Types.SettlementCopyTier;
  };

  func outcomeFromRecord(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    payouts : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
    trade : Types.Trade,
    liabilityId : Nat,
  ) : WaterfallOutcome {
    let path = settlementPath(trade);
    let rec = switch (records.get(liabilityId)) {
      case (?r) r;
      case null {
        return {
          liabilityId;
          path;
          stakeSeizedCents = 0;
          insurancePayoutId = findInsurancePayoutForLiability(payouts, liabilityId);
          residualCents = 0;
          copyTier = evaluateCopyTier(path, 0, trade.escrowAccount != null);
        };
      };
    };
    let onChainRefund = path == #on_chain_ck and trade.escrowAccount != null;
    {
      liabilityId;
      path;
      stakeSeizedCents = stakeSeizedFromAudit(rec);
      insurancePayoutId = findInsurancePayoutForLiability(payouts, liabilityId);
      residualCents = rec.remainingBalance;
      copyTier = evaluateCopyTier(path, rec.remainingBalance, onChainRefund);
    }
  };

  /// Enforced order: stake → (on-chain refund via escrow) → insurance → restriction (E6.S7).
  public func runSellerFaultWaterfall(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    nextLiabilityId : { var value : Nat },
    stakeBalances : Map.Map<Stake.StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    insuranceLedger : { var value : Nat },
    insuranceAccruals : Map.Map<Types.TradeId, InsuranceReserve.AccrualRecord>,
    insurancePayouts : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
    insuranceDailyPaid : Map.Map<Principal, (Nat, Types.Timestamp)>,
    nextInsurancePayoutId : { var value : Nat },
    users : Map.Map<Types.UserId, Types.User>,
    trades : Map.Map<Types.TradeId, Types.Trade>,
    trade : Types.Trade,
    seller : Types.User,
    initiator : Principal,
  ) : WaterfallOutcome {
    switch (findLiabilityForTrade(records, trade.id)) {
      case (?existing) {
        return outcomeFromRecord(records, insurancePayouts, trade, existing.id);
      };
      case null {};
    };

    let path = settlementPath(trade);
    let obligationCents = buyerObligationCents(trade);
    if (obligationCents == 0) {
      return {
        liabilityId = 0;
        path;
        stakeSeizedCents = 0;
        insurancePayoutId = null;
        residualCents = 0;
        copyTier = evaluateCopyTier(path, 0, trade.escrowAccount != null);
      };
    };

    let liabilityId = Reputation.createLiability(
      records,
      nextLiabilityId,
      seller,
      obligationCents,
      trade.token,
      #seller_fault,
      initiator,
      ?trade.id,
    );

    var stakeSeizedCents : Nat = 0;
    let targetStakeCents = requiredStakeSeizureCents(obligationCents);

    switch (Stake.seizeStake(stakeBalances, listingStakes, trade.listing, ?"seller_fault_waterfall")) {
      case (#ok(seizedAmount)) {
        let seizedCents = Payments.tokenAmountToUsdCents(seizedAmount, trade.token);
        let applyCents = minNat(minNat(seizedCents, targetStakeCents), obligationCents);
        if (applyCents > 0) {
          switch (Reputation.applyStakeSeizure(records, seller, liabilityId, applyCents, initiator)) {
            case (#ok(())) { stakeSeizedCents := applyCents };
            case (#err(_)) {};
          };
        };
      };
      case (#err(_)) {};
    };

    var residualCents = obligationCents;
    switch (records.get(liabilityId)) {
      case (?rec) { residualCents := rec.remainingBalance };
      case null {};
    };

    var insurancePayoutId : ?Nat = null;
    // Insurance is last resort after stake — ck path only; manual never claims custodial recovery.
    if (path == #on_chain_ck and residualCents > 0) {
      let unrecoveredE8s = InsuranceReserve.usdCentsToE8s(residualCents);
      let now = Types.now();
      switch (users.get(trade.buyer)) {
        case (?buyer) {
          switch (
            InsuranceReserve.requestPayout(
              insuranceLedger,
              insuranceAccruals,
              insurancePayouts,
              insuranceDailyPaid,
              users,
              trades,
              nextInsurancePayoutId,
              buyer.id,
              trade.id,
              liabilityId,
              unrecoveredE8s,
              trade.token,
              now,
            )
          ) {
            case (#ok(req)) { insurancePayoutId := ?req.id };
            case (#err(_)) {};
          };
        };
        case null {};
      };
    };

    switch (records.get(liabilityId)) {
      case (?rec) { residualCents := rec.remainingBalance };
      case null {};
    };

    let onChainRefund = path == #on_chain_ck and trade.escrowAccount != null;
    {
      liabilityId;
      path;
      stakeSeizedCents;
      insurancePayoutId;
      residualCents;
      copyTier = evaluateCopyTier(path, residualCents, onChainRefund);
    }
  };
}
