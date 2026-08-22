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
 * Base-ref freshness (THR-819): the diff base is refreshed from its remote before any
 * verdict is computed, because nothing else did. CI fetches `origin/main` on the line
 * above the gate, so CI was always right; the local command agents run as pre-commit
 * evidence (CLAUDE.md step 3c) was only as right as the last fetch — and it failed in
 * the *unsafe* direction, printing OK where CI printed FAIL for the same tree. Two
 * distinct laundering paths, both measured on the THR-802 incident:
 *
 *   1. Page-in-diff. Staleness is (sources changed) AND NOT (page changed). A base
 *      predating a commit that edited the page puts that commit's edit in the diff, so
 *      the page reads as "updated here" and the gate credits the PR for someone else's
 *      work — the genuinely stale page vanishes from the report entirely.
 *   2. Exemption laundering. The exemption scan reads commit bodies over `BASE..HEAD`,
 *      so a stale base widens the range until it sweeps in an unrelated older commit's
 *      `Wiki-freshness-exempt:` token and waives a warning that was never exempted.
 *
 * Both have one root cause, so both take one fix: make the base trustworthy, then say
 * so. Every verdict line names the base and whether it was refreshed — a gate that
 * cannot be believed is worth nothing, and "OK" alone never distinguished a fresh base
 * from a stale one. A fetch failure (offline) is fail-soft by NFP #4: the run does not
 * go red over lost network, it labels the verdict `could not refresh` and says the
 * result may be unreliable. Set WIKI_FRESHNESS_NO_FETCH=1 to skip the fetch entirely
 * (hermetic/offline runs); the label reports that too.
 *
 * Two directions, two fixes — do not collapse them (THR-1191). The base ref can be wrong
 * in either direction, and each has its own remedy:
 *
 *   - STALE BASE (the THR-819 direction above): `origin/main` trails its remote, so the
 *     diff is too WIDE and the gate false-PASSes. Fixed by the fetch, not by the diff
 *     syntax — three-dot would recompute the merge base from the same stale ref and only
 *     change which commits are attributed. That is why three-dot was rejected here, and
 *     the rejection was right *for this direction*.
 *   - ADVANCED BASE (the THR-1191 direction): `origin/main` is perfectly fresh and has
 *     moved AHEAD of the branch point. A two-dot `git diff origin/main` is symmetric, so
 *     every file `main` changed since the branch point enters the PR's "changed set" and
 *     the gate false-FAILS on someone else's commit. The fetch cannot help — it is what
 *     supplies the newer tip. Fixed by taking the diff against the MERGE BASE of
 *     `origin/main` and `HEAD`, which is what three-dot means. Measured: PR #1504 sat 172
 *     minutes armed-but-red over `src/types/unifiedAction.ts`, a file it never touched,
 *     because THR-1141 merged during its CI run. Structural since strict mode was dropped
 *     (THR-983) — sitting behind `main` is now the normal state, not an anomaly.
 *
 * The diff base is therefore the merge base, while the base REF stays `origin/main` and
 * stays fetched. We use an explicit `git merge-base` rather than `A...B` syntax because
 * the changed set must keep counting UNCOMMITTED and untracked work: `git diff A...B`
 * compares two commits and would silently drop the working tree, which is precisely what
 * the local pre-commit path (CLAUDE.md step 3c) runs the gate to inspect.
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

/**
 * Whether the diff base was refreshed from its remote before the verdict was computed
 * (THR-819). Every verdict line carries this, because a verdict is only as trustworthy
 * as its base ref and the reader cannot tell the difference from the verdict alone.
 */
export type BaseRefreshOutcome = "refreshed" | "unfetchable" | "not-refreshed";

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
/** Opt out of the base-ref fetch (hermetic runs, deliberately-offline machines). */
const WIKI_FRESHNESS_NO_FETCH = process.env.WIKI_FRESHNESS_NO_FETCH === "1";
/**
 * Wall-clock ceiling on the base-ref fetch, ms. A gate that can hang forever on a
 * half-open connection is worse than one that admits it could not refresh, so the
 * timeout expires into the fail-soft `unfetchable` path rather than blocking a commit.
 */
const FETCH_TIMEOUT_MS = 20_000;

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

function git(args: string[], timeoutMs?: number): string | null {
  try {
    return execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
    });
  } catch {
    return null;
  }
}

/**
 * Split a remote-tracking base like `origin/main` into its remote and branch, given the
 * repo's actual remotes. Returns null when the base is not remote-tracking — a bare SHA,
 * a tag, or a local branch that merely contains a slash (`docs/plan-x` must NOT be read
 * as remote `docs`), which is why the remote list is required rather than guessed from
 * the first path segment. Longest remote wins, so a repo with both `origin` and
 * `origin/mirror` resolves unambiguously. Pure — the caller supplies the remotes.
 */
export function splitRemoteTrackingBase(
  base: string,
  remotes: readonly string[],
): { remote: string; branch: string } | null {
  let best: { remote: string; branch: string } | null = null;
  for (const remote of remotes) {
    if (!remote || !base.startsWith(`${remote}/`)) continue;
    const branch = base.slice(remote.length + 1);
    if (!branch) continue;
    if (!best || remote.length > best.remote.length) best = { remote, branch };
  }
  return best;
}

