#!/usr/bin/env node

/**
 * Weekly drift scan — opens one Linear issue per red signal.
 *
 * Run via: node --experimental-strip-types scripts/drift-scan/index.ts
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Drift scan thresholds — tune in `./constants.ts` (browser-safe single source).
import {
  COUPLING_CREEP_PCT,
  BROKEN_WINDOWS_PCT,
  TEST_RUNTIME_REGRESSION_PCT,
  TEST_FLAKE_MIN_RUNS,
  UL_DRIFT_STALE_DAYS,
  SKILL_FRESHNESS_STALE_DAYS,
  SKILL_FRESHNESS_ARCHIVE_DAYS,
  SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
  TOP_IMPORTERS_COUNT,
  UL_UNCANONICAL_MIN_OCCURRENCES,
  SUITE_HISTORY_LIMIT,
} from "./constants";
export {
  COUPLING_CREEP_PCT,
  BROKEN_WINDOWS_PCT,
  TEST_RUNTIME_REGRESSION_PCT,
  TEST_FLAKE_MIN_RUNS,
  UL_DRIFT_STALE_DAYS,
  SKILL_FRESHNESS_STALE_DAYS,
  SKILL_FRESHNESS_ARCHIVE_DAYS,
  SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
  TOP_IMPORTERS_COUNT,
  UL_UNCANONICAL_MIN_OCCURRENCES,
  SUITE_HISTORY_LIMIT,
};

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_PROJECT_ID = "42ac1815-135e-4efb-95d8-631a17dbc9df"; // Continuous Improvement
const LINEAR_TEAM_ID = "290e931e-eb67-4565-9834-fd79c9466928"; // Threadbare
const DRIFT_SCAN_LABEL_NAME = "drift-scan";
const UL_SHARD_DIR = path.join("Docs", "ubiquitous-language");
const SKILL_ROOTS = [path.join(".claude", "skills"), path.join(".agents", "skills")];
const TEST_OUTPUT_PATH = ".cache/drift-scan-results.json";
const DEFAULT_TEST_TIMEOUT_MS = 6 * 60 * 1000;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const BASELINE_PATH =
  process.env.DRIFT_SCAN_BASELINE_PATH ?? path.join(REPO_ROOT, "drift-scan-baseline.json");
const LINEAR_API_KEY = process.env.LINEAR_API_KEY?.trim() ?? "";

const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);
const DOC_FILE_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".ts", ".tsx", ".js", ".jsx", ".json"]);
const UL_STOPWORDS = new Set([
  "api",
  "backlog",
  "build",
  "ci",
  "claude",
  "codex",
  "content",
  "coordination",
  "debugpanel",
  "docs",
  "gameview",
  "graphql",
  "github",
  "hexmapv2",
  "issue",
  "issues",
  "json",
  "linear",
  "mcp",
  "nfp",
  "process",
  "project",
  "readme",
  "repo",
  "skill",
  "state",
  "status",
  "team",
  "tech stack",
  "todo",
  "typescript",
  "ul",
  "utc",
  "vite",
  "vitest",
  "workflow",
]);

export type SignalResult =
  | { status: "green" }
  | { status: "skipped"; reason: string }
  | { status: "red"; summary: string; body: string };

export type SignalStep = {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  name: string;
  run: () => Promise<SignalResult>;
};

export type SignalStepOutcome = {
  id: SignalStep["id"];
  name: string;
  result: SignalResult;
};

export type ImporterCount = {
  file: string;
  count: number;
};

export type BrokenWindowsCounts = {
  todo: number;
  deferred: number;
  tsIgnore: number;
  skipCalls: number;
  explicitAny: number;
  total: number;
};

export type SuiteStatus = {
  file: string;
  passed: boolean;
  durationMs: number;
  slowestTests: Array<{ name: string; durationMs: number }>;
};

export type UlTerm = {
  name: string;
  aliases: string[];
  status: "canonical" | "deprecated" | "proposed";
  shard: string;
};

export type CorpusEntry = {
  file: string;
  text: string;
};

export type Baseline = {
  runDate: string;
  s1TopImporters: ImporterCount[];
  s2BrokenWindowsTotal: number;
  s3TestRuntimeMs: number;
  s3SuiteHistory: Record<string, boolean[]>;
  s4CanonicalLastSeen: Record<string, string>;
  s5SkillFreshness: { lastValidatedAt: Record<string, string> };
};

export type S3Evaluation = {
  signal: SignalResult;
  nextSuiteHistory: Record<string, boolean[]>;
};

export type S4Evaluation = {
  signal: SignalResult;
  nextCanonicalLastSeen: Record<string, string>;
};

export type SkillFreshnessEntry = {
  skillName: string;
  path: string;
  lastValidatedAt: string | null;
  createdAt: string | null;
};

export type S5Evaluation = {
  signal: SignalResult;
  nextLastValidatedAt: Record<string, string>;
};

function todayDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const millis = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(millis)) return null;
  return value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toLowerToken(value: string): string {
  return value.trim().toLowerCase();
}

function dateDiffDays(later: string, earlier: string): number {
  const laterTime = Date.parse(later);
  const earlierTime = Date.parse(earlier);
  if (Number.isNaN(laterTime) || Number.isNaN(earlierTime)) return 0;
  return Math.floor((laterTime - earlierTime) / (24 * 60 * 60 * 1000));
}

function readFileText(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

function collectFilesRecursive(rootAbs: string, extensions: Set<string>): string[] {
  if (!fs.existsSync(rootAbs)) return [];
  const entries = fs.readdirSync(rootAbs, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const abs = path.join(rootAbs, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursive(abs, extensions));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (extensions.has(ext)) files.push(abs);
  }
  return files;
}

function toRepoRelative(absPath: string): string {
  return path.relative(REPO_ROOT, absPath).replaceAll("\\", "/");
}

function readFrontmatterValue(markdown: string, fieldName: string): string | null {
  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;

  let closing = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      closing = i;
      break;
    }
  }
  if (closing < 0) return null;

  const fieldPattern = new RegExp(`^${escapeRegex(fieldName)}:\\s*(.*)$`);
  for (let i = 1; i < closing; i += 1) {
    const line = lines[i];
    if (/^\s/.test(line)) continue;
    const match = line.match(fieldPattern);
    if (!match) continue;
    const value = match[1].trim();
    return value.length > 0 ? value : null;
  }

  return null;
}

function readSkillCreatedDate(repoRelativePath: string): string | null {
  const run = spawnSync(
    "git",
    ["log", "--follow", "--diff-filter=A", "--format=%as", "--", repoRelativePath],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 10_000,
    },
  );

  const output = (run.stdout ?? "").trim();
  if (output.length > 0) {
    const date = output.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
    const parsed = parseIsoDateOnly(date);
    if (parsed) return parsed;
  }

  try {
    const stat = fs.statSync(path.join(REPO_ROOT, repoRelativePath));
    return new Date(stat.mtimeMs).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function readSkillFreshnessEntries(): SkillFreshnessEntry[] {
  const entriesBySkill = new Map<string, SkillFreshnessEntry>();

  for (const skillRoot of SKILL_ROOTS) {
    const absRoot = path.join(REPO_ROOT, skillRoot);
    if (!fs.existsSync(absRoot)) continue;
    const skillFiles = collectFilesRecursive(absRoot, new Set([".md"]))
      .filter((absPath) => path.basename(absPath) === "SKILL.md")
      .sort((a, b) => a.localeCompare(b));

    for (const absPath of skillFiles) {
      const markdown = readFileText(absPath);
      if (markdown === null) continue;
      const skillName = path.basename(path.dirname(absPath));
      if (entriesBySkill.has(skillName)) continue;
      const repoPath = toRepoRelative(absPath);
      entriesBySkill.set(skillName, {
        skillName,
        path: repoPath,
        lastValidatedAt: readFrontmatterValue(markdown, "last_validated_against"),
        createdAt: readSkillCreatedDate(repoPath),
      });
    }
  }

  return [...entriesBySkill.values()].sort((a, b) => a.skillName.localeCompare(b.skillName));
}

function countRegexMatches(text: string, regex: RegExp): number {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const globalRegex = new RegExp(regex.source, flags);
  let count = 0;
  while (globalRegex.exec(text) !== null) count += 1;
  return count;
}

export function parseCodesightImporters(graphText: string, limit = TOP_IMPORTERS_COUNT): ImporterCount[] {
  const matches: ImporterCount[] = [];
  const pattern = /^-\s+`([^`]+)`\s+—\s+imported by\s+\*\*(\d+)\*\*/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(graphText)) !== null && matches.length < limit) {
    const file = match[1].replaceAll("\\", "/");
    const count = Number.parseInt(match[2], 10);
    if (Number.isFinite(count)) {
      matches.push({ file, count });
    }
  }
  return matches;
}

