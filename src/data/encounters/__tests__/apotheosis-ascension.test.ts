/**
 * The Apotheosis — nudge-model conversion contract (THR-1086, closing THR-866).
 *
 * This template was the last `authoredChoices` fork in the game. What replaced it
 * is a `decidedBy` pole fork whose failure mode is **silence**: a variant keyed
 * anything other than `'positive'` / `'negative'` is not an error, it is content
 * that can never be reached, and nothing at runtime says so (the THR-844 shape,
 * 66 of 138 entries dead and unnoticed). Every assertion below exists to make one
 * of those silences loud.
 *
 * Each block states the failure it catches, because a test whose reason is not
 * written down is a test the next author deletes when it becomes inconvenient.
 */

import { describe, expect, it } from 'vitest';
import {
  isActionStepBranch,
  type ActionStep,
  type ActionStepBranch,
  type AftermathVariant,
  type EncounterAftermathReactionEffect,
  type StepNudge,
  type UnifiedActionOutcome,
} from '../../../types/unifiedAction';
import { APOTHEOSIS_ASCENSION_TEMPLATE as TEMPLATE } from '../apotheosis-ascension';
import {
  HAND_COMMON_OPTIONS_MIN,
  HAND_SPHERE_COVERAGE_MIN,
  NUDGE_HAND_MAX,
  NUDGE_HAND_MAX_TOTAL_DELTA,
  NUDGE_HAND_MIN,
  NUDGE_NAME_MAX_WORDS,
} from '../../content-eval/nudgeAuthoringConstants';
import {
  collectTemplateTextByClass,
  countVagueness,
  vaguenessTermsFor,
  type ProseFieldClass,
} from '../../content-eval/nudgeAuditDetectors';
import { SETTING_CLASSES, validateSettingEnvelope } from '../../settingClasses';

/** The two keys pole mode writes, and the only two `variants` may carry. */
const POLE_KEYS = ['negative', 'positive'] as const;

/**
 * The bands each pole authors an override for. `success` is deliberately absent:
 * it is the *base* variant, which is what `applyAftermathOutcomeBand` falls
 * through to. `contested_won` / `contested_lost` are absent because this template
 * is self-targeting and never contested — authoring them would ship prose no
 * player can reach.
 */
const AUTHORED_BANDS: readonly UnifiedActionOutcome[] = [
  'critical_success',
  'success_at_cost',
  'failure',
  'critical_failure',
];

const fork = TEMPLATE.steps[1] as ActionStepBranch;
const step0 = TEMPLATE.steps[0] as ActionStep;
const hand: readonly StepNudge[] = step0.nudges ?? [];

function variantOf(pole: (typeof POLE_KEYS)[number]): AftermathVariant {
  return TEMPLATE.aftermathConfig!.variants[pole];
}

function effectsOf(step: ActionStep): readonly EncounterAftermathReactionEffect[] {
  return [
    ...(step.successMetadata?.effects ?? []),
    ...(step.failureMetadata?.effects ?? []),
  ];
}

describe('The Apotheosis — the authored-choice fork is retired', () => {
  it('carries no authoredChoices', () => {
    // The whole point of the ticket. A template that kept them would still work,
    // which is exactly why this needs asserting rather than assuming.
    expect(TEMPLATE.authoredChoices).toBeUndefined();
  });

  it('decides the fork on the mortal, over the encounter’s own value axis', () => {
    expect(isActionStepBranch(fork)).toBe(true);
    // `sacrifice_survival` is Star's bound pair (REACH_VALUE_PAIR.star) and the
    // template's reach is `star`. A fork decided on any other axis would resolve
    // off a value the encounter never speaks about.
    expect(fork.decidedBy).toEqual({ axis: 'sacrifice_survival' });
    expect(TEMPLATE.reach).toBe('star');
    expect(TEMPLATE.motivations).toContain('sacrifice_survival');
  });
});

describe('pole keying — both keyings, pinned together', () => {
  // These two objects are keyed independently and read by different code paths
  // (`resolveStepDefinition` and `resolveAftermathVariant`). Getting one right
  // and the other wrong is the realistic mistake, so they are asserted as a pair.
  it('the step fork keys exactly the two pole keys', () => {
    expect(Object.keys(fork.variants).sort()).toEqual([...POLE_KEYS]);
  });

  it('the aftermath keys exactly the two pole keys', () => {
    expect(Object.keys(TEMPLATE.aftermathConfig!.variants).sort()).toEqual([...POLE_KEYS]);
  });

  it('the aftermath branches on the DECIDING step, not the fork’s own index', () => {
    // THR-979: the engine records the pole against the step that resolved (0).
    // The fork lives at steps[1] and declares branchOnStep 0; naming 1 here would
    // read a step no choice is ever written to and strand BOTH endings.
    expect(fork.branchOnStep).toBe(0);
    expect(TEMPLATE.aftermathConfig!.branchOnStep).toBe(0);
    expect(TEMPLATE.aftermathConfig!.branchOnStep).toBe(fork.branchOnStep);
  });

  it('falls back to the Survivor ending, never to a grant', () => {
    // An unresolved fork must not mint a permanent, irreversible edge by default.
    expect(TEMPLATE.aftermathConfig!.fallback.overview)
      .toBe(variantOf('negative').overview);
  });
});

