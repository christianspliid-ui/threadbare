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

// Sections D and E are stable content from the encounter-pipeline skill — hardcoded here
// so they don't require reading the skill file at generation time.
const SECTION_D_PLAYER_AS_GOD = `## Section D: Player-as-God Framing Constraint

The player is a god who observes through threads and intervenes indirectly. They **NEVER** make choices for the character. When writing encounter choices, intervention options, or any player-facing decision point: the choices must be what the *god* does (whisper, send vision, steady, strengthen, withdraw), never what the *mortal* does (say this, go there, fight). The mortal acts according to their personality and the god's influence. "Let them handle it" must always be a valid option.

**Auto-REVISE trigger:** Any encounter where the player "chooses how the character responds" must be rejected and reframed as divine intervention.

> Source: encounter-pipeline SKILL.md — player-as-god framing constraint`;

const SECTION_E_REJECTION_TRIGGERS = `## Section E: Editorial Rejection Triggers

The following trigger **REVISE BEFORE CONTINUING** (non-negotiable — address before proceeding):

1. No approach prose — steps lack descriptive setup before choices appear
2. Generic god-verbs — "intervene" / "help" / "act" with no specific divine framing
3. No thread integration — encounter doesn't acknowledge the agent's relationships, history, or traits
4. Missing aftermath reaction choices — scale medium+ must offer branching aftermath reactions
5. Reporter prose — outcomes tell what happened ("they succeeded") rather than how it felt
6. No concept art recommendation — brief omitted or too vague to paint a scene
7. Missing per-step approach cards — steps lack god-verb intervention options (whisper / send vision / steady / strengthen / withdraw)
8. Player "chooses how the character responds" — player-as-god framing violated (see Section D)

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

export function extractHashesFromBrief(briefContent: string): { wiringHash: string; directionHash: string } | null {
  const matches = [...briefContent.matchAll(HASH_LINE_PATTERN)];
  if (matches.length < 2) return null;
  return { wiringHash: matches[0][1], directionHash: matches[1][1] };
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
      existingHashes.directionHash === directionHash
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

// Only execute main when this is the entry point, not when imported by tests
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  void main();
}
