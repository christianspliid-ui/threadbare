/**
 * world-past-constants — every knob of the worldgen past pass (THR-1631 S1).
 *
 * One override bag (`WorldPastConstants`), the `LivingWorldConstants` pattern, so a test
 * can dial any count or range without touching the module (NFP #1). Plan § Constants:
 * `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md`.
 */

export type YearRange = readonly [number, number];

/** Settlement subtypes that carry a founding range. `ruins` covers every plain-ruin subtype. */
export type FoundingClass = 'capital' | 'city' | 'town' | 'hamlet' | 'farmland' | 'camp' | 'ruins';

export interface WorldPastConstants {
  /** The whole pass. `false` restores today's t0 exactly. */
  enabled: boolean;
  /** Hard cap on past event nodes: two per-tick scanners walk every event node. */
  eventsMax: number;
  /** Hard cap on seeded dead actors. */
  deadMax: number;
  /** How long ago the elder war was, in years. */
  elderAgeYears: YearRange;
  /** Founding age ranges per settlement class, in years. */
  foundingYears: Readonly<Record<FoundingClass, YearRange>>;
  /** Wars in living memory: drawn in [min, max], capped by the neighbour pairs available. */
  livingWars: { min: number; max: number };
  /** How long ago the living-memory wars were, in years. */
  livingMemoryYears: YearRange;
  /** Two Realms are neighbours when any two of their held settlements lie within this many hexes. */
  warMaxHexes: number;
  /** How far from the seats' midpoint a burned town may lie. */
  burnedTownMaxHexes: number;
  /** A fallen commander's `member_of.rank` (the member-of scale is 0–1). */
  commanderRank: number;
  /** Wonder finders written, at most. */
  wonderFindersMax: number;
  /** Share of mortals on dead-empire land given descent. */
  descentShare: number;
  /** S3 (THR-1657): `seek_revenge` ambitions minted from wars in living memory, at most. */
  revengeAmbitionsMax: number;
  /** S3: `chase_the_wonder` ambitions minted from wonders with a finder, at most. */
  wonderAmbitionsMax: number;
  /** S3: how far a hero may live from a wonder to want it, in hexes. */
  wonderPullMaxHexes: number;
  /**
   * S3: the harm a fallen commander's death opens as a grievance on their kin — a named
   * death (`HARM_MAGNITUDE_BY_CLASS.named_death`), so the drive opens at full heat and
   * cools on the ordinary grievance clock.
   */
  revengeHarmMagnitude: number;
  /** S3: the grievance's chain depth — one step, the dead commander's drive passed to kin. */
  revengeChainDepth: number;
}

export const WORLD_PAST_DEFAULTS: WorldPastConstants = {
  enabled: true,
  eventsMax: 6,
  deadMax: 10,
  elderAgeYears: [700, 1100],
  foundingYears: {
    capital: [350, 500],
    city: [200, 380],
    town: [80, 260],
    hamlet: [20, 160],
    farmland: [20, 160],
    camp: [1, 20],
    ruins: [60, 300],
  },
  livingWars: { min: 2, max: 3 },
  livingMemoryYears: [8, 45],
  warMaxHexes: 8,
  burnedTownMaxHexes: 10,
  commanderRank: 0.6,
  wonderFindersMax: 4,
  descentShare: 0.25,
  revengeAmbitionsMax: 2,
  wonderAmbitionsMax: 2,
  wonderPullMaxHexes: 12,
  revengeHarmMagnitude: 1.0,
  revengeChainDepth: 1,
};

/** The pass's own PRNG offset — unused anywhere else in the repo (re-grepped at build). */
export const WORLDGEN_PAST_PRIME = 101363;

// Flat aliases, so each plan-named constant is greppable by its own name.
export const WORLDGEN_PAST_ENABLED = WORLD_PAST_DEFAULTS.enabled;
export const WORLDGEN_PAST_EVENTS_MAX = WORLD_PAST_DEFAULTS.eventsMax;
export const WORLDGEN_PAST_DEAD_MAX = WORLD_PAST_DEFAULTS.deadMax;
export const WORLDGEN_PAST_ELDER_AGE_YEARS = WORLD_PAST_DEFAULTS.elderAgeYears;
export const WORLDGEN_PAST_FOUNDING_YEARS = WORLD_PAST_DEFAULTS.foundingYears;
export const WORLDGEN_PAST_LIVING_WARS = WORLD_PAST_DEFAULTS.livingWars;
export const WORLDGEN_PAST_LIVING_MEMORY_YEARS = WORLD_PAST_DEFAULTS.livingMemoryYears;
export const WORLDGEN_PAST_WAR_MAX_HEXES = WORLD_PAST_DEFAULTS.warMaxHexes;
export const WORLDGEN_PAST_BURNED_TOWN_MAX_HEXES = WORLD_PAST_DEFAULTS.burnedTownMaxHexes;
export const WORLDGEN_PAST_COMMANDER_RANK = WORLD_PAST_DEFAULTS.commanderRank;
export const WORLDGEN_PAST_WONDER_FINDERS_MAX = WORLD_PAST_DEFAULTS.wonderFindersMax;
export const WORLDGEN_PAST_DESCENT_SHARE = WORLD_PAST_DEFAULTS.descentShare;
export const WORLDGEN_PAST_REVENGE_AMBITIONS_MAX = WORLD_PAST_DEFAULTS.revengeAmbitionsMax;
export const WORLDGEN_PAST_WONDER_AMBITIONS_MAX = WORLD_PAST_DEFAULTS.wonderAmbitionsMax;
export const WORLDGEN_PAST_WONDER_PULL_MAX_HEXES = WORLD_PAST_DEFAULTS.wonderPullMaxHexes;

/** Elder war names, drawn once at worldgen and stored on the event as `pastName`. */
export const WORLD_PAST_ELDER_WAR_NAMES: readonly string[] = [
  'the Breaking',
  'the Long Fall',
  'the Sundering',
  'the Ashen Years',
  'the Last Siege',
];
