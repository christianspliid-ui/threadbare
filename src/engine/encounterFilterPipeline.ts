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
import type { ReachDomain, TraitDefinitionProperties } from '../types/traits';
import { getChainProgress, isChainStageUnlocked } from './encounterChains';
import { getAnyEncounterById } from '../data/encounter-content';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import type { EligibilityFunnelCounters } from './kpi/gameplayKpi';
import { KPI_FUNNEL_MAX_TEMPLATES } from './kpi/kpiConstants';
import { BRANCHING_QUEST_SKIP_OUTGROWTH, BRANCHING_CAP_RESERVE } from './encounter/branchingConstants';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
  THREAT_FLOOR_FILTER,
  OUTGROWTH_CAP_THRESHOLD,
  OUTGROWTH_FILTER_ENABLED,
} from '../data/agent-behavior-constants';

import {
  MAX_SCORED_CANDIDATES,
  MIN_DIVERSITY_SLOTS,
  THREAT_FLOOR_FILTER,
  OUTGROWTH_CAP_THRESHOLD,
  OUTGROWTH_FILTER_ENABLED,
} from '../data/agent-behavior-constants';

/** Ordered threat tiers for index-based comparison */
const THREAT_ORDER: ThreatRating[] = ['trivial', 'easy', 'moderate', 'hard', 'deadly'];

// ─── Funnel counter helpers ──────────────────────────────────────

/** Build a set of unique templateIds from a list of cache entries. */
function templateIdSet(entries: readonly EncounterCacheEntry[]): Set<string> {
  const s = new Set<string>();
  for (const e of entries) s.add(e.templateId);
  return s;
}

/**
 * Update eligibility funnel counters from a completed pipeline run.
 * For each template that entered the pipeline, records which stage first gated it out.
 * Templates that survived all stages are counted as considered but not gated here;
 * scored/selected counts are added by encounterScoring hooks.
 */
