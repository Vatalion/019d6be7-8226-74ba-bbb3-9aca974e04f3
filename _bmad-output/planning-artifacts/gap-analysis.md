---
workflowType: gap-analysis
document_output_language: en
---

# Gap analysis — User Product Contract vs documentation vs code

**Date:** 2026-05-23 (course correction — [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md))
**Prior sync:** 2026-05-19 brownfield reconciliation (`epics.md`, `traceability-matrix.md`, `story-implementation-state.mjs`)

## 1. Three-way comparison

| Dimension | User Product Contract (2026-05-23) | Old `crypto_market` PRD | Current `cryptomarket-p2p` code |
|-----------|----------------------------------|-------------------------|-------------------------------|
| Product type | OLX-like **goods** — platform leads deal | Crypto **trading** emphasis | **Goods** marketplace (aligned) |
| Buy flow | «Купити» → fee upfront → seller **24h handshake** | HTLC / wallet hunt | Trade starts immediately; **no handshake gate** |
| Fund lock timing | **After** seller confirms handshake | Preimage / HTLC lock | Code must align to E3.S10/E9.S2: PaymentIntent after handshake; no lock/pay before confirm |
| Seller stake | **5%** of price, **min 10 USDT** | Collateral concepts in disputes | Juror stake exists; **no listing seller stake UX** |
| Buyer cancel pre-ship | **85%** buyer / **10%** seller / **5%** platform | Various HTLC cancel rules | Generic cancel/refund — **no 10/5/85 split** |
| Physical delivery | **Nova Poshta only** | UA carriers | **Self-pickup locked** (`deliveryPolicy.ts`); NP backend built, UI hidden |
| Digital goods | **Files only** + auto-delivery + **24h inspection** | Broader digital | Encryption + inspection module; **no auto-delivery post-handshake** |
| Wallets | External wallet signed-nonce proof, **multi-wallet** | External vaults | II + manual address/QR — **no wallet SDK committed** |
| Settlement Phase 1.5 | ckUSDC/ckUSDT on-chain + **manual** TRC20/BEP20/ERC20 | HTLC near-term | Manual confirm + E9 backend spike; Gate C not shipped |
| Trustless roadmap | Long-term goal — **not** current promise | HTLC as MVP | Honest copy mostly fixed; PRD now reflects Phase 1.5 |
| Disputes | Level 1 chat → Level 2 **moderator**; **jury deferred** | Jury/DAO emphasis | Moderator path done; jury UI built-deferred ✓ |
| Liability | Cross-collateral + global liability + **insurance fund** (ref. `crypto_market`) | Full model | Partial — account restrictions; no insurance fund |

## 2. Where we went right

- Built the **OLX skeleton** (listings, detail, create, trades, profiles).
- **Stablecoin-only** positioning in code and live UI (4 tokens).
- Dispute + chat + reputation baseline.
- Nova Poshta **backend** + tracking timeline (E7.S5) — ready to unlock UI.
- Digital encryption + inspection primitives in escrow module.
- Caffeine deploy path; live smoke/flows exist.
- User Product Contract **approved** — clear north star for Phase 1.5.

## 3. Where we drifted (pre–course correction)

| Drift | Impact | Fix (planning done 2026-05-23) |
|-------|--------|--------------------------------|
| Self-pickup as Phase 1 MVP vs NP in contract | Wrong user promise | PRD/epics: NP in-scope; E7.S1 deferred |
| No seller handshake / early payment | Buyer pays before seller commits | E3.S7, E3.S10 backlog |
| No upfront fee on buy screen | OLX trust gap | E3.S8 backlog |
| No seller listing stake | Buyer unprotected when seller at fault | E6.S8 backlog |
| No 10/5/85 cancel split | Unfair / unclear economics | E3.S9 backlog |
| Fund lock at trade start (E9 spike) vs after handshake | Contract violation | E9.S2 re-scoped with E3.S10 |
| Pickup lock hides Nova Poshta | Cannot ship contract journey | E7.S3 → Phase 1.5 in-scope |

## 3b. Launch honesty gap (post-council owner verdict)

**Date:** 2026-05-23
**Formalized in:** [PHASE-1.5-LAUNCH-PROMISES.md](./PHASE-1.5-LAUNCH-PROMISES.md)

The council and owner agree: **user-facing promises currently exceed enforceable behavior.** This is distinct from feature gaps — it is a **marketing/UX honesty** gap.

