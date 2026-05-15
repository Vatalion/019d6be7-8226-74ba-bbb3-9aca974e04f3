import { createActor } from "@/backend";
import type { ShippingCarrier, ShippingOption } from "@/backend.d";

// Backend now returns costNat (kopiykas = UAH × 100) alongside deprecated cost (always 0.0).
// Augment locally until backend.d.ts is regenerated from the updated Candid interface.
type ShippingOptionWithCost = ShippingOption & { costNat?: bigint };

/** Returns the cost in UAH from a ShippingOption, preferring costNat over the deprecated Float. */
function getOptionCostUAH(option: ShippingOptionWithCost): number {
  if (option.costNat !== undefined) return Number(option.costNat) / 100;
  return option.cost; // legacy fallback
}
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type Locale, detectLocale, t } from "../../i18n";
import {
  PHYSICAL_DELIVERY_LOCKED_TO_PICKUP,
  PICKUP_ONLY_SHIPPING_OPTION,
} from "../../lib/deliveryPolicy";

// ─── Carrier metadata ────────────────────────────────────────────────────────

interface CarrierMeta {
  id: ShippingCarrier;
  nameKey: string;
  color: string;
  bgClass: string;
  borderActiveClass: string;
  logo: string; // emoji fallback
  /** Badge shown on the card header */
  badge?: { label: string; cls: string };
}

const CARRIER_META: Record<string, CarrierMeta> = {
  nova_poshta: {
    id: "nova_poshta" as ShippingCarrier,
    nameKey: "carrier.nova_poshta",
    color: "#e8372c",
    bgClass: "bg-red-500/8",
    borderActiveClass: "border-red-500/60 ring-red-500/20",
    logo: "🟥",
    badge: {
      label: "Recommended",
      cls: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30",
    },
  },
  ukrposhta: {
    id: "ukrposhta" as ShippingCarrier,
    nameKey: "carrier.ukrposhta",
    color: "#0057a8",
    bgClass: "bg-blue-500/8",
    borderActiveClass: "border-blue-500/60 ring-blue-500/20",
    logo: "🟦",
    badge: {
      label: "Beta",
      cls: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border",
    },
  },
  meest: {
    id: "meest" as ShippingCarrier,
    nameKey: "carrier.meest",
    color: "#f5a623",
    bgClass: "bg-amber-500/8",
    borderActiveClass: "border-amber-500/60 ring-amber-500/20",
    logo: "🟧",
    badge: {
      label: "Beta",
      cls: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border",
    },
  },
  self_pickup: {
    id: "self_pickup" as ShippingCarrier,
    nameKey: "carrier.self_pickup",
    color: "#16a34a",
    bgClass: "bg-green-500/8",
    borderActiveClass: "border-green-500/60 ring-green-500/20",
    logo: "📦",
  },
};

const CARRIER_ORDER: ShippingCarrier[] = [
  "nova_poshta" as ShippingCarrier,
  "ukrposhta" as ShippingCarrier,
  "meest" as ShippingCarrier,
  "self_pickup" as ShippingCarrier,
];

// Demo/mock prices when API key not configured
const DEMO_OPTIONS: ShippingOptionWithCost[] = [
  {
    carrier: "nova_poshta" as ShippingCarrier,
    cost: 0,
    costNat: BigInt(8500), // 85.00 UAH
    deliveryDays: BigInt(1),
    available: true,
  },
  {
    carrier: "ukrposhta" as ShippingCarrier,
    cost: 0,
    costNat: BigInt(5500), // 55.00 UAH
    deliveryDays: BigInt(3),
    available: true,
  },
  {
    carrier: "meest" as ShippingCarrier,
    cost: 0,
    costNat: BigInt(7000), // 70.00 UAH
    deliveryDays: BigInt(2),
    available: true,
  },
];

