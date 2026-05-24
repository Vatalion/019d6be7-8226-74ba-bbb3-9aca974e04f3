import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Types "../types";
import DisputesLib "../lib/Disputes";
import Auth "../lib/Auth";
import RateLimiter "../lib/RateLimiter";
import LiabilityWaterfall "../lib/LiabilityWaterfall";
import StakeLib "../lib/Stake";
import InsuranceReserve "../lib/InsuranceReserve";

/// Disputes mixin — exposes the public dispute endpoints to the actor.
mixin (
  disputes               : Map.Map<Types.DisputeId, Types.Dispute>,
  trades                 : Map.Map<Types.TradeId,   Types.Trade>,
  users                  : Map.Map<Types.UserId,    Types.User>,
  jurors                 : Map.Map<Principal,       Types.JurorEntry>,
  juryMap                : Map.Map<Types.DisputeId, Types.JuryAssignment>,
  nextDisputeId          : { var value : Nat },
  selfPrincipal          : { var value : Principal },
  rateLimitOpenDispute   : Map.Map<Principal, (Nat, Types.Timestamp)>,
  rateLimitAddEvidence   : Map.Map<Principal, (Nat, Types.Timestamp)>,
  liabilityRecords       : Map.Map<Nat, Types.LiabilityRecord>,
  nextLiabilityId        : { var value : Nat },
  stakeBalances          : Map.Map<StakeLib.StakeKey, Types.StakeBalance>,
  listingStakes          : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
  insuranceLedger        : { var value : Nat },
  insuranceAccruals      : Map.Map<Types.TradeId, InsuranceReserve.AccrualRecord>,
  insurancePayouts       : Map.Map<Nat, InsuranceReserve.PayoutRequest>,
  insuranceDailyPaid     : Map.Map<Principal, (Nat, Types.Timestamp)>,
  nextInsurancePayoutId  : { var value : Nat },
) {

  func assertAdminOrMod(caller : Principal) : () {
    switch (users.get(caller)) {
      case null { assert false };
      case (?u) {
        if (not Auth.canActAsModerator(u)) assert false;
      };
    };
  };

  /// Minimal self-canister interface for triggering escrow settlement after jury resolution.
  /// The canister calls its own public `resolveDisputeEscrow` endpoint so that the
  /// async ICRC-1 ledger transfers happen in a separate call context.
  type SelfCanister = actor {
    resolveDisputeEscrow : shared (Types.DisputeId, Types.ResolutionOutcome) -> async Types.Result<()>;
  };

  // ─── Open a dispute ───────────────────────────────────────────────────────

  /// Buyer or seller opens a dispute on a post-fulfillment trade (E6.S9 playbook).
  public shared ({ caller }) func openDispute(
    tradeId      : Types.TradeId,
    reason       : Types.DisputeReason,
    description  : Text,
    evidencePack : Types.DisputeEvidencePack,
  ) : async Types.Result<Types.DisputeId> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);

    // Rate limit: max 5 dispute opens per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 5, rateLimitOpenDispute)) {
      return #err(#rate_limited);
    };

    let result = DisputesLib.openDispute(
      disputes,
      trades,
      nextDisputeId.value,
      caller,
      tradeId,
      reason,
      description,
      evidencePack,
      [],
    );
    switch (result) {
      case (#ok _) { nextDisputeId.value += 1 };
      case (#err(#invalid_input(_))) {
        // Draft saved — advance id counter when a new draft row was allocated
        if (disputes.containsKey(nextDisputeId.value)) {
          nextDisputeId.value += 1;
        };
      };
      case (#err(_)) {};
    };
    result
  };

  /// Trade participant escalates L1 dispute to L2 moderator queue (E6.S9).
  public shared ({ caller }) func escalateDisputeToL2(
    disputeId : Types.DisputeId,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    DisputesLib.escalateDisputeToL2(disputes, trades, caller, disputeId)
  };

  /// System/admin scan — auto-escalate L1 past SLA to L2 (E6.S9 / W2-8).
  public shared ({ caller }) func processDisputeSlaEscalations() : async Nat {
    Auth.assertNotAnonymous(caller);
    assertAdminOrMod(caller);
    DisputesLib.processL1SlaEscalations(disputes, trades)
  };

  // ─── Add evidence ─────────────────────────────────────────────────────────

  /// Trade participant attaches rich media evidence (from object storage) to a dispute.
  /// Existing evidenceUrls field unchanged (backward compat); new uploads go to evidenceAttachments.
  public shared ({ caller }) func addEvidence(
    disputeId            : Types.DisputeId,
    evidenceAttachments  : [Types.MediaAttachment],
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    // Rate limit: max 10 evidence uploads per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 10, rateLimitAddEvidence)) {
      return #err(#rate_limited);
    };

    DisputesLib.addEvidence(disputes, trades, caller, disputeId, evidenceAttachments)
  };

  // ─── Resolve ──────────────────────────────────────────────────────────────

  /// Moderator/admin resolves the dispute and sets the outcome.
  public shared ({ caller }) func resolveDispute(
    disputeId : Types.DisputeId,
    outcome   : Types.ResolutionOutcome,
    notes     : Text,
  ) : async Types.Result<()> {
    // Load dispute and trade BEFORE resolution to get seller principal and amount
    let disputeOpt = disputes.get(disputeId);
    let result = DisputesLib.resolveDispute(disputes, trades, users, caller, disputeId, outcome, notes);
    switch (result) {
      case (#err(e)) return #err(e);
      case (#ok(())) {
        // If buyer wins, record liability against the seller
        switch (outcome) {
          case (#buyer_wins) {
            switch (disputeOpt) {
              case null {};
              case (?dispute) {
                switch (trades.get(dispute.trade)) {
                  case null {};
                  case (?trade) {
                    switch (users.get(trade.seller)) {
                      case null {};
                      case (?seller) {
                        _runSellerFaultWaterfall(trade, seller, caller);
                      };
                    };
                  };
                };
              };
            };
          };
          case _ {};
        };
        ignore _triggerEscrowIfResolved(disputeId);
        #ok(())
      };
    }
  };

  // ─── Moderator note ───────────────────────────────────────────────────────

  /// Moderator/admin adds an internal note (not visible to trade participants).
  public shared ({ caller }) func addModeratorNote(
    disputeId : Types.DisputeId,
    note      : Text,
  ) : async Types.Result<()> {
    DisputesLib.addModeratorNote(disputes, users, caller, disputeId, note)
  };

  // ─── Appeal / reopen ──────────────────────────────────────────────────────

  /// Trade participant appeals a resolved dispute within 7 days.
  /// Transitions dispute back to #under_review.
  public shared ({ caller }) func appealDispute(
    disputeId : Types.DisputeId,
    reason    : Text,
  ) : async Types.Result<()> {
    Auth.assertCallerNotBanned(users, caller);
    DisputesLib.appealDispute(disputes, trades, caller, disputeId, reason)
  };

  /// Moderator reopens a resolved dispute within 7 days.
  public shared ({ caller }) func reopenDispute(
    disputeId : Types.DisputeId,
  ) : async Types.Result<()> {
    DisputesLib.reopenDispute(disputes, trades, users, caller, disputeId)
  };

  // ─── Set dispute under review ─────────────────────────────────────────────

  /// Moderator moves a dispute from #opened → #under_review and auto-assigns jurors.
  public shared ({ caller }) func setDisputeUnderReview(
    disputeId : Types.DisputeId,
  ) : async Types.Result<()> {
    DisputesLib.setDisputeUnderReview(disputes, trades, users, jurors, juryMap, caller, disputeId)
  };

  // ─── Jury pool ────────────────────────────────────────────────────────────

  /// Any authenticated user can register as a juror with a minimum stake of 10 USDT equivalent.
  public shared ({ caller }) func registerAsJuror(
    stake : Float,
  ) : async Types.Result<()> {
    DisputesLib.registerAsJuror(jurors, caller, stake)
  };

  /// Juror can leave the pool if no active disputes are assigned.
  public shared ({ caller }) func unregisterJuror() : async Types.Result<()> {
    DisputesLib.unregisterJuror(jurors, caller)
  };

  /// Assigned juror submits a vote on a dispute (legacy endpoint — prefer castJurorVote).
  /// After recording the vote, if jury consensus is reached and the dispute is auto-resolved,
  /// triggers escrow settlement via a self-canister call to resolveDisputeEscrow.
  public shared ({ caller }) func submitJurorVote(
    disputeId : Types.DisputeId,
    vote      : Types.JurorVoteChoice,
    reasoning : Text,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    let result = DisputesLib.submitJurorVote(
      disputes, trades, jurors, juryMap, caller, disputeId, vote, reasoning
    );
    switch (result) {
      case (#err(e)) return #err(e);
      case (#ok(())) {};
    };
    _recordLiabilityIfBuyerWins(disputeId);
    ignore _triggerEscrowIfResolved(disputeId);
    #ok(())
  };

  // ─── Queries ──────────────────────────────────────────────────────────────

  /// Returns a single dispute. moderatorNotes stripped for non-moderators.
  public shared query ({ caller }) func getDispute(
    disputeId : Types.DisputeId,
  ) : async ?Types.DisputeView {
    DisputesLib.getDispute(disputes, trades, juryMap, users, caller, disputeId)
  };

  /// Returns all disputes attached to a given trade.
  public shared query ({ caller }) func getDisputesByTrade(
    tradeId : Types.TradeId,
  ) : async [Types.DisputeView] {
    DisputesLib.getDisputesByTrade(disputes, trades, juryMap, users, caller, tradeId)
  };

  /// Returns paginated open/under_review/escalated dispute queue — moderator/admin only.
  public shared query ({ caller }) func getOpenDisputeQueue(
    offset : Nat,
    limit  : Nat,
  ) : async Types.Result<[Types.DisputeView]> {
    DisputesLib.getOpenDisputeQueue(disputes, juryMap, users, caller, offset, limit)
  };

  /// Returns all disputes where the caller is the initiator or trade participant.
  public shared query ({ caller }) func getMyDisputes() : async [Types.DisputeView] {
    DisputesLib.getMyDisputes(disputes, juryMap, trades, caller)
  };

  /// Returns list of registered jurors with stats — admin/moderator only.
  public shared query ({ caller }) func getJuryPool() : async Types.Result<[Types.JurorStats]> {
    DisputesLib.getJuryPool(jurors, users, caller)
  };

  /// Returns the caller's active jury cases with voting deadlines.
  public shared query ({ caller }) func getMyJurorDashboard() : async Types.Result<[Types.JurorDashboardEntry]> {
    DisputesLib.getMyJurorDashboard(jurors, juryMap, disputes, caller)
  };

  /// Returns assigned jurors and their votes for a dispute.
  /// Votes are redacted until the dispute is resolved or escalated.
  public shared query ({ caller }) func getDisputeJurors(
    disputeId : Types.DisputeId,
  ) : async ?Types.JuryView {
    DisputesLib.getDisputeJurors(juryMap, disputes, trades, users, caller, disputeId)
  };

  // ─── Jury assignment (admin) ──────────────────────────────────────────────

  /// Admin assigns jurors to a dispute that is #opened or #under_review.
  /// Selects JURY_SIZE eligible jurors from the pool, excluding trade participants.
  public shared ({ caller }) func assignJurors(
    disputeId : Types.DisputeId,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);

    let callerUser = switch (users.get(caller)) {
      case (?u) u;
      case null return #err(#unauthorized);
    };

    if (not Auth.canActAsAdmin(callerUser)) {
      return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case (?d) d;
      case null return #err(#not_found);
    };

    switch (dispute.status) {
      case (#l2_queued) {};
      case _ return #err(#invalid_input("dispute must be #l2_queued to assign jurors"));
    };

    let trade = switch (trades.get(dispute.trade)) {
      case (?t) t;
      case null return #err(#not_found);
    };

    DisputesLib.assignJurors(jurors, juryMap, dispute, trade)
  };

  // ─── Cast juror vote (with deadline validation) ───────────────────────────

  /// Assigned juror casts a vote on a dispute.
  /// Validates that the juror is assigned and the deadline has not passed.
  /// After recording the vote, checks for consensus and auto-resolves if reached.
  /// If the dispute is auto-resolved, escrow settlement is triggered via self-call.
  public shared ({ caller }) func castJurorVote(
    disputeId : Types.DisputeId,
    vote      : Types.JurorVoteChoice,
    reasoning : Text,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    let result = DisputesLib.submitJurorVote(
      disputes, trades, jurors, juryMap, caller, disputeId, vote, reasoning
    );
    switch (result) {
      case (#err(e)) return #err(e);
      case (#ok(())) {};
    };
    _recordLiabilityIfBuyerWins(disputeId);
    ignore _triggerEscrowIfResolved(disputeId);
    #ok(())
  };

  // ─── Check jury deadlines (admin / system) ────────────────────────────────

  /// Iterates all active (#under_review) disputes and escalates any whose
  /// jury deadline has passed without consensus.
  /// Returns the count of disputes that were escalated.
  public shared ({ caller }) func checkJuryDeadlines() : async Nat {
    Auth.assertNotAnonymous(caller);
    assertAdminOrMod(caller);

    var escalated : Nat = 0;
    for ((disputeId, dispute) in disputes.entries()) {
      if (dispute.status == #under_review) {
        if (DisputesLib.checkJuryDeadline(disputeId, disputes, juryMap)) {
          escalated += 1;
        };
      };
    };
    escalated
  };

  // ─── Juror dashboard (richer) ─────────────────────────────────────────────

  /// Returns active jury cases for the caller with deadline, vote tallies,
  /// dispute reason, and hasVoted flag.
  public shared query ({ caller }) func getJurorDashboard() : async [Types.JurorDashboardEntry] {
    switch (DisputesLib.getMyJurorDashboard(jurors, juryMap, disputes, caller)) {
      case (#ok(entries)) entries;
      case (#err(_)) [];
    }
  };

  /// Buyer-facing seller-fault settlement summary for honest manual vs ck copy (E6.S7).
  public query func getSellerFaultSettlementView(
    tradeId : Types.TradeId,
  ) : async ?Types.SellerFaultSettlementView {
    switch (trades.get(tradeId)) {
      case null null;
      case (?trade) {
        LiabilityWaterfall.buildSettlementView(
          liabilityRecords,
          insurancePayouts,
          trade,
        )
      };
    }
  };

  // ─── Private helpers ──────────────────────────────────────────────────────

  /// Seller-fault waterfall: stake → on-chain refund (escrow) → insurance → restriction (E6.S7).
  func _runSellerFaultWaterfall(
    trade : Types.Trade,
    seller : Types.User,
    initiator : Principal,
  ) {
    ignore LiabilityWaterfall.runSellerFaultWaterfall(
      liabilityRecords,
      nextLiabilityId,
      stakeBalances,
      listingStakes,
      insuranceLedger,
      insuranceAccruals,
      insurancePayouts,
      insuranceDailyPaid,
      nextInsurancePayoutId,
      users,
      trades,
      trade,
      seller,
      initiator,
    );
  };

  /// After a juror vote, if the dispute was just auto-resolved as #buyer_wins,
  /// record a liability event against the seller for the full trade amount.
  /// Idempotent: checks dispute.resolution before acting.
  func _recordLiabilityIfBuyerWins(disputeId : Types.DisputeId) {
    switch (disputes.get(disputeId)) {
      case null {};
      case (?dispute) {
        switch (dispute.resolution) {
          case null {};
          case (?resolution) {
            if (resolution.outcome == #buyer_wins) {
              switch (trades.get(dispute.trade)) {
                case null {};
                case (?trade) {
                  switch (users.get(trade.seller)) {
                    case null {};
                    case (?seller) {
                      _runSellerFaultWaterfall(trade, seller, selfPrincipal.value);
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  /// After a juror vote, check if the dispute is now #resolved and, if so,
  /// fire-and-forget a self-call to resolveDisputeEscrow so that ICRC-1
  /// ledger transfers are performed in a separate async context.
    /// Idempotent: resolveDisputeEscrow guards on open dispute trade statuses.
    func _triggerEscrowIfResolved<system>(disputeId : Types.DisputeId) : async () {
    switch (disputes.get(disputeId)) {
      case null {};
      case (?dispute) {
        if (dispute.status == #resolved) {
          switch (dispute.resolution) {
            case null {};
            case (?resolution) {
              let selfCanister : SelfCanister = actor(selfPrincipal.value.toText());
              ignore selfCanister.resolveDisputeEscrow(disputeId, resolution.outcome);
            };
          };
        };
      };
    };
  };
}
