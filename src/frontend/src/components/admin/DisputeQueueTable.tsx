import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import type { DisputeView } from "../../backend.d";
import { DisputeStatus } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { formatPrincipal, formatTimestamp, timeAgo } from "../../lib/format";
import DisputeDetailModal from "./DisputeDetailModal";

const PAGE_SIZE = 20n;

const REASON_LABELS: Record<string, string> = {
  other: "Other",
  item_damaged: "Item Damaged",
  seller_unresponsive: "Seller Unresponsive",
  item_differs: "Item Differs",
  item_not_received: "Not Received",
};

function formatSlaCountdown(
  deadlineNs: bigint,
  nowNs: bigint = BigInt(Date.now()) * 1_000_000n,
): string {
  const remaining = Number(deadlineNs - nowNs) / 1_000_000_000;
  if (remaining <= 0) return "Overdue";
  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function SlaCountdownCell({ dispute }: { dispute: DisputeView }) {
  const flags = dispute.slaFlags;
  const overdue =
    flags?.l1SlaOverdue || flags?.l2TriageOverdue || flags?.l2DecisionOverdue;

  let deadline: bigint | null = null;
  if (dispute.status === DisputeStatus.opened) {
    deadline = dispute.l1SlaDeadline;
  } else if (
    dispute.status === DisputeStatus.l2_queued ||
    dispute.status === DisputeStatus.under_review
  ) {
    deadline = dispute.l2DecisionDeadline ?? dispute.l2TriageDeadline ?? null;
  }

  if (deadline == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const label = formatSlaCountdown(deadline);
  return (
    <span
      data-ocid="dispute-sla-countdown"
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        overdue ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

function DisputeStatusBadge({
  status,
  slaFlags,
}: {
  status: DisputeStatus;
  slaFlags?: DisputeView["slaFlags"];
}) {
  const overdue =
    slaFlags?.l1SlaOverdue ||
    slaFlags?.l2TriageOverdue ||
    slaFlags?.l2DecisionOverdue;
  const cls =
    status === DisputeStatus.opened
      ? "status-badge-dispute"
      : status === DisputeStatus.l2_queued
        ? overdue
          ? "status-badge-dispute border-destructive text-destructive"
          : "status-badge-funded"
        : status === DisputeStatus.under_review
          ? "status-badge-funded"
          : "status-badge-confirmed";
  const label =
    status === DisputeStatus.opened
      ? "L1"
      : status === DisputeStatus.l2_queued
        ? overdue
          ? "L2 overdue"
          : "L2 queue"
        : status === DisputeStatus.under_review
          ? "Under Review"
          : String(status);
  return <span className={cls}>{label}</span>;
}

export default function DisputeQueueTable() {
  const [offset, setOffset] = useState(0n);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeView | null>(
    null,
  );
  const { actor, isFetching } = useBackend();

  const { data, isLoading } = useQuery({
    queryKey: ["openDisputeQueue", offset.toString()],
    queryFn: async () => {
      if (!actor) return { __kind__: "ok" as const, ok: [] as DisputeView[] };
      return actor.getOpenDisputeQueue(offset, PAGE_SIZE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const allDisputes: DisputeView[] = data?.__kind__ === "ok" ? data.ok : [];

  const filtered =
    statusFilter === "all"
      ? allDisputes
      : allDisputes.filter((d) => String(d.status) === statusFilter);

  const levelFiltered =
    levelFilter === "all"
      ? filtered
      : levelFilter === "l1"
        ? filtered.filter((d) => d.status === DisputeStatus.opened)
        : filtered.filter(
            (d) =>
              d.status === DisputeStatus.l2_queued ||
              d.status === DisputeStatus.under_review,
          );

  const overdueFiltered = overdueOnly
    ? levelFiltered.filter(
        (d) =>
          d.slaFlags?.l1SlaOverdue ||
          d.slaFlags?.l2TriageOverdue ||
          d.slaFlags?.l2DecisionOverdue,
      )
    : levelFiltered;

  // Sort by newest first
  const sorted = [...overdueFiltered].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Dispute Queue
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger
              data-ocid="dispute-level-filter"
              className="w-32 text-sm"
            >
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="l1">L1 only</SelectItem>
              <SelectItem value="l2">L2 only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              data-ocid="dispute-status-filter"
              className="w-40 text-sm"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="opened">L1 (Opened)</SelectItem>
              <SelectItem value="l2_queued">L2 Queue</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            data-ocid="dispute-overdue-filter"
            variant={overdueOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setOverdueOnly((v) => !v)}
          >
            Overdue
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div data-ocid="disputes-empty" className="p-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No disputes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              All clear in the dispute queue.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Trade
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Initiator
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Reason
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  SLA
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Opened
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((dispute) => (
                <tr
                  key={dispute.id.toString()}
                  data-ocid="admin-dispute-row"
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    #{dispute.id.toString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    #{dispute.trade.toString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatPrincipal(dispute.initiator)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {REASON_LABELS[String(dispute.reason)] ??
                      String(dispute.reason)}
                  </td>
                  <td className="px-4 py-3">
                    <SlaCountdownCell dispute={dispute} />
                  </td>
                  <td className="px-4 py-3">
                    <DisputeStatusBadge
                      status={dispute.status as DisputeStatus}
                      slaFlags={dispute.slaFlags}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {timeAgo(formatTimestamp(dispute.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0n}
          onClick={() => setOffset((o) => o - PAGE_SIZE)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={allDisputes.length < Number(PAGE_SIZE)}
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
        />
      )}
    </div>
  );
}
