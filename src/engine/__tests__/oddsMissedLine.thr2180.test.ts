/**
 * THR-2180 — a good-odds step that misses says so: "It looked Fated, but fate
 * rolled against it." The odds word is frozen on the step's prose record at the
 * roll, carried to the last-step answer and the cause line, and a won chapter
 * names its failed step as one step of several.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  NUDGE_READING_LEGEND_SENTENCE,
  lastStepAnswer,
  oddsMissedLine,
} from '../../data/nudge-stage-content';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { buildAftermathCauseLine, type CauseLineStep } from '../aftermathWords';
import { classifyStepForecastTier as classifyForecast } from '../stepResolutionCore';
import { causeLineSteps, executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { createSimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import type { GameState } from '../../types/gameState';
import type { StepProseRecord } from '../../types/stepProseRecord';
import type { UnifiedActionOutcome, UnifiedActionTemplate } from '../../types/unifiedAction';

const FATED_MISSED = 'It looked Fated, but fate rolled against it.';

describe('THR-2180 — oddsMissedLine', () => {
  it('names a Fated or Favorable miss, and nothing else', () => {
    expect(oddsMissedLine('fated', 'failure')).toBe(FATED_MISSED);
    expect(oddsMissedLine('favorable', 'failure')).toBe('It looked Favorable, but fate rolled against it.');
    // A near miss is a roll that passed, close to the line — not a miss.
    expect(oddsMissedLine('fated', 'near_miss')).toBeNull();
    expect(oddsMissedLine('fated', 'critical_failure')).toBe(FATED_MISSED);
    expect(oddsMissedLine('fated', 'success_at_cost')).toBeNull();
    expect(oddsMissedLine('uncertain', 'failure')).toBeNull();
    expect(oddsMissedLine(undefined, 'failure')).toBeNull();
    expect(oddsMissedLine('fated', undefined)).toBeNull();
  });
});

describe('THR-2180 — the last-step answer', () => {
  it('ends with the line after the choice suffix', () => {
    const answer = lastStepAnswer([
      { status: 'resolved', outcomeWord: 'broke', choiceText: 'Steady Hand', oddsMissedLine: FATED_MISSED },
      { status: 'current' },
    ]);
    expect(answer?.line).toBe(`Step 1 broke. You: Steady Hand. ${FATED_MISSED}`);
  });

  it('reads as before when the step carries no line', () => {
    const answer = lastStepAnswer([{ status: 'resolved', outcomeWord: 'broke' }, { status: 'current' }]);
    expect(answer?.line).toBe('Step 1 broke.');
  });
});

describe('THR-2180 — the cause line', () => {
  const line = (outcome: UnifiedActionOutcome, steps: readonly CauseLineStep[]) =>
    buildAftermathCauseLine({ actorName: 'Kael', templateName: 'Heal the Sick', outcome, steps });

  it('a won chapter names its failed step as one step', () => {
    const text = line('success_at_cost', [
      { band: 'success', reach: 'iron', godTouched: false },
      { band: 'failure', reach: 'heart', godTouched: true },
    ]);
    expect(text).toBe(
      'Kael won Heal the Sick, at a price. One step went wrong. The work on Heart failed, and your cards could not save that step.',
    );
    expect(text).not.toContain('could not save it.');
  });

  it('two failed steps in a won chapter never read "One step went wrong."', () => {
    const text = line('success_at_cost', [
      { band: 'failure', reach: 'iron', godTouched: false },
      { band: 'failure', reach: 'heart', godTouched: true },
      { band: 'success', reach: 'gold', godTouched: false },
    ]);
    expect(text).not.toContain('One step went wrong.');
    expect(text).not.toContain('could not save that step');
  });

  it('a lost ending is unchanged', () => {
    const text = line('failure', [
      { band: 'success', reach: 'iron', godTouched: false },
      { band: 'failure', reach: 'heart', godTouched: true },
    ]);
    expect(text).toBe('Kael lost Heal the Sick. The work on Heart failed, and your cards could not save it.');
  });

  it('a final-step Fated miss appends the line once', () => {
    const text = line('failure', [
      { band: 'success', reach: 'iron', godTouched: false },
      { band: 'failure', reach: 'heart', godTouched: true, oddsMissedLine: FATED_MISSED },
    ]);
    expect(text.endsWith(FATED_MISSED)).toBe(true);
    expect(text.split(FATED_MISSED)).toHaveLength(2);
  });

  it('a final-step miss that did not decide the ending is still named, by its step', () => {
    const text = line('failure', [
      { band: 'critical_failure', reach: 'iron', godTouched: false },
      { band: 'failure', reach: 'heart', godTouched: true, oddsMissedLine: FATED_MISSED, oddsMissedTierWord: 'Fated' },
    ]);
    expect(text.endsWith('The work on Heart looked Fated, but fate rolled against it.')).toBe(true);
  });

  it('a final-step miss is named even when the cause line falls back to the lead', () => {
    const text = line('success', [
      { band: 'failure', reach: 'heart', godTouched: false, oddsMissedLine: FATED_MISSED, oddsMissedTierWord: 'Fated' },
    ]);
    expect(text).toBe('Kael won Heal the Sick. The work on Heart looked Fated, but fate rolled against it.');
  });

  it('an earlier step\'s miss is not repeated on the ending', () => {
    const text = line('failure', [
      { band: 'failure', reach: 'heart', godTouched: true, oddsMissedLine: FATED_MISSED },
      { band: 'success', reach: 'iron', godTouched: false },
    ]);
    expect(text).not.toContain(FATED_MISSED);
  });
});

describe('THR-2180 — the legend and the tooltip', () => {
  it('the legend says even Fated can miss', () => {
    expect(NUDGE_READING_LEGEND_SENTENCE).toContain('Favorable, Fated. Even Fated can miss.');
  });

  it('the Fated tooltip says never certain', () => {
    const entry = UI_TOOLTIPS['ui.forecast.fated'];
    expect(entry.desc).toContain('Nearly sure, never certain');
    expect(entry.desc).not.toContain('all but cannot fail');
  });
});

// ─── The resolution freezes the odds word ───────────────────────

function makeTemplate(): UnifiedActionTemplate {
  return {
    id: 'action.iron.thr2180_probe',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Odds Probe',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [0, 1].map(() => ({
      reach: 'iron' as const,
      duration: { min: 1, max: 1 },
      difficulty: 0.3,
      narrativeTemplate: 'The probe leans in.',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue' as const,
    })),
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as UnifiedActionTemplate;
}

describe('THR-2180 — the frozen word is the Stage forecast word at a tier boundary', () => {
  it('a probability of exactly 0.8 reads Fated and 0.6 reads Favorable, as the Stage shows', () => {
    expect(classifyForecast(0.8)).toBe('fated');
    expect(classifyForecast(0.6)).toBe('favorable');
  });
});

describe('THR-2180 — executeStepResult freezes forecastTier', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
  });

  it('a step rolled at 0.9 freezes the tier the Stage forecast gives the same probability', () => {
    const runtime = createSimulationRuntime();
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Probe Actor', properties: {} });
    const state = { tick: 5, graph, unifiedActions: [] } as unknown as GameState;
    const template = makeTemplate();
    const rng = () => 0.5;
    const action = createUnifiedAction({
      actorId: 'agent-1', templateId: template.id, targetId: 'agent-1',
      scale: template.scale, source: 'agent', template, tick: state.tick, rng,
    });
    const { updatedAction } = executeStepResult(
      action, template, 'failure', [], state, rng, state.tick,
      { capability: 60, probability: 0.9, roll: 95 }, runtime,
    );
    const records = (updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    expect(records).toHaveLength(1);
    expect(records[0].forecastTier).toBe('fated');
    expect(records[0].forecastTier).toBe(classifyForecast(0.9));
    // The cause line's step reader carries the line from the frozen record.
    expect(causeLineSteps(updatedAction, template)[0].oddsMissedLine).toBe(FATED_MISSED);
  });

  it('a step resolved with no roll stats freezes no tier', () => {
    const runtime = createSimulationRuntime();
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Probe Actor', properties: {} });
    const state = { tick: 5, graph, unifiedActions: [] } as unknown as GameState;
    const template = makeTemplate();
    const rng = () => 0.5;
    const action = createUnifiedAction({
      actorId: 'agent-1', templateId: template.id, targetId: 'agent-1',
      scale: template.scale, source: 'agent', template, tick: state.tick, rng,
    });
    const { updatedAction } = executeStepResult(action, template, 'failure', [], state, rng, state.tick, undefined, runtime);
    const records = (updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    expect(records[0]?.forecastTier).toBeUndefined();
  });
});
