#!/usr/bin/env node

/**
 * check-guidance-freshness — the change-time half of guidance governance (THR-1253).
 *
 * The problem, measured: rulings land in the canonical chain, but agents obey the
 * OPERATIVE chain — the prompts, compiled briefs, exemplars and vault samples they load
 * first. The 2026-08-25 prose-guidance audit found three director-level register rulings
 * sitting in `Docs/canon/prose.md` while every surface the pipeline actually loads kept
 * teaching the retired mode, for weeks. Nothing forced a direction change to sweep its
 * own restatement sites, so the change PR could end while the old guidance stayed live.
 *
 * This gate makes the sweep part of shipping the change. `Docs/guidance-manifest.json`
 * declares, per doctrine, the AUTHORITIES that define it and the DEPENDENTS that restate
 * or apply it. A diff that edits an authority without touching every dependent fails,
 * naming the untouched ones — unless a commit body carries the attestation described
 * below. A diff that edits only dependents never fails: downstream edits are free.
 *
 * Deliberately the mirror image of `check-wiki-freshness` (THR-730), not a new species —
 * same manifest+sources shape, same commit-body escape hatch, same merge-base diff, same
 * fail-soft posture. Reviewers already know how to read that gate; a second gate with its
 * own idioms would cost more than it caught.
 *
 * TWO INDEPENDENT REPORTS, ONE RUN:
 *
 *   1. THE SWEEP GATE (can fail). Authority edited ⇒ every dependent must be touched.
 *      Honors `Guidance-sweep: <doctrineId> — <disposition>` in any commit body over the
 *      diff range: the auditable "checked, deliberately unchanged" hatch, mirroring
 *      `Wiki-freshness-exempt:`. Scoped BY DOCTRINE ID on purpose — a repo with several
 *      doctrines must not let an attestation for one waive a sweep for another, which is
 *      exactly the drift this gate exists to stop. A bare `Guidance-sweep:` with no
 *      recognisable doctrine id waives nothing and says so. The marker is LINE-ANCHORED,
 *      unlike the wiki gate's — see the note on parseSweepAttestations (impediment #787).
 *
 *   2. THE STAMP REPORT (never fails, in either mode). Dependents carrying YAML
 *      frontmatter may declare `validated_doctrine: <id>@<version>`. Any stamp trailing
 *      the manifest version is reported as a named row. This half is ADVISORY ALWAYS:
 *      the stamp asserts "a human re-read this against v2", and forcing it mechanically
 *      would recreate precisely the date-bump theater `last_validated_against` already
 *      demonstrated (bumped on a drifted skill, 2026-08-25). A dependent with no
 *      frontmatter block reports as unstamped-by-shape — informational, not a debt: the
 *      SWEEP covers every dependent, the STAMP covers those with somewhere to put one.
 *
 * MODE — advisory by default, blocking behind `--blocking` / GUIDANCE_FRESHNESS_MODE.
 * The gate ships ADVISORY and is flipped after a clean burn-in (THR-899 precedent: a
 * false-positive gate damages the thing it protects, and a brand-new dependent list is
 * exactly where false positives live). `GUIDANCE_GATE_MODE` below records the intended
 * flip date so the burn-in cannot quietly become permanent.
 *
 * FAIL-SOFT (NFP #4) — a broken manifest must never block unrelated PRs. Missing or
 * unparseable manifest, unknown dependent paths, unreadable commit bodies: each degrades
 * to a warning or an informational row, never to a red gate on work that owed nothing.
 * This is a deliberate asymmetry with check-wiki-freshness, which fails loud on a missing
 * manifest because gutting it there disarms a gate that has already proven its worth.
 * This manifest is new, its dependent lists are the least-trustworthy thing in the design,
 * and it governs process surfaces rather than shipped behaviour — so the blast radius of
 * a false red is larger than that of a missed sweep, which the /guidance-audit skill
 * catches on its own cadence anyway.
 *
 * Run via `npm run check:guidance-freshness` (advisory; chained into `check:process`) or
 * `npm run check:guidance-freshness:blocking`. It is a TREE-DIFFING gate, so per the
 * CLAUDE.md general rule it runs LAST before `git push`, after the closeout edits — never
 * at its numbered position in a checklist.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export type Doctrine = {
  version?: unknown;
  versionNote?: unknown;
  authorities?: unknown;
  dependents?: unknown;
  manualDependents?: unknown;
};
export type GuidanceManifest = { doctrines?: Record<string, Doctrine> };
export type FreshnessMode = "advisory" | "blocking";

/** Commit-body token attesting that a doctrine's dependents were swept deliberately. */
export const SWEEP_TOKEN = "Guidance-sweep:";

