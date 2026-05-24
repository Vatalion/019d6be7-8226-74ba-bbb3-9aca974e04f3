---
stepsCompleted: [1, 2, 3]
workflowType: prd
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief.md
  - AGENTS.md
  - planning/EXECUTION_PLAN.md (caffeine-cli .caf mirror)
document_output_language: en
---

# PRD — CryptoMarket P2P (aligned to current build)

**Version:** 2026-05-23 (course correction aligned to User Product Contract)
**Status:** Canonical product requirements for `cryptomarket-p2p`
**User promises:** [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) — canonical for UX-facing commitments

## 1. Executive summary

CryptoMarket P2P is a decentralized classifieds marketplace on the Internet Computer. Users buy and sell **goods** using **USDT/USDC** on approved networks. Authentication is **Internet Identity** (pseudonymous profiles). The platform provides trade orchestration, messaging, disputes, and reputation — with a phased path toward verified and on-chain settlement.

## 2. Problem and goals

### 2.1 Problem

- Users want to **buy/sell items in crypto** without an unnecessary fiat conversion step.
- P2P goods trade requires **structured trust** (timelines, evidence, disputes), not informal chat deals.
- Existing crypto products optimize for trading assets, not for **OLX-like commerce**.

### 2.2 Goals

| Phase | Goal |
|-------|------|
| **Phase 1 (now)** | OLX core + platform-led trade orchestration (buy CTA, seller handshake, chat, disputes) — **coordinated** settlement; honest copy |
| **Phase 1.5 (next product slice)** | ckUSDC/ckUSDT safety gates after seller handshake; **manual** settlement for TRC20/BEP20; Nova Poshta physical fulfillment; seller stake 5% (min 10 USDT); penalty splits |
| **Phase 2** | Automated payment verification hardening; digital delivery/dispute playbook; buyer stake remains deferred to future epic (D-047) |
| **Phase 3 (roadmap)** | Gate C ckUSDC/ckUSDT trustless beta first; ERC20 manual enablement; broader cross-chain lock-release only after separate architecture approval |

### 2.3 Non-goals

- Custodial fiat wallets, card payments, bank transfer payment types.
- Anonymous access to mutating APIs (II required for writes).
- Claiming “trustless” or “atomic swap” in UX while Phase 1 is manual confirmation.

## 3. Personas and journeys

### 3.1 Personas

See product brief. Moderator/juror roles exist in code; juror dashboard is **deferred** for product launch.

### 3.2 Primary journey — physical goods (Nova Poshta, Phase 1.5 product promise)

Per [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) §2.1:

1. Seller creates listing (photos, price in USDT/USDC, **Nova Poshta** delivery — self-pickup/meetup **out of scope**).
2. Seller posts **stake** (5% of listing price, minimum 10 USDT) before listing is sellable.
3. Buyer opens listing → sees **price, platform fee, network, delivery method** on first screen → taps **«Купити»**.
4. Platform creates trade request; seller has **24 hours** to confirm (handshake). No buyer fund lock before handshake.
5. If seller does not respond in 24h → **auto-cancel**, buyer receives **100%** refund of any committed amount.
6. After seller confirms → platform creates a PaymentIntent; Wave 1 manual funds become `payment_verified` only after explorer match; ckUSDC/ckUSDT lock remains Gate C Wave 3.
7. Seller ships via Nova Poshta, adds TTN/tracking in trade chat.
8. Buyer confirms receipt or NP `delivered`/`вручено` + 48h without dispute completes per D-003.
9. Platform pays seller (price minus fee); seller stake released or held per liability rules.
10. Dispute: Level 1 chat → Level 2 moderator (jury deferred).

**OLX promise:** buyer never hunts for seller wallet address in chat; platform leads the deal.

### 3.3 Primary journey — digital goods (files only, Phase 1.5)

Per [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) §2.2:

1. Seller creates digital listing, uploads **encrypted file** to platform (keys/text/license strings — **later**).
2. Buyer sees price + fee upfront → «Купити».
3. Seller confirms within **24h** (or auto-cancel → 100% buyer refund).
4. After handshake → buyer funds lock; platform **auto-delivers file** (seller need not be online).
5. **24-hour inspection window** opens; buyer verifies file matches description.
6. Success → seller paid; failure → negotiation then moderator escalation.

