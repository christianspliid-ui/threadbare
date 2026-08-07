#!/usr/bin/env node

/**
 * generate-project-status — assemble `Docs/project-status.md` from the
 * one-file-per-entry fragments in `Docs/status/` (THR-1016).
 *
 * ## The conflict class this removes
 *
 * `Docs/project-status.md` was hand-edited, and every closeout PR wrote it at the
 * same two places: an insert at the top of `## Current Focus`, and a delete at the
 * tail to hold the 60-line cap. Two open closeout PRs therefore conflicted **by
 * construction** — not because either was stale, and not fixable by
 * `gh pr update-branch`. Measured 2026-08-07: PRs #1322, #1326 and #1327 sat
 * `DIRTY` for 17, 18 and 20 hours conflicting *only* in closeout docs, and #1322
 * had to be hand-resolved twice in one session because an unrelated merge
 * re-staled it minutes after the first resolution. Draining N such PRs costs N
 * sequential CI cycles, because each merge re-conflicts every other one.
 *
 * The union merge driver (`.gitattributes`, THR-691) fixed the same rot for
 * `changelog.md` / `project-history.md` / `impediments.md` and was correctly
 * withheld here: union keeps *both* sides of a conflicting hunk, which is right
 * for an appended row and wrong for a rewritten one. The cap trim is a rewrite,
 * and so — quietly — was the `(THR-XXX's entry moved to project-history.md …)`
 * bookkeeping suffix that closeouts appended to a *neighbouring* entry.
 *
 * So the fix is not a better merge driver, it is removing the shared write: a
 * closeout now creates a brand-new file that no other branch can be touching.
 * That property survives GitHub's server-side merge, which ignores
 * `.gitattributes` entirely and therefore never benefited from union at all.
 *
 * ## Why the cap is a rendering rule now
 *
 * The 60-line contract used to be an editing discipline — every closeout had to
 * find the oldest entry, delete it, and annotate what it had done. That is the
 * *second* write to a shared anchor, and it is pure bookkeeping. Here the cap is
 * a budget: render the newest fragments that fit and stop. Nothing is deleted,
 * nothing is annotated, and everything older stays on disk in `Docs/status/`,
 * uncapped and readable, with its one-liner already in `project-history.md`.
 *
 * ## Determinism
 *
 * Output must be a pure function of the fragment set, because
 * `check:generated-freshness` compares the committed page against a fresh run and
 * any per-run value makes every PR look stale (the trap THR-714 removed at source
 * rather than registering as volatile). So: no wall-clock stamp — the "Updated"
 * date is the newest fragment's own date — and ordering is by **filename**
 * descending, which depends on nothing shared between branches.
 *
 * Run: `npm run generate-project-status` (`--check` to verify, `--dry-run` to print).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing the shape of the page is changing a
// number here, never rewriting the assembly logic).
// ---------------------------------------------------------------------------

/** Directory holding one fragment per shipped ticket. */
export const ENTRIES_DIR_REL = "Docs/status";

/** The assembled page. Generated; `merge=ours` in `.gitattributes`. */
export const OUTPUT_REL = "Docs/project-status.md";

/** Page scaffolding: header, entry marker, and the tail sections. */
export const TEMPLATE_REL = "Docs/status/_page.md";

/** Where the entries are spliced into the template. */
export const ENTRIES_MARKER = "<!-- ENTRIES -->";

/**
 * Hard line ceiling for the assembled page — the "≤60 lines by contract" rule
 * CLAUDE.md has always stated, now enforced by construction instead of by hand.
 */
export const MAX_PAGE_LINES = 60;

/**
 * Fragment files that are not entries. Anything starting with `_` is scaffolding;
 * `README.md` documents the directory.
 */
