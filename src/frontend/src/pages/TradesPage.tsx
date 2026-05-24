import type { TradeStatus, TradeToken, TradeView } from "@/backend.d";
import { Variant_all_seller_buyer } from "@/backend.d";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackend } from "@/hooks/useBackend";
import { formatTokenAmountLabel } from "@/lib/tradeFeeQuote";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../hooks/useLocale";
import { detectLocale, t } from "../i18n";

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function formatAmount(amount: bigint, token: TradeToken): string {
  return formatTokenAmountLabel(amount, token);
}

function statusBadge(status: TradeStatus) {
  const locale = detectLocale();
  const map: Record<
    TradeStatus,
    { labelKey: Parameters<typeof t>[1]; cls: string }
  > = {
    awaiting_seller_handshake: {
      labelKey: "trade.status.awaiting_seller_handshake",
      cls: "status-badge-pending",
    },
    payment_intent: {
      labelKey: "trade.status.payment_intent",
      cls: "status-badge-funded",
    },
    manual_payment_pending: {
      labelKey: "trade.status.manual_payment_pending",
      cls: "status-badge-pending",
    },
    payment_intent_expired: {
      labelKey: "trade.status.payment_intent_expired",
      cls: "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-destructive/15 text-destructive",
    },
    cancelled_no_seller_response: {
      labelKey: "trade.status.cancelled_no_seller_response",
      cls: "status-badge-pending",
    },
    pending: { labelKey: "trade.status.pending", cls: "status-badge-pending" },
    funded: { labelKey: "trade.status.funded", cls: "status-badge-funded" },
    awaiting_approval: {
      labelKey: "trade.status.awaiting_approval",
      cls: "status-badge-pending",
    },
    buyer_confirmed: {
      labelKey: "trade.status.buyer_confirmed",
      cls: "status-badge-confirmed",
    },
    payment_verified: {
      labelKey: "trade.status.payment_verified",
      cls: "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/25 text-green-700 dark:text-green-200",
    },
    digital_delivered: {
      labelKey: "trade.status.digital_delivered",
      cls: "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/25 text-blue-700 dark:text-blue-200",
    },
    fulfillment_pending: {
      labelKey: "trade.status.fulfillment_pending",
      cls: "status-badge-pending",
    },
    shipped: {
      labelKey: "trade.status.shipped",
      cls: "status-badge-funded",
    },
    awaiting_receipt: {
      labelKey: "trade.status.awaiting_receipt",
      cls: "status-badge-confirmed",
    },
    complete: {
      labelKey: "trade.status.complete",
      cls: "status-badge-confirmed",
    },
    refunded: {
      labelKey: "trade.status.refunded",
      cls: "status-badge-pending",
    },
    disputed: {
      labelKey: "trade.status.disputed",
      cls: "status-badge-dispute",
    },
    dispute_l1: {
      labelKey: "trade.status.disputed",
      cls: "status-badge-dispute",
    },
    dispute_l2: {
      labelKey: "trade.status.disputed",
      cls: "status-badge-dispute",
    },
    cancelled: {
      labelKey: "trade.status.cancelled",
      cls: "status-badge-pending",
    },
    cancelled_buyer_pre_ship: {
      labelKey: "trade.status.cancelled_buyer_pre_ship",
      cls: "status-badge-pending",
    },
  };
  const { labelKey, cls } = map[status] ?? {
    labelKey: "trade.status.pending" as const,
    cls: "status-badge-pending",
  };
  return <span className={cls}>{t(locale, labelKey)}</span>;
}

function TradeRow({
  trade,
  myPrincipal,
  unreadCount = 0,
}: {
  trade: TradeView;
  myPrincipal: string;
  unreadCount?: number;
}) {
  const navigate = useNavigate();
  const counterparty =
    trade.buyer.toString() === myPrincipal ? trade.seller : trade.buyer;
  const ts = Number(trade.createdAt) / 1_000_000;

  return (
    <button
      data-ocid="trade-list-row"
      onClick={() =>
        navigate({
          to: "/trades/$id",
          params: { id: String(trade.id) },
        })
      }
      type="button"
      className="w-full flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors text-left"
    >
      {/* Listing thumbnail placeholder */}
      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
        <span className="text-2xl">📦</span>
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 gap-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate text-sm">
            Trade #{trade.id.toString()}
          </span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 shrink-0"
              data-ocid={`trade-unread-${trade.id}`}
            >
              {unreadCount}
            </Badge>
          )}
          {statusBadge(trade.status)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="w-4 h-4">
            <AvatarFallback className="text-[9px]">
              {counterparty.toString().slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-mono truncate">
            {truncatePrincipal(counterparty.toString())}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {formatDistanceToNow(new Date(ts), { addSuffix: true })}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="token-chip text-xs">
          {formatAmount(trade.amount, trade.token)}
        </div>
      </div>
    </button>
  );
}

