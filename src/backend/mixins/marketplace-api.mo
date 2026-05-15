import Map "mo:core/Map";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Types "../types";
import Auth "../lib/Auth";
import Marketplace "../lib/Marketplace";
import Reputation "../lib/Reputation";
import PaymentsLib "../lib/Payments";
import RateLimiter "../lib/RateLimiter";

/// Marketplace mixin — public canister API for listing management.
mixin (
  listings    : Map.Map<Types.ListingId, Types.Listing>,
  users       : Map.Map<Types.UserId, Types.User>,
  spamTracker : Map.Map<Types.UserId, Types.Timestamp>,
  nextListingId : { var value : Nat },
  rateLimitCreateListing  : Map.Map<Principal, (Nat, Types.Timestamp)>,
  rateLimitListingMutations : Map.Map<Principal, (Nat, Types.Timestamp)>,
) {

  // ─── Create ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func createListing(
    title          : Text,
    description    : Text,
    category       : Types.ListingCategory,
    priceAmount    : Nat,
    priceToken     : Types.TradeToken,
    condition      : Types.ItemCondition,
    photos         : [Text],
    location       : Text,
    shippingMethods : [Types.ShippingMethod],
    isDigital      : Bool,
    digitalFileUrl : ?Text,
    digitalFileHash   : ?Text,
    digitalPassword   : ?Text,
    packageDetails    : ?Types.PackageDetails,
    novaPoshtaConfig  : ?Types.NovaPoshtaConfig,
    ukrposhtaConfig   : ?Types.UkrposhtaConfig,
    meestConfig       : ?Types.MeestConfig,
  ) : async Types.Result<Types.ListingCard> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: 1 listing per minute per principal
    if (not RateLimiter.check(caller, 60_000_000_000, 1, rateLimitCreateListing)) {
      return #err(#rate_limited);
    };

    // Return structured errors instead of trapping — lets the frontend show
    // proper messages ("please set up a profile", "you are banned", etc.)
    let user = switch (Auth.getUser(users, caller)) {
      case null { return #err(#not_found) };
      case (?u) u;
    };
    Auth.assertNotBanned(user);

    // ─── Reputation gate ────────────────────────────────────────────────────
    let priceUsdCents = PaymentsLib.tokenAmountToUsdCents(priceAmount, priceToken);
    if (not Reputation.canTradeAmount(user.reputationScore, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateError(user.reputationScore, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── Liability gate ─────────────────────────────────────────────────────
    let LIABILITY_BLOCK_THRESHOLD : Int = 10_000; // $100 in USD cents
    if (user.liabilityBalance < 0 and Int.abs(user.liabilityBalance) > LIABILITY_BLOCK_THRESHOLD) {
      return #err(#invalid_input("Your account has outstanding liability. Please settle before creating new listings."));
    };
    // ───────────────────────────────────────────────────────────────────────

    let id = nextListingId.value;
    nextListingId.value += 1;

    let result = Marketplace.createListing(
      listings, spamTracker, id, caller,
      title, description, category,
      priceAmount, priceToken, condition,
      photos, location, shippingMethods,
      isDigital, digitalFileUrl,
      digitalFileHash, digitalPassword,
      packageDetails, novaPoshtaConfig,
      ukrposhtaConfig, meestConfig,
    );

    switch (result) {
      case (#err(e)) { #err(e) };
      case (#ok(card)) {
        // Enrich card with real seller data
        #ok({ card with
          sellerUsername   = user.username;
          sellerRating     = user.reputationScore;
          sellerTrustLevel = user.trustLevel;
          sellerPrincipal  = caller;
        })
      };
    }
  };

  // ─── Update ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func updateListing(
    id             : Types.ListingId,
    title          : Text,
    description    : Text,
    category       : Types.ListingCategory,
    priceAmount    : Nat,
    priceToken     : Types.TradeToken,
    condition      : Types.ItemCondition,
    photos         : [Text],
    location       : Text,
    shippingMethods : [Types.ShippingMethod],
    digitalFileUrl : ?Text,
    digitalFileHash   : ?Text,
    digitalPassword   : ?Text,
    packageDetails    : ?Types.PackageDetails,
    novaPoshtaConfig  : ?Types.NovaPoshtaConfig,
    ukrposhtaConfig   : ?Types.UkrposhtaConfig,
    meestConfig       : ?Types.MeestConfig,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: max 20 listing mutations per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 20, rateLimitListingMutations)) {
      return #err(#rate_limited);
    };

    let user = Auth.requireUser(users, caller);
    Auth.assertNotBanned(user);

    // ─── Reputation gate ────────────────────────────────────────────────────
    let priceUsdCents = PaymentsLib.tokenAmountToUsdCents(priceAmount, priceToken);
    if (not Reputation.canTradeAmount(user.reputationScore, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateError(user.reputationScore, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── Liability gate ─────────────────────────────────────────────────────
    let LIABILITY_BLOCK_THRESHOLD : Int = 10_000; // $100 in USD cents
    if (user.liabilityBalance < 0 and Int.abs(user.liabilityBalance) > LIABILITY_BLOCK_THRESHOLD) {
      return #err(#invalid_input("Your account has outstanding liability. Please settle before creating new listings."));
    };
    // ───────────────────────────────────────────────────────────────────────

    Marketplace.updateListing(
      listings, caller, id,
      title, description, category,
      priceAmount, priceToken, condition,
      photos, location, shippingMethods,
      digitalFileUrl,
      digitalFileHash, digitalPassword,
      packageDetails, novaPoshtaConfig,
      ukrposhtaConfig, meestConfig,
    )
  };

  // ─── Deactivate ───────────────────────────────────────────────────────────

  public shared ({ caller }) func deactivateListing(
    id : Types.ListingId,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: max 20 listing mutations per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 20, rateLimitListingMutations)) {
      return #err(#rate_limited);
    };

    Marketplace.deactivateListing(listings, caller, id)
  };

  // ─── Reactivate ───────────────────────────────────────────────────────────

  public shared ({ caller }) func reactivateListing(
    id : Types.ListingId,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: max 20 listing mutations per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 20, rateLimitListingMutations)) {
      return #err(#rate_limited);
    };

    Marketplace.reactivateListing(listings, caller, id)
  };

  // ─── Get single listing ───────────────────────────────────────────────────

  public shared query ({ caller }) func getListing(
    id : Types.ListingId,
  ) : async ?Types.ListingCard {
    switch (listings.get(id)) {
      case null null;
      case (?listing) {
        if (listing.status == #removed) return null;
        // Increment view count — note: query funcs cannot mutate state.
        // View counting is done in a separate update call below.
        switch (users.get(listing.seller)) {
          case null null;
          case (?seller) {
            ?Marketplace.toListingCard(listing, seller)
          };
        }
      };
    }
  };

  /// Increment view count (update call, called alongside getListing from client).
  public shared func incrementListingView(id : Types.ListingId) : async () {
    switch (listings.get(id)) {
      case null {};
      case (?listing) {
        if (listing.status == #active) {
          listing.viewCount += 1;
        };
      };
    }
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  public shared query func searchListings(
    query_          : ?Text,
    category        : ?Types.ListingCategory,
    priceMin        : ?Nat,
    priceMax        : ?Nat,
    location        : ?Text,
    condition       : ?Types.ItemCondition,
    shippingCarrier : ?Types.ShippingCarrier,
    offset          : Nat,
    limit           : Nat,
  ) : async [Types.ListingCard] {
    let params : Marketplace.SearchParams = {
      searchText = query_;
      category;
      priceMin;
      priceMax;
      location;
      condition;
      shippingCarrier;
      offset;
      limit;
    };

    let results = Marketplace.searchListings(listings, params);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller) };
      }
    })
  };

  // ─── By user ──────────────────────────────────────────────────────────────

  public shared query func getListingsByUser(
    userId : Types.UserId,
    offset : Nat,
    limit  : Nat,
  ) : async [Types.ListingCard] {
    let results = Marketplace.getListingsByUser(listings, userId, offset, limit);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller) };
      }
    })
  };

  public shared query ({ caller }) func getMyListings(
    offset : Nat,
    limit  : Nat,
  ) : async [Types.ListingCard] {
    let results = Marketplace.getListingsByUser(listings, caller, offset, limit);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller) };
      }
    })
  };

  // ─── Admin ────────────────────────────────────────────────────────────────

  public shared ({ caller }) func adminRemoveListing(
    id     : Types.ListingId,
    reason : Text,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.isModerator(user) and not Auth.isAdmin(user))
      return #err(#unauthorized);
    if (reason.size() == 0)
      return #err(#invalid_input("Removal reason must not be empty"));

    Marketplace.adminRemoveListing(listings, id)
  };

  public shared query ({ caller }) func getExpiredListings(
    offset : Nat,
    limit  : Nat,
  ) : async [Types.ListingCard] {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.isAdmin(user)) return [];

    let results = Marketplace.getExpiredListings(listings, offset, limit);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller) };
      }
    })
  };
}
