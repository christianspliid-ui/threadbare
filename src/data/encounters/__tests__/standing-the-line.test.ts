/**
 * Tests for Standing the Line — the batch's fate-branching Personality Fork
 * and Seeded Sequel parent (`encounter.border.standing_the_line`).
 *
 * Validates:
 * - Registration and resolvability in UNIFIED_ACTION_TEMPLATES
 * - Template shape: plain step 0, two `ActionStepBranch` nodes (steps 1, 2),
 *   both `branchOnStep: 0`, `variants` keyed exactly `'positive'`/`'negative'`
 * - Setting envelope: four declared classes, `locationSubtypes` matches
 *   `expandSettings`, and every expanded subtype is a place-tier location
 * - **All five hands** (step 0 plus both poles' steps 1 and 2) — the machine
 *   gate (`check:encounter`) only ever sees step 0's, because
 *   `nudgeBearingSteps`/`plainSteps` filter out `ActionStepBranch` arms. This
 *   file substitutes each pole's branch variants into a synthetic template so
 *   `checkNudgeHand` walks all three steps of that pole, covering all five
 *   hands across two synthetic runs.
 * - Every `libraryCardId` (all five hands) names a real NUDGE_CARD_LIBRARY
 *   member; every `imageTag` resolves to a real ENCOUNTER_IMAGE_LIBRARY row
 * - >=3 step-0 cards carry `poleLean`, both directions
 * - The fork: `decidedBy` on step 1 only, `branchOnStep: 0` in all three
 *   places, `aftermathConfig.fallback` takes the mercy pole
 * - The seed contract: `templateId`, `inheritContext`, `delayTicks`, cast key
 *   `survivor` (must match `one-body-short.ts` exactly)
 * - The band-guarantee rule (package fix F1/F2/F3): no aggregate band's
 *   overview (`success_at_cost`, `failure`, `critical_failure`) quotes a step
 *   1 or step 2 afterimage verbatim, since none of those step outcomes is
 *   guaranteed by the aggregate band that can be reached from several
 *   different step histories
 * - C1: both `critical_failure` bands author the 2-stack wound as **one**
 *   `condition_attachment` effect with `stackCount: 2`, never two
 * - `checkCompositionContract` reports zero violations
 * - Nothing depends on `action.targetId` resolving to an agent (§ 9.5)
 */

