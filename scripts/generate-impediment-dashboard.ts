#!/usr/bin/env node

/**
 * Renders `Design/impediment-dashboard.html` from a committed template plus the
 * live impediment log.
 *
 * ## Why template-in / output-out, rather than rewriting the file in place (THR-916)
 *
 * This generator used to read the dashboard, splice fresh `DATA` and `LAST_RETRO`
 * blocks into it, and write it back — with the whole ~6,400-line result committed.
 * That made a *generated* file a *tracked* file whose content changed on every
 * append to `Docs/impediments.md`.
 *
 * `Docs/impediments.md` survives that because it is `merge=union` (THR-691): union
 * keeps both sides of a conflicting hunk, which is right for append-only rows. The
 * rendered dashboard cannot be: it is HTML with no meaningful merge driver, so the
 * instant any impediment-appending PR merged, every other open PR conflicted on
 * this one file — and resolving them re-staled each other. THR-916 measured four
 * such hand-resolutions across three PRs inside one ~40-minute run, each purely
 * mechanical, each recurring indefinitely.
 *
 * Splitting the artifact removes the collision at its source. The **template** holds
 * the hand-authored chrome (markup, styles, view logic) and is committed — it
 * changes only when someone deliberately edits the dashboard UI, which is rare and
 * is a real edit worth conflicting over. The **output** holds the chrome plus the
 * ~6,200 generated data lines and is gitignored, so the part that churns on every
 * append is no longer in the tree to conflict.
 *
 * Two consequences worth keeping in mind if this is ever rewritten:
 *
 * 1. The output must be reproducible from committed inputs alone — a fresh clone
 *    has no `Design/impediment-dashboard.html`, so `prebuild` has to create it.
 *    That is why the template is read and the output is only ever written.
 * 2. `check-generated-freshness` still covers this artifact, via its
 *    UNCOMMITTED_GENERATED_PATHS branch: it asserts the generator produces the file
 *    and that the file is *not* tracked. Untracking it removed the staleness failure
 *    mode; it did not remove the artifact from the gate's coverage.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseImpedimentLog, type ImpedimentEntry } from "./impediment-log.ts";

type RetroInfo = {
  date: string;
  filename: string;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMPEDIMENTS_PATH = path.join(REPO_ROOT, "Docs", "impediments.md");
/** Committed, hand-authored chrome. Stable across impediment appends. */
const TEMPLATE_PATH = path.join(REPO_ROOT, "Design", "impediment-dashboard.template.html");
/** Generated, gitignored render. Rewritten from the template on every run. */
const DASHBOARD_PATH = path.join(REPO_ROOT, "Design", "impediment-dashboard.html");
const RETRO_DIR_CANDIDATES = [
  path.join(REPO_ROOT, "Design", "retros"),
  path.join(REPO_ROOT, "Docs", "retrospectives"),
];

const DATA_START = "// ── Impediment data ──";
const DATA_END = "// ── End data ──";
const RETRO_START = "// ── Last retro ──";
const RETRO_END = "// ── End last retro ──";

function findRetroFiles(): RetroInfo[] {
  const retros: RetroInfo[] = [];

  for (const dir of RETRO_DIR_CANDIDATES) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      // Two naming eras: Docs/retrospectives/YYYY-MM-DD-retro.md and Design/retros/retro-YYYY-MM-DD.md
      const match =
        entry.name.match(/^(\d{4}-\d{2}-\d{2})-retro(?:-draft)?\.md$/) ??
        entry.name.match(/^retro-(\d{4}-\d{2}-\d{2})(?:-draft)?\.md$/);
      if (!match) continue;
      retros.push({
        date: match[1] ?? "",
        filename: path.relative(REPO_ROOT, path.join(dir, entry.name)).replaceAll("\\", "/"),
      });
    }
  }

  return retros
    .filter((retro) => retro.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.filename.localeCompare(b.filename));
}

