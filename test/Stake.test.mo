/// Stake.test.mo — Seller listing stake (E6.S8)

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Stake "../src/backend/lib/Stake";
import Escrow "../src/backend/lib/Escrow";
import Types "../src/backend/types";

let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

func emptyBalances() : Map.Map<Stake.StakeKey, Types.StakeBalance> {
  Map.empty<Stake.StakeKey, Types.StakeBalance>()
};

func emptyListingStakes() : Map.Map<Types.ListingId, Types.ListingStakeRecord> {
  Map.empty<Types.ListingId, Types.ListingStakeRecord>()
};

suite("Stake — requiredStakeAmount", func() {
  test("5% of 200 USDT equals 10 USDT minimum", func() {
    expect.nat(Stake.requiredStakeAmount(200_000_000)).equal(10_000_000);
  });

  test("minimum 10 USDT applies for low prices", func() {
    expect.nat(Stake.requiredStakeAmount(50_000_000)).equal(10_000_000);
  });

  test("5% above minimum for high prices", func() {
    expect.nat(Stake.requiredStakeAmount(500_000_000)).equal(25_000_000);
  });
});

suite("Stake — lock and release lifecycle", func() {
  test("lock fails with insufficient funds", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    let result = Stake.lockListingStake(
      balances, listingStakes, 1, seller,
      100_000_000, #USDT_TRC20, Types.now(),
    );
    switch (result) {
      case (#err(#insufficient_funds)) {};
      case (_) { assert false };
    };
  });

  test("lock succeeds after deposit and releases after trade", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 20_000_000);
    switch (
      Stake.lockListingStake(
        balances, listingStakes, 1, seller,
        100_000_000, #USDT_TRC20, Types.now(),
      )
    ) {
      case (#ok(locked)) {
        expect.nat(locked).equal(10_000_000);
      };
      case (#err(_)) { assert false };
    };
    let bal = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(bal.available).equal(10_000_000);
    expect.nat(bal.locked).equal(10_000_000);
    switch (Stake.releaseStake(balances, listingStakes, 1)) {
      case (#ok(released)) {
        expect.nat(released).equal(10_000_000);
      };
      case (#err(_)) { assert false };
    };
    let balAfter = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(balAfter.available).equal(20_000_000);
    expect.nat(balAfter.locked).equal(0);
  });

  test("seizeStake removes locked amount", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 15_000_000);
    ignore Stake.lockListingStake(
      balances, listingStakes, 2, seller,
      80_000_000, #USDT_TRC20, Types.now(),
    );
    switch (Stake.seizeStake(balances, listingStakes, 2, null)) {
      case (#ok(seized)) {
        expect.nat(seized).equal(10_000_000);
      };
      case (#err(_)) { assert false };
    };
    let bal = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(bal.available).equal(5_000_000);
    expect.nat(bal.locked).equal(0);
  });

  test("withdraw blocked while listing stake locked", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 30_000_000);
    ignore Stake.lockListingStake(
      balances, listingStakes, 3, seller,
      100_000_000, #USDT_TRC20, Types.now(),
    );
    switch (Stake.withdrawStake(balances, listingStakes, seller, #USDT_TRC20, 5_000_000)) {
      case (#err(#invalid_input(_))) {};
      case (_) { assert false };
    };
  });

  test("LG-06 withdraw blocked during pending trade exposure", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 25_000_000);
    ignore Stake.lockListingStake(
      balances, listingStakes, 20, seller,
      200_000_000, #USDT_TRC20, Types.now(),
    );
    let bal = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(bal.locked).equal(10_000_000);
    switch (Stake.withdrawStake(balances, listingStakes, seller, #USDT_TRC20, 1)) {
      case (#err(#invalid_input(_))) {};
      case (_) { assert false };
    };
  });
});

