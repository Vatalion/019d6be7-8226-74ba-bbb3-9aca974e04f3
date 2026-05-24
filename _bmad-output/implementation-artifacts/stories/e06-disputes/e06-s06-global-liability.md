---
workflowType: story
storyId: "E6.S6"
storyKey: "e6-s06-global-liability"
epic: "E6"
phase: 2
status: done
prd: "FR-44a"
document_output_language: en
project: CryptoMarket P2P
---

# Story E6.S6: Global liability state — Wave 3 depth

## Status
Done

## Dependencies

- E6.S3
- E10.S4

## Story

As the platform, I want cross-trade liability tracking with unique IDs, partial clear, and audit trail for repeat offenders.

## Acceptance Criteria

1. Given seller-fault outcome, when liability created, then record liabilityId, amount, currency, reason, initiator, tradeId, timestamp.
2. Given partial stake seizure, when residual > 0, then liability status partial with remaining balance.
3. Given admin partial clear, when applied, then audit entry and updated block rules.
4. Given liability threshold exceeded, when user initiates trade, then blocked with UA message citing liabilityId.
5. Given multiple liabilities, when admin dashboard loads, then sorted by severity and age.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given seller-fault outcome
  - When liability created
  - Then record liabilityId, amount, currency, reason, initiator, tradeId, timestamp.
- **Scenario: Acceptance 2**
  - Given partial stake seizure
  - When residual > 0
  - Then liability status partial with remaining balance.
- **Scenario: Acceptance 3**
  - Given admin partial clear
  - When applied
  - Then audit entry and updated block rules.
- **Scenario: Acceptance 4**
  - Given liability threshold exceeded
  - When user initiates trade
  - Then blocked with UA message citing liabilityId.
- **Scenario: Acceptance 5**
  - Given multiple liabilities
  - When admin dashboard loads
  - Then sorted by severity and age.
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
  - [x] LiabilityRecord with unique IDs, audit trail, partial status
  - [x] createLiability / applyStakeSeizure / partialClearLiability
  - [x] tradeBlockedErrorUa citing liability ID
  - [x] adminListLiabilities + adminPartialClearLiability
- [x] **Frontend**
  - [x] Admin liabilities tab (sorted by severity + age)
- [x] **Testing:**
  - [x] `test/Reputation.test.mo` E6.S6 depth suites

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
| FR-44a | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- test/Reputation.test.mo liability IDs

### Verification checklist (story manifest)

- Extend Reputation.test.mo
- Liability ID migration review

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-44a
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

- Global liability records with unique IDs, partial stake seizure status, admin partial clear with audit.
- Trade/listing gates return UA message citing primary liability ID when threshold exceeded.
- Admin dashboard tab lists open/partial liabilities sorted by remaining balance then age.

### File List

- `src/backend/types.mo`
- `src/backend/lib/Reputation.mo`
- `src/backend/main.mo`
- `src/backend/mixins/admin-api.mo`
- `src/backend/mixins/disputes-api.mo`
- `src/backend/mixins/escrow-api.mo`
- `src/backend/mixins/marketplace-api.mo`
- `src/backend/lib/OnChainSettlement.mo`
- `test/Reputation.test.mo`
- `src/frontend/src/components/admin/LiabilityQueueTable.tsx`
- `src/frontend/src/pages/AdminPage.tsx`
- `src/frontend/src/i18n/index.ts`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E6.S6 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given seller-fault outcome, when liability created, then record liabilityId, amount, currency, reason, initiator, tradeId, timestamp. | Pass (regression) | src/backend/lib/Reputation.mo |
| 2 | Given partial stake seizure, when residual > 0, then liability status partial with remaining balance. | Pass (regression) | test/Reputation.test.mo |
| 3 | Given admin partial clear, when applied, then audit entry and updated block rules. | Pass (regression) | src/backend/mixins/admin-api.mo |
| 4 | Given liability threshold exceeded, when user initiates trade, then blocked with UA message citing liabilityId. | Pass (regression) | src/frontend/src/components/admin/LiabilityQueueTable.tsx |
| 5 | Given multiple liabilities, when admin dashboard loads, then sorted by severity and age. | Pass (regression) | test/Reputation.test.mo |

### BDD scenario validation

- [x] Scenario 1: seller-fault outcome, when liability created, then record liabilityId, amount, currency, reason, initiator, tradeId, tim…
- [x] Scenario 2: partial stake seizure, when residual > 0, then liability status partial with remaining balance.
- [x] Scenario 3: admin partial clear, when applied, then audit entry and updated block rules.
- [x] Scenario 4: liability threshold exceeded, when user initiates trade, then blocked with UA message citing liabilityId.
- [x] Scenario 5: multiple liabilities, when admin dashboard loads, then sorted by severity and age.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Reputation.test.mo liability IDs

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
