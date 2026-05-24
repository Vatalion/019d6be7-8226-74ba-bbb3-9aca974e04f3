# Audit Handoff — CryptoMarket P2P BMAD Planning

**Проєкт:** CryptoMarket P2P  
**Шлях репозиторію:** `/Volumes/workspace-drive/projects/other/cryptomarket-p2p`  
**Дата handoff:** 2026-05-23  
**Мова:** Українська (IDs, paths, story keys — English OK)  
**Призначення:** Самодостатній пакет для **незалежних аудиторських агентів**, які перевіряють повноту планування, знаходять прогалини та фальсифікують заяву про «100% completeness».

**Не включено:** код застосунку, chat history, Caffeine CLI runtime. Аудитори працюють **лише з артефактами в репозиторії**.

---

## 0. Executive summary

| Метрика | Значення |
|---------|----------|
| Planning artifacts (`_bmad-output/planning-artifacts/`) | **24 файли** |
| Story files (`_bmad-output/implementation-artifacts/stories/`) | **75 stories** + `index.md` + `STORY-QA-GUIDE.md` |
| Epics | **13** (E1–E13) |
| Stories in `story-manifest.mjs` | **75** |
| Status: `done` / `backlog` / `built-deferred` | **50 / 19 / 6** |
| Wave 1 execution items | **9 backlog items** (including E9.S2 safety defaults) |
| Wave 2 backlog | **3** |
| Wave 3 backlog | **7** |
| Wave 4+ deferred | **7+** (see §9) |
| Locked decisions | **D-001 – D-049** in DECISION-LOG |
| Audited documentation completeness | **100% for implementation handoff** — see §8 and AUDIT-REPORT.md |

**North star:** OLX-style goods marketplace on ICP — platform-led trade flow, stablecoin settlement, honest phased promises (manual coordinated → digital → trustless ck* beta).

**Critical context:** Council verdict **RED** for Phase 1.5 launch readiness — planning is complete; **implementation is not**. Auditors must distinguish **documentation completeness** from **shipping readiness**.

---

## 1. Inventory — everything created during planning

### 1.1 `_bmad-output/planning-artifacts/` (24 files)

| File | Опис (1–2 речення) |
|------|---------------------|
| **INDEX.md** | Master navigation hub; wave quick reference; links to all planning docs. Updated 2026-05-23 with 100% completeness claim. |
| **AUDIT-HANDOFF.md** | Цей документ — пакет для незалежного аудиту планування. |
| **AUDIT-REPORT.md** | Завершений multi-agent audit report: що було знайдено, виправлено, і фінальний verdict для implementation docs. |
| **COMPLIANCE-LAUNCH-GATE.md** | Compliance/counsel gate для public beta: jurisdiction, sanctions, AML/KYC, retention/privacy, launch evidence. |
| **USER-PRODUCT-CONTRACT.md** | Затверджений контракт user-facing обіцянок (UA): handshake 24h, fee upfront, NP-only physical, stake, penalties, digital inspection. **Source of truth для UX/PR.** |
| **COURSE-CORRECTION.md** | BMAD course correction log 2026-05-23: trigger = USER-PRODUCT-CONTRACT; sync PRD, epics, gap-analysis, manifest; owner post-council verdict. |
| **COUNCIL-BRIEFING.md** | Input briefing для multi-role council session: gap context, attack scenarios, open TBDs. |
| **COUNCIL-FINDINGS.md** | Council synthesis output: RED launch verdict, Top 5 P0 blockers, domain findings, TBD resolutions, P0 race matrix. |
| **PHASE-1.5-LAUNCH-PROMISES.md** | Чесні vs нечесні обіцянки per wave; owner practical verdict post-council; marketing-safe copy guidance. |
| **IMPLEMENTATION-PLAN-PHASE-1.5.md** | **Wave 1** execution plan: story order, AC, mermaid flows, P0 test matrix (17 launch-gate cases), launch checklist §8. |
| **IMPLEMENTATION-PLAN-WAVE-2.md** | **Wave 2** plan: E2.S11, E7.S2-enhance, E6.S9; digital + dispute playbook; test matrix W2-1–12. |
| **IMPLEMENTATION-PLAN-WAVE-3.md** | **Wave 3** plan: Gate C, insurance, liability depth, high-value caps, ERC20 manual; test matrix W3-1–12. |
| **ROADMAP-WAVES.md** | Master wave overview: entry/exit criteria, dependencies, Wave 4+ deferrals, readiness summary table. |
| **TRADE-STATE-MACHINE.md** | Technical state machine Wave 1–3: physical, digital, L1/L2 disputes, Gate C, insurance paths; P0 invariants. |
| **DECISION-LOG.md** | Product/tech defaults **D-001 – D-049** with lock type (locked-default vs owner-override) and doc update pointers. |
| **DOCUMENTATION-COMPLETENESS.md** | Self-assessment checklist claiming **100%** coverage; epic/story/wave/council mapping; build verification command. |
| **gap-analysis.md** | Three-way compare: User Product Contract vs current code vs old PRD; §7–§10 implementation readiness per wave. |
| **prd.md** | Product requirements document — rewritten post course correction for OLX-led flow, Phase 1.5 settlement wording. |
| **epics.md** | Epic map E1–E13 with phase labels, wave alignment, story status summary; reconciled 2026-05-23. |
| **product-brief.md** | Vision one-liner, problem/solution, personas, non-negotiable principles (English). |
| **architecture.md** | System architecture: React/Vite SPA + single Motoko actor, Caffeine deploy, II-only auth. |
| **ux-design-spec.md** | UX design specification; UI contract complementing `DESIGN.md`. |
| **traceability-matrix.md** | FR ↔ story ↔ verification mapping. |
| **implementation-readiness.md** | Final readiness assessment for BMAD implementation handoff; distinguishes documentation readiness from code/launch readiness. |

### 1.2 Story files — `_bmad-output/implementation-artifacts/stories/`

