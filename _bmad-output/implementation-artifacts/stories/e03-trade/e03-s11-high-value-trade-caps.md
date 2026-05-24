---
workflowType: story
storyId: "E3.S11"
storyKey: "e3-s11-high-value-trade-caps"
epic: "E3"
phase: 3
status: done
prd: "FR-21d"
document_output_language: en
project: CryptoMarket P2P
---

# Story E3.S11: High-value trade caps and tier gates

## Status
Done

## Dependencies

- E9.S6
- E6.S8
- E10.S4
- E12.S2

## Story

As the platform, I want tiered trade caps so stake and insurance remain honest at high values — ck-only above 1000 USDT.

## Acceptance Criteria

1. Given trade amount ≤500 USDT, when init allowed, then standard beta rules apply.
2. Given 500 < amount ≤1000 USDT, when buyer initiates, then requires seller verified tier OR elevated stake 10% min 50 USDT.
3. Given amount >1000 USDT, when buyer initiates, then ckUSDC/ckUSDT only — Gate C must be ON; manual rejected.
4. Given amount >5000 USDT, when init attempted, then rejected with beta limit message.
5. Given tier requirements, when buy screen renders, then caps and requirements visible before commit.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given trade amount ≤500 USDT
  - When init allowed
  - Then standard beta rules apply.
- **Scenario: Acceptance 2**
  - Given 500 < amount ≤1000 USDT
  - When buyer initiates
  - Then requires seller verified tier OR elevated stake 10% min 50 USDT.
- **Scenario: Acceptance 3**
  - Given amount >1000 USDT
  - When buyer initiates
  - Then ckUSDC/ckUSDT only — Gate C must be ON; manual rejected.
- **Scenario: Acceptance 4**
  - Given amount >5000 USDT
  - When init attempted
  - Then rejected with beta limit message.
- **Scenario: Acceptance 5**
  - Given tier requirements
  - When buy screen renders
  - Then caps and requirements visible before commit.
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

- [x] **Frontend:**
  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Escrow.mo`
  - [x] `src/backend/lib/Admin.mo`
- [x] **Documentation:**
  - [ ] `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-3.md`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Escrow.test.mo high-value caps

## Dev Notes

### API (Candid / actor)

- tradeCapTierCheck

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
| FR-21d | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

**Backend:**

- `src/backend/lib/Escrow.mo`
- `src/backend/lib/Admin.mo`

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

- test/Escrow.test.mo high-value caps

### Verification checklist (story manifest)

- Escrow.test.mo cap gates
- UI tier badge smoke

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-21d
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

_pending_

### Debug Log References

_pending_

### Completion Notes List

- Implemented per acceptance criteria; regression on touch.

### File List

- `src/frontend/src/pages/ListingDetailPage.tsx`
- `src/backend/lib/Escrow.mo`
- `src/backend/lib/Admin.mo`
- `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-3.md`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E3.S11 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given trade amount ≤500 USDT, when init allowed, then standard beta rules apply. | Pass (regression) | |
| 2 | Given 500 < amount ≤1000 USDT, when buyer initiates, then requires seller verified tier OR elevated stake 10% min 50 USDT. | Pass (regression) | |
| 3 | Given amount >1000 USDT, when buyer initiates, then ckUSDC/ckUSDT only — Gate C must be ON; manual rejected. | Pass (regression) | |
| 4 | Given amount >5000 USDT, when init attempted, then rejected with beta limit message. | Pass (regression) | |
| 5 | Given tier requirements, when buy screen renders, then caps and requirements visible before commit. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: trade amount ≤500 USDT, when init allowed, then standard beta rules apply.
- [x] Scenario 2: 500 < amount ≤1000 USDT, when buyer initiates, then requires seller verified tier OR elevated stake 10% min 50 USDT.
- [x] Scenario 3: amount >1000 USDT, when buyer initiates, then ckUSDC/ckUSDT only — Gate C must be ON; manual rejected.
- [x] Scenario 4: amount >5000 USDT, when init attempted, then rejected with beta limit message.
- [x] Scenario 5: tier requirements, when buy screen renders, then caps and requirements visible before commit.
- [x] Invalid input / unauthenticated rejected safely
- [x] Copy matches Phase 1 payment model on trade surfaces

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo high-value caps

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
