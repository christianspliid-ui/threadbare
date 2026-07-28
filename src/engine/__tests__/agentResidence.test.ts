/**
 * THR-822 — agent residence: origin, arrival, dwell.
 *
 * Two things are worth pinning here, and they are not the same thing:
 *
 *  1. The observer records what actually happened (moved / stayed / first seen), and
 *     records *nothing* when it cannot tell — an unplaced agent must not acquire an
 *     arrival tick, because a false arrival reads as settledness.
 *  2. The window rule. `dwellTicks` measured against a window start is the entire
 *     safety argument for using these conditions as abandonment triggers, so it is
 *     tested directly rather than only through the ambition path.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  observeResidence,
  readResidence,
  dwellTicks,
  isAwayFromOrigin,
  currentPositionId,
  ORIGIN_LOCATION_PROP,
  RESIDENCE_ARRIVED_PROP,
  RESIDENCE_POSITION_PROP,
  SETTLED_DWELL_TICKS,
  EXILE_ACCEPTED_DWELL_TICKS,
} from '../agentResidence';

/** A graph with one actor and two locations; the actor starts nowhere. */
function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'a1', type: 'actor', name: 'Wanderer', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'home', type: 'location', name: 'Home', properties: {} });
  graph.addNode({ id: 'far', type: 'location', name: 'Far', properties: {} });
  return graph;
}

