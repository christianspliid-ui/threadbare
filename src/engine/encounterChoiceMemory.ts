import type { EncounterChoiceMemory, EncounterProgress } from '../types/encounter';
import type { EncounterInterventionChoice } from '../types/encounterVisibility';
import type { UnifiedAction } from '../types/unifiedAction';

function buildChoiceMemoryEntry(
  stepIndex: number,
  stepId: string,
  choice: EncounterInterventionChoice,
  tick: number,
  essenceSpent: number,
): EncounterChoiceMemory {
  return {
    stepIndex,
    stepId,
    choiceId: choice.id,
    choiceText: choice.text,
    interventionType: choice.interventionType,
    essenceSpent,
    probabilityBoost: choice.probabilityBoost,
    tick,
    godVoice: choice.godVoice,
  };
}

function buildDisregardChoice(stepId: string): EncounterInterventionChoice {
  return {
    id: `disregard_${stepId}`,
    text: 'Disregard the encounter',
    essenceCost: 0,
    probabilityBoost: 0,
    interventionType: 'withdrawn',
    godVoice: 'Let the living carry this moment without your hand upon it.',
  };
}

function upsertChoiceHistory(
  existingHistory: readonly EncounterChoiceMemory[] | undefined,
  nextEntry: EncounterChoiceMemory,
): EncounterChoiceMemory[] {
  return [
    ...(existingHistory ?? []).filter(entry => entry.stepIndex !== nextEntry.stepIndex),
    nextEntry,
  ].sort((left, right) => left.stepIndex - right.stepIndex);
}

export function getEncounterChoiceMemory(
  progress: Pick<EncounterProgress, 'choiceHistory'>,
  stepIndex: number,
): EncounterChoiceMemory | undefined {
  return progress.choiceHistory?.find(entry => entry.stepIndex === stepIndex);
}

export function getUnifiedActionChoiceMemory(
  action: Pick<UnifiedAction, 'choiceHistory'>,
  stepIndex: number,
): EncounterChoiceMemory | undefined {
  return action.choiceHistory?.find(entry => entry.stepIndex === stepIndex);
}

export function getEffectiveUnifiedActionChoiceMemory(
  action: Pick<UnifiedAction, 'choiceHistory' | 'disregardRemaining' | 'startTick'>,
  stepIndex: number,
  stepId: string,
): EncounterChoiceMemory | undefined {
  const remembered = getUnifiedActionChoiceMemory(action, stepIndex);
  if (remembered) return remembered;
  if (!action.disregardRemaining) return undefined;
  const disregardChoice = buildDisregardChoice(stepId);
  return {
    stepIndex,
    stepId,
    choiceId: disregardChoice.id,
    choiceText: disregardChoice.text,
    interventionType: disregardChoice.interventionType,
    essenceSpent: 0,
    probabilityBoost: 0,
    tick: action.startTick,
    godVoice: disregardChoice.godVoice,
  };
}

export function recordEncounterChoiceMemory(
  progress: EncounterProgress,
  stepIndex: number,
  stepId: string,
  choice: EncounterInterventionChoice,
  tick: number,
  essenceSpent: number,
): EncounterProgress {
  const nextEntry = buildChoiceMemoryEntry(stepIndex, stepId, choice, tick, essenceSpent);
  const nextHistory = upsertChoiceHistory(progress.choiceHistory, nextEntry);

  return {
    ...progress,
    choiceHistory: nextHistory,
  };
}

export function recordUnifiedActionChoiceMemory(
  action: UnifiedAction,
  stepIndex: number,
  stepId: string,
  choice: EncounterInterventionChoice,
  tick: number,
  essenceSpent: number,
): UnifiedAction {
  const nextEntry = buildChoiceMemoryEntry(stepIndex, stepId, choice, tick, essenceSpent);
  const nextHistory = upsertChoiceHistory(action.choiceHistory, nextEntry);

  return {
    ...action,
    choiceHistory: nextHistory,
  };
}

export function markEncounterProgressDisregarded(
  progress: EncounterProgress,
  stepIndex: number,
  stepId: string,
  tick: number,
): EncounterProgress {
  const remembered = getEncounterChoiceMemory(progress, stepIndex);
  if (remembered) {
    return {
      ...progress,
      disregardRemaining: true,
    };
  }

  const disregardChoice = buildDisregardChoice(stepId);
  const nextEntry = buildChoiceMemoryEntry(stepIndex, stepId, disregardChoice, tick, 0);
  const nextHistory = upsertChoiceHistory(progress.choiceHistory, nextEntry);
  return {
    ...progress,
    choiceHistory: nextHistory,
    disregardRemaining: true,
  };
}

export function markUnifiedActionDisregarded(
  action: UnifiedAction,
  stepIndex: number,
  stepId: string,
  tick: number,
): UnifiedAction {
  const remembered = getUnifiedActionChoiceMemory(action, stepIndex);
  if (remembered) {
    return {
      ...action,
      disregardRemaining: true,
    };
  }

  const disregardChoice = buildDisregardChoice(stepId);
  const nextEntry = buildChoiceMemoryEntry(stepIndex, stepId, disregardChoice, tick, 0);
  const nextHistory = upsertChoiceHistory(action.choiceHistory, nextEntry);
  return {
    ...action,
    choiceHistory: nextHistory,
    disregardRemaining: true,
  };
}
