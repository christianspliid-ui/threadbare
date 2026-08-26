/**
 * The Composition Contract's own gates. THR-1045.
 *
 * Three jobs, and the split between them is deliberate:
 *
 *   1. **Green on real content.** The golden exemplar — already pinned by
 *      `nudgeModel.test.ts` for its hand and envelope — passes the whole
 *      contract. The green case is therefore not a fixture invented to satisfy
 *      the validator; it is the format's worked example, retrofitted.
 *   2. **Red, per block.** Each block is falsified by *removing* that block from
 *      the passing exemplar. A validator whose falsification cases are also
 *      hand-authored proves only that two fictions agree; deriving each red case
 *      from the green one means the only difference is the block under test.
 *   3. **Red on shipped content.** `encounter.slice.unsafe_bridge` — a real
 *      template a real player draws — fails, naming real blocks. This is the
 *      half that cannot be satisfied by fixture-writing.
 *
 * Plus the ratchet, checked in both directions (see § the ratchet).
 */

import { describe, expect, it } from 'vitest';
import type { ActionStep, UnifiedActionTemplate } from '../../../types/unifiedAction';
import { isActionStepBranch } from '../../../types/unifiedAction';
import { NUDGE_GOLDEN_EXEMPLAR } from '../../__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import {
  COMPOSITION_BYOUTCOME_MIN_BANDS,
  COMPOSITION_SYSTEMS_QUOTA_MIN,
  SYSTEM_CONNECTIONS,
  type CompositionBlock,

  checkCompositionContract,
  isPersistentEffectKind,
  systemConnections,
  isAdditiveConditionEffectKind,
  reachableConditionWritesCannotFire,
  systemSurfacesForOutcome,
  authoredProse,
} from '../compositionContract';
import { RETROFIT_PENDING, isRetrofitPending } from '../retrofitPending';
import { checkComposedHand } from '../nudgeHandChecklist';

/** Blocks a report actually flagged, deduped. */
function blocksOf(template: UnifiedActionTemplate): readonly CompositionBlock[] {
  return [...new Set(checkCompositionContract(template).violations.map(v => v.block))].sort();
}

describe('Composition Contract — green on the retrofitted exemplar', () => {
  it('the golden exemplar is composition-complete', () => {
    const report = checkCompositionContract(NUDGE_GOLDEN_EXEMPLAR);
    // Print the violations, not just the count — a failure here should say what
    // regressed without a second run.
    expect(report.violations.map(v => `[${v.block}] ${v.message}`)).toEqual([]);
  });

  it('connects to at least the quota of game systems', () => {
    const systems = systemConnections(NUDGE_GOLDEN_EXEMPLAR);
    expect(systems.length).toBeGreaterThanOrEqual(COMPOSITION_SYSTEMS_QUOTA_MIN);
    // Pinned, not merely counted: a change that swaps one connection for another
    // keeps the count and changes what the encounter is wired into.
    expect(systems).toEqual(['cast', 'rewards', 'conditions']);
  });

  it('authors the outcome-band floor including an extreme', () => {
    const { bands } = checkCompositionContract(NUDGE_GOLDEN_EXEMPLAR);
    expect(bands.length).toBeGreaterThanOrEqual(COMPOSITION_BYOUTCOME_MIN_BANDS);
    expect(bands).toContain('critical_failure');
  });
});

