/// Marketplace.test.mo — Listing lifecycle tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Marketplace "../src/backend/lib/Marketplace";
import Types "../src/backend/types";

let testCanisterId = Principal.fromText("aaaaa-aa");

// ─── Helpers ───────────────────────────────────────────────────────────────

let seller = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let other  = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");

func makeListings() : Map.Map<Types.ListingId, Types.Listing> {
  Map.empty<Types.ListingId, Types.Listing>()
};

func makeSpam() : Map.Map<Types.UserId, Types.Timestamp> {
  Map.empty<Types.UserId, Types.Timestamp>()
};

func activateListing(
  listings : Map.Map<Types.ListingId, Types.Listing>,
  id       : Nat,
) {
  switch (listings.get(id)) {
    case (?l) { l.status := #active };
    case null {};
  };
};

func createPhysical(
  listings    : Map.Map<Types.ListingId, Types.Listing>,
  spamTracker : Map.Map<Types.UserId, Types.Timestamp>,
  id          : Nat,
  caller      : Principal,
  priceToken  : Types.TradeToken,
  title       : Text,
  location    : Text,
  priceAmount : Nat,
) : Types.Result<Types.ListingCard> {
  let result = Marketplace.createListing(
    listings, spamTracker, id, caller,
    testCanisterId,
    title,
    "A valid description for this test listing",
    #electronics,
    null,
    priceAmount,
    priceToken,
    #good,
    [],
    location,
    [],
    false, null, null, null,
    null, null, null, null,
    [],
  );
  switch (result) {
    case (#ok(_)) {
      switch (listings.get(id)) {
        case (?l) { l.status := #active };
        case null {};
      };
    };
    case (#err(_)) {};
  };
  result
};

func createPhysicalDefault(
  listings    : Map.Map<Types.ListingId, Types.Listing>,
  spamTracker : Map.Map<Types.UserId, Types.Timestamp>,
  id          : Nat,
  caller      : Principal,
) : Types.Result<Types.ListingCard> {
  createPhysical(listings, spamTracker, id, caller, #USDT_TRC20, "Test Item", "Kyiv", 1_000_000)
};

// ─── Tests ─────────────────────────────────────────────────────────────────

suite("Marketplace — createListing", func() {
  test("valid physical listing returns #ok", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = createPhysicalDefault(listings, spamTracker, 1, seller);
    switch result {
      case (#ok(card)) {
        expect.text(card.title).equal("Test Item");
        expect.nat(listings.size()).equal(1);
      };
      case (#err(e)) {
        assert false;
        ignore e;
      };
    };
  });

  test("empty title returns #err invalid_input", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "",
      "Description",
      #electronics,
      null,
      1_000_000,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("zero price returns #err invalid_input", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Valid Title",
      "Description",
      #electronics,
      null,
      0,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("digital listing without url returns #ok draft", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Digital Game Key",
      "Digital goods listing",
      #electronics,
      null,
      500_000,
      #USDC_ERC20,
      #new_,
      [],
      "Online",
      [],
      true, null, null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#ok(_)) {};
      case (_) assert false;
    };
  });

  test("digital listing with legacy url returns invalid_input", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Digital Game Key",
      "Digital goods listing",
      #electronics,
      null,
      500_000,
      #USDC_ERC20,
      #new_,
      [],
      "Online",
      [],
      true, ?"https://cdn.example.com/file", null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });
});

suite("Marketplace — digital publish gate (F-CYCLE5-001)", func() {
  test("digital draft without file fails assertDigitalReadyForPublish", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Digital Game Key",
      "Awaiting file upload",
      #electronics,
      null,
      500_000,
      #USDC_ERC20,
      #new_,
      [],
      "Online",
      [],
      true, null, null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#ok(_)) {};
      case (_) assert false;
    };
    switch (listings.get(1)) {
      case (?listing) {
        switch (Marketplace.assertDigitalReadyForPublish(listing)) {
          case (?#invalid_input(_)) {};
          case (_) assert false;
        };
        expect.text(debug_show(listing.status)).equal(debug_show(#draft));
      };
      case null assert false;
    };
  });

  test("digital listing with asset passes assertDigitalReadyForPublish", func() {
    let listing : Types.Listing = {
      id              = 1;
      seller          = seller;
      var title       = "Digital PDF";
      var description = "Ebook";
      var category    = #other;
      var categoryId  = 1;
      var priceAmount = 1_000_000;
      var priceToken  = #USDT_TRC20;
      var condition   = #good;
      var photos      = [];
      var location    = "Online";
      var shippingMethods = [];
      isDigital       = true;
      var digitalFileUrl  = null;
      var digitalFileHash = null;
      var digitalPassword = null;
      var digitalFileUrlEncrypted  = null;
      var digitalPasswordEncrypted = null;
      var digitalFileAsset = ?{
        fileVersionId = 1;
        blobHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        mimeType = "application/pdf";
        sizeBytes = 1024;
        blobUrlEncrypted = "deadbeef";
        dekEncrypted = "cafebabe";
        contentHash = ?"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        registeredAt = Types.now();
      };
      var status      = #draft;
      createdAt       = Types.now();
      var expiresAt   = Types.now();
      var viewCount   = 0;
      var packageDetails   = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig  = null;
      var meestConfig      = null;
      var resolvedAt       = null;
      var bumpedAt         = 0 : Types.Timestamp;
      var promotedUntil    = null;
      var attributes       = [];
    };
    switch (Marketplace.assertDigitalReadyForPublish(listing)) {
      case null {};
      case (_) assert false;
    };
  });
});

suite("Marketplace — searchListings", func() {
  test("returns active listings matching token filter via priceToken", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore createPhysical(
      listings, spamTracker, 2, other,
      #USDT_BEP20, "BEP20 Item", "Kharkiv", 2_000_000,
    );
    // Search without filter — both active listings returned
    let params : Marketplace.SearchParams = {
      searchText     = null;
      category       = null;
      categoryId     = null;
      priceMin       = null;
      priceMax       = null;
      location       = null;
      condition      = null;
      shippingCarrier = null;
      priceToken     = ?#USDT_BEP20;
      offset         = 0;
      limit          = 50;
    };
    let results = Marketplace.searchListings(listings, params);
    expect.nat(results.size()).equal(1);
    expect.text(results[0].title).equal("BEP20 Item");
  });

  test("categoryId subtree filter matches phones under electronics", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.createListing(
      listings, spamTracker, 2, other,
      testCanisterId,
      "Phone listing",
      "Smartphone in phones category",
      #electronics,
      ?501,
      3_000_000,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      [],
    );
    activateListing(listings, 2);
    let params : Marketplace.SearchParams = {
      searchText      = null;
      category        = null;
      categoryId      = ?5;
      priceMin        = null;
      priceMax        = null;
      location        = null;
      condition       = null;
      shippingCarrier = null;
      priceToken      = null;
      offset          = 0;
      limit           = 50;
    };
    let results = Marketplace.searchListings(listings, params);
    expect.nat(results.size()).equal(2);
  });

  test("text search filters by title keyword", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.createListing(
      listings, spamTracker, 2, other,
      testCanisterId,
      "Laptop Pro",
      "High performance laptop",
      #electronics,
      ?501,
      50_000_000,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      [],
    );
    activateListing(listings, 2);
    let params : Marketplace.SearchParams = {
      searchText      = ?"laptop";
      category        = null;
      categoryId      = null;
      priceMin        = null;
      priceMax        = null;
      location        = null;
      condition       = null;
      shippingCarrier = null;
      priceToken      = null;
      offset          = 0;
      limit           = 50;
    };
    let results = Marketplace.searchListings(listings, params);
    expect.nat(results.size()).equal(1);
    expect.text(results[0].title).equal("Laptop Pro");
  });

  test("inactive listings are excluded from search", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.deactivateListing(listings, seller, 1);
    let params : Marketplace.SearchParams = {
      searchText      = null;
      category        = null;
      categoryId      = null;
      priceMin        = null;
      priceMax        = null;
      location        = null;
      condition       = null;
      shippingCarrier = null;
      priceToken      = null;
      offset          = 0;
      limit           = 50;
    };
    let results = Marketplace.searchListings(listings, params);
    expect.nat(results.size()).equal(0);
  });
});

