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

**Version:** 2026-05-19  
**Status:** Canonical product requirements for `cryptomarket-p2p`

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
| **Phase 1 (now)** | Reliable OLX core + **coordinated** stablecoin trades (wallet-to-wallet, platform state machine) |
| **Phase 2** | Automated payment verification for active networks; fulfillment paths proven |
| **Phase 3** | On-chain escrow (ICRC / threshold ECDSA) and optional HTLC-style guarantees |

### 2.3 Non-goals

- Custodial fiat wallets, card payments, bank transfer payment types.
- Anonymous access to mutating APIs (II required for writes).
- Claiming “trustless” or “atomic swap” in UX while Phase 1 is manual confirmation.

## 3. Personas and journeys

### 3.1 Personas

See product brief. Moderator/juror roles exist in code; juror dashboard is **deferred** for product launch.

### 3.2 Primary journey — physical goods (self-pickup MVP)

1. Seller creates listing (photos, price token, pickup location).
2. Buyer opens listing → starts trade.
3. Buyer sends stablecoins to seller address (off-chain).
4. Buyer marks payment sent; seller confirms received.
5. Buyer and seller complete pickup; trade completes.
6. Optional: dispute within rules if failure.

### 3.3 Primary journey — digital goods

1.–2. Same as above.
3. Seller delivers encrypted payload; inspection window applies.
4. Completion or dispute per digital goods rules.

### 3.4 Edge journeys

- Payment timeout / refund request.
- Dispute with evidence and moderator resolution (jury path optional later).

## 4. Functional requirements

### 4.1 Identity and profiles

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-1 | II login; auto profile on first use | 1 | Yes |
| FR-2 | Username/avatar; public profile without exposing private PII | 1 | Yes |
| FR-3 | Ban/suspend abusive principals | 1 | Yes |
| FR-4 | Optional KYC tiers | 3 | No |

### 4.2 Marketplace (OLX core)

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-10 | Create listing with images, category, price, token | 1 | Yes |
| FR-11 | Browse/search/filter listings | 1 | Partial (filters; full-text/URL sync gaps) |
| FR-12 | Listing detail + buy CTA | 1 | Yes |
| FR-13 | Edit listing | 1 | Partial |
| FR-14 | Deactivate listing | 1 | Partial |
| FR-15 | Seller public profile + active listings | 1 | Yes |

### 4.3 Trade and settlement

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-20 | Initiate trade from listing | 1 | Yes |
| FR-21 | Trade state machine with deadlines | 1 | Yes |
| FR-22 | Buyer confirms payment sent | 1 | Yes (manual) |
| FR-23 | Seller confirms payment received | 1 | Yes (manual) |
| FR-24 | Explorer-based payment verification | 2 | Partial (backend; E2E unproven) |
| FR-25 | On-chain escrow / fund lock | 3 | No |
| FR-26 | HTLC atomic swap | 3 | No |

**Active tokens (product):** USDT TRC20, BEP20, ERC20; USDC ERC20.

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
| FR-42 | Jury voting / DAO queue | 3 | Code; deferred UI/product |
| FR-43 | Reputation limits by tier | 1 | Yes (single score model; dual-score is future) |
| FR-44 | Global liability / cross-collateral | 2 | Partial in backend |

### 4.6 Fulfillment

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-50 | Self-pickup for physical goods | 1 | Yes (UI locked) |
| FR-51 | UA carriers (Nova Poshta, Ukrposhta, Meest) | 2+ | Backend; UI disabled |
| FR-52 | Digital delivery + inspection period | 1 | Yes (+ encryption module) |

### 4.7 Admin and ops

| ID | Requirement | Phase | Built |
|----|-------------|-------|-------|
| FR-60 | Admin settings, bans, audit log | 1 | Yes |
| FR-61 | Observability metrics | 1 | Yes |
| FR-62 | Vault / treasury UI | 3 | Deferred |

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

**Why phasing matters:** Many users (e.g. Ukraine) want to buy **goods** with crypto without an extra **fiat conversion** step that triggers tax/friction. Phase 1 delivers the OLX loop + platform rules; later phases add verification and on-chain custody.

### Phase 1 — Coordinated marketplace (CURRENT)

- Wallet-to-wallet stablecoin payment (USDT/USDC on four approved networks).
- Canister records trade state, deadlines, chat, and disputes — **does not hold funds**.
- Disputes via moderators; reputation gates.
- Pseudonymous Internet Identity profiles (no mandatory KYC).
- **User-facing label:** “Crypto classifieds with platform-backed trade rules” — **not** “trustless escrow” or “atomic swap”.

### Phase 2 — Verified + fulfillment

- Real tx verification for active networks.
- One physical fulfillment path proven (pickup or one carrier).
- Remove mock shipping data from production paths.

### Phase 3 — Trustless settlement

- ICRC / canister-held escrow.
- Optional HTLC where applicable.
- Community jury only if moderation does not scale.

## 7. Compliance and legal (lightweight)

- Platform does not custody fiat.
- Users responsible for local tax law; product avoids built-in conversion.
- GDPR-style delete/export: **not implemented** — track as gap.

## 8. Success metrics (MVP)

| Metric | Target |
|--------|--------|
| Trade completion (happy path) | ≥ 85% of initiated trades |
| Dispute rate | ≤ 5% of completed trades |
| Median time to complete trade | ≤ 48h (pickup/digital) |
| Live smoke + public flows | Pass before each go-live |
| Motoko unit tests | Green on `main` |

## 9. Open questions

1. Is Ukraine-only shipping a permanent wedge or temporary?
2. When to market jury vs moderator-only disputes?
3. Single reputation score vs buyer/seller split?
4. Minimum viable on-chain escrow: ICRC-only first?

## 10. Related documents

- [architecture.md](./architecture.md)
- [epics.md](./epics.md)
- [gap-analysis.md](./gap-analysis.md)
- [traceability-matrix.md](./traceability-matrix.md)
