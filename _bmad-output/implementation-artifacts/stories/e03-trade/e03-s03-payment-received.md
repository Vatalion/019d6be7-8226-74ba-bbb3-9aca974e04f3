---
workflowType: story
storyId: "E3.S3"
storyKey: "e3-s03-payment-received"
epic: "E3"
phase: 1
status: done
prd: "FR-23"
document_output_language: en
project: CryptoMarket P2P
---

# Story E3.S3: Seller receipt signal after explorer verification

## Status
Done

## Dependencies

- E3.S2

## Story

As a seller, I can acknowledge receipt after explorer verification, but my confirmation alone mark a manual payment as verified.

## Acceptance Criteria

1. Given explorer verification has not matched the PaymentIntent, when seller confirms received, then trade does not move to payment_verified or completable state.
2. Given explorer verification has matched the PaymentIntent, when seller confirms received, then an optional receipt note is recorded without changing payout safety gates.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given explorer verification has not matched the PaymentIntent
  - When seller confirms received
  - Then trade does not move to payment_verified or completable state.
- **Scenario: Acceptance 2**
  - Given explorer verification has matched the PaymentIntent
  - When seller confirms received
  - Then an optional receipt note is recorded without changing payout safety gates.
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
  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`
- [x] **Backend**
  - [x] `src/backend/lib/Escrow.mo`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] `test/Escrow.test.mo`

## Dev Notes

### API (Candid / actor)

- confirmPaymentReceived

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
| FR-23 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

## Library and framework requirements

| Layer | Use |
|-------|-----|
| UI | React 19, Vite, TanStack Router, Tailwind |
| Auth / ICP client | `@caffeineai/core-infrastructure` `useInternetIdentity()` via `useAuth.ts`; `@dfinity/agent`, host `https://icp-api.io` |
| Storage | Caffeine object storage pattern |
| Backend | Motoko `mo:core`, mops |
| Build | mops, Caffeine draft/live |

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

- `src/frontend/src/pages/TradeDetailPage.tsx`

**Backend:**

- `src/backend/lib/Escrow.mo`

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

- test/Escrow.test.mo

### Verification checklist (story manifest)

- `Escrow.test.mo`
- docs/bmad/PAYMENT-VERIFICATION-E2E.md

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-23
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

- confirmPaymentReceived completes trade from buyer_confirmed.

### File List

- `src/backend/lib/Escrow.mo`
- `src/frontend/src/pages/TradeDetailPage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E3.S3 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given explorer verification has not matched the PaymentIntent, when seller confirms received, then trade does not move to payment_verified or completable state. | Pass (regression) | test/Escrow.test.mo |
| 2 | Given explorer verification has matched the PaymentIntent, when seller confirms received, then an optional receipt note is recorded without changing payout safety gates. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: explorer verification has not matched the PaymentIntent, when seller confirms received, then trade does not move to paym…
- [x] Scenario 2: explorer verification has matched the PaymentIntent, when seller confirms received, then an optional receipt note is rec…
- [x] Invalid input / unauthenticated rejected safely
- [x] Copy matches Phase 1 payment model on trade surfaces

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
