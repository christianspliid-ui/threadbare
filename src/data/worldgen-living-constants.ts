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

/**
 * How far a freeholder living outside a settlement looks for a Place to hold, in hexes
 * (THR-1588). Protagonists are placed over every Location — towers, roads, ruins — and
 * only settlements carry commerce or authority Places, so the fallback is the nearest
 * settlement that has one. The trade-lane reach, so a stake is never farther from home
 * than a lane would run.
 */
export const WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES = 8;

/** Possessions per protagonist, counting the hand-seeded starters — so `ind_0`…`ind_6` are untouched. */
export const WORLDGEN_POSSESSIONS_PER_SPOTLIGHT = 1;

/** A seeded `relates_to` at or below this sentiment is a standing quarrel the world begins with. */
export const WORLDGEN_QUARREL_SENTIMENT_MAX = -0.6;

/**
 * The most marks held between protagonists of one culture. A ceiling since THR-1630 — the
 * count itself is `WORLDGEN_MARKS_PER_PROTAGONIST` per hero; this keeps one culture from
 * becoming a spy network. `0` disables the pass.
 */
export const WORLDGEN_SEEDED_MARKS_PER_CULTURE = 6;

/** Armies mustered at each culture's capital — a capital nobody garrisons is a capital nothing defends. */
export const WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE = 1;

/** The garrison captain's Iron capability — the mercenary commander's value, so a captain reads as the same kind of person. */
export const WORLDGEN_GARRISON_CAPTAIN_IRON = 60;

/** The garrison captain's Gold capability — drives army size through `spawnArmy`'s faction-gold read. */
export const WORLDGEN_GARRISON_CAPTAIN_GOLD = 40;

// ─── The people web (THR-1630 S1) ──────────────────────────────────────────

/**
 * Whether the legacy random worldwide tie pass in `seedWorld` writes its edges. Its
 * dice are always rolled (the shared worldgen stream must not shift); only the write is
 * gated. Off: `seedTies` below replaces it with ties among neighbours.
 */
export const WORLDGEN_RANDOM_PROTAGONIST_TIES_ENABLED = false;

/** The legacy pass's per-pair chance of a tie — named, not changed. */
export const WORLDGEN_RANDOM_TIE_CHANCE = 0.3;

/** The legacy pass's strength floor and span (`floor + draw × span`) — named, not changed. */
export const WORLDGEN_RANDOM_TIE_STRENGTH_MIN = 0.3;
export const WORLDGEN_RANDOM_TIE_STRENGTH_SPAN = 0.5;

/** A seeded tie's trust is its sentiment times this (Phase 0e's rule, shared by both passes). */
export const WORLDGEN_TIE_TRUST_FROM_SENTIMENT = 0.5;

/** Kin ties per named hero — one family member among the neighbours. */
export const WORLDGEN_KIN_PER_PROTAGONIST = 1;

/** Friend ties per named hero. */
export const WORLDGEN_FRIENDS_PER_PROTAGONIST = 1;

/** Rival ties per named hero — the tie most systems read. */
export const WORLDGEN_RIVALS_PER_PROTAGONIST = 1;

/** A kin tie's warmth. Family is warm on balance, not uncritically. */
export const WORLDGEN_KIN_SENTIMENT = 0.5;

/** A kin tie's weight — above any friend or rival, so `findHeir` (which reads strength) picks kin. */
export const WORLDGEN_KIN_STRENGTH = 0.8;

/** Friend warmth, drawn uniformly in [min, max]. */
export const WORLDGEN_FRIEND_SENTIMENT_RANGE: readonly [number, number] = [0.3, 0.8];

/** Rival coldness, drawn uniformly in [min, max]; at or below `WORLDGEN_QUARREL_SENTIMENT_MAX` it becomes an old quarrel. */
export const WORLDGEN_RIVAL_SENTIMENT_RANGE: readonly [number, number] = [-0.8, -0.3];

/** How far a hero whose home is not a settlement looks for neighbours, in hexes (same culture). */
export const WORLDGEN_TIE_FALLBACK_MAX_HEXES = 6;

/** The S1 gate's floor: co-resident tied pairs per hero who has a tie pool. A test constant, not a writer's. */
export const WORLDGEN_TIES_MIN_PER_PROTAGONIST = 2;

