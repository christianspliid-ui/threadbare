#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// --- Constants & Tunables (NFP #1) ---

export const AUTHORING_BRIEF_MAX_LINES = 500;
export const AUTHORING_BRIEF_OUTPUT_PATH = "Docs/authoring-brief.md";
export const AUTHORING_BRIEF_HASH_ALGORITHM = "sha1";
export const AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES = 40;
export const AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES = 15;
export const WIRING_GUIDE_RELPATH = "Docs/plans/2026-04-16-systemic-wiring-guide.md";
export const DIRECTION_DOC_RELPATH = "Docs/plans/2026-04-16-game-design-direction.md";
export const AUTHORING_BRIEF_SOURCES = [WIRING_GUIDE_RELPATH, DIRECTION_DOC_RELPATH] as const;

// Sections D and E are content from the encounter-pipeline skill — hardcoded here so they
// don't require reading the skill file at generation time.
//
// They are NOT "stable" and must not be treated as such (THR-1185). Both blocks sat on the
// pre-THR-772 nudge pivot for months while every gate stayed green: the freshness check
// compares only AUTHORING_BRIEF_SOURCES, and main() short-circuits on those same two hashes,
// so editing a constant here used to produce no regeneration at all. Section E trigger 7 was
// still ordering authors to write per-step approach cards — the rejected model that the live
// skill's own trigger 14 then rejects — on the surface the pipeline tells agents to read FIRST.
//
// AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH below closes that: the sections are stamped into the
// brief's header and compared like any other source, so a reword here invalidates the cached
// brief and `check:authoring-brief` / `check:generated-freshness` both cover it. When the live
// SKILL.md changes these passages, update them here in the same PR — nothing derives them.
const SECTION_D_PLAYER_AS_GOD = `## Section D: Player-as-God Framing Constraint

The player is a god who observes through threads and intervenes indirectly. They **NEVER** make choices for the character. Every player-facing option is a **nudge** — a concrete, sphere-flavoured exercise of the god's influence on the scene or on the mortal's inner weather (a stumble on loose stone, an urge arriving in sleep, a sense that this has happened before, an old ambition catching light again, a face nobody afterwards quite recalls, a wound that closes cleaner than it should), never an instruction to the mortal (say this, go there, fight) and never a choice between authored endings. **Influence, never authorship.** The mortal acts according to their personality and the god's influence. Playing nothing must always be viable: a hand is an offer, not a toll gate.

**Auto-REVISE trigger:** Any encounter where the player "chooses how the character responds" must be rejected and reframed as a nudge hand.

> Source: encounter-pipeline SKILL.md — player-as-god framing constraint`;

const SECTION_E_REJECTION_TRIGGERS = `## Section E: Editorial Rejection Triggers

The following trigger **REVISE BEFORE CONTINUING** (non-negotiable — address before proceeding):

1. No approach prose — steps lack descriptive setup before choices appear
2. Generic god-verbs — "intervene" / "help" / "act" with no specific divine framing
3. No thread integration — encounter doesn't acknowledge the agent's relationships, history, or traits
4. Missing aftermath reaction choices — scale medium+ must offer branching aftermath reactions
5. Reporter prose — outcomes tell what happened ("they succeeded") rather than how it felt
6. No concept art recommendation — brief omitted or too vague to paint a scene
7. A hand outside 4–8 authored cards on a nudge-bearing step
8. Fewer than 4 distinct spheres, or no ungated common (sphere-less) option, in a hand
9. Any nudge with no failure-band fragment — or a big-delta nudge (\`forecastDelta ≥ 0.15\`) missing either failure band
10. A \`StepOutcome\` band no fragment in the hand covers
11. A number or \`%\` in an \`effectLine\` — words only; the pip row renders magnitude
12. Trait-hook step skipped, or a hook naming a ref \`validateTraitRefs()\` reports dead
13. A nudge-specific payoff written into the base band text — it must read correctly with any subset of the hand active
14. A player-facing option that instructs the mortal rather than exerting the god's influence on the scene or the mortal's inner weather — the rejected authored-futures model. Range is not the test: a dream, an omen, a kindled desire are lawful; "tell them to run" is not
15. Any detector hit: a vagueness-lexicon word, or more than one annotation clause across the encounter
16. Scene-bespoke prose on a card face — a title, effect line, or flavor quote that only reads in this encounter (the communication pivot: prose does the scene, cards do the rules)
17. An effect line that states mood instead of mechanism — it must say what the god does and why that moves the odds
18. No setting envelope, or a declared class with no opening — or a spine/afterimage that names class scenery
19. Two rider cards in one hand, or a rider with no justifying comment
20. A zero-essence non-trait card with no other cost channel, or a grant naming content that does not exist (\`validateNudgeGrantRefs\`)
21. Two encounters in the same family with an identical card-type composition
22. A seam echo — a repeated image, repeated sentence shape, or near-identical phrasing across a paragraph boundary (the class the automated detectors cannot see; check every opening→spine and spine→band seam explicitly)
23. A static authored factor line — any \`factorLines\` entry that would read identically on every run of the encounter (the variance rule: factors come from the broader game context — agent, hex, global modifiers, earlier steps — all derived; scene facts are priced into the difficulty and live in the prose)
24. The agent as bystander — a set-piece scene the acting agent merely watches, without the design block's written justification; the default shape is the opportunity/complication/danger landing on the agent or in their path
25. Announced outcome mechanics in scene prose — explicit "pass and X / fail and Y" framing; stakes are foreshadowed in the scene's furniture, outcomes live in afterimages and band prose

> Source: encounter-pipeline SKILL.md — Automatic REVISE triggers`;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- Pure functions (exported for tests) ---

