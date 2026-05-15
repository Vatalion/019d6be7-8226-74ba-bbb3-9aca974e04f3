import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TradeToken } from "../backend.d";
import { ChainBalanceCard } from "../components/vault/ChainBalanceCard";
import type {
  VaultAddressData,
  VaultBalanceData,
} from "../components/vault/ChainBalanceCard";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";
import { useVisiblePolling } from "../hooks/useVisiblePolling";
import { t } from "../i18n";

const CHAINS = ["TRC20", "BEP20", "ERC20", "SPL", "Polygon", "Avalanche"];
const AUTO_REFRESH_MS = 300_000;

/** Format a nanosecond timestamp into a human-readable "X min ago" string. */
function formatRateAge(fetchedAtNs: bigint, locale: string): string {
  const ageMs = Number(
    (BigInt(Date.now()) * 1_000_000n - fetchedAtNs) / 1_000_000n,
  );
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes <= 0) return locale === "uk" ? "щойно" : "just now";
  return locale === "uk" ? `${minutes} хв тому` : `${minutes} min ago`;
}

/** Convert rateInCents bigint to "$X.XX" string. */
function formatRate(rateInCents: bigint): string {
  const dollars = Number(rateInCents) / 100;
  return `$${dollars.toFixed(2)}`;
}

function toChainVariant(chain: string): Record<string, null> {
  return { [chain]: null };
}

function chainKeyFromVariant(v: unknown): string {
  if (v && typeof v === "object") {
    const key = Object.keys(v as Record<string, unknown>)[0];
    return key ?? "";
  }
  return "";
}

// Vault extension methods not yet in generated interface
interface VaultActor {
  getVaultAddresses: () => Promise<
    Array<{
      chain: unknown;
      tokenSymbol: string;
      network: string;
      address: string;
      derivedAt: bigint;
    }>
  >;
  refreshVaultBalance: (chain: Record<string, null>) => Promise<{
    chain: unknown;
    usdtBalance: bigint;
    usdcBalance: bigint;
    lastChecked: bigint;
    error: [] | [string];
  }>;
}

