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

  // Flesh: biology and physical resilience
  flesh: ['Frail', 'Hardy', 'Resilient', 'Enduring', 'Undying'],
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
export function getDomainWord(domain: ReachDomain, value: number): string {
  const clamped = Math.max(0, Math.min(10, value));
  const tier = Math.min(4, Math.floor(clamped / 2));
  return DOMAIN_WORD_SCALES[domain][tier];
}

/**
 * Axiological value pairs with left/right labels.
 * Positive values (+1.0) favor left label. Negative (-1.0) favor right.
 */
export const VALUE_WORD_MAP: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  cruelty_compassion: ['Cruel', 'Compassionate'],
  cunning_honesty: ['Cunning', 'Honest'],
  devotion_independence: ['Devoted', 'Independent'],
  loyalty_treachery: ['Loyal', 'Treacherous'],
  tradition_innovation: ['Traditional', 'Innovative'],
  dominance_humility: ['Dominant', 'Humble'],
  wrath_patience: ['Wrathful', 'Patient'],
  greed_generosity: ['Greedy', 'Generous'],
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
