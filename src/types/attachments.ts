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
import type { ContentCensusTag } from './contentCensus';
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

/**
 * Player-facing name for each subcategory (UI Law 14 — a `snake_case` union
 * member never reaches a screen). Exhaustive by type: adding a subcategory
 * fails to compile until it is named here, the same property
 * `ARTIFACT_CATEGORY_ART` relies on for its plates.
 */
export const POSSESSION_SUBCATEGORY_NAMES: Record<PossessionSubcategory, string> = {
  arms: 'Arms',
  mounts_beasts: 'Mounts & Beasts',
  vestments: 'Vestments',
  tomes_scrolls: 'Tomes & Scrolls',
  relics_talismans: 'Relics & Talismans',
  tools_instruments: 'Tools & Instruments',
  provisions: 'Provisions',
};

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
//
// RETIRED 2026-07-25 (THR-719). `OnUseTrigger` / `OnUseTriggerEffect` /
// `TriggerCondition` and the `onUseTriggers` property described item behavior that
// no production code ever fired — `attachmentTriggers.ts` had zero importers, so a
// sword that said it snapped never snapped. On-use behavior is now expressed with
// the production-wired `action_trigger` effect primitive in `effects[]`; see
// `src/engine/effects/actionTrigger.ts` and `actionTriggerPayloads.ts`.

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
  /** Content Census coverage classification (THR-474 schema / THR-477 values). Metadata only. */
  censusTag?: ContentCensusTag;
}

// ─── Possession Edge Properties ─────────────────────────────────

export interface PossessionEdgeProperties {
  modifiers: Record<string, number>;
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

/**
 * `'holding'` (THR-1297) — a place or resource the bearer holds. It is the
 * bearer-side *face* of an `owns` edge: the edge is the authority, this is
 * bookkeeping, exactly as `groupFormation`'s roster mirrors `member_of`. Written
 * only by `src/engine/holdings.ts`.
 *
 * Deliberately NOT a `PossessionSubcategory`: a holding is a different KIND of
 * attachment, not a flavour of loot. It is never drawn from a reward pool —
 * holdings are earned through undertakings, so `categoryWeights` stays holding-free
 * and `rewardCategoryNodeQuery` answers `null` for it on purpose.
 *
 * This rationale sits ABOVE the union rather than inside it because
 * `scripts/anchor-catalog-sources.ts`'s `parseUnionMembers` strips line comments but
 * not block comments, and reads every line between `=` and `;` as a member — a
 * multi-line JSDoc inside the union makes it report prose as unclassified union
 * members (impediment logged).
 */
export type AttachmentCategory =
  | 'possession' | 'condition' | 'blessing' | 'curse'
  | 'bestowed_power' | 'agreement' | 'spell'
  /** A named person who walks with the bearer, granting small always-on bonuses (THR-1096). */
  | 'companion'
  /** A place or resource the bearer owns — the face of an `owns` edge (THR-1297). */
  | 'holding';

/**
 * Every attachment category, as values (THR-1297).
 *
 * The union alone gave the sweep nothing to stand on: `AttachmentCategory` has no
 * runtime form, so adding `'holding'` produced compile errors in exactly three
 * places and silence in the five chains that bucket by category string. This const
 * plus the exhaustive display map below are the enforcement gift — the *next*
 * category gets the compile errors this one could not.
 */
export const ATTACHMENT_CATEGORIES: readonly AttachmentCategory[] = [
  'possession', 'condition', 'blessing', 'curse',
  'bestowed_power', 'agreement', 'spell', 'companion', 'holding',
] as const;

/**
 * Player-facing name for each attachment category (UI Law 14 — a `snake_case`
 * union member never reaches a screen). Exhaustive by type: adding a category
 * fails to compile until it is named here, mirroring
 * `POSSESSION_SUBCATEGORY_NAMES`.
 */
export const ATTACHMENT_CATEGORY_NAMES: Record<AttachmentCategory, string> = {
  possession: 'Possession',
  condition: 'Condition',
  blessing: 'Blessing',
  curse: 'Curse',
  bestowed_power: 'Bestowed Power',
  agreement: 'Agreement',
  spell: 'Spell',
  companion: 'Companion',
  holding: 'Holding',
};

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
