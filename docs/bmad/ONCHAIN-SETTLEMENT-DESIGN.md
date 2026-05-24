# On-Chain Settlement Design — Gate C

**Status:** Wave 1 safety defaults + Wave 3 beta enablement design
**Updated:** 2026-05-23
**Decision refs:** D-004, D-007, D-016, D-034, D-035, D-036, D-037, D-042

On-chain settlement is **not** the Phase 1.5 public promise. Wave 1 only hardens safety defaults so the ck path cannot be accidentally exposed or lock funds before seller handshake. Gate C in Wave 3 enables capped ckUSDC/ckUSDT escrow only after security review and testnet E2E.

---

## Canonical sequence

```mermaid
sequenceDiagram
  participant B as Buyer
  participant S as Seller
  participant P as Platform
  participant L as ICRC Ledger

  B->>P: Buy request
  P->>S: Seller handshake request
  S->>P: Confirm within 24h
  P->>P: Create PaymentIntent(path=ck, expiry=72h)
  B->>L: ICRC-2 approve
  B->>P: initiateOnChainTrade(tradeId, intentId)
  P->>P: Check Gate C + seller-confirmed intent
  P->>L: transfer_from buyer -> escrow subaccount
  L-->>P: success/failure
  P->>P: success => funded_locked; failure => rollback to payment_intent
```

Hard rule: lock follows E3.S7 seller handshake and E3.S10 PaymentIntent. No `initiateOnChainTrade` call may create a new trade or bypass seller confirmation.

---

## Wave 1 safety defaults (E9.S2)

| Requirement | Expected behavior |
|-------------|-------------------|
| Gate C default | `trustlessEscrowEnabled=false` on fresh deploy |
| Feature flag off | Reject before any ledger call |
| Handshake pending | Reject before any ledger call |
| Manual path verified | Reject ck lock; settlement paths are mutually exclusive |
| ICRC lock failure | Roll back to `payment_intent`; never ghost-fund |
| Concurrent lock attempts | Idempotent guard; no unsafe `nextTradeId` rollback |
| Marketing | No trustless copy for manual TRC20/BEP20 |

---

## Gate C enablement (E9.S6) — implemented

Gate C may be enabled only when all checklist items are true in admin:

| Checklist item | Field |
|----------------|-------|
| Testnet ckUSDC E2E | `gateCTestnetE2ePassed` |
| Rollback tests | `gateCRollbackTestsPassed` |
| Subaccount design | `gateCSubaccountDesignReviewed` |
| Beta caps configured | `gateCBetaCapsConfigured` |
| Security sign-off | `gateCSecuritySignOffRef` (required on enable) |

Default ck beta cap: **500 USDT** (`ckOnChainBetaCapUsdCents = 50_000`).

When Gate C is disabled, **in-flight** ck trades with an active `#ck` PaymentIntent may still call `initiateOnChainTrade`; new ck trades are blocked.

---

## Gate C enablement checklist (admin)

- E9.S2 Wave 1 safety tests are green.
- E13.S1 launch/race tests are green.
- Security review of `escrow-api.mo`, ledger calls, release/refund paths, and reentrancy guards is complete.
- Testnet ckUSDC E2E passes: handshake → PaymentIntent → lock → NP/digital fulfillment → release/refund.
- Beta cap is configured (default 500 USDT equivalent).
- Admin audit record captures who enabled Gate C and which ledgers are active.

---

## Wave 3 release/refund rules (E9.S3)

| Event | Behavior |
|-------|----------|
| Fulfillment complete, no dispute | `releaseEscrow` transfers seller amount minus fee; terminal state only after ledger success |
| Buyer cancel pre-ship on ck path | 85/10/5 split on-chain; deterministic dust to platform |
| Dispute opened | Release/refund blocked until moderator outcome |
| Moderator resolves refund | Atomic refund to buyer before terminal state |
| ICRC release/refund fails | Trade remains non-terminal; retry job/audit entry created |
| Gate C disabled with in-flight ck trades | Existing ck trades complete under prior rules; new ck locks blocked |

---

## Honest UX rules

- Never label manual TRC20/BEP20 as escrow, insured settlement, or trustless.
- On-chain escrow CTA appears only for ckUSDC/ckUSDT when Gate C is enabled.
- If Gate C is disabled, ck token flows must not appear as normal buyer payment methods.
- Link `/how-payments-work` from trade/payment surfaces.

---

## Related code

- `src/backend/mixins/escrow-api.mo` — on-chain lock/release/refund API surface
- `src/backend/lib/Escrow.mo` — trade state, lock/release/refund transitions
- `src/backend/types.mo` — PaymentIntent / trade state types
- `src/frontend/src/components/trade/OnChainEscrowPanel.tsx` — gated UI
- `src/frontend/src/lib/icrcEscrow.ts` — ICRC client helper
