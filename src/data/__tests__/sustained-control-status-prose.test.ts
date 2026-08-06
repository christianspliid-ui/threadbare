import { describe, it, expect } from 'vitest';
import {
  SUSTAINED_STATUS_LABELS,
  LAPSE_WARNING_TOOLTIPS,
  SUSTAIN_FLOW_BANDS,
  SUSTAIN_RUNWAY_BANDS,
  sustainFlowWord,
  sustainRunwayWord,
  sustainSummarySentences,
  getSustainedStatusLabel,
} from '../sustained-control-status-prose';
import { containsNumeral } from '../../engine/aftermathWords';
import {
  SUSTAIN_LAPSE_RISK_CRITICAL_TICKS,
  SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS,
} from '../../engine/retinue';

/**
 * THR-1008 — the sustained-control row is player-facing, so UI Law 13 ("no raw
 * magnitudes on any mortal-facing surface") binds every string it produces.
 * The row used to print `⤓ 12/tick` and a hover reading `Runway: ~6 ticks`.
 *
 * These are the machine checks Law 13 asks for on a new producer: the words
 * exist, they never carry a numeral, and the runway ladder cannot drift out of
 * agreement with the engine's own risk thresholds — which is the failure that
 * would let the bar read red while the words read comfortable.
 */
describe('sustained-control magnitude words (THR-1008)', () => {
  it('bands per-tick flow into words, never numerals', () => {
    for (const perTick of [0, 0.4, 1, 2.5, 3, 5.9, 6, 11, 12, 40, 1000]) {
      const word = sustainFlowWord(perTick);
      expect(word.length).toBeGreaterThan(0);
      expect(containsNumeral(word)).toBe(false);
    }
  });

  it('bands runway into words, and answers "indefinite" for a net-positive hold', () => {
    expect(sustainRunwayWord(Infinity)).toBe('indefinite');
    for (const ticks of [0, 1, 2, 3, 7, 8, 11, 12, 35, 36, 500]) {
      const word = sustainRunwayWord(ticks);
      expect(word.length).toBeGreaterThan(0);
      expect(containsNumeral(word)).toBe(false);
    }
  });

  it('a negative runway cannot fall off the bottom of the ladder', () => {
    // `runwayTicks` is clamped at 0 before banding, so a briefly-negative
    // reserve reads as "moments" rather than throwing or blanking.
    expect(sustainRunwayWord(-5)).toBe('moments');
  });

  it('runway bands agree with the engine risk thresholds, so words and bar colour cannot disagree', () => {
    // Below critical the bar is red; the word must read as the shortest rung.
    expect(sustainRunwayWord(SUSTAIN_LAPSE_RISK_CRITICAL_TICKS - 1)).toBe('moments');
    // Between critical and tightening the bar is amber.
    expect(sustainRunwayWord(SUSTAIN_LAPSE_RISK_CRITICAL_TICKS)).toBe('a few ticks');
    expect(sustainRunwayWord(SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS - 1)).toBe('a few ticks');
    // At or above tightening the bar is safe-coloured.
    expect(sustainRunwayWord(SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS)).toBe('most of a day');
  });

  it('both ladders are declared descending with a zero floor', () => {
    for (const bands of [SUSTAIN_FLOW_BANDS, SUSTAIN_RUNWAY_BANDS]) {
      const mins = bands.map(b => b.min);
      expect([...mins].sort((a, b) => b - a)).toEqual(mins);
      expect(mins[mins.length - 1]).toBe(0);
    }
  });

  it('the sustain hover is sentences without a numeral, key, or key:value strip', () => {
    const cases = [
      { perTickCostTotal: 0, perTickIncomeTotal: 0, netFlow: 0, runwayTicks: Infinity },
      { perTickCostTotal: 12, perTickIncomeTotal: 5, netFlow: -7, runwayTicks: 6 },
      { perTickCostTotal: 2, perTickIncomeTotal: 0, netFlow: -2, runwayTicks: 40 },
      { perTickCostTotal: 1, perTickIncomeTotal: 9, netFlow: 8, runwayTicks: Infinity },
    ];
    for (const node of cases) {
      const text = sustainSummarySentences(node);
      expect(containsNumeral(text)).toBe(false);
      // Law 16: no `Label: value` strip. The old hover led with `Runway:`.
      expect(text).not.toMatch(/\b\w+:\s/);
      expect(text.trim().endsWith('.')).toBe(true);
    }
  });

  it('the authored prose tables carry no numerals either', () => {
    for (const tooltip of Object.values(LAPSE_WARNING_TOOLTIPS)) {
      expect(containsNumeral(tooltip)).toBe(false);
    }
    for (const byRisk of Object.values(SUSTAINED_STATUS_LABELS)) {
      for (const label of Object.values(byRisk)) {
        expect(containsNumeral(label)).toBe(false);
      }
    }
  });

  it('an unknown template still resolves a status label rather than a key', () => {
    const templateId = 'template.that.does.not.exist';
    const label = getSustainedStatusLabel(templateId, 'critical');
    expect(label).toBe(SUSTAINED_STATUS_LABELS['__default__'].critical);
    // Law 14 — the fallback is authored prose, never the key echoed back.
    expect(label).not.toContain(templateId);
  });
});
