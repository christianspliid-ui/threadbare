/**
 * Target tier and population cap (THR-1923, plan § Resolution logic 2, 5).
 *
 * Size **and** power: a city needs a seat that pulls resources in, a capital needs a
 * realm's seat. Pure.
 */
import {
  CAPITAL_POP,
  CITY_POP,
  TOWN_POP,
  TOWN_MAX_POP,
  LAND_PER_HOME,
  LAND_HOUSING_MIN,
  PULL_HOMES,
  CENTRE_YIELD,
  SETTLEMENT_TIERS,
  type SettlementTier,
} from '../../data/settlement-economy-constants';

export interface TierInputs {
  readonly population: number;
  readonly realmSeat: boolean;
  readonly pulls: boolean;
}

export function targetTierOf(t: TierInputs): SettlementTier {
  if (t.realmSeat && t.population >= CAPITAL_POP) return 'capital';
  if (t.pulls && t.population >= CITY_POP) return 'city';
  if (t.population >= TOWN_POP) return 'town';
  return 'hamlet';
}

/** Rank on the tier ladder (hamlet 0 … capital 3); an unknown subtype reads as hamlet. */
export function tierRank(tier: string | undefined): number {
  const i = SETTLEMENT_TIERS.indexOf(tier as SettlementTier);
  return i < 0 ? 0 : i;
}

/** The tier one step from `current` toward `target`. */
export function stepToward(current: SettlementTier, target: SettlementTier): SettlementTier {
  const c = tierRank(current);
  const t = tierRank(target);
  if (t === c) return current;
  return SETTLEMENT_TIERS[c + (t > c ? 1 : -1)];
}

/**
 * Homes the land alone gives: one per `LAND_PER_HOME` food the centre and the best
 * `TOWN_MAX_POP` owned hexes can yield, never fewer than `LAND_HOUSING_MIN`.
 */
export function landHousingOf(ownedHexFood: readonly number[]): number {
  const best = [...ownedHexFood].sort((a, b) => b - a).slice(0, TOWN_MAX_POP)
    .reduce((sum, f) => sum + f, CENTRE_YIELD[0]);
  return Math.max(LAND_HOUSING_MIN, Math.round(best / LAND_PER_HOME));
}

/**
 * The population cap: land housing + housing buildings + pull homes; a settlement whose
 * seat does not pull tops out at `TOWN_MAX_POP`.
 */
export function populationCapOf(landHousing: number, buildingHomes: number, pulls: boolean, pullCount: number): number {
  const housing = landHousing + buildingHomes + (pulls ? PULL_HOMES * pullCount : 0);
  return pulls ? housing : Math.min(housing, TOWN_MAX_POP);
}
