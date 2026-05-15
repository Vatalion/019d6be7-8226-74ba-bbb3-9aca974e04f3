# Project Guidance

## Current State

**Draft v64** | Live v43 | 16 of 16 workstreams complete

---

## Features Implemented

All features below are implemented in the canister backend and reflected in the frontend. All builds are draft-only — no live deployment since v43.

| Feature | Module(s) | Status |
|---|---|---|
| Vault address derivation (base58 Solana, base58check Tron) | `Vault.mo`, `Base58.mo`, `vault-api.mo` | ✅ Complete |
| Price oracle — CoinGecko integration with 5-min cache | `Payments.mo`, `payments-api.mo` | ✅ Complete |
| Reputation gates — progressive trade limits (3 tiers: $1k/$5k/$100k) | `Reputation.mo`, `reputation-api.mo` | ✅ Complete |
| Multi-carrier shipping — Nova Poshta, Ukrposhta, Meest with trade-scoped TTN creation, retry logic, branch/PUDO lookup | `Shipping.mo`, `shipping-api.mo` | ✅ Complete |
| Unified tracking timeline with auto-refresh (30s polling) | `shipping-api.mo`, `ShippingTracker.tsx` | ✅ Complete |
| Digital goods atomic delivery with 24h inspection period and dispute protection | `Escrow.mo`, `escrow-api.mo`, `types.mo` | ✅ Complete |
| Dispute jury consensus with 72h timelock and auto-resolution; admin escalation on tie/timeout | `Disputes.mo`, `disputes-api.mo` | ✅ Complete |
| Global liability tracking and cross-collateral seizure | `Reputation.mo`, `escrow-api.mo` | ✅ Complete |
| Payment method UX — clipboard detection, QR scanner, contextual hints per network | `WalletQRScanner.tsx` | ✅ Complete |
| Crypto address verification Level 2 — on-chain RPC checks via HTTPS outcalls (BSCScan/Etherscan/PolygonScan/TronGrid/Solana RPC), 24h cache | `payments-api.mo`, `backend.d.ts` | ✅ Complete |
| Real-time notifications — toasts, badge counters, deadline warnings (30s polling) | `NotificationContext.tsx`, `messaging-api.mo` | ✅ Complete |
| Cascading location picker (oblast → city) + stablecoin network selection dialog | `CascadingLocationPicker.tsx`, `NetworkSelectionDialog.tsx` | ✅ Complete |
| Admin observability dashboard — P95 latency, volume graphs, canister health, alert thresholds | `Observability.mo`, `admin-api.mo`, `Phase2MetricsPanel.tsx` | ✅ Complete |
| Security hardening — anonymous guards on all update endpoints, rate limits (4 endpoints), reentrancy guard on escrow, enhanced input validation | `Auth.mo`, `RateLimiter.mo`, `Escrow.mo`, all mixins | ✅ Complete |

---

## User Preferences

- Payments support stablecoins only across all major blockchains: USDT and USDC on TRC20 (Tron), BEP20 (BSC), ERC20 (Ethereum), SPL (Solana), Polygon, Avalanche — no ICP-native tokens (ckBTC, ICP) in payment methods
- Shipping integrations (Nova Poshta, Ukrposhta, Meest Express) must use HTTPS outcalls from Motoko canisters — never call shipping APIs directly from the React frontend
- All agents must load relevant ICP skills BEFORE implementing any ICP-related feature
- Full skills reference: `/ICP-SKILLS.md` (rebuilt from official sources 2026-04-14)

## Temporary Delivery UI Lock

Effective 2026-05-09, all physical delivery carrier options are intentionally disabled in the user interface. The only active physical fulfillment method is `ShippingCarrier.self_pickup`.

Until the project owner explicitly asks to re-enable delivery integrations:

- do not restore Nova Poshta, Ukrposhta, or Meest as selectable options in listing creation, listing detail purchase flow, marketplace filters, or checkout-like UI;
- do not re-enable package-dimension forms, sender branch/PUDO selectors, carrier rate comparison, or carrier config toggles in the listing creation flow;
- non-digital listing create/update payloads must continue to use `self_pickup` and must send `null` carrier configs for Nova Poshta, Ukrposhta, and Meest;
- keep backend shipping modules intact unless explicitly instructed otherwise, because this is a temporary frontend/product lock, not a request to delete the shipping infrastructure;
- the source-of-truth frontend guard is `src/frontend/src/lib/deliveryPolicy.ts`; leave `PHYSICAL_DELIVERY_LOCKED_TO_PICKUP` enabled unless the owner gives a new instruction.

---

## ICP Skills — Mandatory Usage Protocol

**BEFORE implementing ANY ICP functionality:**

1. Identify which skill(s) apply from the table below
2. Load the skill via ONE of these methods:
   - `npx skills add dfinity/icskills --skill <name>`
   - Fetch directly: `GET <url from /ICP-SKILLS.md>`
   - Official index: `GET https://skills.internetcomputer.org/.well-known/skills/index.json`
3. **READ the skill content completely before writing code**
4. **Follow skill guidance OVER general LLM knowledge** — skills contain real dependency versions, real API signatures, and real pitfalls that prevent build failures

### Task → Skills mapping