/** Favours a hero with a faction owes a fellow member at game start. */
export const WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST = 1;

/** A seeded favour's size. */
export const WORLDGEN_FAVOR_MAGNITUDE = 0.5;

/**
 * The warmth and weight of the friendship pair a seeded favour adds when the two have no
 * tie yet — `phaseSecretsFavors` drift needs a positive tie to read. Fixed, not drawn:
 * the favours pass sorts.
 */
export const WORLDGEN_FAVOR_FRIENDSHIP_SENTIMENT = 0.4;
export const WORLDGEN_FAVOR_FRIENDSHIP_STRENGTH = 0.4;

/** Seeded secrets per named hero (floored; at least one when any culture holds two heroes). */
export const WORLDGEN_MARKS_PER_PROTAGONIST = 0.33;

// ─── One notable in every settlement (THR-1630 S2, THR-1654) ────────────────

/**
 * Seeded notables per settlement, by settlement class — one resident of each promoted to
 * the notable tier with a holding, an old quarrel and a secret or favour. One everywhere:
 * THR-1592 measured two per settlement at +12–13% tick cost against a +10% line, so city
 * and capital stay at one until re-measured. `0` for a class skips it (the kill criterion's
 * first move is hamlets and camps).
 */
export const NOTABLES_PER_SETTLEMENT: Readonly<Record<string, number>> = {
  capital: 1,
  city: 1,
  town: 1,
  hamlet: 1,
  camp: 1,
  farmland: 1,
};

/** The origin stamp on a seeded notable (`properties.notableOrigin`) — what the local-agenda roster reads. */
export const NOTABLE_ORIGIN_WORLDGEN = 'worldgen';

/** How far a seeded notable's old quarrel reaches for a decider, in hexes — beyond it the quarrel is with the neighbouring notable. */
export const WORLDGEN_NOTABLE_QUARREL_MAX_HEXES = 8;

/** How far a seeded notable's secret or favour reaches for a decider, in hexes. */
export const WORLDGEN_NOTABLE_TIE_MAX_HEXES = 12;

/** A seeded notable's secret size — at the undertaking default, above `SECRET_DECAY_THRESHOLD`. */
export const WORLDGEN_NOTABLE_MARK_MAGNITUDE = 0.5;

/** A seeded notable's favour size — what a decider owes them. */
export const WORLDGEN_NOTABLE_FAVOR_MAGNITUDE = 0.5;

/**
 * Place classes a seeded notable's holding is chosen from, in preference order; any
 * other unheld Place is the last resort. The wealthiest resident holds a shop or a seat.
 */
export const WORLDGEN_NOTABLE_HOLDING_PLACE_CLASSES: readonly SublocationTag[] = ['commerce', 'authority'];

/**
 * One reserved `mulberry32(seed + prime)` stream per pass (W2…W8), then one per pass
 * that draws (append only — never reuse or reorder).
 *
 * The first seven are not drawn — every choice in those passes is a sort. Reserved so a
 * later pass that *does* draw cannot perturb the streams already in use (the THR-1344
 * hygiene lesson). The eighth (60089) is `seedTies`' stream (THR-1630); the ninth (60091)
 * is `seedNotables`' — the notable's hydration (archetype, values, capabilities) draws.
 */
export const WORLDGEN_LIVING_PRIMES: readonly number[] = [
  60013, 60017, 60029, 60037, 60041, 60077, 60083, 60089, 60091,
];

/** Index into `WORLDGEN_LIVING_PRIMES` of `seedTies`' stream. */
export const WORLDGEN_TIES_PRIME_INDEX = 7;