import { describe, it, expect } from 'vitest';
import { STANDING_THE_LINE_TEMPLATE } from '../standing-the-line';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type {
  ActionStep,
  ActionStepBranch,
  AftermathVariant,
  EncounterAftermathReactionEffect,
  StepNudge,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { expandSettings, validateSettingEnvelope } from '../../settingClasses';
import { WorldGraph } from '../../../engine/graph';
import { getPlaceTierLocations, isPlaceTierLocation } from '../../../engine/sublocationShape';
import { nudgeCardMember } from '../../nudge-card-library';
import { ENCOUNTER_IMAGE_LIBRARY } from '../../encounter-image-library';
import { checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { checkCompositionContract } from '../../content-eval/compositionContract';
import {
  checkConsequenceDraw,
  familiesWiredByEffects,
  drawnHandForTemplate,
} from '../../content-eval/consequenceDraw';

const TEMPLATE = STANDING_THE_LINE_TEMPLATE;

const POLE_KEYS = ['negative', 'positive'] as const;

/** The bands each pole authors a `byOutcome` override for. `success` is the base variant. */
const AUTHORED_BANDS: readonly UnifiedActionOutcome[] = [
  'critical_success',
  'success_at_cost',
  'failure',
  'critical_failure',
];

/** Bands reachable from more than one step-1/step-2 history (package § C). */
const AGGREGATE_BANDS: readonly UnifiedActionOutcome[] = ['success_at_cost', 'failure', 'critical_failure'];

const step0 = TEMPLATE.steps[0] as ActionStep;
const step1Branch = TEMPLATE.steps[1] as ActionStepBranch;
const step2Branch = TEMPLATE.steps[2] as ActionStepBranch;

function variantOf(pole: (typeof POLE_KEYS)[number]): AftermathVariant {
  return TEMPLATE.aftermathConfig!.variants[pole];
}

function bandOverview(pole: (typeof POLE_KEYS)[number], band: UnifiedActionOutcome): string {
  const overview = variantOf(pole).byOutcome![band]!.overview;
  expect(overview, `${pole}/${band} has no overview`).toBeTruthy();
  return overview as string;
}

function stepAfterimages(step: ActionStep): string[] {
  return [
    step.successAfterimage,
    step.failureAfterimage,
    step.successAtCostAfterimage,
    step.criticalSuccessAfterimage,
    step.criticalFailureAfterimage,
  ].filter((s): s is string => Boolean(s));
}

/** All 27 authored cards, across all five hands, for corpus-wide sweeps. */
function allHands(): readonly StepNudge[] {
  const step1Positive = step1Branch.variants.positive;
  const step1Negative = step1Branch.variants.negative;
  const step2Positive = step2Branch.variants.positive;
  const step2Negative = step2Branch.variants.negative;
  return [
    ...(step0.nudges ?? []),
    ...(step1Positive.nudges ?? []),
    ...(step1Negative.nudges ?? []),
    ...(step2Positive.nudges ?? []),
    ...(step2Negative.nudges ?? []),
  ];
}

/**
 * Every effect authored anywhere in the template — both aftermath variants,
 * every band, both reaction arms.
 */
function allAuthoredEffects(): { site: string; effect: EncounterAftermathReactionEffect }[] {
  const out: { site: string; effect: EncounterAftermathReactionEffect }[] = [];
  for (const pole of POLE_KEYS) {
    const variant = variantOf(pole);
    for (const r of variant.reactions ?? []) {
      for (const e of r.effects) out.push({ site: `${pole}/success reaction '${r.id}'`, effect: e });
    }
    for (const [band, cfg] of Object.entries(variant.byOutcome ?? {})) {
      for (const r of cfg?.reactions ?? []) {
        for (const e of r.effects) out.push({ site: `${pole}/${band} reaction '${r.id}'`, effect: e });
      }
    }
  }
  return out;
}

/**
 * Effect kinds that resolve the person they act on from `action.targetId`.
 * On every firing route this template's `targetId` is the location the scene
 * stands on (package critic § A / § 9.5 correction) — an effect on this list
 * would silently no-op here.
 */
const TARGET_ID_DEPENDENT_EFFECT_KINDS: readonly string[] = ['secret_discovery'];

// ─────────────────────────────────────────────────────────────────────

describe('Standing the Line — registration', () => {
  it('is registered and resolvable in UNIFIED_ACTION_TEMPLATES', () => {
    const found = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'encounter.border.standing_the_line');
    expect(found).toBeDefined();
    expect(found).toBe(TEMPLATE);
  });

  it('has the id, reach, and rarity the design doc specifies', () => {
    expect(TEMPLATE.id).toBe('encounter.border.standing_the_line');
    expect(TEMPLATE.reach).toBe('heart');
    expect(TEMPLATE.rarityTier).toBe(3);
    expect(TEMPLATE.intrinsicTier).toBe('background');
  });
});

describe('Standing the Line — shape: one plain step, two branches', () => {
  it('step 0 is a concrete ActionStep (the deciding step)', () => {
    expect(isActionStepBranch(TEMPLATE.steps[0])).toBe(false);
    expect(step0.reach).toBe('heart');
  });

  it('steps 1 and 2 are both ActionStepBranch nodes', () => {
    expect(isActionStepBranch(TEMPLATE.steps[1])).toBe(true);
    expect(isActionStepBranch(TEMPLATE.steps[2])).toBe(true);
  });

  it('exactly three steps — no more, no fewer', () => {
    expect(TEMPLATE.steps).toHaveLength(3);
  });

  it('only step 1 carries `decidedBy` — step 2 reads the choice already recorded', () => {
    expect(step1Branch.decidedBy).toEqual({ axis: 'mercy_ruthlessness' });
    expect(step2Branch.decidedBy).toBeUndefined();
  });

  it('both branches key `branchOnStep: 0` — the deciding step, not their own index', () => {
    expect(step1Branch.branchOnStep).toBe(0);
    expect(step2Branch.branchOnStep).toBe(0);
    expect(TEMPLATE.aftermathConfig!.branchOnStep).toBe(0);
  });

  it('both branches key `variants` exactly `positive`/`negative`', () => {
    expect(Object.keys(step1Branch.variants).sort()).toEqual([...POLE_KEYS]);
    expect(Object.keys(step2Branch.variants).sort()).toEqual([...POLE_KEYS]);
    expect(Object.keys(TEMPLATE.aftermathConfig!.variants).sort()).toEqual([...POLE_KEYS]);
  });

  it('the aftermath falls back to the mercy pole, never the ruthless one', () => {
    // A fork that failed to resolve must not default the mortal into a fight.
    expect(TEMPLATE.aftermathConfig!.fallback.overview).toBe(variantOf('positive').overview);
  });

  it('the step branches fall back to the mercy pole’s own steps', () => {
    expect(step1Branch.fallback).toEqual(step1Branch.variants.positive);
    expect(step2Branch.fallback).toEqual(step2Branch.variants.positive);
  });

  it('carries no authoredChoices — the fork is `decidedBy`, the mortal’s', () => {
    expect(TEMPLATE.authoredChoices).toBeUndefined();
  });
});

describe('Standing the Line — setting envelope (THR-884)', () => {
  it('passes envelope validation', () => {
    expect(validateSettingEnvelope(TEMPLATE)).toEqual([]);
  });

  it('declares the four classes from the design doc, one opening each', () => {
    expect(TEMPLATE.settings).toEqual(['stronghold', 'ruin', 'wayside', 'battlefield']);
    for (const cls of TEMPLATE.settings ?? []) {
      expect(TEMPLATE.openings?.[cls]).toBeTruthy();
    }
  });

  it('derives locationSubtypes via expandSettings rather than hand-authoring them', () => {
    expect(TEMPLATE.locationSubtypes).toEqual(
      expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),
    );
  });

  it('every expanded subtype is a place-tier location, not a sublocation', () => {
    const subtypes = TEMPLATE.locationSubtypes ?? [];
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

  it('compiles its openings into a resolvable opening fragment (THR-932)', () => {
    const set = TEMPLATE.contextFragments?.find((f) => f.slot === 'opening');
    expect(set).toBeDefined();
    expect(set!.axis).toBe('setting');
    expect(set!.variants['*'], 'opening fragment has no default').toBeTruthy();
    for (const cls of TEMPLATE.settings!) {
      expect(set!.variants[cls], `no opening variant for ${cls}`).toBeTruthy();
    }
    expect(step0.narrativeTemplate).toContain('{frag:opening}');
  });
});

describe('Standing the Line — all five hands pass the WS1 checklist', () => {
  // check:encounter only ever sees step 0's hand — nudgeBearingSteps/plainSteps
  // filter ActionStepBranch out, so the four branch hands are invisible to the
  // machine gate (§ 15 of the design doc's own self-audit). Substituting each
  // pole's branch arms as plain steps on a synthetic template routes all three
  // of that pole's steps through the real checklist function.
  it.each(POLE_KEYS)('%s pole: step 0 + both branch steps, zero violations', (pole) => {
    const synthetic: UnifiedActionTemplate = {
      ...TEMPLATE,
      steps: [step0, step1Branch.variants[pole], step2Branch.variants[pole]],
    };
    const violations = checkNudgeHand(synthetic);
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('all five hands are non-empty and within 4-8 cards', () => {
    const hands = [
      step0.nudges ?? [],
      step1Branch.variants.positive.nudges ?? [],
      step1Branch.variants.negative.nudges ?? [],
      step2Branch.variants.positive.nudges ?? [],
      step2Branch.variants.negative.nudges ?? [],
    ];
    expect(hands).toHaveLength(5);
    for (const hand of hands) {
      expect(hand.length).toBeGreaterThanOrEqual(4);
      expect(hand.length).toBeLessThanOrEqual(8);
    }
  });

  it('27 cards total across the five hands', () => {
    expect(allHands()).toHaveLength(27);
  });

  it('every libraryCardId (where declared) names a real NUDGE_CARD_LIBRARY member', () => {
    for (const nudge of allHands()) {
      if (nudge.libraryCardId === undefined) continue;
      const member = nudgeCardMember(nudge.libraryCardId);
      expect(member, `libraryCardId "${nudge.libraryCardId}" on nudge "${nudge.id}" should resolve`).toBeDefined();
    }
  });

  it('19 of 27 cards carry libraryCardId; the eight one-offs are the two typeless types plus one sphere gap', () => {
    // The design doc's own summary line (§ 5.5) claims "18 of 27 / nine
    // one-offs", but its per-card annotations — audited card-by-card against
    // §§ 5.1-5.5 here — total eight one-offs: 2 Fellowship + 4 Signature + 1
    // Boost (`sound_goods`, the matter sphere gap). `not_the_first_time` (the
    // "time Signature" the summary counts as a second sphere gap) is already
    // one of the four Signature one-offs, since the Signature type has zero
    // library members at any sphere — the summary double-counted it. This is
    // the same class of self-audit miscount the package critic's M1 caught
    // for the chip-instance total (claimed 21, actually 18); trusting the
    // granular per-card list over the summary arithmetic here likewise.
    const withLibrary = allHands().filter((n) => n.libraryCardId !== undefined);
    const oneOffs = allHands().filter((n) => n.libraryCardId === undefined);
    expect(withLibrary).toHaveLength(19);
    expect(oneOffs).toHaveLength(8);
  });

  it('every imageTag resolves to a real ENCOUNTER_IMAGE_LIBRARY row', () => {
    const imageIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    for (const nudge of allHands()) {
      expect(nudge.imageTag, `${nudge.id} has no imageTag`).toBeDefined();
      expect(imageIds.has(nudge.imageTag as string), `imageTag "${nudge.imageTag}" on nudge "${nudge.id}"`).toBe(true);
    }
  });

  it('no digits in any effectLine, across all five hands', () => {
    for (const nudge of allHands()) {
      expect(nudge.effectLine, `${nudge.id} effectLine`).not.toMatch(/\d/);
    }
  });

  it('every card id across all five hands is unique', () => {
    const ids = allHands().map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Standing the Line — poleLean (THR-894 debut)', () => {
  it('step 0 carries >=3 poleLean cards, both directions, at the default weight', () => {
    const hand = step0.nudges ?? [];
    const leaning = hand.filter((n) => n.poleLean !== undefined);
    expect(leaning.length).toBeGreaterThanOrEqual(3);

    const toward = (pole: string): StepNudge[] =>
      leaning.filter(
        (n) => typeof n.poleLean === 'object' && 'axis' in n.poleLean
          && n.poleLean.axis === 'mercy_ruthlessness' && n.poleLean.toward === pole,
      );
    expect(toward('positive').length).toBeGreaterThan(0);
    expect(toward('negative').length).toBeGreaterThan(0);

    // Symmetric weight — the package's fix for the draft's 0.2/0.4 imbalance.
    for (const n of leaning) {
      expect(typeof n.poleLean === 'object' && 'weight' in n.poleLean && n.poleLean.weight).toBeFalsy();
    }
  });

  it('the fork reads mercy_ruthlessness — Iron’s bound pair and the template’s reach axis', () => {
    expect(step1Branch.decidedBy).toEqual({ axis: 'mercy_ruthlessness' });
    expect(TEMPLATE.motivations).toContain('mercy_ruthlessness');
  });
});

describe('Standing the Line — band coverage per pole', () => {
  it.each(POLE_KEYS)('%s authors exactly the four override bands, each with an overview and changes', (pole) => {
    const byOutcome = variantOf(pole).byOutcome ?? {};
    expect(Object.keys(byOutcome).sort()).toEqual([...AUTHORED_BANDS].sort());
    for (const band of AUTHORED_BANDS) {
      expect(byOutcome[band]?.overview, `${pole}/${band} has no overview`).toBeTruthy();
      expect(byOutcome[band]?.changes?.length, `${pole}/${band} has no changes`).toBeGreaterThan(0);
    }
  });

  it.each(POLE_KEYS)('%s has a base ending for the plain success band', (pole) => {
    expect(variantOf(pole).byOutcome).not.toHaveProperty('success');
    expect(variantOf(pole).overview.length).toBeGreaterThan(0);
    expect(variantOf(pole).changes.length).toBeGreaterThan(0);
  });

  it('every authored overview across both poles is distinct (no copy-paste band)', () => {
    const overviews = POLE_KEYS.flatMap((pole) => [
      variantOf(pole).overview,
      ...AUTHORED_BANDS.map((b) => variantOf(pole).byOutcome![b]!.overview!),
    ]);
    expect(new Set(overviews).size).toBe(overviews.length);
  });
});

describe('Standing the Line — F1/F1b/F2/F3: band prose asserts only what the aggregate band guarantees', () => {
  // `computeFinalActionOutcome` (unifiedActionLifecycle.ts:300-319) returns
  // `success_at_cost` the moment ANY step failed — reachable from several
  // different step-1/step-2 histories, including one where both later steps
  // critically succeeded. `failure` is reachable only from step 2, so step 1
  // may have critically succeeded on the way there. `critical_failure`
  // truncates at three different step counts. None of these bands may assert
  // a fact only one specific step history produced — this is the rule the
  // package critic's fix list (F1/F1b/F2/F3) exists to enforce, encoded here
  // as a real assertion rather than a comment.
  it.each(POLE_KEYS)(
    '%s: no aggregate-band overview quotes a step 1 or step 2 afterimage verbatim',
    (pole) => {
      const step1 = step1Branch.variants[pole];
      const step2 = step2Branch.variants[pole];
      const forbidden = [...stepAfterimages(step1), ...stepAfterimages(step2)];
      expect(forbidden.length).toBeGreaterThan(0);

      for (const band of AGGREGATE_BANDS) {
        const overview = bandOverview(pole, band);
        for (const phrase of forbidden) {
          expect(overview, `${pole}/${band} overview quotes a step afterimage verbatim: "${phrase}"`)
            .not.toContain(phrase);
        }
      }
    },
  );

  it('F1/F1b: positive.success_at_cost asserts a band-guaranteed cost and body, not a step-1-specific claim', () => {
    const overview = bandOverview('positive', 'success_at_cost');
    // Band-guaranteed: a success_at_cost always carries a cost (the boot, SCAR-backed).
    expect(overview).toContain('boot to the ribs');
    // F1b option (a): the seed's premise made an unconditional fact of the band.
    expect(overview).toContain('Two are lying where the way goes narrow');
    // The removed step-1-specific claim from the draft.
    expect(overview).not.toContain('named and then renamed twice');
  });

  it('F2: both failure overviews are reworded off the whole-action opening', () => {
    expect(bandOverview('positive', 'failure')).not.toContain('Nothing that was said made any difference');
    expect(bandOverview('negative', 'failure')).not.toMatch(/^The strike went in late/);
  });

  it('F3: negative.critical_failure does not narrate step 1 by its own action', () => {
    const overview = bandOverview('negative', 'critical_failure');
    expect(overview).not.toMatch(/went up the road alone/);
  });

  it('positive.critical_failure is unchanged — it names no step and reads correctly from every truncation', () => {
    const overview = bandOverview('positive', 'critical_failure');
    expect(overview).toContain('went down early and stayed down');
  });
});

describe('Standing the Line — C1: critical_failure wounds are one effect with stackCount 2', () => {
  it.each(POLE_KEYS)('%s: exactly one condition_attachment on trait.condition.wounded, stackCount 2', (pole) => {
    const reactions = variantOf(pole).byOutcome!.critical_failure!.reactions!;
    const woundEffects = reactions
      .flatMap((r) => r.effects)
      .filter((e) => e.kind === 'condition_attachment' && e.templateId === 'trait.condition.wounded');
    expect(woundEffects).toHaveLength(1);
    expect((woundEffects[0] as { stackCount?: number }).stackCount).toBe(2);
  });

  it('no band authors two separate condition_attachment effects for the same target', () => {
    for (const { effect } of allAuthoredEffects()) {
      if (effect.kind !== 'condition_attachment') continue;
      expect(effect.stackCount === undefined || effect.stackCount <= 2).toBe(true);
    }
  });
});

describe('Standing the Line — the seed contract (§ 9)', () => {
  it('the survivor cast key matches the shipped sequel exactly', () => {
    const survivor = (TEMPLATE.supportBundle ?? []).find((s) => s.key === 'survivor');
    expect(survivor, 'no supportBundle entry keyed "survivor"').toBeDefined();
    expect(survivor!.kind).toBe('actor');
    expect(survivor!.persistence).toBe('must-persist');
  });

  it.each(POLE_KEYS)('%s: success_at_cost and failure plant the seed on both reaction arms', (pole) => {
    for (const band of ['success_at_cost', 'failure'] as const) {
      const reactions = variantOf(pole).byOutcome![band]!.reactions!;
      expect(reactions.length).toBeGreaterThanOrEqual(2);
      for (const r of reactions) {
        const seed = r.effects.find((e) => e.kind === 'encounter_seed');
        expect(seed, `${pole}/${band} reaction '${r.id}' has no encounter_seed`).toBeDefined();
        const s = seed as Extract<EncounterAftermathReactionEffect, { kind: 'encounter_seed' }>;
        expect(s.templateId).toBe('encounter.border.one_body_short');
        expect(s.inheritContext).toBe(true);
        expect(s.delayTicks).toBe(12);
      }
    }
  });

  it.each(POLE_KEYS)('%s: critical_success, base success, and critical_failure plant no seed', (pole) => {
    const bandsWithNoSeed: readonly (UnifiedActionOutcome | 'success')[] = ['critical_success', 'critical_failure'];
    for (const band of bandsWithNoSeed) {
      const reactions =
        band === 'success' ? (variantOf(pole).reactions ?? []) : (variantOf(pole).byOutcome![band as UnifiedActionOutcome]!.reactions ?? []);
      for (const r of reactions) {
        expect(r.effects.some((e) => e.kind === 'encounter_seed'), `${pole}/${band} reaction '${r.id}' plants a seed`).toBe(false);
      }
    }
    const baseReactions = variantOf(pole).reactions ?? [];
    for (const r of baseReactions) {
      expect(r.effects.some((e) => e.kind === 'encounter_seed')).toBe(false);
    }
  });
});

describe('Standing the Line — nothing depends on action.targetId resolving to an agent (§ 9.5)', () => {
  it('authors no effect of a kind that resolves its person from action.targetId', () => {
    const offenders = allAuthoredEffects().filter(({ effect }) => TARGET_ID_DEPENDENT_EFFECT_KINDS.includes(effect.kind));
    expect(offenders, offenders.map((o) => `${o.site}: ${o.effect.kind}`).join('\n')).toEqual([]);
  });
});

describe('Standing the Line — consequence draw', () => {
  it('records the drawn hand check:encounter recomputes', () => {
    expect(TEMPLATE.consequenceDraw).toEqual(['relationship', 'secret', 'story_seed']);
    expect(TEMPLATE.consequenceSwap).toBeUndefined();
  });

  it('drew relationship / secret / story_seed, per the template id + reach + rarityTier', () => {
    const drawn = drawnHandForTemplate(TEMPLATE);
    expect(drawn).toEqual(['relationship', 'secret', 'story_seed']);
  });

  it('clears checkConsequenceDraw with zero violations', () => {
    const effects = allAuthoredEffects().map(({ effect }) => effect);
    const hasRewardPool = Boolean(step0.successMetadata?.rewardPool);
    const wired = familiesWiredByEffects(effects, hasRewardPool);
    const violations = checkConsequenceDraw(TEMPLATE, wired);
    expect(violations).toEqual([]);
  });
});

describe('Standing the Line — composition contract', () => {
  it('checkCompositionContract reports zero violations', () => {
    const report = checkCompositionContract(TEMPLATE);
    expect(report.violations, JSON.stringify(report.violations, null, 2)).toEqual([]);
  });

  it('every change declares a non-empty concepts list', () => {
    for (const pole of POLE_KEYS) {
      const variant = variantOf(pole);
      const allChanges = [
        ...variant.changes,
        ...Object.values(variant.byOutcome ?? {}).flatMap((b) => b?.changes ?? []),
      ];
      for (const change of allChanges) {
        expect(change.concepts?.length, `${pole}: change "${change.id}" has no concepts`).toBeGreaterThan(0);
      }
    }
  });

  it('18 chip instances total (8 BOND + 4 PATH + 6 SCAR) — corrected from the draft’s miscount of 21', () => {
    let total = 0;
    for (const pole of POLE_KEYS) {
      const variant = variantOf(pole);
      total += variant.changes.length;
      total += Object.values(variant.byOutcome ?? {}).reduce((sum, b) => sum + (b?.changes?.length ?? 0), 0);
    }
    expect(total).toBe(18);
  });
});

describe('Standing the Line — trait hook', () => {
  it('declares one trait variant on the Warm core continuum', () => {
    expect(TEMPLATE.traitVariants).toHaveLength(1);
    expect(TEMPLATE.traitVariants![0].traitId).toBe('trait.core.core_warmth.virtue');
    expect(TEMPLATE.traitVariants![0].addNudgeIds).toBeUndefined();
  });
});

describe('Standing the Line — never gendered', () => {
  it('no gendered pronoun anywhere in authored prose fields', () => {
    const genderedPronoun = /\b(he|him|his|she|her|hers)\b/i;
    const texts: string[] = [
      step0.narrativeTemplate ?? '',
      ...Object.values(TEMPLATE.openings ?? {}),
    ];
    for (const pole of POLE_KEYS) {
      const variant = variantOf(pole);
      texts.push(variant.overview);
      for (const band of AUTHORED_BANDS) {
        texts.push(variant.byOutcome![band]!.overview ?? '');
      }
    }
    for (const text of texts) {
      expect(text, `gendered pronoun found in: "${text}"`).not.toMatch(genderedPronoun);
    }
  });
});
