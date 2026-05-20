#!/usr/bin/env node
/** Generates src/backend/lib/CategoryCatalog.mo — OLX L1+L2 taxonomy */
import fs from "fs";

const L1 = [
  { id: 1, slug: "detskiy-mir", uk: "Дитячий світ", en: "Kids", legacy: "other" },
  { id: 2, slug: "nedvizhimost", uk: "Нерухомість", en: "Real estate", legacy: "other" },
  { id: 3, slug: "transport", uk: "Авто", en: "Vehicles", legacy: "other" },
  { id: 4, slug: "zapchasti", uk: "Запчастини", en: "Auto parts", legacy: "other" },
  { id: 5, slug: "elektronika", uk: "Електроніка", en: "Electronics", legacy: "electronics" },
  { id: 6, slug: "dom-i-sad", uk: "Дім і сад", en: "Home & garden", legacy: "other" },
  { id: 7, slug: "moda-i-stil", uk: "Мода і стиль", en: "Fashion", legacy: "clothing" },
  { id: 8, slug: "hobbi-otdyh-i-sport", uk: "Хобі, відпочинок і спорт", en: "Hobby & sport", legacy: "other" },
  { id: 9, slug: "zhivotnye", uk: "Тварини", en: "Animals", legacy: "other" },
  { id: 10, slug: "rabota", uk: "Робота", en: "Jobs", legacy: "services" },
  { id: 11, slug: "biznes-uslugi", uk: "Бізнес та послуги", en: "Business & services", legacy: "services" },
  { id: 12, slug: "arenda-prokat", uk: "Оренда та прокат", en: "Rent & lease", legacy: "services" },
  { id: 13, slug: "zhytlo-podobovo", uk: "Житло подобово", en: "Daily rentals", legacy: "other" },
  { id: 14, slug: "obmen", uk: "Обмін", en: "Exchange / barter", legacy: "other" },
  { id: 15, slug: "otdam-besplatno", uk: "Віддам безкоштовно", en: "Free items", legacy: "other" },
];

