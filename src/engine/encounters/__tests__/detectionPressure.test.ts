import { describe, expect, it } from 'vitest';
import type { EncounterChoiceCost } from '../../../types/traces/encounter-traces';
import {
  DETECTION_THRESHOLD_ENCOUNTER,
  DETECTION_THRESHOLD_NOTICE,
  DETECTION_THRESHOLD_TURN,
} from '../../../data/encounter-experience-constants';
import {
  applyDetectionDelta,
  baseDetectionDeltaForCost,
  decayDetectionPressure,
  getDetectionThresholdCrossings,
  MAX_DETECTION_PRESSURE,
} from '../detectionPressure';

const COSTS: readonly EncounterChoiceCost[] = ['small_breath', 'fuller_breath', 'deep_draught'];

/** The only multipliers `phaseDetectionPressure.resolveSphereVisibilityMultiplier` returns. */
const PHASE_VISIBILITY_MULTIPLIERS = [0.8, 1, 1.2] as const;

function bandFor(pressure: number): 'none' | 'notice' | 'turn' | 'encounter' {
  if (pressure >= DETECTION_THRESHOLD_ENCOUNTER) return 'encounter';
  if (pressure >= DETECTION_THRESHOLD_TURN) return 'turn';
  if (pressure >= DETECTION_THRESHOLD_NOTICE) return 'notice';
  return 'none';
}

/** Band the region sits in after 1..n repeats of the same choice, starting from zero. */
function bandsAfterRepeatedChoices(
  cost: EncounterChoiceCost,
  visibility: number,
  repeats: number,
): string[] {
  let pressure: ReturnType<typeof applyDetectionDelta>['regionalDetectionPressure'] = [];
  const bands: string[] = [];
  for (let index = 0; index < repeats; index += 1) {
    const result = applyDetectionDelta(pressure, 'region.a', cost, visibility, index + 1);
    pressure = result.regionalDetectionPressure;
    bands.push(bandFor(result.toPressure));
  }
  return bands;
}

describe('detectionPressure', () => {
  // Literals, not the constants — a test that reads the same constant the code
  // reads is a tautology and would have passed just as happily on the essence
  // costs this replaced (THR-963).
  it('maps choice cost tiers to base deltas on the 0-1 pressure scale', () => {
    expect(baseDetectionDeltaForCost('small_breath')).toBe(0.15);
    expect(baseDetectionDeltaForCost('fuller_breath')).toBe(0.3);
    expect(baseDetectionDeltaForCost('deep_draught')).toBe(0.5);
  });

  it('keeps every delta strictly inside the 0-1 pressure scale', () => {
    // The defect this pins: a delta >= 1 saturates the whole scale in one write.
    for (const cost of COSTS) {
      expect(baseDetectionDeltaForCost(cost)).toBeGreaterThan(0);
      expect(baseDetectionDeltaForCost(cost)).toBeLessThan(MAX_DETECTION_PRESSURE);
    }
  });

  it('applies delta and clamps at max pressure', () => {
    const first = applyDetectionDelta([], 'region.a', 'small_breath', 1, 10);
    expect(first.fromPressure).toBe(0);
    expect(first.toPressure).toBeCloseTo(0.15, 10);

    let running = first.regionalDetectionPressure;
    for (let index = 0; index < 4; index += 1) {
      running = applyDetectionDelta(running, 'region.a', 'deep_draught', 1.2, 11 + index)
        .regionalDetectionPressure;
    }
    expect(running[0]?.pressure).toBe(MAX_DETECTION_PRESSURE);
  });

  it('applies sphere visibility multiplier', () => {
    const result = applyDetectionDelta([], 'region.a', 'small_breath', 0.5, 10);
    expect(result.appliedDelta).toBeCloseTo(0.075, 10);
    expect(result.toPressure).toBeCloseTo(0.075, 10);
  });

  describe('threshold ladder (THR-963)', () => {
    it('reaches each band at a distinct choice count, per intensity', () => {
      // n choices -> the band the region sits in afterwards, at neutral sphere
      // visibility. Before THR-963 every one of these rows was ['encounter'].
      expect(bandsAfterRepeatedChoices('small_breath', 1, 7)).toEqual([
        'none', 'none', 'none', 'notice', 'notice', 'turn', 'encounter',
      ]);
      expect(bandsAfterRepeatedChoices('fuller_breath', 1, 4)).toEqual([
        'none', 'notice', 'turn', 'encounter',
      ]);
      // A deep draught is meant to be loud: noticed at once, saturated at two.
      expect(bandsAfterRepeatedChoices('deep_draught', 1, 2)).toEqual([
        'notice', 'encounter',
      ]);
    });

    it('never lets a single small breath cross more than one band, from any pressure', () => {
      for (const visibility of PHASE_VISIBILITY_MULTIPLIERS) {
        for (let start = 0; start <= 100; start += 1) {
          const from = start / 100;
          const result = applyDetectionDelta(
            [{ regionId: 'region.a', pressure: from, lastUpdatedTick: 0 }],
            'region.a',
            'small_breath',
            visibility,
            1,
          );
          const crossings = getDetectionThresholdCrossings(result.fromPressure, result.toPressure);
          expect(crossings.length).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  it('decays pressure toward zero', () => {
    const decayed = decayDetectionPressure(
      [{ regionId: 'region.a', pressure: 0.6, lastUpdatedTick: 3 }],
      0.1,
      4,
    );
    expect(decayed[0]?.pressure).toBeCloseTo(0.5, 10);
    expect(decayed[0]?.lastUpdatedTick).toBe(4);
  });

  it('reports upward threshold crossings only', () => {
    expect(getDetectionThresholdCrossings(0.1, 0.95)).toEqual(['notice', 'turn']);
    expect(getDetectionThresholdCrossings(0.7, 1.0)).toEqual(['turn', 'encounter']);
    expect(getDetectionThresholdCrossings(1.0, 0.8)).toEqual([]);
  });

  it('decays monotonically to floor across repeated ticks', () => {
    let pressure = [{ regionId: 'region.a', pressure: 1, lastUpdatedTick: 10 }];
    const seen: number[] = [];
    for (let tick = 11; tick <= 260; tick += 1) {
      pressure = decayDetectionPressure(pressure, 0.005, tick);
      seen.push(pressure[0]?.pressure ?? 0);
    }

    for (let index = 1; index < seen.length; index += 1) {
      expect(seen[index]).toBeLessThanOrEqual(seen[index - 1] + 1e-9);
    }
    expect(seen.at(-1)).toBe(0);
  });

  it('stays clamped at max pressure when repeatedly saturated', () => {
    const first = applyDetectionDelta([], 'region.a', 'deep_draught', 10, 10);
    const second = applyDetectionDelta(first.regionalDetectionPressure, 'region.a', 'deep_draught', 10, 11);

    expect(first.toPressure).toBe(MAX_DETECTION_PRESSURE);
    expect(second.fromPressure).toBe(MAX_DETECTION_PRESSURE);
    expect(second.toPressure).toBe(MAX_DETECTION_PRESSURE);
    expect(getDetectionThresholdCrossings(second.fromPressure, second.toPressure)).toEqual([]);
  });
});
