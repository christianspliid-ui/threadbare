import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { isEligibleForArmySpawn, selectCommander, spawnArmy } from '../armySpawning';
import { ARMY_SPAWN_IRON_TIER_MIN, MAX_ARMIES_PER_FACTION, ARMY_QUINTESSENCE_BASE } from '../../types/army';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

/**
 * Set up a faction with a military ambition and a qualified member.
 * Returns { factionId, memberId, ambitionId, locationId }.
 */
function setupFactionWithMilitaryAmbition(graph: WorldGraph, opts?: {
  ironCapability?: number;
  goldCapability?: number;
  ambitionType?: string;
}) {
  // Sigmoid: raw 10→tier 5, raw 8→tier 4, raw 6→tier 3, raw 3→tier 1
  const ironCap = opts?.ironCapability ?? 12; // tier 6+ (well above min 4)
  const goldCap = opts?.goldCapability ?? 8;  // tier 4 (above min 3)
  const ambitionType = opts?.ambitionType ?? 'territorial_expansion';

  // Location
  graph.addNode({
    id: 'loc1',
    type: 'location',
    name: 'Test Town',
    properties: { locationSubtype: 'town' },
  });

  // Faction
  graph.addNode({
    id: 'faction1',
    type: 'actor',
    name: 'Test Faction',
    properties: {
      actorType: 'faction',
      factionDefinitionId: 'mercenary_company',
      domainCapabilities: { gold: goldCap, iron: 20 },
    },
  });

  // Member agent
  graph.addNode({
    id: 'agent1',
    type: 'actor',
    name: 'Commander Agent',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: ironCap, gold: 20 },
    },
  });
  graph.addEdge({
    id: 'e_member_agent1',
    source: 'agent1',
    target: 'faction1',
    type: 'member_of',
    properties: { role: 'member', rank: 'sellsword', joinedTick: 0 },
  });
  graph.addEdge({
    id: 'e_located_agent1',
    source: 'agent1',
    target: 'loc1',
    type: 'located_at',
    properties: {},
  });

  // Military ambition
  graph.addNode({
    id: 'amb1',
    type: 'ambition',
    name: 'Test Ambition',
    properties: { ambitionType, priority: 0.5, targetNodeId: null, createdTick: 0 },
  });
  graph.addEdge({
    id: 'e_pursues_faction1',
    source: 'faction1',
    target: 'amb1',
    type: 'pursues',
    properties: { priority: 0.5, status: 'active', milestones: [] },
  });

  return { factionId: 'faction1', memberId: 'agent1', ambitionId: 'amb1', locationId: 'loc1' };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('isEligibleForArmySpawn', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns true when all conditions are met', () => {
    setupFactionWithMilitaryAmbition(graph);
    const state = makeState(5, graph);
    expect(isEligibleForArmySpawn(state, 'faction1')).toBe(true);
  });

  it('returns false when no military ambition', () => {
    setupFactionWithMilitaryAmbition(graph, { ambitionType: 'resource_acquisition' });
    const state = makeState(5, graph);
    expect(isEligibleForArmySpawn(state, 'faction1')).toBe(false);
  });

  it('returns false when no Iron Tier 4+ agent', () => {
    setupFactionWithMilitaryAmbition(graph, { ironCapability: 3 }); // tier ~2
    const state = makeState(5, graph);
    expect(isEligibleForArmySpawn(state, 'faction1')).toBe(false);
  });

  it('returns false when Gold tier too low', () => {
    setupFactionWithMilitaryAmbition(graph, { goldCapability: 2 }); // tier ~1
    const state = makeState(5, graph);
    expect(isEligibleForArmySpawn(state, 'faction1')).toBe(false);
  });

  it('returns false when faction already has active army', () => {
    setupFactionWithMilitaryAmbition(graph);
    // Add existing army
    graph.addNode({
      id: 'existing_army',
      type: 'actor',
      name: 'Existing Army',
      properties: {
        actorType: 'group',
        armyState: { size: 'warband', quintessence: 30, quintessenceMax: 30 },
      },
    });
    graph.addEdge({
      id: 'e_member_existing_army',
      source: 'existing_army',
      target: 'faction1',
      type: 'member_of',
      properties: { role: 'army', rank: 'army', joinedTick: 0 },
    });

    const state = makeState(5, graph);
    expect(isEligibleForArmySpawn(state, 'faction1')).toBe(false);
  });
});

