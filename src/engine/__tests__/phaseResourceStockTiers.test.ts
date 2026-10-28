/**
 * Integration tests for phaseResourceStockTiers (THR-615).
 *
 * Builds a minimal graph and asserts the phase (a) stores tiers + balance on the
 * location and (b) pulls a livelihood thread tug when a bonded mortal's home
 * falls into famine or glut.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseResourceStockTiers } from '../phases/resourceStockTiers';
import type { GameState } from '../../types/gameState';
import type { ResourceInstance } from '../../types/resource';

function res(quantity: number): ResourceInstance {
  return { quantity, renewable: true, renewalRate: 0.5 };
}

/** Build a minimal state: ascendant + one settlement with a bonded resident. */
function buildState(grainQuantity: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: 'loc1',
    type: 'location',
    name: 'Harrowmoor',
    properties: {
      terrain: 'farmland',
      prosperity: 90, // dense demand → thin grain reads scarce
      hexCol: 3,
      hexRow: 4,
      resources: { grain: res(grainQuantity) },
    },
  });
  graph.addNode({ id: 'mortal', type: 'actor', name: 'Bram', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'loc_e', type: 'located_at', source: 'mortal', target: 'loc1', properties: {} });
  graph.addEdge({
    id: 'thread_e',
    type: 'thread',
    source: 'asc',
    target: 'mortal',
    properties: { courtPosition: 'retinue' },
  });

  return {
    graph,
    tick: 5,
    seed: 42,
    ascendantId: 'asc',
    tickEvents: [],
    chronicleEntries: [],
    activeThreadTugs: [],
  } as unknown as GameState;
}

