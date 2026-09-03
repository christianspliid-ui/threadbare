// src/data/grievance-prose.ts
//
// The words the reactive loop reaches the player in (THR-1298 slice 7).
//
// Kept apart from `grievance-constants.ts` on purpose: that file is tuning — numbers a
// designer moves to change how long a world holds a grudge — and this one is content.
// The thresholds live there and are imported here, so moving a threshold moves which
// word is on screen without either file learning the other's job.
//
// Nothing here renders a numeral. Heat is a real quantity in the engine and the player
// has no instrument that reads it, so it reaches them as one of three words; a grudge's
// cause is an enum in the graph and reaches them as a clause.

import { GRIEVANCE_HEAT_BAND_BURNING, GRIEVANCE_HEAT_BAND_HOT } from './grievance-constants';

/** How hot a vendetta burns, as the player reads it. */
export type GrievanceHeatWord = 'burning' | 'hot' | 'cooling';

/**
 * Heat → word.
 *
 * Fail-soft over the whole real line rather than over the 0–1 band alone: a heat that
 * somehow arrived above the ceiling reads `burning`, and a negative or non-finite one
 * reads `cooling`. A grievance that renders no word at all would be worse than one that
 * renders the mildest — the drive is on the board either way.
 */
export function getGrievanceHeatWord(heat: number | undefined): GrievanceHeatWord {
  if (typeof heat !== 'number' || !Number.isFinite(heat)) return 'cooling';
  if (heat >= GRIEVANCE_HEAT_BAND_BURNING) return 'burning';
  if (heat >= GRIEVANCE_HEAT_BAND_HOT) return 'hot';
  return 'cooling';
}

/**
 * Why blood stands between two agents, keyed by the provenance value on the
 * `hostile_to` edge.
 *
 * The keys span all three provenance spellings the graph actually carries (`cause`,
 * `reason`, `basis` — the divergence `grudgeEdge.ts` documents rather than migrates),
 * because the reader has to be honest about the edges that exist, not only the ones the
 * grievance lane writes.
 */
export const GRUDGE_CAUSE_CLAUSES: Readonly<Record<string, string>> = {
  group_engagement: 'they took the field against each other',
  grievance_cooled: 'an old wrong that never quite closed',
  mentorship_break: 'a teaching that ended badly',
  excommunicated: 'a name struck from the rolls',
  // THR-1388 — a rivalry, not a grudge: the owner is a chip beside the line, so the clause does not name them.
  covets: 'a holding one of them kept reaching for',
};

/**
 * The clause for an unclassified grudge.
 *
 * Not a fallback nobody sees: a feud declared by a notable writes `hostile_to` with no
 * provenance key at all, so this is the line those edges render — and it says the true
 * thing, which is that the sheet knows there is blood and not what spilled it.
 */
export const GRUDGE_CAUSE_CLAUSE_UNKNOWN = 'something neither of them speaks of';

/** Provenance value → clause, falling through to the unknown clause. */
export function getGrudgeCauseClause(provenance: string | undefined): string {
  if (!provenance) return GRUDGE_CAUSE_CLAUSE_UNKNOWN;
  return GRUDGE_CAUSE_CLAUSES[provenance] ?? GRUDGE_CAUSE_CLAUSE_UNKNOWN;
}
