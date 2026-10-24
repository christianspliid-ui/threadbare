// src/data/economy-shift-constants.ts
//
// THR-1953 (mortal wealth S3) — the world halves of the money-encounter outcome table.
// One `economy_shift` writes every quantity; each quantity keeps its own scale and its
// own named steps here, so a row reads "small / + / ++" whatever it moves.
// Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Content pillar (S3) and
// § Constants table (`HARVEST_BAND_SCALE`).

import type { UnifiedActionOutcome } from '../types/unifiedAction';

/** The world quantities `economy_shift` writes besides a mortal's Means. */
export type WorldEconomyQuantity = 'prosperity' | 'unrest' | 'stock' | 'lane_volume' | 'purse';

/** A quantity's named steps: the research table's small, `+` and `++`. */
export interface EconomyShiftSteps {
  readonly small: number;
  readonly step: number;
  readonly big: number;
}

/**
 * Named steps per world quantity, on that quantity's own scale.
 *
 * - **prosperity** (0–100, a tier is 20 wide): `+` is a fifth of a tier — the size of a
 *   holder's yield draw (`YIELD_DRAW_PROSPERITY_COST` 4) — so one scene nudges a town and
 *   a run of them moves its word.
 * - **unrest** (0–100 push, the drift pulls it back): the Means steps; a riot is `++`.
 * - **stock** (0–100 abundance per good): a deposit found or worked out. Staple rows use
 *   `harvestStockAmount(band)` instead (below).
 * - **lane_volume** (0–`TRADE_ROUTE_MAX_VOLUME` 10): `+` is one caravan run (`conduct_trade`
 *   adds 1), `++` an expansion (`ROUTE_RAISE_VOLUME_DELTA` 2). Whole numbers only: the daily
 *   lane-traffic settle (`phaseTradeRouteDecay`) steps volume by 1 toward an integer level,
 *   so a half-step would swing round its level every day and could sink below the floor.
 *   `small` is therefore one run, like `step`.
 * - **purse** (faction treasury, 0–`FACTION_TREASURY_CAP`): `+` is about two days of a
 *   regiment's upkeep (`ARMY_UPKEEP_PER_DAY.regiment` 2.5) — a levy, not a fortune.
 */
export const ECONOMY_SHIFT_STEPS: Readonly<Record<WorldEconomyQuantity, EconomyShiftSteps>> = {
  prosperity: { small: 2, step: 4, big: 8 },
  unrest: { small: 3, step: 6, big: 12 },
  stock: { small: 5, step: 10, big: 20 },
  lane_volume: { small: 1, step: 1, big: 2 },
  purse: { small: 2, step: 5, big: 10 },
};

/** Authoring shorthands: `amount: W_PROSPERITY.step` reads as the research table's `+`. */
export const W_PROSPERITY = ECONOMY_SHIFT_STEPS.prosperity;
export const W_UNREST = ECONOMY_SHIFT_STEPS.unrest;
export const W_STOCK = ECONOMY_SHIFT_STEPS.stock;
export const W_LANE = ECONOMY_SHIFT_STEPS.lane_volume;
export const W_PURSE = ECONOMY_SHIFT_STEPS.purse;

/** Every legal |amount| for a world quantity (content test). */
export function economyShiftNamedSteps(quantity: WorldEconomyQuantity): readonly number[] {
  const s = ECONOMY_SHIFT_STEPS[quantity];
  const named = [s.small, s.step, s.big];
  // Staple rows are band-scaled; their amounts are legal on the stock scale too.
  return quantity === 'stock' ? [...named, ...HARVEST_STOCK_AMOUNTS] : named;
}

/**
 * An encounter's staple write before the band scale — about a third of the god's
 * `LOC_BLESS_HARVEST_STOCK_DELTA` (25), because one mortal's good harvest is not a miracle.
 */
export const HARVEST_ENCOUNTER_BASE = 8;

/**
 * An encounter's staple write by band (plan § Constants table), replacing the god-scale
 * ±25 of `bless_harvest` for encounter use. Failure writes nothing; a critical failure
 * spoils some of what was there.
 */
export const HARVEST_BAND_SCALE: Readonly<Record<UnifiedActionOutcome, number>> = {
  critical_success: 1.5,
  success: 1,
  success_at_cost: 0.5,
  failure: 0,
  critical_failure: -0.5,
  contested_won: 1,
  contested_lost: 0,
};

/** The staple amount an outcome table writes at `band`: `HARVEST_ENCOUNTER_BASE × HARVEST_BAND_SCALE[band]`. */
export function harvestStockAmount(band: UnifiedActionOutcome): number {
  return Math.round(HARVEST_ENCOUNTER_BASE * (HARVEST_BAND_SCALE[band] ?? 0));
}

/** The non-zero |amounts| `harvestStockAmount` can produce (content test). */
const HARVEST_STOCK_AMOUNTS: readonly number[] = [
  ...new Set(
    (Object.keys(HARVEST_BAND_SCALE) as UnifiedActionOutcome[])
      .map(b => Math.abs(harvestStockAmount(b)))
      .filter(v => v > 0),
  ),
];

/** `stock`'s `good` keywords besides a resource id. */
export const STOCK_GOOD_STAPLE = 'staple';
export const STOCK_GOOD_DEPOSIT = 'deposit';

/**
 * A lane an encounter thins never drops below this volume. Severing a lane, or marking it
 * threatened, is the deferred lane-bound write (plan § Slices, Deferral); a money scene
 * slows a road, it does not close one.
 */
export const ENCOUNTER_LANE_VOLUME_FLOOR = 1;
