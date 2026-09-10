// src/data/worldgen-living-constants.ts

/**
 * Worldgen — Living World Constants (THR-1437)
 *
 * The tuning surface for `seedLivingWorld` — the tail pass that gives the starting
 * world the objects and relationships the systems read on tick 1. THR-1435 measured
 * a seeded world with 14 deciders and none of `owns`, `trades_with`,
 * `knows_secret_of` or `hostile_to`; every number here is one a later session raises
 * or zeroes without touching logic (NFP #1).
 *
 * Every pass is a number, and `0` disables it. (Territory had a `round_robin` kill
 * switch until THR-1155 made the Realm the only thing that can hold a town.)
 */

import type { ReachDomain } from '../types/traits';
import type { SublocationTag } from '../engine/settlementGenome/types';

/** How far a definition faction's home Location reaches for territory, in hexes — beyond it the culture's generic faction holds the ground. */
export const WORLDGEN_TERRITORY_MAX_HEXES = 10;

/** Lanes minted from each culture's capital to its nearest settlements — two gives the trade phases an object without a web nobody founded. */
export const WORLDGEN_TRADE_ROUTES_PER_CULTURE = 2;

/** The farthest a seeded lane reaches, in hexes (`TRADE_PARTNER_MAX_HEX_RANGE` is the in-run analogue). */
export const WORLDGEN_TRADE_ROUTE_MAX_HEXES = 8;

/** Places a gold-, stone- or heart-leaning protagonist holds at home — one freehold is a stake, not an estate. */
export const WORLDGEN_FREEHOLDS_PER_SPOTLIGHT = 1;

/** Which Place classes a seeded freehold may be — the two a mortal plausibly holds rather than occupies. */
export const WORLDGEN_FREEHOLD_PLACE_CLASSES: readonly SublocationTag[] = ['commerce', 'authority'];

/**
 * Leading Reaches that make a protagonist a plausible freeholder.
 *
 * Not in the plan's constants table — named here rather than inlined because it is
 * exactly the kind of literal NFP #1 exists to hoist, and because widening it is the
 * first tuning move if seeded freeholds read as too rare.
 */
export const WORLDGEN_FREEHOLD_LEADING_REACHES: readonly ReachDomain[] = ['gold', 'stone', 'heart'];

/** Possessions per protagonist, counting the hand-seeded starters — so `ind_0`…`ind_6` are untouched. */
export const WORLDGEN_POSSESSIONS_PER_SPOTLIGHT = 1;

/** A seeded `relates_to` at or below this sentiment is a standing quarrel the world begins with. */
export const WORLDGEN_QUARREL_SENTIMENT_MAX = -0.6;

/** Marks held between protagonists of one culture — one secret per culture is history, not a spy network. */
export const WORLDGEN_SEEDED_MARKS_PER_CULTURE = 1;

/** Armies mustered at each culture's capital — a capital nobody garrisons is a capital nothing defends. */
export const WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE = 1;

/** The garrison captain's Iron capability — the mercenary commander's value, so a captain reads as the same kind of person. */
export const WORLDGEN_GARRISON_CAPTAIN_IRON = 60;

/** The garrison captain's Gold capability — drives army size through `spawnArmy`'s faction-gold read. */
export const WORLDGEN_GARRISON_CAPTAIN_GOLD = 40;

/**
 * One reserved `mulberry32(seed + prime)` stream per pass (W2…W8).
 *
 * None is drawn today — every choice in `seedLivingWorld` is a sort. Reserved so a
 * later pass that *does* draw cannot perturb the streams already in use (the THR-1344
 * hygiene lesson).
 */
export const WORLDGEN_LIVING_PRIMES: readonly number[] = [
  60013, 60017, 60029, 60037, 60041, 60077, 60083,
];

/**
 * The whole tuning surface as one object, so a test (or a future CMS panel) can pass
 * overrides without reaching for module mocks.
 */
export interface LivingWorldConstants {
  WORLDGEN_TERRITORY_MAX_HEXES: number;
  WORLDGEN_TRADE_ROUTES_PER_CULTURE: number;
  WORLDGEN_TRADE_ROUTE_MAX_HEXES: number;
  WORLDGEN_FREEHOLDS_PER_SPOTLIGHT: number;
  WORLDGEN_FREEHOLD_PLACE_CLASSES: readonly SublocationTag[];
  WORLDGEN_FREEHOLD_LEADING_REACHES: readonly ReachDomain[];
  WORLDGEN_POSSESSIONS_PER_SPOTLIGHT: number;
  WORLDGEN_QUARREL_SENTIMENT_MAX: number;
  WORLDGEN_SEEDED_MARKS_PER_CULTURE: number;
  WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE: number;
  WORLDGEN_GARRISON_CAPTAIN_IRON: number;
  WORLDGEN_GARRISON_CAPTAIN_GOLD: number;
  WORLDGEN_LIVING_PRIMES: readonly number[];
}

export const LIVING_WORLD_DEFAULTS: LivingWorldConstants = {
  WORLDGEN_TERRITORY_MAX_HEXES,
  WORLDGEN_TRADE_ROUTES_PER_CULTURE,
  WORLDGEN_TRADE_ROUTE_MAX_HEXES,
  WORLDGEN_FREEHOLDS_PER_SPOTLIGHT,
  WORLDGEN_FREEHOLD_PLACE_CLASSES,
  WORLDGEN_FREEHOLD_LEADING_REACHES,
  WORLDGEN_POSSESSIONS_PER_SPOTLIGHT,
  WORLDGEN_QUARREL_SENTIMENT_MAX,
  WORLDGEN_SEEDED_MARKS_PER_CULTURE,
  WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE,
  WORLDGEN_GARRISON_CAPTAIN_IRON,
  WORLDGEN_GARRISON_CAPTAIN_GOLD,
  WORLDGEN_LIVING_PRIMES,
};
