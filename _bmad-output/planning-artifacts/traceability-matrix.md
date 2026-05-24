---
workflowType: traceability
document_output_language: en
updatedAt: 2026-05-23
reconciledWith: scripts/story-manifest.mjs
---

# Traceability Matrix — Contract → PRD → Stories → Verification

Canonical flows: `_bmad-output/planning-artifacts/USER-PRODUCT-CONTRACT.md`, `prd.md`, `scripts/story-manifest.mjs`, generated story files, and implementation plans.

---

## Contract Rules

| Contract rule | PRD / decision | Story owner | Verification |
|---------------|----------------|-------------|--------------|
| R1 upfront cost transparency | FR-12, D-001, D-018 | E3.S8 | Buy screen AC; `Payments.test.mo`; UX smoke |
| R2 seller handshake 24h | FR-21a, D-006 | E3.S7 | `Escrow.test.mo`; E13 LG-01/LG-02/LG-16 |
| R3 buyer cancel pre-shipment | FR-21c, D-009 | E3.S9 | `Escrow.test.mo`; E13 LG-03/LG-04 |
| R3a platform/seller/buyer split | FR-21c, D-009/D-025 | E3.S9 | 85/10/5 dust test |
| R4 seller at fault / no ship / fake goods | FR-27, FR-44, FR-44a, D-008/D-019/D-021/D-023/D-038/D-039 | E6.S8, E7.S3, E6.S9, E6.S6/E6.S7, E10.S4 | Stake lock; ship-by SLA; dispute/refund path; liability queue; capped reserve policy |
| R5 buyer-at-fault abuse | D-047 | Deferred buyer-stake future epic; Wave 1 uses reputation/velocity/account review | Documented defer; no Wave 1 buyer-stake promise |
| R6 post-shipment dispute | FR-40/FR-41, D-017/D-031/D-032/D-033 | E6.S9 | L1/L2 freeze tests; moderator SLA |
| R7 digital delivery / inspection | FR-52, D-026-D-030 | E2.S11, E7.S2 | Encrypted upload; deliveryRecordAt; redownload-no-reset |
| R8 honest settlement language | FR-24/FR-25, D-004/D-011/D-016/D-036 | E3.S10, E4.S2, E9.S2, E9.S6 | Fail-closed explorer tests; Gate C safety tests |
| Physical delivery Nova Poshta only | FR-51, D-003/D-012/D-019/D-045 | E7.S3, E7.S1 deferred | `Shipping.test.mo`; E13 LG-10/LG-11/LG-12/LG-15 |
| Seller stake 5% min 10 USDT | FR-27, D-008/D-020 | E6.S8 | Stake lock/withdraw tests |
| Wallet binding / payout snapshot | FR-28, D-015 | E4.S7, E3.S10 | Signed nonce, immutable snapshot, wallet-change hold/reject |
| Compliance launch gate | NFR-Compliance | E13.S1, E12.S1/E12.S2 | `COMPLIANCE-LAUNCH-GATE.md`; counsel sign-off evidence |

---

## PRD Requirements

