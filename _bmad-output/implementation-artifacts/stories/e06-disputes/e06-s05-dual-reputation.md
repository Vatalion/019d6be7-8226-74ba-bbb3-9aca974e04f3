---
workflowType: story
storyId: "E6.S5"
storyKey: "e6-s05-dual-reputation"
epic: "E6"
phase: 2
status: done
prd: "FR-43"
document_output_language: en
project: CryptoMarket P2P
---

# Story E6.S5: Dual buyer/seller reputation

## Status
Done

## Dependencies

- E6.S3

## Story

As the platform, I want separate buyer and seller reputation scores so trust is context-aware.

## Acceptance Criteria

1. Given user record, when reputation displayed on seller profile, then sellerScore is shown; on buyer context, buyerScore.
2. Given migration from single `reputationScore`, when upgrade runs, then existing score maps to trustScore and role scores initialize safely.

### BDD Scenarios

- **Scenario: Dual scores on profile**
  - Given user with both buyer and seller history
  - When public profile renders
  - Then tabs or sections show role-specific scores

- **Scenario: Migration**
  - Given pre-migration users
  - When postupgrade runs
  - Then no data loss for trust tier gates

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

- [x] **Backend:** Extend `Reputation` type in `types.mo` + `Reputation.mo`.
- [x] **Migration:** Stable upgrade path for in-flight actor data.
- [x] **Frontend:** Profile and dispute UI consume dual scores.
- [x] **Testing:** Extend `Reputation.test.mo`.

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
| FR-43 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/ProfilePage.tsx`

**Backend:**

- `src/backend/lib/Reputation.mo`
- `src/backend/types.mo`

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

- test/Reputation.test.mo

### Verification checklist (story manifest)

- `Reputation.test.mo` dual-score regression
- `ReputationStats` role-specific UI regression

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-43
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

Brownfield reconciliation (2026-05-23)

### Debug Log References

Code audit against `src/` and `test/` on 2026-05-23.

### Completion Notes List

- Dual buyerScore/sellerScore with reputationScore as trust tier gate.
- ensureDualScores maps pre-migration reputationScore to both role scores.

### File List

- `src/backend/lib/Reputation.mo`
- `src/backend/types.mo`
- `src/backend/lib/Auth.mo`
- `src/frontend/src/components/profile/ReputationStats.tsx`
- `test/Reputation.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E6.S5 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given user record, when reputation displayed on seller profile, then sellerScore is shown; on buyer context, buyerScore. | Pass (regression) | test/Reputation.test.mo |
| 2 | Given migration from single `reputationScore`, when upgrade runs, then existing score maps to trustScore and role scores initialize safely. | Pass (regression) | src/frontend/src/components/profile/ReputationStats.tsx |

### BDD scenario validation

- [x] Scenario 1: user record, when reputation displayed on seller profile, then sellerScore is shown; on buyer context, buyerScore.
- [x] Scenario 2: migration from single `reputationScore`, when upgrade runs, then existing score maps to trustScore and role scores initi…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Reputation.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
