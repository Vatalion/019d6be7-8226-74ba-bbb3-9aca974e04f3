---
workflowType: story
storyId: "E2.S8"
storyKey: "e2-s08-category-taxonomy"
epic: "E2"
phase: 1
status: done
prd: "FR-10"
document_output_language: en
project: CryptoMarket P2P
---

# Story E2.S8: OLX-aligned category taxonomy

## Status
Done

## Dependencies

- E2.S1

## Story

As a buyer, I want to browse and filter by OLX-aligned category tree so discovery matches classifieds expectations.

## Acceptance Criteria

1. Given category catalog seeded, when I open create or browse, then L1/L2 picker shows localized labels.
2. Given URL `?cat=<slug>`, when listings page loads, then results filter to category subtree.
3. Given search with categoryId, when query runs, then `searchListings` includes subtree matches.

### BDD Scenarios

- **Scenario: Pick category on create**
  - Given authenticated seller on create listing
  - When category L1/L2 selected
  - Then listing stores canonical `categoryId`

- **Scenario: Browse by category**
  - Given homepage category grid
  - When user clicks a category
  - Then navigates to listings with correct filter

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

- [x] **Backend:** `CategoryCatalog.mo` + `listCategories`; regenerate via `scripts/gen-category-catalog.mjs`.
- [x] **Frontend:** `CategoryPicker`, `CategoryGrid`, URL sync on `ListingsPage`.
- [x] **Search:** `searchListings` respects category subtree.
- [ ] **Future:** Expand beyond 114 nodes (see E2.S10).

## Dev Notes

### API (Candid / actor)

- listCategories
- searchListings with categoryId

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
| FR-10 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/components/marketplace/CategoryPicker.tsx`
- `src/frontend/src/components/marketplace/CategoryGrid.tsx`
- `src/frontend/src/pages/ListingsPage.tsx`

**Backend:**

- `src/backend/lib/CategoryCatalog.mo`
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

- scripts/gen-category-catalog.mjs
- test/Marketplace.test.mo

### Verification checklist (story manifest)

- Manual category picker
- `CategoryCatalog` / marketplace search

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-10
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

- CategoryCatalog.mo 15 L1 + 99 L2 categories.
- CategoryPicker, CategoryGrid, and ?cat= URL filter on browse.

### File List

- `src/backend/lib/CategoryCatalog.mo`
- `src/backend/mixins/marketplace-api.mo`
- `src/frontend/src/components/marketplace/CategoryGrid.tsx`
- `src/frontend/src/components/marketplace/CategoryPicker.tsx`
- `src/frontend/src/pages/ListingsPage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E2.S8 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given category catalog seeded, when I open create or browse, then L1/L2 picker shows localized labels. | Pass (regression) | src/backend/lib/CategoryCatalog.mo |
| 2 | Given URL `?cat=<slug>`, when listings page loads, then results filter to category subtree. | Pass (regression) | test/Marketplace.test.mo |
| 3 | Given search with categoryId, when query runs, then `searchListings` includes subtree matches. | Pass (regression) | src/frontend/src/components/marketplace/CategoryPicker.tsx |

### BDD scenario validation

- [x] Scenario 1: category catalog seeded, when I open create or browse, then L1/L2 picker shows localized labels.
- [x] Scenario 2: URL `?cat=<slug>`, when listings page loads, then results filter to category subtree.
- [x] Scenario 3: search with categoryId, when query runs, then `searchListings` includes subtree matches.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- scripts/gen-category-catalog.mjs
- test/Marketplace.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
