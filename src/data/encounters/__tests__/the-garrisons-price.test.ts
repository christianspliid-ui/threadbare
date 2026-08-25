/**
 * Tests for The Garrison's Price — a two-step `gold` -> `shadow` test.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: two plain ActionSteps, no branch node
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - Each step's hand: 4-8 cards, >=4 distinct spheres, >=1 ungated common
 *   option, <=1 rider, no digit/`%` in any effectLine, all six StepOutcome
 *   bands covered, every card carries a failure-band fragment
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member; the
 *   Side-bet and Favor-call one-offs are asserted as intentionally absent
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - `checkNudgeHand` / `checkCompositionContract` report zero violations
 * - The two zero-essence Bargains carry a real `doomDelta` cost channel
 * - The recorded consequence swap (`thread` -> `drive`) clears the `draw`
 *   block
 * - The package-critic fix list (the-garrisons-price-package.md § 5):
 *   1. the failure-side `reputation_with` delta is -0.15 (not -0.06) on
 *      BOTH steps' `failureMetadata`
 *   2. `gp.quartermaster_cooled`'s `stateNoun.text` reads "the
 *      quartermaster's regard", not "trust with the quartermaster" — the
 *      failure `bond_change` carries no `trustDelta`
 * - A reachability assertion: every chip's backing write lives on a step
 *   that runs on the band that chip renders on, including the step-1
 *   `fail_action` short-circuit path (the defect class this batch was
 *   convened to correct).
 */

import { describe, it, expect } from 'vitest';
import { THE_GARRISONS_PRICE_TEMPLATE } from '../the-garrisons-price';
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

const step1 = THE_GARRISONS_PRICE_TEMPLATE.steps[0] as ActionStep;
const step2 = THE_GARRISONS_PRICE_TEMPLATE.steps[1] as ActionStep;
const hand1 = step1.nudges ?? [];
const hand2 = step2.nudges ?? [];

describe("The Garrison's Price — template structure", () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.the_garrisons_price');
    expect(found).toBeDefined();
    expect(found?.name).toBe("The Garrison's Price");
  });

  it('carries the required template metadata', () => {
    expect(THE_GARRISONS_PRICE_TEMPLATE.id).toBe('encounter.border.the_garrisons_price');
    // template.reach is what checkConsequenceDraw / drawConsequenceHand read
    // (not any step's own reach) — the recorded consequenceDraw was drawn
    // and verified live at --reach gold --rarity 2.
    expect(THE_GARRISONS_PRICE_TEMPLATE.reach).toBe('gold');
    expect(THE_GARRISONS_PRICE_TEMPLATE.rarityTier).toBe(2);
    expect(THE_GARRISONS_PRICE_TEMPLATE.intrinsicTier).toBe('background');
    expect(THE_GARRISONS_PRICE_TEMPLATE.crudType).toBe('update');
    expect(THE_GARRISONS_PRICE_TEMPLATE.scale).toBe('local');
    expect(THE_GARRISONS_PRICE_TEMPLATE.apCost).toBe(1);
    expect(THE_GARRISONS_PRICE_TEMPLATE.consequenceDraw).toEqual(['relationship', 'drive']);
    expect(THE_GARRISONS_PRICE_TEMPLATE.consequenceSwap).toEqual({
      from: 'thread',
      to: 'drive',
      reason: expect.any(String),
    });
  });

  it('has exactly two steps, both plain ActionSteps (no branch node)', () => {
    expect(THE_GARRISONS_PRICE_TEMPLATE.steps).toHaveLength(2);
    expect(isActionStepBranch(THE_GARRISONS_PRICE_TEMPLATE.steps[0])).toBe(false);
    expect(isActionStepBranch(THE_GARRISONS_PRICE_TEMPLATE.steps[1])).toBe(false);
  });

  it('step 1 (gold) ends the action on a failed negotiation', () => {
    expect(step1.reach).toBe('gold');
    expect(step1.difficulty).toBe(0.4);
    expect(step1.purposeLine).toBe('Settle the price');
    expect(step1.failBehavior).toBe('fail_action');
    expect(step1.narrativeTemplate).toBeTruthy();
  });

  it('step 2 (shadow) is the final step and ends the action on failure', () => {
    expect(step2.reach).toBe('shadow');
    expect(step2.difficulty).toBe(0.38);
    expect(step2.purposeLine).toBe('Get out from under');
    expect(step2.failBehavior).toBe('fail_action');
    expect(step2.narrativeTemplate).toBeTruthy();
  });

  it('step 2 carries carryoverFactorLines only for the four bands step 1 can hand it', () => {
    const lines = step2.carryoverFactorLines ?? {};
    const reachableBands: readonly StepOutcome[] = ['critical_success', 'success', 'success_at_cost', 'near_miss'];
    for (const band of reachableBands) {
      const line = lines[band];
      expect(line, `carryoverFactorLines should cover band "${band}"`).toBeDefined();
      expect(line?.text).toBeTruthy();
      expect(['for', 'against']).toContain(line?.polarity);
    }
    // failure / critical_failure are deliberately absent: step 1's
    // fail_action ends the encounter there, so step 2 never receives them.
    expect(lines.failure).toBeUndefined();
    expect(lines.critical_failure).toBeUndefined();
  });

  it('step 1 declares no carryoverFactorLines (first step, no prior outcome)', () => {
    expect(step1.carryoverFactorLines).toBeUndefined();
  });
});

