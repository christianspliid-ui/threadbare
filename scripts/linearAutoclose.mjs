// Pure helpers for the Linear Auto-Close GitHub Action (.github/workflows/linear-autoclose.yml).
//
// Extracted from the inline github-script so the auto-close decision is deterministic,
// inspectable, and unit-testable (NFP #2 Inspectability, NFP #3 Determinism). See THR-487
// (merge = Done) for the action's purpose and THR-510 for the docs-flush guard rationale.
//
// THR-510: plan-doc flush PRs and impediment-log PRs were sweeping every referenced
// THR-XXX issue to Done. The systemic recurring vector is the `flush-plan-docs` skill,
// whose PRs are now scrubbed of closeable references. This guard is the deterministic
// belt-and-suspenders: a docs-flush PR must NEVER auto-close any issue, even if a closing
// keyword ever leaks back into its title or body.

// Magic-word close pattern. A bare `THR-123` token or a `linear.app/.../issue/THR-123` URL
// must NOT match — only an explicit `Fixes|Closes|Resolves THR-123` reference counts as a
// deliberate close request. The `\b` after `Resolves` etc. is implicit in `\s+`.
export const CLOSE_KEYWORD_PATTERN = /(?:Fixes|Closes|Resolves)\s+(THR-\d+)/gi;

/**
 * Extract the set of Linear issue identifiers that the given texts explicitly request to close.
 * Only `Fixes|Closes|Resolves THR-NNN` forms count; bare identifiers and issue URLs are ignored.
 *
 * @param {Array<string | null | undefined>} texts — commit messages, PR title, PR body, etc.
 * @returns {string[]} de-duplicated, upper-cased issue identifiers (e.g. ["THR-12", "THR-34"]).
 */
export function extractCloseableIssueIds(texts) {
  const ids = new Set();
  for (const text of texts) {
    if (!text) continue;
    // matchAll with a /g regex is stateless per-call on a fresh string; reset lastIndex defensively.
    CLOSE_KEYWORD_PATTERN.lastIndex = 0;
    for (const [, id] of text.matchAll(CLOSE_KEYWORD_PATTERN)) {
      ids.add(id.toUpperCase());
    }
  }
  return [...ids];
}

// Branch / title shapes produced ONLY by the flush-plan-docs skill (THR-510). These contexts
// commit design docs — they never resolve the issue whose plan doc they carry — so they must
// be exempt from auto-close. Real feature/closeout PRs use feature branches and never match.
export const DOCS_FLUSH_BRANCH_PATTERN = /^docs\/plan-flush-/i;
export const DOCS_FLUSH_TITLE_PATTERN = /^docs\(plan\):\s*batch flush/i;

/**
 * True when the triggering PR is an automated plan-doc flush, which must never auto-close issues.
 *
 * @param {{ branch?: string | null, title?: string | null }} ctx
 * @returns {boolean}
 */
export function isDocsFlushContext({ branch, title } = {}) {
  if (branch && DOCS_FLUSH_BRANCH_PATTERN.test(branch)) return true;
  if (title && DOCS_FLUSH_TITLE_PATTERN.test(title)) return true;
  return false;
}
