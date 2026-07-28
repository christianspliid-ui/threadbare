/**
 * Essence bridge tests — mortal economy → divine economy (THR-618, Mortal Economy P4).
 *
 * Covers the pure sustenance derivation (host resolution, sphere matching, weighted
 * tier scoring, the nurture ceiling) and the load-bearing CONTRACTS the bridge must
 * not break:
 *   - an untyped (legacy / migrated-but-unbuilt) source never drifts, so a save that
 *     has done nothing keeps exactly its old income (NFP #6);
 *   - the land alone can never reach the flowering threshold — only the god's hand;
 *   - withering has no floor above zero, so a starving land really does empty a source.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereAlignment } from '../../types/influence';
import type { EssenceSource } from '../../types/essenceSource';
import type { ResourceInstance, StockTier } from '../../types/resource';
import {
  computeSanctitySustenance,
  resolveEconomicHost,
  scoreSphereAffinity,
  sustenancePolarity,
} from '../essenceEconomyBridge';
import { recomputeControlledSourceTiers, readEssenceSource } from '../essenceSources';
import {
  ECON_SANCTITY_DRIFT_PER_TICK,
  ECON_SANCTITY_NURTURE_CEILING,
  SANCTITY_FLOWERING_THRESHOLD,
  SANCTITY_DRAIN_PER_TICK_CONTESTED,
} from '../../data/essence-sources';

const ascendantId = 'asc.player';

/** `pearls` is the sole `spirit` resource class; `ore`/`stone` are `matter`. */
const SPIRIT_GOOD = 'pearls';

function res(quantity: number, stockTier?: StockTier): ResourceInstance {
  return { quantity, renewable: true, renewalRate: 0.1, ...(stockTier ? { stockTier } : {}) };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'The Verdant One',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
    },
  });
  return graph;
}

function source(overrides: Partial<EssenceSource> = {}): EssenceSource {
  return { kind: 'shrine', sphereAffinity: 'spirit', sanctity: 0.2, tier: 'dormant', ...overrides };
}

function addLocation(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown>,
  { controlled = false }: { controlled?: boolean } = {},
): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationType: 'location', ...props } });
  if (controlled) {
    graph.addEdge({
      id: `edge.controls_${id}`,
      source: ascendantId,
      target: id,
      type: 'controls',
      properties: {},
    });
  }
}

describe('scoreSphereAffinity', () => {
  it('counts only resources whose class shares the source sphere', () => {
    const resources = { [SPIRIT_GOOD]: res(80, 'surplus'), ore: res(10, 'scarce') };
    const { affinityScore, matchedResourceIds } = scoreSphereAffinity(resources, 'spirit');
    expect(matchedResourceIds).toEqual([SPIRIT_GOOD]);
    expect(affinityScore).toBe(1); // the scarce ore is a matter good — invisible here
  });

  it('reads an underived stockTier as adequate rather than skipping it', () => {
    const { affinityScore, matchedResourceIds } = scoreSphereAffinity(
      { [SPIRIT_GOOD]: res(50) },
      'spirit',
    );
    expect(matchedResourceIds).toEqual([SPIRIT_GOOD]);
    expect(affinityScore).toBe(0);
  });

  it('returns an empty match set when the land grows nothing of that sphere', () => {
    const { affinityScore, matchedResourceIds } = scoreSphereAffinity(
      { ore: res(90, 'surplus') },
      'spirit',
    );
    expect(matchedResourceIds).toEqual([]);
    expect(affinityScore).toBe(0);
  });

  it('weights matching goods by class baseValue', () => {
    // ore (baseValue 1.1, surplus) vs stone (baseValue 0.8, scarce) — both matter.
    const { affinityScore } = scoreSphereAffinity(
      { ore: res(90, 'surplus'), stone: res(10, 'scarce') },
      'matter',
    );
    expect(affinityScore).toBeCloseTo((1.1 - 0.8) / (1.1 + 0.8), 6);
    expect(affinityScore).toBeGreaterThan(0);
  });
});

