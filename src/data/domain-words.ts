/**
 * Domain Word Scales — Verbal descriptors for all numeric stats.
 *
 * The Fantasy World Simulator's core principle: no numbers in the UI. Every stat
 * (domain capability, value orientation, reputation, bond strength) maps to a word.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit tier words here to change how the player
 * experiences numeric stat progression.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';

/**
 * 5-tier verbal scales for the Nine Reaches.
 * Each domain maps numeric capability (0–10) to a word describing prowess.
 */
export const DOMAIN_WORD_SCALES: Record<ReachDomain, [string, string, string, string, string]> = {
  // Iron: warfare and physical conflict
  iron: ['Meek', 'Trained', 'Formidable', 'Fearsome', 'Legendary'],

  // Gold: trade, economy, and material influence
  gold: ['Naive', 'Bartering', 'Shrewd', 'Masterful', 'Magnate'],

  // Shadow: stealth and concealment
  shadow: ['Exposed', 'Cautious', 'Subtle', 'Unseen', 'Phantom'],

  // Veil: magic and mystical power
  veil: ['Blind', 'Sensitive', 'Attuned', 'Channeler', 'Transcendent'],

  // Heart: social influence and emotional connection
  heart: ['Shunned', 'Tolerated', 'Liked', 'Beloved', 'Revered'],

  // Eye: knowledge and perception
  eye: ['Oblivious', 'Observant', 'Perceptive', 'Seer', 'Oracle'],

  // Stone: construction and material mastery
  stone: ['Clumsy', 'Handy', 'Skilled', 'Masterwork', 'Monumental'],

  // Star: fate and navigation
  star: ['Lost', 'Guided', 'Fated', 'Destined', 'Cosmic'],
  // Flesh removed (TB-075 Phase 1, 2026-03-28). See Docs/canon/cosmology.md for Quintessence canon.
};

/**
 * Convert a numeric domain value (0–10) to a word.
 * Tier = Math.min(4, Math.floor(clamped / 2))
 * Examples:
 *   0–1    → tier 0 (Meek, Naive, Exposed, ...)
 *   2–3    → tier 1 (Trained, Bartering, Cautious, ...)
 *   4–5    → tier 2 (Formidable, Shrewd, Subtle, ...)
 *   6–7    → tier 3 (Fearsome, Masterful, Unseen, ...)
 *   8–10   → tier 4 (Legendary, Magnate, Phantom, ...)
 */
/** Convert a numeric domain value (0–10) to a 0-indexed tier (0–4). */
export function getDomainTier(value: number): number {
  const clamped = Math.max(0, Math.min(10, value));
  return Math.min(4, Math.floor(clamped / 2));
}

export function getDomainWord(domain: ReachDomain, value: number): string {
  return DOMAIN_WORD_SCALES[domain][getDomainTier(value)];
}

/**
 * Axiological value pairs with virtue/flaw labels.
 * Positive values (+1.0) favor virtue (left). Negative (-1.0) favor flaw (right).
 */
export const VALUE_WORD_MAP: Record<ValuePair, [string, string]> = {
  mercy_ruthlessness: ['Merciful', 'Ruthless'],
  asceticism_extravagance: ['Ascetic', 'Extravagant'],
  honesty_cunning: ['Honest', 'Cunning'],
  tradition_novelty: ['Traditional', 'Innovative'],
  loyalty_ambition: ['Loyal', 'Ambitious'],
  revelation_discretion: ['Revealing', 'Discreet'],
  preservation_transformation: ['Preserving', 'Transforming'],
  sacrifice_survival: ['Self-Sacrificing', 'Self-Preserving'],
  courage_prudence: ['Courageous', 'Prudent'],
};

/**
 * Convert a value orientation (-1.0 to +1.0) to a word with intensity.
 *
 * Positive (≥0.0) → left label
 * Negative (<0.0) → right label
 * Intensity prefix:
 *   |value| ≥ 0.8: "Deeply {label}"
 *   0.5 ≤ |value| < 0.8: "{label}" (bare)
 *   0 ≤ |value| < 0.5: "Somewhat {label}"
 */
export function getValueWord(pair: ValuePair, value: number): string {
  const absValue = Math.abs(value);
  const [leftLabel, rightLabel] = VALUE_WORD_MAP[pair];
  const label = value >= 0 ? leftLabel : rightLabel;

  if (absValue >= 0.8) {
    return `Deeply ${label}`;
  }
  if (absValue >= 0.5) {
    return label;
  }
  return `Somewhat ${label}`;
}

/**
 * 5-tier reputation scale — how the world perceives the actor.
 */
