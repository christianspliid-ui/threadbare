/**
 * The owed readers — THR-1428.
 *
 * Nine live cells wrote into systems nothing read. These tests assert the *products*
 * those writes now make, and each one is falsified at the layer that owns it:
 *
 * 1. **The band grades the product.** A survey on `success` yields a `narrowed` clue
 *    and no mark; the same survey on `critical_success` yields `located` and a mark.
 *    Both arms are asserted, because a test that only checked the strong arm would
 *    pass on a reader that ignored the band entirely.
 * 2. **`located` is the precision the delve layer requires.** The clue is asserted
 *    against `CluePrecision`'s own words, not against a number — the defect this
 *    ticket found was a numeric precision that no consumer could ever match.
 * 3. **A refusal is success with nothing new.** Re-surveying somewhere already known
 *    must not fail the work, and must not stack a second edge.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import { resolveUndertakingCompletion } from '../../engine/undertakingResolver';
import type { GameState } from '../../types/gameState';
import {
  OBSERVE_AREA_FAMILIARITY_CAP,
  RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE,
} from '../strategic-action-constants';

const ACTOR = 'actor_seeker';
const BYSTANDER = 'actor_bystander';
const RUIN = 'loc_ruin';
const TOWN = 'loc_town';
const AREA = 'region_vale';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, name: 'Old Maerin', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: BYSTANDER, name: 'Corran Ashe', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({
    id: RUIN, name: 'The Sunken Treasury', type: 'location',
    properties: { locationSubtype: 'ruins', hexCol: 3, hexRow: 4, prosperity: 0.05 },
  });
  graph.addNode({
    id: TOWN, name: 'Wickford', type: 'location',
    properties: { locationSubtype: 'town', hexCol: 3, hexRow: 4, prosperity: 0.6 },
  });
  graph.addNode({ id: AREA, name: 'The Long Vale', type: 'region', properties: {} });
  graph.addEdge({ id: 'e_area_ruin', source: AREA, target: RUIN, type: 'contains', properties: {} });
  graph.addEdge({ id: 'e_area_town', source: AREA, target: TOWN, type: 'contains', properties: {} });
  return graph;
}

/** The resolver's input, with only the fields these cells read. */
function observeOn(graph: WorldGraph, nodeId: string, objectTypeId: 'area' | 'location', outcome?: string) {
  return resolveUndertakingCompletion({
    state: { graph, tick: 40 } as unknown as GameState,
    graph,
    actorId: ACTOR,
    verb: 'observe',
    objectTypeId,
    handle: { kind: 'node', nodeId },
    tick: 40,
    outcome,
  });
}

function edgesOf(graph: WorldGraph, type: 'knows_of' | 'knows_clue_of' | 'knows_secret_of') {
  return graph.getOutgoingEdges(ACTOR, type);
}

