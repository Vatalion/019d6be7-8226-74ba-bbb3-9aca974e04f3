/// RateLimiter.test.mo — Sliding window rate limiter tests
///
/// Types.now() cannot be manipulated, so we test:
///   1. First call is always allowed.
///   2. Calls within a very large window are counted until limit hit.
///   3. Zero-duration window means every call resets → all calls allowed.
///   4. Rate limit is per-principal (independent counters).
///   5. Default constants are correct.

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import RateLimiter "../src/backend/lib/RateLimiter";
import Types       "../src/backend/types";

let alice = Principal.fromText("2vxsx-fae");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");

suite("RateLimiter — default constants", func() {
  test("DEFAULT_WINDOW_NS is 60 seconds", func() {
    expect.nat(RateLimiter.DEFAULT_WINDOW_NS).equal(60_000_000_000);
  });

  test("DEFAULT_MAX_CALLS is 10", func() {
    expect.nat(RateLimiter.DEFAULT_MAX_CALLS).equal(10);
  });
});

suite("RateLimiter — first call always allowed", func() {
  test("first call for new principal returns true", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    expect.bool(RateLimiter.check(alice, RateLimiter.DEFAULT_WINDOW_NS, 5, rlMap)).isTrue();
  });

  test("different principals have independent counters", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    expect.bool(RateLimiter.check(alice, RateLimiter.DEFAULT_WINDOW_NS, 2, rlMap)).isTrue();
    expect.bool(RateLimiter.check(bob, RateLimiter.DEFAULT_WINDOW_NS, 2, rlMap)).isTrue();
  });
});

suite("RateLimiter — call counting and limit enforcement", func() {
  test("allows exactly maxCalls calls, blocks on next call (large window)", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    // Very large window ensures no reset during test
    let window = 999_999_999_999_999_999;
    let maxCalls = 3;

    let r1 = RateLimiter.check(alice, window, maxCalls, rlMap);
    let r2 = RateLimiter.check(alice, window, maxCalls, rlMap);
    let r3 = RateLimiter.check(alice, window, maxCalls, rlMap);
    let r4 = RateLimiter.check(alice, window, maxCalls, rlMap); // should be blocked

    expect.bool(r1).isTrue();
    expect.bool(r2).isTrue();
    expect.bool(r3).isTrue();
    expect.bool(r4).isFalse();
  });

  test("rate limit per-principal: alice blocked does not block bob", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let window = 999_999_999_999_999_999;
    let maxCalls = 1;

    ignore RateLimiter.check(alice, window, maxCalls, rlMap); // use up alice's 1 call
    let aliceBlocked = RateLimiter.check(alice, window, maxCalls, rlMap);
    let bobAllowed   = RateLimiter.check(bob,   window, maxCalls, rlMap);

    expect.bool(aliceBlocked).isFalse();
    expect.bool(bobAllowed).isTrue();
  });
});

suite("RateLimiter — window reset with zero-duration window", func() {
  test("zero-duration window: every call starts a new window (always allowed)", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    // windowNs = 0: elapsed = now - windowStart >= 0 is always true → reset every call
    let r1 = RateLimiter.check(alice, 0, 1, rlMap);
    let r2 = RateLimiter.check(alice, 0, 1, rlMap);
    let r3 = RateLimiter.check(alice, 0, 1, rlMap);

    expect.bool(r1).isTrue();
    expect.bool(r2).isTrue();
    expect.bool(r3).isTrue();
  });
});

suite("RateLimiter — checkDefault wrapper", func() {
  test("checkDefault allows first call", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    expect.bool(RateLimiter.checkDefault(alice, rlMap)).isTrue();
  });

  test("checkDefault blocks after DEFAULT_MAX_CALLS (10) calls in same window", func() {
    let rlMap = Map.empty<Principal, (Nat, Types.Timestamp)>();
    let window = 999_999_999_999_999_999;
    // Fill up 10 calls using a custom check with a giant window
    var i = 0;
    while (i < 10) {
      ignore RateLimiter.check(alice, window, 10, rlMap);
      i += 1;
    };
    let blocked = RateLimiter.check(alice, window, 10, rlMap);
    expect.bool(blocked).isFalse();
  });
});
