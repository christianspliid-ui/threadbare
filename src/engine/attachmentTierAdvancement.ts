/**
 * Attachment Tier Advancement — advance a possession's tier (Mundane→Storied→Mythic→Legendary).
 *
 * Called by the unified action resolution pipeline when an Enchant or Empower action
 * resolves successfully. Pure function — returns effects for the caller to apply.
 *
 * NOTE (THR-996): no such production caller exists yet — this module's only importers
 * are its own test and the contract registry. Whether tier advancement is wired at all
 * is an open design call. THR-723 made the resolver *correct if called*; it did not
 * decide that it should be.
 *
 * ─── Which substrate a tier bump strengthens (THR-723) ──────────
 * A tier bump scales the artifact node's `stat_contribution` effects — the one live
 * item→capability substrate (THR-718): `collectStatContributions` sums them and
 * `computeRawScore` adds them inside its possesses/bonded_to walk, so a tier-4 blade
 * really is mightier on the character sheet than a tier-1 one.
 *
 * It deliberately does **not** scale Reach-domain keys in the possesses/bonded_to edge
 * `modifiers` bag. That path is dead at the argument level: `modifiers.ts` has exactly
 * one production reader (`visibility.ts`) and it only ever asks for `los_range`, so a
 * scaled `{iron: …}` strengthened a number nothing reads. Non-Reach keys are still
 * scaled — `los_range`-style attribute modifiers are a live seam and keep working.
 * The remaining dead reach-keyed *seed* writes are THR-997, not this module.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * All tunable numbers imported from `attachment-tier-content.ts`, except the power
 * ceiling, which is `ITEM_STAT_BAND_LEGENDARY` from `item-stat-bands.ts` — the same
 * band the content contract test enforces on authored catalogs. Advancement is
 * clamped to it so repeated tier bumps cannot become a back door around the
 * power budget (1.5× compounding would reach ~5.1 by tier 4 against a 2.0 ceiling).
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Returns a TierAdvancementResult that the caller emits as a tick event.
 * No independent trace emission here — follows the handleTierPromotion pattern.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                        | Fallback                                  |
 * |-------------------------------------|-------------------------------------------|
 * | Missing artifact node               | Return { advanced: false }                |
 * | Tier already at max                 | Return { advanced: false }                |
 * | No `effects` array on the node      | Advance tier, skip contribution scaling   |
 * | Non-numeric/NaN contribution value  | Preserve that key unscaled                |
 * | No possesses/bonded_to edge         | Advance tier, skip modifier scaling       |
 * | Non-numeric modifier                | Preserve that key unscaled                |
 * | Reach-domain modifier key           | Preserve unscaled — dead path (THR-723)   |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — advancement is deterministic once resolution succeeds.
 */

import type { WorldGraph } from './graph';
import type { AttachmentTier } from '../types/attachments';
import type { AttachmentEffect } from '../types/effects';
import {
  ATTACHMENT_TIER_NAMES,
} from '../types/attachments';
import { REACH_DOMAINS } from '../types/traits';
import {
  TIER_MODIFIER_SCALE_FACTOR,
  MAX_ATTACHMENT_TIER,
} from '../data/attachment-tier-content';
import { ITEM_STAT_BAND_LEGENDARY } from '../data/item-stat-bands';

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
  /**
   * Reach domains whose `stat_contribution` was scaled, for tracing. This is the
   * live item→capability substrate (THR-718/THR-723).
   */
  scaledContributions?: string[];
  /**
   * Non-Reach attribute keys scaled on the possesses/bonded_to edge, for tracing
   * (`los_range` and friends). Reach-domain keys are never scaled — see the
   * module docstring.
   */
  scaledModifiers?: string[];
  /** Reason for failure, if not advanced */
  reason?: string;
}

// ─── Internals ──────────────────────────────────────────────────

/** Reach-domain keys are dead on the edge-`modifiers` path (THR-723). */
const REACH_DOMAIN_KEYS: ReadonlySet<string> = new Set<string>(REACH_DOMAINS);

/** Match the historic modifier-scaling precision — 3 decimal places. */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Hold a scaled contribution inside the authored power budget. Symmetric, so a
 * cursed item's downside deepens with tier without running away either.
 */
function clampToBand(value: number): number {
  return Math.max(-ITEM_STAT_BAND_LEGENDARY, Math.min(ITEM_STAT_BAND_LEGENDARY, value));
}

/**
 * Scale every `stat_contribution` effect on an artifact's `effects[]` by one tier step.
 *
 * Returns the rewritten array only when something actually changed, so a node with no
 * contributions is left byte-identical (NFP #6 — additive over destructive).
 */
function scaleStatContributions(raw: unknown): {
  effects?: AttachmentEffect[];
  scaledContributions: string[];
} {
  const scaledContributions: string[] = [];
  if (!Array.isArray(raw)) return { scaledContributions };

  let changed = false;

  const effects = (raw as AttachmentEffect[]).map((effect) => {
    if (!effect || effect.type !== 'stat_contribution') return effect;

    const contributions = effect.contributions;
    if (!contributions || typeof contributions !== 'object') return effect;

    const scaled: Record<string, unknown> = {};
    for (const [domain, value] of Object.entries(contributions)) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        scaled[domain] = value; // preserved, not scaled
        continue;
      }
      scaled[domain] = clampToBand(round3(value * TIER_MODIFIER_SCALE_FACTOR));
      scaledContributions.push(domain);
      changed = true;
    }

    return { ...effect, contributions: scaled } as AttachmentEffect;
  });

  return changed ? { effects, scaledContributions } : { scaledContributions };
}

// ─── Core Function ──────────────────────────────────────────────

/**
 * Advance an artifact's tier by one step, strengthening its `stat_contribution`
 * effects (the live capability substrate) and any non-Reach attribute modifiers
 * on the possesses/bonded_to edge connecting it to its owner.
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

  // 3. Strengthen the live stat substrate (THR-723), then write tier + effects in a
  //    single updateNode — updateNode replaces the node, so two writes would race.
  const { effects, scaledContributions } = scaleStatContributions(node.properties.effects);

  graph.updateNode(artifactId, {
    properties: {
      ...node.properties,
      tier: newTier,
      ...(effects ? { effects } : {}),
    },
  });

  // 4. Scale the surviving live attribute seam on possesses/bonded_to edges.
  //    Reach-domain keys are deliberately left alone — nothing reads them.
  const scaledModifiers: string[] = [];
  const incomingEdges = graph.getIncomingEdges(artifactId);

  for (const edge of incomingEdges) {
    if (edge.type !== 'possesses' && edge.type !== 'bonded_to') continue;

    const modifiers = edge.properties.modifiers as Record<string, unknown> | undefined;
    if (!modifiers || typeof modifiers !== 'object') continue;

    let touched = false;
    const scaled: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(modifiers)) {
      if (typeof value === 'number' && !REACH_DOMAIN_KEYS.has(key)) {
        scaled[key] = round3(value * TIER_MODIFIER_SCALE_FACTOR);
        scaledModifiers.push(key);
        touched = true;
      } else {
        scaled[key] = value;
      }
    }

    if (!touched) continue;

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
    scaledContributions: [...new Set(scaledContributions)],
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
