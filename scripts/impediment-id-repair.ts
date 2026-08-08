/**
 * Automated repair for duplicate `#` values in `Docs/impediments.md` (THR-1018).
 *
 * `check:impediment-ids` (THR-881) is the **detector**: it rejects a duplicate
 * before it reaches `main`. This module is the **repair** — the half that did not
 * exist, so every closeout merge touching the log needed a session to hand-classify
 * each collision. Measured on the 2026-08-07 run that resolved three stuck PRs:
 *
 *     #451: duplicate row (same impediment logged on both sides, one with count 2)
 *     #452: two DIFFERENT impediments sharing an id
 *
 * Two collisions in one run, needing two *different* remedies. The detector names
 * the duplicate but not which case it is.
 *
 * ## The two cases, and why the classifier is deliberately asymmetric
 *
 * Both arise from `merge=union` (THR-691) keeping **both** sides of a conflicting
 * hunk, which is right for the rows and wrong for the row number:
 *
 * 1. **Same impediment, two rows** → **dedupe**. Overwhelmingly this is one lane
 *    *editing* an existing row (bumping Count 1 → 2) while another appends: union
 *    preserves the pre-edit and post-edit line both. The rows are near-identical.
 * 2. **Two different impediments, one number** → **renumber**. Two lanes each
 *    appended a fresh entry and each independently picked "the next free number".
 *    The rows have nothing in common but the digit.
 *
 * The two populations are separated by a wide margin — near-identical prose versus
 * unrelated prose — so the threshold's exact value is not load-bearing. What *is*
 * load-bearing is which way it errs, because the two mistakes are not symmetric:
 *
 *   * calling a **renumber** a **dedupe** deletes a distinct impediment — silent,
 *     unrecoverable data loss;
 *   * calling a **dedupe** a **renumber** leaves a visible duplicate row under a
 *     fresh number — cosmetic, and obvious to the next reader.
 *
 * So {@link DEDUPE_SIMILARITY_THRESHOLD} sits high and **renumber is the default**:
 * a collision is deduped only on strong evidence, and anything ambiguous is
 * renumbered. Every discarded row is echoed verbatim in the report regardless, so
 * even a wrong dedupe is recoverable from the run log rather than only from git.
 *
 * ## Why the resolved count is max-or-sum rather than always sum
 *
 * THR-1018 specified "sum the occurrence counts", which is correct for two lanes
 * independently observing the same friction and **wrong for the count-bump shape**:
 * rows carrying counts 1 and 2 are the same tally before and after an increment, so
 * summing to 3 double-counts the first observation.
 *
 * The distinguisher is the **Count column itself**, not the prose. An increment
 * necessarily leaves the two rows carrying *different* counts; two independent
 * appends necessarily leave them carrying the *same* count, because each lane
 * wrote a fresh observation. That is a hard signal, unlike a similarity score, so
 * the branch that can inflate or deflate a tally does not rest on a heuristic:
 * counts differ → {@link CountRule} `max`; counts equal → `sum`.
 *
 * ## What the classifier deliberately declines to detect
 *
 * Measured similarity across the real shapes (`scripts/__tests__` pins these):
 *
 *     1.000  identical text — a count bump
 *     0.882  a bump whose edit also appended a dated tag
 *     0.625  the same friction, independently worded
 *     0.333  the same subject in fully independent prose
 *     0.053  two different impediments
 *
 * Only the top band is *reliably* separable. At 0.333 "the same impediment, written
 * twice" is not far enough from "two different impediments" — two entries in one
 * category share plenty of jargon — and that is precisely the boundary where the
 * destructive mistake lives. So the threshold sits above it and such a pair is
 * **renumbered instead of merged**: the log ends up with two rows describing one
 * friction, which a later reader can merge by hand, rather than one row where an
 * impediment used to be.
 *
 * ## Which row keeps the number: published, not first (impediment #460 rule 1)
 *
 * `check:impediment-ids` has always printed *"keep the number on the row that
 * appears FIRST in the file"*, and after a union merge that advice is **wrong**:
 * file order is a merge-order artifact with no meaning. The rule that carries
 * meaning is **publication**. A row already on `origin/main` is out in the world
 * and may be cited; a row that exists only on this branch has never appeared
 * anywhere else, so moving it costs nothing.
 *
 * So {@link planRepairs} reads the log as of `origin/main` and keeps the number on
 * a **published** row, renumbering the branch-only ones — regardless of which side
 * the merge happened to place first. It falls back to file order only when the
 * distinction cannot be drawn (no git, or every colliding row is branch-only).
 *
 * This mattered enough to be logged three times: impediment #460 records applying
 * the printed advice on PR #1327 and having to reverse it, and notes that the gate
 * goes green either way, so nothing catches the wrong direction. Automating the
 * wrong direction would have been worse than the manual pass it replaces.
 *
 * **Its rule 2 is closed elsewhere, not here (THR-1028).** Allocation *in this
 * module* is above the max across `origin/main` and the working tree, which is the
 * most a repair pass can reach without changing what it is. Prevention lives in
 * `scripts/impediment-id-allocation.ts`, which scans every local and remote ref
 * before a row is written at all; `npm run impediment:next-id` is the entry point,
 * and the reporter skill now requires it. Two concurrent *repairs* can still pick
 * the same next-free id — this module runs after the fact, when both rows already
 * exist — so the run keeps saying so in its output rather than implying otherwise.
 *
 * ## Cross-references are reported, never rewritten
 *
 * A renumber keeps the original number on the row that appears **first**, so every
 * existing `#N` reference still resolves to a real row. What it cannot know is
 * whether a given reference *meant* the row that moved. That is a judgment about
 * authorial intent, not a mechanical fact, so {@link findCrossReferences} reports
 * each one by path and line and leaves the decision to the operator — satisfying
 * THR-1018's Done-when 3 without silently repointing prose at the wrong entry.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { parseImpedimentLog, type ImpedimentEntry } from "./impediment-log.ts";

/**
 * Jaccard similarity at or above which two rows sharing a number are judged to be
 * the *same* impediment and deduped rather than renumbered (NFP #1).
 *
 * Set high on purpose. The real populations sit near 1.0 (a count bump leaves the
 * prose untouched) and near 0.0 (unrelated impediments), so any value in the broad
 * middle classifies the measured cases identically — see the asymmetry note in the
 * module header for why the safe direction is *up*. Lower this only with a measured
 * case-1 collision that it wrongly renumbered, and record that case here.
 */
