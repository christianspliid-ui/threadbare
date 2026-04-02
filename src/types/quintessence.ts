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

/**
 * Threshold ratios for quintessence state transitions (Phase 2).
 * These are ratios of quintessence / quintessenceMax.
 * - healthy: above STRAINED
 * - strained: WEAKENED to STRAINED
 * - weakened: CRITICAL to WEAKENED
 * - critical: above 0 and below CRITICAL
 * - broken: 0
 */
export const QUINTESSENCE_THRESHOLDS = {
  STRAINED: 0.50,
  WEAKENED: 0.25,
  CRITICAL: 0.10,
  DISSOLUTION: 0.0,
} as const;

// ─── Numeric Constants (NFP #1: Tunability) ──────────────────────────

/** Passive regeneration rate per tick (tunable — NFP #1) */
export const QUINTESSENCE_PASSIVE_REGEN = 0.002;

/** Default quintessence for entities missing the property (fail-soft) */
export const QUINTESSENCE_DEFAULT = 1.0;

/** Default quintessence max capacity for entities missing the property (fail-soft) */
export const QUINTESSENCE_MAX_DEFAULT = 1.0;

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

// ─── Phase 2: Current/Max Helpers ────────────────────────────────────

import type { QuintessenceThresholdState } from './resolution';

/** Generic node-like interface for quintessence queries (avoids import cycle). */
interface QuintessenceNode {
  properties: Record<string, unknown>;
}

/**
 * Get the quintessence ratio (current / max) for a node.
 * Returns 1.0 if either value is missing (fail-soft: assume healthy).
 */
export function getQuintessenceRatio(node: QuintessenceNode): number {
  const current = (node.properties.quintessence ?? QUINTESSENCE_DEFAULT) as number;
  const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, current / max));
}

/**
 * Clamp quintessence to [0, quintessenceMax].
 * Returns the clamped value without mutating the node.
 */
export function clampQuintessence(node: QuintessenceNode): number {
  const current = (node.properties.quintessence ?? QUINTESSENCE_DEFAULT) as number;
  const max = (node.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
  return Math.max(0, Math.min(max, current));
}

/**
 * Get the threshold state for a node based on its quintessence ratio.
 * Uses the ratio of current / max against the threshold constants.
 */
export function getQuintessenceThresholdState(node: QuintessenceNode): QuintessenceThresholdState {
  const ratio = getQuintessenceRatio(node);

  if (ratio <= QUINTESSENCE_THRESHOLDS.DISSOLUTION) return 'broken';
  if (ratio < QUINTESSENCE_THRESHOLDS.CRITICAL) return 'critical';
  if (ratio < QUINTESSENCE_THRESHOLDS.WEAKENED) return 'weakened';
  if (ratio < QUINTESSENCE_THRESHOLDS.STRAINED) return 'strained';
  return 'healthy';
}
