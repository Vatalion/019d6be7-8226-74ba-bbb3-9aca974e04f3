/** BDD and task generation from manifest + STORY_PATHS — cryptomarket-p2p only. */

export function acToBddScenario(ac, index) {
	const trimmed = ac.trim();
	const m = trimmed.match(/^Given\s+(.+?),\s*when\s+(.+?),\s*then\s+(.+)\.?$/i);
	if (m) {
		return (
			"- **Scenario: Acceptance " +
			(index + 1) +
			"**\n" +
			"  - Given " +
			m[1].trim() +
			"\n" +
			"  - When " +
			m[2].trim() +
			"\n" +
			"  - Then " +
			m[3].trim()
		);
	}
	return (
		"- **Scenario: Acceptance " +
		(index + 1) +
		"**\n" +
		"  - Given story preconditions are met\n" +
		"  - When the user completes the primary action\n" +
		"  - Then " +
		trimmed
	);
}

export function generateBddFromAcceptance(acceptanceLines) {
	const scenarios = [];
	for (let i = 0; i < acceptanceLines.length; i++) {
		if (/^TBD/i.test(String(acceptanceLines[i]).trim())) continue;
		scenarios.push(acToBddScenario(acceptanceLines[i], i));
	}
	scenarios.push(
		"- **Scenario: Unauthenticated or invalid input**",
		"  - Given missing Internet Identity session or invalid payload",
		"  - When a protected update is attempted",
		"  - Then the system rejects safely with a clear error",
	);
	return scenarios.join("\n");
}

export function buildTasksFromContext(def, ctx, override, statusCheckbox, sanitizeTaskBlock, impl) {
	if (override?.tasks) return sanitizeTaskBlock(override.tasks);
	if (impl?.tasks) return sanitizeTaskBlock(impl.tasks);

	const cb = statusCheckbox(def.status);
	const isOpen = def.status === "backlog" || def.status === "phase3";
	const mark = (preferDone) => (isOpen ? " " : preferDone ? "x" : cb);

	const lines = [];

	if (ctx.frontend?.length) {
		const items = ctx.frontend.filter((f) => f && !/\bTBD\b/i.test(f));
		if (items.length) {
			lines.push("- [" + mark(def.status === "done") + "] **Frontend:**");
			for (const f of items) {
				const path = f.startsWith("src/") ? f : "src/frontend/src/" + f.replace(/^\/+/, "");
				lines.push("  - [" + (isOpen ? " " : "x") + "] `" + path + "`");
			}
		}
	}

	if (ctx.backend?.length) {
		const items = ctx.backend.filter((b) => b && !/\bTBD\b/i.test(b));
		if (items.length) {
			lines.push("- [" + mark(def.status === "done") + "] **Backend:**");
			for (const b of items) {
				let path = b;
				if (!b.startsWith("src/") && b.includes(".mo")) path = "src/backend/" + b;
				else if (!b.startsWith("src/") && !b.includes(" in ")) path = "src/backend/mixins/" + b;
				lines.push("  - [" + (isOpen ? " " : "x") + "] `" + path + "`");
			}
		}
	}

	if (ctx.docs?.length) {
		lines.push("- [" + mark(false) + "] **Documentation:**");
		for (const d of ctx.docs.filter(Boolean)) {
			lines.push("  - [" + (isOpen ? " " : " ") + "] `" + d + "`");
		}
	}

	lines.push("- [" + mark(def.status === "done") + "] **Security:** CallerGuard + input validation on touched paths.");
	lines.push("- [" + mark(def.status === "done") + "] **Testing:**");
	const tests = (ctx.tests || []).filter((t) => t && !/\bTBD\b/i.test(t));
	if (tests.length) {
		for (const t of tests) lines.push("  - [" + (isOpen ? " " : "x") + "] " + t);
	} else {
		lines.push("  - [" + (isOpen ? " " : " ") + "] `mops test` for changed modules");
	}

	return sanitizeTaskBlock(lines.join("\n"));
}

export function filterVerification(items) {
	return (items || []).filter((v) => v && !/\bTBD\b/i.test(v));
}
