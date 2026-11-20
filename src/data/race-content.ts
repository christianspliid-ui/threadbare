/**
 * The race — which clock lands first at this pace (THR-2251, ticket 1 of
 * `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md`).
 *
 * The thresholds and every player-facing sentence, side by side. The engine module is
 * `src/engine/raceForecast.ts`. No numeral reaches the player from here (Law 13): the
 * paces and projected end ticks stay in the `mandate.race_turned` trace and
 * `window.__DEBUG.getRace()`. The word "race" names the module only — no player
 * sentence says it.
 */
import { TICKS_PER_DAY } from './attention-constants';
import type { RaceState } from '../types/mandate';

// ── Thresholds ───────────────────────────────────────────────────────────────

/** One sample a day. */
export const RACE_SAMPLE_EVERY_TICKS = TICKS_PER_DAY;
/** Fifteen days of pace, a sixth of a 1,080-tick age. */
export const RACE_WINDOW_SAMPLES = 15;
/** Below this many samples the race stays hidden. */
export const RACE_MIN_SAMPLES = 5;
/** Hidden before Doom's Signs stage. */
export const RACE_SHOW_FROM_DOOM = 0.2;
/** Ends this near, as a share of the time left to Doom, read "close". */
export const RACE_CLOSE_SHARE = 0.15;
/** A Mandate rise across the window at or below this reads as no rise (no division). */
export const RACE_STALL_EPSILON = 0.0001;
/** A new state must be the computed state this long in a row before it shows. */
export const RACE_TURN_HOLD_TICKS = 2 * TICKS_PER_DAY;
/** Census ceiling on turns per seed (ticket 3 of the plan). */
export const RACE_MAX_TURNS_PER_AGE = 3;

// ── Sentences (≤ 15 words each, sheet words only) ────────────────────────────

/** The forecast line per shown state. `hidden` has none (the surfaces keep today's text). */
export const RACE_FORECAST_LINES: Readonly<Record<Exclude<RaceState, 'hidden'>, string>> = {
  mandate_first: 'At this pace, your Mandate is fulfilled before Doom ends the age.',
  doom_first: 'At this pace, Doom ends the age before your Mandate is fulfilled.',
  close: 'At this pace, your Mandate and Doom finish close together.',
  stalled: 'Your Mandate has not risen lately. At this pace, Doom ends the age first.',
};

/** The folded rail row's word per shown state (ticket 2 renders it as "Goal · {word}"). */
export const RACE_RAIL_WORDS: Readonly<Record<Exclude<RaceState, 'hidden'>, string>> = {
  mandate_first: 'Lands first',
  doom_first: 'Doom lands first',
  close: 'Close finish',
  stalled: 'Doom lands first',
};

/** The turn alert's lead, before the forecast sentence. */
export const RACE_TURN_LEAD = 'How the age ends has shifted.';
/** The first-sight alert's lead (once per age — never "shifted"). */
export const RACE_FIRST_SIGHT_LEAD = 'Now you can see how the age ends.';

/** Chapter lever. `{Sphere}` and `{Mortal}` are filled; the fallbacks below cover gaps. */
export const RACE_LEVER_CHAPTER = 'Spend {Sphere} essence on {Mortal}\'s chapters to raise your Mandate.';
/** Chapter lever with no mortal name. */
export const RACE_LEVER_CHAPTER_NO_MORTAL = 'Spend {Sphere} essence on the chapters of a mortal bound to you.';
/** Chapter lever with no sphere name. */
export const RACE_LEVER_CHAPTER_NO_SPHERE = 'Spend essence on {Mortal}\'s chapters to raise your Mandate.';
/** Chapter lever with neither name. */
export const RACE_LEVER_CHAPTER_BARE = 'Spend essence on the chapters of a mortal bound to you.';
/** Stay lever (the surfaces add THR-2240's "Stay it" button beside it). */
export const RACE_LEVER_STAY = 'Stay the Unmaking to slow Doom.';

/** The forecast sentence for a shown state, or `null` for `hidden` / an unknown state (Law 43). */
export function raceForecastLine(state: RaceState | string | undefined): string | null {
  if (!state || state === 'hidden') return null;
  return (RACE_FORECAST_LINES as Record<string, string>)[state] ?? null;
}

/** The chapter lever sentence, with the plan's fallback grammar for a missing name. */
export function raceChapterLeverLine(sphereWord: string | undefined, mortalName: string | undefined): string {
  const sphere = sphereWord?.trim();
  const mortal = mortalName?.trim();
  if (sphere && mortal) return RACE_LEVER_CHAPTER.replace('{Sphere}', sphere).replace('{Mortal}', mortal);
  if (sphere) return RACE_LEVER_CHAPTER_NO_MORTAL.replace('{Sphere}', sphere);
  if (mortal) return RACE_LEVER_CHAPTER_NO_SPHERE.replace('{Mortal}', mortal);
  return RACE_LEVER_CHAPTER_BARE;
}
