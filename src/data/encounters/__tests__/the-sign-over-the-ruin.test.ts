/**
 * Tests for The Sign Over the Ruin — a two-step `veil` -> `eye` test.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: two plain ActionSteps, no branch node
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - Each step's hand: 4-8 cards, >=4 distinct spheres, >=1 ungated common
 *   option, <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand
 *   violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered per step; every nudge carries at
 *   least one failure-band fragment
 * - `checkCompositionContract` reports zero violations
 * - The package-critic fix list (the-sign-over-the-ruin-package.md,
 *   "Fix list — applicable without re-reading the packet"): the mercy
 *   reaction `sign.take_the_fear_off_them` carries `removeAll: true`, since
 *   Terrified can be applied twice on the compound failure path
 *   (step 0's own `failureMetadata` plus step 1's) and the un-flagged form
 *   would remove only the oldest edge.
 * - A reachability assertion: every aftermath chip's backing write lives on
 *   a step that actually runs on the band the chip renders on, including
 *   the systems-pass repair — step 0's own `failureMetadata` duplicates the
 *   `critical_failure` band's effects so they are backed even on the path
 *   where step 0 alone rolls `critical_failure` and step 1 never runs.
 */

import { describe, it, expect } from 'vitest';
import { THE_SIGN_OVER_THE_RUIN_TEMPLATE } from '../the-sign-over-the-ruin';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStep, StepOutcome } from '../../../types/unifiedAction';
import { expandSettings } from '../../settingClasses';
import { WorldGraph } from '../../../engine/graph';
import { getLocationNodes, isLocationNode } from '../../../engine/sublocationShape';
import { nudgeCardMember } from '../../nudge-card-library';
import { ENCOUNTER_IMAGE_LIBRARY } from '../../encounter-image-library';
import { checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { checkCompositionContract } from '../../content-eval/compositionContract';

const ALL_BAND_OUTCOMES: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

const FAILURE_BAND_OUTCOMES: readonly StepOutcome[] = ['near_miss', 'failure', 'critical_failure'];

const step0 = THE_SIGN_OVER_THE_RUIN_TEMPLATE.steps[0] as ActionStep;
const step1 = THE_SIGN_OVER_THE_RUIN_TEMPLATE.steps[1] as ActionStep;
const handA = step0.nudges ?? [];
const handB = step1.nudges ?? [];

describe('The Sign Over the Ruin — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.the_sign_over_the_ruin');
    expect(found).toBeDefined();
    expect(found?.name).toBe('The Sign Over the Ruin');
  });

  it('carries the required template metadata', () => {
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.id).toBe('encounter.border.the_sign_over_the_ruin');
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.reach).toBe('veil');
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.rarityTier).toBe(3);
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.intrinsicTier).toBe('background');
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.crudType).toBe('read');
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.scale).toBe('local');
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.apCost).toBe(1);
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.consequenceDraw).toEqual(['condition', 'knowledge', 'movement']);
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.consequenceSwap).toBeUndefined();
  });

  it('has exactly two steps, both plain ActionSteps (no branch node)', () => {
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.steps).toHaveLength(2);
    expect(isActionStepBranch(THE_SIGN_OVER_THE_RUIN_TEMPLATE.steps[0])).toBe(false);
    expect(isActionStepBranch(THE_SIGN_OVER_THE_RUIN_TEMPLATE.steps[1])).toBe(false);
  });

  it('step 0 (veil) is authored to survive a plain failure', () => {
    expect(step0.reach).toBe('veil');
    expect(step0.difficulty).toBe(0.40);
    expect(step0.purposeLine).toBe('Read the sign');
    expect(step0.failBehavior).toBe('continue_weakened');
    expect(step0.narrativeTemplate).toBeTruthy();
  });

  it('step 1 (eye) is the final step and ends the action on failure', () => {
    expect(step1.reach).toBe('eye');
    expect(step1.difficulty).toBe(0.42);
    expect(step1.purposeLine).toBe('Say what is there');
    expect(step1.failBehavior).toBe('fail_action');
    expect(step1.narrativeTemplate).toBeTruthy();
  });

  it('step 1 carries a carryoverFactorLine for every StepOutcome band step 0 can roll', () => {
    const lines = step1.carryoverFactorLines ?? {};
    for (const band of ALL_BAND_OUTCOMES) {
      const line = lines[band];
      expect(line, `carryoverFactorLines should cover band "${band}"`).toBeDefined();
      expect(line?.text).toBeTruthy();
      expect(['for', 'against']).toContain(line?.polarity);
    }
  });

  it('step 0 declares no carryoverFactorLines (first step, no prior outcome)', () => {
    expect(step0.carryoverFactorLines).toBeUndefined();
  });
});

