#!/usr/bin/env node
/**
 * Builds full BMAD story files under _bmad-output/implementation-artifacts/stories/
 * from story-manifest + repo paths (manifest/overrides only in output).
 */
import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STORIES } from "./story-manifest.mjs";
import { DEPENDENCY_MAP, STORY_PATHS } from "./bmad-story-paths.mjs";
import { OVERRIDES } from "./story-content-overrides.mjs";
import { IMPLEMENTATION_STATE } from "./story-implementation-state.mjs";
import {
	sanitizeTaskBlock,
	purgeForbiddenText,
	buildAgentGuardrails,
	buildArchitectureCompliance,
	buildLibraryFrameworkRequirements,
	buildFileStructureRequirements,
	buildTestingRequirements,
	buildReferences,
	buildQATemplate,
	buildDevAgentRecordFull,
} from "./bmad-story-sections.mjs";
import {
	generateBddFromAcceptance,
	buildTasksFromContext,
	filterVerification,
} from "./story-generators.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(ROOT, "_bmad-output/implementation-artifacts/stories");

const STATUS_LABEL = {
	done: "Done",
	"built-deferred": "Built — product deferred",
	backlog: "Backlog",
	phase3: "Planned (Phase 3)",
	blocked: "Blocked",
};

function statusCheckbox(status) {
	if (status === "done" || status === "built-deferred") return "x";
	if (status === "backlog" || status === "phase3") return " ";
	return " ";
}

function slugFromFile(file) {
	return path.basename(file, ".md");
}

function storyKey(def) {
	const m = def.id.match(/E(\d+)\.S(\d+)/);
	if (!m) return slugFromFile(def.file);
	return `e${m[1]}-s${m[2].padStart(2, "0")}-${slugFromFile(def.file).replace(/^e\d+-s\d+-/, "")}`;
}

function mergedDeps(def, ctx) {
	return [...new Set([...(ctx.deps || []), ...(def.meta?.dependsOn || []), ...(DEPENDENCY_MAP[def.id] || [])])];
}

