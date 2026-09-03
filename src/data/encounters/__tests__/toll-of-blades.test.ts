/**
 * Tests for The Toll of Blades — a two-step `iron` -> `stone` test.
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: two plain ActionSteps, no branch node
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - Each step's hand: 4-8 cards, >=4 distinct spheres, >=1 ungated common
 *   option, <=1 rider, no digit/`%` in any effectLine, zero checkNudgeHand
 *   violations
 * - Every `libraryCardId` names a real NUDGE_CARD_LIBRARY member; the two
 *   Fellowship one-offs are asserted as intentionally absent
 * - Every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - All six StepOutcome bands covered per step; every nudge carries at
 *   least one failure-band fragment
 * - `checkCompositionContract` reports zero violations
 * - The package-critic fix list (toll-of-blades-package.md § 4): the folded
 *   BOON standing chip is gone from both success-side bands it used to
 *   share with the membership join; the moved PATH membership chip now
 *   covers `success`; the folded SCAR-wound chip is gone from
 *   `critical_failure`; the SCAR-standing chip's backing write is
 *   duplicated onto step 1 and raised to -0.15 so it is reachable on every
 *   path to `critical_failure` — the defect class (a chip backed only by a
 *   step that can be skipped) that nearly shipped twice in this batch.
 */

import { describe, it, expect } from 'vitest';
import { TOLL_OF_BLADES_TEMPLATE } from '../toll-of-blades';
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

const step1 = TOLL_OF_BLADES_TEMPLATE.steps[0] as ActionStep;
const step2 = TOLL_OF_BLADES_TEMPLATE.steps[1] as ActionStep;
const hand1 = step1.nudges ?? [];
const hand2 = step2.nudges ?? [];

describe('The Toll of Blades — template structure', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.toll_of_blades');
    expect(found).toBeDefined();
    expect(found?.name).toBe('The Toll of Blades');
  });

  it('carries the required template metadata', () => {
    expect(TOLL_OF_BLADES_TEMPLATE.id).toBe('encounter.border.toll_of_blades');
    // template.reach is what checkConsequenceDraw / drawConsequenceHand read
    // (not any step's own reach) — the recorded consequenceDraw was drawn
    // and verified live at --reach iron (systems.md § 10).
    expect(TOLL_OF_BLADES_TEMPLATE.reach).toBe('iron');
    expect(TOLL_OF_BLADES_TEMPLATE.rarityTier).toBe(1);
    expect(TOLL_OF_BLADES_TEMPLATE.intrinsicTier).toBe('background');
    expect(TOLL_OF_BLADES_TEMPLATE.crudType).toBe('update');
    expect(TOLL_OF_BLADES_TEMPLATE.scale).toBe('local');
    expect(TOLL_OF_BLADES_TEMPLATE.apCost).toBe(1);
    expect(TOLL_OF_BLADES_TEMPLATE.consequenceDraw).toEqual(['secret', 'membership']);
    expect(TOLL_OF_BLADES_TEMPLATE.consequenceSwap).toBeUndefined();
  });

  it('has exactly two steps, both plain ActionSteps (no branch node)', () => {
    expect(TOLL_OF_BLADES_TEMPLATE.steps).toHaveLength(2);
    expect(isActionStepBranch(TOLL_OF_BLADES_TEMPLATE.steps[0])).toBe(false);
    expect(isActionStepBranch(TOLL_OF_BLADES_TEMPLATE.steps[1])).toBe(false);
  });

  it('step 1 (iron) is authored to survive a plain failure', () => {
    expect(step1.reach).toBe('iron');
    expect(step1.difficulty).toBe(0.36);
    expect(step1.purposeLine).toBe('Hold the road');
    expect(step1.failBehavior).toBe('continue_weakened');
    expect(step1.narrativeTemplate).toBeTruthy();
  });

  it('step 2 (stone) is the final step and ends the action on failure', () => {
    expect(step2.reach).toBe('stone');
    expect(step2.difficulty).toBe(0.42);
    expect(step2.purposeLine).toBe('Outlast the column');
    expect(step2.failBehavior).toBe('fail_action');
    expect(step2.narrativeTemplate).toBeTruthy();
  });

  it('step 2 carries a carryoverFactorLine for every StepOutcome band step 1 can roll', () => {
    const lines = step2.carryoverFactorLines ?? {};
    for (const band of ALL_BAND_OUTCOMES) {
      const line = lines[band];
      expect(line, `carryoverFactorLines should cover band "${band}"`).toBeDefined();
      expect(line?.text).toBeTruthy();
      expect(['for', 'against']).toContain(line?.polarity);
    }
  });

  it('step 1 declares no carryoverFactorLines (first step, no prior outcome)', () => {
    expect(step1.carryoverFactorLines).toBeUndefined();
  });
});

