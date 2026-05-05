import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  EncounterCacheManager,
  computeRewardEstimateUnified,
  computeTotalTickCostUnified,
  REPUTATION_REWARD_WEIGHT,
  LOOT_REWARD_WEIGHT,
  DOMAIN_EXERCISE_WEIGHT,
} from '../encounterCache';
import { getEncountersByLocationType } from '../../data/encounter-content';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { DIFFICULTY_TIER_MULTIPLIERS } from '../../data/agent-behavior-constants';

// ─── Helpers ────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addLocation(
  graph: WorldGraph,
  id: string,
  name: string,
  locationType: string,
): void {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { locationType },
  });
}

/** Build a minimal template for unit-testing pure functions */
function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'test.template',
    name: 'Test Template',
    intrinsicTier: 'background',
    rarityTier: 2,
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    locationSubtypes: ['town'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: 0.4,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
        successMetadata: { reputationDelta: 0.1 },
      },
      {
        reach: 'gold',
        duration: { min: 3, max: 3 },
        difficulty: 0.5,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
        successMetadata: { reputationDelta: 0.2 },
      },
    ],
    narrativeTemplates: {
      initiation: 'test',
      success: 'ok',
      failure: 'fail',
    },
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('EncounterCacheManager', () => {
  let cache: EncounterCacheManager;

  beforeEach(() => {
    cache = new EncounterCacheManager();
  });

  // 1. buildFullCache populates entries for location-template matches
  it('buildFullCache populates entries for location-template matches', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Test Town', 'town');

    cache.buildFullCache(graph);

    const entries = cache.getEntriesForLocation('loc.1');
    const expectedTemplates = getEncountersByLocationType('town');
    expect(entries.length).toBe(expectedTemplates.length);
    expect(entries.length).toBeGreaterThan(0);

    // Every entry should reference this location
    for (const entry of entries) {
      expect(entry.locationId).toBe('loc.1');
    }

    // Template IDs should match the expected set
    const entryIds = new Set(entries.map(e => e.templateId));
    for (const tmpl of expectedTemplates) {
      expect(entryIds.has(tmpl.id)).toBe(true);
    }
  });

  // 2. Empty graph produces empty cache
  it('empty graph produces empty cache', () => {
    const graph = makeGraph();
    cache.buildFullCache(graph);

    expect(cache.getAllEntries().length).toBe(0);
    expect(cache.getEntryCount()).toBe(0);
  });

  // 3. getEntriesForLocation returns correct subset
  it('getEntriesForLocation returns correct subset', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.town', 'Town', 'town');
    addLocation(graph, 'loc.ruins', 'Ruins', 'ruins');

    cache.buildFullCache(graph);

    const townEntries = cache.getEntriesForLocation('loc.town');
    const ruinsEntries = cache.getEntriesForLocation('loc.ruins');

    // Each subset only has entries for its location
    for (const e of townEntries) expect(e.locationId).toBe('loc.town');
    for (const e of ruinsEntries) expect(e.locationId).toBe('loc.ruins');

    // The combined count equals the total
    expect(cache.getEntryCount()).toBe(townEntries.length + ruinsEntries.length);

    // Unknown location returns empty
    expect(cache.getEntriesForLocation('loc.nonexistent').length).toBe(0);
  });

  // 4. onLocationCreated adds new entries
  it('onLocationCreated adds new entries', () => {
    const graph = makeGraph();
    cache.buildFullCache(graph);
    expect(cache.getEntryCount()).toBe(0);

    addLocation(graph, 'loc.new', 'New Town', 'town');
    cache.onLocationCreated(graph, 'loc.new');

    const entries = cache.getEntriesForLocation('loc.new');
    const expected = getEncountersByLocationType('town');
    expect(entries.length).toBe(expected.length);
    expect(entries.length).toBeGreaterThan(0);
  });

  // 5. onLocationDestroyed removes entries
  it('onLocationDestroyed removes entries', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Town', 'town');
    cache.buildFullCache(graph);
    expect(cache.getEntryCount()).toBeGreaterThan(0);

    cache.onLocationDestroyed('loc.1');
    expect(cache.getEntriesForLocation('loc.1').length).toBe(0);
    expect(cache.getEntryCount()).toBe(0);
  });

  // 6. onLocationTypeChanged rebuilds entries for that location
  it('onLocationTypeChanged rebuilds entries for that location', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Settlement', 'town');
    cache.buildFullCache(graph);

    const townCount = cache.getEntriesForLocation('loc.1').length;

    // Mutate the location type on the graph
    graph.updateNode('loc.1', { properties: { locationType: 'ruins' } });
    cache.onLocationTypeChanged(graph, 'loc.1');

    const ruinsCount = cache.getEntriesForLocation('loc.1').length;
    const expectedRuins = getEncountersByLocationType('ruins');
    expect(ruinsCount).toBe(expectedRuins.length);

    // Town and ruins have different template sets
    expect(ruinsCount).not.toBe(townCount);
  });

  // Extra: location without locationType property is skipped
  it('skips locations without locationType property', () => {
    const graph = makeGraph();
    graph.addNode({ id: 'loc.bare', type: 'location', name: 'Bare', properties: {} });
    cache.buildFullCache(graph);
    expect(cache.getEntryCount()).toBe(0);
  });

  // Extra: multiple locations accumulate entries correctly
  it('accumulates entries across multiple locations', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.a', 'Town A', 'town');
    addLocation(graph, 'loc.b', 'Town B', 'town');
    cache.buildFullCache(graph);

    const townTemplateCount = getEncountersByLocationType('town').length;
    expect(cache.getEntryCount()).toBe(townTemplateCount * 2);
  });

  // Extra: onLocationCreated is a no-op for unknown location type
  it('onLocationCreated is no-op when location type has no templates', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.wild', 'Wilderness', 'wilderness');
    cache.buildFullCache(graph);

    // wilderness may or may not have templates — test the path
    const before = cache.getEntryCount();
    addLocation(graph, 'loc.wild2', 'Wilderness 2', 'wilderness');
    cache.onLocationCreated(graph, 'loc.wild2');
    const wildEntries = getEncountersByLocationType('wilderness');
    expect(cache.getEntriesForLocation('loc.wild2').length).toBe(wildEntries.length);
  });
});

