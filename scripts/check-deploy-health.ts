#!/usr/bin/env node

/**
 * Production deploy health probe (THR-785).
 *
 * Answers one question: **is what `main` says the same as what is actually deployed?**
 *
 * ## Why the obvious command is not enough
 *
 * The tempting one-liner is
 * `gh api repos/<repo>/commits/<sha>/status --jq .state`. Measured 2026-07-27 on
 * `main` tip `a9c33078`, that returns `success` — for a commit that produced **no
 * deployment at all**. The status body reads `"Canceled by Ignored Build Step"`.
 *
 * `vercel.json` carries an `ignoreCommand` that exits 0 (skip the build) when a
 * commit touches none of the build-relevant paths. Vercel reports a skipped build
 * as a *successful* commit status. So a green `Vercel` check means "Vercel is not
 * unhappy", not "production serves this commit". Treating it as deployment proof
 * is precisely the blind spot THR-785 was filed for.
 *
 * ## What this probe does instead
 *
 * Reads the GitHub **deployments** API — the surface that records what actually
 * shipped — and classifies `main` HEAD against it:
 *
 * | verdict    | meaning                                                              | needs a human |
 * |------------|----------------------------------------------------------------------|---------------|
 * | `deployed` | a Production deployment exists for HEAD and succeeded                 | no  |
 * | `skipped`  | HEAD has no deployment, but nothing build-relevant changed since the last successful one — the artifact is equivalent | no  |
 * | `pending`  | a build is plausibly still in flight (inside the grace window)        | no, unless past grace |
 * | `failed`   | the newest Production deployment errored, or every one in the lookback window did | **yes** |
 * | `stale`    | HEAD carries build-relevant changes that no successful deployment covers, past the grace window | **yes** |
 * | `unknown`  | the probe could not determine state (network, auth, missing objects)  | no (fail-soft) |
 *
 * The `skipped` verdict is judged with **the same path list Vercel used** — parsed
 * out of `vercel.json`'s `ignoreCommand` rather than copied — so the probe and the
 * platform cannot drift apart into disagreeing about what a build-relevant change is.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped. A network failure, a missing `gh`, an
 * unparseable `vercel.json`, or a commit object we do not have locally all
 * degrade to `unknown` and exit 0. This probe must never be the reason an hourly
 * brief or a closeout fails.
 *
 * Usage:
 *   npm run check:deploy            # advisory; always exits 0
 *   npm run check:deploy -- --strict  # exits 1 when a human is needed
 *   npm run check:deploy -- --json    # machine-readable single-line JSON
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/** GitHub `owner/repo` whose deployments describe production. */
export const GH_REPO = "christianspliid-ui/threadbare";

/** Deployment environment name Vercel uses for production. */
export const PRODUCTION_ENVIRONMENT = "Production";

/**
 * How long after a `main` commit a missing/incomplete deployment is still
 * considered "probably still building" rather than a stoppage. Vercel builds of
 * this project land in ~45s; 20 minutes is generous enough that a queued build
 * never produces a false alarm, tight enough that a real stoppage surfaces
 * within the same hourly brief.
 */
export const DEPLOY_STALE_GRACE_MINUTES = 20;

/**
 * How many Production deployments to walk back looking for the most recent
 * successful one. Bounds the API cost; a run of more than this many consecutive
 * failures is itself the alarm.
 */
export const DEPLOY_LOOKBACK = 10;

/**
 * Fallback build-relevant paths, used only when `vercel.json`'s `ignoreCommand`
 * cannot be parsed. Kept deliberately WIDE: over-reporting a stale deploy is a
 * recoverable annoyance, under-reporting one is the defect THR-785 describes.
 */
