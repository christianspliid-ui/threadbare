/**
 * Encounter surface — a template bound to its context axes.
 * The surface key is the stable identity used for novelty/recency tracking (THR-475).
 *
 * A surface is distinct from a template: the same template at a guild versus a road
 * versus a shadow-court counts as a different surface for recency purposes.
 * This raises entropy before any Tier-2 content (context-multiplied variants) exists.
 */

import type { EncounterCacheEntry } from './encounterCache';

// ─── Type ────────────────────────────────────────────────────────

/** Canonical surface key — templateId plus sorted context-axis bindings. */
export type SurfaceKey = string; // "templateId|axis1=val|axis2=val|..."

export interface SurfaceAxisValues {
  readonly reachPrimary?: string;
  readonly socialRole?: string;
  readonly sublocationTypeId?: string;
}

// ─── Constants (NFP #1) ──────────────────────────────────────────

/**
 * Which context axes are included in the surface key.
 * All axes must map to a closed enum (bounded cardinality by construction).
 * Each string matches a key in the axis-value map inside computeSurfaceKey.
 */
export const SURFACE_KEY_AXES: readonly string[] = [
  'sublocationTypeId', // location-context lever (e.g. sublocation-type.market-district)
  'reachPrimary',      // action-domain flavor (ReachDomain enum)
  'socialRole',        // NPC role of the social target (null for non-social encounters)
] as const;

/** Target total unique surfaces per full playthrough (volume model mid-point). */
export const SURFACES_PER_RUN_TARGET = 88;

/** Fraction of the total library eligible during a single run. */
export const RELEVANT_FRACTION = 0.5;

/** Minimum runs before the player sees repeated surfaces (replayability target). */
export const RUNS_BEFORE_REPETITION = 9;

// ─── Derivation ──────────────────────────────────────────────────

/**
 * Compute the canonical surface key for an encounter cache entry.
 *
 * Rules:
 * - templateId is always the first component (no prefix).
 * - Axis components follow in alphabetical axis-name order.
 * - Null/absent axis values are omitted (not serialised as "null").
 * - Order-stable: same inputs always produce the same byte sequence.
 * - Fail-soft: malformed/missing axis falls back to templateId-only key (see below).
 */
export function computeSurfaceKey(
  entry: Pick<
    EncounterCacheEntry,
    'templateId' | 'reachPrimary' | 'sublocationTypeId' | 'targetAgentRole'
  >,
): SurfaceKey {
  try {
    const parts: string[] = [entry.templateId];
    for (const axis of getSortedSurfaceAxes()) {
      const val = getSurfaceAxisValueMap(entry)[axis];
      if (val != null && val !== '') {
        parts.push(`${axis}=${val}`);
      }
    }

    return parts.join('|');
  } catch {
    // Fail-soft: degrade to templateId-only key. Never throws.
    return entry.templateId;
  }
}

/**
 * Return the axis values that participate in the surface key, omitting absent axes.
 * This keeps Debug Panel and trace payloads aligned with the canonical key derivation.
 */
export function getSurfaceAxisValues(
  entry: Pick<
    EncounterCacheEntry,
    'reachPrimary' | 'sublocationTypeId' | 'targetAgentRole'
  >,
): SurfaceAxisValues {
  const values: Partial<SurfaceAxisValues> = {};

  for (const axis of getSortedSurfaceAxes()) {
    const val = getSurfaceAxisValueMap(entry)[axis];
    if (val != null && val !== '') {
      values[axis as keyof SurfaceAxisValues] = val;
    }
  }

  return values;
}

function getSurfaceAxisValueMap(
  entry: Pick<
    EncounterCacheEntry,
    'reachPrimary' | 'sublocationTypeId' | 'targetAgentRole'
  >,
): Record<string, string | null | undefined> {
  return {
    sublocationTypeId: entry.sublocationTypeId,
    reachPrimary: entry.reachPrimary,
    socialRole: entry.targetAgentRole ?? null,
  };
}

function getSortedSurfaceAxes(): readonly string[] {
  return [...SURFACE_KEY_AXES].sort();
}
