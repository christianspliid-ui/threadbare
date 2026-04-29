import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateFactionLifecycleCandidates } from '../factionQuestGeneration';
import {
  processFactionJoinOutcome,
  processFactionPromotionOutcome,
  processFactionOutcome,
} from '../factionOutcome';
import { isEncounterVisibleToAgent } from '../questVisibility';
import {
  FACTION_JOIN_TEMPLATE,
  FACTION_PROMOTION_TEMPLATE,
  FACTION_ENCOUNTER_META,
} from '../../data/faction-encounter-content';
import {
  FACTION_JOIN_STARTING_REPUTATION,
  FACTION_PROMOTION_REPUTATION_BOOST,
  PROMOTION_PARTIAL_SUCCESS_MARGIN,
} from '../../data/faction-definitions';
import type { EncounterProgress } from '../../types/encounter';
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

function addGuildHall(graph: WorldGraph, locationId: string, hallId: string): void {
  graph.addNode({
    id: hallId,
    type: 'location',
    name: `Guild Hall ${hallId}`,
    properties: {
      locationType: 'sublocation',
      locationSubtype: 'guild-hall',
      parentLocationId: locationId,
      factionDefId: 'adventuring_guild',
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

function makeProgress(
  encounterId: string,
  actorId: string,
  status: 'active' | 'completed' | 'abandoned' = 'completed',
): EncounterProgress {
  return {
    encounterId,
    actorId,
    currentEncounterIndex: 1,
    history: [
      { encounterId, success: true, tick: 5 },
      { encounterId, success: true, tick: 6 },
    ],
    status,
    startedTick: 5,
  };
}

function makeRng(seed = 0.5): () => number {
  return () => seed;
}

// ─── Join & Promotion Templates ──────────────────────────────────────────

describe('faction join and promotion templates', () => {
  it('ag.join template exists with correct shape', () => {
    expect(FACTION_JOIN_TEMPLATE.id).toBe('ag.join');
    expect(FACTION_JOIN_TEMPLATE.steps).toHaveLength(2);
    expect(FACTION_JOIN_TEMPLATE.crudType).toBe('create');
  });

  it('ag.promotion template exists with correct shape', () => {
    expect(FACTION_PROMOTION_TEMPLATE.id).toBe('ag.promotion');
    expect(FACTION_PROMOTION_TEMPLATE.steps).toHaveLength(2);
    expect(FACTION_PROMOTION_TEMPLATE.crudType).toBe('update');
  });

  it('both have meta entries', () => {
    expect(FACTION_ENCOUNTER_META.get('ag.join')).toBeDefined();
    expect(FACTION_ENCOUNTER_META.get('ag.promotion')).toBeDefined();
  });

  it('meta entries link to adventuring_guild', () => {
    expect(FACTION_ENCOUNTER_META.get('ag.join')!.factionDefId).toBe('adventuring_guild');
    expect(FACTION_ENCOUNTER_META.get('ag.promotion')!.factionDefId).toBe('adventuring_guild');
  });
});

// ─── Visibility Filter (not_faction) ─────────────────────────────────────

describe('not_faction visibility filter', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    addAgent(graph, 'agent_2');
  });

  it('not_faction excludes members', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05);

    const visible = isEncounterVisibleToAgent(
      graph, 'agent_1', ['not_faction:adventuring_guild'],
    );
    expect(visible).toBe(false);
  });

  it('not_faction allows non-members', () => {
    // agent_2 is not a member
    const visible = isEncounterVisibleToAgent(
      graph, 'agent_2', ['not_faction:adventuring_guild'],
    );
    expect(visible).toBe(true);
  });

  it('combined positive + negative filters work', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05);

    // Positive faction filter + negative faction filter for same agent
    const visible = isEncounterVisibleToAgent(
      graph, 'agent_1', ['not_faction:adventuring_guild', `faction:${factionId}`],
    );
    // Negative filter fails → excluded even though positive matches
    expect(visible).toBe(false);
  });

  it('only negative filters pass when no membership', () => {
    const visible = isEncounterVisibleToAgent(
      graph, 'agent_2', ['not_faction:adventuring_guild'],
    );
    expect(visible).toBe(true);
  });
});

// ─── Lifecycle Candidate Generation ──────────────────────────────────────

