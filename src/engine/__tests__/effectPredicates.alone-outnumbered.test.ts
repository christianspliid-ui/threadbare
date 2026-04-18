/**
 * alone / outnumbered predicate tests (THR-144)
 *
 * Verifies that buildPredicateContext computes real ally/enemy counts from
 * the graph rather than the stubs that always returned alone=true, outnumbered=false.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildPredicateContext, evaluatePredicate } from '../effects/effectPredicates';

// ─── Graph helpers ────────────────────────────────────────────────────────────

function addActor(
  graph: WorldGraph,
  id: string,
  locationId: string,
  factionId?: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'individual', ...(factionId ? { factionId } : {}) },
  });
  graph.addEdge({ id: `loc-${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function addLocation(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationType: 'tavern' } });
}

function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'faction', name: id, properties: {} });
}

function relateTo(
  graph: WorldGraph,
  source: string,
  target: string,
  sentiment: number,
): void {
  graph.addEdge({
    id: `rel-${source}-${target}`,
    source,
    target,
    type: 'relates_to',
    properties: { sentiment, strength: 0.5, basis: 'history' },
  });
}

function ctx(graph: WorldGraph, agentId: string) {
  return buildPredicateContext(graph, agentId);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('alone / outnumbered predicates', () => {
  it('case 1 — agent alone at a location', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A');

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(0);
    expect(c.alone).toBe(true);
    expect(c.outnumbered).toBe(false);
  });

  it('case 2 — agent with 2 same-faction co-located actors, no opposing faction', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A', 'fac-red');
    addActor(g, 'agent-2', 'loc-A', 'fac-red');
    addActor(g, 'agent-3', 'loc-A', 'fac-red');

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(2);
    expect(c.enemyCount).toBe(0);
    expect(c.alone).toBe(false);
    expect(c.outnumbered).toBe(false);
  });

  it('case 3 — 1 ally + 3 enemies via hostile faction relation → outnumbered', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addFaction(g, 'fac-blue');
    addFaction(g, 'fac-red');
    // Self + one ally in fac-blue; 3 enemies in fac-red
    addActor(g, 'agent-1', 'loc-A', 'fac-blue');
    addActor(g, 'ally-1', 'loc-A', 'fac-blue');
    addActor(g, 'enemy-1', 'loc-A', 'fac-red');
    addActor(g, 'enemy-2', 'loc-A', 'fac-red');
    addActor(g, 'enemy-3', 'loc-A', 'fac-red');
    // Hostile faction-to-faction edge
    relateTo(g, 'fac-blue', 'fac-red', -0.6);

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(1);
    expect(c.enemyCount).toBe(3);
    expect(c.alone).toBe(false);
    expect(c.outnumbered).toBe(true); // 3 > 1 + 1
  });

  it('case 4 — parity scene (2 allies vs 2 enemies) → not outnumbered', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addFaction(g, 'fac-blue');
    addFaction(g, 'fac-red');
    addActor(g, 'agent-1', 'loc-A', 'fac-blue');
    addActor(g, 'ally-1', 'loc-A', 'fac-blue');
    addActor(g, 'ally-2', 'loc-A', 'fac-blue');
    addActor(g, 'enemy-1', 'loc-A', 'fac-red');
    addActor(g, 'enemy-2', 'loc-A', 'fac-red');
    relateTo(g, 'fac-blue', 'fac-red', -0.6);

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(2);
    expect(c.enemyCount).toBe(2);
    expect(c.alone).toBe(false);
    expect(c.outnumbered).toBe(false); // 2 > 2 + 1 is false
  });

  it('case 5 — neutral-only co-location (factionless strangers) → counts zero, alone=true', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A');
    addActor(g, 'stranger-1', 'loc-A');
    addActor(g, 'stranger-2', 'loc-A');
    // No faction, no relates_to → all neutral; alone uses ally/enemy counts only

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(0);
    expect(c.alone).toBe(true); // neutrals don't count as allies or enemies
    expect(c.outnumbered).toBe(false);
  });

  it('case 6 — sublocation isolation (agent at subloc, other at parent) → alone=true', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-parent');
    // Sublocation node
    g.addNode({ id: 'subloc-A', type: 'location', name: 'subloc-A', properties: { locationType: 'sublocation', parentLocationId: 'loc-parent' } });

    // Self at sublocation, other at parent
    addActor(g, 'agent-1', 'subloc-A', 'fac-blue');
    addActor(g, 'agent-2', 'loc-parent', 'fac-blue');

    const c = ctx(g, 'agent-1');
    expect(c.alone).toBe(true); // different located_at nodes
  });

  it('case 7 — self-exclusion (own edge not counted)', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A');

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(0);
    expect(c.alone).toBe(true);
  });

  it('case 8 — direct edge overrides faction (same faction, hostile direct sentiment)', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A', 'fac-blue');
    addActor(g, 'agent-2', 'loc-A', 'fac-blue');
    // Direct hostile edge between them overrides shared faction
    relateTo(g, 'agent-1', 'agent-2', -0.9);

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(1);
  });

  it('case 9 — bidirectional sentiment (hostile only on incoming edge) → enemy', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A');
    addActor(g, 'agent-2', 'loc-A');
    // Only incoming edge (agent-2 → agent-1) with hostile sentiment
    relateTo(g, 'agent-2', 'agent-1', -0.8);

    const c = ctx(g, 'agent-1');
    expect(c.enemyCount).toBe(1);
  });

  it('case 10 — fail-soft: relates_to edge with no sentiment property → classifies as neutral', () => {
    const g = new WorldGraph();
    addLocation(g, 'loc-A');
    addActor(g, 'agent-1', 'loc-A');
    addActor(g, 'agent-2', 'loc-A');
    // Edge has no sentiment property (malformed data) → should not throw, treat as neutral
    g.addEdge({ id: 'rel-no-sentiment', source: 'agent-1', target: 'agent-2', type: 'relates_to', properties: {} });

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(0);
    // with neutral classification: allyCount=0, enemyCount=0, alone depends on whether others present
    // alone = 0===0 && 0===0 = true (neutrals don't affect counts)
    expect(c.alone).toBe(true);
  });

  it('case 11 — fail-soft: agent has no located_at edge → alone=true, no throw', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'agent-1', type: 'actor', name: 'agent-1', properties: { actorType: 'individual' } });

    const c = ctx(g, 'agent-1');
    expect(c.allyCount).toBe(0);
    expect(c.enemyCount).toBe(0);
    expect(c.alone).toBe(true);
    expect(c.outnumbered).toBe(false);
  });

  it('integration — effect with when:outnumbered fires only when outnumbered', () => {
    // Alone scene → effect should NOT fire
    const aloneGraph = new WorldGraph();
    addLocation(aloneGraph, 'loc-A');
    addActor(aloneGraph, 'agent-1', 'loc-A');
    const aloneCtx = ctx(aloneGraph, 'agent-1');
    expect(evaluatePredicate('outnumbered', aloneCtx)).toBe(false);

    // Outnumbered scene (1 vs 3) → effect SHOULD fire
    const outnumberedGraph = new WorldGraph();
    addLocation(outnumberedGraph, 'loc-B');
    addFaction(outnumberedGraph, 'fac-A');
    addFaction(outnumberedGraph, 'fac-B');
    addActor(outnumberedGraph, 'agent-1', 'loc-B', 'fac-A');
    addActor(outnumberedGraph, 'e1', 'loc-B', 'fac-B');
    addActor(outnumberedGraph, 'e2', 'loc-B', 'fac-B');
    addActor(outnumberedGraph, 'e3', 'loc-B', 'fac-B');
    relateTo(outnumberedGraph, 'fac-A', 'fac-B', -0.7);
    const outnumberedCtx = ctx(outnumberedGraph, 'agent-1');
    expect(evaluatePredicate('outnumbered', outnumberedCtx)).toBe(true);
  });
});
