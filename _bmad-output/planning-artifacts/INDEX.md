# Planning Artifacts — Index

**Project:** CryptoMarket P2P  
**Updated:** 2026-05-23  
**Documentation completeness:** **100%** — see [DOCUMENTATION-COMPLETENESS.md](./DOCUMENTATION-COMPLETENESS.md)

---

## Start here

| Document | One-line description |
|----------|---------------------|
| [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) | Затверджені user-facing обіцянки — source of truth для UX/PR |
| [ROADMAP-WAVES.md](./ROADMAP-WAVES.md) | **Master wave overview** — entry/exit, dependencies, user capabilities |
| [IMPLEMENTATION-PLAN-PHASE-1.5.md](./IMPLEMENTATION-PLAN-PHASE-1.5.md) | Wave 1 — order, AC, P0 tests, launch checklist |
| [IMPLEMENTATION-PLAN-WAVE-2.md](./IMPLEMENTATION-PLAN-WAVE-2.md) | Wave 2 — digital files + dispute playbook |
| [IMPLEMENTATION-PLAN-WAVE-3.md](./IMPLEMENTATION-PLAN-WAVE-3.md) | Wave 3 — Gate C + insurance + high-value caps |
| [PHASE-1.5-LAUNCH-PROMISES.md](./PHASE-1.5-LAUNCH-PROMISES.md) | Чесні vs нечесні обіцянки per wave |

---

## Audit

| Document | One-line description |
|----------|---------------------|
| [AUDIT-HANDOFF.md](./AUDIT-HANDOFF.md) | **Handoff for independent auditors** — inventory, story catalog, roles, completeness falsification checklist |
| [AUDIT-REPORT.md](./AUDIT-REPORT.md) | **Completed multi-agent audit** — verdict, fixed blockers, implementation entry rules |

---

## Council & correction

| Document | One-line description |
|----------|---------------------|
| [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md) | Historical council synthesis — P0 blockers, attack scenarios, QA; resolved items now tracked in audit/decision docs |
| [COUNCIL-BRIEFING.md](./COUNCIL-BRIEFING.md) | Historical input briefing for council session; not current source of truth |
| [COURSE-CORRECTION.md](./COURSE-CORRECTION.md) | BMAD course correction log — PRD/epics/manifest sync |
| [gap-analysis.md](./gap-analysis.md) | Contract vs code; §7–§10 implementation readiness all waves |
| [DOCUMENTATION-COMPLETENESS.md](./DOCUMENTATION-COMPLETENESS.md) | 100% coverage checklist and verdict |

---

## Technical specs

| Document | One-line description |
|----------|---------------------|
| [TRADE-STATE-MACHINE.md](./TRADE-STATE-MACHINE.md) | States Wave 1–3: physical, digital, L1/L2, Gate C, insurance |
| [COMPLIANCE-LAUNCH-GATE.md](./COMPLIANCE-LAUNCH-GATE.md) | Compliance/counsel gate required before public beta |
| [DECISION-LOG.md](./DECISION-LOG.md) | Product/tech defaults D-001–D-049 (locked vs owner-override) |
| [architecture.md](./architecture.md) | System architecture overview |
| [prd.md](./prd.md) | Product requirements document |
| [epics.md](./epics.md) | Epic/story map and wave status |
| [traceability-matrix.md](./traceability-matrix.md) | FR ↔ story traceability |
| [implementation-readiness.md](./implementation-readiness.md) | Final BMAD implementation-readiness gate |
| [ux-design-spec.md](./ux-design-spec.md) | UX design specification |
| [product-brief.md](./product-brief.md) | Product brief |

---

## Repo docs (outside this folder)

| Document | One-line description |
|----------|---------------------|
| [docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md](../../docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md) | ICRC escrow design, Gate C criteria |
| [docs/bmad/PAYMENT-VERIFICATION-E2E.md](../../docs/bmad/PAYMENT-VERIFICATION-E2E.md) | Explorer verification E2E |
| [scripts/story-manifest.mjs](../../scripts/story-manifest.mjs) | Canonical story definitions + wave metadata |
| [scripts/bmad-story-paths.mjs](../../scripts/bmad-story-paths.mjs) | Per-story implementation paths |

---

## Implementation artifacts

| Document | One-line description |
|----------|---------------------|
| [../implementation-artifacts/stories/index.md](../implementation-artifacts/stories/index.md) | Generated BMAD story files |
| [../implementation-artifacts/sprint-status.yaml](../implementation-artifacts/sprint-status.yaml) | Sprint tracking (regenerated from manifest) |

**Regenerate stories:** `node scripts/build-bmad-stories.mjs`

---

## Wave quick reference

### Wave 1
```
E3.S8 → E4.S7 → E6.S8 → E3.S7 → E3.S10 → E9.S2 → E7.S3 → E3.S9 → E13.S1
```

### Wave 2
```
E2.S11 → E7.S2-enhance → E6.S9
```

### Wave 3
```
E9.S6 → E9.S3 → E10.S4 → E6.S6 → E6.S7 → E3.S11 → E4.S8
```

### Wave 4+ (deferred)
```
E7.S1, E6.S4, E12.S2 external KYC, buyer stake, omnichain
```
