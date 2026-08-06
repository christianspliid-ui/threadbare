/**
 * Shared predicate for the promotion-time plan-doc liveness gate (THR-921).
 *
 * Three lanes must agree on one question: when an issue names a plan doc, does that path
 * resolve on `origin/main` — the branch point every executor worktree is cut from?
 *
 * Twice in the week of 2026-07-30 an issue reached `Ready for Dev` naming a plan doc that
 * existed only on an unmerged `docs/plan-*` PR branch (impediments #321 / THR-884, #325 /
 * THR-887). `pull-work` Step 6 says "read the plan doc before touching code"; with the path
 * 404'ing, the executor's only options were to bounce, reconstruct the design from the issue
 * body, or chase an unmerged branch. In THR-887's case the Done-when *itself* named a wiki
 * page living solely on that PR, making it unsatisfiable by construction from the natural
 * branch point.
 *
 * This module holds the extraction + classification halves so the promoting lanes
 * (`design-session` handoff, `orchestrator` T1), the defensive read (`pull-work` Step 6), and
 * the board lint (`check:process`) cite one implementation rather than three prose copies —
 * the drift THR-836 shipped `coordination-block-predicate.ts` to prevent, and that THR-895
 * later found had opened anyway between the skill and the lint.
 *
 * Pure by construction: no git, no network, no `process`. Callers supply the resolution
 * results. That is what makes it testable without a fixture repo.
 */

/**
 * Plan-doc-shaped paths only — `Docs/plans/…md` and `Docs/audits/…md` (including nested
 * audit directories).
 *
 * **Why this is narrow, deliberately.** THR-921's fix text says "every repo path named in the
 * issue description/handoff comment", which read literally would also check `src/…` and
 * `scripts/…` paths. Those are usually paths the ticket exists to *create or edit*, so
 * demanding they resolve on `origin/main` would report an error on the majority of well-formed
 * tickets — a false-positive rate that trains readers to ignore the gate, which is the exact
 * failure mode THR-895 documents for `handoff-keywords`. A plan doc is different in kind: it
 * is an artifact the executor must *read before* writing anything, so at promotion time it
 * exists or the promotion is premature. The narrow set is the one where "absent" is
 * unambiguously a defect.
 *
 * Deliberately **not** global: a `/g` regex carries `lastIndex` across calls, so an exported one
 * makes `.test()` alternate true/false on identical input. `extractPlanDocPaths` builds its own
 * global copy instead.
 */
export const PLAN_DOC_PATH_PATTERN = /\bDocs\/(?:plans|audits)\/[\w./-]*[\w-]\.md\b/;

/** Bounds the open-PR scan a resolver may run when a path is absent from `origin/main`. */
export const MAX_PRS_TO_SCAN = 20;

export type PlanDocLivenessStatus =
  /** Resolves on `origin/main` — the executor can read it from any fresh worktree. */
  | "live"
  /** Absent from `origin/main`, but carried by an open PR — merge that PR, then promote. */
  | "stranded"
  /** Absent from `origin/main` and from every open PR scanned. */
  | "missing"
  /** Absent from `origin/main`; the open-PR scan could not run, so stranded-vs-missing is undecided. */
  | "unresolved";

export type PlanDocResolution = {
  readonly path: string;
  /** Whether `git cat-file -e origin/main:<path>` succeeded. */
  readonly onMain: boolean;
  /** Open PR number carrying the path, when a scan ran and found one. */
  readonly openPrNumber?: number | null;
  /** False when the open-PR scan was skipped or errored — keeps "did not run" distinct from "found nothing" (THR-828). */
  readonly prScanRan?: boolean;
};

export type PlanDocVerdict = {
  readonly path: string;
  readonly status: PlanDocLivenessStatus;
  /** `live` is fine; everything else blocks a promotion. */
  readonly blocksPromotion: boolean;
  readonly message: string;
};

/**
 * Pull plan-doc paths out of issue text (description, handoff comment, or both concatenated).
 * Deduped, order-preserving. Backticks, bold markers and trailing punctuation fall outside the
 * pattern, so ``**Plan doc:** `Docs/plans/x.md` `` yields the bare path.
 */
export function extractPlanDocPaths(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(new RegExp(PLAN_DOC_PATH_PATTERN.source, "g")) ?? [];
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const match of matches) {
    const normalized = match.replaceAll("\\", "/");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    paths.push(normalized);
  }
  return paths;
}

/**
 * Every plan-doc path an issue names, across **both** carrying surfaces.
 *
 * The two-place rule (CLAUDE.md) deliberately writes the path into the description *and* the
 * handoff comment so neither is a single point of failure — THR-884 had it correctly in both,
 * and was still unreadable because the doc was on an unmerged PR. So the gate must read both
 * and dedupe, never just the latest comment: reading one surface only is exactly the defect
 * THR-895 found in `check:process`'s `handoff-keywords`, where a block written in the
 * description reported as missing.
 *
 * Lives here rather than inline in the lint so it is unit-testable — `check-process.ts` runs
 * `void main()` at module scope and its Linear branch needs an API key, so logic left inside
 * it cannot be exercised by a test.
 */
export function extractPlanDocPathsFromIssue(issue: {
  readonly description?: string | null;
  readonly comments?: readonly { readonly body?: string | null }[] | null;
}): string[] {
  const surfaces = [issue.description ?? "", ...(issue.comments ?? []).map((c) => c?.body ?? "")];
  return extractPlanDocPaths(surfaces.join("\n"));
}

/**
 * Classify one resolved path. Callers do the git/`gh` work; this decides what it means.
 *
 * Note `unresolved` is not folded into `missing`: a skipped PR scan is the absence of an
 * answer, not a negative one, and reporting it as `missing` would tell a promoting lane to
 * hold for a reason nobody verified.
 */
export function classifyPlanDocLiveness(resolution: PlanDocResolution): PlanDocVerdict {
  const { path, onMain, openPrNumber, prScanRan } = resolution;

  if (onMain) {
    return {
      path,
      status: "live",
      blocksPromotion: false,
      message: `${path} resolves on origin/main.`,
    };
  }

  if (openPrNumber != null) {
    return {
      path,
      status: "stranded",
      blocksPromotion: true,
      message:
        `${path} is stranded on unmerged PR #${openPrNumber} — it 404s in any worktree cut from origin/main. ` +
        `Hold the promotion until that PR merges (CI-gated and auto-merged, so minutes — unless it is stuck, ` +
        `which is the signal to surface rather than mask).`,
    };
  }

  if (prScanRan === false) {
    return {
      path,
      status: "unresolved",
      blocksPromotion: true,
      message:
        `${path} is absent from origin/main, and the open-PR scan did not run — cannot tell stranded from ` +
        `missing. Re-run with 'gh' available before promoting.`,
    };
  }

  return {
    path,
    status: "missing",
    blocksPromotion: true,
    message:
      `${path} is absent from origin/main and from every open PR scanned — the named plan doc does not exist ` +
      `anywhere yet. Author and merge it before promoting, or correct the path.`,
  };
}

/** Convenience roll-up: the promotion is clear only when no verdict blocks it. */
export function summarizePlanDocLiveness(verdicts: readonly PlanDocVerdict[]): {
  readonly ok: boolean;
  readonly blocking: readonly PlanDocVerdict[];
} {
  const blocking = verdicts.filter((verdict) => verdict.blocksPromotion);
  return { ok: blocking.length === 0, blocking };
}
