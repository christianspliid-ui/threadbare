import type { UnifiedAction } from '../types/unifiedAction';
import type { EncounterNotification } from '../types/encounterVisibility';

/** Prune resolved unifiedActions older than this many ticks.
 *  Cooldowns are 5–15 ticks; 20 gives headroom without unbounded growth.
 *  Was 100 — caused O(agents × actions) quadratic tick cost at scale. */
export const RESOLVED_ACTION_RETENTION_TICKS = 20;

/**
 * Drop resolved actions past the retention window — except one an unresolved
 * notification still names (THR-1777).
 *
 * The aftermath on screen resolves the player's reaction against the live
 * action. Pruning it at 20 ticks while its notification lived on (to the
 * 50-tick notification trim) left every aftermath held open past that window,
 * and every warm start's, with nothing to answer: the player's choice failed.
 * Bounded: the notification trim caps the extra life.
 */
export function pruneResolvedActions(
  actions: readonly UnifiedAction[],
  notifications: readonly EncounterNotification[] | undefined,
  tick: number,
): UnifiedAction[] {
  const awaitingAnswer = new Set<string>();
  for (const notification of notifications ?? []) {
    if (!notification.resolved && notification.actionId) awaitingAnswer.add(notification.actionId);
  }
  return actions.filter(action =>
    !action.resolved
    || action.completedAtTick == null
    || tick - action.completedAtTick < RESOLVED_ACTION_RETENTION_TICKS
    || awaitingAnswer.has(action.actionId),
  );
}
