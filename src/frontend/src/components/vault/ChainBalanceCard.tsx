import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { t } from "../../i18n";
import type { Locale } from "../../i18n";
import { VaultAddressDisplay } from "./VaultAddressDisplay";

// Chain metadata
const CHAIN_META: Record<
  string,
  { label: string; color: string; network: string; icon: string }
> = {
  TRC20: {
    label: "TRC20",
    color: "bg-red-500/10 text-red-600 border-red-200",
    network: "Tron",
    icon: "🔴",
  },
  BEP20: {
    label: "BEP20",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    network: "BNB Chain",
    icon: "🟡",
  },
  ERC20: {
    label: "ERC20",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    network: "Ethereum",
    icon: "🔵",
  },
  SPL: {
    label: "SPL",
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
    network: "Solana",
    icon: "🟣",
  },
  Polygon: {
    label: "Polygon",
    color: "bg-violet-500/10 text-violet-700 border-violet-200",
    network: "Polygon",
    icon: "🟪",
  },
  Avalanche: {
    label: "Avalanche",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
    network: "Avalanche",
    icon: "🟠",
  },
};

export interface VaultBalanceData {
  chain: string;
  usdtBalance: bigint;
  usdcBalance: bigint;
  lastChecked: bigint;
  error: string | null;
}

export interface VaultAddressData {
  chain: string;
  tokenSymbol: string;
  network: string;
  address: string;
  derivedAt: bigint;
}

interface ChainBalanceCardProps {
  chain: string;
  address: VaultAddressData | undefined;
  balance: VaultBalanceData | undefined;
  isLoadingAddress: boolean;
  isRefreshingBalance: boolean;
  onRefresh: (chain: string) => void;
  locale: Locale;
}

function formatBalance(raw: bigint): string {
  // Assume 6 decimals (USDT/USDC standard)
  const units = Number(raw) / 1_000_000;
  return units.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatTimestamp(ns: bigint): string {
  if (!ns || ns === 0n) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChainBalanceCard({
  chain,
  address,
  balance,
  isLoadingAddress,
  isRefreshingBalance,
  onRefresh,
  locale,
}: ChainBalanceCardProps) {
  const meta = CHAIN_META[chain] ?? {
    label: chain,
    color: "bg-muted text-muted-foreground border-border",
    network: chain,
    icon: "⚪",
  };

  const hasError = balance?.error != null && balance.error !== "";

  return (
    <Card
      className="relative overflow-hidden border-border bg-card transition-shadow hover:shadow-md"
      data-ocid={`vault-chain-card-${chain.toLowerCase()}`}
    >
      {/* Chain color stripe */}
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: "var(--primary)",
          opacity: 0.6,
        }}
      />

      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg" aria-hidden>
              {meta.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">
                  {meta.network}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${meta.color}`}
                >
                  {meta.label}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onRefresh(chain)}
            disabled={isRefreshingBalance || isLoadingAddress}
            aria-label={[t(locale, "vault.refreshBalance"), meta.label].join(
              " ",
            )}
            data-ocid={`vault-refresh-${chain.toLowerCase()}`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshingBalance ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Deposit address */}
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 font-medium">
            {t(locale, "vault.depositAddress")}
          </p>
          {isLoadingAddress ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ) : address ? (
            <VaultAddressDisplay
              address={address.address}
              locale={locale}
              data-ocid={`vault-address-${chain.toLowerCase()}`}
            />
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {t(locale, "vault.addressNotAvailable")}
            </span>
          )}
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-2">
          {/* USDT */}
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
              USDT
            </p>
            {isRefreshingBalance ? (
              <Skeleton className="h-5 w-16 rounded" />
            ) : hasError ? (
              <span className="text-xs text-destructive">—</span>
            ) : balance ? (
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatBalance(balance.usdtBalance)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

          {/* USDC */}
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
              USDC
            </p>
            {isRefreshingBalance ? (
              <Skeleton className="h-5 w-16 rounded" />
            ) : hasError ? (
              <span className="text-xs text-destructive">—</span>
            ) : balance ? (
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatBalance(balance.usdcBalance)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Error state */}
        {hasError && (
          <div className="flex items-start gap-1.5 text-destructive bg-destructive/5 rounded-md px-2 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="text-xs leading-tight">
              {t(locale, "vault.balanceError")}
            </p>
          </div>
        )}

        {/* Last updated */}
        {balance && !hasError && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              {t(locale, "vault.lastUpdated")}:{" "}
              {formatTimestamp(balance.lastChecked)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
