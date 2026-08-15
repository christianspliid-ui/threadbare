#!/usr/bin/env node

/**
 * check-typecheck-ratchet — the type gate CI's "Typecheck" step never had
 * (THR-693).
 *
 * The failure class this closes: CI ran `npx tsc --noEmit`, and the root
 * `tsconfig.json` sets `files: []`, so that command exits 0 unconditionally no
 * matter how broken the code is. The required `Test · Typecheck · Build` check
 * asserted a type gate in its name while containing none. THR-686 purged that
 * claim from six *documents* but never touched the workflow, so the theater
 * outlived its own retraction.
 *
 * Why a ratchet and not bare `tsc -b`: the baseline is ~3529 errors (THR-489,
 * tracked separately). Swapping in bare `tsc -b` turns the required check red on
 * arrival and blocks every PR — trading a gate that cannot fail for one that
 * cannot pass. The ratchet compares the error count against a committed baseline
 * and fails only on an INCREASE, which is exactly the net-new-regression
 * standard CLAUDE.md already prescribes for local evidence.
 *
 * Three properties worth preserving if this is ever rewritten:
 *
 * 1. `--force` is mandatory, not incidental. `tsc -b` is incremental: against a
 *    warm .tsbuildinfo it reports nothing and this gate would score a clean
 *    build as zero errors — a false pass so total it would be worse than the
 *    no-op it replaces.
 * 2. `--pretty false` pins the single-line `file(line,col): error TSxxxx:`
 *    format the parser depends on. Under a TTY, tsc otherwise emits a
 *    multi-line decorated format that this regex silently scores as 0 errors.
 * 3. A tsc invocation that fails without producing parseable errors (bad config,
 *    OOM, missing dep) is treated as UNVERIFIABLE and exits non-zero. Reading
 *    "0 errors parsed" as success is how gates rot back into theater.
 * 4. The compiler is proven present BEFORE the run is scored (THR-1128).
 *    `npx tsc` with TypeScript absent prints "Use `npm install typescript` to
 *    first add TypeScript to your project." and exits ZERO — no diagnostics, and
 *    no "error" substring, so property 3's guard (which keys on a non-clean run)
 *    waves it through. Measured 2026-08-15, when node_modules was wiped out from
 *    under a live session: the ratchet scored a 3184-error improvement against a
 *    3184 baseline and printed the invitation to `--update`, which would have
 *    committed a 0 baseline and turned the required check red for every PR.
 *    A ratchet that cannot run must never report a floor.
 * 5. An implausibly large drop is SUSPECT, not OK. Property 4 closes the
 *    observed cause; this closes the class. Any path that yields zero parseable
 *    diagnostics while looking clean — a warm .tsbuildinfo defeating --force, a
 *    tsconfig that early-exits quietly, a future runner that stubs tsc — lands
 *    as a huge DROP, and every guard this script had was on the increase side.
 *    The escape hatch is `--allow-drop`, which is deliberately explicit: a real
 *    halving of the baseline is a thing worth saying out loud in a commit body.
 *
 * The gate is the TOTAL only. The per-file map exists solely to make a failure
 * actionable — "3530 > 3529" is unactionable against a 3529-error baseline, so
 * on failure the script names the files that grew. Per-file drift alone never
 * fails the build, which keeps refactors that merely move errors between files
 * from generating baseline churn. That tolerance means the map can go stale
 * while the total stays honest, so its diagnostic is advisory: it points at the
 * likely culprit, it does not adjudicate.
 *
 * Run via `npm run check:typecheck`. Refresh the baseline after legitimately
 * changing the error count with `npm run check:typecheck -- --update`.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Full, non-incremental, machine-parseable typecheck. Every flag is load-bearing
 * — see properties 1 and 2 in the header before changing this.
 */
const TYPECHECK_COMMAND = "npx tsc -b --force --pretty false";

/** Committed baseline, refreshed via `--update`. */
const BASELINE_PATH = "typecheck-baseline.json";

/** Matches tsc's non-pretty diagnostic line: `path(line,col): error TSxxxx: msg`. */
const ERROR_LINE = /^(.+?)\((\d+),(\d+)\): error (TS\d+):/;

