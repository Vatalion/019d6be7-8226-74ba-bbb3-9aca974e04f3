import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Types "../types";
import Auth "../lib/Auth";
import Marketplace "../lib/Marketplace";
import Engagement "../lib/Engagement";
import Reputation "../lib/Reputation";
import PaymentsLib "../lib/Payments";
import RateLimiter "../lib/RateLimiter";
import Admin "../lib/Admin";
import CategoryCatalog "../lib/CategoryCatalog";
import Time "mo:core/Time";
import Stake "../lib/Stake";
import DigitalDeliveryLib "../lib/DigitalDelivery";

/// Marketplace mixin — public canister API for listing management.
mixin (
  listings    : Map.Map<Types.ListingId, Types.Listing>,
  users       : Map.Map<Types.UserId, Types.User>,
  spamTracker : Map.Map<Types.UserId, Types.Timestamp>,
  nextListingId : { var value : Nat },
  rateLimitCreateListing  : Map.Map<Principal, (Nat, Types.Timestamp)>,
  rateLimitListingMutations : Map.Map<Principal, (Nat, Types.Timestamp)>,
  auditLog    : List.List<Admin.AuditEntry>,
  nextAuditId : { var value : Nat },
  selfPrincipal : { var value : Principal },
  savedSearches : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
  notifications : Map.Map<Principal, List.List<Types.NotificationEvent>>,
  nextNotificationId : { var value : Nat },
  stakeBalances : Map.Map<Stake.StakeKey, Types.StakeBalance>,
  listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
  trades : Map.Map<Types.TradeId, Types.Trade>,
  nextDigitalFileVersionId : { var value : Nat },
  rateLimitDigitalUpload : Map.Map<Principal, (Nat, Types.Timestamp)>,
  liabilityRecords : Map.Map<Nat, Types.LiabilityRecord>,
) {

  // ─── Create ───────────────────────────────────────────────────────────────

  public shared query func listCategories() : async [Types.CategoryNode] {
    CategoryCatalog.all()
  };

  public shared query func getCategoryAttributeSchema(
    categoryId : Types.CategoryId,
  ) : async [Types.CategoryAttributeField] {
    CategoryCatalog.attributeSchema(categoryId)
  };

  public shared ({ caller }) func createListing(
    title          : Text,
    description    : Text,
    category       : Types.ListingCategory,
    categoryId     : ?Types.CategoryId,
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
    attributes        : [Types.CategoryAttributeValue],
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
    if (not Reputation.canTradeAmountForUser(user.reputationScore, user.kycTier, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateErrorForUser(user.reputationScore, user.kycTier, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── Liability gate ─────────────────────────────────────────────────────
    if (Reputation.isTradeBlocked(user)) {
      return #err(#invalid_input(Reputation.tradeBlockedErrorUa(user, liabilityRecords)));
    };
    // ───────────────────────────────────────────────────────────────────────

    let id = nextListingId.value;
    nextListingId.value += 1;

    let result = Marketplace.createListing(
      listings, spamTracker, id, caller,
      selfPrincipal.value,
      title, description, category, categoryId,
      priceAmount, priceToken, condition,
      photos, location, shippingMethods,
      isDigital, digitalFileUrl,
      digitalFileHash, digitalPassword,
      packageDetails, novaPoshtaConfig,
      ukrposhtaConfig, meestConfig,
      attributes,
    );

    switch (result) {
      case (#err(e)) { #err(e) };
      case (#ok(card)) {
        let enrichedCard = { card with
          sellerUsername   = user.username;
          sellerRating     = user.sellerScore;
          sellerTrustLevel = user.trustLevel;
          sellerPrincipal  = caller;
        };
        // Digital drafts without uploaded file stay #draft until registerDigitalFile
        // + publishListing (stake locks at publish, not create).
        switch (listings.get(id)) {
          case (?listing) {
            switch (Marketplace.assertDigitalReadyForPublish(listing)) {
              case (?_) return #ok(enrichedCard);
              case null {};
            };
          };
          case null {};
        };
        switch (
          Stake.lockListingStake(
            stakeBalances,
            listingStakes,
            id,
            caller,
            priceAmount,
            priceToken,
            Types.now(),
          )
        ) {
          case (#err(#insufficient_funds)) {
            // Listing saved as #draft — return card so seller can deposit and publishListing.
            #ok(enrichedCard)
          };
          case (#err(e)) {
            #err(e)
          };
          case (#ok(_)) {
            switch (listings.get(id)) {
              case (?listing) {
                listing.status := #active;
              };
              case null {};
            };
            switch (listings.get(id)) {
              case (?listing) {
                Engagement.notifyMatchingSavedSearchAlerts(
                  savedSearches, notifications, nextNotificationId, listing,
                );
              };
              case null {};
            };
            #ok(enrichedCard)
          };
        }
      };
    }
  };

  // ─── Update ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func updateListing(
    id             : Types.ListingId,
    title          : Text,
    description    : Text,
    category       : Types.ListingCategory,
    categoryId     : ?Types.CategoryId,
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
    attributes        : [Types.CategoryAttributeValue],
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
    if (not Reputation.canTradeAmountForUser(user.reputationScore, user.kycTier, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateErrorForUser(user.reputationScore, user.kycTier, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── Liability gate ─────────────────────────────────────────────────────
    if (Reputation.isTradeBlocked(user)) {
      return #err(#invalid_input(Reputation.tradeBlockedErrorUa(user, liabilityRecords)));
    };
    // ───────────────────────────────────────────────────────────────────────

    Marketplace.updateListing(
      listings, trades, caller, id,
      title, description, category, categoryId,
      priceAmount, priceToken, condition,
      photos, location, shippingMethods,
      digitalFileUrl,
      digitalFileHash, digitalPassword,
      packageDetails, novaPoshtaConfig,
      ukrposhtaConfig, meestConfig,
      attributes,
    )
  };

  /// Register encrypted digital file metadata after object-storage upload (E2.S11).
  public shared ({ caller }) func registerDigitalFile(
    listingId : Types.ListingId,
    blobHash : Text,
    mimeType : Text,
    sizeBytes : Nat,
    blobUrl : Text,
    dekHex : Text,
    contentHash : ?Text,
  ) : async Types.Result<Types.DigitalFileAsset> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 5, rateLimitDigitalUpload)) {
      return #err(#rate_limited);
    };

    let versionId = nextDigitalFileVersionId.value;
    nextDigitalFileVersionId.value += 1;

    let result = DigitalDeliveryLib.registerDigitalFile(
      listings, trades, caller, listingId, selfPrincipal.value,
      versionId, blobHash, mimeType, sizeBytes, blobUrl, dekHex, contentHash,
    );

    switch (result) {
      case (#ok(asset)) #ok(asset);
      case (#err(#invalid_input(msg))) {
        if (Text.contains(msg, #text "blocklisted")) {
          let entry : Admin.AuditEntry = {
            id = nextAuditId.value;
            action = "digitalFileQuarantine";
            actorId = caller;
            targetId = ?listingId.toText();
            timestamp = Types.now();
            details = msg # " hash=" # blobHash;
          };
          auditLog.add(entry);
          nextAuditId.value += 1;
        };
        #err(#invalid_input(msg))
      };
      case (#err(e)) #err(e);
    }
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
    Auth.assertCallerNotBanned(users, caller);
    let user = Auth.requireUser(users, caller);
    Auth.assertNotBanned(user);

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
            ?Marketplace.toListingCard(listing, seller, Types.now())
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
    categoryId      : ?Types.CategoryId,
    priceMin        : ?Nat,
    priceMax        : ?Nat,
    location        : ?Text,
    condition       : ?Types.ItemCondition,
    shippingCarrier : ?Types.ShippingCarrier,
    offset          : Nat,
    limit           : Nat,
    priceToken      : ?Types.TradeToken,
  ) : async [Types.ListingCard] {
    let params : Marketplace.SearchParams = {
      searchText = query_;
      category;
      categoryId;
      priceMin;
      priceMax;
      location;
      condition;
      shippingCarrier;
      priceToken;
      offset;
      limit;
    };

    let results = Marketplace.searchListings(listings, params);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller, Types.now()) };
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
        case (?seller) { ?Marketplace.toListingCard(l, seller, Types.now()) };
      }
    })
  };

  /// Active listings only — for public seller profile (E2.S6).
  public shared query func getPublicListingsByUser(
    userId : Types.UserId,
    offset : Nat,
    limit  : Nat,
  ) : async [Types.ListingCard] {
    let results = Marketplace.getPublicListingsByUser(listings, userId, offset, limit);

    results.filterMap(func(l : Types.Listing) : ?Types.ListingCard {
      switch (users.get(l.seller)) {
        case null null;
        case (?seller) { ?Marketplace.toListingCard(l, seller, Types.now()) };
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
        case (?seller) { ?Marketplace.toListingCard(l, seller, Types.now()) };
      }
    })
  };

  // ─── Admin ────────────────────────────────────────────────────────────────

  /// Report a listing for moderation (OLX-style). Logged to admin audit.
  public shared ({ caller }) func reportListing(
    listingId : Types.ListingId,
    reason    : Text,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    if (not RateLimiter.check(caller, 3_600_000_000_000, 10, rateLimitListingMutations)) {
      return #err(#rate_limited);
    };
    let (newAuditId, result) = Admin.reportListing(
      listings, auditLog, nextAuditId.value, caller, listingId, reason,
    );
    nextAuditId.value := newAuditId;
    result
  };

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
        case (?seller) { ?Marketplace.toListingCard(l, seller, Types.now()) };
      }
    })
  };
}