const L2 = {
  1: [
    ["detskaya-odezhda", "Дитячий одяг", "Kids clothing"],
    ["detskaya-obuv", "Дитяче взуття", "Kids shoes"],
    ["detskie-kolyaski", "Дитячі коляски", "Strollers"],
    ["detskie-avtokresla", "Дитячі автокрісла", "Car seats"],
    ["detskaya-mebel", "Дитячі меблі", "Kids furniture"],
    ["igrushki", "Іграшки", "Toys"],
    ["detskiy-transport", "Дитячий транспорт", "Kids transport"],
    ["kormlenie", "Годування", "Feeding"],
    ["tovary-dlya-shkolnikov", "Товари для школярів", "School supplies"],
    ["prochie-detskie-tovary", "Інші дитячі товари", "Other kids items"],
  ],
  2: [
    ["kvartiry", "Квартири", "Apartments"],
    ["komnaty", "Кімнати", "Rooms"],
    ["doma", "Будинки", "Houses"],
    ["zemlya", "Земля", "Land"],
    ["kommercheskaya-nedvizhimost", "Комерційна нерухомість", "Commercial"],
    ["garazhy-parkovki", "Гаражі, парковки", "Garages & parking"],
    ["nedvizhimost-za-rubezhom", "Нерухомість за кордоном", "Abroad"],
  ],
  3: [
    ["legkovye-avtomobili", "Легкові автомобілі", "Cars"],
    ["gruzoviki", "Вантажівки", "Trucks"],
    ["mototsikly", "Мотоцикли", "Motorcycles"],
    ["vodnyy-transport", "Водний транспорт", "Watercraft"],
    ["selhoztehnika", "Сільгосптехніка", "Agricultural"],
    ["pricepy", "Причепи", "Trailers"],
    ["avtobusy", "Автобуси", "Buses"],
    ["drugoy-transport", "Інший транспорт", "Other vehicles"],
  ],
  4: [
    ["shiny-diski-kolesa", "Шини, диски та колеса", "Tires & wheels"],
    ["zapchasti-legkovye", "Запчастини для легкових", "Car parts"],
    ["zapchasti-gruzovye", "Запчастини для вантажівок", "Truck parts"],
    ["mototehnika-zapchasti", "Мотозапчастини", "Moto parts"],
    ["aksessuary", "Аксесуари", "Accessories"],
    ["masla-zhidkosti", "Масла та рідини", "Oils & fluids"],
    ["audio-video", "Аудіо / відео", "Car audio"],
    ["tyuning", "Тюнінг", "Tuning"],
  ],
  5: [
    ["telefony", "Телефони", "Phones"],
    ["noutbuki", "Ноутбуки", "Laptops"],
    ["kompyutery", "Комп'ютери", "Computers"],
    ["planshety", "Планшети", "Tablets"],
    ["tv-audio", "ТВ та аудіо", "TV & audio"],
    ["foto-video", "Фото та відео", "Photo & video"],
    ["igry-pristavki", "Ігри та приставки", "Gaming"],
    ["bytovaya-tehnika", "Побутова техніка", "Appliances"],
    ["tsifrovye-tovary", "Цифрові товари", "Digital goods"],
  ],
  6: [
    ["mebel", "Меблі", "Furniture"],
    ["tekstil-dekor", "Текстиль і декор", "Textile & decor"],
    ["kuhnya", "Кухня", "Kitchen"],
    ["sad-ogorod", "Сад і город", "Garden"],
    ["instrumenty", "Інструменти", "Tools"],
    ["osveshchenie", "Освітлення", "Lighting"],
    ["remont-stroitelstvo", "Ремонт і будівництво", "Construction"],
    ["prochee-dom", "Інше для дому", "Other home"],
  ],
  7: [
    ["zhenskaya-odezhda", "Жіночий одяг", "Women"],
    ["muzhskaya-odezhda", "Чоловічий одяг", "Men"],
    ["obuv", "Взуття", "Shoes"],
    ["aksessuary-moda", "Аксесуари", "Accessories"],
    ["krasota-zdorove", "Краса та здоров'я", "Beauty"],
    ["chasy-ukrasheniya", "Годинники та прикраси", "Watches & jewelry"],
    ["sumki", "Сумки", "Bags"],
    ["drugoe-moda", "Інше", "Other fashion"],
  ],
  8: [
    ["sport-inventar", "Спортивний інвентар", "Sports gear"],
    ["velosipedy", "Велосипеди", "Bicycles"],
    ["turyzm", "Туризм", "Tourism"],
    ["muzyka", "Музика", "Music"],
    ["kollektsionirovanie", "Колекціонування", "Collectibles"],
    ["ohota-rybalka", "Полювання та рибалка", "Hunting & fishing"],
    ["knigi-zhurnaly", "Книги та журнали", "Books & magazines"],
    ["drugoe-hobbi", "Інше", "Other hobby"],
  ],
  9: [
    ["sobaki", "Собаки", "Dogs"],
    ["koshki", "Коти", "Cats"],
    ["ptitsy", "Птахи", "Birds"],
    ["akvarium", "Акваріум", "Aquarium"],
    ["gryzuny", "Гризуни", "Rodents"],
    ["selskohozyaystvennye", "Сільгосп тварини", "Farm animals"],
    ["tovary-dlya-zhivotnyh", "Товари для тварин", "Pet supplies"],
    ["drugie-zhivotnye", "Інші тварини", "Other animals"],
  ],
  10: [
    ["vakansii", "Вакансії", "Vacancies"],
    ["rezume", "Резюме", "CVs"],
    ["podrabotka", "Підробіток", "Part-time"],
    ["stazhirovka", "Стажування", "Internships"],
    ["udalennaya-rabota", "Віддалена робота", "Remote"],
    ["sezonnye", "Сезонні", "Seasonal"],
  ],
  11: [
    ["oborudovanie", "Обладнання", "Equipment"],
    ["gotoviy-biznes", "Готовий бізнес", "Ready business"],
    ["uslugi-remont", "Послуги та ремонт", "Services"],
    ["ofis", "Офіс", "Office"],
    ["proizvodstvo", "Виробництво", "Production"],
    ["torgovlya", "Торгівля", "Retail"],
  ],
  12: [
    ["arenda-avto", "Оренда авто", "Car rent"],
    ["arenda-instrumentov", "Оренда інструментів", "Tool rent"],
    ["arenda-odezhdy", "Оренда одягу", "Clothing rent"],
    ["prokat-razvlecheniy", "Прокат розваг", "Entertainment rent"],
    ["arenda-tehniki", "Оренда техніки", "Equipment rent"],
  ],
  13: [
    ["kvartiry-posutochno", "Квартири подобово", "Daily apartments"],
    ["doma-posutochno", "Будинки подобово", "Daily houses"],
    ["komnaty-posutochno", "Кімнати подобово", "Daily rooms"],
    ["hostely", "Хостели", "Hostels"],
  ],
  14: [
    ["obmen-tovarov", "Обмін товарів", "Goods exchange"],
    ["obmen-uslug", "Обмін послуг", "Services exchange"],
  ],
  15: [
    ["otdam-darom", "Віддам даремно", "Give away"],
    ["na-razborku", "На розбірку", "For parts"],
  ],
};

const legacyVariant = {
  electronics: "#electronics",
  clothing: "#clothing",
  books: "#books",
  digital: "#digital",
  services: "#services",
  other: "#other",
};

const nodes = [];
for (const p of L1) {
  nodes.push({ id: p.id, parentId: null, slug: p.slug, uk: p.uk, en: p.en, legacy: p.legacy });
  for (const [i, row] of (L2[p.id] || []).entries()) {
    const [slug, uk, en] = row;
    nodes.push({
      id: p.id * 100 + (i + 1),
      parentId: p.id,
      slug: `${p.slug}/${slug}`,
      uk,
      en,
      legacy: p.legacy,
    });
  }
}

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

