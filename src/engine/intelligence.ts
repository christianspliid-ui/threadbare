/**
 * Structured Intelligence — query and consumption helpers for intelligence records.
 *
 * Intelligence records are queryable knowledge objects held by agents, gained
 * through encounter aftermath effects. They persist on GameState (not on graph
 * nodes) and are queryable by future encounters to gate content or adjust
 * difficulty.
 *
 * v2 (THR-113): consumption loop. Three sites reference records:
 *   - scoring boost (encounterScoring.ts) — actionable intel boosts candidate score
 *   - prose enrichment (proseEnrichment.ts) — {intel:*}, {?knows_*} placeholders
 *   - resolution-match observation (GameView.tsx) — passive trace when a resolved
 *     encounter's target matches an existing record
 * All three emit `intelligence_referenced` traces with a `referencedBy` discriminator.
 * Consumption never removes records; decay is deferred.
 */

import type { GameState } from '../types/gameState';
import type { UnifiedAction } from '../types/unifiedAction';
import type {
  IntelligenceRecord,
  IntelligenceCategory,
  EncounterAftermathReactionEffect,
} from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────

/** Reliability ≥ this → descriptor 'reliable'. @range 0.6–0.9 */
export const RELIABILITY_THRESHOLD_RELIABLE = 0.7;

/** Reliability ≥ this (and below reliable) → 'uncertain'. Below → 'dubious'. @range 0.3–0.5 */
export const RELIABILITY_THRESHOLD_UNCERTAIN = 0.4;

/** Whether resolution-match considers targetRegion (not just targetEntityId). */
export const INTEL_RESOLUTION_MATCH_REGIONS = true;

/** Single source of truth for category iteration — prevents drift between
 * placeholder enumeration and the IntelligenceCategory union. */
export const INTEL_CATEGORIES: readonly IntelligenceCategory[] = [
  'shrine_location',
  'agent_network',
  'trade_route',
  'military_position',
  'political_secret',
  'cultural_knowledge',
];

/** Category-to-templateId substring match table — used by findActionableIntelligence
 * for category-level match (in addition to specific entity/region match). */
export const TEMPLATE_CATEGORY_MATCHERS: Readonly<Record<IntelligenceCategory, readonly string[]>> = {
  shrine_location: ['shrine', 'veil.consecrate', 'pilgrim'],
  agent_network: ['network', 'contact', 'recruit'],
  trade_route: ['trade', 'caravan', 'merchant', 'route'],
  military_position: ['war', 'siege', 'patrol', 'garrison', 'ambush'],
  political_secret: ['court', 'intrigue', 'blackmail', 'extort', 'betray'],
  cultural_knowledge: ['ritual', 'ceremony', 'lore', 'cultural'],
};

// ─── Query helpers (existing) ─────────────────────────────────────

/** Get all intelligence held by a specific agent. */
export function getAgentIntelligence(state: GameState, agentId: string): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.agentId === agentId);
}

/** Get intelligence by category across all agents. */
export function getIntelligenceByCategory(state: GameState, category: IntelligenceCategory): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.category === category);
}

/** Check if an agent has intelligence about a specific entity. */
export function hasIntelligenceAbout(state: GameState, agentId: string, targetEntityId: string): boolean {
  return (state.intelligenceRecords ?? []).some(r => r.agentId === agentId && r.targetEntityId === targetEntityId);
}

/** Get intelligence relevant to a region. */
export function getRegionIntelligence(state: GameState, region: string): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.targetRegion === region);
}

/** Check if any agent has intelligence matching a category and region. */
export function hasRegionIntelligence(state: GameState, category: IntelligenceCategory, region: string): boolean {
  return (state.intelligenceRecords ?? []).some(r => r.category === category && r.targetRegion === region);
}

// ─── Consumption: views & matching (THR-113) ──────────────────────

export interface IntelligenceView {
  /** Most recent (by acquiredTick) record per category. */
  readonly byCategory: Partial<Record<IntelligenceCategory, IntelligenceRecord>>;
  /** Boolean presence flag per category — true iff agent has any record in that category. */
  readonly flags: Partial<Record<IntelligenceCategory, boolean>>;
  /** All records for the agent, pre-sorted desc by acquiredTick. */
  readonly all: readonly IntelligenceRecord[];
}

/**
 * Build a compact view of an agent's intelligence suitable for prose enrichment
 * and scoring queries. Pure function; no mutations.
 */
export function buildIntelligenceView(state: GameState, agentId: string): IntelligenceView {
  const all = [...getAgentIntelligence(state, agentId)].sort(
    (a, b) => b.acquiredTick - a.acquiredTick,
  );
  const byCategory: Partial<Record<IntelligenceCategory, IntelligenceRecord>> = {};
  const flags: Partial<Record<IntelligenceCategory, boolean>> = {};
  for (const record of all) {
    if (!byCategory[record.category]) {
      byCategory[record.category] = record;
    }
    flags[record.category] = true;
  }
  return { byCategory, flags, all };
}

export interface ActionableIntelligenceCandidate {
  readonly templateId: string;
  readonly locationId: string;
  readonly targetAgentId?: string;
  readonly region?: string;
}