suite("Marketplace — deactivateListing", func() {
  test("owner can deactivate → status becomes #inactive", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    let result = Marketplace.deactivateListing(listings, seller, 1);
    switch result {
      case (#ok(())) {
        switch (listings.get(1)) {
          case (?l) expect.text(debug_show(l.status)).equal(debug_show(#inactive));
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("non-owner cannot deactivate → #err unauthorized", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    let result = Marketplace.deactivateListing(listings, other, 1);
    switch result {
      case (#err(#unauthorized)) {};
      case (_) assert false;
    };
  });

  test("deactivate sets resolvedAt", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.deactivateListing(listings, seller, 1);
    switch (listings.get(1)) {
      case (?l) {
        switch (l.resolvedAt) {
          case (?_) {};
          case null assert false;
        };
      };
      case null assert false;
    };
  });

  test("deactivate non-existent listing → #err not_found", func() {
    let listings = makeListings();
    let result   = Marketplace.deactivateListing(listings, seller, 999);
    switch result {
      case (#err(#not_found)) {};
      case (_) assert false;
    };
  });
});

suite("Marketplace — reactivateListing", func() {
  test("owner can reactivate inactive listing", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.deactivateListing(listings, seller, 1);
    let result = Marketplace.reactivateListing(listings, seller, 1);
    switch result {
      case (#ok(())) {
        switch (listings.get(1)) {
          case (?l) expect.text(debug_show(l.status)).equal(debug_show(#active));
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("reactivation resets expiresAt to now + 30 days and clears resolvedAt", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.deactivateListing(listings, seller, 1);
    let beforeReactivate = Types.now();
    ignore Marketplace.reactivateListing(listings, seller, 1);
    let thirtyDaysNs : Nat = 2_592_000_000_000_000;
    switch (listings.get(1)) {
      case (?l) {
        // expiresAt must be ≥ beforeReactivate + 30 days
        expect.bool(l.expiresAt >= beforeReactivate + thirtyDaysNs).isTrue();
        // resolvedAt must be cleared
        switch (l.resolvedAt) {
          case null {};
          case (?_) assert false;
        };
      };
      case null assert false;
    };
  });

  test("cannot reactivate active listing", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    let result = Marketplace.reactivateListing(listings, seller, 1);
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("non-owner cannot reactivate → #err unauthorized", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore Marketplace.deactivateListing(listings, seller, 1);
    let result = Marketplace.reactivateListing(listings, other, 1);
    switch result {
      case (#err(#unauthorized)) {};
      case (_) assert false;
    };
  });
});

suite("Marketplace — markExpired", func() {
  test("active listing past expiresAt becomes #inactive", func() {
    let listings = makeListings();
    // Insert a listing with expiresAt in the past
    let pastExpiry : Types.Timestamp = 1;
    let listing : Types.Listing = {
      id              = 1;
      seller          = seller;
      var title       = "Old Listing";
      var description = "Expired";
      var category    = #other;
      var categoryId  = 1;
      var priceAmount = 1_000_000;
      var priceToken  = #USDT_TRC20;
      var condition   = #good;
      var photos      = [];
      var location    = "Odesa";
      var shippingMethods = [];
      isDigital       = false;
      var digitalFileUrl  = null;
      var digitalFileHash = null;
      var digitalPassword = null;
      var digitalFileUrlEncrypted  = null;
      var digitalPasswordEncrypted = null;
      var digitalFileAsset = null;
      var status      = #active;
      createdAt       = 1;
      var expiresAt   = pastExpiry;
      var viewCount   = 0;
      var packageDetails   = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig  = null;
      var meestConfig      = null;
      var resolvedAt       = null;
      var bumpedAt         = Types.now();
      var promotedUntil    = null;
      var attributes       = [];
    };
    listings.add(1, listing);
    let count = Marketplace.markExpired(listings);
    expect.nat(count).equal(1);
    switch (listings.get(1)) {
      case (?l) expect.text(debug_show(l.status)).equal(debug_show(#inactive));
      case null assert false;
    };
  });

  test("active listing not yet expired is not marked", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    let count = Marketplace.markExpired(listings);
    expect.nat(count).equal(0);
    switch (listings.get(1)) {
      case (?l) expect.text(debug_show(l.status)).equal(debug_show(#active));
      case null assert false;
    };
  });
});

suite("Marketplace — getPublicListingsByUser", func() {
  test("returns only active listings for seller", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore createPhysicalDefault(listings, spamTracker, 2, seller);
    ignore Marketplace.deactivateListing(listings, seller, 2);

    let publicOnes = Marketplace.getPublicListingsByUser(listings, seller, 0, 50);
    expect.nat(publicOnes.size()).equal(1);
    expect.nat(publicOnes[0].id).equal(1);
  });

  test("excludes listings from other sellers", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    ignore createPhysicalDefault(listings, spamTracker, 1, seller);
    ignore createPhysicalDefault(listings, spamTracker, 2, other);

    let publicOnes = Marketplace.getPublicListingsByUser(listings, seller, 0, 50);
    expect.nat(publicOnes.size()).equal(1);
    expect.nat(publicOnes[0].id).equal(1);
  });
});

suite("Marketplace — category attributes", func() {
  test("auto category requires make/model/year", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Toyota Camry",
      "Well maintained car",
      #other,
      ?301,
      10_000_000_000,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      [],
    );
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("auto category accepts required attributes", func() {
    let listings    = makeListings();
    let spamTracker = makeSpam();
    let attrs : [Types.CategoryAttributeValue] = [
      { key = "make"; value = "Toyota" },
      { key = "model"; value = "Camry" },
      { key = "year"; value = "2018" },
    ];
    let result = Marketplace.createListing(
      listings, spamTracker, 1, seller,
      testCanisterId,
      "Toyota Camry",
      "Well maintained car",
      #other,
      ?301,
      10_000_000_000,
      #USDT_TRC20,
      #good,
      [],
      "Kyiv",
      [],
      false, null, null, null,
      null, null, null, null,
      attrs,
    );
    switch result {
      case (#ok(_)) {
        switch (listings.get(1)) {
          case (?l) expect.nat(l.attributes.size()).equal(3);
          case null assert false;
        };
      };
      case (#err(e)) { assert false; ignore e };
    };
  });
});

suite("Marketplace — E2.S11 digital file URL redaction", func() {
  test("toListingCard hides blob URL when digitalFileAsset present", func() {
    let listing : Types.Listing = {
      id              = 99;
      seller          = seller;
      var title       = "Digital PDF";
      var description = "Ebook";
      var category    = #other;
      var categoryId  = 1;
      var priceAmount = 1_000_000;
      var priceToken  = #USDT_TRC20;
      var condition   = #good;
      var photos      = [];
      var location    = "Online";
      var shippingMethods = [];
      isDigital       = true;
      var digitalFileUrl  = ?"https://storage.example.com/secret.pdf";
      var digitalFileHash = ?"sha256:abc";
      var digitalPassword = null;
      var digitalFileUrlEncrypted  = null;
      var digitalPasswordEncrypted = null;
      var digitalFileAsset = ?{
        fileVersionId = 1;
        blobHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        mimeType = "application/pdf";
        sizeBytes = 1024;
        blobUrlEncrypted = "deadbeef";
        dekEncrypted = "cafebabe";
        contentHash = ?"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        registeredAt = Types.now();
      };
      var status      = #active;
      createdAt       = Types.now();
      var expiresAt   = Types.now() + 86_400_000_000_000;
      var viewCount   = 0;
      var packageDetails   = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig  = null;
      var meestConfig      = null;
      var resolvedAt       = null;
      var bumpedAt         = Types.now();
      var promotedUntil    = null;
      var attributes       = [];
    };
    let card = Marketplace.toListingCardAnon(listing, Types.now());
    expect.text(card.digitalFileUrl).equal("");
  });
});