function isEntryFile(name: string): boolean {
  return name.endsWith(".md") && !name.startsWith("_") && name !== "README.md";
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export type Fragment = {
  /** Basename, e.g. `2026-08-07-thr-1016.md`. Also the sort key. */
  file: string;
  /** Entry body, trailing whitespace stripped. */
  body: string;
};

/**
 * Sort key for one fragment filename: `[date, ticketNumber]`.
 *
 * The ticket number is compared **numerically**, not as text. A plain filename
 * sort reads `thr-994` as newer than `thr-1013`, which buries every four-digit
 * ticket below every three-digit one — the exact inversion this page exists to
 * avoid. An undated or unnumbered fragment sorts last rather than throwing.
 */
export function sortKey(file: string): [string, number] {
  const date = /^(\d{4}-\d{2}-\d{2})/.exec(file)?.[1] ?? "";
  const ticket = /-thr-(\d+)\./i.exec(file)?.[1];
  return [date, ticket === undefined ? -1 : Number(ticket)];
}

/** Read every entry fragment, newest first. */
export function readFragments(entriesDir: string): Fragment[] {
  if (!fs.existsSync(entriesDir)) return [];
  return fs
    .readdirSync(entriesDir)
    .filter(isEntryFile)
    // Newest ship date first, higher ticket id first within a day. Deterministic,
    // and derived from nothing two branches share — which is the whole point:
    // ordering that depended on a shared file would reintroduce the shared write.
    .sort((a, b) => {
      const [dateA, ticketA] = sortKey(a);
      const [dateB, ticketB] = sortKey(b);
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      if (ticketA !== ticketB) return ticketB - ticketA;
      return b.localeCompare(a);
    })
    .map((file) => ({
      file,
      body: fs.readFileSync(path.join(entriesDir, file), "utf8").replace(/\s+$/, ""),
    }))
    .filter((fragment) => fragment.body !== "");
}

/** The newest fragment's date, used as the page's "Updated" stamp. */
export function newestDate(fragments: readonly Fragment[]): string | null {
  for (const fragment of fragments) {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(fragment.file);
    if (match) return match[1];
  }
  return null;
}

/**
 * Choose the newest fragments that fit the line budget.
 *
 * At least one entry is always rendered: a page whose single newest entry is
 * longer than the whole budget should show that entry and overrun, not show an
 * empty `## Current Focus`. Overrun is reported by the caller rather than
 * silently tolerated.
 */
export function selectFragments(
  fragments: readonly Fragment[],
  budgetLines: number,
): { rendered: Fragment[]; dropped: Fragment[] } {
  const rendered: Fragment[] = [];
  let used = 0;

  for (const fragment of fragments) {
    // Each entry costs its own lines plus one blank separator.
    const cost = fragment.body.split("\n").length + 1;
    if (rendered.length > 0 && used + cost > budgetLines) break;
    rendered.push(fragment);
    used += cost;
  }

  return { rendered, dropped: fragments.slice(rendered.length) };
}

export type Assembly = {
  content: string;
  rendered: Fragment[];
  dropped: Fragment[];
  lineCount: number;
};

/** Render the page from a template and a fragment set. */
export function assemble(template: string, fragments: readonly Fragment[]): Assembly {
  const markerIndex = template.indexOf(ENTRIES_MARKER);
  if (markerIndex < 0) {
    throw new Error(`${TEMPLATE_REL} is missing its ${ENTRIES_MARKER} marker.`);
  }

  const head = template.slice(0, markerIndex);
  const tail = template.slice(markerIndex + ENTRIES_MARKER.length);
  // The marker sits alone on its line, so the scaffolding's own line count is the
  // rendered page's minus whatever the entries add.
  const scaffoldLines = `${head}${tail}`.split("\n").length;
  const budget = MAX_PAGE_LINES - scaffoldLines;

  const { rendered, dropped } = selectFragments(fragments, budget);
  const body = rendered.map((fragment) => fragment.body).join("\n\n");

  let content = `${head}${body}${tail}`;
  const stamp = newestDate(fragments);
  if (stamp) content = content.replace("{UPDATED}", stamp);

  return { content, rendered, dropped, lineCount: content.split("\n").length };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function generateProjectStatus(options: { dryRun?: boolean; check?: boolean } = {}): void {
  const root = repoRoot();
  const templatePath = path.join(root, TEMPLATE_REL);
  const outputPath = path.join(root, OUTPUT_REL);

  if (!fs.existsSync(templatePath)) {
    console.error(`generate-project-status: FAIL — template missing at ${TEMPLATE_REL}`);
    process.exit(1);
  }

  const fragments = readFragments(path.join(root, ENTRIES_DIR_REL));
  if (fragments.length === 0) {
    console.error(
      `generate-project-status: FAIL — no entry fragments found in ${ENTRIES_DIR_REL}. ` +
        `Refusing to write an empty Current Focus.`,
    );
    process.exit(1);
  }

  const { content, rendered, dropped, lineCount } = assemble(
    fs.readFileSync(templatePath, "utf8"),
    fragments,
  );

  const summary =
    `${rendered.length} of ${fragments.length} fragment(s) rendered, ` +
    `${dropped.length} held back by the ${MAX_PAGE_LINES}-line cap, ${lineCount} lines`;

  if (lineCount > MAX_PAGE_LINES) {
    console.warn(
      `generate-project-status: WARN — ${lineCount} lines exceeds MAX_PAGE_LINES ` +
        `(${MAX_PAGE_LINES}); the newest entry alone is over budget.`,
    );
  }

  if (options.dryRun) {
    console.log(content);
    console.error(`generate-project-status: dry run — ${summary}`);
    return;
  }

  const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;

  if (options.check) {
    if (existing === content) {
      console.log(`generate-project-status: OK — ${OUTPUT_REL} is current (${summary}).`);
      return;
    }
    console.error(
      `generate-project-status: FAIL — ${OUTPUT_REL} is STALE. ` +
        `Run \`npm run generate-project-status\` and commit the result.`,
    );
    process.exit(1);
  }

  if (existing === content) {
    console.log(`generate-project-status: unchanged — ${summary}.`);
    return;
  }

  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`generate-project-status: wrote ${OUTPUT_REL} — ${summary}.`);
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  /generate-project-status\.(ts|mjs|js)$/.test(process.argv[1].replaceAll("\\", "/"));

if (invokedDirectly) {
  const args = process.argv.slice(2);
  generateProjectStatus({ dryRun: args.includes("--dry-run"), check: args.includes("--check") });
}
