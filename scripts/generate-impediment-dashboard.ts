#!/usr/bin/env node

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
      const match = entry.name.match(/(\d{4}-\d{2}-\d{2})-retro(?:-draft)?\.md$/);
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

function replaceGeneratedBlock(source: string, start: string, end: string, replacement: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return source;
  }
  return `${source.slice(0, startIndex)}${replacement}${source.slice(endIndex + end.length)}`;
}

function ensureLegacyMarkers(source: string): string {
  let content = source;

  if (!content.includes(DATA_START) || !content.includes(DATA_END)) {
    content = content.replace(
      /const DATA = \[[\s\S]*?\];/,
      `${DATA_START}\nconst DATA = [];\n${DATA_END}`,
    );
  }

  if (!content.includes(RETRO_START) || !content.includes(RETRO_END)) {
    content = content.replace(
      /const IMPACT_MINUTES = /,
      `${RETRO_START}\nconst LAST_RETRO = ${toLiteral({ date: "", filename: "" })};\n${RETRO_END}\n\nconst IMPACT_MINUTES = `,
    );
  }

  return content;
}

function main(): void {
  if (!fs.existsSync(IMPEDIMENTS_PATH)) {
    throw new Error(`generate-impediment-dashboard: missing impediment log at ${IMPEDIMENTS_PATH}`);
  }

  if (!fs.existsSync(DASHBOARD_PATH)) {
    throw new Error(`generate-impediment-dashboard: missing dashboard file at ${DASHBOARD_PATH}`);
  }

  const impedimentsMarkdown = fs.readFileSync(IMPEDIMENTS_PATH, "utf8");
  const { entries, tableCount, paragraphCount, warnings } = parseImpedimentLog(impedimentsMarkdown);
  const latestRetro = findRetroFiles().at(-1) ?? null;

  for (const warning of warnings) {
    console.warn(`generate-impediment-dashboard: ${warning}`);
  }

  let dashboardSource = fs.readFileSync(DASHBOARD_PATH, "utf8");
  dashboardSource = ensureLegacyMarkers(dashboardSource);
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
