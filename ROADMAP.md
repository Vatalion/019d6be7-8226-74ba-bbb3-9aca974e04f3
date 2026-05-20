# Roadmap — P2P Crypto Marketplace

> **⚠️ Planning source of truth (2026-05-19):** [_bmad-output/planning-artifacts/product-brief.md](_bmad-output/planning-artifacts/product-brief.md), [prd.md](_bmad-output/planning-artifacts/prd.md) §6, [epics.md](_bmad-output/planning-artifacts/epics.md). This file is a long-range technical sketch; unchecked boxes below do not reflect current build status.
>
> **Vision (aligned):** OLX-style goods marketplace; stablecoin-only; pseudonymous II users; Phase 1 = coordinated wallet payment + platform rules; Phase 3 = on-chain escrow (not shipped).

---

## Phase 1 — MVP Core (Months 1–3)

**Goal:** A functional P2P marketplace where users can create listings, initiate atomic swaps with manual escrow confirmation, pay in stablecoins, use decentralized identity login, track shipments via Nova Poshta, and resolve basic disputes through manual moderation.

### Backend Module Milestones

#### User Management Module
- [ ] `getOrCreateProfile(principal)` — auto-create on first login
- [ ] `updateProfile(username, avatarUrl)` — authenticated only
- [ ] `getProfile(principal)` — public query
- [ ] Dual-role reputation storage: `buyerScore`, `sellerScore`
- [ ] Role-based access control: role map in persistent storage
- [ ] Anonymous principal blocking on all mutating methods
- [ ] Persistent storage with upgrade-safe hooks

#### Marketplace Module
- [ ] `createListing(ListingInput)` — validates all fields, stores in persistent map
- [ ] `updateListing(id, fields)` — owner-only
- [ ] `deactivateListing(id)` — owner-only, status → Inactive
- [ ] `searchListings(query, filters, cursor)` — full-text + filter
- [ ] `getListing(id)` — public query
- [ ] `setManualTtn(swapId, ttn, carrier)` — seller-only
- [ ] Rate limiting: `createListing` max 1/60s per user
- [ ] Input validation at module boundary (title, description, price, payment methods)
- [ ] Anonymous principal blocking

#### Atomic Swap / Escrow Module
- [ ] `initiateSwap(listingId, paymentMethod)` — on-chain token approval and escrow lock
- [ ] `completeSwap(swapId, preimage)` — hash verification → token release to seller
- [ ] `refundSwap(swapId)` — timelock expiry check → token return to buyer
- [ ] `cancelSwap(swapId)` — pre-funding only, by either party
- [ ] `confirmPayment(swapId)` — manual seller confirmation for off-chain stablecoins
- [ ] Dual-role reputation update after completion
- [ ] Persistent swap state machine
- [ ] Anonymous principal blocking

#### Messaging Module
- [ ] `sendMessage(threadId, text)` — authenticated, rate limited (10/min)
- [ ] `getMessages(threadId, limit, cursor)` — paginated, access-controlled
- [ ] `getUnreadCount(principal)` — query across all threads
- [ ] `markRead(threadId)` — resets unread count for caller
- [ ] Thread auto-created on swap initiation
- [ ] Access control: only trade participants per thread

#### Disputes Module
- [ ] `openDispute(swapId, reason, evidenceUrls)` — buyer or seller
- [ ] `resolveDispute(disputeId, winner)` — moderator role required
- [ ] `getDispute(disputeId)` — trade participants + moderators
- [ ] Dispute status state machine: `Open → UnderReview → Resolved`
- [ ] Evidence URLs stored via decentralized file storage
- [ ] Status notifications sent via messaging module

#### Price Oracle Module
- [ ] `getRate(asset)` — returns USD rate with timestamp
- [ ] Rates cached 5 minutes in persistent storage
- [ ] External API integration for exchange rate data
- [ ] Consensus-safe transform for external data responses
- [ ] `verifyPayment(txHash, amount, address)` — stub for Phase 2

### Frontend Milestones

#### Foundation
- [ ] App setup with routing, query caching, and design system
- [ ] Decentralized identity provider wraps app; login and logout controls
- [ ] Authentication guard for protected routes
- [ ] Data-fetching hooks for all backend module methods
- [ ] Design system: semantic color tokens, shared components
- [ ] Error boundary and toast notifications