export function hashContent(content: string | Buffer): string {
  return crypto
    .createHash(AUTHORING_BRIEF_HASH_ALGORITHM)
    .update(typeof content === "string" ? Buffer.from(content, "utf8") : content)
    .digest("hex");
}

/**
 * Identity of the two hardcoded skill-derived sections (D and E).
 *
 * Stamped into the brief header alongside the source-doc hashes so that rewording a constant
 * invalidates the cached brief exactly as editing a source doc does. Without this the sections
 * were outside every freshness gate by construction (THR-1185).
 */
export const AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH = hashContent(
  `${SECTION_D_PLAYER_AS_GOD}\n${SECTION_E_REJECTION_TRIGGERS}`,
);

/**
 * Extract lines from the line matching startPattern (inclusive) up to but not including
 * the first subsequent line matching stopPattern.
 * Throws with the pattern string if the start anchor is not found.
 */
export function extractSection(lines: string[], startPattern: RegExp, stopPattern: RegExp): string[] {
  const startIdx = lines.findIndex((l) => startPattern.test(l));
  if (startIdx === -1) {
    throw new Error(`Expected anchor not found: ${startPattern.toString()}`);
  }
  const result: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (i > startIdx && stopPattern.test(lines[i])) break;
    result.push(lines[i]);
  }
  return result;
}

/**
 * Distill a raw capability section (already sliced to just that section) into:
 * heading + first paragraph + first code/table block + "Why this changes what you write" paragraph.
 */
export function distillCapabilitySection(section: string[], capNum: number): string[] {
  const result: string[] = [];

  // Heading (always line 0)
  result.push(section[0]);

  // First paragraph — first non-blank text after the heading, until blank or next heading
  let i = 1;
  while (i < section.length && section[i].trim() === "") i++;
  const firstParaStart = i;
  while (i < section.length && section[i].trim() !== "" && !section[i].startsWith("#")) i++;
  if (i > firstParaStart) {
    result.push("");
    result.push(...section.slice(firstParaStart, i));
  }

  // First code block or markdown table — verbatim
  let blockStart = -1;
  let blockEnd = -1;
  for (let j = 1; j < section.length && blockStart === -1; j++) {
    if (section[j].startsWith("```")) {
      blockStart = j;
      j++;
      while (j < section.length && !section[j].startsWith("```")) j++;
      blockEnd = j + 1;
    } else if (section[j].startsWith("|")) {
      blockStart = j;
      while (j < section.length && section[j].startsWith("|")) j++;
      blockEnd = j;
    }
  }
  if (blockStart !== -1 && blockEnd !== -1) {
    result.push("");
    result.push(...section.slice(blockStart, blockEnd));
  }

  // "Why this changes what you write:" paragraph
  for (let j = 1; j < section.length; j++) {
    if (section[j].includes("**Why this changes what you write:**")) {
      result.push("");
      result.push(section[j]);
      j++;
      while (j < section.length && section[j].trim() !== "") {
        result.push(section[j]);
        j++;
      }
      break;
    }
  }

  result.push("");

  if (result.length > AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES) {
    throw new Error(
      `Capability ${capNum}: extracted ${result.length} lines, exceeds budget of ` +
        `${AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES} (AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES). ` +
        `Tighten the source section or raise the cap.`,
    );
  }

  return result;
}

