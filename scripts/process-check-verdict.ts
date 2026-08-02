/**
 * Coverage-aware verdict for `check:process` (THR-828).
 *
 * The defect this closes: three of the lint's most valuable assertions — recent plan references,
 * orphan issues, Ready-for-Dev handoff keywords — are gated on `LINEAR_API_KEY`, and a scheduled
 * lane legitimately runs without it. The script degraded that to a single warning and then printed
 * `check:process passed with 1 warning(s).` A reader greps for the pass string, gets a true match,
 * and forms a false impression of what was covered. That is worse than an unread advisory gate: the
 * output actively asserts a pass for coverage it does not have.
 *
 * The fix is deliberately *not* to hard-fail without credentials — that would break the scheduled
 * lane for no correctness gain. It is that **"passed" must not describe a run whose checks were
 * skipped**. So a skipped sub-check registers here and forces the `passed-with-gaps` verdict, and
 * the summary line names what did not run and why. Exit-code semantics are unchanged: `passed` and
 * `passed-with-gaps` both exit 0, only `failed` exits 1.
 *
 * On grepping: `passed-with-gaps` shares a prefix with `passed`, so a bare `grep "check:process
 * passed"` still matches both. That is inherent to the vocabulary and is why every emitted line
 * puts a non-space, non-period character immediately after the verdict token — `grep -E
 * "check:process passed[ .]"` matches only a genuinely covered run.
 *
 * Living in its own module rather than inside `check-process.ts` so it is importable by tests:
 * that script runs `void main()` at module scope, so importing it would execute the whole lint.
 * Same reason `coordination-block-predicate.ts` sits beside it.
 */

/** A sub-check that did not execute, and the precondition whose absence stopped it. */
export type SkippedCheck = {
  /** Human-readable sub-check name, as it appears in the summary line. */
  check: string;
  /** Why it did not run — an unset credential, a failed fetch, a missing runner. */
  reason: string;
};

export type ProcessVerdict = "passed" | "passed-with-gaps" | "failed";

/**
 * The sub-checks `runLinearChecks` cannot perform without `LINEAR_API_KEY`. Named once so the
 * warning text and the skip registry cannot drift apart — they are rendered from this same list.
 */
export const LINEAR_BACKED_CHECK_NAMES = [
  "recent plan references",
  "orphan issues",
  "Ready-for-Dev handoff keywords",
] as const;

/** The reason string attached to every sub-check skipped for want of a Linear credential. */
export const LINEAR_KEY_MISSING_REASON = "LINEAR_API_KEY unset";

/**
 * Three-state verdict. Errors dominate; absent errors, any skipped sub-check downgrades a pass.
 * A run with zero errors and zero skips is the only thing allowed to call itself `passed`.
 */
export function resolveVerdict(errorCount: number, skippedCount: number): ProcessVerdict {
  if (errorCount > 0) return "failed";
  return skippedCount > 0 ? "passed-with-gaps" : "passed";
}

/** `name (reason), name (reason)` — the body of the gap clause. */
export function formatSkippedChecks(skipped: readonly SkippedCheck[]): string {
  return skipped.map(({ check, reason }) => `${check} (${reason})`).join(", ");
}

/**
 * The single line a reader greps. Carries the verdict, the finding counts, and — when coverage was
 * incomplete — which sub-checks did not run and why.
 */
export function formatSummaryLine(input: {
  errorCount: number;
  warnCount: number;
  skipped: readonly SkippedCheck[];
}): string {
  const { errorCount, warnCount, skipped } = input;
  const verdict = resolveVerdict(errorCount, skipped.length);
  const gapClause =
    skipped.length > 0
      ? ` ${skipped.length} sub-check(s) did not run — ${formatSkippedChecks(skipped)}.`
      : "";

  if (verdict === "failed") {
    return `check:process failed with ${errorCount} error(s) and ${warnCount} warning(s).${gapClause}`;
  }
  if (verdict === "passed-with-gaps") {
    return `check:process passed-with-gaps: ${warnCount} warning(s).${gapClause}`;
  }
  return warnCount > 0
    ? `check:process passed with ${warnCount} warning(s).`
    : "check:process passed (no findings).";
}
