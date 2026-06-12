#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type Severity = "error" | "warn";

type Finding = {
  check: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
};

type LinearIssueSummary = {
  identifier: string;
  title: string;
  createdAt?: string;
  description?: string;
  project?: { id?: string; name?: string } | null;
  comments?: { nodes?: Array<{ body?: string | null }> } | null;
};

type ReadyForDevIssue = {
  identifier: string;
  title: string;
  comments?: { nodes?: Array<{ body?: string | null; createdAt?: string; updatedAt?: string }> } | null;
};

const DEFAULT_LINEAR_LOOKBACK_DAYS = 14;
const TODO_PATTERN = /\/\/\s*TODO\(/;
const TODO_WITH_THR_PATTERN = /\/\/\s*TODO\((THR-\d+)\)/i;
const DEFERRED_PATTERN = /\/\/\s*(DEFERRED|PHASE-X-DEFERRED)\b/i;
const THR_PATTERN = /\bTHR-\d+\b/i;
const PLAN_FILE_PATTERN = /^Docs\/plans\/.+\.md$/i;
const PLAN_INLINE_LINEAR_PATTERN =
  /(Linear:\s*THR-\d+)|(https:\/\/linear\.app\/threadbare\/issue\/THR-\d+)/i;
const REQUIRED_HANDOFF_KEYWORDS = ["Suggested model", "Parallel-safe with", "Mutex with"] as const;
const LINEAR_GQL_ENDPOINT = "https://api.linear.app/graphql";
const NOW_MS = Date.now();
const TODO_CHECK_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".java",
  ".swift",
]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings: Finding[] = [];
const NPM_EXECUTABLE = process.execPath;
const NPM_RUNNER = process.env.npm_execpath;

function addFinding(finding: Finding): void {
  findings.push(finding);
}

function normalizeRepoPath(value: string): string {
  return value.trim().replaceAll("\\", "/");
}

function runGit(args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function safeRunGit(args: string[]): string {
  try {
    return runGit(args);
  } catch {
    return "";
  }
}

function parsePorcelainLine(rawLine: string): string[] {
  if (!rawLine || rawLine.length < 4) return [];
  const payload = rawLine.slice(3).trim();
  if (!payload) return [];
  if (payload.includes(" -> ")) {
    const parts = payload.split(" -> ");
    const target = parts[parts.length - 1];
    return [normalizeRepoPath(target)];
  }
  return [normalizeRepoPath(payload)];
}

function parseNewlinePaths(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => normalizeRepoPath(line))
    .filter((line) => line.length > 0);
}

function collectCandidateFiles(): string[] {
  const staged = parseNewlinePaths(safeRunGit(["diff", "--name-only", "--cached", "--diff-filter=ACMR"]));
  if (staged.length > 0) {
    return staged;
  }

  const porcelain = safeRunGit(["status", "--porcelain"]);
  const statusPaths = porcelain
    .split(/\r?\n/)
    .flatMap((line) => parsePorcelainLine(line))
    .filter((line) => line.length > 0);
  if (statusPaths.length > 0) {
    return statusPaths;
  }

  const lastCommitPaths = parseNewlinePaths(
    safeRunGit(["diff-tree", "--no-commit-id", "--name-only", "-r", "--diff-filter=ACMR", "HEAD"]),
  );
  if (lastCommitPaths.length > 0) {
    return lastCommitPaths;
  }

  return parseNewlinePaths(safeRunGit(["show", "--pretty=", "--name-only", "--diff-filter=ACMR", "HEAD"]));
}

function collectOverrideFiles(): string[] {
  const raw = process.env.PROCESS_CHECK_FILES?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => normalizeRepoPath(part))
    .filter((part) => part.length > 0);
}

function isReadableTextFile(absPath: string): boolean {
  try {
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) {
      return false;
    }
    const buf = fs.readFileSync(absPath);
    // Fast binary sniff: null-byte presence.
    return !buf.includes(0);
  } catch {
    return false;
  }
}

function readFileLines(absPath: string): string[] {
  return fs.readFileSync(absPath, "utf8").split(/\r?\n/);
}

function checkTodoAndDeferredReferences(files: string[]): void {
  for (const relPath of files) {
    const ext = path.extname(relPath).toLowerCase();
    if (!TODO_CHECK_EXTENSIONS.has(ext)) continue;
    const absPath = path.join(repoRoot, relPath);
    if (!isReadableTextFile(absPath)) continue;
    const lines = readFileLines(absPath);
    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      if (TODO_PATTERN.test(line) && !TODO_WITH_THR_PATTERN.test(line)) {
        addFinding({
          check: "todo-ref",
          severity: "error",
          file: relPath,
          line: lineNo,
          message: "TODO comment must include TODO(THR-XXX).",
        });
      }
      if (DEFERRED_PATTERN.test(line) && !THR_PATTERN.test(line)) {
        addFinding({
          check: "deferred-ref",
          severity: "error",
          file: relPath,
          line: lineNo,
          message: "DEFERRED marker must include THR-XXX reference on the same line.",
        });
      }
    });
  }
}

