#!/usr/bin/env node

/**
 * Substantive-change predicate for the recurring documentation lanes (THR-920).
 *
 * Answers one question: **would committing this file tell a reader anything they
 * would act on?** If not, the lane skips the commit and `main` does not move.
 *
 * ## Why this exists
 *
 * Under strict branch protection a PR may only merge when it is built on the
 * newest `main`. Every merge therefore invalidates every other open PR, which
 * must re-run CI. CI on this repo is bimodally distributed — docs-only PRs
 * finish in 24–134 s, code PRs in 889–1242 s — so the drain ceiling is **one PR
 * per advance of `main`'s tip**, and what actually governs throughput is how
 * often the tip moves (THR-735, THR-920).
 *
 * Measured 2026-07-31 across the last 32 merges: **17 of them (53%)** came from
 * two hourly robots writing status reports about their own activity —
 * `keep-work-flowing-cc` (10) and `tb-orchestrator` (7). Several orchestrator
 * runs were titled "no promotions": the run decided nothing, wrote a report
 * saying so, merged it, and invalidated every open PR in the process.
 *
 * ## Why the gate that already existed did not fire
 *
 * `keep-work-flowing-cc` step 5 carried the rule in prose — *"Commit ONLY on
 * substantive change — a timestamp-only diff means skip the commit"*. It never
 * fired, because the briefing's body genuinely differs every hour: it embeds
 * live queue counts, PR numbers, merge states and ages. The diff is real. It is
 * just not worth moving the tip of `main` for.
 *
 * The prose gate tested **file-changed**. What matters is
 * **anything-a-reader-would-act-on**. That gap is the same "prose without
 * mechanism" shape that let THR-702 ship an armed-PR sweep which stepped past
 * `DIRTY` PRs while truthfully reporting success — which is why THR-920
 * required this predicate to live in a committed, testable script rather than in
 * another sentence asking the agent to judge.
 *
 * ## The two lanes, and why they need different predicates
 *
 * | lane        | file                       | substantive when |
 * |-------------|----------------------------|------------------|
 * | `briefing`  | `Design/briefing.md`       | its declared **digest** (item keys + verdicts) differs from the committed version |
 * | `report`    | `Docs/ops/<lane>-<run>.md` | its declared **outcome counters** are non-zero, or it needs Christian |
 *
 * The briefing is *rewritten* every hour, so at first glance this looks like a
 * diff question answered by a projection: strip the volatile fields, keep the
 * parts a reader acts on, compare against the last published copy. That backstop
 * exists
 * (`projectBriefing`) and is used when nothing better is available — but it
 * cannot be the primary signal, because the briefing's body is **rewritten
 * prose**, not a rendered template. The lane composes fresh wording every hour,
 * so two briefs saying the same thing rarely say it the same way, and a gate
 * built only on text comparison would report a change on nearly every run —
 * failing exactly the way the prose gate it replaces failed, one level further
 * in. So the primary signal is a digest the lane *declares*: stable keys for the
 * items under `## Needs Christian`, plus the closed-vocabulary verdicts. Rewording
 * changes no key; a real item does.
 *
 * A per-run report is a *new file* every run, so a diff question is meaningless —
 * every run is a change by construction. The question there is whether the run
 * did anything, which only the run knows, so it declares it in frontmatter and
 * this script turns those declarations into a verdict. The counters are facts
 * about actions taken (how many `save_issue` promotions landed), not a judgement
 * call about worth — that distinction is the whole point of moving the gate out
 * of prose.
 *
 * ## What counts as volatile
 *
 * Timestamps, clock times, dates, durations and git SHAs are scrubbed everywhere.
 * `THR-\d+` issue ids and `#\d+` PR numbers are **protected** — they are identity,
 * not noise, and a brief that starts naming a different issue is news.
 *
 * In `## Queue` and `## Freshness`, bare integers are scrubbed too: a ready count
 * moving 22 → 23 is not news, while the verdict word ("starved" / "backed up" /
 * "stale") is. In `## Needs Christian` and `## From Christian` bare integers are
 * **kept** — "11 content tickets are blocked" is a number a reader acts on.
 *
 * ## The Needs-Christian safety rule
 *
 * THR-920's coordination block requires that a run with genuine `## Needs
 * Christian` content can never be talked out of committing by the rest of the
 * predicate — `Design/briefing.md` is Christian's only inbox, and a skipped
 * commit there means an item he needs sits in an unmerged file. So the projection
 * puts that section first and compares it with the least scrubbing of any
 * section: only timestamps, durations and SHAs are removed, so an item whose age
 * ticks 19h → 20h does not manufacture an hourly commit, while any change to
 * *what* is being asked does.
 *
 * A transition from empty to non-empty always commits, because the projections
 * differ.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every failure path degrades to `commit`, never to `skip`, and always exits 0.
 * A missing baseline, an unreadable file, absent frontmatter or an unparseable
 * counter all mean "I could not prove this is noise", and the safe answer to that
 * is to publish. The cost of a spurious commit is one merge; the cost of a
 * wrongly-skipped one is a lost audit trail or a dropped item for Christian.
 *
 * ## Usage
 *
 *   node --experimental-strip-types scripts/check-substantive-change.ts \
 *     --lane briefing --file Design/briefing.md [--json]
 *
 *   node --experimental-strip-types scripts/check-substantive-change.ts \
 *     --lane report --file Docs/ops/orchestrator-2026-07-31k.md [--json]
 *
 * The briefing baseline defaults to `git show origin/ops:<file>` — the briefing
 * is published to the `ops` branch, not `main` (THR-947). Pass `--baseline-ref
 * <ref>` to read it from a different ref, or `--baseline <path>` to compare
 * against a file instead (used by the tests).
 *
 * Exit code is 0 in all non-`--strict` cases. With `--strict`, a `skip` verdict
 * exits 1 so a shell `if` can branch on it without parsing JSON.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export type Lane = "briefing" | "report";
export type Verdict = "commit" | "skip" | "unknown";

export interface Result {
  verdict: Verdict;
  lane: Lane;
  /** Machine-readable cause, stable across wording changes. */
  reason: string;
  /** One line a human can read in a run log. */
  summary: string;
  /** The normalized projection actually compared — inspectability, NFP #2. */
  projection?: string;
  baselineFound?: boolean;
}