/**
 * Specifiers that prove the compiler is installed (property 4). `bin/tsc` is
 * what `npx tsc` actually executes, so resolving it is the strongest evidence.
 * The package entry is a fallback in case a future TypeScript ships an
 * `exports` map that blocks the deep path: this gate blocks every PR when it
 * fails, so an ambiguous resolution failure must not be read as an absent
 * compiler. Only an exhausted list means "not installed".
 */
export const COMPILER_SPECIFIERS = ["typescript/bin/tsc", "typescript"] as const;

/**
 * A drop of more than this fraction of the baseline is SUSPECT rather than OK
 * (property 5). Normal work moves the baseline by single digits; halving it in
 * one commit is far more often a broken toolchain than a fixed codebase.
 */
export const SUSPECT_DROP_RATIO = 0.5;

/** Opt-in flag that accepts a suspect drop once the toolchain is verified. */
export const ALLOW_DROP_FLAG = "--allow-drop";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const requireFromScript = createRequire(import.meta.url);

/**
 * Absolute path to the installed compiler, or null when none of
 * `COMPILER_SPECIFIERS` resolves — i.e. TypeScript is genuinely not installed.
 */
export function findCompiler(): string | null {
  for (const specifier of COMPILER_SPECIFIERS) {
    try {
      return requireFromScript.resolve(specifier);
    } catch {
      // Try the next specifier — see COMPILER_SPECIFIERS on why one miss is not
      // enough to conclude the compiler is absent.
    }
  }
  return null;
}

/** Everything the verdict depends on, so the decision is testable in isolation. */
export interface RunFacts {
  /** False when `findCompiler()` returned null. */
  compilerFound: boolean;
  /** Combined stdout+stderr of the typecheck command. */
  output: string;
  /** Total parsed error count. */
  total: number;
  /** Committed baseline total, or null when no baseline exists yet. */
  baselineTotal: number | null;
  /** True when `--allow-drop` was passed. */
  allowDrop: boolean;
}

export type RatchetVerdict =
  | { kind: "no-compiler" }
  | { kind: "unverifiable"; detail: string }
  | { kind: "suspect-drop"; total: number; baselineTotal: number }
  | { kind: "increase"; total: number; baselineTotal: number }
  | { kind: "decrease"; total: number; baselineTotal: number }
  | { kind: "unchanged"; total: number }
  | { kind: "no-baseline"; total: number };

/** Verdicts that must never write a baseline or report a floor. */
export function isBlocking(verdict: RatchetVerdict): boolean {
  return (
    verdict.kind === "no-compiler" ||
    verdict.kind === "unverifiable" ||
    verdict.kind === "suspect-drop"
  );
}

/**
 * The whole decision, as a pure function of the run's facts. `main()` does the
 * I/O and the reporting; everything that decides whether the gate may report a
 * floor lives here so a test can drive it with the outputs actually observed.
 */
export function classifyRun(facts: RunFacts): RatchetVerdict {
  const { compilerFound, output, total, baselineTotal, allowDrop } = facts;

  // Property 4 — checked first: with no compiler there is nothing to interpret,
  // and every downstream number is an artifact of a run that never happened.
  if (!compilerFound) return { kind: "no-compiler" };

  // Property 3 — tsc ran, failed, and produced nothing parseable.
  if (
    total === 0 &&
    !/\bFound 0 errors\b/.test(output) &&
    output.trim() !== "" &&
    /error/i.test(output)
  ) {
    return { kind: "unverifiable", detail: output.split("\n").slice(0, 10).join("\n  ") };
  }

  if (baselineTotal === null) return { kind: "no-baseline", total };

  // Property 5 — an implausible drop outranks the comparison it would win.
  if (!allowDrop && baselineTotal > 0 && total < baselineTotal * (1 - SUSPECT_DROP_RATIO)) {
    return { kind: "suspect-drop", total, baselineTotal };
  }

  if (total > baselineTotal) return { kind: "increase", total, baselineTotal };
  if (total < baselineTotal) return { kind: "decrease", total, baselineTotal };
  return { kind: "unchanged", total };
}

