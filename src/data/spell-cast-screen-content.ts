/**
 * The step cast on screen — chip copy (THR-1670, the power runtime S2).
 *
 * One chip per graph write a step cast produced (`StepCastRecord.writes`), never
 * one for the intent to cast (Law 56). The cast itself is already on screen twice:
 * as the named odds line ("{actor} is casting {spell}") and as the cast line under
 * the step's afterimage. These chips are only for what the cast *changed*.
 *
 * Sentences are GM narration, sheet words, at most fifteen words. Slots:
 * `{caster}` `{spell}` `{target}` `{condition}` (lowercased) `{place}` `{item}`.
 * An unfilled slot is removed, never rendered (Law 43).
 *
 * Plan doc: Docs/plans/2026-09-29-thr-1571-power-runtime.md § UI pillar, S2 chips
 */

import type { EncounterAftermathCategory } from '../types/unifiedAction';

/** The kinds of cast chip — one per `StepCastWrite` reading. */
export type CastChipKind =
  | 'strain'
  | 'price_condition'
  | 'landed_condition'
  | 'backlash_condition'
  | 'cast_condition'
  | 'cast_condition_cost'
  | 'moved'
  | 'lifted'
  | 'silenced';

export interface CastChipCopy {
  readonly category: EncounterAftermathCategory;
  readonly direction: 'gain' | 'loss' | 'opens';
  readonly sentence: string;
}

export const CAST_CHIP_COPY: Readonly<Record<CastChipKind, CastChipCopy>> = {
  // The strain price — a scar on the caster (a timed thinning of one Reach).
  strain: {
    category: 'scar',
    direction: 'loss',
    sentence: '{caster} paid for {spell}, and is {condition} for a while.',
  },
  // A condition the price put on the caster (e.g. Hollow Crown's whispers).
  price_condition: {
    category: 'scar',
    direction: 'loss',
    sentence: '{spell} left its price on {caster}: {condition}.',
  },
  // A condition the landed spell put on its target.
  landed_condition: {
    category: 'boon',
    direction: 'gain',
    sentence: '{spell} leaves {target} {condition}.',
  },
  // THR-1683 — the cast channel: the spell's own lasting effects (an aura, a
  // conditional) held on the caster for a while. The condition is named for the
  // spell, so the sentence names the spell once and never lowercases it.
  cast_condition: {
    category: 'boon',
    direction: 'gain',
    sentence: '{spell} holds around {caster} for a while.',
  },
  // The same channel when what it holds weakens the caster (Last Breath's iron).
  cast_condition_cost: {
    category: 'scar',
    direction: 'loss',
    sentence: '{spell} leaves {caster} weaker for a while.',
  },
  // The spell turned on its caster.
  backlash_condition: {
    category: 'scar',
    direction: 'loss',
    sentence: '{spell} turned on {caster}: {condition}.',
  },
  // A teleport or forced move — a way opening, not a gain.
  moved: {
    category: 'path',
    direction: 'opens',
    sentence: '{spell} carries {target} to {place}.',
  },
  // A dispel lifted a bearing.
  lifted: {
    category: 'boon',
    direction: 'gain',
    sentence: '{spell} lifts something from {target}.',
  },
  // A dispel silenced a possession for a while.
  silenced: {
    category: 'boon',
    direction: 'gain',
    sentence: '{spell} silences {item} for a while.',
  },
};

/** Every cast chip id starts with this, so a caller can tell them apart. */
export const CAST_CHANGE_ID_PREFIX = 'cast-chip';
