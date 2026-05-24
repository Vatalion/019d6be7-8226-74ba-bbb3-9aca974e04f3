import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types";
import Marketplace "../lib/Marketplace";
import Escrow "../lib/Escrow";
import ExportMapper "../lib/ExportMapper";

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

  public func isBannedOrSuspended(user : Types.User) : Bool {
    if (user.isBanned) return true;
    switch (user.suspendedUntil) {
      case (?until) Types.now() < until;
      case null false;
    }
  };

  /// Active admin — role flag and not banned/suspended (F-033).
  public func canActAsAdmin(user : Types.User) : Bool {
    if (isBannedOrSuspended(user)) return false;
    isAdmin(user)
  };

  /// Active moderator (includes admin) — not banned/suspended (F-033).
  public func canActAsModerator(user : Types.User) : Bool {
    if (isBannedOrSuspended(user)) return false;
    isModerator(user)
  };

  public func getRole(user : Types.User) : Types.UserRole {
    user.role
  };

  // ─── Ban / suspension ─────────────────────────────────────────────────────

  /// Traps if the user is banned or currently suspended.
  public func assertNotBanned(user : Types.User) : () {
    if (isBannedOrSuspended(user)) {
      if (user.isBanned) {
        Runtime.trap("user is banned");
      };
      Runtime.trap("user is suspended");
    };
  };

  /// Requires registered user and traps if banned/suspended (financial mutators).
  public func assertCallerNotBanned(
    users : Map.Map<Principal, Types.User>,
    caller : Principal,
  ) : () {
    assertNotBanned(requireUser(users, caller));
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
      buyerScore       = user.buyerScore;
      sellerScore      = user.sellerScore;
      trustLevel       = user.trustLevel;
      kycTier          = user.kycTier;
      isBanned         = user.isBanned;
      suspendedUntil   = Types.optNat(user.suspendedUntil);
      liabilityBalance = user.liabilityBalance;
      liabilityHistory = user.liabilityHistory;
      paymentMethods   = user.paymentMethods;
      linkedWallets    = user.linkedWallets;
      accountClosedAt  = Types.optNat(user.accountClosedAt);
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
      buyerScore       = user.buyerScore;
      sellerScore      = user.sellerScore;
      trustLevel       = user.trustLevel;
      kycTier          = user.kycTier;
      isBanned         = user.isBanned;
      suspendedUntil   = Types.optNat(user.suspendedUntil);
      liabilityBalance = 0;
      liabilityHistory = [];
      paymentMethods   = [];
      linkedWallets    = [];
      accountClosedAt  = Types.optNat(user.accountClosedAt);
    }
  };

  // ─── Input validation ─────────────────────────────────────────────────────

  let MAX_USERNAME_LEN : Nat = 50;
  let MIN_USERNAME_LEN : Nat = 3;
  let MAX_BIO_LEN      : Nat = 500;
  let MAX_AVATAR_LEN   : Nat = 512;
  let DELETE_CONFIRMATION : Text = "DELETE";
  let MAX_EXPORT_LISTINGS : Nat = 500;
  let MAX_EXPORT_MESSAGES : Nat = 2_000;

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
        switch (existing.accountClosedAt) {
          case (?_) return #err(#invalid_input("Account is closed"));
          case null {};
        };
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
          createdAt                = Types.now();
          var reputationScore      = 0;
          var buyerScore           = 0;
          var sellerScore          = 0;
          var trustLevel           = #new_;
          var kycTier              = #none;
          var isBanned             = false;
          var suspendedUntil       = null;
          var liabilityBalance     = 0;
          var liabilityHistory     = [];
          var paymentMethods       = [];
          var linkedWallets        = [];
          var accountClosedAt      = null;
        };
        users.add(caller, newUser);
        toProfile(newUser)
      };
    };
    #ok(profile)
  };

  // ─── GDPR export / account closure ────────────────────────────────────────

  func isTradeParticipant(trade : Types.Trade, userId : Types.UserId) : Bool {
    Principal.equal(trade.buyer, userId) or Principal.equal(trade.seller, userId)
  };

  func isBlockingTradeStatus(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#complete or #refunded or #cancelled or #cancelled_no_seller_response or #cancelled_buyer_pre_ship) false;
      case (_) true;
    }
  };

  func takeChars(t : Text, max : Nat) : Text {
    var acc = "";
    var n : Nat = 0;
    for (c in t.chars()) {
      if (n >= max) break;
      acc #= Text.fromChar(c);
      n += 1;
    };
    acc
  };

  func deletedUsername(userId : Types.UserId) : Text {
    "del_" # takeChars(userId.toText(), 20)
  };

  func collectFeedback(
    feedbacks         : Map.Map<Types.FeedbackId, Types.Feedback>,
    userFeedbackIndex : Map.Map<Types.UserId, List.List<Types.FeedbackId>>,
    userId            : Types.UserId,
  ) : [Types.Feedback] {
    switch (userFeedbackIndex.get(userId)) {
      case null [];
      case (?ids) {
        ids.toArray().filterMap<Types.FeedbackId, Types.Feedback>(func(fid) {
          feedbacks.get(fid)
        })
      };
    }
  };

  func collectTradeMessages(
    trades     : Map.Map<Types.TradeId, Types.Trade>,
    tradeIndex : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    messages   : Map.Map<Types.MessageId, Types.Message>,
    userId     : Types.UserId,
    maxCount   : Nat,
  ) : [Types.AccountMessageExport] {
    var buf = List.empty<Types.AccountMessageExport>();
    var count : Nat = 0;
    label outer for (t in trades.values()) {
      if (count >= maxCount) { break outer };
      if (not isTradeParticipant(t, userId)) { continue outer };
      switch (tradeIndex.get(t.id)) {
        case null {};
        case (?ids) {
          for (msgId in ids.toArray().vals()) {
            if (count >= maxCount) { break outer };
            switch (messages.get(msgId)) {
              case (?m) {
                buf.add(ExportMapper.toMessageExport(t.id, m));
                count += 1;
              };
              case null {};
            };
          };
        };
      };
    };
    buf.toArray()
  };

  /// Builds a principal-scoped export bundle (no other users' private data).
  public func buildAccountExport(
    users             : Map.Map<Types.UserId, Types.User>,
    listings          : Map.Map<Types.ListingId, Types.Listing>,
    trades            : Map.Map<Types.TradeId, Types.Trade>,
    messages          : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex        : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    savedSearches     : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    favorites         : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    feedbacks         : Map.Map<Types.FeedbackId, Types.Feedback>,
    userFeedbackIndex : Map.Map<Types.UserId, List.List<Types.FeedbackId>>,
    caller            : Types.UserId,
  ) : Types.AccountExportBundle {
    let now = Types.exportInt(Types.now());
    let (hasProfile, profile) = switch (users.get(caller)) {
      case (?u) (true, ExportMapper.toProfileExport(u));
      case null (false, ExportMapper.emptyProfileExport(caller));
    };

    let listingRows = Marketplace.getListingsByUser(listings, caller, 0, MAX_EXPORT_LISTINGS);
    let listingCards = listingRows.map(func(l : Types.Listing) : Types.ListingCard {
      switch (users.get(caller)) {
        case (?seller) Marketplace.toListingCard(l, seller, Types.now());
        case null Marketplace.toListingCardAnon(l, Types.now());
      }
    }).map(ExportMapper.toListingCardExport);

    let tradeViews = Escrow.getMyTrades(trades, caller, #all).map(ExportMapper.toTradeViewExport);
    let msgExports = collectTradeMessages(trades, tradeIndex, messages, caller, MAX_EXPORT_MESSAGES);

    let searches = switch (savedSearches.get(caller)) {
      case (?rows) rows.toArray().map(ExportMapper.toSavedSearchExport);
      case null [];
    };

    let favIds = switch (favorites.get(caller)) {
      case (?s) s.toArray();
      case null [];
    };

    let feedbackRows = collectFeedback(feedbacks, userFeedbackIndex, caller).map(ExportMapper.toFeedbackExport);

    {
      exportedAt = now;
      principal = caller;
      hasProfile = hasProfile;
      profile = profile;
      listings = listingCards;
      trades = tradeViews;
      messages = msgExports;
      savedSearches = searches;
      favoriteListingIds = favIds;
      feedback = feedbackRows;
    }
  };

  /// Anonymizes profile PII, clears payment methods, deactivates active listings.
  /// Blocks when open trades exist (not complete/refunded/cancelled).
  public func deleteMyAccount(
    users         : Map.Map<Types.UserId, Types.User>,
    listings      : Map.Map<Types.ListingId, Types.Listing>,
    trades        : Map.Map<Types.TradeId, Types.Trade>,
    savedSearches : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    favorites     : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    notifications : Map.Map<Types.UserId, List.List<Types.NotificationEvent>>,
    caller        : Types.UserId,
    confirmation  : Text,
  ) : Types.Result<()> {
    if (confirmation != DELETE_CONFIRMATION) {
      return #err(#invalid_input("Type DELETE to confirm account closure"));
    };

    let user = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#not_found);
    };

    switch (user.accountClosedAt) {
      case (?_) return #err(#invalid_input("Account is already closed"));
      case null {};
    };

    for (t in trades.values()) {
      if (isTradeParticipant(t, caller) and isBlockingTradeStatus(t.status)) {
        return #err(#invalid_input("Complete or cancel open trades before closing your account"));
      };
    };

    let now = Types.now();
    user.username := deletedUsername(caller);
    user.bio := "";
    user.avatarUrl := "";
    user.paymentMethods := [];
    user.accountClosedAt := ?now;

    for (l in listings.values()) {
      if (Principal.equal(l.seller, caller) and l.status == #active) {
        l.status := #inactive;
        l.resolvedAt := ?now;
      };
    };

    savedSearches.remove(caller);
    favorites.remove(caller);
    notifications.remove(caller);

    #ok(())
  };
}
