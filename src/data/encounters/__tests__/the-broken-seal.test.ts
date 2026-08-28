/**
 * Tests for The Broken Seal — a two-step `star` -> `stone` delve with
 * carryover.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: two plain ActionSteps, no branch node
 * - Setting envelope: three declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - Step 1's `carryoverFactorLines` cover all six StepOutcome bands
 * - Both hands: 4-8 cards, >=4 distinct spheres, >=1 ungated common option,
 *   <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered across each hand; every nudge carries
 *   at least one failure-band fragment
 * - Aftermath variant resolution for all five authored bands
 * - Support bundle actor resolution for the `rival` key
 * - `traitVariants` resolution for `trait.core.core_hope.virtue`
 * - The package-critic correction: `seal.crit_fail.the_wanting` carries no
 *   `visualKind: 'agent'`, so the encounter has exactly one
 *   `individual`-anchored chip (`seal.fail.driven_out`)
 * - `checkCompositionContract` reports zero violations
 */

import { describe, it, expect } from 'vitest';
import { THE_BROKEN_SEAL_TEMPLATE } from '../the-broken-seal';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStep, StepOutcome } from '../../../types/unifiedAction';
import { expandSettings } from '../../settingClasses';
import { WorldGraph } from '../../../engine/graph';
import { getPlaceTierLocations, isPlaceTierLocation } from '../../../engine/sublocationShape';
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

const step0 = THE_BROKEN_SEAL_TEMPLATE.steps[0] as ActionStep;
const step1 = THE_BROKEN_SEAL_TEMPLATE.steps[1] as ActionStep;
const step0Hand = step0.nudges ?? [];
const step1Hand = step1.nudges ?? [];

describe('The Broken Seal — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.delve.the_broken_seal');
    expect(found).toBeDefined();
    expect(found?.name).toBe('The Broken Seal');
  });

  it('has exactly two steps, both plain ActionSteps (no branch node)', () => {
    expect(THE_BROKEN_SEAL_TEMPLATE.steps).toHaveLength(2);
    expect(isActionStepBranch(THE_BROKEN_SEAL_TEMPLATE.steps[0])).toBe(false);
    expect(isActionStepBranch(THE_BROKEN_SEAL_TEMPLATE.steps[1])).toBe(false);
  });

  it('carries the required template metadata', () => {
    expect(THE_BROKEN_SEAL_TEMPLATE.id).toBe('encounter.delve.the_broken_seal');
    expect(THE_BROKEN_SEAL_TEMPLATE.reach).toBe('star');
    expect(THE_BROKEN_SEAL_TEMPLATE.rarityTier).toBe(2);
    expect(THE_BROKEN_SEAL_TEMPLATE.intrinsicTier).toBe('background');
    expect(THE_BROKEN_SEAL_TEMPLATE.crudType).toBe('read');
    expect(THE_BROKEN_SEAL_TEMPLATE.scale).toBe('local');
    expect(THE_BROKEN_SEAL_TEMPLATE.apCost).toBe(1);
    expect(THE_BROKEN_SEAL_TEMPLATE.consequenceDraw).toEqual(['drive', 'movement']);
  });

  it('step 0 carries reach, difficulty, purposeLine, and a narrativeTemplate', () => {
    expect(step0.reach).toBe('star');
    expect(step0.difficulty).toBe(0.4);
    expect(step0.purposeLine).toBe('Find the stair down');
    expect(step0.narrativeTemplate).toBeTruthy();
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 1 carries reach, difficulty, purposeLine, and a narrativeTemplate', () => {
    expect(step1.reach).toBe('stone');
    expect(step1.difficulty).toBe(0.44);
    expect(step1.purposeLine).toBe('Carry it back up');
    expect(step1.narrativeTemplate).toBeTruthy();
    expect(step1.failBehavior).toBe('fail_action');
  });

  it('step 0 carries no carryoverFactorLines (no predecessor)', () => {
    expect(step0.carryoverFactorLines).toBeUndefined();
  });
});

describe('The Broken Seal — carryover', () => {
  it('step 1 authors carryoverFactorLines for all six StepOutcome bands', () => {
    for (const band of ALL_BAND_OUTCOMES) {
      const line = step1.carryoverFactorLines?.[band];
      expect(line?.text, `carryover line for "${band}" should be authored`).toBeTruthy();
      expect(line?.polarity === 'for' || line?.polarity === 'against').toBe(true);
    }
  });
});

