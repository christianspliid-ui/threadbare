/**
 * Tests for One Body Short — a single-step `eye` reading test, the
 * sequel-payoff half of the batch's `Seeded Sequel` pair.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: one plain ActionStep, no branch node
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - The hand: 4-8 cards, >=4 distinct spheres, >=1 ungated common option,
 *   <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member; the
 *   `long_game` one-off (`short.left_for_later`) is asserted as intentionally
 *   absent
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered across the hand; every nudge carries
 *   at least one failure-band fragment
 * - Aftermath variant resolution for all five authored bands
 * - The consequence draw: `consequenceDraw` + `consequenceSwap` clear the
 *   `draw` block (checkConsequenceDraw / checkCompositionContract)
 * - Support bundle actor resolution for the `survivor` key
 * - `traitVariants` resolution for `trait.core.core_warmth.virtue`
 * - No gendered pronoun anywhere in the template's authored prose
 * - `checkCompositionContract` reports zero violations
 */

import { describe, it, expect } from 'vitest';
import { ONE_BODY_SHORT_TEMPLATE } from '../one-body-short';
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
import { checkConsequenceDraw, familiesWiredByEffects, drawnHandForTemplate } from '../../content-eval/consequenceDraw';

const ALL_BAND_OUTCOMES: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

const FAILURE_BAND_OUTCOMES: readonly StepOutcome[] = ['near_miss', 'failure', 'critical_failure'];

const step0 = ONE_BODY_SHORT_TEMPLATE.steps[0] as ActionStep;
const hand = step0.nudges ?? [];

describe('One Body Short — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.one_body_short');
    expect(found).toBeDefined();
    expect(found?.name).toBe('One Body Short');
  });

  it('has exactly one step, a plain ActionStep (no branch node)', () => {
    expect(ONE_BODY_SHORT_TEMPLATE.steps).toHaveLength(1);
    expect(isActionStepBranch(ONE_BODY_SHORT_TEMPLATE.steps[0])).toBe(false);
  });

  it('carries the required template metadata', () => {
    expect(ONE_BODY_SHORT_TEMPLATE.id).toBe('encounter.border.one_body_short');
    expect(ONE_BODY_SHORT_TEMPLATE.reach).toBe('eye');
    expect(ONE_BODY_SHORT_TEMPLATE.rarityTier).toBe(2);
    expect(ONE_BODY_SHORT_TEMPLATE.intrinsicTier).toBe('story_beat');
    expect(ONE_BODY_SHORT_TEMPLATE.crudType).toBe('read');
    expect(ONE_BODY_SHORT_TEMPLATE.scale).toBe('local');
    expect(ONE_BODY_SHORT_TEMPLATE.apCost).toBe(1);
  });

  it('step 0 carries reach, difficulty, and a narrativeTemplate', () => {
    expect(step0.reach).toBe('eye');
    expect(step0.difficulty).toBe(0.40);
    expect(step0.narrativeTemplate).toBeTruthy();
    expect(step0.failBehavior).toBe('fail_action');
  });
});

