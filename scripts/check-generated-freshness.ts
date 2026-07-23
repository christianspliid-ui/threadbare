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

/** Artifacts written by `prebuild` that are not derivable from a manifest. */
const STATIC_GENERATED_PATHS: readonly string[] = [
  "public/action-catalog.generated.json", // generate-action-catalog
  "src/data/ul-dashboard.generated.json", // generate-ul-dashboard
  "Design/impediment-dashboard.html", // generate-impediment-dashboard
  "Docs/canon/interface-map.generated.md", // generate-interface-map (THR-717)
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
 */
function designWikiPaths(): string[] {
  const absolute = path.join(REPO_ROOT, WIKI_MANIFEST_PATH);
  if (!fs.existsSync(absolute)) return [];
  try {
    const manifest = JSON.parse(fs.readFileSync(absolute, "utf8")) as {
      home?: unknown;
      pages?: ReadonlyArray<{ file?: unknown }>;
    };
    const files: string[] = [];
    if (typeof manifest.home === "string" && manifest.home.trim() !== "") files.push(`public/${manifest.home}`);
    for (const page of manifest.pages ?? []) {
      if (typeof page.file === "string" && page.file.trim() !== "") files.push(`public/${page.file}`);
    }
    return files;
  } catch (err) {
    // check:design-wiki owns manifest validity; refuse to guess rather than
    // silently narrow the checked set.
    bail(`${WIKI_MANIFEST_PATH} is not valid JSON — cannot enumerate design-wiki artifacts.`, (err as Error).message);
  }
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
  const generatedPaths = [...STATIC_GENERATED_PATHS, ...designWikiPaths()];
  const generatedSet = new Set(generatedPaths);

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
