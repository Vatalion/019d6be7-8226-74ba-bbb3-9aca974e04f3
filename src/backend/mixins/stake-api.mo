import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";
import Auth "../lib/Auth";
import Stake "../lib/Stake";
import StakeLedger "../lib/StakeLedger";
import Marketplace "../lib/Marketplace";
import Escrow "../lib/Escrow";
import RateLimiter "../lib/RateLimiter";
import Admin "../lib/Admin";

/// Stake mixin — seller listing stake wallet and publish APIs (E6.S8).
mixin (
  users : Map.Map<Types.UserId, Types.User>,
  stakeBalances : Map.Map<Stake.StakeKey, Types.StakeBalance>,
  listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
  listings : Map.Map<Types.ListingId, Types.Listing>,
  trades : Map.Map<Types.TradeId, Types.Trade>,
  rateLimitStakeOps : Map.Map<Principal, (Nat, Types.Timestamp)>,
  systemSettings : Admin.SystemSettings,
  selfPrincipal : { var value : Principal },
  treasuryId : { var value : Principal },
) {

  public shared query func getRequiredListingStake(
    priceAmount : Nat,
    token : Types.TradeToken,
  ) : async Nat {
    Stake.requiredStakeForToken(priceAmount, token)
  };

  public shared query ({ caller }) func getMyStakeBalance(
    token : Types.TradeToken,
  ) : async Types.StakeBalanceView {
    Auth.assertNotAnonymous(caller);
    Stake.toBalanceView(Stake.getBalance(stakeBalances, caller, token))
  };

  public shared query func getListingStake(
    listingId : Types.ListingId,
  ) : async ?Types.ListingStakeView {
    switch (Stake.getListingStake(listingStakes, listingId)) {
      case null null;
      case (?rec) ?Stake.toListingStakeView(rec);
    }
  };

  public shared query func getStakeOnChainEnabled() : async Bool {
    systemSettings.stakeOnChainEnabled
  };

  public shared ({ caller }) func depositStake(
    token : Types.TradeToken,
    amount : Nat,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitStakeOps)) {
      return #err(#rate_limited);
    };
    if (StakeLedger.stakeOnChainActive(systemSettings, token)) {
      switch (
        await StakeLedger.depositOnChain(
          systemSettings, selfPrincipal.value, caller, token, amount,
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };
    // Wave-1 manual-chain tokens: internal ledger only (see StakeLedger module comment).
    Stake.depositStake(stakeBalances, caller, token, amount)
  };

  public shared ({ caller }) func withdrawStake(
    token : Types.TradeToken,
    amount : Nat,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitStakeOps)) {
      return #err(#rate_limited);
    };
    let bal = Stake.getBalance(stakeBalances, caller, token);
    if (bal.locked > 0) {
      return #err(#invalid_input("Cannot withdraw while stake is locked on active listings."));
    };
    if (bal.available < amount) {
      return #err(#insufficient_funds);
    };
    if (StakeLedger.stakeOnChainActive(systemSettings, token)) {
      switch (
        await StakeLedger.transferToSeller(
          systemSettings, selfPrincipal.value, caller, token, amount,
        )
      ) {
        case (#err(e)) return #err(e);
        case (#ok(_)) {};
      };
    };
    switch (Stake.withdrawStake(stakeBalances, listingStakes, caller, token, amount)) {
      case (#err(e)) #err(e);
      case (#ok(_)) #ok(());
    }
  };

  /// Publish a draft listing after stake is deposited (lock + activate).
  public shared ({ caller }) func publishListing(
    listingId : Types.ListingId,
  ) : async Types.Result<()> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    if (not RateLimiter.check(caller, 60_000_000_000, 10, rateLimitStakeOps)) {
      return #err(#rate_limited);
    };
    switch (listings.get(listingId)) {
      case null return #err(#not_found);
      case (?listing) {
        if (listing.seller != caller) return #err(#unauthorized);
        if (listing.status != #draft) {
          return #err(#invalid_input("Only draft listings can be published."));
        };
        switch (Marketplace.assertDigitalReadyForPublish(listing)) {
          case (?e) return #err(e);
          case null {};
        };
        switch (
          Stake.lockListingStake(
            stakeBalances,
            listingStakes,
            listingId,
            caller,
            listing.priceAmount,
            listing.priceToken,
            Types.now(),
          )
        ) {
          case (#err(e)) #err(e);
          case (#ok(_)) {
            listing.status := #active;
            #ok(())
          };
        }
      };
    }
  };

  public shared ({ caller }) func releaseListingStake(
    listingId : Types.ListingId,
  ) : async Types.Result<Nat> {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);
    switch (listingStakes.get(listingId)) {
      case null return #err(#not_found);
      case (?rec) {
        if (rec.seller != caller) return #err(#unauthorized);
        let amount = rec.amount;
        switch (Escrow.assertListingStakeReleasable(listings, trades, listingId)) {
          case (#err(e)) return #err(e);
          case (#ok(_)) {};
        };
        if (StakeLedger.stakeOnChainActive(systemSettings, rec.token)) {
          switch (
            await StakeLedger.transferToSeller(
              systemSettings, selfPrincipal.value, rec.seller, rec.token, amount,
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
        switch (Stake.releaseStake(stakeBalances, listingStakes, listingId)) {
          case (#err(e)) #err(e);
          case (#ok(released)) #ok(released);
        };
      };
    }
  };

  public shared ({ caller }) func seizeListingStake(
    listingId : Types.ListingId,
    reason : ?Text,
  ) : async Types.Result<Nat> {
    Auth.assertNotAnonymous(caller);
    let user = Auth.requireUser(users, caller);
    if (not Auth.canActAsModerator(user) and not Auth.canActAsAdmin(user)) {
      return #err(#unauthorized);
    };
    switch (listingStakes.get(listingId)) {
      case null return #err(#not_found);
      case (?rec) {
        if (rec.status != #locked) {
          return #err(#invalid_input("Stake is not locked."));
        };
        let seized = rec.amount;
        if (StakeLedger.stakeOnChainActive(systemSettings, rec.token)) {
          switch (
            await StakeLedger.transferToTreasury(
              systemSettings, treasuryId.value, rec.token, seized,
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
        switch (Stake.seizeStake(stakeBalances, listingStakes, listingId, reason)) {
          case (#err(e)) #err(e);
          case (#ok(seizedAmount)) #ok(seizedAmount);
        };
      };
    }
  };

  /// After trade #complete and 48h claim window (D-020), return stake to seller wallet.
  public shared ({ caller }) func checkAndReleaseListingStakeAfterClaim(
    listingId : Types.ListingId,
    tradeId : Types.TradeId,
  ) : async Types.Result<Bool> {
    Auth.assertNotAnonymous(caller);
    let trade = switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?t) t;
    };
    if (not Principal.equal(caller, trade.seller)) {
      return #err(#unauthorized);
    };
    if (trade.listing != listingId) {
      return #err(#invalid_input("Trade does not belong to this listing."));
    };
    switch (listingStakes.get(listingId)) {
      case null return #ok(false);
      case (?rec) {
        if (trade.status != #complete) return #ok(false);
        let completedAt = switch (trade.completedAt) {
          case null return #ok(false);
          case (?t) t;
        };
        if (Types.now() < completedAt + Stake.STAKE_CLAIM_PERIOD_NS) {
          return #ok(false);
        };
        if (rec.status != #locked) return #ok(false);
        if (StakeLedger.stakeOnChainActive(systemSettings, rec.token)) {
          switch (
            await StakeLedger.transferToSeller(
              systemSettings, selfPrincipal.value, rec.seller, rec.token, rec.amount,
            )
          ) {
            case (#err(e)) return #err(e);
            case (#ok(_)) {};
          };
        };
        switch (
          Stake.tryReleaseAfterClaimPeriod(
            stakeBalances, listingStakes, listingId, trade, Types.now(),
          )
        ) {
          case (#err(e)) #err(e);
          case (#ok(released)) #ok(released);
        }
      };
    }
  };

}
