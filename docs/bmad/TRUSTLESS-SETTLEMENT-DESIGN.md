# Trustless settlement design (Phase 3)

**Status:** Design / beta gating — not marketed as live until Gate C.

## Current state (Phase 1)

- **USDT/USDC on TRC20, BEP20, ERC20:** wallet-to-wallet; canister records trade state only.
- **ckUSDC / ckUSDT:** backend supports `initiateOnChainTrade` + ICRC-2 escrow in `escrow-api.mo`.

## Target (Phase 3)

1. Buyer approves ICRC-2 spend on ledger canister.
2. Buyer calls `initiateOnChainTrade` → tokens locked in canister subaccount.
3. Trade advances: funded → shipped/digital delivered → `releaseEscrow` to seller (minus fee).
4. Disputes freeze release; moderator outcome triggers refund or release.

## Honest UX rules

- Never label Phase 1 manual path as “trustless” or “atomic swap”.
- On-chain escrow CTA only for `#ckUSDC` / `#ckUSDT` when `TRUSTLESS_ESCROW_ENABLED` (env) is true.
- Link to `/how-payments-work` from trade and checkout flows.

## UI gating (frontend)

| Surface | Behavior |
|---------|----------|
| `ListingDetailPage` | Amber beta copy when `priceToken` is `ckUSDC` or `ckUSDT` (`detail.onChainEscrowBeta`) |
| `/how-payments-work` | Phase 1 vs Phase 3 honest copy; no “trustless” for manual path |
| `/privacy` | Pseudonymity via Internet Identity; link to payments guide |
| Footer | Links to payments guide and `/privacy` |

## Gate C exit criteria

- [ ] Testnet escrow E2E with real ICRC ledgers
- [ ] Mainnet beta with trade size cap
- [ ] Security review of `escrow-api.mo` release/refund paths
- [ ] PRD/marketing updated to allow “funds locked on-chain” wording

## Related code

- `src/backend/mixins/escrow-api.mo` — `initiateOnChainTrade`, release paths
- `src/backend/lib/Escrow.mo` — token / ledger resolution
- Admin: `ckUsdcLedgerId`, `ckUsdtLedgerId` in system settings