export const DEDUPE_SIMILARITY_THRESHOLD = 0.85;

/**
 * Files and directories scanned for `#N` cross-references to a renumbered row.
 *
 * The set is the one THR-881 enumerated when it declined a date-plus-slug id
 * scheme — the places a bare `#N` is actually written as a reference. Paths that
 * do not exist are skipped, so this list may safely name a surface before it
 * exists.
 */
export const CROSS_REFERENCE_SCAN_PATHS = [
  "CLAUDE.md",
  "Docs/changelog.md",
  "Docs/project-history.md",
  "Docs/impediments.md",
  "Docs/canon",
  "Docs/plans",
  "Docs/status",
  "Design/retros",
  ".claude/skills",
  "scripts",
] as const;

/** Extensions considered when a scan path is a directory. */
const SCANNED_EXTENSIONS = new Set([".md", ".ts", ".tsx", ".js", ".mjs", ".json"]);

/** Bounds the directory walk so a stray `node_modules` can never make the scan pathological. */
const MAX_SCAN_DEPTH = 6;

/** How a deduped row's Count column is resolved. See the module header. */
export type CountRule = "max" | "sum";

/** A single collision and the repair chosen for it. */
export type CollisionPlan = {
  /** The colliding `#` value. */
  num: string;
  kind: "dedupe" | "renumber";
  /** Jaccard similarity of the two most-similar rows in the group, for the report. */
  similarity: number;
  /** 1-indexed source line of the row that keeps the number. */
  keptLine: number;
  /**
   * Why that row kept it. `published` means it was found on `origin/main` and may
   * already be cited (impediment #460 rule 1); `file-order` is the fallback when
   * publication could not be determined, and is worth surfacing because it is the
   * weaker basis.
   */
  keptBecause: "published" | "file-order";
  /**
   * Dedupe only: the line whose *text* survives, which is not always `keptLine` —
   * a count bump leaves the richer variant later in the file, and the repair keeps
   * that text at the earlier position. Recorded here rather than re-derived at
   * apply time so the classification and the edit cannot disagree.
   */
  donorLine: number | null;
  /** Dedupe only: lines removed, with their verbatim text so nothing is lost silently. */
  removed: { line: number; text: string }[];
  /** Dedupe only: the Count written onto the surviving row, and why. */
  resolvedCount: number | null;
  countRule: CountRule | null;
  /** Renumber only: each later row's move. */
  renumbered: { line: number; oldNum: string; newNum: string }[];
};

