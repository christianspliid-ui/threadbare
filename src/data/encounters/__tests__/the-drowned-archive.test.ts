/**
 * Tests for The Drowned Archive — a three-step `shadow` -> `eye` -> `veil`
 * delve with two carryover maps and a hand on all three steps.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: three plain ActionSteps, no branch node
 * - Setting envelope: three declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - Steps 1 and 2's `carryoverFactorLines` cover all six StepOutcome bands
 * - All three hands: 4-8 cards, >=4 distinct spheres, >=1 ungated common
 *   option, <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand
 *   violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member (except the
 *   one declared one-off)
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered across each hand; every nudge carries
 *   at least one failure-band fragment
 * - Aftermath variant resolution for all five authored bands
 * - Support bundle actor resolution for the `keeper` key
 * - `traitVariants` resolution for `trait.core.core_integrity.virtue`
 * - The package-critic correction (A1): the five knowledge chips
 *   (`archive.crit.charter_known`, `archive.success.charter_known`,
 *   `archive.cost.charter_known`, `archive.fail.kept_name`,
 *   `archive.crit_fail.one_line`) anchor `$actor` with no `visualKind`
 * - Exactly one `individual`-anchored chip and one `location`-anchored chip
 * - `checkCompositionContract` reports zero violations
 */

import { describe, it, expect } from 'vitest';
import { THE_DROWNED_ARCHIVE_TEMPLATE } from '../the-drowned-archive';
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

const step0 = THE_DROWNED_ARCHIVE_TEMPLATE.steps[0] as ActionStep;
const step1 = THE_DROWNED_ARCHIVE_TEMPLATE.steps[1] as ActionStep;
const step2 = THE_DROWNED_ARCHIVE_TEMPLATE.steps[2] as ActionStep;
const step0Hand = step0.nudges ?? [];
const step1Hand = step1.nudges ?? [];
const step2Hand = step2.nudges ?? [];

describe('The Drowned Archive — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.delve.the_drowned_archive');
    expect(found).toBeDefined();
    expect(found?.name).toBe('The Drowned Archive');
  });

  it('has exactly three steps, all plain ActionSteps (no branch node)', () => {
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.steps).toHaveLength(3);
    expect(isActionStepBranch(THE_DROWNED_ARCHIVE_TEMPLATE.steps[0])).toBe(false);
    expect(isActionStepBranch(THE_DROWNED_ARCHIVE_TEMPLATE.steps[1])).toBe(false);
    expect(isActionStepBranch(THE_DROWNED_ARCHIVE_TEMPLATE.steps[2])).toBe(false);
  });

  it('carries the required template metadata', () => {
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.id).toBe('encounter.delve.the_drowned_archive');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.reach).toBe('shadow');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.rarityTier).toBe(2);
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.intrinsicTier).toBe('background');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.crudType).toBe('read');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.scale).toBe('local');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.apCost).toBe(1);
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.consequenceDraw).toEqual(['relationship', 'knowledge']);
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.consequenceSwap?.from).toBe('movement');
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.consequenceSwap?.to).toBe('knowledge');
  });

  it('step 0 carries reach, difficulty, purposeLine, and a narrativeTemplate', () => {
    expect(step0.reach).toBe('shadow');
    expect(step0.difficulty).toBe(0.38);
    expect(step0.purposeLine).toBe('Go down unheard');
    expect(step0.narrativeTemplate).toBeTruthy();
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 1 carries reach, difficulty, purposeLine, and a narrativeTemplate', () => {
    expect(step1.reach).toBe('eye');
    expect(step1.difficulty).toBe(0.42);
    expect(step1.purposeLine).toBe('Read the shelves');
    expect(step1.narrativeTemplate).toBeTruthy();
    expect(step1.failBehavior).toBe('continue_weakened');
  });

  it('step 2 carries reach, difficulty, purposeLine, and a narrativeTemplate', () => {
    expect(step2.reach).toBe('veil');
    expect(step2.difficulty).toBe(0.44);
    expect(step2.purposeLine).toBe('Answer the warden');
    expect(step2.narrativeTemplate).toBeTruthy();
    expect(step2.failBehavior).toBe('fail_action');
  });

  it('step 0 carries no carryoverFactorLines (no predecessor)', () => {
    expect(step0.carryoverFactorLines).toBeUndefined();
  });
});

describe('The Drowned Archive — carryover', () => {
  it('step 1 authors carryoverFactorLines (keyed on step 0) for all six StepOutcome bands', () => {
    for (const band of ALL_BAND_OUTCOMES) {
      const line = step1.carryoverFactorLines?.[band];
      expect(line?.text, `step 1 carryover line for "${band}" should be authored`).toBeTruthy();
      expect(line?.polarity === 'for' || line?.polarity === 'against').toBe(true);
    }
  });

  it('step 2 authors carryoverFactorLines (keyed on step 1) for all six StepOutcome bands', () => {
    for (const band of ALL_BAND_OUTCOMES) {
      const line = step2.carryoverFactorLines?.[band];
      expect(line?.text, `step 2 carryover line for "${band}" should be authored`).toBeTruthy();
      expect(line?.polarity === 'for' || line?.polarity === 'against').toBe(true);
    }
  });
});

