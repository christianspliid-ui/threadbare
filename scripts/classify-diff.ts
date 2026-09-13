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
  uiPillarPaths,
} from "./docs-only-predicate.ts";

const DEFAULT_BASE = "origin/main...HEAD";

/**
 * THR-1471 — the browser-verify route reminder.
 *
 * The rule it restates is written twice already (`Docs/canon/verification-gates.md`
 * § Browser-verify, and pull-work Step 3) and was read at the binding moment in
 * neither: impediment row 1011 recorded a run that implemented THR-1452 in full, ran
 * suite/ratchet/build/CLI smoke, and only then hit the `preview_start` unattended
 * refusal at the capture — ×4, on a class whose tail runs rows 546 (×13), 574,
 * 638 (×12), 683 (×13).
 *
 * So this is deliberately *output*, not a gate. Every code-diff session already runs
 * `classify:diff` before choosing a gate track, which makes it the one surface that
 * reaches the session at the moment the route still costs nothing to choose. Nothing
 * fails on it; the failure mode is unchanged.
 *
 * It is also a theory test (2026-09-12 retro § Patterns to Watch): if the class
 * recurs after this ships, discoverability was never the failure at any layer, and
 * the next rung is a hard gate — a director-level cost/benefit call, not this ticket.
 */
export const UI_PILLAR_REMINDER = [
  "UI pillar — browser-verify evidence owed (four-part, verification-gates.md § Browser-verify).",
  "Unattended run? The route must already be decided (claim comment); if not, record the",
  "Browser-verify substitution line NOW, before the capture.",
].join("\n");

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

/**
 * The human-readable report, as a string.
 *
 * Pure and exported so the reminder can be asserted on **the output a session
 * actually sees** rather than on the source that produces it. Inspecting the source
 * would be the weaker test the sibling predicate module already warns about
 * ("inspection alone cannot prove a pattern works") — and for a ticket whose entire
 * subject is a rule that was present but never read, "the line is in the file"
 * is precisely the assertion that proves nothing.
 */
export function renderClassification(files: readonly string[], base: string): string {
  const surviving = survivingPaths(files);
  const verdict = classifyDiff(files);
  const uiPillar = uiPillarPaths(files);
  const lines: string[] = [`classify:diff — ${verdict}  (base: ${base}, ${files.length} changed)`];

  if (files.length === 0) {
    // The documented predicate is a three-dot diff of COMMITTED state, so an
    // uncommitted working tree reads as zero changes and classifies docs-only. That
    // is the same answer the prose grep gives — deliberately, since disagreeing with
    // it would defeat the point — but it is a footgun worth naming rather than a
    // verdict worth trusting.
    lines.push(
      "\nNo committed changes against this base. If your work is still uncommitted," +
        "\nthis verdict is vacuous — commit first, or pass --base <ref>.",
    );
    return lines.join("\n");
  }

  if (verdict === "docs-only") {
    lines.push(
      "\nOwes the docs track only: check:generated-freshness, lint:plan-doc, check:impediment-ids.",
      "Do NOT run npm test / check:typecheck / vite build on a diff with no code in it.",
    );
    return lines.join("\n");
  }

  lines.push(`\n${surviving.length} path(s) make this a code diff:`);
  for (const file of surviving) lines.push(`  ${file}`);
  lines.push("\nOwes the full gate: npm test, check:typecheck, vite build, plus the closeout gates.");

  // Reachable only from here by construction: every UI-pillar prefix lives under
  // `src/`, which no doc glob excludes, so a diff with a UI path always classifies
  // `code`. The membership test still runs over the whole file list rather than over
  // `surviving`, so the reminder cannot go missing if that ever stops holding.
  if (uiPillar.length > 0) {
    lines.push(`\n${UI_PILLAR_REMINDER}`);
    for (const file of uiPillar) lines.push(`  ${file}`);
  }

  lines.push(`\nEquivalent shell one-liner:\n  ${DOCS_ONLY_CLASSIFY_COMMAND}`);
  return lines.join("\n");
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

  if (json) {
    console.log(
      JSON.stringify({
        verdict: classifyDiff(files),
        base,
        changed: files.length,
        surviving: survivingPaths(files),
        uiPillar: uiPillarPaths(files),
      }),
    );
    return;
  }

  console.log(renderClassification(files, base));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
