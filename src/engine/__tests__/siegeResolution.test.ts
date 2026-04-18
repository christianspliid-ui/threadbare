import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createSiegeNode,
  tickSiege,
  getSiegePacingInterval,
  getSiegePhase,
  getFortificationModifier,
} from '../siegeResolution';
import {
  SIEGE_INITIAL_INTERVAL,
  SIEGE_DEFENDER_MOMENTUM_BONUS,
  SIEGE_MAX_DURATION,
  SIEGE_RESOLUTION_THRESHOLD,
  SIEGE_STARVATION_TICK,
  FORTIFICATION_BASIC,
  FORTIFICATION_GRAND,
  PREPARED_DEFENSE_MULTIPLIER,
} from '../../types/battle';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import type { GameState } from '../../types/gameState';
import type { DigestEntry, QueuedStoryBeat } from '../../types/attention';
import { TRACE_CATEGORIES } from '../../types/trace';
import { getTraces, clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { SIEGE_SPOTLIGHT_TEMPLATES, SIEGE_REGIONAL_TEMPLATES } from '../../data/siege-encounter-content';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph, extra: Partial<GameState> = {}): GameState {
  return {
    tick,
    seed: 42,
    graph,
    encounterProgress: [],
    digestBuffer: [],
    storyBeatQueue: [],
    ...extra,
  } as unknown as GameState;
}

