import Types "../types";

/// Maps internal Candid view types to GDPR export types (Int instead of Nat for Caffeine M0032).
module {

  func ei(n : Nat) : Types.ExportInt { Types.exportInt(n) };

  public func toAddressVerificationExport(v : Types.AddressVerification) : Types.AddressVerificationExport {
    {
      level = ei(v.level);
      active = v.active;
      txCount = ei(v.txCount);
      verifiedAt = ei(v.verifiedAt);
      expiresAt = ei(v.expiresAt);
    }
  };

  public func toPaymentMethodExport(pm : Types.PaymentMethod) : Types.PaymentMethodExport {
    {
      token = pm.token;
      address = pm.address;
      addedAt = ei(pm.addedAt);
      verification = switch (pm.verification) {
        case null null;
        case (?v) ?toAddressVerificationExport(v);
      };
      walletLinkId = ei(pm.walletLinkId);
    }
  };

  public func toLinkedWalletExport(w : Types.LinkedExternalWallet) : Types.LinkedExternalWalletExport {
    {
      id = ei(w.id);
      chain = w.chain;
      address = w.address;
      purpose = w.purpose;
      linkedAt = ei(w.linkedAt);
      sessionId = w.sessionId;
      messageHash = w.messageHash;
    }
  };

  public func toLiabilityEventExport(e : Types.LiabilityEvent) : Types.LiabilityEventExport {
    {
      liabilityId = ei(e.liabilityId);
      amount = e.amount;
      reason = e.reason;
      tradeId = ei(e.tradeId);
      timestamp = ei(e.timestamp);
    }
  };

  public func emptyProfileExport(userId : Types.UserId) : Types.UserProfileExport {
    {
      id = userId;
      username = "";
      bio = "";
      avatarUrl = "";
      role = #user;
      createdAt = 0;
      reputationScore = 0;
      buyerScore = 0;
      sellerScore = 0;
      trustLevel = #new_;
      kycTier = #none;
      isBanned = false;
      suspendedUntil = 0;
      liabilityBalance = 0;
      liabilityHistory = [];
      paymentMethods = [];
      linkedWallets = [];
      accountClosedAt = 0;
    }
  };

  public func toProfileExport(user : Types.User) : Types.UserProfileExport {
    {
      id = user.id;
      username = user.username;
      bio = user.bio;
      avatarUrl = user.avatarUrl;
      role = user.role;
      createdAt = ei(user.createdAt);
      reputationScore = user.reputationScore;
      buyerScore = user.buyerScore;
      sellerScore = user.sellerScore;
      trustLevel = user.trustLevel;
      kycTier = user.kycTier;
      isBanned = user.isBanned;
      suspendedUntil = ei(Types.optNat(user.suspendedUntil));
      liabilityBalance = user.liabilityBalance;
      liabilityHistory = user.liabilityHistory.map(toLiabilityEventExport);
      paymentMethods = user.paymentMethods.map(toPaymentMethodExport);
      linkedWallets = user.linkedWallets.map(toLinkedWalletExport);
      accountClosedAt = ei(Types.optNat(user.accountClosedAt));
    }
  };

  public func toMediaAttachmentExport(a : Types.MediaAttachment) : Types.MediaAttachmentExport {
    {
      url = a.url;
      mimeType = a.mimeType;
      fileName = a.fileName;
      fileSize = ei(a.fileSize);
    }
  };

  public func toMessageExport(tradeId : Types.TradeId, m : Types.Message) : Types.AccountMessageExport {
    {
      tradeId = tradeId;
      messageId = m.id;
      sender = m.sender;
      content = m.content;
      sentAt = ei(m.sentAt);
      attachmentUrl = m.attachmentUrl;
      attachments = m.attachments.map(toMediaAttachmentExport);
    }
  };

  public func toSavedSearchExport(s : Types.SavedSearch) : Types.SavedSearchExport {
    {
      id = s.id;
      owner = s.owner;
      name = s.name;
      paramsJson = s.paramsJson;
      createdAt = ei(s.createdAt);
      alertsEnabled = s.alertsEnabled;
    }
  };

  public func toFeedbackExport(f : Types.Feedback) : Types.FeedbackExport {
    {
      id = f.id;
      trade = f.trade;
      reviewer = f.reviewer;
      reviewed = f.reviewed;
      rating = ei(f.rating);
      comment = f.comment;
      createdAt = ei(f.createdAt);
    }
  };

  public func toShippingMethodExport(sm : Types.ShippingMethod) : Types.ShippingMethodExport {
    {
      carrier = sm.carrier;
      type_ = sm.type_;
      estimatedDays = ei(sm.estimatedDays);
    }
  };

  public func toListingCardExport(card : Types.ListingCard) : Types.ListingCardExport {
    {
      id = card.id;
      title = card.title;
      description = card.description;
      priceAmount = ei(card.priceAmount);
      priceToken = card.priceToken;
      photos = card.photos;
      location = card.location;
      sellerUsername = card.sellerUsername;
      sellerRating = card.sellerRating;
      sellerTrustLevel = card.sellerTrustLevel;
      sellerPrincipal = card.sellerPrincipal;
      condition = card.condition;
      shippingMethods = card.shippingMethods.map(toShippingMethodExport);
      category = card.category;
      categoryId = card.categoryId;
      categorySlug = card.categorySlug;
      listingStatus = card.status;
      createdAt = ei(card.createdAt);
      digitalFileUrl = card.digitalFileUrl;
      isPromoted = card.isPromoted;
      attributes = card.attributes;
    }
  };

  func toDigitalDeliveryViewExport(v : Types.DigitalDeliveryView) : Types.DigitalDeliveryViewExport {
    {
      fileUrl = v.fileUrl;
      fileHash = v.fileHash;
      password = v.password;
      fileVersionId = ei(v.fileVersionId);
      mimeType = v.mimeType;
      dekHex = v.dekHex;
      deliveryRecordAt = ei(v.deliveryRecordAt);
      revealedAt = ei(v.revealedAt);
      inspectionDeadline = ei(v.inspectionDeadline);
    }
  };

  func toShippingSelectionExport(s : Types.ShippingSelection) : Types.ShippingSelectionExport {
    {
      provider = s.provider;
      deliveryType = s.deliveryType;
      branchRef = s.branchRef;
      address = s.address;
      cost = ei(s.cost);
    }
  };

  func toEscrowAccountExport(e : Types.EscrowAccount) : Types.EscrowAccountExport {
    {
      tradeId = e.tradeId;
      buyerPrincipal = e.buyerPrincipal;
      sellerPrincipal = e.sellerPrincipal;
      token = e.token;
      amount = ei(e.amount);
      fee = ei(e.fee);
      ledgerCanisterId = e.ledgerCanisterId;
      lockedAt = ei(e.lockedAt);
      deadline = ei(e.deadline);
    }
  };

  func toPaymentIntentExport(p : Types.PaymentIntent) : Types.PaymentIntentExport {
    {
      token = p.token;
      network = p.network;
      exactAmount = ei(p.exactAmount);
      recipient = p.recipient;
      expiry = ei(p.expiry);
      path = p.path;
      createdAt = ei(p.createdAt);
    }
  };

  func toPayoutWalletSnapshotExport(p : Types.PayoutWalletSnapshot) : Types.PayoutWalletSnapshotExport {
    {
      walletLinkId = ei(p.walletLinkId);
      address = p.address;
      token = p.token;
      chain = p.chain;
      snapshottedAt = ei(p.snapshottedAt);
    }
  };

  func toBuyerCancelSplitExport(s : Types.BuyerCancelPenaltySplit) : Types.BuyerCancelPenaltySplitExport {
    {
      lockedAmount = ei(s.lockedAmount);
      buyerRefund = ei(s.buyerRefund);
      sellerCompensation = ei(s.sellerCompensation);
      platformFee = ei(s.platformFee);
    }
  };

  func toOnChainSettlementOpExport(op : Types.OnChainSettlementOp) : Types.OnChainSettlementOpExport {
    switch (op) {
      case (#releaseToSeller) #releaseToSeller;
      case (#refundBuyer fields) #refundBuyer(fields);
      case (#buyerCancelSplit split) #buyerCancelSplit(toBuyerCancelSplitExport(split));
      case (#disputeBuyerWins) #disputeBuyerWins;
      case (#disputeSellerWins fields) #disputeSellerWins(fields);
      case (#disputeSplit fields) #disputeSplit(fields);
    }
  };

  func toPendingSettlementExport(p : Types.PendingOnChainSettlementView) : Types.PendingOnChainSettlementExport {
    {
      op = toOnChainSettlementOpExport(p.op);
      targetStatus = p.targetStatus;
      queuedAt = ei(p.queuedAt);
      attempts = ei(p.attempts);
      lastError = p.lastError;
    }
  };

  public func toTradeViewExport(tv : Types.TradeView) : Types.TradeViewExport {
    {
      id = tv.id;
      listing = tv.listing;
      buyer = tv.buyer;
      seller = tv.seller;
      amount = ei(tv.amount);
      token = tv.token;
      tradeStatus = tv.status;
      createdAt = ei(tv.createdAt);
      fundedAt = ei(tv.fundedAt);
      confirmedAt = ei(tv.confirmedAt);
      completedAt = ei(tv.completedAt);
      refundDeadline = ei(tv.refundDeadline);
      sellerResponseDeadline = ei(tv.sellerResponseDeadline);
      escrowAccount = switch (tv.escrowAccount) {
        case null null;
        case (?e) ?toEscrowAccountExport(e);
      };
      shippingSelection = switch (tv.shippingSelection) {
        case null null;
        case (?s) ?toShippingSelectionExport(s);
      };
      ttnNumber = tv.ttnNumber;
      ttnCreationStatus = tv.ttnCreationStatus;
      digitalDelivery = switch (tv.digitalDelivery) {
        case null null;
        case (?d) ?toDigitalDeliveryViewExport(d);
      };
      deliveryRecordAt = ei(tv.deliveryRecordAt);
      payoutWalletSnapshot = switch (tv.payoutWalletSnapshot) {
        case null null;
        case (?p) ?toPayoutWalletSnapshotExport(p);
      };
      payoutWalletHeld = tv.payoutWalletHeld;
      paymentIntent = switch (tv.paymentIntent) {
        case null null;
        case (?p) ?toPaymentIntentExport(p);
      };
      shipByDeadline = ei(tv.shipByDeadline);
      shippedAt = ei(tv.shippedAt);
      npDeliveredAt = ei(tv.npDeliveredAt);
      npDeliveredGraceEndsAt = ei(tv.npDeliveredGraceEndsAt);
      pendingOnChainSettlement = switch (tv.pendingOnChainSettlement) {
        case null null;
        case (?p) ?toPendingSettlementExport(p);
      };
    }
  };

}