describe('The Broken Seal — setting envelope', () => {
  it('declares the three classes and an opening for each', () => {
    expect(THE_BROKEN_SEAL_TEMPLATE.settings).toEqual(['ruin', 'arcane', 'sacred']);
    for (const cls of THE_BROKEN_SEAL_TEMPLATE.settings ?? []) {
      expect(THE_BROKEN_SEAL_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(THE_BROKEN_SEAL_TEMPLATE.locationSubtypes).toEqual(expandSettings(['ruin', 'arcane', 'sacred']));
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = THE_BROKEN_SEAL_TEMPLATE.locationSubtypes ?? [];
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

    const placeTierNodes = getPlaceTierLocations(graph);
    expect(placeTierNodes).toHaveLength(subtypes.length);
    for (const node of placeTierNodes) {
      expect(isPlaceTierLocation(node)).toBe(true);
    }
  });
});

describe.each([
  ['step 0', () => step0Hand],
  ['step 1', () => step1Hand],
])('The Broken Seal — %s hand', (_label, getHand) => {
  it('deals between 4 and 8 cards', () => {
    const hand = getHand();
    expect(hand.length).toBeGreaterThanOrEqual(4);
    expect(hand.length).toBeLessThanOrEqual(8);
  });

  it('covers at least 4 distinct spheres', () => {
    const hand = getHand();
    const spheres = new Set(hand.map((n) => n.sphere).filter((s): s is NonNullable<typeof s> => Boolean(s)));
    expect(spheres.size).toBeGreaterThanOrEqual(4);
  });

  it('includes at least one ungated common (sphere-less) option', () => {
    const hand = getHand();
    const commons = hand.filter((n) => !n.sphere && !n.requiredTrait && !n.requiresGroup && !n.requiresFavor);
    expect(commons.length).toBeGreaterThanOrEqual(1);
  });

  it('carries at most one rider', () => {
    const hand = getHand();
    const riders = hand.filter((n) => n.rider);
    expect(riders.length).toBeLessThanOrEqual(1);
  });

  it('has no digit or % character in any effectLine', () => {
    const hand = getHand();
    for (const nudge of hand) {
      expect(nudge.effectLine).not.toMatch(/[0-9%]/);
    }
  });

  it('covers all six StepOutcome bands across the hand', () => {
    const hand = getHand();
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
    const hand = getHand();
    for (const nudge of hand) {
      const bands = Object.keys(nudge.bandProse ?? {}) as StepOutcome[];
      const hasFailureFragment = bands.some((b) => FAILURE_BAND_OUTCOMES.includes(b));
      expect(hasFailureFragment, `nudge "${nudge.id}" should carry a failure-band fragment`).toBe(true);
    }
  });

  it('every libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    const hand = getHand();
    for (const nudge of hand) {
      expect(nudge.libraryCardId).toBeDefined();
      const member = nudgeCardMember(nudge.libraryCardId as string);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('every imageTag resolves to a real ENCOUNTER_IMAGE_LIBRARY row', () => {
    const hand = getHand();
    const imageIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    for (const nudge of hand) {
      expect(nudge.imageTag).toBeDefined();
      expect(imageIds.has(nudge.imageTag as string), `imageTag "${nudge.imageTag}" on nudge "${nudge.id}"`).toBe(
        true,
      );
    }
  });
});

describe('The Broken Seal — hand arithmetic (passes checkNudgeHand)', () => {
  it('passes checkNudgeHand with zero violations', () => {
    const violations = checkNudgeHand(THE_BROKEN_SEAL_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('The Broken Seal — aftermath', () => {
  const byOutcome = THE_BROKEN_SEAL_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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
    expect(THE_BROKEN_SEAL_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('resolves the support bundle actor at the rival key', () => {
    const bundle = THE_BROKEN_SEAL_TEMPLATE.supportBundle ?? [];
    const rival = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'rival');
    expect(rival).toBeDefined();
    expect(rival?.kind === 'actor' && rival.persistence).toBe('must-persist');
    expect(rival?.kind === 'actor' && rival.delivery).toBe('lazy-materialize-on-trigger');
  });

  it('resolves the traitVariant for trait.core.core_hope.virtue', () => {
    const variant = THE_BROKEN_SEAL_TEMPLATE.traitVariants?.find((v) => v.traitId === 'trait.core.core_hope.virtue');
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
    expect(variant?.addNudgeIds).toEqual(['seal.draw_on_character']);
  });

  it('carries two individual-anchored chips (THR-1317 restored the ambition carrier)', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    const individualAnchored = allChanges.filter((c) => c.stateNoun?.visualKind === 'agent');
    expect(individualAnchored.map((c) => c.id).sort()).toEqual([
      'seal.crit_fail.the_wanting',
      'seal.fail.driven_out',
    ]);
  });

  /**
   * THR-1317 — was "names the actor sentinel with no visualKind", pinning a shape
   * that could not render.
   *
   * The package-critic correction dropped `visualKind` to stop the chip reading as
   * being about the person, and kept `entityId: '$actor'` as the ambition's carrier
   * route. Only the second half survived contact with the machinery: `fromConceptRef`
   * returns `undefined` unless *both* fields are present, so the route was never drawn
   * and Law 56 clause 2 read the noun as anchoring nothing. Dropping the `entityId`
   * instead fails `check:chip-anchors` outright — clause 2 wants an `entityId` or a
   * resolving `tooltipId`, and no tooltip concept names an ambition.
   *
   * So the assertion is inverted rather than deleted: the carrier route the correction
   * asked for is now the one that actually exists.
   */
  it('the ambition chip on critical_failure anchors the actor as the ambition carrier', () => {
    const chip = byOutcome?.critical_failure?.changes?.find((c) => c.id === 'seal.crit_fail.the_wanting');
    expect(chip).toBeDefined();
    expect(chip?.stateNoun?.entityId).toBe('$actor');
    expect(chip?.stateNoun?.visualKind).toBe('agent');
  });

  it('carries exactly one location-anchored chip', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    const locationAnchored = allChanges.filter((c) => c.stateNoun?.visualKind === 'location');
    expect(locationAnchored.map((c) => c.id)).toEqual(['seal.crit_fail.shut']);
  });

  it('carries no reputation_tally chip', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    expect(allChanges.some((c) => c.kind === 'reputation_tally')).toBe(false);
  });
});

describe('The Broken Seal — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(THE_BROKEN_SEAL_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
