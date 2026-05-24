---
workflowType: story
storyId: "E3.S7"
storyKey: "e3-s07-seller-handshake-24h"
epic: "E3"
phase: "1.5"
status: done
prd: "FR-21a"
document_output_language: en
project: CryptoMarket P2P
---

# Story E3.S7: Seller handshake 24h with auto-cancel

## Status
Done

## Dependencies

- E3.S8
- E6.S8

## Story

As a seller, I must confirm an incoming buy request within 24 hours; as a buyer, if the seller is silent I receive 100% back automatically.

## Acceptance Criteria

1. Given new trade from listing, when created, then state is awaiting_seller_handshake and seller sees confirm/decline with 24h deadline — no payment CTA.
2. Given seller confirms within 24h, when confirm processed, then trade advances to payment_intent (E3.S10).
3. Given seller declines, when processed, then terminal cancelled_no_seller_response — buyer 100%, no lock.
4. Given 24h elapsed without seller action, when timer fires, then auto-cancel with buyer 100% refund and no stake penalty.
5. Given confirm vs timeout race, when concurrent calls, then deterministic single terminal state (idempotent).

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given new trade from listing
  - When created
  - Then state is awaiting_seller_handshake and seller sees confirm/decline with 24h deadline — no payment CTA.
- **Scenario: Acceptance 2**
  - Given seller confirms within 24h
  - When confirm processed
  - Then trade advances to payment_intent (E3.S10).
- **Scenario: Acceptance 3**
  - Given seller declines
  - When processed
  - Then terminal cancelled_no_seller_response — buyer 100%, no lock.
- **Scenario: Acceptance 4**
  - Given 24h elapsed without seller action
  - When timer fires
  - Then auto-cancel with buyer 100% refund and no stake penalty.
- **Scenario: Acceptance 5**
  - Given confirm vs timeout race
  - When concurrent calls
  - Then deterministic single terminal state (idempotent).
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
  - [x] `src/frontend/src/components/trade/EscrowTimeline.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Escrow.mo`
  - [x] `src/backend/mixins/escrow-api.mo`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Escrow.test.mo handshake timeout race

## Dev Notes

### API (Candid / actor)

- confirmSellerHandshake
- declineSellerHandshake
- checkHandshakeTimeouts

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
| FR-21a | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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
- `src/frontend/src/components/trade/EscrowTimeline.tsx`

**Backend:**

- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`

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

- test/Escrow.test.mo handshake timeout race

### Verification checklist (story manifest)

- `Escrow.test.mo` handshake timeout
- Manual seller notification

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-21a
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
- `src/frontend/src/components/trade/EscrowTimeline.tsx`
- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E3.S7 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given new trade from listing, when created, then state is awaiting_seller_handshake and seller sees confirm/decline with 24h deadline — no payment CTA. | Pass (regression) | |
| 2 | Given seller confirms within 24h, when confirm processed, then trade advances to payment_intent (E3.S10). | Pass (regression) | |
| 3 | Given seller declines, when processed, then terminal cancelled_no_seller_response — buyer 100%, no lock. | Pass (regression) | |
| 4 | Given 24h elapsed without seller action, when timer fires, then auto-cancel with buyer 100% refund and no stake penalty. | Pass (regression) | |
| 5 | Given confirm vs timeout race, when concurrent calls, then deterministic single terminal state (idempotent). | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: new trade from listing, when created, then state is awaiting_seller_handshake and seller sees confirm/decline with 24h d…
- [x] Scenario 2: seller confirms within 24h, when confirm processed, then trade advances to payment_intent (E3.S10).
- [x] Scenario 3: seller declines, when processed, then terminal cancelled_no_seller_response — buyer 100%, no lock.
- [x] Scenario 4: 24h elapsed without seller action, when timer fires, then auto-cancel with buyer 100% refund and no stake penalty.
- [x] Scenario 5: confirm vs timeout race, when concurrent calls, then deterministic single terminal state (idempotent).
- [x] Invalid input / unauthenticated rejected safely
- [x] Copy matches Phase 1 payment model on trade surfaces

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo handshake timeout race

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
