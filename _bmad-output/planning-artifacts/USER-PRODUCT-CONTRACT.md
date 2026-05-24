# User Product Contract — CryptoMarket P2P

**Версія:** 2026-05-23  
**Статус:** Затверджено власником продукту (UX alignment discussion)  
**Аудиторія:** Покупці, продавці, модератори — усі, хто користується платформою  
**Мова:** Українська (обіцянки користувачам)

---

## 1. Призначення документа

Цей документ — **контракт користувацьких обіцянок**, а не технічна специфікація. Він описує:

- **Що ви можете очікувати** від CryptoMarket P2P у поточній та найближчій фазах.
- **Як проходить угода** від перегляду оголошення до успішного завершення або справедливого розподілу коштів.
- **Хто і скільки втрачає або отримує** у типових та проблемних сценаріях.
- **Що свідомо не входить** у цю фазу продукту.

Технічна реалізація (canister, смарт-контракти, інтеграції) може змінюватися; **логіка грошей, строків і відповідальності**, зафіксована тут, є орієнтиром для UX, PRD і розробки.

**Стратегічна візія:** маркетплейс у стилі OLX, де ви бачите товар → натискаєте «Купити» → **платформа веде угоду**, без полювання за адресою гаманця продавця. Комісія показується **на першому екрані до підтвердження**. Особистий зовнішній гаманець користувача підв'язується через підписаний nonce, можливо кілька гаманців; кошти продавця **не залишаються на платформі назавжди**. Конкретний wallet SDK не входить у стек без ADR + owner approval.

---

## 2. Щасливий шлях — сценарії простою мовою

### 2.1. Фізичний товар (Nova Poshta)

**Приклад: Олег продає навушники, Марія купує**

1. **Марія** переглядає оголошення Олега. На екрані одразу видно: ціна в USDT/USDC, **комісія платформи**, мережа оплати, спосіб доставки — **лише Nova Poshta** (самовивіз і зустріч у цій фазі недоступні).
2. Марія натискає **«Купити»**. Платформа створює угоду; Олег отримує запит.
3. **Олег має 24 години**, щоб підтвердити угоду (handshake). Якщо не відповість — угода **автоматично скасовується**, Марія отримує **100% назад**.
4. Після підтвердження Олегом платформа відкриває **PaymentIntent**. У Wave 1 Марія платить wallet-to-wallet TRC20/BEP20, а платформа переводить угоду далі тільки після explorer verification; у Gate C Wave 3 ckUSDC/ckUSDT можуть блокуватись у canister escrow. До handshake немає ні payment instructions, ні fund lock.
5. Олег відправляє посилку Nova Poshta, додає ТТН/трекінг у чат угоди.
6. Марія отримує посилку і **підтверджує отримання**, або угода завершується після NP `delivered`/`вручено` + 48 год без спору (D-003).
7. Платформа **виплачує Олегу** ціну мінус комісія; stake Олега (5% від ціни, мін. 10 USDT) залишається як забезпечення до завершення періоду претензій або повертається за правилами.

**Обіцянка:** Марія не шукала адресу гаманця в чаті; платформа показала комісію до commit; payment/lock path відкривається лише після згоди продавця; при успіху продавець отримує оплату.

---

### 2.2. Цифровий товар (файли)

**Приклад: Андрій продає набір шаблонів, Катя купує**

1. **Андрій** створює оголошення типу «цифровий товар», завантажує **зашифрований файл** на платформу. Ключі, текстові доступи, ліцензійні рядки — **не в цій фазі** (лише файли).
2. **Катя** бачить ціну, комісію, натискає «Купити».
3. Андрій підтверджує угоду протягом **24 годин** (або auto-cancel → 100% повернення Каті).
4. Після handshake платформа відкриває payment/lock path; після verified payment або Gate C ck lock платформа **автоматично видає файл** — Андрію не потрібно бути онлайн.
5. Відкривається **24-годинне вікно огляду (inspection)**: Катя перевіряє, що файл відповідає опису.
6. Якщо все гаразд — угода завершується, Андрій отримує оплату. Якщо ні — спочатку переговори, потім ескалація до модератора (див. розділ 4).

