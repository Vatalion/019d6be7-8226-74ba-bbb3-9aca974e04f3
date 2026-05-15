import Map "mo:core/Map";
import Types "../types";
import Auth "../lib/Auth";
import Admin "../lib/Admin";
import VaultLib "../lib/Vault";
import VaultBalances "../lib/VaultBalances";

/// Vault API mixin — public endpoints for cross-chain stablecoin vault addresses
/// and balance checking.
///
/// State injected:
///   users        — for auth/registration check
///   addressCache — (userId:chain → VaultAddress) persistent address cache
///   balanceCache — (userId:chain → BalanceResult) balance TTL cache
///   systemSettings — holds infuraApiKey, tronGridApiKey, bscScanApiKey
mixin (
  users        : Map.Map<Types.UserId, Types.User>,
  addressCache : Map.Map<VaultLib.CacheKey, VaultLib.VaultAddress>,
  balanceCache : Map.Map<VaultBalances.BalanceCacheKey, VaultBalances.BalanceResult>,
  systemSettings : Admin.SystemSettings,
) {

  // ─── Shared types (Candid-safe, immutable) ────────────────────────────────

  public type ChainType = VaultLib.ChainType;

  public type VaultAddressView = {
    chain          : ChainType;
    tokenSymbol    : Text;
    network        : Text;
    address        : Text;
    derivedAt      : Int;
  };

  public type BalanceView = {
    chain       : ChainType;
    usdtBalance : Nat;
    usdcBalance : Nat;
    lastChecked : Int;
    error       : ?Text;
  };

  func toAddressView(v : VaultLib.VaultAddress) : VaultAddressView {
    {
      chain       = v.chain;
      tokenSymbol = v.tokenSymbol;
      network     = v.network;
      address     = v.address;
      derivedAt   = v.derivedAt;
    }
  };

  func toBalanceView(b : VaultBalances.BalanceResult) : BalanceView {
    {
      chain       = b.chain;
      usdtBalance = b.usdtBalance;
      usdcBalance = b.usdcBalance;
      lastChecked = b.lastChecked;
      error       = b.error;
    }
  };

  // ─── Public update — derive all 6 vault addresses ────────────────────────

  /// Returns all 6 chain vault deposit addresses for the caller.
  /// Derives on demand (first call per chain), then returns cached.
  /// Caller must be a registered user.
  public shared ({ caller }) func getVaultAddresses() : async [VaultAddressView] {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);
    let addrs = await VaultLib.getVaultAddresses(addressCache, caller);
    addrs.map<VaultLib.VaultAddress, VaultAddressView>(toAddressView)
  };

  // ─── Public update — refresh balance for one chain ───────────────────────

  /// Force-refreshes (or cache-serves) the USDT/USDC balance for the caller
  /// on the specified chain. Makes HTTP outcalls to blockchain APIs if cache
  /// is stale (older than 60 seconds). Returns the latest BalanceView.
  public shared ({ caller }) func refreshVaultBalance(chain : ChainType) : async BalanceView {
    Auth.assertNotAnonymous(caller);
    ignore Auth.requireUser(users, caller);

    // Resolve address (must be derived first — getVaultAddresses must have been called)
    let cacheKey = VaultLib.cacheKey(caller, chain);
    let address = switch (addressCache.get(cacheKey)) {
      case (?va) va.address;
      case null  {
        // Auto-derive if not cached yet
        let va = await VaultLib.deriveAddress(addressCache, caller, chain);
        va.address
      };
    };

    let result = await VaultBalances.getOrFetchBalance(
      balanceCache,
      caller,
      chain,
      address,
      systemSettings.infuraApiKey,
      systemSettings.tronGridApiKey,
      systemSettings.bscScanApiKey,
    );
    toBalanceView(result)
  };

  // ─── Public query — get cached balance ───────────────────────────────────

  /// Returns the last-cached balance for the caller on the specified chain,
  /// or null if no balance has been fetched yet.
  /// This is a query call (no HTTP outcall) — instant response.
  public query ({ caller }) func getVaultBalance(chain : ChainType) : async ?BalanceView {
    Auth.assertNotAnonymous(caller);
    switch (VaultBalances.getCachedBalance(balanceCache, caller, chain)) {
      case (?b) ?toBalanceView(b);
      case null null;
    }
  };

}
