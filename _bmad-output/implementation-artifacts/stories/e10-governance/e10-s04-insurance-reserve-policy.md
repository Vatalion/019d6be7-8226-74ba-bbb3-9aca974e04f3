---
workflowType: story
storyId: "E10.S4"
storyKey: "e10-s04-insurance-reserve-policy"
epic: "E10"
phase: 3
status: done
prd: "FR-44a"
document_output_language: en
project: CryptoMarket P2P
---

# Story E10.S4: Capped insurance reserve policy

## Status
Done

## Dependencies

- E3.S8
- E10.S3

## Story

As the platform, I want a capped reserve ledger and payout rules — or remove insurance guarantee copy — before any marketing of buyer protection fund.

## Acceptance Criteria

1. Given reserve policy active, when platform fee accrues, then 40% credits insuranceReserveLedger — not seized stake.
2. Given seller-fault residual after stake, when insurance payout triggered, then min(unrecovered, 20% liquid fund, 100 USDT/user/day, 500 USDT/trade).
3. Given trade >500 USDT, when insurance evaluated, then not offered — stake-only protection UI.
4. Given liquid fund=0, when UI renders, then no full-refund guarantee copy.
5. Given insurance payout, when processed, then dual-admin approval + audit with liabilityId link.
6. Given collusion graph signals (shared wallet/device/II link, reciprocal trades, repeated claims, or rapid account cycling), when payout requested, then hold for manual review.
7. Given payout held for fraud review, when reviewer acts, then decision, rationale, evidence hash, and SLA timestamp are retained in audit log.
8. Given same user exceeds daily/trade payout caps, when payout requested, then excess is denied and copy avoids guarantee language.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given reserve policy active
  - When platform fee accrues
  - Then 40% credits insuranceReserveLedger — not seized stake.
- **Scenario: Acceptance 2**
  - Given seller-fault residual after stake
  - When insurance payout triggered
  - Then min(unrecovered, 20% liquid fund, 100 USDT/user/day, 500 USDT/trade).
- **Scenario: Acceptance 3**
  - Given trade >500 USDT
  - When insurance evaluated
  - Then not offered — stake-only protection UI.
- **Scenario: Acceptance 4**
  - Given liquid fund=0
  - When UI renders
  - Then no full-refund guarantee copy.
- **Scenario: Acceptance 5**
  - Given insurance payout
  - When processed
  - Then dual-admin approval + audit with liabilityId link.
- **Scenario: Acceptance 6**
  - Given collusion graph signals (shared wallet/device/II link, reciprocal trades, repeated claims, or rapid account cycling)
  - When payout requested
  - Then hold for manual review.
- **Scenario: Acceptance 7**
  - Given payout held for fraud review
  - When reviewer acts
  - Then decision, rationale, evidence hash, and SLA timestamp are retained in audit log.
- **Scenario: Acceptance 8**
  - Given same user exceeds daily/trade payout caps
  - When payout requested
  - Then excess is denied and copy avoids guarantee language.
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

- [x] InsuranceReserve ledger + 40% fee accrual
- [x] Capped payout policy + dual-admin + fraud hold
- [x] Honest buyer protection copy (HowPaymentsWork + TradeDetail)
- [x] test/Treasury.test.mo W3-6..8

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

- Policy review
- Treasury reserve tests when implemented

### Verification checklist (story manifest)

- Policy doc review
- Treasury reserve tests
- Fraud hold/audit tests
- Zero-fund copy snapshot

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-44a
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Wave 1–2 marketing insurance claims

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

- Separate insurance ledger from operating treasury; no unlimited guarantee copy when fund empty or trade >500 USDT.

### File List

- `src/backend/lib/InsuranceReserve.mo`
- `src/backend/mixins/insurance-api.mo`
- `src/backend/mixins/governance-api.mo`
- `src/backend/main.mo`
- `test/Treasury.test.mo`
- `src/frontend/src/components/trade/BuyerProtectionBadge.tsx`
- `src/frontend/src/pages/HowPaymentsWorkPage.tsx`
- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/frontend/src/i18n/index.ts`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E10.S4 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given reserve policy active, when platform fee accrues, then 40% credits insuranceReserveLedger — not seized stake. | Pass (regression) | test/Treasury.test.mo |
| 2 | Given seller-fault residual after stake, when insurance payout triggered, then min(unrecovered, 20% liquid fund, 100 USDT/user/day, 500 USDT/trade). | Pass (regression) | src/backend/lib/InsuranceReserve.mo |
| 3 | Given trade >500 USDT, when insurance evaluated, then not offered — stake-only protection UI. | Pass (regression) | src/frontend/src/components/trade/BuyerProtectionBadge.tsx |
| 4 | Given liquid fund=0, when UI renders, then no full-refund guarantee copy. | Pass (regression) | |
| 5 | Given insurance payout, when processed, then dual-admin approval + audit with liabilityId link. | Pass (regression) | |
| 6 | Given collusion graph signals (shared wallet/device/II link, reciprocal trades, repeated claims, or rapid account cycling), when payout requested, then hold for manual review. | Pass (regression) | |
| 7 | Given payout held for fraud review, when reviewer acts, then decision, rationale, evidence hash, and SLA timestamp are retained in audit log. | Pass (regression) | |
| 8 | Given same user exceeds daily/trade payout caps, when payout requested, then excess is denied and copy avoids guarantee language. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: reserve policy active, when platform fee accrues, then 40% credits insuranceReserveLedger — not seized stake.
- [x] Scenario 2: seller-fault residual after stake, when insurance payout triggered, then min(unrecovered, 20% liquid fund, 100 USDT/user…
- [x] Scenario 3: trade >500 USDT, when insurance evaluated, then not offered — stake-only protection UI.
- [x] Scenario 4: liquid fund=0, when UI renders, then no full-refund guarantee copy.
- [x] Scenario 5: insurance payout, when processed, then dual-admin approval + audit with liabilityId link.
- [x] Scenario 6: collusion graph signals (shared wallet/device/II link, reciprocal trades, repeated claims, or rapid account cycling), wh…
- [x] Scenario 7: payout held for fraud review, when reviewer acts, then decision, rationale, evidence hash, and SLA timestamp are retaine…
- [x] Scenario 8: same user exceeds daily/trade payout caps, when payout requested, then excess is denied and copy avoids guarantee langua…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Policy review
- Treasury reserve tests when implemented

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