export function extractCapabilitySection(lines: string[], capNum: number): string[] {
  const startPattern = new RegExp(`^### Capability ${capNum}:`);
  const stopPattern = new RegExp(`^### Capability ${capNum + 1}:|^## `);
  const section = extractSection(lines, startPattern, stopPattern);
  return distillCapabilitySection(section, capNum);
}

/**
 * Extract the Encounter Design Principles section from direction doc lines.
 * Returns section heading + intro + all 7 sub-principles (heading + first paragraph).
 */
export function extractPrinciplesSections(lines: string[]): string[] {
  const mainSection = extractSection(lines, /^## Encounter Design Principles$/, /^---$|^## /);

  const result: string[] = [];

  // Section heading
  result.push(mainSection[0]);

  // Intro paragraph
  let i = 1;
  while (i < mainSection.length && mainSection[i].trim() === "") i++;
  while (i < mainSection.length && mainSection[i].trim() !== "" && !mainSection[i].startsWith("#")) {
    result.push(mainSection[i]);
    i++;
  }
  result.push("");

  // Each principle: heading + first paragraph only
  for (let principleNum = 1; principleNum <= 7; principleNum++) {
    const startPat = new RegExp(`^### ${principleNum}\\.`);
    const stopPat =
      principleNum < 7 ? new RegExp(`^### ${principleNum + 1}\\.`) : /^---$|^## /;

    const principleStart = mainSection.findIndex((l) => startPat.test(l));
    if (principleStart === -1) continue;

    const principleLines: string[] = [mainSection[principleStart]];
    let j = principleStart + 1;
    while (j < mainSection.length && mainSection[j].trim() === "") j++;
    while (
      j < mainSection.length &&
      mainSection[j].trim() !== "" &&
      !stopPat.test(mainSection[j]) &&
      !mainSection[j].startsWith("#")
    ) {
      principleLines.push(mainSection[j]);
      j++;
    }
    principleLines.push("");

    if (principleLines.length > AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES) {
      throw new Error(
        `Principle ${principleNum}: extracted ${principleLines.length} lines, exceeds budget of ` +
          `${AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES} (AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES). ` +
          `Tighten the source section or raise the cap.`,
      );
    }

    result.push(...principleLines);
  }

  return result;
}

/**
 * Build the full authoring brief markdown from source contents.
 * All inputs are deterministic — same inputs produce byte-identical output.
 */
export function buildBrief(
  wiringGuideContent: string,
  directionDocContent: string,
  wiringHash: string,
  directionHash: string,
  generatedAt: string,
): string {
  const wiringLines = wiringGuideContent.split(/\r?\n/);
  const directionLines = directionDocContent.split(/\r?\n/);

  const capabilitySections: string[] = [];
  for (let capNum = 1; capNum <= 7; capNum++) {
    capabilitySections.push(...extractCapabilitySection(wiringLines, capNum));
  }

  const principlesSections = extractPrinciplesSections(directionLines);

  const lines: string[] = [
    "# Authoring Brief",
    "",
    `> **Generated:** ${generatedAt} by scripts/build-authoring-brief.ts`,
    `> **Sources:**`,
    `>   - ${WIRING_GUIDE_RELPATH} (${AUTHORING_BRIEF_HASH_ALGORITHM}: ${wiringHash})`,
    `>   - ${DIRECTION_DOC_RELPATH} (${AUTHORING_BRIEF_HASH_ALGORITHM}: ${directionHash})`,
    `>   - encounter-pipeline SKILL.md sections D/E, hardcoded in the generator (${AUTHORING_BRIEF_HASH_ALGORITHM}: ${AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH})`,
    "> **Do not hand-edit.** Regenerate via `npm run build-authoring-brief`.",
    "",
    "---",
    "",
    "## Section B: The 7 Engine Capabilities",
    "",
    "Every encounter has access to these capabilities. When you sit down to write, ask: which of these am I using, and why am I not using the others?",
    "",
    ...capabilitySections,
    "---",
    "",
    "## Section C: Encounter Design Principles",
    "",
    ...principlesSections.slice(1), // skip the "## Encounter Design Principles" heading — we have our own section header
    "---",
    "",
    SECTION_D_PLAYER_AS_GOD,
    "",
    "---",
    "",
    SECTION_E_REJECTION_TRIGGERS,
  ];

  const totalLines = lines.length;
  if (totalLines > AUTHORING_BRIEF_MAX_LINES) {
    throw new Error(
      `Generated brief is ${totalLines} lines, exceeds budget of ${AUTHORING_BRIEF_MAX_LINES} ` +
        `(AUTHORING_BRIEF_MAX_LINES). Tighten source sections or raise the cap.`,
    );
  }

  return lines.join("\n") + "\n";
}

// --- Hash extraction from existing brief ---

const HASH_LINE_PATTERN = /sha1:\s*([0-9a-f]{40})/gi;

export function extractHashesFromBrief(
  briefContent: string,
): { wiringHash: string; directionHash: string; sectionsHash: string | null } | null {
  const matches = [...briefContent.matchAll(HASH_LINE_PATTERN)];
  if (matches.length < 2) return null;
  // A brief generated before THR-1185 carries only the two source stamps. Report the missing
  // third as null rather than absent, so callers treat it as drifted and regenerate.
  return {
    wiringHash: matches[0][1],
    directionHash: matches[1][1],
    sectionsHash: matches[2]?.[1] ?? null,
  };
}

// --- Main ---

async function main(): Promise<void> {
  const wiringPath = path.join(repoRoot, WIRING_GUIDE_RELPATH);
  const directionPath = path.join(repoRoot, DIRECTION_DOC_RELPATH);
  const outputPath = path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH);

  if (!fs.existsSync(wiringPath)) {
    console.error(`error: source not found: ${WIRING_GUIDE_RELPATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(directionPath)) {
    console.error(`error: source not found: ${DIRECTION_DOC_RELPATH}`);
    process.exit(1);
  }

  const wiringContent = fs.readFileSync(wiringPath, "utf8");
  const directionContent = fs.readFileSync(directionPath, "utf8");
  const wiringHash = hashContent(wiringContent);
  const directionHash = hashContent(directionContent);

  console.info(`info: wiring guide   sha1=${wiringHash}`);
  console.info(`info: direction doc  sha1=${directionHash}`);

  // Check if existing brief is up to date
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, "utf8");
    const existingHashes = extractHashesFromBrief(existing);
    if (
      existingHashes &&
      existingHashes.wiringHash === wiringHash &&
      existingHashes.directionHash === directionHash &&
      existingHashes.sectionsHash === AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH
    ) {
      console.info("info: brief is up to date — no changes written.");
      process.exit(0);
    }
  }

  const generatedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let brief: string;
  try {
    brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
  } catch (err) {
    console.error(`error: ${(err as Error).message}`);
    process.exit(1);
  }

  fs.writeFileSync(outputPath, brief, "utf8");
  const lineCount = brief.split("\n").length - 1; // trailing newline makes one extra
  console.info(`info: wrote ${lineCount} lines to ${AUTHORING_BRIEF_OUTPUT_PATH}`);
}

// Only execute main when this module is the generator entry point — not when it is
// imported by tests, and not when it is imported by the read-only drift check.
//
// NOTE (THR-686): `fileURLToPath(import.meta.url) === process.argv[1]` is NOT a
// sufficient guard here. `check:authoring-brief` bundles this module *into* its own
// entry file via `esbuild --bundle`, which rewrites `import.meta.url` to point at
// `.cache/check-authoring-brief.mjs` — the bundle's own path, and therefore equal to
// `process.argv[1]`. The guard evaluated true and the generator wrote
// `Docs/authoring-brief.md` as a side effect of a check, corrupting dirty working
// trees mid-run. Gate on the entry file's *name* instead: bundling preserves the
// importer's outfile name, so a bundled check never matches.
const entryBasename = path.basename(process.argv[1] ?? "");
if (entryBasename.startsWith("build-authoring-brief")) {
  void main();
}
