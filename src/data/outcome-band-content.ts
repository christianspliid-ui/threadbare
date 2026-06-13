/**
 * Outcome band prose content tables (THR-460).
 *
 * Two tables: OUTCOME_BAND_PROSE for the {outcome_phrase} placeholder,
 * OUTCOME_BAND_Q_FLAVOR for the {q_flavor} placeholder.
 *
 * Authors: drop {outcome_phrase} or {q_flavor} into encounter afterimage prose
 * to get band-flavored, dedup-guarded phrase injection.
 *
 * ─── Constants (NFP #1: Tunability) ──────────────────────────────────────────
 * | Name                              | Default | Purpose                          |
 * |-----------------------------------|---------|----------------------------------|
 * | OUTCOME_BAND_PHRASE_HISTORY_WINDOW | 12      | Dedup guard window (per actor)   |
 */

import type { PhraseEntry } from '../engine/proseSelection';
import type { OutcomeBand } from '../engine/outcomeConsequences';
import type { StepOutcome } from '../types/unifiedAction';

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many recent outcome-band phrase ids to hold per actor before eviction. */
export const OUTCOME_BAND_PHRASE_HISTORY_WINDOW = 12;

// ─── Prose tables ─────────────────────────────────────────────────────────────

/**
 * Phrase pool for the {outcome_phrase} placeholder.
 * Author guidance: short adverbial phrases that colour the HOW, not the WHAT.
 * 5 entries per band gives the dedup guard enough slack before forced repetition.
 */
export const OUTCOME_BAND_PROSE: Record<OutcomeBand, PhraseEntry[]> = {
  surge: [
    { phraseId: 'surge.1', text: 'with a surge of certainty' },
    { phraseId: 'surge.2', text: 'beyond all expectation' },
    { phraseId: 'surge.3', text: 'in a moment of rare clarity' },
    { phraseId: 'surge.4', text: 'with startling precision' },
    { phraseId: 'surge.5', text: 'as though fate itself leaned close' },
  ],
  neutral: [
    { phraseId: 'neutral.1', text: 'well enough' },
    { phraseId: 'neutral.2', text: 'without incident' },
    { phraseId: 'neutral.3', text: 'as expected' },
    { phraseId: 'neutral.4', text: 'cleanly enough' },
    { phraseId: 'neutral.5', text: 'steadily' },
  ],
  strained: [
    { phraseId: 'strained.1', text: 'at considerable cost' },
    { phraseId: 'strained.2', text: 'though something was given up' },
    { phraseId: 'strained.3', text: 'but the price lingered' },
    { phraseId: 'strained.4', text: 'with a debt that would not forget' },
    { phraseId: 'strained.5', text: 'at a price that would show later' },
  ],
  fortunate: [
    { phraseId: 'fortunate.1', text: 'skirting the edge of failure' },
    { phraseId: 'fortunate.2', text: 'barely holding together' },
    { phraseId: 'fortunate.3', text: 'through luck more than skill' },
    { phraseId: 'fortunate.4', text: 'by a narrower margin than comfort allows' },
    { phraseId: 'fortunate.5', text: 'only just' },
  ],
  setback: [
    { phraseId: 'setback.1', text: 'but the thread did not hold' },
    { phraseId: 'setback.2', text: 'and the moment passed' },
    { phraseId: 'setback.3', text: 'falling short of what was needed' },
    { phraseId: 'setback.4', text: 'leaving things worse than before' },
    { phraseId: 'setback.5', text: 'against all effort' },
  ],
  catastrophe: [
    { phraseId: 'catastrophe.1', text: 'with devastating consequence' },
    { phraseId: 'catastrophe.2', text: 'in a collapse that echoed outward' },
    { phraseId: 'catastrophe.3', text: 'breaking something that may not mend' },
    { phraseId: 'catastrophe.4', text: 'in a way that will be remembered' },
    { phraseId: 'catastrophe.5', text: 'as though a door had swung shut' },
  ],
};

/**
 * Phrase pool for the {q_flavor} placeholder.
 * Author guidance: short declarative sentences for quintessence / cosmic energy texture.
 * 5 entries per band.
 */
export const OUTCOME_BAND_Q_FLAVOR: Record<OutcomeBand, PhraseEntry[]> = {
  surge: [
    { phraseId: 'q.surge.1', text: 'The divine current quickens.' },
    { phraseId: 'q.surge.2', text: 'Quintessence flows freely.' },
    { phraseId: 'q.surge.3', text: 'The cost is repaid in full.' },
    { phraseId: 'q.surge.4', text: 'Power answers power.' },
    { phraseId: 'q.surge.5', text: 'The confluence holds.' },
  ],
  neutral: [
    { phraseId: 'q.neutral.1', text: 'Essence returns to balance.' },
    { phraseId: 'q.neutral.2', text: 'The current holds steady.' },
    { phraseId: 'q.neutral.3', text: 'Nothing gained, nothing lost.' },
    { phraseId: 'q.neutral.4', text: 'The flow continues.' },
    { phraseId: 'q.neutral.5', text: 'The tide is still.' },
  ],
  strained: [
    { phraseId: 'q.strained.1', text: 'The cost shows.' },
    { phraseId: 'q.strained.2', text: 'Quintessence thins.' },
    { phraseId: 'q.strained.3', text: 'The divine reserves ache.' },
    { phraseId: 'q.strained.4', text: 'Something is spent.' },
    { phraseId: 'q.strained.5', text: 'The reservoir lowers.' },
  ],
  fortunate: [
    { phraseId: 'q.fortunate.1', text: 'The near-miss leaves a mark.' },
    { phraseId: 'q.fortunate.2', text: 'Progress, however incomplete.' },
    { phraseId: 'q.fortunate.3', text: 'The thread holds — barely.' },
    { phraseId: 'q.fortunate.4', text: 'Potential, unfulfilled but present.' },
    { phraseId: 'q.fortunate.5', text: 'Momentum without arrival.' },
  ],
  setback: [
    { phraseId: 'q.setback.1', text: 'The current turns against.' },
    { phraseId: 'q.setback.2', text: 'Quintessence drains.' },
    { phraseId: 'q.setback.3', text: 'The effort goes unreturned.' },
    { phraseId: 'q.setback.4', text: 'Power spent; nothing gained.' },
    { phraseId: 'q.setback.5', text: 'The thread frays.' },
  ],
  catastrophe: [
    { phraseId: 'q.catastrophe.1', text: 'Quintessence haemorrhages.' },
    { phraseId: 'q.catastrophe.2', text: 'The divine current fractures.' },
    { phraseId: 'q.catastrophe.3', text: 'Power pours into the void.' },
    { phraseId: 'q.catastrophe.4', text: 'The reservoir cracks.' },
    { phraseId: 'q.catastrophe.5', text: 'Something fundamental tears.' },
  ],
};

// ─── Utility ──────────────────────────────────────────────────────────────────

const STEP_OUTCOME_TO_BAND: Record<StepOutcome, OutcomeBand> = {
  critical_success: 'surge',
  success: 'neutral',
  success_at_cost: 'strained',
  near_miss: 'fortunate',
  failure: 'setback',
  critical_failure: 'catastrophe',
};

/** Map a raw StepOutcome to its OutcomeBand for prose enrichment. */
export function stepOutcomeToOutcomeBand(outcome: StepOutcome): OutcomeBand {
  return STEP_OUTCOME_TO_BAND[outcome] ?? 'neutral';
}
