import type { ListingCard, ListingCategory, TradeToken } from "@/backend.d";
import { ItemCondition, type ShippingCarrier } from "@/backend.d";

/** Candid opt nat */
type OptNat = [] | [bigint];

export type RawCategoryNode = {
  id: bigint;
  parentId: [] | [bigint];
  slug: string;
  labelUk: string;
  labelEn: string;
  legacyCategory: { [k: string]: null };
};

export type MarketplaceActorV2 = {
  listCategories?: () => Promise<RawCategoryNode[]>;
  searchListings: (
    query: string | null,
    category: ListingCategory | null,
    categoryId: OptNat,
    priceMin: bigint | null,
    priceMax: bigint | null,
    location: string | null,
    condition: ItemCondition | null,
    shippingCarrier: ShippingCarrier | null,
    offset: bigint,
    limit: bigint,
    priceToken: TradeToken | null,
  ) => Promise<ListingCard[]>;
  createListing: (
    title: string,
    description: string,
    category: ListingCategory,
    categoryId: OptNat,
    priceAmount: bigint,
    priceToken: TradeToken,
    condition: ItemCondition,
    photos: string[],
    location: string,
    shippingMethods: unknown[],
    isDigital: boolean,
    digitalFileUrl: string | null,
    digitalFileHash: string | null,
    digitalPassword: string | null,
    packageDetails: unknown | null,
    novaPoshtaConfig: unknown | null,
    ukrposhtaConfig: unknown | null,
    meestConfig: unknown | null,
  ) => Promise<unknown>;
  updateListing: (
    id: bigint,
    title: string,
    description: string,
    category: ListingCategory,
    categoryId: OptNat,
    priceAmount: bigint,
    priceToken: TradeToken,
    condition: ItemCondition,
    photos: string[],
    location: string,
    shippingMethods: unknown[],
    digitalFileUrl: string | null,
    digitalFileHash: string | null,
    digitalPassword: string | null,
    packageDetails: unknown | null,
    novaPoshtaConfig: unknown | null,
    ukrposhtaConfig: unknown | null,
    meestConfig: unknown | null,
  ) => Promise<unknown>;
};

export function asMarketplaceActor(actor: unknown): MarketplaceActorV2 {
  return actor as MarketplaceActorV2;
}

export function optNat(id: number | null | undefined): OptNat {
  if (id == null || id <= 0) return [];
  return [BigInt(id)];
}

export async function fetchCategories(
  actor: unknown,
): Promise<RawCategoryNode[] | null> {
  const a = asMarketplaceActor(actor);
  if (!a.listCategories) return null;
  try {
    return await a.listCategories();
  } catch {
    return null;
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
  const a = asMarketplaceActor(actor);
  return a.searchListings(
    args.query,
    args.category,
    optNat(args.categoryId),
    args.priceMin,
    args.priceMax,
    args.location,
    args.condition,
    args.shippingCarrier,
    args.offset,
    args.limit,
    args.priceToken,
  );
}