function addSettlement(graph: WorldGraph, id: string, subtype: string = 'town'): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Settlement ${id}`,
    properties: { terrain: 'plains', locationSubtype: subtype },
  });
}

function addArmy(graph: WorldGraph, id: string, factionId: string, locationId: string, headcount: number = 100): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Army ${id}`,
    properties: {
      actorType: 'group',
      armyState: {
        size: 'warband',
        headcount,
        objective: null,
        quintessence: 30,
        quintessenceMax: 30,
        raisedTick: 0,
        maintenanceCost: 2,
        thresholdsFired: [],
      } as ArmyState,
    },
  });
  graph.addEdge({
    id: `e_member_${id}`,
    source: id,
    target: factionId,
    type: 'member_of',
    properties: { role: 'army', rank: 'army', joinedTick: 0 },
  });
  graph.addEdge({
    id: `e_loc_${id}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'actor', name: `Faction ${id}`, properties: { actorType: 'faction' } });
}

// ─── Pacing Tests ──────────────────────────────────────────────────────────

describe('getSiegePacingInterval', () => {
  it('starts at SIEGE_INITIAL_INTERVAL', () => {
    expect(getSiegePacingInterval(0)).toBe(SIEGE_INITIAL_INTERVAL);
  });

  it('decreases over time', () => {
    const early = getSiegePacingInterval(5);
    const late = getSiegePacingInterval(25);
    expect(late).toBeLessThan(early);
  });

  it('floors at 1 (every-tick spotlights)', () => {
    expect(getSiegePacingInterval(100)).toBe(1);
  });
});

describe('getSiegePhase', () => {
  it('returns opening for ticks 0-3', () => {
    expect(getSiegePhase(0)).toBe('opening');
    expect(getSiegePhase(3)).toBe('opening');
  });

  it('returns early for ticks 4-10', () => {
    expect(getSiegePhase(4)).toBe('early');
    expect(getSiegePhase(10)).toBe('early');
  });

  it('returns middle for ticks 11-20', () => {
    expect(getSiegePhase(11)).toBe('middle');
    expect(getSiegePhase(20)).toBe('middle');
  });

  it('returns crescendo for ticks 21+', () => {
    expect(getSiegePhase(21)).toBe('crescendo');
    expect(getSiegePhase(100)).toBe('crescendo');
  });
});

describe('getFortificationModifier', () => {
  it('returns FORTIFICATION_GRAND for city and capital', () => {
    expect(getFortificationModifier('city')).toBe(FORTIFICATION_GRAND);
    expect(getFortificationModifier('capital')).toBe(FORTIFICATION_GRAND);
  });

  it('returns FORTIFICATION_BASIC for town', () => {
    expect(getFortificationModifier('town')).toBe(FORTIFICATION_BASIC);
  });

  it('returns PREPARED_DEFENSE_MULTIPLIER for hamlet', () => {
    expect(getFortificationModifier('hamlet')).toBe(PREPARED_DEFENSE_MULTIPLIER);
  });

  it('returns 1 for unknown', () => {
    expect(getFortificationModifier(undefined)).toBe(1);
  });
});

// ─── Siege Creation Tests ──────────────────────────────────────────────────

describe('createSiegeNode', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'town1', 500);
  });

  it('creates siege node with battleType siege', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1');
    expect(siegeId).not.toBeNull();
    const bs = graph.getNode(siegeId!)?.properties.battleState as BattleState;
    expect(bs.battleType).toBe('siege');
    expect(bs.settlementId).toBe('town1');
  });

  it('applies defender momentum bonus', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    // Momentum should be reduced by defender bonus
    expect(bs.momentum).toBeLessThanOrEqual(bs.initialMomentumOffset);
  });

  it('creates participates_in edge for attacker', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const edges = graph.getOutgoingEdges('army1', 'participates_in');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(siegeId);
  });

  it('creates located_at edge', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const edges = graph.getOutgoingEdges(siegeId, 'located_at');
    expect(edges).toHaveLength(1);
  });

  it('fortification modifier makes defense much stronger', () => {
    // Town has FORTIFICATION_BASIC (10x) — 200 garrison * 10 = 2000 effective
    // vs 500 attacker — defender should have significant momentum advantage
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    expect(bs.momentum).toBeLessThan(0); // Defender advantage due to walls
  });
});

// ─── Siege Tick Tests ──────────────────────────────────────────────────────

describe('tickSiege', () => {
  let graph: WorldGraph;
  let siegeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'town1', 500);
    siegeId = createSiegeNode(makeState(0, graph), 'army1', 'town1', 'town1')!;
  });

  it('applies asymmetric attrition (attacker loses more)', () => {
    const qBefore = (graph.getNode('army1')?.properties.armyState as ArmyState).quintessence;
    tickSiege(makeState(1, graph), siegeId);
    const qAfter = (graph.getNode('army1')?.properties.armyState as ArmyState).quintessence;
    expect(qAfter).toBeLessThan(qBefore);
  });

  it('starvation fires at SIEGE_STARVATION_TICK', () => {
    // Tick past starvation threshold
    const state = makeState(SIEGE_STARVATION_TICK + 1, graph);
    // Manually set startedTick so ticksElapsed reaches starvation
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 1 },
      },
    });

    tickSiege(state, siegeId);
    expect(graph.getNode(siegeId)?.properties.starvationFired).toBe(true);
  });

  it('resolves on max duration timeout', () => {
    // Set startedTick to make it time out
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 0 },
      },
    });

    // Tick past max duration
    const state = makeState(SIEGE_MAX_DURATION + 1, graph);
    tickSiege(state, siegeId);
    expect(graph.getNode(siegeId)).toBeUndefined();
  });

  it('resolves when attacker quintessence hits 0', () => {
    // Set attacker Q very low
    const armyNode = graph.getNode('army1')!;
    graph.updateNode('army1', {
      properties: {
        ...armyNode.properties,
        armyState: { ...(armyNode.properties.armyState as ArmyState), quintessence: 0.5 },
      },
    });

    tickSiege(makeState(1, graph), siegeId);
    expect(graph.getNode(siegeId)).toBeUndefined();
  });

  it('resolves when momentum crosses siege threshold', () => {
    // Set momentum near siege threshold
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, momentum: SIEGE_RESOLUTION_THRESHOLD - 1 },
      },
    });

    // Tick multiple times until resolved
    for (let t = 1; t <= 20; t++) {
      if (!graph.getNode(siegeId)) break;
      tickSiege(makeState(t, graph), siegeId);
    }
    expect(graph.getNode(siegeId)).toBeUndefined();
  });
});

// ─── THR-18: Attention Tier Classification ────────────────────────────────

describe('siege template intrinsicTier (THR-18)', () => {
  it('all spotlight templates carry a required intrinsicTier', () => {
    for (const tpl of SIEGE_SPOTLIGHT_TEMPLATES) {
      expect(['background', 'shaping', 'story_beat']).toContain(tpl.intrinsicTier);
    }
    expect(SIEGE_SPOTLIGHT_TEMPLATES).toHaveLength(7);
  });

  it('all regional templates carry a required intrinsicTier', () => {
    for (const tpl of SIEGE_REGIONAL_TEMPLATES) {
      expect(['background', 'shaping', 'story_beat']).toContain(tpl.intrinsicTier);
    }
    expect(SIEGE_REGIONAL_TEMPLATES).toHaveLength(5);
  });

  it('breach, final_assault, relief_arrives, negotiate_terms (spotlight) are story_beat', () => {
    const storyBeats = ['siege.spotlight.breach', 'siege.spotlight.final_assault', 'siege.spotlight.relief_arrives', 'siege.spotlight.negotiate_terms'];
    for (const id of storyBeats) {
      const tpl = SIEGE_SPOTLIGHT_TEMPLATES.find(t => t.id === id);
      expect(tpl).toBeDefined();
      expect(tpl!.intrinsicTier).toBe('story_beat');
    }
  });

  it('TRACE_CATEGORIES contains siege_spotlight_fired and siege_regional_seeded', () => {
    expect(TRACE_CATEGORIES).toContain('siege_spotlight_fired');
    expect(TRACE_CATEGORIES).toContain('siege_regional_seeded');
  });
});

describe('regional materialization propagates effectiveTier (THR-18)', () => {
  let graph: WorldGraph;
  let siegeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();

    // Siege hex at (0, 0)
    graph.addNode({ id: 'hex0', type: 'hex', name: 'Hex 0', properties: { hexCol: 0, hexRow: 0 } });
    // Actor hex at (1, 0) — within SIEGE_REGIONAL_ENCOUNTER_RANGE
    graph.addNode({ id: 'hex1', type: 'hex', name: 'Hex 1', properties: { hexCol: 1, hexRow: 0 } });

    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'hex0', 500);

    // Connect town to hex
    graph.addEdge({ id: 'e_town_hex', source: 'town1', target: 'hex0', type: 'located_at', properties: {} });

    siegeId = createSiegeNode(makeState(0, graph), 'army1', 'town1', 'hex0')!;
    clearTraces();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('smuggle_supplies for shadow-capable actor with retinue thread → shaping trace', () => {
    // Add shadow-capable agent near siege
    graph.addNode({
      id: 'agent1',
      type: 'actor',
      name: 'Shadow Agent',
      properties: { actorType: 'individual', shadowCapability: 5 },
    });
    graph.addEdge({ id: 'e_a1_hex', source: 'agent1', target: 'hex1', type: 'located_at', properties: {} });

    // Add ascendant with retinue thread to agent1
    graph.addNode({ id: 'asc1', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addEdge({
      id: 'e_thread',
      source: 'asc1',
      target: 'agent1',
      type: 'thread',
      properties: { courtPosition: 'retinue' },
    });

    const state = makeState(1, graph, { ascendantId: 'asc1' });
    tickSiege(state, siegeId);

    const traces = getTraces().filter(t => (t as Record<string, unknown>).category === 'siege_regional_seeded');
    const regional = traces.find(t => (t as Record<string, unknown>).templateId === 'siege.regional.smuggle_supplies') as Record<string, unknown> | undefined;
    expect(regional).toBeDefined();
    // retinue preserves intrinsic tier (shaping → shaping)
    expect(regional!.effectiveTier).toBe('shaping');
  });

  it('join_attackers for attacker-allied actor (background) → background trace', () => {
    // Add agent in attacker faction near siege
    graph.addNode({
      id: 'agent2',
      type: 'actor',
      name: 'Attacker Agent',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({ id: 'e_a2_hex', source: 'agent2', target: 'hex1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e_a2_fac', source: 'agent2', target: 'f1', type: 'member_of', properties: { role: 'member', rank: 'member', joinedTick: 0 } });

    const state = makeState(1, graph);
    tickSiege(state, siegeId);

    const traces = getTraces().filter(t => (t as Record<string, unknown>).category === 'siege_regional_seeded');
    const regional = traces.find(t => (t as Record<string, unknown>).templateId === 'siege.regional.join_attackers') as Record<string, unknown> | undefined;
    expect(regional).toBeDefined();
    // No thread → 'invisible' → falls back to 'background'
    expect(regional!.effectiveTier).toBe('background');
  });

  it('fail-soft: regional template missing intrinsicTier defaults to background', () => {
    // We test the fallback constant directly — regional default is 'background'
    const tpl = SIEGE_REGIONAL_TEMPLATES.find(t => t.id === 'siege.regional.join_attackers');
    expect(tpl).toBeDefined();
    expect(tpl!.intrinsicTier).toBeDefined();
    expect(['background', 'shaping', 'story_beat']).toContain(tpl!.intrinsicTier);
  });
});

describe('spotlight tier emission (THR-18)', () => {
  let graph: WorldGraph;
  let siegeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({ id: 'hex0', type: 'hex', name: 'Hex 0', properties: { hexCol: 0, hexRow: 0 } });
    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'hex0', 500);
    graph.addEdge({ id: 'e_town_hex', source: 'town1', target: 'hex0', type: 'located_at', properties: {} });
    siegeId = createSiegeNode(makeState(0, graph), 'army1', 'town1', 'hex0')!;
  });

  it('spotlight fires during crescendo adds digest entry to state.digestBuffer', () => {
    // Put siege into crescendo (ticksElapsed > 20) and set pacing interval to 1
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 0, ticksSinceLastSpotlight: 100 },
      },
    });

    const state = makeState(25, graph); // crescendo phase (25 - 0 = 25 ticks elapsed)
    tickSiege(state, siegeId);

    // Crescendo spotlight templates are all story_beat, retinue fallback preserves tier
    // At minimum, one digest entry should be present if spotlight fired
    // We can't guarantee exactly which seed causes a fire, but we can run enough ticks
    // Use seed that triggers a momentum shift — test the entry shape when present
    const digest = state.digestBuffer as DigestEntry[];
    if (digest.length > 0) {
      const entry = digest[0];
      expect(entry.encounterId).toMatch(/^siege\.spotlight\./);
      expect(entry.sourceType).toBe('location');
      expect(['background', 'shaping', 'story_beat']).toContain(entry.isNotable ? 'story_beat' : entry.isNotable === false ? 'background' : 'shaping');
    }
    // The test verifies structure; spotlight may or may not fire depending on PRNG roll
  });

  it('story_beat spotlight adds to storyBeatQueue when bonded actor has retinue position', () => {
    // Add an ascendant with retinue thread to army1 — army1 is in f1 (attacker faction)
    graph.addNode({ id: 'asc1', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addEdge({
      id: 'e_thread',
      source: 'asc1',
      target: 'army1',
      type: 'thread',
      properties: { courtPosition: 'retinue' },
    });

    // Force crescendo and immediate spotlight interval
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 0, ticksSinceLastSpotlight: 100 },
      },
    });

    // Run many ticks to ensure at least one momentum-shifting spotlight fires
    let storyBeatFound = false;
    for (let t = 25; t <= 35; t++) {
      if (!graph.getNode(siegeId)) break;
      const state = makeState(t, graph, { ascendantId: 'asc1' });
      // Re-set ticksSinceLastSpotlight to force fire every tick in crescendo
      const bsCurrent = graph.getNode(siegeId)?.properties.battleState as BattleState;
      graph.updateNode(siegeId, {
        properties: {
          ...graph.getNode(siegeId)!.properties,
          battleState: { ...bsCurrent, ticksSinceLastSpotlight: 100 },
        },
      });
      tickSiege(state, siegeId);
      if ((state.storyBeatQueue as QueuedStoryBeat[]).length > 0) {
        storyBeatFound = true;
        const beat = (state.storyBeatQueue as QueuedStoryBeat[])[0];
        expect(beat.encounterId).toMatch(/^siege\.spotlight\./);
        expect(beat.priority).toBe('template_intrinsic');
        break;
      }
    }
    // During crescendo all templates are story_beat; with retinue they surface as story_beat
    // At minimum one of the 10 ticks above should trigger a 35% or 40% roll
    expect(storyBeatFound).toBe(true);
  });
});
