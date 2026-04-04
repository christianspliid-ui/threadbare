import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import type { GameState } from '../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

function createMinimalGameState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Ashara',
    properties: { actorType: 'individual' },
  });

  return {
    tick: 20,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map<string, ClearanceGateRuntimeState>([
      ['gate-1', {
        runtimeId: 'gate-1',
        templateId: 'cg.quest.gate_duty',
        gateId: 'checkpoint_clearance',
        anchorLocationId: 'loc.town',
        subjectNodeId: 'npc.courier',
        authorityNodeId: 'npc.captain',
        witnessNodeIds: ['npc.witness'],
        locationNodeId: 'loc.gatehouse',
        persistence: 'must-persist',
        state: 'cleared',
        revealedSignalKeys: ['witness_pressure'],
        followOnTags: ['#watch_trusted'],
        attempts: 2,
        lastUpdatedTick: 20,
        history: [],
      }],
    ]),
  } as GameState;
}

describe('applyEncounterAftermathReaction', () => {
  it('applies general aftermath effects back into the world model', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_gate_duty',
      actorId: 'actor-1',
      templateId: 'cg.quest.gate_duty',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 2,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success', 'success', 'success'],
      clearanceGateIds: ['gate-1'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'follow_witness_story',
      label: "Follow the witness's telling",
      effects: [
        { kind: 'reputation_score', delta: 0.03 },
        { kind: 'reputation_tally', key: 'gate_duty.witness_story_followed', delta: 1 },
        { kind: 'clearance_gate_tag', tag: '#witness_story_followed' },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'You keep a finger on the witness’s telling as it leaves the gate.',
          significance: 0.61,
        },
      ],
      closeAfterSelection: true,
    };

    const updated = applyEncounterAftermathReaction(state, action, reaction, 20);
    const actor = updated.graph.getNode('actor-1');
    expect((actor?.properties?.reputationScore as number | undefined) ?? 0).toBeGreaterThan(0);
    expect((actor?.properties?.reputationTallies as Record<string, number>)['gate_duty.witness_story_followed']).toBe(1);
    expect(updated.clearanceGateStates?.get('gate-1')?.followOnTags).toContain('#witness_story_followed');
    expect(updated.recentEvents.at(-1)?.message).toContain('witness’s telling');
    expect(updated.tickEvents.at(-1)?.type).toBe('ripple_consequence');
  });
});
