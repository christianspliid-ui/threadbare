/**
 * Monster traces (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md`
 * § Tracing).
 *
 * Each is registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`,
 * `TraceEntry`) in the slice that first emits it: `monster.minted` and
 * `monster.hardened` in M1.
 */

import type { TraceBase } from '../trace';
import type { FightRatingWord } from '../fight';
import type { MonsterFamilyId } from '../monster';

/** Emitted once when `createNamedElite` writes a monster's card. */
export interface MonsterMintedTrace extends TraceBase {
  category: 'monster.minted';
  monsterId: string;
  lairId: string;
  family: MonsterFamilyId;
  dread: FightRatingWord;
  might: FightRatingWord;
  clockSize: number;
  /** The temper trait id the edge points at, or `''` when the definition was missing. */
  temper: string;
  /** True when the lair had no creation sphere and the family fell back. */
  fellBack: boolean;
}

/** Emitted once when a lair goes legendary and its monster's card hardens. */
export interface MonsterHardenedTrace extends TraceBase {
  category: 'monster.hardened';
  monsterId: string;
  lairId: string;
  clockSize: number;
  dread: FightRatingWord;
}
