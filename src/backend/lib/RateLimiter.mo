import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types";

/// RateLimiter — sliding-window per-principal rate limiter.
///
/// Design:
///   Each entry in `rateLimitMap` stores `(callCount, windowStartNs)`.
///   On each call:
///     - If windowStartNs is older than `windowNs`, reset the counter.
///     - Otherwise increment and check against maxCalls.
///   Returns `true` if the call is allowed, `false` if rate-limited.
///
/// Default usage: 10 write calls per 60 seconds per principal.
module {

  public let DEFAULT_WINDOW_NS  : Nat = 60_000_000_000;   // 60 seconds
  public let DEFAULT_MAX_CALLS  : Nat = 10;

  /// Checks whether `caller` is within their rate limit and records the call.
  /// Returns `true` if allowed, `false` if the limit is exceeded.
  ///
  /// Parameters:
  ///   caller       — the principal making the call
  ///   windowNs     — sliding window duration in nanoseconds
  ///   maxCalls     — maximum allowed calls within the window
  ///   rateLimitMap — mutable per-principal (callCount, windowStart) map
  public func check(
    caller       : Principal,
    windowNs     : Nat,
    maxCalls     : Nat,
    rateLimitMap : Map.Map<Principal, (Nat, Types.Timestamp)>,
  ) : Bool {
    let now : Types.Timestamp = Time.now();

    switch (rateLimitMap.get(caller)) {
      case null {
        // First call ever — record and allow
        rateLimitMap.add(caller, (1, now));
        true
      };
      case (?(count, windowStart)) {
        let elapsed : Int = now - windowStart;

        if (elapsed < 0 or elapsed >= windowNs.toInt()) {
          // Window has expired — start a fresh window
          rateLimitMap.add(caller, (1, now));
          true
        } else if (count >= maxCalls) {
          // Still within window and limit exceeded
          false
        } else {
          // Within window, increment counter
          rateLimitMap.add(caller, (count + 1, windowStart));
          true
        };
      };
    };
  };

  /// Convenience wrapper using the default window (60 s) and max calls (10).
  public func checkDefault(
    caller       : Principal,
    rateLimitMap : Map.Map<Principal, (Nat, Types.Timestamp)>,
  ) : Bool {
    check(caller, DEFAULT_WINDOW_NS, DEFAULT_MAX_CALLS, rateLimitMap)
  };
}
