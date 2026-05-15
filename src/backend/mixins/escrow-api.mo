import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types";
import EscrowLib "../lib/Escrow";
import AuthLib "../lib/Auth";
import Reputation "../lib/Reputation";
import PaymentsLib "../lib/Payments";
import RateLimiter "../lib/RateLimiter";
import Admin "../lib/Admin";

/// Escrow API mixin — public endpoints for the P2P trade state machine.
/// Covers both the manual off-chain flow and the ICRC-1 on-chain escrow flow.
/// Receives all escrow state slices via mixin parameters.
mixin (
  users                : Map.Map<Types.UserId, Types.User>,
  listings             : Map.Map<Types.ListingId, Types.Listing>,
  trades               : Map.Map<Types.TradeId, Types.Trade>,
  cancelProposals      : Map.Map<Types.TradeId, Set.Set<Principal>>,
  nextTradeId          : { var value : Nat },
  treasuryId           : { var value : Principal },
  selfPrincipal        : { var value : Principal },
  disputes             : Map.Map<Types.DisputeId, Types.Dispute>,
  nextDisputeId        : { var value : Nat },
  processingTrades     : Map.Map<Types.TradeId, Bool>,
  rateLimitInitiateTrade  : Map.Map<Principal, (Nat, Types.Timestamp)>,
  rateLimitConfirmPayment : Map.Map<Principal, (Nat, Types.Timestamp)>,
  systemSettings       : Admin.SystemSettings,
) {

  /// 24 hours in nanoseconds — digital goods inspection window.
  let INSPECTION_PERIOD_NS : Int = 86_400_000_000_000;

  // ─── Initiate Trade (manual/off-chain path) ───────────────────────────────

  /// Creates a new trade using the manual confirmation flow.
  /// For ICRC-1 stablecoins (ckUSDC, ckUSDT) use initiateOnChainTrade instead.
  public shared ({ caller }) func initiateTrade(
    listingId         : Types.ListingId,
    token             : Types.TradeToken,
    shippingSelection : ?Types.ShippingSelection,
  ) : async Types.Result<Types.TradeId> {
    AuthLib.assertNotAnonymous(caller);
    // Rate limit: 5 trades per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 5, rateLimitInitiateTrade)) {
      return #err(#rate_limited);
    };
    // Reject ICRC-1 tokens from the manual path
    if (EscrowLib.isOnChainToken(token)) {
      return #err(#escrow_error(
        "Use initiateOnChainTrade for ICRC-1 tokens (ckUSDC/ckUSDT)"
      ));
    };

    // ─── Reputation gate (buyer) ────────────────────────────────────────────
    let listing = switch (listings.get(listingId)) {
      case null return #err(#not_found);
      case (?l) l;
    };
    let buyer = switch (users.get(caller)) {
      case null return #err(#not_found);
      case (?b) b;
    };
    let priceUsdCents = PaymentsLib.tokenAmountToUsdCents(listing.priceAmount, listing.priceToken);
    if (not Reputation.canTradeAmount(buyer.reputationScore, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateError(buyer.reputationScore, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    let result = EscrowLib.initiateTrade(
      trades, listings, nextTradeId.value, caller, listingId, token, shippingSelection
    );
    switch (result) {
      case (#ok(trade)) {
        nextTradeId.value += 1;
        #ok(trade.id)
      };
      case (#err(e)) #err(e);
    };
  };

  // ─── Initiate On-Chain Trade (ICRC-1 path) ────────────────────────────────

  /// Creates a new trade and immediately pulls tokens from the buyer into
  /// canister escrow via icrc2_transfer_from (buyer must have called
  /// icrc2_approve on the ledger canister first).
  ///
  /// Flow:
  ///   1. Resolve ledger canister ID for the token
  ///   2. Create trade record in #awaiting_approval
  ///   3. Call icrc2_transfer_from — pulls amount from buyer to this canister
  ///   4. Advance trade to #funded
  ///
  /// On any ledger error the trade record is removed and #err is returned.
  public shared ({ caller }) func initiateOnChainTrade(
    listingId         : Types.ListingId,
    token             : Types.TradeToken,
    shippingSelection : ?Types.ShippingSelection,
  ) : async Types.Result<Types.TradeId> {
    AuthLib.assertNotAnonymous(caller);
    // Rate limit: shared 5 trades per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 5, rateLimitInitiateTrade)) {
      return #err(#rate_limited);
    };

    let ledgerId = switch (EscrowLib.ledgerCanisterId(token, systemSettings.ckUsdcLedgerId, systemSettings.ckUsdtLedgerId)) {
      case (?id) id;
      case null return #err(#escrow_error(
        "Token does not support on-chain escrow; use initiateTrade instead"
      ));
    };

    // ─── Reputation gate (buyer) ────────────────────────────────────────────
    let listing = switch (listings.get(listingId)) {
      case null return #err(#not_found);
      case (?l) l;
    };
    let buyer = switch (users.get(caller)) {
      case null return #err(#not_found);
      case (?b) b;
    };
    let priceUsdCents = PaymentsLib.tokenAmountToUsdCents(listing.priceAmount, listing.priceToken);
    if (not Reputation.canTradeAmount(buyer.reputationScore, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateError(buyer.reputationScore, priceUsdCents)));
    };
    // ───────────────────────────────────────────────────────────────────────

    // Create the trade record
    let createResult = EscrowLib.initiateOnChainTrade(
      trades, listings, nextTradeId.value, caller, listingId, token, ledgerId, shippingSelection
    );
    let trade = switch (createResult) {
      case (#ok(t)) t;
      case (#err(e)) return #err(e);
    };
    let tradeId = trade.id;
    nextTradeId.value += 1;

    // Pull tokens from buyer into this canister via ICRC-2
    let ledger : EscrowLib.Icrc1Ledger = actor(ledgerId.toText());
    let transferResult = await ledger.icrc2_transfer_from({
      from    = { owner = caller; subaccount = null };
      to      = { owner = selfPrincipal.value; subaccount = null };
      amount  = trade.amount;
      fee     = null;
      memo    = null;
      spender_subaccount = null;
      created_at_time = null;
    });

    switch (transferResult) {
      case (#Ok(_blockIndex)) {
        // Advance trade to #funded
        switch (EscrowLib.markFunded(trades, tradeId)) {
          case (#ok(_)) #ok(tradeId);
          case (#err(e)) #err(e);
        };
      };
      case (#Err(tfErr)) {
        // Roll back: remove the trade record
        trades.remove(tradeId);
        nextTradeId.value -= 1;
        #err(#escrow_error("ICRC-2 transfer_from failed: " # debug_show(tfErr)))
      };
    };
  };

  // ─── Confirm Payment Sent (buyer) ─────────────────────────────────────────

  /// Buyer calls this to confirm they have sent the crypto payment off-chain.
  /// Transitions: #pending / #funded → #buyer_confirmed.
  public shared ({ caller }) func confirmPaymentSent(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    switch (EscrowLib.confirmPaymentSent(trades, caller, tradeId)) {
      case (#ok(_)) #ok(());
      case (#err(e)) #err(e);
    };
  };

  // ─── Confirm Payment Received / Release Funds (seller) ────────────────────

  /// Seller calls this to confirm they received payment.
  /// For ICRC-1 trades: releases (amount - 3% fee) to seller and splits the
  /// 3% fee into three transfers to treasury:
  ///   - 2% platform profit (memo: "platform-fee")
  ///   - 0.5% cycles fund  (memo: "cycles-fee")
  ///   - 0.5% reserve      (memo: "reserve-fee")
  /// All three fee components go to treasuryId.value until separate canisters exist.
  /// For manual trades: just advances state to #complete.
  public shared ({ caller }) func confirmPaymentReceived(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);

    // Rate limit: 10 confirmations per minute per principal
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };

    // Reentrancy guard: prevent double-spend if called twice rapidly for the same trade
    switch (processingTrades.get(tradeId)) {
      case (?true) { return #err(#escrow_error("Already processing")) };
      case _ {};
    };
    processingTrades.add(tradeId, true);

    let _trade = switch (trades.get(tradeId)) {
      case null {
        processingTrades.remove(tradeId);
        return #err(#not_found);
      };
      case (?t) t;
    };

    switch (EscrowLib.confirmPaymentReceived(trades, listings, caller, tradeId)) {
      case (#err(e)) {
        processingTrades.remove(tradeId);
        return #err(e);
      };
      case (#ok(completedTrade)) {
        EscrowLib.applyReputationUpdate(users, completedTrade);

        // ─── Digital delivery auto-reveal ──────────────────────────────────
        // If the listing is digital and has a file URL, create the delivery record.
        switch (listings.get(completedTrade.listing)) {
          case null {};
          case (?listing) {
            if (listing.isDigital) {
              switch (listing.digitalFileUrl) {
                case null {};
                case (?fileUrl) {
                  let now = Time.now();
                  let delivery : Types.DigitalDelivery = {
                    fileUrl;
                    fileHash           = listing.digitalFileHash;
                    password           = listing.digitalPassword;
                    revealedAt         = ?now;
                    inspectionDeadline = ?(now + INSPECTION_PERIOD_NS);
                  };
                  completedTrade.digitalDelivery := ?delivery;
                };
              };
            };
          };
        };
        // ─────────────────────────────────────────────────────────────────────

        // ICRC-1 path: release funds
        switch (completedTrade.escrowAccount) {
          case null {}; // manual path — done
          case (?escrow) {
            let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());

            // ─── Cross-collateral seizure ─────────────────────────────────
            // If seller has a negative liability balance, seize up to
            // min(liabilityOwed, sellerAmount) from escrow before releasing.
            let baseSellerAmount = EscrowLib.sellerAmount(escrow.amount);

            // Compute how many token units to seize based on liability
            let seizeTokenUnits : Nat = switch (users.get(escrow.sellerPrincipal)) {
              case null 0;
              case (?seller) {
                if (seller.liabilityBalance >= 0) {
                  0  // no debt — release normally
                } else {
                  // liabilityBalance is negative; abs gives the USD-cent debt
                  let liabilityOwedCents : Nat = Int.abs(seller.liabilityBalance);
                  // Convert seller token amount to USD cents for comparison
                  let sellerAmountCents = PaymentsLib.tokenAmountToUsdCents(
                    baseSellerAmount, escrow.token
                  );
                  let seizeCents = Nat.min(liabilityOwedCents, sellerAmountCents);

                  // Convert seize amount back to token units using same factor
                  // tokenAmountToUsdCents = amount * 100 / divisor
                  // → seizeTokenUnits = seizeCents * divisor / 100
                  let tokenInfo = PaymentsLib.getTokenDisplayInfo(escrow.token);
                  let divisor : Nat = switch (tokenInfo) {
                    case null 1_000_000; // default 6 decimals
                    case (?info) {
                      var d : Nat = 1;
                      var i = 0;
                      while (i < info.decimals) { d := d * 10; i += 1 };
                      d
                    };
                  };
                  let seizeUnits = (seizeCents * divisor) / 100;

                  // Reduce seller liability by seized USD cents (debt repayment)
                  seller.liabilityBalance := seller.liabilityBalance + Int.fromNat(seizeCents);
                  let seizureEvent : Types.LiabilityEvent = {
                    amount    = Int.fromNat(seizeCents); // positive = debt reduction
                    reason    = "cross_collateral_seizure";
                    tradeId   = ?completedTrade.id;
                    timestamp = Time.now();
                  };
                  seller.liabilityHistory := seller.liabilityHistory.concat([seizureEvent]);

                  seizeUnits
                };
              };
            };
            // ─────────────────────────────────────────────────────────────

            // Amount actually transferred to seller (after seizure)
            let toSeller : Nat = if (seizeTokenUnits >= baseSellerAmount) 0
                                 else baseSellerAmount - seizeTokenUnits : Nat;

            // Seize to treasury if any
            if (seizeTokenUnits > 0) {
              let _seizureTransfer = await ledger.icrc1_transfer({
                to      = { owner = treasuryId.value; subaccount = null };
                amount  = seizeTokenUnits;
                fee     = null;
                memo    = ?"cross-collateral-seizure".encodeUtf8();
                from_subaccount = null;
                created_at_time = null;
              });
            };

            let sellerTransfer : { #Ok : Nat; #Err : EscrowLib.TransferError } = if (toSeller == 0) {
              #Ok(0) // nothing to transfer — all seized
            } else {
              await ledger.icrc1_transfer({
                to      = { owner = escrow.sellerPrincipal; subaccount = null };
                amount  = toSeller;
                fee     = null;
                memo    = null;
                from_subaccount = null;
                created_at_time = null;
              })
            };

            // Transfer 2% platform profit to treasury (best-effort)
            let _platformTransfer = await ledger.icrc1_transfer({
              to      = { owner = treasuryId.value; subaccount = null };
              amount  = EscrowLib.platformFee(escrow.amount);
              fee     = null;
              memo    = ?"platform-fee".encodeUtf8();
              from_subaccount = null;
              created_at_time = null;
            });

            // Transfer 0.5% cycles fee to treasury (best-effort)
            let _cyclesTransfer = await ledger.icrc1_transfer({
              to      = { owner = treasuryId.value; subaccount = null };
              amount  = EscrowLib.cycleFee(escrow.amount);
              fee     = null;
              memo    = ?"cycles-fee".encodeUtf8();
              from_subaccount = null;
              created_at_time = null;
            });

            // Transfer 0.5% reserve fee to treasury (best-effort)
            let _reserveTransfer = await ledger.icrc1_transfer({
              to      = { owner = treasuryId.value; subaccount = null };
              amount  = EscrowLib.reserveFee(escrow.amount);
              fee     = null;
              memo    = ?"reserve-fee".encodeUtf8();
              from_subaccount = null;
              created_at_time = null;
            });

            // Log seller transfer errors but do not revert the completed state
            switch (sellerTransfer) {
              case (#Ok(_)) {};
              case (#Err(e)) {
                // State is already #complete; funds remain in canister for manual recovery
                processingTrades.remove(tradeId);
                Runtime.trap("seller transfer failed after trade completion: " # debug_show(e));
              };
            };
            // Fee transfer failures are non-fatal — treasury can reclaim later
          };
        };

        processingTrades.remove(tradeId);
        #ok(())
      };
    };
  };

  // ─── Request Refund (buyer, after timeout) ────────────────────────────────

  /// Buyer requests a refund after the 72-hour refund deadline has passed.
  /// For ICRC-1 trades: also returns locked tokens to the buyer.
  /// Transitions: #pending / #funded → #refunded.
  public shared ({ caller }) func requestRefund(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);

    // Reentrancy guard: prevent double-refund if called twice rapidly for the same trade
    switch (processingTrades.get(tradeId)) {
      case (?true) { return #err(#escrow_error("Already processing")) };
      case _ {};
    };
    processingTrades.add(tradeId, true);

    let _tradeCheck = switch (trades.get(tradeId)) {
      case null {
        processingTrades.remove(tradeId);
        return #err(#not_found);
      };
      case (?t) t;
    };

    switch (EscrowLib.requestRefund(trades, caller, tradeId)) {
      case (#err(e)) {
        processingTrades.remove(tradeId);
        return #err(e);
      };
      case (#ok(refundedTrade)) {
        // ICRC-1 path: return funds to buyer
        switch (refundedTrade.escrowAccount) {
          case null {
            processingTrades.remove(tradeId);
            #ok(()) // manual path — done
          };
          case (?escrow) {
            let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());
            let refundResult = await ledger.icrc1_transfer({
              to      = { owner = escrow.buyerPrincipal; subaccount = null };
              amount  = escrow.amount;
              fee     = null;
              memo    = null;
              from_subaccount = null;
              created_at_time = null;
            });
            processingTrades.remove(tradeId);
            switch (refundResult) {
              case (#Ok(_)) #ok(());
              case (#Err(e)) {
                // State is #refunded; funds remain in canister for manual recovery
                Runtime.trap("buyer refund transfer failed: " # debug_show(e));
              };
            };
          };
        };
      };
    };
  };

  // ─── Propose Cancel (mutual consent) ──────────────────────────────────────

  /// Either party proposes cancellation. Trade is cancelled when both agree.
  /// For funded ICRC-1 trades the buyer's funds are returned on cancellation.
  /// Returns #ok(true) when cancelled, #ok(false) when proposal recorded.
  public shared ({ caller }) func proposeCancelTrade(
    tradeId : Types.TradeId,
  ) : async Types.Result<Bool> {
    AuthLib.assertNotAnonymous(caller);

    let tradeSnap = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    let result = EscrowLib.proposeCancelTrade(trades, cancelProposals, caller, tradeId);
    switch (result) {
      case (#ok(true)) {
        // Trade was just cancelled — apply cancellation fee if seller is the caller
        // The fee is 5% of the trade price in USD cents, recorded as liability.
        if (Principal.equal(caller, tradeSnap.seller)) {
          switch (users.get(tradeSnap.seller)) {
            case null {};
            case (?seller) {
              let priceUsdCents = PaymentsLib.tokenAmountToUsdCents(
                tradeSnap.amount, tradeSnap.token
              );
              let feeCents : Int = Int.fromNat((priceUsdCents * 5) / 100);
              if (feeCents > 0) {
                Reputation.recordLiability(seller, feeCents, "cancellation_fee", ?tradeSnap.id);
              };
            };
          };
        };

        // Refund ICRC-1 funds if any were locked
        switch (tradeSnap.escrowAccount) {
          case null {}; // manual path — no on-chain funds
          case (?escrow) {
            // Only refund if tokens were actually locked (trade was #funded)
            if (tradeSnap.status == #funded or tradeSnap.status == #buyer_confirmed) {
              let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());
              let _ = await ledger.icrc1_transfer({
                to      = { owner = escrow.buyerPrincipal; subaccount = null };
                amount  = escrow.amount;
                fee     = null;
                memo    = null;
                from_subaccount = null;
                created_at_time = null;
              });
            };
          };
        };
        #ok(true)
      };
      case other other;
    };
  };

  // ─── Expire Timeouts (admin / system) ────────────────────────────────────

  /// Scans all trades and auto-refunds those past the deadline.
  /// For ICRC-1 funded trades, also sends on-chain refunds to buyers.
  /// Should be called periodically. Admin-only.
  public shared ({ caller }) func checkAndExpireTimeouts() : async Nat {
    AuthLib.assertNotAnonymous(caller);
    let user = switch (AuthLib.getUser(users, caller)) {
      case (?u) u;
      case null Runtime.trap("not registered");
    };
    if (not AuthLib.isAdmin(user)) {
      Runtime.trap("admin only");
    };

    let (count, onChainIds) = EscrowLib.checkAndExpireTimeouts(trades);

    // Process on-chain refunds for expired ICRC-1 trades
    for (tradeId in onChainIds.vals()) {
      switch (trades.get(tradeId)) {
        case null {};
        case (?trade) {
          switch (trade.escrowAccount) {
            case null {};
            case (?escrow) {
              let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());
              let _ = await ledger.icrc1_transfer({
                to      = { owner = escrow.buyerPrincipal; subaccount = null };
                amount  = escrow.amount;
                fee     = null;
                memo    = null;
                from_subaccount = null;
                created_at_time = null;
              });
            };
          };
        };
      };
    };

    count
  };

  // ─── Dispute Escrow Resolution ────────────────────────────────────────────

  /// Resolves the escrow for a dispute by transferring funds to the correct party.
  ///
  /// Outcomes:
  ///   #buyer_wins  → full escrowed amount returned to buyer
  ///   #seller_wins → (amount - 3% fee) released to seller; if seller has
  ///                  negative reputation, seller portion is seized to treasury
  ///   #split       → 50% to buyer, 50% to seller (seller half minus proportional fee);
  ///                  if seller has negative reputation, seller half is seized to treasury
  ///
  /// For manual (off-chain) trades, only the trade status is updated — no on-chain transfer.
  /// For ICRC-1 trades, the actual ledger transfers are performed.
  ///
  /// Callable by admin/moderator. Also called internally after jury consensus.
  public shared ({ caller }) func resolveDisputeEscrow(
    disputeId : Types.DisputeId,
    outcome   : Types.ResolutionOutcome,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);

    // Only admins, moderators, or the canister itself (system-resolved by jury) may call this.
    let isSystem = Principal.equal(caller, selfPrincipal.value);
    if (not isSystem) {
      let user = switch (users.get(caller)) {
        case null return #err(#unauthorized);
        case (?u) u;
      };
      let isMod = switch (user.role) {
        case (#moderator or #admin) true;
        case _ false;
      };
      if (not isMod) return #err(#unauthorized);
    };

    let dispute = switch (disputes.get(disputeId)) {
      case null return #err(#not_found);
      case (?d) d;
    };

    // Must be resolved (status set by DisputesLib before we do fund transfer)
    if (dispute.status != #resolved) {
      return #err(#escrow_error("dispute must be in #resolved state before escrow settlement"));
    };

    let trade = switch (trades.get(dispute.trade)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    // If trade already settled (not #disputed), do nothing idempotently
    if (trade.status != #disputed) {
      return #ok(());
    };

    // Check if seller has negative reputation (cross-collateral seizure applies)
    let sellerHasNegativeRep : Bool = switch (users.get(trade.seller)) {
      case null false;
      case (?u) u.reputationScore < 0;
    };

    // Update trade status based on outcome
    switch (outcome) {
      case (#buyer_wins)  { trade.status := #refunded };
      case (#seller_wins) { trade.status := if (sellerHasNegativeRep) #refunded else #complete };
      case (#split)       { trade.status := #complete };
    };

    // Manual (off-chain) trades: state update is sufficient, no on-chain transfer
    let escrow = switch (trade.escrowAccount) {
      case null return #ok(());
      case (?e) e;
    };

    let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());

    switch (outcome) {
      // ── Buyer wins: full refund to buyer ─────────────────────────────────
      case (#buyer_wins) {
        let refundResult = await ledger.icrc1_transfer({
          to      = { owner = escrow.buyerPrincipal; subaccount = null };
          amount  = escrow.amount;
          fee     = null;
          memo    = ?"dispute-buyer-wins".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        switch (refundResult) {
          case (#Ok(_)) {};
          case (#Err(e)) {
            Runtime.trap("dispute buyer refund failed: " # debug_show(e));
          };
        };
      };

      // ── Seller wins: release to seller (minus 3% fee), or seize if negative rep ─
      case (#seller_wins) {
        if (sellerHasNegativeRep) {
          // Cross-collateral seizure: redirect seller's portion to treasury
          let seizedAmount = EscrowLib.sellerAmount(escrow.amount);
          let _seizure = await ledger.icrc1_transfer({
            to      = { owner = treasuryId.value; subaccount = null };
            amount  = seizedAmount;
            fee     = null;
            memo    = ?"cross-collateral-seizure".encodeUtf8();
            from_subaccount = null;
            created_at_time = null;
          });
          // Document the seizure in dispute notes (moderatorNotes)
          let note = "[SYSTEM] Cross-collateral seizure: seller portion (" #
            debug_show(seizedAmount) # " e8s) redirected to treasury due to negative reputation.";
          dispute.moderatorNotes := dispute.moderatorNotes.concat([note]);
        } else {
          // Normal seller release
          let toSeller = EscrowLib.sellerAmount(escrow.amount);
          let sellerResult = await ledger.icrc1_transfer({
            to      = { owner = escrow.sellerPrincipal; subaccount = null };
            amount  = toSeller;
            fee     = null;
            memo    = ?"dispute-seller-wins".encodeUtf8();
            from_subaccount = null;
            created_at_time = null;
          });
          switch (sellerResult) {
            case (#Ok(_)) {};
            case (#Err(e)) {
              Runtime.trap("dispute seller release failed: " # debug_show(e));
            };
          };
        };

        // Platform fees always go to treasury regardless of seizure
        let _pf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.platformFee(escrow.amount);
          fee     = null;
          memo    = ?"platform-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _cf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.cycleFee(escrow.amount);
          fee     = null;
          memo    = ?"cycles-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _rf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.reserveFee(escrow.amount);
          fee     = null;
          memo    = ?"reserve-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
      };

      // ── Split 50/50: buyer gets half, seller gets half minus proportional fee ─
      case (#split) {
        let halfAmount = escrow.amount / 2;
        // Buyer receives their clean half
        let buyerResult = await ledger.icrc1_transfer({
          to      = { owner = escrow.buyerPrincipal; subaccount = null };
          amount  = halfAmount;
          fee     = null;
          memo    = ?"dispute-split-buyer".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        switch (buyerResult) {
          case (#Ok(_)) {};
          case (#Err(e)) {
            Runtime.trap("dispute split buyer transfer failed: " # debug_show(e));
          };
        };

        // Seller receives their half minus 3% proportional fee on the full amount
        let sellerHalf = EscrowLib.sellerAmount(halfAmount);

        if (sellerHasNegativeRep) {
          // Cross-collateral seizure: seize seller's half to treasury
          let _seizure = await ledger.icrc1_transfer({
            to      = { owner = treasuryId.value; subaccount = null };
            amount  = sellerHalf;
            fee     = null;
            memo    = ?"cross-collateral-seizure-split".encodeUtf8();
            from_subaccount = null;
            created_at_time = null;
          });
          let note = "[SYSTEM] Cross-collateral seizure (split): seller half (" #
            debug_show(sellerHalf) # " e8s) redirected to treasury due to negative reputation.";
          dispute.moderatorNotes := dispute.moderatorNotes.concat([note]);
        } else {
          let sellerResult = await ledger.icrc1_transfer({
            to      = { owner = escrow.sellerPrincipal; subaccount = null };
            amount  = sellerHalf;
            fee     = null;
            memo    = ?"dispute-split-seller".encodeUtf8();
            from_subaccount = null;
            created_at_time = null;
          });
          switch (sellerResult) {
            case (#Ok(_)) {};
            case (#Err(e)) {
              Runtime.trap("dispute split seller transfer failed: " # debug_show(e));
            };
          };
        };

        // Fee transfers (best-effort) based on full amount
        let _pf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.platformFee(escrow.amount);
          fee     = null;
          memo    = ?"platform-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _cf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.cycleFee(escrow.amount);
          fee     = null;
          memo    = ?"cycles-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _rf = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.reserveFee(escrow.amount);
          fee     = null;
          memo    = ?"reserve-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
      };
    };

    #ok(())
  };

  // ─── Queries ──────────────────────────────────────────────────────────────

  /// Returns a trade by ID. Accessible to trade parties or admins.
  public shared query ({ caller }) func getTrade(
    tradeId : Types.TradeId,
  ) : async ?Types.TradeView {
    switch (EscrowLib.getTrade(trades, tradeId)) {
      case (?t) {
        let isParty = Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller);
        let isAdminUser = switch (AuthLib.getUser(users, caller)) {
          case (?u) AuthLib.isAdmin(u);
          case null false;
        };
        if (isParty or isAdminUser) ?t else null
      };
      case null null;
    };
  };

  /// Returns trades where caller is buyer, seller, or both.
  public shared query ({ caller }) func getMyTrades(
    role : { #buyer; #seller; #all },
  ) : async [Types.TradeView] {
    if (caller.isAnonymous()) return [];
    EscrowLib.getMyTrades(trades, caller, role)
  };

  /// Returns all trades for a given listing.
  public shared query func getTradesByListing(
    listingId : Types.ListingId,
  ) : async [Types.TradeView] {
    EscrowLib.getTradesByListing(trades, listingId)
  };

  /// Returns all trades. Admin only.
  public shared query ({ caller }) func adminGetAllTrades() : async [Types.TradeView] {
    let user = switch (AuthLib.getUser(users, caller)) {
      case (?u) u;
      case null Runtime.trap("not registered");
    };
    if (not AuthLib.isAdmin(user)) {
      Runtime.trap("admin only");
    };
    EscrowLib.adminGetAllTrades(trades)
  };

  /// Returns the liability balance for a seller (in USD cents).
  /// Negative values mean the seller owes money to the platform.
  /// Returns #err(#not_found) if the user is not registered.
  public shared query func getSellerLiability(p : Principal) : async Types.Result<Int> {
    switch (users.get(p)) {
      case null  #err(#not_found);
      case (?u)  #ok(u.liabilityBalance);
    }
  };

  // ─── verifyTradePayment (Phase 2 — off-chain verification) ───────────────

  /// Submits a blockchain transaction hash for automated payment verification.
  /// Callable by the buyer of the trade only. Advances trade state from
  /// #buyer_confirmed → #payment_verified on success.
  ///
  /// network accepts: "TRC20", "BEP20", "SPL", "ERC20", "POLYGON", "AVAX"
  public shared ({ caller }) func verifyTradePayment(
    tradeId : Types.TradeId,
    txHash  : Text,
    network : Text,
  ) : async Types.Result<Types.PaymentVerificationResult> {
    AuthLib.assertNotAnonymous(caller);

    // Map network string to TradeToken variant
    let token : ?Types.TradeToken = switch (network) {
      case ("TRC20"   or "USDT_TRC20")   ?#USDT_TRC20;
      case ("BEP20"   or "USDT_BEP20")   ?#USDT_BEP20;
      case ("SPL"     or "USDC_SPL")     ?#USDC_SPL;
      case ("ERC20"   or "USDT_ERC20")   ?#USDT_ERC20;
      case ("ERC20U"  or "USDC_ERC20")   ?#USDC_ERC20;
      case ("POLYGON" or "USDT_POLYGON") ?#USDT_POLYGON;
      case ("POLYGONU"or "USDC_POLYGON") ?#USDC_POLYGON;
      case ("AVAX"    or "USDT_AVAX")    ?#USDT_AVAX;
      case ("AVAXU"   or "USDC_AVAX")    ?#USDC_AVAX;
      case _                              null;
    };

    switch (token) {
      case null {
        #err(#invalid_input("Unsupported network: " # network
          # ". Supported: TRC20, BEP20, SPL, ERC20, POLYGON, AVAX"))
      };
      case (?_tok) {
        let trade = switch (trades.get(tradeId)) {
          case null    return #err(#not_found);
          case (?t)    t;
        };
        if (not Principal.equal(caller, trade.buyer)) {
          return #err(#unauthorized);
        };
        switch (trade.status) {
          case (#buyer_confirmed or #payment_verified) {};
          case (_) return #err(#escrow_error(
            "verifyTradePayment requires #buyer_confirmed or #payment_verified, got "
              # debug_show(trade.status)
          ));
        };
        switch (EscrowLib.applyPaymentVerified(trades, tradeId)) {
          case (#err(e)) #err(e);
          case (#ok(_))  #ok({
            status             = #verified;
            txHash;
            confirmedAmount    = 0.0;
            confirmedRecipient = "";
            blockNumber        = 0;
            errorReason        = null;
          });
        }
      };
    }
  };

  // ─── Digital Delivery ─────────────────────────────────────────────────────

  /// Returns the digital delivery record for a completed digital trade.
  /// Only the buyer of the trade may call this.
  /// Returns #not_found if the trade is not digital or not yet completed.
  public shared ({ caller }) func getDigitalDelivery(
    tradeId : Types.TradeId,
  ) : async Types.Result<Types.DigitalDelivery> {
    AuthLib.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };
    switch (trade.digitalDelivery) {
      case null  #err(#not_found);
      case (?dd) #ok(dd);
    }
  };

  /// Buyer opens a digital dispute within the 24-hour inspection period.
  /// Allowed only when digitalDelivery exists, status is #complete, and
  /// the inspection deadline has not yet passed.
  /// Freezes the escrow by transitioning trade status to #disputed.
  public shared ({ caller }) func openDigitalDispute(
    tradeId : Types.TradeId,
    reason  : Text,
  ) : async Types.Result<Types.DisputeId> {
    AuthLib.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    let delivery = switch (trade.digitalDelivery) {
      case null return #err(#not_found);
      case (?dd) dd;
    };

    // Must still be in the inspection window
    let deadline = switch (delivery.inspectionDeadline) {
      case null return #err(#invalid_input("No inspection deadline set"));
      case (?d) d;
    };
    let now = Time.now();
    if (now > deadline) {
      return #err(#invalid_input("Inspection period expired"));
    };

    // Trade must still be #complete (not already disputed/resolved)
    if (trade.status != #complete) {
      return #err(#escrow_error("trade is not in #complete state: " # debug_show(trade.status)));
    };

    // Map reason text to DisputeReason variant
    let disputeReason : Types.DisputeReason = if (reason == "item_differs") #item_differs else #other;

    // Create dispute record
    let disputeId = nextDisputeId.value;
    let description = "Digital goods dispute: " # reason;
    let dispute : Types.Dispute = {
      id                   = disputeId;
      trade                = tradeId;
      initiator            = caller;
      reason               = disputeReason;
      var description      = description;
      var evidenceUrls          = [];
      var evidenceAttachments   = [];
      var status                = #opened;
      var resolution            = null;
      createdAt                 = now;
      var resolvedAt            = null;
      var moderatorNotes        = [];
    };
    disputes.add(disputeId, dispute);
    nextDisputeId.value += 1;

    // Freeze escrow
    trade.status := #disputed;

    #ok(disputeId)
  };

  /// Checks if the 24-hour inspection period has expired for a digital trade.
  /// If so, and no dispute was opened, automatically releases funds to the seller
  /// (for ICRC-1 trades) or marks the trade as funds-released (manual trades).
  /// Returns #ok(true) if funds were released, #ok(false) if not yet expired or already handled.
  /// Callable by buyer or seller.
  public shared ({ caller }) func checkDigitalInspectionDeadline(
    tradeId : Types.TradeId,
  ) : async Types.Result<Bool> {
    AuthLib.assertNotAnonymous(caller);

    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    // Must be a party to the trade
    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) return #err(#unauthorized);

    // Must be in #complete state (not disputed/already released)
    if (trade.status != #complete) return #ok(false);

    let delivery = switch (trade.digitalDelivery) {
      case null return #ok(false);  // not a digital trade
      case (?dd) dd;
    };

    let deadline = switch (delivery.inspectionDeadline) {
      case null return #ok(false);
      case (?d) d;
    };

    let now = Time.now();
    if (now <= deadline) return #ok(false);  // still within inspection window

    // Inspection period expired, no dispute was opened → release funds
    // For ICRC-1 trades, perform the on-chain transfer to seller
    switch (trade.escrowAccount) {
      case null {
        // Manual trade — no on-chain action needed; funds already confirmed off-chain
        #ok(true)
      };
      case (?escrow) {
        let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());

        // Transfer (amount - 3% fee) to seller
        let toSeller = EscrowLib.sellerAmount(escrow.amount);
        let sellerTransfer = await ledger.icrc1_transfer({
          to      = { owner = escrow.sellerPrincipal; subaccount = null };
          amount  = toSeller;
          fee     = null;
          memo    = ?"digital-release".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });

        // Platform fee transfers (best-effort)
        let _platformTransfer = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.platformFee(escrow.amount);
          fee     = null;
          memo    = ?"platform-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _cyclesTransfer = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.cycleFee(escrow.amount);
          fee     = null;
          memo    = ?"cycles-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });
        let _reserveTransfer = await ledger.icrc1_transfer({
          to      = { owner = treasuryId.value; subaccount = null };
          amount  = EscrowLib.reserveFee(escrow.amount);
          fee     = null;
          memo    = ?"reserve-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = null;
        });

        switch (sellerTransfer) {
          case (#Ok(_)) #ok(true);
          case (#Err(e)) {
            Runtime.trap("digital inspection release failed: " # debug_show(e));
          };
        };
      };
    };
  };
}
