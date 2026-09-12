#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  extractHashesFromBrief,
  hashBriefSource,
  AUTHORING_BRIEF_OUTPUT_PATH,
  AUTHORING_BRIEF_SOURCES,
  AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH,
} from "./build-authoring-brief.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Exit code for a brief that has drifted from its sources.
 *
 * This check used to exit 0 on every path and print a `warn:` line — so the one signal that
 * the preamble every encounter draft agent reads FIRST had gone stale was a line in a log
 * nobody reads, inside an `continue-on-error` CI step. THR-1250 found the compiled Section E
 * six triggers behind the live SKILL, and the reason it survived is that nothing ever failed.
 * Drift now fails; the "cannot judge" states below still exit 0 *on the drift question*,
 * because refusing to answer is not the same as answering "diverged".
 *
 * THR-1489 note: those states now return {@link reportBriefFloor}'s code rather than a bare
 * 0. The two questions are independent — a missing `Docs/authoring-brief.md` says nothing
 * about whether a batch brief rolled its query-prize face — and routing them through one
 * early `exit(0)` would have made the newer gate silently unreachable whenever the older
 * one could not judge.
 */
export const AUTHORING_BRIEF_DRIFT_EXIT_CODE = 1;

// ─── The query-prize floor on a batch brief (THR-1489) ───────────────

/**
 * Where a batch brief's rolled-constraint blocks live.
 *
 * Globbed rather than listed: a brief is written per batch and nothing registers
 * it, so a hardcoded list would silently stop covering the newest brief — which
 * is the one that matters.
 */
export const BATCH_BRIEF_DIR = 'Docs/plans/encounters';

/** Filename marker for a batch brief, matching how the pipeline names them. */
const BATCH_BRIEF_SUFFIX = '-brief.md';

/**
 * The die-B face a batch of {@link BATCH_SLOT_FLOOR_THRESHOLD} or more owes.
 *
 * Duplicated as a string rather than imported from `packetDice.ts` on purpose:
 * this script is bundled by esbuild with a narrow `--external` list, and pulling
 * the dice module in drags the whole content-eval graph (and its catalogs) into
 * a check that reads markdown. The catalog-health check is what binds the two
 * spellings — it fails when the die's face count and its canon disagree — so a
 * rename that missed this constant is caught there rather than here.
 */
export const QUERY_PRIZE_FACE = 'query_prize';

/** Slot count at which a brief is a *batch* and owes the floor. */
export const BATCH_SLOT_FLOOR_THRESHOLD = 6;

/** Minimum `query_prize` slots a batch brief must record. */
export const QUERY_PRIZE_BRIEF_FLOOR = 1;

export interface BriefFloorReport {
  readonly path: string;
  readonly slots: number;
  readonly queryPrizeSlots: number;
  /** False only for a brief that is a batch *and* misses the floor. */
  readonly satisfied: boolean;
  /** True when the brief records too few slots to be judged. */
  readonly belowThreshold: boolean;
}

/**
 * Count a brief's rolled slots and its `query_prize` faces.
 *
 * Accepts the face by **id or label**, case- and separator-insensitively, because
 * both spellings are in circulation: `draw:packet` prints
 * `shape:        Query Prize  [any + queried ending]` while the format doc's
 * skeleton and the one brief on disk write `shape: personality_fork`. A parser
 * that took only one would report a compliant batch as a violation, which is the
 * fastest way to get a gate switched off.
 */
