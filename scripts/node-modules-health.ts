#!/usr/bin/env node

/**
 * `node_modules` health probe and donor repair (THR-1111).
 *
 * ## The failure this exists to make visible
 *
 * Something empties `node_modules` out from under live sessions — 19 occurrences in
 * the week of 2026-08-08 alone, logged as impediments #501/#502/#503/#506, #510,
 * #520 ×2, #536 ×3, #538, #540, #566, and ~16 more in the weeks before. Every
 * occurrence costs a ~4-minute reinstall **plus a misdiagnosis detour**, because the
 * symptom a session actually sees is `'esbuild' is not recognized` — which reads as a
 * missing dependency or a bad npm script, not as "your install was deleted since the
 * last command succeeded".
 *
 * ## What the forensics established (2026-08-14, this file's reason for existing)
 *
 * The reaper log at `C:/Users/chris/Dev/Projects/clean-stale-git.log` carries 478
 * hourly runs, 53 of which printed `HOME-TREE node_modules DAMAGED`. Reading the
 * healthy→damaged transitions gives six distinct wipe windows, and they exonerate
 * the two prime suspects:
 *
 * - **The reaper is excluded in 5 of 6 windows.** In each, the damaged run *and* the
 *   run before it removed nothing at all — every worktree was `skipped (live
 *   session)`. THR-753's junction guard is live and working (40 severs, 0 refusals),
 *   so the 2026-07-22 junction-follow class is genuinely closed.
 * - **Autosync is excluded.** It only ever fast-forwards; its one `Remove-Item` is
 *   THR-937's single-file collision fix with no `-Recurse`. In the 2026-08-14 window
 *   the damage was already present at 04:40, *before* that hour's 04:50 sync.
 *
 * What the damage actually looks like matters more than which process caused it:
 * **`node_modules/.bin` is empty while the packages themselves survive.** That is not
 * a directory deletion — it is the signature of an npm install that stripped the bin
 * shims and never got to re-link them (interrupted, killed, or racing a second
 * install through a junction into the same target). A deletion would take the
 * packages too. So the probe below classifies by *shape*, not by blame: the shape is
 * observable from any session, and it is what decides whether the tree is usable.
 *
 * ## Why the repair arm exists (the finding that actually pays)
 *
 * The damage streaks run 12, 16, and 18 consecutive hourly runs. The wipe is a
 * 4-minute problem; the *unrepaired* wipe is an 18-hour outage, because the reaper
 * deliberately never auto-installs ("that is a dev action") and no other lane looks.
 * Every session starting inside those windows finds a dead donor — which is exactly
 * impediment #501/#502/#503/#506, where both the fresh worktree and the home-tree
 * donor were unusable and plain `npm install` was the only path, four times in a day.
 *
 * Mean-time-to-repair, not the wipe, is what costs the ~1.5–2h/week. `--repair`
 * closes that: one hourly lane can restore the donor so the cheap junction path stays
 * viable for every other tree.
 *
 * NFP #1 (tunability): every threshold below is a named constant.
 * NFP #4 (fail-soft): every probe degrades to `unknown` and never throws.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Minimum `.bin` entries a healthy install carries. A real install of this repo
 * currently has 99; a shim-stripped one has 0. The threshold sits well below the
 * real count so a dependency-count change never turns this into a flaky gate, and
 * well above 0 so the failure it exists to catch cannot slip under it.
 */
export const HEALTHY_MIN_BIN_ENTRIES = 10;

/**
 * At or below this many top-level `node_modules` entries the directory is a stub
 * rather than an install — the shape impediment #520 hit twice, where a reused pool
 * worktree carried only the hidden `.vite` cache. Note an unforced `ls` reports such
 * a directory as empty, which is why the count is taken with `withFileTypes` over the
 * full listing including dotfiles.
 */
export const STUB_MAX_PACKAGE_ENTRIES = 5;

/**
 * Bin shims whose absence defines the `shim-stripped` verdict. `esbuild` is the one
 * the reaper's own check keys on and the one whose absence produces the misleading
 * `'esbuild' is not recognized`; `vitest` is what the documented worktree pre-flight
 * probes (CLAUDE.md § Known Sandbox Limitations step 1).
 */
export const CRITICAL_BIN_SHIMS = ["esbuild", "vitest"] as const;

/** `npm install` is ~4 minutes on a cold tree; allow generous headroom before giving up. */
export const REPAIR_TIMEOUT_MS = 900_000;

export type HealthVerdict =
  | "healthy"
  | "shim-stripped"
  | "stub"
  | "absent"
  | "unknown";

