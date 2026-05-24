---
workflowType: stories-index
canonical: true
location: _bmad-output/implementation-artifacts/stories
updatedAt: 2026-05-23
---

# Implementation stories index (BMAD BMM)

Canonical location per BMAD: **`_bmad-output/implementation-artifacts/stories/`**.

Planning artifacts: [`../../planning-artifacts/epics.md`](../../planning-artifacts/epics.md).
Sprint tracking: [`../sprint-status.yaml`](../sprint-status.yaml).

Each story: Implementation scope, Tasks, Dev Notes, architecture/library/file/testing, References, QA Results.
See [STORY-QA-GUIDE.md](./STORY-QA-GUIDE.md).

## E1

- [E1.S1: Internet Identity login](./e01-identity/e01-s01-ii-login.md) — **done**
- [E1.S2: Create and update profile](./e01-identity/e01-s02-profile.md) — **done**
- [E1.S3: Public profile privacy](./e01-identity/e01-s03-public-profile-privacy.md) — **done**
- [E1.S4: Ban and suspend abusive users](./e01-identity/e01-s04-ban-suspend.md) — **done**

## E2

- [E2.S1: Create listing with photos](./e02-marketplace/e02-s01-create-listing.md) — **done**
- [E2.S2: Search and filter listings](./e02-marketplace/e02-s02-search-filter.md) — **done**
- [E2.S3: Listing detail and buy CTA](./e02-marketplace/e02-s03-listing-detail.md) — **done**
- [E2.S4: Edit listing](./e02-marketplace/e02-s04-edit-listing.md) — **done**
- [E2.S5: Deactivate listing](./e02-marketplace/e02-s05-deactivate-listing.md) — **done**
- [E2.S6: Seller profile and listings grid](./e02-marketplace/e02-s06-seller-profile-grid.md) — **done**
- [E2.S7: Digital goods listing and delivery](./e02-marketplace/e02-s07-digital-listing.md) — **done**
- [E2.S8: OLX-aligned category taxonomy](./e02-marketplace/e02-s08-category-taxonomy.md) — **done**
- [E2.S9: Report listing](./e02-marketplace/e02-s09-report-listing.md) — **done**
- [E2.S10: Category-specific attributes (auto, RE)](./e02-marketplace/e02-s10-olx-category-attributes.md) — **done**
- [E2.S11: Digital file upload and auto-delivery](./e02-marketplace/e02-s11-digital-file-upload-auto-delivery.md) — **done**

## E11

- [E11.S1: Favorites and watchlist](./e11-engagement/e11-s01-favorites.md) — **done**
- [E11.S2: Saved searches](./e11-engagement/e11-s02-saved-searches.md) — **done**
- [E11.S3: Pre-trade listing inquiry](./e11-engagement/e11-s03-listing-inquiry.md) — **done**
- [E11.S4: Bump and promote listing](./e11-engagement/e11-s04-bump-promote.md) — **done**
- [E11.S5: Saved search email/push alerts](./e11-engagement/e11-s05-saved-search-alerts.md) — **done**

## E3

- [E3.S1: Initiate trade from listing](./e03-trade/e03-s01-initiate-trade.md) — **done**
- [E3.S2: Buyer marks payment sent](./e03-trade/e03-s02-payment-sent.md) — **done**
- [E3.S3: Seller receipt signal after explorer verification](./e03-trade/e03-s03-payment-received.md) — **done**
- [E3.S4: Refund and cancel paths](./e03-trade/e03-s04-refund-cancel.md) — **done**
- [E3.S5: Trade detail UX and chat entry](./e03-trade/e03-s05-trade-detail-ux.md) — **done**
- [E3.S6: Honest Phase 1 payment copy](./e03-trade/e03-s06-honest-payment-copy.md) — **done**
- [E3.S7: Seller handshake 24h with auto-cancel](./e03-trade/e03-s07-seller-handshake-24h.md) — **done**
- [E3.S8: Upfront fee breakdown on buy screen](./e03-trade/e03-s08-upfront-fee-breakdown.md) — **done**
- [E3.S9: Buyer cancel before shipment — 10/5/85 split](./e03-trade/e03-s09-buyer-cancel-penalty-split.md) — **done**
- [E3.S10: Fund lock after seller handshake](./e03-trade/e03-s10-post-handshake-fund-lock.md) — **done**
- [E3.S11: High-value trade caps and tier gates](./e03-trade/e03-s11-high-value-trade-caps.md) — **done**

## E4

- [E4.S1: Four-token product scope in UI](./e04-payments/e04-s01-four-token-scope.md) — **done**
- [E4.S2: Explorer payment verification](./e04-payments/e04-s02-explorer-verification.md) — **done**
- [E4.S3: Verification retry and circuit breaker](./e04-payments/e04-s03-verify-retry.md) — **done**
- [E4.S4: Admin explorer API keys](./e04-payments/e04-s04-admin-explorer-keys.md) — **done**
- [E4.S5: Payment method UX (QR, clipboard, hints)](./e04-payments/e04-s05-payment-method-ux.md) — **done**
- [E4.S6: Price oracle (CoinGecko)](./e04-payments/e04-s06-price-oracle.md) — **done**
- [E4.S7: External wallet nonce-proof linking](./e04-payments/e04-s07-external-wallet-nonce-proof.md) — **done**
- [E4.S8: ERC20 USDC manual path enable](./e04-payments/e04-s08-erc20-manual-enable.md) — **done**

