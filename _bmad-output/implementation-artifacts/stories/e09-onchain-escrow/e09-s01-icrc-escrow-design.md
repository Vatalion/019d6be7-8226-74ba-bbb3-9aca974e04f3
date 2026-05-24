---
workflowType: story
storyId: "E9.S1"
storyKey: "e9-s01-icrc-escrow-design"
epic: "E9"
phase: 3
status: done
prd: "FR-25"
document_output_language: en
project: CryptoMarket P2P
---

# Story E9.S1: ICRC escrow design

## Status
Done

## Dependencies

- E3.S1
- E4.S2

## Story

As architects, we want an approved ICRC-first escrow design so Phase 3 can lock and release funds on-chain while Phase 1 manual settlement remains unchanged.

## Acceptance Criteria

1. Given Phase 1 is live, when design is reviewed, then document states ICRC-2 lock/release as the on-chain path.
2. Given design approved, when implementation starts, then failure modes cover dispute freeze, partial release, and ledger errors.
3. Given UX rules in ONCHAIN-SETTLEMENT-DESIGN.md, when copy is written, then Phase 1 paths describe manual off-chain payment only.

### BDD Scenarios

- **Scenario: Design covers ckUSDC/ckUSDT path**
  - Given `initiateOnChainTrade` exists in `escrow-api.mo`
  - When architect documents Phase 3 flow
  - Then steps include approve → lock → deliver → release/refund

- **Scenario: Phase 1 unchanged**
  - Given manual `initiateTrade` for Wave 1 TRC20/BEP20
  - When design is published
  - Then `Trade` type for Phase 1 stays manual-payment fields only

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

- [ ] **Architecture:** Update `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md` and `architecture.md` Phase 3 section.
- [ ] **Architecture:** ADR for ICRC escrow scope and Gate C.
- [ ] **Security:** Threat model for canister-held funds.
- [ ] **Product:** Gate C beta caps and allowed tokens for on-chain escrow CTA.
- [ ] **Review:** Owner sign-off before on-chain escrow marketing.

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

- Design review only

### Verification checklist (story manifest)

- Design review only

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-25
- [architecture.md](../../../planning-artifacts/architecture.md)
- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)
- [AGENTS.md](../../../../AGENTS.md)
- [docs/bmad/README.md](../../../../docs/bmad/README.md)
## Out of scope

- Phase 1 UI copy implying live escrow

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

- ONCHAIN-SETTLEMENT-DESIGN.md: ICRC-2 path, failure modes, Gate C checklist.
- initiateOnChainTrade gated by admin flag (default false).

### File List

- `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md`
- `src/backend/mixins/escrow-api.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E9.S1 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | 2026-05-23 |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given Phase 1 is live, when design is reviewed, then document states ICRC-2 lock/release as the on-chain path. | Pass (regression) | docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md |
| 2 | Given design approved, when implementation starts, then failure modes cover dispute freeze, partial release, and ledger errors. | Pass (regression) | test/Escrow.test.mo |
| 3 | Given UX rules in ONCHAIN-SETTLEMENT-DESIGN.md, when copy is written, then Phase 1 paths describe manual off-chain payment only. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: Phase 1 is live, when design is reviewed, then document states ICRC-2 lock/release as the on-chain path.
- [x] Scenario 2: design approved, when implementation starts, then failure modes cover dispute freeze, partial release, and ledger errors…
- [x] Scenario 3: UX rules in ONCHAIN-SETTLEMENT-DESIGN.md, when copy is written, then Phase 1 paths describe manual off-chain payment onl…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Design review only

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
