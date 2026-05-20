# OLX full functionality gap audit — CryptoMarket P2P

**Date:** 2026-05-19  
**Source:** [OLX.ua sitemap](https://www.olx.ua/uk/sitemap/) (1,259 category URLs), [how it works](https://www.olx.ua/uk/howitworks/), product code + PRD.

**Previous doc `OLX-PARITY.md` claimed ~95% Phase 1 parity — that was wrong.** It measured a thin slice of the buyer/seller loop, not OLX as a product.

---

## Executive summary

| Dimension | OLX.ua (reference) | CryptoMarket P2P (today) | Honest gap |
|-----------|-------------------|--------------------------|------------|
| **Category tree** | ~17 top-level verticals, **1,259** category URLs (depth 1–3+; cars have make/model leaves) | **6** flat enums, no subcategories | **~99.5%** of taxonomy missing |
| **Category-specific fields** | Hundreds (rooms, m², brand, year, size, fuel, etc.) | Title, description, condition, location text, photos | **~95%+** missing |
| **Discovery & homepage** | Category grid, VIP/promoted, popular queries, geo | Featured listings, search, 6-category filter | **~60%** missing |
| **Listing lifecycle** | Bump, promote, packages, stats, expiry | Create, edit, deactivate | **~50%** missing |
| **Buyer engagement** | Favorites, saved search alerts, call/chat from ad | Trade-only chat; no favorites | **~70%** missing |
| **Contact before deal** | Phone + OLX chat from listing | Buy → trade only | Different model |
| **Delivery** | OLX Delivery (integrated) | Pickup MVP; carriers in backend, UI locked | **~80%** missing |
| **Payments** | Fiat + delivery escrow | Crypto P2P + platform trade state | Different (by design) |
| **Trust / identity** | Email/phone/FB, business accounts | Internet Identity pseudonym | Different (by design) |
| **Jobs / RE / Auto verticals** | Full separate UX per vertical | Not present | **100%** missing |

**Rough overall OLX surface parity (marketplace UX, not crypto trade layer): ~25–35%.**  
Crypto trade, disputes, and on-chain settlement are **additions** OLX does not have; they do not compensate for missing taxonomy and vertical features.

---

## 1. Categories (your main point — you are right)

### OLX.ua top-level verticals (from sitemap)

| # | OLX category (UK) | In CryptoMarket? |
|---|-------------------|------------------|
| 1 | Дитячий світ | No (only generic `other`) |
| 2 | Нерухомість | **No** |
| 3 | Авто (`transport`) | **No** |
| 4 | Запчастини | **No** |
| 5 | Електроніка | Partial (`electronics` only) |
| 6 | Дім і сад | **No** |
| 7 | Мода і стиль | Partial (`clothing` only) |
| 8 | Хобі, відпочинок і спорт | **No** |
| 9 | Тварини | **No** |
| 10 | Робота | **No** |
| 11 | Бізнес та послуги | Partial (`services`) |
| 12 | Оренда та прокат | **No** |
| 13 | Житло подобово | **No** |
| 14 | Обмін | **No** |
| 15 | Віддам безкоштовно | **No** |
| 16 | До речі, відомі речі | **No** |
| 17 | (Promo / meta pages) | N/A |

### CryptoMarket `ListingCategory` (entire taxonomy)

```motoko
#electronics; #clothing; #books; #services; #digital; #other;
```

**6 values** — used in `CreateListingPage`, `FilterPanel`, `searchListings(category)`.

### Scale comparison

| Metric | OLX.ua | CryptoMarket |
|--------|--------|--------------|
| Top-level categories | ~17 | 6 |
| Total category URLs (sitemap) | **1,259** | 6 |
| Depth | Up to 3+ (e.g. Auto → brand → model) | 0 (flat) |
| Per-category attributes | Yes (dynamic forms) | No |

**Examples OLX has, we do not:**

- **Нерухомість:** квартири / продаж / оренда / кімнати / будинки / земля / комерція / гаражі…
- **Авто:** легкові → **Audi, BMW, Toyota…** (hundreds of brand leaves)
- **Дитячий світ:** одяг → хлопчики / дівчатка / новонароджені; іграшки → 15+ subtypes
- **Запчастини:** шини, диски, двигуни, кузов…

Implementing a **full** OLX taxonomy is a **multi-month** data + UX + migration project, not a single goal pass.

---

## 2. OLX feature domains — complete checklist

Legend: **Done** | **Partial** | **Missing** | **N/A** (different product choice)

### A. Browse & discover

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Homepage category grid (all verticals) | Yes | No | **Missing** |
| VIP / promoted listings block | Yes | Featured = latest active only | **Missing** |
| Popular searches | Yes | No | **Missing** |
| Full-text search | Yes | Yes | Done |
| Category + subcategory navigation | Yes | Single category filter | **Missing** |
| Geo: region / city / radius | Yes | Free-text `location` | **Partial** |
| Sort (newest, price, relevance) | Yes | Limited | **Partial** |
| Filters: price, condition, photos only | Yes | Price, condition, token, carrier | Partial |
| Saved searches + email/push alerts | Yes | No | **Missing** |
| Map view | Yes (some categories) | No | **Missing** |

### B. Listing (ad) CRUD

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Post ad wizard | Yes | Multi-step create | Partial |
| Photos (multi) | Yes | Yes | Done |
| Video | Yes (some) | No | **Missing** |
| Dynamic fields per category | Yes | No | **Missing** |
| Price negotiable / exchange / free | Yes | Fixed crypto price | **Missing** |
| Business / shop listings | Yes | No | **Missing** |
| Edit ad | Yes | Yes | Done |
| Deactivate / delete | Yes | Deactivate | Partial |
| Duplicate ad | Yes | No | **Missing** |
| Bump / refresh to top | Yes | No | **Missing** |
| Paid promotion (VIP) | Yes | No | **Missing** |
| Ad statistics (views) | Yes | No | **Missing** |
| Ad expiry / auto-renew | Yes | No | **Missing** |

### C. Ad detail & buyer actions

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Gallery + description | Yes | Yes | Done |
| Seller mini-profile | Yes | Yes | Done |
| Share link | Yes | Yes (recent) | Done |
| Report ad | Yes | Yes (recent) | Done |
| **Call seller (phone)** | Yes | No (II only) | **N/A** by design |
| **Chat before purchase** | Yes | No (chat per **trade** only) | **Missing** vs OLX |
| Add to favorites | Yes | No | **Missing** |
| Similar ads carousel | Yes | 3 seller listings only | **Partial** |
| OLX Delivery CTA | Yes | Trade flow + pickup | **Missing** |

### D. Account & trust

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Register email / phone / FB | Yes | II only | **N/A** |
| Public profile + listings | Yes | Yes | Done |
| Ratings / reviews on profile | Yes | Reputation score | Partial |
| Verified / business badge | Yes | No | **Missing** |
| My ads dashboard | Yes | My listings | Partial |
| Purchase history | Yes | My trades | Different |
| Notifications (saved search, messages) | Yes | Trade/message toasts | Partial |
| GDPR export / delete account | Yes | No | **Missing** (PRD gap) |

### E. Messaging

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Inbox across ads | Yes | Per-trade threads | **Partial** |
| Attachments / link preview | Yes | Partial backend | Partial |
| Block user | Yes | Ban (admin) | Partial |

### F. Transactions & delivery (OLX vs crypto)

| Feature | OLX | CryptoMarket | Status |
|---------|-----|--------------|--------|
| Meet in person | Yes | Pickup | Done |
| OLX Delivery (logistics + payment) | Yes | Carriers in Motoko, UI disabled | **Missing** |
| Wallet crypto payment | No | Yes | **Addition** |
| Trade state machine + deadlines | No | Yes | **Addition** |
| Disputes + moderator | Limited | Yes | **Addition** |
| On-chain escrow | No | Phase 3 | Planned |

### G. Vertical-specific (large OLX slices — all missing)

| Vertical | OLX capabilities | CryptoMarket |
|----------|------------------|--------------|
| **Нерухомість** | Rooms, area, floor, rent/sale, daily rent | None |
| **Авто** | Make, model, year, mileage, VIN filters | None |
| **Робота** | CV, salary, employment type | None |
| **Тварини** | Breed, age, documents | None |
| **Обмін / безкоштовно** | Listing types | None |

### H. Platform & apps

| Feature | OLX | CryptoMarket |
|---------|-----|--------------|
| iOS / Android apps | Yes | Web only |
| Partner API | Yes | Canister Candid |
| Cookies / marketing consent | Yes | Minimal |
| Help center / safety tips | Yes | Partial (`/how-payments-work`, `/privacy`) |

---

## 3. What the last goal pass actually added

Small slice of section **C** only:

- Share, report, privacy page, docs, `reportListing` backend.

It did **not** add: taxonomy, favorites, promotion, pre-trade chat, verticals, OLX Delivery, saved searches, or 1,200+ categories.

---

## 4. Recommended phasing (if goal is “real OLX clone + crypto”)

### Phase A — Taxonomy foundation (blocking)

**Status (2026-05-19 goal pass):** Implemented in repo — `CategoryCatalog.mo` (15 L1 + 99 L2 = 114 nodes), `listCategories`, `categoryId` on listings, subtree search, cascaded `CategoryPicker`, homepage `CategoryGrid`, URL `?cat=<slug>`. Regenerate: `node scripts/gen-category-catalog.mjs`.

1. Replace `ListingCategory` enum with **tree** (`categoryId`, parent, slug, i18n labels). — **Done** (enum kept for legacy; `categoryId` is canonical)
2. Seed **OLX-aligned L1 + L2** (~150–200 nodes), not all 1,259 leaves in v1. — **Done** (114 nodes)
3. Category picker UI (tree / cascaded selects). — **Done**
4. URL routes: `/listings?cat=transport/legkovye-avtomobili`. — **Done**

### Phase B — OLX core gaps (high user visibility)

**Status (2026-05-19 goal pass):** Implemented in repo — `Engagement.mo` + `engagement-api.mo`: favorites (`addFavorite`, `getFavoriteListings`, `/favorites`), pre-trade `sendListingInquiry` / `getListingInquiryMessages`, saved searches (`saveSearch`, `getSavedSearches`), owner `bumpListing`, admin `adminPromoteListing`, search sort by promoted → bumped → created. Frontend: heart, inquiry dialog, saved-search panel, VIP badge. Homepage category grid was Phase A.

1. Favorites / watchlist — **Done**
2. Pre-trade messaging from listing — **Done**
3. Sort + saved searches — **Done** (URL sort + saved search apply; email alerts out of scope)
4. Homepage category grid — **Done** (Phase A)
5. Bump / promote — **Done** (owner bump + admin promote)

### Phase C — Vertical modules

1. **Auto** attributes (make, model, year, mileage)  
2. **Real estate** attributes (rooms, area, deal type)  
3. Jobs, animals — only if product scope confirms  

### Phase D — Fulfillment

1. Enable one carrier UI (Nova Poshta) or honest “pickup only” until ready  

### Phase E — Crypto differentiation (already started)

1. Phase 1 coordinated pay (done)  
2. Phase 3 ICRC escrow (`TRUSTLESS-SETTLEMENT-DESIGN.md`)  

**“100% functional clone”** = Phases **A through D** + parity testing against OLX flows, **plus** crypto layer — estimate **many months**, not one agent session.

---

## 5. Corrected parity statement (use in PRD/agents)

> CryptoMarket is an **OLX-inspired crypto goods marketplace** with a **minimal 6-category taxonomy** and a **strong trade/dispute layer**. It is **not** a feature-complete OLX clone. Full taxonomy and vertical features are **explicitly not shipped**.

---

## 6. References

- Sitemap scrape: 1,259 URLs, depth histogram `{1: 20, 2: 168, 3: 1071}`  
- Code: `src/backend/types.mo` (`ListingCategory`), `FilterPanel.tsx`, `CreateListingPage.tsx`  
- PRD: `_bmad-output/planning-artifacts/prd.md` (Phase 1 = coordinated marketplace, not full OLX)