**Generated from:** `node scripts/build-bmad-stories.mjs` (source: `scripts/story-manifest.mjs`)

| Epic | Folder | Story count | Notes |
|------|--------|-------------|-------|
| E1 Identity | `e01-identity/` | 4 | All `done` |
| E2 Marketplace | `e02-marketplace/` | 11 | 10 `done`, E2.S11 `backlog` (Wave 2) |
| E3 Trade | `e03-trade/` | 11 | 6 `done`, 5 `backlog` (Wave 1 + Wave 3) |
| E4 Payments | `e04-payments/` | 8 | 6 `done`, 2 `backlog` (Wave 1 + Wave 3) |
| E5 Messaging | `e05-messaging/` | 3 | All `done` |
| E6 Disputes | `e06-disputes/` | 9 | 4 `done`, 4 `backlog`, E6.S4 `built-deferred` |
| E7 Fulfillment | `e07-fulfillment/` | 5 | 1 `done`, 2 `backlog`, 2 `built-deferred` |
| E8 Admin | `e08-admin/` | 6 | All `done` |
| E9 On-chain Escrow | `e09-onchain-escrow/` | 6 | 3 `done`, 3 `backlog`, 0 `built-deferred` |
| E10 Governance | `e10-governance/` | 4 | 3 `built-deferred`, E10.S4 `backlog` (Wave 3) |
| E11 Engagement | `e11-engagement/` | 5 | All `done` |
| E12 Compliance | `e12-compliance/` | 2 | All `done` for baseline privacy + admin manual tier; external KYC provider deferred Wave 4+ |
| E13 Launch Gate | `e13-launch-gate/` | 1 | E13.S1 `backlog` (Wave 1) |

**Extra files:** `index.md` (generated catalog), `STORY-QA-GUIDE.md` (QA conventions for story AC review).

**Total story markdown files:** 75 + 2 meta = **77**.

### 1.3 `scripts/story-manifest.mjs`

**Role:** Canonical machine-readable story registry — single source for:
- Story ID, title, epic, phase, status
- User story text, adaptation notes, acceptance criteria, verification hooks
- Wave metadata (`meta.wave`, `implementationOrder`, `dependsOn`, `contractRef`)
- `EXCLUDED` legacy story paths (Flutter/multi-canister artifacts not ported)

**Wave comment block (lines 3–11):** Documents post-council owner verdict and wave story lists.

**Regeneration chain:**
```
story-manifest.mjs → build-bmad-stories.mjs → stories/*.md + sprint-status.yaml
```

### 1.4 `sprint-status.yaml` summary

**Path:** `_bmad-output/implementation-artifacts/sprint-status.yaml`  
**Generated:** 2026-05-23 header (synced from manifest via build script)

| Epic rollup | Status |
|-------------|--------|
| epic-1, epic-5, epic-8, epic-11, epic-12 | `done` |
| epic-2, epic-3, epic-4, epic-6, epic-7, epic-9, epic-10 | `in-progress` |
| epic-13 | `backlog` |

**Backlog stories (19):** E2.S11, E3.S7–S11, E4.S7–S8, E6.S6–S9, E7.S2–S3, E9.S2–S3, E9.S6, E10.S4, E13.S1

**Built-deferred (6):** E6.S4, E7.S1, E7.S4, E10.S1–S3

### 1.5 Related docs outside planning-artifacts

#### `docs/bmad/` (8 files)

| File | Опис |
|------|------|
| **README.md** | BMAD doc index; points to `_bmad-output`; warns legacy crypto_market is not authoritative. |
| **MIGRATION-FROM-CRYPTO_MARKET.md** | What was imported/excluded from old Flutter multi-canister repo. |
| **ONCHAIN-SETTLEMENT-DESIGN.md** | ICRC escrow design, Gate C enable criteria, fund lock/release — technical complement to E9 stories. |
| **PAYMENT-VERIFICATION-E2E.md** | Explorer verification E2E flows for manual chains. |
| **OLX-PARITY.md** | OLX feature parity tracking (engagement, categories). |
| **OLX-FULL-GAP-AUDIT.md** | Full OLX taxonomy gap (1,259 leaves vs 114 categories implemented). |
| **ADR-ICRC-VS-EXTERNAL-WALLET.md** | Architecture decision: ICRC-first vs external wallet vaults. |
| **ADR-CROSS-CHAIN-PATTERN.md** | Cross-chain lock-release evaluation record. |

#### Supporting scripts

| File | Role |
|------|------|
| `scripts/story-manifest.mjs` | Canonical stories (see §1.3) |
| `scripts/build-bmad-stories.mjs` | Regenerate story markdown + sprint-status |
| `scripts/bmad-story-paths.mjs` | Per-story implementation file paths |
| `scripts/bmad-story-sections.mjs` | Story section templates |
| `scripts/story-implementation-state.mjs` | Implementation state helpers |
| `scripts/story-content-overrides.mjs` | Content overrides for generation |
| `scripts/story-generators.mjs` | Generator utilities |
| `scripts/migrate-stories-from-legacy.mjs` | Legacy migration tooling |

#### Legacy reference (not in repo — cited in planning)

| Path | Role |
|------|------|
| `/Volumes/workspace-drive/projects/other/crypto_market` | Old project: liability IDs, insurance fund, dual reputation reference implementations |

---

## 2. Epic & story catalog

### 2.1 Epic summary table

