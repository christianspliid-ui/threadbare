/**
 * Collision-free allocation of the next impediment `#` (THR-1028).
 *
 * ## The defect this closes
 *
 * Until now the next impediment id was chosen by eye: `.claude/skills/impediment-reporter/SKILL.md`
 * said *"Use the next sequential `#`"*, and every session computed `max(ids in the
 * working tree) + 1`. The working tree cannot see a row sitting on `origin/main`'s
 * unmerged future or on another in-flight branch, so the number was free when it was
 * allocated and duplicated the instant the merge landed — a red required check on a
 * PR whose author wrote the row correctly.
 *
 * THR-1018 shipped the *repair* (`check:impediment-ids --fix`). This module is the
 * *allocation* half it explicitly left open in impediment #460's "Still your problem
 * (rule 2)" paragraph.
 *
 * ## Why a ref scan rather than a new id scheme
 *
 * A content-derived key cannot collide by construction, and was declined twice
 * (THR-881, and again here): the `#N` format is load-bearing across ~500 rows and
 * ~25 prose cross-references in `Docs/`, the retros and an audit report. So the id
 * stays a hand-readable integer, and the fix is to widen what "the highest id so
 * far" is computed against — from *this tree* to *every ref in the shared object
 * store*, which is where the unmerged rows actually live.
 *
 * That covers the shape all four recorded occurrences of #460 took: a branch that
 * outlives one closeout merge, or a second worktree that has already committed its
 * row. Both put the competing row on a ref this scan reads.
 *
 * ## What it deliberately does not close
 *
 * Sequential integers have no collision-free allocation without a coordinator, and
 * this module is not one. Two branches that each append a row and *neither commits*
 * before the other allocates will still pick the same number — the observation
 * window is the only thing being widened, not eliminated. That residue is stated in
 * {@link ALLOCATION_RESIDUE} rather than left for a future session to rediscover,
 * and `check:impediment-ids -- --fix` remains the repair when it happens.
 *
 * The window is seconds wide under WIP=1 with a single executor; the window this
 * replaces was "any branch that lives long enough for one closeout to merge
 * underneath it", which is every non-trivial PR.
 *
 * ## Structure
 *
 * The pure half ({@link highestTableNum}, {@link allocateFromSources},
 * {@link findLatentCollisions}) takes markdown and returns numbers, so the
 * allocation rule is testable without a git fixture. The git half
 * ({@link listAllocationRefs}, {@link readLogAtRefs}) is fail-soft throughout
 * (NFP #4): no git, no remote, or a fresh clone degrades to the working tree alone
 * and says so, rather than refusing to mint an id.
 */

import { execFileSync } from "node:child_process";

import { parseImpedimentLog } from "./impediment-log.ts";

/**
 * The log's path as **git** names it — forward slashes on every platform.
 *
 * Note every git call in this module goes through `execFileSync` with an argv
 * array, never a shell string. That matters on Windows: MSYS rewrites a
 * `<rev>:<path>` argument into a Windows path when it passes through a bash layer,
 * which turns `git show` into a spurious "path does not exist" (the false negative
 * recorded against `git show rev:path`). No shell, no rewrite.
 */
export const IMPEDIMENT_LOG_GIT_PATH = "Docs/impediments.md";

/**
 * Ref namespaces the allocation observes.
 *
 * `refs/heads` catches another worktree's committed-but-unpushed branch — worktrees
 * share one object store, so a sibling lane's row is visible the moment it commits.
 * `refs/remotes` catches `origin/main` and every pushed PR branch, which is where a
 * merge that is about to land underneath you lives.
 *
 * Merged and stale branches are scanned too. They cost a blob read and can only
 * ever report a number at or below `main`'s, so filtering them would add a
 * staleness judgment for no gain in the answer.
 */
export const ALLOCATION_REF_NAMESPACES = ["refs/heads", "refs/remotes"] as const;

/**
 * Ceiling on distinct log blobs read in one allocation.
 *
 * Refs are deduplicated by blob sha first, so this is reached only by a repo whose
 * branches carry that many genuinely different versions of the log. It exists so a
 * pathological ref count degrades to a partial (still wider than working-tree-only)
 * scan with a warning, instead of stalling the session that is trying to log an
 * impediment.
 */
export const MAX_ALLOCATION_BLOBS = 250;

/** Emitted when the scan cannot be widened at all — see the header's fail-soft note. */
export const ALLOCATION_DEGRADED_WARNING =
  "git refs unreadable — allocated against the working tree alone, which is the pre-THR-1028 behaviour and can collide";

/**
 * The one case a widened scan still cannot see, stated where the allocator can
 * point at it rather than in prose someone has to find.
 */
export const ALLOCATION_RESIDUE =
  "two branches that each append a row and neither commits before the other allocates still collide — commit the row, or repair after the merge with `npm run check:impediment-ids -- --fix`";

/** One log version the allocation observed, and the highest `#` it carries. */
export type AllocationSource = {
  /** `working tree`, or the ref the blob was read from. */
  label: string;
  highest: number;
};

