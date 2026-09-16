/**
 * Tests for the clue rumour sweep (THR-1506).
 *
 * Covers:
 *   - findRumorSourceAt: a settlement's strongest rumour-bearing place; none → null
 *   - runClueRumorSweep: a passing roll writes one vague clue on the nearest ruin
 *     in radius, to someone in the settlement, at the vague lead strength
 *   - runClueRumorSweep: a failing roll writes nothing (the falsifying arm)
 *   - runClueRumorSweep: no ruin within CLUE_RUMOR_RUIN_RADIUS → suppressed
 *   - runClueRumorSweep: nobody in the settlement → suppressed
 *   - runClueRumorSweep: the per-sweep cap holds
 *   - phaseClueRumors: only runs on interval ticks; deterministic per seed
 *   - end to end: a rumour on a *minor* ruin is enough for the quest-hook phase
 *     to post — the entry-tier contract is reachable again
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { KnowsClueOfEdgeProperties } from '../../../types/knowledge';
import { clearTraces, enableTracing, getTraces } from '../../traceBuffer';
import {
  findRumorSourceAt,
  rumorCandidatePool,
  runClueRumorSweep,
  phaseClueRumors,
} from '../clueRumors';
import { phaseRuinQuestHooks, resetQuestHookEventCounter } from '../questHooks';
import {
  CLUE_RUMOR_INTERVAL_TICKS,
  CLUE_RUMOR_RUIN_RADIUS,
  CLUE_RUMOR_MAX_PER_SWEEP,
  CLUE_LEAD_STRENGTH_VAGUE,
  CLUE_SPAWN_LIBRARY_BASE,
  CLUE_SPAWN_TAVERN_BASE,
  CLUE_QUEST_THRESHOLD,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_QUEST_GENERATION_INTERVAL_TICKS,
} from '../constants';

// ─── Builders ────────────────────────────────────────────────────────────────

function addSettlement(
  graph: WorldGraph,
  id: string,
  col: number,
  row: number,
  places: string[] = [],
): void {
  graph.addNode({ id, type: 'location', name: id, properties: { hexCol: col, hexRow: row } });
  for (const placeType of places) {
    const placeId = `${id}.${placeType}`;
    graph.addNode({
      id: placeId,
      type: 'location',
      name: placeId,
      properties: { parentLocationId: id, sublocationTypeId: `sublocation-type.${placeType}` },
    });
    graph.addEdge({ id: `contains-${placeId}`, source: id, target: placeId, type: 'contains', properties: {} });
  }
}

function addActorAt(graph: WorldGraph, id: string, locationId: string): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `at-${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function addRuin(graph: WorldGraph, id: string, col: number, row: number, magnitude = 0.2): void {
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { ruinMagnitude: magnitude, sphereAlignment: 'iron', hexCol: col, hexRow: row },
  });
}

function addGuildHall(graph: WorldGraph, settlementId: string): void {
  const hallId = `${settlementId}.guild-hall`;
  graph.addNode({
    id: hallId,
    type: 'location',
    name: 'Guild Hall',
    properties: {
      parentLocationId: settlementId,
      sublocationTypeId: 'sublocation-type.faction-hall',
      factionDefId: 'adventuring_guild',
    },
  });
  graph.addEdge({ id: `contains-${hallId}`, source: settlementId, target: hallId, type: 'contains', properties: {} });
}

function buildState(graph: WorldGraph, tick: number, seed = 42): GameState {
  return {
    graph,
    tick,
    seed,
    ascendantId: 'god-1',
    tickEvents: [],
    encounterProgress: [],
  } as unknown as GameState;
}

function clueEdges(graph: WorldGraph) {
  return graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
}

const alwaysPass = () => 0;
const alwaysFail = () => 0.999;

beforeEach(() => {
  clearTraces();
  enableTracing();
  resetQuestHookEventCounter();
});

// ─── findRumorSourceAt ───────────────────────────────────────────────────────

describe('findRumorSourceAt', () => {
  it('returns null for a settlement with no rumour-bearing place', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['market-district', 'gatehouse']);
    expect(findRumorSourceAt(graph, 'town')).toBeNull();
  });

  it('picks the strongest place a settlement owns', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn', 'library']);
    const src = findRumorSourceAt(graph, 'town');
    expect(src?.source).toBe('library_research');
    expect(src?.base).toBe(CLUE_SPAWN_LIBRARY_BASE);
    expect(CLUE_SPAWN_LIBRARY_BASE).toBeGreaterThan(CLUE_SPAWN_TAVERN_BASE);
  });

  it('an inn is a tavern for rumour purposes', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    expect(findRumorSourceAt(graph, 'town')?.source).toBe('tavern_rumor');
  });
});

// ─── rumorCandidatePool ──────────────────────────────────────────────────────

describe('rumorCandidatePool', () => {
  it('includes individuals at the settlement and at any place inside it', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn', 'market-district']);
    addActorAt(graph, 'a-town', 'town');
    addActorAt(graph, 'a-market', 'town.market-district');
    addSettlement(graph, 'elsewhere', 20, 20, ['inn']);
    addActorAt(graph, 'a-elsewhere', 'elsewhere');
    expect(rumorCandidatePool(graph, 'town')).toEqual(['a-market', 'a-town']);
  });
});

// ─── runClueRumorSweep ───────────────────────────────────────────────────────

describe('runClueRumorSweep', () => {
  it('a passing roll writes one vague clue on the nearest ruin in radius, to someone in town', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    addActorAt(graph, 'villager', 'town.inn');
    addRuin(graph, 'ruin-near', 7, 5);
    addRuin(graph, 'ruin-far', 5 + CLUE_RUMOR_RUIN_RADIUS, 5);
    const state = buildState(graph, 10);

    const result = runClueRumorSweep(state, alwaysPass);

    expect(result).toMatchObject({ rolled: 1, passed: 1, spawned: 1, suppressedNoRuin: 0, suppressedNoPool: 0 });
    expect(result.bySource).toEqual({ tavern_rumor: 1 });
    const edges = clueEdges(graph);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('villager');
    expect(edges[0].target).toBe('ruin-near');
    const props = edges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('vague');
    expect(props.source).toBe('tavern_rumor');
    expect(props.magnitude).toBe(CLUE_LEAD_STRENGTH_VAGUE);
    expect(props.discoveredTick).toBe(10);
    expect(props.consumed).toBe(false);
  });

  it('a failing roll writes nothing', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    addActorAt(graph, 'villager', 'town');
    addRuin(graph, 'ruin-near', 7, 5);

    const result = runClueRumorSweep(buildState(graph, 10), alwaysFail);

    expect(result).toMatchObject({ rolled: 1, passed: 0, spawned: 0 });
    expect(clueEdges(graph)).toHaveLength(0);
  });

  it('a settlement with no rumour-bearing place never rolls', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['market-district']);
    addActorAt(graph, 'villager', 'town');
    addRuin(graph, 'ruin-near', 7, 5);

    const result = runClueRumorSweep(buildState(graph, 10), alwaysPass);

    expect(result).toMatchObject({ rolled: 0, passed: 0, spawned: 0 });
    expect(clueEdges(graph)).toHaveLength(0);
  });

  it('suppresses when no ruin lies within CLUE_RUMOR_RUIN_RADIUS', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    addActorAt(graph, 'villager', 'town');
    addRuin(graph, 'ruin-far', 5 + CLUE_RUMOR_RUIN_RADIUS + 1, 5);

    const result = runClueRumorSweep(buildState(graph, 10), alwaysPass);

    expect(result).toMatchObject({ passed: 1, spawned: 0, suppressedNoRuin: 1 });
    expect(clueEdges(graph)).toHaveLength(0);
  });

  it('suppresses when nobody is in the settlement to hear it', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    addRuin(graph, 'ruin-near', 7, 5);

    const result = runClueRumorSweep(buildState(graph, 10), alwaysPass);

    expect(result).toMatchObject({ passed: 1, spawned: 0, suppressedNoPool: 1 });
    expect(clueEdges(graph)).toHaveLength(0);
  });

  it('holds the per-sweep cap', () => {
    const graph = new WorldGraph();
    const n = CLUE_RUMOR_MAX_PER_SWEEP + 2;
    for (let i = 0; i < n; i++) {
      addSettlement(graph, `town-${i}`, 5 + i * 2, 5, ['inn']);
      addActorAt(graph, `villager-${i}`, `town-${i}`);
    }
    addRuin(graph, 'ruin-mid', 5 + n, 6);

    const result = runClueRumorSweep(buildState(graph, 10), alwaysPass);

    expect(result.passed).toBe(n);
    expect(result.capped).toBe(2);
    expect(result.spawned).toBe(CLUE_RUMOR_MAX_PER_SWEEP);
    expect(clueEdges(graph)).toHaveLength(CLUE_RUMOR_MAX_PER_SWEEP);
  });
});

// ─── phaseClueRumors ─────────────────────────────────────────────────────────

describe('phaseClueRumors', () => {
  it('does nothing off the interval and emits no trace', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['library']);
    addActorAt(graph, 'villager', 'town');
    addRuin(graph, 'ruin-near', 6, 5);

    phaseClueRumors(buildState(graph, CLUE_RUMOR_INTERVAL_TICKS + 1));

    expect(clueEdges(graph)).toHaveLength(0);
    expect(getTraces().filter(t => t.category === 'ruins.clue_rumor_sweep')).toHaveLength(0);
  });

  it('emits exactly one aggregate trace per sweep on the interval', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['library']);
    addActorAt(graph, 'villager', 'town');
    addRuin(graph, 'ruin-near', 6, 5);

    phaseClueRumors(buildState(graph, CLUE_RUMOR_INTERVAL_TICKS));

    const sweeps = getTraces().filter(t => t.category === 'ruins.clue_rumor_sweep');
    expect(sweeps).toHaveLength(1);
    expect(sweeps[0]).toMatchObject({ rolled: 1 });
  });

  it('is deterministic: same seed and world, same rumours', () => {
    const build = () => {
      const graph = new WorldGraph();
      for (let i = 0; i < 12; i++) {
        addSettlement(graph, `town-${i}`, 3 + i, 5, [i % 3 === 0 ? 'library' : 'inn']);
        addActorAt(graph, `v-${i}-a`, `town-${i}`);
        addActorAt(graph, `v-${i}-b`, `town-${i}`);
        addRuin(graph, `ruin-${i}`, 3 + i, 7, 0.1 + (i % 9) / 10);
      }
      return graph;
    };
    const a = build();
    const b = build();
    for (let t = CLUE_RUMOR_INTERVAL_TICKS; t <= 60; t += CLUE_RUMOR_INTERVAL_TICKS) {
      phaseClueRumors(buildState(a, t, 7));
      phaseClueRumors(buildState(b, t, 7));
    }
    const ids = (g: WorldGraph) => clueEdges(g).map(e => e.id).sort();
    expect(ids(a)).toEqual(ids(b));
  });
});

// ─── End to end: a rumour is enough to post ──────────────────────────────────

describe('a rumour on a minor ruin reaches the notice board', () => {
  it('one vague rumour lets phaseRuinQuestHooks post the entry-tier contract', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'town', 5, 5, ['inn']);
    addGuildHall(graph, 'town');
    addActorAt(graph, 'villager', 'town');
    // A *minor* ruin — under the old ruin-magnitude unit its single lead (0.2)
    // sat under CLUE_QUEST_THRESHOLD (0.5) and ag.quest.ruin_delve never posted.
    addRuin(graph, 'ruin-minor', 6, 5, RUIN_MAGNITUDE_MINOR_MAX - 0.1);
    expect(RUIN_MAGNITUDE_MINOR_MAX - 0.1).toBeLessThan(CLUE_QUEST_THRESHOLD);

    const sweep = runClueRumorSweep(buildState(graph, 10), alwaysPass);
    expect(sweep.spawned).toBe(1);

    const posted = phaseRuinQuestHooks(buildState(graph, RUIN_QUEST_GENERATION_INTERVAL_TICKS));

    const ruin = graph.getNode('ruin-minor')!;
    expect(ruin.properties.questHookPostedTick).toBe(RUIN_QUEST_GENERATION_INTERVAL_TICKS);
    expect(ruin.properties.questHookTemplateId).toBe('ag.quest.ruin_delve');
    expect(posted.tickEvents?.some(e => e.type === 'quest_hook_issued')).toBe(true);
  });
});
