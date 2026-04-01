/**
 * Integration test for phaseEncounterVisibility — TB-035 Phase 4.
 *
 * Tests the full orchestrator phase: GameState with encounterProgress + thread
 * edges → EncounterNotification[]. This is the layer that was always missing
 * from the unit tests (which only covered the helper functions).
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseEncounterVisibility } from '../encounterVisibility';
import type { GameState } from '../../types/gameState';
import type { EncounterProgress } from '../../types/encounter';
import type { ThreadEdgeProperties } from '../../types/influence';

// ─── Test Fixtures ─────────────────────────────────────────────────

function makeGraph(courtPosition: string | null = 'retinue'): WorldGraph {
  const g = new WorldGraph();

  g.addNode({
    id: 'asc_1', name: 'The God', type: 'actor', category: 'ascendant',
    properties: { actorType: 'ascendant' },
  });
  g.addNode({
    id: 'agent_1', name: 'Ashara', type: 'actor', category: 'individual',
    properties: { actorType: 'individual' },
  });
  g.addNode({
    id: 'loc_1', name: 'Bitter Ruins', type: 'location', category: 'dungeon',
    properties: {},
  });

  // located_at edge so getAgentLocation resolves
  g.addEdge({
    id: 'loc_edge_1', source: 'agent_1', target: 'loc_1', type: 'located_at',
    properties: {},
  });

  if (courtPosition !== null) {
    g.addEdge({
      id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
      properties: {
        courtPosition,
        tier: 2,
        attentionMode: 'pause',
        ticksAtCurrentTier: 5,
        establishedTick: 1,
        totalEssenceSpent: 10,
        maintenanceCurrent: true,
        readBackstoryTier: 0,
      } as ThreadEdgeProperties,
    });
  }

  return g;
}

function makeActiveEncounter(actorId = 'agent_1', encounterId = 'delve_ruins'): EncounterProgress {
  return {
    encounterId,
    actorId,
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: 1,
  };
}

function makeState(overrides: Partial<{
  graph: WorldGraph;
  encounterProgress: EncounterProgress[];
  encounterNotifications: GameState['encounterNotifications'];
  courtPosition: string | null;
}> = {}): GameState {
  const graph = overrides.graph ?? makeGraph(overrides.courtPosition ?? 'retinue');
  return {
    graph,
    ascendantId: 'asc_1',
    tick: 10,
    encounterProgress: overrides.encounterProgress ?? [makeActiveEncounter()],
    encounterNotifications: overrides.encounterNotifications ?? [],
    unifiedActions: [],
    // Minimal required fields — the phase only reads the above
  } as unknown as GameState;
}

// ─── phaseEncounterVisibility ──────────────────────────────────────

describe('phaseEncounterVisibility', () => {
  it('emits a notification when a retinue agent has an active encounter', () => {
    const state = makeState({ courtPosition: 'retinue' });
    const { notifications } = phaseEncounterVisibility(state);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].agentId).toBe('agent_1');
    expect(notifications[0].agentName).toBe('Ashara');
    expect(notifications[0].courtPosition).toBe('retinue');
  });

  it('emits a notification when a the_first agent has an active encounter', () => {
    const state = makeState({ courtPosition: 'the_first' });
    const { notifications } = phaseEncounterVisibility(state);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].courtPosition).toBe('the_first');
    // the_first → pause mode → no auto-resolve timer
    expect(notifications[0].autoResolveTick).toBeNull();
  });

  it('emits a notification for a threaded agent with no explicit courtPosition (defaults to retinue)', () => {
    const state = makeState({ courtPosition: null });
    // Even without a courtPosition, any threaded agent should get a notification
    // because we default to retinue behaviour
    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].courtPosition).toBe('retinue');
  });

  it('skips encounters for non-threaded agents', () => {
    const graph = makeGraph('retinue');
    // Add a second unthreaded agent with an active encounter
    graph.addNode({
      id: 'agent_2', name: 'Stranger', type: 'actor', category: 'individual',
      properties: { actorType: 'individual' },
    });
    const state = makeState({
      graph,
      encounterProgress: [
        makeActiveEncounter('agent_1', 'delve_ruins'),
        makeActiveEncounter('agent_2', 'trade_route'),
      ],
    });

    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].agentId).toBe('agent_1');
  });

  it('does not emit a notification for completed encounters', () => {
    const ep = { ...makeActiveEncounter(), status: 'completed' as const };
    const state = makeState({ encounterProgress: [ep] });
    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications).toHaveLength(0);
  });

  it('does not emit a duplicate notification when one already exists for the same encounter', () => {
    const state = makeState();
    // Simulate an existing pending notification for the same encounter
    const existing = {
      id: 'enc_notif_agent_1_delve_ruins_5',
      agentId: 'agent_1',
      agentName: 'Ashara',
      courtPosition: 'retinue' as const,
      encounterId: 'delve_ruins',
      encounterName: 'Delve into the Depths',
      prose: 'some prose',
      choices: [],
      createdTick: 5,
      autoResolveTick: null,
      viewed: false,
      resolved: false,
    };
    (state as unknown as { encounterNotifications: unknown[] }).encounterNotifications = [existing];

    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications).toHaveLength(0);
  });

  it('emits a journey_beat tick event alongside the notification', () => {
    const state = makeState();
    const { events } = phaseEncounterVisibility(state);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('journey_beat');
    expect(events[0].actorId).toBe('agent_1');
  });

  it('uses the location name from the agent located_at edge', () => {
    const state = makeState();
    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications[0].prose).toContain('Bitter Ruins');
  });
});