function TradeListSkeleton() {
  const rows = ["a", "b", "c", "d", "e"];
  return (
    <div className="space-y-0">
      {rows.map((k) => (
        <div
          key={k}
          className="flex items-center gap-4 px-5 py-4 border-b border-border"
        >
          <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function TradesPage() {
  const { actor, isFetching } = useBackend();
  const { t: tl } = useLocale();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"buying" | "selling">("buying");

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => actor!.getMyProfile(),
    enabled: !!actor && !isFetching,
  });

  const {
    data: trades = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["myTrades"],
    queryFn: () => actor!.getMyTrades(Variant_all_seller_buyer.all),
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const { data: unreadCounts = [] } = useQuery({
    queryKey: ["unreadCount", "notifications"],
    queryFn: () => actor!.getUnreadCount(),
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const unreadByTrade = new Map(
    unreadCounts.map(([id, count]) => [id.toString(), Number(count)]),
  );

  const myPrincipal = myProfile?.id?.toString() ?? "";

  const buying = trades.filter((t) => t.buyer.toString() === myPrincipal);
  const selling = trades.filter((t) => t.seller.toString() === myPrincipal);

  return (
    <div className="min-h-screen bg-background" data-ocid="trades-page">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <h1 className="text-xl font-semibold text-foreground">
          {tl("trades.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {tl("trades.subtitle")}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "buying" | "selling")}
        >
          <TabsList className="mb-4 w-full" data-ocid="trades-tabs">
            <TabsTrigger
              value="buying"
              className="flex-1"
              data-ocid="tab-buying"
            >
              {tl("trades.tab.buying")}
              {buying.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {buying.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="selling"
              className="flex-1"
              data-ocid="tab-selling"
            >
              {tl("trades.tab.selling")}
              {selling.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selling.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="card-elevated overflow-hidden">
            {isError && (
              <div
                data-ocid="trades-load-error"
                className="flex flex-col items-center justify-center py-16 text-center px-4 gap-3"
              >
                <AlertTriangle className="h-10 w-10 text-destructive opacity-80" />
                <p className="text-sm text-foreground font-medium">
                  {tl("trades.loadError")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {tl("detail.retry")}
                </Button>
              </div>
            )}
            <TabsContent value="buying" className="mt-0">
              {isLoading ? (
                <TradeListSkeleton />
              ) : buying.length === 0 ? (
                <div
                  data-ocid="trades-empty-buying"
                  className="flex flex-col items-center justify-center py-16 text-center px-4"
                >
                  <span className="text-5xl mb-4">🛒</span>
                  <h3 className="text-foreground font-semibold mb-1">
                    {tl("trades.empty.buying.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tl("trades.empty.buying.desc")}
                  </p>
                  <Button
                    data-ocid="empty-buying-browse-cta"
                    onClick={() => navigate({ to: "/listings" })}
                  >
                    {tl("trades.empty.browseCta")}
                  </Button>
                </div>
              ) : isError ? null : (
                buying.map((t) => (
                  <TradeRow
                    key={t.id.toString()}
                    trade={t}
                    myPrincipal={myPrincipal}
                    unreadCount={unreadByTrade.get(t.id.toString()) ?? 0}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="selling" className="mt-0">
              {isLoading ? (
                <TradeListSkeleton />
              ) : selling.length === 0 ? (
                <div
                  data-ocid="trades-empty-selling"
                  className="flex flex-col items-center justify-center py-16 text-center px-4"
                >
                  <span className="text-5xl mb-4">📋</span>
                  <h3 className="text-foreground font-semibold mb-1">
                    {tl("trades.empty.selling.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tl("trades.empty.selling.desc")}
                  </p>
                  <Button
                    data-ocid="empty-selling-create-cta"
                    onClick={() => navigate({ to: "/listings/create" })}
                  >
                    {tl("trades.empty.postCta")}
                  </Button>
                </div>
              ) : isError ? null : (
                selling.map((t) => (
                  <TradeRow
                    key={t.id.toString()}
                    trade={t}
                    myPrincipal={myPrincipal}
                    unreadCount={unreadByTrade.get(t.id.toString()) ?? 0}
                  />
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
