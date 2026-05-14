#!/usr/bin/env node

/**
 * Worktree orphan scanner — files local content that lives only in a Codex/Claude
 * worktree and has not been merged into main or the canonical Obsidian vault.
 *
 * Runs locally (not in CI — the GitHub Actions runner can't see the user's
 * worktrees).  Triggered by the `weekly-worktree-orphan-scan` scheduled task.
 *
 * Usage:
 *   node --experimental-strip-types scripts/lint-worktree-orphan.ts
 *   node --experimental-strip-types scripts/lint-worktree-orphan.ts --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  LINEAR_API_KEY,
  ensureDriftScanLabelId,
  resolveBacklogStateId,
  findIssueByExactTitle,
  createDriftIssue,
} from "./drift-scan/linear";

// ---------------------------------------------------------------------------
// Constants (NFP #1 — every magic number is named)
// ---------------------------------------------------------------------------

/** Worktrees whose last commit is younger than this are considered active; skip them. */
export const WORKTREE_STALENESS_DAYS = 7;

/** If a single worktree has more orphans than this, emit one aggregate issue instead of N individual ones. */
export const ORPHAN_AGGREGATE_THRESHOLD = 3;

/** File patterns (repo-relative globs) in scope for orphan detection. */
export const ORPHAN_SCOPE_PATTERNS: readonly string[] = [
  "TheFantasyWorldSimulator/Brainstorms",
  "TheFantasyWorldSimulator/Vision",
  "Docs/plans",
  "Docs/canon",
  "Docs/audits",
];

/** Markdown extensions considered in scope. */
export const ORPHAN_FILE_EXTENSION = ".md";

/** Directory names to skip during file enumeration. */
export const ORPHAN_EXCLUDE_DIRS: readonly string[] = [
  ".git",
  "node_modules",
  "dist",
  "preview-build",
  "tmp",
  ".codesight",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorktreeEntry = {
  /** Absolute path to the worktree on disk. */
  path: string;
  /** Branch name without refs/heads/ prefix, or null if detached HEAD. */
  branch: string | null;
  /** True when this is the main (first) worktree. */
  isMain: boolean;
};

export type OrphanFile = {
  /** Path relative to the worktree root (forward-slash separated). */
  relPath: string;
  /** Where this file should be promoted: Obsidian vault or the main repo. */
  promotionTarget: "vault" | "repo";
};

export type WorktreeScanResult = {
  worktreePath: string;
  worktreeName: string;
  /** ISO date string (YYYY-MM-DD) or null if unavailable. */
  lastCommitDate: string | null;
  orphans: OrphanFile[];
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Parse the output of `git worktree list --porcelain`.
 *
 * Each block is separated by a blank line and starts with `worktree <path>`.
 * The first block is always the main worktree.
 */
export function parseWorktreeList(output: string): WorktreeEntry[] {
  const blocks = output.trim().split(/\n\n+/);
  const entries: WorktreeEntry[] = [];

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    if (!block || !block.trim()) continue;

    const lines = block.split(/\r?\n/);
    let worktreePath: string | null = null;
    let branch: string | null = null;

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        worktreePath = line.slice("worktree ".length).trim();
      } else if (line.startsWith("branch ")) {
        const branchRef = line.slice("branch ".length).trim();
        branch = branchRef.startsWith("refs/heads/")
          ? branchRef.slice("refs/heads/".length)
          : branchRef;
      }
    }

    if (!worktreePath) continue;
    entries.push({ path: worktreePath, branch, isMain: blockIndex === 0 });
  }

  return entries;
}

/**
 * Return the ISO date of the last commit in a worktree (YYYY-MM-DD), or null
 * if git fails or the worktree has no commits.
 */
export function getWorktreeLastCommitDate(worktreePath: string): string | null {
  const run = spawnSync("git", ["-C", worktreePath, "log", "-1", "--format=%as"], {
    encoding: "utf8",
    timeout: 10_000,
  });
  const output = (run.stdout ?? "").trim();
  if (!output || !/^\d{4}-\d{2}-\d{2}$/.test(output)) return null;
  return output;
}

/** True when the worktree's last commit is older than `stalenessThresholdDays`. */
export function isStaleWorktree(
  lastCommitDate: string | null,
  nowDate: string,
  stalenessThresholdDays: number,
): boolean {
  if (!lastCommitDate) return false; // can't determine staleness — skip safely
  const lastMs = Date.parse(`${lastCommitDate}T00:00:00Z`);
  const nowMs = Date.parse(`${nowDate}T00:00:00Z`);
  if (Number.isNaN(lastMs) || Number.isNaN(nowMs)) return false;
  const days = (nowMs - lastMs) / (24 * 60 * 60 * 1000);
  return days >= stalenessThresholdDays;
}

/** Recursively enumerate .md files under the given directory, skipping excluded dirs. */
function collectMarkdownFiles(
  dirAbs: string,
  excludeDirs: readonly string[],
  results: string[] = [],
): string[] {
  if (!fs.existsSync(dirAbs)) return results;
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      collectMarkdownFiles(path.join(dirAbs, entry.name), excludeDirs, results);
    } else if (entry.isFile() && entry.name.endsWith(ORPHAN_FILE_EXTENSION)) {
      results.push(path.join(dirAbs, entry.name));
    }
  }
  return results;
}

