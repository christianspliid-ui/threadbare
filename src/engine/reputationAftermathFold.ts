/**
 * THR-1789 — one reputation row per mortal per encounter.
 *
 * A step can move the actor's `reputationScore` through three producers in
 * `unifiedActionResolution.ts` (the authored shift, the branch checkpoint's
 * judgement, and the residual the snapshot diff catches), and a chapter runs
 * several steps. Each producer used to append its own `kind: 'reputation'`
 * change, so warm round 1 read six identical rows for one mortal's single
 * quantity. The residual also reported the step's *total*, counting the
 * authored and branch movement a second time.
 *
 * The fold reuses THR-1467's growth pattern. The ending states the **net**
 * movement under one stable id, and the step that folds supersedes the prior
 * change. Pure helpers, so the arithmetic is testable without a world.
 */

import type { EncounterAftermathChange, UnifiedActionOutcome } from '../types/unifiedAction';
import { DEFAULT_REPUTATION, REPUTATION_DECAY_PER_TICK } from '../types/disposition';

/** Below this, a reputation movement is rounding noise and draws no row. */
export const REPUTATION_FOLD_EPSILON = 0.0001;

/** The one change id an action's reputation row keeps for `actorId`, every step. */
export function reputationFoldId(actionId: string, actorId: string): string {
  return `${actionId}:reputation:${actorId}`;
}

/**
 * Split one step's measured reputation movement into its producers.
 *
 * `total` is the snapshot diff, which already contains the authored and branch
 * shifts. So the residual is what is left after them, never the total itself.
 * A part under the epsilon is zero, as the producers' own guards always were.
 *
 * The parts always sum to the measured `total` (Law 56). A shift the score's
 * [0, 1] clamp swallowed is cancelled by a negative residual. So a mortal
 * already at the ceiling gets no "rose" row for a rise the sheet never shows.
 */
export function stepReputationParts(args: {
  readonly authored: number;
  readonly branch: number;
  readonly total: number;
}): { authored: number; branch: number; residual: number; net: number } {
  const authored = Math.abs(args.authored) > REPUTATION_FOLD_EPSILON ? args.authored : 0;
  const branch = Math.abs(args.branch) > REPUTATION_FOLD_EPSILON ? args.branch : 0;
  const unexplained = args.total - authored - branch;
  const residual = Math.abs(unexplained) > REPUTATION_FOLD_EPSILON ? unexplained : 0;
  const net = authored + branch + residual;
  return { authored, branch, residual, net: Math.abs(net) > REPUTATION_FOLD_EPSILON ? net : 0 };
}

/**
 * Fold this step's net movement into the action's accumulated reputation row.
 *
 * Returns the encounter's net so far, and the ids of the prior row that the new
 * change replaces. When `|net|` falls under the epsilon the caller pushes
 * nothing, and superseding the prior row removes it. Movements that cancel out
 * across steps leave no row on the ending.
 */
export function foldActorReputation(args: {
  readonly prior: readonly EncounterAftermathChange[] | undefined;
  readonly actionId: string;
  readonly actorId: string;
  readonly stepNet: number;
}): { net: number; supersededIds: string[]; hadPrior: boolean } {
  const id = reputationFoldId(args.actionId, args.actorId);
  const priorRows = (args.prior ?? []).filter(c => c.kind === 'reputation' && c.id === id);
  const net = priorRows.reduce((sum, c) => sum + (c.magnitude?.raw ?? 0), args.stepNet);
  return {
    net: Math.abs(net) > REPUTATION_FOLD_EPSILON ? net : 0,
    supersededIds: priorRows.map(c => c.id),
    hadPrior: priorRows.length > 0,
  };
}

/**
 * THR-2257 — the action outcomes the ending sentence calls "lost"
 * (`OUTCOME_SENTENCE_SHAPES` in `aftermathWords.ts`). A won-at-a-price ending is
 * not here: it is a win, and keeps the reputation its steps earned.
 */
export const LOST_ACTION_OUTCOMES: ReadonlySet<UnifiedActionOutcome> = new Set<UnifiedActionOutcome>([
  'failure',
  'critical_failure',
  'contested_lost',
]);

/** True when the ending reads "{actor} lost {encounter}". */
export function isLostActionOutcome(outcome: UnifiedActionOutcome | undefined): boolean {
  return outcome !== undefined && LOST_ACTION_OUTCOMES.has(outcome);
}

/**
 * THR-2257 — how much of an earlier step's gain can still be standing on the
 * score when the ending step begins.
 *
 * `phaseReputationDecay` pulls every mortal's score toward
 * `DEFAULT_REPUTATION` each tick and clamps there, so a gain taken several
 * ticks earlier may already be gone. Decay preserves the gap between the score
 * and where it would sit without the gain, until the clamp at neutral closes it:
 *
 * - Below neutral, the score has not met the clamp, so the whole gain stands.
 * - At or above neutral, at most the height above neutral can be the gain.
 *
 * Forfeiting more than this would leave the mortal below where an outright loss
 * would have, and the row would no longer match the sheet (review round 1).
 */
