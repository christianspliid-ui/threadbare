/**
 * Encounter stakes rules — one predicate for every gate that judges `stakes`
 * (THR-1727 shipped the rules inside the validator test; THR-1728 lifted them
 * here so the test, `check:encounter` and the compiled-package path agree).
 *
 * The stakes line only holds its shape if every template's parts read in the
 * slots the formula gives them (`[actor] must [goal] — or [risk].`, `[actor]
 * [won].`). A template in the encounter predicate with no `stakes` at all fails
 * too (required mode): without it the veil falls back to the scene's opening
 * prose, and the Chapter Ledger has no result line to name the story by.
 *
 * Plan: `Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md` § Content pillar.
 */

import {
  STAKES_FORBIDDEN_WORDS,
  STAKES_GOAL_MAX_CHARS,
  STAKES_RISK_MAX_CHARS,
} from '../nudge-stage-content';
import { isActionStepBranch, type UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterStakes } from '../../types/encounterStakes';

const FORBIDDEN = new RegExp(`\\b(${STAKES_FORBIDDEN_WORDS.join('|')})\\b`, 'i');

/** The part's own shape: a lowercase verb phrase with no final period or token. */
function partProblems(name: string, text: string | undefined, cap: number): string[] {
  if (text === undefined) return [];
  if (typeof text !== 'string') return [`${name} is not a string`];
  const out: string[] = [];
  if (text.trim().length === 0) out.push(`${name} is empty`);
  if (text !== text.trim()) out.push(`${name} has edge whitespace`);
  if (/^[A-Z]/.test(text)) out.push(`${name} starts with a capital ("${text}")`);
  if (/[.!?]$/.test(text)) out.push(`${name} ends in punctuation ("${text}")`);
  if (text.length > cap) out.push(`${name} is ${text.length} chars (cap ${cap})`);
  if (/\{\w[^}]*\}/.test(text)) out.push(`${name} carries a raw token ("${text}")`);
  const hit = FORBIDDEN.exec(text);
  if (hit) out.push(`${name} uses forbidden word "${hit[1]}" ("${text}")`);
  return out;
}

/** Does the template author a critical-failure ending distinct from its plain failure? */
export function hasDistinctCriticalFailure(t: UnifiedActionTemplate): boolean {
  const config = t.aftermathConfig as UnifiedActionTemplate['aftermathConfig'] & {
    variants?: Record<string, { overview?: string; byOutcome?: Record<string, { overview?: string }> }>;
    fallback?: { overview?: string; byOutcome?: Record<string, { overview?: string }> };
  };
  const variants = [...Object.values(config?.variants ?? {}), ...(config?.fallback ? [config.fallback] : [])];
  return variants.some(v => {
    const crit = v.byOutcome?.critical_failure?.overview;
    const plain = v.byOutcome?.failure?.overview ?? v.overview;
    return Boolean(crit && crit !== plain);
  });
}

/**
 * Fork arms that end differently: a branch with two or more distinct step
 * objects, whose aftermath keys a variant to at least two of them. The top-level
 * endings cover one arm; `arms` must name every other.
 */
export function stakesArmsOwed(t: UnifiedActionTemplate): string[] {
  const branch = (t.steps ?? []).find(isActionStepBranch);
  if (!branch) return [];
  const distinct = new Map<unknown, string>();
  for (const [key, step] of Object.entries(branch.variants)) {
    if (!distinct.has(step)) distinct.set(step, key);
  }
  const armKeys = [...distinct.values()];
  const aftermathKeys = Object.keys((t.aftermathConfig as { variants?: Record<string, unknown> })?.variants ?? {});
  const endingArms = armKeys.filter(k => aftermathKeys.includes(k));
  return endingArms.length >= 2 ? armKeys : [];
}

/** Problems with an authored stakes block, judged against its template. Empty = well formed. */
export function stakesProblems(t: UnifiedActionTemplate, stakes: EncounterStakes): string[] {
  const out = [
    ...partProblems('goal', stakes.goal, STAKES_GOAL_MAX_CHARS),
    ...partProblems('risk', stakes.risk, STAKES_RISK_MAX_CHARS),
    ...partProblems('won', stakes.won, STAKES_GOAL_MAX_CHARS),
    ...partProblems('lost', stakes.lost, STAKES_RISK_MAX_CHARS),
    ...partProblems('lostBadly', stakes.lostBadly, STAKES_RISK_MAX_CHARS),
  ];
  for (const part of ['goal', 'risk', 'won', 'lost'] as const) {
    if (stakes[part] === undefined) out.push(`${part} is missing`);
  }
  for (const [arm, endings] of Object.entries(stakes.arms ?? {})) {
    out.push(
      ...partProblems(`arms.${arm}.won`, endings.won, STAKES_GOAL_MAX_CHARS),
      ...partProblems(`arms.${arm}.lost`, endings.lost, STAKES_RISK_MAX_CHARS),
      ...partProblems(`arms.${arm}.lostBadly`, endings.lostBadly, STAKES_RISK_MAX_CHARS),
    );
  }
  if (!stakes.lostBadly && hasDistinctCriticalFailure(t)) {
    out.push('lostBadly missing: the template authors a distinct critical_failure ending');
  }
  const owed = stakesArmsOwed(t);
  if (owed.length > 0) {
    const covered = new Set(Object.keys(stakes.arms ?? {}));
    const uncovered = owed.filter(k => !covered.has(k));
    // The top-level endings stand for exactly one arm.
    if (uncovered.length > 1) out.push(`arms missing for fork arms ${uncovered.join(', ')} (top level covers one)`);
    const variantKeys = new Set(Object.keys((t.steps ?? []).find(isActionStepBranch)?.variants ?? {}));
    for (const k of covered) if (!variantKeys.has(k)) out.push(`arms.${k} names no fork arm`);
  }
  return out;
}

/**
 * Required mode: the template's stakes problems, including their absence.
 * Never throws (NFP #4) — a malformed block reports, it does not crash a gate.
 */
export function encounterStakesProblems(t: UnifiedActionTemplate): string[] {
  if (!t.stakes) {
    return ['no `stakes` — author goal / risk / won / lost (the veil shows the stakes line in place of the description)'];
  }
  try {
    return stakesProblems(t, t.stakes);
  } catch (error) {
    return [`stakes could not be read: ${(error as Error).message}`];
  }
}
