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
 *
 * THR-1513 — when the commit range is empty (nothing committed on the branch yet,
 * which is exactly when the browser-verify route decision is owed) the classifier
 * falls back to the **working tree**: tracked edits against HEAD plus untracked
 * paths. The header names which set produced the verdict, because the two answer
 * different questions — the committed set is what CI will classify, the working-tree
 * set is a preview of it.
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
 *
 * THR-1513: the test was void from 2026-09-12 to 2026-09-18 — the reminder could not
 * render pre-commit (empty commit range, impediment row 1042 ×3) and the pickup lane
 * named the script only inside the docs-only drain. Both are fixed; the tally counts
 * from the day this ships. The reminder is still **path-triggered**, and the route
 * rule is **Done-when-triggered** (THR-1494 owed browser evidence with zero UI-pillar
 * paths), so the text points at the claim-time rule rather than pretending a path
 * list can decide it.
 */
export const UI_PILLAR_REMINDER = [
  "UI pillar — browser-verify evidence owed (four-part, verification-gates.md § Browser-verify).",
  "The route is decided at CLAIM from the ticket's Done-when, not from this path list",
  "(§ Browser-verify, route decision rule, 2026-09-18). Unattended run? The route must",
  "already be in the claim comment; if not, record the Browser-verify substitution line",
  "NOW, before the capture.",
].join("\n");

/**
 * THR-1513 — printed on a code diff that touches **no** UI-pillar path. The path list
 * cannot see a Done-when-shaped obligation (THR-1494: "what does the scene screen
 * show" owed browser evidence while touching only engine and content files), so the
 * absence of the reminder above must not read as "no browser evidence owed".
 */
export const DONE_WHEN_ROUTE_NOTE =
  "No UI-pillar path — but the browser-verify route rule is Done-when-triggered, not path-triggered:\n" +
  "if the ticket asks what a surface shows, the route was owed at claim (verification-gates.md § Browser-verify).";

/** Which file set produced the verdict (THR-1513). */
export type ClassificationSource = "committed" | "working-tree";

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
 * Untracked paths from `git status --porcelain` output — the `??` rows. Pure so the
 * parser is testable without a repository; `-z` is deliberately not used because the
 * one caller is a human-readable script and a NUL-separated parse buys nothing here.
 */
export function parseUntrackedPaths(porcelain: string): string[] {
  return porcelain
    .split("\n")
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3).trim())
    .filter((line) => line !== "");
}

/**
 * The working-tree fallback set (THR-1513): tracked edits against HEAD (staged or
 * not) plus untracked paths, deduplicated, order preserved. A freshly created file
 * under `src/components/` is untracked, and `git diff --name-only HEAD` does not list
 * untracked paths — so without the second source the case this fallback exists for
 * (an uncommitted edit, nothing on the branch) would still read as zero changes.
 */
function workingTreeFiles(): string[] {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" });
  const porcelain = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    encoding: "utf8",
  });
  return mergeFileSets(
    tracked.split("\n").filter((line) => line.trim() !== ""),
    parseUntrackedPaths(porcelain),
  );
}

/** Union of two path lists, first-seen order, blanks dropped. Pure. */
export function mergeFileSets(first: readonly string[], second: readonly string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const file of [...first, ...second]) {
    const trimmed = file.trim();
    if (trimmed === "" || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }
  return merged;
}

/**
 * Which set the verdict is computed from (THR-1513). The committed range wins
 * whenever it is non-empty — it is what CI classifies — and the working tree is
 * consulted only when the range is empty. Pure so the precedence is testable.
 */
export function selectFileSet(
  committed: readonly string[],
  workingTree: readonly string[],
): { files: string[]; source: ClassificationSource } {
  if (committed.length > 0) return { files: [...committed], source: "committed" };
  return { files: [...workingTree], source: "working-tree" };
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
export function renderClassification(
  files: readonly string[],
  base: string,
  source: ClassificationSource = "committed",
): string {
  const surviving = survivingPaths(files);
  const verdict = classifyDiff(files);
  const uiPillar = uiPillarPaths(files);
  const provenance =
    source === "working-tree"
      ? `base: ${base} is empty — read from the WORKING TREE, ${files.length} uncommitted`
      : `base: ${base}, ${files.length} changed`;
  const lines: string[] = [`classify:diff — ${verdict}  (${provenance})`];

  if (files.length === 0) {
    // Both the committed range and the working tree are empty (THR-1513 widened the
    // read; before it, an uncommitted working tree alone read as zero changes and
    // classified docs-only — impediment row 1042). A verdict on nothing is vacuous
    // and is named as such rather than trusted.
    lines.push(
      "\nNo committed changes against this base and no uncommitted edits in the working tree." +
        "\nThis verdict is vacuous — make the change first, or pass --base <ref>.",
    );
    return lines.join("\n");
  }

  if (source === "working-tree") {
    lines.push(
      "\nPreview: the committed range is what CI classifies. This verdict covers the",
      "uncommitted working tree so the gate track — and the browser-verify route — can be",
      "chosen before the first commit (THR-1513). Re-run after committing.",
    );
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
  } else {
    lines.push(`\n${DONE_WHEN_ROUTE_NOTE}`);
  }

  lines.push(`\nEquivalent shell one-liner:\n  ${DOCS_ONLY_CLASSIFY_COMMAND}`);
  return lines.join("\n");
}

function main(): void {
  const { base, json } = parseArgs(process.argv.slice(2));

  let files: string[];
  let source: ClassificationSource;
  try {
    const committed = changedFiles(base);
    // THR-1513: consult the working tree only when the range is empty. The second
    // read is wrapped by the same try, so a broken repository fails loud either way.
    const selected = selectFileSet(committed, committed.length === 0 ? workingTreeFiles() : []);
    files = selected.files;
    source = selected.source;
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
        source,
        changed: files.length,
        surviving: survivingPaths(files),
        uiPillar: uiPillarPaths(files),
      }),
    );
    return;
  }

  console.log(renderClassification(files, base, source));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
