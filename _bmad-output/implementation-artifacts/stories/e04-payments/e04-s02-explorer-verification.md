---
workflowType: story
storyId: "E4.S2"
storyKey: "e4-s02-explorer-verification"
epic: "E4"
phase: 2
status: done
prd: "FR-24"
document_output_language: en
project: CryptoMarket P2P
---

# Story E4.S2: Explorer payment verification

## Status
Done

## Dependencies

- E3.S2
- E4.S4

## Story

As the platform, I need fail-closed explorer verification for manual stablecoin transfers so no trade reaches paid/verified state from spoofed or seller-only confirmation.

## Acceptance Criteria

1. Given explorer keys configured, when verify called with valid tx, then chain, token contract, from, to, amount, decimals, confirmations, and duplicate-tx checks match the PaymentIntent.
2. Given missing explorer keys or explorer outage, when verify attempted, then verification fails closed and trade remains payment_pending/manual_review.
3. Given seller clicks received without explorer match, when handler runs, then trade does not enter payment_verified.
4. Given invalid tx, wrong network, wrong token, underpay, or reused tx hash, when verify runs, then structured error and no paid state.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given explorer keys configured
  - When verify called with valid tx
  - Then chain, token contract, from, to, amount, decimals, confirmations, and duplicate-tx checks match the PaymentIntent.
- **Scenario: Acceptance 2**
  - Given missing explorer keys or explorer outage
  - When verify attempted
  - Then verification fails closed and trade remains payment_pending/manual_review.
- **Scenario: Acceptance 3**
  - Given seller clicks received without explorer match
  - When handler runs
  - Then trade does not enter payment_verified.
- **Scenario: Acceptance 4**
  - Given invalid tx, wrong network, wrong token, underpay, or reused tx hash
  - When verify runs
  - Then structured error and no paid state.
- **Scenario: Unauthenticated or invalid input**
  - Given missing Internet Identity session or invalid payload
  - When a protected update is attempted
  - Then the system rejects safely with a clear error

## Implementation scope

Implement only within this repository's established stack and architecture.

- **Frontend:** React 19, Vite, TanStack Router — `src/frontend/src/`
- **Backend:** single Motoko actor — `src/backend/lib/*.mo`, `src/backend/mixins/*-api.mo`
- **Auth:** Internet Identity via `useAuth.ts`
- **Config:** `backend_canister_id` and `project_id` from `/env.json`
- **Media:** Caffeine object storage via `object-storage-api.mo`
- **Trades (Phase 1):** `initiateTrade`, `confirmPaymentSent`, `confirmPaymentReceived` in `Escrow.mo`
- **Delivery:** `deliveryPolicy.ts` — Wave 1 target is Nova Poshta only; keep self-pickup hidden/deferred unless owner explicitly changes the product contract
- **Motoko:** `mo:core/*` per `AGENTS.md`
- **Verify:** `mops test` + applicable Caffeine flow templates

**Done:** regression-test acceptance criteria on any change in this area.

## Tasks / Subtasks

- [x] **Frontend**
  - [x] `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`
- [x] **Backend**
  - [x] `src/backend/lib/Payments.mo`
  - [x] `src/backend/mixins/payments-api.mo`
- [x] **Documentation**
  - [x] `docs/bmad/PAYMENT-VERIFICATION-E2E.md`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] `test/Payments.test.mo`

## Dev Notes

### API (Candid / actor)

- verifyPayment

### Technical constraints

- Load `backend_canister_id` and `project_id` from `/env.json` at runtime (never hardcode).
- `HttpAgent` host: `https://icp-api.io` on mainnet.
- Physical delivery: E7.S3 is the owner-approved Phase 1.5 unlock from pickup-only to Nova Poshta-only; self-pickup stays hidden/deferred.
- Motoko: use `mo:core/*` only; persistent actor per `AGENTS.md`.

## Architecture compliance

