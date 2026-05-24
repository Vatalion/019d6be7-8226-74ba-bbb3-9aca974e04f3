import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types";

/// In-app notification store — capped FIFO per user.
module {

  public let MAX_NOTIFICATIONS : Nat = 100;

  public func add(
    notifications      : Map.Map<Principal, List.List<Types.NotificationEvent>>,
    nextNotificationId : { var value : Nat },
    principal          : Principal,
    eventType          : Text,
    relatedId          : Nat,
    msg                : Text,
  ) {
    let id = nextNotificationId.value;
    nextNotificationId.value += 1;
    let event : Types.NotificationEvent = {
      id        = id;
      eventType = eventType;
      tradeId   = relatedId;
      message   = msg;
      timestamp = Types.now();
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
      for (item in arr.vals()) {
        if (i > 0) { existing.add(item) };
        i += 1;
      };
    };
    existing.add(event);
    notifications.add(principal, existing);
  };

};