export function briefFloorReport(path: string, content: string): BriefFloorReport {
  const shapes: string[] = [];
  for (const line of content.split('\n')) {
    const match = /^\s*shape:\s*([^[\n]+)/.exec(line);
    if (!match) continue;
    shapes.push(match[1].trim().toLowerCase().replace(/[\s_-]+/g, ''));
  }
  const wanted = QUERY_PRIZE_FACE.replace(/[\s_-]+/g, '');
  const queryPrizeSlots = shapes.filter(shape => shape === wanted).length;
  const belowThreshold = shapes.length < BATCH_SLOT_FLOOR_THRESHOLD;

  return {
    path,
    slots: shapes.length,
    queryPrizeSlots,
    belowThreshold,
    satisfied: belowThreshold || queryPrizeSlots >= QUERY_PRIZE_BRIEF_FLOOR,
  };
}

/** Every batch brief on disk, reported. Missing directory ⇒ empty, never a throw. */
export function batchBriefReports(root: string): readonly BriefFloorReport[] {
  const dir = path.join(root, BATCH_BRIEF_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith(BATCH_BRIEF_SUFFIX))
    .sort()
    .map(name => {
      const rel = `${BATCH_BRIEF_DIR}/${name}`;
      return briefFloorReport(rel, fs.readFileSync(path.join(dir, name), 'utf8'));
    });
}

function main(): void {
  const outputPath = path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH);

  if (!fs.existsSync(outputPath)) {
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} does not exist — run \`npm run build-authoring-brief\` to generate it.\n`,
    );
    process.exit(reportBriefFloor());
  }

  const missingSources = AUTHORING_BRIEF_SOURCES.filter(
    (relPath) => !fs.existsSync(path.join(repoRoot, relPath)),
  );
  if (missingSources.length > 0) {
    process.stderr.write(
      `warn: source(s) missing (${missingSources.join(", ")}) — skipping authoring-brief drift check.\n`,
    );
    process.exit(reportBriefFloor());
  }

  // Hashed through the generator's own hashBriefSource, never re-derived here — a checker
  // that computes its hashes a different way is how a freshness gate goes quietly vacuous.
  const currentHashes = AUTHORING_BRIEF_SOURCES.map((relPath) =>
    hashBriefSource(relPath, fs.readFileSync(path.join(repoRoot, relPath), "utf8")),
  );

  const briefContent = fs.readFileSync(outputPath, "utf8");
  const briefHashes = extractHashesFromBrief(briefContent);

  if (!briefHashes) {
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} has no recognisable hash stamps — run \`npm run build-authoring-brief\` to regenerate.\n`,
    );
    process.exit(reportBriefFloor());
  }

  const drifted = AUTHORING_BRIEF_SOURCES.filter(
    (_, idx) => briefHashes.sourceHashes[idx] !== currentHashes[idx],
  ) as string[];

  // THR-1185: the generator's hardcoded Sections A/D are a further source. Before they were
  // stamped, a reword of those constants was invisible to this check by construction — which
  // is how the brief spent months telling authors to write the rejected approach-card model
  // while this check reported "up to date" every single run.
  if (briefHashes.sectionsHash !== AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH) {
    drifted.push("generator sections A/D (scripts/build-authoring-brief.ts)");
  }

  if (drifted.length > 0) {
    process.stderr.write(
      `error: ${AUTHORING_BRIEF_OUTPUT_PATH} is stale — source(s) changed: ${drifted.join(", ")}. ` +
        `Run \`npm run build-authoring-brief\` and commit the result.\n`,
    );
    process.exit(AUTHORING_BRIEF_DRIFT_EXIT_CODE);
  }

  console.info(`info: ${AUTHORING_BRIEF_OUTPUT_PATH} is up to date.`);
  process.exit(reportBriefFloor());
}

/**
 * The query-prize floor over every batch brief on disk (THR-1489).
 *
 * Returns an exit code rather than calling `process.exit`, so the drift check
 * above stays the first failure a reader sees and this one composes with it.
 *
 * **Why the vacuity is printed rather than swallowed.** Measured 2026-09-13:
 * eight briefs sit in `Docs/plans/encounters/` and exactly one records a rolled
 * slot block at all — a single slot, below the batch threshold. So this gate
 * currently judges *nothing*, and a bare `OK` would be the empty-population
 * false pass: green because the sweep found no subject, indistinguishable from
 * green because every subject complied. The line says which, every run, so the
 * first real six-slot brief is the moment the number moves rather than the
 * moment someone wonders whether the check ever worked.
 */
function reportBriefFloor(): number {
  const reports = batchBriefReports(repoRoot);
  const judged = reports.filter(report => !report.belowThreshold);
  const violations = judged.filter(report => !report.satisfied);

  if (judged.length === 0) {
    console.info(
      `info: query-prize floor — VACUOUS: ${reports.length} brief(s) scanned, none records `
        + `${BATCH_SLOT_FLOOR_THRESHOLD}+ rolled slots, so no batch was judged.`,
    );
    return 0;
  }

  const authored = judged.reduce((sum, report) => sum + report.queryPrizeSlots, 0);
  console.info(
    `info: query-prize floor — ${judged.length} batch brief(s) judged, `
      + `${authored} \`${QUERY_PRIZE_FACE}\` slot(s) authored.`,
  );

  if (violations.length === 0) return 0;

  for (const report of violations) {
    process.stderr.write(
      `error: ${report.path} rolls ${report.slots} slot(s) and records `
        + `${report.queryPrizeSlots} \`${QUERY_PRIZE_FACE}\` face(s), under the floor of `
        + `${QUERY_PRIZE_BRIEF_FLOOR}. Re-roll with \`npm run draw:packet\` (which forces the `
        + 'floor), or state the override and its reason in the brief.\n',
    );
  }
  return AUTHORING_BRIEF_DRIFT_EXIT_CODE;
}

// Only execute main when this module is the check's entry point — not when a test
// imports it for the pure floor helpers above (THR-1489).
//
// Gated on the entry file's *basename*, the same idiom and for the same reason as
// `build-authoring-brief.ts`: `esbuild --bundle` rewrites `import.meta.url` to the
// bundle's own path, so the `import.meta.url === process.argv[1]` guard the other
// scripts use evaluates true inside a bundle and would defeat itself here. Bundling
// preserves the importer's outfile name, so the name test survives it.
const entryBasename = path.basename(process.argv[1] ?? "");
if (entryBasename.startsWith("check-authoring-brief")) {
  main();
}
