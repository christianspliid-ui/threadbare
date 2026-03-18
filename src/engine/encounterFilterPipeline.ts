/**
 * Encounter Filter Pipeline — 5-stage reduction from ~1000 cache entries
 * to ~40 scored candidates per agent.
 *
 * Stages:
 *   1. Awareness + Faction — distance-limited visibility + faction network intel
 *   2. Visibility — visibleTo filter (faction/agent/archetype/culture gating)
 *   3. Prerequisites — placeholder for future trait prerequisites on templates
 *   4. Threat — courage/capability vs threat-rating tolerance check
 *   5. Performance Cap — cap at MAX_SCORED_CANDIDATES with diversity floor
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                   | Default | Purpose                                       |
 * |------------------------|---------|-----------------------------------------------|
 * | MAX_SCORED_CANDIDATES  | 40      | Hard cap on candidates forwarded to scoring    |
 * | MIN_DIVERSITY_SLOTS    | 1       | Minimum entries preserved per encounter type   |
 * | THREAT_FLOOR_FILTER    | true    | Whether threat stage is active                 |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Emits FilterPipelineTrace with counts after each stage.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Missing agent node              | Return empty candidates + trace zeros |
 * | Any individual stage throws     | Catch, skip stage, use previous input |
 * | Empty input                     | Fast-path return empty                |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — deterministic pipeline, no randomness.
 */

import type { EncounterCacheEntry } from './encounterCache';
import type { WorldGraph } from './graph';
import type { DistanceMatrix } from './distanceMatrix';
import type { FilterPipelineTrace } from '../types/trace';
import type { ThreatRating } from '../types/encounter';
import { filterByAwareness } from './encounterAwareness';
import { getFactionAwarenessEntries } from './factionAwareness';
import { isEncounterVisibleToAgent } from './questVisibility';
import { computeCapability } from './domainCapability';
import {
  THREAT_CAPABILITY_BANDS,
  THREAT_COURAGE_THRESHOLD,
  THREAT_PRUDENCE_THRESHOLD,
} from '../types/encounter';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
  THREAT_FLOOR_FILTER,
} from '../data/agent-behavior-constants';

import {
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
  THREAT_FLOOR_FILTER,
} from '../data/agent-behavior-constants';

/** Ordered threat tiers for index-based comparison */
const THREAT_ORDER: ThreatRating[] = ['trivial', 'easy', 'moderate', 'hard', 'deadly'];

// ─── Types ──────────────────────────────────────────────────────

export interface FilterResult {
  candidates: EncounterCacheEntry[];
  trace: FilterPipelineTrace;
}

// ─── Stage 1: Awareness + Faction ───────────────────────────────

function stageAwareness(
  allEntries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
): EncounterCacheEntry[] {
  // Base awareness from distance-limited per-reach visibility
  const awarenessResults = filterByAwareness(
    allEntries,
    agentId,
    agentLocationId,
    graph,
    distanceMatrix,
  );

  // Build dedup set from awareness results
  const seen = new Set<string>();
  for (const entry of awarenessResults) {
    seen.add(`${entry.templateId}:${entry.locationId}`);
  }

  // Add faction network entries (deduped internally, but we also dedup here)
  const factionEntries = getFactionAwarenessEntries(allEntries, agentId, graph, seen);

  // Combine
  return [...awarenessResults, ...factionEntries];
}

// ─── Stage 2: Visibility ────────────────────────────────────────

/**
 * Filter entries by visibleTo restrictions.
 * Entries with no visibleTo or empty visibleTo pass through.
 */
export function filterByVisibility(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
): EncounterCacheEntry[] {
  const result: EncounterCacheEntry[] = [];
  for (const entry of entries) {
    if (!entry.visibleTo || entry.visibleTo.length === 0) {
      result.push(entry);
      continue;
    }
    if (isEncounterVisibleToAgent(graph, agentId, entry.visibleTo)) {
      result.push(entry);
    }
  }
  return result;
}

// ─── Stage 3: Prerequisites (placeholder) ───────────────────────

/**
 * Placeholder — prerequisite traits on encounter templates are not yet
 * implemented. This stage exists in the pipeline for completeness and
 * will be wired up in a future phase.
 */
export function filterByPrerequisites(
  entries: readonly EncounterCacheEntry[],
  _agentId: string,
  _graph: WorldGraph,
): EncounterCacheEntry[] {
  return [...entries];
}

// ─── Stage 4: Threat tolerance ──────────────────────────────────

/**
 * Check whether an encounter's threat rating is within an agent's
 * capability-based tolerance range, modulated by courage/prudence.
 */
function isWithinThreatTolerance(
  capability: number,
  threat: ThreatRating,
  courageValue: number,
): boolean {
  const tierIndex = THREAT_ORDER.indexOf(threat);
  if (tierIndex < 0) return false;

  let minTier = Math.max(0, tierIndex - 1);
  let maxTier = Math.min(THREAT_ORDER.length - 1, tierIndex + 1);

  // Courageous agents stretch upward
  if (courageValue > THREAT_COURAGE_THRESHOLD) {
    maxTier = Math.min(THREAT_ORDER.length - 1, maxTier + 1);
  }

  // Prudent agents restrict upward
  if (courageValue < THREAT_PRUDENCE_THRESHOLD) {
    minTier = Math.max(0, minTier + 1);
  }

  // Check if capability falls within any band in the range
  for (let i = minTier; i <= maxTier; i++) {
    const tierName = THREAT_ORDER[i];
    const [lo, hi] = THREAT_CAPABILITY_BANDS[tierName];
    if (capability >= lo && capability <= hi) {
      return true;
    }
  }

  return false;
}

