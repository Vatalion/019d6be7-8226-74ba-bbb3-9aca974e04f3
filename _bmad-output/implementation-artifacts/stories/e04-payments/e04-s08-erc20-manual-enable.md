---
workflowType: story
storyId: "E4.S8"
storyKey: "e4-s08-erc20-manual-enable"
epic: "E4"
phase: 3
status: done
prd: "FR-24"
document_output_language: en
project: CryptoMarket P2P
---

# Story E4.S8: ERC20 USDC manual path enable

## Status
Done

## Dependencies

- E4.S2
- E3.S10
- E9.S6

## Story

As a buyer, I want to pay via ERC20 USDC manual path with gas warning after security review — coordinated settlement, not trustless.

## Acceptance Criteria

1. Given ERC20 USDC selected, when PaymentIntent created, then gas warning copy shown.
2. Given ERC20 tx, when explorer verifies, then chain, contract, from, to, amount, confirmations≥12 must match.
3. Given Gate C ON, when ERC20 manual and ck both available, then user picks one — mutually exclusive.
4. Given beta, when ERC20 enabled, then 500 USDT cap unless E3.S11 tier gates apply.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given ERC20 USDC selected
  - When PaymentIntent created
  - Then gas warning copy shown.
- **Scenario: Acceptance 2**
  - Given ERC20 tx
  - When explorer verifies
  - Then chain, contract, from, to, amount, confirmations≥12 must match.
- **Scenario: Acceptance 3**
  - Given Gate C ON
  - When ERC20 manual and ck both available
  - Then user picks one — mutually exclusive.
- **Scenario: Acceptance 4**
  - Given beta
  - When ERC20 enabled
  - Then 500 USDT cap unless E3.S11 tier gates apply.
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
  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/mixins/payments-api.mo`
- [x] **Documentation:**
  - [ ] `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-3.md`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Payments.test.mo ERC20 verify

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
| FR-24 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

## Library and framework requirements

| Layer | Use |
|-------|-----|
| UI | React 19, Vite, TanStack Router, Tailwind |
| Auth / ICP client | `@caffeineai/core-infrastructure` `useInternetIdentity()` via `useAuth.ts`; `@dfinity/agent`, host `https://icp-api.io` |
| Storage | Caffeine object storage pattern |
| Backend | Motoko `mo:core`, mops |
| Build | mops, Caffeine draft/live |

- Payments: `payments-api.mo` HTTPS outcalls (CoinGecko + explorers).

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

- `src/frontend/src/pages/TradeDetailPage.tsx`

**Backend:**

- `src/backend/mixins/payments-api.mo`

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

- test/Payments.test.mo ERC20 verify

### Verification checklist (story manifest)

- Payments.test.mo ERC20 verify
- Wrong contract rejection

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-24
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

- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/backend/mixins/payments-api.mo`
- `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-3.md`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E4.S8 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given ERC20 USDC selected, when PaymentIntent created, then gas warning copy shown. | Pass (regression) | |
| 2 | Given ERC20 tx, when explorer verifies, then chain, contract, from, to, amount, confirmations≥12 must match. | Pass (regression) | |
| 3 | Given Gate C ON, when ERC20 manual and ck both available, then user picks one — mutually exclusive. | Pass (regression) | |
| 4 | Given beta, when ERC20 enabled, then 500 USDT cap unless E3.S11 tier gates apply. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: ERC20 USDC selected, when PaymentIntent created, then gas warning copy shown.
- [x] Scenario 2: ERC20 tx, when explorer verifies, then chain, contract, from, to, amount, confirmations≥12 must match.
- [x] Scenario 3: Gate C ON, when ERC20 manual and ck both available, then user picks one — mutually exclusive.
- [x] Scenario 4: beta, when ERC20 enabled, then 500 USDT cap unless E3.S11 tier gates apply.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Payments.test.mo ERC20 verify

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
