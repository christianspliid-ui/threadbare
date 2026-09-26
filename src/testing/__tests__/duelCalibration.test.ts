/**
 * THR-1556 (Duels E1) — the duel calibration as a standing guard.
 *
 * 400 seeded duels of `fight.duel.grudge` through the real road between two bold
 * fixture mortals (strong raw clash 30 as the actor, weak raw clash exactly 15, both
 * with Heart at ≈ 0.89, complications off, everything reset between duels). The
 * four named classes of THR-1264's row must sit within ±8 points, and bold
 * duellists must never yield. If this fails, the plan doc's kill criterion applies:
 * diagnose (a double-counted opponent modifier, the matrix off by one band, the
 * concession fork reading the wrong side's courage) before touching a tunable.
 * `npm run calibrate:duels` prints the same distribution.
 *
 * THR-1581 / THR-1628 (dice re-fit): each duellist's derived card is pinned at
 * `main`'s words through the harness-only card seam, and each side's clash and nerve
 * dice are stamped to `main`'s odds — so the four named classes are gated again.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { disableTracing } from '../../engine/traceBuffer';
import { deriveMightWord } from '../../engine/fights/opponentCard';
import { ODDS_AT_PAR, ODDS_GAIN } from '../../engine/resolutionService';
import { FIGHT_RATING_DIFFICULTY } from '../../data/fight-constants';
import {
  DUEL_CALIBRATION_CLASSES,
  DUEL_CALIBRATION_DUELS,
  DUEL_CALIBRATION_GATED,
  DUEL_CALIBRATION_TOLERANCE,
  runDuelCalibration,
  type DuelCalibrationReport,
} from '../duelCalibration';

describe('duel calibration against THR-1264 (bold strong × bold weak)', () => {
  let report: DuelCalibrationReport;
  beforeAll(() => {
    disableTracing();
    report = runDuelCalibration(DUEL_CALIBRATION_DUELS);
  });

  it('keeps the derived cards and the nerve odds of main (THR-1581)', () => {
    // The clash raw pins are unchanged, so each side's derived Might reads as on main.
    expect(deriveMightWord(30)).toBe('severe');
    expect(deriveMightWord(15)).toBe('fair');
    // Nerve: main rolled 0.89 − dread. Strong faces gentle (0.20), weak faces steep (0.50).
    expect(ODDS_AT_PAR + ODDS_GAIN * (report.capability.strong.nerve - 0.20)).toBeCloseTo(0.89 - 0.20, 2);
    expect(ODDS_AT_PAR + ODDS_GAIN * (report.capability.weak.nerve - 0.50)).toBeCloseTo(0.89 - 0.50, 2);
    expect(report.capability.weak.clash).toBeLessThan(report.capability.strong.clash);
  });

  it('pins the cards at main\'s words and keeps both sides\' clash odds (THR-1628)', () => {
    expect(report.card.strong).toEqual({ might: 'severe', dread: 'steep' });
    expect(report.card.weak).toEqual({ might: 'fair', dread: 'gentle' });
    // Main rolled clash capability − Might faced; the re-fitted dice must roll the same.
    const clashOdds = (capability: number, might: 'severe' | 'fair') =>
      ODDS_AT_PAR + ODDS_GAIN * (capability - FIGHT_RATING_DIFFICULTY[might]);
    expect(clashOdds(report.capability.strong.clash, 'fair'))
      .toBeCloseTo(report.mainClashCapability.strong - FIGHT_RATING_DIFFICULTY.fair, 2);
    expect(clashOdds(report.capability.weak.clash, 'severe'))
      .toBeCloseTo(report.mainClashCapability.weak - FIGHT_RATING_DIFFICULTY.severe, 2);
    // Main's clash capabilities: raw 30 and 15 on the pre-refit curve.
    expect(report.mainClashCapability.strong).toBeCloseTo(1.0, 3);
    expect(report.mainClashCapability.weak).toBeCloseTo(0.881, 3);
  });

  it('every duel falls in exactly one class', () => {
    const total = DUEL_CALIBRATION_CLASSES.reduce((sum, cls) => sum + report.counts[cls], 0);
    expect(total).toBe(DUEL_CALIBRATION_DUELS);
  });

  it.each(DUEL_CALIBRATION_GATED)('%s sits within ±8 points of the row', (cls) => {
    expect(
      Math.abs(report.deviation[cls]),
      `${cls}: ${report.percent[cls].toFixed(1)}% vs target (Δ ${report.deviation[cls].toFixed(1)})`,
    ).toBeLessThanOrEqual(DUEL_CALIBRATION_TOLERANCE);
  });

  it('bold duellists never yield', () => {
    expect(report.counts.yielded).toBe(0);
  });

  it('is deterministic: the same seed fights the same duels', () => {
    expect(runDuelCalibration(40, 7).counts).toEqual(runDuelCalibration(40, 7).counts);
  });
});