### 3.4 Penalty and cancel rules (user-facing)

| Scenario | Buyer | Seller | Platform |
|----------|-------|--------|----------|
| Seller no response 24h | 100% refund | Trade cancelled; no stake penalty | No buyer penalty |
| Buyer cancels **before shipment** | 85% refund | 10% compensation | 5% fee |
| Seller at fault (no ship, fake goods) | Full refund | Charge from stake (5%, min 10 USDT) + global liability | Insurance fund last resort (ref. `crypto_market`) |

### 3.5 Wallets and settlement (Phase 1.5 honesty)

- **User wallet:** external personal wallet connected by signed nonce proof; support for **multiple wallets** per user. No specific wallet SDK is committed without ADR + owner approval.
- **Seller funds:** not stored on platform permanently.
- **Buyer-facing token catalog:** USDT TRC20, USDT BEP20, USDT ERC20, USDC ERC20.
- **Wave 1 manual settlement:** USDT TRC20 + USDT BEP20 only — coordinated explorer verification; ERC20 manual enablement is Wave 3 (E4.S8/D-044).
- **Wave 3 Gate C on-chain:** ckUSDC first, ckUSDT second (ICRC-2 lock after seller handshake, capped beta).
- **Long-term roadmap:** trustless on all networks — **not** promised in current contract phase.

### 3.6 Edge journeys

- Payment timeout / refund request.
- Dispute Level 1 (parties) → Level 2 (moderator/third party). **Jury deferred.**
- Cross-collateral and global liability per `crypto_market` patterns (E6.S6, E6.S7, E6.S8).

## 4. Functional requirements

### 4.1 Identity and profiles

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-1 | II login; auto profile on first use | 1 | Yes |
| FR-2 | Username/avatar; public profile without exposing private PII | 1 | Yes |
| FR-3 | Ban/suspend abusive principals | 1 | Yes |
| FR-4a | Admin-assigned verified tier for beta limits | 2 | Yes (manual admin tier; external provider deferred) |
| FR-4b | External KYC provider integration | 4+ | No |

### 4.2 Marketplace (OLX core)

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-10 | Create listing with images, category, price, token | 1 | Yes |
| FR-11 | Browse/search/filter listings | 1 | Yes (full-text, URL sync) |
| FR-12 | Listing detail + buy CTA with **upfront fee breakdown** (price, platform fee, network, delivery) | 1.5 | Yes (E3.S8) |
| FR-13 | Edit listing | 1 | Yes |
| FR-14 | Deactivate listing | 1 | Yes |
| FR-15 | Seller public profile + active listings | 1 | Yes |

### 4.3 Trade and settlement

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-20 | Initiate trade from listing («Купити» — platform-led, no manual wallet hunt) | 1 | Yes |
| FR-21 | Trade state machine with deadlines | 1 | Yes (needs handshake 24h — E3.S7) |
| FR-21a | Seller **handshake** within **24h**; auto-cancel → buyer **100%** | 1.5 | Yes (E3.S7) |
| FR-21b | Buyer fund lock **after** seller confirms (not at trade start) | 1.5 | Yes (E3.S10 / E9.S2 safety defaults) |
| FR-21c | Buyer cancel before shipment → **85%** refund, **10%** seller, **5%** platform | 1.5 | Yes (E3.S9) |
| FR-21d | High-value trade caps and tier gates (>500 / >1000 ck-only / 5000 max) | 3 | Yes (E3.S11) |
| FR-22 | Buyer marks payment sent / wallet funds escrow | 1 | Yes (manual — interim) |
| FR-23 | Seller confirms payment received | 1 | Yes (manual — interim) |
| FR-24 | Explorer-based payment verification | 2 | Yes (backend + unit tests; live mainnet proof = Gate B) |
| FR-25 | On-chain escrow / fund lock (ckUSDC/ckUSDT after handshake) | 1.5–3 | Yes — Wave 1 safety defaults (E9.S2); Gate C enable + release/refund Wave 3 (E9.S6/E9.S3); testnet E2E P1 defer |
| FR-26 | Cross-chain lock-release research | 4+ | Rejected for MVP goods marketplace; separate ADR required before implementation |
| FR-27 | **Seller listing stake** 5% of price, **min 10 USDT** | 1.5 | Yes — internal ledger (E6.S8); on-chain custody deferred Wave 3 |
| FR-28 | External wallet signed-nonce proof + **multi-wallet** linking | 1.5 | Partial — nonce binding + snapshot yes (E4.S7); cryptographic ecrecover verify P1 |
| FR-29 | Four-token buyer-facing catalog with wave-gated settlement enablement | 2–3 | Yes — TRC20/BEP20 Wave 1; ERC20 manual + ck Gate C Wave 3 (E4.S8, E9.S6) |

