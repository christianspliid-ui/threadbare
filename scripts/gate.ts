/**
 * THR-1717 — `npm run gate`: the local gate track as one command.
 *
 * Before this, a session ran the owed gates one at a time — `npm test` (73 s),
 * `check:typecheck` (42 s), `vite build` (20 s), and for engine diffs `test:heavy`
 * (138 s) plus a CLI smoke — reading each one's full output into its context
 * (1,400+ lines of vitest alone) before deciding the next step. The three code
 * gates are independent, and on this machine they finish together in 74 s wall
 * versus 135 s serial (measured 2026-10-03, 32 cores). So this script:
 *
 * 1. picks the track with the SAME predicate CI's `detect` job uses
 *    (`docs-only-predicate.ts` — imported, never copied; `check:predicate-copies`
 *    guards prose copies, and this file deliberately makes none);
 * 2. runs that track's gates concurrently, each logging to `.cache/gate/<name>.log` —
 *    except that two vitest suites never share the machine: an engine diff runs
 *    test ∥ typecheck ∥ build ∥ cli-smoke, THEN test:heavy alone (see GatePlan.stages);
 * 3. prints one verdict line per gate, and the log tail of a failure only.
 *
 * The closeout-sensitive gates (`check:impediment-ids`, `check:generated-freshness`,
 * `check:wiki-freshness:blocking`) are a separate `--final` phase because they must
 * run after every closeout edit,
 * immediately before `git push` (Docs/canon/verification-gates.md). The session's
 * sequence is: implement → `npm run gate` → closeout docs → commit →
 * `npm run gate -- --final` → push. `--all` runs both phases in one go.
 *
 * Run:
 *   npm run gate                 # classify, run the track's gates in parallel
 *   npm run gate -- --final      # only the tree-diffing gates (last, before push)
 *   npm run gate -- --all        # track gates, then the final phase
 *   npm run gate -- --heavy      # add test:heavy + CLI smoke even off the engine paths
 *   npm run gate -- --code       # force the code track (or --docs)
 *
 * CI is unchanged and stays authoritative: the required `Test · Typecheck · Build`
 * check still runs the full suite on every code PR. This only makes local evidence
 * cheaper to produce and cheaper to read.
 */

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { classifyDiff } from "./docs-only-predicate.ts";

/** Log lines printed for a failing gate (NFP #1). */
export const GATE_FAIL_TAIL_LINES = 40;

/** Where per-gate logs land, relative to the repo root. */
export const GATE_LOG_DIR = ".cache/gate";

/**
 * Paths that owe `test:heavy` and the 30-tick CLI smoke — CLAUDE.md § Testing and
 * `Docs/canon/verification-gates.md`: "when engine files are touched".
 */
export const ENGINE_PATH_PATTERNS: readonly RegExp[] = [
  /^src\/engine\//,
  /^src\/types\/gameState\.ts$/,
  /^src\/types\/graph\.ts$/,
];

/** The CLI smoke's scripted input: 30 ticks, a status read, exit. */
export const CLI_SMOKE_INPUT = "tick 30\nstatus\nexit\n";

/** The tick the smoke must reach (verification-gates.md step 7). */
export const CLI_SMOKE_TICKS = 30;

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

/**
 * Step 7's pass criterion, read from the CLI's output — its exit code cannot carry
 * it. `runTick` catches its own crashes (orchestrator.ts: "Tick crashed, returning
 * previous state") and the CLI's `exit` command calls `process.exit(0)`, so a tick
 * that throws on every tick still exits 0. A crashed tick also leaves the counter
 * where it was, so "the status block reads tick 30" catches it twice over.
 */
export function checkCliSmoke(output: string): string | null {
  const text = output.replace(ANSI_PATTERN, "");
  if (/Tick crashed/.test(text)) return "a tick crashed (orchestrator logged \"Tick crashed\")";
  const tick = text.match(/^\s*Tick:\s+(\d+)/m);
  if (!tick || Number(tick[1]) < CLI_SMOKE_TICKS) {
    return `the status block did not reach tick ${CLI_SMOKE_TICKS} (read ${tick ? tick[1] : "no status block"})`;
  }
  const agents = text.match(/^\s*Agents:\s+(\d+)/m);
  if (!agents || Number(agents[1]) === 0) return "the status block shows no agents";
  return null;
}

export type Track = "code" | "docs-only";