function updateFunnelCounters(
  funnel: EligibilityFunnelCounters,
  s0: Set<string>,
  s1: Set<string>,
  s2: Set<string>,
  s3: Set<string>,
  s4: Set<string>,
  s5: Set<string>,
): void {
  for (const id of s0) {
    // Bounds check
    if (!funnel.byTemplate[id]) {
      if (Object.keys(funnel.byTemplate).length >= KPI_FUNNEL_MAX_TEMPLATES) {
        if (!funnel.truncated) {
          funnel.truncated = true;
          console.warn('[EligibilityFunnel] KPI_FUNNEL_MAX_TEMPLATES exceeded, stopping new key additions');
        }
        continue;
      }
      funnel.byTemplate[id] = { considered: 0, gatedBy: {}, scored: 0, selected: 0 };
    }
    const rec = funnel.byTemplate[id];
    rec.considered++;

    // Record first failing gate
    if (!s1.has(id)) { rec.gatedBy['awareness'] = (rec.gatedBy['awareness'] ?? 0) + 1; continue; }
    if (!s2.has(id)) { rec.gatedBy['visibility'] = (rec.gatedBy['visibility'] ?? 0) + 1; continue; }
    if (!s3.has(id)) { rec.gatedBy['prerequisites'] = (rec.gatedBy['prerequisites'] ?? 0) + 1; continue; }
    if (!s4.has(id)) { rec.gatedBy['threat'] = (rec.gatedBy['threat'] ?? 0) + 1; continue; }
    if (!s5.has(id)) { rec.gatedBy['cap'] = (rec.gatedBy['cap'] ?? 0) + 1; }
    // Survived all stages — scored/selected tracked in encounterScoring
  }
}

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
  mapCols?: number,
  mapRows?: number,
): EncounterCacheEntry[] {
  // Base awareness from hex-distance-limited per-reach visibility
  const awarenessResults = filterByAwareness(
    allEntries,
    agentId,
    agentLocationId,
    graph,
    mapCols,
    mapRows,
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

// ─── Stage 3: Prerequisites (chains + traits) ──────────────────

/**
 * Filter entries by chain prerequisites and trait requirements.
 *
 * Chain prerequisites: later stages in an encounter chain are only visible
 * to agents who have completed the previous stage.
 *
 * Trait prerequisites: templates with `requiredTraits` are only visible to
 * agents who have the required `has_trait` edges with sufficient level.
 *
 * Fail-soft: missing chainProgress → treat as empty (all first stages visible).
 * Fail-soft: missing trait edges → agent lacks trait → entry filtered out.
 */
export function filterByPrerequisites(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
): EncounterCacheEntry[] {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return [...entries];

  const progress = getChainProgress(agentNode.properties as Record<string, unknown>);

  // Cache agent trait edges for trait prerequisite checks
  const agentTraitEdges = graph.getOutgoingEdges(agentId, 'has_trait');

  const result: EncounterCacheEntry[] = [];
  for (const entry of entries) {
    // Chain gate
    if (!isChainStageUnlocked(entry.templateId, progress)) continue;

    // Trait gate — look up template for requiredTraits field
    const template = getAnyEncounterById(entry.templateId);
    if (template?.requiredTraits && template.requiredTraits.length > 0) {
      const hasTrait = template.requiredTraits.every(req => {
        return agentTraitEdges.some(e => {
          if (e.target !== req.traitId) return false;
          if (req.minLevel != null) {
            const level = (e.properties as Record<string, unknown>)?.level;
            return typeof level === 'number' && level >= req.minLevel;
          }
          return true;
        });
      });
      if (!hasTrait) continue;
    }

    // Blocked-by-traits gate — agent must NOT have any of these traits
    if (template?.blockedByTraits && template.blockedByTraits.length > 0) {
      const isBlocked = template.blockedByTraits.some(blockedId =>
        agentTraitEdges.some(e => e.target === blockedId),
      );
      if (isBlocked) continue;
    }

    // Faction join prerequisites gate — check domain capability minimums
    if (template && entry.templateId.endsWith('.join')) {
      const meta = FACTION_ENCOUNTER_META.get(entry.templateId);
      if (meta) {
        const def = FACTION_DEFINITIONS.get(meta.factionDefId);
        if (def?.joinPrerequisites) {
          let meetsAll = true;
          for (const [reach, minCap] of Object.entries(def.joinPrerequisites)) {
            try {
              const cap = computeCapability(graph, agentId, reach as ReachDomain);
              if (cap < minCap) { meetsAll = false; break; }
            } catch {
              meetsAll = false; break; // fail-soft: can't compute → doesn't meet
            }
          }
          if (!meetsAll) continue;
        }
      }
    }

    result.push(entry);
  }
  return result;
}

// ─── Stage 3a: Reputation Gate Filter ────────────────────────────

/**
 * Filter encounters that are blocked (or require unlock) by the agent's reputation traits.
 *
 * Reads `encounterGates.blocks` and `encounterGates.unlocks` from reputation trait definitions.
 * - If any held trait blocks the encounter → filtered out.
 * - If any held trait unlocks the encounter → it passes (even if another trait blocks it — unlock wins).
 *
 * Fail-soft: missing agent/trait nodes → pass through all entries unchanged.
 */
export function filterByReputationGates(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
): EncounterCacheEntry[] {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return [...entries];

  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');

  // Collect all unlocked and blocked template IDs from reputation traits
  const unlocked = new Set<string>();
  const blocked = new Set<string>();

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const props = traitNode.properties as unknown as TraitDefinitionProperties;
    if (props.subcategory !== 'reputation') continue;

    const effects = props.reputationEffects;
    if (!effects?.encounterGates) continue;

    for (const id of effects.encounterGates.unlocks) unlocked.add(id);
    for (const id of effects.encounterGates.blocks) blocked.add(id);
  }

  // Fast path: no gates defined
  if (unlocked.size === 0 && blocked.size === 0) return [...entries];

  return entries.filter(entry => {
    // Blocks take priority over unlocks (explicit exclusion wins)
    if (blocked.has(entry.templateId)) return false;
    if (unlocked.has(entry.templateId)) return true;
    return true;
  });
}

// ─── Stage 3b: Outgrowth Lock ────────────────────────────────────

/**
 * Filter out encounters whose average difficulty the agent has far surpassed.
 * When (capScaled - avgDifficulty) >= OUTGROWTH_CAP_THRESHOLD the encounter is
 * considered trivially beneath the agent and retired from their candidate pool.
 *
 * Accepts an optional enabledOverride for testing the toggle without mutating
 * the module-level constant.
 *
 * Fail-soft: missing agent node → pass through all entries unchanged.
 * Fail-soft: computeCapability throws → treat as cap=0.5 (neutral).
 */
export function filterByOutgrowth(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
  enabledOverride?: boolean,
): EncounterCacheEntry[] {
  const enabled = enabledOverride !== undefined ? enabledOverride : OUTGROWTH_FILTER_ENABLED;
  if (!enabled) return [...entries];

  // Fail-soft: missing agent node → no filtering
  if (!graph.getNode(agentId)) return [...entries];

  const result: EncounterCacheEntry[] = [];
  for (const entry of entries) {
    const avgDifficulty =
      entry.stepDifficulties.reduce((s, d) => s + d, 0) / Math.max(entry.stepCount, 1);

    let cap: number;
    try {
      cap = computeCapability(graph, agentId, entry.reachPrimary);
    } catch {
      cap = 0.5; // Fail-soft: unknown capability → neutral
    }

    const capScaled = cap * 100; // Scale 0–1 to 0–100 for comparison with OUTGROWTH_CAP_THRESHOLD
    const avgDifficultyScaled = avgDifficulty * 100; // Scale 0–1 difficulty to 0–100
    if (capScaled - avgDifficultyScaled < OUTGROWTH_CAP_THRESHOLD) {
      result.push(entry);
    } else if (BRANCHING_QUEST_SKIP_OUTGROWTH && entry.isQuestEncounter) {
      // Branching quests exempt from outgrowth (THR-452): they mature narrative threads,
      // not just test skill, so they remain accessible regardless of capability gap.
      result.push(entry);
    }
  }
  return result;
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

  // Phase 1b: preserve at least BRANCHING_CAP_RESERVE branching quest entries (THR-452).
  // Ensures branching templates survive the cap stage and reach scoring.
  const branchingAlreadyReserved = reserved.filter(e => e.isQuestEncounter).length;
  if (branchingAlreadyReserved < BRANCHING_CAP_RESERVE) {
    const needed = BRANCHING_CAP_RESERVE - branchingAlreadyReserved;
    let added = 0;
    for (const entry of entries) {
      if (!entry.isQuestEncounter) continue;
      const key = `${entry.templateId}:${entry.locationId}`;
      if (!reservedKeys.has(key)) {
        reserved.push(entry);
        reservedKeys.add(key);
        added++;
        if (added >= needed) break;
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

/** Minimal runtime view needed by the filter pipeline for funnel counters. */
interface FilterPipelineRuntime {
  eligibilityFunnel: EligibilityFunnelCounters | null;
}

/**
 * Run the 5-stage filter pipeline to reduce encounter cache entries
 * to a manageable set of scored candidates for a single agent.
 */
export function runFilterPipeline(
  allEntries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  tick: number,
  mapCols?: number,
  mapRows?: number,
  runtime?: FilterPipelineRuntime,
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

  // Capture initial template set for funnel (lazy — only when funnel is active)
  const funnel = runtime?.eligibilityFunnel ?? null;
  const s0 = funnel ? templateIdSet(allEntries) : null;

  // Stage 1: Awareness + Faction
  let current: EncounterCacheEntry[];
  try {
    current = stageAwareness(allEntries, agentId, agentLocationId, graph, mapCols, mapRows);
  } catch {
    current = [];
  }
  const afterAwareness = current.length;
  const s1 = (funnel && s0) ? templateIdSet(current) : null;

  // Stage 2: Visibility
  try {
    current = filterByVisibility(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterVisibility = current.length;
  const s2 = (funnel && s0) ? templateIdSet(current) : null;

  // Stage 3: Prerequisites + Reputation Gates + Outgrowth Lock
  try {
    current = filterByPrerequisites(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  try {
    current = filterByReputationGates(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  try {
    current = filterByOutgrowth(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterPrerequisites = current.length;
  const s3 = (funnel && s0) ? templateIdSet(current) : null;

  // Stage 4: Threat
  try {
    current = filterByThreat(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterThreat = current.length;
  const s4 = (funnel && s0) ? templateIdSet(current) : null;

  // Stage 5: Performance Cap
  try {
    current = capWithDiversity(current, agentId, graph);
  } catch {
    // Keep previous stage's output
  }
  const afterCap = current.length;
  const s5 = (funnel && s0) ? templateIdSet(current) : null;

  // Update funnel counters (only when all snapshots are available)
  if (funnel && s0 && s1 && s2 && s3 && s4 && s5) {
    updateFunnelCounters(funnel, s0, s1, s2, s3, s4, s5);
  }

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
    timestamp: tick,
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