/** Frontmatter key carrying a dependent's doctrine stamp: `validated_doctrine: prose@2`. */
export const STAMP_KEY = "validated_doctrine";

/**
 * Burn-in switch (plan § Constants table). The gate ships advisory; the flip to blocking
 * is a one-line change plus this date, filed as its own follow-up so the burn-in cannot
 * become permanent by inattention. Recorded as a constant rather than prose because the
 * verdict line prints it — a reader must be able to tell an advisory gate from a
 * disarmed one without opening the source.
 */
export const GUIDANCE_GATE_MODE = {
  shippedAs: "advisory" as FreshnessMode,
  flipReviewAfter: "2026-09-08",
  flipTicket: "THR-1256",
};

const GUIDANCE_FRESHNESS_MODE: FreshnessMode =
  process.env.GUIDANCE_FRESHNESS_MODE === "blocking" || process.argv.includes("--blocking")
    ? "blocking"
    : "advisory";
const GUIDANCE_FRESHNESS_BASE = process.env.GUIDANCE_FRESHNESS_BASE ?? "origin/main";
const GUIDANCE_FRESHNESS_NO_FETCH = process.env.GUIDANCE_FRESHNESS_NO_FETCH === "1";
/** Wall-clock ceiling on the base-ref fetch, ms — a gate that can hang is worse than one that admits it could not refresh. */
const FETCH_TIMEOUT_MS = 20_000;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "Docs", "guidance-manifest.json");

/** Whether the diff base was refreshed before the verdict — a verdict is only as trustworthy as its base (THR-819). */
export type BaseRefreshOutcome = "refreshed" | "unfetchable" | "not-refreshed";

export type GitRunner = (args: string[]) => string | null;

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
 * Split a remote-tracking base like `origin/main` into remote + branch, given the repo's
 * real remotes. Returns null for a bare SHA, a tag, or a local branch that merely contains
 * a slash — `docs/plan-x` must not be read as remote `docs`, which is why the remote list
 * is required rather than guessed. Longest remote wins.
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

function refreshBaseRef(): BaseRefreshOutcome {
  if (GUIDANCE_FRESHNESS_NO_FETCH) return "not-refreshed";
  const remoteList = git(["remote"]);
  if (remoteList === null) return "not-refreshed";
  const remotes = remoteList.split("\n").map((r) => r.trim()).filter(Boolean);
  const parsed = splitRemoteTrackingBase(GUIDANCE_FRESHNESS_BASE, remotes);
  if (parsed === null) return "not-refreshed";
  return git(["fetch", parsed.remote, parsed.branch, "--quiet"], FETCH_TIMEOUT_MS) === null
    ? "unfetchable"
    : "refreshed";
}

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
 * The commit to diff against: the merge base of the base ref and HEAD (THR-1191). A
 * two-dot diff against a base that has moved AHEAD of the branch point sweeps every file
 * `main` changed since into this PR's changed set — which for THIS gate would mean an
 * unrelated merge touching `Docs/canon/prose.md` arms the sweep against a PR that never
 * opened the file. Sitting behind `main` is the normal state since strict mode was dropped
 * (THR-983), so that is not a corner case.
 *
 * Falls back to the base ref itself when `merge-base` yields nothing (unrelated histories,
 * some shallow clones): the old two-dot behaviour errs toward flagging too much, which in
 * advisory mode costs a line of noise rather than a false pass.
 */
