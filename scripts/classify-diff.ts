/**
 * THR-988 — the runnable docs-only classifier.
 *
 * Answers the question every session asks before choosing a gate track: *is this
 * diff documentation-only, or does it contain code?* It computes the answer from
 * `scripts/docs-only-predicate.ts`, which derives the predicate from the same two
 * constants `ci.yml` is pinned to — so this cannot disagree with CI the way a
 * hand-copied grep can.
 *
 * The prose copies in CLAUDE.md, AGENTS.md, `Docs/canon/process.md`, the pull-work
 * skill, and the tb-opus-pickup mirror **stay inline** rather than being replaced by
 * "run this script", for two reasons: they exist partly to *explain* the two trailing
 * THR-922 paths, and an agent in a fresh worktree with no `node_modules` can still
 * paste a grep. `check:predicate-copies` is what keeps them honest.
 *
 * Run:
 *   npm run classify:diff                  # against origin/main...HEAD
 *   npm run classify:diff -- --base HEAD~1
 *   npm run classify:diff -- --json
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  DOCS_ONLY_CLASSIFY_COMMAND,
  classifyDiff,
  survivingPaths,
} from "./docs-only-predicate.ts";

const DEFAULT_BASE = "origin/main...HEAD";

function parseArgs(argv: readonly string[]): { base: string; json: boolean } {
  const baseIndex = argv.indexOf("--base");
  return {
    base: baseIndex !== -1 && argv[baseIndex + 1] ? argv[baseIndex + 1]! : DEFAULT_BASE,
    json: argv.includes("--json"),
  };
}

function changedFiles(base: string): string[] {
  const output = execFileSync("git", ["diff", "--name-only", base], { encoding: "utf8" });
  return output.split("\n").filter((line) => line.trim() !== "");
}

function main(): void {
  const { base, json } = parseArgs(process.argv.slice(2));

  let files: string[];
  try {
    files = changedFiles(base);
  } catch (error) {
    // Fail loud rather than defaulting to a verdict. Guessing "docs-only" here would
    // skip the suite on an unclassifiable diff, which is the vacuous gate THR-768 is
    // about; guessing "code" would quietly reimpose the cost THR-917 removed.
    console.error(`classify:diff — could not diff against '${base}': ${(error as Error).message}`);
    console.error("Try `git fetch origin main` first, or pass --base <ref>.");
    process.exitCode = 2;
    return;
  }

  const surviving = survivingPaths(files);
  const verdict = classifyDiff(files);

  if (json) {
    console.log(JSON.stringify({ verdict, base, changed: files.length, surviving }));
    return;
  }

  console.log(`classify:diff — ${verdict}  (base: ${base}, ${files.length} changed)`);

  if (files.length === 0) {
    // The documented predicate is a three-dot diff of COMMITTED state, so an
    // uncommitted working tree reads as zero changes and classifies docs-only. That
    // is the same answer the prose grep gives — deliberately, since disagreeing with
    // it would defeat the point — but it is a footgun worth naming rather than a
    // verdict worth trusting.
    console.log(
      "\nNo committed changes against this base. If your work is still uncommitted," +
        "\nthis verdict is vacuous — commit first, or pass --base <ref>.",
    );
    return;
  }

  if (verdict === "docs-only") {
    console.log(
      "\nOwes the docs track only: check:generated-freshness, lint:plan-doc, check:impediment-ids.",
    );
    console.log("Do NOT run npm test / check:typecheck / vite build on a diff with no code in it.");
    return;
  }

  console.log(`\n${surviving.length} path(s) make this a code diff:`);
  for (const file of surviving) console.log(`  ${file}`);
  console.log("\nOwes the full gate: npm test, check:typecheck, vite build, plus the closeout gates.");
  console.log(`\nEquivalent shell one-liner:\n  ${DOCS_ONLY_CLASSIFY_COMMAND}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
