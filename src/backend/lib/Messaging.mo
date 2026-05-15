import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Types "../types";

/// Messaging — domain logic for per-trade chat threads.
/// All functions are pure (no side effects on external state) — they operate on injected state.
module {

  // ─── Composite key ────────────────────────────────────────────────────────

  /// Composite key for lastReadPointers: (TradeId, UserId)
  public type ReadKey = (Types.TradeId, Types.UserId);

  public func readKeyCompare(a : ReadKey, b : ReadKey) : { #less; #equal; #greater } {
    let (ta, ua) = a;
    let (tb, ub) = b;
    switch (Nat.compare(ta, tb)) {
      case (#equal) { Principal.compare(ua, ub) };
      case (other)  { other };
    };
  };

  // ─── Validation helpers ────────────────────────────────────────────────────

  /// Traps if caller is the anonymous principal.
  public func assertNotAnonymous(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principal not allowed");
    };
  };

  /// Validates that caller is a participant (buyer or seller) of the given trade.
  public func assertTradeParticipant(
    trade  : Types.Trade,
    caller : Principal,
  ) : () {
    if (not (Principal.equal(trade.buyer, caller) or Principal.equal(trade.seller, caller))) {
      Runtime.trap("Caller is not a participant of this trade");
    };
  };

  // ─── Send ─────────────────────────────────────────────────────────────────

  /// Creates and stores a new message in the trade thread.
  /// Validates: caller is buyer/seller, trade not cancelled, content ≤ 2000 chars.
  /// Returns (new Message, next message id counter).
  public func sendMessage(
    messages      : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex    : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    trades        : Map.Map<Types.TradeId, Types.Trade>,
    nextMessageId : Nat,
    caller        : Principal,
    tradeId       : Types.TradeId,
    content       : Text,
    attachments   : [Types.MediaAttachment],
  ) : (Types.Message, Nat) {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) { t };
      case null { Runtime.trap("Trade not found") };
    };

    assertTradeParticipant(trade, caller);

    switch (trade.status) {
      case (#cancelled) { Runtime.trap("Cannot message on a cancelled trade") };
      case (_)          {};
    };

    if (content.size() == 0 or content.size() > 2000) {
      Runtime.trap("Message content must be between 1 and 2000 characters");
    };

    let msgId = nextMessageId;
    let msg : Types.Message = {
      id            = msgId;
      trade         = tradeId;
      sender        = caller;
      content       = content;
      sentAt        = Time.now();
      attachmentUrl = null;   // deprecated; always null for new messages
      attachments   = attachments;
    };

    messages.add(msgId, msg);

    let existingIds = switch (tradeIndex.get(tradeId)) {
      case (?ids) { ids };
      case null   { List.empty<Types.MessageId>() };
    };
    existingIds.add(msgId);
    tradeIndex.add(tradeId, existingIds);

    (msg, msgId + 1);
  };

  // ─── Get messages (paginated) ─────────────────────────────────────────────

  /// Returns messages for a trade thread in chronological order.
  /// `offset` is 0-based; `limit` caps results (max 100, default 50).
  /// Caller must be buyer, seller, or a moderator/admin on a disputed trade.
  public func getMessages(
    messages   : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    trades     : Map.Map<Types.TradeId, Types.Trade>,
    users      : Map.Map<Types.UserId, Types.User>,
    caller     : Principal,
    tradeId    : Types.TradeId,
    offset     : Nat,
    limit      : Nat,
  ) : [Types.Message] {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) { t };
      case null { Runtime.trap("Trade not found") };
    };

    let isParticipant = Principal.equal(trade.buyer, caller) or Principal.equal(trade.seller, caller);
    if (not isParticipant) {
      assertModeratorOnDisputed(users, caller, trade);
    };

    let ids = switch (tradeIndex.get(tradeId)) {
      case (?ids) { ids };
      case null   { return [] };
    };

    let total = ids.size();
    if (offset >= total) { return [] };

    let safeLimit = if (limit == 0) { 50 } else if (limit > 100) { 100 } else { limit };
    let endIdx = Nat.min(offset + safeLimit, total);

    // Slice the id list and resolve each message
    let slicedIds = ids.sliceToArray(offset.toInt(), endIdx.toInt());
    slicedIds.filterMap<Types.MessageId, Types.Message>(func(msgId) {
      messages.get(msgId)
    });
  };

  // ─── Unread count per trade ───────────────────────────────────────────────

  /// Returns the number of messages sent after the caller's last-read timestamp
  /// for the given trade thread (excluding messages sent by the caller).
  public func getUnreadCount(
    messages     : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex   : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    trades       : Map.Map<Types.TradeId, Types.Trade>,
    lastReadPtrs : Map.Map<ReadKey, Types.Timestamp>,
    caller       : Principal,
    tradeId      : Types.TradeId,
  ) : Nat {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) { t };
      case null { Runtime.trap("Trade not found") };
    };

    assertTradeParticipant(trade, caller);

    let lastRead = switch (lastReadPtrs.get(readKeyCompare, (tradeId, caller))) {
      case (?ts) { ts };
      case null  { 0 };
    };

    let ids = switch (tradeIndex.get(tradeId)) {
      case (?ids) { ids };
      case null   { return 0 };
    };

    var count = 0;
    ids.forEach(func(msgId) {
      switch (messages.get(msgId)) {
        case (?msg) {
          if (msg.sentAt > lastRead and not Principal.equal(msg.sender, caller)) {
            count += 1;
          };
        };
        case null {};
      };
    });
    count;
  };

  /// Returns unread counts across all trades for the caller as (TradeId, Nat) pairs.
  public func getAllUnreadCounts(
    messages     : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex   : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    trades       : Map.Map<Types.TradeId, Types.Trade>,
    lastReadPtrs : Map.Map<ReadKey, Types.Timestamp>,
    caller       : Principal,
  ) : [(Types.TradeId, Nat)] {
    assertNotAnonymous(caller);

    var result : [(Types.TradeId, Nat)] = [];

    trades.forEach(func(tradeId, trade) {
      let isParticipant = Principal.equal(trade.buyer, caller) or Principal.equal(trade.seller, caller);
      if (isParticipant) {
        let lastRead = switch (lastReadPtrs.get(readKeyCompare, (tradeId, caller))) {
          case (?ts) { ts };
          case null  { 0 };
        };

        let ids = switch (tradeIndex.get(tradeId)) {
          case (?ids) { ids };
          case null   { List.empty<Types.MessageId>() };
        };

        var count = 0;
        ids.forEach(func(msgId) {
          switch (messages.get(msgId)) {
            case (?msg) {
              if (msg.sentAt > lastRead and not Principal.equal(msg.sender, caller)) {
                count += 1;
              };
            };
            case null {};
          };
        });

        if (count > 0) {
          result := result.concat([(tradeId, count)]);
        };
      };
    });

    result;
  };

  // ─── Mark as read ─────────────────────────────────────────────────────────

  /// Updates the last-read timestamp for the caller in the given trade thread.
  public func markAsRead(
    lastReadPtrs : Map.Map<ReadKey, Types.Timestamp>,
    trades       : Map.Map<Types.TradeId, Types.Trade>,
    caller       : Principal,
    tradeId      : Types.TradeId,
  ) : () {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) { t };
      case null { Runtime.trap("Trade not found") };
    };

    assertTradeParticipant(trade, caller);

    lastReadPtrs.add(readKeyCompare, (tradeId, caller), Time.now());
  };

  // ─── Moderator full thread ────────────────────────────────────────────────

  /// Returns the full message thread for moderators/admins — only on disputed trades.
  public func getModeratorThread(
    messages   : Map.Map<Types.MessageId, Types.Message>,
    tradeIndex : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
    trades     : Map.Map<Types.TradeId, Types.Trade>,
    users      : Map.Map<Types.UserId, Types.User>,
    caller     : Principal,
    tradeId    : Types.TradeId,
  ) : [Types.Message] {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) { t };
      case null { Runtime.trap("Trade not found") };
    };

    assertModeratorOnDisputed(users, caller, trade);

    let ids = switch (tradeIndex.get(tradeId)) {
      case (?ids) { ids };
      case null   { return [] };
    };

    ids.toArray().filterMap<Types.MessageId, Types.Message>(func(msgId) {
      messages.get(msgId)
    });
  };

  // ─── Internal helpers ─────────────────────────────────────────────────────

  func assertModeratorOnDisputed(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
    trade  : Types.Trade,
  ) : () {
    switch (trade.status) {
      case (#disputed) {};
      case (_) { Runtime.trap("Moderator access is only allowed on disputed trades") };
    };

    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Caller is not registered") };
    };

    switch (user.role) {
      case (#moderator) {};
      case (#admin)     {};
      case (_) { Runtime.trap("Caller is not a moderator or admin") };
    };
  };
}