describe('the grant is band-gated, and fires without a click', () => {
  const ascend = fork.variants.positive;
  const withhold = fork.variants.negative;

  it('grant_aspect rides the Martyr step’s successMetadata', () => {
    // Not a reaction: a reaction is a click, and by the time this band renders the
    // mortal has already said yes and the frame has already held, so the click
    // would be theatre in front of an irreversible world-write. Not `changes`
    // either — EncounterAftermathChange carries no `effects` field at all.
    const granted = (ascend.successMetadata?.effects ?? []).filter(e => e.kind === 'grant_aspect');
    expect(granted).toHaveLength(1);
  });

  it('no failure side of either step grants anything', () => {
    // `isStepSuccess` is the upper/lower split, so a failed Martyr step fires
    // `failureMetadata` — which must be empty. This is the "unmade" ending.
    expect(ascend.failureMetadata?.effects ?? []).toEqual([]);
    expect(effectsOf(withhold)).toEqual([]);
  });

  it('the Survivor pole cannot grant an aspect on any band', () => {
    // Direction stays with the decision; only the *quality* of the ending is
    // fate's. A Survivor decision never becomes an aspect because the roll went well.
    expect(effectsOf(withhold).some(e => e.kind === 'grant_aspect')).toBe(false);
  });

  it('no aftermath reaction anywhere carries the grant', () => {
    // Regression guard on the placement itself. `applyAftermathOutcomeBand`
    // replaces `reactions` wholesale, so a grant living there would be dropped by
    // any band that authored its own reactions — silently, and only on some bands.
    const variants: AftermathVariant[] = [
      variantOf('positive'),
      variantOf('negative'),
      TEMPLATE.aftermathConfig!.fallback,
    ];
    const allReactions = variants.flatMap(v => [
      ...(v.reactions ?? []),
      ...Object.values(v.byOutcome ?? {}).flatMap(b => b?.reactions ?? []),
    ]);
    expect(allReactions.flatMap(r => r.effects).some(e => e.kind === 'grant_aspect')).toBe(false);
  });

  it('the Martyr step fails the action, so the unmade ending is reachable as `failure`', () => {
    // Without `fail_action`, `computeFinalActionOutcome` folds a failed final step
    // into `success_at_cost` — the unmade band would key `failure` and never render,
    // and `?outcome=failure` would report `outcome_diverged` rather than the ending.
    expect(ascend.failBehavior).toBe('fail_action');
    expect(withhold.failBehavior).toBe('fail_action');
  });
});

describe('band coverage — four endings per pole, over a non-empty set', () => {
  it.each([...POLE_KEYS])('%s authors every reachable band', (pole) => {
    const byOutcome = variantOf(pole).byOutcome ?? {};
    // Non-empty population guard: an `every()` over an empty band list passes
    // while proving nothing (the vacuous-probe shape).
    expect(AUTHORED_BANDS.length).toBeGreaterThan(0);
    expect(Object.keys(byOutcome).sort()).toEqual([...AUTHORED_BANDS].sort());
    for (const band of AUTHORED_BANDS) {
      expect(byOutcome[band]?.overview, `${pole}/${band} has no overview`).toBeTruthy();
      expect(byOutcome[band]?.changes?.length, `${pole}/${band} has no changes`).toBeGreaterThan(0);
    }
  });

  it.each([...POLE_KEYS])('%s has a base ending for the plain success band', (pole) => {
    // `success` intentionally has no override — it resolves to the base variant.
    expect(variantOf(pole).byOutcome).not.toHaveProperty('success');
    expect(variantOf(pole).overview.length).toBeGreaterThan(0);
    expect(variantOf(pole).changes.length).toBeGreaterThan(0);
  });

  it('every authored band’s overview is distinct from its base and its sibling', () => {
    // Catches a copy-paste band: four keys, one ending, and a player who cannot
    // tell how it ended — which is the failure THR-969 exists to prevent.
    const overviews = POLE_KEYS.flatMap(pole => [
      variantOf(pole).overview,
      ...AUTHORED_BANDS.map(b => variantOf(pole).byOutcome![b]!.overview!),
    ]);
    expect(new Set(overviews).size).toBe(overviews.length);
  });
});

