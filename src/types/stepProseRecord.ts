/**
 * StepProseRecord — the replay record for one resolved encounter step (THR-636).
 *
 * Captured at the moment a step resolves (not re-rendered at view time): the
 * `enrichProse` placeholders ({ally}, {artifact}) resolve against live world
 * state, so re-rendering later could show a *different* past than the player
 * experienced. This record freezes the truth so the step navigator can replay
 * exactly what was on screen.
 *
 * Deliberately lives in its own file rather than in unifiedAction.ts (278
 * importers) to keep its blast radius small — same pattern as chapterRecord.ts.
 * It imports one-way from unifiedAction.ts (StepOutcome) and traits.ts (ReachDomain).
 *
 * Field names/shapes are aligned with `ChapterStepRecord` (chapterRecord.ts,
 * THR-603) — the two serve different moments (per-step capture on an *active*
 * encounter here, vs. capture-at-completion for the archive) but reuse the same
 * vocabulary so a resolved step reads identically in either surface.
 */

import type { StepOutcome } from './unifiedAction';
import type { ReachDomain } from './traits';

/**
 * Cap on retained step-prose records per action (drop-oldest on overflow).
 * Bounds memory on long/looping encounters; the navigator only ever shows the
 * steps that actually resolved, which is ≤ template step count in practice.
 */
export const STEP_PROSE_HISTORY_MAX = 24;

export interface StepProseRecord {
  /** 0-indexed step position, mirrors `UnifiedAction.currentStep`. */
  readonly index: number;
  /** Display label, mirrors the live encounter stage adapter ("Step 2: dominion"). */
  readonly label: string;
  /** Enriched step narrative as the player read it while the step was live. */
  readonly narrativeProse: string;
  /** Enriched resolved-outcome afterimage (may be absent if the template authored none). */
  readonly afterimageProse?: string;
  /** Raw step outcome — band + word derived at render via stepOutcomeToOutcomeBand. */
  readonly outcome: StepOutcome;
  /** Reach domain that was tested on this step. */
  readonly reach: ReachDomain;
  /** The player's own divine intervention on this step, if any. */
  readonly choiceId?: string;
  /** Human-readable label for the god-action taken (rendered as a "you whispered…" beat). */
  readonly choiceText?: string;
  /** Complication prose if a complication fired on this step (THR-20). */
  readonly complicationProse?: string;
  /** Tick the step resolved. */
  readonly tick: number;
}
