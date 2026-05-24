/// Treasury.test.mo — operating treasury + capped insurance reserve (E10.S3/E10.S4)

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Treasury "../src/backend/lib/Treasury";
import InsuranceReserve "../src/backend/lib/InsuranceReserve";
import Types "../src/backend/types";

let tradeId : Nat = 42;
let token = #USDT_TRC20;

func emptyFees() : Map.Map<Types.TradeId, Treasury.FeeRecord> {
  Map.empty<Types.TradeId, Treasury.FeeRecord>()
};

func emptyAccruals() : Map.Map<Types.TradeId, InsuranceReserve.AccrualRecord> {
  Map.empty<Types.TradeId, InsuranceReserve.AccrualRecord>()
};

suite("Treasury — recordFee", func() {
  test("recordFee is idempotent per tradeId", func() {
    let fees = emptyFees();
    Treasury.recordFee(fees, tradeId, 1_000_000, token);
    Treasury.recordFee(fees, tradeId, 1_000_000, token);
    expect.nat(fees.size()).equal(1);
  });
});

suite("InsuranceReserve — accrual (W3-6)", func() {
  test("40% of platform fee credits insurance ledger", func() {
    let ledger = { var value = 0 : Nat };
    let accruals = emptyAccruals();
    let platformFee : Nat = 10_000_000; // 0.1 USDT in e8s
    let credit = InsuranceReserve.accrueFromPlatformFee(
      ledger, accruals, tradeId, platformFee, token,
    );
    expect.nat(credit).equal(4_000_000);
    expect.nat(ledger.value).equal(4_000_000);
    expect.nat(InsuranceReserve.countAccruals(accruals)).equal(1);
  });

  test("accrual is idempotent per tradeId", func() {
    let ledger = { var value = 0 : Nat };
    let accruals = emptyAccruals();
    ignore InsuranceReserve.accrueFromPlatformFee(ledger, accruals, tradeId, 10_000_000, token);
    let second = InsuranceReserve.accrueFromPlatformFee(ledger, accruals, tradeId, 10_000_000, token);
    expect.nat(second).equal(0);
    expect.nat(ledger.value).equal(4_000_000);
  });
});

