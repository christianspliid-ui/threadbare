import { beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { createSimulationRuntime } from '../simulationRuntime';
import type { BalanceEncounterPoolCandidate, BalanceEvent } from '../../types/balanceEval';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { getEncounterForeshadowing } from '../foreshadowing/encounterForeshadowing';

function makeDecision(candidate: BalanceEncounterPoolCandidate): BalanceEvent {
  return {
    seq: 1,
    tick: 12,
    kind: 'encounter_decision',
    agentId: 'agent-1',
    sourceSystem: 'unified_action',
    decisionType: 'start_local',
    filterCacheSize: 9,
    filterAfterAwareness: 6,
    filterAfterVisibility: 5,
    filterAfterPrerequisites: 4,
    filterAfterThreat: 3,
    filterAfterCap: 2,
    candidatesBeforeCooldown: 2,
    candidatesAfterCooldown: 1,
    rankedEncounterPool: [candidate],
  };
}

describe('encounter foreshadowing resolver', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  it('prefers the most specific authored variant over a broader one (THR-642)', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent-1',
      type: 'actor',
      name: 'Serafina',
      properties: {
        actorType: 'individual',
        primaryReach: 'eye',
        interventionHistory: [],
      },
    });

    const runtime = createSimulationRuntime();
    const candidate: BalanceEncounterPoolCandidate = {
      rank: 1,
      templateId: 'encounter.plague_outbreak',
      templateName: 'Plague Outbreak',
      locationId: 'location-ashmarket',
      locationName: 'Ashmarket',
      action: 'start_local',
      reachPrimary: 'eye',
      reachSecondary: 'heart',
      encounterType: 'assist',
      threatBand: 'hard',
      stepCount: 2,
      totalTickCost: 5,
      rewardEstimate: 0.65,
      completionProb: 0.64,
      travelCost: 0,
      finalScore: 1.2,
      selected: true,
    };

    const result = getEncounterForeshadowing({
      runtime,
      graph,
      tick: 12,
      agentId: 'agent-1',
      decision: makeDecision(candidate),
      candidate,
    });

    // Signals here are intelligenceTier:'briefed', topMotive:'awareness',
    // dominantReach:'eye' — which two authored variants match: `briefed`
    // (1 clause) and `healer_curiosity` (2 clauses). Before THR-642 this path
    // scanned first-match and returned `briefed` purely because it is listed
    // earlier; the unified selector picks the more specific variant instead, so
    // authoring order no longer decides the winner.
    expect(result.variantId).toBe('plague_outbreak.healer_curiosity');
    expect(result.prose).toContain('Serafina');
    const traces = getTraces().filter(trace => trace.category === 'foreshadowing');
    expect(traces).toHaveLength(1);
    expect(traces[0].summary).toContain('encounter.plague_outbreak');
  });

  it('grounds an authored variant at the candidate location', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent-1',
      type: 'actor',
      name: 'Serafina',
      properties: {
        actorType: 'individual',
        primaryReach: 'heart',
        interventionHistory: [],
      },
    });

    const runtime = createSimulationRuntime();
    // reachPrimary 'heart' excludes the eye-gated `healer_curiosity` variant, so
    // `briefed` wins alone — it is the variant carrying {encounter_location}.
    const candidate: BalanceEncounterPoolCandidate = {
      rank: 1,
      templateId: 'encounter.plague_outbreak',
      templateName: 'Plague Outbreak',
      locationId: 'location-ashmarket',
      locationName: 'Ashmarket',
      action: 'start_local',
      reachPrimary: 'heart',
      reachSecondary: 'eye',
      encounterType: 'assist',
      threatBand: 'hard',
      stepCount: 2,
      totalTickCost: 5,
      rewardEstimate: 0.65,
      completionProb: 0.64,
      travelCost: 0,
      finalScore: 1.2,
      selected: true,
    };

    const result = getEncounterForeshadowing({
      runtime,
      graph,
      tick: 12,
      agentId: 'agent-1',
      decision: makeDecision(candidate),
      candidate,
    });

    expect(result.variantId).toBe('plague_outbreak.briefed');
    expect(result.prose).toContain('Ashmarket');
    // THR-642: the agent/pronoun placeholder pass used to be tooltip-only, so
    // authored variants rendered here shipped raw tokens to the player.
    expect(result.prose).toContain('Serafina');
    expect(result.prose).not.toMatch(/\{[a-z_.]+\}/i);
  });

  it('reuses cache on second call and emits cache-hit trace', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent-1',
      type: 'actor',
      name: 'Serafina',
      properties: {
        actorType: 'individual',
        primaryReach: 'eye',
        interventionHistory: [],
      },
    });

    const runtime = createSimulationRuntime();
    const candidate: BalanceEncounterPoolCandidate = {
      rank: 1,
      templateId: 'encounter.plague_outbreak',
      templateName: 'Plague Outbreak',
      locationId: 'location-ashmarket',
      locationName: 'Ashmarket',
      action: 'start_local',
      reachPrimary: 'eye',
      reachSecondary: 'heart',
      encounterType: 'assist',
      threatBand: 'hard',
      stepCount: 2,
      totalTickCost: 5,
      rewardEstimate: 0.65,
      completionProb: 0.64,
      travelCost: 0,
      finalScore: 1.2,
      selected: true,
    };
    const request = {
      runtime,
      graph,
      tick: 14,
      agentId: 'agent-1',
      decision: makeDecision(candidate),
      candidate,
    };

    const first = getEncounterForeshadowing(request);
    const second = getEncounterForeshadowing(request);

    expect(second).toEqual(first);
    const traces = getTraces().filter(trace => trace.category === 'foreshadowing');
    expect(traces).toHaveLength(2);
    expect((traces[1] as { cacheHit?: boolean }).cacheHit).toBe(true);
  });
});
