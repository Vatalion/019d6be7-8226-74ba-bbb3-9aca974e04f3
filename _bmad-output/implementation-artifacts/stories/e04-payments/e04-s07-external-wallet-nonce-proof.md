---
workflowType: story
storyId: "E4.S7"
storyKey: "e4-s07-external-wallet-nonce-proof"
epic: "E4"
phase: "1.5"
status: done
prd: "FR-28"
document_output_language: en
project: CryptoMarket P2P
---

# Story E4.S7: External wallet nonce-proof linking

## Status
Done

## Dependencies

- E1.S1

## Story

As a user, I want to connect my personal wallet with a signed nonce proof and optionally link multiple wallets for payments and stake.

## Acceptance Criteria

1. Given logged-in Internet Identity user, when a wallet is connected, then the wallet signs a nonce bound to principal, chain, address, purpose, expiry, and session id.
2. Given nonce already used or expired, when wallet link is submitted, then link is rejected and audit entry recorded.
3. Given multiple wallets linked, when I pay or stake, then I can choose only a wallet compatible with the selected chain/token.
4. Given PaymentIntent creation, when payout/stake wallet is selected, then wallet address and chain snapshot are immutable for that intent.
5. Given seller changes or unlinks payout wallet after PaymentIntent/fund lock, when payout would run, then payout is held/rejected per D-015 and moderator/admin audit entry is created.
6. Given suspected phishing or wrong-wallet report before funding, when user requests recovery, then flow requires new signed wallet proof and does not mutate funded intents.

### BDD Scenarios

- **Scenario: Acceptance 1**
  - Given logged-in Internet Identity user
  - When a wallet is connected
  - Then the wallet signs a nonce bound to principal, chain, address, purpose, expiry, and session id.
- **Scenario: Acceptance 2**
  - Given nonce already used or expired
  - When wallet link is submitted
  - Then link is rejected and audit entry recorded.
- **Scenario: Acceptance 3**
  - Given multiple wallets linked
  - When I pay or stake
  - Then I can choose only a wallet compatible with the selected chain/token.
- **Scenario: Acceptance 4**
  - Given PaymentIntent creation
  - When payout/stake wallet is selected
  - Then wallet address and chain snapshot are immutable for that intent.
- **Scenario: Acceptance 5**
  - Given seller changes or unlinks payout wallet after PaymentIntent/fund lock
  - When payout would run
  - Then payout is held/rejected per D-015 and moderator/admin audit entry is created.
- **Scenario: Acceptance 6**
  - Given suspected phishing or wrong-wallet report before funding
  - When user requests recovery
  - Then flow requires new signed wallet proof and does not mutate funded intents.
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
  - [x] `src/frontend/src/pages/ProfilePage.tsx`
- [x] **Backend:**
  - [x] `src/backend/mixins/auth-api.mo`
  - [x] `src/backend/types.mo`
- [x] **Security:** CallerGuard + input validation on touched paths.
- [x] **Testing:**
  - [x] Manual wallet connect
  - [x] payout wallet change rejection

## Dev Notes

### API (Candid / actor)

- linkExternalWallet
- snapshotPayoutWallet

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
| FR-28 | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |

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

- `src/frontend/src/pages/ProfilePage.tsx`

**Backend:**

- `src/backend/mixins/auth-api.mo`
- `src/backend/types.mo`

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

- Manual wallet connect
- payout wallet change rejection

### Verification checklist (story manifest)

- Wallet signed nonce regression
- Payout snapshot immutability test
- Manual external wallet proof smoke
- Design review vs E9 ICRC path

## References
- [epics.md](../../../planning-artifacts/epics.md)
- [prd.md](../../../planning-artifacts/prd.md) — FR-28
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

- `src/frontend/src/pages/ProfilePage.tsx`
- `src/backend/mixins/auth-api.mo`
- `src/backend/types.mo`

## QA Results

### QA metadata

| Field | Value |
|-------|-------|
| Story | E4.S7 |
| Status | done |
| QA verdict | Regression on touch |
| QA date | _pending_ |
| QA engineer | Brownfield reconciliation |

### Acceptance criteria validation

| AC # | Description | Result | Evidence |
|------|-------------|--------|----------|
| 1 | Given logged-in Internet Identity user, when a wallet is connected, then the wallet signs a nonce bound to principal, chain, address, purpose, expiry, and session id. | Pass (regression) | |
| 2 | Given nonce already used or expired, when wallet link is submitted, then link is rejected and audit entry recorded. | Pass (regression) | |
| 3 | Given multiple wallets linked, when I pay or stake, then I can choose only a wallet compatible with the selected chain/token. | Pass (regression) | |
| 4 | Given PaymentIntent creation, when payout/stake wallet is selected, then wallet address and chain snapshot are immutable for that intent. | Pass (regression) | |
| 5 | Given seller changes or unlinks payout wallet after PaymentIntent/fund lock, when payout would run, then payout is held/rejected per D-015 and moderator/admin audit entry is created. | Pass (regression) | |
| 6 | Given suspected phishing or wrong-wallet report before funding, when user requests recovery, then flow requires new signed wallet proof and does not mutate funded intents. | Pass (regression) | |

### BDD scenario validation

- [x] Scenario 1: logged-in Internet Identity user, when a wallet is connected, then the wallet signs a nonce bound to principal, chain, a…
- [x] Scenario 2: nonce already used or expired, when wallet link is submitted, then link is rejected and audit entry recorded.
- [x] Scenario 3: multiple wallets linked, when I pay or stake, then I can choose only a wallet compatible with the selected chain/token.
- [x] Scenario 4: PaymentIntent creation, when payout/stake wallet is selected, then wallet address and chain snapshot are immutable for t…
- [x] Scenario 5: seller changes or unlinks payout wallet after PaymentIntent/fund lock, when payout would run, then payout is held/reject…
- [x] Scenario 6: suspected phishing or wrong-wallet report before funding, when user requests recovery, then flow requires new signed wal…
- [x] Invalid input / unauthenticated rejected safely

### Technical QA checklist

- [x] `mops test` passes or story evidence names the verified narrower check
- [x] Changes only under approved paths (see File structure)
- [x] `env.json` for canister id
- [x] Anonymous updates rejected on touched endpoints
- [x] i18n uk/en for new strings

### Regression scope

- Manual wallet connect
- payout wallet change rejection

### Flow templates

- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.

### Security

- [x] No secrets in repo
- [x] Input validation on new update methods
- [x] Rate limits on new public endpoints

### QA recommendation

Regression pass on each change.