describe("The Garrison's Price — setting envelope", () => {
  it('declares the four classes and an opening for each', () => {
    expect(THE_GARRISONS_PRICE_TEMPLATE.settings).toEqual(['stronghold', 'ruin', 'wayside', 'battlefield']);
    for (const cls of THE_GARRISONS_PRICE_TEMPLATE.settings ?? []) {
      expect(THE_GARRISONS_PRICE_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(THE_GARRISONS_PRICE_TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = THE_GARRISONS_PRICE_TEMPLATE.locationSubtypes ?? [];
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
  ['step 1 (gold, "Hear the terms")', hand1],
  ['step 2 (shadow, "Get out from under")', hand2],
])("The Garrison's Price — the hand: %s", (_label, hand) => {
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

describe("The Garrison's Price — checkNudgeHand", () => {
  it('passes with zero violations', () => {
    const violations = checkNudgeHand(THE_GARRISONS_PRICE_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe("The Garrison's Price — library liveness", () => {
  it('every libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of [...hand1, ...hand2]) {
      if (nudge.libraryCardId === undefined) continue;
      const member = nudgeCardMember(nudge.libraryCardId);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('the Side-bet and the Favor call are intentionally recorded one-offs with no libraryCardId', () => {
    // `side_bet` has zero members in NUDGE_CARD_LIBRARY, and the *call*
    // variant of Favor has none either (both existing Favor members are
    // mint-side) — confirmed live in the design packet's § 12 / § 6 of the
    // systems audit — so both ship as one-offs, not an oversight.
    const sideBet = hand1.find((n) => n.id === 'gp.worth_keeping');
    const favorCall = hand2.find((n) => n.id === 'gp.a_turn_called_in');
    expect(sideBet).toBeDefined();
    expect(sideBet?.libraryCardId).toBeUndefined();
    expect(favorCall).toBeDefined();
    expect(favorCall?.libraryCardId).toBeUndefined();
    expect(favorCall?.requiresFavor).toBe(true);
  });

  it('every imageTag resolves to a real ENCOUNTER_IMAGE_LIBRARY row', () => {
    const imageIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    for (const nudge of [...hand1, ...hand2]) {
      expect(nudge.imageTag).toBeDefined();
      expect(imageIds.has(nudge.imageTag as string), `imageTag "${nudge.imageTag}" on nudge "${nudge.id}"`).toBe(
        true,
      );
    }
  });

  it('the two zero-essence Bargains carry a real doomDelta cost channel', () => {
    const bargains = [...hand1, ...hand2].filter((n) => n.libraryCardId === 'card.bargain.signature.entropy');
    expect(bargains).toHaveLength(2);
    for (const bargain of bargains) {
      expect(bargain.essenceCost).toBe(0);
      expect(bargain.costs?.doomDelta).toBeGreaterThan(0);
    }
  });
});

describe("The Garrison's Price — cast and trait hook", () => {
  it('resolves the support bundle actor at the officer key', () => {
    const bundle = THE_GARRISONS_PRICE_TEMPLATE.supportBundle ?? [];
    const officer = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'officer');
    expect(officer).toBeDefined();
    expect(officer?.kind === 'actor' && officer.persistence).toBe('must-persist');
    expect(officer?.kind === 'actor' && officer.delivery).toBe('lazy-materialize-on-trigger');
    expect(officer?.kind === 'actor' && officer.factionDefId).toBe('mercenary_company');
  });

  it('resolves the traitVariant for trait.core.core_hope.vice', () => {
    const variant = THE_GARRISONS_PRICE_TEMPLATE.traitVariants?.find((v) => v.traitId === 'trait.core.core_hope.vice');
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
  });
});

describe("The Garrison's Price — aftermath", () => {
  const byOutcome = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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
    expect(THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('every declared change carries non-empty concepts', () => {
    for (const band of Object.values(byOutcome ?? {})) {
      for (const change of band?.changes ?? []) {
        expect(change.concepts?.length ?? 0, `change "${change.id}" should declare concepts`).toBeGreaterThan(0);
      }
    }
  });

  it('the fallback reactions are declared, and the failure bands override them', () => {
    const reactions = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.reactions ?? [];
    expect(reactions.map((r) => r.id)).toEqual(['gp.keep_the_line', 'gp.let_the_road_hear']);

    expect(byOutcome?.critical_success?.reactions).toBeUndefined();
    expect(byOutcome?.success?.reactions).toBeUndefined();
    expect(byOutcome?.success_at_cost?.reactions).toBeUndefined();

    expect((byOutcome?.failure?.reactions ?? []).map((r) => r.id)).toEqual([
      'gp.let_the_mark_stand',
      'gp.shave_it_on_the_road',
    ]);
    expect((byOutcome?.critical_failure?.reactions ?? []).map((r) => r.id)).toEqual([
      'gp.let_the_day_stand',
      'gp.walk_it_off',
    ]);
  });

  it('gp.walk_it_off is never a pure no-op — the bond move rides alongside the condition removal', () => {
    const reaction = (byOutcome?.critical_failure?.reactions ?? []).find((r) => r.id === 'gp.walk_it_off');
    expect(reaction).toBeDefined();
    expect(reaction?.effects.some((e) => e.kind === 'remove_condition')).toBe(true);
    expect(reaction?.effects.some((e) => e.kind === 'bond_change')).toBe(true);
  });
});

describe("The Garrison's Price — package-critic fix list", () => {
  it('fix #1: the failure-side reputation_with delta is -0.15 (not -0.06) on BOTH steps’ failureMetadata', () => {
    const step1RepEffect = (step1.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'reputation_with' && e.targetFactionId === 'mercenary_company',
    );
    const step2RepEffect = (step2.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'reputation_with' && e.targetFactionId === 'mercenary_company',
    );
    expect(step1RepEffect, 'step 1 failureMetadata should carry the reputation_with write').toBeDefined();
    expect(step2RepEffect, 'step 2 failureMetadata should carry the reputation_with write').toBeDefined();
    expect(step1RepEffect?.kind === 'reputation_with' && step1RepEffect.delta).toBe(-0.15);
    expect(step2RepEffect?.kind === 'reputation_with' && step2RepEffect.delta).toBe(-0.15);
    // -0.15 is the magnitude that actually crosses a REPUTATION_WORDS band
    // (0.5 -> 0.35, Accepted -> Unknown); -0.06 would render no visible
    // change, which is the defect this fix corrects.
    expect(step1RepEffect?.kind === 'reputation_with' && step1RepEffect.delta).not.toBe(-0.06);
    expect(step2RepEffect?.kind === 'reputation_with' && step2RepEffect.delta).not.toBe(-0.06);
  });

  it('the success-side reputation_with gain is left exactly as authored at +0.10', () => {
    const gainEffect = (step2.successMetadata?.effects ?? []).find(
      (e) => e.kind === 'reputation_with' && e.targetFactionId === 'mercenary_company',
    );
    expect(gainEffect?.kind === 'reputation_with' && gainEffect.delta).toBe(0.1);
  });

  it('fix #2: gp.quartermaster_cooled’s stateNoun reads "the quartermaster’s regard", and the failure bond_change carries no trustDelta', () => {
    const failureChip = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome?.failure?.changes?.find(
      (c) => c.id === 'gp.quartermaster_cooled',
    );
    expect(failureChip).toBeDefined();
    expect(failureChip?.stateNoun?.text).toBe("the quartermaster's regard");
    expect(failureChip?.stateNoun?.text).not.toBe('trust with the quartermaster');

    const step1BondEffect = (step1.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'bond_change' && e.withAgentId === '$cast:officer',
    );
    const step2BondEffect = (step2.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'bond_change' && e.withAgentId === '$cast:officer',
    );
    expect(step1BondEffect?.kind === 'bond_change' && step1BondEffect.trustDelta).toBeUndefined();
    expect(step2BondEffect?.kind === 'bond_change' && step2BondEffect.trustDelta).toBeUndefined();
  });

  it('the boon-side quartermaster chip keeps its "trust" state noun, matching a write that moves both sentiment and trust', () => {
    const boonChip = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome?.success?.changes?.find(
      (c) => c.id === 'gp.quartermaster_bond',
    );
    expect(boonChip?.stateNoun?.text).toBe('trust with the quartermaster');

    const step2SuccessBondEffect = (step2.successMetadata?.effects ?? []).find(
      (e) => e.kind === 'bond_change' && e.withAgentId === '$cast:officer',
    );
    expect(step2SuccessBondEffect?.kind === 'bond_change' && step2SuccessBondEffect.trustDelta).toBe(0.15);
  });

  it('no removeAll on gp.walk_it_off’s remove_condition (the condition is single-minted per run)', () => {
    const reaction = (byOutcomeReactions('critical_failure') ?? []).find((r) => r.id === 'gp.walk_it_off');
    const removeEffect = reaction?.effects.find((e) => e.kind === 'remove_condition');
    expect(removeEffect?.kind === 'remove_condition' && removeEffect.removeAll).toBeUndefined();
  });

  it('condition_attachment for trait.condition.exhausted is authored only on step 2, and carries no chip', () => {
    const step1Effects = step1.failureMetadata?.effects ?? [];
    const step2Effects = step2.failureMetadata?.effects ?? [];
    expect(step1Effects.some((e) => e.kind === 'condition_attachment')).toBe(false);
    expect(step2Effects.some((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.exhausted')).toBe(
      true,
    );

    const byOutcome = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    for (const [band, override] of Object.entries(byOutcome)) {
      const ids = (override?.changes ?? []).map((c) => c.id);
      expect(ids.some((id) => /exhaust/i.test(id)), `band "${band}" should not chip the exhaustion write`).toBe(false);
    }
  });

  function byOutcomeReactions(band: 'failure' | 'critical_failure') {
    return THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome?.[band]?.reactions;
  }
});

describe("The Garrison's Price — reachability (every chip's backing write reaches its band)", () => {
  const byOutcome = THE_GARRISONS_PRICE_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};

  it('critical_success and success chips are backed by step 2’s successMetadata (unreachable without step 2 running)', () => {
    const step2SuccessEffects = step2.successMetadata?.effects ?? [];
    expect(step2SuccessEffects.some((e) => e.kind === 'reputation_with' && e.delta === 0.1)).toBe(true);
    expect(step2SuccessEffects.some((e) => e.kind === 'bond_change')).toBe(true);

    // gp.company_standing renders on critical_success and success_at_cost;
    // gp.quartermaster_bond renders on critical_success and success. Both
    // require step 2 to have resolved success-side to exist at all.
    expect((byOutcome.critical_success?.changes ?? []).map((c) => c.id).sort()).toEqual(
      ['gp.company_standing', 'gp.quartermaster_bond'].sort(),
    );
    expect((byOutcome.success?.changes ?? []).map((c) => c.id)).toEqual(['gp.quartermaster_bond']);
    expect((byOutcome.success_at_cost?.changes ?? []).map((c) => c.id)).toEqual(['gp.company_standing']);
  });

  it('failure and critical_failure chips are backed on BOTH the step-1-only path and the step-1-then-step-2-fails path', () => {
    const expectedIds = ['gp.company_standing_lost', 'gp.quartermaster_cooled', 'gp.the_figure_follows'].sort();
    expect((byOutcome.failure?.changes ?? []).map((c) => c.id).sort()).toEqual(expectedIds);
    expect((byOutcome.critical_failure?.changes ?? []).map((c) => c.id).sort()).toEqual(expectedIds);

    // Path (a): step 1 alone fails/crit-fails -> action resolves there
    // (fail_action) -> step 2 never runs -> only step 1's failureMetadata
    // can back these chips on that path.
    const step1Kinds = (step1.failureMetadata?.effects ?? []).map((e) => e.kind);
    expect(step1Kinds).toEqual(expect.arrayContaining(['reputation_with', 'bond_change', 'plant_compulsion']));

    // Path (b): step 1 succeeds -> step 2 fails/crit-fails -> step 2's
    // failureMetadata backs the same three chips on that path.
    const step2Kinds = (step2.failureMetadata?.effects ?? []).map((e) => e.kind);
    expect(step2Kinds).toEqual(expect.arrayContaining(['reputation_with', 'bond_change', 'plant_compulsion']));
  });

  it('failure and critical_failure carry identical chip sets — byOutcome keys on the action band, not on which step broke', () => {
    const failureIds = (byOutcome.failure?.changes ?? []).map((c) => c.id).sort();
    const criticalFailureIds = (byOutcome.critical_failure?.changes ?? []).map((c) => c.id).sort();
    expect(failureIds).toEqual(criticalFailureIds);
  });
});

describe("The Garrison's Price — Composition Contract", () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(THE_GARRISONS_PRICE_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