suite("Stake — claim period release (E6.S8 AC3)", func() {
  test("stake returns to seller after 48h claim window post-complete", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 20_000_000);
    ignore Stake.lockListingStake(
      balances, listingStakes, 10, seller,
      200_000_000, #USDT_TRC20, Types.now(),
    );
    let completedAt = 1 : Types.Timestamp;
    let trade : Types.Trade = {
      id = 1;
      listing = 10;
      buyer = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      seller;
      amount = 200_000_000;
      token = #USDT_TRC20;
      var status = #complete;
      createdAt = 1;
      var fundedAt = null;
      var confirmedAt = null;
      var completedAt = ?completedAt;
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
      var paymentIntent        = null;
      var shipByDeadline       = null;
      var shippedAt            = null;
      var npDeliveredAt        = null;
      var npDeliveredGraceEndsAt = null;
      var pendingOnChainSettlement = null;
    };
    switch (
      Stake.tryReleaseAfterClaimPeriod(
        balances, listingStakes, 10, trade, Stake.STAKE_CLAIM_PERIOD_NS + 1,
      )
    ) {
      case (#ok(true)) {};
      case (_) { assert false };
    };
    let bal = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(bal.available).equal(20_000_000);
    expect.nat(bal.locked).equal(0);
  });

  test("stake stays locked before claim period ends", func() {
    let balances = emptyBalances();
    let listingStakes = emptyListingStakes();
    ignore Stake.depositStake(balances, seller, #USDT_TRC20, 15_000_000);
    ignore Stake.lockListingStake(
      balances, listingStakes, 11, seller,
      100_000_000, #USDT_TRC20, Types.now(),
    );
    let completedAt = Types.now();
    let trade : Types.Trade = {
      id = 2;
      listing = 11;
      buyer = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      seller;
      amount = 100_000_000;
      token = #USDT_TRC20;
      var status = #complete;
      createdAt = completedAt;
      var fundedAt = null;
      var confirmedAt = null;
      var completedAt = ?completedAt;
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
      var paymentIntent        = null;
      var shipByDeadline       = null;
      var shippedAt            = null;
      var npDeliveredAt        = null;
      var npDeliveredGraceEndsAt = null;
      var pendingOnChainSettlement = null;
    };
    switch (
      Stake.tryReleaseAfterClaimPeriod(
        balances, listingStakes, 11, trade, Types.now(),
      )
    ) {
      case (#ok(false)) {};
      case (_) { assert false };
    };
    let bal = Stake.getBalance(balances, seller, #USDT_TRC20);
    expect.nat(bal.locked).equal(10_000_000);
  });
});

suite("Stake — release guard (E6.S8 / audit P0)", func() {
  func makeListing(id : Nat, status : Types.ListingStatus) : Types.Listing {
    {
      id;
      seller;
      var title       = "Test";
      var description = "d";
      var category    = #other;
      var categoryId  = 1;
      var priceAmount = 100_000_000;
      var priceToken  = #USDT_TRC20;
      var condition   = #good;
      var photos      = [];
      var location    = "Kyiv";
      var shippingMethods = [];
      isDigital       = false;
      var digitalFileUrl = null;
      var status      = status;
      createdAt       = Types.now();
      var expiresAt   = Types.now() + 86_400_000_000_000;
      var viewCount   = 0;
      var packageDetails   = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig  = null;
      var meestConfig      = null;
      var digitalFileHash          = null;
      var digitalPassword           = null;
      var digitalFileUrlEncrypted   = null;
      var digitalPasswordEncrypted  = null;
    var digitalFileAsset          = null;
      var resolvedAt                = null;
      var bumpedAt                  = Types.now();
      var promotedUntil             = null;
      var attributes                = [];
    }
  };

  test("release blocked while listing active", func() {
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    listings.add(5, makeListing(5, #active));
    switch (Escrow.assertListingStakeReleasable(listings, trades, 5)) {
      case (#err(#invalid_input(_))) {};
      case (_) { assert false };
    };
  });

  test("release blocked while exclusive trade open", func() {
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    listings.add(6, makeListing(6, #sold));
    let trade : Types.Trade = {
      id = 99;
      listing = 6;
      buyer = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      seller;
      amount = 100_000_000;
      token = #USDT_TRC20;
      var status = #awaiting_seller_handshake;
      createdAt = Types.now();
      var fundedAt = null;
      var confirmedAt = null;
      var completedAt = null;
      var refundDeadline = null;
      var sellerResponseDeadline = ?(Types.now() + 86_400_000_000_000);
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
    };
    trades.add(99, trade);
    switch (Escrow.assertListingStakeReleasable(listings, trades, 6)) {
      case (#err(#invalid_input(_))) {};
      case (_) { assert false };
    };
  });
});
