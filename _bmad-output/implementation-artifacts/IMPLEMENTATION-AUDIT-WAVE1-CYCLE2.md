# Wave 1 Audit — Cycle 2 (re-audit synthesizer)

**Date:** 2026-05-24  
**Scope:** Re-verify cycle 1 P0 fixes; assess cycle 2 P1 checklist  
**Prior cycle:** [IMPLEMENTATION-AUDIT-WAVE1-CYCLE1.md](./IMPLEMENTATION-AUDIT-WAVE1-CYCLE1.md)

---

## Executive summary

Cycle 1 P0 security and doc fixes are **confirmed in code**. `mops test` **15/15 green**. Stake UI copy updated to reflect internal-ledger limitation (quick win). FR-28 cryptographic verify and stake on-chain custody remain **honest Wave 1 deferrals** documented in `prd.md`, `EvmWalletSig.mo`, and i18n.

**Verdict: audit clean — yes.** Wave 2 may proceed (`E2.S11`).

---

## P0 re-verification (cycle 1 fixes)

| Check | Pass | Evidence |
|-------|------|----------|
| LG-09 wired in `verifyPayment` | ✅ | `payments-api.mo` L246–249 early hash reuse; L317–320 `applyExplorerVerificationGates` before `applyPaymentVerified`; `usedPaymentTxHashes` in `main.mo` |
| BEP20 fail-closed | ✅ | `parseBscScanTokenTransfer` in `Payments.mo`; `verifyBep20` uses transfer log; zero amount rejected by LG-09 gate |
| Stake release guard | ✅ | `Escrow.assertListingStakeReleasable` called from `stake-api.mo`; tests in `Stake.test.mo` |
| Ban on financial APIs | ✅ | `Auth.assertCallerNotBanned` on `verifyPayment`, escrow mutators, stake endpoints |
| Doc/manifest sync | ✅ | `story-manifest.mjs` Wave 1 stories `done`; `ORCHESTRATION-RUNBOOK.md` synced; `traceability-matrix.md` / `prd.md` honest partial notes |

---

## Cycle 2 scope checklist

| Item | Pass | Notes |
|------|------|-------|
| LG-09 live path (TRC20 + BEP20) | ✅ | Gates on recipient, amount, hash reuse; unit tests `Payments.test.mo` LG-09 suite |
| FR-28 ecrecover / Tron crypto | ✅ defer | `EvmWalletSig.mo` — format + message binding Wave 1; full ecrecover deferred mainnet; `prd.md` FR-28 partial |
| Stake copy (internal ledger) | ✅ | `create.stake.depositHint` EN/UK — platform balance, not on-chain collateral |
| Frontend component tests | ⏸ P2 | No vitest harness; Wave 1 gate is `mops test` + `pnpm typecheck` per runbook |
| EVM manual paths | ✅ fail-closed | Receipt-only `verifyEvm` returns `amountRaw=0`; LG-09 gate rejects → safe for Wave 1 TRC20/BEP20 focus |

---

## Test evidence

```text
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p && mops test
→ Tests passed, 15 files (2026-05-24 re-audit)
```

Key suites: `Payments.test.mo` (BEP20 transfer parse, LG-09 gates), `Stake.test.mo` (release guard), `Escrow.test.mo` (LG-01..LG-17).

---

## P1 carry-forward (non-blocking for Wave 2 start)

| ID | Item | Wave |
|----|------|------|
| T-03 | FR-28 on-canister ecrecover / Tron verify | Mainnet / post-Wave 1 |
| S-03 | Stake on-chain collateral ledger | Wave 3 |
| S-06 | EVM ERC20/Polygon log parsing (enable manual ERC20) | Wave 3 E4.S8 |
| X-03 | Live explorer HTTPS / mainnet proof | Beta monitoring |
| X-04 | Frontend component tests | Wave 2+ |
| D-04 | Root `ROADMAP.md` / `AUDIT.md` stubs | Planning artifacts canonical |

---

## Quick win applied (cycle 2)

| Fix | File |
|-----|------|
| Stake deposit hint — internal ledger disclaimer | `src/frontend/src/i18n/index.ts` (`create.stake.depositHint` EN + UK) |

---

## Audit clean?

**Yes** — all P0 security fixes verified; deferred limitations documented; `mops test` green. Proceed to Wave 2 implementation.

**Next:** `currentPhase=wave2-implement`, `nextStory=E2.S11`.

---

## Key files inspected

| Area | Files |
|------|-------|
| LG-09 | `src/backend/lib/Payments.mo`, `src/backend/mixins/payments-api.mo`, `src/backend/main.mo` |
| BEP20 | `src/backend/lib/Payments.mo`, `payments-api.mo` `verifyBep20` |
| Stake | `src/backend/lib/Escrow.mo`, `src/backend/mixins/stake-api.mo` |
| Auth | `src/backend/lib/Auth.mo`, escrow/payments/stake mixins |
| FR-28 | `src/backend/lib/EvmWalletSig.mo` |
| UI copy | `src/frontend/src/i18n/index.ts` |