function place(graph: WorldGraph, agentId: string, locationId: string): void {
  for (const edge of graph.getOutgoingEdges(agentId, 'located_at')) graph.removeEdge(edge.id);
  graph.addEdge({
    id: `${agentId}_located_at_${locationId}`,
    source: agentId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

describe('observeResidence', () => {
  it('records origin and arrival on the first sighting', () => {
    const graph = makeGraph();
    place(graph, 'a1', 'home');

    expect(observeResidence(graph, 'a1', 10)).toBe('first-sighting');

    expect(readResidence(graph, 'a1')).toEqual({
      originLocationId: 'home',
      positionId: 'home',
      arrivedTick: 10,
    });
  });

  it('is idempotent while the agent stays put — arrival does not creep forward', () => {
    const graph = makeGraph();
    place(graph, 'a1', 'home');
    observeResidence(graph, 'a1', 10);

    expect(observeResidence(graph, 'a1', 25)).toBe('unchanged');
    expect(observeResidence(graph, 'a1', 40)).toBe('unchanged');

    // The whole primitive is worthless if a re-observation restamps arrival: dwell
    // would be pinned at zero forever and no settledness gate could ever pass.
    expect(readResidence(graph, 'a1').arrivedTick).toBe(10);
  });

  it('restamps arrival on a move but never rewrites origin', () => {
    const graph = makeGraph();
    place(graph, 'a1', 'home');
    observeResidence(graph, 'a1', 10);

    place(graph, 'a1', 'far');
    expect(observeResidence(graph, 'a1', 30)).toBe('moved');

    expect(readResidence(graph, 'a1')).toEqual({
      originLocationId: 'home',
      positionId: 'far',
      arrivedTick: 30,
    });

    // And returning home is a move like any other — origin is where you started, not
    // wherever you currently are.
    place(graph, 'a1', 'home');
    expect(observeResidence(graph, 'a1', 55)).toBe('moved');
    expect(readResidence(graph, 'a1')).toEqual({
      originLocationId: 'home',
      positionId: 'home',
      arrivedTick: 55,
    });
  });

  it('records nothing for an agent with no located_at edge', () => {
    const graph = makeGraph();

    expect(observeResidence(graph, 'a1', 10)).toBe('no-position');

    const node = graph.getNode('a1')!;
    expect(node.properties[ORIGIN_LOCATION_PROP]).toBeUndefined();
    expect(node.properties[RESIDENCE_POSITION_PROP]).toBeUndefined();
    expect(node.properties[RESIDENCE_ARRIVED_PROP]).toBeUndefined();
    expect(readResidence(graph, 'a1')).toEqual({
      originLocationId: undefined,
      positionId: undefined,
      arrivedTick: undefined,
    });
  });

  it('fails soft on a missing agent node rather than throwing', () => {
    const graph = makeGraph();
    expect(observeResidence(graph, 'ghost', 10)).toBe('no-position');
    expect(readResidence(graph, 'ghost')).toEqual({});
  });

  it('leaves unrelated actor properties intact', () => {
    const graph = makeGraph();
    place(graph, 'a1', 'home');
    observeResidence(graph, 'a1', 10);

    // `updateNode` merges rather than replaces, but this is the property bag every
    // other system reads — a regression here is silent and wide.
    expect(graph.getNode('a1')!.properties.actorType).toBe('individual');
    expect(graph.getNode('a1')!.name).toBe('Wanderer');
  });

  it('tracks the sublocation tier, not just locations', () => {
    // Position is whatever the single `located_at` edge points at — the three-tier
    // model means that can be a hex, a location or a sublocation, and a move between
    // sublocations of one location is still a move.
    const graph = makeGraph();
    // Sublocations are `location` nodes carrying `parentLocationId` — there is no
    // separate NodeType for them (`src/types/graph.ts`).
    graph.addNode({ id: 'sub', type: 'location', name: 'Cellar', properties: { parentLocationId: 'home' } });
    place(graph, 'a1', 'home');
    observeResidence(graph, 'a1', 5);

    place(graph, 'a1', 'sub');
    expect(observeResidence(graph, 'a1', 20)).toBe('moved');
    expect(currentPositionId(graph, 'a1')).toBe('sub');
    expect(readResidence(graph, 'a1').arrivedTick).toBe(20);
  });
});

describe('dwellTicks — the window rule', () => {
  const settled = { originLocationId: 'home', positionId: 'far', arrivedTick: 100 };

  it('counts from arrival when no window is given', () => {
    expect(dwellTicks(settled, 160)).toBe(60);
  });

  it('counts from the window start when the agent arrived before it', () => {
    // THE load-bearing case. The agent has been stationary since tick 100; an ambition
    // assigned at tick 150 must see 10 ticks of dwell at tick 160, not 60 — otherwise
    // it abandons the moment it is taken up.
    expect(dwellTicks(settled, 160, 150)).toBe(10);
  });

  it('counts from arrival when the agent arrived after the window opened', () => {
    // Window opened at 50, arrival at 100 — the later of the two wins, so this is 60,
    // not 110. The window only ever *shortens* measured dwell; it never lengthens it.
    expect(dwellTicks(settled, 160, 50)).toBe(60);
  });

  it('is zero at the window start, so a trigger cannot fire on its first tick', () => {
    expect(dwellTicks(settled, 150, 150)).toBe(0);
  });

  it('never goes negative', () => {
    expect(dwellTicks(settled, 90)).toBe(0);
  });

  it('is undefined — not zero — when arrival was never observed', () => {
    // Distinguishable from a measured zero on purpose: callers must be able to tell
    // "has not settled" from "we have not looked".
    expect(dwellTicks({ originLocationId: 'home', positionId: 'home' }, 200)).toBeUndefined();
  });
});

describe('isAwayFromOrigin', () => {
  it('is true only when both endpoints are known and differ', () => {
    expect(isAwayFromOrigin({ originLocationId: 'home', positionId: 'far' })).toBe(true);
    expect(isAwayFromOrigin({ originLocationId: 'home', positionId: 'home' })).toBe(false);
  });

  it('is false when either endpoint is unknown', () => {
    expect(isAwayFromOrigin({ positionId: 'far' })).toBe(false);
    expect(isAwayFromOrigin({ originLocationId: 'home' })).toBe(false);
    expect(isAwayFromOrigin({})).toBe(false);
  });
});

describe('dwell thresholds', () => {
  it('sit above the 15-tick observation interval so quantization cannot dominate', () => {
    // Residence is observed from `phaseAmbitionProgress` (MILESTONE_CHECK_INTERVAL=15),
    // so arrival ticks are quantized to that. A threshold near it would be mostly noise.
    expect(SETTLED_DWELL_TICKS).toBeGreaterThan(15 * 2);
    expect(EXILE_ACCEPTED_DWELL_TICKS).toBeGreaterThan(15 * 2);
    // Giving up a homeland is slower than giving up a road — pin the ordering, since
    // it is the only thing distinguishing the two authored beats.
    expect(EXILE_ACCEPTED_DWELL_TICKS).toBeGreaterThan(SETTLED_DWELL_TICKS);
  });
});
