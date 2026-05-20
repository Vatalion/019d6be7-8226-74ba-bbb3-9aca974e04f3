/// Messaging.test.mo — Chat thread, unread counters, participant guards

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Messaging "../src/backend/lib/Messaging";
import Types "../src/backend/types";

let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let anon  = Principal.fromText("2vxsx-fae");

// ─── Helpers ───────────────────────────────────────────────────────────────

let makeTrade = func(
  id     : Nat,
  buyer  : Principal,
  seller : Principal,
) : Types.Trade {
  {
    id;
    listing           = 0;
    buyer;
    seller;
    amount            = 1_000_000;
    token             = #USDT_TRC20;
    var status        = #pending;
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

let makeUser = func(id : Text) : Types.User {
  {
    id = Principal.fromText(id);
    var username = "testuser";
    var bio = "";
    var avatarUrl = "";
    var role = #user;
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

// ─── Anonymous guard ─────────────────────────────────────────────────────────

suite("Messaging — assertNotAnonymous", func() {
  test("passes for real principal", func() {
    Messaging.assertNotAnonymous(alice);
    expect.bool(true).isTrue();
  });
});

// ─── Participant guard ─────────────────────────────────────────────────────────

suite("Messaging — assertTradeParticipant", func() {
  test("passes for buyer", func() {
    let t = makeTrade(1, alice, bob);
    Messaging.assertTradeParticipant(t, alice);
    expect.bool(true).isTrue();
  });

  test("passes for seller", func() {
    let t = makeTrade(1, alice, bob);
    Messaging.assertTradeParticipant(t, bob);
    expect.bool(true).isTrue();
  });
});

// ─── Send ───────────────────────────────────────────────────────────────────

suite("Messaging — sendMessage", func() {
  test("creates a message", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);

    let (msg, nextId) = Messaging.sendMessage(
      messages, tradeIndex, trades, 0, alice, 1, "Hello", []
    );
    expect.nat(msg.id).equal(0);
    expect.text(msg.content).equal("Hello");
    expect.nat(nextId).equal(1);
    expect.nat(messages.size()).equal(1);
  });

  test("escapes HTML in content", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);

    let (msg, _) = Messaging.sendMessage(
      messages, tradeIndex, trades, 0, alice, 1, "<script>alert(1)</script>", []
    );
    expect.text(msg.content).equal("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("indexes by trade", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);

    ignore Messaging.sendMessage(messages, tradeIndex, trades, 0, alice, 1, "A", []);
    ignore Messaging.sendMessage(messages, tradeIndex, trades, 1, bob, 1, "B", []);

    let ids = tradeIndex.get(1);
    switch (ids) {
      case (?list) expect.nat(list.size()).equal(2);
      case null assert false;
    };
  });
});

// ─── Get messages ───────────────────────────────────────────────────────────

suite("Messaging — getMessages", func() {
  test("returns messages for trade", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);
    users.add(alice, makeUser("un4fu-tqaaa-aaaab-qadjq-cai"));
    users.add(bob, makeUser("rdmx6-jaaaa-aaaaa-aaadq-cai"));

    ignore Messaging.sendMessage(messages, tradeIndex, trades, 0, alice, 1, "A", []);
    ignore Messaging.sendMessage(messages, tradeIndex, trades, 1, bob, 1, "B", []);

    let result = Messaging.getMessages(messages, tradeIndex, trades, users, alice, 1, 0, 10);
    expect.nat(result.size()).equal(2);
    expect.text(result[0].content).equal("A");
    expect.text(result[1].content).equal("B");
  });

  test("respects limit", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);
    users.add(alice, makeUser("un4fu-tqaaa-aaaab-qadjq-cai"));

    ignore Messaging.sendMessage(messages, tradeIndex, trades, 0, alice, 1, "A", []);
    ignore Messaging.sendMessage(messages, tradeIndex, trades, 1, bob, 1, "B", []);

    let result = Messaging.getMessages(messages, tradeIndex, trades, users, alice, 1, 0, 1);
    expect.nat(result.size()).equal(1);
  });
});

// ─── Unread count ─────────────────────────────────────────────────────────────

suite("Messaging — getUnreadCount", func() {
  test("counts unread messages", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let lastRead = Map.empty<Messaging.ReadKey, Types.Timestamp>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);

    ignore Messaging.sendMessage(messages, tradeIndex, trades, 0, alice, 1, "A", []);
    ignore Messaging.sendMessage(messages, tradeIndex, trades, 1, alice, 1, "B", []);

    let count = Messaging.getUnreadCount(messages, tradeIndex, trades, lastRead, bob, 1);
    expect.nat(count).equal(2);
  });

  test("zero after markRead", func() {
    let messages = Map.empty<Types.MessageId, Types.Message>();
    let tradeIndex = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let lastRead = Map.empty<Messaging.ReadKey, Types.Timestamp>();
    let t = makeTrade(1, alice, bob);
    trades.add(1, t);

    let (msg, _) = Messaging.sendMessage(messages, tradeIndex, trades, 0, alice, 1, "A", []);
    lastRead.add(Messaging.readKeyCompare, (1, bob), msg.sentAt);

    let count = Messaging.getUnreadCount(messages, tradeIndex, trades, lastRead, bob, 1);
    expect.nat(count).equal(0);
  });
});
