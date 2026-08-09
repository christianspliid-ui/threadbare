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
  type CompositionBlock,
  checkCompositionContract,
  systemConnections,
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

describe('Composition Contract — red on shipped content', () => {
  const bridge = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'encounter.slice.unsafe_bridge');

  it('the slice bridge template resolves (population guard)', () => {
    // Without this, every assertion below passes vacuously on `undefined`.
    expect(bridge).toBeDefined();
  });

  it('fails the contract, naming the aftermath block', () => {
    const violations = checkCompositionContract(bridge!).violations;
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.map(v => v.block)).toContain('aftermath');
  });

  it('every violation names where the rule is written down', () => {
    for (const violation of checkCompositionContract(bridge!).violations) {
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
