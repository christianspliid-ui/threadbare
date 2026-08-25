/**
 * Tests for The Unclaimed Relic — a single-step `stone` endurance test.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: one plain ActionStep, no branch node
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 *   (not a sublocation) — the residual assertion the package critic flagged
 *   because `$target`'s kind check excludes sublocations
 * - The hand: 4-8 cards, >=4 distinct spheres, >=1 ungated common option,
 *   <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered across the hand; every nudge carries
 *   at least one failure-band fragment
 * - Aftermath variant resolution for all five authored bands
 * - Support bundle actor resolution for the `claimant` key
 * - `traitVariants` resolution for `trait.core.core_humility.vice`
 * - `checkCompositionContract` reports zero violations
 */

import { describe, it, expect } from 'vitest';
import { THE_UNCLAIMED_RELIC_TEMPLATE } from '../the-unclaimed-relic';
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

const step0 = THE_UNCLAIMED_RELIC_TEMPLATE.steps[0] as ActionStep;
const hand = step0.nudges ?? [];

describe('The Unclaimed Relic — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.the_unclaimed_relic');
    expect(found).toBeDefined();
    expect(found?.name).toBe('The Unclaimed Relic');
  });

  it('has exactly one step, a plain ActionStep (no branch node)', () => {
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.steps).toHaveLength(1);
    expect(isActionStepBranch(THE_UNCLAIMED_RELIC_TEMPLATE.steps[0])).toBe(false);
  });

  it('carries the required template metadata', () => {
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.id).toBe('encounter.border.the_unclaimed_relic');
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.reach).toBe('stone');
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.rarityTier).toBe(1);
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.intrinsicTier).toBe('background');
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.crudType).toBe('read');
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.scale).toBe('local');
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.apCost).toBe(1);
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.consequenceDraw).toEqual(['relationship', 'possession']);
  });

  it('step 0 carries reach, difficulty, and a narrativeTemplate', () => {
    expect(step0.reach).toBe('stone');
    expect(typeof step0.difficulty).toBe('number');
    expect(step0.narrativeTemplate).toBeTruthy();
    expect(step0.failBehavior).toBe('fail_action');
  });
});

describe('The Unclaimed Relic — setting envelope', () => {
  it('declares the four classes and an opening for each', () => {
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.settings).toEqual(['stronghold', 'ruin', 'wayside', 'battlefield']);
    for (const cls of THE_UNCLAIMED_RELIC_TEMPLATE.settings ?? []) {
      expect(THE_UNCLAIMED_RELIC_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    // $target's kind check (nodeMatchesSceneField(..., 'location')) accepts a
    // place-tier location and deliberately excludes sublocations. Build one
    // synthetic node per expanded subtype and confirm none of them would be
    // filtered out by the sublocation-tier discriminator — asserted through
    // the shared helper, not a hand-rolled type check.
    const subtypes = THE_UNCLAIMED_RELIC_TEMPLATE.locationSubtypes ?? [];
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

describe('The Unclaimed Relic — the hand', () => {
  it('deals between 4 and 8 cards', () => {
    expect(hand.length).toBeGreaterThanOrEqual(4);
    expect(hand.length).toBeLessThanOrEqual(8);
  });

  it('covers at least 4 distinct spheres', () => {
    const spheres = new Set(hand.map((n) => n.sphere).filter((s): s is NonNullable<typeof s> => Boolean(s)));
    expect(spheres.size).toBeGreaterThanOrEqual(4);
  });

  it('includes at least one ungated common (sphere-less) option', () => {
    const commons = hand.filter((n) => !n.sphere && !n.requiredTrait && !n.requiresGroup && !n.requiresFavor);
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

  it('passes checkNudgeHand with zero violations', () => {
    const violations = checkNudgeHand(THE_UNCLAIMED_RELIC_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('The Unclaimed Relic — library liveness', () => {
  it('every libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of hand) {
      expect(nudge.libraryCardId).toBeDefined();
      const member = nudgeCardMember(nudge.libraryCardId as string);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('every imageTag resolves to a real ENCOUNTER_IMAGE_LIBRARY row', () => {
    const imageIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    for (const nudge of hand) {
      expect(nudge.imageTag).toBeDefined();
      expect(imageIds.has(nudge.imageTag as string), `imageTag "${nudge.imageTag}" on nudge "${nudge.id}"`).toBe(
        true,
      );
    }
  });
});

describe('The Unclaimed Relic — band coverage', () => {
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
});

describe('The Unclaimed Relic — aftermath', () => {
  const byOutcome = THE_UNCLAIMED_RELIC_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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
    expect(THE_UNCLAIMED_RELIC_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('resolves the support bundle actor at the claimant key', () => {
    const bundle = THE_UNCLAIMED_RELIC_TEMPLATE.supportBundle ?? [];
    const claimant = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'claimant');
    expect(claimant).toBeDefined();
    expect(claimant?.kind === 'actor' && claimant.persistence).toBe('must-persist');
    expect(claimant?.kind === 'actor' && claimant.delivery).toBe('lazy-materialize-on-trigger');
  });

  it('resolves the traitVariant for trait.core.core_humility.vice', () => {
    const variant = THE_UNCLAIMED_RELIC_TEMPLATE.traitVariants?.find(
      (v) => v.traitId === 'trait.core.core_humility.vice',
    );
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
  });
});

describe('The Unclaimed Relic — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(THE_UNCLAIMED_RELIC_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
