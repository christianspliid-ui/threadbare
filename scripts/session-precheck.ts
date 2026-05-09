#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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

type FreshnessStatus = "current" | "detached" | "unknown" | `ahead:${number}` | `behind:${number}` | `stale-branch:${number}h` | `behind:${number}+stale-branch:${number}h`;

type FreshnessProbeResult = ProbeResult & {
  freshness: FreshnessStatus;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const RG_PROBE_FILE = "CLAUDE.md";
const RG_PROBE_PATTERN = "Session Workflow";
const RG_TIMEOUT_MS = 5_000;
const GIT_DRY_RUN_TIMEOUT_MS = 15_000;
const GIT_FETCH_TIMEOUT_MS = 10_000;
const GIT_REVLIST_TIMEOUT_MS = 5_000;
const STALENESS_BEHIND_THRESHOLD = 5;
const STALENESS_BRANCH_AGE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const NPM_TEST_TIMEOUT_MS = 120_000;

const TEST_PROBE_FILE_CANDIDATES = [
  "src/testing/__tests__/contentInvariants.test.ts",
  "src/__tests__/debug-bridge.test.ts",
  "src/data/__tests__/encounter-content.test.ts",
] as const;

const COMPUTER_USE_TRUE_VALUES = new Set(["1", "true", "yes", "enabled", "granted", "read"]);
const COMPUTER_USE_FALSE_VALUES = new Set(["0", "false", "no", "disabled", "denied", "none"]);
const COMPUTER_USE_ENV_CANDIDATES = [
  "CODEX_COMPUTER_USE",
  "CODEX_COMPUTER_USE_GRANTED",
  "CODEX_CUA_ENABLED",
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

function parseCommitCount(raw: string): number | null {
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  return Number.parseInt(normalized, 10);
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

  const originator = process.env.CODEX_INTERNAL_ORIGINATOR_OVERRIDE;
  if (originator) {
    return {
      name: "cu",
      status: "unknown",
      detail: `originator=${originator}; no explicit computer-use env flag`,
    };
  }

  return {
    name: "cu",
    status: "unknown",
    detail: "no computer-use grant signal found in environment",
  };
}

function isWorktreeCheckout(): boolean {
  try {
    const gitPath = path.join(REPO_ROOT, ".git");
    const stat = fs.statSync(gitPath);
    if (!stat.isFile()) {
      return false;
    }
    const contents = fs.readFileSync(gitPath, "utf8");
    const match = contents.match(/gitdir:\s*(.+)/i);
    if (!match?.[1]) {
      return false;
    }
    const gitDir = match[1].trim();
    return gitDir.includes("/worktrees/") || gitDir.includes("\\worktrees\\");
  } catch {
    return false;
  }
}

function parseBranchTimestamp(isoTimestamp: string): number | null {
  const parsed = Date.parse(isoTimestamp.trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function formatFreshnessBranchAgeHours(nowMs: number, branchTimestampMs: number): number {
  return Math.max(0, Math.floor((nowMs - branchTimestampMs) / (60 * 60 * 1000)));
}

type BranchStalenessOptions = {
  nowMs?: number;
  runCommandFn?: typeof runCommand;
  worktreeCheckout?: boolean;
};

export function probeBranchStaleness(options: BranchStalenessOptions = {}): FreshnessProbeResult {
  const run = options.runCommandFn ?? runCommand;
  const nowMs = options.nowMs ?? Date.now();
  const worktreeCheckout = options.worktreeCheckout ?? isWorktreeCheckout();

  const fetchResult = run(
    GIT_EXECUTABLE,
    ["fetch", "origin", "--quiet"],
    GIT_FETCH_TIMEOUT_MS,
    { GIT_TERMINAL_PROMPT: "0" },
  );
  if (!fetchResult.ok) {
    const detail = fetchResult.timedOut
      ? `git fetch origin timed out after ${formatSeconds(fetchResult.durationMs)}`
      : firstLine(fetchResult.stderr) || firstLine(fetchResult.error ?? "") || "git fetch origin failed";
    return {
      name: "freshness",
      status: "unknown",
      durationMs: fetchResult.durationMs,
      detail,
      freshness: "unknown",
    };
  }

  const branchResult = run(GIT_EXECUTABLE, ["rev-parse", "--abbrev-ref", "HEAD"], GIT_REVLIST_TIMEOUT_MS);
  if (!branchResult.ok) {
    const detail = firstLine(branchResult.stderr) || firstLine(branchResult.error ?? "") || "unable to resolve current branch";
    return {
      name: "freshness",
      status: "unknown",
      durationMs: branchResult.durationMs,
      detail,
      freshness: "unknown",
    };
  }
  const branchName = firstLine(branchResult.stdout);
  if (!branchName) {
    return {
      name: "freshness",
      status: "unknown",
      durationMs: branchResult.durationMs,
      detail: "unable to resolve current branch",
      freshness: "unknown",
    };
  }
  if (branchName === "HEAD") {
    return {
      name: "freshness",
      status: "unknown",
      durationMs: branchResult.durationMs,
      detail: "detached HEAD",
      freshness: "detached",
    };
  }

  const behindResult = run(GIT_EXECUTABLE, ["rev-list", "--count", "HEAD..origin/main"], GIT_REVLIST_TIMEOUT_MS);
  if (!behindResult.ok) {
    const detail = firstLine(behindResult.stderr) || firstLine(behindResult.error ?? "") || "unable to compute behind count";
    return {
      name: "freshness",
      status: "unknown",
      durationMs: behindResult.durationMs,
      detail,
      freshness: "unknown",
    };
  }
  const aheadResult = run(GIT_EXECUTABLE, ["rev-list", "--count", "origin/main..HEAD"], GIT_REVLIST_TIMEOUT_MS);
  if (!aheadResult.ok) {
    const detail = firstLine(aheadResult.stderr) || firstLine(aheadResult.error ?? "") || "unable to compute ahead count";
    return {
      name: "freshness",
      status: "unknown",
      durationMs: aheadResult.durationMs,
      detail,
      freshness: "unknown",
    };
  }

  const behindCount = parseCommitCount(behindResult.stdout);
  const aheadCount = parseCommitCount(aheadResult.stdout);
  if (behindCount === null || aheadCount === null) {
    return {
      name: "freshness",
      status: "unknown",
      detail: "unable to parse git rev-list counts",
      freshness: "unknown",
    };
  }

  let branchAgeHours = 0;
  let staleBranch = false;
  if (branchName !== "main") {
    let branchTipResult = run(GIT_EXECUTABLE, ["log", "-1", "--format=%cI", `origin/${branchName}`], GIT_REVLIST_TIMEOUT_MS);
    if (!branchTipResult.ok) {
      branchTipResult = run(GIT_EXECUTABLE, ["log", "-1", "--format=%cI", "HEAD"], GIT_REVLIST_TIMEOUT_MS);
    }
    if (!branchTipResult.ok) {
      const detail = firstLine(branchTipResult.stderr) || firstLine(branchTipResult.error ?? "") || `unable to read branch tip timestamp for ${branchName}`;
      return {
        name: "freshness",
        status: "unknown",
        durationMs: branchTipResult.durationMs,
        detail,
        freshness: "unknown",
      };
    }
    const branchTimestampMs = parseBranchTimestamp(firstLine(branchTipResult.stdout));
    if (branchTimestampMs === null) {
      return {
        name: "freshness",
        status: "unknown",
        detail: `unable to parse origin/${branchName} branch timestamp`,
        freshness: "unknown",
      };
    }
    branchAgeHours = formatFreshnessBranchAgeHours(nowMs, branchTimestampMs);
    staleBranch = !worktreeCheckout && branchAgeHours * 60 * 60 * 1000 >= STALENESS_BRANCH_AGE_THRESHOLD_MS;
  }

  const isBehindThreshold = behindCount >= STALENESS_BEHIND_THRESHOLD;
  if (isBehindThreshold && staleBranch) {
    return {
      name: "freshness",
      status: "no",
      detail: `on ${branchName}, behind by ${behindCount}; branch age ${branchAgeHours}h and not a worktree`,
      freshness: `behind:${behindCount}+stale-branch:${branchAgeHours}h`,
    };
  }
  if (isBehindThreshold) {
    return {
      name: "freshness",
      status: "no",
      detail: `on ${branchName}, behind by ${behindCount} — pull main before designing`,
      freshness: `behind:${behindCount}`,
    };
  }
  if (staleBranch) {
    return {
      name: "freshness",
      status: "no",
      detail: `on ${branchName} (age ${branchAgeHours}h, not a worktree) — likely a stale closeout branch`,
      freshness: `stale-branch:${branchAgeHours}h`,
    };
  }
  if (aheadCount > 0) {
    return {
      name: "freshness",
      status: "yes",
      detail: `on ${branchName}, ahead by ${aheadCount}`,
      freshness: `ahead:${aheadCount}`,
    };
  }
  if (behindCount > 0) {
    return {
      name: "freshness",
      status: "yes",
      detail: `on ${branchName}, behind by ${behindCount} (within threshold ${STALENESS_BEHIND_THRESHOLD})`,
      freshness: "current",
    };
  }
  return {
    name: "freshness",
    status: "yes",
    detail: branchName === "main" ? "on main, current" : `on ${branchName}, current`,
    freshness: "current",
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

function formatFingerprintFreshness(result: FreshnessProbeResult): string {
  return result.freshness;
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
    const branchStaleness = probeBranchStaleness();

    console.log("session-precheck summary");
    printProbe(ripgrep);
    printProbe(gitDryRun);
    printProbe(npmTestTiming);
    printProbe(computerUse);
    printProbe(branchStaleness);

    const fingerprint = [
      `rg=${ripgrep.status}`,
      `git=${gitDryRun.status}`,
      `test=${formatFingerprintTestValue(npmTestTiming)}`,
      `cu=${formatFingerprintComputerUse(computerUse)}`,
      `freshness=${formatFingerprintFreshness(branchStaleness)}`,
    ].join(" ");
    console.log(`fingerprint ${fingerprint}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`session-precheck encountered an unexpected error: ${message}`);
    console.log("fingerprint rg=unknown git=unknown test=unknown cu=unknown freshness=unknown");
  }

  process.exit(0);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}
