import type { TradeToken } from "../../backend.d";
import { cn } from "../../lib/utils";

interface TokenChipProps {
  token: TradeToken | string;
  size?: "sm" | "md";
  className?: string;
}

// USDT variants — green family; USDC variants — blue family
const TOKEN_COLORS: Record<string, string> = {
  USDT_TRC20:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  USDT_BEP20:
    "bg-green-500/15 text-green-700 dark:text-green-200 border-green-500/30",
  USDT_ERC20:
    "bg-teal-500/15 text-teal-700 dark:text-teal-200 border-teal-500/30",
  USDC_SPL: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/30",
  USDC_ERC20:
    "bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30",
  USDC_BEP20:
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border-indigo-500/30",
  USDC_POLYGON:
    "bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-500/30",
};

// Human-readable "CURRENCY · NETWORK" labels
const TOKEN_DISPLAY: Record<string, string> = {
  USDT_TRC20: "USDT · TRC20",
  USDT_BEP20: "USDT · BEP20",
  USDT_ERC20: "USDT · ERC20",
  USDC_SPL: "USDC · Solana",
  USDC_ERC20: "USDC · ERC20",
  USDC_BEP20: "USDC · BEP20",
  USDC_POLYGON: "USDC · Polygon",
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export default function TokenChip({
  token,
  size = "md",
  className,
}: TokenChipProps) {
  const tokenStr = typeof token === "string" ? token : String(token);
  const colorClass =
    TOKEN_COLORS[tokenStr] ??
    "bg-secondary/50 text-secondary-foreground border-border";
  const label = TOKEN_DISPLAY[tokenStr] ?? tokenStr;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono font-medium",
        SIZE_CLASSES[size],
        colorClass,
        className,
      )}
      data-ocid="token-chip"
    >
      <span className="opacity-70 text-[10px]" aria-hidden>
        ₮
      </span>
      <span>{label}</span>
    </span>
  );
}
