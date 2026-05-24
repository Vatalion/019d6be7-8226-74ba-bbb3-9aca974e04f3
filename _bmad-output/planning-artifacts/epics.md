---
stepsCompleted: [1, 2, 3]
workflowType: epics-and-stories
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
document_output_language: en
reconciledAt: 2026-05-23
---

# Epics — CryptoMarket P2P

**Execution status:** 2026-05-23 — **course correction** aligned to [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md). Prior reconciliation with codebase remains; new Phase 1.5 backlog stories added below.

**Story files (BMAD):** [`_bmad-output/implementation-artifacts/stories/index.md`](../implementation-artifacts/stories/index.md)

## Phase labels (after course correction)

| Label | Meaning |
|-------|---------|
| **Phase 1** | Shipped OLX core + coordinated manual trade (legacy flow) |
| **Phase 1.5** | User Product Contract promises — **next implementation priority** |
| **Phase 2+** | Verification automation, insurance fund, extra carriers |
| **Phase 3 / deferred** | Full trustless, jury, Ukrposhta/Meest productization |

## Epic map

| Epic | Name | Phase | Status |
|------|------|-------|--------|
| E1 | Identity & profiles | 1 | **Done** |
| E2 | Marketplace (OLX core) | 1 | **Done** |
| E3 | Trade lifecycle (platform-led) | 1–1.5 | **Done** (legacy manual) + **Phase 1.5 backlog** (handshake, lock timing, penalties) |
| E4 | Payments & verification | 2 | **Done** (live keys optional for Gate B) + **E4.S7 backlog** (external wallet proof) |
| E5 | Messaging & notifications | 1 | **Done** |
| E6 | Disputes & reputation | 1–2 | **Done** (jury deferred) + **E6.S8 backlog** (seller stake 5%/10 USDT) |
| E7 | Fulfillment | 1.5 | **Phase 1.5:** Nova Poshta in-scope (E7.S3); self-pickup **product-deferred** (E7.S1) |
| E8 | Admin & observability | 1 | **Done** |
| E9 | On-chain escrow | 1.5–3 | **In progress** — Phase 1.5 ckUSDC/ckUSDT after handshake; Gate C for public CTA |
| E10 | Governance / vault | 3 | **Built, product-deferred** |
| E11 | Buyer engagement | 1–2 | **Done** |
| E12 | Compliance & privacy | 2–3 | **Done** — GDPR + admin KYC tiers (provider flow deferred) |

---

## E1 — Identity & profiles

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E1.S1 | Login via II | Done |
| E1.S2 | Create/update profile | Done |
| E1.S3 | Public profile hides sensitive fields | Done |
| E1.S4 | Ban/suspend | Done |

---

## E2 — Marketplace (OLX core)

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E2.S1 | Create listing + photos | Done |
| E2.S2 | Search and filter | Done |
| E2.S3 | Listing detail | Done |
| E2.S4 | Edit listing | Done |
| E2.S5 | Deactivate listing | Done |
| E2.S6 | Seller profile + grid | Done — public active-only enforced server-side after gap fix |
| E2.S7 | Digital listing type | Done — inspection in `escrow-api.mo` |
| E2.S8 | Category taxonomy (114 nodes) | Done |
| E2.S9 | Report listing | Done |
| E2.S10 | Vertical attributes (auto, RE) | Done — `CategoryCatalog.attributeSchema`, `CategoryAttributeFields`, tests |
| E2.S11 | Digital **file upload** + encrypted storage; auto-delivery post-funding | **Backlog — Wave 2** |

---

## E3 — Trade lifecycle (platform-led)

**Contract alignment:** Buy CTA → seller handshake 24h → fund lock **after** confirm → fulfillment → payout/penalty. See USER-PRODUCT-CONTRACT §3–4.

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E3.S1 | Initiate trade from listing | Done |
| E3.S2 | Buyer marks payment sent | Done (legacy — pre-handshake manual path) |
| E3.S3 | Seller confirms received → complete | Done (legacy) |
| E3.S4 | Refund/cancel paths (`proposeCancelTrade`) | Done (needs 10/5/85 split — E3.S9) |
| E3.S5 | Trade detail UX + chat entry | Done |
| E3.S6 | Honest Phase 1 copy (no false custody) | Done |
| E3.S7 | Seller handshake **24h** + auto-cancel **100%** buyer refund | **Backlog — Phase 1.5** |
| E3.S8 | **Upfront fee breakdown** on buy/first commit screen | **Backlog — Phase 1.5** |
| E3.S9 | Buyer cancel before shipment → **10/5/85** penalty split | **Backlog — Phase 1.5** |
| E3.S10 | Fund lock **after** seller handshake (not at trade start) | **Backlog — Phase 1.5** (pairs with E9.S2) |

---

## E4 — Payments & verification

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E4.S1 | Token scope UI = 4 tokens on home/create | Done — backend metadata wider; UI scoped |
| E4.S2 | Explorer verification | Done |
| E4.S3 | Retry on verify outcalls | Done — no circuit-breaker unit tests |
| E4.S4 | Admin explorer API keys | Done |
| E4.S5 | Wallet QR / paste + trade payment address | Done — after seller address on trade detail |
| E4.S6 | Price oracle / USD display cache | Done — CoinGecko cache in `Payments.mo` |
| E4.S7 | External wallet nonce-proof linking | **Backlog — Phase 1.5** |

---

## E5 — Messaging & notifications

