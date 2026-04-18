import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateFactionQuestCandidates } from '../factionQuestGeneration';
import {
  applyFactionReputationGain,
  phaseFactionReputationDecay,
  processFactionEncounterReputation,
} from '../factionReputation';
import { ADVENTURING_GUILD_DEFINITION, FACTION_REPUTATION_COMPLETION_BONUS } from '../../data/faction-definitions';
import { FACTION_ENCOUNTER_TEMPLATES, FACTION_ENCOUNTER_META } from '../../data/faction-encounter-content';
import { getAnyEncounterById } from '../../data/encounter-content';
import { computeRankFromReputation } from '../../types/faction';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

function addFaction(graph: WorldGraph): string {
  const factionId = 'faction_def_adventuring_guild';
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: 'The Adventurers Guild',
    properties: {
      actorType: 'faction',
      factionType: 'guild',
      factionDefId: 'adventuring_guild',
    },
  });
  return factionId;
}

function addLocation(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { locationType: 'location', locationSubtype: 'town' },
  });
}

function joinFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  reputation = 0.05,
  role = 'journeyman',
): void {
  graph.addEdge({
    id: `member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: {
      role,
      rank: 0,
      joinedTick: 0,
      reputation,
      factionDefId: 'adventuring_guild',
    },
  });
}

function placeAgent(graph: WorldGraph, agentId: string, locationId: string): void {
  graph.addEdge({
    id: `loc_${agentId}`,
    source: agentId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function makeMinimalGameState(graph: WorldGraph, tick = 1): GameState {
  return {
    graph,
    tick,
    seed: 42,
    tickEvents: [],
    encounterProgress: [],
    unifiedActions: [],
    encounterNotifications: [],
    controlEffects: [],
    hexRevelation: {},
  } as unknown as GameState;
}

// ─── Faction Encounter Templates ───────────────────────────────────────────

describe('faction encounter templates', () => {
  it('all templates have matching meta entries', () => {
    for (const template of FACTION_ENCOUNTER_TEMPLATES) {
      const meta = FACTION_ENCOUNTER_META.get(template.id);
      expect(meta).toBeDefined();
      expect(meta!.factionDefId).toBe('adventuring_guild');
    }
  });

  it('standard quests require journeyman rank', () => {
    const standardIds = FACTION_ENCOUNTER_TEMPLATES
      .filter(t => t.id.startsWith('ag.quest.'))
      .map(t => t.id);

    for (const id of standardIds) {
      const meta = FACTION_ENCOUNTER_META.get(id);
      expect(meta!.minRank).toBe('journeyman');
    }
  });

  it('senior quests require sergeant rank', () => {
    const seniorIds = FACTION_ENCOUNTER_TEMPLATES
      .filter(t => t.id.startsWith('ag.senior.'))
      .map(t => t.id);

    expect(seniorIds.length).toBeGreaterThan(0);
    for (const id of seniorIds) {
      const meta = FACTION_ENCOUNTER_META.get(id);
      expect(meta!.minRank).toBe('sergeant');
    }
  });

  it('elite quests require lieutenant rank', () => {
    const eliteIds = FACTION_ENCOUNTER_TEMPLATES
      .filter(t => t.id.startsWith('ag.elite.'))
      .map(t => t.id);

    expect(eliteIds.length).toBeGreaterThan(0);
    for (const id of eliteIds) {
      const meta = FACTION_ENCOUNTER_META.get(id);
      expect(meta!.minRank).toBe('lieutenant');
    }
  });

  it('all templates have at least 2 steps', () => {
    for (const template of FACTION_ENCOUNTER_TEMPLATES) {
      expect(template.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('questTemplateIds on definition match actual templates (faction or monster encounter pool)', () => {
    for (const id of ADVENTURING_GUILD_DEFINITION.questTemplateIds) {
      // Check faction templates first, then the full encounter pool (includes monster templates)
      const found = FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === id) ?? getAnyEncounterById(id);
      expect(found).toBeDefined();
    }
  });
});

// ─── generateFactionQuestCandidates ────────────────────────────────────────

describe('generateFactionQuestCandidates', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    placeAgent(graph, 'agent_1', 'loc_1');
  });

  it('returns empty for non-member agents', () => {
    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);
    expect(candidates).toHaveLength(0);
  });

  it('returns standard quests for journeyman rank', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05); // journeyman

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);

    // Should get 5 standard quests (ag.quest.*)
    const standardQuests = candidates.filter(c => c.templateId.startsWith('ag.quest.'));
    expect(standardQuests).toHaveLength(5);

    // Should NOT get senior or elite quests
    const seniorQuests = candidates.filter(c => c.templateId.startsWith('ag.senior.'));
    const eliteQuests = candidates.filter(c => c.templateId.startsWith('ag.elite.'));
    expect(seniorQuests).toHaveLength(0);
    expect(eliteQuests).toHaveLength(0);
  });

  it('returns standard + senior quests for sergeant rank', () => {
    joinFaction(graph, 'agent_1', factionId, 0.35); // sergeant

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);

    const standardQuests = candidates.filter(c => c.templateId.startsWith('ag.quest.'));
    const seniorQuests = candidates.filter(c => c.templateId.startsWith('ag.senior.'));
    expect(standardQuests).toHaveLength(5);
    expect(seniorQuests).toHaveLength(3);
  });

  it('returns all quests for lieutenant rank', () => {
    joinFaction(graph, 'agent_1', factionId, 0.65); // lieutenant

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);

    expect(candidates).toHaveLength(10); // all 10 templates
  });

  it('candidates have correct cache entry shape', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05);

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);
    expect(candidates.length).toBeGreaterThan(0);

    const entry = candidates[0];
    expect(entry.templateId).toBeDefined();
    expect(entry.locationId).toBe('loc_1');
    expect(entry.questPriority).toBeGreaterThan(1);
    expect(entry.totalTickCost).toBeGreaterThan(0);
    expect(entry.requiresPresence).toBe(false);
  });

  it('skips member_of edges without factionDefId (economic guilds)', () => {
    // Add a plain member_of edge without factionDefId
    graph.addEdge({
      id: 'member_old',
      source: 'agent_1',
      target: factionId,
      type: 'member_of',
      properties: { role: 'member', rank: 0.3, joinedTick: 0 },
    });

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 1);
    expect(candidates).toHaveLength(0);
  });
});

// ─── applyFactionReputationGain ────────────────────────────────────────────

describe('applyFactionReputationGain', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
  });

  it('increases reputation on member_of edge', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05);

    const result = applyFactionReputationGain(graph, 'agent_1', factionId, 0.04, 1, 'quest_step');

    expect(result.newReputation).toBeCloseTo(0.09, 5);
    expect(result.rankChanged).toBe(false);
  });

  it('clamps reputation at 1.0', () => {
    joinFaction(graph, 'agent_1', factionId, 0.98);

    const result = applyFactionReputationGain(graph, 'agent_1', factionId, 0.10, 1, 'quest_step');

    expect(result.newReputation).toBe(1.0);
  });

  it('clamps reputation at 0.0', () => {
    joinFaction(graph, 'agent_1', factionId, 0.02);

    const result = applyFactionReputationGain(graph, 'agent_1', factionId, -0.10, 1, 'decay');

    expect(result.newReputation).toBe(0);
  });

  it('triggers rank change when crossing threshold', () => {
    joinFaction(graph, 'agent_1', factionId, 0.28); // just below sergeant (0.3)

    const result = applyFactionReputationGain(graph, 'agent_1', factionId, 0.04, 1, 'quest_step');

    expect(result.newReputation).toBeCloseTo(0.32, 5);
    expect(result.rankChanged).toBe(true);
    expect(result.newRank).toBe('sergeant');
  });

  it('updates role on member_of edge when rank changes', () => {
    joinFaction(graph, 'agent_1', factionId, 0.28);

    applyFactionReputationGain(graph, 'agent_1', factionId, 0.04, 1, 'quest_step');

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    expect(edge.properties.role).toBe('sergeant');
  });

  it('returns no-op for non-member agents', () => {
    const result = applyFactionReputationGain(graph, 'agent_1', factionId, 0.04, 1, 'quest_step');

    expect(result.newReputation).toBe(0);
    expect(result.rankChanged).toBe(false);
  });
});

// ─── phaseFactionReputationDecay ───────────────────────────────────────────

describe('phaseFactionReputationDecay', () => {
  it('decays reputation on member_of edges with factionDefId', () => {
    const graph = makeGraph();
    const factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    joinFaction(graph, 'agent_1', factionId, 0.50);

    const state = makeMinimalGameState(graph, 50);
    phaseFactionReputationDecay(state);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    // Should decay by ADVENTURING_GUILD_DEFINITION.reputationDecayPerTick (0.001)
    expect(newRep).toBeCloseTo(0.499, 5);
  });

  it('does not decay below 0', () => {
    const graph = makeGraph();
    const factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    joinFaction(graph, 'agent_1', factionId, 0.001);

    const state = makeMinimalGameState(graph, 50);
    phaseFactionReputationDecay(state);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    expect(edge.properties.reputation).toBe(0);
  });

  it('skips edges without factionDefId', () => {
    const graph = makeGraph();
    const factionId = addFaction(graph);
    addAgent(graph, 'agent_1');

    // Plain member_of edge without factionDefId
    graph.addEdge({
      id: 'member_plain',
      source: 'agent_1',
      target: factionId,
      type: 'member_of',
      properties: { role: 'member', rank: 0.5, joinedTick: 0, reputation: 0.5 },
    });

    const state = makeMinimalGameState(graph);
    phaseFactionReputationDecay(state);

    // Reputation should be unchanged — no factionDefId means skip
    const edge = graph.getEdgesByType('member_of')[0];
    expect(edge.properties.reputation).toBe(0.5);
  });

  it('triggers demotion when decay crosses rank threshold', () => {
    const graph = makeGraph();
    const factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    joinFaction(graph, 'agent_1', factionId, 0.3005, 'sergeant'); // just above sergeant threshold

    const state = makeMinimalGameState(graph, 50);
    phaseFactionReputationDecay(state);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    expect(newRep).toBeCloseTo(0.2995, 4);
    // Should have been demoted to journeyman
    expect(edge.properties.role).toBe('journeyman');
  });
});

// ─── processFactionEncounterReputation ─────────────────────────────────────

describe('processFactionEncounterReputation', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
  });

  it('adds reputation on successful faction quest step', () => {
    joinFaction(graph, 'agent_1', factionId, 0.10);

    processFactionEncounterReputation(graph, 'agent_1', 'ag.quest.ruin_delve', true, false, 5);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    // Should gain 0.04 (meta.reputationReward for ag.quest.ruin_delve)
    expect(newRep).toBeCloseTo(0.14, 5);
  });

  it('adds completion bonus on final step', () => {
    joinFaction(graph, 'agent_1', factionId, 0.10);

    processFactionEncounterReputation(graph, 'agent_1', 'ag.quest.ruin_delve', true, true, 5);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    // Step reward (0.04) + completion bonus (0.08) = 0.12
    expect(newRep).toBeCloseTo(0.10 + 0.04 + FACTION_REPUTATION_COMPLETION_BONUS, 5);
  });

  it('does nothing on failed step', () => {
    joinFaction(graph, 'agent_1', factionId, 0.10);

    processFactionEncounterReputation(graph, 'agent_1', 'ag.quest.ruin_delve', false, false, 5);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    expect(edge.properties.reputation).toBe(0.10);
  });

  it('does nothing for non-faction encounters', () => {
    joinFaction(graph, 'agent_1', factionId, 0.10);

    processFactionEncounterReputation(graph, 'agent_1', 'explore.ancient_ruins', true, true, 5);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    expect(edge.properties.reputation).toBe(0.10);
  });

  it('does nothing for non-member agents', () => {
    // agent_1 is not a member
    processFactionEncounterReputation(graph, 'agent_1', 'ag.quest.ruin_delve', true, true, 5);
    // No crash, no edges created
    expect(graph.getOutgoingEdges('agent_1', 'member_of')).toHaveLength(0);
  });
});