export function evaluateCouplingCreep(
  current: ImporterCount[],
  prior: ImporterCount[] | null,
  thresholdPct = COUPLING_CREEP_PCT,
): SignalResult {
  if (current.length === 0) {
    return { status: "skipped", reason: ".codesight/graph.md missing or unparsable" };
  }
  if (!prior || prior.length === 0) {
    return { status: "skipped", reason: "first run — baseline recorded, no week-over-week delta yet" };
  }

  const priorMap = new Map(prior.map((entry) => [entry.file, entry.count]));
  const flagged: Array<{ file: string; before: number; after: number; pct: number }> = [];

  for (const entry of current) {
    const before = priorMap.get(entry.file);
    if (!before || before <= 0) continue;
    const pct = ((entry.count - before) / before) * 100;
    if (pct > thresholdPct) {
      flagged.push({ file: entry.file, before, after: entry.count, pct: Math.round(pct) });
    }
  }

  if (flagged.length === 0) return { status: "green" };

  const rows = flagged
    .map((item) => `| \`${item.file}\` | ${item.before} | ${item.after} | +${item.pct}% |`)
    .join("\n");

  return {
    status: "red",
    summary: `${flagged.length} file(s) exceeded +${thresholdPct}% importer growth`,
    body: [
      "## Coupling creep detected",
      "",
      `Files in top-${TOP_IMPORTERS_COUNT} importer set grew by more than \`${thresholdPct}%\` week-over-week.`,
      "",
      "| File | Prior importers | Current importers | Delta |",
      "|---|---:|---:|---:|",
      rows,
      "",
      "Recommendation: review whether each increase reflects intentional architecture changes or accidental coupling spread.",
    ].join("\n"),
  };
}