describe('the god’s hand', () => {
  it('sweeps a non-empty hand', () => {
    // Guards every invariant below against passing on an empty array.
    expect(hand.length).toBeGreaterThan(0);
  });

  it('sits inside the authored hand-size range', () => {
    expect(hand.length).toBeGreaterThanOrEqual(NUDGE_HAND_MIN);
    expect(hand.length).toBeLessThanOrEqual(NUDGE_HAND_MAX);
  });

  it('always deals a god with no matching sphere at least one playable card', () => {
    const common = hand.filter(n => n.sphere === undefined);
    expect(common.length).toBeGreaterThanOrEqual(HAND_COMMON_OPTIONS_MIN);
  });

  it('spans enough spheres for two gods to see different hands', () => {
    const spheres = new Set(hand.map(n => n.sphere).filter(Boolean));
    expect(spheres.size).toBeGreaterThanOrEqual(HAND_SPHERE_COVERAGE_MIN);
  });

  it('argues for BOTH poles', () => {
    // A hand that leans one way only is a fork with a default, not a decision.
    const leaning = hand.filter(n => n.poleLean !== undefined);
    const toward = (pole: string): StepNudge[] =>
      leaning.filter(n => typeof n.poleLean === 'object' && 'axis' in n.poleLean
        && n.poleLean.axis === 'sacrifice_survival' && n.poleLean.toward === pole);
    expect(toward('positive').length).toBeGreaterThan(0);
    expect(toward('negative').length).toBeGreaterThan(0);
  });

  it('leaves room for a god to abstain', () => {
    // An unleaned card moves the odds without arguing a direction. A hand with
    // none of them forces every essence spend into an argument about the ending.
    expect(hand.some(n => n.poleLean === undefined)).toBe(true);
  });

  it('stays under the authored hand-strength ceiling', () => {
    const total = hand.reduce((sum, n) => sum + n.forecastDelta, 0);
    expect(total).toBeLessThanOrEqual(NUDGE_HAND_MAX_TOTAL_DELTA);
  });

  it('never shows the player a number', () => {
    // `effectLine` is words-only by authoring rule — a digit on the surface is an
    // editorial reject, because the forecast word is the player's instrument.
    for (const n of hand) {
      expect(n.effectLine, `${n.id} effectLine`).not.toMatch(/\d/);
      expect(n.name.trim().split(/\s+/).length, `${n.id} name`).toBeLessThanOrEqual(NUDGE_NAME_MAX_WORDS);
    }
  });

  it('makes every card traceable in failure', () => {
    // The god's hand must be readable in defeat at any size, or a player who spent
    // essence and lost has no account of what their spend did.
    for (const n of hand) {
      const bands = Object.keys(n.bandProse ?? {});
      expect(
        bands.some(b => b === 'near_miss' || b === 'failure' || b === 'critical_failure'),
        `${n.id} authors no failure-band fragment`,
      ).toBe(true);
    }
  });

  it('gives every card a unique id', () => {
    expect(new Set(hand.map(n => n.id)).size).toBe(hand.length);
  });
});

describe('difficulty is no longer zero on either side of the fork', () => {
  it('every step rolls for something', () => {
    // The pre-conversion template ran both steps at 0 because the player's click
    // was the content. Once the mortal decides, a step at 0 is a cutscene.
    const steps: ActionStep[] = [step0, fork.variants.positive, fork.variants.negative];
    for (const s of steps) expect(s.difficulty).toBeGreaterThan(0);
  });

  it('prices the vessel above the threshold and the withdrawal below it', () => {
    // The encounter's real risk is whether the frame holds; letting go is easier
    // than pouring through. Three steps, three difficulty words on the surface.
    expect(fork.variants.positive.difficulty).toBeGreaterThan(step0.difficulty);
    expect(fork.variants.negative.difficulty).toBeLessThan(step0.difficulty);
  });
});

describe('register', () => {
  const byClass = collectTemplateTextByClass(TEMPLATE);

  it.each(['outcome', 'scene', 'interactive'] as ProseFieldClass[])(
    '%s prose carries no vagueness terms',
    (fieldClass) => {
      const text = byClass[fieldClass];
      expect(text.length, `${fieldClass} bucket is empty`).toBeGreaterThan(0);
      const hits = vaguenessTermsFor(fieldClass).filter(term =>
        new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text),
      );
      expect(countVagueness(text, fieldClass), `terms found: ${hits.join(', ')}`).toBe(0);
    },
  );
});

describe('setting envelope (THR-884)', () => {
  it('passes envelope validation', () => {
    expect(validateSettingEnvelope(TEMPLATE)).toEqual([]);
  });

  it('declares a narrow envelope, not the whole vocabulary', () => {
    // "Declare what it actually plays in." A capstone seeded onto a devotee plays
    // where people live and pray; it does not play in a muster yard or a ruin.
    expect(TEMPLATE.settings!.length).toBeGreaterThan(0);
    expect(TEMPLATE.settings!.length).toBeLessThan(SETTING_CLASSES.length);
    expect(TEMPLATE.locationSubtypes!.length).toBeGreaterThan(0);
  });

  it('compiles its openings into a resolvable opening fragment', () => {
    // Without compilation the authored openings reach no render path at all —
    // the THR-932 failure, where a template's opening silently never appeared.
    const set = TEMPLATE.contextFragments?.find(f => f.slot === 'opening');
    expect(set).toBeDefined();
    expect(set!.axis).toBe('setting');
    expect(set!.variants['*'], 'opening fragment has no default').toBeTruthy();
    for (const cls of TEMPLATE.settings!) {
      expect(set!.variants[cls], `no opening variant for ${cls}`).toBeTruthy();
    }
    expect((TEMPLATE.steps[0] as ActionStep).narrativeTemplate).toContain('{frag:opening}');
  });
});
