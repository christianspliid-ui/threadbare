/**
 * Quintessence content — existential health lexicon and prose.
 *
 * Quintessence is a 0–1.0 continuous meta-property tracking how 'alive' or 'real'
 * an entity is. It is not a stat — it is existential vitality expressed through prose.
 * Displayed prose-only via IPK (Interactive Prose Keywords). No numbers to player.
 *
 * Design: Docs/plans/2026-03-28-cosmological-symmetry-refactor.md (TB-075)
 * Implemented: Phase 12, Plan 02
 *
 * 10-level lexicon maps numeric ranges to narrative words.
 * Range: 0.0 (dissolution) → 1.0 (absolute vitality)
 */

/**
 * Ordered lexicon: index 0 = lowest (near-dissolution), index 9 = highest (fully vital).
 * Each entry covers a 0.1 band of the 0.0–1.0 Quintessence scale.
 */
export const QUINTESSENCE_LEXICON: readonly string[] = [
  'Fraying',       // 0.0–0.1  — existence is unraveling
  'Flickering',    // 0.1–0.2  — presence is unstable
  'Tenuous',       // 0.2–0.3  — grip on reality is fragile
  'Steady',        // 0.3–0.4  — present but not at full vitality
  'Rooted',        // 0.4–0.5  — solid footing, recovery possible
  'Resonant',      // 0.5–0.6  — vital and aware, magic flows freely
  'Crystalline',   // 0.6–0.7  — existence has clarity and depth
  'Radiant',       // 0.7–0.8  — presence fills the space around it
  'Transcendent',  // 0.8–0.9  — beyond ordinary being
  'Absolute',      // 0.9–1.0  — complete; fully real
] as const;

/**
 * Tooltip definitions for each level, displayed on IPK hover (600ms delay).
 * One tooltip per level, matching QUINTESSENCE_LEXICON index-for-index.
 * Threadbare aesthetic: terse, haunted, implying cost even at the heights.
 */
export const QUINTESSENCE_TOOLTIPS: readonly string[] = [
  'Existence is unraveling. Dissolution is imminent.',
  'Presence is unstable. A strong shock could extinguish it.',
  'Grip on reality is fragile. Vulnerable to further diminishment.',
  'Present and grounded, though not at full vitality.',
  'Solid footing in the world. Recovery is possible.',
  'Vital and aware. Magic flows with ease.',
  'Existence has clarity and depth. Purpose is sharp.',
  'Presence fills the space around it. Others take notice.',
  'Beyond ordinary being. Existence borders on the divine.',
  'Complete. Fully real. The apex of existential vitality.',
] as const;

/**
 * Word scale for Quintessence — used in prose generation contexts.
 * 10 words mapping from dissolution (index 0) to absolute vitality (index 9).
 * Follows same structural pattern as DOMAIN_WORD_SCALES in domain-words.ts
 * but with 10 tiers to match the full Quintessence lexicon resolution.
 *
 * Used by enrichProse() and related prose pipeline utilities when generating
 * narrative text that references an entity's existential state.
 */
export const QUINTESSENCE_WORD_SCALE: readonly string[] = [
  'dissolving',     // 0.0–0.1
  'fading',         // 0.1–0.2
  'fragile',        // 0.2–0.3
  'present',        // 0.3–0.4
  'grounded',       // 0.4–0.5
  'vibrant',        // 0.5–0.6
  'luminous',       // 0.6–0.7
  'blazing',        // 0.7–0.8
  'transcendent',   // 0.8–0.9
  'absolute',       // 0.9–1.0
] as const;

// ─── Validation Constants ────────────────────────────────────────────────────

/**
 * Expected counts for the three Quintessence content arrays.
 * All must be 10 — one entry per 0.1-band of the Quintessence scale.
 * Used in tests to verify content completeness.
 */
export const QUINTESSENCE_CONTENT_COUNTS = {
  QUINTESSENCE_LEXICON: 10,
  QUINTESSENCE_TOOLTIPS: 10,
  QUINTESSENCE_WORD_SCALE: 10,
} as const;
