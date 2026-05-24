/// LiabilityWaterfall.test.mo — E6.S7 manual vs ck seller-fault waterfall (W3-9)

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import LiabilityWaterfall "../src/backend/lib/LiabilityWaterfall";
import Stake "../src/backend/lib/Stake";
import InsuranceReserve "../src/backend/lib/InsuranceReserve";
import Types "../src/backend/types";

let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let buyer = Principal.fromText("2vxsx-fae");
let token = #USDT_TRC20;

func emptyUser(id : Principal) : Types.User {
  {
    id;
    var username = "u";
    var bio = "";
    var avatarUrl = "";
    var role = #user;
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

func seedTrade(
  id : Nat,
  amount : Nat,
  escrow : ?Types.EscrowAccount,
  intent : ?Types.PaymentIntent,
) : Types.Trade {
  {
    id;
    listing = 1;
    buyer;
    seller;
    amount;
    token;
    var status = #payment_verified;
    createdAt = Types.now();
    var fundedAt = null;
    var confirmedAt = null;
    var completedAt = null;
    var refundDeadline = null;
    var sellerResponseDeadline = null;
    var escrowAccount = escrow;
    var shippingSelection = null;
    var ttnNumber = null;
    var ttnCreationStatus = #Pending;
    var digitalDelivery = null;
    var deliveryRecordAt = null;
    var payoutWalletSnapshot = null;
    var payoutWalletHeld = false;
    var paymentIntent = intent;
    var shipByDeadline = null;
    var shippedAt = null;
    var npDeliveredAt = null;
    var npDeliveredGraceEndsAt = null;
    var pendingOnChainSettlement = null;
  }
};

func lockStakeForListing(listingId : Nat, priceAmount : Nat) : (
  Map.Map<Stake.StakeKey, Types.StakeBalance>,
  Map.Map<Types.ListingId, Types.ListingStakeRecord>,
) {
  let balances = Map.empty<Stake.StakeKey, Types.StakeBalance>();
  let listingStakes = Map.empty<Types.ListingId, Types.ListingStakeRecord>();
  ignore Stake.depositStake(balances, seller, token, 20_000_000);
  ignore Stake.lockListingStake(balances, listingStakes, listingId, seller, priceAmount, token, Types.now());
  (balances, listingStakes)
};

suite("LiabilityWaterfall — path detection (W3-9)", func() {
  test("manual payment_verified → manual path only", func() {
    let trade = seedTrade(1, 100_000_000, null, ?{
      token;
      network = "TRC20";
      exactAmount = 100_000_000;
      recipient = "TAddr";
      expiry = Types.now();
      path = #manual;
      createdAt = Types.now();
    });
    switch (LiabilityWaterfall.settlementPath(trade)) {
      case (#manual) {};
      case (_) { assert false };
    };
  });

  test("funded_locked ck trade → on_chain_ck path", func() {
    let trade = seedTrade(
      2,
      100_000_000,
      ?{
        tradeId = 2;
        buyerPrincipal = buyer;
        sellerPrincipal = seller;
        token = #ckUSDC;
        amount = 100_000_000;
        fee = 1_000_000;
        ledgerCanisterId = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");
        lockedAt = Types.now();
        deadline = Types.now();
      },
      null,
    );
    switch (LiabilityWaterfall.settlementPath(trade)) {
      case (#on_chain_ck) {};
      case (_) { assert false };
    };
  });
});

suite("LiabilityWaterfall — stake before insurance (AC4, AC5)", func() {
  test("required stake S = max(5%×P, 10 USDT)", func() {
    expect.nat(LiabilityWaterfall.requiredStakeSeizureCents(5_000)).equal(1_000);
    expect.nat(LiabilityWaterfall.requiredStakeSeizureCents(50_000)).equal(2_500);
  });

  test("manual seller fault — stake + restriction, no insurance request", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextLiabilityId = { var value = 1 : Nat };
    let (stakeBalances, listingStakes) = lockStakeForListing(1, 100_000_000);
    let ledger = { var value = 500_000_000 : Nat };
    let accruals = Map.empty<Types.TradeId, InsuranceReserve.AccrualRecord>();
    let payouts = Map.empty<Nat, InsuranceReserve.PayoutRequest>();
    let daily = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let nextPayoutId = { var value = 1 : Nat };
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(seller, emptyUser(seller));
    users.add(buyer, emptyUser(buyer));
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = seedTrade(1, 100_000_000, null, ?{
      token;
      network = "TRC20";
      exactAmount = 100_000_000;
      recipient = "TAddr";
      expiry = Types.now();
      path = #manual;
      createdAt = Types.now();
    });
    trades.add(1, trade);
    let outcome = LiabilityWaterfall.runSellerFaultWaterfall(
      records,
      nextLiabilityId,
      stakeBalances,
      listingStakes,
      ledger,
      accruals,
      payouts,
      daily,
      nextPayoutId,
      users,
      trades,
      trade,
      emptyUser(seller),
      seller,
    );
    switch (outcome.path) {
      case (#manual) {};
      case (_) { assert false };
    };
    switch (outcome.copyTier) {
      case (#manual_restriction_only) {};
      case (_) { assert false };
    };
    expect.nat(outcome.stakeSeizedCents).equal(1_000);
    expect.bool(outcome.insurancePayoutId == null).isTrue();
    expect.nat(payouts.size()).equal(0);
    expect.nat(outcome.residualCents).equal(9_000);
  });

  test("ck seller fault — insurance requested after stake", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextLiabilityId = { var value = 1 : Nat };
    let stakeBalances = Map.empty<Stake.StakeKey, Types.StakeBalance>();
    let listingStakes = Map.empty<Types.ListingId, Types.ListingStakeRecord>();
    let ledger = { var value = 500_000_000 : Nat };
    let accruals = Map.empty<Types.TradeId, InsuranceReserve.AccrualRecord>();
    let payouts = Map.empty<Nat, InsuranceReserve.PayoutRequest>();
    let daily = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let nextPayoutId = { var value = 1 : Nat };
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(seller, emptyUser(seller));
    users.add(buyer, emptyUser(buyer));
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = seedTrade(
      3,
      100_000_000,
      ?{
        tradeId = 3;
        buyerPrincipal = buyer;
        sellerPrincipal = seller;
        token = #ckUSDC;
        amount = 100_000_000;
        fee = 1_000_000;
        ledgerCanisterId = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");
        lockedAt = Types.now();
        deadline = Types.now();
      },
      null,
    );
    trades.add(3, trade);
    let outcome = LiabilityWaterfall.runSellerFaultWaterfall(
      records,
      nextLiabilityId,
      stakeBalances,
      listingStakes,
      ledger,
      accruals,
      payouts,
      daily,
      nextPayoutId,
      users,
      trades,
      trade,
      emptyUser(seller),
      seller,
    );
    switch (outcome.path) {
      case (#on_chain_ck) {};
      case (_) { assert false };
    };
    expect.nat(outcome.stakeSeizedCents).equal(0);
    expect.bool(outcome.insurancePayoutId != null).isTrue();
    expect.nat(payouts.size()).equal(1);
    switch (outcome.copyTier) {
      case (#partial_recovery) {};
      case (_) { assert false };
    };
  });
});

suite("LiabilityWaterfall — honest copy tiers", func() {
  test("exhausted waterfall with residual → partial_recovery", func() {
    let tier = LiabilityWaterfall.evaluateCopyTier(#on_chain_ck, 500, true);
    switch (tier) {
      case (#partial_recovery) {};
      case (_) { assert false };
    };
  });

  test("manual path never promises custodial recovery", func() {
    let tier = LiabilityWaterfall.evaluateCopyTier(#manual, 5_000, false);
    switch (tier) {
      case (#manual_restriction_only) {};
      case (_) { assert false };
    };
  });
});