describe('generateFactionLifecycleCandidates', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addGuildHall(graph, 'loc_1', 'hall_1');
  });

  it('returns join candidate for non-member at guild hall location', () => {
    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].templateId).toBe('ag.join');
    expect(candidates[0].sublocationId).toBe('hall_1');
    expect(candidates[0].requiresPresence).toBe(true);
  });

  it('join candidate has not_faction visibility filter', () => {
    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates[0].visibleTo).toEqual(['not_faction:adventuring_guild']);
  });

  it('returns empty for non-member at location without guild hall', () => {
    addLocation(graph, 'loc_2'); // No guild hall
    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_2');
    expect(candidates).toHaveLength(0);
  });

  it('returns promotion candidate for member near threshold', () => {
    // Reputation 0.25 → journeyman, next threshold 0.3 (sergeant), gap = 0.05 < PROMOTION_PARTIAL_SUCCESS_MARGIN
    joinFaction(graph, 'agent_1', factionId, 0.25);

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].templateId).toBe('ag.promotion');
    expect(candidates[0].sublocationId).toBe('hall_1');
  });

  it('does not return promotion for member far from threshold', () => {
    // Reputation 0.10 → journeyman, gap to 0.3 = 0.20 > PROMOTION_PARTIAL_SUCCESS_MARGIN
    joinFaction(graph, 'agent_1', factionId, 0.10);

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    // No join (is member), no promotion (too far)
    expect(candidates).toHaveLength(0);
  });

  it('does not return promotion for max-rank member', () => {
    joinFaction(graph, 'agent_1', factionId, 0.90, 'leader');

    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');

    expect(candidates).toHaveLength(0);
  });

  it('join candidate has complete cache entry shape', () => {
    const candidates = generateFactionLifecycleCandidates(graph, 'agent_1', 'loc_1');
    const entry = candidates[0];

    expect(entry.stepCount).toBe(2);
    expect(entry.stepDifficulties).toHaveLength(2);
    expect(entry.stepReaches).toHaveLength(2);
    expect(entry.totalTickCost).toBeGreaterThan(0);
  });
});

// ─── processFactionJoinOutcome ──────────────────────────────────────────

describe('processFactionJoinOutcome', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
  });

  it('creates member_of edge on completed join encounter', () => {
    const progress = makeProgress('ag.join', 'agent_1', 'completed');

    const result = processFactionJoinOutcome(graph, progress, 10);

    expect(result).toBe(true);

    const edges = graph.getOutgoingEdges('agent_1', 'member_of');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(factionId);

    const props = edges[0].properties as MemberOfEdgeProperties;
    expect(props.reputation).toBe(FACTION_JOIN_STARTING_REPUTATION);
    expect(props.factionDefId).toBe('adventuring_guild');
    expect(props.role).toBe('journeyman');
    expect(props.joinedTick).toBe(10);
  });

  it('does nothing for abandoned encounter', () => {
    const progress = makeProgress('ag.join', 'agent_1', 'abandoned');

    const result = processFactionJoinOutcome(graph, progress, 10);

    expect(result).toBe(false);
    expect(graph.getOutgoingEdges('agent_1', 'member_of')).toHaveLength(0);
  });

  it('does nothing if agent is already a member', () => {
    joinFaction(graph, 'agent_1', factionId, 0.05);
    const progress = makeProgress('ag.join', 'agent_1', 'completed');

    const result = processFactionJoinOutcome(graph, progress, 10);

    expect(result).toBe(false);
    // Should still have only the original edge
    expect(graph.getOutgoingEdges('agent_1', 'member_of')).toHaveLength(1);
  });

  it('does nothing for non-join encounters', () => {
    const progress = makeProgress('ag.quest.ruin_delve', 'agent_1', 'completed');

    const result = processFactionJoinOutcome(graph, progress, 10);

    expect(result).toBe(false);
  });

  it('does nothing for non-faction encounters', () => {
    const progress = makeProgress('explore.ancient_ruins', 'agent_1', 'completed');

    const result = processFactionJoinOutcome(graph, progress, 10);

    expect(result).toBe(false);
  });
});

// ─── processFactionPromotionOutcome ─────────────────────────────────────

