import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CyclesStatus,
  ErrorLogEntry,
  MetricsSummary,
  ModuleMetricsView,
  PlatformMetrics__1,
} from "../../backend.d";
import { ErrorSeverity } from "../../backend.d";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";

// ─── Severity helpers ────────────────────────────────────────────────────────

function severityBadgeClass(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.info:
      return "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30";
    case ErrorSeverity.warning:
      return "bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30";
    case ErrorSeverity.error:
      return "bg-red-500/15 text-red-700 dark:text-red-200 border-red-500/30";
    case ErrorSeverity.critical:
      return "bg-red-900/20 text-red-800 dark:text-red-200 border-red-800/40";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function severityLabel(
  severity: ErrorSeverity,
  t: (k: Parameters<ReturnType<typeof useLocale>["t"]>[0]) => string,
): string {
  switch (severity) {
    case ErrorSeverity.info:
      return t("admin.severity.info");
    case ErrorSeverity.warning:
      return t("admin.severity.warning");
    case ErrorSeverity.error:
      return t("admin.severity.error");
    case ErrorSeverity.critical:
      return t("admin.severity.critical");
    default:
      return String(severity);
  }
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  trend,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  sub?: string;
}) {
  const trendColor =
    trend === "up"
      ? "text-green-700 dark:text-green-200"
      : trend === "down"
        ? "text-red-600 dark:text-red-200"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p
            className={`mt-1 font-mono text-2xl font-bold text-foreground ${trendColor}`}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="shrink-0 rounded-md bg-accent/10 p-2 text-accent">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Cycles Card ─────────────────────────────────────────────────────────────

function CyclesCard({ data }: { data: CyclesStatus }) {
  const { t } = useLocale();
  const balance = Number(data.currentBalance) / 1e12;
  const threshold = Number(data.warningThreshold) / 1e12;
  const dailyBurn = Number(data.estimatedDailyBurn) / 1e12;
  const budgetPct =
    threshold > 0 ? Math.min(100, (balance / threshold) * 100) : 100;

  return (
    <div
      className={`rounded-lg border p-5 ${
        data.isWarning
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-foreground">
            {t("admin.cycles.title")}
          </p>
        </div>
        {data.isWarning ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-200">
            <AlertCircle className="h-3 w-3" />
            {t("admin.cycles.warning")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3" />
            {t("admin.cycles.ok")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("admin.cycles.balance")}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
            {balance.toFixed(2)}T
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {t("admin.cycles.budget")}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
            {budgetPct.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {t("admin.cycles.dailyBurn")}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-foreground">
            {dailyBurn.toFixed(2)}T
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(budgetPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("admin.cycles.progressLabel")}
        tabIndex={0}
      >
        <div
          className={`h-full rounded-full transition-all ${
            data.isWarning ? "bg-amber-500" : "bg-accent"
          }`}
          style={{ width: `${Math.max(2, budgetPct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Module Bar Chart ─────────────────────────────────────────────────────────

function ModuleBarChart({ modules }: { modules: ModuleMetricsView[] }) {
  const { t } = useLocale();
  const maxErrors = Math.max(...modules.map((m) => Number(m.errorCount)), 1);

  return (
    <div className="metric-chart-container flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">
        {t("admin.modules.chart")}
      </p>
      <div className="flex flex-1 flex-col justify-end gap-2">
        {modules.map((mod) => {
          const pct = (Number(mod.errorCount) / maxErrors) * 100;
          return (
            <div key={mod.moduleName} className="flex items-center gap-3">
              <p className="w-32 shrink-0 truncate text-right text-xs text-muted-foreground">
                {mod.moduleName}
              </p>
              <div className="flex flex-1 items-center gap-2">
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full rounded transition-all ${
                      Number(mod.errorCount) === 0
                        ? "bg-accent/30"
                        : Number(mod.errorCount) > maxErrors * 0.6
                          ? "bg-destructive/70"
                          : "bg-amber-500/60"
                    }`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs font-bold text-foreground">
                  {mod.errorCount.toString()}
                </span>
              </div>
            </div>
          );
        })}
        {modules.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

// ─── Module Table ─────────────────────────────────────────────────────────────

function ModuleMetricsTable({ modules }: { modules: ModuleMetricsView[] }) {
  const { t } = useLocale();

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold text-foreground">
              {t("admin.modules.name")}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-foreground">
              {t("admin.modules.requests")}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-foreground">
              {t("admin.modules.errors")}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-foreground">
              {t("admin.modules.memory")}
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-foreground">
              {t("admin.modules.cycles")}
            </th>
          </tr>
        </thead>
        <tbody>
          {modules.map((mod) => (
            <tr
              key={mod.moduleName}
              data-ocid="admin-module-row"
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-2.5 font-medium text-foreground">
                {mod.moduleName}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-foreground">
                {mod.requestCount.toString()}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span
                  className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-bold ${
                    Number(mod.errorCount) === 0
                      ? "text-muted-foreground"
                      : Number(mod.errorCount) > 10
                        ? "text-destructive"
                        : "text-amber-700 dark:text-amber-200"
                  }`}
                >
                  {mod.errorCount.toString()}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                {(Number(mod.memoryUsedBytes) / 1024).toFixed(0)} KB
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                {(Number(mod.cyclesConsumed) / 1e9).toFixed(1)}G
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Error Log ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const SEVERITY_OPTIONS = ["", "info", "warning", "error", "critical"] as const;
type SeverityFilter = (typeof SEVERITY_OPTIONS)[number];

function ErrorLogSection({
  entries,
  isLoading,
  severityFilter,
  onSeverityChange,
}: {
  entries: ErrorLogEntry[];
  isLoading: boolean;
  severityFilter: SeverityFilter;
  onSeverityChange: (v: SeverityFilter) => void;
}) {
  const { t } = useLocale();
  const [page, setPage] = useState(0);

  const filtered = severityFilter
    ? entries.filter((e) => String(e.severity) === severityFilter)
    : entries;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 when filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [severityFilter]);

  function formatTs(ts: bigint): string {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString();
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {t("admin.errorLog.title")}
          </p>
          {filtered.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filtered.length}
            </Badge>
          )}
        </div>
        <select
          data-ocid="error-log-severity-filter"
          value={severityFilter}
          onChange={(e) => onSeverityChange(e.target.value as SeverityFilter)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">{t("admin.errorLog.all")}</option>
          {SEVERITY_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {t(`admin.severity.${s}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : pageEntries.length === 0 ? (
        <div
          data-ocid="error-log-empty"
          className="p-10 text-center text-sm text-muted-foreground"
        >
          {severityFilter
            ? t("admin.errorLog.emptyFiltered")
            : t("admin.errorLog.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {t("admin.errorLog.timestamp")}
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {t("admin.errorLog.module")}
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {t("admin.errorLog.function")}
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {t("admin.errorLog.severity")}
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {t("admin.errorLog.message")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageEntries.map((entry) => (
                <tr
                  key={entry.id.toString()}
                  data-ocid="error-log-row"
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {formatTs(entry.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                    {entry.moduleName}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {entry.functionName}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${severityBadgeClass(entry.severity)}`}
                    >
                      {severityLabel(entry.severity, t)}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-xs text-foreground">
                    {entry.errorMessage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {t("admin.errorLog.page")} {page + 1} {t("admin.errorLog.of")}{" "}
            {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="error-log-prev"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-3 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
            >
              {t("admin.errorLog.prev")}
            </button>
            <button
              type="button"
              data-ocid="error-log-next"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-3 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
            >
              {t("admin.errorLog.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function Phase2MetricsPanel() {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("");
  const [secondsSince, setSecondsSince] = useState(0);
  const lastRefreshRef = useRef<number>(Date.now());

  const enabled = !!actor && !isFetching;

  const { data: dashMetrics, isLoading: dashLoading } =
    useQuery<PlatformMetrics__1>({
      queryKey: ["dashboardMetrics"],
      queryFn: async () => {
        if (!actor) throw new Error("No actor");
        return actor.getDashboardMetrics();
      },
      enabled,
      refetchInterval: 30_000,
    });

  const { data: cycles, isLoading: cyclesLoading } = useQuery<CyclesStatus>({
    queryKey: ["cyclesStatus"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCyclesStatus();
    },
    enabled,
    refetchInterval: 30_000,
  });

  const { data: errorLog = [], isLoading: errorLoading } = useQuery<
    ErrorLogEntry[]
  >({
    queryKey: ["errorLog", severityFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getErrorLog(200n, severityFilter || null);
    },
    enabled,
    refetchInterval: 30_000,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<
    ModuleMetricsView[]
  >({
    queryKey: ["moduleMetrics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getModuleMetrics();
    },
    enabled,
    refetchInterval: 30_000,
  });

  // New: metrics summary (totalTrades, activeTrades, volume, revenue, p95, etc.)
  const { data: summary, isLoading: summaryLoading } = useQuery<MetricsSummary>(
    {
      queryKey: ["metricsSummary"],
      queryFn: async () => {
        if (!actor) throw new Error("No actor");
        return actor.getMetricsSummary();
      },
      enabled,
      refetchInterval: 30_000,
    },
  );

  // New: trades per day for volume graph
  const { data: tradesPerDay = [], isLoading: tradesPerDayLoading } = useQuery<
    Array<{ date: string; count: number }>
  >({
    queryKey: ["tradesPerDayVolume"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getTradesPerDay(7n);
      return raw.map((item) => ({
        date: item.date,
        count: Number(item.count),
      }));
    },
    enabled,
    refetchInterval: 30_000,
  });

  // New: system settings (for alert threshold comparison)
  const { data: sysSettings } = useQuery({
    queryKey: ["sysSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getSystemSettings();
    },
    enabled,
    refetchInterval: 30_000,
  });

  // Track seconds since last refresh
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsSince(Math.floor((Date.now() - lastRefreshRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    lastRefreshRef.current = Date.now();
    setSecondsSince(0);
    void queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    void queryClient.invalidateQueries({ queryKey: ["cyclesStatus"] });
    void queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === "errorLog",
    });
    void queryClient.invalidateQueries({ queryKey: ["moduleMetrics"] });
    void queryClient.invalidateQueries({ queryKey: ["metricsSummary"] });
    void queryClient.invalidateQueries({ queryKey: ["tradesPerDayVolume"] });
    void queryClient.invalidateQueries({ queryKey: ["sysSettings"] });
  }, [queryClient]);

  const isAnyLoading =
    dashLoading ||
    cyclesLoading ||
    errorLoading ||
    modulesLoading ||
    summaryLoading ||
    tradesPerDayLoading;

  // Compute alert banners
  const showCyclesAlert =
    summary &&
    sysSettings &&
    summary.cyclesBalance < sysSettings.cyclesBalanceThreshold;
  const showErrorRateAlert =
    summary &&
    sysSettings &&
    summary.errorRate > sysSettings.errorRateThreshold;

  return (
    <div className="space-y-6">
      {/* Alert banners — shown at the top when thresholds are exceeded */}
      {showCyclesAlert && <AlertBanner message={t("admin.alerts.cyclesLow")} />}
      {showErrorRateAlert && (
        <AlertBanner message={t("admin.alerts.errorRateHigh")} />
      )}

      {/* Section header with refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("admin.metrics.title")}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs text-muted-foreground"
            data-ocid="metrics-last-updated"
          >
            {t("admin.metrics.lastUpdated")} {secondsSince}{" "}
            {t("admin.metrics.secondsAgo")}
          </span>
          <button
            type="button"
            data-ocid="metrics-refresh-btn"
            onClick={handleRefresh}
            disabled={isAnyLoading}
            aria-label={t("admin.metrics.refreshLabel")}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isAnyLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {t("admin.metrics.refresh")}
          </button>
        </div>
      </div>

      {/* Metrics Cards row — totalTrades, activeTrades, volume, revenue, disputeRate */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : (
          <>
            <KpiCard
              label={t("admin.metrics.totalTrades")}
              value={summary ? summary.totalTrades.toString() : "—"}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KpiCard
              label={t("admin.metrics.activeTrades")}
              value={summary ? summary.activeTrades.toString() : "—"}
              icon={<Activity className="h-5 w-5" />}
            />
            <KpiCard
              label={t("admin.metrics.totalVolume")}
              value={
                summary
                  ? `$${(Number(summary.totalVolume) / 100).toLocaleString()}`
                  : "—"
              }
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KpiCard
              label={t("admin.metrics.totalRevenue")}
              value={
                summary
                  ? `$${(Number(summary.totalRevenue) / 100).toLocaleString()}`
                  : "—"
              }
              icon={<Zap className="h-5 w-5" />}
            />
            <KpiCard
              label={t("admin.metrics.disputeRatePct")}
              value={summary ? `${summary.disputeRate.toFixed(1)}%` : "—"}
              icon={<AlertOctagon className="h-5 w-5" />}
              trend={
                summary ? (summary.disputeRate <= 3 ? "up" : "down") : "neutral"
              }
            />
          </>
        )}
      </div>

      {/* Latency & Health row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : (
          <>
            <KpiCard
              label={t("admin.metrics.p95Latency")}
              value={summary ? `${summary.p95LatencyMs.toString()}ms` : "—"}
              icon={<Clock className="h-5 w-5" />}
              trend={
                summary
                  ? Number(summary.p95LatencyMs) <= 500
                    ? "up"
                    : "down"
                  : "neutral"
              }
            />
            <KpiCard
              label={t("admin.metrics.errorRate")}
              value={summary ? `${summary.errorRate.toFixed(2)}%` : "—"}
              icon={<AlertTriangle className="h-5 w-5" />}
              trend={
                summary ? (summary.errorRate <= 1 ? "up" : "down") : "neutral"
              }
            />
            <KpiCard
              label={t("admin.metrics.cyclesBalanceTril")}
              value={
                summary
                  ? `${(Number(summary.cyclesBalance) / 1e12).toFixed(2)}T`
                  : "—"
              }
              icon={<Zap className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Volume Graph — trades per day (last 7 days) */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {t("admin.metrics.volumeGraph")}
          </p>
        </div>
        {tradesPerDayLoading ? (
          <Skeleton className="h-[200px] w-full rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={tradesPerDay}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground text-xs"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground text-xs"
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legacy KPI row — swap success, avg settlement, dispute rate, MAU */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : (
          <>
            <KpiCard
              label={t("admin.metrics.swapSuccess")}
              value={
                dashMetrics ? `${dashMetrics.swapSuccessRate.toFixed(1)}%` : "—"
              }
              icon={<BarChart3 className="h-5 w-5" />}
              trend={
                dashMetrics
                  ? dashMetrics.swapSuccessRate >= 90
                    ? "up"
                    : "down"
                  : "neutral"
              }
            />
            <KpiCard
              label={t("admin.metrics.avgSettlement")}
              value={
                dashMetrics
                  ? `${dashMetrics.avgSettlementTimeMin.toFixed(0)} ${t("admin.metrics.minutes")}`
                  : "—"
              }
              icon={<Clock className="h-5 w-5" />}
              trend={
                dashMetrics
                  ? dashMetrics.avgSettlementTimeMin <= 30
                    ? "up"
                    : "down"
                  : "neutral"
              }
            />
            <KpiCard
              label={t("admin.metrics.disputeRate")}
              value={
                dashMetrics
                  ? `${(dashMetrics.disputeRate * 100).toFixed(1)}%`
                  : "—"
              }
              icon={<AlertOctagon className="h-5 w-5" />}
              trend={
                dashMetrics
                  ? dashMetrics.disputeRate <= 0.03
                    ? "up"
                    : "down"
                  : "neutral"
              }
              sub={t("admin.metrics.disputeTarget")}
            />
            <KpiCard
              label={t("admin.metrics.mau")}
              value={
                dashMetrics ? dashMetrics.monthlyActiveUsers.toString() : "—"
              }
              icon={<Activity className="h-5 w-5" />}
              sub={
                dashMetrics
                  ? `${t("admin.metrics.activeUsers24h")}: ${dashMetrics.activeUsersLast24h.toString()}`
                  : undefined
              }
            />
          </>
        )}
      </div>

      {/* Cycles status */}
      {cyclesLoading ? (
        <Skeleton className="h-36 w-full rounded-lg" />
      ) : cycles ? (
        <CyclesCard data={cycles} />
      ) : null}

      {/* Modules section — chart + table side by side on large screens */}
      {modulesLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : modules.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {t("admin.modules.title")}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleBarChart modules={modules} />
            <ModuleMetricsTable modules={modules} />
          </div>
        </div>
      ) : null}

      {/* Error log */}
      <ErrorLogSection
        entries={errorLog}
        isLoading={errorLoading}
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
      />
    </div>
  );
}
