---
stepsCompleted: [1]
workflowType: product-brief
sourceDocuments:
  - docs/bmad/MIGRATION-FROM-CRYPTO_MARKET.md
  - owner-input-2026-05-19
document_output_language: en
---

# Product Brief — CryptoMarket P2P

## One-liner

**OLX for goods, settled in stablecoins** — pseudonymous users trade physical and digital items peer-to-peer on the Internet Computer, without the platform turning crypto into fiat.

## Problem

1. **Commerce friction:** In Ukraine (and similar markets), using crypto often implies converting to fiat for everyday purchases, which triggers conversion taxes and extra steps users want to avoid.
2. **Trust gap:** P2P goods trade needs escrow-like safety without a centralized custodian holding user funds.
3. **Market gap:** Classifieds (OLX-style) are familiar; crypto-native goods marketplaces that stay **goods-first** and **stablecoin-only** are rare.

## Solution

A web marketplace where:

- Sellers post listings (photos, price in crypto, delivery method).
- Buyers open a trade, pay the seller **directly in stablecoins** on supported chains.
- The **platform enforces process** (timeouts, chat, disputes, reputation) even when custody is still off-chain in early phases.

## Target users

| Persona | Goal |
|---------|------|
| **Buyer** | Find item, pay in USDT/USDC, get goods with recourse if something goes wrong |
| **Seller** | List item, receive crypto, ship or hand over goods |
| **Moderator** | Resolve disputes when parties disagree (Phase 1–2) |
| **Power user / Juror** | Optional community dispute layer (deferred product surface) |

## Core principles (non-negotiable)

1. **Goods marketplace first** — not a DEX, not a crypto-for-crypto swap desk.
2. **Stablecoins only** on platform — USDT/USDC on approved networks; no fiat rails, no ICP-native payment tokens in product scope.
3. **Pseudonymity** — Internet Identity + profile handle; no mandatory real-world identity for MVP.
4. **Honest phasing** — do not market “trustless escrow” until funds are actually locked by protocol rules.
5. **Platform-mediated trust** — deadlines, state machine, disputes, and reputation are first-class.

## What success looks like (12 months)

- Users complete **listing → trade → payment → fulfillment** without support for the happy path.
- Dispute rate and resolution time within defined KPIs (see PRD).
- Clear upgrade path to **verified payments** and/or **on-chain escrow** without rewriting the product story.

## Out of scope (product)

- Fiat on/off ramps, card processing, bank transfers as payment methods.
- Full DAO treasury governance as a user-facing launch feature.
- International carrier matrix before one fulfillment path is proven (Ukraine wedge optional).
- Mandatory KYC for all users (optional tiers may come later).

## Technical anchor (current)

- **Host:** [Caffeine.ai](https://caffeine.ai) — project `CryptoMarket P2P`
- **Stack:** Motoko backend canister + React frontend, II auth
- **Repo:** `cryptomarket-p2p` (GitHub `Vatalion/cryptomarket-p2p-v2`)