function cleanImportedText(text) {
	if (!text) return "";
	return text.replace(/initiateSwap/gi, "initiateTrade").replace(/lib\/features\//g, "src/frontend/src/");
}

function buildStory(def) {
	const ctx = STORY_PATHS[def.id] || {};
	const impl = IMPLEMENTATION_STATE[def.id];
	const override = OVERRIDES[def.id];
	const deps = mergedDeps(def, ctx);
	const acceptanceLines = override?.acceptance || def.acceptance;
	const bddRaw = override?.bdd || generateBddFromAcceptance(acceptanceLines);
	const bdd = cleanImportedText(bddRaw);
	const ac = acceptanceLines.map((a, i) => `${i + 1}. ${a}`);
	const storyText = override?.story || def.story;
	const verification = filterVerification(def.verification);

	const fm = [
		"---",
		"workflowType: story",
		`storyId: "${def.id}"`,
		`storyKey: "${storyKey(def)}"`,
		`epic: "${def.epic}"`,
		`phase: ${typeof def.phase === "number" ? def.phase : `"${def.phase}"`}`,
		`status: ${def.status}`,
		def.prd ? `prd: "${def.prd}"` : null,
		"document_output_language: en",
		"project: CryptoMarket P2P",
		"---",
	]
		.filter(Boolean)
		.join("\n");

	const depLines = deps.length
		? deps.map((d) => `- ${d}`)
		: ["- See epic dependencies in [`epics.md`](../../../planning-artifacts/epics.md)"];

	const sections = [
		fm,
		"",
		`# Story ${def.id}: ${def.title}`,
		"",
		"## Status",
		STATUS_LABEL[def.status] || def.status,
		"",
		"## Dependencies",
		"",
		...depLines,
		"",
		"## Story",
		"",
		storyText,
		"",
		"## Acceptance Criteria",
		"",
		...ac,
		"",
		"### BDD Scenarios",
		"",
		bdd,
		"",
		buildAgentGuardrails(def),
		"",
		"## Tasks / Subtasks",
		"",
		buildTasksFromContext(def, ctx, override, statusCheckbox, sanitizeTaskBlock, impl),
		"",
		"## Dev Notes",
		"",
		buildDevNotes(def, ctx),
		"",
		buildArchitectureCompliance(def, ctx),
		"",
		buildLibraryFrameworkRequirements(def),
		"",
		buildFileStructureRequirements(ctx),
		"",
		buildTestingRequirements(def, ctx),
		"",
		"### Verification checklist (story manifest)",
		"",
		...(verification.length ? verification.map((v) => `- ${v}`) : ["- See Testing requirements above"]),
		"",
		buildReferences(def),
	];

	if (def.outOfScope?.length) {
		sections.push("## Out of scope", "", ...def.outOfScope.map((o) => `- ${o}`), "");
	}

	sections.push(
		"## Change Log",
		"",
		"| Date | Version | Description | Author |",
		"|------|---------|-------------|--------|",
		"| 2026-05-21 | 2.1 | Brownfield reconciliation — Dev Agent Record synced to codebase | Reconciliation |",
		"",
		buildDevAgentRecordFull(def, ctx, impl),
		"",
		buildQATemplate(def, ctx, acceptanceLines, impl),
		"",
	);

	return { content: purgeForbiddenText(sections.join("\n")), outFile: def.file };
}

function buildDevNotes(def, ctx) {
	const parts = [];
	if (ctx?.api?.length) {
		parts.push("### API (Candid / actor)", "", ...ctx.api.map((a) => `- ${a}`), "");
	}
	parts.push(
		"### Technical constraints",
		"",
		"- Load `backend_canister_id` and `project_id` from `/env.json` at runtime (never hardcode).",
		"- `HttpAgent` host: `https://icp-api.io` on mainnet.",
		"- Physical delivery: E7.S3 is the owner-approved Phase 1.5 unlock from pickup-only to Nova Poshta-only; self-pickup stays hidden/deferred.",
		"- Motoko: use `mo:core/*` only; persistent actor per `AGENTS.md`.",
		"",
	);
	return parts.join("\n");
}

function epicRollup(stories) {
	if (stories.every((s) => s.status === "blocked")) return "blocked";
	if (stories.every((s) => s.status === "done" || s.status === "built-deferred")) return "done";
	if (stories.some((s) => ["done", "built-deferred", "blocked", "phase3"].includes(s.status))) {
		return "in-progress";
	}
	return "backlog";
}

async function buildSprintStatus() {
	const lines = [
		"# generated: 2026-05-23",
		"# synced: auto from story-manifest.mjs via build-bmad-stories.mjs",
		"# project: CryptoMarket P2P",
		"# tracking: BMAD BMM implementation artifacts",
		"",
		"development_status:",
	];

	const epics = new Set(STORIES.map((s) => s.epic));
	for (const epic of [...epics].sort()) {
		const epicStories = STORIES.filter((s) => s.epic === epic);
		lines.push(`  epic-${epic.replace("E", "")}: ${epicRollup(epicStories)}`);
		for (const s of epicStories) {
			const key = storyKey(s);
			const st =
				s.status === "done"
					? "done"
					: s.status === "built-deferred"
						? "built-deferred"
						: s.status === "blocked"
							? "blocked"
							: s.status === "phase3"
								? "phase3"
								: "backlog";
			lines.push(`  ${key}: ${st}`);
		}
	}
	lines.push("");
	return lines.join("\n");
}

async function buildIndex() {
	const byEpic = new Map();
	for (const s of STORIES) {
		if (!byEpic.has(s.epic)) byEpic.set(s.epic, []);
		byEpic.get(s.epic).push(s);
	}
	const epicOrder = ["E1", "E2", "E11", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E12", "E13"];

	const lines = [
		"---",
		"workflowType: stories-index",
		"canonical: true",
		"location: _bmad-output/implementation-artifacts/stories",
		"updatedAt: 2026-05-23",
		"---",
		"",
		"# Implementation stories index (BMAD BMM)",
		"",
		"Canonical location per BMAD: **`_bmad-output/implementation-artifacts/stories/`**.",
		"",
		"Planning artifacts: [`../../planning-artifacts/epics.md`](../../planning-artifacts/epics.md).",
		"Sprint tracking: [`../sprint-status.yaml`](../sprint-status.yaml).",
		"",
		"Each story: Implementation scope, Tasks, Dev Notes, architecture/library/file/testing, References, QA Results.",
		"See [STORY-QA-GUIDE.md](./STORY-QA-GUIDE.md).",
		"",
	];

	for (const epic of epicOrder) {
		const items = byEpic.get(epic);
		if (!items?.length) continue;
		lines.push(`## ${epic}`, "");
		for (const s of items) {
			lines.push(`- [${s.id}: ${s.title}](./${s.file}) — **${s.status}**`);
		}
		lines.push("");
	}
	return lines.join("\n");
}

await rm(OUT_ROOT, { recursive: true, force: true }).catch(() => {});
await mkdir(OUT_ROOT, { recursive: true });

for (const def of STORIES) {
	const { content, outFile } = buildStory(def);
	const outPath = path.join(OUT_ROOT, outFile);
	await mkdir(path.dirname(outPath), { recursive: true });
	await writeFile(outPath, content, "utf8");
}

await writeFile(path.join(OUT_ROOT, "index.md"), await buildIndex(), "utf8");
await writeFile(path.join(ROOT, "_bmad-output/implementation-artifacts/sprint-status.yaml"), await buildSprintStatus(), "utf8");

await mkdir(path.join(ROOT, "docs/stories"), { recursive: true });
await writeFile(
	path.join(ROOT, "docs/stories/README.md"),
	`# Stories moved

Canonical BMAD implementation stories live at:

**[\`_bmad-output/implementation-artifacts/stories/\`](../../_bmad-output/implementation-artifacts/stories/index.md)**

Regenerate: \`node scripts/build-bmad-stories.mjs\`
`,
	"utf8",
);

await writeFile(
	path.join(OUT_ROOT, "STORY-QA-GUIDE.md"),
	`---
workflowType: qa-guide
---

# BMAD QA guide — CryptoMarket P2P

Use with each story **QA Results** section.

## QA depth by status

| Status | Depth |
|--------|-------|
| backlog | Design review |
| done | Regression on touch |
| built-deferred | Smoke if code changed |
| phase3 | Design sign-off before build |

## Required evidence

1. \`mops test\` for changed Motoko modules
2. Caffeine flow template ids when UI changes
3. AC table filled with evidence

## References

- [AGENTS.md](../../../AGENTS.md)
- [architecture.md](../../planning-artifacts/architecture.md)
`,
	"utf8",
);

await rm(path.join(OUT_ROOT, "COMPATIBILITY-AUDIT.md"), { force: true }).catch(() => {});
await rm(path.join(OUT_ROOT, "EXCLUDED-LEGACY.md"), { force: true }).catch(() => {});

console.log(`Built ${STORIES.length} BMAD stories → ${OUT_ROOT}`);