| Honest promise | Current reality | Gap severity |
|----------------|-----------------|--------------|
| Manual TRC20/BEP20 = coordinated settlement, not escrow | Copy partially fixed; `verifyTradePayment` can mark paid without explorer proof | **P0** |
| Funds lock only after seller 24h confirm | Trade starts immediately; on-chain lock at init | **P0** |
| Insurance / full refund on seller fault | No capped reserve; manual chains have no custody seizure | **P0 if marketed** |
| Gate C trustless escrow | `trustlessEscrowEnabled` defaults unsafe; E2E incomplete | **P0** |
| Nova Poshta completion rules | UI pickup lock; E7.S3 AC incomplete | **P0** |
| Seller stake blocks listing | No listing stake enforcement | **P0** |
| Digital encrypted delivery after funding | Partial; XOR encryption, public URLs | **P1 (Wave 2)** |

**Launch rule:** Do not ship beta marketing until Wave 1 golden path (NP + manual payment with caps) passes P0 tests. See [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md) for evidence and story mapping.

## 4. Functional gaps (priority — post course correction)

### P0 — User Product Contract (Phase 1.5)

| Gap | Story | Built |
|-----|-------|-------|
| Seller handshake 24h + auto-cancel 100% | E3.S7 | No |
| Upfront fee breakdown on buy screen | E3.S8 | No |
| Fund lock after handshake (not at start) | E3.S10 + E9.S2 | Partial backend |
| Seller stake 5% min 10 USDT | E6.S8 | No |
| Buyer cancel pre-ship 10/5/85 | E3.S9 | No |
| Nova Poshta UI (replace pickup lock) | E7.S3 | Backend only |
| Digital file upload + auto-delivery | E2.S11 + E7.S2 | Partial |
| External wallet nonce-proof linking | E4.S7 | No |

### P1 — Product honesty (mostly closed)

- [x] Audit user-facing «trustless/escrow» strings
- [x] `/how-payments-work` page
- [ ] Update copy for **handshake-before-lock** once E3.S7 ships

### P2 — Settlement credibility

- [x] Explorer verification + admin keys
- [ ] Phase 1.5 ckUSDC/ckUSDT testnet E2E (Gate C)
- [ ] Manual multi-chain path documented alongside on-chain

### P3 — Liability depth (ref. `crypto_market`)

- [x] Global liability gates (E6.S6)
- [x] Cross-collateral account restrictions (E6.S7)
- [ ] Stake seizure aligned to **5%/10 USDT** (E6.S8)
- [ ] Insurance fund from fees — Wave 3 capped policy in E10.S4/D-038/D-039

### P4 — Deferred (explicit out of contract scope)

- Self-pickup / meetup (E7.S1 product-deferred)
- Ukrposhta / Meest product (E7.S4)
- Jury dashboard (E6.S4)
- Digital keys/text/access
- Full trustless all networks

## 4b. Story-level gaps (course correction additions)

| Area | Gap | Story | Phase |
|------|-----|-------|-------|
| Trade | No seller handshake timeout | E3.S7 | 1.5 |
| Trade | Fee not on first screen | E3.S8 | 1.5 |
| Trade | Wrong cancel economics | E3.S9 | 1.5 |
| Trade | Lock before seller confirm | E3.S10 | 1.5 |
| Payments | No external wallet proof | E4.S7 | 1.5 |
| Reputation | No seller listing stake | E6.S8 | 1.5 |
| Fulfillment | NP UI locked | E7.S3 | 1.5 |
| Fulfillment | Pickup still «done» in manifest | E7.S1 | deferred |
| Digital | Auto-delivery after handshake | E2.S11 | 1.5 |
| On-chain | Lock timing vs contract | E9.S2 | 1.5 |

## 5. Documentation gaps

| Gap | Resolution |
|-----|------------|
| PRD still described self-pickup MVP | **Fixed** — `prd.md` 2026-05-23 |
| Epics marked E7 done with pickup | **Fixed** — E7.S1 deferred, E7.S3 in-scope |
| No single user promise doc | **USER-PRODUCT-CONTRACT.md** (source of truth) |
| Story manifest priorities stale | **Fixed** — `story-manifest.mjs` + rebuild |

## 6. Recommended north star (one sentence)

> **Phase 1.5:** OLX-style crypto goods market where the platform leads the deal — fee upfront, seller confirms in 24h, funds lock after handshake, Nova Poshta or auto-delivered files, seller stake protects buyers.
> **Phase 3:** The same, with trustless settlement on all promised networks.

