import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types";
import Auth "../lib/Auth";
import Admin "../lib/Admin";
import InsuranceReserve "../lib/InsuranceReserve";
import Runtime "mo:core/Runtime";

/// Insurance reserve API — capped ledger, protection views, dual-admin payouts (E10.S4).
mixin (
  users              : Map.Map<Types.UserId, Types.User>,
  trades             : Map.Map<Types.TradeId, Types.Trade>,
  auditLog           : List.List<Admin.AuditEntry>,
  nextAuditId        : { var value : Nat },
  insuranceLedger    : { var value : Nat },
  insuranceAccruals  : Map.Map<Types.TradeId, InsuranceReserve.AccrualRecord>,
  insurancePayouts   : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
  insuranceDailyPaid : Map.Map<Principal, (Nat, Types.Timestamp)>,
  nextInsurancePayoutId : { var value : Nat },
) {

  func assertAdmin(caller : Principal) : () {
    Auth.assertNotAnonymous(caller);
    if (not Auth.canActAsAdmin(Auth.requireUser(users, caller))) {
      Runtime.trap("unauthorized: admin required");
    };
  };

  func appendInsuranceAudit(
    caller : Principal,
    action : Text,
    details : Text,
  ) {
    auditLog.add({
      id = nextAuditId.value;
      action = action;
      actorId = caller;
      targetId = null;
      timestamp = Types.now();
      details = details;
    });
    nextAuditId.value += 1;
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  public shared query func getInsuranceProtectionView(
    tradeAmount : Nat,
    tradeToken : Types.TradeToken,
  ) : async InsuranceReserve.ProtectionView {
    InsuranceReserve.buildProtectionView(
      tradeAmount,
      tradeToken,
      insuranceLedger.value,
      0,
    )
  };

  public shared query func getInsuranceReserveLedger() : async InsuranceReserve.ReserveLedgerView {
    InsuranceReserve.reserveLedgerView(
      insuranceLedger.value,
      insuranceAccruals,
      insurancePayouts,
    )
  };

  public shared query func getInsurancePayoutRequest(
    payoutId : Nat,
  ) : async ?InsuranceReserve.PayoutRequestView {
    switch (insurancePayouts.get(payoutId)) {
      case null null;
      case (?p) ?InsuranceReserve.toPayoutRequestView(p);
    }
  };

  // ─── Internal accrual hook (called from governance fee recording) ─────────

  func accrueInsuranceFromPlatformFee(
    tradeId     : Types.TradeId,
    platformFee : Nat,
    token       : Types.TradeToken,
  ) : Nat {
    InsuranceReserve.accrueFromPlatformFee(
      insuranceLedger,
      insuranceAccruals,
      tradeId,
      platformFee,
      token,
    )
  };

  // ─── Admin payout workflow ─────────────────────────────────────────────────

  public shared ({ caller }) func adminRequestInsurancePayout(
    tradeId           : Types.TradeId,
    beneficiary       : Principal,
    liabilityId       : Nat,
    unrecoveredLossE8s : Nat,
    token             : Types.TradeToken,
  ) : async Types.Result<InsuranceReserve.PayoutRequestView> {
    assertAdmin(caller);
    if (unrecoveredLossE8s == 0) {
      return #err(#invalid_input("unrecovered loss must be positive"));
    };
    let now = Types.now();
    switch (
      InsuranceReserve.requestPayout(
        insuranceLedger,
        insuranceAccruals,
        insurancePayouts,
        insuranceDailyPaid,
        users,
        trades,
        nextInsurancePayoutId,
        beneficiary,
        tradeId,
        liabilityId,
        unrecoveredLossE8s,
        token,
        now,
      )
    ) {
      case (#ok(req)) {
        appendInsuranceAudit(
          caller,
          "insurancePayoutRequested",
          "payoutId=" # req.id.toText()
            # " tradeId=" # tradeId.toText()
            # " liabilityId=" # liabilityId.toText()
            # " amount=" # req.approvedAmount.toText()
            # " status=" # debug_show(req.status),
        );
        #ok(InsuranceReserve.toPayoutRequestView(req))
      };
      case (#err e) #err(e);
    }
  };

  public shared ({ caller }) func adminApproveInsurancePayout(
    payoutId : Nat,
  ) : async Types.Result<InsuranceReserve.PayoutRequestView> {
    assertAdmin(caller);
    let now = Types.now();
    switch (
      InsuranceReserve.approvePayout(
        insuranceLedger,
        insurancePayouts,
        insuranceDailyPaid,
        caller,
        payoutId,
        now,
      )
    ) {
      case (#ok(req)) {
        appendInsuranceAudit(
          caller,
          "insurancePayoutApproval",
          "payoutId=" # payoutId.toText()
            # " status=" # debug_show(req.status)
            # " liabilityId=" # req.liabilityId.toText(),
        );
        if (req.status == #executed) {
          appendInsuranceAudit(
            caller,
            "insurancePayoutExecuted",
            "payoutId=" # payoutId.toText()
              # " beneficiary=" # req.beneficiary.toText()
              # " amount=" # req.approvedAmount.toText()
              # " liabilityId=" # req.liabilityId.toText(),
          );
        };
        #ok(InsuranceReserve.toPayoutRequestView(req))
      };
      case (#err e) #err(e);
    }
  };

  public shared ({ caller }) func adminResolveInsuranceFraudReview(
    payoutId     : Nat,
    approve      : Bool,
    rationale    : Text,
    evidenceHash : Text,
  ) : async Types.Result<InsuranceReserve.PayoutRequestView> {
    assertAdmin(caller);
    if (rationale.size() == 0) {
      return #err(#invalid_input("rationale required"));
    };
    switch (
      InsuranceReserve.resolveFraudReview(
        insurancePayouts,
        caller,
        payoutId,
        approve,
        rationale,
        evidenceHash,
        Types.now(),
      )
    ) {
      case (#ok(req)) {
        appendInsuranceAudit(
          caller,
          "insuranceFraudReview",
          "payoutId=" # payoutId.toText()
            # " decision=" # (if (approve) "approved" else "denied")
            # " evidenceHash=" # evidenceHash
            # " liabilityId=" # req.liabilityId.toText(),
        );
        #ok(InsuranceReserve.toPayoutRequestView(req))
      };
      case (#err e) #err(e);
    }
  };
}
