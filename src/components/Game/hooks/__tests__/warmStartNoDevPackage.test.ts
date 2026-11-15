/**
 * THR-2230 — a warm start arrives in a real world.
 *
 * `?view=game&seeded&warm=300` used to load `devSeedAscendantTestPackage`, so warm
 * playtesters judged eleven fixture Hooks and pre-filled elder pools no real run
 * produces. The plain `?view=game&seeded` route keeps the package.
 *
 * The test drives the same two calls `App.tsx` makes — `parseWarmStartTicks` on the
 * URL, then `seedsDevTestPackage` — and runs the real package function into a real
 * `WorldGraph` exactly when the predicate says `useSimulation` would.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseWarmStartTicks, seedsDevTestPackage } from '../useWarmStart';
import { WorldGraph } from '../../../../engine/graph';
import { devSeedAscendantTestPackage } from '../../../../engine/gameInit';
import type { GameState } from '../../../../types/gameState';

const ASCENDANT_ID = 'asc.test.1';

/** Build the god as `useSimulation` would for this URL (dev quick-start route). */
function godForUrl(search: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'Vess', properties: {} });
  const state = { graph, ascendantId: ASCENDANT_ID } as unknown as GameState;
  const isDevQuickStart = true; // `?view=game&seeded` in every case below
  if (seedsDevTestPackage(isDevQuickStart, parseWarmStartTicks(search))) {
    devSeedAscendantTestPackage(state);
  }
  return graph;
}

function devTraitEdges(graph: WorldGraph) {
  return graph.getOutgoingEdges(ASCENDANT_ID, 'has_trait').filter(e => e.target.startsWith('trait.dev.'));
}

function devAgreementEdges(graph: WorldGraph) {
  return graph.getOutgoingEdges(ASCENDANT_ID).filter(e => e.id.startsWith('edge.agreement.dev.'));
}

describe('THR-2230 — the warm start loads no dev test package', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warn.mockRestore(); });

  it('warm=300 with seeded → no trait.dev.* traits and no dev agreements on the god', () => {
    const graph = godForUrl('?view=game&seeded&size=medium&warm=300');
    expect(devTraitEdges(graph)).toHaveLength(0);
    expect(devAgreementEdges(graph)).toHaveLength(0);
  });

  it('seeded without warm → the package still lands', () => {
    const graph = godForUrl('?view=game&seeded&size=medium');
    expect(devTraitEdges(graph).length).toBeGreaterThan(0);
    expect(devAgreementEdges(graph).length).toBeGreaterThan(0);
  });

  it('an ignored warm value (0 ticks) is not a warm start, so the package stays', () => {
    expect(seedsDevTestPackage(true, parseWarmStartTicks('?view=game&seeded&warm=0'))).toBe(true);
  });

  it('never seeds off the dev quick-start route', () => {
    expect(seedsDevTestPackage(false, 0)).toBe(false);
    expect(seedsDevTestPackage(false, 300)).toBe(false);
  });
});
