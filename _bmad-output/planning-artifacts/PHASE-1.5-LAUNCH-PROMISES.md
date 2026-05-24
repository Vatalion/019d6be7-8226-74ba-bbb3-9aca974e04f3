# Phase 1.5 — чесні обіцянки запуску

**Дата:** 2026-05-23  
**Статус:** Затверджено власником (post-council practical verdict)  
**Джерела:** [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md), [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md), [COURSE-CORRECTION.md](./COURSE-CORRECTION.md)  
**Аудиторія:** Продукт, UX, PR, розробка — що **можна чесно** обіцяти користувачам на Phase 1.5 beta

---

## 1. Вердикт власника (синтез)

> **Ідея правильна, але обіцянки запуску ще не можна чесно виконати.**

Консиліум підтвердив напрям: OLX-подібний маркетплейс товарів, де платформа веде угоду, а не чат з полюванням за адресою гаманця. Проте код і backlog **не забезпечують** базову trust-послідовність:

```text
Купити → продавець підтверджує (24 год) → PaymentIntent → lock/verify коштів
→ відправка/доставка → отримання/огляд → виплата або спір
```

**Launch readiness: RED** — див. [COUNCIL-FINDINGS.md § Top 5 P0 blockers](./COUNCIL-FINDINGS.md#top-5-p0-blockers).

### Пріоритет власника (порядок робіт)

1. **Чесна обіцянка Phase 1.5 для manual TRC20/BEP20** — platform-coordinated settlement, **не** trustless escrow. ERC20 manual path лишається Wave 3 (E4.S8/D-044). Без гарантованого refund/insurance, поки не існує capped reserve policy.
2. **Переробка core trade flow** — Buy → seller 24h confirm → PaymentIntent → lock/verify → ship/deliver → receipt/inspection → payout/dispute.
3. **Безпека платежів** — manual лише через explorer verification; Gate C **вимкнено за замовчуванням** до security/E2E; прибрати шлях «verified» без реальної перевірки.
4. **Seller stake** — 5% / мін. 10 USDT має **реально блокувати** до публікації; резерв на listing/trade; seizure при вині продавця; residual liability.
5. **Nova Poshta** — валідація ТТН; delivered + 48 год без спору **або** підтвердження покупця; fail-closed при недоступності NP API або невалідному ТТН.
6. **Цифрова доставка** — зашифрований immutable file; ключ/завантаження лише після funding; 24 год inspection від delivery record; redownload **не** скидає таймер.
7. **Спори як продуктова система** — L1/L2 states, freeze scope, evidence checklist, SLA, appeal/jury thresholds.
8. **P0 тести** — race cases з council synthesis (див. §6).

---

## 2. Що ми ЧЕСНО обіцяємо користувачам (Phase 1.5 beta)

Це формулювання для UX, PR і onboarding — **лише після** відповідних stories у Wave 1.

### 2.1. Загальна позиція

| Обіцянка | Формулювання для користувача |
|----------|------------------------------|
| Тип платформи | Crypto-маркетплейс товарів у стилі OLX: платформа веде угоду, не чат з адресою гаманця |
| Комісія | Видна **до** натискання «Купити» (ціна + комісія платформи + мережа + доставка) |
| Handshake | Продавець має **24 год** підтвердити запит; інакше покупець отримує **100% назад**, кошти **не заблоковані** |
| Блокування коштів | Лише **після** підтвердження продавцем — не при «Купити» |
| Manual chains (Wave 1 TRC20/BEP20) | **«Координоване платформою ручне підтвердження переказу»** — не trustless escrow; ERC20 manual enablement = Wave 3 |
| On-chain (ckUSDC/ckUSDT) | **Не обіцяємо на beta** — Gate C вимкнено до окремого релізу |
| Фізична доставка | **Лише Nova Poshta**; самовивіз/зустріч — недоступні |
| Seller stake | **5% від ціни, мін. 10 USDT** — заблоковано до публікації оголошення |
| Скасування покупцем до відправки | **85%** покупцю, **10%** продавцю, **5%** платформі |
| Спори | Спочатку переговори (L1), потім модератор (L2); jury — **немає** |
| Ліміти beta | Обмеження суми угоди та кількості угод — **чесно вказані в UI** |

### 2.2. Golden path — фізичний товар + manual payment (Wave 1)

**Єдиний шлях beta-запуску:**

1. Покупець бачить оголошення з ціною, комісією, NP-доставкою.
2. Натискає «Купити» → створюється угода в стані **«Очікує підтвердження продавця»** (кошти **не** заблоковані).
3. Продавець підтверджує протягом 24 год → **PaymentIntent** (мережа, токен, точна сума, адреса).
4. Покупець переказує USDT/USDC **manual** → платформа перевіряє tx через **explorer** (chain, contract, from/to, amount, confirmations).
5. Після verified payment продавець відправляє NP, додає **валідний ТТН**.
6. Завершення: покупець підтверджує отримання **або** NP status `delivered/вручено` + **48 год** без спору.
7. Виплата продавцю; stake утримується до завершення claim period.

**Fail-closed правила:**

- NP API недоступний → **немає** auto-complete.
- ТТН невалідний → **немає** переходу в «відправлено».
- Explorer не підтвердив tx → **немає** стану «оплачено».

### 2.3. Критичний UX copy (Wave 1)

- До підтвердження продавцем: *«Ваші кошти ще не заблоковано.»*
- Після lock/verify: *«Кошти підтверджено. Продавець може відправляти товар.»*
- Manual path: *«Це ручне підтвердження переказу через блокчейн-експлорер, не trustless escrow.»*
- Скасування до відправки: показати **точні** суми 85/10/5 до підтвердження.

---

## 3. Що ми НЕ обіцяємо / відкладаємо

| Не обіцяємо зараз | Чому | Коли можливо |
|-------------------|------|--------------|
| **Trustless escrow на всіх мережах** | Manual chains без custody; ck* потребує Gate C + security review | Wave 3 (Gate C beta) |
| **Гарантоване страхування / full refund fund** | Немає capped reserve policy і ledger | Wave 3 + legal review |
| **Gate C on-chain beta** | `trustlessEscrowEnabled` небезпечно; E2E не пройдено | Wave 3 |
| **High-value trades без обмежень** | 5% stake не покриває великі суми (див. council numeric examples) | Після caps + verified tier |
| **Цифрові файли на launch** | Потребує encrypted immutable delivery + inspection evidence | Wave 2 |
| **Jury / juror dashboard** | Відкладено в контракті | Phase 3+ |
| **Самовивіз / зустріч** | Поза scope контракту | Не в Phase 1.5 |
| **Ukrposhta / Meest** | Не в user contract | Phase 2+ |
| **DRM / anti-copy для файлів** | Технічно неможливо гарантувати | Ніколи не обіцяти |
| **Custodial seizure на manual chains** | Платформа не тримає кошти — лише account restrictions | Чесний copy |

---

## 4. Хвилі rollout (DO NOT expand scope)

### Wave 1 — ONE golden path (фізика + manual payment)

**Scope:** один чесний шлях — Nova Poshta + manual TRC20/BEP20 (з caps).

| Story / артефакт | Що закриває |
|------------------|-------------|
| **E3.S7** | Seller handshake 24h, auto-cancel 100%, no payment before confirm |
| **E3.S10** | PaymentIntent після handshake; block shipping до funded/verified |
| **E3.S8** | Upfront fee breakdown на buy screen |
| **E3.S9** | Buyer cancel pre-ship 85/10/5 |
| **E4.S7** | Wallet linking + payout wallet snapshot (manual path safety) |
| **E4.S2** (enhance) | Explorer-only manual verification; remove spoof path |
| **E6.S8** | Seller stake 5%/10 USDT — block before listing, reserve, seizure |
| **E7.S3** | Nova Poshta E2E: TTN validation, delivered+48h, fail-closed |
| **E9.S2** | Re-scope: handshake gate + **Gate C default false** (не beta enable) |
| **P0 tests** | Race cases §6 — launch gate |

**Beta caps (рекомендація council):** trades до **500 USDT**; TRC20 + BEP20 USDT першими.

### Wave 2 — Digital files

| Story | Що закриває | Plan |
|-------|-------------|------|
| **E2.S11** | Encrypted immutable file upload + auto-delivery after funding | [Wave 2 §5.1](./IMPLEMENTATION-PLAN-WAVE-2.md#51-e2s11--digital-file-upload-and-auto-delivery) |
| **E7.S2** (enhance) | 24h inspection від delivery record; redownload не скидає таймер | [Wave 2 §5.2](./IMPLEMENTATION-PLAN-WAVE-2.md#52-e7s2-enhance--digital-inspection-window-24h) |
| **E6.S9** | Dispute playbook: L1/L2 states, freeze, evidence, SLA | [Wave 2 §5.3](./IMPLEMENTATION-PLAN-WAVE-2.md#53-e6s9--dispute-playbook-l1l2) |

**Чесна обіцянка Wave 2:** Цифрові файли з auto-delivery після оплати; 24h inspection; **без DRM**; L1/L2 спори з moderator SLA.

### Wave 3 — Gate C / insurance / high-value

| Story / policy | Що закриває | Plan |
|----------------|-------------|------|
| **E9.S6** | ckUSDC/ckUSDT on-chain lock після security/E2E | [Wave 3 §5.1](./IMPLEMENTATION-PLAN-WAVE-3.md#51-e9s6--gate-c-beta-enable) |
| **E9.S3** | On-chain auto-release/refund | [Wave 3 §5.2](./IMPLEMENTATION-PLAN-WAVE-3.md#52-e9s3--auto-release-and-refund-on-chain) |
| **E10.S4** | Capped insurance reserve або прибрати guarantee copy | [Wave 3 §5.3](./IMPLEMENTATION-PLAN-WAVE-3.md#53-e10s4--capped-insurance-reserve-policy) |
| **E6.S6/E6.S7** | Liability waterfall з чесним manual-chain copy | [Wave 3 §5.4–5.5](./IMPLEMENTATION-PLAN-WAVE-3.md) |
| **E3.S11** | High-value tier gates (>1000 ck-only) | [Wave 3 §5.6](./IMPLEMENTATION-PLAN-WAVE-3.md#56-e3s11--high-value-trade-caps-and-tier-gates) |
| **E4.S8** | ERC20 USDC manual (post security review) | [Wave 3 §5.7](./IMPLEMENTATION-PLAN-WAVE-3.md#57-e4s8--erc20-usdc-manual-path-enable) |

**Чесна обіцянка Wave 3:** Trustless escrow **лише ck*** (capped); insurance **capped** або без guarantee; high-value gates чесно в UI.

Master roadmap: [ROADMAP-WAVES.md](./ROADMAP-WAVES.md)

---

## 5. Зв'язок з COUNCIL-FINDINGS P0 blockers

| # | Blocker (council) | Wave | Story |
|---|-------------------|------|-------|
| 1 | No seller-handshake before payment/lock | 1 | E3.S7, E3.S10 |
| 2 | Unsafe payment state machine (lock before handshake; spoof verify) | 1 | E3.S10, E9.S2, E4.S2 |
| 3 | Seller stake not enforced | 1 | E6.S8 |
| 4 | Nova Poshta completion undefined | 1 | E7.S3 |
| 5 | Insurance/full-refund not supportable | 3 | New insurance policy / E10 |

Повний список attack scenarios і P0 tests: [COUNCIL-FINDINGS.md § Red-team and QA synthesis](./COUNCIL-FINDINGS.md#red-team-and-qa-synthesis).

---

## 6. P0 tests — launch gate (Wave 1)

Мінімальний automated набір перед beta (з council + owner verdict):

- seller confirm vs 24h timeout race
- seller silent → 100% cancel, no lock, no stake penalty
- buyer cancel vs seller shipped race
- 85/10/5 split with rounding/dust
- two buyers on one listing
- stake locked once; cannot withdraw during pending trade/dispute
- ICRC failure rollback after handshake (E9.S2 safety, Gate C off)
- ICRC funded + manual paid duplicate prevention
- manual wrong token/network/underpay rejection
- invalid TTN cannot mark shipped
- NP delivered + buyer dispute freezes payout
- payout wallet changed after lock rejected/held
- upgrade mid-handshake resumes deadlines correctly

---

## 7. Story lists — Wave 1 / 2 / 3

### Wave 1 (prioritize)

```
E3.S8, E4.S7, E6.S8, E3.S7, E3.S10, E9.S2-safety, E7.S3, E3.S9, E13.S1/P0-tests
```

### Wave 2

```
E2.S11, E7.S2-enhance, E6.S9
```
Plan: [IMPLEMENTATION-PLAN-WAVE-2.md](./IMPLEMENTATION-PLAN-WAVE-2.md)

### Wave 3

```
E9.S6, E9.S3, E10.S4, E6.S6, E6.S7, E3.S11, E4.S8
```
Plan: [IMPLEMENTATION-PLAN-WAVE-3.md](./IMPLEMENTATION-PLAN-WAVE-3.md)

---

## 8. Definition of honest launch

Phase 1.5 beta можна **чесно** анонсувати, коли:

- [ ] Golden path NP + manual payment проходить E2E з реальним explorer verify
- [ ] Жоден шлях не дає «paid/locked» без handshake + verification
- [ ] Gate C **вимкнено** в prod; copy не каже «trustless escrow» для manual
- [ ] Seller stake блокує publish; caps на суму угоди видимі
- [ ] P0 race tests green
- [ ] Insurance / full-refund **не** в маркетингу

---

*Документ формалізує post-council owner verdict. Технічні AC — у story files та [COUNCIL-FINDINGS.md](./COUNCIL-FINDINGS.md). User-facing baseline — [USER-PRODUCT-CONTRACT.md](./USER-PRODUCT-CONTRACT.md).*
