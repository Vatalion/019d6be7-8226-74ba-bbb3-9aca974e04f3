import type { TradeStatus } from "../../backend.d";
import { detectLocale, t } from "../../i18n";
import { cn } from "../../lib/utils";

interface TradeStatusBadgeProps {
  status: TradeStatus | string;
  size?: "sm" | "md";
  className?: string;
}

type StatusConfig = {
  labelKey: string;
  dotClass: string;
  badgeClass: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  awaiting_seller_handshake: {
    labelKey: "trade.status.awaiting_seller_handshake",
    dotClass: "bg-amber-500",
    badgeClass: "status-badge-pending",
  },
  payment_intent: {
    labelKey: "trade.status.payment_intent",
    dotClass: "bg-blue-500",
    badgeClass: "status-badge-funded",
  },
  manual_payment_pending: {
    labelKey: "trade.status.manual_payment_pending",
    dotClass: "bg-amber-500",
    badgeClass: "status-badge-pending",
  },
  payment_intent_expired: {
    labelKey: "trade.status.payment_intent_expired",
    dotClass: "bg-destructive",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-destructive/15 text-destructive",
  },
  cancelled_no_seller_response: {
    labelKey: "trade.status.cancelled_no_seller_response",
    dotClass: "bg-muted-foreground",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground",
  },
  pending: {
    labelKey: "trade.status.pending",
    dotClass: "bg-muted-foreground",
    badgeClass: "status-badge-pending",
  },
  funded: {
    labelKey: "trade.status.funded",
    dotClass: "bg-blue-500",
    badgeClass: "status-badge-funded",
  },
  buyer_confirmed: {
    labelKey: "trade.status.buyer_confirmed",
    dotClass: "bg-green-600",
    badgeClass: "status-badge-confirmed",
  },
  payment_verified: {
    labelKey: "trade.status.payment_verified",
    dotClass: "bg-green-600",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/25 text-green-700 dark:text-green-200",
  },
  complete: {
    labelKey: "trade.status.complete",
    dotClass: "bg-accent",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent/20 text-accent",
  },
  refunded: {
    labelKey: "trade.status.refunded",
    dotClass: "bg-yellow-600",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-700 dark:text-yellow-200",
  },
  disputed: {
    labelKey: "trade.status.disputed",
    dotClass: "bg-red-600",
    badgeClass: "status-badge-dispute",
  },
  cancelled: {
    labelKey: "trade.status.cancelled",
    dotClass: "bg-muted-foreground",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground line-through",
  },
  cancelled_buyer_pre_ship: {
    labelKey: "trade.status.cancelled_buyer_pre_ship",
    dotClass: "bg-muted-foreground",
    badgeClass:
      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground",
  },
};

export default function TradeStatusBadge({
  status,
  size = "md",
  className,
}: TradeStatusBadgeProps) {
  const locale = detectLocale();
  const statusKey = (
    typeof status === "string" ? status : String(status)
  ).toLowerCase();
  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={cn(
        config.badgeClass,
        size === "sm" && "!text-[10px] !px-1.5 !py-0.5",
        className,
      )}
      data-ocid="trade-status-badge"
    >
      <span
        className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dotClass)}
        aria-hidden
      />
      {t(locale, config.labelKey as Parameters<typeof t>[1])}
    </span>
  );
}
