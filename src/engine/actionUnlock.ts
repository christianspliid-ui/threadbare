import type { UnifiedActionTemplate } from '../types/unifiedAction';

/** Always-available baseline size (THR-419). */
export const STARTER_ACTION_COUNT = 12;

/** Canonical Starter 12 action IDs. */
export const STARTER_ACTION_IDS: readonly string[] = [
  'bind_thread_agent',
  'bind_thread_location',
  'hex.survey',
  'observe_agent',
  'hex.whisper_intuition',
  'divine.dream',
  'divine.persuade',
  'divine.deceive',
  'divine.intimidate',
  'divine.coincidence',
  'hex.bless_land',
  'hex.mark_ground',
] as const;

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