**Active token catalog (product):** USDT TRC20, USDT BEP20, USDT ERC20, USDC ERC20. **Wave 1 settlement:** manual USDT TRC20/BEP20. **Wave 3 settlement:** ERC20 USDT/USDC manual + Gate C ckUSDC/ckUSDT escrow beta (default off).

### 4.4 Messaging and notifications

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-30 | Per-trade chat | 1 | Yes |
| FR-31 | Unread counts / polling notifications | 1 | Yes |
| FR-32 | XSS-safe message rendering | 1 | Yes |

### 4.5 Disputes and reputation

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-40 | Open dispute with evidence | 1 | Yes |
| FR-41 | Moderator/admin resolve | 1 | Yes |
| FR-42 | Jury voting / DAO queue | 3 | Built in code; **product-deferred** (see E6.S4, E10) |
| FR-43 | Dual buyer/seller reputation and tier limits | 2 | Yes |
| FR-44 | Global liability / cross-collateral (ref. `crypto_market`) | 1.5–3 | Yes — liability IDs + waterfall Wave 3 (E6.S6/E6.S7); manual path honest copy |
| FR-44a | Insurance fund from platform fees — last-resort buyer protection | 3 | Yes — capped policy E10.S4 (not full guarantee) |

### 4.6 Fulfillment

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-50 | Self-pickup / meetup for physical goods | — | **Out of scope** (was Phase 1 lock — E7.S1 product-deferred) |
| FR-51 | **Nova Poshta** shipping (TTN, tracking in trade chat) | 1.5 | Yes (E7.S3) |
| FR-51a | Ukrposhta, Meest | 3+ | Backend; **product-deferred** (E7.S4) |
| FR-52 | Digital delivery — **uploaded files only** + **24h inspection** | 1.5 | Yes (E2.S11, E7.S2 — Wave 2) |
| FR-52a | Digital keys/text/license strings | 3+ | No |

### 4.7 Admin and ops

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-60 | Admin settings, bans, audit log | 1 | Yes |
| FR-61 | Observability metrics | 1 | Yes |
| FR-62 | Vault / treasury UI | 3 | Built in code; **product-deferred** (see E10) |

### 4.8 Buyer engagement (OLX-adjacent)

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-70 | Favorites / watchlist | 1–2 | Yes |
| FR-71 | Saved searches (apply filters; no email alerts MVP) | 2 | Yes |
| FR-72 | Pre-trade listing inquiry (before opening trade) | 2 | Yes |
| FR-73 | Owner bump + admin promote listing | 2 | Yes |

## 5. Non-functional requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Availability (live app) | Caffeine SLA; smoke/flow gates before go-live |
| NFR-2 | Auth | II only; anonymous blocked on updates |
| NFR-3 | Rate limiting | Per-endpoint sliding windows |
| NFR-4 | i18n | Ukrainian + English |
| NFR-5 | Privacy | Minimize stored PII; no mandatory legal identity MVP |
| NFR-6 | Security | Input validation, reentrancy guards on escrow paths |

## 6. Progressive decentralization (canonical phasing)

**Why phasing matters:** Many users (e.g. Ukraine) want to buy **goods** with crypto without an extra **fiat conversion** step. Phase 1 delivers the OLX loop + platform rules; Phase 1.5 adds handshake economics, Nova Poshta, seller stake, and manual TRC20/BEP20 hardening; Wave 3 adds capped ckUSDC/ckUSDT trustless beta after Gate C.

### Phase 1 — Coordinated marketplace (CURRENT code baseline)

