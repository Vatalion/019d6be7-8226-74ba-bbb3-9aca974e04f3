import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Types "../types";

/// OLX Phase B — favorites, saved searches, pre-trade listing inquiries, bump/promote.
module {

  let MAX_SAVED_SEARCHES : Nat = 20;
  let MAX_INQUIRY_MSG_LEN : Nat = 2000;
  let BUMP_COOLDOWN_NS : Int = 86_400_000_000_000; // 24h
  let PROMOTE_DEFAULT_NS : Int = 604_800_000_000_000; // 7 days

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
      createdAt = Time.now();
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
          createdAt = Time.now();
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
      createdAt = Time.now();
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
    durationNs : Int,
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

  public func defaultPromoteDurationNs() : Int { PROMOTE_DEFAULT_NS };

};
