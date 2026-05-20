import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";
import Auth "../lib/Auth";
import Marketplace "../lib/Marketplace";
import Engagement "../lib/Engagement";
import RateLimiter "../lib/RateLimiter";

/// Engagement mixin — favorites, saved searches, listing inquiries, bump.
mixin (
  listings          : Map.Map<Types.ListingId, Types.Listing>,
  users             : Map.Map<Types.UserId, Types.User>,
  favorites         : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
  savedSearches     : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
  nextSavedSearchId : { var value : Nat },
  inquiries         : Map.Map<Types.ListingInquiryId, Types.ListingInquiry>,
  inquiryIndex      : Map.Map<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>,
  inquiryKeyIndex   : Map.Map<Text, Types.ListingInquiryId>,
  inquiryMessages   : Map.Map<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>,
  nextInquiryId     : { var value : Nat },
  nextInquiryMsgId  : { var value : Nat },
  rateLimitInquiry  : Map.Map<Principal, (Nat, Types.Timestamp)>,
) {

  func enrichCards(ids : [Types.ListingId]) : [Types.ListingCard] {
    let now = Time.now();
    var out = List.empty<Types.ListingCard>();
    for (id in ids.vals()) {
      switch (listings.get(id)) {
        case null {};
        case (?l) {
          if (l.status == #active) {
            switch (users.get(l.seller)) {
              case null {};
              case (?seller) {
                out.add(Marketplace.toListingCard(l, seller, now));
              };
            };
          };
        };
      };
    };
    out.toArray()
  };

  // ─── Favorites ────────────────────────────────────────────────────────────

  public shared ({ caller }) func addFavorite(listingId : Types.ListingId) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    switch (listings.get(listingId)) {
      case null { #err(#not_found) };
      case (?l) {
        if (l.status != #active) {
          return #err(#invalid_input("Listing is not active"));
        };
        Engagement.addFavorite(favorites, caller, listingId);
        #ok(())
      };
    }
  };

  public shared ({ caller }) func removeFavorite(listingId : Types.ListingId) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Engagement.removeFavorite(favorites, caller, listingId);
    #ok(())
  };

  public shared query ({ caller }) func isListingFavorite(listingId : Types.ListingId) : async Bool {
    if (caller.isAnonymous()) return false;
    Engagement.isFavorite(favorites, caller, listingId)
  };

  public shared query ({ caller }) func getFavoriteListings() : async [Types.ListingCard] {
    if (caller.isAnonymous()) return [];
    let ids = Engagement.getFavoriteIds(favorites, caller);
    enrichCards(ids)
  };

  // ─── Saved searches ───────────────────────────────────────────────────────

  public shared ({ caller }) func saveSearch(
    name       : Text,
    paramsJson : Text,
  ) : async Types.Result<Types.SavedSearch> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    let id = nextSavedSearchId.value;
    nextSavedSearchId.value += 1;
    Engagement.saveSearch(savedSearches, id, caller, name, paramsJson)
  };

  public shared ({ caller }) func deleteSavedSearch(id : Types.SavedSearchId) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Engagement.deleteSavedSearch(savedSearches, caller, id)
  };

  public shared query ({ caller }) func getSavedSearches() : async [Types.SavedSearch] {
    if (caller.isAnonymous()) return [];
    Engagement.getSavedSearches(savedSearches, caller)
  };

  // ─── Listing inquiries ────────────────────────────────────────────────────

  public shared ({ caller }) func sendListingInquiry(
    listingId : Types.ListingId,
    content   : Text,
  ) : async Types.Result<Types.ListingInquiryMessage> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 20, rateLimitInquiry)) {
      return #err(#rate_limited);
    };
    Engagement.sendInquiryMessage(
      inquiries, inquiryIndex, inquiryKeyIndex, inquiryMessages,
      listings,
      nextInquiryId, nextInquiryMsgId,
      caller, listingId, caller, content,
    )
  };

  public shared ({ caller }) func sendListingInquiryReply(
    listingId      : Types.ListingId,
    buyerPrincipal : Types.UserId,
    content        : Text,
  ) : async Types.Result<Types.ListingInquiryMessage> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 30, rateLimitInquiry)) {
      return #err(#rate_limited);
    };
    Engagement.sendInquiryMessage(
      inquiries, inquiryIndex, inquiryKeyIndex, inquiryMessages,
      listings,
      nextInquiryId, nextInquiryMsgId,
      caller, listingId, buyerPrincipal, content,
    )
  };

  public shared query ({ caller }) func getListingInquiryMessages(
    listingId      : Types.ListingId,
    buyerPrincipal : Types.UserId,
  ) : async Types.Result<[Types.ListingInquiryMessage]> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };
    Engagement.getInquiryMessages(
      inquiryIndex, inquiryKeyIndex, inquiries, inquiryMessages,
      caller, listingId, buyerPrincipal,
    )
  };

  // ─── Bump ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func bumpListing(id : Types.ListingId) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    Engagement.bumpListing(listings, caller, id, Time.now())
  };

};
