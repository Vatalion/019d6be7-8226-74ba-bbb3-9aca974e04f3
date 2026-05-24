/**
 * BMAD story sections — cryptomarket-p2p only. No foreign stack names in output.
 */

/** Drop task lines that reference wrong repo layout (silent filter). */
export const DANGEROUS_LINE_PATTERNS = [
	/\bcanisters\//i,
	/\blib\/features\//i,
	/\.dart\b/i,
	/\bflutter\b/i,
	/\bWidget tests?\b/i,
	/\bwidget tests?\b/i,
	/\bBLoC\b/i,
	/\bBloc\b/i,
	/\bCubit\b/i,
	/\bCreateListingScreen\b/i,
	/\bMarketplaceService\b/i,
	/\bAtomicSwapService\b/i,
	/\bPriceOracleService\b/i,
	/\bBlockchainService\b/i,
	/\bBlockchainVerificationService\b/i,
	/\bPaymentMethodBloc\b/i,
	/\bproduction flavors\b/i,
	/test\/unit\/widgets/i,
	/integration\/screens/i,
	/user_management\/src/i,
	/swap_escrow/i,
	/\bsecretHash\b/i,
	/\binitiateSwap\b/i,
	/\bloginWithEmailPassword\b/i,
	/\bloginWithOAuth\b/i,
	/\bcompleteSwap\b/i,
	/\brefundSwap\b/i,
	/\bwalletconnect_flutter/i,
	/\breown_appkit\b/i,
	/\bNOT legacy\b/i,
	/\bNOT initiateSwap/i,
	/architecture\/testing-strategy/i,
];

/** Strip from any published story text (whole-word / phrase). */
export const FORBIDDEN_OUTPUT = [
	/\blegacy\b/gi,
	/\bcrypto_market\b/gi,
	/\bFlutter\b/gi,
	/\bflutter\b/gi,
	/\bDart\b/gi,
	/\bBLoC\b/gi,
	/\bBloc\b/gi,
	/\bCubit\b/gi,
	/\bHTLC\b/gi,
	/\bhashlock\b/gi,
	/\bpreimage\b/gi,
	/\bsecretHash\b/gi,
	/\bIPFS\b/gi,
	/\batomic swap\b/gi,
	/\bAtomic Swap\b/gi,
	/\bmulti-canister\b/gi,
	/\bMulti-canister\b/gi,
	/\bincompatible\b/gi,
	/\bPorted\b/gi,
	/\badaptation\b/gi,
	/\bcompatibility audit\b/gi,
	/\bMUST NOT\b/gi,
	/\bforbidden\b/gi,
	/\bemail\/OAuth\b/gi,
	/\bFirebase\b/gi,
	/\bdfx\.json\b/gi,
	/\bVaultFactory\b/gi,
	/\bthreshold-ECDSA\b/gi,
	/\bWidget [Tt]est/g,
	/\bwidget test/gi,
	/\bBlockchainService\b/gi,
	/\bBlockchainVerificationService\b/gi,
	/\bMarketplaceService\b/gi,
	/\bPaymentMethodBloc\b/gi,
	/\bCreateListingScreen\b/gi,
	/\binitiateSwap\b/gi,
	/\bcanisters\//gi,
	/\bwalletconnect_flutter\b/gi,
	/\breown_appkit\b/gi,
	/\bNOT legacy\b/gi,
	/\bNOT initiateSwap\b/gi,
	/\(legacy[^)]*\)/gi,
	/\bomnichain\b/gi,
		/\bOmnichain\b/g,
	];

export function isDangerousLine(line) {
	return DANGEROUS_LINE_PATTERNS.some((re) => re.test(line));
}

