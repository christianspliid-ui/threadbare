/**
 * Nudge Model WS0 — engine substrate tests (THR-773).
 *
 * Covers the three seams the plan makes falsifiable claims about: the riders are
 * pure band-mapping over the full six-value StepOutcome domain, erosion scales
 * to the pacing the design was reviewed on, and the broken state has hysteresis.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ActionStep, StepNudge, StepOutcome, UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  applyRider,
  buildNudgeHand,
  collectNudgeBandProse,
  collectNudgeModifiers,
  difficultyWord,
  resetNudgeWarnings,
  resolveTraitVariants,
  selectActiveRider,
  sumModifiers,
  sumVariantDifficultyDelta,
  totalNudgeCost,
} from '../encounters/nudges';
import { computeScaledErosion } from '../quintessenceActions';
import {
  isBrokenMortal,
  isAtBrokenThreshold,
  reconcileBrokenState,
  ticksBroken,
  BROKEN_SINCE_PROPERTY,
} from '../brokenState';
import { WorldGraph } from '../graph';
import { classifyMotive } from '../encounters/motiveClassifier';
import {
  DIFFICULTY_EROSION_SCALE,
  EROSION_ATTENDED_MULT,
  EROSION_BAND_MULT_CRITFAIL,
  QUINTESSENCE_RATIO_FLOOR,
} from '../../data/nudge-constants';
import { QUINTESSENCE_ENCOUNTER_FAILURE_EROSION } from '../../types/quintessence';
import {
  ALL_BAND_OUTCOMES,
  ANNOTATION_MAX_PER_ENCOUNTER,
  ANNOTATION_PATTERNS,
  FAILURE_BAND_OUTCOMES,
  HAND_COMMON_OPTIONS_MIN,
  HAND_SPHERE_COVERAGE_MIN,
  NUDGE_BIG_DELTA,
  NUDGE_HAND_MAX,
  NUDGE_HAND_MAX_TOTAL_DELTA,
  NUDGE_HAND_MIN,
  NUDGE_NAME_MAX_WORDS,
  NUDGE_OFF_REACH_MAX_DIFFICULTY,
  NUDGE_WORD_BUDGETS,
  REACH_PURPOSE_MAX_WORDS,
} from '../../data/content-eval/nudgeAuthoringConstants';
import {
  countIntensifiers,
  countVagueness,
  NATURAL_INDEFINITE_TERMS,
  type ProseFieldClass,
} from '../../data/content-eval/nudgeAuditDetectors';
import { computeResolutionThreshold, PROBABILITY_FLOOR } from '../resolutionService';
import { NPC_CONSTANTS } from '../../types/npc';
import { NUDGE_GOLDEN_EXEMPLAR } from '../../data/__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { CORE_TRAIT_DEFINITIONS } from '../../data/core-trait-content';
import { scoreRegisterCompliance } from '../content-eval/registerCompliance';
import { expandSettings, validateSettingEnvelope } from '../../data/settingClasses';
import { validateNudgeGrantRefs } from '../nudgeGrantLiveness';

const ALL_OUTCOMES: readonly StepOutcome[] = [
  'critical_success', 'success', 'success_at_cost', 'near_miss', 'failure', 'critical_failure',
];

function nudge(over: Partial<StepNudge> & { id: string }): StepNudge {
  return {
    name: 'A Nudge',
    essenceCost: 1,
    forecastDelta: 0.1,
    fiction: 'Something visibly shifts.',
    effectLine: 'Makes the odds kinder.',
    ...over,
  };
}

function stepWith(nudges: StepNudge[]): Pick<ActionStep, 'nudges'> {
  return { nudges };
}

const BARE_TEMPLATE = { id: 'test.template' } as Pick<UnifiedActionTemplate, 'id' | 'traitVariants'>;

// ─── Riders ────────────────────────────────────────────────────────

describe('nudge band riders', () => {
  it('no_crit_fail maps ONLY critical_failure → failure', () => {
    for (const outcome of ALL_OUTCOMES) {
      const result = applyRider(outcome, 'no_crit_fail');
      expect(result).toBe(outcome === 'critical_failure' ? 'failure' : outcome);
    }
  });

  it('floor_at_cost floors BOTH failure and near_miss to success_at_cost', () => {
    // near_miss is a failure texture and floors with it — the three-pillar audit's
    // correction. A rider that floored only `failure` would silently leave the
    // near-miss band unbought.
    expect(applyRider('failure', 'floor_at_cost')).toBe('success_at_cost');
    expect(applyRider('near_miss', 'floor_at_cost')).toBe('success_at_cost');
    // and leaves the rest — including critical_failure — alone
    expect(applyRider('critical_failure', 'floor_at_cost')).toBe('critical_failure');
    expect(applyRider('critical_success', 'floor_at_cost')).toBe('critical_success');
    expect(applyRider('success', 'floor_at_cost')).toBe('success');
    expect(applyRider('success_at_cost', 'floor_at_cost')).toBe('success_at_cost');
  });

  it('is total over the six-value StepOutcome domain — no undefined fall-through', () => {
    for (const rider of ['no_crit_fail', 'floor_at_cost'] as const) {
      for (const outcome of ALL_OUTCOMES) {
        expect(ALL_OUTCOMES).toContain(applyRider(outcome, rider));
      }
    }
  });

  it('no rider is identity', () => {
    for (const outcome of ALL_OUTCOMES) {
      expect(applyRider(outcome, undefined)).toBe(outcome);
    }
  });

  it('strongest single rider wins — riders never stack', () => {
    const step = stepWith([
      nudge({ id: 'a', rider: 'floor_at_cost' }),
      nudge({ id: 'b', rider: 'no_crit_fail' }),
    ]);
    // Both committed; NUDGE_RIDER_PRIORITY puts no_crit_fail first.
    expect(selectActiveRider(step, ['a', 'b'], 'test')).toBe('no_crit_fail');
    // Order of commitment must not change the answer.
    expect(selectActiveRider(step, ['b', 'a'], 'test')).toBe('no_crit_fail');
  });

  it('selects nothing when no committed nudge carries a rider', () => {
    const step = stepWith([nudge({ id: 'a' })]);
    expect(selectActiveRider(step, ['a'], 'test')).toBeUndefined();
    expect(selectActiveRider(step, [], 'test')).toBeUndefined();
    expect(selectActiveRider(step, undefined, 'test')).toBeUndefined();
  });
});

// ─── Forecast modifiers ────────────────────────────────────────────

describe('nudge forecast modifiers', () => {
  it('names each committed nudge as nudge:<id> and sums the deltas', () => {
    const step = stepWith([
      nudge({ id: 'steady_hand', forecastDelta: 0.12 }),
      nudge({ id: 'borrowed_luck', forecastDelta: 0.05 }),
      nudge({ id: 'uncommitted', forecastDelta: 0.99 }),
    ]);
    const mods = collectNudgeModifiers(step, ['steady_hand', 'borrowed_luck']);
    expect(mods).toEqual([
      { source: 'nudge:steady_hand', delta: 0.12 },
      { source: 'nudge:borrowed_luck', delta: 0.05 },
    ]);
    expect(sumModifiers(mods)).toBeCloseTo(0.17);
  });

  it('is byte-equivalent to the pre-nudge path when nothing is committed', () => {
    const step = stepWith([nudge({ id: 'a', forecastDelta: 0.5 })]);
    expect(collectNudgeModifiers(step, undefined)).toEqual([]);
    expect(collectNudgeModifiers(step, [])).toEqual([]);
    expect(sumModifiers(collectNudgeModifiers({}, ['a']))).toBe(0);
  });

  it('skips a committed id with no authored card (fail-soft)', () => {
    const step = stepWith([nudge({ id: 'real' })]);
    expect(collectNudgeModifiers(step, ['ghost'])).toEqual([]);
  });

  it('adds trait variants as trait:<id> modifiers', () => {
    const template = {
      id: 't',
      traitVariants: [
        { traitId: 'scarred', forecastDelta: 0.08, factorLine: 'old wounds remember' },
        { traitId: 'absent', forecastDelta: 0.5, factorLine: 'never applies' },
      ],
    } as Pick<UnifiedActionTemplate, 'id' | 'traitVariants'>;
    const variants = resolveTraitVariants(template, new Set(['scarred']));
    expect(variants).toHaveLength(1);
    const mods = collectNudgeModifiers({}, [], variants);
    expect(mods).toEqual([{ source: 'trait:scarred', delta: 0.08 }]);
  });

  it('sums trait difficulty deltas', () => {
    expect(sumVariantDifficultyDelta([
      { traitId: 'a', difficultyDelta: -0.1, factorLine: 'x' },
      { traitId: 'b', factorLine: 'y' },
      { traitId: 'c', difficultyDelta: 0.05, factorLine: 'z' },
    ])).toBeCloseTo(-0.05);
  });
});

// ─── Hand partitioning ─────────────────────────────────────────────

describe('nudge hand', () => {
  beforeEach(() => resetNudgeWarnings());

  const richContext = {
    availableEssence: () => 100,
    accessibleSpheres: ['spirit', 'mind'] as const,
    unlockedTemplateIds: new Set<string>(['divine.dream']),
    heldTraits: new Set<string>(),
  };

  it('returns three empty lists for a step with no authored hand (feature opt-in)', () => {
    const hand = buildNudgeHand({}, BARE_TEMPLATE, richContext);
    expect(hand).toEqual({ playable: [], dimmed: [], hidden: [] });
  });

  it('dims on cost, sphere, and unlock — but hides a trait card the agent cannot hold', () => {
    const step = stepWith([
      nudge({ id: 'affordable' }),
      nudge({ id: 'too_dear', essenceCost: 500 }),
      nudge({ id: 'wrong_sphere', sphere: 'entropy' }),
      nudge({ id: 'not_unlocked', requiredUnlock: 'divine.nonexistent' }),
      nudge({ id: 'trait_only', requiredTrait: 'oathbound' }),
    ]);
    const hand = buildNudgeHand(step, BARE_TEMPLATE, { ...richContext, availableEssence: () => 10 });

    expect(hand.playable.map(e => e.nudge.id)).toEqual(['affordable']);
    expect(hand.dimmed.map(e => [e.nudge.id, e.blocked])).toEqual([
      ['too_dear', 'essence_unavailable'],
      ['wrong_sphere', 'sphere_locked'],
      ['not_unlocked', 'unlock_missing'],
    ]);
    // A card the player can never unlock is noise, not a goal — hidden, not dimmed.
    expect(hand.hidden).toEqual(['trait_only']);
  });

  it('unhides a trait card when the agent holds the trait', () => {
    const step = stepWith([nudge({ id: 'trait_only', requiredTrait: 'oathbound' })]);
    const hand = buildNudgeHand(step, BARE_TEMPLATE, {
      ...richContext,
      heldTraits: new Set(['oathbound']),
    });
    expect(hand.playable.map(e => e.nudge.id)).toEqual(['trait_only']);
    expect(hand.hidden).toEqual([]);
  });

  it('a traitVariant addNudgeIds entry unlocks a trait-gated card', () => {
    const template = {
      id: 't',
      traitVariants: [{ traitId: 'scarred', factorLine: 'x', addNudgeIds: ['trait_only'] }],
    } as Pick<UnifiedActionTemplate, 'id' | 'traitVariants'>;
    const step = stepWith([nudge({ id: 'trait_only', requiredTrait: 'someone_elses_trait' })]);
    const hand = buildNudgeHand(step, template, { ...richContext, heldTraits: new Set(['scarred']) });
    expect(hand.playable.map(e => e.nudge.id)).toEqual(['trait_only']);
  });

  it('is inert (not thrown) when a traitVariant names an unknown nudge id', () => {
    const template = {
      id: 't',
      traitVariants: [{ traitId: 'scarred', factorLine: 'x', addNudgeIds: ['ghost'] }],
    } as Pick<UnifiedActionTemplate, 'id' | 'traitVariants'>;
    const step = stepWith([nudge({ id: 'real' })]);
    expect(() => buildNudgeHand(step, template, { ...richContext, heldTraits: new Set(['scarred']) }))
      .not.toThrow();
  });

  it('totals the committed cost', () => {
    const step = stepWith([
      nudge({ id: 'a', essenceCost: 2 }),
      nudge({ id: 'b', essenceCost: 3 }),
      nudge({ id: 'c', essenceCost: 9 }),
    ]);
    expect(totalNudgeCost(step, ['a', 'b'])).toBe(5);
    expect(totalNudgeCost(step, [])).toBe(0);
  });

  it('collects band prose only for the resolved outcome', () => {
    const step = stepWith([
      nudge({ id: 'a', bandProse: { failure: 'the charm frays', success: 'it holds' } }),
      nudge({ id: 'b', bandProse: { failure: 'and the other gives too' } }),
    ]);
    expect(collectNudgeBandProse(step, ['a', 'b'], 'failure'))
      .toEqual(['the charm frays', 'and the other gives too']);
    expect(collectNudgeBandProse(step, ['a', 'b'], 'success')).toEqual(['it holds']);
    expect(collectNudgeBandProse(step, ['a', 'b'], 'near_miss')).toEqual([]);
  });
});

// ─── Erosion scaling ───────────────────────────────────────────────

describe('scaled quintessence erosion', () => {
  it('erodes nothing on a non-failing outcome', () => {
    for (const outcome of ['critical_success', 'success', 'success_at_cost'] as StepOutcome[]) {
      expect(computeScaledErosion({ outcome })).toBe(0);
    }
  });

  it('a background failure at difficulty 0 is the unchanged flat base', () => {
    expect(computeScaledErosion({ outcome: 'failure' }))
      .toBeCloseTo(QUINTESSENCE_ENCOUNTER_FAILURE_EROSION);
  });

  it('matches the reviewed pacing anchor: attended crit-fail at difficulty 0.6 ≈ 0.48', () => {
    // The number Christian signed off on. If this changes, the pacing changed.
    const erosion = computeScaledErosion({
      outcome: 'critical_failure',
      attended: true,
      difficulty: 0.6,
    });
    const expected = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION
      * EROSION_BAND_MULT_CRITFAIL
      * EROSION_ATTENDED_MULT
      * (1 + 0.6 * DIFFICULTY_EROSION_SCALE);
    expect(erosion).toBeCloseTo(expected);
    expect(erosion).toBeCloseTo(0.48, 2);
  });

  it('clamps at the ratio floor — erosion alone never reaches zero', () => {
    // A catastrophe against a mortal already near the floor takes only the headroom.
    const erosion = computeScaledErosion({
      outcome: 'critical_failure',
      attended: true,
      difficulty: 1,
      currentRatio: QUINTESSENCE_RATIO_FLOOR + 0.01,
    });
    expect(erosion).toBeCloseTo(0.01);
  });

  it('erodes nothing once already at or below the floor', () => {
    expect(computeScaledErosion({
      outcome: 'critical_failure',
      currentRatio: QUINTESSENCE_RATIO_FLOOR,
    })).toBe(0);
    expect(computeScaledErosion({ outcome: 'failure', currentRatio: 0 })).toBe(0);
  });
});

// ─── Broken state ──────────────────────────────────────────────────

describe('broken mortal state', () => {
  const node = (quintessence: number, brokenSince?: number) => ({
    properties: {
      quintessence,
      quintessenceMax: 1,
      ...(brokenSince !== undefined ? { [BROKEN_SINCE_PROPERTY]: brokenSince } : {}),
    } as Record<string, unknown>,
  });

  it('a healthy mortal is not broken', () => {
    expect(isBrokenMortal(node(0.9))).toBe(false);
    expect(isAtBrokenThreshold(node(0.9))).toBe(false);
  });

  it('enters at the critical threshold', () => {
    // CRITICAL is 0.10 — below it the state is 'critical'.
    expect(isAtBrokenThreshold(node(0.05))).toBe(true);
    expect(isBrokenMortal(node(0.05))).toBe(true);
  });

  it('hysteresis: an already-broken mortal stays broken above the ENTER threshold', () => {
    // 0.2 is 'weakened' (CRITICAL 0.10 ≤ r < WEAKENED 0.25) — past ENTER
    // ('critical') but short of EXIT ('strained'). Without the stamp this is not
    // broken; with it, it still is. That gap is the whole point of the stamp.
    expect(isBrokenMortal(node(0.2))).toBe(false);
    expect(isBrokenMortal(node(0.2, 100))).toBe(true);
  });

  it('hysteresis releases on reaching the EXIT threshold', () => {
    // 0.3 is 'strained' (WEAKENED 0.25 ≤ r < STRAINED 0.50) — BROKEN_EXIT_STATE.
    expect(isBrokenMortal(node(0.3, 100))).toBe(false);
    expect(isBrokenMortal(node(0.6, 100))).toBe(false);
  });

  it('fail-soft: a null node is not broken', () => {
    expect(isBrokenMortal(null)).toBe(false);
    expect(isBrokenMortal(undefined)).toBe(false);
  });

  it('reports ticks broken, and 0 without a stamp', () => {
    expect(ticksBroken(node(0.05, 40), 100)).toBe(60);
    expect(ticksBroken(node(0.05), 100)).toBe(0);
  });

  // Regression: `WorldGraph.updateNode` REPLACES the map entry (fresh object,
  // fresh `properties`) rather than mutating in place. `phaseQuintessence` calls
  // updateNode in its passive-regen branch immediately before reconciling, so a
  // reconcile that wrote through the caller's node handle silently dropped every
  // stamp — measured as 0 broken agents over a 160-tick seed-42 run. The fix is
  // that `reconcileBrokenState` re-reads by id; these tests pin that.
  describe('reconcileBrokenState survives a stale caller reference', () => {
    function graphWith(q: number) {
      const g = new WorldGraph();
      g.addNode({
        id: 'actor.worn', type: 'actor', name: 'Worn',
        properties: { quintessence: q, quintessenceMax: 1 },
      });
      return g;
    }

    it('stamps brokenSince even after the caller has called updateNode', () => {
      const g = graphWith(0.5);
      const staleHandle = g.getNode('actor.worn')!;
      // Simulate the regen write that invalidates `staleHandle`.
      g.updateNode('actor.worn', { properties: { quintessence: 0.05 } });
      expect(reconcileBrokenState(g, 'actor.worn', 42)).toBe('entered');
      expect(g.getNode('actor.worn')!.properties.brokenSince).toBe(42);
      // The stale handle is provably a different object — the trap is real.
      expect(staleHandle).not.toBe(g.getNode('actor.worn'));
    });

    it('clears the stamp on mending, and reports ticks broken', () => {
      const g = graphWith(0.05);
      expect(reconcileBrokenState(g, 'actor.worn', 10)).toBe('entered');
      g.updateNode('actor.worn', { properties: { quintessence: 0.6 } });
      expect(reconcileBrokenState(g, 'actor.worn', 110)).toBe('mended');
      expect(g.getNode('actor.worn')!.properties.brokenSince).toBeUndefined();
    });

    it('no-ops (never throws) on an unknown id', () => {
      expect(reconcileBrokenState(graphWith(0.05), 'actor.ghost', 1)).toBeNull();
    });

    it('returns null when nothing crossed', () => {
      const g = graphWith(0.9);
      expect(reconcileBrokenState(g, 'actor.worn', 1)).toBeNull();
      expect(g.getNode('actor.worn')!.properties.brokenSince).toBeUndefined();
    });
  });
});

// ─── Motive classification ─────────────────────────────────────────

describe('classifyMotive', () => {
  const receipt = (contributions: Array<{ kind: string; weight: number }>) =>
    ({ contributions } as never);

  it('falls back to chance with no receipt or no contributions', () => {
    expect(classifyMotive(null)).toBe('chance');
    expect(classifyMotive(undefined)).toBe('chance');
    expect(classifyMotive(receipt([]))).toBe('chance');
  });

  it('player provenance wins outright, even over a dominant mortal motive', () => {
    expect(classifyMotive(receipt([{ kind: 'ambition', weight: 1 }]), { playerSourced: true }))
      .toBe('divine');
    expect(classifyMotive(receipt([{ kind: 'personality', weight: 1 }]), { seedInterventionId: 'i1' }))
      .toBe('divine');
  });

  it('claims mission on dominant assigned-work contributions', () => {
    expect(classifyMotive(receipt([
      { kind: 'ambition', weight: 0.6 },
      { kind: 'personality', weight: 0.4 },
    ]))).toBe('mission');
  });

  it('claims choice on dominant self-scored contributions', () => {
    expect(classifyMotive(receipt([
      { kind: 'personality', weight: 0.55 },
      { kind: 'proximity', weight: 0.45 },
    ]))).toBe('choice');
  });

  it('classifies divine from a dominant mark/hunch share', () => {
    expect(classifyMotive(receipt([{ kind: 'mark', weight: 0.7 }]))).toBe('divine');
  });

  it('falls back to chance when nothing clears the dominant share', () => {
    expect(classifyMotive(receipt([
      { kind: 'proximity', weight: 0.4 },
      { kind: 'ambition', weight: 0.3 },
      { kind: 'personality', weight: 0.3 },
    ]))).toBe('chance');
  });
});

// ─── Display ───────────────────────────────────────────────────────

describe('difficultyWord', () => {
  it('bands the difficulty into words, never numbers', () => {
    expect(difficultyWord(0.9)).toBe('severe');
    expect(difficultyWord(0.60)).toBe('severe');
    expect(difficultyWord(0.50)).toBe('steep');
    expect(difficultyWord(0.35)).toBe('fair');
    expect(difficultyWord(0.1)).toBe('gentle');
  });

  it('fail-soft on out-of-range and non-finite input', () => {
    expect(difficultyWord(-1)).toBe('gentle');
    expect(difficultyWord(99)).toBe('severe');
    expect(difficultyWord(NaN)).toBe('gentle');
  });
});

// ─── WS1 helpers ───────────────────────────────────────────────────

/** Words in a string, punctuation-insensitive. */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Every authored prose surface on the exemplar, as `[fieldKey, text]`.
 *
 * The key's first dot-segment is the field kind, which is exactly how
 * `registerCompliance` classifies label-class fields — so `name.<id>` scores
 * under the interactive-plainness rule and `fiction.<id>` scores as narrative,
 * with no second mapping to keep in step.
 */
