/**
 * THR-1030 — the `?outcome=<band>` outcome-band review pin.
 *
 * The ticket's hard part is not forcing a band; it is that **a lever that cannot
 * fail is not evidence**. Pinning a band nobody authored would render the *base*
 * ending while the URL claimed a band, laundering exactly the defect THR-989 and
 * THR-973 exist to find. So the tests that matter here are the ones that falsify
 * the verdict: the `unauthored_band` and `outcome_diverged` cases below are
 * deliberately constructed to be reported as failures, and each asserts the
 * verdict is NOT `band_rendered`.
 *
 * THR-1509 sharpened the question from "does the template author the band" to
 * "does the PATH the action resolved on author the band". The forked fixture
 * below authors disjoint band sets on its two arms — the `swindler_found`
 * shape — so the per-template union reads as full coverage while each arm is
 * missing half. The falsifying test pins a band on the arm that lacks it and
 * asserts the verdict says so; a union-based verdict passes that test's
 * `templateBands` check and fails its `status` check, which is the regression
 * this file now exists to catch.
 *
 * The pin's application to live step resolution is covered separately by the
 * step-resolution suite; these pin the module contract and the verdict, which is
 * the half a green test could otherwise be vacuous about.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setOutcomePin,
  clearOutcomePin,
  getOutcomePin,
  outcomePinFor,
  authoredOutcomeBands,
  authoredOutcomeBandsOnPath,
  authoredOutcomeBandsOnVariant,
  reachableLosingBandsOnPath,
  recordOutcomePinVerdict,
  getOutcomePinVerdict,
  isReviewableOutcomeBand,
  FALLBACK_PATH_KEY,
  REVIEWABLE_OUTCOME_BANDS,
} from '../debugOutcomePin';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../types/encounter';

/**
 * A template shaped like `encounter.slice.unsafe_bridge`: choice-less, so every
 * authored band hangs off `fallback`. Only two bands are authored on purpose —
 * the untouched four are what the `unauthored_band` test asks for.
 */
function bandedTemplate(id = 'test.banded'): UnifiedActionTemplate {
  return {
    id,
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The river keeps moving under the bridge.',
        changes: [],
        byOutcome: {
          critical_success: { overview: 'The planks held without a sound.' },
          success_at_cost: { overview: 'A plank went end over end into the water.' },
        },
      },
    },
  } as unknown as UnifiedActionTemplate;
}

/**
 * A template shaped like `encounter.slice.swindler_found` at THR-1509's filing:
 * two arms authoring DISJOINT band sets, so the union reads as all four bands
 * while each arm carries two. `fallback` authors none, like the shipped forks.
 *
 * Steps: a plain step 0, then a fork whose `negative` arm is `fail_action` and
 * whose `positive` arm continues — so the two paths reach different losing bands.
 */
