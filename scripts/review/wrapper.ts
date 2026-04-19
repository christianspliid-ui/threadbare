#!/usr/bin/env node
// CC review wrapper — process supervisor for subprocess-based reviews (THR-182)
//
// Usage: node wrapper.mjs <command> [args...]
//   e.g. node wrapper.mjs node review-client.mjs --diff git-diff.txt
//
// The subprocess must emit newline-delimited JSON to stdout:
//   Heartbeat: {"heartbeat":true,"elapsed_s":N,"step":"description"}
//   Findings:  {"verdict":"none|minor|major","summary":"...","findings":[...]}
//
// The wrapper writes a ReviewWrapperTrace to stdout on exit and saves it to
// .cowork/review-traces/<timestamp>.json

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { type ReviewWrapperTrace, type ReviewFindings, isHeartbeat, isFindings } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// All timeouts can be overridden via env vars for testing
const WALL_CLOCK_TIMEOUT_SEC = Number(process.env.REVIEW_WALL_CLOCK_TIMEOUT_SEC ?? 600);
const HEARTBEAT_INTERVAL_SEC = Number(process.env.REVIEW_HEARTBEAT_INTERVAL_SEC ?? 60);
const SIGTERM_GRACE_SEC = Number(process.env.REVIEW_SIGTERM_GRACE_SEC ?? 10);
const CANCEL_GRACE_SEC = Number(process.env.REVIEW_CANCEL_GRACE_SEC ?? 5);
const WRAPPER_VERSION = '1.0.0';

const TRACE_DIR = join(REPO_ROOT, '.cowork', 'review-traces');
const PARTIAL_DIR = join(REPO_ROOT, '.cowork', 'review-partial');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function nowISO(): string {
  return new Date().toISOString();
}

function elapsedSec(startMs: number): number {
  return Math.round((Date.now() - startMs) / 1000);
}

function tryParseJSON(line: string): unknown {
  try { return JSON.parse(line); } catch { return null; }
}

