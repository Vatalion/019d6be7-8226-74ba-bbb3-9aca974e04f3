import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types";

/// Marketplace — pure stateless domain logic for listings.
/// All functions accept state as parameters and return results without side effects.
module {

  // ─── Constants ────────────────────────────────────────────────────────────

  let MAX_TITLE_LEN       : Nat = 100;
  let MIN_TITLE_LEN       : Nat = 3;
  let MAX_DESC_LEN        : Nat = 5_000;
  let MAX_PHOTOS          : Nat = 10;
  let MAX_PAGE_SIZE       : Nat = 50;
  let THIRTY_DAYS_NS      : Int = 2_592_000_000_000_000;
  let SPAM_COOLDOWN_NS    : Int = 60_000_000_000;
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

  func validateDigital(isDigital : Bool, digitalFileUrl : ?Text) : ?Types.Error {
    if (isDigital) {
      switch (digitalFileUrl) {
        case (null)    { ?#invalid_input("Digital listings must have a digitalFileUrl") };
        case (?url)    { if (url.size() == 0) ?#invalid_input("digitalFileUrl must not be empty") else null };
      };
    } else null;
  };

  // ─── Create ───────────────────────────────────────────────────────────────

  /// Creates a new Listing and inserts it into the map.
  /// Returns #err on validation failure or spam-cooldown violation.
  public func createListing(
    listings       : Map.Map<Types.ListingId, Types.Listing>,
    spamTracker    : Map.Map<Types.UserId, Types.Timestamp>,
    nextId         : Nat,
    caller         : Types.UserId,
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
  ) : Types.Result<Types.ListingCard> {

    // Anti-spam: enforce 60-second cooldown per principal
    let now : Types.Timestamp = Time.now();
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
    switch (validateDigital(isDigital, digitalFileUrl)) { case (?e) return #err(e); case null {} };

    let expiresAt : Types.Timestamp = now + THIRTY_DAYS_NS;

    let listing : Types.Listing = {
      id              = nextId;
      seller          = caller;
      var title       = title;
      var description = description;
      var category    = category;
      var priceAmount = priceAmount;
      var priceToken  = priceToken;
      var condition   = condition;
      var photos      = photos;
      var location    = location;
      var shippingMethods = shippingMethods;
      isDigital       = isDigital;
      var digitalFileUrl  = digitalFileUrl;
      var digitalFileHash = digitalFileHash;
      var digitalPassword = digitalPassword;
      var status      = #active;
      createdAt       = now;
      var expiresAt   = expiresAt;
      var viewCount   = 0;
      var packageDetails   = packageDetails;
      var novaPoshtaConfig = novaPoshtaConfig;
      var ukrposhtaConfig  = ukrposhtaConfig;
      var meestConfig      = meestConfig;
      var resolvedAt       = null;
    };

    listings.add(nextId, listing);
    spamTracker.add(caller, now);

    // For the returned card we need seller username — not available in pure lib,
    // so caller (mixin) constructs the card after receiving #ok listing id.
    // Return a minimal card with available data (sellerUsername filled by mixin).
    #ok(toListingCardAnon(listing))
  };

  // ─── Update ───────────────────────────────────────────────────────────────

  /// Updates mutable fields of a listing. Owner-only.
  public func updateListing(
    listings        : Map.Map<Types.ListingId, Types.Listing>,
    caller          : Types.UserId,
    id              : Types.ListingId,
    title           : Text,
    description     : Text,
    category        : Types.ListingCategory,
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
        switch (validateDigital(listing.isDigital, digitalFileUrl)) { case (?e) return #err(e); case null {} };

        listing.title          := title;
        listing.description    := description;
        listing.category       := category;
        listing.priceAmount    := priceAmount;
        listing.priceToken     := priceToken;
        listing.condition      := condition;
        listing.photos         := photos;
        listing.location       := location;
        listing.shippingMethods := shippingMethods;
        listing.digitalFileUrl := digitalFileUrl;
        listing.digitalFileHash := digitalFileHash;
        listing.digitalPassword := digitalPassword;
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
        listing.resolvedAt := ?Time.now();
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
        listing.status    := #active;
        listing.expiresAt := Time.now() + THIRTY_DAYS_NS;
        listing.resolvedAt := null;
        #ok(())
      };
    };
  };

  // ─── Card projection ──────────────────────────────────────────────────────

  /// Converts a Listing to a ListingCard with anonymous seller info.
  /// Mixin enriches with real seller data from user map.
  public func toListingCardAnon(l : Types.Listing) : Types.ListingCard {
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
      createdAt        = l.createdAt;
      digitalFileUrl   = switch (l.digitalFileUrl) { case (?url) url; case null "" };
    }
  };

  /// Converts a Listing to a ListingCard with seller data from User.
  public func toListingCard(l : Types.Listing, seller : Types.User) : Types.ListingCard {
    {
      id               = l.id;
      title            = l.title;
      description      = l.description;
      priceAmount      = l.priceAmount;
      priceToken       = l.priceToken;
      photos           = l.photos;
      location         = l.location;
      sellerUsername   = seller.username;
      sellerRating     = seller.reputationScore;
      sellerTrustLevel = seller.trustLevel;
      sellerPrincipal  = seller.id;
      condition        = l.condition;
      shippingMethods  = l.shippingMethods;
      category         = l.category;
      createdAt        = l.createdAt;
      digitalFileUrl   = switch (l.digitalFileUrl) { case (?url) url; case null "" };
    }
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  public type SearchParams = {
    searchText     : ?Text;
    category       : ?Types.ListingCategory;
    priceMin       : ?Nat;
    priceMax       : ?Nat;
    location       : ?Text;
    condition      : ?Types.ItemCondition;
    shippingCarrier : ?Types.ShippingCarrier;
    offset         : Nat;
    limit          : Nat;
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

    switch (p.category) {
      case (?cat) { if (l.category != cat) return false };
      case null {};
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

    true
  };

  /// Searches listings with optional filters and pagination.
  /// Results are listings only — mixin enriches with seller data.
  public func searchListings(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    params   : SearchParams,
  ) : [Types.Listing] {
    let effectiveLimit = if (params.limit > MAX_PAGE_SIZE) MAX_PAGE_SIZE else params.limit;

    let matched = listings.entries()
      .filter(func(kv : (Types.ListingId, Types.Listing)) : Bool {
        let (_, l) = kv; matchesSearch(l, params)
      })
      .map(func(kv : (Types.ListingId, Types.Listing)) : Types.Listing {
        let (_, l) = kv; l
      })
      .drop(params.offset)
      .take(effectiveLimit)
      .toArray();

    matched
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

  // ─── Expiry ───────────────────────────────────────────────────────────────

  /// Marks all active listings past their expiresAt as #inactive.
  /// Returns the count of listings expired.
  public func markExpired(
    listings : Map.Map<Types.ListingId, Types.Listing>,
  ) : Nat {
    let now = Time.now();
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
    let now = Time.now();
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
    let now    = Time.now();
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
