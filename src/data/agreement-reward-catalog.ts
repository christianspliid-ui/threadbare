/**
 * Agreement Reward Catalog — edge-backed reward templates for agreement draws.
 *
 * Agreements are `relates_to` edges with `agreement: true`, not graph nodes.
 * They cannot be discovered by scanning nodes, so they need an explicit catalog.
 *
 * Design doc: Docs/plans/2026-04-06-attachment-slot-system-design.md
 */

import type { AttachmentEffect } from '../types/effects';
import type { AgreementType } from '../types/attachments';

export interface AgreementRewardTemplate {
  /** Unique template ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Agreement subtype */
  readonly agreementType: AgreementType;
  /** Rarity tier 1–4 */
  readonly tier: number;
  /** Tags for filtering (quality tags, reach tags, context tags) */
  readonly tags: string[];
  /** Human-readable terms */
  readonly terms: string;
  /** Mechanical effects carried on the agreement edge */
  readonly effects: AttachmentEffect[];
  /** Default duration in ticks (null = permanent) */
  readonly ticksRemaining: number | null;
}

/**
 * Starter agreement templates. Content-extensible — add more as encounters need them.
 */
export const AGREEMENT_REWARD_TEMPLATES: AgreementRewardTemplate[] = [
  {
    id: 'agreement.debt.minor',
    name: 'Minor Debt',
    agreementType: 'debt',
    tier: 1,
    tags: ['#trinket', '#gold'],
    terms: 'A small debt owed — repayable in coin or kind.',
    effects: [
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: 0.05 },
    ],
    ticksRemaining: 48,
  },
  {
    id: 'agreement.favour.earned',
    name: 'Favour Owed',
    agreementType: 'favour',
    tier: 1,
    tags: ['#trinket', '#heart'],
    terms: 'A favour earned through good deeds. Redeemable when the time is right.',
    effects: [
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
    ],
    ticksRemaining: 72,
  },
  {
    id: 'agreement.pact.alliance',
    name: 'Alliance Pact',
    agreementType: 'pact',
    tier: 2,
    tags: ['#relic', '#iron'],
    terms: 'A sworn alliance — fight together, share the spoils.',
    effects: [
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.2 },
      { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 },
    ],
    ticksRemaining: null,
  },
  {
    id: 'agreement.oath.service',
    name: 'Oath of Service',
    agreementType: 'oath',
    tier: 2,
    tags: ['#relic', '#star'],
    terms: 'A sacred oath binding service to another. Breaking it invites divine disfavour.',
    effects: [
      { type: 'behavior_weight', reach: 'star', multiplier: 1.3 },
      { type: 'action_gate', mode: 'block', reach: 'shadow' },
    ],
    ticksRemaining: null,
  },
  {
    id: 'agreement.bargain.dark',
    name: 'Dark Bargain',
    agreementType: 'bargain',
    tier: 3,
    tags: ['#relic', '#shadow', '#veil'],
    terms: 'Power at a price. The terms are always worse than they seem.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.1 },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.005, limitValue: 0.3 },
    ],
    ticksRemaining: null,
  },
  {
    id: 'agreement.treaty.trade',
    name: 'Trade Treaty',
    agreementType: 'treaty',
    tier: 1,
    tags: ['#trinket', '#gold'],
    terms: 'A trade agreement granting mutual economic benefit.',
    effects: [
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.08 },
    ],
    ticksRemaining: 96,
  },
];

/**
 * Look up an agreement template by ID.
 */
export function getAgreementTemplate(id: string): AgreementRewardTemplate | undefined {
  return AGREEMENT_REWARD_TEMPLATES.find(t => t.id === id);
}

/**
 * Filter agreement templates by tags (all tags must match).
 */
export function filterAgreementTemplates(
  tagFilters?: string[],
): AgreementRewardTemplate[] {
  if (!tagFilters || tagFilters.length === 0) return [...AGREEMENT_REWARD_TEMPLATES];

  return AGREEMENT_REWARD_TEMPLATES.filter(t =>
    tagFilters.every(tag => t.tags.includes(tag)),
  );
}