describe('The Drowned Archive — setting envelope', () => {
  it('declares the three classes and an opening for each', () => {
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.settings).toEqual(['ruin', 'arcane', 'sacred']);
    for (const cls of THE_DROWNED_ARCHIVE_TEMPLATE.settings ?? []) {
      expect(THE_DROWNED_ARCHIVE_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.locationSubtypes).toEqual(expandSettings(['ruin', 'arcane', 'sacred']));
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = THE_DROWNED_ARCHIVE_TEMPLATE.locationSubtypes ?? [];
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
  ['step 2', () => step2Hand],
])('The Drowned Archive — %s hand', (_label, getHand) => {
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

  it('every declared libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    const hand = getHand();
    for (const nudge of hand) {
      if (!nudge.libraryCardId) continue; // the declared one-off (archive.salvage_one_fact) carries none
      const member = nudgeCardMember(nudge.libraryCardId);
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

describe('The Drowned Archive — the declared one-off card', () => {
  it('archive.salvage_one_fact carries no libraryCardId', () => {
    const card = step2Hand.find((n) => n.id === 'archive.salvage_one_fact');
    expect(card).toBeDefined();
    expect(card?.libraryCardId).toBeUndefined();
  });
});

describe('The Drowned Archive — hand arithmetic (passes checkNudgeHand)', () => {
  it('passes checkNudgeHand with zero violations', () => {
    const violations = checkNudgeHand(THE_DROWNED_ARCHIVE_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('The Drowned Archive — aftermath', () => {
  const byOutcome = THE_DROWNED_ARCHIVE_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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
    expect(THE_DROWNED_ARCHIVE_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('resolves the support bundle actor at the keeper key', () => {
    const bundle = THE_DROWNED_ARCHIVE_TEMPLATE.supportBundle ?? [];
    const keeper = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'keeper');
    expect(keeper).toBeDefined();
    expect(keeper?.kind === 'actor' && keeper.persistence).toBe('must-persist');
    expect(keeper?.kind === 'actor' && keeper.delivery).toBe('lazy-materialize-on-trigger');
  });

  it('resolves the traitVariant for trait.core.core_integrity.virtue', () => {
    const variant = THE_DROWNED_ARCHIVE_TEMPLATE.traitVariants?.find(
      (v) => v.traitId === 'trait.core.core_integrity.virtue',
    );
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
    expect(variant?.addNudgeIds).toEqual(['archive.draw_on_character']);
  });

  it('carries six individual-anchored chips (THR-1317 made the five knowledge chips live)', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    const individualAnchored = allChanges.filter((c) => c.stateNoun?.visualKind === 'agent');
    expect(individualAnchored.map((c) => c.id).sort()).toEqual([
      'archive.cost.charter_known',
      'archive.crit.charter_known',
      'archive.crit.keeper_trusts',
      'archive.crit_fail.one_line',
      'archive.fail.kept_name',
      'archive.success.charter_known',
    ]);
  });

  it('carries exactly one location-anchored chip', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    const locationAnchored = allChanges.filter((c) => c.stateNoun?.visualKind === 'location');
    expect(locationAnchored.map((c) => c.id)).toEqual(['archive.success.watched']);
  });

  it('carries no reputation_tally chip', () => {
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    expect(allChanges.some((c) => c.kind === 'reputation_tally')).toBe(false);
  });

  /**
   * THR-1317 — was "…anchor $actor with no visualKind".
   *
   * The A1 correction re-anchored these five from `$target`/`location` to `$actor` so
   * the click would land where the `intelligence` write actually lands, and dropped the
   * `visualKind` to shed the wrong location tile. Shedding the kind sheds the whole
   * reference: `fromConceptRef` returns `undefined` unless `entityId` *and* `visualKind`
   * are both set, so these five rendered as plain text carrying a `$actor` sentinel no
   * consumer ever read — the click landed nowhere, which is the opposite of what A1 asked
   * for. `visualKind: 'agent'` is what that intent compiles to, and the tile it draws is
   * the actor's, which is correct here: the sentence is about a record *they* gained.
   *
   * A1's other half is untouched and still asserted below — `targetEntityId` is not a
   * scene-sentinel field and no intelligence effect authors one.
   */
  it('package-critic fix (A1): the five knowledge chips anchor $actor as an agent', () => {
    const knowledgeChipIds = [
      'archive.crit.charter_known',
      'archive.success.charter_known',
      'archive.cost.charter_known',
      'archive.fail.kept_name',
      'archive.crit_fail.one_line',
    ];
    const allChanges = Object.values(byOutcome ?? {}).flatMap((band) => band?.changes ?? []);
    for (const id of knowledgeChipIds) {
      const chip = allChanges.find((c) => c.id === id);
      expect(chip, `chip "${id}" should exist`).toBeDefined();
      expect(chip?.stateNoun?.entityId, `chip "${id}" should anchor $actor`).toBe('$actor');
      expect(chip?.stateNoun?.visualKind, `chip "${id}" should anchor as an agent`).toBe('agent');
    }
  });

  it('every intelligence effect omits targetEntityId (not a scene-sentinel field)', () => {
    const allReactionEffects = Object.values(byOutcome ?? {}).flatMap(
      (band) => band?.reactions?.flatMap((r) => r.effects) ?? [],
    );
    const intelligenceEffects = allReactionEffects.filter(
      (e): e is Extract<typeof e, { kind: 'intelligence' }> => e.kind === 'intelligence',
    );
    expect(intelligenceEffects.length).toBeGreaterThan(0);
    for (const effect of intelligenceEffects) {
      expect(effect.targetEntityId).toBeUndefined();
    }
  });
});

describe('The Drowned Archive — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(THE_DROWNED_ARCHIVE_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