/**
 * Return all in-scope files found in `worktreePath`, as paths relative to the
 * worktree root (forward-slash separated).
 */
export function getInScopeRelPaths(
  worktreePath: string,
  scopePatterns: readonly string[],
  excludeDirs: readonly string[],
): string[] {
  const results: string[] = [];
  for (const pattern of scopePatterns) {
    const absDir = path.join(worktreePath, pattern);
    const files = collectMarkdownFiles(absDir, excludeDirs);
    for (const abs of files) {
      const rel = path.relative(worktreePath, abs).replaceAll("\\", "/");
      results.push(rel);
    }
  }
  return results;
}

/**
 * Classify a worktree-relative path: vault-promotable paths live under
 * TheFantasyWorldSimulator/; everything else is a repo-promotable path.
 */
export function classifyPromotionTarget(relPath: string): "vault" | "repo" {
  return relPath.startsWith("TheFantasyWorldSimulator/") ? "vault" : "repo";
}

/**
 * Stable issue title for a single orphan — date-less so `findIssueByExactTitle`
 * deduplicates across weekly runs.
 */
export function buildOrphanIssueTitle(relPath: string, worktreeName: string): string {
  return `worktree-orphan: ${relPath} in ${worktreeName}`;
}

/** Stable aggregate issue title for a worktree with many orphans. */
export function buildAggregateIssueTitle(worktreeName: string): string {
  return `worktree-orphan (aggregate): ${worktreeName}`;
}

export function buildOrphanIssueBody(params: {
  relPath: string;
  worktreePath: string;
  worktreeName: string;
  lastCommitDate: string | null;
  promotionTarget: "vault" | "repo";
}): string {
  const { relPath, worktreePath, worktreeName, lastCommitDate, promotionTarget } = params;
  const lastCommitStr = lastCommitDate ?? "unknown";

  const promotionNote =
    promotionTarget === "vault"
      ? `Suggested promotion: move to the canonical Obsidian vault \`TheFantasyWorldSimulator/\` folder.`
      : `Suggested promotion: commit to the main repo at \`${relPath}\`.`;

  return [
    "## Worktree orphan detected",
    "",
    `**File:** \`${relPath}\``,
    `**Worktree:** \`${worktreeName}\` (\`${worktreePath}\`)`,
    `**Last commit in worktree:** ${lastCommitStr}`,
    "",
    `This file exists in the worktree but not in the main repo${promotionTarget === "vault" ? " or the canonical Obsidian vault" : ""}.`,
    "",
    promotionNote,
    "",
    "**Actions:**",
    "- Review the file and decide: promote, discard, or defer.",
    "- If promoting: merge/copy to the target location and close this issue.",
    "- If discarding: delete from the worktree and close this issue.",
    "- If deferring: comment with the reason and re-label.",
    "",
    `---`,
    `Generated by \`scripts/lint-worktree-orphan.ts\`.`,
  ].join("\n");
}

