---
workflowType: traceability
document_output_language: en
---

# Traceability matrix (PRD → implementation → verification)

| FR | Requirement | Primary code | Verification |
|----|-------------|--------------|----------------|
| FR-1 | II login | `useAuth.ts`, `main.tsx` | Flow: `auth-entry-public` |
| FR-2 | Public profile | `ProfilePage.tsx`, `auth-api.mo` | Manual / smoke |
| FR-3 | Ban user | `Admin.mo`, `admin-api.mo` | `Admin.test.mo` |
| FR-10 | Create listing | `CreateListingPage.tsx`, `marketplace-api.mo` | Flow: `create-listing-guard` |
| FR-11 | Search/filter | `ListingsPage.tsx`, `FilterPanel.tsx` | Flow: `browse-listings-public` |
| FR-12 | Listing detail | `ListingDetailPage.tsx` | Smoke headings |
| FR-15 | Seller profile | `SellerProfile.tsx` | Manual |
| FR-20–23 | Trade + manual pay | `TradeDetailPage.tsx`, `Escrow.mo` | `Escrow.test.mo` lifecycle |
| FR-30 | Trade chat | `Messaging.mo`, trade UI | `Messaging.test.mo` |
| FR-40 | Disputes | `Disputes.mo`, `TradeDetailPage.tsx` | `Disputes.test.mo` |
| FR-50 | Self-pickup | `deliveryPolicy.ts` | Product lock constant |
| FR-52 | Digital goods | `Crypto.mo`, escrow digital paths | `Crypto.test.mo` |
| FR-60 | Admin | `AdminPage.tsx`, `admin-api.mo` | `Admin.test.mo` |
| FR-4 | Token scope (4) | `HomePage.tsx`, `main.mo` allowedTokens | Flow: `home-approved-tokens` |
| FR-24 | Payment verify | `payments-api.mo` | **Gap** — no E2E test |
| FR-25 | On-chain escrow | — | Phase 3; not started |
| FR-42 | Jury UI | `JurorDashboardPage.tsx` | Deferred |
| FR-62 | Vault UI | `VaultPage.tsx` | Deferred |

## Test inventory

| Layer | Command / artifact |
|-------|-------------------|
| Motoko unit | `mops test` (11+ files) |
| Live smoke | `caf app smoke <projectId> --live` |
| Live flows | `.caf/.../verification/flow-templates.json` |
| Frontend unit | **None** — gap |

## BMAD workflow links

- Implementation readiness: use `gap-analysis.md` + `epics.md` before `bmad-check-implementation-readiness`.
- Course correction: use `gap-analysis.md` §3 with `bmad-correct-course` if scope drifts again.
