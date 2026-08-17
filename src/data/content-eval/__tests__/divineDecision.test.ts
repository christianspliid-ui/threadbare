/**
 * The divine outcome-authorship detector (THR-1166).
 *
 * Christian, attended session 2026-08-17, reading The Grateful Kin's
 * description: *"the concept that the god decides anything is wrong. the god
 * does not decide, but sways the odds and influences the outcomes."*
 *
 * Every fixture below is a **literal string**, not a value imported from the
 * corpus or rebuilt from the pattern. A test that fed the detector its own
 * regex — or that read the sentence back out of the file it is meant to police
 * — would pass whatever the detector did, which is the tautology class recorded
 * on `reference_threshold_constant_on_both_sides`. These sentences are quoted
 * from the corpus as it stood before the sweep, so the revert is real.
 */

import { describe, expect, it } from 'vitest';
import { countDivineDecision } from '../nudgeAuditDetectors';

describe('countDivineDecision — the god authoring a result', () => {
  // The line Christian read aloud. If only one case in this file survives
  // future edits, it is this one.
  it('catches the Grateful Kin line verbatim', () => {
    expect(
      countDivineDecision('The god decides whether the thanks is taken gracefully or fumbled.'),
    ).toBe(1);
  });

  it.each([
    ['a what-clause', 'The god decides what justice looks like here — the warden’s hands, or the alley’s.'],
    ['a whether-clause', 'The god decides whether the debt is paid as agreed or contested in the dark.'],
    ['a mid-sentence clause', 'The traveler weighs a cheap crossing against a long ford, and the god decides what that confidence is worth.'],
    ['a distant subject', 'A cosmic-scale turning-of-the-age encounter: a threaded prophet reads a comet the whole world is watching, and the god decides whether the omen means an ending or an enduring.'],
    ['the bare phrase', 'Manipulating the Code’s formal framing to decide the outcome by other means.'],
  ])('catches %s', (_label, sentence) => {
    expect(countDivineDecision(sentence)).toBe(1);
  });

  it('counts one hit per sentence, not one per pattern', () => {
    expect(
      countDivineDecision(
        'The god decides whether the hammer falls. The god decides what the prophet sees in the sky.',
      ),
    ).toBe(2);
  });
});

describe('countDivineDecision — what it must not catch', () => {
  /**
   * The god picking its own intervention is the entire game. Each of these is
   * live corpus prose that a looser pattern flagged during the THR-1166 blast
   * -radius measurement, or that the sweep deliberately left standing.
   */
  it.each([
    ['an infinitive complement', 'The god decides whether to press them into opening the granaries.'],
    ['chose-how-to, flawed_steel', 'The god perceived the threads of the forge and chose how to pull.'],
    ['chose-how-to, brink_rescue', 'The god perceived the thread pulling taut and chose how to act before it broke.'],
    ['the rule stated as a negation', 'Whether that distinction matters to the father is not the god’s to decide.'],
    ['the god’s own ledger', 'The reading had a cost the god had decided not to pay.'],
    ['decides-otherwise on an artifact', 'A blade, a cup, a band of worn iron, no different from any other until a god decides otherwise.'],
    ['the canon sentence itself', 'The god leans; the mortal still chooses.'],
    ['a swayed fork, post-sweep', 'A god can steady the thanks, or let it fumble.'],
    ['a mortal deciding', 'The magistrate decides whether the hammer falls.'],
  ])('passes %s', (_label, sentence) => {
    expect(countDivineDecision(sentence)).toBe(0);
  });
});
