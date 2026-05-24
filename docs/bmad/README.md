# BMAD documentation — CryptoMarket P2P

Canonical planning artifacts for this repo follow the **BMAD BMM** layout under `_bmad-output/planning-artifacts/`.

## Start here

| Artifact | Path | Purpose |
|----------|------|---------|
| **Product brief** | [product-brief.md](../../_bmad-output/planning-artifacts/product-brief.md) | Vision, problem, constraints |
| **PRD** | [prd.md](../../_bmad-output/planning-artifacts/prd.md) | Requirements aligned to **current** product |
| **Architecture** | [architecture.md](../../_bmad-output/planning-artifacts/architecture.md) | ICP + Caffeine + single-canister reality |
| **Epics** | [epics.md](../../_bmad-output/planning-artifacts/epics.md) | Phased delivery map (E1–E13; E10/E6 jury = built, product-deferred) |
| **UX spec** | [ux-design-spec.md](../../_bmad-output/planning-artifacts/ux-design-spec.md) | UI contract (see also `DESIGN.md`) |
| **Gap analysis** | [gap-analysis.md](../../_bmad-output/planning-artifacts/gap-analysis.md) | Vision vs built vs old PRD |
| **Traceability** | [traceability-matrix.md](../../_bmad-output/planning-artifacts/traceability-matrix.md) | FR → code → verification |
| **Audit report** | [AUDIT-REPORT.md](../../_bmad-output/planning-artifacts/AUDIT-REPORT.md) | Multi-agent audit verdict and correction log |
| **Compliance gate** | [COMPLIANCE-LAUNCH-GATE.md](../../_bmad-output/planning-artifacts/COMPLIANCE-LAUNCH-GATE.md) | Required launch compliance/counsel gate |
| **User stories** | [_bmad-output/implementation-artifacts/stories/index.md](../../_bmad-output/implementation-artifacts/stories/index.md) | BMAD BMM full stories (75) |
| **Sprint tracking** | [_bmad-output/implementation-artifacts/sprint-status.yaml](../../_bmad-output/implementation-artifacts/sprint-status.yaml) | Story status keys |
| **Migration notes** | [MIGRATION-FROM-CRYPTO_MARKET.md](./MIGRATION-FROM-CRYPTO_MARKET.md) | What was imported / excluded |

## Legacy repo

Source material: `/Volumes/workspace-drive/projects/other/crypto_market` (Flutter + multi-canister attempt).

**Do not** treat old `docs/architecture/*`, Flutter stories, or dfx runbooks as authoritative for this project.

## Engineering docs (non-BMAD)

| File | Role |
|------|------|
| `AGENTS.md` | Agent operating rules |
| `README.md` | Build and structure |
| `DESIGN.md` | Visual design tokens |
| `BACKLOG.md` | Historical epic list (being superseded by `epics.md`) |
| `ROADMAP.md` | Long-range technical roadmap |

## Caffeine execution docs (non-canonical product)

| Path | Role |
|------|------|
| Caffeine project planning state | **Historical** workstreams (April 2026) — superseded by `_bmad-output` |
| Caffeine project verification state | Golden path + flow templates (operational) |

## Updating

When product scope changes:

1. Edit `product-brief.md` and `prd.md` first.
2. Update `architecture.md` if stack or boundaries change.
3. Adjust `epics.md`, `traceability-matrix.md`, and `gap-analysis.md`.
4. Sync `OLX-PARITY.md` if marketplace parity claims change.
5. Run Caffeine verification flows from Caffeine project verification state.
