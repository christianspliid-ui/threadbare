#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  normalizeText,
  parseImpedimentLog,
  type ImpedimentImpact,
} from "./impediment-log.ts";

type Impact = ImpedimentImpact;

type Entry = {
  /** Display reference — `184` for a table row, `P12` for a paragraph entry. */
  ref: string;
  id: number;
  count: number;
  date: string;
  category: string;
  description: string;
  consequence: string;
  impact: Impact;
  workaroundFound: string;
  workaroundDescription: string;
  sessionContext: string;
  descriptionHash: string;
  cluster: string;
};

type AggregateBucket = {
  entries: number;
  occurrences: number;
};

type ClusterBucket = {
  label: string;
  entries: Entry[];
  occurrences: number;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMPEDIMENT_LOG_PATH = path.join(REPO_ROOT, "Docs", "impediments.md");
const RETRO_DIR = path.join(REPO_ROOT, "Design", "retros");

const IMPACT_MINUTES: Record<Impact, number> = {
  S: 1,
  M: 8,
  L: 20,
  Blocked: 30,
  Unknown: 0,
};

const CLUSTER_RULES: Array<{ label: string; matches: (text: string) => boolean }> = [
  {
    label: "Sandbox search tooling (rg/ripgrep unavailable)",
    matches: (text) => text.includes("rg.exe") || text.includes("ripgrep"),
  },
  {
    label: "Obsidian connector unavailable",
    matches: (text) =>
      text.includes("obsidian") &&
      (text.includes("mcp") || text.includes("connector") || text.includes("localhost:27124")),
  },
  {
    label: "Linear MCP behavior quirks",
    matches: (text) => text.includes("linear") && text.includes("mcp"),
  },
  {
    label: "Automation environment variable gaps",
    matches: (text) => text.includes("$codex_home") || text.includes("codex_home"),
  },
  {
    label: "Baseline test-suite instability",
    matches: (text) => text.includes("npm test") && text.includes("red"),
  },
  {
    label: "Git staging/locking contention",
    matches: (text) => text.includes(".git/index.lock") || text.includes("index.lock"),
  },
];

function toIsoDateLocal(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function truncate(value: string, maxLen: number): string {
  const clean = normalizeText(value);
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1)}…`;
}

function hashDescription(description: string): string {
  const normalized = normalizeText(description).toLowerCase();
  return crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 10);
}

function inferCluster(entry: Omit<Entry, "cluster">): string {
  const corpus = normalizeText(
    [
      entry.category,
      entry.description,
      entry.consequence,
      entry.workaroundDescription,
      entry.sessionContext,
    ].join(" "),
  ).toLowerCase();

  for (const rule of CLUSTER_RULES) {
    if (rule.matches(corpus)) {
      return rule.label;
    }
  }
  return `Other (${entry.category})`;
}

/**
 * Adapts the shared log parser to the draft's own entry shape.
 *
 * Both of the log's formats arrive here (THR-764) — before that, the retro draft
 * gated on a leading `|` and so ran on table rows alone, silently excluding every
 * paragraph-form entry from the recurrence analysis it exists to produce.
 */
function parseEntries(markdown: string): Entry[] {
  const { entries: parsed } = parseImpedimentLog(markdown);

  const entries = parsed.map((source) => {
    const partial: Omit<Entry, "cluster"> = {
      ref: source.num,
      id: source.id,
      count: source.count,
      date: source.date,
      category: source.category,
      description: source.description,
      consequence: source.consequence,
      impact: source.impact,
      workaroundFound: source.workaroundFoundRaw,
      workaroundDescription: source.workaround,
      sessionContext: source.session,
      descriptionHash: hashDescription(source.description),
    };

    return { ...partial, cluster: inferCluster(partial) };
  });

  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

function findLastRetroDate(markdown: string): string | null {
  const regex = /Retrospective conducted:\s*(\d{4}-\d{2}-\d{2})/g;
  const dates: string[] = [];
  for (const match of markdown.matchAll(regex)) {
    const date = match[1];
    if (date) dates.push(date);
  }
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

function aggregateByCategory(entries: Entry[]): Map<string, AggregateBucket> {
  const map = new Map<string, AggregateBucket>();
  for (const entry of entries) {
    const current = map.get(entry.category) ?? { entries: 0, occurrences: 0 };
    current.entries += 1;
    current.occurrences += entry.count;
    map.set(entry.category, current);
  }
  return map;
}

function aggregateByImpact(entries: Entry[]): Map<Impact, AggregateBucket> {
  const map = new Map<Impact, AggregateBucket>();
  for (const entry of entries) {
    const current = map.get(entry.impact) ?? { entries: 0, occurrences: 0 };
    current.entries += 1;
    current.occurrences += entry.count;
    map.set(entry.impact, current);
  }
  return map;
}

function aggregateByCluster(entries: Entry[]): Map<string, ClusterBucket> {
  const map = new Map<string, ClusterBucket>();
  for (const entry of entries) {
    const current = map.get(entry.cluster) ?? { label: entry.cluster, entries: [], occurrences: 0 };
    current.entries.push(entry);
    current.occurrences += entry.count;
    map.set(entry.cluster, current);
  }
  for (const bucket of map.values()) {
    bucket.entries.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  }
  return map;
}

function groupDuplicateHashes(entries: Entry[]): Array<{ hash: string; entries: Entry[] }> {
  const map = new Map<string, Entry[]>();
  for (const entry of entries) {
    const bucket = map.get(entry.descriptionHash) ?? [];
    bucket.push(entry);
    map.set(entry.descriptionHash, bucket);
  }
  return [...map.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([hash, rows]) => ({
      hash,
      entries: [...rows].sort((a, b) => a.id - b.id),
    }))
    .sort((a, b) => a.hash.localeCompare(b.hash));
}

function buildDraftMarkdown(
  outputDate: string,
  periodFrom: string,
  entries: Entry[],
  categories: Map<string, AggregateBucket>,
  impacts: Map<Impact, AggregateBucket>,
  clusters: Map<string, ClusterBucket>,
  duplicates: Array<{ hash: string; entries: Entry[] }>,
): string {
  const totalEntries = entries.length;
  const totalOccurrences = entries.reduce((sum, entry) => sum + entry.count, 0);
  const estimatedMinutes = entries.reduce((sum, entry) => sum + entry.count * IMPACT_MINUTES[entry.impact], 0);
  const estimatedHours = (estimatedMinutes / 60).toFixed(1);

  const sortedCategories = [...categories.entries()].sort((a, b) => {
    if (b[1].occurrences !== a[1].occurrences) return b[1].occurrences - a[1].occurrences;
    return a[0].localeCompare(b[0]);
  });

  const impactOrder: Impact[] = ["Blocked", "L", "M", "S", "Unknown"];
  const sortedImpacts = [...impacts.entries()].sort((a, b) => {
    return impactOrder.indexOf(a[0]) - impactOrder.indexOf(b[0]);
  });

  const sortedClusters = [...clusters.values()].sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return a.label.localeCompare(b.label);
  });

  const lines: string[] = [];
  lines.push(`# Retrospective Draft — ${outputDate}`);
  lines.push("");
  lines.push("**Note:** This is a deterministic draft; revise into narrative form.");
  lines.push("");
  lines.push("## Period");
  lines.push(`From: ${periodFrom}`);
  lines.push(`To: ${outputDate}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Entries reviewed: ${totalEntries}`);
  lines.push(`- Total occurrence count: ${totalOccurrences}`);
  lines.push(`- Estimated time lost (heuristic): ~${estimatedHours}h (${estimatedMinutes} minutes)`);
  lines.push(`- Distinct root-cause clusters: ${sortedClusters.length}`);
  lines.push("");
  lines.push("## Analytics");
  lines.push("");
  lines.push("### By Category");
  lines.push("| Category | Entries | Occurrences |");
  lines.push("|---|---:|---:|");
  for (const [category, bucket] of sortedCategories) {
    lines.push(`| ${category} | ${bucket.entries} | ${bucket.occurrences} |`);
  }
  if (sortedCategories.length === 0) {
    lines.push("| _(none)_ | 0 | 0 |");
  }
  lines.push("");
  lines.push("### By Impact");
  lines.push("| Impact | Entries | Occurrences | Minutes per occurrence |");
  lines.push("|---|---:|---:|---:|");
  for (const [impact, bucket] of sortedImpacts) {
    lines.push(`| ${impact} | ${bucket.entries} | ${bucket.occurrences} | ${IMPACT_MINUTES[impact]} |`);
  }
  if (sortedImpacts.length === 0) {
    lines.push("| _(none)_ | 0 | 0 | 0 |");
  }
  lines.push("");
  lines.push("### By Root-Cause Cluster");
  lines.push("| Cluster | Entries | Occurrences |");
  lines.push("|---|---:|---:|");
  for (const cluster of sortedClusters) {
    lines.push(`| ${cluster.label} | ${cluster.entries.length} | ${cluster.occurrences} |`);
  }
  if (sortedClusters.length === 0) {
    lines.push("| _(none)_ | 0 | 0 |");
  }
  lines.push("");
  lines.push("## Duplicate Description Hashes");
  if (duplicates.length === 0) {
    lines.push("No duplicate description hashes detected in this period.");
  } else {
    lines.push("| Hash | Entry IDs | Occurrences | Example description |");
    lines.push("|---|---|---:|---|");
    for (const duplicate of duplicates) {
      const ids = duplicate.entries.map((entry) => `#${entry.ref}`).join(", ");
      const occurrences = duplicate.entries.reduce((sum, entry) => sum + entry.count, 0);
      const example = truncate(duplicate.entries[0]?.description ?? "", 90);
      lines.push(`| \`${duplicate.hash}\` | ${ids} | ${occurrences} | ${example} |`);
    }
  }
  lines.push("");
  lines.push("## Root-Cause Clusters");
  if (sortedClusters.length === 0) {
    lines.push("No impediment entries found for this period.");
  } else {
    for (const cluster of sortedClusters) {
      lines.push("");
      lines.push(`### ${cluster.label}`);
      lines.push("| # | Count | Date | Category | Impact | Description |");
      lines.push("|---:|---:|---|---|---|---|");
      for (const entry of cluster.entries) {
        lines.push(
          `| ${entry.ref} | ${entry.count} | ${entry.date} | ${entry.category} | ${entry.impact} | ${truncate(entry.description, 120)} |`,
        );
      }
    }
  }
  lines.push("");
  lines.push("## Determinism Guard");
  lines.push("- Input source: `Docs/impediments.md`");
  lines.push("- Rendering order: stable sort by count/date/id and lexical tie-breakers.");
  lines.push("- Duplicate detection: SHA-1 hash of normalized description text.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function main(): void {
  if (!fs.existsSync(IMPEDIMENT_LOG_PATH)) {
    throw new Error(`Impediment log not found: ${IMPEDIMENT_LOG_PATH}`);
  }

  const markdown = fs.readFileSync(IMPEDIMENT_LOG_PATH, "utf8");
  const allEntries = parseEntries(markdown);
  const lastRetroDate = findLastRetroDate(markdown);
  const outputDate = process.env.RETRO_DRAFT_DATE?.trim() || toIsoDateLocal(new Date());
  const filteredEntries = lastRetroDate
    ? allEntries.filter((entry) => entry.date > lastRetroDate)
    : allEntries;

  const categories = aggregateByCategory(filteredEntries);
  const impacts = aggregateByImpact(filteredEntries);
  const clusters = aggregateByCluster(filteredEntries);
  const duplicates = groupDuplicateHashes(filteredEntries);
  const periodFrom = lastRetroDate ? `${lastRetroDate} (exclusive)` : "start of impediment log";

  const output = buildDraftMarkdown(
    outputDate,
    periodFrom,
    filteredEntries,
    categories,
    impacts,
    clusters,
    duplicates,
  );

  fs.mkdirSync(RETRO_DIR, { recursive: true });
  const outputPath = path.join(RETRO_DIR, `retro-${outputDate}-draft.md`);
  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`retro-draft wrote ${path.relative(REPO_ROOT, outputPath)} (${filteredEntries.length} entries)`);
}

main();
