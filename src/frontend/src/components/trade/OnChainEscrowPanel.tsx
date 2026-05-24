import type { TradeView } from "@/backend.d";
import { TradeStatus } from "@/backend.d";
import { useLocale } from "@/hooks/useLocale";
import { isOnChainToken } from "@/lib/onChainTokens";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

export function isOnChainEscrowTrade(trade: TradeView): boolean {
  return trade.escrowAccount != null || isOnChainToken(String(trade.token));
}

interface OnChainEscrowPanelProps {
  trade: TradeView;
  isBuyer: boolean;
}

export function OnChainEscrowPanel({
  trade,
  isBuyer,
}: OnChainEscrowPanelProps) {
  const { t: tl } = useLocale();

  if (!isOnChainEscrowTrade(trade)) return null;

  const locked =
    trade.status === TradeStatus.funded ||
    trade.status === TradeStatus.buyer_confirmed ||
    trade.status === TradeStatus.payment_verified ||
    trade.status === TradeStatus.complete;

  return (
    <div
      className="rounded-lg border border-emerald-500/40 bg-emerald-500/8 p-4 space-y-2"
      data-ocid="on-chain-escrow-panel"
    >
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <p className="text-sm font-semibold">{tl("trade.onChain.title")}</p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {locked
          ? tl("trade.onChain.lockedBody")
          : isBuyer
            ? tl("trade.onChain.buyerPending")
            : tl("trade.onChain.sellerPending")}
      </p>
      {locked && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <Lock className="w-3.5 h-3.5" />
          <span>{tl("trade.onChain.lockedBadge")}</span>
        </div>
      )}
      {trade.status === TradeStatus.complete && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{tl("trade.onChain.released")}</span>
        </div>
      )}
      <Link
        to="/how-payments-work"
        className="text-xs text-accent hover:underline inline-block"
        data-ocid="on-chain-escrow-guide-link"
      >
        {tl("paymentsGuide.learnMore")} →
      </Link>
    </div>
  );
}

/** Secondary manual-payment notice — only for off-chain tokens. */
export function ManualPaymentNotice() {
  const { t: tl } = useLocale();
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
      data-ocid="manual-payment-secondary-notice"
    >
      {tl("trade.manual.secondaryNotice")}
    </div>
  );
}

export function OnChainReleaseHint({ isSeller }: { isSeller: boolean }) {
  const { t: tl } = useLocale();
  if (!isSeller) return null;
  return (
    <p className="text-xs text-muted-foreground text-center px-2">
      {tl("trade.onChain.sellerReleaseHint")}
    </p>
  );
}
