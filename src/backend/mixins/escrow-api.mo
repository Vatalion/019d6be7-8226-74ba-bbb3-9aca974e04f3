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
import DigitalDeliveryLib "../lib/DigitalDelivery";
import DisputesLib "../lib/Disputes";
import OnChainSettlement "../lib/OnChainSettlement";

/// Escrow API mixin — public endpoints for the P2P trade state machine.
/// Covers both the manual off-chain flow and the ICRC-1 on-chain escrow flow.
/// Receives all escrow state slices via mixin parameters.
mixin (
  users                : Map.Map<Types.UserId, Types.User>,
  listings             : Map.Map<Types.ListingId, Types.Listing>,
  trades               : Map.Map<Types.TradeId, Types.Trade>,
  listingStakes        : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
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
  liabilityRecords     : Map.Map<Nat, Types.LiabilityRecord>,
  nextLiabilityId      : { var value : Nat },
) {

  func settlementErrMsg(e : Types.Error) : Text {
    switch (e) {
      case (#escrow_error(msg)) msg;
      case (_) debug_show(e);
    }
  };

  /// Executes queued ICRC settlement; finalizes terminal status only on ledger success (E9.S3).
  func tryExecuteOnChainSettlement(tradeId : Types.TradeId) : async Types.Result<Bool> {
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    let pending = switch (trade.pendingOnChainSettlement) {
      case null return #ok(false);
      case (?p) p;
    };
    let escrow = switch (trade.escrowAccount) {
      case null return #ok(false);
      case (?e) e;
    };
    let ledger : EscrowLib.Icrc1Ledger = actor(escrow.ledgerCanisterId.toText());
    let execResult = await OnChainSettlement.executePending(
      trade, escrow, pending, users, treasuryId.value, ledger,
    );
    switch (execResult) {
      case (#ok(_)) {
        OnChainSettlement.finalizeTerminal(trade, listings, pending.targetStatus);
        #ok(true)
      };
      case (#err(e)) {
        OnChainSettlement.recordFailure(trade, settlementErrMsg(e));
        #err(e)
      };
    }
  };

  func afterTradeTransitionWithSettlement(
    tradeId : Types.TradeId,
    applyReputation : Bool,
  ) : async Types.Result<()> {
    switch (await tryExecuteOnChainSettlement(tradeId)) {
      case (#err(e)) #err(e);
      case (#ok(didSettle)) {
        if (applyReputation and didSettle) {
          switch (trades.get(tradeId)) {
            case (?t) {
              if (t.status == #complete) {
                EscrowLib.applyReputationUpdate(users, t);
              };
            };
            case null {};
          };
        };
        #ok(())
      };
    }
  };

  // ─── Initiate Trade (manual/off-chain path) ───────────────────────────────

  /// High-value trade cap preview for buy/checkout UI (E3.S11 / FR-21d).
  public shared query func tradeCapTierCheck(
    listingId : Types.ListingId,
    tradeToken : Types.TradeToken,
  ) : async EscrowLib.TradeCapTierCheck {
    switch (listings.get(listingId)) {
      case null {
        {
          tier = #rejected;
          allowed = false;
          usdCents = 0;
          ckOnlyRequired = false;
          gateCRequired = false;
          sellerVerifiedTierOk = false;
          elevatedStakeRequired = 0;
          sellerStakeOk = false;
          blockReason = ?"Listing not found";
        }
      };
      case (?listing) {
        let seller = switch (users.get(listing.seller)) {
          case null {
            return {
              tier = #rejected;
              allowed = false;
              usdCents = 0;
              ckOnlyRequired = false;
              gateCRequired = false;
              sellerVerifiedTierOk = false;
              elevatedStakeRequired = 0;
              sellerStakeOk = false;
              blockReason = ?"Seller not found";
            };
          };
          case (?u) u;
        };
        let stakeAmount = switch (listingStakes.get(listingId)) {
          case null 0;
          case (?rec) rec.amount;
        };
        EscrowLib.buildTradeCapTierCheck(
          listing.priceAmount,
          listing.priceToken,
          tradeToken,
          seller.kycTier,
          stakeAmount,
          systemSettings.trustlessEscrowEnabled,
        )
      };
    }
  };

  /// Creates a new trade using the manual confirmation flow.
  /// ckUSDC/ckUSDT: handshake first when Gate C is enabled; lock via initiateOnChainTrade after PaymentIntent.
  public shared ({ caller }) func initiateTrade(
    listingId         : Types.ListingId,
    token             : Types.TradeToken,
    shippingSelection : ?Types.ShippingSelection,
  ) : async Types.Result<Types.TradeId> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    // Rate limit: 5 trades per hour per principal
    if (not RateLimiter.check(caller, 3_600_000_000_000, 5, rateLimitInitiateTrade)) {
      return #err(#rate_limited);
    };
    if (EscrowLib.isOnChainToken(token) and not systemSettings.trustlessEscrowEnabled) {
      return #err(#escrow_error(
        "On-chain ck escrow is disabled pending Gate C sign-off"
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
    if (not Reputation.canTradeAmountForUser(buyer.reputationScore, buyer.kycTier, priceUsdCents)) {
      return #err(#invalid_input(Reputation.gateErrorForUser(buyer.reputationScore, buyer.kycTier, priceUsdCents)));
    };
    if (Reputation.isTradeBlocked(buyer)) {
      return #err(#invalid_input(Reputation.tradeBlockedErrorUa(buyer, liabilityRecords)));
    };
    // Block seller with outstanding liability from receiving new trades
    let sellerUser = switch (users.get(listing.seller)) {
      case null return #err(#not_found);
      case (?s) s;
    };
    if (Reputation.isTradeBlocked(sellerUser)) {
      return #err(#invalid_input(Reputation.tradeBlockedErrorUa(sellerUser, liabilityRecords)));
    };

    let listingStakeAmount = switch (listingStakes.get(listingId)) {
      case null 0;
      case (?rec) rec.amount;
    };

    let result = EscrowLib.initiateTrade(
      trades, listings, nextTradeId.value, caller, listingId, token, shippingSelection,
      sellerUser.kycTier,
      listingStakeAmount,
      systemSettings.trustlessEscrowEnabled,
      systemSettings.ckOnChainBetaCapUsdCents,
    );
    switch (result) {
      case (#ok(trade)) {
        nextTradeId.value += 1;
        #ok(trade.id)
      };
      case (#err(e)) #err(e);
    };
  };

  // ─── Initiate On-Chain Trade (ICRC-1 path, post-handshake — E9.S2) ────────

  /// Locks ckUSDC/ckUSDT for an existing seller-confirmed trade via icrc2_transfer_from.
  /// Buyer must have called icrc2_approve on the ledger first.
  ///
  /// Flow:
  ///   1. Gate C + PaymentIntent (ck path) + #payment_intent checks (sync)
  ///   2. Advance trade to #awaiting_approval
  ///   3. Call icrc2_transfer_from — pulls intent.exactAmount from buyer to this canister
  ///   4. Success → #funded; ledger error → rollback to #payment_intent (no nextTradeId mutation)
  public shared ({ caller }) func initiateOnChainTrade(
    tradeId : Types.TradeId,
  ) : async Types.Result<Types.TradeId> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not systemSettings.trustlessEscrowEnabled) {
      let tradeRef = switch (trades.get(tradeId)) {
        case null return #err(#not_found);
        case (?t) t;
      };
      if (not EscrowLib.isInFlightCkLockEligible(tradeRef, false)) {
        return #err(#escrow_error(
          "On-chain escrow is disabled pending Gate C sign-off. Use initiateTrade for manual payment."
        ));
      };
    };
    if (not RateLimiter.check(caller, 3_600_000_000_000, 5, rateLimitInitiateTrade)) {
      return #err(#rate_limited);
    };

    let tradeRef = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    let ledgerId = switch (
      EscrowLib.ledgerCanisterId(
        tradeRef.token,
        systemSettings.ckUsdcLedgerId,
        systemSettings.ckUsdtLedgerId,
      )
    ) {
      case (?id) id;
      case null return #err(#escrow_error(
        "Token does not support on-chain escrow"
      ));
    };

    let prepareResult = EscrowLib.prepareOnChainTradeLock(
      trades, caller, tradeId, ledgerId, systemSettings.ckOnChainBetaCapUsdCents,
    );
    let trade = switch (prepareResult) {
      case (#ok(t)) t;
      case (#err(e)) return #err(e);
    };

    if (trade.status == #funded) {
      return #ok(tradeId);
    };

    let lockAmount = switch (trade.escrowAccount) {
      case (?e) e.amount;
      case null return #err(#escrow_error("Escrow account missing after lock prepare"));
    };

    let ledger : EscrowLib.Icrc1Ledger = actor(ledgerId.toText());
    let transferResult = await ledger.icrc2_transfer_from({
      from    = { owner = caller; subaccount = null };
      to      = { owner = selfPrincipal.value; subaccount = null };
      amount  = lockAmount;
      fee     = null;
      memo    = null;
      spender_subaccount = null;
      created_at_time = null;
    });

    switch (transferResult) {
      case (#Ok(_blockIndex)) {
        switch (EscrowLib.markFunded(trades, tradeId)) {
          case (#ok(_)) {};
          case (#err(e)) return #err(e);
        };
        switch (listings.get(trade.listing)) {
          case (?listing) {
            if (listing.isDigital) {
              ignore DigitalDeliveryLib.tryAutoDeliver(
                trades, listings, tradeId, selfPrincipal.value,
              );
            } else {
              ignore EscrowLib.enterPhysicalFulfillmentAfterFunded(trades, listings, tradeId);
            };
          };
          case null {};
        };
        #ok(tradeId);
      };
      case (#Err(tfErr)) {
        ignore EscrowLib.rollbackOnChainLockFailure(trades, tradeId);
        #err(#escrow_error("ICRC-2 transfer_from failed: " # debug_show(tfErr)))
      };
    };
  };

  // ─── Confirm Payment Sent (buyer) ─────────────────────────────────────────

  /// Buyer calls this to confirm they have sent the crypto payment off-chain.
  /// Transitions: #payment_intent / #pending / #funded → #buyer_confirmed.
  public shared ({ caller }) func confirmPaymentSent(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    switch (EscrowLib.confirmPaymentSent(trades, caller, tradeId)) {
      case (#ok(_)) #ok(());
      case (#err(e)) #err(e);
    };
  };

  // ─── Seller handshake (E3.S7 / FR-21a) ────────────────────────────────────

  /// Seller confirms an incoming buy request within the 24h handshake window.
  /// Advances trade to #payment_intent (buyer may pay after this).
  public shared ({ caller }) func confirmSellerHandshake(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 20, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };
    switch (EscrowLib.confirmSellerHandshake(trades, caller, tradeId)) {
      case (#ok(_)) #ok(());
      case (#err(e)) #err(e);
    };
  };

  /// Seller declines an incoming buy request → #cancelled_no_seller_response.
  public shared ({ caller }) func declineSellerHandshake(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 20, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };
    switch (EscrowLib.declineSellerHandshake(trades, caller, tradeId)) {
      case (#ok(_)) #ok(());
      case (#err(e)) #err(e);
    };
  };

  /// Scans trades in #awaiting_seller_handshake and auto-cancels past deadline.
  /// Callable by trade parties or admin (same pattern as digital inspection check).
  public shared ({ caller }) func checkHandshakeTimeouts() : async Nat {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    let isAdminUser = switch (AuthLib.getUser(users, caller)) {
      case (?u) AuthLib.isAdmin(u);
      case null false;
    };
    if (not isAdminUser) {
      let hasHandshakeTrade = trades.values().any(func(t : Types.Trade) : Bool {
        t.status == #awaiting_seller_handshake and (
          Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller)
        )
      });
      if (not hasHandshakeTrade) {
        return 0;
      };
    };
    EscrowLib.checkHandshakeTimeouts(trades)
  };

  // ─── PaymentIntent (E3.S10 / FR-21b) ─────────────────────────────────────

  /// Creates PaymentIntent after seller handshake; wires payout wallet snapshot (E4.S7).
  /// Seller passes walletLinkId to snapshot; buyer may call when snapshot already exists.
  public shared ({ caller }) func createPaymentIntent(
    tradeId      : Types.TradeId,
    walletLinkId : ?Nat,
    path         : Types.PaymentSettlementPath,
  ) : async Types.Result<Types.PaymentIntent> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 20, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };
    EscrowLib.createPaymentIntent(
      trades,
      users,
      caller,
      tradeId,
      walletLinkId,
      path,
      systemSettings.platformFeeBps,
      systemSettings.trustlessEscrowEnabled,
      systemSettings.ckOnChainBetaCapUsdCents,
    )
  };

  /// Expires stale PaymentIntents — late explorer verify stays fail-closed (E3.S10 AC 5).
  public shared ({ caller }) func checkPaymentIntentExpiry() : async Nat {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    let isAdminUser = switch (AuthLib.getUser(users, caller)) {
      case (?u) AuthLib.isAdmin(u);
      case null false;
    };
    if (not isAdminUser) {
      let hasIntentTrade = trades.values().any(func(t : Types.Trade) : Bool {
        t.paymentIntent != null and (
          Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller)
        )
      });
      if (not hasIntentTrade) return 0;
    };
    EscrowLib.checkPaymentIntentExpiry(trades)
  };

  // ─── Buyer receipt confirm + fulfillment timers (E7.S3) ───────────────────

  /// Buyer confirms physical goods received — completes before 48h NP grace.
  public shared ({ caller }) func confirmBuyerReceipt(
    tradeId : Types.TradeId,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };
    switch (EscrowLib.confirmBuyerReceipt(trades, listings, users, caller, tradeId)) {
      case (#err(e)) #err(e);
      case (#ok(_)) {
        switch (await afterTradeTransitionWithSettlement(tradeId, true)) {
          case (#ok(_)) #ok(());
          case (#err(e)) #err(e);
        };
      };
    };
  };

  /// Scans ship-by SLA, NP delivered grace, digital inspection, and dispute L1 SLA.
  public shared ({ caller }) func checkFulfillmentDeadlines() : async {
    shipByEscalations : Nat;
    autoCompletions : Nat;
    digitalAutoCompletions : Nat;
    disputeL1Escalations : Nat;
  } {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    let user = switch (AuthLib.getUser(users, caller)) {
      case (?u) u;
      case null Runtime.trap("not registered");
    };
    if (not AuthLib.isAdmin(user) and not AuthLib.isModerator(user)) {
      Runtime.trap("admin or moderator only");
    };
    let escalatedTradeIds = EscrowLib.checkShipByDeadlines(trades);
    var shipByEscalations = 0;
    for (tradeId in escalatedTradeIds.vals()) {
      switch (DisputesLib.attachSystemShipBySlaDispute(disputes, trades, nextDisputeId.value, tradeId)) {
        case (?_) {
          nextDisputeId.value += 1;
          shipByEscalations += 1;
        };
        case null {};
      };
    };
    let npAutoCompletions = EscrowLib.processNpAutoComplete(trades, listings);
    let digitalAutoCompletions = EscrowLib.processDigitalInspectionAutoComplete(trades, listings);
    for (tradeId in OnChainSettlement.collectPendingTradeIds(trades).vals()) {
      ignore await tryExecuteOnChainSettlement(tradeId);
    };
    let disputeL1Escalations = DisputesLib.processL1SlaEscalations(disputes, trades);
    {
      shipByEscalations;
      autoCompletions = npAutoCompletions + digitalAutoCompletions;
      digitalAutoCompletions;
      disputeL1Escalations;
    }
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
    AuthLib.assertCallerNotBanned(users, caller);

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

    switch (EscrowLib.confirmPaymentReceived(trades, listings, users, caller, tradeId)) {
      case (#err(e)) {
        processingTrades.remove(tradeId);
        return #err(e);
      };
      case (#ok(completedTrade)) {
        switch (completedTrade.escrowAccount) {
          case null {
            EscrowLib.applyReputationUpdate(users, completedTrade);
            processingTrades.remove(tradeId);
            #ok(())
          };
          case (?_) {
            switch (await afterTradeTransitionWithSettlement(tradeId, true)) {
              case (#ok(_)) {
                processingTrades.remove(tradeId);
                #ok(())
              };
              case (#err(e)) {
                processingTrades.remove(tradeId);
                #err(e)
              };
            };
          };
        };
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
    AuthLib.assertCallerNotBanned(users, caller);

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
        switch (refundedTrade.escrowAccount) {
          case null {
            processingTrades.remove(tradeId);
            #ok(())
          };
          case (?_) {
            switch (await afterTradeTransitionWithSettlement(tradeId, false)) {
              case (#ok(_)) {
                processingTrades.remove(tradeId);
                #ok(())
              };
              case (#err(e)) {
                processingTrades.remove(tradeId);
                #err(e)
              };
            };
          };
        };
      };
    };
  };

  // ─── Buyer cancel before shipment (E3.S9 / FR-21c) ───────────────────────

  /// Buyer unilateral cancel after payment verified and before shipment — 85/10/5 split.
  public shared ({ caller }) func buyerCancelBeforeShipment(
    tradeId : Types.TradeId,
  ) : async Types.Result<Types.BuyerCancelPenaltySplit> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitConfirmPayment)) {
      return #err(#rate_limited);
    };

    switch (processingTrades.get(tradeId)) {
      case (?true) { return #err(#escrow_error("Already processing")) };
      case _ {};
    };
    processingTrades.add(tradeId, true);

    let tradeSnap = switch (trades.get(tradeId)) {
      case null {
        processingTrades.remove(tradeId);
        return #err(#not_found);
      };
      case (?t) t;
    };

    let result = EscrowLib.buyerCancelBeforeShipment(trades, caller, tradeId);
    switch (result) {
      case (#err(e)) {
        processingTrades.remove(tradeId);
        return #err(e);
      };
      case (#ok(split)) {
        switch (tradeSnap.escrowAccount) {
          case null {
            if (split.sellerCompensation > 0) {
              OnChainSettlement.sellerCompensationCredit(tradeSnap, users, split);
            };
            processingTrades.remove(tradeId);
            #ok(split)
          };
          case (?_) {
            switch (await afterTradeTransitionWithSettlement(tradeId, false)) {
              case (#ok(_)) {
                processingTrades.remove(tradeId);
                #ok(split)
              };
              case (#err(e)) {
                processingTrades.remove(tradeId);
                #err(e)
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
    AuthLib.assertCallerNotBanned(users, caller);

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
              let feeCentsNat = (priceUsdCents * 5) / 100;
              if (feeCentsNat > 0) {
                ignore Reputation.createLiability(
                  liabilityRecords,
                  nextLiabilityId,
                  seller,
                  feeCentsNat,
                  tradeSnap.token,
                  #cancellation_fee,
                  caller,
                  ?tradeSnap.id,
                );
              };
            };
          };
        };

        // Refund ICRC-1 funds if any were locked. EscrowLib queued the refund;
        // execute through the settlement path so ledger failure leaves a
        // retryable pending settlement instead of a silently cancelled trade.
        switch (tradeSnap.escrowAccount) {
          case null {}; // manual path — no on-chain funds
          case (?_) {
            switch (await afterTradeTransitionWithSettlement(tradeId, false)) {
              case (#ok(_)) {};
              case (#err(e)) return #err(e);
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
    AuthLib.assertCallerNotBanned(users, caller);
    let user = switch (AuthLib.getUser(users, caller)) {
      case (?u) u;
      case null Runtime.trap("not registered");
    };
    if (not AuthLib.isAdmin(user)) {
      Runtime.trap("admin only");
    };

    let (count, onChainIds) = EscrowLib.checkAndExpireTimeouts(trades);

    for (tradeId in onChainIds.vals()) {
      ignore await tryExecuteOnChainSettlement(tradeId);
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
    AuthLib.assertCallerNotBanned(users, caller);

    // Only admins, moderators, or the canister itself (system-resolved by jury) may call this.
    let isSystem = Principal.equal(caller, selfPrincipal.value);
    if (not isSystem) {
      let user = switch (users.get(caller)) {
        case null return #err(#unauthorized);
        case (?u) u;
      };
      if (not AuthLib.canActAsModerator(user)) return #err(#unauthorized);
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

    // Idempotent: terminal status with no pending on-chain work means settlement finished.
    if (not DisputesLib.isDisputeFrozenTradeStatus(trade.status)
      and not OnChainSettlement.hasPending(trade)) {
      return #ok(());
    };

    // Cross-collateral seizure when seller owes platform (same check as releaseToSeller).
    let sellerHasNegativeRep : Bool = switch (users.get(trade.seller)) {
      case null false;
      case (?u) Reputation.isLiabilityNegative(u);
    };

    let targetStatus : Types.TradeStatus = switch (outcome) {
      case (#buyer_wins) #refunded;
      case (#seller_wins) if (sellerHasNegativeRep) #refunded else #complete;
      case (#split) #complete;
    };

    // Manual (off-chain) trades: state update is sufficient, no on-chain transfer
    switch (trade.escrowAccount) {
      case null {
        trade.status := targetStatus;
        if (targetStatus == #complete) {
          trade.completedAt := ?Types.now();
          switch (listings.get(trade.listing)) {
            case (?l) {
              l.status := #sold;
              l.resolvedAt := ?Types.now();
            };
            case null {};
          };
        };
        return #ok(());
      };
      case (?escrow) {
        if (OnChainSettlement.hasPending(trade)) {
          return #err(#escrow_error("On-chain settlement already pending — retry or wait"));
        };
        let op : Types.OnChainSettlementOp = switch (outcome) {
          case (#buyer_wins) #disputeBuyerWins;
          case (#seller_wins) #disputeSellerWins { sellerHasNegativeRep };
          case (#split) #disputeSplit { sellerHasNegativeRep };
        };
        OnChainSettlement.queue(trade, op, targetStatus);
        switch (await tryExecuteOnChainSettlement(trade.id)) {
          case (#ok(true)) {
            if (targetStatus == #complete) {
              EscrowLib.applyReputationUpdate(users, trade);
            };
            #ok(())
          };
          case (#ok(false)) #err(#escrow_error("dispute settlement was not queued"));
          case (#err(e)) #err(e);
        };
      };
    };
  };

  /// Retries all pending on-chain settlements (admin/system job — E9.S3 AC 3).
  public shared ({ caller }) func retryPendingOnChainSettlements() : async {
    attempted : Nat;
    succeeded : Nat;
    failed : Nat;
  } {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    let user = switch (users.get(caller)) {
      case null return { attempted = 0; succeeded = 0; failed = 0 };
      case (?u) u;
    };
    let isAdminUser = switch (user.role) {
      case (#admin) true;
      case _ false;
    };
    if (not isAdminUser) {
      Runtime.trap("admin only");
    };

    let ids = OnChainSettlement.collectPendingTradeIds(trades);
    var attempted = 0;
    var succeeded = 0;
    var failed = 0;
    for (tradeId in ids.vals()) {
      attempted += 1;
      switch (await tryExecuteOnChainSettlement(tradeId)) {
        case (#ok(true)) {
          succeeded += 1;
          switch (trades.get(tradeId)) {
            case (?t) {
              if (t.status == #complete) {
                EscrowLib.applyReputationUpdate(users, t);
              };
            };
            case null {};
          };
        };
        case (#ok(false)) { failed += 1 };
        case (#err(_)) { failed += 1 };
      };
    };
    { attempted; succeeded; failed }
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

  /// Returns trades for a listing visible to caller (listing seller, trade party, or admin).
  public shared query ({ caller }) func getTradesByListing(
    listingId : Types.ListingId,
  ) : async [Types.TradeView] {
    if (caller.isAnonymous()) return [];
    let allForListing = EscrowLib.getTradesByListing(trades, listingId);
    let isListingSeller = switch (listings.get(listingId)) {
      case (?l) Principal.equal(caller, l.seller);
      case null false;
    };
    let isAdminUser = switch (AuthLib.getUser(users, caller)) {
      case (?u) AuthLib.isAdmin(u);
      case null false;
    };
    if (isAdminUser or isListingSeller) {
      allForListing
    } else {
      allForListing.filter(
        func(t : Types.TradeView) : Bool {
          Principal.equal(caller, t.buyer) or Principal.equal(caller, t.seller)
        },
      )
    }
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
  public shared query ({ caller }) func getSellerLiability(p : Principal) : async Types.Result<Int> {
    if (caller.isAnonymous()) return #err(#unauthorized);
    let isSelf = Principal.equal(caller, p);
    let isAdminUser = switch (AuthLib.getUser(users, caller)) {
      case (?u) AuthLib.isAdmin(u);
      case null false;
    };
    if (not (isSelf or isAdminUser)) {
      return #err(#unauthorized);
    };
    switch (users.get(p)) {
      case null  #err(#not_found);
      case (?u)  #ok(u.liabilityBalance);
    }
  };

  // ─── verifyTradePayment (Phase 2 — off-chain verification) ───────────────

  /// **Deprecated spoof path removed (E3.S10 / D-011).** Use verifyPayment instead.
  public shared ({ caller }) func verifyTradePayment(
    tradeId : Types.TradeId,
    txHash  : Text,
    network : Text,
  ) : async Types.Result<Types.PaymentVerificationResult> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    ignore txHash;
    ignore network;
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };
    #err(#escrow_error(
      "verifyTradePayment is disabled — use verifyPayment for explorer-verified settlement"
    ))
  };

  // ─── Digital Delivery ─────────────────────────────────────────────────────

  /// Returns the digital delivery record after auto-delivery (E2.S11).
  /// Only the buyer may call; rejected before funding completes.
  public shared ({ caller }) func getDigitalDelivery(
    tradeId : Types.TradeId,
  ) : async Types.Result<Types.DigitalDeliveryView> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };
    switch (DigitalDeliveryLib.assertDigitalDownloadAllowed(trade)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (trade.digitalDelivery) {
      case null  #err(#not_found);
      case (?dd) {
        DigitalDeliveryLib.touchRedownload(dd, Types.now());
        #ok(EscrowLib.toDigitalDeliveryViewForBuyer(dd))
      };
    }
  };

  /// Buyer opens a digital dispute within the 24-hour inspection period (E6.S9).
  /// Delegates to unified playbook openDispute with digital evidence pack.
  public shared ({ caller }) func openDigitalDispute(
    tradeId : Types.TradeId,
    reason  : Text,
  ) : async Types.Result<Types.DisputeId> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);

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

    let deadline = DigitalDeliveryLib.ensureInspectionDeadline(delivery);
    let now = Types.now();
    if (now > deadline) {
      return #err(#invalid_input("Inspection period expired"));
    };

    if (trade.status != #digital_delivered) {
      return #err(#escrow_error("trade is not in digital inspection state: " # debug_show(trade.status)));
    };

    let disputeReason : Types.DisputeReason = if (reason == "item_differs") #item_differs else #other;
    let downloadTs = switch (delivery.revealedAt) {
      case (?t) t;
      case null now;
    };
    let evidencePack : Types.DisputeEvidencePack = {
      ttnScreenshotUrl  = null;
      packagePhotoUrls  = [];
      chatThreadLink    = null;
      fileHash          = delivery.fileHash;
      downloadTimestamp = downloadTs;
    };

    let result = DisputesLib.openDispute(
      disputes,
      trades,
      nextDisputeId.value,
      caller,
      tradeId,
      disputeReason,
      "Digital goods dispute: " # reason,
      evidencePack,
      [],
    );
    switch (result) {
      case (#ok _) { nextDisputeId.value += 1 };
      case (#err(#invalid_input(_))) {
        if (disputes.containsKey(nextDisputeId.value)) {
          nextDisputeId.value += 1;
        };
      };
      case (#err(_)) {};
    };
    result
  };

  /// Checks if the 24-hour inspection period has expired for a digital trade.
  /// If so, and no dispute was opened, marks trade #complete (manual) or releases
  /// ICRC-1 escrow to seller. Dispute wins over auto-complete (E7.S2 AC 7).
  /// Returns #ok(true) if trade was completed, #ok(false) if not yet expired or already handled.
  /// Callable by buyer or seller.
  public shared ({ caller }) func checkDigitalInspectionDeadline(
    tradeId : Types.TradeId,
  ) : async Types.Result<Bool> {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.assertCallerNotBanned(users, caller);

    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };

    // Must be a party to the trade
    let isParty = Principal.equal(caller, trade.buyer) or Principal.equal(caller, trade.seller);
    if (not isParty) return #err(#unauthorized);

    if (trade.status != #digital_delivered) {
      return #ok(false);
    };
    switch (trade.digitalDelivery) {
      case null return #ok(false);
      case (?delivery) {
        let now = Types.now();
        let deadline = DigitalDeliveryLib.ensureInspectionDeadline(delivery);
        if (now <= deadline) return #ok(false);
      };
    };

    // ICRC-1 trades: queue release then execute before marking complete (E9.S3)
    switch (EscrowLib.tryAutoCompleteDigitalInspection(trades, listings, tradeId)) {
      case (#err(e)) return #err(e);
      case (#ok(false)) return #ok(false);
      case (#ok(true)) {
        switch (await afterTradeTransitionWithSettlement(tradeId, true)) {
          case (#err(e)) #err(e);
          case (#ok(_)) #ok(true);
        };
      };
    }
  };

  // ─── Fee quote (E3.S8 / FR-12) ───────────────────────────────────────────

  /// Effective platform fee in basis points (100 bps = 1%). Unset config → 300 (3%).
  public query func platformFeeBps() : async Nat {
    Admin.effectivePlatformFeeBps(systemSettings.platformFeeBps)
  };

  /// Buyer-facing fee breakdown for a listing before trade commit.
  public query func getTradeFeeQuote(listingId : Types.ListingId) : async ?Types.TradeFeeQuote {
    switch (listings.get(listingId)) {
      case null null;
      case (?listing) {
        ?EscrowLib.buildTradeFeeQuote(
          listing.priceAmount,
          listing.priceToken,
          systemSettings.platformFeeBps,
        )
      };
    };
  };
}