const NO_CARRIER_OPTION: ShippingOptionWithCost = {
  carrier: "self_pickup" as ShippingCarrier,
  cost: 0,
  costNat: BigInt(0),
  deliveryDays: BigInt(0),
  available: true,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ShippingProviderSelectorProps {
  weight?: number;
  fromCity?: string;
  toCity?: string;
  selectedCarrier?: ShippingCarrier | null;
  onSelect?: (carrier: ShippingCarrier, option: ShippingOptionWithCost) => void;
  /** If true, show compact inline form to enter weight/from/to */
  showInputForm?: boolean;
  locale?: Locale;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CarrierSkeleton() {
  return (
    <div className="carrier-card animate-pulse">
      <Skeleton className="h-5 w-28 mb-1" />
      <Skeleton className="h-4 w-16 mb-3" />
      <div className="carrier-metric">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="carrier-metric">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-8 w-full mt-2 rounded-md" />
    </div>
  );
}

// ─── Single carrier card ──────────────────────────────────────────────────────

function CarrierCard({
  option,
  meta,
  isSelected,
  isCheapest,
  isFastest,
  onSelect,
  locale,
}: {
  option: ShippingOptionWithCost;
  meta: CarrierMeta;
  isSelected: boolean;
  isCheapest: boolean;
  isFastest: boolean;
  onSelect: () => void;
  locale: Locale;
}) {
  const days = Number(option.deliveryDays);
  const dayLabel =
    days === 1
      ? t(locale, "shipping.compare.day")
      : t(locale, "shipping.compare.days");

  return (
    <div
      className={[
        "carrier-card transition-smooth relative",
        isSelected
          ? `ring-2 ${meta.borderActiveClass} ${meta.bgClass} border-transparent`
          : option.available
            ? "hover:border-accent/40 hover:shadow-md"
            : "opacity-60",
      ].join(" ")}
      data-ocid={`carrier-card-${meta.id}`}
    >
      {/* Badges row */}
      <div className="flex items-center gap-1.5 min-h-[20px]">
        {meta.badge && (
          <span className={meta.badge.cls}>{meta.badge.label}</span>
        )}
        {isCheapest && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">
            <Package className="w-2.5 h-2.5" />
            {t(locale, "shipping.compare.cheapest")}
          </span>
        )}
        {isFastest && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
            <Zap className="w-2.5 h-2.5" />
            {t(locale, "shipping.compare.fastest")}
          </span>
        )}
        {isSelected && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-500 border border-green-500/25">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {t(locale, "shipping.compare.selected")}
          </span>
        )}
      </div>

      {/* Carrier name */}
      <div className="flex items-center gap-2 mt-1">
        <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="font-semibold text-sm text-foreground">
          {t(locale, meta.nameKey as Parameters<typeof t>[1])}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-1.5 mt-3">
        <div className="carrier-metric">
          <span className="text-muted-foreground text-xs">
            {t(locale, "shipping.compare.cost")}
          </span>
          <span className="font-bold text-foreground tabular-nums">
            {getOptionCostUAH(option).toFixed(2)} ₴
          </span>
        </div>
        <div className="carrier-metric">
          <span className="text-muted-foreground text-xs">
            {t(locale, "shipping.compare.delivery")}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Clock className="w-3 h-3 text-muted-foreground" />
            {days} {dayLabel}
          </span>
        </div>
      </div>

      {/* Select button */}
      <Button
        size="sm"
        variant={isSelected ? "default" : "outline"}
        className={[
          "w-full mt-3 text-xs",
          isSelected ? "bg-accent text-accent-foreground hover:opacity-90" : "",
        ].join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          if (option.available) onSelect();
        }}
        disabled={!option.available}
        data-ocid={`carrier-select-${meta.id}`}
      >
        {isSelected
          ? t(locale, "shipping.compare.selected")
          : t(locale, "shipping.compare.selectBtn")}
      </Button>

      {!option.available && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          {t(locale, "shipping.compare.noApiKey")}
        </p>
      )}
    </div>
  );
}