export const FALLBACK_BUILD_RELEVANT_PATHS = [
  "src",
  "public",
  "scripts",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "vercel.json",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeployVerdict = "deployed" | "skipped" | "pending" | "failed" | "stale" | "unknown";

/** GitHub deployment status states we care about. */
export type DeploymentState =
  | "success"
  | "failure"
  | "error"
  | "pending"
  | "queued"
  | "in_progress"
  | "inactive"
  | "unknown";

export interface DeploymentRecord {
  id: number;
  sha: string;
  createdAtMs: number;
  state: DeploymentState;
}

export interface DeployHealthInput {
  /** Full SHA of `origin/main`. */
  headSha: string;
  /** Commit time of `origin/main`, epoch ms. */
  headCommittedAtMs: number;
  /** Evaluation time, epoch ms. Injected so tests are deterministic (NFP #3). */
  nowMs: number;
  /** Production deployments, newest first. */
  deployments: DeploymentRecord[];
  /**
   * True when the diff from `deployedSha` to HEAD touches no build-relevant
   * path — i.e. the deployed artifact is equivalent to HEAD. `null` means the
   * comparison could not be made (missing object, git failure).
   */
  buildIrrelevantSince: (deployedSha: string) => boolean | null;
}

export interface DeployHealthResult {
  verdict: DeployVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Whether this belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /** SHA the probe judged production to be serving, when it could tell. */
  deployedSha: string | null;
}

const FAILED_STATES: ReadonlySet<DeploymentState> = new Set(["failure", "error"]);
const IN_FLIGHT_STATES: ReadonlySet<DeploymentState> = new Set(["pending", "queued", "in_progress"]);

function short(sha: string): string {
  return sha.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

/**
 * Classify production deploy health. Pure: no IO, no clock, no git.
 *
 * Order matters. A hard failure on the newest deployment outranks everything —
 * if the most recent thing Vercel tried to ship errored, that is the headline
 * regardless of what older deployments did.
 */
export function classifyDeployHealth(input: DeployHealthInput): DeployHealthResult {
  const { headSha, headCommittedAtMs, nowMs, deployments, buildIrrelevantSince } = input;

  const graceMs = DEPLOY_STALE_GRACE_MINUTES * 60 * 1000;
  const withinGrace = nowMs - headCommittedAtMs < graceMs;

  if (deployments.length === 0) {
    return {
      verdict: "unknown",
      summary: "No production deployments were visible — could not tell whether the site is up to date.",
      needsChristian: false,
      deployedSha: null,
    };
  }

  const newest = deployments[0];

  // 1. Newest production deployment hard-failed. Loudest case.
  if (FAILED_STATES.has(newest.state)) {
    return {
      verdict: "failed",
      summary:
        `The last attempt to publish the game failed (commit ${short(newest.sha)}, status "${newest.state}"). ` +
        "The live site is still serving the previous build, so nothing is broken for players — but new changes are not reaching it.",
      needsChristian: true,
      deployedSha: null,
    };
  }

  // 2. HEAD itself has a deployment record.
  if (newest.sha === headSha) {
    if (newest.state === "success") {
      return {
        verdict: "deployed",
        summary: `The live site is serving the latest commit on main (${short(headSha)}).`,
        needsChristian: false,
        deployedSha: headSha,
      };
    }
    if (IN_FLIGHT_STATES.has(newest.state)) {
      const stuck = !withinGrace;
      return {
        verdict: "pending",
        summary: stuck
          ? `A publish of the latest commit (${short(headSha)}) has been running for over ${DEPLOY_STALE_GRACE_MINUTES} minutes without finishing.`
          : `A publish of the latest commit (${short(headSha)}) is still in progress.`,
        needsChristian: stuck,
        deployedSha: null,
      };
    }
    // inactive / unknown on HEAD's own deployment — can't judge.
    return {
      verdict: "unknown",
      summary: `The publish record for the latest commit (${short(headSha)}) reports "${newest.state}", which the probe does not interpret.`,
      needsChristian: false,
      deployedSha: null,
    };
  }

  // 3. HEAD has no deployment of its own. Find the newest successful one.
  const lastGood = deployments.find((d) => d.state === "success");

  if (!lastGood) {
    return {
      verdict: "failed",
      summary:
        `None of the last ${deployments.length} attempts to publish the game succeeded. ` +
        "The live site is frozen on an older build.",
      needsChristian: true,
      deployedSha: null,
    };
  }

  // Is HEAD equivalent to what shipped? Judged with Vercel's own path list.
  const irrelevant = buildIrrelevantSince(lastGood.sha);

  if (irrelevant === null) {
    return {
      verdict: "unknown",
      summary:
        `Could not compare the latest commit (${short(headSha)}) against the last published build (${short(lastGood.sha)}).`,
      needsChristian: false,
      deployedSha: lastGood.sha,
    };
  }

  if (irrelevant) {
    return {
      verdict: "skipped",
      summary:
        `The live site is up to date. Commits since the last publish (${short(lastGood.sha)}) only touched notes and docs, ` +
        "so the game itself did not need rebuilding.",
      needsChristian: false,
      deployedSha: lastGood.sha,
    };
  }

  // Real code changes with no deployment covering them.
  if (withinGrace) {
    return {
      verdict: "pending",
      summary: `The latest commit (${short(headSha)}) changes the game and has not published yet — it was pushed less than ${DEPLOY_STALE_GRACE_MINUTES} minutes ago.`,
      needsChristian: false,
      deployedSha: lastGood.sha,
    };
  }

  return {
    verdict: "stale",
    summary:
      `The live site is behind. It is serving ${short(lastGood.sha)}, but main has moved on to ${short(headSha)} with real game changes that never published. ` +
      "Publishing has stopped without reporting an error.",
    needsChristian: true,
    deployedSha: lastGood.sha,
  };
}

/**
 * Extract the build-relevant path list from `vercel.json`'s `ignoreCommand`.
 *
 * The command has the shape `git diff --quiet HEAD^ HEAD -- <paths...>`; every
 * token after the `--` separator is a path. Parsing it rather than duplicating
 * it is the anti-drift property: if someone adds a path to the ignore command,
 * this probe learns about it in the same commit.
 *
 * Returns `null` when the shape is not recognised, so the caller can fall back
 * loudly rather than silently judging against an empty list (which would make
 * every skip look benign — the exact failure THR-785 is about).
 */
export function parseBuildRelevantPaths(ignoreCommand: string | undefined): string[] | null {
  if (typeof ignoreCommand !== "string") {
    return null;
  }
  const tokens = ignoreCommand.trim().split(/\s+/);
  const separator = tokens.indexOf("--");
  if (separator < 0) {
    return null;
  }
  const paths = tokens.slice(separator + 1).filter((t) => t.length > 0);
  return paths.length > 0 ? paths : null;
}

// ---------------------------------------------------------------------------
// IO layer — every call fail-soft
// ---------------------------------------------------------------------------

function run(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
}

function ghJson<T>(endpoint: string): T | null {
  const raw = run("gh", ["api", endpoint]);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readBuildRelevantPaths(): { paths: string[]; parsed: boolean } {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8")) as {
      ignoreCommand?: string;
    };
    const parsed = parseBuildRelevantPaths(config.ignoreCommand);
    if (parsed) {
      return { paths: parsed, parsed: true };
    }
  } catch {
    // fall through to the wide fallback
  }
  return { paths: FALLBACK_BUILD_RELEVANT_PATHS, parsed: false };
}

function fetchProductionDeployments(): DeploymentRecord[] | null {
  const list = ghJson<Array<{ id: number; sha: string; created_at: string }>>(
    `repos/${GH_REPO}/deployments?environment=${PRODUCTION_ENVIRONMENT}&per_page=${DEPLOY_LOOKBACK}`,
  );
  if (list === null) {
    return null;
  }

  return list.map((d) => {
    const statuses = ghJson<Array<{ state: string }>>(
      `repos/${GH_REPO}/deployments/${d.id}/statuses?per_page=1`,
    );
    const state = (statuses?.[0]?.state ?? "unknown") as DeploymentState;
    return {
      id: d.id,
      sha: d.sha,
      createdAtMs: Date.parse(d.created_at),
      state,
    };
  });
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");

  run("git", ["fetch", "origin", "main", "--quiet"]);

  const headSha = run("git", ["rev-parse", "origin/main"]);
  const headDate = run("git", ["log", "-1", "--format=%cI", "origin/main"]);

  let result: DeployHealthResult;

  if (!headSha || !headDate) {
    result = {
      verdict: "unknown",
      summary: "Could not read the latest commit on main — deploy health not checked.",
      needsChristian: false,
      deployedSha: null,
    };
  } else {
    const deployments = fetchProductionDeployments();
    if (deployments === null) {
      result = {
        verdict: "unknown",
        summary: "Could not reach GitHub's deployments API — deploy health not checked.",
        needsChristian: false,
        deployedSha: null,
      };
    } else {
      const { paths, parsed } = readBuildRelevantPaths();
      if (!parsed) {
        console.warn(
          "[deploy-health] warn: could not parse vercel.json ignoreCommand — using the wide fallback path list.",
        );
      }

      result = classifyDeployHealth({
        headSha,
        headCommittedAtMs: Date.parse(headDate),
        nowMs: Date.now(),
        deployments,
        buildIrrelevantSince: (deployedSha) => {
          // `git diff --quiet` exits 0 when there is no diff. `run` returns "" on
          // exit 0 and null on any non-zero exit — but a non-zero exit here is
          // ambiguous between "there is a diff" (exit 1) and "bad object" (exit
          // 128), so probe object presence first.
          if (run("git", ["cat-file", "-e", `${deployedSha}^{commit}`]) === null) {
            if (run("git", ["fetch", "origin", deployedSha, "--quiet"]) === null) {
              return null;
            }
          }
          return run("git", ["diff", "--quiet", deployedSha, headSha, "--", ...paths]) !== null;
        },
      });
    }
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[deploy-health] verdict=${result.verdict} needs-christian=${result.needsChristian ? "yes" : "no"}` +
        (result.deployedSha ? ` deployed=${short(result.deployedSha)}` : ""),
    );
    console.log(`[deploy-health] ${result.summary}`);
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
