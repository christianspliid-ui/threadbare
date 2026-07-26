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