| Story | Status |
|-------|--------|
| E5.S1 Per-trade chat | Done |
| E5.S2 Unread + toasts (30s poll) | Done |
| E5.S3 XSS-safe messages | Done |

---

## E6 — Disputes & reputation

| Story | Status |
|-------|--------|
| E6.S1 Open dispute + evidence | Done |
| E6.S2 Moderator resolve | Done |
| E6.S3 Reputation tiers / trade limits | Done (single score) |
| E6.S4 Jury queue UI | **Built, product-deferred** |
| E6.S5 Dual buyer/seller scores | Done — `buyerScore`/`sellerScore`, `ReputationStats` UI |
| E6.S6 Global liability | **Done — Wave 3** — liability IDs, partial clear, admin queue |
| E6.S7 Cross-collateral waterfall | **Done — Wave 3** — manual vs ck honest copy |
| E6.S8 Seller listing **stake 5%**, **min 10 USDT** | **Done — Wave 1** |
| E6.S9 Dispute playbook L1/L2 + SLA | **Done — Wave 2** |

---

## E7 — Fulfillment

**Contract:** Physical = **Nova Poshta only**. Self-pickup/meetup **out of scope**. Digital = **files only** + 24h inspection.

| Story | Status |
|-------|--------|
| E7.S1 Self-pickup only (physical) | **Product-deferred** — superseded by contract; code lock remains until E7.S3 ships |
| E7.S2 Digital delivery + **24h inspection** (deliveryRecordAt) | **Done — Wave 2** |
| E7.S3 Nova Poshta E2E | **Done — Wave 1** |
| E7.S4 Ukrposhta / Meest | **Built, product-deferred** (Phase 3+) |
| E7.S5 Tracking webhooks | Done — persistent `trackingTimelines` + 30s poll in `ShippingTracker` |

---

## E8 — Admin & observability

| Story | Status |
|-------|--------|
| E8.S1 Admin dashboard | Done |
| E8.S2 System settings / allowed tokens | Done |
| E8.S3 Audit log | Done |
| E8.S4 Observability / metrics panel | Done (manual QA) |
| E8.S5 Rate limiting | Done |
| E8.S6 Security baseline | Done — `Auth.assertNotAnonymous` + validation (not separate CallerGuard module) |

---

## E9 — On-chain escrow (Phase 1.5 → 3)

**Goal:** ICRC-2 lock/release for ckUSDC/ckUSDT **after seller handshake** (E3.S7/S10) behind Gate C. Wave 1 manual TRC20/BEP20 remains coordinated until explorer-verified; ERC20 manual enablement is Wave 3. Long-term: trustless all networks.

| Story | Status |
|-------|--------|
| E9.S1 ICRC escrow design | **Done** — ONCHAIN-SETTLEMENT-DESIGN.md + failure modes |
| E9.S2 Fund lock **after handshake** | **Done — Wave 1 safety defaults**; Gate C enable Wave 3 |
| E9.S3 Auto-release / refund on-chain | **Done — Wave 3** (with Gate C) |
| E9.S4 External wallet vs ICRC ADR | **Done** |
| E9.S5 Cross-chain pattern ADR | **Done** |
| E9.S6 Gate C beta enable | **Done — Wave 3** |
| E10.S4 Capped insurance reserve | **Done — Wave 3** |
| E3.S11 High-value trade caps | **Done — Wave 3** |
| E4.S8 ERC20 USDC/USDT manual enable | **Done — Wave 3** |

Do not market on-chain custody until Gate C checklist in design doc is complete. Wave 1 = manual TRC20/BEP20 plus ck safety defaults only; Wave 3 = capped ckUSDC/ckUSDT Gate C beta — **not** full trustless roadmap.

---

## E10 — Governance / vault (built, product-deferred)

| Story | Status |
|-------|--------|
| E10.S1 Governance proposals + voting | **Built, product-deferred** |
| E10.S2 Vault addresses + balances | **Built, product-deferred** |
| E10.S3 Treasury fee / withdrawals | **Built, product-deferred** — ICRC fee path wired; manual trades not accrued |

Do not prioritize in Phase 1 nav/marketing until Gates A–B stable.

---

## E11 — Buyer engagement

| Story | Status |
|-------|--------|
| E11.S1 Favorites | Done |
| E11.S2 Saved searches | Done |
| E11.S3 Listing inquiry | Done |
| E11.S4 Owner bump + admin promote | Done — admin promote UI on Admin → Listings |
| E11.S5 Saved search alerts | Done — in-app notifications on new listing match |

---

## E12 — Compliance & privacy

| Story | Status |
|-------|--------|
| E12.S1 GDPR export / delete | **Done** — exportMyAccountData + deleteMyAccount + ProfilePage UI |
| E12.S2 Optional KYC tiers | **Done** — admin manual verified tier + badge + 2× limits; external provider integration deferred |

---

## Exit gates (from PRD)

- **Gate A:** **Done** — live smoke + public flows; `mops test` green; `/how-payments-work` live.
- **Gate B:** **Infra done** — admin explorer keys; live mainnet tx proof after keys configured.
- **Gate C:** On-chain escrow beta — **not started** (backend spike only; see E9).

## Known cross-story gaps (tracked in stories)

See **Known gaps** sections in each story Dev Agent Record. Priority code fixes in progress: E4.S5 trade payment address, E11.S4 admin promote, E2.S6 public listings API, E3/Escrow unit tests.
