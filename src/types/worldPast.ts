/**
 * worldPast types — the thin past worldgen writes onto the graph (THR-1631 S1).
 *
 * The past is graph, never a GameState field (plan Lane decision 1): at most six event
 * nodes, at most ten deceased actors, existing edge types, `foundedYearsAgo` on every
 * settlement and descent on about a quarter of the mortals living on a dead empire's
 * land. These types describe what `readWorldPast` reads back, as structured records —
 * the words are S2's (UI Law 2: the producer declares concepts, the surface words them).
 *
 * Plan: `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md`.
 */

/** `eventType` values the pass writes. `eventType` is an untyped property string. */
export type WorldPastEventType = 'past_elder_war' | 'past_war';

/** What a seeded dead actor was, in life. */
export type WorldPastRole = 'founder' | 'fallen_commander' | 'wonder_finder';

/** The provenance stamp every seeded dead actor carries. */
export const WORLD_PAST_ORIGIN = 'worldgen' as const;

/**
 * One stratum of a mortal's backstory — the first producer of `backstoryStrata`
 * (THR-1631 S1e). `ruins/clueLifecycle.ts` reads it to raise a descendant's chance of
 * receiving a clue about their ancestors' ruins.
 */
export interface WorldPastDescentStratum {
  /** The historical (dead-empire) culture node id. */
  cultureId: string;
  relation: 'descent';
}

export type ElderRuinArchetype = 'temple' | 'vault' | 'battlefield';

export interface WorldPastEmpire {
  cultureId: string;
  ruinCounts: Record<ElderRuinArchetype, number>;
}

export interface WorldPastElderWar {
  eventId: string;
  empireIds: [string, string];
  siteIds: string[];
  yearsAgo: number;
  /** The generated name (data internal to the event; S2 words it). */
  pastName?: string;
}

export interface WorldPastSettling {
  settlementId: string;
  yearsAgo: number;
  founderId?: string;
}

export interface WorldPastLivingWar {
  eventId: string;
  realmIds: [string, string];
  winnerId: string;
  loserId: string;
  burnedTownId?: string;
  fallenIds: string[];
  yearsAgo: number;
}

export interface WorldPastWonder {
  wonderId: string;
  finderId?: string;
  holderId?: string;
}

/** Everything the pass wrote, read back from the graph, unfogged. */
export interface WorldPastView {
  elderAge: { empires: WorldPastEmpire[]; war?: WorldPastElderWar };
  /** Realm seats (capitals) first, then oldest first; ties by id. */
  settling: WorldPastSettling[];
  livingMemory: WorldPastLivingWar[];
  wonders: WorldPastWonder[];
}

/** One place's record — the hook ruin content and the S2 page line read. */
export interface PlacePast {
  locationId: string;
  foundedYearsAgo?: number;
  founderId?: string;
  /** A ruin's dead empire. */
  empireId?: string;
  archetype?: ElderRuinArchetype;
  /** The past event this place fell in — set only where an engine fact backs it. */
  fellInEventId?: string;
  /** Seeded dead actors who lie here. */
  restingIds: string[];
}

/** The one worldgen trace the pass emits (the census reader checks it). */
export interface WorldPastSeededSummary {
  events: { elderWar: 0 | 1; livingWars: number };
  foundedSettlements: number;
  dead: Record<WorldPastRole, number>;
  descent: { mortals: number; candidates: number; byCulture: Record<string, number> };
  misses: {
    elderWar?: 'fewer_than_two_empires_with_battlefields';
    warsWithoutBurnedTown: string[];
    realmPairsAvailable: number;
  };
  durationMs: number;
}
