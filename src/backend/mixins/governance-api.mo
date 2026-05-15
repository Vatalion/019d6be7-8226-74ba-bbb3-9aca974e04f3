import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import GovernanceLib "../lib/Governance";
import TreasuryLib "../lib/Treasury";
import Admin "../lib/Admin";

/// Governance mixin — exposes the public DAO governance endpoints to the actor.
mixin (
  proposals           : List.List<GovernanceLib.Proposal>,
  users               : Map.Map<Types.UserId, Types.User>,
  govRateLimitMap     : Map.Map<Principal, (Nat, Types.Timestamp)>,
  nextProposalId      : { var value : Nat },
  treasuryFees        : Map.Map<Types.TradeId, TreasuryLib.FeeRecord>,
  treasuryWithdrawals : List.List<TreasuryLib.WithdrawalRecord>,
  nextWithdrawalId    : { var value : Nat },
  systemSettings      : Admin.SystemSettings,
) {

  // ─── Create proposal ──────────────────────────────────────────────────────

  /// Submit a new governance proposal. Requires ≥100 reputation, max 1 per 24 h.
  public shared ({ caller }) func createProposal(
    proposalType : GovernanceLib.ProposalType,
    description  : Text,
  ) : async Types.Result<GovernanceLib.ProposalId> {
    let result = GovernanceLib.createProposal(
      proposals, users, govRateLimitMap,
      nextProposalId.value, caller, proposalType, description,
    );
    switch (result) {
      case (#ok _) { nextProposalId.value += 1 };
      case (#err _) {};
    };
    result
  };

  // ─── Vote ─────────────────────────────────────────────────────────────────

  /// Cast a yes/no vote on an active proposal within the 7-day window.
  public shared ({ caller }) func voteOnProposal(
    proposalId : GovernanceLib.ProposalId,
    voteYes    : Bool,
  ) : async Types.Result<()> {
    GovernanceLib.vote(proposals, users, caller, proposalId, voteYes)
  };

  // ─── Close proposal ───────────────────────────────────────────────────────

  /// Evaluate quorum after the 7-day deadline and mark proposal #passed/#rejected/#expired.
  public shared ({ caller }) func closeProposal(
    proposalId : GovernanceLib.ProposalId,
  ) : async Types.Result<GovernanceLib.ProposalStatus> {
    GovernanceLib.closeProposal(proposals, caller, users, proposalId)
  };

  // ─── Execute proposal ─────────────────────────────────────────────────────

  /// Execute a #passed proposal. Auto-applies the proposal type action.
  public shared ({ caller }) func executeProposal(
    proposalId : GovernanceLib.ProposalId,
  ) : async Types.Result<()> {
    switch (GovernanceLib.executeProposal(
      proposals, users,
      systemSettings,
      treasuryFees, treasuryWithdrawals,
      nextWithdrawalId.value, caller, proposalId,
    )) {
      case (#ok newWid) {
        nextWithdrawalId.value := newWid;
        #ok(())
      };
      case (#err e) #err(e);
    }
  };

  // ─── Record treasury fee (called internally by escrow on trade completion) ─

  /// Record a completed trade fee into the treasury.
  public shared ({ caller }) func recordTreasuryFee(
    tradeId : Types.TradeId,
    amount  : Nat,
    token   : Types.TradeToken,
  ) : async () {
    TreasuryLib.recordFee(treasuryFees, tradeId, amount, token);
  };

  // ─── Queries ──────────────────────────────────────────────────────────────

  /// Returns proposals, optionally filtered by status.
  public shared query func getProposals(
    statusFilter : ?GovernanceLib.ProposalStatus,
  ) : async [GovernanceLib.ProposalView] {
    GovernanceLib.getProposals(proposals, statusFilter)
  };

  /// Returns a single proposal by id.
  public shared query func getProposal(
    proposalId : GovernanceLib.ProposalId,
  ) : async ?GovernanceLib.ProposalView {
    GovernanceLib.getProposal(proposals, proposalId)
  };

  /// Returns total treasury balance (accumulated fees minus withdrawals).
  public shared query func getTreasuryBalance() : async Nat {
    TreasuryLib.getBalance(treasuryFees, treasuryWithdrawals)
  };

  /// Returns the history of executed treasury transfers.
  public shared query func getExecutionHistory() : async [GovernanceLib.ProposalView] {
    GovernanceLib.getExecutionHistory(proposals)
  };

  /// Returns all treasury withdrawal records.
  public shared query func getTreasuryWithdrawals() : async [TreasuryLib.WithdrawalRecord] {
    TreasuryLib.getWithdrawalHistory(treasuryWithdrawals)
  };
}
