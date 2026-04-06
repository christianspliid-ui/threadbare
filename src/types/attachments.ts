/**
 * Attachment System type definitions.
 *
 * Attachments are anything that connects to an agent and modifies
 * what they can do, unlock, or experience. Six categories:
 * Possessions, Conditions, Blessings/Curses, Bestowed Powers, Agreements, Retainers.
 *
 * Design doc: Docs/plans/2026-03-10-attachment-system-design.md
 * Effect system: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { AttachmentEffect, ActivatedAbility } from './effects';
import type { RarityTier } from './rarity';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from './rarity';

// ─── Possession Subcategories ───────────────────────────────────

export type PossessionSubcategory =
  | 'arms'
  | 'mounts_beasts'
  | 'vestments'
  | 'tomes_scrolls'
  | 'relics_talismans'
  | 'tools_instruments'
  | 'provisions';

export const POSSESSION_SUBCATEGORIES: PossessionSubcategory[] = [
  'arms', 'mounts_beasts', 'vestments', 'tomes_scrolls',
  'relics_talismans', 'tools_instruments', 'provisions',
];

// ─── Tier System ────────────────────────────────────────────────

/** @deprecated Use RarityTier from ./rarity instead */
export type AttachmentTier = RarityTier;
export const ATTACHMENT_TIER_NAMES = RARITY_TIER_NAMES;
export const ATTACHMENT_TIER_COLORS = RARITY_TIER_COLORS;

// ─── Loss Conditions ────────────────────────────────────────────

export type LossCondition =
  | 'consumable'   // removed on use
  | 'breakable'    // can break via on-use trigger
  | 'stealable'    // can be taken by another agent
  | 'cursed'       // can't be willingly discarded
  | 'permanent';   // never lost

// ─── On-Use Triggers ────────────────────────────────────────────

export type TriggerCondition =
  | 'critical_failure'
  | 'failure'
  | 'success'
  | 'critical_success'
  | 'any_use'
  | 'first_use';

export interface OnUseTriggerEffect {
  type: 'add_condition' | 'remove_condition' | 'remove_possession'
      | 'spawn_actor' | 'add_possession' | 'modify_relationship';
  targetId?: string;
  modifiers?: Record<string, number>;
  ticksRemaining?: number | null;
  tags?: string[];
}

export interface OnUseTrigger {
  triggerCondition: TriggerCondition;
  /** Chance of firing when condition is met (0.0–1.0) */
  probability: number;
  effect: OnUseTriggerEffect;
  /** Prose template: {actor}, {target}, {item_name}, {location} */
  narrativeTemplate: string;
  tags?: string[];
}

// ─── Possession Node Properties ─────────────────────────────────

export interface PossessionNodeProperties {
  subcategory: PossessionSubcategory;
  /**
   * Slot tag — determines which slot cap this item counts against.
   * Takes precedence over subcategory for slot enforcement.
   * Added 2026-04-06 as part of the attachment slot system.
   * @see SLOT_CAPS in src/data/attachment-slot-constants.ts
   */
  slotTag?: string;
  tier: AttachmentTier;
  tags: string[];
  /** Human-readable one-liner: "+Iron, grants cavalry_charge, +movement" */
  mechanicalSummary: string;
  lossCondition: LossCondition;
  flavorText?: string;
  image?: string;
  source?: string;
  sphereAffinity?: string;
  onUseTriggers?: OnUseTrigger[];
  /** Trait tag granted while agent possesses this item (e.g. 'ruin_seeker' for treasure maps). */
  grantsTraitWhileHeld?: string;
  /** Effective trait level granted by this possession (default: 1). */
  grantedTraitLevel?: number;
  /** TickEvent type that triggers consumption of this item (e.g. 'hidden_site_discovered'). */
  consumeOnEvent?: string;
  /**
   * Generic effect system — composable effect primitives (types 1–29).
   * When present, the effect resolver uses these instead of legacy reachBonus.
   * @see Docs/plans/2026-03-31-generic-effect-system-design.md
   */
  effects?: AttachmentEffect[];
  /** Activatable abilities (spells, artifact powers) with costs and cooldowns. */
  activatedEffects?: ActivatedAbility[];
  /**
   * Reward shell mode.
   * - persist (default): instantiate as a normal held attachment
   * - service: resolve effects immediately at reward time without persisting an item
   */
  rewardMode?: 'persist' | 'service';
}

// ─── Possession Edge Properties ─────────────────────────────────

export interface PossessionEdgeProperties {
  modifiers: Record<string, number>;
  grants: string[];
  tags: string[];
}

// ─── Agreement Properties ───────────────────────────────────────

export type AgreementType =
  | 'pact' | 'debt' | 'favour' | 'oath' | 'treaty' | 'bargain';

export interface AgreementProperties {
  type: AgreementType;
  tier: AttachmentTier;
  tags: string[];
  terms: string;
  fulfillmentCondition: string;
  ticksRemaining: number | null;
  modifiers?: Record<string, number>;
}

// ─── Reward Pool Recipe ─────────────────────────────────────────

export type AttachmentCategory =
  | 'possession' | 'condition' | 'blessing' | 'curse'
  | 'bestowed_power' | 'agreement' | 'spell';

/**
 * Template-level reward recipe — what encounter templates specify.
 * Only declares category weights and optional filters.
 * Tier curve and bad outcome chance are resolved at runtime from outcome quality.
 */
export interface RewardPoolRecipe {
  categoryWeights: Partial<Record<AttachmentCategory, number>>;
  tagFilters?: string[];
  sphereTint?: string;
}

/**
 * Fully resolved recipe — constructed at resolution time by combining
 * a template RewardPoolRecipe with outcome-determined tier curve and bad outcome chance.
 * This is what assembleRewardPool consumes.
 */
export interface ResolvedRewardRecipe extends RewardPoolRecipe {
  tierCurve: Record<AttachmentTier, number>;
  badOutcomeChance: number;
}
