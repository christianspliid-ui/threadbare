import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import type { GameState, RegionDetectionState } from '../../../types/gameState';
import type { PendingEncounterSeed } from '../../../types/unifiedAction';
import { phaseDetectionPressure, recordDetectionCrossings } from '../phaseDetectionPressure';

const REGION = 'region.alpha';

function makeState(
  pressure: RegionDetectionState[] = [],
  pendingSeeds: PendingEncounterSeed[] = [],
): GameState {
  return {
    tick: 20,
    seed: 42,
    graph: new WorldGraph(),
    regionalDetectionPressure: pressure,
    regionDetection: [...pressure],
    pendingEncounterSeeds: pendingSeeds,
  } as unknown as GameState;
}

function existingSeed(): PendingEncounterSeed {
  return {
    seedId: 'detection.escalation.region.alpha.19.agt',
    sourceEncounterId: 'detection.escalation.region.alpha',
    sourceReactionId: 'detection_threshold_encounter',
    encounterFamily: 'shadow.rival_strike',
    targetAgentId: 'agt',
    eligibleAfterTick: 19,
    priority: 100,
    seedLabel: 'existing',
    plantedTick: 19,
  };
}

function crossedBands(): Array<string | undefined> {
  return getTraces()
    .filter((trace) => trace.category === 'detection_threshold_crossed')
    .map((trace) => (trace as { thresholdCrossed?: string }).thresholdCrossed);
}

describe('phaseDetectionPressure', () => {
  it('applies per-tick decay and mirrors the legacy alias', () => {
    const state = makeState([{ regionId: REGION, pressure: 1, lastUpdatedTick: 10 }]);
    const result = phaseDetectionPressure(state);
    expect(result.updatedRegions).toBe(0);
    expect(result.regionalDetectionPressure[0]?.pressure).toBeLessThan(1);
    expect(result.regionDetection).toEqual(result.regionalDetectionPressure);
  });

  it('passes the seed queue through untouched', () => {
    const seed = existingSeed();
    const result = phaseDetectionPressure(makeState([], [seed]));
    expect(result.pendingEncounterSeeds).toEqual([seed]);
  });
});

// THR-964: the crossing-and-seed block, extracted from the retired choice-commit loop.
// LEAKED until THR-1690: these pin the helper alone; no production writer calls it yet.
describe('recordDetectionCrossings', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('emits nothing and returns the same queue when no band is crossed', () => {
    const seeds: PendingEncounterSeed[] = [];
    const result = recordDetectionCrossings(20, REGION, 0, 0.3, 'agt', seeds);
    expect(crossedBands()).toEqual([]);
    expect(result).toBe(seeds);
  });

  it('emits one trace per band crossed, in order', () => {
    recordDetectionCrossings(20, REGION, 0.4, 1, 'agt', []);
    expect(crossedBands()).toEqual(['notice', 'turn', 'encounter']);
  });

  it('carries regionId and the pressure span on the trace', () => {
    recordDetectionCrossings(20, REGION, 0.4, 0.6, 'agt', []);
    const trace = getTraces().find((t) => t.category === 'detection_threshold_crossed') as Record<string, unknown> | undefined;
    expect(trace).toBeDefined();
    expect(trace!['regionId']).toBe(REGION);
    expect(trace!['fromPressure']).toBe(0.4);
    expect(trace!['toPressure']).toBe(0.6);
  });

  it('plants one rival-detection seed on the target when ENCOUNTER is reached', () => {
    const result = recordDetectionCrossings(20, REGION, 0.9, 1, 'agt', []);
    expect(result).toHaveLength(1);
    expect(result[0]?.sourceReactionId).toBe('detection_threshold_encounter');
    expect(result[0]?.encounterFamily).toBe('shadow.rival_strike');
    expect(result[0]?.targetAgentId).toBe('agt');
  });

  it('plants no seed below ENCOUNTER', () => {
    const result = recordDetectionCrossings(20, REGION, 0.4, 0.9, 'agt', []);
    expect(result).toHaveLength(0);
  });

  it('does not plant a duplicate seed for a region that already has one pending', () => {
    const result = recordDetectionCrossings(20, REGION, 0.9, 1, 'agt', [existingSeed()]);
    expect(result).toHaveLength(1);
  });
});
