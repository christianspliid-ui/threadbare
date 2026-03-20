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
import type { SphereName } from '../types/index';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import { getEncountersByLocationType, getEncountersBySublocationAndLocation } from '../data/encounter-content';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  CACHE_REBUILD_THRESHOLD,
  REPUTATION_REWARD_WEIGHT,
  LOOT_REWARD_WEIGHT,
  DOMAIN_EXERCISE_WEIGHT,
} from '../data/agent-behavior-constants';

import {
  CACHE_REBUILD_THRESHOLD,
  REPUTATION_REWARD_WEIGHT,
  LOOT_REWARD_WEIGHT,
  DOMAIN_EXERCISE_WEIGHT,
} from '../data/agent-behavior-constants';

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
    stepDifficulties: tmpl.steps.map(s => s.difficulty),
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
): EncounterCacheEntry[] {
  const sublocations = getSublocations(graph, locationId);
  const entries: EncounterCacheEntry[] = [];

  if (sublocations.length > 0) {
    for (const sub of sublocations) {
      const subTypeId = (sub.properties as Record<string, unknown>).sublocationTypeId as string;
      const templates = getEncountersBySublocationAndLocation(subTypeId, locationType);
      for (const tmpl of templates) {
        entries.push(buildEntry(tmpl, locationId, sub.id, subTypeId));
      }
    }
  } else {
    const templates = getEncountersByLocationType(locationType);
    for (const tmpl of templates) {
      entries.push(buildEntry(tmpl, locationId, null, null));
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

// ─── Cache Manager ──────────────────────────────────────────────

export class EncounterCacheManager {
  /** locationId → entries for that location */
  private byLocation = new Map<string, EncounterCacheEntry[]>();

  /**
   * Build the full cache from scratch by scanning all location nodes.
   */
  buildFullCache(graph: WorldGraph): void {
    this.byLocation.clear();
    const locations = graph.getNodesByType('location');
    for (const loc of locations) {
      const locationType = getLocationType(graph, loc.id);
      if (!locationType) continue;
      const entries = buildEntriesForLocationAndSublocations(graph, loc.id, locationType);
      if (entries.length > 0) {
        this.byLocation.set(loc.id, entries);
      }
    }
  }

  /**
   * Incrementally add cache entries when a new location is created.
   */
  onLocationCreated(graph: WorldGraph, locationId: string): void {
    const locationType = getLocationType(graph, locationId);
    if (!locationType) return;
    const entries = buildEntriesForLocationAndSublocations(graph, locationId, locationType);
    if (entries.length > 0) {
      this.byLocation.set(locationId, entries);
    }
  }

  /**
   * Remove all cache entries for a destroyed location.
   */
  onLocationDestroyed(locationId: string): void {
    this.byLocation.delete(locationId);
  }

  /**
   * Re-compute cache entries when a location's type changes.
   */
  onLocationTypeChanged(graph: WorldGraph, locationId: string): void {
    this.byLocation.delete(locationId);
    this.onLocationCreated(graph, locationId);
  }

  /**
   * Incrementally rebuild parent location's cache entries when a sublocation is created.
   * The new sublocation's templates are added to (or replace) the parent's entry set.
   */
  onSublocationCreated(graph: WorldGraph, sublocationId: string, parentLocationId: string): void {
    // Rebuild the entire parent location's cache entries (includes all sublocations)
    this.byLocation.delete(parentLocationId);
    this.onLocationCreated(graph, parentLocationId);
  }

  /**
   * Remove cache entries for a destroyed sublocation from the parent location's set.
   * Filters out entries referencing the destroyed sublocation ID.
   */
  onSublocationDestroyed(sublocationId: string, parentLocationId: string): void {
    const existing = this.byLocation.get(parentLocationId);
    if (!existing) return;
    const filtered = existing.filter(e => e.sublocationId !== sublocationId);
    if (filtered.length > 0) {
      this.byLocation.set(parentLocationId, filtered);
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
}
