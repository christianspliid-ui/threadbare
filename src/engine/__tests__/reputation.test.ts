/**
 * Reputation — the one social score between any two parties. THR-1206.
 *
 * Plan: `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`
 *
 * The read API dispatches over four legs, and the whole point of the unification is
 * that they answer in one vocabulary — so each leg is covered in **both** directions
 * (a leg that can only report good standing is not a social score), plus the priority
 * order between them, the write's clamp/mint/resolve behaviour, and decay's
 * fade-to-deletion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  REPUTATION_WITH_DECAY_PER_TICK,
  REPUTATION_WITH_DEFAULT,
  REPUTATION_WITH_MAX_DELTA_PER_OUTCOME,
  REPUTATION_WITH_PRUNE_EPSILON,
  REPUTATION_LEVERAGE_SCALE,
  applyReputationWithDelta,
  decayReputationWithEdges,
  getNotableStandings,
  getReputationWith,
  meetsReputationWithRequirement,
  reputationBandRank,
  reputationLeverageTerm,
} from '../reputation';
import { getReputationWord } from '../../data/domain-words';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function graphWith(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'agent.other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction.guild', type: 'actor', name: 'The Guild', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc.town', type: 'location', name: 'Sacred Grove', properties: { locationSubtype: 'settlement' } });
  return graph;
}

/** A place inside `loc.town` — the three-tier shape (`parentLocationId` discriminates). */
function addShrine(graph: WorldGraph): void {
  graph.addNode({
    id: 'loc.shrine', type: 'location', name: 'The Shrine',
    properties: { parentLocationId: 'loc.town' },
  });
}

// ─── The read: four legs, both polarities ────────────────────────────────────

describe('getReputationWith — dispatch legs', () => {
  it('reads neutral by default, with the shared band vocabulary', () => {
    const graph = graphWith();
    const reading = getReputationWith(graph, 'agent.hero', 'loc.town');
    expect(reading.source).toBe('default');
    expect(reading.score).toBe(REPUTATION_WITH_DEFAULT);
    expect(reading.band).toBe(getReputationWord(REPUTATION_WITH_DEFAULT));
  });

  it('reads the membership leg for a faction the actor belongs to — high and low', () => {
    const graph = graphWith();
    graph.addEdge({
      id: 'm1', source: 'agent.hero', target: 'faction.guild', type: 'member_of',
      properties: { role: 'member', rank: 0.5, joinedTick: 0, reputation: 0.9 },
    });
    expect(getReputationWith(graph, 'agent.hero', 'faction.guild')).toMatchObject({
      source: 'membership', score: 0.9, band: 'Revered',
    });

    graph.getEdge('m1')!.properties.reputation = 0.1;
    expect(getReputationWith(graph, 'agent.hero', 'faction.guild')).toMatchObject({
      source: 'membership', score: 0.1, band: 'Distrusted',
    });
  });

  it('reads the edge leg for a place — above and below neutral', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.12, 5, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'loc.town')).toMatchObject({
      source: 'edge', score: 0.62,
    });

    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', -0.15, 6, 'test');
    const soured = getReputationWith(graph, 'agent.hero', 'loc.town');
    expect(soured.source).toBe('edge');
    expect(soured.score).toBeLessThan(REPUTATION_WITH_DEFAULT);
  });

  it('reads the bond leg from relates_to trust, remapping [-1,1] → [0,1]', () => {
    const graph = graphWith();
    graph.addEdge({
      id: 'r1', source: 'agent.hero', target: 'agent.other', type: 'relates_to',
      properties: { trust: 1 },
    });
    expect(getReputationWith(graph, 'agent.hero', 'agent.other')).toMatchObject({
      source: 'bond', score: 1,
    });

    graph.getEdge('r1')!.properties.trust = -1;
    expect(getReputationWith(graph, 'agent.hero', 'agent.other')).toMatchObject({
      source: 'bond', score: 0,
    });
  });

  it('prefers membership over a stale edge — one answer, not two', () => {
    // Rank, access and expulsion all hang off the membership leg, so a second
    // answer would let the profile row and the rank gate disagree about the same
    // guild on the same screen.
    const graph = graphWith();
    graph.addEdge({
      id: 'm1', source: 'agent.hero', target: 'faction.guild', type: 'member_of',
      properties: { role: 'member', rank: 0.5, joinedTick: 0, reputation: 0.8 },
    });
    applyReputationWithDelta(graph, 'agent.hero', 'faction.guild', -0.15, 1, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'faction.guild')).toMatchObject({
      source: 'membership', score: 0.8,
    });
  });

  it('prefers the edge over the bond for a person', () => {
    const graph = graphWith();
    graph.addEdge({
      id: 'r1', source: 'agent.hero', target: 'agent.other', type: 'relates_to',
      properties: { trust: -1 },
    });
    applyReputationWithDelta(graph, 'agent.hero', 'agent.other', 0.15, 1, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'agent.other').source).toBe('edge');
  });

  it('is directional — a→b need not equal b→a', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'agent.other', 0.15, 1, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'agent.other').source).toBe('edge');
    expect(getReputationWith(graph, 'agent.other', 'agent.hero').source).toBe('default');
  });

  it('fails soft on missing nodes and on self', () => {
    const graph = graphWith();
    expect(getReputationWith(graph, 'agent.hero', 'nope').source).toBe('default');
    expect(getReputationWith(graph, 'nope', 'loc.town').source).toBe('default');
    expect(getReputationWith(graph, 'agent.hero', 'agent.hero').source).toBe('default');
  });
});

