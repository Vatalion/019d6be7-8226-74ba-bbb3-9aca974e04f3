import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types";
import Auth "Auth";

/// Admin — user management, listing moderation, audit log, compliance notes,
/// platform metrics, and system settings. All functions are pure (state injected).
module {

  // ─── Internal admin types (also exported via types.mo additions) ──────────

  public type AuditAction = {
    #suspendUser;
    #banUser;
    #unbanUser;
    #promoteToModerator;
    #demoteFromModerator;
    #addComplianceNote;
    #removeComplianceNote;
    #removeListingByAdmin;
    #updateSystemSettings;
    #setNovaPoshtaApiKey;
    #setUkrPoshtaApiKey;
    #setMeestApiKey;
    #setTronGridApiKey;
    #setBscScanApiKey;
    #setInfuraApiKey;
    #setSolanaRpcUrl;
    #setPolygonApiKey;
    #setAvalancheApiKey;
  };

  public type AuditEntry = {
    id        : Nat;
    action    : Text;
    actorId   : Principal;
    targetId  : ?Text;
    timestamp : Types.Timestamp;
    details   : Text;
  };

  public type ComplianceNote = {
    id        : Nat;
    note      : Text;
    actorId   : Principal;
    timestamp : Types.Timestamp;
  };

  public type SystemSettings = {
    var minTradeAmountUSD   : Nat;
    var paymentTimeoutHours : Nat;
    var allowedTokens       : [Types.TradeToken];
    var maxListingPriceUSD  : Nat;
    var novaPoshtaApiKey    : Text;
    var ukrPoshtaApiKey     : Text;
    var meestApiKey         : Text;
    // Phase 2 — blockchain API keys for payment verification
    var tronGridApiKey      : Text;   // TRC20 (TronGrid)
    var bscScanApiKey       : Text;   // BEP20 (BSCScan)
    var infuraApiKey        : Text;   // ERC20 / Polygon / Avalanche (Infura)
    var solanaRpcUrl        : Text;   // Solana RPC endpoint (configurable)
    var polygonApiKey       : Text;   // Polygon (Polygonscan or Infura Polygon)
    var avalancheApiKey     : Text;   // Avalanche (Snowtrace or Infura Avalanche)
    // Phase 3 — ICRC-1 ledger canister IDs (configurable without code redeployment)
    var ckUsdcLedgerId : Text;  // ICP mainnet ckUSDC ledger canister ID
    var ckUsdtLedgerId : Text;  // ICP mainnet ckUSDT ledger canister ID
    /// Gate C — when false, initiateOnChainTrade rejects (no user-facing on-chain CTA).
    var trustlessEscrowEnabled : Bool;
    /// Gate C security checklist — all must be true before enable (E9.S6).
    var gateCTestnetE2ePassed : Bool;
    var gateCRollbackTestsPassed : Bool;
    var gateCSubaccountDesignReviewed : Bool;
    var gateCBetaCapsConfigured : Bool;
    /// Security sign-off reference (doc URL or audit id) stored on enable.
    var gateCSecuritySignOffRef : Text;
    /// ck on-chain beta cap in USD cents (D-034 default 500 USDT = 50_000).
    var ckOnChainBetaCapUsdCents : Nat;
    /// Platform fee in basis points (100 bps = 1%). 0 = use default 300 (3%) per D-001.
    var platformFeeBps : Nat;
    /// When true, ckUSDC/ckUSDT seller stake uses ICRC ledger moves (E6.S8 depth).
    /// Manual-chain tokens always use internal ledger with honest copy.
    var stakeOnChainEnabled : Bool;
    // Phase 2 — alert thresholds for admin dashboard
    var cyclesBalanceThreshold : Nat;   // cycles; default 1T = 1_000_000_000_000
    var errorRateThreshold     : Float; // percentage; default 5.0
  };

  /// Default buyer-facing platform fee: 3% (D-001).
  public let DEFAULT_PLATFORM_FEE_BPS : Nat = 300;

  /// Resolves configured bps; unset (0) falls back to admin default — never hidden.
  public func effectivePlatformFeeBps(configuredBps : Nat) : Nat {
    if (configuredBps == 0) DEFAULT_PLATFORM_FEE_BPS else configuredBps
  };

  /// Default ck on-chain beta cap: 500 USDT (D-034).
  public let DEFAULT_CK_BETA_CAP_USD_CENTS : Nat = 50_000;

  /// Standard beta tier ceiling: 500 USDT (D-043).
  public let STANDARD_BETA_MAX_USD_CENTS : Nat = 50_000;

  /// Elevated tier ceiling: 1000 USDT — verified seller or 10% stake (D-043).
  public let ELEVATED_TIER_MAX_USD_CENTS : Nat = 100_000;

  /// High-value ck-only threshold: >1000 USDT (D-022, D-043).
  public let HIGH_VALUE_CK_ONLY_USD_CENTS : Nat = 100_000;

  /// Hard beta reject above 5000 USDT (D-043).
  public let MAX_BETA_TRADE_USD_CENTS : Nat = 500_000;

  let SECRET_STORAGE_DISABLED_MSG : Text =
    "Secret storage in canister state is disabled for pre-alpha; configure provider credentials through an external secret proxy before enabling live verification";

  public type GateCChecklistView = {
    testnetE2ePassed : Bool;
    rollbackTestsPassed : Bool;
    subaccountDesignReviewed : Bool;
    betaCapsConfigured : Bool;
    securitySignOffRef : Text;
    ckBetaCapUsdCents : Nat;
    checklistComplete : Bool;
    trustlessEscrowEnabled : Bool;
  };

  /// All Gate C checklist items must pass before admin enable (E9.S6 AC 2).
  public func isGateCChecklistComplete(settings : SystemSettings) : Bool {
    settings.gateCTestnetE2ePassed
    and settings.gateCRollbackTestsPassed
    and settings.gateCSubaccountDesignReviewed
    and settings.gateCBetaCapsConfigured
    and settings.ckOnChainBetaCapUsdCents > 0
  };

  public func gateCChecklistView(settings : SystemSettings) : GateCChecklistView {
    {
      testnetE2ePassed = settings.gateCTestnetE2ePassed;
      rollbackTestsPassed = settings.gateCRollbackTestsPassed;
      subaccountDesignReviewed = settings.gateCSubaccountDesignReviewed;
      betaCapsConfigured = settings.gateCBetaCapsConfigured;
      securitySignOffRef = settings.gateCSecuritySignOffRef;
      ckBetaCapUsdCents = settings.ckOnChainBetaCapUsdCents;
      checklistComplete = isGateCChecklistComplete(settings);
      trustlessEscrowEnabled = settings.trustlessEscrowEnabled;
    }
  };

  // ─── Payment verification error log ──────────────────────────────────────

  public type PaymentVerificationError = {
    tradeId   : Types.TradeId;
    txHash    : Text;
    network   : Text;
    reason    : Text;
    timestamp : Types.Timestamp;
  };

  public type PlatformMetrics = {
    totalListings        : Nat;
    totalTrades          : Nat;
    tradesByToken        : [(Types.TradeToken, Nat)];
    activeUsersLast30d   : Nat;
    disputeRatePct       : Nat;    // integer percentage × 100, e.g. 150 = 1.50%
    avgTradeCompletionMs : Nat;    // milliseconds
  };

  public type PagedResult<T> = {
    items      : [T];
    totalCount : Nat;
    page       : Nat;
    pageSize   : Nat;
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  func _requireAdmin(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Types.User {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.canActAsAdmin(user)) Runtime.trap("unauthorized: admin required");
    user;
  };

  func _requireAdminOrMod(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Types.User {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.canActAsAdmin(user) and not Auth.canActAsModerator(user)) {
      Runtime.trap("unauthorized: admin or moderator required");
    };
    user;
  };

  /// Public guard for use by mixins — admin or moderator required.
  public func _requireAdminOrModPub(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : () {
    ignore _requireAdminOrMod(users, caller);
  };

  /// Public guard for use by mixins — admin only.
  public func _requireAdminPub(
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : () {
    ignore _requireAdmin(users, caller);
  };

  func _appendAudit(
    auditLog  : List.List<AuditEntry>,
    nextId    : Nat,
    action    : Text,
    actorId   : Principal,
    targetId  : ?Text,
    details   : Text,
  ) : Nat {
    let entry : AuditEntry = {
      id        = nextId;
      action    = action;
      actorId   = actorId;
      targetId  = targetId;
      timestamp = Types.now();
      details   = details;
    };
    auditLog.add(entry);
    nextId + 1;
  };

  /// User reports a listing (OLX-style abuse report). Logged to audit for moderators.
  public func reportListing(
    listings : Map.Map<Types.ListingId, Types.Listing>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    listingId : Types.ListingId,
    reason   : Text,
  ) : (Nat, Types.Result<()>) {
    Auth.assertNotAnonymous(caller);
    if (reason.size() == 0) {
      return (nextId, #err(#invalid_input("Report reason must not be empty")));
    };
    if (reason.size() > 500) {
      return (nextId, #err(#invalid_input("Report reason must be at most 500 characters")));
    };
    switch (listings.get(listingId)) {
      case null { (nextId, #err(#not_found)) };
      case (?listing) {
        if (Principal.equal(caller, listing.seller)) {
          return (nextId, #err(#invalid_input("Cannot report your own listing")));
        };
        let newId = _appendAudit(
          auditLog, nextId, "reportListing", caller,
          ?listingId.toText(), reason,
        );
        (newId, #ok(()))
      };
    };
  };

  // ─── User moderation ──────────────────────────────────────────────────────

  /// Suspend a user until `until` (nanoseconds timestamp). Admin or moderator.
  public func suspendUser(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
    until    : Types.Timestamp,
    reason   : Text,
  ) : Nat {
    ignore _requireAdminOrMod(users, caller);
    let user = switch (users.get(target)) {
      case (?u) u;
      case null Runtime.trap("user not found");
    };
    user.suspendedUntil := ?until;
    _appendAudit(
      auditLog, nextId,
      "suspendUser", caller, ?target.toText(),
      "Suspended until " # debug_show(until) # ". Reason: " # reason,
    );
  };

  /// Permanently ban a user. Admin or moderator.
  public func banUser(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
    reason   : Text,
  ) : Nat {
    ignore _requireAdminOrMod(users, caller);
    let user = switch (users.get(target)) {
      case (?u) u;
      case null Runtime.trap("user not found");
    };
    user.isBanned := true;
    _appendAudit(
      auditLog, nextId,
      "banUser", caller, ?target.toText(),
      "Banned. Reason: " # reason,
    );
  };

  /// Lift a ban on a user. Admin or moderator.
  public func unbanUser(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
  ) : Nat {
    ignore _requireAdminOrMod(users, caller);
    let user = switch (users.get(target)) {
      case (?u) u;
      case null Runtime.trap("user not found");
    };
    user.isBanned      := false;
    user.suspendedUntil := null;
    _appendAudit(
      auditLog, nextId,
      "unbanUser", caller, ?target.toText(),
      "Ban lifted.",
    );
  };

  /// Promote a user to moderator role. Admin only.
  public func promoteToModerator(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    let user = switch (users.get(target)) {
      case (?u) u;
      case null Runtime.trap("user not found");
    };
    user.role := #moderator;
    _appendAudit(
      auditLog, nextId,
      "promoteToModerator", caller, ?target.toText(),
      "Promoted to moderator.",
    );
  };

  /// Demote a moderator back to regular user. Admin only.
  public func demoteFromModerator(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    let user = switch (users.get(target)) {
      case (?u) u;
      case null Runtime.trap("user not found");
    };
    if (user.role != #moderator) Runtime.trap("user is not a moderator");
    user.role := #user;
    _appendAudit(
      auditLog, nextId,
      "demoteFromModerator", caller, ?target.toText(),
      "Demoted from moderator to user.",
    );
  };

  // ─── Compliance notes ─────────────────────────────────────────────────────

  /// Add an internal compliance note to a user. Admin or moderator.
  public func addComplianceNote(
    users           : Map.Map<Types.UserId, Types.User>,
    complianceNotes : Map.Map<Types.UserId, List.List<ComplianceNote>>,
    auditLog        : List.List<AuditEntry>,
    nextAuditId     : Nat,
    nextNoteId      : Nat,
    caller          : Principal,
    target          : Types.UserId,
    note            : Text,
  ) : (Nat, Nat) {
    // returns (newNextAuditId, newNextNoteId)
    ignore _requireAdminOrMod(users, caller);
    let entry : ComplianceNote = {
      id        = nextNoteId;
      note      = note;
      actorId   = caller;
      timestamp = Types.now();
    };
    let notesList = switch (complianceNotes.get(target)) {
      case (?lst) lst;
      case null {
        let lst = List.empty<ComplianceNote>();
        complianceNotes.add(target, lst);
        lst;
      };
    };
    notesList.add(entry);
    let newAuditId = _appendAudit(
      auditLog, nextAuditId,
      "addComplianceNote", caller, ?target.toText(),
      "Note #" # debug_show(nextNoteId) # " added.",
    );
    (newAuditId, nextNoteId + 1);
  };

  /// Remove a compliance note by id. Admin only.
  public func removeComplianceNote(
    users           : Map.Map<Types.UserId, Types.User>,
    complianceNotes : Map.Map<Types.UserId, List.List<ComplianceNote>>,
    auditLog        : List.List<AuditEntry>,
    nextAuditId     : Nat,
    caller          : Principal,
    target          : Types.UserId,
    noteId          : Nat,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    switch (complianceNotes.get(target)) {
      case (?lst) {
        let filtered = lst.filter(func(n : ComplianceNote) : Bool { n.id != noteId });
        lst.clear();
        lst.append(filtered);
      };
      case null Runtime.trap("no compliance notes for user");
    };
    _appendAudit(
      auditLog, nextAuditId,
      "removeComplianceNote", caller, ?target.toText(),
      "Note #" # debug_show(noteId) # " removed.",
    );
  };

  /// Return all compliance notes for a user. Admin or moderator.
  public func getComplianceNotes(
    users           : Map.Map<Types.UserId, Types.User>,
    complianceNotes : Map.Map<Types.UserId, List.List<ComplianceNote>>,
    caller          : Principal,
    target          : Types.UserId,
  ) : [ComplianceNote] {
    ignore _requireAdminOrMod(users, caller);
    switch (complianceNotes.get(target)) {
      case (?lst) lst.toArray();
      case null   [];
    };
  };

  // ─── Listing moderation ───────────────────────────────────────────────────

  /// Set listing status to #removed and log reason. Admin or moderator.
  public func removeListingByAdmin(
    users      : Map.Map<Types.UserId, Types.User>,
    listings   : Map.Map<Types.ListingId, Types.Listing>,
    auditLog   : List.List<AuditEntry>,
    nextId     : Nat,
    caller     : Principal,
    listingId  : Types.ListingId,
    reason     : Text,
  ) : Nat {
    ignore _requireAdminOrMod(users, caller);
    let listing = switch (listings.get(listingId)) {
      case (?l) l;
      case null Runtime.trap("listing not found");
    };
    listing.status := #removed;
    _appendAudit(
      auditLog, nextId,
      "removeListingByAdmin", caller, ?debug_show(listingId),
      "Listing removed. Reason: " # reason,
    );
  };

  // ─── Platform metrics ─────────────────────────────────────────────────────

  /// Aggregate platform-wide metrics. Pure computation over injected state.
  public func getPlatformMetrics(
    users    : Map.Map<Types.UserId, Types.User>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    disputes : Map.Map<Types.DisputeId, Types.Dispute>,
  ) : PlatformMetrics {
    let now = Types.now();
    let thirtyDaysNs : Types.Timestamp = 30 * 24 * 3_600 * 1_000_000_000;
    let cutoff = now - thirtyDaysNs;

    // total listings
    let totalListings = listings.size();

    // total trades
    let totalTrades = trades.size();

    // active users last 30 days — count users whose latest trade is within window
    var activeUsers : Nat = 0;
    users.forEach(func(uid, _u) {
      let hasRecentTrade = trades.any(func(_id, t : Types.Trade) : Bool {
        (Principal.equal(t.buyer, uid) or Principal.equal(t.seller, uid))
        and t.createdAt >= cutoff
      });
      if (hasRecentTrade) activeUsers += 1;
    });

    // trades by token
    var ckUSDC : Nat = 0; var ckUSDT : Nat = 0;
    var trc20  : Nat = 0; var bep20  : Nat = 0; var spl   : Nat = 0;
    var erc20u : Nat = 0; var erc20t : Nat = 0;
    var polyu  : Nat = 0; var polyt  : Nat = 0;
    var avaxu  : Nat = 0; var avaxt  : Nat = 0;
    trades.forEach(func(_id, t : Types.Trade) {
      switch (t.token) {
        case (#ckUSDC)        { ckUSDC += 1 };
        case (#ckUSDT)        { ckUSDT += 1 };
        case (#USDT_TRC20)    { trc20  += 1 };
        case (#USDT_BEP20)    { bep20  += 1 };
        case (#USDC_SPL)      { spl    += 1 };
        case (#USDC_ERC20)    { erc20u += 1 };
        case (#USDT_ERC20)    { erc20t += 1 };
        case (#USDC_POLYGON)  { polyu  += 1 };
        case (#USDT_POLYGON)  { polyt  += 1 };
        case (#USDC_AVAX)     { avaxu  += 1 };
        case (#USDT_AVAX)     { avaxt  += 1 };
      };
    });
    let tradesByToken : [(Types.TradeToken, Nat)] = [
      (#ckUSDC,       ckUSDC),
      (#ckUSDT,       ckUSDT),
      (#USDT_TRC20,   trc20),
      (#USDT_BEP20,   bep20),
      (#USDC_SPL,     spl),
      (#USDC_ERC20,   erc20u),
      (#USDT_ERC20,   erc20t),
      (#USDC_POLYGON, polyu),
      (#USDT_POLYGON, polyt),
      (#USDC_AVAX,    avaxu),
      (#USDT_AVAX,    avaxt),
    ];

    // dispute rate % × 100
    let totalDisputes = disputes.size();
    let disputeRatePct = if (totalTrades == 0) 0
      else (totalDisputes * 10_000) / totalTrades;

    // avg trade completion time in ms (completed trades only)
    var completedCount : Nat = 0;
    var totalNs        : Int = 0;
    trades.forEach(func(_id, t : Types.Trade) {
      switch (t.completedAt) {
        case (?completedAt) {
          totalNs += completedAt - t.createdAt;
          completedCount += 1;
        };
        case null {};
      };
    });
    let avgMs = if (completedCount == 0) 0
      else (totalNs / completedCount).toNat() / 1_000_000;

    {
      totalListings        = totalListings;
      totalTrades          = totalTrades;
      tradesByToken        = tradesByToken;
      activeUsersLast30d   = activeUsers;
      disputeRatePct       = disputeRatePct;
      avgTradeCompletionMs = avgMs;
    };
  };

  // ─── Audit log ────────────────────────────────────────────────────────────

  public type AuditFilter = {
    actionFilter : ?Text;       // substring match on action field
    actorFilter  : ?Principal;
    targetFilter : ?Text;
  };

  /// Return a paginated slice of the audit log. Admin or moderator.
  public func getAuditLog(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    caller   : Principal,
    page     : Nat,
    pageSize : Nat,
    filter   : AuditFilter,
  ) : PagedResult<AuditEntry> {
    ignore _requireAdminOrMod(users, caller);
    let ps = if (pageSize == 0) 20 else pageSize;

    let filtered = auditLog.filter(func(e : AuditEntry) : Bool {
      let actionOk = switch (filter.actionFilter) {
        case (?af) e.action.contains(#text af);
        case null  true;
      };
      let actorOk = switch (filter.actorFilter) {
        case (?af) Principal.equal(e.actorId, af);
        case null  true;
      };
      let targetOk = switch (filter.targetFilter) {
        case (?tf) {
          switch (e.targetId) {
            case (?tid) tid.contains(#text tf);
            case null   false;
          };
        };
        case null true;
      };
      actionOk and actorOk and targetOk;
    });

    let total = filtered.size();
    let start = page * ps;
    let items = if (start >= total) [] else {
      let endExcl = if (start + ps > total) total else start + ps;
      filtered.sliceToArray(start, endExcl);
    };

    { items; totalCount = total; page; pageSize = ps };
  };

  // ─── User listing (admin/mod) ─────────────────────────────────────────────

  public type UserFilter = {
    roleFilter   : ?Types.UserRole;
    bannedFilter : ?Bool;
  };

  /// Return paginated user list. Admin or moderator.
  public func getAllUsers(
    users    : Map.Map<Types.UserId, Types.User>,
    caller   : Principal,
    page     : Nat,
    pageSize : Nat,
    filter   : UserFilter,
  ) : PagedResult<Types.UserProfile> {
    ignore _requireAdminOrMod(users, caller);
    let ps = if (pageSize == 0) 20 else pageSize;

    let all = List.fromIter<Types.User>(users.values());
    let filtered = all.filter(func(u : Types.User) : Bool {
      let roleOk = switch (filter.roleFilter) {
        case (?r)  u.role == r;
        case null  true;
      };
      let bannedOk = switch (filter.bannedFilter) {
        case (?b)  u.isBanned == b;
        case null  true;
      };
      roleOk and bannedOk;
    });

    let total = filtered.size();
    let start = page * ps;
    let items = if (start >= total) [] else {
      let endExcl = if (start + ps > total) total else start + ps;
      let slice = filtered.sliceToArray(start, endExcl);
      slice.map(Auth.toProfile);
    };

    { items; totalCount = total; page; pageSize = ps };
  };

  // ─── System settings ──────────────────────────────────────────────────────

  /// Whether explorer API credentials are configured (never returns key values).
  public func getExplorerApiKeyStatus(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    caller   : Principal,
  ) : {
    tronGridConfigured : Bool;
    bscScanConfigured  : Bool;
    infuraConfigured   : Bool;
  } {
    ignore _requireAdminOrMod(users, caller);
    {
      tronGridConfigured = settings.tronGridApiKey != "";
      bscScanConfigured  = settings.bscScanApiKey != "";
      infuraConfigured   = settings.infuraApiKey != "";
    };
  };

  /// Read current system settings. Admin or moderator.
  public func getSystemSettings(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    caller   : Principal,
  ) : {
    minTradeAmountUSD      : Nat;
    paymentTimeoutHours    : Nat;
    allowedTokens          : [Types.TradeToken];
    maxListingPriceUSD     : Nat;
    cyclesBalanceThreshold : Nat;
    errorRateThreshold     : Float;
  } {
    ignore _requireAdminOrMod(users, caller);
    {
      minTradeAmountUSD      = settings.minTradeAmountUSD;
      paymentTimeoutHours    = settings.paymentTimeoutHours;
      allowedTokens          = settings.allowedTokens;
      maxListingPriceUSD     = settings.maxListingPriceUSD;
      cyclesBalanceThreshold = settings.cyclesBalanceThreshold;
      errorRateThreshold     = settings.errorRateThreshold;
    };
  };

  /// Update system settings. Admin only.
  public func updateSystemSettings(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    minTradeAmountUSD      : Nat,
    paymentTimeoutHours    : Nat,
    allowedTokens          : [Types.TradeToken],
    maxListingPriceUSD     : Nat,
    cyclesBalanceThreshold : Nat,
    errorRateThreshold     : Float,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (allowedTokens.size() == 0) Runtime.trap("allowedTokens cannot be empty");
    settings.minTradeAmountUSD        := minTradeAmountUSD;
    settings.paymentTimeoutHours      := paymentTimeoutHours;
    settings.allowedTokens            := allowedTokens;
    settings.maxListingPriceUSD       := maxListingPriceUSD;
    settings.cyclesBalanceThreshold   := cyclesBalanceThreshold;
    settings.errorRateThreshold       := errorRateThreshold;
    _appendAudit(
      auditLog, nextId,
      "updateSystemSettings", caller, null,
      "Settings updated: minTrade=" # debug_show(minTradeAmountUSD)
        # " timeout=" # debug_show(paymentTimeoutHours) # "h"
        # " maxPrice=" # debug_show(maxListingPriceUSD)
        # " cyclesThreshold=" # debug_show(cyclesBalanceThreshold)
        # " errorRateThreshold=" # debug_show(errorRateThreshold),
    );
  };

  /// Set Nova Poshta API key. Admin only.
  public func setNovaPoshtaApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.novaPoshtaApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setNovaPoshtaApiKey", caller, null,
      "Nova Poshta API key cleared.",
    );
  };

  /// Set Ukrposhta API key. Admin only.
  public func setUkrPoshtaApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.ukrPoshtaApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setUkrPoshtaApiKey", caller, null,
      "Ukrposhta API key cleared.",
    );
  };

  /// Set Meest Express API key. Admin only.
  public func setMeestApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.meestApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setMeestApiKey", caller, null,
      "Meest Express API key cleared.",
    );
  };

  /// Set TronGrid API key for TRC20 verification. Admin only.
  public func setTronGridApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.tronGridApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setTronGridApiKey", caller, null,
      "TronGrid API key cleared.",
    );
  };

  /// Set BSCScan API key for BEP20 verification. Admin only.
  public func setBscScanApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.bscScanApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setBscScanApiKey", caller, null,
      "BSCScan API key cleared.",
    );
  };

  /// Set Infura API key for ERC20/Polygon/Avalanche verification. Admin only.
  public func setInfuraApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.infuraApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setInfuraApiKey", caller, null,
      "Infura API key cleared.",
    );
  };

  /// Set Solana RPC URL for SPL verification. Admin only.
  public func setSolanaRpcUrl(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    url      : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (url.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.solanaRpcUrl := url;
    _appendAudit(
      auditLog, nextId,
      "setSolanaRpcUrl", caller, null,
      "Solana RPC URL cleared.",
    );
  };

  /// Set Polygon API key for USDT/USDC Polygon verification. Admin only.
  public func setPolygonApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.polygonApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setPolygonApiKey", caller, null,
      "Polygon API key cleared.",
    );
  };

  /// Set Avalanche API key for USDT/USDC Avalanche verification. Admin only.
  public func setAvalancheApiKey(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    apiKey   : Text,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    if (apiKey.size() > 0) Runtime.trap(SECRET_STORAGE_DISABLED_MSG);
    settings.avalancheApiKey := apiKey;
    _appendAudit(
      auditLog, nextId,
      "setAvalancheApiKey", caller, null,
      "Avalanche API key cleared.",
    );
  };

  /// Update Gate C checklist fields. Admin only (E9.S6).
  public func updateGateCChecklist(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    testnetE2ePassed : ?Bool,
    rollbackTestsPassed : ?Bool,
    subaccountDesignReviewed : ?Bool,
    betaCapsConfigured : ?Bool,
    ckBetaCapUsdCents : ?Nat,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    switch (testnetE2ePassed) {
      case (?v) settings.gateCTestnetE2ePassed := v;
      case null {};
    };
    switch (rollbackTestsPassed) {
      case (?v) settings.gateCRollbackTestsPassed := v;
      case null {};
    };
    switch (subaccountDesignReviewed) {
      case (?v) settings.gateCSubaccountDesignReviewed := v;
      case null {};
    };
    switch (betaCapsConfigured) {
      case (?v) settings.gateCBetaCapsConfigured := v;
      case null {};
    };
    switch (ckBetaCapUsdCents) {
      case (?cap) {
        if (cap == 0) Runtime.trap("ck beta cap must be > 0");
        settings.ckOnChainBetaCapUsdCents := cap;
      };
      case null {};
    };
    _appendAudit(
      auditLog, nextId,
      "updateGateCChecklist", caller, null,
      "gateC checklist updated; complete="
        # debug_show(isGateCChecklistComplete(settings)),
    )
  };

  /// Enable or disable on-chain ICRC escrow (Gate C). Admin only.
  /// Enable requires complete checklist + non-empty security sign-off ref (E9.S6).
  public func setTrustlessEscrowEnabled(
    users    : Map.Map<Types.UserId, Types.User>,
    settings : SystemSettings,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    enabled  : Bool,
    securitySignOffRef : Text,
  ) : Types.Result<Nat> {
    ignore _requireAdmin(users, caller);
    if (enabled) {
      if (securitySignOffRef.size() == 0) {
        return #err(#invalid_input(
          "Security sign-off reference required to enable Gate C"
        ));
      };
      if (not isGateCChecklistComplete(settings)) {
        return #err(#invalid_input(
          "Gate C checklist incomplete — enable rejected"
        ));
      };
      settings.gateCSecuritySignOffRef := securitySignOffRef;
    };
    settings.trustlessEscrowEnabled := enabled;
    let detail = if (enabled) {
      "trustlessEscrowEnabled=true; securitySignOffRef=" # securitySignOffRef
        # "; ckBetaCapUsdCents=" # debug_show(settings.ckOnChainBetaCapUsdCents)
    } else {
      "trustlessEscrowEnabled=false; in-flight ck trades may complete under prior rules"
    };
    #ok(_appendAudit(
      auditLog, nextId,
      "setTrustlessEscrowEnabled", caller, null,
      detail,
    ))
  };

  /// Assign optional KYC tier (Phase 1 admin manual; provider flow Phase 3). Admin only.
  public func setUserKycTier(
    users    : Map.Map<Types.UserId, Types.User>,
    auditLog : List.List<AuditEntry>,
    nextId   : Nat,
    caller   : Principal,
    target   : Types.UserId,
    tier     : Types.KycTier,
  ) : Nat {
    ignore _requireAdmin(users, caller);
    switch (users.get(target)) {
      case null Runtime.trap("user not found");
      case (?user) {
        user.kycTier := tier;
        _appendAudit(
          auditLog, nextId,
          "setUserKycTier", caller, ?target.toText(),
          "kycTier=" # debug_show(tier),
        );
      };
    };
  };

}
