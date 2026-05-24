# Payment Verification E2E — Manual Stablecoin Path

**Status:** Phase 1.5 implementation spec
**Updated:** 2026-05-23
**Decision refs:** D-002, D-011, D-015, D-016, D-024, D-044

Phase 1.5 manual settlement is **platform-coordinated explorer verification**, not trustless escrow and not seller-only confirmation. A trade must never enter `payment_verified`, `shipped`, `complete`, or payout-eligible state unless the submitted transaction matches the PaymentIntent through the configured explorer path.

---

## Scope

| Network | Wave 1 behavior |
|---------|-----------------|
| USDT TRC20 | Enabled manual settlement with explorer verification |
| USDT BEP20 | Enabled manual settlement with explorer verification |
| USDT ERC20 | Buyer-facing token catalog only; settlement enablement deferred to E4.S8/D-044 |
| USDC ERC20 | Buyer-facing token catalog only; settlement enablement deferred to E4.S8/D-044 |

Seller “received payment” is only an auxiliary human signal. It must not advance paid/verified state without explorer match.

---

## Preconditions

- Seller has confirmed the trade within 24h (E3.S7).
- PaymentIntent exists (E3.S10) and records:
  - trade id
  - token and network
  - expected token contract
  - buyer principal and expected buyer wallet, if bound
  - seller recipient wallet snapshot
  - exact amount including buyer-facing fee rules
  - creation time and 72h expiry
  - manual path vs ck path
- Explorer API key for the selected network is configured.

---

## Happy path

1. Buyer opens a seller-confirmed trade.
2. App displays PaymentIntent details: network, token, recipient, amount, fee, expiry, and warning that this is not trustless escrow.
3. Buyer sends the exact token amount to the PaymentIntent recipient on the selected network.
4. Buyer submits transaction hash.
5. Backend verifies via explorer/API outcall.
6. Verification succeeds only if all checks match:
   - chain/network
   - token contract
   - from wallet, when buyer wallet is bound
   - to wallet = PaymentIntent recipient snapshot
   - amount and decimals
   - confirmations/finality threshold
   - tx timestamp within PaymentIntent window
   - tx hash not already used by another trade
7. Trade advances to `payment_verified`.
8. Seller can mark shipped only after `payment_verified` / `funded_locked`.

---

## Fail-closed cases

| Case | Required behavior |
|------|-------------------|
| Explorer key missing | Reject verification; keep trade pending/manual_review |
| Explorer/API unavailable | Reject verification; keep trade pending/manual_review |
| Wrong network/token/contract | Reject; no paid state |
| Underpay/overpay outside tolerance | Reject; no paid state; support copy explains mismatch |
| Wrong recipient | Reject; no paid state |
| Reused tx hash | Reject; audit entry |
| PaymentIntent expired | Do not write `payment_verified`; require admin review or new intent |
| Seller confirms receipt only | Record optional note; do not advance paid state |
| ck path already funded | Reject manual verification; one settlement path per trade |

---

## Test requirements

| Test | Story | Module |
|------|-------|--------|
| Valid TRC20 tx match | E3.S10/E4.S2 | `Payments.test.mo` |
| Valid BEP20 tx match | E3.S10/E4.S2 | `Payments.test.mo` |
| Wrong token/network/amount/recipient | E3.S10/E4.S2 | `Payments.test.mo` |
| Missing explorer config fail-closed | E4.S2 | `Payments.test.mo` |
| Duplicate tx hash rejected | E4.S2 | `Payments.test.mo` |
| Late verify after expiry rejected | E3.S10 | `Payments.test.mo` |
| Manual and ck path mutually exclusive | E3.S10/E9.S2 | `Payments.test.mo` |
| Seller cannot ship before verified | E3.S10/E7.S3 | `Escrow.test.mo` |

---

## What CI does not prove

- Live explorer uptime or third-party indexer correctness.
- Real Internet Identity browser sessions in headless tests.
- Counsel/regulatory approval.

These remain launch checklist items, not substitutes for fail-closed unit and integration tests.