/**
 * Check whether any record held by the agent is "actionable" for a given encounter
 * candidate. Matching rules (any one is sufficient):
 *   - record.targetEntityId === candidate.locationId
 *   - record.targetEntityId === candidate.targetAgentId
 *   - record.targetRegion === candidate.region
 *   - record.category matches candidate.templateId via TEMPLATE_CATEGORY_MATCHERS
 * Returns the first (most recent, by acquiredTick) matching record, or undefined.
 *
 * Accepts either a `GameState` or a pre-filtered records array for the agent.
 * The array form mirrors `evaluateMarkReveals` so scoring code can pass a minimal
 * slice rather than the full state.
 */
export function findActionableIntelligence(
  recordsOrState: GameState | readonly IntelligenceRecord[],
  agentId: string,
  candidate: ActionableIntelligenceCandidate,
): IntelligenceRecord | undefined {
  try {
    const records: readonly IntelligenceRecord[] = Array.isArray(recordsOrState)
      ? (recordsOrState as readonly IntelligenceRecord[])
      : getAgentIntelligence(recordsOrState as GameState, agentId);
    if (records.length === 0) return undefined;
    // Filter by agent if passed raw records — caller may pass all state records,
    // and the array branch skips the per-agent filter otherwise.
    const agentRecords = records.every(r => r.agentId === agentId)
      ? records
      : records.filter(r => r.agentId === agentId);
    if (agentRecords.length === 0) return undefined;
    const sorted = [...agentRecords].sort((a, b) => b.acquiredTick - a.acquiredTick);
    for (const record of sorted) {
      if (record.targetEntityId && record.targetEntityId === candidate.locationId) return record;
      if (record.targetEntityId && candidate.targetAgentId &&
        record.targetEntityId === candidate.targetAgentId) return record;
      if (record.targetRegion && candidate.region &&
        record.targetRegion === candidate.region) return record;
      const matchers = TEMPLATE_CATEGORY_MATCHERS[record.category];
      if (matchers && matchers.some(m => candidate.templateId.includes(m))) return record;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Map raw reliability (0–1 float) to a prose-facing descriptor.
 * Conservative fallback: unknown/invalid reliability → 'dubious'.
 */
export function reliabilityDescriptor(r: number): 'reliable' | 'uncertain' | 'dubious' {
  if (!Number.isFinite(r) || r < 0) return 'dubious';
  if (r >= RELIABILITY_THRESHOLD_RELIABLE) return 'reliable';
  if (r >= RELIABILITY_THRESHOLD_UNCERTAIN) return 'uncertain';
  return 'dubious';
}

// ─── Trace emission ───────────────────────────────────────────────

/** Emit an `intelligence_referenced` trace. Wrapped in try/catch for tick-loop safety. */
export function emitIntelligenceReferenced(
  tick: number,
  agentId: string,
  recordId: string,
  referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match',
  opts?: { templateId?: string; intelCategory?: IntelligenceCategory },
): void {
  try {
    emitTrace({
      tick,
      category: 'intelligence_referenced',
      agentId,
      recordId,
      referencedBy,
      templateId: opts?.templateId,
      intelCategory: opts?.intelCategory,
      summary: `Intelligence ${recordId} referenced by ${referencedBy} for ${agentId}`,
    });
  } catch {
    // Trace failure must never block downstream work (NFP #4)
  }
}

// ─── Resolution-time passive observation ──────────────────────────

/**
 * At encounter resolution, check whether any existing intelligence record held by
 * the actor matches the resolved action's target (locationId or targetAgentId).
 * Emits `intelligence_referenced` for each match. Does NOT modify state.
 *
 * Used for inspectability — "the intel the agent had was relevant to what just
 * happened" — enabling migration-verification queries.
 */
export function observeResolutionIntelligence(
  state: GameState,
  action: UnifiedAction | undefined,
  reaction: EncounterAftermathReactionEffect | undefined,
  tick: number,
): void {
  if (!action?.actorId) return;
  const records = getAgentIntelligence(state, action.actorId);
  if (records.length === 0) return;
  const targetId = action.targetId;
  const templateId = action.templateId;

  // Resolve the action's target to a region for region-keyed records.
  // Fail-soft: if the graph lookup fails or the node has no region, region
  // matching is simply skipped — we don't throw or fall back to a match.
  let targetRegion: string | undefined;
  if (INTEL_RESOLUTION_MATCH_REGIONS && targetId) {
    try {
      const node = state.graph?.getNode?.(targetId);
      const props = node?.properties as Record<string, unknown> | undefined;
      const rawRegion = props?.region ?? props?.regionId;
      if (typeof rawRegion === 'string') targetRegion = rawRegion;
    } catch {
      // Graph lookup errors must never block resolution observation (NFP #4).
    }
  }

  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.recordId)) continue;
    let matched = false;
    if (record.targetEntityId && targetId && record.targetEntityId === targetId) matched = true;
    if (!matched && targetRegion && record.targetRegion && record.targetRegion === targetRegion) {
      matched = true;
    }
    if (!matched && templateId) {
      const matchers = TEMPLATE_CATEGORY_MATCHERS[record.category];
      if (matchers && matchers.some(m => templateId.includes(m))) matched = true;
    }
    if (matched) {
      emitIntelligenceReferenced(tick, action.actorId, record.recordId, 'resolution_match', {
        templateId: action.templateId,
        intelCategory: record.category,
      });
      seen.add(record.recordId);
    }
  }
  // `reaction` is currently unused but reserved for future reaction-keyed matching
  // (e.g., an `intelligence_used` reaction variant). Keeping the param avoids a
  // breaking signature change when that deferral lands.
  void reaction;
}