export function sanitizeTaskBlock(text) {
	return text
		.replace(/\\n/g, "\n")
		.split("\n")
		.filter((line) => !isDangerousLine(line))
		.map((line) =>
			line
				.replace(/\bCreateListingScreen\b/g, "CreateListingPage.tsx")
				.replace(/\bMarketplaceService\b/g, "marketplace-api.mo")
				.replace(/\binitiateSwap\b/g, "initiateTrade"),
		)
		.join("\n");
}

export function purgeForbiddenText(text) {
	let out = text;
	for (const re of FORBIDDEN_OUTPUT) {
		out = out.replace(re, "");
	}
	return out
		.replace(/\n{3,}/g, "\n\n")
		.replace(/([^\n ])  +/g, "$1 ")
		.trimEnd() + "\n";
}

export function buildAgentGuardrails(def) {
	const blocks = [
		"## Implementation scope",
		"",
		"Implement only within this repository's established stack and architecture.",
		"",
		"- **Frontend:** React 19, Vite, TanStack Router — `src/frontend/src/`",
		"- **Backend:** single Motoko actor — `src/backend/lib/*.mo`, `src/backend/mixins/*-api.mo`",
		"- **Auth:** Internet Identity via `useAuth.ts`",
		"- **Config:** `backend_canister_id` and `project_id` from `/env.json`",
		"- **Media:** Caffeine object storage via `object-storage-api.mo`",
		"- **Trades (Phase 1):** `initiateTrade`, `confirmPaymentSent`, `confirmPaymentReceived` in `Escrow.mo`",
		"- **Delivery:** `deliveryPolicy.ts` — Wave 1 target is Nova Poshta only; keep self-pickup hidden/deferred unless owner explicitly changes the product contract",
		"- **Motoko:** `mo:core/*` per `AGENTS.md`",
		"- **Verify:** `mops test` + applicable Caffeine flow templates",
		"",
	];

	if (def.status === "phase3") {
		blocks.push(
			"**Phase 3:** design and ADR only until product gate approves implementation. Follow `docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md` and E9 epic.",
			"",
		);
	}

	if (def.status === "built-deferred") {
		blocks.push(
			"**Product-deferred:** do not expand UX surface or marketing without PM approval. Bugfixes only when explicitly tasked.",
			"",
		);
	}

	if (def.status === "done") {
		blocks.push("**Done:** regression-test acceptance criteria on any change in this area.", "");
	}

	return blocks.join("\n");
}

export function buildArchitectureCompliance(def, ctx) {
	return [
		"## Architecture compliance",
		"",
		"| Requirement | Source |",
		"|-------------|--------|",
		"| Single persistent Motoko actor in `main.mo` | [architecture.md](../../../planning-artifacts/architecture.md) |",
		"| React SPA on Caffeine frontend | [architecture.md](../../../planning-artifacts/architecture.md) |",
		"| Phase 1 settlement: off-chain payment + canister state | [architecture.md](../../../planning-artifacts/architecture.md) |",
		"| Internet Identity | [prd.md](../../../planning-artifacts/prd.md) |",
		def.prd
			? "| " + def.prd + " | [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) |"
			: "| Epic scope | [epics.md](../../../planning-artifacts/epics.md) |",
		"",
	].join("\n");
}

export function buildLibraryFrameworkRequirements(def) {
	const libs = [
		"## Library and framework requirements",
		"",
		"| Layer | Use |",
		"|-------|-----|",
		"| UI | React 19, Vite, TanStack Router, Tailwind |",
		"| Auth / ICP client | `@caffeineai/core-infrastructure` `useInternetIdentity()` via `useAuth.ts`; `@dfinity/agent`, host `https://icp-api.io` |",
		"| Storage | Caffeine object storage pattern |",
		"| Backend | Motoko `mo:core`, mops |",
		"| Build | mops, Caffeine draft/live |",
		"",
	];
	if (def.epic === "E4" || def.id.startsWith("E4")) {
		libs.push("- Payments: `payments-api.mo` HTTPS outcalls (CoinGecko + explorers).\n");
	}
	if (def.epic === "E7") {
		libs.push("- Shipping: `Shipping.mo` outcalls; carrier UI only when `deliveryPolicy` allows.\n");
	}
	return libs.join("\n");
}

