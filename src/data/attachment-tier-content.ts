/**
 * Attachment Tier Advancement — Constants & Tuning
 *
 * All tunable numbers for the Enchant/Empower tier advancement system.
 * Changing game feel = changing a number here, not rewriting logic.
 *
 * | Name                              | Default       | Purpose                                          |
 * |-----------------------------------|---------------|--------------------------------------------------|
 * | TIER_ADVANCEMENT_ESSENCE_COST     | {1:4,2:8,3:14}| Essence cost to advance FROM tier N               |
 * | TIER_ADVANCEMENT_DIFFICULTY       | {1:.20,2:.35,3:.50} | Step difficulty by source tier              |
 * | TIER_MODIFIER_SCALE_FACTOR        | 1.5           | Multiplier applied to edge modifiers per tier bump|
 * | MAX_ATTACHMENT_TIER               | 4             | Hard cap — Legendary                              |
 * | ENCHANT_TEMPLATE_ID               | artifact.enchant | Template ID for magical tier advancement       |
 * | EMPOWER_TEMPLATE_ID               | artifact.empower | Template ID for martial tier advancement       |
 */

import type { AttachmentTier } from '../types/attachments';

// ─── Essence Costs ───────────────────────────────────────────────
// Cost to advance FROM the current tier (tier 4 = Legendary = cannot advance further)

/** Essence cost to advance from each tier. Higher tiers cost more.
 * @range 1–20 per tier */
export const TIER_ADVANCEMENT_ESSENCE_COST: Record<1 | 2 | 3, number> = {
  1: 4,   // Mundane → Storied
  2: 8,   // Storied → Mythic
  3: 14,  // Mythic → Legendary
};

// ─── Difficulty ──────────────────────────────────────────────────

/** Step difficulty for advancement from each tier.
 * Resolution: capability + modifiers - difficulty → probability.
 * @range 0.0–1.0 */
export const TIER_ADVANCEMENT_DIFFICULTY: Record<1 | 2 | 3, number> = {
  1: 0.20,  // Mundane → Storied: easy
  2: 0.35,  // Storied → Mythic: moderate
  3: 0.50,  // Mythic → Legendary: hard
};

// ─── Modifier Scaling ────────────────────────────────────────────

/** When tier advances, all numeric modifiers on the possesses/bonded_to edge
 * are multiplied by this factor. Stacks multiplicatively across tiers.
 * @range 1.1–2.0 (1.5 = 50% boost per tier) */
export const TIER_MODIFIER_SCALE_FACTOR = 1.5;

// ─── Tier Cap ────────────────────────────────────────────────────

/** Maximum attachment tier. Legendary (4) is the hard cap. */
export const MAX_ATTACHMENT_TIER: AttachmentTier = 4;

// ─── Template IDs ────────────────────────────────────────────────

/** Action template ID for magical tier advancement (Veil/Rune reach). */
export const ENCHANT_TEMPLATE_ID = 'artifact.enchant';

/** Action template ID for martial/physical tier advancement (Iron/Stone reach). */
export const EMPOWER_TEMPLATE_ID = 'artifact.empower';

/** All template IDs that trigger tier advancement on success. */
export const TIER_ADVANCEMENT_TEMPLATE_IDS = [
  ENCHANT_TEMPLATE_ID,
  EMPOWER_TEMPLATE_ID,
] as const;

// ─── Duration ────────────────────────────────────────────────────

/** Duration range (in ticks) for enchant actions by source tier.
 * Higher tiers take longer. */
export const TIER_ADVANCEMENT_DURATION: Record<1 | 2 | 3, { min: number; max: number }> = {
  1: { min: 2, max: 3 },
  2: { min: 3, max: 4 },
  3: { min: 4, max: 6 },
};