**Обіцянка:** Миттєва видача цифрового товару без очікування продавця; чесне вікно перевірки перед остаточним переказом.

---

## 3. Таблиця правил — хто виграє / хто втрачає

| № | Сценарій | Хто ініціює | Результат для покупця | Результат для продавця | Платформа |
|---|----------|-------------|------------------------|------------------------|-----------|
| R1 | **Успішна угода** (фізична або цифрова) | — | Отримує товар/файл; сплачена ціна + комісія при commit | Отримує ціну мінус комісія; stake повертається або залишається за правилами liability | Комісія з угоди |
| R2 | **Продавець не відповів 24 год** | Система (timeout) | **100% повернення** | Угода скасована; stake не списується за цей сценарій | Без штрафу покупцю |
| R3 | **Покупець скасував до відправки** (передумав) | Покупець | Повернення **85%** від verified/locked суми угоди (див. R3a) | **10%** від суми угоди як компенсація | **5%** від суми угоди |
| R3a | *Деталізація R3* | — | 85% = 100% − 10% (продавець) − 5% (платформа) | 10% penalty | 5% penalty |
| R4 | **Продавець винен** (не відправив, фальшивий товар, порушення правил після shipment) | Покупець / модератор | **Повне повернення**; покупець не втрачає, якщо не винен | Списання з **cross-collateral stake** (5%, мін. 10 USDT); можлива глобальна liability | Страховий фонд з комісій — **останній резерв** (ref. crypto_market) |
| R5 | **Покупець винен** (шахрайство, необґрунтована відмова після отримання) | Продавець / модератор | Повернення відхилено або часткове за рішенням модератора | Отримує оплату; buyer stake/compensation mechanism explicitly deferred to D-047 / future epic | Комісія + penalty за правилами |
| R6 | **Спір після відправки** | Будь-яка сторона | Спочатку **переговори (Level 1)** між сторонами | Те саме | Ескалація до **модератора / third party (Level 2)**; **jury відкладено** |
| R7 | **Цифровий товар — inspection 24 год** | Покупець | Під час вікна: повернення при доведеній невідповідності | Оплата після успішного inspection або рішення модератора | Модерація за запитом |
| R8 | **Скасування в дозволених вікнах** (за правилами state machine) | Будь-яка сторона | За таблицею для конкретного вікна (R2, R3, R6) | За таблицею | За таблицею |

**Принцип захисту покупця:** якщо покупець **не винен**, він **не повинен втрачати кошти**. Cross-collateral продавця, глобальна liability та страховий фонд з комісій (як у попередньому проєкті `crypto_market`) — шари захисту, коли винен продавець.

**Принцип stake продавця:** щоб виставити оголошення / продавати, продавець **блокує stake** — **5% від ціни оголошення**, але **не менше 10 USDT**. Це захищає покупця, коли вина на стороні продавця.

---

## 4. Грошовий потік (обіцянка користувачу)

```
Перегляд → «Купити» (комісія видна) → Запит продавцю
    → [24 год: підтвердження або auto-cancel → 100% buyer]
    → Handshake OK → PaymentIntent / verified payment gate (manual) або ck lock (Gate C)
    → Виконання (Nova Poshta / auto-delivery файлу)
    → Підтвердження / inspection
    → Успіх: виплата продавцю | Невдача: refund / penalty за правилами
```

| Етап | Що відбувається з грошима |
|------|---------------------------|
| До handshake | Кошти покупця **не заблоковані** на платформі |
| Після підтвердження продавцем (≤24 год) | **Wave 1 manual:** PaymentIntent + wallet-to-wallet payment + explorer verification; платформа не custody-holder. **Wave 3 Gate C:** ckUSDC/ckUSDT canister escrow lock. |
| Успішне завершення | Продавцю — ціна мінус комісія; stake повертається або утримується за liability |
| Auto-cancel (24 год без відповіді продавця) | Покупцю — **100%** |
| Скасування покупцем до shipment | **10%** продавцю, **5%** платформі, **85%** покупцю |
| Вина продавця | Refund покупцю; покриття з stake / liability / insurance fund |

