import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import type { GameState, PendingChoiceCommit } from '../../../types/gameState';
import type { PendingEncounterSeed } from '../../../types/unifiedAction';
import { phaseDetectionPressure } from '../phaseDetectionPressure';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agt', type: 'actor', properties: {} });
  graph.addNode({ id: 'loc.a', type: 'location', properties: { regionId: 'region.alpha' } });
  graph.addEdge({ id: 'edge.located.agt', type: 'located_at', source: 'agt', target: 'loc.a', properties: {} });
  return graph;
}

function makeCommit(overrides: Partial<PendingChoiceCommit> = {}): PendingChoiceCommit {
  return {
    agentId: 'agt',
    encounterId: 'fa.rivalry_confrontation',
    beatIndex: 0,
    reach: 'iron',
    cost: 'small_breath',
    moralAxisPole: 'virtue',
    effectiveProbability: 0.7,
    driftMagnitude: 0.05,
    ...overrides,
  };
}

function makeState(
  commits: PendingChoiceCommit[],
  pendingSeeds: PendingEncounterSeed[] = [],
): GameState {
  return {
    tick: 20,
    seed: 42,
    graph: makeGraph(),
    pendingChoiceCommits: commits,
    regionalDetectionPressure: [],
    regionDetection: [],
    pendingEncounterSeeds: pendingSeeds,
  } as unknown as GameState;
}

describe('phaseDetectionPressure', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('increments pressure from committed choices and mirrors legacy alias', () => {
    const result = phaseDetectionPressure(makeState([makeCommit()]));
    expect(result.updatedRegions).toBe(1);
    expect(result.regionalDetectionPressure).toHaveLength(1);
    expect(result.regionDetection).toEqual(result.regionalDetectionPressure);
    expect(result.regionalDetectionPressure[0]?.regionId).toBe('region.alpha');
  });

  it('emits detection threshold trace entries when crossing thresholds', () => {
    phaseDetectionPressure(makeState([makeCommit()]));
    const traces = getTraces().filter((trace) => trace.category === 'detection_threshold_crossed');
    expect(traces.length).toBeGreaterThanOrEqual(1);
    const encounterTrace = traces.find((trace) => (trace as { thresholdCrossed?: string }).thresholdCrossed === 'encounter');
    expect(encounterTrace).toBeDefined();
  });

  it('queues one rival-detection seed at encounter threshold crossing', () => {
    const result = phaseDetectionPressure(makeState([makeCommit({ cost: 'deep_draught' })]));
    expect(result.pendingEncounterSeeds).toHaveLength(1);
    expect(result.pendingEncounterSeeds[0]?.sourceReactionId).toBe('detection_threshold_encounter');
  });

  it('does not enqueue duplicate rival-detection seeds for the same region', () => {
    const existingSeed: PendingEncounterSeed = {
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
    const result = phaseDetectionPressure(makeState([makeCommit({ cost: 'deep_draught' })], [existingSeed]));
    expect(result.pendingEncounterSeeds).toHaveLength(1);
  });

  it('detection_threshold_crossed trace carries regionId, fromPressure, and toPressure', () => {
    phaseDetectionPressure(makeState([makeCommit()]));
    const trace = getTraces().find(t => t.category === 'detection_threshold_crossed') as Record<string, unknown> | undefined;
    expect(trace).toBeDefined();
    expect(typeof trace!['regionId']).toBe('string');
    expect(trace!['regionId']).toBe('region.alpha');
    expect(typeof trace!['fromPressure']).toBe('number');
    expect(typeof trace!['toPressure']).toBe('number');
  });

  it('applies per-tick decay even without new commits', () => {
    const state = makeState([]);
    state.regionalDetectionPressure = [{ regionId: 'region.alpha', pressure: 1, lastUpdatedTick: 10 }];
    state.regionDetection = [...state.regionalDetectionPressure];
    const result = phaseDetectionPressure(state);
    expect(result.updatedRegions).toBe(0);
    expect(result.regionalDetectionPressure[0]?.pressure).toBeLessThan(1);
  });
});
