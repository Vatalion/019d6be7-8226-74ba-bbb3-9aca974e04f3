# Decision Log — CryptoMarket P2P Phase 1.5

**Версія:** 2026-05-23  
**Статус:** Defaults для implementation planning (owner + council synthesis)  
**Мова:** Українська

---

## Як читати

| Колонка | Значення |
|---------|----------|
| **ID** | Стабільний ідентифікатор рішення |
| **Reversible?** | Чи можна змінити без breaking migration |
| **Джерело** | Owner / Council / Implementation default |

---

## Таблиця рішень

| ID | Рішення | Обґрунтування | Дата | Reversible? | Джерело |
|----|---------|---------------|------|-------------|---------|
| D-001 | **Platform fee = 3%** від суми угоди (buyer-facing: price + fee + delivery) | Council economics: fee фінансує moderation/reserve; A/B 2.5–4% пізніше | 2026-05-23 | Так (admin bps) | Council T1 |
| D-002 | **Manual chains Wave 1:** TRC20 USDT + BEP20 USDT | Найвищий попит UA P2P; ERC20 — Wave 3 E4.S8 з security review + gas warning | 2026-05-23 | Так | Council T4 |
| D-003 | **NP completion:** buyer confirm **OR** NP `delivered`/`вручено` + **48 год** без спору | Баланс UX vs buyer protection; `Arrived at branch` ≠ delivery | 2026-05-23 | Частково | Council T2, Owner |
| D-004 | **Gate C (`trustlessEscrowEnabled`) = false** за замовчуванням у prod | Unsafe default true; E2E/security incomplete | 2026-05-23 | Так (admin flag) | Council, Owner |
| D-005 | **Insurance / full refund — Wave 3 only**; Wave 1 без guarantee copy | Manual chains без custody; немає capped reserve ledger | 2026-05-23 | N/A (policy) | Council T3, Owner |
| D-006 | **Seller handshake 24h** перед будь-яким payment/lock | USER-PRODUCT-CONTRACT R2; P0 blocker #1 | 2026-05-23 | Ні (contract) | Owner contract |
| D-007 | **Fund lock після handshake**, не при «Купити» | Contract §4; P0 blocker #2 | 2026-05-23 | Ні (contract) | Owner contract |
| D-008 | **Seller stake:** max(5% × price, 10 USDT) — block before publish | Contract §6; fraud deterrence beta | 2026-05-23 | Частково (min cap) | Owner contract |
| D-009 | **Buyer cancel pre-ship:** 85% / 10% / 5% | Contract R3/R3a; deterministic dust → platform | 2026-05-23 | Частково | Owner contract |
| D-010 | **Beta trade cap: 500 USDT** | Stake 5% не покриває high-value; honest launch | 2026-05-23 | Так | Council, Owner |
| D-011 | **Manual payment = explorer-only verify**; прибрати spoof `verifyTradePayment` | P0 security; fail-closed | 2026-05-23 | Ні (security) | Council |
| D-012 | **Physical delivery Wave 1:** Nova Poshta only | Contract §7; self-pickup deferred | 2026-05-23 | N/A | Owner contract |
| D-013 | **Digital files:** Wave 2 (E2.S11 + E7.S2 enhance) | P0 encrypted delivery not ready | 2026-05-23 | N/A (sequence) | Owner waves |
| D-014 | **Jury deferred**; L1 chat → L2 moderator | Contract §5; playbook Wave 2 | 2026-05-23 | N/A | Owner contract |
| D-015 | **Payout wallet snapshot** at PaymentIntent creation | Prevent post-lock wallet swap fraud | 2026-05-23 | Ні (security) | Council T7 |
| D-016 | **ICRC path mutually exclusive** with manual verified path | Prevent double payment P0 | 2026-05-23 | Ні | Council QA |
| D-017 | **Dispute freeze:** block payout/release while L1/L2 open | P0 NP delivered + dispute scenario | 2026-05-23 | Ні | Council |
| D-018 | **Fee accounting:** buyer pays `listed price + platform fee`; seller receives listed price minus fee on success | Upfront transparency E3.S8 | 2026-05-23 | Так | Council economics |
| D-019 | **Ship-by SLA:** 7 days after payment verified (beta default) | Seller never ships scenario mitigation | 2026-05-23 | Так (admin) | Council scenario #4 |
| D-020 | **Stake claim period:** 48h after complete (physical) | Align with NP grace window | 2026-05-23 | Так | Council T12 |
| D-021 | **Reserve funding (Wave 3):** 35–50% platform fee → capped fund | When insurance policy ships | 2026-05-23 | Так | Council insurance |
| D-022 | **High-value tier (>1000 USDT):** ck-only or elevated stake — Wave 3 | Residual liability too large on manual | 2026-05-23 | Так | Council T8 |
| D-023 | **Cross-collateral manual path:** account restrictions only, not fund recovery copy | Honest manual-chain UX | 2026-05-23 | N/A (copy) | Council T10 |
| D-024 | **PaymentIntent expiry:** 72h after seller confirm | Reasonable buyer pay window | 2026-05-23 | Так | Implementation default |
| D-025 | **Dust on 85/10/5:** remainder to platform (deterministic fixed-point)** | Avoid stuck micro-balances | 2026-05-23 | Так | Council QA |

### Wave 2 decisions (digital + disputes)

