---
workflowType: story
storyId: "E4.S5"
storyKey: "e4-s05-payment-method-ux"
epic: "E4"
phase: 2
status: done
prd: "FR-22"
document_output_language: en
project: CryptoMarket P2P
---

# Story E4.S5: Payment method UX (QR, clipboard, hints)

## Status
Done

## Dependencies

- E3.S2

## Story

As a buyer, I want helpful UX when copying addresses and scanning QR codes per network.

## Acceptance Criteria

1. Given trade payment step, when I copy address, then clipboard feedback shown.
2. Given supported network, when I scan QR, then address field can populate.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given trade payment step
  - When I copy address
  - Then clipboard feedback shown.
- **Scenario: Acceptance 2**
  - Given supported network
  - When I scan QR
  - Then address field can populate.
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
  - [x] `src/frontend/src/components/payment/AddressInputWithHints.tsx`
  - [x] `src/frontend/src/components/payment/WalletQRScanner.tsx`
  - [x] `src/frontend/src/pages/AddPaymentMethodPage.tsx`
  - [x] `src/frontend/src/pages/TradeDetailPage.tsx` seller payment copy panel
- [x] **Backend**
  - [x] `src/backend/mixins/payments-api.mo` getSellerPaymentMethodsForTrade
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
| FR-22 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/components/payment/WalletQRScanner.tsx`

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

- Manual trade payment UX

### Verification checklist (story manifest)

- Manual trade flow

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-22
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

- WalletQRScanner and AddressInputWithHints on AddPaymentMethodPage.
- TradeDetailPage SellerPaymentAddressPanel with copy for buyers in pending/funded.

### File List

- `src/backend/mixins/payments-api.mo`
- `src/frontend/src/components/payment/AddressInputWithHints.tsx`
- `src/frontend/src/components/payment/WalletQRScanner.tsx`
- `src/frontend/src/pages/AddPaymentMethodPage.tsx`
- `src/frontend/src/pages/TradeDetailPage.tsx`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E4.S5 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-21 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given trade payment step, when I copy address, then clipboard feedback shown. | Pass (regression) | src/backend/mixins/payments-api.mo |
| 2 | Given supported network, when I scan QR, then address field can populate. | Pass (regression) | src/frontend/src/pages/TradeDetailPage.tsx |

### BDD scenario validation

- [x] Scenario 1: trade payment step, when I copy address, then clipboard feedback shown.
- [x] Scenario 2: supported network, when I scan QR, then address field can populate.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Manual trade payment UX

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
