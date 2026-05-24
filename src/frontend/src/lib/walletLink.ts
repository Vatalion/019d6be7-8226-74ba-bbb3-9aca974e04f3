/**
 * E4.S7 — external wallet nonce-proof linking (no WalletConnect).
 * Uses injected TronLink / MetaMask for signing only.
 */

export type WalletChain = "tron" | "evm_bsc" | "evm_eth";
export type WalletLinkPurpose = "payout" | "stake" | "payment";

export interface WalletLinkChallenge {
  challengeId: bigint;
  message: string;
  expiresAt: bigint;
  sessionId: string;
  chain: WalletChain;
  address: string;
  purpose: WalletLinkPurpose;
}

export interface LinkedExternalWallet {
  id: bigint;
  chain: WalletChain;
  address: string;
  purpose: WalletLinkPurpose;
  linkedAt: bigint;
  sessionId: string;
  messageHash: string;
}

export function tokenToWalletChain(token: string): WalletChain | null {
  switch (token) {
    case "USDT_TRC20":
      return "tron";
    case "USDT_BEP20":
      return "evm_bsc";
    case "USDT_ERC20":
    case "USDC_ERC20":
      return "evm_eth";
    default:
      return null;
  }
}

export function newWalletSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

declare global {
  interface Window {
    tronWeb?: {
      ready?: boolean;
      defaultAddress?: { base58?: string };
      trx?: {
        signMessageV2?: (message: string) => Promise<string>;
      };
    };
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
    };
  }
}

export async function signWalletLinkMessage(
  chain: WalletChain,
  address: string,
  message: string,
): Promise<string> {
  if (chain === "tron") {
    const tw = window.tronWeb;
    if (!tw?.trx?.signMessageV2) {
      throw new Error("TronLink not available — install TronLink to sign.");
    }
    return tw.trx.signMessageV2(message);
  }

  const eth = window.ethereum;
  if (!eth) {
    throw new Error("No EVM wallet — install MetaMask or similar.");
  }

  const accounts = (await eth.request({
    method: "eth_requestAccounts",
  })) as string[];
  const active = accounts[0]?.toLowerCase();
  if (active && active !== address.toLowerCase()) {
    throw new Error(
      "Active wallet address does not match the address you entered.",
    );
  }

  return (await eth.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;
}

export function walletChainToCandid(
  chain: WalletChain,
): { tron: null } | { evm_bsc: null } | { evm_eth: null } {
  switch (chain) {
    case "tron":
      return { tron: null };
    case "evm_bsc":
      return { evm_bsc: null };
    case "evm_eth":
      return { evm_eth: null };
  }
}

export function walletPurposeToCandid(
  purpose: WalletLinkPurpose,
): { payout: null } | { stake: null } | { payment: null } {
  switch (purpose) {
    case "payout":
      return { payout: null };
    case "stake":
      return { stake: null };
    case "payment":
      return { payment: null };
  }
}
