# ORCHESTRATION_PLAN - Cycle 1 - AUDIT

project: CryptoMarket P2P
cycle: 1
phase: AUDIT
timestamp: 2026-05-24T07:56:00Z

## Context

- Repository: /Volumes/workspace-drive/projects/other/cryptomarket-p2p
- Caffeine alias: cryptomarket-p2p
- Caffeine project ID: 019d6be7-8226-74ba-bbb3-9aca974e04f3
- Scope: entire codebase

## Wave Goal

Find actionable defects across backend, frontend, security, tests, ICP contracts, Caffeine verification, docs, dependencies, and edge cases. Every accepted finding must include location, evidence, suggested fix, and owner.

## Parallel Audit Domains

| # | Agent | Domain | Focus |
|---|---|---|---|
| 1 | audit-backend-icp | backend-icp | Motoko, state, async safety, canister APIs |
| 2 | audit-security | security | auth, secrets, access control, injection, wallet safety |
| 3 | audit-frontend-ux | frontend-ui | React routes, forms, auth UX, accessibility |
| 4 | audit-api-contracts | api-contracts | frontend/backend typing, candid bindings, error handling |
| 5 | audit-tests-ci | tests-ci | test gaps, scripts, CI/quality gates |
| 6 | audit-performance-nfr | performance-nfr | bundle, polling, storage, scalability |
| 7 | audit-docs-product | docs-product | product contract, docs drift, launch promises |
| 8 | audit-deps-supply | deps-supply | dependencies, build config, supply chain |

## Transition Criteria

- AUDIT -> AGGREGATE: all audit domains return structured findings or explicit zero-finding evidence.
- AGGREGATE -> FIX: every deduplicated finding has a fix owner and non-conflicting wave assignment.
- FIX -> VERIFY: every finding has fix_status.
- VERIFY -> DONE: no failed verifications and no new findings.
