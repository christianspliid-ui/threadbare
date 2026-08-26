/**
 * Nudge card system — THR-885.
 *
 * Covers the five seams the ticket makes falsifiable claims about: the Gambit
 * rider is total over the outcome domain, the sphere discount is quoted and
 * charged at the same number, world-state filters hide rather than dim, cost
 * channels sum before they are charged, and a card cannot name content that
 * does not exist.
 *
 * The liveness test at the bottom is deliberately self-falsifying: it re-injects
 * a dead reference and asserts the sweep catches it, because a validator run
 * over a population that happens to be empty prints PASS and proves nothing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ActionStep,
  EncounterAftermathReactionEffect,
  NudgeRider,
  StepNudge,
  StepOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { SphereName } from '../../types/index';
import {
  applyRider,
  buildNudgeHand,
  effectiveNudgeCost,
  resetNudgeWarnings,
  selectActiveRider,
  totalNudgeCost,
} from '../encounters/nudges';
import {
  collectNudgeCostChannels,
  collectNudgeGrants,
} from '../encounters/nudgeDispatch';
import {
  NUDGE_RIDER_PRIORITY,
  SPHERE_DISCOUNT,
  SPHERE_DISCOUNT_MIN_COST,
} from '../../data/nudge-constants';
import { applyRawDetectionDelta, MAX_DETECTION_PRESSURE } from '../encounters/detectionPressure';
import { assignAmbitionToActor, MAX_ACTIVE_AMBITIONS } from '../ambitionAssignment';
import {
  formatDeadNudgeGrantRefs,
  validateLibraryGrantRefs,
  validateNudgeGrantRefs,
} from '../nudgeGrantLiveness';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { WorldGraph } from '../graph';

const ALL_OUTCOMES: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

const ALL_RIDERS: readonly NudgeRider[] = ['no_crit_fail', 'floor_at_cost', 'all_or_nothing'];

function card(overrides: Partial<StepNudge> & Pick<StepNudge, 'id'>): StepNudge {
  return {
    name: 'a card',
    essenceCost: 1,
    forecastDelta: 0,
    effectLine: 'Helps.',
    ...overrides,
  };
}

function step(nudges: readonly StepNudge[]): Pick<ActionStep, 'nudges'> {
  return { nudges };
}

const PERMISSIVE_CONTEXT = {
  availableEssence: () => 99,
  accessibleSpheres: [] as readonly SphereName[],
  unlockedTemplateIds: new Set<string>(),
  heldTraits: new Set<string>(),
};

beforeEach(() => {
  resetNudgeWarnings();
});

// ─── 1. The Gambit rider ─────────────────────────────────────────────

describe('all_or_nothing rider (The Gambit)', () => {
  it('is total over the six-value StepOutcome domain', () => {
    // Impediment #311 pin: a rider map missing a key silently passes the outcome
    // through, which reads as "the card did nothing" rather than as a bug.
    for (const outcome of ALL_OUTCOMES) {
      expect(applyRider(outcome, 'all_or_nothing')).toBeDefined();
    }
  });

  it('widens both ends — good gets better, bad gets worse', () => {
    expect(applyRider('success', 'all_or_nothing')).toBe('critical_success');
    expect(applyRider('success_at_cost', 'all_or_nothing')).toBe('success');
    expect(applyRider('near_miss', 'all_or_nothing')).toBe('failure');
    expect(applyRider('failure', 'all_or_nothing')).toBe('critical_failure');
  });

  it('passes the crits through — they are already at the ends', () => {
    expect(applyRider('critical_success', 'all_or_nothing')).toBe('critical_success');
    expect(applyRider('critical_failure', 'all_or_nothing')).toBe('critical_failure');
  });

  it('takes no rng — the same input maps the same way every time', () => {
    const runs = Array.from({ length: 20 }, () => applyRider('near_miss', 'all_or_nothing'));
    expect(new Set(runs).size).toBe(1);
  });
});

describe('rider priority', () => {
  it('covers every declared rider — a rider absent here can never be selected', () => {
    // Closed-set pin: `selectActiveRider` picks via NUDGE_RIDER_PRIORITY.find(),
    // so a rider missing from the list is unreachable no matter how it is authored.
    expect([...NUDGE_RIDER_PRIORITY].sort()).toEqual([...ALL_RIDERS].sort());
  });

  it('lets a protective rider beat The Gambit, so a hand cannot cancel its own safety net', () => {
    const s = step([
      card({ id: 'gambit', rider: 'all_or_nothing' }),
      card({ id: 'net', rider: 'floor_at_cost' }),
    ]);
    expect(selectActiveRider(s, ['gambit', 'net'], 'test.template')).toBe('floor_at_cost');
  });
});

// ─── 2. The Signature (sphere discount) ──────────────────────────────

describe('sphere discount (The Signature)', () => {
  const spheres: readonly SphereName[] = ['life'];

  it('discounts a sphere-matched card', () => {
    expect(effectiveNudgeCost({ sphere: 'life', essenceCost: 3 }, spheres))
      .toBe(3 - SPHERE_DISCOUNT);
  });

  it('leaves an unmatched card at its authored price', () => {
    expect(effectiveNudgeCost({ sphere: 'entropy', essenceCost: 3 }, spheres)).toBe(3);
  });

  it('leaves a common-pool card (no sphere) at its authored price', () => {
    expect(effectiveNudgeCost({ essenceCost: 3 }, spheres)).toBe(3);
  });

  it('never discounts below the floor', () => {
    expect(effectiveNudgeCost({ sphere: 'life', essenceCost: 1 }, spheres))
      .toBe(SPHERE_DISCOUNT_MIN_COST);
  });

  it('leaves an authored-free card free — free is a decision, not an arrival point', () => {
    expect(effectiveNudgeCost({ sphere: 'life', essenceCost: 0 }, spheres)).toBe(0);
  });

  it('quotes and charges the same number', () => {
    // The bug this guards: the hand shows a discounted card as affordable and the
    // commit path deducts the authored price, overdrawing the player's essence.
    const s = step([card({ id: 'sig', sphere: 'life', essenceCost: 2 })]);
    const hand = buildNudgeHand(s, { id: 't', traitVariants: [] }, {
      ...PERMISSIVE_CONTEXT,
      availableEssence: () => 1,
      accessibleSpheres: spheres,
    });
    // Cost is 1 after discount, and the player has exactly 1 — so it is playable.
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['sig']);
    expect(totalNudgeCost(s, ['sig'], spheres)).toBe(1);
  });

  it('charges the authored price when no spheres are passed (pre-THR-885 callers)', () => {
    const s = step([card({ id: 'sig', sphere: 'life', essenceCost: 2 })]);
    expect(totalNudgeCost(s, ['sig'])).toBe(2);
  });
});

// ─── 3. World-state filters ──────────────────────────────────────────

describe('world-state filters', () => {
  const template = { id: 't', traitVariants: [] };

  it('hides a group card outside a group', () => {
    const s = step([card({ id: 'fellowship', requiresGroup: true })]);
    const hand = buildNudgeHand(s, template, PERMISSIVE_CONTEXT);
    expect(hand.hidden).toEqual(['fellowship']);
    expect(hand.playable).toHaveLength(0);
    expect(hand.dimmed).toHaveLength(0);
  });

  it('deals a group card inside a group', () => {
    const s = step([card({ id: 'fellowship', requiresGroup: true })]);
    const hand = buildNudgeHand(s, template, { ...PERMISSIVE_CONTEXT, inGroup: true });
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['fellowship']);
  });

  it('hides a favor-call card when no favor is owed', () => {
    const s = step([card({ id: 'favor', requiresFavor: true })]);
    expect(buildNudgeHand(s, template, PERMISSIVE_CONTEXT).hidden).toEqual(['favor']);
  });

  it('deals a favor-call card when a favor is owed', () => {
    const s = step([card({ id: 'favor', requiresFavor: true })]);
    const hand = buildNudgeHand(s, template, { ...PERMISSIVE_CONTEXT, hasCallableFavor: true });
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['favor']);
  });

  it('leaves an ungated card untouched — the filters are opt-in (NFP #6)', () => {
    const s = step([card({ id: 'plain' })]);
    const hand = buildNudgeHand(s, template, PERMISSIVE_CONTEXT);
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['plain']);
    expect(hand.hidden).toHaveLength(0);
  });
});

// ─── 4. Cost channels ────────────────────────────────────────────────

describe('cost channels', () => {
  it('sums detection across the committed hand', () => {
    const s = step([
      card({ id: 'heavy', costs: { detectionDelta: 0.2 } }),
      card({ id: 'heavier', costs: { detectionDelta: 0.1 } }),
    ]);
    expect(collectNudgeCostChannels(s, ['heavy', 'heavier']).detectionDelta).toBeCloseTo(0.3);
  });

  it('lets The Veil net off against The Heavy Hand', () => {
    const s = step([
      card({ id: 'heavy', costs: { detectionDelta: 0.2 } }),
      card({ id: 'veil', costs: { detectionDelta: -0.2 } }),
    ]);
    // Net zero, and a zero channel is omitted rather than charged.
    expect(collectNudgeCostChannels(s, ['heavy', 'veil']).detectionDelta).toBeUndefined();
  });

  it('omits channels no committed card charges', () => {
    const s = step([card({ id: 'plain' })]);
    expect(collectNudgeCostChannels(s, ['plain'])).toEqual({});
  });

  it('ignores an uncommitted card that would have charged', () => {
    const s = step([card({ id: 'heavy', costs: { detectionDelta: 0.2 } })]);
    expect(collectNudgeCostChannels(s, [])).toEqual({});
  });

  it('applies a signed detection delta and clamps at both ends', () => {
    const raised = applyRawDetectionDelta([], 'region.a', 0.3, 5);
    expect(raised.toPressure).toBeCloseTo(0.3);

    // The Veil lowering past zero stops at zero, and reports what it actually did.
    const lowered = applyRawDetectionDelta(raised.regionalDetectionPressure, 'region.a', -0.9, 6);
    expect(lowered.toPressure).toBe(0);
    expect(lowered.appliedDelta).toBeCloseTo(-0.3);

    const capped = applyRawDetectionDelta([], 'region.b', 5, 7);
    expect(capped.toPressure).toBe(MAX_DETECTION_PRESSURE);
  });
});

// ─── 5. Grants ───────────────────────────────────────────────────────

describe('grant collection', () => {
  const omen: EncounterAftermathReactionEffect = {
    kind: 'emit_omen',
    category: 'doom_echo',
    intensity: 0.5,
    narrativeHook: 'Crows settle on the mill.',
    scope: { kind: 'global' },
  };

  it('collects grants in committed order', () => {
    const s = step([
      card({ id: 'omen', grants: [omen] }),
      card({ id: 'plain' }),
    ]);
    expect(collectNudgeGrants(s, ['omen', 'plain'])).toEqual([omen]);
  });

  it('returns nothing for a hand of pure forecast cards', () => {
    const s = step([card({ id: 'push', forecastDelta: 0.1 })]);
    expect(collectNudgeGrants(s, ['push'])).toEqual([]);
  });

  it('skips a committed id with no matching card', () => {
    const s = step([card({ id: 'omen', grants: [omen] })]);
    expect(collectNudgeGrants(s, ['stale_id'])).toEqual([]);
  });
});

// ─── 6. Ambition assignment (the missing dispatcher) ─────────────────

describe('assignAmbitionToActor (The Kindled Ambition)', () => {
  const liveTemplateId = AMBITION_TEMPLATES[0].id;

  function graphWithActor(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({ id: 'actor.1', type: 'actor', name: 'Mira', properties: {} });
    return graph;
  }

  it('plants an ambition and wires the pursues edge', () => {
    const graph = graphWithActor();
    const result = assignAmbitionToActor(graph, 'actor.1', liveTemplateId, 10);

    expect(result.assigned).toBe(true);
    expect(result.priority).toBe('primary');
    const edges = graph.getOutgoingEdges('actor.1', 'pursues');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(`ambition.${liveTemplateId}`);
    expect(edges[0].properties.status).toBe('active');
    expect(edges[0].properties.assignedTick).toBe(10);
  });

  it('reuses the shared ambition node rather than minting a second one', () => {
    const graph = graphWithActor();
    graph.addNode({ id: 'actor.2', type: 'actor', name: 'Rell', properties: {} });
    assignAmbitionToActor(graph, 'actor.1', liveTemplateId, 10);
    assignAmbitionToActor(graph, 'actor.2', liveTemplateId, 11);

    expect(graph.getNodesByType('ambition')).toHaveLength(1);
  });

  it('refuses a duplicate rather than stacking the same ambition twice', () => {
    const graph = graphWithActor();
    assignAmbitionToActor(graph, 'actor.1', liveTemplateId, 10);
    const second = assignAmbitionToActor(graph, 'actor.1', liveTemplateId, 11);

    expect(second.assigned).toBe(false);
    expect(second.reason).toBe('already_pursued');
    expect(graph.getOutgoingEdges('actor.1', 'pursues')).toHaveLength(1);
  });

  it('respects the active-slot cap', () => {
    const graph = graphWithActor();
    for (let i = 0; i < MAX_ACTIVE_AMBITIONS; i++) {
      expect(assignAmbitionToActor(graph, 'actor.1', AMBITION_TEMPLATES[i].id, 10).assigned).toBe(true);
    }
    const overflow = assignAmbitionToActor(
      graph, 'actor.1', AMBITION_TEMPLATES[MAX_ACTIVE_AMBITIONS].id, 10,
    );
    expect(overflow.assigned).toBe(false);
    expect(overflow.reason).toBe('no_free_slot');
  });

  it('fails soft on a retired template id rather than throwing (NFP #4)', () => {
    const graph = graphWithActor();
    const result = assignAmbitionToActor(graph, 'actor.1', 'ambition.that.never.existed', 10);
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe('template_unknown');
  });

  it('fails soft on a missing actor', () => {
    const result = assignAmbitionToActor(new WorldGraph(), 'ghost', liveTemplateId, 10);
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe('actor_missing');
  });
});

// ─── 7. Grant liveness ───────────────────────────────────────────────

describe('nudge grant liveness', () => {
  it('has no library play profile granting content that was never built', () => {
    // THR-1248. The template sweep below structurally cannot see this surface:
    // `PLAY_PROFILES` grants are authored once per library member and minted at
    // deal time, so `allTemplateEffects` never walks them. A dead id here is
    // worse than a dead id in a template — it misfires in every encounter that
    // member is ever dealt into, not in the one scene that named it.
    const report = validateLibraryGrantRefs();
    // Non-vacuity: the corpus really does author validatable refs (ambitions and
    // conditions). If this floor trips, the sweep stopped finding the library.
    expect(report.checkedRefs).toBeGreaterThan(0);
    expect(report.sitesWithGrants).toBeGreaterThan(0);
    expect(formatDeadNudgeGrantRefs(report.dead)).toBe('');
  });

  it('has no effect naming content that was never built', () => {
    const report = validateNudgeGrantRefs(UNIFIED_ACTION_TEMPLATES);
    // Non-vacuity, asserted rather than assumed (THR-1171). Until the sweep was
    // widened past `step.nudges[].grants` this genuinely ran against an empty
    // population — no shipped card authored a grant — so the green above proved
    // nothing, and it stayed green through the whole life of the apotheosis
    // `grieving` defect. The corpus now carries hundreds of aftermath refs; if
    // this floor ever trips, the sweep stopped finding content, and the
    // emptiness must be explained before the green below is believed.
    expect(report.checkedRefs).toBeGreaterThan(0);
    expect(formatDeadNudgeGrantRefs(report.dead)).toBe('');
  });

  it('catches a dead reference when one is injected', () => {
    // Falsifiability guard — proves the sweep can actually fail, independent of
    // whatever the shipped corpus happens to contain on any given day.
    const poisoned = [{
      id: 'test.poisoned',
      steps: [{
        nudges: [card({
          id: 'cache',
          grants: [{ kind: 'spawn_artifact', templateId: 'artifact.that.never.existed' }],
        })],
      }],
    }] as unknown as UnifiedActionTemplate[];

    const report = validateNudgeGrantRefs(poisoned);
    expect(report.checkedRefs).toBe(1);
    expect(report.dead).toHaveLength(1);
    expect(report.dead[0].ref).toBe('artifact.that.never.existed');
    expect(report.dead[0].refKind).toBe('artifact');
  });

  it('catches a dead reference authored in an aftermath band, not just on a card', () => {
    // THR-1171 regression. This is the exact shape the sweep could not see: the
    // template has no cards at all, and its only dead ref sits on a reaction
    // hanging off a `byOutcome` band. The old walk read `step.nudges[].grants`
    // and reported such a template clean — which is how the apotheosis capstone
    // shipped a `condition_attachment` to an undefined condition while this
    // suite stayed green. Narrowing the traversal again fails here by name.
    const bandOnly = [{
      id: 'test.band_only',
      steps: [],
      aftermathConfig: {
        variants: {
          negative: {
            byOutcome: {
              critical_failure: {
                reactions: [{
                  id: 'sit_with_it',
                  effects: [{
                    kind: 'condition_attachment',
                    templateId: 'trait.condition.that.never.existed',
                  }],
                }],
              },
            },
          },
        },
      },
    }] as unknown as UnifiedActionTemplate[];

    const report = validateNudgeGrantRefs(bandOnly);
    expect(report.dead).toHaveLength(1);
    expect(report.dead[0].ref).toBe('trait.condition.that.never.existed');
    expect(report.dead[0].refKind).toBe('condition');
    // The site must name the band, or a failure report cannot be acted on.
    expect(report.dead[0].site).toContain('critical_failure');
  });

  it('accepts a reference that does resolve', () => {
    const clean = [{
      id: 'test.clean',
      steps: [{
        nudges: [card({
          id: 'kindle',
          grants: [{ kind: 'assign_ambition', templateId: AMBITION_TEMPLATES[0].id }],
        })],
      }],
    }] as unknown as UnifiedActionTemplate[];

    const report = validateNudgeGrantRefs(clean);
    expect(report.checkedRefs).toBe(1);
    expect(report.dead).toEqual([]);
  });
});
