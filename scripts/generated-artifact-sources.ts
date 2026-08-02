/**
 * Source→output direction for every committed generated artifact, and the guard
 * that stops a new doc→code coupling growing back unnoticed (THR-922 Part B).
 *
 * ## The coupling this classifies
 *
 * CI's `detect` job treats a PR as documentation-only when every changed file is a
 * doc — `**\/*.md`, `Docs/**`, `.planning/**`, `Design/**` — and skips the ~15
 * minute `Test · Typecheck · Build` job when so. That is the fast path doc work is
 * supposed to take.
 *
 * A generator can silently revoke it. If an artifact's *inputs* are documentation
 * but its *output* lands in `src/` or `public/`, then editing a doc regenerates a
 * non-doc file, the PR stops classifying as docs-only, and the doc edit pays the
 * full code gate. Measured on commit `cc7a61ca` — a pure documentation deliverable
 * (a wiki page plus a UL shard) that carried `src/data/ul-dashboard.generated.json`
 * and several `public/*.html`, and paid the whole suite for it.
 *
 * ## Why excluding the output path is safe
 *
 * The fix is to exclude the *artifact* from the `code` filter, never its sources.
 * That cannot weaken change detection, because a code source is its own separate
 * path and stays in the filter: edit `scripts/interface-contracts.ts` and `code`
 * is true because *that file* is not a doc, whatever we say about the HTML it
 * generates. The exclusion only removes the artifact's ability to *manufacture*
 * code-ness on a PR whose real content is documentation.
 *
 * Their correctness guarantee is unchanged and does not depend on the test job:
 * `check:generated-freshness` re-runs the whole `prebuild` and fails on any stale
 * artifact, and since THR-909 it runs in the `docs-check` job on documentation
 * PRs. So an excluded artifact is still regenerated and still compared on exactly
 * the PRs that can change it.
 *
 * ## Pure versus mixed
 *
 * The originating ticket described members as artifacts whose inputs *all* live
 * inside the doc-excluded paths. The manifest disagrees for one of the two it
 * named: `public/system-interface-map-reference.html` declares
 * `Docs/canon/interface-map.md` **plus** two `scripts/*.ts` sources. It is still a
 * genuine member of the problem — a canon-page edit alone regenerates it and drags
 * the PR onto the code track — so the predicate here is "**at least one** doc
 * source, and a non-doc output", with `pure` and `mixed` reported separately. The
 * safety argument above holds identically for both.
 */

/**
 * The doc-excluded globs, mirroring `.github/workflows/ci.yml`'s `detect` job and
 * the docs-only predicate in CLAUDE.md. A file matching any of these is
 * documentation as far as change detection is concerned.
 */
export const DOC_EXCLUDED_GLOBS = ["**/*.md", "Docs/**", ".planning/**", "Design/**"] as const;

/** Directory prefixes from {@link DOC_EXCLUDED_GLOBS}, for prefix matching. */
const DOC_PATH_PREFIXES = ["Docs/", ".planning/", "Design/"] as const;

/**
 * Declared inputs per entry in `STATIC_GENERATED_PATHS`.
 *
 * Hand-declared because a generator's inputs are not machine-derivable here — the
 * scripts are esbuild-bundled and read paths at runtime. The
 * {@link everyArtifactDeclaresSources} guard is what keeps this table honest: a new
 * registered artifact with no row fails the gate rather than classifying as
 * "no coupling" by default.
 *
 * Paths may be a file, a directory prefix, or a glob; only the doc-versus-code
 * question is asked of them, so precision beyond that is unnecessary.
 */
