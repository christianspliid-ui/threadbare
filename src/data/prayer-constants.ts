/**
 * Prayers and the faithful — tunables (THR-1935 S1).
 *
 * A hungry town on the god's ground prays; answering pushes the god's Dominion; a
 * town that recovers keeps faith — a `faithfulCommunity` essence source whose faith
 * rides its bread. An ignored prayer heads the rival's raid list. Every number the
 * slice reads lives here (NFP #1).
 *
 * The decided 30-day durations are kept and worded "a year" (plan choice 7): the
 * calendar runs 7.5-day seasons and 30-day years (`TICKS_PER_SEASON` 90).
 *
 * Plan: Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md § Constants.
 */
import type { DominionBand } from './dominion-content';
import { DOMINION_CHRONICLE_SIGNIFICANCE } from './dominion-content';
import { ECON_SANCTITY_NURTURE_CEILING } from './essence-sources';
import type { StockTier } from '../types/resource';

/** Master switch for S1 and the rollback lever: false → no prayers, no faithful towns, no slights. */
export const PRAYER_ENABLED = true;

/** The god's band a town must read to pray (the decision). */
export const PRAYER_MIN_BAND: DominionBand = 'touched';

/** Days a prayer stays open (the decision). */
export const PRAYER_ANSWER_WINDOW_DAYS = 6;

/** Days between a town's prayers, counted from the prayer's opening; one game year. */
export const PRAYER_COOLDOWN_DAYS = 30;

/**
 * Prayers the god can have open at once (calibration ruling 2026-10-17): the god hears
 * one prayer at a time, the hungriest town first.
 */
export const PRAYER_MAX_OPEN = 1;

/**
 * Days between any two prayers the god hears, counted opening to opening: one season, so
 * at most 12 in a 90-day run — the flood line (calibration ruling 2026-10-17).
 */
export const PRAYER_GOD_GAP_DAYS = 7.5;

/** One-shot Dominion push on answering, split across the god's bought spheres by points. */
export const ANSWERED_PRAYER_DOMINION_PRESSURE = 2;

/** One-shot Dominion push for aid to a hungry town off the god's ground. */
export const UNBIDDEN_AID_DOMINION_PRESSURE = 1;

/** Days after an answer in which recovery (losing Restless) forms a faithful town. */
export const PRAYER_RECOVERY_WINDOW_DAYS = 30;

/** Faithful towns a god can hold (§ Measurement: the richest god leaves the band at six). */
export const FAITHFUL_COMMUNITY_MAX = 4;

/** A new faithful town's faith: the land's nurture ceiling. */
export const FAITHFUL_INITIAL_SANCTITY = ECON_SANCTITY_NURTURE_CEILING;

/** Below this the faith reads "wavers" on the Covenants and place-page lines. */
export const FAITHFUL_WAVERING_SANCTITY = 0.2;

/** At or below this the faithful turn away: the source bag and the `controls` edge go. */
export const FAITHFUL_LAPSE_SANCTITY = 0;

/** How long an ignored town stays first on the rival's list. */
export const PRAYER_SLIGHT_DAYS = 10;

/** The economic scheme's `starve-faithful` crack drains this much faith. */
export const STARVE_FAITHFUL_SANCTITY_DRAIN = 0.25;

/**
 * Chronicle significance of the prayer lines — the Dominion daily lines' value (the
 * plan wrote "3" for that value; the constant it names is 0.4).
 */
export const PRAYER_CHRONICLE_SIGNIFICANCE = DOMINION_CHRONICLE_SIGNIFICANCE;

/** Kill line: prayers per seed in 90 days above this flood the player (plan § Kill criteria). */
export const PRAYER_FLOOD_LINE = 12;

/**
 * Location-target player templates that write staple stock + or unrest − but do not
 * answer a prayer, each with its reason. The completeness test (`answersPrayer.test.ts`)
 * holds every other such template to the `answers_prayer` flag.
 */
export const PRAYER_NON_ANSWERING: ReadonlyArray<{ readonly templateId: string; readonly reason: string }> = [];

/** The card flag (`progression.flags`) that marks a card as answering a prayer. */
export const ANSWERS_PRAYER_FLAG = 'answers_prayer';

// ─── S3 — the market cards and the two promises (THR-1969) ─────────────────

/** Bless the Holding: the blessed place's tax or holding income is multiplied by this (the decision). */
export const BLESS_HOLDING_YIELD_MULT = 1.5;

/** Bless the Holding lasts this many days: one game year (the decision; choice 7). */
export const BLESS_HOLDING_DAYS = 30;

/** The `blessed` edge's `kind` for a holding blessing; other blessings are not this. */
export const HOLDING_BLESSING_KIND = 'holding_yield';

/** Claim Resource pays in the claimed good's sphere (false → today's static `{ matter: 0.5 }`). */
export const CLAIM_RESOURCE_PAYS_GOOD = true;

/** Claim Resource's base income a tick, today's number, kept. */
export const CLAIM_RESOURCE_BASE_INCOME = 0.5;

/** Claim Resource's income by the claimed good's stock tier (the decision). */
export const CLAIM_RESOURCE_TIER_MULT: Readonly<Record<StockTier, number>> = {
  scarce: 0.5,
  adequate: 1,
  surplus: 1.5,
};

/** Days the thieves' guild boost lasts after Open the Markets' delay has passed. */
export const THIEVES_GUILD_OFFER_DAYS = 10;

/** Board multiplier on `create × faction` for a Shadow-led resident of a market-opened town. */
export const THIEVES_GUILD_OFFER_WANT = 1.5;

/** The cell the thieves' guild boost leans on. */
export const THIEVES_GUILD_OFFER_CELL_ID = 'cell.create.faction';

/** The property Open the Markets stamps on the town it opens. */
export const MARKETS_OPENED_TICK_PROP = 'marketsOpenedTick';
