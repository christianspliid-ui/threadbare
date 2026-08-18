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

  it('emits no threshold trace for a single small breath (THR-963)', () => {
    // The ladder is graduated: one small breath is 0.15 of the way to NOTICE, not
    // past it. Before THR-963 this same call crossed notice, turn and encounter at
    // once, and this suite asserted that it did.
    phaseDetectionPressure(makeState([makeCommit()]));
    const traces = getTraces().filter((trace) => trace.category === 'detection_threshold_crossed');
    expect(traces).toHaveLength(0);
  });

  it('emits detection threshold traces band by band as pressure accumulates', () => {
    const commits = Array.from({ length: 7 }, () => makeCommit());
    phaseDetectionPressure(makeState(commits));
    const crossed = getTraces()
      .filter((trace) => trace.category === 'detection_threshold_crossed')
      .map((trace) => (trace as { thresholdCrossed?: string }).thresholdCrossed);
    // Each band arrives on its own choice, in order — never all three at once.
    expect(crossed).toEqual(['notice', 'turn', 'encounter']);
  });

  it('queues one rival-detection seed at encounter threshold crossing', () => {
    // Two deep draughts to saturate — one only reaches NOTICE (THR-963).
    const result = phaseDetectionPressure(makeState([
      makeCommit({ cost: 'deep_draught' }),
      makeCommit({ cost: 'deep_draught' }),
    ]));
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
    const result = phaseDetectionPressure(makeState(
      [makeCommit({ cost: 'deep_draught' }), makeCommit({ cost: 'deep_draught' })],
      [existingSeed],
    ));
    expect(result.pendingEncounterSeeds).toHaveLength(1);
  });

  it('detection_threshold_crossed trace carries regionId, fromPressure, and toPressure', () => {
    phaseDetectionPressure(makeState(Array.from({ length: 4 }, () => makeCommit())));
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
