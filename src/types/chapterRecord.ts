/**
 * ChapterRecord — a persistent, always-readable snapshot of a resolved encounter (THR-603).
 *
 * Resolved `UnifiedAction`s are pruned from `gameState.unifiedActions` after
 * `RESOLVED_ACTION_RETENTION_TICKS`, discarding their step outcomes, choices,
 * complications, and aftermath. The Chapter Ledger needs those to stay readable
 * for the whole run, so at orchestrator cleanup (before the prune) each resolving
 * encounter is distilled into this compact, self-contained record and appended to
 * `gameState.chapterArchive`.
 *
 * Deliberately lives in its own file rather than in `unifiedAction.ts` (278
 * importers) to keep its blast radius small. It imports one-way from
 * `unifiedAction.ts`.
 *
 * Prose is snapshotted here exactly as the player saw it (post-`enrichProse()`),
 * so the ledger never re-enriches on render — a resolved chapter reads identically
 * forever, even after the actor dies or the world moves on.
 */

import type {
  ActionScale,
  UnifiedActionOutcome,
  StepOutcome,
  EncounterAftermathSummary,
} from './unifiedAction';

/** A support-cast member or place present in a chapter, snapshotted by id+name. */
export interface ChapterParticipant {
  readonly id: string;
  readonly name: string;
  /** Support kind, snapshotted from the encounter's support binding. */
  readonly kind: 'actor' | 'location';
}

/** One resolved (or, for an active chapter, in-progress) step of a chapter. */
export interface ChapterStepRecord {
  readonly index: number;
  /** Display label, mirrors the live encounter stage adapter ("Step 2: dominion"). */
  readonly label: string;
  /** Enriched step narrative as the player read it while the step was live. */
  readonly narrativeProse: string;
  /** Enriched resolved-outcome afterimage (undefined for a still-active step). */
  readonly afterimageProse?: string;
  /** Step outcome band (undefined for a still-active step). */
  readonly outcome?: StepOutcome;
  /** Complication prose if a complication fired on this step (THR-20). */
  readonly complicationProse?: string;
  /** The player's own intervention on this step, if any — rendered as a "you whispered…" beat. */
  readonly choiceText?: string;
}

/**
 * A distilled, self-contained record of a resolved encounter chapter.
 * Active encounters are NOT stored here — the ledger reads those live from
 * `gameState.unifiedActions`. This archive holds resolved chapters only.
 */
export interface ChapterRecord {
  readonly actionId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly actorId: string;
  /** Snapshot — the actor may die or be pruned after the chapter closes. */
  readonly actorName: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly scale: ActionScale;
  readonly startTick: number;
  /** Tick the chapter resolved (for archived records) or the snapshot tick (for a live active chapter). */
  readonly resolvedTick: number;
  /**
   * Whether this chapter has finished. The archive holds resolved chapters only
   * (`resolved: true`); the ledger builds `resolved: false` view records on demand
   * from live active encounters via the same builder.
   */
  readonly resolved: boolean;
  /** Final outcome — present once resolved; absent for an active chapter. */
  readonly outcome?: UnifiedActionOutcome;
  /** Whether the actor was threaded (bonded to the ascendant) at resolution time. */
  readonly threaded: boolean;
  /** Support cast/places, snapshotted — enables the per-entity Chapters tab. */
  readonly participants: readonly ChapterParticipant[];
  /** Enriched opening/setup prose (the encounter's initiation narrative). */
  readonly openingProse: string;
  readonly steps: readonly ChapterStepRecord[];
  /** Enriched aftermath overview prose. */
  readonly aftermathProse?: string;
  /** Full aftermath summary (changes list, reactions) for the "what changed" panel. */
  readonly aftermathSummary?: EncounterAftermathSummary;
  /** Bridge to the graph event node (THR-143) — keeps graph traversal open. */
  readonly eventNodeId?: string;
}
