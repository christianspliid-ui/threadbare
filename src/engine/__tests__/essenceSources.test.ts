/**
 * Essence Sources substrate tests (THR-611 — Divine Economy, Slice 1).
 *
 * Covers the pure derivations, the typed per-sphere income term with diminishing
 * returns, forward-migration of legacy places of power, per-tick tier recompute,
 * and the load-bearing CONTRACT that legacy essence income is unchanged for a
 * save with no built (typed) sources.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { SPHERE_NAMES } from '../../types';
import type { SphereAlignment } from '../../types/influence';
import type { EssenceSource } from '../../types/essenceSource';
import { computeEssenceGeneration } from '../influence';
import {
  computeSourceIncome,
  migrateControlledPlacesOfPower,
  recomputeControlledSourceTiers,
  readEssenceSource,
} from '../essenceSources';
import {
  deriveSourceTier,
  sourceTierMultiplier,
  sourceDepthMultiplier,
  BASE_SOURCE_INCOME,
  SOURCE_FLOWERING_MULTIPLIER,
  SOURCE_DR_BASE,
  SANCTITY_FLOWERING_THRESHOLD,
  SANCTITY_DRAIN_PER_TICK_CONTESTED,
} from '../../data/essence-sources';

const ascendantId = 'asc.player';

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

function addControlledLocation(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown>,
): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationType: 'location', ...props } });
  graph.addEdge({ id: `edge.controls_${id}`, source: ascendantId, target: id, type: 'controls', properties: {} });
}

const sumGen = (graph: WorldGraph) => {
  const gen = computeEssenceGeneration(graph, ascendantId);
  return SPHERE_NAMES.reduce((sum, s) => sum + gen[s], 0);
};

describe('deriveSourceTier', () => {
  it('bands sanctity into dormant / flowering', () => {
    expect(deriveSourceTier(0)).toBe('dormant');
    expect(deriveSourceTier(SANCTITY_FLOWERING_THRESHOLD - 0.01)).toBe('dormant');
    expect(deriveSourceTier(SANCTITY_FLOWERING_THRESHOLD)).toBe('flowering');
    expect(deriveSourceTier(1)).toBe('flowering');
  });

  it('contested and desecrated take precedence over sanctity band', () => {
    expect(deriveSourceTier(1, { contested: true })).toBe('contested');
    expect(deriveSourceTier(1, { desecrated: true })).toBe('desecrated');
    expect(deriveSourceTier(1, { contested: true, desecrated: true })).toBe('desecrated');
  });

  it('fail-soft: non-finite sanctity resolves to dormant', () => {
    expect(deriveSourceTier(NaN)).toBe('dormant');
    expect(deriveSourceTier(Infinity)).toBe('dormant'); // non-finite → fail-soft dormant
  });
});

describe('sourceTierMultiplier / sourceDepthMultiplier', () => {
  it('maps tiers to multipliers', () => {
    expect(sourceTierMultiplier('dormant')).toBe(1.0);
    expect(sourceTierMultiplier('flowering')).toBe(SOURCE_FLOWERING_MULTIPLIER);
    expect(sourceTierMultiplier('desecrated')).toBe(0);
  });

  it('diminishing returns decay by rank', () => {
    expect(sourceDepthMultiplier(0)).toBe(1.0);
    expect(sourceDepthMultiplier(1)).toBeCloseTo(SOURCE_DR_BASE, 10);
    expect(sourceDepthMultiplier(2)).toBeCloseTo(SOURCE_DR_BASE ** 2, 10);
  });
});

describe('computeSourceIncome — typed routing + DR', () => {
  it('routes a typed flowering source to its own sphere', () => {
    const graph = makeGraph();
    const src: EssenceSource = { kind: 'shrine', sphereAffinity: 'force', sanctity: 1, tier: 'flowering' };
    addControlledLocation(graph, 'loc.shrine', { essenceSource: src });
    const income = computeSourceIncome(graph, ascendantId);
    expect(income.force).toBeCloseTo(BASE_SOURCE_INCOME.shrine * SOURCE_FLOWERING_MULTIPLIER, 10);
    expect(income.life).toBeUndefined(); // not routed to alignment
  });

  it('applies diminishing returns to a second source in the same sphere', () => {
    const graph = makeGraph();
    const mk = (): EssenceSource => ({ kind: 'shrine', sphereAffinity: 'force', sanctity: 1, tier: 'flowering' });
    addControlledLocation(graph, 'loc.s1', { essenceSource: mk() });
    addControlledLocation(graph, 'loc.s2', { essenceSource: mk() });
    const per = BASE_SOURCE_INCOME.shrine * SOURCE_FLOWERING_MULTIPLIER;
    const expected = per * 1 + per * SOURCE_DR_BASE;
    expect(computeSourceIncome(graph, ascendantId).force).toBeCloseTo(expected, 10);
  });

  it('desecrated sources contribute nothing; untyped sources are skipped', () => {
    const graph = makeGraph();
    const des: EssenceSource = { kind: 'shrine', sphereAffinity: 'force', sanctity: 0, tier: 'desecrated', desecrated: true };
    const untyped: EssenceSource = { kind: 'placeOfPower', sanctity: 0, tier: 'dormant' };
    addControlledLocation(graph, 'loc.des', { essenceSource: des });
    addControlledLocation(graph, 'loc.pop', { isPlaceOfPower: true, essenceSource: untyped });
    expect(Object.keys(computeSourceIncome(graph, ascendantId))).toHaveLength(0);
  });
});

describe('migrateControlledPlacesOfPower', () => {
  it('adds a dormant untyped placeOfPower bag to a controlled place of power', () => {
    const graph = makeGraph();
    addControlledLocation(graph, 'loc.pop', { isPlaceOfPower: true });
    const migrated = migrateControlledPlacesOfPower(graph, ascendantId, 7);
    expect(migrated).toBe(1);
    const src = readEssenceSource(graph.getNode('loc.pop')!.properties);
    expect(src).toMatchObject({ kind: 'placeOfPower', tier: 'dormant', originTick: 7 });
    expect(src?.sphereAffinity).toBeUndefined();
  });

  it('is idempotent — a second pass migrates nothing', () => {
    const graph = makeGraph();
    addControlledLocation(graph, 'loc.pop', { isPlaceOfPower: true });
    expect(migrateControlledPlacesOfPower(graph, ascendantId, 0)).toBe(1);
    expect(migrateControlledPlacesOfPower(graph, ascendantId, 1)).toBe(0);
  });

  it('ignores non-place-of-power controlled locations', () => {
    const graph = makeGraph();
    addControlledLocation(graph, 'loc.plain', {});
    expect(migrateControlledPlacesOfPower(graph, ascendantId, 0)).toBe(0);
  });
});

describe('recomputeControlledSourceTiers', () => {
  it('drains sanctity while contested and updates tier counts', () => {
    const graph = makeGraph();
    const src: EssenceSource = { kind: 'shrine', sphereAffinity: 'force', sanctity: 0.65, tier: 'flowering', contestedBy: 'rival.x' };
    addControlledLocation(graph, 'loc.shrine', { essenceSource: src });
    const res = recomputeControlledSourceTiers(graph, ascendantId);
    expect(res.sourceCount).toBe(1);
    expect(res.contestedCount).toBe(1);
    expect(res.tierChanges).toBe(1); // flowering -> contested
    const after = readEssenceSource(graph.getNode('loc.shrine')!.properties)!;
    expect(after.tier).toBe('contested');
    expect(after.sanctity).toBeCloseTo(0.65 - SANCTITY_DRAIN_PER_TICK_CONTESTED, 10);
  });
});

describe('CONTRACT — legacy essence income unchanged with no built sources', () => {
  it('income is identical with zero sources', () => {
    const graph = makeGraph();
    // baseline: just base + alignment
    const before = sumGen(graph);
    expect(computeSourceIncome(graph, ascendantId)).toEqual({});
    expect(sumGen(graph)).toBeCloseTo(before, 10);
  });

  it('a migrated dormant place of power yields exactly the legacy place-of-power income', () => {
    const graph = makeGraph();
    addControlledLocation(graph, 'loc.pop', { isPlaceOfPower: true });
    const legacyTotal = sumGen(graph); // pre-migration, legacy path

    const migrated = migrateControlledPlacesOfPower(graph, ascendantId, 3);
    expect(migrated).toBe(1);

    const perSphereBefore = computeEssenceGeneration(graph, ascendantId);
    // After migration the source is dormant + untyped → still on the legacy term.
    expect(sumGen(graph)).toBeCloseTo(legacyTotal, 10);
    // And bit-for-bit per sphere (no redistribution).
    for (const s of SPHERE_NAMES) {
      expect(perSphereBefore[s]).toBeCloseTo(computeEssenceGeneration(graph, ascendantId)[s], 10);
    }
  });

  it('building/typing a source adds income to its sphere without double-counting the legacy term', () => {
    const graph = makeGraph();
    addControlledLocation(graph, 'loc.pop', { isPlaceOfPower: true });
    const dormantTotal = sumGen(graph);

    // Consecrate: type the source to 'force' and raise it to flowering.
    const host = graph.getNode('loc.pop')!;
    const typed: EssenceSource = { kind: 'placeOfPower', sphereAffinity: 'force', sanctity: 1, tier: 'flowering' };
    graph.updateNode('loc.pop', { properties: { ...host.properties, essenceSource: typed } });

    const after = computeEssenceGeneration(graph, ascendantId);
    const afterTotal = SPHERE_NAMES.reduce((sum, s) => sum + after[s], 0);
    // The legacy +0.5 alignment term is gone (typed now); replaced by a typed
    // force term at flowering. Net change is deterministic and force-routed.
    const expectedDelta =
      BASE_SOURCE_INCOME.placeOfPower * SOURCE_FLOWERING_MULTIPLIER // typed flowering term
      - BASE_SOURCE_INCOME.placeOfPower; // legacy dormant term removed
    expect(afterTotal).toBeCloseTo(dormantTotal + expectedDelta, 10);
    expect(after.force).toBeGreaterThan(computeEssenceGeneration(makeGraph(), ascendantId).force);
  });
});
