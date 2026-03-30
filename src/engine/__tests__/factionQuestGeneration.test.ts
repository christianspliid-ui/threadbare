/**
 * factionQuestGeneration.test.ts
 *
 * Tests for mc.* quest candidate generation, rank gating, join/promotion lifecycle,
 * and reputation-via-encounter. Covers MERC-06 through MERC-09.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateFactionQuestCandidates,
  generateFactionLifecycleCandidates,
} from '../factionQuestGeneration';
import { processFactionEncounterReputation } from '../factionReputation';
import type { MemberOfEdgeProperties } from '../../types/disposition';

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

function addMercFaction(graph: WorldGraph): string {
  const factionId = 'faction_def_mercenary_company';
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: 'The Iron Wolves',
    properties: {
      actorType: 'faction',
      factionType: 'military',
      factionDefId: 'mercenary_company',
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

/**
 * Add a faction hall sublocation using the sublocationTypeId pattern that
 * factionSeeding writes (not the legacy locationSubtype:'guild-hall').
 */
function addFactionHall(
  graph: WorldGraph,
  locationId: string,
  hallId: string,
  factionDefId: string,
): void {
  graph.addNode({
    id: hallId,
    type: 'location',
    name: `Faction Hall ${hallId}`,
    properties: {
      locationType: 'sublocation',
      sublocationTypeId: 'sublocation-type.faction-hall',
      parentLocationId: locationId,
      factionDefId,
    },
  });
  graph.addEdge({
    id: `contains_${locationId}_${hallId}`,
    source: locationId,
    target: hallId,
    type: 'contains',
    properties: {},
  });
}

function joinMercFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  reputation = 0.1,
  role = 'sellsword',
  promotionPending?: boolean,
): void {
  const props: MemberOfEdgeProperties & { promotionPending?: boolean } = {
    role,
    rank: 0,
    joinedTick: 0,
    reputation,
    factionDefId: 'mercenary_company',
  };
  if (promotionPending !== undefined) {
    props.promotionPending = promotionPending;
  }
  graph.addEdge({
    id: `member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: props,
  });
}

// ─── Quest Candidate Generation: Rank Gating ──────────────────────────────

describe('generateFactionQuestCandidates — mc.* rank gating', () => {
  it('mc member at sellsword rank (rep 0.1) gets mc.quest.* candidates only', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    expect(candidates.length).toBeGreaterThan(0);
    // All returned templates must start with mc.quest.
    const ids = candidates.map(c => c.templateId);
    expect(ids.every(id => id.startsWith('mc.quest.'))).toBe(true);
    // Must not contain mc.senior.* or mc.elite.*
    expect(ids.some(id => id.startsWith('mc.senior.'))).toBe(false);
    expect(ids.some(id => id.startsWith('mc.elite.'))).toBe(false);
  });

  it('mc member at sergeant_at_arms rank (rep 0.35) gets mc.quest.* AND mc.senior.* candidates', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.35, 'sergeant_at_arms');

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    const ids = candidates.map(c => c.templateId);
    expect(ids.some(id => id.startsWith('mc.quest.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.senior.'))).toBe(true);
    // Must not contain mc.elite.*
    expect(ids.some(id => id.startsWith('mc.elite.'))).toBe(false);
  });

  it('mc member at captain rank (rep 0.65) gets mc.quest.*, mc.senior.*, mc.elite.* candidates', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.65, 'captain');

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    const ids = candidates.map(c => c.templateId);
    expect(ids.some(id => id.startsWith('mc.quest.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.senior.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.elite.'))).toBe(true);
  });

  it('non-member agent does NOT get mc.quest.* candidates', () => {
    const graph = makeGraph();
    addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    // No member_of edge added

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    expect(candidates.length).toBe(0);
  });

  it('mc quest candidates have correct visibleTo faction filter', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    // All candidates should have visibleTo containing faction:factionId
    expect(candidates.every(c => c.visibleTo?.includes(`faction:${factionId}`))).toBe(true);
  });

  it('mc quest candidates all have questPriority set', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.35, 'sergeant_at_arms');

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    expect(candidates.every(c => typeof c.questPriority === 'number' && c.questPriority > 0)).toBe(true);
  });
});

// ─── Lifecycle Candidates: Join & Promotion ────────────────────────────────

describe('generateFactionLifecycleCandidates — mc.join and mc.promotion', () => {
  it('non-member at mc faction hall gets mc.join candidate', () => {
    const graph = makeGraph();
    addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].templateId).toBe('mc.join');
    expect(candidates[0].sublocationId).toBe('hall_1');
    expect(candidates[0].requiresPresence).toBe(true);
  });

  it('mc.join candidate has not_faction visibility filter', () => {
    const graph = makeGraph();
    addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates[0].visibleTo).toEqual(['not_faction:mercenary_company']);
  });

  it('member with promotionPending=true gets mc.promotion candidate at priority 9.0', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');
    // Rep 0.35 = sergeant_at_arms; promotionPending=true
    joinMercFaction(graph, 'agent_1', factionId, 0.35, 'sergeant_at_arms', true);

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    const promoCandidate = candidates.find(c => c.templateId === 'mc.promotion');
    expect(promoCandidate).toBeDefined();
    expect(promoCandidate!.questPriority).toBe(9.0);
  });

  it('member with promotionPending=false far from threshold gets NO promotion candidate', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');
    // Rep 0.1 — sellsword rank, far from 0.3 sergeant threshold, no promotionPending
    joinMercFaction(graph, 'agent_1', factionId, 0.1, 'sellsword', false);

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    const promoCandidate = candidates.find(c => c.templateId === 'mc.promotion');
    expect(promoCandidate).toBeUndefined();
  });

  it('returns empty for non-member at location without faction hall', () => {
    const graph = makeGraph();
    addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_2'); // No hall

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_2');

    expect(candidates).toHaveLength(0);
  });
});

// ─── Reputation via Encounter ──────────────────────────────────────────────

describe('processFactionEncounterReputation — mc.quest.* increments reputation', () => {
  it('completing mc.quest.patrol step increments reputation on member_of edge', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    const initialReputation = 0.1;
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, false, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = (edge.properties as MemberOfEdgeProperties).reputation ?? 0;
    expect(newRep).toBeGreaterThan(initialReputation);
  });

  it('completing mc.quest.patrol full encounter applies bonus reputation', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    // Step completion + full encounter completion (bonus)
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = (edge.properties as MemberOfEdgeProperties).reputation ?? 0;
    // Should receive both step reward (0.04) + completion bonus from FACTION_REPUTATION_COMPLETION_BONUS
    expect(newRep).toBeGreaterThan(0.1 + 0.04);
  });

  it('failed mc.quest.* step does NOT increment reputation', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', false, false, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const rep = (edge.properties as MemberOfEdgeProperties).reputation ?? 0;
    expect(rep).toBe(0.1); // Unchanged
  });

  it('non-faction encounter does not affect mc member reputation', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.1);

    processFactionEncounterReputation(graph, 'agent_1', 'explore.ancient_ruins', true, true, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const rep = (edge.properties as MemberOfEdgeProperties).reputation ?? 0;
    expect(rep).toBe(0.1); // Unchanged
  });

  it('completing mc.promotion encounter clears promotionPending flag', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.35, 'sergeant_at_arms', true);

    processFactionEncounterReputation(graph, 'agent_1', 'mc.promotion', true, true, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const props = edge.properties as MemberOfEdgeProperties & { promotionPending?: boolean };
    expect(props.promotionPending).toBe(false);
  });

  it('completing mc.senior quest (not promotion) does not clear promotionPending flag', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    joinMercFaction(graph, 'agent_1', factionId, 0.35, 'sergeant_at_arms', true);

    processFactionEncounterReputation(graph, 'agent_1', 'mc.senior.field_command', true, true, 1);

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const props = edge.properties as MemberOfEdgeProperties & { promotionPending?: boolean };
    // promotionPending should still be true — not a promotion encounter
    expect(props.promotionPending).toBe(true);
  });
});
