/**
 * THR-1602 — internal ids and template seams must not reach the chronicle.
 *
 * Cold playtest round 1 quoted `elder_ruin_81`, `loc_36`,
 * `RIVAL-SCHEME-ACTOR_RIVAL_2-CORRUPTIVE-T27 — MATERIALIZE`,
 * `Rule: death_or_transformation` and "a economic scheme" from the chronicle.
 * One block per diagnosed site.
 *
 * The fixtures here deliberately put a location's name on `node.name` only —
 * the shape every worldgen seeder writes. The older rival fixtures also set
 * `properties.name`, which is exactly why the id leak never showed in a test.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { buildRivalScheme } from '../rival';
import { phaseRivalActions } from '../orchestrator';
import { phaseComposition, humanizePhaseId } from '../phaseComposition';
import { phaseQuintessence } from '../phaseQuintessence';
import { findContestableSources } from '../rivalSourceContestation';
import { CORRUPTIVE_FAMILY } from '../../data/rival-schemes/corruptive';
import { ECONOMIC_FAMILY } from '../../data/rival-schemes/economic';
import {
  takesAn,
  withIndefiniteArticle,
  fixIndefiniteArticles,
} from '../../lib/indefiniteArticle';

const ID_LEAK = /\b(loc|lair|elder_ruin|hex)_\d+|rival-scheme-|RIVAL-SCHEME/i;

function rivalDef(id: string, behavior: RivalDefinition['behavior']): RivalDefinition {
  return {
    id,
    name: 'The Hollow Warden',
    epithet: 'of Rot',
    behavior,
    primarySphere: 'darkness',
    secondarySphere: 'mind',
    powerLevel: 5,
    actionFrequency: 5,
  } as unknown as RivalDefinition;
}

function rivalState(id: string): RivalState {
  return {
    rivalId: id,
    currentPower: 5,
    interventionCount: 0,
    hostility: 0.2,
    ticksSinceAction: 0,
    activeSchemeIds: [],
    lastSchemeLaunchTick: -999,
  } as unknown as RivalState;
}

function makeState(extra: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: {} } as GraphNode);
  return {
    tick: 10,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    tiles: [],
    ascendantId: 'asc-1',
    rivalDefinitions: [],
    rivalStates: [],
    doomClock: { currentTick: 0, totalTicks: 1000, stage: 1 },
    doomIdentityMatrix: null,
    tickEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    activeCompositions: [],
    worldFlags: {},
    firedCompositions: [],
    storyBeatQueue: [],
    pendingSpherePressures: [],
    ...extra,
  } as unknown as GameState;
}

/** A location named on `node.name` only — the worldgen shape. */
function addNamedLocation(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({ id, type: 'location', name, properties: { hexCol: 3, hexRow: 3 } } as GraphNode);
}

function tick(state: GameState): void {
  Object.assign(state, phaseComposition(state));
  Object.assign(state, phaseRivalActions(state));
  state.tick += 1;
}

// ─── Site 4: articles ────────────────────────────────────────────────

describe('indefinite articles (site 4)', () => {
  it('picks the article from the word that landed', () => {
    expect(withIndefiniteArticle('economic scheme')).toBe('an economic scheme');
    expect(withIndefiniteArticle('corruptive scheme')).toBe('a corruptive scheme');
    expect(takesAn('unique')).toBe(false);
    expect(takesAn('one-eyed')).toBe(false);
    expect(takesAn('umbral')).toBe(true);
  });

  it('repairs "a <vowel>" in generated prose and is idempotent', () => {
    const fixed = fixIndefiniteArticles('Something shifted — a ancient recognition. A unspoken memory.');
    expect(fixed).toBe('Something shifted — an ancient recognition. An unspoken memory.');
    expect(fixIndefiniteArticles(fixed)).toBe(fixed);
    expect(fixIndefiniteArticles('a unique gift, an hour, a stone')).toBe('a unique gift, an hour, a stone');
  });
});

// ─── Site 2: scheme phase titles ─────────────────────────────────────

describe('scheme phase titles (site 2)', () => {
  it('humanizes a phase id for the fallback title', () => {
    expect(humanizePhaseId('sour-mines')).toBe('Sour mines');
    expect(humanizePhaseId('')).toBe('A turn of events');
  });

  it('gives every rival scheme phase a readable title with no ids', () => {
    const rival = rivalDef('actor_rival_2', 'subtle');
    const plan = buildRivalScheme(
      rival, rivalState('actor_rival_2'), CORRUPTIVE_FAMILY, 0, 27, 'loc_36', 'Ashford', () => 0.5,
    );
    const titles = (plan.composition.phases ?? []).map((p) => p.title ?? '');
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) {
      expect(t).toMatch(/^The Hollow Warden's corruptive scheme: /);
      expect(t).not.toMatch(ID_LEAK);
    }
  });
});