/** Sections whose content is compared with integers preserved. */
const READER_ACTIONABLE_SECTIONS = ["needs christian", "from christian"];

/** Sections compared with bare integers scrubbed (verdict words survive). */
const VOLATILE_COUNT_SECTIONS = ["queue", "freshness"];

/**
 * Sections dropped from the projection entirely. `What's moving` is a narrative
 * of PR activity that changes every hour by construction and asks nothing of the
 * reader; the `Generated:` line is the timestamp the old prose gate already
 * excluded.
 */
const IGNORED_SECTIONS = ["what's moving", "whats moving"];

const PROTECT_PATTERNS: RegExp[] = [
  /THR-\d+/gi, // issue identity
  /#\d+/g, // PR identity
];

const VOLATILE_PATTERNS: RegExp[] = [
  // ISO datetimes, with or without seconds / zone
  /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?/g,
  // bare dates
  /\d{4}-\d{2}-\d{2}/g,
  // clock times
  /\b\d{1,2}:\d{2}\b/g,
  // durations: "19 hours", "3h", "45m", "2 days", "1.5 h"
  /\b\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?|d|days?|w|weeks?)\b/gi,
  // git SHAs — hex, 7–40 chars, and containing at least one digit so ordinary
  // words made only of a–f ("facade", "added") are not mistaken for one
  /\b(?=[0-9a-f]{7,40}\b)[0-9a-f]*\d[0-9a-f]*\b/g,
];


/**
 * Placeholders are built from **letters only**, deliberately. One carrying digits
 * would be eaten by `stripBareIntegers`; one carrying `-` or `#` would be eaten by
 * the markdown strip — which is exactly how the first cut of this function
 * destroyed the `-` in `THR-920` and the `#` in `#1175` that it existed to
 * protect. Caught by the tests below, not by review.
 */
const PROTECT_PREFIX = "qqprotqq";
const PROTECT_SUFFIX = "qq";

const encodeIndex = (i: number): string =>
  String(i)
    .split("")
    .map((d) => String.fromCharCode(97 + Number(d)))
    .join("");

const decodeIndex = (s: string): number =>
  Number(
    s
      .split("")
      .map((c) => String(c.charCodeAt(0) - 97))
      .join(""),
  );

/**
 * Replace volatile spans with a constant, preserving protected identity tokens.
 *
 * `stripBareIntegers` additionally collapses standalone numbers, for sections
 * where a count is a live measurement rather than a fact the reader acts on.
 *
 * The result is lowercased — callers compare projections, never show them to a
 * reader, so case carries no signal.
 */
