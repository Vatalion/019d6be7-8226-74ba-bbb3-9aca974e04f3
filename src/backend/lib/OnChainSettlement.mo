import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types";
import Escrow "../lib/Escrow";
import PaymentsLib "../lib/Payments";
import Reputation "../lib/Reputation";

/// Gate C on-chain release/refund orchestration (E9.S3 / D-037).
/// Terminal trade status is applied only after ICRC transfers succeed.
module {

  public func hasPending(trade : Types.Trade) : Bool {
    switch (trade.pendingOnChainSettlement) {
      case null false;
      case (?_) true;
    }
  };

  public func queue(
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

  public func recordFailure(trade : Types.Trade, error : Text) {
    switch (trade.pendingOnChainSettlement) {
      case null {};
      case (?pending) {
        trade.pendingOnChainSettlement := ?{
          op = pending.op;
          targetStatus = pending.targetStatus;
          queuedAt = pending.queuedAt;
          attempts = pending.attempts + 1;
          lastError = ?error;
        };
      };
    };
  };

  public func clearPending(trade : Types.Trade) {
    trade.pendingOnChainSettlement := null;
  };

  /// Applies terminal status after successful on-chain settlement.
  public func finalizeTerminal(
    trade : Types.Trade,
    listings : Map.Map<Types.ListingId, Types.Listing>,
    targetStatus : Types.TradeStatus,
  ) {
    trade.status := targetStatus;
    clearPending(trade);
    switch (targetStatus) {
      case (#complete) {
        trade.completedAt := ?Types.now();
        switch (listings.get(trade.listing)) {
          case (?l) {
            l.status := #sold;
            l.resolvedAt := ?Types.now();
          };
          case null {};
        };
      };
      case (_) {};
    };
  };

  func transferOrErr(
    result : { #Ok : Nat; #Err : Escrow.TransferError },
    context : Text,
  ) : Types.Result<()> {
    switch (result) {
      case (#Ok(_)) #ok(());
      case (#Err(#Duplicate(_))) #ok(());
      case (#Err(e)) #err(#escrow_error(context # ": " # debug_show(e)));
    }
  };

  func tokenDivisor(token : Types.TradeToken) : Nat {
    let tokenInfo = PaymentsLib.getTokenDisplayInfo(token);
    switch (tokenInfo) {
      case null 1_000_000;
      case (?info) {
        var d : Nat = 1;
        var i = 0;
        while (i < info.decimals) { d := d * 10; i += 1 };
        d
      };
    }
  };

  /// Release escrow to seller minus platform fee (confirmPaymentReceived / fulfillment complete).
  public func executeReleaseToSeller(
    trade : Types.Trade,
    escrow : Types.EscrowAccount,
    users : Map.Map<Types.UserId, Types.User>,
    treasuryId : Principal,
    ledger : Escrow.Icrc1Ledger,
    createdAtTime : Nat64,
  ) : async Types.Result<()> {
    let baseSellerAmount = Escrow.sellerAmount(escrow.amount);

    let (seizeTokenUnits, seizeCents) : (Nat, Nat) = switch (users.get(escrow.sellerPrincipal)) {
      case null (0, 0);
      case (?seller) {
        if (seller.liabilityBalance >= 0) {
          (0, 0)
        } else {
          let liabilityOwedCents : Nat = Int.abs(seller.liabilityBalance);
          let sellerAmountCents = PaymentsLib.tokenAmountToUsdCents(
            baseSellerAmount, escrow.token
          );
          let cents = Nat.min(liabilityOwedCents, sellerAmountCents);
          let divisor = tokenDivisor(escrow.token);
          let units = (cents * divisor) / 100;
          (units, cents)
        };
      };
    };

    let toSeller : Nat = if (seizeTokenUnits >= baseSellerAmount) 0
                         else baseSellerAmount - seizeTokenUnits : Nat;

    if (seizeTokenUnits > 0) {
      switch (
        transferOrErr(
          await ledger.icrc1_transfer({
            to = { owner = treasuryId; subaccount = null };
            amount = seizeTokenUnits;
            fee = null;
            memo = ?"cross-collateral-seizure".encodeUtf8();
            from_subaccount = null;
            created_at_time = ?createdAtTime;
          }),
          "cross-collateral seizure failed",
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
      switch (users.get(escrow.sellerPrincipal)) {
        case null {};
        case (?seller) {
          if (seizeCents > 0) {
            seller.liabilityBalance := seller.liabilityBalance + Int.fromNat(seizeCents);
            let seizureEvent : Types.LiabilityEvent = {
              liabilityId = 0;
              amount = Int.fromNat(seizeCents);
              reason = "cross_collateral_seizure";
              tradeId = trade.id;
              timestamp = Types.now();
            };
            seller.liabilityHistory := seller.liabilityHistory.concat([seizureEvent]);
          };
        };
      };
    };

    if (toSeller > 0) {
      switch (
        transferOrErr(
          await ledger.icrc1_transfer({
            to = { owner = escrow.sellerPrincipal; subaccount = null };
            amount = toSeller;
            fee = null;
            memo = ?"escrow-release".encodeUtf8();
            from_subaccount = null;
            created_at_time = ?createdAtTime;
          }),
          "seller release failed",
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };

    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.platformFee(escrow.amount);
          fee = null;
          memo = ?"platform-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "platform fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.cycleFee(escrow.amount);
          fee = null;
          memo = ?"cycles-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "cycles fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.reserveFee(escrow.amount);
          fee = null;
          memo = ?"reserve-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "reserve fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };

    #ok(())
  };

  public func executeRefundBuyer(
    escrow : Types.EscrowAccount,
    memo : Text,
    ledger : Escrow.Icrc1Ledger,
    createdAtTime : Nat64,
  ) : async Types.Result<()> {
    transferOrErr(
      await ledger.icrc1_transfer({
        to = { owner = escrow.buyerPrincipal; subaccount = null };
        amount = escrow.amount;
        fee = null;
        memo = ?memo.encodeUtf8();
        from_subaccount = null;
        created_at_time = ?createdAtTime;
      }),
      "buyer refund failed",
    )
  };

  public func executeBuyerCancelSplit(
    escrow : Types.EscrowAccount,
    split : Types.BuyerCancelPenaltySplit,
    treasuryId : Principal,
    ledger : Escrow.Icrc1Ledger,
    createdAtTime : Nat64,
  ) : async Types.Result<()> {
    if (split.buyerRefund > 0) {
      switch (
        transferOrErr(
          await ledger.icrc1_transfer({
            to = { owner = escrow.buyerPrincipal; subaccount = null };
            amount = split.buyerRefund;
            fee = null;
            memo = ?"buyer-cancel-refund".encodeUtf8();
            from_subaccount = null;
            created_at_time = ?createdAtTime;
          }),
          "buyer cancel refund failed",
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };
    if (split.sellerCompensation > 0) {
      switch (
        transferOrErr(
          await ledger.icrc1_transfer({
            to = { owner = escrow.sellerPrincipal; subaccount = null };
            amount = split.sellerCompensation;
            fee = null;
            memo = ?"buyer-cancel-seller".encodeUtf8();
            from_subaccount = null;
            created_at_time = ?createdAtTime;
          }),
          "buyer cancel seller transfer failed",
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };
    if (split.platformFee > 0) {
      switch (
        transferOrErr(
          await ledger.icrc1_transfer({
            to = { owner = treasuryId; subaccount = null };
            amount = split.platformFee;
            fee = null;
            memo = ?"buyer-cancel-platform".encodeUtf8();
            from_subaccount = null;
            created_at_time = ?createdAtTime;
          }),
          "buyer cancel platform transfer failed",
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };
    #ok(())
  };

  func transferDisputeFees(
    feeBaseAmount : Nat,
    treasuryId : Principal,
    ledger : Escrow.Icrc1Ledger,
    createdAtTime : Nat64,
  ) : async Types.Result<()> {
    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.platformFee(feeBaseAmount);
          fee = null;
          memo = ?"platform-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "platform fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.cycleFee(feeBaseAmount);
          fee = null;
          memo = ?"cycles-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "cycles fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (
      transferOrErr(
        await ledger.icrc1_transfer({
          to = { owner = treasuryId; subaccount = null };
          amount = Escrow.reserveFee(feeBaseAmount);
          fee = null;
          memo = ?"reserve-fee".encodeUtf8();
          from_subaccount = null;
          created_at_time = ?createdAtTime;
        }),
        "reserve fee transfer failed",
      )
    ) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    #ok(())
  };

  public func executeDisputeSettlement(
    trade : Types.Trade,
    escrow : Types.EscrowAccount,
    op : Types.OnChainSettlementOp,
    treasuryId : Principal,
    ledger : Escrow.Icrc1Ledger,
    createdAtTime : Nat64,
  ) : async Types.Result<()> {
    switch (op) {
      case (#disputeBuyerWins) {
        await executeRefundBuyer(escrow, "dispute-buyer-wins", ledger, createdAtTime)
      };
      case (#disputeSellerWins { sellerHasNegativeRep }) {
        if (sellerHasNegativeRep) {
          switch (
            transferOrErr(
              await ledger.icrc1_transfer({
                to = { owner = treasuryId; subaccount = null };
                amount = Escrow.sellerAmount(escrow.amount);
                fee = null;
                memo = ?"cross-collateral-seizure".encodeUtf8();
                from_subaccount = null;
                created_at_time = ?createdAtTime;
              }),
              "dispute seizure failed",
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        } else {
          switch (
            transferOrErr(
              await ledger.icrc1_transfer({
                to = { owner = escrow.sellerPrincipal; subaccount = null };
                amount = Escrow.sellerAmount(escrow.amount);
                fee = null;
                memo = ?"dispute-seller-wins".encodeUtf8();
                from_subaccount = null;
                created_at_time = ?createdAtTime;
              }),
              "dispute seller release failed",
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
        await transferDisputeFees(escrow.amount, treasuryId, ledger, createdAtTime)
      };
      case (#disputeSplit { sellerHasNegativeRep }) {
        let halfAmount = escrow.amount / 2;
        switch (
          transferOrErr(
            await ledger.icrc1_transfer({
              to = { owner = escrow.buyerPrincipal; subaccount = null };
              amount = halfAmount;
              fee = null;
              memo = ?"dispute-split-buyer".encodeUtf8();
              from_subaccount = null;
              created_at_time = ?createdAtTime;
            }),
            "dispute split buyer failed",
          )
        ) {
          case (#err(e)) return #err(e);
          case (#ok(_)) {};
        };
        let sellerHalf = Escrow.sellerAmount(halfAmount);
        if (sellerHasNegativeRep) {
          switch (
            transferOrErr(
              await ledger.icrc1_transfer({
                to = { owner = treasuryId; subaccount = null };
                amount = sellerHalf;
                fee = null;
                memo = ?"cross-collateral-seizure-split".encodeUtf8();
                from_subaccount = null;
                created_at_time = ?createdAtTime;
              }),
              "dispute split seizure failed",
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        } else {
          switch (
            transferOrErr(
              await ledger.icrc1_transfer({
                to = { owner = escrow.sellerPrincipal; subaccount = null };
                amount = sellerHalf;
                fee = null;
                memo = ?"dispute-split-seller".encodeUtf8();
                from_subaccount = null;
                created_at_time = ?createdAtTime;
              }),
              "dispute split seller failed",
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
        await transferDisputeFees(halfAmount, treasuryId, ledger, createdAtTime)
      };
      case (_) #err(#escrow_error("invalid dispute settlement op"));
    }
  };

  public func executePending(
    trade : Types.Trade,
    escrow : Types.EscrowAccount,
    pending : Types.PendingOnChainSettlement,
    users : Map.Map<Types.UserId, Types.User>,
    treasuryId : Principal,
    ledger : Escrow.Icrc1Ledger,
  ) : async Types.Result<()> {
    let createdAtTime = Nat64.fromNat(pending.queuedAt);
    switch (pending.op) {
      case (#releaseToSeller) {
        await executeReleaseToSeller(trade, escrow, users, treasuryId, ledger, createdAtTime)
      };
      case (#refundBuyer { memo }) {
        await executeRefundBuyer(escrow, memo, ledger, createdAtTime)
      };
      case (#buyerCancelSplit split) {
        await executeBuyerCancelSplit(escrow, split, treasuryId, ledger, createdAtTime)
      };
      case (#disputeBuyerWins or #disputeSellerWins(_) or #disputeSplit(_)) {
        await executeDisputeSettlement(trade, escrow, pending.op, treasuryId, ledger, createdAtTime)
      };
    }
  };

  /// Scans trades for pending on-chain settlements (retry job input).
  public func collectPendingTradeIds(
    trades : Map.Map<Types.TradeId, Types.Trade>,
  ) : [Types.TradeId] {
    var ids : [Types.TradeId] = [];
    trades.forEach(func(id, trade) {
      switch (trade.pendingOnChainSettlement) {
        case null {};
        case (?_) {
          if (trade.escrowAccount != null) {
            ids := ids.concat([id]);
          };
        };
      };
    });
    ids
  };

  public func sellerCompensationCredit(
    trade : Types.Trade,
    users : Map.Map<Types.UserId, Types.User>,
    split : Types.BuyerCancelPenaltySplit,
  ) {
    if (split.sellerCompensation > 0) {
      switch (users.get(trade.seller)) {
        case null {};
        case (?seller) {
          let compCents = PaymentsLib.tokenAmountToUsdCents(
            split.sellerCompensation,
            trade.token,
          );
          if (compCents > 0) {
            Reputation.recordLiabilityCredit(
              seller,
              compCents,
              "buyer_cancel_compensation",
              ?trade.id,
              null,
            );
          };
        };
      };
    };
  };

}
