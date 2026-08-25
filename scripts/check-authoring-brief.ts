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
 * Drift now fails; the "cannot judge" states below still exit 0, because refusing to answer
 * is not the same as answering "diverged".
 */
export const AUTHORING_BRIEF_DRIFT_EXIT_CODE = 1;

function main(): void {
  const outputPath = path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH);

  if (!fs.existsSync(outputPath)) {
    process.stderr.write(
      `warn: ${AUTHORING_BRIEF_OUTPUT_PATH} does not exist — run \`npm run build-authoring-brief\` to generate it.\n`,
    );
    process.exit(0);
  }

  const missingSources = AUTHORING_BRIEF_SOURCES.filter(
    (relPath) => !fs.existsSync(path.join(repoRoot, relPath)),
  );
  if (missingSources.length > 0) {
    process.stderr.write(
      `warn: source(s) missing (${missingSources.join(", ")}) — skipping authoring-brief drift check.\n`,
    );
    process.exit(0);
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
    process.exit(0);
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
  process.exit(0);
}

main();