**Гаманці:** особистий зовнішній гаманець користувача через підписаний nonce; можливість кількох гаманців. Manual path не робить платформу custody-holder; seller stake блокується як забезпечення, а справжній buyer fund lock існує тільки для Gate C ckUSDC/ckUSDT. Конкретний wallet SDK не входить у стек без ADR + owner approval.

**Токени та мережі (каталог):** USDT TRC20, USDT BEP20, USDT ERC20, USDC ERC20.  
**Wave 1 settlement:** manual coordinated explorer verification тільки для USDT TRC20 + USDT BEP20. ERC20 manual enablement — Wave 3 (E4.S8/D-044). ckUSDC/ckUSDT on-chain escrow — Gate C Wave 3 beta, не стартова user promise.

---

## 5. Спори та ескалація

| Рівень | Хто вирішує | Коли |
|--------|-------------|------|
| **Level 1** | Покупець ↔ Продавець (чат угоди) | Будь-яка розбіжність; обов'язковий перший крок після shipment |
| **Level 2** | Модератор / third party | Якщо Level 1 не дав результату |
| **Jury (juror dashboard)** | — | **Відкладено** в цій фазі контракту |

---

## 6. Зведена таблиця чисел

| Параметр | Значення | Примітка |
|----------|----------|----------|
| **Stake продавця** | **5%** від ціни оголошення | Затверджено «for start» |
| **Мінімальний stake** | **10 USDT** | Навіть якщо 5% менше |
| **Вікно підтвердження продавцем** | **24 години** | Інакше auto-cancel |
| **Auto-cancel (no seller response)** | Покупцю **100%** | — |
| **Penalty: покупець скасував до shipment** | **10%** → продавець | «For start» |
| | **5%** → платформа | «For start» |
| | **85%** → повернення покупцю | Залишок |
| **Inspection (цифрові файли)** | **24 години** | Після auto-delivery |
| **Buyer-facing token catalog** | USDT TRC20/BEP20/ERC20; USDC ERC20 | Catalog visible; settlement enablement wave-gated |
| **Wave 1 manual settlement** | USDT TRC20 + USDT BEP20 | Coordinated explorer verification only |
| **Wave 3 Gate C on-chain** | ckUSDC first, ckUSDT second | Trustless escrow copy allowed only after Gate C |
| **Доставка (фізичні)** | Nova Poshta only | Self-pickup/meetup — out of scope |
| **Цифрові товари (старт)** | Лише **файли** | Keys/text/access — later |

---

## 7. Явно поза scope цієї фази контракту

| Не входить зараз | Коментар |
|------------------|----------|
| **Самовивіз / зустріч (self-pickup, meetup)** | Лише Nova Poshta для фізичних товарів |
| **Цифрові товари: ключі, текст, доступи** | Лише завантажені файли з auto-delivery |
| **Jury / juror dashboard** | Level 2 = модератор / third party |
| **Trustless на всіх мережах** | Довгострокова мета; Wave 3 Gate C starts with ckUSDC/ckUSDT beta only |
| **Ukrposhta, Meest** | Можуть існувати в коді як deferred; не обіцяємо користувачу в цій фазі |
| **Повна custodial модель** | Гроші не «живуть» на платформі назавжди |

---

## 8. Рішення / deferrals для implementation

