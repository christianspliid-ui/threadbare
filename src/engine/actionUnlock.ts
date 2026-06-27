import type { UnifiedActionTemplate } from '../types/unifiedAction';

/**
 * Always-available baseline size.
 *
 * THR-501 — Turn-1 floor reduced to the two generic Core verbs (Move + Investiture),
 * which are hardcoded on the AscendantBar Core tier and therefore never live in this
 * action-template floor. The starter-template floor is now empty: every other capability
 * (the former Starter 12 — divine interventions, hex verbs, thread binding, observe) is
 * delivered as an earned story moment via Ascendant Beats (`unlock_action`), not surfaced
 * on the opening screen. The `isStarterActionId` mechanism is retained for a future
 * data-driven floor; today it matches nothing.
 */
export const STARTER_ACTION_COUNT = 0;

/** Canonical starter action IDs. Empty since THR-501 (see STARTER_ACTION_COUNT). */
export const STARTER_ACTION_IDS: readonly string[] = [] as const;

const STARTER_ID_SET: ReadonlySet<string> = new Set(STARTER_ACTION_IDS);

export function isStarterActionId(actionId: string): boolean {
  return STARTER_ID_SET.has(actionId);
}

export function isActionRevealed(
  template: Pick<UnifiedActionTemplate, 'id' | 'starter'>,
  unlockedActionIds: readonly string[] | undefined,
): boolean {
  if (template.starter === true) return true;
  if (isStarterActionId(template.id)) return true;
  // Backward-compat: call sites that have not yet wired unlock state continue to see all actions.
  if (unlockedActionIds === undefined) return true;
  if (unlockedActionIds.length === 0) return false;
  return unlockedActionIds.includes(template.id);
}