#### Pages & Flows
- [ ] Home page: hero + featured listings + how it works
- [ ] Listings page: search + filters + pagination
- [ ] Listing detail page: photos, price, payment methods, Buy button
- [ ] Create Listing page: multi-step form with image upload
- [ ] Edit Listing page
- [ ] Trade detail page: status timeline, chat, shipping tracking, action buttons
- [ ] Profile page: reputation badges, active listings
- [ ] Login page / modal
- [ ] Trades history page

#### Shipping (Nova Poshta MVP)
- [ ] Shipping data hook using Nova Poshta backend module
- [ ] City/warehouse autocomplete in listing creation
- [ ] Shipping cost display on listing detail
- [ ] Manual tracking number entry component
- [ ] Shipping tracking widget in trade detail (polls every 30s)

### Security Baseline
- [ ] Anonymous principal blocking in all backend modules
- [ ] Rate limiting: listing creation, swap initiation, messaging
- [ ] Input validation at module boundary for all public methods
- [ ] On-chain token approval attack surface reviewed
- [ ] Consensus-safe transforms on all outbound external API calls
- [ ] Strict type checking enabled; no loose types in frontend

### KPIs — Phase 1 Targets

| KPI | Target |
|-----|--------|
| Swap success rate | ≥80% (manual confirmation) |
| Median settlement time | ≤60 min (manual) |
| Dispute rate | ≤5% |
| Day-1 retention | ≥20% |
| Listing creation success | ≥95% |
| App load time (LCP) | ≤2s on 4G |
| Backend uptime | 99.9% |

---

## Phase 2 — Automation & Verification (Months 4–6)

**Goal:** Automated payment verification via external API integration eliminates manual seller confirmation for off-chain stablecoins. Full on-chain native stablecoin escrow. Enhanced dispute resolution with juror pool. Modular compliance integration. Telemetry and compliance readiness.

### Backend Module Additions & Upgrades

#### Price Oracle — Payment Verification
- [ ] `verifyPayment(txHash, amount, address, network)` — live implementation
- [ ] External API integration for TRC20, BEP20, SPL, ERC20 network verification
- [ ] Exponential backoff retry on API errors
- [ ] Verification result triggers automatic escrow progression
- [ ] API credentials stored in secure backend storage (never frontend)

#### Atomic Swap / Escrow — On-Chain Escrow
- [ ] Full on-chain escrow for native stablecoins using on-chain token protocol
- [ ] Token approval and escrow lock confirmed by on-chain ledger
- [ ] Automated swap completion triggered by payment verification
- [ ] Fee distribution: 97% seller / 2% platform / 0.5% oracle / 0.5% reserve

#### Disputes — Juror Pool (Phase 2)
- [ ] Juror pool with stake requirement (minimum native stablecoin stake to join)
- [ ] Round-robin dispute assignment from juror queue
- [ ] Juror dashboard: claim dispute, view evidence, submit verdict
- [ ] Majority verdict triggers `resolveDispute`
- [ ] Juror reputation scoring

#### Shipping — Ukrposhta & Meest Express
- [ ] Full feature parity with Nova Poshta module for Ukrposhta and Meest Express
- [ ] Shipping provider selector component with 3-carrier comparison
- [ ] Location picker with real-time cost comparison

#### Observability
- [ ] Backend error log ring buffer (last 1000 entries per module)
- [ ] Metrics endpoint on all modules: request counts, error rates, resource balance, memory
- [ ] Admin dashboard (permission-protected)
- [ ] Resource balance alerts via external webhook notification
- [ ] Frontend error tracking

### Frontend Additions
- [ ] Automated payment status polling (replaces manual confirmation UI for on-chain tokens)
- [ ] Native stablecoin wallet balance display in header
- [ ] Metrics hook for admin dashboard
- [ ] Juror dashboard page
- [ ] Shipping provider selector with 3-carrier comparison
- [ ] Localization: Ukrainian translation + language switcher
- [ ] Accessibility standards audit + remediation

### KPIs — Phase 2 Targets

| KPI | Target |
|-----|--------|
| Swap success rate | ≥88% |
| Median settlement time | ≤30 min (automated verification) |
| Dispute rate | ≤4% |
| Day-1 retention | ≥23% |
| MAU | 500+ |
| Backend uptime | 99.9% |

---

