/**
 * Ascendant Buff Consumption (THR-416)
 *
 * Applies and clears the one-shot Recede/Focus buffs stored on the ascendant
 * node when the next non-self action fires.
 *
 * Call `applyAscendantBuffs` at every non-self action-creation site before
 * calling `createUnifiedAction`, then pass the result's fields into the
 * action params.
 */

import type { WorldGraph } from './graph';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { AscendantProperties } from '../types/influence';
import type { RarityTier } from '../types/rarity';
import { clampRarityTier } from '../types/rarity';
import { emitTrace } from './traceBuffer';
import type { BuffConsumedTrace } from '../types/trace';

export interface BuffApplicationResult {
  /** Essence cost after the Recede discount (equals template cost when no buff). */
  effectiveEssenceCost: number;
  /** Rarity tier after the Focus boost (equals template tier when no buff). */
  effectiveRarityTier: RarityTier;
  /** True if at least one buff was active and consumed. */
  buffsConsumed: boolean;
  /** Discount fraction that was applied (0 when Recede was not active). */
  discountApplied: number;
  /** Tier points added (0 when Focus was not active). */
  tierBoostApplied: number;
}

/**
 * Read, apply, and clear the Recede/Focus buffs stored on the ascendant node.
 *
 * Mutates the graph in-place (clears the buff fields). Caller must call
 * `touchWorld(runtime)` after this returns so the world version bumps.
 *
 * Fail-soft: any error logs a warning and returns default (unmodified) values.
 */
export function applyAscendantBuffs(
  template: UnifiedActionTemplate,
  graph: WorldGraph,
  ascendantId: string,
  tick: number,
): BuffApplicationResult {
  const baseCost = template.essenceCost ?? 0;
  const baseRarity = template.rarityTier;
  const defaultResult: BuffApplicationResult = {
    effectiveEssenceCost: baseCost,
    effectiveRarityTier: baseRarity,
    buffsConsumed: false,
    discountApplied: 0,
    tierBoostApplied: 0,
  };

  try {
    const ascendantNode = graph.getNode(ascendantId);
    if (!ascendantNode) return defaultResult;

    const props = ascendantNode.properties as AscendantProperties | undefined;
    const discount = props?.nextActionDiscount;
    const tierBoost = props?.nextActionTierBoost;

    if (!discount && !tierBoost) return defaultResult;

    const discountApplied = discount ?? 0;
    const tierBoostApplied = tierBoost ?? 0;

    const effectiveEssenceCost = discount
      ? Math.floor(baseCost * (1 - discount))
      : baseCost;
    const effectiveRarityTier: RarityTier = tierBoost
      ? clampRarityTier(baseRarity + tierBoost)
      : baseRarity;

    // Clear consumed buffs from the ascendant node
    graph.updateNode(ascendantId, {
      properties: {
        ...(discount !== undefined && { nextActionDiscount: undefined }),
        ...(tierBoost !== undefined && { nextActionTierBoost: undefined }),
      },
    });

    const parts: string[] = [];
    if (discount) parts.push(`Recede −${Math.round(discount * 100)}% cost`);
    if (tierBoost) parts.push(`Focus +${tierBoost} tier`);

    emitTrace({
      category: 'buff_consumed',
      tick,
      ascendantId,
      consumingTemplateId: template.id,
      discountApplied,
      tierBoostApplied,
      effectiveEssenceCost,
      effectiveRarityTier,
      summary: `Buff consumed by ${template.name}: ${parts.join(', ')}`,
    } as BuffConsumedTrace);

    return {
      effectiveEssenceCost,
      effectiveRarityTier,
      buffsConsumed: true,
      discountApplied,
      tierBoostApplied,
    };
  } catch (err) {
    console.warn('[ascendantBuffs] applyAscendantBuffs error:', err);
    return defaultResult;
  }
}
