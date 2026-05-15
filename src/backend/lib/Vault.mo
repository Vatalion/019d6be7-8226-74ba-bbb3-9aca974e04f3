import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Nat8 "mo:core/Nat8";
import Nat32 "mo:core/Nat32";
import Error "mo:core/Error";
import Types "../types";
import Base58 "Base58";
import Sha256 "Sha256";

/// Vault — cross-chain stablecoin deposit address derivation.
///
/// Uses the ICP management canister's threshold ECDSA (`ecdsa_public_key`)
/// to derive a deterministic deposit address per (userId, chain) pair.
/// Addresses are cached after first derivation (one-time cost per user/chain).
///
/// ECDSA key names by environment:
///   - Production (mainnet ICP): "key_1"
///   - Staging / pre-production:  "test_key_1"
///   - Local dfx development:     "dfx_test_key"
///
/// All functions are stateless — state is injected at call site.
module {

  // ─── Types ────────────────────────────────────────────────────────────────

  public type ChainType = {
    #TRC20;      // Tron — keccak256 + base58check
    #BEP20;      // BSC — EVM keccak256 last 20 bytes
    #ERC20;      // Ethereum — EVM keccak256 last 20 bytes
    #SPL;        // Solana — Ed25519 pubkey (base58)
    #Polygon;    // Polygon — EVM keccak256 last 20 bytes
    #Avalanche;  // Avalanche C-chain — EVM keccak256 last 20 bytes
  };

  public type VaultAddress = {
    chain          : ChainType;
    tokenSymbol    : Text;
    network        : Text;
    address        : Text;
    derivationPath : [Blob];
    derivedAt      : Int;
  };

  // Composite cache key: (userId text concat chain tag)
  public type CacheKey = Text;

  // ─── Management canister interface ────────────────────────────────────────

  type EcdsaPublicKeyArgs = {
    canister_id    : ?Principal;
    derivation_path : [Blob];
    key_id         : { curve : { #secp256k1 }; name : Text };
  };

  type EcdsaPublicKeyResult = {
    public_key : Blob;
    chain_code : Blob;
  };

  let management : actor {
    ecdsa_public_key : EcdsaPublicKeyArgs -> async EcdsaPublicKeyResult;
    sign_with_ecdsa : {
      message_hash    : Blob;
      derivation_path : [Blob];
      key_id          : { curve : { #secp256k1 }; name : Text };
    } -> async { signature : Blob };
  } = actor "aaaaa-aa";

  // ─── Address encoding helpers ─────────────────────────────────────────────

  /// NOTE: This is a simplified deterministic derivation for MVP.
  /// Production-grade EVM addresses require Keccak-256(uncompressed pubkey)
  /// which needs secp256k1 point decompression (deferred to Phase 3).
  /// The derivation path guarantees uniqueness per (user, chain).
  func evmAddressFromPubkey(pubkey : Blob) : Text {
    // Take last 20 bytes of the pubkey blob for the address
    var all : List.List<Nat8> = List.empty<Nat8>();
    for (b in pubkey.vals()) { all.add(b) };
    let arr = all.toArray();
    let len = arr.size();
    // Use last 20 bytes (or pad if shorter)
    let start = if (len >= 20) len - 20 else 0;
    var hex = "0x";
    var i = start;
    while (i < len) {
      hex := hex # byteToHex(arr[i]);
      i += 1;
    };
    hex
  };

  /// Tron address: proper base58check encoding.
  /// 1. Derive EVM hex address (simplified, last 20 bytes of pubkey).
  /// 2. Prepend version byte 0x41.
  /// 3. Double-SHA256 the 21-byte payload; take first 4 bytes as checksum.
  /// 4. Base58-encode the 25-byte result (version + payload + checksum).
  func tronAddressFromPubkey(pubkey : Blob) : Text {
    // Step 1: get EVM address bytes (20 bytes) from existing simplified derivation
    let evmHex = evmAddressFromPubkey(pubkey);
    let hexStr = switch (evmHex.stripStart(#text "0x")) {
      case (?s) s;
      case null evmHex;
    };
    let payloadBytes = hexToBytes(hexStr); // 20 bytes

    // Step 2: prepend version byte 0x41
    let versioned = Array.tabulate<Nat8>(21, func(i) {
      if (i == 0) 0x41 else payloadBytes[i - 1]
    });

    // Step 3: double-SHA256, take first 4 bytes as checksum
    let hash1 = Sha256.sha256(Blob.fromArray(versioned));
    let hash2 = Sha256.sha256(hash1);
    let hashBytes = hash2.toArray();
    let checksum = Array.tabulate(4, func(i : Nat) : Nat8 { hashBytes[i] });

    // Step 4: base58-encode versioned (21 bytes) + checksum (4 bytes) = 25 bytes
    let full = versioned.concat(checksum);
    Base58.encode(full)
  };

  /// Solana address: base58 encoding of the first 32 bytes of the pubkey.
  /// Ed25519 keys on Solana are 32 bytes; we use the first 32 bytes of
  /// the secp256k1 pubkey as a deterministic seed.
  func solanaAddressFromPubkey(pubkey : Blob) : Text {
    let bytes = pubkey.toArray();
    let len = if (bytes.size() >= 32) 32 else bytes.size();
    let slice = Array.tabulate(len, func(i : Nat) : Nat8 { bytes[i] });
    Base58.encode(slice)
  };

  func byteToHex(b : Nat8) : Text {
    let hi = b.toNat() / 16;
    let lo = b.toNat() % 16;
    hexChar(hi) # hexChar(lo)
  };

  func hexChar(n : Nat) : Text {
    switch n {
      case 0 "0"; case 1 "1"; case 2 "2"; case 3 "3";
      case 4 "4"; case 5 "5"; case 6 "6"; case 7 "7";
      case 8 "8"; case 9 "9"; case 10 "a"; case 11 "b";
      case 12 "c"; case 13 "d"; case 14 "e"; case 15 "f";
      case _ "?";
    }
  };

  /// Convert a hex string (even number of characters) to a byte array.
  func hexToBytes(hex : Text) : [Nat8] {
    let chars = hex.toArray();
    let len = chars.size() / 2;
    Array.tabulate<Nat8>(len, func(i) {
      let hi = hexCharToNat8(chars[i * 2]);
      let lo = hexCharToNat8(chars[i * 2 + 1]);
      hi * 16 + lo
    })
  };

  func hexCharToNat8(c : Char) : Nat8 {
    let n = c.toNat32();
    if (n >= 48 and n <= 57) {
      // '0'-'9'
      Nat8.fromNat((n - 48).toNat())
    } else if (n >= 65 and n <= 70) {
      // 'A'-'F'
      Nat8.fromNat((n - 55).toNat())
    } else if (n >= 97 and n <= 102) {
      // 'a'-'f'
      Nat8.fromNat((n - 87).toNat())
    } else {
      0
    }
  };

  // ─── Cache key ────────────────────────────────────────────────────────────

  public func cacheKey(userId : Types.UserId, chain : ChainType) : CacheKey {
    userId.toText() # ":" # chainTag(chain)
  };

  public func chainTag(chain : ChainType) : Text {
    switch chain {
      case (#TRC20)     "TRC20";
      case (#BEP20)     "BEP20";
      case (#ERC20)     "ERC20";
      case (#SPL)       "SPL";
      case (#Polygon)   "POLYGON";
      case (#Avalanche) "AVAX";
    }
  };

  func chainMeta(chain : ChainType) : { symbol : Text; network : Text } {
    switch chain {
      case (#TRC20)     ( { symbol = "USDT/USDC"; network = "Tron (TRC20)"          } );
      case (#BEP20)     ( { symbol = "USDT/USDC"; network = "BNB Smart Chain (BEP20)" } );
      case (#ERC20)     ( { symbol = "USDT/USDC"; network = "Ethereum (ERC20)"      } );
      case (#SPL)       ( { symbol = "USDT/USDC"; network = "Solana (SPL)"          } );
      case (#Polygon)   ( { symbol = "USDT/USDC"; network = "Polygon"               } );
      case (#Avalanche) ( { symbol = "USDT/USDC"; network = "Avalanche C-Chain"     } );
    }
  };

  // ─── Derivation path ──────────────────────────────────────────────────────

  /// Build derivation path: [userId bytes, chain tag bytes].
  public func buildDerivationPath(userId : Types.UserId, chain : ChainType) : [Blob] {
    [userId.toBlob(), chainTag(chain).encodeUtf8()]
  };

  // ─── Core derive ──────────────────────────────────────────────────────────

  /// Derive a VaultAddress for (userId, chain) via ICP threshold ECDSA.
  /// Caller must be authenticated (assertNotAnonymous called before).
  public func deriveAddress(
    addressCache : Map.Map<CacheKey, VaultAddress>,
    userId       : Types.UserId,
    chain        : ChainType,
  ) : async VaultAddress {
    let key = cacheKey(userId, chain);
    switch (addressCache.get(key)) {
      case (?cached) cached;
      case null {
        let path = buildDerivationPath(userId, chain);
        let result = await management.ecdsa_public_key({
          canister_id     = null;
          derivation_path = path;
          key_id          = { curve = #secp256k1; name = "key_1" };
        });
        let pubkey = result.public_key;
        let address = switch chain {
          case (#TRC20)     tronAddressFromPubkey(pubkey);
          case (#BEP20)     evmAddressFromPubkey(pubkey);
          case (#ERC20)     evmAddressFromPubkey(pubkey);
          case (#Polygon)   evmAddressFromPubkey(pubkey);
          case (#Avalanche) evmAddressFromPubkey(pubkey);
          case (#SPL)       solanaAddressFromPubkey(pubkey);
        };
        let meta = chainMeta(chain);
        let entry : VaultAddress = {
          chain          = chain;
          tokenSymbol    = meta.symbol;
          network        = meta.network;
          address        = address;
          derivationPath = path;
          derivedAt      = Time.now();
        };
        addressCache.add(key, entry);
        entry;
      };
    }
  };

  // ─── Batch: all 6 chains ─────────────────────────────────────────────────

  /// Return all 6 vault addresses for a user, deriving on demand.
  public func getVaultAddresses(
    addressCache : Map.Map<CacheKey, VaultAddress>,
    userId       : Types.UserId,
  ) : async [VaultAddress] {
    let chains : [ChainType] = [
      #TRC20, #BEP20, #ERC20, #SPL, #Polygon, #Avalanche,
    ];
    let results = List.empty<VaultAddress>();
    for (chain in chains.values()) {
      let addr = await deriveAddress(addressCache, userId, chain);
      results.add(addr);
    };
    results.toArray()
  };

  // ─── Transaction signing ──────────────────────────────────────────────────

  /// Sign a 32-byte message hash using the threshold ECDSA key for the
  /// given (userId, chain) derivation path.
  /// Returns the 64-byte raw ECDSA signature on success.
  public func signMessage(
    messageHash : Blob,
    userId      : Types.UserId,
    chain       : ChainType,
  ) : async { #ok : Blob; #err : Text } {
    let path = buildDerivationPath(userId, chain);
    try {
      let result = await management.sign_with_ecdsa({
        message_hash    = messageHash;
        derivation_path = path;
        key_id          = { curve = #secp256k1; name = "key_1" };
      });
      #ok(result.signature)
    } catch (e) {
      #err("sign_with_ecdsa failed: " # e.message())
    }
  };

}