## Phase 3 — Full Decentralization (Months 7–12)

**Goal:** Full on-chain escrow for all supported tokens. Cross-chain support via cryptographic signature scheme (BTC, ETH, BNB, SOL). DAO governance stub. External security audits. Scale to 1,000+ concurrent users.

### Technical Milestones

#### Cross-Chain Support
- [ ] Cryptographic signature scheme integration for cross-chain transactions
- [ ] Vault address derivation per user for ETH/BSC chains
- [ ] BTC transaction builder using platform-native Bitcoin support
- [ ] SOL transaction builder via external on-chain API requests
- [ ] Balance scanner: external API verification of cross-chain deposits
- [ ] Cross-chain swap state machine (additional states for multi-confirmation)

#### Full On-Chain Escrow
- [ ] All platform-native wrapped tokens use pure on-chain escrow
- [ ] No manual confirmation required for any platform-native token
- [ ] Escrow finality: wait for on-chain transaction certification before swap progression
- [ ] Fee management: platform fee module collects and distributes fees automatically

#### DAO Governance (Stub)
- [ ] Governance module stub: proposal creation, voting
- [ ] Platform parameter changes (fee rates, dispute timeouts) via governance proposals
- [ ] Decentralized governance preparation groundwork

#### Scaling & Performance
- [ ] Module sharding strategy for marketplace listings (by category or region)
- [ ] Message pagination optimized for large trade histories
- [ ] Frontend bundle optimization: code splitting per route
- [ ] CDN configuration for frontend static assets

#### Security Audit
- [ ] All backend modules audited by external security firm
- [ ] Audit package assembled: module inventory, call graphs, access control matrix, escrow flows
- [ ] All critical findings remediated before mainnet launch
- [ ] Audit report published

### Production Launch Checklist
- [ ] All Phase 1 KPIs met or exceeded
- [ ] All Phase 2 KPIs met or exceeded
- [ ] External security audit complete, critical findings resolved
- [ ] Privacy policy and terms of service live
- [ ] Operational runbooks complete for all procedures
- [ ] Resource top-up automation in place
- [ ] Admin dashboard operational
- [ ] Beta user feedback incorporated

### KPIs — Phase 3 Targets

| KPI | Target |
|-----|--------|
| Swap success rate | ≥90% |
| Median settlement time | ≤5 min (full on-chain) |
| Dispute rate | ≤3% |
| Day-1 retention | ≥25% |
| MAU | 10,000+ |
| Concurrent users | 1,000+ |
| Security audit | Cleared |
| Backend uptime | 99.95% |

---

## KPI Tracker

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|---------------|
| Swap success rate | ≥80% | ≥88% | ≥90% |
| Median settlement | ≤60 min | ≤30 min | ≤5 min |
| Dispute rate | ≤5% | ≤4% | ≤3% |
| Day-1 retention | ≥20% | ≥23% | ≥25% |
| MAU | 100+ | 500+ | 10,000+ |
| App LCP | ≤2s | ≤1.5s | ≤1s |
| Backend uptime | 99.9% | 99.9% | 99.95% |

---

## Budget Estimate

| Category | Estimate |
|----------|---------|
| Development (Phase 1–3) | ~$500,000 |
| External security audits | ~$120,000 |
| Platform infrastructure (ops/yr) | ~$40,000/yr |
| Legal / compliance | ~$30,000 |
| **Total (Year 1)** | **~$690,000** |

---

## Break-Even Projection

- Platform fee: 2% per completed trade
- Break-even at ~$34.5M total trade volume (at 2% fee)
- Target: break-even within 18 months of mainnet launch

---

## Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| Which on-chain native stablecoins are MVP priority — one or both major stablecoins? | ❓ Open | Primary stablecoin assumed MVP; second is Phase 1 follow-up |
| Beta launch mode: public open beta or invite-only? | ❓ Open | Invite-only reduces abuse risk during audit period |
| Minimum trade amount | ❓ Open | Suggested: $1 equivalent; needs economics review |
| Compliance jurisdiction: EU, Ukraine, global? | ❓ Open | Affects compliance scope and data residency requirements |
| Compliance / identity verification: required for MVP or post-MVP? | ❓ Open | Modular design allows addition post-MVP |
| Decentralized governance timeline | ❓ Open | Phase 3 stub; full decentralized governance in Year 2 |
| Cross-chain priority order: BTC first, then ETH, then others? | ❓ Open | BTC integration is most mature on the platform |