describe('phaseResourceStockTiers', () => {
  it('stores a stock tier and resource balance on the location', () => {
    const state = buildState(10);
    phaseResourceStockTiers(state, {});
    const props = state.graph.getNode('loc1')!.properties as Record<string, unknown>;
    const resources = props.resources as Record<string, ResourceInstance>;
    expect(resources.grain.stockTier).toBe('scarce');
    expect(typeof props.resourceBalance).toBe('number');
    expect(props.resourceBalance as number).toBeLessThan(0);
  });

  it('pulls a famine livelihood tug for a bonded mortal whose home is scarce', () => {
    const state = buildState(10);
    const delta = phaseResourceStockTiers(state, {});
    const tugs = delta.activeThreadTugs ?? [];
    expect(tugs.length).toBe(1);
    const tug = tugs[0];
    expect(tug.agentId).toBe('mortal');
    expect(tug.reachPrimary).toBe('gold');
    expect(tug.threatLevel).toBe('hard'); // famine
    expect(tug.encounterId.startsWith('livelihood_')).toBe(true);
    expect(tug.attended).toBe(false);
  });

  it('pulls a glut tug (moderate threat) when a staple is in surplus', () => {
    const state = buildState(95); // abundant grain in a dense city → still surplus
    // Lower demand so 95 reads as surplus: sparse hamlet.
    (state.graph.getNode('loc1')!.properties as Record<string, unknown>).prosperity = 0;
    const delta = phaseResourceStockTiers(state, {});
    const tugs = delta.activeThreadTugs ?? [];
    expect(tugs.length).toBe(1);
    expect(tugs[0].threatLevel).toBe('moderate'); // glut
  });

  it('does not re-pull a tug that is already active (dedup)', () => {
    const state = buildState(10);
    const first = phaseResourceStockTiers(state, {});
    // Feed the emitted tug back into state, advance a tick, run again.
    state.activeThreadTugs = first.activeThreadTugs ?? [];
    (state as { tick: number }).tick = 6;
    const second = phaseResourceStockTiers(state, {});
    // No *new* tugs beyond the one still active.
    const secondTugs = second.activeThreadTugs ?? [];
    const newOnes = secondTugs.filter(t => t.createdTick === 6);
    expect(newOnes.length).toBe(0);
  });

  it('THR-2062: a lasting famine pulls once, not again after its tug lapses', () => {
    const state = buildState(10);
    const first = phaseResourceStockTiers(state, {});
    expect(first.activeThreadTugs?.[0].kind).toBe('livelihood');
    expect(first.activeThreadTugs?.[0].livelihoodResourceId).toBe('grain');
    expect(first.activeThreadTugs?.[0].livelihoodTier).toBe('scarce');
    // The tug lapses (THREAD_TUG_LINGER), the famine goes on.
    state.activeThreadTugs = [];
    (state as { tick: number }).tick = 20;
    const second = phaseResourceStockTiers(state, {});
    expect(second.activeThreadTugs ?? []).toHaveLength(0);
  });

  it('THR-2062: pulls again after the good returns to adequate and falls once more', () => {
    const state = buildState(10);
    phaseResourceStockTiers(state, {});
    const resources = (state.graph.getNode('loc1')!.properties as Record<string, unknown>).resources as Record<string, ResourceInstance>;
    expect(resources.grain.livelihoodPulledTier).toBe('scarce');

    // Recover: enough grain for the town reads adequate and clears the marker.
    state.activeThreadTugs = [];
    let q = 10;
    for (; q <= 100 && resources.grain.stockTier !== 'adequate'; q += 5) {
      resources.grain.quantity = q;
      phaseResourceStockTiers(state, {});
    }
    expect(resources.grain.stockTier).toBe('adequate');
    expect(resources.grain.livelihoodPulledTier).toBeUndefined();

    // Fall again.
    resources.grain.quantity = 10;
    (state as { tick: number }).tick = 40;
    const again = phaseResourceStockTiers(state, {});
    expect((again.activeThreadTugs ?? []).filter(t => t.createdTick === 40)).toHaveLength(1);
  });

  it('THR-2062: a famine that began before anyone was bonded still reaches the first bonded mortal', () => {
    const state = buildState(10);
    state.graph.removeEdge('thread_e');
    expect(phaseResourceStockTiers(state, {}).activeThreadTugs ?? []).toHaveLength(0);
    const resources = (state.graph.getNode('loc1')!.properties as Record<string, unknown>).resources as Record<string, ResourceInstance>;
    expect(resources.grain.livelihoodPulledTier).toBeUndefined();

    state.graph.addEdge({ id: 'thread_e', type: 'thread', source: 'asc', target: 'mortal', properties: { courtPosition: 'retinue' } });
    (state as { tick: number }).tick = 6;
    const later = phaseResourceStockTiers(state, {});
    expect((later.activeThreadTugs ?? []).filter(t => t.agentId === 'mortal')).toHaveLength(1);
  });

  it('THR-2062: a glut that follows a famine while its tug still lingers is told once the tug lapses', () => {
    const state = buildState(10);
    const first = phaseResourceStockTiers(state, {});
    state.activeThreadTugs = first.activeThreadTugs ?? []; // famine tug, live until tick 8
    const loc = state.graph.getNode('loc1')!.properties as Record<string, unknown>;
    const resources = loc.resources as Record<string, ResourceInstance>;
    loc.prosperity = 0;
    resources.grain.quantity = 95; // straight to surplus
    (state as { tick: number }).tick = 6;
    const during = phaseResourceStockTiers(state, {});
    expect(resources.grain.stockTier).toBe('surplus');
    expect((during.activeThreadTugs ?? []).filter(t => t.createdTick === 6)).toHaveLength(0);
    expect(resources.grain.livelihoodPulledTier).toBe('scarce');

    state.activeThreadTugs = []; // the famine tug lapsed
    (state as { tick: number }).tick = 9;
    const after = phaseResourceStockTiers(state, {});
    const glut = (after.activeThreadTugs ?? []).filter(t => t.createdTick === 9);
    expect(glut).toHaveLength(1);
    expect(glut[0].livelihoodTier).toBe('surplus');
  });
});
