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
 * ## Why the page is an index (THR-1327)
 *
 * The first cut spliced whole fragment bodies in, and that made "how many
 * entries does the status page show" a function of how long the last author
 * happened to write. Measured 2026-08-27: `1 of 281 fragment(s) rendered` — and
 * the one that fit was the *shortest* of that day's eight. Measured 2026-08-29
 * on a corpus of short entries: `4 of 341`. Same generator, same cap, nothing
 * changed but the prose, and the page swung between defeated and merely thin
 * while its WARN blamed whoever shipped last.
 *
 * So the page renders one **summary line** per fragment — label, link, gist —
 * at a fixed cost of one line each. The cap now buys a stable entry count
 * (~40), overrun is impossible by construction, and the page is what THR-1016
 * intended it to be: a recent overview whose detail is one click away in
 * `Docs/status/`. The three options were weighed on the ticket; this is option
 * 2, chosen because raising the cap (option 1) keeps the coupling to authored
 * length and only moves the threshold, and shrinking the authored norm (option
 * 3) fights what the Definition of Done's "Current-Focus narrative" elicits.
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
 * Per-entry character budget for the gist half of a summary line (THR-1327).
 *
 * The line is `- **[label](link)** — gist`, so this is what keeps one entry to
 * one line at any sane terminal width. Truncation is by character rather than
 * by word count because the gist is prose of wildly varying density.
 */
export const SUMMARY_GIST_CHARS = 140;

/**
 * Per-fragment line budget, checked against the **newest** fragment only.
 *
 * The old WARN measured the assembled page, which meant it fired on whoever
 * happened to ship last rather than on anything actionable. This one is aimed
 * at the entry being authored right now: a closeout narrative past this length
 * belongs in a plan doc with a pointer from the fragment. Set inside the
 * measured range on purpose — 6 of 341 fragments exceeded it when THR-1327
 * landed, so it flags real outliers rather than sitting above the corpus doing
 * nothing.
 */
export const MAX_FRAGMENT_LINES = 120;

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
 * The `YYYY-MM-DD — THR-XXXX` label for one fragment, read from its **filename**.
 *
 * Deliberately not read from the body: 100 of the 341 fragments live when
 * THR-1327 landed lead with a bold sentence rather than a heading, so a
 * body-derived label would be absent for a third of the corpus. The filename
 * carries both facts by construction — it is the same key the page sorts on.
 * A fragment matching neither shape (`2026-07-22-marathon.md`) degrades to its
 * bare basename rather than throwing.
 */
export function fragmentLabel(file: string): string {
  const base = file.replace(/\.md$/, "");
  const [date, ticket] = sortKey(file);
  if (date === "") return base;
  return ticket < 0 ? date : `${date} — THR-${ticket}`;
}

/**
 * A one-clause gist of what the entry says, for the index line.
 *
 * Two body shapes exist in the corpus and both are handled: a `# ` heading
 * (241 of 341), whose text after the `date — THR-XXXX:` prefix is already a
 * title; and a bold lead sentence (the older norm, 100 of 341), whose first
 * sentence is the summary. Markdown emphasis, links and code ticks are stripped
 * so the line renders as prose inside the bullet.
 */
export function fragmentGist(fragment: Fragment): string {
  const firstLine = fragment.body.split("\n").find((line) => line.trim() !== "") ?? "";

  let gist = /^#{1,6}\s+(.*)$/.exec(firstLine.trim())?.[1] ?? firstLine.trim();

  // A heading usually restates the label the summary line already carries, in
  // one of two authored shapes: `2026-08-29 — THR-1364: title` and the older
  // `THR-1358 — title`. Both prefixes go; a heading with neither is kept whole.
  gist = gist
    .replace(/^\d{4}-\d{2}-\d{2}\s*(?:[—–-]\s*)?/, "")
    // Separator optional: a heading of a bare `THR-1364` and nothing else must
    // strip to empty, so `summaryLine` falls back to the bare link.
    .replace(/^THR-\d+\s*(?:[—–:-]\s*)*/i, "");

  gist = gist
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // A bold lead sentence is a whole paragraph; keep its first sentence only.
  const sentenceEnd = /[.?!]\s/.exec(gist);
  if (sentenceEnd && sentenceEnd.index + 1 > 0) gist = gist.slice(0, sentenceEnd.index + 1);

  // Both shapes also *close* on the id the label already carries — a heading's
  // trailing `(THR-1335)`, a bold lead's `(THR-1000, 2026-08-06).`. Stripped
  // after the sentence cut, because in the bold-lead shape the id sits at the
  // end of the first sentence rather than the end of the line.
  gist = gist.replace(/\s*\(THR-\d+(?:,\s*\d{4}-\d{2}-\d{2})?\)\s*\.?\s*$/i, "").trim();

  if (gist.length > SUMMARY_GIST_CHARS) {
    gist = `${gist.slice(0, SUMMARY_GIST_CHARS).replace(/\s+\S*$/, "")}…`;
  }

  return gist;
}

/**
 * One entry as one line: label, link to the full fragment, gist.
 *
 * The link is relative to `Docs/project-status.md`, which sits one level above
 * `Docs/status/`.
 */
export function summaryLine(fragment: Fragment): string {
  const gist = fragmentGist(fragment);
  const link = `- **[${fragmentLabel(fragment.file)}](status/${fragment.file})**`;
  return gist === "" ? link : `${link} — ${gist}`;
}

/**
 * Choose the newest fragments that fit the line budget.
 *
 * Each entry costs exactly one line, because the page renders an index rather
 * than the fragment bodies (THR-1327). That is the whole point of the change:
 * the old renderer spliced whole bodies in, so how many entries the page showed
 * was a function of how long the last author happened to write — measured at
 * `1 of 281` on 2026-08-27 and `4 of 341` two days later, with nothing changed
 * but the prose. A fixed per-entry cost makes the cap mean a stable entry
 * count, and makes page overrun impossible by construction.
 */
export function selectFragments(
  fragments: readonly Fragment[],
  budgetLines: number,
): { rendered: Fragment[]; dropped: Fragment[] } {
  const rendered = fragments.slice(0, Math.max(1, budgetLines));
  return { rendered: [...rendered], dropped: fragments.slice(rendered.length) };
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
  const body = rendered.map(summaryLine).join("\n");

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
    `${rendered.length} of ${fragments.length} fragment(s) indexed, ` +
    `${dropped.length} held back by the ${MAX_PAGE_LINES}-line cap, ${lineCount} lines`;

  // The page cannot overrun any more — one entry costs one line — so the only
  // budget worth reporting is the one the author can still act on: the entry
  // they are shipping right now (THR-1327).
  const newest = fragments[0];
  const newestLines = newest.body.split("\n").length;
  if (newestLines > MAX_FRAGMENT_LINES) {
    console.warn(
      `generate-project-status: WARN — the newest fragment (${newest.file}) is ` +
        `${newestLines} lines, over MAX_FRAGMENT_LINES (${MAX_FRAGMENT_LINES}). ` +
        `The page is unaffected; consider moving the detail to a plan doc and ` +
        `pointing at it from the fragment.`,
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