interface Baseline {
  /** The gate: total error count across the whole project. */
  total: number;
  /** The command the baseline was measured with, so drift in it is visible. */
  command: string;
  /** Advisory per-file counts, used only to diagnose a failure. */
  perFile: Record<string, number>;
}

/** Exit non-zero with a reason — this gate must never pass unverified. */
function bail(reason: string, detail?: string): never {
  console.error(`check-typecheck-ratchet: FAIL — ${reason}`);
  if (detail) console.error(`  ${detail}`);
  process.exit(1);
}

/**
 * Run the typecheck and return its combined output. tsc exits non-zero when it
 * finds type errors, which is the expected path here — the caller distinguishes
 * "errors found" from "could not run" by whether any diagnostics parsed.
 */
function runTypecheck(): string {
  try {
    return execSync(`${TYPECHECK_COMMAND} 2>&1`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (err) {
    const output = (err as { stdout?: string }).stdout ?? "";
    if (output.trim() === "") {
      bail(`\`${TYPECHECK_COMMAND}\` produced no output — cannot verify.`, (err as Error).message);
    }
    return output;
  }
}

/** Parse tsc output into a per-file error count map. */
function parseErrors(output: string): Map<string, number> {
  const perFile = new Map<string, number>();
  for (const raw of output.split("\n")) {
    const match = ERROR_LINE.exec(raw.trim());
    if (!match) continue;
    const file = (match[1] as string).replaceAll("\\", "/");
    perFile.set(file, (perFile.get(file) ?? 0) + 1);
  }
  return perFile;
}

function readBaseline(): Baseline {
  const absolute = path.join(REPO_ROOT, BASELINE_PATH);
  if (!fs.existsSync(absolute)) {
    bail(
      `${BASELINE_PATH} is missing — cannot verify.`,
      `Create it with \`npm run check:typecheck -- --update\`.`,
    );
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(absolute, "utf8")) as Partial<Baseline>;
    if (typeof parsed.total !== "number" || !Number.isFinite(parsed.total)) {
      bail(`${BASELINE_PATH} has no numeric \`total\` — cannot verify.`);
    }
    return {
      total: parsed.total,
      command: typeof parsed.command === "string" ? parsed.command : TYPECHECK_COMMAND,
      perFile: parsed.perFile ?? {},
    };
  } catch (err) {
    bail(`${BASELINE_PATH} is not valid JSON — cannot verify.`, (err as Error).message);
  }
}

function writeBaseline(total: number, perFile: Map<string, number>): void {
  // Sorted so the committed file diffs cleanly instead of reshuffling per run.
  const sorted = Object.fromEntries([...perFile.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const baseline: Baseline = { total, command: TYPECHECK_COMMAND, perFile: sorted };
  fs.writeFileSync(path.join(REPO_ROOT, BASELINE_PATH), `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
}

/** Files whose error count rose against the baseline, worst first. */
function growthReport(perFile: Map<string, number>, baseline: Baseline): string[] {
  const grew: Array<{ file: string; from: number; to: number }> = [];
  for (const [file, count] of perFile) {
    const before = baseline.perFile[file] ?? 0;
    if (count > before) grew.push({ file, from: before, to: count });
  }
  return grew
    .sort((a, b) => b.to - b.from - (a.to - a.from))
    .slice(0, 20)
    .map(({ file, from, to }) => `${file}: ${from} → ${to} (+${to - from})`);
}

/** Property 4's failure, stated once — it fires before the run and inside the switch. */
function bailNoCompiler(update: boolean): never {
  bail(
    "the TypeScript compiler is not installed — cannot verify.",
    `Resolved none of: ${COMPILER_SPECIFIERS.join(", ")}. Run \`npm install\` (or repair a ` +
      `wiped node_modules) and re-run — ${BASELINE_PATH} was NOT ${update ? "written" : "compared"}.`,
  );
}

function main(): void {
  const update = process.argv.includes("--update");
  const allowDrop = process.argv.includes(ALLOW_DROP_FLAG);

  // Property 4 — before running, so a missing compiler is named as such rather
  // than inferred from the empty output of a command that never compiled. Also
  // avoids handing `npx` an uninstalled binary, which it may try to fetch.
  if (findCompiler() === null) bailNoCompiler(update);

  const output = runTypecheck();
  const perFile = parseErrors(output);
  const total = [...perFile.values()].reduce((sum, count) => sum + count, 0);

  // On --update the baseline may legitimately not exist yet; on the check path a
  // missing baseline is itself unverifiable, and readBaseline() bails.
  const baseline = update
    ? fs.existsSync(path.join(REPO_ROOT, BASELINE_PATH))
      ? readBaseline()
      : null
    : readBaseline();

  const verdict = classifyRun({
    compilerFound: true,
    output,
    total,
    baselineTotal: baseline?.total ?? null,
    allowDrop,
  });

  // Blocking verdicts refuse BOTH paths — in particular --update must not write
  // a floor measured by a run we cannot vouch for (THR-1128).
  if (isBlocking(verdict)) {
    switch (verdict.kind) {
      case "no-compiler":
        bailNoCompiler(update);
        break;
      case "unverifiable":
        bail(
          `\`${TYPECHECK_COMMAND}\` reported failure but produced no parseable diagnostics — cannot verify.`,
          verdict.detail,
        );
        break;
      case "suspect-drop":
        console.error(
          `check-typecheck-ratchet: SUSPECT — ${verdict.total} error(s) is a ` +
            `${verdict.baselineTotal - verdict.total}-error drop from the ${verdict.baselineTotal} ` +
            `baseline (more than ${SUSPECT_DROP_RATIO * 100}%). Refusing to report a floor.`,
        );
        console.error("");
        console.error(
          "A drop this size is far more often a broken toolchain than a fixed codebase, and the",
        );
        console.error(
          "compiler resolving is not proof it ran over the whole project. Verify by running",
        );
        console.error(`  ${TYPECHECK_COMMAND}`);
        console.error("and confirming it emits diagnostics for files you expect to be broken.");
        console.error("");
        console.error(
          `If the drop is real, re-run with \`${ALLOW_DROP_FLAG}\` (plus \`--update\` to record the ` +
            `new floor) and say why in the commit body.`,
        );
        process.exit(1);
    }
  }

  if (update) {
    writeBaseline(total, perFile);
    console.log(
      `check-typecheck-ratchet: baseline updated — ${total} error(s) across ${perFile.size} file(s). ` +
        `Commit ${BASELINE_PATH}.`,
    );
    return;
  }

  // The check path always has a baseline — readBaseline() bails when it is absent.
  const confirmed = baseline as Baseline;

  if (total > confirmed.total) {
    console.error(
      `check-typecheck-ratchet: FAIL — type errors increased: ${confirmed.total} → ${total} (+${total - confirmed.total}).`,
    );
    const grew = growthReport(perFile, confirmed);
    if (grew.length > 0) {
      console.error("");
      console.error("Files whose error count rose (advisory — the gate is the total):");
      for (const line of grew) console.error(`  - ${line}`);
    }
    console.error("");
    console.error(`Fix: resolve the net-new type errors. Reproduce locally with \`${TYPECHECK_COMMAND}\`.`);
    console.error(
      `The ~${confirmed.total}-error baseline is pre-existing (THR-489) and is NOT yours to fix — ` +
        `this gate only blocks making it worse.`,
    );
    console.error(
      `If the increase is intentional and justified, refresh the baseline with ` +
        `\`npm run check:typecheck -- --update\` and say why in the commit body.`,
    );
    process.exit(1);
  }

  if (total < confirmed.total) {
    console.log(
      `check-typecheck-ratchet: OK — ${total} error(s), DOWN ${confirmed.total - total} from the ` +
        `${confirmed.total} baseline. Please run \`npm run check:typecheck -- --update\` and commit ` +
        `${BASELINE_PATH} so the ratchet holds the new floor.`,
    );
    return;
  }

  console.log(`check-typecheck-ratchet: OK — ${total} error(s), unchanged from baseline.`);
}

// Entry guard so the exported predicates above are importable by tests without
// running the gate (the house idiom — see check-armed-prs.ts).
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