export function countBrokenWindowsFromCorpus(corpus: string[]): BrokenWindowsCounts {
  const counts: BrokenWindowsCounts = {
    todo: 0,
    deferred: 0,
    tsIgnore: 0,
    skipCalls: 0,
    explicitAny: 0,
    total: 0,
  };

  for (const text of corpus) {
    counts.todo += countRegexMatches(text, /\/\/\s*TODO\b/g);
    counts.deferred += countRegexMatches(text, /\/\/\s*DEFERRED\b/g);
    counts.tsIgnore += countRegexMatches(text, /@ts-ignore\b/g);
    counts.skipCalls += countRegexMatches(text, /\.skip\s*\(/g);
    counts.explicitAny += countRegexMatches(text, /:\s*any\b/g);
  }

  counts.total = counts.todo + counts.deferred + counts.tsIgnore + counts.skipCalls + counts.explicitAny;
  return counts;
}

export function evaluateBrokenWindows(
  current: BrokenWindowsCounts,
  priorTotal: number | null,
  thresholdPct = BROKEN_WINDOWS_PCT,
): SignalResult {
  if (priorTotal === null || priorTotal < 0) {
    return {
      status: "skipped",
      reason: `first run — baseline total ${current.total} recorded`,
    };
  }

  if (priorTotal === 0 && current.total === 0) return { status: "green" };

  const delta = current.total - priorTotal;
  const pct = priorTotal > 0 ? (delta / priorTotal) * 100 : 100;
  if (pct <= thresholdPct) return { status: "green" };

  return {
    status: "red",
    summary: `broken-windows total rose ${Math.round(pct)}% (${priorTotal} → ${current.total})`,
    body: [
      "## Broken-windows tally increased",
      "",
      `Week-over-week total increased by +${delta} (${Math.round(pct)}%). Threshold: \`${thresholdPct}%\`.`,
      "",
      "| Pattern | Count |",
      "|---|---:|",
      `| \`// TODO\` | ${current.todo} |`,
      `| \`// DEFERRED\` | ${current.deferred} |`,
      `| \`@ts-ignore\` | ${current.tsIgnore} |`,
      `| \`.skip(\` | ${current.skipCalls} |`,
      `| \`: any\` | ${current.explicitAny} |`,
      `| **Total** | **${current.total}** |`,
      "",
      "Recommendation: reduce new TODO/DEFERRED and any-typed surfaces or link each intentional increase to a planned Linear follow-up.",
    ].join("\n"),
  };
}

export function evaluateTestSuiteHealth(params: {
  runtimeMs: number;
  suites: SuiteStatus[];
  priorRuntimeMs: number | null;
  priorSuiteHistory: Record<string, boolean[]>;
  runtimeRegressionPct?: number;
  minRunsForFlake?: number;
}): S3Evaluation {
  const {
    runtimeMs,
    suites,
    priorRuntimeMs,
    priorSuiteHistory,
    runtimeRegressionPct = TEST_RUNTIME_REGRESSION_PCT,
    minRunsForFlake = TEST_FLAKE_MIN_RUNS,
  } = params;

  const nextSuiteHistory: Record<string, boolean[]> = { ...priorSuiteHistory };
  for (const suite of suites) {
    const prior = nextSuiteHistory[suite.file] ?? [];
    const appended = [...prior, suite.passed].slice(-SUITE_HISTORY_LIMIT);
    nextSuiteHistory[suite.file] = appended;
  }

  const failingSuites = suites.filter((suite) => !suite.passed).map((suite) => suite.file);
  const flakeCandidates = Object.entries(nextSuiteHistory)
    .filter(([, observations]) => observations.length >= minRunsForFlake)
    .filter(([, observations]) => observations.some(Boolean) && observations.some((value) => !value))
    .map(([file]) => file)
    .sort();

  const runtimeDeltaPct =
    priorRuntimeMs && priorRuntimeMs > 0 ? ((runtimeMs - priorRuntimeMs) / priorRuntimeMs) * 100 : 0;
  const runtimeRegressed = priorRuntimeMs !== null && priorRuntimeMs > 0 && runtimeDeltaPct > runtimeRegressionPct;

  const slowestTests = suites
    .flatMap((suite) => suite.slowestTests)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);

  const firstRun = priorRuntimeMs === null;
  if (!runtimeRegressed && failingSuites.length === 0 && flakeCandidates.length === 0) {
    if (firstRun) {
      return {
        signal: {
          status: "skipped",
          reason: `first run — runtime ${(runtimeMs / 1000).toFixed(1)}s recorded`,
        },
        nextSuiteHistory,
      };
    }
    return { signal: { status: "green" }, nextSuiteHistory };
  }

  const summaryParts: string[] = [];
  if (failingSuites.length > 0) summaryParts.push(`${failingSuites.length} failing suite(s)`);
  if (runtimeRegressed) summaryParts.push(`runtime +${Math.round(runtimeDeltaPct)}%`);
  if (flakeCandidates.length > 0) summaryParts.push(`${flakeCandidates.length} flake candidate(s)`);

  const lines: string[] = ["## Test suite health issues", ""];

  if (failingSuites.length > 0) {
    lines.push("### Failing suites", "");
    for (const file of failingSuites) lines.push(`- \`${file}\``);
    lines.push("");
  }

  if (runtimeRegressed && priorRuntimeMs) {
    lines.push(
      "### Runtime regression",
      "",
      `Total runtime ${(runtimeMs / 1000).toFixed(1)}s vs ${(priorRuntimeMs / 1000).toFixed(1)}s (+${Math.round(runtimeDeltaPct)}%).`,
      `Threshold: \`${runtimeRegressionPct}%\`.`,
      "",
    );
  }

  if (flakeCandidates.length > 0) {
    lines.push("### Flake candidates (status flip across observed runs)", "");
    for (const file of flakeCandidates) lines.push(`- \`${file}\``);
    lines.push("");
  }

  if (slowestTests.length > 0) {
    lines.push("### Slowest 10 tests", "", "| Duration | Test |", "|---:|---|");
    for (const test of slowestTests) {
      lines.push(`| ${(test.durationMs / 1000).toFixed(2)}s | ${test.name.replaceAll("|", "\\|")} |`);
    }
    lines.push("");
  }

  lines.push("Recommendation: stabilize failing/flake suites first, then profile the slowest tests before changing thresholds.");

  return {
    signal: {
      status: "red",
      summary: summaryParts.join(", "),
      body: lines.join("\n"),
    },
    nextSuiteHistory,
  };
}