describe('The Toll of Blades — setting envelope', () => {
  it('declares the four classes and an opening for each', () => {
    expect(TOLL_OF_BLADES_TEMPLATE.settings).toEqual(['stronghold', 'ruin', 'wayside', 'battlefield']);
    for (const cls of TOLL_OF_BLADES_TEMPLATE.settings ?? []) {
      expect(TOLL_OF_BLADES_TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(TOLL_OF_BLADES_TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = TOLL_OF_BLADES_TEMPLATE.locationSubtypes ?? [];
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
  ['step 1 (iron, "Hold the road")', hand1],
  ['step 2 (stone, "Outlast the column")', hand2],
])('The Toll of Blades — the hand: %s', (_label, hand) => {
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

describe('The Toll of Blades — checkNudgeHand', () => {
  it('passes with zero violations', () => {
    const violations = checkNudgeHand(TOLL_OF_BLADES_TEMPLATE);
    expect(violations).toEqual([]);
  });
});

describe('The Toll of Blades — library liveness', () => {
  it('every libraryCardId names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of [...hand1, ...hand2]) {
      if (nudge.libraryCardId === undefined) continue;
      const member = nudgeCardMember(nudge.libraryCardId);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('the two Fellowship cards are intentionally recorded one-offs with no libraryCardId', () => {
    // `fellowship` has zero members in NUDGE_CARD_LIBRARY (confirmed live
    // against UNIVERSAL_CORE_TYPES / SPHERE_SIGNATURES / HUNGER_UNIQUE_CARDS /
    // VARIATION_MEMBERS in the design packet's § 5) — both Fellowship cards
    // ship as one-offs, not an oversight.
    const shoulderToShoulder = hand1.find((n) => n.id === 'toll.shoulder_to_shoulder');
    const sharedWatch = hand2.find((n) => n.id === 'toll.shared_watch');
    expect(shoulderToShoulder).toBeDefined();
    expect(shoulderToShoulder?.libraryCardId).toBeUndefined();
    expect(sharedWatch).toBeDefined();
    expect(sharedWatch?.libraryCardId).toBeUndefined();
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
});

describe('The Toll of Blades — cast and trait hook', () => {
  it('resolves the support bundle actor at the serjeant key', () => {
    const bundle = TOLL_OF_BLADES_TEMPLATE.supportBundle ?? [];
    const serjeant = bundle.find((spec) => spec.kind === 'actor' && spec.key === 'serjeant');
    expect(serjeant).toBeDefined();
    expect(serjeant?.kind === 'actor' && serjeant.persistence).toBe('must-persist');
    expect(serjeant?.kind === 'actor' && serjeant.delivery).toBe('lazy-materialize-on-trigger');
    expect(serjeant?.kind === 'actor' && serjeant.factionDefId).toBe('mercenary_company');
  });

  it('resolves the traitVariant for trait.core.core_humility.vice', () => {
    const variant = TOLL_OF_BLADES_TEMPLATE.traitVariants?.find((v) => v.traitId === 'trait.core.core_humility.vice');
    expect(variant).toBeDefined();
    expect(variant?.factorLine).toBeTruthy();
  });
});

describe('The Toll of Blades — aftermath', () => {
  const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome;

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
    expect(TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.changes).toEqual([]);
  });

  it('every declared change carries non-empty concepts', () => {
    for (const band of Object.values(byOutcome ?? {})) {
      for (const change of band?.changes ?? []) {
        expect(change.concepts?.length ?? 0, `change "${change.id}" should declare concepts`).toBeGreaterThan(0);
      }
    }
  });

  it('both fallback reactions are declared, and no band overrides them', () => {
    const reactions = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.reactions ?? [];
    expect(reactions.map((r) => r.id)).toEqual(['toll.let_them_rest', 'toll.let_the_story_travel']);
    for (const [band, override] of Object.entries(byOutcome ?? {})) {
      expect(override?.reactions, `band "${band}" should not override reactions`).toBeUndefined();
    }
  });
});

describe('The Toll of Blades — package-critic fix list', () => {
  it('fix #1: the BOON standing chip is folded from every band (the join masks the edge read)', () => {
    const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    for (const [band, override] of Object.entries(byOutcome)) {
      const ids = (override?.changes ?? []).map((c) => c.id);
      expect(ids, `band "${band}" should not carry the folded standing-gain chip`).not.toContain(
        'toll.the_company_noticed',
      );
    }
  });

  it('fix #2: the PATH membership chip covers both critical_success and success, each with its own backing write reachable', () => {
    const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    const criticalSuccessIds = (byOutcome.critical_success?.changes ?? []).map((c) => c.id);
    const successIds = (byOutcome.success?.changes ?? []).map((c) => c.id);
    expect(criticalSuccessIds).toContain('toll.on_the_rolls');
    expect(successIds).toContain('toll.on_the_rolls');

    // Both bands require step 2 to have run success-side, which is the sole
    // source of the membership_change write this chip reports.
    const successEffects = step2.successMetadata?.effects ?? [];
    expect(successEffects.some((e) => e.kind === 'membership_change' && e.op === 'join')).toBe(true);

    // The two instances carry band-appropriate text (not byte-identical).
    const criticalSuccessChip = byOutcome.critical_success?.changes?.find((c) => c.id === 'toll.on_the_rolls');
    const successChip = byOutcome.success?.changes?.find((c) => c.id === 'toll.on_the_rolls');
    expect(criticalSuccessChip?.causeClause).not.toBe(successChip?.causeClause);
  });

  it('fix #3: the SCAR-wound chip is folded from critical_failure (its only backing write can be skipped) and stays on failure', () => {
    const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    const failureIds = (byOutcome.failure?.changes ?? []).map((c) => c.id);
    const criticalFailureIds = (byOutcome.critical_failure?.changes ?? []).map((c) => c.id);
    expect(failureIds).toContain('toll.what_the_column_left');
    expect(criticalFailureIds).not.toContain('toll.what_the_column_left');

    // Confirm the mechanism this fold is protecting against: the wound's only
    // backing write lives on step 2's failureMetadata, and step 1's own
    // failBehavior means step 2 does not always run on the path to
    // critical_failure.
    const step2FailureEffects = step2.failureMetadata?.effects ?? [];
    const step1FailureEffects = step1.failureMetadata?.effects ?? [];
    expect(step2FailureEffects.some((e) => e.kind === 'apply_condition' && e.conditionTraitId === 'trait.condition.wounded')).toBe(
      true,
    );
    expect(
      step1FailureEffects.some((e) => e.kind === 'apply_condition' && e.conditionTraitId === 'trait.condition.wounded'),
    ).toBe(false);
    expect(step1.failBehavior).toBe('continue_weakened');
  });

  it('fix #4: the SCAR-standing chip on critical_failure is backed on every path — its write is duplicated on step 1 and raised to -0.15', () => {
    const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    const criticalFailureIds = (byOutcome.critical_failure?.changes ?? []).map((c) => c.id);
    expect(criticalFailureIds).toContain('toll.an_easy_row');

    // Reachability: the chip must be backed whether step 1 alone critically
    // fails (step 2 never runs, "path a") or step 1 continues and step 2
    // critically fails ("path b") — so the write must exist on BOTH steps'
    // failureMetadata, at the same magnitude.
    const step1RepEffect = (step1.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'reputation_with' && e.targetFactionId === 'mercenary_company',
    );
    const step2RepEffect = (step2.failureMetadata?.effects ?? []).find(
      (e) => e.kind === 'reputation_with' && e.targetFactionId === 'mercenary_company',
    );
    expect(step1RepEffect, 'step 1 failureMetadata should carry the duplicated reputation_with write').toBeDefined();
    expect(step2RepEffect, 'step 2 failureMetadata should carry the reputation_with write').toBeDefined();
    expect(step1RepEffect?.kind === 'reputation_with' && step1RepEffect.delta).toBe(-0.15);
    expect(step2RepEffect?.kind === 'reputation_with' && step2RepEffect.delta).toBe(-0.15);

    // -0.15 is the magnitude that actually crosses a REPUTATION_WORDS band
    // (0.5 -> 0.35, Accepted -> Unknown); -0.10 would render no visible
    // change, which is the defect this fix corrects.
    expect(step1RepEffect?.kind === 'reputation_with' && step1RepEffect.delta).not.toBe(-0.1);
  });

  it('fix #5: the critical_failure overview does not presuppose step 2 ever ran (no herd reference)', () => {
    const overview = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome?.critical_failure?.overview ?? '';
    expect(overview).toBeTruthy();
    expect(overview.toLowerCase()).not.toMatch(/herd/);
    // Pack theft is retained — the design block licenses it on this band alone.
    expect(overview).toMatch(/mud/i);
  });

  it('the downstream chip ledger matches the fix list exactly: 5 bands, 5 chips', () => {
    const byOutcome = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome ?? {};
    expect((byOutcome.critical_success?.changes ?? []).map((c) => c.id).sort()).toEqual(
      ['toll.iron_tested', 'toll.on_the_rolls'].sort(),
    );
    expect((byOutcome.success?.changes ?? []).map((c) => c.id)).toEqual(['toll.on_the_rolls']);
    expect((byOutcome.success_at_cost?.changes ?? []).map((c) => c.id)).toEqual(['toll.the_serjeants_debt']);
    expect((byOutcome.failure?.changes ?? []).map((c) => c.id)).toEqual(['toll.what_the_column_left']);
    expect((byOutcome.critical_failure?.changes ?? []).map((c) => c.id)).toEqual(['toll.an_easy_row']);
  });

  it('the capability growth chip is not folded (real write, every path) and carries the corrected bearer anchor', () => {
    const growthChip = TOLL_OF_BLADES_TEMPLATE.aftermathConfig?.fallback.byOutcome?.critical_success?.changes?.find(
      (c) => c.id === 'toll.iron_tested',
    );
    expect(growthChip).toBeDefined();
    const concept = growthChip?.concepts?.find((c) => c.tooltipId === 'reach.iron');
    expect(concept?.entityId).toBe('$actor');
  });
});

describe('The Toll of Blades — Composition Contract', () => {
  it('reports zero violations', () => {
    const report = checkCompositionContract(TOLL_OF_BLADES_TEMPLATE);
    expect(report.violations).toEqual([]);
  });
});
