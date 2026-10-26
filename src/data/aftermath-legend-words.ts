/**
 * The aftermath legend's meanings — THR-2061 (plan § Content, U7).
 *
 * Round-5 testers read the four story words on the aftermath (Scar, Bond, Boon,
 * Path) as labels with no referent: the legend named them but said nothing of
 * what each one means. Each word now carries a short meaning beside it, so the
 * vocabulary means something before any hover (Law 12: a legend at first
 * contact). The tooltip registry still explains each word in full (Law 17).
 *
 * Plan: `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md` (S2).
 */

import type { EncounterStageConsequenceCategory } from '../engine/views/stage/types';

/** What each category word means, in the fewest words that say it. Lower case: it follows the word. */
export const CONSEQUENCE_LEGEND_MEANINGS: Readonly<Record<EncounterStageConsequenceCategory, string>> = {
  scar: 'what it cost',
  bond: 'who stands with them',
  boon: 'what they gained',
  path: 'a way held open',
};

/** Between a category word and its meaning, and between the size steps. */
export const CONSEQUENCE_LEGEND_SEPARATOR = ' · ';