export function parseUlShardTerms(shardText: string, shardName: string): UlTerm[] {
  const terms: UlTerm[] = [];
  const lines = shardText.split(/\r?\n/);
  let current: UlTerm | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      if (current) terms.push(current);
      current = {
        name: headingMatch[1].trim(),
        aliases: [],
        status: "canonical",
        shard: shardName,
      };
      continue;
    }

    if (!current) continue;

    const aliasesMatch = line.match(/^\*\*Aliases:\*\*\s*(.+)$/i);
    if (aliasesMatch) {
      current.aliases = aliasesMatch[1]
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.toLowerCase() !== "none");
    }

    const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+)$/i);
    if (statusMatch) {
      const status = statusMatch[1].trim().toLowerCase();
      if (status.includes("deprecated")) current.status = "deprecated";
      else if (status.includes("proposed")) current.status = "proposed";
      else current.status = "canonical";
    }
  }

  if (current) terms.push(current);
  return terms;
}

export function extractCandidateTerms(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  const add = (term: string): void => {
    const normalized = term.trim();
    if (normalized.length < 4 || normalized.length > 80) return;
    const lower = normalized.toLowerCase();
    if (UL_STOPWORDS.has(lower)) return;
    if (seen.has(lower)) return;
    seen.add(lower);
    results.push(normalized);
  };

  const pascalOrCamel = text.match(/\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b/g) ?? [];
  for (const token of pascalOrCamel) add(token);

  const titleCasePhrases = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2}\b/g) ?? [];
  for (const phrase of titleCasePhrases) add(phrase);

  return results;
}

function buildCanonicalLookup(terms: UlTerm[]): Set<string> {
  const canonical = new Set<string>();
  for (const term of terms) {
    canonical.add(toLowerToken(term.name));
    for (const alias of term.aliases) canonical.add(toLowerToken(alias));
  }
  return canonical;
}

function countTermOccurrences(corpus: CorpusEntry[], term: string): number {
  const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
  let count = 0;
  for (const entry of corpus) {
    count += countRegexMatches(entry.text, pattern);
  }
  return count;
}

export function evaluateUlDrift(params: {
  runDate: string;
  terms: UlTerm[];
  corpus: CorpusEntry[];
  priorLastSeen: Record<string, string>;
  staleDays?: number;
  minOccurrences?: number;
}): S4Evaluation {
  const {
    runDate,
    terms,
    corpus,
    priorLastSeen,
    staleDays = UL_DRIFT_STALE_DAYS,
    minOccurrences = UL_UNCANONICAL_MIN_OCCURRENCES,
  } = params;

  if (terms.length === 0) {
    return {
      signal: { status: "skipped", reason: "UL shards found but no term headings parsed" },
      nextCanonicalLastSeen: { ...priorLastSeen },
    };
  }

  const canonicalTerms = terms.filter((term) => term.status === "canonical");
  if (canonicalTerms.length === 0) {
    return {
      signal: { status: "skipped", reason: "UL shards contain no canonical terms yet" },
      nextCanonicalLastSeen: { ...priorLastSeen },
    };
  }

  const nextCanonicalLastSeen: Record<string, string> = { ...priorLastSeen };
  const staleCandidates: Array<{ term: string; lastSeen: string; daysSinceSeen: number }> = [];

  for (const term of canonicalTerms) {
    const usageCount = countTermOccurrences(corpus, term.name);
    const key = toLowerToken(term.name);
    const previous = nextCanonicalLastSeen[key];

    if (usageCount > 0) {
      nextCanonicalLastSeen[key] = runDate;
      continue;
    }

    if (!previous) {
      // Start the clock on first observed run where term is unseen.
      nextCanonicalLastSeen[key] = runDate;
      continue;
    }

    const daysSinceSeen = dateDiffDays(runDate, previous);
    if (daysSinceSeen > staleDays) {
      staleCandidates.push({ term: term.name, lastSeen: previous, daysSinceSeen });
    }
  }

  const canonicalLookup = buildCanonicalLookup(canonicalTerms);
  const candidateCounts = new Map<string, number>();

  for (const entry of corpus) {
    const termsInEntry = extractCandidateTerms(entry.text);
    for (const candidate of termsInEntry) {
      const key = toLowerToken(candidate);
      if (canonicalLookup.has(key)) continue;
      candidateCounts.set(candidate, (candidateCounts.get(candidate) ?? 0) + 1);
    }
  }

  const uncanonical = [...candidateCounts.entries()]
    .filter(([, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term, count]) => ({ term, count }));

  if (staleCandidates.length === 0 && uncanonical.length === 0) {
    return {
      signal: { status: "green" },
      nextCanonicalLastSeen,
    };
  }

  const lines: string[] = ["## Ubiquitous-language drift detected", ""];

  if (staleCandidates.length > 0) {
    lines.push("### Canonical-unused terms", "", "| Term | Last seen | Days unseen |", "|---|---|---:|");
    for (const item of staleCandidates.sort((a, b) => b.daysSinceSeen - a.daysSinceSeen)) {
      lines.push(`| \`${item.term}\` | ${item.lastSeen} | ${item.daysSinceSeen} |`);
    }
    lines.push("");
  }

  if (uncanonical.length > 0) {
    lines.push("### Used-uncanonical candidates", "", "| Term | Occurrences |", "|---|---:|");
    for (const item of uncanonical) {
      lines.push(`| \`${item.term}\` | ${item.count} |`);
    }
    lines.push("");
  }

  lines.push(
    "Recommendation: validate each candidate with the ubiquitous-language skill and open/resolve UL-proposal issues for approved additions or retirements.",
  );

  return {
    signal: {
      status: "red",
      summary: `${staleCandidates.length} canonical-unused, ${uncanonical.length} used-uncanonical`,
      body: lines.join("\n"),
    },
    nextCanonicalLastSeen,
  };
}