Use [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md) for user-facing promises until Phase 1.5 ships.

---

## 7. Implementation readiness (Wave 1)

**Plan:** [IMPLEMENTATION-PLAN-PHASE-1.5.md](./IMPLEMENTATION-PLAN-PHASE-1.5.md)
**Legend:** 🟢 planning complete / ready to implement · 🟡 partial spec or dependency · 🔴 blocked on code

| Story | Planning | Code | Notes |
|-------|----------|------|-------|
| E3.S8 Upfront fee | 🟢 | 🔴 | AC + 3% default in DECISION-LOG D-001 |
| E6.S8 Seller stake | 🟢 | 🔴 | Stake.mo not yet in repo |
| E3.S7 Handshake 24h | 🟢 | 🔴 | State machine spec in TRADE-STATE-MACHINE.md |
| E3.S10 PaymentIntent | 🟢 | 🔴 | Pairs E4.S2 explorer-only enhance |
| E9.S2 Safety defaults | 🟢 | 🟡 | Backend spike exists; Gate C default must flip to false |
| E4.S7 Wallet linking | 🟢 | 🔴 | Payout snapshot AC defined |
| E7.S3 Nova Poshta | 🟢 | 🟡 | Backend built; UI pickup lock remains |
| E3.S9 Cancel 85/10/5 | 🟢 | 🔴 | Dust policy D-025 |
| E13.S1 P0 tests | 🟢 | 🔴 | 16-case matrix in plan §7 |

**Wave 1 overall:** 🟢 **implementation-ready for dev handoff** — all planning artifacts complete; execution RED until stories ship.

---

## 8. Implementation readiness (Wave 2)

**Plan:** [IMPLEMENTATION-PLAN-WAVE-2.md](./IMPLEMENTATION-PLAN-WAVE-2.md)

| Story | Planning | Code | Notes |
|-------|----------|------|-------|
| E2.S11 Digital upload + auto-delivery | 🟢 | 🔴 | 8 AC; DEK + hash; D-026–D-028 |
| E7.S2-enhance Inspection 24h | 🟢 | 🟡 | Base backend exists; deliveryRecordAt missing |
| E6.S9 Dispute playbook L1/L2 | 🟢 | 🟡 | Moderator resolve exists; L1/L2 states + SLA missing |

**Wave 2 overall:** 🟢 planning complete · 🔴 code not started

---

## 9. Implementation readiness (Wave 3)

**Plan:** [IMPLEMENTATION-PLAN-WAVE-3.md](./IMPLEMENTATION-PLAN-WAVE-3.md)

| Story | Planning | Code | Notes |
|-------|----------|------|-------|
| E9.S6 Gate C enable | 🟢 | 🟢 | Default false; admin checklist + sign-off; `Admin.test.mo` |
| E9.S3 On-chain release/refund | 🟢 | 🟢 | `OnChainSettlement.mo`; unit tests; testnet E2E P1 defer |
| E10.S4 Insurance reserve | 🟢 | 🟢 | `InsuranceReserve.mo`; W3-6..8; honest copy tier |
| E6.S6 Liability depth | 🟢 | 🟢 | `Reputation.mo`; E6.S6 test suite |
| E6.S7 Waterfall depth | 🟢 | 🟢 | `LiabilityWaterfall.mo`; W3-9 |
| E3.S11 High-value caps | 🟢 | 🟢 | `Escrow.mo` tier gates; W3-11 |
| E4.S8 ERC20 manual | 🟢 | 🟢 | `Payments.mo` parseEvmTokenTransfer; W3-12 |

**Wave 3 overall:** 🟢 planning complete · 🟢 code complete · 🟡 beta launch checklist partial (testnet E2E, legal)

---

## 10. Wave 4+ deferred (documented)

| Story | Planning | Notes |
|-------|----------|-------|
| E7.S1 Self-pickup | 🟢 AC stub | Wave 4+; out of contract |
| E6.S4 Jury | 🟢 | Built-deferred UI |
| E12.S2 External KYC | 🟢 | Admin tier done; provider Wave 4+ |
| Buyer stake | 🟢 D-047 | No story file — decision only |
| Omnichain trustless | 🟢 D-049 | E9 ADRs only |

**Wave 4+ overall:** 🟢 documented defer · no implementation planned Phase 1.5