describe('R1 — watching writes familiarity', () => {
  it('makes the observed Location familiar, and keeps the intelligence write', () => {
    const graph = world();
    const result = observeOn(graph, RUIN, 'location', 'success');

    expect(result.ops.some(o => o.success)).toBe(true);
    expect(edgesOf(graph, 'knows_of').map(e => e.target)).toEqual([RUIN]);
    // The pre-existing write is additive, not replaced.
    const intel = graph.getNode(ACTOR)!.properties.strategicIntelligence as Record<string, number>;
    expect(Object.keys(intel).some(k => k.endsWith(RUIN))).toBe(true);
  });

  it('grades the clue by the band — and only a critical success reaches `located`', () => {
    const onSuccess = world();
    observeOn(onSuccess, RUIN, 'location', 'success');
    expect(edgesOf(onSuccess, 'knows_clue_of')[0]?.properties.precision).toBe('narrowed');

    const onCritical = world();
    observeOn(onCritical, RUIN, 'location', 'critical_success');
    expect(edgesOf(onCritical, 'knows_clue_of')[0]?.properties.precision).toBe('located');
  });

  it('yields no clue at all on a band the table does not carry', () => {
    // The failure arm matters: a reader that clued on every band would make the
    // observe → clue → delve climb free, which is the thing the band order forbids.
    const graph = world();
    observeOn(graph, RUIN, 'location', 'failure');
    expect(edgesOf(graph, 'knows_clue_of')).toHaveLength(0);
  });

  it('clues only the surveyable classes — a town is not somewhere to delve', () => {
    const graph = world();
    observeOn(graph, TOWN, 'location', 'critical_success');
    expect(edgesOf(graph, 'knows_clue_of')).toHaveLength(0);
    // …but the town is still made familiar.
    expect(edgesOf(graph, 'knows_of').map(e => e.target)).toEqual([TOWN]);
  });

  it('mints a mark about somebody who was there, on a critical success only', () => {
    const weak = world();
    weak.addEdge({ id: 'e_at_weak', source: BYSTANDER, target: RUIN, type: 'located_at', properties: {} });
    observeOn(weak, RUIN, 'location', 'success');
    expect(edgesOf(weak, 'knows_secret_of')).toHaveLength(0);

    const strong = world();
    strong.addEdge({ id: 'e_at', source: BYSTANDER, target: RUIN, type: 'located_at', properties: {} });
    observeOn(strong, RUIN, 'location', 'critical_success');
    const mark = edgesOf(strong, 'knows_secret_of')[0];
    expect(mark?.target).toBe(BYSTANDER);
    expect(mark?.properties.revealed).toBe(false);
  });

  it('mints no mark when nobody was there', () => {
    const graph = world();
    observeOn(graph, RUIN, 'location', 'critical_success');
    expect(edgesOf(graph, 'knows_secret_of')).toHaveLength(0);
  });

  it('takes the plain-success row when the lifecycle carried no band', () => {
    const graph = world();
    const result = observeOn(graph, RUIN, 'location', undefined);
    expect(result.ops.some(o => o.success)).toBe(true);
    expect(edgesOf(graph, 'knows_of')).toHaveLength(1);
    // No band → no clue, no mark, no chart. Never a second resolution to invent one.
    expect(edgesOf(graph, 'knows_clue_of')).toHaveLength(0);
    expect(edgesOf(graph, 'knows_secret_of')).toHaveLength(0);
  });

  it('re-surveying somewhere already known succeeds with nothing new', () => {
    const graph = world();
    observeOn(graph, RUIN, 'location', 'success');
    const second = observeOn(graph, RUIN, 'location', 'success');

    expect(second.ops.some(o => o.success)).toBe(true);
    expect(edgesOf(graph, 'knows_of')).toHaveLength(1);
  });

  it('makes an Area survey familiar with the Locations it contains, up to the cap', () => {
    const graph = world();
    // Enough Locations that the cap is what limits the result, not the fixture.
    for (let i = 0; i < OBSERVE_AREA_FAMILIARITY_CAP + 2; i++) {
      const id = `loc_extra_${i}`;
      graph.addNode({ id, name: `Hold ${i}`, type: 'location', properties: { locationSubtype: 'hamlet' } });
      graph.addEdge({ id: `e_area_${i}`, source: AREA, target: id, type: 'contains', properties: {} });
    }
    observeOn(graph, AREA, 'area', 'success');
    expect(edgesOf(graph, 'knows_of')).toHaveLength(OBSERVE_AREA_FAMILIARITY_CAP);
  });

  it('charts one unfamiliar ruin in the area on a critical success, and none on a plain one', () => {
    const weak = world();
    observeOn(weak, AREA, 'area', 'success');
    expect(weak.getOutgoingEdges(ACTOR, 'possesses')).toHaveLength(0);

    const strong = world();
    observeOn(strong, AREA, 'area', 'critical_success');
    const chart = strong.getOutgoingEdges(ACTOR, 'possesses')
      .map(e => strong.getNode(e.target))
      .find(n => n?.properties.mapsToLocationId === RUIN);
    expect(chart).toBeDefined();
    // The chart is a possession the world can take away, not a private score.
    expect(chart!.properties.lossCondition).toBe('losable');
  });
});

describe('R2 — a ruined settlement carries the scale the delve layer reads', () => {
  it('bands the magnitude from what the settlement was before it was ruined', () => {
    const graph = world();
    resolveUndertakingCompletion({
      state: { graph, tick: 40 } as unknown as GameState,
      graph, actorId: ACTOR, verb: 'destroy', objectTypeId: 'location',
      handle: { kind: 'node', nodeId: TOWN }, tick: 40,
    });
    const props = graph.getNode(TOWN)!.properties;
    expect(props.locationSubtype).toBe('ruins');
    expect(props.ruinedTick).toBe(40);
    expect(props.ruinMagnitude).toBe(RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE.town);
  });

  it('gives a razed capital a deeper delve than a razed hamlet', () => {
    // The pairing is the point: a single-value assertion would pass on a constant.
    expect(RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE.capital)
      .toBeGreaterThan(RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE.hamlet);
  });
});
