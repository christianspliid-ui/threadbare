/**
 * Divine Premonition Constants — Central Tuning File
 *
 * All tunable numbers for the Whisper and Compulsion systems.
 * Edit this file to tune divine premonition feel without touching logic.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

// ═══════════════════════════════════════════════════════════════════
// WHISPER — Subconscious nudges during idle/cooldown
// ═══════════════════════════════════════════════════════════════════

/** Base essence cost for a Whisper nudge (reach bias, sphere bias, gather strength/courage).
 * @range 1–3 */
export const WHISPER_ESSENCE_COST_BASE = 1;

/** Essence cost for ambition drift (more impactful than other nudges).
 * @range 1–5 */
export const WHISPER_ESSENCE_COST_AMBITION_DRIFT = 2;

/** Ticks before Whisper influence fully decays.
 * @range 15–40 */
export const WHISPER_INFLUENCE_DURATION = 25;

/** Initial strength of Whisper scoring bias added to agent's encounter scoring.
 * @range 0.05–0.3 */
export const WHISPER_INFLUENCE_STRENGTH = 0.15;

/** Per-tick decay of Whisper influence strength.
 * Should reach ~0 at WHISPER_INFLUENCE_DURATION ticks.
 * @range 0.003–0.015 */
export const WHISPER_INFLUENCE_DECAY_RATE = 0.006;

/** Minimum nudge options per Whisper modal.
 * @range 2–3 */
export const WHISPER_NUDGE_COUNT_MIN = 2;

/** Maximum nudge options per Whisper modal.
 * @range 2–4 */
export const WHISPER_NUDGE_COUNT_MAX = 3;

/** Probability that ambition drift actually triggers an ambition re-evaluation.
 * @range 0.1–0.5 */
export const AMBITION_DRIFT_PROBABILITY = 0.25;

// ═══════════════════════════════════════════════════════════════════
// COMPULSION — Direct divine pressure at scoring moment
// ═══════════════════════════════════════════════════════════════════

/** Minimum essence cost for Compulsion (low-threat encounters).
 * @range 2–5 */
export const COMPULSION_ESSENCE_COST_MIN = 3;

/** Maximum essence cost for Compulsion (high-threat encounters).
 * @range 4–8 */
export const COMPULSION_ESSENCE_COST_MAX = 5;

/** Score boost applied to the player's chosen candidate, guaranteeing it wins.
 * @range 3.0–10.0 */
export const COMPULSION_SCORE_BOOST = 5.0;

/** Number of top candidates shown in Compulsion modal.
 * @range 3–5 */
export const COMPULSION_CANDIDATE_COUNT = 4;

// ═══════════════════════════════════════════════════════════════════
// QUEUE & ELIGIBILITY
// ═══════════════════════════════════════════════════════════════════

/** Ticks before a queued premonition event goes stale and is silently discarded.
 * @range 2–5 */
export const PREMONITION_EXPIRY_TICKS = 3;

// ═══════════════════════════════════════════════════════════════════
// NUDGE RELEVANCE — Thresholds for contextual nudge derivation
// ═══════════════════════════════════════════════════════════════════

/** Below this quintessence, "gather strength" becomes a nudge candidate.
 * @range 0.5–0.8 */
export const GATHER_STRENGTH_QUINTESSENCE_THRESHOLD = 0.7;

/** Scoring boost to higher-threat encounters for "gather courage" nudge.
 * @range 0.1–0.5 */
export const COURAGE_THREAT_BOOST = 0.3;

/** Below this threat tolerance (courage_prudence value), "gather courage" surfaces.
 * Agents with courage_prudence above this are already brave enough.
 * @range -0.3–0.3 */
export const COURAGE_NUDGE_THRESHOLD = 0.2;

/** Ticks an ambition must be held with no milestones before "ambition drift" surfaces.
 * @range 30–100 */
export const AMBITION_STALENESS_TICKS = 50;

// ═══════════════════════════════════════════════════════════════════
// SPHERE-REACH MAPPING — for nudge color and essence pool matching
// ═══════════════════════════════════════════════════════════════════

import type { SphereName } from '../types';
import type { ReachDomain } from '../types/traits';

/** Maps each reach to its powering sphere (1:1 from cosmology model). */
export const REACH_TO_SPHERE: Record<ReachDomain, SphereName> = {
  iron: 'force',
  stone: 'matter',
  eye: 'energy',
  gold: 'life',
  veil: 'mind',
  heart: 'spirit',
  star: 'time',
  shadow: 'entropy',
};

/** Maps each sphere to its corresponding reach. */
export const SPHERE_TO_REACH: Partial<Record<SphereName, ReachDomain>> = {
  force: 'iron',
  matter: 'stone',
  energy: 'eye',
  life: 'gold',
  mind: 'veil',
  spirit: 'heart',
  time: 'star',
  entropy: 'shadow',
};

/** Sphere colors from the cosmology model — used for UI tinting. */
export const SPHERE_COLORS: Record<SphereName, string> = {
  // Foundation
  chaos: '#d4d4d8',
  order: '#fbbf24',
  light: '#fef3c7',
  darkness: '#8b7fbf',
  // Creation
  force: '#ff6b6b',
  matter: '#d4a87a',
  energy: '#ffe44d',
  life: '#33ff77',
  mind: '#44aaff',
  spirit: '#cc66ff',
  time: '#ffb355',
  entropy: '#8fd4c0',
};

/** Quintessence color for UI. */
export const QUINTESSENCE_COLOR = '#ff9ecf';