/** Index into `WORLDGEN_LIVING_PRIMES` of `seedNotables`' stream (THR-1654). */
export const WORLDGEN_NOTABLES_PRIME_INDEX = 8;

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
  WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES: number;
  WORLDGEN_POSSESSIONS_PER_SPOTLIGHT: number;
  WORLDGEN_QUARREL_SENTIMENT_MAX: number;
  WORLDGEN_SEEDED_MARKS_PER_CULTURE: number;
  WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE: number;
  WORLDGEN_GARRISON_CAPTAIN_IRON: number;
  WORLDGEN_GARRISON_CAPTAIN_GOLD: number;
  WORLDGEN_LIVING_PRIMES: readonly number[];
  WORLDGEN_KIN_PER_PROTAGONIST: number;
  WORLDGEN_FRIENDS_PER_PROTAGONIST: number;
  WORLDGEN_RIVALS_PER_PROTAGONIST: number;
  WORLDGEN_KIN_SENTIMENT: number;
  WORLDGEN_KIN_STRENGTH: number;
  WORLDGEN_FRIEND_SENTIMENT_RANGE: readonly [number, number];
  WORLDGEN_RIVAL_SENTIMENT_RANGE: readonly [number, number];
  WORLDGEN_TIE_FALLBACK_MAX_HEXES: number;
  WORLDGEN_TIE_TRUST_FROM_SENTIMENT: number;
  WORLDGEN_RANDOM_TIE_STRENGTH_MIN: number;
  WORLDGEN_RANDOM_TIE_STRENGTH_SPAN: number;
  WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST: number;
  WORLDGEN_FAVOR_MAGNITUDE: number;
  WORLDGEN_FAVOR_FRIENDSHIP_SENTIMENT: number;
  WORLDGEN_FAVOR_FRIENDSHIP_STRENGTH: number;
  WORLDGEN_MARKS_PER_PROTAGONIST: number;
  NOTABLES_PER_SETTLEMENT: Readonly<Record<string, number>>;
  WORLDGEN_NOTABLE_QUARREL_MAX_HEXES: number;
  WORLDGEN_NOTABLE_TIE_MAX_HEXES: number;
  WORLDGEN_NOTABLE_MARK_MAGNITUDE: number;
  WORLDGEN_NOTABLE_FAVOR_MAGNITUDE: number;
  WORLDGEN_NOTABLE_HOLDING_PLACE_CLASSES: readonly SublocationTag[];
}

export const LIVING_WORLD_DEFAULTS: LivingWorldConstants = {
  WORLDGEN_TERRITORY_MAX_HEXES,
  WORLDGEN_TRADE_ROUTES_PER_CULTURE,
  WORLDGEN_TRADE_ROUTE_MAX_HEXES,
  WORLDGEN_FREEHOLDS_PER_SPOTLIGHT,
  WORLDGEN_FREEHOLD_PLACE_CLASSES,
  WORLDGEN_FREEHOLD_LEADING_REACHES,
  WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES,
  WORLDGEN_POSSESSIONS_PER_SPOTLIGHT,
  WORLDGEN_QUARREL_SENTIMENT_MAX,
  WORLDGEN_SEEDED_MARKS_PER_CULTURE,
  WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE,
  WORLDGEN_GARRISON_CAPTAIN_IRON,
  WORLDGEN_GARRISON_CAPTAIN_GOLD,
  WORLDGEN_LIVING_PRIMES,
  WORLDGEN_KIN_PER_PROTAGONIST,
  WORLDGEN_FRIENDS_PER_PROTAGONIST,
  WORLDGEN_RIVALS_PER_PROTAGONIST,
  WORLDGEN_KIN_SENTIMENT,
  WORLDGEN_KIN_STRENGTH,
  WORLDGEN_FRIEND_SENTIMENT_RANGE,
  WORLDGEN_RIVAL_SENTIMENT_RANGE,
  WORLDGEN_TIE_FALLBACK_MAX_HEXES,
  WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
  WORLDGEN_RANDOM_TIE_STRENGTH_MIN,
  WORLDGEN_RANDOM_TIE_STRENGTH_SPAN,
  WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST,
  WORLDGEN_FAVOR_MAGNITUDE,
  WORLDGEN_FAVOR_FRIENDSHIP_SENTIMENT,
  WORLDGEN_FAVOR_FRIENDSHIP_STRENGTH,
  WORLDGEN_MARKS_PER_PROTAGONIST,
  NOTABLES_PER_SETTLEMENT,
  WORLDGEN_NOTABLE_QUARREL_MAX_HEXES,
  WORLDGEN_NOTABLE_TIE_MAX_HEXES,
  WORLDGEN_NOTABLE_MARK_MAGNITUDE,
  WORLDGEN_NOTABLE_FAVOR_MAGNITUDE,
  WORLDGEN_NOTABLE_HOLDING_PLACE_CLASSES,
};