/**
 * Which enforcement scope an `exemplarProse()` label falls under (THR-899).
 *
 * The labels already encode the field they came from, so the mapping is read off
 * the prefix rather than maintained as a second list that could drift from the
 * collector. Order matters: the outcome-side `narrative.*` cases are tested
 * before the generic `narrative.` → scene fallback.
 */
function fieldClassOfLabel(label: string): ProseFieldClass {
  // Band fragments and afterimages are the result, after the dice.
  if (label.startsWith('fragment.') || label.startsWith('afterimage.')) return 'outcome';
  // `narrativeTemplates.success` / `.failure`, and an omen's fire-time hook.
  if (
    label === 'narrative.success' ||
    label === 'narrative.failure' ||
    label.endsWith('.omen_hook')
  ) {
    return 'outcome';
  }
  // Openings, step narratives, `initiation`, and a card's fiction body.
  if (label.startsWith('narrative.') || label.startsWith('fiction.')) return 'scene';
  // Labels and rules text: name, effectLine, factor lines, purpose lines.
  return 'interactive';
}

function exemplarProse(): Array<[string, string]> {
  const out: Array<[string, string]> = [['name.template', NUDGE_GOLDEN_EXEMPLAR.name]];

  // THR-884 openings are scene prose and sweep with the rest of it.
  for (const [cls, text] of Object.entries(NUDGE_GOLDEN_EXEMPLAR.openings ?? {})) {
    out.push([`narrative.opening_${cls}`, text]);
  }

  for (const [i, step] of NUDGE_GOLDEN_EXEMPLAR.steps.entries()) {
    if (!('nudges' in step)) continue;
    const s = step as ActionStep;
    const push = (kind: string, text: string | undefined): void => {
      if (text) out.push([`${kind}.step${i}`, text]);
    };
    push('narrative', s.narrativeTemplate);
    push('afterimage', s.successAfterimage);
    push('afterimage', s.failureAfterimage);
    push('afterimage', s.successAtCostAfterimage);
    push('afterimage', s.criticalSuccessAfterimage);
    push('afterimage', s.criticalFailureAfterimage);

    // THR-820: authored panel data is step schema, so it is collected here with
    // the rest of the step's prose rather than from a separate constant.
    for (const [j, line] of (s.factorLines ?? []).entries()) {
      out.push([`factor.step${i}.${j}`, line.text]);
    }
    push('purpose', s.purposeLine);

    for (const nudge of s.nudges ?? []) {
      out.push([`name.${nudge.id}`, nudge.name]);
      out.push([`fiction.${nudge.id}`, nudge.fiction]);
      out.push([`effect.${nudge.id}`, nudge.effectLine]);
      for (const [cls, variant] of Object.entries(nudge.fictionBySetting ?? {})) {
        out.push([`fiction.${nudge.id}.${cls}`, variant]);
      }
      for (const grant of nudge.grants ?? []) {
        if (grant.kind === 'emit_omen') out.push([`narrative.${nudge.id}.omen_hook`, grant.narrativeHook]);
      }
      for (const [band, fragment] of Object.entries(nudge.bandProse ?? {})) {
        out.push([`fragment.${nudge.id}.${band}`, fragment]);
      }
    }
  }

  for (const variant of NUDGE_GOLDEN_EXEMPLAR.traitVariants ?? []) {
    out.push([`factor.trait.${variant.traitId}`, variant.factorLine]);
  }
  const templates = NUDGE_GOLDEN_EXEMPLAR.narrativeTemplates;
  if (templates) {
    for (const [kind, text] of Object.entries(templates)) {
      if (typeof text === 'string') out.push([`narrative.${kind}`, text]);
    }
  }

  return out;
}

