/**
 * Encounter Awareness Filter — per-reach hex-distance-limited visibility.
 *
 * An agent's domain capability determines how many hex hops they can "see"
 * encounters across. Visibility is hex-granular: if the agent can see a hex,
 * they can see everything on it (every location, sublocation, encounter).
 *
 * Within-hex visibility is automatic (distance 0). Cross-hex visibility is
 * computed as hex coordinate distance vs. per-reach awareness hops.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                  | Default | Purpose                                     |
 * |-----------------------|---------|---------------------------------------------|
 * | AWARENESS_THRESHOLD   | 0.05    | Minimum capability to see beyond own hex     |
 * | BASE_AWARENESS_HOPS   | 1       | Hex hops granted to any agent above threshold|
 * | CAPABILITY_PER_HOP    | 0.15    | Additional capability needed per extra hop   |
 * | MAX_AWARENESS_HOPS    | 5       | Hard cap on awareness range                  |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * This module is a pure filter — it does not emit traces.
 * Consumers may trace which entries were filtered in / out.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                     | Fallback                        |
 * |----------------------------------|---------------------------------|
 * | Agent not in graph               | Return empty array              |
 * | Agent has no capability data     | computeCapability returns ~0.02 |
 * |                                  | → below threshold → 0 hops     |
 * | Entry missing reachPrimary       | Skip entry                      |
 * | Location missing hex coordinates | Skip entry (invisible)          |
 * | Agent location missing hex coords| Return empty array              |
 * | Agent at sublocation             | Resolve to parent via           |
 * |                                  | parentLocationId → hex coords   |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — deterministic filter, no randomness.
 */

import type { ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import { computeCapability } from './domainCapability';
import { hexDistance } from '../lib/hexMath';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
  EDGE_HEX_AWARENESS_BONUS,
} from '../data/agent-behavior-constants';

import {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
  EDGE_HEX_AWARENESS_BONUS,
} from '../data/agent-behavior-constants';

import { hexNeighbors } from '../lib/hexMath';
import type { EffectRuntimeState } from '../types/effects';
import { getRangeModifiers, getRevealRanges } from './effects/effectQueries';
import { readBonusOverride, type RuleOverrideContext } from './effects/ruleOverrideConsumers';
import { hasTerrainOverlay } from './effects/effectOverlayStore';
import { SHROUDED_OVERLAY_AWARENESS_PENALTY } from '../data/effect-constants';

// ─── Hex resolution helpers ─────────────────────────────────────

/**
 * Resolve a location (or sublocation) node to its hex coordinates.
 * Sublocations are resolved via parentLocationId → parent location → hex.
 * Returns null if coordinates cannot be determined (fail-soft).
 */
