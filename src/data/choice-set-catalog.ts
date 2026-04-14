/**
 * choice_set Proof-Pack Catalog (TB-128).
 *
 * Six authored choice_set effects exercising the primitive across reach domains,
 * selection modes, predicates, and consequence types. These serve as:
 *   1. Proof-of-correctness for the executor (used in integration tests)
 *   2. Content templates ready for inclusion in encounter reward pools
 *   3. Worked examples for content authors adding their own choice_set effects
 *
 * Authoring guide:
 *   - selectionMode: 'ai_auto' for fully headless content (rewards, event outcomes)
 *   - selectionMode: 'weighted_random' for AI agents with limited agency
 *   - selectionMode: 'player' for attended encounters where player choice matters
 *   - Use predicates to contextualise options (options that don't apply are hidden)
 *   - Keep consequences small — 1–3 effects per option keeps tempo fast
 *   - timeoutMs only on 'player' mode effects; omit for AI modes
 */

import type { ChoiceSetEffect } from '../types/effects';

// ─── 1. Loot Fork ────────────────────────────────────────────────────────────
// Combat reward: AI agent picks silently; player mode surfaces the modal.
// Three treasure options, no predicate gates (always all available).
// selectionMode: 'ai_auto' — drop into reward pool as-is for headless AI.

export const CHOICE_SET_LOOT_FORK: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'ai_auto',
  options: [
    {
      id: 'loot_gold',
      label: 'Coin Cache',
      description: 'A heavy purse heavy with silver and bronze — enough to buy favour or food.',
      consequences: [
        { type: 'resource_delta', resource: 'essence', amount: 8 },
      ],
    },
    {
      id: 'loot_knowledge',
      label: 'Cartographer\'s Notes',
      description: 'Careful maps of nearby passes, annotated with danger and opportunity.',
      consequences: [
        { type: 'reveal', target: 'hexes', range: 3 },
      ],
    },
    {
      id: 'loot_relic',
      label: 'Cracked Relic',
      description: 'A fragment of something older than the current age — crackling with residual power.',
      consequences: [
        { type: 'content_grant', templateIds: ['relic_fragment_t1', 'relic_fragment_t2'], selection: 'random' },
      ],
    },
  ],
};

// ─── 2. Dialogue Branch ──────────────────────────────────────────────────────
// Social encounter step: player picks how the First responds to a rival's offer.
// Player mode — pauses sim, surfaces ChoiceSetModal with timeout fallback.
// Predicate: 'shrewd offer' option only available if agent has negotiator trait.

export const CHOICE_SET_DIALOGUE_BRANCH: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'player',
  timeoutMs: 30_000,
  options: [
    {
      id: 'dialogue_accept',
      label: 'Accept the offer',
      description: 'Take what\'s offered. Debt acknowledged — a future favour owed.',
      consequences: [
        { type: 'resource_delta', resource: 'essence', amount: 12 },
        { type: 'trait_grant', grantedTrait: 'indebted' },
      ],
    },
    {
      id: 'dialogue_refuse',
      label: 'Refuse, plainly',
      description: 'A clean no. No explanation required. The rival respects the directness.',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: -5 },
      ],
    },
    {
      id: 'dialogue_counteroffer',
      label: 'Counter with your own terms',
      description: 'You\'ve seen this game before. Your counteroffer is elegant, and they know it.',
      predicate: 'has_trait:negotiator',
      consequences: [
        { type: 'resource_delta', resource: 'essence', amount: 6 },
        { type: 'resource_delta', resource: 'quintessence', amount: 2 },
        { type: 'trait_grant', grantedTrait: 'upper_hand' },
      ],
    },
  ],
};

// ─── 3. Sacrifice or Save ────────────────────────────────────────────────────
// Dramatic moral dilemma at exploration climax: two people trapped, one escape route.
// weighted_random for AI (character emerges from prior behavior); player for hero.
// Consequence of 'save_both' gated on trait 'dauntless' — not everyone can pull it off.

export const CHOICE_SET_SACRIFICE_OR_SAVE: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'weighted_random',
  options: [
    {
      id: 'sacrifice_self',
      label: 'Stay behind',
      description: 'You buy time with your own body. They make it out. The wound runs deep.',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: 15 },
        { type: 'trait_grant', grantedTrait: 'scarred' },
      ],
    },
    {
      id: 'save_companion',
      label: 'Push them through',
      description: 'One escape, one survivor. You made the choice before you could think about it.',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: 8 },
        { type: 'trait_grant', grantedTrait: 'mourning' },
      ],
    },
    {
      id: 'save_both',
      label: 'Carry you both',
      description: 'Impossible — but you\'ve done impossible before. The cost is real.',
      predicate: 'has_trait:dauntless',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: 20 },
        { type: 'trait_grant', grantedTrait: 'unbroken' },
      ],
    },
  ],
};