export function scrubVolatile(text: string, stripBareIntegers = false): string {
  const protectedTokens: string[] = [];

  let out = text;
  for (const pattern of PROTECT_PATTERNS) {
    out = out.replace(pattern, (match) => {
      protectedTokens.push(match);
      return `${PROTECT_PREFIX}${encodeIndex(protectedTokens.length - 1)}${PROTECT_SUFFIX}`;
    });
  }

  for (const pattern of VOLATILE_PATTERNS) {
    out = out.replace(pattern, " ");
  }

  if (stripBareIntegers) {
    out = out.replace(/\b\d+(?:\.\d+)?\b/g, " ");
  }

  // Markdown emphasis and list bullets are presentation, not meaning. This runs
  // BEFORE restore so it cannot damage the identity tokens it is meant to keep.
  out = out.replace(/[*_`>#-]+/g, " ");

  out = out.replace(
    new RegExp(`${PROTECT_PREFIX}([a-j]+)${PROTECT_SUFFIX}`, "g"),
    (_, idx: string) => protectedTokens[decodeIndex(idx)] ?? "",
  );

  return out.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Split a markdown document into `## ` sections, keyed by lowercased heading. */
export function splitSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split(/\r?\n/);

  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (heading !== null) sections.set(heading, buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of lines) {
    const match = /^##\s+(.*?)\s*$/.exec(line);
    if (match && !line.startsWith("###")) {
      flush();
      heading = match[1].trim().toLowerCase();
    } else if (heading !== null) {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}

/**
 * Reduce a briefing to the parts a reader would act on, as a stable string.
 *
 * Ordering is fixed rather than document order so that moving a section does not
 * read as a change, and `## Needs Christian` leads so a diff of the projection is
 * legible when it does change.
 */
export function projectBriefing(markdown: string): string {
  const sections = splitSections(markdown);
  const parts: string[] = [];

  for (const name of READER_ACTIONABLE_SECTIONS) {
    parts.push(`[${name}] ${scrubVolatile(sections.get(name) ?? "", false)}`);
  }
  for (const name of VOLATILE_COUNT_SECTIONS) {
    parts.push(`[${name}] ${scrubVolatile(sections.get(name) ?? "", true)}`);
  }

  // Anything the lane adds later is included by default rather than silently
  // dropped — an unknown section is treated as actionable until someone decides
  // otherwise. Only the explicitly ignored ones are discarded.
  const known = new Set([
    ...READER_ACTIONABLE_SECTIONS,
    ...VOLATILE_COUNT_SECTIONS,
    ...IGNORED_SECTIONS,
  ]);
  for (const [name, body] of [...sections.entries()].sort()) {
    if (known.has(name)) continue;
    parts.push(`[${name}] ${scrubVolatile(body, true)}`);
  }

  return parts.join("\n");
}

export interface BriefingDigest {
  /** Stable keys for the items under `## Needs Christian`; empty means none. */
  needsChristian: string[];
  /** Closed-vocabulary verdicts a reader acts on. */
  verdicts: Record<string, string>;
}

const DIGEST_VERDICT_KEYS = ["queue", "freshness", "deploy", "tasks"] as const;

/**
 * Read the machine-readable digest a briefing declares in its frontmatter.
 *
 * This exists because the briefing's body is **rewritten prose**, not a rendered
 * template: the lane composes fresh wording every hour, so two briefs saying the
 * same thing rarely say it the same way. A text projection therefore reports a
 * change on nearly every run, and a gate built only on one would never fire —
 * the same failure as the prose gate it replaces, one level further in.
 *
 * The digest sidesteps that by having the lane declare *which* items exist by
 * stable key, and what each verdict is, independently of how it worded them.
 * Rewriting "nothing needs you" into "you are clear this hour" changes no key.
 * Adding a genuine item does.
 *
 * Returns `null` when absent or empty, which sends the caller to the projection
 * backstop rather than to a wrong answer.
 */
export function parseBriefingDigest(markdown: string): BriefingDigest | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown.trimStart());
  if (!match) return null;

  const body = match[1];
  const read = (key: string): string | null => {
    const m = new RegExp(`^\\s*${key}\\s*:\\s*(.*?)\\s*$`, "im").exec(body);
    return m && m[1].length > 0 ? m[1] : null;
  };

  const rawItems = read("needsChristian");
  if (rawItems === null) return null;

  const needsChristian =
    rawItems.toLowerCase() === "none"
      ? []
      : rawItems
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0)
          .sort();

  const verdicts: Record<string, string> = {};
  for (const key of DIGEST_VERDICT_KEYS) {
    const value = read(key);
    if (value !== null) verdicts[key] = value.trim().toLowerCase();
  }

  return { needsChristian, verdicts };
}

export function renderDigest(digest: BriefingDigest): string {
  const items = digest.needsChristian.join(",") || "none";
  const verdicts = Object.keys(digest.verdicts)
    .sort()
    .map((k) => `${k}=${digest.verdicts[k]}`)
    .join(",");
  return `needsChristian:${items}|${verdicts}`;
}

export function evaluateBriefing(current: string, baseline: string | null): Result {
  const projection = projectBriefing(current);

  if (baseline === null) {
    return {
      verdict: "commit",
      lane: "briefing",
      reason: "no-baseline",
      summary:
        "No committed version to compare against — committing (fail-soft: cannot prove this is noise).",
      projection,
      baselineFound: false,
    };
  }

  // Primary signal: the declared digest. Only trusted when BOTH sides declare
  // one — comparing a digest against a projection would be comparing two
  // different things, and the first run after this ships has no digest upstream.
  const currentDigest = parseBriefingDigest(current);
  const baselineDigest = parseBriefingDigest(baseline);

  if (currentDigest && baselineDigest) {
    const rendered = renderDigest(currentDigest);
    if (rendered === renderDigest(baselineDigest)) {
      return {
        verdict: "skip",
        lane: "briefing",
        reason: "digest-unchanged",
        summary:
          "Same items and same verdicts as the committed brief — skipping commit; lastRunAt is the heartbeat.",
        projection: rendered,
        baselineFound: true,
      };
    }
    return {
      verdict: "commit",
      lane: "briefing",
      reason: "digest-changed",
      summary: `Declared items or verdicts changed (${rendered}) — committing.`,
      projection: rendered,
      baselineFound: true,
    };
  }

  // Backstop: no digest on one or both sides. Compare semantic projections.
  // Prose rewrites make this noisier than the digest, so it errs toward
  // committing — which is the correct direction to err.
  const baselineProjection = projectBriefing(baseline);
  if (projection === baselineProjection) {
    return {
      verdict: "skip",
      lane: "briefing",
      reason: "projection-unchanged",
      summary:
        "Only volatile fields moved (timestamp, counts, ages, PR states) — skipping commit; lastRunAt is the heartbeat.",
      projection,
      baselineFound: true,
    };
  }

  return {
    verdict: "commit",
    lane: "briefing",
    reason: "projection-changed",
    summary:
      "A reader-actionable section changed (no digest on both sides — using the projection backstop) — committing.",
    projection,
    baselineFound: true,
  };
}

export interface ReportOutcome {
  promoted: number;
  filed: number;
  resolved: number;
  newFindings: number;
  needsChristian: boolean;
}

const OUTCOME_COUNTERS = ["promoted", "filed", "resolved", "newFindings"] as const;

/**
 * Read the outcome counters a per-run report declares in its frontmatter.
 *
 * Returns `null` when there is no frontmatter or no counter in it — which the
 * caller treats as "cannot prove this is noise", not as a zero.
 */
export function parseReportOutcome(markdown: string): ReportOutcome | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown.trimStart());
  if (!match) return null;

  const body = match[1];
  const read = (key: string): string | null => {
    const m = new RegExp(`^\\s*${key}\\s*:\\s*(\\S+)\\s*$`, "im").exec(body);
    return m ? m[1] : null;
  };

  const outcome: ReportOutcome = {
    promoted: 0,
    filed: 0,
    resolved: 0,
    newFindings: 0,
    needsChristian: false,
  };

  let sawAny = false;
  for (const key of OUTCOME_COUNTERS) {
    const raw = read(key);
    if (raw === null) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return null; // unparseable → fail-soft to commit
    outcome[key] = n;
    sawAny = true;
  }

  const nc = read("needsChristian");
  if (nc !== null) {
    outcome.needsChristian = nc.toLowerCase() === "true";
    sawAny = true;
  }

  return sawAny ? outcome : null;
}

