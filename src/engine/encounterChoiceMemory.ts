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

/**
 * `interventionType` written for a committed nudge hand (THR-1123).
 *
 * The field is a free string precisely so a writer can say what kind of record
 * it is making; the sibling constant is `BRANCH_DECISION_INTERVENTION_TYPE`
 * (`'agent_decided'`). It deliberately does **not** reuse one of the retired
 * supportive/coercive/withdrawn values: a nudge is not a stance, and a reader
 * keying on those three must find nothing here rather than a plausible lie.
 *
 * What consumers key on is `choiceId` — the played card's id.
 */
export const NUDGE_COMMIT_INTERVENTION_TYPE = 'nudge_committed';

/**
 * Record a committed nudge hand as this step's remembered choice (THR-1123).
 *
 * `activeNudges` names the cards played on the action's *current* step and is
 * replaced when the next step commits, so it cannot answer "what did the god
 * play on step 0" once the encounter has moved on. Retrospective surfaces need
 * exactly that — gate duty's history afterimages and aftermath echoes are keyed
 * on it — and `choiceHistory` is the existing per-step channel for the answer
 * ("Remembered player-facing encounter interventions keyed by step").
 *
 * So this writes through the same upsert every other choice writer uses rather
 * than adding a second per-step memory. The recorded `choiceId` is the first
 * committed card; `essenceSpent` is the hand's total. `probabilityBoost` is 0
 * and stays 0 — nudges move the forecast through `forecastDelta`, and the flat
 * roll addition that field represents was retired with the stance triple
 * (THR-1121).
 *
 * A commit of zero cards writes nothing: playing no card is not a choice to
 * remember, and an empty entry would make "fate alone" indistinguishable from
 * a card whose id no longer exists.
 */
export function recordUnifiedActionNudgeMemory(
  action: UnifiedAction,
  stepIndex: number,
  stepId: string,
  nudgeIds: readonly string[],
  nudgeLabel: string,
  tick: number,
  essenceSpent: number,
): UnifiedAction {
  const firstCard = nudgeIds[0];
  if (!firstCard) return action;

  const nextEntry: EncounterChoiceMemory = {
    stepIndex,
    stepId,
    choiceId: firstCard,
    choiceText: nudgeLabel,
    interventionType: NUDGE_COMMIT_INTERVENTION_TYPE,
    essenceSpent,
    probabilityBoost: 0,
    tick,
  };

  return {
    ...action,
    choiceHistory: upsertChoiceHistory(action.choiceHistory, nextEntry),
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
