---
workflowType: story
storyId: "E1.S1"
storyKey: "e1-s01-ii-login"
epic: "E1"
phase: 1
status: done
prd: "FR-1"
document_output_language: en
project: CryptoMarket P2P
---

# Story E1.S1: Internet Identity login

## Status
Done

## Dependencies

- See epic dependencies in [`epics.md`](../../../planning-artifacts/epics.md)

## Story

As a user, I want to sign in with Internet Identity so I can access protected marketplace actions with a pseudonymous principal.

## Acceptance Criteria

1. Given I am logged out, when I choose Sign in, then II auth completes and my principal is available to the app.
2. Given I am authenticated, when I call update endpoints, then caller principal matches session.
3. Given anonymous caller, when I call protected updates, then request is rejected.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given I am logged out
  - When I choose Sign in
  - Then II auth completes and my principal is available to the app.
- **Scenario: Acceptance 2**
  - Given I am authenticated
  - When I call update endpoints
  - Then caller principal matches session.
- **Scenario: Acceptance 3**
  - Given anonymous caller
  - When I call protected updates
  - Then request is rejected.
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

- [x] **Frontend**
  - [x] `src/frontend/src/App.tsx`
  - [x] `src/frontend/src/components/ProfileGuard.tsx`
  - [x] `src/frontend/src/hooks/useAuth.ts`
  - [x] `src/frontend/src/main.tsx`
- [x] **Backend**
  - [x] `src/backend/lib/Auth.mo`
  - [x] `src/backend/mixins/auth-api.mo`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] `test/Auth.test.mo`

## Dev Notes

### API (Candid / actor)

- Internet Identity via useAuth.ts
- Principal.isAnonymous guard on shared updates

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
| FR-1 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/hooks/useAuth.ts`
- `src/frontend/src/main.tsx`
- `src/frontend/src/App.tsx`
- `src/frontend/src/components/ProfileGuard.tsx`

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
- Flow: crypto-market-p2p.auth-entry-public

### Verification checklist (story manifest)

- Flow: `crypto-market-p2p.auth-entry-public`
- `Auth.test.mo`

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-1
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

- Wired Internet Identity via useAuth and @caffeineai/core-infrastructure useInternetIdentity().
- Protected routes use inline GuardedPage wrapper in App.tsx with ProfileGuard.
- Anonymous principals rejected on shared updates via Auth.assertNotAnonymous.

### File List

- `src/backend/lib/Auth.mo`
- `src/backend/mixins/auth-api.mo`
- `src/frontend/src/App.tsx`
- `src/frontend/src/components/ProfileGuard.tsx`
- `src/frontend/src/hooks/useAuth.ts`
- `src/frontend/src/main.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E1.S1 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given I am logged out, when I choose Sign in, then II auth completes and my principal is available to the app. | Pass (regression) | src/frontend/src/hooks/useAuth.ts |
| 2 | Given I am authenticated, when I call update endpoints, then caller principal matches session. | Pass (regression) | src/backend/mixins/auth-api.mo |
| 3 | Given anonymous caller, when I call protected updates, then request is rejected. | Pass (regression) | test/Auth.test.mo |

### BDD scenario validation

- [x] Scenario 1: I am logged out, when I choose Sign in, then II auth completes and my principal is available to the app.
- [x] Scenario 2: I am authenticated, when I call update endpoints, then caller principal matches session.
- [x] Scenario 3: anonymous caller, when I call protected updates, then request is rejected.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Auth.test.mo
- Flow: crypto-market-p2p.auth-entry-public

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
