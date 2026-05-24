import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types";
import Auth "Auth";
import Admin "Admin";
import RateLimiter "RateLimiter";
import TreasuryLib "Treasury";

/// Governance — DAO proposal lifecycle, voting, quorum evaluation, and auto-execution.
/// All functions are pure (state injected). No side effects beyond state mutation.
module {

  // ─── Types ────────────────────────────────────────────────────────────────

  public type ProposalId = Nat;

  public type ProposalType = {
    #ParameterChange : { key : Text; value : Text };
    #TreasuryTransfer : { amount : Nat; recipient : Principal };
    #TextResolution : { description : Text };
  };

  public type ProposalStatus = {
    #active;
    #passed;
    #rejected;
    #executed;
    #expired;
  };

  /// Internal mutable proposal record.
  public type Proposal = {
    id             : ProposalId;
    proposer       : Types.UserId;
    proposalType   : ProposalType;
    description    : Text;
    var yesVotes   : Nat;
    var noVotes    : Nat;
    voters         : Map.Map<Types.UserId, Bool>;  // true = yes, false = no
    var status     : ProposalStatus;
    createdAt      : Types.Timestamp;
    deadline       : Types.Timestamp;
    var executedAt : ?Types.Timestamp;
  };

  /// Immutable public view — safe over Candid.
  public type ProposalView = {
    id           : ProposalId;
    proposer     : Types.UserId;
    proposalType : ProposalType;
    description  : Text;
    yesVotes     : Nat;
    noVotes      : Nat;
    voterCount   : Nat;
    status       : ProposalStatus;
    createdAt    : Types.Timestamp;
    deadline     : Types.Timestamp;
    executedAt   : ?Types.Timestamp;
  };

  // ─── Constants ────────────────────────────────────────────────────────────

  /// 7 days in nanoseconds (7 * 24 * 3600 * 1_000_000_000).
  public let VOTING_WINDOW_NS : Nat = 604_800_000_000_000;

  /// Minimum reputation score required to submit a proposal.
  public let MIN_REPUTATION_TO_PROPOSE : Int = 100;

  /// 24 h in nanoseconds for proposal creation rate limit.
  public let PROPOSAL_RATE_WINDOW_NS : Nat = 86_400_000_000_000;
  public let PROPOSAL_RATE_MAX : Nat = 1;

  // ─── toView ───────────────────────────────────────────────────────────────

  public func toView(p : Proposal) : ProposalView {
    {
      id           = p.id;
      proposer     = p.proposer;
      proposalType = p.proposalType;
      description  = p.description;
      yesVotes     = p.yesVotes;
      noVotes      = p.noVotes;
      voterCount   = p.voters.size();
      status       = p.status;
      createdAt    = p.createdAt;
      deadline     = p.deadline;
      executedAt   = p.executedAt;
    }
  };

  // ─── createProposal ───────────────────────────────────────────────────────

  /// Create a new DAO proposal.
  /// Requirements: caller is registered, not banned, has ≥100 reputation,
  ///               rate-limited to 1 proposal per 24 h.
  public func createProposal(
    proposals       : List.List<Proposal>,
    users           : Map.Map<Types.UserId, Types.User>,
    rateLimitMap    : Map.Map<Principal, (Nat, Types.Timestamp)>,
    nextId          : Nat,
    caller          : Principal,
    proposalType    : ProposalType,
    description     : Text,
  ) : Types.Result<ProposalId> {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    Auth.assertNotBanned(user);

    if (user.reputationScore < MIN_REPUTATION_TO_PROPOSE) {
      return #err(#invalid_input("Minimum reputation score of 100 required to create a proposal"));

    };

    if (description.size() == 0 or description.size() > 2000) {
      return #err(#invalid_input("Description must be 1–2000 characters"));
    };

    // Rate limit: 1 proposal per 24 h per user
    let allowed = RateLimiter.check(
      caller, PROPOSAL_RATE_WINDOW_NS, PROPOSAL_RATE_MAX, rateLimitMap,
    );
    if (not allowed) return #err(#rate_limited);

    let now = Types.now();
    let proposal : Proposal = {
      id             = nextId;
      proposer       = caller;
      proposalType;
      description;
      var yesVotes   = 0;
      var noVotes    = 0;
      voters         = Map.empty<Types.UserId, Bool>();
      var status     = #active;
      createdAt      = now;
      deadline       = now + VOTING_WINDOW_NS;
      var executedAt = null;
    };
    proposals.add(proposal);
    #ok(nextId)
  };

  // ─── vote ─────────────────────────────────────────────────────────────────

  /// Cast a vote on an active proposal.
  /// Weight = caller's reputation score clamped to minimum 1.
  /// One vote per user per proposal.
  public func vote(
    proposals : List.List<Proposal>,
    users     : Map.Map<Types.UserId, Types.User>,
    caller    : Principal,
    proposalId : ProposalId,
    voteYes    : Bool,
  ) : Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    Auth.assertNotBanned(user);

    let proposal = switch (proposals.find(func(p : Proposal) : Bool { p.id == proposalId })) {
      case (?p) p;
      case null return #err(#not_found);
    };

    if (proposal.status != #active) {
      return #err(#invalid_input("Proposal is not active"));
    };

    let now = Types.now();
    if (now > proposal.deadline) {
      return #err(#invalid_input("Voting window has closed"));
    };

    if (proposal.voters.containsKey(caller)) {
      return #err(#already_exists);
    };

    // Vote weight based on reputation (minimum 1)
    let weight : Nat = if (user.reputationScore > 0) user.reputationScore.toNat() else 1;

    proposal.voters.add(caller, voteYes);
    if (voteYes) {
      proposal.yesVotes += weight;
    } else {
      proposal.noVotes += weight;
    };
    #ok(())
  };

  // ─── closeProposal ────────────────────────────────────────────────────────

  /// Evaluate quorum and mark proposal as #passed or #rejected.
  /// Can only be called after the 7-day deadline has passed.
  /// Quorum rule: yes votes > no votes (simple majority of votes cast).
  public func closeProposal(
    proposals  : List.List<Proposal>,
    caller     : Principal,
    users      : Map.Map<Types.UserId, Types.User>,
    proposalId : ProposalId,
  ) : Types.Result<ProposalStatus> {
    Auth.assertNotAnonymous(caller);
    // Any registered user can trigger close after deadline
    ignore Auth.requireUser(users, caller);

    let proposal = switch (proposals.find(func(p : Proposal) : Bool { p.id == proposalId })) {
      case (?p) p;
      case null return #err(#not_found);
    };

    if (proposal.status != #active) {
      return #err(#invalid_input("Proposal is not active"));
    };

    let now = Types.now();
    if (now <= proposal.deadline) {
      return #err(#invalid_input("Voting window has not yet closed"));
    };

    let totalVotes = proposal.yesVotes + proposal.noVotes;
    let newStatus : ProposalStatus = if (totalVotes == 0) {
      #expired
    } else if (proposal.yesVotes * 100 > totalVotes * 51) {
      // yes > 51% of all votes cast
      #passed
    } else {
      #rejected
    };

    proposal.status := newStatus;
    #ok(newStatus)
  };

  // ─── executeProposal ──────────────────────────────────────────────────────

  /// Execute a #passed proposal.
  /// #ParameterChange — updates the matching field in systemSettings.
  /// #TreasuryTransfer — records a withdrawal via TreasuryLib.
  /// #TextResolution — marks executed (no side effects beyond status).
  public func executeProposal(
    proposals          : List.List<Proposal>,
    users              : Map.Map<Types.UserId, Types.User>,
    systemSettings     : Admin.SystemSettings,
    treasuryFees       : Map.Map<Types.TradeId, TreasuryLib.FeeRecord>,
    treasuryWithdrawals : List.List<TreasuryLib.WithdrawalRecord>,
    nextWithdrawalId   : Nat,
    caller             : Principal,
    proposalId         : ProposalId,
  ) : Types.Result<Nat> {
    Auth.assertNotAnonymous(caller);
    // Any registered user can trigger execution after proposal passed
    ignore Auth.requireUser(users, caller);

    let proposal = switch (proposals.find(func(p : Proposal) : Bool { p.id == proposalId })) {
      case (?p) p;
      case null return #err(#not_found);
    };

    if (proposal.status != #passed) {
      return #err(#invalid_input("Only passed proposals can be executed"));
    };

    var newWithdrawalId = nextWithdrawalId;

    switch (proposal.proposalType) {
      case (#ParameterChange({ key; value })) {
        switch (key) {
          case "minTradeAmountUSD" {
            switch (Nat.fromText(value)) {
              case (?n) { systemSettings.minTradeAmountUSD := n };
              case null { return #err(#invalid_input("Invalid value for minTradeAmountUSD")) };
            };
          };
          case "paymentTimeoutHours" {
            switch (Nat.fromText(value)) {
              case (?n) { systemSettings.paymentTimeoutHours := n };
              case null { return #err(#invalid_input("Invalid value for paymentTimeoutHours")) };
            };
          };
          case "maxListingPriceUSD" {
            switch (Nat.fromText(value)) {
              case (?n) { systemSettings.maxListingPriceUSD := n };
              case null { return #err(#invalid_input("Invalid value for maxListingPriceUSD")) };
            };
          };
          case _ {
            return #err(#invalid_input("Unknown parameter key: " # key));
          };
        };
      };
      case (#TreasuryTransfer({ amount; recipient })) {
        newWithdrawalId := TreasuryLib.transferToWinner(
          treasuryFees, treasuryWithdrawals,
          nextWithdrawalId, proposalId, recipient, amount,
        );
      };
      case (#TextResolution(_)) {
        // No state change beyond marking executed below
      };
    };

    proposal.status     := #executed;
    proposal.executedAt := ?Types.now();
    #ok(newWithdrawalId)
  };

  // ─── Queries ──────────────────────────────────────────────────────────────

  public func getProposals(
    proposals   : List.List<Proposal>,
    statusFilter : ?ProposalStatus,
  ) : [ProposalView] {
    let filtered = switch (statusFilter) {
      case null proposals;
      case (?s) proposals.filter(func(p : Proposal) : Bool { p.status == s });
    };
    filtered.map<Proposal, ProposalView>(toView).toArray()
  };

  public func getProposal(
    proposals  : List.List<Proposal>,
    proposalId : ProposalId,
  ) : ?ProposalView {
    switch (proposals.find(func(p : Proposal) : Bool { p.id == proposalId })) {
      case (?p) ?toView(p);
      case null null;
    }
  };

  public func getExecutionHistory(
    proposals : List.List<Proposal>,
  ) : [ProposalView] {
    proposals
      .filter(func(p : Proposal) : Bool { p.status == #executed })
      .map<Proposal, ProposalView>(toView)
      .toArray()
  };
}
