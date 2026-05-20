---
stepsCompleted: [1, 2, 3]
workflowType: epics-and-stories
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
document_output_language: en
---

# Epics — CryptoMarket P2P

**Execution status:** 2026-05-19 snapshot. Replace stale `BACKLOG.md` checkboxes with this file for planning.

## Epic map

| Epic | Name | Phase | Status |
|------|------|-------|--------|
| E1 | Identity & profiles | 1 | **Done** |
| E2 | Marketplace (OLX core) | 1 | **Done** |
| E3 | Trade lifecycle (coordinated) | 1 | **Done** (manual payment) |
| E4 | Payments & verification | 2 | **Done** (live keys optional for Gate B proof) |
| E5 | Messaging & notifications | 1 | **Done** |
| E6 | Disputes & reputation | 1–2 | **Done** (moderator); jury deferred |
| E7 | Fulfillment | 1–2 | **Pickup done**; carriers deferred |
| E8 | Admin & observability | 1 | **Done** |
| E9 | Trustless settlement | 3 | **Not started** |
| E10 | Governance / vault (product) | 3 | **Deferred** |

---

## E1 — Identity & profiles

**Goal:** Pseudonymous II users with safe public profiles.

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E1.S1 | Login via II | Done |
| E1.S2 | Create/update profile | Done |
| E1.S3 | Public profile hides sensitive fields | Done |
| E1.S4 | Ban/suspend | Done |

---

## E2 — Marketplace (OLX core)

**Goal:** List, discover, and manage goods listings.

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E2.S1 | Create listing + photos | Done |
| E2.S2 | Search and filter | Done |
| E2.S3 | Listing detail | Done |
| E2.S4 | Edit listing | Done |
| E2.S5 | Deactivate listing | Done |
| E2.S6 | Seller profile + grid | Done |
| E2.S7 | Digital listing type | Done |

---

## E3 — Trade lifecycle (coordinated)

**Goal:** End-to-end trade with honest manual stablecoin settlement.

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E3.S1 | Initiate trade from listing | Done |
| E3.S2 | Buyer marks payment sent | Done |
| E3.S3 | Seller confirms received → complete | Done |
| E3.S4 | Refund/cancel paths | Done |
| E3.S5 | Trade detail UX + chat entry | Done |
| E3.S6 | Copy/UI says coordinated P2P not HTLC | Done (i18n hero/hiw 2026-05-19) |

---

## E4 — Payments & verification

**Goal:** Real verification for 4 active tokens.

| Story | Acceptance (summary) | Status |
|-------|----------------------|--------|
| E4.S1 | Token scope UI = 4 tokens everywhere | Done (live verified) |
| E4.S2 | Explorer verification E2E | Done (parser unit tests + `PAYMENT-VERIFICATION-E2E.md`; live tx proof after admin keys) |
| E4.S3 | Retry/circuit breaker on verify | Done (httpGet/PostWithRetry in payments-api) |
| E4.S4 | Admin API keys for explorers | Done (Admin → Settings → Explorer API keys, draft 96+) |

---

## E5 — Messaging & notifications

| Story | Status |
|-------|--------|
| E5.S1 Per-trade chat | Done |
| E5.S2 Unread + toasts | Done |
| E5.S3 XSS-safe messages | Done |

---

## E6 — Disputes & reputation

| Story | Status |
|-------|--------|
| E6.S1 Open dispute + evidence | Done |
| E6.S2 Moderator resolve | Done |
| E6.S3 Reputation tiers / limits | Done |
| E6.S4 Jury queue UI | Deferred |
| E6.S5 Dual buyer/seller scores | Deferred |

---

## E7 — Fulfillment

| Story | Status |
|-------|--------|
| E7.S1 Self-pickup only (physical) | Done (locked) |
| E7.S2 Digital delivery + inspection | Done |
| E7.S3 Nova Poshta E2E | Deferred |

---

## E8 — Admin & observability

| Story | Status |
|-------|--------|
| E8.S1 Admin dashboard | Done |
| E8.S2 System settings / allowed tokens | Done |
| E8.S3 Audit log | Done |

---

## E9 — Trustless settlement (Phase 3)

| Story | Status |
|-------|--------|
| E9.S1 ICRC escrow design | Not started |
| E9.S2 Fund lock on trade start | Not started |
| E9.S3 Auto-release rules | Not started |
| E9.S4 HTLC evaluation | Optional / TBD |

---

## E10 — Governance / vault (deferred)

Do not schedule until E3 and E4 exit gates pass.

---

## Exit gates (from PRD)

- **Gate A:** **Done** — live smoke + 5 public flows pass; `mops test` green; `/how-payments-work` live (draft 95+); manual trade E2E in `PAYMENT-VERIFICATION-E2E.md`.
- **Gate B:** **Infra done** — admin can configure TronGrid + BSCScan + Infura; live mainnet tx proof is a one-time admin action after keys are pasted (not automatable without secrets).
- **Gate C:** On-chain escrow beta for limited trade sizes.