describe('One Body Short — setting envelope', () => {
  it('declares the four classes and an opening for each', () => {
    expect(ONE_BODY_SHORT_TEMPLATE.settings).toEqual(['wayside', 'ruin', 'battlefield', 'stronghold']);
    for (const cls of ONE_BODY_SHORT_TEMPLATE.settings ?? []) {
      expect(ONE_BODY_SHORT_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(ONE_BODY_SHORT_TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['wayside', 'ruin', 'battlefield', 'stronghold']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = ONE_BODY_SHORT_TEMPLATE.locationSubtypes ?? [];
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

describe('One Body Short — the hand', () => {
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
    const violations = checkNudgeHand(ONE_BODY_SHORT_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('One Body Short — library liveness', () => {
  it('every libraryCardId (where declared) names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of hand) {
      if (nudge.libraryCardId === undefined) continue;
      const member = nudgeCardMember(nudge.libraryCardId);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('the long_game card (short.left_for_later) intentionally carries no libraryCardId', () => {
    const longGame = hand.find((n) => n.id === 'short.left_for_later');
    expect(longGame).toBeDefined();
    expect(longGame?.libraryCardId).toBeUndefined();
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

describe('One Body Short — band coverage', () => {
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

describe('One Body Short — aftermath', () => {
  const byOutcome = ONE_BODY_SHORT_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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

  it('re-declares both reactions on success_at_cost, each carrying the grieving condition', () => {
    const reactions = byOutcome?.success_at_cost?.reactions ?? [];
    expect(reactions).toHaveLength(2);
    for (const reaction of reactions) {
      const kinds = reaction.effects.map((e) => e.kind);
      expect(kinds, `reaction "${reaction.id}" should carry condition_attachment`).toContain('condition_attachment');
    }
  });

  it('carries the two fallback reactions (the god-chosen fork)', () => {
    const reactions = ONE_BODY_SHORT_TEMPLATE.aftermathConfig?.fallback.reactions ?? [];
    expect(reactions.map((r) => r.id)).toEqual(['short.say_the_count', 'short.carry_it_alone']);
  });

  it('resolves the support bundle actor at the survivor key', () => {
    const bundle = ONE_BODY_SHORT_TEMPLATE.supportBundle ?? [];
    const survivor = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'survivor');
    expect(survivor).toBeDefined();
    expect(survivor?.kind === 'actor' && survivor.persistence).toBe('must-persist');
    expect(survivor?.kind === 'actor' && survivor.delivery).toBe('lazy-materialize-on-trigger');
  });

  it('resolves the traitVariant for trait.core.core_warmth.virtue', () => {
    const variant = ONE_BODY_SHORT_TEMPLATE.traitVariants?.find(
      (v) => v.traitId === 'trait.core.core_warmth.virtue',
    );
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
    expect(variant?.addNudgeIds).toEqual(['short.who_they_are']);
  });
});

describe('One Body Short — the consequence draw', () => {
  it('records the drawn hand and swap that check:encounter recomputes', () => {
    expect(ONE_BODY_SHORT_TEMPLATE.consequenceDraw).toEqual(['secret', 'omen']);
    expect(ONE_BODY_SHORT_TEMPLATE.consequenceSwap?.from).toBe('thread');
    expect(ONE_BODY_SHORT_TEMPLATE.consequenceSwap?.to).toBe('omen');
    expect(ONE_BODY_SHORT_TEMPLATE.consequenceSwap?.reason?.trim().length).toBeGreaterThan(0);
  });

  it('drew thread pre-swap, per the template id + reach + rarityTier', () => {
    const drawn = drawnHandForTemplate(ONE_BODY_SHORT_TEMPLATE);
    expect(drawn).toContain('thread');
  });

  it('clears checkConsequenceDraw with zero violations', () => {
    // Mirrors how checkCompositionContract derives `wired` — the effects walk
    // plus the rewardPool flag — so this test exercises the same gate
    // check:encounter runs, not a hand-rolled substitute.
    const step = ONE_BODY_SHORT_TEMPLATE.steps[0] as ActionStep;
    const effects = [
      ...(step.successMetadata?.effects ?? []),
      ...(step.failureMetadata?.effects ?? []),
      ...(ONE_BODY_SHORT_TEMPLATE.aftermathConfig?.fallback.reactions ?? []).flatMap((r) => r.effects),
      ...Object.values(ONE_BODY_SHORT_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {}).flatMap(
        (band) => band?.reactions?.flatMap((r) => r.effects) ?? [],
      ),
    ];
    const hasRewardPool = Boolean(step.successMetadata?.rewardPool);
    const wired = familiesWiredByEffects(effects, hasRewardPool);
    const violations = checkConsequenceDraw(ONE_BODY_SHORT_TEMPLATE, wired);
    expect(violations).toEqual([]);
  });
});

describe('One Body Short — no gendered pronoun', () => {
  it('never genders the survivor in any authored prose field', () => {
    const pronounPattern = /\b(he|him|his|she|her|hers)\b/i;
    const strings: string[] = [];

    strings.push(
      ...Object.values(ONE_BODY_SHORT_TEMPLATE.openings ?? {}),
      step0.narrativeTemplate ?? '',
      step0.successAfterimage ?? '',
      step0.failureAfterimage ?? '',
      step0.successAtCostAfterimage ?? '',
      step0.criticalSuccessAfterimage ?? '',
      step0.criticalFailureAfterimage ?? '',
      ONE_BODY_SHORT_TEMPLATE.narrativeTemplates?.initiation ?? '',
      ONE_BODY_SHORT_TEMPLATE.narrativeTemplates?.success ?? '',
      ONE_BODY_SHORT_TEMPLATE.narrativeTemplates?.failure ?? '',
      ONE_BODY_SHORT_TEMPLATE.description ?? '',
    );

    for (const nudge of hand) {
      strings.push(nudge.name, nudge.effectLine, nudge.fiction);
      strings.push(...Object.values(nudge.bandProse ?? {}));
    }

    const fallback = ONE_BODY_SHORT_TEMPLATE.aftermathConfig?.fallback;
    if (fallback) {
      strings.push(fallback.overview);
      for (const reaction of fallback.reactions ?? []) {
        strings.push(reaction.label, reaction.intent ?? '');
      }
      for (const band of Object.values(fallback.byOutcome ?? {})) {
        if (!band) continue;
        strings.push(band.overview ?? '');
        for (const change of band.changes ?? []) {
          strings.push(change.title, change.detail);
        }
        for (const reaction of band.reactions ?? []) {
          strings.push(reaction.label, reaction.intent ?? '');
        }
      }
    }

    for (const s of strings) {
      expect(pronounPattern.test(s), `found a gendered pronoun in: "${s}"`).toBe(false);
    }
  });
});

describe('One Body Short — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(ONE_BODY_SHORT_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