function checkPlanFilesForInlineLinearLinks(files: string[]): string[] {
  const unresolvedPlanFiles: string[] = [];
  for (const relPath of files) {
    if (!PLAN_FILE_PATTERN.test(relPath)) continue;
    const absPath = path.join(repoRoot, relPath);
    if (!isReadableTextFile(absPath)) continue;
    const text = fs.readFileSync(absPath, "utf8");
    if (!PLAN_INLINE_LINEAR_PATTERN.test(text)) {
      unresolvedPlanFiles.push(relPath);
    }
  }
  return unresolvedPlanFiles;
}

function toRelativeAgeMs(createdAt?: string): number {
  if (!createdAt) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return NOW_MS - parsed;
}

async function linearGql<T>(apiKey: string, query: string): Promise<T> {
  const response = await fetch(LINEAR_GQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Linear API HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (payload.errors && payload.errors.length > 0) {
    const joined = payload.errors.map((error) => error.message ?? "unknown error").join("; ");
    throw new Error(`Linear API GraphQL error: ${joined}`);
  }
  if (!payload.data) {
    throw new Error("Linear API returned no data payload.");
  }
  return payload.data;
}

function issueMatchesPlanReference(issue: LinearIssueSummary, planPath: string): boolean {
  const baseName = path.basename(planPath);
  const corpus = [
    issue.identifier,
    issue.title,
    issue.description ?? "",
    ...(issue.comments?.nodes?.map((node) => node.body ?? "") ?? []),
  ]
    .join("\n")
    .toLowerCase();
  return corpus.includes(planPath.toLowerCase()) || corpus.includes(baseName.toLowerCase());
}

function chooseLatestComment(comments: Array<{ body?: string | null; createdAt?: string; updatedAt?: string }>): string {
  if (comments.length === 0) return "";
  const sorted = [...comments].sort((a, b) => {
    const aTs = Date.parse(a.updatedAt || a.createdAt || "1970-01-01T00:00:00.000Z");
    const bTs = Date.parse(b.updatedAt || b.createdAt || "1970-01-01T00:00:00.000Z");
    return bTs - aTs;
  });
  return sorted[0]?.body ?? "";
}

async function runLinearChecks(planFilesMissingInlineRef: string[]): Promise<void> {
  const apiKey = process.env.LINEAR_API_KEY?.trim();
  if (!apiKey) {
    addFinding({
      check: "linear-auth",
      severity: "warn",
      message:
        "LINEAR_API_KEY is unset; skipped Linear-backed checks (recent plan references, orphan issues, Ready-for-Dev handoff keywords).",
    });
    for (const planFile of planFilesMissingInlineRef) {
      addFinding({
        check: "plan-linear-link",
        severity: "warn",
        file: planFile,
        line: 1,
        message:
          "Plan file has no inline Linear reference; skipped fallback validation against recent Linear issues because LINEAR_API_KEY is unavailable.",
      });
    }
    return;
  }

  const lookbackWindowDays = Number.parseInt(
    process.env.PROCESS_CHECK_LINEAR_LOOKBACK_DAYS ?? `${DEFAULT_LINEAR_LOOKBACK_DAYS}`,
    10,
  );
  const lookbackDays = Number.isFinite(lookbackWindowDays) && lookbackWindowDays > 0
    ? lookbackWindowDays
    : DEFAULT_LINEAR_LOOKBACK_DAYS;
  const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
  const lookbackFilter = `-P${lookbackDays}D`;

  const recentIssuesQuery = `
    query ProcessRecentIssues {
      issues(first: 250, filter: { createdAt: { gte: "${lookbackFilter}" } }) {
        nodes {
          identifier
          title
          createdAt
          description
          project { id name }
          comments(first: 10) {
            nodes { body }
          }
        }
      }
    }
  `;
  const readyForDevQuery = `
    query ProcessReadyForDevIssues {
      issues(first: 250, filter: { state: { name: { eq: "Ready for Dev" } } }) {
        nodes {
          identifier
          title
          comments(first: 50) {
            nodes {
              body
              createdAt
              updatedAt
            }
          }
        }
      }
    }
  `;

  let recentIssueNodes: LinearIssueSummary[] = [];
  let readyForDevIssueNodes: ReadyForDevIssue[] = [];

  try {
    const recentIssueData = await linearGql<{ issues?: { nodes?: LinearIssueSummary[] } }>(
      apiKey,
      recentIssuesQuery,
    );
    recentIssueNodes = recentIssueData.issues?.nodes ?? [];
  } catch (error) {
    addFinding({
      check: "linear-recent-issues",
      severity: "warn",
      message: `Unable to run recent-issues check against Linear: ${(error as Error).message}`,
    });
  }

  try {
    const readyIssueData = await linearGql<{ issues?: { nodes?: ReadyForDevIssue[] } }>(
      apiKey,
      readyForDevQuery,
    );
    readyForDevIssueNodes = readyIssueData.issues?.nodes ?? [];
  } catch (error) {
    addFinding({
      check: "linear-ready-for-dev",
      severity: "warn",
      message: `Unable to run Ready-for-Dev handoff check against Linear: ${(error as Error).message}`,
    });
  }

  if (recentIssueNodes.length > 0) {
    const orphanIssues = recentIssueNodes.filter((issue) => {
      const ageMs = toRelativeAgeMs(issue.createdAt);
      return ageMs <= lookbackMs && !issue.project?.id;
    });
    for (const issue of orphanIssues) {
      addFinding({
        check: "linear-project-assignment",
        severity: "error",
        message: `${issue.identifier} (${issue.title}) has no project assignment within the ${lookbackDays}-day window.`,
      });
    }
  }

  if (planFilesMissingInlineRef.length > 0) {
    for (const planFile of planFilesMissingInlineRef) {
      const hasRecentReference = recentIssueNodes.some((issue) => {
        const ageMs = toRelativeAgeMs(issue.createdAt);
        return ageMs <= lookbackMs && issueMatchesPlanReference(issue, planFile);
      });
      if (!hasRecentReference) {
        addFinding({
          check: "plan-linear-link",
          severity: "error",
          file: planFile,
          line: 1,
          message:
            `No inline Linear reference and no recent Linear issue mention found within ${lookbackDays} days.`,
        });
      }
    }
  }

  for (const issue of readyForDevIssueNodes) {
    const comments = issue.comments?.nodes ?? [];
    const latestBody = chooseLatestComment(comments);
    if (!latestBody) {
      addFinding({
        check: "handoff-keywords",
        severity: "error",
        message: `${issue.identifier} (${issue.title}) has no comments; latest handoff must include coordination keywords.`,
      });
      continue;
    }
    const missingKeywords = REQUIRED_HANDOFF_KEYWORDS.filter((keyword) => !latestBody.includes(keyword));
    if (missingKeywords.length > 0) {
      addFinding({
        check: "handoff-keywords",
        severity: "error",
        message:
          `${issue.identifier} (${issue.title}) latest comment missing required keyword(s): ${missingKeywords.join(", ")}.`,
      });
    }
  }
}

function printFindingsAndExit(): never {
  const errors = findings.filter((finding) => finding.severity === "error");
  const warns = findings.filter((finding) => finding.severity === "warn");

  if (findings.length === 0) {
    console.log("check:process passed (no findings).");
    process.exit(0);
  }

  const printOne = (finding: Finding): void => {
    const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "global";
    const level = finding.severity.toUpperCase();
    console.log(`[${level}] ${finding.check} ${location} ${finding.message}`);
  };

  errors.forEach(printOne);
  warns.forEach(printOne);

  if (errors.length > 0) {
    console.log(`check:process failed with ${errors.length} error(s) and ${warns.length} warning(s).`);
    process.exit(1);
  }

  console.log(`check:process passed with ${warns.length} warning(s).`);
  process.exit(0);
}

async function main(): Promise<void> {
  const overrideFiles = collectOverrideFiles();
  const files = (overrideFiles.length > 0 ? overrideFiles : collectCandidateFiles())
    .map((file) => normalizeRepoPath(file))
    .filter((file, idx, arr) => file.length > 0 && arr.indexOf(file) === idx)
    .filter((file) => fs.existsSync(path.join(repoRoot, file)));

  if (files.length === 0) {
    console.log("check:process skipped (no candidate files found).");
    process.exit(0);
  }

  checkTodoAndDeferredReferences(files);
  const unresolvedPlanFiles = checkPlanFilesForInlineLinearLinks(files);
  await runLinearChecks(unresolvedPlanFiles);
  if (!NPM_RUNNER) {
    addFinding({
      check: "lint-plan-doc",
      severity: "warn",
      message: "npm_execpath is unavailable; skipped nested lint:plan-doc invocation.",
    });
    printFindingsAndExit();
  }

  execFileSync(NPM_EXECUTABLE, [NPM_RUNNER, "run", "lint:plan-doc", "--", "--staged"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  printFindingsAndExit();
}

void main();
