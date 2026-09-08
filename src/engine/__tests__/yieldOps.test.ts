/**
 * THR-1439 — yield: the active harvest of a held Location, and a lane's volume.
 *
 * What is worth pinning here is not that the two ops run. It is that they **cost**:
 * the harvest moves prosperity and standing on *every* band, and the lump only on the
 * good ones. A semantic that paid on every band would pass a test that only ever ran
 * a success, so the failure arm is asserted directly — prosperity and standing moved,
 * wealth did not.
 *
 * The cooldown gets both arms for the same reason: a guard nobody has watched refuse
 * is not a guard. And `yieldLumpFor` is exercised across the *measured* prosperity
 * bands rather than the type's range, so the Place multiplier is falsified against a
 * town that has productive Places and one that does not.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { drawYield, raiseRouteVolume, yieldLumpFor, productivePlaceCount, yieldBandScale, LAST_YIELD_DRAW_PROPERTY } from '../yieldOps';
import { readWealth } from '../wealth';
import { getUndertakingObjectType, eligibilityRefusal } from '../../data/undertaking-objects';
import { TRADE_ROUTE_MAX_VOLUME } from '../tradeRoute';
import {
  YIELD_DRAW_PROSPERITY_COST,
  YIELD_DRAW_COOLDOWN_TICKS,
  YIELD_DRAW_MAX_PLACES,
  ROUTE_RAISE_VOLUME_DELTA,
  ROUTE_IDENTITY_SUBTYPE,
} from '../../data/strategic-action-constants';

// ─── Fixtures ───────────────────────────────────────────────────────

/**
 * A town a mortal controls, at a stated prosperity, with `places` commerce Places
 * inside it. The Places are written in the canonical shape — `type: 'location'` with
 * `parentLocationId` (THR-1183) — because a fixture that invented the drifted shape
 * would verify a reader nobody has.
 */
function heldTown(prosperity: number, places = 0): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'holder', type: 'actor', name: 'Vessa', properties: { actorType: 'individual', wealth: 20 } });
  graph.addNode({
    id: 'town', type: 'location', name: 'Greycity',
    properties: { hexCol: 1, hexRow: 1, locationSubtype: 'town', prosperity },
  });
  graph.addEdge({ id: 'ctl', source: 'holder', target: 'town', type: 'controls', properties: { since: 0 } });
  for (let i = 0; i < places; i += 1) {
    graph.addNode({
      id: `place-${i}`, type: 'location', name: `Warehouse ${i}`,
      properties: { parentLocationId: 'town', sublocationTypeId: 'warehouse', hexCol: 1, hexRow: 1 },
    });
  }
  return graph;
}

/** A lane with an identity node pointing at the `trades_with` edge that carries volume. */
function laneWorld(volume: number): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [['a', 'Greycity'], ['b', 'Thornmarch']] as const) {
    graph.addNode({ id, type: 'location', name, properties: { hexCol: id === 'a' ? 1 : 4, hexRow: 1, locationSubtype: 'town' } });
  }
  graph.addEdge({
    id: 'tw', source: 'a', target: 'b', type: 'trades_with',
    properties: { volume, lastTraded: 0, taxRate: 0.1 },
  });
  graph.addNode({
    id: 'route', type: 'location', name: 'Greycity–Thornmarch Road',
    properties: {
      hexCol: 1, hexRow: 1, locationSubtype: ROUTE_IDENTITY_SUBTYPE,
      routeSourceId: 'a', routeTargetId: 'b', routeEdgeId: 'tw',
    },
  });
  return graph;
}

const node = (id: string) => ({ kind: 'node' as const, nodeId: id });

// ─── The harvest ────────────────────────────────────────────────────

