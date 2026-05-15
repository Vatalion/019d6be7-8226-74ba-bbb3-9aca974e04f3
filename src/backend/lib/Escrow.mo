import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types";

/// Escrow — domain logic for the P2P trade state machine.
/// Covers both manual off-chain confirmation and ICRC-1 on-chain escrow flows.
/// All ICRC-1 ledger calls are done in the mixin (async boundary); this module
/// handles only synchronous state transitions and pure helpers.
module {

  // ─── Constants ────────────────────────────────────────────────────────────

  /// 72 hours in nanoseconds — default refund deadline for manual trades.
  let REFUND_DEADLINE_NS : Int = 259_200_000_000_000;

  /// Total fee: 3% (300 bps)
  /// Split: 2% platform profit, 0.5% cycles fund, 0.5% security reserve
  let PLATFORM_FEE_BPS : Nat = 200;
  let CYCLES_FEE_BPS   : Nat = 50;
  let RESERVE_FEE_BPS  : Nat = 50;
  let BPS_DENOM        : Nat = 10_000;

  // ─── ICRC-1/ICRC-2 ledger actor interface ────────────────────────────────

  /// Minimal ICRC-1 + ICRC-2 interface used for escrow operations.
  public type Icrc1Ledger = actor {
    icrc1_transfer : shared ({
      to      : { owner : Principal; subaccount : ?Blob };
      amount  : Nat;
      fee     : ?Nat;
      memo    : ?Blob;
      from_subaccount : ?Blob;
      created_at_time : ?Nat64;
    }) -> async { #Ok : Nat; #Err : TransferError };

    icrc2_transfer_from : shared ({
      from    : { owner : Principal; subaccount : ?Blob };
      to      : { owner : Principal; subaccount : ?Blob };
      amount  : Nat;
      fee     : ?Nat;
      memo    : ?Blob;
      spender_subaccount : ?Blob;
      created_at_time : ?Nat64;
    }) -> async { #Ok : Nat; #Err : TransferFromError };

    icrc1_fee : shared query () -> async Nat;
  };

  public type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  public type TransferFromError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #InsufficientAllowance : { allowance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  // ─── Token routing ────────────────────────────────────────────────────────

  /// Returns true when the token uses the ICRC-1 on-chain escrow path.
  public func isOnChainToken(token : Types.TradeToken) : Bool {
    switch (token) {
      case (#ckUSDC or #ckUSDT) true;
      case (_) false;
    }
  };

  /// Resolves the ICRC-1 ledger canister IDs for ICP-native stablecoins.
  /// IDs are sourced from systemSettings so they can be updated without code redeployment.
  /// Returns null for tokens that use the HTTP outcall verification path.
  public func ledgerCanisterId(token : Types.TradeToken, ckUsdcId : Text, ckUsdtId : Text) : ?Principal {
    switch (token) {
      case (#ckUSDC) ?Principal.fromText(ckUsdcId);
      case (#ckUSDT) ?Principal.fromText(ckUsdtId);
      case (_) null;
    }
  };

  // ─── Fee calculation ──────────────────────────────────────────────────────

  /// Computes the 2% platform profit fee for a given amount (in e8s).
  public func platformFee(amount : Nat) : Nat {
    (amount * PLATFORM_FEE_BPS) / BPS_DENOM
  };

  /// Computes the 0.5% cycles fund fee for a given amount (in e8s).
  public func cycleFee(amount : Nat) : Nat {
    (amount * CYCLES_FEE_BPS) / BPS_DENOM
  };

  /// Computes the 0.5% security reserve fee for a given amount (in e8s).
  public func reserveFee(amount : Nat) : Nat {
    (amount * RESERVE_FEE_BPS) / BPS_DENOM
  };

  /// Total 3% fee (platformFee + cycleFee + reserveFee).
  public func totalFee(amount : Nat) : Nat {
    platformFee(amount) + cycleFee(amount) + reserveFee(amount)
  };

  /// Net amount sent to seller after all fee deductions.
  public func sellerAmount(amount : Nat) : Nat {
    amount - platformFee(amount) - cycleFee(amount) - reserveFee(amount)
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  func requireTrade(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : Types.Trade {
    switch (trades.get(tradeId)) {
      case (?t) t;
      case null Runtime.trap("trade not found: " # debug_show(tradeId));
    };
  };

  // ─── Initiate Trade (manual/off-chain path) ───────────────────────────────

  /// Creates a new Trade for a listing using the manual confirmation flow.
  /// For ICRC-1 tokens call initiateOnChainTrade instead.
  /// Sets status=#pending, refundDeadline = now + 72h.
  public func initiateTrade(
    trades      : Map.Map<Types.TradeId, Types.Trade>,
    listings    : Map.Map<Types.ListingId, Types.Listing>,
    nextTradeId : Nat,
    caller      : Principal,
    listingId   : Types.ListingId,
    token       : Types.TradeToken,
    shippingSelection : ?Types.ShippingSelection,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let listing = switch (listings.get(listingId)) {
      case (?l) l;
      case null return #err(#not_found);
    };

    if (listing.status != #active) {
      return #err(#escrow_error("listing is not active"));
    };

    if (Principal.equal(caller, listing.seller)) {
      return #err(#escrow_error("buyer cannot be the seller"));
    };

    let now = Time.now();
    let trade : Types.Trade = {
      id            = nextTradeId;
      listing       = listingId;
      buyer         = caller;
      seller        = listing.seller;
      amount        = listing.priceAmount;
      token         = token;
      var status    = #pending;
      createdAt     = now;
      var fundedAt       = null;
      var confirmedAt    = null;
      var completedAt    = null;
      var refundDeadline = ?(now + REFUND_DEADLINE_NS);
      var escrowAccount  = null;
      var shippingSelection   = shippingSelection;
      var ttnNumber           = null;
      var ttnCreationStatus   = #Pending;
      var digitalDelivery     = null;
    };

    trades.add(nextTradeId, trade);
    #ok(trade)
  };

  // ─── Initiate On-Chain Trade (ICRC-1 path) ────────────────────────────────

  /// Creates a Trade record in #awaiting_approval state.
  /// The mixin will then call icrc2_transfer_from after this returns.
  public func initiateOnChainTrade(
    trades      : Map.Map<Types.TradeId, Types.Trade>,
    listings    : Map.Map<Types.ListingId, Types.Listing>,
    nextTradeId : Nat,
    caller      : Principal,
    listingId   : Types.ListingId,
    token       : Types.TradeToken,
    ledgerId    : Principal,
    shippingSelection : ?Types.ShippingSelection,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let listing = switch (listings.get(listingId)) {
      case (?l) l;
      case null return #err(#not_found);
    };

    if (listing.status != #active) {
      return #err(#escrow_error("listing is not active"));
    };

    if (Principal.equal(caller, listing.seller)) {
      return #err(#escrow_error("buyer cannot be the seller"));
    };

    let amount = listing.priceAmount;
    let fee    = totalFee(amount);
    let now    = Time.now();

    let escrow : Types.EscrowAccount = {
      tradeId          = nextTradeId;
      buyerPrincipal   = caller;
      sellerPrincipal  = listing.seller;
      token;
      amount;
      fee;
      ledgerCanisterId = ledgerId;
      lockedAt         = now;
      deadline         = now + REFUND_DEADLINE_NS;
    };

    let trade : Types.Trade = {
      id            = nextTradeId;
      listing       = listingId;
      buyer         = caller;
      seller        = listing.seller;
      amount;
      token;
      var status    = #awaiting_approval;
      createdAt     = now;
      var fundedAt       = null;
      var confirmedAt    = null;
      var completedAt    = null;
      var refundDeadline = ?(now + REFUND_DEADLINE_NS);
      var escrowAccount  = ?escrow;
      var shippingSelection   = shippingSelection;
      var ttnNumber           = null;
      var ttnCreationStatus   = #Pending;
      var digitalDelivery     = null;
    };

    trades.add(nextTradeId, trade);
    #ok(trade)
  };

  // ─── Mark Funded (after successful icrc2_transfer_from) ──────────────────

  /// Called by the mixin after a successful icrc2_transfer_from call.
  /// Advances status: #awaiting_approval → #funded.
  public func markFunded(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    let trade = requireTrade(trades, tradeId);
    switch (trade.status) {
      case (#awaiting_approval) {};
      case (#funded) return #ok(trade); // idempotent
      case (_) return #err(#escrow_error(
        "markFunded requires #awaiting_approval, got " # debug_show(trade.status)
      ));
    };
    trade.status  := #funded;
    trade.fundedAt := ?Time.now();
    #ok(trade)
  };

  // ─── Confirm Payment Sent (buyer → buyer_confirmed) ──────────────────────

  /// Buyer confirms they have sent payment (manual or on-chain path).
  /// Valid source states: #pending, #funded → #buyer_confirmed.
  public func confirmPaymentSent(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#pending or #funded) {};
      case (_) return #err(#escrow_error("invalid transition: confirmPaymentSent requires status #pending or #funded, got " # debug_show(trade.status)));
    };

    trade.status      := #buyer_confirmed;
    trade.confirmedAt := ?Time.now();
    #ok(trade)
  };

  // ─── Confirm Payment Received (seller → complete) ─────────────────────────

  /// Seller confirms they received payment. Transitions to #complete.
  /// For ICRC-1 trades the mixin also calls releaseToSeller after this.
  public func confirmPaymentReceived(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    caller   : Principal,
    tradeId  : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.seller)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#buyer_confirmed or #payment_verified) {};
      case (_) return #err(#escrow_error("invalid transition: confirmPaymentReceived requires status #buyer_confirmed or #payment_verified, got " # debug_show(trade.status)));
    };

    trade.status      := #complete;
    trade.completedAt := ?Time.now();

    // Mark listing as sold
    switch (listings.get(trade.listing)) {
      case (?l) {
        l.status     := #sold;
        l.resolvedAt := ?Time.now();
      };
      case null {};
    };

    #ok(trade)
  };

  // ─── Request Refund (buyer, after deadline) ───────────────────────────────

  /// Buyer requests refund after refundDeadline has passed.
  /// For ICRC-1 trades the mixin also calls refundBuyer after this.
  /// Valid source states: #pending, #funded → #refunded.
  public func requestRefund(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#pending or #funded) {};
      case (_) return #err(#escrow_error("invalid transition: requestRefund requires status #pending or #funded, got " # debug_show(trade.status)));
    };

    let now = Time.now();
    let deadline = switch (trade.refundDeadline) {
      case (?d) d;
      case null return #err(#escrow_error("no refund deadline set"));
    };

    if (now < deadline) {
      return #err(#escrow_error("refund deadline has not passed yet"));
    };

    trade.status := #refunded;
    #ok(trade)
  };

  // ─── Propose Cancel (mutual consent) ─────────────────────────────────────

  /// Either buyer or seller proposes cancellation.
  /// When both have proposed, the trade is cancelled.
  /// Returns #ok(true) when trade is cancelled, #ok(false) when proposal recorded.
  public func proposeCancelTrade(
    trades          : Map.Map<Types.TradeId, Types.Trade>,
    cancelProposals : Map.Map<Types.TradeId, Set.Set<Principal>>,
    caller          : Principal,
    tradeId         : Types.TradeId,
  ) : Types.Result<Bool> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    // Only buyer or seller may propose cancel
    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) {
      return #err(#unauthorized);
    };

    // Only cancellable from non-terminal states
    switch (trade.status) {
      case (#complete or #refunded or #cancelled or #payment_verified) {
        return #err(#escrow_error("trade is already in a terminal state: " # debug_show(trade.status)));
      };
      case (_) {};
    };

    // Record proposal
    let proposals = switch (cancelProposals.get(tradeId)) {
      case (?p) p;
      case null {
        let p = Set.empty<Principal>();
        cancelProposals.add(tradeId, p);
        p
      };
    };

    proposals.add(caller);

    // Both parties have agreed
    let buyerAgreed  = proposals.contains(trade.buyer);
    let sellerAgreed = proposals.contains(trade.seller);

    if (buyerAgreed and sellerAgreed) {
      trade.status := #cancelled;
      cancelProposals.remove(tradeId);
      return #ok(true);
    };

    #ok(false)
  };

  // ─── Check and Expire Timeouts ────────────────────────────────────────────

  /// Auto-refunds all trades whose refundDeadline has passed and are still in
  /// #pending or #funded state. Designed to be called periodically.
  /// Returns the IDs of expired ICRC-1 trades that still need on-chain refund.
  public func checkAndExpireTimeouts(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : (Nat, [Types.TradeId]) {
    let now = Time.now();
    var count = 0;
    let onChainRefunds = List.empty<Types.TradeId>();

    trades.forEach(func(_id, trade) {
      switch (trade.status) {
        case (#pending or #funded) {
          let expired = switch (trade.refundDeadline) {
            case (?d) now >= d;
            case null false;
          };
          if (expired) {
            trade.status := #refunded;
            count += 1;
            // Queue ICRC-1 trades for async refund in the mixin
            if (trade.escrowAccount != null) {
              onChainRefunds.add(trade.id);
            };
          };
        };
        case (_) {};
      };
    });

    (count, onChainRefunds.toArray())
  };

  // ─── Open Dispute ─────────────────────────────────────────────────────────

  /// Transitions a trade to #disputed (from #buyer_confirmed).
  /// Caller must be either buyer or seller.
  public func openDispute(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#buyer_confirmed or #payment_verified or #funded) {};
      case (_) return #err(#escrow_error("can only dispute from #buyer_confirmed, #payment_verified, or #funded state, got " # debug_show(trade.status)));
    };

    trade.status := #disputed;
    #ok(trade)
  };

  // ─── View conversion ─────────────────────────────────────────────────────

  /// Converts mutable Trade to immutable TradeView for Candid serialization.
  public func toView(t : Types.Trade) : Types.TradeView {
    {
      id                  = t.id;
      listing             = t.listing;
      buyer               = t.buyer;
      seller              = t.seller;
      amount              = t.amount;
      token               = t.token;
      status              = t.status;
      createdAt           = t.createdAt;
      fundedAt            = t.fundedAt;
      confirmedAt         = t.confirmedAt;
      completedAt         = t.completedAt;
      refundDeadline      = t.refundDeadline;
      escrowAccount       = t.escrowAccount;
      shippingSelection   = t.shippingSelection;
      ttnNumber           = t.ttnNumber;
      ttnCreationStatus   = t.ttnCreationStatus;
      digitalDelivery     = t.digitalDelivery;
    }
  };

  // ─── Query helpers ────────────────────────────────────────────────────────

  /// Returns a single trade by ID, or null.
  public func getTrade(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : ?Types.TradeView {
    switch (trades.get(tradeId)) {
      case (?t) ?toView(t);
      case null null;
    }
  };

  /// Returns all trades where caller is buyer, seller, or either (role=#all).
  public func getMyTrades(
    trades : Map.Map<Types.TradeId, Types.Trade>,
    caller : Principal,
    role   : { #buyer; #seller; #all },
  ) : [Types.TradeView] {
    trades.values().filter(func(t : Types.Trade) : Bool {
      switch (role) {
        case (#buyer)  Principal.equal(caller, t.buyer);
        case (#seller) Principal.equal(caller, t.seller);
        case (#all)    Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller);
      }
    }).map(toView).toArray()
  };

  /// Returns all trades for a specific listing.
  public func getTradesByListing(
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : [Types.TradeView] {
    trades.values().filter(func(t : Types.Trade) : Bool {
      t.listing == listingId
    }).map(toView).toArray()
  };

  /// Returns all trades (admin only — caller check done in mixin).
  public func adminGetAllTrades(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : [Types.TradeView] {
    trades.values().map(toView).toArray()
  };

  // ─── Reputation update ────────────────────────────────────────────────────

  /// Updates reputation scores for buyer and seller after trade completion.
  /// Buyer gains +2, seller gains +3.
  public func applyReputationUpdate(
    users  : Map.Map<Types.UserId, Types.User>,
    trade  : Types.Trade,
  ) : () {
    switch (users.get(trade.buyer)) {
      case (?u) { u.reputationScore := u.reputationScore + 2 };
      case null {};
    };
    switch (users.get(trade.seller)) {
      case (?u) { u.reputationScore := u.reputationScore + 3 };
      case null {};
    };
  };

  // ─── Apply payment verified (Phase 2) ────────────────────────────────────

  /// Advances a trade from #buyer_confirmed → #payment_verified.
  /// Called by the payments mixin after successful blockchain verification.
  public func applyPaymentVerified(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    let trade = requireTrade(trades, tradeId);
    switch (trade.status) {
      case (#buyer_confirmed) {};
      case (#payment_verified) return #ok(trade); // idempotent
      case (_) return #err(#escrow_error(
        "applyPaymentVerified requires #buyer_confirmed, got " # debug_show(trade.status)
      ));
    };
    trade.status := #payment_verified;
    #ok(trade)
  };
}