function toLiteral(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function makeGeneratedDataBlock(entries: ImpedimentEntry[]): string {
  const payload = entries.map((entry) => ({
    num: entry.num,
    id: entry.id,
    count: entry.count,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    consequence: entry.consequence,
    // Verbatim, not the normalised bucket — see ImpedimentEntry.impactRaw.
    impact: entry.impactRaw,
    workaroundFound: entry.workaroundFound,
    workaround: entry.workaround,
    session: entry.session,
  }));

  return [
    DATA_START,
    `const DATA = ${toLiteral(payload)};`,
    DATA_END,
  ].join("\n");
}

function makeGeneratedRetroBlock(latestRetro: RetroInfo | null): string {
  const retroPayload = latestRetro ?? {
    date: "",
    filename: "",
  };

  return [
    RETRO_START,
    `const LAST_RETRO = ${toLiteral(retroPayload)};`,
    RETRO_END,
  ].join("\n");
}

/**
 * Splice a generated block between its markers.
 *
 * Missing markers throw rather than returning the input unchanged. In the old
 * in-place design a silent no-op was survivable — the file already held real data,
 * so a marker-less run just left it stale. Rendering from a template makes the same
 * silence fatal: the output would ship with the template's *empty* `DATA`, i.e. a
 * dashboard showing zero impediments, which looks like a healthy log rather than a
 * broken generator.
 */
function replaceGeneratedBlock(source: string, start: string, end: string, replacement: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `generate-impediment-dashboard: template ${path.relative(REPO_ROOT, TEMPLATE_PATH)} is missing the ` +
        `"${start}" / "${end}" marker pair (or they are out of order). The template must keep both markers ` +
        `around a placeholder declaration so the generated block has somewhere to land.`,
    );
  }
  return `${source.slice(0, startIndex)}${replacement}${source.slice(endIndex + end.length)}`;
}

function main(): void {
  if (!fs.existsSync(IMPEDIMENTS_PATH)) {
    throw new Error(`generate-impediment-dashboard: missing impediment log at ${IMPEDIMENTS_PATH}`);
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `generate-impediment-dashboard: missing dashboard template at ${TEMPLATE_PATH}. ` +
        `This file is committed (THR-916) — restore it from git rather than hand-writing one.`,
    );
  }

  const impedimentsMarkdown = fs.readFileSync(IMPEDIMENTS_PATH, "utf8");
  const { entries, tableCount, paragraphCount, warnings } = parseImpedimentLog(impedimentsMarkdown);
  const latestRetro = findRetroFiles().at(-1) ?? null;

  for (const warning of warnings) {
    console.warn(`generate-impediment-dashboard: ${warning}`);
  }

  let dashboardSource = fs.readFileSync(TEMPLATE_PATH, "utf8");
  dashboardSource = replaceGeneratedBlock(
    dashboardSource,
    DATA_START,
    DATA_END,
    makeGeneratedDataBlock(entries),
  );
  dashboardSource = replaceGeneratedBlock(
    dashboardSource,
    RETRO_START,
    RETRO_END,
    makeGeneratedRetroBlock(latestRetro),
  );

  fs.writeFileSync(DASHBOARD_PATH, dashboardSource, "utf8");
  console.log(
    `generate-impediment-dashboard: wrote ${path.relative(REPO_ROOT, DASHBOARD_PATH)} (${entries.length} entries: ${tableCount} table + ${paragraphCount} paragraph, latest retro ${latestRetro?.date ?? "none"})`,
  );

  // Table form is what the log's own header documents as canonical. Paragraph
  // entries now parse, but they still cost a synthetic id and a heuristic field
  // split, so surface the count rather than letting the second format normalise.
  if (paragraphCount > 0) {
    console.warn(
      `generate-impediment-dashboard: NOTE — ${paragraphCount} entries use the paragraph form. Table rows are canonical; prefer "| # | Count | Date | ... |" for new entries.`,
    );
  }
}

main();
