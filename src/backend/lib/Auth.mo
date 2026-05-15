import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types";

/// Auth — principal validation, RBAC helpers, ban/suspension checks.
/// All functions are pure (no side effects) — they operate on injected state.
module {

  // ─── Anonymous guard ──────────────────────────────────────────────────────

  /// Traps if caller is the anonymous principal.
  public func assertNotAnonymous(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("anonymous callers are not allowed");
    };
  };

  // ─── User lookup ──────────────────────────────────────────────────────────

  /// Returns the User record for `caller`, or null if not registered.
  public func getUser(
    users  : Map.Map<Principal, Types.User>,
    caller : Principal,
  ) : ?Types.User {
    users.get(caller)
  };

  /// Returns the User record for `caller`; traps if not found.
  public func requireUser(
    users  : Map.Map<Principal, Types.User>,
    caller : Principal,
  ) : Types.User {
    switch (users.get(caller)) {
      case (?u) u;
      case null Runtime.trap("user not registered: " # caller.toText());
    };
  };

  // ─── RBAC predicates ──────────────────────────────────────────────────────

  public func isAdmin(user : Types.User) : Bool {
    user.role == #admin
  };

  public func isModerator(user : Types.User) : Bool {
    switch (user.role) {
      case (#moderator or #admin) true;
      case (_) false;
    };
  };

  public func getRole(user : Types.User) : Types.UserRole {
    user.role
  };

  // ─── Ban / suspension ─────────────────────────────────────────────────────

  /// Traps if the user is banned or currently suspended.
  public func assertNotBanned(user : Types.User) : () {
    if (user.isBanned) {
      Runtime.trap("user is banned");
    };
    switch (user.suspendedUntil) {
      case (?until) {
        if (Time.now() < until) {
          Runtime.trap("user is suspended");
        };
      };
      case null {};
    };
  };

  // ─── Profile conversion ───────────────────────────────────────────────────

  /// Converts the mutable internal User to the immutable public UserProfile.
  /// Includes all private fields — only call for the profile owner (isOwn = true).
  public func toProfile(user : Types.User) : Types.UserProfile {
    {
      id               = user.id;
      username         = user.username;
      bio              = user.bio;
      avatarUrl        = user.avatarUrl;
      role             = user.role;
      createdAt        = user.createdAt;
      reputationScore  = user.reputationScore;
      trustLevel       = user.trustLevel;
      isBanned         = user.isBanned;
      suspendedUntil   = user.suspendedUntil;
      liabilityBalance = user.liabilityBalance;
      liabilityHistory = user.liabilityHistory;
      paymentMethods   = user.paymentMethods;
    }
  };

  /// Converts the mutable internal User to a public UserProfile safe for
  /// non-owner callers. Strips paymentMethods, liabilityBalance, and
  /// liabilityHistory so private financial data is never exposed publicly.
  public func toPublicProfile(user : Types.User) : Types.UserProfile {
    {
      id               = user.id;
      username         = user.username;
      bio              = user.bio;
      avatarUrl        = user.avatarUrl;
      role             = user.role;
      createdAt        = user.createdAt;
      reputationScore  = user.reputationScore;
      trustLevel       = user.trustLevel;
      isBanned         = user.isBanned;
      suspendedUntil   = user.suspendedUntil;
      liabilityBalance = 0;
      liabilityHistory = [];
      paymentMethods   = [];
    }
  };

  // ─── Input validation ─────────────────────────────────────────────────────

  let MAX_USERNAME_LEN : Nat = 50;
  let MIN_USERNAME_LEN : Nat = 3;
  let MAX_BIO_LEN      : Nat = 500;
  let MAX_AVATAR_LEN   : Nat = 512;

  /// Returns true if the character is alphanumeric, a space, or an underscore.
  func isValidUsernameChar(c : Char) : Bool {
    (c >= 'a' and c <= 'z') or
    (c >= 'A' and c <= 'Z') or
    (c >= '0' and c <= '9') or
    c == ' ' or c == '_'
  };

  func validateUsername(username : Text) : ?Types.Error {
    let trimmed = username.trimStart(#predicate(func(c) { c == ' ' }))
                           .trimEnd(#predicate(func(c) { c == ' ' }));
    let len = trimmed.size();
    if (len < MIN_USERNAME_LEN or len > MAX_USERNAME_LEN)
      return ?#invalid_input("Username must be 3–50 characters, letters, numbers, spaces and underscores only");
    // Check each character
    for (c in trimmed.chars()) {
      if (not isValidUsernameChar(c)) {
        return ?#invalid_input("Username must be 3–50 characters, letters, numbers, spaces and underscores only");
      };
    };
    null
  };

  /// Validates an email address if provided (non-empty).
  /// Checks format: local@domain.tld with TLD ≥ 2 chars.
  public func validateEmail(email : Text) : ?Types.Error {
    if (email.size() == 0) return null; // optional field
    // Must contain exactly one '@'
    let parts = email.split(#char '@').toArray();
    if (parts.size() != 2) {
      return ?#invalid_input("Email must be a valid address (e.g. user@example.com)");
    };
    let local  = parts[0];
    let domain = parts[1];
    if (local.size() == 0) {
      return ?#invalid_input("Email must be a valid address (e.g. user@example.com)");
    };
    // Domain must contain a dot
    let domainParts = domain.split(#char '.').toArray();
    if (domainParts.size() < 2) {
      return ?#invalid_input("Email must be a valid address (e.g. user@example.com)");
    };
    let tld = domainParts[domainParts.size() - 1];
    if (tld.size() < 2) {
      return ?#invalid_input("Email must be a valid address (e.g. user@example.com)");
    };
    null
  };

  func validateBio(bio : Text) : ?Types.Error {
    if (bio.size() > MAX_BIO_LEN)
      ?#invalid_input("Bio must be at most 500 characters")
    else null
  };

  func validateAvatarUrl(url : Text) : ?Types.Error {
    if (url.size() > MAX_AVATAR_LEN)
      ?#invalid_input("Avatar URL must be at most 512 characters")
    else null
  };

  // ─── Upsert ───────────────────────────────────────────────────────────────

  /// Creates a new User or updates username/bio/avatarUrl for an existing one.
  /// Returns #err on validation failure, #ok(profile) on success.
  public func upsertUser(
    users     : Map.Map<Principal, Types.User>,
    caller    : Principal,
    username  : Text,
    bio       : Text,
    avatarUrl : Text,
    email     : ?Text,
  ) : Types.Result<Types.UserProfile> {
    switch (validateUsername(username)) {
      case (?e) return #err(e);
      case null {};
    };
    switch (validateBio(bio)) {
      case (?e) return #err(e);
      case null {};
    };
    switch (validateAvatarUrl(avatarUrl)) {
      case (?e) return #err(e);
      case null {};
    };
    switch (email) {
      case (?em) {
        switch (validateEmail(em)) {
          case (?e) return #err(e);
          case null {};
        };
      };
      case null {};
    };

    let profile = switch (users.get(caller)) {
      case (?existing) {
        // Update mutable profile fields
        existing.username  := username;
        existing.bio       := bio;
        existing.avatarUrl := avatarUrl;
        toProfile(existing)
      };
      case null {
        // Create new user with default role and trust level
        let newUser : Types.User = {
          id                       = caller;
          var username             = username;
          var bio                  = bio;
          var avatarUrl            = avatarUrl;
          var role                 = #user;
          createdAt                = Time.now();
          var reputationScore      = 0;
          var trustLevel           = #new_;
          var isBanned             = false;
          var suspendedUntil       = null;
          var liabilityBalance     = 0;
          var liabilityHistory     = [];
          var paymentMethods       = [];
        };
        users.add(caller, newUser);
        toProfile(newUser)
      };
    };
    #ok(profile)
  };
}
