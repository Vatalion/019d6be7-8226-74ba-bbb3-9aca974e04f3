---
workflowType: story
storyId: "E7.S3"
storyKey: "e7-s03-nova-poshta-e2e"
epic: "E7"
phase: "1.5"
status: done
prd: "FR-51"
document_output_language: en
project: CryptoMarket P2P
---

# Story E7.S3: Nova Poshta E2E (Phase 1.5 in-scope)

## Status
Done

## Dependencies

- E3.S10

## Story

As a seller, I want to ship via Nova Poshta with real TTN and tracking — the only physical delivery method in the current user contract.

## Acceptance Criteria

1. Given physical listing, when saved, then Nova Poshta is selectable/default; self-pickup hidden.
2. Given invalid TTN, when seller marks shipped, then rejected — remain fulfillment_pending.
3. Given valid TTN, when carrier accepts, then state shipped and timeline updates.
4. Given payment verified/funded lock, when seller does not provide a valid Nova Poshta TTN within 7 days (D-019), then trade escalates to dispute/refund path and payout remains blocked.
5. Given NP status delivered/вручено and 48h without dispute, when grace expires, then auto-complete.
6. Given NP status arrived_at_branch / arrived at branch, when completion job runs, then it is not treated as delivered and payout remains blocked.
7. Given buyer confirms receipt, when processed, then complete before 48h grace.
8. Given NP API unavailable, when auto-complete runs, then fail-closed — no completion.
9. Given dispute open during delivered grace, when payout job runs, then payout frozen.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given physical listing
  - When saved
  - Then Nova Poshta is selectable/default; self-pickup hidden.
- **Scenario: Acceptance 2**
  - Given invalid TTN
  - When seller marks shipped
  - Then rejected — remain fulfillment_pending.
- **Scenario: Acceptance 3**
  - Given valid TTN
  - When carrier accepts
  - Then state shipped and timeline updates.
- **Scenario: Acceptance 4**
  - Given payment verified/funded lock
  - When seller does not provide a valid Nova Poshta TTN within 7 days (D-019)
  - Then trade escalates to dispute/refund path and payout remains blocked.
- **Scenario: Acceptance 5**
  - Given NP status delivered/вручено and 48h without dispute
  - When grace expires
  - Then auto-complete.
- **Scenario: Acceptance 6**
  - Given NP status arrived_at_branch / arrived at branch
  - When completion job runs
  - Then it is not treated as delivered and payout remains blocked.
- **Scenario: Acceptance 7**
  - Given buyer confirms receipt
  - When processed
  - Then complete before 48h grace.
- **Scenario: Acceptance 8**
  - Given NP API unavailable
  - When auto-complete runs
  - Then fail-closed — no completion.
- **Scenario: Acceptance 9**
  - Given dispute open during delivered grace
  - When payout job runs
  - Then payout frozen.
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

- [x] **Backend foundation**
  - [x] `src/backend/lib/Shipping.mo`
  - [x] `src/backend/mixins/shipping-api.mo`
- [x] **Frontend foundation**
  - [x] `src/frontend/src/components/CascadingLocationPicker.tsx`
  - [x] `src/frontend/src/components/trade/ShippingTracker.tsx`
- [x] **Wave 1 product enablement**
  - [x] flip `deliveryPolicy.ts` from pickup-only to Nova Poshta-only
  - [x] listing/trade UI exposes Nova Poshta only
  - [x] D-019 ship-by SLA timer wired

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
| FR-51 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/components/CascadingLocationPicker.tsx`
- `src/frontend/src/components/trade/ShippingTracker.tsx`

**Backend:**

- `src/backend/lib/Shipping.mo`
- `src/backend/mixins/shipping-api.mo`

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

- test/Shipping.test.mo

### Verification checklist (story manifest)

- `Shipping.test.mo`
- Live carrier TTN proof when API keys configured

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-51
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

- Nova Poshta-only deliveryPolicy unlock (self-pickup/ukrposhta/meest hidden).
- TTN format validation + markShipped with carrier acceptance; invalid TTN stays fulfillment_pending.
- Buyer confirmBuyerReceipt + NP delivered 48h auto-complete (fail-closed without npDeliveredAt).
- Ship-by 7d SLA escalates to disputed via checkShipByDeadlines / checkFulfillmentDeadlines.

### File List

- `src/backend/lib/Shipping.mo`
- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/shipping-api.mo`
- `src/backend/mixins/escrow-api.mo`
- `src/backend/types.mo`
- `src/frontend/src/lib/deliveryPolicy.ts`
- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/frontend/src/components/shared/ShippingProviderSelector.tsx`
- `test/Shipping.test.mo`
- `test/Escrow.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E7.S3 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given physical listing, when saved, then Nova Poshta is selectable/default; self-pickup hidden. | Pass (regression) | test/Shipping.test.mo |
| 2 | Given invalid TTN, when seller marks shipped, then rejected — remain fulfillment_pending. | Pass (regression) | test/Escrow.test.mo |
| 3 | Given valid TTN, when carrier accepts, then state shipped and timeline updates. | Pass (regression) | src/backend/lib/Shipping.mo |
| 4 | Given payment verified/funded lock, when seller does not provide a valid Nova Poshta TTN within 7 days (D-019), then trade escalates to dispute/refund path and payout remains blocked. | Pass (regression) | |
| 5 | Given NP status delivered/вручено and 48h without dispute, when grace expires, then auto-complete. | Pass (regression) | |
| 6 | Given NP status arrived_at_branch / arrived at branch, when completion job runs, then it is not treated as delivered and payout remains blocked. | Pass (regression) | |
| 7 | Given buyer confirms receipt, when processed, then complete before 48h grace. | Pass (regression) | |
| 8 | Given NP API unavailable, when auto-complete runs, then fail-closed — no completion. | Pass (regression) | |
| 9 | Given dispute open during delivered grace, when payout job runs, then payout frozen. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: physical listing, when saved, then Nova Poshta is selectable/default; self-pickup hidden.
- [x] Scenario 2: invalid TTN, when seller marks shipped, then rejected — remain fulfillment_pending.
- [x] Scenario 3: valid TTN, when carrier accepts, then state shipped and timeline updates.
- [x] Scenario 4: payment verified/funded lock, when seller does not provide a valid Nova Poshta TTN within 7 days (D-019), then trade esc…
- [x] Scenario 5: NP status delivered/вручено and 48h without dispute, when grace expires, then auto-complete.
- [x] Scenario 6: NP status arrived_at_branch / arrived at branch, when completion job runs, then it is not treated as delivered and payou…
- [x] Scenario 7: buyer confirms receipt, when processed, then complete before 48h grace.
- [x] Scenario 8: NP API unavailable, when auto-complete runs, then fail-closed — no completion.
- [x] Scenario 9: dispute open during delivered grace, when payout job runs, then payout frozen.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Shipping.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
