/**
 * Attention pool operations — regen, spend, visual state, and attend cost.
 *
 * Pure functions; each returns a new state object (immutable).
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { AscendantAttentionState, AttentionVisualState } from '../types/attention';
import type { CourtPosition } from '../types/influence';
import {
  ATTENTION_POOL_FOCUSED_THRESHOLD,
  ATTENTION_POOL_BUSY_THRESHOLD,
  ATTENTION_POOL_STRAINED_THRESHOLD,
  ATTEND_COST_MODERATE,
  ATTEND_COST_HARD,
  ATTEND_COST_STORY_BEAT,
  COURT_COST_MULTIPLIER_FIRST,
  COURT_COST_MULTIPLIER_RETINUE,
  COURT_COST_MULTIPLIER_WATCHED,
} from '../data/attention-constants';

// ─── Threat Level Base Costs ─────────────────────────────────────────────────

/** Maps threat level (and 'story_beat' sentinel) to base attention cost. */
type ThreatOrBeat = 'moderate' | 'hard' | 'deadly' | 'story_beat';

const THREAT_BASE_COST: Record<ThreatOrBeat, number> = {
  moderate:   ATTEND_COST_MODERATE,
  hard:       ATTEND_COST_HARD,
  deadly:     ATTEND_COST_HARD,       // deadly shares the hard base cost
  story_beat: ATTEND_COST_STORY_BEAT,
};

// ─── Court Position Cost Multipliers ─────────────────────────────────────────

/** Maps court position to its attend-cost multiplier. */
const COURT_MULTIPLIER: Record<Exclude<CourtPosition, 'dormant'>, number> = {
  the_first: COURT_COST_MULTIPLIER_FIRST,
  retinue:   COURT_COST_MULTIPLIER_RETINUE,
  watched:   COURT_COST_MULTIPLIER_WATCHED,
};

// ─── regenAttention ───────────────────────────────────────────────────────────

/**
 * Add the state's `attentionRegen` to the pool, capped at `attentionCapacity`.
 * Returns a new state object; does not mutate the input.
 */
export function regenAttention(state: AscendantAttentionState): AscendantAttentionState {
  const next = Math.min(state.attentionPool + state.attentionRegen, state.attentionCapacity);
  return { ...state, attentionPool: next };
}

// ─── spendAttention ───────────────────────────────────────────────────────────

/**
 * Deduct `cost` from the attention pool, clamped at 0.
 * Returns a new state object; does not mutate the input.
 */
export function spendAttention(state: AscendantAttentionState, cost: number): AscendantAttentionState {
  const next = Math.max(state.attentionPool - cost, 0);
  return { ...state, attentionPool: next };
}

// ─── getAttentionVisualState ──────────────────────────────────────────────────

/**
 * Map the current pool fill ratio to a visual state label.
 *
 * Thresholds (ratio = pool / capacity):
 *   > 0.6  → 'focused'
 *   > 0.3  → 'busy'
 *   > 0.1  → 'strained'
 *   <= 0.1 → 'overwhelmed'
 */
export function getAttentionVisualState(state: AscendantAttentionState): AttentionVisualState {
  const ratio = state.attentionCapacity > 0
    ? state.attentionPool / state.attentionCapacity
    : 0;

  if (ratio > ATTENTION_POOL_FOCUSED_THRESHOLD) return 'focused';
  if (ratio > ATTENTION_POOL_BUSY_THRESHOLD)    return 'busy';
  if (ratio > ATTENTION_POOL_STRAINED_THRESHOLD) return 'strained';
  return 'overwhelmed';
}

// ─── computeAttendCost ────────────────────────────────────────────────────────

/**
 * Calculate the attention pool cost for attending a tug or story beat.
 *
 * Cost = base cost (by threat level) × court position multiplier.
 *
 * @param threatLevel - Threat level of the encounter, or 'story_beat' for full beats.
 * @param courtPosition - The agent's court position (dormant agents should not generate tugs).
 */
export function computeAttendCost(
  threatLevel: ThreatOrBeat,
  courtPosition: Exclude<CourtPosition, 'dormant'>,
): number {
  const base = THREAT_BASE_COST[threatLevel] ?? ATTEND_COST_MODERATE;
  const multiplier = COURT_MULTIPLIER[courtPosition] ?? COURT_COST_MULTIPLIER_RETINUE;
  return base * multiplier;
}
