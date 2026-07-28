/**
 * Essence Source taxonomy, tunable constants, and pure derivation helpers
 * (THR-611 — Divine Economy).
 *
 * Pure data + pure functions only — no graph access (that lives in
 * `src/engine/essenceSources.ts`). Every magic number is a named constant
 * (NFP #1); every derivation is deterministic (NFP #3).
 */

import type { SphereName } from '../types/index';
import type { SourceKind, SourceTier } from '../types/essenceSource';
import type { StockTier } from '../types/resource';
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

// ─── The essence bridge: mortal economy → divine economy (THR-618 P4) ────────
//
// A typed source is sustained by the land it stands on. The mortal resource web
// (THR-615) already derives a coarse `scarce | adequate | surplus` stock tier per
// resource per location; a source typed to a sphere reads the tiers of the goods
// that share that sphere — a shrine to Spirit lives off the pearls of its valley,
// a Matter ley-nexus off ore and stone. Surplus nurtures, scarcity withers.
//
// This is the "temple economies; bridges to essence" coupling named in
// `Docs/plans/2026-07-04-mortal-economy-resource-web.md` and the P4 deliverable of
// THR-618. It is deliberately a *drift*, not an income term: the economy moves the
// private sanctity scalar, and every downstream read stays on the existing tier
// derivation — no second income channel, nothing new for the player to read.

/**
 * Sanctity drift per tick at a fully-surplus (or fully-scarce) match. The signed
 * affinity score in [-1, 1] scales this, so a mixed larder drifts more slowly than
 * a uniform one. Small by design: the land shapes a source over seasons, while a
 * single Build action moves it by `SANCTITY_BUILD_PER_ACTION` (0.15) at once.
 */
export const ECON_SANCTITY_DRIFT_PER_TICK = 0.01;

/**
 * The land alone cannot push a source past this sanctity — deliberately below
 * `SANCTITY_FLOWERING_THRESHOLD`, so **a rich valley nurtures a source but only the
 * god's hand makes it flower**. Withering has no such floor: a starving land can
 * drain a source all the way to zero. The asymmetry is the point — the world can
 * take away more than it gives, which is what makes Build and Defend worth casting.
 */
export const ECON_SANCTITY_NURTURE_CEILING = 0.5;

/** Signed contribution of each stock tier to the weighted affinity score. */
export const ECON_STOCK_TIER_SCORE: Readonly<Record<StockTier, number>> = {
  scarce: -1,
  adequate: 0,
  surplus: 1,
};

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

// ─── Sustenance prose (baseline plain register, THR-609) ─────────────────────
//
// The player-facing read of the essence bridge. Appended to a location's
// Livelihood line when that location hosts a *discovered* typed source, so the
// economy and the divinity are read in one breath: what the land grows, and what
// that growing is doing to the holy thing standing in it. No numbers, no tiers
// named — the sentence is the whole signal.

/** Which way the land is pushing a source's sanctity. */
export type SustenancePolarity = 'nurturing' | 'steady' | 'withering';

interface SustenanceProse {
  nurturing: string;
  steady: string;
  withering: string;
}

/** Per-sphere sustenance prose, keyed by the source's `sphereAffinity`. */
export const SUSTENANCE_PROSE: Readonly<Partial<Record<SphereName, SustenanceProse>>> = {
  life: {
    nurturing: 'What grows here grows for the holy ground too. The place is thick with it.',
    steady: 'The land feeds the holy ground here at its own unhurried pace.',
    withering: 'The green has gone out of this place, and the holy ground has thinned with it.',
  },
  matter: {
    nurturing: 'The stone and metal of this place run deep, and the holy ground is heavy with them.',
    steady: 'The rock gives what it has always given, and the holy ground holds.',
    withering: 'The seams here are worked out. What was solid in the holy ground has gone brittle.',
  },
  spirit: {
    nurturing: 'The offerings come freely here, and the holy ground answers them.',
    steady: 'The rites are kept, no more and no less, and the holy ground keeps with them.',
    withering: 'Nothing is offered here any more. The holy ground has grown quiet and cold.',
  },
  mind: {
    nurturing: 'Word and learning move through this place, and the holy ground is sharp with them.',
    steady: 'What is known here is kept here, and the holy ground is no duller for it.',
    withering: 'The knowing has drained out of this place. The holy ground has forgotten something.',
  },
  force: {
    nurturing: 'Hard things are made and moved here, and the holy ground is braced by them.',
    steady: 'The strength of this place is neither growing nor spent, and the holy ground stands.',
    withering: 'The strength has left this place, and the holy ground sags without it.',
  },
  time: {
    nurturing: 'Old things surface here still, and the holy ground remembers further back for them.',
    steady: 'The past lies where it fell, and the holy ground keeps its own count.',
    withering: 'The old things are all lifted and sold. The holy ground has lost its depth of years.',
  },
  energy: {
    nurturing: 'Something bright runs under this place, and the holy ground burns clean with it.',
    steady: 'The current beneath is steady, and the holy ground draws its measure.',
    withering: 'The current beneath has guttered, and the holy ground has dimmed.',
  },
  entropy: {
    nurturing: 'Things rot richly here, and the holy ground feeds on the ending of them.',
    steady: 'The slow ruin of this place proceeds, and the holy ground takes its share.',
    withering: 'Even the rot has run out here. The holy ground has nothing left to unmake.',
  },
};

/** Fallback for sources typed to a sphere the resource web does not carry. */
export const SUSTENANCE_PROSE_FALLBACK: SustenanceProse = {
  nurturing: 'The land is generous with the holy ground here.',
  steady: 'The land and the holy ground here keep an even bargain.',
  withering: 'The land has turned thin, and the holy ground suffers for it.',
};

/**
 * Compose the sustenance sentence for a source. Fail-soft: an unknown sphere
 * (including the Foundation spheres, which no resource class carries) falls back
 * to the generic phrasing rather than rendering nothing.
 */
export function getSustenanceProse(
  sphere: SphereName | undefined,
  polarity: SustenancePolarity,
): string {
  const table = (sphere && SUSTENANCE_PROSE[sphere]) || SUSTENANCE_PROSE_FALLBACK;
  return table[polarity];
}
