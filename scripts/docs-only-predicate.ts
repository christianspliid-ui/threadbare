/**
 * THR-988 — one runnable docs-only predicate, derived from the constants CI already
 * agrees with, plus the machinery that pins the prose copies to it.
 *
 * ## The problem this closes
 *
 * CI's `detect` job decides whether a PR is documentation-only, and that decision
 * picks which gate track an agent owes. The rule was **hand-copied** into five prose
 * locations (CLAUDE.md, AGENTS.md, Docs/canon/process.md, the pull-work skill, and the
 * tb-opus-pickup prompt mirror). A hand-copied predicate is a fork with no update
 * path, and it drifted three times independently — THR-938's drain spec, AGENTS.md
 * (THR-955), and THR-922's own chase of the copies after widening `ci.yml`.
 *
 * It fails in the **expensive** direction rather than the unsafe one: a stale copy
 * makes a documentation PR pay the full ~15-minute code gate. Nothing goes red, so
 * nothing surfaces it — both discoveries so far were incidental, found while sweeping
 * for something else.
 *
 * ## Why behavioural equivalence, not string equality
 *
 * The copies are prose written for humans and agents, and they legitimately differ in
 * shape: `Docs/canon/process.md` and `AGENTS.md` inline the pattern mid-sentence to
 * *explain* the two trailing paths, while CLAUDE.md and the skill present it as a
 * fenced command. Pinning them to a byte-identical string would force cosmetic churn
 * (the canonical glob order differs from the order the prose reads best in) and would
 * fail on a reflow that changed nothing.
 *
 * So {@link comparePredicate} extracts each copy's pattern, **compiles it**, and
 * checks it classifies a fixture corpus identically to the canonical one. That is a
 * stricter test than string equality where it matters — it proves the fragments
 * actually compose — and looser only where the difference cannot affect a verdict.
 * The THR-946 merge-group assertions in `docs-code-decoupling.test.ts` take the same
 * shape, for the same reason: inspection alone cannot prove a pattern works.
 *
 * ## Scope limit worth knowing
 *
 * `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md` is a **mirror**. The prompt the
 * hourly lane actually executes lives outside version control at
 * `C:\\Users\\chris\\.claude\\scheduled-tasks\\tb-opus-pickup\\SKILL.md`, so no repo
 * gate can reach it. CLAUDE.md § Scheduled Tasks already requires editing both in the
 * same PR; this gate pins the half that is reachable.
 */

import { DOC_EXCLUDED_GLOBS, DOC_TO_CODE_ALLOWLIST } from "./generated-artifact-sources.ts";

/**
 * The ERE fragment a doc glob contributes to the predicate.
 *
 * Mirrors `ereFragmentForGlob` in `docs-code-decoupling.test.ts`, which derives the
 * same fragments for the merge-group predicate. Kept as its own function rather than
 * a lookup table so a new entry in {@link DOC_EXCLUDED_GLOBS} is translated rather
 * than silently dropped.
 */
function ereFragmentForGlob(glob: string): string {
  if (glob === "**/*.md") return "\\.md$";
  return `^${glob.replace(/\/\*\*$/, "").replaceAll(".", "\\.")}/`;
}

/** The ERE fragment for an allowlisted artifact — an exact path, never a prefix. */
function ereFragmentForArtifact(artifact: string): string {
  return `^${artifact.replaceAll(".", "\\.")}$`;
}

/**
 * The canonical alternation, derived from the two constants `ci.yml` is already
 * pinned to by `docs-code-decoupling.test.ts`. Deriving it here is what makes this
 * module a single source rather than a sixth copy.
 */
export const DOCS_ONLY_GREP_PATTERN = `(${[
  ...DOC_EXCLUDED_GLOBS.map(ereFragmentForGlob),
  ...DOC_TO_CODE_ALLOWLIST.map(ereFragmentForArtifact),
].join("|")})`;

/** The full one-liner the prose copies document, for agents who want to paste it. */
export const DOCS_ONLY_CLASSIFY_COMMAND = `git diff --name-only origin/main...HEAD | grep -vE '${DOCS_ONLY_GREP_PATTERN}'`;

/**
 * Fixtures the copies must agree on, one per way a predicate can be wrong.
 *
 * The two allowlisted artifacts are the fragments that have actually gone missing —
 * all three recorded drifts omitted exactly those — so they are the load-bearing
 * rows. The rest keep a copy from passing by being trivially permissive or trivially
 * strict.
 */
export const DOC_FIXTURES: readonly string[] = [
  "README.md",
  "AGENTS.md",
  "Docs/impediments.md",
  "Docs/canon/process.md",
  "Docs/plans/2026-08-05-example.md",
  "Design/briefing.md",
  ".planning/ROADMAP.md",
  ...DOC_TO_CODE_ALLOWLIST,
];

