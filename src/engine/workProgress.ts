// src/engine/workProgress.ts
//
// The one resolver for how far a work has come (THR-1962).
//
// Before this, one undertaking's progress was worded by two tables reading the same
// number — the thread row said "well advanced" while the Journey tab said "Halfway",
// and only the row knew the work had halted. Every surface that names a work's
// progress (the thread row, the sheet's Designs line, the agent card, the Journey
// tab, the moment card, the debug tabs) now asks here, so one work reads one word.
//
// Words come from the content tables in `domain-words.ts` (the five-step progress
// scale and the trouble words); this module only decides which word applies.
//
// NFP #4 (Fail-soft): a missing or zero requirement reads as finished, never throws.
// NFP #5 (Narrative > mechanical): words only — the fraction is returned for bars,
// never for display.

import { getUndertakingProgressWord, getUndertakingTroubleWord } from '../data/domain-words';
import { UNDERTAKING_HALT_RATCHET_N } from '../data/strategic-action-constants';

/** The fields of a strategic project the progress word reads. */
export interface WorkProgressInput {
  readonly progress: number;
  readonly progressRequired: number;
  readonly halts?: number;
  readonly escalated?: boolean;
}

export interface WorkProgress {
  /** Completion 0–1, clamped. For bars and dots — never shown as a number. */
  readonly fraction: number;
  /** The five-step progress word, lower-cased for running text: "under way". */
  readonly progressWord: string;
  /** The trouble word when the work has halted or doubled down, else null. */
  readonly troubleWord: string | null;
  /** The word every surface shows: the trouble word when troubled, else the progress word. */
  readonly word: string;
  /** Whether the work has halted (the trouble word replaces the progress word). */
  readonly troubled: boolean;
}

/** Resolve the one word for how far a work has come. */
export function describeWorkProgress(project: WorkProgressInput): WorkProgress {
  const fraction = project.progressRequired > 0
    ? Math.max(0, Math.min(1, project.progress / project.progressRequired))
    : 1;
  const progressWord = getUndertakingProgressWord(fraction * 100).toLowerCase();
  const troubleWord = getUndertakingTroubleWord(
    project.halts ?? 0, project.escalated === true, UNDERTAKING_HALT_RATCHET_N,
  );
  return {
    fraction,
    progressWord,
    troubleWord,
    word: troubleWord ?? progressWord,
    troubled: troubleWord !== null,
  };
}