let mo = `/// OLX-aligned category catalog (L1 + L2). Regenerate: node scripts/gen-category-catalog.mjs
import Array "mo:core/Array";
import Types "../types";

module {

  public type CategoryNode = Types.CategoryNode;
  public type CategoryId = Types.CategoryId;

  let nodes : [CategoryNode] = [
`;

for (const n of nodes) {
  const parent = n.parentId === null ? "null" : `?${n.parentId}`;
  mo += `    { id = ${n.id}; parentId = ${parent}; slug = "${esc(n.slug)}"; labelUk = "${esc(n.uk)}"; labelEn = "${esc(n.en)}"; legacyCategory = ${legacyVariant[n.legacy]} },\n`;
}

mo += `  ];

  public func containsId(xs : [CategoryId], x : CategoryId) : Bool {
    for (y in xs.vals()) { if (y == x) return true };
    false
  };

  public func all() : [CategoryNode] { nodes };

  public func get(id : CategoryId) : ?CategoryNode {
    for (n in nodes.vals()) {
      if (n.id == id) return ?n;
    };
    null
  };

  public func getBySlug(slug : Text) : ?CategoryNode {
    for (n in nodes.vals()) {
      if (n.slug == slug) return ?n;
    };
    null
  };

  public func children(parentId : CategoryId) : [CategoryNode] {
    nodes.filter(func (n : CategoryNode) : Bool {
      switch (n.parentId) {
        case (?p) p == parentId;
        case null false;
      }
    })
  };

  public func descendants(id : CategoryId) : [CategoryId] {
    var result : [CategoryId] = [id];
    var changed = true;
    while (changed) {
      changed := false;
      for (n in nodes.vals()) {
        switch (n.parentId) {
          case (?par) {
            if (containsId(result, par) and not containsId(result, n.id)) {
              result := result.concat([n.id]);
              changed := true;
            };
          };
          case null {};
        };
      };
    };
    result
  };

  public func isValid(id : CategoryId) : Bool {
    switch (get(id)) { case (?_) true; case null false }
  };

  public func legacyCategoryToId(cat : Types.ListingCategory) : CategoryId {
    switch (cat) {
      case (#electronics) { 5 };
      case (#clothing) { 7 };
      case (#books) { 801 };
      case (#digital) { 509 };
      case (#services) { 1101 };
      case (#other) { 1 };
    }
  };

  public func resolveCategoryId(categoryId : ?CategoryId, category : Types.ListingCategory) : CategoryId {
    switch (categoryId) {
      case (?id) {
        if (isValid(id)) id else legacyCategoryToId(category)
      };
      case null { legacyCategoryToId(category) };
    }
  };

  public func nodeLegacyCategory(id : CategoryId) : Types.ListingCategory {
    switch (get(id)) {
      case (?n) n.legacyCategory;
      case null #other;
    }
  };

};
`;

const out = new URL("../src/backend/lib/CategoryCatalog.mo", import.meta.url);
fs.writeFileSync(out, mo);

const tsNodes = nodes.map((n) => ({
  id: n.id,
  parentId: n.parentId,
  slug: n.slug,
  labelUk: n.uk,
  labelEn: n.en,
  legacy: n.legacy,
}));
const tsOut = new URL("../src/frontend/src/data/olxCategories.ts", import.meta.url);
fs.mkdirSync(new URL("../src/frontend/src/data/", import.meta.url), { recursive: true });
fs.writeFileSync(
  tsOut,
  `/** Auto-generated from scripts/gen-category-catalog.mjs — OLX L1+L2 taxonomy */\n\nexport type OlxCategoryNode = {\n  id: number;\n  parentId: number | null;\n  slug: string;\n  labelUk: string;\n  labelEn: string;\n  legacy: string;\n};\n\nexport const OLX_CATEGORIES: OlxCategoryNode[] = ${JSON.stringify(tsNodes, null, 2)};\n\nexport function getCategoryBySlug(slug: string): OlxCategoryNode | undefined {\n  return OLX_CATEGORIES.find((c) => c.slug === slug);\n}\n\nexport function getCategoryById(id: number): OlxCategoryNode | undefined {\n  return OLX_CATEGORIES.find((c) => c.id === id);\n}\n\nexport function getL1Categories(): OlxCategoryNode[] {\n  return OLX_CATEGORIES.filter((c) => c.parentId === null);\n}\n\nexport function getChildCategories(parentId: number): OlxCategoryNode[] {\n  return OLX_CATEGORIES.filter((c) => c.parentId === parentId);\n}\n\nexport function categoryLabel(c: OlxCategoryNode, locale: \"uk\" | \"en\"): string {\n  return locale === \"uk\" ? c.labelUk : c.labelEn;\n}\n`,
);
console.log("Wrote", out.pathname, "nodes:", nodes.length);
console.log("Wrote", tsOut.pathname);
