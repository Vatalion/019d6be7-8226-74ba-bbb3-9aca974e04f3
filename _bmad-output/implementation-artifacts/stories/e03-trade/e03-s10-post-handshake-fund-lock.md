---
workflowType: story
storyId: "E3.S10"
storyKey: "e3-s10-post-handshake-fund-lock"
epic: "E3"
phase: "1.5"
status: done
prd: "FR-21b"
document_output_language: en
project: CryptoMarket P2P
---

# Story E3.S10: Fund lock after seller handshake

## Status
Done

## Dependencies

- E3.S7
- E4.S2

## Story

As a buyer, I want my funds locked only after the seller confirms the trade within 24h — not when I first tap Buy.

## Acceptance Criteria

1. Given seller confirmed trade, when PaymentIntent created, then token, network, exact amount, recipient, expiry (72h), and path manual|ck are recorded.
2. Given handshake incomplete, when buyer attempts pay or lock, then operation rejected.
3. Given manual path, when explorer verifies tx (chain, contract, from, to, amount, confirmations), then state advances to payment_verified.
4. Given explorer mismatch or spoof verify path, when verify attempted, then stay pending — no paid state.
5. Given PaymentIntent expires before explorer match, when late verification arrives, then trade stays expired/manual_review and does not become payment_verified.
6. Given payment not verified, when seller marks shipped, then rejected.
7. Given payout wallet snapshot at intent, when seller changes wallet after lock, then payout held or rejected.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given seller confirmed trade
  - When PaymentIntent created
  - Then token, network, exact amount, recipient, expiry (72h), and path manual|ck are recorded.
- **Scenario: Acceptance 2**
  - Given handshake incomplete
  - When buyer attempts pay or lock
  - Then operation rejected.
- **Scenario: Acceptance 3**
  - Given manual path
  - When explorer verifies tx (chain, contract, from, to, amount, confirmations)
  - Then state advances to payment_verified.
- **Scenario: Acceptance 4**
  - Given explorer mismatch or spoof verify path
  - When verify attempted
  - Then stay pending — no paid state.
- **Scenario: Acceptance 5**
  - Given PaymentIntent expires before explorer match
  - When late verification arrives
  - Then trade stays expired/manual_review and does not become payment_verified.
- **Scenario: Acceptance 6**
  - Given payment not verified
  - When seller marks shipped
  - Then rejected.
- **Scenario: Acceptance 7**
  - Given payout wallet snapshot at intent
  - When seller changes wallet after lock
  - Then payout held or rejected.
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
  - [x] `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Escrow.mo`
  - [x] `src/backend/mixins/escrow-api.mo`
  - [x] `src/backend/mixins/payments-api.mo`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Escrow.test.mo
  - [x] test/Payments.test.mo

## Dev Notes

### API (Candid / actor)

- createPaymentIntent
- verifyTradePaymentExplorer

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
| FR-21b | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`

**Backend:**

- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`
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

- test/Escrow.test.mo
- test/Payments.test.mo

### Verification checklist (story manifest)

- `Escrow.test.mo` state transitions
- Gate C testnet when on-chain enabled

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-21b
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
- `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`
- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`
- `src/backend/mixins/payments-api.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E3.S10 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given seller confirmed trade, when PaymentIntent created, then token, network, exact amount, recipient, expiry (72h), and path manual\|ck are recorded. | Pass (regression) | |
| 2 | Given handshake incomplete, when buyer attempts pay or lock, then operation rejected. | Pass (regression) | |
| 3 | Given manual path, when explorer verifies tx (chain, contract, from, to, amount, confirmations), then state advances to payment_verified. | Pass (regression) | |
| 4 | Given explorer mismatch or spoof verify path, when verify attempted, then stay pending — no paid state. | Pass (regression) | |
| 5 | Given PaymentIntent expires before explorer match, when late verification arrives, then trade stays expired/manual_review and does not become payment_verified. | Pass (regression) | |
| 6 | Given payment not verified, when seller marks shipped, then rejected. | Pass (regression) | |
| 7 | Given payout wallet snapshot at intent, when seller changes wallet after lock, then payout held or rejected. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: seller confirmed trade, when PaymentIntent created, then token, network, exact amount, recipient, expiry (72h), and path…
- [x] Scenario 2: handshake incomplete, when buyer attempts pay or lock, then operation rejected.
- [x] Scenario 3: manual path, when explorer verifies tx (chain, contract, from, to, amount, confirmations), then state advances to paymen…
- [x] Scenario 4: explorer mismatch or spoof verify path, when verify attempted, then stay pending — no paid state.
- [x] Scenario 5: PaymentIntent expires before explorer match, when late verification arrives, then trade stays expired/manual_review and …
- [x] Scenario 6: payment not verified, when seller marks shipped, then rejected.
- [x] Scenario 7: payout wallet snapshot at intent, when seller changes wallet after lock, then payout held or rejected.
- [x] Invalid input / unauthenticated rejected safely
- [x] Copy matches Phase 1 payment model on trade surfaces

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo
- test/Payments.test.mo

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
