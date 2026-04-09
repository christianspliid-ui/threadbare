import type { EncounterProgress, EncounterResolutionSnapshot } from '../../types/encounter';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { isStepSuccess, type EncounterAftermathSummary, type UnifiedAction } from '../../types/unifiedAction';

export interface ActiveEncounterDisplay {
  encounterId: string;
  actorId: string;
  currentStepIndex: number;
  status: EncounterProgress['status'];
  history: EncounterProgress['history'];
  startedTick: number;
  occupiedUntilTick?: number;
  choiceHistory?: EncounterProgress['choiceHistory'];
  disregardRemaining?: boolean;
  resolutionHistory?: EncounterResolutionSnapshot[];
  sourceSystem: 'legacy_encounter' | 'unified_action';
  actionId?: string;
  aftermathSummary?: EncounterAftermathSummary;
}

export interface EncounterRuntimeSelection {
  encounter: ActiveEncounterDisplay | null;
  activeAction: UnifiedAction | undefined;
}

export function buildActiveEncounterDisplayFromLegacyProgress(
  progress: EncounterProgress,
): ActiveEncounterDisplay {
  return {
    encounterId: progress.encounterId,
    actorId: progress.actorId,
    currentStepIndex: progress.currentEncounterIndex,
    status: progress.status,
    history: progress.history,
    startedTick: progress.startedTick,
    occupiedUntilTick: progress.occupiedUntilTick,
    choiceHistory: progress.choiceHistory,
    disregardRemaining: progress.disregardRemaining,
    resolutionHistory: progress.resolutionHistory,
    sourceSystem: 'legacy_encounter',
  };
}

export function buildActiveEncounterDisplayFromUnifiedAction(
  action: UnifiedAction,
  currentTick: number,
): ActiveEncounterDisplay {
  const remainingDuration = Math.max(0, action.stepDuration - action.stepProgress);
  return {
    encounterId: action.templateId,
    actorId: action.actorId,
    currentStepIndex: action.currentStep,
    status: action.resolved ? 'completed' : 'active',
    history: action.stepOutcomes.map((outcome, index) => ({
      encounterId: `step-${index + 1}`,
      success: isStepSuccess(outcome),
      tick: action.completedAtTick ?? currentTick,
    })),
    startedTick: action.startTick,
    occupiedUntilTick: action.resolved ? undefined : currentTick + remainingDuration,
    choiceHistory: action.choiceHistory ? [...action.choiceHistory] : [],
    disregardRemaining: action.disregardRemaining,
    sourceSystem: 'unified_action',
    actionId: action.actionId,
    aftermathSummary: action.aftermathSummary,
  };
}

export function selectEncounterRuntimeForNotification(
  notif: EncounterNotification,
  legacyProgresses: EncounterProgress[],
  unifiedActions: UnifiedAction[],
  currentTick: number,
): EncounterRuntimeSelection {
  const legacyProgress = legacyProgresses.find(
    p => p.actorId === notif.agentId && p.encounterId === notif.encounterId && p.status === 'active',
  );
  const activeAction = (notif.actionId
    ? unifiedActions.find(action => action.actionId === notif.actionId)
    : undefined)
    ?? unifiedActions.find(action =>
      !action.resolved
      && action.actorId === notif.agentId
      && action.templateId === notif.encounterId,
    );
  const legacyEncounter = legacyProgress
    ? buildActiveEncounterDisplayFromLegacyProgress(legacyProgress)
    : null;
  const unifiedEncounter = activeAction
    ? buildActiveEncounterDisplayFromUnifiedAction(activeAction, currentTick)
    : null;
  const prefersUnified = notif.sourceSystem === 'unified_action' || Boolean(notif.actionId);
  const encounter = prefersUnified
    ? (unifiedEncounter ?? legacyEncounter ?? null)
    : (legacyEncounter ?? unifiedEncounter ?? null);
  return { encounter, activeAction };
}

export function shouldAutoOpenEncounterNotification(
  notif: Pick<EncounterNotification, 'resolved' | 'autoResolveTick'>,
): boolean {
  return !notif.resolved && notif.autoResolveTick === null;
}

export function selectEncounterRuntimeForDisplay(
  encounter: ActiveEncounterDisplay,
  legacyProgresses: EncounterProgress[],
  unifiedActions: UnifiedAction[],
  currentTick: number,
): EncounterRuntimeSelection {
  const legacyProgress = legacyProgresses.find(
    progress => progress.actorId === encounter.actorId
      && progress.encounterId === encounter.encounterId
      && progress.status === 'active',
  );
  const activeAction = (encounter.actionId
    ? unifiedActions.find(action => action.actionId === encounter.actionId)
    : undefined)
    ?? unifiedActions.find(action =>
      !action.resolved
      && action.actorId === encounter.actorId
      && action.templateId === encounter.encounterId,
    );
  const legacyEncounter = legacyProgress
    ? buildActiveEncounterDisplayFromLegacyProgress(legacyProgress)
    : null;
  const unifiedEncounter = activeAction
    ? buildActiveEncounterDisplayFromUnifiedAction(activeAction, currentTick)
    : null;
  const prefersUnified = encounter.sourceSystem === 'unified_action' || Boolean(encounter.actionId);
  const selectedEncounter = prefersUnified
    ? (unifiedEncounter ?? legacyEncounter ?? null)
    : (legacyEncounter ?? unifiedEncounter ?? null);
  return { encounter: selectedEncounter, activeAction };
}
