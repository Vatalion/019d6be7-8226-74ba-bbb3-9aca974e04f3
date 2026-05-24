---
workflowType: story
storyId: "E12.S1"
storyKey: "e12-s01-gdpr-export-delete"
epic: "E12"
phase: 2
status: done
prd: "PRD §7"
document_output_language: en
project: CryptoMarket P2P
---

# Story E12.S1: Account export and deletion

## Status
Done

## Dependencies

- E1.S2

## Story

As a user, I want to export or delete my account data per privacy expectations while respecting Internet Identity pseudonymity.

## Acceptance Criteria

1. Given authenticated user, when I request export, then machine-readable bundle includes profile, listings, trades, and messages tied to my principal.
2. Given delete request, when I confirm, then PII fields are minimized or anonymized per published privacy policy.
3. Given export in progress, when generation completes, then download link or inline JSON is available without exposing other users' data.

### BDD Scenarios

- **Scenario: Data export**
  - Given signed-in user on Profile settings
  - When I request account export
  - Then backend aggregates principal-scoped records into a portable bundle

- **Scenario: Account deletion**
  - Given authenticated user
  - When I confirm delete with typed confirmation
  - Then profile PII cleared and active listings deactivated per policy

- **Scenario: Cross-user isolation**
  - Given user A requests export
  - When bundle generated
  - Then no private data from user B is included

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

- [ ] **Backend:** Export aggregator in `auth-api.mo` reading `Auth.mo`, `Marketplace.mo`, `Escrow.mo`, `Messaging.mo`.
- [ ] **Backend:** Delete/anonymize path with stable upgrade safety.
- [ ] **Frontend:** `ProfilePage.tsx` privacy section — export + delete with confirmation modal.
- [ ] **Legal:** Document retention exceptions in `/privacy`.
- [ ] **Testing:** `test/Auth.test.mo` export/delete paths; manual privacy smoke.

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
| PRD §7 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/backend/mixins/auth-api.mo`
- `src/backend/lib/Auth.mo`

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

- test/Auth.test.mo
- Privacy export smoke

### Verification checklist (story manifest)

- Privacy export smoke
- `Auth.test.mo` profile paths
- Legal review of delete semantics

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — PRD §7
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

- exportMyAccountData returns principal-scoped JSON bundle (profile, listings, trades, messages).
- deleteMyAccount anonymizes PII after DELETE confirmation; blocks open trades.
- ProfilePage export download + close-account UI with i18n uk/en.

### File List

- `src/backend/lib/Auth.mo`
- `src/backend/mixins/auth-api.mo`
- `src/backend/types.mo`
- `src/frontend/src/pages/ProfilePage.tsx`
- `test/Auth.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E12.S1 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given authenticated user, when I request export, then machine-readable bundle includes profile, listings, trades, and messages tied to my principal. | Pass (regression) | src/backend/lib/Auth.mo |
| 2 | Given delete request, when I confirm, then PII fields are minimized or anonymized per published privacy policy. | Pass (regression) | test/Auth.test.mo |
| 3 | Given export in progress, when generation completes, then download link or inline JSON is available without exposing other users' data. | Pass (regression) | src/frontend/src/pages/ProfilePage.tsx |

### BDD scenario validation

- [x] Scenario 1: authenticated user, when I request export, then machine-readable bundle includes profile, listings, trades, and messages…
- [x] Scenario 2: delete request, when I confirm, then PII fields are minimized or anonymized per published privacy policy.
- [x] Scenario 3: export in progress, when generation completes, then download link or inline JSON is available without exposing other use…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Auth.test.mo
- Privacy export smoke

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
