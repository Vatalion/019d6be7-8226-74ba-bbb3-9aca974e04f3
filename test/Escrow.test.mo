/// Escrow.test.mo — Trade state machine transition tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Escrow "../src/backend/lib/Escrow";
import Stake "../src/backend/lib/Stake";
import WalletLink "../src/backend/lib/WalletLink";
import LaunchGate "../src/backend/lib/LaunchGate";
import DigitalDelivery "../src/backend/lib/DigitalDelivery";
import OnChainSettlement "../src/backend/lib/OnChainSettlement";
import Types  "../src/backend/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

func makeTrade(
  id     : Nat,
  buyer  : Principal,
  seller : Principal,
  status : Types.TradeStatus,
  deadline : ?Types.Timestamp,
) : Types.Trade {
  {
    id;
    listing           = 0;
    buyer;
    seller;
    amount            = 1_000_000;
    token             = #USDT_TRC20;
    var status        = status;
    createdAt         = Types.now();
    var fundedAt      = null;
    var confirmedAt   = null;
    var completedAt   = null;
    var refundDeadline = deadline;
    var sellerResponseDeadline = null;
    var escrowAccount = null;
    var shippingSelection = null;
    var ttnNumber         = null;
    var ttnCreationStatus = #Pending;
    var digitalDelivery   = null;
    var deliveryRecordAt  = null;
    var payoutWalletSnapshot = null;
    var payoutWalletHeld     = false;
    var paymentIntent        = null;
    var shipByDeadline       = null;
    var shippedAt            = null;
    var npDeliveredAt        = null;
    var npDeliveredGraceEndsAt = null;
    var pendingOnChainSettlement = null;
  }
};

func emptyUsers() : Map.Map<Types.UserId, Types.User> {
  Map.empty<Types.UserId, Types.User>()
};

func makeSellerWithPayoutWallet() : Types.User {
  {
    id = bob;
    var username = "bob";
    var bio = "";
    var avatarUrl = "";
    var role = #user;
    createdAt = Types.now();
    var reputationScore = 0;
    var buyerScore = 0;
    var sellerScore = 0;
    var trustLevel = #new_;
    var kycTier = #none;
    var isBanned = false;
    var suspendedUntil = null;
    var liabilityBalance = 0;
    var liabilityHistory = [];
    var paymentMethods = [];
    var linkedWallets = [{
      id = 1;
      chain = #tron;
      address = "TXyzSellerPayoutWallet123456789012";
      purpose = #payout;
      linkedAt = Types.now();
      sessionId = "sess-1";
      messageHash = "abc";
    }];
    var accountClosedAt = null;
  }
};

func makeListing(id : Nat, seller : Principal) : Types.Listing {
  {
    id;
    seller;
    var title       = "Test";
    var description = "Test listing";
    var category    = #other;
    var categoryId  = 1;
    var priceAmount = 1_000_000;
    var priceToken  = #USDT_TRC20;
    var condition   = #good;
    var photos      = [];
    var location    = "Kyiv";
    var shippingMethods = [];
    isDigital       = false;
    var digitalFileUrl = null;
    var status      = #active;
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
      var attributes       = [];
  }
};

func makeDigitalListing(id : Nat, seller : Principal) : Types.Listing {
  {
    id;
    seller;
    var title       = "Digital Test";
    var description = "Digital listing";
    var category    = #other;
    var categoryId  = 1;
    var priceAmount = 1_000_000;
    var priceToken  = #USDT_TRC20;
    var condition   = #good;
    var photos      = [];
    var location    = "Kyiv";
    var shippingMethods = [];
    isDigital       = true;
    var digitalFileUrl = ?"https://example.com/file";
    var status      = #active;
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
    var attributes       = [];
  }
};

// Non-anonymous principals for testing (2vxsx-fae is the anonymous principal)
let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let carol = Principal.fromText("rno2w-sqaaa-aaaaa-aaacq-cai");

// ─── Tests ────────────────────────────────────────────────────────────────