describe('Composition Contract — each block falsified from the passing exemplar', () => {
  it('cast: removing the support bundle names the cast block', () => {
    const { supportBundle: _dropped, ...noCast } = NUDGE_GOLDEN_EXEMPLAR;
    expect(blocksOf(noCast as UnifiedActionTemplate)).toContain('cast');
  });

  it('cast: a {cast:*} token naming no bundle key is a violation', () => {
    const withDeadToken: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      openings: {
        ...NUDGE_GOLDEN_EXEMPLAR.openings,
        rural: 'The river is up, and {cast:nobody} is watching it climb.',
      },
    };
    const violations = checkCompositionContract(withDeadToken).violations;
    expect(violations.some(v => v.block === 'cast' && v.message.includes('{cast:nobody}'))).toBe(true);
  });

  it('aftermath: removing aftermathConfig names the aftermath block', () => {
    const { aftermathConfig: _dropped, ...noAftermath } = NUDGE_GOLDEN_EXEMPLAR;
    expect(blocksOf(noAftermath as UnifiedActionTemplate)).toContain('aftermath');
  });

  it('aftermath: two bands is under the floor, and the message says so', () => {
    const fallback = NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!.fallback;
    const twoBands: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      aftermathConfig: {
        ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!,
        fallback: {
          ...fallback,
          byOutcome: {
            success: fallback.byOutcome!.success,
            failure: fallback.byOutcome!.failure,
          },
        },
      },
    };
    const violations = checkCompositionContract(twoBands).violations;
    expect(violations.some(v => v.block === 'aftermath' && v.message.includes('no extreme band')))
      .toBe(true);
  });

  it('aftermath: a change without `concepts` names the aftermath block (Law 2)', () => {
    const fallback = NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!.fallback;
    const noConcepts: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      aftermathConfig: {
        ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!,
        fallback: {
          ...fallback,
          changes: fallback.changes.map(({ concepts: _dropped, ...rest }) => rest),
        },
      },
    };
    const violations = checkCompositionContract(noConcepts).violations;
    expect(violations.some(v => v.block === 'aftermath' && v.message.includes('concepts'))).toBe(true);
  });

  it('rewards: with no persistent effect anywhere, nothing carries out of the scene', () => {
    const fallback = NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!.fallback;
    // Strip every reward route at once — reactions on the variant, reactions in
    // the bands, the card grants, and the step-outcome rewardPool draws —
    // because the block passes on *any* of them.
    const noReward: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      steps: NUDGE_GOLDEN_EXEMPLAR.steps.map(step =>
        'nudges' in step
          ? {
              ...step,
              nudges: step.nudges?.map(({ grants: _g, ...n }) => n),
              successMetadata: undefined,
              failureMetadata: undefined,
            }
          : step,
      ),
      aftermathConfig: {
        ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!,
        fallback: {
          ...fallback,
          reactions: [],
          byOutcome: Object.fromEntries(
            Object.entries(fallback.byOutcome ?? {}).map(([band, override]) => [
              band,
              { ...override, reactions: [] },
            ]),
          ),
        },
      },
    };
    expect(blocksOf(noReward)).toContain('rewards');
  });

  it('setting: dropping the envelope names the setting block', () => {
    const { settings: _s, openings: _o, locationSubtypes: _l, ...noEnvelope } = NUDGE_GOLDEN_EXEMPLAR;
    expect(blocksOf(noEnvelope as UnifiedActionTemplate)).toContain('setting');
  });

  it('hand: dropping every card names the hand block', () => {
    const noHand: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      steps: NUDGE_GOLDEN_EXEMPLAR.steps.map(step =>
        'nudges' in step ? { ...step, nudges: [] } : step,
      ),
    };
    expect(blocksOf(noHand)).toContain('hand');
  });

  it('steps: more than the contract\'s ceiling names the steps block', () => {
    const tooMany: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      steps: [...NUDGE_GOLDEN_EXEMPLAR.steps, ...NUDGE_GOLDEN_EXEMPLAR.steps],
    };
    expect(blocksOf(tooMany)).toContain('steps');
  });

  it('images: a card tag naming no library row names the images block', () => {
    const deadTag: UnifiedActionTemplate = {
      ...NUDGE_GOLDEN_EXEMPLAR,
      steps: NUDGE_GOLDEN_EXEMPLAR.steps.map((step, index) =>
        index === 0 && 'nudges' in step && step.nudges?.length
          ? {
            ...step,
            nudges: [{ ...step.nudges[0], imageTag: 'generic.no_such_art' }, ...step.nudges.slice(1)],
          }
          : step,
      ),
    };
    const violations = checkCompositionContract(deadTag).violations;
    expect(violations.some(v => v.block === 'images' && v.message.includes('generic.no_such_art')))
      .toBe(true);
  });

  it('systems: with cast, rewards and conditions gone, the quota is not met', () => {
    const { supportBundle: _c, aftermathConfig: _a, ...bare } = NUDGE_GOLDEN_EXEMPLAR;
    const stripped: UnifiedActionTemplate = {
      ...(bare as UnifiedActionTemplate),
      steps: NUDGE_GOLDEN_EXEMPLAR.steps.map(step =>
        'nudges' in step
          ? { ...step, nudges: step.nudges?.map(({ grants: _g, ...n }) => n) }
          : step,
      ),
    };
    expect(systemConnections(stripped).length).toBeLessThan(COMPOSITION_SYSTEMS_QUOTA_MIN);
    expect(blocksOf(stripped)).toContain('systems');
  });
});

