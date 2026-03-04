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
import {
  createMortalDetectionState,
  processMortalDetection,
  getMortalAwarenessLevel,
  decayMortalSuspicion,
  createRivalDetectionState,
  processRivalDetection,
  getRivalAwarenessLevel,
  decayRivalScrutiny,
} from '../stealth';

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

describe('mortal detection engine', () => {
  it('createMortalDetectionState returns clean state', () => {
    const state = createMortalDetectionState('actor_1');
    expect(state.suspicionScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
    expect(state.detectionEvents.length).toBe(0);
  });

  it('processMortalDetection adds score and may escalate awareness', () => {
    let state = createMortalDetectionState('actor_1');

    // Dream detected: +0.5
    state = processMortalDetection(state, 'dream', 1);
    expect(state.suspicionScore).toBeCloseTo(0.5);
    expect(state.awarenessLevel).toBe('unaware');

    // Multiple coincidence detections push to suspicion (3.0 each, threshold at 3.0)
    state = processMortalDetection(state, 'coincidence', 2);
    expect(state.suspicionScore).toBeCloseTo(3.5); // 0.5 + 3.0
    expect(state.awarenessLevel).toBe('suspicion');
  });

  it('escalates through all levels with enough detections', () => {
    let state = createMortalDetectionState('actor_1');

    // Push past revelation threshold (15.0) with afflict_bless (2.5 each)
    for (let tick = 1; tick <= 7; tick++) {
      state = processMortalDetection(state, 'afflict_bless', tick);
    }
    // 7 × 2.5 = 17.5
    expect(state.suspicionScore).toBeCloseTo(17.5);
    expect(state.awarenessLevel).toBe('revelation');
    expect(state.detectionEvents.length).toBe(7);
  });

  it('getMortalAwarenessLevel returns correct level for score', () => {
    expect(getMortalAwarenessLevel(0)).toBe('unaware');
    expect(getMortalAwarenessLevel(2.9)).toBe('unaware');
    expect(getMortalAwarenessLevel(3.0)).toBe('suspicion');
    expect(getMortalAwarenessLevel(7.9)).toBe('suspicion');
    expect(getMortalAwarenessLevel(8.0)).toBe('realization');
    expect(getMortalAwarenessLevel(14.9)).toBe('realization');
    expect(getMortalAwarenessLevel(15.0)).toBe('revelation');
  });

  it('decayMortalSuspicion reduces score but not below zero', () => {
    let state = createMortalDetectionState('actor_1');
    state.suspicionScore = 5.0;
    state.awarenessLevel = 'suspicion';

    state = decayMortalSuspicion(state, 0.5);
    expect(state.suspicionScore).toBeCloseTo(4.5);

    // Decay a lot
    state = decayMortalSuspicion(state, 10.0);
    expect(state.suspicionScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
  });
});

describe('rival detection engine', () => {
  it('createRivalDetectionState returns clean state', () => {
    const state = createRivalDetectionState('actor_rival_1', 'loc_region_1');
    expect(state.scrutinyScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
  });

  it('processRivalDetection adds score based on intervention type', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');

    // Coincidence detected by rival: +3.0
    state = processRivalDetection(state, 'coincidence', 1);
    expect(state.scrutinyScore).toBeCloseTo(3.0);
    expect(state.awarenessLevel).toBe('unaware'); // threshold is 5.0
  });

  it('escalates through rival awareness levels', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');

    // Push past targeted (20.0): 8 × coincidence (3.0) = 24.0
    for (let tick = 1; tick <= 8; tick++) {
      state = processRivalDetection(state, 'coincidence', tick);
    }
    expect(state.scrutinyScore).toBeCloseTo(24.0);
    expect(state.awarenessLevel).toBe('targeted');
  });

  it('getRivalAwarenessLevel returns correct level for score', () => {
    expect(getRivalAwarenessLevel(0)).toBe('unaware');
    expect(getRivalAwarenessLevel(4.9)).toBe('unaware');
    expect(getRivalAwarenessLevel(5.0)).toBe('noticed');
    expect(getRivalAwarenessLevel(11.9)).toBe('noticed');
    expect(getRivalAwarenessLevel(12.0)).toBe('identified');
    expect(getRivalAwarenessLevel(19.9)).toBe('identified');
    expect(getRivalAwarenessLevel(20.0)).toBe('targeted');
  });

  it('decayRivalScrutiny reduces score but not below zero', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');
    state.scrutinyScore = 10.0;
    state.awarenessLevel = 'noticed';

    state = decayRivalScrutiny(state, 6.0);
    expect(state.scrutinyScore).toBeCloseTo(4.0);
    expect(state.awarenessLevel).toBe('unaware');
  });
});