// ─── The write ───────────────────────────────────────────────────────────────

describe('applyReputationWithDelta', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('mints at neutral on first write and stamps the tick', () => {
    const graph = graphWith();
    const result = applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.1, 7, 'test');
    expect(result.applied).toBe(true);
    expect(result.score).toBeCloseTo(REPUTATION_WITH_DEFAULT + 0.1, 6);

    const edges = graph.getOutgoingEdges('agent.hero', 'reputation_with');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.lastChangedTick).toBe(7);
  });

  it('caps an authored delta at the per-outcome maximum, both signs', () => {
    const graph = graphWith();
    const up = applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.9, 1, 'test');
    expect(up.clamped).toBe(true);
    expect(up.score).toBeCloseTo(REPUTATION_WITH_DEFAULT + REPUTATION_WITH_MAX_DELTA_PER_OUTCOME, 6);

    const down = applyReputationWithDelta(graph, 'agent.other', 'loc.town', -0.9, 1, 'test');
    expect(down.clamped).toBe(true);
    expect(down.score).toBeCloseTo(REPUTATION_WITH_DEFAULT - REPUTATION_WITH_MAX_DELTA_PER_OUTCOME, 6);
  });

  it('clamps the resulting score to [0,1] across many writes', () => {
    const graph = graphWith();
    for (let i = 0; i < 20; i++) applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, i, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'loc.town').score).toBe(1);

    for (let i = 0; i < 40; i++) applyReputationWithDelta(graph, 'agent.hero', 'loc.town', -0.15, i, 'test');
    expect(getReputationWith(graph, 'agent.hero', 'loc.town').score).toBe(0);
  });

  it('resolves a sublocation target up to its parent place (three-tier rule)', () => {
    // "Standing at the shrine" and "standing in the town that holds it" must be one
    // number, or the player reconciles two scores for one relationship.
    const graph = graphWith();
    addShrine(graph);
    const result = applyReputationWithDelta(graph, 'agent.hero', 'loc.shrine', 0.1, 1, 'test');
    expect(result.effectiveTargetId).toBe('loc.town');
    expect(getReputationWith(graph, 'agent.hero', 'loc.town').source).toBe('edge');
    expect(getReputationWith(graph, 'agent.hero', 'loc.shrine').source).toBe('default');
  });

  it('refuses a sublocation whose parent is missing, rather than writing it somewhere', () => {
    const graph = graphWith();
    graph.addNode({
      id: 'loc.orphan', type: 'location', name: 'Orphan',
      properties: { parentLocationId: 'loc.gone' },
    });
    const result = applyReputationWithDelta(graph, 'agent.hero', 'loc.orphan', 0.1, 1, 'test');
    expect(result.applied).toBe(false);
    expect(result.reason).toBe('unresolvable_sublocation');
    expect(graph.getEdgesByType('reputation_with')).toHaveLength(0);
  });

  it('refuses missing nodes, self-standing and a non-finite delta — never throws', () => {
    const graph = graphWith();
    expect(applyReputationWithDelta(graph, 'nope', 'loc.town', 0.1, 1, 't').reason).toBe('missing_source');
    expect(applyReputationWithDelta(graph, 'agent.hero', 'nope', 0.1, 1, 't').reason).toBe('missing_target');
    expect(applyReputationWithDelta(graph, 'agent.hero', 'agent.hero', 0.1, 1, 't').reason).toBe('self');
    expect(applyReputationWithDelta(graph, 'agent.hero', 'loc.town', NaN, 1, 't').reason).toBe('invalid_delta');
    expect(graph.getEdgesByType('reputation_with')).toHaveLength(0);
  });

  it('emits a reputation_with_changed trace carrying the cause', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.1, 3, 'encounter_aftermath:x:y');
    const trace = getTraces().find(t => t.category === 'reputation_with_changed') as
      | { sourceId: string; targetId: string; cause: string; newScore: number } | undefined;
    expect(trace).toBeDefined();
    expect(trace!.sourceId).toBe('agent.hero');
    expect(trace!.targetId).toBe('loc.town');
    expect(trace!.cause).toBe('encounter_aftermath:x:y');
  });
});

// ─── Decay ───────────────────────────────────────────────────────────────────

