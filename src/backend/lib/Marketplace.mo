import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types";
import DigitalDeliveryLib "DigitalDelivery";
import CategoryCatalog "CategoryCatalog";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";

/// Marketplace — pure stateless domain logic for listings.
/// All functions accept state as parameters and return results without side effects.
module {

  // ─── Constants ────────────────────────────────────────────────────────────

  let MAX_TITLE_LEN       : Nat = 100;
  let MIN_TITLE_LEN       : Nat = 3;
  let MAX_DESC_LEN        : Nat = 5_000;
  let MAX_PHOTOS          : Nat = 10;
  let MAX_PAGE_SIZE       : Nat = 50;
  let THIRTY_DAYS_NS      : Nat = 2_592_000_000_000_000;
  let SPAM_COOLDOWN_NS    : Nat = 60_000_000_000;
  /// Max price in token units: $1,000,000 × 1,000,000 micro-units (6 decimals)
  let MAX_PRICE           : Nat = 1_000_000_000_000;
  let MAX_LOCATION_LEN    : Nat = 200;

  // ─── Input validation ─────────────────────────────────────────────────────

  /// Returns true if the text contains any dangerous character sequence.
  func hasDangerousChars(t : Text) : Bool {
    t.contains(#char '<')  or
    t.contains(#char '>')  or
    t.contains(#char '\\') or
    t.contains(#char ';')  or
    t.contains(#text "--")
  };

  func validateTitle(title : Text) : ?Types.Error {
    if (title.size() < MIN_TITLE_LEN or title.size() > MAX_TITLE_LEN)
      return ?#invalid_input("Title must be 3–100 characters and cannot contain < > \\ ; --");
    if (hasDangerousChars(title))
      return ?#invalid_input("Title must be 3–100 characters and cannot contain < > \\ ; --");
    null
  };

  func validateDescription(desc : Text) : ?Types.Error {
    if (desc.size() > MAX_DESC_LEN)
      ?#invalid_input("Description must be at most 5000 characters")
    else null;
  };

  func validatePrice(price : Nat) : ?Types.Error {
    if (price == 0)
      return ?#invalid_input("Price must be greater than 0 and at most $1,000,000");
    if (price > MAX_PRICE)
      return ?#invalid_input("Price must be greater than 0 and at most $1,000,000");
    null
  };

  func validateLocation(location : Text) : ?Types.Error {
    if (location.size() == 0 or location.size() > MAX_LOCATION_LEN)
      ?#invalid_input("Location is required and must be at most 200 characters")
    else null
  };

  func validatePhotos(photos : [Text]) : ?Types.Error {
    if (photos.size() > MAX_PHOTOS)
      ?#invalid_input("Maximum 10 photos allowed")
    else null;
  };

  func validateDigital(
    isDigital : Bool,
    digitalFileUrl : ?Text,
    digitalPassword : ?Text,
    digitalFileAsset : ?Types.DigitalFileAsset,
  ) : ?Types.Error {
    if (isDigital) {
      switch (digitalPassword) {
        case (?pwd) {
          if (pwd.size() > 0) {
            return ?#invalid_input("Digital file passwords are disabled; upload an encrypted file instead");
          };
        };
        case null {};
      };
      switch (digitalFileAsset) {
        case (?_) null;
        case null {
          switch (digitalFileUrl) {
            case (null) null; // draft — registerDigitalFile / publish enforces
            case (?url) {
              if (url.size() == 0) null
              else ?#invalid_input("Legacy digitalFileUrl is disabled; use registerDigitalFile")
            };
          };
        };
      };
    } else null;
  };

  /// Publish / activate gate — digital listings must have uploaded file metadata.
  public func assertDigitalReadyForPublish(listing : Types.Listing) : ?Types.Error {
    if (listing.isDigital and not DigitalDeliveryLib.hasDigitalFulfillment(listing)) {
      ?#invalid_input("Digital listing requires an uploaded file before publish")
    } else null
  };

  func attrValue(attrs : [Types.CategoryAttributeValue], key : Text) : ?Text {
    for (a in attrs.vals()) {
      if (a.key == key) return ?a.value;
    };
    null
  };

  func parseNatText(t : Text) : ?Nat {
    if (t.size() == 0) return null;
    var n : Nat = 0;
    for (ch in t.chars()) {
      let code = ch.toNat32();
      if (code < 48 or code > 57) return null;
      n := n * 10 + (code - 48).toNat();
    };
    ?n
  };

  func validateAttributes(
    categoryId : Types.CategoryId,
    attributes : [Types.CategoryAttributeValue],
  ) : ?Types.Error {
    let schema = CategoryCatalog.attributeSchema(categoryId);
    if (schema.size() == 0) return null;
    for (field in schema.vals()) {
      switch (attrValue(attributes, field.key)) {
        case null {
          if (field.required) {
            return ?#invalid_input("Missing required attribute: " # field.key);
          };
        };
        case (?val) {
          if (field.required and val.size() == 0) {
            return ?#invalid_input("Missing required attribute: " # field.key);
          };
          switch (field.fieldType) {
            case (#number) {
              switch (parseNatText(val)) {
                case null {
                  if (val.size() > 0) {
                    return ?#invalid_input("Invalid number for attribute: " # field.key);
                  };
                };
                case (?_) {};
              };
            };
            case (#text) {};
          };
        };
      };
    };
    null
  };

  // ─── Create ───────────────────────────────────────────────────────────────

  /// Creates a new Listing and inserts it into the map.
  /// Returns #err on validation failure or spam-cooldown violation.
  public func createListing(
    listings       : Map.Map<Types.ListingId, Types.Listing>,
    spamTracker    : Map.Map<Types.UserId, Types.Timestamp>,
    nextId         : Nat,
    caller         : Types.UserId,
    canisterId     : Principal,
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
  ) : Types.Result<Types.ListingCard> {

    // Anti-spam: enforce 60-second cooldown per principal
    let now : Types.Timestamp = Types.now();
    switch (spamTracker.get(caller)) {
      case (?lastAt) {
        if (now - lastAt < SPAM_COOLDOWN_NS)
          return #err(#rate_limited);
      };
      case null {};
    };

    // Input validation
    switch (validateTitle(title))       { case (?e) return #err(e); case null {} };
    switch (validateDescription(description)) { case (?e) return #err(e); case null {} };
    switch (validatePrice(priceAmount)) { case (?e) return #err(e); case null {} };
    switch (validatePhotos(photos))     { case (?e) return #err(e); case null {} };
    switch (validateLocation(location)) { case (?e) return #err(e); case null {} };
    switch (validateDigital(isDigital, digitalFileUrl, digitalPassword, null)) { case (?e) return #err(e); case null {} };

    let resolvedCategoryId = CategoryCatalog.resolveCategoryId(categoryId, category);
    switch (validateAttributes(resolvedCategoryId, attributes)) {
      case (?e) return #err(e);
      case null {};
    };

    let expiresAt : Types.Timestamp = now + THIRTY_DAYS_NS;
    let resolvedCategory = CategoryCatalog.nodeLegacyCategory(resolvedCategoryId);

    let listing : Types.Listing = {
      id              = nextId;
      seller          = caller;
      var title       = title;
      var description = description;
      var category    = resolvedCategory;
      var categoryId  = resolvedCategoryId;
      var priceAmount = priceAmount;
      var priceToken  = priceToken;
      var condition   = condition;
      var photos      = photos;
      var location    = location;
      var shippingMethods = shippingMethods;
      isDigital       = isDigital;
      var digitalFileUrl  = if (isDigital) null else digitalFileUrl;
      var digitalFileHash = digitalFileHash;
      var digitalPassword = null;
      var digitalFileUrlEncrypted  = null;
      var digitalPasswordEncrypted = null;
      var digitalFileAsset         = null;
      var status      = #draft;
      createdAt       = now;
      var expiresAt   = expiresAt;
      var viewCount   = 0;
      var packageDetails   = packageDetails;
      var novaPoshtaConfig = novaPoshtaConfig;
      var ukrposhtaConfig  = ukrposhtaConfig;
      var meestConfig      = meestConfig;
      var resolvedAt       = null;
      var bumpedAt         = 0 : Types.Timestamp;
      var promotedUntil    = null;
      var attributes       = attributes;
    };

    ignore canisterId;

    listings.add(nextId, listing);
    spamTracker.add(caller, now);

    // For the returned card we need seller username — not available in pure lib,
    // so caller (mixin) constructs the card after receiving #ok listing id.
    // Return a minimal card with available data (sellerUsername filled by mixin).
    #ok(toListingCardAnon(listing, now))
  };

  // ─── Update ───────────────────────────────────────────────────────────────

  /// Updates mutable fields of a listing. Owner-only.
  public func updateListing(
    listings        : Map.Map<Types.ListingId, Types.Listing>,
    trades          : Map.Map<Types.TradeId, Types.Trade>,
    caller          : Types.UserId,
    id              : Types.ListingId,
    title           : Text,
    description     : Text,
    category        : Types.ListingCategory,
    categoryId      : ?Types.CategoryId,
    priceAmount     : Nat,
    priceToken      : Types.TradeToken,
    condition       : Types.ItemCondition,
    photos          : [Text],
    location        : Text,
    shippingMethods : [Types.ShippingMethod],
    digitalFileUrl  : ?Text,
    digitalFileHash : ?Text,
    digitalPassword : ?Text,
    packageDetails    : ?Types.PackageDetails,
    novaPoshtaConfig  : ?Types.NovaPoshtaConfig,
    ukrposhtaConfig   : ?Types.UkrposhtaConfig,
    meestConfig       : ?Types.MeestConfig,
    attributes        : [Types.CategoryAttributeValue],
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?listing) {
        if (not Principal.equal(listing.seller, caller)) return #err(#unauthorized);
        if (listing.status == #removed)                  return #err(#unauthorized);

        switch (validateTitle(title))             { case (?e) return #err(e); case null {} };
        switch (validateDescription(description)) { case (?e) return #err(e); case null {} };
        switch (validatePrice(priceAmount))       { case (?e) return #err(e); case null {} };
        switch (validatePhotos(photos))           { case (?e) return #err(e); case null {} };
        switch (validateLocation(location))       { case (?e) return #err(e); case null {} };
        switch (validateDigital(listing.isDigital, digitalFileUrl, digitalPassword, listing.digitalFileAsset)) {
          case (?e) return #err(e); case null {}
        };

        let resolvedCategoryId = CategoryCatalog.resolveCategoryId(categoryId, category);
        switch (validateAttributes(resolvedCategoryId, attributes)) {
          case (?e) return #err(e);
          case null {};
        };
        let resolvedCategory = CategoryCatalog.nodeLegacyCategory(resolvedCategoryId);

        // E2.S11 — validate file replacement before mutating listing state.
        if (listing.isDigital) {
          switch (digitalFileUrl, digitalFileHash) {
            case (?newUrl, _) {
              let urlChanged = switch (listing.digitalFileAsset) {
                case (?_) true;
                case null {
                  switch (listing.digitalFileUrl) {
                    case (?old) not Text.equal(old, newUrl);
                    case null true;
                  };
                };
              };
              if (urlChanged) {
                switch (DigitalDeliveryLib.assertCanReplaceFile(trades, id)) {
                  case (#err(e)) return #err(e);
                  case (#ok(_)) {};
                };
              };
            };
            case (null, ?newHash) {
              switch (listing.digitalFileHash) {
                case (?old) {
                  if (not Text.equal(old, newHash)) {
                    switch (DigitalDeliveryLib.assertCanReplaceFile(trades, id)) {
                      case (#err(e)) return #err(e);
                      case (#ok(_)) {};
                    };
                  };
                };
                case null {};
              };
            };
            case (null, null) {};
          };
        };

        listing.title          := title;
        listing.description    := description;
        listing.category       := resolvedCategory;
        listing.categoryId     := resolvedCategoryId;
        listing.priceAmount    := priceAmount;
        listing.priceToken     := priceToken;
        listing.condition      := condition;
        listing.photos         := photos;
        listing.location       := location;
        listing.shippingMethods := shippingMethods;
        listing.attributes     := attributes;
        listing.digitalFileUrl := if (listing.isDigital) null else digitalFileUrl;
        listing.digitalFileHash := digitalFileHash;
        listing.digitalPassword := null;
        // Only update shipping fields if provided; preserve existing values otherwise
        switch (packageDetails)   { case (?pd) { listing.packageDetails   := ?pd }; case null {} };
        switch (novaPoshtaConfig) { case (?nc) { listing.novaPoshtaConfig := ?nc }; case null {} };
        switch (ukrposhtaConfig)  { case (?uc) { listing.ukrposhtaConfig  := ?uc }; case null {} };
        switch (meestConfig)      { case (?mc) { listing.meestConfig      := ?mc }; case null {} };
        #ok(())
      };
    };
  };

  // ─── Deactivate ───────────────────────────────────────────────────────────

  /// Sets listing status to #inactive. Owner-only.
  public func deactivateListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    caller   : Types.UserId,
    id       : Types.ListingId,
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?listing) {
        if (not Principal.equal(listing.seller, caller)) return #err(#unauthorized);
        listing.status     := #inactive;
        listing.resolvedAt := ?Types.now();
        #ok(())
      };
    };
  };

  // ─── Reactivate ───────────────────────────────────────────────────────────

  /// Sets listing status back to #active. Owner-only. Listing must currently be #inactive.
  public func reactivateListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    caller   : Types.UserId,
    id       : Types.ListingId,
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?listing) {
        if (not Principal.equal(listing.seller, caller)) return #err(#unauthorized);
        if (listing.status != #inactive) return #err(#invalid_input("Listing is not inactive"));
        switch (assertDigitalReadyForPublish(listing)) {
          case (?e) return #err(e);
          case null {};
        };
        listing.status    := #active;
        listing.expiresAt := Types.now() + THIRTY_DAYS_NS;
        listing.resolvedAt := null;
        #ok(())
      };
    };
  };

  // ─── Card projection ──────────────────────────────────────────────────────

  func isPromotedNow(l : Types.Listing, now : Types.Timestamp) : Bool {
    switch (l.promotedUntil) {
      case (?until) { now <= until };
      case null false;
    }
  };

  func compareListingsForSearch(a : Types.Listing, b : Types.Listing, now : Types.Timestamp) : Order.Order {
    let promoA : Int = if (isPromotedNow(a, now)) 1 else 0;
    let promoB : Int = if (isPromotedNow(b, now)) 1 else 0;
    switch (Int.compare(promoB, promoA)) {
      case (#equal) switch (Int.compare(b.bumpedAt, a.bumpedAt)) {
        case (#equal) Int.compare(b.createdAt, a.createdAt);
        case (o) o;
      };
      case (o) o;
    }
  };

  /// Public listing cards must never expose uploaded file blob URLs (E2.S11 AC 5).
  func publicDigitalFileUrl(l : Types.Listing) : Text {
    switch (l.digitalFileAsset) {
      case (?_) "";
      case null {
        switch (l.digitalFileUrl) { case (?url) url; case null "" };
      };
    }
  };

  /// Converts a Listing to a ListingCard with anonymous seller info.
  /// Mixin enriches with real seller data from user map.
  public func toListingCardAnon(l : Types.Listing, now : Types.Timestamp) : Types.ListingCard {
    {
      id               = l.id;
      title            = l.title;
      description      = l.description;
      priceAmount      = l.priceAmount;
      priceToken       = l.priceToken;
      photos           = l.photos;
      location         = l.location;
      sellerUsername   = "";        // enriched by mixin
      sellerRating     = 0;         // enriched by mixin
      sellerTrustLevel = #new_;     // enriched by mixin
      sellerPrincipal  = l.seller;
      condition        = l.condition;
      shippingMethods  = l.shippingMethods;
      category         = l.category;
      categoryId       = l.categoryId;
      categorySlug     = switch (CategoryCatalog.get(l.categoryId)) {
        case (?n) n.slug;
        case null "";
      };
      status           = l.status;
      createdAt        = l.createdAt;
      digitalFileUrl   = publicDigitalFileUrl(l);
      isPromoted       = isPromotedNow(l, now);
      attributes       = l.attributes;
    }
  };

  /// Converts a Listing to a ListingCard with seller data from User.
  public func toListingCard(l : Types.Listing, seller : Types.User, now : Types.Timestamp) : Types.ListingCard {
    {
      id               = l.id;
      title            = l.title;
      description      = l.description;
      priceAmount      = l.priceAmount;
      priceToken       = l.priceToken;
      photos           = l.photos;
      location         = l.location;
      sellerUsername   = seller.username;
      sellerRating     = seller.sellerScore;
      sellerTrustLevel = seller.trustLevel;
      sellerPrincipal  = seller.id;
      condition        = l.condition;
      shippingMethods  = l.shippingMethods;
      category         = l.category;
      categoryId       = l.categoryId;
      categorySlug     = switch (CategoryCatalog.get(l.categoryId)) {
        case (?n) n.slug;
        case null "";
      };
      status           = l.status;
      createdAt        = l.createdAt;
      digitalFileUrl   = publicDigitalFileUrl(l);
      isPromoted       = isPromotedNow(l, now);
      attributes       = l.attributes;
    }
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  public type SearchParams = {
    searchText     : ?Text;
    category       : ?Types.ListingCategory;
    categoryId     : ?Types.CategoryId;
    priceMin       : ?Nat;
    priceMax       : ?Nat;
    location       : ?Text;
    condition      : ?Types.ItemCondition;
    shippingCarrier : ?Types.ShippingCarrier;
    priceToken     : ?Types.TradeToken;
    offset         : Nat;
    limit          : Nat;
  };

  public func listingMatchesSearch(l : Types.Listing, p : SearchParams) : Bool {
    matchesSearch(l, p)
  };

  func matchesSearch(l : Types.Listing, p : SearchParams) : Bool {
    if (l.status != #active) return false;

    // Text search — case-insensitive match on title + description
    switch (p.searchText) {
      case (?q) {
        let lower = q.toLower();
        let inTitle = l.title.toLower().contains(#text lower);
        let inDesc  = l.description.toLower().contains(#text lower);
        if (not inTitle and not inDesc) return false;
      };
      case null {};
    };

    switch (p.categoryId) {
      case (?cid) {
        let allowed = CategoryCatalog.descendants(cid);
        if (not CategoryCatalog.containsId(allowed, l.categoryId)) return false;
      };
      case null {
        switch (p.category) {
          case (?cat) { if (l.category != cat) return false };
          case null {};
        };
      };
    };

    switch (p.priceMin) {
      case (?mn) { if (l.priceAmount < mn) return false };
      case null {};
    };

    switch (p.priceMax) {
      case (?mx) { if (l.priceAmount > mx) return false };
      case null {};
    };

    switch (p.location) {
      case (?loc) {
        if (not l.location.toLower().contains(#text (loc.toLower()))) return false
      };
      case null {};
    };

    switch (p.condition) {
      case (?cond) { if (l.condition != cond) return false };
      case null {};
    };

    switch (p.shippingCarrier) {
      case (?carrier) {
        let hasCarrier = l.shippingMethods.find(
          func(m : Types.ShippingMethod) : Bool { m.carrier == carrier }
        );
        if (hasCarrier == null) return false;
      };
      case null {};
    };

    switch (p.priceToken) {
      case (?tok) { if (l.priceToken != tok) return false };
      case null {};
    };

    true
  };

  /// Searches listings with optional filters and pagination.
  /// Results are listings only — mixin enriches with seller data.
  public func searchListings(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    params   : SearchParams,
  ) : [Types.Listing] {
    let effectiveLimit = if (params.limit > MAX_PAGE_SIZE) MAX_PAGE_SIZE else params.limit;

    let now = Types.now();
    let allMatched = listings.entries()
      .filter(func(kv : (Types.ListingId, Types.Listing)) : Bool {
        let (_, l) = kv; matchesSearch(l, params)
      })
      .map(func(kv : (Types.ListingId, Types.Listing)) : Types.Listing {
        let (_, l) = kv; l
      })
      .toArray();

    let sorted = allMatched.sort(func(a : Types.Listing, b : Types.Listing) : Order.Order {
      compareListingsForSearch(a, b, now)
    });

    Array.tabulate<Types.Listing>(
      Nat.min(effectiveLimit, if (params.offset >= sorted.size()) 0 else sorted.size() - params.offset),
      func(i : Nat) : Types.Listing { sorted[params.offset + i] },
    )
  };

  // ─── By user ──────────────────────────────────────────────────────────────

  /// Returns paginated listings for a given seller principal.
  public func getListingsByUser(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    userId   : Types.UserId,
    offset   : Nat,
    limit    : Nat,
  ) : [Types.Listing] {
    let effectiveLimit = if (limit > MAX_PAGE_SIZE) MAX_PAGE_SIZE else limit;

    listings.entries()
      .filter(func(kv : (Types.ListingId, Types.Listing)) : Bool {
        let (_, l) = kv;
        Principal.equal(l.seller, userId) and l.status != #removed
      })
      .map(func(kv : (Types.ListingId, Types.Listing)) : Types.Listing {
        let (_, l) = kv; l
      })
      .drop(offset)
      .take(effectiveLimit)
      .toArray()
  };

  /// Returns active listings only for public seller profile views.
  public func getPublicListingsByUser(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    userId   : Types.UserId,
    offset   : Nat,
    limit    : Nat,
  ) : [Types.Listing] {
    let effectiveLimit = if (limit > MAX_PAGE_SIZE) MAX_PAGE_SIZE else limit;

    listings.entries()
      .filter(func(kv : (Types.ListingId, Types.Listing)) : Bool {
        let (_, l) = kv;
        Principal.equal(l.seller, userId) and l.status == #active
      })
      .map(func(kv : (Types.ListingId, Types.Listing)) : Types.Listing {
        let (_, l) = kv; l
      })
      .drop(offset)
      .take(effectiveLimit)
      .toArray()
  };

  // ─── Expiry ───────────────────────────────────────────────────────────────

  /// Marks all active listings past their expiresAt as #inactive.
  /// Returns the count of listings expired.
  public func markExpired(
    listings : Map.Map<Types.ListingId, Types.Listing>,
  ) : Nat {
    let now = Types.now();
    var count : Nat = 0;
    listings.entries().forEach(func(kv : (Types.ListingId, Types.Listing)) {
      let (_, l) = kv;
      if (l.status == #active and l.expiresAt < now) {
        l.status     := #inactive;
        l.resolvedAt := ?now;
        count += 1;
      };
    });
    count
  };

  // ─── Admin helpers ────────────────────────────────────────────────────────

  /// Forcibly removes a listing (sets status to #removed). Moderator/admin use.
  public func adminRemoveListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    id       : Types.ListingId,
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?listing) {
        listing.status := #removed;
        #ok(())
      };
    };
  };

  /// Returns all listings past their expiresAt regardless of status (admin view).
  public func getExpiredListings(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    offset   : Nat,
    limit    : Nat,
  ) : [Types.Listing] {
    let now = Types.now();
    let effectiveLimit = if (limit > MAX_PAGE_SIZE) MAX_PAGE_SIZE else limit;

    listings.entries()
      .filter(func(kv : (Types.ListingId, Types.Listing)) : Bool {
        let (_, l) = kv; l.expiresAt < now
      })
      .map(func(kv : (Types.ListingId, Types.Listing)) : Types.Listing {
        let (_, l) = kv; l
      })
      .drop(offset)
      .take(effectiveLimit)
      .toArray()
  };

  // ─── Lifecycle cleanup ────────────────────────────────────────────────────

  /// Returns listings that are past the 30-day grace period after entering a
  /// resolved state (sold or inactive) and have no active disputes checked
  /// externally. Uses explicit for loops to avoid iterator issues.
  public func getResolvedForCleanup(
    listings : Map.Map<Types.ListingId, Types.Listing>,
  ) : [(Types.ListingId, Types.Listing)] {
    let now    = Types.now();
    let cutoff = now - THIRTY_DAYS_NS;
    let results = List.empty<(Types.ListingId, Types.Listing)>();
    for ((lid, l) in listings.entries()) {
      switch (l.resolvedAt) {
        case null {};
        case (?resolvedTs) {
          if (resolvedTs < cutoff and (l.status == #sold or l.status == #inactive)) {
            results.add((lid, l));
          };
        };
      };
    };
    results.toArray()
  };

  /// Deletes a listing from the map and returns its photo URLs for external cleanup.
  /// Returns null if the listing does not exist.
  public func deleteListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    id       : Types.ListingId,
  ) : ?[Text] {
    switch (listings.get(id)) {
      case null { null };
      case (?l) {
        let photos = l.photos;
        listings.remove(id);
        ?photos
      };
    }
  };

  // ─── digitalFileUrl reveal guard ─────────────────────────────────────────

  /// Returns digitalFileUrl only if the caller is the buyer and trade is #complete.
  /// trades map is not injected here — mixin enforces this check inline.
  public func safeDigitalUrl(listing : Types.Listing, isBuyerComplete : Bool) : ?Text {
    if (not listing.isDigital) return null;
    if (isBuyerComplete) listing.digitalFileUrl else null
  };
}
