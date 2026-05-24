# Implementation Cycle Orchestration Runbook — CryptoMarket P2P Wave 1

**Project:** `/Volumes/workspace-drive/projects/other/cryptomarket-p2p`  
**Updated:** 2026-05-23 (Wave 1 table synced 2026-05-24 audit fix)  
**Orchestration model:** `multi-agent` (see `AGENT-ROSTER.md`)  
**Scope:** Wave 1 only — continuous implement → verify → audit → fix → re-audit until audit-clean

---

## Multi-agent topology (MANDATORY)

The parent/orchestrator **never implements code**. It only reads state, spawns subagents, merges outputs, and updates `IMPLEMENTATION-CYCLE-STATE.json`.

| Role | Agent type | Parallel? | Scope |
|------|------------|-----------|-------|
| **Cycle Controller** | Parent/orchestrator only | — | State file, assigns work, never implements |
| **Story Dev (Amelia)** | `gsd-executor` | Sequential (1 story at a time — deps) | **ONE** story only per invocation |
| **AC Verifier** | `explore` (readonly) | After each story | AC → code → test mapping |
| **Audit Council** | 4× `explore` or `generalPurpose` | **PARALLEL at wave end** | Traceability, Security/Fraud, Test gaps, Doc consistency |
| **Fix Dev** | `gsd-executor` | Parallel by domain (backend/frontend) if independent | P0/P1 from audit |
| **Re-Audit Synthesizer** | `generalPurpose` | After fix wave | Verifies fixes, writes cycle verdict |

See `AGENT-ROSTER.md` for spawn prompts and Codex/parent instructions.

---

## Cycle per wave

```text
FOR each story in wave order (sequential):
  1. Story Dev (gsd-executor)     → implement ONE story
  2. AC Verifier (explore)        → map AC → code → tests; readonly
  3. Cycle Controller               → update IMPLEMENTATION-CYCLE-STATE.json
                                    (completedStories, currentPhase=implement)

AFTER all wave stories complete:
  4. PARALLEL Audit Council (4 agents) → merge into
     IMPLEMENTATION-AUDIT-WAVE{N}-CYCLE{C}.md
  5. Fix Dev(s) (gsd-executor)    → P0/P1 only; may run 2 in parallel
                                    (backend vs frontend) if no file overlap
  6. Re-Audit Synthesizer         → clean? next wave : cycle C+1
```

### Phase transitions (`currentPhase` in state file)

| Phase | Who runs | Exit condition |
|-------|----------|----------------|
| `implement` | Story Dev → AC Verifier | All wave stories in `completedStories` |
| `audit` | 4× Audit Council (parallel) | Merged audit file written |
| `fix` | Fix Dev(s) | All P0/P1 assigned or waived with reason |
| `re-audit` | Re-Audit Synthesizer | Verdict: **clean** → next wave; else `cycle++` → `implement` |

---

## Wave 1 story order

| # | Story | Status |
|---|-------|--------|
| 1 | E3.S8 — upfront fee breakdown | **DONE** |
| 2 | E4.S7 — external wallet nonce-proof linking | **DONE** |
| 3 | E6.S8 — seller listing stake 5%/min 10 USDT | **DONE** |
| 4 | E3.S7 — seller handshake 24h | **DONE** |
| 5 | E3.S10 — PaymentIntent + post-handshake fund lock | **DONE** |
| 6 | E9.S2 — Gate C safety defaults (disabled) | **DONE** |
| 7 | E7.S3 — Nova Poshta E2E | **DONE** |
| 8 | E3.S9 — buyer cancel 85/10/5 | **DONE** |
| 9 | E13.S1 — P0 race tests | **DONE** |

Wave 1 implementation complete — cycle 1 audit/fix applied 2026-05-24; re-audit in cycle 2.

---

## Hard rules (non-negotiable)

- React 19 + Motoko single actor — no new stack
- No WalletConnect SDK — E4.S7 is nonce proof only (injected TronLink / MetaMask)
- Phase 1 manual = platform-coordinated, honest copy, no trustless claims
- Gate C disabled unless E9.S6 (Wave 3)
- Self-pickup hidden
- Config from `env.json` only
- Stop and report architecture conflicts — do not invent
- **One story per Story Dev spawn** — never batch a wave into one executor

---

## Per-story workflow (Story Dev only)

1. Read story markdown under `_bmad-output/implementation-artifacts/stories/`
2. Implement **only that story** per AC, BDD, file structure requirements
3. Run `mops test` (targeted or full) + frontend `pnpm typecheck`
4. Update story **QA Results** with real evidence (command output, test names)
5. Update `sprint-status.yaml` via `node scripts/build-bmad-stories.mjs` if story done
6. **Do not** run wave audit — AC Verifier handles post-story check

---

## AC Verifier workflow (after each story)

1. Read story AC table and BDD scenarios
2. Grep/readonly trace each AC to code + test file + test name
3. Return structured report: `{ storyId, acResults: [{ ac, status, evidence }] }`
4. Parent appends to `sessionLog` and sets `currentStory` to next backlog item

---

## Wave audit workflow (parallel council)

When `currentPhase` becomes `audit`:

1. Spawn **four agents in one parent turn** (see `AGENT-ROSTER.md` prompts)
2. Each returns findings with P0/P1/P2, file refs, story IDs
3. Parent merges into `IMPLEMENTATION-AUDIT-WAVE1-CYCLE{C}.md`
4. Populate `auditCouncilFindings` in state JSON
5. Set `currentPhase` → `fix`

---

## Fix + re-audit workflow

- **Fix Dev:** one spawn per domain or one per P0 cluster; never whole wave
- **Re-Audit Synthesizer:** diff audit vs codebase; write verdict section in audit file
- If not clean: increment `cycle`, reset `currentPhase` → `implement`, do **not** re-implement done stories unless audit marks regression

---

## Verification commands

```bash
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p
mops test
cd src/frontend && pnpm typecheck
node scripts/build-bmad-stories.mjs   # refresh sprint-status after story completion
```

---

## State files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION-CYCLE-STATE.json` | Machine-readable cycle progress (`orchestrationModel: multi-agent`) |
| `AGENT-ROSTER.md` | Role → subagent type → spawn prompts |
| `IMPLEMENTATION-AUDIT-WAVE1-CYCLE*.md` | Wave audit reports |
| `sprint-status.yaml` | Sprint tracking (regenerated) |

---

## Blocked story protocol

If blocked (auth, architecture conflict, missing decision):

1. Record in `IMPLEMENTATION-CYCLE-STATE.json` → `blockedStories`
2. Note in audit file with P0/P1 and file refs
3. Continue next unblocked story if dependencies allow
4. Do **not** start Wave 2/3 unless Wave 1 fully done AND audit-clean

---

## Commit policy

Prefer **no git commit** unless all tests pass for completed stories and user requests commit.

---

## Anti-patterns (DO NOT)

- ❌ Single `gsd-executor` running implement + audit + fix in one spawn
- ❌ Parent editing `src/` directly
- ❌ Skipping AC Verifier between stories
- ❌ Sequential audit council (must be parallel at wave end)
- ❌ Starting next wave before re-audit verdict is **clean**
