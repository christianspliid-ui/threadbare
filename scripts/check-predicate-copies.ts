/**
 * THR-988 — fail when any prose copy of the docs-only predicate drifts from the
 * canonical one.
 *
 * ## Why this runs on the docs track
 *
 * Every copy this checks is a documentation file, so the PR that breaks one is a
 * documentation PR — and a documentation PR skips `Test · Typecheck · Build` by
 * design (THR-491/THR-917). A guard that lived only in `npm test` would therefore
 * never see the change that broke it; it would go red on the *next unrelated code
 * PR*, which is precisely failure mode A that `docs-code-decoupling.test.ts` exists
 * to forbid.
 *
 * So this is wired into CI's `Docs gates` job, where a docs PR is actually gated.
 * The vitest test in `docs-code-decoupling.test.ts` calls the same function, which
 * covers the other direction — a *code* PR editing `ci.yml` or the constants in
 * `generated-artifact-sources.ts` — with one implementation and two invocation
 * surfaces rather than two copies of the logic.
 *
 * Run: `npm run check:predicate-copies`
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  DOCS_ONLY_CLASSIFY_COMMAND,
  PREDICATE_COPIES,
  comparePredicate,
  extractGrepPatterns,
  type PredicateDivergence,
} from "./docs-only-predicate.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type PredicateCopyReport = {
  readonly ok: boolean;
  readonly checked: number;
  /** Copies whose file exists but carries no `grep -vE '...'` at all. */
  readonly missing: string[];
  readonly divergences: PredicateDivergence[];
};

/**
 * Check every registered prose copy.
 *
 * A file that exists but has lost the pattern entirely is reported as `missing`
 * rather than passing silently — otherwise deleting the predicate from a doc would
 * be the one edit this gate waves through, and "the copy is gone" is the same
 * failure as "the copy is wrong" for an agent reading that file to decide its track.
 */
export function checkPredicateCopies(repoRoot: string = REPO_ROOT): PredicateCopyReport {
  const missing: string[] = [];
  const divergences: PredicateDivergence[] = [];
  let checked = 0;

  for (const copy of PREDICATE_COPIES) {
    const absolute = path.join(repoRoot, copy.path);
    if (!fs.existsSync(absolute)) {
      // A renamed or deleted instruction file is a real finding: the row is stale
      // and nothing else would notice.
      missing.push(`${copy.path} (registered as: ${copy.why}) — file not found`);
      continue;
    }

    const patterns = extractGrepPatterns(fs.readFileSync(absolute, "utf8"));
    if (patterns.length === 0) {
      missing.push(`${copy.path} (registered as: ${copy.why}) — no \`grep -vE '...'\` found`);
      continue;
    }

    for (const pattern of patterns) {
      checked += 1;
      divergences.push(...comparePredicate(copy.path, pattern));
    }
  }

  return { ok: missing.length === 0 && divergences.length === 0, checked, missing, divergences };
}

function main(): void {
  const report = checkPredicateCopies();

  if (report.ok) {
    console.log(
      `check:predicate-copies — OK, ${report.checked} predicate copies across ${PREDICATE_COPIES.length} files agree with the canonical one.`,
    );
    return;
  }

  console.error("check:predicate-copies — FAILED\n");

  for (const entry of report.missing) {
    console.error(`  MISSING  ${entry}`);
  }
  for (const divergence of report.divergences) {
    const where = divergence.fixture === null ? "" : ` [${divergence.fixture}]`;
    console.error(`  DRIFTED  ${divergence.file}${where}: ${divergence.detail}`);
  }

  console.error(
    `\nThe canonical predicate is derived in scripts/docs-only-predicate.ts from` +
      `\nDOC_EXCLUDED_GLOBS + DOC_TO_CODE_ALLOWLIST, which ci.yml is already pinned to.` +
      `\nFix the prose copy to match:\n\n  ${DOCS_ONLY_CLASSIFY_COMMAND}\n`,
  );
  process.exitCode = 1;
}

// Entry guard: importable by the vitest test without running main().
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
