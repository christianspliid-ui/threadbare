/**
 * Archetype epithet derivation — "The [Dominant] of [Modifier-domain]"
 *
 * Derives a literary epithet from an agent's axiological profile.
 * Only pairs with lean > 0.6 or < -0.6 qualify (ARCHETYPE_THRESHOLD).
 * courage_prudence (meta-axis) is excluded — reach-bound axes only.
 * Knowledge-gated: only shown when AgentKnowledge includes 'archetype' facet.
 *
 * Design: Phase 12 (TB-075) — Docs/plans/2026-03-28-cosmological-symmetry-refactor.md
 */

import {
  type AxiologicalProfile,
  type ValuePair,
  VALUE_PAIRS,
  ARCHETYPE_NAMES,
  META_VALUE_PAIR,
  REACH_VALUE_PAIR,
} from '../types/agent';
import type { ReachDomain } from '../types/traits';

// ─── Threshold Constant (NFP #1: Tunability) ─────────────────────────────────

/** Only leans strictly beyond this threshold earn an archetype label */
export const ARCHETYPE_THRESHOLD = 0.6;

// ─── Domain Word Map (NFP #1: Tunability) ────────────────────────────────────

/**
 * Thematic domain words for each reach — used as the modifier in epithets.
 * Format: "The [Dominant] of [modifier-word]"
 * Source: Phase 12 UI-SPEC archetype epithet patterns table.
 */
export const ARCHETYPE_DOMAIN_WORDS: Record<ReachDomain, { positive: string; negative: string }> = {
  iron:   { positive: 'Storms',    negative: 'Ruin' },
  gold:   { positive: 'Harvests',  negative: 'Plenty' },
  shadow: { positive: 'Secrets',   negative: 'Whispers' },
  veil:   { positive: 'Mysteries', negative: 'Currents' },
  heart:  { positive: 'Bonds',     negative: 'Flames' },
  eye:    { positive: 'Truths',    negative: 'Horizons' },
  stone:  { positive: 'Ages',      negative: 'Forms' },
  star:   { positive: 'Fates',     negative: 'Heavens' },
};

// ─── Epithet Derivation ───────────────────────────────────────────────────────

/**
 * Derive archetype epithet from axiological profile.
 *
 * Returns null if:
 * - No pair exceeds ARCHETYPE_THRESHOLD (absolute value)
 * - Only the meta-axis (courage_prudence) qualifies
 *
 * When multiple pairs exceed threshold, picks the strongest lean.
 * Ties are broken deterministically by VALUE_PAIRS iteration order.
 *
 * Fail-soft: returns null rather than throwing if mapping is missing.
 */
export function deriveArchetypeEpithet(profile: AxiologicalProfile): string | null {
  let strongestPair: ValuePair | null = null;
  let strongestLean = 0;

  for (const pair of VALUE_PAIRS) {
    if (pair === META_VALUE_PAIR) continue; // exclude courage_prudence

    const value = profile[pair] ?? 0;
    const absValue = Math.abs(value);

    // Strictly greater than threshold, and strictly greater than current best
    // (>= would break deterministic tie-breaking — ties keep first in VALUE_PAIRS order)
    if (absValue > ARCHETYPE_THRESHOLD && absValue > strongestLean) {
      strongestPair = pair;
      strongestLean = absValue;
    }
  }

  if (!strongestPair) return null;

  const pairValue = profile[strongestPair];
  const isPositive = pairValue > 0;

  const archetypeName = isPositive
    ? ARCHETYPE_NAMES[strongestPair].positive
    : ARCHETYPE_NAMES[strongestPair].negative;

  // Find the reach domain associated with this pair
  const reach = (Object.entries(REACH_VALUE_PAIR) as [ReachDomain, ValuePair][])
    .find(([, vp]) => vp === strongestPair)?.[0];

  if (!reach) return null; // fail-soft: mapping missing

  const domainWord = isPositive
    ? ARCHETYPE_DOMAIN_WORDS[reach].positive
    : ARCHETYPE_DOMAIN_WORDS[reach].negative;

  return `The ${archetypeName} of ${domainWord}`;
}
