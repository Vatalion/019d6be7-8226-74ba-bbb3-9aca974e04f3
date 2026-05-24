import Types "../types";
import RepLib "../lib/Reputation";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";

/// Reputation mixin — exposes public API for feedback and reputation stats.
/// Injected state: users, trades, feedbacks, userFeedbackIndex, nextFeedbackId
mixin (
  users             : Map.Map<Types.UserId,     Types.User>,
  trades            : Map.Map<Types.TradeId,    Types.Trade>,
  feedbacks         : Map.Map<Types.FeedbackId, Types.Feedback>,
  userFeedbackIndex : Map.Map<Types.UserId,     List.List<Types.FeedbackId>>,
  nextFeedbackId    : { var value : Nat }
) {

  // ─── leaveFeedback ──────────────────────────────────────────────────────────

  /// Submit feedback for a completed trade.
  /// One feedback per reviewer→reviewed direction per trade.
  public shared ({ caller }) func leaveFeedback(
    tradeId : Types.TradeId,
    reviewed : Types.UserId,
    rating   : Nat,
    comment  : Text
  ) : async Types.Result<Types.FeedbackId> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    switch (RepLib.validateFeedback(trades, feedbacks, tradeId, caller, reviewed, rating, comment)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_))  {};
    };

    let id = nextFeedbackId.value;
    nextFeedbackId.value := id + 1;

    let fb : Types.Feedback = {
      id        = id;
      trade     = tradeId;
      reviewer  = caller;
      reviewed  = reviewed;
      rating    = rating;
      comment   = comment;
      createdAt = Types.now();
    };

    feedbacks.add(id, fb);

    // Update index for the reviewed user
    let existing = switch (userFeedbackIndex.get(reviewed)) {
      case (?list) { list };
      case null    { List.empty<Types.FeedbackId>() };
    };
    existing.add(id);
    userFeedbackIndex.add(reviewed, existing);

    #ok(id)
  };

  // ─── getMyFeedback ──────────────────────────────────────────────────────────

  /// Returns all feedback received by the caller.
  public shared query ({ caller }) func getMyFeedback() : async [Types.Feedback] {
    if (caller.isAnonymous()) { return [] };
    feedbacksForUser(caller)
  };

  // ─── getUserFeedback ────────────────────────────────────────────────────────

  /// Returns all feedback received by a given user (public).
  public query func getUserFeedback(userId : Types.UserId) : async [Types.Feedback] {
    feedbacksForUser(userId)
  };

  // ─── getFeedbackForTrade ────────────────────────────────────────────────────

  /// Returns all feedback entries for a specific trade.
  public query func getFeedbackForTrade(tradeId : Types.TradeId) : async [Types.Feedback] {
    feedbacks.entries()
      .filterMap<(Types.FeedbackId, Types.Feedback), Types.Feedback>(
        func((_, fb)) { if (fb.trade == tradeId) { ?fb } else { null } }
      )
      .toArray()
  };

  // ─── getUserReputationStats ─────────────────────────────────────────────────

  /// Returns aggregated reputation stats for a user.
  public query func getUserReputationStats(userId : Types.UserId) : async ?RepLib.ReputationStats {
    switch (users.get(userId)) {
      case null       { null };
      case (?user)    {
        ?RepLib.computeStats(userId, trades, feedbacks, user)
      };
    }
  };

  // ─── Internal helpers ───────────────────────────────────────────────────────

  func feedbacksForUser(userId : Types.UserId) : [Types.Feedback] {
    switch (userFeedbackIndex.get(userId)) {
      case null       { [] };
      case (?ids)     {
        ids.values()
          .filterMap<Types.FeedbackId, Types.Feedback>(func(fid) { feedbacks.get(fid) })
          .toArray()
      };
    }
  };
}
