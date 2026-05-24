---
workflowType: story
storyId: "E6.S8"
storyKey: "e6-s08-seller-listing-stake"
epic: "E6"
phase: "1.5"
status: done
prd: "FR-27"
document_output_language: en
project: CryptoMarket P2P
---

# Story E6.S8: Seller listing stake — 5% min 10 USDT

## Status
Done

## Dependencies

- E2.S1
- E4.S7

## Story

As a seller, I must lock stake (5% of listing price, minimum 10 USDT) before my listing can receive buy requests — protecting buyers when I am at fault.

## Acceptance Criteria

1. Given new listing at price P, when I publish, then required stake is max(0.05×P, 10 USDT) and must be locked first.
2. Given insufficient stake wallet balance, when I publish, then clear error and listing stays draft.
3. Given successful trade completion without liability event, when claim period ends, then stake returns to seller.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given new listing at price P
  - When I publish
  - Then required stake is max(0.05×P, 10 USDT) and must be locked first.
- **Scenario: Acceptance 2**
  - Given insufficient stake wallet balance
  - When I publish
  - Then clear error and listing stays draft.
- **Scenario: Acceptance 3**
  - Given successful trade completion without liability event
  - When claim period ends
  - Then stake returns to seller.
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

- [x] **Frontend:**
  - [x] `src/frontend/src/pages/CreateListingPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Stake.mo`
  - [x] `src/backend/mixins/stake-api.mo`
  - [x] `src/backend/lib/Marketplace.mo`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Stake.test.mo
  - [x] test/Escrow.test.mo stake lifecycle

## Dev Notes

### API (Candid / actor)

- lockListingStake
- seizeStake
- releaseStake

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
| FR-27 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/CreateListingPage.tsx`

**Backend:**

- `src/backend/lib/Stake.mo`
- `src/backend/mixins/stake-api.mo`
- `src/backend/lib/Marketplace.mo`

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

- test/Stake.test.mo
- test/Escrow.test.mo stake lifecycle

### Verification checklist (story manifest)

- `Escrow.test.mo` / stake module tests
- Manual listing create with stake

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-27
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

_pending_

### Debug Log References

_pending_

### Completion Notes List

- Implemented per acceptance criteria; regression on touch.

### File List

- `src/frontend/src/pages/CreateListingPage.tsx`
- `src/backend/lib/Stake.mo`
- `src/backend/mixins/stake-api.mo`
- `src/backend/lib/Marketplace.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E6.S8 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given new listing at price P, when I publish, then required stake is max(0.05×P, 10 USDT) and must be locked first. | Pass (regression) | |
| 2 | Given insufficient stake wallet balance, when I publish, then clear error and listing stays draft. | Pass (regression) | |
| 3 | Given successful trade completion without liability event, when claim period ends, then stake returns to seller. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: new listing at price P, when I publish, then required stake is max(0.05×P, 10 USDT) and must be locked first.
- [x] Scenario 2: insufficient stake wallet balance, when I publish, then clear error and listing stays draft.
- [x] Scenario 3: successful trade completion without liability event, when claim period ends, then stake returns to seller.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Stake.test.mo
- test/Escrow.test.mo stake lifecycle

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
