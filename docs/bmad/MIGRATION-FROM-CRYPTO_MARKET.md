# Migration from `crypto_market` → `cryptomarket-p2p`

**Source:** `/Volumes/workspace-drive/projects/other/crypto_market`  
**Target:** `/Volumes/workspace-drive/projects/other/cryptomarket-p2p`  
**Date:** 2026-05-19

## Decision: curated migration, not a copy

We **did not** copy the old repo wholesale. We extracted product intent and BMAD structure, then **rewrote** artifacts for:

- **Stack:** Caffeine-hosted ICP app — Motoko monolith + React/Vite (not Flutter + dfx multi-canister)
- **Product:** OLX-style **goods** marketplace with **stablecoin** settlement (not generic “crypto trading” UI)
- **Phase honesty:** Phase 1 = coordinated P2P + platform rules; Phase 3 = on-chain custody / HTLC

## Imported (ideas → new artifacts)

| Old location | Kept as |
|--------------|---------|
| `docs/project-brief.md` | Problem/decentralization framing → `product-brief.md` |
| `docs/prd/1-executive-summary.md`, `2a-problem-statement-and-goals.md` | Vision phrasing → `prd.md` §1–2 |
| `docs/prd/6-progressive-decentralization-strategy.md` | Phasing model → `prd.md` §6 (rewritten) |
| `docs/prd/4-functional-requirements.md` | FR themes (listings, escrow, disputes, messaging) → `prd.md` §4 (filtered) |
| `_bmad-output/planning-artifacts/architecture.md` | Liability, dual reputation, jury → `architecture.md` § domain (where implemented) |
| `_bmad-output/planning-artifacts/epics.md` | Epic numbering inspiration → `epics.md` (reset status) |
| `docs/prd/3-personas-and-journeys.md` | Personas → `prd.md` §3 (journeys rewritten for goods) |
| `DESIGN.md` (current repo) | Linked from `ux-design-spec.md` |

## Excluded (do not port)

| Old content | Reason |
|-------------|--------|
| Flutter / BLoC / `agent_dart` guides | Wrong frontend stack |
| Multi-canister diagram (7 canisters) | Current = **single** Motoko actor |
| Email/password + OAuth auth | Current = **Internet Identity only** |
| HTLC as **shipped** MVP | Current = manual off-chain stablecoin confirmation |
| Bank transfer, cash, gift card payments (`prd` §4.4) | Contradicts stablecoin-only product |
| `docs/stories/0.*` CI/workflow epics | Agent/CI noise for this repo |
| Epic 9–10 Flutter recovery | Historical execution overlay only |
| Firebase, IPFS-first listing images | Current = Caffeine object storage |
| Tezos option in `project-brief.md` | ICP-only decision already made |
| KYC/AML as MVP requirement | Optional/deferred; pseudonymous default |
| DAO governance as near-term | Code exists; **product deferred** |
| dfx identities, canister controller runbooks | Use Caffeine deploy path |

## Old vs new product emphasis

| Topic | Old PRD emphasis | Current north star |
|-------|------------------|-------------------|
| Primary use case | P2P **crypto trading** | P2P **goods** (OLX-like) |
| Payment | HTLC + bank/wallet off-ramps | **USDT/USDC** wallet-to-wallet |
| User motivation | Traders, liquidity | Buyers/sellers avoiding fiat conversion tax friction |
| Trust model | Atomic swap | **Progressive:** platform-coordinated → trustless custody |
| Client | Flutter mobile | Responsive **web** (Caffeine frontend canister) |

## Where old files remain

The legacy repo is unchanged. Use it as **reference only**. Canonical docs for active development live in **this** repo under `_bmad-output/planning-artifacts/`.
