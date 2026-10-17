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

/** Master switch for S1 and the rollback lever: false → no prayers, no faithful towns, no slights. */
export const PRAYER_ENABLED = true;

/** The god's band a town must read to pray (the decision). */
export const PRAYER_MIN_BAND: DominionBand = 'touched';

/** Days a prayer stays open (the decision). */
export const PRAYER_ANSWER_WINDOW_DAYS = 6;

/** Days between a town's prayers, counted from the prayer's opening; one game year. */
export const PRAYER_COOLDOWN_DAYS = 30;

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
