/// Escrow.test.mo — Trade state machine transition tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Escrow "../src/backend/lib/Escrow";
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
    createdAt         = Time.now();
    var fundedAt      = null;
    var confirmedAt   = null;
    var completedAt   = null;
    var refundDeadline = deadline;
    var escrowAccount = null;
    var shippingSelection = null;
    var ttnNumber         = null;
    var ttnCreationStatus = #Pending;
    var digitalDelivery   = null;
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
    createdAt       = Time.now();
    var expiresAt   = Time.now() + 86_400_000_000_000;
    var viewCount   = 0;
    var packageDetails   = null;
    var novaPoshtaConfig = null;
    var ukrposhtaConfig  = null;
    var meestConfig      = null;
    var digitalFileHash          = null;
    var digitalPassword           = null;
    var digitalFileUrlEncrypted   = null;
    var digitalPasswordEncrypted  = null;
    var resolvedAt                = null;
    var bumpedAt                  = Time.now();
    var promotedUntil             = null;
  }
};

// Non-anonymous principals for testing (2vxsx-fae is the anonymous principal)
let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");

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
    let trade  = makeTrade(1, alice, bob, #pending, ?(Time.now() + 259_200_000_000_000));
    trades.add(1, trade);
    let result = Escrow.confirmPaymentSent(trades, alice, 1);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#buyer_confirmed));
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentSent: funded → buyer_confirmed", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(2, alice, bob, #funded, ?(Time.now() + 259_200_000_000_000));
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

  test("confirmPaymentReceived: buyer_confirmed → complete", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let listing  = makeListing(0, bob);
    listings.add(0, listing);
    let trade    = makeTrade(4, alice, bob, #buyer_confirmed, null);
    trades.add(4, trade);
    let result = Escrow.confirmPaymentReceived(trades, listings, bob, 4);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#complete));
      case (#err(_)) assert false;
    };
  });

  test("confirmPaymentReceived: pending → error (invalid transition)", func() {
    let trades   = Map.empty<Types.TradeId, Types.Trade>();
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let trade    = makeTrade(5, alice, bob, #pending, null);
    trades.add(5, trade);
    let result = Escrow.confirmPaymentReceived(trades, listings, bob, 5);
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
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#disputed));
      case (#err(_)) assert false;
    };
  });

  test("openDispute: funded → disputed (seller-initiated)", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let trade  = makeTrade(7, alice, bob, #funded, null);
    trades.add(7, trade);
    let result = Escrow.openDispute(trades, bob, 7);
    switch result {
      case (#ok(t)) expect.text(debug_show(t.status)).equal(debug_show(#disputed));
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
});
