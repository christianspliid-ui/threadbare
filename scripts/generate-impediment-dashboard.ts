#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type DashboardEntry = {
  num: string;
  id: number;
  count: number;
  date: string;
  category: string;
  description: string;
  consequence: string;
  impact: string;
  workaroundFound: boolean;
  workaround: string;
  session: string;
};

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

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  const body = trimmed.slice(1, -1);
  const cells: string[] = [];
  let current = "";

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    const prev = i > 0 ? body[i - 1] : "";
    if (char === "|" && prev !== "\\") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeText(value: string): string {
  return value
    .replaceAll("\u00A0", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(raw: string): number | null {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWorkaroundFound(raw: string): boolean {
  const value = normalizeText(raw).toLowerCase();
  return value === "yes" || value === "true";
}

function parseRow(cells: string[], lineNumber: number): DashboardEntry | null {
  if (cells.length < 10) {
    console.warn(`generate-impediment-dashboard: skipping line ${lineNumber} (expected 10+ cells, got ${cells.length})`);
    return null;
  }

  const numRaw = normalizeText(cells[0]);
  const countRaw = normalizeText(cells[1]);
  const date = normalizeText(cells[2]);
  const category = normalizeText(cells[3]);
  const description = normalizeText(cells[4]);
  const consequence = normalizeText(cells[5]);
  const impact = normalizeText(cells[6]);
  const workaroundFoundRaw = normalizeText(cells[7]);
  const workaround = normalizeText(cells[8]);
  const session = normalizeText(cells.slice(9).join(" | "));

  if (!numRaw || !countRaw || !date || !category || !description) {
    console.warn(`generate-impediment-dashboard: skipping line ${lineNumber} (missing required cells)`);
    return null;
  }

  const count = parseNumber(countRaw);
  if (count === null) {
    console.warn(`generate-impediment-dashboard: skipping line ${lineNumber} (invalid count "${countRaw}")`);
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn(`generate-impediment-dashboard: skipping line ${lineNumber} (invalid date "${date}")`);
    return null;
  }

  const fallbackId = parseNumber(numRaw);
  const id = fallbackId ?? lineNumber;

  return {
    num: numRaw,
    id,
    count,
    date,
    category,
    description,
    consequence,
    impact,
    workaroundFound: parseWorkaroundFound(workaroundFoundRaw),
    workaround,
    session,
  };
}

function parseImpediments(markdown: string): DashboardEntry[] {
  const lines = markdown.split(/\r?\n/);
  const parsed: DashboardEntry[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) continue;
    if (trimmed.startsWith("| # |") || trimmed.startsWith("|---")) continue;

    const cells = splitMarkdownRow(trimmed);
    const entry = parseRow(cells, lineNumber);
    if (entry) parsed.push(entry);
  }

  return parsed.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id || a.num.localeCompare(b.num));
}

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

function makeGeneratedDataBlock(entries: DashboardEntry[]): string {
  const payload = entries.map((entry) => ({
    num: entry.num,
    id: entry.id,
    count: entry.count,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    consequence: entry.consequence,
    impact: entry.impact,
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
  const entries = parseImpediments(impedimentsMarkdown);
  const latestRetro = findRetroFiles().at(-1) ?? null;

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
    `generate-impediment-dashboard: wrote ${path.relative(REPO_ROOT, DASHBOARD_PATH)} (${entries.length} rows, latest retro ${latestRetro?.date ?? "none"})`,
  );
}

main();
