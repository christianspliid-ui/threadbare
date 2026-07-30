/**
 * ASCENDANT_REACH_REGISTER — the god-scale tier words for the Eight Reaches.
 *
 * THR-869. The mortal ladder in `NARRATIVE_LEXICON` dresses the ascendant in the wrong
 * clothes: a god read as "Trained", "Bartering", "Rootless" or "Destitute" is being
 * described with mortal capability words, which is the specific failure this table exists
 * to kill (Christian's verdict 2026-07-30: "as they ascended they were larger than life").
 *
 * Voice rules (plan doc `Docs/plans/2026-07-30-sphere-governed-ascendant-decision-record.md`
 * § Part B, Verdict 1):
 *  - God-scale and mythic, written from the far side of the Veil.
 *  - **Epic in stance, plain in wording.** Scale, not purple vocabulary — Christian's
 *    standing game-wide note is "prose too lyrical, move to simple/descriptive".
 *  - The echo line frames the reach as mortal-past carried into godhood, second person
 *    to match the sheet's existing address ("what you can make the world do…").
 *  - Prose-first: a tier is a word, never an index or a float.
 *
 * Consumed by BOTH the Ascendant Bar (`ascendant-bar/selectors.ts`) and the character
 * sheet's Dominion section, so the two surfaces cannot drift on what a tier is called.
 */

import type { ReachDomain } from '../types/traits';

/** Tier words per reach, ascending. Index 0 is the shallowest band. */
export const ASCENDANT_REGISTER_BANDS = 5;

/**
 * `computeTier` returns 1–10; the register carries 5 bands, so each band spans two
 * engine tiers. Tunable (NFP #1): widening the register means raising this table's
 * word count and lowering this constant, not editing lookup logic.
 */
export const ENGINE_TIERS_PER_REGISTER_BAND = 2;

export interface AscendantReachRegisterEntry {
  /** Five ascending god-scale tier words. Never mortal capability words. */
  tierWords: [string, string, string, string, string];
  /** One line framing the reach as a mortal life carried past death. */
  echoLine: string;
}

export const ASCENDANT_REACH_REGISTER: Record<ReachDomain, AscendantReachRegisterEntry> = {
  iron: {
    tierWords: ['Unblooded', 'Drawn', 'Holding', 'Unbreaking', 'War Itself'],
    echoLine: 'You held a line in life. It has not moved since.',
  },
  gold: {
    tierWords: ['Owing', 'Squaring', 'Creditor', 'Price-Setter', 'Every Debt'],
    echoLine: 'In life no one could out-bargain you. Death has not settled your accounts.',
  },
  shadow: {
    tierWords: ['Seen', 'Half-Seen', 'Unwitnessed', 'Unremembered', 'Never There'],
    echoLine: 'You moved unseen in life. Now nothing records that you were there at all.',
  },
  veil: {
    tierWords: ['Sealed', 'Thinning', 'Open', 'Passable', 'No Wall'],
    echoLine: 'You found the door in life. For you it no longer closes.',
  },
  heart: {
    tierWords: ['Unmourned', 'Missed', 'Wept For', 'Kept', 'Never Let Go'],
    echoLine: 'You were loved in life. That did not stop when you did.',
  },
  eye: {
    tierWords: ['Blinkered', 'Watching', 'Far-Seeing', 'Nothing Hidden', 'Before It Happens'],
    echoLine: 'You noticed what others missed. Now nothing waits to be noticed.',
  },
  stone: {
    tierWords: ['Unhewn', 'Set', 'Load-Bearing', 'Monumental', 'World-Root'],
    echoLine: 'You outlasted what you were built against. You are outlasting it still.',
  },
  star: {
    tierWords: ['Unnamed', 'Spoken', 'Hallowed', 'Sworn By', 'Every Rite'],
    echoLine: 'They spoke your name in life without knowing whose it was. They know now.',
  },
};

/**
 * The god-register word for a reach at an engine tier (1–10).
 *
 * Fail-soft (NFP #4): a non-finite tier (malformed trait edge upstream) or an unmapped
 * reach falls back to the shallowest band rather than rendering "undefined" or throwing.
 * The tick loop and the sheet must never crash on a bad capability read.
 */
export function getAscendantTierWord(reach: string, tier: number): string {
  const entry = ASCENDANT_REACH_REGISTER[reach as ReachDomain];
  if (!entry) return '';
  const safeTier = Number.isFinite(tier) ? tier : 1;
  const band = Math.ceil(safeTier / ENGINE_TIERS_PER_REGISTER_BAND);
  const index = Math.min(ASCENDANT_REGISTER_BANDS - 1, Math.max(0, band - 1));
  return entry.tierWords[index];
}

/** The mortal-past echo line for a reach. Empty string when unmapped (fail-soft). */
export function getAscendantEchoLine(reach: string): string {
  return ASCENDANT_REACH_REGISTER[reach as ReachDomain]?.echoLine ?? '';
}