/**
 * Filter entries by threat tolerance — agents only pursue encounters
 * whose threat rating aligns with their capability and courage.
 */
export function filterByThreat(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
): EncounterCacheEntry[] {
  if (!THREAT_FLOOR_FILTER) return [...entries];

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return [];

  const axiologicalProfile = agentNode.properties.axiologicalProfile as
    | Record<string, number>
    | undefined;
  const courageValue = axiologicalProfile?.courage_prudence ?? 0;

  const result: EncounterCacheEntry[] = [];
  for (const entry of entries) {
    const capabilityNorm = computeCapability(graph, agentId, entry.reachPrimary);
    const capability = capabilityNorm * 100;

    if (isWithinThreatTolerance(capability, entry.threatRating, courageValue)) {
      result.push(entry);
    }
  }

  return result;
}

// ─── Stage 5: Performance Cap with Diversity ────────────────────

/**
 * Cap entries at MAX_SCORED_CANDIDATES while preserving at least
 * MIN_DIVERSITY_SLOTS per encounter type.
 */
export function capWithDiversity(
  entries: readonly EncounterCacheEntry[],
  _agentId: string,
  _graph: WorldGraph,
): EncounterCacheEntry[] {
  if (entries.length <= MAX_SCORED_CANDIDATES) {
    return [...entries];
  }

  // Group entries by encounterType
  const byType = new Map<string, EncounterCacheEntry[]>();
  for (const entry of entries) {
    const group = byType.get(entry.encounterType) ?? [];
    group.push(entry);
    byType.set(entry.encounterType, group);
  }

  // Phase 1: ensure MIN_DIVERSITY_SLOTS per type
  const reserved: EncounterCacheEntry[] = [];
  const reservedKeys = new Set<string>();

  for (const [, group] of byType) {
    const toTake = Math.min(MIN_DIVERSITY_SLOTS, group.length);
    for (let i = 0; i < toTake; i++) {
      const key = `${group[i].templateId}:${group[i].locationId}`;
      if (!reservedKeys.has(key)) {
        reserved.push(group[i]);
        reservedKeys.add(key);
      }
    }
  }

  // Phase 2: fill remaining slots from all entries
  const remaining = MAX_SCORED_CANDIDATES - reserved.length;
  if (remaining <= 0) {
    return reserved.slice(0, MAX_SCORED_CANDIDATES);
  }

  const fill: EncounterCacheEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.templateId}:${entry.locationId}`;
    if (!reservedKeys.has(key)) {
      fill.push(entry);
      if (fill.length >= remaining) break;
    }
  }

  return [...reserved, ...fill];
}

// ─── Main Pipeline ──────────────────────────────────────────────

/**
 * Run the 5-stage filter pipeline to reduce encounter cache entries
 * to a manageable set of scored candidates for a single agent.
 */
export function runFilterPipeline(
  allEntries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
  tick: number,
): FilterResult {
  // Fast path: empty input
  if (allEntries.length === 0) {
    return {
      candidates: [],
      trace: buildTrace(agentId, tick, allEntries.length, 0, 0, 0, 0, 0),
    };
  }

  // Fail-soft: agent must exist
  if (!graph.getNode(agentId)) {
    return {
      candidates: [],
      trace: buildTrace(agentId, tick, allEntries.length, 0, 0, 0, 0, 0),
    };
  }

  // Stage 1: Awareness + Faction
  let current: EncounterCacheEntry[];
  try {
    current = stageAwareness(allEntries, agentId, agentLocationId, graph, distanceMatrix);
  } catch {
    current = [];
  }
  const afterAwareness = current.length;

  // Stage 2: Visibility
  try {
    current = filterByVisibility(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterVisibility = current.length;

  // Stage 3: Prerequisites
  try {
    current = filterByPrerequisites(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterPrerequisites = current.length;

  // Stage 4: Threat
  try {
    current = filterByThreat(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterThreat = current.length;

  // Stage 5: Performance Cap
  try {
    current = capWithDiversity(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterCap = current.length;

  return {
    candidates: current,
    trace: buildTrace(
      agentId,
      tick,
      allEntries.length,
      afterAwareness,
      afterVisibility,
      afterPrerequisites,
      afterThreat,
      afterCap,
    ),
  };
}

// ─── Trace Builder ──────────────────────────────────────────────

function buildTrace(
  agentId: string,
  tick: number,
  cacheSize: number,
  afterAwareness: number,
  afterVisibility: number,
  afterPrerequisites: number,
  afterThreat: number,
  afterCap: number,
): FilterPipelineTrace {
  return {
    id: 0,
    tick,
    timestamp: Date.now(),
    category: 'encounter_filter',
    agentId,
    cacheSize,
    afterAwareness,
    afterVisibility,
    afterPrerequisites,
    afterThreat,
    afterCap,
    summary: `Agent ${agentId}: ${cacheSize} → ${afterCap} candidates`,
  };
}
