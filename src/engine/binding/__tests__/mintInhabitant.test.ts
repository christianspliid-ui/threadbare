/**
 * Born real, through the valve — THR-1296 slice 3.
 *
 * Two things are under test, and they fail in opposite directions:
 *
 * 1. **The birth contract.** The recon (THR-1289) measured exactly what today's
 *    support mint omits, and every omission has a named consequence. These tests
 *    assert the *presence and scale* of each one rather than "a node was written",
 *    because a node was always written — that was never the defect.
 * 2. **The valve.** The budget is the deliverable (THR-814/THR-162). A test that
 *    only proves a mint happens would pass just as happily on the unmetered path
 *    this replaces, so the budget, the queue bound and the one-per-tick shape are
 *    each pinned against a queue deliberately deeper than the budget.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { UndertakingMintRequest } from '../../../types/strategicAction';
import type { BinderMintTrace } from '../../../types/trace';
import type { ReachDomain } from '../../../types/traits';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import type { EssencePool } from '../../../types/influence';
import { SPHERE_NAMES } from '../../../types/index';
import {
  mintInhabitant,
  mintNodeId,
  enqueueMint,
  getMintQueue,
  drainMintQueue,
  isMintReady,
} from '../mintInhabitant';
import { phaseAgentLifecycle } from '../../agentLifecycle';
import {
  BINDER_MINT_BUDGET_PER_TICK,
  BINDER_MINT_QUEUE_MAX,
} from '../../../data/binder-constants';
import { NPC_ROLE_REACH_MAP } from '../../../types/npc';

function createEmptyPool(): EssencePool {
  const pool = {} as EssencePool;
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool;
}

const PLACE = 'loc-harbour';
const STAGE = 'sub-counting-house';
const CULTURE = 'culture-tidewatch';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: PLACE, type: 'location', name: 'Tidewatch',
    properties: { hexCol: 3, hexRow: 4, sphereInfluence: { order: 0.6, force: 0.2 } },
  });
  // A sublocation is `type: 'location'` carrying `parentLocationId` (THR-1183) —
  // the discriminator, never a subtype string.
  graph.addNode({
    id: STAGE, type: 'location', name: 'The Counting House',
    properties: { parentLocationId: PLACE },
  });
  graph.addEdge({
    id: 'e-contains', source: PLACE, target: STAGE, type: 'contains', properties: {},
  });
  // A culture is `type: 'actor'` + `actorType: 'culture'` — the shape
  // `cultureGenerator.ts:565` writes. Inventing a `type: 'culture'` node here would
  // make the fixture agree with itself and with nothing the engine produces.
  graph.addNode({
    id: CULTURE, type: 'actor', name: 'Tidewatch Rule',
    properties: {
      actorType: 'culture',
      cultureIdentity: { foundationBias: 'order', veneratedSpheres: ['order'] },
    },
  });
  graph.addEdge({
    id: 'e-place-culture', source: PLACE, target: CULTURE,
    type: 'belongs_to', properties: { cultureLayer: 'current' },
  });
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'Player God',
    properties: { actorType: 'ascendant' },
  });
  return graph;
}

function stateWith(graph: WorldGraph, tick = 10): GameState {
  return {
    tick,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: { entropy: 0.2 } as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: createEmptyPool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    strategicState: { projects: [], controls: [], history: [] },
  } as unknown as GameState;
}

function request(over: Partial<UndertakingMintRequest> = {}): UndertakingMintRequest {
  return {
    projectId: 'proj-ledger',
    castKey: '$clerk',
    stepIndex: 0,
    role: 'merchant',
    placementNodeId: STAGE,
    persistence: 'must-persist',
    requestedAtTick: 9,
    ...over,
  };
}

function mintTraces(): BinderMintTrace[] {
  return getTraces().filter(t => t.category === 'binder_mint') as BinderMintTrace[];
}

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

describe('mintInhabitant — the birth contract', () => {
  it('writes every property the recon measured missing from support mints', () => {
    const graph = world();
    const state = stateWith(graph);

    const outcome = mintInhabitant(state, request());
    expect(outcome).not.toBeNull();

    const node = graph.getNode(outcome!.nodeId)!;
    expect(node.type).toBe('actor');
    expect(node.properties.actorType).toBe('individual');

    // Identity — without this the mint is invisible to every value-scored system.
    expect(node.properties.axiologicalProfile).toBeDefined();
    expect(Object.keys(node.properties.axiologicalProfile as object).length).toBeGreaterThan(0);

    // Capability — the omission that makes a support mint fail EVERY reach floor.
    // Asserted on scale, not presence: a capability map on the 0–1 scale would be
    // present and still fail every floor, which is the defect wearing a disguise.
    const caps = node.properties.domainCapabilities as Record<ReachDomain, number>;
    expect(caps).toBeDefined();
    const values = Object.values(caps);
    expect(values.length).toBeGreaterThanOrEqual(8);
    expect(Math.max(...values)).toBeGreaterThan(1);

    // The role's own reach is the strongest one — a merchant is minted competent at
    // being a merchant, not competent at random.
    const affinity = NPC_ROLE_REACH_MAP['merchant'];
    const primary = caps[affinity.primary];
    for (const [domain, value] of Object.entries(caps)) {
      if (domain === affinity.primary) continue;
      expect(primary).toBeGreaterThanOrEqual(value);
    }

    // Placement — the edge AND the denormalized field `buildHexActorIndex` reads.
    expect(graph.getOutgoingEdges(node.id, 'located_at')[0]?.target).toBe(STAGE);
    expect(node.properties.locationId).toBe(STAGE);

    // Tier stated explicitly: absence reads as `'spotlight'` downstream.
    expect(node.properties.spotlightTier).toBe('ambient');

    expect(node.properties.narrativeArchetype).toBeDefined();
    expect(node.properties.cooperationStrategy).toBeDefined();
    expect(node.properties.bornTick).toBe(state.tick);
    expect(node.properties.wealth).toBeGreaterThan(0);
    expect(node.properties.npcRole).toBe('merchant');
    expect(node.properties.generatedBy).toBe('undertaking_binder');
    expect(node.properties.mintedForProjectId).toBe('proj-ledger');
  });

  it('joins the place-tier culture on the key the readers actually read', () => {
    const graph = world();
    const state = stateWith(graph);
    const outcome = mintInhabitant(state, request())!;

    const cultureEdge = graph.getOutgoingEdges(outcome.nodeId, 'belongs_to')
      .find(e => e.target === CULTURE);
    expect(cultureEdge).toBeDefined();
    // `culturalStrength`, not `strength`. Every reader — getActorCultures,
    // culturalProse, culturalTension, culturalTraits — reads the former, and the
    // births block writes the latter, which is why its newborns read as culture-less.
    expect(cultureEdge!.properties.culturalStrength).toBeGreaterThan(0);
  });

  it('gives the newborn something to want', () => {
    const graph = world();
    const state = stateWith(graph);
    const outcome = mintInhabitant(state, request())!;

    const pursues = graph.getOutgoingEdges(outcome.nodeId, 'pursues');
    expect(pursues.length).toBeGreaterThan(0);
    // The ambition is a shared node, so "who else wants this?" stays one edge read.
    expect(graph.getNode(pursues[0].target)?.type).toBe('ambition');
  });

  it('is born to an identity requirement, past the bar rather than at it', () => {
    const graph = world();
    const state = stateWith(graph);
    const outcome = mintInhabitant(state, request({
      identityRequirement: { axis: 'asceticism_extravagance', pole: 'virtue', minStrength: 0.3 },
    }))!;

    const profile = graph.getNode(outcome.nodeId)!.properties
      .axiologicalProfile as Record<string, number>;
    // Storage is signed ±1; the requirement's 0.3 is a distance from canonical
    // neutral (0.5), so clearing it means a signed value comfortably past 0.6.
    expect(profile.asceticism_extravagance).toBeGreaterThan(0.6);

    const vice = mintInhabitant(state, request({
      castKey: '$rival',
      identityRequirement: { axis: 'asceticism_extravagance', pole: 'vice', minStrength: 0.3 },
    }))!;
    const viceProfile = graph.getNode(vice.nodeId)!.properties
      .axiologicalProfile as Record<string, number>;
    expect(viceProfile.asceticism_extravagance).toBeLessThan(-0.6);
  });

  it('takes a deterministic, instance-unique id and is idempotent on replay', () => {
    const graph = world();
    const state = stateWith(graph);

    expect(mintNodeId('proj-ledger', '$clerk')).toBe('mint_proj-ledger_$clerk');

    const first = mintInhabitant(state, request())!;
    expect(first.reused).toBe(false);
    const second = mintInhabitant(state, request())!;
    expect(second.reused).toBe(true);
    expect(second.nodeId).toBe(first.nodeId);
    // One person, not two: a replayed drain must not double-bear.
    expect(graph.getNodesByType('actor').filter(n => n.id.startsWith('mint_')).length).toBe(1);
  });

  it('produces the same person no matter WHEN the queue drains', () => {
    // The determinism claim that matters here (NFP #3): the mint's rng derives from
    // the request, never from the tick, so a slow tick changes the timing of a birth
    // and never its identity. Draining at tick 10 and at tick 40 must agree.
    const early = stateWith(world(), 10);
    const late = stateWith(world(), 40);

    const a = mintInhabitant(early, request())!;
    const b = mintInhabitant(late, request())!;

    const nodeA = early.graph.getNode(a.nodeId)!;
    const nodeB = late.graph.getNode(b.nodeId)!;
    expect(nodeB.name).toBe(nodeA.name);
    expect(nodeB.properties.narrativeArchetype).toBe(nodeA.properties.narrativeArchetype);
    expect(nodeB.properties.axiologicalProfile).toEqual(nodeA.properties.axiologicalProfile);
    expect(nodeB.properties.domainCapabilities).toEqual(nodeA.properties.domainCapabilities);
    // Only the tick-stamped facts differ, which is the point.
    expect(nodeB.properties.bornTick).not.toBe(nodeA.properties.bornTick);
  });

  it('honours an authored name and otherwise names from the place culture', () => {
    const graph = world();
    const state = stateWith(graph);

    const authored = mintInhabitant(state, request({
      castKey: '$named', spawnName: 'Wren Halloway',
    }))!;
    expect(graph.getNode(authored.nodeId)!.name).toBe('Wren Halloway');

    const derived = mintInhabitant(state, request({ castKey: '$unnamed' }))!;
    const name = graph.getNode(derived.nodeId)!.name;
    expect(name).toBeTruthy();
    expect(name).not.toBe('$unnamed');
  });

  it('refuses fail-soft when the placement evaporated before the valve', () => {
    const graph = world();
    const state = stateWith(graph);

    const outcome = mintInhabitant(state, request({ placementNodeId: 'sub-razed' }));
    expect(outcome).toBeNull();
    const refusal = mintTraces().find(t => t.outcome === 'refused');
    expect(refusal?.refusedReason).toBe('placement_missing');
  });
});

describe('the mint valve', () => {
  it('queues rather than bearing immediately, and answers isMintReady honestly', () => {
    const graph = world();
    const state = stateWith(graph);

    const result = enqueueMint(state.strategicState, request(), state.tick);
    expect(result).toMatchObject({ queued: true, alreadyQueued: false });
    expect(getMintQueue(state.strategicState).length).toBe(1);
    // Queued is not born. A checkpoint asking "is my clerk here yet?" must get no.
    expect(isMintReady(graph, 'proj-ledger', '$clerk')).toBe(false);

    drainMintQueue(state);
    expect(isMintReady(graph, 'proj-ledger', '$clerk')).toBe(true);
  });

  it('is idempotent per slot — a re-binding checkpoint cannot flood the queue', () => {
    const state = stateWith(world());
    for (let i = 0; i < 5; i++) {
      enqueueMint(state.strategicState, request(), state.tick + i);
    }
    expect(getMintQueue(state.strategicState).length).toBe(1);
    expect(mintTraces().filter(t => t.refusedReason === 'duplicate_request').length).toBe(4);
  });

  it('refuses past the queue bound instead of growing without limit', () => {
    const state = stateWith(world());
    for (let i = 0; i < BINDER_MINT_QUEUE_MAX; i++) {
      enqueueMint(state.strategicState, request({ castKey: `$slot-${i}` }), state.tick);
    }
    const overflow = enqueueMint(
      state.strategicState, request({ castKey: '$one-too-many' }), state.tick,
    );
    expect(overflow).toEqual({ queued: false, reason: 'queue_full' });
    expect(getMintQueue(state.strategicState).length).toBe(BINDER_MINT_QUEUE_MAX);
    expect(mintTraces().some(t => t.refusedReason === 'queue_full')).toBe(true);
  });

  it('spends the budget and no more, against a queue deeper than it', () => {
    const state = stateWith(world());
    for (let i = 0; i < 4; i++) {
      enqueueMint(state.strategicState, request({ castKey: `$slot-${i}` }), state.tick);
    }

    const drain = drainMintQueue(state);
    expect(drain.minted.length).toBe(BINDER_MINT_BUDGET_PER_TICK);
    expect(drain.remaining).toBe(4 - BINDER_MINT_BUDGET_PER_TICK);
    // FIFO: the slot that waited longest is born first.
    expect(drain.minted[0]).toBe(mintNodeId('proj-ledger', '$slot-0'));
  });

  it('drops an unbearable request rather than letting it hold the budget forever', () => {
    const state = stateWith(world());
    enqueueMint(state.strategicState, request({
      castKey: '$ghost', placementNodeId: 'sub-razed',
    }), state.tick);
    enqueueMint(state.strategicState, request({ castKey: '$real' }), state.tick);

    const drain = drainMintQueue(state);
    // The dead request does not consume this tick's slot, and does not come back.
    expect(drain.minted).toEqual([mintNodeId('proj-ledger', '$real')]);
    expect(drain.remaining).toBe(0);
  });

  it('is a pure no-op on an empty queue', () => {
    const graph = world();
    const state = stateWith(graph);
    const before = graph.getNodesByType('actor').length;

    expect(drainMintQueue(state)).toEqual({ minted: [], remaining: 0 });
    expect(graph.getNodesByType('actor').length).toBe(before);
    expect(mintTraces().length).toBe(0);
  });

  it('traces the whole life of a request, with the queue depth on every entry', () => {
    const state = stateWith(world());
    enqueueMint(state.strategicState, request(), 9);
    state.tick = 12;
    drainMintQueue(state);

    const traces = mintTraces();
    expect(traces.map(t => t.outcome)).toEqual(['queued', 'minted']);
    expect(traces[0].queueDepth).toBe(1);
    // The valve's observed latency — the number that says whether the budget holds.
    expect(traces[1].waitedTicks).toBe(3);
  });
});

describe('the valve inside phaseAgentLifecycle', () => {
  it('bears a queued mint through the births block and skips the ambient roll', () => {
    const graph = world();
    const state = stateWith(graph, 5);
    enqueueMint(state.strategicState, request(), 4);

    let n = 0;
    const result = phaseAgentLifecycle(state, () => `ev-${++n}`);

    expect(graph.getNode(mintNodeId('proj-ledger', '$clerk'))).toBeDefined();
    const births = (result.tickEvents ?? []).filter(e => (e as { type: string }).type === 'agent_birth');
    // One birth this tick, and it is the mint — the one-per-tick shape holds across
    // both paths rather than each honouring it separately.
    expect(births.length).toBe(1);
    expect((births[0] as { actorId: string }).actorId).toBe(mintNodeId('proj-ledger', '$clerk'));
  });

  it('leaves a world with no queued mints exactly as it found it', () => {
    const graph = world();
    const state = stateWith(graph, 5);
    const before = graph.getNodesByType('actor').length;

    let n = 0;
    phaseAgentLifecycle(state, () => `ev-${++n}`);

    expect(graph.getNodesByType('actor').length).toBe(before);
    expect(mintTraces().length).toBe(0);
  });
});