describe('sustenancePolarity', () => {
  it('maps sign to polarity with an exact-zero neutral band', () => {
    expect(sustenancePolarity(0.4)).toBe('nurturing');
    expect(sustenancePolarity(-0.4)).toBe('withering');
    expect(sustenancePolarity(0)).toBe('steady');
    expect(sustenancePolarity(Number.NaN)).toBe('steady');
  });
});

describe('resolveEconomicHost', () => {
  it('answers with the location itself when it carries the resources', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(70, 'surplus') } });
    expect(resolveEconomicHost(graph, 'loc.vale')?.locationId).toBe('loc.vale');
  });

  it('resolves a sublocation up one parentLocationId hop', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(70, 'surplus') } });
    addLocation(graph, 'sub.shrine', { parentLocationId: 'loc.vale' });
    expect(resolveEconomicHost(graph, 'sub.shrine')?.locationId).toBe('loc.vale');
  });

  it('returns undefined for a host with no resources and no parent', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.bare', {});
    expect(resolveEconomicHost(graph, 'loc.bare')).toBeUndefined();
    expect(resolveEconomicHost(graph, 'loc.missing')).toBeUndefined();
  });
});

describe('computeSanctitySustenance', () => {
  it('CONTRACT: an untyped source never drifts (legacy income preserved)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(90, 'surplus') } });
    const s = computeSanctitySustenance(
      graph,
      'loc.vale',
      source({ sphereAffinity: undefined, kind: 'placeOfPower' }),
    );
    expect(s.drift).toBe(0);
    expect(s.reason).toBe('untyped');
  });

  it('nurtures a typed source standing on surplus goods of its sphere', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(90, 'surplus') } });
    const s = computeSanctitySustenance(graph, 'loc.vale', source({ sanctity: 0.2 }));
    expect(s.drift).toBeCloseTo(ECON_SANCTITY_DRIFT_PER_TICK, 6);
    expect(s.polarity).toBe('nurturing');
    expect(s.economicHostId).toBe('loc.vale');
    expect(s.reason).toBeUndefined();
  });

  it('withers a typed source standing on scarce goods of its sphere', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(5, 'scarce') } });
    const s = computeSanctitySustenance(graph, 'loc.vale', source({ sanctity: 0.2 }));
    expect(s.drift).toBeCloseTo(-ECON_SANCTITY_DRIFT_PER_TICK, 6);
    expect(s.polarity).toBe('withering');
  });

  it('is inert where the land grows nothing of the source sphere', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.quarry', { resources: { ore: res(90, 'surplus') } });
    const s = computeSanctitySustenance(graph, 'loc.quarry', source());
    expect(s.drift).toBe(0);
    expect(s.reason).toBe('no-matching-goods');
    expect(s.economicHostId).toBe('loc.quarry');
  });

  it('is inert for a host that resolves to no economic location', () => {
    const graph = makeGraph();
    graph.addNode({ id: 'art.relic', type: 'artifact', name: 'relic', properties: {} });
    const s = computeSanctitySustenance(graph, 'art.relic', source({ kind: 'relic' }));
    expect(s.drift).toBe(0);
    expect(s.reason).toBe('no-host');
  });

  it('CONTRACT: nurture stops at the ceiling, which sits below the flowering threshold', () => {
    expect(ECON_SANCTITY_NURTURE_CEILING).toBeLessThan(SANCTITY_FLOWERING_THRESHOLD);

    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(90, 'surplus') } });
    const atCeiling = computeSanctitySustenance(
      graph,
      'loc.vale',
      source({ sanctity: ECON_SANCTITY_NURTURE_CEILING }),
    );
    expect(atCeiling.drift).toBe(0);
    expect(atCeiling.reason).toBe('ceiling');
    // Reported polarity stays honest — the land IS generous, it just cannot give more.
    expect(atCeiling.polarity).toBe('nurturing');
  });

  it('clips the final nurturing step so it lands exactly on the ceiling', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(90, 'surplus') } });
    const nearly = ECON_SANCTITY_NURTURE_CEILING - ECON_SANCTITY_DRIFT_PER_TICK / 2;
    const s = computeSanctitySustenance(graph, 'loc.vale', source({ sanctity: nearly }));
    expect(nearly + s.drift).toBeCloseTo(ECON_SANCTITY_NURTURE_CEILING, 6);
  });

  it('still withers a source held above the ceiling by the god (no upward-only bias)', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.vale', { resources: { [SPIRIT_GOOD]: res(5, 'scarce') } });
    const s = computeSanctitySustenance(graph, 'loc.vale', source({ sanctity: 0.9, tier: 'flowering' }));
    expect(s.drift).toBeLessThan(0);
    expect(s.reason).toBeUndefined();
  });
});

