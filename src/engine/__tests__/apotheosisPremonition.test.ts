/**
 * THR-2227 (plan THR-2204 slice 2) — the Apotheosis premonition fires exactly once
 * before every offer, on an earlier tick than the offer.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { seedApotheosisEncounters, ticksUntilApotheosisOffer } from '../aspects';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import { APOTHEOSIS_PREMONITION_LEAD_TICKS } from '../../data/nudge-constants';

const ASC = 'asc.player';
const MORTAL = 'actor.first';

function makeGraph(gender?: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: MORTAL,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual', ...(gender ? { gender } : {}) },
  });
  graph.addEdge({
    id: `thread_${ASC}_${MORTAL}`,
    source: ASC,
    target: MORTAL,
    type: 'thread',
    properties: { tier: 4, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
  });
  return graph;
}

function stateAt(graph: WorldGraph, tick: number): GameState {
  return { ascendantId: ASC, graph, tick, tickEvents: [], pendingEncounterSeeds: [], unifiedActions: [] } as unknown as GameState;
}

/** Run the seeding phase tick by tick with the tier-4 hold starting at tick 0. */
function run(graph: WorldGraph, ticks: number) {
  const edge = graph.getOutgoingEdges(ASC, 'thread')[0];
  const premonitions: number[] = [];
  const offers: number[] = [];
  const messages: string[] = [];
  for (let tick = 0; tick < ticks; tick++) {
    (edge.properties as { ticksAtCurrentTier: number }).ticksAtCurrentTier = tick;
    const patch = seedApotheosisEncounters(stateAt(graph, tick), tick);
    for (const e of patch.tickEvents ?? []) {
      premonitions.push(tick);
      messages.push(e.message);
    }
    if ((patch.pendingEncounterSeeds ?? []).length > 0) offers.push(tick);
  }
  return { premonitions, offers, messages };
}

describe('Apotheosis premonition (THR-2227)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); });

  it('fires once per offer, always on an earlier tick than the offer', () => {
    const { premonitions, offers } = run(makeGraph(), 400);
    expect(offers.length).toBeGreaterThanOrEqual(3); // first offer + re-offers after the cooldown
    let previousOffer = -1;
    for (const offer of offers) {
      const between = premonitions.filter((t) => t > previousOffer && t < offer);
      expect(between).toHaveLength(1);
      previousOffer = offer;
    }
    expect(premonitions.filter((t) => t > previousOffer).length).toBeLessThanOrEqual(1);
  });

  it('fires when the hold starts, so a god has the whole hold to save', () => {
    const { premonitions } = run(makeGraph(), 5);
    expect(premonitions[0]).toBe(0);
    expect(APOTHEOSIS_PREMONITION_LEAD_TICKS).toBeGreaterThanOrEqual(1);
  });

  it("names the mortal with the mortal's own pronouns", () => {
    const { messages } = run(makeGraph('male'), 2);
    expect(messages[0]).toBe('Kael Thornweaver is nearing a threshold. What you hold when he arrives there is what you can give.');
    const theirs = run(makeGraph(), 2).messages[0];
    expect(theirs).toContain('when they arrive there');
  });

  it('emits an apotheosis.premonition trace', () => {
    run(makeGraph(), 2);
    const traces = getTraces().filter((t) => t.category === 'apotheosis.premonition');
    expect(traces).toHaveLength(1);
  });

  it('ticksUntilApotheosisOffer is infinite below tier 4', () => {
    const graph = makeGraph();
    const edge = graph.getOutgoingEdges(ASC, 'thread')[0];
    (edge.properties as { tier: number }).tier = 3;
    expect(ticksUntilApotheosisOffer(edge, 10)).toBe(Number.POSITIVE_INFINITY);
  });
});
