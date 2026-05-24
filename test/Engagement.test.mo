/// Engagement.test.mo — favorites, saved searches, inquiries, bump/promote

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Engagement "../src/backend/lib/Engagement";
import Marketplace "../src/backend/lib/Marketplace";
import Types "../src/backend/types";

let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let buyer  = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let canisterId = Principal.fromText("aaaaa-aa");

func makeListings() : Map.Map<Types.ListingId, Types.Listing> {
  Map.empty<Types.ListingId, Types.Listing>()
};

func makeSpam() : Map.Map<Types.UserId, Types.Timestamp> {
  Map.empty<Types.UserId, Types.Timestamp>()
};

func seedListing(listings : Map.Map<Types.ListingId, Types.Listing>, id : Nat) {
  ignore Marketplace.createListing(
    listings, makeSpam(), id, seller, canisterId,
    "Phone", "Good phone for sale", #electronics, null,
    2_000_000, #USDT_TRC20, #good, [], "Kyiv", [],
    false, null, null, null, null, null, null, null,
    [],
  );
  switch (listings.get(id)) {
    case (?l) { l.status := #active };
    case null {};
  };
};

suite("Engagement — favorites", func() {
  test("add and list favorites", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let favorites = Map.empty<Types.UserId, Set.Set<Types.ListingId>>();
    Engagement.addFavorite(favorites, buyer, 1);
    expect.bool(Engagement.isFavorite(favorites, buyer, 1)).equal(true);
    let ids = Engagement.getFavoriteIds(favorites, buyer);
    expect.nat(ids.size()).equal(1);
    Engagement.removeFavorite(favorites, buyer, 1);
    expect.bool(Engagement.isFavorite(favorites, buyer, 1)).equal(false);
  });
});

suite("Engagement — saved searches", func() {
  test("save and delete search", func() {
    let store = Map.empty<Types.UserId, List.List<Types.SavedSearch>>();
    switch (Engagement.saveSearch(store, 1, buyer, "Kyiv phones", "{\"q\":\"phone\"}")) {
      case (#ok(s)) {
        expect.text(s.name).equal("Kyiv phones");
        expect.bool(s.alertsEnabled).equal(false);
        let all = Engagement.getSavedSearches(store, buyer);
        expect.nat(all.size()).equal(1);
        switch (Engagement.deleteSavedSearch(store, buyer, s.id)) {
          case (#ok(())) {
            expect.nat(Engagement.getSavedSearches(store, buyer).size()).equal(0);
          };
          case (#err(_)) assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("toggle alerts on saved search", func() {
    let store = Map.empty<Types.UserId, List.List<Types.SavedSearch>>();
    ignore Engagement.saveSearch(store, 1, buyer, "Phones", "{\"q\":\"phone\"}");
    switch (Engagement.setSavedSearchAlerts(store, buyer, 1, true)) {
      case (#ok(())) {
        let searches = Engagement.getSavedSearches(store, buyer);
        expect.bool(searches[0].alertsEnabled).equal(true);
      };
      case (#err(_)) assert false;
    };
    switch (Engagement.setSavedSearchAlerts(store, buyer, 1, false)) {
      case (#ok(())) {
        let searches = Engagement.getSavedSearches(store, buyer);
        expect.bool(searches[0].alertsEnabled).equal(false);
      };
      case (#err(_)) assert false;
    };
  });

  test("listing matches saved search params", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    switch (listings.get(1)) {
      case (?l) {
        expect.bool(
          Engagement.listingMatchesSavedSearch(l, "{\"q\":\"Phone\"}")
        ).equal(true);
        expect.bool(
          Engagement.listingMatchesSavedSearch(l, "{\"q\":\"laptop\"}")
        ).equal(false);
      };
      case null assert false;
    };
  });

  test("alert notification when enabled and listing matches", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let store = Map.empty<Types.UserId, List.List<Types.SavedSearch>>();
    ignore Engagement.saveSearch(store, 1, buyer, "Phones", "{\"q\":\"phone\"}");
    ignore Engagement.setSavedSearchAlerts(store, buyer, 1, true);
    let notifications = Map.empty<Principal, List.List<Types.NotificationEvent>>();
    let nextNotificationId = { var value = 0 };
    switch (listings.get(1)) {
      case (?listing) {
        Engagement.notifyMatchingSavedSearchAlerts(
          store, notifications, nextNotificationId, listing,
        );
      };
      case null assert false;
    };
    switch (notifications.get(buyer)) {
      case (?events) {
        expect.nat(events.size()).equal(1);
        let event = events.toArray()[0];
        expect.text(event.eventType).equal("saved_search_match");
        expect.nat(event.tradeId).equal(1);
      };
      case null assert false;
    };
  });

  test("no alert when alerts disabled", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let store = Map.empty<Types.UserId, List.List<Types.SavedSearch>>();
    ignore Engagement.saveSearch(store, 1, buyer, "Phones", "{\"q\":\"phone\"}");
    let notifications = Map.empty<Principal, List.List<Types.NotificationEvent>>();
    let nextNotificationId = { var value = 0 };
    switch (listings.get(1)) {
      case (?listing) {
        Engagement.notifyMatchingSavedSearchAlerts(
          store, notifications, nextNotificationId, listing,
        );
      };
      case null assert false;
    };
    switch (notifications.get(buyer)) {
      case null {};
      case (?_) assert false;
    };
  });
});

suite("Engagement — inquiries", func() {
  test("buyer sends inquiry and seller replies", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let inquiries = Map.empty<Types.ListingInquiryId, Types.ListingInquiry>();
    let inquiryIndex = Map.empty<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>();
    let inquiryKeyIndex = Map.empty<Text, Types.ListingInquiryId>();
    let messages = Map.empty<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>();
    let nextInquiryId = { var value = 0 };
    let nextMsgId = { var value = 0 };

    switch (
      Engagement.sendInquiryMessage(
        inquiries, inquiryIndex, inquiryKeyIndex, messages, listings,
        nextInquiryId, nextMsgId, buyer, 1, buyer, "Is this available?",
      )
    ) {
      case (#ok(m1)) {
        expect.text(m1.content).equal("Is this available?");
        switch (
          Engagement.sendInquiryMessage(
            inquiries, inquiryIndex, inquiryKeyIndex, messages, listings,
            nextInquiryId, nextMsgId, seller, 1, buyer, "Yes, still for sale.",
          )
        ) {
          case (#ok(_)) {
            switch (
              Engagement.getInquiryMessages(
                inquiryIndex, inquiryKeyIndex, inquiries, messages,
                buyer, 1, buyer,
              )
            ) {
              case (#ok(msgs)) { expect.nat(msgs.size()).equal(2) };
              case (#err(_)) assert false;
            };
          };
          case (#err(_)) assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });
});

suite("Engagement — bump and promote", func() {
  test("owner can bump once per day", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let now = Types.now();
    switch (Engagement.bumpListing(listings, seller, 1, now)) {
      case (#ok(())) {};
      case (#err(_)) assert false;
    };
    switch (Engagement.bumpListing(listings, seller, 1, now + 1)) {
      case (#err(#rate_limited)) {};
      case (_) assert false;
    };
  });

  test("promote marks listing promoted", func() {
    let listings = makeListings();
    seedListing(listings, 1);
    let now = Types.now();
    ignore Engagement.promoteListing(listings, 1, now, Engagement.defaultPromoteDurationNs());
    switch (listings.get(1)) {
      case (?l) {
        expect.bool(Engagement.isPromotedNow(l, now)).equal(true);
      };
      case null assert false;
    };
  });
});
