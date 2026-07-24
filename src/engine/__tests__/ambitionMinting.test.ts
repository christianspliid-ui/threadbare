import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  mintAmbitionsFromEvents,
  buildAmbitionAgentSnapshot,
  phaseAmbitionProgress,
  MINT_MAX_PER_EVENT,
  MINT_LOOKBACK_TICKS,
  AMBITION_REEVAL_INTERVAL,
  MILESTONE_CHECK_INTERVAL,
  resetAmbitionEventCounter,
} from '../ambitionTick';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import { AMBITION_MINTING_RULES } from '../../data/ambition-minting-rules';

const ACTOR = 'actor.mint';
const EVENT = 'evt_raid_1';
const LOC = 'loc.thornhaven';

// A re-eval tick that also passes the milestone-check top guard (LCM of 15 and 25).
const REEVAL_TICK = MILESTONE_CHECK_INTERVAL * AMBITION_REEVAL_INTERVAL === 375
  ? 75 // 15*25 shares factor 5 → LCM 75
  : MILESTONE_CHECK_INTERVAL * AMBITION_REEVAL_INTERVAL;

function makeState(graph: WorldGraph, tick: number, seed = 42): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed,
    graph, cosmology: {} as any, tiles: [], clock: {} as any,
    ascendantId: 'asc_1', essencePool: {} as any,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: new Map() as any,
    familiarityMap: new Map() as any, culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
  } as unknown as GameState;
}

/** Actor + a violence event (iron-tested) at a named location, tick 70. */
function seedViolenceGraph(relation: 'victim' | 'witness'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR, type: 'actor', name: 'Bereaved',
    properties: { actorType: 'individual', domainCapabilities: { iron: 0.3, shadow: 0.3, heart: 0.2 } },
  });
  graph.addNode({ id: LOC, type: 'location', name: 'Thornhaven', properties: {} });
  graph.addNode({
    id: EVENT, type: 'event', name: 'Raid (Step 1)',
    properties: { eventType: 'encounter_outcome', reachTested: 'iron', outcome: 'failure', tick: 70 },
  });
  graph.addEdge({ id: `${EVENT}_occ`, source: EVENT, target: LOC, type: 'occurred_at', properties: { tick: 70 } });
  if (relation === 'victim') {
    graph.addEdge({ id: `${ACTOR}_part`, source: ACTOR, target: EVENT, type: 'participated_in', properties: { role: 'target', outcome: 'failure', tick: 70 } });
  } else {
    graph.addEdge({ id: `${ACTOR}_loc`, source: ACTOR, target: LOC, type: 'located_at', properties: {} });
  }
  return graph;
}

/** First seed in [0, limit) that produces a mint — deterministic across runs. */
function firstMintingSeed(
  graph: WorldGraph, tick: number, limit = 60,
): ReturnType<typeof mintAmbitionsFromEvents> {
  const snapshot = buildAmbitionAgentSnapshot(graph, ACTOR);
  for (let s = 0; s < limit; s++) {
    const minted = mintAmbitionsFromEvents(graph, ACTOR, tick, s, snapshot, new Set(), new Map());
    if (minted) return minted;
  }
  return null;
}

