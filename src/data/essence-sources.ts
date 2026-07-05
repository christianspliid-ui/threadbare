/**
 * Essence Source taxonomy, tunable constants, and pure derivation helpers
 * (THR-611 — Divine Economy).
 *
 * Pure data + pure functions only — no graph access (that lives in
 * `src/engine/essenceSources.ts`). Every magic number is a named constant
 * (NFP #1); every derivation is deterministic (NFP #3).
 */

import type { SourceKind, SourceTier } from '../types/essenceSource';
import { ESSENCE_PER_PLACE_OF_POWER } from './influence-content';

// ─── Tunable constants ───────────────────────────────────────────────────────

/** Normalized-sanctity boundary: dormant → flowering. */
export const SANCTITY_FLOWERING_THRESHOLD = 0.6;

/** Income multiplier once a source reaches the `flowering` tier. */
export const SOURCE_FLOWERING_MULTIPLIER = 2.0;

/** Income multiplier while a source is `contested` (income leaks). */
export const SOURCE_CONTESTED_PENALTY = 0.4;

/**
 * Diminishing-returns base across portfolio depth: the nth typed source within a
 * sphere (richest first, 0-indexed rank) is worth `SOURCE_DR_BASE ^ rank`. Pushes
 * the player toward breadth + defense over hoarding a single sphere.
 */
export const SOURCE_DR_BASE = 0.8;

/** Per-source per-tick Control maintenance (charged to the primary sphere). */
export const SOURCE_CONTROL_SUSTAIN = 0.15;

/** Sanctity gained per successful Build (Sanctify) action. */
export const SANCTITY_BUILD_PER_ACTION = 0.15;

/**
 * Sanctity restored per successful Defend (Ward) action — larger than a Build
 * step because defending is reactive triage against an active drain, not slow
 * cultivation. Also clears `contestedBy` / `desecrated` (see the defend op).
 */
export const SANCTITY_DEFEND_RESTORE = 0.25;

/** Sanctity lost per tick while contested and undefended. */
export const SANCTITY_DRAIN_PER_TICK_CONTESTED = 0.02;

/**
 * Hex range within which a Find action reveals latent essence sources, centered
 * on the targeted location. A flat tunable for now; a later slice may make it
 * capability-driven (per-reach awareness, per the plan's `SOURCE_DISCOVERY_RANGE_HOPS`
 * "per-reach awareness" note).
 */
export const SOURCE_DISCOVERY_RANGE_HOPS = 3;

/**
 * Target number of latent (undiscovered, uncontrolled) `placeOfPower` sources
 * seeded at worldgen. Capped by the count of eligible host locations, so smaller
 * maps get fewer. Kept deliberately small (plan: "sources are few and player-owned").
 */
export const LATENT_SOURCE_SEED_COUNT = 6;

/**
 * Location subtypes eligible to host a worldgen-seeded latent `placeOfPower`
 * source — natural / wild interest points (groves, caverns, springs, monuments,
 * old roads), never settlements, the seat, ruins, or lairs. These read as
 * "places of latent power" the god has yet to find and claim.
 */
export const LATENT_SOURCE_HOST_SUBTYPES: readonly string[] = [
  'grove',
  'cavern',
  'hot_spring',
  'monument',
  'ancient_road',
];

/**
 * Base per-tick yield by source kind. `placeOfPower` keeps the legacy
 * `ESSENCE_PER_PLACE_OF_POWER` value so a migrated, untyped, dormant place of
 * power contributes exactly what it did before (NFP #6, additive).
 */
export const BASE_SOURCE_INCOME: Record<SourceKind, number> = {
  placeOfPower: ESSENCE_PER_PLACE_OF_POWER, // 0.5 — legacy-preserving
  shrine: 0.4,
  faithfulCommunity: 0.3,
  relic: 0.6,
  rite: 0.25,
};

// ─── Pure derivation helpers ─────────────────────────────────────────────────

/**
 * Derive the public tier from the private sanctity scalar and contested/desecrated
 * state. Order of precedence: desecrated > contested > sanctity band. Fail-soft:
 * a non-finite sanctity resolves to `dormant`.
 */
export function deriveSourceTier(
  sanctity: number,
  opts: { contested?: boolean; desecrated?: boolean } = {},
): SourceTier {
  if (opts.desecrated) return 'desecrated';
  if (opts.contested) return 'contested';
  if (Number.isFinite(sanctity) && sanctity >= SANCTITY_FLOWERING_THRESHOLD) {
    return 'flowering';
  }
  return 'dormant';
}

/**
 * Income multiplier for a given tier. `dormant` = base (×1); `flowering` boosts;
 * `contested` leaks; `desecrated` yields nothing (income redirects to the drainer).
 */
export function sourceTierMultiplier(tier: SourceTier): number {
  switch (tier) {
    case 'flowering':
      return SOURCE_FLOWERING_MULTIPLIER;
    case 'contested':
      return SOURCE_CONTESTED_PENALTY;
    case 'desecrated':
      return 0;
    case 'dormant':
    default:
      return 1.0;
  }
}

/** Diminishing-returns factor for the `rank`-th (0-indexed) source in a sphere. */
export function sourceDepthMultiplier(rank: number): number {
  if (!Number.isFinite(rank) || rank <= 0) return 1.0;
  return SOURCE_DR_BASE ** rank;
}
