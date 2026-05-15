# CryptoMarket P2P — Security Audit Reference

> **Audience:** External security auditors.  
> **Purpose:** Comprehensive catalogue of all canister modules, public endpoints, access controls, external dependencies, and known attack surface for CryptoMarket P2P.  
> **Canister runtime:** Internet Computer (ICP). All logic executes inside a single actor canister using an orthogonal-persistence data model (no databases, no file system). State persists across upgrades via enhanced orthogonal persistence.

---

## Table of Contents

1. [Module Inventory](#1-module-inventory)
2. [Public API Access Matrix](#2-public-api-access-matrix)
3. [Access Control Boundaries](#3-access-control-boundaries)
4. [External Dependencies](#4-external-dependencies)
5. [Known Attack Surface](#5-known-attack-surface)
6. [Threshold ECDSA Security](#6-threshold-ecdsa-security)
7. [Data Privacy](#7-data-privacy)

---

## 1. Module Inventory

All modules live under `src/backend/`. The canister is composed in `main.mo` by including domain mixins. Domain logic lives in `lib/`, public API surfaces live in `mixins/`.

| Module | File | Responsibility | Public endpoints | Stable state variables | External HTTP calls |
|--------|------|----------------|-----------------|------------------------|---------------------|
| **Auth** | `lib/Auth.mo` | Principal validation, RBAC helpers, ban/suspension checks, user upsert, input validation | — (library only) | — | No |
| **Auth API** | `mixins/auth-api.mo` | Profile creation, profile retrieval | 3 | `users`, `rateLimitState` | No |
| **Marketplace** | `lib/Marketplace.mo` | Listing creation, updates, deactivation, search, expiry, admin removal | — (library only) | — | No |
| **Marketplace API** | `mixins/marketplace-api.mo` | Listing CRUD, search, view counting | 9 | `listings`, `users`, `spamTracker`, `nextListingId` | No |
| **Escrow** | `lib/Escrow.mo` | P2P trade state machine, cancellation, refund logic, timeout enforcement | — (library only) | — | No |
| **Escrow API** | `mixins/escrow-api.mo` | Trade initiation, payment confirmation, refund, cancel, payment verification | 9 | `users`, `listings`, `trades`, `cancelProposals`, `nextTradeId` | No (delegates to Payments API for blockchain checks) |
| **Payments** | `lib/Payments.mo` | Token metadata, amount formatting, transaction history, blockchain URL builders, JSON response parsers, rate-limit helpers | — (library only) | — | No |
| **Payments API** | `mixins/payments-api.mo` | HTTPS outcalls to TronGrid, BSCScan, Solana RPC; token queries; transaction history; payment verification | 8 | `trades`, `systemSettings`, `rateLimitVerify`, `paymentErrorLog` | **Yes** (TronGrid, BSCScan, Solana RPC, Infura) |
| **Reputation** | `lib/Reputation.mo` | Trust-level calculation, score computation, feedback validation, stats aggregation | — (library only) | — | No |
| **Reputation API** | `mixins/reputation-api.mo` | Leave feedback, query received feedback, reputation stats | 4 | `users`, `trades`, `feedbacks`, `userFeedbackIndex`, `nextFeedbackId` | No |
| **Disputes** | `lib/Disputes.mo` | Dispute lifecycle, evidence submission, jury pool, juror assignment, vote tallying, appeal logic | — (library only) | — | No |
| **Disputes API** | `mixins/disputes-api.mo` | Open/resolve/reopen/appeal disputes, juror registration & voting, dispute queries | 13 | `disputes`, `trades`, `users`, `jurors`, `juryMap`, `nextDisputeId` | No |
| **Messaging** | `lib/Messaging.mo` | Per-trade chat threads, unread counters, last-read pointers, moderator access | — (library only) | — | No |
| **Messaging API** | `mixins/messaging-api.mo` | Send/read messages, unread counts, mark-as-read, moderator thread access | 5 | `messages`, `tradeIndex`, `trades`, `users`, `lastReadPtrs`, `nextMessageId` | No |
| **Shipping** | `lib/Shipping.mo` | HTTP request body builders, response parsers, cache helpers, carrier metadata, mock fallback data | — (library only) | — | No |
| **Shipping API** | `mixins/shipping-api.mo` | Calculate shipping costs, create waybills, track shipments across Nova Poshta / Ukrposhta / Meest Express | 8 | `systemSettings`, `shippingCache`, `nextWaybillSeed` | **Yes** (Nova Poshta, Ukrposhta, Meest Express) |
| **Admin** | `lib/Admin.mo` | User moderation, compliance notes, listing moderation, audit log, platform metrics, system settings management | — (library only) | — | No |
| **Admin API** | `mixins/admin-api.mo` | Full admin/moderator control plane: user bans, role changes, compliance notes, audit log, metrics, system settings, API key management, observability | 17 | `users`, `listings`, `trades`, `disputes`, `complianceNotes`, `auditLog`, `systemSettings`, `nextAuditId`, `nextNoteId`, `errorLog`, `moduleMetrics`, `nextErrorId` | No |
| **Observability** | `lib/Observability.mo` | Error ring buffer (cap 1000), module-level call/error counters, Phase 2 KPI metrics, cycle balance monitoring | — (library only) | — | No |
| **RateLimiter** | `lib/RateLimiter.mo` | Sliding-window per-principal rate limiter (default: 10 calls / 60 s) | — (library only) | — | No |
| **Types** | `types.mo` | Canonical type definitions shared across all modules | — | — | No |

**Total public endpoints:** 76 across all API mixins.

---

## 2. Public API Access Matrix

Legend:  
- **Auth required** — anonymous principal (`2vxsx-fae`) is explicitly rejected (traps or returns `#err(#unauthorized)`)  
- **Admin-only** — trapped or rejected unless caller has `#admin` role  
- **Mod+** — requires `#moderator` or `#admin` role  
- **Rate-limited** — subject to per-caller or per-trade sliding-window rate limiter  
- **Inputs validated** — explicit field-length / content validation applied  
- **External HTTP** — performs one or more HTTPS outcalls  

### Auth Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `getMyProfile` | No (query) | No | No | No | No | No |
| `setMyProfile` | **Yes** | No | No | **Yes** (10/60 s) | **Yes** (username ≤64, bio ≤500, avatar ≤512) | No |
| `getUserProfile` | No (query) | No | No | No | No | No |

### Marketplace Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `createListing` | **Yes** | No | No | **Yes** (spam cooldown 60 s/principal) | **Yes** (title ≤200, desc ≤5000, photos ≤10, price > 0) | No |
| `updateListing` | **Yes** | No | No | No | **Yes** (same as create) | No |
| `deactivateListing` | **Yes** | No | No | No | No | No |
| `getListing` | No (query) | No | No | No | No | No |
| `incrementListingView` | No | No | No | No | No | No |
| `searchListings` | No (query) | No | No | No | No | No |
| `getListingsByUser` | No (query) | No | No | No | No | No |
| `getMyListings` | No (query, caller) | No | No | No | No | No |
| `adminRemoveListing` | **Yes** | No | **Yes** | No | **Yes** (reason non-empty) | No |
| `getExpiredListings` | **Yes** | **Yes** | No | No | No | No |

### Escrow Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `initiateTrade` | **Yes** | No | No | No | No (listing status checked) | No |
| `confirmPaymentSent` | **Yes** | No | No | No | No (state machine) | No |
| `confirmPaymentReceived` | **Yes** | No | No | No | No (state machine) | No |
| `requestRefund` | **Yes** | No | No | No | No (deadline enforced) | No |
| `proposeCancelTrade` | **Yes** | No | No | No | No (state machine) | No |
| `checkAndExpireTimeouts` | **Yes** | **Yes** | No | No | No | No |
| `getTrade` | **Yes** (party or admin) | No | No | No | No | No |
| `getMyTrades` | No (anon → empty) | No | No | No | No | No |
| `getTradesByListing` | No (query) | No | No | No | No | No |
| `adminGetAllTrades` | **Yes** | **Yes** | No | No | No | No |
| `verifyTradePayment` | **Yes** | No | No | No | **Yes** (network string validated) | No (delegates) |

### Payments Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `verifyPayment` | **Yes** (buyer only) | No | No | **Yes** (10 calls/5 min/trade) | **Yes** (token, trade status) | **Yes** (TronGrid / BSCScan / Solana RPC) |
| `transformPaymentResponse` | No (query) | No | No | No | No | No |
| `getSupportedTokens` | No (query) | No | No | No | No | No |
| `getTokenInfo` | No (query) | No | No | No | No | No |
| `getMyTransactionHistory` | No (anon → empty) | No | No | No | No | No |
| `getTradePaymentStatus` | No (anon → null) | No | No | No | No | No |
| `getPaymentVerificationStatus` | **Yes** (party only) | No | No | No | No | No |
| `estimateTokenAmount` | No (query) | No | No | No | No | No |

### Reputation Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `leaveFeedback` | **Yes** | No | No | No | **Yes** (rating 1–5, comment ≤500) | No |
| `getMyFeedback` | No (anon → empty) | No | No | No | No | No |
| `getUserFeedback` | No (query) | No | No | No | No | No |
| `getFeedbackForTrade` | No (query) | No | No | No | No | No |
| `getUserReputationStats` | No (query) | No | No | No | No | No |

### Disputes Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `openDispute` | **Yes** | No | No | No | **Yes** (trade state, one-per-trade) | No |
| `addEvidence` | **Yes** (party only) | No | No | No | No | No |
| `resolveDispute` | **Yes** | No | **Yes** | No | No | No |
| `addModeratorNote` | **Yes** | No | **Yes** | No | No | No |
| `appealDispute` | **Yes** (party only) | No | No | No | **Yes** (7-day appeal window) | No |
| `reopenDispute` | **Yes** | No | **Yes** | No | **Yes** (7-day window) | No |
| `setDisputeUnderReview` | **Yes** | No | **Yes** | No | No | No |
| `registerAsJuror` | **Yes** | No | No | No | **Yes** (stake ≥10 USDT) | No |
| `unregisterJuror` | **Yes** | No | No | No | **Yes** (no active cases) | No |
| `submitJurorVote` | **Yes** (assigned juror) | No | No | No | **Yes** (one vote/juror/dispute) | No |
| `getDispute` | No (query, mod-notes filtered) | No | No | No | No | No |
| `getDisputesByTrade` | No (query, mod-notes filtered) | No | No | No | No | No |
| `getOpenDisputeQueue` | **Yes** | No | **Yes** | No | No | No |
| `getMyDisputes` | No (query) | No | No | No | No | No |
| `getJuryPool` | **Yes** | No | **Yes** | No | No | No |
| `getMyJurorDashboard` | **Yes** | No | No | No | No | No |
| `getDisputeJurors` | No (votes redacted until resolved) | No | No | No | No | No |

### Messaging Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `sendMessage` | **Yes** (party only) | No | No | No | **Yes** (content 1–2000 chars, attachment non-empty) | No |
| `getTradeMessages` | **Yes** (party or mod on disputed) | No | No | No | No | No |
| `getUnreadCount` | **Yes** | No | No | No | No | No |
| `markTradeAsRead` | **Yes** (party only) | No | No | No | No | No |
| `getModeratorThread` | **Yes** | No | **Yes** (disputed trade only) | No | No | No |

### Shipping Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `calculateShippingCost` | No | No | No | No | No | **Yes** (Nova Poshta, or mock) |
| `createWaybill` | **Yes** | No | No | No | No | **Yes** (Nova Poshta, or mock) |
| `trackShipment` | No | No | No | No | No | **Yes** (Nova Poshta, or mock; cached 5 min) |
| `createUkrPoshtaWaybill` | **Yes** | No | No | No | No | **Yes** (Ukrposhta, or mock) |
| `trackUkrPoshtaShipment` | No | No | No | No | No | **Yes** (Ukrposhta, or mock; cached 5 min) |
| `createMeestWaybill` | **Yes** | No | No | No | No | **Yes** (Meest Express, or mock) |
| `trackMeestShipment` | No | No | No | No | No | **Yes** (Meest Express, or mock; cached 5 min) |
| `getShippingOptions` | No | No | No | No | No | **Yes** (all three carriers, or mocks) |
| `getSupportedCarriers` | No (query) | No | No | No | No | No |

### Admin Domain

| Endpoint | Auth required | Admin-only | Mod+ | Rate-limited | Inputs validated | External HTTP |
|----------|--------------|------------|------|-------------|-----------------|---------------|
| `getAllUsers` | **Yes** | No | **Yes** | No | No | No |
| `suspendUser` | **Yes** | No | **Yes** | No | No | No |
| `banUser` | **Yes** | No | **Yes** | No | No | No |
| `unbanUser` | **Yes** | No | **Yes** | No | No | No |
| `promoteToModerator` | **Yes** | **Yes** | No | No | No | No |
| `demoteFromModerator` | **Yes** | **Yes** | No | No | No | No |
| `getComplianceNotes` | **Yes** | No | **Yes** | No | No | No |
| `addComplianceNote` | **Yes** | No | **Yes** | No | No | No |
| `removeListingByAdmin` | **Yes** | No | **Yes** | No | No | No |
| `getPlatformMetrics` | No (query) | No | No | No | No | No |
| `getAuditLog` | **Yes** | No | **Yes** | No | No | No |
| `getSystemSettings` | **Yes** | No | **Yes** | No | No | No |
| `updateSystemSettings` | **Yes** | **Yes** | No | No | **Yes** (allowedTokens non-empty) | No |
| `setNovaPoshtaApiKey` | **Yes** | **Yes** | No | No | **Yes** (non-empty) | No |
| `setUkrPoshtaApiKey` | **Yes** | **Yes** | No | No | **Yes** (non-empty) | No |
| `setMeestApiKey` | **Yes** | **Yes** | No | No | **Yes** (non-empty) | No |
| `getErrorLog` | **Yes** | No | **Yes** | No | No | No |
| `getDashboardMetrics` | **Yes** | No | **Yes** | No | No | No |
| `getModuleMetrics` | **Yes** | No | **Yes** | No | No | No |
| `getCyclesStatus` | **Yes** | **Yes** | No | No | No | No |

---

## 3. Access Control Boundaries

Four distinct roles are enforced at the canister boundary. All role checks happen inside the canister — the frontend is not trusted for access control decisions.

```
Role Hierarchy
──────────────
anonymous
  └─ user (registered principal)
       └─ moderator
            └─ admin
```

### Role Capabilities

| Capability | anonymous | user | moderator | admin |
|-----------|-----------|------|-----------|-------|
| Browse listings & profiles | ✅ | ✅ | ✅ | ✅ |
| Create/edit own listings | ❌ | ✅ | ✅ | ✅ |
| Initiate & manage own trades | ❌ | ✅ | ✅ | ✅ |
| Open dispute on own trade | ❌ | ✅ | ✅ | ✅ |
| Submit juror vote (if assigned) | ❌ | ✅ | ✅ | ✅ |
| Register as juror | ❌ | ✅ | ✅ | ✅ |
| View own feedback & reputation | ❌ | ✅ | ✅ | ✅ |
| Send messages on own trades | ❌ | ✅ | ✅ | ✅ |
| Read moderator chat thread | ❌ | ❌ | ✅ (disputed only) | ✅ |
| Resolve disputes | ❌ | ❌ | ✅ | ✅ |
| Suspend / ban users | ❌ | ❌ | ✅ | ✅ |
| Add compliance notes | ❌ | ❌ | ✅ | ✅ |
| Remove listings | ❌ | ❌ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ✅ | ✅ |
| Read error/observability logs | ❌ | ❌ | ✅ | ✅ |
| View system settings | ❌ | ❌ | ✅ | ✅ |
| Update system settings | ❌ | ❌ | ❌ | ✅ |
| Set API keys (shipping, blockchain) | ❌ | ❌ | ❌ | ✅ |
| Promote / demote moderators | ❌ | ❌ | ❌ | ✅ |
| Get all trades (admin-wide view) | ❌ | ❌ | ❌ | ✅ |
| Expire trade timeouts (batch) | ❌ | ❌ | ❌ | ✅ |
| View cycle balance | ❌ | ❌ | ❌ | ✅ |

### Role Assignment Mechanism

- All new users start with `#user` role on first `setMyProfile` call.
- `#moderator` role is granted by `promoteToModerator` (admin-only endpoint), recorded in audit log.
- `#admin` role is set at canister initialisation or by direct state manipulation during controlled upgrades. There is no on-chain function to elevate a user to `#admin` at runtime — this is intentional.
- Role is stored in the `User` record inside the `users` stable map and is checked on every privileged call.

### Banned / Suspended Users

- Banned users (`isBanned = true`) are blocked from creating listings and calling `setMyProfile`.
- Suspended users (`suspendedUntil > Time.now()`) are rejected at the `assertNotBanned` call site in the Auth library.
- Both states are checked inline — no session token or cookie is used.

---

## 4. External Dependencies

All external HTTP calls are made via the ICP Management Canister `http_request` API (HTTPS outcalls). Each outbound request consumes cycles.

### Payment Verification APIs

| Provider | Endpoint Pattern | Purpose | Data Returned | Token(s) |
|----------|-----------------|---------|---------------|----------|
| **TronGrid** | `https://api.trongrid.io/v1/transactions/{txHash}` | Verify USDT TRC-20 transaction existence and status | `to_address`, `amount`, `blockNumber` | USDT TRC-20 |
| **BSCScan** | `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash={hash}&apikey={key}` | Verify BEP-20 transaction receipt status | `status` (1=success), `blockNumber` | USDT BEP-20 |
| **Solana RPC (mainnet)** | `https://api.mainnet-beta.solana.com` POST `getTransaction` | Verify SPL USDC transaction | `destination`, `uiAmount`, `slot` | USDC SPL |
| **Infura** | `https://mainnet.infura.io/v3/{projectId}` (also polygon-mainnet, avalanche-mainnet) POST `eth_getTransactionReceipt` | Verify ERC-20/Polygon/Avalanche transaction | `to`, `blockNumber`, `status` | USDC/USDT ERC-20, Polygon, Avalanche |

API keys for TronGrid, BSCScan, and Infura are stored in `systemSettings` (admin-managed, not hard-coded). Solana RPC uses the public mainnet endpoint with no API key.

### Shipping Provider APIs

| Provider | Endpoint(s) | Purpose | Auth Method | Data Returned |
|----------|------------|---------|-------------|---------------|
| **Nova Poshta** | `https://api.novaposhta.ua/v2.0/json/` (POST) | Cost calculation, waybill creation, shipment tracking | API key in request body | `Cost`, `IntDocNumber`, `StatusDescription` |
| **Ukrposhta** | `https://www.ukrposhta.ua/ecom/0.0.1/addresses/shipping-price` (POST), `.../shipments` (POST), `.../shipments/{barcode}/statuses` (GET) | Cost estimation, waybill creation, tracking | Bearer token in Authorization header | `deliveryPrice`, `deliveryDays`, `barcode`, `eventName` |
| **Meest Express** | `https://api.meest.com/api/v1/calculate` (POST), `.../order` (POST/GET) | Cost estimation, order creation, tracking | `x-api-key` header | `price`, `delivery_days`, `tracking_number`, `status` |

**Fallback behaviour:** When no real API key is configured for a shipping provider, mock responses are returned immediately (no network call). This applies during development and when keys have not yet been provisioned.

**Tracking cache:** All tracking responses are cached in `shippingCache` (in-canister map) for 5 minutes (`CACHE_TTL_NS = 300_000_000_000`) to reduce HTTPS outcall frequency and cost.

### Cycle Cost per Outcall

Each HTTPS outcall is dispatched with `49_000_000` cycles attached. Maximum response body is capped at `8_000–10_000` bytes per call to limit cycle consumption and response parsing surface.

---

## 5. Known Attack Surface

### 5.1 HTTPS Outcall Response Manipulation

**Risk:** HTTPS outcalls on ICP require consensus across all subnet replicas. If a malicious or manipulated API response returns different data to different replicas, the call will fail (no consensus). This prevents simple MITM injection at the network level.

**Residual risk:** A compromised API provider (e.g., TronGrid, BSCScan) returning a uniformly forged response to all replicas simultaneously would still achieve consensus. An attacker who controls the API endpoint can confirm a non-existent transaction as verified.

**Mitigations in place:**
- `transformPaymentResponse` strips all headers before consensus check — only body participates in consensus, reducing non-determinism surface.
- Verification is restricted to the trade buyer only (`caller == trade.buyer` check).
- The verified state (`#payment_verified`) still requires the seller to independently call `confirmPaymentReceived` before the trade completes. The seller has independent visibility into their wallet.
- BSCScan verification only confirms receipt status (success/fail) — amount and recipient are not confirmed from this endpoint alone (noted as a known limitation in the code).

**Recommendation:** For high-value trades, implement secondary confirmation by requiring both the verified blockchain state and manual seller confirmation. Consider adding a minimum confirmation count parameter to the verification request.

### 5.2 Replay Attack on Escrow State Machine

**Risk:** A buyer could re-submit the same `txHash` for a different trade or reuse a hash from a past trade to advance a new trade's state.

**Mitigations in place:**
- Verification result is stored per `tradeId` in `verificationResults` map. A `txHash` is associated with exactly one trade in storage.
- Trade status transitions are strictly enforced: `verifyPayment` only accepts trades in `#buyer_confirmed` or `#payment_verified` state. A completed (`#complete`) or refunded trade cannot be re-verified.

**Residual risk:** There is no on-chain uniqueness check enforcing that a given `txHash` has not been submitted to a different `tradeId`. An attacker could take a valid transaction hash from trade A and submit it against trade B.

**Recommendation:** Store a global `usedTxHashes : Set<Text>` to enforce single-use of transaction hashes across all trades.

### 5.3 Principal Spoofing

**Risk:** On ICP, every inter-canister call carries the caller's verified `Principal`. Principals cannot be forged at the canister boundary — the ICP protocol enforces this.

**Current posture:** The system never trusts client-supplied identity claims. All access control uses `caller` (injected by the runtime), never a parameter value.

**Residual risk:** If a front-end wallet library or Identity Provider is compromised and signs messages with a different principal, calls would appear to come from that principal. This is a user-side risk, not a canister-side risk.

### 5.4 Rate Limit Bypass

**Risk:** A principal could create many Internet Identity anchors (ICP allows it) to circumvent per-principal rate limits.

**Current rate limiters:**
- `setMyProfile`: 10 calls / 60 s per principal (via `RateLimiter.checkDefault`).
- `createListing`: 60-second spam cooldown per principal (via `spamTracker` map).
- `verifyPayment`: 10 calls / 5 min per `tradeId` (via `rateLimitVerify` map).

**Residual risk:** The listing spam cooldown and profile rate limit are per-principal. A well-resourced attacker with many principals could spam listings. No canister-wide global rate limit exists.

**Recommendation:** Add a global listing creation rate limit (e.g., max listings per time window across all principals) to limit canister state bloat from spam.

### 5.5 DAO / Jury Voting Manipulation

**Risk:** An attacker who controls multiple principals could register all of them as jurors and dominate the jury pool, biasing dispute outcomes.

**Current mitigations:**
- Juror assignment is deterministic (modulo-based seed from `disputeId`) — not random, but not based on attacker-controlled input either.
- Minimum stake requirement of 10 USDT equivalent discourages Sybil juror registration (though stake is currently a `Float` parameter, not an actual on-chain locked deposit).
- Both trade parties are excluded from jury assignment for their own dispute.

**Residual risk:** The `stakedAmount : Float` field is a self-reported value passed as a parameter — there is no actual on-chain token locking verifying the stake. An attacker can register hundreds of jurors by supplying `10.0` as the stake value with no real asset locked.

**Recommendation:** Before Phase 3 launch, implement actual ICRC-1 token locking for juror stake. Until then, the jury mechanism should be treated as advisory only, not as the primary dispute resolution path.

### 5.6 ECDSA Key Derivation Risks

See dedicated [Section 6](#6-threshold-ecdsa-security).

### 5.7 Unrestricted Public Queries on Sensitive Data

**Risk:** `getPlatformMetrics` is callable by anyone (no authentication required), exposing aggregate trade volume, dispute rates, and active user counts.

**Current posture:** Only aggregate statistics are returned — no individual trade or user data is exposed.

**Risk:** `getDisputeJurors` is publicly callable and returns the assigned juror principals for any dispute.

**Recommendation:** Consider restricting `getDisputeJurors` to dispute participants and moderators to prevent targeted juror bribery or coercion.

### 5.8 Shipping API Key Leakage via State Inspection

**Risk:** ICP canisters are transparent: any node provider or entity with full subnet state access can read stable memory, including `systemSettings` which contains plaintext API keys for Nova Poshta, Ukrposhta, Meest Express, TronGrid, BSCScan, and Infura.

**Mitigations in place:**
- API keys are not returned in any public query endpoint. `getSystemSettings` returns only non-secret settings.
- Access to `setNovaPoshtaApiKey` etc. is restricted to admin-only.

**Residual risk:** ICP stable memory is not encrypted at rest at the protocol level. Subnet node providers with low-level access can inspect raw Wasm memory.

**Recommendation:** For production, use ICP's Vetkeys feature (when available) or consider the keys as semi-public and rotate them regularly. Rate-limit all shipping API keys at the provider level.

---

## 6. Threshold ECDSA Security

> **Current status:** Threshold ECDSA (tECDSA) is referenced in the roadmap for Phase 3 cross-chain operations but is **not yet implemented** in the current canister codebase. This section documents the intended architecture and security model for auditor awareness.

### Intended Use Case

Phase 3 will use ICP's threshold ECDSA signing to generate and sign blockchain transactions on external chains (Ethereum, Tron, Solana, etc.) directly from within the canister, enabling fully on-chain multi-chain escrow without custodial intermediaries.

### Key Derivation Model (Planned)

- Each canister derives a deterministic ECDSA key pair via `sign_with_ecdsa` using a **derivation path** that binds the key to the canister's Principal ID.
- Derived keys are never stored in canister memory — they exist only in the distributed key shares held by subnet nodes.
- The derivation path will encode both the canister ID and a per-trade nonce to produce unique signing keys per escrow.

### Security Properties (Planned)

| Property | Mechanism |
|----------|-----------|
| Key availability | Requires ≥ threshold-of-N subnet nodes to sign; no single node can sign independently |
| Canister binding | Derivation path includes canister Principal — keys derived by other canisters are different |
| Non-extractability | Private key shares never leave the nodes in plaintext; signing is a multi-party computation |
| Replay prevention | Each signing request includes a message hash; replaying the same hash produces the same signature (idempotent but not harmful) |

### Current Phase Posture (Phase 1–2)

- No private keys are stored in the canister.
- Payment verification relies on read-only HTTP outcalls (no on-chain signing).
- All escrow state transitions are manual (buyer/seller confirmation) or HTTP-verified.
- External wallet addresses are user-supplied and not canister-controlled.

---

## 7. Data Privacy

### Personally Identifiable Information (PII) Stored

| Data | Location | Visibility | Notes |
|------|----------|------------|-------|
| **Internet Identity Principal** (`UserId`) | `users` map (key) | Public (used in all queries) | Pseudonymous — not directly linkable to real identity without II anchor correlation |
| **Username** | `User.username` | Public (returned in `UserProfile`, `ListingCard`) | User-chosen; no real-name requirement |
| **Bio** | `User.bio` | Public (via `UserProfile`) | Free-text, user-controlled |
| **Avatar URL** | `User.avatarUrl` | Public | URL only — actual image hosted externally |
| **Chat messages** | `messages` map | Per-trade: buyer + seller only; moderators on disputed trades | Content stored in plaintext canister state |
| **Shipping city names** | `shippingCache` (tracking number → status) | Internal (not publicly queryable) | No personal addresses stored; only city-level data |
| **Dispute descriptions & evidence URLs** | `Dispute.description`, `evidenceUrls` | Trade participants + moderators | Plain text; evidence URLs point to externally hosted files |
| **Moderator notes** | `Dispute.moderatorNotes` | Moderator/admin only | Stripped from `DisputeView` for non-moderators |
| **Compliance notes** | `complianceNotes` map | Admin/moderator only | Not exposed to subjects |
| **Audit log** | `auditLog` list | Admin/moderator only | Contains principal IDs of actors and targets |
| **IP addresses / device fingerprints** | Not stored | N/A | ICP canisters do not receive HTTP-level metadata |

### ICP Canister Transparency

All ICP canisters are deployed as Wasm modules on a public subnet. The following are visible to anyone:

- **Candid interface** (public API signatures and types)
- **Canister ID** and cycle balance (queryable via IC management canister)
- **Wasm hash** (verifiable against published source code)
- **Stable memory contents** (accessible to subnet node providers; not to general public)

Canister state (e.g., user records, messages, trades) is not directly readable by the general public via standard IC APIs. It can only be accessed through the canister's own query/update endpoints, which enforce the access controls described in this document.

### GDPR / Data-Subject Considerations

| Concern | Current Position |
|---------|-----------------|
| **Right to erasure** | Not implemented. User records, messages, and trade history persist indefinitely. Canister state cannot selectively delete individual records without an upgrade. |
| **Data minimisation** | No real-name, email, or physical address is required. Only pseudonymous Principal IDs are stored. |
| **Data portability** | Users can query their own data via `getMyProfile`, `getMyTrades`, `getMyFeedback`, `getMyDisputes`. No export function exists. |
| **Cross-border transfers** | ICP subnet nodes are geographically distributed. No control over which jurisdictions host which node. |
| **Consent** | No explicit consent mechanism is implemented. Using the canister implies acceptance of the on-chain data model. |

**Recommendation:** Before EU launch, implement a user data export endpoint and a "close account" flow that anonymises (not deletes) user-identifiable fields (username, bio, avatar URL) while preserving trade integrity records required for dispute resolution and audit compliance.

---

*Document generated from source analysis of `src/backend/` at revision current-HEAD. Last updated: 2026-04-12.*
