/**
 * THR-2052 — the next step's veil opens on the answer to the last one, so a
 * step committed on a running clock is never learned only by re-reading it.
 */

import { describe, expect, it } from 'vitest';
import { lastStepAnswer, type LastStepAnswerSource } from '../nudge-stage-content';

const resolved = (over: Partial<LastStepAnswerSource> = {}): LastStepAnswerSource => ({
  status: 'resolved',
  outcomeWord: 'held',
  afterimage: 'The ledger closed on her terms.',
  ...over,
});

describe('THR-2052 — lastStepAnswer', () => {
  it('names the step before the current one, its band word and what the player played', () => {
    const answer = lastStepAnswer([
      resolved({ choiceText: 'Cut The Thread' }),
      { status: 'current' },
    ]);
    expect(answer).toEqual({
      line: 'Step 1 held. You: Cut The Thread.',
      prose: 'The ledger closed on her terms.',
    });
  });

  it('reads the immediately previous step, not the first', () => {
    const answer = lastStepAnswer([
      resolved({ outcomeWord: 'triumphed' }),
      resolved({ outcomeWord: 'broke', afterimage: undefined, replayNarrative: 'It went badly.' }),
      { status: 'current' },
    ]);
    expect(answer).toEqual({ line: 'Step 2 broke.', prose: 'It went badly.' });
  });

  it('does not double a choice that already ends in a stop', () => {
    const answer = lastStepAnswer([resolved({ choiceText: 'Stay your hand.' }), { status: 'current' }]);
    expect(answer?.line).toBe('Step 1 held. You: Stay your hand.');
  });

  it('says nothing on the first step, after the end, or without a band word', () => {
    expect(lastStepAnswer([{ status: 'current' }, { status: 'future' }])).toBeNull();
    expect(lastStepAnswer([resolved(), resolved()])).toBeNull();
    expect(lastStepAnswer([resolved({ outcomeWord: undefined }), { status: 'current' }])).toBeNull();
    expect(lastStepAnswer(undefined)).toBeNull();
  });
});