describe('decayReputationWithEdges', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('drifts toward neutral from both sides, never past it', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, 1, 'test');
    applyReputationWithDelta(graph, 'agent.other', 'loc.town', -0.15, 1, 'test');

    decayReputationWithEdges(graph, 2);

    const above = getReputationWith(graph, 'agent.hero', 'loc.town').score;
    const below = getReputationWith(graph, 'agent.other', 'loc.town').score;
    expect(above).toBeCloseTo(0.65 - REPUTATION_WITH_DECAY_PER_TICK, 6);
    expect(below).toBeCloseTo(0.35 + REPUTATION_WITH_DECAY_PER_TICK, 6);
    expect(above).toBeGreaterThan(REPUTATION_WITH_DEFAULT);
    expect(below).toBeLessThan(REPUTATION_WITH_DEFAULT);
  });

  it('deletes an edge that has faded inside the prune epsilon, and traces the fade', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, 1, 'test');
    const edge = graph.getOutgoingEdges('agent.hero', 'reputation_with')[0];
    // Park it just outside the epsilon so exactly one decay step crosses it.
    edge.properties.score = REPUTATION_WITH_DEFAULT
      + REPUTATION_WITH_PRUNE_EPSILON + REPUTATION_WITH_DECAY_PER_TICK / 2;

    const result = decayReputationWithEdges(graph, 3);
    expect(result.pruned).toBe(1);
    expect(graph.getEdgesByType('reputation_with')).toHaveLength(0);
    expect(getTraces().some(t => t.category === 'reputation_with_pruned')).toBe(true);
    // Fading out reads as "nobody remembers any more" — the default, not a hole.
    expect(getReputationWith(graph, 'agent.hero', 'loc.town').source).toBe('default');
  });

  it('leaves a standing well clear of neutral alone for many ticks', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, 1, 'test');
    for (let tick = 2; tick < 50; tick++) decayReputationWithEdges(graph, tick);
    expect(graph.getEdgesByType('reputation_with')).toHaveLength(1);
    expect(getReputationWith(graph, 'agent.hero', 'loc.town').score)
      .toBeGreaterThan(REPUTATION_WITH_DEFAULT + REPUTATION_WITH_PRUNE_EPSILON);
  });
});

// ─── Consumers ───────────────────────────────────────────────────────────────

describe('the gate', () => {
  it('opens above the band and closes below it', () => {
    const graph = graphWith();
    // A gate that never rejects is not a gate — both arms, on the same fixture.
    expect(meetsReputationWithRequirement(graph, 'agent.hero', 'loc.town', 'Respected')).toBe(false);
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, 1, 'test');
    expect(meetsReputationWithRequirement(graph, 'agent.hero', 'loc.town', 'Respected')).toBe(true);
    expect(meetsReputationWithRequirement(graph, 'agent.hero', 'loc.town', 'Accepted')).toBe(true);
    expect(meetsReputationWithRequirement(graph, 'agent.hero', 'loc.town', 'Revered')).toBe(false);
  });

  it('never opens on a band name that is not in the vocabulary', () => {
    // An authored typo must close the door, not open it.
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.15, 1, 'test');
    expect(meetsReputationWithRequirement(graph, 'agent.hero', 'loc.town', 'Beloved')).toBe(false);
    expect(reputationBandRank('Beloved')).toBe(-1);
    expect(reputationBandRank('Accepted')).toBeGreaterThan(reputationBandRank('Distrusted'));
  });
});

describe('the leverage term', () => {
  it('is signed and centred on neutral', () => {
    const graph = graphWith();
    expect(reputationLeverageTerm(graph, 'agent.hero', 'agent.other')).toBe(0);

    applyReputationWithDelta(graph, 'agent.hero', 'agent.other', 0.15, 1, 'test');
    expect(reputationLeverageTerm(graph, 'agent.hero', 'agent.other'))
      .toBeCloseTo(0.15 * REPUTATION_LEVERAGE_SCALE, 6);

    applyReputationWithDelta(graph, 'agent.other', 'agent.hero', -0.15, 1, 'test');
    expect(reputationLeverageTerm(graph, 'agent.other', 'agent.hero'))
      .toBeCloseTo(-0.15 * REPUTATION_LEVERAGE_SCALE, 6);
  });
});

describe('getNotableStandings', () => {
  it('ranks by distance from neutral, in either direction, and honours the limit', () => {
    const graph = graphWith();
    applyReputationWithDelta(graph, 'agent.hero', 'loc.town', 0.03, 1, 'test');
    applyReputationWithDelta(graph, 'agent.hero', 'agent.other', -0.15, 1, 'test');
    applyReputationWithDelta(graph, 'agent.hero', 'faction.guild', 0.09, 1, 'test');

    const all = getNotableStandings(graph, 'agent.hero', 5);
    expect(all.map(s => s.targetId)).toEqual(['agent.other', 'faction.guild', 'loc.town']);
    expect(getNotableStandings(graph, 'agent.hero', 2)).toHaveLength(2);
    expect(getNotableStandings(graph, '', 5)).toEqual([]);
  });
});
