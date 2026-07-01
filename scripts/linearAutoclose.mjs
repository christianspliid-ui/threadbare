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

// THR-535: the pre-merge GUARD (flush-close-guard.yml) must detect anything GitHub's NATIVE
// Linear integration would act on — which is BROADER than extractCloseableIssueIds. The native
// integration closes an issue from BOTH the bare `Closes THR-123` form AND the issue-URL form
// `Closes https://linear.app/<org>/issue/THR-123/<slug>`. THR-525 was falsely closed by the
// URL form leaking into a flush PR body (via the SKILL.md Step 2f.4 fallback template), which
// the id-only pattern above deliberately ignores. So the guard needs a URL-aware detector.
export const CLOSE_KEYWORD_URL_PATTERN =
  /(?:Fixes|Closes|Resolves)\s+https?:\/\/linear\.app\/[^\s/]+\/issue\/(THR-\d+)/gi;

/**
 * Extract every issue id that GitHub's NATIVE Linear integration would close from these texts —
 * counting BOTH the `Closes THR-123` form AND the `Closes <linear-issue-url>` form. Used only by
 * the flush-PR close-keyword guard (THR-535), NOT by the custom auto-close action (which honours
 * the id form alone via extractCloseableIssueIds).
 *
 * @param {Array<string | null | undefined>} texts — PR title, body, commit messages, etc.
 * @returns {string[]} de-duplicated, upper-cased issue identifiers (e.g. ["THR-12", "THR-34"]).
 */
export function extractNativeCloseableIssueIds(texts) {
  const ids = new Set(extractCloseableIssueIds(texts));
  for (const text of texts) {
    if (!text) continue;
    // matchAll with a /g regex is stateless per-call on a fresh string; reset lastIndex defensively.
    CLOSE_KEYWORD_URL_PATTERN.lastIndex = 0;
    for (const [, id] of text.matchAll(CLOSE_KEYWORD_URL_PATTERN)) {
      ids.add(id.toUpperCase());
    }
  }
  return [...ids];
}

/**
 * Decide whether a PR must be BLOCKED from merging by the flush close-keyword guard (THR-535).
 *
 * A PR is blocked iff it is a docs-flush context (branch/title shape produced only by the
 * flush-plan-docs skill) AND its title, body, or any commit message carries a native-closeable
 * reference (`Closes|Fixes|Resolves THR-NNN` or the equivalent Linear issue URL). Title is scanned
 * defensively even though the spec names body/commits — the scan only runs once isFlush is true, so
 * a non-flush PR can never be blocked, and a future template that leaks a keyword into the title is
 * still caught (defense-in-depth, the whole point of the guard).
 *
 * @param {{ branch?: string|null, title?: string|null, body?: string|null, commitMessages?: Array<string|null|undefined> }} ctx
 * @returns {{ blocked: boolean, isFlush: boolean, offendingIds: string[] }}
 */
export function evaluateFlushCloseGuard({ branch, title, body, commitMessages = [] } = {}) {
  const isFlush = isDocsFlushContext({ branch, title });
  if (!isFlush) return { blocked: false, isFlush: false, offendingIds: [] };
  const offendingIds = extractNativeCloseableIssueIds([title, body, ...commitMessages]);
  return { blocked: offendingIds.length > 0, isFlush: true, offendingIds };
}
