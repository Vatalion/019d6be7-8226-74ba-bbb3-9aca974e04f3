/// OLX-aligned category catalog (L1 + L2). Regenerate: node scripts/gen-category-catalog.mjs
import Array "mo:core/Array";
import Types "../types";

module {

  public type CategoryNode = Types.CategoryNode;
  public type CategoryId = Types.CategoryId;

  let nodes : [CategoryNode] = [
    { id = 1; parentId = null; slug = "detskiy-mir"; labelUk = "Дитячий світ"; labelEn = "Kids"; legacyCategory = #other },
    { id = 101; parentId = ?1; slug = "detskiy-mir/detskaya-odezhda"; labelUk = "Дитячий одяг"; labelEn = "Kids clothing"; legacyCategory = #other },
    { id = 102; parentId = ?1; slug = "detskiy-mir/detskaya-obuv"; labelUk = "Дитяче взуття"; labelEn = "Kids shoes"; legacyCategory = #other },
    { id = 103; parentId = ?1; slug = "detskiy-mir/detskie-kolyaski"; labelUk = "Дитячі коляски"; labelEn = "Strollers"; legacyCategory = #other },
    { id = 104; parentId = ?1; slug = "detskiy-mir/detskie-avtokresla"; labelUk = "Дитячі автокрісла"; labelEn = "Car seats"; legacyCategory = #other },
    { id = 105; parentId = ?1; slug = "detskiy-mir/detskaya-mebel"; labelUk = "Дитячі меблі"; labelEn = "Kids furniture"; legacyCategory = #other },
    { id = 106; parentId = ?1; slug = "detskiy-mir/igrushki"; labelUk = "Іграшки"; labelEn = "Toys"; legacyCategory = #other },
    { id = 107; parentId = ?1; slug = "detskiy-mir/detskiy-transport"; labelUk = "Дитячий транспорт"; labelEn = "Kids transport"; legacyCategory = #other },
    { id = 108; parentId = ?1; slug = "detskiy-mir/kormlenie"; labelUk = "Годування"; labelEn = "Feeding"; legacyCategory = #other },
    { id = 109; parentId = ?1; slug = "detskiy-mir/tovary-dlya-shkolnikov"; labelUk = "Товари для школярів"; labelEn = "School supplies"; legacyCategory = #other },
    { id = 110; parentId = ?1; slug = "detskiy-mir/prochie-detskie-tovary"; labelUk = "Інші дитячі товари"; labelEn = "Other kids items"; legacyCategory = #other },
    { id = 2; parentId = null; slug = "nedvizhimost"; labelUk = "Нерухомість"; labelEn = "Real estate"; legacyCategory = #other },
    { id = 201; parentId = ?2; slug = "nedvizhimost/kvartiry"; labelUk = "Квартири"; labelEn = "Apartments"; legacyCategory = #other },
    { id = 202; parentId = ?2; slug = "nedvizhimost/komnaty"; labelUk = "Кімнати"; labelEn = "Rooms"; legacyCategory = #other },
    { id = 203; parentId = ?2; slug = "nedvizhimost/doma"; labelUk = "Будинки"; labelEn = "Houses"; legacyCategory = #other },
    { id = 204; parentId = ?2; slug = "nedvizhimost/zemlya"; labelUk = "Земля"; labelEn = "Land"; legacyCategory = #other },
    { id = 205; parentId = ?2; slug = "nedvizhimost/kommercheskaya-nedvizhimost"; labelUk = "Комерційна нерухомість"; labelEn = "Commercial"; legacyCategory = #other },
    { id = 206; parentId = ?2; slug = "nedvizhimost/garazhy-parkovki"; labelUk = "Гаражі, парковки"; labelEn = "Garages & parking"; legacyCategory = #other },
    { id = 207; parentId = ?2; slug = "nedvizhimost/nedvizhimost-za-rubezhom"; labelUk = "Нерухомість за кордоном"; labelEn = "Abroad"; legacyCategory = #other },
    { id = 3; parentId = null; slug = "transport"; labelUk = "Авто"; labelEn = "Vehicles"; legacyCategory = #other },
    { id = 301; parentId = ?3; slug = "transport/legkovye-avtomobili"; labelUk = "Легкові автомобілі"; labelEn = "Cars"; legacyCategory = #other },
    { id = 302; parentId = ?3; slug = "transport/gruzoviki"; labelUk = "Вантажівки"; labelEn = "Trucks"; legacyCategory = #other },
    { id = 303; parentId = ?3; slug = "transport/mototsikly"; labelUk = "Мотоцикли"; labelEn = "Motorcycles"; legacyCategory = #other },
    { id = 304; parentId = ?3; slug = "transport/vodnyy-transport"; labelUk = "Водний транспорт"; labelEn = "Watercraft"; legacyCategory = #other },
    { id = 305; parentId = ?3; slug = "transport/selhoztehnika"; labelUk = "Сільгосптехніка"; labelEn = "Agricultural"; legacyCategory = #other },
    { id = 306; parentId = ?3; slug = "transport/pricepy"; labelUk = "Причепи"; labelEn = "Trailers"; legacyCategory = #other },
    { id = 307; parentId = ?3; slug = "transport/avtobusy"; labelUk = "Автобуси"; labelEn = "Buses"; legacyCategory = #other },
    { id = 308; parentId = ?3; slug = "transport/drugoy-transport"; labelUk = "Інший транспорт"; labelEn = "Other vehicles"; legacyCategory = #other },
    { id = 4; parentId = null; slug = "zapchasti"; labelUk = "Запчастини"; labelEn = "Auto parts"; legacyCategory = #other },
    { id = 401; parentId = ?4; slug = "zapchasti/shiny-diski-kolesa"; labelUk = "Шини, диски та колеса"; labelEn = "Tires & wheels"; legacyCategory = #other },
    { id = 402; parentId = ?4; slug = "zapchasti/zapchasti-legkovye"; labelUk = "Запчастини для легкових"; labelEn = "Car parts"; legacyCategory = #other },
    { id = 403; parentId = ?4; slug = "zapchasti/zapchasti-gruzovye"; labelUk = "Запчастини для вантажівок"; labelEn = "Truck parts"; legacyCategory = #other },
    { id = 404; parentId = ?4; slug = "zapchasti/mototehnika-zapchasti"; labelUk = "Мотозапчастини"; labelEn = "Moto parts"; legacyCategory = #other },
    { id = 405; parentId = ?4; slug = "zapchasti/aksessuary"; labelUk = "Аксесуари"; labelEn = "Accessories"; legacyCategory = #other },
    { id = 406; parentId = ?4; slug = "zapchasti/masla-zhidkosti"; labelUk = "Масла та рідини"; labelEn = "Oils & fluids"; legacyCategory = #other },
    { id = 407; parentId = ?4; slug = "zapchasti/audio-video"; labelUk = "Аудіо / відео"; labelEn = "Car audio"; legacyCategory = #other },
    { id = 408; parentId = ?4; slug = "zapchasti/tyuning"; labelUk = "Тюнінг"; labelEn = "Tuning"; legacyCategory = #other },
    { id = 5; parentId = null; slug = "elektronika"; labelUk = "Електроніка"; labelEn = "Electronics"; legacyCategory = #electronics },
    { id = 501; parentId = ?5; slug = "elektronika/telefony"; labelUk = "Телефони"; labelEn = "Phones"; legacyCategory = #electronics },
    { id = 502; parentId = ?5; slug = "elektronika/noutbuki"; labelUk = "Ноутбуки"; labelEn = "Laptops"; legacyCategory = #electronics },
    { id = 503; parentId = ?5; slug = "elektronika/kompyutery"; labelUk = "Комп'ютери"; labelEn = "Computers"; legacyCategory = #electronics },
    { id = 504; parentId = ?5; slug = "elektronika/planshety"; labelUk = "Планшети"; labelEn = "Tablets"; legacyCategory = #electronics },
    { id = 505; parentId = ?5; slug = "elektronika/tv-audio"; labelUk = "ТВ та аудіо"; labelEn = "TV & audio"; legacyCategory = #electronics },
    { id = 506; parentId = ?5; slug = "elektronika/foto-video"; labelUk = "Фото та відео"; labelEn = "Photo & video"; legacyCategory = #electronics },
    { id = 507; parentId = ?5; slug = "elektronika/igry-pristavki"; labelUk = "Ігри та приставки"; labelEn = "Gaming"; legacyCategory = #electronics },
    { id = 508; parentId = ?5; slug = "elektronika/bytovaya-tehnika"; labelUk = "Побутова техніка"; labelEn = "Appliances"; legacyCategory = #electronics },
    { id = 509; parentId = ?5; slug = "elektronika/tsifrovye-tovary"; labelUk = "Цифрові товари"; labelEn = "Digital goods"; legacyCategory = #electronics },
    { id = 6; parentId = null; slug = "dom-i-sad"; labelUk = "Дім і сад"; labelEn = "Home & garden"; legacyCategory = #other },
    { id = 601; parentId = ?6; slug = "dom-i-sad/mebel"; labelUk = "Меблі"; labelEn = "Furniture"; legacyCategory = #other },
    { id = 602; parentId = ?6; slug = "dom-i-sad/tekstil-dekor"; labelUk = "Текстиль і декор"; labelEn = "Textile & decor"; legacyCategory = #other },
    { id = 603; parentId = ?6; slug = "dom-i-sad/kuhnya"; labelUk = "Кухня"; labelEn = "Kitchen"; legacyCategory = #other },
    { id = 604; parentId = ?6; slug = "dom-i-sad/sad-ogorod"; labelUk = "Сад і город"; labelEn = "Garden"; legacyCategory = #other },
    { id = 605; parentId = ?6; slug = "dom-i-sad/instrumenty"; labelUk = "Інструменти"; labelEn = "Tools"; legacyCategory = #other },
    { id = 606; parentId = ?6; slug = "dom-i-sad/osveshchenie"; labelUk = "Освітлення"; labelEn = "Lighting"; legacyCategory = #other },
    { id = 607; parentId = ?6; slug = "dom-i-sad/remont-stroitelstvo"; labelUk = "Ремонт і будівництво"; labelEn = "Construction"; legacyCategory = #other },
    { id = 608; parentId = ?6; slug = "dom-i-sad/prochee-dom"; labelUk = "Інше для дому"; labelEn = "Other home"; legacyCategory = #other },
    { id = 7; parentId = null; slug = "moda-i-stil"; labelUk = "Мода і стиль"; labelEn = "Fashion"; legacyCategory = #clothing },
    { id = 701; parentId = ?7; slug = "moda-i-stil/zhenskaya-odezhda"; labelUk = "Жіночий одяг"; labelEn = "Women"; legacyCategory = #clothing },
    { id = 702; parentId = ?7; slug = "moda-i-stil/muzhskaya-odezhda"; labelUk = "Чоловічий одяг"; labelEn = "Men"; legacyCategory = #clothing },
    { id = 703; parentId = ?7; slug = "moda-i-stil/obuv"; labelUk = "Взуття"; labelEn = "Shoes"; legacyCategory = #clothing },
    { id = 704; parentId = ?7; slug = "moda-i-stil/aksessuary-moda"; labelUk = "Аксесуари"; labelEn = "Accessories"; legacyCategory = #clothing },
    { id = 705; parentId = ?7; slug = "moda-i-stil/krasota-zdorove"; labelUk = "Краса та здоров'я"; labelEn = "Beauty"; legacyCategory = #clothing },
    { id = 706; parentId = ?7; slug = "moda-i-stil/chasy-ukrasheniya"; labelUk = "Годинники та прикраси"; labelEn = "Watches & jewelry"; legacyCategory = #clothing },
    { id = 707; parentId = ?7; slug = "moda-i-stil/sumki"; labelUk = "Сумки"; labelEn = "Bags"; legacyCategory = #clothing },
    { id = 708; parentId = ?7; slug = "moda-i-stil/drugoe-moda"; labelUk = "Інше"; labelEn = "Other fashion"; legacyCategory = #clothing },
    { id = 8; parentId = null; slug = "hobbi-otdyh-i-sport"; labelUk = "Хобі, відпочинок і спорт"; labelEn = "Hobby & sport"; legacyCategory = #other },
    { id = 801; parentId = ?8; slug = "hobbi-otdyh-i-sport/sport-inventar"; labelUk = "Спортивний інвентар"; labelEn = "Sports gear"; legacyCategory = #other },
    { id = 802; parentId = ?8; slug = "hobbi-otdyh-i-sport/velosipedy"; labelUk = "Велосипеди"; labelEn = "Bicycles"; legacyCategory = #other },
    { id = 803; parentId = ?8; slug = "hobbi-otdyh-i-sport/turyzm"; labelUk = "Туризм"; labelEn = "Tourism"; legacyCategory = #other },
    { id = 804; parentId = ?8; slug = "hobbi-otdyh-i-sport/muzyka"; labelUk = "Музика"; labelEn = "Music"; legacyCategory = #other },
    { id = 805; parentId = ?8; slug = "hobbi-otdyh-i-sport/kollektsionirovanie"; labelUk = "Колекціонування"; labelEn = "Collectibles"; legacyCategory = #other },
    { id = 806; parentId = ?8; slug = "hobbi-otdyh-i-sport/ohota-rybalka"; labelUk = "Полювання та рибалка"; labelEn = "Hunting & fishing"; legacyCategory = #other },
    { id = 807; parentId = ?8; slug = "hobbi-otdyh-i-sport/knigi-zhurnaly"; labelUk = "Книги та журнали"; labelEn = "Books & magazines"; legacyCategory = #other },
    { id = 808; parentId = ?8; slug = "hobbi-otdyh-i-sport/drugoe-hobbi"; labelUk = "Інше"; labelEn = "Other hobby"; legacyCategory = #other },
    { id = 9; parentId = null; slug = "zhivotnye"; labelUk = "Тварини"; labelEn = "Animals"; legacyCategory = #other },
    { id = 901; parentId = ?9; slug = "zhivotnye/sobaki"; labelUk = "Собаки"; labelEn = "Dogs"; legacyCategory = #other },
    { id = 902; parentId = ?9; slug = "zhivotnye/koshki"; labelUk = "Коти"; labelEn = "Cats"; legacyCategory = #other },
    { id = 903; parentId = ?9; slug = "zhivotnye/ptitsy"; labelUk = "Птахи"; labelEn = "Birds"; legacyCategory = #other },
    { id = 904; parentId = ?9; slug = "zhivotnye/akvarium"; labelUk = "Акваріум"; labelEn = "Aquarium"; legacyCategory = #other },
    { id = 905; parentId = ?9; slug = "zhivotnye/gryzuny"; labelUk = "Гризуни"; labelEn = "Rodents"; legacyCategory = #other },
    { id = 906; parentId = ?9; slug = "zhivotnye/selskohozyaystvennye"; labelUk = "Сільгосп тварини"; labelEn = "Farm animals"; legacyCategory = #other },
    { id = 907; parentId = ?9; slug = "zhivotnye/tovary-dlya-zhivotnyh"; labelUk = "Товари для тварин"; labelEn = "Pet supplies"; legacyCategory = #other },
    { id = 908; parentId = ?9; slug = "zhivotnye/drugie-zhivotnye"; labelUk = "Інші тварини"; labelEn = "Other animals"; legacyCategory = #other },
    { id = 10; parentId = null; slug = "rabota"; labelUk = "Робота"; labelEn = "Jobs"; legacyCategory = #services },
    { id = 1001; parentId = ?10; slug = "rabota/vakansii"; labelUk = "Вакансії"; labelEn = "Vacancies"; legacyCategory = #services },
    { id = 1002; parentId = ?10; slug = "rabota/rezume"; labelUk = "Резюме"; labelEn = "CVs"; legacyCategory = #services },
    { id = 1003; parentId = ?10; slug = "rabota/podrabotka"; labelUk = "Підробіток"; labelEn = "Part-time"; legacyCategory = #services },
    { id = 1004; parentId = ?10; slug = "rabota/stazhirovka"; labelUk = "Стажування"; labelEn = "Internships"; legacyCategory = #services },
    { id = 1005; parentId = ?10; slug = "rabota/udalennaya-rabota"; labelUk = "Віддалена робота"; labelEn = "Remote"; legacyCategory = #services },
    { id = 1006; parentId = ?10; slug = "rabota/sezonnye"; labelUk = "Сезонні"; labelEn = "Seasonal"; legacyCategory = #services },
    { id = 11; parentId = null; slug = "biznes-uslugi"; labelUk = "Бізнес та послуги"; labelEn = "Business & services"; legacyCategory = #services },
    { id = 1101; parentId = ?11; slug = "biznes-uslugi/oborudovanie"; labelUk = "Обладнання"; labelEn = "Equipment"; legacyCategory = #services },
    { id = 1102; parentId = ?11; slug = "biznes-uslugi/gotoviy-biznes"; labelUk = "Готовий бізнес"; labelEn = "Ready business"; legacyCategory = #services },
    { id = 1103; parentId = ?11; slug = "biznes-uslugi/uslugi-remont"; labelUk = "Послуги та ремонт"; labelEn = "Services"; legacyCategory = #services },
    { id = 1104; parentId = ?11; slug = "biznes-uslugi/ofis"; labelUk = "Офіс"; labelEn = "Office"; legacyCategory = #services },
    { id = 1105; parentId = ?11; slug = "biznes-uslugi/proizvodstvo"; labelUk = "Виробництво"; labelEn = "Production"; legacyCategory = #services },
    { id = 1106; parentId = ?11; slug = "biznes-uslugi/torgovlya"; labelUk = "Торгівля"; labelEn = "Retail"; legacyCategory = #services },
    { id = 12; parentId = null; slug = "arenda-prokat"; labelUk = "Оренда та прокат"; labelEn = "Rent & lease"; legacyCategory = #services },
    { id = 1201; parentId = ?12; slug = "arenda-prokat/arenda-avto"; labelUk = "Оренда авто"; labelEn = "Car rent"; legacyCategory = #services },
    { id = 1202; parentId = ?12; slug = "arenda-prokat/arenda-instrumentov"; labelUk = "Оренда інструментів"; labelEn = "Tool rent"; legacyCategory = #services },
    { id = 1203; parentId = ?12; slug = "arenda-prokat/arenda-odezhdy"; labelUk = "Оренда одягу"; labelEn = "Clothing rent"; legacyCategory = #services },
    { id = 1204; parentId = ?12; slug = "arenda-prokat/prokat-razvlecheniy"; labelUk = "Прокат розваг"; labelEn = "Entertainment rent"; legacyCategory = #services },
    { id = 1205; parentId = ?12; slug = "arenda-prokat/arenda-tehniki"; labelUk = "Оренда техніки"; labelEn = "Equipment rent"; legacyCategory = #services },
    { id = 13; parentId = null; slug = "zhytlo-podobovo"; labelUk = "Житло подобово"; labelEn = "Daily rentals"; legacyCategory = #other },
    { id = 1301; parentId = ?13; slug = "zhytlo-podobovo/kvartiry-posutochno"; labelUk = "Квартири подобово"; labelEn = "Daily apartments"; legacyCategory = #other },
    { id = 1302; parentId = ?13; slug = "zhytlo-podobovo/doma-posutochno"; labelUk = "Будинки подобово"; labelEn = "Daily houses"; legacyCategory = #other },
    { id = 1303; parentId = ?13; slug = "zhytlo-podobovo/komnaty-posutochno"; labelUk = "Кімнати подобово"; labelEn = "Daily rooms"; legacyCategory = #other },
    { id = 1304; parentId = ?13; slug = "zhytlo-podobovo/hostely"; labelUk = "Хостели"; labelEn = "Hostels"; legacyCategory = #other },
    { id = 14; parentId = null; slug = "obmen"; labelUk = "Обмін"; labelEn = "Exchange / barter"; legacyCategory = #other },
    { id = 1401; parentId = ?14; slug = "obmen/obmen-tovarov"; labelUk = "Обмін товарів"; labelEn = "Goods exchange"; legacyCategory = #other },
    { id = 1402; parentId = ?14; slug = "obmen/obmen-uslug"; labelUk = "Обмін послуг"; labelEn = "Services exchange"; legacyCategory = #other },
    { id = 15; parentId = null; slug = "otdam-besplatno"; labelUk = "Віддам безкоштовно"; labelEn = "Free items"; legacyCategory = #other },
    { id = 1501; parentId = ?15; slug = "otdam-besplatno/otdam-darom"; labelUk = "Віддам даремно"; labelEn = "Give away"; legacyCategory = #other },
    { id = 1502; parentId = ?15; slug = "otdam-besplatno/na-razborku"; labelUk = "На розбірку"; labelEn = "For parts"; legacyCategory = #other },
  ];

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