export function evaluateSkillFreshness(params: {
  runDate: string;
  entries: SkillFreshnessEntry[];
  priorLastValidatedAt: Record<string, string>;
  staleDays?: number;
  archiveDays?: number;
  bootstrapGraceDays?: number;
}): S5Evaluation {
  const {
    runDate,
    entries,
    priorLastValidatedAt,
    staleDays = SKILL_FRESHNESS_STALE_DAYS,
    archiveDays = SKILL_FRESHNESS_ARCHIVE_DAYS,
    bootstrapGraceDays = SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
  } = params;

  if (entries.length === 0) {
    return {
      signal: { status: "skipped", reason: "no skill files found under .claude/skills or .agents/skills" },
      nextLastValidatedAt: { ...priorLastValidatedAt },
    };
  }

  const nextLastValidatedAt: Record<string, string> = { ...priorLastValidatedAt };
  const stale: Array<SkillFreshnessEntry & { parsedDate: string; daysUnvalidated: number }> = [];
  const archive: Array<SkillFreshnessEntry & { parsedDate: string; daysUnvalidated: number }> = [];
  const bootstrap: Array<{ skillName: string; path: string; reason: string }> = [];

  for (const entry of entries) {
    const parsedDate = parseIsoDateOnly(entry.lastValidatedAt);
    if (parsedDate) {
      nextLastValidatedAt[entry.skillName] = parsedDate;

      const prior = parseIsoDateOnly(priorLastValidatedAt[entry.skillName]);
      if (prior && Date.parse(`${parsedDate}T00:00:00Z`) < Date.parse(`${prior}T00:00:00Z`)) {
        bootstrap.push({
          skillName: entry.skillName,
          path: entry.path,
          reason: `validation date regressed (${prior} -> ${parsedDate})`,
        });
        continue;
      }

      const daysUnvalidated = dateDiffDays(runDate, parsedDate);
      if (daysUnvalidated > staleDays) {
        stale.push({ ...entry, parsedDate, daysUnvalidated });
      }
      if (daysUnvalidated > archiveDays) {
        archive.push({ ...entry, parsedDate, daysUnvalidated });
      }
      continue;
    }

    nextLastValidatedAt[entry.skillName] = entry.lastValidatedAt ?? "";
    const createdAt = parseIsoDateOnly(entry.createdAt);
    const inGraceWindow = createdAt !== null && dateDiffDays(runDate, createdAt) <= bootstrapGraceDays;
    if (inGraceWindow) continue;

    bootstrap.push({
      skillName: entry.skillName,
      path: entry.path,
      reason: entry.lastValidatedAt ? `invalid date format: ${entry.lastValidatedAt}` : "missing last_validated_against",
    });
  }

  if (stale.length === 0 && archive.length === 0 && bootstrap.length === 0) {
    return {
      signal: { status: "green" },
      nextLastValidatedAt,
    };
  }

  const lines: string[] = ["## Skill freshness drift detected", ""];

  if (stale.length > 0) {
    lines.push(
      `### Stale skills (>${staleDays} days unvalidated)`,
      "",
      "| Skill | Last validated | Days unvalidated | Path |",
      "|---|---|---:|---|",
    );
    for (const entry of stale.sort((a, b) => b.daysUnvalidated - a.daysUnvalidated)) {
      lines.push(`| \`${entry.skillName}\` | ${entry.parsedDate} | ${entry.daysUnvalidated} | \`${entry.path}\` |`);
    }
    lines.push("");
  }

  if (archive.length > 0) {
    lines.push(
      `### Archive-candidate skills (>${archiveDays} days unvalidated)`,
      "",
      "| Skill | Last validated | Days unvalidated | Path |",
      "|---|---|---:|---|",
    );
    for (const entry of archive.sort((a, b) => b.daysUnvalidated - a.daysUnvalidated)) {
      lines.push(`| \`${entry.skillName}\` | ${entry.parsedDate} | ${entry.daysUnvalidated} | \`${entry.path}\` |`);
    }
    lines.push("");
  }

  if (bootstrap.length > 0) {
    lines.push(
      "### Skills missing freshness metadata",
      "",
      "| Skill | Path | Reason |",
      "|---|---|---|",
    );
    for (const entry of bootstrap.sort((a, b) => a.skillName.localeCompare(b.skillName))) {
      lines.push(`| \`${entry.skillName}\` | \`${entry.path}\` | ${entry.reason.replaceAll("|", "\\|")} |`);
    }
    lines.push("");
  }

  lines.push(
    "Convention: bump `last_validated_against` when skill instructions or referenced systems change materially.",
  );

  return {
    signal: {
      status: "red",
      summary: `${stale.length} stale, ${archive.length} archive-candidate, ${bootstrap.length} bootstrap-needed`,
      body: lines.join("\n"),
    },
    nextLastValidatedAt,
  };
}

