import { createActor } from "@/backend";
import type { ListingCard } from "@/backend.d";
import {
  ItemCondition,
  type ListingCategory,
  type ShippingCarrier,
  type TradeToken,
  TrustLevel,
} from "@/backend.d";
import type { FilterState } from "@/components/marketplace/FilterPanel";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  MapPin,
  PackageSearch,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocale } from "../hooks/useLocale";

const PAGE_SIZE = 12;

type SortKey = "newest" | "price-asc" | "price-desc";

/** 4 approved token values for URL deserialization validation */
const APPROVED_TOKENS = new Set<string>([
  "USDT_TRC20",
  "USDT_BEP20",
  "USDT_ERC20",
  "USDC_ERC20",
]);

const EMPTY_FILTERS: FilterState = {
  categories: [],
  conditions: [],
  carriers: [],
  priceMin: "",
  priceMax: "",
  token: null,
};

const TOKEN_COLORS: Record<string, string> = {
  USDT_TRC20:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  USDT_BEP20:
    "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  USDT_ERC20:
    "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  USDC_ERC20:
    "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30",
};

const TOKEN_DISPLAY: Record<string, string> = {
  USDT_TRC20: "USDT · TRC20",
  USDT_BEP20: "USDT · BEP20",
  USDT_ERC20: "USDT · ERC20",
  USDC_ERC20: "USDC · ERC20",
};

const TRUST_CLASSES: Record<TrustLevel, string> = {
  [TrustLevel.new_]: "badge-tier-new",
  [TrustLevel.bronze]: "badge-tier-bronze",
  [TrustLevel.silver]: "badge-tier-silver",
  [TrustLevel.gold]: "badge-tier-gold",
};

