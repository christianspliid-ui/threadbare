/**
 * The food sink — food, store, growth and hunger (THR-1923, plan § Systems design 3).
 *
 * Sinks, not stockpiles: the store holds at most `STORE_DAYS` of need. A surplus fills the
 * store, then the growth meter (while below the cap); what is left is exportable. A deficit
 * drains the store, then the meter; both empty for `STARVE_DAYS` loses a person (never
 * below one). Pure: takes the meters, returns the new ones.
 */
import {
  FOOD_PER_PERSON,
  STORE_DAYS,
  GROWTH_BASE,
  GROWTH_PER_PERSON,
  STARVE_DAYS,
  SURPLUS_MIN_PER_DAY,
} from '../../data/settlement-economy-constants';

export interface FoodMeters {
  population: number;
  foodStore: number;
  growthProgress: number;
  starveDays: number;
  foodSurplusDays: number;
}

export interface FoodDayResult {
  readonly meters: FoodMeters;
  /** Food left after the store and the growth meter took their share. */
  readonly exportableFood: number;
  /** +1 a person gained, −1 a person lost, 0 neither. */
  readonly growth: -1 | 0 | 1;
  readonly need: number;
}

export function growthMeterSize(population: number): number {
  return GROWTH_BASE + GROWTH_PER_PERSON * population;
}

/** One day of the food sink. `foodIn` is the day's food yield plus yesterday's imports. */
export function runFoodDay(m: Readonly<FoodMeters>, foodIn: number, cap: number): FoodDayResult {
  const next: FoodMeters = { ...m };
  const need = m.population * FOOD_PER_PERSON;
  let food = foodIn - need;
  let growth: -1 | 0 | 1 = 0;
  if (food >= 0) {
    const storeCap = need * STORE_DAYS;
    const toStore = Math.max(0, Math.min(food, storeCap - next.foodStore));
    next.foodStore += toStore;
    food -= toStore;
    if (next.population < cap) {
      next.growthProgress += food;
      food = 0;
      const meter = growthMeterSize(next.population);
      if (next.growthProgress >= meter) {
        next.growthProgress -= meter;
        next.population += 1;
        growth = 1;
      }
    }
    next.starveDays = 0;
    next.foodSurplusDays = food > SURPLUS_MIN_PER_DAY ? next.foodSurplusDays + 1 : 0;
  } else {
    const take = Math.min(-food, next.foodStore);
    next.foodStore -= take;
    food += take;
    if (food < 0) {
      next.growthProgress = Math.max(0, next.growthProgress + food);
      if (next.growthProgress === 0) next.starveDays += 1;
    }
    if (next.starveDays >= STARVE_DAYS && next.population > 1) {
      next.population -= 1;
      next.starveDays = 0;
      growth = -1;
    }
    next.foodSurplusDays = 0;
    food = 0;
  }
  // The store never holds more than its days of need (a lost person shrinks the need).
  next.foodStore = Math.min(next.foodStore, next.population * FOOD_PER_PERSON * STORE_DAYS);
  return { meters: next, exportableFood: Math.max(0, food), growth, need };
}