suite("InsuranceReserve — payout caps (W3-7)", func() {
  test("payout capped by min(loss, 20% fund, daily, trade)", func() {
    let liquidFund : Nat = 500_000_000; // 5 USDT
    let unrecovered : Nat = 200_000_000; // 2 USDT
    let tradeUsdCents : Nat = 30_000; // 300 USDT trade
    let cap = InsuranceReserve.computePayoutCap(
      unrecovered,
      liquidFund,
      0,
      tradeUsdCents,
    );
    // 20% of 5 USDT = 1 USDT = 100_000_000 e8s — tightest cap vs 2 USDT loss
    expect.nat(cap).equal(100_000_000);
  });

  test("trade above 500 USDT — insurance not offered", func() {
    let tier = InsuranceReserve.evaluateProtectionTier(50_001, 1_000_000_000);
    switch (tier) {
      case (#stake_only) {};
      case (_) { assert false };
    };
    expect.nat(
      InsuranceReserve.computePayoutCap(1_000_000_000, 1_000_000_000, 0, 50_001),
    ).equal(0);
  });

  test("daily cap denies excess payout", func() {
    let dailyPaid = InsuranceReserve.usdCentsToE8s(10_000); // already at 100 USDT/day
    let cap = InsuranceReserve.computePayoutCap(
      200_000_000,
      1_000_000_000,
      dailyPaid,
      10_000,
    );
    expect.nat(cap).equal(0);
  });
});

suite("InsuranceReserve — honest copy tier (W3-8)", func() {
  test("zero fund → no guarantee tier", func() {
    let view = InsuranceReserve.buildProtectionView(100_000_000, #USDT_TRC20, 0, 0);
    switch (view.tier) {
      case (#no_guarantee) {};
      case (_) { assert false };
    };
    expect.bool(view.insuranceOffered).equal(false);
  });

  test("funded reserve → capped_reserve tier", func() {
    let view = InsuranceReserve.buildProtectionView(100_000_000, #USDT_TRC20, 50_000_000, 0);
    switch (view.tier) {
      case (#capped_reserve) {};
      case (_) { assert false };
    };
    expect.bool(view.insuranceOffered).equal(true);
  });
});

suite("InsuranceReserve — dual-admin + fraud hold", func() {
  func emptyUser(principal : Principal) : Types.User {
    {
      id = principal;
      var username = "u";
      var bio = "";
      var avatarUrl = "";
      var role = #admin;
      var reputationScore = 0;
      var buyerScore = 0;
      var sellerScore = 0;
      var trustLevel = #new_;
      var kycTier = #none;
      var liabilityBalance = 0;
      var liabilityHistory = [];
      var paymentMethods = [];
      var linkedWallets = [];
      createdAt = Types.now();
      var suspendedUntil = null;
      var isBanned = false;
      var accountClosedAt = null;
    }
  };

  func seedTrade(id : Nat, buyer : Principal, seller : Principal, amount : Nat) : Types.Trade {
    {
      id = id;
      listing = 1;
      buyer;
      seller;
      amount;
      token = #USDT_TRC20;
      var status = #complete;
      createdAt = Types.now();
      var fundedAt = null;
      var confirmedAt = null;
      var completedAt = null;
      var refundDeadline = null;
      var sellerResponseDeadline = null;
      var escrowAccount = null;
      var shippingSelection = null;
      var ttnNumber = null;
      var ttnCreationStatus = #Pending;
      var digitalDelivery = null;
      var deliveryRecordAt = null;
      var payoutWalletSnapshot = null;
      var payoutWalletHeld = false;
      var paymentIntent = null;
      var shipByDeadline = null;
      var shippedAt = null;
      var npDeliveredAt = null;
      var npDeliveredGraceEndsAt = null;
      var pendingOnChainSettlement = null;
    }
  };

  test("collusion signals hold payout for manual review", func() {
    let buyer = Principal.fromText("2vxsx-fae");
    let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(buyer, emptyUser(buyer));
    users.add(seller, emptyUser(seller));
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    trades.add(1, seedTrade(1, buyer, seller, 100_000_000));
    trades.add(2, seedTrade(2, seller, buyer, 100_000_000)); // reciprocal
    let ledger = { var value = 500_000_000 : Nat };
    let accruals = emptyAccruals();
    let payouts = Map.empty<Nat, InsuranceReserve.PayoutRequest>();
    let daily = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let nextId = { var value = 1 : Nat };
    switch (
      InsuranceReserve.requestPayout(
        ledger, accruals, payouts, daily, users, trades, nextId,
        buyer, 1, 9001, 50_000_000, token, Types.now(),
      )
    ) {
      case (#ok(req)) {
        switch (req.status) {
          case (#held_fraud_review) {};
          case (_) { assert false };
        };
        expect.nat(req.collusionSignals.size()).greater(0);
      };
      case (#err(_)) { assert false };
    };
  });

  test("dual-admin approval then executes with audit trail fields", func() {
    let buyer = Principal.fromText("2vxsx-fae");
    let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
    let admin1 = Principal.fromText("aaaaa-aa");
    let admin2 = Principal.fromText("ezvyz-ryaaa-aaabq-adjqc-a");
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(buyer, emptyUser(buyer));
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    trades.add(5, seedTrade(5, buyer, seller, 100_000_000));
    let ledger = { var value = 500_000_000 : Nat };
    let accruals = emptyAccruals();
    let payouts = Map.empty<Nat, InsuranceReserve.PayoutRequest>();
    let daily = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let nextId = { var value = 1 : Nat };
    let req : InsuranceReserve.PayoutRequest = switch (
      InsuranceReserve.requestPayout(
        ledger, accruals, payouts, daily, users, trades, nextId,
        buyer, 5, 42, 50_000_000, token, Types.now(),
      )
    ) {
      case (#ok(r)) r;
      case (#err(_)) { assert false; {
        id = 0;
        beneficiary = buyer;
        tradeId = 0;
        liabilityId = 0;
        unrecoveredLoss = 0;
        approvedAmount = 0;
        token = #USDT_TRC20;
        var status = #denied;
        var firstApprover = null;
        var secondApprover = null;
        collusionSignals = [];
        var fraudReview = null;
        requestedAt = 0;
        var executedAt = null;
      } };
    };
    ignore InsuranceReserve.approvePayout(ledger, payouts, daily, admin1, req.id, Types.now());
    switch (InsuranceReserve.approvePayout(ledger, payouts, daily, admin2, req.id, Types.now())) {
      case (#ok(final)) {
        switch (final.status) {
          case (#approved) {};
          case (_) { assert false };
        };
      };
      case (#err(_)) { assert false };
    };
    switch (InsuranceReserve.approvePayout(ledger, payouts, daily, admin2, req.id, Types.now())) {
      case (#ok(executed)) {
        switch (executed.status) {
          case (#executed) {
            expect.nat(executed.liabilityId).equal(42);
          };
          case (_) { assert false };
        };
      };
      case (#err(_)) { assert false };
    };
  });

  test("fraud review retains decision metadata", func() {
    let payouts = Map.empty<Nat, InsuranceReserve.PayoutRequest>();
    let heldReq : InsuranceReserve.PayoutRequest = {
      id = 1;
      beneficiary = Principal.fromText("2vxsx-fae");
      tradeId = 1;
      liabilityId = 7;
      unrecoveredLoss = 10_000_000;
      approvedAmount = 5_000_000;
      token = #USDT_TRC20;
      var status = #held_fraud_review;
      var firstApprover = null : ?Principal;
      var secondApprover = null : ?Principal;
      collusionSignals = [#repeated_claims];
      var fraudReview = null : ?InsuranceReserve.FraudReviewRecord;
      requestedAt = Types.now();
      var executedAt = null : ?Types.Timestamp;
    };
    payouts.add(1, heldReq);
    let reviewer = Principal.fromText("aaaaa-aa");
    switch (
      InsuranceReserve.resolveFraudReview(
        payouts, reviewer, 1, true, "cleared after review", "sha256:abc", Types.now(),
      )
    ) {
      case (#ok(req)) {
        switch (req.fraudReview) {
          case (?review) {
            expect.text(review.decision).equal("approved");
            expect.text(review.evidenceHash).equal("sha256:abc");
          };
          case null { assert false };
        };
        switch (req.status) {
          case (#pending_first_approval) {};
          case (_) { assert false };
        };
      };
      case (#err(_)) { assert false };
    };
  });
});
