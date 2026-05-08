import { describe, expect, it } from 'vitest';
import {
  applyDetectionDelta,
  baseDetectionDeltaForCost,
  decayDetectionPressure,
  getDetectionThresholdCrossings,
  MAX_DETECTION_PRESSURE,
} from '../detectionPressure';

describe('detectionPressure', () => {
  it('maps choice cost tiers to base deltas', () => {
    expect(baseDetectionDeltaForCost('small_breath')).toBe(1);
    expect(baseDetectionDeltaForCost('fuller_breath')).toBe(2);
    expect(baseDetectionDeltaForCost('deep_draught')).toBe(3);
  });

  it('applies delta and clamps at max pressure', () => {
    const first = applyDetectionDelta([], 'region.a', 'small_breath', 1, 10);
    expect(first.fromPressure).toBe(0);
    expect(first.toPressure).toBe(1);

    const second = applyDetectionDelta(first.regionalDetectionPressure, 'region.a', 'deep_draught', 1.2, 11);
    expect(second.toPressure).toBe(MAX_DETECTION_PRESSURE);
  });

  it('applies sphere visibility multiplier', () => {
    const result = applyDetectionDelta([], 'region.a', 'small_breath', 0.5, 10);
    expect(result.appliedDelta).toBeCloseTo(0.5, 10);
    expect(result.toPressure).toBeCloseTo(0.5, 10);
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
