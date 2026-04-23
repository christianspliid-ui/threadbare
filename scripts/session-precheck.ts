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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const RG_PROBE_FILE = "CLAUDE.md";
const RG_PROBE_PATTERN = "Session Workflow";
const RG_TIMEOUT_MS = 5_000;
const GIT_DRY_RUN_TIMEOUT_MS = 15_000;
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

    console.log("session-precheck summary");
    printProbe(ripgrep);
    printProbe(gitDryRun);
    printProbe(npmTestTiming);
    printProbe(computerUse);

    const fingerprint = [
      `rg=${ripgrep.status}`,
      `git=${gitDryRun.status}`,
      `test=${formatFingerprintTestValue(npmTestTiming)}`,
      `cu=${formatFingerprintComputerUse(computerUse)}`,
    ].join(" ");
    console.log(`fingerprint ${fingerprint}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`session-precheck encountered an unexpected error: ${message}`);
    console.log("fingerprint rg=unknown git=unknown test=unknown cu=unknown");
  }

  process.exit(0);
}

main();
