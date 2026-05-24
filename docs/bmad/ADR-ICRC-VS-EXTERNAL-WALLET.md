# ADR: External wallet vault vs ICRC-first escrow (E9.S4)

**Status:** Accepted for Phase 3 planning  
**Date:** 2026-05-23

## Context

Wave 1 uses wallet-to-wallet settlement for USDT TRC20/BEP20 with canister state only. ERC20 manual enablement is Wave 3 after review. Phase 3 Gate C targets ckUSDC/ckUSDT via ICRC-2 escrow in `escrow-api.mo`. External vault scope remains built-deferred under E10.

## Decision

**ICRC-first** for on-chain escrow on ICP:

1. Buyer `icrc2_approve` → `initiateOnChainTrade` → canister subaccount lock
2. Release/refund via `icrc1_transfer` in `confirmPaymentReceived`, disputes, timeouts
3. External vault scope remains **evaluation-only** until cross-chain goods settlement is scoped

## Consequences

- No marketing of “funds locked on-chain” for external chains until a separate ADR + Gate C
- Vault module (E10) stays built-deferred; not wired to trade CTA
- Explorer verification path (E4) continues for manual off-chain tokens

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| Vault-first for all tokens | Higher ops/legal surface; not required for ck* Phase 3 beta |
| Cross-chain lock-release | Out of Phase 3 scope per PRD north star |
