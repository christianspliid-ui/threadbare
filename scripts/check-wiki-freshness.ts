#!/usr/bin/env node

/**
 * check-wiki-freshness — guardrail for the Design Reference Wiki freshness
 * contract (THR-585 / Game Manual Wiki plan §4; blocking flip THR-730).
 *
 * Working agreement (user directive, 2026-07-03): when the code of a core game
 * system is changed, the relevant wiki page must be updated in the same PR.
 * Made mechanical here: each page in public/wiki-manifest.json may declare a
 * `sources: string[]` of repo globs. For the current branch vs a base ref, if a
 * changed file matches a page's `sources` and that page's HTML file (or a
 * declared `payloads` entry) is NOT also changed, we warn — the page is probably
 * stale relative to the code it documents.
 *
 * Two modes:
 *   - ADVISORY (default): warnings never fail the build, and any inability to
 *     resolve the git diff or manifest prints a skip line and exits 0. This is
 *     the local pre-commit / `check:process` ergonomics path — unchanged.
 *   - BLOCKING (`--blocking` flag or WIKI_FRESHNESS_MODE=blocking): the CI gate.
 *     A stale page fails the run (exit 1). A gate that silently disarms when its
 *     inputs vanish is gate theater (the `tsc --noEmit` lesson, THR-686/693), so
 *     blocking mode also fails LOUD where advisory skips soft: an unresolvable
 *     base ref or a missing/corrupt manifest exits 1 rather than 0.
 *
 * Exemption token (blocking only): a commit in the PR range may carry, in its
 * body, `Wiki-freshness-exempt: <non-empty reason>`. When present, staleness
 * warnings are reported but do not fail the run: the exemption is resolved before
 * any verdict prints, so the run opens with `OK (exempt) — N page(s) flagged,
 * waived by <full reason>` and lists the pages beneath it (THR-755 row 2 — it used
 * to print `FAIL` first and reveal the exemption afterwards). This mirrors the
 * `Browser-verify exempt:` DoD pattern: opt-in, stated in the commit body,
 * auditable forever in git history. If `git log` for the range is unavailable, we
 * treat it as "no exemption" — the gate still fires.
 *
 * Run via `npm run check:wiki-freshness` (advisory, chained into `check:process`)
 * or `npm run check:wiki-freshness:blocking` (blocking, the CI gate).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export type ManifestPage = { id: string; file: string; sources?: unknown; payloads?: unknown };
export type Manifest = { pages?: ManifestPage[] };
export type FreshnessMode = "advisory" | "blocking";

/** Commit-body token that opts a PR out of the blocking gate for behavior-neutral changes. */
export const EXEMPTION_TOKEN = "Wiki-freshness-exempt:";

/**
 * Lint severity. Advisory = warn-only (exit 0). Blocking = exit 1 on any warning
 * (or on a missing input). Selected by env OR the `--blocking` CLI flag — the
 * flag avoids cross-platform env-prefix problems in npm scripts.
 */
const WIKI_FRESHNESS_MODE: FreshnessMode =
  process.env.WIKI_FRESHNESS_MODE === "blocking" || process.argv.includes("--blocking")
    ? "blocking"
    : "advisory";
/** Diff base for changed-file detection. */
const WIKI_FRESHNESS_BASE = process.env.WIKI_FRESHNESS_BASE ?? "origin/main";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "wiki-manifest.json");

/**
 * Exit code for a missing/unresolvable input, by mode. Advisory skips soft (0) —
 * best-effort lint. Blocking fails loud (1) — a disarmed gate must not pass.
 */
export function missingInputExitCode(mode: FreshnessMode): 0 | 1 {
  return mode === "blocking" ? 1 : 0;
}

/**
 * Handle a missing/unresolvable input. Advisory: print the skip line and exit 0
 * (byte-identical to the pre-THR-730 behavior). Blocking: print a loud FAIL line
 * (plus an optional fix hint) and exit 1.
 */
function bailMissingInput(reason: string, hint?: string): never {
  const exit = missingInputExitCode(WIKI_FRESHNESS_MODE);
  if (exit === 1) {
    console.log(`check-wiki-freshness: FAIL — ${reason}`);
    if (hint) console.log(`  ${hint}`);
  } else {
    console.log(`check-wiki-freshness: skipped — ${reason}`);
  }
  process.exit(exit);
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
export function globToRegExp(glob: string): RegExp {
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

/**
 * Trailers that terminate a wrapped exemption reason. A reason runs to the end of its
 * paragraph, so continuation capture must stop before the next commit-body trailer —
 * otherwise `Fixes THR-XXX` gets swallowed into the audited reason.
 */
const REASON_TERMINATOR_PATTERN =
  /^(Fixes|Closes|Resolves|Refs|Co-Authored-By|Signed-off-by|Browser-verify|Wiki-freshness)\b/iu;

/**
 * Parse the first non-empty exemption reason from concatenated commit bodies
 * (the output of `git log --format=%B <base>..HEAD`). An empty reason after the
 * token is treated as no exemption. Pure — the token scan is decoupled from git.
 *
 * The reason is captured across continuation lines up to the first blank line, next
 * exemption token, or trailer (THR-755 row 2). Authors hard-wrap commit bodies, and
 * capturing only the token's own line printed the reason truncated mid-sentence —
 * which silently gutted the audit half of the escape hatch, since the recorded reason
 * is exactly what `weekly-project-hygiene` reviews.
 */
export function parseExemptionReason(commitBodies: string): string | null {
  const lines = commitBodies.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].toLowerCase().indexOf(EXEMPTION_TOKEN.toLowerCase());
    if (idx === -1) continue;
    const first = lines[i].slice(idx + EXEMPTION_TOKEN.length).trim();
    if (!first) continue;

    const parts = [first];
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next) break;
      if (next.toLowerCase().includes(EXEMPTION_TOKEN.toLowerCase())) break;
      if (REASON_TERMINATOR_PATTERN.test(next)) break;
      parts.push(next);
    }
    return parts.join(" ");
  }
  return null;
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