## E5

- [E5.S1: Per-trade chat](./e05-messaging/e05-s01-trade-chat.md) — **done**
- [E5.S2: Unread counts and toasts](./e05-messaging/e05-s02-notifications.md) — **done**
- [E5.S3: XSS-safe message rendering](./e05-messaging/e05-s03-xss-safe-chat.md) — **done**

## E6

- [E6.S1: Open dispute with evidence](./e06-disputes/e06-s01-open-dispute.md) — **done**
- [E6.S2: Moderator resolve dispute](./e06-disputes/e06-s02-moderator-resolve.md) — **done**
- [E6.S3: Reputation tiers and trade limits](./e06-disputes/e06-s03-reputation-tiers.md) — **done**
- [E6.S4: Jury dashboard and voting](./e06-disputes/e06-s04-jury-dashboard.md) — **built-deferred**
- [E6.S5: Dual buyer/seller reputation](./e06-disputes/e06-s05-dual-reputation.md) — **done**
- [E6.S6: Global liability state — Wave 3 depth](./e06-disputes/e06-s06-global-liability.md) — **done**
- [E6.S7: Cross-collateral waterfall — Wave 3 depth](./e06-disputes/e06-s07-cross-collateral.md) — **done**
- [E6.S8: Seller listing stake — 5% min 10 USDT](./e06-disputes/e06-s08-seller-listing-stake.md) — **done**
- [E6.S9: Dispute playbook — L1/L2 states, freeze, evidence, SLA](./e06-disputes/e06-s09-dispute-playbook.md) — **done**

## E7

- [E7.S1: Self-pickup lock (superseded by contract)](./e07-fulfillment/e07-s01-self-pickup-lock.md) — **built-deferred**
- [E7.S2: Digital delivery inspection window (24h) — Wave 2 enhance](./e07-fulfillment/e07-s02-digital-inspection.md) — **done**
- [E7.S3: Nova Poshta E2E (Phase 1.5 in-scope)](./e07-fulfillment/e07-s03-nova-poshta-e2e.md) — **done**
- [E7.S4: Ukrposhta and Meest integrations](./e07-fulfillment/e07-s04-ukrposhta-meest.md) — **built-deferred**
- [E7.S5: Tracking webhooks and timeline](./e07-fulfillment/e07-s05-tracking-webhooks.md) — **done**

## E8

- [E8.S1: Admin dashboard](./e08-admin/e08-s01-admin-dashboard.md) — **done**
- [E8.S2: System settings and allowed tokens](./e08-admin/e08-s02-system-settings.md) — **done**
- [E8.S3: Audit log](./e08-admin/e08-s03-audit-log.md) — **done**
- [E8.S4: Observability metrics](./e08-admin/e08-s04-observability.md) — **done**
- [E8.S5: Rate limiting on public updates](./e08-admin/e08-s05-rate-limiting.md) — **done**
- [E8.S6: Security baseline (guards, validation)](./e08-admin/e08-s06-security-baseline.md) — **done**

## E9

- [E9.S1: ICRC escrow design](./e09-onchain-escrow/e09-s01-icrc-escrow-design.md) — **done**
- [E9.S2: Fund lock after seller handshake (on-chain)](./e09-onchain-escrow/e09-s02-fund-lock-on-trade.md) — **done**
- [E9.S3: Auto-release and refund rules — Wave 3 with Gate C](./e09-onchain-escrow/e09-s03-auto-release-rules.md) — **done**
- [E9.S4: External wallet vault evaluation](./e09-onchain-escrow/e09-s04-external-wallet-evaluation.md) — **done**
- [E9.S5: Cross-chain lock-release evaluation](./e09-onchain-escrow/e09-s05-cross-chain-evaluation.md) — **done**
- [E9.S6: Gate C beta enable — ckUSDC/ckUSDT on-chain lock](./e09-onchain-escrow/e09-s06-gate-c-beta-enable.md) — **done**

## E10

- [E10.S1: Governance proposals and voting](./e10-governance/e10-s01-governance-proposals.md) — **built-deferred**
- [E10.S2: Vault addresses and balance refresh](./e10-governance/e10-s02-vault-balances.md) — **built-deferred**
- [E10.S3: Treasury fee and withdrawals](./e10-governance/e10-s03-treasury.md) — **built-deferred**
- [E10.S4: Capped insurance reserve policy](./e10-governance/e10-s04-insurance-reserve-policy.md) — **done**

## E12

- [E12.S1: Account export and deletion](./e12-compliance/e12-s01-gdpr-export-delete.md) — **done**
- [E12.S2: Optional KYC tiers](./e12-compliance/e12-s02-kyc-tiers.md) — **done**

## E13

- [E13.S1: P0 race condition test suite — launch gate](./e13-launch-gate/e13-s01-p0-race-tests.md) — **done**
