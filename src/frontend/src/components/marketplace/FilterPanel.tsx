import type { TradeToken } from "@/backend.d";
import { ItemCondition, ListingCategory, ShippingCarrier } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useLocale } from "../../hooks/useLocale";

export interface FilterState {
  categories: ListingCategory[];
  conditions: ItemCondition[];
  carriers: ShippingCarrier[];
  priceMin: string;
  priceMax: string;
  token: TradeToken | null;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  activeCount: number;
}

/**
 * setOne: replaces multi-select with single-select.
 * If the item is already selected, clears (deselect → []).
 * FilterState arrays still hold at most 1 item (length 0 or 1).
 */
function setOne<T>(arr: T[], item: T): T[] {
  return arr.length === 1 && arr[0] === item ? [] : [item];
}

function FilterSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

interface RadioOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  ocid: string;
}

function RadioOption({ id, label, checked, onChange, ocid }: RadioOptionProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        data-ocid={ocid}
        className="h-3.5 w-3.5 accent-primary cursor-pointer shrink-0"
      />
      <Label
        htmlFor={id}
        className="text-sm text-foreground cursor-pointer font-normal"
      >
        {label}
      </Label>
    </div>
  );
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount,
}: FilterPanelProps) {
  const { t } = useLocale();

  const CATEGORIES: { value: ListingCategory; label: string }[] = [
    { value: ListingCategory.electronics, label: t("category.electronics") },
    { value: ListingCategory.clothing, label: t("category.clothing") },
    { value: ListingCategory.books, label: t("category.books") },
    { value: ListingCategory.digital, label: t("category.digital") },
    { value: ListingCategory.services, label: t("category.services") },
    { value: ListingCategory.other, label: t("category.other") },
  ];

  const CONDITIONS: { value: ItemCondition; label: string }[] = [
    { value: ItemCondition.new_, label: t("condition.new") },
    { value: ItemCondition.likeNew, label: t("condition.likeNew") },
    { value: ItemCondition.good, label: t("condition.good") },
    { value: ItemCondition.fair, label: t("condition.fair") },
    { value: ItemCondition.poor, label: t("condition.poor") },
  ];

  const CARRIERS: { value: ShippingCarrier; label: string }[] = [
    { value: ShippingCarrier.self_pickup, label: t("carrier.self_pickup") },
  ];

  // 4 approved tokens only (UI-scoped; backend enum has more)
  const TOKENS: { value: TradeToken; key: string }[] = [
    { value: "USDT_TRC20" as TradeToken, key: "filter.token.USDT_TRC20" },
    { value: "USDT_BEP20" as TradeToken, key: "filter.token.USDT_BEP20" },
    { value: "USDT_ERC20" as TradeToken, key: "filter.token.USDT_ERC20" },
    { value: "USDC_ERC20" as TradeToken, key: "filter.token.USDC_ERC20" },
  ];

  const updateCategories = (cat: ListingCategory) =>
    onChange({ ...filters, categories: setOne(filters.categories, cat) });

  const updateConditions = (cond: ItemCondition) =>
    onChange({ ...filters, conditions: setOne(filters.conditions, cond) });

  const updateCarriers = (carrier: ShippingCarrier) =>
    onChange({ ...filters, carriers: setOne(filters.carriers, carrier) });

  const updateToken = (tok: TradeToken | null) =>
    onChange({ ...filters, token: tok });

  // Price range validation:
  // When both fields are non-empty, validate min <= max.
  // If invalid, show an error and block calling onChange with the bad range.
  // We intentionally do NOT auto-swap values — the user must fix it manually.
  const isPriceRangeInvalid =
    filters.priceMin !== "" &&
    filters.priceMax !== "" &&
    Number(filters.priceMin) > Number(filters.priceMax);

  const handlePriceMinChange = (val: string) => {
    onChange({ ...filters, priceMin: val });
  };

  const handlePriceMaxChange = (val: string) => {
    onChange({ ...filters, priceMax: val });
  };

  return (
    <aside
      className="w-full bg-card border border-border rounded-lg p-4 space-y-5"
      data-ocid="filter-panel"
      aria-label={t("filter.listings")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {t("filter.title")}
          </span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            data-ocid="filter-reset"
          >
            <RotateCcw className="h-3 w-3" />
            {t("filter.reset")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Category — single-select radio */}
      <FilterSection title={t("filter.category")}>
        <div className="space-y-2" data-ocid="filter-category">
          <RadioOption
            id="cat-any"
            label={t("filter.any")}
            checked={filters.categories.length === 0}
            onChange={() => onChange({ ...filters, categories: [] })}
            ocid="filter-category-any"
          />
          {CATEGORIES.map(({ value, label }) => (
            <RadioOption
              key={value}
              id={`cat-${value}`}
              label={label}
              checked={filters.categories[0] === value}
              onChange={() => updateCategories(value)}
              ocid={`filter-category-${value}`}
            />
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Price range with validation */}
      <FilterSection title={t("filter.priceRange")}>
        <div className="space-y-2">
          <div className="flex items-center gap-2" data-ocid="filter-price">
            <Input
              type="number"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => handlePriceMinChange(e.target.value)}
              className={`h-8 text-sm bg-background ${isPriceRangeInvalid ? "border-destructive" : "border-input"}`}
              min={0}
              data-ocid="filter-price-min"
              aria-label={t("filter.price.min")}
            />
            <span className="text-muted-foreground text-sm shrink-0">—</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => handlePriceMaxChange(e.target.value)}
              className={`h-8 text-sm bg-background ${isPriceRangeInvalid ? "border-destructive" : "border-input"}`}
              min={0}
              data-ocid="filter-price-max"
              aria-label={t("filter.price.max")}
            />
          </div>
          {isPriceRangeInvalid && (
            <p
              className="text-xs text-destructive"
              role="alert"
              data-ocid="filter-price-error"
            >
              {t("filter.price.errorRange")}
            </p>
          )}
        </div>
      </FilterSection>

      <Separator />

      {/* Condition — single-select radio */}
      <FilterSection title={t("filter.condition")}>
        <div className="space-y-2" data-ocid="filter-condition">
          <RadioOption
            id="cond-any"
            label={t("filter.any")}
            checked={filters.conditions.length === 0}
            onChange={() => onChange({ ...filters, conditions: [] })}
            ocid="filter-condition-any"
          />
          {CONDITIONS.map(({ value, label }) => (
            <RadioOption
              key={value}
              id={`cond-${value}`}
              label={label}
              checked={filters.conditions[0] === value}
              onChange={() => updateConditions(value)}
              ocid={`filter-condition-${value}`}
            />
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Carrier — single-select radio */}
      <FilterSection title={t("filter.shipping")}>
        <div className="space-y-2" data-ocid="filter-shipping">
          <RadioOption
            id="ship-any"
            label={t("filter.any")}
            checked={filters.carriers.length === 0}
            onChange={() => onChange({ ...filters, carriers: [] })}
            ocid="filter-shipping-any"
          />
          {CARRIERS.map(({ value, label }) => (
            <RadioOption
              key={value}
              id={`ship-${value}`}
              label={label}
              checked={filters.carriers[0] === value}
              onChange={() => updateCarriers(value)}
              ocid={`filter-shipping-${value}`}
            />
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Token — single-select radio (frontend-only, 4 approved tokens) */}
      <FilterSection title={t("filter.token.title")}>
        <div className="space-y-2" data-ocid="filter-token">
          <RadioOption
            id="token-any"
            label={t("filter.token.any")}
            checked={filters.token === null}
            onChange={() => updateToken(null)}
            ocid="filter-token-any"
          />
          {TOKENS.map(({ value, key }) => (
            <RadioOption
              key={value}
              id={`token-${value}`}
              label={t(key as Parameters<typeof t>[0])}
              checked={filters.token === value}
              onChange={() =>
                updateToken(filters.token === value ? null : value)
              }
              ocid={`filter-token-${value}`}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}
