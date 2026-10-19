/**
 * THR-1914 — the armed card's transitions (Inspector plan § D9 way 3).
 *
 * A press arms; a second press on the armed card puts it down; pressing another card
 * swaps. A drag arms without toggling. Choosing stages a target (never casts) and clears
 * the last answer line; a note answers a click and keeps the arm.
 */
import { describe, it, expect } from 'vitest';
import { armForDrag, isStaged, noteArmed, pressHandCard, stageTarget } from '../armedState';

describe('armedState', () => {
  it('a press arms, a second press disarms, another card swaps', () => {
    const a = pressHandCard(null, 'whisper_insight');
    expect(a).toEqual({ actionId: 'whisper_insight', origin: 'hand', target: null, note: null });
    expect(pressHandCard(a, 'whisper_insight')).toBeNull();
    expect(pressHandCard(a, 'bless')?.actionId).toBe('bless');
  });

  it('a drag arms the card it carries and never toggles it off', () => {
    const a = armForDrag(null, 'whisper_insight');
    expect(a?.origin).toBe('drag');
    expect(armForDrag(a, 'whisper_insight')).toBe(a);
    const pressed = pressHandCard(null, 'whisper_insight');
    expect(armForDrag(pressed, 'whisper_insight')?.origin).toBe('drag');
  });

  it('choosing stages the target and clears the answer line; a note keeps the arm', () => {
    const a = noteArmed(pressHandCard(null, 'whisper_insight'), 'Whisper cannot touch that.');
    expect(a?.note).toBe('Whisper cannot touch that.');
    const staged = stageTarget(a, { kind: 'agent', id: 'shutash' });
    expect(staged?.target).toEqual({ kind: 'agent', id: 'shutash' });
    expect(staged?.note).toBeNull();
    expect(isStaged(staged, { kind: 'agent', id: 'shutash' })).toBe(true);
    expect(isStaged(staged, { kind: 'agent', id: 'nutat' })).toBe(false);
  });

  it('nothing armed stays nothing', () => {
    expect(stageTarget(null, { kind: 'agent', id: 'x' })).toBeNull();
    expect(noteArmed(null, 'x')).toBeNull();
  });
});