export function buildAggregateIssueBody(params: {
  orphans: OrphanFile[];
  worktreePath: string;
  worktreeName: string;
  lastCommitDate: string | null;
}): string {
  const { orphans, worktreePath, worktreeName, lastCommitDate } = params;
  const lastCommitStr = lastCommitDate ?? "unknown";

  const fileRows = orphans
    .map((o) => `| \`${o.relPath}\` | ${o.promotionTarget} |`)
    .join("\n");

  return [
    `## Worktree orphan aggregate: ${worktreeName}`,
    "",
    `**Worktree:** \`${worktreeName}\` (\`${worktreePath}\`)`,
    `**Last commit in worktree:** ${lastCommitStr}`,
    `**Total orphans:** ${orphans.length}`,
    "",
    `This worktree has ${orphans.length} files not present in the main repo or canonical vault.`,
    "",
    "| File | Promotion target |",
    "|---|---|",
    fileRows,
    "",
    "**Actions:** review each file and promote, discard, or defer.",
    "",
    `---`,
    `Generated by \`scripts/lint-worktree-orphan.ts\`.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Scan logic
// ---------------------------------------------------------------------------

export function scanWorktreeOrphans(params: {
  worktreePath: string;
  repoRoot: string;
  obsidianVaultPath: string;
  scopePatterns: readonly string[];
  excludeDirs: readonly string[];
  nowDate: string;
  stalenessThresholdDays: number;
}): WorktreeScanResult | null {
  const { worktreePath, repoRoot, obsidianVaultPath, scopePatterns, excludeDirs, nowDate, stalenessThresholdDays } =
    params;

  const worktreeName = path.basename(worktreePath);
  const lastCommitDate = getWorktreeLastCommitDate(worktreePath);

  if (!isStaleWorktree(lastCommitDate, nowDate, stalenessThresholdDays)) {
    return null; // active worktree — skip
  }

  const relPaths = getInScopeRelPaths(worktreePath, scopePatterns, excludeDirs);
  const orphans: OrphanFile[] = [];

  for (const relPath of relPaths) {
    // Check main repo
    const inMainRepo = fs.existsSync(path.join(repoRoot, relPath));
    if (inMainRepo) continue;

    // For vault-targetable paths also check the canonical Obsidian vault
    const promotionTarget = classifyPromotionTarget(relPath);
    if (promotionTarget === "vault" && obsidianVaultPath) {
      const vaultAbs = path.join(obsidianVaultPath, relPath);
      const inVault = fs.existsSync(vaultAbs);
      if (inVault) continue;
    }

    orphans.push({ relPath, promotionTarget });
  }

  return { worktreePath, worktreeName, lastCommitDate, orphans };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const nowDate = new Date().toISOString().slice(0, 10);
  const obsidianVaultPath = process.env.OBSIDIAN_VAULT_PATH?.trim() ?? "";

  if (!dryRun && !LINEAR_API_KEY) {
    throw new Error("LINEAR_API_KEY not set — set it or use --dry-run");
  }

  console.log(`lint-worktree-orphan ${nowDate}${dryRun ? " (dry-run)" : ""}`);

  // Enumerate all registered worktrees
  const wtRun = spawnSync("git", ["-C", REPO_ROOT, "worktree", "list", "--porcelain"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  if (wtRun.status !== 0 || !wtRun.stdout) {
    throw new Error(`git worktree list failed: ${(wtRun.stderr ?? "").trim()}`);
  }

  const worktrees = parseWorktreeList(wtRun.stdout);
  console.log(`found ${worktrees.length} worktree(s)`);

  const scanResults: WorktreeScanResult[] = [];

  for (const wt of worktrees) {
    if (wt.isMain) continue; // main worktree is the reference — skip

    const result = scanWorktreeOrphans({
      worktreePath: wt.path,
      repoRoot: REPO_ROOT,
      obsidianVaultPath,
      scopePatterns: ORPHAN_SCOPE_PATTERNS,
      excludeDirs: ORPHAN_EXCLUDE_DIRS,
      nowDate,
      stalenessThresholdDays: WORKTREE_STALENESS_DAYS,
    });

    if (result === null) {
      console.log(`${path.basename(wt.path)}: active (< ${WORKTREE_STALENESS_DAYS}d) — skipped`);
      continue;
    }

    if (result.orphans.length === 0) {
      console.log(`${result.worktreeName}: no orphans`);
      continue;
    }

    console.log(`${result.worktreeName}: ${result.orphans.length} orphan(s)`);
    for (const orphan of result.orphans) {
      console.log(`  - ${orphan.relPath} [${orphan.promotionTarget}]`);
    }
    scanResults.push(result);
  }

  if (scanResults.length === 0) {
    console.log("no orphans found — all clean");
    return;
  }

  if (dryRun) {
    console.log(`\ndry-run: would file ${scanResults.reduce((n, r) => n + (r.orphans.length > ORPHAN_AGGREGATE_THRESHOLD ? 1 : r.orphans.length), 0)} issue(s)`);
    return;
  }

  // File Linear issues
  const labelId = await ensureDriftScanLabelId();
  const backlogStateId = await resolveBacklogStateId();
  let issued = 0;
  let skipped = 0;

  for (const result of scanResults) {
    if (result.orphans.length > ORPHAN_AGGREGATE_THRESHOLD) {
      // Aggregate issue
      const title = buildAggregateIssueTitle(result.worktreeName);
      const existing = await findIssueByExactTitle(title);
      if (existing) {
        console.log(`aggregate issue already open (${existing}) for ${result.worktreeName} — skipping`);
        skipped++;
        continue;
      }
      const body = buildAggregateIssueBody({
        orphans: result.orphans,
        worktreePath: result.worktreePath,
        worktreeName: result.worktreeName,
        lastCommitDate: result.lastCommitDate,
      });
      const created = await createDriftIssue({ title, body, labelId, stateId: backlogStateId });
      console.log(`created ${created}: ${title}`);
      issued++;
    } else {
      // One issue per orphan
      for (const orphan of result.orphans) {
        const title = buildOrphanIssueTitle(orphan.relPath, result.worktreeName);
        const existing = await findIssueByExactTitle(title);
        if (existing) {
          console.log(`issue already open (${existing}) for ${orphan.relPath} — skipping`);
          skipped++;
          continue;
        }
        const body = buildOrphanIssueBody({
          relPath: orphan.relPath,
          worktreePath: result.worktreePath,
          worktreeName: result.worktreeName,
          lastCommitDate: result.lastCommitDate,
          promotionTarget: orphan.promotionTarget,
        });
        const created = await createDriftIssue({ title, body, labelId, stateId: backlogStateId });
        console.log(`created ${created}: ${title}`);
        issued++;
      }
    }
  }

  console.log(`\nlint-worktree-orphan complete — ${issued} issued, ${skipped} deduplicated`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`lint-worktree-orphan failed: ${message}`);
    process.exit(1);
  });
}