async function run(): Promise<void> {
  const [, , ...cmdArgs] = process.argv;

  if (!cmdArgs.length) {
    process.stderr.write('Usage: node wrapper.mjs <command> [args...]\n');
    process.exit(1);
  }

  ensureDir(TRACE_DIR);
  ensureDir(PARTIAL_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const partialPath = join(PARTIAL_DIR, `${timestamp}.log`);
  const tracePath = join(TRACE_DIR, `${timestamp}.json`);

  const started_at = nowISO();
  const startMs = Date.now();

  const [command, ...args] = cmdArgs;
  let heartbeatCount = 0;
  let lastHeartbeatAt: string | null = null;
  let partialLines: string[] = [];
  let foundFindings: ReviewFindings | null = null;
  let outcome: ReviewWrapperTrace['outcome'] = 'wrapper-crash';
  let exitCode: number | null = null;

  process.stderr.write(`[review-wrapper] starting subprocess: ${command} ${args.join(' ')}\n`);
  process.stderr.write(`[review-wrapper] wall-clock timeout: ${WALL_CLOCK_TIMEOUT_SEC}s, heartbeat interval: ${HEARTBEAT_INTERVAL_SEC}s\n`);

  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  let heartbeatCheckTimer: ReturnType<typeof setInterval> | null = null;
  let wallClockTimer: ReturnType<typeof setTimeout> | null = null;
  let lastHeartbeatMs = startMs;
  let killInProgress = false;

  function cleanup(): void {
    if (heartbeatCheckTimer) { clearInterval(heartbeatCheckTimer); heartbeatCheckTimer = null; }
    if (wallClockTimer) { clearTimeout(wallClockTimer); wallClockTimer = null; }
  }

  function killChild(reason: ReviewWrapperTrace['outcome']): void {
    if (killInProgress) return;
    killInProgress = true;
    outcome = reason;
    cleanup();
    process.stderr.write(`[review-wrapper] killing subprocess (reason: ${reason})\n`);
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
        process.stderr.write('[review-wrapper] SIGKILL sent after grace period\n');
      }
    }, SIGTERM_GRACE_SEC * 1000);
  }

  // Wall-clock timeout
  wallClockTimer = setTimeout(() => {
    process.stderr.write(`[review-wrapper] wall-clock timeout (${WALL_CLOCK_TIMEOUT_SEC}s)\n`);
    killChild('wall-clock-timeout');
  }, WALL_CLOCK_TIMEOUT_SEC * 1000);

  // Heartbeat watchdog — fires every 10s, checks last heartbeat age
  heartbeatCheckTimer = setInterval(() => {
    const gapSec = (Date.now() - lastHeartbeatMs) / 1000;
    if (gapSec > HEARTBEAT_INTERVAL_SEC) {
      process.stderr.write(`[review-wrapper] heartbeat missed (${Math.round(gapSec)}s since last)\n`);
      killChild('heartbeat-timeout');
    }
  }, 10_000);

  // Collect stdout line-by-line
  let stdoutBuf = '';
  child.stdout.on('data', (chunk: Buffer) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      partialLines.push(line);

      const parsed = tryParseJSON(line);
      if (parsed) {
        if (isHeartbeat(parsed)) {
          heartbeatCount++;
          lastHeartbeatAt = nowISO();
          lastHeartbeatMs = Date.now();
          process.stderr.write(
            `[review-wrapper] ♥ heartbeat #${heartbeatCount} at ${parsed.elapsed_s}s — ${parsed.step}\n`
          );
        } else if (isFindings(parsed)) {
          foundFindings = parsed;
          process.stderr.write(
            `[review-wrapper] findings received: verdict=${parsed.verdict} (${parsed.findings.length} items)\n`
          );
        }
      }
    }
  });

  // Forward stderr from subprocess
  child.stderr.on('data', (chunk: Buffer) => {
    process.stderr.write(chunk);
  });

  // Handle user cancellation
  process.on('SIGINT', () => {
    process.stderr.write('\n[review-wrapper] user cancelled (SIGINT)\n');
    killInProgress = true;
    outcome = 'user-cancel';
    cleanup();
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
      finalise();
      process.exit(130);
    }, CANCEL_GRACE_SEC * 1000);
  });

  await new Promise<void>((resolve) => {
    child.on('close', (code: number | null) => {
      if (!killInProgress) {
        cleanup();
        exitCode = code;
        if (code === 0) {
          outcome = 'clean';
        } else {
          outcome = 'nonzero-exit';
        }
      } else {
        exitCode = code;
      }
      resolve();
    });
  });

  function finalise(): ReviewWrapperTrace {
    const ended_at = nowISO();

    // Save partial output
    let savedPartialPath: string | null = null;
    if (partialLines.length > 0) {
      writeFileSync(partialPath, partialLines.join('\n') + '\n', 'utf-8');
      savedPartialPath = partialPath;
    }

    const commitTrailer = outcome === 'clean' && foundFindings && foundFindings.verdict !== 'major'
      ? 'review:ok'
      : outcome === 'clean' && foundFindings?.verdict === 'major'
        ? 'review:major-findings'
        : outcome === 'user-cancel'
          ? null
          : `review:skipped:${outcome}`;

    // Save findings if present
    let findingsPath: string | null = null;
    if (foundFindings) {
      const fp = join(TRACE_DIR, `${timestamp}-findings.json`);
      writeFileSync(fp, JSON.stringify(foundFindings, null, 2), 'utf-8');
      findingsPath = fp;
    }

    const trace: ReviewWrapperTrace = {
      type: 'review-wrapper',
      wrapperVersion: WRAPPER_VERSION,
      started_at,
      ended_at,
      outcome,
      exit_code: exitCode,
      elapsed_s: elapsedSec(startMs),
      last_heartbeat_at: lastHeartbeatAt,
      heartbeat_count: heartbeatCount,
      partial_output_path: savedPartialPath,
      findings_path: findingsPath,
      commit_trailer: commitTrailer,
      findings: foundFindings,
    };

    writeFileSync(tracePath, JSON.stringify(trace, null, 2), 'utf-8');
    process.stdout.write(JSON.stringify(trace) + '\n');

    process.stderr.write(
      `[review-wrapper] done — outcome=${outcome} elapsed=${trace.elapsed_s}s trailer=${commitTrailer ?? 'none'}\n`
    );
    process.stderr.write(`[review-wrapper] trace saved to ${tracePath}\n`);

    return trace;
  }

  const trace = finalise();

  const exitWithCode = trace.outcome === 'clean' ? 0 : 1;
  process.exit(exitWithCode);
}

run().catch((err) => {
  process.stderr.write(`[review-wrapper] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
