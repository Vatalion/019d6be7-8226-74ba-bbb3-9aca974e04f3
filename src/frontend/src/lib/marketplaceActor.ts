import type { Backend } from "@/backend";
import type { ListingCategory, TradeToken } from "@/backend.d";
import type { ItemCondition, ShippingCarrier } from "@/backend.d";
import type { ListingCard } from "@/types";

export type RawCategoryNode = {
  id: bigint;
  parentId: [] | [bigint];
  slug: string;
  labelUk: string;
  labelEn: string;
  legacyCategory: ListingCategory;
};

export type RawCategoryAttributeField = {
  key: string;
  labelEn: string;
  labelUk: string;
  fieldType: "text" | "number";
  required: boolean;
};

/** For generated Backend listing/search APIs (categoryId: bigint | null). */
export function categoryIdArg(id: number | null | undefined): bigint | null {
  if (id == null || id <= 0) return null;
  return BigInt(id);
}

function asBackend(actor: unknown): Backend {
  return actor as Backend;
}

function normalizeParentId(
  parentId: bigint | [] | [bigint] | undefined,
): [] | [bigint] {
  if (parentId == null) return [];
  if (Array.isArray(parentId)) return parentId.length ? parentId : [];
  return [parentId];
}

export async function fetchCategories(
  actor: unknown,
): Promise<RawCategoryNode[] | null> {
  const backend = asBackend(actor);
  const raw = backend as Backend & {
    listCategories?: () => Promise<
      Array<{
        id: bigint;
        parentId?: bigint | [] | [bigint];
        slug: string;
        labelUk: string;
        labelEn: string;
        legacyCategory: ListingCategory;
      }>
    >;
  };
  if (!raw.listCategories) return null;
  try {
    const rows = await raw.listCategories();
    return rows.map(
      (node): RawCategoryNode => ({
        id: node.id,
        parentId: normalizeParentId(node.parentId),
        slug: node.slug,
        labelUk: node.labelUk,
        labelEn: node.labelEn,
        legacyCategory: node.legacyCategory,
      }),
    );
  } catch {
    return null;
  }
}

function normalizeFieldType(fieldType: unknown): "text" | "number" {
  if (fieldType && typeof fieldType === "object" && "number" in fieldType) {
    return "number";
  }
  return "text";
}

export async function fetchCategoryAttributeSchema(
  actor: unknown,
  categoryId: number,
): Promise<RawCategoryAttributeField[]> {
  const backend = asBackend(actor);
  const raw = backend as Backend & {
    getCategoryAttributeSchema?: (id: bigint) => Promise<
      Array<{
        key: string;
        labelEn: string;
        labelUk: string;
        fieldType: { text: null } | { number: null };
        required: boolean;
      }>
    >;
  };
  if (!raw.getCategoryAttributeSchema) return [];
  try {
    const rows = await raw.getCategoryAttributeSchema(BigInt(categoryId));
    return rows.map((row) => ({
      key: row.key,
      labelEn: row.labelEn,
      labelUk: row.labelUk,
      fieldType: normalizeFieldType(row.fieldType),
      required: row.required,
    }));
  } catch {
    return [];
  }
}

export async function searchListingsWithCategory(
  actor: unknown,
  args: {
    query: string | null;
    category: ListingCategory | null;
    categoryId: number | null;
    priceMin: bigint | null;
    priceMax: bigint | null;
    location: string | null;
    condition: ItemCondition | null;
    shippingCarrier: ShippingCarrier | null;
    offset: bigint;
    limit: bigint;
    priceToken: TradeToken | null;
  },
): Promise<ListingCard[]> {
  const rows = await asBackend(actor).searchListings(
    args.query,
    args.category,
    categoryIdArg(args.categoryId),
    args.priceMin,
    args.priceMax,
    args.location,
    args.condition,
    args.shippingCarrier,
    args.offset,
    args.limit,
    args.priceToken,
  );
  return rows as ListingCard[];
}
