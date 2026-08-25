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
export const ENCOUNTER_PIPELINE_SKILL_RELPATH = ".claude/skills/encounter-pipeline/SKILL.md";
export const AUTHORING_BRIEF_SOURCES = [
  WIRING_GUIDE_RELPATH,
  DIRECTION_DOC_RELPATH,
  ENCOUNTER_PIPELINE_SKILL_RELPATH,
] as const;

// Sections A and D are content from the encounter-pipeline skill and the prose canon —
// hardcoded here so generation does not depend on parsing prose out of those files.
//
// They are NOT "stable" and must not be treated as such (THR-1185). The Section D block sat
// on the pre-THR-772 nudge pivot for months while every gate stayed green: the freshness
// check compared only AUTHORING_BRIEF_SOURCES, and main() short-circuited on those same
// hashes, so editing a constant here used to produce no regeneration at all.
//
// AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH below closes that: the sections are stamped into
// the brief's header and compared like any other source, so a reword here invalidates the
// cached brief and `check:authoring-brief` / `check:generated-freshness` both cover it. When
// the live SKILL.md or Docs/canon/prose.md changes these passages, update them here in the
// same PR — nothing derives them.
//
// Section E is the exception and is deliberately NOT hardcoded: it is extracted from the
// live SKILL.md at generation time (see extractRejectionTriggers). THR-1250 found the
// hardcoded copy six triggers behind the SKILL — missing, among others, the one rule that
// says clarity beats compression — with no freshness signal, because the SKILL was not a
// source. It is one now, hashed on its trigger block alone so an unrelated SKILL edit does
// not restamp the brief.

// Section A leads the brief on purpose (THR-1250). The compiled preamble previously opened
// on the April design-direction principles, so the draft agent met an emotional-maximalist
// aesthetic frame before it met a single register rule — three consecutive director-level
// register corrections failed to hold against it. The voice constraint now arrives first and
// says, in its own first line, that it governs everything after it.
const SECTION_A_REGISTER = `## Section A: Register and Narrator Mode — read this before you write a word

This section governs every other section in this brief. Where a design principle below implies a voice, this one wins.

**Narrate, never inhabit (Prose Doctrine v2, 2026-08-25).** Write as a game master reading a module aloud — a narrator reporting events from outside the scene. The player is a god reading a chronicle, not a body in the yard. No interior sensation, no camera work, no atmosphere without a job. **State facts; never encode them:** if the fact is "no one dares approach it," write that sentence — do not dress it as physical evidence for the reader to decode. Every sentence serves challenge, test, or outcome, or it is cut. "It builds atmosphere" is not a job.

**The opening skeleton, always:** P1 arrival (real graph names) · P2 situation and complication (events, with costs already paid) · P3 the problem (one stake shape). **Budget: 80 words across all three.** Subject-verb-object, one fact per sentence, present tense, third person, the agent named. Dialogue is welcome. No exclamation marks.

**Three registers, and baseline is the default.**

- **Baseline** — the large majority of the words the player reads: step narration, band base text, aftermath overviews. Plain, concrete, active. One idea per sentence. Concrete nouns and verbs over abstractions; dry understatement over ornament. Stacked metaphor, archaic diction and ornamental subordinate clauses are drift. If a word would send a reader to a dictionary, it does not belong here.
- **Character** — dialogue and agent-attributed lines. Idiosyncratic per persona, but comprehension first. At most one florid voice per scene; the narration around it stays baseline.
- **Peak** — rationed lyricism, and only on a declared peak surface: the final step's band prose, the fate-reveal line, major aftermath beats. At most one figurative image per paragraph even there.

**Interactive text is always plain.** Card names, \`effectLine\`s, factor lines, purpose lines, buttons, tooltips: no metaphor, no ambiguity about what a click does. Card names are imperative verb + noun ("Inspire Courage", never "A Little More"); an effect line is one or two direct sentences. The card flavor quote is retired.

**Absent declaration means baseline.** \`register?: 'baseline' | 'character' | 'peak'\` is additive and optional. Do not declare \`peak\` to license a lyrical impulse in ordinary narration — that is the exact drift this model exists to stop.

**Baseline, right:**

> The merchant owed too many people too much. He'd started checking the door. When the collector's boy finally came, he already had the ledger open — not to pay, but to show how little was left.

**Baseline, wrong** — same beat, ornamental diction, sends the reader to a dictionary:

> The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants.

**Peak, right** — a doom transition, which is a declared peak surface:

> The bells stopped. Whatever had been holding its breath beneath the city let it out.

**Rule zero: game prose, not novel prose — clarity beats compression.** A sentence that needs two readings is a defect however good it sounds.

> Sources: Docs/canon/prose.md (the register model; narrator mode — Prose Doctrine v2). Full doctrine, the five Seed Dice and the director's calibration exemplar: .claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md § Prose doctrine v2.`;

