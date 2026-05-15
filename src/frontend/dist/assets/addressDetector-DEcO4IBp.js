import { c as createLucideIcon } from "./index-BWWoZgQl.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ]
];
const Shield = createLucideIcon("shield", __iconNode);
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
  Shield as S,
  TOKEN_LABELS as T,
  SUPPORTED_TOKENS as a,
  detectAddressNetwork as d
};
