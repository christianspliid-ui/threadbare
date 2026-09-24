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
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { disableTracing } from '../../engine/traceBuffer';
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

  it('stamps the fixtures to the sim\'s profile', () => {
    expect(report.capability.strong.clash).toBeGreaterThan(0.99);
    expect(report.capability.strong.nerve).toBeCloseTo(0.89, 2);
    expect(report.capability.weak.nerve).toBeCloseTo(0.89, 2);
    expect(report.capability.weak.clash).toBeLessThan(report.capability.strong.clash);
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
