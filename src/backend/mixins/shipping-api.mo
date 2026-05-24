import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Types "../types";
import Admin "../lib/Admin";
import Auth "../lib/Auth";
import ShippingLib "../lib/Shipping";
import EscrowLib "../lib/Escrow";

/// Shipping API mixin
/// Waybill management and shipment tracking with 5-minute response cache.
///
/// State injected:
///   systemSettings  : Admin.SystemSettings — reads carrier API key fields
///   shippingCache   : Map<Text,(Text,Timestamp)> — tracking result cache
///   nextWaybillSeed : { var value : Nat }    — monotonic seed for mock waybills
///   trades          : Map<TradeId, Trade>    — for trade-scoped TTN creation
///   listings        : Map<ListingId, Listing> — for listing data during TTN creation
mixin (
  systemSettings  : Admin.SystemSettings,
  shippingCache   : Map.Map<Text, (Text, Types.Timestamp)>,
  nextWaybillSeed : { var value : Nat },
  trades          : Map.Map<Types.TradeId, Types.Trade>,
  listings        : Map.Map<Types.ListingId, Types.Listing>,
  trackingTimelines : Map.Map<Types.TradeId, [Types.TrackingTimelineEntry]>,
) {

  // ─── IC management canister actor type (http_request) ────────────────────

  type ShipHttpHeader = { name : Text; value : Text };
  type ShipHttpRequestArgs = {
    url             : Text;
    max_response_bytes : ?Nat64;
    headers         : [ShipHttpHeader];
    body            : ?Blob;
    method          : { #get; #post; #head };
    transform       : ?{ function : shared query ({ response : ShipHttpResponse; context : Blob }) -> async ShipHttpResponse; context : Blob };
  };
  type ShipHttpResponse = {
    status  : Nat;
    headers : [ShipHttpHeader];
    body    : Blob;
  };

  let shipIc : actor { http_request : ShipHttpRequestArgs -> async ShipHttpResponse } =
    actor "aaaaa-aa";

  /// Strips all response headers so all replicas agree on the same response.
  public shared query func transformShippingResponse(
    raw : { response : ShipHttpResponse; context : Blob },
  ) : async ShipHttpResponse {
    {
      status  = raw.response.status;
      headers = [];
      body    = raw.response.body;
    }
  };

  let shippingTransform : ?{
    function : shared query ({ response : ShipHttpResponse; context : Blob }) -> async ShipHttpResponse;
    context  : Blob;
  } = ?{
    function = transformShippingResponse;
    context  = "".encodeUtf8();
  };

  // ─── Internal: generic HTTP helpers ──────────────────────────────────────

  func doPost(url : Text, body : Text, headers : [ShipHttpHeader]) : async { #ok : Text; #err : Text } {
    let bodyBlob = body.encodeUtf8();
    let args : ShipHttpRequestArgs = {
      url             = url;
      max_response_bytes = ?(8_000 : Nat64);
      headers         = headers;
      body            = ?bodyBlob;
      method          = #post;
      transform       = shippingTransform;
    };
    try {
      let resp = await (with cycles = 49_000_000) shipIc.http_request(args);
      switch (resp.body.decodeUtf8()) {
        case (?json) #ok(json);
        case null    #err("Failed to decode response body as UTF-8");
      };
    } catch (_) {
      #err("HTTPS outcall failed — network error");
    };
  };

  func doGet(url : Text, headers : [ShipHttpHeader]) : async { #ok : Text; #err : Text } {
    let args : ShipHttpRequestArgs = {
      url             = url;
      max_response_bytes = ?(8_000 : Nat64);
      headers         = headers;
      body            = null;
      method          = #get;
      transform       = shippingTransform;
    };
    try {
      let resp = await (with cycles = 49_000_000) shipIc.http_request(args);
      switch (resp.body.decodeUtf8()) {
        case (?json) #ok(json);
        case null    #err("Failed to decode response body as UTF-8");
      };
    } catch (_) {
      #err("HTTPS outcall failed — network error");
    };
  };

  // ─── Internal: Nova Poshta ────────────────────────────────────────────────

  func npPost(body : Text) : async { #ok : Text; #err : Text } {
    await doPost(ShippingLib.NP_API_URL, body, [
      { name = "Content-Type"; value = "application/json" },
      { name = "Accept";       value = "application/json" },
    ]);
  };

  func resolveNpApiKey() : Text {
    let k = systemSettings.novaPoshtaApiKey;
    if (k == "") ShippingLib.NP_PLACEHOLDER_API_KEY else k
  };

  func hasNpApiKey() : Bool {
    let k = systemSettings.novaPoshtaApiKey;
    k != ShippingLib.NP_PLACEHOLDER_API_KEY and k != ""
  };

  // ─── Internal: Ukrposhta ──────────────────────────────────────────────────

  func upPost(url : Text, body : Text, bearer : Text) : async { #ok : Text; #err : Text } {
    await doPost(url, body, [
      { name = "Content-Type";  value = "application/json" },
      { name = "Accept";        value = "application/json" },
      { name = "Authorization"; value = "Bearer " # bearer },
    ]);
  };

  func upGet(url : Text, bearer : Text) : async { #ok : Text; #err : Text } {
    await doGet(url, [
      { name = "Accept";        value = "application/json" },
      { name = "Authorization"; value = "Bearer " # bearer },
    ]);
  };

  func hasUpApiKey() : Bool { systemSettings.ukrPoshtaApiKey != "" };

  // ─── Internal: Meest Express ──────────────────────────────────────────────

  func meestPost(url : Text, body : Text, apiKey : Text) : async { #ok : Text; #err : Text } {
    await doPost(url, body, [
      { name = "Content-Type"; value = "application/json" },
      { name = "Accept";       value = "application/json" },
      { name = "x-api-key";   value = apiKey },
    ]);
  };

  func meestGet(url : Text, apiKey : Text) : async { #ok : Text; #err : Text } {
    await doGet(url, [
      { name = "Accept";     value = "application/json" },
      { name = "x-api-key"; value = apiKey },
    ]);
  };

  func hasMeestApiKey() : Bool { systemSettings.meestApiKey != "" };

  // ─── Internal: mock seed helper ──────────────────────────────────────────

  func nextSeed() : Nat {
    let s = nextWaybillSeed.value;
    nextWaybillSeed.value += 1;
    s
  };

  // ─── Nova Poshta public API ───────────────────────────────────────────────

  /// Calculate shipping cost via Nova Poshta.
  /// When no real API key is set, returns realistic mock data.
  /// Returns estimated cost in UAH and transit days.
  public shared func calculateShippingCost(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    serviceType   : Types.ShippingServiceType,
  ) : async { #ok : { costUAH : Nat; transitDays : Nat }; #err : Text } {
    if (not hasNpApiKey()) {
      return #ok(ShippingLib.mockCostResponse(weightKg, serviceType));
    };
    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildCostRequest(apiKey, senderCity, recipientCity, weightKg, serviceType);
    switch (await npPost(reqBody)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseNovaPoshtaCostResponse(json)) {
          case (?result) #ok(result);
          case null #err("Failed to parse cost response from Nova Poshta");
        };
      };
    };
  };

  /// Create a Nova Poshta waybill / shipment record.
  /// Called when a trade is confirmed. Returns a tracking number.
  /// Uses mock data if no real API key is configured.
  public shared ({ caller }) func createWaybill(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
    serviceType   : Types.ShippingServiceType,
  ) : async { #ok : Text; #err : Text } {
    Auth.assertNotAnonymous(caller);
    if (not hasNpApiKey()) {
      return #ok(ShippingLib.mockTrackingNumber(nextSeed()));
    };
    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildWaybillRequest(apiKey, senderCity, recipientCity, weightKg, description, cost, serviceType);
    switch (await npPost(reqBody)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseNovaPoshtaWaybillResponse(json)) {
          case (?trackingNum) #ok(trackingNum);
          case null #err("Failed to parse waybill response from Nova Poshta");
        };
      };
    };
  };

  /// Track a Nova Poshta shipment by tracking number.
  /// Caches results for 5 minutes to reduce outcall costs.
  public shared func trackShipment(trackingNumber : Text) : async { #ok : Text; #err : Text } {
    switch (ShippingLib.getCachedTracking(shippingCache, trackingNumber)) {
      case (?cached) return #ok(cached);
      case null {};
    };
    if (not hasNpApiKey()) {
      let status = ShippingLib.mockTrackingStatus();
      ShippingLib.putCachedTracking(shippingCache, trackingNumber, status);
      return #ok(status);
    };
    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildTrackingRequest(apiKey, trackingNumber);
    switch (await npPost(reqBody)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseNovaPoshtaTrackingResponse(json)) {
          case (?status) {
            ShippingLib.putCachedTracking(shippingCache, trackingNumber, status);
            #ok(status);
          };
          case null #err("Failed to parse tracking response from Nova Poshta");
        };
      };
    };
  };

  // ─── Ukrposhta public API ─────────────────────────────────────────────────

  /// Create an Ukrposhta waybill. Returns barcode (tracking number).
  /// Uses mock data if ukrPoshtaApiKey is not set.
  public shared ({ caller }) func createUkrPoshtaWaybill(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
  ) : async { #ok : Text; #err : Text } {
    Auth.assertNotAnonymous(caller);
    if (not hasUpApiKey()) {
      return #ok(ShippingLib.mockUpBarcode(nextSeed()));
    };
    let bearer = systemSettings.ukrPoshtaApiKey;
    let reqBody = ShippingLib.buildUpWaybillRequest(senderCity, recipientCity, weightKg, description, cost);
    switch (await upPost(ShippingLib.UP_SHIPMENT_URL, reqBody, bearer)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseUpWaybillResponse(json)) {
          case (?barcode) #ok(barcode);
          case null #err("Failed to parse waybill response from Ukrposhta");
        };
      };
    };
  };

  /// Track an Ukrposhta shipment by barcode.
  /// Caches results for 5 minutes.
  public shared func trackUkrPoshtaShipment(barcode : Text) : async { #ok : Text; #err : Text } {
    let cacheKey = "up:" # barcode;
    switch (ShippingLib.getCachedTracking(shippingCache, cacheKey)) {
      case (?cached) return #ok(cached);
      case null {};
    };
    if (not hasUpApiKey()) {
      let status = ShippingLib.mockTrackingStatus();
      ShippingLib.putCachedTracking(shippingCache, cacheKey, status);
      return #ok(status);
    };
    let bearer = systemSettings.ukrPoshtaApiKey;
    let url = ShippingLib.UP_TRACK_BASE # "/" # barcode # "/statuses";
    switch (await upGet(url, bearer)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseUpTrackingResponse(json)) {
          case (?status) {
            ShippingLib.putCachedTracking(shippingCache, cacheKey, status);
            #ok(status);
          };
          case null #err("Failed to parse tracking response from Ukrposhta");
        };
      };
    };
  };

  // ─── Meest Express public API ─────────────────────────────────────────────

  /// Create a Meest Express order (waybill). Returns tracking number.
  /// Uses mock data if meestApiKey is not set.
  public shared ({ caller }) func createMeestWaybill(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
  ) : async { #ok : Text; #err : Text } {
    Auth.assertNotAnonymous(caller);
    if (not hasMeestApiKey()) {
      return #ok(ShippingLib.mockMeestTrackingNumber(nextSeed()));
    };
    let apiKey = systemSettings.meestApiKey;
    let reqBody = ShippingLib.buildMeestWaybillRequest(senderCity, recipientCity, weightKg, description, cost);
    switch (await meestPost(ShippingLib.MEEST_SHIPMENT_URL, reqBody, apiKey)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseMeestWaybillResponse(json)) {
          case (?trackingNum) #ok(trackingNum);
          case null #err("Failed to parse waybill response from Meest Express");
        };
      };
    };
  };

  /// Track a Meest Express shipment by tracking number.
  /// Caches results for 5 minutes.
  public shared func trackMeestShipment(trackingNumber : Text) : async { #ok : Text; #err : Text } {
    let cacheKey = "meest:" # trackingNumber;
    switch (ShippingLib.getCachedTracking(shippingCache, cacheKey)) {
      case (?cached) return #ok(cached);
      case null {};
    };
    if (not hasMeestApiKey()) {
      let status = ShippingLib.mockTrackingStatus();
      ShippingLib.putCachedTracking(shippingCache, cacheKey, status);
      return #ok(status);
    };
    let apiKey = systemSettings.meestApiKey;
    let url = ShippingLib.MEEST_TRACK_BASE # "/" # trackingNumber;
    switch (await meestGet(url, apiKey)) {
      case (#err(msg)) #err(msg);
      case (#ok(json)) {
        switch (ShippingLib.parseMeestTrackingResponse(json)) {
          case (?status) {
            ShippingLib.putCachedTracking(shippingCache, cacheKey, status);
            #ok(status);
          };
          case null #err("Failed to parse tracking response from Meest Express");
        };
      };
    };
  };

  // ─── Aggregated shipping options ──────────────────────────────────────────

  /// Get shipping cost options from all three carriers.
  /// Makes up to 3 HTTPS outcalls (or returns mocks when keys not set).
  /// serviceType is used for Nova Poshta; Ukrposhta and Meest use standard delivery.
  public shared func getShippingOptions(
    weight   : Float,
    fromCity : Text,
    toCity   : Text,
  ) : async { #ok : [Types.ShippingOption]; #err : Text } {
    // Nova Poshta
    let npResult = if (not hasNpApiKey()) {
      let m = ShippingLib.mockCostResponse(weight, #standard);
      { costUAH = m.costUAH; transitDays = m.transitDays; available = true };
    } else {
      let apiKey = resolveNpApiKey();
      let body = ShippingLib.buildCostRequest(apiKey, fromCity, toCity, weight, #standard);
      switch (await npPost(body)) {
        case (#err(_))   ( { costUAH = 0; transitDays = 0; available = false } );
        case (#ok(json)) {
          switch (ShippingLib.parseNovaPoshtaCostResponse(json)) {
            case (?r) ( { costUAH = r.costUAH; transitDays = r.transitDays; available = true } );
            case null ( { costUAH = 0; transitDays = 0; available = false } );
          };
        };
      };
    };

    // Ukrposhta
    let upResult = if (not hasUpApiKey()) {
      let m = ShippingLib.mockUpCostResponse(weight);
      { costUAH = m.costUAH; transitDays = m.transitDays; available = true };
    } else {
      let bearer = systemSettings.ukrPoshtaApiKey;
      let body = ShippingLib.buildUpCostRequest(fromCity, toCity, weight);
      switch (await upPost(ShippingLib.UP_COST_URL, body, bearer)) {
        case (#err(_))   ( { costUAH = 0; transitDays = 0; available = false } );
        case (#ok(json)) {
          switch (ShippingLib.parseUpCostResponse(json)) {
            case (?r) ( { costUAH = r.costUAH; transitDays = r.transitDays; available = true } );
            case null ( { costUAH = 0; transitDays = 0; available = false } );
          };
        };
      };
    };

    // Meest Express
    let meestResult = if (not hasMeestApiKey()) {
      let m = ShippingLib.mockMeestCostResponse(weight);
      { costUAH = m.costUAH; transitDays = m.transitDays; available = true };
    } else {
      let apiKey = systemSettings.meestApiKey;
      let body = ShippingLib.buildMeestCostRequest(fromCity, toCity, weight);
      switch (await meestPost(ShippingLib.MEEST_COST_URL, body, apiKey)) {
        case (#err(_))   ( { costUAH = 0; transitDays = 0; available = false } );
        case (#ok(json)) {
          switch (ShippingLib.parseMeestCostResponse(json)) {
            case (?r) ( { costUAH = r.costUAH; transitDays = r.transitDays; available = true } );
            case null ( { costUAH = 0; transitDays = 0; available = false } );
          };
        };
      };
    };

    #ok([
      {
        carrier      = #nova_poshta;
        cost         = 0.0;
        costNat      = npResult.costUAH * 100;
        deliveryDays = npResult.transitDays;
        available    = npResult.available;
      },
      {
        carrier      = #ukrposhta;
        cost         = 0.0;
        costNat      = upResult.costUAH * 100;
        deliveryDays = upResult.transitDays;
        available    = upResult.available;
      },
      {
        carrier      = #meest;
        cost         = 0.0;
        costNat      = meestResult.costUAH * 100;
        deliveryDays = meestResult.transitDays;
        available    = meestResult.available;
      },
    ])
  };

  /// Query: returns list of all supported carriers with display names.
  public query func getSupportedCarriers() : async [ShippingLib.CarrierInfo] {
    ShippingLib.supportedCarriers()
  };

  // ─── Nova Poshta branch lookup ────────────────────────────────────────────

  /// Get Nova Poshta branches (warehouses) for a city.
  /// Any authenticated user may call this (needed by buyers selecting a branch).
  /// Returns mock data when no API key is configured.
  public shared ({ caller }) func getNovaPoshtaBranches(
    cityName     : Text,
    searchString : ?Text,
    limit        : ?Nat,
  ) : async Types.Result<[Types.NovaPoshtaBranch]> {
    Auth.assertNotAnonymous(caller);
    let maxItems = switch limit { case (?l) l; case null 50 };
    let search   = switch searchString { case (?s) s; case null "" };
    if (not hasNpApiKey()) {
      // Return filtered mock branches when no API key configured (test mode)
      let all = ShippingLib.mockNpBranches();
      let filtered = if (search == "") {
        all
      } else {
        let lc = search.toLower();
        all.filter(func(b) { b.name.toLower().contains(#text lc) or b.address.toLower().contains(#text lc) })
      };
      let sliced = if (filtered.size() <= maxItems) filtered
        else filtered.sliceToArray(0, maxItems.toInt());
      return #ok(sliced);
    };
    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildGetWarehousesRequest(apiKey, cityName, search, maxItems);
    switch (await npPost(reqBody)) {
      case (#err(msg)) #err(#invalid_input("Nova Poshta branches error: " # msg));
      case (#ok(json)) {
        let branches = ShippingLib.parseNovaPoshtaBranchesResponse(json, maxItems);
        #ok(branches)
      };
    };
  };

  /// Resolve a city name to a Nova Poshta CityRef via Address.getCities.
  /// Returns mock Kyiv ref when no API key configured.
  func getNovaPoshtaCityRefInternal(cityName : Text) : async { #ok : Text; #err : Text } {
    if (not hasNpApiKey()) {
      return #ok(ShippingLib.MOCK_KYIV_CITY_REF);
    };
    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildGetCitiesRequest(apiKey, cityName);
    switch (await npPost(reqBody)) {
      case (#err(msg)) #err("getCities failed: " # msg);
      case (#ok(json)) {
        switch (ShippingLib.parseNovaPoshtaCityRefResponse(json)) {
          case (?ref) #ok(ref);
          case null #err("City not found: " # cityName);
        };
      };
    };
  };

  /// Public endpoint: resolve city name to Nova Poshta CityRef.
  public shared ({ caller }) func getNovaPoshtaCityRef(cityName : Text) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);
    switch (await getNovaPoshtaCityRefInternal(cityName)) {
      case (#ok(ref)) #ok(ref);
      case (#err(msg)) #err(#invalid_input(msg));
    };
  };

  // ─── Trade-scoped TTN creation ────────────────────────────────────────────

  /// Internal: perform TTN creation for a trade (caller already validated).
  func doCreateTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    // Load trade
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };

    if (not EscrowLib.isFulfillmentAllowed(trade.status)) {
      return #err(#escrow_error(
        "Cannot create TTN before payment is verified — complete PaymentIntent and explorer verification first"
      ));
    };

    // Load listing
    let listing = switch (listings.get(trade.listing)) {
      case null { return #err(#not_found) };
      case (?l) l;
    };

    // Mark as in-progress
    trade.ttnCreationStatus := #InProgress;

    // Resolve sender city (from listing.location) and recipient city.
    // NOTE: Trade record does not have a separate buyerCity field yet.
    // We use listing.location as sender city and derive recipient from
    // shippingSelection.address (first comma-segment) or default to "Київ".
    let senderCityName : Text = listing.location;
    let recipientCityName : Text = switch (trade.shippingSelection) {
      case null "Київ";
      case (?sel) switch (sel.address) {
        case (?addr) switch (addr.split(#char ',').next()) {
          case (?city) city;
          case null "Київ";
        };
        case null "Київ";
      };
    };

    let senderCityRef = switch (await getNovaPoshtaCityRefInternal(senderCityName)) {
      case (#err(msg)) {
        trade.ttnCreationStatus := #Failed;
        return #err(#invalid_input("Sender city lookup failed: " # msg));
      };
      case (#ok(ref)) ref;
    };

    let recipientCityRef = switch (await getNovaPoshtaCityRefInternal(recipientCityName)) {
      case (#err(msg)) {
        trade.ttnCreationStatus := #Failed;
        return #err(#invalid_input("Recipient city lookup failed: " # msg));
      };
      case (#ok(ref)) ref;
    };

    // Determine branch refs
    let senderBranchRef : Text = switch (listing.novaPoshtaConfig) {
      case (?cfg) if (cfg.senderBranchRef != "") cfg.senderBranchRef
                  else ShippingLib.MOCK_SENDER_BRANCH_REF;
      case null ShippingLib.MOCK_SENDER_BRANCH_REF;
    };

    let recipientBranchRef : Text = switch (trade.shippingSelection) {
      case (?sel) switch (sel.branchRef) {
        case (?ref) ref;
        case null ShippingLib.MOCK_SENDER_BRANCH_REF;
      };
      case null ShippingLib.MOCK_SENDER_BRANCH_REF;
    };

    // Package weight in kg (weight is stored in grams)
    let weightKg : Float = switch (listing.packageDetails) {
      case null 0.5;
      case (?pkg) {
        if (pkg.weight == 0) 0.5
        else (pkg.weight.toFloat()) / 1000.0
      };
    };

    let seatsAmount : Nat = switch (listing.packageDetails) {
      case null 1;
      case (?pkg) if (pkg.places == 0) 1 else pkg.places;
    };

    // Declared cost: listing price in kopiykas ÷ 10_000 → UAH, min 300
    let costUAH : Nat = do {
      let raw = listing.priceAmount / 10_000;
      if (raw < 300) 300 else raw
    };

    // Truncate description to 50 chars
    let description = ShippingLib.truncate(listing.title, 50);

    // Format today's date
    let dateStr = ShippingLib.formatDateDDMMYYYY(Types.now());

    // Prod gate — no mock TTN without real Nova Poshta API key.
    if (not hasNpApiKey()) {
      trade.ttnCreationStatus := #Failed;
      return #err(#invalid_input("Nova Poshta API key required for TTN creation"));
    };

    let apiKey = resolveNpApiKey();
    let reqBody = ShippingLib.buildTTNRequest(
      apiKey,
      senderCityRef,
      recipientCityRef,
      senderBranchRef,
      recipientBranchRef,
      weightKg,
      seatsAmount,
      description,
      costUAH,
      dateStr,
    );

    // Attempt 1
    switch (await npPost(reqBody)) {
      case (#ok(json)) {
        switch (ShippingLib.parseTTNResponse(json)) {
          case (?ttn) {
            trade.ttnNumber := ?ttn;
            trade.ttnCreationStatus := #Success;
            return #ok(ttn);
          };
          case null {}; // fall through to retry
        };
      };
      case (#err(_)) {}; // fall through to retry
    };

    // Attempt 2 (single retry — full exponential backoff deferred to Phase 3 timers)
    switch (await npPost(reqBody)) {
      case (#err(msg)) {
        trade.ttnCreationStatus := #Failed;
        #err(#invalid_input("TTN creation failed after retry: " # msg))
      };
      case (#ok(json)) {
        switch (ShippingLib.parseTTNResponse(json)) {
          case (?ttn) {
            trade.ttnNumber := ?ttn;
            trade.ttnCreationStatus := #Success;
            #ok(ttn)
          };
          case null {
            trade.ttnCreationStatus := #Failed;
            #err(#invalid_input("TTN creation failed: could not parse Nova Poshta response"))
          };
        };
      };
    };
  };

  /// After TTN creation, transition trade via unified markShipped path (E7.S3).
  func finalizeTtnAndShip(
    tradeId : Types.TradeId,
    seller  : Principal,
    ttn     : Text,
  ) : async Types.Result<Text> {
    switch (EscrowLib.markShipped(trades, seller, tradeId, ttn)) {
      case (#ok(_)) #ok(ttn);
      case (#err(e)) #err(e);
    }
  };

  /// Create a Nova Poshta TTN (waybill) for a specific trade.
  /// Only the seller of the trade may call this.
  /// On success: sets trade.ttnNumber and trade.ttnCreationStatus = #Success.
  /// On failure: sets trade.ttnCreationStatus = #Failed.
  /// NOTE: Full exponential backoff retry requires timer integration (Phase 3).
  /// This implementation makes 2 attempts (initial + one retry) on transient failure.
  public shared ({ caller }) func createNovaPoshtaTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) {
      return #err(#unauthorized);
    };

    switch (await doCreateTTN(tradeId)) {
      case (#err(e)) #err(e);
      case (#ok(ttn)) await finalizeTtnAndShip(tradeId, caller, ttn);
    }
  };

  /// Retry TTN creation for a trade (resets status and tries again).
  /// Only the seller of the trade may call this.
  public shared ({ caller }) func retryTTNCreation(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) {
      return #err(#unauthorized);
    };

    // Reset status before retrying
    trade.ttnCreationStatus := #Pending;
    trade.ttnNumber := null;

    await doCreateTTN(tradeId)
  };

  // ─── Ukrposhta office lookup ──────────────────────────────────────────────

  /// Get Ukrposhta post-offices for a city.
  /// Returns mock data when no API key is configured.
  public shared ({ caller }) func getUkrposhtaOffices(
    cityName     : Text,
    searchString : ?Text,
    limit        : ?Nat,
  ) : async Types.Result<[{ index : Text; name : Text; address : Text }]> {
    Auth.assertNotAnonymous(caller);
    let maxItems = switch limit { case (?l) l; case null 50 };
    let search   = switch searchString { case (?s) s; case null "" };
    if (not hasUpApiKey()) {
      let all = ShippingLib.mockUpOffices();
      let filtered = if (search == "") {
        all
      } else {
        let lc = search.toLower();
        all.filter(func(o) { o.name.toLower().contains(#text lc) or o.address.toLower().contains(#text lc) })
      };
      let sliced = if (filtered.size() <= maxItems) filtered
        else filtered.sliceToArray(0, maxItems.toInt());
      return #ok(sliced);
    };
    let url = ShippingLib.buildUkrposhtaOfficesRequest(cityName, searchString);
    switch (await upGet(url, systemSettings.ukrPoshtaApiKey)) {
      case (#err(msg)) #err(#invalid_input("Ukrposhta offices error: " # msg));
      case (#ok(json)) {
        let offices = ShippingLib.parseUkrposhtaOfficesResponse(json, maxItems);
        #ok(offices)
      };
    };
  };

  // ─── Meest PUDO lookup ────────────────────────────────────────────────────

  /// Get Meest PUDO (parcel pick-up/drop-off) locations for a city.
  /// Returns mock data when no API key is configured.
  public shared ({ caller }) func getMeestPUDOs(
    cityName     : Text,
    searchString : ?Text,
    limit        : ?Nat,
  ) : async Types.Result<[{ id : Text; name : Text; address : Text; type_ : Text }]> {
    Auth.assertNotAnonymous(caller);
    let maxItems = switch limit { case (?l) l; case null 50 };
    let search   = switch searchString { case (?s) s; case null "" };
    if (not hasMeestApiKey()) {
      let all = ShippingLib.mockMeestPUDOs();
      let filtered = if (search == "") {
        all
      } else {
        let lc = search.toLower();
        all.filter(func(p) { p.name.toLower().contains(#text lc) or p.address.toLower().contains(#text lc) })
      };
      let sliced = if (filtered.size() <= maxItems) filtered
        else filtered.sliceToArray(0, maxItems.toInt());
      return #ok(sliced);
    };
    let apiKey = systemSettings.meestApiKey;
    let reqBody = ShippingLib.buildMeestPUDOsRequest(cityName, searchString);
    switch (await meestPost(ShippingLib.MEEST_PUDO_URL, reqBody, apiKey)) {
      case (#err(msg)) #err(#invalid_input("Meest PUDOs error: " # msg));
      case (#ok(json)) {
        let pudos = ShippingLib.parseMeestPUDOsResponse(json, maxItems);
        #ok(pudos)
      };
    };
  };

  // ─── Ukrposhta trade-scoped TTN ───────────────────────────────────────────

  /// Internal: perform Ukrposhta TTN creation for a trade.
  func doCreateUkrposhtaTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    let listing = switch (listings.get(trade.listing)) {
      case null { return #err(#not_found) };
      case (?l) l;
    };

    trade.ttnCreationStatus := #InProgress;

    let senderCityName : Text = listing.location;
    let recipientCityName : Text = switch (trade.shippingSelection) {
      case null "Київ";
      case (?sel) switch (sel.address) {
        case (?addr) switch (addr.split(#char ',').next()) {
          case (?city) city;
          case null "Київ";
        };
        case null "Київ";
      };
    };

    let senderOfficeRef : Text = switch (listing.ukrposhtaConfig) {
      case (?cfg) switch (cfg.senderOfficeRef) {
        case (?ref) if (ref != "") ref else "01001";
        case null "01001";
      };
      case null "01001";
    };

    let weightKg : Float = switch (listing.packageDetails) {
      case null 0.5;
      case (?pkg) if (pkg.weight == 0) 0.5 else (pkg.weight.toFloat()) / 1000.0;
    };

    let seatsAmount : Nat = switch (listing.packageDetails) {
      case null 1;
      case (?pkg) if (pkg.places == 0) 1 else pkg.places;
    };

    let costUAH : Nat = do {
      let raw = listing.priceAmount / 10_000;
      if (raw < 100) 100 else raw
    };

    let description = ShippingLib.truncate(listing.title, 50);

    if (not hasUpApiKey()) {
      let mockBarcode = ShippingLib.mockUpBarcode(nextSeed());
      trade.ttnNumber := ?mockBarcode;
      trade.ttnCreationStatus := #Success;
      return #ok(mockBarcode);
    };

    let bearer = systemSettings.ukrPoshtaApiKey;
    let reqBody = ShippingLib.buildUpTTNRequest(
      senderCityName,
      recipientCityName,
      senderOfficeRef,
      weightKg,
      seatsAmount,
      description,
      costUAH,
    );

    // Attempt 1
    switch (await upPost(ShippingLib.UP_SHIPMENT_URL, reqBody, bearer)) {
      case (#ok(json)) {
        switch (ShippingLib.parseUpWaybillResponse(json)) {
          case (?barcode) {
            trade.ttnNumber := ?barcode;
            trade.ttnCreationStatus := #Success;
            return #ok(barcode);
          };
          case null {};
        };
      };
      case (#err(_)) {};
    };

    // Attempt 2
    switch (await upPost(ShippingLib.UP_SHIPMENT_URL, reqBody, bearer)) {
      case (#err(msg)) {
        trade.ttnCreationStatus := #Failed;
        #err(#invalid_input("Ukrposhta TTN creation failed after retry: " # msg))
      };
      case (#ok(json)) {
        switch (ShippingLib.parseUpWaybillResponse(json)) {
          case (?barcode) {
            trade.ttnNumber := ?barcode;
            trade.ttnCreationStatus := #Success;
            #ok(barcode)
          };
          case null {
            trade.ttnCreationStatus := #Failed;
            #err(#invalid_input("Ukrposhta TTN creation failed: could not parse response"))
          };
        };
      };
    };
  };

  /// Create an Ukrposhta TTN for a specific trade.
  /// Only the seller of the trade may call this.
  public shared ({ caller }) func createUkrposhtaTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) { return #err(#unauthorized) };
    switch (await doCreateUkrposhtaTTN(tradeId)) {
      case (#err(e)) #err(e);
      case (#ok(ttn)) await finalizeTtnAndShip(tradeId, caller, ttn);
    }
  };

  /// Retry Ukrposhta TTN creation (resets status and tries again).
  /// Only the seller may call this.
  public shared ({ caller }) func retryUkrposhtaTTNCreation(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) { return #err(#unauthorized) };
    trade.ttnCreationStatus := #Pending;
    trade.ttnNumber := null;
    await doCreateUkrposhtaTTN(tradeId)
  };

  // ─── Meest trade-scoped TTN ───────────────────────────────────────────────

  /// Internal: perform Meest TTN creation for a trade.
  func doCreateMeestTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    let listing = switch (listings.get(trade.listing)) {
      case null { return #err(#not_found) };
      case (?l) l;
    };

    trade.ttnCreationStatus := #InProgress;

    let senderCityName : Text = listing.location;
    let recipientCityName : Text = switch (trade.shippingSelection) {
      case null "Київ";
      case (?sel) switch (sel.address) {
        case (?addr) switch (addr.split(#char ',').next()) {
          case (?city) city;
          case null "Київ";
        };
        case null "Київ";
      };
    };

    let senderPudoRef : Text = switch (listing.meestConfig) {
      case (?cfg) switch (cfg.senderPudoRef) {
        case (?ref) if (ref != "") ref else "UA-KV-001";
        case null "UA-KV-001";
      };
      case null "UA-KV-001";
    };

    let weightKg : Float = switch (listing.packageDetails) {
      case null 0.5;
      case (?pkg) if (pkg.weight == 0) 0.5 else (pkg.weight.toFloat()) / 1000.0;
    };

    let seatsAmount : Nat = switch (listing.packageDetails) {
      case null 1;
      case (?pkg) if (pkg.places == 0) 1 else pkg.places;
    };

    let costUAH : Nat = do {
      let raw = listing.priceAmount / 10_000;
      if (raw < 100) 100 else raw
    };

    let description = ShippingLib.truncate(listing.title, 50);

    if (not hasMeestApiKey()) {
      let mockNum = ShippingLib.mockMeestTrackingNumber(nextSeed());
      trade.ttnNumber := ?mockNum;
      trade.ttnCreationStatus := #Success;
      return #ok(mockNum);
    };

    let apiKey = systemSettings.meestApiKey;
    let reqBody = ShippingLib.buildMeestTTNRequest(
      senderCityName,
      recipientCityName,
      senderPudoRef,
      weightKg,
      seatsAmount,
      description,
      costUAH,
    );

    // Attempt 1
    switch (await meestPost(ShippingLib.MEEST_SHIPMENT_URL, reqBody, apiKey)) {
      case (#ok(json)) {
        switch (ShippingLib.parseMeestWaybillResponse(json)) {
          case (?trackNum) {
            trade.ttnNumber := ?trackNum;
            trade.ttnCreationStatus := #Success;
            return #ok(trackNum);
          };
          case null {};
        };
      };
      case (#err(_)) {};
    };

    // Attempt 2
    switch (await meestPost(ShippingLib.MEEST_SHIPMENT_URL, reqBody, apiKey)) {
      case (#err(msg)) {
        trade.ttnCreationStatus := #Failed;
        #err(#invalid_input("Meest TTN creation failed after retry: " # msg))
      };
      case (#ok(json)) {
        switch (ShippingLib.parseMeestWaybillResponse(json)) {
          case (?trackNum) {
            trade.ttnNumber := ?trackNum;
            trade.ttnCreationStatus := #Success;
            #ok(trackNum)
          };
          case null {
            trade.ttnCreationStatus := #Failed;
            #err(#invalid_input("Meest TTN creation failed: could not parse response"))
          };
        };
      };
    };
  };

  /// Create a Meest TTN for a specific trade.
  /// Only the seller of the trade may call this.
  public shared ({ caller }) func createMeestTTN(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) { return #err(#unauthorized) };
    switch (await doCreateMeestTTN(tradeId)) {
      case (#err(e)) #err(e);
      case (#ok(ttn)) await finalizeTtnAndShip(tradeId, caller, ttn);
    }
  };

  /// Retry Meest TTN creation (resets status and tries again).
  /// Only the seller may call this.
  public shared ({ caller }) func retryMeestTTNCreation(tradeId : Types.TradeId) : async Types.Result<Text> {
    Auth.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) { return #err(#unauthorized) };
    trade.ttnCreationStatus := #Pending;
    trade.ttnNumber := null;
    await doCreateMeestTTN(tradeId)
  };

  // ─── Unified tracking cache ───────────────────────────────────────────────

  // TTL for unified tracking cache: 5 minutes in nanoseconds
  let UNIFIED_CACHE_TTL : Int = 300_000_000_000;

  // Cache key prefix for unified tracking results in shippingCache
  // Value stored as: "carrier|status|isDelivered(0/1)"
  func unifiedCacheKey(tradeId : Types.TradeId) : Text {
    "unified:" # debug_show(tradeId)
  };

  func appendTrackingEvent(
    tradeId : Types.TradeId,
    status  : Text,
    now     : Types.Timestamp,
  ) : [Types.TrackingTimelineEntry] {
    let entry : Types.TrackingTimelineEntry = { timestamp = now; status = status };
    let updated = switch (trackingTimelines.get(tradeId)) {
      case null {
        let hist = [entry];
        trackingTimelines.add(tradeId, hist);
        hist
      };
      case (?hist) {
        if (hist.size() == 0) {
          let next = [entry];
          trackingTimelines.add(tradeId, next);
          next
        } else {
          let last = hist[hist.size() - 1];
          if (last.status == status) hist else {
            let next = hist.concat([entry]);
            trackingTimelines.add(tradeId, next);
            next
          }
        }
      };
    };
    updated
  };

  // Map raw carrier status strings to canonical unified status values.
  func mapToUnifiedStatus(raw : Text) : Text {
    ShippingLib.mapToUnifiedStatus(raw)
  };

  /// Get unified tracking info for a trade regardless of carrier.
  /// Determines carrier from trade.shippingSelection.provider, calls the
  /// appropriate tracking function, maps status to canonical values,
  /// and caches results for 5 minutes using the shared shippingCache.
  /// Requires authentication — this is an update call (HTTPS outcalls are async).
  public shared ({ caller }) func getUnifiedTrackingInfo(tradeId : Types.TradeId) : async Types.Result<{
    carrier : Text;
    trackingNumber : Text;
    status : Text;
    statusHistory : [{ timestamp : Int; status : Text }];
    estimatedDelivery : ?Text;
    isDelivered : Bool;
  }> {
    Auth.assertNotAnonymous(caller);

    // Load trade
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    let isParticipant = Principal.equal(trade.buyer, caller)
      or Principal.equal(trade.seller, caller);
    if (not isParticipant) {
      return #err(#unauthorized);
    };

    // Must have a tracking number
    let trackingNumber = switch (trade.ttnNumber) {
      case null return #err(#not_found);
      case (?ttn) ttn;
    };

    // Determine carrier from shippingSelection or default to nova_poshta
    let carrier : Text = switch (trade.shippingSelection) {
      case null "nova_poshta";
      case (?sel) sel.provider;
    };

    // Check cache: stored as "carrier|status|isDelivered"
    let cacheKey = unifiedCacheKey(tradeId);
    let now = Types.now();
    switch (ShippingLib.getCachedTracking(shippingCache, cacheKey)) {
      case (?cached) {
        // Parse "carrier|status|0or1|timestamp"
        let parts = cached.split(#char '|');
        let partsArr = parts.toArray();
        if (partsArr.size() >= 3) {
          let cachedCarrier  = partsArr[0];
          let cachedStatus   = partsArr[1];
          let cachedDelivered = partsArr[2] == "1";
          let history = appendTrackingEvent(tradeId, cachedStatus, now);
          return #ok({
            carrier           = cachedCarrier;
            trackingNumber    = trackingNumber;
            status            = cachedStatus;
            statusHistory     = history;
            estimatedDelivery = null;
            isDelivered       = cachedDelivered;
          });
        };
      };
      case null {};
    };

    // Call appropriate carrier tracking function
    let rawStatusResult : { #ok : Text; #err : Text } = if (carrier == "ukrposhta") {
      await trackUkrPoshtaShipment(trackingNumber)
    } else if (carrier == "meest") {
      await trackMeestShipment(trackingNumber)
    } else {
      // Default to nova_poshta
      await trackShipment(trackingNumber)
    };

    switch (rawStatusResult) {
      case (#err(msg)) {
        #err(#invalid_input("Tracking failed: " # msg))
      };
      case (#ok(rawStatus)) {
        let unifiedStatus = mapToUnifiedStatus(rawStatus);
        let isDelivered = unifiedStatus == "delivered";
        let deliveredBit = if (isDelivered) "1" else "0";

        // Store in shared cache: "carrier|status|deliveredBit"
        ShippingLib.putCachedTracking(shippingCache, cacheKey, carrier # "|" # unifiedStatus # "|" # deliveredBit);

        let history = appendTrackingEvent(tradeId, unifiedStatus, now);
        if (ShippingLib.isNpDeliveredStatus(unifiedStatus)) {
          EscrowLib.recordNpDelivered(trade, now);
        };
        if (trade.status == #shipped) {
          trade.status := #awaiting_receipt;
        };
        #ok({
          carrier           = carrier;
          trackingNumber    = trackingNumber;
          status            = unifiedStatus;
          statusHistory     = history;
          estimatedDelivery = null;
          isDelivered       = isDelivered;
        })
      };
    };
  };

  /// Returns true if tracking says "delivered" AND the trade status allows confirmation.
  /// Caller must be authenticated (update call).
  public shared ({ caller }) func canConfirmDelivery(tradeId : Types.TradeId) : async Bool {
    Auth.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null return false;
      case (?t) t;
    };

    // Check trade status allows confirmation
    let statusOk = switch (trade.status) {
      case (#shipped or #awaiting_receipt or #fulfillment_pending or #payment_verified) true;
      case _ false;
    };
    if (not statusOk) return false;

    let isParticipant = Principal.equal(trade.buyer, caller)
      or Principal.equal(trade.seller, caller);
    if (not isParticipant) return false;

    // No TTN means no delivery confirmation
    switch (trade.ttnNumber) {
      case null return false;
      case (?_) {};
    };

    // Check cache first
    let cacheKey = unifiedCacheKey(tradeId);
    switch (ShippingLib.getCachedTracking(shippingCache, cacheKey)) {
      case (?cached) {
        let parts = cached.split(#char '|');
        let partsArr = parts.toArray();
        if (partsArr.size() >= 3) {
          return partsArr[2] == "1";
        };
      };
      case null {};
    };

    // Fall back to live tracking call
    switch (await getUnifiedTrackingInfo(tradeId)) {
      case (#ok(info)) info.isDelivered;
      case (#err(_)) false;
    };
  };

  // ─── Mark shipped with TTN validation (E7.S3) ─────────────────────────────

  /// Seller submits a Nova Poshta TTN. Invalid format or carrier rejection
  /// keeps the trade in fulfillment_pending.
  public shared ({ caller }) func markShipped(
    tradeId : Types.TradeId,
    ttn     : Text,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (not Principal.equal(trade.seller, caller)) {
      return #err(#unauthorized);
    };

    if (not ShippingLib.isValidNpTtnFormat(ttn)) {
      return #err(#invalid_input("Invalid Nova Poshta TTN format"));
    };

    let carrierAccepted = if (not hasNpApiKey()) {
      true
    } else {
      let apiKey = resolveNpApiKey();
      let reqBody = ShippingLib.buildTrackingRequest(apiKey, ttn);
      switch (await npPost(reqBody)) {
        case (#err(_)) false;
        case (#ok(json)) ShippingLib.carrierAcceptsTtn(json);
      };
    };

    if (not carrierAccepted) {
      return #err(#invalid_input("Nova Poshta did not accept this TTN"));
    };

    switch (EscrowLib.markShipped(trades, caller, tradeId, ttn)) {
      case (#ok(_)) #ok(());
      case (#err(e)) #err(e);
    };
  };

}
