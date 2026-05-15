import Types "../types";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";

module {

  // ─── Progressive trade limit constants ────────────────────────────────────

  /// Progressive trade limits (in USD cents).
  let TIER_1_MAX_USD_CENTS : Nat = 100_000;    // $1,000
  let TIER_2_MAX_USD_CENTS : Nat = 500_000;    // $5,000
  let TIER_3_MAX_USD_CENTS : Nat = 10_000_000; // $100,000 (practical unlimited)

  /// Reputation score thresholds for tiers.
  let TIER_2_THRESHOLD : Int = 50;
  let TIER_3_THRESHOLD : Int = 200;

  /// Returns the maximum trade amount (in USD cents) allowed for a user
  /// based on their reputation score.
  public func maxTradeAmount(reputationScore : Int) : Nat {
    if (reputationScore < TIER_2_THRESHOLD) {
      TIER_1_MAX_USD_CENTS
    } else if (reputationScore < TIER_3_THRESHOLD) {
      TIER_2_MAX_USD_CENTS
    } else {
      TIER_3_MAX_USD_CENTS
    }
  };

  /// Returns true if the user's reputation allows a trade of `usdCents` value.
  public func canTradeAmount(reputationScore : Int, usdCents : Nat) : Bool {
    usdCents <= maxTradeAmount(reputationScore)
  };

  /// Returns a human-readable error message when a trade exceeds the reputation tier limit.
  public func gateError(reputationScore : Int, usdCents : Nat) : Text {
    let max = maxTradeAmount(reputationScore);
    let maxDollars = max / 100;
    "Trade amount exceeds your reputation tier limit. " #
    "Your max: $" # maxDollars.toText() # ". " #
    "Build more reputation by completing trades to increase your limit."
  };

  // ─── Liability tracking ─────────────────────────────────────────────────────

  /// Records a liability event against a user and updates their liability balance.
  ///
  /// Sign convention: `liabilityBalance` goes NEGATIVE when debt accumulates.
  /// Passing `amount = 500` (e.g. $5.00 owed) will SUBTRACT 500 from `liabilityBalance`,
  /// making it more negative.  A balance of -500 means the user owes $5.00.
  ///
  /// Callers (escrow-api.mo, disputes-api.mo) should pass the real trade amount in USD cents.
  public func recordLiability(
    user    : Types.User,
    amount  : Int,
    reason  : Text,
    tradeId : ?Nat
  ) {
    let event : Types.LiabilityEvent = {
      amount;
      reason;
      tradeId;
      timestamp = Time.now();
    };
    // Subtract amount so that positive `amount` → more negative balance (more debt)
    user.liabilityBalance := user.liabilityBalance - amount;
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
    outcome : { #complete; #refunded; #disputed_lost; #cancelled }
  ) {
    switch outcome {
      case (#complete) {
        user.reputationScore := user.reputationScore + 10;
      };
      case (#refunded) {
        // refund = no score change (0 delta)
      };
      case (#disputed_lost) {
        user.reputationScore := user.reputationScore - 20;
      };
      case (#cancelled) {
        user.reputationScore := user.reputationScore - 5;
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
            applyOutcome(buyer,  #complete);
            applyOutcome(seller, #complete);
          };
          case (#refunded) {
            applyOutcome(buyer,  #refunded);
            applyOutcome(seller, #refunded);
          };
          case (#disputed) {
            switch disputeLoser {
              case (?loser) {
                if (Principal.equal(loser, buyerId)) {
                  applyOutcome(buyer,  #disputed_lost);
                  // seller wins — no penalty
                } else if (Principal.equal(loser, sellerId)) {
                  applyOutcome(seller, #disputed_lost);
                  // buyer wins — no penalty
                }
              };
              case null { /* no loser determined yet — no change */ };
            };
          };
          case (#cancelled) {
            // Only penalize the seller on cancellation (seller-initiated)
            applyOutcome(seller, #cancelled);
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
  };

  /// Computes aggregated reputation stats for a given user.
  public func computeStats(
    userId    : Types.UserId,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    feedbacks : Map.Map<Types.FeedbackId, Types.Feedback>,
    user      : Types.User
  ) : ReputationStats {
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
    }
  };
}
