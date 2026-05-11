/**
 * Encounter Foreshadowing Resolver (THR-389).
 *
 * Generates 2–4 sentence prose representing what an agent believes / imagines
 * about an encounter they're moving toward. Runs on click — never per-tick.
 * Results are cached per (agentId, encounterId, intelligenceVersion, interventionVersion).
 *
 * Phase 1 + 3: variant selection consults EncounterForeshadowing.variants[] when present.
 * Falls back to encounter-specific fallback, then to GENERIC_FORESHADOWING_FALLBACK.
 */

import type { GameState } from '../../types/gameState';
import type { SimulationRuntime } from '../simulationRuntime';
import type { ForeshadowingResult, ForeshadowingSignals, ForeshadowingVariant } from './types';
import { GENERIC_FORESHADOWING_FALLBACK, resolveForeshadowingPlaceholders } from './genericFallback';
import { attributeRecentInterventions } from './attributeRecentInterventions';
import { FORESHADOWING_CACHE_MAX_ENTRIES } from './constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { emitTrace } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';

// ─── Variant selection ────────────────────────────────────────────────────────

/** Deterministic seed derived from two strings — used for PRNG tie-breaking in variant selection. */
function stableHashSeed(a: string, b: string): number {
  let hash = 0x5b3d7a9f;
  for (const str of [a, b]) {
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 31) + str.charCodeAt(i)) | 0;
    }
  }
  return hash >>> 0;
}

/**
 * Returns true when all non-undefined `when` conditions match `signals`.
 * `hasMark` and `hasReputation` are deferred to Phase 3 — they always pass here.
 */
function matchVariantWhen(when: ForeshadowingVariant['when'], signals: ForeshadowingSignals): boolean {
  if (when.intelligenceTier !== undefined && when.intelligenceTier !== signals.intelligenceTier) return false;
  if (when.topMotive !== undefined && when.topMotive !== signals.topMotive) return false;
  if (when.dominantReach !== undefined && when.dominantReach !== signals.dominantReach) return false;
  return true;
}

/** Count conditions specified in a `when` block — more conditions = higher specificity. */
function countSpecifiedConditions(when: ForeshadowingVariant['when']): number {
  return (when.intelligenceTier !== undefined ? 1 : 0)
    + (when.topMotive !== undefined ? 1 : 0)
    + (when.dominantReach !== undefined ? 1 : 0)
    + (when.hasMark !== undefined ? 1 : 0)
    + (when.hasReputation !== undefined ? 1 : 0);
}

/**
 * Select the best variant for the current signals.
 * Candidates are all variants whose `when` block fully matches.
 * More-specific variants (more conditions) win over less-specific ones.
 * Ties at the same specificity are broken deterministically with PRNG.
 */
function selectVariant(
  variants: readonly ForeshadowingVariant[],
  signals: ForeshadowingSignals,
  agentId: string,
  encounterId: string,
): ForeshadowingVariant | null {
  const candidates = variants.filter(v => matchVariantWhen(v.when, signals));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const topScore = Math.max(...candidates.map(v => countSpecifiedConditions(v.when)));
  const topCandidates = candidates.filter(v => countSpecifiedConditions(v.when) === topScore);
  if (topCandidates.length === 1) return topCandidates[0];
  const rng = mulberry32(stableHashSeed(agentId, encounterId));
  return topCandidates[Math.floor(rng() * topCandidates.length)];
}

// ─── Phase 1 cache-version sentinels ─────────────────────────────────────────
// In Phase 3, these will be derived from agentIntelligenceVersion and
// interventionAttributionVersion tracked on the runtime. For now, we use
// stable values so the cache key is valid but always returns a result.
const PHASE1_INTEL_VERSION = 0;
const PHASE1_INTERVENTION_VERSION = 0;

/** Build the cache key for a (agentId, encounterId, versions) tuple. */
function cacheKey(agentId: string, encounterId: string): string {
  return `${agentId}|${encounterId}|${PHASE1_INTEL_VERSION}|${PHASE1_INTERVENTION_VERSION}`;
}

/**
 * Enforce the LRU cap. When the cache exceeds the max, prune the oldest quarter
 * of entries to amortize the cost. Map insertion order is preserved in JS.
 */
function pruneCache(cache: Map<string, ForeshadowingResult>): void {
  if (cache.size <= FORESHADOWING_CACHE_MAX_ENTRIES) return;
  const pruneCount = Math.ceil(FORESHADOWING_CACHE_MAX_ENTRIES / 4);
  let count = 0;
  for (const key of cache.keys()) {
    if (count >= pruneCount) break;
    cache.delete(key);
    count++;
  }
}

/**
 * Derive the agent's subject pronoun from graph node properties.
 * Defaults to 'they' (they/them) when gender is absent or unrecognised.
 */
