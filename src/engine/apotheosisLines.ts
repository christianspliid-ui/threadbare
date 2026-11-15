/**
 * THR-2227 — the Apotheosis's player-facing lines, filled for one mortal. Pure, and
 * deliberately tiny: `aspects.ts` (tick) and the Stage builder (UI) both read it, so
 * it imports nothing but the content and the pronoun helper.
 */

import { ambitionPronounsFor, resolveAmbitionPronouns } from './ambitionProse';
import { APOTHEOSIS_FIRST_FALLBACK } from '../data/aspect-content';

/**
 * Fill one Apotheosis line: `{first}` with the mortal's name (empty ⇒ "your First"),
 * then the mortal's stored pronouns (they/them only when the graph records none).
 */
export function fillApotheosisLine(line: string, name: string | undefined, gender: unknown): string {
  const first = name && name.trim().length > 0 ? name : APOTHEOSIS_FIRST_FALLBACK;
  const filled = resolveAmbitionPronouns(line.replace(/\{first\}/g, first), ambitionPronounsFor(gender));
  // "your First" can open a sentence.
  return filled.charAt(0).toUpperCase() + filled.slice(1);
}
