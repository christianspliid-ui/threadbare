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
/** THR-2254 — place lever. `{Place}` and `{Sphere}` are filled; the place is an `EntityLink`. */
export const RACE_LEVER_PLACE = 'Tend {Place} in {Sphere} to raise your Mandate.';
/** THR-2254 — place lever when the place has no name (no link). */
export const RACE_LEVER_PLACE_NO_NAME = 'Tend a place in {Sphere} to raise your Mandate.';
/** THR-2254 — place lever with no sphere word. */
export const RACE_LEVER_PLACE_NO_SPHERE = 'Tend {Place} to raise your Mandate.';
/** THR-2254 — place lever with neither name. */
export const RACE_LEVER_PLACE_BARE = 'Tend a place you hold to raise your Mandate.';
/** Stay lever (the surfaces add THR-2240's "Stay it" button beside it). */
export const RACE_LEVER_STAY = 'Stay the Unmaking to slow Doom.';

/** THR-2252 — the hover id on the rail word and the forecast sentence (`ui-content.ts`). */
export const RACE_TOOLTIP_ID = 'ui.race';

/** THR-2252 — warm recap lead when the race came into view during the warm-up (never "shifted"). */
export const RACE_RECAP_CAME_INTO_VIEW_LEAD = 'While you were away, how the age ends came into view.';
/** THR-2252 — warm recap lead when the shown state differs from the snapshot. */
export const RACE_RECAP_SHIFTED_LEAD = 'While you were away, how the age ends shifted.';

/** The rail word for a shown state, or `null` for `hidden` / an unknown state. */
export function raceRailWord(state: RaceState | string | undefined): string | null {
  if (!state || state === 'hidden') return null;
  return (RACE_RAIL_WORDS as Record<string, string>)[state] ?? null;
}

/** One run of the chapter lever: plain text, or the slot that carries a hover / link. */
export interface RaceLeverRun {
  text: string;
  slot?: 'sphere' | 'mortal' | 'place';
}

/**
 * THR-2252 — the chapter lever as runs, so the surfaces can hang the sphere hover and
 * the mortal's `EntityLink` on their words. Joined, it reads exactly
 * {@link raceChapterLeverLine}.
 */
export function raceChapterLeverRuns(sphereWord: string | undefined, mortalName: string | undefined): RaceLeverRun[] {
  const sphere = sphereWord?.trim();
  const mortal = mortalName?.trim();
  const template = sphere && mortal
    ? RACE_LEVER_CHAPTER
    : sphere ? RACE_LEVER_CHAPTER_NO_MORTAL : mortal ? RACE_LEVER_CHAPTER_NO_SPHERE : RACE_LEVER_CHAPTER_BARE;
  const runs: RaceLeverRun[] = [];
  const re = /\{(Sphere|Mortal)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) runs.push({ text: template.slice(last, m.index) });
    if (m[1] === 'Sphere' && sphere) runs.push({ text: sphere, slot: 'sphere' });
    if (m[1] === 'Mortal' && mortal) runs.push({ text: mortal, slot: 'mortal' });
    last = m.index + m[0].length;
  }
  if (last < template.length) runs.push({ text: template.slice(last) });
  return runs;
}

/**
 * THR-2254 — the place lever as runs (the sphere hover and the place's `EntityLink` hang
 * on their words). Joined, it reads exactly {@link racePlaceLeverLine}.
 */
export function racePlaceLeverRuns(sphereWord: string | undefined, placeName: string | undefined): RaceLeverRun[] {
  const sphere = sphereWord?.trim();
  const place = placeName?.trim();
  const template = place && sphere
    ? RACE_LEVER_PLACE
    : sphere ? RACE_LEVER_PLACE_NO_NAME : place ? RACE_LEVER_PLACE_NO_SPHERE : RACE_LEVER_PLACE_BARE;
  const runs: RaceLeverRun[] = [];
  const re = /{(Sphere|Place)}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) runs.push({ text: template.slice(last, m.index) });
    if (m[1] === 'Sphere' && sphere) runs.push({ text: sphere, slot: 'sphere' });
    if (m[1] === 'Place' && place) runs.push({ text: place, slot: 'place' });
    last = m.index + m[0].length;
  }
  if (last < template.length) runs.push({ text: template.slice(last) });
  return runs;
}

/** THR-2254 — the place lever sentence, with the fallback grammar for a missing name. */
export function racePlaceLeverLine(sphereWord: string | undefined, placeName: string | undefined): string {
  return racePlaceLeverRuns(sphereWord, placeName).map(r => r.text).join('');
}

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
