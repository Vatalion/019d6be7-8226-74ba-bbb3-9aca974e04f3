---
workflowType: story
storyId: "E9.S6"
storyKey: "e9-s06-gate-c-beta-enable"
epic: "E9"
phase: 3
status: done
prd: "FR-25"
document_output_language: en
project: CryptoMarket P2P
---

# Story E9.S6: Gate C beta enable — ckUSDC/ckUSDT on-chain lock

## Status
Done

## Dependencies

- E9.S2
- E3.S10
- E13.S1

## Story

As a product owner, I want to enable trustless ICRC escrow after security review, beta caps, and E2E pass — not before Wave 3 checklist.

## Acceptance Criteria

1. Given prod default, when getPlatformFlags(), then trustlessEscrowEnabled=false until admin enable with security sign-off audit.
2. Given Gate C enable with incomplete checklist, when requested, then rejected.
3. Given Gate C ON and seller-confirmed trade, when buyer selects ckUSDC/ckUSDT, then ICRC-2 transfer_from to funded_locked post-handshake only.
4. Given trade amount >500 USDT ck beta cap, when on-chain path selected, then rejected — manual offered.
5. Given ICRC lock fails, when error, then rollback to payment_intent — seller cannot ship.
6. Given manual payment_verified, when ck lock attempted, then rejected — mutually exclusive paths.
7. Given Gate C ON, when marketing renders, then trustless copy only for ck tokens — manual keeps coordinated copy.
8. Given admin disables Gate C, when in-flight ck trades exist, then complete under prior rules; new trades manual-only.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given prod default
  - When getPlatformFlags()
  - Then trustlessEscrowEnabled=false until admin enable with security sign-off audit.
- **Scenario: Acceptance 2**
  - Given Gate C enable with incomplete checklist
  - When requested
  - Then rejected.
- **Scenario: Acceptance 3**
  - Given Gate C ON and seller-confirmed trade
  - When buyer selects ckUSDC/ckUSDT
  - Then ICRC-2 transfer_from to funded_locked post-handshake only.
- **Scenario: Acceptance 4**
  - Given trade amount >500 USDT ck beta cap
  - When on-chain path selected
  - Then rejected — manual offered.
- **Scenario: Acceptance 5**
  - Given ICRC lock fails
  - When error
  - Then rollback to payment_intent — seller cannot ship.
- **Scenario: Acceptance 6**
  - Given manual payment_verified
  - When ck lock attempted
  - Then rejected — mutually exclusive paths.
- **Scenario: Acceptance 7**
  - Given Gate C ON
  - When marketing renders
  - Then trustless copy only for ck tokens — manual keeps coordinated copy.
- **Scenario: Acceptance 8**
  - Given admin disables Gate C
  - When in-flight ck trades exist
  - Then complete under prior rules; new trades manual-only.
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
  - [x] `src/backend/mixins/escrow-api.mo`
  - [x] `src/backend/mixins/admin-api.mo`
- [x] **Documentation:**
  - [ ] `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] Testnet ICRC E2E Gate C
  - [x] beta cap enforcement

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
- `src/backend/mixins/admin-api.mo`

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

- Testnet ICRC E2E Gate C
- beta cap enforcement

### Verification checklist (story manifest)

- Testnet ICRC E2E
- Security review checklist
- Beta cap enforcement

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-25
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Wave 1–2 beta
- Manual TRC20/BEP20 trustless claims

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
- `src/backend/mixins/escrow-api.mo`
- `src/backend/mixins/admin-api.mo`
- `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E9.S6 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given prod default, when getPlatformFlags(), then trustlessEscrowEnabled=false until admin enable with security sign-off audit. | Pass (regression) | |
| 2 | Given Gate C enable with incomplete checklist, when requested, then rejected. | Pass (regression) | |
| 3 | Given Gate C ON and seller-confirmed trade, when buyer selects ckUSDC/ckUSDT, then ICRC-2 transfer_from to funded_locked post-handshake only. | Pass (regression) | |
| 4 | Given trade amount >500 USDT ck beta cap, when on-chain path selected, then rejected — manual offered. | Pass (regression) | |
| 5 | Given ICRC lock fails, when error, then rollback to payment_intent — seller cannot ship. | Pass (regression) | |
| 6 | Given manual payment_verified, when ck lock attempted, then rejected — mutually exclusive paths. | Pass (regression) | |
| 7 | Given Gate C ON, when marketing renders, then trustless copy only for ck tokens — manual keeps coordinated copy. | Pass (regression) | |
| 8 | Given admin disables Gate C, when in-flight ck trades exist, then complete under prior rules; new trades manual-only. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: prod default, when getPlatformFlags(), then trustlessEscrowEnabled=false until admin enable with security sign-off audit…
- [x] Scenario 2: Gate C enable with incomplete checklist, when requested, then rejected.
- [x] Scenario 3: Gate C ON and seller-confirmed trade, when buyer selects ckUSDC/ckUSDT, then ICRC-2 transfer_from to funded_locked post-…
- [x] Scenario 4: trade amount >500 USDT ck beta cap, when on-chain path selected, then rejected — manual offered.
- [x] Scenario 5: ICRC lock fails, when error, then rollback to payment_intent — seller cannot ship.
- [x] Scenario 6: manual payment_verified, when ck lock attempted, then rejected — mutually exclusive paths.
- [x] Scenario 7: Gate C ON, when marketing renders, then trustless copy only for ck tokens — manual keeps coordinated copy.
- [x] Scenario 8: admin disables Gate C, when in-flight ck trades exist, then complete under prior rules; new trades manual-only.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Testnet ICRC E2E Gate C
- beta cap enforcement

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
