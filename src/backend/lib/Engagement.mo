import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types";
import Marketplace "../lib/Marketplace";
import CategoryCatalog "../lib/CategoryCatalog";
import Shipping "../lib/Shipping";
import Notifications "../lib/Notifications";

/// OLX Phase B — favorites, saved searches, pre-trade listing inquiries, bump/promote.
module {

  let MAX_SAVED_SEARCHES : Nat = 20;
  let MAX_INQUIRY_MSG_LEN : Nat = 2000;
  let BUMP_COOLDOWN_NS : Nat = 86_400_000_000_000; // 24h
  let PROMOTE_DEFAULT_NS : Nat = 604_800_000_000_000; // 7 days

  public func isPromotedNow(l : Types.Listing, now : Types.Timestamp) : Bool {
    switch (l.promotedUntil) {
      case (?until) { now <= until };
      case null false;
    }
  };

  public func inquiryKeyText(listingId : Types.ListingId, buyer : Types.UserId) : Text {
    listingId.toText() # ":" # buyer.toText()
  };

  // ─── Favorites ────────────────────────────────────────────────────────────

  public func addFavorite(
    favorites : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    user      : Types.UserId,
    listingId : Types.ListingId,
  ) {
    let set = switch (favorites.get(user)) {
      case (?s) s;
      case null {
        let s = Set.empty<Types.ListingId>();
        favorites.add(user, s);
        s
      };
    };
    set.add(listingId);
  };

  public func removeFavorite(
    favorites : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    user      : Types.UserId,
    listingId : Types.ListingId,
  ) {
    switch (favorites.get(user)) {
      case null {};
      case (?set) {
        set.remove(listingId);
        if (set.size() == 0) {
          favorites.remove(user);
        };
      };
    }
  };

  public func isFavorite(
    favorites : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    user      : Types.UserId,
    listingId : Types.ListingId,
  ) : Bool {
    switch (favorites.get(user)) {
      case (?set) set.contains(listingId);
      case null false;
    }
  };

  public func getFavoriteIds(
    favorites : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
    user      : Types.UserId,
  ) : [Types.ListingId] {
    switch (favorites.get(user)) {
      case (?set) set.toArray();
      case null [];
    }
  };

  // ─── Saved searches ───────────────────────────────────────────────────────

  public func saveSearch(
    store      : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    nextId     : Nat,
    owner      : Types.UserId,
    name       : Text,
    paramsJson : Text,
  ) : Types.Result<Types.SavedSearch> {
    if (name.size() == 0 or name.size() > 80) {
      return #err(#invalid_input("Name must be 1–80 characters"));
    };
    if (paramsJson.size() == 0 or paramsJson.size() > 4_000) {
      return #err(#invalid_input("Invalid search params"));
    };
    let list = switch (store.get(owner)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.SavedSearch>();
        store.add(owner, l);
        l
      };
    };
    if (list.size() >= MAX_SAVED_SEARCHES) {
      return #err(#invalid_input("Maximum 20 saved searches"));
    };
    let entry : Types.SavedSearch = {
      id = nextId;
      owner;
      name;
      paramsJson;
      createdAt = Types.now();
      alertsEnabled = false;
    };
    list.add(entry);
    #ok(entry)
  };

  public func deleteSavedSearch(
    store : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    owner : Types.UserId,
    id    : Types.SavedSearchId,
  ) : Types.Result<()> {
    switch (store.get(owner)) {
      case null { #err(#not_found) };
      case (?list) {
        let before = list.size();
        var kept = List.empty<Types.SavedSearch>();
        for (s in list.toArray().vals()) {
          if (s.id != id) { kept.add(s) };
        };
        if (kept.size() == before) {
          #err(#not_found)
        } else {
          list.clear();
          for (s in kept.toArray().vals()) { list.add(s) };
          #ok(())
        }
      };
    }
  };

  public func getSavedSearches(
    store : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    owner : Types.UserId,
  ) : [Types.SavedSearch] {
    switch (store.get(owner)) {
      case (?list) list.toArray();
      case null [];
    }
  };

  public func setSavedSearchAlerts(
    store   : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    owner   : Types.UserId,
    id      : Types.SavedSearchId,
    enabled : Bool,
  ) : Types.Result<()> {
    switch (store.get(owner)) {
      case null { #err(#not_found) };
      case (?list) {
        var found = false;
        list.mapInPlace(func(s : Types.SavedSearch) : Types.SavedSearch {
          if (s.id == id) {
            found := true;
            { s with alertsEnabled = enabled }
          } else { s }
        });
        if (not found) { #err(#not_found) } else { #ok(()) }
      };
    }
  };

  // ─── Saved search alert matching ──────────────────────────────────────────

  func dollarsTextToAmount(text : Text) : ?Nat {
    let trimmed = text.trim(#text " ");
    if (trimmed.size() == 0) return null;
    let intPart = switch (trimmed.split(#char '.').next()) {
      case (?p) p;
      case null trimmed;
    };
    switch (Nat.fromText(intPart)) {
      case (?whole) ?(whole * 1_000_000);
      case null null;
    }
  };

  func parseItemCondition(text : Text) : ?Types.ItemCondition {
    switch (text) {
      case ("new") ?#new_;
      case ("likeNew") ?#likeNew;
      case ("good") ?#good;
      case ("fair") ?#fair;
      case ("poor") ?#poor;
      case (_) null;
    }
  };

  func parseTradeToken(text : Text) : ?Types.TradeToken {
    switch (text) {
      case ("ckUSDC") ?#ckUSDC;
      case ("ckUSDT") ?#ckUSDT;
      case ("USDT_TRC20") ?#USDT_TRC20;
      case ("USDT_BEP20") ?#USDT_BEP20;
      case ("USDC_SPL") ?#USDC_SPL;
      case ("USDT_ERC20") ?#USDT_ERC20;
      case ("USDC_ERC20") ?#USDC_ERC20;
      case ("USDT_POLYGON") ?#USDT_POLYGON;
      case ("USDC_POLYGON") ?#USDC_POLYGON;
      case ("USDT_AVAX") ?#USDT_AVAX;
      case ("USDC_AVAX") ?#USDC_AVAX;
      case (_) null;
    }
  };

  func parseShippingCarrier(text : Text) : ?Types.ShippingCarrier {
    switch (text) {
      case ("nova_poshta") ?#nova_poshta;
      case ("ukrposhta") ?#ukrposhta;
      case ("meest") ?#meest;
      case ("self_pickup") ?#self_pickup;
      case ("digital") ?#digital;
      case (_) null;
    }
  };

  func listingHasCarrier(l : Types.Listing, carrier : Types.ShippingCarrier) : Bool {
    l.shippingMethods.find(func(m : Types.ShippingMethod) : Bool { m.carrier == carrier }) != null
  };

  func conditionListMatches(l : Types.Listing, raw : Text) : Bool {
    if (raw.size() == 0) return true;
    let parts = raw.split(#char ',');
    for (part in parts) {
      switch (parseItemCondition(part)) {
        case (?cond) { if (l.condition == cond) return true };
        case null {};
      };
    };
    false
  };

  func carrierListMatches(l : Types.Listing, raw : Text) : Bool {
    if (raw.size() == 0) return true;
    let parts = raw.split(#char ',');
    for (part in parts) {
      switch (parseShippingCarrier(part)) {
        case (?carrier) { if (listingHasCarrier(l, carrier)) return true };
        case null {};
      };
    };
    false
  };

  public func searchParamsFromSavedJson(paramsJson : Text) : Marketplace.SearchParams {
    let q = Shipping.extractJsonField(paramsJson, "q");
    let catSlug = Shipping.extractJsonField(paramsJson, "cat");
    let categoryId = switch (catSlug) {
      case (?slug) {
        switch (CategoryCatalog.getBySlug(slug)) {
          case (?node) ?node.id;
          case null null;
        }
      };
      case null null;
    };
    let conditionRaw = Shipping.extractJsonField(paramsJson, "condition");
    let condition = switch (conditionRaw) {
      case (?raw) {
        if (raw.contains(#char ',')) null else parseItemCondition(raw)
      };
      case null null;
    };
    let priceMin = switch (Shipping.extractJsonField(paramsJson, "priceMin")) {
      case (?t) dollarsTextToAmount(t);
      case null null;
    };
    let priceMax = switch (Shipping.extractJsonField(paramsJson, "priceMax")) {
      case (?t) dollarsTextToAmount(t);
      case null null;
    };
    let priceToken = switch (Shipping.extractJsonField(paramsJson, "priceToken")) {
      case (?t) parseTradeToken(t);
      case null {
        switch (Shipping.extractJsonField(paramsJson, "token")) {
          case (?t) parseTradeToken(t);
          case null null;
        }
      };
    };
    let shippingRaw = Shipping.extractJsonField(paramsJson, "shipping");
    let shippingCarrier = switch (shippingRaw) {
      case (?raw) {
        if (raw.contains(#char ',')) null else parseShippingCarrier(raw)
      };
      case null null;
    };
    {
      searchText = q;
      category = null;
      categoryId;
      priceMin;
      priceMax;
      location = null;
      condition;
      shippingCarrier;
      priceToken;
      offset = 0;
      limit = 1;
    }
  };

  public func listingMatchesSavedSearch(l : Types.Listing, paramsJson : Text) : Bool {
    if (l.status != #active) return false;
    let params = searchParamsFromSavedJson(paramsJson);
    if (not Marketplace.listingMatchesSearch(l, params)) return false;
    switch (Shipping.extractJsonField(paramsJson, "condition")) {
      case (?raw) {
        if (raw.contains(#char ',') and not conditionListMatches(l, raw)) return false;
      };
      case null {};
    };
    switch (Shipping.extractJsonField(paramsJson, "shipping")) {
      case (?raw) {
        if (raw.contains(#char ',') and not carrierListMatches(l, raw)) return false;
      };
      case null {};
    };
    true
  };

  public func notifyMatchingSavedSearchAlerts(
    savedSearches      : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
    notifications      : Map.Map<Principal, List.List<Types.NotificationEvent>>,
    nextNotificationId : { var value : Nat },
    listing            : Types.Listing,
  ) {
    for ((owner, list) in savedSearches.entries()) {
      if (Principal.equal(owner, listing.seller)) continue;
      for (search in list.toArray().vals()) {
        if (search.alertsEnabled and listingMatchesSavedSearch(listing, search.paramsJson)) {
          Notifications.add(
            notifications,
            nextNotificationId,
            owner,
            "saved_search_match",
            listing.id,
            search.name # ": " # listing.title,
          );
        };
      };
    };
  };

  // ─── Listing inquiries ────────────────────────────────────────────────────

  public func sendInquiryMessage(
    inquiries       : Map.Map<Types.ListingInquiryId, Types.ListingInquiry>,
    inquiryIndex    : Map.Map<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>,
    inquiryKeyIndex : Map.Map<Text, Types.ListingInquiryId>,
    messages        : Map.Map<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>,
    listings        : Map.Map<Types.ListingId, Types.Listing>,
    nextInquiryId   : { var value : Nat },
    nextMessageId   : { var value : Nat },
    caller          : Types.UserId,
    listingId       : Types.ListingId,
    buyerPrincipal  : Types.UserId,
    content         : Text,
  ) : Types.Result<Types.ListingInquiryMessage> {
    if (content.size() == 0 or content.size() > MAX_INQUIRY_MSG_LEN) {
      return #err(#invalid_input("Message must be 1–2000 characters"));
    };
    let listing = switch (listings.get(listingId)) {
      case (?l) l;
      case null { return #err(#not_found) };
    };
    if (listing.status != #active) {
      return #err(#invalid_input("Listing is not active"));
    };

    let key = inquiryKeyText(listingId, buyerPrincipal);
    let inquiryId = switch (inquiryKeyIndex.get(key)) {
      case (?id) id;
      case null {
        if (Principal.equal(caller, listing.seller)) {
          return #err(#invalid_input("Seller cannot start inquiry"));
        };
        let id = nextInquiryId.value;
        nextInquiryId.value += 1;
        let inq : Types.ListingInquiry = {
          id;
          listingId;
          buyer = buyerPrincipal;
          seller = listing.seller;
          createdAt = Types.now();
        };
        inquiries.add(id, inq);
        inquiryKeyIndex.add(key, id);
        let ids = List.empty<Types.ListingInquiryMessageId>();
        inquiryIndex.add(id, ids);
        id
      };
    };

    let inq = switch (inquiries.get(inquiryId)) {
      case (?i) i;
      case null { return #err(#not_found) };
    };
    if (not (Principal.equal(caller, inq.buyer) or Principal.equal(caller, inq.seller))) {
      return #err(#unauthorized);
    };

    let mid = nextMessageId.value;
    nextMessageId.value += 1;
    let msg : Types.ListingInquiryMessage = {
      id = mid;
      inquiryId;
      sender = caller;
      content;
      createdAt = Types.now();
    };
    messages.add(mid, msg);
    switch (inquiryIndex.get(inquiryId)) {
      case (?ids) {
        ids.add(mid);
      };
      case null {};
    };
    #ok(msg)
  };

  public func getInquiryMessages(
    inquiryIndex    : Map.Map<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>,
    inquiryKeyIndex : Map.Map<Text, Types.ListingInquiryId>,
    inquiries       : Map.Map<Types.ListingInquiryId, Types.ListingInquiry>,
    messages        : Map.Map<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>,
    caller          : Types.UserId,
    listingId       : Types.ListingId,
    buyer           : Types.UserId,
  ) : Types.Result<[Types.ListingInquiryMessage]> {
    let key = inquiryKeyText(listingId, buyer);
    let inquiryId = switch (inquiryKeyIndex.get(key)) {
      case (?id) id;
      case null { return #ok([]) };
    };
    let inq = switch (inquiries.get(inquiryId)) {
      case (?i) i;
      case null { return #ok([]) };
    };
    if (not (Principal.equal(caller, inq.buyer) or Principal.equal(caller, inq.seller))) {
      return #err(#unauthorized);
    };
    let ids = switch (inquiryIndex.get(inquiryId)) {
      case (?list) list;
      case null List.empty<Types.ListingInquiryMessageId>();
    };
    var out = List.empty<Types.ListingInquiryMessage>();
    let idArr = ids.toArray();
    var i = 0;
    while (i < idArr.size()) {
      switch (messages.get(idArr[i])) {
        case (?m) { out.add(m) };
        case null {};
      };
      i += 1;
    };
    #ok(out.toArray())
  };

  // ─── Bump / promote ───────────────────────────────────────────────────────

  public func bumpListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    caller   : Types.UserId,
    id       : Types.ListingId,
    now      : Types.Timestamp,
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?l) {
        if (not Principal.equal(l.seller, caller)) {
          return #err(#unauthorized);
        };
        if (l.status != #active) {
          return #err(#invalid_input("Only active listings can be bumped"));
        };
        if (l.bumpedAt != 0 and now - l.bumpedAt < BUMP_COOLDOWN_NS) {
          return #err(#rate_limited);
        };
        l.bumpedAt := now;
        #ok(())
      };
    }
  };

  public func promoteListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    id       : Types.ListingId,
    now      : Types.Timestamp,
    durationNs : Nat,
  ) : Types.Result<()> {
    switch (listings.get(id)) {
      case null { #err(#not_found) };
      case (?l) {
        if (l.status != #active) {
          return #err(#invalid_input("Only active listings can be promoted"));
        };
        l.promotedUntil := ?(now + durationNs);
        l.bumpedAt := now;
        #ok(())
      };
    }
  };

  public func defaultPromoteDurationNs() : Nat { PROMOTE_DEFAULT_NS };

};