describe('computeRewardEstimate', () => {
  // 7. computeRewardEstimateUnified calculates correctly
  it('sums reputationDelta with weight + loot flag + base domain exercise', () => {
    const tmpl = makeTemplate({
      steps: [
        {
          reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.4,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
          successMetadata: {
            reputationDelta: 0.1,
            rewardPool: { category: 'weapon', minTier: 1, maxTier: 3, quantity: 1 },
          },
        },
        {
          reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
          successMetadata: { reputationDelta: 0.2 },
        },
      ],
    });

    const reward = computeRewardEstimateUnified(tmpl);
    const expected =
      (0.1 + 0.2) * REPUTATION_REWARD_WEIGHT +
      LOOT_REWARD_WEIGHT +   // has at least one rewardPool
      DOMAIN_EXERCISE_WEIGHT;
    expect(reward).toBeCloseTo(expected);
  });

  // 8. computeRewardEstimateUnified defaults 0 for missing reputationDelta
  it('defaults 0 for missing reputationDelta', () => {
    const tmpl = makeTemplate({
      steps: [
        {
          reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.4,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
          // no successMetadata → reputationDelta defaults to 0
        },
      ],
    });

    const reward = computeRewardEstimateUnified(tmpl);
    // 0 * weight + 0 (no loot) + base
    expect(reward).toBeCloseTo(DOMAIN_EXERCISE_WEIGHT);
  });
});

describe('computeTotalTickCost', () => {
  // 9. computeTotalTickCostUnified sums step durations
  it('sums step durations', () => {
    const tmpl = makeTemplate({
      steps: [
        {
          reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.4,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
        },
        {
          reach: 'gold', duration: { min: 3, max: 3 }, difficulty: 0.5,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
        },
      ],
    });

    expect(computeTotalTickCostUnified(tmpl)).toBe(5);
  });

  // 10. computeTotalTickCostUnified defaults 1 for missing duration
  it('defaults 1 for missing duration', () => {
    const tmpl = makeTemplate({
      steps: [
        {
          reach: 'iron', difficulty: 0.4,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
          // duration omitted → defaults to 1
        },
        {
          reach: 'gold', duration: { min: 4, max: 4 }, difficulty: 0.5,
          onSuccess: [], onFailure: [], failBehavior: 'continue_weakened',
        },
      ],
    });

    expect(computeTotalTickCostUnified(tmpl)).toBe(5); // 1 + 4
  });
});

describe('EncounterCacheEntry field correctness', () => {
  // 11. requiresPresence is true when remoteAttempt is falsy
  it('requiresPresence is true when remoteAttempt is falsy', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Town', 'town');

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph);

    const entries = cache.getEntriesForLocation('loc.1');
    // All current templates have remoteAttempt undefined → requiresPresence = true
    for (const entry of entries) {
      expect(entry.requiresPresence).toBe(true);
    }
  });

  // 12. stepDifficulties and stepReaches arrays match template steps
  it('stepDifficulties and stepReaches arrays match template steps', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Town', 'town');

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph);

    const entries = cache.getEntriesForLocation('loc.1');
    const templates = getEncountersByLocationType('town');
    const templateMap = new Map(templates.map(t => [t.id, t]));

    for (const entry of entries) {
      const tmpl = templateMap.get(entry.templateId)!;
      expect(tmpl).toBeDefined();
      expect(entry.stepCount).toBe(tmpl.steps.length);
      // C.1: Difficulty tier scaling — at tick 0 (default), tier is 'early'
      // UAT difficulty is 0-1; cache stores 0-100 scale (multiply by 100 for scoring compatibility)
      expect(entry.stepDifficulties).toEqual(tmpl.steps.map(s => Math.round(s.difficulty * 100 * DIFFICULTY_TIER_MULTIPLIERS.early)));
      expect(entry.stepReaches).toEqual(tmpl.steps.map(s => s.reach));
    }
  });

  // Extra: questPriority defaults to 1.0
  it('questPriority defaults to 1.0 for templates without questPriority', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Town', 'town');

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph);

    const entries = cache.getEntriesForLocation('loc.1');
    for (const entry of entries) {
      expect(entry.questPriority).toBe(1.0);
    }
  });

  // Extra: remotePenalty is 0 for all entries (Phase 2 placeholder)
  it('remotePenalty is 0 for all entries', () => {
    const graph = makeGraph();
    addLocation(graph, 'loc.1', 'Town', 'town');

    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph);

    for (const entry of cache.getEntriesForLocation('loc.1')) {
      expect(entry.remotePenalty).toBe(0);
    }
  });
});