export interface GateSpec {
  /** Short name — the verdict-line label and the log file stem. */
  name: string;
  /** Shell command line (run with `shell: true` so `npm` resolves on Windows). */
  command: string;
  /** Text piped to the command's stdin, if any. */
  stdin?: string;
  /**
   * Judges the output of a run that exited 0; returns a failure reason, or null.
   * For gates whose exit code cannot carry the verdict — see {@link checkCliSmoke}.
   */
  check?: (output: string) => string | null;
}

export interface GatePlan {
  track: Track;
  engine: boolean;
  /**
   * Stages run one after another; the gates inside a stage run concurrently.
   * At most ONE vitest process per stage: measured 2026-10-03, running `npm test`
   * and `test:heavy` together (plus typecheck, build, smoke) stretched the fast
   * suite from 73 s to 139 s and timed out five tests across both suites, while
   * test ∥ typecheck ∥ build alone finished in 74–79 s.
   */
  stages: GateSpec[][];
  /** Run after every stage, sequentially — the tree-diffing gates. */
  final: GateSpec[];
}

export interface GateOptions {
  final: boolean;
  all: boolean;
  heavy: boolean;
  forceTrack?: Track;
}

export interface GateResult {
  gate: GateSpec;
  ok: boolean;
  seconds: number;
  log: string;
}

export function isEnginePath(file: string): boolean {
  const normalized = file.replaceAll("\\", "/");
  return ENGINE_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * The final phase: run after every closeout edit. `check:impediment-ids` belongs
 * here because the closeout appends to `Docs/impediments.md` after the track ran,
 * and `generated-freshness` regenerates cleanly over a duplicate id — only the id
 * check catches the collision a `git merge origin/main` can union in (both CI jobs
 * run it). It takes about a second.
 */
const FINAL_GATES: readonly GateSpec[] = [
  { name: "impediment-ids", command: "npm run check:impediment-ids" },
  { name: "generated-freshness", command: "npm run check:generated-freshness" },
  { name: "wiki-freshness", command: "npm run check:wiki-freshness:blocking" },
];

/** Pure: which gates a file list owes. Exported for the unit tests. */
export function planGates(files: readonly string[], options: GateOptions): GatePlan {
  const track = options.forceTrack ?? classifyDiff(files);
  const engine = track === "code" && (options.heavy || files.some(isEnginePath));

  if (options.final) {
    return { track, engine, stages: [], final: [...FINAL_GATES] };
  }

  const stages: GateSpec[][] = [];
  if (track === "code") {
    const first: GateSpec[] = [
      { name: "test", command: "npm test" },
      { name: "typecheck", command: "npm run check:typecheck" },
      { name: "build", command: "npx vite build" },
      // Step 9 of the code track: a required CI step that is not inside `npm test`
      // (2026-10-02 retro, impediment #1094). ~1 s, so every code diff runs it.
      { name: "encounter", command: "npm run check:encounter -- --all" },
    ];
    if (engine) {
      first.push({
        name: "cli-smoke",
        command: "npm run cli -- --seed 42 --map medium",
        stdin: CLI_SMOKE_INPUT,
        check: checkCliSmoke,
      });
    }
    stages.push(first);
    // The heavy suite gets the machine to itself — see GatePlan.stages.
    if (engine) stages.push([{ name: "test-heavy", command: "npm run test:heavy" }]);
  } else {
    // `check:predicate-copies` is a required `Docs gates` step that nothing on the
    // docs track would otherwise run (`npm test` is code-track only).
    const docs: GateSpec[] = [
      { name: "impediment-ids", command: "npm run check:impediment-ids" },
      { name: "predicate-copies", command: "npm run check:predicate-copies" },
    ];
    const planDocs = files.filter((file) => /^Docs\/(plans|audits)\/.+\.md$/.test(file.replaceAll("\\", "/")));
    if (planDocs.length > 0) {
      docs.push({ name: "plan-doc-lint", command: `npm run lint:plan-doc -- ${planDocs.join(" ")}` });
    }
    stages.push(docs);
  }

  return { track, engine, stages, final: options.all ? [...FINAL_GATES] : [] };
}

/** Pure: the last `count` non-empty lines of a log. */
export function tailLines(text: string, count: number): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  return lines.slice(-count);
}

/** Pure: the verdict block a session pastes as evidence. */
export function renderSummary(plan: GatePlan, results: readonly GateResult[], wallSeconds: number): string {
  const width = Math.max(...results.map((result) => result.gate.name.length), 4);
  const lines = results.map(
    (result) =>
      `  ${result.ok ? "PASS" : "FAIL"}  ${result.gate.name.padEnd(width)}  ${String(result.seconds).padStart(4)}s` +
      (result.ok ? "" : `  → ${result.log}`),
  );
  const failed = results.filter((result) => !result.ok).length;
  const verdict = failed === 0 ? "PASS" : `FAIL (${failed} of ${results.length})`;
  return [
    ...lines,
    `gate: ${verdict} — track=${plan.track} engine=${plan.engine ? "yes" : "no"} — ${wallSeconds}s wall — logs in ${GATE_LOG_DIR}/`,
  ].join("\n");
}

