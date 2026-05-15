import type { ShippingCarrier } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Package, RefreshCw, Truck } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ShippingTrackerProps {
  carrier: ShippingCarrier;
  trackingNumber: string;
  /** Trade ID required to call getUnifiedTrackingInfo */
  tradeId: bigint;
}

// Canonical unified statuses returned from carrier APIs
type UnifiedStatus =
  | "delivered"
  | "out_for_delivery"
  | "arrived_at_branch"
  | "in_transit"
  | "returned"
  | "exception"
  | "created";

interface TrackingState {
  raw: string;
  unified: UnifiedStatus;
  carrier: string;
  estimatedDelivery?: string;
  isDelivered: boolean;
  lastUpdated: Date;
}

/** Map raw carrier status text to a canonical unified status. */
function mapToUnifiedStatus(raw: string): UnifiedStatus {
  const lower = raw.toLowerCase();
  if (lower.includes("delivered") || lower.includes("вручено"))
    return "delivered";
  if (lower.includes("out_for_delivery") || lower.includes("кур'єр"))
    return "out_for_delivery";
  if (
    lower.includes("arrived") ||
    lower.includes("на відділенні") ||
    lower.includes("прибув")
  )
    return "arrived_at_branch";
  if (
    lower.includes("transit") ||
    lower.includes("транзит") ||
    lower.includes("в дорозі") ||
    lower.includes("пересилається")
  )
    return "in_transit";
  if (lower.includes("return") || lower.includes("повернення"))
    return "returned";
  if (lower.includes("exception") || lower.includes("помилка"))
    return "exception";
  return "created";
}

const CARRIER_LABELS: Record<ShippingCarrier, string> = {
  nova_poshta: "Nova Poshta",
  ukrposhta: "Ukrposhta",
  meest: "Meest Express",
  self_pickup: "Self Pickup",
  digital: "Digital Delivery",
};

// Timeline steps in order
const TIMELINE_STEPS: UnifiedStatus[] = [
  "created",
  "in_transit",
  "arrived_at_branch",
  "out_for_delivery",
  "delivered",
];

export function ShippingTracker({
  carrier,
  trackingNumber,
  tradeId,
}: ShippingTrackerProps) {
  const { t } = useLocale();
  const { actor, isFetching: actorFetching } = useBackend();
  const qc = useQueryClient();

  // Keep previous status ref for change detection
  const prevUnifiedRef = useRef<UnifiedStatus | null>(null);

  const {
    data: tracking,
    isFetching,
    isLoading,
    refetch,
  } = useQuery<TrackingState | null>({
    queryKey: ["trackingInfo", tradeId.toString()],
    queryFn: async (): Promise<TrackingState | null> => {
      if (!actor) return null;
      const res = await actor.getUnifiedTrackingInfo(tradeId);
      if (res.__kind__ === "ok") {
        const info = res.ok;
        const unified = mapToUnifiedStatus(info.status);
        return {
          raw: info.status,
          unified,
          carrier: info.carrier,
          estimatedDelivery: info.estimatedDelivery ?? undefined,
          isDelivered: info.isDelivered,
          lastUpdated: new Date(),
        };
      }
      throw new Error("tracking_error");
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // Detect status changes and fire toasts
  useEffect(() => {
    if (!tracking) return;
    const prev = prevUnifiedRef.current;
    if (prev !== null && prev !== tracking.unified) {
      if (tracking.isDelivered || tracking.unified === "delivered") {
        toast.success(t("notification.shipping_delivered"));
        // Invalidate trade so TradeDetailPage can show the confirm button
        qc.invalidateQueries({ queryKey: ["trade"] });
      } else {
        toast.info(t("notification.shipping_in_transit"));
      }
    }
    prevUnifiedRef.current = tracking.unified;
  }, [tracking, t, qc]);

  const currentStepIdx = tracking
    ? TIMELINE_STEPS.indexOf(tracking.unified)
    : -1;

  // User locale for date formatting
  const userLocale =
    typeof navigator !== "undefined" ? navigator.language : undefined;

  const showSkeleton = isLoading;
  const showRefreshing = isFetching && !isLoading;

  return (
    <div
      className="card-elevated p-4 space-y-4"
      data-ocid="tracking-status-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {t("shipping.trackingTitle")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showRefreshing && (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
          )}
          <Badge variant="secondary" className="text-xs font-mono">
            {trackingNumber}
          </Badge>
        </div>
      </div>

      {/* Carrier */}
      <div className="flex items-center gap-3" data-ocid="tracking-carrier">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Package className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {t("shipping.carrierLabel")}
          </p>
          <p className="text-sm font-medium text-foreground">
            {CARRIER_LABELS[carrier] ?? carrier}
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {showSkeleton ? (
        <div className="space-y-2" data-ocid="tracking-loading-state">
          <p className="text-xs text-muted-foreground">
            {t("shipping.tracking.loading")}
          </p>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : tracking ? (
        <>
          {/* Visual timeline */}
          <div
            className="flex items-center gap-1 py-2"
            data-ocid="tracking-timeline"
          >
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div
                    className={[
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-chart-1 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={[
                        "flex-1 h-0.5 mx-0.5 transition-colors",
                        isDone && idx < currentStepIdx
                          ? "bg-chart-1"
                          : "bg-muted",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Status card */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {tracking.unified === "delivered" ? (
                <CheckCircle2 className="w-4 h-4 text-chart-1" />
              ) : (
                <Truck className="w-4 h-4 text-accent" />
              )}
              {tracking.unified === "delivered" && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/30"
                  data-ocid="tracking-delivered-badge"
                >
                  ✓ {tracking.unified.replace(/_/g, " ")}
                </Badge>
              )}
              {tracking.unified !== "delivered" && (
                <span className="text-sm font-semibold text-foreground capitalize">
                  {tracking.unified.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {tracking.raw}
            </p>
            {tracking.estimatedDelivery && (
              <p className="text-xs text-muted-foreground">
                Est. delivery: {tracking.estimatedDelivery}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {t("shipping.lastUpdated")}{" "}
              {tracking.lastUpdated.toLocaleString(userLocale)}
            </p>
          </div>
        </>
      ) : (
        <div
          className="text-center py-4 text-sm text-muted-foreground"
          data-ocid="tracking-empty-state"
        >
          {t("shipping.tracking.empty")}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => refetch()}
        disabled={isFetching || !actor}
        data-ocid="shipping-refresh-btn"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
        />
        {isFetching ? t("shipping.refreshing") : t("shipping.refreshButton")}
      </Button>
    </div>
  );
}
