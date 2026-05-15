# ICP Skills — Mandatory Agent Instructions

> **Source of truth**: All content here is fetched directly from the official ICP skills index.
> Index URL: https://skills.internetcomputer.org/.well-known/skills/index.json
> Last rebuilt: 2026-04-14

---

## HOW TO LOAD SKILLS (MANDATORY PROTOCOL)

Every agent working on this project MUST load the relevant skill BEFORE writing any ICP-related code.

**Method 1 — CLI (preferred):**
```bash
npx skills add dfinity/icskills --skill <skill-name>
```

**Method 2 — Direct fetch from official URL:**
```
GET <url-from-index>
```
Example: `GET https://skills.internetcomputer.org/.well-known/skills/certified-variables/SKILL.md`

**RULE**: If a URL returns HTML instead of markdown, the URL is wrong. Always fetch from the index first, then follow the URL in the response.

**RULE**: Skill guidance ALWAYS overrides general LLM knowledge. Skills contain real dependency versions, real APIs, and real pitfalls that prevent build failures.

---

## FULL SKILLS INDEX

All available skills with their official URLs:

| Skill Name | Category | Official URL |
|---|---|---|
| `asset-canister` | Deployment | https://skills.internetcomputer.org/.well-known/skills/asset-canister/SKILL.md |
| `canister-security` | Security | https://skills.internetcomputer.org/.well-known/skills/canister-security/SKILL.md |
| `certified-variables` | Security | https://skills.internetcomputer.org/.well-known/skills/certified-variables/SKILL.md |
| `ckbtc` | Tokens | https://skills.internetcomputer.org/.well-known/skills/ckbtc/SKILL.md |
| `custom-domains` | Deployment | https://skills.internetcomputer.org/.well-known/skills/custom-domains/SKILL.md |
| `cycles-management` | Ops | https://skills.internetcomputer.org/.well-known/skills/cycles-management/SKILL.md |
| `evm-rpc` | Integration | https://skills.internetcomputer.org/.well-known/skills/evm-rpc/SKILL.md |
| `https-outcalls` | Integration | https://skills.internetcomputer.org/.well-known/skills/https-outcalls/SKILL.md |
| `ic-dashboard` | Ops | https://skills.internetcomputer.org/.well-known/skills/ic-dashboard/SKILL.md |
| `icp-cli` | Tooling | https://skills.internetcomputer.org/.well-known/skills/icp-cli/SKILL.md |
| `icrc-ledger` | Tokens | https://skills.internetcomputer.org/.well-known/skills/icrc-ledger/SKILL.md |
| `internet-identity` | Auth | https://skills.internetcomputer.org/.well-known/skills/internet-identity/SKILL.md |
| `motoko` | Language | https://skills.internetcomputer.org/.well-known/skills/motoko/SKILL.md |
| `multi-canister` | Architecture | https://skills.internetcomputer.org/.well-known/skills/multi-canister/SKILL.md |
| `stable-memory` | Architecture | https://skills.internetcomputer.org/.well-known/skills/stable-memory/SKILL.md |
| `vetkd` | Security | https://skills.internetcomputer.org/.well-known/skills/vetkd/SKILL.md |
| `wallet-integration` | Auth | https://skills.internetcomputer.org/.well-known/skills/wallet-integration/SKILL.md |

---

## SKILL REFERENCE: certified-variables

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/certified-variables/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill certified-variables`
**Category**: Security
**Compatibility**: icp-cli >= 0.2.2

### When to use in this project
- `_immutableObjectStorageCreateCertificate` — the backend method required by the `@caffeineai/object-storage` library. THIS IS THE ROOT CAUSE OF ALL 403 ERRORS FROM blob.caffeine.ai.
- Any query call that must return cryptographically verified data
- Dispute evidence or trade records that must be tamper-proof

### What certification actually is
Query calls run on a single replica WITHOUT consensus. A canister stores a hash in the IC's certified state tree during an **update call** (which goes through consensus). Query responses include a BLS-signed certificate proving the data is authentic.

```
UPDATE CALL (goes through consensus):
  1. Canister modifies data
  2. Canister calls CertifiedData.set(hash)   ← 32 bytes ONLY
  3. Subnet includes hash in its certified state tree

