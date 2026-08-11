#!/usr/bin/env node

/**
 * Doorbell gate for `keep-work-flowing-cc`'s Discord ping.
 *
 * Answers one question: **has Christian been handed a new ask since the last
 * time this lane rang his phone?** If not, the lane publishes the brief and
 * stays quiet.
 *
 * ## Why this exists as code
 *
 * The gate was prose in three places that had drifted apart, and each hourly run
 * reconstructed it from first principles — reaching a slightly different answer
 * each time. Four incidents are recorded in
 * `~/.claude/channels/discord/kwf-last-ping.derivation`:
 *
 * | date        | what happened |
 * |-------------|---------------|
 * | 2026-08-06  | method changed from prose-lines to declared keys; hash moved without a ping |
 * | 2026-08-10  | stored hash was stale — a naive "hash differs" read would have fired a duplicate doorbell 56 min after the real one |
 * | 2026-08-10  | removal-only diff; a ping would have carried only asks he had already seen, delivered because he completed the seventh |
 * | 2026-08-11  | run "nearly misfired" — caught only by reading the previous brief back from `ops` and diffing membership by hand |
 *
 * The skill file said to hash *the rendered ask lines*. The method file said to
 * hash *the briefing frontmatter's `needsChristian:` key list*. That frontmatter
 * no longer exists — THR-954 retired the publish gate that owned it — so the
 * documented input had become unobtainable as written, while the documented
 * *alternative* was the one the method file twice argued was wrong: the brief's
 * prose is rewritten every hour by design, so hashing it fires the doorbell on
 * wording churn.
 *
 * This is the same "prose without mechanism" shape that
 * `check-substantive-change.ts` was written to close for the publish gate. Same
 * remedy: a declared stable-key set, compared by committed, testable code.
 *
 * ## The load-bearing design choice: compare against the PINGED set
 *
 * The obvious implementation stores a hash of the last run's keys and compares
 * consecutive runs. That is what the hash file did, and it is why the
 * removal-only rule had to be bolted on in prose and remembered by hand.
 *
 * This compares against the set **as of the last ping that actually sent** — the
 * only thing that describes what Christian has already been shown. Then the rule
 * the derivation log had to state in English falls out of the data model:
 *
 * - an ask **joins** the set  → he has not seen it → ring
 * - an ask **leaves** the set → he has seen everything that remains → stay quiet
 * - nothing moves             → stay quiet
 *
 * A removal-only diff needs no special case, and a *sequence* of removals cannot
 * drift the baseline out from under the comparison, because removals never
 * advance it. Nothing has to be remembered next hour.
 *
 * ## Rewording a live ask
 *
 * Identity is the key, not the prose, so re-writing an ask's paragraph does not
 * ring — by design. When an ask's *substance* changes enough that he genuinely
 * needs telling again, the lane rotates its key (`thr-998-risk-word` →
 * `thr-998-risk-word-v2`). That reads as a departure plus an arrival, so it
 * rings. The judgment stays with the lane; the mechanism stays here.
 *
 * ## Failed sends
 *
 * State only advances on `--record pinged`, which the lane runs *after* the DM
 * is accepted. A send that throws leaves the baseline untouched, so the next run
 * sees the same arrival and retries. This is why recording is a separate
 * invocation rather than a side effect of the check.
 *
 * ## Usage
 *
 *     # decide (writes nothing)
 *     node --experimental-strip-types scripts/check-ping-gate.ts \
 *       --keys thr-907-slice-verdict,thr-998-risk-word --json
 *
 *     # after a DM is accepted
 *     node --experimental-strip-types scripts/check-ping-gate.ts \
 *       --keys ... --record pinged
 *
 *     # after a run that deliberately stayed quiet
 *     node --experimental-strip-types scripts/check-ping-gate.ts \
 *       --keys ... --record silent
 *
 * Exit code is 0 unless `--strict` is passed, which exits 1 when a ping is owed
 * (so a wrapper can branch on it).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/** Where the baseline lives when `--state` is not passed. */
export const DEFAULT_STATE_PATH = join(
  homedir(),
  ".claude",
  "channels",
  "discord",
  "kwf-ping-state.json",
);

export const STATE_VERSION = 1;

export type PingVerdict = "ping" | "silent" | "unchanged" | "empty" | "unknown";

export interface PingState {
  version: number;
  /** The ask set as of the last DM that actually sent. The comparison baseline. */
  pingedKeys: string[];
  pingedAt: string | null;
  /** The ask set as of the last run of any kind. Diagnostics only — never compared. */
  lastKeys: string[];
  lastRunAt: string | null;
  /** SHA-256 of the normalized `pingedKeys`. Diagnostics and log continuity. */
  hash: string | null;
}

export interface PingResult {
  verdict: PingVerdict;
  /** The single field the lane branches on. */
  needsPing: boolean;
  keys: string[];
  added: string[];
  removed: string[];
  baseline: string[];
  hash: string;
  summary: string;
}

/**
 * Normalize a key set so cosmetic churn cannot ring the doorbell: trim,
 * lowercase, drop empties, dedupe, sort. Re-ordering the brief's bullets or
 * capitalizing a ticket id is not news.
 */
export function normalizeKeys(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const key = item.trim().toLowerCase();
    if (key) seen.add(key);
  }
  return [...seen].sort();
}

export function parseKeyList(value: string | null): string[] {
  if (!value) return [];
  return normalizeKeys(value.split(","));
}

