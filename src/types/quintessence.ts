/**
 * Quintessence — existential health meta-property.
 *
 * 0-1.0 continuous scale. All entities with SphereAffinity also carry quintessence.
 * NOT a reach. No axiological pair, no capability tier, no encounter affinity.
 * Displayed prose-only via IPK — never show numbers to player.
 *
 * Design: Docs/plans/2026-03-28-cosmological-symmetry-refactor.md (TB-075)
 * Implemented: Phase 12, Plan 03
 */

import { QUINTESSENCE_LEXICON } from '../data/quintessence-content';

// ─── Event Interface ──────────────────────────────────────────────────

/** Event representing a change to an entity's quintessence */
export interface QuintessenceEvent {
  targetNodeId: string;
  delta: number;     // negative = erosion, positive = recovery
  source: string;    // e.g., 'overchannel', 'encounter_failure', 'passive_regen', 'doom'
  tick: number;
}

// ─── Threshold Constants (NFP #1: Tunability) ────────────────────────

/** Threshold constants for quintessence state transitions */
export const QUINTESSENCE_THRESHOLDS = {
  WEAKENED: 0.25,
  CRITICAL: 0.10,
  DISSOLUTION: 0.0,
} as const;

// ─── Numeric Constants (NFP #1: Tunability) ──────────────────────────

/** Passive regeneration rate per tick (tunable — NFP #1) */
export const QUINTESSENCE_PASSIVE_REGEN = 0.002;

/** Default quintessence for entities missing the property (fail-soft) */
export const QUINTESSENCE_DEFAULT = 1.0;

/** Overchannel erosion amount per overchannel event (tunable — NFP #1) */
export const QUINTESSENCE_OVERCHANNEL_EROSION = 0.05;

/** Encounter failure erosion amount (tunable — NFP #1) */
export const QUINTESSENCE_ENCOUNTER_FAILURE_EROSION = 0.03;

// ─── Zero-State Rules ─────────────────────────────────────────────────

/** Zero-state rules by entity category */
export const ZERO_STATE_RULES: Record<string, string> = {
  actor: 'death_or_transformation',
  location: 'ruins_or_void',
  faction: 'dissolution',
  default: 'removal',
} as const;

// ─── Helper Functions ─────────────────────────────────────────────────

/**
 * Convert quintessence numeric value to prose word.
 * Uses QUINTESSENCE_LEXICON (10 levels, 0.0-1.0).
 * Clamps input to 0-1 range before mapping.
 */
export function quintessenceToWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const idx = Math.min(9, Math.floor(clamped * 10));
  return QUINTESSENCE_LEXICON[idx];
}
