import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types";
import Payments "../lib/Payments";

/// Seller listing stake — max(5% × price, 10 USDT) locked before publish (E6.S8 / FR-27).
module {

  public type StakeKey = Text;

  let STAKE_BPS : Nat = 500; // 5%
  let MIN_STAKE_MICROS : Nat = 10_000_000; // 10 USDT at 6 decimals (Wave 1 listing tokens)
  /// D-020: stake held through 48h claim window after trade completes (physical default).
  public let STAKE_CLAIM_PERIOD_NS : Nat = 172_800_000_000_000;

  public func stakeKey(user : Types.UserId, token : Types.TradeToken) : StakeKey {
    user.toText() # ":" # tokenTag(token)
  };

  func tokenTag(token : Types.TradeToken) : Text {
    switch token {
      case (#ckUSDC) "ckUSDC";
      case (#ckUSDT) "ckUSDT";
      case (#USDT_TRC20) "USDT_TRC20";
      case (#USDT_BEP20) "USDT_BEP20";
      case (#USDC_SPL) "USDC_SPL";
      case (#USDT_ERC20) "USDT_ERC20";
      case (#USDC_ERC20) "USDC_ERC20";
      case (#USDT_POLYGON) "USDT_POLYGON";
      case (#USDC_POLYGON) "USDC_POLYGON";
      case (#USDT_AVAX) "USDT_AVAX";
      case (#USDC_AVAX) "USDC_AVAX";
    }
  };

  func pow10(decimals : Nat) : Nat {
    var d : Nat = 1;
    var i = 0;
    while (i < decimals) {
      d := d * 10;
      i += 1;
    };
    d
  };

  public func minStakeAmount(token : Types.TradeToken) : Nat {
    let decimals = switch (Payments.getTokenDisplayInfo(token)) {
      case null 6;
      case (?info) info.decimals;
    };
    10 * pow10(decimals)
  };

  /// Required stake for listing price P: max(0.05×P, 10 USDT) in listing token units.
  public func requiredStakeAmount(priceAmount : Nat) : Nat {
    let pctStake = priceAmount * STAKE_BPS / 10_000;
    if (pctStake > MIN_STAKE_MICROS) pctStake else MIN_STAKE_MICROS
  };

  public func requiredStakeForToken(priceAmount : Nat, token : Types.TradeToken) : Nat {
    let pctStake = priceAmount * STAKE_BPS / 10_000;
    let floor = minStakeAmount(token);
    if (pctStake > floor) pctStake else floor
  };

  public func getBalance(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    user : Types.UserId,
    token : Types.TradeToken,
  ) : Types.StakeBalance {
    switch (stakeBalances.get(stakeKey(user, token))) {
      case null { { var available = 0; var locked = 0 } };
      case (?b) b;
    }
  };

  public func toBalanceView(bal : Types.StakeBalance) : Types.StakeBalanceView {
    { available = bal.available; locked = bal.locked }
  };

  public func toListingStakeView(rec : Types.ListingStakeRecord) : Types.ListingStakeView {
    {
      listingId = rec.listingId;
      seller = rec.seller;
      token = rec.token;
      amount = rec.amount;
      status = rec.status;
      lockedAt = rec.lockedAt;
    }
  };

  public func depositStake(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    user : Types.UserId,
    token : Types.TradeToken,
    amount : Nat,
  ) : Types.Result<()> {
    if (amount == 0) return #err(#invalid_input("Deposit amount must be greater than 0."));
    let key = stakeKey(user, token);
    switch (stakeBalances.get(key)) {
      case null {
        stakeBalances.add(key, { var available = amount; var locked = 0 });
      };
      case (?bal) {
        bal.available += amount;
      };
    };
    #ok(())
  };

  public func withdrawStake(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    user : Types.UserId,
    token : Types.TradeToken,
    amount : Nat,
  ) : Types.Result<()> {
    if (amount == 0) return #err(#invalid_input("Withdraw amount must be greater than 0."));
    let bal = getBalance(stakeBalances, user, token);
    if (bal.locked > 0) {
      return #err(#invalid_input("Cannot withdraw while stake is locked on active listings."));
    };
    if (bal.available < amount) {
      return #err(#insufficient_funds);
    };
    let key = stakeKey(user, token);
    bal.available -= amount;
    if (bal.available == 0 and bal.locked == 0) {
      stakeBalances.remove(key);
    } else {
      stakeBalances.add(key, bal);
    };
    #ok(())
  };

  /// Lock stake for listing publish. Moves funds from available → locked.
  public func lockListingStake(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    listingId : Types.ListingId,
    seller : Types.UserId,
    priceAmount : Nat,
    token : Types.TradeToken,
    now : Types.Timestamp,
  ) : Types.Result<Nat> {
    switch (listingStakes.get(listingId)) {
      case (?_) {
        return #err(#invalid_input("Stake already locked for this listing."));
      };
      case null {};
    };
    let required = requiredStakeForToken(priceAmount, token);
    let key = stakeKey(seller, token);
    let bal = switch (stakeBalances.get(key)) {
      case null return #err(#insufficient_funds);
      case (?b) b;
    };
    if (bal.available < required) {
      return #err(#insufficient_funds);
    };
    bal.available -= required;
    bal.locked += required;
    stakeBalances.add(key, bal);
    let rec : Types.ListingStakeRecord = {
      var amount = required;
      listingId;
      lockedAt = now;
      seller;
      var status = #locked;
      token;
    };
    listingStakes.add(listingId, rec);
    #ok(required)
  };

  /// Release stake after listing/trade lifecycle allows (no active lock obligation).
  public func releaseStake(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    listingId : Types.ListingId,
  ) : Types.Result<Nat> {
    switch (listingStakes.get(listingId)) {
      case null return #err(#not_found);
      case (?rec) {
        if (rec.status != #locked) {
          return #err(#invalid_input("Stake is not locked."));
        };
        let key = stakeKey(rec.seller, rec.token);
        let bal = switch (stakeBalances.get(key)) {
          case null return #err(#not_found);
          case (?b) b;
        };
        if (bal.locked < rec.amount) {
          return #err(#invalid_input("Locked balance mismatch."));
        };
        bal.locked -= rec.amount;
        bal.available += rec.amount;
        stakeBalances.add(key, bal);
        rec.status := #released;
        #ok(rec.amount)
      };
    }
  };

  /// Seize locked stake (seller-fault). Seized amount leaves the seller wallet (treasury hook later).
  public func seizeStake(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    listingId : Types.ListingId,
    _reason : ?Text,
  ) : Types.Result<Nat> {
    switch (listingStakes.get(listingId)) {
      case null return #err(#not_found);
      case (?rec) {
        if (rec.status != #locked) {
          return #err(#invalid_input("Stake is not locked."));
        };
        let seized = rec.amount;
        let key = stakeKey(rec.seller, rec.token);
        let bal = switch (stakeBalances.get(key)) {
          case null return #err(#not_found);
          case (?b) b;
        };
        if (bal.locked < seized) {
          return #err(#invalid_input("Locked balance mismatch."));
        };
        bal.locked -= seized;
        stakeBalances.add(key, bal);
        rec.status := #seized;
        rec.amount := 0;
        #ok(seized)
      };
    }
  };

  public func getListingStake(
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    listingId : Types.ListingId,
  ) : ?Types.ListingStakeRecord {
    listingStakes.get(listingId)
  };

  /// Release locked listing stake after successful trade + D-020 claim window (48h).
  public func tryReleaseAfterClaimPeriod(
    stakeBalances : Map.Map<StakeKey, Types.StakeBalance>,
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>,
    listingId : Types.ListingId,
    trade : Types.Trade,
    now : Types.Timestamp,
  ) : Types.Result<Bool> {
    if (trade.listing != listingId) return #ok(false);
    if (trade.status != #complete) return #ok(false);
    let completedAt = switch (trade.completedAt) {
      case null return #ok(false);
      case (?t) t;
    };
    if (now < completedAt + STAKE_CLAIM_PERIOD_NS) return #ok(false);
    switch (listingStakes.get(listingId)) {
      case null return #ok(false);
      case (?rec) {
        if (rec.status != #locked) return #ok(false);
        switch (releaseStake(stakeBalances, listingStakes, listingId)) {
          case (#ok(_)) #ok(true);
          case (#err(e)) #err(e);
        };
      };
    }
  };

}
