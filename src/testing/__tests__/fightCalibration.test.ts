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

describe('fight calibration against THR-1531 (Major elite × bold guard)', () => {
  let report: FightCalibrationReport;
  beforeAll(() => {
    disableTracing();
    report = runFightCalibration(FIGHT_CALIBRATION_FIGHTS);
  });

  it('stamps the fixture fighter to the row\'s profile', () => {
    expect(report.fighterCapability.clash).toBeGreaterThan(0.99);
    expect(report.fighterCapability.nerve).toBeCloseTo(0.89, 2);
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
