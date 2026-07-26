/**
 * THR-779 — regional-scale templates registered into the encounter-cache path.
 *
 * The audit (`Docs/audits/2026-07-26-nudge-migration-audit.md` § finding 3) found 61
 * templates that all three agent-facing draw paths rejected. 17 carried the WIRE verdict;
 * the other 44 carry DELETE and are removed by WS5 (THR-778).
 *
 * These tests are the standing guard against silent re-orphaning. The load-bearing one is
 * `produces cache entries at a matching location` — the id list and the `locationSubtypes`
 * assertions alone would still pass if the cache consumer were deleted, so the suite drives
 * a real `EncounterCacheManager.buildFullCache` and asserts the entries appear.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { EncounterCacheManager } from '../encounterCache';
import {
  CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../data/unified-action-templates';
import { generateUnifiedCandidates } from '../unifiedCandidates';

/** Scales `generateUnifiedCandidates` skips outright — the reason these needed rescuing. */
const ARRAY_PATH_SKIPPED_SCALES = new Set(['regional', 'cosmic']);

function addLocation(graph: WorldGraph, id: string, locationType: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { locationType, hexCol: 0, hexRow: 0 },
  });
}

describe('THR-779 — regional cache registration', () => {
  it('resolves every registered id to a real template', () => {
    // A typo'd or renamed id is dropped fail-soft by the resolver, which would silently
    // shrink the rescued set. Pin the count so the drop surfaces here instead.
    expect(CACHE_REGISTERED_REGIONAL_TEMPLATES).toHaveLength(
      CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS.length,
    );

    const unresolved = CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS.filter(
      id => !UNIFIED_ACTION_TEMPLATES.some(t => t.id === id),
    );
    expect(unresolved).toEqual([]);
  });

  it('registers exactly the 17 templates carrying the WIRE verdict', () => {
    expect(CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS).toHaveLength(17);
    // No duplicates — a repeated id would double-register the template at every
    // matching location and skew scoring.
    expect(new Set(CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS).size).toBe(17);
  });

  it('declares locationSubtypes on every registered template', () => {
    // The cache consumer matches on `locationSubtypes?.includes(locationType)`. A template
    // without them registers at NO location, so the registration would be a silent no-op —
    // exactly the orphaning this ticket fixes. This is what caught the three `fa.*`
    // templates, which shipped with no locationSubtypes at all.
    const missing = CACHE_REGISTERED_REGIONAL_TEMPLATES
      .filter(t => !t.locationSubtypes || t.locationSubtypes.length === 0)
      .map(t => t.id);
    expect(missing).toEqual([]);
  });

  it('only registers templates the array-scored path actually skips', () => {
    // Registering a `local`-scale template here would double-register it: once through
    // generateUnifiedCandidates and again through the cache.
    const wrongScale = CACHE_REGISTERED_REGIONAL_TEMPLATES
      .filter(t => !ARRAY_PATH_SKIPPED_SCALES.has(t.scale))
      .map(t => `${t.id} (${t.scale})`);
    expect(wrongScale).toEqual([]);
  });

  it('keeps every registered template mortal-drawable', () => {
    // The cache path serves agents. A template without a mortal affinity would be cached
    // and then rejected downstream — reachability on paper only.
    const notMortal = CACHE_REGISTERED_REGIONAL_TEMPLATES
      .filter(t => !t.actorAffinities?.some(a => a === 'individual' || a === 'group'))
      .map(t => t.id);
    expect(notMortal).toEqual([]);
  });

  it('produces cache entries at a matching location for all 17', () => {
    // The non-vacuous proof: drive the real cache builder over one location per declared
    // subtype and assert every registered template lands in the cache.
    const subtypes = new Set<string>();
    for (const t of CACHE_REGISTERED_REGIONAL_TEMPLATES) {
      for (const s of t.locationSubtypes ?? []) subtypes.add(s);
    }

    const graph = new WorldGraph();
    for (const subtype of subtypes) {
      addLocation(graph, `loc.${subtype}`, subtype);
    }

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph, 0);

    const cachedIds = new Set(cache.getAllEntries().map(e => e.templateId));
    const stillOrphaned = CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS.filter(
      id => !cachedIds.has(id),
    );
    expect(stillOrphaned).toEqual([]);
  });

  it('attaches each registered template only at its declared subtypes', () => {
    // Guards the other direction: a registration must not leak into every location.
    const sample = CACHE_REGISTERED_REGIONAL_TEMPLATES.find(
      t => t.id === 'bf.elite.engineer_wonder',
    );
    expect(sample).toBeDefined();
    expect(sample!.locationSubtypes).toEqual(['capital']);

    const graph = new WorldGraph();
    addLocation(graph, 'loc.hamlet', 'hamlet');

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph, 0);

    const cachedIds = cache.getAllEntries().map(e => e.templateId);
    expect(cachedIds).not.toContain('bf.elite.engineer_wonder');
  });

  it('leaves the array-scored path unchanged for regional templates', () => {
    // The fix is additive: scale stays authored, so generateUnifiedCandidates must still
    // skip these. If a future change made the array path accept `regional`, the cache
    // registration would become a duplicate source and this test should fail loudly.
    const registered = new Set<string>(CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS);
    const graph = new WorldGraph();
    addLocation(graph, 'loc.capital', 'capital');
    graph.addNode({
      id: 'agent.test',
      type: 'actor',
      name: 'Test Agent',
      properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
    });

    const candidates = generateUnifiedCandidates(
      graph,
      'agent.test',
      'loc.capital',
      CACHE_REGISTERED_REGIONAL_TEMPLATES,
    );
    const leaked = candidates
      .map(c => c.templateId)
      .filter((id: string) => registered.has(id));
    expect(leaked).toEqual([]);
  });
});
