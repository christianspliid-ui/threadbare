/**
 * Encounter Cache — pre-computed scoring data for location-template pairs.
 *
 * Built once at game start via `buildFullCache`, then updated incrementally
 * through event callbacks (`onLocationCreated`, `onLocationDestroyed`,
 * `onLocationTypeChanged`).
 *
 * ─── Tracing ──────────────────────────────────────────────────
 * This module does not emit tick-loop traces (it is a lookup structure).
 * Consumers read entries via `getAllEntries` / `getEntriesForLocation`.
 *
 * ─── Fail-soft ─────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Location node missing properties| Skip — no entries generated           |
 * | Unknown location type           | Skip — getEncountersByLocationType([])|
 * | Template missing step fields    | Default duration=1, reputationDelta=0 |
 *
 * ─── PRNG ──────────────────────────────────────────────────────
 * None — this is a deterministic lookup cache, no randomness involved.
 */

import type { ReachDomain } from '../types/traits';
import type { ThreatRating, EncounterType, EncounterTemplate } from '../types/encounter';
import type { ValuePair } from '../types/agent';
import type { HexTile, SphereName } from '../types/index';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import { getEncountersByLocationType, getEncountersBySublocationAndLocation } from '../data/encounter-content';
import { hexKey } from '../lib/hexKey';
import { hexDistance } from '../lib/hexMath';
import { DANGER_DIFFICULTY_SCALE } from './worldgen/constants';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  CACHE_REBUILD_THRESHOLD,
  REPUTATION_REWARD_WEIGHT,
  LOOT_REWARD_WEIGHT,
  DOMAIN_EXERCISE_WEIGHT,
  EARLY_GAME_THRESHOLD,
  MID_GAME_THRESHOLD,
  DIFFICULTY_TIER_MULTIPLIERS,
} from '../data/agent-behavior-constants';

import {
  REPUTATION_REWARD_WEIGHT,
  LOOT_REWARD_WEIGHT,
  DOMAIN_EXERCISE_WEIGHT,
  EARLY_GAME_THRESHOLD,
  MID_GAME_THRESHOLD,
  DIFFICULTY_TIER_MULTIPLIERS,
} from '../data/agent-behavior-constants';

// ─── Difficulty Tier ────────────────────────────────────────────

/**
 * Determine the current difficulty tier based on tick count.
 * Used to scale encounter difficulties over the course of a game.
 * Fail-soft: invalid tick → 'early'.
 */
export function selectDifficultyTier(tick: number): string {
  if (!Number.isFinite(tick) || tick < EARLY_GAME_THRESHOLD) return 'early';
  if (tick < MID_GAME_THRESHOLD) return 'mid';
  return 'late';
}

/**
 * Get the difficulty multiplier for the current tier.
 * Fail-soft: unknown tier → 1.0.
 */
export function getDifficultyMultiplier(tier: string): number {
  return DIFFICULTY_TIER_MULTIPLIERS[tier] ?? 1.0;
}

// ─── Cache Entry ────────────────────────────────────────────────

export interface EncounterCacheEntry {
  templateId: string;
  locationId: string;
  /** The specific sublocation instance ID, or null for location-level encounters. */
  sublocationId: string | null;
  /** The sublocation type ID (e.g. 'sublocation-type.market-district'), or null. */
  sublocationTypeId: string | null;
  reachPrimary: ReachDomain;
  reachSecondary: ReachDomain;
  threatRating: ThreatRating;
  encounterType: EncounterType;
  motivations: ValuePair[];
  visibleTo?: string[];
  requiresPresence: boolean;
  remotePenalty: number;
  remoteMaxRange?: number;
  sphereAffinity?: SphereName;
  questPriority: number;
  /** Target agent ID for social encounters (agent-to-agent). Undefined for location encounters. */
  targetAgentId?: string;
  // Pre-computed for scoring:
  totalTickCost: number;
  successRewardEstimate: number;
  stepCount: number;
  stepDifficulties: number[];
  stepReaches: ReachDomain[];
}

// ─── Pure Computation Helpers ───────────────────────────────────

/**
 * Estimate total reward value for an encounter template.
 *
 * Formula:
 *   Σ(step.onSuccess.reputationDelta ?? 0) * REPUTATION_REWARD_WEIGHT
 *   + (hasAnyRewardPool ? LOOT_REWARD_WEIGHT : 0)
 *   + DOMAIN_EXERCISE_WEIGHT
 */
