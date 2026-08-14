#!/usr/bin/env node

/**
 * Donor `node_modules` auto-repair, gated on liveness and single-flighted (THR-1115).
 *
 * ## What this closes
 *
 * THR-1111 shipped the shape classifier (`scripts/node-modules-health.ts`) and a
 * `--repair` arm that **nothing called**. The wipe itself is a ~4-minute problem; the
 * *unrepaired* wipe is an 18-hour outage, because the reaper deliberately never
 * auto-installs ("that is a dev action") and no other lane looks. The damage streaks in
 * `clean-stale-git.log` run 12, 16, and 18 consecutive hourly runs — every session
 * starting inside one of those windows finds a dead donor. Mean-time-to-repair, not the
 * wipe, is what costs the ~1.5–2h/week.
 *
 * ## Why this is not simply `npm install` on a timer
 *
 * The diagnosed damage shape is `.bin` empty while the packages survive — the signature
 * of an npm install that stripped the bin shims and never re-linked them, most plausibly
 * one racing a second install into the same target. So a lane that fires `npm install`
 * into a tree on a timer is a plausible cause of the very class it would be repairing.
 * Three guards make it safe, and each one is asserted by a test rather than merely added:
 *
 * 1. **It only ever runs against an already-damaged donor.** This is the reframing that
 *    makes the whole thing tractable: a live session junctioned to a damaged donor is
 *    *already* broken — `esbuild` is already not recognized. The repair cannot disturb a
 *    session that was working, because a working session implies a healthy donor implies
 *    no repair. The counterfactual is never "healthy tree we might break"; it is "dead
 *    tree, every session already failing".
 * 2. **Liveness gate** (see {@link collectActivity}) — never install while a session is
 *    active or another install is in flight.
 * 3. **Single-flight lock** (see {@link acquireLock}) — two lanes can never install into
 *    the same target concurrently, which is the leading hypothesis for the damage.
 *
 * ## Why the logic lives here rather than in the lane that calls it
 *
 * The repair must run on the Windows host, against the home tree — GitHub Actions cannot
 * reach it, so "a tracked lane" cannot mean a workflow. The only hourly local schedulers
 * are the reaper and autosync, both untracked Task Scheduler entries. THR-1115 asked for
 * the reviewable alternative where one fits, so the split is: **concurrency-critical
 * logic here, tracked and tested and PR-gated; a single delegating line in the reaper**,
 * mirrored into `Docs/ops/clean-stale-git.sh.md` in the same PR.
 *
 * ## Bootstrapping constraint — do not add a dependency to this file
 *
 * This script must run on a tree whose `node_modules` is destroyed, so it may import
 * `node:*` builtins and its sibling probe and nothing else. `node --experimental-strip-types`
 * needs no install. An import from `node_modules` would make the repair unrunnable in
 * exactly the state it exists to repair.
 *
 * NFP #1 (tunability): every threshold is a named constant, env-overridable.
 * NFP #2 (inspectability): one decision line per run, naming the verdict and its reason.
 * NFP #4 (fail-soft): every probe degrades rather than throwing; the lane never exits
 * non-zero unless `--strict` is passed.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  buildHealthReport,
  defaultHealthFs,
  probeTreeHealth,
  repairTree,
  resolveDonorRoot,
  type HealthFs,
  type TreeHealth,
} from "./node-modules-health.ts";

/**
 * How long every candidate tree must have been quiet before a repair may run.
 *
 * Deliberately shorter than the reaper's `WORKTREE_MIN_IDLE_MINUTES` (180), because the
 * two gate different actions: the reaper's threshold guards an **irreversible deletion**
 * of authored work, this one guards a **re-runnable install** on a tree that is already
 * broken. Holding out for 180 minutes of whole-machine quiet would mean the repair
 * rarely fires, and a repair that never fires is the 18-hour outage it was written to
 * end. 30 minutes is longer than any single command, so a tree quiet this long is
 * between runs or finished.
 */
export const DONOR_REPAIR_MIN_IDLE_MINUTES = Number(
  process.env.DONOR_REPAIR_MIN_IDLE_MINUTES ?? 30,
);

/**
 * When a held lock may be treated as abandoned. `npm install` is ~4 minutes cold; this
 * leaves generous headroom for a slow one while still letting a killed run's orphaned
 * lock clear itself rather than wedging the lane forever.
 */
export const DONOR_REPAIR_LOCK_STALE_MINUTES = Number(
  process.env.DONOR_REPAIR_LOCK_STALE_MINUTES ?? 20,
);

