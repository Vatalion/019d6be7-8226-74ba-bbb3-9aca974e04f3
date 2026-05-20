---
workflowType: gap-analysis
document_output_language: en
---

# Gap analysis — vision vs documentation vs code

**Date:** 2026-05-19

## 1. Three-way comparison

| Dimension | Owner vision (2026-05) | Old `crypto_market` PRD | Current `cryptomarket-p2p` |
|-----------|------------------------|-------------------------|----------------------------|
| Product type | OLX-like **goods** | Crypto **trading** emphasis | **Goods** marketplace (aligned) |
| Payments | Stablecoin P2P, no fiat layer | HTLC + bank/cash/wallets | Stablecoin; **manual** confirm |
| Trust | Trustless platform mechanics | HTLC atomic swap | **Coordinated** + disputes |
| Identity | Anonymous / pseudonymous | Email/OAuth + II map | **II only** (good) |
| Client | (implied web OK) | Flutter mobile | **React web** |
| Backend | ICP | Multi-canister | **Single canister** |
| Shipping | Not central to vision | UA carriers big | **Pickup lock** |

## 2. Where we went right

- Built the **OLX skeleton** (listings, detail, create, trades, profiles).
- **Stablecoin-only** positioning in code and recent live UI (4 tokens).
- **No fiat payment methods** in active product.
- Security baseline: guards, rate limits, dispute + chat.
- Caffeine deploy path works; live smoke/flows exist.

## 3. Where we drifted

| Drift | Impact | Fix |
|-------|--------|-----|
| Marketing “trustless/escrow” vs manual payment | User trust risk | PRD Phase 1 copy; UI strings |
| HTLC in ROADMAP/BACKLOG as near-term | Wrong engineering priority | Mark Phase 3 only in epics |
| Governance/Vault/Jury UI built early | Noise | Keep deferred per epics |
| 11 tokens in types, 4 active | Confusion | Already trimming UI |
| UA carrier backend before OLX polish | Complexity | Keep pickup lock |
| Docs said “16/16 complete” | False confidence | Use `epics.md` + this file |
| Old PRD imported literally would **worsen** drift | — | Curated BMAD set instead |

## 4. Functional gaps (priority)

### P0 — Product honesty

- [x] Audit all user-facing strings for “trustless”, “atomic”, “escrow holds funds” (frontend clean; internal keys keep `escrow.*` names).
- [x] One-page “How payment works” in app (`/how-payments-work`, live draft **95**).

### P1 — OLX completeness

- [x] Listing edit E2E
- [x] Deactivate with confirmation
- [x] Search/filter URL sync
- [x] Full-text search (title + description via `searchListings`)

### P2 — Settlement credibility

- [x] Payment verification path documented + admin explorer keys UI; live tx proof after keys configured
- [x] Explicit manual-path copy on trade page + payments guide

### P3 — Trustless path

- [ ] Architecture spike for ICRC escrow
- [ ] No user promise until shipped

### P4 — Compliance gaps

- [ ] Account closure / data export (noted in old PRD, never built)

## 5. Documentation gaps (closed by this migration)

| Gap | Resolution |
|-----|------------|
| No brief PRD in new repo | `_bmad-output/planning-artifacts/prd.md` |
| Conflicting BACKLOG vs reality | `epics.md` + this file |
| Wrong arch from old repo | `architecture.md` for Caffeine monolith |
| No migration trail | `docs/bmad/MIGRATION-FROM-CRYPTO_MARKET.md` |

## 6. Recommended north star (one sentence)

> **Phase 1:** The safest OLX-style crypto goods market with platform-enforced trade rules.  
> **Phase 3:** The same, but funds are locked and released by protocol rules.

Use this sentence in PRD, homepage, and agent prompts until Phase 3 ships.
