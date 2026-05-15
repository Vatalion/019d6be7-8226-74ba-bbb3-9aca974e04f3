import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import TokenChip from "../components/shared/TokenChip";
import TradeStatusBadge from "../components/shared/TradeStatusBadge";
import { useBackend } from "../hooks/useBackend";
import {
  TOKEN_DECIMALS,
  formatTimestamp,
  formatTokenAmount,
  timeAgo,
} from "../lib/format";

export default function TradeDetail() {
  const { id } = useParams({ from: "/trades/$id" });
  const { actor, isFetching } = useBackend();

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade", id],
    queryFn: () => actor!.getTrade(BigInt(id)),
    enabled: !!actor && !isFetching,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Loading trade…" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-muted-foreground">Trade not found.</p>
        <Link to="/trades" className="text-accent hover:underline text-sm">
          Back to trades
        </Link>
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      data-ocid="trade-detail"
    >
      <Link
        to="/trades"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft className="h-4 w-4" /> All trades
      </Link>

      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-foreground">
            Trade #{trade.id.toString()}
          </h1>
          <TradeStatusBadge status={String(trade.status)} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground text-caption">Amount</p>
            <p className="font-mono font-medium text-foreground">
              {formatTokenAmount(
                trade.amount,
                String(trade.token),
                TOKEN_DECIMALS[String(trade.token)] ?? 8,
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-caption">Token</p>
            <TokenChip token={trade.token} size="sm" />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-caption">Created</p>
            <p className="text-foreground">{timeAgo(trade.createdAt)}</p>
          </div>
          {trade.completedAt && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-caption">Completed</p>
              <p className="text-foreground">
                {formatTimestamp(trade.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
