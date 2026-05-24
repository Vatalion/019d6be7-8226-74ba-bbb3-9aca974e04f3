# Wave 2 Audit — Cycle 1 (merged council + fix)

**Date:** 2026-05-23  
**Scope:** Wave 2 complete (E2.S11, E7.S2-enhance, E6.S9) — parallel audit council + P0 fix  
**Prior cycle:** [IMPLEMENTATION-AUDIT-WAVE1-CYCLE2.md](./IMPLEMENTATION-AUDIT-WAVE1-CYCLE2.md)

---

## Executive summary

Wave 2 digital delivery + dispute playbook stories are **implemented in code** with W2 test matrix coverage in `Escrow.test.mo` and `Disputes.test.mo`. Cycle 1 audit found **one P0 security leak** (plaintext blob URL exposed on public listing cards) — **fixed in this session**. Doc/traceability drift (manifest, `traceability-matrix.md`, `prd.md`) synced. `mops test` **15/15 green** after fix.

**Verdict: audit clean — yes.** Wave 3 may proceed (`E9.S6`).

---

## Stories audited

| Story | Status | Key modules |
|-------|--------|-------------|
| E2.S11 | Done | `DigitalDelivery.mo`, `digitalFileCrypto.ts`, `marketplace-api.mo` |
| E7.S2-enhance | Done | `DigitalDelivery.mo`, `Escrow.mo` inspection auto-complete |
| E6.S9 | Done | `Disputes.mo`, `disputes-api.mo`, `DisputeModal` (frontend) |

---

## 1. Traceability (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| T-W2-01 | P0 | `story-manifest.mjs` Wave 2 stories (`E2.S11`, `E7.S2`, `E6.S9`) still `backlog` while code + story files marked done | **Fixed** — all three → `done`; regen via `build-bmad-stories.mjs` |
| T-W2-02 | P1 | `traceability-matrix.md` FR-52 still "Backlog Wave 2" | **Fixed** — Done Wave 2 with test refs |
| T-W2-03 | P1 | `prd.md` FR-52 "Partial — E2.S11 backlog" | **Fixed** — Yes (E2.S11, E7.S2) |
| T-W2-04 | P2 | Root `ROADMAP.md` / `AUDIT.md` stubs (carry-forward W1 D-04) | **Open P2** — planning artifacts canonical |

---