export async function executeSignalSteps(steps: SignalStep[]): Promise<SignalStepOutcome[]> {
  const outcomes: SignalStepOutcome[] = [];
  for (const step of steps) {
    try {
      const result = await step.run();
      outcomes.push({ id: step.id, name: step.name, result });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      outcomes.push({
        id: step.id,
        name: step.name,
        result: { status: "skipped", reason: `signal error: ${reason}` },
      });
    }
  }
  return outcomes;
}

function loadBaseline(): Baseline | null {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Partial<Baseline>;
    return {
      runDate: typeof raw.runDate === "string" ? raw.runDate : "",
      s1TopImporters: Array.isArray(raw.s1TopImporters) ? raw.s1TopImporters : [],
      s2BrokenWindowsTotal: Number.isFinite(raw.s2BrokenWindowsTotal) ? raw.s2BrokenWindowsTotal : 0,
      s3TestRuntimeMs: Number.isFinite(raw.s3TestRuntimeMs) ? raw.s3TestRuntimeMs : 0,
      s3SuiteHistory:
        raw.s3SuiteHistory && typeof raw.s3SuiteHistory === "object"
          ? raw.s3SuiteHistory
          : {},
      s4CanonicalLastSeen:
        raw.s4CanonicalLastSeen && typeof raw.s4CanonicalLastSeen === "object"
          ? raw.s4CanonicalLastSeen
          : {},
      s5SkillFreshness:
        raw.s5SkillFreshness &&
        typeof raw.s5SkillFreshness === "object" &&
        raw.s5SkillFreshness.lastValidatedAt &&
        typeof raw.s5SkillFreshness.lastValidatedAt === "object"
          ? {
              lastValidatedAt: raw.s5SkillFreshness.lastValidatedAt as Record<string, string>,
            }
          : { lastValidatedAt: {} },
    };
  } catch {
    return null;
  }
}

function saveBaseline(baseline: Baseline): void {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2), "utf8");
}

function readSourceCorpus(): string[] {
  const srcRoot = path.join(REPO_ROOT, "src");
  const files = collectFilesRecursive(srcRoot, SOURCE_FILE_EXTENSIONS);
  return files
    .map((absPath) => readFileText(absPath))
    .filter((value): value is string => value !== null);
}

function readDocCorpus(): CorpusEntry[] {
  const roots = [path.join(REPO_ROOT, "src"), path.join(REPO_ROOT, "Docs"), path.join(REPO_ROOT, "TheFantasyWorldSimulator")]
    .filter((root) => fs.existsSync(root));

  const corpus: CorpusEntry[] = [];
  for (const root of roots) {
    const files = collectFilesRecursive(root, DOC_FILE_EXTENSIONS);
    for (const absPath of files) {
      const text = readFileText(absPath);
      if (text === null) continue;
      corpus.push({ file: toRepoRelative(absPath), text });
    }
  }
  return corpus;
}

function parseVitestJsonResults(outputPath: string): { runtimeMs: number; suites: SuiteStatus[] } | null {
  if (!fs.existsSync(outputPath)) return null;
  try {
    const payload = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
      testResults?: Array<{
        testFilePath?: string;
        status?: string;
        duration?: number;
        assertionResults?: Array<{ fullName?: string; duration?: number; status?: string }>;
      }>;
    };

    const suites: SuiteStatus[] = [];
    for (const suite of payload.testResults ?? []) {
      const relFile = suite.testFilePath ? path.relative(REPO_ROOT, suite.testFilePath).replaceAll("\\", "/") : "unknown";
      const tests = (suite.assertionResults ?? []).map((assertion) => ({
        name: assertion.fullName ?? "unknown test",
        durationMs: assertion.duration ?? 0,
        passed: assertion.status === "passed",
      }));
      tests.sort((a, b) => b.durationMs - a.durationMs);
      suites.push({
        file: relFile,
        passed: suite.status === "passed",
        durationMs: suite.duration ?? 0,
        slowestTests: tests.slice(0, 3).map((test) => ({ name: test.name, durationMs: test.durationMs })),
      });
    }

    const runtimeMs = suites.reduce((sum, suite) => sum + suite.durationMs, 0);
    return { runtimeMs, suites };
  } catch {
    return null;
  }
}

function runVitestJson(): { runtimeMs: number; suites: SuiteStatus[] } {
  const absOutputPath = path.join(REPO_ROOT, TEST_OUTPUT_PATH);
  fs.mkdirSync(path.dirname(absOutputPath), { recursive: true });
  if (fs.existsSync(absOutputPath)) fs.unlinkSync(absOutputPath);

  const run = spawnSync(
    "npx",
    ["vitest", "run", "--reporter=json", `--outputFile=${absOutputPath}`],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: DEFAULT_TEST_TIMEOUT_MS,
    },
  );

  const parsed = parseVitestJsonResults(absOutputPath);
  if (!parsed) {
    const stderr = (run.stderr ?? "").trim();
    throw new Error(`vitest JSON output unavailable${stderr ? `: ${stderr.slice(0, 240)}` : ""}`);
  }

  return parsed;
}

async function linearGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (payload.errors && payload.errors.length > 0) {
    const message = payload.errors.map((entry) => entry.message ?? "unknown error").join("; ");
    throw new Error(`Linear GraphQL error: ${message}`);
  }
  if (!payload.data) {
    throw new Error("Linear GraphQL returned no data payload");
  }
  return payload.data;
}

