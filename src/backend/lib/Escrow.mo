import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types";
import WalletLink "../lib/WalletLink";
import ShippingLib "../lib/Shipping";
import DigitalDeliveryLib "../lib/DigitalDelivery";
import Disputes "../lib/Disputes";

/// Escrow — domain logic for the P2P trade state machine.
/// Covers both manual off-chain confirmation and ICRC-1 on-chain escrow flows.
/// All ICRC-1 ledger calls are done in the mixin (async boundary); this module
/// handles only synchronous state transitions and pure helpers.
module {

  // ─── Constants ────────────────────────────────────────────────────────────

  /// 72 hours in nanoseconds — default refund deadline for manual trades.
  let REFUND_DEADLINE_NS : Nat = 259_200_000_000_000;

  /// 72 hours in nanoseconds — PaymentIntent expiry (E3.S10).
  let PAYMENT_INTENT_EXPIRY_NS : Nat = 259_200_000_000_000;

  /// Elevated-tier stake: 10% of listing price (E3.S11 / D-043).
  let ELEVATED_STAKE_BPS : Nat = 1_000;

  /// Standard beta tier ceiling: 500 USDT (D-043).
  let STANDARD_BETA_MAX_USD_CENTS : Nat = 50_000;

  /// High-value ck-only threshold: >1000 USDT (D-022, D-043).
  let HIGH_VALUE_CK_ONLY_USD_CENTS : Nat = 100_000;

  /// Hard beta reject above 5000 USDT (D-043).
  let MAX_BETA_TRADE_USD_CENTS : Nat = 500_000;

  /// Elevated stake floor: 50 USDT (E3.S11).
  let ELEVATED_STAKE_MIN_USD_CENTS : Nat = 5_000;

  func tokenDecimals(token : Types.TradeToken) : Nat {
    switch (token) {
      case (#USDT_BEP20) 18;
      case (_) 6;
    }
  };

  func pow10(exp : Nat) : Nat {
    var result : Nat = 1;
    var i = 0;
    while (i < exp) {
      result := result * 10;
      i += 1;
    };
    result
  };

  /// Rough USD cents for beta tier gates (token-native decimals).
  func priceAmountToUsdCents(amount : Nat, token : Types.TradeToken) : Nat {
    let divisor = pow10(tokenDecimals(token));
    (amount * 100) / divisor
  };

  func elevatedStakeMinAmount(token : Types.TradeToken) : Nat {
    (ELEVATED_STAKE_MIN_USD_CENTS * pow10(tokenDecimals(token))) / 100
  };

  public type TradeCapTier = {
    #standard;
    #elevated;
    #high_value_ck;
    #rejected;
  };

  public type TradeCapTierCheck = {
    tier : TradeCapTier;
    allowed : Bool;
    usdCents : Nat;
    ckOnlyRequired : Bool;
    gateCRequired : Bool;
    sellerVerifiedTierOk : Bool;
    elevatedStakeRequired : Nat;
    sellerStakeOk : Bool;
    blockReason : ?Text;
  };

  public func tradeCapTier(usdCents : Nat) : TradeCapTier {
    if (usdCents > MAX_BETA_TRADE_USD_CENTS) {
      #rejected
    } else if (usdCents > HIGH_VALUE_CK_ONLY_USD_CENTS) {
      #high_value_ck
    } else if (usdCents > STANDARD_BETA_MAX_USD_CENTS) {
      #elevated
    } else {
      #standard
    }
  };

  /// High-value ck trades use beta ceiling up to 5000 USDT; standard ck cap stays 500 USDT (E9.S6 + E3.S11).
  public func effectiveCkBetaCapUsdCents(
    usdCents : Nat,
    configuredCap : Nat,
  ) : Nat {
    if (usdCents > HIGH_VALUE_CK_ONLY_USD_CENTS) {
      MAX_BETA_TRADE_USD_CENTS
    } else {
      configuredCap
    }
  };

  /// Elevated stake for 500–1000 USDT band: max(10% × P, 50 USDT) in listing token units.
  public func elevatedStakeRequiredAmount(
    priceAmount : Nat,
    token : Types.TradeToken,
  ) : Nat {
    let pctStake = priceAmount * ELEVATED_STAKE_BPS / 10_000;
    let minStake = elevatedStakeMinAmount(token);
    if (pctStake > minStake) pctStake else minStake
  };

  public func buildTradeCapTierCheck(
    priceAmount : Nat,
    priceToken : Types.TradeToken,
    tradeToken : Types.TradeToken,
    sellerKycTier : Types.KycTier,
    listingStakeAmount : Nat,
    trustlessEnabled : Bool,
  ) : TradeCapTierCheck {
    let usdCents = priceAmountToUsdCents(priceAmount, priceToken);
    let tier = tradeCapTier(usdCents);
    let verifiedOk = switch (sellerKycTier) {
      case (#verified) true;
      case (#none) false;
    };
    let elevatedRequired = elevatedStakeRequiredAmount(priceAmount, priceToken);
    let stakeOk = listingStakeAmount >= elevatedRequired;
    let ckOnly = tier == #high_value_ck;
    let gateCRequired = ckOnly;

    var allowed = true;
    var blockReason : ?Text = null;

    switch (tier) {
      case (#rejected) {
        allowed := false;
        blockReason := ?"Trade exceeds beta limit (5000 USDT max)";
      };
      case (#high_value_ck) {
        if (not isOnChainToken(tradeToken)) {
          allowed := false;
          blockReason := ?"High-value trades above 1000 USDT require ckUSDC or ckUSDT — manual settlement not available";
        } else if (not trustlessEnabled) {
          allowed := false;
          blockReason := ?"High-value ck trades require Gate C (trustless escrow) to be enabled";
        };
      };
      case (#elevated) {
        if (not verifiedOk and not stakeOk) {
          allowed := false;
          blockReason := ?"Seller verified tier or elevated listing stake (10% min 50 USDT) required for trades above 500 USDT";
        };
      };
      case (#standard) {};
    };

    {
      tier;
      allowed;
      usdCents;
      ckOnlyRequired = ckOnly;
      gateCRequired;
      sellerVerifiedTierOk = verifiedOk;
      elevatedStakeRequired = elevatedRequired;
      sellerStakeOk = stakeOk;
      blockReason;
    }
  };

  public func assertTradeCapAllowed(
    priceAmount : Nat,
    priceToken : Types.TradeToken,
    tradeToken : Types.TradeToken,
    sellerKycTier : Types.KycTier,
    listingStakeAmount : Nat,
    trustlessEnabled : Bool,
  ) : Types.Result<TradeCapTierCheck> {
    let check = buildTradeCapTierCheck(
      priceAmount, priceToken, tradeToken, sellerKycTier,
      listingStakeAmount, trustlessEnabled,
    );
    if (not check.allowed) {
      return #err(#escrow_error(
        switch (check.blockReason) {
          case (?msg) msg;
          case null "Trade cap gate blocked";
        }
      ));
    };
    #ok(check)
  };

  func tokenNetworkLabel(token : Types.TradeToken) : Text {
    switch (token) {
      case (#USDT_TRC20) "TRC20";
      case (#USDT_BEP20) "BEP20";
      case (#USDC_SPL) "SPL";
      case (#USDT_ERC20) "ERC20";
      case (#USDC_ERC20) "ERC20";
      case (#USDT_POLYGON) "Polygon";
      case (#USDC_POLYGON) "Polygon";
      case (#USDT_AVAX) "Avalanche";
      case (#USDC_AVAX) "Avalanche";
      case (#ckUSDC) "Internet Computer";
      case (#ckUSDT) "Internet Computer";
    }
  };

  /// Manual coordinated settlement tokens (Wave 1 TRC20/BEP20 + Wave 3 ERC20 — E4.S8/D-044).
  public func isWave1ManualToken(token : Types.TradeToken) : Bool {
    switch (token) {
      case (#USDT_TRC20 or #USDT_BEP20 or #USDT_ERC20 or #USDC_ERC20) true;
      case (_) false;
    }
  };

  public func isErc20ManualToken(token : Types.TradeToken) : Bool {
    switch (token) {
      case (#USDT_ERC20 or #USDC_ERC20) true;
      case (_) false;
    }
  };

  /// Returns true when seller may ship / create TTN (E3.S10 AC 6 / E7.S3).
  public func isFulfillmentAllowed(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#payment_verified or #funded or #fulfillment_pending) true;
      case (_) false;
    }
  };

  /// Physical listing (non-digital goods).
  public func isPhysicalListing(listing : Types.Listing) : Bool {
    not listing.isDigital
  };

  func enterPhysicalFulfillmentPending(trade : Types.Trade, now : Types.Timestamp) : () {
    trade.status := #fulfillment_pending;
    trade.shipByDeadline := ?(now + SHIP_BY_DEADLINE_NS);
  };

  func isShippedOrLater(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#shipped or #awaiting_receipt or #complete) true;
      case (_) false;
    }
  };

  func isPayoutBlockedByDispute(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#disputed or #dispute_l1 or #dispute_l2) true;
      case (_) false;
    }
  };

  /// True when an existing trade still blocks another buyer on the same listing (LG-05 / E13.S1).
  public func isListingExclusiveTradeStatus(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#complete or #refunded or #cancelled
            or #cancelled_no_seller_response or #cancelled_buyer_pre_ship
            or #payment_intent_expired) false;
      case (_) true;
    }
  };

  /// Count non-terminal trades for a listing — used by initiateTrade guard and P0 tests.
  public func countExclusiveTradesForListing(
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : Nat {
    var count = 0;
    trades.forEach(func(_id, trade) {
      if (trade.listing == listingId and isListingExclusiveTradeStatus(trade.status)) {
        count += 1;
      };
    });
    count
  };

  /// Blocks stake release while listing is active or an exclusive trade is open (E6.S8 / LG-06).
  public func assertListingStakeReleasable(
    listings  : Map.Map<Types.ListingId, Types.Listing>,
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : Types.Result<()> {
    switch (listings.get(listingId)) {
      case null return #err(#not_found);
      case (?listing) {
        if (listing.status == #active) {
          return #err(#invalid_input(
            "Cannot release listing stake while listing is active"
          ));
        };
        if (countExclusiveTradesForListing(trades, listingId) > 0) {
          return #err(#invalid_input(
            "Cannot release listing stake while an exclusive trade is in progress"
          ));
        };
        #ok(())
      };
    }
  };

  /// Post-upgrade resume — counts handshake trades with persisted deadlines (LG-16).
  /// Does not mutate deadlines; timeout scan uses stored sellerResponseDeadline as-is.
  public func resumeHandshakeTimersAfterUpgrade(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : Nat {
    var count = 0;
    trades.forEach(func(_id, trade) {
      switch (trade.status) {
        case (#awaiting_seller_handshake) {
          switch (trade.sellerResponseDeadline) {
            case (?_) { count += 1 };
            case null {};
          };
        };
        case (_) {};
      };
    });
    count
  };

  func paymentIntentExpired(intent : Types.PaymentIntent, now : Types.Timestamp) : Bool {
    now >= intent.expiry
  };

  /// Rejects verify/lock when handshake incomplete or intent expired (E3.S10).
  public func assertPaymentIntentActive(
    trade : Types.Trade,
    now : Types.Timestamp,
  ) : Types.Result<Types.PaymentIntent> {
    switch (trade.paymentIntent) {
      case null return #err(#escrow_error("PaymentIntent not created — complete seller handshake first"));
      case (?intent) {
        if (paymentIntentExpired(intent, now)) {
          return #err(#escrow_error("PaymentIntent expired — verification not accepted"));
        };
        if (trade.status == #payment_intent_expired) {
          return #err(#escrow_error("PaymentIntent expired — verification not accepted"));
        };
        #ok(intent)
      };
    }
  };

  /// Creates PaymentIntent after seller handshake; snapshots payout wallet (E3.S10 / E4.S7).
  /// Seller must pass walletLinkId to snapshot; buyer may call when snapshot already exists.
  public func createPaymentIntent(
    trades              : Map.Map<Types.TradeId, Types.Trade>,
    users               : Map.Map<Types.UserId, Types.User>,
    caller              : Principal,
    tradeId             : Types.TradeId,
    walletLinkId        : ?Nat,
    path                : Types.PaymentSettlementPath,
    platformFeeBps      : Nat,
    trustlessEnabled    : Bool,
    ckBetaCapUsdCents   : Nat,
  ) : Types.Result<Types.PaymentIntent> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);
    let isBuyer = Principal.equal(caller, trade.buyer);
    let isSeller = Principal.equal(caller, trade.seller);
    if (not isBuyer and not isSeller) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#payment_intent) {};
      case (#manual_payment_pending) {
        switch (trade.paymentIntent) {
          case (?intent) return #ok(intent);
          case null {};
        };
      };
      case (_) return #err(#escrow_error(
        "createPaymentIntent requires #payment_intent, got " # debug_show(trade.status)
      ));
    };

    if (trade.paymentIntent != null) {
      switch (trade.paymentIntent) {
        case (?existing) return #ok(existing);
        case null {};
      };
    };

    switch (path) {
      case (#manual) {
        if (not isWave1ManualToken(trade.token)) {
          return #err(#escrow_error(
            "Manual PaymentIntent supports TRC20, BEP20, and ERC20 stablecoins only"
          ));
        };
        let tradeUsdCents = priceAmountToUsdCents(trade.amount, trade.token);
        if (tradeUsdCents > HIGH_VALUE_CK_ONLY_USD_CENTS) {
          return #err(#escrow_error(
            "Manual settlement not available above 1000 USDT — use ckUSDC/ckUSDT with Gate C"
          ));
        };
      };
      case (#ck) {
        if (not trustlessEnabled) {
          return #err(#escrow_error("On-chain ck path disabled — Gate C not enabled"));
        };
        if (not isOnChainToken(trade.token)) {
          return #err(#escrow_error("ck path requires ckUSDC or ckUSDT token"));
        };
        let tradeUsdCents = priceAmountToUsdCents(trade.amount, trade.token);
        let ckCap = effectiveCkBetaCapUsdCents(tradeUsdCents, ckBetaCapUsdCents);
        if (exceedsCkBetaCap(trade.amount, trade.token, ckCap)) {
          return #err(#escrow_error(
            "Trade exceeds ck on-chain beta cap — reduce amount or use manual settlement"
          ));
        };
      };
    };

    let seller = switch (users.get(trade.seller)) {
      case null return #err(#not_found);
      case (?u) u;
    };

    if (isSeller) {
      switch (walletLinkId) {
        case null return #err(#invalid_input("Seller must provide walletLinkId to snapshot payout wallet"));
        case (?id) {
          switch (WalletLink.snapshotPayoutWallet(trade, seller, id, Types.now())) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
      };
    } else if (trade.payoutWalletSnapshot == null) {
      return #err(#escrow_error("Seller payout wallet not snapshotted — seller must link wallet first"));
    };

    let snap = switch (trade.payoutWalletSnapshot) {
      case null return #err(#escrow_error("Payout wallet snapshot missing"));
      case (?s) s;
    };

    let quote = buildTradeFeeQuote(trade.amount, trade.token, platformFeeBps);
    let now = Types.now();
    let intent : Types.PaymentIntent = {
      token = trade.token;
      network = tokenNetworkLabel(trade.token);
      exactAmount = quote.totalBuyerAmount;
      recipient = snap.address;
      expiry = now + PAYMENT_INTENT_EXPIRY_NS;
      path;
      createdAt = now;
    };

    trade.paymentIntent := ?intent;
    trade.refundDeadline := ?intent.expiry;

    switch (path) {
      case (#manual) { trade.status := #manual_payment_pending };
      case (#ck) { trade.status := #payment_intent };
    };

    #ok(intent)
  };

  /// Expires PaymentIntents past deadline — fail-closed for late explorer verify (E3.S10 AC 5).
  public func checkPaymentIntentExpiry(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : Nat {
    let now = Types.now();
    var count = 0;
    trades.forEach(func(_id, trade) {
      switch (trade.paymentIntent) {
        case (?intent) {
          if (paymentIntentExpired(intent, now)) {
            switch (trade.status) {
              case (#manual_payment_pending or #payment_intent or #buyer_confirmed) {
                trade.status := #payment_intent_expired;
                count += 1;
              };
              case (_) {};
            };
          };
        };
        case null {};
      };
    });
    count
  };


  /// 24 hours in nanoseconds — seller handshake window (E3.S7 / FR-21a).
  let HANDSHAKE_DEADLINE_NS : Nat = 86_400_000_000_000;

  /// 7 days in nanoseconds — ship-by SLA after payment verified (D-019 / E7.S3).
  let SHIP_BY_DEADLINE_NS : Nat = 604_800_000_000_000;

  /// 48 hours in nanoseconds — NP delivered grace before auto-complete (D-003 / E7.S3).
  let NP_DELIVERED_GRACE_NS : Nat = 172_800_000_000_000;

  /// Total fee: 3% (300 bps)
  /// Split: 2% platform profit, 0.5% cycles fund, 0.5% security reserve
  let PLATFORM_FEE_BPS : Nat = 200;
  let CYCLES_FEE_BPS   : Nat = 50;
  let RESERVE_FEE_BPS  : Nat = 50;
  let BPS_DENOM        : Nat = 10_000;

  /// Buyer cancel pre-shipment penalty split (E3.S9 / D-009): 85% / 10% / 5%.
  let BUYER_CANCEL_BUYER_BPS    : Nat = 8_500;
  let BUYER_CANCEL_SELLER_BPS   : Nat = 1_000;
  let BUYER_CANCEL_PLATFORM_BPS : Nat = 500;

  /// Computes 85/10/5 split; rounding dust → platform (D-025).
  public func computeBuyerCancelPenaltySplit(lockedAmount : Nat) : Types.BuyerCancelPenaltySplit {
    if (lockedAmount == 0) {
      return {
        lockedAmount = 0;
        buyerRefund = 0;
        sellerCompensation = 0;
        platformFee = 0;
      };
    };
    let buyer = (lockedAmount * BUYER_CANCEL_BUYER_BPS) / BPS_DENOM;
    let seller = (lockedAmount * BUYER_CANCEL_SELLER_BPS) / BPS_DENOM;
    let platform = lockedAmount - buyer - seller;
    {
      lockedAmount = lockedAmount;
      buyerRefund = buyer;
      sellerCompensation = seller;
      platformFee = platform;
    }
  };

  /// Locked/coordinated amount for cancel split — PaymentIntent total or on-chain escrow.
  public func lockedAmountForBuyerCancel(trade : Types.Trade) : ?Nat {
    switch (trade.paymentIntent) {
      case (?intent) ?intent.exactAmount;
      case null {
        switch (trade.escrowAccount) {
          case (?escrow) ?escrow.amount;
          case null null;
        };
      };
    }
  };

  func isBuyerCancelAllowedStatus(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#payment_verified or #fulfillment_pending or #funded) true;
      case (_) false;
    };
  };

  func hasPendingOnChainSettlement(trade : Types.Trade) : Bool {
    switch (trade.pendingOnChainSettlement) {
      case null false;
      case (?_) true;
    }
  };

  func queueOnChainSettlement(
    trade : Types.Trade,
    op : Types.OnChainSettlementOp,
    targetStatus : Types.TradeStatus,
  ) {
    trade.pendingOnChainSettlement := ?{
      op;
      targetStatus;
      queuedAt = Types.now();
      attempts = 0;
      lastError = null;
    };
  };

  /// Buyer unilateral cancel before seller ships — 85/10/5 penalty split (E3.S9 / FR-21c).
  public func buyerCancelBeforeShipment(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.BuyerCancelPenaltySplit> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    if (isShippedOrLater(trade.status)) {
      return #err(#escrow_error("Cannot cancel — shipment already recorded"));
    };

    if (trade.ttnNumber != null) {
      return #err(#escrow_error("Cannot cancel — Nova Poshta TTN already assigned"));
    };

    if (not isBuyerCancelAllowedStatus(trade.status)) {
      return #err(#escrow_error(
        "buyerCancelBeforeShipment requires payment_verified, fulfillment_pending, or funded, got "
          # debug_show(trade.status)
      ));
    };

    let locked = switch (lockedAmountForBuyerCancel(trade)) {
      case null return #err(#escrow_error("No locked payment amount — verify payment first"));
      case (?a) a;
    };

    let split = computeBuyerCancelPenaltySplit(locked);
    switch (trade.escrowAccount) {
      case null {
        trade.status := #cancelled_buyer_pre_ship;
      };
      case (?_) {
        if (hasPendingOnChainSettlement(trade)) {
          return #err(#escrow_error("On-chain settlement already pending — retry or wait"));
        };
        queueOnChainSettlement(trade, #buyerCancelSplit split, #cancelled_buyer_pre_ship);
      };
    };
    #ok(split)
  };

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

  /// ckUSDC/ckUSDT use 6 decimal places — USD cents for beta cap (E9.S6 / D-034).
  func ckAmountToUsdCents(amount : Nat) : Nat {
    (amount * 100) / 1_000_000
  };

  /// ck beta cap enforcement (E9.S6 / D-034).
  public func exceedsCkBetaCap(
    amount : Nat,
    token : Types.TradeToken,
    capUsdCents : Nat,
  ) : Bool {
    if (not isOnChainToken(token)) return false;
    if (capUsdCents == 0) return true;
    ckAmountToUsdCents(amount) > capUsdCents
  };

  /// In-flight ck lock allowed after Gate C disable (E9.S6 AC 8).
  public func isInFlightCkLockEligible(
    trade : Types.Trade,
    gateEnabled : Bool,
  ) : Bool {
    if (gateEnabled) return true;
    switch (trade.paymentIntent) {
      case (?intent) {
        switch (intent.path) {
          case (#ck) {
            trade.status == #payment_intent or trade.status == #awaiting_approval
          };
          case (#manual) false;
        }
      };
      case null false;
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

  /// Buyer-facing platform fee with ceiling rounding (E3.S8 / D-018).
  public func buyerPlatformFeeCeil(itemPrice : Nat, platformFeeBps : Nat) : Nat {
    if (itemPrice == 0 or platformFeeBps == 0) { 0 }
    else {
      let numerator = itemPrice * platformFeeBps + (BPS_DENOM - 1);
      numerator / BPS_DENOM
    }
  };

  /// Builds upfront fee quote for buy/checkout UI.
  public func buildTradeFeeQuote(
    itemPrice : Nat,
    token : Types.TradeToken,
    configuredPlatformFeeBps : Nat,
  ) : Types.TradeFeeQuote {
    let usesDefault = configuredPlatformFeeBps == 0;
    let bps = if (usesDefault) {
      PLATFORM_FEE_BPS + CYCLES_FEE_BPS + RESERVE_FEE_BPS
    } else {
      configuredPlatformFeeBps
    };
    let feeAmount = buyerPlatformFeeCeil(itemPrice, bps);
    {
      itemPrice = itemPrice;
      platformFeeAmount = feeAmount;
      platformFeeBps = bps;
      totalBuyerAmount = itemPrice + feeAmount;
      token = token;
      usesDefaultFeeBps = usesDefault;
    }
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
  /// ckUSDC/ckUSDT: handshake here, then PaymentIntent (#ck), then initiateOnChainTrade (Gate C).
  /// Sets status=#awaiting_seller_handshake, sellerResponseDeadline = now + 24h.
  public func initiateTrade(
    trades      : Map.Map<Types.TradeId, Types.Trade>,
    listings    : Map.Map<Types.ListingId, Types.Listing>,
    nextTradeId : Nat,
    caller      : Principal,
    listingId   : Types.ListingId,
    token       : Types.TradeToken,
    shippingSelection : ?Types.ShippingSelection,
    sellerKycTier : Types.KycTier,
    listingStakeAmount : Nat,
    trustlessEnabled : Bool,
    ckBetaCapUsdCents : Nat,
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

    if (countExclusiveTradesForListing(trades, listingId) > 0) {
      return #err(#escrow_error(
        "Listing already has an active trade — wait for completion or cancellation"
      ));
    };

    switch (assertTradeCapAllowed(
      listing.priceAmount,
      listing.priceToken,
      token,
      sellerKycTier,
      listingStakeAmount,
      trustlessEnabled,
    )) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };

    let listingUsdCents = priceAmountToUsdCents(listing.priceAmount, listing.priceToken);
    let effectiveCkCap = effectiveCkBetaCapUsdCents(listingUsdCents, ckBetaCapUsdCents);
    if (isOnChainToken(token) and exceedsCkBetaCap(listing.priceAmount, token, effectiveCkCap)) {
      return #err(#escrow_error(
        "Trade exceeds ck on-chain beta cap — reduce listing price or use manual settlement"
      ));
    };

    let now = Types.now();
    let trade : Types.Trade = {
      id            = nextTradeId;
      listing       = listingId;
      buyer         = caller;
      seller        = listing.seller;
      amount        = listing.priceAmount;
      token         = token;
      var status    = #awaiting_seller_handshake;
      createdAt     = now;
      var fundedAt       = null;
      var confirmedAt    = null;
      var completedAt    = null;
      var refundDeadline = null;
      var sellerResponseDeadline = ?(now + HANDSHAKE_DEADLINE_NS);
      var escrowAccount  = null;
      var shippingSelection   = shippingSelection;
      var ttnNumber           = null;
      var ttnCreationStatus   = #Pending;
      var digitalDelivery     = null;
      var deliveryRecordAt    = null;
      var payoutWalletSnapshot = null;
      var payoutWalletHeld     = false;
      var paymentIntent        = null;
      var shipByDeadline       = null;
      var shippedAt            = null;
      var npDeliveredAt        = null;
      var npDeliveredGraceEndsAt = null;
      var pendingOnChainSettlement = null;
    };

    trades.add(nextTradeId, trade);
    #ok(trade)
  };

  // ─── On-Chain Lock (ICRC-1 path, post-handshake — E9.S2) ─────────────────

  /// Prepares an existing seller-confirmed trade for ICRC-2 lock.
  /// Requires active ck PaymentIntent and #payment_intent — never creates a new trade.
  /// Transitions #payment_intent → #awaiting_approval before the mixin calls the ledger.
  public func prepareOnChainTradeLock(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    caller   : Principal,
    tradeId  : Types.TradeId,
    ledgerId : Principal,
    ckBetaCapUsdCents : Nat,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#funded) return #ok(trade);
      case (#awaiting_approval) {
        return #err(#escrow_error("On-chain lock already in progress"));
      };
      case (#payment_intent) {};
      case (_) return #err(#escrow_error(
        "On-chain lock requires seller-confirmed #payment_intent, got "
          # debug_show(trade.status)
      ));
    };

    switch (assertPaymentIntentActive(trade, Types.now())) {
      case (#err(e)) return #err(e);
      case (#ok(intent)) {
        switch (intent.path) {
          case (#ck) {};
          case (#manual) return #err(#escrow_error(
            "On-chain lock requires ck PaymentIntent — manual path is mutually exclusive"
          ));
        };
        if (not isOnChainToken(trade.token)) {
          return #err(#escrow_error("Trade token does not support on-chain escrow"));
        };
        let tradeUsdCents = priceAmountToUsdCents(trade.amount, trade.token);
        let effectiveCkCap = effectiveCkBetaCapUsdCents(tradeUsdCents, ckBetaCapUsdCents);
        if (exceedsCkBetaCap(trade.amount, trade.token, effectiveCkCap)) {
          return #err(#escrow_error(
            "Trade exceeds ck on-chain beta cap — on-chain lock rejected"
          ));
        };

        let fee = totalFee(trade.amount);
        let now = Types.now();
        let escrow : Types.EscrowAccount = {
          tradeId = tradeId;
          buyerPrincipal = trade.buyer;
          sellerPrincipal = trade.seller;
          token = trade.token;
          amount = intent.exactAmount;
          fee;
          ledgerCanisterId = ledgerId;
          lockedAt = now;
          deadline = intent.expiry;
        };

        trade.escrowAccount := ?escrow;
        trade.status := #awaiting_approval;
        trade.refundDeadline := ?intent.expiry;
        #ok(trade)
      };
    }
  };

  /// Rolls back a failed ICRC lock to #payment_intent — never ghost-funds (E9.S2 AC 4).
  public func rollbackOnChainLockFailure(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : Types.Result<()> {
    let trade = requireTrade(trades, tradeId);
    switch (trade.status) {
      case (#awaiting_approval) {};
      case (#payment_intent) return #ok(());
      case (#funded) return #err(#escrow_error("Cannot rollback — trade already funded"));
      case (_) return #err(#escrow_error(
        "rollbackOnChainLockFailure requires #awaiting_approval, got "
          # debug_show(trade.status)
      ));
    };
    trade.status := #payment_intent;
    trade.escrowAccount := null;
    trade.fundedAt := null;
    #ok(())
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
    trade.fundedAt := ?Types.now();
    #ok(trade)
  };

  /// After on-chain lock for physical goods, enter fulfillment_pending with ship-by SLA.
  public func enterPhysicalFulfillmentAfterFunded(
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listings  : Map.Map<Types.ListingId, Types.Listing>,
    tradeId   : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    let trade = requireTrade(trades, tradeId);
    switch (listings.get(trade.listing)) {
      case null return #err(#not_found);
      case (?listing) {
        if (isPhysicalListing(listing)) {
          enterPhysicalFulfillmentPending(trade, Types.now());
        };
        #ok(trade)
      };
    }
  };

  // ─── Seller handshake (E3.S7 / FR-21a) ───────────────────────────────────

  func isHandshakeTerminal(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#payment_intent or #cancelled_no_seller_response) true;
      case (_) false;
    };
  };

  func handshakeDeadlinePassed(trade : Types.Trade, now : Types.Timestamp) : Bool {
    switch (trade.sellerResponseDeadline) {
      case (?d) now >= d;
      case null false;
    };
  };

  /// Seller confirms incoming buy request within 24h → #payment_intent.
  /// Idempotent when already confirmed or terminal (race-safe with timeout).
  public func confirmSellerHandshake(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.seller)) {
      return #err(#unauthorized);
    };

    if (isHandshakeTerminal(trade.status)) {
      return #ok(trade);
    };

    switch (trade.status) {
      case (#awaiting_seller_handshake) {};
      case (_) return #err(#escrow_error(
        "confirmSellerHandshake requires #awaiting_seller_handshake, got "
          # debug_show(trade.status)
      ));
    };

    let now = Types.now();
    if (handshakeDeadlinePassed(trade, now)) {
      trade.status := #cancelled_no_seller_response;
      return #ok(trade);
    };

    trade.status := #payment_intent;
    trade.refundDeadline := ?(now + REFUND_DEADLINE_NS);
    #ok(trade)
  };

  /// Seller declines buy request → terminal #cancelled_no_seller_response (buyer 100%, no lock).
  public func declineSellerHandshake(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);

    if (not Principal.equal(caller, trade.seller)) {
      return #err(#unauthorized);
    };

    if (isHandshakeTerminal(trade.status)) {
      return #ok(trade);
    };

    switch (trade.status) {
      case (#awaiting_seller_handshake) {};
      case (_) return #err(#escrow_error(
        "declineSellerHandshake requires #awaiting_seller_handshake, got "
          # debug_show(trade.status)
      ));
    };

    trade.status := #cancelled_no_seller_response;
    #ok(trade)
  };

  /// Auto-cancels trades whose sellerResponseDeadline has passed.
  /// Returns count of trades transitioned to #cancelled_no_seller_response.
  public func checkHandshakeTimeouts(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : Nat {
    let now = Types.now();
    var count = 0;
    trades.forEach(func(_id, trade) {
      switch (trade.status) {
        case (#awaiting_seller_handshake) {
          if (handshakeDeadlinePassed(trade, now)) {
            trade.status := #cancelled_no_seller_response;
            count += 1;
          };
        };
        case (_) {};
      };
    });
    count
  };

  // ─── Confirm Payment Sent (buyer → buyer_confirmed) ──────────────────────

  /// Buyer confirms they have sent payment (manual or on-chain path).
  /// Valid source states: #payment_intent, #pending (legacy), #funded → #buyer_confirmed.
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
      case (#manual_payment_pending) {
        switch (assertPaymentIntentActive(trade, Types.now())) {
          case (#err(e)) return #err(e);
          case (#ok(_)) {};
        };
      };
      case (#payment_intent or #pending or #funded) {};
      case (_) return #err(#escrow_error("invalid transition: confirmPaymentSent requires status #manual_payment_pending, #payment_intent, #pending or #funded, got " # debug_show(trade.status)));
    };

    trade.status      := #buyer_confirmed;
    trade.confirmedAt := ?Types.now();
    #ok(trade)
  };

  // ─── Confirm Payment Received (seller → complete) ─────────────────────────

  /// Seller confirms they received payment. Transitions to #complete.
  /// For ICRC-1 trades the mixin also calls releaseToSeller after this.
  /// Physical NP trades must complete via buyer receipt or delivered+48h (E7.S3).
  public func confirmPaymentReceived(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    users    : Map.Map<Types.UserId, Types.User>,
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

    let listing = switch (listings.get(trade.listing)) {
      case null return #err(#not_found);
      case (?l) l;
    };

    if (isPhysicalListing(listing)) {
      return #err(#escrow_error(
        "Physical trades complete via buyer receipt or Nova Poshta delivered+48h — not seller payment confirm"
      ));
    };

    switch (trade.status) {
      case (#digital_delivered) {};
      case (#payment_verified) {
        return #err(#escrow_error(
          "Payment verified is not terminal for digital — wait for auto-delivery and inspection window"
        ));
      };
      case (#funded) {
        if (trade.escrowAccount == null) {
          return #err(#escrow_error(
            "invalid transition: confirmPaymentReceived from #funded requires on-chain escrow, got manual trade"
          ));
        };
      };
      case (_) return #err(#escrow_error(
        "invalid transition: confirmPaymentReceived requires #digital_delivered, #payment_verified or #funded (on-chain), got "
          # debug_show(trade.status)
      ));
    };

    // Manual path: payout wallet must match snapshot (E3.S10 AC 7 / D-015).
    if (trade.escrowAccount == null) {
      let seller = switch (users.get(trade.seller)) {
        case null return #err(#not_found);
        case (?u) u;
      };
      switch (WalletLink.assertPayoutAllowed(trade, seller)) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
      trade.status := #complete;
      trade.completedAt := ?Types.now();
      switch (listings.get(trade.listing)) {
        case (?l) {
          l.status := #sold;
          l.resolvedAt := ?Types.now();
        };
        case null {};
      };
    } else {
      if (hasPendingOnChainSettlement(trade)) {
        return #err(#escrow_error("On-chain settlement already pending — retry or wait"));
      };
      queueOnChainSettlement(trade, #releaseToSeller, #complete);
    };

    #ok(trade)
  };

  // ─── Mark Shipped (E7.S3) ─────────────────────────────────────────────────

  /// Seller marks shipped with a validated Nova Poshta TTN.
  /// Stays in #fulfillment_pending when TTN invalid or carrier rejects.
  public func markShipped(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    caller  : Principal,
    tradeId : Types.TradeId,
    ttn     : Text,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);
    if (not Principal.equal(caller, trade.seller)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#fulfillment_pending or #payment_verified or #funded) {};
      case (_) return #err(#escrow_error(
        "markShipped requires fulfillment_pending, payment_verified, or funded, got "
          # debug_show(trade.status)
      ));
    };

    if (not ShippingLib.isValidNpTtnFormat(ttn)) {
      return #err(#invalid_input("Invalid Nova Poshta TTN format"));
    };

    let now = Types.now();
    trade.ttnNumber := ?ttn;
    trade.ttnCreationStatus := #Success;
    trade.shippedAt := ?now;
    trade.status := #shipped;
    #ok(trade)
  };

  // ─── Buyer confirms receipt (E7.S3 AC 7) ───────────────────────────────────

  public func confirmBuyerReceipt(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    users    : Map.Map<Types.UserId, Types.User>,
    caller   : Principal,
    tradeId  : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    if (caller.isAnonymous()) {
      return #err(#unauthorized);
    };

    let trade = requireTrade(trades, tradeId);
    if (not Principal.equal(caller, trade.buyer)) {
      return #err(#unauthorized);
    };

    switch (trade.status) {
      case (#awaiting_receipt or #shipped) {};
      case (_) return #err(#escrow_error(
        "confirmBuyerReceipt requires awaiting_receipt or shipped, got "
          # debug_show(trade.status)
      ));
    };

    if (isPayoutBlockedByDispute(trade.status)) {
      return #err(#escrow_error("Payout frozen — dispute is open"));
    };

    completePhysicalTrade(trades, listings, trade)
  };

  func completePhysicalTrade(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    trade    : Types.Trade,
  ) : Types.Result<Types.Trade> {
    if (isPayoutBlockedByDispute(trade.status)) {
      return #err(#escrow_error("Payout frozen — dispute is open"));
    };

    switch (trade.escrowAccount) {
      case null {
        trade.status := #complete;
        trade.completedAt := ?Types.now();
        switch (listings.get(trade.listing)) {
          case (?l) {
            l.status := #sold;
            l.resolvedAt := ?Types.now();
          };
          case null {};
        };
      };
      case (?_) {
        if (hasPendingOnChainSettlement(trade)) {
          return #err(#escrow_error("On-chain settlement already pending — retry or wait"));
        };
        queueOnChainSettlement(trade, #releaseToSeller, #complete);
      };
    };

    #ok(trade)
  };

  /// Record NP delivered timestamp and start 48h grace (D-003).
  public func recordNpDelivered(
    trade : Types.Trade,
    now   : Types.Timestamp,
  ) : () {
    if (trade.npDeliveredAt != null) return;
    trade.npDeliveredAt := ?now;
    trade.npDeliveredGraceEndsAt := ?(now + NP_DELIVERED_GRACE_NS);
  };

  /// Inspection deadline for a digital trade (T + 24h from deliveryRecordAt).
  public func digitalInspectionDeadline(trade : Types.Trade) : ?Types.Timestamp {
    switch (trade.digitalDelivery) {
      case null null;
      case (?dd) ?DigitalDeliveryLib.ensureInspectionDeadline(dd);
    }
  };

  /// True when digital inspection window has elapsed (fail-closed without deliveryRecordAt).
  public func isDigitalInspectionExpired(trade : Types.Trade, now : Types.Timestamp) : Bool {
    if (trade.status != #digital_delivered) return false;
    switch (trade.deliveryRecordAt) {
      case null return false;
      case (?_) {};
    };
    switch (trade.digitalDelivery) {
      case null false;
      case (?dd) now > DigitalDeliveryLib.ensureInspectionDeadline(dd);
    }
  };

  /// Auto-complete one digital trade after inspection window (E7.S2 / W2-5).
  public func tryAutoCompleteDigitalInspection(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    tradeId  : Types.TradeId,
  ) : Types.Result<Bool> {
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (trade.status != #digital_delivered) return #ok(false);
    if (isPayoutBlockedByDispute(trade.status)) return #ok(false);
    if (not isDigitalInspectionExpired(trade, Types.now())) return #ok(false);
    switch (completePhysicalTrade(trades, listings, trade)) {
      case (#ok(_)) #ok(true);
      case (#err(e)) #err(e);
    }
  };

  /// Batch auto-complete for digital inspection expiry (E7.S2).
  public func processDigitalInspectionAutoComplete(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
  ) : Nat {
    var count = 0;
    trades.forEach(func(id, _trade) {
      switch (tryAutoCompleteDigitalInspection(trades, listings, id)) {
        case (#ok(true)) count += 1;
        case (_) {};
      };
    });
    count
  };

  /// Auto-complete trades past delivered grace — fail-closed without deliveredAt (E7.S3 AC 8).
  public func processNpAutoComplete(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    listings : Map.Map<Types.ListingId, Types.Listing>,
  ) : Nat {
    let now = Types.now();
    var count = 0;
    trades.forEach(func(_id, trade) {
      if (trade.status != #awaiting_receipt) return;
      if (isPayoutBlockedByDispute(trade.status)) return;
      switch (trade.npDeliveredGraceEndsAt) {
        case null return;
        case (?graceEnd) {
          if (now < graceEnd) return;
          switch (trade.npDeliveredAt) {
            case null return;
            case (?_) {};
          };
          ignore completePhysicalTrade(trades, listings, trade);
          count += 1;
        };
      };
    });
    count
  };

  /// Escalate physical trades past ship-by SLA to dispute (D-019 / E7.S3 AC 4).
  /// Returns trade ids escalated this run — mixin opens Dispute records via DisputesLib.
  public func checkShipByDeadlines(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : [Types.TradeId] {
    let now = Types.now();
    let escalated = List.empty<Types.TradeId>();
    trades.forEach(func(tradeId, trade) {
      switch (trade.status) {
        case (#fulfillment_pending or #payment_verified or #funded) {};
        case (_) return;
      };
      if (isShippedOrLater(trade.status)) return;
      switch (trade.shipByDeadline) {
        case null return;
        case (?deadline) {
          if (now >= deadline and trade.ttnNumber == null) {
            trade.status := #dispute_l1;
            trade.payoutWalletHeld := true;
            escalated.add(tradeId);
          };
        };
      };
    });
    escalated.toArray()
  };

  // ─── Request Refund (buyer, after deadline) ───────────────────────────────

  /// Buyer requests refund after refundDeadline has passed.
  /// For ICRC-1 trades the mixin also calls refundBuyer after this.
  /// Valid source states: #payment_intent, #pending, #funded → #refunded.
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
      case (#payment_intent or #pending or #funded) {};
      case (_) return #err(#escrow_error("invalid transition: requestRefund requires status #payment_intent, #pending or #funded, got " # debug_show(trade.status)));
    };

    let now = Types.now();
    let deadline = switch (trade.refundDeadline) {
      case (?d) d;
      case null return #err(#escrow_error("no refund deadline set"));
    };

    if (now < deadline) {
      return #err(#escrow_error("refund deadline has not passed yet"));
    };

    switch (trade.escrowAccount) {
      case null {
        trade.status := #refunded;
      };
      case (?_) {
        if (hasPendingOnChainSettlement(trade)) {
          return #err(#escrow_error("On-chain settlement already pending — retry or wait"));
        };
        queueOnChainSettlement(
          trade,
          #refundBuyer { memo = "timeout-refund" },
          #refunded,
        );
      };
    };
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
      case (#complete or #refunded or #cancelled or #cancelled_no_seller_response or #cancelled_buyer_pre_ship or #payment_verified) {
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
      switch (trade.escrowAccount) {
        case null {
          trade.status := #cancelled;
        };
        case (?_) {
          // Replace any pending release op so stale #releaseToSeller cannot execute after cancel.
          // Do not set terminal status until on-chain refund succeeds (fail-closed).
          queueOnChainSettlement(
            trade,
            #refundBuyer { memo = "mutual-cancel" },
            #cancelled,
          );
        };
      };
      cancelProposals.remove(tradeId);
      return #ok(true);
    };

    #ok(false)
  };

  // ─── Check and Expire Timeouts ────────────────────────────────────────────

  /// Auto-refunds all trades whose refundDeadline has passed and are still in
  /// #payment_intent, #pending or #funded state. Designed to be called periodically.
  /// Returns the IDs of expired ICRC-1 trades that still need on-chain refund.
  public func checkAndExpireTimeouts(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : (Nat, [Types.TradeId]) {
    let now = Types.now();
    var count = 0;
    let onChainRefunds = List.empty<Types.TradeId>();

    trades.forEach(func(_id, trade) {
      switch (trade.status) {
        case (#payment_intent or #pending or #funded) {
          let expired = switch (trade.refundDeadline) {
            case (?d) now >= d;
            case null false;
          };
          if (expired) {
            switch (trade.escrowAccount) {
              case null {
                trade.status := #refunded;
              };
              case (?_) {
                if (not hasPendingOnChainSettlement(trade)) {
                  queueOnChainSettlement(
                    trade,
                    #refundBuyer { memo = "timeout-refund" },
                    #refunded,
                  );
                };
              };
            };
            count += 1;
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
      case (#buyer_confirmed or #payment_verified or #funded or #digital_delivered or #fulfillment_pending or #shipped or #awaiting_receipt) {};
      case (_) return #err(#escrow_error("can only dispute from active trade states, got " # debug_show(trade.status)));
    };

    trade.status := #dispute_l1;
    trade.payoutWalletHeld := true;
    #ok(trade)
  };

  // ─── View conversion ─────────────────────────────────────────────────────

  func toDigitalDeliveryView(dd : Types.DigitalDelivery, redactSecrets : Bool) : Types.DigitalDeliveryView {
    {
      fileUrl = if (redactSecrets) "" else dd.fileUrl;
      fileHash = dd.fileHash;
      password = if (redactSecrets) null else dd.password;
      fileVersionId = dd.fileVersionId;
      mimeType = dd.mimeType;
      dekHex = if (redactSecrets) null else dd.dekHex;
      deliveryRecordAt = dd.deliveryRecordAt;
      revealedAt = Types.optNat(dd.revealedAt);
      inspectionDeadline = Types.optNat(dd.inspectionDeadline);
    }
  };

  func toPendingSettlementView(p : Types.PendingOnChainSettlement) : Types.PendingOnChainSettlementView {
    p
  };

  /// Buyer-safe digital delivery view (no var fields for Candid).
  public func toDigitalDeliveryViewForBuyer(dd : Types.DigitalDelivery) : Types.DigitalDeliveryView {
    toDigitalDeliveryView(dd, false)
  };

  /// Converts mutable Trade to immutable TradeView for Candid serialization.
  public func toView(t : Types.Trade, redactDigital : Bool) : Types.TradeView {
    {
      id                  = t.id;
      listing             = t.listing;
      buyer               = t.buyer;
      seller              = t.seller;
      amount              = t.amount;
      token               = t.token;
      status              = t.status;
      createdAt           = t.createdAt;
      fundedAt            = Types.optNat(t.fundedAt);
      confirmedAt         = Types.optNat(t.confirmedAt);
      completedAt         = Types.optNat(t.completedAt);
      refundDeadline      = Types.optNat(t.refundDeadline);
      sellerResponseDeadline = Types.optNat(t.sellerResponseDeadline);
      escrowAccount       = t.escrowAccount;
      shippingSelection   = t.shippingSelection;
      ttnNumber           = t.ttnNumber;
      ttnCreationStatus   = t.ttnCreationStatus;
      digitalDelivery     = switch (t.digitalDelivery) {
        case null null;
        case (?dd) ?toDigitalDeliveryView(dd, redactDigital);
      };
      deliveryRecordAt    = Types.optNat(t.deliveryRecordAt);
      payoutWalletSnapshot = t.payoutWalletSnapshot;
      payoutWalletHeld     = t.payoutWalletHeld;
      paymentIntent        = t.paymentIntent;
      shipByDeadline       = Types.optNat(t.shipByDeadline);
      shippedAt            = Types.optNat(t.shippedAt);
      npDeliveredAt        = Types.optNat(t.npDeliveredAt);
      npDeliveredGraceEndsAt = Types.optNat(t.npDeliveredGraceEndsAt);
      pendingOnChainSettlement = switch (t.pendingOnChainSettlement) {
        case null null;
        case (?p) ?toPendingSettlementView(p);
      };
    }
  };

  // ─── Query helpers ────────────────────────────────────────────────────────

  /// Returns a single trade by ID, or null.
  public func getTrade(
    trades  : Map.Map<Types.TradeId, Types.Trade>,
    tradeId : Types.TradeId,
  ) : ?Types.TradeView {
    switch (trades.get(tradeId)) {
      case (?t) ?toView(t, false);
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
    }).map(func(t : Types.Trade) : Types.TradeView { toView(t, false) }).toArray()
  };

  /// Returns all trades for a specific listing — digital secrets redacted.
  public func getTradesByListing(
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listingId : Types.ListingId,
  ) : [Types.TradeView] {
    trades.values().filter(func(t : Types.Trade) : Bool {
      t.listing == listingId
    }).map(func(t : Types.Trade) : Types.TradeView { toView(t, true) }).toArray()
  };

  /// Returns all trades (admin only — caller check done in mixin).
  public func adminGetAllTrades(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : [Types.TradeView] {
    trades.values().map(func(t : Types.Trade) : Types.TradeView { toView(t, false) }).toArray()
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

  /// Advances a trade from #buyer_confirmed → #payment_verified (digital)
  /// or #fulfillment_pending (physical NP — E7.S3).
  /// Called by the payments mixin after successful blockchain verification.
  public func applyPaymentVerified(
    trades    : Map.Map<Types.TradeId, Types.Trade>,
    listings  : Map.Map<Types.ListingId, Types.Listing>,
    tradeId   : Types.TradeId,
  ) : Types.Result<Types.Trade> {
    let trade = requireTrade(trades, tradeId);
    switch (trade.status) {
      case (#manual_payment_pending or #buyer_confirmed) {};
      case (#payment_verified or #fulfillment_pending) return #ok(trade); // idempotent
      case (#payment_intent_expired) return #err(#escrow_error(
        "applyPaymentVerified rejected — PaymentIntent expired"
      ));
      case (_) return #err(#escrow_error(
        "applyPaymentVerified requires #manual_payment_pending or #buyer_confirmed, got "
          # debug_show(trade.status)
      ));
    };
    switch (assertPaymentIntentActive(trade, Types.now())) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };

    let listing = switch (listings.get(trade.listing)) {
      case null return #err(#not_found);
      case (?l) l;
    };

    let now = Types.now();
    if (isPhysicalListing(listing)) {
      enterPhysicalFulfillmentPending(trade, now);
    } else {
      trade.status := #payment_verified;
    };
    #ok(trade)
  };
}