export function evaluateReport(markdown: string): Result {
  const outcome = parseReportOutcome(markdown);

  if (outcome === null) {
    return {
      verdict: "commit",
      lane: "report",
      reason: "no-outcome-frontmatter",
      summary:
        "Report declares no outcome counters — committing (fail-soft). Add an outcome frontmatter block so no-op runs can be detected.",
    };
  }

  if (outcome.needsChristian) {
    return {
      verdict: "commit",
      lane: "report",
      reason: "needs-christian",
      summary: "Report carries a Needs-Christian item — committing.",
    };
  }

  const total = OUTCOME_COUNTERS.reduce((sum, key) => sum + outcome[key], 0);
  if (total > 0) {
    const detail = OUTCOME_COUNTERS.filter((k) => outcome[k] > 0)
      .map((k) => `${k}=${outcome[k]}`)
      .join(", ");
    return {
      verdict: "commit",
      lane: "report",
      reason: "outcome-non-zero",
      summary: `Run did something (${detail}) — committing.`,
    };
  }

  return {
    verdict: "skip",
    lane: "report",
    reason: "no-op-run",
    summary:
      "Run promoted, filed and resolved nothing, found nothing new and needs nobody — writing no artifact; the session output is the record.",
  };
}

/**
 * Where the previously-published briefing lives (THR-947).
 *
 * This tracks the file, and it has to. Since the 2026-08-02 cutover the briefing
 * is published to the unprotected `ops` branch and `main` carries only a pointer
 * stub. Reading the baseline from `main` would compare every hour's real brief
 * against that stub, never match, and return `commit` on every single run —
 * silently un-doing THR-920, which exists precisely to keep this lane from
 * advancing `main`'s tip on unchanged content.
 *
 * Overridable via `--baseline-ref` so the ref is a parameter rather than a
 * recompile, and `git fetch`ed before reading because a session worktree's
 * remote-tracking ref for a branch it never checks out is otherwise arbitrarily
 * old.
 */
