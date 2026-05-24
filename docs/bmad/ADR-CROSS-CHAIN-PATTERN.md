# ADR: Cross-chain lock-release pattern (E9.S5)

**Status:** Accepted — ICRC-only for Phase 3 beta  
**Date:** 2026-05-23

## Context

PRD FR-26 asks for evaluation of cross-chain lock-release for goods trades. Phase 1 is single-platform state; Phase 3 beta is ICP-native stablecoins only.

## Decision

1. **Phase 3 beta:** single-ledger ICRC-2 escrow per trade (ckUSDC/ckUSDT on ICP)
2. **Cross-chain:** deferred; document as future milestone requiring:
   - Bridge/oracle trust model
   - Dispute alignment across chains
   - Regulatory review for custodial vs non-custodial claims

## Pattern sketch (future)

```
Buyer (chain A) ──lock──► Escrow coordinator ──release──► Seller (chain B)
                              ▲
                         Dispute freeze (canister state)
```

Not implemented in codebase until Gate C+ for cross-chain is approved.

## Consequences

- E9.S5 satisfied by this ADR + honest UX (no cross-chain promises in Phase 1/3 beta copy)
- E10 vault evaluation (E9.S4 ADR) remains separate from cross-chain release
