import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";
import Payments "./Payments";

/// Capped insurance reserve ledger — separate from operating treasury (E10.S4 / D-038, D-039).
/// Accrues 40% of platform fees; payouts are last-resort with strict caps and dual-admin approval.
module {

  // ─── Policy constants (D-038, D-039) ───────────────────────────────────────

  public let RESERVE_ACCRUAL_PERCENT : Nat = 40;
  public let LIQUID_FUND_PAYOUT_PERCENT : Nat = 20;
  public let DAILY_USER_CAP_USD_CENTS : Nat = 10_000; // 100 USDT
  public let TRADE_PAYOUT_CAP_USD_CENTS : Nat = 50_000; // 500 USDT
  public let INSURANCE_ELIGIBLE_MAX_TRADE_USD_CENTS : Nat = 50_000;
  public let E8S_PER_USD_CENT : Nat = 1_000_000;
  public let DAY_NS : Nat = 86_400_000_000_000;
  public let RAPID_CYCLING_WINDOW_NS : Nat = 604_800_000_000_000; // 7 days
  public let REPEATED_CLAIMS_THRESHOLD : Nat = 2;

  public type InsuranceCopyTier = {
    #stake_only;
    #no_guarantee;
    #capped_reserve;
  };

  public type CollusionSignal = {
    #shared_wallet;
    #reciprocal_trades;
    #repeated_claims;
    #rapid_account_cycling;
  };

  public type PayoutStatus = {
    #pending_first_approval;
    #pending_second_approval;
    #held_fraud_review;
    #approved;
    #denied;
    #executed;
  };

  public type AccrualRecord = {
    tradeId      : Types.TradeId;
    platformFee  : Nat;
    reserveCredit : Nat;
    token        : Types.TradeToken;
    recordedAt   : Types.Timestamp;
  };

  public type FraudReviewRecord = {
    reviewer      : Principal;
    decision      : Text;
    rationale     : Text;
    evidenceHash  : Text;
    reviewedAt    : Types.Timestamp;
    slaDueAt      : Types.Timestamp;
  };

  public type PayoutRequest = {
    id               : Nat;
    beneficiary      : Principal;
    tradeId          : Types.TradeId;
    liabilityId      : Nat;
    unrecoveredLoss  : Nat;
    approvedAmount   : Nat;
    token            : Types.TradeToken;
    var status       : PayoutStatus;
    var firstApprover : ?Principal;
    var secondApprover : ?Principal;
    collusionSignals : [CollusionSignal];
    var fraudReview  : ?FraudReviewRecord;
    requestedAt      : Types.Timestamp;
    var executedAt   : ?Types.Timestamp;
  };

  /// Candid-safe payout request snapshot (no var fields).
  public type PayoutRequestView = {
    id               : Nat;
    beneficiary      : Principal;
    tradeId          : Types.TradeId;
    liabilityId      : Nat;
    unrecoveredLoss  : Nat;
    approvedAmount   : Nat;
    token            : Types.TradeToken;
    status           : PayoutStatus;
    firstApprover    : ?Principal;
    secondApprover   : ?Principal;
    collusionSignals : [CollusionSignal];
    fraudReview      : ?FraudReviewRecord;
    requestedAt      : Types.Timestamp;
    executedAt       : Types.Timestamp;
  };

  public func toPayoutRequestView(p : PayoutRequest) : PayoutRequestView {
    {
      id = p.id;
      beneficiary = p.beneficiary;
      tradeId = p.tradeId;
      liabilityId = p.liabilityId;
      unrecoveredLoss = p.unrecoveredLoss;
      approvedAmount = p.approvedAmount;
      token = p.token;
      status = p.status;
      firstApprover = p.firstApprover;
      secondApprover = p.secondApprover;
      collusionSignals = p.collusionSignals;
      fraudReview = p.fraudReview;
      requestedAt = p.requestedAt;
      executedAt = switch (p.executedAt) { case null 0; case (?t) t };
    }
  };

  public type ProtectionView = {
    tier              : InsuranceCopyTier;
    liquidBalanceE8s  : Nat;
    tradeAmountUsdCents : Nat;
    maxPayoutE8s      : Nat;
    dailyRemainingE8s : Nat;
    insuranceOffered  : Bool;
  };

  public type ReserveLedgerView = {
    liquidBalanceE8s : Nat;
    accrualCount     : Nat;
    pendingPayouts   : Nat;
  };

  // ─── Conversions ───────────────────────────────────────────────────────────

  public func e8sToUsdCents(amountE8s : Nat) : Nat {
    amountE8s / E8S_PER_USD_CENT
  };

  public func usdCentsToE8s(cents : Nat) : Nat {
    cents * E8S_PER_USD_CENT
  };

  func minNat(a : Nat, b : Nat) : Nat {
    if (a < b) a else b
  };

  func minNat4(a : Nat, b : Nat, c : Nat, d : Nat) : Nat {
    minNat(minNat(a, b), minNat(c, d))
  };

  func dayStart(now : Types.Timestamp) : Types.Timestamp {
    (now / DAY_NS) * DAY_NS
  };

  // ─── Accrual (AC 1) ────────────────────────────────────────────────────────

  public func accrualFromPlatformFee(platformFee : Nat) : Nat {
    platformFee * RESERVE_ACCRUAL_PERCENT / 100
  };

  /// Idempotent per tradeId — credits insurance ledger, not seized stake.
  public func accrueFromPlatformFee(
    ledgerBalance : { var value : Nat },
    accruals      : Map.Map<Types.TradeId, AccrualRecord>,
    tradeId       : Types.TradeId,
    platformFee   : Nat,
    token         : Types.TradeToken,
  ) : Nat {
    if (accruals.containsKey(tradeId)) return 0;
    let credit = accrualFromPlatformFee(platformFee);
    if (credit == 0) return 0;
    ledgerBalance.value += credit;
    accruals.add(
      tradeId,
      {
        tradeId;
        platformFee;
        reserveCredit = credit;
        token;
        recordedAt = Types.now();
      },
    );
    credit
  };

  // ─── Eligibility + copy tier (AC 3, 4) ───────────────────────────────────

  public func evaluateProtectionTier(
    tradeAmountUsdCents : Nat,
    liquidBalanceE8s  : Nat,
  ) : InsuranceCopyTier {
    if (tradeAmountUsdCents > INSURANCE_ELIGIBLE_MAX_TRADE_USD_CENTS) {
      return #stake_only;
    };
    if (liquidBalanceE8s == 0) {
      return #no_guarantee;
    };
    #capped_reserve
  };

  public func insuranceOffered(
    tradeAmountUsdCents : Nat,
    liquidBalanceE8s  : Nat,
  ) : Bool {
    tradeAmountUsdCents <= INSURANCE_ELIGIBLE_MAX_TRADE_USD_CENTS
    and liquidBalanceE8s > 0
  };

  public func buildProtectionView(
    tradeAmount   : Nat,
    tradeToken    : Types.TradeToken,
    liquidBalanceE8s : Nat,
    dailyPaidE8s     : Nat,
  ) : ProtectionView {
    let tradeUsdCents = Payments.tokenAmountToUsdCents(tradeAmount, tradeToken);
    let tier = evaluateProtectionTier(tradeUsdCents, liquidBalanceE8s);
    let dailyRemaining = dailyRemainingE8s(dailyPaidE8s);
    let maxPayout = if (insuranceOffered(tradeUsdCents, liquidBalanceE8s)) {
      computePayoutCap(
        usdCentsToE8s(tradeUsdCents),
        liquidBalanceE8s,
        dailyPaidE8s,
        tradeUsdCents,
      )
    } else { 0 };
    {
      tier = tier;
      liquidBalanceE8s = liquidBalanceE8s;
      tradeAmountUsdCents = tradeUsdCents;
      maxPayoutE8s = maxPayout;
      dailyRemainingE8s = dailyRemaining;
      insuranceOffered = insuranceOffered(tradeUsdCents, liquidBalanceE8s);
    }
  };

  // ─── Payout caps (AC 2, 8) ───────────────────────────────────────────────

  public func dailyRemainingE8s(dailyPaidE8s : Nat) : Nat {
    let capE8s = usdCentsToE8s(DAILY_USER_CAP_USD_CENTS);
    if (dailyPaidE8s >= capE8s) 0 else capE8s - dailyPaidE8s
  };

  /// min(unrecovered, 20% liquid fund, 100 USDT/user/day, 500 USDT/trade cap)
  public func computePayoutCap(
    unrecoveredLossE8s  : Nat,
    liquidFundE8s       : Nat,
    dailyPaidE8s        : Nat,
    tradeAmountUsdCents : Nat,
  ) : Nat {
    if (not insuranceOffered(tradeAmountUsdCents, liquidFundE8s)) {
      return 0;
    };
    let liquidCap = liquidFundE8s * LIQUID_FUND_PAYOUT_PERCENT / 100;
    let dailyRemaining = dailyRemainingE8s(dailyPaidE8s);
    let tradeCap = usdCentsToE8s(
      minNat(tradeAmountUsdCents, TRADE_PAYOUT_CAP_USD_CENTS),
    );
    minNat4(unrecoveredLossE8s, liquidCap, dailyRemaining, tradeCap)
  };

  // ─── Collusion graph (AC 6) ────────────────────────────────────────────────

  public func detectCollusionSignals(
    users     : Map.Map<Types.UserId, Types.User>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    payouts   : Map.Map<Nat, PayoutRequest>,
    beneficiary : Principal,
    seller    : Principal,
    tradeId   : Types.TradeId,
    now       : Types.Timestamp,
  ) : [CollusionSignal] {
    var signals : [CollusionSignal] = [];
    switch (users.get(beneficiary), users.get(seller)) {
      case (?buyer, ?sellerUser) {
        let buyerWallets = walletAddresses(buyer.linkedWallets);
        let sellerWallets = walletAddresses(sellerUser.linkedWallets);
        for (bw in buyerWallets.vals()) {
          for (sw in sellerWallets.vals()) {
            if (bw == sw) {
              signals := signals.concat([#shared_wallet]);
            };
          };
        };
      };
      case (_, _) {};
    };
    var reciprocal = false;
    for ((tid, t) in trades.entries()) {
      if (tid != tradeId and t.buyer == seller and t.seller == beneficiary) {
        reciprocal := true;
      };
    };
    if (reciprocal) {
      signals := signals.concat([#reciprocal_trades]);
    };
    var priorClaims : Nat = 0;
    for ((_, req) in payouts.entries()) {
      if (req.beneficiary == beneficiary and req.status != #denied) {
        priorClaims += 1;
      };
    };
    if (priorClaims >= REPEATED_CLAIMS_THRESHOLD) {
      signals := signals.concat([#repeated_claims]);
    };
    switch (users.get(beneficiary)) {
      case (?u) {
        let accountAge = now - u.createdAt;
        if (accountAge < RAPID_CYCLING_WINDOW_NS and priorClaims > 0) {
          signals := signals.concat([#rapid_account_cycling]);
        };
      };
      case null {};
    };
    signals
  };

  func walletAddresses(wallets : [Types.LinkedExternalWallet]) : [Text] {
    var addrs : [Text] = [];
    for (w in wallets.vals()) {
      addrs := addrs.concat([w.address]);
    };
    addrs
  };

  func dailyPaidForUser(
    dailyPayouts : Map.Map<Principal, (Nat, Types.Timestamp)>,
    user         : Principal,
    now          : Types.Timestamp,
  ) : Nat {
    switch (dailyPayouts.get(user)) {
      case (?(amount, windowStart)) {
        if (windowStart == dayStart(now)) amount else 0
      };
      case null 0;
    };
  };

  func recordDailyPayout(
    dailyPayouts : Map.Map<Principal, (Nat, Types.Timestamp)>,
    user         : Principal,
    amount       : Nat,
    now          : Types.Timestamp,
  ) {
    let start = dayStart(now);
    switch (dailyPayouts.get(user)) {
      case (?(prev, windowStart)) {
        if (windowStart == start) {
          dailyPayouts.add(user, (prev + amount, start));
        } else {
          dailyPayouts.add(user, (amount, start));
        };
      };
      case null dailyPayouts.add(user, (amount, start));
    };
  };

  // ─── Payout workflow (AC 5–7) ──────────────────────────────────────────────

  public func requestPayout(
    ledgerBalance : { var value : Nat },
    accruals      : Map.Map<Types.TradeId, AccrualRecord>,
    payouts       : Map.Map<Nat, PayoutRequest>,
    dailyPayouts  : Map.Map<Principal, (Nat, Types.Timestamp)>,
    users         : Map.Map<Types.UserId, Types.User>,
    trades        : Map.Map<Types.TradeId, Types.Trade>,
    nextPayoutId  : { var value : Nat },
    beneficiary   : Principal,
    tradeId       : Types.TradeId,
    liabilityId   : Nat,
    unrecoveredLossE8s : Nat,
    token         : Types.TradeToken,
    now           : Types.Timestamp,
  ) : Types.Result<PayoutRequest> {
    switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?trade) {
        let tradeUsdCents = Payments.tokenAmountToUsdCents(trade.amount, trade.token);
        if (tradeUsdCents > INSURANCE_ELIGIBLE_MAX_TRADE_USD_CENTS) {
          return #err(#invalid_input("insurance not offered for trades above 500 USDT"));
        };
        let dailyPaid = dailyPaidForUser(dailyPayouts, beneficiary, now);
        let approvedAmount = computePayoutCap(
          unrecoveredLossE8s,
          ledgerBalance.value,
          dailyPaid,
          tradeUsdCents,
        );
        if (approvedAmount == 0) {
          return #err(#invalid_input("payout cap exhausted or reserve empty"));
        };
        let signals = detectCollusionSignals(
          users, trades, payouts, beneficiary, trade.seller, tradeId, now,
        );
        let status : PayoutStatus = if (signals.size() > 0) {
          #held_fraud_review
        } else {
          #pending_first_approval
        };
        let id = nextPayoutId.value;
        nextPayoutId.value += 1;
        let req : PayoutRequest = {
          id;
          beneficiary;
          tradeId;
          liabilityId;
          unrecoveredLoss = unrecoveredLossE8s;
          approvedAmount;
          token;
          var status = status;
          var firstApprover = null;
          var secondApprover = null;
          collusionSignals = signals;
          var fraudReview = null;
          requestedAt = now;
          var executedAt = null;
        };
        payouts.add(id, req);
        #ok(req)
      };
    }
  };

  public func approvePayout(
    ledgerBalance : { var value : Nat },
    payouts       : Map.Map<Nat, PayoutRequest>,
    dailyPayouts  : Map.Map<Principal, (Nat, Types.Timestamp)>,
    caller        : Principal,
    payoutId      : Nat,
    now           : Types.Timestamp,
  ) : Types.Result<PayoutRequest> {
    switch (payouts.get(payoutId)) {
      case null return #err(#not_found);
      case (?req) {
        switch (req.status) {
          case (#held_fraud_review) return #err(#invalid_input("payout held for fraud review"));
          case (#denied or #executed) return #err(#already_exists);
          case (#pending_first_approval) {
            req.firstApprover := ?caller;
            req.status := #pending_second_approval;
            #ok(req)
          };
          case (#pending_second_approval) {
            switch (req.firstApprover) {
              case null return #err(#invalid_input("missing first approver"));
              case (?first) {
                if (Principal.equal(first, caller)) {
                  return #err(#unauthorized);
                };
                req.secondApprover := ?caller;
                req.status := #approved;
                #ok(req)
              };
            };
          };
          case (#approved) {
            if (req.approvedAmount > ledgerBalance.value) {
              return #err(#insufficient_funds);
            };
            ledgerBalance.value -= req.approvedAmount;
            recordDailyPayout(dailyPayouts, req.beneficiary, req.approvedAmount, now);
            req.status := #executed;
            req.executedAt := ?now;
            #ok(req)
          };
        }
      };
    }
  };

  public func resolveFraudReview(
    payouts  : Map.Map<Nat, PayoutRequest>,
    reviewer : Principal,
    payoutId : Nat,
    approve  : Bool,
    rationale : Text,
    evidenceHash : Text,
    now      : Types.Timestamp,
  ) : Types.Result<PayoutRequest> {
    switch (payouts.get(payoutId)) {
      case null return #err(#not_found);
      case (?req) {
        if (req.status != #held_fraud_review) {
          return #err(#invalid_input("payout not held for fraud review"));
        };
        let slaDueAt = req.requestedAt + (3 * DAY_NS);
        req.fraudReview := ?{
          reviewer;
          decision = if (approve) "approved" else "denied";
          rationale;
          evidenceHash;
          reviewedAt = now;
          slaDueAt;
        };
        req.status := if (approve) {
          #pending_first_approval
        } else {
          #denied
        };
        #ok(req)
      };
    }
  };

  public func reserveLedgerView(
    ledgerBalance : Nat,
    accruals      : Map.Map<Types.TradeId, AccrualRecord>,
    payouts       : Map.Map<Nat, PayoutRequest>,
  ) : ReserveLedgerView {
    var pending : Nat = 0;
    for ((_, req) in payouts.entries()) {
      switch (req.status) {
        case (#pending_first_approval or #pending_second_approval or #held_fraud_review or #approved) {
          pending += 1;
        };
        case (_) {};
      };
    };
    {
      liquidBalanceE8s = ledgerBalance;
      accrualCount = accruals.size();
      pendingPayouts = pending;
    }
  };

  public func countAccruals(accruals : Map.Map<Types.TradeId, AccrualRecord>) : Nat {
    accruals.size()
  };
}
