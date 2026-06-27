/**
 * Influence Content Package — Tier names, costs, and economy constants.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change influence
 * tier names, maintenance costs, promotion thresholds, and economy.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { InfluenceTier } from '../types/influence';

// ─── Economy Constants ────────────────────────────────────────────

/** Base generation rate: 1 essence per tick. */
export const BASE_ESSENCE_PER_TICK = 1.0;

/** Essence per threaded mortal per tick. */
export const ESSENCE_PER_THREAD = 0.1;
/** @deprecated Use ESSENCE_PER_THREAD */
export const ESSENCE_PER_WORSHIPPER = ESSENCE_PER_THREAD;

/** Essence bonus per controlled place of power per tick. */
export const ESSENCE_PER_PLACE_OF_POWER = 0.5;

/**
 * Essence per tick from the ascendant's home seat (throne) — THR-502.
 * The seat is a named, higher-yield place of power: the location identified by
 * `AscendantProperties.homeSeatLocationId`. It replaces (does not stack with)
 * the ordinary place-of-power bonus for that one location, so threading a fresh
 * (non-place-of-power) location as the seat raises per-tick essence by exactly
 * this amount.
 */
export const ESSENCE_PER_SEAT = 1.0;

/** Maximum essence pool scales with total influence level. */
export const BASE_MAX_ESSENCE = 50;
export const MAX_ESSENCE_PER_THREAD = 5;
/** @deprecated Use MAX_ESSENCE_PER_THREAD */
export const MAX_ESSENCE_PER_WORSHIPPER = MAX_ESSENCE_PER_THREAD;

// ─── Tier Data ────────────────────────────────────────────────────

/** Working names for each tier. */
export const TIER_NAMES: Record<InfluenceTier, string> = {
  0: 'Unaware',
  1: 'Touched',
  2: 'Devoted',
  3: 'Champion',
  4: 'Aspect',
};

/** Maintenance cost per tick per tier. */
export const TIER_MAINTENANCE: Record<InfluenceTier, number> = {
  0: 0,
  1: 0.5,
  2: 1.0,
  3: 2.0,
  4: 4.0,
};

/** Ticks of maintained influence needed to promote to each tier. */
export const TIER_PROMOTION_THRESHOLDS: Record<InfluenceTier, number> = {
  0: 0,    // automatic
  1: 0,    // immediate on recruitment (costs 5 essence)
  2: 30,   // ~1 month of maintained influence
  3: 90,   // ~1 season
  4: 180,  // ~2 seasons
};

// ─── Action Costs ─────────────────────────────────────────────────

/** Cost to recruit a new actor (establish Tier 1 influence). */
export const RECRUIT_COST = 5;

/** Cost to discover actors at current location. */
export const DISCOVER_COST = 1;

/** Cost to observe (reveal hidden properties). */
export const OBSERVE_COST = 0.5;

// ─── Reach Gate (THR-503) ─────────────────────────────────────────

/**
 * Minimum reach affinity an ascendant must have in a template's `requiresReach`
 * domain for that card to be shown. The reach gate is a permanent two-domain
 * membership filter: an ascendant holds a fixed primary + secondary reach for
 * the whole game, so a card requiring any other reach is hidden for the entire
 * run (never surfaced as aspiration). Since an ascendant's domain affinities only
 * carry entries for its actual reaches (raw scores 2–5) and absent reaches resolve
 * to 0, this floor acts as a fixed set-membership check.
 */
export const REACH_GATE_MIN_AFFINITY = 0.2;