---

## Backend Module Inventory

| Module | Responsibility | Phase |
|--------|---------------|-------|
| `user_management` | Profiles, reputation, permissions, session | Phase 1 |
| `marketplace` | Listings CRUD, search, shipping tracking number | Phase 1 |
| `atomic_swap` | Escrow, swap state machine | Phase 1 |
| `messaging` | P2P chat, trade threads, notifications | Phase 1 |
| `disputes` | Dispute lifecycle, moderator queue | Phase 1 |
| `price_oracle` | Exchange rates, payment verification | Phase 1 (rates) / Phase 2 (verification) |
| `shipping_np` | Nova Poshta external API integration | Phase 1 |
| `shipping_ukrposhta` | Ukrposhta external API integration | Phase 2 |
| `shipping_meest` | Meest Express external API integration | Phase 2 |
| `governance` | DAO proposals, parameter voting | Phase 3 stub |

---

## Gap-Closure Workstreams (Weeks 1–4)

All workstreams below were executed in draft only (Draft v51 → v63). No live deployment since v43.

| # | Workstream | Status |
|---|---|---|
| Week 1.1 | Vault address derivation — base58 Solana, base58check Tron | ✅ Complete |
| Week 1.2 | Price oracle — CoinGecko integration with 5-min cache | ✅ Complete |
| Week 1.3 | Reputation gates — progressive trade limits (3 tiers: $1k/$5k/$100k) | ✅ Complete |
| Week 2.1 | Nova Poshta integration — trade-scoped TTN creation, retry logic, branch lookup | ✅ Complete |
| Week 2.2 | Ukrposhta & Meest integration — parity with Nova Poshta, multi-carrier listing config | ✅ Complete |
| Week 2.3 | Unified tracking timeline — 30s auto-refresh, visual step timeline, status-change toasts | ✅ Complete |
| Week 2.4 | Digital goods atomic delivery — 24h inspection period, dispute protection, URL/password reveal | ✅ Complete |
| Week 3.1 | Dispute jury hardening — 72h timelock, dynamic consensus threshold, auto-resolution, cross-collateral seizure | ✅ Complete |
| Week 3.2 | Global liability tracking — per-user liability balance, cross-collateral seizure on escrow release, listing block | ✅ Complete |
| Week 3.3 | Payment method UX overhaul — clipboard detection, QR scanner, contextual per-network hints | ✅ Complete |
| Week 3.4 | Level 2 crypto address verification — on-chain RPC checks via HTTPS outcalls, 24h cache, verification badges | ✅ Complete |
| Week 4.1 | Real-time notifications — 30s polling, toast alerts, badge counters, deadline warnings | ✅ Complete |
| Week 4.2 | Cascading location picker + stablecoin network selection — oblast → city, USDT/USDC network dialog | ✅ Complete |
| Week 4.3 | Admin observability dashboard — P95 latency, volume graphs, canister health, alert thresholds | ✅ Complete |
| Week 4.4 | Security hardening — anonymous guards, rate limits (4 endpoints), reentrancy guard, input validation | ✅ Complete |

---

## Deferred Items

The following items were scoped but deferred to a future workstream or Phase 3:

| Item | Reason deferred |
|---|---|
| HTLC atomic swap — trustless cross-chain escrow | Phase 3; requires threshold ECDSA + ICRC-1 maturity |
| WalletConnect v2 — multi-wallet support | Phase 3; Internet Identity is the only auth method in MVP |
| International shipping carriers — DHL, UPS, FedEx | Post-MVP; current coverage is Ukraine-only (Nova Poshta, Ukrposhta, Meest) |
| Full on-chain escrow — ICRC-1 standard + threshold ECDSA | Phase 3 |
| DAO governance — treasury management, proposal voting | Phase 3 stub only |
| KYC/AML module — modular compliance layer | Post-MVP; modular design allows addition without breaking changes |
| EVM full address derivation — Keccak-256 | Phase 3; currently uses simplified deterministic derivation (last 20 bytes of compressed pubkey, hex-encoded) |

---

> **Single source of truth.** All implementation phases, checklists, KPIs, and open questions are tracked here. Backlog stories live in `BACKLOG.md`. Completed milestones are checked off in-place — do not move them to a separate file.
