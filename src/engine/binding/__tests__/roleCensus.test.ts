/**
 * Role census — THR-1296 slice 2.
 *
 * The census is what makes scarcity affordable, so the tests that matter are the ones
 * that would catch it silently measuring *nothing*: an empty census is
 * indistinguishable from a world where every role is precious, and that failure mode
 * arrives as mysterious over-minting rather than as an error.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GraphNode } from '../../../types/graph';
import { buildRoleCensus, roleCount, scarcity01 } from '../roleCensus';
import { BINDER_ROLE_COMMODITY_THRESHOLD } from '../../../data/binder-constants';

function actor(id: string, props: Record<string, unknown> = {}): GraphNode {
  return { id, type: 'actor', name: id, properties: { actorType: 'individual', ...props } };
}

describe('buildRoleCensus', () => {
  it('indexes live individuals by npcRole — and finds a non-zero population', () => {
    const graph = new WorldGraph();
    graph.addNode(actor('a1', { npcRole: 'innkeeper' }));
    graph.addNode(actor('a2', { npcRole: 'innkeeper' }));
    graph.addNode(actor('a3', { npcRole: 'archmage' }));

    const census = buildRoleCensus(graph);

    // Guard against the vacuous pass: a census that found nobody would satisfy any
    // "does not contain X" assertion, so pin the counts that must be positive.
    expect(roleCount(census, 'innkeeper')).toBe(2);
    expect(roleCount(census, 'archmage')).toBe(1);
    expect(roleCount(census, 'nobody')).toBe(0);
  });

  it('excludes the dead in both shapes — a corpse must not read as supply', () => {
    const graph = new WorldGraph();
    graph.addNode(actor('live', { npcRole: 'archmage' }));
    graph.addNode(actor('echo', { npcRole: 'archmage', deceased: true }));
    graph.addNode(actor('slain', { npcRole: 'archmage', status: 'dead' }));

    // Scarcity steering reuse toward a dead archmage is the exact "dead records poison
    // scorers" failure the ledger's terminal-broken status also guards against.
    expect(roleCount(buildRoleCensus(graph), 'archmage')).toBe(1);
  });

  it('counts only individuals — factions and cultures are actors but not people', () => {
    const graph = new WorldGraph();
    graph.addNode(actor('person', { npcRole: 'herald' }));
    graph.addNode({
      id: 'guild', type: 'actor', name: 'Heralds Guild',
      properties: { actorType: 'faction', npcRole: 'herald' },
    });

    expect(roleCount(buildRoleCensus(graph), 'herald')).toBe(1);
  });

  it('omits roleless actors rather than bucketing them under undefined', () => {
    const graph = new WorldGraph();
    graph.addNode(actor('nameless'));
    const census = buildRoleCensus(graph);
    expect(census.size).toBe(0);
  });
});

describe('scarcity01', () => {
  it('reads 1 for an absent role and 0 at commodity saturation', () => {
    const graph = new WorldGraph();
    for (let i = 0; i < BINDER_ROLE_COMMODITY_THRESHOLD; i++) {
      graph.addNode(actor(`sailor-${i}`, { npcRole: 'sailor' }));
    }
    const census = buildRoleCensus(graph);

    expect(scarcity01(census, 'archmage')).toBe(1);
    expect(scarcity01(census, 'sailor')).toBe(0);
  });

  it('falls to neutral 0.5 with no census, never to a confident 0 or 1', () => {
    // A missing cache must not masquerade as a measurement in either direction:
    // reading 1 stalls minting everywhere, reading 0 floods it.
    expect(scarcity01(null, 'anything')).toBe(0.5);
  });

  it('decreases monotonically as a role fills up', () => {
    const graph = new WorldGraph();
    const seen: number[] = [];
    for (let i = 0; i < BINDER_ROLE_COMMODITY_THRESHOLD; i++) {
      graph.addNode(actor(`clerk-${i}`, { npcRole: 'clerk' }));
      seen.push(scarcity01(buildRoleCensus(graph), 'clerk'));
    }
    // Sweep the measured range rather than probing one point.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]).toBeLessThan(seen[i - 1]);
    }
    expect(seen[0]).toBeGreaterThan(seen[seen.length - 1]);
  });
});