// ─── The golden exemplar against the authoring checklist ───────────
//
// THR-774 established the executable-checklist pattern; THR-883 locked the
// format these assertions now encode (communication pivot, setting envelopes,
// cost channels, grants). Every assertion here mirrors a rule the two
// authoring skills state in prose. A rule that drifts out of a skill and a
// rule that drifts out of the exemplar both break a test, which is the only
// reason the exemplar is worth shipping.
//
// The checks are written over the *template*, not over hand-listed ids, so
// re-authoring a card cannot silently drop it from coverage.

describe('golden exemplar — authoring checklist (locked THR-883 format)', () => {
  /** Steps that actually carry a hand. A step without `nudges` is opt-out, not a violation. */
  const nudgeSteps = NUDGE_GOLDEN_EXEMPLAR.steps.filter(
    (s): s is ActionStep & { nudges: readonly StepNudge[] } =>
      'nudges' in s && Array.isArray((s as ActionStep).nudges) && (s as ActionStep).nudges!.length > 0,
  );

  const allNudges = nudgeSteps.flatMap((s) => s.nudges);

  it('has at least one nudge-bearing step (otherwise every check below is vacuous)', () => {
    expect(nudgeSteps.length).toBeGreaterThan(0);
    expect(allNudges.length).toBeGreaterThan(0);
  });

  it('every hand sits inside the authored size guardrails', () => {
    for (const step of nudgeSteps) {
      expect(step.nudges.length).toBeGreaterThanOrEqual(NUDGE_HAND_MIN);
      expect(step.nudges.length).toBeLessThanOrEqual(NUDGE_HAND_MAX);
    }
  });

  it('every hand sits inside the authored total-delta ceiling (THR-827)', () => {
    // The only bound on how far a god may bend one step: nothing clamps
    // `actionModifiers` at runtime, so this rubric holds the line at authoring
    // time. Counted over every authored card, gated or not — what one god can
    // play is a subset, but the author only ever sees the total.
    for (const step of nudgeSteps) {
      const total = step.nudges.reduce((sum, n) => sum + n.forecastDelta, 0);
      expect(
        total,
        `step hand sums to ${total.toFixed(2)}, over NUDGE_HAND_MAX_TOTAL_DELTA`,
      ).toBeLessThanOrEqual(NUDGE_HAND_MAX_TOTAL_DELTA);
    }
  });

  it('every hand spans the minimum sphere coverage', () => {
    for (const step of nudgeSteps) {
      const spheres = new Set(step.nudges.map((n) => n.sphere).filter(Boolean));
      expect(spheres.size).toBeGreaterThanOrEqual(HAND_SPHERE_COVERAGE_MIN);
    }
  });

  it('every hand offers a common (sphere-less) option', () => {
    for (const step of nudgeSteps) {
      const common = step.nudges.filter((n) => n.sphere === undefined);
      expect(common.length).toBeGreaterThanOrEqual(HAND_COMMON_OPTIONS_MIN);
    }
  });

  it('every nudge carries at least one failure-band fragment', () => {
    for (const nudge of allNudges) {
      const bands = Object.keys(nudge.bandProse ?? {}) as StepOutcome[];
      const failureFragments = bands.filter((b) => FAILURE_BAND_OUTCOMES.includes(b));
      expect(
        failureFragments.length,
        `${nudge.id} has no failure-band fragment — the god's hand must be traceable in failure`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('big-delta nudges cover BOTH failure and critical_failure', () => {
    const bigDelta = allNudges.filter((n) => n.forecastDelta >= NUDGE_BIG_DELTA);
    // Guard the population: a checklist rule with no instance is untested.
    expect(bigDelta.length).toBeGreaterThan(0);
    for (const nudge of bigDelta) {
      expect(nudge.bandProse?.failure, `${nudge.id} (big delta) lacks a failure fragment`).toBeTruthy();
      expect(
        nudge.bandProse?.critical_failure,
        `${nudge.id} (big delta) lacks a critical_failure fragment`,
      ).toBeTruthy();
    }
  });

  it("every hand's fragments cover all six StepOutcome bands between them", () => {
    for (const step of nudgeSteps) {
      const covered = new Set<StepOutcome>();
      for (const nudge of step.nudges) {
        for (const band of Object.keys(nudge.bandProse ?? {}) as StepOutcome[]) covered.add(band);
      }
      for (const band of ALL_BAND_OUTCOMES) {
        expect([...covered], `step ${step.reach} never pays off the ${band} band`).toContain(band);
      }
    }
  });

  it('every step authors the five afterimage bands the schema carries', () => {
    // `near_miss` has no afterimage field on ActionStep — it is covered through
    // band fragments (asserted above), which is why this list is five, not six.
    for (const step of nudgeSteps) {
      expect(step.narrativeTemplate).toBeTruthy();
      expect(step.successAfterimage).toBeTruthy();
      expect(step.failureAfterimage).toBeTruthy();
      expect(step.successAtCostAfterimage).toBeTruthy();
      expect(step.criticalSuccessAfterimage).toBeTruthy();
      expect(step.criticalFailureAfterimage).toBeTruthy();
    }
  });

  it('carries a trait hook, and it resolves against a real trait definition', () => {
    const variants = NUDGE_GOLDEN_EXEMPLAR.traitVariants ?? [];
    expect(variants.length).toBeGreaterThan(0);

    // The hook must name a trait that actually exists — the rule THR-800 tracks
    // 62 violations of. Checked against the seeded Core definitions rather than
    // a hand-copied id list, so retiring the trait breaks this test.
    const liveTraitIds = new Set(CORE_TRAIT_DEFINITIONS.map((n) => n.id));
    for (const variant of variants) {
      expect(liveTraitIds, `traitVariant names a dead trait ref: ${variant.traitId}`).toContain(
        variant.traitId,
      );
      expect(variant.factorLine).toBeTruthy();
    }

    // A trait-only card exists and is reachable by the variant that unlocks it.
    const traitOnly = allNudges.filter((n) => n.requiredTrait !== undefined);
    expect(traitOnly.length).toBeGreaterThan(0);
    const unlocked = new Set(variants.flatMap((v) => v.addNudgeIds ?? []));
    for (const card of traitOnly) {
      expect(liveTraitIds).toContain(card.requiredTrait);
      expect(unlocked, `trait-only card ${card.id} is unlocked by no variant`).toContain(card.id);
      // Trait options are free: the price was paid by being that person.
      expect(card.essenceCost).toBe(0);
    }
  });

  it('authors purpose lines, and no static factor lines (the variance rule)', () => {
    // Variance rule (Christian, chat 2026-07-30): a factor line must report
    // state that could have been otherwise — agent, hex, global modifiers,
    // earlier steps — and all of that is derived by the panel, never authored
    // on the step. A static authored line ("Floodwater carries silt") is true
    // on every run, so it is priced into `difficulty` and belongs in the
    // prose; the earlier form of this test *required* 2–4 of exactly those
    // lines, which is the clutter pattern the rule retires. The exemplar is
    // the reference authors copy, so it authors none.
    const steps = NUDGE_GOLDEN_EXEMPLAR.steps as readonly ActionStep[];

    for (const [i, step] of steps.entries()) {
      expect(step.purposeLine, `step ${i} authors no purpose line`).toBeTruthy();
      expect(wordCount(step.purposeLine!)).toBeLessThanOrEqual(REACH_PURPOSE_MAX_WORDS);

      expect(
        step.factorLines ?? [],
        `step ${i} authors static factor lines — the variance rule retires these`,
      ).toEqual([]);
    }

    // The one authored factor surface left is the trait variant's line —
    // variance by construction — and it holds the line budget.
    for (const variant of NUDGE_GOLDEN_EXEMPLAR.traitVariants ?? []) {
      expect(wordCount(variant.factorLine)).toBeLessThanOrEqual(NUDGE_WORD_BUDGETS.factorLine);
    }
  });

  it('keeps every card field inside its word budget', () => {
    for (const nudge of allNudges) {
      expect(wordCount(nudge.name), `name over budget: ${nudge.id}`).toBeLessThanOrEqual(
        NUDGE_NAME_MAX_WORDS,
      );
      expect(wordCount(nudge.fiction), `fiction over budget: ${nudge.id}`).toBeLessThanOrEqual(
        NUDGE_WORD_BUDGETS.fiction,
      );
      for (const fragment of Object.values(nudge.bandProse ?? {})) {
        expect(
          wordCount(fragment),
          `band fragment over budget: ${nudge.id}`,
        ).toBeLessThanOrEqual(NUDGE_WORD_BUDGETS.bandFragment);
      }
    }
    for (const step of nudgeSteps) {
      expect(wordCount(step.narrativeTemplate ?? '')).toBeLessThanOrEqual(
        NUDGE_WORD_BUDGETS.bandBase,
      );
    }
  });

  it("effect lines are words, never a percentage or a bare number", () => {
    for (const nudge of allNudges) {
      expect(nudge.effectLine, `${nudge.id} effectLine shows a number`).not.toMatch(/\d|%/);
    }
  });

  it('riders stay rare — at most one card per hand carries one', () => {
    // Pre-pivot this was one per encounter. The card library makes the three
    // rider types (Insurance, Mercy, Gambit) first-class members of the
    // repertoire, so the honest rule is per hand: two riders in one hand answer
    // the same question — what shape does the outcome take — twice.
    for (const step of nudgeSteps) {
      const withRiders = step.nudges.filter((n) => n.rider !== undefined);
      expect(withRiders.length, `step ${step.reach} carries ${withRiders.length} riders`).toBeLessThanOrEqual(1);
    }
    // Population guard: the rule is demonstrated, not vacuously satisfied.
    expect(allNudges.some((n) => n.rider !== undefined)).toBe(true);
  });

  // ── The locked THR-883 format (communication pivot + envelopes + cards) ──

  it('declares an honest setting envelope, and derives its subtype list', () => {
    // THR-884: authors declare classes; the subtype list is derived. All four
    // envelope honesty rules run through the shared validator.
    expect(validateSettingEnvelope(NUDGE_GOLDEN_EXEMPLAR)).toEqual([]);
    expect(NUDGE_GOLDEN_EXEMPLAR.settings?.length ?? 0).toBeGreaterThan(0);
    expect(NUDGE_GOLDEN_EXEMPLAR.locationSubtypes).toEqual(
      expandSettings(NUDGE_GOLDEN_EXEMPLAR.settings ?? []),
    );
    // Openings are scene prose and hold the scene budget.
    for (const [cls, text] of Object.entries(NUDGE_GOLDEN_EXEMPLAR.openings ?? {})) {
      expect(wordCount(text), `opening for ${cls} over scene budget`).toBeLessThanOrEqual(
        NUDGE_WORD_BUDGETS.scene,
      );
    }
  });

  it('prices zero-essence cards somewhere real, and demonstrates a cost channel', () => {
    // THR-885 cost channels: free-in-essence is an authored decision only when
    // the price lands on a trait (paid by being that person) or on another
    // channel (doom, detection, obligation). A card that is simply free is a
    // pricing bug.
    for (const nudge of allNudges) {
      if (nudge.essenceCost > 0) continue;
      const paidElsewhere =
        nudge.requiredTrait !== undefined ||
        (nudge.costs !== undefined && Object.keys(nudge.costs).length > 0);
      expect(paidElsewhere, `${nudge.id} costs no essence and charges no other channel`).toBe(true);
    }
    // Population guards: both channel shapes are demonstrated in the exemplar.
    expect(allNudges.some((n) => (n.costs?.detectionDelta ?? 0) !== 0)).toBe(true);
    expect(allNudges.some((n) => (n.costs?.doomDelta ?? 0) !== 0)).toBe(true);
  });

  it('grants resolve against built content (the supporting-content rule)', () => {
    // Any card granting an item/trait/ambition/omen/condition ships with that
    // content built — THR-885's liveness gate, run here over the exemplar so
    // the reference implementation can never model a dead ref.
    const report = validateNudgeGrantRefs([NUDGE_GOLDEN_EXEMPLAR]);
    expect(report.cardsWithGrants).toBeGreaterThan(0);
    expect(report.checkedRefs).toBeGreaterThan(0);
    expect(report.dead, 'exemplar grants name unbuilt content').toEqual([]);
  });

  it('every card declares an image tag for the WS4 fallback chain', () => {
    for (const nudge of allNudges) {
      expect(nudge.imageTag, `${nudge.id} has no imageTag`).toBeTruthy();
    }
  });

  // ── Detectors (the verbatim spec the skills carry) ──────────────

  it('scores zero on the vagueness lexicon, scoped by field class', () => {
    // THR-899: the sweep is scoped, not flat. Outcome prose is held to evasive
    // terms AND natural indefinites; scene and interactive prose to evasive
    // terms only. A flat sweep here is what made "someone" a defect in a card's
    // fiction, and the contortions that produced are the reason for the rescope.
    const offenders: string[] = [];
    for (const [label, text] of exemplarProse()) {
      const hits = countVagueness(text, fieldClassOfLabel(label));
      if (hits > 0) offenders.push(`${label} [${fieldClassOfLabel(label)}] x${hits}: ${text}`);
    }
    expect(offenders, `vagueness lexicon hits:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('still catches an indefinite planted in the exemplar\'s outcome prose', () => {
    // Negative control. Every assertion above could be green because the
    // detector went inert rather than because the exemplar is clean — and this
    // rescope only ever loosens, which is exactly the change that can go inert
    // without anyone noticing. Plant the prey; watch it get caught.
    for (const term of NATURAL_INDEFINITE_TERMS) {
      expect(
        countVagueness(`They walked away with ${term} of it.`, 'outcome'),
        `outcome scope stopped matching "${term}"`,
      ).toBeGreaterThan(0);
    }
    // And the same sentence must be clean in scene scope — that is the point.
    expect(countVagueness('Someone is asking around after the agent.', 'scene')).toBe(0);
  });

  it('reports intensifiers as a warning, never as a vagueness failure', () => {
    // THR-899 moved these off the fail path. Both halves need pinning: they must
    // stop counting as vagueness, and they must still be visible as a warning.
    const sentence = 'She was very tired and he was deeply unsure.';
    expect(countVagueness(sentence, 'outcome')).toBe(0);
    expect(countIntensifiers(sentence)).toBe(2);
  });

  it('stays inside the annotation-clause budget for the whole encounter', () => {
    let hits = 0;
    const found: string[] = [];
    for (const [label, text] of exemplarProse()) {
      for (const [name, pattern] of Object.entries(ANNOTATION_PATTERNS)) {
        // Per-sentence, so the "not … but" clause rule means one sentence.
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          if (pattern.test(sentence)) {
            hits++;
            found.push(`${label} [${name}]: ${sentence}`);
          }
        }
      }
    }
    expect(hits, `annotation clauses:\n${found.join('\n')}`).toBeLessThanOrEqual(
      ANNOTATION_MAX_PER_ENCOUNTER,
    );
  });

  it('passes the register scorer with no failing metric', () => {
    const fields: Record<string, string> = {};
    for (const [label, text] of exemplarProse()) fields[label] = text;

    const result = scoreRegisterCompliance({ register: 'baseline', fields });
    const failing = result.metrics.filter((m) => m.band === 'fail');
    expect(
      failing,
      `failing register metrics:\n${failing.map((m) => `${m.name}: ${m.detail}`).join('\n')}`,
    ).toEqual([]);
    expect(result.band).not.toBe('fail');
    expect(result.band).not.toBe('skipped');
  });
});

// ─── Reach reachability — THR-821 ────────────────────────────────────
//
// Pins the measurement that produced NUDGE_OFF_REACH_MAX_DIFFICULTY, so the
// authoring rule and the rulebook's "there is a floor your nudges cannot lift a
// mortal off" clause cannot silently rot when a constant elsewhere moves.
// Measurement: `npm run measure:nudge-headroom` (seeds 42/99);
// write-up: Docs/audits/2026-07-27-thr-821-nudge-headroom.md.

describe('nudge reachability against the probability floor (THR-821)', () => {
  const SIGMOID_MIDPOINT = 10;
  const SIGMOID_K = 0.4;
  const capabilityOf = (raw: number) => 1 / (1 + Math.exp(-SIGMOID_K * (raw - SIGMOID_MIDPOINT)));

  /** Raw scores a notable-tier mortal can carry in an off (non-primary/secondary) reach. */
  const offReachRaws = Array.from(
    { length: NPC_CONSTANTS.NOTABLE_OTHER_RANGE },
    (_, i) => NPC_CONSTANTS.NOTABLE_OTHER_BASE + i,
  );

  /**
   * The step-0 subset the *measured* ascendant could play — limited by which
   * spheres their essence pool made accessible. Not the hand's ceiling: the five
   * non-trait-gated cards sum to 0.55, and at that total this cohort clears the
   * floor (THR-827 corrected the label; THR-831 owns whether the 0.45 ceiling is
   * calibrated right against it).
   */
  const MEASURED_SUBSET_DELTA = 0.37;

  it('floors an off-reach notable mortal at NUDGE_OFF_REACH_MAX_DIFFICULTY, across a typical playable subset', () => {
    expect(offReachRaws.length).toBeGreaterThan(0);

    for (const raw of offReachRaws) {
      const capability = capabilityOf(raw);
      for (const modifiers of [0, 0.20, MEASURED_SUBSET_DELTA]) {
        const p = computeResolutionThreshold({
          capability,
          difficulty: NUDGE_OFF_REACH_MAX_DIFFICULTY,
          actionModifiers: modifiers,
        } as Parameters<typeof computeResolutionThreshold>[0]);

        expect(
          p,
          `raw=${raw} capability=${capability.toFixed(3)} mods=${modifiers} → p=${p}`,
        ).toBe(PROBABILITY_FLOOR);
      }
    }
  });

  it('clears the floor for the same mortal once the step drops below the off-reach ceiling', () => {
    // The rule is a real boundary, not a blanket "nudges never work": the
    // strongest off-reach notable mortal, with a hand, clears the floor on a
    // gentle step. If this stops holding, the ceiling is set wrong.
    const bestOffReach = capabilityOf(
      NPC_CONSTANTS.NOTABLE_OTHER_BASE + NPC_CONSTANTS.NOTABLE_OTHER_RANGE - 1,
    );
    const p = computeResolutionThreshold({
      capability: bestOffReach,
      difficulty: 0.14, // shipped p25
      actionModifiers: 0.22,
    } as Parameters<typeof computeResolutionThreshold>[0]);

    expect(p).toBeGreaterThan(PROBABILITY_FLOOR);
  });

  it('keeps the open-draw exemplar under the off-reach ceiling, and a spotlight mortal above the floor', () => {
    // The Swollen Ford is open-draw ambient content (`intrinsicTier:
    // 'background'`), so it demonstrates the open-draw branch of the THR-821
    // rule: every step at or under the ceiling. (The retired Darkhollow Vault
    // demonstrated the other branch — steep steps gated to actors who hold the
    // reach.) If a step ever rises past the ceiling, either gate the encounter
    // or put the difficulty back.
    const spotlightPrimary = capabilityOf(
      NPC_CONSTANTS.NOTABLE_PRIMARY_BASE + NPC_CONSTANTS.SPOTLIGHT_PRIMARY_BOOST,
    );

    // `steps` is ActionStepOrBranch[]; only plain steps carry a difficulty.
    const difficulties = NUDGE_GOLDEN_EXEMPLAR.steps
      .map((s) => (s as Partial<ActionStep>).difficulty)
      .filter((d): d is number => typeof d === 'number');
    expect(difficulties).toEqual([0.35, 0.4]);

    for (const difficulty of difficulties) {
      expect(difficulty).toBeLessThanOrEqual(NUDGE_OFF_REACH_MAX_DIFFICULTY);

      const p = computeResolutionThreshold({
        capability: spotlightPrimary,
        difficulty,
        actionModifiers: 0,
      } as Parameters<typeof computeResolutionThreshold>[0]);

      expect(p, `difficulty=${difficulty} → p=${p}`).toBeGreaterThan(PROBABILITY_FLOOR);
    }
  });
});
