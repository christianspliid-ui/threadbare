#!/usr/bin/env node

/**
 * check-generated-freshness — blocking gate proving every committed generated
 * artifact matches what its generator currently produces (THR-690).
 *
 * The failure class this closes: `public/action-catalog.generated.json` is
 * consumed at runtime but is only refreshed by the npm `prebuild` lifecycle
 * hook. Both the documented local gate (`npx vite build`) and CI's build step
 * invoke Vite directly, which bypasses `prebuild` entirely — so a template edit
 * shipped a stale catalog with no test failure and no build error. It nearly
 * leaked in two consecutive hourly runs (THR-616: a new `loc.blight` card
 * silently missing; THR-663: four just-fixed `intrinsicTier` values), caught
 * both times only by agent vigilance.
 *
 * How it works: run `npm run prebuild`, then compare each known generated
 * artifact's working-tree content against its committed copy. A difference
 * means the commit carries a stale artifact.
 *
 * Two properties worth preserving if this is ever rewritten:
 *
 * 1. It compares only *known generated paths*, so a developer's unrelated
 *    uncommitted edits are never reported as stale artifacts.
 * 2. It ALSO fails when prebuild writes a path that is not in that set
 *    ("unregistered"). Forgetting to register a newly added generator is the
 *    same hole in a new costume, so the gate refuses to stay silent about it.
 *
 * An earlier draft inferred the artifact set by diffing the dirty tree before
 * and after prebuild. That silently passes when the artifact was already
 * regenerated-but-uncommitted (before and after hashes match, so the file is
 * never compared to HEAD) — a false pass in exactly the local workflow the
 * gate is meant to protect. Hence the explicit set below.
 *
 * Volatile fields: VOLATILE_JSON_KEYS strips per-run values (timestamps, run
 * ids) before comparison, so the gate asserts *content* freshness rather than
 * byte equality. It is currently empty and should stay that way — THR-714
 * removed the last entry (`ul-dashboard.generated.json`'s wall-clock
 * `generatedAt`) at the source instead, because this carve-out only ever hid
 * the problem from *this* gate: git still saw two different blobs, so any two
 * PRs that both ran `prebuild` conflicted on every cascade merge. Prefer making
 * a generator deterministic over registering its volatility here.
 *
 * This gate is deliberately NOT fail-soft. NFP #4 (fail-soft) governs the tick
 * loop, where a thrown exception costs the player their run; a build gate that
 * silently passes when it cannot verify is the gate theater THR-686 named. Any
 * inability to verify exits non-zero with the reason.
 *
 * Run via `npm run check:generated-freshness`.
 */

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  STATIC_ARTIFACT_SOURCES,
  classifyArtifacts,
  everyArtifactDeclaresSources,
} from "./generated-artifact-sources.ts";

/** Artifacts written by `prebuild` that are not derivable from a manifest. */
const STATIC_GENERATED_PATHS: readonly string[] = [
  "public/action-catalog.generated.json", // generate-action-catalog
  "src/data/ul-dashboard.generated.json", // generate-ul-dashboard
  "Docs/canon/interface-map.generated.md", // generate-interface-map (THR-717)
  "Docs/canon/setting-coverage.generated.md", // generate-setting-coverage (THR-884, registered THR-948)
];

/**
 * Artifacts `prebuild` writes that are deliberately **not** committed (THR-916).
 *
 * A generated file only needs to be in the tree if something reads it from there.
 * When nothing does, committing it buys nothing and costs a merge conflict on every
 * PR that touches its source: `Design/impediment-dashboard.html` re-rendered ~6,200
 * data lines on every impediment append, and since HTML has no union merge driver,
 * each merge to `main` conflicted every other open PR on that one file. Untracking
 * it removes the collision at source.
 *
 * These are still checked here — dropping an artifact from the tree must not drop it
 * from coverage, which is precisely how a gate gets quietly weakened. What changes is
 * the *question*. A committed artifact is asked "does your content match HEAD?"; an
 * uncommitted one has no HEAD copy to be stale against, so it is asked the two
 * questions that still have teeth:
 *
 * 1. **Does the generator still produce it?** Catches a generator that silently
 *    stopped writing, which for a committed artifact would have surfaced as staleness.
 * 2. **Is it still untracked?** Catches someone re-adding it with `git add -f` — the
 *    exact move (impediment #139) that committed the dashboard in the first place.
 *    Without this, the treadmill grows back and the gate says nothing.
 */