| Epic ID | Name | Stories | Wave assignment (active backlog) | Done | Backlog | Built-deferred |
|---------|------|---------|----------------------------------|------|---------|----------------|
| E1 | Identity & profiles | 4 | — (Phase 1 complete) | 4 | 0 | 0 |
| E2 | Marketplace | 11 | W2: S11 | 10 | 1 | 0 |
| E3 | Trade lifecycle | 11 | W1: S7–S10; W3: S11 | 6 | 5 | 0 |
| E4 | Payments & verification | 8 | W1: S7; W3: S8 | 6 | 2 | 0 |
| E5 | Messaging | 3 | — | 3 | 0 | 0 |
| E6 | Disputes & reputation | 9 | W1: S8; W2: S9; W3: S6–S7 | 4 | 4 | 1 |
| E7 | Fulfillment | 5 | W1: S3; W2: S2 | 1 | 2 | 2 |
| E8 | Admin & observability | 6 | — | 6 | 0 | 0 |
| E9 | On-chain escrow | 6 | W1: S2 safety; W3: S3, S6 | 3 | 3 | 0 |
| E10 | Governance / vault | 4 | W3: S4 | 0 | 1 | 3 |
| E11 | Buyer engagement | 5 | — | 5 | 0 | 0 |
| E12 | Compliance & privacy | 2 | W4+: S2 external KYC | 2 | 0 | 0 |
| E13 | Launch gate | 1 | W1: S1 P0 tests | 0 | 1 | 0 |
| **Total** | | **75** | | **50** | **19** | **6** |

### 2.2 Wave 1 — Golden path (physical NP + manual TRC20/BEP20)

**Execution order:** E3.S8 → E4.S7 → E6.S8 → E3.S7 → E3.S10 → E9.S2 → E7.S3 → E3.S9 → E13.S1

| ID | Title | Status | One-line purpose |
|----|-------|--------|------------------|
| E3.S8 | Upfront fee breakdown on buy screen | backlog | Show price + platform fee + network + delivery before buyer commits to buy. |
| E6.S8 | Seller listing stake — 5% min 10 USDT | backlog | Block listing publish until seller locks required stake for buyer protection. |
| E3.S7 | Seller handshake 24h with auto-cancel | backlog | Seller must confirm buy request within 24h; timeout = 100% buyer refund, no lock. |
| E3.S10 | Fund lock after seller handshake | backlog | Create PaymentIntent and lock/verify funds only after seller confirms — not at Buy. |
| E9.S2 | Fund lock after seller handshake (on-chain) | backlog | Wave 1 safety defaults for ICRC lock post-handshake; Gate C enable deferred to Wave 3. |
| E4.S7 | External wallet nonce-proof linking | backlog | Link personal wallets for payment/stake; II remains auth identity; no wallet SDK is committed without ADR + owner approval. |
| E7.S3 | Nova Poshta E2E (Phase 1.5 in-scope) | backlog | Only physical carrier in contract; TTN validation, delivered+48h auto-complete. |
| E3.S9 | Buyer cancel before shipment — 10/5/85 split | backlog | Deterministic penalty split when buyer cancels before shipment. |
| E13.S1 | P0 race condition test suite — launch gate | backlog | Automated coverage of council P0 race scenarios before Wave 1 beta launch. |

### 2.3 Wave 2 — Digital files + dispute playbook

**Execution order:** E2.S11 → E7.S2-enhance → E6.S9

| ID | Title | Status | One-line purpose |
|----|-------|--------|------------------|
| E2.S11 | Digital file upload and auto-delivery | backlog | Encrypted immutable file upload; auto-deliver after payment verification. |
| E7.S2 | Digital delivery inspection window (24h) | backlog | 24h inspection from `deliveryRecordAt`; redownload must not reset timer. |
| E6.S9 | Dispute playbook — L1/L2 states, freeze, evidence, SLA | backlog | Enforceable dispute levels with freeze, evidence checklist, moderator SLA. |

### 2.4 Wave 3 — Gate C + insurance + high-value

**Execution order:** E9.S6 → E9.S3 → E10.S4 → E6.S6 → E6.S7 → E3.S11 → E4.S8

| ID | Title | Status | One-line purpose |
|----|-------|--------|------------------|
| E9.S6 | Gate C beta enable — ckUSDC/ckUSDT on-chain lock | backlog | Enable trustless ICRC escrow after security sign-off and E2E pass. |
| E9.S3 | Auto-release and refund rules — Wave 3 with Gate C | backlog | On-chain release/refund based on fulfillment and dispute outcomes. |
| E10.S4 | Capped insurance reserve policy | backlog | Capped reserve ledger and payout rules — or remove guarantee copy. |
| E6.S6 | Global liability state — Wave 3 depth | backlog | Cross-trade liability IDs, partial clear, audit trail for repeat offenders. |
| E6.S7 | Cross-collateral waterfall — Wave 3 depth | backlog | Stake → on-chain refund → insurance → restriction; honest manual-path copy. |
| E3.S11 | High-value trade caps and tier gates | backlog | Tiered caps: ck-only above 1000 USDT; reject above 5000 USDT beta. |
| E4.S8 | ERC20 USDC manual path enable | backlog | ERC20 manual path with gas warning after security review. |

### 2.5 Wave 4+ / deferred

| ID | Title | Status | One-line purpose |
|----|-------|--------|------------------|
| E7.S1 | Self-pickup lock (superseded by contract) | built-deferred | Meetup/self-pickup out of Phase 1.5; AC stub for future legal review. |
| E6.S4 | Jury dashboard and voting | built-deferred | Community jury UI exists; product launch deferred until volume justifies. |
| E7.S4 | Ukrposhta and Meest integrations | built-deferred | Alternate UA carriers — backend exists, UI deferred. |
| E10.S1 | Governance proposals and voting | built-deferred | Governance module built; not in launch nav. |
| E10.S2 | Vault addresses and balance refresh | built-deferred | Multi-chain vault UI built; not Phase 1 product. |
| E10.S3 | Treasury fee and withdrawals | built-deferred | Treasury accounting built; governance-gated. |
| E12.S2 | Optional KYC tiers | done* | Story marked done for design; **external KYC provider integration deferred Wave 4+**. |

*Also deferred by policy:* buyer stake (D-047), omnichain trustless all networks (D-049), DRM (D-028).

### 2.6 Phase 1 & 2 — already `done` (reference for traceability auditors)

**Phase 1 done (30 stories):** E1.S1–S4, E2.S1–S8, E3.S1–S6, E5.S1–S3, E6.S1–S3, E8.S1–S6

