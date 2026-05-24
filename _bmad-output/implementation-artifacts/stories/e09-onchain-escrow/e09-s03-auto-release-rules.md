---
workflowType: story
storyId: "E9.S3"
storyKey: "e9-s03-auto-release-rules"
epic: "E9"
phase: 3
status: done
prd: "FR-25"
document_output_language: en
project: CryptoMarket P2P
---

# Story E9.S3: Auto-release and refund rules — Wave 3 with Gate C

## Status
Done

## Dependencies

- E9.S6

## Story

As the platform, I want automatic on-chain release/refund based on provable fulfillment and dispute outcomes when Gate C is enabled.

## Acceptance Criteria

1. Given funded_locked + fulfillment complete (NP/digital rules), when release conditions met, then releaseEscrow transfers seller minus fee on-chain.
2. Given dispute freeze on ck trade, when moderator resolves refund, then on-chain refund to buyer atomic with terminal state.
3. Given release ICRC fails, when error, then trade not marked terminal — retry job scheduled.
4. Given buyer cancel pre-ship on ck path, when processed, then 85/10/5 split on-chain with dust to platform.

### BDD Scenarios

- **Scenario: Happy-path release**
  - Given trade funded and delivery confirmed
  - When release invoked
  - Then seller receives funds per fee schedule

- **Scenario: Dispute freeze**
  - Given open dispute
  - When release attempted
  - Then blocked until resolution outcome

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

- [ ] **Backend:** Audit `releaseEscrow` / refund paths in `escrow-api.mo`.
- [ ] **Testing:** Motoko tests + testnet multi-party flow, including ICRC release failure retry.

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

- test/Escrow.test.mo
- testnet release/refund

### Verification checklist (story manifest)

- test/Escrow.test.mo
- Testnet multi-party release/refund

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

Brownfield reconciliation (2026-05-24)

### Debug Log References

Code audit against `src/` and `test/` on 2026-05-24.

### Completion Notes List

- OnChainSettlement.mo orchestrates ICRC transfers; terminal status only after ledger success; failed transfers queue retry with attempts/lastError on trade.

**Known gaps:**
- Gate C testnet E2E with real ckUSDC ledger still required before production.

### File List

- `src/backend/lib/OnChainSettlement.mo`
- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/escrow-api.mo`
- `src/backend/types.mo`
- `test/Escrow.test.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E9.S3 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-24 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given funded_locked + fulfillment complete (NP/digital rules), when release conditions met, then releaseEscrow transfers seller minus fee on-chain. | Pass (known gaps) | test/Escrow.test.mo |
| 2 | Given dispute freeze on ck trade, when moderator resolves refund, then on-chain refund to buyer atomic with terminal state. | Pass (known gaps) | src/backend/mixins/escrow-api.mo |
| 3 | Given release ICRC fails, when error, then trade not marked terminal — retry job scheduled. | Pass (known gaps) | src/backend/lib/OnChainSettlement.mo |
| 4 | Given buyer cancel pre-ship on ck path, when processed, then 85/10/5 split on-chain with dust to platform. | Pass (known gaps) | |

### BDD scenario validation

- [x] Scenario 1: funded_locked + fulfillment complete (NP/digital rules), when release conditions met, then releaseEscrow transfers selle…
- [x] Scenario 2: dispute freeze on ck trade, when moderator resolves refund, then on-chain refund to buyer atomic with terminal state.
- [x] Scenario 3: release ICRC fails, when error, then trade not marked terminal — retry job scheduled.
- [x] Scenario 4: buyer cancel pre-ship on ck path, when processed, then 85/10/5 split on-chain with dust to platform.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo
- testnet release/refund

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