export const STATIC_ARTIFACT_SOURCES: Readonly<Record<string, readonly string[]>> = {
  // generate-action-catalog reads the action templates — code in, code out.
  "public/action-catalog.generated.json": ["src/data/unified-action-templates.ts"],
  // generate-ul-dashboard-data reads only Docs/ubiquitous-language/ — the pure member.
  "src/data/ul-dashboard.generated.json": ["Docs/ubiquitous-language/"],
  // generate-impediment-dashboard: doc in, doc out (Design/ is doc-excluded). Fine.
  // The output itself is uncommitted (THR-916) — see UNCOMMITTED_GENERATED_PATHS in
  // check-generated-freshness.ts — but it still declares its sources here, because the
  // coupling question is about which *edits* regenerate it, not about whether the
  // result is tracked.
  "Design/impediment-dashboard.html": [
    "Docs/impediments.md",
    "Design/impediment-dashboard.template.html",
    "Design/retros/",
  ],
  // generate-interface-map: code in, doc out. The harmless direction.
  "Docs/canon/interface-map.generated.md": [
    "scripts/interface-contracts.ts",
    "scripts/generate-interface-map.ts",
  ],
  // generate-setting-coverage: code in, doc out — the harmless direction again, so no
  // DOC_TO_CODE_ALLOWLIST entry is needed. Registered by THR-948: its generator lived
  // outside `prebuild`, so BOTH halves of check:generated-freshness missed it (absent
  // from STATIC_GENERATED_PATHS, and invisible to the unregistered-output detector,
  // which can only see paths `prebuild` writes). The gate reported OK for weeks while
  // the committed copy was stale — it still claimed "declaring a setting envelope | 0"
  // after THR-884 shipped 8 of them.
  "Docs/canon/setting-coverage.generated.md": [
    "src/data/unified-action-templates.ts",
    "src/data/settingClasses.ts",
    "scripts/generate-setting-coverage.ts",
  ],
};

/**
 * Artifacts whose doc→code coupling is **acknowledged and neutralised** by an
 * exact-path exclusion in `ci.yml`'s `detect` filter.
 *
 * This list and that filter must agree; `docs-code-decoupling.test.ts` asserts it,
 * so the two cannot drift apart silently. Adding an entry here without the
 * matching ci.yml line buys nothing, and adding the ci.yml line without an entry
 * here fails this gate.
 */
export const DOC_TO_CODE_ALLOWLIST: readonly string[] = [
  "src/data/ul-dashboard.generated.json",
  "public/system-interface-map-reference.html",
];

/** How an artifact's inputs relate to the doc/code boundary its output sits on. */
export type CouplingKind =
  /** No doc source, or the output is itself doc-excluded. Nothing to do. */
  | "none"
  /** Every source is a doc, and the output is not. A doc edit is the ONLY trigger. */
  | "doc-to-code-pure"
  /** Some sources are docs, some are code, and the output is not a doc. */
  | "doc-to-code-mixed";

export type ArtifactCoupling = {
  artifact: string;
  sources: readonly string[];
  kind: CouplingKind;
  /** True when the coupling is real but not yet excluded from the `code` filter. */
  unlisted: boolean;
};

/** True when a path or glob is documentation as far as change detection is concerned. */
export function isDocPath(pathOrGlob: string): boolean {
  const normalized = pathOrGlob.replaceAll("\\", "/");
  if (normalized.endsWith(".md")) return true;
  return DOC_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** Classify one artifact from its output path and declared sources. */
export function classifyCoupling(artifact: string, sources: readonly string[]): CouplingKind {
  // An artifact that lands inside the doc-excluded set costs a doc PR nothing,
  // whatever its inputs are — Design/impediment-dashboard.html is the example.
  if (isDocPath(artifact)) return "none";
  if (sources.length === 0) return "none";

  const docSources = sources.filter((source) => isDocPath(source));
  if (docSources.length === 0) return "none";
  return docSources.length === sources.length ? "doc-to-code-pure" : "doc-to-code-mixed";
}

/**
 * Classify every registered artifact and flag the couplings not yet excluded from
 * the `code` filter. `sourcesFor` supplies the wiki-manifest pages' declared
 * `sources`, which the caller reads from the manifest.
 */
export function classifyArtifacts(
  artifacts: readonly string[],
  sourcesFor: (artifact: string) => readonly string[],
): ArtifactCoupling[] {
  const allowed = new Set(DOC_TO_CODE_ALLOWLIST);

  return artifacts.map((artifact) => {
    const sources = sourcesFor(artifact);
    const kind = classifyCoupling(artifact, sources);
    return {
      artifact,
      sources,
      kind,
      unlisted: kind !== "none" && !allowed.has(artifact),
    };
  });
}

/**
 * Registered static artifacts missing a row in {@link STATIC_ARTIFACT_SOURCES}.
 *
 * Without this, a newly registered generator with undeclared sources would
 * classify as `none` and the guard would wave through exactly the coupling it
 * exists to catch — the same "silent default" shape as the unregistered-artifact
 * hole `check-generated-freshness` already closes.
 */
export function everyArtifactDeclaresSources(staticPaths: readonly string[]): string[] {
  return staticPaths.filter((relPath) => STATIC_ARTIFACT_SOURCES[relPath] === undefined);
}
