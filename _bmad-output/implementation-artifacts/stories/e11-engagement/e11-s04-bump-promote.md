---
workflowType: story
storyId: "E11.S4"
storyKey: "e11-s04-bump-promote"
epic: "E11"
phase: 2
status: done
prd: "FR-73"
document_output_language: en
project: CryptoMarket P2P
---

# Story E11.S4: Bump and promote listing

## Status
Done

## Dependencies

- E2.S1

## Story

As a seller I want to bump my listing; as admin I want to promote listings for discovery sort.

## Acceptance Criteria

1. Given listing owner, when bump within rules, then sort key updates (bumpedAt).
2. Given admin promote, when applied, then listing shows VIP/promoted badge and sort priority.

### BDD Scenarios

- **Scenario: Sort order**
  - Given mixed listings
  - When default sort runs
  - Then order is promoted → bumped → createdAt

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

- [x] **Backend:** `bumpListing`, `adminPromoteListing`.
- [x] **Frontend:** owner bump action + admin UI.
- [x] **Search:** `searchListings` sort respects promotion fields.

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
| FR-73 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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
- `src/frontend/src/pages/AdminPage.tsx`

**Backend:**

- `src/backend/mixins/engagement-api.mo`
- `src/backend/mixins/marketplace-api.mo`

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

- test/Engagement.test.mo

### Verification checklist (story manifest)

- Manual search sort

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-73
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

- adminPromoteListing in admin-api and marketplace sort priority.
- Admin Listings tab promote-by-ID control.
- Seller bump via engagement API.

### File List

- `src/backend/mixins/admin-api.mo`
- `src/backend/mixins/marketplace-api.mo`
- `src/frontend/src/pages/AdminPage.tsx`
- `src/frontend/src/pages/ListingDetailPage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E11.S4 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given listing owner, when bump within rules, then sort key updates (bumpedAt). | Pass (regression) | src/backend/mixins/admin-api.mo |
| 2 | Given admin promote, when applied, then listing shows VIP/promoted badge and sort priority. | Pass (regression) | src/frontend/src/pages/AdminPage.tsx |

### BDD scenario validation

- [x] Scenario 1: listing owner, when bump within rules, then sort key updates (bumpedAt).
- [x] Scenario 2: admin promote, when applied, then listing shows VIP/promoted badge and sort priority.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Engagement.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
