import { describe, it, expect } from 'vitest';
import type {
  MortalAwarenessLevel,
  RivalAwarenessLevel,
  MortalDetectionState,
  RivalDetectionState,
  DetectionEvent,
} from '../../types/stealth';
import {
  MORTAL_AWARENESS_THRESHOLDS,
  RIVAL_AWARENESS_THRESHOLDS,
} from '../../types/stealth';

describe('Stealth type definitions', () => {
  it('mortal awareness thresholds are ordered ascending', () => {
    expect(MORTAL_AWARENESS_THRESHOLDS.suspicion).toBeLessThan(
      MORTAL_AWARENESS_THRESHOLDS.realization,
    );
    expect(MORTAL_AWARENESS_THRESHOLDS.realization).toBeLessThan(
      MORTAL_AWARENESS_THRESHOLDS.revelation,
    );
  });

  it('rival awareness thresholds are ordered ascending', () => {
    expect(RIVAL_AWARENESS_THRESHOLDS.noticed).toBeLessThan(
      RIVAL_AWARENESS_THRESHOLDS.identified,
    );
    expect(RIVAL_AWARENESS_THRESHOLDS.identified).toBeLessThan(
      RIVAL_AWARENESS_THRESHOLDS.targeted,
    );
  });

  it('MortalDetectionState has correct shape', () => {
    const state: MortalDetectionState = {
      actorId: 'actor_1',
      suspicionScore: 0,
      awarenessLevel: 'unaware',
      detectionEvents: [],
    };
    expect(state.awarenessLevel).toBe('unaware');
  });

  it('RivalDetectionState has correct shape', () => {
    const state: RivalDetectionState = {
      rivalId: 'actor_rival_1',
      regionId: 'loc_region_1',
      scrutinyScore: 0,
      awarenessLevel: 'unaware',
      detectionEvents: [],
    };
    expect(state.awarenessLevel).toBe('unaware');
  });
});