**Phase 2 done (14 stories):** E4.S1–S6, E6.S5, E7.S5, E11.S1–S4, E2.S9, E12.S1

**Phase 3 done / design-only (5 stories):** E9.S1, E9.S4, E9.S5, E2.S10, E11.S5

---

## 3. Chronology — what was created when

Planning sessions converged on **2026-05-23** as the primary documentation freeze date. Earlier artifacts (product-brief, architecture, Phase 1 shipped stories) predate course correction.

| Phase | Artifact | Approx. date | Trigger / notes |
|-------|----------|--------------|-----------------|
| **Foundation** | `product-brief.md` | 2026-05-19 | Owner input; OLX + stablecoin vision |
| **Foundation** | `architecture.md`, `ux-design-spec.md` | Pre–05-23 | Caffeine single-canister stack |
| **Foundation** | Phase 1 stories E1–E8 (done) | Pre–05-23 | Legacy coordinated manual trade shipped |
| **Contract** | **USER-PRODUCT-CONTRACT.md** | **2026-05-23** | Owner-approved UX alignment discussion — **new source of truth** |
| **Correction** | **COURSE-CORRECTION.md** | **2026-05-23** | Triggered by contract; PRD/epics/manifest realigned |
| **Analysis** | `gap-analysis.md` (§1–§6 earlier; §7–§10 on 05-23) | **2026-05-23** | Contract vs code vs old PRD |
| **Council input** | **COUNCIL-BRIEFING.md** | **2026-05-23** | Briefing assembled from gap-analysis |
| **Council output** | **COUNCIL-FINDINGS.md** | **2026-05-23** | Multi-role synthesis; RED verdict; P0 blockers |
| **Owner verdict** | **PHASE-1.5-LAUNCH-PROMISES.md** | **2026-05-23** | Post-council practical launch sequence |
| **Wave 1 plan** | **IMPLEMENTATION-PLAN-PHASE-1.5.md** | **2026-05-23** | Golden path NP + manual; P0 test matrix |
| **Wave 2 plan** | **IMPLEMENTATION-PLAN-WAVE-2.md** | **2026-05-23** | Digital + dispute playbook |
| **Wave 3 plan** | **IMPLEMENTATION-PLAN-WAVE-3.md** | **2026-05-23** | Gate C + insurance + high-value |
| **Technical** | **TRADE-STATE-MACHINE.md** | **2026-05-23** | States for Wave 1–3 |
| **Decisions** | **DECISION-LOG.md** | **2026-05-23** | D-001 – D-049 locked defaults |
| **Roadmap** | **ROADMAP-WAVES.md** | **2026-05-23** | Master wave entry/exit |
| **Completeness** | **DOCUMENTATION-COMPLETENESS.md** | **2026-05-23** | 100% self-assessment |
| **Navigation** | **INDEX.md** | **2026-05-23** | Updated master index |
| **Manifest sync** | `story-manifest.mjs` wave metadata | **2026-05-23** | Post-council owner verdict in header comment |
| **Generated** | `sprint-status.yaml` | 2026-05-23 header | Regenerated from manifest via `build-bmad-stories.mjs` |

**Dependency chain (logical, not git):**
```
USER-PRODUCT-CONTRACT
  → COURSE-CORRECTION → PRD, epics, gap-analysis, manifest
  → COUNCIL-BRIEFING → COUNCIL-FINDINGS
  → PHASE-1.5-LAUNCH-PROMISES (owner verdict)
  → IMPLEMENTATION-PLAN (W1, W2, W3) + TRADE-STATE-MACHINE + DECISION-LOG
  → ROADMAP-WAVES + DOCUMENTATION-COMPLETENESS + INDEX
```

---

## 4. Key decisions summary

**Full authority:** [DECISION-LOG.md](./DECISION-LOG.md) — **49 decisions** with lock types.

### Top 15 locked defaults (auditors should verify stories/plans reflect these)

| ID | Decision | Lock | Primary story/doc owner |
|----|----------|------|-------------------------|
| **D-001** | Platform fee = **3%** (owner-override) | owner-override | E3.S8, USER-PRODUCT-CONTRACT §6 |
| **D-006** | Seller handshake **24h** before any payment/lock | locked (contract) | E3.S7, TRADE-STATE-MACHINE |
| **D-007** | Fund lock **after handshake**, not at Buy | locked (contract) | E3.S10, E9.S2 |
| **D-008** | Seller stake: **max(5% × price, 10 USDT)** before publish | locked (contract) | E6.S8 |
| **D-009** | Buyer cancel pre-ship: **85% / 10% / 5%** split | locked (contract) | E3.S9 |
| **D-004** | Gate C (`trustlessEscrowEnabled`) = **false** default in prod | locked | E9.S2, E9.S6, ONCHAIN-SETTLEMENT-DESIGN |
| **D-011** | Manual payment = **explorer-only verify**; remove spoof path | locked (security) | E3.S10, E4.S2, COUNCIL-FINDINGS P0#2 |
| **D-012** | Physical delivery Wave 1: **Nova Poshta only** | locked | E7.S3, E7.S1 deferred |
| **D-003** | NP completion: buyer confirm **OR** delivered + **48h** | locked-default | E7.S3, TRADE-STATE-MACHINE |
| **D-010** | Beta trade cap: **500 USDT** | owner-override | E3.S11, E9.S6 |
| **D-015** | **Payout wallet snapshot** at PaymentIntent creation | locked (security) | E3.S10, E4.S7 |
| **D-026** | Digital encryption: random DEK + AES-GCM; SHA-256 hash | locked (security) | E2.S11 |
| **D-029** | Digital inspection: **24h** from `deliveryRecordAt` | locked (contract) | E7.S2 |
| **D-041** | Manual waterfall ends at **account restriction** — no custodial recovery copy | locked | E6.S7, PHASE-1.5-LAUNCH-PROMISES |
| **D-043** | High-value: **>1000 ck-only**; **>5000 reject** | locked-default | E3.S11 |

