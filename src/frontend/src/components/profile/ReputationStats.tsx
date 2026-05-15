import type { ReputationStats as ReputationStatsData } from "@/backend.d";
import { TrustLevel } from "@/backend.d";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { useLocale } from "../../hooks/useLocale";

interface ReputationStatsProps {
  stats: ReputationStatsData | null | undefined;
  isLoading?: boolean;
}

const STAR_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;
const SKELETON_KEYS = [
  "sk-trades",
  "sk-rating",
  "sk-trust",
  "sk-disputes",
] as const;

function StarRating({
  value,
  ariaLabel,
}: { value: number; ariaLabel: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={ariaLabel}>
      {STAR_KEYS.map((key, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        return (
          <Star
            key={key}
            className={`h-3.5 w-3.5 ${
              filled
                ? "fill-accent text-accent"
                : partial
                  ? "fill-accent/40 text-accent"
                  : "text-muted-foreground/30"
            }`}
          />
        );
      })}
    </div>
  );
}

function trustLevelClass(level: TrustLevel): string {
  switch (level) {
    case TrustLevel.gold:
      return "badge-tier-gold";
    case TrustLevel.silver:
      return "badge-tier-silver";
    case TrustLevel.bronze:
      return "badge-tier-bronze";
    default:
      return "badge-tier-new";
  }
}

export function ReputationStats({ stats, isLoading }: ReputationStatsProps) {
  const { t } = useLocale();

  function trustLevelLabel(level: TrustLevel): string {
    switch (level) {
      case TrustLevel.gold:
        return t("trust.tier.gold");
      case TrustLevel.silver:
        return t("trust.tier.silver");
      case TrustLevel.bronze:
        return t("trust.tier.bronze");
      default:
        return t("trust.tier.new");
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="card-elevated p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const completedTrades = stats ? Number(stats.completedTrades) : 0;
  const avgRating = stats?.averageRating ?? 0;
  const trustLevel = stats?.trustLevel ?? TrustLevel.new_;
  const disputeRate = stats?.disputeRate ?? 0;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      data-ocid="reputation-stats"
    >
      {/* Completed Trades */}
      <div className="card-elevated p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          {t("reputation.completedTrades")}
        </div>
        <p
          className="text-2xl font-bold text-foreground"
          data-ocid="stat-trades"
        >
          {completedTrades}
        </p>
      </div>

      {/* Average Rating */}
      <div className="card-elevated p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Star className="h-3.5 w-3.5" />
          {t("reputation.averageRating")}
        </div>
        <div className="flex flex-col gap-1" data-ocid="stat-rating">
          <p className="text-2xl font-bold text-foreground">
            {avgRating.toFixed(1)}
          </p>
          <StarRating
            value={avgRating}
            ariaLabel={t("reputation.ratingAriaLabel").replace(
              "{value}",
              avgRating.toFixed(1),
            )}
          />
        </div>
      </div>

      {/* Trust Level */}
      <div className="card-elevated p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("reputation.trustLevel")}
        </div>
        <div className="flex items-center" data-ocid="stat-trust">
          <span className={`${trustLevelClass(trustLevel)} text-sm`}>
            {trustLevelLabel(trustLevel)}
          </span>
        </div>
      </div>

      {/* Dispute Rate */}
      <div className="card-elevated p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("reputation.disputeRate")}
        </div>
        <p
          className={`text-2xl font-bold ${
            disputeRate > 5 ? "text-destructive" : "text-foreground"
          }`}
          data-ocid="stat-dispute-rate"
        >
          {disputeRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
