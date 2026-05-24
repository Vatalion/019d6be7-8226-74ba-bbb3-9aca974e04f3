---
workflowType: story
storyId: "E3.S8"
storyKey: "e3-s08-upfront-fee-breakdown"
epic: "E3"
phase: "1.5"
status: done
prd: "FR-12"
document_output_language: en
project: CryptoMarket P2P
---

# Story E3.S8: Upfront fee breakdown on buy screen

## Status
Done

## Dependencies

- E2.S3

## Story

As a buyer, I want to see price, platform fee, network, and delivery on the first screen before I commit to buy.

## Acceptance Criteria

1. Given I confirm buy, when checkout opens, then I see item price, platform fee, network, and delivery method before final commit.
2. Given fee config unset, when screen renders, then placeholder or admin default is shown — never hidden fee.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given I confirm buy
  - When checkout opens
  - Then I see item price, platform fee, network, and delivery method before final commit.
- **Scenario: Acceptance 2**
  - Given fee config unset
  - When screen renders
  - Then placeholder or admin default is shown — never hidden fee.
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
  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Admin.mo`
  - [x] `src/backend/mixins/escrow-api.mo`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Escrow.test.mo fee math
  - [x] Flow: listing-buy-signin-guard

## Dev Notes

### API (Candid / actor)

- getTradeFeeQuote
- platformFeeBps

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
| FR-12 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/ListingDetailPage.tsx`

**Backend:**

- `src/backend/lib/Admin.mo`
- `src/backend/mixins/escrow-api.mo`

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

- test/Escrow.test.mo fee math
- Flow: listing-buy-signin-guard

### Verification checklist (story manifest)

- Manual listing buy flow
- i18n fee labels

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-12
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

- `src/frontend/src/pages/ListingDetailPage.tsx`
- `src/backend/lib/Admin.mo`
- `src/backend/mixins/escrow-api.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E3.S8 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given I confirm buy, when checkout opens, then I see item price, platform fee, network, and delivery method before final commit. | Pass (regression) | |
| 2 | Given fee config unset, when screen renders, then placeholder or admin default is shown — never hidden fee. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: I confirm buy, when checkout opens, then I see item price, platform fee, network, and delivery method before final commi…
- [x] Scenario 2: fee config unset, when screen renders, then placeholder or admin default is shown — never hidden fee.
- [x] Invalid input / unauthenticated rejected safely
- [x] Copy matches Phase 1 payment model on trade surfaces

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo fee math
- Flow: listing-buy-signin-guard

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
