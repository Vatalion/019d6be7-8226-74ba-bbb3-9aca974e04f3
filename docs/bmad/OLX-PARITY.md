# OLX parity matrix — CryptoMarket P2P

**Date:** 2026-05-19  
**Phase 1 target:** OLX-style goods classifieds with crypto settlement rules.

| OLX feature | Product FR | Status | Notes |
|-------------|------------|--------|-------|
| Post ad with photos | FR-10 | Done | Create listing + object storage |
| Browse / search / filters | FR-11 | Done | URL sync, full-text search, price token |
| Ad detail + seller card | FR-12, FR-15 | Done | |
| Edit / deactivate ad | FR-13, FR-14 | Done | |
| Seller public profile | FR-15 | Done | Principal hidden from others |
| Share ad link | — | Done | Copy link on listing detail |
| Report ad | — | Done | `reportListing` → admin audit |
| In-app chat per deal | FR-30 | Done | Per-trade only (OLX often has chat) |
| Favorites / watchlist | — | Deferred | Phase 2 |
| Promoted ads | — | Out of scope MVP |
| Phone reveal | — | Out of scope (II pseudonym) |
| Pay in crypto | FR-20–23 | Done | Wallet-to-wallet Phase 1 |
| Platform disputes | FR-40–41 | Done | Moderator path |
| Shipping integrations | FR-51 | Deferred UI | Pickup-only MVP |
| Trustless escrow | FR-25 | Phase 3 | See `TRUSTLESS-SETTLEMENT-DESIGN.md` |
| Anonymous browsing | — | Partial | Public read; II for writes |
| Pseudonymous identity | FR-1–2, NFR-5 | Done | II, no mandatory KYC |

**Phase 1 parity score (corrected):** Do **not** use a single percentage. The old “~95%” claim counted only a thin create/browse/trade path and ignored OLX taxonomy (~1,259 category URLs), verticals (auto, real estate, jobs), favorites, promotion, pre-trade chat, OLX Delivery, and category-specific attributes.

See **`OLX-FULL-GAP-AUDIT.md`** for the full checklist. Honest marketplace UX parity vs OLX.ua is on the order of **~25–35%** today; crypto trade/dispute features are additions OLX does not have.
