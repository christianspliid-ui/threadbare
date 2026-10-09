import { describe, expect, it } from 'vitest';
import { pruneResolvedActions, RESOLVED_ACTION_RETENTION_TICKS } from '../resolvedActionRetention';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { EncounterNotification } from '../../types/encounterVisibility';

function resolvedAt(actionId: string, completedAtTick: number): UnifiedAction {
  return { actionId, resolved: true, completedAtTick } as unknown as UnifiedAction;
}

function notificationFor(actionId: string, resolved: boolean): EncounterNotification {
  return { id: `${actionId}-n`, actionId, resolved } as unknown as EncounterNotification;
}

// THR-1777 — the aftermath the player is looking at must still exist when they answer it.
describe('pruneResolvedActions', () => {
  const tick = 100;
  const old = tick - RESOLVED_ACTION_RETENTION_TICKS; // exactly out of window

  it('drops a resolved action past the window when nothing awaits it (control arm)', () => {
    expect(pruneResolvedActions([resolvedAt('ua-1', old)], [], tick)).toEqual([]);
  });

  it('keeps a resolved action past the window while an unresolved notification names it', () => {
    const kept = pruneResolvedActions([resolvedAt('ua-1', old)], [notificationFor('ua-1', false)], tick);
    expect(kept.map(a => a.actionId)).toEqual(['ua-1']);
  });

  it('drops it once that notification is answered', () => {
    expect(pruneResolvedActions([resolvedAt('ua-1', old)], [notificationFor('ua-1', true)], tick)).toEqual([]);
  });

  it('keeps unresolved and in-window actions as before', () => {
    const live = { actionId: 'ua-live', resolved: false } as unknown as UnifiedAction;
    const fresh = resolvedAt('ua-fresh', tick - 1);
    expect(pruneResolvedActions([live, fresh], undefined, tick).map(a => a.actionId)).toEqual(['ua-live', 'ua-fresh']);
  });
});