export type TreeHealth = {
  /** Absolute path of the tree root (not of `node_modules`). */
  root: string;
  /** `session` = the tree this process runs in; `donor` = the home tree others junction to. */
  role: "session" | "donor";
  verdict: HealthVerdict;
  packageCount: number;
  binCount: number;
  /** Critical shims that were missing. Empty on a healthy tree. */
  missingShims: string[];
  /** True when `node_modules` is a junction/symlink rather than a real directory. */
  linked: boolean;
  /** `node_modules` directory mtime in ms, or null when absent/unreadable. */
  mtimeMs: number | null;
  detail: string;
};

export type HealthReport = {
  verdict: HealthVerdict;
  session: TreeHealth;
  /** Null when the session IS the home tree — there is no separate donor to probe. */
  donor: TreeHealth | null;
  /** True when at least one probed tree is not `healthy`. */
  degraded: boolean;
  summary: string;
};

/** Injectable filesystem surface, so the classifier is testable without a real tree. */
export type HealthFs = {
  existsSync: (p: string) => boolean;
  readdirSync: (p: string) => string[];
  statMtimeMs: (p: string) => number | null;
  isLink: (p: string) => boolean;
};

export const defaultHealthFs: HealthFs = {
  existsSync: (p) => fs.existsSync(p),
  readdirSync: (p) => fs.readdirSync(p),
  statMtimeMs: (p) => {
    try {
      return fs.statSync(p).mtimeMs;
    } catch {
      return null;
    }
  },
  isLink: (p) => {
    try {
      return fs.lstatSync(p).isSymbolicLink();
    } catch {
      return false;
    }
  },
};

function countEntries(fsLike: HealthFs, dir: string): number {
  try {
    return fsLike.readdirSync(dir).filter((e) => e !== "." && e !== "..").length;
  } catch {
    return 0;
  }
}

/**
 * Classify one tree's `node_modules` by shape.
 *
 * The ladder is ordered by how early the failure stops a session: an absent install
 * fails the first command, a stub fails the first command that needs a real package,
 * and a shim-stripped install fails only when something reaches for a binary — which
 * is why that last one is the shape that gets misdiagnosed. Each verdict names its
 * own repair so the caller never has to look one up.
 */