export type Allocation = {
  /** The id to use. Always ≥ 1. */
  nextId: number;
  /** Highest `#` seen across every source. 0 when no source carried a numeric row. */
  highest: number;
  /** Which source set {@link highest} — the answer to "why is it not one more than mine?". */
  highestFrom: string;
  sources: AllocationSource[];
  /** True when no ref could be read and the answer rests on the working tree alone. */
  degraded: boolean;
  warnings: string[];
};

/**
 * The ref latent collisions are judged against: the branch this work will merge into.
 *
 * Scoping matters more here than for allocation. Allocation takes a *max* across
 * refs, so scanning an ancient branch is free — its number can only be lower.
 * Collision detection compares *text per id*, and the log has been renumbered and
 * rewritten across its history, so an old branch's `#9` is a different impediment
 * than today's `#9` by ordinary drift. Measured on this repo: comparing against all
 * refs reported 211 "collisions", none of them real. Against the merge target it
 * reports the ones that will actually redden the required check — which is the only
 * question a session about to push is asking.
 */
export const COLLISION_BASE_REF = "refs/remotes/origin/main";

/**
 * An id the working tree claims that {@link COLLISION_BASE_REF} already claims for a
 * **different** impediment — a collision that exists now and goes red on merge.
 *
 * Same-text matches are excluded on purpose: that is this branch's own row seen
 * through a ref that already carries it, which is not a collision and would make the
 * warning fire on every well-behaved branch.
 */
export type LatentCollision = {
  num: string;
  /** The ref that also claims this number. */
  ref: string;
  /** The local row's Description cell, trimmed for display. */
  localDescription: string;
  /** The competing row's Description cell, trimmed for display. */
  otherDescription: string;
};

/** Every numeric table `#` in one log's markdown. Paragraph entries carry synthetic ids and are excluded. */
function tableNums(markdown: string): Map<string, string> {
  const byNum = new Map<string, string>();
  for (const entry of parseImpedimentLog(markdown).entries) {
    if (entry.form !== "table") continue;
    if (!Number.isFinite(Number.parseInt(entry.num, 10))) continue;
    // First row wins: a log that already carries a duplicate is a repair problem,
    // not an allocation one, and the allocator must still return a usable number.
    if (!byNum.has(entry.num)) byNum.set(entry.num, entry.description);
  }
  return byNum;
}

/**
 * Highest numeric table `#` in one log's markdown; `0` when it carries none.
 *
 * Pure, so the allocation rule can be pinned against fixture strings rather than
 * against whatever the live log happens to hold this week.
 */
export function highestTableNum(markdown: string): number {
  let highest = 0;
  for (const num of tableNums(markdown).keys()) {
    const parsed = Number.parseInt(num, 10);
    if (Number.isFinite(parsed) && parsed > highest) highest = parsed;
  }
  return highest;
}

/**
 * The allocation rule: one above the highest `#` any observed source carries.
 *
 * Taking the max across sources rather than per-source is the whole point — a
 * branch whose own log stops at #480 must still mint #485 when `origin/main` has
 * reached #484, or it re-creates the defect on its next append.
 */
export function allocateFromSources(
  inputs: readonly { label: string; markdown: string }[],
  warnings: readonly string[] = [],
): Allocation {
  const sources: AllocationSource[] = inputs.map((input) => ({
    label: input.label,
    highest: highestTableNum(input.markdown),
  }));

  let highest = 0;
  let highestFrom = "none";
  for (const source of sources) {
    if (source.highest > highest) {
      highest = source.highest;
      highestFrom = source.label;
    }
  }

  return {
    nextId: highest + 1,
    highest,
    highestFrom,
    sources,
    degraded: sources.length <= 1,
    warnings: [...warnings],
  };
}

/**
 * Ids the working tree claims that another ref claims for a different impediment.
 *
 * This is the *detection* half of the same defect: the membership predicate is
 * "exposed to a collision it did not cause **and cannot detect locally**", and a
 * correct allocator only fixes the first clause. A branch that allocated before
 * this shipped, or whose row was written by hand, can still be carrying one.
 */