export const REPUTATION_WORDS = [
  'Distrusted', // tier 0: 0.0–0.2
  'Unknown',    // tier 1: 0.2–0.4
  'Accepted',   // tier 2: 0.4–0.6
  'Respected',  // tier 3: 0.6–0.8
  'Revered',    // tier 4: 0.8–1.0
] as const;

/**
 * Convert reputation (0.0–1.0) to a word.
 * Tier = Math.min(4, Math.floor(clamped * 5))
 */
export function getReputationWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const tier = Math.min(4, Math.floor(clamped * 5));
  return REPUTATION_WORDS[tier];
}

/**
 * 5-tier bond strength scale — depth of relationship.
 */
export const BOND_STRENGTH_WORDS = [
  'Fragile',      // tier 0: 0.0–0.2
  'Growing',      // tier 1: 0.2–0.4
  'Strong',       // tier 2: 0.4–0.6
  'Deep',         // tier 3: 0.6–0.8
  'Unbreakable',  // tier 4: 0.8–1.0
] as const;

/**
 * Convert bond strength (0.0–1.0) to a word.
 * Tier = Math.min(4, Math.floor(clamped * 5))
 */
export function getBondStrengthWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const tier = Math.min(4, Math.floor(clamped * 5));
  return BOND_STRENGTH_WORDS[tier];
}

/**
 * 3-band duration scale — how long until something the player is watching
 * comes due (THR-1070).
 *
 * The other scales here band a *stat*; this one bands a *wait*. It exists
 * because the light-tier auto-resolve strip in `EncounterVeil` was the last
 * surface rendering a raw tick numeral — "auto-resolves in 4 ticks" — which
 * Law 13 forbids on any mortal-facing surface. The ratified Law 13 exception
 * (THR-890) covers resource-pool balances in persistent chrome; a countdown
 * inside an encounter is neither, so it needs words like everything else.
 *
 * **Why three bands and not five.** The live range is 1–8 ticks
 * (`RETINUE_VIGNETTE_TIMEOUT` is 8), and a 12-tick game day means the whole
 * scale fits inside one day. Five bands over eight ticks would give the player
 * distinctions they cannot act on — the strip is a "this is slipping away"
 * signal, not a schedule. Three bands is the coarsest split that still
 * separates "look now" from "you have a little time".
 *
 * The phrases complete the sentence "auto-resolves ___", so they are lowercase
 * and prepositional rather than Title-case adjectives like the scales above.
 * The zero case is worded by the caller as "auto-resolving now" (THR-1068) —
 * a different verb inflection, so it is deliberately not a band here.
 */
export const DURATION_WORDS = [
  'in a moment', // band 0: 1–2 ticks
  'shortly',     // band 1: 3–5 ticks
  'before long', // band 2: 6+ ticks
] as const;

/**
 * Inclusive upper tick bound of each duration band except the last, which is
 * open-ended. Tune the feel of the countdown by moving these, not by editing
 * the branching in the caller.
 */
export const DURATION_BAND_MAX_TICKS = [2, 5] as const;

/**
 * Convert a whole-tick wait to a word.
 *
 * Fail-soft: a caller that forgets its own zero case gets the nearest band
 * rather than a numeral or a throw — this surface must never render a number,
 * and NFP #4 says the tick loop never crashes on missing data.
 */
export function getDurationWord(ticks: number): string {
  for (let band = 0; band < DURATION_BAND_MAX_TICKS.length; band++) {
    if (ticks <= DURATION_BAND_MAX_TICKS[band]) return DURATION_WORDS[band];
  }
  return DURATION_WORDS[DURATION_WORDS.length - 1];
}

/**
 * 5-tier undertaking-progress scale — how far along a piece of work is (THR-1292 §3).
 *
 * Exists because the UI Law says magnitudes render as **words, never numerals**, and
 * the surface this replaces printed a raw `47%`. The percentage is still computed and
 * still drives the progress bar's width — what changes is that the player reads a
 * state of the work rather than a number out of the engine.
 *
 * Phrased as stages of an effort, not as fractions wearing words: "Barely begun" says
 * something a bar cannot, where "Twenty percent" only repeats it.
 */
export const UNDERTAKING_PROGRESS_WORDS = [
  'Barely begun',   // tier 0: 0–20%
  'Under way',      // tier 1: 20–40%
  'Halfway',        // tier 2: 40–60%
  'Well along',     // tier 3: 60–80%
  'Nearly done',    // tier 4: 80–100%
] as const;

/**
 * Convert undertaking completion (0–100) to a word.
 * Tier = Math.min(4, Math.floor(clamped/100 * 5))
 */
export function getUndertakingProgressWord(percentComplete: number): string {
  const clamped = Math.max(0, Math.min(100, percentComplete));
  const tier = Math.min(4, Math.floor((clamped / 100) * 5));
  return UNDERTAKING_PROGRESS_WORDS[tier];
}
