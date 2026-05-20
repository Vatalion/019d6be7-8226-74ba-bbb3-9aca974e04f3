# Payment verification — manual E2E (Phase 1)

Phase 1 trades use **wallet-to-wallet** stablecoin transfer. On-chain verification is **optional** and does not custody funds on the platform.

## Preconditions

- Two Internet Identity principals (buyer + seller), both with completed onboarding.
- An active listing priced in an approved token (e.g. **USDT_TRC20**).
- Buyer has test USDT on Tron (TRC20) and the seller’s wallet address for that network.

## Happy path

1. Buyer opens the listing and starts a trade.
2. On the trade page, read **Phase 1 — wallet-to-wallet payment** (`data-ocid="payment-phase-notice"`).
3. Buyer sends USDT on TRC20 to the seller’s address (outside the app).
4. Buyer taps **I have sent the payment** (`data-ocid="btn-payment-sent"`).
5. Trade status becomes `buyer_confirmed`; **Payment verification** widget appears.
6. Buyer pastes the Tron transaction hash and submits verify.
7. Expect `verified` or a clear error (wrong network, amount mismatch, pending).
8. Seller confirms **I have received the payment** (or delivery flow if tracking applies).
9. Trade reaches `complete`.

## Admin prerequisites (live)

1. Sign in as **admin** → **Admin** → **Settings** tab.
2. Scroll to **Blockchain explorer API keys** and save:
   - **TronGrid** — TRC20 (`verifyPayment` for `#USDT_TRC20`)
   - **BSCScan** — BEP20 (`#USDT_BEP20`)
   - **Infura** — ERC20 / USDC (`#USDT_ERC20`, `#USDC_ERC20`)
3. Status chips show **Configured** / **Not configured** (keys are never displayed after save).

Without keys, `verifyPayment` may fail or return pass-through for address checks — manual seller confirmation still works.

## What we do not prove in CI

- Live Tron RPC / third-party indexer responses (environment-dependent).
- Real II sessions in Playwright (see caffeine-cli flow templates that require saved profile).

## Automated coverage today

- `test/Payments.test.mo` — amount formatting and validation helpers.
- Live smoke/flows via `caf app smoke` and `caf app flow` in **caffeine-cli** (headed II flows excluded).

## Failure cases to spot-check manually

| Step | Symptom | Likely cause |
|------|---------|----------------|
| Verify | Invalid hash | Wrong network or typo |
| Verify | Amount mismatch | Sent less than trade amount |
| Seller confirm | Blocked | Trade not in `buyer_confirmed` / `payment_verified` |
