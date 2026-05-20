import { createActor } from "@/backend";
import type { ListingCard } from "@/backend.d";
import { type TradeToken, TrustLevel } from "@/backend.d";
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
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  MapPin,
  PackageSearch,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { searchListingsWithCategory } from "@/lib/marketplaceActor";
import { SavedSearchesPanel } from "@/components/marketplace/SavedSearchesPanel";
import { categoryLabel, getCategoryById } from "@/data/olxCategories";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "../hooks/useLocale";
import {
  EMPTY_FILTERS,
  type SortKey,
  filtersEqual,
  filtersToListingsSearch,
  listingsSearchFromRoute,
} from "../lib/listingsSearch";

const PAGE_SIZE = 12;
const listingsRouteApi = getRouteApi("/listings");

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
        {(listing as ListingCard & { isPromoted?: boolean }).isPromoted && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded">
            VIP
          </span>
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

  if (filters.categoryId != null) {
    const catNode = getCategoryById(filters.categoryId);
  const loc = (typeof window !== "undefined" && document.documentElement.lang === "uk") ? "uk" : "en";
    chips.push({
      key: "category",
      label: `${t("filter.category")}: ${catNode ? categoryLabel(catNode, loc as "uk" | "en") : filters.categoryId}`,
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
  const routeSearch = listingsRouteApi.useSearch();
  const { actor, isFetching } = useActor(createActor);
  const { t } = useLocale();

  const initial = listingsSearchFromRoute(routeSearch);

  const [query, setQuery] = useState(initial.query);
  const [committedQuery, setCommittedQuery] = useState(initial.query);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [offset, setOffset] = useState(0);
  const [allResults, setAllResults] = useState<ListingCard[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Sync filters → URL (replace, not push) ──────────────────────────────
  const syncToUrl = useCallback(
    (nextFilters: FilterState, nextSort: SortKey, nextQuery: string) => {
      void navigate({
        to: "/listings",
        search: filtersToListingsSearch(nextFilters, nextSort, nextQuery),
        replace: true,
      });
    },
    [navigate],
  );

  // Browser back/forward: re-hydrate local state from route search params
  useEffect(() => {
    const parsed = listingsSearchFromRoute(routeSearch);
    if (
      filtersEqual(parsed.filters, filters) &&
      parsed.sort === sort &&
      parsed.query === committedQuery
    ) {
      return;
    }
    setFilters(parsed.filters);
    setSort(parsed.sort);
    setQuery(parsed.query);
    setCommittedQuery(parsed.query);
    setOffset(0);
    setAllResults([]);
  }, [routeSearch, filters, sort, committedQuery]);

  const activeCount = useMemo(
    () =>
      (filters.categoryId != null ? 1 : 0) +
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
    filters.categoryId,
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
      let results: ListingCard[];
      try {
        results = await searchListingsWithCategory(actor, {
          query: committedQuery || null,
          category: null,
          categoryId: filters.categoryId,
          priceMin: filters.priceMin
            ? BigInt(Math.floor(Number.parseFloat(filters.priceMin) * 1_000_000))
            : null,
          priceMax: filters.priceMax
            ? BigInt(Math.floor(Number.parseFloat(filters.priceMax) * 1_000_000))
            : null,
          location: null,
          condition: filters.conditions.length === 1 ? filters.conditions[0] : null,
          shippingCarrier: filters.carriers.length === 1 ? filters.carriers[0] : null,
          offset: BigInt(offset),
          limit: BigInt(PAGE_SIZE),
          priceToken: filters.token,
        });
      } catch {
        results = [];
      }

      if (offset === 0) {
        setAllResults(results);
      } else {
        setAllResults((prev) => [...prev, ...results]);
      }
      return results;
    },
    enabled: !!actor && !isFetching && !isPriceRangeInvalid,
  });

  const sorted = useMemo(() => sortListings(allResults, sort), [allResults, sort]);
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
    void navigate({ to: "/listings", search: {}, replace: true });
  }, [navigate]);

  const handleLoadMore = () => setOffset((prev) => prev + PAGE_SIZE);

  // ── Chip removal handlers ────────────────────────────────────────────────
  const removeCategory = useCallback(
    () => handleFilterChange({ ...filters, categoryId: null }),
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
          <SavedSearchesPanel
            filters={filters}
            sort={sort}
            query={committedQuery}
            onApply={(paramsJson) => {
              try {
                const search = JSON.parse(paramsJson) as ReturnType<
                  typeof filtersToListingsSearch
                >;
                navigate({ to: "/listings", search });
              } catch {
                /* ignore invalid saved payload */
              }
            }}
          />
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