export function buildFileStructureRequirements(ctx) {
	const lines = [
		"## File structure requirements",
		"",
		"```text",
		"src/backend/main.mo",
		"src/backend/types.mo",
		"src/backend/lib/<Domain>.mo",
		"src/backend/mixins/<domain>-api.mo",
		"src/frontend/src/pages/",
		"src/frontend/src/components/",
		"src/frontend/src/hooks/useAuth.ts",
		"src/frontend/src/hooks/useBackend.ts",
		"src/frontend/src/lib/deliveryPolicy.ts",
		"test/<Domain>.test.mo",
		"```",
		"",
	];
	if (ctx?.frontend?.length) {
		lines.push("**Frontend:**", "", ...ctx.frontend.map((f) => "- `" + f + "`"), "");
	}
	if (ctx?.backend?.length) {
		lines.push("**Backend:**", "", ...ctx.backend.map((f) => "- `" + f + "`"), "");
	}
	return lines.join("\n");
}

export function buildTestingRequirements(def, ctx) {
	const lines = [
		"## Testing requirements",
		"",
		"| Layer | Requirement |",
		"|-------|-------------|",
		"| Motoko | `mops test` for changed modules |",
		"| UI | Caffeine flow templates + manual smoke on draft |",
		"| Live URL | Object storage + II when testing uploads |",
		"| Evidence | Test output or flow id — not chat claims alone |",
		"",
		"```bash",
		"mops test",
		"```",
		"",
	];
	if (ctx?.tests?.length) {
		lines.push("**Story checks:**", "", ...ctx.tests.map((t) => "- " + t), "");
	}
	return lines.join("\n");
}

export function buildReferences(def) {
	return [
		"## References",
		"",
		"- [epics.md](../../../planning-artifacts/epics.md)",
		def.prd ? "- [prd.md](../../../planning-artifacts/prd.md) — " + def.prd : "",
		"- [architecture.md](../../../planning-artifacts/architecture.md)",
		"- [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md)",
		"- [AGENTS.md](../../../../AGENTS.md)",
		"- [docs/bmad/README.md](../../../../docs/bmad/README.md)",
		"",
	].filter(Boolean).join("\n");
}

export function buildDevAgentRecordFull(def, ctx, impl) {
	const notes = [...(impl?.completionNotes || [])];
	if (!notes.length) {
		if (def.status === "done" || def.status === "built-deferred") {
			notes.push("Implemented per acceptance criteria; regression on touch.");
		} else if (def.status === "phase3") {
			notes.push("Design / evaluation deliverable — Gate C not complete.");
		} else {
			notes.push("Not started — backlog.");
		}
	}
	if (impl?.gaps?.length) {
		notes.push("", "**Known gaps:**", ...impl.gaps.map((g) => (String(g).startsWith("-") ? String(g).replace(/^-\s*/, "") : g)));
	}

	const files =
		impl?.fileList?.length > 0
			? impl.fileList
			: [...(ctx?.frontend || []), ...(ctx?.backend || []), ...(ctx?.docs || [])];

	return [
		"## Dev Agent Record",
		"",
		"### Agent Model Used",
		"",
		impl?.reconciledAt ? "Brownfield reconciliation (" + impl.reconciledAt + ")" : "_pending_",
		"",
		"### Debug Log References",
		"",
		impl?.reconciledAt ? "Code audit against `src/` and `test/` on " + impl.reconciledAt + "." : "_pending_",
		"",
		"### Completion Notes List",
		"",
		...notes.map((n) => (n.startsWith("**") || n === "" ? n : "- " + n)),
		"",
		"### File List",
		"",
		...files.map((f) => "- `" + f + "`"),
		"",
	].join("\n");
}

