import type { TradeToken } from "../backend";
import { tokenDecimals as decimalsForToken } from "./tradeFeeQuote";

const STAKE_BPS = 500;

export function tokenDecimals(token: TradeToken): number {
  return decimalsForToken(token);
}

export function minStakeMicros(token: TradeToken): bigint {
  const decimals = tokenDecimals(token);
  return 10n * 10n ** BigInt(decimals);
}

/** Parses a display price string into on-chain micro-units without Number overflow. */
export function parseDisplayPriceToChainAmount(
  displayPrice: string,
  decimals: number,
): bigint | null {
  const trimmed = displayPrice.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const [wholePart, fracPart = ""] = trimmed.split(".");
  if (wholePart.length > 1 && wholePart.startsWith("0")) return null;

  const scale = 10n ** BigInt(decimals);
  const extendedFrac = fracPart.padEnd(decimals + 1, "0");
  const roundDigit = extendedFrac.charAt(decimals) ?? "0";
  let fracMicros = BigInt(
    extendedFrac.slice(0, decimals).padEnd(decimals, "0"),
  );
  let whole = BigInt(wholePart || "0");

  if (roundDigit >= "5") {
    fracMicros += 1n;
    if (fracMicros >= scale) {
      whole += 1n;
      fracMicros -= scale;
    }
  }

  const amount = whole * scale + fracMicros;
  return amount > 0n ? amount : null;
}

/** Match CreateListingPage submit encoding (same units backend receives). */
export function listingPriceToChainAmount(
  displayPrice: string,
  token: TradeToken,
): bigint | null {
  if (!displayPrice.trim()) return null;
  return parseDisplayPriceToChainAmount(displayPrice, tokenDecimals(token));
}

/** Converts on-chain price micro-units back to a display string for form inputs. */
export function chainAmountToDisplayPrice(
  chainAmount: bigint,
  token: TradeToken,
): string {
  return formatStakeMicros(chainAmount, token);
}

/** Client-side mirror of Stake.requiredStakeForToken (display only). */
export function requiredListingStakeMicros(
  priceAmount: bigint,
  token: TradeToken,
): bigint {
  const pct = (priceAmount * BigInt(STAKE_BPS)) / 10_000n;
  const floor = minStakeMicros(token);
  return pct > floor ? pct : floor;
}

export function formatStakeMicros(amount: bigint, token: TradeToken): string {
  const decimals = tokenDecimals(token);
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
}
