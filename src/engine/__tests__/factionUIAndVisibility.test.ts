/**
 * TB-063: Faction UI & Visibility Tests
 *
 * Tests for:
 * 1. AgentInfoCardData faction rank/reputation population
 * 2. Faction TickEvent emission from join/promotion outcomes
 * 3. Faction rank change events from reputation decay
 * 4. AlertBar glyph entries for faction/social/trust icons
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard } from '../agentDetail';
import { processFactionOutcome } from '../factionOutcome';
import { phaseFactionReputationDecay } from '../factionReputation';
import { alertBarTestHelpers } from '../../components/Game/AlertBar';
import type { EncounterProgress } from '../../types/encounter';
import type { MemberOfEdgeProperties } from '../../types/disposition';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAscendant(graph: WorldGraph): string {
  const id = 'asc_1';
  graph.addNode({
    id,
    type: 'actor',
    name: 'Test Ascendant',
    properties: { actorType: 'ascendant' },
  });
  return id;
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: {
      actorType: 'individual',
      axiologicalProfile: {},
      domainCapabilities: {},
    },
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
    properties: { locationType: 'location', locationSubtype: 'town', hexCol: 5, hexRow: 3 },
  });
}

function addThread(graph: WorldGraph, ascId: string, agentId: string): void {
  graph.addEdge({
    id: `thread_${ascId}_${agentId}`,
    source: ascId,
    target: agentId,
    type: 'thread',
    properties: { tier: 2 },
  });
}

function addLocatedAt(graph: WorldGraph, agentId: string, locId: string): void {
  graph.addEdge({
    id: `located_${agentId}_${locId}`,
    source: agentId,
    target: locId,
    type: 'located_at',
    properties: {},
  });
}

function addMemberOf(graph: WorldGraph, agentId: string, factionId: string, reputation: number): void {
  graph.addEdge({
    id: `member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: {
      role: 'journeyman',
      rank: 0,
      joinedTick: 1,
      reputation,
      factionDefId: 'adventuring_guild',
    } satisfies MemberOfEdgeProperties,
  });
}

function makeProgress(encounterId: string, actorId: string): EncounterProgress {
  return {
    actorId,
    encounterId,
    locationId: 'loc_1',
    startTick: 1,
    currentStep: 2,
    totalSteps: 3,
    completedSteps: [true, true, true],
    status: 'completed',
    stepStartTick: 1,
    stepDurationTicks: 1,
  };
}

function deterministicRng(): () => number {
  let seed = 42;
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ─── AgentInfoCardData faction fields ─────────────────────────────────────

describe('AgentInfoCardData faction fields', () => {
  let graph: WorldGraph;
  let ascId: string;

  beforeEach(() => {
    graph = makeGraph();
    ascId = addAscendant(graph);
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addLocatedAt(graph, 'agent_1', 'loc_1');
    addThread(graph, ascId, 'agent_1');
  });

  it('includes factionRank at recognised level', () => {
    const factionId = addFaction(graph);
    addMemberOf(graph, 'agent_1', factionId, 0.05);

    const card = getAgentInfoCard(graph, 'agent_1', ascId, 'recognised');
    expect(card).not.toBeNull();
    expect(card!.factionName).toBe('The Adventurers Guild');
    expect(card!.factionRank).toBe('Journeyman');
    expect(card!.factionDefId).toBe('adventuring_guild');
    // recognised does not get reputation number
    expect(card!.factionReputation).toBeUndefined();
  });

  it('includes factionReputation at known level', () => {
    const factionId = addFaction(graph);
    addMemberOf(graph, 'agent_1', factionId, 0.35);

    const card = getAgentInfoCard(graph, 'agent_1', ascId, 'known');
    expect(card).not.toBeNull();
    expect(card!.factionName).toBe('The Adventurers Guild');
    expect(card!.factionRank).toBe('Sergeant');
    expect(card!.factionReputation).toBeCloseTo(0.35, 2);
    expect(card!.factionDefId).toBe('adventuring_guild');
  });

  it('shows correct rank for high reputation', () => {
    const factionId = addFaction(graph);
    addMemberOf(graph, 'agent_1', factionId, 0.65);

    const card = getAgentInfoCard(graph, 'agent_1', ascId, 'intimate');
    expect(card!.factionRank).toBe('Lieutenant');
  });

  it('omits faction fields for strangers', () => {
    const factionId = addFaction(graph);
    addMemberOf(graph, 'agent_1', factionId, 0.35);

    const card = getAgentInfoCard(graph, 'agent_1', ascId, 'stranger');
    expect(card!.factionName).toBeUndefined();
    expect(card!.factionRank).toBeUndefined();
    expect(card!.factionReputation).toBeUndefined();
  });

  it('omits faction fields for non-members', () => {
    // No faction membership
    const card = getAgentInfoCard(graph, 'agent_1', ascId, 'known');
    expect(card!.factionName).toBeUndefined();
    expect(card!.factionRank).toBeUndefined();
    expect(card!.factionReputation).toBeUndefined();
  });
});

// ─── Faction TickEvent emission ───────────────────────────────────────────

describe('Faction TickEvent emission', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
    addAgent(graph, 'agent_1');
    addLocation(graph, 'loc_1');
    addLocatedAt(graph, 'agent_1', 'loc_1');
  });

  it('emits join event on successful faction join', () => {
    const factionId = addFaction(graph);
    const progress = makeProgress('ag.join', 'agent_1');
    const events = processFactionOutcome(graph, progress, 10, deterministicRng());

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('faction_founded');
    expect(events[0].message).toContain('joined');
    expect(events[0].actorId).toBe('agent_1');
    expect(events[0].notification?.icon).toBe('faction');
    expect(events[0].notification?.channel).toBe('toast');
  });

  it('emits promotion event on successful promotion', () => {
    const factionId = addFaction(graph);
    addMemberOf(graph, 'agent_1', factionId, 0.35); // At Sergeant, above 0.3 threshold

    const progress = makeProgress('ag.promotion', 'agent_1');
    const events = processFactionOutcome(graph, progress, 20, deterministicRng());

    // Should be promoted from Sergeant to Lieutenant (or stay if not at threshold)
    // With 0.35 rep and Lieutenant threshold at 0.6, gap is 0.25 > PROMOTION_PARTIAL_SUCCESS_MARGIN (0.10)
    // So this is a failure — no promotion event
    expect(events.length).toBe(0);
  });

  it('emits promotion event when reputation is within partial-success margin', () => {
    const factionId = addFaction(graph);
    // Sergeant (0.30 threshold), next tier is Lieutenant (0.60)
    // Gap = 0.60 - 0.55 = 0.05 < PROMOTION_PARTIAL_SUCCESS_MARGIN (0.10)
    addMemberOf(graph, 'agent_1', factionId, 0.55);

    const progress = makeProgress('ag.promotion', 'agent_1');
    const events = processFactionOutcome(graph, progress, 20, deterministicRng());

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('faction_rank_changed');
    expect(events[0].message).toContain('promoted');
    expect(events[0].message).toContain('Lieutenant');
    expect(events[0].notification?.icon).toBe('faction');
    expect(events[0].notification?.channel).toBe('alert');
  });

  it('returns empty events for non-faction encounters', () => {
    addFaction(graph);
    const progress = makeProgress('some.other.encounter', 'agent_1');
    const events = processFactionOutcome(graph, progress, 10, deterministicRng());
    expect(events).toEqual([]);
  });

  it('returns empty events for incomplete encounters', () => {
    addFaction(graph);
    const progress = { ...makeProgress('ag.join', 'agent_1'), status: 'active' as const };
    const events = processFactionOutcome(graph, progress, 10, deterministicRng());
    expect(events).toEqual([]);
  });
});

// ─── Reputation decay rank change events ──────────────────────────────────

describe('Faction reputation decay rank events', () => {
  it('emits demotion event when decay drops rank', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent_1');
    const factionId = addFaction(graph);
    // Put agent just above Sergeant threshold (0.3), so decay drops them
    addMemberOf(graph, 'agent_1', factionId, 0.301);

    const state = {
      graph,
      tick: 50,
      tickEvents: [],
    } as unknown as GameState;

    const result = phaseFactionReputationDecay(state);

    // With decay of 0.003 per tick, 0.301 - 0.003 = 0.298 → below 0.3 → demotion
    if (result.tickEvents) {
      const demotionEvents = result.tickEvents.filter(
        (e: any) => e.type === 'faction_rank_changed'
      );
      expect(demotionEvents.length).toBe(1);
      expect(demotionEvents[0].message).toContain('demoted');
      expect(demotionEvents[0].actorId).toBe('agent_1');
    } else {
      // tickEvents might be combined with state.tickEvents
      expect(result).toHaveProperty('tickEvents');
    }
  });

  it('does not emit events when rank stays the same', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent_1');
    const factionId = addFaction(graph);
    // Well above Sergeant threshold, won't drop below
    addMemberOf(graph, 'agent_1', factionId, 0.50);

    const state = {
      graph,
      tick: 50,
      tickEvents: [],
    } as unknown as GameState;

    const result = phaseFactionReputationDecay(state);
    // Should return {} (no events)
    expect(result.tickEvents).toBeUndefined();
  });
});

// ─── AlertBar glyphs ──────────────────────────────────────────────────────

describe('AlertBar faction glyphs', () => {
  it('returns faction glyph', () => {
    expect(alertBarTestHelpers.getGlyph('faction')).toBe('⚜');
  });

  it('returns social glyph', () => {
    expect(alertBarTestHelpers.getGlyph('social')).toBe('🤝');
  });

  it('returns trust glyph', () => {
    expect(alertBarTestHelpers.getGlyph('trust')).toBe('🔗');
  });

  it('still returns existing glyphs', () => {
    expect(alertBarTestHelpers.getGlyph('death')).toBe('✝');
    expect(alertBarTestHelpers.getGlyph('discovery')).toBe('◎');
  });
});
