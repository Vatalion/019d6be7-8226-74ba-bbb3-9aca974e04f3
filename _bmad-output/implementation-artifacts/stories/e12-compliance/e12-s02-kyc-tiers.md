---
workflowType: story
storyId: "E12.S2"
storyKey: "e12-s02-kyc-tiers"
epic: "E12"
phase: 3
status: done
prd: "FR-4a"
document_output_language: en
project: CryptoMarket P2P
---

# Story E12.S2: Optional KYC tiers

## Status
Done

## Dependencies

- E1.S2

## Story

As a power seller, I want an admin-assigned verified tier for higher limits during beta; external KYC provider integration remains deferred.

## Acceptance Criteria

1. Given admin assigns verified tier, when the user's profile and limit checks run, then the verified badge shows and higher limits apply.
2. Given unverified user, when tier not required, then pseudonymous II login remains default.
3. Given external KYC provider integration is requested, when Wave 1-3 scope is evaluated, then it remains explicitly deferred until legal review and vendor selection.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given admin assigns verified tier
  - When the user's profile and limit checks run
  - Then the verified badge shows and higher limits apply.
- **Scenario: Acceptance 2**
  - Given unverified user
  - When tier not required
  - Then pseudonymous II login remains default.
- **Scenario: Acceptance 3**
  - Given external KYC provider integration is requested
  - When Wave 1-3 scope is evaluated
  - Then it remains explicitly deferred until legal review and vendor selection.
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
  - [x] KycTier enum + adminSetUserKycTier
  - [x] Verified tier doubles trade limits
- [x] **Frontend**
  - [x] Profile verified badge
  - [x] Admin KYC+/- in user table
- [x] **Testing:**
  - [x] Reputation.test.mo KYC suites

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
| FR-4a | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/backend/lib/Auth.mo`
- `src/backend/lib/Reputation.mo`

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

- Design review before implementation

### Verification checklist (story manifest)

- `Reputation.test.mo` KYC tier regression
- Design review with legal before external provider integration

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-4a
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Phase 1 default
- Wave 1–3 — external KYC provider integration

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

- Phase 1 substitute: admin manual tier assignment (no external KYC provider).
- External provider flow deferred until legal + vendor selected.

**Known gaps:**
- External KYC provider integration requires vendor API keys + legal review.

### File List

- `src/backend/types.mo`
- `src/backend/lib/Reputation.mo`
- `src/backend/lib/Admin.mo`
- `src/backend/mixins/admin-api.mo`
- `src/frontend/src/pages/ProfilePage.tsx`
- `src/frontend/src/components/admin/UserManagementTable.tsx`
- `test/Reputation.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E12.S2 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given admin assigns verified tier, when the user's profile and limit checks run, then the verified badge shows and higher limits apply. | Pass (known gaps) | test/Reputation.test.mo |
| 2 | Given unverified user, when tier not required, then pseudonymous II login remains default. | Pass (known gaps) | src/frontend/src/pages/ProfilePage.tsx |
| 3 | Given external KYC provider integration is requested, when Wave 1-3 scope is evaluated, then it remains explicitly deferred until legal review and vendor selection. | Pass (known gaps) | src/backend/mixins/admin-api.mo |

### BDD scenario validation

- [x] Scenario 1: admin assigns verified tier, when the user's profile and limit checks run, then the verified badge shows and higher limi…
- [x] Scenario 2: unverified user, when tier not required, then pseudonymous II login remains default.
- [x] Scenario 3: external KYC provider integration is requested, when Wave 1-3 scope is evaluated, then it remains explicitly deferred un…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Design review before implementation

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
