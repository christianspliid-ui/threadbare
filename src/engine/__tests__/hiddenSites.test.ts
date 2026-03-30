/**
 * TB-043: Hidden Sites & Discovery Seeding
 *
 * Tests for:
 * 1. Hidden property on sublocation nodes
 * 2. Hidden site seeding during worldgen
 * 3. UI filtering of hidden sublocations (getVisibleSubLocations)
 * 4. Hidden site reveal via resolveHiddenSiteReveals
 * 5. Integration with hex action bridge
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  ensureSublocations,
  HIDDEN_SITE_RUINS_PROBABILITY,
  HIDDEN_SITE_DEFAULT_PROBABILITY,
  HIGH_HIDDEN_SUBTYPES,
} from '../sublocation';
import { getSubLocations, getVisibleSubLocations } from '../viewLevel';
import {
  resolveHiddenSiteReveals,
  HIDDEN_SITE_REVEAL_TEMPLATES,
} from '../revelationResolver';
import { resolveHexActionFull } from '../hexActionBridge';
import type { GraphNode } from '../../types/graph';
import type { SublocationProperties } from '../../types/sublocation';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

beforeEach(() => {
  enableTracing();
  clearTraces();
});

// ─── Helper: create a location with sublocations ─────────────────────────────

function createLocationWithSublocations(
  graph: WorldGraph,
  opts: {
    locationId?: string;
    locationSubtype?: string;
    hexCol?: number;
    hexRow?: number;
    seed?: number;
  } = {},
) {
  const {
    locationId = 'loc_test',
    locationSubtype = 'ruins',
    hexCol = 3,
    hexRow = 5,
    seed = 42,
  } = opts;

  graph.addNode({
    id: locationId,
    type: 'location',
    name: 'Test Location',
    properties: {
      locationType: locationSubtype,
      locationSubtype,
      hexCol,
      hexRow,
    },
  });

  // Add sublocation type nodes (needed for scoring, not for creation via SUBTYPE_SUBLOCATION_MAP)
  const subs = ensureSublocations(graph, locationId, seed);
  return { locationId, subs };
}

// ─── Hidden Property Seeding ─────────────────────────────────────────────────

describe('hidden site seeding', () => {
  it('seeds some sublocations as hidden in ruins locations', () => {
    // Run 100 seedings with different seeds — at least some should be hidden
    let hiddenCount = 0;
    let totalCount = 0;

    for (let seed = 0; seed < 100; seed++) {
      const graph = new WorldGraph();
      const { subs } = createLocationWithSublocations(graph, {
        locationSubtype: 'ruins',
        seed,
        locationId: `loc_${seed}`,
      });

      for (const sub of subs) {
        totalCount++;
        if (sub.properties.hidden === true) {
          hiddenCount++;
        }
      }
    }

    // With HIDDEN_SITE_RUINS_PROBABILITY = 0.60, we expect ~60% hidden
    // Use loose bounds to avoid flaky tests
    expect(hiddenCount).toBeGreaterThan(0);
    expect(hiddenCount).toBeLessThan(totalCount);
  });

  it('seeds fewer hidden sublocations in non-ruin locations', () => {
    let hiddenCount = 0;
    let totalCount = 0;

    for (let seed = 0; seed < 100; seed++) {
      const graph = new WorldGraph();
      const { subs } = createLocationWithSublocations(graph, {
        locationSubtype: 'city',
        seed,
        locationId: `loc_${seed}`,
      });

      for (const sub of subs) {
        totalCount++;
        if (sub.properties.hidden === true) {
          hiddenCount++;
        }
      }
    }

    // With HIDDEN_SITE_DEFAULT_PROBABILITY = 0.15, expect ~15% hidden
    // The ratio should be lower than ruins
    const ratio = hiddenCount / totalCount;
    expect(ratio).toBeLessThan(0.5); // well below ruins rate
  });

  it('hidden property is boolean true when set', () => {
    // Use a seed that produces hidden sublocations in ruins
    for (let seed = 0; seed < 50; seed++) {
      const graph = new WorldGraph();
      const { subs } = createLocationWithSublocations(graph, {
        locationSubtype: 'ruins',
        seed,
        locationId: `loc_${seed}`,
      });

      for (const sub of subs) {
        if (sub.properties.hidden !== undefined) {
          expect(sub.properties.hidden).toBe(true);
        }
      }
    }
  });

  it('is deterministic — same seed produces same hidden status', () => {
    const seed = 12345;
    const results: boolean[][] = [];

    for (let run = 0; run < 3; run++) {
      const graph = new WorldGraph();
      const { subs } = createLocationWithSublocations(graph, {
        locationSubtype: 'ruins',
        seed,
        locationId: 'loc_det',
      });
      results.push(subs.map(s => s.properties.hidden === true));
    }

    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
});

// ─── Constants ───────────────────────────────────────────────────────────────

describe('hidden site constants', () => {
  it('HIDDEN_SITE_RUINS_PROBABILITY is between 0 and 1', () => {
    expect(HIDDEN_SITE_RUINS_PROBABILITY).toBeGreaterThan(0);
    expect(HIDDEN_SITE_RUINS_PROBABILITY).toBeLessThanOrEqual(1);
  });

  it('HIDDEN_SITE_DEFAULT_PROBABILITY is between 0 and 1', () => {
    expect(HIDDEN_SITE_DEFAULT_PROBABILITY).toBeGreaterThan(0);
    expect(HIDDEN_SITE_DEFAULT_PROBABILITY).toBeLessThanOrEqual(1);
  });

  it('ruins probability is higher than default probability', () => {
    expect(HIDDEN_SITE_RUINS_PROBABILITY).toBeGreaterThan(HIDDEN_SITE_DEFAULT_PROBABILITY);
  });

  it('HIGH_HIDDEN_SUBTYPES includes ruins variants', () => {
    expect(HIGH_HIDDEN_SUBTYPES.has('ruins')).toBe(true);
    expect(HIGH_HIDDEN_SUBTYPES.has('ruined_tower')).toBe(true);
    expect(HIGH_HIDDEN_SUBTYPES.has('ruined_city')).toBe(true);
  });
});

// ─── UI Filtering (getVisibleSubLocations) ───────────────────────────────────

describe('getVisibleSubLocations', () => {
  it('returns only non-hidden sublocations', () => {
    const graph = new WorldGraph();
    const locationId = 'loc_filter';

    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Filter Test',
      properties: { locationType: 'ruins', locationSubtype: 'ruins' },
    });

    // Manually create sublocations — one hidden, one visible
    graph.addNode({
      id: 'sub_visible',
      type: 'location',
      name: 'Visible Crypt',
      properties: { sublocationTypeId: 'sublocation-type.crypt', parentLocationId: locationId },
    });
    graph.addEdge({
      id: 'edge_vis', source: locationId, target: 'sub_visible', type: 'contains', properties: {},
    });

    graph.addNode({
      id: 'sub_hidden',
      type: 'location',
      name: 'Hidden Dungeon',
      properties: { sublocationTypeId: 'sublocation-type.dungeon', parentLocationId: locationId, hidden: true },
    });
    graph.addEdge({
      id: 'edge_hid', source: locationId, target: 'sub_hidden', type: 'contains', properties: {},
    });

    const all = getSubLocations(graph, locationId);
    const visible = getVisibleSubLocations(graph, locationId);

    expect(all).toHaveLength(2);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('sub_visible');
  });

  it('returns all sublocations when none are hidden', () => {
    const graph = new WorldGraph();
    const locationId = 'loc_all_vis';

    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'All Visible',
      properties: { locationType: 'city', locationSubtype: 'city' },
    });

    graph.addNode({
      id: 'sub_a',
      type: 'location',
      name: 'Market',
      properties: { sublocationTypeId: 'sublocation-type.market-district', parentLocationId: locationId },
    });
    graph.addEdge({
      id: 'e_a', source: locationId, target: 'sub_a', type: 'contains', properties: {},
    });

    graph.addNode({
      id: 'sub_b',
      type: 'location',
      name: 'Temple',
      properties: { sublocationTypeId: 'sublocation-type.temple-quarter', parentLocationId: locationId },
    });
    graph.addEdge({
      id: 'e_b', source: locationId, target: 'sub_b', type: 'contains', properties: {},
    });

    expect(getVisibleSubLocations(graph, locationId)).toHaveLength(2);
  });

  it('returns empty array when all sublocations are hidden', () => {
    const graph = new WorldGraph();
    const locationId = 'loc_all_hid';

    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'All Hidden',
      properties: { locationType: 'ruins', locationSubtype: 'ruins' },
    });

    graph.addNode({
      id: 'sub_h1',
      type: 'location',
      name: 'Secret 1',
      properties: { sublocationTypeId: 'sublocation-type.crypt', parentLocationId: locationId, hidden: true },
    });
    graph.addEdge({
      id: 'e_h1', source: locationId, target: 'sub_h1', type: 'contains', properties: {},
    });

    expect(getVisibleSubLocations(graph, locationId)).toHaveLength(0);
    expect(getSubLocations(graph, locationId)).toHaveLength(1);
  });
});

// ─── Hidden Site Reveal (resolveHiddenSiteReveals) ───────────────────────────

describe('resolveHiddenSiteReveals', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Create parent location at hex (3,5)
    graph.addNode({
      id: 'loc_reveal',
      type: 'location',
      name: 'Ruin Site',
      properties: { locationType: 'ruins', locationSubtype: 'ruins', hexCol: 3, hexRow: 5 },
    });

    // Hidden sublocation
    graph.addNode({
      id: 'sub_hidden_1',
      type: 'location',
      name: 'Hidden Crypt',
      properties: {
        sublocationTypeId: 'sublocation-type.crypt',
        parentLocationId: 'loc_reveal',
        hexCol: 3,
        hexRow: 5,
        hidden: true,
      },
    });
    graph.addEdge({
      id: 'e_h1', source: 'loc_reveal', target: 'sub_hidden_1', type: 'contains', properties: {},
    });

    // Visible sublocation (should not be in results)
    graph.addNode({
      id: 'sub_visible_1',
      type: 'location',
      name: 'Visible Dungeon',
      properties: {
        sublocationTypeId: 'sublocation-type.dungeon',
        parentLocationId: 'loc_reveal',
        hexCol: 3,
        hexRow: 5,
      },
    });
    graph.addEdge({
      id: 'e_v1', source: 'loc_reveal', target: 'sub_visible_1', type: 'contains', properties: {},
    });
  });

  it('reveals hidden sublocations at the target hex on qualifying template', () => {
    const results = resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);
    expect(results).toHaveLength(1);
    expect(results[0].sublocationId).toBe('sub_hidden_1');
    expect(results[0].sublocationName).toBe('Hidden Crypt');
  });

  it('flips hidden property to false on the graph node', () => {
    resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);
    const node = graph.getNode('sub_hidden_1')!;
    expect(node.properties.hidden).toBe(false);
  });

  it('returns empty array for non-qualifying template', () => {
    const results = resolveHiddenSiteReveals(graph, 'hex.bless_land', 3, 5, 10);
    expect(results).toHaveLength(0);
  });

  it('returns empty array when no hidden sublocations exist at hex', () => {
    // Remove the hidden sublocation
    graph.removeNode('sub_hidden_1');
    const results = resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for wrong hex coordinates', () => {
    const results = resolveHiddenSiteReveals(graph, 'hex.survey', 0, 0, 10);
    expect(results).toHaveLength(0);
  });

  it('emits HiddenSiteRevealedTrace for each reveal', () => {
    resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);
    const traces = getTraces();
    const revealTrace = traces.find(t => (t as any).type === 'hidden_site_revealed');
    expect(revealTrace).toBeDefined();
    expect((revealTrace as any).sublocationId).toBe('sub_hidden_1');
    expect((revealTrace as any).sublocationName).toBe('Hidden Crypt');
    expect((revealTrace as any).hexCol).toBe(3);
    expect((revealTrace as any).hexRow).toBe(5);
  });

  it('reveals multiple hidden sublocations at the same hex', () => {
    // Add a second hidden sublocation
    graph.addNode({
      id: 'sub_hidden_2',
      type: 'location',
      name: 'Secret Chamber',
      properties: {
        sublocationTypeId: 'sublocation-type.archive',
        parentLocationId: 'loc_reveal',
        hexCol: 3,
        hexRow: 5,
        hidden: true,
      },
    });
    graph.addEdge({
      id: 'e_h2', source: 'loc_reveal', target: 'sub_hidden_2', type: 'contains', properties: {},
    });

    const results = resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);
    expect(results).toHaveLength(2);
  });

  it('revealed site becomes visible via getVisibleSubLocations', () => {
    // Before reveal — hidden
    expect(getVisibleSubLocations(graph, 'loc_reveal')).toHaveLength(1);

    // Reveal
    resolveHiddenSiteReveals(graph, 'hex.survey', 3, 5, 10);

    // After reveal — visible
    expect(getVisibleSubLocations(graph, 'loc_reveal')).toHaveLength(2);
  });
});

// ─── HIDDEN_SITE_REVEAL_TEMPLATES ────────────────────────────────────────────

describe('HIDDEN_SITE_REVEAL_TEMPLATES', () => {
  it('includes survey and sense_threads', () => {
    expect(HIDDEN_SITE_REVEAL_TEMPLATES.has('hex.survey')).toBe(true);
    expect(HIDDEN_SITE_REVEAL_TEMPLATES.has('hex.sense_threads')).toBe(true);
  });

  it('does not include non-Find templates', () => {
    expect(HIDDEN_SITE_REVEAL_TEMPLATES.has('hex.bless_land')).toBe(false);
    expect(HIDDEN_SITE_REVEAL_TEMPLATES.has('hex.corrupt_land')).toBe(false);
  });
});

// ─── resolveHexActionFull integration ────────────────────────────────────────

describe('resolveHexActionFull with hidden sites', () => {
  it('includes hiddenSiteReveals in result when graph provided', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_int',
      type: 'location',
      name: 'Integration Site',
      properties: { locationType: 'ruins', locationSubtype: 'ruins', hexCol: 1, hexRow: 2 },
    });
    graph.addNode({
      id: 'sub_int_hidden',
      type: 'location',
      name: 'Hidden Vault',
      properties: {
        sublocationTypeId: 'sublocation-type.archive',
        parentLocationId: 'loc_int',
        hexCol: 1,
        hexRow: 2,
        hidden: true,
      },
    });
    graph.addEdge({
      id: 'e_int', source: 'loc_int', target: 'sub_int_hidden', type: 'contains', properties: {},
    });

    const result = resolveHexActionFull('hex.survey', 1, 2, 'success', 10, graph);
    expect(result.hiddenSiteReveals).toHaveLength(1);
    expect(result.hiddenSiteReveals[0].sublocationId).toBe('sub_int_hidden');
  });

  it('returns empty hiddenSiteReveals on failure', () => {
    const graph = new WorldGraph();
    const result = resolveHexActionFull('hex.survey', 1, 2, 'failure', 10, graph);
    expect(result.hiddenSiteReveals).toHaveLength(0);
  });

  it('returns empty hiddenSiteReveals when graph not provided', () => {
    const result = resolveHexActionFull('hex.survey', 1, 2, 'success', 10);
    expect(result.hiddenSiteReveals).toHaveLength(0);
  });
});
