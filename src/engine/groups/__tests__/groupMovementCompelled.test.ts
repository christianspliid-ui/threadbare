/**
 * THR-2068 — a company's heading never re-routes a member on a compelled journey.
 *
 * The god paid to send the mortal to a scene; a company re-snap that rewrote the
 * member's route would lapse the paid steer at arrival with a false "beyond reach".
 * The company goes on without that member, as it does for one waiting at an
 * appointment (THR-1686).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { runGroupMovement } from '../groupMovement';
import type { GameState } from '../../../types/gameState';
import type { MovementState } from '../../../types/movement';

function baseState(graph: WorldGraph): GameState {
  return {
    tick: 100, seed: 42, graph, tiles: [], unifiedActions: [], tickEvents: [],
  } as unknown as GameState;
}

const COMPELLED_SCENE = 'social.compelled.scene';

function build(withSteer: boolean): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, col] of [['home', 1], ['far', 2], ['shrine', 3]] as const) {
    graph.addNode({ id, type: 'location', name: id, properties: { locationSubtype: 'town', hexCol: col, hexRow: 1 } });
  }
  for (const [a, b] of [['home', 'far'], ['far', 'home'], ['home', 'shrine'], ['shrine', 'home']] as const) {
    graph.addEdge({ id: `adj.${a}.${b}`, source: a, target: b, type: 'adjacent', properties: { distance: 1 } });
  }
  for (const id of ['lead', 'walker']) {
    graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e.${id}.at`, source: id, target: 'home', type: 'located_at', properties: {} });
  }
  // The walker is mid-way to the compelled scene at the shrine.
  const heading: MovementState = {
    destinationId: 'shrine',
    movementQueue: ['home', 'shrine'],
    ticksAccumulated: 0,
    currentEdgeCost: 0,
    lastDecisionTick: 90,
    movementHistory: [],
    targetEncounterId: COMPELLED_SCENE,
  };
  graph.updateNode('walker', {
    properties: {
      ...graph.getNode('walker')!.properties,
      movementState: heading,
      ...(withSteer ? { compelledJourneyTemplateId: COMPELLED_SCENE } : {}),
    },
  });
  graph.addNode({ id: 'co', type: 'actor', name: 'The Company', properties: { actorType: 'group', groupType: 'party', groupDestinationId: 'far' } });
  graph.addEdge({ id: 'cmd', source: 'co', target: 'lead', type: 'commanded_by', properties: {} });
  for (const m of ['lead', 'walker']) {
    graph.addEdge({ id: `mo.${m}`, source: m, target: 'co', type: 'member_of', properties: { joinedTick: 0, role: 'member', rank: 0.5 } });
  }
  return graph;
}

const walkerDestination = (graph: WorldGraph): string | undefined =>
  (graph.getNode('walker')!.properties.movementState as MovementState | undefined)?.destinationId;

describe('THR-2068 — a company leaves a compelled journey be', () => {
  it('re-snaps a free member onto the company heading (non-vacuity)', () => {
    const graph = build(false);
    runGroupMovement(baseState(graph), graph.getNode('co')!);
    expect(walkerDestination(graph)).toBe('far');
  });

  it('does not re-route a member whose journey the god compelled', () => {
    const graph = build(true);
    runGroupMovement(baseState(graph), graph.getNode('co')!);
    expect(walkerDestination(graph)).toBe('shrine');
    // The rest of the company still takes the heading.
    expect((graph.getNode('lead')!.properties.movementState as MovementState | undefined)?.destinationId).toBe('far');
  });
});
