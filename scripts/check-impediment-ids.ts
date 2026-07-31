#!/usr/bin/env node

/**
 * Fails when two rows in `Docs/impediments.md` claim the same `#`.
 *
 * **Why this is a blocking gate and not an advisory one (THR-881).** The log is
 * marked `merge=union` in `.gitattributes` (THR-691) so that concurrent appends
 * from different lanes merge without conflict. Union does exactly what it says:
 * it keeps *both* sides of every conflicting hunk. That is right for the rows and
 * wrong for the row *number*, because two lanes appending on the same day each
 * pick "the next number" independently and union then preserves both.
 *
 * The number is the dashboard's primary key — `generate-impediment-dashboard`
 * emits `"num": "<n>"` per entry, and `Design/impediment-dashboard.html` is a
 * blocking freshness artifact (THR-690). But that freshness gate only checks the
 * artifact matches its source, never that the source's keys are distinct, so a
 * duplicate regenerates cleanly and ships green. Fifteen had accumulated by
 * 2026-07-31, the oldest since March, each noticed at least three separate times
 * (`Docs/retrospectives/2026-03-29-retro.md`, `Design/retros/retro-2026-07-20.md`
 * action E5, `Design/user-actions.md`) and never repaired.
 *
 * **This closes the hole rather than merely reporting it.** Union can still merge
 * two same-numbered rows locally, but the losing lane's PR now fails CI before it
 * reaches `main`: lane A merges #336, lane B's branch then carries `main`'s #336
 * plus its own, and this check rejects it. Detection at the merge gate is what
 * makes the hand-assigned integer safe again — see the id-scheme note below.
 *
 * **Why the id scheme was not migrated.** A date-plus-slug id
 * (`2026-07-30-worktree-write-guard`) cannot collide by construction, and was
 * considered. It was declined: 335 rows plus ~25 prose cross-references across
 * `Docs/changelog.md`, `Docs/project-history.md`, the retros, an audit report and
 * a test comment would each need migrating or a permanent alias table, and the
 * collision pressure the scheme removes is fully removed by this check anyway,
 * because the check runs before the merge that would land the duplicate. The
 * migration buys prettiness; this buys the invariant.
 *
 * Run: `npm run check:impediment-ids`
 * Exits 0 when every `#` is unique, 1 otherwise.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseImpedimentLog } from "./impediment-log.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMPEDIMENTS_PATH = path.join(REPO_ROOT, "Docs", "impediments.md");

/** Rendered in the failure message so a fixer does not have to derive the next free number. */
function nextFreeNum(nums: string[]): number {
  const numeric = nums.map((n) => Number.parseInt(n, 10)).filter((n) => Number.isFinite(n));
  return numeric.length > 0 ? Math.max(...numeric) + 1 : 1;
}

function main(): void {
  if (!fs.existsSync(IMPEDIMENTS_PATH)) {
    console.error(`check:impediment-ids: missing impediment log at ${IMPEDIMENTS_PATH}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(IMPEDIMENTS_PATH, "utf8");
  const { entries, tableCount, duplicateNums } = parseImpedimentLog(markdown);

  if (duplicateNums.length === 0) {
    console.log(`check:impediment-ids: OK — ${tableCount} table rows, every # unique.`);
    return;
  }

  const suggested = nextFreeNum(entries.filter((e) => e.form === "table").map((e) => e.num));

  console.error(
    `check:impediment-ids: FAIL — ${duplicateNums.length} duplicate impediment number(s) in Docs/impediments.md.\n`,
  );
  for (const { num, lines } of duplicateNums) {
    console.error(`  #${num} claimed by ${lines.length} rows — lines ${lines.join(", ")}`);
  }
  console.error(
    [
      "",
      "The impediment number is the dashboard's primary key. Two rows sharing one",
      "number render as one entry's id against two different impediments, and every",
      "later retrospective that reads by number reads the wrong row.",
      "",
      `Fix: keep the number on the row that appears FIRST in the file (existing prose`,
      `cross-references resolve to it), and renumber each later row from #${suggested} up.`,
      "Record the old number in the renumbered row's Session Context column, e.g.",
      `"Renumbered from #<old> by THR-881 (duplicate-number repair)", so an existing`,
      "reference to the old number is still traceable.",
      "",
      "Then regenerate the dashboard: npm run generate-impediment-dashboard",
    ].join("\n"),
  );
  process.exit(1);
}

main();