export function standingGainCap(scoreBeforeEndingStep: number): number {
  return scoreBeforeEndingStep < DEFAULT_REPUTATION
    ? Number.POSITIVE_INFINITY
    : scoreBeforeEndingStep - DEFAULT_REPUTATION;
}

/**
 * `ticks` runs of `decayReputation` (`disposition.ts`) in closed form. The
 * decay is linear toward `DEFAULT_REPUTATION` and stops there, so it never
 * crosses neutral and n runs equal one step of n × the rate, clamped.
 */
export function decayReputationOver(score: number, ticks: number): number {
  const drift = Math.max(0, ticks) * REPUTATION_DECAY_PER_TICK;
  if (score > DEFAULT_REPUTATION) return Math.max(DEFAULT_REPUTATION, score - drift);
  if (score < DEFAULT_REPUTATION) return Math.min(DEFAULT_REPUTATION, score + drift);
  return score;
}

/**
 * THR-2257 review round 2 — the gap between the actor's real score and the
 * score it would hold if no earlier step's gain had landed, as of `tick`.
 * `score` is the real score then. Stored on the action after each step that
 * moves reputation, and read by the lost ending to forfeit exactly the gain
 * still standing.
 */
export interface ReputationGainGap {
  readonly tick: number;
  readonly score: number;
  readonly gap: number;
}

/**
 * Carry a {@link ReputationGainGap} forward to `tick`. Both the real score and
 * the no-gain score decay on the same rule, so the gap survives decay intact
 * while both sit on one side of neutral and shrinks as the clamp at neutral
 * closes it. That crossing case is what {@link standingGainCap} cannot see.
 */
export function gainGapAt(record: ReputationGainGap, tick: number): number {
  const ticks = tick - record.tick;
  return decayReputationOver(record.score, ticks) - decayReputationOver(record.score - record.gap, ticks);
}

/**
 * The gap after a step that moved the encounter's net from `priorNet` to
 * `priorNet + stepNet`. The no-gain score moves only by the change in
 * `min(0, net)`, so the gap moves by the change in `max(0, net)`, on top of what
 * decay left of the earlier gap. Signed: a loss paid against a gain decay had
 * already erased leaves the no-gain score above the real one.
 */
export function nextReputationGainGap(args: {
  readonly prior: ReputationGainGap | undefined;
  readonly tick: number;
  /** The real score after this step. */
  readonly score: number;
  readonly priorNet: number;
  readonly stepNet: number;
}): ReputationGainGap {
  const carried = args.prior ? gainGapAt(args.prior, args.tick) : 0;
  const delta = Math.max(0, args.priorNet + args.stepNet) - Math.max(0, args.priorNet);
  return { tick: args.tick, score: args.score, gap: carried + delta };
}

/**
 * The forfeit cap for a lost ending. With a recorded gap, the gain still
 * standing is exactly that gap decayed to now. It is deliberately not bounded
 * by {@link standingGainCap}: across neutral that bound is the undercount this
 * record exists to fix. Without a record (an action from a save made before
 * it), {@link standingGainCap} is the fallback.
 */
export function lostEndingGainCap(args: {
  readonly record: ReputationGainGap | undefined;
  readonly tick: number;
  readonly scoreBeforeEndingStep: number;
}): number {
  if (!args.record) return standingGainCap(args.scoreBeforeEndingStep);
  return Math.max(0, gainGapAt(args.record, args.tick));
}

/**
 * THR-2257 — a lost encounter forfeits the reputation its earlier steps gained.
 *
 * Templates author roughly +0.02 on a step's success and −0.01 on its failure
 * (49 of them in `encounter-content.ts`). Step deltas apply as each step lands,
 * so "pass step 1, fail step 2" netted about +0.01 and the ending read "Seren
 * lost …" over "Seren's reputation rose a little", against the "At Stake" line
 * that promised a fall on failure. The rule lives here, not in the templates:
 *
 * - The earlier steps' net counts only if it was a loss (`min(0, priorNet)`).
 * - The ending step's own movement stays as it was.
 * - The settled net is never above zero: a lost encounter never reads "rose".
 *
 * `settledNet` is what the ending's row reports. `correction` (≤ 0) is what
 * to apply to the score: the ending step's own rise, if any, plus the earlier
 * gain, but only the part of it `gainCap` says can still be standing (decay may
 * have taken the rest). The step-level deltas stay in the trace; the
 * correction is traced on its own.
 */
export function settleLostEncounterReputation(args: {
  readonly priorNet: number;
  readonly stepNet: number;
  /** {@link standingGainCap} — omitted means the whole earlier gain stands. */
  readonly gainCap?: number;
}): { settledNet: number; correction: number } {
  const priorGain = Math.max(0, args.priorNet);
  const forfeited = Math.min(priorGain, Math.max(0, args.gainCap ?? Number.POSITIVE_INFINITY));
  const settled = Math.min(0, Math.min(0, args.priorNet) + args.stepNet);
  // The full correction undoes every earlier gain; give back the part decay already took.
  const correction = settled - (args.priorNet + args.stepNet) + (priorGain - forfeited);
  return {
    settledNet: Math.abs(settled) > REPUTATION_FOLD_EPSILON ? settled : 0,
    correction: correction < -REPUTATION_FOLD_EPSILON ? correction : 0,
  };
}
