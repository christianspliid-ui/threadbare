#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildHealthReport,
  formatHealthFingerprint,
  type HealthReport,
} from "./node-modules-health.ts";

type ProbeStatus = "yes" | "no" | "unknown";

type ProbeResult = {
  name: string;
  status: ProbeStatus;
  detail: string;
  durationMs?: number;
};

type CommandResult = {
  ok: boolean;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
};

type CommandRunner = (
  command: string,
  args: string[],
  timeoutMs: number,
  extraEnv?: Record<string, string>,
) => CommandResult;

type DotGitReader = () => string | null;

export type BranchStalenessResult = ProbeResult & {
  freshnessKey: string;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const RG_PROBE_FILE = "CLAUDE.md";
const RG_PROBE_PATTERN = "Session Workflow";
const RG_TIMEOUT_MS = 5_000;
const GIT_DRY_RUN_TIMEOUT_MS = 15_000;
const NPM_TEST_TIMEOUT_MS = 120_000;

export const STALENESS_BEHIND_THRESHOLD = 5;
export const STALENESS_BRANCH_AGE_THRESHOLD_MS = 24 * 3600 * 1000;
const GIT_FETCH_TIMEOUT_MS = 10_000;
const GIT_REVLIST_TIMEOUT_MS = 5_000;

const TEST_PROBE_FILE_CANDIDATES = [
  "src/testing/__tests__/contentInvariants.test.ts",
  "src/__tests__/debug-bridge.test.ts",
  "src/data/__tests__/encounter-content.test.ts",
] as const;

const COMPUTER_USE_TRUE_VALUES = new Set(["1", "true", "yes", "enabled", "granted", "read"]);
const COMPUTER_USE_FALSE_VALUES = new Set(["0", "false", "no", "disabled", "denied", "none"]);
const COMPUTER_USE_ENV_CANDIDATES = [
  "OPENAI_COMPUTER_USE",
  "OPENAI_CUA_ENABLED",
] as const;

const WINDOWS_CMD_EXECUTABLE = "cmd.exe";
const DEFAULT_NPM_EXECUTABLE = "npm";
const WINDOWS_RG_EXECUTABLE = "rg.exe";
const DEFAULT_RG_EXECUTABLE = "rg";
const GIT_EXECUTABLE = "git";

function runCommand(
  command: string,
  args: string[],
  timeoutMs: number,
  extraEnv: Record<string, string> = {},
): CommandResult {
  const startMs = Date.now();
  const child = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
  const durationMs = Date.now() - startMs;
  const stdout = (child.stdout ?? "").toString().trim();
  const stderr = (child.stderr ?? "").toString().trim();
  const timedOut = child.error?.name === "ETIMEDOUT";
  const ok = child.status === 0 && !timedOut && !child.error;
  const error = child.error?.message;

  return {
    ok,
    timedOut,
    durationMs,
    stdout,
    stderr,
    error,
  };
}

function firstLine(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const lines = trimmed.split(/\r?\n/);
  return lines[0] ?? "";
}

function formatSeconds(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function probeRipgrepAvailability(): ProbeResult {
  const executable = process.platform === "win32" ? WINDOWS_RG_EXECUTABLE : DEFAULT_RG_EXECUTABLE;
  const result = runCommand(
    executable,
    ["--line-number", "--fixed-strings", RG_PROBE_PATTERN, RG_PROBE_FILE],
    RG_TIMEOUT_MS,
  );

  if (result.ok) {
    return {
      name: "rg",
      status: "yes",
      durationMs: result.durationMs,
      detail: `matched ${RG_PROBE_PATTERN} in ${RG_PROBE_FILE}`,
    };
  }

  const failureReason = result.timedOut
    ? `timed out after ${formatSeconds(result.durationMs)}`
    : firstLine(result.stderr) || firstLine(result.error ?? "") || "probe command failed";
  return {
    name: "rg",
    status: "no",
    durationMs: result.durationMs,
    detail: failureReason,
  };
}

function probeGitPushDryRun(): ProbeResult {
  const result = runCommand(
    GIT_EXECUTABLE,
    ["push", "--dry-run"],
    GIT_DRY_RUN_TIMEOUT_MS,
    { GIT_TERMINAL_PROMPT: "0" },
  );

  if (result.ok) {
    return {
      name: "git",
      status: "yes",
      durationMs: result.durationMs,
      detail: firstLine(result.stdout) || "git push --dry-run succeeded",
    };
  }

  const failureReason = result.timedOut
    ? `timed out after ${formatSeconds(result.durationMs)}`
    : firstLine(result.stderr) || firstLine(result.error ?? "") || "git push --dry-run failed";
  return {
    name: "git",
    status: "no",
    durationMs: result.durationMs,
    detail: failureReason,
  };
}

function resolveSingleTestFile(): string | null {
  for (const relativePath of TEST_PROBE_FILE_CANDIDATES) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (fs.existsSync(absolutePath)) {
      return relativePath;
    }
  }
  return null;
}

function probeNpmSingleTestTiming(): ProbeResult {
  const testFile = resolveSingleTestFile();
  if (!testFile) {
    return {
      name: "test",
      status: "unknown",
      detail: "no probe test file found",
    };
  }

  const result = process.platform === "win32"
    ? runCommand(
        WINDOWS_CMD_EXECUTABLE,
        ["/d", "/s", "/c", `npm test -- ${testFile}`],
        NPM_TEST_TIMEOUT_MS,
      )
    : runCommand(DEFAULT_NPM_EXECUTABLE, ["test", "--", testFile], NPM_TEST_TIMEOUT_MS);

  if (result.ok) {
    return {
      name: "test",
      status: "yes",
      durationMs: result.durationMs,
      detail: `${testFile} in ${formatSeconds(result.durationMs)}`,
    };
  }

  const failureReason = result.timedOut
    ? `${testFile} timed out after ${formatSeconds(result.durationMs)}`
    : firstLine(result.stderr) || firstLine(result.error ?? "") || `${testFile} failed`;
  return {
    name: "test",
    status: "no",
    durationMs: result.durationMs,
    detail: failureReason,
  };
}

function probeComputerUseGrantStatus(): ProbeResult {
  for (const envName of COMPUTER_USE_ENV_CANDIDATES) {
    const rawValue = process.env[envName];
    if (!rawValue) continue;
    const normalizedValue = rawValue.trim().toLowerCase();
    if (COMPUTER_USE_TRUE_VALUES.has(normalizedValue)) {
      return {
        name: "cu",
        status: "yes",
        detail: `${envName}=${rawValue}`,
      };
    }
    if (COMPUTER_USE_FALSE_VALUES.has(normalizedValue)) {
      return {
        name: "cu",
        status: "no",
        detail: `${envName}=${rawValue}`,
      };
    }
    return {
      name: "cu",
      status: "unknown",
      detail: `${envName}=${rawValue} (unrecognized value)`,
    };
  }

  return {
    name: "cu",
    status: "unknown",
    detail: "no computer-use grant signal found in environment",
  };
}

/**
 * `node_modules` health for this tree and the home-tree donor it junctions to (THR-1111).
 *
 * This probe exists because the `test:` line above **passes green against a broken
 * install** — it shells out to `npm test`, which resolves vitest through whichever
 * path happens to work, so a stub or shim-stripped tree can still answer `yes`.
 * CLAUDE.md § Known Sandbox Limitations says exactly that ("the session-precheck's
 * `test:` line passes green against a stub, so it is not a signal for install
 * health"), and until now nothing in the precheck answered the question it warns
 * about. A session therefore learned its install was gone ~20 minutes later, from
 * `'esbuild' is not recognized`, which reads as a missing dependency rather than as
 * a deleted install.
 *
 * The donor half is the load-bearing one: 53 of 478 reaper runs found the home tree's
 * install damaged, in streaks up to 18 hours, and every session starting inside such
 * a streak has no healthy tree to junction from (impediments #501/#502/#503/#506).
 */
function probeNodeModulesHealth(): ProbeResult & { report: HealthReport } {
  const startMs = Date.now();
  const report = buildHealthReport(REPO_ROOT);
  const durationMs = Date.now() - startMs;

  return {
    name: "nm",
    // `unknown` stays unknown rather than failing: an unreadable probe is not
    // evidence of damage, and a false alarm here sends a session into a needless
    // ~4-minute reinstall (NFP #4).
    status: report.degraded ? "no" : report.verdict === "unknown" ? "unknown" : "yes",
    durationMs,
    detail: report.summary,
    report,
  };
}

function defaultReadDotGit(): string | null {
  try {
    const gitPath = path.join(REPO_ROOT, ".git");
    const stat = fs.statSync(gitPath);
    // A worktree has .git as a FILE containing "gitdir: ..."; the main tree has .git as a directory
    if (stat.isFile()) {
      return fs.readFileSync(gitPath, "utf8");
    }
    return null;
  } catch {
    return null;
  }
}

export function probeBranchStaleness(
  runCmd: CommandRunner = runCommand,
  readDotGit: DotGitReader = defaultReadDotGit,
  nowMs: number = Date.now(),
): BranchStalenessResult {
  const startMs = Date.now();

  // Step 1: fetch to get accurate origin/main position
  const fetchResult = runCmd(GIT_EXECUTABLE, ["fetch", "origin", "--quiet"], GIT_FETCH_TIMEOUT_MS, {
    GIT_TERMINAL_PROMPT: "0",
  });
  if (!fetchResult.ok) {
    const detail = fetchResult.timedOut
      ? `git fetch timed out after ${formatSeconds(fetchResult.durationMs)}`
      : firstLine(fetchResult.stderr) || firstLine(fetchResult.error ?? "") || "git fetch failed";
    return {
      name: "freshness",
      status: "unknown",
      durationMs: Date.now() - startMs,
      detail,
      freshnessKey: "unknown",
    };
  }

  // Step 2: current branch name
  const branchResult = runCmd(GIT_EXECUTABLE, ["rev-parse", "--abbrev-ref", "HEAD"], GIT_REVLIST_TIMEOUT_MS);
  if (!branchResult.ok || !branchResult.stdout.trim()) {
    return {
      name: "freshness",
      status: "unknown",
      durationMs: Date.now() - startMs,
      detail: firstLine(branchResult.stderr) || "git rev-parse failed",
      freshnessKey: "unknown",
    };
  }
  const branch = branchResult.stdout.trim();

  if (branch === "HEAD") {
    // Parked off-branch. The only thing that matters is whether anything unique is
    // stranded here — a behind-count against origin/main is arithmetically true but
    // semantically false for a detached HEAD, and reading it as decay is what turned a
    // two-command repair into days of escalation (THR-671).
    const uniqueResult = runCmd(
      GIT_EXECUTABLE,
      ["rev-list", "--count", "origin/main..HEAD"],
      GIT_REVLIST_TIMEOUT_MS,
    );
    if (!uniqueResult.ok) {
      // Fail-soft: cannot prove the park is loss-free, so do not advertise the repair.
      return {
        name: "freshness",
        status: "unknown",
        durationMs: Date.now() - startMs,
        detail: "detached HEAD; could not count unique commits — inspect manually before any reset",
        freshnessKey: "detached",
      };
    }
    const uniqueCommits = parseInt(uniqueResult.stdout.trim(), 10) || 0;

    if (uniqueCommits > 0) {
      return {
        name: "freshness",
        status: "no",
        durationMs: Date.now() - startMs,
        detail:
          `parked off-branch with ${uniqueCommits} unique commit(s) — do NOT reset; ` +
          "run `git log origin/main..HEAD --oneline` and hand the SHAs to a session",
        freshnessKey: `parked-with-unique-commits:${uniqueCommits}`,
      };
    }

    return {
      name: "freshness",
      status: "no",
      durationMs: Date.now() - startMs,
      detail:
        "parked at an ancestor of origin/main, nothing unique stranded — safe repair: " +
        "`git stash push -m home-tree-recovery && git switch main && git pull --ff-only origin main`",
      freshnessKey: "parked-at-ancestor",
    };
  }

  // Step 3: commits behind origin/main
  const behindResult = runCmd(
    GIT_EXECUTABLE,
    ["rev-list", "--count", "HEAD..origin/main"],
    GIT_REVLIST_TIMEOUT_MS,
  );
  if (!behindResult.ok) {
    return {
      name: "freshness",
      status: "unknown",
      durationMs: Date.now() - startMs,
      detail: firstLine(behindResult.stderr) || firstLine(behindResult.error ?? "") || "git rev-list failed",
      freshnessKey: "unknown",
    };
  }
  const behind = parseInt(behindResult.stdout.trim(), 10) || 0;

  // Step 4: commits ahead of origin/main (best effort — failure is non-fatal)
  const aheadResult = runCmd(
    GIT_EXECUTABLE,
    ["rev-list", "--count", "origin/main..HEAD"],
    GIT_REVLIST_TIMEOUT_MS,
  );
  const ahead = aheadResult.ok ? (parseInt(aheadResult.stdout.trim(), 10) || 0) : 0;

  // Step 5+6: branch age and worktree detection (non-main branches only)
  let isStale = false;
  let branchAgeHours = 0;
  if (branch !== "main") {
    const dotGitContent = readDotGit();
    // Worktree: .git is a file whose first line starts with "gitdir:". Skip age check for worktrees.
    const isWorktree = dotGitContent !== null && dotGitContent.trim().startsWith("gitdir:");

    if (!isWorktree) {
      const logResult = runCmd(
        GIT_EXECUTABLE,
        ["log", "-1", "--format=%cI", `origin/${branch}`],
        GIT_REVLIST_TIMEOUT_MS,
      );
      if (logResult.ok && logResult.stdout.trim()) {
        const branchDate = new Date(logResult.stdout.trim());
        if (!isNaN(branchDate.getTime())) {
          const ageMs = nowMs - branchDate.getTime();
          branchAgeHours = Math.floor(ageMs / 3600_000);
          isStale = ageMs >= STALENESS_BRANCH_AGE_THRESHOLD_MS;
        }
      }
    }
  }

  const durationMs = Date.now() - startMs;
  const isBehind = behind >= STALENESS_BEHIND_THRESHOLD;

  if (isBehind && isStale) {
    return {
      name: "freshness",
      status: "no",
      durationMs,
      detail: `on ${branch}, behind by ${behind}, age ${branchAgeHours}h (not a worktree) — pull main and close stale branch`,
      freshnessKey: `behind:${behind}+stale-branch:${branchAgeHours}h`,
    };
  }

  if (isBehind) {
    return {
      name: "freshness",
      status: "no",
      durationMs,
      detail: `on ${branch}, behind by ${behind} — pull main before designing`,
      freshnessKey: `behind:${behind}`,
    };
  }

  if (isStale) {
    return {
      name: "freshness",
      status: "no",
      durationMs,
      detail: `on ${branch} (age ${branchAgeHours}h, not a worktree) — likely a stale closeout branch`,
      freshnessKey: `stale-branch:${branchAgeHours}h`,
    };
  }

  if (branch === "main" && ahead > 0) {
    return {
      name: "freshness",
      status: "yes",
      durationMs,
      detail: `on main, ${ahead} commit(s) ahead (not pushed)`,
      freshnessKey: `ahead:${ahead}`,
    };
  }

  if (behind > 0) {
    // Behind but below threshold — note it without warning
    return {
      name: "freshness",
      status: "yes",
      durationMs,
      detail: `on ${branch}, behind by ${behind}`,
      freshnessKey: `behind:${behind}`,
    };
  }

  return {
    name: "freshness",
    status: "yes",
    durationMs,
    detail: `on ${branch}, current`,
    freshnessKey: "current",
  };
}

function formatFingerprintTestValue(result: ProbeResult): string {
  if (result.status === "yes" && typeof result.durationMs === "number") {
    return formatSeconds(result.durationMs);
  }
  if (result.status === "no") {
    return "fail";
  }
  return "unknown";
}

function formatFingerprintComputerUse(result: ProbeResult): string {
  if (result.status === "yes") return "read";
  if (result.status === "no") return "none";
  return "unknown";
}

function printProbe(result: ProbeResult): void {
  const durationSuffix = typeof result.durationMs === "number" ? ` (${formatSeconds(result.durationMs)})` : "";
  console.log(`- ${result.name}: ${result.status}${durationSuffix} — ${result.detail}`);
}

function main(): void {
  try {
    const ripgrep = probeRipgrepAvailability();
    const gitDryRun = probeGitPushDryRun();
    const npmTestTiming = probeNpmSingleTestTiming();
    const computerUse = probeComputerUseGrantStatus();
    const nodeModules = probeNodeModulesHealth();
    const branchStaleness = probeBranchStaleness();

    console.log("session-precheck summary");
    printProbe(ripgrep);
    printProbe(gitDryRun);
    printProbe(npmTestTiming);
    printProbe(computerUse);
    printProbe(nodeModules);
    printProbe(branchStaleness);

    // A degraded install is the one precheck finding that invalidates the run's
    // later gates rather than merely colouring them, so it gets a line of its own
    // with the repair spelled out — not a fingerprint token a reader has to decode.
    if (nodeModules.report.degraded) {
      for (const tree of [nodeModules.report.session, nodeModules.report.donor]) {
        if (!tree || tree.verdict === "healthy" || tree.verdict === "unknown") continue;
        console.log(`!!!!! node_modules ${tree.verdict.toUpperCase()} in the ${tree.role} tree: ${tree.detail}`);
      }
    }

    const fingerprint = [
      `rg=${ripgrep.status}`,
      `git=${gitDryRun.status}`,
      `test=${formatFingerprintTestValue(npmTestTiming)}`,
      `cu=${formatFingerprintComputerUse(computerUse)}`,
      `nm=${formatHealthFingerprint(nodeModules.report)}`,
      `freshness=${branchStaleness.freshnessKey}`,
    ].join(" ");
    console.log(`fingerprint ${fingerprint}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`session-precheck encountered an unexpected error: ${message}`);
    console.log("fingerprint rg=unknown git=unknown test=unknown cu=unknown nm=unknown freshness=unknown");
  }

  process.exit(0);
}

// Only run when executed directly (not when imported by tests)
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