function resolveSubjectPronoun(gender: unknown): string {
  if (typeof gender !== 'string') return 'they';
  switch (gender.toLowerCase()) {
    case 'male': case 'm': return 'he';
    case 'female': case 'f': return 'she';
    default: return 'they';
  }
}

/**
 * Compute baseline signals for Phase 1 (generic fallback path).
 *
 * In Phase 3, intelligenceTier and topMotive will be derived from the agent's
 * actual intelligence records and encounter-pool funnel scores.
 */
function computeBaselineSignals(
  encounterId: string,
  state: GameState,
  agentId: string,
): ForeshadowingSignals {
  const template = getUnifiedTemplateById(encounterId);
  const dominantReach = template?.reach ?? 'wilderness';

  // Phase 1: default to unknown intelligence tier and awareness motive.
  // These values will be properly derived in Phase 3.
  void state; void agentId;
  return {
    intelligenceTier: 'unknown',
    topMotive: 'awareness',
    dominantReach,
  };
}

/**
 * Resolve encounter foreshadowing for a given (agentId, encounterId) pair.
 *
 * Reads from the per-session foreshadowing cache when available.
 * Cache is written after every resolution (hit or miss) and cleared by
 * touchStructure() when the world structure changes.
 *
 * @param state   Current game state (read-only).
 * @param agentId The agent moving toward the encounter.
 * @param encounterId The encounter template ID.
 * @param tick    Current simulation tick.
 * @param runtime Per-session SimulationRuntime (owns the cache).
 */
export function getEncounterForeshadowing(
  state: GameState,
  agentId: string,
  encounterId: string,
  tick: number,
  runtime: SimulationRuntime,
): ForeshadowingResult {
  const key = cacheKey(agentId, encounterId);

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = runtime.foreshadowingCache.get(key);
  if (cached) {
    emitTrace({
      category: 'foreshadowing',
      tick,
      agentId,
      encounterId,
      variantsConsidered: [],
      variantPicked: null,
      signals: cached.signals,
      interventionAttributionId: cached.interventionAttribution?.interventionId ?? null,
      cacheHit: true,
      summary: `foreshadowing cache hit: ${agentId} → ${encounterId}`,
    });
    return cached;
  }

  // ── Resolution ─────────────────────────────────────────────────────────────
  let result: ForeshadowingResult;

  try {
    const agentNode = state.graph.getNode(agentId);
    const agentName = agentNode?.name ?? agentId;
    const gender = agentNode?.properties?.gender;
    const pronounSubject = resolveSubjectPronoun(gender);

    const signals = computeBaselineSignals(encounterId, state, agentId);

    const template = getUnifiedTemplateById(encounterId);
    const encounterHeading = template?.name ?? encounterId;

    const foreshadowingDef = template?.foreshadowing;
    const variantsConsidered = foreshadowingDef?.variants.map(v => v.id) ?? [];
    const pickedVariant = foreshadowingDef
      ? selectVariant(foreshadowingDef.variants, signals, agentId, encounterId)
      : null;
    const templateString = pickedVariant?.template
      ?? foreshadowingDef?.fallback
      ?? GENERIC_FORESHADOWING_FALLBACK;
    const variantId = pickedVariant?.id ?? null;

    const prose = resolveForeshadowingPlaceholders(
      templateString,
      agentName,
      encounterHeading,
      pronounSubject,
    );

    const interventionAttribution = attributeRecentInterventions(
      state, agentId, encounterId, tick,
    );

    result = {
      prose,
      variantId,
      signals,
      interventionAttribution,
      resolvedAtTick: tick,
    };

    emitTrace({
      category: 'foreshadowing',
      tick,
      agentId,
      encounterId,
      variantsConsidered,
      variantPicked: variantId,
      signals,
      interventionAttributionId: interventionAttribution?.interventionId ?? null,
      cacheHit: false,
      summary: `foreshadowing resolved (${variantId ? `variant:${variantId}` : 'generic fallback'}): ${agentId} → ${encounterId}`,
    });
  } catch (err) {
    // Fail-soft: never crash the caller. Return a neutral placeholder.
    // The error is captured in the trace for diagnostics.
    const fallbackProse = '...';
    result = {
      prose: fallbackProse,
      variantId: null,
      signals: { intelligenceTier: 'unknown', topMotive: 'awareness', dominantReach: 'wilderness' },
      interventionAttribution: null,
      resolvedAtTick: tick,
    };
    emitTrace({
      category: 'foreshadowing',
      tick,
      agentId,
      encounterId,
      variantsConsidered: [],
      variantPicked: null,
      signals: result.signals,
      interventionAttributionId: null,
      cacheHit: false,
      error: String(err),
      summary: `foreshadowing resolver error: ${agentId} → ${encounterId}`,
    });
  }

  // ── Cache write ────────────────────────────────────────────────────────────
  pruneCache(runtime.foreshadowingCache);
  runtime.foreshadowingCache.set(key, result);

  return result;
}
