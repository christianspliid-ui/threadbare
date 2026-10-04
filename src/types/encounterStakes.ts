/**
 * Encounter stakes — the authored parts of the stakes line and the result line (THR-1727).
 *
 * The **stakes line** opens an encounter: `[lead], [actor] must [goal] — or [risk].`
 * The **result line** closes it, built from the same parts plus the outcome band:
 * `[actor] [won].` / `[actor] [lost].` and so on.
 *
 * Kept in `types/` rather than beside the builder so `UnifiedActionTemplate` and
 * `UnifiedAction` can carry the fields without the type layer importing an engine
 * module. The builder lives in `src/engine/encounters/stakesLine.ts`.
 *
 * Plan: `Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md`
 */

import type { MotiveSource } from '../engine/encounters/motiveClassifier';

/** Past-tense endings, overridable per fork arm. */
export interface EncounterStakesEndings {
  /** Past tense of `goal`, for every winning band: "crossed the rotten toll bridge". */
  readonly won: string;
  /** Past tense of the template's authored plain-failure ending. */
  readonly lost: string;
  /**
   * Past tense of the authored critical-failure ending. Required when the template
   * authors a distinct `critical_failure` ending; otherwise `lost` stands in.
   */
  readonly lostBadly?: string;
}

export interface EncounterStakes extends EncounterStakesEndings {
  /** Bare verb phrase after "must": "cross the rotten toll bridge". Lowercase, no final period. */
  readonly goal: string;
  /** Bare verb phrase after "— or": the worst ending the encounter can reach. */
  readonly risk: string;
  /**
   * Per fork arm, keyed by the arm's `variants` key (`positive` / `negative` / a
   * route key). An arm that pursues a different goal carries its own endings, so
   * the result line names what the mortal actually did.
   */
  readonly arms?: Readonly<Record<string, Partial<EncounterStakesEndings>>>;
}

/**
 * Why the mortal is here, frozen when the encounter action starts (engine-side),
 * so the opening line and the result line share one lead whatever the motive
 * receipt says later.
 */
export interface StakesContext {
  /** Motive classification at encounter start; `null` when it could not be read. */
  readonly motiveSource: MotiveSource | null;
  /** Name of the errand behind a `mission` motive, when the graph could resolve one. */
  readonly missionName?: string;
  /** Place the `chance` lead names ("Passing through {location},"). */
  readonly locationId?: string;
  readonly locationName?: string;
}
