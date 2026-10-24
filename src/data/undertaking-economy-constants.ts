/**
 * Undertakings in the economy (THR-1937) — the tunables for what a mortal's economic
 * undertakings leave behind. Plan: `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md`
 * § Constants table.
 *
 * S1: a founded town gets a ruler and a founder's freehold, a founded lane is tolled by
 * its founder, a founded guild gets a calling. S3 (THR-1967): a trade run pays the
 * trader, the guild's founding cost, and the ambition milestones those works can meet.
 */
import type { ReachDomain } from '../types/traits';
import { TICKS_PER_DAY } from './attention-constants';

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

// ─── S3 — trade pay, the guild's cost, ambitions met by their own work (THR-1967) ──

/**
 * What founding a guild costs, on the 0–100 Means scale: the `create×faction` row of
 * mortal wealth's cost table (`MEANS_CELL_COST`). Charged only while founding costs are
 * on (`MEANS_CELL_COST_ENABLED`); the guild's purse opens with it.
 */
export const MEANS_CELL_COST_GUILD = 30;

/** Means a trade run pays on a lane that carried nothing yesterday. */
export const TRADE_RUN_PAY_BASE = 2;

/** Means a trade run pays per unit the lane carried yesterday (`carriedPerDay`). */
export const TRADE_RUN_PAY_PER_UNIT = 1;

/** Cap on one trade run's pay — one `MEANS_STEP`. */
export const TRADE_RUN_PAY_MAX = 6;

/**
 * One paid trade run per trader per day. An instant cell cannot fail, so a cell that
 * paid every time would be a farm (THR-1440); a second run inside this window pays
 * nothing, on any lane.
 */
export const TRADE_RUN_PAY_COOLDOWN_TICKS = TICKS_PER_DAY;

/** The trader's one number: the tick of their last paid trade run. */
export const TRADE_RUN_LAST_PAID_PROPERTY = 'lastTradeRunPaidTick';

/** Lanes held for Dominate Regional Trade's lanes milestone. */
export const DOMINATE_TRADE_LANES_MIN = 2;

/** Dominate Regional Trade's completion rule. The kill criterion's lever: 4 of 5. */
export const DOMINATE_TRADE_COMPLETION = { requires: 3, of: 5 } as const;

/** Means for Dominate Regional Trade's Means milestone. */
export const DOMINATE_TRADE_MEANS_TIER = 'Wealthy' as const;

/**
 * The founding-starvation floor: with trade pay on, founding costs on and the founding
 * patron on (THR-2008), foundings over 600 ticks must stay at least this share of
 * foundings with costs off, on every gate seed (`npm run measure:founding-starvation`).
 * It is the second predicate `MEANS_CELL_COST_ENABLED` needs, beside comfort pace.
 *
 * The S3 kill line's old lever, lowering `TRADE_RUN_PAY_MAX`, is retired (THR-2006:
 * trade pay does not move founding). If a gate seed still fails with the patron on,
 * the next lever is the town row of `MEANS_CELL_COST` (`create×location`), measured
 * against the same three arms.
 */
export const FOUNDING_STARVATION_FLOOR = 0.5;