const DEFAULT_BASELINE_REF = "origin/ops";

function readBaselineFromGit(file: string, ref: string): string | null {
  const slash = ref.indexOf("/");
  if (slash > 0) {
    const remote = ref.slice(0, slash);
    const branch = ref.slice(slash + 1);
    try {
      execFileSync("git", ["fetch", remote, branch, "--quiet"], {
        stdio: ["ignore", "ignore", "ignore"],
      });
    } catch {
      // Offline or no such branch — fall through and read whatever ref we have.
    }
  }
  try {
    return execFileSync("git", ["show", `${ref}:${file}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const arg = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");

  const lane = (arg("lane") ?? "briefing") as Lane;
  const file = arg("file");

  let result: Result;

  if (!file) {
    result = {
      verdict: "commit",
      lane,
      reason: "no-file-argument",
      summary: "No --file given — committing (fail-soft).",
    };
  } else {
    let current: string | null = null;
    try {
      current = readFileSync(file, "utf8");
    } catch {
      current = null;
    }

    if (current === null) {
      result = {
        verdict: "commit",
        lane,
        reason: "unreadable-file",
        summary: `Could not read ${file} — committing (fail-soft).`,
      };
    } else if (lane === "report") {
      result = evaluateReport(current);
    } else {
      const baselinePath = arg("baseline");
      const baseline =
        baselinePath !== undefined
          ? (() => {
              try {
                return readFileSync(baselinePath, "utf8");
              } catch {
                return null;
              }
            })()
          : readBaselineFromGit(file, arg("baseline-ref") ?? DEFAULT_BASELINE_REF);
      result = evaluateBriefing(current, baseline);
    }
  }

  // The digest projection is short and worth printing; the backstop projection is
  // the whole brief and would bury a run log. Cap it — this field exists for
  // inspectability (NFP #2), not for reproducing the document.
  const PROJECTION_LOG_MAX = 400;
  if (result.projection && result.projection.length > PROJECTION_LOG_MAX) {
    result = {
      ...result,
      projection: `${result.projection.slice(0, PROJECTION_LOG_MAX)}… (${result.projection.length} chars)`,
    };
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`verdict: ${result.verdict} (${result.reason})`);
    console.log(result.summary);
  }

  process.exit(strict && result.verdict === "skip" ? 1 : 0);
}

// Only run the CLI when invoked directly, so the tests can import the pure
// functions without the process exiting underneath them.
if (process.argv[1] && process.argv[1].includes("check-substantive-change")) {
  main();
}