describe('The Sign Over the Ruin — setting envelope', () => {
  it('declares the four classes and an opening for each', () => {
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.settings).toEqual(['stronghold', 'ruin', 'wayside', 'battlefield']);
    for (const cls of THE_SIGN_OVER_THE_RUIN_TEMPLATE.settings ?? []) {
      expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = THE_SIGN_OVER_THE_RUIN_TEMPLATE.locationSubtypes ?? [];
    expect(subtypes.length).toBeGreaterThan(0);

    const graph = new WorldGraph();
    subtypes.forEach((subtype, i) => {
      graph.addNode({
        id: `test.location.${subtype}.${i}`,
        type: 'location',
        name: `Test ${subtype}`,
        properties: { locationSubtype: subtype, hexCol: i, hexRow: 0 },
      });
    });

    const placeTierNodes = getLocationNodes(graph);
    expect(placeTierNodes).toHaveLength(subtypes.length);
    for (const node of placeTierNodes) {
      expect(isLocationNode(node)).toBe(true);
    }
  });
});

describe.each([
  ['step 0 (veil, "Read the sign")', handA],
  ['step 1 (eye, "Say what is there")', handB],
])('The Sign Over the Ruin — the hand: %s', (_label, hand) => {
  it('deals between 4 and 8 cards', () => {
    expect(hand.length).toBeGreaterThanOrEqual(4);
    expect(hand.length).toBeLessThanOrEqual(8);
  });

  it('covers at least 4 distinct spheres', () => {
    const spheres = new Set(hand.map((n) => n.sphere).filter((s): s is NonNullable<typeof s> => Boolean(s)));
    expect(spheres.size).toBeGreaterThanOrEqual(4);
  });

  it('includes at least one ungated common (sphere-less) option', () => {
    const commons = hand.filter(
      (n) => !n.sphere && !n.requiredTrait && !n.requiresGroup && !n.requiresFavor && !n.requiredUnlock,
    );
    expect(commons.length).toBeGreaterThanOrEqual(1);
  });

  it('carries at most one rider', () => {
    const riders = hand.filter((n) => n.rider);
    expect(riders.length).toBeLessThanOrEqual(1);
  });

  it('has no digit or % character in any effectLine', () => {
    for (const nudge of hand) {
      expect(nudge.effectLine).not.toMatch(/[0-9%]/);
    }
  });

  it('covers all six StepOutcome bands across the hand', () => {
    const covered = new Set<StepOutcome>();
    for (const nudge of hand) {
      for (const band of Object.keys(nudge.bandProse ?? {}) as StepOutcome[]) {
        covered.add(band);
      }
    }
    for (const band of ALL_BAND_OUTCOMES) {
      expect(covered.has(band), `band "${band}" should be covered by at least one card`).toBe(true);
    }
  });

  it('every card carries at least one failure-band fragment', () => {
    for (const nudge of hand) {
      const bands = Object.keys(nudge.bandProse ?? {}) as StepOutcome[];
      const hasFailureFragment = bands.some((b) => FAILURE_BAND_OUTCOMES.includes(b));
      expect(hasFailureFragment, `nudge "${nudge.id}" should carry a failure-band fragment`).toBe(true);
    }
  });

  it('every big-delta card (>= 0.15) carries both failure and critical_failure fragments', () => {
    for (const nudge of hand) {
      if (nudge.forecastDelta >= 0.15) {
        expect(nudge.bandProse?.failure, `big-delta nudge "${nudge.id}" should carry a failure fragment`).toBeTruthy();
        expect(
          nudge.bandProse?.critical_failure,
          `big-delta nudge "${nudge.id}" should carry a critical_failure fragment`,
        ).toBeTruthy();
      }
    }
  });
});

