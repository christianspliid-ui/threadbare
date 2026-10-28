/**
 * Hunger's stories are planted (THR-2040) — every number and row the larder planter reads.
 *
 * When a town goes hungry, one of its people is handed a hunger story; when its granaries
 * overflow, a plenty story. The planter (`src/engine/larderSeeds.ts`) runs inside the unrest
 * daily pass beside the granary riot and plants a `templateId` seed in the riot's shape.
 *
 * Weights are relative within a list. A seed only adds a story, so every weight is positive.
 * Left out: `encounter.realm.crowns_reckoning` (`requiresHold`) and the granary riot (its own
 * seed, `GRANARY_RIOT_TEMPLATE_ID`).
 *
 * Plan: Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md § Content, § Constants.
 */

/** Kill switch. `false` plants nothing — today exactly. */
export const LARDER_SEEDS_ENABLED = true;

/** The hungry day (`hungerDays`) on which a famine story is planted. The median hungry run is 4 days. */
export const FAMINE_SEED_DAY = 2;

/** At most one larder story per town this often (the riot's cadence). Shared by famine and glut. */
export const LARDER_SEED_COOLDOWN_DAYS = 10;

/** Glut: surplus days in a row before a town's grain has nowhere to go. */
export const PLENTY_MIN_SURPLUS_DAYS = 3;

/** Glut: the food balance a glutted town sits at or above. */
export const PLENTY_BALANCE_FLOOR = 0.75;

export interface LarderSeedRow {
  readonly templateId: string;
  readonly weight: number;
}

/** Scenes a hungry town tells. */
export const FAMINE_SEED_ROWS: readonly LarderSeedRow[] = [
  { templateId: 'encounter.aid_refugees', weight: 1.0 },
  { templateId: 'gold.famine.merchant_granaries', weight: 1.0 },
  { templateId: 'encounter.barter_survival', weight: 0.9 },
  { templateId: 'encounter.mend_fishing_nets', weight: 0.6 },
  { templateId: 'encounter.town.bell_at_the_exchange', weight: 0.6 },
  { templateId: 'encounter.forage_provisions', weight: 0.6 },
  { templateId: 'encounter.black_market_deal', weight: 0.5 },
  { templateId: 'encounter.pickpocket', weight: 0.4 },
];

/** Scenes a town with grain to spare tells. */
export const PLENTY_SEED_ROWS: readonly LarderSeedRow[] = [
  { templateId: 'encounter.harvest_bounty', weight: 1.0 },
  { templateId: 'encounter.market_day_festival', weight: 0.8 },
  { templateId: 'encounter.town.mill_lease_auction', weight: 0.6 },
  { templateId: 'encounter.town.tithe_barn_raid', weight: 0.6 },
  { templateId: 'encounter.festival_of_spheres', weight: 0.5 },
  { templateId: 'tavern.drinking_contest', weight: 0.5 },
  { templateId: 'encounter.grand_tournament', weight: 0.4 },
  { templateId: 'encounter.caravan_deal', weight: 0.4 },
  { templateId: 'encounter.foreign_trader', weight: 0.4 },
];
