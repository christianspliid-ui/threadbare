/**
 * THR-1473 — the surface evidence for the aftermath the director reviewed.
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server.` The ticket's Done-when asks for Snow on the Pass at
 * `?...&spawn=encounter.slice.snow_on_the_pass&outcome=success_at_cost`; a
 * scheduled run cannot start one, so the assertion runs against the same code the
 * veil draws through instead of against the pixels it produces.
 *
 * What this proves that `chipSentence.test.ts` cannot: that assertion measures the
 * *authored fields*, and a budget held there would still be wrong if the surface
 * composed them differently. This one goes through the real
 * {@link buildAftermathConsequences} on the real template — the adapter
 * `EncounterVeil` consumes — and reads `sentenceText`, the string the player
 * actually gets, after enrichment and linking have run.
 *
 * What it does not prove, stated so nobody mistakes it for the full gate: nothing
 * about paint. The change is content and a content-eval check — no file under
 * `src/components/**` changed behaviour, and every sentence got strictly shorter,
 * so wrapping can only improve. A live capture is owed if a later change makes a
 * chip sentence *longer*.
 */

import { describe, expect, it } from 'vitest';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import { SLICE_SNOW_ON_THE_PASS } from '../../../../../data/encounters/vertical-slice';
import { NUDGE_WORD_BUDGETS } from '../../../../../data/content-eval/nudgeAuthoringConstants';

/** Identity enrich + single-segment link, as the sibling adapter tests use. */
const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

/**
 * Both bands the director's sitting covered. The Done-when names the
 * `success_at_cost` URL, but the two scars quoted in the ticket —
 * `EXHAUSTED` and the nerve one — are the `failure` band's pair, so asserting
 * only the URL's band would miss the chips the ruling was actually about.
 */
const BANDS = ['success_at_cost', 'failure'] as const;

function runsOf(text: string, n: number): Set<string> {
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/u).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i += 1) out.add(words.slice(i, i + n).join(' '));
  return out;
}

for (const band of BANDS) {
  describe(`THR-1473 — Snow on the Pass, ${band}, as the veil composes it`, () => {
    const fallback = SLICE_SNOW_ON_THE_PASS.aftermathConfig?.fallback;
    const face = fallback?.byOutcome?.[band];
    const overview = face?.overview ?? fallback?.overview ?? '';
    const chips = buildAftermathConsequences({
      changes: face?.changes ?? fallback?.changes ?? [],
      reactions: face?.reactions ?? fallback?.reactions ?? [],
      ...passthrough,
    });

    it('finds the band the director reviewed', () => {
      // Population guard. An absent band would make every assertion below pass on
      // an empty chip list — the vacuous shape this repo names most often.
      expect(face).toBeDefined();
      expect(overview.length).toBeGreaterThan(0);
      expect(chips.length).toBeGreaterThan(0);
    });

    it('draws every chip sentence inside the budget', () => {
      const overBudget = chips
        .map(c => ({ id: c.id, words: c.sentenceText.trim().split(/\s+/u).filter(Boolean).length }))
        .filter(c => c.words > NUDGE_WORD_BUDGETS.chipSentence + 1); // +1 for the drawn em-dash
      expect(overBudget).toEqual([]);
    });

    it('draws no chip sentence that repeats a clause of the overview', () => {
      const overviewRuns = runsOf(overview, 4);
      const echoes = chips.flatMap(c =>
        [...runsOf(c.sentenceText, 4)].filter(r => overviewRuns.has(r)).map(r => `${c.id}: '${r}'`),
      );
      expect(echoes).toEqual([]);
    });

    it('still draws a sentence and a tag on every chip', () => {
      // Falsification of the two assertions above: both would pass on a band
      // whose chips had been deleted rather than shortened, or whose sentences
      // had been emptied.
      for (const chip of chips) {
        expect(chip.sentenceText.trim().length).toBeGreaterThan(0);
        expect(chip.kindLabel.length).toBeGreaterThan(0);
      }
    });
  });
}
