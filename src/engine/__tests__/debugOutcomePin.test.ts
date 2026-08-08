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
  recordOutcomePinVerdict,
  getOutcomePinVerdict,
  isReviewableOutcomeBand,
  REVIEWABLE_OUTCOME_BANDS,
} from '../debugOutcomePin';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

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
    });
  });

  describe('the verdict — the half that must be able to fail', () => {
    it('reports band_rendered ONLY when the band is authored and the action landed on it', () => {
      setOutcomePin('test.banded', 'critical_success');
      const verdict = recordOutcomePinVerdict(bandedTemplate(), 'critical_success');

      expect(verdict?.status).toBe('band_rendered');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('FAILS LOUDLY on a band no variant authors, instead of passing off the base ending', () => {
      // 'success' is deliberately NOT in the template's byOutcome. The engine
      // renders the base ending here — a silent pass would be the laundering.
      setOutcomePin('test.banded', 'success');
      const verdict = recordOutcomePinVerdict(bandedTemplate(), 'success');

      expect(verdict?.status).toBe('unauthored_band');
      expect(verdict?.status).not.toBe('band_rendered');
      expect(verdict?.message).toContain('no variant authors that band');
      expect(console.warn).toHaveBeenCalledTimes(1);
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
  });
});
