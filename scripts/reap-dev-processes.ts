#!/usr/bin/env node

/**
 * Dev-process reaper: orphaned Vite servers and runaway Playwright browsers.
 *
 * ## What this closes
 *
 * The hourly git reaper (`clean-stale-git.sh`) tidies worktrees, branches and stashes,
 * and nothing tidied processes. On 2026-11-01 the host carried nine Vite dev servers
 * from sessions that had ended up to 33 hours earlier, plus a Playwright-controlled
 * Chrome left on a WebGL page. With no GPU, that Chrome drew the hex map on the CPU
 * (SwiftShader) with background throttling off: ~47% of all 32 threads, enough to make
 * video in Christian's own Chrome stutter.
 *
 * The servers also fed back into the git reaper. A running Vite holds its worktree
 * open, so `git worktree remove` failed with "in use?" and the dir kept reading as
 * recently active, so the worktree and its branch were kept, run after run.
 *
 * ## The two rules
 *
 * 1. **Orphaned Vite server** — a `vite/bin/vite.js` process under this repo whose
 *    launcher chain no longer reaches a live anchor (the Claude app, a terminal, an
 *    editor, Explorer, Task Scheduler). A session's `preview_start` runs Vite under a
 *    bash wrapper; when the session's process exits, the wrapper's parent is gone and
 *    nothing will ever stop the server. A server someone is using still has its
 *    session (or terminal) above it, so it is anchored and never touched.
 * 2. **Runaway Playwright browser** — a Chrome whose profile is a Playwright one
 *    (`ms-playwright` in the command line) burning more than
 *    {@link PLAYWRIGHT_HOT_CORES} cores across its process tree on
 *    {@link PLAYWRIGHT_HOT_STRIKES} consecutive runs (hourly, so about an hour of
 *    sustained burn). The browser belongs to the Claude app's Playwright MCP, not to a
 *    session, so no closeout ever closes it; the MCP relaunches one on its next call.
 *    One hot sample is never enough — a session verifying the map is hot too.
 *
 * NFP #1 (tunability): every threshold is a named constant, env-overridable.
 * NFP #2 (inspectability): one log line per process acted on or held, plus a summary.
 * NFP #4 (fail-soft): every probe degrades to "skipped"; exit code is always 0.
 *
 * Like `repair-donor-node-modules.ts`, this imports only `node:*` builtins so it runs
 * under `node --experimental-strip-types` with no install.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** A Vite server younger than this is left alone even when orphaned. */
export const VITE_ORPHAN_MIN_AGE_MINUTES = envNumber("VITE_ORPHAN_MIN_AGE_MINUTES", 60);
/** Cores a Playwright browser tree must average over the sample to count as hot. */
export const PLAYWRIGHT_HOT_CORES = envNumber("PLAYWRIGHT_HOT_CORES", 2);
/** Consecutive hot runs before the browser is closed. */
export const PLAYWRIGHT_HOT_STRIKES = envNumber("PLAYWRIGHT_HOT_STRIKES", 2);
/** CPU sample window between the two process snapshots. */
export const PROC_SAMPLE_SECONDS = envNumber("PROC_SAMPLE_SECONDS", 10);

/**
 * A live process with one of these names above a server means someone can still stop
 * it. Explorer's and the services' own parents are long dead, so the walk must stop
 * at an anchor rather than run to the top.
 */
export const ANCHOR_NAMES: ReadonlySet<string> = new Set([
  "claude.exe",
  "explorer.exe",
  "sihost.exe",
  "svchost.exe",
  "services.exe",
  "wininit.exe",
  "windowsterminal.exe",
  "openconsole.exe",
  "code.exe",
  "cursor.exe",
]);

export interface ProcRow {
  pid: number;
  ppid: number;
  name: string;
  cmd: string;
  /** Creation time, epoch ms. */
  created: number;
  /** Kernel + user CPU time, 100 ns units. */
  cpu: number;
}

export type ProcIndex = ReadonlyMap<number, ProcRow>;

export function indexRows(rows: readonly ProcRow[]): ProcIndex {
  return new Map(rows.map((r) => [r.pid, r]));
}

/** The live parent, or undefined when it has exited or its PID was reused since. */
function liveParent(row: ProcRow, index: ProcIndex): ProcRow | undefined {
  const parent = index.get(row.ppid);
  if (!parent || parent.pid === row.pid) return undefined;
  return parent.created <= row.created ? parent : undefined;
}

