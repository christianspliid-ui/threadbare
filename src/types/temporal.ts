import type { ActorType } from './graph';

export interface SimulationClock {
  currentTick: number;
  ticksPerSeason: number;      // TICKS_PER_SEASON unless a tunable overrides it
  season: number;               // 0-3
  year: number;                 // 0-based; the top bar renders year + 1
}

/**
 * The calendar, in one place (THR-1452).
 *
 * Ruling 2026-09-10: **the engine's clock is canonical.** The top bar used to derive its
 * year as `tick / 120` while the season beside it came from a 90-tick engine season — four
 * seasons make 360, not 120, so the two halves of one readout disagreed by threefold and
 * diverged without bound (at tick 360 the engine read year 1 and the bar read year 4).
 *
 * The engine's side won because the season was never in dispute: it is already the engine's
 * and already on screen, so adopting the UI's divisor would have had to *move the season* to
 * fix a year nobody had validated — and it would have made a season 2.5 in-game days. Adopting
 * the engine's is a pure read of a value already computed every tick, and it changes no
 * simulation behaviour: `clock.season` has exactly one production reader (the top bar) and
 * `clock.year` had none.
 *
 * Every tick-to-calendar conversion goes through `deriveSeasonAndYear`. Three call sites used
 * to spell this arithmetic themselves — the orchestrator with inline literals, `TemporalController`
 * with a private copy of the constant, and the top bar with a divisor of its own — which is how
 * they drifted apart in the first place.
 */
export const TICKS_PER_SEASON = 90;

/** Four seasons make a year, so a year is `TICKS_PER_SEASON * SEASONS_PER_YEAR` = 360 ticks. */
export const SEASONS_PER_YEAR = 4;

/**
 * Convert a tick index into the calendar. The single conversion in the codebase.
 *
 * `ticksPerSeason` is read from the live clock rather than the constant so the
 * `DEFAULT_TICKS_PER_SEASON` CMS tunable actually moves the calendar — before THR-1452 the
 * orchestrator divided by a literal 90 and the slider silently did nothing (NFP #1).
 * Fail-soft (NFP #4): a missing or nonsensical `ticksPerSeason` falls back to the constant
 * rather than producing `Infinity`/`NaN` in a readout.
 */
export function deriveSeasonAndYear(
  tick: number,
  ticksPerSeason: number = TICKS_PER_SEASON,
): { season: number; year: number } {
  const perSeason = Number.isFinite(ticksPerSeason) && ticksPerSeason > 0
    ? ticksPerSeason
    : TICKS_PER_SEASON;
  const totalSeasons = Math.floor(tick / perSeason);
  return {
    season: totalSeasons % SEASONS_PER_YEAR,
    year: Math.floor(totalSeasons / SEASONS_PER_YEAR),
  };
}

export interface ActionInProgress {
  actionId: string;             // unique instance ID
  actorId: string;
  templateId: string;           // action template node ID
  targetId: string;             // target node ID
  domain: string;               // which Reach domain
  startTick: number;
  duration: number;             // total ticks to complete
  progress: number;             // current progress (0 to duration)
  encounterId?: string;         // if this action spawned an encounter
  resolved?: boolean;           // true once resolution ran
  outcome?: string;             // outcome from resolution system (success|failure|etc)
}

/** AP budgets by actor type (from design doc) */
export const BASE_AP: Record<ActorType, number> = {
  god: 1,
  ascendant: 2,
  faction: 3,
  culture: 2,
  group: 2,
  individual: 1,
};

export type SimulationSpeed = 0 | 1 | 2 | 3 | 5; // 0 = paused

export interface TickResult {
  tick: number;
  completedActions: string[];     // action IDs that resolved this tick
  newSeason: boolean;
}