| ID | Рішення | Обґрунтування | Reversible? | Lock type |
|----|---------|---------------|-------------|-----------|
| D-026 | **Digital encryption:** random per-listing DEK + AES-GCM; SHA-256 hash commitment | Council P0 — XOR/public URL unacceptable | Ні (security) | **locked-default** |
| D-027 | **Upload allowlist:** pdf, zip, png, jpg, epub, mp4; max **500 MB** beta | Malware/size abuse mitigation | Так (admin) | **locked-default** |
| D-028 | **No DRM / anti-copy marketing** | Technically unenforceable after download | N/A | **locked-default** |
| D-029 | **Digital inspection:** **24h** from `deliveryRecordAt` | Contract §7; council T6 | Ні (contract) | **locked-default** |
| D-030 | **Redownload never resets** inspection timer | Council scenario #25 P0 | Ні | **locked-default** |
| D-031 | **Dispute L1 SLA:** physical **24h**, digital **6h** | Council T11 recommendation | Так (admin) | **locked-default** |
| D-032 | **Dispute L2 SLA:** triage **4–12h**, decision **24–72h** | Moderator workload planning | Так (admin) | **locked-default** |
| D-033 | **L1 auto-escalate to L2** on SLA expiry | Enforceable playbook | Так | **locked-default** |
| D-034 | **ck on-chain beta cap:** **500 USDT** per trade | Insurance/stake insufficient above | Так (admin) | **locked-default** |

### Wave 3 decisions (Gate C + insurance + high-value)

| ID | Рішення | Обґрунтування | Reversible? | Lock type |
|----|---------|---------------|-------------|-----------|
| D-035 | **ckUSDC first**, ckUSDT second on Gate C enable | Council dissent — data model multi-token | Так | **locked-default** |
| D-036 | **Gate C enable requires:** security sign-off + testnet E2E + rollback tests + admin audit | Council security P0 | Ні (process) | **locked-default** |
| D-037 | **On-chain terminal only after ICRC success** — no premature complete | Backend P0 release path | Ні | **locked-default** |
| D-038 | **Reserve accrual:** **40%** of platform fee → insurance ledger | Mid-range of council 35–50% | Так (admin bps split) | **locked-default** |
| D-039 | **Insurance payout cap:** min(unrecovered, **20%** liquid fund, **100 USDT/user/day**, **500 USDT/trade**) | Council T3 beta path | Так | **locked-default** |
| D-040 | **Liability records:** unique ID, partial clear, audit trail | E6.S6 depth — port old project semantics | Так | **locked-default** |
| D-041 | **Manual path waterfall ends at account restriction** — no custodial recovery copy | Council T10 | N/A (copy) | **locked-default** |
| D-042 | **ck path waterfall:** stake → on-chain refund → insurance → liability | Full recovery where custody exists | Так | **locked-default** |
| D-043 | **High-value tiers:** ≤500 standard; 500–1000 elevated stake/verified; **>1000 ck-only**; **>5000 reject** | Council T8 numeric examples | Так (admin caps) | **locked-default** |
| D-044 | **ERC20 USDC manual:** Wave 3 after security review; gas warning; cap 500 USDT | D-002 extension | Так | **owner-override** |

### Wave 4+ / deferred (documented, not implementing)

| ID | Рішення | Lock type |
|----|---------|-----------|
| D-045 | **Self-pickup (E7.S1):** out of Phase 1.5 — Nova Poshta only | **locked-default** |
| D-046 | **Jury (E6.S4):** deferred until dispute volume + L2 SLA metrics justify | **locked-default** |
| D-047 | **Buyer stake:** Phase 4+ — reputation/velocity first | **locked-default** |
| D-048 | **External KYC provider:** admin manual tier sufficient for beta | **owner-override** |
| D-049 | **Omnichain trustless all networks:** long-term E14 eval — not Phase 1.5 promise | **locked-default** |

---

## Owner sign-off still optional (minimal blockers)

| ID | Питання | Default chosen | Lock type |
|----|---------|----------------|-----------|
| D-001 | Exact fee % | 3% | owner-override |
| D-002 | ERC20 in Wave 1 | Відкладено до Wave 3 (E4.S8) | owner-override |
| D-019 | Ship-by days | 7 | owner-override |
| D-010 | Beta cap amount | 500 USDT | owner-override |
| D-038 | Reserve accrual % | 40% | owner-override |
| D-044 | ERC20 enable wave | Wave 3 | owner-override |
| D-048 | External KYC provider timing | Wave 4+ | owner-override |

**Всі інші рішення (D-003–D-009, D-011–D-018, D-020–D-047, D-049)** — **locked-default** для implementation.

---

## Зміни документів при оновленні рішення

| ID змінено | Оновити |
|------------|---------|
| D-001 | E3.S8 AC, admin fee bps, USER-PRODUCT-CONTRACT §6 |
| D-002 | E4 token allowlist, PaymentIntent schema |
| D-003 | E7.S3 AC, TRADE-STATE-MACHINE timers |
| D-004 | E9.S2, ONCHAIN-SETTLEMENT-DESIGN.md |
| D-005 | Marketing copy, E10.S4 insurance policy |

---

*Пов'язані артефакти: [IMPLEMENTATION-PLAN-PHASE-1.5.md](./IMPLEMENTATION-PLAN-PHASE-1.5.md), [TRADE-STATE-MACHINE.md](./TRADE-STATE-MACHINE.md), [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md)*
