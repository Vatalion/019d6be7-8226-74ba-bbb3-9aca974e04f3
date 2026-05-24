import {
  InsuranceCopyTier,
  type ProtectionView,
  type TradeToken,
} from "@/backend.d";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { useQuery } from "@tanstack/react-query";
import { Info, ShieldAlert, ShieldCheck } from "lucide-react";

function tierKey(view: ProtectionView): InsuranceCopyTier {
  return view.tier;
}

const TIER_STYLES: Record<
  InsuranceCopyTier,
  { border: string; bg: string; icon: typeof ShieldCheck }
> = {
  stake_only: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    icon: ShieldAlert,
  },
  no_guarantee: {
    border: "border-border",
    bg: "bg-muted/40",
    icon: Info,
  },
  capped_reserve: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    icon: ShieldCheck,
  },
};

type BuyerProtectionBadgeProps = {
  tradeAmountE8s: bigint;
  tradeToken: TradeToken;
  compact?: boolean;
};

export function BuyerProtectionBadge({
  tradeAmountE8s,
  tradeToken,
  compact = false,
}: BuyerProtectionBadgeProps) {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();

  const { data: view } = useQuery({
    queryKey: ["insuranceProtection", tradeAmountE8s.toString(), tradeToken],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getInsuranceProtectionView(tradeAmountE8s, tradeToken);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  if (!view) return null;

  const tier = tierKey(view);
  const styles = TIER_STYLES[tier];
  const Icon = styles.icon;
  const title =
    tier === InsuranceCopyTier.stake_only
      ? t("insurance.protection.stake_only.title")
      : tier === InsuranceCopyTier.no_guarantee
        ? t("insurance.protection.no_guarantee.title")
        : t("insurance.protection.capped_reserve.title");
  const body =
    tier === InsuranceCopyTier.stake_only
      ? t("insurance.protection.stake_only.body")
      : tier === InsuranceCopyTier.no_guarantee
        ? t("insurance.protection.no_guarantee.body")
        : t("insurance.protection.capped_reserve.body");

  return (
    <div
      className={`rounded-lg border p-4 flex gap-3 ${styles.border} ${styles.bg}`}
      data-ocid={`buyer-protection-${tier}`}
    >
      <Icon className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