| Тема | Статус |
|------|--------|
| **Nova Poshta — підтвердження отримання** | **Resolved D-003/E7.S3:** buyer confirm OR NP `delivered`/`вручено` + 48h without dispute. `Arrived at branch` is not delivery. NP API unavailable = fail-closed. |
| **Ship-by SLA** | **Resolved D-019/E7.S3:** seller has 7 days after `payment_verified` / `funded_locked` to provide a valid TTN; timeout escalates to dispute/refund path and payout stays blocked. |
| **Manual chain rollout** | **Resolved D-002/D-044:** Wave 1 enables TRC20 USDT + BEP20 USDT manual settlement. ERC20 USDT/USDC remains buyer-facing catalog scope but settlement enablement is Wave 3 E4.S8 after security review/gas warning. |
| **Комісія платформи (% від угоди)** | **Resolved D-001/E3.S8:** default 3% buyer-facing platform fee, shown upfront. Admin can override bps later; implementation must use 3% default. |
| **Jury** | **Deferred D-014/D-046:** no jury promise in Wave 1-3. Wave 2 uses L1 chat → L2 moderator; jury can be reconsidered only after dispute volume/SLA metrics justify it. |
| **Penalty покупця при fraud / buyer stake** | **Deferred D-047:** no buyer stake in Wave 1-3. Buyer-at-fault handling uses reputation/velocity/account review first; buyer stake needs a future epic. |
| **Insurance fund** | **Wave 3 only D-021/D-038/D-039/E10.S4:** no Wave 1 full-refund/insurance copy. Reserve accrual default 40% of platform fee; payout cap policy must ship before any insurance guarantee. |
| **Compliance launch gate** | **Required before public beta:** jurisdiction/sanctions/AML/KYC/privacy checklist and counsel sign-off; see `COMPLIANCE-LAUNCH-GATE.md`. |

**Референс для liability / cross-collateral / insurance fund:** попередній проєкт `/Volumes/workspace-drive/projects/other/crypto_market`.

---

## 9. BMAD course correction status

Контракт синхронізований у planning artifacts 2026-05-23. Якщо product scope зміниться, оновлювати ці артефакти в такому порядку (не дублювати суперечності з User Product Contract):

| Артефакт | Шлях | Що оновити |
|----------|------|------------|
| **PRD** | `_bmad-output/planning-artifacts/prd.md` | Primary journey: Nova Poshta замість self-pickup MVP; handshake 24h; stake 5%/10 USDT; penalty split 10/5/85; fund lock after seller confirm; Phase 1.5 tokens; honest «coordinated → on-chain» wording |
| **Epics** | `_bmad-output/planning-artifacts/epics.md` | E7 fulfillment scope (NP only, defer pickup); E6 disputes (jury deferred, cross-collateral numbers); E9 on-chain Phase 1.5; E3 trade lifecycle (handshake before lock) |
| **Gap analysis** | `_bmad-output/planning-artifacts/gap-analysis.md` | Тристороннє порівняння: shipping = Nova Poshta; digital = files only; stake/penalty numbers; fund lock timing |
| **Story manifest** | `scripts/story-manifest.mjs` | Пріоритети/статуси stories: e07-s01 self-pickup → deferred; e07-s03 Nova Poshta → in-scope; e06-s07 cross-collateral → align 5%/10 USDT; e03 trade flow → post-handshake lock |

**Рекомендований порядок:** PRD → epics → gap-analysis → story-manifest + точкові story files (E3, E6, E7).

---

## 10. Короткий чеклист обіцянок для користувача

- [ ] Бачу **комісію до** натискання «Купити».
- [ ] Не шукаю адресу гаманця продавця вручну — платформа веде угоду.
- [ ] Продавець має **24 год** на підтвердження; інакше я отримую **100% назад**.
- [ ] Гроші блокуються **після** підтвердження продавцем, не раніше.
- [ ] Продавець має **stake 5% (мін. 10 USDT)** — я захищений, якщо він винен.
- [ ] Якщо передумав **до відправки** — повертають **85%**, решта за правилами penalty.
- [ ] **Цифровий файл** видається автоматично; **24 год** на перевірку.
- [ ] **Фізична доставка** — лише **Nova Poshta** в цій фазі.
- [ ] Спір: спочатку ми з продавцем, потім модератор; **jury поки немає**.

---

*Документ підготовлено на основі owner-approved рішень UX alignment discussion. Технічні деталі реалізації — у PRD, ONCHAIN-SETTLEMENT-DESIGN та story files.*
