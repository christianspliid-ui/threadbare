/**
 * Ascendant Beats — Divine Cadence (THR-500)
 *
 * An *Ascendant Beat* is an encounter addressed to the player-god rather than
 * resolved between mortals. "The First" (`src/engine/meetingEncounter.ts`) is the
 * hand-wired archetype; this module defines the flat *state* the Director keeps
 * plus the lightweight beat *catalogue* it draws from.
 *
 * Load-bearing decision: `AscendantBeat` is **not** a new graph node type. Beat
 * *content* is authored as a `UnifiedActionTemplate` multi-step encounter (content
 * pillar — separate issues), and beat *state* is flat GameState. The Director only
 * decides *which* beat fires *when* and *offers* it; resolution flows through the
 * existing encounter pipeline.
 */

export type BeatKind =
  | 'spine'            // scripted onboarding
  | 'introduction'     // surface a generated culture/faction
  | 'investment'       // offer initial investment into actor/location/item/faction
  | 'selection'        // choose 1-of-N capability/path
  | 'delivery';        // wrap an existing branching encounter (THR-452 content)

/** Why a beat became eligible. Structured + serializable for traces + prose. */
export type BeatTriggerKind =
  | 'turn'               // turn >= minTurn
  | 'first_bonded'       // The First is bonded (+ turn >= minTurn)
  | 'settlement_visited' // the ascendant has visited a settlement (+ turn >= minTurn)
  | 'cadence';           // pool draw (interval since the last beat)

export interface BeatTrigger {
  readonly kind: BeatTriggerKind;
  /** Earliest turn this trigger may fire (default 0). */
  readonly minTurn?: number;
}

/**
 * A lightweight catalogue entry the Director can schedule. The rich, player-facing
 * content (prose, choice cards, aftermath effects) lives on the matching
 * `UnifiedActionTemplate` (`templateId`); this descriptor carries only what the
 * Director needs to *schedule* the beat.
 */
export interface BeatDefinition {
  readonly beatId: string;
  readonly kind: BeatKind;
  readonly trigger: BeatTrigger;
  /** UnifiedActionTemplate id the beat resolves into (optional in the foundation phase). */
  readonly templateId?: string;
  /** Action ids the beat is expected to unlock on resolution (catalogue metadata). */
  readonly grantsActionIds?: readonly string[];
  /** Relative draw weight within the pool (pool beats only; multiplies the kind weight; default 1). */
  readonly weight?: number;
}

export interface PendingBeat {
  readonly beatId: string;
  readonly kind: BeatKind;
  readonly offeredTurn: number;
  /** Resolved target/subject node ids the beat will operate on (e.g. the culture to introduce). */
  readonly boundNodeIds: readonly string[];
  /** Why it fired (for traces + prose). */
  readonly trigger: BeatTrigger;
}

export interface BeatRecord {
  readonly beatId: string;
  readonly kind: BeatKind;
  readonly resolvedTurn: number;
  /** Outcome-ladder rung id. */
  readonly outcome: string;
  readonly grantedActionIds: readonly string[];
  readonly seededNodeIds: readonly string[];
}

export interface AscendantBeatState {
  /** Index into the ordered spine; -1 once the spine is exhausted. */
  readonly spineCursor: number;
  /** At most one beat may be pending/offered at a time (BEAT_MAX_PENDING). */
  readonly pending: PendingBeat | null;
  /** Append-only record for inspectability + dedup. */
  readonly history: readonly BeatRecord[];
  /** Turn the last beat was offered (cadence gate). */
  readonly lastBeatTurn: number;
}