describe('The Sign Over the Ruin — checkNudgeHand', () => {
  it('passes with zero violations', () => {
    const violations = checkNudgeHand(THE_SIGN_OVER_THE_RUIN_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('The Sign Over the Ruin — library liveness', () => {
  it('every libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of [...handA, ...handB]) {
      if (nudge.libraryCardId === undefined) continue;
      const member = nudgeCardMember(nudge.libraryCardId);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('every card in both hands sets libraryCardId (no one-offs in this row)', () => {
    for (const nudge of [...handA, ...handB]) {
      expect(nudge.libraryCardId, `nudge "${nudge.id}" should set libraryCardId`).toBeDefined();
    }
  });

  it('the two forced repeats (Omen and Boost/energy) share libraryCardId across hands but carry distinct ids', () => {
    const omenA = handA.find((n) => n.libraryCardId === 'card.omen.signature.time');
    const omenB = handB.find((n) => n.libraryCardId === 'card.omen.signature.time');
    expect(omenA).toBeDefined();
    expect(omenB).toBeDefined();
    expect(omenA?.id).not.toBe(omenB?.id);

    const boostA = handA.find((n) => n.libraryCardId === 'card.boost.signature.energy');
    const boostB = handB.find((n) => n.libraryCardId === 'card.boost.signature.energy');
    expect(boostA).toBeDefined();
    expect(boostB).toBeDefined();
    expect(boostA?.id).not.toBe(boostB?.id);
  });

  it('the Omen grant fires once, on the step 0 instance only (a repeated grant would double the omen)', () => {
    const omenA = handA.find((n) => n.libraryCardId === 'card.omen.signature.time');
    const omenB = handB.find((n) => n.libraryCardId === 'card.omen.signature.time');
    expect(omenA?.grants?.some((g) => g.kind === 'emit_omen')).toBe(true);
    expect(omenB?.grants ?? []).toEqual([]);
  });

  it('the Veil type debuts with both library members split across the two hands', () => {
    const veilA = handA.find((n) => n.libraryCardId === 'card.veil.attunement.darkness');
    const veilB = handB.find((n) => n.libraryCardId === 'card.veil.signature.darkness');
    expect(veilA).toBeDefined();
    expect(veilB).toBeDefined();
  });

  it('every imageTag resolves to a real ENCOUNTER_IMAGE_LIBRARY row', () => {
    const imageIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    for (const nudge of [...handA, ...handB]) {
      expect(nudge.imageTag).toBeDefined();
      expect(imageIds.has(nudge.imageTag as string), `imageTag "${nudge.imageTag}" on nudge "${nudge.id}"`).toBe(
        true,
      );
    }
  });
});

describe('The Sign Over the Ruin — cast and trait hook', () => {
  it('resolves the support bundle actor at the witness key', () => {
    const bundle = THE_SIGN_OVER_THE_RUIN_TEMPLATE.supportBundle ?? [];
    const witness = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'witness');
    expect(witness).toBeDefined();
    expect(witness?.kind === 'actor' && witness.persistence).toBe('must-persist');
    expect(witness?.kind === 'actor' && witness.delivery).toBe('lazy-materialize-on-trigger');
    expect(witness?.kind === 'actor' && witness.reuseNpcRoles).toEqual(['pilgrim', 'wanderer', 'hermit']);
  });

  it('resolves the traitVariant for trait.core.core_humility.virtue and unlocks the trait card', () => {
    const variant = THE_SIGN_OVER_THE_RUIN_TEMPLATE.traitVariants?.find(
      (v) => v.traitId === 'trait.core.core_humility.virtue',
    );
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
    expect(variant?.addNudgeIds).toEqual(['sign.a_reading_offered']);

    const traitCard = handB.find((n) => n.id === 'sign.a_reading_offered');
    expect(traitCard).toBeDefined();
    expect(traitCard?.requiredTrait).toBe('trait.core.core_humility.virtue');
    expect(traitCard?.essenceCost).toBe(0);
  });
});

describe('The Sign Over the Ruin — aftermath', () => {
  const byOutcome = THE_SIGN_OVER_THE_RUIN_TEMPLATE.aftermathConfig?.fallback.byOutcome;

  it('resolves all five authored bands with an overview', () => {
    const bands: readonly Exclude<StepOutcome, 'near_miss' | 'contested_won' | 'contested_lost'>[] = [
      'critical_success',
      'success',
      'success_at_cost',
      'failure',
      'critical_failure',
    ];
    for (const band of bands) {
      expect(byOutcome?.[band]?.overview, `band "${band}" should carry an overview`).toBeTruthy();
    }
  });

  it('has no variant-level changes (every chip is band-scoped)', () => {
    expect(THE_SIGN_OVER_THE_RUIN_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('success_at_cost deliberately authors zero changes', () => {
    expect(byOutcome?.success_at_cost?.changes).toEqual([]);
  });

  it('every declared change carries non-empty concepts', () => {
    for (const band of Object.values(byOutcome ?? {})) {
      for (const change of band?.changes ?? []) {
        expect(change.concepts?.length ?? 0, `change "${change.id}" should declare concepts`).toBeGreaterThan(0);
      }
    }
  });

  it('all three fallback reactions are declared, and no band overrides them', () => {
    const reactions = THE_SIGN_OVER_THE_RUIN_TEMPLATE.aftermathConfig?.fallback.reactions ?? [];
    expect(reactions.map((r) => r.id)).toEqual([
      'sign.steady_the_one_who_stayed',
      'sign.take_the_fear_off_them',
      'sign.let_the_country_carry_it',
    ]);
    for (const [band, override] of Object.entries(byOutcome ?? {})) {
      expect(override?.reactions, `band "${band}" should not override reactions`).toBeUndefined();
    }
  });

  it('the critical_success chip carries visualKind: location on its stateNoun (THR-1172 live click)', () => {
    const chip = byOutcome?.critical_success?.changes?.find((c) => c.id === 'sign.the_place_is_watched');
    expect(chip).toBeDefined();
    expect(chip?.stateNoun?.visualKind).toBe('location');
    expect(chip?.stateNoun?.entityId).toBe('$target');
    expect(chip?.category).toBe('scar');
  });
});

describe('The Sign Over the Ruin — package-critic fix list', () => {
  it('fix #1: the mercy reaction carries removeAll: true, the compensating change for the accepted double', () => {
    const reactions = THE_SIGN_OVER_THE_RUIN_TEMPLATE.aftermathConfig?.fallback.reactions ?? [];
    const mercy = reactions.find((r) => r.id === 'sign.take_the_fear_off_them');
    expect(mercy).toBeDefined();
    const removeEffect = mercy?.effects.find((e) => e.kind === 'remove_condition');
    expect(removeEffect).toBeDefined();
    expect(removeEffect?.kind === 'remove_condition' && removeEffect.conditionTraitId).toBe('trait.condition.terrified');
    expect(removeEffect?.kind === 'remove_condition' && removeEffect.removeAll).toBe(true);
  });

  it('the double-application shape the fix compensates for is real: Terrified is written on both steps\' failureMetadata', () => {
    const step0Terrified = (step0.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified',
    );
    const step1Terrified = (step1.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified',
    );
    expect(step0Terrified, 'step 0 failureMetadata should carry the terrified write (Pass-3 reachability repair)').toBeDefined();
    expect(step1Terrified, 'step 1 failureMetadata should carry the terrified write').toBeDefined();
  });

  it('agent_relocation is authored once per step and not duplicated the way condition_attachment is', () => {
    // Both steps write agent_relocation on their own failureMetadata (each step's own
    // "away" ending), which is expected — the point under test is that neither step's
    // failureMetadata authors condition_attachment more than once internally.
    for (const step of [step0, step1]) {
      const terrifiedWrites = (step.failureMetadata?.effects ?? []).filter(
        (e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified',
      );
      expect(terrifiedWrites.length, `${step.reach} failureMetadata should author the terrified write exactly once`).toBe(1);
    }
  });
});

describe('The Sign Over the Ruin — reachability: every chip backed by a write that fires on that band', () => {
  it('critical_success: the location chip is backed by step 1 successMetadata, which always runs on this band', () => {
    const effects = step1.successMetadata?.effects ?? [];
    expect(
      effects.some((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.location.under_watch'),
    ).toBe(true);
  });

  it('success: the relocation chip is backed by step 1 successMetadata (nearest_settlement)', () => {
    const effects = step1.successMetadata?.effects ?? [];
    const relocation = effects.find((e) => e.kind === 'agent_relocation');
    expect(relocation).toBeDefined();
    expect(relocation?.kind === 'agent_relocation' && relocation.destination.kind).toBe('nearest_settlement');
  });

  it('failure: the Terrified chip is backed by step 1 failureMetadata, reachable only via step 1\'s own failure', () => {
    const effects = step1.failureMetadata?.effects ?? [];
    expect(effects.some((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified')).toBe(
      true,
    );
  });

  it('critical_failure: both chips are backed on path A (step 0 alone crits, step 1 never runs)', () => {
    const step0Effects = step0.failureMetadata?.effects ?? [];
    expect(step0Effects.some((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified')).toBe(
      true,
    );
    const relocation = step0Effects.find((e) => e.kind === 'agent_relocation');
    expect(relocation).toBeDefined();
    expect(relocation?.kind === 'agent_relocation' && relocation.destination.kind).toBe('away');
    expect(relocation?.kind === 'agent_relocation' && relocation.destination.kind === 'away' && relocation.destination.minHexDistance).toBe(3);
  });

  it('critical_failure: both chips are also backed on path B (step 0 continues, step 1 crits)', () => {
    const step1Effects = step1.failureMetadata?.effects ?? [];
    expect(step1Effects.some((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.terrified')).toBe(
      true,
    );
    const relocation = step1Effects.find((e) => e.kind === 'agent_relocation');
    expect(relocation).toBeDefined();
    expect(relocation?.kind === 'agent_relocation' && relocation.destination.kind).toBe('away');
  });

  it('knowledge family: spawn_clue is wired on step 0 successMetadata, deliberately unchipped', () => {
    const effects = step0.successMetadata?.effects ?? [];
    const clue = effects.find((e) => e.kind === 'spawn_clue');
    expect(clue).toBeDefined();
    expect(clue?.kind === 'spawn_clue' && clue.targetRuinId).toBe('$nearest_ruin');

    // No chip in any band claims this write — it is wired but not chipped.
    const allChangeIds = Object.values(THE_SIGN_OVER_THE_RUIN_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {}).flatMap(
      (band) => (band?.changes ?? []).map((c) => c.id),
    );
    expect(allChangeIds.some((id) => id.toLowerCase().includes('clue'))).toBe(false);
  });
});

describe('The Sign Over the Ruin — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(THE_SIGN_OVER_THE_RUIN_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
