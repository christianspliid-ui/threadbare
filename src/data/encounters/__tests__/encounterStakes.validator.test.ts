/**
 * Encounter stakes validator — THR-1727, **required mode** since THR-1728.
 *
 * The stakes line only holds its shape if every template's parts read in the
 * slots the formula gives them (`[actor] must [goal] — or [risk].`, `[actor]
 * [won].`). This suite:
 *
 * 1. **fails** on malformed `stakes` anywhere in the predicate (shape, case,
 *    punctuation, caps, forbidden words, raw tokens, a missing `lostBadly` where
 *    the template authors a distinct critical-failure ending, missing `arms`
 *    where fork arms end differently);
 * 2. **fails** when a template in the predicate authors no `stakes` (THR-1728
 *    drained the backlog and flipped this from report mode). Without stakes the
 *    veil falls back to the scene's opening prose; the designer-voice
 *    `description` never reaches it.
 *
 * **Membership predicate** (THR-688 rule A, computed, never a snapshot count):
 * every template in the unified registry, the exploration encounter list or the
 * location-branching list that `isEncounterAction` classifies as an encounter —
 * i.e. every template that can open on the encounter veil from those registries.
 * Asserted on the **shipped** object (`getUnifiedTemplateById`), so a converter
 * that drops the field fails here rather than in a playtest.
 */

import { describe, expect, it } from 'vitest';
import {
  getUnifiedTemplateById,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../../encounter-content';
import { isEncounterAction } from '../../../engine/chapterArchive';
import { SLICE_TEMPLATE_IDS } from '../vertical-slice';
import {
  STAKES_FORBIDDEN_WORDS,
  STAKES_GOAL_MAX_CHARS,
  STAKES_RISK_MAX_CHARS,
} from '../../nudge-stage-content';
import {
  isActionStepBranch,
  type UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { EncounterStakes } from '../../../types/encounterStakes';

function templatesInPredicate(): UnifiedActionTemplate[] {
  const byId = new Map<string, UnifiedActionTemplate>();
  for (const t of [...UNIFIED_ACTION_TEMPLATES, ...ENCOUNTER_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES]) {
    if (byId.has(t.id) || !isEncounterAction(t.id)) continue;
    byId.set(t.id, getUnifiedTemplateById(t.id) ?? t);
  }
  return [...byId.values()];
}

const FORBIDDEN = new RegExp(`\\b(${STAKES_FORBIDDEN_WORDS.join('|')})\\b`, 'i');

/** The part's own shape: a lowercase verb phrase with no final period or token. */
function partProblems(name: string, text: string | undefined, cap: number): string[] {
  if (text === undefined) return [];
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
function hasDistinctCriticalFailure(t: UnifiedActionTemplate): boolean {
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
function armsOwed(t: UnifiedActionTemplate): string[] {
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

function stakesProblems(t: UnifiedActionTemplate, stakes: EncounterStakes): string[] {
  const out = [
    ...partProblems('goal', stakes.goal, STAKES_GOAL_MAX_CHARS),
    ...partProblems('risk', stakes.risk, STAKES_RISK_MAX_CHARS),
    ...partProblems('won', stakes.won, STAKES_GOAL_MAX_CHARS),
    ...partProblems('lost', stakes.lost, STAKES_RISK_MAX_CHARS),
    ...partProblems('lostBadly', stakes.lostBadly, STAKES_RISK_MAX_CHARS),
  ];
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
  const owed = armsOwed(t);
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

describe('THR-1727 · encounter stakes validator (required mode, THR-1728)', () => {
  const templates = templatesInPredicate();

  it('the predicate is computed and non-trivial', () => {
    expect(templates.length).toBeGreaterThan(Object.keys(SLICE_TEMPLATE_IDS).length);
  });

  it('every authored stakes block is well formed', () => {
    const problems: string[] = [];
    for (const t of templates) {
      if (!t.stakes) continue;
      for (const p of stakesProblems(t, t.stakes)) problems.push(`${t.id}: ${p}`);
    }
    expect(problems).toEqual([]);
  });

  it('the five slice encounters ship stakes (through the registry, not the literal)', () => {
    for (const id of [
      SLICE_TEMPLATE_IDS.bridge,
      SLICE_TEMPLATE_IDS.pass,
      SLICE_TEMPLATE_IDS.caravan,
      SLICE_TEMPLATE_IDS.crossroads,
      SLICE_TEMPLATE_IDS.family,
    ]) {
      expect(getUnifiedTemplateById(id)?.stakes, id).toBeDefined();
      expect(templates.some(t => t.id === id), `${id} is outside the predicate`).toBe(true);
    }
  });

  it('every template in the predicate authors stakes (THR-1728 required mode)', () => {
    const missing = templates.filter(t => !t.stakes).map(t => t.id).sort();
    expect(missing, 'encounter templates without stakes — author goal/risk/won/lost (see Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md § Content pillar)').toEqual([]);
  });

  // The validator's own falsification twin: a malformed block must be caught.
  it('catches a malformed block', () => {
    const bad: EncounterStakes = {
      goal: 'Cross the bridge.',
      risk: 'let the traveler fall {cast:keeper}',
      won: 'crossed',
      lost: 'x'.repeat(STAKES_RISK_MAX_CHARS + 1),
    };
    const bridge = getUnifiedTemplateById(SLICE_TEMPLATE_IDS.bridge)!;
    const problems = stakesProblems(bridge, bad);
    expect(problems.join('\n')).toMatch(/goal starts with a capital/);
    expect(problems.join('\n')).toMatch(/goal ends in punctuation/);
    expect(problems.join('\n')).toMatch(/risk carries a raw token/);
    expect(problems.join('\n')).toMatch(/risk uses forbidden word "traveler"/);
    expect(problems.join('\n')).toMatch(/lost is \d+ chars/);
    expect(problems.join('\n')).toMatch(/lostBadly missing/);

    const family = getUnifiedTemplateById(SLICE_TEMPLATE_IDS.family)!;
    expect(stakesProblems(family, { ...family.stakes!, arms: undefined }).join('\n')).toMatch(/arms missing/);
    expect(stakesProblems(family, { ...family.stakes!, arms: { sideways: { won: 'went sideways' } } }).join('\n'))
      .toMatch(/arms\.sideways names no fork arm/);
  });
});