export type RepairPlan = {
  plans: CollisionPlan[];
  /** The next unclaimed number after every allocation in this plan. */
  nextFree: number;
};

/** One `#N` occurrence found outside the log's own table rows. */
export type CrossReference = {
  file: string;
  line: number;
  num: string;
  text: string;
};

/**
 * Token-set Jaccard over a row's prose.
 *
 * Deliberately a bag-of-words measure rather than an edit distance: the shapes it
 * must separate differ in *subject*, not in phrasing, and Jaccard is stable against
 * the reordering and re-wrapping that an edited row picks up.
 */
export function similarity(left: string, right: string): number {
  const tokenize = (value: string): Set<string> =>
    new Set(
      value
        .toLowerCase()
        .replace(/[`*_~]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2),
    );

  const a = tokenize(left);
  const b = tokenize(right);
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** The prose a similarity judgment is made on — identity fields, not bookkeeping columns. */
function comparableText(entry: ImpedimentEntry): string {
  return [entry.description, entry.consequence, entry.workaround].filter(Boolean).join(" ");
}

/**
 * Which row keeps the number: the one carrying the most information.
 *
 * For a count bump the surviving text should be the *post*-edit variant, which is
 * usually the longer one (an increment pass tends to append rather than replace).
 * Ties fall to the earlier line, matching THR-881's existing guidance that the
 * first row keeps the number because prose cross-references resolve to it.
 */
function richest(group: ImpedimentEntry[]): ImpedimentEntry {
  return [...group].sort(
    (a, b) => comparableText(b).length - comparableText(a).length || a.line - b.line,
  )[0];
}

/**
 * The impediment log as of `origin/main`, as a set of trimmed row lines — the
 * "already published" oracle for {@link planRepairs}.
 *
 * Uses `execFileSync` with an argument array rather than a shell string on purpose:
 * MSYS rewrites anything that looks like a path inside `git show <rev>:<path>` when
 * it goes through a shell, silently yielding an empty read on Windows. Returns
 * `null` — not an empty set — when the read fails, so the caller can tell "nothing
 * is published" apart from "publication is unknown" and fall back rather than
 * renumbering every row it should have kept.
 */
export function readPublishedRows(repoRoot: string, ref = "origin/main"): Set<string> | null {
  try {
    const raw = execFileSync("git", ["show", `${ref}:Docs/impediments.md`], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const rows = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("|"));
    return rows.length > 0 ? new Set(rows) : null;
  } catch {
    return null; // Fail-soft (NFP #4): no git, no remote, or a fresh clone.
  }
}

/** Highest similarity between any two rows in the group — the classification signal. */
function peakSimilarity(group: ImpedimentEntry[]): number {
  let peak = 0;
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      peak = Math.max(peak, similarity(comparableText(group[i]), comparableText(group[j])));
    }
  }
  return peak;
}

/**
 * Classifies every collision and allocates replacement numbers, without touching
 * the markdown. Pure, so the classification is testable independently of the edit.
 */
export function planRepairs(
  markdown: string,
  options: {
    /**
     * Trimmed row lines already on `origin/main` — see {@link readPublishedRows}.
     * `null`/omitted means publication is unknown and file order is used instead.
     */
    publishedRows?: Set<string> | null;
  } = {},
): RepairPlan {
  const { entries, duplicateNums } = parseImpedimentLog(markdown);
  const tableEntries = entries.filter((entry) => entry.form === "table");
  const sourceLines = markdown.split(/\r?\n/);
  const published = options.publishedRows ?? null;
  const isPublished = (entry: ImpedimentEntry): boolean =>
    published !== null && published.has((sourceLines[entry.line - 1] ?? "").trim());

  const claimed = new Set(tableEntries.map((entry) => entry.num));
  const numeric = tableEntries
    .map((entry) => Number.parseInt(entry.num, 10))
    .filter((value) => Number.isFinite(value));
  let nextFree = numeric.length > 0 ? Math.max(...numeric) + 1 : 1;

  const allocate = (): string => {
    while (claimed.has(String(nextFree))) nextFree += 1;
    const allocated = String(nextFree);
    claimed.add(allocated);
    nextFree += 1;
    return allocated;
  };

  const plans: CollisionPlan[] = [];

  for (const duplicate of duplicateNums) {
    const group = tableEntries
      .filter((entry) => entry.num === duplicate.num)
      .sort((a, b) => a.line - b.line);
    if (group.length < 2) continue;

    const peak = peakSimilarity(group);

    if (peak >= DEDUPE_SIMILARITY_THRESHOLD) {
      const keeper = richest(group);
      const dropped = group.filter((entry) => entry.line !== keeper.line);
      const counts = group.map((entry) => entry.count);
      // Differing counts can only have come from an increment, which means the
      // lower tally is already contained in the higher one. Equal counts can only
      // have come from independent appends, which are genuinely additive.
      const countRule: CountRule = new Set(counts).size > 1 ? "max" : "sum";

      plans.push({
        num: duplicate.num,
        kind: "dedupe",
        similarity: peak,
        // The surviving row sits at the group's FIRST line even when a later
        // variant supplied its text, so the log's chronological order is
        // untouched by the repair.
        keptLine: group[0].line,
        keptBecause: "file-order",
        donorLine: keeper.line,
        removed: dropped.map((entry) => ({ line: entry.line, text: "" })),
        resolvedCount:
          countRule === "max" ? Math.max(...counts) : counts.reduce((sum, n) => sum + n, 0),
        countRule,
        renumbered: [],
      });
      continue;
    }

    // Impediment #460 rule 1: publication decides, not file order. A row already
    // on origin/main may be cited; a branch-only row has never existed elsewhere.
    const publishedRows = group.filter(isPublished);
    const keeper = publishedRows.length > 0 ? publishedRows[0] : group[0];
    const movers = group.filter((entry) => entry.line !== keeper.line);

    plans.push({
      num: duplicate.num,
      kind: "renumber",
      similarity: peak,
      keptLine: keeper.line,
      keptBecause: publishedRows.length > 0 ? "published" : "file-order",
      donorLine: null,
      removed: [],
      resolvedCount: null,
      countRule: null,
      renumbered: movers.map((entry) => ({
        line: entry.line,
        oldNum: entry.num,
        newNum: allocate(),
      })),
    });
  }

  return { plans, nextFree };
}

/** Replaces the nth (0-indexed) cell of a raw markdown row, preserving all other bytes. */
function replaceCell(line: string, index: number, value: string): string {
  let cell = 0;
  let start = -1;

  for (let i = 0; i < line.length; i += 1) {
    if (line[i] !== "|" || (i > 0 && line[i - 1] === "\\")) continue;
    if (start === -1) {
      start = i;
      continue;
    }
    if (cell === index) {
      const existing = line.slice(start + 1, i);
      // Reuse the existing padding so the table's alignment survives the edit.
      const leading = existing.match(/^\s*/)?.[0] ?? " ";
      const trailing = existing.match(/\s*$/)?.[0] ?? " ";
      return line.slice(0, start + 1) + leading + value + trailing + line.slice(i);
    }
    cell += 1;
    start = i;
  }

  return line;
}

/** Appends provenance to a row's final cell (Session Context), whether or not it is terminated. */
function appendToLastCell(line: string, note: string): string {
  const trimmedEnd = line.replace(/\s+$/, "");
  const trailing = line.slice(trimmedEnd.length);

  if (trimmedEnd.endsWith("|") && !trimmedEnd.endsWith("\\|")) {
    return `${trimmedEnd.slice(0, -1).replace(/\s+$/, "")} ${note} |${trailing}`;
  }
  return `${trimmedEnd} ${note}${trailing}`;
}

/**
 * Applies a plan to the markdown.
 *
 * Line-indexed and single-pass: every edit is keyed on the source line number the
 * plan recorded, so a deletion earlier in the file cannot shift the target of an
 * edit later in it.
 */
export function applyRepairs(markdown: string, plan: RepairPlan): string {
  const lines = markdown.split(/\r?\n/);
  const deletions = new Set<number>();
  const rewrites = new Map<number, (line: string) => string>();

  for (const collision of plan.plans) {
    if (collision.kind === "dedupe") {
      const keptIndex = collision.keptLine - 1;
      // The keeper's text may come from a later variant; carry it to the first
      // position before that variant's line is dropped.
      const donor = lines[(collision.donorLine ?? collision.keptLine) - 1] ?? lines[keptIndex];

      for (const removed of collision.removed) deletions.add(removed.line - 1);
      rewrites.set(keptIndex, () =>
        collision.resolvedCount === null
          ? donor
          : replaceCell(donor, 1, String(collision.resolvedCount)),
      );
      continue;
    }

    for (const move of collision.renumbered) {
      rewrites.set(move.line - 1, (line) =>
        appendToLastCell(
          replaceCell(line, 0, move.newNum),
          `Renumbered from #${move.oldNum} by check:impediment-ids --fix (THR-1018).`,
        ),
      );
    }
  }

  const out: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (deletions.has(index)) continue;
    const rewrite = rewrites.get(index);
    out.push(rewrite ? rewrite(lines[index]) : lines[index]);
  }

  return out.join("\n");
}

