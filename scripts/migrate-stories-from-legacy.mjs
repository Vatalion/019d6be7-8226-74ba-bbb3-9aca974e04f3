#!/usr/bin/env node
/**
 * Generates docs/stories from legacy crypto_market stories + new-project gaps.
 * Run: node scripts/migrate-stories-from-legacy.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORIES = path.join(ROOT, "docs/stories");
const LEGACY = "/Volumes/workspace-drive/projects/other/crypto_market/docs/stories";

/** @type {import('./story-manifest.mjs').StoryDef[]} */
const { STORIES: MANIFEST, EXCLUDED } = await import("./story-manifest.mjs");

function frontmatter(s) {
	const lines = ["---"];
	for (const [k, v] of Object.entries(s.meta)) {
		if (v == null) continue;
		lines.push(`${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`);
	}
	lines.push("---", "");
	return lines.join("\n");
}

function renderStory(def) {
	const legacyLine = def.legacyPath
		? `**Legacy:** [\`${def.legacyPath}\`](file://${path.join(LEGACY, def.legacyPath)})`
		: "**Legacy:** _(new story — no crypto_market counterpart)_";

	const parts = [
		frontmatter(def),
		`# ${def.id} — ${def.title}`,
		"",
		`| Field | Value |`,
		`|-------|-------|`,
		`| Epic | ${def.epic} |`,
		`| Phase | ${def.phase} |`,
		`| Status | ${def.status} |`,
		`| PRD | ${def.prd ?? "—"} |`,
		legacyLine,
		"",
		"## Story",
		"",
		def.story,
		"",
		"## Adaptation notes (cryptomarket-p2p)",
		"",
		...def.adaptation.map((l) => `- ${l}`),
		"",
		"## Acceptance criteria",
		"",
		...def.acceptance.map((l) => (l.startsWith("-") || l.startsWith("1.") ? l : `- ${l}`)),
		"",
		"## Verification",
		"",
		...def.verification.map((l) => `- ${l}`),
	];

	if (def.outOfScope?.length) {
		parts.push("", "## Out of scope / deferred", "", ...def.outOfScope.map((l) => `- ${l}`));
	}

	return `${parts.join("\n")}\n`;
}

function renderExcluded() {
	const lines = [
		"---",
		"documentType: story-exclusion-log",
		"source: crypto_market/docs/stories",
		"---",
		"",
		"# Excluded legacy stories",
		"",
		"These legacy stories are **not** ported. Reasons align with [MIGRATION-FROM-CRYPTO_MARKET.md](../docs/bmad/MIGRATION-FROM-CRYPTO_MARKET.md).",
		"",
		"| Legacy story | Reason |",
		"|--------------|--------|",
		...EXCLUDED.map((e) => `| \`${e.path}\` | ${e.reason} |`),
		"",
	];
	return lines.join("\n");
}

function renderIndex() {
	const byEpic = new Map();
	for (const s of MANIFEST) {
		if (!byEpic.has(s.epic)) byEpic.set(s.epic, []);
		byEpic.get(s.epic).push(s);
	}

	const epicOrder = [
		"E1",
		"E2",
		"E11",
		"E3",
		"E4",
		"E5",
		"E6",
		"E7",
		"E8",
		"E9",
		"E10",
	];

	const lines = [
		"---",
		"documentType: stories-index",
		"canonical: true",
		"updatedAt: 2026-05-21",
		"---",
		"",
		"# User stories — CryptoMarket P2P",
		"",
		"Canonical story files for BMAD/dev workflows. Product truth also in [`_bmad-output/planning-artifacts/epics.md`](../_bmad-output/planning-artifacts/epics.md).",
		"",
		"**Source:** Adapted from legacy [`crypto_market`](file:///Volumes/workspace-drive/projects/other/crypto_market/docs/stories/index.md) where applicable; new stories for gaps (engagement, category tree).",
		"",
		"## Status legend",
		"",
		"| Status | Meaning |",
		"|--------|---------|",
		"| `done` | Implemented and verified in this repo |",
		"| `built-deferred` | Code exists; not a Phase 1 product driver |",
		"| `backlog` | Approved future work |",
		"| `phase3` | Phase 3 trustless / on-chain — do not market in Phase 1 |",
		"",
		"## Epic index",
		"",
	];

	for (const epic of epicOrder) {
		const items = byEpic.get(epic);
		if (!items?.length) continue;
		lines.push(`### ${epic}`, "");
		for (const s of items) {
			const rel = s.file;
			lines.push(
				`- [${s.id} — ${s.title}](${rel}) — **${s.status}**${s.legacyPath ? ` ← \`${s.legacyPath}\`` : ""}`,
			);
		}
		lines.push("");
	}

	lines.push(
		"## Excluded legacy stories",
		"",
		"See [EXCLUDED-LEGACY.md](./EXCLUDED-LEGACY.md).",
		"",
	);

	return lines.join("\n");
}

await mkdir(STORIES, { recursive: true });

for (const def of MANIFEST) {
	const outPath = path.join(STORIES, def.file);
	await mkdir(path.dirname(outPath), { recursive: true });
	await writeFile(outPath, renderStory(def), "utf8");
}

await writeFile(path.join(STORIES, "index.md"), renderIndex(), "utf8");
await writeFile(path.join(STORIES, "EXCLUDED-LEGACY.md"), renderExcluded(), "utf8");

console.log(`Wrote ${MANIFEST.length} stories + index + exclusions to docs/stories/`);