describe('selectCommander', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns highest Iron agent', () => {
    setupFactionWithMilitaryAmbition(graph);
    // Add second agent with lower iron
    graph.addNode({
      id: 'agent2',
      type: 'actor',
      name: 'Weaker Agent',
      properties: {
        actorType: 'individual',
        domainCapabilities: { iron: 8 }, // tier ~4
      },
    });
    graph.addEdge({
      id: 'e_member_agent2',
      source: 'agent2',
      target: 'faction1',
      type: 'member_of',
      properties: { role: 'member', rank: 'sellsword', joinedTick: 0 },
    });

    const state = makeState(5, graph);
    // agent1 has iron: 60 (tier ~6), agent2 has iron: 40 (tier ~4)
    expect(selectCommander(state, 'faction1')).toBe('agent1');
  });

  it('returns null when no qualifying agents', () => {
    setupFactionWithMilitaryAmbition(graph, { ironCapability: 3 }); // tier ~2
    const state = makeState(5, graph);
    expect(selectCommander(state, 'faction1')).toBeNull();
  });

  it('skips agents already commanding an army', () => {
    setupFactionWithMilitaryAmbition(graph);
    // Mark agent1 as already commanding
    graph.addNode({
      id: 'other_army',
      type: 'actor',
      name: 'Other Army',
      properties: { actorType: 'group', armyState: {} },
    });
    graph.addEdge({
      id: 'e_commanded_by_other',
      source: 'other_army',
      target: 'agent1',
      type: 'commanded_by',
      properties: {},
    });

    const state = makeState(5, graph);
    expect(selectCommander(state, 'faction1')).toBeNull();
  });
});

describe('spawnArmy', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('creates actor node with correct armyState', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);

    expect(armyId).not.toBeNull();
    const armyNode = graph.getNode(armyId!);
    expect(armyNode).toBeDefined();
    expect(armyNode!.properties.actorType).toBe('group');
    expect(armyNode!.properties.armyState).toBeDefined();

    const armyState = armyNode!.properties.armyState as Record<string, unknown>;
    expect(armyState.size).toBe('warband'); // gold tier ~4 → warband
    expect(armyState.quintessence).toBe(ARMY_QUINTESSENCE_BASE.warband);
    expect(armyState.raisedTick).toBe(10);
  });

  it('creates commanded_by edge to commander', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);

    const edges = graph.getOutgoingEdges(armyId!, 'commanded_by');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(memberId);
  });

  it('creates member_of edge to faction', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);

    const edges = graph.getOutgoingEdges(armyId!, 'member_of');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(factionId);
  });

  it('creates located_at edge to commander location', () => {
    const { factionId, memberId, ambitionId, locationId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);

    const edges = graph.getOutgoingEdges(armyId!, 'located_at');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(locationId);
  });

  it('creates pursues edge to ambition', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);

    const edges = graph.getOutgoingEdges(armyId!, 'pursues');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(ambitionId);
  });

  it('army ID is deterministic (faction ID + tick)', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);
    expect(armyId).toBe(`army_${factionId}_10`);
  });

  it('returns null when commander has no location', () => {
    const { factionId, memberId, ambitionId } = setupFactionWithMilitaryAmbition(graph);
    // Remove commander's location
    const locEdges = graph.getOutgoingEdges(memberId, 'located_at');
    for (const edge of locEdges) {
      graph.removeEdge(edge.id);
    }

    const state = makeState(10, graph);
    const armyId = spawnArmy(state, factionId, memberId, ambitionId);
    expect(armyId).toBeNull();
  });
});