export function computeRewardEstimate(template: EncounterTemplate): number {
  let reputationSum = 0;
  let hasRewardPool = false;

  for (const step of template.steps) {
    reputationSum += step.onSuccess.reputationDelta ?? 0;
    if (step.onSuccess.rewardPool) {
      hasRewardPool = true;
    }
  }

  return (
    reputationSum * REPUTATION_REWARD_WEIGHT +
    (hasRewardPool ? LOOT_REWARD_WEIGHT : 0) +
    DOMAIN_EXERCISE_WEIGHT
  );
}

/**
 * Total tick cost of an encounter template.
 * Each step's duration defaults to 1 if omitted.
 */
export function computeTotalTickCost(template: EncounterTemplate): number {
  let total = 0;
  for (const step of template.steps) {
    total += step.duration ?? 1;
  }
  return total;
}

// ─── Internal helpers ───────────────────────────────────────────

/**
 * Find sublocation nodes under a location (children linked via 'contains' edges
 * that have a sublocationTypeId property).
 */
function getSublocations(graph: WorldGraph, locationId: string): GraphNode[] {
  const containsEdges = graph.getOutgoingEdges(locationId, 'contains');
  const subs: GraphNode[] = [];
  for (const edge of containsEdges) {
    const child = graph.getNode(edge.target);
    if (child?.type === 'location') {
      const props = child.properties as Record<string, unknown>;
      if (props.parentLocationId === locationId && props.sublocationTypeId) {
        subs.push(child);
      }
    }
  }
  return subs;
}

/**
 * Build a single cache entry from a template, with sublocation context.
 */
function buildEntry(
  tmpl: EncounterTemplate,
  locationId: string,
  sublocationId: string | null,
  sublocationTypeId: string | null,
  difficultyMultiplier: number = 1.0,
): EncounterCacheEntry {
  return {
    templateId: tmpl.id,
    locationId,
    sublocationId,
    sublocationTypeId,
    reachPrimary: tmpl.reachPrimary,
    reachSecondary: tmpl.reachSecondary,
    threatRating: tmpl.threatRating,
    encounterType: tmpl.encounterType,
    motivations: [...tmpl.motivations],
    visibleTo: tmpl.visibleTo ? [...tmpl.visibleTo] : undefined,
    requiresPresence: !tmpl.remoteAttempt,
    remotePenalty: 0, // Phase 2 concern
    remoteMaxRange: undefined,
    sphereAffinity: tmpl.sphereAffinity,
    questPriority: tmpl.questPriority ?? 1.0,
    totalTickCost: computeTotalTickCost(tmpl),
    successRewardEstimate: computeRewardEstimate(tmpl),
    stepCount: tmpl.steps.length,
    stepDifficulties: tmpl.steps.map(s => Math.round(s.difficulty * difficultyMultiplier)),
    stepReaches: tmpl.steps.map(s => s.reach),
  };
}

/**
 * Build cache entries for a location and all its sublocations.
 * If sublocations exist: creates entries per sublocation using sublocation-aware template lookup.
 * If no sublocations: falls back to location-level template lookup (sublocationId: null).
 */
function buildEntriesForLocationAndSublocations(
  graph: WorldGraph,
  locationId: string,
  locationType: string,
  difficultyMultiplier: number = 1.0,
): EncounterCacheEntry[] {
  const sublocations = getSublocations(graph, locationId);
  const entries: EncounterCacheEntry[] = [];

  if (sublocations.length > 0) {
    for (const sub of sublocations) {
      const subTypeId = (sub.properties as Record<string, unknown>).sublocationTypeId as string;
      const templates = getEncountersBySublocationAndLocation(subTypeId, locationType);
      for (const tmpl of templates) {
        entries.push(buildEntry(tmpl, locationId, sub.id, subTypeId, difficultyMultiplier));
      }
    }
  } else {
    const templates = getEncountersByLocationType(locationType);
    for (const tmpl of templates) {
      entries.push(buildEntry(tmpl, locationId, null, null, difficultyMultiplier));
    }
  }

  return entries;
}

function getLocationType(
  graph: WorldGraph,
  locationId: string,
): string | undefined {
  const node = graph.getNode(locationId);
  if (!node) return undefined;
  const props = node.properties as Record<string, unknown>;
  // Check locationType first, fall back to locationSubtype (worldSeed uses both)
  const locType = props.locationType as string | undefined;
  const locSubtype = props.locationSubtype as string | undefined;
  // Skip generic 'location' — it doesn't match any encounter template
  if (locType && locType !== 'location') return locType;
  return locSubtype ?? undefined;
}

