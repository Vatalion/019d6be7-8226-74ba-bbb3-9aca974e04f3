/// Disputes.test.mo — Dispute lifecycle, evidence, resolution, appeal

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Disputes "../src/backend/lib/Disputes";
import Types "../src/backend/types";

let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let mod   = Principal.fromText("aaaaa-aa");
let anon  = Principal.fromText("2vxsx-fae");

// ─── Helpers ───────────────────────────────────────────────────────────────

let makeTrade = func(
  id     : Nat,
  buyer  : Principal,
  seller : Principal,
  status : Types.TradeStatus,
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
    var refundDeadline = null;
    var escrowAccount = null;
    var shippingSelection = null;
    var ttnNumber         = null;
    var ttnCreationStatus = #Pending;
    var digitalDelivery   = null;
  }
};

let makeUser = func(id : Text, role : Types.UserRole) : Types.User {
  {
    id = Principal.fromText(id);
    var username = "user";
    var bio = "";
    var avatarUrl = "";
    var role = role;
    createdAt = Time.now();
    var reputationScore = 10;
    var trustLevel = #new_;
    var isBanned = false;
    var suspendedUntil = null;
    var liabilityBalance = 0;
    var liabilityHistory = [];
    var paymentMethods = [];
  }
};

// ─── Open ─────────────────────────────────────────────────────────────────────

suite("Disputes — openDispute", func() {
  test("buyer can open dispute on funded trade", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);

    let result = Disputes.openDispute(disputes, trades, 0, alice, 1, #item_not_received, "Item not received");
    switch result {
      case (#ok(id)) {
        expect.nat(id).equal(0);
        expect.nat(disputes.size()).equal(1);
        switch (trades.get(1)) {
          case (?tr) expect.bool(tr.status == #disputed).isTrue();
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("seller can open dispute", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #buyer_confirmed);
    trades.add(1, t);

    let result = Disputes.openDispute(disputes, trades, 0, bob, 1, #seller_unresponsive, "Buyer not responding");
    switch result {
      case (#ok(id)) expect.nat(id).equal(0);
      case (#err(_)) assert false;
    };
  });

  test("rejects duplicate open dispute (trade becomes disputed)", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);

    let r1 = Disputes.openDispute(disputes, trades, 0, alice, 1, #item_not_received, "");
    expect.nat(disputes.size()).equal(1);
    switch r1 { case (#ok(id)) expect.nat(id).equal(0); case _ assert false };

    // After first dispute, trade.status becomes #disputed, so second attempt fails
    let result = Disputes.openDispute(disputes, trades, 1, alice, 1, #item_not_received, "");
    switch result {
      case (#ok(_)) assert false;
      case (#err(#invalid_input(_))) {};
      case _ assert false;
    };
  });

  test("rejects non-participant", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);

    let result = Disputes.openDispute(disputes, trades, 0, mod, 1, #other, "");
    switch result {
      case (#ok(_)) assert false;
      case (#err(#unauthorized)) {};
      case _ assert false;
    };
  });

  test("rejects trade not funded", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #pending);
    trades.add(1, t);

    let result = Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");
    switch result {
      case (#ok(_)) assert false;
      case (#err(#invalid_input(_))) {};
      case _ assert false;
    };
  });
});

// ─── Evidence ───────────────────────────────────────────────────────────────

suite("Disputes — addEvidence", func() {
  test("participant can add evidence", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");

    let result = Disputes.addEvidence(disputes, trades, alice, 0, []);
    switch result {
      case (#ok(())) {
        switch (disputes.get(0)) {
          case (?d) expect.nat(d.evidenceAttachments.size()).equal(0); // empty array
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("rejects non-participant evidence", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");

    let result = Disputes.addEvidence(disputes, trades, mod, 0, []);
    switch result {
      case (#ok(_)) assert false;
      case (#err(#unauthorized)) {};
      case _ assert false;
    };
  });
});

// ─── Resolve ────────────────────────────────────────────────────────────────

suite("Disputes — resolveDispute", func() {
  test("moderator resolves for seller", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #moderator));
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");

    let result = Disputes.resolveDispute(disputes, trades, users, mod, 0, #seller_wins, "Seller wins");
    switch result {
      case (#ok(())) {
        switch (disputes.get(0)) {
          case (?d) expect.bool(d.status == #resolved).isTrue();
          case null assert false;
        };
        switch (trades.get(1)) {
          case (?tr) expect.bool(tr.status == #complete).isTrue();
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("admin resolves for buyer", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #admin));
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");

    let result = Disputes.resolveDispute(disputes, trades, users, mod, 0, #buyer_wins, "Buyer wins");
    switch result {
      case (#ok(())) {
        switch (trades.get(1)) {
          case (?tr) expect.bool(tr.status == #refunded).isTrue();
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("regular user cannot resolve", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    users.add(alice, makeUser("un4fu-tqaaa-aaaab-qadjq-cai", #user));
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");

    let result = Disputes.resolveDispute(disputes, trades, users, alice, 0, #seller_wins, "");
    switch result {
      case (#ok(_)) assert false;
      case (#err(#unauthorized)) {};
      case _ assert false;
    };
  });
});

// ─── Appeal ─────────────────────────────────────────────────────────────────

suite("Disputes — appealDispute", func() {
  test("participant can appeal within 7 days", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #funded);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #moderator));
    ignore Disputes.openDispute(disputes, trades, 0, alice, 1, #other, "");
    ignore Disputes.resolveDispute(disputes, trades, users, mod, 0, #seller_wins, "");

    let result = Disputes.appealDispute(disputes, trades, alice, 0, "New evidence");
    switch result {
      case (#ok(())) {
        switch (disputes.get(0)) {
          case (?d) expect.bool(d.status == #under_review).isTrue();
          case null assert false;
        };
        switch (trades.get(1)) {
          case (?tr) expect.bool(tr.status == #disputed).isTrue();
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });
});
