# Agent Roster — CryptoMarket P2P Wave 1 Multi-Agent Orchestration

**Project root:** `/Volumes/workspace-drive/projects/other/cryptomarket-p2p`  
**State file:** `_bmad-output/implementation-artifacts/IMPLEMENTATION-CYCLE-STATE.json`  
**Runbook:** `ORCHESTRATION-RUNBOOK.md`

---

## Role → subagent mapping

| Role | Cursor/Codex subagent | `readonly` | When to spawn |
|------|----------------------|------------|---------------|
| Cycle Controller | Parent agent | — | Always — never delegate orchestration |
| Story Dev (Amelia) | `gsd-executor` | false | One story from `wave1Order` not in `completedStories` |
| AC Verifier | `explore` | **true** | Immediately after Story Dev completes |
| Audit Council ×4 | `explore` or `generalPurpose` | **true** | When all wave stories done (`currentPhase: audit`) |
| Fix Dev | `gsd-executor` | false | After audit merge (`currentPhase: fix`) |
| Re-Audit Synthesizer | `generalPurpose` | false | After fix wave (`currentPhase: re-audit`) |

---

## Story Dev spawn template

Use **one story ID** per spawn. Example for E6.S8:

```text
Task tool: subagent_type=gsd-executor, run_in_background=false

Implement story E6.S8 ONLY in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Read:
- _bmad-output/implementation-artifacts/stories/e06-disputes/e06-s08-seller-listing-stake.md
- AGENTS.md

Implement per AC; run mops test + pnpm typecheck; update story QA Results with evidence.
Do NOT implement other wave stories. Do NOT run wave audit.
Return: files changed, test output summary, AC status table.
```

Replace `E6.S8` and story path for each subsequent story.

---

## AC Verifier spawn template

```text
Task tool: subagent_type=explore, readonly=true

Verify story E6.S8 acceptance criteria in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Read story AC + BDD in _bmad-output/implementation-artifacts/stories/e06-disputes/e06-s08-seller-listing-stake.md.
Map each AC to: code path, test file, test name (or gap).
Readonly only — no edits.
Return JSON-shaped summary: acResults[], gaps[], verdict (pass/fail).
```

---

## Audit Council — four parallel spawns (parent MUST batch in one turn)

### Council 1 — Traceability

```text
Task tool: subagent_type=explore, readonly=true

Audit Wave 1 traceability for CryptoMarket P2P at /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Stories: E3.S8, E4.S7, E6.S8, E3.S7, E3.S10, E9.S2, E7.S3, E3.S9, E13.S1 (only those marked done in IMPLEMENTATION-CYCLE-STATE.json unless full wave complete).

Cross-check: story AC ↔ prd FR ↔ traceability-matrix ↔ code ↔ tests.
Return: P0/P1/P2 findings with storyId, file:line, recommendation.
Output section title: ## Traceability
```

### Council 2 — Security / Fraud

```text
Task tool: subagent_type=explore, readonly=true

Security and fraud audit — Wave 1 implemented stories in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Focus: auth guards, rate limits, payment/stake/wallet flows, Gate C defaults, manual payment spoof paths, escrow races.
Read IMPLEMENTATION-CYCLE-STATE.json for completedStories scope.
Return: P0/P1/P2 with exploit scenario, file refs, mitigation.
Output section title: ## Security / Fraud
```

### Council 3 — Test gaps

```text
Task tool: subagent_type=explore, readonly=true

Test gap audit — Wave 1 in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Compare COUNCIL-FINDINGS.md P0 test list + story BDD scenarios vs test/*.mo and frontend checks.
Identify missing race tests, stake tests, handshake tests for implemented scope.
Return: P0/P1 gaps with suggested test file/name.
Output section title: ## Test Gaps
```

### Council 4 — Doc consistency

```text
Task tool: subagent_type=explore, readonly=true

Documentation consistency audit — Wave 1 in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Cross-check: sprint-status.yaml, story markdown status/QA, ORCHESTRATION-RUNBOOK, architecture.md, TRADE-STATE-MACHINE.md vs actual code behavior.
Return: P0/P1 doc drift items with file paths.
Output section title: ## Doc Consistency
```

**Parent merge:** Concatenate four sections → `IMPLEMENTATION-AUDIT-WAVE1-CYCLE{C}.md`, update `auditCouncilFindings` in state JSON.

---

## Fix Dev spawn template

```text
Task tool: subagent_type=gsd-executor

Fix P0/P1 findings from IMPLEMENTATION-AUDIT-WAVE1-CYCLE{C}.md in /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Scope: [backend | frontend | docs] — list specific finding IDs only.
Run mops test + typecheck. Do not implement new stories.
Return: fixed findings, evidence, remaining blockers.
```

Spawn **two Fix Devs in parallel** only when findings split cleanly (e.g. backend Motoko vs frontend React) with no overlapping files.

---

## Re-Audit Synthesizer spawn template

```text
Task tool: subagent_type=generalPurpose

Re-audit Wave 1 cycle {C} for /Volumes/workspace-drive/projects/other/cryptomarket-p2p.

Read IMPLEMENTATION-AUDIT-WAVE1-CYCLE{C}.md and verify each P0/P1 fix in codebase.
Append ## Re-Audit Verdict to the audit file: CLEAN | NOT CLEAN, with evidence.
Update IMPLEMENTATION-CYCLE-STATE.json: if CLEAN set currentPhase ready for next wave; else cycle++ and currentPhase=implement.
```

---

## Codex / parent decision tree

```text
read IMPLEMENTATION-CYCLE-STATE.json

if currentPhase == "implement":
  if currentStory not in completedStories:
    spawn Story Dev(currentStory)
    then spawn AC Verifier(currentStory)
    update state → next story or currentPhase=audit if wave complete

if currentPhase == "audit":
  spawn 4 Audit Council agents IN PARALLEL
  merge → audit file → currentPhase=fix

if currentPhase == "fix":
  spawn Fix Dev(s) per domain
  → currentPhase=re-audit

if currentPhase == "re-audit":
  spawn Re-Audit Synthesizer
  → clean: done / not clean: cycle++, implement
```

---

## Current session pointer

After doc restructure (2026-05-23): **next Story Dev target = E6.S8** (seller listing stake).  
E3.S8 and E4.S7 are in `completedStories`.