| FR | Requirement | Story owner | Status | Verification |
|----|-------------|-------------|--------|--------------|
| FR-1 | Internet Identity login | E1.S1 | Done | `Auth.test.mo`; auth smoke |
| FR-2 | Profile | E1.S2 | Done | `Auth.test.mo` |
| FR-3 | Ban/suspend | E1.S4, E8.S1 | Done | `Admin.test.mo` |
| FR-4a | Admin manual verified tier | E12.S2 | Done for beta admin tier | `Reputation.test.mo`; admin tier smoke |
| FR-4b | External KYC provider integration | E12.S2 | Deferred Wave 4+ | Legal/vendor review before provider |
| FR-10 | Create listing | E2.S1 | Done | `Marketplace.test.mo` |
| FR-11 | Search/filter | E2.S2, E2.S8 | Done | `Marketplace.test.mo` |
| FR-12 | Listing detail + buy CTA + upfront fee | E2.S3, E3.S8 | Done Wave 1 | E3.S8 fee quote UI |
| FR-13 | Edit listing | E2.S4 | Done | Edit flow |
| FR-14 | Deactivate listing | E2.S5 | Done | `Marketplace.test.mo` |
| FR-15 | Seller profile | E2.S6 | Done | Public listing filter test |
| FR-20 | Initiate buy request | E3.S1, E3.S7 | Existing + Wave 1 handshake rewrite | `Escrow.test.mo` |
| FR-21 | Trade state machine | E3.S1-E3.S6 | Done baseline; Wave 1 extensions below | `Escrow.test.mo` |
| FR-21a | Seller 24h handshake before payment | E3.S7 | Done Wave 1 | E13 LG-01/LG-02/LG-16 |
| FR-21b | PaymentIntent/fund lock only after handshake | E3.S10 | Done Wave 1 | E13 LG-07/LG-08/LG-14 |
| FR-21c | Buyer cancel pre-ship 85/10/5 | E3.S9 | Done Wave 1 | E13 LG-03/LG-04 |
| FR-21d | High-value caps/tier gates | E3.S11 | Done Wave 3 | `Escrow.test.mo` W3-11 |
| FR-22 | Buyer payment sent signal | E3.S10, E4.S2 | Superseded by fail-closed explorer semantics | Payment verification tests |
| FR-23 | Seller payment received signal | E4.S2 | Auxiliary only; no paid state without explorer | `Payments.test.mo` |
| FR-24 | Explorer payment verification | E4.S2, E3.S10, E4.S8 | Done Wave 1–3 (TRC20/BEP20 + ERC20) | `PAYMENT-VERIFICATION-E2E.md`; `Payments.test.mo` W3-12 |
| FR-25 | On-chain ck escrow | E9.S1, E9.S2, E9.S3, E9.S6 | Done Wave 3 (Gate C default off; enable via admin checklist) | `ONCHAIN-SETTLEMENT-DESIGN.md`; `Escrow.test.mo`; testnet E2E P1 |
| FR-26 | Cross-chain lock-release research | E9.S4/E9.S5 | Rejected/deferred | ADR docs |
| FR-27 | Seller stake | E6.S8 | Done Wave 1 (internal ledger — on-chain deferred Wave 3) | Stake tests |
| FR-28 | External wallet signed-nonce binding | E4.S7 | Done Wave 1 (message binding; ecrecover P1) | Signed nonce + payout snapshot tests |
| FR-29 | Four-token catalog; wave-gated settlement enablement | E4.S1, E4.S8 | Done Wave 3 (ERC20 manual + catalog) | `home-approved-tokens`; `Payments.test.mo` W3-12 |
| FR-30 | Per-trade chat | E5.S1 | Done | `Messaging.test.mo` |
| FR-31 | Unread/notifications | E5.S2 | Done | `Messaging.test.mo` |
| FR-32 | XSS-safe messages | E5.S3 | Done | Escape tests |
| FR-40 | Open dispute | E6.S1 | Done baseline | `Disputes.test.mo` |
| FR-41 | Moderator resolve / L1-L2 playbook | E6.S2, E6.S9 | Done Wave 2 | SLA/freeze tests `Disputes.test.mo` |
| FR-42 | Jury/DAO queue | E6.S4 | Built-deferred Wave 4+ | Product-deferred |
| FR-43 | Dual reputation | E6.S5 | Done | `Reputation.test.mo` dual-score regression |
| FR-44 | Global liability | E6.S6, E6.S7 | Done Wave 3 | `Reputation.test.mo`; `LiabilityWaterfall.test.mo` W3-9 |
| FR-44a | Capped insurance reserve | E10.S4 | Done Wave 3 | `Treasury.test.mo` W3-6..8 |
| FR-50 | Self-pickup | E7.S1 | Built-deferred Wave 4+; not active scope | Hidden/self-pickup regression |
| FR-51 | Nova Poshta | E7.S3 | Done Wave 1 | `Shipping.test.mo`; E13 LG-10/LG-11/LG-12/LG-15 |
| FR-52 | Digital delivery | E2.S11, E7.S2 | Done Wave 2 | `Escrow.test.mo` W2-1..6,12; `Marketplace.test.mo` URL redaction |
| FR-60 | Admin dashboard | E8.S1-E8.S6 | Done | `Admin.test.mo` |
| FR-61 | Observability | E8.S5 | Done | Admin smoke |
| FR-62 | Vault/treasury UI | E10.S1-E10.S3 | Built-deferred | Product-deferred |
| FR-70 | Favorites | E11.S1 | Done | `Engagement.test.mo` |
| FR-71 | Saved searches/alerts | E11.S2/E11.S5 | Done | `Engagement.test.mo` |
| FR-72 | Listing inquiry | E11.S3 | Done | `Engagement.test.mo` |
| FR-73 | Bump/promote | E11.S4 | Done | `Engagement.test.mo` |

---

## Non-Functional / Compliance Requirements

| Requirement | Scope | Story owner | Status | Verification |
|-------------|-------|-------------|--------|--------------|
| NFR-1 | Availability and live-app smoke gates | E13.S1 | Backlog Wave 1 | LG-13/LG-17; Caffeine smoke/flow evidence before beta |
| NFR-2 | Internet Identity auth only; anonymous updates blocked | E8.S6 | Done | Auth guard tests; anonymous write rejection checks |
| NFR-3 | Per-endpoint rate limiting / abuse throttles | E8.S5 | Done | Rate limit tests; admin metrics |
| NFR-4 | Ukrainian + English i18n | E3.S6, E13.S1 | Done baseline; launch copy gate pending | i18n snapshot/copy audit; live smoke |
| NFR-5 | Privacy / minimized PII | E12.S1, E13.S1 | Baseline done; counsel gate pending | Export/delete smoke; retention review |
| NFR-6 | Security validation / escrow guards | E8.S6, E9.S2, E9.S6, E13.S1 | Baseline + Gate C checklist done; testnet E2E P1 | Input validation; no pre-handshake lock; `Admin.test.mo` Gate C |
| PRD §7 | Compliance and legal launch hygiene | E12.S1, E12.S2, E13.S1 | Baseline done; launch counsel gate required | `COMPLIANCE-LAUNCH-GATE.md`; export/delete smoke; sanctions/AML/KYC sign-off |

---

## Launch Gates

| Gate | Required evidence |
|------|-------------------|
| Wave 1 technical | E13.S1 LG-01..LG-17 green |
| Wave 1 compliance | `COMPLIANCE-LAUNCH-GATE.md` checklist signed off |
| Wave 2 | Wave 1 shipped + E2.S11/E7.S2/E6.S9 green |
| Wave 3 | Wave 2 shipped + Gate C security/testnet checklist green |

---

## Reconciliation Notes

- **Active scope** means a user-facing Wave 1-3 promise.
- **Built-deferred** means code or old flow may exist but cannot be promised or exposed without the listed wave gate.
- **Backlog** stories are implementation-ready docs, not shipped code.
- `scripts/story-manifest.mjs` is the source of truth for story status; this matrix must be updated when manifest status or PRD FRs change.
