import type { TradeFeeQuote, TradeToken } from "@/backend.d";

export const TOKEN_DECIMALS: Record<string, number> = {
  ckUSDC: 6,
  ckUSDT: 6,
  USDT_TRC20: 6,
  USDT_BEP20: 18,
  USDC_SPL: 6,
  USDT_ERC20: 6,
  USDC_ERC20: 6,
  USDT_POLYGON: 6,
  USDC_POLYGON: 6,
  USDT_AVAX: 6,
  USDC_AVAX: 6,
};

export function tokenKey(token: TradeToken | string): string {
  if (typeof token === "string") return token;
  if (typeof token === "object" && token !== null) {
    const keys = Object.keys(token);
    if (keys.length > 0) return keys[0]!;
  }
  return String(token);
}

export function tokenDecimals(token?: TradeToken | string): number {
  if (!token) return 6;
  return TOKEN_DECIMALS[tokenKey(token)] ?? 6;
}

export function chainAmountToNumber(
  amount: bigint,
  token?: TradeToken | string,
): number {
  const decimals = tokenDecimals(token);
  return Number(amount) / 10 ** decimals;
}

/** Formats on-chain token micro-units as a USD-style price string. */
export function formatTokenAmount(amount: bigint, token?: TradeToken): string {
  const n = chainAmountToNumber(amount, token);
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats on-chain token micro-units with a token label suffix. */
export function formatTokenAmountLabel(
  amount: bigint,
  token: TradeToken | string,
  label?: string,
): string {
  const n = chainAmountToNumber(amount, token);
  const formatted =
    n % 1 === 0 ? n.toFixed(0) : n.toFixed(n < 0.01 ? 6 : n < 1 ? 4 : 2);
  const suffix = label ?? tokenKey(token);
  return `${formatted} ${suffix}`;
}

export function formatFeeBpsPercent(bps: bigint | number): string {
  const n = typeof bps === "bigint" ? Number(bps) : bps;
  const pct = n / 100;
  return pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(2)}%`;
}

export type TradeFeeQuoteView = TradeFeeQuote & {
  itemPriceFormatted: string;
  platformFeeFormatted: string;
  totalFormatted: string;
  feePercentLabel: string;
};

export function toTradeFeeQuoteView(quote: TradeFeeQuote): TradeFeeQuoteView {
  return {
    ...quote,
    itemPriceFormatted: formatTokenAmount(quote.itemPrice, quote.token),
    platformFeeFormatted: formatTokenAmount(
      quote.platformFeeAmount,
      quote.token,
    ),
    totalFormatted: formatTokenAmount(quote.totalBuyerAmount, quote.token),
    feePercentLabel: formatFeeBpsPercent(quote.platformFeeBps),
  };
}
