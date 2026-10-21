/**
 * THR-1964 — the aftermath opens with what decided it: the cause line, the one
 * price word, and the price row.
 */
import { describe, expect, it } from 'vitest';
import {
  CAUSE_STEP_VERBS,
  OUTCOME_PHRASES,
  OUTCOME_SENTENCE_SHAPES,
  PRICE_ROW_TITLE,
  PRICE_WORDS,
  buildAftermathCauseLine,
  causeBandAgrees,
  containsNumeral,
  decidingStepIndex,
  outcomeSentence,
  priceRowFor,
  type CauseLineStep,
} from '../aftermathWords';
import { buildEncounterAftermathOverview, causeLineSteps } from '../unifiedActionResolution';
import type { UnifiedActionOutcome, UnifiedActionTemplate } from '../../types/unifiedAction';

const ALL_OUTCOMES: readonly UnifiedActionOutcome[] = [
  'critical_success', 'success', 'success_at_cost', 'contested_won', 'contested_lost', 'failure', 'critical_failure',
];

const LOST: ReadonlySet<UnifiedActionOutcome> = new Set(['failure', 'critical_failure', 'contested_lost']);

function line(outcome: UnifiedActionOutcome, steps: readonly CauseLineStep[]): string {
  return buildAftermathCauseLine({ actorName: 'Kael', templateName: 'Bridge Toll', outcome, steps });
}

describe('THR-1964 — one price word', () => {
  it('the phrase table and the ending sentence share the price word', () => {
    expect(OUTCOME_PHRASES.success_at_cost).toContain(PRICE_WORDS);
    expect(outcomeSentence('Kael', 'Bridge Toll', 'success_at_cost')).toBe('Kael won Bridge Toll, at a price.');
  });

  it('no outcome says "great cost", a raw band or a numeral', () => {
    for (const outcome of ALL_OUTCOMES) {
      const sentence = outcomeSentence('Kael', 'Bridge Toll', outcome);
      expect(sentence).not.toMatch(/great cost/);
      expect(sentence).not.toMatch(/_/);
      expect(containsNumeral(sentence)).toBe(false);
    }
  });

  it('every outcome has a sentence shape', () => {
    for (const outcome of ALL_OUTCOMES) expect(OUTCOME_SENTENCE_SHAPES[outcome]).toBeDefined();
  });
});

describe('THR-1964 — the deciding step', () => {
  const steps: CauseLineStep[] = [
    { band: 'near_miss', reach: 'gold', godTouched: false },
    { band: 'success', reach: 'iron', godTouched: false },
    { band: 'near_miss', reach: 'heart', godTouched: true },
  ];

  it('a costly or lost ending reads the last worst step', () => {
    expect(decidingStepIndex('success_at_cost', steps)).toBe(2);
    expect(decidingStepIndex('failure', steps)).toBe(2);
  });

  it('a won ending reads the last best step', () => {
    expect(decidingStepIndex('success', steps)).toBe(1);
    expect(decidingStepIndex('critical_success', steps)).toBe(1);
  });

  it('no steps → no deciding step', () => {
    expect(decidingStepIndex('success', [])).toBe(-1);
  });
});

describe('THR-1964 — the cause line, every band × god-touched / alone × one-step / many-step', () => {
  const bands = Object.keys(CAUSE_STEP_VERBS) as (keyof typeof CAUSE_STEP_VERBS)[];

  for (const outcome of ALL_OUTCOMES) {
    for (const godTouched of [true, false]) {
      for (const shape of ['one-step', 'many-step'] as const) {
        it(`${outcome} · ${godTouched ? 'god-touched' : 'alone'} · ${shape}`, () => {
          for (const band of bands) {
            const decider: CauseLineStep = { band, reach: 'gold', godTouched };
            const steps = shape === 'one-step'
              ? [decider]
              : [{ band, reach: 'iron', godTouched: !godTouched }, decider];
            const text = line(outcome, steps);
            const lead = outcomeSentence('Kael', 'Bridge Toll', outcome);
            expect(text.startsWith(lead)).toBe(true);
            expect(text).not.toMatch(/[{}_]/);
            expect(containsNumeral(text)).toBe(false);
            // A band that contradicts the ending is never named as its cause.
            if (!causeBandAgrees(outcome, band)) {
              expect(text).toBe(lead);
              continue;
            }
            expect(text).toContain(`The work on Gold ${CAUSE_STEP_VERBS[band]}`);
            if (!godTouched) expect(text).toContain('Kael faced it alone.');
            else if (LOST.has(outcome)) expect(text).toContain('your cards could not save it.');
            else expect(text).toContain('your cards held it.');
            expect(text).not.toMatch(/[{}_]/);
            expect(containsNumeral(text)).toBe(false);
          }
        });
      }
    }
  }

  it('reads the ticket example', () => {
    expect(line('success_at_cost', [
      { band: 'success', reach: 'iron', godTouched: false },
      { band: 'near_miss', reach: 'gold', godTouched: true },
    ])).toBe('Kael won Bridge Toll, at a price. The work on Gold nearly broke, and your cards held it.');
    expect(line('failure', [{ band: 'failure', reach: 'iron', godTouched: false }]))
      .toBe('Kael lost Bridge Toll. The work on Iron failed, and Kael faced it alone.');
  });

  it('a step with its own title is named by it', () => {
    expect(line('success', [{ band: 'success', reach: 'iron', title: 'First exchange', godTouched: false }]))
      .toBe('Kael won Bridge Toll. First exchange on Iron went well, and Kael faced it alone.');
  });

  it('a deciding step that contradicts the ending is not named', () => {
    expect(line('success_at_cost', [{ band: 'success', reach: 'heart', godTouched: false }]))
      .toBe('Kael won Bridge Toll, at a price.');
    expect(line('failure', [{ band: 'success_at_cost', reach: 'iron', godTouched: false }]))
      .toBe('Kael lost Bridge Toll.');
  });

  it('fail-soft: no steps, or no title and no reach, gives the outcome sentence alone', () => {
    expect(line('success_at_cost', [])).toBe('Kael won Bridge Toll, at a price.');
    expect(line('success_at_cost', [{ band: 'near_miss', godTouched: true }])).toBe('Kael won Bridge Toll, at a price.');
  });
});

