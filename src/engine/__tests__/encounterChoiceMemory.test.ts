import { describe, expect, it } from 'vitest';
import type { EncounterProgress } from '../../types/encounter';
import type { EncounterInterventionChoice } from '../../types/encounterVisibility';
import {
  getEffectiveUnifiedActionChoiceMemory,
  getEncounterChoiceMemory,
  markUnifiedActionDisregarded,
  recordEncounterChoiceMemory,
} from '../encounterChoiceMemory';

function makeProgress(): EncounterProgress {
  return {
    encounterId: 'cg.quest.gate_duty',
    actorId: 'agent.hero',
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: 10,
  };
}

function makeChoice(
  overrides: Partial<EncounterInterventionChoice> = {},
): EncounterInterventionChoice {
  return {
    id: 'intervene_support',
    text: 'Steady the courier',
    essenceCost: 1,
    probabilityBoost: 0.03,
    interventionType: 'supportive',
    ...overrides,
  };
}

describe('encounterChoiceMemory', () => {
  it('records a choice against a specific encounter step', () => {
    const progress = makeProgress();
    const next = recordEncounterChoiceMemory(
      progress,
      0,
      'cg.quest.gate_duty.1',
      makeChoice(),
      14,
      1,
    );

    expect(next.choiceHistory).toEqual([
      {
        stepIndex: 0,
        stepId: 'cg.quest.gate_duty.1',
        choiceId: 'intervene_support',
        choiceText: 'Steady the courier',
        interventionType: 'supportive',
        essenceSpent: 1,
        probabilityBoost: 0.03,
        tick: 14,
        godVoice: undefined,
      },
    ]);
  });

  it('replaces an earlier choice for the same step without disturbing later steps', () => {
    const progress = recordEncounterChoiceMemory(
      makeProgress(),
      0,
      'cg.quest.gate_duty.1',
      makeChoice(),
      14,
      1,
    );
    const withSecond = recordEncounterChoiceMemory(
      progress,
      1,
      'cg.quest.gate_duty.2',
      makeChoice({
        id: 'intervene_force',
        text: 'Force the captain',
        interventionType: 'coercive',
      }),
      18,
      5,
    );
    const overwritten = recordEncounterChoiceMemory(
      withSecond,
      0,
      'cg.quest.gate_duty.1',
      makeChoice({
        id: 'intervene_withdraw',
        text: 'Keep your hand folded',
        interventionType: 'withdrawn',
      }),
      16,
      0,
    );

    expect(overwritten.choiceHistory?.map(entry => entry.choiceId)).toEqual([
      'intervene_withdraw',
      'intervene_force',
    ]);
    expect(getEncounterChoiceMemory(overwritten, 0)?.choiceText).toBe('Keep your hand folded');
    expect(getEncounterChoiceMemory(overwritten, 1)?.interventionType).toBe('coercive');
  });

  it('builds a withdrawn choice memory for later steps after the player disregards the encounter', () => {
    const action = markUnifiedActionDisregarded(
      {
        actionId: 'ua_1',
        actorId: 'agent.hero',
        templateId: 'cg.quest.gate_duty',
        targetId: 'loc_1',
        scale: 'personal',
        source: 'player',
        startTick: 10,
        currentStep: 0,
        stepProgress: 0,
        stepDuration: 2,
        resolved: false,
        stepOutcomes: [],
        choiceHistory: [],
      } as any,
      0,
      'step-1',
      12,
    );

    const futureMemory = getEffectiveUnifiedActionChoiceMemory(action, 2, 'step-3');
    expect(futureMemory?.interventionType).toBe('withdrawn');
    expect(futureMemory?.choiceText).toBe('Disregard the encounter');
    expect(futureMemory?.essenceSpent).toBe(0);
  });
});