/**
 * Directory names never descended when scanning a tree for recent activity. Mirrors the
 * reaper's own prune list — these churn for reasons that have nothing to do with a live
 * session, so counting them would make every tree look permanently busy.
 *
 * Note `node_modules` is pruned **here** and probed **separately** in
 * {@link collectActivity}: its mtime is the single most important signal this lane has,
 * and burying it in a whole-tree walk would let unrelated churn mask an install in
 * flight.
 */
export const ACTIVITY_PRUNE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".codesight",
  ".vite",
]);

/** Bounds the activity walk so the lane stays cheap on a large tree. */
export const ACTIVITY_SCAN_MAX_DEPTH = 3;

export type TreeActivity = {
  /** Human-readable name for the log line — the reason a skip is auditable. */
  label: string;
  path: string;
  /** Newest mtime found, or null when the path is absent/unreadable. */
  newestMtimeMs: number | null;
};

export type IdlenessVerdict = {
  idle: boolean;
  /** The tree that blocked the repair, or null when everything was quiet. */
  busiest: TreeActivity | null;
  ageMinutes: number | null;
  detail: string;
};

export type RepairDecision =
  | "healthy"
  | "unknown"
  | "skipped-live"
  | "skipped-locked"
  | "repaired"
  | "repair-failed";

export type RepairOutcome = {
  decision: RepairDecision;
  donorRoot: string;
  before: TreeHealth;
  after: TreeHealth | null;
  idleness: IdlenessVerdict | null;
  durationMs: number;
  /** Single machine-readable line; the reaper log's record of this run. */
  summary: string;
};

/**
 * Decide whether every probed tree has been quiet long enough.
 *
 * Pure, so the gate can be asserted rather than assumed — THR-1115's Done-when requires
 * proving a live tree is *not* repaired, and a filesystem-coupled gate cannot be proven.
 */
export function assessIdleness(
  activities: TreeActivity[],
  nowMs: number,
  minIdleMinutes: number = DONOR_REPAIR_MIN_IDLE_MINUTES,
): IdlenessVerdict {
  let busiest: TreeActivity | null = null;
  let newest = 0;

  for (const activity of activities) {
    if (activity.newestMtimeMs === null) continue;
    if (activity.newestMtimeMs > newest) {
      newest = activity.newestMtimeMs;
      busiest = activity;
    }
  }

  if (!busiest || newest <= 0) {
    return { idle: true, busiest: null, ageMinutes: null, detail: "no activity signal on any tree" };
  }

  const ageMinutes = Math.floor((nowMs - newest) / 60_000);

  // A clock skew that puts the newest mtime in the future must read as BUSY, not as
  // hugely idle — a negative age sailing under a `>=` comparison is how a guard silently
  // inverts.
  if (ageMinutes < minIdleMinutes) {
    return {
      idle: false,
      busiest,
      ageMinutes,
      detail: `${busiest.label} touched ${ageMinutes}m ago (< ${minIdleMinutes}m idle floor)`,
    };
  }

  return {
    idle: true,
    busiest,
    ageMinutes,
    detail: `quietest-blocker ${busiest.label} idle ${ageMinutes}m (>= ${minIdleMinutes}m)`,
  };
}

/** Newest mtime under `root`, pruning the churn directories, bounded by depth. */
function newestMtimeUnder(root: string, maxDepth: number = ACTIVITY_SCAN_MAX_DEPTH): number | null {
  let newest: number | null = null;

  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && ACTIVITY_PRUNE_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      try {
        const stat = fs.statSync(full);
        if (newest === null || stat.mtimeMs > newest) newest = stat.mtimeMs;
      } catch {
        continue;
      }
      if (entry.isDirectory()) walk(full, depth + 1);
    }
  };

  walk(root, 0);
  return newest;
}

/** Newest mtime among a git worktree's admin files — the signal a git operation emits. */
function newestGitAdminMtime(worktree: string): number | null {
  const probe = spawnSync("git", ["rev-parse", "--absolute-git-dir"], {
    cwd: worktree,
    encoding: "utf8",
    windowsHide: true,
    timeout: 10_000,
  });
  if (probe.status !== 0) return null;
  const adminDir = (probe.stdout ?? "").trim();
  if (!adminDir) return null;

  let newest: number | null = null;
  for (const name of ["index", "HEAD", path.join("logs", "HEAD")]) {
    try {
      const stat = fs.statSync(path.join(adminDir, name));
      if (newest === null || stat.mtimeMs > newest) newest = stat.mtimeMs;
    } catch {
      continue;
    }
  }
  return newest;
}

/** Every worktree registered against the home tree, home tree excluded. */
export function listWorktrees(donorRoot: string): string[] {
  const listed = spawnSync("git", ["worktree", "list", "--porcelain"], {
    cwd: donorRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 20_000,
  });
  if (listed.status !== 0) return [];

  const normalize = (p: string) => path.resolve(p).replace(/\\/g, "/").toLowerCase();
  const donorKey = normalize(donorRoot);

  return (listed.stdout ?? "")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length).trim())
    .filter((wt) => wt && normalize(wt) !== donorKey);
}

