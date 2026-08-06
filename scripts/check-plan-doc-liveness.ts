#!/usr/bin/env node
/**
 * THR-921 — promotion-time plan-doc liveness gate.
 *
 * Answers one question for a lane about to move an issue into `Ready for Dev`: does every plan
 * doc this issue names resolve on `origin/main`? If it does not, the executor's Step 6 ("read
 * the plan doc before touching code") has nothing to read, because every executor worktree is
 * cut from `origin/main`.
 *
 * Usage:
 *   npm run check:plan-doc-liveness -- Docs/plans/2026-07-30-foo.md [more paths...]
 *   npm run check:plan-doc-liveness -- --stdin        # extract paths from piped issue text
 *   npm run check:plan-doc-liveness -- --stdin --json
 *
 * Exit code is 0 unless `--strict` is passed, matching the sibling probes: a lane reads the
 * verdict, and a broken probe must not block a promotion by itself.
 *
 * The classification lives in `plan-doc-liveness-predicate.ts`; this file is only the I/O.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  MAX_PRS_TO_SCAN,
  type PlanDocVerdict,
  classifyPlanDocLiveness,
  extractPlanDocPaths,
  summarizePlanDocLiveness,
} from "./plan-doc-liveness-predicate.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

function gh(args: string[]): string | null {
  try {
    return execFileSync("gh", args, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/** `git cat-file -e` is the cheapest existence probe that does not materialize the blob. */
export function existsOnMain(repoPath: string): boolean {
  return git(["cat-file", "-e", `origin/main:${repoPath}`]) !== null;
}

/**
 * Which open PR, if any, carries this path. Returns `null` for "scanned, not found" and
 * `undefined` for "could not scan" — the caller maps those to different verdicts, because a
 * skipped scan is the absence of an answer rather than a negative one (THR-828).
 */
export function findOpenPrCarrying(repoPath: string): number | null | undefined {
  const listed = gh(["pr", "list", "--state", "open", "--limit", String(MAX_PRS_TO_SCAN), "--json", "number"]);
  if (listed === null) return undefined;

  let numbers: number[];
  try {
    numbers = (JSON.parse(listed) as Array<{ number: number }>).map((pr) => pr.number);
  } catch {
    return undefined;
  }

  for (const number of numbers) {
    const files = gh(["pr", "diff", String(number), "--name-only"]);
    if (files === null) continue;
    if (
      files
        .split("\n")
        .map((line) => line.trim().replaceAll("\\", "/"))
        .includes(repoPath)
    ) {
      return number;
    }
  }
  return null;
}

export function checkPaths(paths: readonly string[]): PlanDocVerdict[] {
  return paths.map((repoPath) => {
    const onMain = existsOnMain(repoPath);
    if (onMain) {
      return classifyPlanDocLiveness({ path: repoPath, onMain: true });
    }
    const openPrNumber = findOpenPrCarrying(repoPath);
    return classifyPlanDocLiveness({
      path: repoPath,
      onMain: false,
      openPrNumber: openPrNumber ?? null,
      prScanRan: openPrNumber !== undefined,
    });
  });
}

function readStdin(): string {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");
  const useStdin = argv.includes("--stdin");
  const explicitPaths = argv.filter((arg) => !arg.startsWith("--"));

  const paths = useStdin
    ? [...new Set([...explicitPaths, ...extractPlanDocPaths(readStdin())])]
    : explicitPaths;

  if (paths.length === 0) {
    const message =
      "No plan-doc paths given. Pass paths as arguments, or --stdin to extract them from piped issue text.";
    if (asJson) {
      console.log(JSON.stringify({ ok: true, verdicts: [], summary: message }));
    } else {
      console.log(`[plan-doc-liveness] ${message}`);
    }
    process.exit(0);
  }

  const verdicts = checkPaths(paths);
  const { ok, blocking } = summarizePlanDocLiveness(verdicts);
  const summary = ok
    ? `All ${verdicts.length} named plan doc(s) resolve on origin/main — promotion is clear.`
    : `${blocking.length} of ${verdicts.length} named plan doc(s) do not resolve on origin/main — hold the promotion.`;

  if (asJson) {
    console.log(JSON.stringify({ ok, summary, verdicts }));
  } else {
    for (const verdict of verdicts) {
      console.log(`[plan-doc-liveness] ${verdict.status.toUpperCase()} ${verdict.message}`);
    }
    console.log(`[plan-doc-liveness] ${summary}`);
  }

  process.exit(strict && !ok ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
