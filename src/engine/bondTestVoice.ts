/**
 * Bond-test voice (THR-2057) — fills the bond test's name and pronoun tokens for
 * the mortal being bonded, so the scene says "Elara … she" instead of switching
 * to a template "they" after the vignette has named and gendered her.
 *
 * Tokens: `{name}` plus the ambition-prose pronoun set (`{they}`, `{They}`,
 * `{them}`, `{their}`, `{Their}`, `{is}`, `{s}` — see `resolveAmbitionPronouns`).
 * Pure: returns a new `BondTest`, never mutates the authored one. Fail-soft: an
 * unknown gender reads "they"; a missing name reads "This one".
 */

import type { BondTest } from '../types/meetingEncounter';
import { ambitionPronounsFor, resolveAmbitionPronouns } from './ambitionProse';

/** Fill `{name}` and the pronoun tokens in one line. */
export function fillBondLine(text: string, name: string | undefined, gender: unknown): string {
  if (!text.includes('{')) return text;
  const pronouns = ambitionPronounsFor(gender);
  const who = name && name.trim() ? name : 'This one';
  return resolveAmbitionPronouns(text.replace(/\{name\}/g, who), pronouns);
}

/** The bond test with every player-facing line filled for this mortal. */
export function personalizeBondTest(test: BondTest, name: string | undefined, gender: unknown): BondTest {
  const fill = (s: string) => fillBondLine(s, name, gender);
  const receptions = Object.fromEntries(
    Object.entries(test.receptions).map(([band, content]) => [band, { ...content, prose: fill(content.prose) }]),
  ) as unknown as BondTest['receptions'];
  return {
    ...test,
    setup: fill(test.setup),
    purposeLine: fill(test.purposeLine),
    factorLines: test.factorLines.map(f => ({ ...f, text: fill(f.text) })),
    nudges: test.nudges.map(n => ({ ...n, name: fill(n.name), effectLine: fill(n.effectLine) })),
    receptions,
  };
}
