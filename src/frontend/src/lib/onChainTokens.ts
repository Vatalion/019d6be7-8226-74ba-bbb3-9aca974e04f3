import { TradeToken } from "@/backend.d";

/** ICRC-1 tokens that use initiateOnChainTrade + canister escrow lock. */
export function isOnChainToken(token: TradeToken | string): boolean {
  return token === TradeToken.ckUSDC || token === TradeToken.ckUSDT;
}

/** Wave 3 manual ERC20 settlement (E4.S8 / D-044). */
export function isErc20ManualToken(token: TradeToken | string): boolean {
  return token === TradeToken.USDT_ERC20 || token === TradeToken.USDC_ERC20;
}

export function ledgerCanisterIdForToken(
  token: TradeToken,
  ckUsdcLedgerId: string,
  ckUsdtLedgerId: string,
): string | null {
  if (token === TradeToken.ckUSDC) return ckUsdcLedgerId;
  if (token === TradeToken.ckUSDT) return ckUsdtLedgerId;
  return null;
}

export interface PlatformFlags {
  trustlessEscrowEnabled: boolean;
  ckUsdcLedgerId: string;
  ckUsdtLedgerId: string;
}
