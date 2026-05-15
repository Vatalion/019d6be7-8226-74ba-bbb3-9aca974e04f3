import { Award, Medal, Shield, Star } from "lucide-react";
import type { TrustLevel } from "../../backend.d";
import { detectLocale, t } from "../../i18n";
import { cn } from "../../lib/utils";

interface TrustBadgeProps {
  level: TrustLevel | "new" | "bronze" | "silver" | "gold";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const TRUST_CONFIG = {
  new: {
    labelKey: "trust.tier.new" as const,
    icon: Shield,
    className: "badge-tier-new",
    iconColor: "text-muted-foreground",
  },
  bronze: {
    labelKey: "trust.tier.bronze" as const,
    icon: Medal,
    className: "badge-tier-bronze",
    iconColor: "text-orange-700 dark:text-orange-200",
  },
  silver: {
    labelKey: "trust.tier.silver" as const,
    icon: Star,
    className: "badge-tier-silver",
    iconColor: "text-slate-600 dark:text-slate-200",
  },
  gold: {
    labelKey: "trust.tier.gold" as const,
    icon: Award,
    className: "badge-tier-gold",
    iconColor: "text-yellow-700 dark:text-yellow-200",
  },
} as const;

const SIZE_CONFIG = {
  sm: { icon: "h-3 w-3", text: "text-[10px]", padding: "px-1.5 py-0.5" },
  md: { icon: "h-3.5 w-3.5", text: "text-xs", padding: "px-2 py-1" },
  lg: { icon: "h-4 w-4", text: "text-sm", padding: "px-3 py-1.5" },
};

export default function TrustBadge({
  level,
  size = "md",
  showLabel = true,
  className,
}: TrustBadgeProps) {
  const locale = detectLocale();
  // Normalize level key (backend may use "new_" for "new")
  const key = (
    String(level) === "new_" ? "new" : String(level)
  ) as keyof typeof TRUST_CONFIG;
  const config = TRUST_CONFIG[key] ?? TRUST_CONFIG.new;
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide",
        config.className,
        sizeConfig.padding,
        sizeConfig.text,
        className,
      )}
      data-ocid="trust-badge"
    >
      <Icon className={cn(sizeConfig.icon, config.iconColor)} aria-hidden />
      {showLabel && <span>{t(locale, config.labelKey)}</span>}
    </span>
  );
}