/**
 * Refresh the diff base from its remote so the verdict rests on a current ref (THR-819).
 * Fail-soft throughout: any failure downgrades the label, never the exit code.
 */
function refreshBaseRef(): BaseRefreshOutcome {
  if (WIKI_FRESHNESS_NO_FETCH) return "not-refreshed";

  const remoteList = git(["remote"]);
  if (remoteList === null) return "not-refreshed";
  const remotes = remoteList.split("\n").map((r) => r.trim()).filter(Boolean);

  const parsed = splitRemoteTrackingBase(WIKI_FRESHNESS_BASE, remotes);
  // A non-remote-tracking base (SHA, tag, local branch) has no remote to refresh from.
  // That is not a failure — it is a base whose freshness is the caller's business.
  if (parsed === null) return "not-refreshed";

  return git(["fetch", parsed.remote, parsed.branch, "--quiet"], FETCH_TIMEOUT_MS) === null
    ? "unfetchable"
    : "refreshed";
}

/**
 * Render the base ref plus its provenance for a verdict line. The provenance is not
 * decoration: `OK` against an unrefreshed base is the exact string this whole ticket
 * exists to stop anyone pasting into a closeout comment as proof.
 */
export function describeBase(base: string, outcome: BaseRefreshOutcome): string {
  switch (outcome) {
    case "refreshed":
      return `${base} (refreshed)`;
    case "unfetchable":
      return `${base} (could not refresh — verdict may be unreliable)`;
    case "not-refreshed":
      return `${base} (not refreshed)`;
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

/**
 * Minimal git surface the changed-set collection needs. Injected so the collector can be
 * exercised against a real throwaway repo in tests without the script's REPO_ROOT pinning
 * (the module resolves REPO_ROOT from its own file location, so it can only ever shell
 * against *this* repo).
 */
export type GitRunner = (args: string[]) => string | null;

/**
 * The commit the diff should be taken against: the merge base of the base ref and HEAD
 * (THR-1191). Returns null when the base ref does not resolve at all — shallow CI clone,
 * unfetched remote — which is the caller's signal to bail as a missing input.
 *
 * Falls back to the base ref itself when `merge-base` yields nothing. That happens on
 * unrelated histories and on some shallow clones, where no common ancestor is known; the
 * old two-dot behavior is the safe landing there, because it errs toward flagging too
 * much (a false FAIL a human can read and waive) rather than too little (a false PASS
 * that ships a stale page silently).
 */
export function resolveDiffBase(run: GitRunner, baseRef: string): string | null {
  if (run(["rev-parse", "--verify", "--quiet", baseRef]) === null) return null;
  const mergeBase = run(["merge-base", baseRef, "HEAD"])?.trim();
  return mergeBase ? mergeBase : baseRef;
}

/**
 * Collect files this branch changed (committed + uncommitted + untracked), relative to the
 * merge base rather than the base ref tip — see the ADVANCED BASE note in the header.
 */
export function collectChangedFilesWith(run: GitRunner, baseRef: string): Set<string> | null {
  const diffBase = resolveDiffBase(run, baseRef);
  if (diffBase === null) return null;

  const tracked = run(["diff", "--name-only", diffBase, "--"]);
  if (tracked === null) return null;
  const untracked = run(["ls-files", "--others", "--exclude-standard"]) ?? "";

  const files = new Set<string>();
  for (const line of `${tracked}\n${untracked}`.split("\n")) {
    const trimmed = line.trim().replaceAll("\\", "/");
    if (trimmed) files.add(trimmed);
  }
  return files;
}

/** Collect files this branch changed, against the repo's configured base ref. */
function collectChangedFiles(): Set<string> | null {
  return collectChangedFilesWith(git, WIKI_FRESHNESS_BASE);
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

  // Refresh BEFORE the diff and before the exemption scan — both read the base, and
  // both launder a false PASS when it is stale (see the header note, THR-819).
  const refresh = refreshBaseRef();
  const base = describeBase(WIKI_FRESHNESS_BASE, refresh);
  if (refresh === "unfetchable") {
    console.log(
      `check-wiki-freshness: WARNING — could not fetch ${WIKI_FRESHNESS_BASE} (offline?). ` +
        `The verdict below is computed from a possibly-stale base ref and may disagree with CI.`,
    );
  }

  const changed = collectChangedFiles();
  if (changed === null) {
    bailMissingInput(
      `no diff available against ${base}`,
      "hint: fetch the base ref and give the checkout history — `git fetch origin main` and `fetch-depth: 0`.",
    );
  }

  const warnings = computeStaleWarnings(pagesWithSources, changed, WIKI_FRESHNESS_MODE);

  if (warnings.length === 0) {
    console.log(
      `check-wiki-freshness: OK — ${pagesWithSources.length} page(s) with sources checked against ${base}, no stale pages.`,
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
      `check-wiki-freshness: OK (exempt) — ${warnings.length} page(s) flagged against ${base}, waived by ` +
        `\`${EXEMPTION_TOKEN} ${exemptReason}\``,
    );
    for (const warning of warnings) console.log(`  - ${warning}`);
    return;
  }

  const label = WIKI_FRESHNESS_MODE === "blocking" ? "FAIL" : "WARN";
  console.log(`check-wiki-freshness: ${label} (mode=${WIKI_FRESHNESS_MODE}, base=${base})`);
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