export function probeTreeHealth(
  root: string,
  role: TreeHealth["role"],
  fsLike: HealthFs = defaultHealthFs,
): TreeHealth {
  const nodeModules = path.join(root, "node_modules");
  const base: Omit<TreeHealth, "verdict" | "detail"> = {
    root,
    role,
    packageCount: 0,
    binCount: 0,
    missingShims: [],
    linked: false,
    mtimeMs: null,
  };

  try {
    if (!fsLike.existsSync(nodeModules)) {
      return {
        ...base,
        verdict: "absent",
        detail: `no node_modules — repair: npm install in ${root}`,
      };
    }

    const linked = fsLike.isLink(nodeModules);
    const mtimeMs = fsLike.statMtimeMs(nodeModules);
    const packageCount = countEntries(fsLike, nodeModules);

    if (packageCount <= STUB_MAX_PACKAGE_ENTRIES) {
      return {
        ...base,
        linked,
        mtimeMs,
        packageCount,
        verdict: "stub",
        detail:
          `node_modules holds only ${packageCount} entr${packageCount === 1 ? "y" : "ies"} ` +
          `(stub, not an install) — repair: npm install in ${root}`,
      };
    }

    const binDir = path.join(nodeModules, ".bin");
    const binCount = fsLike.existsSync(binDir) ? countEntries(fsLike, binDir) : 0;
    const missingShims = CRITICAL_BIN_SHIMS.filter(
      (shim) => !fsLike.existsSync(path.join(binDir, shim)) && !fsLike.existsSync(path.join(binDir, `${shim}.exe`)),
    );

    if (binCount < HEALTHY_MIN_BIN_ENTRIES || missingShims.length > 0) {
      return {
        ...base,
        linked,
        mtimeMs,
        packageCount,
        binCount,
        missingShims,
        verdict: "shim-stripped",
        detail:
          `${packageCount} packages present but .bin has ${binCount} entr${binCount === 1 ? "y" : "ies"}` +
          (missingShims.length > 0 ? ` (missing: ${missingShims.join(", ")})` : "") +
          ` — this is why '${CRITICAL_BIN_SHIMS[0]}' is not recognized; repair: npm install in ${root}`,
      };
    }

    return {
      ...base,
      linked,
      mtimeMs,
      packageCount,
      binCount,
      verdict: "healthy",
      detail: `${packageCount} packages, ${binCount} bin shims${linked ? " (linked)" : ""}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...base, verdict: "unknown", detail: `probe failed: ${message}` };
  }
}

/**
 * Resolve the home tree from git's common dir, so a worktree session finds the donor
 * it actually junctions to rather than guessing a path. Returns null when the session
 * IS the home tree, or when git cannot answer — in both cases there is no second tree
 * worth probing, and a failed resolve must never be reported as a missing donor.
 */
export function resolveDonorRoot(sessionRoot: string): string | null {
  try {
    const commonDir = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: sessionRoot,
      encoding: "utf8",
      windowsHide: true,
      timeout: 10_000,
    });
    if (commonDir.status !== 0) return null;
    const raw = (commonDir.stdout ?? "").trim();
    if (!raw) return null;
    const donor = path.dirname(raw);
    const normalize = (p: string) => path.resolve(p).replace(/\\/g, "/").toLowerCase();
    return normalize(donor) === normalize(sessionRoot) ? null : donor;
  } catch {
    return null;
  }
}

const VERDICT_SEVERITY: Record<HealthVerdict, number> = {
  healthy: 0,
  unknown: 1,
  "shim-stripped": 2,
  stub: 3,
  absent: 4,
};

/** Build the two-tree report. The overall verdict is the worst of the probed trees. */
export function buildHealthReport(
  sessionRoot: string,
  fsLike: HealthFs = defaultHealthFs,
  donorRootResolver: (root: string) => string | null = resolveDonorRoot,
): HealthReport {
  const session = probeTreeHealth(sessionRoot, "session", fsLike);
  const donorRoot = donorRootResolver(sessionRoot);
  const donor = donorRoot ? probeTreeHealth(donorRoot, "donor", fsLike) : null;

  const worst = [session, ...(donor ? [donor] : [])].reduce((a, b) =>
    VERDICT_SEVERITY[b.verdict] > VERDICT_SEVERITY[a.verdict] ? b : a,
  );

  const degraded = worst.verdict !== "healthy" && worst.verdict !== "unknown";
  const parts = [`session:${session.verdict}`, ...(donor ? [`donor:${donor.verdict}`] : [])];

  return {
    verdict: worst.verdict,
    session,
    donor,
    degraded,
    summary: degraded
      ? `${worst.role} tree ${worst.verdict}: ${worst.detail}`
      : `node_modules healthy (${parts.join(", ")})`,
  };
}

/** Compact fingerprint field for `session-precheck`'s one-line summary. */
export function formatHealthFingerprint(report: HealthReport): string {
  const parts = [`session:${report.session.verdict}`];
  if (report.donor) parts.push(`donor:${report.donor.verdict}`);
  return parts.join("/");
}

/**
 * Restore a damaged tree with `npm install`.
 *
 * Deliberately NOT wired into the probe path: a probe that silently mutates is a
 * probe nobody can trust to answer a question. The caller opts in, and the only
 * caller that should is an hourly lane repairing the shared donor.
 */
export function repairTree(root: string): { ok: boolean; durationMs: number; detail: string } {
  const startMs = Date.now();
  const result = spawnSync("npm", ["install"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    shell: process.platform === "win32",
    timeout: REPAIR_TIMEOUT_MS,
  });
  const durationMs = Date.now() - startMs;
  if (result.status === 0) {
    return { ok: true, durationMs, detail: `npm install succeeded in ${root}` };
  }
  const stderr = (result.stderr ?? "").toString().trim().split(/\r?\n/)[0] ?? "";
  return {
    ok: false,
    durationMs,
    detail: stderr || result.error?.message || "npm install failed",
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const shouldRepair = args.includes("--repair");
  const sessionRoot = process.cwd();

  let report = buildHealthReport(sessionRoot);
  const repairs: Array<{ root: string; ok: boolean; detail: string }> = [];

  if (shouldRepair && report.degraded) {
    for (const tree of [report.donor, report.session]) {
      if (!tree || tree.verdict === "healthy" || tree.verdict === "unknown") continue;
      const outcome = repairTree(tree.root);
      repairs.push({ root: tree.root, ok: outcome.ok, detail: outcome.detail });
    }
    report = buildHealthReport(sessionRoot);
  }

  if (asJson) {
    console.log(JSON.stringify({ ...report, repairs }));
  } else {
    console.log(`node-modules-health: ${report.verdict} — ${report.summary}`);
    for (const tree of [report.session, report.donor]) {
      if (!tree) continue;
      console.log(`- ${tree.role} (${tree.root}): ${tree.verdict} — ${tree.detail}`);
    }
    for (const r of repairs) {
      console.log(`- repair ${r.ok ? "OK" : "FAILED"} (${r.root}): ${r.detail}`);
    }
  }

  // Fail-soft by default: the probe reports, it does not gate. `--strict` is for a
  // lane that genuinely wants a non-zero exit to act on.
  process.exit(args.includes("--strict") && report.degraded ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
