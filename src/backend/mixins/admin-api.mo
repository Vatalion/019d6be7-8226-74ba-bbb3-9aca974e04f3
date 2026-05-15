import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Prim "mo:⛔";
import Types "../types";
import Admin "../lib/Admin";
import Auth "../lib/Auth";
import Obs "../lib/Observability";
import Marketplace "../lib/Marketplace";

/// admin-api mixin — exposes all admin/moderator endpoints.
/// State is injected from main.mo.
mixin (
  users           : Map.Map<Types.UserId,   Types.User>,
  listings        : Map.Map<Types.ListingId, Types.Listing>,
  trades          : Map.Map<Types.TradeId,   Types.Trade>,
  disputes        : Map.Map<Types.DisputeId, Types.Dispute>,
  complianceNotes : Map.Map<Types.UserId,    List.List<Admin.ComplianceNote>>,
  auditLog        : List.List<Admin.AuditEntry>,
  systemSettings  : Admin.SystemSettings,
  nextAuditId     : { var value : Nat },
  nextNoteId      : { var value : Nat },
  // Observability state
  errorLog        : List.List<Obs.ErrorLogEntry>,
  moduleMetrics   : Map.Map<Text, Obs.ModuleMetrics>,
  nextErrorId     : { var value : Nat },
  requestLog      : List.List<Obs.RequestMetric>,
) {

  // ─── User management ──────────────────────────────────────────────────────

  public shared ({ caller }) func getAllUsers(
    page     : Nat,
    pageSize : Nat,
    filter   : Admin.UserFilter,
  ) : async Admin.PagedResult<Types.UserProfile> {
    Auth.assertNotAnonymous(caller);
    Admin.getAllUsers(users, caller, page, pageSize, filter);
  };

  public shared ({ caller }) func suspendUser(
    target : Types.UserId,
    until  : Types.Timestamp,
    reason : Text,
  ) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.suspendUser(users, auditLog, nextAuditId.value, caller, target, until, reason);
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func banUser(
    target : Types.UserId,
    reason : Text,
  ) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.banUser(users, auditLog, nextAuditId.value, caller, target, reason);
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func unbanUser(target : Types.UserId) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.unbanUser(users, auditLog, nextAuditId.value, caller, target);
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func promoteToModerator(target : Types.UserId) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.promoteToModerator(users, auditLog, nextAuditId.value, caller, target);
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func demoteFromModerator(target : Types.UserId) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.demoteFromModerator(users, auditLog, nextAuditId.value, caller, target);
    nextAuditId.value := newId;
  };

  // ─── Compliance notes ─────────────────────────────────────────────────────

  public shared query ({ caller }) func getComplianceNotes(
    target : Types.UserId,
  ) : async [Admin.ComplianceNote] {
    Admin.getComplianceNotes(users, complianceNotes, caller, target);
  };

  public shared ({ caller }) func addComplianceNote(
    target : Types.UserId,
    note   : Text,
  ) : async () {
    Auth.assertNotAnonymous(caller);
    let (newAuditId, newNoteId) = Admin.addComplianceNote(
      users, complianceNotes, auditLog,
      nextAuditId.value, nextNoteId.value,
      caller, target, note,
    );
    nextAuditId.value := newAuditId;
    nextNoteId.value  := newNoteId;
  };

  // ─── Listing moderation ───────────────────────────────────────────────────

  public shared ({ caller }) func removeListingByAdmin(
    listingId : Types.ListingId,
    reason    : Text,
  ) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.removeListingByAdmin(
      users, listings, auditLog, nextAuditId.value, caller, listingId, reason,
    );
    nextAuditId.value := newId;
  };

  // ─── Platform metrics (legacy Phase 1) ───────────────────────────────────

  public shared query func getPlatformMetrics() : async Admin.PlatformMetrics {
    Admin.getPlatformMetrics(users, listings, trades, disputes);
  };

  // ─── Audit log ────────────────────────────────────────────────────────────

  public shared query ({ caller }) func getAuditLog(
    page     : Nat,
    pageSize : Nat,
    filter   : Admin.AuditFilter,
  ) : async Admin.PagedResult<Admin.AuditEntry> {
    Admin.getAuditLog(users, auditLog, caller, page, pageSize, filter);
  };

  // ─── System settings ──────────────────────────────────────────────────────

  public shared query ({ caller }) func getSystemSettings() : async {
    minTradeAmountUSD      : Nat;
    paymentTimeoutHours    : Nat;
    allowedTokens          : [Types.TradeToken];
    maxListingPriceUSD     : Nat;
    cyclesBalanceThreshold : Nat;
    errorRateThreshold     : Float;
  } {
    Admin.getSystemSettings(users, systemSettings, caller);
  };

  public shared ({ caller }) func updateSystemSettings(
    minTradeAmountUSD      : Nat,
    paymentTimeoutHours    : Nat,
    allowedTokens          : [Types.TradeToken],
    maxListingPriceUSD     : Nat,
    cyclesBalanceThreshold : Nat,
    errorRateThreshold     : Float,
  ) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.updateSystemSettings(
      users, systemSettings, auditLog, nextAuditId.value,
      caller, minTradeAmountUSD, paymentTimeoutHours, allowedTokens, maxListingPriceUSD,
      cyclesBalanceThreshold, errorRateThreshold,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setNovaPoshtaApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setNovaPoshtaApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setUkrPoshtaApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setUkrPoshtaApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setMeestApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setMeestApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setTronGridApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setTronGridApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setBscScanApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setBscScanApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setInfuraApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setInfuraApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setSolanaRpcUrl(url : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setSolanaRpcUrl(
      users, systemSettings, auditLog, nextAuditId.value, caller, url,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setPolygonApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setPolygonApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  public shared ({ caller }) func setAvalancheApiKey(apiKey : Text) : async () {
    Auth.assertNotAnonymous(caller);
    let newId = Admin.setAvalancheApiKey(
      users, systemSettings, auditLog, nextAuditId.value, caller, apiKey,
    );
    nextAuditId.value := newId;
  };

  // ─── Observability: error log ─────────────────────────────────────────────

  /// Returns up to `limit` most-recent error log entries, optionally filtered
  /// by severity string ("info" | "warning" | "error" | "critical").
  /// Admin or moderator only.
  public shared query ({ caller }) func getErrorLog(
    limit          : Nat,
    severityFilter : ?Text,
  ) : async [Obs.ErrorLogEntry] {
    Admin._requireAdminOrModPub(users, caller);
    let cap = if (limit == 0 or limit > 1000) 100 else limit;
    Obs.readEntries(errorLog, cap, severityFilter);
  };

  // ─── Observability: Phase 2 platform KPIs ────────────────────────────────

  /// Returns Phase 2 extended platform metrics computed on-query from current state.
  /// Admin or moderator only.
  public shared query ({ caller }) func getDashboardMetrics() : async Obs.PlatformMetrics {
    Admin._requireAdminOrModPub(users, caller);
    Obs.calculatePlatformMetrics(trades, disputes);
  };

  // ─── Observability: module metrics ────────────────────────────────────────

  /// Returns per-module call/error counters. Admin or moderator only.
  public shared query ({ caller }) func getModuleMetrics() : async [Obs.ModuleMetricsView] {
    Admin._requireAdminOrModPub(users, caller);
    Obs.getAllModuleMetrics(moduleMetrics);
  };

  // ─── Observability: cycles ────────────────────────────────────────────────

  /// Returns current cycle balance and warning flag. Admin only.
  public shared query ({ caller }) func getCyclesStatus() : async Obs.CyclesStatus {
    Admin._requireAdminPub(users, caller);
    Obs.getCyclesStatus();
  };

  // ─── Observability: metrics summary (Phase 2) ────────────────────────────

  /// Returns the full admin dashboard metrics summary including P95 latency,
  /// error rate, cycles balance, trade volume, and revenue.
  /// Admin or moderator only.
  public shared query ({ caller }) func getMetricsSummary() : async Obs.MetricsSummary {
    Admin._requireAdminOrModPub(users, caller);
    Obs.getMetricsSummary(trades, disputes, requestLog);
  };

  // ─── Observability: request log ───────────────────────────────────────────

  /// Record a request metric (endpoint, duration, status). Public — called by API mixins.
  public func recordRequest(endpoint : Text, durationMs : Nat, status : Nat) : () {
    Obs.recordRequest(requestLog, endpoint, durationMs, status);
  };

  /// Returns P95 latency (ms) for a given endpoint in the last windowHours.
  public shared query ({ caller }) func getP95Latency(
    endpoint    : Text,
    windowHours : Nat,
  ) : async Nat {
    Admin._requireAdminOrModPub(users, caller);
    Obs.getP95Latency(requestLog, endpoint, windowHours);
  };

  /// Returns requests per hour for a given endpoint in the last windowHours.
  public shared query ({ caller }) func getRequestRate(
    endpoint    : Text,
    windowHours : Nat,
  ) : async Nat {
    Admin._requireAdminOrModPub(users, caller);
    Obs.getRequestRate(requestLog, endpoint, windowHours);
  };

  /// Returns error rate (%) for a given endpoint in the last windowHours.
  public shared query ({ caller }) func getEndpointErrorRate(
    endpoint    : Text,
    windowHours : Nat,
  ) : async Float {
    Admin._requireAdminOrModPub(users, caller);
    Obs.getErrorRate(requestLog, endpoint, windowHours);
  };

  // ─── Observability: trades per day ───────────────────────────────────────

  /// Returns count of trades per calendar day for the last `days` days.
  /// Each entry: { date: "YYYY-MM-DD"; count: Nat }. Sorted ascending.
  /// Admin or moderator only.
  public shared query ({ caller }) func getTradesPerDay(days : Nat) : async [{ date : Text; count : Nat }] {
    Admin._requireAdminOrModPub(users, caller);

    let d = if (days == 0 or days > 365) 7 else days;
    let oneDayNs : Int = 86_400_000_000_000;
    let now = Time.now();

    // Bucket counts: index 0 = oldest day, d-1 = today
    let counts = List.tabulate<Nat>(d, func _ = 0);

    trades.forEach(func(_id, t : Types.Trade) {
      let age : Int = now - t.createdAt;
      if (age >= 0 and age < d.toInt() * oneDayNs) {
        let daysAgo : Nat = (age / oneDayNs).toNat();
        let idx : Nat = d - 1 - daysAgo;
        let cur = counts.at(idx);
        counts.put(idx, cur + 1);
      };
    });

    let result = List.empty<{ date : Text; count : Nat }>();
    var i : Nat = 0;
    while (i < d) {
      let daysAgo : Int = (d - 1 - i).toInt();
      let bucketTs : Int = now - daysAgo * oneDayNs;
      let secs : Int = bucketTs / 1_000_000_000;
      let dateStr = _timestampToDateStr(secs);
      let cnt = counts.at(i);
      result.add({ date = dateStr; count = cnt });
      i += 1;
    };
    result.toArray();
  };

  // ─── Listing lifecycle cleanup ────────────────────────────────────────────

  /// Deletes listings that are past the 30-day grace period after entering a
  /// resolved state (sold/inactive) and have no unresolved disputes.
  /// Admin only. Returns deleted count, photo URLs to clean up, and skip count.
  public shared ({ caller }) func cleanupResolvedListings() : async {
    deletedCount    : Nat;
    photosToDelete  : [Text];
    skippedByDispute : Nat;
  } {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.isAdmin(user)) {
      return { deletedCount = 0; photosToDelete = []; skippedByDispute = 0 };
    };
    let candidates = Marketplace.getResolvedForCleanup(listings);
    var deleted : Nat = 0;
    var skipped : Nat = 0;
    let allPhotos = List.empty<Text>();
    for ((lid, _listing) in candidates.vals()) {
      var hasUnresolvedDispute = false;
      for ((_tid, trade) in trades.entries()) {
        if (trade.listing == lid) {
          for ((_did, dispute) in disputes.entries()) {
            if (dispute.trade == trade.id and dispute.status != #resolved) {
              hasUnresolvedDispute := true;
            };
          };
        };
      };
      if (hasUnresolvedDispute) {
        skipped += 1;
      } else {
        switch (Marketplace.deleteListing(listings, lid)) {
          case null {};
          case (?photos) {
            for (photo in photos.vals()) {
              allPhotos.add(photo);
            };
          };
        };
        deleted += 1;
      };
    };
    {
      deletedCount    = deleted;
      photosToDelete  = allPhotos.toArray();
      skippedByDispute = skipped;
    }
  };

  /// Convert Unix seconds to "YYYY-MM-DD" string (Gregorian calendar).
  func _timestampToDateStr(secs : Int) : Text {
    let totalDays : Int = secs / 86_400;
    let z   : Int = totalDays + 719_468;
    let era : Int = (if (z >= 0) z else z - 146_096) / 146_097;
    let doe : Int = z - era * 146_097;
    let yoe : Int = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y   : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp  : Int = (5 * doy + 2) / 153;
    let dd  : Int = doy - (153 * mp + 2) / 5 + 1;
    let mo  : Int = mp + (if (mp < 10) 3 else -9);
    let yr  : Int = y + (if (mo <= 2) 1 else 0);

    let pad2 = func (n : Int) : Text {
      let nat = if (n < 0) 0 else n.toNat();
      let s = nat.toText();
      if (s.size() == 1) "0" # s else s
    };

    yr.toNat().toText() # "-" # pad2(mo) # "-" # pad2(dd)
  };

}