export function resolveDiffBase(run: GitRunner, baseRef: string): string | null {
  if (run(["rev-parse", "--verify", "--quiet", baseRef]) === null) return null;
  const mergeBase = run(["merge-base", baseRef, "HEAD"])?.trim();
  return mergeBase ? mergeBase : baseRef;
}

/**
 * Files this branch changed — committed, uncommitted AND untracked. The working tree
 * matters because the local pre-push invocation exists precisely to inspect it; an
 * `A...B` two-commit diff would silently drop it.
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

/**
 * Trailers that terminate a wrapped attestation. A disposition runs to the end of its
 * paragraph, so continuation capture stops before the next commit-body trailer —
 * otherwise `Fixes THR-XXXX` is swallowed into the audited reason, gutting the audit half
 * of the hatch (the THR-755 row-2 lesson, inherited).
 */
const REASON_TERMINATOR_PATTERN =
  /^(Fixes|Closes|Resolves|Refs|Co-Authored-By|Signed-off-by|Browser-verify|Wiki-freshness|Guidance-sweep)\b/iu;

export type SweepAttestation = { doctrineId: string | null; disposition: string };

/**
 * Parse every `Guidance-sweep:` attestation from concatenated commit bodies.
 *
 * The value is `<doctrineId> — <disposition>`; the separator may be an em dash, a hyphen,
 * or a colon, because commit bodies are typed by hand and a gate that only accepts one
 * dash shape teaches people it is broken. The doctrine id is the FIRST whitespace-free
 * token, matched case-insensitively against the manifest by the caller — an attestation
 * naming no known doctrine waives nothing, which is the point of scoping at all.
 *
 * Pure: the token scan is decoupled from git so it is testable without a repo.
 */
export function parseSweepAttestations(commitBodies: string): SweepAttestation[] {
  const out: SweepAttestation[] = [];
  const lines = commitBodies.split("\n");
  for (let i = 0; i < lines.length; i++) {
    // LINE-ANCHORED, not substring-matched — the token must OPEN its line (leading
    // whitespace tolerated, since git indents nothing but authors do).
    //
    // This deliberately diverges from `check-wiki-freshness`, which substring-matches its
    // marker and was measured failing exactly this way the same day this gate was written
    // (impediment #787): an impediment row *about* the marker put the token inside an
    // explanatory sentence, the gate parsed the sentence as a waiver, printed `OK (exempt)`
    // with the prose as the stated reason, and exited 0 over a genuinely stale page. It is
    // the `Fixes THR-XX` prose-trigger class (THR-738) in a second gate, and it took the
    // same fix there: anchor to a line.
    //
    // The danger zone is precisely the documentation this repo asks for — you cannot write
    // an impediment about a marker, or a CLAUDE.md paragraph explaining one, without
    // mentioning it. An accidental waiver is worse than an accidental close, too: a close
    // is loud and reversible, a waiver is silent and shows green over a real defect.
    const anchored = /^[ \t]*(.*)$/u.exec(lines[i])?.[1] ?? "";
    if (!anchored.toLowerCase().startsWith(SWEEP_TOKEN.toLowerCase())) continue;
    const first = anchored.slice(SWEEP_TOKEN.length).trim();
    if (!first) continue;

    const parts = [first];
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next) break;
      if (REASON_TERMINATOR_PATTERN.test(next)) break;
      parts.push(next);
    }
    const value = parts.join(" ");
    // The id is matched by its own CHARSET (kebab-case), not as "the first whitespace-free
    // token". A token match swallows an attached separator — `prose:` parsed as the
    // doctrine id `prose:`, which then matches no registered doctrine and silently waives
    // nothing while looking like a correctly-written attestation. Anchoring on the charset
    // also lets an unspaced em dash terminate the id, since `—` can never be inside one.
    const match = /^([A-Za-z0-9_.]+(?:-[A-Za-z0-9_.]+)*)\s*(?:[—–:]|-{1,2})?\s*(.*)$/u.exec(value);
    if (!match) {
      // A value that resolves to no id at all is still an attestation — recorded rather
      // than dropped, so the verdict can say "an attestation was present and named nothing
      // we know" instead of failing the sweep with no explanation for a reader who is
      // certain they wrote one.
      out.push({ doctrineId: null, disposition: value });
      continue;
    }
    const [, head, tail] = match;
    out.push({ doctrineId: head, disposition: (tail || "").trim() || value });
  }
  return out;
}