const SECTION_D_PLAYER_AS_GOD = `## Section D: Player-as-God Framing Constraint

The player is a god who observes through threads and intervenes indirectly. They **NEVER** make choices for the character. Every player-facing option is a **nudge** — a concrete, sphere-flavoured exercise of the god's influence on the scene or on the mortal's inner weather (a stumble on loose stone, an urge arriving in sleep, a sense that this has happened before, an old ambition catching light again, a face nobody afterwards quite recalls, a wound that closes cleaner than it should), never an instruction to the mortal (say this, go there, fight) and never a choice between authored endings. **Influence, never authorship.** The mortal acts according to their personality and the god's influence. Playing nothing must always be viable: a hand is an offer, not a toll gate.

**Auto-REVISE trigger:** Any encounter where the player "chooses how the character responds" must be rejected and reframed as a nudge hand.

> Source: encounter-pipeline SKILL.md — player-as-god framing constraint`;

/**
 * Header line that opens the live SKILL's editorial rejection-trigger list.
 *
 * The list is a numbered markdown block that runs to the first non-numbered, non-blank
 * line. Anchoring on the header rather than a line count means adding a trigger to the
 * SKILL needs no change here.
 */
export const REJECTION_TRIGGERS_ANCHOR = /^\*\*Automatic REVISE triggers\*\*/;

/**
 * Pull the numbered rejection-trigger entries out of the encounter-pipeline SKILL.
 *
 * Section E used to be a hardcoded copy of this list and drifted six entries behind it
 * (THR-1250). Deriving makes divergence impossible rather than merely detectable.
 *
 * Throws when the anchor is missing or the list is empty — a silently empty Section E on
 * the surface authors are told to read FIRST is the failure this whole file exists to stop.
 */
export function extractRejectionTriggers(skillLines: string[]): string[] {
  const anchorIdx = skillLines.findIndex((l) => REJECTION_TRIGGERS_ANCHOR.test(l));
  if (anchorIdx === -1) {
    throw new Error(
      `Expected anchor not found: ${REJECTION_TRIGGERS_ANCHOR.toString()} in ${ENCOUNTER_PIPELINE_SKILL_RELPATH}`,
    );
  }

  const triggers: string[] = [];
  for (let i = anchorIdx + 1; i < skillLines.length; i++) {
    const line = skillLines[i];
    if (line.trim() === "") {
      // Blank lines inside the list are tolerated; a blank that ends it is caught by the
      // next non-blank line failing the numbered-entry test.
      continue;
    }
    if (!/^\d+\.\s/.test(line)) break;
    triggers.push(line);
  }

  if (triggers.length === 0) {
    throw new Error(
      `No rejection triggers found under the anchor in ${ENCOUNTER_PIPELINE_SKILL_RELPATH} — ` +
        `Section E would compile empty.`,
    );
  }

  return triggers;
}