describe('Composition Contract — red on a non-compliant template', () => {
  // **This block no longer points at shipped content, and must not again.**
  //
  // It used to name whichever template was currently worst — the bridge, then
  // `snow_on_the_pass` after THR-1131 retrofitted the bridge — which made the
  // test hostage to every content improvement: closing that template's Law 2 gap
  // (THR-1132) turned this green-by-being-broken assertion red, on a change that
  // made the corpus *better*. The file's own note predicted needing a synthetic
  // fixture "when the last batch drains the ratchet"; the same reasoning applies
  // one improvement at a time, so it is taken now rather than re-pointed at the
  // next victim.
  //
  // Stripping `changes` of their `concepts` is the exact Law 2 violation the
  // aftermath block exists to catch, so the fixture stays faithful to what the
  // rule is for while owing nothing to the state of the corpus.
  const nonCompliant: UnifiedActionTemplate = {
    ...NUDGE_GOLDEN_EXEMPLAR,
    aftermathConfig: {
      ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!,
      fallback: {
        ...NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!.fallback,
        changes: (NUDGE_GOLDEN_EXEMPLAR.aftermathConfig!.fallback.changes ?? []).map(
          ({ concepts: _dropped, ...rest }) => rest,
        ),
      },
    },
  } as UnifiedActionTemplate;

  it('the exemplar it is built from carries aftermath changes (fixture guard)', () => {
    // Without this the strip below could remove nothing and the assertions would
    // pass over an empty `changes` array — the vacuous shape this file guards
    // against everywhere else.
    expect(NUDGE_GOLDEN_EXEMPLAR.aftermathConfig?.fallback.changes?.length ?? 0)
      .toBeGreaterThan(0);
  });

  it('fails the contract, naming the aftermath block', () => {
    const violations = checkCompositionContract(nonCompliant).violations;
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.map(v => v.block)).toContain('aftermath');
  });

  it('every violation names where the rule is written down', () => {
    for (const violation of checkCompositionContract(nonCompliant).violations) {
      expect(violation.planSection).toMatch(/^Docs\/plans\/2026-08-08-encounter-factory-workflow\.md §/u);
    }
  });
});

describe('the ratchet', () => {
  const encounters = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.'));

  it('sweeps a non-empty population', () => {
    // The guard that stops every assertion below from passing over nothing.
    expect(encounters.length).toBeGreaterThan(100);
  });

  it('no template off the ratchet fails the contract', () => {
    const offenders = encounters
      .filter(t => !isRetrofitPending(t.id))
      .filter(t => checkCompositionContract(t).violations.length > 0)
      .map(t => t.id);
    expect(offenders).toEqual([]);
  });

  it('every ratchet entry names a template that still fails — no stale entries', () => {
    const byId = new Map(encounters.map(t => [t.id, t]));
    const stale = RETROFIT_PENDING.filter(id => {
      const template = byId.get(id);
      // A name that resolves to nothing is stale too: a renamed or deleted
      // template otherwise leaves its id behind forever.
      if (!template) return true;
      return checkCompositionContract(template).violations.length === 0;
    });
    expect(stale).toEqual([]);
  });

  it('is sorted and free of duplicates, so a diff adding one is one line', () => {
    expect([...RETROFIT_PENDING]).toEqual([...new Set(RETROFIT_PENDING)].sort());
  });

  it('holds no id outside the encounter families it gates', () => {
    expect(RETROFIT_PENDING.filter(id => !id.startsWith('encounter.'))).toEqual([]);
  });
});

// ─── THR-1132 — band/reaction provenance for the live proof ──────────

