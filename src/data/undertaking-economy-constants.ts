/**
 * Undertakings in the economy (THR-1937) — the tunables for what a mortal's economic
 * undertakings leave behind. Plan: `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md`
 * § Constants table.
 *
 * S1 (this file's first slice): a founded town gets a ruler and a founder's freehold, a
 * founded lane is tolled by its founder, a founded guild gets a calling. S2 and S3 add
 * the building map and the trade-run pay.
 */
import type { ReachDomain } from '../types/traits';

/**
 * Master switch and rollback lever. Off: founding writes only the town, a founded lane
 * has no toll holder, and a founded guild seeds as it did before THR-1937.
 */
export const UNDERTAKING_ECONOMY_ENABLED = true;

/**
 * Influence on the ruler's `controls` edge to a founded town. The faction purse's
 * tax-holder rule reads `influence` when two factions control one town
 * (`taxHolderOf`); a realm whose border holds the hex still wins by the purse's own rule.
 */
export const FOUNDED_TOWN_RULER_INFLUENCE = 0.5;

/**
 * How long a site where a founding found no free ground stays off the board for
 * `create × location`. The board can see a built-up neighbourhood but not water (its
 * eligibility hook has no tiles), so the first refusal marks the site and this keeps
 * the same doomed founding from being offered again until the world may have moved.
 */
export const FOUNDING_NO_GROUND_COOLDOWN_TICKS = 180;

/**
 * A founded guild's calling, by its founder's leading Reach (Law 58: one entry per
 * Reach; `null` is an entry). The value is a row of `GUILD_PLACE_AFFINITY`, so the
 * purse's guild work pays a founded guild like any town guild.
 */
export const FOUNDED_GUILD_TYPE_BY_REACH: Readonly<Record<ReachDomain, string | null>> = {
  gold: 'merchants',
  stone: 'builders',
  shadow: 'thieves',
  star: 'temples',
  veil: 'temples',
  eye: 'bankers',
  heart: 'artisans',
  iron: null,
};

/** How many of the founder's leading Reaches a founded guild's reach profile copies. */
export const FOUNDED_GUILD_REACH_COUNT = 2;

/** The fallback a lane's chronicle line reads when the lane carries no named good. */
export const FOUNDED_LANE_GOODS_FALLBACK = 'goods';
