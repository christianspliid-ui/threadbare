#!/usr/bin/env node

/**
 * The live-log gate for `Docs/impediments.md`: every `#` distinct, and every entry
 * still parsed.
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
 * ## Why the population invariants live here too (THR-922)
 *
 * `scripts/__tests__/impediment-log.test.ts` used to read this same live log at
 * test time and assert against it: parse population versus an independent oracle,
 * and no dropped lines. That made `npm test`'s outcome a function of
 * **documentation content** — appending an impediment could redden the suite, so
 * logging one was never really a doc update.
 *
 * The delayed-detonation half was worse. CI *skips* the test job on the docs-only
 * PR that carries the append (THR-491), so a log edit that broke those assertions
 * landed green and failed the **next unrelated code PR** — a red suite
 * misattributed to whoever touched code next.
 *
 * So the invariants moved here, where they are checked on the PR that can actually
 * break them: this gate is blocking in CI, and since THR-909 it runs in the
 * `docs-check` job on documentation-only PRs. The vitest file keeps the parser's
 * *behaviour* pinned against committed fixtures; this file owns every assertion
 * about the *live corpus*.
 *
 * Run: `npm run check:impediment-ids`
 * Exits 0 when every `#` is unique and the log still parses in full, 1 otherwise.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isParagraphEntryLine,
  isTableEntryLine,
  parseImpedimentLog,
} from "./impediment-log.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMPEDIMENTS_PATH = path.join(REPO_ROOT, "Docs", "impediments.md");

/**
 * Floors proving the assertions below are not vacuous (NFP #1 — tunable
 * constants, not inline magic numbers).
 *
 * A log that parsed to zero entries would satisfy "no duplicates" and "nothing
 * dropped" for entirely the wrong reason — which is the exact shape that let
 * THR-764's single-format gate hide for a month. These are floors, not targets:
 * raise them only when the corpus has grown well past the new value, never to
 * match it exactly, or an ordinary archival trim turns the gate red.
 *
 * Measured 2026-08-01: 377 table rows, 97 paragraph entries.
 */
const LIVE_LOG_FLOORS = {
  /** Numbered table rows — the canonical form. */
  tableEntries: 300,
  /** Trailing paragraph entries — the second form THR-764 taught the parser. */
  paragraphEntries: 50,
} as const;

/** Rendered in the failure message so a fixer does not have to derive the next free number. */
function nextFreeNum(nums: string[]): number {
  const numeric = nums.map((n) => Number.parseInt(n, 10)).filter((n) => Number.isFinite(n));
  return numeric.length > 0 ? Math.max(...numeric) + 1 : 1;
}

/**
 * Population and no-dropped-lines checks against the live log (THR-922, moved from
 * `impediment-log.test.ts`).
 *
 * The oracle counts each form straight off the raw markdown using the same
 * predicates the parser uses to *recognise* a line, but none of the machinery it
 * uses to *parse* one. So a parser that recognises a line and then discards it —
 * THR-764's failure — shows up as a disagreement rather than as a quietly smaller
 * corpus.
 */
function checkPopulation(markdown: string, result: ReturnType<typeof parseImpedimentLog>): string[] {
  const lines = markdown.split(/\r?\n/);
  const oracle = {
    table: lines.filter((line) => isTableEntryLine(line)).length,
    paragraph: lines.filter((line) => isParagraphEntryLine(line)).length,
  };

  const failures: string[] = [];

  if (oracle.table < LIVE_LOG_FLOORS.tableEntries) {
    failures.push(
      `only ${oracle.table} table rows found (floor ${LIVE_LOG_FLOORS.tableEntries}) — ` +
        `either the log was truncated, or isTableEntryLine stopped recognising the canonical row form.`,
    );
  }
  if (oracle.paragraph < LIVE_LOG_FLOORS.paragraphEntries) {
    failures.push(
      `only ${oracle.paragraph} paragraph entries found (floor ${LIVE_LOG_FLOORS.paragraphEntries}) — ` +
        `this is the THR-764 shape: the second entry form going unrecognised.`,
    );
  }

  if (result.tableCount !== oracle.table) {
    failures.push(
      `parser kept ${result.tableCount} of ${oracle.table} recognised table rows — ${oracle.table - result.tableCount} dropped.`,
    );
  }
  if (result.paragraphCount !== oracle.paragraph) {
    failures.push(
      `parser kept ${result.paragraphCount} of ${oracle.paragraph} recognised paragraph entries — ${oracle.paragraph - result.paragraphCount} dropped.`,
    );
  }
  if (result.entries.length !== oracle.table + oracle.paragraph) {
    failures.push(
      `entry total is ${result.entries.length}, expected ${oracle.table + oracle.paragraph} (table + paragraph).`,
    );
  }

  return failures;
}

/** Renders the duplicate-number failures with the repair recipe. */
function reportDuplicates(result: ReturnType<typeof parseImpedimentLog>): void {
  const { entries, duplicateNums } = result;
  const suggested = nextFreeNum(entries.filter((e) => e.form === "table").map((e) => e.num));

  console.error(
    `  ${duplicateNums.length} duplicate impediment number(s):`,
  );
  for (const { num, lines } of duplicateNums) {
    console.error(`    #${num} claimed by ${lines.length} rows — lines ${lines.join(", ")}`);
  }
  console.error(
    [
      "",
      "  The impediment number is the dashboard's primary key. Two rows sharing one",
      "  number render as one entry's id against two different impediments, and every",
      "  later retrospective that reads by number reads the wrong row.",
      "",
      `  Fix: keep the number on the row that appears FIRST in the file (existing prose`,
      `  cross-references resolve to it), and renumber each later row from #${suggested} up.`,
      "  Record the old number in the renumbered row's Session Context column, e.g.",
      `  "Renumbered from #<old> by THR-881 (duplicate-number repair)", so an existing`,
      "  reference to the old number is still traceable.",
      "",
      "  Then regenerate the dashboard: npm run generate-impediment-dashboard",
    ].join("\n"),
  );
}

function main(): void {
  if (!fs.existsSync(IMPEDIMENTS_PATH)) {
    console.error(`check:impediment-ids: missing impediment log at ${IMPEDIMENTS_PATH}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(IMPEDIMENTS_PATH, "utf8");
  const result = parseImpedimentLog(markdown);
  const { tableCount, paragraphCount, duplicateNums } = result;

  const populationFailures = checkPopulation(markdown, result);

  if (duplicateNums.length === 0 && populationFailures.length === 0) {
    console.log(
      `check:impediment-ids: OK — ${tableCount} table rows + ${paragraphCount} paragraph entries parsed, every # unique.`,
    );
    return;
  }

  console.error("check:impediment-ids: FAIL — Docs/impediments.md did not pass the live-log gate.\n");

  if (populationFailures.length > 0) {
    console.error("  Parse population / dropped entries:");
    for (const failure of populationFailures) console.error(`    - ${failure}`);
    console.error(
      [
        "",
        "  These invariants moved here from npm test in THR-922, so that a change to the",
        "  log fails on the documentation PR that makes it rather than on the next",
        "  unrelated code PR. If the parser genuinely changed, fix the parser; if the log",
        "  genuinely shrank, adjust LIVE_LOG_FLOORS deliberately and say why.",
        "",
      ].join("\n"),
    );
  }

  if (duplicateNums.length > 0) reportDuplicates(result);

  process.exit(1);
}

main();