export function hashKeys(keys: readonly string[]): string {
  return createHash("sha256").update(normalizeKeys(keys).join(",")).digest("hex");
}

export function emptyState(): PingState {
  return {
    version: STATE_VERSION,
    pingedKeys: [],
    pingedAt: null,
    lastKeys: [],
    lastRunAt: null,
    hash: null,
  };
}

/**
 * Read the baseline. A missing or unreadable state file returns `null` rather
 * than an empty state, because the two must not be conflated: "no baseline yet"
 * has to ring (fail loud — a missed doorbell is silent and a spurious one costs
 * one message), whereas "baseline is genuinely empty" is the state right after
 * every ask is resolved, and must not ring on the next arrival-free run.
 */
export function readState(path: string): PingState | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<PingState>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      version: typeof parsed.version === "number" ? parsed.version : STATE_VERSION,
      pingedKeys: normalizeKeys(parsed.pingedKeys ?? []),
      pingedAt: parsed.pingedAt ?? null,
      lastKeys: normalizeKeys(parsed.lastKeys ?? []),
      lastRunAt: parsed.lastRunAt ?? null,
      hash: parsed.hash ?? null,
    };
  } catch {
    return null;
  }
}

export function writeState(path: string, state: PingState): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

/**
 * The gate. Pure — takes the current key set and the baseline, returns the
 * verdict. `baseline === null` means no state file has ever been written.
 */
export function evaluate(rawKeys: readonly string[], state: PingState | null): PingResult {
  const keys = normalizeKeys(rawKeys);
  const hash = hashKeys(keys);

  if (keys.length === 0) {
    return {
      verdict: "empty",
      needsPing: false,
      keys,
      added: [],
      removed: normalizeKeys(state?.pingedKeys ?? []),
      baseline: normalizeKeys(state?.pingedKeys ?? []),
      hash,
      summary: "Nothing needs Christian right now — no doorbell.",
    };
  }

  if (state === null) {
    return {
      verdict: "ping",
      needsPing: true,
      keys,
      added: keys,
      removed: [],
      baseline: [],
      hash,
      summary: `No ping baseline on record, so every one of the ${keys.length} open ask(s) is treated as unseen. Ringing once, then the baseline exists.`,
    };
  }

  const baseline = normalizeKeys(state.pingedKeys);
  const baselineSet = new Set(baseline);
  const currentSet = new Set(keys);
  const added = keys.filter((k) => !baselineSet.has(k));
  const removed = baseline.filter((k) => !currentSet.has(k));

  if (added.length > 0) {
    return {
      verdict: "ping",
      needsPing: true,
      keys,
      added,
      removed,
      baseline,
      hash,
      summary: `${added.length} ask(s) joined the set since the last doorbell (${added.join(", ")}) — ringing.`,
    };
  }

  if (removed.length > 0) {
    return {
      verdict: "silent",
      needsPing: false,
      keys,
      added,
      removed,
      baseline,
      hash,
      summary: `Removal-only diff (${removed.join(", ")} resolved); the ${keys.length} remaining ask(s) have all been shown already — staying quiet.`,
    };
  }

  return {
    verdict: "unchanged",
    needsPing: false,
    keys,
    added,
    removed,
    baseline,
    hash,
    summary: `The same ${keys.length} ask(s) as the last doorbell — staying quiet.`,
  };
}

/**
 * Fold a run's outcome into the baseline. `pinged` advances what Christian has
 * been shown; `silent` records the run without moving the comparison baseline,
 * which is what keeps a run of removals from eroding it.
 */
export function applyRecord(
  state: PingState | null,
  keys: readonly string[],
  outcome: "pinged" | "silent",
  nowIso: string,
): PingState {
  const base = state ?? emptyState();
  const normalized = normalizeKeys(keys);
  const next: PingState = {
    ...base,
    version: STATE_VERSION,
    lastKeys: normalized,
    lastRunAt: nowIso,
  };
  if (outcome === "pinged") {
    next.pingedKeys = normalized;
    next.pingedAt = nowIso;
    next.hash = hashKeys(normalized);
  }
  return next;
}

function flagValue(argv: string[], flag: string): string | null {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1]! : null;
}

function main(): void {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");
  const statePath = flagValue(argv, "--state") ?? DEFAULT_STATE_PATH;
  const record = flagValue(argv, "--record");
  const nowIso = flagValue(argv, "--now") ?? new Date().toISOString();

  let result: PingResult;
  let keys: string[] = [];

  try {
    keys = parseKeyList(flagValue(argv, "--keys"));
    const state = readState(statePath);
    result = evaluate(keys, state);

    if (record === "pinged" || record === "silent") {
      writeState(statePath, applyRecord(state, keys, record, nowIso));
    } else if (record !== null) {
      throw new Error(`--record expects "pinged" or "silent", got "${record}"`);
    }
  } catch (e) {
    result = {
      verdict: "unknown",
      needsPing: false,
      keys,
      added: [],
      removed: [],
      baseline: [],
      hash: "",
      summary: `Ping gate could not run: ${(e as Error).message}`,
    };
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`verdict: ${result.verdict}`);
    console.log(result.summary);
    if (result.added.length) console.log(`added:   ${result.added.join(", ")}`);
    if (result.removed.length) console.log(`removed: ${result.removed.join(", ")}`);
  }

  process.exit(strict && result.needsPing ? 1 : 0);
}

if (process.argv[1] && process.argv[1].includes("check-ping-gate")) {
  main();
}
