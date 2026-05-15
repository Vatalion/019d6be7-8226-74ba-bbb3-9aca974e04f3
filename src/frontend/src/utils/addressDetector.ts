// Address detection utilities for crypto wallet addresses.
// Supports TRC20 (Tron), EVM (BEP20/ERC20/Polygon/Avalanche), and SPL (Solana).

export const ADDRESS_PATTERNS = {
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  EVM: /^0x[a-fA-F0-9]{40}$/,
  SPL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
} as const;

export interface DetectedNetwork {
  token: string;
  label: string;
}

/**
 * Detect the network of a crypto address by regex pattern.
 * Returns the most likely token and a human-readable label, or null if no match.
 * Order matters: TRC20 first (starts with T), then EVM (0x prefix), then SPL.
 */
export function detectAddressNetwork(address: string): DetectedNetwork | null {
  const trimmed = address.trim();
  if (!trimmed) return null;

  if (ADDRESS_PATTERNS.TRC20.test(trimmed)) {
    return { token: "USDT_TRC20", label: "USDT-TRC20 (Tron)" };
  }
  if (ADDRESS_PATTERNS.EVM.test(trimmed)) {
    return { token: "USDT_BEP20", label: "USDT-BEP20 (BSC)" };
  }
  if (ADDRESS_PATTERNS.SPL.test(trimmed)) {
    return { token: "USDC_SPL", label: "USDC-SPL (Solana)" };
  }
  return null;
}

export interface NetworkHint {
  hint: string;
  validate: (address: string) => boolean;
}

const evmHint = (label: string): NetworkHint => ({
  hint: `${label}: Standard 0x... Ethereum-compatible address (42 chars).`,
  validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
});

export const NETWORK_HINTS: Record<string, NetworkHint> = {
  USDT_TRC20: {
    hint: "USDT-TRC20: Address must start with 'T' and be 34 characters long.",
    validate: (addr) => ADDRESS_PATTERNS.TRC20.test(addr.trim()),
  },
  USDT_BEP20: evmHint("USDT-BEP20"),
  USDT_ERC20: {
    hint: "USDT-ERC20: Standard 0x... Ethereum address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDC_ERC20: {
    hint: "USDC-ERC20: Standard 0x... Ethereum address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDC_BEP20: evmHint("USDC-BEP20"),
  USDC_POLYGON: {
    hint: "USDC-Polygon: Standard 0x... Polygon-compatible address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDT_POLYGON: {
    hint: "USDT-Polygon: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDT_AVAX: {
    hint: "USDT-Avalanche: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDC_AVAX: {
    hint: "USDC-Avalanche: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim()),
  },
  USDC_SPL: {
    hint: "USDC-SPL: Solana base58-encoded address (32–44 chars).",
    validate: (addr) => ADDRESS_PATTERNS.SPL.test(addr.trim()),
  },
};

/** All supported token identifiers in display order. */
export const SUPPORTED_TOKENS = [
  "USDT_TRC20",
  "USDT_BEP20",
  "USDT_ERC20",
  "USDC_ERC20",
  "USDC_SPL",
  "USDC_BEP20",
  "USDC_POLYGON",
  "USDT_POLYGON",
  "USDT_AVAX",
  "USDC_AVAX",
] as const;

export type SupportedToken = (typeof SUPPORTED_TOKENS)[number];

/** Human-readable token labels for the dropdown. */
export const TOKEN_LABELS: Record<string, string> = {
  USDT_TRC20: "USDT-TRC20 (Tron)",
  USDT_BEP20: "USDT-BEP20 (BSC)",
  USDT_ERC20: "USDT-ERC20 (Ethereum)",
  USDC_ERC20: "USDC-ERC20 (Ethereum)",
  USDC_SPL: "USDC-SPL (Solana)",
  USDC_BEP20: "USDC-BEP20 (BSC)",
  USDC_POLYGON: "USDC-Polygon",
  USDT_POLYGON: "USDT-Polygon",
  USDT_AVAX: "USDT-Avalanche",
  USDC_AVAX: "USDC-Avalanche",
};