const UNCOMMITTED_GENERATED_PATHS: readonly string[] = [
  "Design/impediment-dashboard.html", // generate-impediment-dashboard (THR-916)
];

/**
 * Top-level JSON keys stripped before comparison, keyed by repo-relative path.
 * Only for values a generator legitimately rewrites every run (timestamps, run
 * ids). Anything not listed here is compared verbatim.
 */
const VOLATILE_JSON_KEYS: Readonly<Record<string, readonly string[]>> = {};

/** The command that refreshes every committed generated artifact. */
const GENERATOR_COMMAND = "npm run prebuild";

/** Manifest listing the design-wiki pages that generate-design-wiki rewrites. */
const WIKI_MANIFEST_PATH = "public/wiki-manifest.json";

/** Git ref the committed artifacts are read from. */
const BASELINE_REF = process.env.GENERATED_FRESHNESS_REF ?? "HEAD";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

/** Exit non-zero with a reason — this gate must never pass unverified. */
function bail(reason: string, detail?: string): never {
  console.error(`check-generated-freshness: FAIL — ${reason}`);
  if (detail) console.error(`  ${detail}`);
  process.exit(1);
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    bail(`could not verify (git ${args.join(" ")}).`, (err as Error).message);
  }
}

/** Read a path at a ref; null when it does not exist there (a new artifact). */
function gitShow(ref: string, relPath: string): string | null {
  try {
    return execFileSync("git", ["show", `${ref}:${relPath}`], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

/**
 * The design-wiki pages generate-design-wiki rewrites (hub + every registered
 * page), read from the manifest so adding a page needs no change here.
 *
 * Each page's declared `sources` come back alongside its path, so the doc→code
 * coupling guard (THR-922) can classify a page without a second manifest read.
 * The hub has no `sources` of its own — it is derived from the manifest — so it
 * carries an empty list and classifies as uncoupled.
 */
function designWikiArtifacts(): Array<{ file: string; sources: readonly string[] }> {
  const absolute = path.join(REPO_ROOT, WIKI_MANIFEST_PATH);
  if (!fs.existsSync(absolute)) return [];
  try {
    const manifest = JSON.parse(fs.readFileSync(absolute, "utf8")) as {
      home?: unknown;
      pages?: ReadonlyArray<{ file?: unknown; sources?: unknown }>;
    };
    const artifacts: Array<{ file: string; sources: readonly string[] }> = [];
    if (typeof manifest.home === "string" && manifest.home.trim() !== "") {
      artifacts.push({ file: `public/${manifest.home}`, sources: [] });
    }
    for (const page of manifest.pages ?? []) {
      if (typeof page.file !== "string" || page.file.trim() === "") continue;
      const sources = Array.isArray(page.sources)
        ? page.sources.filter((source): source is string => typeof source === "string")
        : [];
      artifacts.push({ file: `public/${page.file}`, sources });
    }
    return artifacts;
  } catch (err) {
    // check:design-wiki owns manifest validity; refuse to guess rather than
    // silently narrow the checked set.
    bail(`${WIKI_MANIFEST_PATH} is not valid JSON — cannot enumerate design-wiki artifacts.`, (err as Error).message);
  }
}

/**
 * The doc→code coupling guard (THR-922 Done-when 4).
 *
 * A generator whose inputs are documentation but whose output lands in `src/` or
 * `public/` silently revokes the fast docs-only CI path for every edit to those
 * inputs. The two current members are excluded by exact path from `ci.yml`'s
 * `code` filter; this refuses to let a third grow back unnoticed.
 *
 * Reported as a hard failure, consistent with the rest of this gate: a coupling
 * that is merely warned about is a coupling nobody fixes.
 */
function checkDocToCodeCouplings(
  wikiArtifacts: ReadonlyArray<{ file: string; sources: readonly string[] }>,
): string[] {
  const problems: string[] = [];

  const undeclared = everyArtifactDeclaresSources([
    ...STATIC_GENERATED_PATHS,
    ...UNCOMMITTED_GENERATED_PATHS,
  ]);
  for (const relPath of undeclared) {
    problems.push(
      `${relPath} — registered generated artifact with no declared sources. ` +
        `Add its generator's inputs to STATIC_ARTIFACT_SOURCES in scripts/generated-artifact-sources.ts ` +
        `so its source→output direction can be classified.`,
    );
  }

  const wikiSources = new Map(wikiArtifacts.map((page) => [page.file, page.sources]));
  const all = [
    ...STATIC_GENERATED_PATHS,
    ...UNCOMMITTED_GENERATED_PATHS,
    ...wikiArtifacts.map((page) => page.file),
  ];

  const couplings = classifyArtifacts(
    all,
    (artifact) => STATIC_ARTIFACT_SOURCES[artifact] ?? wikiSources.get(artifact) ?? [],
  );

  for (const coupling of couplings) {
    if (!coupling.unlisted) continue;
    problems.push(
      `${coupling.artifact} — ${coupling.kind}: generated from documentation ` +
        `(${coupling.sources.filter((s) => s.endsWith(".md") || /^(Docs|Design|\.planning)\//.test(s)).join(", ")}) ` +
        `but lands outside the doc-excluded paths, so every edit to those docs pays the full code gate.\n` +
        `    Fix: exclude this exact path from the \`code\` filter in .github/workflows/ci.yml and from the ` +
        `docs-only predicate in CLAUDE.md, then add it to DOC_TO_CODE_ALLOWLIST in ` +
        `scripts/generated-artifact-sources.ts. Excluding the ARTIFACT is safe — its code sources, if any, ` +
        `remain in the filter under their own paths (see that file's header for why).`,
    );
  }

  return problems;
}

/** True when git tracks the path — the re-adding guard for UNCOMMITTED_GENERATED_PATHS. */
function isTracked(relPath: string): boolean {
  return git(["ls-files", "--", relPath]).trim() !== "";
}

/** Tracked files currently differing from HEAD. */
function dirtyTrackedFiles(): Set<string> {
  const porcelain = git(["status", "--porcelain", "--untracked-files=no"]);
  const files = new Set<string>();
  for (const raw of porcelain.split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    // Porcelain is "XY <path>"; renames ("R  old -> new") take the new path.
    const relPath = (line.replace(/^\S+\s+/, "").split(" -> ").pop() as string).replaceAll("\\", "/");
    files.add(relPath);
  }
  return files;
}

/**
 * Strip volatile keys so the comparison asserts content freshness rather than
 * byte equality. Unparseable JSON falls back to verbatim comparison — an
 * artifact that stopped being valid JSON is itself a finding worth surfacing.
 */
function normalize(content: string, relPath: string): string {
  const volatileKeys = VOLATILE_JSON_KEYS[relPath];
  if (!volatileKeys || volatileKeys.length === 0) return content;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    for (const key of volatileKeys) delete parsed[key];
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}

function main(): void {
  const wikiArtifacts = designWikiArtifacts();
  const generatedPaths = [...STATIC_GENERATED_PATHS, ...wikiArtifacts.map((page) => page.file)];
  // Uncommitted artifacts join the "known generator output" set so they can never be
  // reported as unregistered, but they are compared by a different rule below.
  const generatedSet = new Set([...generatedPaths, ...UNCOMMITTED_GENERATED_PATHS]);

  // Structural check, run before the expensive regeneration: it reads the
  // registry and the manifest only, so a coupling failure surfaces in a second
  // rather than after a full `prebuild`.
  const couplingProblems = checkDocToCodeCouplings(wikiArtifacts);
  if (couplingProblems.length > 0) {
    console.error(
      "check-generated-freshness: FAIL — a generator couples documentation to the code track (THR-922).",
    );
    for (const line of couplingProblems) console.error(`  - ${line}`);
    console.error("");
    console.error(
      "Why this is blocking: an artifact generated FROM docs but landing OUTSIDE them makes every\n" +
        "edit to those docs classify as a code change, costing the full ~15-minute required check for\n" +
        "a documentation-only PR.",
    );
    process.exit(1);
  }

  // Files already dirty before generation: pre-existing work in progress, which
  // must not be reported as unregistered generator output.
  const dirtyBefore = dirtyTrackedFiles();

  try {
    execSync(GENERATOR_COMMAND, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "ignore", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    bail(`\`${GENERATOR_COMMAND}\` failed — cannot verify artifact freshness.`, (err as Error).message);
  }

  const stale: string[] = [];
  let volatileOnly = 0;
  let checked = 0;

  for (const relPath of generatedPaths) {
    const absolute = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(absolute)) {
      stale.push(`${relPath} — expected generated artifact is missing after \`${GENERATOR_COMMAND}\``);
      continue;
    }

    const committed = gitShow(BASELINE_REF, relPath);
    if (committed === null) {
      stale.push(`${relPath} — generated but not present at ${BASELINE_REF}; \`git add\` it`);
      continue;
    }

    checked++;
    const fresh = fs.readFileSync(absolute, "utf8");
    if (normalize(fresh, relPath) !== normalize(committed, relPath)) {
      stale.push(`${relPath} — regenerating changed it`);
    } else if (fresh !== committed) {
      volatileOnly++;
    }
  }

  // Deliberately-uncommitted artifacts (THR-916): assert the generator still writes
  // them, and that nobody has re-added them to the tree.
  for (const relPath of UNCOMMITTED_GENERATED_PATHS) {
    checked++;
    if (!fs.existsSync(path.join(REPO_ROOT, relPath))) {
      stale.push(
        `${relPath} — declared an uncommitted generated artifact, but \`${GENERATOR_COMMAND}\` did not produce it. ` +
          `Its generator either failed or stopped writing this path.`,
      );
      continue;
    }
    if (isTracked(relPath)) {
      stale.push(
        `${relPath} — declared an uncommitted generated artifact, but git tracks it. ` +
          `Committing it reintroduces the merge-conflict treadmill THR-916 removed: it re-renders on every ` +
          `edit to its source, and HTML has no union merge driver, so each merge to main conflicts every ` +
          `other open PR on this file.\n` +
          `    Fix: \`git rm --cached ${relPath}\` (\`.gitignore\` already covers it), or — if it genuinely ` +
          `needs committing again — move it back to STATIC_GENERATED_PATHS and say why.`,
      );
    }
  }

  // A generator added to `prebuild` without being registered above would leave
  // its artifact unchecked — the same hole this gate exists to close.
  const unregistered = [...dirtyTrackedFiles()].filter(
    (relPath) => !generatedSet.has(relPath) && !dirtyBefore.has(relPath),
  );
  for (const relPath of unregistered) {
    stale.push(
      `${relPath} — written by \`${GENERATOR_COMMAND}\` but not a registered generated artifact. ` +
        `Add it to STATIC_GENERATED_PATHS in scripts/check-generated-freshness.ts.`,
    );
  }

  if (stale.length === 0) {
    const note = volatileOnly > 0 ? `, ${volatileOnly} volatile-only change(s) ignored` : "";
    console.log(`check-generated-freshness: OK — ${checked} generated artifact(s) match ${BASELINE_REF}${note}.`);
    return;
  }

  console.error("check-generated-freshness: FAIL — committed generated artifacts are out of date.");
  for (const line of stale) console.error(`  - ${line}`);
  console.error("");
  console.error(`Fix: run \`${GENERATOR_COMMAND}\`, then commit the regenerated files.`);
  console.error(
    "Why this is blocking: these artifacts are consumed at runtime but are not rebuilt by " +
      "`vite build`, so a stale one ships with no test failure and no build error (THR-690).",
  );
  process.exit(1);
}

main();
