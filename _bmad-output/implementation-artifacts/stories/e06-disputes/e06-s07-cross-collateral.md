---
workflowType: story
storyId: "E6.S7"
storyKey: "e6-s07-cross-collateral"
epic: "E6"
phase: 2
status: done
prd: "FR-44"
document_output_language: en
project: CryptoMarket P2P
---

# Story E6.S7: Cross-collateral waterfall — Wave 3 depth

## Status
Done

## Dependencies

- E6.S6
- E9.S6
- E6.S8
- E10.S4

## Story

As the platform, I want enforceable liability waterfall: stake → on-chain refund → insurance → account restriction — with honest manual-chain copy.

## Acceptance Criteria

1. Given manual payment_verified + seller fault, when settlement runs, then stake seizure + account restriction only — no custodial recovery copy.
2. Given funded_locked ck trade + seller fault, when settlement runs, then stake → on-chain refund → insurance (if fund) → liability.
3. Given waterfall exhausted with residual, when complete, then buyer sees partial recovery copy — not full refund promise.
4. Given insurance payout eligible, when stake also available, then stake seized first — insurance is last resort.
5. Given seller at fault, when buyer refund obligation P, then S=max(0.05×P, 10 USDT) seized before insurance.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given manual payment_verified + seller fault
  - When settlement runs
  - Then stake seizure + account restriction only — no custodial recovery copy.
- **Scenario: Acceptance 2**
  - Given funded_locked ck trade + seller fault
  - When settlement runs
  - Then stake → on-chain refund → insurance (if fund) → liability.
- **Scenario: Acceptance 3**
  - Given waterfall exhausted with residual
  - When complete
  - Then buyer sees partial recovery copy — not full refund promise.
- **Scenario: Acceptance 4**
  - Given insurance payout eligible
  - When stake also available
  - Then stake seized first — insurance is last resort.
- **Scenario: Acceptance 5**
  - Given seller at fault
  - When buyer refund obligation P
  - Then S=max(0.05×P, 10 USDT) seized before insurance.
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

- [x] **Phase 1** account restrictions via isTradeBlocked (no custodial seizure)
- [x] **Wave 3 depth** LiabilityWaterfall: stake → on-chain refund (escrow) → insurance → restriction
- [x] Honest manual vs ck copy (SellerFaultSettlementPanel + i18n)
- [x] test/LiabilityWaterfall.test.mo W3-9

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
| FR-44 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/backend/mixins/escrow-api.mo`
- `src/backend/lib/Treasury.mo`

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

- Waterfall integration manual vs ck

### Verification checklist (story manifest)

- Waterfall integration tests
- Manual vs ck path copy review

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-44
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Custodial seizure on manual chains

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

- Seller-fault waterfall seizes stake first (S=max(5%×P,10 USDT)), then requests capped insurance on ck path only.
- Manual path: stake + account restriction — never custodial recovery copy (D-041).
- getSellerFaultSettlementView + TradeDetail honest copy for partial/on-chain recovery.

**Known gaps:**
- Cross-wallet ck collateral seizure (step 3) deferred — Gate C scope.

### File List

- `src/backend/types.mo`
- `src/backend/lib/LiabilityWaterfall.mo`
- `src/backend/mixins/disputes-api.mo`
- `src/backend/main.mo`
- `test/LiabilityWaterfall.test.mo`
- `src/frontend/src/components/trade/SellerFaultSettlementPanel.tsx`
- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/frontend/src/i18n/index.ts`
- `src/frontend/src/backend.d.ts`
- `src/frontend/src/backend.ts`
- `src/frontend/src/mocks/backend.ts`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E6.S7 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given manual payment_verified + seller fault, when settlement runs, then stake seizure + account restriction only — no custodial recovery copy. | Pass (known gaps) | src/backend/lib/LiabilityWaterfall.mo |
| 2 | Given funded_locked ck trade + seller fault, when settlement runs, then stake → on-chain refund → insurance (if fund) → liability. | Pass (known gaps) | test/LiabilityWaterfall.test.mo |
| 3 | Given waterfall exhausted with residual, when complete, then buyer sees partial recovery copy — not full refund promise. | Pass (known gaps) | src/frontend/src/components/trade/SellerFaultSettlementPanel.tsx |
| 4 | Given insurance payout eligible, when stake also available, then stake seized first — insurance is last resort. | Pass (known gaps) | |
| 5 | Given seller at fault, when buyer refund obligation P, then S=max(0.05×P, 10 USDT) seized before insurance. | Pass (known gaps) | |

### BDD scenario validation

- [x] Scenario 1: manual payment_verified + seller fault, when settlement runs, then stake seizure + account restriction only — no custodi…
- [x] Scenario 2: funded_locked ck trade + seller fault, when settlement runs, then stake → on-chain refund → insurance (if fund) → liabil…
- [x] Scenario 3: waterfall exhausted with residual, when complete, then buyer sees partial recovery copy — not full refund promise.
- [x] Scenario 4: insurance payout eligible, when stake also available, then stake seized first — insurance is last resort.
- [x] Scenario 5: seller at fault, when buyer refund obligation P, then S=max(0.05×P, 10 USDT) seized before insurance.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Waterfall integration manual vs ck

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
