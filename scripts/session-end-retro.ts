#!/usr/bin/env node
/**
 * session-end-retro.ts
 *
 * Reads .claude/hooks/.retro-pending.txt written by the Stop hook,
 * parses friction entries, appends them to Docs/impediments.md,
 * and optionally drafts a retro stub in Design/retros/.
 *
 * Called by .claude/hooks/stop-retro.sh on the second Stop invocation.
 * Must exit 0 in all cases (fail-soft: hook crash must never block session close).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// --- Constants (tunable per NFP #1) ---

const STOP_HOOK_STUB_THRESHOLD = 3;
const STOP_HOOK_FRICTION_KEYWORDS = ["error", "blocked", "workaround", "hack"];
const STOP_HOOK_PROMPT_MAX_ENTRIES = 3;
const STOP_HOOK_DEFAULT_IMPACT = "S";
const STOP_HOOK_DEFAULT_CATEGORY = "other";

const VALID_CATEGORIES = new Set([
  "tool-failure",
  "api-quirk",
  "permission",
  "environment",
  "skill-gap",
  "process-friction",
  "dependency",
  "unclear-requirements",
  "flaky-test",
  "code-bug",
  "other",
]);

// --- Paths ---

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const HOOKS_DIR = path.join(REPO_ROOT, ".claude", "hooks");
const PENDING_FILE = path.join(HOOKS_DIR, ".retro-pending.txt");
const LOG_FILE = path.join(HOOKS_DIR, "stop-retro.log");
const IMPEDIMENT_LOG = path.join(REPO_ROOT, "Docs", "impediments.md");
const RETRO_DIR = path.join(REPO_ROOT, "Design", "retros");

// --- Types ---

type ImpedimentEntry = {
  category: string;
  description: string;
};

// --- Helpers ---

function log(message: string): void {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, "utf8");
  } catch {
    // If we can't write the log, silently continue
  }
}

function toIsoDate(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toSessionId(now: Date): string {
  const date = toIsoDate(now);
  const hh = `${now.getHours()}`.padStart(2, "0");
  const mm = `${now.getMinutes()}`.padStart(2, "0");
  return `${date}-${hh}${mm}`;
}

function parseEntries(raw: string): ImpedimentEntry[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // If first line is "none" (case-insensitive), no entries to record
  if (lines[0]?.toLowerCase() === "none") return [];

  const entries: ImpedimentEntry[] = [];
  for (const line of lines.slice(0, STOP_HOOK_PROMPT_MAX_ENTRIES)) {
    if (!line || line.toLowerCase() === "none") continue;

    // Expected format: "category: description"
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      // No colon — treat entire line as description with default category
      entries.push({
        category: STOP_HOOK_DEFAULT_CATEGORY,
        description: line,
      });
      continue;
    }

    const rawCategory = line.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, "-");
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : STOP_HOOK_DEFAULT_CATEGORY;
    const description = line.slice(colonIdx + 1).trim();

    if (description) {
      entries.push({ category, description });
    }
  }

  return entries;
}

function getNextImpedimentNumber(content: string): number {
  const matches = [...content.matchAll(/^\|\s*(\d+)\s*\|/gm)];
  const ids = matches
    .map((m) => parseInt(m[1] ?? "", 10))
    .filter((n) => Number.isFinite(n));
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

function buildImpedimentRow(
  id: number,
  entry: ImpedimentEntry,
  date: string,
  sessionId: string,
): string {
  const description = entry.description.replace(/\|/g, "\\|");
  return `| ${id} | 1 | ${date} | ${entry.category} | ${description} |  | ${STOP_HOOK_DEFAULT_IMPACT} | No |  | auto-retro ${sessionId} |`;
}

function appendToImpedimentLog(entries: ImpedimentEntry[], date: string, sessionId: string): void {
  if (!fs.existsSync(IMPEDIMENT_LOG)) {
    log(`WARN: impediment log not found at ${IMPEDIMENT_LOG} — skipping append`);
    return;
  }

  const content = fs.readFileSync(IMPEDIMENT_LOG, "utf8");
  let nextId = getNextImpedimentNumber(content);

  const newRows = entries.map((entry) => {
    const row = buildImpedimentRow(nextId, entry, date, sessionId);
    nextId += 1;
    return row;
  });

  const appended = `${content.trimEnd()}\n${newRows.join("\n")}\n`;
  fs.writeFileSync(IMPEDIMENT_LOG, appended, "utf8");
  log(`Appended ${entries.length} impediment row(s) starting at id=${nextId - entries.length}`);
}

function shouldDraftStub(entries: ImpedimentEntry[]): boolean {
  if (entries.length >= STOP_HOOK_STUB_THRESHOLD) return true;
  const corpus = entries.map((e) => `${e.category} ${e.description}`).join(" ").toLowerCase();
  return STOP_HOOK_FRICTION_KEYWORDS.some((kw) => corpus.includes(kw));
}

function draftRetroStub(entries: ImpedimentEntry[], date: string, sessionId: string): void {
  try {
    fs.mkdirSync(RETRO_DIR, { recursive: true });
  } catch {
    log(`WARN: could not create retrospectives dir — skipping stub`);
    return;
  }

  const stubPath = path.join(RETRO_DIR, `${sessionId}-retro-stub.md`);
  const rows = entries
    .map((e) => `- **${e.category}:** ${e.description}`)
    .join("\n");

  const content = [
    `# Retro Stub — ${sessionId}`,
    "",
    "Auto-generated by stop-hook. Review and consolidate during next `/retrospective` pass.",
    "",
    `**Session:** ${sessionId}`,
    `**Date:** ${date}`,
    "",
    "## Friction entries",
    "",
    rows,
    "",
    "## Action items",
    "",
    "- [ ] Determine if any entries warrant immediate fixes",
    "- [ ] Merge duplicates into existing impediment log rows",
    "",
  ].join("\n");

  fs.writeFileSync(stubPath, content, "utf8");
  log(`Wrote retro stub: ${path.relative(REPO_ROOT, stubPath)}`);
}

// --- Main ---

function main(): void {
  const now = new Date();
  const date = toIsoDate(now);
  const sessionId = toSessionId(now);

  log(`session-end-retro started (session ${sessionId})`);

  if (!fs.existsSync(PENDING_FILE)) {
    log("No pending file found — nothing to process");
    return;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(PENDING_FILE, "utf8");
  } catch (err) {
    log(`ERROR: could not read pending file: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const entries = parseEntries(raw);
  log(`Parsed ${entries.length} entries from pending file`);

  if (entries.length === 0) {
    log("No entries to append (agent reported none)");
    return;
  }

  try {
    appendToImpedimentLog(entries, date, sessionId);
  } catch (err) {
    log(`ERROR: failed to append to impediment log: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (shouldDraftStub(entries)) {
    try {
      draftRetroStub(entries, date, sessionId);
    } catch (err) {
      log(`ERROR: failed to draft retro stub: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  log(`session-end-retro done`);
}

try {
  main();
} catch (err) {
  // Top-level catch: never let this script crash the hook
  try {
    fs.appendFileSync(
      LOG_FILE,
      `[${new Date().toISOString()}] FATAL: ${err instanceof Error ? err.message : String(err)}\n`,
      "utf8",
    );
  } catch {
    // Nothing we can do
  }
}

process.exit(0);
