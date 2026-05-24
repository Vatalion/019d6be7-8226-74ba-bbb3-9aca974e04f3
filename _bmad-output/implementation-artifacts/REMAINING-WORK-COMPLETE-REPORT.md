# Remaining Work Complete Report — CryptoMarket P2P

**Date:** 2026-05-23  
**Executor:** Amelia (gsd-executor)  
**Scope:** Agent-only P1 hardening (Phase A), Wave 4+ stubs (Phase B), optional hardening (Phase C)

---

## Executive summary

Agent-executable hardening for CryptoMarket P2P is **complete**. All automated test suites pass. Items requiring counsel, legal, prod security sign-off, or owner product decisions remain **documented and human-blocked only**.

---

## Phase A — P1 Hardening (DONE)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| A1 | FR-28 / E4.S7 — EVM ecrecover + Tron verify | **Done** | `HttpJsonRpc.mo`, `EvmWalletSig.mo`, `TronWalletSig.mo`; wired in `auth-api.mo` `linkExternalWallet`; `WalletLink.test.mo` crypto helpers |
| A2 | E6.S8 stake on-chain depth | **Done** | `StakeLedger.mo`, `stakeOnChainEnabled` flag (default off); ck ICRC deposit/release/seize paths in `stake-api.mo` |
| A3 | Frontend autotests (vitest) | **Done** | `vitest` in `package.json`; `wave1-policy.test.ts`, `wallet-link-smoke.test.ts` — 16 tests |
| A4 | Digital golden path E2E | **Done** | `test/digital-golden-path.test.mjs` — 3 scenarios |
| A5 | Moderator SLA dashboard | **Done** | `DisputeQueueTable.tsx` — SLA countdown, L1/L2 filters, overdue toggle, badges |
| A6 | Buy-flow + wallet link smoke | **Done** | `wallet-link-smoke.test.ts` data-ocid contract + handshake gating in `wave1-policy.test.ts` |

---

## Phase B — Wave 4+ (owner/product gated)

| Story | Agent action | Status |
|-------|--------------|--------|
| E7.S1 self-pickup/meetup | **Skipped** — USER-PRODUCT-CONTRACT §7 NP-only; requires owner + legal | Human-blocked |
| E6.S4 jury dashboard | UI exists (`JurorDashboardPage.tsx`); jury mode product-deferred (D-014) | Human-blocked (nav enable) |
| E7.S4 Ukrposhta/Meest | Backend `Shipping.mo` intact; **UI locked** per AGENTS.md E7.S3 | Human-blocked (owner decision) |
| E10.S1 governance proposals | Code exists; launch deferred | Human-blocked (product) |
| E10.S2 vault balances | Code exists; launch deferred | Human-blocked (product) |
| E10.S3 treasury UI | Code exists; launch deferred | Human-blocked (product) |
| E12.S2 external KYC | Admin manual tier done; external provider = Wave 4+ legal/vendor | Human-blocked (legal) |
| Buyer stake (D-047) | Seller stake E6.S8 complete; buyer stake not in contract Wave 1–3 | Deferred — needs new story + owner |
| Omnichain trustless | **ADR only** | `docs/bmad/ADR-OMNICHAIN-DEFERRED.md` |

---

## Phase C — Optional hardening (DONE / partial)

| Item | Status | Notes |
|------|--------|-------|
| Digital XOR vs AES-GCM docs + tests | **Done** | `test/digital-encryption-layer.test.mjs` |
| E6.S7 cross-wallet ck collateral waterfall | **Partial** | ck waterfall in `LiabilityWaterfall.mo`; cross-wallet ck collateral step needs Gate C live testnet | Human-blocked (testnet keys) |
| `pnpm bindgen` sync | **Deferred** | No `bindgen` script in repo root; manual IDL in `walletLinkClient.ts` still required for MCP-shaped subset | Low priority |

---

## Test evidence

```text
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p && mops test
→ Tests passed, 17 files

cd src/frontend && pnpm test
→ 16 passed (2 files)

cd src/frontend && pnpm typecheck
→ OK

node --test test/digital-golden-path.test.mjs test/digital-encryption-layer.test.mjs
→ 6 passed
```

---

## Human-blocked only (do not block beta manual path)

| ID | Item | Owner action |
|----|------|--------------|
| COMPLIANCE | `COMPLIANCE-LAUNCH-GATE.md` counsel sign-off | Legal counsel |
| D-W3-04 | Insurance disclaimer legal sign-off | Legal |
| W3-4/5/10 | Testnet ckUSDC E2E with live keys | Ops + security |
| Gate C prod | `trustlessEscrowEnabled` + security sign-off ref | Admin + security |
| E7.S1 / E7.S4 | Self-pickup / alternate carriers | Product owner |
| E6.S4 / E10.* | Jury / governance / vault nav | Product owner |
| E12.S2 provider | External KYC vendor + legal | Compliance |
| D-047 | Buyer stake | New story + owner |

---

## Honest copy notes

- **Manual stake (TRC20/BEP20/ERC20):** Internal platform ledger — funds are accounting entries until off-chain settlement paths complete.
- **ck stake:** On-chain ICRC moves apply only when admin sets `stakeOnChainEnabled=true` (default **false**).
- **Wallet link:** Cryptographic verify via JSON-RPC when RPC keys configured; fails closed on mismatch.

---

## Self-Check: PASSED

- [x] mops test 17/17
- [x] pnpm test 16/16
- [x] pnpm typecheck
- [x] Node digital E2E 6/6
- [x] REMAINING-WORK-COMPLETE-REPORT.md written