export const CODE_FIXTURES: readonly string[] = [
  "src/engine/graph.ts",
  "src/components/HexMapV2/HexMap.tsx",
  "src/data/unified-action-templates.ts",
  "scripts/interface-contracts.ts",
  ".github/workflows/ci.yml",
  "package.json",
  "index.html",
  // Adjacent to an allowlisted artifact but not it. The exclusions are exact paths,
  // never globs — the point is to exclude two named artifacts, not to carve a hole
  // in src/ or public/.
  "src/data/other.generated.json",
  "public/other-reference.html",
];

/** True when a changed path keeps a PR on the docs track. */
export function isDocsOnlyPath(file: string): boolean {
  return new RegExp(DOCS_ONLY_GREP_PATTERN).test(file.replaceAll("\\", "/"));
}

/** The paths that survive the grep — the ones that make a diff a code diff. */
export function survivingPaths(files: readonly string[]): string[] {
  return files.filter((file) => file.trim() !== "" && !isDocsOnlyPath(file));
}

/** The verdict CI's `detect` job would reach for the same file list. */
export function classifyDiff(files: readonly string[]): "docs-only" | "code" {
  return survivingPaths(files).length === 0 ? "docs-only" : "code";
}

/** Where a prose copy of the predicate lives, and what it is for. */
export type PredicateCopy = {
  readonly path: string;
  readonly why: string;
};

/**
 * Every in-repo prose copy of the predicate.
 *
 * Named rather than globbed (THR-688 rule A is about counts, but the same reasoning
 * applies): a glob over `**\/*.md` would silently stop covering a file that got
 * renamed, and would pick up any doc that merely quotes the pattern in passing.
 * Adding a sixth copy means adding a row here, which is the point — the row is
 * cheap and the drift it prevents is not.
 *
 * **A row tracks a literal copy, not a topic (THR-1336).** A file that classifies by
 * naming `npm run classify:diff` instead of inlining the regex carries no copy to
 * drift — it delegates to the one implementation this module already is — so it is
 * deliberately unregistered. Registering such a file makes the gate demand a literal
 * the file is right not to have, which is exactly how the CLAUDE.md diet went red:
 * the predicate moved to `Docs/canon/verification-gates.md` and the rows stayed
 * pointed at the two surfaces it had just been lifted out of. **When content moves,
 * the row moves with it** — repoint it at the file that now holds the literal, and
 * drop the row for a surface that became a pointer.
 */
export const PREDICATE_COPIES: readonly PredicateCopy[] = [
  {
    path: "Docs/canon/verification-gates.md",
    why: "the canonical prose copy — the gate authority page (was CLAUDE.md § Testing until THR-1336)",
  },
  { path: "AGENTS.md", why: "the non-CC agent instruction file" },
  { path: ".claude/skills/pull-work/SKILL.md", why: "the drain's mis-tag guard" },
  {
    path: "Docs/ops/scheduled-task-prompts/tb-opus-pickup.md",
    why: "mirror of the hourly lane's prompt (the live copy is unversioned)",
  },
];

/**
 * Pull the classification pattern out of a prose file.
 *
 * Matches `grep -vE '<pattern>'` anywhere in the file, fenced or mid-sentence, which
 * is what lets the copies keep their differing shapes. Returns every occurrence: a
 * file may legitimately carry the pattern more than once, and each must be current.
 */
export function extractGrepPatterns(source: string): string[] {
  return [...source.matchAll(/grep -vE '([^']+)'/g)].map((match) => match[1]);
}

export type PredicateDivergence = {
  readonly file: string;
  /** The fixture that the two predicates disagreed about, or null for a structural failure. */
  readonly fixture: string | null;
  readonly detail: string;
};

/**
 * Compare one extracted pattern against the canonical one over the fixture corpus.
 *
 * Compiles the extracted string — a pattern that looks right and does not compile is
 * a real failure, and `new RegExp` is the only thing that proves the fragments
 * compose.
 */
export function comparePredicate(file: string, pattern: string): PredicateDivergence[] {
  let compiled: RegExp;
  try {
    compiled = new RegExp(pattern);
  } catch (error) {
    return [
      {
        file,
        fixture: null,
        detail: `pattern does not compile as a RegExp: ${(error as Error).message}`,
      },
    ];
  }

  const divergences: PredicateDivergence[] = [];
  for (const fixture of [...DOC_FIXTURES, ...CODE_FIXTURES]) {
    const expected = isDocsOnlyPath(fixture);
    const actual = compiled.test(fixture);
    if (expected !== actual) {
      divergences.push({
        file,
        fixture,
        detail: expected
          ? `classifies ${fixture} as CODE; the canonical predicate classifies it as documentation ` +
            `(a docs PR carrying it would pay the full code gate)`
          : `classifies ${fixture} as DOCUMENTATION; the canonical predicate classifies it as code ` +
            `(a code PR carrying it would skip the suite)`,
      });
    }
  }
  return divergences;
}