async function ensureDriftScanLabelId(): Promise<string> {
  const existing = await linearGql<{
    issueLabels: { nodes: Array<{ id: string; name: string }> };
  }>(
    `query($name: String!) {
      issueLabels(filter: { name: { eq: $name } }) {
        nodes { id name }
      }
    }`,
    { name: DRIFT_SCAN_LABEL_NAME },
  );

  const existingLabel = existing.issueLabels.nodes[0];
  if (existingLabel) return existingLabel.id;

  const created = await linearGql<{
    issueLabelCreate: { issueLabel: { id: string } | null };
  }>(
    `mutation($teamId: String!, $name: String!, $color: String!) {
      issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color }) {
        issueLabel { id }
      }
    }`,
    { teamId: LINEAR_TEAM_ID, name: DRIFT_SCAN_LABEL_NAME, color: "#F59E0B" },
  );

  const id = created.issueLabelCreate.issueLabel?.id;
  if (!id) throw new Error("unable to create drift-scan label");
  return id;
}

async function resolveBacklogStateId(): Promise<string | null> {
  const data = await linearGql<{
    team: { states: { nodes: Array<{ id: string; name: string; type: string }> } } | null;
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name type } }
      }
    }`,
    { teamId: LINEAR_TEAM_ID },
  );

  const states = data.team?.states.nodes ?? [];
  const preferred = states.find((state) => state.type === "backlog");
  if (preferred) return preferred.id;
  const triageLike = states.find((state) => state.name.toLowerCase().includes("triage"));
  return triageLike?.id ?? null;
}

async function findIssueByExactTitle(title: string): Promise<string | null> {
  const data = await linearGql<{
    issues: { nodes: Array<{ id: string; identifier: string; title: string }> };
  }>(
    `query($title: String!) {
      issues(first: 5, filter: { title: { eq: $title } }) {
        nodes { id identifier title }
      }
    }`,
    { title },
  );

  const exact = data.issues.nodes.find((issue) => issue.title === title);
  return exact?.identifier ?? null;
}

async function createDriftIssue(params: {
  title: string;
  body: string;
  labelId: string;
  stateId: string | null;
}): Promise<string> {
  const data = await linearGql<{
    issueCreate: { issue: { identifier: string } | null };
  }>(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        issue { identifier }
      }
    }`,
    {
      input: {
        title: params.title,
        description: params.body,
        teamId: LINEAR_TEAM_ID,
        projectId: LINEAR_PROJECT_ID,
        labelIds: [params.labelId],
        stateId: params.stateId,
      },
    },
  );

  const identifier = data.issueCreate.issue?.identifier;
  if (!identifier) throw new Error("Linear issueCreate returned no identifier");
  return identifier;
}

async function runS1(baseline: Baseline | null): Promise<{ signal: SignalResult; nextTopImporters: ImporterCount[] }> {
  const graphPath = path.join(REPO_ROOT, ".codesight", "graph.md");
  if (!fs.existsSync(graphPath)) {
    return {
      signal: { status: "skipped", reason: ".codesight/graph.md not found" },
      nextTopImporters: [],
    };
  }

  const graphText = fs.readFileSync(graphPath, "utf8");
  const current = parseCodesightImporters(graphText, TOP_IMPORTERS_COUNT);
  const prior = baseline?.s1TopImporters ?? null;
  return {
    signal: evaluateCouplingCreep(current, prior, COUPLING_CREEP_PCT),
    nextTopImporters: current,
  };
}

async function runS2(baseline: Baseline | null): Promise<{ signal: SignalResult; nextTotal: number }> {
  const corpus = readSourceCorpus();
  if (corpus.length === 0) {
    return {
      signal: { status: "skipped", reason: "no source corpus files found under src/" },
      nextTotal: baseline?.s2BrokenWindowsTotal ?? 0,
    };
  }

  const counts = countBrokenWindowsFromCorpus(corpus);
  const signal = evaluateBrokenWindows(
    counts,
    baseline ? baseline.s2BrokenWindowsTotal : null,
    BROKEN_WINDOWS_PCT,
  );
  return { signal, nextTotal: counts.total };
}

async function runS3(baseline: Baseline | null): Promise<{ signal: SignalResult; nextRuntimeMs: number; nextHistory: Record<string, boolean[]> }> {
  const runtime = runVitestJson();
  const evaluation = evaluateTestSuiteHealth({
    runtimeMs: runtime.runtimeMs,
    suites: runtime.suites,
    priorRuntimeMs: baseline ? baseline.s3TestRuntimeMs : null,
    priorSuiteHistory: baseline?.s3SuiteHistory ?? {},
    runtimeRegressionPct: TEST_RUNTIME_REGRESSION_PCT,
    minRunsForFlake: TEST_FLAKE_MIN_RUNS,
  });

  return {
    signal: evaluation.signal,
    nextRuntimeMs: runtime.runtimeMs,
    nextHistory: evaluation.nextSuiteHistory,
  };
}

async function runS4(baseline: Baseline | null, runDate: string): Promise<{ signal: SignalResult; nextLastSeen: Record<string, string> }> {
  const ulRoot = path.join(REPO_ROOT, UL_SHARD_DIR);
  if (!fs.existsSync(ulRoot)) {
    return {
      signal: {
        status: "skipped",
        reason: `UL shard directory missing (${UL_SHARD_DIR}); likely blocked on THR-271`,
      },
      nextLastSeen: baseline?.s4CanonicalLastSeen ?? {},
    };
  }

  const shardFiles = fs
    .readdirSync(ulRoot)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((name) => path.join(ulRoot, name));

  if (shardFiles.length === 0) {
    return {
      signal: { status: "skipped", reason: "UL shard directory exists but has no shard markdown files" },
      nextLastSeen: baseline?.s4CanonicalLastSeen ?? {},
    };
  }

  const terms: UlTerm[] = [];
  for (const shardFile of shardFiles) {
    const text = readFileText(shardFile);
    if (text === null) continue;
    terms.push(...parseUlShardTerms(text, path.basename(shardFile)));
  }

  const corpus = readDocCorpus();
  const evaluation = evaluateUlDrift({
    runDate,
    terms,
    corpus,
    priorLastSeen: baseline?.s4CanonicalLastSeen ?? {},
    staleDays: UL_DRIFT_STALE_DAYS,
    minOccurrences: UL_UNCANONICAL_MIN_OCCURRENCES,
  });

  return {
    signal: evaluation.signal,
    nextLastSeen: evaluation.nextCanonicalLastSeen,
  };
}

