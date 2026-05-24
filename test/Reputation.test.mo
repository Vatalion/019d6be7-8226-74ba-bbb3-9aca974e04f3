/// Reputation.test.mo — Reputation tier gates and score calculation tests

import { suite; test; expect } "mo:test";
import Reputation "../src/backend/lib/Reputation";
import Types "../src/backend/types";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

suite("Reputation — maxTradeAmount tier gates", func() {
  test("score 0 → Tier 1: $1,000 (100_000 cents)", func() {
    expect.nat(Reputation.maxTradeAmount(0)).equal(100_000);
  });

  test("score 49 → still Tier 1 (below Tier 2 threshold)", func() {
    expect.nat(Reputation.maxTradeAmount(49)).equal(100_000);
  });

  test("score 50 → Tier 2: $5,000 (500_000 cents)", func() {
    expect.nat(Reputation.maxTradeAmount(50)).equal(500_000);
  });

  test("score 199 → still Tier 2 (below Tier 3 threshold)", func() {
    expect.nat(Reputation.maxTradeAmount(199)).equal(500_000);
  });

  test("score 200 → Tier 3: $100,000 (10_000_000 cents)", func() {
    expect.nat(Reputation.maxTradeAmount(200)).equal(10_000_000);
  });

  test("score 999 → Tier 3 (10_000_000 cents)", func() {
    expect.nat(Reputation.maxTradeAmount(999)).equal(10_000_000);
  });
});

suite("Reputation — canTradeAmount", func() {
  test("new user (score 0) can trade up to $1,000", func() {
    expect.bool(Reputation.canTradeAmount(0, 100_000)).isTrue();
    expect.bool(Reputation.canTradeAmount(0, 100_001)).isFalse();
  });

  test("Tier 2 user (score 50) can trade up to $5,000", func() {
    expect.bool(Reputation.canTradeAmount(50, 500_000)).isTrue();
    expect.bool(Reputation.canTradeAmount(50, 500_001)).isFalse();
  });

  test("Tier 3 user (score 200) can trade up to $100,000", func() {
    expect.bool(Reputation.canTradeAmount(200, 10_000_000)).isTrue();
    expect.bool(Reputation.canTradeAmount(200, 10_000_001)).isFalse();
  });
});

suite("Reputation — calculateScore", func() {
  test("10 completed trades, 0 disputes, 0 cancellations → 100", func() {
    expect.int(Reputation.calculateScore(10, 0, 0)).equal(100);
  });

  test("5 completed, 1 dispute lost, 0 cancellations → 30", func() {
    expect.int(Reputation.calculateScore(5, 1, 0)).equal(30);
  });

  test("0 completed, 0 disputes, 1 cancellation → -5", func() {
    expect.int(Reputation.calculateScore(0, 0, 1)).equal(-5);
  });

  test("3 completed, 2 disputes, 1 cancellation → -15", func() {
    expect.int(Reputation.calculateScore(3, 2, 1)).equal(-15);
  });

  test("20 completed trades → non-negative score", func() {
    expect.bool(Reputation.calculateScore(20, 0, 0) >= 0).isTrue();
  });
});

suite("Reputation — calculateTrustLevel", func() {
  test("0 completed trades → #new_", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(0))).equal(debug_show(#new_));
  });

  test("1 completed trade → #bronze", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(1))).equal(debug_show(#bronze));
  });

  test("5 completed trades → #bronze", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(5))).equal(debug_show(#bronze));
  });

  test("6 completed trades → #silver", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(6))).equal(debug_show(#silver));
  });

  test("25 completed trades → #silver", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(25))).equal(debug_show(#silver));
  });

  test("26 completed trades → #gold", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(26))).equal(debug_show(#gold));
  });

  test("100 completed trades → #gold", func() {
    expect.text(debug_show(Reputation.calculateTrustLevel(100))).equal(debug_show(#gold));
  });
});