export default function VaultPage() {
  const { locale } = useLocale();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const { actor: rawActor, isFetching } = useBackend();
  const navigate = useNavigate();
  const actor = rawActor as (typeof rawActor & VaultActor) | null;
  const { isVisible, justBecameVisible } = useVisiblePolling();

  const [addresses, setAddresses] = useState<VaultAddressData[]>([]);
  const [balances, setBalances] = useState<Record<string, VaultBalanceData>>(
    {},
  );
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressLoadError, setAddressLoadError] = useState<string | null>(null);
  const [refreshingChains, setRefreshingChains] = useState<Set<string>>(
    new Set(),
  );
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedRef = useRef(false);

  // Rate oracle: fetch USDT_TRC20 rate as representative stablecoin rate
  const { data: cachedRate } = useQuery<{
    rateInCents: bigint;
    fetchedAt: bigint;
  } | null>({
    queryKey: ["cachedRate", "USDT_TRC20"],
    queryFn: async () => {
      if (!rawActor || isFetching) return null;
      return rawActor.getCachedRate(TradeToken.USDT_TRC20);
    },
    enabled: !!rawActor && !isFetching,
    refetchInterval: 60_000,
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // Load vault addresses on first actor ready
  const loadAddresses = useCallback(async () => {
    if (!actor || isFetching || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setIsLoadingAddresses(true);
    setAddressLoadError(null);
    try {
      const raw = await actor.getVaultAddresses();
      const parsed: VaultAddressData[] = raw.map((a) => ({
        chain: chainKeyFromVariant(a.chain),
        tokenSymbol: a.tokenSymbol,
        network: a.network,
        address: a.address,
        derivedAt: a.derivedAt,
      }));
      setAddresses(parsed);
    } catch (err) {
      console.error("[VaultPage] getVaultAddresses failed:", err);
      // Log technical error above; show only user-friendly message
      setAddressLoadError(t(locale, "vault.fetchError"));
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [actor, isFetching, locale]);

  // Fetch balance for one chain
  const fetchBalance = useCallback(
    async (chain: string) => {
      if (!actor) return;
      setRefreshingChains((prev) => new Set(prev).add(chain));
      try {
        const b = await actor.refreshVaultBalance(toChainVariant(chain));
        const errorVal: string | null =
          b.error.length > 0 ? t(locale, "vault.balanceError") : null;
        const entry: VaultBalanceData = {
          chain,
          usdtBalance: b.usdtBalance,
          usdcBalance: b.usdcBalance,
          lastChecked: b.lastChecked,
          error: errorVal,
        };
        setBalances((prev) => ({ ...prev, [chain]: entry }));
      } catch (err) {
        console.error(
          `[VaultPage] refreshVaultBalance failed for ${chain}:`,
          err,
        );
        const entry: VaultBalanceData = {
          chain,
          usdtBalance: 0n,
          usdcBalance: 0n,
          lastChecked: 0n,
          error: t(locale, "vault.balanceError"),
        };
        setBalances((prev) => ({ ...prev, [chain]: entry }));
      } finally {
        setRefreshingChains((prev) => {
          const next = new Set(prev);
          next.delete(chain);
          return next;
        });
      }
    },
    [actor, locale],
  );

  // Refresh all balances — staggered to avoid parallel request storm
  const refreshAll = useCallback(async () => {
    if (!actor || isRefreshingAll) return;
    setIsRefreshingAll(true);
    for (const chain of CHAINS) {
      await fetchBalance(chain);
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    setIsRefreshingAll(false);
  }, [actor, fetchBalance, isRefreshingAll]);

  // Load addresses once actor is ready
  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const isVisibleRef = useRef(isVisible);
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  // Keep a stable ref to refreshAll so the mount effect doesn't need it in deps
  const refreshAllRef = useRef(refreshAll);
  useEffect(() => {
    refreshAllRef.current = refreshAll;
  }, [refreshAll]);

  // Auto-refresh balances — only when tab is visible
  useEffect(() => {
    if (!actor || isFetching) return;
    // Initial balance load
    void refreshAllRef.current();

    autoRefreshRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        void refreshAllRef.current();
      }
    }, AUTO_REFRESH_MS);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [actor, isFetching]);

  // Catch up when tab becomes visible after > 30s hidden
  useEffect(() => {
    if (justBecameVisible) {
      void refreshAll();
    }
  }, [justBecameVisible, refreshAll]);

  // Auth gate loading
  if (isInitializing) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // Not authenticated — show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">
            {t(locale, "vault.signInRequired")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(locale, "vault.signInDesc")}
          </p>
          <Button
            onClick={login}
            className="w-full"
            data-ocid="vault-sign-in-btn"
          >
            {t(locale, "nav.connect")}
          </Button>
        </div>
      </div>
    );
  }

  const addressByChain = addresses.reduce<Record<string, VaultAddressData>>(
    (acc, a) => {
      acc[a.chain] = a;
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              {t(locale, "vault.title")}
              {isLoadingAddresses && (
                <Loader2 className="w-4 h-4 animate-spin text-accent ml-2" />
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(locale, "vault.subtitle")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshAll()}
            disabled={isRefreshingAll || isLoadingAddresses}
            data-ocid="vault-refresh-all-btn"
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshingAll ? "animate-spin" : ""}`}
            />
            {t(locale, "vault.refreshAll")}
          </Button>
        </div>

        {/* Non-custodial disclaimer */}
        <div
          className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-lg px-4 py-3"
          role="note"
          aria-label={t(locale, "vault.disclaimerLabel")}
        >
          <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            {t(locale, "vault.disclaimer")}
          </p>
        </div>

        {/* Rate freshness indicator */}
        {(() => {
          const STALE_NS = 300_000_000_000n; // 5 minutes
          const nowNs = BigInt(Date.now()) * 1_000_000n;
          const isStale =
            !cachedRate || nowNs - cachedRate.fetchedAt >= STALE_NS;
          if (isStale) {
            return (
              <p
                className="text-xs text-muted-foreground"
                data-ocid="vault.rate_indicator"
              >
                {t(locale, "vault.rateNotAvailable")}
              </p>
            );
          }
          return (
            <p
              className="text-xs text-muted-foreground"
              data-ocid="vault.rate_indicator"
            >
              {t(locale, "vault.rateLastUpdated")
                .replace("{rate}", formatRate(cachedRate.rateInCents))
                .replace("{age}", formatRateAge(cachedRate.fetchedAt, locale))}
            </p>
          );
        })()}

        {/* Address load error banner */}
        {addressLoadError && !isLoadingAddresses && (
          <div
            className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3"
            role="alert"
            data-ocid="vault.error_state"
          >
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground break-words">
                {addressLoadError}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              data-ocid="vault.retry_button"
              onClick={() => {
                hasLoadedRef.current = false;
                setAddressLoadError(null);
                void loadAddresses();
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t(locale, "shipping.compare.retry")}
            </Button>
          </div>
        )}

        {/* Address loading skeleton (ECDSA derivation) */}
        {isLoadingAddresses && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAINS.map((chain) => (
              <div
                key={chain}
                className="bg-card border border-border rounded-lg p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 rounded-md" />
                  <Skeleton className="h-12 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chain cards grid */}
        {!isLoadingAddresses && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAINS.map((chain) => (
              <ChainBalanceCard
                key={chain}
                chain={chain}
                address={addressByChain[chain]}
                balance={balances[chain]}
                isLoadingAddress={isLoadingAddresses}
                isRefreshingBalance={refreshingChains.has(chain)}
                onRefresh={(c) => void fetchBalance(c)}
                locale={locale}
              />
            ))}
          </div>
        )}

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-muted-foreground">
          {t(locale, "vault.autoRefreshNote")}
        </p>
      </div>
    </div>
  );
}