function formatPrice(amount: bigint, _token: TradeToken): string {
  const n = Number(amount);
  return `$${(n / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── URL ↔ FilterState serialisation ─────────────────────────────────────────

function filtersToSearchParams(
  filters: FilterState,
  sort: SortKey,
  query: string,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (query) sp.set("q", query);
  if (sort !== "newest") sp.set("sort", sort);
  // Single-select: still comma-join for forward compatibility, but will only
  // ever produce 0 or 1 values from the radio-button UI.
  if (filters.categories.length > 0)
    sp.set("category", filters.categories.join(","));
  if (filters.conditions.length > 0)
    sp.set("condition", filters.conditions.join(","));
  if (filters.carriers.length > 0)
    sp.set("shipping", filters.carriers.join(","));
  if (filters.priceMin) sp.set("priceMin", filters.priceMin);
  if (filters.priceMax) sp.set("priceMax", filters.priceMax);
  // Token serialization: only set if not null
  if (filters.token !== null) sp.set("token", String(filters.token));
  return sp;
}

function searchParamsToFilters(sp: URLSearchParams): {
  filters: FilterState;
  sort: SortKey;
  query: string;
} {
  const categoriesRaw = sp.get("category") ?? "";
  const conditionsRaw = sp.get("condition") ?? "";
  const shippingRaw = sp.get("shipping") ?? "";

  // Only include valid enum values to avoid type errors
  const allConditions = Object.values(ItemCondition) as string[];

  const categories = categoriesRaw
    ? (categoriesRaw.split(",").filter(Boolean) as ListingCategory[])
    : [];

  const conditions = conditionsRaw
    ? (conditionsRaw
        .split(",")
        .filter((v) => allConditions.includes(v)) as ItemCondition[])
    : [];

  const carriers = shippingRaw
    ? (shippingRaw.split(",").filter(Boolean) as ShippingCarrier[])
    : [];

  const sortRaw = sp.get("sort") ?? "newest";
  const sort: SortKey =
    sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "newest";

  // Token: only accept the 4 approved values to avoid type pollution
  const tokenRaw = sp.get("token");
  const token: TradeToken | null =
    tokenRaw && APPROVED_TOKENS.has(tokenRaw) ? (tokenRaw as TradeToken) : null;

  return {
    filters: {
      categories,
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

// ── Components ────────────────────────────────────────────────────────────────

function ListingCardItem({
  listing,
  onClick,
}: { listing: ListingCard; onClick: () => void }) {
  const photo = listing.photos[0];
  return (
    <button
      type="button"
      className="card-elevated flex flex-col overflow-hidden cursor-pointer group w-full text-left"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={listing.title}
      data-ocid="listing-card"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <PackageSearch className="h-10 w-10 opacity-30" />
          </div>
        )}
        <span
          className={`absolute top-2 right-2 ${TRUST_CLASSES[listing.sellerTrustLevel]}`}
        >
          {listing.sellerTrustLevel}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight min-w-0">
          {listing.title}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-accent">
            {formatPrice(listing.priceAmount, listing.priceToken)}
          </span>
          <span
            className={`token-chip text-xs py-0.5 px-2 ${TOKEN_COLORS[listing.priceToken] ?? ""}`}
          >
            {TOKEN_DISPLAY[listing.priceToken] ?? String(listing.priceToken)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate min-w-0">{listing.location || "—"}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-muted">
                {listing.sellerUsername?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {listing.sellerUsername}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span>{Number(listing.sellerRating) / 10}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="card-elevated overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function sortListings(listings: ListingCard[], sort: SortKey): ListingCard[] {
  return [...listings].sort((a, b) => {
    if (sort === "newest") return Number(b.createdAt - a.createdAt);
    if (sort === "price-asc") return Number(a.priceAmount - b.priceAmount);
    if (sort === "price-desc") return Number(b.priceAmount - a.priceAmount);
    return 0;
  });
}

// ── Active filter chips ───────────────────────────────────────────────────────

interface ActiveChipsProps {
  filters: FilterState;
  onRemoveCategory: () => void;
  onRemoveCondition: () => void;
  onRemoveCarrier: () => void;
  onRemoveToken: () => void;
  onRemovePrice: () => void;
  onClearAll: () => void;
}

function ActiveFilterChips({
  filters,
  onRemoveCategory,
  onRemoveCondition,
  onRemoveCarrier,
  onRemoveToken,
  onRemovePrice,
  onClearAll,
}: ActiveChipsProps) {
  const { t } = useLocale();

  const chips: {
    key: string;
    label: string;
    onRemove: () => void;
    ocid: string;
  }[] = [];

  if (filters.categories[0]) {
    chips.push({
      key: "category",
      label: `${t("filter.category")}: ${filters.categories[0]}`,
      onRemove: onRemoveCategory,
      ocid: "chip-category",
    });
  }
  if (filters.conditions[0]) {
    chips.push({
      key: "condition",
      label: `${t("filter.condition")}: ${filters.conditions[0]}`,
      onRemove: onRemoveCondition,
      ocid: "chip-condition",
    });
  }
  if (filters.carriers[0]) {
    chips.push({
      key: "carrier",
      label: `${t("filter.shipping")}: ${filters.carriers[0]}`,
      onRemove: onRemoveCarrier,
      ocid: "chip-carrier",
    });
  }
  if (filters.token) {
    const tokenI18nKey = `filter.token.${filters.token}` as Parameters<
      typeof t
    >[0];
    chips.push({
      key: "token",
      label: `${t("filter.token.title")}: ${t(tokenI18nKey)}`,
      onRemove: onRemoveToken,
      ocid: "chip-token",
    });
  }
  if (filters.priceMin || filters.priceMax) {
    const priceLabel =
      filters.priceMin && filters.priceMax
        ? `$${filters.priceMin} — $${filters.priceMax}`
        : filters.priceMin
          ? `≥ $${filters.priceMin}`
          : `≤ $${filters.priceMax}`;
    chips.push({
      key: "price",
      label: priceLabel,
      onRemove: onRemovePrice,
      ocid: "chip-price",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-ocid="active-filter-chips"
      aria-label={t("filter.activeFilters")}
    >
      {chips.map(({ key, label, onRemove, ocid }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/25 rounded-full px-3 py-1 text-xs font-medium"
          data-ocid={ocid}
        >
          {label}
          <button
            type="button"
            onClick={onRemove}
            className="hover:text-foreground transition-colors rounded-full"
            aria-label={`Remove ${label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
        data-ocid="chip-clear-all"
      >
        {t("filter.chips.clearAll")}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const { t } = useLocale();

  // ── Initialise state from URL on first render ────────────────────────────
  // Parse URL synchronously so useState can use initial values directly.
  // This runs once during component initialisation (before first render).
  const {
    filters: initialFilters,
    sort: initialSort,
    query: initialQuery,
  } = searchParamsToFilters(new URLSearchParams(window.location.search));

  const [query, setQuery] = useState(initialQuery);
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [offset, setOffset] = useState(0);
  const [allResults, setAllResults] = useState<ListingCard[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Sync filters → URL (replace, not push) ──────────────────────────────
  const syncToUrl = useCallback(
    (nextFilters: FilterState, nextSort: SortKey, nextQuery: string) => {
      const sp = filtersToSearchParams(nextFilters, nextSort, nextQuery);
      const searchStr = sp.toString();
      void navigate({
        to: "/listings",
        search: searchStr ? `?${searchStr}` : "",
        replace: true,
      });
    },
    [navigate],
  );

  const activeCount = useMemo(
    () =>
      filters.categories.length +
      filters.conditions.length +
      filters.carriers.length +
      (filters.priceMin ? 1 : 0) +
      (filters.priceMax ? 1 : 0) +
      (filters.token !== null ? 1 : 0),
    [filters],
  );

  // Price range invalid check: block fetching if min > max
  const isPriceRangeInvalid =
    filters.priceMin !== "" &&
    filters.priceMax !== "" &&
    Number(filters.priceMin) > Number(filters.priceMax);

  const queryKey = [
    "listings",
    committedQuery,
    filters.categories[0] ?? null,
    filters.priceMin,
    filters.priceMax,
    filters.conditions[0] ?? null,
    filters.carriers[0] ?? null,
    filters.token, // token in queryKey for cache correctness
    offset,
  ];

  const { data, isLoading, isError } = useQuery<ListingCard[]>({
    queryKey,
    queryFn: async () => {
      if (!actor) return [];
      // Token filter is frontend-only — backend searchListings does not support
      // a token parameter (TASK-005 blocker: backend extension needed for
      // server-side token filtering). Client-side filtering is applied below.
      const results = await actor.searchListings(
        committedQuery || null,
        filters.categories.length === 1 ? filters.categories[0] : null,
        filters.priceMin
          ? BigInt(Math.floor(Number.parseFloat(filters.priceMin) * 1_000_000))
          : null,
        filters.priceMax
          ? BigInt(Math.floor(Number.parseFloat(filters.priceMax) * 1_000_000))
          : null,
        null,
        filters.conditions.length === 1 ? filters.conditions[0] : null,
        filters.carriers.length === 1 ? filters.carriers[0] : null,
        BigInt(offset),
        BigInt(PAGE_SIZE),
      );

      // Client-side token filter: priceToken is the field on ListingCard
      const filtered =
        filters.token !== null
          ? results.filter((l) => l.priceToken === filters.token)
          : results;

      if (offset === 0) {
        setAllResults(filtered);
      } else {
        setAllResults((prev) => [...prev, ...filtered]);
      }
      return filtered;
    },
    enabled: !!actor && !isFetching && !isPriceRangeInvalid,
  });

  const sorted = useMemo(
    () => sortListings(allResults, sort),
    [allResults, sort],
  );
  const hasMore = (data?.length ?? 0) === PAGE_SIZE;

  const handleSearch = useCallback(() => {
    setOffset(0);
    setAllResults([]);
    setCommittedQuery(query);
    syncToUrl(filters, sort, query);
  }, [query, filters, sort, syncToUrl]);

  const handleFilterChange = useCallback(
    (next: FilterState) => {
      setFilters(next);
      setOffset(0);
      setAllResults([]);
      syncToUrl(next, sort, committedQuery);
    },
    [sort, committedQuery, syncToUrl],
  );

  const handleSortChange = useCallback(
    (next: SortKey) => {
      setSort(next);
      syncToUrl(filters, next, committedQuery);
    },
    [filters, committedQuery, syncToUrl],
  );

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setOffset(0);
    setAllResults([]);
    setCommittedQuery("");
    setQuery("");
    void navigate({ to: "/listings", replace: true });
  }, [navigate]);

  const handleLoadMore = () => setOffset((prev) => prev + PAGE_SIZE);

  // ── Chip removal handlers ────────────────────────────────────────────────
  const removeCategory = useCallback(
    () => handleFilterChange({ ...filters, categories: [] }),
    [filters, handleFilterChange],
  );
  const removeCondition = useCallback(
    () => handleFilterChange({ ...filters, conditions: [] }),
    [filters, handleFilterChange],
  );
  const removeCarrier = useCallback(
    () => handleFilterChange({ ...filters, carriers: [] }),
    [filters, handleFilterChange],
  );
  const removeToken = useCallback(
    () => handleFilterChange({ ...filters, token: null }),
    [filters, handleFilterChange],
  );
  const removePrice = useCallback(
    () => handleFilterChange({ ...filters, priceMin: "", priceMax: "" }),
    [filters, handleFilterChange],
  );

  const filterPanel = (
    <FilterPanel
      filters={filters}
      onChange={handleFilterChange}
      onReset={handleReset}
      activeCount={activeCount}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => handleSortChange(v as SortKey)}
          >
            <SelectTrigger
              className="w-36 h-10 bg-card border-border text-sm shrink-0"
              data-ocid="sort-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
          {/* Mobile filter trigger */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-10 gap-1.5 border-border"
                data-ocid="mobile-filter-trigger"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeCount > 0 && (
                  <Badge variant="secondary" className="h-4 text-[10px] px-1">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-card border-border p-4 overflow-y-auto"
            >
              {filterPanel}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-[72px]">{filterPanel}</div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Result count */}
            <div className="flex items-center justify-between">
              <p
                className="text-sm text-muted-foreground"
                data-ocid="result-count"
              >
                {isLoading
                  ? t("listings.searching")
                  : `${sorted.length} ${sorted.length !== 1 ? t("listings.foundPlural") : t("listings.found")} ${t("listings.found.suffix")}`}
              </p>
            </div>

            {/* Active filter chips — shown above the grid, below result count */}
            <ActiveFilterChips
              filters={filters}
              onRemoveCategory={removeCategory}
              onRemoveCondition={removeCondition}
              onRemoveCarrier={removeCarrier}
              onRemoveToken={removeToken}
              onRemovePrice={removePrice}
              onClearAll={handleReset}
            />

            {/* Grid */}
            {isLoading && offset === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {["a", "b", "c", "d", "e", "f"].map((id) => (
                  <ListingCardSkeleton key={id} />
                ))}
              </div>
            ) : isError ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3 text-center"
                data-ocid="listings-error"
              >
                <PackageSearch className="h-12 w-12 text-muted-foreground opacity-40" />
                <p className="text-foreground font-medium">
                  {t("listings.loadFailed.short")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("listings.loadFailed.retry")}
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3 text-center"
                data-ocid="listings-empty"
              >
                <PackageSearch className="h-12 w-12 text-muted-foreground opacity-40" />
                <p className="text-foreground font-medium">
                  {t("listings.noFound")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("listings.noFoundSub")}
                </p>
                {activeCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {t("listings.clearFilters")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {sorted.map((listing) => (
                  <ListingCardItem
                    key={String(listing.id)}
                    listing={listing}
                    onClick={() => navigate({ to: `/listings/${listing.id}` })}
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && !isLoading && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="gap-2 border-border"
                  data-ocid="load-more"
                >
                  {t("listings.loadMore")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