describe('processFactionPromotionOutcome', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
  });

  it('partial success promotes near sergeant→lieutenant threshold', () => {
    // Rep 0.55 → sergeant (threshold 0.3). Next = lieutenant at 0.6. Gap = 0.05 < margin (0.10).
    joinFaction(graph, 'agent_1', factionId, 0.55);
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).not.toBeNull();
    expect(result!.promoted).toBe(true);
    expect(result!.outcome).toBe('partial_success');
    expect(result!.fromRank).toBe('sergeant');
    expect(result!.toRank).toBe('lieutenant');
    expect(result!.complication).toBeDefined();
  });

  it('partial success promotes near journeyman→sergeant threshold', () => {
    // 0.25 → journeyman, next threshold 0.3 (sergeant), gap = 0.05 < margin (0.10)
    joinFaction(graph, 'agent_1', factionId, 0.25);
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).not.toBeNull();
    expect(result!.promoted).toBe(true);
    expect(result!.outcome).toBe('partial_success');
    expect(result!.complication).toBeDefined();
  });

  it('failure when too far from threshold', () => {
    // 0.10 → journeyman, gap to 0.3 = 0.20, beyond PROMOTION_PARTIAL_SUCCESS_MARGIN
    joinFaction(graph, 'agent_1', factionId, 0.10);
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).not.toBeNull();
    expect(result!.promoted).toBe(false);
    expect(result!.outcome).toBe('failure');
  });

  it('applies reputation boost on promotion', () => {
    joinFaction(graph, 'agent_1', factionId, 0.55); // near lieutenant threshold 0.6
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    processFactionPromotionOutcome(graph, progress, 10, makeRng());

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    // Partial success: boost should push past 0.6 threshold
    expect(newRep).toBeGreaterThanOrEqual(0.6);
  });

  it('partial success boosts reputation past threshold', () => {
    joinFaction(graph, 'agent_1', factionId, 0.25);
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    processFactionPromotionOutcome(graph, progress, 10, makeRng());

    const edge = graph.getOutgoingEdges('agent_1', 'member_of')[0];
    const newRep = edge.properties.reputation as number;
    // Should be at least past the 0.3 threshold
    expect(newRep).toBeGreaterThanOrEqual(0.3);
  });

  it('returns null for non-member', () => {
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).toBeNull();
  });

  it('returns null for max-rank member', () => {
    joinFaction(graph, 'agent_1', factionId, 0.90, 'leader');
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).not.toBeNull();
    expect(result!.promoted).toBe(false);
    expect(result!.outcome).toBe('failure');
  });

  it('does nothing for abandoned encounter', () => {
    joinFaction(graph, 'agent_1', factionId, 0.32);
    const progress = makeProgress('ag.promotion', 'agent_1', 'abandoned');

    const result = processFactionPromotionOutcome(graph, progress, 10, makeRng());

    expect(result).toBeNull();
  });
});

// ─── processFactionOutcome dispatcher ───────────────────────────────────

describe('processFactionOutcome', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
    addAgent(graph, 'agent_1');
  });

  it('routes ag.join to join processor', () => {
    const progress = makeProgress('ag.join', 'agent_1', 'completed');

    const events = processFactionOutcome(graph, progress, 10, makeRng());

    expect(events.length).toBeGreaterThan(0);
    expect(graph.getOutgoingEdges('agent_1', 'member_of')).toHaveLength(1);
  });

  it('routes ag.promotion to promotion processor', () => {
    // Rep 0.55 → sergeant, gap to lieutenant (0.6) = 0.05 < margin → partial success → promoted
    joinFaction(graph, 'agent_1', factionId, 0.55);
    const progress = makeProgress('ag.promotion', 'agent_1', 'completed');

    const events = processFactionOutcome(graph, progress, 10, makeRng());

    expect(events.length).toBeGreaterThan(0);
  });

  it('returns empty for non-faction encounters', () => {
    const progress = makeProgress('explore.ancient_ruins', 'agent_1', 'completed');

    const events = processFactionOutcome(graph, progress, 10, makeRng());

    expect(events).toEqual([]);
  });

  it('returns empty for abandoned encounters', () => {
    const progress = makeProgress('ag.join', 'agent_1', 'abandoned');

    const events = processFactionOutcome(graph, progress, 10, makeRng());

    expect(events).toEqual([]);
  });
});