async function runS5(
  baseline: Baseline | null,
  runDate: string,
): Promise<{ signal: SignalResult; nextLastValidatedAt: Record<string, string> }> {
  const entries = readSkillFreshnessEntries();
  const evaluation = evaluateSkillFreshness({
    runDate,
    entries,
    priorLastValidatedAt: baseline?.s5SkillFreshness.lastValidatedAt ?? {},
    staleDays: SKILL_FRESHNESS_STALE_DAYS,
    archiveDays: SKILL_FRESHNESS_ARCHIVE_DAYS,
    bootstrapGraceDays: SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
  });

  return {
    signal: evaluation.signal,
    nextLastValidatedAt: evaluation.nextLastValidatedAt,
  };
}

function formatIssueTitle(runDate: string, signalName: string, summary: string): string {
  return `Drift scan [${runDate}]: ${signalName} — ${summary}`;
}

function printSignalOutcome(outcome: SignalStepOutcome): void {
  if (outcome.result.status === "green") {
    console.log(`${outcome.id} (${outcome.name}) green ✓`);
    return;
  }
  if (outcome.result.status === "skipped") {
    console.log(`${outcome.id} (${outcome.name}) skipped — ${outcome.result.reason}`);
    return;
  }
  console.log(`${outcome.id} (${outcome.name}) red — ${outcome.result.summary}`);
}

async function main(): Promise<void> {
  const runDate = todayDateStamp();
  console.log(`drift-scan ${runDate}`);

  if (!LINEAR_API_KEY) {
    throw new Error("LINEAR_API_KEY not set");
  }

  const baseline = loadBaseline();
  if (baseline) {
    console.log(`loaded baseline from ${baseline.runDate || "unknown-date"}`);
  } else {
    console.log("no baseline found — this run records initial snapshots");
  }

  const nextBaseline: Baseline = {
    runDate,
    s1TopImporters: baseline?.s1TopImporters ?? [],
    s2BrokenWindowsTotal: baseline?.s2BrokenWindowsTotal ?? 0,
    s3TestRuntimeMs: baseline?.s3TestRuntimeMs ?? 0,
    s3SuiteHistory: baseline?.s3SuiteHistory ?? {},
    s4CanonicalLastSeen: baseline?.s4CanonicalLastSeen ?? {},
    s5SkillFreshness: baseline?.s5SkillFreshness ?? { lastValidatedAt: {} },
  };

  const steps: SignalStep[] = [
    {
      id: "S1",
      name: "coupling creep",
      run: async () => {
        const result = await runS1(baseline);
        nextBaseline.s1TopImporters = result.nextTopImporters;
        return result.signal;
      },
    },
    {
      id: "S2",
      name: "broken-windows tally",
      run: async () => {
        const result = await runS2(baseline);
        nextBaseline.s2BrokenWindowsTotal = result.nextTotal;
        return result.signal;
      },
    },
    {
      id: "S3",
      name: "test suite health",
      run: async () => {
        const result = await runS3(baseline);
        nextBaseline.s3TestRuntimeMs = result.nextRuntimeMs;
        nextBaseline.s3SuiteHistory = result.nextHistory;
        return result.signal;
      },
    },
    {
      id: "S4",
      name: "UL drift",
      run: async () => {
        const result = await runS4(baseline, runDate);
        nextBaseline.s4CanonicalLastSeen = result.nextLastSeen;
        return result.signal;
      },
    },
    {
      id: "S5",
      name: "Skill freshness",
      run: async () => {
        const result = await runS5(baseline, runDate);
        nextBaseline.s5SkillFreshness = { lastValidatedAt: result.nextLastValidatedAt };
        return result.signal;
      },
    },
  ];

  const outcomes = await executeSignalSteps(steps);
  for (const outcome of outcomes) {
    printSignalOutcome(outcome);
  }

  const labelId = await ensureDriftScanLabelId();
  const backlogStateId = await resolveBacklogStateId();

  for (const outcome of outcomes) {
    if (outcome.result.status !== "red") continue;

    const title = formatIssueTitle(runDate, outcome.name, outcome.result.summary);
    const existing = await findIssueByExactTitle(title);
    if (existing) {
      console.log(`existing issue found (${existing}) for ${outcome.id}; skipping duplicate creation`);
      continue;
    }

    const body = `${outcome.result.body}\n\n---\nGenerated by \`scripts/drift-scan/index.ts\` on ${runDate}.`;
    const created = await createDriftIssue({
      title,
      body,
      labelId,
      stateId: backlogStateId,
    });
    console.log(`created ${created}: ${title}`);
  }

  saveBaseline(nextBaseline);
  console.log(`baseline saved -> ${BASELINE_PATH}`);
  console.log("drift-scan complete");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`drift-scan failed: ${message}`);
    process.exit(1);
  });
}