/**
 * Walk up from `pid`. Anchored → `null`. Orphaned → the topmost live ancestor, which
 * is the root of the abandoned tree (killing it with `/T` takes the wrappers, npx,
 * Vite and its esbuild service in one go).
 */
export function orphanRoot(pid: number, index: ProcIndex): ProcRow | null {
  let row = index.get(pid);
  if (!row) return null;
  for (let hops = 0; hops < 64; hops++) {
    if (ANCHOR_NAMES.has(row.name.toLowerCase())) return null;
    const parent = liveParent(row, index);
    if (!parent) return row;
    row = parent;
  }
  return null; // cycle or absurd depth: fail-soft, keep
}

const norm = (s: string) => s.replace(/\\/g, "/").toLowerCase();

export interface ViteVerdict {
  vitePid: number;
  killRoot: ProcRow;
  port: string;
  worktree: string;
  ageMinutes: number;
}

export function findOrphanViteServers(
  rows: readonly ProcRow[],
  repoRoot: string,
  now: number,
  minAgeMinutes: number = VITE_ORPHAN_MIN_AGE_MINUTES,
): ViteVerdict[] {
  const index = indexRows(rows);
  const repo = norm(repoRoot).replace(/\/+$/, "") + "/";
  const seenRoots = new Set<number>();
  const out: ViteVerdict[] = [];
  for (const row of rows) {
    const cmd = norm(row.cmd);
    if (!/vite\/bin\/vite\.js/.test(cmd) || !cmd.includes(repo)) continue;
    const ageMinutes = Math.floor((now - row.created) / 60_000);
    if (ageMinutes < minAgeMinutes) continue;
    const root = orphanRoot(row.pid, index);
    if (!root || seenRoots.has(root.pid)) continue;
    seenRoots.add(root.pid);
    out.push({
      vitePid: row.pid,
      killRoot: root,
      port: row.cmd.match(/--port\s+(\d+)/)?.[1] ?? "?",
      worktree: row.cmd.match(/worktrees[\\/]([^\\/]+)[\\/]/)?.[1] ?? "(home tree)",
      ageMinutes,
    });
  }
  return out;
}

export interface BrowserTree {
  root: ProcRow;
  pids: number[];
}

/** Playwright-profile browser roots (no `--type=`) and every descendant process. */
export function findPlaywrightBrowsers(rows: readonly ProcRow[]): BrowserTree[] {
  const index = indexRows(rows);
  const children = new Map<number, number[]>();
  for (const r of rows) {
    if (!liveParent(r, index)) continue;
    const list = children.get(r.ppid) ?? [];
    list.push(r.pid);
    children.set(r.ppid, list);
  }
  return rows
    .filter((r) => /ms-playwright/i.test(r.cmd) && !/--type=/.test(r.cmd))
    .map((root) => {
      const pids: number[] = [];
      const stack = [root.pid];
      while (stack.length) {
        const pid = stack.pop()!;
        pids.push(pid);
        stack.push(...(children.get(pid) ?? []));
      }
      return { root, pids };
    });
}

/** Cores the tree averaged between two snapshots taken `elapsedMs` apart. */
export function coresUsed(
  tree: BrowserTree,
  before: ProcIndex,
  after: ProcIndex,
  elapsedMs: number,
): number {
  if (elapsedMs <= 0) return 0;
  let delta = 0;
  for (const pid of tree.pids) {
    const a = after.get(pid);
    const b = before.get(pid);
    if (!a || !b || a.created !== b.created) continue;
    delta += Math.max(0, a.cpu - b.cpu);
  }
  return delta / (elapsedMs * 10_000);
}

/** Strike counts keyed by `pid@created`, so a reused PID starts clean. */
export type StrikeState = Record<string, number>;

export const browserKey = (root: ProcRow) => `${root.pid}@${root.created}`;

export interface BrowserDecision {
  tree: BrowserTree;
  cores: number;
  strikes: number;
  kill: boolean;
}

export function decideBrowsers(
  samples: ReadonlyArray<{ tree: BrowserTree; cores: number }>,
  prev: StrikeState,
  hotCores: number = PLAYWRIGHT_HOT_CORES,
  hotStrikes: number = PLAYWRIGHT_HOT_STRIKES,
): { decisions: BrowserDecision[]; next: StrikeState } {
  const next: StrikeState = {};
  const decisions = samples.map(({ tree, cores }) => {
    const key = browserKey(tree.root);
    const strikes = cores > hotCores ? (prev[key] ?? 0) + 1 : 0;
    const kill = strikes >= hotStrikes;
    if (strikes > 0 && !kill) next[key] = strikes;
    return { tree, cores, strikes, kill };
  });
  return { decisions, next };
}

