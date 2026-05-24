---
workflowType: story
storyId: "E6.S9"
storyKey: "e6-s09-dispute-playbook"
epic: "E6"
phase: "1.5"
status: done
prd: "FR-41"
document_output_language: en
project: CryptoMarket P2P
---

# Story E6.S9: Dispute playbook — L1/L2 states, freeze, evidence, SLA

## Status
Done

## Dependencies

- E6.S1
- E6.S2
- E7.S3
- E2.S11
- E7.S2

## Story

As the platform, I want enforceable dispute levels with freeze scope, evidence checklist, and moderator SLA so physical and digital trades resolve fairly.

## Acceptance Criteria

1. Given post-shipment physical OR post-delivery digital, when dispute opened, then trade enters dispute_l1 and payout frozen.
2. Given dispute_l1, when L1 SLA expires or party escalates, then dispute_l2 and moderator queue entry.
3. Given dispute_l2, when moderator resolves, then exactly one terminal refunded or paid_seller — idempotent.
4. Given physical dispute by buyer, when form renders, then required TTN screenshot, min 2 photos, chat link, reason enum.
5. Given digital dispute by buyer, when form renders, then required file hash, download timestamp, reason enum.
6. Given incomplete evidence, when submit attempted, then inline validation — dispute stays draft.
7. Given L1 physical SLA 24h / digital 6h, when timer expires, then auto-escalate to L2.
8. Given L2 queued, when overdue beyond triage 4-12h or decision 24-72h, then admin dashboard flags overdue.
9. Given seller-fault refund, when settlement runs, then stake seizure executes and a liability event is queued for E6.S6; Wave 2 claim cross-trade recovery beyond payout freeze/account review.
10. Given dispute during NP 48h grace or digital 24h inspection, when open, then auto-complete blocked.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given post-shipment physical OR post-delivery digital
  - When dispute opened
  - Then trade enters dispute_l1 and payout frozen.
- **Scenario: Acceptance 2**
  - Given dispute_l1
  - When L1 SLA expires or party escalates
  - Then dispute_l2 and moderator queue entry.
- **Scenario: Acceptance 3**
  - Given dispute_l2
  - When moderator resolves
  - Then exactly one terminal refunded or paid_seller — idempotent.
- **Scenario: Acceptance 4**
  - Given physical dispute by buyer
  - When form renders
  - Then required TTN screenshot, min 2 photos, chat link, reason enum.
- **Scenario: Acceptance 5**
  - Given digital dispute by buyer
  - When form renders
  - Then required file hash, download timestamp, reason enum.
- **Scenario: Acceptance 6**
  - Given incomplete evidence
  - When submit attempted
  - Then inline validation — dispute stays draft.
- **Scenario: Acceptance 7**
  - Given L1 physical SLA 24h / digital 6h
  - When timer expires
  - Then auto-escalate to L2.
- **Scenario: Acceptance 8**
  - Given L2 queued
  - When overdue beyond triage 4-12h or decision 24-72h
  - Then admin dashboard flags overdue.
- **Scenario: Acceptance 9**
  - Given seller-fault refund
  - When settlement runs
  - Then stake seizure executes and a liability event is queued for E6.S6; Wave 2 claim cross-trade recovery beyond payout freeze/account review.
- **Scenario: Acceptance 10**
  - Given dispute during NP 48h grace or digital 24h inspection
  - When open
  - Then auto-complete blocked.
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
  - [x] `src/frontend/src/components/trade/DisputeModal.tsx`
  - [x] `src/frontend/src/pages/AdminPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Disputes.mo`
  - [x] `src/backend/mixins/disputes-api.mo`
  - [x] `src/backend/lib/Escrow.mo`
- [x] **Documentation:**
  - [ ] `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-2.md`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Disputes.test.mo L1/L2 freeze
  - [x] SLA escalation

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
| FR-41 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/components/trade/DisputeModal.tsx`
- `src/frontend/src/pages/AdminPage.tsx`

**Backend:**

- `src/backend/lib/Disputes.mo`
- `src/backend/mixins/disputes-api.mo`
- `src/backend/lib/Escrow.mo`

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

- test/Disputes.test.mo L1/L2 freeze
- SLA escalation

### Verification checklist (story manifest)

- test/Disputes.test.mo L1/L2 freeze
- SLA escalation tests
- Moderator playbook review

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-41
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

- `src/frontend/src/components/trade/DisputeModal.tsx`
- `src/frontend/src/pages/AdminPage.tsx`
- `src/backend/lib/Disputes.mo`
- `src/backend/mixins/disputes-api.mo`
- `src/backend/lib/Escrow.mo`
- `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-2.md`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E6.S9 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given post-shipment physical OR post-delivery digital, when dispute opened, then trade enters dispute_l1 and payout frozen. | Pass (regression) | |
| 2 | Given dispute_l1, when L1 SLA expires or party escalates, then dispute_l2 and moderator queue entry. | Pass (regression) | |
| 3 | Given dispute_l2, when moderator resolves, then exactly one terminal refunded or paid_seller — idempotent. | Pass (regression) | |
| 4 | Given physical dispute by buyer, when form renders, then required TTN screenshot, min 2 photos, chat link, reason enum. | Pass (regression) | |
| 5 | Given digital dispute by buyer, when form renders, then required file hash, download timestamp, reason enum. | Pass (regression) | |
| 6 | Given incomplete evidence, when submit attempted, then inline validation — dispute stays draft. | Pass (regression) | |
| 7 | Given L1 physical SLA 24h / digital 6h, when timer expires, then auto-escalate to L2. | Pass (regression) | |
| 8 | Given L2 queued, when overdue beyond triage 4-12h or decision 24-72h, then admin dashboard flags overdue. | Pass (regression) | |
| 9 | Given seller-fault refund, when settlement runs, then stake seizure executes and a liability event is queued for E6.S6; Wave 2 claim cross-trade recovery beyond payout freeze/account review. | Pass (regression) | |
| 10 | Given dispute during NP 48h grace or digital 24h inspection, when open, then auto-complete blocked. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: post-shipment physical OR post-delivery digital, when dispute opened, then trade enters dispute_l1 and payout frozen.
- [x] Scenario 2: dispute_l1, when L1 SLA expires or party escalates, then dispute_l2 and moderator queue entry.
- [x] Scenario 3: dispute_l2, when moderator resolves, then exactly one terminal refunded or paid_seller — idempotent.
- [x] Scenario 4: physical dispute by buyer, when form renders, then required TTN screenshot, min 2 photos, chat link, reason enum.
- [x] Scenario 5: digital dispute by buyer, when form renders, then required file hash, download timestamp, reason enum.
- [x] Scenario 6: incomplete evidence, when submit attempted, then inline validation — dispute stays draft.
- [x] Scenario 7: L1 physical SLA 24h / digital 6h, when timer expires, then auto-escalate to L2.
- [x] Scenario 8: L2 queued, when overdue beyond triage 4-12h or decision 24-72h, then admin dashboard flags overdue.
- [x] Scenario 9: seller-fault refund, when settlement runs, then stake seizure executes and a liability event is queued for E6.S6; Wave 2…
- [x] Scenario 10: dispute during NP 48h grace or digital 24h inspection, when open, then auto-complete blocked.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Disputes.test.mo L1/L2 freeze
- SLA escalation

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
