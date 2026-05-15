import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Map "mo:core/Map";
import List "mo:core/List";
import Option "mo:core/Option";
import Time "mo:core/Time";
import Types "../types";

/// Shipping — JSON builders, response parsers, cache helpers.
/// All functions are pure (no side effects) — state is injected by mixins.
module {

  // ─── Nova Poshta API constants ────────────────────────────────────────────

  public let NP_API_URL : Text = "https://api.novaposhta.ua/v2.0/json/";
  /// Used when no real API key is configured — test mode.
  public let NP_PLACEHOLDER_API_KEY : Text = "your_test_api_key_here";
  /// Cache TTL: 5 minutes in nanoseconds
  public let CACHE_TTL_NS : Int = 300_000_000_000;

  // ─── Ukrposhta API constants ──────────────────────────────────────────────

  public let UP_COST_URL     : Text = "https://www.ukrposhta.ua/ecom/0.0.1/addresses/shipping-price";
  public let UP_SHIPMENT_URL : Text = "https://www.ukrposhta.ua/ecom/0.0.1/shipments";
  /// Tracking URL template — append /{barcode}/statuses
  public let UP_TRACK_BASE   : Text = "https://www.ukrposhta.ua/ecom/0.0.1/shipments";

  // ─── Meest Express API constants ──────────────────────────────────────────

  public let MEEST_COST_URL     : Text = "https://api.meest.com/api/v1/calculate";
  public let MEEST_SHIPMENT_URL : Text = "https://api.meest.com/api/v1/order";
  /// Tracking URL template — append /{tracking_number}
  public let MEEST_TRACK_BASE   : Text = "https://api.meest.com/api/v1/order";

  // Escapes user-supplied strings for safe JSON embedding
  public func escapeJsonString(s : Text) : Text {
    var result = s;
    result := result.replace(#text "\\",  "\\\\");
    result := result.replace(#text "\"",  "\\\"");
    result := result.replace(#text "\n",  "\\n");
    result := result.replace(#text "\r",  "\\r");
    result := result.replace(#text "\t",  "\\t");
    result
  };

  // ─── Service type helper ──────────────────────────────────────────────────

  func serviceTypeText(st : Types.ShippingServiceType) : Text {
    switch st {
      case (#standard) "WarehouseWarehouse";
      case (#express)  "WarehouseWarehouse"; // express uses same method, differ by CargoType
    };
  };

  // ─── Nova Poshta request builders ────────────────────────────────────────

  /// Build JSON body for Nova Poshta cost calculation (getDocumentPrice).
  public func buildCostRequest(
    apiKey        : Text,
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    serviceType   : Types.ShippingServiceType,
  ) : Text {
    let weightStr = weightKg.toText();
    let serviceStr = serviceTypeText(serviceType);
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"InternetDocument\"," #
    "\"calledMethod\":\"getDocumentPrice\"," #
    "\"methodProperties\":{" #
      "\"CitySender\":\"" # escapeJsonString(senderCity) # "\"," #
      "\"CityRecipient\":\"" # escapeJsonString(recipientCity) # "\"," #
      "\"Weight\":\"" # weightStr # "\"," #
      "\"ServiceType\":\"" # serviceStr # "\"," #
      "\"Cost\":\"0\"," #
      "\"CargoType\":\"Cargo\"," #
      "\"SeatsAmount\":\"1\"" #
    "}}"
  };

  /// Build JSON body for Nova Poshta tracking (getStatusDocuments).
  public func buildTrackingRequest(
    apiKey         : Text,
    trackingNumber : Text,
  ) : Text {
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"TrackingDocument\"," #
    "\"calledMethod\":\"getStatusDocuments\"," #
    "\"methodProperties\":{" #
      "\"Documents\":[{\"DocumentNumber\":\"" # escapeJsonString(trackingNumber) # "\",\"Phone\":\"\"}]" #
    "}}"
  };

  /// Build JSON body for Nova Poshta waybill creation (save).
  public func buildWaybillRequest(
    apiKey        : Text,
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
    serviceType   : Types.ShippingServiceType,
  ) : Text {
    let weightStr = weightKg.toText();
    let costStr = cost.toText();
    let serviceStr = serviceTypeText(serviceType);
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"InternetDocument\"," #
    "\"calledMethod\":\"save\"," #
    "\"methodProperties\":{" #
      "\"CitySender\":\"" # escapeJsonString(senderCity) # "\"," #
      "\"CityRecipient\":\"" # escapeJsonString(recipientCity) # "\"," #
      "\"Weight\":\"" # weightStr # "\"," #
      "\"ServiceType\":\"" # serviceStr # "\"," #
      "\"Cost\":\"" # costStr # "\"," #
      "\"CargoType\":\"Cargo\"," #
      "\"Description\":\"" # escapeJsonString(description) # "\"," #
      "\"SeatsAmount\":\"1\"," #
      "\"PayerType\":\"Sender\"," #
      "\"PaymentMethod\":\"Cash\"" #
    "}}"
  };

  // ─── Ukrposhta address classifier API constants ───────────────────────────

  /// Ukrposhta Address Classifier API — returns offices / post-offices.
  public let UP_OFFICE_URL : Text = "https://www.ukrposhta.ua/address-classifier-ws/get_postoffices_by_city_name";

  // ─── Meest Express PUDO API constants ────────────────────────────────────

  public let MEEST_PUDO_URL : Text = "https://api.meest.com/api/v1/divisions";

  // ─── Ukrposhta request builders ───────────────────────────────────────────

  /// Build query string for Ukrposhta office lookup by city name.
  /// Returns URL to append as GET request (city_name query param).
  public func buildUkrposhtaOfficesRequest(cityName : Text, searchString : ?Text) : Text {
    let search = switch searchString { case (?s) "&name=" # s; case null "" };
    UP_OFFICE_URL # "?city_name=" # cityName # search
  };

  /// Build JSON body for Ukrposhta shipping price calculation.
  public func buildUpCostRequest(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
  ) : Text {
    let weightGrams = (weightKg * 1000.0).toInt().toNat().toText();
    "{" #
      "\"addressFrom\":{\"city\":\"" # escapeJsonString(senderCity) # "\"}," #
      "\"addressTo\":{\"city\":\"" # escapeJsonString(recipientCity) # "\"}," #
      "\"deliveryType\":\"W2W\"," #
      "\"weight\":" # weightGrams #
    "}"
  };

  /// Build JSON body for Ukrposhta shipment (waybill) creation.
  public func buildUpWaybillRequest(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
  ) : Text {
    let weightGrams = (weightKg * 1000.0).toInt().toNat().toText();
    let costStr = cost.toText();
    "{" #
      "\"sender\":{\"city\":\"" # escapeJsonString(senderCity) # "\"}," #
      "\"recipient\":{\"city\":\"" # escapeJsonString(recipientCity) # "\"}," #
      "\"deliveryType\":\"W2W\"," #
      "\"weight\":" # weightGrams # "," #
      "\"declaredValue\":" # costStr # "," #
      "\"description\":\"" # escapeJsonString(description) # "\"," #
      "\"postProductType\":\"STANDARD\"" #
    "}"
  };

  /// Build JSON body for Ukrposhta trade-scoped TTN creation.
  /// senderOfficeRef is the 5-digit Ukrposhta post code (e.g. "01001").
  public func buildUpTTNRequest(
    senderCity       : Text,
    recipientCity    : Text,
    senderOfficeRef  : Text,
    weightKg         : Float,
    seatsAmount      : Nat,
    description      : Text,
    costUAH          : Nat,
  ) : Text {
    let weightGrams = (weightKg * 1000.0).toInt().toNat().toText();
    let costStr = costUAH.toText();
    let seatsStr = seatsAmount.toText();
    "{" #
      "\"sender\":{\"city\":\"" # escapeJsonString(senderCity) # "\",\"postCode\":\"" # escapeJsonString(senderOfficeRef) # "\"}," #
      "\"recipient\":{\"city\":\"" # escapeJsonString(recipientCity) # "\"}," #
      "\"deliveryType\":\"W2W\"," #
      "\"weight\":" # weightGrams # "," #
      "\"length\":30," #
      "\"width\":20," #
      "\"height\":15," #
      "\"declaredValue\":" # costStr # "," #
      "\"description\":\"" # escapeJsonString(description) # "\"," #
      "\"postProductType\":\"STANDARD\"," #
      "\"parcels\":" # seatsStr #
    "}"
  };

  // ─── Meest Express request builders ──────────────────────────────────────

  /// Build JSON body for Meest PUDO / divisions lookup.
  public func buildMeestPUDOsRequest(cityName : Text, searchString : ?Text) : Text {
    let search = switch searchString { case (?s) s; case null "" };
    "{" #
      "\"city\":\"" # escapeJsonString(cityName) # "\"," #
      "\"search\":\"" # escapeJsonString(search) # "\"" #
    "}"
  };

  /// Build JSON body for Meest Express cost calculation.
  public func buildMeestCostRequest(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
  ) : Text {
    let weightStr = weightKg.toText();
    "{" #
      "\"from_city\":\"" # escapeJsonString(senderCity) # "\"," #
      "\"to_city\":\"" # escapeJsonString(recipientCity) # "\"," #
      "\"weight\":" # weightStr # "," #
      "\"width\":0.2,\"height\":0.2,\"length\":0.3" #
    "}"
  };

  /// Build JSON body for Meest Express order (waybill) creation.
  public func buildMeestWaybillRequest(
    senderCity    : Text,
    recipientCity : Text,
    weightKg      : Float,
    description   : Text,
    cost          : Nat,
  ) : Text {
    let weightStr = weightKg.toText();
    let costStr = cost.toText();
    "{" #
      "\"sender_city\":\"" # escapeJsonString(senderCity) # "\"," #
      "\"recipient_city\":\"" # escapeJsonString(recipientCity) # "\"," #
      "\"weight\":" # weightStr # "," #
      "\"declared_value\":" # costStr # "," #
      "\"description\":\"" # escapeJsonString(description) # "\"," #
      "\"service_type\":\"standard\"" #
    "}"
  };

  /// Build JSON body for Meest trade-scoped TTN creation.
  /// senderPudoRef is the PUDO id, e.g. "UA-KV-001".
  public func buildMeestTTNRequest(
    senderCity    : Text,
    recipientCity : Text,
    senderPudoRef : Text,
    weightKg      : Float,
    seatsAmount   : Nat,
    description   : Text,
    costUAH       : Nat,
  ) : Text {
    let weightStr = weightKg.toText();
    let costStr = costUAH.toText();
    let seatsStr = seatsAmount.toText();
    "{" #
      "\"sender_city\":\"" # escapeJsonString(senderCity) # "\"," #
      "\"recipient_city\":\"" # escapeJsonString(recipientCity) # "\"," #
      "\"sender_pudo_id\":\"" # escapeJsonString(senderPudoRef) # "\"," #
      "\"weight\":" # weightStr # "," #
      "\"declared_value\":" # costStr # "," #
      "\"description\":\"" # escapeJsonString(description) # "\"," #
      "\"parcels\":" # seatsStr # "," #
      "\"service_type\":\"standard\"" #
    "}"
  };

  // ─── Minimal JSON text extraction helpers ────────────────────────────────

  /// Extract the value of a JSON string field: "fieldName":"<value>"
  /// Returns null if field not found. Very minimal — works for flat string fields.
  public func extractJsonField(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\":\"";
    let parts = json.split(#text needle);
    var firstSeen = false;
    for (part in parts) {
      if (firstSeen) {
        // part starts after the opening quote of the value
        let valueParts = part.split(#text "\"");
        var inner : ?Text = null;
        for (vp in valueParts) {
          if (inner == null) { inner := ?vp };
        };
        return inner;
      };
      firstSeen := true;
    };
    null
  };

  /// Extract a numeric JSON field: "fieldName":<number>
  public func extractJsonNumber(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\":";
    let parts = json.split(#text needle);
    var firstSeen = false;
    for (part in parts) {
      if (firstSeen) {
        // collect digits (and dot for float) until non-numeric char
        var result = "";
        var done = false;
        for (ch in part.toIter()) {
          if (not done) {
            if ((ch >= '0' and ch <= '9') or ch == '.') {
              result := result # Text.fromChar(ch);
            } else {
              done := true;
            };
          };
        };
        if (result != "") return ?result;
      };
      firstSeen := true;
    };
    null
  };

  /// Checks whether the Nova Poshta response signals success.
  /// NP responses contain "\"success\":true" on success.
  public func isSuccess(json : Text) : Bool {
    json.contains(#text "\"success\":true")
  };

  // ─── Nova Poshta response parsers ────────────────────────────────────────

  /// Parse Nova Poshta getDocumentPrice response.
  /// Returns (costUAH, transitDays) on success.
  public func parseNovaPoshtaCostResponse(json : Text) : ?{ costUAH : Nat; transitDays : Nat } {
    if (not isSuccess(json)) return null;
    let costOpt = extractJsonNumber(json, "Cost");
    let _daysOpt = extractJsonNumber(json, "EstimatedDeliveryDate");
    // EstimatedDeliveryDate is a date string, not days. Use DeliveryDate or fallback to 3
    let transitDays : Nat = switch (extractJsonNumber(json, "DeliveryDate")) {
      case (?d) { switch (Nat.fromText(d)) { case (?n) n; case null 3 } };
      case null 3;
    };
    switch (costOpt) {
      case (?costStr) {
        // Cost is a float like "45.00" — take integer part
        let intPart = switch (costStr.split(#char '.').next()) {
          case (?t) t;
          case null costStr;
        };
        switch (Nat.fromText(intPart)) {
          case (?cost) ?{ costUAH = cost; transitDays = transitDays };
          case null null;
        };
      };
      case null null;
    };
  };

  /// Parse Nova Poshta getStatusDocuments response.
  /// Returns a human-readable status string.
  public func parseNovaPoshtaTrackingResponse(json : Text) : ?Text {
    if (not isSuccess(json)) {
      // Return error description if present
      return switch (extractJsonField(json, "errorDescription")) {
        case (?err) ?("Error: " # err);
        case null null;
      };
    };
    // StatusDescription is the most human-readable field
    switch (extractJsonField(json, "StatusDescription")) {
      case (?s) ?s;
      case null {
        switch (extractJsonField(json, "Status")) {
          case (?s) ?s;
          case null null;
        };
      };
    };
  };

  /// Parse Nova Poshta save (create waybill) response.
  /// Returns the tracking number (IntDocNumber).
  public func parseNovaPoshtaWaybillResponse(json : Text) : ?Text {
    if (not isSuccess(json)) return null;
    extractJsonField(json, "IntDocNumber")
  };

  // ─── Ukrposhta response parsers ───────────────────────────────────────────

  /// Parse Ukrposhta shipping-price response.
  /// Returns (costUAH, transitDays) — field names: "deliveryPrice", "deliveryDays".
  public func parseUpCostResponse(json : Text) : ?{ costUAH : Nat; transitDays : Nat } {
    let costOpt = extractJsonNumber(json, "deliveryPrice");
    let daysOpt = extractJsonNumber(json, "deliveryDays");
    switch (costOpt) {
      case (?costStr) {
        let intPart = switch (costStr.split(#char '.').next()) {
          case (?t) t;
          case null costStr;
        };
        switch (Nat.fromText(intPart)) {
          case (?cost) {
            let days : Nat = switch (daysOpt) {
              case (?d) { switch (Nat.fromText(d)) { case (?n) n; case null 5 } };
              case null 5;
            };
            ?{ costUAH = cost; transitDays = days };
          };
          case null null;
        };
      };
      case null null;
    };
  };

  /// Parse Ukrposhta shipment creation response.
  /// Returns the barcode (tracking number) — field: "barcode".
  public func parseUpWaybillResponse(json : Text) : ?Text {
    extractJsonField(json, "barcode")
  };

  /// Parse Ukrposhta tracking statuses response.
  /// Returns the last status description — field: "eventName".
  public func parseUpTrackingResponse(json : Text) : ?Text {
    switch (extractJsonField(json, "eventName")) {
      case (?s) ?s;
      case null {
        switch (extractJsonField(json, "status")) {
          case (?s) ?s;
          case null null;
        };
      };
    };
  };

  /// Parse Ukrposhta Address Classifier office list response.
  /// Expected JSON: [{...,"POSTCODE":"01001","NAME":"...", "STREET_UA":"..."}]
  /// Returns array of {index, name, address} records.
  public func parseUkrposhtaOfficesResponse(
    json  : Text,
    limit : Nat,
  ) : [{ index : Text; name : Text; address : Text }] {
    // Each office entry is bounded by occurrences of "POSTCODE" field.
    let chunks = json.split(#text "\"POSTCODE\":\"");
    let results = List.empty<{ index : Text; name : Text; address : Text }>();
    var first = true;
    for (chunk in chunks) {
      if (first) { first := false }
      else if (results.size() < limit) {
        let indexOpt : ?Text = switch (chunk.split(#text "\"").next()) {
          case (?r) ?r;
          case null null;
        };
        switch (indexOpt) {
          case null {};
          case (?idx) {
            let name    = extractJsonField(chunk, "NAME").get("");
            let street  = extractJsonField(chunk, "STREET_UA").get("");
            let houseNo = extractJsonField(chunk, "HOUSENUMBER").get("");
            let address = if (houseNo == "") street else street # ", " # houseNo;
            results.add({ index = idx; name; address });
          };
        };
      };
    };
    results.toArray()
  };

  /// Parse Meest PUDO / divisions response.
  /// Expected JSON: [{..."id":"UA001","name":"...","address":"...","division_type":"PUDO"}]
  public func parseMeestPUDOsResponse(
    json  : Text,
    limit : Nat,
  ) : [{ id : Text; name : Text; address : Text; type_ : Text }] {
    // Each entry bounded by occurrences of the "id" field.
    let chunks = json.split(#text "\"id\":\"");
    let results = List.empty<{ id : Text; name : Text; address : Text; type_ : Text }>();
    var first = true;
    for (chunk in chunks) {
      if (first) { first := false }
      else if (results.size() < limit) {
        let idOpt : ?Text = switch (chunk.split(#text "\"").next()) {
          case (?r) ?r;
          case null null;
        };
        switch (idOpt) {
          case null {};
          case (?id_) {
            let name    = extractJsonField(chunk, "name").get("");
            let address = extractJsonField(chunk, "address").get("");
            let divType = switch (extractJsonField(chunk, "division_type")) {
              case (?t) t;
              case null extractJsonField(chunk, "type").get("PUDO");
            };
            results.add({ id = id_; name; address; type_ = divType });
          };
        };
      };
    };
    results.toArray()
  };

  // ─── Meest Express response parsers ──────────────────────────────────────

  /// Parse Meest Express calculate response.
  /// Returns (costUAH, transitDays) — fields: "price", "delivery_days".
  public func parseMeestCostResponse(json : Text) : ?{ costUAH : Nat; transitDays : Nat } {
    let costOpt = extractJsonNumber(json, "price");
    let daysOpt = extractJsonNumber(json, "delivery_days");
    switch (costOpt) {
      case (?costStr) {
        let intPart = switch (costStr.split(#char '.').next()) {
          case (?t) t;
          case null costStr;
        };
        switch (Nat.fromText(intPart)) {
          case (?cost) {
            let days : Nat = switch (daysOpt) {
              case (?d) { switch (Nat.fromText(d)) { case (?n) n; case null 4 } };
              case null 4;
            };
            ?{ costUAH = cost; transitDays = days };
          };
          case null null;
        };
      };
      case null null;
    };
  };

  /// Parse Meest Express order creation response.
  /// Returns the tracking number — field: "tracking_number".
  public func parseMeestWaybillResponse(json : Text) : ?Text {
    switch (extractJsonField(json, "tracking_number")) {
      case (?t) ?t;
      case null extractJsonField(json, "order_id");
    };
  };

  /// Parse Meest Express order tracking response.
  /// Returns current status — field: "status".
  public func parseMeestTrackingResponse(json : Text) : ?Text {
    switch (extractJsonField(json, "status_description")) {
      case (?s) ?s;
      case null extractJsonField(json, "status");
    };
  };

  // ─── Mock responses (when no API key is configured) ──────────────────────

  /// Returns a realistic mock cost response when no API key is configured.
  public func mockCostResponse(weightKg : Float, serviceType : Types.ShippingServiceType) : { costUAH : Nat; transitDays : Nat } {
    let base : Nat = 65;
    let perKg : Nat = 8;
    let weightInt : Nat = weightKg.toInt().toNat();
    let cost = base + perKg * weightInt;
    let days : Nat = switch serviceType { case (#express) 1; case (#standard) 3 };
    { costUAH = cost; transitDays = days };
  };

  /// Mock cost response for Ukrposhta.
  public func mockUpCostResponse(weightKg : Float) : { costUAH : Nat; transitDays : Nat } {
    let base : Nat = 45;
    let perKg : Nat = 6;
    let weightInt : Nat = weightKg.toInt().toNat();
    { costUAH = base + perKg * weightInt; transitDays = 5 };
  };

  /// Mock cost response for Meest Express.
  public func mockMeestCostResponse(weightKg : Float) : { costUAH : Nat; transitDays : Nat } {
    let base : Nat = 55;
    let perKg : Nat = 7;
    let weightInt : Nat = weightKg.toInt().toNat();
    { costUAH = base + perKg * weightInt; transitDays = 4 };
  };

  /// Returns a mock tracking status for demo purposes.
  public func mockTrackingStatus() : Text {
    "Відправлення прямує до міста одержувача"
  };

  /// Returns a mock waybill/tracking number.
  public func mockTrackingNumber(seed : Nat) : Text {
    "59" # seed.toText()
  };

  /// Mock Ukrposhta barcode.
  public func mockUpBarcode(seed : Nat) : Text {
    "UA" # seed.toText()
  };

  /// Mock Meest tracking number.
  public func mockMeestTrackingNumber(seed : Nat) : Text {
    "ME" # seed.toText()
  };

  /// Mock Ukrposhta offices for test mode (no API key configured).
  public func mockUpOffices() : [{ index : Text; name : Text; address : Text }] {
    [
      { index = "01001"; name = "Відділення Укрпошти №1 (Київ-1)";       address = "вул. Хрещатик, 22, Київ" },
      { index = "01004"; name = "Відділення Укрпошти №4 (Київ-4)";       address = "бул. Тараса Шевченка, 2, Київ" },
      { index = "01010"; name = "Відділення Укрпошти №10 (Київ-10)";     address = "вул. Лесі Українки, 30, Київ" },
    ]
  };

  /// Mock Meest PUDOs for test mode (no API key configured).
  public func mockMeestPUDOs() : [{ id : Text; name : Text; address : Text; type_ : Text }] {
    [
      { id = "UA-KV-001"; name = "Meest — Хрещатик";    address = "вул. Хрещатик, 14, Київ";         type_ = "PUDO" },
      { id = "UA-KV-002"; name = "Meest — Поділ";       address = "вул. Сагайдачного, 8, Київ";      type_ = "PUDO" },
      { id = "UA-KV-003"; name = "Meest — Оболонь";     address = "проспект Оболонський, 27, Київ";   type_ = "PUDO" },
    ]
  };

  // ─── Cache helpers ────────────────────────────────────────────────────────

  /// Check if a cache entry (value, storedAt) is still fresh.
  public func isCacheFresh(storedAt : Types.Timestamp) : Bool {
    let now = Time.now();
    (now - storedAt) < CACHE_TTL_NS
  };

  /// Look up a cached tracking result; returns null if missing or stale.
  public func getCachedTracking(
    cache          : Map.Map<Text, (Text, Types.Timestamp)>,
    trackingNumber : Text,
  ) : ?Text {
    switch (cache.get(trackingNumber)) {
      case (?(status, storedAt)) {
        if (isCacheFresh(storedAt)) ?status else null;
      };
      case null null;
    };
  };

  /// Store a tracking result in the cache with current timestamp.
  public func putCachedTracking(
    cache          : Map.Map<Text, (Text, Types.Timestamp)>,
    trackingNumber : Text,
    status         : Text,
  ) : () {
    cache.add(trackingNumber, (status, Time.now()));
  };

  // ─── Nova Poshta branch / city / TTN request builders ───────────────────

  /// Build JSON body for Nova Poshta Address.getWarehouses.
  public func buildGetWarehousesRequest(
    apiKey       : Text,
    cityName     : Text,
    searchString : Text,
    limit        : Nat,
  ) : Text {
    let limitStr = limit.toText();
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"Address\"," #
    "\"calledMethod\":\"getWarehouses\"," #
    "\"methodProperties\":{" #
      "\"CityName\":\"" # escapeJsonString(cityName) # "\"," #
      "\"FindByString\":\"" # escapeJsonString(searchString) # "\"," #
      "\"Limit\":\"" # limitStr # "\"," #
      "\"Language\":\"UK\"" #
    "}}"
  };

  /// Build JSON body for Nova Poshta Address.getCities.
  public func buildGetCitiesRequest(apiKey : Text, cityName : Text) : Text {
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"Address\"," #
    "\"calledMethod\":\"getCities\"," #
    "\"methodProperties\":{" #
      "\"FindByString\":\"" # escapeJsonString(cityName) # "\"," #
      "\"Limit\":1" #
    "}}"
  };

  /// Build JSON body for Nova Poshta InternetDocument.save (TTN creation).
  public func buildTTNRequest(
    apiKey           : Text,
    senderCityRef    : Text,
    recipientCityRef : Text,
    senderBranchRef  : Text,
    recipientBranchRef : Text,
    weightKg         : Float,
    seatsAmount      : Nat,
    description      : Text,
    cost             : Nat,
    dateStr          : Text,
  ) : Text {
    let weightStr = weightKg.toText();
    let seatsStr  = seatsAmount.toText();
    let costStr   = cost.toText();
    "{\"apiKey\":\"" # apiKey # "\"," #
    "\"modelName\":\"InternetDocument\"," #
    "\"calledMethod\":\"save\"," #
    "\"methodProperties\":{" #
      "\"PayerType\":\"Recipient\"," #
      "\"PaymentMethod\":\"Cash\"," #
      "\"DateTime\":\"" # dateStr # "\"," #
      "\"CargoType\":\"Parcel\"," #
      "\"Weight\":\"" # weightStr # "\"," #
      "\"ServiceType\":\"WarehouseWarehouse\"," #
      "\"SeatsAmount\":\"" # seatsStr # "\"," #
      "\"Description\":\"" # escapeJsonString(description) # "\"," #
      "\"Cost\":\"" # costStr # "\"," #
      "\"CitySender\":\"" # escapeJsonString(senderCityRef) # "\"," #
      "\"CityRecipient\":\"" # escapeJsonString(recipientCityRef) # "\"," #
      "\"SenderAddress\":\"" # escapeJsonString(senderBranchRef) # "\"," #
      "\"RecipientAddress\":\"" # escapeJsonString(recipientBranchRef) # "\"," #
      "\"SendersPhone\":\"0800000000\"," #
      "\"RecipientsPhone\":\"0800000000\"," #
      "\"NewAddress\":1" #
    "}}"
  };

  // ─── Nova Poshta branch / city / TTN response parsers ────────────────────

  /// Parse Nova Poshta Address.getWarehouses response.
  /// Extracts an array of branch records from the "data" array in the JSON.
  /// Uses minimal text scanning — finds repeated occurrences of "Ref" field.
  public func parseNovaPoshtaBranchesResponse(json : Text, limit : Nat) : [Types.NovaPoshtaBranch] {
    if (not isSuccess(json)) return [];
    // Split on each object boundary using "\"Ref\":\"" as anchor.
    // For each chunk, extract Ref, Description (name), ShortAddress, CityRef, ScheduleDay.
    let chunks = json.split(#text "\"Ref\":\"");
    let results = List.empty<Types.NovaPoshtaBranch>();
    var first = true;
    for (chunk in chunks) {
      if (first) { first := false }
      else if (results.size() < limit) {
        // chunk starts at the value of Ref
        let refOpt : ?Text = switch (chunk.split(#text "\"").next()) {
          case (?r) ?r;
          case null null;
        };
        switch (refOpt) {
          case null {};
          case (?ref) {
            let name    = extractJsonField(chunk, "Description").get("");
            let address = extractJsonField(chunk, "ShortAddress").get("");
            let cityRef = extractJsonField(chunk, "CityRef").get("");
            let sched   = extractJsonField(chunk, "ScheduleDay");
            results.add({
              ref      = ref;
              name     = name;
              address  = address;
              cityRef  = cityRef;
              schedule = sched;
            });
          };
        };
      };
    };
    results.toArray()
  };

  /// Parse Nova Poshta Address.getCities response — returns first Ref.
  public func parseNovaPoshtaCityRefResponse(json : Text) : ?Text {
    if (not isSuccess(json)) return null;
    extractJsonField(json, "Ref")
  };

  /// Parse Nova Poshta InternetDocument.save response — returns TTN number.
  public func parseTTNResponse(json : Text) : ?Text {
    if (not isSuccess(json)) return null;
    switch (extractJsonField(json, "IntDocNumber")) {
      case (?n) ?n;
      case null extractJsonField(json, "Ref");
    };
  };

  // ─── Mock Nova Poshta branches ────────────────────────────────────────────

  /// Returns mock Nova Poshta branches for test mode (no API key configured).
  public func mockNpBranches() : [Types.NovaPoshtaBranch] {
    [
      {
        ref      = "1ec09d88-e1c2-11e3-8c4a-0050568002cf";
        name     = "Відділення №1 (до 30 кг)";
        address  = "вул. Хрещатик, 1";
        cityRef  = "8d5a980d-391c-11dd-90d9-001a92567626";
        schedule = ?"Пн-Пт: 09:00-20:00, Сб: 09:00-18:00, Нд: 10:00-16:00";
      },
      {
        ref      = "2a928e07-e1c2-11e3-8c4a-0050568002cf";
        name     = "Відділення №2 (до 30 кг)";
        address  = "вул. Хрещатик, 22";
        cityRef  = "8d5a980d-391c-11dd-90d9-001a92567626";
        schedule = ?"Пн-Пт: 08:00-20:00, Сб: 09:00-17:00";
      },
      {
        ref      = "3fa2b7a1-e1c2-11e3-8c4a-0050568002cf";
        name     = "Відділення №3 (до 30 кг)";
        address  = "пр. Перемоги, 50";
        cityRef  = "8d5a980d-391c-11dd-90d9-001a92567626";
        schedule = ?"Пн-Нд: 08:00-21:00";
      },
      {
        ref      = "4b3c81d5-e1c2-11e3-8c4a-0050568002cf";
        name     = "Поштомат №101";
        address  = "вул. Басейна, 12";
        cityRef  = "8d5a980d-391c-11dd-90d9-001a92567626";
        schedule = ?"Цілодобово";
      },
      {
        ref      = "5d8e92f3-e1c2-11e3-8c4a-0050568002cf";
        name     = "Відділення №5 (до 30 кг)";
        address  = "вул. Саксаганського, 15";
        cityRef  = "8d5a980d-391c-11dd-90d9-001a92567626";
        schedule = ?"Пн-Пт: 09:00-19:00, Сб-Нд: 10:00-16:00";
      },
    ]
  };

  /// Mock city ref for Kyiv — used when no API key is configured.
  public let MOCK_KYIV_CITY_REF : Text = "8d5a980d-391c-11dd-90d9-001a92567626";

  /// Mock sender branch ref — first mock branch.
  public let MOCK_SENDER_BRANCH_REF : Text = "1ec09d88-e1c2-11e3-8c4a-0050568002cf";

  /// Truncate a text to at most `max` characters.
  public func truncate(t : Text, max : Nat) : Text {
    if (t.size() <= max) t
    else {
      var result = "";
      var count = 0;
      label build for (ch in t.toIter()) {
        if (count >= max) break build;
        result := result # Text.fromChar(ch);
        count += 1;
      };
      result
    }
  };

  /// Format today's date as DD.MM.YYYY from a Unix-nanosecond timestamp.
  /// Uses simple integer arithmetic — no external date library needed.
  public func formatDateDDMMYYYY(nowNs : Int) : Text {
    // Convert nanoseconds to seconds
    let secs : Int = nowNs / 1_000_000_000;
    // Days since Unix epoch (1970-01-01)
    let days : Int = secs / 86400;
    // Use a simple proleptic Gregorian calculation
    var z : Int = days + 719468;
    let era : Int = if (z >= 0) z / 146097 else (z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y   : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp  : Int = (5 * doy + 2) / 153;
    let d   : Int = doy - (153 * mp + 2) / 5 + 1;
    let m   : Int = if (mp < 10) mp + 3 else mp - 9;
    let yr  : Int = if (m <= 2) y + 1 else y;
    let dd  = if (d < 10) "0" # d.toText() else d.toText();
    let mm  = if (m < 10) "0" # m.toText() else m.toText();
    dd # "." # mm # "." # yr.toText()
  };

  // ─── Carrier metadata ─────────────────────────────────────────────────────

  public type CarrierInfo = {
    carrier     : Types.ShippingCarrier;
    displayName : Text;
    description : Text;
  };

  public func supportedCarriers() : [CarrierInfo] {
    [
      { carrier = #nova_poshta; displayName = "Нова Пошта";       description = "Стандартна і експрес доставка по Україні" },
      { carrier = #ukrposhta;   displayName = "Укрпошта";         description = "Державна поштова служба України" },
      { carrier = #meest;       displayName = "Meest Express";    description = "Кур'єрська доставка Meest" },
      { carrier = #self_pickup; displayName = "Самовивіз";        description = "Покупець забирає особисто" },
      { carrier = #digital;     displayName = "Цифрова доставка"; description = "Онлайн-передача файлів або кодів" },
    ]
  };
}
