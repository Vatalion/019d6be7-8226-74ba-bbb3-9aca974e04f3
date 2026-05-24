import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types";

/// Disputes — domain logic for the dispute lifecycle.
/// All functions are pure (no side effects) — they operate on injected state.
module {

  // 7 days in nanoseconds
  let APPEAL_WINDOW_NS : Nat = 604_800_000_000_000;

  /// E6.S9 L1 SLA — physical 24h (D-031).
  let L1_SLA_PHYSICAL_NS : Nat = 86_400_000_000_000;
  /// E6.S9 L1 SLA — digital 6h (D-031).
  let L1_SLA_DIGITAL_NS : Nat = 21_600_000_000_000;
  /// E6.S9 L2 moderator triage target max 12h (D-032).
  let L2_TRIAGE_MAX_NS : Nat = 43_200_000_000_000;
  /// E6.S9 L2 moderator decision target max 72h (D-032).
  let L2_DECISION_MAX_NS : Nat = 259_200_000_000_000;

  public func emptyEvidencePack() : Types.DisputeEvidencePack {
    {
      ttnScreenshotUrl  = null;
      packagePhotoUrls  = [];
      chatThreadLink    = null;
      fileHash          = null;
      downloadTimestamp = 0;
    }
  };

  /// True when trade status blocks payout / auto-complete (E6.S9 freeze scope).
  public func isDisputeFrozenTradeStatus(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#disputed or #dispute_l1 or #dispute_l2) true;
      case (_) false;
    }
  };

  /// Manual trades update immediately; ICRC trades stay frozen until on-chain settlement.
  func applyDisputeTradeOutcome(
    trade : Types.Trade,
    outcome : Types.ResolutionOutcome,
  ) {
    switch (trade.escrowAccount) {
      case null {
        switch (outcome) {
          case (#seller_wins) { trade.status := #complete };
          case (#buyer_wins)  { trade.status := #refunded };
          case (#split)       { trade.status := #complete };
        };
      };
      case (?_) {};
    };
  };

  func tradeKindFromTrade(trade : Types.Trade) : Types.DisputeTradeKind {
    switch (trade.digitalDelivery) {
      case (?_) #digital;
      case null #physical;
    }
  };

  func l1SlaNs(kind : Types.DisputeTradeKind) : Nat {
    switch (kind) {
      case (#physical) L1_SLA_PHYSICAL_NS;
      case (#digital) L1_SLA_DIGITAL_NS;
    }
  };

  func isPostFulfillmentDisputeEligible(trade : Types.Trade) : Bool {
    switch (tradeKindFromTrade(trade)) {
      case (#digital) trade.status == #digital_delivered;
      case (#physical) {
        switch (trade.status) {
          case (#shipped or #awaiting_receipt) true;
          case (_) false;
        };
      };
    }
  };

  /// Returns error message when evidence pack fails checklist; null when valid.
  public func validateEvidencePack(
    kind         : Types.DisputeTradeKind,
    pack         : Types.DisputeEvidencePack,
    attachments  : [Types.MediaAttachment],
  ) : ?Text {
    switch (kind) {
      case (#physical) {
        switch (pack.ttnScreenshotUrl) {
          case null return ?"TTN screenshot is required for physical disputes";
          case (?url) if (url.size() == 0) return ?"TTN screenshot is required for physical disputes";
          case (_) {};
        };
        let photoCount = pack.packagePhotoUrls.size() + attachments.filter(
          func(a : Types.MediaAttachment) : Bool {
            Text.startsWith(a.mimeType, #text "image/")
          },
        ).size();
        if (photoCount < 2) {
          return ?"At least 2 package photos are required for physical disputes";
        };
        switch (pack.chatThreadLink) {
          case null return ?"Chat export link is required for physical disputes";
          case (?link) if (link.size() == 0) return ?"Chat export link is required for physical disputes";
          case (_) {};
        };
        null
      };
      case (#digital) {
        switch (pack.fileHash) {
          case null return ?"File hash is required for digital disputes";
          case (?hash) if (hash.size() == 0) return ?"File hash is required for digital disputes";
          case (_) {};
        };
        if (pack.downloadTimestamp == 0) return ?"Download timestamp is required for digital disputes";
        null
      };
    }
  };

  public func computeSlaFlags(dispute : Types.Dispute, now : Types.Timestamp) : Types.DisputeSlaFlags {
    let l1Overdue = dispute.status == #opened and now > dispute.l1SlaDeadline;
    let l2TriageOverdue = switch (dispute.l2TriageDeadline) {
      case null false;
      case (?d) dispute.status == #l2_queued and now > d;
    };
    let l2DecisionOverdue = switch (dispute.l2DecisionDeadline) {
      case null false;
      case (?d) dispute.status == #l2_queued and now > d;
    };
    { l1SlaOverdue = l1Overdue; l2TriageOverdue = l2TriageOverdue; l2DecisionOverdue = l2DecisionOverdue }
  };

  func freezeTradeForDispute(trade : Types.Trade, level : Types.DisputeLevel) : () {
    trade.payoutWalletHeld := true;
    trade.status := switch (level) {
      case (#l1) #dispute_l1;
      case (#l2) #dispute_l2;
    };
  };

  func activateL2(dispute : Types.Dispute, trade : Types.Trade, now : Types.Timestamp) : () {
    dispute.level := #l2;
    dispute.status := #l2_queued;
    dispute.l2QueuedAt := ?now;
    dispute.l2TriageDeadline := ?(now + L2_TRIAGE_MAX_NS);
    dispute.l2DecisionDeadline := ?(now + L2_DECISION_MAX_NS);
    freezeTradeForDispute(trade, #l2);
  };

  /// Jury voting deadline in hours (public constant for API layer).
  public let JURY_VOTE_DEADLINE_HOURS : Nat = 72;

  // Jury voting deadline: 72 hours in nanoseconds (72 * 3_600_000_000_000)
  let JURY_DEADLINE_NS : Nat = 259_200_000_000_000;

  // Minimum stake for juror registration (in USDT, stored as Float)
  let MIN_JUROR_STAKE : Float = 10.0;

  // Required jurors per dispute
  let JURY_SIZE : Nat = 3;

  /// Minimum jurors required to form a valid jury panel.
  public let MIN_JURORS : Nat = 3;

  // ─── Consensus ────────────────────────────────────────────────────────────

  /// Returns the number of votes required for a simple majority: floor(votesCast/2) + 1.
  public func consensusThreshold(votesCast : Nat) : Nat {
    votesCast / 2 + 1
  };

  // ─── Guards ───────────────────────────────────────────────────────────────

  /// Traps if caller is anonymous.
  public func assertNotAnonymous(caller : Principal) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("anonymous caller not allowed");
    };
  };

  /// Returns true if caller is a trade participant (buyer or seller).
  public func isParticipant(trade : Types.Trade, caller : Principal) : Bool {
    Principal.equal(trade.buyer, caller) or Principal.equal(trade.seller, caller)
  };

  /// Mirrors Auth.canActAsModerator — local copy avoids Auth→Escrow→Disputes import cycle.
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

  func canActAsModerator(
    users : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Bool {
    switch (users.get(caller)) {
      case (?u) isActiveModerator(u);
      case null false;
    };
  };

  func isAssignedJuror(
    juryMap : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    disputeId : Types.DisputeId,
    caller : Principal,
  ) : Bool {
    switch (juryMap.get(disputeId)) {
      case (?a) {
        for (j in a.jurorIds.vals()) {
          if (Principal.equal(j, caller)) return true;
        };
        false
      };
      case null false;
    };
  };

  func canAccessDispute(
    dispute : Types.Dispute,
    trades : Map.Map<Types.TradeId, Types.Trade>,
    juryMap : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    users : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Bool {
    if (Principal.equal(dispute.initiator, caller)) return true;
    if (canActAsModerator(users, caller)) return true;
    if (isAssignedJuror(juryMap, dispute.id, caller)) return true;
    switch (trades.get(dispute.trade)) {
      case (?t) isParticipant(t, caller);
      case null false;
    };
  };

  func canAccessDisputeJurors(
    dispute : Types.Dispute,
    trades : Map.Map<Types.TradeId, Types.Trade>,
    users : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Bool {
    if (canActAsModerator(users, caller)) return true;
    switch (trades.get(dispute.trade)) {
      case (?t) isParticipant(t, caller);
      case null false;
    };
  };

  // ─── Open dispute ─────────────────────────────────────────────────────────

  /// Buyer or seller opens a dispute on a trade (E6.S9 playbook).
  /// Post-fulfillment only: physical post-shipment or digital post-delivery.
  /// Complete evidence activates L1 + payout freeze; incomplete evidence saves #draft only.
  public func openDispute(
    disputes     : Map.Map<Types.DisputeId, Types.Dispute>,
    trades       : Map.Map<Types.TradeId, Types.Trade>,
    nextId       : Nat,
    caller       : Principal,
    tradeId      : Types.TradeId,
    reason       : Types.DisputeReason,
    description  : Text,
    evidencePack : Types.DisputeEvidencePack,
    attachments  : [Types.MediaAttachment],
  ) : Types.Result<Types.DisputeId> {
    assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    if (not isParticipant(trade, caller)) {
      return #err(#unauthorized);
    };

    if (not isPostFulfillmentDisputeEligible(trade)) {
      return #err(#invalid_input(
        "dispute requires post-shipment physical or post-delivery digital trade state"
      ));
    };

    if (isDisputeFrozenTradeStatus(trade.status)) {
      return #err(#dispute_already_open);
    };

    let kind = tradeKindFromTrade(trade);
    let validationErr = validateEvidencePack(kind, evidencePack, attachments);
    let now = Types.now();

    // Upsert draft for same trade + initiator when evidence incomplete
    for (entry in disputes.entries()) {
      let (id, d) = entry;
      if (d.trade == tradeId and Principal.equal(d.initiator, caller) and d.status == #draft) {
        d.reason := reason;
        d.description := description;
        d.evidencePack := evidencePack;
        d.evidenceAttachments := attachments;
        d.tradeKind := kind;
        switch (validationErr) {
          case (?msg) return #err(#invalid_input(msg));
          case null {};
        };
        d.status := #opened;
        d.level := #l1;
        d.l1SlaDeadline := now + l1SlaNs(kind);
        freezeTradeForDispute(trade, #l1);
        return #ok(id);
      };
    };

    // Block second active dispute on trade
    for (entry in disputes.entries()) {
      let (_, d) = entry;
      if (d.trade == tradeId and d.status != #draft and d.status != #resolved) {
        return #err(#dispute_already_open);
      };
    };

    let l1Deadline = now + l1SlaNs(kind);
    let dispute : Types.Dispute = {
      id             = nextId;
      trade          = tradeId;
      initiator      = caller;
      var reason         = reason;
      var description  = description;
      var evidenceUrls = [];
      var evidenceAttachments = attachments;
      var status       = #draft;
      var resolution   = null;
      createdAt        = now;
      var resolvedAt   = null;
      var moderatorNotes = [];
      var level                = #l1;
      var tradeKind            = kind;
      var evidencePack         = evidencePack;
      var l1SlaDeadline        = l1Deadline;
      var l2QueuedAt           = null;
      var l2TriageDeadline     = null;
      var l2DecisionDeadline   = null;
    };

    switch (validationErr) {
      case (?msg) {
        disputes.add(nextId, dispute);
        #err(#invalid_input(msg))
      };
      case null {
        dispute.status := #opened;
        freezeTradeForDispute(trade, #l1);
        disputes.add(nextId, dispute);
        #ok(nextId)
      };
    }
  };

  /// Creates a system L1 dispute when the seller misses the physical ship-by SLA.
  /// Escrow.checkShipByDeadlines has already frozen the trade, so this path must not
  /// reuse openDispute's post-fulfillment status checks.
  public func attachSystemShipBySlaDispute(
    disputes : Map.Map<Types.DisputeId, Types.Dispute>,
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    nextId   : Nat,
    tradeId  : Types.TradeId,
  ) : ?Types.DisputeId {
    let trade = switch (trades.get(tradeId)) {
      case (?t) t;
      case null return null;
    };

    switch (trade.status) {
      case (#dispute_l1 or #disputed) {};
      case (_) return null;
    };

    for (entry in disputes.entries()) {
      let (_, dispute) = entry;
      if (dispute.trade == tradeId and dispute.status != #draft and dispute.status != #resolved) {
        return null;
      };
    };

    let now = Types.now();
    let dispute : Types.Dispute = {
      id = nextId;
      trade = tradeId;
      initiator = trade.buyer;
      var reason = #seller_unresponsive;
      var description = "System dispute: seller missed the ship-by SLA without a valid tracking number.";
      var evidenceUrls = [];
      var evidenceAttachments = [];
      var status = #opened;
      var resolution = null;
      createdAt = now;
      var resolvedAt = null;
      var moderatorNotes = ["[SYSTEM] Ship-by SLA expired without TTN; payout frozen."];
      var level = #l1;
      var tradeKind = #physical;
      var evidencePack = emptyEvidencePack();
      var l1SlaDeadline = now + L1_SLA_PHYSICAL_NS;
      var l2QueuedAt = null;
      var l2TriageDeadline = null;
      var l2DecisionDeadline = null;
    };

    freezeTradeForDispute(trade, #l1);
    disputes.add(nextId, dispute);
    ?nextId
  };

  /// Party escalates L1 → L2 moderator queue (E6.S9 AC 2).
  public func escalateDisputeToL2(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    caller    : Principal,
    disputeId : Types.DisputeId,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    if (not isParticipant(trade, caller)) {
      return #err(#unauthorized);
    };

    switch (dispute.status) {
      case (#opened) {};
      case _ return #err(#invalid_input("dispute must be in L1 (#opened) to escalate"));
    };

    activateL2(dispute, trade, Types.now());
    #ok(())
  };

  /// Auto-escalate L1 disputes past SLA to L2 (E6.S9 AC 7 / W2-8).
  public func processL1SlaEscalations(
    disputes : Map.Map<Types.DisputeId, Types.Dispute>,
    trades   : Map.Map<Types.TradeId, Types.Trade>,
  ) : Nat {
    let now = Types.now();
    var count = 0;
    for ((disputeId, dispute) in disputes.entries()) {
      if (dispute.status == #opened and now > dispute.l1SlaDeadline) {
        switch (trades.get(dispute.trade)) {
          case null {};
          case (?trade) {
            activateL2(dispute, trade, now);
            count += 1;
          };
        };
      };
    };
    count
  };

  // ─── Set under review (+ auto-assign jurors) ─────────────────────────────

  /// Moderator transitions a dispute from #opened → #under_review
  /// and automatically assigns 3 jurors from the pool.
  public func setDisputeUnderReview(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    users     : Map.Map<Types.UserId, Types.User>,
    jurors    : Map.Map<Principal, Types.JurorEntry>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    caller    : Principal,
    disputeId : Types.DisputeId,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let moderator = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(moderator)) {
      return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    switch (dispute.status) {
      case (#opened) {};
      case _ return #err(#invalid_input("dispute must be in #opened status to move under review"));
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    // Attempt jury assignment — if pool is too small, escalate to admin instead of proceeding silently
    switch (assignJurors(jurors, juryMap, dispute, trade)) {
      case (#ok(())) {
        dispute.status := #under_review;
      };
      case (#err(_)) {
        dispute.status := #escalated_to_admin;
        return #err(#invalid_input("Not enough jurors available. Dispute escalated to admin review."));
      };
    };

    #ok(())
  };

  // ─── Add evidence ─────────────────────────────────────────────────────────

  /// Trade participant adds evidence (media attachments) to an open/under_review dispute.
  /// New uploads go to evidenceAttachments; backward compat evidenceUrls field unchanged.
  public func addEvidence(
    disputes             : Map.Map<Types.DisputeId, Types.Dispute>,
    trades               : Map.Map<Types.TradeId, Types.Trade>,
    caller               : Principal,
    disputeId            : Types.DisputeId,
    evidenceAttachments  : [Types.MediaAttachment],
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    if (not isParticipant(trade, caller)) {
      return #err(#unauthorized);
    };

    switch (dispute.status) {
      case (#draft or #opened or #l2_queued or #under_review) {};
      case _ return #err(#invalid_input("dispute must be draft, opened, l2_queued, or under_review to add evidence"));
    };

    // Append new rich attachments (evidenceUrls kept for backward compat; not modified here)
    dispute.evidenceAttachments := dispute.evidenceAttachments.concat(evidenceAttachments);

    #ok(())
  };

  // ─── Resolve dispute ──────────────────────────────────────────────────────

  /// Moderator or admin resolves the dispute.
  /// Updates trade status based on outcome: seller_wins → #complete, buyer_wins → #refunded.
  public func resolveDispute(
    disputes   : Map.Map<Types.DisputeId, Types.Dispute>,
    trades     : Map.Map<Types.TradeId, Types.Trade>,
    users      : Map.Map<Types.UserId, Types.User>,
    caller     : Principal,
    disputeId  : Types.DisputeId,
    outcome    : Types.ResolutionOutcome,
    notes      : Text,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let moderator = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(moderator)) {
      return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    switch (dispute.status) {
      case (#opened or #under_review or #l2_queued or #escalated_to_admin) {};
      case (#draft) return #err(#invalid_input("dispute is still draft — complete evidence checklist first"));
      case (#resolved) return #ok(());
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    if (dispute.status == #opened) {
      return #err(#invalid_input("dispute must be escalated to L2 before moderator resolution"));
    };

    let now = Types.now();

    dispute.status     := #resolved;
    dispute.resolvedAt := ?now;
    dispute.resolution := ?{
      outcome    = outcome;
      notes      = notes;
      resolvedBy = caller;
    };

    applyDisputeTradeOutcome(trade, outcome);

    #ok(())
  };

  // ─── Add moderator note ───────────────────────────────────────────────────

  /// Internal note visible only to moderators/admins.
  public func addModeratorNote(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    disputeId : Types.DisputeId,
    note      : Text,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let moderator = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(moderator)) {
      return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    let stamped = "[" # caller.toText() # "] " # note;
    dispute.moderatorNotes := dispute.moderatorNotes.concat([stamped]);

    #ok(())
  };

  // ─── Reopen / appeal ──────────────────────────────────────────────────────

  /// Moderator reopens a resolved dispute (within 7-day appeal window).
  public func reopenDispute(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    disputeId : Types.DisputeId,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let moderator = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(moderator)) {
      return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    switch (dispute.status) {
      case (#resolved) {};
      case _ return #err(#invalid_input("only resolved disputes can be reopened"));
    };

    let resolvedAt = switch (dispute.resolvedAt) {
      case (?t) t;
      case null return #err(#invalid_input("dispute has no resolvedAt timestamp"));
    };

    let now = Types.now();
    if (now - resolvedAt > APPEAL_WINDOW_NS) {
      return #err(#invalid_input("appeal window (7 days) has expired"));
    };

    // Revert to under_review and clear resolution
    dispute.status     := #under_review;
    dispute.resolvedAt := null;
    dispute.resolution := null;

    // Restore trade to #disputed
    switch (trades.get(dispute.trade)) {
      case (?t) { freezeTradeForDispute(t, dispute.level) };
      case null {};
    };

    #ok(())
  };

  /// Trade participant appeals a resolved dispute (within 7 days).
  /// Transitions status back to #under_review.
  public func appealDispute(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    caller    : Principal,
    disputeId : Types.DisputeId,
    reason    : Text,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    if (not isParticipant(trade, caller)) {
      return #err(#unauthorized);
    };

    switch (dispute.status) {
      case (#resolved) {};
      case _ return #err(#invalid_input("only resolved disputes can be appealed"));
    };

    let resolvedAt = switch (dispute.resolvedAt) {
      case (?t) t;
      case null return #err(#invalid_input("dispute has no resolvedAt timestamp"));
    };

    let now = Types.now();
    if (now - resolvedAt > APPEAL_WINDOW_NS) {
      return #err(#invalid_input("appeal window (7 days) has expired"));
    };

    dispute.status     := #under_review;
    dispute.resolvedAt := null;
    dispute.resolution := null;

    let note = "[APPEAL by " # caller.toText() # "] " # reason;
    dispute.moderatorNotes := dispute.moderatorNotes.concat([note]);

    switch (trades.get(dispute.trade)) {
      case (?t) { freezeTradeForDispute(t, dispute.level) };
      case null {};
    };

    #ok(())
  };

  // ─── Jury pool ────────────────────────────────────────────────────────────

  /// Register the caller as a juror. Minimum stake: 10 USDT equivalent.
  public func registerAsJuror(
    jurors : Map.Map<Principal, Types.JurorEntry>,
    caller : Principal,
    stake  : Float,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    if (stake < MIN_JUROR_STAKE) {
      return #err(#invalid_input("minimum stake is 10 USDT equivalent"));
    };

    if (jurors.containsKey(caller)) {
      return #err(#already_exists);
    };

    let entry : Types.JurorEntry = {
      principal            = caller;
      stakedAmount         = stake;
      var activeDisputeIds = [];
      var resolvedCount    = 0;
      var successRate      = 0.0;
      var registeredAt     = Types.now();
    };

    jurors.add(caller, entry);
    #ok(())
  };

  /// Unregister a juror — only allowed if no active disputes assigned.
  public func unregisterJuror(
    jurors : Map.Map<Principal, Types.JurorEntry>,
    caller : Principal,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let entry = switch (jurors.get(caller)) {
      case (?e) e;
      case null return #err(#not_found);
    };

    if (entry.activeDisputeIds.size() > 0) {
      return #err(#invalid_input("cannot unregister while assigned to active disputes"));
    };

    jurors.remove(caller);
    #ok(())
  };

  /// Deterministically select up to JURY_SIZE jurors from the pool,
  /// excluding both trade participants. Uses disputeId as a simple seed.
  public func assignJurors(
    jurors    : Map.Map<Principal, Types.JurorEntry>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    dispute   : Types.Dispute,
    trade     : Types.Trade,
  ) : Types.Result<()> {
    // Build eligible juror list
    let eligible = List.empty<Principal>();
    for ((p, _entry) in jurors.entries()) {
      let isBuyer  = Principal.equal(p, trade.buyer);
      let isSeller = Principal.equal(p, trade.seller);
      if (not isBuyer and not isSeller) {
        eligible.add(p);
      };
    };

    if (eligible.size() < JURY_SIZE) {
      return #err(#invalid_input("not enough jurors in the pool (minimum 3 required)"));
    };

    // Deterministic pseudo-random selection via dispute id modulo
    let total = eligible.size();
    let seed  = dispute.id;

    let selected = List.empty<Principal>();
    var attempts = 0;
    while (selected.size() < JURY_SIZE and attempts < total) {
      let idx = (seed + attempts) % total;
      let p   = eligible.at(idx);
      if (not selected.contains(p)) {
        selected.add(p);
      };
      attempts += 1;
    };

    if (selected.size() < JURY_SIZE) {
      return #err(#invalid_input("could not select enough jurors"));
    };

    let now      = Types.now();
    let deadline = now + JURY_DEADLINE_NS;
    let jurorArr = selected.toArray();

    let assignment : Types.JuryAssignment = {
      disputeId    = dispute.id;
      var jurorIds = jurorArr;
      var votes    = [];
      var deadline = deadline;
    };

    juryMap.add(dispute.id, assignment);

    // Update activeDisputeIds for each assigned juror
    let disputeIdText = debug_show(dispute.id);
    for (p in jurorArr.values()) {
      switch (jurors.get(p)) {
        case (?entry) {
          entry.activeDisputeIds := entry.activeDisputeIds.concat([disputeIdText]);
        };
        case null {};
      };
    };

    #ok(())
  };

  /// Submit a juror's vote on a dispute.
  /// - Only assigned jurors may vote.
  /// - One vote per juror per dispute.
  /// - Validates that the jury deadline has not passed before recording.
  /// - After each vote, checks for majority consensus and auto-resolves immediately
  ///   when consensusThreshold is reached (does not wait for all votes).
  /// - If all votes cast with no majority, escalates to admin (tie handling).
  public func submitJurorVote(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    jurors    : Map.Map<Principal, Types.JurorEntry>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    caller    : Principal,
    disputeId : Types.DisputeId,
    vote      : Types.JurorVoteChoice,
    reasoning : Text,
  ) : Types.Result<()> {
    assertNotAnonymous(caller);

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    switch (dispute.status) {
      case (#under_review) {};
      case _ return #err(#invalid_input("dispute is not under review"));
    };

    let assignment = switch (juryMap.get(disputeId)) {
      case (?a) a;
      case null return #err(#not_found);
    };

    // Validate deadline BEFORE recording the vote
    let now = Types.now();
    if (now > assignment.deadline) {
      return #err(#invalid_input("Jury voting deadline has passed"));
    };

    // Check caller is assigned juror
    let isAssigned = assignment.jurorIds.find(func(p : Principal) : Bool {
      Principal.equal(p, caller)
    });
    if (isAssigned == null) {
      return #err(#unauthorized);
    };

    // Check not already voted
    let alreadyVoted = assignment.votes.find(func(v : Types.JurorVote) : Bool {
      Principal.equal(v.jurorPrincipal, caller)
    });
    if (alreadyVoted != null) {
      return #err(#invalid_input("juror has already voted on this dispute"));
    };

    let newVote : Types.JurorVote = {
      jurorPrincipal = caller;
      vote           = vote;
      timestamp      = now;
      reasoning      = reasoning;
    };

    assignment.votes := assignment.votes.concat([newVote]);

    // Check for consensus after EVERY vote — auto-resolve immediately when threshold hit
    let totalAssigned = assignment.jurorIds.size();
    let totalVotes    = assignment.votes.size();
    let threshold     = consensusThreshold(totalAssigned);

    let buyerWinsCount = assignment.votes.foldLeft(
      0,
      func(acc : Nat, v : Types.JurorVote) : Nat {
        if (v.vote == #buyerWins) acc + 1 else acc
      },
    );
    let sellerWinsCount = totalVotes - buyerWinsCount : Nat;

    if (buyerWinsCount >= threshold) {
      // Majority for buyer — auto-resolve immediately
      _applyJuryVerdict(disputes, trades, jurors, juryMap, dispute, #buyer_wins, buyerWinsCount, totalAssigned);
    } else if (sellerWinsCount >= threshold) {
      // Majority for seller — auto-resolve immediately
      _applyJuryVerdict(disputes, trades, jurors, juryMap, dispute, #seller_wins, sellerWinsCount, totalAssigned);
    } else if (totalVotes == totalAssigned) {
      // All votes cast, no majority reached (tie) — escalate to admin
      dispute.status := #escalated_to_admin;
      _clearJurorActiveDispute(jurors, assignment.jurorIds, disputeId);
    };

    #ok(())
  };

  // ─── Cross-collateral seizure ─────────────────────────────────────────────

  /// Seize cross-collateral from a seller with negative reputation (negative liability).
  /// If sellerReputationScore < 0, the escrowed amount is added to the reserve fund
  /// and the seizure is documented in the dispute notes.
  /// Returns true if collateral was seized, false if seller has no negative liability.
  public func seizeCrossCollateral(
    tradeId               : Nat,
    sellerPrincipal       : Principal,
    sellerReputationScore : Int,
    escrowAmount          : Nat,
    reserve               : { var value : Nat },
    disputeNotes          : { var value : Text },
  ) : Bool {
    if (sellerReputationScore < 0) {
      reserve.value := reserve.value + escrowAmount;
      let note = "Cross-collateral seized: " # escrowAmount.toText() #
        " from trade " # tradeId.toText() #
        " (seller: " # sellerPrincipal.toText() #
        ", negative liability: " # sellerReputationScore.toText() # ")";
      disputeNotes.value := disputeNotes.value # "\n" # note;
      return true;
    };
    false
  };

  // ─── Private jury helpers ─────────────────────────────────────────────────

  /// Apply the jury consensus verdict — resolves the dispute and updates juror stats.
  func _applyJuryVerdict(
    _disputes      : Map.Map<Types.DisputeId, Types.Dispute>,
    trades         : Map.Map<Types.TradeId, Types.Trade>,
    jurors         : Map.Map<Principal, Types.JurorEntry>,
    juryMap        : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    dispute        : Types.Dispute,
    outcome        : Types.ResolutionOutcome,
    consensusCount : Nat,
    totalAssigned  : Nat,
  ) {
    let now = Types.now();
    dispute.status     := #resolved;
    dispute.resolvedAt := ?now;
    dispute.resolution := ?{
      outcome    = outcome;
      notes      = "Resolved by jury majority (" # consensusCount.toText() # " of " # totalAssigned.toText() # " votes).";
      resolvedBy = Principal.anonymous(); // system-resolved
    };

    switch (trades.get(dispute.trade)) {
      case (?trade) { applyDisputeTradeOutcome(trade, outcome) };
      case null {};
    };

    // Update juror stats
    let assignment = switch (juryMap.get(dispute.id)) {
      case (?a) a;
      case null return;
    };

    // Determine winning vote variant
    let winningVote : Types.JurorVoteChoice = switch (outcome) {
      case (#buyer_wins)  #buyerWins;
      case (#seller_wins) #sellerWins;
      case (#split)       #sellerWins; // tie-breaking not used in practice
    };

    for (v in assignment.votes.values()) {
      switch (jurors.get(v.jurorPrincipal)) {
        case (?entry) {
          entry.resolvedCount += 1;
          // successRate = fraction of resolved disputes where juror voted with consensus
          let wasCorrect : Float = if (v.vote == winningVote) 1.0 else 0.0;
          let n = entry.resolvedCount.toFloat();
          entry.successRate := ((entry.successRate * (n - 1.0)) + wasCorrect) / n;
        };
        case null {};
      };
    };

    _clearJurorActiveDispute(jurors, assignment.jurorIds, dispute.id);
  };

  /// Remove disputeId from each juror's activeDisputeIds list.
  func _clearJurorActiveDispute(
    jurors    : Map.Map<Principal, Types.JurorEntry>,
    jurorIds  : [Principal],
    disputeId : Types.DisputeId,
  ) {
    let idText = debug_show(disputeId);
    for (p in jurorIds.values()) {
      switch (jurors.get(p)) {
        case (?entry) {
          entry.activeDisputeIds := entry.activeDisputeIds.filter(
            func(s : Text) : Bool { s != idText }
          );
        };
        case null {};
      };
    };
  };

  // ─── Jury deadline check ─────────────────────────────────────────────────

  /// If a dispute's jury deadline has passed and it is still #under_review
  /// (no consensus reached), escalate it to #escalated_to_admin.
  /// Returns true if the dispute was escalated, false otherwise.
  public func checkJuryDeadline(
    disputeId : Types.DisputeId,
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
  ) : Bool {
    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return false;
    };

    switch (dispute.status) {
      case (#under_review) {};
      case _ return false;
    };

    let assignment = switch (juryMap.get(disputeId)) {
      case (?a) a;
      case null return false;
    };

    let now = Types.now();
    if (now > assignment.deadline) {
      dispute.status := #escalated_to_admin;
      true
    } else {
      false
    }
  };

  // ─── Jury queries ─────────────────────────────────────────────────────────

  /// Returns all registered jurors with stats — admin only.
  public func getJuryPool(
    jurors : Map.Map<Principal, Types.JurorEntry>,
    users  : Map.Map<Types.UserId, Types.User>,
    caller : Principal,
  ) : Types.Result<[Types.JurorStats]> {
    let callerUser = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(callerUser)) {
      return #err(#unauthorized);
    };

    let stats = jurors.entries()
      .map(func(pair : (Principal, Types.JurorEntry)) : Types.JurorStats {
        let (_, e) = pair;
        {
          principal     = e.principal;
          stakedAmount  = e.stakedAmount;
          activeCount   = e.activeDisputeIds.size();
          resolvedCount = e.resolvedCount;
          successRate   = e.successRate;
          registeredAt  = e.registeredAt;
        }
      })
      .toArray();

    #ok(stats)
  };

  /// Returns the caller-juror's active cases with deadlines.
  public func getMyJurorDashboard(
    jurors    : Map.Map<Principal, Types.JurorEntry>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    caller    : Principal,
  ) : Types.Result<[Types.JurorDashboardEntry]> {
    assertNotAnonymous(caller);

    let entry = switch (jurors.get(caller)) {
      case (?e) e;
      case null return #err(#not_found);
    };

    let dashboard = List.empty<Types.JurorDashboardEntry>();

    for (idText in entry.activeDisputeIds.values()) {
      switch (Nat.fromText(idText)) {
        case (?disputeId) {
          switch (juryMap.get(disputeId)) {
            case (?assignment) {
              switch (disputes.get(disputeId)) {
                case (?d) {
                  let hasVoted = assignment.votes.find(
                    func(v : Types.JurorVote) : Bool {
                      Principal.equal(v.jurorPrincipal, caller)
                    }
                  ) != null;
                  let buyerVotes = assignment.votes.foldLeft(
                    0,
                    func(acc : Nat, v : Types.JurorVote) : Nat {
                      if (v.vote == #buyerWins) acc + 1 else acc
                    },
                  );
                  let sellerVotes = assignment.votes.foldLeft(
                    0,
                    func(acc : Nat, v : Types.JurorVote) : Nat {
                      if (v.vote == #sellerWins) acc + 1 else acc
                    },
                  );
                  dashboard.add({
                    disputeId   = disputeId;
                    tradeId     = d.trade;
                    reason      = d.reason;
                    deadline    = assignment.deadline;
                    hasVoted    = hasVoted;
                    buyerVotes  = buyerVotes;
                    sellerVotes = sellerVotes;
                    totalJurors = assignment.jurorIds.size();
                  });
                };
                case null {};
              };
            };
            case null {};
          };
        };
        case null {};
      };
    };

    #ok(dashboard.toArray())
  };

  /// Returns assigned jurors and their votes for a dispute.
  /// Votes are redacted (empty) until the dispute is resolved or escalated.
  public func getDisputeJurors(
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    disputeId : Types.DisputeId,
  ) : ?Types.JuryView {
    assertNotAnonymous(caller);

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return null;
    };

    if (not canAccessDisputeJurors(dispute, trades, users, caller)) {
      return null;
    };

    let assignment = switch (juryMap.get(disputeId)) {
      case (?a) a;
      case null return null;
    };

    let revealVotes = switch (dispute.status) {
      case (#resolved or #escalated_to_admin) true;
      case _ false;
    };

    ?{
      jurors   = assignment.jurorIds;
      votes    = if (revealVotes) assignment.votes else [];
      deadline = assignment.deadline;
    }
  };

  // ─── Queries ──────────────────────────────────────────────────────────────

  /// Returns a dispute by id, stripping moderatorNotes for non-moderators.
  public func getDispute(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    disputeId : Types.DisputeId,
  ) : ?Types.DisputeView {
    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return null;
    };

    if (not canAccessDispute(dispute, trades, juryMap, users, caller)) {
      return null;
    };

    let canSeeMod = canActAsModerator(users, caller);

    ?toView(dispute, juryMap, canSeeMod)
  };

  /// Returns all disputes for a given trade.
  public func getDisputesByTrade(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    tradeId   : Types.TradeId,
  ) : [Types.DisputeView] {
    let canSeeMod = canActAsModerator(users, caller);

    let trade = switch (trades.get(tradeId)) {
      case (?t) t;
      case null return [];
    };
    let isParty = isParticipant(trade, caller);

    disputes.entries()
      .filter(func(pair : (Types.DisputeId, Types.Dispute)) : Bool {
        let (_, d) = pair;
        if (d.trade != tradeId) return false;
        if (canSeeMod or isParty) return true;
        if (Principal.equal(d.initiator, caller)) return true;
        isAssignedJuror(juryMap, d.id, caller)
      })
      .map(func(pair : (Types.DisputeId, Types.Dispute)) : Types.DisputeView {
        let (_, d) = pair; toView(d, juryMap, canSeeMod)
      })
      .toArray()
  };

  /// Returns paginated open disputes queue for moderators/admins.
  public func getOpenDisputeQueue(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    offset    : Nat,
    limit     : Nat,
  ) : Types.Result<[Types.DisputeView]> {
    let moderator = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not isActiveModerator(moderator)) {
      return #err(#unauthorized);
    };

    let page = disputes.entries()
      .filter(func(pair : (Types.DisputeId, Types.Dispute)) : Bool {
        let (_, d) = pair;
        d.status == #opened or d.status == #l2_queued
          or d.status == #under_review or d.status == #escalated_to_admin
      })
      .map(func(pair : (Types.DisputeId, Types.Dispute)) : Types.DisputeView {
        let (_, d) = pair; toView(d, juryMap, true)
      })
      .drop(offset)
      .take(limit)
      .toArray();

    #ok(page)
  };

  /// Returns all disputes where the caller is initiator or trade participant.
  public func getMyDisputes(
    disputes  : Map.Map<Types.DisputeId, Types.Dispute>,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    caller    : Principal,
  ) : [Types.DisputeView] {
    disputes.entries()
      .filter(func(pair : (Types.DisputeId, Types.Dispute)) : Bool {
        let (_, d) = pair;
        Principal.equal(d.initiator, caller) or (
          switch (trades.get(d.trade)) {
            case (?t) isParticipant(t, caller);
            case null false;
          }
        )
      })
      .map(func(pair : (Types.DisputeId, Types.Dispute)) : Types.DisputeView {
        let (_, d) = pair; toView(d, juryMap, false)
      })
      .toArray()
  };

  // ─── View conversion ──────────────────────────────────────────────────────

  /// Converts internal Dispute to public DisputeView.
  /// Strips moderatorNotes unless canSeeMod is true.
  /// Jury votes redacted until resolved/escalated.
  public func toView(
    dispute   : Types.Dispute,
    juryMap   : Map.Map<Types.DisputeId, Types.JuryAssignment>,
    canSeeMod : Bool,
  ) : Types.DisputeView {
    let juryOpt : ?Types.JuryView = switch (juryMap.get(dispute.id)) {
      case (?a) {
        let revealVotes = switch (dispute.status) {
          case (#resolved or #escalated_to_admin) true;
          case _ false;
        };
        ?{
          jurors   = a.jurorIds;
          votes    = if (revealVotes) a.votes else [];
          deadline = a.deadline;
        }
      };
      case null null;
    };

    let now = Types.now();
    let slaFlags = computeSlaFlags(dispute, now);

    {
      id                  = dispute.id;
      trade               = dispute.trade;
      initiator           = dispute.initiator;
      reason              = dispute.reason;
      description         = dispute.description;
      evidenceUrls        = dispute.evidenceUrls;
      evidenceAttachments = dispute.evidenceAttachments;
      status              = dispute.status;
      resolution          = dispute.resolution;
      createdAt           = dispute.createdAt;
      resolvedAt          = Types.optNat(dispute.resolvedAt);
      moderatorNotes      = if (canSeeMod) dispute.moderatorNotes else [];
      jury                = juryOpt;
      level               = dispute.level;
      tradeKind           = dispute.tradeKind;
      evidencePack        = dispute.evidencePack;
      l1SlaDeadline       = dispute.l1SlaDeadline;
      l2QueuedAt          = Types.optNat(dispute.l2QueuedAt);
      l2TriageDeadline    = Types.optNat(dispute.l2TriageDeadline);
      l2DecisionDeadline  = Types.optNat(dispute.l2DecisionDeadline);
      slaFlags            = slaFlags;
    }
  };
}
