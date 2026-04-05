/**
 * Attention tier resolution — maps intrinsic encounter tier + court position
 * to the effective processing tier for the ascendant's attention model.
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { AttentionTier } from '../types/attention';
import type { CourtPosition } from '../types/influence';

// ─── Tier Matrix ──────────────────────────────────────────────────────────────

/**
 * Maps (courtPosition, intrinsicTier) → effectiveTier.
 *
 * - watched:   demotes one tier (story_beat→shaping, shaping→background, background→background)
 * - retinue:   preserves intrinsic tier exactly
 * - the_first: promotes background to shaping; story_beat and shaping unchanged
 */
const TIER_MATRIX: Record<
  Exclude<CourtPosition, 'dormant'>,
  Record<AttentionTier, AttentionTier>
> = {
  watched:   { background: 'background', shaping: 'background', story_beat: 'shaping' },
  retinue:   { background: 'background', shaping: 'shaping',    story_beat: 'story_beat' },
  the_first: { background: 'shaping',    shaping: 'shaping',    story_beat: 'story_beat' },
};

// ─── Core Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the effective attention tier for an encounter, given the agent's
 * court position.
 *
 * @param intrinsicTier - The tier assigned to the encounter by its template.
 * @param courtPosition - The agent's current court position, or null if unthreaded.
 * @returns The effective tier, or 'invisible' if the agent is dormant or unthreaded.
 */
export function resolveEffectiveTier(
  intrinsicTier: AttentionTier,
  courtPosition: CourtPosition | null,
): AttentionTier | 'invisible' {
  if (!courtPosition || courtPosition === 'dormant') return 'invisible';
  return TIER_MATRIX[courtPosition]?.[intrinsicTier] ?? 'background';
}

// ─── Mid-Encounter Promotion ──────────────────────────────────────────────────

/**
 * Triggers that can promote an encounter's tier mid-resolution.
 *
 * Tier-1 triggers (background → shaping):
 *   wound, discovery, chainAdvance, tierPromotion
 *
 * Tier-2 triggers (background → story_beat, shaping → story_beat):
 *   chainCulmination, multiAgentConvergence, doomThreshold, battleEscalation
 */
export interface PromotionTriggers {
  /** Agent took a wound during the encounter. Promotes background → shaping. */
  wound?: boolean;
  /** Agent discovered new information/location. Promotes background → shaping. */
  discovery?: boolean;
  /** Agent advanced along a narrative chain. Promotes background → shaping. */
  chainAdvance?: boolean;
  /** Agent's court tier was promoted. Promotes background → shaping. */
  tierPromotion?: boolean;
  /** Agent completed a narrative chain. Promotes any tier → story_beat. */
  chainCulmination?: boolean;
  /** Multiple agents converge in the same encounter. Promotes any tier → story_beat. */
  multiAgentConvergence?: boolean;
  /** Doom clock crossed a threshold. Promotes any tier → story_beat. */
  doomThreshold?: boolean;
  /** Battle escalated beyond normal scope. Promotes any tier → story_beat. */
  battleEscalation?: boolean;
}

/** Encounter tiers ordered low to high for comparison. */
const TIER_ORDER: AttentionTier[] = ['background', 'shaping', 'story_beat'];

/**
 * Check whether an in-progress encounter should be promoted to a higher tier
 * mid-encounter based on what happened during resolution.
 *
 * - Tier-1 triggers promote background → shaping (not shaping → story_beat).
 * - Tier-2 triggers promote background or shaping → story_beat.
 * - story_beat is the ceiling — never promoted further.
 * - Returns null if no promotion is warranted.
 */
export function checkMidEncounterPromotion(
  currentEffectiveTier: AttentionTier,
  triggers: PromotionTriggers,
): AttentionTier | null {
  if (currentEffectiveTier === 'story_beat') return null;

  // Tier-2 triggers: always promote to story_beat if not already there
  const hasTier2 =
    triggers.chainCulmination ||
    triggers.multiAgentConvergence ||
    triggers.doomThreshold ||
    triggers.battleEscalation;

  if (hasTier2) return 'story_beat';

  // Tier-1 triggers: only promote background → shaping
  if (currentEffectiveTier === 'background') {
    const hasTier1 =
      triggers.wound ||
      triggers.discovery ||
      triggers.chainAdvance ||
      triggers.tierPromotion;

    if (hasTier1) return 'shaping';
  }

  return null;
}

// ─── Notability Check ────────────────────────────────────────────────────────

/**
 * Criteria for flagging a digest entry as notable.
 * Only the fields relevant to notability are required — the full DigestEntry
 * shape is not needed here.
 */
export interface NotabilityInput {
  /** Net quintessence delta. Notable if < -0.3 (loss). */
  quintessenceDelta?: number;
  /** Net reputation delta (magnitude-based). Notable if |delta| >= 0.3. */
  reputationDelta?: number;
  /** Attachments lost during the encounter. Notable if any. */
  attachmentsLost?: string[];
  /** Whether the agent's influence tier was promoted. */
  tierPromoted?: boolean;
  /** Whether a narrative chain was completed. */
  chainCompleted?: boolean;
  /** Whether the agent took a wound. */
  hasWound?: boolean;
}

// Tunability constants (NFP #1)
const NOTABLE_QUINTESSENCE_LOSS_THRESHOLD = -0.3;
const NOTABLE_REPUTATION_MAGNITUDE_THRESHOLD = 0.3;

/**
 * Determine whether a digest entry qualifies as notable for highlight treatment.
 * Returns true if any notability criterion is met.
 */
export function isNotableEntry(entry: NotabilityInput): boolean {
  if (entry.quintessenceDelta !== undefined && entry.quintessenceDelta <= NOTABLE_QUINTESSENCE_LOSS_THRESHOLD) {
    return true;
  }
  if (entry.reputationDelta !== undefined && Math.abs(entry.reputationDelta) >= NOTABLE_REPUTATION_MAGNITUDE_THRESHOLD) {
    return true;
  }
  if (entry.attachmentsLost !== undefined && entry.attachmentsLost.length > 0) {
    return true;
  }
  if (entry.tierPromoted === true) return true;
  if (entry.chainCompleted === true) return true;
  if (entry.hasWound === true) return true;

  return false;
}
