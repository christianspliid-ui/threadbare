import type { GameState } from '../types/gameState';
import { getAnyEncounterById } from '../data/encounter-content';

export interface ActiveEncounterRuntimeRef {
  encounterId: string;
  actorId: string;
  status: 'active';
  sourceSystem: 'legacy_encounter' | 'unified_action';
  actionId?: string;
}

/**
 * Collect active encounter-like runtime objects across both the legacy
 * encounterProgress pipeline and migrated unified actions.
 *
 * Important: not every unified action is an encounter. We only surface
 * unresolved unified actions whose template IDs map to real encounter
 * templates, so world-facing systems do not start treating every action
 * like an encounter.
 */
export function collectActiveEncounterRuntimeRefs(
  state: Pick<GameState, 'encounterProgress' | 'unifiedActions'>,
): ActiveEncounterRuntimeRef[] {
  const refs = new Map<string, ActiveEncounterRuntimeRef>();

  for (const progress of state.encounterProgress ?? []) {
    if (progress.status !== 'active') continue;
    const key = `${progress.actorId}::${progress.encounterId}`;
    refs.set(key, {
      encounterId: progress.encounterId,
      actorId: progress.actorId,
      status: 'active',
      sourceSystem: 'legacy_encounter',
    });
  }

  for (const action of state.unifiedActions ?? []) {
    if (action.resolved) continue;
    if (!getAnyEncounterById(action.templateId)) continue;
    const key = `${action.actorId}::${action.templateId}`;
    refs.set(key, {
      encounterId: action.templateId,
      actorId: action.actorId,
      status: 'active',
      sourceSystem: 'unified_action',
      actionId: action.actionId,
    });
  }

  return [...refs.values()];
}
