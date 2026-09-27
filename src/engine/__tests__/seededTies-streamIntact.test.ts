// @vitest-lane heavy — builds the same small world twice, once per value of the legacy tie flag (THR-1630)
/**
 * THR-1630 S1a — stopping the random worldwide tie pass does not move the world.
 *
 * The legacy block draws from the shared worldgen stream every later step also draws
 * from. It keeps rolling its dice with the flag off and only skips the write, so the
 * world outside the tie edges must be identical either way. If a draw were dropped,
 * every later node — names, placements, factions — would shift and this census would
 * differ; the ties change could no longer be told apart from a whole-world change.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

/** Edge types the ties can legitimately change: the ties (favours' friendship pairs included) and the quarrels they become. */
const TIE_DERIVED = new Set(['relates_to', 'hostile_to']);

async function censusWith(enabled: boolean): Promise<{ nodes: string[]; edges: string[]; legacyTies: number }> {
  vi.resetModules();
  vi.doMock('../../data/worldgen-living-constants', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../data/worldgen-living-constants')>()),
    WORLDGEN_RANDOM_PROTAGONIST_TIES_ENABLED: enabled,
  }));
  const { initializeGameState, MAP_SIZE_PRESETS } = await import('../gameInit');
  const { generateArchetypes } = await import('../ascendant');
  const { createBalancedCosmology } = await import('../cosmology');
  const { _resetNpcCounter } = await import('../npcSeeding');
  _resetNpcCounter();
  const { state } = initializeGameState(
    generateArchetypes(4, 42)[0], 'T', createBalancedCosmology(), 42,
    MAP_SIZE_PRESETS.small.cols, MAP_SIZE_PRESETS.small.rows,
  );
  const g = state.graph;
  const nodes = [...g.getAllNodes()]
    .map(n => `${n.id}|${n.type}|${n.name}|${String(n.properties.locationId ?? '')}`)
    .sort();
  const edges = g.getAllEdges()
    .filter(e => !TIE_DERIVED.has(e.type))
    // A seeded favour's creditor is chosen by standing, not by ties — kept in the census.
    .map(e => `${e.type}|${e.source}|${e.target}`)
    .sort();
  // The legacy pass's own ids (`edge_rel_i_j`) — proves the mock reached `seedWorld`.
  const legacyTies = g.getEdgesByType('relates_to').filter(e => e.id.startsWith('edge_rel_')).length;
  return { nodes, edges, legacyTies };
}

afterEach(() => {
  vi.doUnmock('../../data/worldgen-living-constants');
  vi.resetModules();
});

// Two worlds built cold in one test — past the 5 s default under heavy-lane load.
describe('legacy random tie pass — the shared stream is untouched', { timeout: 60_000 }, () => {
  it('builds the same nodes and non-tie edges whether or not the legacy pass writes', async () => {
    const off = await censusWith(false);
    const on = await censusWith(true);
    expect(off.nodes.length).toBeGreaterThan(0);
    expect(off.legacyTies).toBe(0);
    expect(on.legacyTies).toBeGreaterThan(0);
    expect(off.nodes).toEqual(on.nodes);
    expect(off.edges).toEqual(on.edges);
  });
});
