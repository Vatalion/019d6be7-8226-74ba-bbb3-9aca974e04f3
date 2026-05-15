/// Reputation.test.mo — Reputation tier gates and score calculation tests

import { suite; test; expect } "mo:test";
import Reputation "../src/backend/lib/Reputation";

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
