import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types";

/// Messaging — domain logic for per-trade chat threads.
/// All functions are pure (no side effects on external state) — they operate on injected state.
module {

  public let LINK_PREVIEW_TTL_NS : Nat = 86_400_000_000_000;
  public let MAX_LINK_PREVIEW_CACHE_ENTRIES : Nat = 500;
  public let MAX_URL_LENGTH : Nat = 2048;

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

    /// Basic XSS guard: escape HTML special chars so content is safe to render.
    func escapeHtml(t : Text) : Text {
      var out = "";
      for (ch in t.toIter()) {
        switch (ch) {
          case ('<') { out := out # "&lt;" };
          case ('>') { out := out # "&gt;" };
          case ('&') { out := out # "&amp;" };
          case (_)    { out := out # Text.fromChar(ch) };
        };
      };
      out
    };

    let safeContent = escapeHtml(content);

    let msgId = nextMessageId;
    let msg : Types.Message = {
      id            = msgId;
      trade         = tradeId;
      sender        = caller;
      content       = safeContent;
      sentAt        = Types.now();
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

    lastReadPtrs.add(readKeyCompare, (tradeId, caller), Types.now());
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

  func isActiveModerator(user : Types.User) : Bool {
    if (user.isBanned) return false;
    switch (user.suspendedUntil) {
      case (?until) {
        if (Types.now() < until) return false;
      };
      case null {};
    };
    switch (user.role) {
      case (#moderator or #admin) true;
      case (_) false;
    };
  };

  func assertModeratorOnDisputed(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
    trade  : Types.Trade,
  ) : () {
    switch (trade.status) {
      case (#disputed or #dispute_l1 or #dispute_l2) {};
      case (_) { Runtime.trap("Moderator access is only allowed on disputed trades") };
    };

    let user = switch (users.get(caller)) {
      case (?u) { u };
      case null { Runtime.trap("Caller is not registered") };
    };

    if (not isActiveModerator(user)) {
      Runtime.trap("Caller is not an active moderator or admin");
    };
  };

  // ─── Link preview SSRF guard ───────────────────────────────────────────────

  /// Returns true when the URL host must not be fetched via HTTPS outcall.
  public func isBlockedPreviewHost(url : Text) : Bool {
    switch (extractPreviewHost(url)) {
      case null true;
      case (?host) isBlockedPreviewHostName(host);
    }
  };

  /// Extracts the host portion from an http(s) URL (lowercased, no port/brackets).
  public func extractPreviewHost(url : Text) : ?Text {
    let lower = url.toLower();
    switch (indexOfText(lower, "://")) {
      case null null;
      case (?schemeEnd) {
        let rest = sliceFrom(lower, schemeEnd + 3);
        let hostWithMaybePort = switch (indexOfFirstOf(rest, ['/', '?', '#'])) {
          case null rest;
          case (?idx) takeChars(rest, idx);
        };
        ?stripIpv6Brackets(stripPort(hostWithMaybePort))
      };
    }
  };

  func isBlockedPreviewHostName(host : Text) : Bool {
    let h = host.toLower();
    if (h == "localhost" or h == "127.0.0.1" or h == "0.0.0.0" or h == "::1") {
      return true;
    };
    if (h == "169.254.169.254" or h.contains(#text "metadata.google")) {
      return true;
    };
    if (h.endsWith(#text ".localhost") or h.endsWith(#text ".local")) {
      return true;
    };
    switch (parseIpv4(h)) {
      case (?octets) isPrivateOrLoopbackIpv4(octets);
      case null false;
    }
  };

  func isPrivateOrLoopbackIpv4(octets : [Nat]) : Bool {
    let a = octets[0];
    let b = octets[1];
    a == 10
      or a == 127
      or (a == 172 and b >= 16 and b <= 31)
      or (a == 192 and b == 168)
      or (a == 169 and b == 254)
  };

  func parseIpv4(host : Text) : ?[Nat] {
    let parts = host.split(#char '.').toArray();
    if (parts.size() != 4) return null;
    var a : Nat = 0;
    var b : Nat = 0;
    var c : Nat = 0;
    var d : Nat = 0;
    switch (parseDecimalNat(parts[0])) { case (?x) a := x; case null return null };
    switch (parseDecimalNat(parts[1])) { case (?x) b := x; case null return null };
    switch (parseDecimalNat(parts[2])) { case (?x) c := x; case null return null };
    switch (parseDecimalNat(parts[3])) { case (?x) d := x; case null return null };
    if (a > 255 or b > 255 or c > 255 or d > 255) return null;
    ?[a, b, c, d]
  };

  func parseDecimalNat(text : Text) : ?Nat {
    if (text.size() == 0) return null;
    var n : Nat = 0;
    for (c in text.chars()) {
      if (c < '0' or c > '9') return null;
      n := n * 10 + (c.toNat32().toNat() - '0'.toNat32().toNat());
    };
    ?n
  };

  func stripPort(host : Text) : Text {
    if (host.startsWith(#text "[")) {
      switch (indexOfText(host, "]")) {
        case null host;
        case (?end) takeChars(host, end + 1);
      }
    } else {
      let parts = host.split(#char ':').toArray();
      if (parts.size() == 2 and parseDecimalNat(parts[1]) != null) {
        parts[0]
      } else {
        host
      }
    }
  };

  func stripIpv6Brackets(host : Text) : Text {
    if (host.size() >= 2 and host.startsWith(#text "[") and host.endsWith(#text "]")) {
      takeChars(sliceFrom(host, 1), host.size() - 2)
    } else {
      host
    }
  };

  func indexOfText(haystack : Text, needle : Text) : ?Nat {
    let h = haystack.toArray();
    let n = needle.toArray();
    let hLen = h.size();
    let nLen = n.size();
    if (nLen == 0 or nLen > hLen) return null;
    var i : Nat = 0;
    while (i + nLen <= hLen) {
      var matched = true;
      var j : Nat = 0;
      while (j < nLen) {
        if (h[i + j] != n[j]) {
          matched := false;
          break;
        };
        j += 1;
      };
      if (matched) return ?i;
      i += 1;
    };
    null
  };

  func indexOfFirstOf(text : Text, chars : [Char]) : ?Nat {
    var i : Nat = 0;
    for (c in text.chars()) {
      for (needle in chars.vals()) {
        if (c == needle) return ?i;
      };
      i += 1;
    };
    null
  };

  func takeChars(text : Text, count : Nat) : Text {
    var acc = "";
    var n : Nat = 0;
    for (c in text.chars()) {
      if (n >= count) break;
      acc #= Text.fromChar(c);
      n += 1;
    };
    acc
  };

  func sliceFrom(text : Text, start : Nat) : Text {
    var acc = "";
    var i : Nat = 0;
    for (c in text.chars()) {
      if (i >= start) acc #= Text.fromChar(c);
      i += 1;
    };
    acc
  };
}
