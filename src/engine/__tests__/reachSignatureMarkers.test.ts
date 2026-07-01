/**
 * THR-554: reach-signature map-marker selector.
 *
 * Covers detection of the three engine-backed signature footprints from live
 * graph + control-effect state, hex resolution, fail-soft skips, and
 * deterministic ordering.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildReachSignatureMarkers } from '../reachSignatureMarkers';
import type { ControlEffect } from '../../types/controlEffect';

function riftEffect(id: string, col: number, row: number, sphere = 'mind', active = true): ControlEffect {
  return {
    effectId: id, templateId: 'invest.veil.rend_the_gate', ownerId: 'ascendant',
    targetHexCol: col, targetHexRow: row, targetNodeId: 'loc-rift',
    establishedTick: 1, ritualEssenceInvested: 0,
    perTickCost: {}, perTickMutations: [], perTickGraphOps: [],
    perTickSphereInfluence: { sphere: sphere as never, magnitude: 5, cap: 100 },
    active, ticksActive: 0,
    narrativeTemplates: { established: '', active: '', lapsed: '' },
  } as ControlEffect;
}

describe('buildReachSignatureMarkers', () => {
  it('detects a warhost army via its located_at edge → hex', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Keep', properties: { hexCol: 3, hexRow: 7 } });
    graph.addNode({ id: 'army-1', type: 'actor', name: 'Host', properties: { actorType: 'group', warhost: true } });
    graph.addEdge({ id: 'e1', source: 'army-1', target: 'loc-a', type: 'located_at', properties: {} });

    const markers = buildReachSignatureMarkers(graph, []);
    expect(markers).toEqual([{ kind: 'warhost', id: 'army-1', hexCol: 3, hexRow: 7 }]);
  });

  it('ignores ordinary (non-warhost) armies', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Keep', properties: { hexCol: 1, hexRow: 1 } });
    graph.addNode({ id: 'army-1', type: 'actor', name: 'Host', properties: { actorType: 'group' } });
    graph.addEdge({ id: 'e1', source: 'army-1', target: 'loc-a', type: 'located_at', properties: {} });

    expect(buildReachSignatureMarkers(graph, [])).toEqual([]);
  });

  it('detects a rift from a control effect carrying perTickSphereInfluence, tinted by its sphere', () => {
    const graph = new WorldGraph();
    const markers = buildReachSignatureMarkers(graph, [riftEffect('rift-1', 5, 9, 'entropy')]);
    expect(markers).toEqual([{ kind: 'rift', id: 'rift-1', hexCol: 5, hexRow: 9, sphere: 'entropy' }]);
  });

  it('skips a lapsed (active:false) rift', () => {
    const graph = new WorldGraph();
    expect(buildReachSignatureMarkers(graph, [riftEffect('rift-x', 5, 9, 'mind', false)])).toEqual([]);
  });

  it('ignores control effects without sphere influence', () => {
    const graph = new WorldGraph();
    const plain = { ...riftEffect('c-1', 2, 2), perTickSphereInfluence: undefined } as ControlEffect;
    expect(buildReachSignatureMarkers(graph, [plain])).toEqual([]);
  });

  it('detects a wonder from a spawn_unique_location location node', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'gw-1', type: 'location', name: 'The Great Work',
      properties: { hexCol: 8, hexRow: 2, generatedBy: 'spawn_unique_location', unique: true },
    });
    const markers = buildReachSignatureMarkers(graph, []);
    expect(markers).toEqual([{ kind: 'wonder', id: 'gw-1', hexCol: 8, hexRow: 2 }]);
  });

  it('does not treat ordinary locations as wonders', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Village', properties: { hexCol: 0, hexRow: 0 } });
    expect(buildReachSignatureMarkers(graph, [])).toEqual([]);
  });

  it('fail-soft: skips a warhost with no located_at edge, and a wonder with no coords', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'army-1', type: 'actor', name: 'Host', properties: { warhost: true } });
    graph.addNode({ id: 'gw-1', type: 'location', name: 'GW', properties: { generatedBy: 'spawn_unique_location' } });
    expect(buildReachSignatureMarkers(graph, [])).toEqual([]);
  });

  it('returns all three kinds together, sorted by id for deterministic render order', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-a', type: 'location', name: 'Keep', properties: { hexCol: 3, hexRow: 7 } });
    graph.addNode({ id: 'zzz-army', type: 'actor', name: 'Host', properties: { warhost: true } });
    graph.addEdge({ id: 'e1', source: 'zzz-army', target: 'loc-a', type: 'located_at', properties: {} });
    graph.addNode({
      id: 'aaa-gw', type: 'location', name: 'GW',
      properties: { hexCol: 8, hexRow: 2, generatedBy: 'spawn_unique_location' },
    });

    const markers = buildReachSignatureMarkers(graph, [riftEffect('mmm-rift', 5, 9)]);
    expect(markers.map((m) => m.id)).toEqual(['aaa-gw', 'mmm-rift', 'zzz-army']);
    expect(markers.map((m) => m.kind)).toEqual(['wonder', 'rift', 'warhost']);
  });

  it('handles undefined controlEffects fail-soft', () => {
    const graph = new WorldGraph();
    expect(buildReachSignatureMarkers(graph, undefined)).toEqual([]);
  });
});