export type SweepFinding = {
  doctrineId: string;
  touchedAuthorities: string[];
  untouchedDependents: string[];
};

/**
 * Pure sweep detector. For each doctrine, if any AUTHORITY is in the changed set, every
 * DEPENDENT must be too; the untouched ones are the finding. No git, no fs — the caller
 * supplies the manifest and the changed set, so this is deterministic and unit-testable.
 *
 * `manualDependents` are never considered: they live outside the repo and cannot appear
 * in a diff, so gating on them would make every authority edit fail forever. They are the
 * /guidance-audit skill's charge.
 */
export function computeSweepFindings(
  manifest: GuidanceManifest,
  changed: Set<string>,
): SweepFinding[] {
  const findings: SweepFinding[] = [];
  for (const [doctrineId, doctrine] of Object.entries(manifest.doctrines ?? {})) {
    const authorities = asStringArray(doctrine?.authorities);
    const dependents = asStringArray(doctrine?.dependents);
    if (authorities.length === 0) continue;

    const touchedAuthorities = authorities.filter((a) => changed.has(a));
    if (touchedAuthorities.length === 0) continue;

    const untouchedDependents = dependents.filter((d) => !changed.has(d));
    if (untouchedDependents.length === 0) continue;

    findings.push({ doctrineId, touchedAuthorities, untouchedDependents });
  }
  return findings;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

export type StampRow =
  | { kind: "current"; file: string; stamp: string }
  | { kind: "stale"; file: string; stamp: string; expected: string }
  | { kind: "unstamped"; file: string }
  | { kind: "no-frontmatter"; file: string }
  | { kind: "missing"; file: string };

/**
 * Read a `validated_doctrine` value out of a file's leading YAML frontmatter block.
 * Returns `null` when the file has no frontmatter at all (a distinct outcome from having
 * frontmatter without the key — one is a shape fact, the other is a real gap) and
 * `{ stamp: null }` when there is a block but no key.
 *
 * Deliberately a line scan rather than a YAML parse: the repo has no YAML dependency, the
 * key is a flat scalar by construction, and a parser would fail the whole file over an
 * unrelated frontmatter quirk in a check that is advisory anyway.
 */
export function readStamp(content: string): { hasFrontmatter: boolean; stamp: string | null } {
  const lines = content.split("\n");
  let i = 0;
  // Tolerate a BOM/blank preamble, but the fence must be the first meaningful line —
  // a `---` further down is a horizontal rule, not frontmatter.
  while (i < lines.length && lines[i].replace(/^﻿/, "").trim() === "") i++;
  if (i >= lines.length || lines[i].replace(/^﻿/, "").trim() !== "---") {
    return { hasFrontmatter: false, stamp: null };
  }
  for (let j = i + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.trim() === "---") break;
    const match = new RegExp(`^${STAMP_KEY}\\s*:\\s*(.+)$`, "u").exec(line.trim());
    if (match) return { hasFrontmatter: true, stamp: match[1].trim().replace(/^["']|["']$/gu, "") };
  }
  return { hasFrontmatter: true, stamp: null };
}

/** Classify one dependent's stamp against the doctrine version. Pure — content is injected. */
export function classifyStamp(
  file: string,
  content: string | null,
  doctrineId: string,
  version: string,
): StampRow {
  if (content === null) return { kind: "missing", file };
  const expected = `${doctrineId}@${version}`;
  const { hasFrontmatter, stamp } = readStamp(content);
  if (!hasFrontmatter) return { kind: "no-frontmatter", file };
  if (stamp === null) return { kind: "unstamped", file };
  if (stamp === expected) return { kind: "current", file, stamp };
  return { kind: "stale", file, stamp, expected };
}

function readFileOrNull(rel: string): string | null {
  try {
    return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

/** One line of stamp-report output. Split out so the wording is exercised by tests. */
export function describeStampRow(row: StampRow, doctrineId: string): string | null {
  switch (row.kind) {
    case "current":
      return null; // silent — reporting every healthy row buries the two that matter
    case "stale":
      return `${row.file} — stamp \`${row.stamp}\` trails \`${row.expected}\`; re-read it against the doctrine and bump, or leave it and say why.`;
    case "unstamped":
      return `${row.file} — has frontmatter but no \`${STAMP_KEY}\` key (add \`${STAMP_KEY}: ${doctrineId}@…\` when next validated).`;
    case "no-frontmatter":
      return `${row.file} — no frontmatter block, so no stamp surface. Covered by the sweep gate, not the stamp report.`;
    case "missing":
      return `${row.file} — listed as a dependent but not present in the tree (stale manifest entry; correct the manifest, not the PR).`;
  }
}

function main(): void {
  const mode = GUIDANCE_FRESHNESS_MODE;
  const modeLabel =
    mode === "blocking"
      ? "blocking"
      : `advisory (burn-in; flip reviewed after ${GUIDANCE_GATE_MODE.flipReviewAfter}, ${GUIDANCE_GATE_MODE.flipTicket})`;

  // Fail-soft on every manifest problem, in BOTH modes — see the header note on the
  // deliberate asymmetry with check-wiki-freshness. A guidance manifest that cannot be
  // read is a defect in this system, and this system must not take unrelated PRs down
  // with it.
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log(
      `check-guidance-freshness: WARNING — no manifest at Docs/guidance-manifest.json; nothing to check (mode=${modeLabel}).`,
    );
    return;
  }

  let manifest: GuidanceManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as GuidanceManifest;
  } catch (err) {
    console.log(
      `check-guidance-freshness: WARNING — Docs/guidance-manifest.json is not valid JSON, skipping: ${(err as Error).message}`,
    );
    return;
  }

  const doctrines = Object.entries(manifest.doctrines ?? {});
  if (doctrines.length === 0) {
    console.log("check-guidance-freshness: OK — manifest registers no doctrines (contract inert).");
    return;
  }

  const refresh = refreshBaseRef();
  const base = describeBase(GUIDANCE_FRESHNESS_BASE, refresh);
  if (refresh === "unfetchable") {
    console.log(
      `check-guidance-freshness: WARNING — could not fetch ${GUIDANCE_FRESHNESS_BASE} (offline?). ` +
        `The verdict below rests on a possibly-stale base ref and may disagree with CI.`,
    );
  }

  const changed = collectChangedFilesWith(git, GUIDANCE_FRESHNESS_BASE);
  if (changed === null) {
    console.log(
      `check-guidance-freshness: WARNING — no diff available against ${base}; sweep not evaluated. ` +
        `hint: \`git fetch origin main\` and give the checkout history (\`fetch-depth: 0\`).`,
    );
    return;
  }

  // --- Report 2 first, because it never fails and its rows are context for report 1. ---
  const stampLines: string[] = [];
  for (const [doctrineId, doctrine] of doctrines) {
    const version = String(doctrine?.version ?? "");
    if (!version) continue;
    for (const dep of asStringArray(doctrine?.dependents)) {
      const line = describeStampRow(classifyStamp(dep, readFileOrNull(dep), doctrineId, version), doctrineId);
      if (line) stampLines.push(line);
    }
  }

  // --- Report 1: the sweep gate. ---
  const findings = computeSweepFindings(manifest, changed);

  if (findings.length === 0) {
    const doctrineWord = doctrines.length === 1 ? "doctrine" : "doctrines";
    console.log(
      `check-guidance-freshness: OK — ${doctrines.length} ${doctrineWord} checked against ${base}, ` +
        `no authority edited without its sweep (mode=${modeLabel}).`,
    );
    printStampReport(stampLines);
    return;
  }

  // Attestations are resolved BEFORE any verdict banner is printed. The wiki gate learned
  // this the expensive way (THR-755 row 2): printing FAIL and a remediation instruction,
  // then discovering the waiver and exiting 0, leaves the reader looking at a failure and
  // a to-do that was already satisfied — and teaches them to disbelieve the real ones.
  const bodies = git(["log", "--format=%B", `${GUIDANCE_FRESHNESS_BASE}..HEAD`]);
  const attestations = bodies === null ? [] : parseSweepAttestations(bodies);
  const attestedIds = new Set(
    attestations
      .map((a) => a.doctrineId?.toLowerCase())
      .filter((id): id is string => typeof id === "string"),
  );

  const waived = findings.filter((f) => attestedIds.has(f.doctrineId.toLowerCase()));
  const live = findings.filter((f) => !attestedIds.has(f.doctrineId.toLowerCase()));

  for (const f of waived) {
    const a = attestations.find((x) => x.doctrineId?.toLowerCase() === f.doctrineId.toLowerCase());
    console.log(
      `check-guidance-freshness: OK (swept) — \`${f.doctrineId}\` authority edited with ` +
        `${f.untouchedDependents.length} dependent(s) untouched, waived by \`${SWEEP_TOKEN} ${a?.disposition ?? f.doctrineId}\``,
    );
    for (const dep of f.untouchedDependents) console.log(`  - ${dep}`);
  }

  if (live.length === 0) {
    printStampReport(stampLines);
    return;
  }

  const label = mode === "blocking" ? "FAIL" : "WARN";
  console.log(`check-guidance-freshness: ${label} (mode=${modeLabel}, base=${base})`);
  for (const f of live) {
    console.log(
      `  - doctrine \`${f.doctrineId}\`: authority changed (${f.touchedAuthorities.join(", ")}) ` +
        `but ${f.untouchedDependents.length} dependent(s) were not touched in this diff:`,
    );
    for (const dep of f.untouchedDependents) console.log(`      · ${dep}`);
    console.log(
      `    Sweep them in this PR, or attest: a commit-body line \`${SWEEP_TOKEN} ${f.doctrineId} — <what you checked and why nothing changed>\`.`,
    );
  }
  if (attestations.length > 0 && waived.length === 0) {
    console.log(
      `    (An attestation was present but named no registered doctrine: ` +
        `${attestations.map((a) => a.doctrineId ?? "?").join(", ")}. It waives nothing — name the doctrine id.)`,
    );
  }

  printStampReport(stampLines);

  if (mode !== "blocking") return;
  process.exit(1);
}

function printStampReport(stampLines: string[]): void {
  if (stampLines.length === 0) {
    console.log("  stamps: all dependents current.");
    return;
  }
  console.log(`  stamps (advisory — ${stampLines.length} row(s), never fails):`);
  for (const line of stampLines) console.log(`    · ${line}`);
}

/**
 * Entry guard by basename, not `import.meta.url === process.argv[1]`: esbuild's `--bundle`
 * rewrites `import.meta.url` to the bundle's URL, which can make a raw-equality guard fire
 * for an inlined import (the standing `esbuild_bundle_defeats_entry_guard` finding).
 */
function isDirectEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.basename(entry).replace(/\.(mjs|cjs|js|ts)$/, "") === "check-guidance-freshness";
}

if (isDirectEntry()) main();
