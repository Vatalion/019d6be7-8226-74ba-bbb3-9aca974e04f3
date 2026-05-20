const ADDRESS_PATTERNS = {
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  EVM: /^0x[a-fA-F0-9]{40}$/,
  SPL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
};
function detectAddressNetwork(address) {
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
const evmHint = (label) => ({
  hint: `${label}: Standard 0x... Ethereum-compatible address (42 chars).`,
  validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
});
const NETWORK_HINTS = {
  USDT_TRC20: {
    hint: "USDT-TRC20: Address must start with 'T' and be 34 characters long.",
    validate: (addr) => ADDRESS_PATTERNS.TRC20.test(addr.trim())
  },
  USDT_BEP20: evmHint("USDT-BEP20"),
  USDT_ERC20: {
    hint: "USDT-ERC20: Standard 0x... Ethereum address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDC_ERC20: {
    hint: "USDC-ERC20: Standard 0x... Ethereum address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDC_BEP20: evmHint("USDC-BEP20"),
  USDC_POLYGON: {
    hint: "USDC-Polygon: Standard 0x... Polygon-compatible address (42 chars).",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDT_POLYGON: {
    hint: "USDT-Polygon: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDT_AVAX: {
    hint: "USDT-Avalanche: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDC_AVAX: {
    hint: "USDC-Avalanche: Standard 0x... Ethereum-compatible address.",
    validate: (addr) => ADDRESS_PATTERNS.EVM.test(addr.trim())
  },
  USDC_SPL: {
    hint: "USDC-SPL: Solana base58-encoded address (32–44 chars).",
    validate: (addr) => ADDRESS_PATTERNS.SPL.test(addr.trim())
  }
};
const SUPPORTED_TOKENS = [
  "USDT_TRC20",
  "USDT_BEP20",
  "USDT_ERC20",
  "USDC_ERC20",
  "USDC_SPL",
  "USDC_BEP20",
  "USDC_POLYGON",
  "USDT_POLYGON",
  "USDT_AVAX",
  "USDC_AVAX"
];
const TOKEN_LABELS = {
  USDT_TRC20: "USDT-TRC20 (Tron)",
  USDT_BEP20: "USDT-BEP20 (BSC)",
  USDT_ERC20: "USDT-ERC20 (Ethereum)",
  USDC_ERC20: "USDC-ERC20 (Ethereum)",
  USDC_SPL: "USDC-SPL (Solana)",
  USDC_BEP20: "USDC-BEP20 (BSC)",
  USDC_POLYGON: "USDC-Polygon",
  USDT_POLYGON: "USDT-Polygon",
  USDT_AVAX: "USDT-Avalanche",
  USDC_AVAX: "USDC-Avalanche"
};
export {
  NETWORK_HINTS as N,
  SUPPORTED_TOKENS as S,
  TOKEN_LABELS as T,
  detectAddressNetwork as d
};
