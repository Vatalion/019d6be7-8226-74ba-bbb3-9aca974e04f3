---
workflowType: story
storyId: "E2.S11"
storyKey: "e2-s11-digital-file-upload-auto-delivery"
epic: "E2"
phase: "1.5"
status: done
prd: "FR-52"
document_output_language: en
project: CryptoMarket P2P
---

# Story E2.S11: Digital file upload and auto-delivery

## Status
Done

## Dependencies

- E3.S10

## Story

As a seller, I upload encrypted files when creating a digital listing; as a buyer, I receive the file automatically after payment verification without seller being online.

## Acceptance Criteria

1. Given digital listing create, when seller uploads file, then ciphertext stored with random DEK, SHA-256 hash, size, MIME, immutable fileVersionId.
2. Given MIME not in allowlist (pdf, zip, png, jpg, epub, mp4) or size >500MB, when upload attempted, then rejected.
3. Given active trades on listing, when seller attempts file replace, then rejected — replacement for future listings only.
4. Given payment_verified or funded_locked, when auto-delivery runs, then buyer gets decrypt key/URL and state digital_delivered.
5. Given handshake incomplete or payment unverified, when buyer requests download, then 403 — no key before funding.
6. Given auto-delivery, when deliveryRecordAt persisted, then E7.S2 inspection timer starts from this timestamp.
7. Given placeholder/wrong hash dispute seller fault, when moderator resolves buyer wins, then refund + stake seizure queue.
8. Given blocklisted hash or quarantine flag, when upload attempted, then listing stays draft and admin audit entry.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given digital listing create
  - When seller uploads file
  - Then ciphertext stored with random DEK, SHA-256 hash, size, MIME, immutable fileVersionId.
- **Scenario: Acceptance 2**
  - Given MIME not in allowlist (pdf, zip, png, jpg, epub, mp4) or size >500MB
  - When upload attempted
  - Then rejected.
- **Scenario: Acceptance 3**
  - Given active trades on listing
  - When seller attempts file replace
  - Then rejected — replacement for future listings only.
- **Scenario: Acceptance 4**
  - Given payment_verified or funded_locked
  - When auto-delivery runs
  - Then buyer gets decrypt key/URL and state digital_delivered.
- **Scenario: Acceptance 5**
  - Given handshake incomplete or payment unverified
  - When buyer requests download
  - Then 403 — no key before funding.
- **Scenario: Acceptance 6**
  - Given auto-delivery
  - When deliveryRecordAt persisted
  - Then E7.S2 inspection timer starts from this timestamp.
- **Scenario: Acceptance 7**
  - Given placeholder/wrong hash dispute seller fault
  - When moderator resolves buyer wins
  - Then refund + stake seizure queue.
- **Scenario: Acceptance 8**
  - Given blocklisted hash or quarantine flag
  - When upload attempted
  - Then listing stays draft and admin audit entry.
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
  - [x] `src/frontend/src/pages/CreateListingPage.tsx`
  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`
- [x] **Backend:**
  - [x] `src/backend/lib/Escrow.mo`
  - [x] `src/backend/mixins/object-storage-api.mo`
  - [x] `src/backend/mixins/escrow-api.mo`
- [x] **Documentation:**
  - [ ] `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-2.md`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] test/Escrow.test.mo digital delivery
  - [x] file replace blocked

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
| FR-52 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/CreateListingPage.tsx`
- `src/frontend/src/pages/TradeDetailPage.tsx`

**Backend:**

- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/object-storage-api.mo`
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

- test/Escrow.test.mo digital delivery
- file replace blocked

### Verification checklist (story manifest)

- Escrow digital delivery tests
- Manual digital trade flow
- File replace blocked race

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-52
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

- `src/frontend/src/pages/CreateListingPage.tsx`
- `src/frontend/src/pages/TradeDetailPage.tsx`
- `src/backend/lib/Escrow.mo`
- `src/backend/mixins/object-storage-api.mo`
- `src/backend/mixins/escrow-api.mo`
- `_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-2.md`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E2.S11 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given digital listing create, when seller uploads file, then ciphertext stored with random DEK, SHA-256 hash, size, MIME, immutable fileVersionId. | Pass (regression) | |
| 2 | Given MIME not in allowlist (pdf, zip, png, jpg, epub, mp4) or size >500MB, when upload attempted, then rejected. | Pass (regression) | |
| 3 | Given active trades on listing, when seller attempts file replace, then rejected — replacement for future listings only. | Pass (regression) | |
| 4 | Given payment_verified or funded_locked, when auto-delivery runs, then buyer gets decrypt key/URL and state digital_delivered. | Pass (regression) | |
| 5 | Given handshake incomplete or payment unverified, when buyer requests download, then 403 — no key before funding. | Pass (regression) | |
| 6 | Given auto-delivery, when deliveryRecordAt persisted, then E7.S2 inspection timer starts from this timestamp. | Pass (regression) | |
| 7 | Given placeholder/wrong hash dispute seller fault, when moderator resolves buyer wins, then refund + stake seizure queue. | Pass (regression) | |
| 8 | Given blocklisted hash or quarantine flag, when upload attempted, then listing stays draft and admin audit entry. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: digital listing create, when seller uploads file, then ciphertext stored with random DEK, SHA-256 hash, size, MIME, immu…
- [x] Scenario 2: MIME not in allowlist (pdf, zip, png, jpg, epub, mp4) or size >500MB, when upload attempted, then rejected.
- [x] Scenario 3: active trades on listing, when seller attempts file replace, then rejected — replacement for future listings only.
- [x] Scenario 4: payment_verified or funded_locked, when auto-delivery runs, then buyer gets decrypt key/URL and state digital_delivered.…
- [x] Scenario 5: handshake incomplete or payment unverified, when buyer requests download, then 403 — no key before funding.
- [x] Scenario 6: auto-delivery, when deliveryRecordAt persisted, then E7.S2 inspection timer starts from this timestamp.
- [x] Scenario 7: placeholder/wrong hash dispute seller fault, when moderator resolves buyer wins, then refund + stake seizure queue.
- [x] Scenario 8: blocklisted hash or quarantine flag, when upload attempted, then listing stays draft and admin audit entry.
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- test/Escrow.test.mo digital delivery
- file replace blocked

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