| When you are implementing... | Load these skills | Notes |
|---|---|---|
| ANY Motoko backend code | `motoko` | Always load first for any `.mo` file |
| Canister state / persistence / upgrades | `stable-memory` | Covers `persistent actor`, `transient var`, schema evolution |
| CertifiedData, `_immutableObjectStorageCreateCertificate` | `certified-variables` | **MOST CRITICAL** — directly controls whether object-storage returns 403 |
| Object storage / file uploads / photos | `certified-variables` + read `@caffeineai/object-storage` source | The library calls your canister before every upload |
| Login / Internet Identity / principal / session | `internet-identity` | Only auth method in this project |
| Canister access control / guards / rate limiting | `canister-security` | Mandatory for every public update function |
| Escrow operations / fund locking | `canister-security` | CallerGuard pattern prevents reentrancy exploits |
| External HTTP calls (shipping APIs, price oracles) | `https-outcalls` | Transform function required for consensus |
| Verifying ERC20/Polygon/Avalanche transactions | `evm-rpc` | EVM RPC canister `7hfb6-caaaa-aaaar-qadga-cai` |
| Verifying TRC20/BEP20 transactions | `https-outcalls` | Use TronGrid / BSCScan via direct HTTPS outcalls |
| ICRC-1 token transfers / balances | `icrc-ledger` | Phase 3 on-chain escrow |
| Multiple canisters calling each other | `multi-canister` | Inter-canister async patterns |
| Frontend asset hosting / SPA routing | `asset-canister` | Static file serving on IC |
| Custom domain configuration | `custom-domains` | DNS + TLS setup |
| Cycle balance / canister freezing | `cycles-management` | Monitor and top up |
| On-chain encryption | `vetkd` | Secret data, private keys |
| Wallet integration (non-II) | `wallet-integration` | ICRC signer standards |

### Critical: object-storage 403 fix checklist

When the `blob.caffeine.ai` gateway returns `403 Forbidden: Invalid payload`, verify all of these:

1. **Load `certified-variables` skill** — read the full content before changing any code
2. **`_immutableObjectStorageCreateCertificate(hash)` exists in backend** — the method MUST be present and public
3. **Hash is hex-decoded before `CertifiedData.set()`** — the `hash` parameter arrives as `"sha256:<64 hex chars>"`. You MUST strip the `"sha256:"` prefix, then hex-decode the 64 hex characters into exactly 32 binary bytes. Passing the raw string as UTF-8 bytes gives ~71 bytes which gets truncated to 32 garbage bytes → gateway always rejects.
4. **Function is `async` (update), not `query`** — `CertifiedData.set()` CANNOT be called in a query. It traps.
5. **`backend_canister_id` reads from `env.json` at runtime** — NOT from a build-time variable (`CANISTER_ID_BACKEND` is never injected by the platform). Read from `env.json` with `cache: 'no-store'`.
6. **`HttpAgent` host is `https://icp-api.io`** on mainnet — if it points to a placeholder like `__BACKEND_HOST__`, the agent connects to the wrong host and returns "Expected v3 response body".
7. **Identity is passed before any `StorageClient` call** — Anonymous `HttpAgent` cannot receive a v3 certified response.
8. **No placeholder values in `env.json`** — `project_id` and `backend_canister_id` must be real UUIDs/principal strings, not `__CAFFEINE_PROJECT_ID__` or `nogateway`.

### Critical: "Expected v3 response body" root cause

This error from `@caffeineai/object-storage` means one of:
- The `HttpAgent` is connecting to the wrong canister or wrong host
- The canister method does NOT call `CertifiedData.set()` (so IC attaches no v3 certificate)
- The agent is anonymous (no identity) — anonymous agents cannot receive certified responses
- The canister is running in preview (object-storage is NOT connected in preview environments — test on live only)

---

## Frontend Configuration Rules

- `backend_canister_id` — ALWAYS read from `/env.json` at runtime using `fetch('/env.json', {cache:'no-store'})`. Never from `import.meta.env.VITE_*` or `process.env.*` — these build-time variables are NOT set by the Caffeine platform.
- `project_id` — Same. Always from `env.json`, never hardcoded.
- `HttpAgent` host — `https://icp-api.io` on mainnet. Detect via `window.location.hostname !== 'localhost'`.
- Internet Identity provider — `https://id.ai` on mainnet, `http://id.ai.localhost:8000` locally.

---

## QA Mandate

Before reporting ANY feature as complete:

1. Test the ENTIRE feature flow end-to-end (not just the specific changed line)
2. For photo upload: test file selection → upload progress → success state → publishing the listing
3. Report exact error messages from Console, not assumptions
4. If testing in **preview**: note that object-storage does NOT work in preview — test on live only
5. If publishing costs credits: thoroughly verify in preview first, deploy only when confident

---

## Prohibited Patterns (will be rejected)

| Pattern | Reason |
|---|---|
| Flutter, Dart, React Native | This is a web app only |
| Firebase, Supabase, Auth0, Google OAuth | Internet Identity only |
| Email/password authentication | Internet Identity only |
| GitHub Actions / CI/CD workflows | Not applicable |
| Fiat payments, Stripe, PayPal, bank transfers | Stablecoins only |
| BTC, ETH, ICP as payment methods | Stablecoins only (USDT/USDC) |
| `mo:base/*` imports | Use `mo:core/*` only |
| `stable var` in persistent actors | Redundant, causes warnings |
| `preupgrade`/`postupgrade` hooks | Not needed with persistent actor |
| `HashMap`, `Buffer`, `TrieMap` | Not stable, not in mo:core |
| Hardcoded canister IDs in source code | Load from env.json / Runtime.envVar |
| `CANISTER_ID_BACKEND` as build-time env | Not injected by platform |
| Calling shipping APIs from React | Route through canister HTTPS outcalls |
| `fetchRootKey()` in production | MITM vulnerability |
