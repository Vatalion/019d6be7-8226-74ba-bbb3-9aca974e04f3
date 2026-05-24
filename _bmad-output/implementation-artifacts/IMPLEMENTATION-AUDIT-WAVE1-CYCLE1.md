# Wave 1 Audit — Cycle 1 (merged council + fix)

**Date:** 2026-05-24  
**Scope:** Wave 1 complete (E3.S8 → E13.S1) — audit council + fix dev  
**Verdict:** Not audit-clean — cycle 2 re-audit required (P1/P2 remain)

---

## Executive summary

Wave 1 stories are implemented and `mops test` passes **15/15**. Cycle 1 fix dev closed P0 security/doc drift items (LG-09 wiring, BEP20 fail-closed, stake release guard, ban checks, manifest sync). Remaining gaps: FR-28 cryptographic verify, stake on-chain ledger (Wave 3), frontend test coverage, some P1 race hardening.

---

## 1. Traceability (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| T-01 | P0 | `story-manifest.mjs` / `sprint-status.yaml` Wave 1 still `backlog` while code exists | **Fixed** — Wave 1 → `done`; regen via `build-bmad-stories.mjs` |
| T-02 | P0 | `traceability-matrix.md` / `prd.md` Built columns stale for FR-21a/b/c, FR-27, FR-28, FR-51 | **Fixed** — updated with honest partial notes |
| T-03 | P1 | FR-28 crypto verify gap (ecrecover / Tron verify not on canister) | **Open P1** — message binding only; documented partial |
| T-04 | P2 | Manifest vs `IMPLEMENTATION-CYCLE-STATE.json` vs runbook triple status conflict | **Fixed** — runbook + cycle state aligned |

---

## 2. Security / fraud (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| S-01 | P0 | LG-09: `validateExplorerMatch` / `validateTxHashNotReused` not wired in `verifyPayment` | **Fixed** — gates before `applyPaymentVerified`; `usedPaymentTxHashes` map |
| S-02 | P0 | BEP20 receipt-only verify (amount/recipient empty → false `#verified`) | **Fixed** — `parseBscScanTokenTransfer` + fail-closed |
| S-03 | P0 | Stake internal ledger only — not on-chain collateral | **Deferred** — Wave 1 limitation documented in FR-27/prd; honest copy |
| S-04 | P0 | `releaseListingStake` without active-listing / exclusive-trade guard | **Fixed** — `Escrow.assertListingStakeReleasable` |
| S-05 | P0 | `assertNotBanned` missing on financial mutators (escrow, payments, stake) | **Fixed** — `Auth.assertCallerNotBanned` on key endpoints |
| S-06 | P1 | EVM ERC20/Polygon paths still receipt-only (amountRaw=0 → LG-09 reject) | **Open P1** — fail-closed OK for Wave 1 manual TRC20/BEP20 focus |

---

## 3. Test gaps (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| X-01 | P0 | LG-09 unit tests existed but not integration path through `verifyPayment` | **Partial** — `applyExplorerVerificationGates` + BEP20 parser tests added |
| X-02 | P0 | Backend race matrix LG-01..LG-17 | **Done** — `Escrow.test.mo` / E13.S1 |
| X-03 | P1 | Explorer HTTPS integration / live mainnet proof | **Open** — unit + gate tests only |
| X-04 | P2 | Frontend component tests for Wave 1 flows | **Open** — `pnpm typecheck` only |

**Test evidence (fix session):**

```text
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p && mops test
→ Tests passed, 15 files
```

New/extended: `test/Payments.test.mo` (BEP20 transfer parse, LG-09 gates), `test/Stake.test.mo` (release guard).

---

## 4. Doc consistency (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| D-01 | P0 | `ORCHESTRATION-RUNBOOK.md` Wave 1 table stale (E6.S8 NEXT, rest backlog) | **Fixed** |
| D-02 | P0 | `TRADE-STATE-MACHINE.md` missing `funded_locked` → `#funded` mapping | **Fixed** §13 |
| D-03 | P0 | `IMPLEMENTATION-AUDIT-WAVE1-CYCLE1.md` partial / pre-council | **Fixed** — this merged file |
| D-04 | P1 | Root `ROADMAP.md` / `AUDIT.md` still Phase-1 stubs | **Open P1** — planning artifacts canonical |

---

## P0 fix backlog (ordered — cycle 1 execution)

| # | Item | Owner | Cycle 1 |
|---|------|-------|---------|
| 1 | Sync manifest + sprint-status Wave 1 → done | Doc | ✅ |
| 2 | Wire LG-09 in `verifyPayment` | Backend | ✅ |
| 3 | BEP20 amount+recipient vs PaymentIntent | Backend | ✅ |
| 4 | `releaseListingStake` guard | Backend | ✅ |
| 5 | `assertNotBanned` financial endpoints | Backend | ✅ |
| 6 | Stake on-chain ledger | Wave 3 | ⏸ Deferred with honest FR-27 copy |
| 7 | FR-28 ecrecover | P1 | ⏸ Open |

---

## P0 closed vs remaining

| Category | Closed | Remaining |
|----------|--------|-----------|
| P0 security (S-01,S-02,S-04,S-05) | 4 | 0 |
| P0 stake on-chain (S-03) | 0 (deferred) | 1 — documented limitation |
| P0 doc/traceability (T-01,T-02,T-04,D-01,D-02,D-03) | 6 | 0 |
| P0 tests (X-01 partial, X-02) | 1.5 | 0.5 — live explorer E2E |
| **Total P0 blockers for honest Wave 1 beta** | **11/13** | **2** (stake on-chain defer + live explorer proof) |

---

## Audit clean?

**No** — cycle 2 re-audit should verify LG-09 on live path, close P1 (FR-28 crypto, EVM log parsing, frontend tests), and confirm stake limitation copy in UI.

See: `IMPLEMENTATION-AUDIT-WAVE1-CYCLE2.md` (stub).

---

## Key files changed (fix dev)

| Area | Files |
|------|-------|
| LG-09 / BEP20 | `src/backend/lib/Payments.mo`, `src/backend/mixins/payments-api.mo`, `src/backend/main.mo` |
| Stake release | `src/backend/lib/Escrow.mo`, `src/backend/mixins/stake-api.mo` |
| Ban checks | `src/backend/lib/Auth.mo`, `src/backend/mixins/escrow-api.mo`, `payments-api.mo`, `stake-api.mo` |
| Tests | `test/Payments.test.mo`, `test/Stake.test.mo` |
| Docs | `scripts/story-manifest.mjs`, `traceability-matrix.md`, `prd.md`, `ORCHESTRATION-RUNBOOK.md`, `TRADE-STATE-MACHINE.md` |
