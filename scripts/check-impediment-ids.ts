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
 * ## The repair (THR-1018)
 *
 * Detection alone left every closeout merge needing a session to hand-classify
 * each collision into one of two remedies — measured at two collisions needing two
 * different repairs in the single 2026-08-07 run that resolved three stuck PRs.
 * `--fix` applies them: `scripts/impediment-id-repair.ts` classifies each
 * collision, dedupes or renumbers it, and reports every `#N` cross-reference the
 * renumber may have made ambiguous. The classifier is deliberately biased toward
 * renumbering — see that module's header for why the two mistakes are not
 * symmetric.
 *
 * Run: `npm run check:impediment-ids` — reports.
 *      `npm run check:impediment-ids -- --fix` — reports and repairs.
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
import {
  applyRepairs,
  attachRemovedText,
  findCrossReferences,
  planRepairs,
  type RepairPlan,
} from "./impediment-id-repair.ts";

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
      "  Repair automatically (THR-1018):",
      "",
      "    npm run check:impediment-ids -- --fix",
      "",
      "  It classifies each collision — dedupe when both rows are the same impediment,",
      `  renumber from #${suggested} up when they are different — echoes every row it`,
      "  removes, and lists the cross-references a renumber may have made ambiguous.",
      "  To repair by hand instead: keep the number on the row that appears FIRST",
      "  (existing prose cross-references resolve to it), renumber each later row, and",
      "  record the old number in its Session Context column.",
      "",
      "  Either way, regenerate the dashboard afterwards:",
      "    npm run generate-impediment-dashboard",
    ].join("\n"),
  );
}

/** Prints what a repair did, in enough detail to audit or reverse it by hand. */
function reportRepair(plan: RepairPlan, repoRoot: string): void {
  const renumberedNums = plan.plans
    .filter((collision) => collision.kind === "renumber")
    .map((collision) => collision.num);

  console.error("  Repair applied:\n");

  for (const collision of plan.plans) {
    const confidence = `similarity ${collision.similarity.toFixed(2)}`;

    if (collision.kind === "dedupe") {
      console.error(
        `    #${collision.num} — DEDUPE (${confidence}): same impediment on both sides.`,
      );
      console.error(
        `      Kept line ${collision.keptLine}, Count set to ${collision.resolvedCount} ` +
          `(${collision.countRule === "max" ? "max — identical text, a count bump, not a second observation" : "sum — independently authored observations"}).`,
      );
      for (const removed of collision.removed) {
        console.error(`      Removed line ${removed.line}, verbatim:`);
        console.error(`        ${removed.text}`);
      }
      continue;
    }

    console.error(
      `    #${collision.num} — RENUMBER (${confidence}): different impediments sharing an id.`,
    );
    for (const move of collision.renumbered) {
      console.error(`      line ${move.line}: #${move.oldNum} -> #${move.newNum}`);
    }
  }

  const references = findCrossReferences(repoRoot, renumberedNums);
  console.error("");

  if (renumberedNums.length === 0) {
    console.error("  No renumbering, so no cross-reference can have been invalidated.");
  } else if (references.length === 0) {
    console.error(
      `  No prose cross-references to ${renumberedNums.map((n) => `#${n}`).join(", ")} found.`,
    );
  } else {
    console.error(
      `  ${references.length} cross-reference(s) to a renumbered id. The original number stayed`,
    );
    console.error(
      "  on the FIRST row, so each still resolves — but if one meant the row that moved,",
    );
    console.error("  it now points at the wrong entry. Check these by hand:\n");
    for (const reference of references) {
      console.error(`    ${reference.file}:${reference.line}  #${reference.num}`);
      console.error(`      ${reference.text}`);
    }
  }

  console.error("\n  Now regenerate the dashboard: npm run generate-impediment-dashboard");
}

function main(): void {
  const fix = process.argv.includes("--fix");

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

  // On the --fix path a duplicate is about to be repaired, so announcing FAIL up
  // front and then exiting 0 misreports the run. A population failure is never
  // repairable, so it is a FAIL either way.
  const repairable = fix && duplicateNums.length > 0 && populationFailures.length === 0;
  console.error(
    repairable
      ? "check:impediment-ids: repairing — Docs/impediments.md carries duplicate numbers.\n"
      : "check:impediment-ids: FAIL — Docs/impediments.md did not pass the live-log gate.\n",
  );

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

  if (duplicateNums.length > 0) {
    if (!fix) {
      reportDuplicates(result);
      process.exit(1);
    }

    // The repair only ever touches numbering, so a population failure — a dropped
    // or unparsed entry — is a different defect and must not be papered over by a
    // successful renumber. Report both, and stay red on the one --fix cannot fix.
    const plan = attachRemovedText(markdown, planRepairs(markdown));
    fs.writeFileSync(IMPEDIMENTS_PATH, applyRepairs(markdown, plan), "utf8");
    reportRepair(plan, REPO_ROOT);

    const after = parseImpedimentLog(fs.readFileSync(IMPEDIMENTS_PATH, "utf8"));
    if (after.duplicateNums.length > 0) {
      console.error(
        `\ncheck:impediment-ids: FAIL — ${after.duplicateNums.length} duplicate(s) survived the repair.`,
      );
      process.exit(1);
    }
    if (populationFailures.length > 0) process.exit(1);

    console.log(
      `\ncheck:impediment-ids: repaired — ${plan.plans.length} collision(s) resolved, ` +
        `${after.tableCount} table rows + ${after.paragraphCount} paragraph entries, every # unique.`,
    );
    return;
  }

  process.exit(1);
}

main();