// ─── Danger Map ─────────────────────────────────────────────────

/**
 * Build a hex-key → dangerLevel lookup from tiles.
 * Used by the encounter cache to scale difficulty at dangerous locations.
 */
export function buildDangerMap(tiles: HexTile[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tiles) {
    const dl = t.dangerLevel ?? 0;
    if (dl > 0) {
      map.set(hexKey(t.coord.col, t.coord.row), dl);
    }
  }
  return map;
}

/**
 * Resolve a location node's dangerLevel from the danger map.
 * Falls back to 0 if location has no hex coords or hex has no danger.
 */
function locationDangerLevel(graph: WorldGraph, locationId: string, dangerMap?: Map<string, number>): number {
  if (!dangerMap || dangerMap.size === 0) return 0;
  const loc = graph.getNode(locationId);
  if (!loc) return 0;
  const props = loc.properties as Record<string, unknown>;
  const col = props.hexCol as number | undefined;
  const row = props.hexRow as number | undefined;
  if (col == null || row == null) return 0;
  return dangerMap.get(hexKey(col, row)) ?? 0;
}

// ─── Cache Manager ──────────────────────────────────────────────

export class EncounterCacheManager {
  /** locationId → entries for that location */
  private byLocation = new Map<string, EncounterCacheEntry[]>();

  /** hexKey → entries at that hex (spatial index for awareness filtering) */
  private byHex = new Map<string, EncounterCacheEntry[]>();

  /** hexKey → {col, row} for iteration during spatial queries */
  private hexCoords = new Map<string, { col: number; row: number }>();

  /** Current difficulty tier — updated on each full cache rebuild */
  private currentTier: string = 'early';

  /** Cached danger map for incremental updates */
  private dangerMap?: Map<string, number>;

  /**
   * Build the full cache from scratch by scanning all location nodes.
   * Applies difficulty tier multiplier based on the current tick,
   * composed with per-hex dangerLevel when provided.
   */
  buildFullCache(graph: WorldGraph, tick: number = 0, dangerMap?: Map<string, number>): void {
    this.byLocation.clear();
    this.byHex.clear();
    this.hexCoords.clear();
    this.dangerMap = dangerMap;
    const newTier = selectDifficultyTier(tick);
    const baseMult = getDifficultyMultiplier(newTier);
    this.currentTier = newTier;

    const locations = graph.getNodesByType('location');
    for (const loc of locations) {
      const locationType = getLocationType(graph, loc.id);
      if (!locationType) continue;
      const danger = locationDangerLevel(graph, loc.id, dangerMap);
      const multiplier = baseMult * (1 + danger * DANGER_DIFFICULTY_SCALE);
      const entries = buildEntriesForLocationAndSublocations(graph, loc.id, locationType, multiplier);
      if (entries.length > 0) {
        this.byLocation.set(loc.id, entries);
        this.indexByHex(graph, loc.id, entries);
      }
    }
  }

  /** Index entries by their location's hex coordinates for spatial queries. */
  private indexByHex(graph: WorldGraph, locationId: string, entries: EncounterCacheEntry[]): void {
    const loc = graph.getNode(locationId);
    if (!loc) return;
    const col = loc.properties.hexCol as number | undefined;
    const row = loc.properties.hexRow as number | undefined;
    if (col == null || row == null) return;
    const key = hexKey(col, row);
    const existing = this.byHex.get(key);
    if (existing) {
      existing.push(...entries);
    } else {
      this.byHex.set(key, [...entries]);
    }
    if (!this.hexCoords.has(key)) {
      this.hexCoords.set(key, { col, row });
    }
  }

  /** Remove entries for a location from the hex index. */
  private unindexByHex(graph: WorldGraph, locationId: string): void {
    const loc = graph.getNode(locationId);
    if (!loc) return;
    const col = loc.properties.hexCol as number | undefined;
    const row = loc.properties.hexRow as number | undefined;
    if (col == null || row == null) return;
    const key = hexKey(col, row);
    const existing = this.byHex.get(key);
    if (existing) {
      const filtered = existing.filter(e => e.locationId !== locationId);
      if (filtered.length > 0) {
        this.byHex.set(key, filtered);
      } else {
        this.byHex.delete(key);
        this.hexCoords.delete(key);
      }
    }
  }

