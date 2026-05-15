import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Types "../types";
import AuthLib "../lib/Auth";
import RateLimiter "../lib/RateLimiter";

/// Auth mixin — exposes public user/profile endpoints to the actor.
mixin (
  users        : Map.Map<Principal, Types.User>,
  rateLimitMap : Map.Map<Principal, (Nat, Types.Timestamp)>,
) {

  // ─── Profile ──────────────────────────────────────────────────────────────

  /// Returns the caller's own profile including all private fields,
  /// or null if not registered.
  public shared query ({ caller }) func getMyProfile() : async ?Types.UserProfile {
    switch (AuthLib.getUser(users, caller)) {
      case (?u) ?AuthLib.toProfile(u);
      case null null;
    };
  };

  /// Returns the caller's own payment methods.
  /// Blocks anonymous callers.
  public shared query ({ caller }) func getMyPaymentMethods() : async [Types.PaymentMethod] {
    AuthLib.assertNotAnonymous(caller);
    switch (AuthLib.getUser(users, caller)) {
      case (?u) u.paymentMethods;
      case null [];
    };
  };

  /// Creates or updates the caller's profile.
  /// Blocks anonymous callers and validates inputs.
  public shared ({ caller }) func setMyProfile(
    username  : Text,
    bio       : Text,
    avatarUrl : Text,
    email     : ?Text,
  ) : async Types.Result<Types.UserProfile> {
    AuthLib.assertNotAnonymous(caller);

    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };

    AuthLib.upsertUser(users, caller, username, bio, avatarUrl, email)
  };

  /// Returns a public profile by principal.
  /// Private fields (paymentMethods, liabilityBalance, liabilityHistory) are
  /// stripped for non-owner callers.
  public shared query ({ caller }) func getUserProfile(
    userId : Principal,
  ) : async ?Types.UserProfile {
    switch (AuthLib.getUser(users, userId)) {
      case (?u) {
        if (caller == userId) {
          ?AuthLib.toProfile(u)
        } else {
          ?AuthLib.toPublicProfile(u)
        };
      };
      case null null;
    };
  };
}
