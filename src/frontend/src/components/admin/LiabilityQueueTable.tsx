import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LiabilityRecordView } from "../../backend.d";
import { LiabilityStatus } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import { formatPrincipal, formatTimestamp, timeAgo } from "../../lib/format";

const PAGE_SIZE = 50n;

function statusBadge(status: LiabilityStatus) {
  const cls =
    status === LiabilityStatus.open
      ? "status-badge-dispute"
      : status === LiabilityStatus.partial
        ? "status-badge-funded"
        : "status-badge-confirmed";
  return <span className={cls}>{String(status)}</span>;
}

function formatUsd(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function LiabilityQueueTable() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [clearAmounts, setClearAmounts] = useState<Record<string, string>>({});
  const [clearNotes, setClearNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["adminLiabilities"],
    queryFn: async () => {
      if (!actor) {
        return { __kind__: "ok" as const, ok: [] as LiabilityRecordView[] };
      }
      return actor.adminListLiabilities(0n, PAGE_SIZE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const partialClearMutation = useMutation({
    mutationFn: async (args: {
      liabilityId: bigint;
      amountCents: bigint;
      note: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.adminPartialClearLiability(
        args.liabilityId,
        args.amountCents,
        args.note,
      );
    },
    onSuccess: (result) => {
      if (result.__kind__ === "ok") {
        toast.success(t("admin.liability.partialClear.success"));
        void queryClient.invalidateQueries({ queryKey: ["adminLiabilities"] });
      } else {
        toast.error(String(result.err));
      }
    },
  });

  const liabilities: LiabilityRecordView[] =
    data !== undefined && data.__kind__ === "ok" ? data.ok : [];

  return (
    <div className="space-y-4" data-ocid="liability-queue">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.liability.title")}
        </h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2">{t("admin.liability.col.id")}</th>
              <th className="px-3 py-2">{t("admin.liability.col.user")}</th>
              <th className="px-3 py-2">
                {t("admin.liability.col.remaining")}
              </th>
              <th className="px-3 py-2">{t("admin.liability.col.reason")}</th>
              <th className="px-3 py-2">{t("admin.liability.col.status")}</th>
              <th className="px-3 py-2">{t("admin.liability.col.age")}</th>
              <th className="px-3 py-2">
                {t("admin.liability.col.partialClear")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6">
                  <Skeleton className="h-8 w-full" />
                </td>
              </tr>
            ) : liabilities.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-muted-foreground"
                  data-ocid="liability-queue-empty"
                >
                  {t("admin.liability.empty")}
                </td>
              </tr>
            ) : (
              liabilities.map((row) => {
                const key = row.id.toString();
                return (
                  <tr
                    key={key}
                    className="border-b border-border/60"
                    data-ocid={`liability-row-${key}`}
                  >
                    <td className="px-3 py-2 font-mono">#{key}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {formatPrincipal(row.userId)}
                    </td>
                    <td className="px-3 py-2">
                      {formatUsd(row.remainingBalance)}
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        / {formatUsd(row.originalAmount)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{String(row.reason)}</td>
                    <td className="px-3 py-2">{statusBadge(row.status)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {timeAgo(row.createdAt)}
                      <div>
                        {formatTimestamp(row.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-[220px] flex-col gap-1">
                        <Input
                          type="number"
                          min={1}
                          placeholder={t("admin.liability.amountPlaceholder")}
                          value={clearAmounts[key] ?? ""}
                          onChange={(e) =>
                            setClearAmounts((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          data-ocid={`liability-clear-amount-${key}`}
                        />
                        <Input
                          placeholder={t("admin.liability.notePlaceholder")}
                          value={clearNotes[key] ?? ""}
                          onChange={(e) =>
                            setClearNotes((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          data-ocid={`liability-clear-note-${key}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={partialClearMutation.isPending}
                          onClick={() => {
                            const cents = BigInt(clearAmounts[key] || "0");
                            const note = (clearNotes[key] ?? "").trim();
                            if (cents <= 0n || !note) {
                              toast.error(
                                t("admin.liability.partialClear.invalid"),
                              );
                              return;
                            }
                            partialClearMutation.mutate({
                              liabilityId: row.id,
                              amountCents: cents,
                              note,
                            });
                          }}
                          data-ocid={`liability-partial-clear-${key}`}
                        >
                          {t("admin.liability.partialClear.action")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
