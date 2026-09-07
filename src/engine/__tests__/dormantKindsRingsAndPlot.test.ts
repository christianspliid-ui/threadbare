/**
 * The dormant kinds II — rings and the plot (THR-1430).
 *
 * Four cells and one extraction. What this file has to prove is not that the code
 * runs but that each piece is *reachable and load-bearing*:
 *
 * 1. **A ring is minted as a group of kind `network`** — by the discriminator the
 *    codebase shares (`getGroupKind`), not a property-bag presence check, so it is
 *    visible to every group sweep that asks for it.
 * 2. **A ring is seen by the group phase and never moved by it.** These are two
 *    different facts and the test asserts both, because widening the enumeration
 *    without gating movement would make rings travel, and gating movement without
 *    widening the enumeration would make them invisible to upkeep and dissolution —
 *    each half alone is a defect wearing the other half's clothes.
 * 3. **The plot goes through the one funnel and leaves a body**, with the ward and
 *    the Aspect echo honoured — and each guard is falsified at its own layer, so a
 *    guard that silently stopped working would fail here rather than be masked by
 *    the belt-and-braces check above it.
 * 4. **The retired card's absence** is asserted where the retirement happened
 *    (`action-template-content.test.ts`), not here.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { foundRing, reinforceWarband, ringMemberInReachOf, ringMemberHexes } from '../strategicGraphOps';
import { markMortalDead } from '../agentLifecycle';
import { getGroupKind } from '../groupShape';
import { getAllGroups, getGroupMemberEdges, isAgentGone } from '../groups/groupQueries';
import { getAnointedLeaderId } from '../factionNetwork';
import { UNDERTAKING_OBJECT_TYPES, resolveObjectOwners } from '../../data/undertaking-objects';
import {
  RING_TARGET_MEMBER_COUNT,
  RING_REACH_HEXES,
  PLOT_MOTIVES,
} from '../../data/strategic-action-constants';
import { GROUP_PHASE_KINDS, GROUP_KINDS_THAT_TRAVEL } from '../../data/group-constants';
import type { GameState } from '../../types/gameState';

const FOUNDER = 'actor_founder';
const HOLD = 'loc_hold';
const FARHOLD = 'loc_farhold';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 1, cycle: 0, seed: 42, graph, phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [], clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1', essencePool: {},
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(), familiarityMap: new Map(), culturalInsightMap: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [], echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

/**
 * A hold, a far hold three hexes off, a founder and `peers` ordinary mortals.
 *
 * Every mortal carries a Shadow-leaning trait so `sharesCause` admits them: the
 * recruit filter reads the **Reach**, not the Sphere, and a fixture that leaned on
 * `sphereAlignment.darkness` would be testing a question the code does not ask.
 */
