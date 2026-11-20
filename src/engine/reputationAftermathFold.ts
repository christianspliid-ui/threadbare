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
 * Returns the settled net and the correction to apply to the score so the sheet
 * agrees with the row (Law 56). The correction is zero when no earlier gain
 * or ending-step rise needs undoing.
 * The step-level deltas stay in the trace; the correction is traced on its own.
 */
export function settleLostEncounterReputation(args: {
  readonly priorNet: number;
  readonly stepNet: number;
}): { settledNet: number; correction: number } {
  const unsettled = args.priorNet + args.stepNet;
  const settled = Math.min(0, Math.min(0, args.priorNet) + args.stepNet);
  const correction = settled - unsettled;
  return {
    settledNet: Math.abs(settled) > REPUTATION_FOLD_EPSILON ? settled : 0,
    correction: Math.abs(correction) > REPUTATION_FOLD_EPSILON ? correction : 0,
  };
}
