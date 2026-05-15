import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Types "../types";
import MessagingLib "../lib/Messaging";
import Auth "../lib/Auth";
import RateLimiter "../lib/RateLimiter";

/// Messaging mixin — exposes public P2P chat endpoints to the actor.
mixin (
  messages      : Map.Map<Types.MessageId, Types.Message>,
  tradeIndex    : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
  trades        : Map.Map<Types.TradeId, Types.Trade>,
  users         : Map.Map<Types.UserId, Types.User>,
  lastReadPtrs  : Map.Map<MessagingLib.ReadKey, Types.Timestamp>,
  nextMessageId : { var value : Nat },
  notifications : Map.Map<Principal, List.List<Types.NotificationEvent>>,
  nextNotificationId : { var value : Nat },
  rateLimitSendMessage : Map.Map<Principal, (Nat, Types.Timestamp)>,
  linkPreviewCache : Map.Map<Text, Types.LinkPreview>,
) {

  /// Maximum notifications stored per user (FIFO eviction).
  let MAX_NOTIFICATIONS : Nat = 100;

  /// Link preview cache TTL: 24 hours in nanoseconds.
  let LINK_PREVIEW_TTL_NS : Int = 86_400_000_000_000;

  /// Maximum URL length accepted for link preview.
  let MAX_URL_LENGTH : Nat = 2048;

  // ─── Internal notification helper ─────────────────────────────────────────

  /// Adds a notification for the given principal. Evicts oldest if over cap.
  func _addNotification(
    principal : Principal,
    eventType : Text,
    tradeId   : Nat,
    msg       : Text,
  ) {
    let id = nextNotificationId.value;
    nextNotificationId.value := id + 1;
    let event : Types.NotificationEvent = {
      id        = id;
      eventType = eventType;
      tradeId   = tradeId;
      message   = msg;
      timestamp = Time.now();
      read      = false;
    };
    let existing = switch (notifications.get(principal)) {
      case (?list) list;
      case null    List.empty<Types.NotificationEvent>();
    };
    if (existing.size() >= MAX_NOTIFICATIONS) {
      let arr = existing.toArray();
      existing.clear();
      var i = 0;
      for (item in arr.values()) {
        if (i > 0) { existing.add(item) };
        i := i + 1;
      };
    };
    existing.add(event);
    notifications.add(principal, existing);
  };

  // ─── Send ──────────────────────────────────────────────────────────────────

  /// Sends a message to the trade thread with optional rich media attachments.
  /// Caller must be the buyer or seller; trade must not be cancelled.
  /// Content max 2000 chars; max 10 attachments.
  public shared ({ caller }) func sendMessage(
    tradeId     : Types.TradeId,
    content     : Text,
    attachments : [Types.MediaAttachment],
  ) : async Types.Result<Types.Message> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: 10 messages per minute per principal
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitSendMessage)) {
      return #err(#rate_limited);
    };

    // Content validation: 1–2000 chars, no dangerous HTML
    if (content.size() == 0 or content.size() > 2000) {
      return #err(#invalid_input("Message must be 1–2000 characters and cannot contain HTML"));
    };
    let lower = content.toLower();
    if (
      lower.contains(#text "<script")  or
      lower.contains(#text "<iframe")  or
      lower.contains(#text "<object")  or
      lower.contains(#text "<embed")   or
      lower.contains(#text "onerror=") or
      lower.contains(#text "onload=")  or
      lower.contains(#text "javascript:")
    ) {
      return #err(#invalid_input("Message must be 1–2000 characters and cannot contain HTML"));
    };

    // Max attachments guard
    if (attachments.size() > 10) {
      return #err(#invalid_input("Maximum 10 attachments per message"));
    };

    let (msg, nextId) = MessagingLib.sendMessage(
      messages,
      tradeIndex,
      trades,
      nextMessageId.value,
      caller,
      tradeId,
      content,
      attachments,
    );
    nextMessageId.value := nextId;

    // Notify the other party about the new message
    switch (trades.get(tradeId)) {
      case (?trade) {
        let other = if (Principal.equal(caller, trade.buyer)) trade.seller else trade.buyer;
        let senderName = switch (users.get(caller)) {
          case (?u) u.username;
          case null caller.toText();
        };
        _addNotification(
          other,
          "new_message",
          tradeId,
          "New message in Trade #" # tradeId.toText() # " from " # senderName,
        );
      };
      case null {};
    };

    #ok(msg);
  };

  // ─── Read thread ───────────────────────────────────────────────────────────

  /// Returns paginated messages for a trade thread in chronological order.
  /// Caller must be buyer, seller, or a moderator/admin on a disputed trade.
  /// Old messages (pre-v65) with attachmentUrl != null are back-filled into attachments.
  public shared query ({ caller }) func getTradeMessages(
    tradeId : Types.TradeId,
    offset  : Nat,
    limit   : Nat,
  ) : async [Types.Message] {
    let raw = MessagingLib.getMessages(
      messages,
      tradeIndex,
      trades,
      users,
      caller,
      tradeId,
      offset,
      limit,
    );
    // Back-fill legacy attachmentUrl into attachments array for old messages
    raw.map<Types.Message, Types.Message>(func(m) {
      if (m.attachments.size() == 0) {
        switch (m.attachmentUrl) {
          case (?url) {
            { m with
              attachments = [{
                url      = url;
                mimeType = "application/octet-stream";
                fileName = "attachment";
                fileSize = 0;
              }];
            }
          };
          case null m;
        };
      } else {
        m
      };
    });
  };

  // ─── Unread counts ─────────────────────────────────────────────────────────

  /// Returns unread message counts across all of the caller's trade threads.
  public shared query ({ caller }) func getUnreadCount() : async [(Types.TradeId, Nat)] {
    MessagingLib.getAllUnreadCounts(
      messages,
      tradeIndex,
      trades,
      lastReadPtrs,
      caller,
    );
  };

  // ─── Mark as read ──────────────────────────────────────────────────────────

  /// Updates the caller's last-read pointer for the given trade thread.
  public shared ({ caller }) func markTradeAsRead(
    tradeId : Types.TradeId,
  ) : async () {
    MessagingLib.markAsRead(
      lastReadPtrs,
      trades,
      caller,
      tradeId,
    );
  };

  // ─── Moderator access ──────────────────────────────────────────────────────

  /// Returns the full message thread for a disputed trade.
  /// Only accessible to moderators and admins.
  public shared query ({ caller }) func getModeratorThread(
    tradeId : Types.TradeId,
  ) : async [Types.Message] {
    MessagingLib.getModeratorThread(
      messages,
      tradeIndex,
      trades,
      users,
      caller,
      tradeId,
    );
  };

  // ─── Notifications ─────────────────────────────────────────────────────────

  /// Returns all notifications for the caller, newest first.
  public shared query ({ caller }) func getTradeNotifications() : async [Types.NotificationEvent] {
    switch (notifications.get(caller)) {
      case (?list) {
        let arr = list.toArray();
        arr.reverse();
      };
      case null [];
    };
  };

  /// Marks a specific notification as read for the caller.
  public shared ({ caller }) func markNotificationRead(
    notificationId : Nat,
  ) : async Types.Result<()> {
    switch (notifications.get(caller)) {
      case (?list) {
        list.mapInPlace(func(n : Types.NotificationEvent) : Types.NotificationEvent {
          if (n.id == notificationId) { { n with read = true } } else { n }
        });
        #ok(());
      };
      case null #err(#not_found);
    };
  };

  /// Marks all notifications as read for the caller.
  public shared ({ caller }) func markAllNotificationsRead() : async Types.Result<()> {
    switch (notifications.get(caller)) {
      case (?list) {
        list.mapInPlace(func(n : Types.NotificationEvent) : Types.NotificationEvent {
          { n with read = true }
        });
        #ok(());
      };
      case null #ok(());
    };
  };

  // ─── Link preview ──────────────────────────────────────────────────────────

  /// Fetches OpenGraph metadata for a URL via HTTPS outcall.
  /// Results are cached 24 h per URL.
  /// Security: only http:// and https:// schemes allowed; max URL length 2048.
  /// No caller auth required — intentionally public.
  public shared func getLinkPreview(url : Text) : async Types.Result<Types.LinkPreview> {
    // ── Security validation ───────────────────────────────────────────────
    if (url.size() > MAX_URL_LENGTH) {
      return #err(#invalid_input("URL exceeds maximum length of 2048 characters"));
    };
    let urlLower = url.toLower();
    let isHttp  = urlLower.startsWith(#text "http://");
    let isHttps = urlLower.startsWith(#text "https://");
    if (not isHttp and not isHttps) {
      return #err(#invalid_input("URL must start with http:// or https://"));
    };

    // ── Cache check ───────────────────────────────────────────────────────
    let now = Time.now();
    switch (linkPreviewCache.get(url)) {
      case (?cached) {
        if (now - cached.fetchedAt < LINK_PREVIEW_TTL_NS) {
          return #ok(cached);
        };
      };
      case null {};
    };

    // ── HTTPS outcall ─────────────────────────────────────────────────────
    let ic = actor("aaaaa-aa") : actor {
      http_request : shared ({
        url                : Text;
        max_response_bytes : ?Nat64;
        method             : { #get; #head; #post };
        headers            : [{ name : Text; value : Text }];
        body               : ?Blob;
        transform          : ?{
          function : shared query ({
            response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
            context  : Blob;
          }) -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
          context : Blob;
        };
      }) -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
    };

    let requestHeaders = [
      { name = "User-Agent";      value = "CryptoMarketBot/1.0" },
      { name = "Accept";          value = "text/html,application/xhtml+xml" },
      { name = "Accept-Language"; value = "en-US,en;q=0.5" },
    ];

    let htmlOpt : ?Text = try {
      let response = await ic.http_request({
        url                = url;
        max_response_bytes = ?(512_000 : Nat64);
        method             = #get;
        headers            = requestHeaders;
        body               = null;
        transform          = ?{
          function = _transformResponse;
          context  = "" : Blob;
        };
      });
      if (response.status >= 200 and response.status < 300) {
        response.body.decodeUtf8()
      } else {
        null
      }
    } catch (e) {
      null
    };

    let preview : Types.LinkPreview = switch (htmlOpt) {
      case null {
        { url; title = null; description = null; imageUrl = null; siteName = null; fetchedAt = now }
      };
      case (?html) {
        let titleVal = switch (_extractOgTag(html, "og:title")) {
          case (?v) ?v;
          case null  _extractTitle(html);
        };
        {
          url;
          title       = titleVal;
          description = _extractOgTag(html, "og:description");
          imageUrl    = _extractOgTag(html, "og:image");
          siteName    = _extractOgTag(html, "og:site_name");
          fetchedAt   = now;
        }
      };
    };

    linkPreviewCache.add(url, preview);
    #ok(preview)
  };

  // ─── Transform function (required for IC HTTPS outcall consensus) ─────────

  /// Strips non-deterministic headers so all replicas agree on the response.
  public shared query func _transformResponse(
    args : {
      response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
      context  : Blob;
    }
  ) : async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob } {
    {
      status  = args.response.status;
      headers = [];
      body    = args.response.body;
    }
  };

  // ─── Private OG parsing helpers ───────────────────────────────────────────

  /// Extracts `content` value from `<meta property="og:<name>" content="...">`
  /// or `<meta name="og:<name>" content="...">`.
  func _extractOgTag(html : Text, property : Text) : ?Text {
    let needle1 = "property=\"" # property # "\" content=\"";
    let needle2 = "name=\""     # property # "\" content=\"";

    switch (_extractAfterNeedle(html, needle1)) {
      case (?v) ?v;
      case null {
        switch (_extractAfterNeedle(html, needle2)) {
          case (?v) ?v;
          case null  _extractOgTagReversed(html, property);
        };
      };
    };
  };

  /// Fallback: `<title>...</title>`.
  func _extractTitle(html : Text) : ?Text {
    _extractBetween(html, "<title>", "</title>")
  };

  /// Handles reversed attribute order: `<meta content="VALUE" property="og:X">`.
  func _extractOgTagReversed(html : Text, property : Text) : ?Text {
    let propAttr = "property=\"" # property # "\"";
    switch (_indexOf(html, propAttr)) {
      case null null;
      case (?propPos) {
        let prefix = html.toArray().sliceToArray(0, propPos.toInt());
        _lastContentValue(Text.fromArray(prefix))
      };
    }
  };

  func _lastContentValue(text : Text) : ?Text {
    let needle      = "content=\"";
    var lastPos : ?Nat = null;
    var i       = 0;
    let chars   = text.toArray();
    let len     = chars.size();
    let nLen    = needle.size();
    while (i + nLen <= len) {
      let slice = chars.sliceToArray(i.toInt(), (i + nLen).toInt());
      if (Text.fromArray(slice) == needle) {
        lastPos := ?i;
      };
      i += 1;
    };
    switch (lastPos) {
      case null null;
      case (?pos) {
        let afterNeedle = chars.sliceToArray((pos + nLen).toInt(), len.toInt());
        _extractUntilQuote(Text.fromArray(afterNeedle))
      };
    }
  };

  /// Returns index of first occurrence of `needle` in `text`.
  func _indexOf(text : Text, needle : Text) : ?Nat {
    let chars  = text.toArray();
    let nChars = needle.toArray();
    let len    = chars.size();
    let nLen   = nChars.size();
    if (nLen == 0 or nLen > len) return null;
    var i = 0;
    while (i + nLen <= len) {
      let slice = chars.sliceToArray(i.toInt(), (i + nLen).toInt());
      if (Text.fromArray(slice) == needle) return ?i;
      i += 1;
    };
    null
  };

  /// Extracts the substring between `startTag` and `endTag`.
  func _extractBetween(html : Text, startTag : Text, endTag : Text) : ?Text {
    switch (_indexOf(html, startTag)) {
      case null null;
      case (?startPos) {
        let afterStart = html.toArray().sliceToArray(
          (startPos + startTag.size()).toInt(),
          html.size().toInt()
        );
        let afterText = Text.fromArray(afterStart);
        switch (_indexOf(afterText, endTag)) {
          case null null;
          case (?endPos) {
            let value = Text.fromArray(afterText.toArray().sliceToArray(0, endPos.toInt()));
            if (value.size() == 0) null else ?value
          };
        };
      };
    }
  };

  /// Extracts text after `needle` up to the next `"`.
  func _extractAfterNeedle(html : Text, needle : Text) : ?Text {
    switch (_indexOf(html, needle)) {
      case null null;
      case (?pos) {
        let afterChars = html.toArray().sliceToArray(
          (pos + needle.size()).toInt(),
          html.size().toInt()
        );
        _extractUntilQuote(Text.fromArray(afterChars))
      };
    }
  };

  func _extractUntilQuote(text : Text) : ?Text {
    switch (_indexOf(text, "\"")) {
      case null null;
      case (?endPos) {
        let value = Text.fromArray(text.toArray().sliceToArray(0, endPos.toInt()));
        if (value.size() == 0) null else ?value
      };
    }
  };
}