// ---- host I/O (not unit-tested) ------------------------------------------

const SNAPSHOT_PS = [
  "Get-CimInstance Win32_Process | ForEach-Object {",
  "  [pscustomobject]@{ pid=[int]$_.ProcessId; ppid=[int]$_.ParentProcessId; name=[string]$_.Name;",
  "    cmd=[string]$_.CommandLine;",
  "    created=if ($_.CreationDate) { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() } else { 0 };",
  "    cpu=[double]($_.KernelModeTime + $_.UserModeTime) }",
  "} | ConvertTo-Json -Compress",
].join("\n");

/**
 * The process table, or a one-line reason it could not be read. Retried once: the first
 * dry runs on the host saw an occasional unexplained failure that a rerun did not repeat.
 */
function snapshot(): ProcRow[] | string {
  const first = snapshotOnce();
  return typeof first === "string" ? snapshotOnce() : first;
}

function snapshotOnce(): ProcRow[] | string {
  const res = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", SNAPSHOT_PS], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (res.error) return res.error.message;
  if (res.status !== 0 || !res.stdout) {
    return `powershell exit ${res.status}: ${(res.stderr ?? "").trim().split("\n")[0] ?? ""}`;
  }
  try {
    const parsed = JSON.parse(res.stdout) as ProcRow | ProcRow[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return `unparseable output (${err instanceof Error ? err.message : String(err)})`;
  }
}

function killTree(pid: number): boolean {
  const res = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8", windowsHide: true });
  return res.status === 0;
}

function readState(file: string): StrikeState {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as StrikeState) : {};
  } catch {
    return {};
  }
}

function writeState(file: string, state: StrikeState): void {
  try {
    fs.writeFileSync(file, JSON.stringify(state));
  } catch {
    // fail-soft: losing a strike only delays a kill by one run
  }
}

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(): void {
  const log = (line: string) => console.log(`proc-reaper: ${line}`);
  if (process.platform !== "win32") return log("skipped (not Windows)");

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = argValue(args, "--repo") ?? path.resolve(scriptDir, "..");
  const stateFile = argValue(args, "--state") ?? path.join(os.tmpdir(), "threadbare-proc-reaper.json");
  const act = (pid: number) => (dryRun ? true : killTree(pid));
  const verb = dryRun ? "would kill" : "killed";

  const before = snapshot();
  if (typeof before === "string") return log(`skipped (process snapshot failed: ${before})`);
  const t0 = Date.now();

  let viteKilled = 0;
  for (const v of findOrphanViteServers(before, repoRoot, t0)) {
    const ok = act(v.killRoot.pid);
    if (ok) viteKilled++;
    log(
      `${ok ? verb : "FAILED to kill"} orphan vite :${v.port} (${v.worktree}, ${v.ageMinutes}m old, tree root pid ${v.killRoot.pid})`,
    );
  }

  const browsers = findPlaywrightBrowsers(before);
  let browserKilled = 0;
  if (browsers.length > 0) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, PROC_SAMPLE_SECONDS * 1000);
    const after = snapshot();
    if (typeof after === "string") {
      log(`browser check skipped (second snapshot failed: ${after})`);
    } else {
      const elapsed = Date.now() - t0;
      const a = indexRows(after);
      const b = indexRows(before);
      const samples = browsers.map((tree) => ({ tree, cores: coresUsed(tree, b, a, elapsed) }));
      const { decisions, next } = decideBrowsers(samples, readState(stateFile));
      for (const d of decisions) {
        const what = `playwright browser pid ${d.tree.root.pid} at ${d.cores.toFixed(1)} cores`;
        if (d.kill) {
          const ok = act(d.tree.root.pid);
          if (ok) browserKilled++;
          log(`${ok ? verb : "FAILED to kill"} ${what} (hot ${d.strikes} runs in a row)`);
        } else if (d.strikes > 0) {
          log(`holding ${what} (hot ${d.strikes}/${PLAYWRIGHT_HOT_STRIKES})`);
        }
      }
      if (!dryRun) writeState(stateFile, next);
    }
  }

  log(
    `${dryRun ? "dry run — " : ""}orphan vite ${verb}: ${viteKilled} | playwright browsers seen: ${browsers.length}, ${verb}: ${browserKilled}`,
  );
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  try {
    main();
  } catch (err) {
    console.log(`proc-reaper: skipped (${err instanceof Error ? err.message : String(err)})`);
  }
}