describe('drawYield — the active harvest', () => {
  it('pays a lump through the wealth funnel and stamps the cause the sheet reads', () => {
    const graph = heldTown(70);
    const before = readWealth(graph.getNode('holder')!.properties);

    const r = drawYield(graph, 'holder', 'town', 24, 'proj', 'success');

    expect(r.success).toBe(true);
    const holder = graph.getNode('holder')!;
    expect(readWealth(holder.properties)).toBeGreaterThan(before);
    // The cause vocabulary is the contract with the Means tooltip, not an accident.
    expect(holder.properties.lastWealthReason).toBe('draw_yield');
  });

  it('costs the town prosperity and stamps the cooldown clock', () => {
    const graph = heldTown(70);
    drawYield(graph, 'holder', 'town', 24, 'proj', 'success');

    const town = graph.getNode('town')!;
    expect(town.properties.prosperity).toBe(70 - YIELD_DRAW_PROSPERITY_COST);
    expect(town.properties[LAST_YIELD_DRAW_PROPERTY]).toBe(24);
  });

  it('costs the holder standing with the town', () => {
    const graph = heldTown(70);
    drawYield(graph, 'holder', 'town', 24, 'proj', 'success');

    const standing = graph.getOutgoingEdges('holder', 'reputation_with').find(e => e.target === 'town');
    expect(standing).toBeDefined();
    // Below the neutral default: the town thinks less of them for it.
    expect(standing!.properties.score as number).toBeLessThan(0.5);
  });

  it('pays the costs and NOTHING else on a failed band — the arm that makes it a risk', () => {
    const graph = heldTown(70);
    const before = readWealth(graph.getNode('holder')!.properties);

    const r = drawYield(graph, 'holder', 'town', 24, 'proj', 'failure');

    expect(r.success).toBe(true);
    // No wealth moved…
    expect(readWealth(graph.getNode('holder')!.properties)).toBe(before);
    // …but the town paid and so did the holder's name there.
    expect(graph.getNode('town')!.properties.prosperity).toBe(70 - YIELD_DRAW_PROSPERITY_COST);
    const standing = graph.getOutgoingEdges('holder', 'reputation_with').find(e => e.target === 'town');
    expect((standing!.properties.score as number)).toBeLessThan(0.5);
  });

  it('treats an absent band as the failure arm rather than a silent full harvest', () => {
    const graph = heldTown(70);
    const before = readWealth(graph.getNode('holder')!.properties);
    drawYield(graph, 'holder', 'town', 24, 'proj', undefined);
    expect(readWealth(graph.getNode('holder')!.properties)).toBe(before);
  });

  it('scales the lump by band, in order', () => {
    const lump = (band: string) => yieldLumpFor(heldTown(70), 'town', band);
    expect(lump('critical_success')).toBeGreaterThan(lump('success'));
    expect(lump('success')).toBeGreaterThan(lump('success_at_cost'));
    expect(lump('success_at_cost')).toBeGreaterThan(0);
    expect(lump('failure')).toBe(0);
    expect(yieldBandScale('critical_failure')).toBe(0);
  });

  it('multiplies on productive Places and caps how many count', () => {
    const bare = yieldLumpFor(heldTown(70, 0), 'town', 'success');
    const two = yieldLumpFor(heldTown(70, 2), 'town', 'success');
    expect(two).toBeGreaterThan(bare);

    // The cap is real, not decorative: past it, more Places add nothing.
    expect(productivePlaceCount(heldTown(70, YIELD_DRAW_MAX_PLACES + 3), 'town')).toBe(YIELD_DRAW_MAX_PLACES);
    expect(yieldLumpFor(heldTown(70, YIELD_DRAW_MAX_PLACES + 3), 'town', 'success'))
      .toBe(yieldLumpFor(heldTown(70, YIELD_DRAW_MAX_PLACES), 'town', 'success'));
  });

  it('counts only the productive Place classes — a barracks is not a market', () => {
    const graph = heldTown(70);
    graph.addNode({
      id: 'barracks', type: 'location', name: 'The Barracks',
      properties: { parentLocationId: 'town', sublocationTypeId: 'barracks', hexCol: 1, hexRow: 1 },
    });
    expect(productivePlaceCount(graph, 'town')).toBe(0);
  });

  it('floors prosperity at zero rather than going negative', () => {
    const graph = heldTown(2);
    drawYield(graph, 'holder', 'town', 24, 'proj', 'success');
    expect(graph.getNode('town')!.properties.prosperity).toBe(0);
  });

  it('fails soft on a town that is gone', () => {
    const graph = heldTown(70);
    expect(drawYield(graph, 'holder', 'nowhere', 24).success).toBe(false);
  });
});

describe('use × Location eligibility — the cooldown', () => {
  const type = getUndertakingObjectType('location')!;

  it('allows a town nobody has drawn', () => {
    expect(eligibilityRefusal(heldTown(70), type, 'use', 'holder', node('town'), 24)).toBeNull();
  });

  it('refuses a second draw inside the cooldown, and allows one after it', () => {
    const graph = heldTown(70);
    drawYield(graph, 'holder', 'town', 24, 'proj', 'success');

    expect(eligibilityRefusal(graph, type, 'use', 'holder', node('town'), 24 + YIELD_DRAW_COOLDOWN_TICKS - 1))
      .toBe('drawn_recently');
    expect(eligibilityRefusal(graph, type, 'use', 'holder', node('town'), 24 + YIELD_DRAW_COOLDOWN_TICKS))
      .toBeNull();
  });
});

// ─── The lane ───────────────────────────────────────────────────────

describe('raiseRouteVolume — a merchant\'s expansion work', () => {
  it('writes volume onto the lane and restarts the decay clock', () => {
    const graph = laneWorld(3);
    const r = raiseRouteVolume(graph, 'route', 40, 'success');

    expect(r.success).toBe(true);
    const edge = graph.getEdge('tw')!;
    expect(edge.properties.volume).toBe(3 + ROUTE_RAISE_VOLUME_DELTA);
    expect(edge.properties.lastTraded).toBe(40);
  });

  it('caps at the maximum rather than overshooting it', () => {
    const graph = laneWorld(TRADE_ROUTE_MAX_VOLUME - 1);
    raiseRouteVolume(graph, 'route', 40, 'critical_success');
    expect(graph.getEdge('tw')!.properties.volume).toBe(TRADE_ROUTE_MAX_VOLUME);
  });

  it('adds nothing on a failed band', () => {
    const graph = laneWorld(3);
    raiseRouteVolume(graph, 'route', 40, 'failure');
    expect(graph.getEdge('tw')!.properties.volume).toBe(3);
  });

  it('fails soft when the lane has decayed away under it', () => {
    const graph = laneWorld(3);
    graph.removeEdge('tw');
    const r = raiseRouteVolume(graph, 'route', 40, 'success');
    expect(r.success).toBe(false);
    expect(r.error).toBe('route_gone');
  });
});

describe('raise × Route eligibility — the volume cap', () => {
  const type = getUndertakingObjectType('route')!;

  it('allows a lane with room and refuses one already full', () => {
    expect(eligibilityRefusal(laneWorld(3), type, 'change:raise', 'anyone', node('route'), 40)).toBeNull();
    expect(eligibilityRefusal(laneWorld(TRADE_ROUTE_MAX_VOLUME), type, 'change:raise', 'anyone', node('route'), 40))
      .toBe('at_max_volume');
  });
});