describe('recomputeControlledSourceTiers — bridge integration', () => {
  it('applies economic drift to controlled typed sources and counts it', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.vale',
      { resources: { [SPIRIT_GOOD]: res(90, 'surplus') }, essenceSource: source({ sanctity: 0.2 }) },
      { controlled: true },
    );

    const result = recomputeControlledSourceTiers(graph, ascendantId);
    expect(result.econNurtured).toBe(1);
    expect(result.econWithered).toBe(0);
    expect(readEssenceSource(graph.getNode('loc.vale')?.properties)?.sanctity).toBeCloseTo(
      0.2 + ECON_SANCTITY_DRIFT_PER_TICK,
      6,
    );
  });

  it('CONTRACT: the land alone can never flower a source, however many ticks pass', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.vale',
      { resources: { [SPIRIT_GOOD]: res(95, 'surplus') }, essenceSource: source({ sanctity: 0 }) },
      { controlled: true },
    );

    for (let i = 0; i < 500; i++) recomputeControlledSourceTiers(graph, ascendantId);

    const src = readEssenceSource(graph.getNode('loc.vale')?.properties);
    expect(src?.sanctity).toBeCloseTo(ECON_SANCTITY_NURTURE_CEILING, 6);
    expect(src?.tier).toBe('dormant');
  });

  it('a starving land drains a source all the way to zero (no floor)', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.vale',
      { resources: { [SPIRIT_GOOD]: res(2, 'scarce') }, essenceSource: source({ sanctity: 0.8, tier: 'flowering' }) },
      { controlled: true },
    );

    for (let i = 0; i < 200; i++) recomputeControlledSourceTiers(graph, ascendantId);

    const src = readEssenceSource(graph.getNode('loc.vale')?.properties);
    expect(src?.sanctity).toBe(0);
    expect(src?.tier).toBe('dormant');
  });

  it('a contested source in a starving valley loses to both causes in one tick', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.vale',
      {
        resources: { [SPIRIT_GOOD]: res(2, 'scarce') },
        essenceSource: source({ sanctity: 0.5, contestedBy: 'rival.ash' }),
      },
      { controlled: true },
    );

    recomputeControlledSourceTiers(graph, ascendantId);

    expect(readEssenceSource(graph.getNode('loc.vale')?.properties)?.sanctity).toBeCloseTo(
      0.5 - ECON_SANCTITY_DRIFT_PER_TICK - SANCTITY_DRAIN_PER_TICK_CONTESTED,
      6,
    );
  });

  it('leaves a desecrated source inert — the land feeds whoever holds it', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.vale',
      {
        resources: { [SPIRIT_GOOD]: res(95, 'surplus') },
        essenceSource: source({ sanctity: 0.3, desecrated: true, tier: 'desecrated' }),
      },
      { controlled: true },
    );

    const result = recomputeControlledSourceTiers(graph, ascendantId);
    expect(result.econNurtured).toBe(0);
    expect(readEssenceSource(graph.getNode('loc.vale')?.properties)?.sanctity).toBe(0.3);
  });

  it('CONTRACT: an untyped migrated place of power is untouched by the bridge', () => {
    const graph = makeGraph();
    addLocation(
      graph,
      'loc.peak',
      {
        resources: { [SPIRIT_GOOD]: res(95, 'surplus'), ore: res(95, 'surplus') },
        essenceSource: source({ sphereAffinity: undefined, kind: 'placeOfPower', sanctity: 0 }),
      },
      { controlled: true },
    );

    for (let i = 0; i < 100; i++) recomputeControlledSourceTiers(graph, ascendantId);

    const src = readEssenceSource(graph.getNode('loc.peak')?.properties);
    expect(src?.sanctity).toBe(0);
    expect(src?.tier).toBe('dormant');
  });
});
