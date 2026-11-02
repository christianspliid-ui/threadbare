/**
 * THR-2137 — every living individual with a `located_at` edge lands in the hex index
 * on a world worldgen actually mints. Ambient NPCs (`seedNpcsAtLocations`) carry only
 * the edge, no `properties.locationId`; before the fallback they were all unresolved,
 * so Agent Thread had no townsfolk to land on.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { _resetNpcCounter } from '../npcSeeding';
import { buildHexActorIndex } from '../hexActorIndex';

const SEED = 42;

describe('buildHexActorIndex on a generated world (THR-2137)', () => {
  it('places every living individual that has a located_at edge', { timeout: 120_000 }, () => {
    _resetNpcCounter();
    resetEventCounter();
    resetReputationTraitInit();
    const preset = MAP_SIZE_PRESETS.small;
    const { state } = initializeGameState(
      generateArchetypes(4, SEED)[0], 'T', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );
    const graph = state.graph;

    const located = graph.getNodesByType('actor').filter(a =>
      a.properties.actorType === 'individual'
      && a.properties.deceased !== true
      && graph.getOutgoingEdges(a.id, 'located_at').length > 0);
    // Not vacuous: the world must hold edge-only mortals (the ambient-NPC shape).
    const edgeOnly = located.filter(a => typeof a.properties.locationId !== 'string');
    expect(edgeOnly.length).toBeGreaterThan(0);

    const indexed = new Set<string>();
    for (const ids of buildHexActorIndex(graph).byHex.values()) for (const id of ids) indexed.add(id);
    const missing = located.filter(a => !indexed.has(a.id)).map(a => a.id);
    expect(missing).toEqual([]);
  });
});