export function resolveLocationToHex(
  graph: WorldGraph,
  locationId: string,
): { col: number; row: number } | null {
  const node = graph.getNode(locationId);
  if (!node) return null;

  const props = node.properties as Record<string, unknown>;

  // If this is a sublocation, resolve to parent
  const parentId = props.parentLocationId as string | undefined;
  if (parentId) {
    return resolveLocationToHex(graph, parentId);
  }

  // Read hex coordinates from the location node
  const col = props.hexCol as number | undefined;
  const row = props.hexRow as number | undefined;
  if (col === undefined || row === undefined) return null;

  return { col, row };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Compute awareness hops for a single reach domain given a capability value.
 *
 * 1. Below AWARENESS_THRESHOLD → 0 (own hex only)
 * 2. BASE_AWARENESS_HOPS + floor(capability / CAPABILITY_PER_HOP)
 * 3. Capped at MAX_AWARENESS_HOPS
 */
export function computeAwarenessHops(capability: number, reach: ReachDomain): number {
  if (capability < AWARENESS_THRESHOLD) return 0;

  const hops = BASE_AWARENESS_HOPS + Math.floor(capability / CAPABILITY_PER_HOP);

  return Math.min(hops, MAX_AWARENESS_HOPS);
}

/**
 * Filter encounter cache entries by per-reach hex-distance awareness.
 *
 * For each entry, the agent's best capability across primary and secondary
 * reaches determines the maximum hex distance at which the encounter is visible.
 * Within-hex encounters (distance 0) are always visible regardless of capability.
 *
 * Agent position is resolved to hex coordinates: sublocation → parent → hex.
 * This means an agent at a sublocation sees all encounters on their hex automatically.
 */
/**
 * Check if a hex is on the map border (has fewer than 6 valid neighbors).
 * Uses map dimensions to determine if any neighbor would be out of bounds.
 */
function isEdgeHex(hex: { col: number; row: number }, mapCols?: number, mapRows?: number): boolean {
  if (mapCols === undefined || mapRows === undefined) return false;
  const neighbors = hexNeighbors(hex);
  return neighbors.some(n => n.col < 0 || n.row < 0 || n.col >= mapCols || n.row >= mapRows);
}

export function filterByAwareness(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  mapCols?: number,
  mapRows?: number,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  overrideCtx?: RuleOverrideContext,
): EncounterCacheEntry[] {
  // Fail-soft: agent must exist and have a location
  if (!agentLocationId) return [];
  if (!graph.getNode(agentId)) return [];

  // Resolve agent location (or sublocation) to hex coordinates
  const agentHex = resolveLocationToHex(graph, agentLocationId);
  if (!agentHex) return [];

  // Edge hex bonus: agents on map borders get extra awareness to compensate
  const edgeBonus = isEdgeHex(agentHex, mapCols, mapRows) ? EDGE_HEX_AWARENESS_BONUS : 0;

  // Range modifier bonus from range_modifier effects
  const rangeAwarenessBonus = effectStates !== undefined
    ? getRangeModifiers(graph, agentId, effectStates).awarenessRangeBonus
    : 0;

  // THR-1241: `awareness_range_bonus` is the `modify_rules` spelling of the same
  // reach. It had shipped content (`reward-attachment-catalog.ts`) promising a
  // wider horizon and nothing reading it — this is the owning site, because every
  // cross-hex encounter visibility decision runs through the hop count below.
  // Additive with the `range_modifier` half: two sources of farsight see further.
  const ruleAwarenessBonus = overrideCtx !== undefined
    ? readBonusOverride(overrideCtx, agentId, 'awareness_range_bonus', 'encounterAwareness')
    : 0;

  // THR-1242: the `reveal` primitive's `encounters` range. 17 content refs used
  // `reveal` and nothing read any of them — a scrying lens that revealed nothing.
  // A reveal is a *floor* on the horizon rather than a bonus added to it: content
  // says "reveals encounters within 2 hexes", which is a promise about the
  // absolute range, not about the range you would otherwise have had. Summing it
  // would make the same lens worth more to an already-farsighted bearer, which is
  // the opposite of what the words say.
  const revealEncounterRange = effectStates !== undefined
    ? getRevealRanges(graph, agentId, effectStates).encounters
    : 0;

  // THR-1242: the `shrouded` overlay — where the retired `create_barrier`
  // primitive's `blocks: 'awareness'` arm landed. Subtractive so it argues with
  // farsight rather than overriding it, and floored below so a shrouded agent
  // still sees its own hex.
  const shroudPenalty = (overrideCtx?.persisted !== undefined
    && hasTerrainOverlay(overrideCtx.persisted, agentHex.col, agentHex.row, 'shrouded'))
    ? SHROUDED_OVERLAY_AWARENESS_PENALTY
    : 0;

  const effectAwarenessBonus = rangeAwarenessBonus + ruleAwarenessBonus - shroudPenalty;

  // Pre-compute a cache of locationId → hex coords to avoid repeated lookups
  const hexCache = new Map<string, { col: number; row: number } | null>();

  // THR-581: agentId is fixed for the whole call, so per-reach awareness range is
  // invariant across every entry. computeCapability walks trait/artifact/controls
  // edges — expensive — and there are only 9 reaches, so caching per reach collapses
  // hundreds of redundant graph walks per agent into ≤9. This was the dominant
  // super-linear driver of the large-map agent_decision stall (ad_filter ≈ 300ms →
  // filterByAwareness recomputed capability per-entry). Identical values → no
  // behavior change (determinism parity, NFP #3), just fewer graph traversals (NFP #7).
  const rangeCache = new Map<ReachDomain, number>();
  const awarenessRangeOf = (reach: ReachDomain): number => {
    let range = rangeCache.get(reach);
    if (range === undefined) {
      range = computeAwarenessHops(computeCapability(graph, agentId, reach), reach);
      rangeCache.set(reach, range);
    }
    return range;
  };

  const result: EncounterCacheEntry[] = [];

  for (const entry of entries) {
    // Fail-soft: skip entries with no primary reach
    if (!entry.reachPrimary) continue;

    // Resolve encounter location to hex (with caching)
    let entryHex = hexCache.get(entry.locationId);
    if (entryHex === undefined) {
      entryHex = resolveLocationToHex(graph, entry.locationId);
      hexCache.set(entry.locationId, entryHex);
    }
    if (!entryHex) continue;

    // Compute hex distance
    const dist = hexDistance(agentHex, entryHex);

    // Same hex (distance 0) → always visible, no capability check needed
    if (dist === 0) {
      result.push(entry);
      continue;
    }

    // Cross-hex: best visibility channel = max per-reach range (memoized per reach).
    const primaryRange = awarenessRangeOf(entry.reachPrimary);
    const secondaryRange = entry.reachSecondary
      ? awarenessRangeOf(entry.reachSecondary)
      : 0;
    // Floored at 0 so a shroud narrows the horizon without inverting it — a
    // negative range would hide the agent's own hex, and same-hex visibility is
    // the invariant the whole three-tier position model rests on. `reveal` is a
    // floor rather than a term (THR-1242), so a lens that promises "encounters
    // within 2 hexes" delivers exactly that even to a shrouded or dull-witted
    // bearer, which is what its content says.
    const earnedRange = Math.max(
      0,
      Math.max(primaryRange, secondaryRange) + edgeBonus + effectAwarenessBonus,
    );
    const maxRange = Math.max(earnedRange, revealEncounterRange);

    if (dist <= maxRange) {
      result.push(entry);
    }
  }

  return result;
}
