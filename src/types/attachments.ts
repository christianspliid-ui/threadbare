/**
 * Attachment System type definitions.
 *
 * Attachments are anything that connects to an agent and modifies
 * what they can do, unlock, or experience. Six categories:
 * Possessions, Conditions, Blessings/Curses, Bestowed Powers, Agreements, Retainers.
 *
 * Design doc: Docs/plans/2026-03-10-attachment-system-design.md
 */

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

export type AttachmentTier = 1 | 2 | 3 | 4;

export const ATTACHMENT_TIER_NAMES: Record<AttachmentTier, string> = {
  1: 'Mundane',
  2: 'Storied',
  3: 'Mythic',
  4: 'Legendary',
};

export const ATTACHMENT_TIER_COLORS: Record<AttachmentTier, string> = {
  1: '#b0b0b0',  // Pale silver
  2: '#c87533',  // Copper/warm bronze
  3: '#4b0082',  // Deep violet/indigo
  4: '#d4a017',  // Gold/ember glow
};

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
  | 'bestowed_power' | 'agreement';

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
