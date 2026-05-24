import {
  ItemCondition,
  type ListingCategory,
  type ShippingCarrier,
  type TradeToken,
} from "@/backend.d";
import type { FilterState } from "@/components/marketplace/FilterPanel";
import { getCategoryById, getCategoryBySlug } from "@/data/olxCategories";

export type SortKey = "newest" | "price-asc" | "price-desc";

export type ListingsSearch = {
  q?: string;
  sort?: SortKey;
  /** OLX category slug (e.g. elektronika or elektronika/telefony) */
  cat?: string;
  /** @deprecated legacy enum filter */
  category?: string;
  condition?: string;
  shipping?: string;
  priceMin?: string;
  priceMax?: string;
  token?: string;
};

const APPROVED_TOKENS = new Set<string>([
  "USDT_TRC20",
  "USDT_BEP20",
  "USDT_ERC20",
  "USDC_ERC20",
]);

export const EMPTY_FILTERS: FilterState = {
  categoryId: null,
  conditions: [],
  carriers: [],
  priceMin: "",
  priceMax: "",
  token: null,
};

export function filtersToListingsSearch(
  filters: FilterState,
  sort: SortKey,
  query: string,
): ListingsSearch {
  const search: ListingsSearch = {};
  const q = query.trim();
  if (q) search.q = q;
  if (sort !== "newest") search.sort = sort;
  if (filters.categoryId != null) {
    const node = getCategoryById(filters.categoryId);
    if (node) search.cat = node.slug;
  }
  if (filters.conditions.length > 0)
    search.condition = filters.conditions.join(",");
  if (filters.carriers.length > 0) search.shipping = filters.carriers.join(",");
  if (filters.priceMin) search.priceMin = filters.priceMin;
  if (filters.priceMax) search.priceMax = filters.priceMax;
  if (filters.token !== null) search.token = String(filters.token);
  return search;
}

export function listingsSearchFromUrl(sp: URLSearchParams): {
  filters: FilterState;
  sort: SortKey;
  query: string;
} {
  const sortRaw = sp.get("sort");
  const sort: SortKey =
    sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "newest";

  const catSlug = sp.get("cat");
  let categoryId: number | null = null;
  if (catSlug) {
    const node = getCategoryBySlug(catSlug);
    if (node) categoryId = node.id;
  }

  const conditionsRaw = sp.get("condition");
  const allConditions = Object.values(ItemCondition);
  const conditions = conditionsRaw
    ? (conditionsRaw
        .split(",")
        .filter((v) =>
          allConditions.includes(v as ItemCondition),
        ) as ItemCondition[])
    : [];

  const shippingRaw = sp.get("shipping");
  const carriers = shippingRaw
    ? (shippingRaw.split(",").filter(Boolean) as ShippingCarrier[])
    : [];

  const tokenRaw = sp.get("token");
  const token =
    tokenRaw && APPROVED_TOKENS.has(tokenRaw) ? (tokenRaw as TradeToken) : null;

  return {
    filters: {
      categoryId,
      conditions,
      carriers,
      priceMin: sp.get("priceMin") ?? "",
      priceMax: sp.get("priceMax") ?? "",
      token,
    },
    sort,
    query: sp.get("q") ?? "",
  };
}

export function listingsSearchFromRoute(search: ListingsSearch): {
  filters: FilterState;
  sort: SortKey;
  query: string;
} {
  const sp = new URLSearchParams();
  if (search.q) sp.set("q", search.q);
  if (search.sort) sp.set("sort", search.sort);
  if (search.cat) sp.set("cat", search.cat);
  if (search.condition) sp.set("condition", search.condition);
  if (search.shipping) sp.set("shipping", search.shipping);
  if (search.priceMin) sp.set("priceMin", search.priceMin);
  if (search.priceMax) sp.set("priceMax", search.priceMax);
  if (search.token) sp.set("token", search.token);
  return listingsSearchFromUrl(sp);
}

export function validateListingsSearch(
  search: Record<string, unknown>,
): ListingsSearch {
  const out: ListingsSearch = {};
  if (typeof search.q === "string" && search.q.trim()) out.q = search.q.trim();
  if (search.sort === "price-asc" || search.sort === "price-desc")
    out.sort = search.sort;
  if (typeof search.cat === "string" && search.cat) out.cat = search.cat;
  if (typeof search.condition === "string" && search.condition)
    out.condition = search.condition;
  if (typeof search.shipping === "string" && search.shipping)
    out.shipping = search.shipping;
  if (typeof search.priceMin === "string" && search.priceMin)
    out.priceMin = search.priceMin;
  if (typeof search.priceMax === "string" && search.priceMax)
    out.priceMax = search.priceMax;
  if (typeof search.token === "string" && APPROVED_TOKENS.has(search.token))
    out.token = search.token;
  return out;
}

export function filtersEqual(a: FilterState, b: FilterState): boolean {
  return (
    a.categoryId === b.categoryId &&
    a.conditions.join() === b.conditions.join() &&
    a.carriers.join() === b.carriers.join() &&
    a.priceMin === b.priceMin &&
    a.priceMax === b.priceMax &&
    a.token === b.token
  );
}
