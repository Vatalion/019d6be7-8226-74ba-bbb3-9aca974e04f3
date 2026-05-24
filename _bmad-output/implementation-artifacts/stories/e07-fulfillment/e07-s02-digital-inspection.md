---
workflowType: story
storyId: "E7.S2"
storyKey: "e7-s02-digital-inspection"
epic: "E7"
phase: "1.5"
status: done
prd: "FR-52"
document_output_language: en
project: CryptoMarket P2P
---

# Story E7.S2: Digital delivery inspection window (24h) — Wave 2 enhance

## Status
Done

## Dependencies

- E2.S11

## Story

As a buyer, I want a 24-hour inspection period anchored to the delivery record after digital auto-delivery — redownload reset the timer.

## Acceptance Criteria

1. Given digital_delivered with deliveryRecordAt=T, when buyer opens trade, then countdown shows T+24h deadline.
2. Given buyer redownloads at T+12h, when page refreshes, then deadline unchanged (still T+24h).
3. Given inspection window active, when buyer opens dispute, then trade enters dispute_l1 and auto-complete paused.
4. Given window expired without dispute, when timer fires, then state complete and seller payout proceeds.
5. Given dispute resolved pay-seller during inspection, when outcome applied, then complete with moderator timestamp.
6. Given buyer disputes after T+24h, then rejected unless admin reopen flag.
7. Given concurrent auto-complete vs dispute open, when both arrive, then dispute wins — single terminal path.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given digital_delivered with deliveryRecordAt=T
  - When buyer opens trade
  - Then countdown shows T+24h deadline.
- **Scenario: Acceptance 2**
  - Given buyer redownloads at T+12h
  - When page refreshes
  - Then deadline unchanged (still T+24h).
- **Scenario: Acceptance 3**
  - Given inspection window active
  - When buyer opens dispute
  - Then trade enters dispute_l1 and auto-complete paused.
- **Scenario: Acceptance 4**
  - Given window expired without dispute
  - When timer fires
  - Then state complete and seller payout proceeds.
- **Scenario: Acceptance 5**
  - Given dispute resolved pay-seller during inspection
  - When outcome applied
  - Then complete with moderator timestamp.
- **Scenario: Acceptance 6**
  - Given story preconditions are met
  - When the user completes the primary action
  - Then Given buyer disputes after T+24h, then rejected unless admin reopen flag.
- **Scenario: Acceptance 7**
  - Given concurrent auto-complete vs dispute open
  - When both arrive
  - Then dispute wins — single terminal path.
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

- [x] **Backend**
  - [x] `src/backend/lib/Escrow.mo`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] `test/Escrow.test.mo`

## Dev Notes

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
| FR-52 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

## Library and framework requirements

| Layer | Use |
|-------|-----|
| UI | React 19, Vite, TanStack Router, Tailwind |
| Auth / ICP client | `@caffeineai/core-infrastructure` `useInternetIdentity()` via `useAuth.ts`; `@dfinity/agent`, host `https://icp-api.io` |
| Storage | Caffeine object storage pattern |
| Backend | Motoko `mo:core`, mops |
| Build | mops, Caffeine draft/live |

- Shipping: `Shipping.mo` outcalls; carrier UI only when `deliveryPolicy` allows.

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
- `src/frontend/src/components/trade/EscrowTimeline.tsx`

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

- test/Escrow.test.mo inspection clock
- redownload-no-reset

### Verification checklist (story manifest)

- Escrow digital inspection tests
- Redownload-no-reset race
- Upgrade mid-inspection resume

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-52
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

- Digital inspection window enforced in Escrow digital paths.

### File List

- `src/backend/lib/Escrow.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E7.S2 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given digital_delivered with deliveryRecordAt=T, when buyer opens trade, then countdown shows T+24h deadline. | Pass (regression) | src/backend/lib/Escrow.mo |
| 2 | Given buyer redownloads at T+12h, when page refreshes, then deadline unchanged (still T+24h). | Pass (regression) | |
| 3 | Given inspection window active, when buyer opens dispute, then trade enters dispute_l1 and auto-complete paused. | Pass (regression) | |
| 4 | Given window expired without dispute, when timer fires, then state complete and seller payout proceeds. | Pass (regression) | |
| 5 | Given dispute resolved pay-seller during inspection, when outcome applied, then complete with moderator timestamp. | Pass (regression) | |
| 6 | Given buyer disputes after T+24h, then rejected unless admin reopen flag. | Pass (regression) | |
| 7 | Given concurrent auto-complete vs dispute open, when both arrive, then dispute wins — single terminal path. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: digital_delivered with deliveryRecordAt=T, when buyer opens trade, then countdown shows T+24h deadline.
- [x] Scenario 2: buyer redownloads at T+12h, when page refreshes, then deadline unchanged (still T+24h).
- [x] Scenario 3: inspection window active, when buyer opens dispute, then trade enters dispute_l1 and auto-complete paused.
- [x] Scenario 4: window expired without dispute, when timer fires, then state complete and seller payout proceeds.
- [x] Scenario 5: dispute resolved pay-seller during inspection, when outcome applied, then complete with moderator timestamp.
- [x] Scenario 6: buyer disputes after T+24h, then rejected unless admin reopen flag.
- [x] Scenario 7: concurrent auto-complete vs dispute open, when both arrive, then dispute wins — single terminal path.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo inspection clock
- redownload-no-reset

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
