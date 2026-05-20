---
workflowType: ux-design
inputDocuments:
  - DESIGN.md
document_output_language: en
---

# UX design specification

**Canonical visual tokens:** [`DESIGN.md`](../../DESIGN.md) at repo root.

## Product UX principles

1. **OLX familiarity** — browse → card grid → detail → CTA; minimal crypto jargon on first screen.
2. **Progressive disclosure** — network/token selection only when creating listing or paying.
3. **Honest payment UX** — show steps: send → confirm sent → seller confirms (Phase 1).
4. **Pseudonymity** — show username and reputation, not legal identity.
5. **Bilingual** — UK default-friendly; EN parity in `i18n/index.ts`.

## Key surfaces

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Hero, featured listings, 4-token strip | Live |
| `/listings` | Search/filter | Live |
| `/listings/:id` | Detail + buy | Live |
| `/listings/create` | Multi-step create | Live |
| `/trades/:id` | Payment + chat + dispute | Live |
| `/admin` | Ops | Live |
| `/governance`, `/vault`, `/jurors` | Deferred product | Hidden/low priority |

## Phase 1 UX locks

- **Physical delivery:** only self-pickup (`deliveryPolicy.ts`).
- **Tokens:** four approved networks on marketing surfaces.

## Flows for QA (Caffeine)

See caffeine-cli project `.caf/projects/cryptomarket-p2p--.../verification/flow-templates.json`.

Authenticated flows require II profile bootstrap (headed).

## Excluded from old UX docs

- Flutter widget keys, Patrol tests, mobile navigation patterns from `crypto_market/docs/ux-ui/`.
- Carrier comparison 3-column grid as **default** path (deferred).

## UX debt

| Item | Priority |
|------|----------|
| Trade page copy vs manual settlement | P0 |
| Create listing length/complexity | P1 |
| Filter URL sync | P2 |
| WCAG pass | P3 |