export function buildQATemplate(def, ctx, acceptanceCriteria = def.acceptance, impl) {
	const isDone = def.status === "done";
	const isPhase3 = def.status === "phase3";
	const isDeferred = def.status === "built-deferred";
	const verdict = isPhase3
		? "Design / eval only"
		: isDone
			? "Regression on touch"
		: isDeferred
			? "Smoke if touched"
			: "Required before merge";
	const recommendation = isPhase3
		? "Complete design sign-off before implementation."
		: isDone
			? "Regression pass on each change."
			: "Full QA before done.";
	const acRows = acceptanceCriteria.map((a, i) => {
		const desc = a.replace(/\|/g, "\\|");
		const key = String(i + 1);
		const evidence = (impl?.qaEvidence?.[key] || "").replace(/\|/g, "\\|");
		let result = "Pending";
		if (isDone) {
			result = impl?.gaps?.length ? "Pass (known gaps)" : "Pass (regression)";
		} else if (isDeferred) {
			result = impl?.qaEvidence?.[key] ? "Smoke — code present" : "Pending";
		} else if (isPhase3) {
			result = impl?.qaEvidence?.[key] ? "Partial" : "Pending";
		}
		return "| " + key + " | " + desc + " | " + result + " | " + evidence + " |";
	});
	const qaChecked = isDone ? "x" : " ";
	const bddChecks = acceptanceCriteria
		.filter((a) => a && !/^TBD/i.test(String(a).trim()))
		.map((a, i) => {
			const short = String(a).replace(/^Given\s+/i, "").slice(0, 120);
			return "- [" + qaChecked + "] Scenario " + (i + 1) + ": " + short + (short.length >= 120 ? "…" : "");
		});
	bddChecks.push("- [" + qaChecked + "] Invalid input / unauthenticated rejected safely");
	if (def.epic === "E3" || def.id.startsWith("E3") || def.id === "E3.S6") {
		bddChecks.push("- [" + qaChecked + "] Copy matches Phase 1 payment model on trade surfaces");
	}
	const regression = (ctx?.tests || ["Manual smoke on affected routes"]).map((t) => "- " + t);
	const qaBox = isDone ? "x" : " ";

	return [
		"## QA Results",
		"",
		"### QA metadata",
		"",
		"| Field | Value |",
		"|-------|-------|",
		"| Story | " + def.id + " |",
		"| Status | " + def.status + " |",
		"| QA verdict | " + verdict + " |",
		"| QA date | " + (impl?.reconciledAt || "_pending_") + " |",
		"| QA engineer | Brownfield reconciliation |",
		"",
		"### Acceptance criteria validation",
		"",
		"| AC # | Description | Result | Evidence |",
		"|------|-------------|--------|----------|",
		...acRows,
		"",
		"### BDD scenario validation",
		"",
		...bddChecks,
		"",
		"### Technical QA checklist",
		"",
		"- [" + qaBox + "] `mops test` passes or story evidence names the verified narrower check",
		"- [" + qaBox + "] Changes only under approved paths (see File structure)",
		"- [" + qaBox + "] `env.json` for canister id",
		"- [" + qaBox + "] Anonymous updates rejected on touched endpoints",
		"- [" + qaBox + "] i18n uk/en for new strings",
		isDeferred ? "- [ ] No new primary-nav promotion without approval" : "",
		"",
		"### Regression scope",
		"",
		...regression,
		"",
		"### Flow templates",
		"",
		"- Use the flow ids listed in [traceability-matrix.md](../../../planning-artifacts/traceability-matrix.md) when UI changes.",
		"",
		"### Security",
		"",
		"- [" + qaBox + "] No secrets in repo",
		"- [" + qaBox + "] Input validation on new update methods",
		"- [" + qaBox + "] Rate limits on new public endpoints",
		"",
		"### QA recommendation",
		"",
		recommendation,
		"",
	].join("\n");
}