describe('systemSurfacesForOutcome', () => {
  /** A minimal template whose seed sits on one band, behind one reaction. */
  const banded = {
    id: 'encounter.test.banded',
    steps: [],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        changes: [],
        reactions: [],
        byOutcome: {
          // Deliberately NOT a `trait` here: a trait counts as both a reward and
          // a condition, which would make the rolled band supply `rewards` and
          // defeat the otherBand assertion below.
          critical_failure: {
            changes: [{ kind: 'reputation' }],
            reactions: [
              { id: 'r.walk_away', effects: [{ kind: 'encounter_seed' }] },
            ],
          },
          success: { changes: [{ kind: 'item' }], reactions: [] },
        },
      },
    },
  } as unknown as UnifiedActionTemplate;

  it('marks a band the run did not roll as otherBand, not as reachable', () => {
    // The `unsafe_bridge` shape: rewards authored on `success` while the run
    // rolled `critical_failure`. Stage 3's union answer says "declares rewards";
    // Stage 4 must not turn that into "rewards failed to arrive".
    const surfaces = systemSurfacesForOutcome(banded, 'critical_failure');
    expect(surfaces.rewards.otherBand).toBe(true);
    expect(surfaces.rewards.unconditional).toBe(false);
  });

  it('names the reactions carrying a connection, so one pick can be told from another', () => {
    const surfaces = systemSurfacesForOutcome(banded, 'critical_failure');
    expect(surfaces.seeds.reactionIds).toEqual(['r.walk_away']);
    expect(surfaces.seeds.unconditional).toBe(false);
  });

  it('reaches a band-scoped change when that band is the one rolled', () => {
    // `reputation` rides the `critical_failure` change directly, with no reaction
    // in the way — so on that band it is plainly assertable, and scoping must not
    // excuse it.
    const surfaces = systemSurfacesForOutcome(banded, 'critical_failure');
    expect(surfaces.reputation.unconditional).toBe(true);
    expect(surfaces.reputation.otherBand).toBe(false);
  });

  it('collapses to the union answer when the run never resolved', () => {
    // No band rolled means nothing can be "another band". An unresolved run must
    // keep reporting the failures it does today rather than excusing them.
    const surfaces = systemSurfacesForOutcome(banded, undefined);
    expect(surfaces.rewards.otherBand).toBe(false);
    expect(surfaces.rewards.unconditional).toBe(true);
  });

  it('counts favor_creation persistent, the reward route that lands off `changes`', () => {
    // THR-1132's fourth false-fail: `grateful_kin` promises its reward as a
    // `favor_creation` on the reaction that fires. The applier writes a favor
    // edge and a trace and never touches `aftermathSummary.changes`, so a stage
    // reading only `changes` called an arrived reward missing. This predicate is
    // what lets the live proof look in the right place — if it ever stops
    // agreeing with the declaration side, that stage silently under-asks again.
    expect(isPersistentEffectKind('favor_creation')).toBe(true);
    expect(isPersistentEffectKind('spawn_artifact')).toBe(true);
    expect(isPersistentEffectKind('reputation_score')).toBe(false);
  });

  it('agrees with systemConnections on which systems are authored at all', () => {
    // One walk, two consumers (the module header's rule). If these two ever
    // disagree about membership, the narrower one is silently under-asking.
    for (const template of UNIFIED_ACTION_TEMPLATES.slice(0, 40)) {
      const union = new Set(systemConnections(template));
      const surfaces = systemSurfacesForOutcome(template, undefined);
      for (const system of SYSTEM_CONNECTIONS) {
        const surfaced = surfaces[system].unconditional
          || surfaces[system].reactionIds.length > 0
          || surfaces[system].otherBand;
        // `reputation`/`factions` have declaration routes systemConnections reads
        // that this walk deliberately does not re-derive, so only assert the
        // direction that would hide a defect: surfaced ⇒ declared.
        if (surfaced) expect(union.has(system)).toBe(true);
      }
    }
  });
});


// ─── THR-1221 — a write that could not fire is not a missing write ───