function forkedTemplate(id = 'test.forked'): UnifiedActionTemplate {
  const positiveStep = { reach: 'gold', difficulty: 0.4, failBehavior: 'continue_weakened', onSuccess: [], onFailure: [] };
  const negativeStep = { reach: 'iron', difficulty: 0.4, failBehavior: 'fail_action', onSuccess: [], onFailure: [] };
  return {
    id,
    steps: [
      { reach: 'eye', difficulty: 0.35, failBehavior: 'continue_weakened', onSuccess: [], onFailure: [] },
      { branchOnStep: 0, variants: { positive: positiveStep, negative: negativeStep }, fallback: positiveStep },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {
        positive: {
          overview: 'The town has the man.',
          changes: [],
          byOutcome: {
            critical_success: { overview: 'Taken mid-sentence.' },
            failure: { overview: 'The pitch was empty by the time a badge arrived.' },
          },
        },
        negative: {
          overview: 'The debt was collected in person.',
          changes: [],
          byOutcome: {
            success_at_cost: { overview: 'He paid, and not quietly.' },
            critical_failure: { overview: 'He had a knife and a friend.' },
          },
        },
      },
      fallback: {
        overview: 'The stalls fold and the pitch stays empty.',
        changes: [],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

/** A recorded choice at the fork's deciding step, the way `applyAgentDecidedBranches` writes one. */
function choice(choiceId: string, stepIndex = 0): EncounterChoiceMemory {
  return {
    stepIndex,
    stepId: `step-${stepIndex}`,
    choiceId,
    choiceText: choiceId,
    interventionType: 'branch',
    essenceSpent: 0,
    probabilityBoost: 0,
    tick: 0,
  };
}

/** A template with no authored aftermath at all. */
function bareTemplate(id = 'test.bare'): UnifiedActionTemplate {
  return { id } as unknown as UnifiedActionTemplate;
}

describe('THR-1030 — outcome-band review pin', () => {
  beforeEach(() => {
    clearOutcomePin();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    clearOutcomePin();
    vi.restoreAllMocks();
  });

  describe('arming the pin', () => {
    it('refuses an unknown band, warns once, and leaves nothing pinned', () => {
      expect(setOutcomePin('test.banded', 'catastrophe')).toBe(false);
      expect(getOutcomePin()).toBeNull();
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('accepts every band a reviewer may ask for', () => {
      for (const band of REVIEWABLE_OUTCOME_BANDS) {
        expect(isReviewableOutcomeBand(band), band).toBe(true);
        expect(setOutcomePin('test.banded', band), band).toBe(true);
      }
    });

    it('scopes the pin to ONE template — the rest of the world resolves normally', () => {
      setOutcomePin('test.banded', 'critical_failure');
      expect(outcomePinFor('test.banded')).toBe('critical_failure');
      expect(outcomePinFor('some.other.encounter')).toBeUndefined();
    });

    it('reports nothing pinned once cleared', () => {
      setOutcomePin('test.banded', 'success');
      clearOutcomePin();
      expect(outcomePinFor('test.banded')).toBeUndefined();
      expect(getOutcomePinVerdict()).toBeNull();
    });
  });

  describe('reading which bands exist', () => {
    it('enumerates the authored bands across variants and fallback', () => {
      expect([...authoredOutcomeBands(bandedTemplate())].sort()).toEqual(
        ['critical_success', 'success_at_cost'],
      );
    });

    it('returns an empty list for a template with no aftermathConfig', () => {
      expect(authoredOutcomeBands(bareTemplate())).toEqual([]);
      expect(authoredOutcomeBandsOnPath(bareTemplate())).toEqual({ variantKey: FALLBACK_PATH_KEY, bands: [] });
      expect(authoredOutcomeBandsOnVariant(bareTemplate(), 'positive')).toEqual([]);
    });
  });

  describe('THR-1509 — bands are read per PATH, not per template', () => {
    it('the per-template union reads as full coverage on a fork with disjoint arms', () => {
      // This is the number the old verdict trusted. It is true and it is the
      // wrong question — kept as a fixture assertion so the next reader sees
      // exactly what the union hides.
      expect([...authoredOutcomeBands(forkedTemplate())].sort()).toEqual(
        ['critical_failure', 'critical_success', 'failure', 'success_at_cost'],
      );
    });

    it('resolves the path from the choice history the way aftermath assembly does', () => {
      expect(authoredOutcomeBandsOnPath(forkedTemplate(), [choice('positive')])).toEqual({
        variantKey: 'positive',
        bands: ['critical_success', 'failure'],
      });
      expect(authoredOutcomeBandsOnPath(forkedTemplate(), [choice('negative')])).toEqual({
        variantKey: 'negative',
        bands: ['success_at_cost', 'critical_failure'],
      });
    });

    it('lands on fallback with no recorded choice, or a choice at another step', () => {
      expect(authoredOutcomeBandsOnPath(forkedTemplate())).toEqual({ variantKey: FALLBACK_PATH_KEY, bands: [] });
      // A choice recorded at a step that is not `branchOnStep` decides nothing.
      expect(authoredOutcomeBandsOnPath(forkedTemplate(), [choice('positive', 3)]).variantKey).toBe(FALLBACK_PATH_KEY);
    });

    it('reports the ARM key when a fork falls back onto one of its own arms', () => {
      // The shipped forks name a pole as their fallback. The ending on screen is
      // that pole's, so the verdict should say so rather than 'fallback'.
      const template = forkedTemplate();
      const config = template.aftermathConfig!;
      const aliased = {
        ...template,
        aftermathConfig: { ...config, fallback: config.variants.positive },
      } as UnifiedActionTemplate;
      expect(authoredOutcomeBandsOnPath(aliased).variantKey).toBe('positive');
    });

    it('reads a named arm directly for corpus gates', () => {
      expect(authoredOutcomeBandsOnVariant(forkedTemplate(), 'negative')).toEqual(['success_at_cost', 'critical_failure']);
      expect(authoredOutcomeBandsOnVariant(forkedTemplate(), FALLBACK_PATH_KEY)).toEqual([]);
      // An unknown key misses to fallback — the engine's own rule, not a throw.
      expect(authoredOutcomeBandsOnVariant(forkedTemplate(), 'sideways')).toEqual([]);
    });

    it('derives the losing bands a path can reach from its own steps', () => {
      // Every rolled path can critical-fail; only a `fail_action` step ends on `failure`.
      expect(reachableLosingBandsOnPath(forkedTemplate(), 'positive')).toEqual(['critical_failure']);
      expect(reachableLosingBandsOnPath(forkedTemplate(), 'negative')).toEqual(['critical_failure', 'failure']);
      // The fallback arm IS the positive step here, so it inherits that arm's reach.
      expect(reachableLosingBandsOnPath(forkedTemplate(), FALLBACK_PATH_KEY)).toEqual(['critical_failure']);
    });

    it('judges the fallback path when the config lookup itself throws (corpus shape)', () => {
      // A config with a recorded choice but no `variants` map makes the engine's
      // own lookup throw; a read-only diagnostic must not.
      const template = forkedTemplate();
      const noVariants = {
        ...template,
        aftermathConfig: { branchOnStep: 0, fallback: template.aftermathConfig!.fallback },
      } as unknown as UnifiedActionTemplate;
      expect(() => authoredOutcomeBandsOnPath(noVariants, [choice('positive')])).not.toThrow();
      expect(authoredOutcomeBandsOnPath(noVariants, [choice('positive')]).variantKey).toBe(FALLBACK_PATH_KEY);
    });
  });

  describe('the verdict — the half that must be able to fail', () => {
    it('reports band_rendered ONLY when the band is authored and the action landed on it', () => {
      setOutcomePin('test.banded', 'critical_success');
      const verdict = recordOutcomePinVerdict(bandedTemplate(), 'critical_success');

      expect(verdict?.status).toBe('band_rendered');
      expect(verdict?.variantKey).toBe(FALLBACK_PATH_KEY);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('FAILS LOUDLY on a band no variant authors, instead of passing off the base ending', () => {
      // 'success' is deliberately NOT in the template's byOutcome. The engine
      // renders the base ending here — a silent pass would be the laundering.
      setOutcomePin('test.banded', 'success');
      const verdict = recordOutcomePinVerdict(bandedTemplate(), 'success');

      expect(verdict?.status).toBe('unauthored_band');
      expect(verdict?.status).not.toBe('band_rendered');
      expect(verdict?.message).toContain('authors no band for it');
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('THR-1509 — FAILS LOUDLY on a band authored only on the OTHER arm of the fork', () => {
      // The swindler_found shape. `critical_failure` is authored on `negative`;
      // the action resolved on `positive`, whose base ending is on screen. The
      // union says the band exists — and the verdict must not believe it.
      setOutcomePin('test.forked', 'critical_failure');
      const verdict = recordOutcomePinVerdict(forkedTemplate(), 'critical_failure', [choice('positive')]);

      // The falsification arm: the OLD predicate (template union) would have
      // called this rendered. Assert that the union does contain the band, so a
      // regression back to the union is caught by the status assertion below
      // rather than by a fixture that happened not to author it anywhere.
      expect(verdict?.templateBands).toContain('critical_failure');

      expect(verdict?.status).toBe('unauthored_band');
      expect(verdict?.status).not.toBe('band_rendered');
      expect(verdict?.variantKey).toBe('positive');
      expect(verdict?.authoredBands).toEqual(['critical_success', 'failure']);
      expect(verdict?.message).toContain('"positive" path');
      expect(verdict?.message).toContain('elsewhere on this encounter: success_at_cost, critical_failure');
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).not.toHaveBeenCalled();
    });

    it('THR-1509 — renders the same band on the arm that DOES author it', () => {
      // The control arm: identical pin, identical outcome, the other choice.
      setOutcomePin('test.forked', 'critical_failure');
      const verdict = recordOutcomePinVerdict(forkedTemplate(), 'critical_failure', [choice('negative')]);

      expect(verdict?.status).toBe('band_rendered');
      expect(verdict?.variantKey).toBe('negative');
      expect(verdict?.message).toContain('on the "negative" path');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('THR-1509 — a fork with no recorded choice is judged on fallback, which authors nothing', () => {
      setOutcomePin('test.forked', 'failure');
      const verdict = recordOutcomePinVerdict(forkedTemplate(), 'failure');

      expect(verdict?.status).toBe('unauthored_band');
      expect(verdict?.variantKey).toBe(FALLBACK_PATH_KEY);
      expect(verdict?.authoredBands).toEqual([]);
    });

    it('FAILS LOUDLY when the action aggregated the pinned steps to a different outcome', () => {
      // A pinned `near_miss` step has no UnifiedActionOutcome counterpart at all —
      // it aggregates to success_at_cost — so it must never report as rendered.
      setOutcomePin('test.banded', 'near_miss');
      const verdict = recordOutcomePinVerdict(bandedTemplate(), 'success_at_cost');

      expect(verdict?.status).toBe('outcome_diverged');
      expect(verdict?.actualOutcome).toBe('success_at_cost');
      expect(verdict?.message).toContain('near_miss');
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('says so when the template authors no aftermath at all', () => {
      setOutcomePin('test.bare', 'critical_failure');
      const verdict = recordOutcomePinVerdict(bareTemplate(), 'critical_failure');

      expect(verdict?.status).toBe('no_aftermath_config');
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('records nothing for a template the pin does not name', () => {
      setOutcomePin('test.banded', 'critical_success');
      expect(recordOutcomePinVerdict(bandedTemplate('other.template'), 'success')).toBeNull();
      expect(getOutcomePinVerdict()).toBeNull();
    });

    it('records nothing at all when no pin is armed — the lever is inert by default', () => {
      expect(recordOutcomePinVerdict(bandedTemplate(), 'critical_success')).toBeNull();
      expect(getOutcomePinVerdict()).toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it('exposes the last verdict for the debug bridge', () => {
      setOutcomePin('test.banded', 'success_at_cost');
      recordOutcomePinVerdict(bandedTemplate(), 'success_at_cost');
      expect(getOutcomePinVerdict()?.status).toBe('band_rendered');
      expect(getOutcomePinVerdict()?.authoredBands).toContain('success_at_cost');
      expect(getOutcomePinVerdict()?.templateBands).toContain('success_at_cost');
    });
  });

  describe('the shipped slice is genuinely reviewable through this lever', () => {
    it('names bands that the real vertical-slice templates actually author', async () => {
      // Guards against the pin shipping over a corpus with nothing to review —
      // the "Layer 1" half of the ticket. If this ever returns nothing, the lever
      // is pointing at an empty corpus and the review would be vacuous.
      const { UNIFIED_ACTION_TEMPLATES } = await import('../../data/unified-action-templates');
      const banded = UNIFIED_ACTION_TEMPLATES
        .filter(t => authoredOutcomeBands(t).length > 0);

      expect(banded.length).toBeGreaterThan(0);
      const allBands = new Set(banded.flatMap(t => authoredOutcomeBands(t)));
      // Both poles of the ladder must be reachable, or the lever only reviews wins.
      expect([...allBands]).toEqual(expect.arrayContaining(['critical_success', 'critical_failure']));
    });

    it('THR-1509 — the sharp case is fixed on the real corpus: swindler_found renders both losing bands on both arms', async () => {
      // The ticket's measured defect. If either arm loses a losing band again,
      // the per-template union still reads as full coverage — only this
      // per-path read, the same one the verdict uses, notices.
      const { UNIFIED_ACTION_TEMPLATES } = await import('../../data/unified-action-templates');
      const swindler = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'encounter.slice.swindler_found');
      expect(swindler, 'swindler_found is no longer in the corpus').toBeDefined();

      for (const arm of ['positive', 'negative']) {
        setOutcomePin('encounter.slice.swindler_found', 'critical_failure');
        expect(recordOutcomePinVerdict(swindler!, 'critical_failure', [choice(arm)])?.status, `${arm}/critical_failure`).toBe('band_rendered');
        setOutcomePin('encounter.slice.swindler_found', 'failure');
        expect(recordOutcomePinVerdict(swindler!, 'failure', [choice(arm)])?.status, `${arm}/failure`).toBe('band_rendered');
      }
    });
  });
});