  /** Current difficulty tier string ('early' | 'mid' | 'late'). */
  getCurrentTier(): string {
    return this.currentTier;
  }

  /**
   * Incrementally add cache entries when a new location is created.
   * Applies cached dangerMap if available.
   */
  onLocationCreated(graph: WorldGraph, locationId: string): void {
    const locationType = getLocationType(graph, locationId);
    if (!locationType) return;
    const danger = locationDangerLevel(graph, locationId, this.dangerMap);
    const multiplier = 1.0 * (1 + danger * DANGER_DIFFICULTY_SCALE);
    const entries = buildEntriesForLocationAndSublocations(graph, locationId, locationType, multiplier);
    if (entries.length > 0) {
      this.byLocation.set(locationId, entries);
      this.indexByHex(graph, locationId, entries);
    }
  }

  /**
   * Remove all cache entries for a destroyed location.
   */
  onLocationDestroyed(locationId: string, graph?: WorldGraph): void {
    if (graph) this.unindexByHex(graph, locationId);
    this.byLocation.delete(locationId);
  }

  /**
   * Re-compute cache entries when a location's type changes.
   */
  onLocationTypeChanged(graph: WorldGraph, locationId: string): void {
    this.unindexByHex(graph, locationId);
    this.byLocation.delete(locationId);
    this.onLocationCreated(graph, locationId);
  }

  /**
   * Incrementally rebuild parent location's cache entries when a sublocation is created.
   * The new sublocation's templates are added to (or replace) the parent's entry set.
   */
  onSublocationCreated(graph: WorldGraph, sublocationId: string, parentLocationId: string): void {
    // Rebuild the entire parent location's cache entries (includes all sublocations)
    this.unindexByHex(graph, parentLocationId);
    this.byLocation.delete(parentLocationId);
    this.onLocationCreated(graph, parentLocationId);
  }

  /**
   * Remove cache entries for a destroyed sublocation from the parent location's set.
   * Filters out entries referencing the destroyed sublocation ID.
   */
  onSublocationDestroyed(sublocationId: string, parentLocationId: string, graph?: WorldGraph): void {
    const existing = this.byLocation.get(parentLocationId);
    if (!existing) return;
    // Remove from hex index first (uses old entries)
    if (graph) this.unindexByHex(graph, parentLocationId);
    const filtered = existing.filter(e => e.sublocationId !== sublocationId);
    if (filtered.length > 0) {
      this.byLocation.set(parentLocationId, filtered);
      // Re-index with filtered entries
      if (graph) this.indexByHex(graph, parentLocationId, filtered);
    } else {
      this.byLocation.delete(parentLocationId);
    }
  }

  /**
   * Return all cached entries (flat array, read-only).
   */
  getAllEntries(): readonly EncounterCacheEntry[] {
    const all: EncounterCacheEntry[] = [];
    for (const entries of this.byLocation.values()) {
      all.push(...entries);
    }
    return all;
  }

  /**
   * Return cached entries within `maxRange` hex distance of the given hex.
   * Uses the spatial index for O(nearby hexes) instead of O(all entries).
   * Falls back to getAllEntries() if the hex index is empty.
   */
  getEntriesNearHex(col: number, row: number, maxRange: number): readonly EncounterCacheEntry[] {
    if (this.byHex.size === 0) return this.getAllEntries();
    const result: EncounterCacheEntry[] = [];
    for (const [key, coord] of this.hexCoords) {
      if (hexDistance({ col, row }, coord) <= maxRange) {
        const entries = this.byHex.get(key);
        if (entries) result.push(...entries);
      }
    }
    return result;
  }

  /**
   * Return cached entries for a specific location (empty array if none).
   */
  getEntriesForLocation(locationId: string): readonly EncounterCacheEntry[] {
    return this.byLocation.get(locationId) ?? [];
  }

  /**
   * Total number of cached entries across all locations.
   */
  getEntryCount(): number {
    let count = 0;
    for (const entries of this.byLocation.values()) {
      count += entries.length;
    }
    return count;
  }

  /**
   * Return location IDs that have at least `minEntries` cached encounter templates.
   * Used by born-later spawn logic to prefer content-rich locations.
   */
  getLocationsWithMinEntries(minEntries: number): string[] {
    const result: string[] = [];
    for (const [locationId, entries] of this.byLocation) {
      if (entries.length >= minEntries) {
        result.push(locationId);
      }
    }
    return result;
  }
}