/** Records the verbatim text of every row a plan would delete, so the report can echo it. */
export function attachRemovedText(markdown: string, plan: RepairPlan): RepairPlan {
  const lines = markdown.split(/\r?\n/);
  return {
    ...plan,
    plans: plan.plans.map((collision) => ({
      ...collision,
      removed: collision.removed.map((removed) => ({
        ...removed,
        text: lines[removed.line - 1] ?? "",
      })),
    })),
  };
}

function walk(root: string, depth: number, out: string[]): void {
  if (depth > MAX_SCAN_DEPTH) return;
  let dirents: fs.Dirent[];
  try {
    dirents = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return; // Fail-soft (NFP #4): an unreadable directory must not abort a repair.
  }

  for (const dirent of dirents) {
    const full = path.join(root, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name === "node_modules" || dirent.name.startsWith(".git")) continue;
      walk(full, depth + 1, out);
      continue;
    }
    if (SCANNED_EXTENSIONS.has(path.extname(dirent.name))) out.push(full);
  }
}

/**
 * Finds every `#N` occurrence for the given numbers across
 * {@link CROSS_REFERENCE_SCAN_PATHS}, excluding the log's own table rows — those
 * *are* the entries, not references to them.
 */
export function findCrossReferences(repoRoot: string, nums: string[]): CrossReference[] {
  if (nums.length === 0) return [];
  const wanted = new Set(nums);
  const files: string[] = [];

  for (const relative of CROSS_REFERENCE_SCAN_PATHS) {
    const full = path.join(repoRoot, relative);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) walk(full, 0, files);
    else files.push(full);
  }

  const found: CrossReference[] = [];

  for (const file of files) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue; // Fail-soft: an unreadable file costs a reference, not the run.
    }
    if (!content.includes("#")) continue;

    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      // A table row in the log is an entry, not a reference to one.
      if (line.trimStart().startsWith("|")) continue;

      for (const match of line.matchAll(/(\S+\s+)?#(\d+)\b/g)) {
        if (!wanted.has(match[2])) continue;
        // A bare `#NNN` token is not necessarily an impediment id — `PR #1327`
        // and `issue #45` are the common false positives, and reporting them
        // trains the reader to skim the list.
        if (/\b(PR|pull request|issue|commit)\s+$/i.test(match[1] ?? "")) continue;
        found.push({
          file: path.relative(repoRoot, file).replaceAll("\\", "/"),
          line: index + 1,
          num: match[2],
          text: line.trim().slice(0, 160),
        });
      }
    }
  }

  return found;
}
