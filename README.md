# CryptoMarket P2P

A decentralized peer-to-peer marketplace for buying and selling goods using stablecoins (USDT/USDC), built on the Internet Computer.

**Current state:** See [epics.md](_bmad-output/planning-artifacts/epics.md), [traceability-matrix.md](_bmad-output/planning-artifacts/traceability-matrix.md), and current Caffeine verification output for active draft/live status.

**Product documentation (BMAD):** [docs/bmad/README.md](docs/bmad/README.md) — canonical PRD, architecture, epics, and gap analysis under `_bmad-output/planning-artifacts/`.

---

## Overview

CryptoMarket P2P is an OLX-style classifieds platform. **Phase 1 (current):** wallet-to-wallet stablecoin payment with platform trade rules (not on-chain escrow). **Active product tokens:** USDT/USDC on TRC20, BEP20, ERC20 (4 networks on homepage). Phase 3 targets ICRC/ck-token escrow behind Gate C. See [epics.md](_bmad-output/planning-artifacts/epics.md) for scope.

Authentication is via Internet Identity only. No email/password, no third-party OAuth.

---

## Key Features

| Feature | Description |
|---|---|
| Stablecoin P2P trades | USDT/USDC — 4 approved networks (Phase 1); broader enums in code, trimmed in UI |
| Trade rules & disputes | Manual confirm + moderator path (Phase 1); jury/vault built but product-deferred |
| Physical fulfillment | Nova Poshta Wave 1.5 target; self-pickup stays hidden/deferred unless owner changes the product contract |
| Favorites, saved searches, inquiries | Buyer engagement (E11) — see epics |
| Digital goods delivery | Caffeine object-storage delivery with 24h inspection window |
| Price oracle | CoinGecko HTTPS outcall with 5-minute TTL cache |
| Address verification | Level 2 on-chain verification via blockchain explorer APIs |
| External wallet proof | Signed nonce proof bound to II principal; no specific wallet SDK is committed without ADR + owner approval |
| Observability | P95 latency, error rate, volume graphs, canister health in admin dashboard |
| Security hardening | Anonymous guards, rate limiting, reentrancy protection, input validation |
| Notifications | 30s polling, toast alerts, navigation badge counters, deadline warnings |

---

## Tech Stack

- **Backend:** Motoko canisters on the Internet Computer
- **Auth:** Internet Identity via `@caffeineai/core-infrastructure` `useInternetIdentity()` wrapped by `src/frontend/src/hooks/useAuth.ts`
- **Payments:** Phase 1 buyer-facing scope is four stablecoin options: USDT TRC20, USDT BEP20, USDT ERC20, and USDC ERC20. Broader backend enums and vault helpers are deferred.
- **Shipping:** Nova Poshta is the Wave 1.5 unlock; self-pickup stays hidden/deferred, and Ukrposhta/Meest remain later carrier work.
- **External APIs:** CoinGecko (rates), BSCScan/Etherscan/TronGrid for active payment verification; additional chain helpers are design-gated.

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
- Cross-chain settlement research — optional Phase 3, design-gated
- External wallet signed-nonce proof — multi-wallet support beyond Internet Identity; no specific wallet SDK is committed without ADR + owner approval
- International shipping carriers — DHL, UPS, FedEx (currently Ukraine-only: Nova Poshta, Ukrposhta, Meest)
- Full on-chain escrow — ICRC/ck-token Gate C path (Phase 3, owner-approved only)
- DAO governance — treasury management, proposal voting
- KYC/AML module — modular compliance layer
- External wallet address verification adapter — design-gated, no current EVM key-derivation dependency

See [ROADMAP.md](./ROADMAP.md) for the full gap-closure workstream status.

---

## Contributing

Read `AGENTS.md` and `ICP-SKILLS.md` in the project root before making any changes. All ICP-specific skills must be loaded from the official skills index before implementing any ICP functionality.
