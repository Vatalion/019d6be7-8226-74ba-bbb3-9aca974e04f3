import { History } from "lucide-react";
import { useLocale } from "../../hooks/useLocale";
import { t } from "../../i18n";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { Proposal } from "./types";
import { getProposalTypeLabel } from "./types";

interface ExecutionHistoryTableProps {
  proposals: Proposal[];
  loading: boolean;
}

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ExecutionHistoryTable({
  proposals,
  loading,
}: ExecutionHistoryTableProps) {
  const { locale } = useLocale();

  return (
    <Card className="border-border" data-ocid="execution-history-table">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-muted-foreground" />
          {t(locale, "gov.history.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {loading ? (
          <div className="px-6 pb-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <History className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {t(locale, "gov.history.empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>{t(locale, "gov.history.colType")}</TableHead>
                  <TableHead className="max-w-xs">
                    {t(locale, "gov.history.colDescription")}
                  </TableHead>
                  <TableHead>{t(locale, "gov.history.colStatus")}</TableHead>
                  <TableHead>{t(locale, "gov.history.colDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => {
                  const typeLabel = getProposalTypeLabel(proposal.proposalType);
                  const isPassed = "passed" in proposal.status;
                  const isExecuted = "executed" in proposal.status;
                  const isRejected = "rejected" in proposal.status;

                  return (
                    <TableRow
                      key={String(proposal.id)}
                      data-ocid={`history-row-${String(proposal.id)}`}
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{String(proposal.id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          {t(
                            locale,
                            `gov.type.${typeLabel}` as Parameters<typeof t>[1],
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground line-clamp-2 max-w-xs">
                          {proposal.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs whitespace-nowrap ${
                            isExecuted
                              ? "bg-muted text-muted-foreground border-border"
                              : isPassed
                                ? "bg-green-500/10 text-green-700 dark:text-green-200 border-green-500/20"
                                : isRejected
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border-yellow-500/20"
                          }`}
                        >
                          {t(
                            locale,
                            `gov.status.${
                              isExecuted
                                ? "executed"
                                : isPassed
                                  ? "passed"
                                  : isRejected
                                    ? "rejected"
                                    : "expired"
                            }` as Parameters<typeof t>[1],
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(proposal.deadline)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