**Owner-override items requiring explicit sign-off if changed:** D-001, D-010, D-019, D-038, D-044, D-048 (see DECISION-LOG § Owner sign-off).

---

## 5. Wave rollout summary

Source: [ROADMAP-WAVES.md](./ROADMAP-WAVES.md) + implementation plan checklists.

### Wave 1 — Physical NP + manual TRC20/BEP20

| | |
|--|--|
| **Entry** | USER-PRODUCT-CONTRACT approved; course correction complete |
| **Exit** | [IMPLEMENTATION-PLAN-PHASE-1.5.md §8](./IMPLEMENTATION-PLAN-PHASE-1.5.md) launch checklist green; E13.S1 P0 tests pass |
| **User can do after** | Buy physical goods; seller 24h confirm; pay manual USDT; NP ship; basic dispute L1 |
| **Honest promise** | Platform-coordinated manual settlement — **NOT** trustless escrow |
| **Hard rule** | Do not market ck* trustless until Wave 3 checklist green |

### Wave 2 — Digital + disputes

| | |
|--|--|
| **Entry** | Wave 1 shipped (checklist §8 green) |
| **Exit** | [IMPLEMENTATION-PLAN-WAVE-2.md §7](./IMPLEMENTATION-PLAN-WAVE-2.md) checklist green |
| **User can do after** | Buy digital files; auto-delivery; 24h inspection; L1/L2 disputes with SLA |
| **Honest promise** | Encrypted file delivery; no DRM; moderator playbook |
| **Depends on** | Wave 1 handshake, PaymentIntent, NP E2E |

### Wave 3 — Gate C + insurance + high-value

| | |
|--|--|
| **Entry** | Wave 2 shipped |
| **Exit** | [IMPLEMENTATION-PLAN-WAVE-3.md §7](./IMPLEMENTATION-PLAN-WAVE-3.md) checklist green; security sign-off |
| **User can do after** | Pay ckUSDC/ckUSDT trustless (capped); tiered high-value; capped insurance copy |
| **Honest promise** | ck* trustless beta capped; insurance **or** no guarantee copy |
| **Depends on** | Wave 1–2; P0 tests green; E9.S2 safety defaults |

### Wave 4+ — Deferred

| | |
|--|--|
| **Entry** | Product decision after Wave 3 |
| **Exit** | TBD per feature |
| **Documented deferrals** | Self-pickup (E7.S1), jury (E6.S4), external KYC (E12.S2), buyer stake, omnichain trustless |

---

## 6. Cross-reference matrix — document ownership by topic

Use this to detect **gaps** (topic mentioned but no owner) and **duplication conflicts** (same topic, contradictory values).

