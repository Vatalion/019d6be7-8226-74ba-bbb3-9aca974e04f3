/// CategoryCatalog — OLX taxonomy tests

import { suite; test; expect } "mo:test";
import CategoryCatalog "../src/backend/lib/CategoryCatalog";

suite("CategoryCatalog", func() {
  test("has at least 15 L1 and 80 L2 nodes", func() {
    let all = CategoryCatalog.all();
    expect.nat(all.size()).greater(90);

    var l1Count : Nat = 0;
    var l2Count : Nat = 0;
    for (n in all.vals()) {
      switch (n.parentId) {
        case null { l1Count += 1 };
        case (?_) { l2Count += 1 };
      };
    };
    expect.nat(l1Count).equal(15);
    expect.nat(l2Count).greater(80);
  });

  test("descendants includes self and children", func() {
    let d = CategoryCatalog.descendants(5);
    expect.bool(CategoryCatalog.containsId(d, 5)).equal(true);
    expect.bool(CategoryCatalog.containsId(d, 501)).equal(true);
    expect.bool(CategoryCatalog.containsId(d, 1)).equal(false);
  });

  test("getBySlug resolves elektronika/telefony", func() {
    switch (CategoryCatalog.getBySlug("elektronika/telefony")) {
      case (?n) {
        expect.nat(n.id).equal(501);
        expect.text(n.labelUk).equal("Телефони");
      };
      case null { assert false };
    };
  });

  test("legacyCategoryToId maps electronics to L1 elektronika", func() {
    expect.nat(CategoryCatalog.legacyCategoryToId(#electronics)).equal(5);
  });
});