function PickupOnlyShippingProviderSelector({
  selectedCarrier,
  onSelect,
  locale,
}: Pick<ShippingProviderSelectorProps, "selectedCarrier" | "onSelect"> & {
  locale: Locale;
}) {
  const isSelected = selectedCarrier === PICKUP_ONLY_SHIPPING_OPTION.carrier;

  return (
    <div className="space-y-4" data-ocid="shipping-provider-selector">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t(locale, "shipping.pickupOnly.title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t(locale, "shipping.pickupOnly.subtitle")}
        </p>
      </div>

      <div
        className={[
          "rounded-lg border bg-card p-4 transition-smooth",
          isSelected
            ? "border-green-500/60 ring-2 ring-green-500/20"
            : "border-border hover:border-accent/40",
        ].join(" ")}
        data-ocid="carrier-card-self_pickup"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-700 dark:text-green-300">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t(locale, "carrier.self_pickup")}
              </p>
              {isSelected && (
                <span className="inline-flex items-center gap-1 rounded border border-green-500/25 bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-300">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {t(locale, "shipping.compare.selected")}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {t(locale, "shipping.pickupOnly.description")}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          className={[
            "mt-4 w-full text-xs",
            isSelected
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "",
          ].join(" ")}
          onClick={() =>
            onSelect?.(
              PICKUP_ONLY_SHIPPING_OPTION.carrier,
              PICKUP_ONLY_SHIPPING_OPTION,
            )
          }
          data-ocid="carrier-select-self_pickup"
        >
          {isSelected
            ? t(locale, "shipping.compare.selected")
            : t(locale, "shipping.pickupOnly.select")}
        </Button>
      </div>

      <p
        className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-snug text-muted-foreground"
        data-ocid="shipping-carriers-disabled-note"
      >
        {t(locale, "shipping.pickupOnly.lockedNotice")}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShippingProviderSelector(props: ShippingProviderSelectorProps) {
  const locale = props.locale ?? detectLocale();

  if (PHYSICAL_DELIVERY_LOCKED_TO_PICKUP) {
    return <PickupOnlyShippingProviderSelector {...props} locale={locale} />;
  }

  return <CarrierShippingProviderSelector {...props} locale={locale} />;
}

function CarrierShippingProviderSelector({
  weight: weightProp,
  fromCity: fromProp,
  toCity: toProp,
  selectedCarrier,
  onSelect,
  showInputForm = false,
  locale: localeProp,
}: ShippingProviderSelectorProps) {
  const locale = localeProp ?? detectLocale();

  const { actor, isFetching } = useActor(createActor);

  // Input form state (when showInputForm is true)
  const [weight, setWeight] = useState(weightProp?.toString() ?? "1");
  const [fromCity, setFromCity] = useState(fromProp ?? "");
  const [toCity, setToCity] = useState(toProp ?? "");

  const [options, setOptions] = useState<ShippingOptionWithCost[]>([]);
  const [usedDemo, setUsedDemo] = useState(false);

  const fetchMutation = useMutation({
    mutationFn: async (params: {
      w: number;
      from: string;
      to: string;
    }) => {
      if (!actor) return DEMO_OPTIONS;
      const res = await actor.getShippingOptions(
        params.w,
        params.from,
        params.to,
      );
      if (res.__kind__ === "err") {
        // Backend may return error when API keys not set — fall back to demo
        return DEMO_OPTIONS;
      }
      // If all options unavailable, supplement with demo prices
      const hasAvailable = res.ok.some((o) => o.available);
      if (!hasAvailable) return DEMO_OPTIONS;
      return res.ok;
    },
    onSuccess: (data) => {
      const isDemo = data === DEMO_OPTIONS;
      setUsedDemo(isDemo);
      // Ensure all 3 carriers appear, fill missing with demo
      const map = new Map(data.map((o) => [o.carrier as string, o]));
      const filled = CARRIER_ORDER.map(
        (c) =>
          map.get(c as string) ??
          DEMO_OPTIONS.find((d) => d.carrier === c) ??
          (c === "self_pickup" ? NO_CARRIER_OPTION : NO_CARRIER_OPTION),
      );
      setOptions(filled);
    },
  });

  // Auto-fetch when props are provided and actor ready
  const mutate = fetchMutation.mutate;
  useEffect(() => {
    if (
      !isFetching &&
      actor &&
      !showInputForm &&
      weightProp &&
      fromProp &&
      toProp
    ) {
      mutate({ w: weightProp, from: fromProp, to: toProp });
    }
  }, [actor, isFetching, weightProp, fromProp, toProp, showInputForm, mutate]);

  // If showInputForm and no auto-props, load demo on mount for preview
  const isPending = fetchMutation.isPending;
  useEffect(() => {
    if (showInputForm && options.length === 0 && !isPending) {
      const filled = CARRIER_ORDER.map(
        (c) =>
          DEMO_OPTIONS.find((d) => d.carrier === c) ??
          (c === "self_pickup" ? NO_CARRIER_OPTION : NO_CARRIER_OPTION),
      );
      setOptions(filled);
      setUsedDemo(true);
    }
  }, [showInputForm, options.length, isPending]);

  const handleCalculate = () => {
    const w = Number.parseFloat(weight);
    if (!fromCity.trim() || !toCity.trim() || Number.isNaN(w) || w <= 0) return;
    fetchMutation.mutate({ w, from: fromCity.trim(), to: toCity.trim() });
  };

  // Derived: cheapest & fastest among available options
  const { cheapestId, fastestId } = useMemo(() => {
    const avail = options.filter((o) => o.available);
    if (avail.length === 0) return { cheapestId: null, fastestId: null };
    const cheapest = avail.reduce((a, b) =>
      getOptionCostUAH(a) <= getOptionCostUAH(b) ? a : b,
    );
    const fastest = avail.reduce((a, b) =>
      Number(a.deliveryDays) <= Number(b.deliveryDays) ? a : b,
    );
    return {
      cheapestId: cheapest.carrier as string,
      fastestId: fastest.carrier as string,
    };
  }, [options]);

  const isLoading = fetchMutation.isPending || isFetching;

  return (
    <div className="space-y-4" data-ocid="shipping-provider-selector">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t(locale, "shipping.compare.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(locale, "shipping.compare.subtitle")}
          </p>
        </div>
        {usedDemo && !isLoading && (
          <span className="text-[10px] text-muted-foreground bg-muted/60 border border-border px-2 py-1 rounded">
            {t(locale, "shipping.compare.demoPrice")}
          </span>
        )}
      </div>

      {/* Optional input form */}
      {showInputForm && (
        <div
          className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/20 border border-border"
          data-ocid="shipping-selector-form"
        >
          <div className="space-y-1">
            <label
              htmlFor="sps-from"
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              {t(locale, "shipping.compare.from")}
            </label>
            <input
              id="sps-from"
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder="Kyiv / Київ"
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              data-ocid="shipping-from-input"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="sps-to"
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              {t(locale, "shipping.compare.to")}
            </label>
            <input
              id="sps-to"
              type="text"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              placeholder="Lviv / Львів"
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              data-ocid="shipping-to-input"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="sps-weight"
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              {t(locale, "shipping.compare.weight")}
            </label>
            <input
              id="sps-weight"
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="1.5"
              className="w-full text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              data-ocid="shipping-weight-input"
            />
          </div>
          <div className="col-span-3">
            <Button
              size="sm"
              className="w-full gap-2 text-xs button-primary"
              onClick={handleCalculate}
              disabled={isLoading}
              data-ocid="shipping-calculate-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t(locale, "shipping.compare.calculating")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  {t(locale, "shipping.compare.calculate")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Loading hint */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>
            {t(locale, "shipping.compare.loading")}{" "}
            <span className="opacity-70">
              ({t(locale, "shipping.compare.loadingHint")})
            </span>
          </span>
        </div>
      )}

      {/* Error */}
      {fetchMutation.isError && (
        <div
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/25 text-xs text-destructive"
          data-ocid="shipping-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {t(locale, "shipping.compare.error")}
          </div>
          <button
            type="button"
            onClick={() =>
              fetchMutation.mutate({
                w: Number.parseFloat(weight) || 1,
                from: fromCity || "Kyiv",
                to: toCity || "Lviv",
              })
            }
            className="underline underline-offset-2 hover:opacity-80 font-medium"
          >
            {t(locale, "shipping.compare.retry")}
          </button>
        </div>
      )}

      {/* Carrier cards grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        data-ocid="carrier-cards-grid"
      >
        {isLoading
          ? CARRIER_ORDER.map((c) => <CarrierSkeleton key={c as string} />)
          : options.length === 0
            ? CARRIER_ORDER.map((c) => <CarrierSkeleton key={c as string} />)
            : options.map((option) => {
                const meta = CARRIER_META[option.carrier as string] ?? {
                  id: option.carrier,
                  nameKey: String(option.carrier),
                  color: "#888",
                  bgClass: "bg-muted/20",
                  borderActiveClass: "border-accent/50 ring-accent/20",
                  logo: "📦",
                };
                return (
                  <CarrierCard
                    key={option.carrier as string}
                    option={option}
                    meta={meta}
                    isSelected={selectedCarrier === option.carrier}
                    isCheapest={cheapestId === (option.carrier as string)}
                    isFastest={fastestId === (option.carrier as string)}
                    onSelect={() => onSelect?.(option.carrier, option)}
                    locale={locale}
                  />
                );
              })}
      </div>

      {/* Selection hint */}
      {options.length > 0 && !selectedCarrier && !isLoading && (
        <p
          className="text-xs text-center text-muted-foreground"
          data-ocid="carrier-hint"
        >
          {t(locale, "shipping.compare.selectCarrier")}
        </p>
      )}
    </div>
  );
}