| Topic | Primary owner | Secondary / must align | Do NOT duplicate as source of truth |
|-------|---------------|------------------------|-------------------------------------|
| User-facing promises (UA) | USER-PRODUCT-CONTRACT | PHASE-1.5-LAUNCH-PROMISES, prd.md journeys | Marketing copy without cross-link |
| Wave sequencing & entry/exit | ROADMAP-WAVES | IMPLEMENTATION-PLAN-* §1, INDEX wave refs | epics.md alone |
| Story AC & status | story-manifest.mjs | stories/*.md (generated), sprint-status.yaml | epics.md narrative |
| Trade states & transitions | TRADE-STATE-MACHINE | IMPLEMENTATION-PLAN-* mermaid, E3/E7/E9 stories | COUNCIL-FINDINGS diagram (input only) |
| Locked numeric defaults | DECISION-LOG | E3.S8/S9, E6.S8, E7.S3 AC | COUNCIL TBD table (resolved) |
| Council P0 blockers | COUNCIL-FINDINGS | gap-analysis §7, E13.S1 matrix | COUNCIL-BRIEFING (input) |
| Contract vs code gaps | gap-analysis | implementation-readiness, COUNCIL-FINDINGS evidence column | COUNCIL-BRIEFING pre-audit assumptions |
| On-chain / Gate C technical | ONCHAIN-SETTLEMENT-DESIGN | E9 stories, architecture.md, ADRs | USER-PRODUCT-CONTRACT (user language only) |
| Explorer verification | PAYMENT-VERIFICATION-E2E | E4.S2–S3, E3.S10 AC | — |
| OLX parity scope | OLX-PARITY, OLX-FULL-GAP-AUDIT | E2.S8, E2.S10 | Full OLX 1,259 categories promise |
| FR traceability | traceability-matrix | prd.md FR IDs, story meta.prd | — |
| Liability / insurance reference | E6.S6–S7, E10.S4 | crypto_market legacy, DECISION-LOG D-038–D-042 | USER-PRODUCT-CONTRACT R4 (user language) |
| Completeness claim | DOCUMENTATION-COMPLETENESS | INDEX.md banner | — |
| Course correction history | COURSE-CORRECTION | epics.md reconciledAt header | product-brief (pre-correction tone) |
| UX/UI spec | ux-design-spec.md | DESIGN.md (tokens) | — |
| Launch honesty per wave | PHASE-1.5-LAUNCH-PROMISES | IMPLEMENTATION-PLAN-* §8/§7 checklists | prd.md marketing sections |
| P0 race tests | E13.S1, IMPLEMENTATION-PLAN-PHASE-1.5 §7 | COUNCIL-FINDINGS QA section | — |
| Dispute playbook detail | E6.S9, IMPLEMENTATION-PLAN-WAVE-2 | TRADE-STATE-MACHINE L1/L2 | E6.S4 jury (deferred) |
| Digital delivery security | E2.S11, D-026–D-030 | IMPLEMENTATION-PLAN-WAVE-2 | E2.S7 (legacy digital path — superseded) |
| Migration from old repo | MIGRATION-FROM-CRYPTO_MARKET | story manifest `mapsFrom` / EXCLUDED | Old Flutter stories |

**Known duplication hotspots to audit after correction pass:**
1. Platform fee % — USER-PRODUCT-CONTRACT §6 vs D-001 vs E3.S8 AC
2. NP completion UX — D-003 vs E7.S3 AC
3. E12.S2 `done` scope — admin manual verified tier only; external provider remains Wave 4+
4. Compliance launch gate — documented gate exists; launch evidence must still be supplied during implementation

---

## 7. Audit instructions for reviewing agents

Each role is **independent**. Deliverables should feed into `AUDIT-REPORT.md` (template §10).

---

### Role 1: Documentation completeness auditor

**Mission:** Falsify or confirm the 100% claim in DOCUMENTATION-COMPLETENESS.md.

**Read:**
- DOCUMENTATION-COMPLETENESS.md (full)
- INDEX.md
- ROADMAP-WAVES.md
- All IMPLEMENTATION-PLAN-* files (existence + section headers)
- story-manifest.mjs (story count)
- gap-analysis.md §7–§10

**Verify:**
- Every epic E1–E13 has ≥1 story with acceptance criteria in manifest
- Every Wave 1–3 backlog story has a matching section in its IMPLEMENTATION-PLAN
- Every council P0/P1 in COUNCIL-FINDINGS maps to a story or explicit defer
- `node scripts/build-bmad-stories.mjs` exits 0 and file count matches manifest

**Deliverable:** Checklist with PASS/FAIL per DOCUMENTATION-COMPLETENESS §1–§7 rows; list any **undocumented** topics mentioned in USER-PRODUCT-CONTRACT but missing from manifest.

---

### Role 2: Story AC quality auditor

**Mission:** Acceptance criteria are testable, complete, and non-contradictory.

**Read:**
- story-manifest.mjs (all `acceptance` arrays)
- Generated stories for Wave 1–3 backlog (E3.S7–S10, E6.S8–S9, E2.S11, E7.S2–S3, E9.S3/S6, E10.S4, E13.S1)
- STORY-QA-GUIDE.md
- IMPLEMENTATION-PLAN-* AC cross-reference sections

**Verify:**
- Each AC uses Given/When/Then or equivalent measurable form
- No AC promises custodial recovery on manual chains (D-041)
- Concurrent/race cases covered for handshake, lock, delivery-before-pay
- Wave 2 digital AC includes redownload-no-reset (D-030)
- Negative paths specified (reject, fail-closed, idempotent)

**Deliverable:** Table `story_id | AC count | quality (A/B/C) | gaps | suggested AC additions`

---

### Role 3: Traceability auditor (contract → stories → tests)

**Mission:** End-to-end trace from USER-PRODUCT-CONTRACT rules to stories to verification hooks.

**Read:**
- USER-PRODUCT-CONTRACT (R1–R8, §2–§7)
- traceability-matrix.md
- prd.md FR IDs
- story-manifest.mjs (`prd`, `contractRef`, `verification`)
- IMPLEMENTATION-PLAN-PHASE-1.5 §7 P0 matrix

**Verify:**
- Every contract rule (R2 handshake, R3 penalty, stake §6, NP §2.1, digital §2.2) maps to ≥1 story
- Every Wave 1 story maps to ≥1 P0 test case or verification hook
- FR IDs in manifest exist in prd.md
- No orphan FR in prd without story

**Deliverable:** Traceability matrix delta (missing links only) + coverage % estimate

---

### Role 4: Gap hunter (undocumented flows)

**Mission:** Find user flows mentioned anywhere but not specified in state machine + stories.

**Read:**
- USER-PRODUCT-CONTRACT, COUNCIL-FINDINGS attack scenarios
- TRADE-STATE-MACHINE.md
- gap-analysis.md
- COUNCIL-BRIEFING.md scenario list
- ONCHAIN-SETTLEMENT-DESIGN.md failure modes

**Hunt for:**
- Seller never ships (D-019 ship-by SLA — verify E7.S3/E13.S1 coverage)
- Wallet swap after lock (D-015)
- Upgrade mid-handshake / mid-inspection resume (E13.S1 mentions)
- Moderator reopen after inspection expiry
- Collusion / multi-account fraud
- Buyer-at-fault scenarios (R5 — «TBD Phase 2+» in contract)

**Deliverable:** Ranked list `flow | mentioned_in | documented_in | severity | recommended story/doc`

---

### Role 5: Consistency auditor (conflicts between docs)

**Mission:** Find contradictory values, statuses, or promises across artifacts.

**Read:** All planning-artifacts/*.md, story-manifest.mjs, sprint-status.yaml, docs/bmad/README.md

**Cross-check pairs:**
- Fee %, beta cap, reserve % across DECISION-LOG, contract, launch promises
- Story status: manifest vs sprint-status.yaml vs epics.md
- E12.S2 `done` vs Wave 4+ defer for external KYC
- AGENTS.md / deliveryPolicy.ts vs E7.S3 contract promise (cited in COUNCIL-FINDINGS)

**Deliverable:** Conflict register with `doc A | doc B | conflict | recommended resolution owner`

---

### Role 6: Implementation readiness auditor

**Mission:** Assess whether planning enables dev execution — separate from doc completeness.

**Read:**
- gap-analysis.md §7–§10
- COUNCIL-FINDINGS Top 5 P0 + evidence file paths
- IMPLEMENTATION-PLAN-PHASE-1.5 §4 execution order + dependencies
- bmad-story-paths.mjs

**Verify:**
- Each Wave 1 story has identifiable code touchpoints in bmad-story-paths
- Dependencies (`dependsOn`) are acyclic and ordered correctly
- Launch checklist items are objectively verifiable
- Council RED verdict still valid against gap-analysis

**Deliverable:** Wave 1 readiness score (planning / code / tests) with blocker list

---

### Role 7: Security & fraud documentation auditor

**Mission:** Security-sensitive flows are documented with fail-closed semantics.

**Read:**
- COUNCIL-FINDINGS (Payments, Fraud, Security sections)
- E3.S10, E4.S2, E9.S2, E9.S6 AC
- TRADE-STATE-MACHINE P0 invariants
- PAYMENT-VERIFICATION-E2E.md
- D-011, D-015, D-016, D-026 in DECISION-LOG

**Verify:**
- Spoof verify path explicitly banned in AC
- Double-payment prevention documented
- Stake seizure conditions tied to seller-fault outcomes
- Digital encryption not XOR/public URL
- Gate C enable checklist complete before marketing trustless

**Deliverable:** Security doc coverage matrix + missing threat scenarios

---

### Role 8: Wave dependency auditor

**Mission:** Wave sequencing is coherent; no circular or premature dependencies.

**Read:**
- ROADMAP-WAVES.md
- story-manifest.mjs `dependsOn` / `implementationOrder`
- IMPLEMENTATION-PLAN-* prerequisites
- PHASE-1.5-LAUNCH-PROMISES launch sequence

**Verify:**
- Wave 2 cannot ship without Wave 1 handshake + PaymentIntent
- Wave 3 Gate C requires E9.S2 safety + E13.S1 green
- E2.S11 depends on E3.S10 (payment verified before auto-delivery)
- E6.S9 depends on E7.S3 and E2.S11
- Marketing promises don't appear in earlier wave checklists

**Deliverable:** Dependency graph validation (mermaid or table) + violations

---

### Role 9: UX & honest-copy auditor

**Mission:** User-facing copy guidance is consistent and legally defensible.

**Read:**
- PHASE-1.5-LAUNCH-PROMISES.md (§2 honest / §3 dishonest)
- USER-PRODUCT-CONTRACT
- E3.S6 honest payment copy (done baseline)
- COUNCIL-FINDINGS UX copy defaults

**Verify:**
- Manual path never called «escrow» in launch promises
- Insurance guarantee absent until E10.S4
- Digital no-DRM promise present
- Buyer cancel shows exact 85/10/5 before confirm

**Deliverable:** Copy compliance checklist per wave

---

### Role 10: Compliance & privacy auditor

**Mission:** GDPR, KYC, pseudonymity trade-offs documented.

**Read:**
- E12.S1, E12.S2 stories
- USER-PRODUCT-CONTRACT pseudonymity notes
- COUNCIL-FINDINGS compliance section
- prd.md privacy sections

**Verify:**
- II-only auth contradiction with external KYC defer clearly stated
- Delete/export semantics for pseudonymous principal
- High-value tier progressive verification documented

**Deliverable:** Compliance gap list + defer vs implement classification

---

### Role 11: Test coverage planner auditor

**Mission:** P0/P1 test matrices cover story AC and council races.

**Read:**
- IMPLEMENTATION-PLAN-PHASE-1.5 §7, WAVE-2 §6, WAVE-3 §6
- E13.S1 AC
- COUNCIL-FINDINGS QA / race scenario list
- story `verification` fields

**Verify:**
- 16+ P0 cases map 1:1 to known race/blocker scenarios
- Each Wave 2–3 story has ≥1 named test ID in plan
- Verification hooks reference real test files (`Escrow.test.mo`, etc.)

**Deliverable:** Test gap matrix `scenario | test_id | covered (Y/N)`

---

### Role 12: Legacy migration auditor

**Mission:** Legacy crypto_market references are intentional, not silently dropped.

**Read:**
- MIGRATION-FROM-CRYPTO_MARKET.md
- story-manifest EXCLUDED list
- E6.S6–S7 adaptation notes
- E10.S4 insurance reference

**Verify:**
- Liability ID semantics from old project specified for port
- Excluded Flutter stories don't leak into sprint scope
- `mapsFrom` legacy paths exist or EXCLUDED reason documented

**Deliverable:** Migration completeness report for liability/insurance/stake modules

---

## 8. Known claims of 100% completeness

The following is **quoted from DOCUMENTATION-COMPLETENESS.md** for auditors to **attempt to falsify**:

> **Verdict:** **100%** — planning complete for Waves 1–3; Wave 4+ explicitly deferred with AC stubs

**§1 Epic coverage claim:**
> Every epic has stories with AC in manifest (E1–E13 table all ✅)

**§2 Wave plans claim:**
> Waves 1–3 each have: plan document, mermaid flows, AC per story, test matrix, launch checklist

**§3 Council mapping claim:**
> All council P0/P1 items from COUNCIL-FINDINGS mapped

**§4 TBD resolution claim:**
> **Unresolved TBD requiring owner:** none for implementation handoff; owner-override items have defaults and can change later without blocking implementation

**§7 Self-check (all marked [x]):**
- Every epic has stories with AC in manifest
- Every wave 1–3 has implementation plan
- Every council P0/P1 mapped or deferred
- Every council TBD resolved or defaulted
- Out-of-scope explicitly listed

> **Final verdict: 100% documentation complete. Implementation remains for future waves.**

**Auditor task:** Produce evidence for any unchecked item above.

---

## 9. Explicit out-of-scope list (documented deferrals)

| Item | Reason | Documented in |
|------|--------|---------------|
| Self-pickup / meetup | Contract §7 — Nova Poshta only | E7.S1, D-045, USER-PRODUCT-CONTRACT §2.1 |
| Jury voting | Moderator playbook first; volume threshold | E6.S4, D-014, D-046 |
| DRM / anti-copy | Technically unenforceable after download | D-028, PHASE-1.5-LAUNCH-PROMISES |
| Custodial manual seizure | No custody on manual chains | D-041, E6.S7 outOfScope |
| Trustless all 4 EVM networks | Long-term E14 eval | D-049 |
| Buyer stake | Reputation/velocity first | D-047 |
| External KYC provider integration | Admin manual tier sufficient beta | E12.S2 meta, D-048 |
| Governance / vault / treasury nav | Product-deferred built code | E10.S1–S3 |
| Ukrposhta / Meest UI | Alternate carriers deferred | E7.S4 |
| Email/push saved search alerts (live) | MVP scope — E11.S5 design done | E11.S2 adaptation |
| Keys/text/license digital strings | Files only Phase 1.5–2 | USER-PRODUCT-CONTRACT §2.2, E2.S11 |
| Full OLX 1,259 category leaves | 114 categories implemented | OLX-FULL-GAP-AUDIT |
| Insurance full-refund guarantee at Wave 1–2 | No capped reserve yet | D-005, E10.S4 Wave 3 |
| ckUSDC/ckUSDT trustless public beta | Gate C off until Wave 3 | D-004, E9.S6, PHASE-1.5-LAUNCH-PROMISES |
| HTLC hashlock/preimage trade | Superseded by platform-led flow | E3.S1 meta supersedesLegacy |
| Email/OAuth registration | II-only product | E1.S1, EXCLUDED 1.1.register |
| Flutter legacy stories | Wrong stack | story-manifest EXCLUDED |

---

## 10. Suggested audit output — `AUDIT-REPORT.md` template

Reviewing agents should produce:

**Path:** `_bmad-output/planning-artifacts/AUDIT-REPORT.md` (or dated variant)

```markdown
# Audit Report — CryptoMarket P2P BMAD Planning

**Date:** YYYY-MM-DD
**Auditor role(s):** [list]
**Handoff version:** AUDIT-HANDOFF.md 2026-05-23

## Executive summary
- Overall verdict: PASS / PASS WITH GAPS / FAIL
- Documentation completeness claim (100%): CONFIRMED / FALSIFIED
- Launch readiness (implementation): RED / YELLOW / GREEN — with rationale

## Findings summary
| Severity | Count |
|----------|-------|
| P0 — blocks honest launch or doc integrity | |
| P1 — must fix before wave ship | |
| P2 — should fix in planning | |
| P3 — informational | |

## Detailed findings
### F-001: [title]
- **Severity:** P0/P1/P2/P3
- **Category:** completeness | AC quality | traceability | gap | consistency | security | dependency | ...
- **Evidence:** [doc paths, quotes, line refs]
- **Impact:** ...
- **Recommendation:** ...
- **Suggested owner artifact:** DECISION-LOG / E3.S10 / ...

(repeat)

## Role deliverables attached
- [ ] Documentation completeness checklist
- [ ] AC quality table
- [ ] Traceability delta
- [ ] Gap hunter flows
- [ ] Consistency register
- [ ] Implementation readiness
- [ ] Security matrix
- [ ] Dependency validation
- (others as applicable)

## Completeness claim adjudication
| DOCUMENTATION-COMPLETENESS claim | Result | Notes |
|----------------------------------|--------|-------|

## Recommended next actions (prioritized)
1. ...
2. ...

## Appendices
- Story/epic counts verified
- Commands run (`build-bmad-stories.mjs`, etc.)
```

---

## 11. File index — absolute paths

### Planning artifacts
```
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/INDEX.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/AUDIT-HANDOFF.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/USER-PRODUCT-CONTRACT.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/COURSE-CORRECTION.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/COUNCIL-BRIEFING.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/COUNCIL-FINDINGS.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/PHASE-1.5-LAUNCH-PROMISES.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-PHASE-1.5.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-2.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/IMPLEMENTATION-PLAN-WAVE-3.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/ROADMAP-WAVES.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/TRADE-STATE-MACHINE.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/DECISION-LOG.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/DOCUMENTATION-COMPLETENESS.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/gap-analysis.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/prd.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/epics.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/product-brief.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/architecture.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/ux-design-spec.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/traceability-matrix.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/planning-artifacts/implementation-readiness.md
```

### Implementation artifacts
```
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/implementation-artifacts/sprint-status.yaml
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/implementation-artifacts/stories/index.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/implementation-artifacts/stories/STORY-QA-GUIDE.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/_bmad-output/implementation-artifacts/stories/e01-identity/ … e13-launch-gate/
```

### Scripts & docs/bmad
```
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/scripts/story-manifest.mjs
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/scripts/build-bmad-stories.mjs
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/scripts/bmad-story-paths.mjs
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/README.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/PAYMENT-VERIFICATION-E2E.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/MIGRATION-FROM-CRYPTO_MARKET.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/OLX-PARITY.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/OLX-FULL-GAP-AUDIT.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/ADR-ICRC-VS-EXTERNAL-WALLET.md
/Volumes/workspace-drive/projects/other/cryptomarket-p2p/docs/bmad/ADR-CROSS-CHAIN-PATTERN.md
```

### External reference
```
/Volumes/workspace-drive/projects/other/crypto_market
```

---

## Appendix A — Quick commands for auditors

```bash
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p

# Regenerate stories + sprint-status from manifest
node scripts/build-bmad-stories.mjs

# Count stories in manifest
node -e "import { STORIES } from './scripts/story-manifest.mjs'; console.log(STORIES.length)"

# List backlog stories
node -e "import { STORIES } from './scripts/story-manifest.mjs'; STORIES.filter(s=>s.status==='backlog').forEach(s=>console.log(s.id, s.title))"
```

---

## Appendix B — Pre-flagged audit seeds

These items were identified during handoff preparation. The audit correction pass resolved the stale items; auditors should re-check they remain fixed:

1. **E6.S5 status `done`** — adaptation now states the dual-role concept is ported; verification points to dual-score regression.
2. **docs/bmad/README.md** — updated to E1-E13 and 75 stories.
3. **sprint-status.yaml** — regenerated with 2026-05-23 header.
4. **E12.S2 `done`** — clarified as admin manual tier done; external provider integration remains Wave 4+.
5. **Buyer-at-fault (R5)** — explicitly deferred via D-047/future buyer-stake epic.
6. **Ship-by SLA 7 days (D-019)** — present in E7.S3, IMPLEMENTATION-PLAN-PHASE-1.5, and E13.S1 LG-15.

---

*Handoff prepared for independent BMAD planning audit. No application code changed. No git commit.*
