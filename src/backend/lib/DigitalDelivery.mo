import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types";
import DigitalEncryption "../lib/DigitalEncryption";

/// Digital file upload metadata, auto-delivery, and download gates (E2.S11 / FR-52).
module {

  /// 500 MiB beta cap.
  public let MAX_FILE_BYTES : Nat = 524_288_000;

  /// 24 hours in nanoseconds — inspection window anchor (E7.S2 uses deliveryRecordAt).
  public let INSPECTION_PERIOD_NS : Nat = 86_400_000_000_000;

  /// Inspection deadline = deliveryRecordAt + 24h (D-029). Never derived from first download.
  public func inspectionDeadlineFrom(deliveryRecordAt : Types.Timestamp) : Types.Timestamp {
    deliveryRecordAt + INSPECTION_PERIOD_NS
  };

  /// Stable deadline for reads and upgrade resume (W2-12).
  public func resolveInspectionDeadline(dd : Types.DigitalDelivery) : Types.Timestamp {
    switch (dd.inspectionDeadline) {
      case (?d) d;
      case null inspectionDeadlineFrom(dd.deliveryRecordAt);
    }
  };

  /// Persist deadline when missing (canister upgrade mid-inspection).
  public func ensureInspectionDeadline(dd : Types.DigitalDelivery) : Types.Timestamp {
    let deadline = resolveInspectionDeadline(dd);
    switch (dd.inspectionDeadline) {
      case (?_) {};
      case null { dd.inspectionDeadline := ?deadline };
    };
    deadline
  };

  /// Records a redownload — updates revealedAt only; never resets inspection clock (D-030).
  public func touchRedownload(dd : Types.DigitalDelivery, now : Types.Timestamp) : () {
    dd.revealedAt := ?now;
  };

  func mimeAllowed(mime : Text) : Bool {
    mime == "application/pdf"
      or mime == "application/zip"
      or mime == "application/x-zip-compressed"
      or mime == "image/png"
      or mime == "image/jpeg"
      or mime == "image/jpg"
      or mime == "application/epub+zip"
      or mime == "video/mp4"
  };

  public func validateMime(mime : Text) : ?Types.Error {
    if (mime.size() == 0) {
      return ?#invalid_input("MIME type is required for digital files");
    };
    if (not mimeAllowed(mime)) {
      return ?#invalid_input(
        "Unsupported file type. Allowed: pdf, zip, png, jpg, epub, mp4 (max 500MB)"
      );
    };
    null
  };

  public func validateSize(sizeBytes : Nat) : ?Types.Error {
    if (sizeBytes == 0) {
      return ?#invalid_input("File size must be greater than zero");
    };
    if (sizeBytes > MAX_FILE_BYTES) {
      return ?#invalid_input("File exceeds 500MB beta limit");
    };
    null
  };

  public func validateBlobHash(hash : Text) : ?Types.Error {
    if (not hash.startsWith(#text "sha256:")) {
      return ?#invalid_input("blobHash must be sha256:<64-hex>");
    };
    if (hash.size() != 71) {
      return ?#invalid_input("blobHash must be sha256:<64-hex>");
    };
    null
  };

  public func isHashBlocklisted(hash : Text) : Bool {
    hash == "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  };

  public func hasDigitalFulfillment(listing : Types.Listing) : Bool {
    if (not listing.isDigital) return false;
    switch (listing.digitalFileAsset) {
      case (?_) true;
      case null false;
    }
  };

  func isListingExclusiveTradeStatus(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#complete or #refunded or #cancelled
            or #cancelled_no_seller_response or #cancelled_buyer_pre_ship
            or #payment_intent_expired) false;
      case (_) true;
    };
  };

  func countExclusiveTradesForListing(
    trades : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : Nat {
    var count = 0;
    trades.forEach(func(_id, trade) {
      if (trade.listing == listingId and isListingExclusiveTradeStatus(trade.status)) {
        count += 1;
      };
    });
    count
  };

  public func assertCanReplaceFile(
    trades : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : Types.Result<()> {
    if (countExclusiveTradesForListing(trades, listingId) > 0) {
      return #err(#invalid_input(
        "Cannot replace digital file while active trades exist on this listing"
      ));
    };
    #ok(())
  };

  public func isFundingComplete(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#payment_verified or #funded or #digital_delivered or #complete) true;
      case (_) false;
    };
  };

  public func isDownloadAllowed(trade : Types.Trade) : Bool {
    switch (trade.status) {
      case (#digital_delivered or #complete) {
        switch (trade.digitalDelivery) {
          case null false;
          case (?_) true;
        }
      };
      case (_) false;
    };
  };

  func listingKey(_canisterId : Principal, listingId : Types.ListingId) : Text {
    listingId.toText()
  };

  func deriveListingKey(canisterId : Principal, listingId : Types.ListingId) : [Nat8] {
    DigitalEncryption.deriveKey(canisterId, listingKey(canisterId, listingId))
  };

  /// Registers immutable encrypted file metadata on a digital listing (seller-only).
  public func registerDigitalFile(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    trades : Map.Map<Types.TradeId, Types.Trade>,
    caller : Principal,
    listingId : Types.ListingId,
    canisterId : Principal,
    nextFileVersionId : Nat,
    blobHash : Text,
    mimeType : Text,
    sizeBytes : Nat,
    blobUrl : Text,
    dekHex : Text,
    contentHash : ?Text,
  ) : Types.Result<Types.DigitalFileAsset> {
    if (caller.isAnonymous()) return #err(#unauthorized);

    switch (listings.get(listingId)) {
      case null return #err(#not_found);
      case (?listing) {
        if (not Principal.equal(listing.seller, caller)) {
          return #err(#unauthorized);
        };
        if (not listing.isDigital) {
          return #err(#invalid_input("Listing is not digital"));
        };

        switch (validateBlobHash(blobHash)) { case (?e) return #err(e); case null {} };
        switch (validateMime(mimeType)) { case (?e) return #err(e); case null {} };
        switch (validateSize(sizeBytes)) { case (?e) return #err(e); case null {} };
        if (blobUrl.size() == 0) {
          return #err(#invalid_input("blobUrl must not be empty"));
        };
        if (dekHex.size() < 32) {
          return #err(#invalid_input("dekHex must be a valid encryption key"));
        };

        if (isHashBlocklisted(blobHash)) {
          listing.status := #draft;
          return #err(#invalid_input("File rejected — hash blocklisted (quarantine)"));
        };

        switch (listing.digitalFileAsset) {
          case (?_) {
            switch (assertCanReplaceFile(trades, listingId)) {
              case (#err(e)) return #err(e);
              case (#ok(_)) {};
            };
          };
          case null {};
        };

        let key = deriveListingKey(canisterId, listingId);
        let asset : Types.DigitalFileAsset = {
          fileVersionId = nextFileVersionId;
          blobHash = blobHash;
          mimeType = mimeType;
          sizeBytes = sizeBytes;
          blobUrlEncrypted = DigitalEncryption.encryptText(key, blobUrl);
          dekEncrypted = DigitalEncryption.encryptText(key, dekHex);
          contentHash = contentHash;
          registeredAt = Types.now();
        };

        listing.digitalFileAsset := ?asset;
        listing.digitalFileHash := contentHash;
        // Never persist plaintext blob URL on listing — encrypted asset only (E2.S11 AC 5).
        listing.digitalFileUrl := null;
        listing.digitalFileUrlEncrypted := null;

        #ok(asset)
      };
    }
  };

  /// Creates buyer delivery record and advances trade → #digital_delivered.
  /// Idempotent when already delivered.
  public func autoDeliverDigital(
    trade : Types.Trade,
    listing : Types.Listing,
    canisterId : Principal,
    now : Types.Timestamp,
  ) : Types.Result<Types.DigitalDelivery> {
    if (not listing.isDigital) {
      return #err(#invalid_input("Not a digital listing"));
    };

    switch (trade.digitalDelivery) {
      case (?existing) return #ok(existing);
      case null {};
    };

    switch (trade.status) {
      case (#payment_verified or #funded) {};
      case (#digital_delivered) {
        switch (trade.digitalDelivery) {
          case (?dd) return #ok(dd);
          case null {};
        };
      };
      case (_) {
        return #err(#escrow_error(
          "autoDeliverDigital requires payment_verified or funded, got "
            # debug_show(trade.status)
        ));
      };
    };

    let (fileUrl, fileHash, password, fileVersionId, dekHex, mimeType) : (
      Text, ?Text, ?Text, Nat, ?Text, ?Text,
    ) = switch (listing.digitalFileAsset) {
      case (?asset) {
        let key = deriveListingKey(canisterId, listing.id);
        let url = switch (DigitalEncryption.decryptText(key, asset.blobUrlEncrypted)) {
          case null return #err(#escrow_error("Failed to decrypt digital file URL"));
          case (?u) u;
        };
        let dek = DigitalEncryption.decryptText(key, asset.dekEncrypted);
        (
          url,
          asset.contentHash,
          null,
          asset.fileVersionId,
          dek,
          ?asset.mimeType,
        )
      };
      case null return #err(#escrow_error("Digital listing has no encrypted uploaded asset"));
    };

    let delivery : Types.DigitalDelivery = {
      fileUrl;
      fileHash;
      password;
      fileVersionId;
      mimeType;
      dekHex;
      deliveryRecordAt = now;
      var revealedAt = ?now;
      var inspectionDeadline = ?inspectionDeadlineFrom(now);
    };

    trade.digitalDelivery := ?delivery;
    trade.deliveryRecordAt := ?now;
    trade.status := #digital_delivered;
    #ok(delivery)
  };

  /// Called from mixins after payment verification or on-chain fund lock.
  public func assertDigitalDownloadAllowed(trade : Types.Trade) : Types.Result<()> {
    if (isDownloadAllowed(trade)) {
      #ok(())
    } else {
      #err(#invalid_input(
        "Файл буде доступний після підтвердження оплати."
      ))
    }
  };

  public func tryAutoDeliver(
    trades : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    tradeId : Types.TradeId,
    canisterId : Principal,
  ) : Types.Result<()> {
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    let listing = switch (listings.get(trade.listing)) {
      case null return #err(#not_found);
      case (?l) l;
    };
    if (not listing.isDigital) return #ok(());
    switch (autoDeliverDigital(trade, listing, canisterId, Types.now())) {
      case (#err(e)) #err(e);
      case (#ok(_)) #ok(());
    }
  };

}
