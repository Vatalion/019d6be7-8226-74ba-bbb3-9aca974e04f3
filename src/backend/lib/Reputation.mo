import Types "../types";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Int "mo:core/Int";

module {

  // ─── Progressive trade limit constants ────────────────────────────────────

  /// Progressive trade limits (in USD cents).
  let TIER_1_MAX_USD_CENTS : Nat = 100_000;    // $1,000
  let TIER_2_MAX_USD_CENTS : Nat = 500_000;    // $5,000
  let TIER_3_MAX_USD_CENTS : Nat = 10_000_000; // $100,000 (practical unlimited)

  /// Reputation score thresholds for tiers.
  let TIER_2_THRESHOLD : Int = 50;
  let TIER_3_THRESHOLD : Int = 200;

  /// Block trades/listings when liability debt exceeds this (USD cents).
  public let LIABILITY_BLOCK_THRESHOLD : Int = 10_000; // $100

  /// Returns true when user must not initiate trades due to global liability.
  public func isTradeBlocked(user : Types.User) : Bool {
    user.liabilityBalance < 0 and Int.abs(user.liabilityBalance) > LIABILITY_BLOCK_THRESHOLD
  };

  public func tradeBlockedError() : Text {
    "Your account has outstanding liability. Please settle before trading."
  };

  /// UA block message citing the primary liability ID (AC4).
  public func tradeBlockedErrorUa(
    user : Types.User,
    records : Map.Map<Nat, Types.LiabilityRecord>,
  ) : Text {
    if (not isTradeBlocked(user)) {
      return tradeBlockedError();
    };
    switch (primaryBlockingLiabilityId(user.id, records)) {
      case (?id) {
        "Ваш акаунт заблоковано через заборгованість №" # id.toText() #
        ". Будь ласка, погасіть борг перед торгівлею."
      };
      case null tradeBlockedError();
    };
  };

  public func liabilityRecordView(rec : Types.LiabilityRecord) : Types.LiabilityRecordView {
    {
      id = rec.id;
      userId = rec.userId;
      originalAmount = rec.originalAmount;
      remainingBalance = rec.remainingBalance;
      currency = rec.currency;
      reason = rec.reason;
      initiator = rec.initiator;
      tradeId = rec.tradeId;
      status = rec.status;
      createdAt = rec.createdAt;
      updatedAt = rec.updatedAt;
      auditTrail = rec.auditTrail;
    }
  };

  func compareLiabilityAdmin(
    a : Types.LiabilityRecordView,
    b : Types.LiabilityRecordView,
  ) : { #less; #equal; #greater } {
    if (a.remainingBalance > b.remainingBalance) { #less }
    else if (a.remainingBalance < b.remainingBalance) { #greater }
    else if (a.createdAt < b.createdAt) { #less }
    else if (a.createdAt > b.createdAt) { #greater }
    else { #equal }
  };

  /// Open/partial liabilities sorted by severity (balance desc) then age (oldest first).
  public func sortedLiabilitiesForAdmin(
    records : Map.Map<Nat, Types.LiabilityRecord>,
  ) : [Types.LiabilityRecordView] {
    let views = records.entries().filterMap(
      func((_, rec) : (Nat, Types.LiabilityRecord)) : ?Types.LiabilityRecordView {
        switch (rec.status) {
          case (#open or #partial) { ?liabilityRecordView(rec) };
          case (#cleared) { null };
        }
      },
    ).toArray();
    views.sort(compareLiabilityAdmin)
  };

  func primaryBlockingLiabilityId(
    userId : Types.UserId,
    records : Map.Map<Nat, Types.LiabilityRecord>,
  ) : ?Nat {
    var best : ?Types.LiabilityRecord = null;
    for ((_, rec) in records.entries()) {
      if (Principal.equal(rec.userId, userId)) {
        switch (rec.status) {
          case (#open or #partial) {
            switch (best) {
              case null { best := ?rec };
              case (?b) {
                if (rec.remainingBalance > b.remainingBalance) {
                  best := ?rec
                } else if (
                  rec.remainingBalance == b.remainingBalance and rec.createdAt < b.createdAt
                ) {
                  best := ?rec
                };
              };
            };
          };
          case (#cleared) {};
        };
      };
    };
    switch (best) {
      case (?rec) ?rec.id;
      case null null;
    }
  };

  func reasonToText(reason : Types.LiabilityReason) : Text {
    switch (reason) {
      case (#dispute_lost) "dispute_lost";
      case (#cancellation_fee) "cancellation_fee";
      case (#seller_fault) "seller_fault";
      case (#stake_seizure_residual) "stake_seizure_residual";
      case (#buyer_cancel_compensation) "buyer_cancel_compensation";
      case (#admin_adjustment) "admin_adjustment";
    }
  };

  func appendAudit(
    rec : Types.LiabilityRecord,
    action : Types.LiabilityAuditAction,
    amount : Nat,
    performedBy : Principal,
    note : Text,
  ) {
    let entry : Types.LiabilityAuditEntry = {
      action;
      amount;
      performedBy;
      note;
      timestamp = Types.now();
    };
    rec.auditTrail := rec.auditTrail.concat([entry]);
    rec.updatedAt := entry.timestamp;
  };

  func syncUserBalanceFromRecords(
    user : Types.User,
    records : Map.Map<Nat, Types.LiabilityRecord>,
  ) {
    var owed : Nat = 0;
    for ((_, rec) in records.entries()) {
      if (Principal.equal(rec.userId, user.id)) {
        switch (rec.status) {
          case (#open or #partial) { owed += rec.remainingBalance };
          case (#cleared) {};
        };
      };
    };
    user.liabilityBalance := -Int.fromNat(owed);
  };

  /// Creates a global liability record with unique ID (AC1).
  public func createLiability(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    nextId : { var value : Nat },
    user : Types.User,
    amountCents : Nat,
    currency : Types.TradeToken,
    reason : Types.LiabilityReason,
    initiator : Principal,
    tradeId : ?Types.TradeId,
  ) : Nat {
    let id = nextId.value;
    nextId.value += 1;
    let now = Types.now();
    let rec : Types.LiabilityRecord = {
      id;
      userId = user.id;
      var originalAmount = amountCents;
      var remainingBalance = amountCents;
      currency;
      reason;
      initiator;
      tradeId;
      var status = #open;
      createdAt = now;
      var updatedAt = now;
      var auditTrail = [{
        action = #created;
        amount = amountCents;
        performedBy = initiator;
        note = "Liability created";
        timestamp = now;
      }];
    };
    records.add(id, rec);

    let event : Types.LiabilityEvent = {
      liabilityId = id;
      amount = Int.fromNat(amountCents);
      reason = reasonToText(reason);
      tradeId = switch (tradeId) { case null 0; case (?t) t };
      timestamp = now;
    };
    user.liabilityBalance := user.liabilityBalance - Int.fromNat(amountCents);
    user.liabilityHistory := user.liabilityHistory.concat([event]);
    id
  };

  /// Applies stake seizure against a liability — partial status when residual > 0 (AC2).
  public func applyStakeSeizure(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    user : Types.User,
    liabilityId : Nat,
    seizedCents : Nat,
    performedBy : Principal,
  ) : Types.Result<()> {
    switch (records.get(liabilityId)) {
      case null { #err(#not_found) };
      case (?rec) {
        if (not Principal.equal(rec.userId, user.id)) {
          return #err(#invalid_input("Liability does not belong to user"));
        };
        switch (rec.status) {
          case (#cleared) {
            return #err(#invalid_input("Liability already cleared"));
          };
          case (#open or #partial) {};
        };
        if (seizedCents == 0) { return #ok(()) };
        let applied = Nat.min(seizedCents, rec.remainingBalance);
        rec.remainingBalance -= applied;
        user.liabilityBalance := user.liabilityBalance + Int.fromNat(applied);
        appendAudit(rec, #stake_applied, applied, performedBy, "Stake seizure applied");

        let histEvent : Types.LiabilityEvent = {
          liabilityId = liabilityId;
          amount = -Int.fromNat(applied);
          reason = "stake_seizure";
          tradeId = switch (rec.tradeId) { case null 0; case (?t) t };
          timestamp = Types.now();
        };
        user.liabilityHistory := user.liabilityHistory.concat([histEvent]);

        rec.status := if (rec.remainingBalance == 0) { #cleared } else { #partial };
        #ok(())
      };
    }
  };

  /// Admin partial clear with audit trail (AC3).
  public func partialClearLiability(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    user : Types.User,
    liabilityId : Nat,
    clearAmountCents : Nat,
    admin : Principal,
    note : Text,
  ) : Types.Result<()> {
    switch (records.get(liabilityId)) {
      case null { #err(#not_found) };
      case (?rec) {
        if (not Principal.equal(rec.userId, user.id)) {
          return #err(#invalid_input("Liability does not belong to user"));
        };
        switch (rec.status) {
          case (#cleared) {
            return #err(#invalid_input("Liability already cleared"));
          };
          case (#open or #partial) {};
        };
        if (clearAmountCents == 0) {
          return #err(#invalid_input("Clear amount must be positive"));
        };
        let applied = Nat.min(clearAmountCents, rec.remainingBalance);
        rec.remainingBalance -= applied;
        user.liabilityBalance := user.liabilityBalance + Int.fromNat(applied);
        appendAudit(rec, #partial_clear, applied, admin, note);

        let histEvent : Types.LiabilityEvent = {
          liabilityId = liabilityId;
          amount = -Int.fromNat(applied);
          reason = "partial_clear: " # note;
          tradeId = switch (rec.tradeId) { case null 0; case (?t) t };
          timestamp = Types.now();
        };
        user.liabilityHistory := user.liabilityHistory.concat([histEvent]);

        rec.status := if (rec.remainingBalance == 0) { #cleared } else { #partial };
        #ok(())
      };
    }
  };

  /// Admin clears all open/partial liabilities for a user.
  public func clearLiability(
    records : Map.Map<Nat, Types.LiabilityRecord>,
    user : Types.User,
    admin : Principal,
    reason : Text,
  ) {
    let now = Types.now();
    var totalCleared : Nat = 0;
    for ((_, rec) in records.entries()) {
      if (Principal.equal(rec.userId, user.id)) {
        switch (rec.status) {
          case (#open or #partial) {
            totalCleared += rec.remainingBalance;
            appendAudit(rec, #full_clear, rec.remainingBalance, admin, reason);
            rec.remainingBalance := 0;
            rec.status := #cleared;
          };
          case (#cleared) {};
        };
      };
    };
    if (totalCleared > 0) {
      user.liabilityBalance := user.liabilityBalance + Int.fromNat(totalCleared);
      let event : Types.LiabilityEvent = {
        liabilityId = 0;
        amount = Int.fromNat(totalCleared);
        reason = "Cleared: " # reason;
        tradeId = 0;
        timestamp = now;
      };
      user.liabilityHistory := user.liabilityHistory.concat([event]);
    } else if (user.liabilityBalance != 0) {
      let event : Types.LiabilityEvent = {
        liabilityId = 0;
        amount = -user.liabilityBalance;
        reason = "Cleared: " # reason;
        tradeId = 0;
        timestamp = now;
      };
      user.liabilityBalance := 0;
      user.liabilityHistory := user.liabilityHistory.concat([event]);
    };
  };

  /// One-time migration: map legacy reputationScore to dual role scores.
  public func ensureDualScores(user : Types.User) {
    if (user.buyerScore == 0 and user.sellerScore == 0 and user.reputationScore != 0) {
      user.buyerScore := user.reputationScore;
      user.sellerScore := user.reputationScore;
    };
  };

  /// Returns the maximum trade amount (in USD cents) for reputation + optional KYC tier.
  public func maxTradeAmountForTier(reputationScore : Int, kycTier : Types.KycTier) : Nat {
    let base = if (reputationScore < TIER_2_THRESHOLD) {
      TIER_1_MAX_USD_CENTS
    } else if (reputationScore < TIER_3_THRESHOLD) {
      TIER_2_MAX_USD_CENTS
    } else {
      TIER_3_MAX_USD_CENTS
    };
    switch (kycTier) {
      case (#verified) base * 2;
      case (#none) base;
    }
  };

  /// Returns the maximum trade amount (in USD cents) allowed for a user
  /// based on their reputation score (no KYC boost).
  public func maxTradeAmount(reputationScore : Int) : Nat {
    maxTradeAmountForTier(reputationScore, #none)
  };

  /// Returns true if the user's reputation + KYC tier allows a trade of `usdCents` value.
  public func canTradeAmountForUser(
    reputationScore : Int,
    kycTier : Types.KycTier,
    usdCents : Nat,
  ) : Bool {
    usdCents <= maxTradeAmountForTier(reputationScore, kycTier)
  };

  /// Returns true if the user's reputation allows a trade of `usdCents` value.
  public func canTradeAmount(reputationScore : Int, usdCents : Nat) : Bool {
    canTradeAmountForUser(reputationScore, #none, usdCents)
  };

  /// Returns a human-readable error message when a trade exceeds the reputation tier limit.
  public func gateErrorForUser(
    reputationScore : Int,
    kycTier : Types.KycTier,
    usdCents : Nat,
  ) : Text {
    let max = maxTradeAmountForTier(reputationScore, kycTier);
    let maxDollars = max / 100;
    let kycHint = switch (kycTier) {
      case (#verified) "";
      case (#none) " Optional verified tier doubles limits (admin-assigned).";
    };
    "Trade amount exceeds your reputation tier limit. " #
    "Your max: $" # maxDollars.toText() # ". " #
    "Build more reputation by completing trades to increase your limit." #
    kycHint
  };

  /// Returns a human-readable error message when a trade exceeds the reputation tier limit.
  public func gateError(reputationScore : Int, usdCents : Nat) : Text {
    gateErrorForUser(reputationScore, #none, usdCents)
  };

  // ─── Liability balance helpers ──────────────────────────────────────────────

  /// Credit-only adjustment (e.g. buyer cancel compensation) — no new liability record.
  public func recordLiabilityCredit(
    user : Types.User,
    creditCents : Nat,
    reason : Text,
    tradeId : ?Nat,
    liabilityId : ?Nat,
  ) {
    let event : Types.LiabilityEvent = {
      liabilityId = Types.optNat(liabilityId);
      amount = -Int.fromNat(creditCents);
      reason;
      tradeId = Types.optNat(tradeId);
      timestamp = Types.now();
    };
    user.liabilityBalance := user.liabilityBalance + Int.fromNat(creditCents);
    user.liabilityHistory := user.liabilityHistory.concat([event]);
  };

  /// Returns the current liability balance for a user (in USD cents).
  /// Negative values mean the user owes the platform money.
  public func getLiabilityBalance(user : Types.User) : Int {
    user.liabilityBalance
  };

  /// Returns true if the user has outstanding debt (liabilityBalance < 0).
  public func isLiabilityNegative(user : Types.User) : Bool {
    user.liabilityBalance < 0
  };

  // ─── Trust level calculation ────────────────────────────────────────────────

  /// Calculates trust level from completed trades count.
  /// 0 = #new_, 1-5 = #bronze, 6-25 = #silver, 26+ = #gold
  public func calculateTrustLevel(completedTrades : Nat) : Types.TrustLevel {
    if (completedTrades == 0) { #new_ }
    else if (completedTrades <= 5) { #bronze }
    else if (completedTrades <= 25) { #silver }
    else { #gold }
  };

  // ─── Score calculation ──────────────────────────────────────────────────────

  /// Calculates a reputation score.
  /// +10 per completed trade, -20 per dispute lost, -5 per cancellation.
  public func calculateScore(
    completedTrades : Nat,
    disputesLost    : Nat,
    cancellations   : Nat
  ) : Int {
    let gained  : Int = completedTrades * 10;
    let penalty : Int = (disputesLost * 20) + (cancellations * 5);
    gained - penalty
  };

  // ─── Trade outcome update ───────────────────────────────────────────────────

  /// Applies a trade outcome to a user's reputation score and trust level.
  /// outcome: #complete | #refunded | #disputed_lost | #cancelled
  public func applyOutcome(
    user    : Types.User,
    outcome : { #complete; #refunded; #disputed_lost; #cancelled },
    role    : { #buyer; #seller },
  ) {
    ensureDualScores(user);
    switch outcome {
      case (#complete) {
        user.reputationScore := user.reputationScore + 10;
        switch role {
          case (#buyer) { user.buyerScore := user.buyerScore + 10 };
          case (#seller) { user.sellerScore := user.sellerScore + 10 };
        };
      };
      case (#refunded) {
        // refund = no score change (0 delta)
      };
      case (#disputed_lost) {
        user.reputationScore := user.reputationScore - 20;
        switch role {
          case (#buyer) { user.buyerScore := user.buyerScore - 20 };
          case (#seller) { user.sellerScore := user.sellerScore - 20 };
        };
      };
      case (#cancelled) {
        user.reputationScore := user.reputationScore - 5;
        switch role {
          case (#buyer) {};
          case (#seller) { user.sellerScore := user.sellerScore - 5 };
        };
      };
    };
  };

  // ─── updateAfterTrade ───────────────────────────────────────────────────────

  /// Called when a trade reaches a terminal state.
  /// Updates both buyer and seller scores and recalculates their trust levels.
  ///
  /// tradeStatus: the final status of the trade
  /// disputeLoser: ?UserId — which party lost the dispute (only for #disputed trades)
  public func updateAfterTrade(
    users        : Map.Map<Types.UserId, Types.User>,
    buyerId      : Types.UserId,
    sellerId     : Types.UserId,
    tradeStatus  : Types.TradeStatus,
    disputeLoser : ?Types.UserId
  ) {
    let buyerOpt  = users.get(buyerId);
    let sellerOpt = users.get(sellerId);

    switch (buyerOpt, sellerOpt) {
      case (?buyer, ?seller) {
        switch tradeStatus {
          case (#complete) {
            applyOutcome(buyer,  #complete, #buyer);
            applyOutcome(seller, #complete, #seller);
          };
          case (#refunded) {
            applyOutcome(buyer,  #refunded, #buyer);
            applyOutcome(seller, #refunded, #seller);
          };
          case (#disputed) {
            switch disputeLoser {
              case (?loser) {
                if (Principal.equal(loser, buyerId)) {
                  applyOutcome(buyer,  #disputed_lost, #buyer);
                  // seller wins — no penalty
                } else if (Principal.equal(loser, sellerId)) {
                  applyOutcome(seller, #disputed_lost, #seller);
                  // buyer wins — no penalty
                }
              };
              case null { /* no loser determined yet — no change */ };
            };
          };
          case (#cancelled) {
            // Only penalize the seller on cancellation (seller-initiated)
            applyOutcome(seller, #cancelled, #seller);
          };
          case (_) { /* pending/funded/buyer_confirmed — nothing to do */ };
        };

        // Recalculate trust levels based on current score
        // We use a simplified threshold mapping on the raw score
        buyer.trustLevel  := calculateTrustLevel(scoreToBracket(buyer.reputationScore));
        seller.trustLevel := calculateTrustLevel(scoreToBracket(seller.reputationScore));
      };
      case _ { /* one or both users not found — silently skip */ };
    };
  };

  // Helper: map raw score to a "completed trades equivalent" bracket for trust level
  // Score 0 = new, 1-50 = bronze, 51-250 = silver, 251+ = gold
  func scoreToBracket(score : Int) : Nat {
    if (score <= 0)   { 0 }
    else if (score <= 50)  { 3 }    // mid-bronze
    else if (score <= 250) { 15 }   // mid-silver
    else { 30 }                      // gold
  };

  // ─── Feedback validation ────────────────────────────────────────────────────

  /// Validates a feedback submission.
  /// Returns #ok or #err with reason.
  public func validateFeedback(
    trades     : Map.Map<Types.TradeId, Types.Trade>,
    feedbacks  : Map.Map<Types.FeedbackId, Types.Feedback>,
    tradeId    : Types.TradeId,
    reviewer   : Types.UserId,
    reviewed   : Types.UserId,
    rating     : Nat,
    comment    : Text
  ) : Types.Result<()> {
    // 1. Rating must be 1–5
    if (rating < 1 or rating > 5) {
      return #err(#invalid_input("Rating must be between 1 and 5"));
    };

    // 2. Comment max 500 chars
    if (comment.size() > 500) {
      return #err(#invalid_input("Comment must not exceed 500 characters"));
    };

    // 3. Trade must exist and be #complete
    switch (trades.get(tradeId)) {
      case null { return #err(#not_found) };
      case (?trade) {
        switch (trade.status) {
          case (#complete) { /* ok */ };
          case (_) { return #err(#invalid_input("Feedback can only be left on completed trades")) };
        };

        // 4. Reviewer must be a trade participant
        if (
          not Principal.equal(reviewer, trade.buyer) and
          not Principal.equal(reviewer, trade.seller)
        ) {
          return #err(#unauthorized);
        };

        // 5. Reviewed must also be a trade participant (and not the reviewer)
        if (
          not Principal.equal(reviewed, trade.buyer) and
          not Principal.equal(reviewed, trade.seller)
        ) {
          return #err(#invalid_input("Reviewed user is not a trade participant"));
        };

        if (Principal.equal(reviewer, reviewed)) {
          return #err(#invalid_input("Cannot leave feedback for yourself"));
        };
      };
    };

    // 6. Check for duplicate feedback (one per reviewer→reviewed per trade)
    let duplicate = feedbacks.entries().find(func((_, fb)) {
      fb.trade == tradeId and
      Principal.equal(fb.reviewer, reviewer) and
      Principal.equal(fb.reviewed, reviewed)
    });

    switch duplicate {
      case (?_) { return #err(#already_exists) };
      case null  { #ok(()) };
    }
  };

  // ─── Stats helpers ──────────────────────────────────────────────────────────

  public type ReputationStats = {
    completedTrades : Nat;
    disputeRate     : Float;
    averageRating   : Float;
    trustLevel      : Types.TrustLevel;
    reputationScore : Int;
    buyerScore      : Int;
    sellerScore     : Int;
  };

  /// Computes aggregated reputation stats for a given user.
  public func computeStats(
    userId    : Types.UserId,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    feedbacks : Map.Map<Types.FeedbackId, Types.Feedback>,
    user      : Types.User
  ) : ReputationStats {
    ensureDualScores(user);
    var completed  : Nat   = 0;
    var disputed   : Nat   = 0;
    var ratingSum  : Nat   = 0;
    var ratingCount : Nat  = 0;

    // Count trades
    trades.entries().forEach(func((_, trade)) {
      let isParticipant =
        Principal.equal(trade.buyer, userId) or
        Principal.equal(trade.seller, userId);
      if (isParticipant) {
        switch (trade.status) {
          case (#complete)  { completed  := completed  + 1 };
          case (#disputed)  { disputed   := disputed   + 1 };
          case (_)          {};
        };
      };
    });

    // Aggregate received feedback
    feedbacks.entries().forEach(func((_, fb)) {
      if (Principal.equal(fb.reviewed, userId)) {
        ratingSum   := ratingSum   + fb.rating;
        ratingCount := ratingCount + 1;
      };
    });

    let disputeRate : Float =
      if (completed + disputed == 0) { 0.0 }
      else {
        let total = completed + disputed;
        disputed.toFloat() / total.toFloat()
      };

    let averageRating : Float =
      if (ratingCount == 0) { 0.0 }
      else { ratingSum.toFloat() / ratingCount.toFloat() };

    {
      completedTrades = completed;
      disputeRate     = disputeRate;
      averageRating   = averageRating;
      trustLevel      = user.trustLevel;
      reputationScore = user.reputationScore;
      buyerScore      = user.buyerScore;
      sellerScore     = user.sellerScore;
    }
  };
}