// ─── 4. Path Fork ────────────────────────────────────────────────────────────
// Wayfarer's crossroads: exploration reach encounter, player picks the route.
// Options gated by terrain/biome context. Wilderness path only if in wilderness.
// ai_auto for AI agents (they take the safe road by default).

export const CHOICE_SET_PATH_FORK: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'ai_auto',
  options: [
    {
      id: 'path_road',
      label: 'Follow the road',
      description: 'Worn stones underfoot. Slower but predictable — merchants and soldiers keep these safe.',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: -3 },
      ],
    },
    {
      id: 'path_shortcut',
      label: 'Cut through the valley',
      description: 'Half the distance, twice the risk. But you\'ve seen worse.',
      predicate: 'in_wilderness',
      consequences: [
        { type: 'reveal', target: 'hexes', range: 2 },
        { type: 'resource_delta', resource: 'doom', amount: 5 },
      ],
    },
    {
      id: 'path_high_ground',
      label: 'Climb for vantage',
      description: 'The peaks are cold but generous with secrets. You\'ll see what moves below.',
      predicate: 'in_wilderness',
      consequences: [
        { type: 'reveal', target: 'encounters', range: 4 },
        { type: 'resource_delta', resource: 'doom', amount: 3 },
      ],
    },
  ],
};

// ─── 5. Faction Alignment ────────────────────────────────────────────────────
// Completing a political mission — player chooses who gets the credit.
// Player mode with no predicates (all factions always visible, raw choice).

export const CHOICE_SET_FACTION_ALIGNMENT: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'player',
  timeoutMs: 30_000,
  options: [
    {
      id: 'align_merchant',
      label: 'Deliver the ledger to the Merchant Compact',
      description: 'Coin follows power. The Compact will owe you a debt measured in gold and access.',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'compact_favoured' },
        { type: 'resource_delta', resource: 'essence', amount: 20 },
      ],
    },
    {
      id: 'align_clergy',
      label: 'Pass the ledger to the Temple Archive',
      description: 'Knowledge is kept, not burned. The clergy remember — and repay in prayers and protection.',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'temple_blessed' },
        { type: 'resource_delta', resource: 'quintessence', amount: 4 },
      ],
    },
    {
      id: 'align_crown',
      label: 'Surrender it to the Crown Registrar',
      description: 'Loyalty is currency. The crown keeps accounts. You\'ve just opened one.',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'crown_registered' },
        { type: 'resource_delta', resource: 'doom', amount: -8 },
      ],
    },
    {
      id: 'align_none',
      label: 'Burn the ledger',
      description: 'No one wins this. Which means no one can use it against you.',
      consequences: [
        { type: 'resource_delta', resource: 'doom', amount: -15 },
      ],
    },
  ],
};

// ─── 6. The Mercy Test ────────────────────────────────────────────────────────
// Combat success reward: the beaten enemy is at your mercy.
// Predicate-gated options surface or hide based on agent traits.
// weighted_random: AI agents act from character.

export const CHOICE_SET_MERCY_TEST: ChoiceSetEffect = {
  type: 'choice_set',
  selectionMode: 'weighted_random',
  options: [
    {
      id: 'mercy_spare',
      label: 'Let them go',
      description: 'They\'re beaten and they know it. Mercy costs you nothing today — and buys much tomorrow.',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'reputation_merciful' },
        { type: 'resource_delta', resource: 'doom', amount: -5 },
      ],
    },
    {
      id: 'mercy_recruit',
      label: 'Offer them a place',
      description: 'Loyalty is earned in extremity. They\'ve seen what you can do. The question is what you\'ll do next.',
      predicate: 'has_trait:leader',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'sworn_follower' },
      ],
    },
    {
      id: 'mercy_extract',
      label: 'Extract information first',
      description: 'Pain and fear are useful, briefly. You learn what you need. Then you decide.',
      predicate: 'has_trait:interrogator',
      consequences: [
        { type: 'reveal', target: 'agent', range: 6 },
        { type: 'resource_delta', resource: 'doom', amount: 5 },
      ],
    },
    {
      id: 'mercy_execute',
      label: 'End it',
      description: 'Loose ends fray. You have no patience for loose ends.',
      consequences: [
        { type: 'trait_grant', grantedTrait: 'reputation_ruthless' },
        { type: 'resource_delta', resource: 'doom', amount: 8 },
      ],
    },
  ],
};

// ─── Export all for easy use in encounter content ─────────────────────────────

export const CHOICE_SET_PROOF_PACK = [
  CHOICE_SET_LOOT_FORK,
  CHOICE_SET_DIALOGUE_BRANCH,
  CHOICE_SET_SACRIFICE_OR_SAVE,
  CHOICE_SET_PATH_FORK,
  CHOICE_SET_FACTION_ALIGNMENT,
  CHOICE_SET_MERCY_TEST,
] as const;
