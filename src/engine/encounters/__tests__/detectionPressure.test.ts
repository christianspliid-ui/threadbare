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
});
