# Documentation Completeness — CryptoMarket P2P

**Date:** 2026-05-23  
**Verdict:** **100%** — planning complete for Waves 1–3; Wave 4+ explicitly deferred with AC stubs

---

## 1. Epic → story → AC coverage

| Epic | Stories | AC complete | Wave assigned |
|------|---------|-------------|---------------|
| E1 Identity | S1–S4 | ✅ | 1 (done) |
| E2 Marketplace | S1–S11 | ✅ | 1 done; S11 Wave 2 |
| E3 Trade | S1–S11 | ✅ | 1 backlog S7–S10; S11 Wave 3 |
| E4 Payments | S1–S8 | ✅ | 1 S7; S8 Wave 3 |
| E5 Messaging | S1–S3 | ✅ | 1 done |
| E6 Disputes | S1–S9 | ✅ | 1 S8; S9 Wave 2; S6/S7 Wave 3; S4 Wave 4+ |
| E7 Fulfillment | S1–S5 | ✅ | 1 S3; S2 Wave 2; S1 Wave 4+ stub |
| E8 Admin | S1–S6 | ✅ | 1 done |
| E9 On-chain | S1–S6 | ✅ | 1 S2 Wave 1; S6/S3 Wave 3 |
| E10 Governance | S1–S4 | ✅ | S4 Wave 3; S1–S3 deferred |
| E11 Engagement | S1–S5 | ✅ | done |
| E12 Compliance | S1–S2 | ✅ | S2 admin manual tier done; external KYC Wave 4+ defer |
| E13 Launch gate | S1 | ✅ | Wave 1 |

**Story count in manifest:** 75 (verified via `node scripts/build-bmad-stories.mjs` — 2026-05-23)

---

## 2. Wave → implementation plan

| Wave | Plan document | Mermaid flows | AC per story | Test matrix | Launch checklist |
|------|---------------|---------------|--------------|-------------|------------------|
| 1 | IMPLEMENTATION-PLAN-PHASE-1.5.md | ✅ | ✅ 9 stories | ✅ §7 P0 17 cases | ✅ §8 |
| 2 | IMPLEMENTATION-PLAN-WAVE-2.md | ✅ | ✅ 3 stories | ✅ §6 W2-1–12 | ✅ §7 |
| 3 | IMPLEMENTATION-PLAN-WAVE-3.md | ✅ | ✅ 7 stories | ✅ §6 W3-1–12 | ✅ §7 |
| 4+ | ROADMAP-WAVES.md § Wave 4+ | ✅ | ✅ AC stubs | N/A | N/A |

---

## 3. Council P0/P1 → story or defer

| Council item | Mapped to | Status |
|--------------|-----------|--------|
| P0 #1 Seller handshake | E3.S7 | ✅ Wave 1 |
| P0 #2 Unsafe payment SM | E3.S10, E9.S2, E4.S2 | ✅ Wave 1 |
| P0 #3 Seller stake | E6.S8 | ✅ Wave 1 |
| P0 #4 Nova Poshta | E7.S3 | ✅ Wave 1 |
| P0 #5 Insurance promise | E10.S4 | ✅ Wave 3 |
| Digital encryption | E2.S11 | ✅ Wave 2 |
| Dispute playbook | E6.S9 | ✅ Wave 2 |
| Gate C default false | E9.S2, E9.S6 | ✅ Wave 1 safety / Wave 3 enable |
| High-value caps | E3.S11 | ✅ Wave 3 |
| Jury defer | E6.S4 | ✅ Wave 4+ defer |
| Manual recovery honesty | E6.S7, D-041 | ✅ Wave 3 |
| P0 race tests | E13.S1 | ✅ Wave 1 |

All council P0/P1 items from [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md) mapped.

---

## 4. COUNCIL-FINDINGS TBD resolution

| TBD | Resolution | Decision ID |
|-----|------------|-------------|
| T1 Platform fee | 3% | D-001 |
| T2 NP receipt UX | confirm OR delivered+48h | D-003 |
| T3 Insurance thresholds | capped / no guarantee beta | D-005, D-039 |
| T4 Manual chains | TRC20/BEP20 Wave 1; ERC20 Wave 3 | D-002, D-044 |
| T5 Buyer stake | Wave 4+ | D-047 |
| T6 Digital DRM | no promise | D-028 |
| T7 External wallet proof | signed nonce + snapshot | D-015 |
| T8 Stake sufficiency | caps + ck-only >1000 | D-043 |
| T9 Handshake before lock | PaymentIntent post-confirm | D-007 |
| T10 Cross-collateral manual | account restrictions only | D-041 |
| T11 Moderator SLA | L1 24h/6h; L2 4–72h | D-031, D-032 |
| T12 Claim period | 48h physical; inspection digital | D-020, D-029 |

**Unresolved TBD requiring owner:** none for implementation handoff. Remaining owner-override items in DECISION-LOG have default values and can change later without blocking Wave story implementation.

---

## 5. Out-of-scope (explicit)

| Item | Reason | Documented in |
|------|--------|---------------|
| Self-pickup / meetup | Contract §7 NP only | E7.S1 Wave 4+ stub |
| Jury voting | Volume/SLA threshold | E6.S4, D-046 |
| DRM / anti-copy | Technically impossible | D-028 |
| Custodial manual seizure | No custody on manual chains | D-041 |
| Trustless all 4 EVM networks | Long-term E14 eval | D-049 |
| Buyer stake | Reputation first | D-047 |
| External KYC provider integration | Admin tier sufficient | E12.S2 Wave 4+ |
| Governance nav priority | Product-deferred | E10.S1–S3 |

---

## 6. Artifact inventory

| Artifact | Status |
|----------|--------|
| INDEX.md | ✅ 100% navigation |
| ROADMAP-WAVES.md | ✅ created |
| IMPLEMENTATION-PLAN-WAVE-2.md | ✅ created |
| IMPLEMENTATION-PLAN-WAVE-3.md | ✅ created |
| TRADE-STATE-MACHINE.md | ✅ digital + L1/L2 + insurance + Gate C |
| DECISION-LOG.md | ✅ D-001–D-049 |
| gap-analysis.md | ✅ §7–§10 all waves |
| story-manifest.mjs | ✅ full AC Wave 2/3 |
| bmad-story-paths.mjs | ✅ new stories |
| PHASE-1.5-LAUNCH-PROMISES.md | ✅ cross-linked |
| COMPLIANCE-LAUNCH-GATE.md | ✅ launch gate documented |
| AUDIT-HANDOFF.md | ✅ independent audit package |
| AUDIT-REPORT.md | ✅ completed audit verdict |
| epics.md | ✅ aligned |
| prd.md | ✅ TBDs resolved |

---

## 7. Build verification

```bash
node scripts/build-bmad-stories.mjs
```

Expected: exit 0; all manifest stories generate markdown files.

---

## Self-Check

- [x] Every epic has stories with AC in manifest
- [x] Every wave 1–3 has implementation plan
- [x] Every council P0/P1 mapped or deferred
- [x] Every council TBD resolved or defaulted
- [x] Out-of-scope explicitly listed

**Final verdict: 100% documentation complete. Implementation remains for future waves.**