export function findLatentCollisions(
  localMarkdown: string,
  others: readonly { label: string; markdown: string }[],
): LatentCollision[] {
  const local = tableNums(localMarkdown);
  const collisions: LatentCollision[] = [];
  const seen = new Set<string>();

  for (const other of others) {
    for (const [num, otherDescription] of tableNums(other.markdown)) {
      const localDescription = local.get(num);
      if (localDescription === undefined) continue;
      if (localDescription === otherDescription) continue;
      const key = `${num} ${other.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collisions.push({ num, ref: other.label, localDescription, otherDescription });
    }
  }

  return collisions.sort(
    (a, b) => Number.parseInt(a.num, 10) - Number.parseInt(b.num, 10) || a.ref.localeCompare(b.ref),
  );
}

function git(repoRoot: string, args: string[], maxBuffer = 64 * 1024 * 1024): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** Every local and remote ref, newest-first so a truncated scan keeps the likeliest sources. */
export function listAllocationRefs(repoRoot: string): string[] {
  try {
    return git(repoRoot, [
      "for-each-ref",
      "--sort=-committerdate",
      "--format=%(refname)",
      ...ALLOCATION_REF_NAMESPACES,
    ])
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return []; // Fail-soft (NFP #4): no git, or not a repo.
  }
}

/**
 * Reads the log as of each ref, deduplicated by blob sha.
 *
 * Deduplication is what keeps this affordable: ~95 refs in this repo resolve to a
 * few dozen distinct versions of a 1 MB file, and reading each ref blindly would
 * mean ~95 MB of process output to answer a question about one integer. One
 * `cat-file --batch-check` resolves every ref to a sha in a single process; only
 * distinct shas are then read.
 *
 * A ref whose tree has no log at all (an old branch, an unrelated history) reports
 * `missing` and is skipped rather than failing the scan.
 */
export function readLogAtRefs(
  repoRoot: string,
  refs: readonly string[],
): { sources: { label: string; markdown: string }[]; warnings: string[] } {
  const warnings: string[] = [];
  if (refs.length === 0) return { sources: [], warnings };

  let batch: string;
  try {
    batch = execFileSync("git", ["cat-file", "--batch-check=%(objectname)"], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["pipe", "pipe", "ignore"],
      input: refs.map((ref) => `${ref}:${IMPEDIMENT_LOG_GIT_PATH}`).join("\n") + "\n",
    });
  } catch {
    return { sources: [], warnings }; // Fail-soft: caller degrades to the working tree.
  }

  const lines = batch.split(/\r?\n/);
  const firstRefForSha = new Map<string, string>();

  for (let index = 0; index < refs.length; index += 1) {
    const line = (lines[index] ?? "").trim();
    // `<sha>` on success; `<rev> missing` when the path is absent at that ref.
    if (!line || line.includes(" ")) continue;
    if (!firstRefForSha.has(line)) firstRefForSha.set(line, refs[index]);
  }

  const sources: { label: string; markdown: string }[] = [];
  let read = 0;

  for (const [sha, ref] of firstRefForSha) {
    if (read >= MAX_ALLOCATION_BLOBS) {
      warnings.push(
        `scan truncated at ${MAX_ALLOCATION_BLOBS} distinct log versions (${firstRefForSha.size} present) — ` +
          "the highest id may sit on an unscanned ref",
      );
      break;
    }
    try {
      sources.push({ label: ref, markdown: git(repoRoot, ["cat-file", "blob", sha]) });
      read += 1;
    } catch {
      warnings.push(`could not read ${ref}:${IMPEDIMENT_LOG_GIT_PATH} — skipped`);
    }
  }

  return { sources, warnings };
}

/**
 * Fetches `origin` so `origin/main` and every pushed PR branch are current.
 *
 * Best-effort and quiet: the sandbox is frequently offline, and an allocation that
 * refuses to answer without a network is worse than one computed from slightly
 * stale refs. Returns whether the fetch actually ran, so the caller can say which
 * it got.
 */
export function refreshRemoteRefs(repoRoot: string): boolean {
  try {
    git(repoRoot, ["fetch", "origin", "--quiet", "--prune"], 8 * 1024 * 1024);
    return true;
  } catch {
    return false; // Fail-soft (NFP #4).
  }
}

export type AllocateOptions = {
  /** Skip the `git fetch`. Set by `--no-fetch`, and by tests, which drive local refs only. */
  fetch?: boolean;
};

/**
 * The whole allocation: refresh, scan every ref, and return one above the highest
 * `#` anything carries — plus any latent collision the working tree already has.
 */
export function allocateNextImpedimentId(
  repoRoot: string,
  workingTreeMarkdown: string,
  options: AllocateOptions = {},
): Allocation & { latentCollisions: LatentCollision[]; fetched: boolean } {
  const fetched = options.fetch === false ? false : refreshRemoteRefs(repoRoot);
  const scanned = listAllocationRefs(repoRoot);
  // The base ref leads the scan so that when its blob is shared with another ref —
  // common, since most branches sit at or near `main` — the deduplicated source is
  // labelled with the base and stays findable below. `readLogAtRefs` keeps the
  // FIRST ref for each sha, so order is what decides the label.
  const refs = [COLLISION_BASE_REF, ...scanned.filter((ref) => ref !== COLLISION_BASE_REF)];
  const { sources: refSources, warnings } = readLogAtRefs(repoRoot, refs);

  if (refSources.length === 0) warnings.push(ALLOCATION_DEGRADED_WARNING);

  const allocation = allocateFromSources(
    [{ label: "working tree", markdown: workingTreeMarkdown }, ...refSources],
    warnings,
  );

  const base = refSources.filter((source) => source.label === COLLISION_BASE_REF);

  return {
    ...allocation,
    latentCollisions: findLatentCollisions(workingTreeMarkdown, base),
    fetched,
  };
}
