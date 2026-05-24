---
workflowType: story
storyId: "E11.S5"
storyKey: "e11-s05-saved-search-alerts"
epic: "E11"
phase: 3
status: done
prd: "FR-71"
document_output_language: en
project: CryptoMarket P2P
---

# Story E11.S5: Saved search email/push alerts

## Status
Done

## Dependencies

- E11.S2

## Story

As a buyer, I want notifications when new listings match my saved search.

## Acceptance Criteria

1. Given saved search with alert enabled, when new listing matches filters, then user receives in-app notification within polling SLA.
2. Given notification preferences, when user disables alerts, then no messages sent for that saved search.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given saved search with alert enabled
  - When new listing matches filters
  - Then user receives in-app notification within polling SLA.
- **Scenario: Acceptance 2**
  - Given notification preferences
  - When user disables alerts
  - Then no messages sent for that saved search.
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
  - [x] `src/backend/mixins/engagement-api.mo` setSavedSearchAlerts
  - [x] `src/backend/mixins/messaging-api.mo` shared Notifications helper
  - [x] `src/backend/lib/Engagement.mo` match + notify on createListing
- [x] **Frontend**
  - [x] SavedSearchesPanel alert toggle
  - [x] NotificationContext polls saved_search_match
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] `test/Engagement.test.mo`

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
| FR-71 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

**Backend:**

- `src/backend/mixins/engagement-api.mo`
- `src/backend/mixins/messaging-api.mo`

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

- Design notification channel on IC

### Verification checklist (story manifest)

- Design IC notification channel
- Integration test when channel selected

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-71
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

- SavedSearch.alertsEnabled with setSavedSearchAlerts endpoint.
- createListing triggers in-app saved_search_match notifications for matching enabled searches.
- Frontend toggle + 30s polling via getTradeNotifications.

### File List

- `src/backend/lib/Engagement.mo`
- `src/backend/lib/Notifications.mo`
- `src/backend/lib/Marketplace.mo`
- `src/backend/types.mo`
- `src/backend/mixins/engagement-api.mo`
- `src/backend/mixins/marketplace-api.mo`
- `src/backend/mixins/messaging-api.mo`
- `src/backend/main.mo`
- `src/frontend/src/components/marketplace/SavedSearchesPanel.tsx`
- `src/frontend/src/contexts/NotificationContext.tsx`
- `src/frontend/src/lib/engagementActor.ts`
- `src/frontend/src/i18n/index.ts`
- `test/Engagement.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E11.S5 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given saved search with alert enabled, when new listing matches filters, then user receives in-app notification within polling SLA. | Pass (regression) | test/Engagement.test.mo |
| 2 | Given notification preferences, when user disables alerts, then no messages sent for that saved search. | Pass (regression) | src/backend/lib/Engagement.mo |

### BDD scenario validation

- [x] Scenario 1: saved search with alert enabled, when new listing matches filters, then user receives in-app notification within polling…
- [x] Scenario 2: notification preferences, when user disables alerts, then no messages sent for that saved search.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Design notification channel on IC

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
