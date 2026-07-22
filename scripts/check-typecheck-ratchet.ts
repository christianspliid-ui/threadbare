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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

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

function main(): void {
  const update = process.argv.includes("--update");

  const output = runTypecheck();
  const perFile = parseErrors(output);
  const total = [...perFile.values()].reduce((sum, count) => sum + count, 0);

  // Property 3: no parseable diagnostics AND a non-clean run means the compiler
  // did not do what we asked. Scoring that as zero errors is a false pass.
  if (total === 0 && !/\bFound 0 errors\b/.test(output) && output.trim() !== "") {
    const looksClean = !/error/i.test(output);
    if (!looksClean) {
      bail(
        `\`${TYPECHECK_COMMAND}\` reported failure but produced no parseable diagnostics — cannot verify.`,
        output.split("\n").slice(0, 10).join("\n  "),
      );
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

  const baseline = readBaseline();

  if (total > baseline.total) {
    console.error(
      `check-typecheck-ratchet: FAIL — type errors increased: ${baseline.total} → ${total} (+${total - baseline.total}).`,
    );
    const grew = growthReport(perFile, baseline);
    if (grew.length > 0) {
      console.error("");
      console.error("Files whose error count rose (advisory — the gate is the total):");
      for (const line of grew) console.error(`  - ${line}`);
    }
    console.error("");
    console.error(`Fix: resolve the net-new type errors. Reproduce locally with \`${TYPECHECK_COMMAND}\`.`);
    console.error(
      `The ~${baseline.total}-error baseline is pre-existing (THR-489) and is NOT yours to fix — ` +
        `this gate only blocks making it worse.`,
    );
    console.error(
      `If the increase is intentional and justified, refresh the baseline with ` +
        `\`npm run check:typecheck -- --update\` and say why in the commit body.`,
    );
    process.exit(1);
  }

  if (total < baseline.total) {
    console.log(
      `check-typecheck-ratchet: OK — ${total} error(s), DOWN ${baseline.total - total} from the ` +
        `${baseline.total} baseline. Please run \`npm run check:typecheck -- --update\` and commit ` +
        `${BASELINE_PATH} so the ratchet holds the new floor.`,
    );
    return;
  }

  console.log(`check-typecheck-ratchet: OK — ${total} error(s), unchanged from baseline.`);
}

main();