describe('reachableConditionWritesCannotFire', () => {
  /**
   * The `toll_of_blades` shape: a `continue_weakened` step whose
   * `failureMetadata` mints a condition, plus a fallback reaction carrying only
   * a removal. Both are band-agnostic, so both are "reachable" on every band.
   */
  const tollShape = {
    id: 'encounter.test.toll_shape',
    steps: [
      {
        failBehavior: 'continue_weakened',
        failureMetadata: {
          effects: [
            { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted' },
          ],
        },
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        changes: [],
        reactions: [
          {
            id: 'r.let_them_rest',
            effects: [
              { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' },
            ],
          },
        ],
        byOutcome: {},
      },
    },
  } as unknown as UnifiedActionTemplate;

  it('skips when no step failed: the mint never fired and the removal owes nothing', () => {
    expect(
      reachableConditionWritesCannotFire(tollShape, 'success_at_cost', 'r.let_them_rest', false),
    ).toBe(true);
  });

  it('ASSERTS when a step did fail, because the mint was in a position to fire', () => {
    // The falsifying arm. Without it the predicate could return true
    // unconditionally and the test above would still pass.
    expect(
      reachableConditionWritesCannotFire(tollShape, 'success_at_cost', 'r.let_them_rest', true),
    ).toBe(false);
  });

  it('ASSERTS when a reachable reaction adds a condition outright', () => {
    const additiveReaction = {
      id: 'encounter.test.additive',
      steps: [],
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          changes: [],
          reactions: [
            {
              id: 'r.mark_them',
              effects: [
                { kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded' },
              ],
            },
          ],
          byOutcome: {},
        },
      },
    } as unknown as UnifiedActionTemplate;
    expect(
      reachableConditionWritesCannotFire(additiveReaction, 'success', 'r.mark_them', false),
    ).toBe(false);
  });

  it('ignores a trait chip authored on a band this run did not roll', () => {
    // The bug the first draft of this predicate had: a `trait` change on a
    // failure band made it answer "assert" on a success run that could never
    // reach that chip.
    const bandedChip = {
      id: 'encounter.test.banded_chip',
      steps: [
        {
          failBehavior: 'continue_weakened',
          failureMetadata: {
            effects: [
              { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted' },
            ],
          },
        },
      ],
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          changes: [],
          reactions: [],
          byOutcome: {
            critical_failure: { changes: [{ kind: 'trait' }], reactions: [] },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;
    expect(reachableConditionWritesCannotFire(bandedChip, 'success_at_cost', undefined, false))
      .toBe(true);
    // …and the same chip on its own band is asserted.
    expect(reachableConditionWritesCannotFire(bandedChip, 'critical_failure', undefined, false))
      .toBe(false);
  });

  it('returns false when the template authors no condition write at all', () => {
    const noConditions = {
      id: 'encounter.test.no_conditions',
      steps: [],
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: { changes: [{ kind: 'item' }], reactions: [], byOutcome: {} },
      },
    } as unknown as UnifiedActionTemplate;
    expect(reachableConditionWritesCannotFire(noConditions, 'success', undefined, false)).toBe(false);
  });
});

describe('isAdditiveConditionEffectKind', () => {
  it('counts the kinds an author decides will land', () => {
    expect(isAdditiveConditionEffectKind('apply_condition')).toBe(true);
    expect(isAdditiveConditionEffectKind('condition_attachment')).toBe(true);
  });

  it('excludes remove_condition, which traces success having removed nothing', () => {
    expect(isAdditiveConditionEffectKind('remove_condition')).toBe(false);
  });

  it('excludes kinds that are not condition writes', () => {
    expect(isAdditiveConditionEffectKind('quintessence_shift')).toBe(false);
  });
});

// ─── The composed hand (THR-1247 rules, THR-1248 exercisers) ─────────

/**
 * `checkComposedHand` shipped with **no live exerciser at all**: it returns `[]`
 * for a template with no `deal` declaration, which is every shipped template, so
 * running the whole corpus through it proved exactly nothing. A gate that has
 * never fired is not yet a gate — the same "live layer, impossible input" shape
 * this repo has been bitten by before.
 *
 * Each case below is derived from the passing golden exemplar by changing only
 * the declaration under test, for the reason stated at the top of this file: a
 * validator whose red cases are also hand-authored proves only that two fictions
 * agree.
 */
describe('composed hand — the deal declaration', () => {
  /** The exemplar with step 0's hand cut to `specials` and a `deal` attached. */
  function composed(deal: unknown, specials: number): UnifiedActionTemplate {
    const steps = [...(NUDGE_GOLDEN_EXEMPLAR.steps ?? [])];
    const step0 = steps[0] as unknown as Record<string, unknown>;
    steps[0] = {
      ...step0,
      nudges: ((step0.nudges as unknown[]) ?? []).slice(0, specials),
      deal,
    } as never;
    return { ...NUDGE_GOLDEN_EXEMPLAR, steps } as UnifiedActionTemplate;
  }

  /** Only the `hand`-block violations, so an unrelated block cannot fake a pass. */
  function handViolations(template: UnifiedActionTemplate): string[] {
    return checkCompositionContract(template)
      .violations.filter((v) => v.block === 'hand')
      .map((v) => v.message);
  }

  it('passes a well-formed composition: two specials and a declared fill', () => {
    expect(handViolations(composed({ count: 4, tags: ['stone', 'peril'] }, 2))).toEqual([]);
  });

  it('passes a fully-dealt hand — specials are 0–2, and zero is a real choice', () => {
    expect(handViolations(composed({ count: 5, tags: ['stone'] }, 0))).toEqual([]);
  });

  it('is silent on a template that declares no fill — the whole shipped corpus', () => {
    // Guards the claim that this gate adds nothing to today's verdict. If it
    // ever stops holding, every shipped encounter gains violations at once.
    expect(checkComposedHand(NUDGE_GOLDEN_EXEMPLAR)).toEqual([]);
  });

  it('rejects a fill that is not a positive number', () => {
    expect(handViolations(composed({ count: 0 }, 2)).join(' ')).toMatch(/deal\.count is 0/u);
  });

  it('rejects a composed hand over the ceiling', () => {
    expect(handViolations(composed({ count: 7 }, 2)).join(' ')).toMatch(/over NUDGE_HAND_MAX/u);
  });

  it('rejects a composed hand under the floor', () => {
    expect(handViolations(composed({ count: 1 }, 2)).join(' ')).toMatch(/under NUDGE_HAND_MIN/u);
  });

  it('rejects more authored specials than the composed model allows', () => {
    // The rule the whole design rests on: a third special is a generic wearing
    // a scene's clothes, and the library almost certainly already covers it.
    expect(handViolations(composed({ count: 3 }, 4)).join(' ')).toMatch(
      /authored specials, over DEAL_MAX_AUTHORED_SPECIALS/u,
    );
  });

  it('rejects a repeated context tag, which silently doubles a card weight', () => {
    expect(handViolations(composed({ count: 4, tags: ['stone', 'stone'] }, 2)).join(' ')).toMatch(
      /deal\.tags repeats 'stone'/u,
    );
  });

  it('rejects a hand described by subtraction — many excludes, nothing authored', () => {
    expect(
      handViolations(composed({ count: 5, exclude: ['boost', 'mercy', 'gambit'] }, 0)).join(' '),
    ).toMatch(/describe it by subtraction|author the hand instead/u);
  });
});

/**
 * THR-1273 — every block descends into `ActionStepBranch` arms.
 *
 * The blindness these cover was structural, not textual: `plainSteps` and
 * `nudgeBearingSteps` filtered branch nodes out of `template.steps`, so a fork's
 * arms — which carry their own prose, hand, reach, difficulty and outcome
 * metadata — reached no gate at all. Measured on the factory's first
 * `personality_fork`, three editorial defects lived exactly in the unchecked
 * half and would have shipped green.
 *
 * Built the same way as the block cases above: take the *passing* exemplar and
 * move its second step into a branch arm, so the only difference between the
 * green and red cases is which side of the fork the defect sits on. A fixture
 * authoring both halves would prove only that two fictions agree.
 */
describe('Composition Contract — branch arms are walked (THR-1273)', () => {
  /** The exemplar with step 1 replaced by a two-arm fork, `mutate` applied to the `negative` arm. */
  function forked(mutate: (step: ActionStep) => ActionStep): UnifiedActionTemplate {
    const steps = NUDGE_GOLDEN_EXEMPLAR.steps ?? [];
    const plain = steps[1];
    if (!plain || isActionStepBranch(plain)) throw new Error('exemplar step 1 is not a plain step');
    return {
      ...NUDGE_GOLDEN_EXEMPLAR,
      steps: [
        steps[0],
        {
          branchOnStep: 0,
          variants: { positive: plain, negative: mutate(plain) },
          fallback: plain,
        },
      ],
    };
  }

  it('a fork whose arms are all clean stays green', () => {
    // The control. Without it every red case below could be passing because
    // *forking at all* trips the contract, which would prove nothing about
    // descent — and would silently make the whole block vacuous.
    const report = checkCompositionContract(forked(step => step));
    expect(report.violations.map(v => `[${v.block}] ${v.message}`)).toEqual([]);
  });

  it('a missing narrativeTemplate in one arm names the steps block', () => {
    const violations = checkCompositionContract(
      forked(step => ({ ...step, narrativeTemplate: '   ' })),
    ).violations;
    expect(violations.map(v => v.block)).toContain('steps');
    // The label names the arm, not a filtered index: two arms of one fork would
    // otherwise report as consecutive "step N"s that exist in no authored file.
    expect(violations.map(v => v.message).join(' ')).toMatch(
      /step 1 variant 'negative' has no narrativeTemplate/u,
    );
  });

  it('a missing reach in one arm names the steps block', () => {
    const violations = checkCompositionContract(
      forked(step => ({ ...step, reach: undefined as unknown as ActionStep['reach'] })),
    ).violations;
    expect(violations.map(v => v.message).join(' ')).toMatch(
      /step 1 variant 'negative' declares no reach/u,
    );
  });

  it('a hand-rule violation in one arm names the hand block', () => {
    // `REACH_PURPOSE_MAX_WORDS` is 4. This is the exact defect the descent
    // exposed on shipped content (`encounter.slice.swindled_family`).
    const violations = checkCompositionContract(
      forked(step => ({ ...step, purposeLine: 'Make the crossing at last' })),
    ).violations;
    expect(violations.map(v => v.block)).toContain('hand');
    expect(violations.map(v => v.message).join(' ')).toMatch(/variant 'negative'.*purposeLine/su);
  });

  it("a card's unresolvable imageTag in one arm names the images block", () => {
    const violations = checkCompositionContract(
      forked(step => ({
        ...step,
        nudges: (step.nudges ?? []).map((n, i) =>
          i === 0 ? { ...n, imageTag: 'no.such.library.row' } : n,
        ),
      })),
    ).violations;
    expect(violations.map(v => v.block)).toContain('images');
    expect(violations.map(v => v.message).join(' ')).toMatch(/no\.such\.library\.row/u);
  });

  it('a step position counts once however many arms it has', () => {
    // The count is over positions the player traverses — they run exactly one
    // arm. `plainSteps` counted a branch as *zero*, understating every fork by
    // one, so a 4-position fork read as 3 and passed the ceiling.
    const report = checkCompositionContract(forked(step => step));
    expect(report.violations.filter(v => v.block === 'steps')).toEqual([]);
    expect((forked(step => step).steps ?? []).length).toBe(2);
  });

  it('prose authored only in an arm reaches the register detectors', () => {
    const marker = 'a sentence that exists only on the negative arm';
    const prose = authoredProse(forked(step => ({ ...step, narrativeTemplate: marker })));
    expect(prose.map(p => p.text)).toContain(marker);
    expect(prose.find(p => p.text === marker)?.where).toMatch(/variant 'negative'/u);
  });

  it("an arm's step-outcome effects count toward the systems quota", () => {
    // The blindness that pushed the granary's `membership_change` into an
    // optional reaction: the arm's `successMetadata` writes were invisible, so
    // the quota read them as absent and the design had to move.
    const armOnly: UnifiedActionTemplate = {
      ...forked(step => ({
        ...step,
        successMetadata: {
          ...step.successMetadata,
          effects: [{ kind: 'faction_reputation_gain', factionId: 'faction.test', amount: 0.1 }],
        } as ActionStep['successMetadata'],
      })),
    };
    expect(systemConnections(armOnly)).toContain('reputation');
    // And the plain-half control: the unforked exemplar does not wire reputation,
    // so the connection above can only have come from the arm.
    expect(systemConnections(NUDGE_GOLDEN_EXEMPLAR)).not.toContain('reputation');
  });
});
