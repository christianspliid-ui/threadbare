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
      factionDefId: definitionId,
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
        factionDefId: 'adventuring_guild', // guild has no ambitionWeights
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

// ─── THR-711: derived prosperity gates territorial_expansion ───────────────

describe('deriveFactionProsperity → territorial_expansion gate (THR-711)', () => {
  function addControlledSettlement(
    graph: WorldGraph,
    factionId: string,
    locId: string,
    prosperity: number,
  ): void {
    graph.addNode({
      id: locId,
      type: 'location',
      name: locId,
      properties: { locationSubtype: 'town', prosperity },
    });
    graph.addEdge({
      id: `${factionId}_controls_${locId}`,
      source: factionId,
      target: locId,
      type: 'controls',
      properties: {},
    });
  }

  // A definition that actually weights territorial_expansion.
  function expansionCapableDefinition(): string {
    for (const [id, def] of FACTION_DEFINITIONS) {
      if ((def.ambitionWeights?.territorial_expansion ?? 0) > 0) return id;
    }
    throw new Error('no expansion-weighted faction definition found');
  }

  it('derives 0 for a faction with no holdings (cannot fund expansion)', async () => {
    const { deriveFactionProsperity } = await import('../factionNetwork');
    const graph = new WorldGraph();
    addFaction(graph, 'f1', 'thieves_guild');
    expect(deriveFactionProsperity(graph, 'f1')).toBe(0);
  });

  it('sums holdings on the /100 scale (breadth-weighted war chest)', async () => {
    const { deriveFactionProsperity } = await import('../factionNetwork');
    const graph = new WorldGraph();
    addFaction(graph, 'f1', 'thieves_guild');
    addControlledSettlement(graph, 'f1', 'loc_a', 80);
    addControlledSettlement(graph, 'f1', 'loc_b', 40);
    expect(deriveFactionProsperity(graph, 'f1')).toBeCloseTo(1.2, 5);
  });

  it('opens the expansion gate above the threshold and closes it below', async () => {
    const { scoreEligibleAmbitions, EXPANSION_PROSPERITY_THRESHOLD } = await import('../factionAmbitions');
    const defId = expansionCapableDefinition();

    const richGraph = new WorldGraph();
    addFaction(richGraph, 'f_rich', defId);
    addControlledSettlement(richGraph, 'f_rich', 'loc_rich', EXPANSION_PROSPERITY_THRESHOLD * 100 + 10);
    const richState = makeMinimalState(0, richGraph);
    const richTypes = scoreEligibleAmbitions(richState, 'f_rich', defId).map(c => c.type);
    expect(richTypes).toContain('territorial_expansion');

    const poorGraph = new WorldGraph();
    addFaction(poorGraph, 'f_poor', defId);
    addControlledSettlement(poorGraph, 'f_poor', 'loc_poor', 10);
    const poorState = makeMinimalState(0, poorGraph);
    const poorTypes = scoreEligibleAmbitions(poorState, 'f_poor', defId).map(c => c.type);
    expect(poorTypes).not.toContain('territorial_expansion');
  });
});
