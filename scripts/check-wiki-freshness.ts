#!/usr/bin/env node

/**
 * check-wiki-freshness — advisory guardrail for the Design Reference Wiki
 * freshness contract (THR-585 / Game Manual Wiki plan §4).
 *
 * Working agreement (user directive, 2026-07-03): when the code of a core game
 * system is changed, the relevant wiki page must be updated in the same PR.
 * Made mechanical here: each page in public/wiki-manifest.json may declare a
 * `sources: string[]` of repo globs. For the current branch vs a base ref, if a
 * changed file matches a page's `sources` and that page's HTML file is NOT also
 * changed, we warn — the page is probably stale relative to the code it documents.
 *
 * ADVISORY by default (WIKI_FRESHNESS_MODE=advisory): warnings never fail the
 * build, mirroring `check:design-wiki`'s place in `check:process`. Flip to
 * `blocking` only on an explicit user verdict.
 *
 * Fail-soft (NFP #4): any inability to resolve the git diff, a malformed glob, or
 * a missing manifest prints a skip/warn line and exits 0 — this lint must never
 * block a build or commit while advisory.
 *
 * Run via `npm run check:wiki-freshness` (also chained into `npm run check:process`).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type ManifestPage = { id: string; file: string; sources?: unknown };
type Manifest = { pages?: ManifestPage[] };

/** Lint severity. Advisory = warn-only (exit 0). Blocking = exit 1 on any warning. */
const WIKI_FRESHNESS_MODE: "advisory" | "blocking" =
  process.env.WIKI_FRESHNESS_MODE === "blocking" ? "blocking" : "advisory";
/** Diff base for changed-file detection. */
const WIKI_FRESHNESS_BASE = process.env.WIKI_FRESHNESS_BASE ?? "origin/main";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "wiki-manifest.json");

/** Print a skip line and exit 0 — the advisory lint is best-effort. */
function skip(reason: string): never {
  console.log(`check-wiki-freshness: skipped — ${reason}`);
  process.exit(0);
}

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/**
 * Compile a repo glob into an anchored regex. `**` matches across path segments
 * (`.*`), a single `*` matches within one segment (`[^/]*`), and `?` matches one
 * non-separator char. All other regex-special chars are escaped literally.
 */
function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
      } else {
        out += "[^/]*";
      }
    } else if (ch === "?") {
      out += "[^/]";
    } else if ("\\^$.|+()[]{}".includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return new RegExp(`^${out}$`);
}

/** Collect files that differ from the base ref (committed + uncommitted + untracked). */
function collectChangedFiles(): Set<string> | null {
  // Base ref must resolve, or we cannot compute a diff (shallow CI, unfetched remote, etc.).
  if (git(["rev-parse", "--verify", "--quiet", WIKI_FRESHNESS_BASE]) === null) return null;

  const tracked = git(["diff", "--name-only", WIKI_FRESHNESS_BASE, "--"]);
  if (tracked === null) return null;
  const untracked = git(["ls-files", "--others", "--exclude-standard"]) ?? "";

  const files = new Set<string>();
  for (const line of `${tracked}\n${untracked}`.split("\n")) {
    const trimmed = line.trim().replaceAll("\\", "/");
    if (trimmed) files.add(trimmed);
  }
  return files;
}

function main(): void {
  if (!fs.existsSync(MANIFEST_PATH)) {
    // check:design-wiki owns the hard manifest-existence failure; stay soft here.
    skip("no manifest at public/wiki-manifest.json (deferring to check:design-wiki)");
  }

  let manifest: Manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch (err) {
    skip(`manifest is not valid JSON (deferring to check:design-wiki): ${(err as Error).message}`);
  }

  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const pagesWithSources = pages.filter((p) => Array.isArray(p.sources) && p.sources.length > 0);
  if (pagesWithSources.length === 0) {
    console.log("check-wiki-freshness: OK — no pages declare `sources` yet (freshness contract inert).");
    return;
  }

  const changed = collectChangedFiles();
  if (changed === null) {
    skip(`no diff available against ${WIKI_FRESHNESS_BASE}`);
  }

  const warnings: string[] = [];
  for (const page of pagesWithSources) {
    const pageFileRel = `public/${page.file}`;
    const pageChanged = changed.has(pageFileRel);

    const matchedSources: string[] = [];
    for (const source of page.sources as unknown[]) {
      if (typeof source !== "string" || source.trim() === "") {
        // Malformed glob → warn once and skip it (check:design-wiki enforces shape).
        warnings.push(`page "${page.id}" has a malformed sources glob (skipped): ${JSON.stringify(source)}`);
        continue;
      }
      let re: RegExp;
      try {
        re = globToRegExp(source);
      } catch (err) {
        warnings.push(`page "${page.id}" glob "${source}" failed to compile (skipped): ${(err as Error).message}`);
        continue;
      }
      for (const file of changed) {
        if (re.test(file)) {
          matchedSources.push(source);
          break;
        }
      }
    }

    if (matchedSources.length > 0 && !pageChanged) {
      warnings.push(
        `${pageFileRel} may be stale — changed files match its sources (${matchedSources.join(", ")}) ` +
          `but the page was not updated in this diff. Update it in the same PR (working agreement 2026-07-03).`,
      );
    }
  }

  if (warnings.length === 0) {
    console.log(
      `check-wiki-freshness: OK — ${pagesWithSources.length} page(s) with sources checked against ${WIKI_FRESHNESS_BASE}, no stale pages.`,
    );
    return;
  }

  const label = WIKI_FRESHNESS_MODE === "blocking" ? "FAIL" : "WARN";
  console.log(`check-wiki-freshness: ${label} (mode=${WIKI_FRESHNESS_MODE})`);
  for (const warning of warnings) console.log(`  - ${warning}`);

  if (WIKI_FRESHNESS_MODE === "blocking") process.exit(1);
  // Advisory: surface the warnings but never fail the build.
}

main();
