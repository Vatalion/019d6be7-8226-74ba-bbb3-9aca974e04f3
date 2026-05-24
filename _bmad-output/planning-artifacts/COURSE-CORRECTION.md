# BMAD course correction — 2026-05-23

**Trigger:** Owner-approved [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md)  
**Scope:** Planning artifacts only — no application code in this pass.

## What changed

| Artifact | Change |
|----------|--------|
| **PRD** | Primary journey rewritten: OLX «Купити» flow, upfront fee, seller handshake 24h, post-handshake lock, Nova Poshta (not self-pickup), digital files + 24h inspection, penalty 10/5/85, seller stake 5% min 10 USDT, Phase 1.5 settlement wording |
| **Epics** | E3/E6/E7/E9 realigned; new backlog stories for handshake, fees, stake, penalty, external wallet proof, NP UI unlock |
| **Gap analysis** | Three-way compare: User Product Contract vs current code vs old PRD |
| **Story manifest** | Status flips (E7.S1 deferred, E7.S3 in-scope); new E3.S7–S10, E4.S7, E6.S8 |

## Why

Previous PRD/epics assumed **self-pickup MVP** and **manual wallet-to-wallet before trade steps**. The User Product Contract promises **platform-led OLX commerce**: fee visible before commit, seller confirms within 24h, funds lock **after** handshake, Nova Poshta for physical goods, seller stake, and explicit penalty splits.

## Source of truth

All user-facing promises: [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md)

Technical settlement detail: `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md`, E9 stories.

Liability / insurance fund reference: `/Volumes/workspace-drive/projects/other/crypto_market`.

## Next implementation priority (from gaps)

**Implementation plan complete (2026-05-23):** [IMPLEMENTATION-PLAN-PHASE-1.5.md](./IMPLEMENTATION-PLAN-PHASE-1.5.md) — Wave 1 execution order, AC, P0 test matrix, launch checklist.

Supporting specs: [TRADE-STATE-MACHINE.md](./TRADE-STATE-MACHINE.md), [DECISION-LOG.md](./DECISION-LOG.md), [INDEX.md](./INDEX.md).

Legacy priority list (superseded by plan §4):

1. E3.S7 — Seller handshake 24h + auto-cancel 100% refund  
2. E2.S11 / E3.S8 — Upfront fee breakdown on buy screen  
3. E6.S8 — Seller stake 5% min 10 USDT UX + enforcement  
4. E7.S3 — Nova Poshta UI unlock (replace pickup lock)  
5. E3.S10 — Post-handshake fund lock (Phase 1.5 ckUSDC/ckUSDT)

## Post-council owner verdict (2026-05-23)

**Source:** Multi-role council synthesis → owner practical verdict.  
**Formalized in:** [PHASE-1.5-LAUNCH-PROMISES.md](./PHASE-1.5-LAUNCH-PROMISES.md)

**Executive summary:** Idea is correct; **launch promises cannot be honestly shipped yet** (council RED). Do not expand scope beyond sequenced waves.

| Priority | Owner directive |
|----------|-----------------|
| 1 | Honest Phase 1.5 manual promise: platform-coordinated settlement, **not** trustless escrow; no insurance guarantee until capped reserve |
| 2 | Core trade flow: Buy → seller 24h → PaymentIntent → lock/verify → ship → receipt → payout/dispute |
| 3 | Payment safety: manual via explorer only; Gate C **off by default**; remove unverified «paid» path |
| 4 | Seller stake 5%/min 10 USDT must block listing; reserve per trade; seize on seller fault |
| 5 | Nova Poshta: TTN validation; delivered+48h or buyer confirm; fail-closed on API/TTN failure |
| 6 | Digital: encrypted immutable file; key after funding; 24h inspection from delivery record |
| 7 | Disputes: L1/L2, freeze scope, evidence checklist, SLA, appeal thresholds |
| 8 | P0 race tests before launch |

**Practical launch sequence (no scope creep):**

1. **Wave 1:** ONE golden path — Nova Poshta physical + ONE honest manual payment path (with caps)
2. **Wave 2:** Digital files
3. **Wave 3:** Gate C / insurance / high-value trades

**Wave 1 story focus:** E3.S7, E3.S10, E3.S8, E9.S2 (safety defaults), E4.S7, E6.S8, E7.S3, P0 tests.

Council P0 blockers: [COUNCIL-FINDINGS.md § Top 5 P0 blockers](./COUNCIL-FINDINGS.md#top-5-p0-blockers).
