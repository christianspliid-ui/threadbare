/**
 * Shared predicate for the coordination-block gate (THR-836).
 *
 * `pull-work` Step 3 and `check:process`'s `handoff-keywords` check must agree on one question:
 * when a `Ready for Dev` issue's latest comment is missing `Suggested model` / `Parallel-safe with`
 * / `Mutex with`, does that *stop* the executor, or merely note a filing-path miss?
 *
 * The answer turns on whether the ticket is **self-scoped** — whether its description names a
 * concrete surface. A design-session handoff or a T1 promotion coordinates work a *different*
 * party will pick up, and the three lines are that coordination made legible. A ticket the lane
 * filed for itself, naming the file it means to change, was never coordinated by a second party;
 * demanding the artifact of coordination from it is a category error, and applying the gate that
 * way produced either a lost run or a per-pickup ritual reversal on nearly every candidate.
 *
 * Living here rather than inside `check-process.ts` so it is importable by tests: that script runs
 * `void main()` at module scope, so importing it would execute the whole lint.
 */

/**
 * Two alternatives, deliberately generous: a repo-relative path under a known top-level directory,
 * or a bare filename carrying a code/doc extension. Generosity is the right bias — a false
 * "self-scoped" costs one derived coordination block, while a false "unscoped" bounces real work
 * out of the queue.
 */
export const SELF_SCOPED_SURFACE_PATTERN =
  /(?:\b(?:src|scripts|Docs|public|\.claude|\.github)\/[\w./-]+)|(?:\b[\w.-]+\.(?:ts|tsx|js|jsx|md|json|ya?ml|ps1|sh)\b)/;

export type CoordinationBlockGap = {
  /** True when the description names a concrete file or symbol. */
  selfScoped: boolean;
  /** `warn` for a self-scoped ticket (claimable), `error` for an unscoped one (bounces). */
  severity: "error" | "warn";
  /** Human-readable consequence, appended to the lint finding so the message states the outcome. */
  consequence: string;
};

/**
 * Classify a `Ready for Dev` issue that is missing some or all of its coordination block.
 * Callers should only invoke this once they know a line is actually missing.
 */
export function classifyCoordinationBlockGap(description: string | null | undefined): CoordinationBlockGap {
  const selfScoped = SELF_SCOPED_SURFACE_PATTERN.test(description ?? "");
  return {
    selfScoped,
    severity: selfScoped ? "warn" : "error",
    consequence: selfScoped
      ? "self-scoped, so pull-work Step 3 claims it and derives the block; the filing path should have posted one"
      : "unscoped (description names no file or symbol), so pull-work Step 3 bounces it to Todo for re-authoring",
  };
}