/**
 * Gather every activity signal that should be able to veto a repair.
 *
 * Two classes, and the omission is as deliberate as the inclusions:
 *
 * - **The donor's own `node_modules` mtime.** An `npm install` in flight rewrites that
 *   directory constantly, so this is the freshest evidence that someone is already
 *   repairing by hand — precisely the race the whole ticket is about. It is probed on
 *   its own because {@link ACTIVITY_PRUNE_DIRS} excludes it from every tree walk.
 * - **Each worktree's git-admin and working-file mtimes.** A worktree junctions its
 *   `node_modules` into the donor, so a live session there is reading the target we would
 *   mutate. Both signals are needed for the THR-797 reason: a session in closeout writes
 *   files for hours without touching git.
 *
 * **Not** included: the donor's own working files. The home tree is a read-only mirror
 * that autosync fast-forwards every hour, so its working files are near-permanently
 * fresh. Gating on them would veto every repair forever — a guard that never lets the
 * lane fire is indistinguishable from the outage it replaced.
 */
export function collectActivity(donorRoot: string): TreeActivity[] {
  const activities: TreeActivity[] = [];

  activities.push({
    label: "donor node_modules (install in flight?)",
    path: path.join(donorRoot, "node_modules"),
    newestMtimeMs: (() => {
      try {
        return fs.statSync(path.join(donorRoot, "node_modules")).mtimeMs;
      } catch {
        return null;
      }
    })(),
  });

  for (const worktree of listWorktrees(donorRoot)) {
    activities.push({
      label: `worktree ${path.basename(worktree)} (git)`,
      path: worktree,
      newestMtimeMs: newestGitAdminMtime(worktree),
    });
    activities.push({
      label: `worktree ${path.basename(worktree)} (files)`,
      path: worktree,
      newestMtimeMs: newestMtimeUnder(worktree),
    });
  }

  return activities;
}

/** Lock path for a given donor, kept outside the tree so a wipe cannot take it. */
export function lockPathFor(donorRoot: string): string {
  const slug = path.resolve(donorRoot).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return path.join(os.tmpdir(), `threadbare-donor-repair-${slug}.lock`);
}

export type LockHandle = { path: string; acquired: boolean; detail: string };

/**
 * Take the single-flight lock, breaking one that has gone stale.
 *
 * `mkdir` is the primitive rather than a write-if-absent, because directory creation is
 * atomic on both NTFS and POSIX — a check-then-create would reintroduce, in the lock
 * itself, exactly the race the lock exists to remove.
 */
export function acquireLock(
  donorRoot: string,
  nowMs: number = Date.now(),
  staleMinutes: number = DONOR_REPAIR_LOCK_STALE_MINUTES,
): LockHandle {
  const lock = lockPathFor(donorRoot);

  const tryMake = (): boolean => {
    try {
      fs.mkdirSync(lock);
      try {
        fs.writeFileSync(path.join(lock, "owner"), `pid:${process.pid} at:${new Date(nowMs).toISOString()}\n`);
      } catch {
        // The marker is for humans reading a wedged lock; failing to write it must not
        // fail the acquisition, which the mkdir already settled.
      }
      return true;
    } catch {
      return false;
    }
  };

  if (tryMake()) return { path: lock, acquired: true, detail: "lock acquired" };

  let heldForMinutes: number | null = null;
  try {
    heldForMinutes = Math.floor((nowMs - fs.statSync(lock).mtimeMs) / 60_000);
  } catch {
    heldForMinutes = null;
  }

  if (heldForMinutes !== null && heldForMinutes >= staleMinutes) {
    try {
      fs.rmSync(lock, { recursive: true, force: true });
    } catch {
      return { path: lock, acquired: false, detail: `stale lock (${heldForMinutes}m) could not be broken` };
    }
    if (tryMake()) {
      return { path: lock, acquired: true, detail: `broke stale lock held ${heldForMinutes}m` };
    }
  }

  return {
    path: lock,
    acquired: false,
    detail: heldForMinutes === null ? "lock held by another run" : `lock held by another run (${heldForMinutes}m)`,
  };
}

export function releaseLock(handle: LockHandle): void {
  if (!handle.acquired) return;
  try {
    fs.rmSync(handle.path, { recursive: true, force: true });
  } catch {
    // A leaked lock self-clears via the stale window; failing to release must never
    // propagate out of a fail-soft lane.
  }
}

