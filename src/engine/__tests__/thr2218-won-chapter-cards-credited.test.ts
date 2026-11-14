// THR-2218 — a won chapter never tells the god "your cards were on another step".
//
// Warm playtest round 4: in Flawed Steel the god played cards on step 1, both steps
// went well, the band tie went to the later (untouched) step, and the line said the
// cards were "on another step, not this one" — read as "your cards did nothing".

import { describe, expect, it } from 'vitest';
import {
  CAUSE_GOD_ELSEWHERE,
  CAUSE_GOD_ON_STEP,
  buildAftermathCauseLine,
  decidingStepIndex,
  type CauseLineStep,
} from '../aftermathWords';

const line = (outcome: Parameters<typeof buildAftermathCauseLine>[0]['outcome'], steps: CauseLineStep[]) =>
  buildAftermathCauseLine({ actorName: 'Kael', templateName: 'Flawed Steel', outcome, steps });

describe('THR-2218 — a band tie on a won chapter goes to the step the cards were on', () => {
  const tied: CauseLineStep[] = [
    { band: 'success', reach: 'iron', godTouched: true },
    { band: 'success', reach: 'gold', godTouched: false },
  ];

  it('the deciding step is the touched one', () => {
    expect(decidingStepIndex('success', tied)).toBe(0);
    expect(decidingStepIndex('critical_success', tied)).toBe(0);
    expect(decidingStepIndex('contested_won', tied)).toBe(0);
  });

  it('the line credits the cards and never says "another step"', () => {
    const text = line('success', tied);
    expect(text).toBe('Kael won Flawed Steel. The work on Iron went well, and your cards held it.');
    expect(text).not.toContain('another step');
  });

  it('with no hand anywhere the tie still goes to the later step', () => {
    expect(decidingStepIndex('success', tied.map(s => ({ ...s, godTouched: false })))).toBe(1);
  });

  it('a won-at-a-price tie between two costly steps also prefers the hand', () => {
    const steps: CauseLineStep[] = [
      { band: 'near_miss', reach: 'iron', godTouched: true },
      { band: 'near_miss', reach: 'gold', godTouched: false },
    ];
    expect(line('success_at_cost', steps))
      .toBe('Kael won Flawed Steel, at a price. The work on Iron nearly broke, and your cards held it.');
  });
});

describe('THR-2218 — an untouched step that decided a won chapter', () => {
  it('names the deciding step plainly, then credits the touched step in its own sentence', () => {
    const text = line('success', [
      { band: 'success_at_cost', reach: 'iron', godTouched: true },
      { band: 'success', reach: 'gold', godTouched: false },
    ]);
    expect(text).toBe(`Kael won Flawed Steel. The work on Gold went well. ${CAUSE_GOD_ON_STEP('The work on Iron')}`);
    expect(text).not.toContain(CAUSE_GOD_ELSEWHERE);
  });

  it('a touched step with no noun leaves the god unnamed rather than invent one', () => {
    const text = line('success', [
      { band: 'near_miss', godTouched: true },
      { band: 'success', reach: 'gold', godTouched: false },
    ]);
    expect(text).toBe('Kael won Flawed Steel. The work on Gold went well.');
  });
});

describe('THR-2218 — a lost chapter keeps "another step"', () => {
  it('the untouched step that lost it is still named, and the cards were elsewhere', () => {
    const text = line('failure', [
      { band: 'success', reach: 'iron', godTouched: true },
      { band: 'failure', reach: 'gold', godTouched: false },
    ]);
    expect(text).toBe(`Kael lost Flawed Steel. The work on Gold failed, and ${CAUSE_GOD_ELSEWHERE}.`);
  });

  it('a lost tie still goes to the later step, hand or not', () => {
    expect(decidingStepIndex('failure', [
      { band: 'failure', reach: 'iron', godTouched: true },
      { band: 'failure', reach: 'gold', godTouched: false },
    ])).toBe(1);
  });
});