suite("Escrow — fee helpers", func() {
  test("platformFee is 2% (200 bps)", func() {
    expect.nat(Escrow.platformFee(10_000)).equal(200);
    expect.nat(Escrow.platformFee(1_000_000)).equal(20_000);
  });

  test("cycleFee is 0.5% (50 bps)", func() {
    expect.nat(Escrow.cycleFee(10_000)).equal(50);
  });

  test("reserveFee is 0.5% (50 bps)", func() {
    expect.nat(Escrow.reserveFee(10_000)).equal(50);
  });

  test("totalFee is 3% (300 bps)", func() {
    expect.nat(Escrow.totalFee(10_000)).equal(300);
  });

  test("sellerAmount is amount minus 3% fee", func() {
    expect.nat(Escrow.sellerAmount(10_000)).equal(9_700);
    expect.nat(Escrow.sellerAmount(1_000_000)).equal(970_000);
  });

  test("buyerPlatformFeeCeil rounds up fractional bps", func() {
    expect.nat(Escrow.buyerPlatformFeeCeil(1_000_000, 300)).equal(30_000);
    expect.nat(Escrow.buyerPlatformFeeCeil(1_000_001, 300)).equal(30_001);
    expect.nat(Escrow.buyerPlatformFeeCeil(0, 300)).equal(0);
  });

  test("buildTradeFeeQuote uses 3% default when config unset", func() {
    let quote = Escrow.buildTradeFeeQuote(1_000_000, #USDT_TRC20, 0);
    expect.nat(quote.itemPrice).equal(1_000_000);
    expect.nat(quote.platformFeeBps).equal(300);
    expect.nat(quote.platformFeeAmount).equal(30_000);
    expect.nat(quote.totalBuyerAmount).equal(1_030_000);
    expect.bool(quote.usesDefaultFeeBps).isTrue();
  });

  test("buildTradeFeeQuote honors configured bps", func() {
    let quote = Escrow.buildTradeFeeQuote(1_000_000, #USDT_BEP20, 250);
    expect.nat(quote.platformFeeBps).equal(250);
    expect.nat(quote.platformFeeAmount).equal(25_000);
    expect.nat(quote.totalBuyerAmount).equal(1_025_000);
    expect.bool(quote.usesDefaultFeeBps).isFalse();
  });
});

suite("Escrow — isOnChainToken", func() {
  test("ckUSDC and ckUSDT are on-chain", func() {
    expect.bool(Escrow.isOnChainToken(#ckUSDC)).isTrue();
    expect.bool(Escrow.isOnChainToken(#ckUSDT)).isTrue();
  });

  test("external stablecoins are NOT on-chain", func() {
    expect.bool(Escrow.isOnChainToken(#USDT_TRC20)).isFalse();
    expect.bool(Escrow.isOnChainToken(#USDT_BEP20)).isFalse();
    expect.bool(Escrow.isOnChainToken(#USDC_ERC20)).isFalse();
  });
});

suite("Escrow — ledgerCanisterId", func() {
  let ckUsdcId = "xevnm-gaaaa-aaaar-qafnq-cai";
  let ckUsdtId = "cngnf-vqaaa-aaaar-qag4q-cai";

  test("returns ckUSDC ledger principal", func() {
    let result = Escrow.ledgerCanisterId(#ckUSDC, ckUsdcId, ckUsdtId);
    switch result {
      case (?p) expect.text(p.toText()).equal(ckUsdcId);
      case null assert false;
    };
  });

  test("returns ckUSDT ledger principal", func() {
    let result = Escrow.ledgerCanisterId(#ckUSDT, ckUsdcId, ckUsdtId);
    switch result {
      case (?p) expect.text(p.toText()).equal(ckUsdtId);
      case null assert false;
    };
  });

  test("returns null for external token", func() {
    let result = Escrow.ledgerCanisterId(#USDT_TRC20, ckUsdcId, ckUsdtId);
    switch result {
      case null {};
      case (?_) assert false;
    };
  });
});

suite("Escrow — state transitions", func() {
  test("confirmPaymentSent: pending → buyer_confirmed", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(1, alice, bob, #pending, ?(Types.now() + 259_200_000_000_000));
    trades.add(1, trade);
    let result = Escrow.confirmPaymentSent(trades, alice, 1);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#buyer_confirmed));
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentSent: funded → buyer_confirmed", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(2, alice, bob, #funded, ?(Types.now() + 259_200_000_000_000));
    trades.add(2, trade);
    let result = Escrow.confirmPaymentSent(trades, alice, 2);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#buyer_confirmed));
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentSent: complete → error (invalid transition)", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(3, alice, bob, #complete, null);
    trades.add(3, trade);
    let result = Escrow.confirmPaymentSent(trades, alice, 3);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("confirmPaymentReceived: payment_verified digital → error (not terminal)", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users    = emptyUsers();
    let listing  = makeDigitalListing(0, bob);
    listings.add(0, listing);
    let trade    = makeTrade(4, alice, bob, #payment_verified, null);
    trade.payoutWalletSnapshot := ?{
      walletLinkId = 1;
      address = "TXyzSellerPayoutWallet123456789012";
      token = #USDT_TRC20;
      chain = #tron;
      snapshottedAt = Types.now();
    };
    trades.add(4, trade);
    users.add(bob, makeSellerWithPayoutWallet());
    let result = Escrow.confirmPaymentReceived(trades, listings, users, bob, 4);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("confirmPaymentReceived: pending → error (invalid transition)", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users    = emptyUsers();
    let trade    = makeTrade(5, alice, bob, #pending, null);
    trades.add(5, trade);
    let result = Escrow.confirmPaymentReceived(trades, listings, users, bob, 5);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("openDispute: buyer_confirmed → disputed", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(6, alice, bob, #buyer_confirmed, null);
    trades.add(6, trade);
    let result = Escrow.openDispute(trades, alice, 6);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#dispute_l1));
      case (#err(_)) assert false;
    };
  });

  test("openDispute: funded → disputed (seller-initiated)", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(7, alice, bob, #funded, null);
    trades.add(7, trade);
    let result = Escrow.openDispute(trades, bob, 7);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#dispute_l1));
      case (#err(_)) assert false;
    };
  });

  test("openDispute: complete → error (terminal state)", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(8, alice, bob, #complete, null);
    trades.add(8, trade);
    let result = Escrow.openDispute(trades, alice, 8);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("markFunded: awaiting_approval → funded", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(9, alice, bob, #awaiting_approval, null);
    trades.add(9, trade);
    let result = Escrow.markFunded(trades, 9);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#funded));
      case (#err(_)) assert false;
    };
  });

  test("markFunded: pending → error (invalid transition)", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(10, alice, bob, #pending, null);
    trades.add(10, trade);
    let result = Escrow.markFunded(trades, 10);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("proposeCancelTrade: both parties agree → cancelled", func() {
    let trades          = Map.empty<Types.TradeId, Types.Trade>();
    let cancelProposals = Map.empty<Types.TradeId, Set.Set<Principal>>();
    let trade           = makeTrade(11, alice, bob, #pending, null);
    trades.add(11, trade);

    // buyer proposes
    let r1 = Escrow.proposeCancelTrade(trades, cancelProposals, alice, 11);
    switch r1 {
      case (#ok(false)) {};
      case _ assert false;
    };

    // seller agrees → cancelled
    let r2 = Escrow.proposeCancelTrade(trades, cancelProposals, bob, 11);
    switch r2 {
      case (#ok(true)) {};
      case _ assert false;
    };

    switch (trades.get(11)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#cancelled));
      case null assert false;
    };
  });

  test("proposeCancelTrade: replaces pending release with refundBuyer", func() {
    let trades          = Map.empty<Types.TradeId, Types.Trade>();
    let cancelProposals = Map.empty<Types.TradeId, Set.Set<Principal>>();
    let trade           = makeTrade(12, alice, bob, #funded, null);
    trade.escrowAccount := ?{
      tradeId = 12;
      buyerPrincipal = alice;
      sellerPrincipal = bob;
      token = #USDT_TRC20;
      amount = 1_000_000;
      fee = 10_000;
      ledgerCanisterId = Principal.fromText("aaaaa-aa");
      lockedAt = Types.now();
      deadline = Types.now() + 86_400_000_000_000;
    };
    trade.pendingOnChainSettlement := ?{
      op = #releaseToSeller;
      targetStatus = #complete;
      queuedAt = Types.now();
      attempts = 0;
      lastError = null;
    };
    trades.add(12, trade);

    ignore Escrow.proposeCancelTrade(trades, cancelProposals, alice, 12);
    ignore Escrow.proposeCancelTrade(trades, cancelProposals, bob, 12);

    switch (trades.get(12)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#funded));
        switch (t.pendingOnChainSettlement) {
          case (?p) {
            expect.text(debug_show(p.op)).equal(debug_show(#refundBuyer { memo = "mutual-cancel" }));
            expect.text(debug_show(p.targetStatus)).equal(debug_show(#cancelled));
          };
          case null assert false;
        };
      };
      case null assert false;
    };
  });
});

suite("Escrow — initiateTrade", func() {
  test("inactive listing rejected", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let listing  = makeListing(1, bob);
    listing.status := #inactive;
    listings.add(1, listing);
    let result = Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("buyer cannot be seller", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, alice));
    let result = Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("happy path creates awaiting_seller_handshake trade", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    let result = Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch result {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_seller_handshake));
        expect.nat(t.amount).equal(1_000_000);
        switch (t.sellerResponseDeadline) {
          case (?d) { expect.bool(d > t.createdAt).isTrue() };
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });
});

suite("Escrow — seller handshake (E3.S7)", func() {
  test("confirm advances to payment_intent", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    let result = Escrow.confirmSellerHandshake(trades, bob, 1);
    switch result {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#payment_intent));
        switch (t.refundDeadline) {
          case (?_) {};
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("decline → cancelled_no_seller_response", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(2, makeListing(2, bob));
    ignore Escrow.initiateTrade(trades, listings, 2, alice, 2, #USDT_TRC20, null, #none, 0, true, 50_000);
    let result = Escrow.declineSellerHandshake(trades, bob, 2);
    switch result {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
      };
      case (#err(_)) assert false;
    };
  });

  test("checkHandshakeTimeouts auto-cancels expired trades", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(3, makeListing(3, bob));
    ignore Escrow.initiateTrade(trades, listings, 3, alice, 3, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch (trades.get(3)) {
      case (?t) { t.sellerResponseDeadline := ?(0); };
      case null {};
    };
    let count = Escrow.checkHandshakeTimeouts(trades);
    expect.nat(count).equal(1);
    switch (trades.get(3)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
      };
      case null assert false;
    };
  });

  test("confirm vs timeout race is idempotent", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(4, makeListing(4, bob));
    ignore Escrow.initiateTrade(trades, listings, 4, alice, 4, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch (trades.get(4)) {
      case (?t) { t.sellerResponseDeadline := ?(0); };
      case null {};
    };
    ignore Escrow.checkHandshakeTimeouts(trades);
    let afterTimeout = Escrow.confirmSellerHandshake(trades, bob, 4);
    switch afterTimeout {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
      };
      case (#err(_)) assert false;
    };
    let again = Escrow.confirmSellerHandshake(trades, bob, 4);
    switch again {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
      };
      case (#err(_)) assert false;
    };
  });

  test("confirm wins race before timeout scan", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(5, makeListing(5, bob));
    ignore Escrow.initiateTrade(trades, listings, 5, alice, 5, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 5);
    let count = Escrow.checkHandshakeTimeouts(trades);
    expect.nat(count).equal(0);
    switch (trades.get(5)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#payment_intent));
      };
      case null assert false;
    };
  });

  test("buyer cannot confirm handshake", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(6, makeListing(6, bob));
    ignore Escrow.initiateTrade(trades, listings, 6, alice, 6, #USDT_TRC20, null, #none, 0, true, 50_000);
    let result = Escrow.confirmSellerHandshake(trades, alice, 6);
    switch result {
      case (#ok(_)) assert false;
      case (#err(e)) {
        switch (e) {
          case (#unauthorized) {};
          case (_) assert false;
        };
      };
    };
  });

  test("confirmPaymentSent rejected before handshake", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(7, makeListing(7, bob));
    ignore Escrow.initiateTrade(trades, listings, 7, alice, 7, #USDT_TRC20, null, #none, 0, true, 50_000);
    let result = Escrow.confirmPaymentSent(trades, alice, 7);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });
});

suite("Escrow — requestRefund", func() {
  test("after deadline pending → refunded", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let past   = 0;
    let trade  = makeTrade(12, alice, bob, #pending, ?past);
    trades.add(12, trade);
    let result = Escrow.requestRefund(trades, alice, 12);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#refunded));
      case (#err(_)) assert false;
    };
  });

  test("before deadline rejected", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let future = Types.now() + 86_400_000_000_000;
    let trade  = makeTrade(13, alice, bob, #pending, ?future);
    trades.add(13, trade);
    let result = Escrow.requestRefund(trades, alice, 13);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });
});

suite("Escrow — on-chain safety (E9.S2)", func() {
  let ckLedger = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");

  func makeCkListing(id : Nat, seller : Principal) : Types.Listing {
    let l = makeDigitalListing(id, seller);
    l.priceToken := #ckUSDC;
    l
  };

  func setupCkTradeWithIntent() : Map.Map<Types.TradeId, Types.Trade> {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeCkListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    let now = Types.now();
    switch (trades.get(1)) {
      case (?t) {
        t.payoutWalletSnapshot := ?{
          walletLinkId = 1;
          address = "rdmx6-jaaaa-aaaaa-aaadq-cai";
          token = #ckUSDC;
          chain = #evm_eth;
          snapshottedAt = now;
        };
        t.paymentIntent := ?{
          token = #ckUSDC;
          network = "ICRC";
          exactAmount = 1_030_000;
          recipient = "rdmx6-jaaaa-aaaaa-aaadq-cai";
          expiry = now + 259_200_000_000_000;
          path = #ck;
          createdAt = now;
        };
      };
      case null {};
    };
    trades
  };

  test("prepareOnChainTradeLock rejected before handshake", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeCkListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, 50_000);
    let result = Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("prepareOnChainTradeLock rejected for manual PaymentIntent", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(1, makeListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(
      trades, users, bob, 1, ?1, #manual, 0, false, 50_000,
    );
    let result = Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("prepareOnChainTradeLock succeeds after ck PaymentIntent", func() {
    let trades = setupCkTradeWithIntent();
    let result = Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    switch result {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_approval));
        switch (t.escrowAccount) {
          case (?e) {
            expect.nat(e.amount).equal(1_030_000);
            expect.text(e.ledgerCanisterId.toText()).equal(ckLedger.toText());
          };
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("rollbackOnChainLockFailure restores payment_intent without removing trade", func() {
    let trades = setupCkTradeWithIntent();
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    let result = Escrow.rollbackOnChainLockFailure(trades, 1);
    switch result {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
    switch (trades.get(1)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#payment_intent));
        expect.bool(t.escrowAccount == null).isTrue();
        expect.bool(t.fundedAt == null).isTrue();
      };
      case null assert false;
    };
  });

  test("concurrent prepare rejects lock already in progress", func() {
    let trades = setupCkTradeWithIntent();
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    let result = Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#awaiting_approval));
      case null assert false;
    };
  });

  test("markFunded advances post-handshake awaiting_approval to funded", func() {
    let trades = setupCkTradeWithIntent();
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    let result = Escrow.markFunded(trades, 1);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#funded));
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentReceived from funded queues on-chain release without terminal state", func() {
    let trades = setupCkTradeWithIntent();
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeCkListing(1, bob));
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    ignore Escrow.markFunded(trades, 1);
    let result = Escrow.confirmPaymentReceived(trades, listings, users, bob, 1);
    switch result {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#funded));
        switch (t.pendingOnChainSettlement) {
          case null assert false;
          case (?_) {};
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("finalize on-chain settlement marks complete after ledger success", func() {
    let trades = setupCkTradeWithIntent();
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeCkListing(1, bob));
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    ignore Escrow.markFunded(trades, 1);
    ignore Escrow.confirmPaymentReceived(trades, listings, users, bob, 1);
    switch (trades.get(1)) {
      case (?t) {
        OnChainSettlement.finalizeTerminal(t, listings, #complete);
        expect.text(debug_show(t.status)).equal(debug_show(#complete));
        switch (t.pendingOnChainSettlement) {
          case null {};
          case (?_) assert false;
        };
      };
      case null assert false;
    };
  });

  test("settlement failure keeps non-terminal status and records retry", func() {
    let trades = setupCkTradeWithIntent();
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeCkListing(1, bob));
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    ignore Escrow.markFunded(trades, 1);
    ignore Escrow.confirmPaymentReceived(trades, listings, users, bob, 1);
    switch (trades.get(1)) {
      case (?t) {
        OnChainSettlement.recordFailure(t, "ledger unavailable");
        expect.text(debug_show(t.status)).equal(debug_show(#funded));
        switch (t.pendingOnChainSettlement) {
          case (?p) {
            expect.nat(p.attempts).equal(1);
            expect.bool(p.lastError != null).isTrue();
          };
          case null assert false;
        };
      };
      case null assert false;
    };
  });

  test("buyer cancel on ck path queues 85/10/5 split without terminal state", func() {
    let trades = setupCkTradeWithIntent();
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    ignore Escrow.markFunded(trades, 1);
    switch (Escrow.buyerCancelBeforeShipment(trades, alice, 1)) {
      case (#ok(split)) {
        expect.nat(split.buyerRefund).equal(875_500);
        switch (trades.get(1)) {
          case (?t) {
            expect.text(debug_show(t.status)).equal(debug_show(#funded));
            switch (t.pendingOnChainSettlement) {
              case null assert false;
              case (?_) {};
            };
          };
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentReceived blocked from disputed state", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let trade : Types.Trade = {
      id = 1;
      listing = 0;
      buyer = alice;
      seller = bob;
      amount = 1_000_000;
      token = #ckUSDC;
      var status = #disputed;
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
      var payoutWalletHeld     = false;
      var paymentIntent        = null;
      var shipByDeadline       = null;
      var shippedAt            = null;
      var npDeliveredAt        = null;
      var npDeliveredGraceEndsAt = null;
      var pendingOnChainSettlement = null;
    };
    trades.add(1, trade);
    listings.add(0, makeListing(0, bob));
    let result = Escrow.confirmPaymentReceived(trades, listings, emptyUsers(), bob, 1);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("checkAndExpireTimeouts queues on-chain refund ids", func() {
    let trades = setupCkTradeWithIntent();
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 1, ckLedger, 50_000);
    ignore Escrow.markFunded(trades, 1);
    switch (trades.get(1)) {
      case (?t) {
        t.refundDeadline := ?(0);
        expect.text(debug_show(t.status)).equal(debug_show(#funded));
      };
      case null {};
    };
    let (count, ids) = Escrow.checkAndExpireTimeouts(trades);
    expect.nat(count).equal(1);
    expect.nat(ids.size()).equal(1);
    expect.nat(ids[0]).equal(1);
    switch (trades.get(1)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#funded));
        switch (t.pendingOnChainSettlement) {
          case null assert false;
          case (?_) {};
        };
      };
      case null assert false;
    };
  });
});

suite("Escrow — Gate C beta enable (E9.S6)", func() {
  let ckLedger = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");
  let betaCapUsdCents : Nat = 50_000;

  test("W3-3 ck trade over 500 USDT rejected at initiate", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeDigitalListing(1, bob);
    l.priceToken := #ckUSDC;
    l.priceAmount := 501_000_000; // 501 USDT @ 6 decimals
    listings.add(1, l);
    switch (Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, betaCapUsdCents)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("ck trade at beta cap allowed", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeDigitalListing(1, bob);
    l.priceToken := #ckUSDC;
    l.priceAmount := 500_000_000; // 500 USDT
    listings.add(1, l);
    switch (Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, betaCapUsdCents)) {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_seller_handshake));
      };
      case (#err(_)) assert false;
    };
  });

  test("in-flight ck lock eligible when Gate C disabled", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeDigitalListing(1, bob);
    l.priceToken := #ckUSDC;
    listings.add(1, l);
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, betaCapUsdCents);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    let now = Types.now();
    switch (trades.get(1)) {
      case (?t) {
        t.paymentIntent := ?{
          token = #ckUSDC;
          network = "ICRC";
          exactAmount = 1_030_000;
          recipient = "rdmx6-jaaaa-aaaaa-aaadq-cai";
          expiry = now + 259_200_000_000_000;
          path = #ck;
          createdAt = now;
        };
        expect.bool(Escrow.isInFlightCkLockEligible(t, false)).isTrue();
      };
      case null assert false;
    };
  });

  test("new ck lock not eligible when Gate C disabled without intent", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeDigitalListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #ckUSDC, null, #none, 0, true, betaCapUsdCents);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    switch (trades.get(1)) {
      case (?t) {
        expect.bool(Escrow.isInFlightCkLockEligible(t, false)).isFalse();
      };
      case null assert false;
    };
  });
});

suite("Escrow — listing stake lifecycle (E6.S8)", func() {
  test("completed trade releases stake after claim period", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let stakeBalances = Map.empty<Stake.StakeKey, Types.StakeBalance>();
    let listingStakes = Map.empty<Types.ListingId, Types.ListingStakeRecord>();
    listings.add(5, makeListing(5, bob));
    ignore Stake.depositStake(stakeBalances, bob, #USDT_TRC20, 25_000_000);
    ignore Stake.lockListingStake(
      stakeBalances, listingStakes, 5, bob,
      150_000_000, #USDT_TRC20, Types.now(),
    );
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 5, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(
      trades, users, bob, 1, ?1, #manual, 0, false, 50_000,
    );
    ignore Escrow.applyPaymentVerified(trades, listings, 1);
    switch (Escrow.markShipped(trades, bob, 1, "59000123456789")) {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
    switch (Escrow.confirmBuyerReceipt(trades, listings, users, alice, 1)) {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
    switch (trades.get(1)) {
      case (?t) {
        t.completedAt := ?0;
        switch (
          Stake.tryReleaseAfterClaimPeriod(
            stakeBalances, listingStakes, 5, t, Stake.STAKE_CLAIM_PERIOD_NS + 1,
          )
        ) {
          case (#ok(true)) {};
          case (_) { assert false };
        };
      };
      case null { assert false };
    };
    let bal = Stake.getBalance(stakeBalances, bob, #USDT_TRC20);
    expect.nat(bal.locked).equal(0);
    expect.nat(bal.available).equal(25_000_000);
  });
});

suite("Escrow — PaymentIntent (E3.S10)", func() {
  test("createPaymentIntent records fields and advances to manual_payment_pending", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(1, makeListing(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 1);
    users.add(bob, makeSellerWithPayoutWallet());
    let result = Escrow.createPaymentIntent(
      trades, users, bob, 1, ?1, #manual, 0, false, 50_000,
    );
    switch result {
      case (#ok(intent)) {
        expect.text(intent.network).equal("TRC20");
        expect.nat(intent.exactAmount).equal(1_030_000);
        expect.text(intent.recipient).equal("TXyzSellerPayoutWallet123456789012");
        expect.bool(intent.expiry > intent.createdAt).isTrue();
      };
      case (#err(_)) assert false;
    };
    switch (trades.get(1)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#manual_payment_pending));
        switch (t.payoutWalletSnapshot) {
          case (?_) {};
          case null assert false;
        };
      };
      case null assert false;
    };
  });

  test("createPaymentIntent rejected before handshake", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(2, makeListing(2, bob));
    ignore Escrow.initiateTrade(trades, listings, 2, alice, 2, #USDT_TRC20, null, #none, 0, true, 50_000);
    users.add(bob, makeSellerWithPayoutWallet());
    let result = Escrow.createPaymentIntent(
      trades, users, bob, 2, ?1, #manual, 0, false, 50_000,
    );
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("applyPaymentVerified from manual_payment_pending", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(3, makeListing(3, bob));
    ignore Escrow.initiateTrade(trades, listings, 3, alice, 3, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 3);
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(trades, users, bob, 3, ?1, #manual, 0, false, 50_000);
    let result = Escrow.applyPaymentVerified(trades, listings, 3);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#fulfillment_pending));
      case (#err(_)) assert false;
    };
  });

  test("expired PaymentIntent blocks applyPaymentVerified", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(4, makeListing(4, bob));
    ignore Escrow.initiateTrade(trades, listings, 4, alice, 4, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 4);
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(trades, users, bob, 4, ?1, #manual, 0, false, 50_000);
    switch (trades.get(4)) {
      case (?t) {
        switch (t.paymentIntent) {
          case (?pi) { t.paymentIntent := ?{ pi with expiry = 0 }; };
          case null {};
        };
        t.status := #payment_intent_expired;
      };
      case null {};
    };
    let result = Escrow.applyPaymentVerified(trades, listings, 4);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("isFulfillmentAllowed blocks ship before verify", func() {
    expect.bool(Escrow.isFulfillmentAllowed(#manual_payment_pending)).isFalse();
    expect.bool(Escrow.isFulfillmentAllowed(#payment_verified)).isTrue();
  });

  test("wallet change after lock holds payout", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let users = Map.empty<Types.UserId, Types.User>();
    listings.add(5, makeDigitalListing(5, bob));
    ignore Escrow.initiateTrade(trades, listings, 5, alice, 5, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 5);
    let seller = makeSellerWithPayoutWallet();
    users.add(bob, seller);
    ignore Escrow.createPaymentIntent(trades, users, bob, 5, ?1, #manual, 0, false, 50_000);
    ignore Escrow.applyPaymentVerified(trades, listings, 5);
    ignore WalletLink.removeLinkedWallet(seller, 1);
    WalletLink.holdPayoutOnWalletChange(trades, bob, 1);
    let result = Escrow.confirmPaymentReceived(trades, listings, users, bob, 5);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });
});

suite("Escrow — Nova Poshta fulfillment (E7.S3)", func() {
  test("invalid TTN rejected — stays fulfillment_pending", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    let trade = makeTrade(1, alice, bob, #fulfillment_pending, null);
    trade.shipByDeadline := ?(Types.now() + 86_400_000_000_000);
    trades.add(1, trade);
    let result = Escrow.markShipped(trades, bob, 1, "bad-ttn");
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#fulfillment_pending));
      case null assert false;
    };
  });

  test("valid TTN marks shipped", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    let trade = makeTrade(1, alice, bob, #fulfillment_pending, null);
    trades.add(1, trade);
    let result = Escrow.markShipped(trades, bob, 1, "59000123456789");
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#shipped));
      case (#err(_)) assert false;
    };
  });

  test("buyer confirm completes before grace", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    let trade = makeTrade(1, alice, bob, #shipped, null);
    trade.ttnNumber := ?"59000123456789";
    trades.add(1, trade);
    let result = Escrow.confirmBuyerReceipt(trades, listings, emptyUsers(), alice, 1);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#complete));
      case (#err(_)) assert false;
    };
  });

  test("ship-by SLA escalates to dispute_l1", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(1, alice, bob, #fulfillment_pending, null);
    trade.shipByDeadline := ?(0);
    trades.add(1, trade);
    let escalated = Escrow.checkShipByDeadlines(trades);
    expect.nat(escalated.size()).equal(1);
    expect.nat(escalated[0]).equal(1);
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#dispute_l1));
      case null assert false;
    };
  });

  test("auto-complete after delivered grace", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListing(1, bob));
    let trade = makeTrade(1, alice, bob, #awaiting_receipt, null);
    trade.npDeliveredAt := ?(0);
    trade.npDeliveredGraceEndsAt := ?(0);
    trades.add(1, trade);
    let count = Escrow.processNpAutoComplete(trades, listings);
    expect.nat(count).equal(1);
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#complete));
      case null assert false;
    };
  });

  test("auto-complete fail-closed without deliveredAt", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let trade = makeTrade(1, alice, bob, #awaiting_receipt, null);
    trade.npDeliveredGraceEndsAt := ?(0);
    trades.add(1, trade);
    let count = Escrow.processNpAutoComplete(trades, listings);
    expect.nat(count).equal(0);
  });
});

suite("Escrow — buyer cancel pre-ship 85/10/5 (E3.S9)", func() {
  test("computeBuyerCancelPenaltySplit exact 85/10/5", func() {
    let split = Escrow.computeBuyerCancelPenaltySplit(1_000_000);
    expect.nat(split.buyerRefund).equal(850_000);
    expect.nat(split.sellerCompensation).equal(100_000);
    expect.nat(split.platformFee).equal(50_000);
    expect.nat(split.buyerRefund + split.sellerCompensation + split.platformFee).equal(1_000_000);
  });

  test("computeBuyerCancelPenaltySplit dust to platform", func() {
    let split = Escrow.computeBuyerCancelPenaltySplit(103);
    expect.nat(split.buyerRefund).equal(87);
    expect.nat(split.sellerCompensation).equal(10);
    expect.nat(split.platformFee).equal(6);
    expect.nat(split.buyerRefund + split.sellerCompensation + split.platformFee).equal(103);
  });

  test("buyer cancel from fulfillment_pending succeeds", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(1, alice, bob, #fulfillment_pending, null);
    trade.paymentIntent := ?{
      token = #USDT_TRC20;
      network = "TRC20";
      exactAmount = 1_030_000;
      recipient = "TXyzSeller";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    trades.add(1, trade);
    let result = Escrow.buyerCancelBeforeShipment(trades, alice, 1);
    switch result {
      case (#ok(split)) {
        expect.nat(split.buyerRefund).equal(875_500);
        expect.nat(split.sellerCompensation).equal(103_000);
        expect.nat(split.platformFee).equal(51_500);
      };
      case (#err(_)) assert false;
    };
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#cancelled_buyer_pre_ship));
      case null assert false;
    };
  });

  test("buyer cancel rejected after shipped", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(1, alice, bob, #shipped, null);
    trade.paymentIntent := ?{
      token = #USDT_TRC20;
      network = "TRC20";
      exactAmount = 1_000_000;
      recipient = "TXyzSeller";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    trades.add(1, trade);
    let result = Escrow.buyerCancelBeforeShipment(trades, alice, 1);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("cancel vs markShipped race — ship wins then cancel rejected", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(1, alice, bob, #fulfillment_pending, null);
    trade.paymentIntent := ?{
      token = #USDT_TRC20;
      network = "TRC20";
      exactAmount = 1_000_000;
      recipient = "TXyzSeller";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    trades.add(1, trade);
    switch (Escrow.markShipped(trades, bob, 1, "59000123456789")) {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
    let cancelResult = Escrow.buyerCancelBeforeShipment(trades, alice, 1);
    switch cancelResult {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    switch (trades.get(1)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#shipped));
      case null assert false;
    };
  });

  test("buyer cancel rejected for seller caller", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(1, alice, bob, #payment_verified, null);
    trade.paymentIntent := ?{
      token = #USDT_TRC20;
      network = "TRC20";
      exactAmount = 1_000_000;
      recipient = "TXyzSeller";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    trades.add(1, trade);
    let result = Escrow.buyerCancelBeforeShipment(trades, bob, 1);
    switch result {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });
});

// ─── E13.S1 Launch Gate P0 (LG-01..LG-17) ─────────────────────────────────

suite("E13.S1 — Launch Gate P0 race matrix", func() {
  test("LG-01 confirm vs 24h timeout race — single terminal state", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(100, makeListing(100, bob));
    ignore Escrow.initiateTrade(trades, listings, 100, alice, 100, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch (trades.get(100)) {
      case (?t) { t.sellerResponseDeadline := ?(0); };
      case null {};
    };
    ignore Escrow.checkHandshakeTimeouts(trades);
    let confirmAfter = Escrow.confirmSellerHandshake(trades, bob, 100);
    switch confirmAfter {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
      };
      case (#err(_)) assert false;
    };
    expect.nat(Escrow.countExclusiveTradesForListing(trades, 100)).equal(0);
  });

  test("LG-02 seller silent 24h — cancel, no PaymentIntent", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(101, makeListing(101, bob));
    ignore Escrow.initiateTrade(trades, listings, 101, alice, 101, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch (trades.get(101)) {
      case (?t) {
        expect.bool(t.paymentIntent == null).isTrue();
        t.sellerResponseDeadline := ?(0);
      };
      case null assert false;
    };
    expect.nat(Escrow.checkHandshakeTimeouts(trades)).equal(1);
    switch (trades.get(101)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#cancelled_no_seller_response));
        expect.bool(t.paymentIntent == null).isTrue();
      };
      case null assert false;
    };
  });

  test("LG-03 buyer cancel vs seller ship race — ship wins", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(102, alice, bob, #fulfillment_pending, null);
    trade.paymentIntent := ?{
      token = #USDT_TRC20;
      network = "TRC20";
      exactAmount = 1_000_000;
      recipient = "TXyzSeller";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    trades.add(102, trade);
    ignore Escrow.markShipped(trades, bob, 102, "59000123456789");
    switch (Escrow.buyerCancelBeforeShipment(trades, alice, 102)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    switch (trades.get(102)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#shipped));
      case null assert false;
    };
  });

  test("LG-04 85/10/5 split dust to platform", func() {
    let split = Escrow.computeBuyerCancelPenaltySplit(103);
    expect.nat(split.buyerRefund + split.sellerCompensation + split.platformFee).equal(103);
    expect.nat(split.platformFee).equal(6);
  });

  test("LG-05 two buyers one listing — second rejected", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(104, makeListing(104, bob));
    switch (Escrow.initiateTrade(trades, listings, 104, alice, 104, #USDT_TRC20, null, #none, 0, true, 50_000)) {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
    expect.nat(Escrow.countExclusiveTradesForListing(trades, 104)).equal(1);
    switch (Escrow.initiateTrade(trades, listings, 105, carol, 104, #USDT_TRC20, null, #none, 0, true, 50_000)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    expect.nat(Escrow.countExclusiveTradesForListing(trades, 104)).equal(1);
  });

  test("LG-07 ICRC lock failure rollback — payment_intent restored", func() {
    let ckLedger = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeDigitalListing(106, bob);
    l.priceToken := #ckUSDC;
    listings.add(106, l);
    ignore Escrow.initiateTrade(trades, listings, 106, alice, 106, #ckUSDC, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 106);
    let now = Types.now();
    switch (trades.get(106)) {
      case (?t) {
        t.paymentIntent := ?{
          token = #ckUSDC;
          network = "ICRC";
          exactAmount = 1_030_000;
          recipient = "rdmx6-jaaaa-aaaaa-aaadq-cai";
          expiry = now + 259_200_000_000_000;
          path = #ck;
          createdAt = now;
        };
      };
      case null {};
    };
    ignore Escrow.prepareOnChainTradeLock(trades, alice, 106, ckLedger, 50_000);
    ignore Escrow.rollbackOnChainLockFailure(trades, 106);
    switch (trades.get(106)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#payment_intent));
        expect.bool(t.fundedAt == null).isTrue();
      };
      case null assert false;
    };
  });

  test("LG-08 manual verified blocks duplicate ck lock", func() {
    let ckLedger = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(107, makeListing(107, bob));
    ignore Escrow.initiateTrade(trades, listings, 107, alice, 107, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 107);
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(trades, users, bob, 107, ?1, #manual, 0, false, 50_000);
    ignore Escrow.applyPaymentVerified(trades, listings, 107);
    switch (Escrow.prepareOnChainTradeLock(trades, alice, 107, ckLedger, 50_000)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
    switch (trades.get(107)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#fulfillment_pending));
      case null assert false;
    };
  });

  test("LG-12 NP delivered grace + dispute freezes payout", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(108, makeListing(108, bob));
    let trade = makeTrade(108, alice, bob, #disputed, null);
    trade.npDeliveredAt := ?(0);
    trade.npDeliveredGraceEndsAt := ?(0);
    trades.add(108, trade);
    expect.nat(Escrow.processNpAutoComplete(trades, listings)).equal(0);
    switch (trades.get(108)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#disputed));
      case null assert false;
    };
  });

  test("LG-13 payout wallet changed after lock — payout held", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(109, makeDigitalListing(109, bob));
    ignore Escrow.initiateTrade(trades, listings, 109, alice, 109, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 109);
    let users = Map.empty<Types.UserId, Types.User>();
    let seller = makeSellerWithPayoutWallet();
    users.add(bob, seller);
    ignore Escrow.createPaymentIntent(trades, users, bob, 109, ?1, #manual, 0, false, 50_000);
    ignore Escrow.applyPaymentVerified(trades, listings, 109);
    ignore WalletLink.removeLinkedWallet(seller, 1);
    WalletLink.holdPayoutOnWalletChange(trades, bob, 109);
    switch (Escrow.confirmPaymentReceived(trades, listings, users, bob, 109)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("LG-14 expired PaymentIntent rejects late verify", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(110, makeListing(110, bob));
    ignore Escrow.initiateTrade(trades, listings, 110, alice, 110, #USDT_TRC20, null, #none, 0, true, 50_000);
    ignore Escrow.confirmSellerHandshake(trades, bob, 110);
    let users = Map.empty<Types.UserId, Types.User>();
    users.add(bob, makeSellerWithPayoutWallet());
    ignore Escrow.createPaymentIntent(trades, users, bob, 110, ?1, #manual, 0, false, 50_000);
    switch (trades.get(110)) {
      case (?t) {
        switch (t.paymentIntent) {
          case (?pi) { t.paymentIntent := ?{ pi with expiry = 0 }; };
          case null {};
        };
        t.status := #payment_intent_expired;
      };
      case null {};
    };
    switch (Escrow.applyPaymentVerified(trades, listings, 110)) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("LG-15 ship-by SLA escalates to dispute", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade = makeTrade(111, alice, bob, #fulfillment_pending, null);
    trade.shipByDeadline := ?(0);
    trades.add(111, trade);
    expect.nat(Escrow.checkShipByDeadlines(trades).size()).equal(1);
    switch (trades.get(111)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#dispute_l1));
      case null assert false;
    };
  });

  test("LG-16 upgrade mid-handshake preserves deadline — no early timeout", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(112, makeListing(112, bob));
    ignore Escrow.initiateTrade(trades, listings, 112, alice, 112, #USDT_TRC20, null, #none, 0, true, 50_000);
    let futureDeadline = Types.now() + 43_200_000_000_000; // 12h remaining
    switch (trades.get(112)) {
      case (?t) { t.sellerResponseDeadline := ?futureDeadline; };
      case null {};
    };
    expect.nat(Escrow.resumeHandshakeTimersAfterUpgrade(trades)).equal(1);
    expect.nat(Escrow.checkHandshakeTimeouts(trades)).equal(0);
    switch (trades.get(112)) {
      case (?t) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_seller_handshake));
        switch (t.sellerResponseDeadline) {
          case (?d) expect.nat(d).equal(futureDeadline);
          case null assert false;
        };
      };
      case null assert false;
    };
  });

  test("LG-17 compliance unsigned blocks beta even if tests green", func() {
    expect.bool(LaunchGate.isPublicBetaLaunchAllowed(false, true)).isFalse();
    expect.bool(LaunchGate.isPublicBetaLaunchAllowed(true, false)).isFalse();
    expect.bool(LaunchGate.isPublicBetaLaunchAllowed(true, true)).isTrue();
  });
});

suite("Escrow — digital delivery (E2.S11)", func() {
  let testCanister = Principal.fromText("aaaaa-aa");

  func makeListingWithAsset(id : Nat, seller : Principal) : Types.Listing {
    let l = makeDigitalListing(id, seller);
    l.digitalFileAsset := ?{
      fileVersionId = 1;
      blobHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      mimeType = "application/pdf";
      sizeBytes = 1024;
      blobUrlEncrypted = "00";
      dekEncrypted = "00";
      contentHash = ?"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      registeredAt = Types.now();
    };
    l
  };

  test("W2-1 auto-delivery on payment_verified sets digital_delivered + deliveryRecordAt", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let listing = makeListingWithAsset(0, bob);
    listings.add(0, listing);
    let trade = makeTrade(50, alice, bob, #payment_verified, null);
    trades.add(50, trade);
    switch (DigitalDelivery.autoDeliverDigital(trade, listing, testCanister, Types.now())) {
      case (#ok(dd)) {
        expect.text(debug_show(trade.status)).equal(debug_show(#digital_delivered));
        expect.bool(trade.deliveryRecordAt != null).isTrue();
        expect.nat(dd.fileVersionId).equal(1);
        expect.bool(dd.dekHex != null).isTrue();
      };
      case (#err(_)) assert false;
    };
  });

  test("W2-1 download blocked before funding", func() {
    let trade = makeTrade(51, alice, bob, #manual_payment_pending, null);
    switch (DigitalDelivery.assertDigitalDownloadAllowed(trade)) {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("W2-2 file replace blocked with active trade", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(1, makeListingWithAsset(1, bob));
    ignore Escrow.initiateTrade(trades, listings, 1, alice, 1, #USDT_TRC20, null, #none, 0, true, 50_000);
    switch (DigitalDelivery.assertCanReplaceFile(trades, 1)) {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });
});

suite("Escrow — digital inspection (E7.S2)", func() {
  let testCanister = Principal.fromText("aaaaa-aa");
  let recordT : Types.Timestamp = 1_700_000_000_000_000_000;

  func deliverAt(trades : Map.Map<Types.TradeId, Types.Trade>, listings : Map.Map<Types.ListingId, Types.Listing>, tradeId : Nat, at : Types.Timestamp) : Types.DigitalDelivery {
    let listing = switch (listings.get(0)) {
      case (?l) l;
      case null Runtime.trap("listing missing");
    };
    let trade = switch (trades.get(tradeId)) {
      case (?t) t;
      case null Runtime.trap("trade missing");
    };
    switch (DigitalDelivery.autoDeliverDigital(trade, listing, testCanister, at)) {
      case (#ok(dd)) dd;
      case (#err(e)) Runtime.trap("autoDeliverDigital failed: " # debug_show(e));
    }
  };

  test("W2-4 redownload does not reset 24h inspection deadline", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let listing = makeDigitalListing(0, bob);
    listing.digitalFileAsset := ?{
      fileVersionId = 1;
      blobHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      mimeType = "application/pdf";
      sizeBytes = 1024;
      blobUrlEncrypted = "00";
      dekEncrypted = "00";
      contentHash = ?"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      registeredAt = recordT;
    };
    listings.add(0, listing);
    let trade = makeTrade(60, alice, bob, #payment_verified, null);
    trades.add(60, trade);
    let dd = deliverAt(trades, listings, 60, recordT);
    let originalDeadline = DigitalDelivery.inspectionDeadlineFrom(recordT);
    expect.nat(dd.deliveryRecordAt).equal(recordT);
    expect.nat(DigitalDelivery.resolveInspectionDeadline(dd)).equal(originalDeadline);

    let redownloadAt = recordT + 43_200_000_000_000; // T + 12h
    DigitalDelivery.touchRedownload(dd, redownloadAt);
    expect.nat(DigitalDelivery.resolveInspectionDeadline(dd)).equal(originalDeadline);
    let revealed = switch (dd.revealedAt) { case (?r) r; case null Runtime.trap("revealedAt missing") };
    expect.nat(revealed).equal(redownloadAt);
    switch (Escrow.digitalInspectionDeadline(trade)) {
      case (?d) expect.nat(d).equal(originalDeadline);
      case null assert false;
    };
  });

  test("W2-5 inspection auto-complete at T+24h", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let listing = makeDigitalListing(0, bob);
    listing.digitalFileAsset := ?{
      fileVersionId = 1;
      blobHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      mimeType = "application/pdf";
      sizeBytes = 1024;
      blobUrlEncrypted = "00";
      dekEncrypted = "00";
      contentHash = ?"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      registeredAt = recordT;
    };
    listings.add(0, listing);
    let trade = makeTrade(61, alice, bob, #payment_verified, null);
    trades.add(61, trade);
    ignore deliverAt(trades, listings, 61, recordT);
    let expiredAt = 0;
    switch (trades.get(61)) {
      case (?t) {
        switch (t.digitalDelivery) {
          case (?dd) {
            dd.inspectionDeadline := ?expiredAt;
          };
          case null {};
        };
        expect.bool(Escrow.isDigitalInspectionExpired(t, Types.now())).isTrue();
      };
      case null assert false;
    };
    expect.nat(Escrow.processDigitalInspectionAutoComplete(trades, listings)).equal(1);
    switch (trades.get(61)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#complete));
      case null assert false;
    };
  });

  test("W2-6 dispute during inspection pauses auto-complete", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    listings.add(0, makeDigitalListing(0, bob));
    let trade = makeTrade(62, alice, bob, #disputed, null);
    trade.deliveryRecordAt := ?recordT;
    trade.digitalDelivery := ?{
      fileUrl = "https://example.com/file";
      fileHash = null;
      password = null;
      fileVersionId = 1;
      mimeType = ?"application/pdf";
      dekHex = null;
      deliveryRecordAt = recordT;
      var revealedAt = ?recordT;
      var inspectionDeadline = ?(recordT - 1);
    };
    trades.add(62, trade);
    expect.nat(Escrow.processDigitalInspectionAutoComplete(trades, listings)).equal(0);
    switch (trades.get(62)) {
      case (?t) expect.text(debug_show(t.status)).equal(debug_show(#disputed));
      case null assert false;
    };
  });

  test("W2-12 upgrade mid-inspection resumes deadline from deliveryRecordAt", func() {
    let dd : Types.DigitalDelivery = {
      fileUrl = "https://example.com/file";
      fileHash = null;
      password = null;
      fileVersionId = 1;
      mimeType = ?"application/pdf";
      dekHex = null;
      deliveryRecordAt = recordT;
      var revealedAt = ?recordT;
      var inspectionDeadline = null;
    };
    let deadline = DigitalDelivery.ensureInspectionDeadline(dd);
    expect.nat(deadline).equal(DigitalDelivery.inspectionDeadlineFrom(recordT));
    switch (dd.inspectionDeadline) {
      case (?d) expect.nat(d).equal(deadline);
      case null assert false;
    };
  });
});

suite("Escrow — high-value trade caps (E3.S11)", func() {
  let betaCapUsdCents : Nat = 50_000;

  test("W3-11 manual rejected above 1000 USDT", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeListing(1, bob);
    l.priceAmount := 1_500_000_000;
    listings.add(1, l);
    switch (
      Escrow.initiateTrade(
        trades, listings, 1, alice, 1, #USDT_TRC20, null,
        #verified, 60_000_000, true, betaCapUsdCents,
      )
    ) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("trade above 5000 USDT rejected", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeListing(1, bob);
    l.priceAmount := 5_100_000_000;
    l.priceToken := #ckUSDC;
    listings.add(1, l);
    switch (
      Escrow.initiateTrade(
        trades, listings, 1, alice, 1, #ckUSDC, null,
        #verified, 510_000_000, true, betaCapUsdCents,
      )
    ) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("600 USDT allowed with seller verified tier", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeListing(1, bob);
    l.priceAmount := 600_000_000;
    listings.add(1, l);
    switch (
      Escrow.initiateTrade(
        trades, listings, 1, alice, 1, #USDT_TRC20, null,
        #verified, 0, true, betaCapUsdCents,
      )
    ) {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_seller_handshake));
      };
      case (#err(_)) assert false;
    };
  });

  test("600 USDT rejected without verified tier or elevated stake", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeListing(1, bob);
    l.priceAmount := 600_000_000;
    listings.add(1, l);
    switch (
      Escrow.initiateTrade(
        trades, listings, 1, alice, 1, #USDT_TRC20, null,
        #none, 30_000_000, true, betaCapUsdCents,
      )
    ) {
      case (#ok(_)) assert false;
      case (#err(_)) {};
    };
  });

  test("1500 USDT ckUSDC allowed when Gate C on", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let l = makeDigitalListing(1, bob);
    l.priceToken := #ckUSDC;
    l.priceAmount := 1_500_000_000;
    listings.add(1, l);
    switch (
      Escrow.initiateTrade(
        trades, listings, 1, alice, 1, #ckUSDC, null,
        #verified, 150_000_000, true, betaCapUsdCents,
      )
    ) {
      case (#ok(t)) {
        expect.text(debug_show(t.status)).equal(debug_show(#awaiting_seller_handshake));
      };
      case (#err(_)) assert false;
    };
  });

  test("effectiveCkBetaCap raises ceiling above 1000 USDT", func() {
    expect.nat(Escrow.effectiveCkBetaCapUsdCents(100_001, betaCapUsdCents))
      .equal(500_000);
    expect.nat(Escrow.effectiveCkBetaCapUsdCents(50_000, betaCapUsdCents))
      .equal(betaCapUsdCents);
  });

  test("buildTradeCapTierCheck elevated band requirements", func() {
    let check = Escrow.buildTradeCapTierCheck(
      600_000_000,
      #USDT_TRC20,
      #USDT_TRC20,
      #none,
      60_000_000,
      true,
    );
    expect.bool(check.allowed).isTrue();
    expect.nat(check.elevatedStakeRequired).equal(60_000_000);
  });
});
