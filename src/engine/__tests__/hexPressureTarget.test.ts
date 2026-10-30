/**
 * THR-2087 — a hex card's sphere push lands on a place.
 *
 * A hex card targets the synthetic `hex_COL_ROW`, which no graph node carries, so
 * `phaseSpherePressure` used to drop the push as an unknown entity. The resolver
 * anchors it on the lowest-id place on the hex, else the nearest place within
 * HEX_PRESSURE_FALLBACK_RADIUS (ties by id), else drops it with a trace.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveHexPressureTargets } from '../hexPressureTarget';
import { phaseSpherePressure } from '../phaseSpherePressure';
import { hexDistance } from '../../lib/hexMath';
import {
  ACTION_PRESSURE_SUCCESS,
  HEX_PRESSURE_FALLBACK_RADIUS,
  createDefaultSphereAffinity,
} from '../../types/sphereAffinity';
import type { SpherePressureEvent } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

function addPlace(graph: WorldGraph, id: string, col: number, row: number): void {
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { hexCol: col, hexRow: row, sphereAffinity: createDefaultSphereAffinity() },
  } as never);
}

/** The push the completing-action site queues for a resolved cast (unifiedActionResolution). */
function castPush(templateId: string, targetId: string): SpherePressureEvent {
  const template = getUnifiedTemplateById(templateId)!;
  expect(template.sphereAffinity).toBeTruthy();
  return {
    targetEntityId: targetId,
    sphere: template.sphereAffinity as SphereName,
    magnitude: ACTION_PRESSURE_SUCCESS,
    source: 'divine_action',
    sourceId: `act_${templateId}`,
    causedBy: 'asc',
  };
}

function makeState(graph: WorldGraph, pressures: SpherePressureEvent[]): GameState {
  return { tick: 7, graph, tiles: [], ascendantId: 'asc', pendingSpherePressures: pressures } as unknown as GameState;
}

function progressOn(graph: WorldGraph, id: string, sphere: SphereName): number {
  const aff = graph.getNode(id)!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
  return aff.scores[sphere] * 1000 + aff.progress[sphere];
}

describe('resolveHexPressureTargets (THR-2087)', () => {
  it('lands a push on the lower-id place of a hex holding two, at full magnitude', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_b', 5, 5);
    addPlace(graph, 'loc_a', 5, 5);
    const push = castPush('hex.seed_life', 'hex_5_5');
    const { pressures, traces } = resolveHexPressureTargets(graph, [push], 3);
    expect(pressures).toEqual([{ ...push, targetEntityId: 'loc_a' }]);
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ category: 'sphere_pressure.hex_resolved', resolvedTo: 'loc_a', distance: 0, hexId: 'hex_5_5' });
  });

  it('lands an empty-hex push on the nearest place within the radius, ties to the lower id', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_far', 5, 7);   // 2 away
    addPlace(graph, 'loc_z', 6, 5);     // 1 away
    addPlace(graph, 'loc_y', 4, 5);     // 1 away
    expect(hexDistance({ col: 5, row: 5 }, { col: 6, row: 5 })).toBe(1);
    expect(hexDistance({ col: 5, row: 5 }, { col: 4, row: 5 })).toBe(1);
    const { pressures, traces } = resolveHexPressureTargets(graph, [castPush('hex.seed_life', 'hex_5_5')], 3);
    expect(pressures[0].targetEntityId).toBe('loc_y');
    expect(traces[0]).toMatchObject({ resolvedTo: 'loc_y', distance: 1 });
  });

  it('measures on the map\'s flat-top odd-q grid, not odd-r', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_diag', 3, 6);  // odd-q: 2 away (odd-r would say 3)
    expect(hexDistance({ col: 5, row: 5 }, { col: 3, row: 6 })).toBe(2);
    const { pressures, traces } = resolveHexPressureTargets(graph, [castPush('hex.seed_life', 'hex_5_5')], 3);
    expect(pressures[0].targetEntityId).toBe('loc_diag');
    expect(traces[0]).toMatchObject({ category: 'sphere_pressure.hex_resolved', distance: 2 });
  });

  it('drops a push with no place within the radius, with a hex_unanchored trace', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_far', 5 + HEX_PRESSURE_FALLBACK_RADIUS + 1, 5);
    const { pressures, traces } = resolveHexPressureTargets(graph, [castPush('hex.seed_life', 'hex_5_5')], 3);
    expect(pressures).toEqual([]);
    expect(traces).toHaveLength(1);
    expect(traces[0].category).toBe('sphere_pressure.hex_unanchored');
  });

  it('returns a non-hex push as the same object', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_a', 5, 5);
    const push = castPush('hex.seed_life', 'loc_a');
    const { pressures, traces } = resolveHexPressureTargets(graph, [push], 3);
    expect(pressures[0]).toBe(push);
    expect(traces).toEqual([]);
  });

  it('ignores sublocations (the place tier only)', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_b', 5, 5);
    graph.addNode({
      id: 'loc_a_sub', type: 'location', name: 'cellar',
      properties: { hexCol: 5, hexRow: 5, parentLocationId: 'loc_b' },
    } as never);
    const { pressures } = resolveHexPressureTargets(graph, [castPush('hex.seed_life', 'hex_5_5')], 3);
    expect(pressures[0].targetEntityId).toBe('loc_b');
  });
});

describe('phaseSpherePressure lands hex casts on places (THR-2087)', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('a resolved Seed Life cast on a hex holding a place moves that place\'s life', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_town', 3, 4);
    const before = progressOn(graph, 'loc_town', 'life');
    phaseSpherePressure(makeState(graph, [castPush('hex.seed_life', 'hex_3_4')]));
    expect(progressOn(graph, 'loc_town', 'life')).toBeGreaterThan(before);
    expect(getTraces().some(t => t.category === 'sphere_pressure.hex_resolved')).toBe(true);
  });

  it('a Seed Life cast on an empty hex moves the nearest place within 2', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_near', 3, 6);
    const before = progressOn(graph, 'loc_near', 'life');
    phaseSpherePressure(makeState(graph, [castPush('hex.seed_life', 'hex_3_4')]));
    expect(progressOn(graph, 'loc_near', 'life')).toBeGreaterThan(before);
  });

  it('Bestow Vision moves mind on the hex\'s place', () => {
    const graph = new WorldGraph();
    addPlace(graph, 'loc_town', 3, 4);
    const before = progressOn(graph, 'loc_town', 'mind');
    phaseSpherePressure(makeState(graph, [castPush('hex.bestow_vision', 'hex_3_4')]));
    expect(progressOn(graph, 'loc_town', 'mind')).toBeGreaterThan(before);
  });

  it.each(['hex.attune_leyline', 'hex.amplify_flow', 'hex.anchor_sphere', 'hex.channel_current'])(
    '%s carries energy and its cast lands energy on a place',
    (templateId) => {
      const template = getUnifiedTemplateById(templateId)!;
      expect(template.sphereAffinity).toBe('energy');
      expect(template.progression?.pricedIn).toBe('energy');
      const graph = new WorldGraph();
      addPlace(graph, 'loc_town', 3, 4);
      const before = progressOn(graph, 'loc_town', 'energy');
      phaseSpherePressure(makeState(graph, [castPush(templateId, 'hex_3_4')]));
      expect(progressOn(graph, 'loc_town', 'energy')).toBeGreaterThan(before);
    },
  );
});
