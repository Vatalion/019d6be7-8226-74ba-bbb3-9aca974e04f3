import { ArrowDownLeft, Landmark } from "lucide-react";
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
import type { Withdrawal } from "./types";

interface TreasuryPanelProps {
  balance: bigint;
  withdrawals: Withdrawal[];
  loading: boolean;
}

function formatUSDT(amount: bigint): string {
  // Assume 6 decimals (USDC/USDT standard)
  const whole = amount / 1_000_000n;
  const frac = amount % 1_000_000n;
  const fracStr = String(frac).padStart(6, "0").slice(0, 2);
  return `${whole.toLocaleString("en-US")}.${fracStr}`;
}

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleString();
}

function shortenId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function TreasuryPanel({
  balance,
  withdrawals,
  loading,
}: TreasuryPanelProps) {
  const { locale } = useLocale();

  return (
    <div className="space-y-6" data-ocid="treasury-panel">
      {/* Balance card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-5 w-5 text-primary" />
            {t(locale, "gov.treasury.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="flex items-end gap-3">
              <span className="text-4xl font-display font-bold text-foreground tabular-nums">
                {formatUSDT(balance)}
              </span>
              <Badge variant="outline" className="mb-1 text-xs">
                USDT
              </Badge>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t(locale, "gov.treasury.balanceNote")}
          </p>
        </CardContent>
      </Card>

      {/* Recent withdrawals / deposits */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownLeft className="h-5 w-5 text-muted-foreground" />
            {t(locale, "gov.treasury.recentFees")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="px-6 pb-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowDownLeft className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {t(locale, "gov.treasury.noFees")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t(locale, "gov.treasury.colTradeId")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t(locale, "gov.treasury.colAmount")}
                    </TableHead>
                    <TableHead>{t(locale, "gov.treasury.colDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-ocid="treasury-withdrawals-table">
                  {withdrawals.map((w) => (
                    <TableRow
                      key={String(w.id)}
                      data-ocid={`withdrawal-row-${String(w.id)}`}
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {shortenId(w.tradeId)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                        +{formatUSDT(w.amount)} USDT
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(w.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
