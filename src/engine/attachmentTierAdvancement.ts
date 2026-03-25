/**
 * Attachment Tier Advancement — advance a possession's tier (Mundane→Storied→Mythic→Legendary).
 *
 * Called by the unified action resolution pipeline when an Enchant or Empower action
 * resolves successfully. Pure function — returns effects for the caller to apply.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * All tunable numbers imported from `attachment-tier-content.ts`.
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Returns a TierAdvancementResult that the caller emits as a tick event.
 * No independent trace emission here — follows the handleTierPromotion pattern.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Missing artifact node           | Return { advanced: false }            |
 * | Tier already at max             | Return { advanced: false }            |
 * | No possesses/bonded_to edge     | Advance tier, skip modifier scaling   |
 * | Non-numeric modifier            | Skip that modifier key                |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — advancement is deterministic once resolution succeeds.
 */

import type { WorldGraph } from './graph';
import type { AttachmentTier } from '../types/attachments';
import {
  ATTACHMENT_TIER_NAMES,
} from '../types/attachments';
import {
  TIER_MODIFIER_SCALE_FACTOR,
  MAX_ATTACHMENT_TIER,
} from '../data/attachment-tier-content';

// ─── Result Types ───────────────────────────────────────────────

export interface TierAdvancementResult {
  /** Whether the advancement succeeded */
  advanced: boolean;
  /** The artifact node ID */
  artifactId: string;
  /** Previous tier (undefined if artifact not found) */
  oldTier?: AttachmentTier;
  /** New tier after advancement (undefined if not advanced) */
  newTier?: AttachmentTier;
  /** Human-readable old tier name */
  oldTierName?: string;
  /** Human-readable new tier name */
  newTierName?: string;
  /** Modifier keys that were scaled, for tracing */
  scaledModifiers?: string[];
  /** Reason for failure, if not advanced */
  reason?: string;
}

// ─── Core Function ──────────────────────────────────────────────

/**
 * Advance an artifact's tier by one step and scale modifiers on
 * the possesses/bonded_to edge connecting it to its owner.
 *
 * Called after successful Enchant/Empower action resolution.
 * Does NOT check essence cost or prerequisites — those are handled
 * by the action template system before resolution.
 */
export function advanceAttachmentTier(
  graph: WorldGraph,
  artifactId: string,
): TierAdvancementResult {
  const base: TierAdvancementResult = { advanced: false, artifactId };

  // 1. Validate artifact exists
  const node = graph.getNode(artifactId);
  if (!node) {
    return { ...base, reason: 'artifact_not_found' };
  }

  // 2. Read current tier (default to 1 if missing)
  const currentTier = (node.properties.tier as number) ?? 1;
  if (currentTier >= MAX_ATTACHMENT_TIER) {
    return {
      ...base,
      oldTier: currentTier as AttachmentTier,
      oldTierName: ATTACHMENT_TIER_NAMES[currentTier as AttachmentTier],
      reason: 'already_max_tier',
    };
  }

  const newTier = (currentTier + 1) as AttachmentTier;

  // 3. Update tier on the artifact node
  graph.updateNode(artifactId, {
    properties: {
      ...node.properties,
      tier: newTier,
    },
  });

  // 4. Find and scale modifiers on possesses/bonded_to edges
  const scaledModifiers: string[] = [];
  const incomingEdges = graph.getIncomingEdges(artifactId);

  for (const edge of incomingEdges) {
    if (edge.type !== 'possesses' && edge.type !== 'bonded_to') continue;

    const modifiers = edge.properties.modifiers as Record<string, number> | undefined;
    if (!modifiers || typeof modifiers !== 'object') continue;

    const scaled: Record<string, number> = {};
    for (const [key, value] of Object.entries(modifiers)) {
      if (typeof value === 'number') {
        scaled[key] = Math.round(value * TIER_MODIFIER_SCALE_FACTOR * 1000) / 1000;
        scaledModifiers.push(key);
      } else {
        (scaled as Record<string, unknown>)[key] = value;
      }
    }

    graph.updateEdge(edge.id, {
      properties: {
        ...edge.properties,
        modifiers: scaled,
      },
    });
  }

  return {
    advanced: true,
    artifactId,
    oldTier: currentTier as AttachmentTier,
    newTier,
    oldTierName: ATTACHMENT_TIER_NAMES[currentTier as AttachmentTier],
    newTierName: ATTACHMENT_TIER_NAMES[newTier],
    scaledModifiers: [...new Set(scaledModifiers)],
  };
}

/**
 * Check whether an artifact can be advanced (for UI gating / prerequisite checks).
 * Returns true if the artifact exists and its tier is below MAX_ATTACHMENT_TIER.
 */
export function canAdvanceTier(
  graph: WorldGraph,
  artifactId: string,
): boolean {
  const node = graph.getNode(artifactId);
  if (!node) return false;
  const tier = (node.properties.tier as number) ?? 1;
  return tier < MAX_ATTACHMENT_TIER;
}