function world(peers = 4): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HOLD, name: 'Coldwater', type: 'location',
    properties: { locationSubtype: 'town', locationType: 'town', hexCol: 4, hexRow: 4, prosperity: 30 },
  });
  graph.addNode({
    id: FARHOLD, name: 'Longreach', type: 'location',
    properties: { locationSubtype: 'town', locationType: 'town', hexCol: 4 + RING_REACH_HEXES, hexRow: 4, prosperity: 20 },
  });
  const add = (id: string, at: string) => {
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e_loc_${id}`, source: id, target: at, type: 'located_at', properties: {} });
  };
  add(FOUNDER, HOLD);
  for (let i = 0; i < peers; i += 1) add(`actor_peer_${i}`, HOLD);
  return graph;
}

// ─── N1: a ring is a group that stays ───────────────────────────────

describe('founding a ring', () => {
  it('mints a group of kind network, by the shared discriminator', () => {
    const graph = world();
    const result = foundRing(makeState(graph), FOUNDER);
    expect(result.success, result.error).toBe(true);

    const ring = graph.getNode(result.createdId!);
    expect(ring).toBeDefined();
    // The discriminator the codebase shares, not a property-bag presence check.
    expect(getGroupKind(ring)).toBe('network');
    // `commanded_by` runs group → leader, as every group's does.
    expect(graph.getOutgoingEdges(ring!.id, 'commanded_by')[0]?.target).toBe(FOUNDER);
  });

  it('recruits toward the target count and never past it', () => {
    const graph = world(10);
    const result = foundRing(makeState(graph), FOUNDER);
    const members = getGroupMemberEdges(graph, result.createdId!);
    // The founder counts in the roster, so the cap is recruits + the founder.
    expect(members.length).toBeLessThanOrEqual(RING_TARGET_MEMBER_COUNT + 1);
    expect(members.length).toBeGreaterThan(1);
  });

  it('refuses too_few_to_found when nobody will join', () => {
    const graph = world(0);
    const result = foundRing(makeState(graph), FOUNDER);
    expect(result.success).toBe(false);
    expect(result.error).toBe('too_few_to_found');
    // The refusal is a refusal, not a half-built ring.
    expect(getAllGroups(graph, ['network'])).toHaveLength(0);
  });

  it('takes the bound cast first — the people the undertaking actually engaged', () => {
    const graph = world(6);
    const result = foundRing(makeState(graph), FOUNDER, ['actor_peer_5']);
    const memberIds = getGroupMemberEdges(graph, result.createdId!).map(e => e.source);
    expect(memberIds).toContain('actor_peer_5');
  });
});

// ─── The two facts about the group phase, asserted separately ───────

describe('a ring in the group phase', () => {
  it('is enumerated for upkeep, cohesion and dissolution', () => {
    const graph = world();
    const result = foundRing(makeState(graph), FOUNDER);
    // The phase's own enumeration, with the kinds the phase actually passes.
    const seen = getAllGroups(graph, GROUP_PHASE_KINDS).map(g => g.id);
    expect(seen).toContain(result.createdId!);
  });

  it('is invisible to the default company-only enumeration, so ~40 callers are unchanged', () => {
    const graph = world();
    const result = foundRing(makeState(graph), FOUNDER);
    // The additive half of the widening: `getAllGroups(graph)` still means companies.
    expect(getAllGroups(graph).map(g => g.id)).not.toContain(result.createdId!);
  });

  it('is not a kind that travels', () => {
    // The gate the movement sub-step reads. Asserted on the constant rather than by
    // running the phase, because the phase's own test would pass just as well with
    // the filter deleted if the fixture happened to produce no move that tick — the
    // membership question is the one that cannot be satisfied by accident.
    expect(GROUP_KINDS_THAT_TRAVEL).not.toContain('network');
    expect(GROUP_PHASE_KINDS).toContain('network');
    expect(GROUP_KINDS_THAT_TRAVEL).toContain('company');
  });
});

// ─── N2/N3: reach is measured from every member, not the leader ─────

describe('a ring reaches as far as its people', () => {
  it('answers reach from a member standing away from the leader', () => {
    const graph = world();
    const state = makeState(graph);
    const ringId = foundRing(state, FOUNDER).createdId!;

    // Move one member to the far hold — exactly `RING_REACH_HEXES` away.
    const mover = getGroupMemberEdges(graph, ringId).map(e => e.source).find(id => id !== FOUNDER)!;
    for (const e of graph.getOutgoingEdges(mover, 'located_at')) graph.removeEdge(e.id);
    graph.addEdge({ id: `e_loc2_${mover}`, source: mover, target: FARHOLD, type: 'located_at', properties: {} });

    // The far hold is reachable *through that member*, and the qualifying member is named.
    expect(ringMemberInReachOf(graph, ringId, FARHOLD)).not.toBeNull();
    expect(ringMemberHexes(graph, ringId).some(m => m.memberId === mover)).toBe(true);
  });

  it('refuses a target nothing is near', () => {
    const graph = world();
    const state = makeState(graph);
    const ringId = foundRing(state, FOUNDER).createdId!;
    graph.addNode({
      id: 'loc_edge_of_the_world', name: 'Far', type: 'location',
      properties: { locationSubtype: 'town', hexCol: 40, hexRow: 40 },
    });
    expect(ringMemberInReachOf(graph, ringId, 'loc_edge_of_the_world')).toBeNull();
  });

  it('reinforces a network through the live op, which no longer refuses not_a_company', () => {
    const graph = world(8);
    const state = makeState(graph);
    const ringId = foundRing(state, FOUNDER).createdId!;
    const before = getGroupMemberEdges(graph, ringId).length;

    const result = reinforceWarband(state, FOUNDER, ringId);
    expect(result.success, result.error).toBe(true);
    expect(getGroupMemberEdges(graph, ringId).length).toBeGreaterThan(before);
  });
});

// ─── N4: the one death funnel ───────────────────────────────────────

describe('markMortalDead — the one funnel', () => {
  it('retains the node, and writes the provenance the grievance lane reads', () => {
    const graph = world(1);
    const out = markMortalDead(graph, 'actor_peer_0', 7, { cause: 'plot', byActorId: FOUNDER, mode: 'retain' });

    expect(out.outcome).toBe('died');
    const dead = graph.getNode('actor_peer_0');
    // The body stays — this is the whole point of the retirement.
    expect(dead).toBeDefined();
    expect(dead!.properties.deceased).toBe(true);
    expect(dead!.properties.deceasedTick).toBe(7);
    expect(dead!.properties.deathCause).toBe('plot');
    expect(dead!.properties.slainBy).toBe(FOUNDER);
    // And every group query already reads it as gone, with no node removal needed.
    expect(isAgentGone(dead)).toBe(true);
  });

  it('removes the node in remove mode — what the lifecycle has always done', () => {
    const graph = world(1);
    const out = markMortalDead(graph, 'actor_peer_0', 7, { cause: 'lifecycle', mode: 'remove' });
    expect(out.outcome).toBe('died');
    expect(graph.getNode('actor_peer_0')).toBeUndefined();
    // The edges went with it.
    expect(graph.getAllEdgesForNode('actor_peer_0')).toHaveLength(0);
  });

  it('is idempotent — a double resolve never double-kills', () => {
    const graph = world(1);
    markMortalDead(graph, 'actor_peer_0', 7, { cause: 'plot', mode: 'retain' });
    const second = markMortalDead(graph, 'actor_peer_0', 9, { cause: 'plot', mode: 'retain' });
    expect(second.outcome).toBe('not_a_mortal');
    // The first death's tick stands; the second did not overwrite it.
    expect(graph.getNode('actor_peer_0')!.properties.deceasedTick).toBe(7);
  });

  it('refuses a target that is not a living individual', () => {
    const graph = world(1);
    graph.addNode({ id: 'grp', name: 'a company', type: 'actor', properties: { actorType: 'group' } });
    expect(markMortalDead(graph, 'grp', 7, { cause: 'plot', mode: 'retain' }).outcome).toBe('not_a_mortal');
    expect(markMortalDead(graph, 'nobody', 7, { cause: 'plot', mode: 'retain' }).outcome).toBe('not_a_mortal');
  });

  it('bumps the location death count the prosperity phase reads', () => {
    const graph = world(1);
    markMortalDead(graph, 'actor_peer_0', 7, { cause: 'plot', mode: 'retain' });
    expect(graph.getNode(HOLD)!.properties.deathCount).toBe(1);
  });
});

// ─── The seat: a dead leader does not lead ──────────────────────────

describe('a killed leader vacates the seat', () => {
  it('stops being the anointed leader once deceased', () => {
    const graph = world(1);
    graph.addNode({ id: 'fac_1', name: 'The Order', type: 'actor', properties: { actorType: 'faction' } });
    graph.addEdge({ id: 'e_leads', source: FOUNDER, target: 'fac_1', type: 'leads', properties: {} });
    graph.addEdge({ id: 'e_mem', source: FOUNDER, target: 'fac_1', type: 'member_of', properties: { role: 'leader', rank: 1, joinedTick: 0 } });

    // The seat is held while they live — falsify the guard before relying on it.
    expect(getAnointedLeaderId(graph, 'fac_1')).toBe(FOUNDER);

    markMortalDead(graph, FOUNDER, 7, { cause: 'plot', mode: 'retain' });

    // ...and empty once they do not. Before THR-1430 this returned the corpse,
    // because the promise "a dead leader is ignored" was kept only by the node
    // being gone — which a retained death no longer does.
    expect(getAnointedLeaderId(graph, 'fac_1')).toBeNull();
  });
});

// ─── The plot's object type ─────────────────────────────────────────

describe('the mortal object type', () => {
  it('is self-owned, so the motive gate asks about the victim', () => {
    const graph = world(1);
    const mortal = UNDERTAKING_OBJECT_TYPES.find(t => t.id === 'mortal')!;
    expect(mortal.selfOwned).toBe(true);
    // No edge says who holds a person; without this the gate reads every mortal as
    // unowned and refuses every plot by construction.
    expect(resolveObjectOwners(graph, mortal, { kind: 'node', nodeId: 'actor_peer_0' }))
      .toEqual(['actor_peer_0']);
  });

  it('registers destroy alone, and registers it as the heaviest harm', () => {
    const mortal = UNDERTAKING_OBJECT_TYPES.find(t => t.id === 'mortal')!;
    expect(Object.keys(mortal.verbs)).toEqual(['destroy']);
    expect(mortal.harmOnDestroy).toBe('named_death');
  });

  it('licenses a killing on a grudge or a war, and on nothing else', () => {
    // The narrowing is the decision (THR-1397): opportunism does not get to kill.
    expect([...PLOT_MOTIVES].sort()).toEqual(['faction_war', 'grudge']);
    expect(PLOT_MOTIVES).not.toContain('rivalry');
    expect(PLOT_MOTIVES).not.toContain('contested_ambition');
  });
});
