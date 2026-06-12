import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getFactionAwarenessEntries,
  FACTION_NETWORK_MAX_ENTRIES,
  FACTION_SECONDARY_THRESHOLD,
  FACTION_MIN_RANK_FOR_INTEL,
  FACTION_DEFAULT_RANK,
} from '../factionAwareness';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';

// ─── Helpers ────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

function addFaction(
  graph: WorldGraph,
  id: string,
  reachPreferences?: Record<string, number>,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: {
      actorType: 'faction',
      ...(reachPreferences ? { reachPreferences } : {}),
    },
  });
}

function addLocation(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { locationType: 'town' },
  });
}

function addMemberEdge(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  rank?: number,
): void {
  graph.addEdge({
    id: `edge-member-${agentId}-${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: rank !== undefined ? { role: 'member', rank } : { role: 'member' },
  });
}

function addLocatedAtEdge(
  graph: WorldGraph,
  factionId: string,
  locationId: string,
): void {
  graph.addEdge({
    id: `edge-located-${factionId}-${locationId}`,
    source: factionId,
    target: locationId,
    type: 'located_at',
    properties: { role: 'headquarters' },
  });
}

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl-default',
    locationId: 'loc-default',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'gold' as ReachDomain,
    reachSecondary: 'heart' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'explore',
    motivations: [],
    requiresPresence: false,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 3,
    successRewardEstimate: 1.0,
    stepCount: 1,
    stepDifficulties: [0.4],
    stepReaches: ['gold' as ReachDomain],
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('factionAwareness', () => {
  describe('getFactionAwarenessEntries', () => {
    // 1. Agent with no factions returns []
    it('returns [] when agent has no faction memberships', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');

      const entries = [makeEntry({ locationId: 'loc-1' })];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toEqual([]);
    });

    // 2. Low-rank agent gets few entries
    it('limits entries for low-rank agent (rank 0.1 → 2 max)', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.1);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      // Provide 5 gold-reach entries at the faction location
      const entries = Array.from({ length: 5 }, (_, i) =>
        makeEntry({ templateId: `tmpl-${i}`, locationId: 'loc-1', reachPrimary: 'gold', questPriority: i + 1 }),
      );
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      const maxExpected = Math.floor(0.1 * FACTION_NETWORK_MAX_ENTRIES);
      expect(maxExpected).toBe(2);
      expect(result).toHaveLength(2);
    });

    // 3. High-rank agent gets many entries
    it('allows many entries for high-rank agent (rank 0.9 → 18 max)', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.9);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = Array.from({ length: 25 }, (_, i) =>
        makeEntry({ templateId: `tmpl-${i}`, locationId: 'loc-1', reachPrimary: 'gold', questPriority: i }),
      );
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      const maxExpected = Math.floor(0.9 * FACTION_NETWORK_MAX_ENTRIES);
      expect(maxExpected).toBe(18);
      expect(result).toHaveLength(18);
    });

    // 4. Faction reach filtering: only returns entries matching faction's primary reach
    it('filters entries by faction primary reach', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.5);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-gold', locationId: 'loc-1', reachPrimary: 'gold' }),
        makeEntry({ templateId: 'tmpl-iron', locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'iron' }),
        makeEntry({ templateId: 'tmpl-shadow', locationId: 'loc-1', reachPrimary: 'shadow', reachSecondary: 'shadow' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      // Only gold-primary should match (iron/shadow are below secondary threshold)
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('tmpl-gold');
    });

    // 5. Secondary reach included when weight > FACTION_SECONDARY_THRESHOLD
    it('includes entries matching faction secondary reaches', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      // gold=1.0 (primary), heart=0.5 (secondary, above 0.3 threshold), rest low
      addFaction(graph, 'faction-1', { gold: 1.0, heart: 0.5, iron: 0.1, shadow: 0.1, veil: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.5);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-heart', locationId: 'loc-1', reachPrimary: 'heart', reachSecondary: 'stone' }),
        makeEntry({ templateId: 'tmpl-iron', locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'stone' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      // heart-primary entry matches because heart is a secondary reach of the faction
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('tmpl-heart');
    });

    // 6. Rank below FACTION_MIN_RANK_FOR_INTEL returns nothing
    it('returns [] when agent rank is below minimum for intel', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.01); // below 0.05 threshold
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-gold', locationId: 'loc-1', reachPrimary: 'gold' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toEqual([]);
    });

    // 7. Missing reachPreferences on faction → skip gracefully
    it('skips factions with missing reachPreferences', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-no-prefs', undefined); // no reachPreferences
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-no-prefs', 0.5);
      addLocatedAtEdge(graph, 'faction-no-prefs', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-1', locationId: 'loc-1', reachPrimary: 'gold' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toEqual([]);
    });

    // 8. Duplicates excluded via alreadyVisible set
    it('excludes entries already in alreadyVisible set', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.5);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-a', locationId: 'loc-1', reachPrimary: 'gold', questPriority: 5 }),
        makeEntry({ templateId: 'tmpl-b', locationId: 'loc-1', reachPrimary: 'gold', questPriority: 3 }),
      ];
      // Pre-populate alreadyVisible with one of them
      const visible = new Set<string>(['tmpl-a:loc-1']);

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('tmpl-b');
      // Verify the new entry was added to the set
      expect(visible.has('tmpl-b:loc-1')).toBe(true);
    });

    // 9. Entries sorted by questPriority (highest first)
    it('returns entries sorted by questPriority descending', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.5);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        makeEntry({ templateId: 'tmpl-low', locationId: 'loc-1', reachPrimary: 'gold', questPriority: 1 }),
        makeEntry({ templateId: 'tmpl-high', locationId: 'loc-1', reachPrimary: 'gold', questPriority: 10 }),
        makeEntry({ templateId: 'tmpl-mid', locationId: 'loc-1', reachPrimary: 'gold', questPriority: 5 }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result[0].templateId).toBe('tmpl-high');
      expect(result[1].templateId).toBe('tmpl-mid');
      expect(result[2].templateId).toBe('tmpl-low');
    });

    // 10. Default rank used when edge has no rank property
    it('uses default rank when edge has no rank property', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1'); // no rank → default 0.1
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = Array.from({ length: 5 }, (_, i) =>
        makeEntry({ templateId: `tmpl-${i}`, locationId: 'loc-1', reachPrimary: 'gold', questPriority: i }),
      );
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      const maxExpected = Math.floor(FACTION_DEFAULT_RANK * FACTION_NETWORK_MAX_ENTRIES);
      expect(maxExpected).toBe(2);
      expect(result).toHaveLength(2);
    });

    // 11. Entry with secondary reach matching faction primary is included
    it('includes entries whose secondary reach matches faction primary', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-1', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-1');
      addMemberEdge(graph, 'agent-1', 'faction-1', 0.5);
      addLocatedAtEdge(graph, 'faction-1', 'loc-1');

      const entries = [
        // Primary=iron but secondary=gold → should match because gold is faction primary
        makeEntry({ templateId: 'tmpl-sec', locationId: 'loc-1', reachPrimary: 'iron', reachSecondary: 'gold' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('tmpl-sec');
    });

    // 12. Multiple factions aggregate entries
    it('aggregates entries from multiple factions', () => {
      const graph = makeGraph();
      addAgent(graph, 'agent-1');
      addFaction(graph, 'faction-gold', { gold: 1.0, iron: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addFaction(graph, 'faction-iron', { iron: 1.0, gold: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1, eye: 0.1, stone: 0.1, star: 0.1 });
      addLocation(graph, 'loc-gold');
      addLocation(graph, 'loc-iron');
      addMemberEdge(graph, 'agent-1', 'faction-gold', 0.5);
      addMemberEdge(graph, 'agent-1', 'faction-iron', 0.5);
      addLocatedAtEdge(graph, 'faction-gold', 'loc-gold');
      addLocatedAtEdge(graph, 'faction-iron', 'loc-iron');

      const entries = [
        makeEntry({ templateId: 'tmpl-g1', locationId: 'loc-gold', reachPrimary: 'gold' }),
        makeEntry({ templateId: 'tmpl-i1', locationId: 'loc-iron', reachPrimary: 'iron' }),
      ];
      const visible = new Set<string>();

      const result = getFactionAwarenessEntries(entries, 'agent-1', graph, visible);
      expect(result).toHaveLength(2);
      const ids = result.map(e => e.templateId).sort();
      expect(ids).toEqual(['tmpl-g1', 'tmpl-i1']);
    });
  });
});