function parseArgs(argv: readonly string[]): GateOptions {
  return {
    final: argv.includes("--final"),
    all: argv.includes("--all"),
    heavy: argv.includes("--heavy"),
    forceTrack: argv.includes("--code") ? "code" : argv.includes("--docs") ? "docs-only" : undefined,
  };
}

function git(args: readonly string[]): string[] {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Everything the branch changes: committed range against `origin/main`, plus the
 * working tree (tracked edits and untracked files) — a gate run before the first
 * commit must still see the change. Returns null when `origin/main` is unreachable;
 * the caller then forces the code track, the expensive and safe direction.
 */
function changedFiles(): string[] | null {
  try {
    const files = new Set<string>([
      ...git(["diff", "--name-only", "origin/main...HEAD"]),
      ...git(["diff", "--name-only", "HEAD"]),
      ...git(["ls-files", "--others", "--exclude-standard"]),
    ]);
    return [...files].sort();
  } catch {
    return null;
  }
}

function runGate(gate: GateSpec, logDir: string): Promise<GateResult> {
  const log = path.join(logDir, `${gate.name}.log`);
  const started = Date.now();
  return new Promise((resolve) => {
    const out = fs.createWriteStream(log);
    const finish = (ok: boolean) => {
      out.end(() =>
        resolve({ gate, ok, seconds: Math.round((Date.now() - started) / 1000), log: log.replaceAll("\\", "/") }),
      );
    };
    let child;
    try {
      child = spawn(gate.command, {
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
        stdio: [gate.stdin === undefined ? "ignore" : "pipe", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (error) {
      out.write(`gate: could not spawn \`${gate.command}\`: ${String(error)}\n`);
      finish(false);
      return;
    }
    child.stdout?.pipe(out, { end: false });
    child.stderr?.pipe(out, { end: false });
    if (gate.stdin !== undefined) child.stdin?.end(gate.stdin);
    child.on("error", (error) => {
      out.write(`gate: \`${gate.command}\` failed to start: ${String(error)}\n`);
    });
    child.on("close", (code) => {
      if (code !== 0 || !gate.check) {
        finish(code === 0);
        return;
      }
      // The log stream may still be flushing; judge the output once it is on disk.
      out.end(() => {
        let reason: string | null;
        try {
          reason = gate.check!(fs.readFileSync(log, "utf8"));
        } catch (error) {
          reason = `could not read the output to judge it: ${String(error)}`;
        }
        if (reason) fs.appendFileSync(log, `\ngate: ${gate.name} exited 0 but FAILED its output check — ${reason}\n`);
        resolve({ gate, ok: reason === null, seconds: Math.round((Date.now() - started) / 1000), log: log.replaceAll("\\", "/") });
      });
    });
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const files = changedFiles();
  if (files === null && !options.forceTrack) {
    console.log("gate: cannot diff against origin/main (try `git fetch origin main`) — running the code track.");
    options.forceTrack = "code";
  }
  const plan = planGates(files ?? [], options);

  const logDir = path.resolve(GATE_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });

  const phase = options.final ? "final" : options.all ? "track + final" : "track";
  const order = [...plan.stages.map((stage) => stage.map((g) => g.name).join(" ∥ ")), ...plan.final.map((g) => g.name)];
  console.log(
    `gate: ${phase} — track=${plan.track} engine=${plan.engine ? "yes" : "no"} — ` +
      `${(files ?? []).length} changed file(s) — running ${order.join(" → ")}`,
  );

  const started = Date.now();
  const results: GateResult[] = [];
  for (const stage of plan.stages) results.push(...(await Promise.all(stage.map((gate) => runGate(gate, logDir)))));
  for (const gate of plan.final) results.push(await runGate(gate, logDir));
  const wall = Math.round((Date.now() - started) / 1000);

  for (const result of results.filter((r) => !r.ok)) {
    const text = fs.existsSync(result.log) ? fs.readFileSync(result.log, "utf8") : "";
    console.log(`\n--- ${result.gate.name}: last ${GATE_FAIL_TAIL_LINES} lines of ${result.log} ---`);
    console.log(tailLines(text, GATE_FAIL_TAIL_LINES).join("\n"));
  }
  console.log(`\n${renderSummary(plan, results, wall)}`);
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  void main();
}
