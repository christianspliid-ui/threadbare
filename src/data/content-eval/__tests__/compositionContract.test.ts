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
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
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
} from '../compositionContract';
import { RETROFIT_PENDING, isRetrofitPending } from '../retrofitPending';

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