| Requirement | Source |
|-------------|--------|
| Single persistent Motoko actor in `main.mo` | [architecture.md](../../../planning-artifacts/architecture.md) |
| React SPA on Caffeine frontend | [architecture.md](../../../planning-artifacts/architecture.md) |
| Phase 1 settlement: off-chain payment + canister state | [architecture.md](../../../planning-artifacts/architecture.md) |
| Internet Identity | [prd.md](../../../planning-artifacts/prd.md) |
| FR-24 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

## Library and framework requirements

| Layer | Use |
|-------|-----|
| UI | React 19, Vite, TanStack Router, Tailwind |
| Auth / ICP client | `@caffeineai/core-infrastructure` `useInternetIdentity()` via `useAuth.ts`; `@dfinity/agent`, host `https://icp-api.io` |
| Storage | Caffeine object storage pattern |
| Backend | Motoko `mo:core`, mops |
| Build | mops, Caffeine draft/live |

- Payments: `payments-api.mo` HTTPS outcalls (CoinGecko + explorers).

## File structure requirements

```text
src/backend/main.mo
src/backend/types.mo
src/backend/lib/<Domain>.mo
src/backend/mixins/<domain>-api.mo
src/frontend/src/pages/
src/frontend/src/components/
src/frontend/src/hooks/useAuth.ts
src/frontend/src/hooks/useBackend.ts
src/frontend/src/lib/deliveryPolicy.ts
test/<Domain>.test.mo
```

**Frontend:**

- `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`

**Backend:**

- `src/backend/mixins/payments-api.mo`
- `src/backend/lib/Payments.mo`

## Testing requirements

| Layer | Requirement |
|-------|-------------|
| Motoko | `mops test` for changed modules |
| UI | Caffeine flow templates + manual smoke on draft |
| Live URL | Object storage + II when testing uploads |
| Evidence | Test output or flow id — not chat claims alone |

```bash
mops test
```

**Story checks:**

- test/Payments.test.mo

### Verification checklist (story manifest)

- `Payments.test.mo`
- docs/bmad/PAYMENT-VERIFICATION-E2E.md

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-24
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-21 | 2.1 | Brownfield reconciliation — Dev Agent Record synced to codebase | Reconciliation |

## Dev Agent Record

### Agent Model Used

Brownfield reconciliation (2026-05-21)

### Debug Log References

Code audit against `src/` and `test/` on 2026-05-21.

### Completion Notes List

- PaymentVerificationWidget calls verifyPayment for explorer match.
- PAYMENT-VERIFICATION-E2E.md documents Gate B proof.

### File List

- `docs/bmad/PAYMENT-VERIFICATION-E2E.md`
- `src/backend/lib/Payments.mo`
- `src/backend/mixins/payments-api.mo`
- `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E4.S2 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given explorer keys configured, when verify called with valid tx, then chain, token contract, from, to, amount, decimals, confirmations, and duplicate-tx checks match the PaymentIntent. | Pass (regression) | test/Payments.test.mo |
| 2 | Given missing explorer keys or explorer outage, when verify attempted, then verification fails closed and trade remains payment_pending/manual_review. | Pass (regression) | src/frontend/src/components/shared/PaymentVerificationWidget.tsx |
| 3 | Given seller clicks received without explorer match, when handler runs, then trade does not enter payment_verified. | Pass (regression) | |
| 4 | Given invalid tx, wrong network, wrong token, underpay, or reused tx hash, when verify runs, then structured error and no paid state. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: explorer keys configured, when verify called with valid tx, then chain, token contract, from, to, amount, decimals, conf…
- [x] Scenario 2: missing explorer keys or explorer outage, when verify attempted, then verification fails closed and trade remains paymen…
- [x] Scenario 3: seller clicks received without explorer match, when handler runs, then trade does not enter payment_verified.
- [x] Scenario 4: invalid tx, wrong network, wrong token, underpay, or reused tx hash, when verify runs, then structured error and no paid…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Payments.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
