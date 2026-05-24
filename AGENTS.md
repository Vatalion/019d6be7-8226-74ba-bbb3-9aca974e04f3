# Project Guidance

## BMAD planning (canonical)

Product and architecture truth lives under **`_bmad-output/planning-artifacts/`** — start with [docs/bmad/README.md](docs/bmad/README.md).

| Doc | Use when |
|-----|----------|
| [product-brief.md](_bmad-output/planning-artifacts/product-brief.md) | Vision, constraints |
| [prd.md](_bmad-output/planning-artifacts/prd.md) | Requirements |
| [epics.md](_bmad-output/planning-artifacts/epics.md) | What to build next |
| [_bmad-output/implementation-artifacts/stories/index.md](_bmad-output/implementation-artifacts/stories/index.md) | BMAD user stories (full) |
| [gap-analysis.md](_bmad-output/planning-artifacts/gap-analysis.md) | Drift / course correction |
| [implementation-readiness.md](_bmad-output/planning-artifacts/implementation-readiness.md) | Pre-sprint gate |

`BACKLOG.md` and unchecked `ROADMAP.md` items are **historical** unless cross-checked with epics.

**Execution status and feature truth:** use [epics.md](_bmad-output/planning-artifacts/epics.md) and [traceability-matrix.md](_bmad-output/planning-artifacts/traceability-matrix.md) — not the table below. Code may exist for product-deferred surfaces (vault, jury, carriers).

## Current State

Use [epics.md](_bmad-output/planning-artifacts/epics.md), [traceability-matrix.md](_bmad-output/planning-artifacts/traceability-matrix.md), and current Caffeine verification output for live/draft status. Do not rely on stale draft numbers in docs.

---

## User Preferences

- Buyer-facing token catalog is exactly four stablecoin options: USDT TRC20, USDT BEP20, USDT ERC20, and USDC ERC20. Wave 1 implementation enables manual settlement only for USDT TRC20 + USDT BEP20 per D-002; ERC20 manual enablement is Wave 3 (E4.S8/D-044). Broader backend enums, vault helpers, and ckUSDC/ckUSDT escrow paths are product-deferred and must not be exposed as normal payment methods without owner approval/Gate C.
- Shipping integrations (Nova Poshta, Ukrposhta, Meest Express) must use HTTPS outcalls from Motoko canisters — never call shipping APIs directly from the React frontend
- All agents must load relevant ICP skills BEFORE implementing any ICP-related feature
- Full skills reference: `/ICP-SKILLS.md` (rebuilt from official sources 2026-04-14)

## Delivery Scope For Phase 1.5

The historical 2026-05-09 pickup-only UI lock is superseded for the Phase 1.5 implementation plan by the owner-approved User Product Contract: physical delivery is **Nova Poshta only** (E7.S3/D-012), while self-pickup/meetup remain hidden and product-deferred (E7.S1/D-045).

When implementing E7.S3:

- re-enable only Nova Poshta as the selectable/default physical carrier in listing creation, listing detail purchase flow, marketplace filters, and checkout-like UI;
- do not restore Ukrposhta, Meest, self-pickup, or meetup as user-facing options without a new owner decision;
- do not re-enable package-dimension forms, sender branch/PUDO selectors, carrier rate comparison, or carrier config toggles in the listing creation flow;
- non-digital listing create/update payloads must use Nova Poshta carrier config once E7.S3 ships; before E7.S3 is implemented, keep the current guard in place and do not claim Phase 1.5 shipping is live;
- keep backend shipping modules intact unless explicitly instructed otherwise, because this is a temporary frontend/product lock, not a request to delete the shipping infrastructure;
- the source-of-truth frontend guard is `src/frontend/src/lib/deliveryPolicy.ts`; E7.S3 is the owner-approved instruction to flip the physical delivery policy from pickup-only to Nova Poshta-only.

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

### Critical: object-storage (Caffeine platform protocol)

**Backend:** `_immutableObjectStorageCreateCertificate` must return `{ method = "upload"; blob_hash = hash }` on an **update** call. Do **not** use `CertifiedData.set()` for uploads — that legacy path causes `403 Invalid payload` on `blob.caffeine.ai`. Prefer `include MixinObjectStorage()` from `mo:caffeineai-object-storage` on Caffeine when available; this repo vendors the same certificate shape in `mixins/object-storage-api.mo`.

**Frontend:** `@caffeineai/object-storage` `StorageClient` + patch `getCertificate` to pass Internet Identity on `agent.call`. Load `backend_canister_id` and `project_id` from `/env.json` at runtime.

When `blob.caffeine.ai` returns `403 Forbidden: Invalid payload`, verify:

1. Live deployment (not preview/draft hostname) and signed-in Internet Identity
2. `env.json` has real `backend_canister_id` and `project_id` (no `__PLACEHOLDER__`)
3. `HttpAgent` host is `https://icp-api.io`
4. Backend includes official `MixinObjectStorage`, not legacy `CertifiedData` certificate code
5. Storage payment account has cycles budget (Cashier / `icfs cashier payment-account balance`)

### Critical: "Expected v3 response body" root cause

- Wrong `HttpAgent` host or canister id
- Anonymous identity on certificate call
- Preview deployment (object-storage not wired on draft URLs)

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
