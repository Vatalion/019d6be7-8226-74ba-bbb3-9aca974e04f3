import type { ListingCard } from "@/backend.d";
import type { Principal } from "@dfinity/principal";

export type SavedSearch = {
  id: bigint;
  name: string;
  paramsJson: string;
  createdAt: bigint;
  alertsEnabled: boolean;
};

export type ListingInquiryMessage = {
  id: bigint;
  inquiryId: bigint;
  sender: Principal;
  content: string;
  createdAt: bigint;
};

type Result<T> = { __kind__: "ok"; ok: T } | { __kind__: "err"; err: unknown };

export type EngagementActor = {
  addFavorite?: (listingId: bigint) => Promise<Result<null>>;
  removeFavorite?: (listingId: bigint) => Promise<Result<null>>;
  isListingFavorite?: (listingId: bigint) => Promise<boolean>;
  getFavoriteListings?: () => Promise<ListingCard[]>;
  saveSearch?: (
    name: string,
    paramsJson: string,
  ) => Promise<Result<SavedSearch>>;
  deleteSavedSearch?: (id: bigint) => Promise<Result<null>>;
  getSavedSearches?: () => Promise<SavedSearch[]>;
  setSavedSearchAlerts?: (
    id: bigint,
    enabled: boolean,
  ) => Promise<Result<null>>;
  sendListingInquiry?: (
    listingId: bigint,
    content: string,
  ) => Promise<Result<ListingInquiryMessage>>;
  sendListingInquiryReply?: (
    listingId: bigint,
    buyerPrincipal: Principal,
    content: string,
  ) => Promise<Result<ListingInquiryMessage>>;
  getListingInquiryMessages?: (
    listingId: bigint,
    buyerPrincipal: Principal,
  ) => Promise<Result<ListingInquiryMessage[]>>;
  bumpListing?: (id: bigint) => Promise<Result<null>>;
};

export function asEngagementActor(actor: unknown): EngagementActor {
  return actor as EngagementActor;
}

export function isResultErr(r: unknown): boolean {
  if (r == null || typeof r !== "object") return false;
  const record = r as { __kind__?: string; err?: unknown };
  return (
    record.__kind__ === "err" ||
    (record.__kind__ === undefined && "err" in record)
  );
}