suite("Reputation — liability depth (E6.S6)", func() {
  func sampleUser(id : Principal) : Types.User {
    {
      id;
      var username = "u";
      var bio = "";
      var avatarUrl = "";
      var role = #user;
      createdAt = 0;
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
      var linkedWallets = [];
      var accountClosedAt = null;
    }
  };

  test("createLiability assigns unique ID and records fields", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let seller = sampleUser(Principal.fromText("aaaaa-aa"));
    let mod = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    let id = Reputation.createLiability(
      records, nextId, seller, 50_000, #USDT_TRC20, #dispute_lost, mod, ?42,
    );
    expect.nat(id).equal(1);
    expect.int(seller.liabilityBalance).equal(-50_000);
    switch (records.get(1)) {
      case null { expect.bool(false).isTrue() };
      case (?rec) {
        expect.nat(rec.originalAmount).equal(50_000);
        expect.nat(rec.remainingBalance).equal(50_000);
        expect.text(debug_show(rec.status)).equal(debug_show(#open));
        switch (rec.tradeId) {
          case (?tid) { expect.nat(tid).equal(42) };
          case null { expect.bool(false).isTrue() };
        };
      };
    };
  });

  test("applyStakeSeizure sets partial status when residual > 0", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let seller = sampleUser(Principal.fromText("aaaaa-aa"));
    let id = Reputation.createLiability(
      records, nextId, seller, 10_000, #USDT_TRC20, #seller_fault,
      Principal.fromText("aaaaa-aa"), ?1,
    );
    switch (Reputation.applyStakeSeizure(records, seller, id, 3_000, seller.id)) {
      case (#ok(())) {};
      case (#err(_)) { expect.bool(false).isTrue() };
    };
    switch (records.get(id)) {
      case null { expect.bool(false).isTrue() };
      case (?rec) {
        expect.nat(rec.remainingBalance).equal(7_000);
        expect.text(debug_show(rec.status)).equal(debug_show(#partial));
      };
    };
    expect.int(seller.liabilityBalance).equal(-7_000);
  });

  test("partialClearLiability writes audit and clears block when below threshold", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let seller = sampleUser(Principal.fromText("aaaaa-aa"));
    let admin = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    let id = Reputation.createLiability(
      records, nextId, seller, 15_000, #USDT_TRC20, #dispute_lost, admin, ?2,
    );
    switch (Reputation.partialClearLiability(records, seller, id, 10_000, admin, "goodwill")) {
      case (#ok(())) {};
      case (#err(_)) { expect.bool(false).isTrue() };
    };
    expect.bool(Reputation.isTradeBlocked(seller)).isFalse();
    switch (records.get(id)) {
      case null { expect.bool(false).isTrue() };
      case (?rec) {
        expect.nat(rec.remainingBalance).equal(5_000);
        expect.nat(rec.auditTrail.size()).equal(2);
      };
    };
  });

  test("tradeBlockedErrorUa cites liability ID", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let seller = sampleUser(Principal.fromText("aaaaa-aa"));
    ignore Reputation.createLiability(
      records, nextId, seller, 20_000, #USDT_TRC20, #dispute_lost,
      Principal.fromText("aaaaa-aa"), null,
    );
    let msg = Reputation.tradeBlockedErrorUa(seller, records);
    expect.bool(msg.contains(#text "№1")).isTrue();
    expect.bool(msg.contains(#text "заблоковано")).isTrue();
  });

  test("sortedLiabilitiesForAdmin orders by severity then age", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let u1 = sampleUser(Principal.fromText("aaaaa-aa"));
    let u2 = sampleUser(Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"));
    ignore Reputation.createLiability(
      records, nextId, u1, 5_000, #USDT_TRC20, #dispute_lost, u1.id, null,
    );
    ignore Reputation.createLiability(
      records, nextId, u2, 20_000, #USDT_TRC20, #dispute_lost, u2.id, null,
    );
    let sorted = Reputation.sortedLiabilitiesForAdmin(records);
    expect.nat(sorted.size()).equal(2);
    expect.nat(sorted[0].remainingBalance).equal(20_000);
    expect.nat(sorted[1].remainingBalance).equal(5_000);
  });

  test("clearLiability resets all open records", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let seller = sampleUser(Principal.fromText("aaaaa-aa"));
    let admin = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    ignore Reputation.createLiability(
      records, nextId, seller, 5_000, #USDT_TRC20, #cancellation_fee, admin, null,
    );
    Reputation.clearLiability(records, seller, admin, "admin review");
    expect.int(seller.liabilityBalance).equal(0);
    expect.nat(seller.liabilityHistory.size()).equal(2);
  });
});

suite("Reputation — liability and dual scores", func() {
  test("isTradeBlocked when liability exceeds threshold", func() {
    let user : Types.User = {
      id = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
      var username = "u";
      var bio = "";
      var avatarUrl = "";
      var role = #user;
      createdAt = 0;
      var reputationScore = 0;
      var buyerScore = 0;
      var sellerScore = 0;
      var trustLevel = #new_;
    var kycTier = #none;
      var isBanned = false;
      var suspendedUntil = null;
      var liabilityBalance = -20_000;
      var liabilityHistory = [];
      var paymentMethods = [];
    var linkedWallets = [];
      var accountClosedAt = null;
    };
    expect.bool(Reputation.isTradeBlocked(user)).isTrue();
  });

  test("ensureDualScores copies legacy reputationScore", func() {
    let user : Types.User = {
      id = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      var username = "u";
      var bio = "";
      var avatarUrl = "";
      var role = #user;
      createdAt = 0;
      var reputationScore = 42;
      var buyerScore = 0;
      var sellerScore = 0;
      var trustLevel = #bronze;
    var kycTier = #none;
      var isBanned = false;
      var suspendedUntil = null;
      var liabilityBalance = 0;
      var liabilityHistory = [];
      var paymentMethods = [];
    var linkedWallets = [];
      var accountClosedAt = null;
    };
    Reputation.ensureDualScores(user);
    expect.int(user.buyerScore).equal(42);
    expect.int(user.sellerScore).equal(42);
  });

  test("clearLiability resets balance via records", func() {
    let records = Map.empty<Nat, Types.LiabilityRecord>();
    let nextId = { var value = 1 : Nat };
    let user : Types.User = {
      id = Principal.fromText("aaaaa-aa");
      var username = "u";
      var bio = "";
      var avatarUrl = "";
      var role = #user;
      createdAt = 0;
      var reputationScore = 0;
      var buyerScore = 0;
      var sellerScore = 0;
      var trustLevel = #new_;
    var kycTier = #none;
      var isBanned = false;
      var suspendedUntil = null;
      var liabilityBalance = -5_000;
      var liabilityHistory = [];
      var paymentMethods = [];
    var linkedWallets = [];
      var accountClosedAt = null;
    };
    Reputation.clearLiability(
      records, user, Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"), "admin review",
    );
    expect.int(user.liabilityBalance).equal(0);
    expect.nat(user.liabilityHistory.size()).equal(1);
  });
});

suite("Reputation — KYC verified tier doubles limits", func() {
  test("verified tier doubles max trade amount", func() {
    expect.nat(Reputation.maxTradeAmountForTier(0, #verified)).equal(200_000);
    expect.nat(Reputation.maxTradeAmountForTier(50, #verified)).equal(1_000_000);
  });

  test("canTradeAmountForUser respects verified boost", func() {
    expect.bool(Reputation.canTradeAmountForUser(0, #verified, 200_000)).isTrue();
    expect.bool(Reputation.canTradeAmountForUser(0, #verified, 200_001)).isFalse();
  });
});
