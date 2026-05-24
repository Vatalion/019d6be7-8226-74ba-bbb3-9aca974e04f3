---
workflowType: story
storyId: "E7.S1"
storyKey: "e7-s01-self-pickup-lock"
epic: "E7"
phase: 1
status: built-deferred
prd: "FR-50"
document_output_language: en
project: CryptoMarket P2P
---

# Story E7.S1: Self-pickup lock (superseded by contract)

## Status
Built — product deferred

## Dependencies

- E2.S1

## Story

As a product owner, physical goods were limited to self-pickup in early Phase 1 — **out of scope** per User Product Contract (Nova Poshta only). Wave 4+ AC stub only.

## Acceptance Criteria

1. Given contract Phase 1.5, when physical listing created, then Nova Poshta is the only offered carrier (E7.S3).
2. Given pickup lock code, when E7.S3 ships, then pickup option remains disabled/hidden.
3. [Wave 4+ stub] Given owner enables self-pickup flag, when listing created, then meetup location + liability waiver required.
4. [Wave 4+ stub] Given self-pickup trade, when buyer confirms handoff in app, then photo evidence + GPS optional required.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given contract Phase 1.5
  - When physical listing created
  - Then Nova Poshta is the only offered carrier (E7.S3).
- **Scenario: Acceptance 2**
  - Given pickup lock code
  - When E7.S3 ships
  - Then pickup option remains disabled/hidden.
- **Scenario: Acceptance 3**
  - Given story preconditions are met
  - When the user completes the primary action
  - Then [Wave 4+ stub] Given owner enables self-pickup flag, when listing created, then meetup location + liability waiver required.
- **Scenario: Acceptance 4**
  - Given story preconditions are met
  - When the user completes the primary action
  - Then [Wave 4+ stub] Given self-pickup trade, when buyer confirms handoff in app, then photo evidence + GPS optional required.
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
  - [x] `src/frontend/src/lib/deliveryPolicy.ts`
  - [x] `src/frontend/src/pages/CreateListingPage.tsx`
- [x] **Backend**
  - [x] `src/backend/lib/Shipping.mo`
- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints
- [x] **Testing:**
  - [x] Manual smoke on affected routes

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
| FR-50 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/lib/deliveryPolicy.ts`
- `src/frontend/src/pages/CreateListingPage.tsx`

**Backend:**

- `src/backend/lib/Shipping.mo`

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

- deliveryPolicy constant check

### Verification checklist (story manifest)

- deliveryPolicy constant
- E7.S3 regression

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-50
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- User-facing self-pickup promise — USER-PRODUCT-CONTRACT §7
- Wave 1–3

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

- PHYSICAL_DELIVERY_LOCKED_TO_PICKUP in deliveryPolicy.ts.
- Carrier selectors hidden on create listing.

### File List

- `src/backend/lib/Shipping.mo`
- `src/frontend/src/lib/deliveryPolicy.ts`
- `src/frontend/src/pages/CreateListingPage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E7.S1 |
| Status | built-deferred |
| QA verdict | Smoke if touched |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given contract Phase 1.5, when physical listing created, then Nova Poshta is the only offered carrier (E7.S3). | Smoke — code present | src/frontend/src/lib/deliveryPolicy.ts |
| 2 | Given pickup lock code, when E7.S3 ships, then pickup option remains disabled/hidden. | Pending | |
| 3 | [Wave 4+ stub] Given owner enables self-pickup flag, when listing created, then meetup location + liability waiver required. | Pending | |
| 4 | [Wave 4+ stub] Given self-pickup trade, when buyer confirms handoff in app, then photo evidence + GPS optional required. | Pending | |

### BDD scenario validation

- [ ] Scenario 1: contract Phase 1.5, when physical listing created, then Nova Poshta is the only offered carrier (E7.S3).
- [ ] Scenario 2: pickup lock code, when E7.S3 ships, then pickup option remains disabled/hidden.
- [ ] Scenario 3: [Wave 4+ stub] Given owner enables self-pickup flag, when listing created, then meetup location + liability waiver requi…
- [ ] Scenario 4: [Wave 4+ stub] Given self-pickup trade, when buyer confirms handoff in app, then photo evidence + GPS optional required.…
- [ ] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [ ] `mops test` passes or story evidence names the verified narrower check
- [ ] Changes only under approved paths (see File structure)
- [ ] `env.json` for canister id
- [ ] Anonymous updates rejected on touched endpoints
- [ ] i18n uk/en for new strings
- [ ] No new primary-nav promotion without approval

### Regression scope

- deliveryPolicy constant check

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [ ] No secrets in repo
- [ ] Input validation on new update methods
- [ ] Rate limits on new public endpoints

### QA recommendation

Full QA before done.
