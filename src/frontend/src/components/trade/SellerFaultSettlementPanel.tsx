import type { SellerFaultSettlementView } from "@/backend.d";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

type SettlementCopyTier =
  | "manual_restriction_only"
  | "partial_recovery"
  | "on_chain_recovery";

function copyTierKey(view: SellerFaultSettlementView): SettlementCopyTier {
  return view.copyTier as SettlementCopyTier;
}

const TIER_STYLES: Record<
  SettlementCopyTier,
  { border: string; bg: string; icon: typeof ShieldCheck }
> = {
  manual_restriction_only: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    icon: AlertTriangle,
  },
  partial_recovery: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    icon: Info,
  },
  on_chain_recovery: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    icon: ShieldCheck,
  },
};

type SellerFaultSettlementPanelProps = {
  tradeId: bigint;
};

export function SellerFaultSettlementPanel({
  tradeId,
}: SellerFaultSettlementPanelProps) {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();

  const { data: view } = useQuery({
    queryKey: ["sellerFaultSettlement", tradeId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getSellerFaultSettlementView(tradeId);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  if (!view) return null;

  const tier = copyTierKey(view);
  const styles = TIER_STYLES[tier];
  const Icon = styles.icon;
  const title = t(`waterfall.settlement.${tier}.title`);
  const body = t(`waterfall.settlement.${tier}.body`);

  return (
    <div
      className={`rounded-lg border p-4 flex gap-3 ${styles.border} ${styles.bg}`}
      data-ocid={`seller-fault-settlement-${tier}`}
    >
      <Icon className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
        {view.onChainRefundExpected && tier !== "manual_restriction_only" && (
          <p className="text-xs text-muted-foreground">
            {t("waterfall.settlement.on_chain_refund_note")}
          </p>
        )}
        {view.residualCents > 0n && (
          <p className="text-xs text-muted-foreground">
            {t("waterfall.settlement.residual_note")}
          </p>
        )}
      </div>
    </div>
  );
}