/** Render the extracted triggers as the brief's Section E. */
export function buildRejectionTriggerSection(skillLines: string[]): string {
  return [
    "## Section E: Editorial Rejection Triggers",
    "",
    "The following trigger **REVISE BEFORE CONTINUING** (non-negotiable — address before proceeding):",
    "",
    ...extractRejectionTriggers(skillLines),
    "",
    "> Source: encounter-pipeline SKILL.md — Automatic REVISE triggers (extracted at generation time)",
  ].join("\n");
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- Pure functions (exported for tests) ---

export function hashContent(content: string | Buffer): string {
  return crypto
    .createHash(AUTHORING_BRIEF_HASH_ALGORITHM)
    .update(typeof content === "string" ? Buffer.from(content, "utf8") : content)
    .digest("hex");
}

/**
 * Identity of the hardcoded sections (A and D).
 *
 * Stamped into the brief header alongside the source-doc hashes so that rewording a constant
 * invalidates the cached brief exactly as editing a source doc does. Without this the sections
 * were outside every freshness gate by construction (THR-1185). Section E left this set in
 * THR-1250 - it is extracted from the live SKILL and covered by that source's own stamp.
 */
export const AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH = hashContent(
  `${SECTION_A_REGISTER}
${SECTION_D_PLAYER_AS_GOD}`,
);

/** Raw contents of every {@link AUTHORING_BRIEF_SOURCES} entry, by role. */
export type BriefSourceContents = {
  wiringGuide: string;
  directionDoc: string;
  skill: string;
};

/**
 * Hash the part of a source the brief actually compiles from.
 *
 * Whole-file for the two prose docs; **trigger block only** for the SKILL, so an edit to any
 * other part of that long file does not restamp the brief. Both the generator and
 * `check:authoring-brief` call this, which is what keeps their verdicts in lockstep - the
 * checker computing a hash a different way is how a freshness gate goes quietly vacuous.
 */
export function hashBriefSource(relPath: string, content: string): string {
  if (relPath === ENCOUNTER_PIPELINE_SKILL_RELPATH) {
    const lines = content.split(/\r?\n/);
    return hashContent(extractRejectionTriggers(lines).join("\n"));
  }
  return hashContent(content);
}

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
 *
 * `sourceHashes` is positional against {@link AUTHORING_BRIEF_SOURCES}: callers pass the
 * hashes in the same order the sources are declared, so adding a source cannot silently
 * leave a stamp off the header.
 */
export function buildBrief(
  sources: BriefSourceContents,
  sourceHashes: readonly string[],
  generatedAt: string,
): string {
  if (sourceHashes.length !== AUTHORING_BRIEF_SOURCES.length) {
    throw new Error(
      `buildBrief: expected ${AUTHORING_BRIEF_SOURCES.length} source hashes ` +
        `(one per AUTHORING_BRIEF_SOURCES entry), got ${sourceHashes.length}.`,
    );
  }

  const wiringLines = sources.wiringGuide.split(/\r?\n/);
  const directionLines = sources.directionDoc.split(/\r?\n/);
  const skillLines = sources.skill.split(/\r?\n/);

  const capabilitySections: string[] = [];
  for (let capNum = 1; capNum <= 7; capNum++) {
    capabilitySections.push(...extractCapabilitySection(wiringLines, capNum));
  }

  const principlesSections = extractPrinciplesSections(directionLines);
  const rejectionTriggerSection = buildRejectionTriggerSection(skillLines);

  const sourceStamps = AUTHORING_BRIEF_SOURCES.map(
    (relPath, idx) => `>   - ${relPath} (${AUTHORING_BRIEF_HASH_ALGORITHM}: ${sourceHashes[idx]})`,
  );

  const lines: string[] = [
    "# Authoring Brief",
    "",
    `> **Generated:** ${generatedAt} by scripts/build-authoring-brief.ts`,
    `> **Sources:**`,
    ...sourceStamps,
    `>   - Sections A/D, hardcoded in the generator (${AUTHORING_BRIEF_HASH_ALGORITHM}: ${AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH})`,
    "> **Do not hand-edit.** Regenerate via `npm run build-authoring-brief`.",
    "",
    "---",
    "",
    SECTION_A_REGISTER,
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
    // Section A governs this section — restated here because Section C is the block agents
    // are told to inject into the draft prompt on its own (SKILL.md § Game Design Direction
    // Enforcement), and would otherwise arrive with no voice constraint attached.
    "> **Section A governs every principle below.** These say what an encounter must *do*. None of them licenses ornate prose: the effect is produced by what happens in the scene, stated plainly, in narrator mode.",
    "",
    ...principlesSections.slice(1), // skip the "## Encounter Design Principles" heading — we have our own section header
    "---",
    "",
    SECTION_D_PLAYER_AS_GOD,
    "",
    "---",
    "",
    rejectionTriggerSection,
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

/**
 * Read the header stamps back out of an existing brief.
 *
 * `sourceHashes` is positional against {@link AUTHORING_BRIEF_SOURCES} and the hardcoded
 * sections stamp is the entry after them. A brief written before a source was added carries
 * fewer stamps than there are sources; the missing ones come back `null` rather than absent,
 * so every caller reads them as drifted and regenerates instead of silently comparing
 * `undefined === undefined`.
 */
export function extractHashesFromBrief(
  briefContent: string,
): { sourceHashes: readonly (string | null)[]; sectionsHash: string | null } | null {
  const matches = [...briefContent.matchAll(HASH_LINE_PATTERN)];
  if (matches.length < 2) return null;
  return {
    sourceHashes: AUTHORING_BRIEF_SOURCES.map((_, idx) => matches[idx]?.[1] ?? null),
    sectionsHash: matches[AUTHORING_BRIEF_SOURCES.length]?.[1] ?? null,
  };
}

// --- Main ---

/**
 * Read every {@link AUTHORING_BRIEF_SOURCES} entry and hash the part the brief compiles from.
 * Exits 1 naming the missing path rather than compiling a brief with a hole in it.
 */
export function readSources(rootDir: string): {
  contents: BriefSourceContents;
  hashes: string[];
} {
  const raw = AUTHORING_BRIEF_SOURCES.map((relPath) => {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      console.error(`error: source not found: ${relPath}`);
      process.exit(1);
    }
    return fs.readFileSync(absPath, "utf8");
  });

  const [wiringGuide, directionDoc, skill] = raw;
  return {
    contents: { wiringGuide, directionDoc, skill },
    hashes: AUTHORING_BRIEF_SOURCES.map((relPath, idx) => hashBriefSource(relPath, raw[idx])),
  };
}

async function main(): Promise<void> {
  const outputPath = path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH);
  const { contents, hashes } = readSources(repoRoot);

  AUTHORING_BRIEF_SOURCES.forEach((relPath, idx) => {
    console.info(`info: ${relPath} sha1=${hashes[idx]}`);
  });

  // Check if existing brief is up to date
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, "utf8");
    const existingHashes = extractHashesFromBrief(existing);
    if (
      existingHashes &&
      existingHashes.sourceHashes.every((h, idx) => h === hashes[idx]) &&
      existingHashes.sectionsHash === AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH
    ) {
      console.info("info: brief is up to date — no changes written.");
      process.exit(0);
    }
  }

  const generatedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let brief: string;
  try {
    brief = buildBrief(contents, hashes, generatedAt);
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
