/**
 * THR-1543 (fight block FB7) — the fight calibration as a standing guard.
 *
 * 400 seeded fights of `fight.lair.confront` through the real road, against
 * THR-1531's "Major elite" row fought by its "bold guard". Every result class must
 * sit within ±10 points of the row (about 4σ at n = 400). If this fails, the plan
 * doc's kill criterion applies: diagnose (a double-counted modifier, the generic
 * consequence not skipped) before touching a tunable. `npm run calibrate:fights`
 * prints the same distribution.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { disableTracing } from '../../engine/traceBuffer';
import {
  FIGHT_CALIBRATION_CLASSES,
  FIGHT_CALIBRATION_FIGHTS,
  FIGHT_CALIBRATION_TOLERANCE,
  runFightCalibration,
  type FightCalibrationReport,
} from '../fightCalibration';
import { ODDS_AT_PAR, ODDS_GAIN } from '../../engine/resolutionService';

describe('fight calibration against THR-1531 (Major elite × bold guard)', () => {
  let report: FightCalibrationReport;
  beforeAll(() => {
    disableTracing();
    report = runFightCalibration(FIGHT_CALIBRATION_FIGHTS);
  });

  it('stamps the fixture fighter to the row odds (THR-1581: odds preserved, not capability)', () => {
    // A steep step (0.50) rolled 0.999 − 0.50 = 0.499 and 0.89 − 0.50 = 0.39 before
    // modifiers on `main`; the re-stamp rolls the same on the re-fitted dice.
    expect(ODDS_AT_PAR + ODDS_GAIN * (report.fighterCapability.clash - 0.5)).toBeCloseTo(0.499, 2);
    expect(ODDS_AT_PAR + ODDS_GAIN * (report.fighterCapability.nerve - 0.5)).toBeCloseTo(0.39, 2);
  });

  it.each(FIGHT_CALIBRATION_CLASSES)('%s sits within ±10 points of the row', (cls) => {
    expect(
      Math.abs(report.deviation[cls]),
      `${cls}: ${report.percent[cls].toFixed(1)}% vs target (Δ ${report.deviation[cls].toFixed(1)})`,
    ).toBeLessThanOrEqual(FIGHT_CALIBRATION_TOLERANCE);
  });

  it('is deterministic: the same seed fights the same fights', () => {
    const again = runFightCalibration(40, 7);
    expect(runFightCalibration(40, 7).counts).toEqual(again.counts);
  });
});