/** Resolve the home tree from anywhere — a worktree resolves to its donor, the home tree to itself. */
export function resolveHomeTreeRoot(fromRoot: string = process.cwd()): string {
  return resolveDonorRoot(fromRoot) ?? fromRoot;
}

export type RepairDeps = {
  fsLike?: HealthFs;
  now?: () => number;
  collect?: (donorRoot: string) => TreeActivity[];
  acquire?: (donorRoot: string, nowMs: number) => LockHandle;
  release?: (handle: LockHandle) => void;
  install?: (root: string) => { ok: boolean; durationMs: number; detail: string };
  minIdleMinutes?: number;
};

/**
 * Probe the donor and repair it when — and only when — that is provably safe.
 *
 * Order matters and is load-bearing: health first (so a healthy donor costs one stat and
 * never takes the lock), then liveness, then the lock, then **health again under the
 * lock**. That last re-probe is what makes two racing lanes cheap instead of harmful —
 * the loser finds the donor already repaired and installs nothing.
 */
export function repairDonorIfSafe(donorRoot: string, deps: RepairDeps = {}): RepairOutcome {
  const {
    fsLike = defaultHealthFs,
    now = Date.now,
    collect = collectActivity,
    acquire = acquireLock,
    release = releaseLock,
    install = repairTree,
    minIdleMinutes = DONOR_REPAIR_MIN_IDLE_MINUTES,
  } = deps;

  const startedMs = now();
  const before = probeTreeHealth(donorRoot, "donor", fsLike);

  const finish = (
    decision: RepairDecision,
    summary: string,
    after: TreeHealth | null = null,
    idleness: IdlenessVerdict | null = null,
  ): RepairOutcome => ({
    decision,
    donorRoot,
    before,
    after,
    idleness,
    durationMs: now() - startedMs,
    summary,
  });

  if (before.verdict === "healthy") {
    return finish("healthy", `donor healthy (${before.detail}) — no repair needed`);
  }
  if (before.verdict === "unknown") {
    return finish("unknown", `donor probe unreadable (${before.detail}) — taking no action`);
  }

  const idleness = assessIdleness(collect(donorRoot), now(), minIdleMinutes);
  if (!idleness.idle) {
    return finish(
      "skipped-live",
      `donor ${before.verdict} but NOT repairing — ${idleness.detail}`,
      null,
      idleness,
    );
  }

  const lock = acquire(donorRoot, now());
  if (!lock.acquired) {
    return finish("skipped-locked", `donor ${before.verdict} but NOT repairing — ${lock.detail}`, null, idleness);
  }

  try {
    // Re-probe under the lock: the run we were racing may already have fixed it.
    const confirmed = probeTreeHealth(donorRoot, "donor", fsLike);
    if (confirmed.verdict === "healthy") {
      return finish(
        "healthy",
        `donor recovered before repair started (${confirmed.detail}) — no install run`,
        confirmed,
        idleness,
      );
    }

    const outcome = install(donorRoot);
    const after = probeTreeHealth(donorRoot, "donor", fsLike);

    if (outcome.ok && after.verdict === "healthy") {
      return finish(
        "repaired",
        `donor REPAIRED ${before.verdict} -> healthy in ${Math.round(outcome.durationMs / 1000)}s (${after.detail})`,
        after,
        idleness,
      );
    }

    return finish(
      "repair-failed",
      `donor repair FAILED: ${before.verdict} -> ${after.verdict} (${outcome.ok ? after.detail : outcome.detail})`,
      after,
      idleness,
    );
  } finally {
    release(lock);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const donorRoot = resolveHomeTreeRoot(process.cwd());

  let outcome: RepairOutcome;
  try {
    outcome = repairDonorIfSafe(donorRoot);
  } catch (error) {
    // Fail-soft: this runs inside the reaper, which must never abort on our account.
    const message = error instanceof Error ? error.message : String(error);
    const stub = probeTreeHealth(donorRoot, "donor", defaultHealthFs);
    outcome = {
      decision: "unknown",
      donorRoot,
      before: stub,
      after: null,
      idleness: null,
      durationMs: 0,
      summary: `donor repair aborted: ${message}`,
    };
  }

  if (asJson) {
    console.log(JSON.stringify(outcome));
  } else {
    console.log(`donor-repair: ${outcome.decision} — ${outcome.summary}`);
  }

  // `--strict` is for a caller that genuinely wants to act on a bad donor. The reaper
  // does not pass it: a non-zero exit there would abort the rest of the sweep.
  const bad = outcome.decision === "repair-failed" || outcome.decision === "skipped-live";
  process.exit(args.includes("--strict") && bad ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}

// Re-exported so a caller needing the two-tree view does not have to import both modules.
export { buildHealthReport };
