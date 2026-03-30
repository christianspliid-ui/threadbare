/**
 * mercenaryPipeline.test.ts
 *
 * Integration tests for the full mercenary company pipeline:
 * join → quest → promote.
 *
 * Verifies the end-to-end candidate flow using WorldGraph directly,
 * without mocking internal modules.
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
  const factionId = 'faction_def_mercenary_company_0';
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
    name: `Town ${id}`,
    properties: { locationType: 'location', locationSubtype: 'town' },
  });
}

/** Add a faction hall using sublocationTypeId pattern (as factionSeeding writes it) */
function addFactionHall(
  graph: WorldGraph,
  locationId: string,
  hallId: string,
  factionDefId: string,
): void {
  graph.addNode({
    id: hallId,
    type: 'location',
    name: `Faction Hall`,
    properties: {
      locationType: 'sublocation',
      sublocationTypeId: 'sublocation-type.faction-hall',
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

function joinFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  reputation: number,
  role = 'sellsword',
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
      factionDefId: 'mercenary_company',
    } satisfies MemberOfEdgeProperties,
  });
}

// ─── Full Pipeline: Join → Quest → Promote ─────────────────────────────────

describe('mercenary company pipeline — join → quest → promote', () => {
  it('full join-quest-promote cycle', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');

    // Step 1: Non-member at hall location gets mc.join candidate
    const joinCandidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');
    expect(joinCandidates).toHaveLength(1);
    expect(joinCandidates[0].templateId).toBe('mc.join');

    // Step 2: Simulate join encounter completion — add member_of edge
    joinFaction(graph, 'agent_1', factionId, 0.1);

    // Step 3: Member now gets mc.quest.* candidates
    const questCandidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);
    const questIds = questCandidates.map(c => c.templateId);
    expect(questIds.some(id => id.startsWith('mc.quest.'))).toBe(true);

    // Step 4: Simulate reputation crossing sergeant_at_arms threshold (0.1 → 0.31)
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 5);
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 6);
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 7);
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 8);
    processFactionEncounterReputation(graph, 'agent_1', 'mc.quest.patrol', true, true, 9);

    // Manually set promotionPending to simulate rank threshold crossing
    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    edge.properties = { ...edge.properties, promotionPending: true };

    // Step 5: Agent with promotionPending gets mc.promotion at priority 9.0
    const promoCandidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');
    const promoCandidate = promoCandidates.find(c => c.templateId === 'mc.promotion');
    expect(promoCandidate).toBeDefined();
    expect(promoCandidate!.questPriority).toBe(9.0);
  });

  it('agent with reputation 0.25 (below sergeant threshold) gets mc.quest.* only', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinFaction(graph, 'agent_1', factionId, 0.25, 'sellsword');

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);
    const ids = candidates.map(c => c.templateId);

    expect(ids.some(id => id.startsWith('mc.quest.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.senior.'))).toBe(false);
    expect(ids.some(id => id.startsWith('mc.elite.'))).toBe(false);
  });

  it('quest candidates have successRewardEstimate from MERCENARY_ENCOUNTER_META', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinFaction(graph, 'agent_1', factionId, 0.1);

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);

    // Each mc.quest.* template has reputationReward 0.04-0.05 from MERCENARY_ENCOUNTER_META
    const patrolCandidate = candidates.find(c => c.templateId === 'mc.quest.patrol');
    expect(patrolCandidate).toBeDefined();
    expect(patrolCandidate!.successRewardEstimate).toBeCloseTo(0.04);
  });

  it('war_chief rank agent gets all mc template tiers', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    joinFaction(graph, 'agent_1', factionId, 0.90, 'war_chief');

    const candidates = generateFactionQuestCandidates(graph, 'agent_1', 'loc_1', 0);
    const ids = candidates.map(c => c.templateId);

    expect(ids.some(id => id.startsWith('mc.quest.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.senior.'))).toBe(true);
    expect(ids.some(id => id.startsWith('mc.elite.'))).toBe(true);
  });

  it('mc member is not offered join candidate at their own hall', () => {
    const graph = makeGraph();
    const factionId = addMercFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addFactionHall(graph, 'loc_1', 'hall_1', 'mercenary_company');
    joinFaction(graph, 'agent_1', factionId, 0.1);

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates.every(c => c.templateId !== 'mc.join')).toBe(true);
  });
});
