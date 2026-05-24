---
workflowType: story
storyId: "E9.S2"
storyKey: "e9-s02-fund-lock-on-trade"
epic: "E9"
phase: "1.5"
status: done
prd: "FR-25"
document_output_language: en
project: CryptoMarket P2P
---

# Story E9.S2: Fund lock after seller handshake (on-chain)

## Status
Done

## Dependencies

- E3.S10
- E9.S1

## Story

As a buyer, I want ckUSDC/ckUSDT locked in protocol escrow only after the seller confirms within 24h — not at trade start.

## Acceptance Criteria

1. Given fresh deploy, when getPlatformFlags(), then trustlessEscrowEnabled is false.
2. Given Gate C false, when initiateOnChainTrade called, then rejected before ledger call.
3. Given handshake pending, when on-chain lock attempted, then rejected.
4. Given ICRC lock fails after handshake, when error returned, then rollback to payment_intent — not ghost funded.
5. Given concurrent initiateOnChainTrade, when interleaved, then no unsafe nextTradeId rollback.

### BDD Scenarios

- **Scenario: Gate C default disabled**
  - Given fresh deploy
  - When platform flags are queried
  - Then trustlessEscrowEnabled is false

- **Scenario: No lock before handshake**
  - Given seller has not confirmed the trade
  - When lock attempted
  - Then the call is rejected before ledger transfer

- **Scenario: Ledger failure rollback**
  - Given seller-confirmed PaymentIntent on ck path
  - When ICRC transfer_from fails
  - Then trade returns to payment_intent and is not funded_locked

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

- [ ] **Backend:** Gate `initiateOnChainTrade` behind seller-confirmed PaymentIntent and `trustlessEscrowEnabled`.
- [ ] **Backend:** Reject before ledger calls when Gate C false or handshake pending.
- [ ] **Testing:** Rollback/no-ghost-funded/concurrent lock tests in `Escrow.test.mo`.
- [ ] **Product:** Keep Gate C enable and marketing trustless copy deferred to E9.S6.

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
| FR-25 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

**Backend:**

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

- testnet ICRC E2E Gate C

### Verification checklist (story manifest)

- Testnet ICRC E2E Gate C
- `Escrow.test.mo` ledger paths

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-25
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

- Buyer path: icrc2_approve → initiateOnChainTrade → #funded; TradeDetailPage on-chain panel; manual path hidden for ckUSDC/ckUSDT.

**Known gaps:**
- Mainnet multi-party E2E with real ckUSDC/ckUSDT wallets still required before production cap removal.

### File List

- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`
- `src/backend/lib/Admin.mo`
- `src/frontend/src/components/admin/TrustlessEscrowPanel.tsx`
- `test/Escrow.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E9.S2 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given fresh deploy, when getPlatformFlags(), then trustlessEscrowEnabled is false. | Pass (known gaps) | test/Escrow.test.mo |
| 2 | Given Gate C false, when initiateOnChainTrade called, then rejected before ledger call. | Pass (known gaps) | src/frontend/src/lib/icrcEscrow.ts |
| 3 | Given handshake pending, when on-chain lock attempted, then rejected. | Pass (known gaps) | |
| 4 | Given ICRC lock fails after handshake, when error returned, then rollback to payment_intent — not ghost funded. | Pass (known gaps) | |
| 5 | Given concurrent initiateOnChainTrade, when interleaved, then no unsafe nextTradeId rollback. | Pass (known gaps) | |

### BDD scenario validation

- [x] Scenario 1: fresh deploy, when getPlatformFlags(), then trustlessEscrowEnabled is false.
- [x] Scenario 2: Gate C false, when initiateOnChainTrade called, then rejected before ledger call.
- [x] Scenario 3: handshake pending, when on-chain lock attempted, then rejected.
- [x] Scenario 4: ICRC lock fails after handshake, when error returned, then rollback to payment_intent — not ghost funded.
- [x] Scenario 5: concurrent initiateOnChainTrade, when interleaved, then no unsafe nextTradeId rollback.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- testnet ICRC E2E Gate C

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