QUERY CALL (single replica, no consensus):
  1. Client sends query
  2. Canister calls CertifiedData.getCertificate()  ← subnet BLS signature
  3. Canister returns: { data, certificate, witness }
```

### How object-storage uses certification (CRITICAL)
The `@caffeineai/object-storage` library's `StorageClient` calls `_immutableObjectStorageCreateCertificate(hash)` before uploading a file. The gateway `blob.caffeine.ai` then verifies that the certificate in the upload request matches what the IC subnet has signed. If there is ANY mismatch — wrong bytes, wrong encoding, empty cert, non-v3 response — the gateway returns **403 Forbidden: Invalid payload**.

### Exact Motoko implementation for object-storage (from skill source)
```motoko
import CertifiedData "mo:core/CertifiedData";
import Blob "mo:core/Blob";

// Called by StorageClient BEFORE every file upload
// hash parameter is a SHA-256 hash in hex string format like "sha256:abc123..."
public shared func _immutableObjectStorageCreateCertificate(hash : Text) : async () {
  // CRITICAL: CertifiedData.set() accepts EXACTLY 32 bytes, no more, no less.
  // The hash arrives as a hex string "sha256:<64 hex chars>"
  // You must: strip the "sha256:" prefix, hex-decode the 64 chars into 32 binary bytes,
  // then call CertifiedData.set() with those 32 bytes.
  
  // DO NOT: encode as UTF-8 text (gives ~71 bytes, gets truncated to 32 garbage bytes)
  // DO NOT: pass the full hash string as a blob
  // DO NOT: call CertifiedData.set with anything other than exactly 32 binary bytes
  
  let stripped = if (Text.startsWith(hash, #text "sha256:")) {
    Text.trimStart(hash, #text "sha256:")
  } else {
    hash
  };
  // Hex decode: each pair of hex chars becomes one byte → 64 hex chars = 32 bytes
  let bytes = hexToBytes(stripped); // must produce exactly 32 Nat8 values
  CertifiedData.set(Blob.fromArray(bytes));
};
```

### Critical pitfalls (from official skill)
1. **Max 32 bytes** — `CertifiedData.set()` accepts AT MOST 32 bytes. Passing more truncates silently and produces a garbage certificate that the gateway will reject with 403.
2. **Update call only** — `CertifiedData.set()` CANNOT be called in a query. It MUST be in an `async` (update) function. Calling it in a query traps.
3. **Returns null in update context** — `CertifiedData.getCertificate()` returns `null` during update calls. It only returns the certificate during query calls.
4. **Cleared on upgrade** — After a canister upgrade, certified data is cleared. Must re-call `CertifiedData.set()` in `postupgrade` if needed.
5. **v3 response body** — The error "Expected v3 response body" means the `HttpAgent` is connecting to the wrong host or the canister did not return a certified (v3) response. Check that `host` is `https://icp-api.io` (mainnet) and that the canister method actually calls `CertifiedData.set()`.

### Dependencies
```toml
# mops.toml — CertifiedData is part of mo:core, no extra package needed
[dependencies]
core = "2.3.1"
```

---

## SKILL REFERENCE: internet-identity

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/internet-identity/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill internet-identity`
**Category**: Auth
**Compatibility**: icp-cli >= 0.2.2, Node.js >= 22

### When to use in this project
- All authentication flows — Internet Identity is the ONLY auth method in this project
- `useInternetIdentity()` React hook implementation
- Creating authenticated actors for canister calls
- Principal-based access control in backend

### Canister IDs (hardcoded — identical on mainnet and local)
| Canister | ID |
|---|---|
| Internet Identity backend | `rdmx6-jaaaa-aaaaa-aaadq-cai` |
| Internet Identity frontend | `uqzsh-gqaaa-aaaaq-qaada-cai` |
| II URL (mainnet) | `https://id.ai` |
| II URL (local dev) | `http://id.ai.localhost:8000` |

### Identity provider URL logic (from official skill)
```typescript
function getIdentityProviderUrl() {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  if (isLocal) return "http://id.ai.localhost:8000";
  return "https://id.ai"; // points to frontend canister uqzsh-gqaaa-aaaaq-qaada-cai
}
```

### Critical pitfalls (from official skill)
1. **Wrong II URL** — Must point to the **frontend** canister (`uqzsh-gqaaa-aaaaq-qaada-cai` / `https://id.ai`), NOT the backend.
2. **`2vxsx-fae` principal** — This is the anonymous principal. If you get it after login, auth silently failed. Check the identityProvider URL and that `onSuccess` callback is present.
3. **Never call `fetchRootKey()` on mainnet** — Allows MITM key substitution. Use the `ic_env` cookie instead.
4. **No `derivationOrigin` for `icp0.io` / `ic0.app`** — II automatically rewrites these domains. Adding `derivationOrigin` will BREAK authentication.
5. **Max delegation expiry: 30 days** — `BigInt(30) * BigInt(24) * BigInt(3_600_000_000_000)` nanoseconds. Longer values are silently clamped.
6. **Principal is NOT passed as function argument** — On the backend, get the caller via `shared(msg) { msg.caller }` in Motoko. Never pass principal as a Candid argument.

### Dependencies
```
ic-use-internet-identity  (wrapper used in this project)
@icp-sdk/auth >= 5.0.0
@icp-sdk/core >= 5.0.0
```

---

## SKILL REFERENCE: motoko

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/motoko/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill motoko`
**Category**: Language
**Compatibility**: moc >= 1.0.0, mops with core >= 2.0.0

### When to use in this project
- Writing or modifying ANY `.mo` file
- Fixing Motoko compiler errors
- Designing canister data structures

### mops.toml (required)
```toml
[toolchain]
moc = "1.3.0"

[dependencies]
core = "2.3.1"
```
**`moc` must be pinned** — without it, `icp build` fails.

### Critical compilation rules (from official skill)

| Rule | Wrong | Correct |
|---|---|---|
| Actor declaration | `actor { }` | `persistent actor { }` |
| Type placement | Before actor body | Inside actor body |
| Stable keyword | `stable var x` | `var x` (redundant in persistent actor) |
| Transient data | `var cache` (persists!) | `transient var cache` |
| Imports | `mo:base/HashMap` | `mo:core/Map` |
| Collections | `HashMap`, `Buffer`, `TrieMap` | `Map`, `List`, `Set` from `mo:core` |

### All mo:core imports
```motoko
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import CertifiedData "mo:core/CertifiedData";
import Runtime "mo:core/Runtime";
import Result "mo:core/Result";
import Option "mo:core/Option";
import Iter "mo:core/Iter";
import Debug "mo:core/Debug";
```

### Collection APIs (dot notation)
```motoko
// Map
let m = Map.empty<Nat, Text>();
Map.add(m, Nat.compare, 0, "Alice");
Map.get(m, Nat.compare, 0);      // ?Text
Map.remove(m, Nat.compare, 0);
Map.size(m);                      // Nat

// List
let l = List.empty<Text>();
List.add(l, "item");
List.get(l, 0);                   // ?T (safe)
List.at(l, 0);                    // T (traps if OOB)

// Set
let s = Set.empty<Text>();
Set.add(s, Text.compare, "tag");
Set.contains(s, Text.compare, "tag"); // Bool
```

### Critical pitfalls (from official skill)
1. **`actor` without `persistent`** — Error M0220. All actors MUST be `persistent actor`.
2. **Type declarations before actor** — Error M0141. All types/lets/vars must be inside the actor body.
3. **`stable var`** — Warning M0218 in persistent actors. Redundant. Remove it.
4. **`HashMap`/`Buffer`/`TrieMap`** — These are NOT in `mo:core` and are NOT stable. Use `Map`/`List`/`Set`.
5. **`let x = 0; x := 1`** — `let` is immutable. Use `var x = 0` for mutable values.
6. **Shared function parameters** — Must be shared types. No closures, no `var` fields, no `async*`.
7. **Switch without full coverage** — Error M0145. Must cover all variants or use wildcard `case (_)`.

### Canister architecture (this project)
```motoko
// main.mo is COMPOSITION ONLY — no business logic here
persistent actor {
  include MarketplaceMixin();
  include EscrowMixin();
  // etc.
};

// Business logic goes in src/backend/lib/ modules
// Types go in src/backend/types.mo
```

---

## SKILL REFERENCE: stable-memory

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/stable-memory/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill stable-memory`
**Category**: Architecture
**Compatibility**: icp-cli >= 0.2.2

### When to use in this project
- All canister state (listings, users, trades, escrow) must survive upgrades
- Adding new fields to existing record types
- Debugging "data lost after upgrade" issues

### Motoko: everything in `persistent actor` is automatically stable
```motoko
persistent actor {
  // All of these survive upgrades with ZERO extra code:
  let listings = Map.empty<Nat, Listing>();  // survives
  var nextId : Nat = 0;                       // survives

  // This RESETS on every upgrade (intentional):
  transient var cacheHits : Nat = 0;
}
```

### Critical pitfalls (from official skill)
1. **`stable var` in persistent actor** — Warning M0218. Remove it — everything is already stable.
2. **`preupgrade`/`postupgrade`** — NOT needed with `persistent actor`. Do not add them.
3. **`mo:base` collections** — `HashMap`/`TrieMap` contain closures and are NOT stable. Will trap on upgrade.
4. **Changing field types between upgrades** — TRAPS on upgrade, data unrecoverable. Only ADD new optional fields. Never rename or remove.
5. **`actor {}` vs `persistent actor {}`** — Plain `actor` requires manual `stable` annotations. Always use `persistent actor`.

### Schema evolution rules for this project
```motoko
// SAFE — add optional fields only
type Listing_v2 = {
  // ...all v1 fields unchanged...
  description : Text;       // existing
  newField : ?Text;          // NEW — must be optional (?)
};

// NEVER — do not rename, remove, or change types
// type OldField was renamed → BREAKS upgrade
// type Price was Nat, now Float → BREAKS upgrade
```

---

## SKILL REFERENCE: https-outcalls

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/https-outcalls/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill https-outcalls`
**Category**: Integration
**Compatibility**: icp-cli >= 0.2.2

### When to use in this project
- Nova Poshta API — shipping rates, waybill creation, tracking
- Ukrposhta API — shipping rates, waybill creation, tracking
- Meest Express API — shipping rates, waybill creation, tracking
- Cross-chain payment verification (TronGrid, BSCScan, Solana RPC)
- Price oracle feeds (crypto rates)
- **NEVER call these APIs from the React frontend** — always route through canister HTTPS outcalls

### Motoko implementation pattern
```motoko
import IC "ic:aaaaa-aa";
import Call "mo:ic/Call";  // auto-attaches required cycles

// Transform MUST be shared query — strips non-deterministic headers for consensus
public query func transform({
  context : Blob;
  response : IC.http_request_result;
}) : async IC.http_request_result {
  { response with headers = [] };  // strip ALL headers
};

public func callShippingAPI(trackingNumber : Text) : async Text {
  let request : IC.http_request_args = {
    url = "https://api.novaposhta.ua/v2.0/json/";
    max_response_bytes = ?(50_000 : Nat64);  // ALWAYS set — default charges for 2MB
    headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "User-Agent"; value = "ic-canister" },
    ];
    body = ?Text.encodeUtf8("{\"trackingNumber\":\"" # trackingNumber # "\"}");
    method = #post;
    transform = ?{ function = transform; context = Blob.fromArray([]) };
    is_replicated = null;
  };
  let response = await Call.httpRequest(request);  // cycles attached automatically
  switch (Text.decodeUtf8(response.body)) {
    case (?text) text;
    case null "invalid UTF-8 response";
  };
};
```

### Critical pitfalls (from official skill)
1. **No transform function** — Consensus FAILS. Non-deterministic headers/body differ between 13 replicas.
2. **No cycles attached** — Call fails immediately. Use `Call.httpRequest` (Motoko) or `ic_cdk::management_canister::http_request` (Rust) — both attach cycles automatically.
3. **HTTP instead of HTTPS** — Only HTTPS is supported. Plain HTTP URLs are rejected.
4. **No `max_response_bytes`** — Defaults to 2MB, charges ~21.5B cycles. Always set a realistic limit.
5. **POST without idempotency key** — 13 replicas make 13 identical POST requests. Include `Idempotency-Key` header.
6. **Private/localhost IPs** — Blocked. Only public internet endpoints work.

### Dependencies
```toml
# mops.toml
[dependencies]
core = "2.3.1"
ic = "2.1.0"  # provides mo:ic/Call with auto-cycle-attach
```

---

## SKILL REFERENCE: canister-security

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/canister-security/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill canister-security`
**Category**: Security

### When to use in this project
- Every public update function in every canister
- Escrow operations (reentrancy prevention is critical for financial operations)
- Admin functions (listing moderation, dispute resolution)
- Any function that modifies user balances or trade state

### Mandatory patterns for ALL update functions
```motoko
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

shared(msg) persistent actor class MyCanister() {
  transient let owner = msg.caller;

  // 1. ALWAYS reject anonymous callers
  func requireAuthenticated(caller : Principal) {
    if (Principal.isAnonymous(caller)) {
      Runtime.trap("anonymous caller not allowed");
    };
  };

  // 2. Rate limiting (per-principal)
  let requestCounts = Map.empty<Principal, Nat>();
  let MAX_REQUESTS : Nat = 100;

  // 3. Input validation BEFORE any processing
  func validateListing(title : Text, price : Nat) {
    assert(title.size() > 0 and title.size() <= 200);
    assert(price > 0);
  };

  // Every public update:
  public shared ({ caller }) func createListing(title : Text, price : Nat) : async Nat {
    requireAuthenticated(caller);
    validateListing(title, price);
    // ... logic
  };
};
```

### Reentrancy prevention (CRITICAL for escrow)
```motoko
// CallerGuard pattern — use for ANY function that makes inter-canister calls
let pendingOps = Map.empty<Principal, Bool>();

func acquireGuard(caller : Principal) : Result.Result<(), Text> {
  if (Map.get(pendingOps, Principal.compare, caller) != null) {
    return #err("operation already in progress");
  };
  Map.add(pendingOps, Principal.compare, caller, true);
  #ok;
};

func releaseGuard(caller : Principal) {
  ignore Map.delete(pendingOps, Principal.compare, caller);
};

public shared ({ caller }) func releaseEscrow(tradeId : Nat) : async Result.Result<(), Text> {
  requireAuthenticated(caller);
  switch (acquireGuard(caller)) {
    case (#err(e)) return #err(e);
    case (#ok) {};
  };
  try {
    let result = await tokenLedger.transfer(/* ... */);
    #ok
  } catch (e) {
    #err("transfer failed: " # Error.message(e))
  } finally {
    releaseGuard(caller);  // ALWAYS released, even on trap
  };
};
```

### Critical pitfalls (from official skill)
1. **`canister_inspect_message` is NOT a security boundary** — Runs on one replica, bypassed for inter-canister calls. Always duplicate checks inside the method.
2. **TOCTOU between await points** — State can change between `await` calls. Use CallerGuard for all escrow/financial operations.
3. **`trapping in pre_upgrade`** — Makes canister permanently non-upgradeable. Use `persistent actor` to avoid manual upgrade hooks.
4. **`fetchRootKey()` on mainnet** — MITM vulnerability. Never call it in production.
5. **Unbounded user storage** — Always enforce per-user storage quotas to prevent DoS.

---

## SKILL REFERENCE: https-outcalls (evm-rpc variant)

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/evm-rpc/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill evm-rpc`
**Category**: Integration

### When to use in this project
- Verifying USDT/USDC transactions on Ethereum (ERC20)
- Verifying USDT/USDC transactions on Polygon
- Verifying USDT/USDC transactions on Avalanche
- Verifying USDT/USDC transactions on Arbitrum, Base, Optimism
- **Note**: For TRC20 (Tron) and BEP20 (BSC) verification, use `https-outcalls` directly (TronGrid/BSCScan are not EVM RPC canister providers)

### EVM RPC Canister ID
```
Mainnet: 7hfb6-caaaa-aaaar-qadga-cai
Subnet:  34-node fiduciary
```

### Supported chains
| Chain | RpcServices Variant |
|---|---|
| Ethereum Mainnet | `RpcServices::EthMainnet` |
| Arbitrum One | `RpcServices::ArbitrumOne` |
| Base Mainnet | `RpcServices::BaseMainnet` |
| Optimism Mainnet | `RpcServices::OptimismMainnet` |
| Polygon, Avalanche | `RpcServices::Custom { ... }` |

### Critical pitfalls (from official skill)
1. **Default `Equality` consensus fails for `Latest` block** — Providers are 1-2 blocks apart. Use `Threshold { total: Some(3), min: 2 }`.
2. **`Inconsistent` result variant** — Always handle both `Consistent` and `Inconsistent` arms.
3. **Must sign transactions yourself** — EVM RPC canister does NOT sign. Use threshold ECDSA (IC management canister) to sign first.
4. **Cycle costs** — Send 10B cycles minimum. Unused cycles are refunded.

---

## SKILL REFERENCE: icrc-ledger

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/icrc-ledger/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill icrc-ledger`
**Category**: Tokens

### When to use in this project
- Phase 3: ICRC-1 token transfers for on-chain escrow
- Reading balances of ICP-native tokens (ckUSDC, ckUSDT)
- ICRC-2 approve/transferFrom for escrow locking pattern

### Key canister IDs (mainnet)
| Token | Ledger Canister ID | Decimals |
|---|---|---|
| ICP | `ryjl3-tyaaa-aaaaa-aaaba-cai` | 8 |
| ckBTC | `mxzaz-hqaaa-aaaar-qaada-cai` | 8 |
| ckETH | `ss2fx-dyaaa-aaaar-qacoq-cai` | 18 |

### Critical pitfalls (from official skill)
1. **Each ledger has its own fee** — Never hardcode a fee value. Always call `icrc1_fee` first. Handle `BadFee { expected_fee }` errors.
2. **ICRC-2 requires approve first** — `transferFrom` will fail with `InsufficientAllowance` without prior `approve`.
3. **Account format** — `{ owner: Principal; subaccount: ?Blob }`, NOT just a Principal.
4. **Include `created_at_time`** — Without it, duplicate transfers can both execute within 24h.
5. **Never from frontend** — All token transfers must originate from backend canisters.

---

## SKILL REFERENCE: multi-canister

**Skill URL**: https://skills.internetcomputer.org/.well-known/skills/multi-canister/SKILL.md
**Load**: `npx skills add dfinity/icskills --skill multi-canister`
**Category**: Architecture

### When to use in this project
- Inter-canister calls between marketplace, escrow, reputation, messaging canisters
- Actor references in Motoko
- Designing message flow for trade lifecycle

### Canister architecture for this project
| Canister | Responsibility |
|---|---|
| `marketplace_canister` | Listings CRUD, search, categories, status state machine |
| `escrow_canister` | HTLC atomic swap, fund locking/release/refund |
| `identity_canister` | Principal-to-profile mapping, KYC tier |
| `reputation_canister` | Buyer/seller scores, reviews |
| `messaging_canister` | P2P chat threads linked to trades |
| `oracle_canister` | Price feeds via HTTPS outcalls |
| `shipping_canister` | Nova Poshta / Ukrposhta / Meest via HTTPS outcalls |
| `dispute_canister` | Dispute filing, evidence, moderator resolution |

### Inter-canister call pattern
```motoko
// Always handle errors from inter-canister calls
let result = await escrowCanister.lockFunds(tradeId, amount, token);
switch (result) {
  case (#ok(_)) { /* continue */ };
  case (#err(e)) { Runtime.trap("escrow lock failed: " # e) };
};
```

### Critical pitfalls (from official skill)
1. **2MB payload limit** — Inter-canister messages cannot exceed 2MB.
2. **Never hardcode canister IDs** — Load from environment config or `Runtime.envVar`.
3. **Async safety** — State can change between `await` calls. Use CallerGuard (see canister-security).
4. **Unbounded wait** — Calls to buggy canisters can hang forever, blocking upgrades. Use bounded-wait patterns.

---

## Project-Specific Anti-Patterns

These WILL cause build failures or security issues:

| Anti-Pattern | Why Wrong | Correct Alternative |
|---|---|---|
| `actor { }` without `persistent` | Error M0220 | `persistent actor { }` |
| `stable var x` in persistent actor | Warning M0218 | `var x` (implicit stable) |
| `import "mo:base/HashMap"` | Not in mo:core, not stable | `import Map "mo:core/Map"` |
| `preupgrade`/`postupgrade` hooks | Not needed, traps if oversized | `persistent actor` handles it |
| `.put()` / `.delete()` on Maps | Wrong API — mo:core uses `.add()`/`.remove()` | `Map.add()`, `Map.remove()` |
| `List.add(list, item)` style | Old API — use dot notation | `List.add(list, item)` ← actually correct; see note |
| Fiat payments, Stripe, PayPal | Not supported | Stablecoins only (USDT/USDC) |
| Firebase, Google OAuth, email/password | Not supported | Internet Identity only |
| `fetchRootKey()` in production | MITM vulnerability | Use `ic_env` cookie |
| HTTP (not HTTPS) outcalls | Blocked by IC | Use HTTPS endpoints only |
| Calling shipping APIs from React frontend | Bypasses consensus | Route through canister HTTPS outcalls |
| Hardcoded canister IDs | Breaks across environments | Load from `env.json` / `Runtime.envVar` |
| `CANISTER_ID_BACKEND` as build-time variable | Not injected by platform | Read from `env.json` at runtime |
| Non-stablecoin crypto payments (BTC, ETH, ICP) | User requirement violation | USDT/USDC on TRC20/BEP20/ERC20/SPL/Polygon/Avalanche only |
| Business logic in `main.mo` | Violates architecture | Logic goes in `lib/` modules |

---

## Verified Project Commands

### Backend (run from `src/backend/`)
```bash
mops install          # Install Motoko dependencies
mops check --fix      # Type-check and auto-fix warnings
mops build            # Compile canisters
```

### Frontend (run from `src/frontend/`)
```bash
pnpm install --prefer-offline
pnpm typecheck        # TypeScript type check
pnpm fix              # Lint and auto-fix
pnpm build            # Production build
```

### Integration (run from project root)
```bash
pnpm bindgen          # Regenerate TS bindings from .did files — MANDATORY after any Motoko interface change
```

---

## Motoko Code Quality Checklist

Before submitting ANY Motoko code, verify every item:

- [ ] All actors declared as `persistent actor` (not plain `actor`)
- [ ] All imports use `mo:core/*`, never `mo:base/*`
- [ ] No `stable` keyword on variables (implicit in persistent actor)
- [ ] No `preupgrade`/`postupgrade` functions
- [ ] Dot notation for all collection operations (`Map.add(m, ...)` not `m.put(...)`)
- [ ] All public update functions assert non-anonymous caller
- [ ] All user inputs validated before processing
- [ ] No business logic in `main.mo` — only state wiring and mixin includes
- [ ] Public API types use only shared types (no `var` fields, no collections in return types)
- [ ] `pnpm bindgen` scheduled after any public function signature changes
- [ ] `CertifiedData.set()` receives exactly 32 binary bytes (not UTF-8 encoded text)
- [ ] HTTPS outcall transform function strips all non-deterministic headers
- [ ] Inter-canister calls use CallerGuard for financial/state-mutating operations