describe('mintAmbitionsFromEvents', () => {
  it('mints a themed want from a violence event the agent was victim of', () => {
    const graph = seedViolenceGraph('victim');
    const minted = firstMintingSeed(graph, REEVAL_TICK);
    expect(minted).not.toBeNull();
    const violenceVictimIds = new Set(
      (AMBITION_MINTING_RULES.violence.victim ?? []).map((e) => e.templateId),
    );
    expect(violenceVictimIds.has(minted!.templateId)).toBe(true);
    expect(minted!.mintedByEventId).toBe(EVENT);
    expect(minted!.eventClass).toBe('violence');
    // Provenance label names the place, no digits.
    expect(minted!.mintedByLabel).toContain('Thornhaven');
    expect(/\d/.test(minted!.mintedByLabel)).toBe(false);
  });

  it('mints from a witnessed event at the agent location', () => {
    const graph = seedViolenceGraph('witness');
    const minted = firstMintingSeed(graph, REEVAL_TICK);
    expect(minted).not.toBeNull();
    const witnessIds = new Set(
      (AMBITION_MINTING_RULES.violence.witness ?? []).map((e) => e.templateId),
    );
    expect(witnessIds.has(minted!.templateId)).toBe(true);
  });

  it('returns null when there are no qualifying events', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: ACTOR, type: 'actor', name: 'Idle',
      properties: { actorType: 'individual', domainCapabilities: { iron: 0.3 } },
    });
    const snapshot = buildAmbitionAgentSnapshot(graph, ACTOR);
    for (let s = 0; s < 20; s++) {
      expect(mintAmbitionsFromEvents(graph, ACTOR, REEVAL_TICK, s, snapshot, new Set(), new Map())).toBeNull();
    }
  });

  it('ignores events outside the lookback window', () => {
    const graph = seedViolenceGraph('victim');
    // Push the event far in the past — well before tick - MINT_LOOKBACK_TICKS.
    graph.getNode(EVENT)!.properties.tick = REEVAL_TICK - MINT_LOOKBACK_TICKS - 5;
    const snapshot = buildAmbitionAgentSnapshot(graph, ACTOR);
    for (let s = 0; s < 30; s++) {
      expect(mintAmbitionsFromEvents(graph, ACTOR, REEVAL_TICK, s, snapshot, new Set(), new Map())).toBeNull();
    }
  });

  it('respects the per-event mint cap', () => {
    const graph = seedViolenceGraph('victim');
    const snapshot = buildAmbitionAgentSnapshot(graph, ACTOR);
    const capped = new Map<string, number>([[EVENT, MINT_MAX_PER_EVENT]]);
    for (let s = 0; s < 30; s++) {
      expect(mintAmbitionsFromEvents(graph, ACTOR, REEVAL_TICK, s, snapshot, new Set(), capped)).toBeNull();
    }
  });

  it('does not re-mint a template the agent already pursues', () => {
    const graph = seedViolenceGraph('victim');
    const snapshot = buildAmbitionAgentSnapshot(graph, ACTOR);
    const allCandidates = new Set(
      (AMBITION_MINTING_RULES.violence.victim ?? []).map((e) => e.templateId),
    );
    for (let s = 0; s < 30; s++) {
      expect(mintAmbitionsFromEvents(graph, ACTOR, REEVAL_TICK, s, snapshot, allCandidates, new Map())).toBeNull();
    }
  });
});

describe('phaseAmbitionProgress — minting integration', () => {
  beforeEach(() => {
    resetAmbitionEventCounter();
    clearTraces();
    enableTracing();
  });

  it('creates a minted pursues edge and one aggregate trace at a re-eval tick', () => {
    // Find a state.seed that produces a mint for this actor (deterministic search).
    let minted = false;
    for (let seed = 0; seed < 60 && !minted; seed++) {
      const graph = seedViolenceGraph('victim');
      clearTraces();
      const state = makeState(graph, REEVAL_TICK, seed);
      phaseAmbitionProgress(state);
      const mintedEdge = graph.getOutgoingEdges(ACTOR, 'pursues')
        .find((e) => typeof e.properties.mintedByEventId === 'string');
      if (mintedEdge) {
        minted = true;
        expect(mintedEdge.properties.mintedByEventId).toBe(EVENT);
        expect(typeof mintedEdge.properties.mintedByLabel).toBe('string');
        expect(mintedEdge.properties.status).toBe('active');
        const traces = getTraces().filter((t) => t.category === 'ambition_minted');
        expect(traces.length).toBe(1); // exactly one aggregate per tick
        expect((traces[0] as any).mintedCount).toBeGreaterThan(0);
      }
    }
    expect(minted).toBe(true);
  });
});
