import type { Principal } from "@icp-sdk/core/principal";

/**
 * Truncates a principal string to "abc...xyz" format.
 */
export function formatPrincipal(
  principal: Principal | string,
  startChars = 5,
  endChars = 4,
): string {
  const str = typeof principal === "string" ? principal : principal.toText();
  if (str.length <= startChars + endChars + 3) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Formats a raw token amount (bigint with decimals) to a human-readable string.
 * e.g. 4550000n with 6 decimals → "4.55 ckUSDC"
 */
export function formatTokenAmount(
  amount: bigint,
  symbol: string,
  decimals = 8,
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === 0n) {
    return `${whole.toString()} ${symbol}`;
  }

  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${whole.toString()}.${fractionStr} ${symbol}`;
}

/**
 * Formats an ISO timestamp string to a localized date string.
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Converts nanoseconds (bigint) to a JavaScript Date.
 */
export function formatTimestamp(nanoseconds: bigint): Date {
  return new Date(Number(nanoseconds / 1_000_000n));
}

/**
 * Returns a human-readable relative time string like "2h ago", "3d ago".
 */
export function timeAgo(date: Date | bigint): string {
  const d = typeof date === "bigint" ? formatTimestamp(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Token decimals lookup for known tokens.
 */
export const TOKEN_DECIMALS: Record<string, number> = {
  ICP: 8,
  ckBTC: 8,
  ckUSDC: 6,
  ckUSDT: 6,
  USDT_TRC20: 6,
  USDT_BEP20: 18,
  USDC_SPL: 6,
};
