import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  BarChart3,
  Clock,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { PlatformMetrics, TradeView } from "../../backend.d";
import { TradeToken } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { formatTimestamp, timeAgo } from "../../lib/format";

function MetricCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-md bg-accent/10 p-2 text-accent">{icon}</div>
      </div>
    </div>
  );
}

const TOKEN_LABELS: Record<string, string> = {
  [TradeToken.USDT_TRC20]: "USDT · TRC20",
  [TradeToken.USDT_BEP20]: "USDT · BEP20",
  [TradeToken.USDC_SPL]: "USDC · Solana",
};

export default function MetricsDashboard() {
  const { actor, isFetching } = useBackend();

  const { data: metrics, isLoading: metricsLoading } =
    useQuery<PlatformMetrics>({
      queryKey: ["platformMetrics"],
      queryFn: async () => {
        if (!actor) throw new Error("No actor");
        return actor.getPlatformMetrics();
      },
      enabled: !!actor && !isFetching,
      refetchInterval: 30_000,
    });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<TradeView[]>(
    {
      queryKey: ["adminAllTrades"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.adminGetAllTrades();
      },
      enabled: !!actor && !isFetching,
    },
  );

  const avgMs = metrics?.avgTradeCompletionMs ?? 0n;
  const avgMinutes = Number(avgMs) / 60_000;
  const avgLabel =
    avgMinutes >= 60
      ? `${(avgMinutes / 60).toFixed(1)}h avg`
      : `${avgMinutes.toFixed(0)}m avg`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Platform Overview
        </h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Listings"
              value={metrics?.totalListings.toString() ?? "—"}
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <MetricCard
              label="Total Trades"
              value={metrics?.totalTrades.toString() ?? "—"}
              icon={<BarChart3 className="h-5 w-5" />}
              sub={avgLabel}
            />
            <MetricCard
              label="Active Users (30d)"
              value={metrics?.activeUsersLast30d.toString() ?? "—"}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              label="Dispute Rate"
              value={`${metrics?.disputeRatePct.toString() ?? "—"}%`}
              icon={<AlertOctagon className="h-5 w-5" />}
              sub="of all trades"
            />
          </>
        )}
      </div>

      {/* Token breakdown */}
      {metrics && metrics.tradesByToken.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">
            Trades by Token
          </p>
          <div className="flex flex-wrap gap-3">
            {metrics.tradesByToken.map(([token, count]) => (
              <div key={String(token)} className="token-chip">
                <span className="text-accent">
                  {TOKEN_LABELS[String(token)] ?? String(token)}
                </span>
                <span className="text-muted-foreground font-mono">
                  {count.toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent trades table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Recent Trades</p>
        </div>
        {tradesLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div
            data-ocid="metrics-trades-empty"
            className="p-8 text-center text-sm text-muted-foreground"
          >
            No trades recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    Trade ID
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    Token
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold text-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold text-foreground">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((trade) => (
                  <tr
                    key={trade.id.toString()}
                    data-ocid="admin-trade-row"
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      #{trade.id.toString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="token-chip py-0.5 text-xs">
                        {TOKEN_LABELS[String(trade.token)] ??
                          String(trade.token)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                      {trade.amount.toString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={String(trade.status)} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {timeAgo(formatTimestamp(trade.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "complete"
      ? "status-badge-confirmed"
      : status === "disputed"
        ? "status-badge-dispute"
        : status === "funded" || status === "buyer_confirmed"
          ? "status-badge-funded"
          : "status-badge-pending";
  return <span className={cls}>{status.replace("_", " ")}</span>;
}
