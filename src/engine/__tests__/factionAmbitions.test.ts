import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseFactionAmbitions, FACTION_AMBITION_EVALUATION_INTERVAL } from '../factionAmbitions';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeMinimalState(tick: number, graph: WorldGraph): GameState {
  return {
    tick,
    seed: 42,
    graph,
    // Minimal stub — only fields used by phaseFactionAmbitions
  } as unknown as GameState;
}

function addFaction(
  graph: WorldGraph,
  id: string,
  definitionId: string,
  name = 'Test Faction',
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'faction',
      factionDefinitionId: definitionId,
    },
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('phaseFactionAmbitions', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('does nothing on non-evaluation ticks', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    const state = makeMinimalState(1, graph);
    phaseFactionAmbitions(state);
    // No ambition nodes should be created on tick 1 (not divisible by interval)
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(0);
  });

  it('creates ambition on evaluation tick for faction with no active ambition', () => {
    addFaction(graph, 'f1', 'mercenary_company', 'The Free Company');
    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].properties.ambitionType).toBeDefined();
    expect(ambitions[0].properties.createdTick).toBe(FACTION_AMBITION_EVALUATION_INTERVAL);
  });

  it('creates pursues edge from faction to ambition', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);
    const edges = graph.getOutgoingEdges('f1', 'pursues');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.status).toBe('active');
  });

  it('does not create new ambition when active ambition exists', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    // Add existing ambition
    graph.addNode({
      id: 'existing_amb',
      type: 'ambition',
      name: 'Existing',
      properties: { ambitionType: 'resource_acquisition', priority: 0.5, targetNodeId: null, createdTick: 0 },
    });
    graph.addEdge({
      id: 'e_pursues_existing',
      source: 'f1',
      target: 'existing_amb',
      type: 'pursues',
      properties: { priority: 0.5, status: 'active', milestones: [] },
    });

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);
    // Should still only have 1 ambition
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].id).toBe('existing_amb');
  });

  it('abandons ambition when target is destroyed', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    graph.addNode({
      id: 'target_settlement',
      type: 'location',
      name: 'Target',
      properties: { locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'amb_with_target',
      type: 'ambition',
      name: 'Conquer Target',
      properties: {
        ambitionType: 'territorial_expansion',
        priority: 0.5,
        targetNodeId: 'target_settlement',
        createdTick: 0,
      },
    });
    graph.addEdge({
      id: 'e_pursues_target',
      source: 'f1',
      target: 'amb_with_target',
      type: 'pursues',
      properties: { priority: 0.5, status: 'active', milestones: [] },
    });

    // Remove the target
    graph.removeNode('target_settlement');

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);

    // Old ambition should be removed, new one created
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].id).not.toBe('amb_with_target');
  });

  it('defaults to defensive_consolidation when no eligible ambitions', () => {
    // Add faction with no ambitionWeights defined
    graph.addNode({
      id: 'f_plain',
      type: 'actor',
      name: 'Plain Faction',
      properties: {
        actorType: 'faction',
        factionDefinitionId: 'adventuring_guild', // guild has no ambitionWeights
      },
    });

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].properties.ambitionType).toBe('defensive_consolidation');
  });

  it('skips factions without factionDefinitionId', () => {
    graph.addNode({
      id: 'f_no_def',
      type: 'actor',
      name: 'No Definition',
      properties: { actorType: 'faction' },
    });

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(0);
  });

  it('ambition IDs are deterministic for same seed and tick', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    const state1 = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state1);
    const ambitions1 = graph.getNodesByType('ambition');
    const type1 = ambitions1[0].properties.ambitionType;

    // Reset and replay with same seed
    const graph2 = new WorldGraph();
    addFaction(graph2, 'f1', 'mercenary_company');
    const state2 = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph2);
    phaseFactionAmbitions(state2);
    const ambitions2 = graph2.getNodesByType('ambition');
    const type2 = ambitions2[0].properties.ambitionType;

    expect(type1).toBe(type2);
  });

  it('revenge ambition priority decays over time', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    graph.addNode({
      id: 'revenge_amb',
      type: 'ambition',
      name: 'Revenge',
      properties: {
        ambitionType: 'revenge',
        priority: 0.5,
        targetNodeId: null,
        grievanceDecay: 0.1,
        createdTick: 0,
      },
    });
    graph.addEdge({
      id: 'e_pursues_revenge',
      source: 'f1',
      target: 'revenge_amb',
      type: 'pursues',
      properties: { priority: 0.5, status: 'active', milestones: [] },
    });

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);

    const amb = graph.getNode('revenge_amb');
    expect(amb).toBeDefined();
    expect(amb!.properties.priority).toBeCloseTo(0.4, 5);
  });

  it('revenge ambition abandoned when priority decays to zero', () => {
    addFaction(graph, 'f1', 'mercenary_company');
    graph.addNode({
      id: 'dying_revenge',
      type: 'ambition',
      name: 'Revenge',
      properties: {
        ambitionType: 'revenge',
        priority: 0.01,
        targetNodeId: null,
        grievanceDecay: 0.1,
        createdTick: 0,
      },
    });
    graph.addEdge({
      id: 'e_pursues_dying',
      source: 'f1',
      target: 'dying_revenge',
      type: 'pursues',
      properties: { priority: 0.01, status: 'active', milestones: [] },
    });

    const state = makeMinimalState(FACTION_AMBITION_EVALUATION_INTERVAL, graph);
    phaseFactionAmbitions(state);

    // Revenge should be abandoned (priority decayed below 0) and new ambition created
    const ambitions = graph.getNodesByType('ambition');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].id).not.toBe('dying_revenge');
  });
});

describe('mercenary company definition', () => {
  it('is registered in FACTION_DEFINITIONS', () => {
    expect(FACTION_DEFINITIONS.has('mercenary_company')).toBe(true);
  });

  it('has correct faction type', () => {
    const def = FACTION_DEFINITIONS.get('mercenary_company')!;
    expect(def.factionType).toBe('military');
  });

  it('has 4 rank tiers', () => {
    const def = FACTION_DEFINITIONS.get('mercenary_company')!;
    expect(def.rankTiers).toHaveLength(4);
    expect(def.rankTiers[0].id).toBe('sellsword');
    expect(def.rankTiers[3].id).toBe('war_chief');
    expect(def.rankTiers[3].maxSlots).toBe(1);
  });

  it('has ambition weights defined', () => {
    const def = FACTION_DEFINITIONS.get('mercenary_company')!;
    expect(def.ambitionWeights).toBeDefined();
    expect(def.ambitionWeights!.resource_acquisition).toBeGreaterThan(0);
  });
});
