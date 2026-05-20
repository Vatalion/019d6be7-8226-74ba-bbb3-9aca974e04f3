# CryptoMarket P2P

A decentralized peer-to-peer marketplace for buying and selling goods using stablecoins (USDT/USDC), built on the Internet Computer.

**Current state:** Draft v63 | Live v43 | 12 of 13 gap-closure workstreams complete.

**Product documentation (BMAD):** [docs/bmad/README.md](docs/bmad/README.md) — canonical PRD, architecture, epics, and gap analysis under `_bmad-output/planning-artifacts/`.

---

## Overview

CryptoMarket P2P is an OLX-style classifieds platform where all payments are made in major stablecoins on TRC20, BEP20, ERC20, SPL, Polygon, and Avalanche networks. The platform uses a hybrid escrow model: Phase 1 is user-confirmed P2P payment; Phase 3 targets full on-chain escrow via ICRC-1 and threshold ECDSA.

Authentication is via Internet Identity only. No email/password, no third-party OAuth.

---

## Key Features

| Feature | Description |
|---|---|
| Stablecoin P2P trades | USDT/USDC on TRC20, BEP20, ERC20, SPL, Polygon, Avalanche |
| Escrow & dispute resolution | Canister-based escrow with jury voting, 72h timelock, auto-resolution |
| Multi-carrier shipping | Nova Poshta, Ukrposhta, Meest — trade-scoped waybill creation with retry logic |
| Digital goods delivery | Atomic URL reveal at trade completion with 24h inspection window |
| Price oracle | CoinGecko HTTPS outcall with 5-minute TTL cache |
| Address verification | Level 2 on-chain verification via blockchain explorer APIs |
| Vault address derivation | Base58 Solana, base58check Tron, deterministic per-principal |
| Observability | P95 latency, error rate, volume graphs, canister health in admin dashboard |
| Security hardening | Anonymous guards, rate limiting, reentrancy protection, input validation |
| Notifications | 30s polling, toast alerts, navigation badge counters, deadline warnings |

---

## Tech Stack

- **Backend:** Motoko canisters on the Internet Computer
- **Auth:** Internet Identity (`ic-use-internet-identity`)
- **Payments:** Stablecoins only — USDT/USDC across 6 networks
- **Shipping:** Nova Poshta, Ukrposhta, Meest via HTTPS outcalls
- **External APIs:** CoinGecko (rates), BSCScan/Etherscan/PolygonScan/TronGrid/Solana RPC (address verification)

> **Note:** Tech stack specifics (React, TypeScript, Tailwind) are intentionally omitted from planning and architecture documentation per project convention.

---

## Build & Run

### Prerequisites
- Node.js ≥ 22
- `mops` CLI (`npm install -g mops`)
- `pnpm` (`npm install -g pnpm`)

### Backend
```bash
# Type-check Motoko
mops build

# Auto-fix common issues
mops check --fix
```

### Frontend
```bash
# Install dependencies
pnpm install

# Type-check TypeScript
pnpm typecheck

# Build for production
pnpm build

# Auto-fix lint issues
pnpm fix
```

---

## Project Structure

```
src/
  backend/
    main.mo              # Persistent actor composition root
    types.mo             # Shared types (listings, trades, disputes, shipping)
    lib/                 # Domain modules (Auth, Escrow, Disputes, Shipping, ...)
    mixins/              # Public API endpoints (*-api.mo)
  frontend/
    src/
      backend.d.ts       # Generated Candid TypeScript types
      backend.ts         # Actor wrapper + helper utilities
      i18n/index.ts      # Ukrainian + English translations
      components/        # Reusable UI components
      pages/             # Route-level page components
      contexts/          # React context providers (Notifications, Auth)
```

---

## Development Conventions

- **No `mo:base/*` imports** — use `mo:core/*` only
- **No `stable var`** in persistent actors — redundant, causes warnings
- **No `preupgrade`/`postupgrade` hooks** — not needed with persistent actor pattern
- **No fiat payments** — stablecoins only
- **No BTC, ETH, ICP as payment methods** — stablecoins only (USDT/USDC)
- **Backend canister ID** — always loaded from `/env.json` at runtime, never hardcoded
- **Shipping API calls** — always route through canister HTTPS outcalls, never from React directly
- **All new public update functions** — must have `assertNotAnonymous(caller)` guard

---

## Deferred / Roadmap

The following features are planned but not yet implemented:
- HTLC atomic swap — trustless cross-chain escrow (Phase 3)
- WalletConnect v2 — multi-wallet support beyond Internet Identity
- International shipping carriers — DHL, UPS, FedEx (currently Ukraine-only: Nova Poshta, Ukrposhta, Meest)
- Full on-chain escrow — ICRC-1 standard + threshold ECDSA (Phase 3)
- DAO governance — treasury management, proposal voting
- KYC/AML module — modular compliance layer
- EVM full address derivation — Keccak-256 (currently simplified deterministic derivation)

See [ROADMAP.md](./ROADMAP.md) for the full gap-closure workstream status.

---

## Contributing

Read `AGENTS.md` and `ICP-SKILLS.md` in the project root before making any changes. All ICP-specific skills must be loaded from the official skills index before implementing any ICP functionality.
