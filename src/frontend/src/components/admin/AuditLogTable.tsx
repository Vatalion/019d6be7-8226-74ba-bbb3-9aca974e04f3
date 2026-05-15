import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ClipboardList, Search } from "lucide-react";
import { useState } from "react";
import type { AuditEntry } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { formatPrincipal, formatTimestamp } from "../../lib/format";

const PAGE_SIZE = 25n;

const ACTION_COLORS: Record<string, string> = {
  ban_user: "status-badge-dispute",
  suspend_user: "status-badge-funded",
  promote_moderator: "status-badge-confirmed",
  resolve_dispute: "status-badge-confirmed",
  remove_listing: "status-badge-dispute",
  update_settings: "status-badge-pending",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "status-badge-pending";
  return <span className={cls}>{action.replace(/_/g, " ")}</span>;
}

export default function AuditLogTable() {
  const [page, setPage] = useState(0n);
  const [actionFilter, setActionFilter] = useState("");

  const { actor, isFetching } = useBackend();

  const { data, isLoading } = useQuery({
    queryKey: ["auditLog", page.toString(), actionFilter],
    queryFn: async () => {
      if (!actor)
        return {
          items: [] as AuditEntry[],
          totalCount: 0n,
          page: 0n,
          pageSize: PAGE_SIZE,
        };
      return actor.getAuditLog(page, PAGE_SIZE, {
        actionFilter: actionFilter.trim() || undefined,
      });
    },
    enabled: !!actor && !isFetching,
  });

  const entries: AuditEntry[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0n;
  const totalPages =
    totalCount === 0n ? 1n : (totalCount + PAGE_SIZE - 1n) / PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="audit-action-filter"
              placeholder="Filter by action…"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0n);
              }}
              className="pl-9 w-48 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }, (_, i) => `sk-${i}`).map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div data-ocid="audit-empty" className="p-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No audit entries</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {actionFilter
                ? "No entries match this filter."
                : "No admin actions recorded yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Action
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Actor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Target
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Details
                </th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id.toString()}
                  data-ocid="audit-log-row"
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <ActionBadge action={entry.action} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatPrincipal(entry.actorId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {entry.targetId ? (
                      <span>{entry.targetId}</span>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                    {entry.details || <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatTimestamp(entry.timestamp).toLocaleString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {(page / PAGE_SIZE + 1n).toString()} of {totalPages.toString()}
          {totalCount > 0n && ` · ${totalCount.toString()} entries`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0n}
            onClick={() => setPage((p) => p - PAGE_SIZE)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + PAGE_SIZE >= totalCount}
            onClick={() => setPage((p) => p + PAGE_SIZE)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
