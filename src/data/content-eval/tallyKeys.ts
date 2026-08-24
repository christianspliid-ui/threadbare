/**
 * Reputation-tally key validity — the authoring-time half of a runtime leak. THR-1206.
 *
 * Plan: `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`
 *
 * `reputation_tally` records what an actor is becoming **known for**, on a
 * `<reach>.positive|negative` key, and the aftermath handler
 * (`encounterAftermath.ts`, `isValidReputationTallyKey`) writes nothing for any other
 * key. That rejection has always been correct and always been silent-ish: it emits a
 * rate-limited trace nobody reads and then drops the write. Measured at survey time,
 * **171 of 518 authored tally writes (33%) across 78 distinct keys** were landing on
 * keys the engine refuses — content promising the player a consequence that the
 * engine discards on every single resolution.
 *
 * This module is the gate that stops the class growing. It is a **ratchet**: the
 * allowlist below freezes the leak at its surveyed size, and the sweep ticket burns it
 * down. Nothing may be added to it — a new off-axis key is a hard fail, and the
 * message names the mechanism the fiction actually means.
 *
 * ## Why the predicate lives here rather than in `check:encounter`
 *
 * `check:encounter --all` sweeps `encounter.*` ids only (`ENCOUNTER_ID_PREFIXES`) —
 * 15 of the 687 templates carrying an invalid key, holding 8 of the 78 keys. A rule
 * implemented only there would inspect **10%** of the class it exists to close, and
 * report green over the other 90% while it kept growing. So the predicate is shared
 * and has two consumers: the corpus-wide test (`tallyKeyCorpus.test.ts`), which is
 * what actually holds the line, and `check:encounter`, which tells an author about
 * their own template the moment they run the factory gate.
 */

import { REACH_DOMAINS } from '../../types/traits';

/** The only keys the aftermath handler will write: `<reach>.positive|negative`. */
export const VALID_TALLY_KEYS: ReadonlySet<string> = new Set(
  REACH_DOMAINS.flatMap(d => [`${d}.positive`, `${d}.negative`]),
);

export function isValidTallyKey(key: string): boolean {
  return VALID_TALLY_KEYS.has(key);
}

/**
 * The 78 off-axis keys already shipped when the gate went up — a ratchet that only
 * ever shrinks (THR-1206; drained by the dead-tally re-author sweep).
 *
 * Membership predicate for the sweep, so the list can rot without the rule rotting:
 * *any authored `reputation_tally` whose key is not `<reach>.positive|negative`*. Each
 * is re-authored to the mechanism its fiction means —
 *
 *   guild-work keys (`ac.*`, `tg.*`, `cg.*`, `ag.*`)  → `faction_reputation_gain`
 *   place/community keys (`route.*`, `community.*`, `slice.road_repute`)
 *                                                     → `reputation_with`
 *   company keys (`company.standing`, `army.command.*`) → company cohesion
 *   pure-narrative one-offs                            → a valid reach key, or deletion
 *
 * — and struck from this list in the same edit. Do **not** add to it.
 *
 * `flesh.positive` looks valid and is not: `flesh` is a retired encounter reach
 * (`LEGACY_ENCOUNTER_REACHES`), not one of the eight, so the handler refuses it like
 * any other off-axis key.
 */
export const TALLY_KEY_RATCHET: readonly string[] = [
  // Drained to empty by THR-1207. Every one of the 78 keys was re-authored to the
  // mechanism its fiction meant; none was deleted to make the gate go green.
  // Nothing may be added here: the ratchet only ever shrank, and it has arrived.
];

const RATCHET = new Set(TALLY_KEY_RATCHET);

/** Is this key an already-shipped leak the ratchet tolerates until the sweep drains it? */
export function isRatchetedTallyKey(key: string): boolean {
  return RATCHET.has(key);
}

/**
 * Walk anything for `reputation_tally` effects.
 *
 * Structural rather than shape-aware on purpose: authored tallies live under
 * `aftermathConfig.byOutcome[band].reactions[].effects[]`, under bare `reactions[]`,
 * and under `aftermathVariants`, and a hand-written path list would silently miss the
 * shape it did not know about. A walk that only asks `kind === 'reputation_tally'`
 * cannot. (This is exactly how the first survey of this leak came back `0 invalid` on
 * a corpus holding 171 of them.)
 */
export function collectTallyKeys(root: unknown): Array<{ key: string }> {
  const found: Array<{ key: string }> = [];
  const seen = new WeakSet<object>();
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (obj.kind === 'reputation_tally' && typeof obj.key === 'string') {
      found.push({ key: obj.key });
    }
    for (const value of Object.values(obj)) walk(value);
  };
  walk(root);
  return found;
}

/** Author-facing guidance, keyed by the shape of the key rather than by each key. */
export function suggestTallyReplacement(key: string): string {
  if (/^(ac|tg|cg|ag|bf)\./.test(key)) {
    return 'guild work → `faction_reputation_gain` (carries rank and access)';
  }
  if (/^(route|community)\.|repute/.test(key)) {
    return 'standing with a place or community → `reputation_with`';
  }
  if (/^(army\.command|company)\./.test(key)) {
    return 'a company or army holding together → company cohesion, not a tally';
  }
  return 'what the actor is known for → a `<reach>.positive|negative` key; '
    + 'a private note about them → `hidden_mark`; standing with someone → `reputation_with`';
}

/**
 * Every off-axis tally key in `template`, as author-facing messages.
 *
 * Ratcheted keys are reported as `[]` — they are the frozen backlog, not new debt.
 */
export function invalidTallyKeyProblems(template: unknown, templateId: string): readonly string[] {
  const problems: string[] = [];
  const seenHere = new Set<string>();
  for (const { key } of collectTallyKeys(template)) {
    if (isValidTallyKey(key) || isRatchetedTallyKey(key)) continue;
    if (seenHere.has(key)) continue;
    seenHere.add(key);
    problems.push(
      `${templateId} authors reputation_tally key '${key}', which the aftermath handler `
      + `refuses (only <reach>.positive|negative is written) — the effect is discarded at `
      + `runtime. Use ${suggestTallyReplacement(key)}.`,
    );
  }
  return problems;
}