describe('THR-1964 — the price row', () => {
  const base = { actorId: 'agent_kael', actorName: 'Kael', drewComplication: false } as const;

  it('is present on success_at_cost with no loss row and no complication', () => {
    const row = priceRowFor({ ...base, outcome: 'success_at_cost', changes: [{ polarity: 'gain' }] });
    expect(row?.title).toBe(PRICE_ROW_TITLE);
    expect(row?.polarity).toBe('loss');
    expect(row?.detail).toBe('It took something out of Kael, and Kael learned less from it than a clean win teaches.');
    expect(containsNumeral(row!.detail)).toBe(false);
  });

  it('is absent when a loss row already names the price', () => {
    expect(priceRowFor({ ...base, outcome: 'success_at_cost', changes: [{ polarity: 'loss' }] })).toBeNull();
  });

  it('is absent when a complication drew', () => {
    expect(priceRowFor({ ...base, outcome: 'success_at_cost', changes: [], drewComplication: true })).toBeNull();
  });

  it('is absent on every other outcome', () => {
    for (const outcome of ALL_OUTCOMES.filter(o => o !== 'success_at_cost')) {
      expect(priceRowFor({ ...base, outcome, changes: [] })).toBeNull();
    }
  });
});

describe('THR-1964 — the overview leads with the cause line', () => {
  it('the cause line replaces the bare outcome sentence and the count sentence stays after it', () => {
    const cause = 'Kael won Bridge Toll, at a price. The work on Gold nearly broke, and your cards held it.';
    const overview = buildEncounterAftermathOverview(
      'Kael', 'Bridge Toll', 'success_at_cost',
      [{ id: 'g', kind: 'growth', title: 'Growth', detail: 'x', polarity: 'gain' }],
      true, cause,
    );
    expect(overview).toBe(`${cause} Your nudge left one skill shift behind in the world.`);
  });

  it('without a cause line the first sentence is the outcome sentence', () => {
    const overview = buildEncounterAftermathOverview('Kael', 'Bridge Toll', 'success_at_cost', [], false);
    expect(overview.startsWith('Kael won Bridge Toll, at a price.')).toBe(true);
  });
});

describe('THR-1964 — causeLineSteps reads the action', () => {
  const template = {
    steps: [
      { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.5 },
      { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.5 },
    ],
  } as unknown as UnifiedActionTemplate;

  it('names each step by its Reach and marks the steps a hand was on', () => {
    const steps = causeLineSteps({
      stepOutcomes: ['success', 'near_miss'],
      choiceHistory: [{
        stepIndex: 1, stepId: 's1', choiceId: 'c', choiceText: 'c',
        interventionType: 'whisper', essenceSpent: 1, probabilityBoost: 0, tick: 1,
      }],
    }, template);
    expect(steps.map(s => s.reach)).toEqual(['gold', 'iron']);
    expect(steps.map(s => s.godTouched)).toEqual([false, true]);
  });

  it('a live hand counts on the last resolved step', () => {
    const steps = causeLineSteps({ stepOutcomes: ['success', 'success'], activeNudges: ['n1'] }, template);
    expect(steps.map(s => s.godTouched)).toEqual([false, true]);
  });
});
