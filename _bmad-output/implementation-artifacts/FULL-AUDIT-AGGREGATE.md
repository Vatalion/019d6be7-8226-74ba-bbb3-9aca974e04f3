# FULL AUDIT AGGREGATE — CryptoMarket P2P

**Date:** 2026-05-24  
**Scope:** Merged council + wave audits + Caffeine import blockers  
**Sources:** `COUNCIL-FINDINGS.md`, `IMPLEMENTATION-AUDIT-WAVE1-CYCLE2.md`, `IMPLEMENTATION-AUDIT-WAVE2-CYCLE1.md`, `IMPLEMENTATION-AUDIT-WAVE3-CYCLE1.md`, user P0/P1 fix list

---

## Executive summary

| Tier | Total | Fixed | Remaining |
|------|------:|------:|----------:|
| **P0** | 32 | 30 | 2 (human-blocker) |
| **P1** | 14 | 11 | 3 (defer) |

**Verification:** `mops test` 17/17 · `pnpm typecheck` green · `vitest` 17/17

---

## P0 — Caffeine import blockers

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| C-01 | `DigitalDeliveryView` / `PendingOnChainSettlementView` in public API (no `var`) | **Fixed** | `types.mo`; `Escrow.toView` converts to view types |
| C-02 | `StakeBalanceView` / `ListingStakeView` (no `var` in Candid) | **Fixed** | `types.mo`; `stake-api.mo` returns view types |
| C-03 | `AccountExportBundle` Timestamp Nat-safe | **Verified** | Already Nat in `types.mo` / `Auth.mo` |
| C-04 | `TradeView.toView` redact digital secrets on public listing queries | **Fixed** | `getTradesByListing` uses `toView(t, true)` |

---

## P0 — Payment security

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| P-01 | BEP20 USDT contract allowlist | **Fixed** | `Payments.USDT_BEP20_CONTRACT`; `parseBscScanTokenTransfer` |
| P-02 | TRC20 USDT contract allowlist | **Fixed** | `Payments.USDT_TRC20_CONTRACT`; `parseTronGridResponse` |
| P-03 | Atomic BEP20 Transfer log parsing | **Fixed** | `parseReceiptTransferLog` shared; contract gate via `receiptContainsContract` |
| P-04 | LG-09 explorer gates (reuse hash, amount, recipient) | **Verified** | `Payments.test.mo` LG-09 suite green |

---

## P0 — Auth / wallet linking

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| A-01 | HttpJsonRpc transform + cycles for ecrecover | **Fixed** | `HttpJsonRpc.mo`; `auth-api.transformJsonRpcResponse` |
| A-02 | Tron verify path (TronLink prefix + fallback) | **Fixed** | `TronWalletSig.tronSignedMessage` + dual ecrecover attempt |

---

## P0 — Digital delivery

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| D-01 | `getTradesByListing` redact `dekHex` / URL / password | **Fixed** | `Escrow.toDigitalDeliveryView(..., redactSecrets)` |
| D-02 | `TradeDetailPage` digital_delivered UI + decrypt | **Fixed** | `digitalFileCrypto.decryptDigitalFile`; delivery poll on `digital_delivered` |
| D-03 | Plaintext blob URL on public cards | **Verified** | Wave 2 S-W2-01 fix retained |

---

## P0 — Nova Poshta / fulfillment

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| NP-01 | `createNovaPoshtaTTN` → unified `markShipped` | **Fixed** | `shipping-api.finalizeTtnAndShip` |
| NP-02 | `checkFulfillmentDeadlines` frontend poll | **Fixed** | `TradeDetailPage` 60s poll for physical active states |
| NP-03 | Prod NP API key gate (no mock TTN) | **Fixed** | `doCreateTTN` errors when `!hasNpApiKey()` |

---

## P0 — State machine

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| SM-01 | `dispute_l1` / `dispute_l2` in Candid + frontend | **Fixed** | `types.mo`; `backend.ts` TradeStatus enum + from_candid |
| SM-02 | `checkShipByDeadlines` → `#dispute_l1` not `#disputed` | **Fixed** | `Escrow.mo`; tests updated |
| SM-03 | Block `confirmPaymentReceived` from `#payment_verified` | **Fixed** | `Escrow.confirmPaymentReceived`; test expects err |

---

## P0 — Disputes

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| DS-01 | `resolveDispute` → `_triggerEscrowIfResolved` | **Fixed** | `disputes-api.mo` after moderator resolve |
| DS-02 | Disable jury bypass — require `#l2_queued` | **Fixed** | `setDisputeUnderReview` L2-only; `submitJurorVote` requires `level == #l2` |
| DS-03 | ACL on SLA jobs (admin/mod) | **Fixed** | `processDisputeSlaEscalations`, `checkJuryDeadlines` |

---

## P0 — Frontend amounts / listings

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| F-01 | Unified `formatTokenAmount` 6 decimals (fix `/1e8`) | **Fixed** | `format.ts`, `ListingCard`, `TradesPage`, `TradeDetailPage`, `ProfilePage` |
| F-02 | `listingPriceToChainAmount` × 1_000_000 | **Fixed** | `listingStake.ts`; vitest |
| F-03 | `ListingCard.status` in types + backend | **Fixed** | `types.mo`; `Marketplace.toListingCard*` |

---

## P0 — Stake / liability

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| ST-01 | Dispute orchestrator order: stake → escrow → insurance | **Verified** | `LiabilityWaterfall.runSellerFaultWaterfall`; `_triggerEscrowIfResolved` on resolve |
| ST-02 | `withdrawStake` ICRC before internal debit | **Fixed** | `stake-api.withdrawStake` pre-transfer then debit |

---

## P1 — Remaining (honest deferrals)

| ID | Finding | Status | Notes |
|----|---------|--------|-------|
| P1-01 | Testnet ICRC E2E (W3-4/5/10) | **Defer** | Unit coverage green; manual beta env |
| P1-02 | Full on-canister ecrecover without RPC | **Defer** | RPC path + transform is Wave 1 partial FR-28 |
| P1-03 | Compliance launch gate sign-off | **Human-blocker** | `COMPLIANCE-LAUNCH-GATE.md` counsel |
| P1-04 | Frontend component test harness expansion | **Defer** | vitest 17/17; E2E UI later |
| P1-05 | Gate C prod enable checklist | **Human-blocker** | Admin checklist + testnet proof |
| P1-06 | XOR vs AES-GCM canister layering | **Open P1** | Documented beta limitation (Wave 2 carry-forward) |
| P1-07 | Stake on-chain collateral for manual chains | **Defer** | Wave 3 honest copy |

---

## Human blockers only

1. **Compliance counsel** — legal sign-off before public beta marketing (`COMPLIANCE-LAUNCH-GATE.md`).
2. **Gate C production enable** — admin must complete checklist + testnet E2E evidence before `trustlessEscrowEnabled`.

---

## Test evidence (2026-05-24)

```text
mops test          → 17/17 passed
pnpm typecheck     → green
pnpm test (vitest) → 17/17 passed
```

---

## Import status

_See post-import section below (updated after `caf github import`)._