/**
 * Pure stale-page detector. For each page with `sources`, warn if any changed
 * file matches a source glob but neither the page shell nor a declared payload
 * changed. No git/fs — the caller supplies the pages-with-sources and the
 * changed-file set, so this is deterministic and unit-testable.
 */
export function computeStaleWarnings(
  pagesWithSources: ManifestPage[],
  changed: Set<string>,
  mode: FreshnessMode = "advisory",
): string[] {
  // "may be stale" hedges a claim blocking mode is about to exit 1 over (THR-755
  // row 2). Advisory keeps the hedge — it genuinely only advises; blocking asserts.
  const staleClaim = mode === "blocking" ? "is stale" : "may be stale";
  const warnings: string[] = [];
  for (const page of pagesWithSources) {
    const pageFileRel = `public/${page.file}`;

    // Data-driven pages are a shell plus a generated payload: the content lives
    // in the payload, and editing a source regenerates the payload while leaving
    // the .html byte-identical. Keying freshness on the shell alone therefore
    // warns on every payload-only change — impediment #180's root cause. A page
    // counts as updated when its shell OR any declared payload changed (THR-690).
    const payloads = Array.isArray(page.payloads)
      ? (page.payloads as unknown[]).filter((p): p is string => typeof p === "string" && p.trim() !== "")
      : [];
    const pageChanged = changed.has(pageFileRel) || payloads.some((payload) => changed.has(payload));

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
        `${pageFileRel} ${staleClaim} — changed files match its sources (${matchedSources.join(", ")}) ` +
          `but the page was not updated in this diff. Update it in the same PR (working agreement 2026-07-03).`,
      );
    }
  }
  return warnings;
}

function main(): void {
  if (!fs.existsSync(MANIFEST_PATH)) {
    // Advisory: check:design-wiki owns the hard manifest-existence failure; stay
    // soft here. Blocking: gutting the manifest must not disarm the gate.
    bailMissingInput("no manifest at public/wiki-manifest.json (deferring to check:design-wiki)");
  }

  let manifest: Manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch (err) {
    bailMissingInput(`manifest is not valid JSON (deferring to check:design-wiki): ${(err as Error).message}`);
  }

  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const pagesWithSources = pages.filter((p) => Array.isArray(p.sources) && p.sources.length > 0);
  if (pagesWithSources.length === 0) {
    console.log("check-wiki-freshness: OK — no pages declare `sources` yet (freshness contract inert).");
    return;
  }

  const changed = collectChangedFiles();
  if (changed === null) {
    bailMissingInput(
      `no diff available against ${WIKI_FRESHNESS_BASE}`,
      "hint: fetch the base ref and give the checkout history — `git fetch origin main` and `fetch-depth: 0`.",
    );
  }

  const warnings = computeStaleWarnings(pagesWithSources, changed, WIKI_FRESHNESS_MODE);

  if (warnings.length === 0) {
    console.log(
      `check-wiki-freshness: OK — ${pagesWithSources.length} page(s) with sources checked against ${WIKI_FRESHNESS_BASE}, no stale pages.`,
    );
    return;
  }

  // Resolve the exemption BEFORE emitting any verdict (THR-755 row 2). The previous
  // order printed `FAIL` plus the full remediation instruction, *then* discovered the
  // exemption and exited 0 — so the last thing a reader saw was a failure and a
  // to-do already satisfied. Both cheap reactions to that were wrong: chase a page
  // that needs no change, or start disbelieving the gate's real failures. A gate
  // whose whole job is to be believed cannot open with a banner it does not mean.
  //
  // Blocking only: a `Wiki-freshness-exempt: <reason>` token in any commit in the PR
  // range downgrades the failure to an audited pass. git-log failure ⇒ no exemption
  // ⇒ the gate still fires (fails closed).
  const exemptReason =
    WIKI_FRESHNESS_MODE === "blocking"
      ? (() => {
          const bodies = git(["log", "--format=%B", `${WIKI_FRESHNESS_BASE}..HEAD`]);
          return bodies === null ? null : parseExemptionReason(bodies);
        })()
      : null;

  if (exemptReason) {
    console.log(
      `check-wiki-freshness: OK (exempt) — ${warnings.length} page(s) flagged, waived by ` +
        `\`${EXEMPTION_TOKEN} ${exemptReason}\``,
    );
    for (const warning of warnings) console.log(`  - ${warning}`);
    return;
  }

  const label = WIKI_FRESHNESS_MODE === "blocking" ? "FAIL" : "WARN";
  console.log(`check-wiki-freshness: ${label} (mode=${WIKI_FRESHNESS_MODE})`);
  for (const warning of warnings) console.log(`  - ${warning}`);

  // Advisory: surface the warnings but never fail the build.
  if (WIKI_FRESHNESS_MODE !== "blocking") return;

  process.exit(1);
}

/**
 * Entry guard by basename, not `import.meta.url === process.argv[1]`: esbuild's
 * `--bundle` rewrites `import.meta.url` to the bundle's URL, which can make a
 * raw-equality guard fire for an inlined import. Gating on the process entry's
 * basename runs main() when this script is the entry (as `.ts` directly or as
 * the bundled `.cache/check-wiki-freshness.mjs`) but not when a test imports it.
 */
function isDirectEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.basename(entry).replace(/\.(mjs|cjs|js|ts)$/, "") === "check-wiki-freshness";
}

if (isDirectEntry()) main();
