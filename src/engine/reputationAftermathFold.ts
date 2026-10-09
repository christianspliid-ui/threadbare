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

import type { EncounterAftermathChange } from '../types/unifiedAction';

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
 */
export function stepReputationParts(args: {
  readonly authored: number;
  readonly branch: number;
  readonly total: number;
}): { authored: number; branch: number; residual: number; net: number } {
  const authored = Math.abs(args.authored) > REPUTATION_FOLD_EPSILON ? args.authored : 0;
  const branch = Math.abs(args.branch) > REPUTATION_FOLD_EPSILON ? args.branch : 0;
  const unexplained = args.total - args.authored - args.branch;
  const residual = Math.abs(args.total) > REPUTATION_FOLD_EPSILON
    && Math.abs(unexplained) > REPUTATION_FOLD_EPSILON
    ? unexplained
    : 0;
  return { authored, branch, residual, net: authored + branch + residual };
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