## 2. Security / fraud (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| S-W2-01 | **P0** | `registerDigitalFile` persisted plaintext `blobUrl` on listing; `toListingCard` exposed it in public search/detail API — pre-payment file leak | **Fixed** — no plaintext persist on asset path; `publicDigitalFileUrl()` redacts when `digitalFileAsset` present |
| S-W2-02 | P1 | Canister stores DEK/URL with XOR (`DigitalEncryption.mo`); client uses AES-GCM for file ciphertext — manifest notes "not XOR" for DEK at rest | **Open P1** — acceptable beta layering; object storage holds AES ciphertext; canister XOR is access-controlled metadata encryption |
| S-W2-03 | — | Dispute freeze blocks payout + digital auto-complete | **Pass** — `isDisputeFrozenTradeStatus` (#disputed, #dispute_l1, #dispute_l2); `isPayoutBlockedByDispute` in `Escrow.mo` |
| S-W2-04 | — | Download gate before funding | **Pass** — `assertDigitalDownloadAllowed` rejects pre-`payment_verified`; W2-1 test |
| S-W2-05 | — | L1 opens → `payoutWalletHeld := true` | **Pass** — `freezeTradeForDispute` in `Disputes.mo`; W2-7 test |
| S-W2-06 | — | Incomplete evidence → draft, no freeze | **Pass** — W2-11 test |

### P0 fix detail (S-W2-01)

| Change | File |
|--------|------|
| Stop persisting plaintext blob URL on E2.S11 upload path | `src/backend/lib/DigitalDelivery.mo` |
| Redact `digitalFileUrl` on public listing cards when `digitalFileAsset` exists | `src/backend/lib/Marketplace.mo` |
| Regression test | `test/Marketplace.test.mo` — `toListingCard hides blob URL when digitalFileAsset present` |

---

## 3. Test gaps (council)

| ID | Scenario | Story | Module | Status |
|----|----------|-------|--------|--------|
| W2-1 | Digital delivery blocked before payment_verified | E2.S11 | `Escrow.test.mo` | ✅ |
| W2-2 | Seller file replacement blocked with active trade | E2.S11 | `Escrow.test.mo` | ✅ |
| W2-3 | Auto-delivery creates deliveryRecordAt | E2.S11 | `Escrow.test.mo` (W2-1) | ✅ |
| W2-4 | Redownload does not reset 24h inspection | E7.S2 | `Escrow.test.mo` | ✅ |
| W2-5 | Inspection auto-complete at T+24h | E7.S2 | `Escrow.test.mo` | ✅ |
| W2-6 | Dispute during inspection pauses auto-complete | E7.S2, E6.S9 | `Escrow.test.mo` | ✅ |
| W2-7 | Dispute L1 opens → payout frozen | E6.S9 | `Disputes.test.mo` | ✅ |
| W2-8 | L1 SLA expiry → auto L2 escalation | E6.S9 | `Disputes.test.mo` | ✅ |
| W2-9 | Moderator L2 → single terminal outcome | E6.S9 | `Disputes.test.mo` | ✅ |
| W2-10 | Physical NP dispute + delivered grace freeze | E6.S9, E7.S3 | `Escrow.test.mo` LG-12 | ✅ |
| W2-11 | Incomplete evidence rejected | E6.S9 | `Disputes.test.mo` | ✅ |
| W2-12 | Upgrade mid-inspection resumes deadline | E7.S2 | `Escrow.test.mo` | ✅ |
| X-W2-01 | Public listing URL redaction | E2.S11 | `Marketplace.test.mo` | ✅ (added cycle 1) |
| X-W2-02 | Frontend component tests digital/dispute flows | — | — | **Open P2** — `pnpm typecheck` only per runbook |
| X-W2-03 | Digital golden path E2E (upload → buy → inspect → complete) | — | — | **Open P1** — manual / beta monitoring |

**Test evidence:**

```text
cd /Volumes/workspace-drive/projects/other/cryptomarket-p2p && mops test
→ Tests passed, 15 files (2026-05-23 Wave 2 audit)
```

---

## 4. Doc consistency (council)

| ID | Severity | Finding | Status after fix |
|----|----------|---------|------------------|
| D-W2-01 | P0 | Manifest Wave 2 backlog drift | **Fixed** |
| D-W2-02 | P1 | `traceability-matrix.md` FR-41/FR-52 stale | **Fixed** |
| D-W2-03 | P1 | `prd.md` FR-52 Built column stale | **Fixed** |
| D-W2-04 | P1 | `IMPLEMENTATION-PLAN-WAVE-2.md` §7 launch checklist unchecked | **Open P1** — honest deferrals (E2E golden path, moderator dashboard SLA badges) tracked for beta |
| D-W2-05 | P2 | Root `ROADMAP.md` stub | **Open P2** (W1 carry-forward) |

---

## P0 closed vs remaining

| Category | Closed | Remaining |
|----------|--------|-----------|
| P0 security (S-W2-01) | 1 | 0 |
| P0 traceability (T-W2-01) | 1 | 0 |
| P1 encryption layering (S-W2-02) | 0 | 1 — documented beta limitation |
| P1 E2E golden path (X-W2-03) | 0 | 1 — beta monitoring |
| P2 frontend tests (X-W2-02) | 0 | 1 — Wave 3+ |

---

## P1 carry-forward (non-blocking for Wave 3 start)

| ID | Item | Wave |
|----|------|------|
| S-W2-02 | Canister XOR vs manifest AES-GCM wording for metadata at rest | Document / optional hardening |
| X-W2-03 | Digital golden path E2E smoke | Beta |
| D-W2-04 | §7 launch checklist (moderator SLA dashboard, copy audit) | Beta prep |
| T-03 / S-03 / S-06 | Wave 1 carry-forward (FR-28 crypto, stake on-chain, EVM ERC20) | Wave 3 |

---

## Audit clean?

**Yes** — P0 file URL leak fixed and tested; dispute freeze + W2 matrix verified; docs synced for FR-41/FR-52. Proceed to Wave 3 implementation.

**Next:** `wave=3`, `nextStory=E9.S6`, `currentPhase=wave3-implement`.

---

## Key files inspected

| Area | Files |
|------|-------|
| Digital upload + encryption | `DigitalDelivery.mo`, `DigitalEncryption.mo`, `digitalFileCrypto.ts` |
| Inspection clock | `DigitalDelivery.mo`, `Escrow.mo` |
| Dispute L1/L2 + freeze | `Disputes.mo`, `disputes-api.mo`, `types.mo` |
| Public URL redaction | `Marketplace.mo` |
| Tests | `Escrow.test.mo`, `Disputes.test.mo`, `Marketplace.test.mo` |
| Traceability | `story-manifest.mjs`, `traceability-matrix.md`, `prd.md` |

---

## Self-Check: PASSED

- `IMPLEMENTATION-AUDIT-WAVE2-CYCLE1.md` — FOUND
- P0 fix files — FOUND (`Marketplace.mo`, `DigitalDelivery.mo`, `Marketplace.test.mo`)
- `mops test` 15/15 — PASS
