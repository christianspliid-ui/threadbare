/**
 * Who is in a fight right now — both sides (THR-1558, plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` §6, "One live fight per mortal").
 *
 * The busy test everywhere else reads only an action's *actor*, so the other side of
 * a fight looked idle: free to take a new decision, to be marched off by its
 * company, or to be picked for a second duel. This set closes that leak. For every
 * unresolved action whose template carries a fight step, it holds the actor **and**
 * the opponent, keyed `fightState?.opponentId ?? targetId`:
 *
 * - `fightState` exists only after the nerve step, so a freshly spawned duel has none
 *   yet. A duel has no `opponentRef`, so its target *is* its opponent (plan doc 2
 *   §1), and the target is known from the spawn. The opponent is busy from the
 *   spawn, not from the first exchange.
 * - The template test is "carries a fight step anywhere", not "is on a fight step
 *   now", for the same reason: a fight's opening beats are still the fight.
 *
 * Readers: the decision phase's busy set, the company-march hold
 * (`runGroupMovement`) and the grudge trigger's own eligibility.
 *
 * Fail-soft: an unknown template reads as "not a fight"; nothing throws.
 */

import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { fightRoleOf } from './fightStepInputs';

/** Whether any step of the template is a fight step. */
export function templateHasFightStep(template: Pick<UnifiedActionTemplate, 'steps'> | undefined): boolean {
  const steps = template?.steps;
  if (!Array.isArray(steps)) return false;
  return steps.some((s) => fightRoleOf(s) !== undefined);
}

/** The opponent of a fight action: `fightState.opponentId` once it exists, else the target. */
export function fightOpponentIdOf(action: Pick<UnifiedAction, 'fightState' | 'targetId'>): string | undefined {
  return action.fightState?.opponentId ?? (action.targetId || undefined);
}

function isFightAction(
  action: UnifiedAction,
  lookup: (templateId: string) => UnifiedActionTemplate | undefined,
): boolean {
  if (action.fightState) return true;
  try {
    return templateHasFightStep(lookup(action.templateId));
  } catch {
    return false;
  }
}

/**
 * Whether any of `ids` is the actor or the opponent of an unresolved fight. Filters
 * on the ids before any template lookup, so a caller asking about a handful of
 * mortals (a company's members) pays nothing for the rest of the world's actions.
 */
export function anyInFight(
  actions: readonly UnifiedAction[] | undefined,
  ids: ReadonlySet<string>,
  lookup: (templateId: string) => UnifiedActionTemplate | undefined = getUnifiedTemplateById,
): boolean {
  if (ids.size === 0) return false;
  for (const action of actions ?? []) {
    if (action.resolved) continue;
    const opponentId = fightOpponentIdOf(action);
    if (!ids.has(action.actorId) && !(opponentId && ids.has(opponentId))) continue;
    if (isFightAction(action, lookup)) return true;
  }
  return false;
}

/**
 * Every actor and opponent of an unresolved fight action. `lookup` defaults to the
 * template registry; tests may pass their own.
 */
export function fightParticipantIds(
  actions: readonly UnifiedAction[] | undefined,
  lookup: (templateId: string) => UnifiedActionTemplate | undefined = getUnifiedTemplateById,
): Set<string> {
  const ids = new Set<string>();
  for (const action of actions ?? []) {
    if (action.resolved) continue;
    if (!isFightAction(action, lookup)) continue;
    ids.add(action.actorId);
    const opponentId = fightOpponentIdOf(action);
    if (opponentId) ids.add(opponentId);
  }
  return ids;
}