// ─── Site 1: location names, end to end through the runner ──────────

describe('scheme prose names the place, not its id (sites 1 + 2 + 4)', () => {
  it('a scheme run to completion writes no id into any event or chronicle entry', () => {
    const rival = rivalDef('actor_rival_2', 'subtle');
    const rs = rivalState('actor_rival_2');
    const state = makeState({ rivalDefinitions: [rival], rivalStates: [rs] });
    state.graph.addNode({ id: 'actor_rival_2', type: 'actor', name: rival.name, properties: {} } as GraphNode);
    addNamedLocation(state.graph, 'loc_36', 'Ashford');
    const plan = buildRivalScheme(rival, rs, CORRUPTIVE_FAMILY, 0, state.tick, 'loc_36', 'Ashford', () => 0.5);
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];

    const texts: string[] = [];
    for (let i = 0; i < 100; i++) {
      tick(state);
      for (const e of state.tickEvents) texts.push(e.message);
    }
    for (const c of state.chronicleEntries) texts.push(`${c.title} ${c.prose}`);

    expect(state.chronicleEntries.length).toBeGreaterThan(0);
    expect(texts.some((t) => t.includes('Ashford'))).toBe(true);
    expect(texts.filter((t) => ID_LEAK.test(t))).toEqual([]);
  });

  it('the crack beat reads the target from node.name (the worldgen shape)', () => {
    const rival = rivalDef('actor_rival_1', 'subtle');
    const rs = rivalState('actor_rival_1');
    const state = makeState({ rivalDefinitions: [rival], rivalStates: [rs] });
    state.graph.addNode({ id: 'actor_rival_1', type: 'actor', name: rival.name, properties: {} } as GraphNode);
    addNamedLocation(state.graph, 'elder_ruin_1', 'the Dust Hollows');
    const plan = buildRivalScheme(rival, rs, ECONOMIC_FAMILY, 0, state.tick, 'elder_ruin_1', 'the Dust Hollows', () => 0.1);
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];
    const messages: string[] = [];
    for (let i = 0; i < 120; i++) {
      tick(state);
      for (const e of state.tickEvents) messages.push(e.message);
    }
    // Non-vacuity: the crack beat fired and named the place.
    expect(messages.some((m) => m.includes('breaks over the Dust Hollows'))).toBe(true);
    expect(messages.filter((m) => ID_LEAK.test(m))).toEqual([]);
  });

  it('contestable sources carry the host name, not its id', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: {} } as GraphNode);
    graph.addNode({
      id: 'loc_7',
      type: 'location',
      name: 'Greyhallow Shrine',
      properties: {
        hexCol: 1,
        hexRow: 1,
        essenceSource: { kind: 'shrine', sphereAffinity: 'force', sanctity: 0.8, tier: 'flowering' },
      },
    } as GraphNode);
    graph.addEdge({ id: 'e1', source: 'asc-1', target: 'loc_7', type: 'controls', properties: {} });
    expect(findContestableSources(graph, 'asc-1').map((s) => s.name)).toEqual(['Greyhallow Shrine']);
  });
});

// ─── Site 3: dissolution line ────────────────────────────────────────

describe('dissolution chronicle line (site 3 + the doubled entry)', () => {
  function dissolvingState(): GameState {
    const state = makeState({ tick: 5 });
    state.graph.addNode({
      id: 'actor.yael',
      type: 'actor',
      name: 'Yael',
      properties: { actorType: 'individual', quintessence: 0 },
    } as GraphNode);
    (state as unknown as { pendingQuintessenceEvents: unknown[] }).pendingQuintessenceEvents = [];
    return state;
  }

  it('reads as prose, not a rule key', () => {
    const state = dissolvingState();
    const out = phaseQuintessence(state);
    const line = (out.tickEvents ?? []).find((e) => e.type === 'dissolution_event');
    expect(line?.message).toMatch(/^Yael has dissolved\. /);
    expect(line?.message).not.toMatch(/Rule: [a-z_]+/);
  });

  it('announces a dissolution once, not every tick the node sits at zero', () => {
    const state = dissolvingState();
    const first = phaseQuintessence(state);
    state.tick += 1;
    const second = phaseQuintessence(state);
    const count = (r: typeof first) => (r.tickEvents ?? []).filter((e) => e.type === 'dissolution_event').length;
    expect(count(first)).toBe(1);
    expect(count(second)).toBe(0);
  });
});