- OLX listings, search, profiles, chat, disputes, reputation.
- Trade state machine exists but **does not yet match** User Product Contract handshake/lock timing (see gap analysis).
- Canister records trade state — **does not hold buyer funds** on manual paths.
- Disputes via moderators; jury **deferred**.
- **User-facing label:** «Крипто-оголошення з правилами платформи» — **not** «trustless escrow».

### Phase 1.5 — User Product Contract slice (NEXT product promise)

Aligned to [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md):

- OLX «Купити» with **upfront fee** on first screen.
- Seller **24h handshake** → auto-cancel 100% buyer refund.
- PaymentIntent **after** seller confirm; Wave 1 manual path is wallet-to-wallet TRC20/BEP20 plus fail-closed explorer verification, not platform custody. ckUSDC/ckUSDT fund lock remains Gate C Wave 3.
- **Nova Poshta** only for physical goods (self-pickup removed from promise).
- Digital **files only** + auto-delivery + **24h inspection**.
- Seller stake **5%**, min **10 USDT**; buyer cancel before ship **10/5/85** split.
- External wallet signed-nonce multi-wallet.
- Cross-collateral / liability inspired by `crypto_market`; insurance fund **Wave 3** ([DECISION-LOG D-038/D-039](./DECISION-LOG.md)).

### Phase 2 — Verified + automation (Wave 2–3)

- Real tx verification for all active networks — Wave 1 manual + Wave 3 ERC20 ([E4.S8](./IMPLEMENTATION-PLAN-WAVE-3.md)).
- Insurance fund thresholds and payouts — Wave 3 ([E10.S4](./IMPLEMENTATION-PLAN-WAVE-3.md)).
- Buyer stake on fraud — **Wave 4+** ([DECISION-LOG D-047](./DECISION-LOG.md)).

### Phase 3 — Trustless settlement (roadmap)

- Gate C ckUSDC/ckUSDT ICRC escrow beta first.
- ERC20 manual enablement after security review; omnichain trustless support remains a later E14-style roadmap item.
- Cross-chain lock-release only after separate architecture approval; not part of the implementation-ready backlog.
- Community jury only if moderation does not scale.

## 7. Compliance and legal (lightweight)

- Platform does not custody fiat.
- Users responsible for local tax law; product avoids built-in conversion.
- GDPR-style delete/export baseline exists (E12.S1); retention, sanctions, AML/KYC tier, and counsel review remain public-beta launch gates.

## 8. Success metrics (MVP)

| Metric | Target |
|--------|--------|
| Trade completion (happy path) | ≥ 85% of initiated trades |
| Dispute rate | ≤ 5% of completed trades |
| Median time to complete trade | ≤ 48h (Nova Poshta/digital) |
| Live smoke + public flows | Pass before each go-live |
| Motoko unit tests | Green on `main` |

## 9. Resolved decisions (2026-05-23)

Former open questions — now in [DECISION-LOG.md](./DECISION-LOG.md):

1. NP completion — buyer confirm OR delivered+48h (D-003); see E7.S3.
2. Platform fee — **3%** default (D-001); see E3.S8.
3. Manual chains Wave 1 — TRC20/BEP20 USDT; ERC20 Wave 3 (D-002, D-044).
4. Insurance reserve — 40% fee accrual, capped payout (D-038, D-039); Wave 3 E10.S4.
5. Jury — deferred Wave 4+ (D-014, D-046); moderator L1/L2 Wave 2 E6.S9.

## 10. Related documents

- [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) — **canonical user promises**
- [COURSE-CORRECTION.md](./COURSE-CORRECTION.md) — 2026-05-23 alignment pass
- [architecture.md](./architecture.md)
- [epics.md](./epics.md)
- [ROADMAP-WAVES.md](./ROADMAP-WAVES.md) — wave entry/exit criteria
- [IMPLEMENTATION-PLAN-WAVE-2.md](./IMPLEMENTATION-PLAN-WAVE-2.md)
- [IMPLEMENTATION-PLAN-WAVE-3.md](./IMPLEMENTATION-PLAN-WAVE-3.md)
- [DECISION-LOG.md](./DECISION-LOG.md)
