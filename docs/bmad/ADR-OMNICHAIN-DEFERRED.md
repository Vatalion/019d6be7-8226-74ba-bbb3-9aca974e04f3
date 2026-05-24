# ADR: Omnichain Trustless Settlement — Deferred Hooks

**Status:** Accepted (defer full implementation)  
**Date:** 2026-05-23  
**Stories:** E9.S4, E9.S5, Wave 4+ omnichain

## Context

CryptoMarket P2P Wave 1–3 ships coordinated manual settlement (TRC20/BEP20/ERC20) and optional Gate C ckUSDC/ckUSDT ICRC escrow. Omnichain smart-vault lock/release (legacy 4.5) remains out of product scope.

## Decision

1. **No omnichain trustless UI or marketing** until a future E14 epic with owner sign-off.
2. **Settlement hooks** remain in `Escrow.mo` / `OnChainSettlement.mo` — extensible for ICRC-only paths today.
3. **Vault UI** (`E10.S2`) stays product-deferred; vault address derivation in `Vault.mo` is evaluation-only.
4. **Cross-chain verification** for manual paths uses HTTPS outcalls (`Payments.mo`), not omnichain bridges.

## Consequences

- Agents must not invent bridge/wormhole/HTLC omnichain flows without new ADR + owner approval.
- `trustlessEscrowEnabled` applies **only** to ck tokens on ICP (Gate C).
- Future omnichain work starts with threat model + legal review, not frontend toggles.

## Hooks (implementation anchors)

| Hook | Location | Purpose |
|------|----------|---------|
| `isOnChainToken` | `Escrow.mo` | Routes ck vs manual |
| `ledgerCanisterId` | `Escrow.mo` | Configurable ICRC ledgers |
| `Vault.mo` | address derivation | Evaluation / future deposit UX |
| `WalletLink` | external wallets | Non-custodial payout/stake instruments |
