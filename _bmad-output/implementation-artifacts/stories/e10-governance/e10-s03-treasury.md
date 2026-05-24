---
workflowType: story
storyId: "E10.S3"
storyKey: "e10-s03-treasury"
epic: "E10"
phase: 3
status: built-deferred
prd: "FR-62"
document_output_language: en
project: CryptoMarket P2P
---

# Story E10.S3: Treasury fee and withdrawals

## Status
Built — product deferred

## Dependencies

- E10.S1

## Story

As governance, I want treasury accounting for platform fees when enabled.

## Acceptance Criteria

1. Given treasury enabled, when platform fee accrues on completed trade, then treasury balance updates per fee schedule.
2. Given governance withdrawal proposal passes, when executed, then funds move per quorum rules.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given treasury enabled
  - When platform fee accrues on completed trade
  - Then treasury balance updates per fee schedule.
- **Scenario: Acceptance 2**
  - Given governance withdrawal proposal passes
  - When executed
  - Then funds move per quorum rules.
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

**Product-deferred:** do not expand UX surface or marketing without PM approval. Bugfixes only when explicitly tasked.

## Tasks / Subtasks

- [x] **Frontend**
  - [x] `src/frontend/src/pages/GovernancePage.tsx`
- [x] **Backend**
  - [x] `src/backend/lib/Treasury.mo`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] Manual smoke on affected routes
- [x] **Product deferral** — code present, nav/marketing gated

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
| FR-62 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/GovernancePage.tsx`

**Backend:**

- `src/backend/lib/Treasury.mo`

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

- Manual treasury panel

### Verification checklist (story manifest)

- Manual treasury panel smoke
- Extend Treasury.mo tests when enabled

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-62
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Phase 1

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

- Treasury.mo fee accrual hooks; treasury panel in governance UI.

**Known gaps:**
- Treasury withdrawals require governance enablement.

### File List

- `src/backend/lib/Treasury.mo`
- `src/frontend/src/pages/GovernancePage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E10.S3 |
| Status | built-deferred |
| QA verdict | Smoke if touched |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given treasury enabled, when platform fee accrues on completed trade, then treasury balance updates per fee schedule. | Smoke — code present | src/backend/lib/Treasury.mo |
| 2 | Given governance withdrawal proposal passes, when executed, then funds move per quorum rules. | Pending | |

### BDD scenario validation

- [ ] Scenario 1: treasury enabled, when platform fee accrues on completed trade, then treasury balance updates per fee schedule.
- [ ] Scenario 2: governance withdrawal proposal passes, when executed, then funds move per quorum rules.
- [ ] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [ ] `mops test` passes or story evidence names the verified narrower check
- [ ] Changes only under approved paths (see File structure)
- [ ] `env.json` for canister id
- [ ] Anonymous updates rejected on touched endpoints
- [ ] i18n uk/en for new strings
- [ ] No new primary-nav promotion without approval

### Regression scope

- Manual treasury panel

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [ ] No secrets in repo
- [ ] Input validation on new update methods
- [ ] Rate limits on new public endpoints

### QA recommendation

Full QA before done.
