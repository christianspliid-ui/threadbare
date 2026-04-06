/**
 * Reward Attachment Catalog — Template pool for encounter rewards.
 *
 * Exports three arrays of GraphNode objects used by the reward pool system
 * to assemble loot tables for encounter outcomes. Spread across tiers and
 * subcategories to give the assembler a rich sampling space.
 *
 * Design doc: Docs/plans/2026-03-26-encounter-reward-wiring-design.md
 */

import type { GraphNode } from '../types/graph';
import type { PossessionNodeProperties } from '../types/attachments';
import type { TraitDefinitionProperties } from '../types/traits';

// ═══════════════════════════════════════════════════════════════════════
// REWARD_POSSESSIONS — Artifact nodes (~50)
// ═══════════════════════════════════════════════════════════════════════

export const REWARD_POSSESSIONS: GraphNode[] = [
  // ─── Arms (T1 ×4) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_bronze_spear',
    type: 'artifact',
    name: 'Bronze Spear',
    properties: {
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.03 Iron, +0.02 Iron in combat',
      lossCondition: 'breakable',
      flavorText: 'Pitted and green with age, but the point still bites.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_hunting_bow',
    type: 'artifact',
    name: 'Hunting Bow',
    properties: {
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#ranged', '#combat'],
      mechanicalSummary: '+0.04 Iron, +0.01 Iron per combat success (max +0.03, decays 1/tick)',
      lossCondition: 'breakable',
      flavorText: 'Sinew-strung and warped from damp, but deadly enough at close range.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_rusted_mace',
    type: 'artifact',
    name: 'Rusted Mace',
    properties: {
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.04 Iron, +0.02 Iron / -0.01 Heart (blunt instrument)',
      lossCondition: 'breakable',
      flavorText: 'The rust is mostly cosmetic. Mostly.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'tradeoff', bonus: { reach: 'iron', value: 0.02 }, penalty: { reach: 'heart', value: 0.01 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_bone_knife',
    type: 'artifact',
    name: 'Bone Knife',
    properties: {
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#survival', '#combat', '#wilderness'],
      mechanicalSummary: '+0.03 Iron, 3 charges of +0.04 Iron burst (desperate strikes)',
      lossCondition: 'consumable',
      flavorText: 'Carved from the rib of something large. It will not last.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'iron', value: 0.04 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Arms (T2 ×3) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_blackiron_blade',
    type: 'artifact',
    name: 'Blackiron Blade',
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.08 Iron, +0.01 Iron per combat success (max +0.04, decays 1 stack/tick)',
      lossCondition: 'breakable',
      flavorText: 'Forged in a dead forge-town. The metal remembers heat it should not.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success', decayPerTick: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_crossbow_of_the_watch',
    type: 'artifact',
    name: 'Crossbow of the Watch',
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#ranged', '#eye', '#combat'],
      mechanicalSummary: "+0.07 Iron, +0.03 Eye, +1 awareness range (watchman's vigil)",
      lossCondition: 'stealable',
      flavorText: 'Issued to border watchers. The sighting marks are worn smooth by anxious thumbs.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.07 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_gate_seal_case',
    type: 'artifact',
    name: 'Gate Seal Case',
    properties: {
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#checkpoint', '#order', '#eye', '#gold'],
      mechanicalSummary: '+0.03 Eye, +0.02 Gold, +0.02 Gold in social (official authority)',
      lossCondition: 'stealable',
      flavorText: 'Wax seals, chalk, and a customs stamp wrapped in oilcloth. Boring to everyone except the people who know how power hides in paperwork.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'passive', reach: 'gold', value: 0.02 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_thornwood_staff',
    type: 'artifact',
    name: 'Thornwood Staff',
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#stone', '#combat'],
      mechanicalSummary: '+0.06 Iron, +0.03 Stone, thorns emerge when attacked (+0.03 Iron for 6 ticks, 12-tick cooldown)',
      lossCondition: 'breakable',
      flavorText: 'The wood is alive. It sprouts small leaves in spring, thorns in winter.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.06 },
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Arms (T3 ×2) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_hollowfang',
    type: 'artifact',
    name: 'Hollowfang',
    properties: {
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#weapon', '#melee', '#cursed', '#combat'],
      mechanicalSummary: '+0.12 Iron, -0.05 Heart, when damaged: +0.05 Iron burst decaying over 5 ticks (12-tick cooldown), grants dark_ferocity trait',
      lossCondition: 'cursed',
      flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.12 },
        { type: 'passive', reach: 'heart', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'decay', reach: 'iron', startValue: 0.05, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
        }, cooldown: 12 },
        { type: 'trait_grant', grantedTrait: 'dark_ferocity' },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_starfall_longbow',
    type: 'artifact',
    name: 'Starfall Longbow',
    properties: {
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#weapon', '#ranged', '#star', '#combat'],
      mechanicalSummary: '+0.10 Iron, +0.05 Star, stellar alignment: +0.03 Star for 6 ticks then dormant 12 ticks',
      lossCondition: 'permanent',
      flavorText: 'The string hums a note too low to hear. Arrows fly straighter than physics allows.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.10 },
        { type: 'passive', reach: 'star', value: 0.05 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'star', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Arms (T4 ×1) ───────────────────────────────────────────────────
  // NOTE: passive total 0.26 exceeds EFFECT_PER_ITEM_CAP=0.15.
  // This is a preserved legacy reachBonus value. Non-passive effects
  // are utility-only to avoid inflating the overrun further.
  {
    id: 'reward_arms_the_quiet_blade',
    type: 'artifact',
    name: 'The Quiet Blade',
    properties: {
      subcategory: 'arms',
      tier: 4,
      tags: ['#iron', '#weapon', '#melee', '#shadow', '#ancient', '#combat'],
      mechanicalSummary: '+0.18 Iron, +0.08 Shadow, blocks fear/intimidation conditions, when attacked: 20% faster movement for 6 ticks (12-tick cooldown), shadow focus persists until combat ends (+0.02 Shadow)',
      lossCondition: 'permanent',
      flavorText: 'It makes no sound when it cuts. Neither does the one it cuts.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.18 },
        { type: 'passive', reach: 'shadow', value: 0.08 },
        { type: 'until_event', event: 'leave_combat', reach: 'shadow', value: 0.02, destroyOnEvent: false },
        { type: 'reactive', trigger: 'attacked', effect: {
          type: 'range_modifier', movementCostMultiplier: 0.8
        }, duration: 6, cooldown: 12 },
        { type: 'tag_immunity', tags: ['fear', 'intimidation'] },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T1 ×3) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_padded_jerkin',
    type: 'artifact',
    name: 'Padded Jerkin',
    properties: {
      subcategory: 'vestments',
      tier: 1,
      tags: ['#iron', '#armor', '#cloth', '#combat'],
      mechanicalSummary: '+0.03 Iron, blocks bruise conditions',
      lossCondition: 'breakable',
      flavorText: 'Quilted linen stuffed with horsehair. Better than bare skin.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'tag_immunity', tags: ['bruise'] },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_merchant_silks',
    type: 'artifact',
    name: 'Merchant Silks',
    properties: {
      subcategory: 'vestments',
      tier: 1,
      tags: ['#gold', '#cloth', '#commercial', '#trade'],
      mechanicalSummary: '+0.04 Gold, +0.02 Gold in social encounters',
      lossCondition: 'stealable',
      flavorText: 'Dyed in the saffron of the eastern markets. Wealth worn on the sleeve.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_pilgrim_robe',
    type: 'artifact',
    name: "Pilgrim's Robe",
    properties: {
      subcategory: 'vestments',
      tier: 1,
      tags: ['#star', '#cloth', '#divine'],
      mechanicalSummary: '+0.03 Star reach',
      reachBonus: { star: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Threadbare and sun-bleached. It smells of incense and long roads.',
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T2 ×2) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_chainmail_hauberk',
    type: 'artifact',
    name: 'Chainmail Hauberk',
    properties: {
      subcategory: 'vestments',
      tier: 2,
      tags: ['#iron', '#armor', '#combat'],
      mechanicalSummary: '+0.08 Iron, when attacked: +0.03 Iron for 4 ticks (8-tick cooldown)',
      lossCondition: 'breakable',
      flavorText: 'Each ring was closed by hand. Someone cared enough to do it right.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'reactive', trigger: 'attacked', effect: {
          type: 'duration', ticks: 4, reach: 'iron', value: 0.03, destroyOnExpiry: true
        }, cooldown: 8 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_shadowweave_cloak',
    type: 'artifact',
    name: 'Shadowweave Cloak',
    properties: {
      subcategory: 'vestments',
      tier: 2,
      tags: ['#shadow', '#cloth', '#stealth'],
      // CAVEAT: 3 effects at T2 norm 1–2. All are utility (zero reach).
      // Accepted as-is — see systems audit.
      mechanicalSummary: '+0.07 Shadow, +1 awareness range, blocks tracking conditions',
      lossCondition: 'stealable',
      flavorText: 'The fabric drinks light. Corners seem deeper when you wear it.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.07 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        { type: 'tag_immunity', tags: ['tracked', 'marked'] },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T3 ×1) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_mantle_of_the_unremembered',
    type: 'artifact',
    name: 'Mantle of the Unremembered',
    properties: {
      subcategory: 'vestments',
      tier: 3,
      tags: ['#shadow', '#cloth', '#veil', '#cursed', '#stealth'],
      mechanicalSummary: '+0.12 Shadow, -0.06 Heart, entering new hex: +0.04 Shadow burst decaying over 4 ticks (8-tick cooldown), amplifies shadow encounter desire x1.5',
      lossCondition: 'cursed',
      flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.12 },
        { type: 'passive', reach: 'heart', value: -0.06 },
        { type: 'reactive', trigger: 'entered_hex', effect: {
          type: 'decay', reach: 'shadow', startValue: 0.04, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
        }, cooldown: 8 },
        { type: 'behavior_weight', reach: 'shadow', multiplier: 1.5 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T4 ×1) ──────────────────────────────────────────────
  // NOTE: passive total 0.23 exceeds EFFECT_PER_ITEM_CAP=0.15.
  // Preserved legacy reachBonus. Non-passive additions are modest.
  {
    id: 'reward_vestments_the_woven_sky',
    type: 'artifact',
    name: 'The Woven Sky',
    properties: {
      subcategory: 'vestments',
      tier: 4,
      tags: ['#star', '#cloth', '#divine', '#ancient'],
      mechanicalSummary: '+0.15 Star, +0.08 Veil, in mystical contexts: +0.03 Star, blocks curse/corruption/blight conditions, when damaged: +0.04 Veil ward for 6 ticks (12-tick cooldown)',
      lossCondition: 'permanent',
      flavorText: 'A robe of impossible blue, stitched with constellations that move. It weighs nothing.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.15 },
        { type: 'passive', reach: 'veil', value: 0.08 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 6, reach: 'veil', value: 0.04, destroyOnExpiry: true
        }, cooldown: 12 },
        { type: 'tag_immunity', tags: ['curse', 'corruption', 'blight'] },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T1 ×3) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_field_journal',
    type: 'artifact',
    name: 'Field Journal',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#eye', '#tome', '#knowledge'],
      mechanicalSummary: '+0.03 Eye, +0.02 Eye in exploration',
      lossCondition: 'breakable',
      flavorText: 'A naturalist\'s notes. The handwriting degrades toward the end.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_prayer_scroll',
    type: 'artifact',
    name: 'Prayer Scroll',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#star', '#scroll', '#divine'],
      mechanicalSummary: '+0.04 Star, 2 charges of +0.04 Star burst (divine invocation)',
      lossCondition: 'consumable',
      flavorText: 'The words are old and the ink fading. One reading left, perhaps.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'consumable_charge', charges: 2, onUse: { reach: 'star', value: 0.04 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_merchants_ledger',
    type: 'artifact',
    name: "Merchant's Ledger",
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#gold', '#tome', '#commercial'],
      mechanicalSummary: '+0.04 Gold, +0.02 Gold in social (trade leverage)',
      lossCondition: 'breakable',
      flavorText: 'Columns of numbers, trade routes inked in margins. Knowledge is currency.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_letters_of_introduction',
    type: 'artifact',
    name: 'Letters of Introduction',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#gold', '#scroll', '#service', '#social', '#patronage'],
      mechanicalSummary: 'Service reward: immediately grants Patron\'s Backing.',
      rewardMode: 'service',
      effects: [
        {
          type: 'content_grant',
          templateIds: ['reward_bestowed_patrons_backing'],
          selection: 'first',
        },
      ],
      lossCondition: 'consumable',
      flavorText: 'Folded notes bearing three wax seals. Show them once, and doors begin opening for you.',
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T2 ×2) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_chronicle_of_the_falling',
    type: 'artifact',
    name: 'Chronicle of the Falling',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#tome', '#knowledge'],
      mechanicalSummary: '+0.08 Eye, rescue near-miss Eye tests (+1 step, margin 5)',
      lossCondition: 'stealable',
      flavorText: 'A history of empires that collapsed. The final chapter is blank.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 5 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_veilscript_fragment',
    type: 'artifact',
    name: 'Veilscript Fragment',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#veil', '#scroll', '#knowledge', '#arcane'],
      mechanicalSummary: '+0.06 Veil, +0.03 Eye, +0.01 Veil per encounter (max +0.03, decays 1/tick)',
      lossCondition: 'breakable',
      flavorText: 'The letters rearrange themselves when you look away.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'stacking', reach: 'veil', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 1 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T3 ×1) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_the_silent_testament',
    type: 'artifact',
    name: 'The Silent Testament',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 3,
      tags: ['#star', '#tome', '#knowledge', '#ancient', '#ruins'],
      mechanicalSummary: '+0.10 Star, +0.05 Eye, prevents 1 condition loss, +0.03 Star at low health',
      lossCondition: 'permanent',
      flavorText: 'Written by a god who chose to die. Every page is a eulogy for a truth.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'prevent_loss', channel: 'condition', consumeOnPrevent: false },
        { type: 'conditional', condition: 'health_low', reach: 'star', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T4 ×1) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_codex_of_unmaking',
    type: 'artifact',
    name: 'Codex of Unmaking',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 4,
      tags: ['#veil', '#tome', '#knowledge', '#ancient', '#cursed', '#arcane', '#ruins'],
      mechanicalSummary: '+0.15 Veil, -0.08 Heart, blocks Heart actions (too detached to empathize), reveals all encounters, drifts toward ruthlessness',
      lossCondition: 'cursed',
      flavorText: 'The pages are blank until you bleed on them. Then they show you how everything ends.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.15 },
        { type: 'passive', reach: 'heart', value: -0.08 },
        { type: 'action_gate', mode: 'block', reach: 'heart' },
        { type: 'reveal', target: 'encounters', range: 'all' },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.008, limitValue: 0.50 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T1 ×3) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_iron_tongs',
    type: 'artifact',
    name: 'Iron Tongs',
    properties: {
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#stone', '#tool', '#craft'],
      mechanicalSummary: '+0.03 Stone, +0.02 Stone at home territory (workshop access)',
      lossCondition: 'breakable',
      flavorText: 'Blacksmith\'s tongs, well-used. The handles are polished smooth by grip.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_herbalists_pouch',
    type: 'artifact',
    name: "Herbalist's Pouch",
    properties: {
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#heart', '#tool', '#survival', '#craft', '#wilderness', '#healing'],
      mechanicalSummary: '+0.04 Heart, 3 charges of +0.03 Heart burst (field dressing)',
      lossCondition: 'consumable',
      flavorText: 'Dried leaves, crushed roots, and a mortar small enough to carry. The smell is medicinal.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'heart', value: 0.03 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_surveyors_glass',
    type: 'artifact',
    name: "Surveyor's Glass",
    properties: {
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#eye', '#tool', '#craft'],
      mechanicalSummary: '+0.04 Eye, +1 awareness range',
      lossCondition: 'breakable',
      flavorText: 'A single cracked lens in a brass tube. It magnifies, but distorts at the edges.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T2 ×2) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_alchemists_crucible',
    type: 'artifact',
    name: "Alchemist's Crucible",
    properties: {
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#veil', '#tool', '#knowledge', '#craft', '#arcane'],
      mechanicalSummary: '+0.07 Veil, +0.03 Eye, +0.03 Veil for 6 ticks then dormant 12 ticks (distillation cycle)',
      lossCondition: 'breakable',
      flavorText: 'Stained with substances that should not exist in nature. The inside glows faintly at dusk.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.07 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'veil', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_master_chisel',
    type: 'artifact',
    name: 'Master Chisel',
    properties: {
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#stone', '#tool', '#craft', '#ruins'],
      mechanicalSummary: '+0.08 Stone, +0.01 Stone per encounter success (max +0.04)',
      lossCondition: 'stealable',
      flavorText: 'Engraved with the mark of a guild that no longer exists. The edge never dulls.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.08 },
        { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success' },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T3 ×1) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_the_astrolabe_of_yven',
    type: 'artifact',
    name: 'Astrolabe of Yven',
    properties: {
      subcategory: 'tools_instruments',
      tier: 3,
      tags: ['#star', '#tool', '#ancient', '#knowledge', '#craft'],
      mechanicalSummary: '+0.10 Star, +0.05 Eye, reveals agents within 3 hexes, +0.03 Star in mystical',
      lossCondition: 'permanent',
      flavorText: 'The rings spin of their own accord. It does not measure the stars — it speaks with them.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'reveal', target: 'agent', range: 3 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T1 ×2) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_wayfarers_charm',
    type: 'artifact',
    name: "Wayfarer's Charm",
    properties: {
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#heart', '#talisman', '#travel'],
      mechanicalSummary: '+0.03 Heart, +0.02 Heart in social encounters',
      lossCondition: 'breakable',
      flavorText: 'A knot of twine and feathers, blessed by a roadside saint. It smells of campfire.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_bone_ward',
    type: 'artifact',
    name: 'Bone Ward',
    properties: {
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#iron', '#talisman', '#survival'],
      mechanicalSummary: '+0.04 Iron, blocks poison conditions',
      lossCondition: 'breakable',
      flavorText: 'Carved from a knucklebone and hung on gut string. Old magic, close to the body.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'tag_immunity', tags: ['poison'] },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_duelists_luck_token',
    type: 'artifact',
    name: "Duelist's Luck Token",
    properties: {
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#iron', '#talisman', '#combat', '#precision'],
      mechanicalSummary: 'Upgrade one close Iron failure by 1 step during combat.',
      effects: [
        {
          type: 'test_shaper',
          reach: 'iron',
          condition: 'in_combat',
          trigger: 'near_miss',
          maxMargin: 8,
          steps: 1,
        },
      ],
      lossCondition: 'stealable',
      flavorText: 'A nicked brass token passed between challengers. The bearer seems to recover from bad footing a heartbeat faster.',
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T2 ×2) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_ember_sigil',
    type: 'artifact',
    name: 'Ember Sigil',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#relic', '#divine'],
      mechanicalSummary: '+0.06 Star, +0.03 Heart, when blessed: +0.03 Star for 6 ticks',
      lossCondition: 'stealable',
      flavorText: 'A disc of fired clay stamped with a burning eye. Warm to the touch, always.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'reactive', trigger: 'blessed', effect: {
          type: 'duration', ticks: 6, reach: 'star', value: 0.03, destroyOnExpiry: true
        }, cooldown: 12 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_shadowglass_pendant',
    type: 'artifact',
    name: 'Shadowglass Pendant',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#shadow', '#relic', '#stealth'],
      mechanicalSummary: '+0.07 Shadow, reveals encounters within 2 hex range',
      lossCondition: 'stealable',
      flavorText: 'The glass is black but not opaque. Something moves inside when no one watches.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.07 },
        { type: 'reveal', target: 'encounters', range: 2 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_hearthglass_ward',
    type: 'artifact',
    name: 'Hearthglass Ward',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#relic', '#ward', '#quintessence', '#survival'],
      mechanicalSummary: 'Prevent up to 0.08 quintessence loss once, then shatter.',
      effects: [
        {
          type: 'prevent_loss',
          channel: 'quintessence',
          amount: 0.08,
          consumeOnPrevent: true,
        },
      ],
      lossCondition: 'consumable',
      flavorText: 'A bubble of furnace glass with a coal-dark core. It flashes warm once when disaster almost takes hold.',
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T3 ×2) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_heart_of_the_barrow',
    type: 'artifact',
    name: 'Heart of the Barrow',
    properties: {
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#stone', '#relic', '#ancient', '#ruins'],
      mechanicalSummary: '+0.12 Stone, -0.04 Shadow, 1-hex aura: +0.02 Stone to allies, +0.01 Stone per encounter (max +0.03)',
      lossCondition: 'permanent',
      flavorText: 'A stone pulled from a king\'s grave. It pulses like a heartbeat when pressed to earth.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.12 },
        { type: 'passive', reach: 'shadow', value: -0.04 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
        { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter' },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_the_weeping_icon',
    type: 'artifact',
    name: 'The Weeping Icon',
    properties: {
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#heart', '#relic', '#divine', '#cursed'],
      mechanicalSummary: '+0.10 Heart, -0.05 Eye, when damaged: +0.04 Heart for 6 ticks (12-tick cd), drifts toward mercy',
      lossCondition: 'cursed',
      flavorText: 'A small wooden saint that cries real tears. You feel what others feel, whether you wish to or not.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.10 },
        { type: 'passive', reach: 'eye', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 6, reach: 'heart', value: 0.04, destroyOnExpiry: true
        }, cooldown: 12 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: -0.005, limitValue: 0.30 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T4 ×1) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_the_fulcrum',
    type: 'artifact',
    name: 'The Fulcrum',
    properties: {
      subcategory: 'relics_talismans',
      tier: 4,
      tags: ['#veil', '#relic', '#ancient', '#divine', '#arcane', '#ruins'],
      mechanicalSummary: '+0.15 Veil, +0.08 Star, 1-hex aura: +0.03 Veil to all, mystical encounter bonus +0.04 Veil, outcome shift in mystical (+1 step)',
      lossCondition: 'permanent',
      flavorText: 'A sphere of perfect obsidian that balances on any surface. Reality bends toward it.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.15 },
        { type: 'passive', reach: 'star', value: 0.08 },
        { type: 'aura', radius: 1, target: 'all', reach: 'veil', value: 0.03 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.04 },
        { type: 'test_shaper', reach: 'veil', condition: 'in_mystical', trigger: 'near_miss', steps: 1, maxMargin: 5 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Mounts & Beasts (T1 ×3) ────────────────────────────────────────
  {
    id: 'reward_mounts_beasts_draft_pony',
    type: 'artifact',
    name: 'Draft Pony',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#mount', '#travel', '#wilderness'],
      mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack animal)',
      lossCondition: 'stealable',
      flavorText: 'Short-legged and ill-tempered, but carries twice its weight without complaint.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.9 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_hound',
    type: 'artifact',
    name: 'Tracking Hound',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#eye', '#survival', '#wilderness'],
      mechanicalSummary: '+0.04 Eye, amplifies exploration encounters (1.3x)',
      lossCondition: 'breakable',
      flavorText: 'Scarred ears and a cold nose. It finds things you did not know were lost.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'behavior_weight', reach: 'eye', multiplier: 1.3 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_pack_goat',
    type: 'artifact',
    name: 'Pack Goat',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#travel', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Stone, +1 consumable slot (pack carrier)',
      lossCondition: 'stealable',
      flavorText: 'It eats anything. It climbs anything. It judges you constantly.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'slot_bonus', slotTag: 'consumable', bonus: 1 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Mounts & Beasts (T2 ×2) ────────────────────────────────────────
  {
    id: 'reward_mounts_beasts_war_hound',
    type: 'artifact',
    name: 'War Hound',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#iron', '#weapon', '#combat', '#wilderness'],
      mechanicalSummary: '+0.06 Iron, +0.03 Eye, +0.03 Iron in combat, cooperation bias toward enemies: -0.2 (the hound snarls)',
      lossCondition: 'breakable',
      flavorText: 'Bred for violence and trained to silence. Its loyalty is absolute and terrifying.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.03 },
        { type: 'social_modifier', targetFilter: 'enemy', cooperationBias: -0.2 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_steppe_mare',
    type: 'artifact',
    name: 'Steppe Mare',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#mount', '#travel', '#wilderness'],
      mechanicalSummary: '+0.05 Gold, +0.03 Iron, 20% reduced movement cost, flee on damage (+0.04 Gold for 4 ticks, 12-tick cd)',
      lossCondition: 'stealable',
      flavorText: 'Long-legged and wind-quick. She runs like she remembers open grassland.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.05 },
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.8 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 4, reach: 'gold', value: 0.04, destroyOnExpiry: true
        }, cooldown: 12 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Mounts & Beasts (T3 ×1) ────────────────────────────────────────
  {
    id: 'reward_mounts_beasts_ashenmane_destrier',
    type: 'artifact',
    name: 'Ashenmane Destrier',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#mount', '#iron', '#combat', '#wilderness'],
      mechanicalSummary: '+0.10 Iron, +0.05 Gold, 20% reduced movement cost, grants cavalry_charge trait, amplifies combat encounters (1.4x)',
      lossCondition: 'permanent',
      flavorText: 'Grey as smoke and fearless in battle. It was born on a battlefield and has never left one.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.10 },
        { type: 'passive', reach: 'gold', value: 0.05 },
        { type: 'range_modifier', movementCostMultiplier: 0.8 },
        { type: 'trait_grant', grantedTrait: 'cavalry_charge' },
        { type: 'behavior_weight', reach: 'iron', multiplier: 1.4 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T1 ×4) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_hardtack_and_salt',
    type: 'artifact',
    name: 'Hardtack and Salt',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#food', '#provision', '#survival', '#wilderness', '#trade'],
      mechanicalSummary: '+0.03 Iron, +0.02 Iron in wilderness (trail sustenance)',
      lossCondition: 'consumable',
      flavorText: 'It will not spoil. It will also not taste like food.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'conditional', condition: 'in_wilderness', reach: 'iron', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_waterskin',
    type: 'artifact',
    name: 'Full Waterskin',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#drink', '#provision', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Iron, decays -0.003/tick to 0 (water runs out)',
      lossCondition: 'consumable',
      flavorText: 'Clean water. Worth more than gold in the dry places.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: 0.03, changePerTick: -0.003, limitValue: 0, destroyAtLimit: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_firestarter_kit',
    type: 'artifact',
    name: 'Firestarter Kit',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#tool', '#provision', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Stone, 3 charges of +0.03 Stone burst (fire-making)',
      lossCondition: 'consumable',
      flavorText: 'Flint, steel, and a bundle of tinder wrapped in oilcloth. The difference between living and dying.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'stone', value: 0.03 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_travelers_wine',
    type: 'artifact',
    name: "Traveler's Wine",
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#drink', '#provision', '#heart', '#trade'],
      mechanicalSummary: '+0.04 Heart, decays -0.005/tick to 0 (wine runs out)',
      lossCondition: 'consumable',
      flavorText: 'Cheap and sour, but it loosens tongues and lightens burdens.',
      effects: [
        { type: 'decay', reach: 'heart', startValue: 0.04, changePerTick: -0.005, limitValue: 0, destroyAtLimit: true },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T2 ×2) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_healing_poultice',
    type: 'artifact',
    name: 'Healing Poultice',
    properties: {
      subcategory: 'provisions',
      tier: 2,
      tags: ['#potion', '#provision', '#heart', '#healing', '#wilderness'],
      mechanicalSummary: '+0.07 Heart, decays -0.007/tick to 0 (poultice absorbed)',
      lossCondition: 'consumable',
      flavorText: 'Moss, spider silk, and something bitter. Applied to wounds, it numbs and knits.',
      effects: [
        { type: 'decay', reach: 'heart', startValue: 0.07, changePerTick: -0.007, limitValue: 0, destroyAtLimit: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_sanctuary_incense',
    type: 'artifact',
    name: 'Sanctuary Incense',
    properties: {
      subcategory: 'provisions',
      tier: 2,
      tags: ['#star', '#provision', '#divine', '#healing'],
      mechanicalSummary: '+0.06 Star, +0.03 Heart, lasts until rest (sanctuary ends when you move on)',
      lossCondition: 'consumable',
      flavorText: 'When burned, the smoke forms shapes that soothe the troubled spirit.',
      effects: [
        { type: 'until_event', event: 'rest', reach: 'star', value: 0.06, destroyOnEvent: true },
        { type: 'until_event', event: 'rest', reach: 'heart', value: 0.03, destroyOnEvent: true },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Intelligence (T2 ×2) ───────────────────────────────────────────
  {
    id: 'reward_intelligence_shrine_map',
    type: 'artifact',
    name: 'Vessen Shrine Map',
    properties: {
      subcategory: 'intelligence',
      tier: 2,
      tags: ['#shadow', '#intelligence', '#shrine_location', '#rival_god'],
      mechanicalSummary: '+0.03 Shadow reach',
      reachBonus: { shadow: 0.03 },
      lossCondition: 'permanent',
      flavorText:
        'Six pages of careful hand — route notes, guardian schedules, a margin sketch ' +
        'of the approach from the river side. Seventeen years of trade route intelligence ' +
        'compressed into a map fragment that changes the regional balance of power.',
      intelligenceType: 'shrine_location',
      targetRegion: 'vessen_uplands',
      detailLevel: 'full',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_intelligence_trade_route_dossier',
    type: 'artifact',
    name: 'Trade Route Dossier',
    properties: {
      subcategory: 'intelligence',
      tier: 2,
      tags: ['#shadow', '#intelligence', '#trade', '#economic'],
      mechanicalSummary: '+0.03 Shadow reach, +0.02 Gold reach',
      reachBonus: { shadow: 0.03, gold: 0.02 },
      lossCondition: 'stealable',
      flavorText:
        'A broker\'s working file — commodity flows, caravan schedules, price spreads ' +
        'between settlements. The margins are annotated in a cipher that takes patience to read.',
      intelligenceType: 'trade_network',
      detailLevel: 'partial',
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T3 ×1) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_veilwater_flask',
    type: 'artifact',
    name: 'Veilwater Flask',
    properties: {
      subcategory: 'provisions',
      tier: 3,
      tags: ['#veil', '#potion', '#provision', '#arcane'],
      mechanicalSummary: '+0.10 Veil (decays -0.008/tick), +0.05 Eye (decays -0.004/tick), reveals all hexes while active',
      lossCondition: 'consumable',
      flavorText: 'The liquid is perfectly clear but casts no reflection. Those who drink it see the world peeled back.',
      effects: [
        { type: 'decay', reach: 'veil', startValue: 0.10, changePerTick: -0.008, limitValue: 0, destroyAtLimit: true },
        { type: 'decay', reach: 'eye', startValue: 0.05, changePerTick: -0.004, limitValue: 0, destroyAtLimit: false },
        { type: 'reveal', target: 'hexes', range: 'all', duration: 12 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Effect Primitive Exercisers (verify all P1 primitives work) ────
  {
    id: 'reward_arms_ember_edge',
    type: 'artifact',
    name: 'Ember Edge',
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#combat', '#force'],
      mechanicalSummary: '+0.06 Iron in combat only, fades if unused',
      lossCondition: 'breakable',
      flavorText: 'The blade glows faintly at the edge. It cools between fights.',
      effects: [
        { type: 'conditional', condition: 'in_combat' as const, reach: 'iron' as const, value: 0.06 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_moonstone_pendant',
    type: 'artifact',
    name: 'Moonstone Pendant',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#veil', '#relic', '#magic', '#spirit'],
      mechanicalSummary: '+0.08 Veil for 3 ticks, then dormant 7 ticks',
      lossCondition: 'permanent',
      flavorText: 'It pulses with a rhythm that has nothing to do with your heartbeat.',
      effects: [
        { type: 'cooldown', activeTicks: 3, cooldownTicks: 7, reach: 'veil' as const, value: 0.08 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_veterans_shield',
    type: 'artifact',
    name: "Veteran's Shield",
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#shield', '#combat'],
      mechanicalSummary: '+0.015 Iron per combat survived, max 4 stacks',
      lossCondition: 'breakable',
      flavorText: 'Each dent tells a story. The shield remembers what you survived.',
      effects: [
        { type: 'stacking', reach: 'iron' as const, valuePerStack: 0.015, maxStacks: 4, stackOn: 'combat_success' as const, decayPerTick: 0 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_battle_salve',
    type: 'artifact',
    name: 'Battle Salve',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#flesh', '#consumable', '#healing', '#life'],
      mechanicalSummary: '3 charges: +0.10 Flesh per use, destroyed when empty',
      lossCondition: 'consumable',
      flavorText: 'Smells of pine tar and something sharper. Three doses, no more.',
      effects: [
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'flesh' as const, value: 0.10 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_fading_ward',
    type: 'artifact',
    name: 'Fading Ward',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#veil', '#scroll', '#magic', '#ward', '#entropy'],
      mechanicalSummary: '+0.10 Veil decaying 0.01/tick to floor of 0.03',
      lossCondition: 'stealable',
      flavorText: 'The ink is already lifting from the page. Use it before the words forget themselves.',
      effects: [
        { type: 'decay', reach: 'veil' as const, startValue: 0.10, changePerTick: -0.01, limitValue: 0.03, destroyAtLimit: false },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_double_edged_blade',
    type: 'artifact',
    name: 'Double-Edged Blade',
    properties: {
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#shadow', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.08 Iron, -0.04 Heart (cuts both ways)',
      lossCondition: 'breakable',
      flavorText: 'The grip is wrapped in black leather. It draws blood from the wielder as easily as the target.',
      effects: [
        { type: 'tradeoff', bonus: { reach: 'iron' as const, value: 0.08 }, penalty: { reach: 'heart' as const, value: -0.04 } },
      ],
    } as PossessionNodeProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// REWARD_CONDITIONS — Trait nodes (~26)
// ═══════════════════════════════════════════════════════════════════════

export const REWARD_CONDITIONS: GraphNode[] = [
  // ─── Wounds (T1 ×4) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_fractured_arm',
    type: 'trait',
    name: 'Fractured Arm',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'A broken bone limits striking power and grip strength.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.05 Iron (decays toward 0 over 24 ticks, self-removes on heal)',
      flavorText: 'The bone set crooked. Every swing ends in a wince.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.05, changePerTick: 0.002, limitValue: 0, destroyAtLimit: true },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_gashed_leg',
    type: 'trait',
    name: 'Gashed Leg',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#heart', '#combat'],
      description: 'Deep laceration impairs movement and endurance.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.04 Heart (decays over 30 ticks), +30% movement cost while wounded',
      flavorText: 'The bandage is soaked through again. Walking is a negotiation with pain.',
      effects: [
        { type: 'decay', reach: 'heart', startValue: -0.04, changePerTick: 0.0013, limitValue: 0, destroyAtLimit: true },
        { type: 'range_modifier', movementCostMultiplier: 1.3 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_cracked_ribs',
    type: 'trait',
    name: 'Cracked Ribs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'Breathing hurts. Fighting hurts more.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.02 Iron always, -0.04 Iron in combat (total -0.06 in combat)',
      flavorText: 'Each breath is shallow. Laughter is out of the question.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.02 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.04 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_bruised_knuckles',
    type: 'trait',
    name: 'Bruised Knuckles',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#stone', '#combat'],
      description: 'Swollen hands make delicate work impossible.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.03 Stone (heals fast, gone in ~12 ticks)',
      flavorText: 'Purple and fat, the fingers refuse to close properly.',
      effects: [
        { type: 'decay', reach: 'stone', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Wounds (T2 ×3) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_deep_stab_wound',
    type: 'trait',
    name: 'Deep Stab Wound',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#iron', '#heart', '#combat'],
      description: 'Internal damage that risks infection and limits exertion.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.07 Iron, -0.05 Heart; worsens when damaged (-0.03 Iron for 6 ticks)',
      flavorText: 'The blade went deep. Something inside is not where it should be.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.07 },
        { type: 'passive', reach: 'heart', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_shattered_shield_arm',
    type: 'trait',
    name: 'Shattered Shield Arm',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#iron', '#combat'],
      description: 'The arm that blocks can no longer bear weight.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.08 Iron (decays over 36 ticks), blocks Iron actions in combat',
      flavorText: 'The bones ground together like millstones. The shield hangs useless.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: 0.0022, limitValue: 0, destroyAtLimit: true },
        { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_blinded_eye',
    type: 'trait',
    name: 'Blinded Eye',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#wound', '#physical', '#eye', '#combat'],
      description: 'Lost depth perception impairs awareness and aim.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.08 Eye, -1 awareness range, 0.6x combat desire (fear of fighting blind)',
      flavorText: 'The world is flat now. Distance is a guess, and guesses get you killed.',
      effects: [
        { type: 'passive', reach: 'eye', value: -0.08 },
        { type: 'range_modifier', awarenessRangeBonus: -1 },
        { type: 'behavior_weight', reach: 'iron', multiplier: 0.6 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Wounds (T3 ×1) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_spine_wound',
    type: 'trait',
    name: 'Spine Wound',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#wound', '#physical', '#iron', '#flesh', '#combat'],
      description: 'Catastrophic injury to the back. Movement and combat severely impaired.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.12 Iron, -0.05 Heart, blocks Iron actions in combat, +50% movement cost, strongly suppresses iron encounters (0.2× desire weight)',
      flavorText: 'The body remembers what the spine cannot. Every step is borrowed time.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.12 },
        { type: 'passive', reach: 'heart', value: -0.05 },
        { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
        { type: 'range_modifier', movementCostMultiplier: 1.5 },
        { type: 'behavior_weight', reach: 'iron', multiplier: 0.2 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Blessings (T1 ×3) ──────────────────────────────────────────────
  {
    id: 'reward_condition_dawn_kissed',
    type: 'trait',
    name: 'Dawn-Kissed',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#star', '#divine', '#healing'],
      description: 'A faint warmth lingers, granting minor divine favor.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'The first light of morning seems to linger on your skin longer than it should.',
      mechanicalSummary: '+0.04 Star, +0.02 Eye when exploring',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_healers_touch',
    type: 'trait',
    name: "Healer's Touch",
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#heart', '#stone', '#healing'],
      description: 'Hands carry a soothing warmth that eases pain.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Your palms tingle. The wounded lean toward you without knowing why.',
      mechanicalSummary: '+0.03 Heart, +0.03 Stone, temporary +0.03 Stone when healed',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'reactive', trigger: 'healed', effect: {
          type: 'duration', ticks: 6, reach: 'stone', value: 0.03, destroyOnExpiry: false,
        }},
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_fortune_marked',
    type: 'trait',
    name: 'Fortune-Marked',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#gold', '#divine', '#trade'],
      description: 'Luck bends slightly in your direction.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Coins turn up in pockets. Doors left ajar swing the right way.',
      mechanicalSummary: '+0.04 Gold, rescues near-miss Gold outcomes (+1 step)',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'test_shaper', reach: 'gold', trigger: 'near_miss', steps: 1 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Blessings (T2 ×2) ──────────────────────────────────────────────
  {
    id: 'reward_condition_saints_ward',
    type: 'trait',
    name: "Saint's Ward",
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#star', '#divine', '#heart', '#healing'],
      description: 'A protective aura that dulls hostile intent nearby.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'Blades hesitate. Arrows veer. The faithful call it grace; the skeptical call it luck.',
      mechanicalSummary: '+0.06 Star, +0.04 Heart, allies within 1 hex gain +0.02 Heart',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_earthblood_vigor',
    type: 'trait',
    name: 'Earthblood Vigor',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#stone', '#wilderness'],
      description: 'Vitality drawn from the land itself. Wounds close faster, muscles ache less.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'You sleep on bare earth and wake restored. The soil knows your name.',
      mechanicalSummary: '+0.10 Stone, temporary +0.04 Stone buff that fades over 10 ticks after resting',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.10 },
        { type: 'reactive', trigger: 'healed', effect: {
          type: 'decay', reach: 'stone', startValue: 0.04, changePerTick: -0.004, limitValue: 0.0, destroyAtLimit: true,
        }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Blessings (T3 ×1) ──────────────────────────────────────────────
  {
    id: 'reward_condition_the_anointing',
    type: 'trait',
    name: 'The Anointing',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#blessing', '#star', '#divine', '#eye', '#ruins'],
      description: 'Marked by divine purpose. Perception and faith burn bright.',
      maxLevel: 1,
      visibility: 'public',
      flavorText: 'A smear of oil that will not wash away. You see the world as a god sees it — and it is not kind.',
      mechanicalSummary: '+0.10 Star, +0.05 Eye, +0.02 Eye in mystical contexts, rescues near-miss Star outcomes (+1 step)',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_mystical', reach: 'eye', value: 0.02 },
        { type: 'test_shaper', reach: 'star', trigger: 'near_miss', steps: 1, maxMargin: 0.05 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses (T1 ×2) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_ill_luck',
    type: 'trait',
    name: 'Ill Luck',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#shadow', '#gold'],
      description: 'Misfortune clings like smoke. Commerce and stealth suffer.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'Things break in your hands. Deals sour. People stop meeting your eyes.',
      mechanicalSummary: '-0.04 Gold, bad luck compounds: -0.01 Gold per combat failure (max -0.03, slow decay)',
      effects: [
        { type: 'passive', reach: 'gold', value: -0.04 },
        { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'combat_failure', decayPerTick: 0.005 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_nightmares',
    type: 'trait',
    name: 'Nightmares',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#heart', '#veil'],
      description: 'Restless sleep erodes composure and empathy.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'You wake gasping. The dreams fade but the dread does not.',
      mechanicalSummary: '-0.04 Heart, slow drift toward ruthlessness, suppresses social encounters',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.002, limitValue: 0.15 },
        { type: 'behavior_weight', reach: 'heart', multiplier: 0.7 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses (T2 ×2) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_tonguebound',
    type: 'trait',
    name: 'Tonguebound',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#curse', '#heart', '#shadow'],
      description: 'Cannot speak truths about a particular subject. Social reach impaired.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The words form but the throat closes. Some truths have been locked away.',
      mechanicalSummary: '-0.07 Heart, -0.03 Shadow, blocks Heart actions in social contexts, -0.01 Heart per nearby social success (max -0.03)',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.07 },
        { type: 'passive', reach: 'shadow', value: -0.03 },
        { type: 'action_gate', mode: 'block', reach: 'heart', condition: 'in_social' },
        { type: 'stacking', reach: 'heart', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success', decayPerTick: 0.003 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_mark_of_debt',
    type: 'trait',
    name: 'Mark of Debt',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#curse', '#gold', '#veil'],
      description: 'A supernatural debt that drains material fortune.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '-0.08 Gold, -0.03 Veil, drains quintessence (-1 per tick), Gold penalty deepens on social successes (max -0.03 extra)',
      flavorText: 'A scar on the palm in the shape of a coin. Wealth slips through your fingers like water.',
      effects: [
        { type: 'passive', reach: 'gold', value: -0.08 },
        { type: 'passive', reach: 'veil', value: -0.03 },
        { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: -1, mode: 'per_tick' },
        { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_watch_scrutiny',
    type: 'trait',
    name: 'Watch Scrutiny',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#checkpoint', '#curse', '#eye', '#shadow'],
      description: 'The checkpoint remembers your face. Inspections linger, questions multiply, and every small irregularity now feels one witness away from becoming a problem.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.04 Shadow, -0.03 Gold, -0.02 Heart, extra -0.02 Shadow when alone',
      flavorText: 'A name in the wrong ledger, a guard who squints too long, a merchant who suddenly decides not to meet your eye.',
      effects: [
        { type: 'passive', reach: 'shadow', value: -0.04 },
        { type: 'passive', reach: 'gold', value: -0.03 },
        { type: 'passive', reach: 'heart', value: -0.02 },
        { type: 'conditional', condition: 'alone', reach: 'shadow', value: -0.02 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses (T3 ×1) ─────────────────────────────────────────────────
  {
    id: 'reward_condition_the_hollow',
    type: 'trait',
    name: 'The Hollow',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#curse', '#heart', '#shadow', '#veil'],
      description: 'Something essential has been taken. Joy, purpose, or identity — something is missing.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '-0.12 Heart, +0.05 Shadow, personality erodes toward nihilism, avoids social encounters, -0.3 cooperation bias with all',
      flavorText: 'You feel nothing where feeling should be. Others sense the void and flinch.',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.12 },
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: -0.004, limitValue: -0.5 },
        { type: 'behavior_weight', reach: 'heart', multiplier: 0.3 },
        { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Diseases (T1 ×2) ───────────────────────────────────────────────
  {
    id: 'reward_condition_road_fever',
    type: 'trait',
    name: 'Road Fever',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#disease', '#flesh', '#wilderness'],
      description: 'A common illness from exposure and bad water.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.04 Iron, +20% movement cost, gains -0.01 Iron per encounter (max -0.03 extra)',
      flavorText: 'The shivers come and go. Sweat and chill, sweat and chill.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.04 },
        { type: 'range_modifier', movementCostMultiplier: 1.2 },
        { type: 'stacking', reach: 'iron', valuePerStack: -0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 0.002 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_gut_rot',
    type: 'trait',
    name: 'Gut Rot',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#disease', '#flesh', '#wilderness'],
      description: 'Contaminated food or water. Debilitating cramps and weakness.',
      maxLevel: 1,
      visibility: 'public',
      mechanicalSummary: '-0.03 Iron (worsens by -0.001/tick to max -0.07 Iron), -0.02 Gold',
      flavorText: 'The stomach rebels against everything, including emptiness.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: -0.001, limitValue: -0.07, destroyAtLimit: false },
        { type: 'passive', reach: 'gold', value: -0.02 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Diseases (T2 ×1) ───────────────────────────────────────────────
  {
    id: 'reward_condition_greyscale',
    type: 'trait',
    name: 'Greyscale',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#disease', '#flesh', '#stone'],
      description: 'Skin hardens and cracks. Mobility and appearance degrade.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '-0.08 Iron, -0.04 Heart, others avoid cooperation (contagion fear), transforms into Spine Wound on doom threshold (15% chance)',
      flavorText: 'The skin turns grey and stiff at the edges. People step back when they see it.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.08 },
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
        { type: 'transform', trigger: 'doom_threshold', probability: 0.15, intoTemplate: 'reward_condition_spine_wound', narrativeTemplate: 'The greyscale has reached the spine. The numbness is total now.' },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Diseases (T3 ×1) ───────────────────────────────────────────────
  {
    id: 'reward_condition_the_wasting',
    type: 'trait',
    name: 'The Wasting',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#disease', '#flesh', '#veil'],
      description: 'A supernatural consumption that devours vitality and thins the boundary to death.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '-0.08 Iron (worsens by -0.001/tick to max -0.14), +0.05 Veil until rest, personality drifts toward fatalism',
      flavorText: 'The body withers but the eyes brighten. Something feeds on the difference.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: -0.001, limitValue: -0.14, destroyAtLimit: false },
        { type: 'until_event', event: 'rest', reach: 'veil', value: 0.05, destroyOnEvent: false },
        { type: 'axiological_drift', axis: 'hope_despair', ratePerTick: 0.003, limitValue: 0.4 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Supernatural (T1 ×1) ───────────────────────────────────────────
  {
    id: 'reward_condition_fey_touched',
    type: 'trait',
    name: 'Fey-Touched',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#supernatural', '#veil', '#eye'],
      description: 'Brief exposure to the otherworld leaves lingering perception.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '+0.03 Veil, +0.03 Eye until combat begins (paused on event, not removed), +1 awareness range',
      flavorText: 'Colors seem too vivid. Time moves strangely at the edges of the day.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'until_event', event: 'enter_combat', reach: 'eye', value: 0.03, destroyOnEvent: false },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Supernatural (T2 ×1) ───────────────────────────────────────────
  {
    id: 'reward_condition_death_marked',
    type: 'trait',
    name: 'Death-Marked',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#supernatural', '#shadow', '#eye'],
      description: 'Survived something that should have killed. The shadow world notices.',
      maxLevel: 1,
      visibility: 'discoverable',
      mechanicalSummary: '+0.06 Shadow, +0.04 Eye, -0.04 Heart, damage triggers +0.04 Shadow for 6 ticks (12-tick cooldown)',
      flavorText: 'Crows follow you. The dying look at you with recognition.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 6, reach: 'shadow', value: 0.04, destroyOnExpiry: true,
        }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Supernatural (T3 ×1) ───────────────────────────────────────────
  {
    id: 'reward_condition_void_scarred',
    type: 'trait',
    name: 'Void-Scarred',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#supernatural', '#star', '#shadow', '#veil'],
      description: 'Touched by the space between worlds. Reality sits uneasy around you.',
      maxLevel: 1,
      visibility: 'divine_only',
      mechanicalSummary: '+0.08 Star, +0.05 Shadow, -0.08 Heart, +0.04 Star in mystical contexts, reveals hidden encounters within 2 hexes',
      flavorText: 'The air shimmers where you stand. Small animals will not approach. Gods pay attention.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.08 },
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'passive', reach: 'heart', value: -0.08 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.04 },
        { type: 'reveal', target: 'encounters', range: 2 },
      ],
    } as TraitDefinitionProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// REWARD_BESTOWED_POWERS — Trait nodes (10)
// ═══════════════════════════════════════════════════════════════════════

export const REWARD_BESTOWED_POWERS: GraphNode[] = [
  // ─── Bestowed (T1 ×4) ───────────────────────────────────────────────
  {
    id: 'reward_bestowed_ember_hands',
    type: 'trait',
    name: 'Ember Hands',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#stone', '#survival', '#craft', '#wilderness'],
      description: 'Hands radiate gentle warmth. Fire comes easily.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'Tinder catches at your touch. You have not felt cold since the gift was given.',
      mechanicalSummary: '+0.04 Stone, trait: fire_touch (fire manipulation unlocked)',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.04 },
        { type: 'trait_grant', grantedTrait: 'fire_touch' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_beast_tongue',
    type: 'trait',
    name: 'Beast-Tongue',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#heart', '#eye', '#wilderness'],
      description: 'Animals understand your intent, if not your words.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'Horses calm at your voice. Wolves turn aside. You are kin to things that do not speak.',
      mechanicalSummary: '+0.04 Heart, +0.02 Eye in wilderness',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'conditional', condition: 'in_wilderness', reach: 'eye', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_iron_gut',
    type: 'trait',
    name: 'Iron Gut',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#iron', '#survival', '#wilderness'],
      description: 'Immunity to common poisons and spoiled food.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'You eat what would kill others and suffer nothing but a sour taste.',
      mechanicalSummary: '+0.05 Iron, immune to poison/disease conditions',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.05 },
        { type: 'tag_immunity', tags: ['poison', 'disease'] },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_night_eyes',
    type: 'trait',
    name: 'Night Eyes',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#eye', '#shadow', '#wilderness', '#stealth'],
      description: 'See clearly in near-total darkness.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The dark is merely dim. Your pupils are wider than they should be.',
      mechanicalSummary: '+0.05 Eye, +0.02 Shadow in exploration',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_patrons_backing',
    type: 'trait',
    name: "Patron's Backing",
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#gold', '#heart', '#social', '#patronage'],
      description: 'A web of introductions turns close social failures into second chances.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { gold: 0.04, heart: 0.02 },
      effects: [
        {
          type: 'test_shaper',
          reach: 'gold',
          condition: 'in_social',
          trigger: 'near_miss',
          maxMargin: 8,
          steps: 1,
        },
      ],
      flavorText: 'Someone important has spoken well of you somewhere else. In this world, that often matters more than merit.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_gatehouse_commendation',
    type: 'trait',
    name: 'Gatehouse Commendation',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#checkpoint', '#order', '#heart', '#eye', '#iron'],
      description: 'The watch remembers you as someone who kept a hard line without turning the city against itself.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'A quiet nod from a captain, a gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder.',
      mechanicalSummary: '+0.03 Heart, +0.03 Eye, +0.02 Iron, same-faction cooperation bias +0.1',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'passive', reach: 'iron', value: 0.02 },
        { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Bestowed (T2 ×3) ───────────────────────────────────────────────
  {
    id: 'reward_bestowed_spirit_sight',
    type: 'trait',
    name: 'Spirit Sight',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#bestowed', '#eye', '#veil', '#supernatural', '#arcane', '#ruins'],
      description: 'See beyond the veil of the material into the spirit world.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The world peels back its skin. You see what it is hiding underneath.',
      mechanicalSummary: '+0.07 Eye, +0.03 Veil, on hex entry: reveals encounters within 2 hexes (6 ticks)',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.07 },
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'reactive', trigger: 'entered_hex', effect: {
          type: 'reveal', target: 'encounters', range: 2, duration: 6,
        }},
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_bloodward',
    type: 'trait',
    name: 'Bloodward',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#bestowed', '#iron', '#heart', '#combat', '#healing'],
      description: 'Wounds close faster than nature allows. Scars form in hours.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The blood knows what to do. Cut the skin and watch it knit like thread drawn tight.',
      mechanicalSummary: '+0.05 Iron, +0.03 Heart, when damaged: +0.04 Iron for 8 ticks (12-tick cooldown)',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.05 },
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 8, reach: 'iron', value: 0.04, destroyOnExpiry: false,
        }, cooldown: 12 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_voices_of_the_departed',
    type: 'trait',
    name: 'Voices of the Departed',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#bestowed', '#shadow', '#heart', '#ruins'],
      description: 'Hear the whispers of the recently dead. They offer counsel, sometimes unbidden.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The dead speak softly, but they never stop. You learn to listen selectively.',
      mechanicalSummary: '+0.06 Shadow, +0.04 Heart, awareness range +1 hex (dead whisper warnings)',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.06 },
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Bestowed (T3 ×2) ───────────────────────────────────────────────
  {
    id: 'reward_bestowed_stormcaller',
    type: 'trait',
    name: 'Stormcaller',
    properties: {
      subcategory: 'bestowed',
      tier: 3,
      tags: ['#bestowed', '#star', '#stone', '#divine', '#wilderness'],
      description: 'Command the weather within a small radius. The sky answers, reluctantly.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'Thunder follows your anger. Rain follows your grief. The sky has learned your moods.',
      mechanicalSummary: '+0.10 Star, +0.05 Stone, enemy aura -0.03 Iron (1 hex), 1.3× Iron encounter desire',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'stone', value: 0.05 },
        { type: 'aura', radius: 1, target: 'enemies', reach: 'iron', value: -0.03 },
        { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_veilwalk',
    type: 'trait',
    name: 'Veilwalk',
    properties: {
      subcategory: 'bestowed',
      tier: 3,
      tags: ['#bestowed', '#veil', '#shadow', '#supernatural', '#arcane', '#stealth'],
      description: 'Step briefly between worlds. Physical barriers become suggestions.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'The wall is there, and then it is not. You pass through the space where it chose not to be.',
      mechanicalSummary: '+0.10 Veil, +0.05 Shadow, movement cost ×0.8 (phase-walking), unlocks Veil-domain actions',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.10 },
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'range_modifier', movementCostMultiplier: 0.8 },
        { type: 'action_gate', mode: 'unlock', reach: 'veil' },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Bestowed (T4 ×1) ───────────────────────────────────────────────
  {
    id: 'reward_bestowed_the_undying_flame',
    type: 'trait',
    name: 'The Undying Flame',
    properties: {
      subcategory: 'bestowed',
      tier: 4,
      tags: ['#bestowed', '#star', '#iron', '#divine', '#ancient'],
      description: 'A spark of divine fire burns within. Death is delayed, not prevented.',
      maxLevel: 1,
      visibility: 'discoverable',
      flavorText: 'You burned once and did not die. The fire lives inside now, patient and eternal. It will outlast you.',
      mechanicalSummary: '+0.12 Star, +0.03 Iron, blocks one quintessence loss, on damage: +0.05 Star for 6 ticks then +1 step on failures (24-tick cooldown)',
      effects: [
        { type: 'passive', reach: 'star', value: 0.12 },
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'prevent_loss', channel: 'quintessence', amount: 1, consumeOnPrevent: false },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'cascade', triggerEffect: {
            type: 'duration', ticks: 6, reach: 'star', value: 0.05, destroyOnExpiry: false,
          }, then: [
            { type: 'test_shaper', trigger: 'failure', steps: 1 },
          ],
        }, cooldown: 24 },
      ],
    } as TraitDefinitionProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// RUIN_SEEKER_TRAIT — Trait definition for ruins exploration gating
// ═══════════════════════════════════════════════════════════════════════

export const RUIN_SEEKER_TRAIT: GraphNode = {
  id: 'trait_ruin_seeker',
  type: 'trait',
  name: 'Ruin Seeker',
  properties: {
    subcategory: 'bestowed',
    description: 'An instinct for ancient places — the pull of buried stone and forgotten purpose.',
    importance: 0.6,
    maxLevel: 3,
    visibility: 'discoverable',
    domainContributions: { eye: 0.03, shadow: 0.02 },
    tags: ['ruin_seeker', 'explorer', '#eye', '#shadow'],
    flavorText: 'They pause at crossroads, head tilted, as if listening for something beneath the earth.',
  } as TraitDefinitionProperties,
};

// ═══════════════════════════════════════════════════════════════════════
// TREASURE_MAPS — Consumable possessions that grant ruin_seeker while held
// ═══════════════════════════════════════════════════════════════════════

export const TREASURE_MAPS: GraphNode[] = [
  {
    id: 'reward_tomes_scrolls_faded_treasure_map',
    type: 'artifact',
    name: 'Faded Treasure Map',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient'],
      mechanicalSummary: '+0.03 Eye reach, grants ruin_seeker (consumed on discovery)',
      reachBonus: { eye: 0.03 },
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 1,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'The parchment is brittle and the ink barely legible, but the landmarks are unmistakable.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_smugglers_chart',
    type: 'artifact',
    name: "Smuggler's Chart",
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#shadow', '#map', '#ruin_seeker', '#ancient'],
      mechanicalSummary: '+0.03 Shadow, grants ruin_seeker, +0.02 Shadow in exploration',
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 1,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Stained with sea-salt and cheap wine. The cross marks a cache beneath old foundations.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.03 },
        { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_cartographers_survey',
    type: 'artifact',
    name: "Cartographer's Survey",
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#professional'],
      mechanicalSummary: '+0.05 Eye reach, grants ruin_seeker L2 (consumed on discovery)',
      reachBonus: { eye: 0.05 },
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 2,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Meticulous measurements and triangulations. Someone spent months on this.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_tomb_raiders_journal',
    type: 'artifact',
    name: "Tomb Raider's Journal",
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#shadow', '#map', '#ruin_seeker', '#ancient'],
      mechanicalSummary: '+0.04 Eye, +0.03 Shadow, grants ruin_seeker L2 (consumed on discovery)',
      reachBonus: { eye: 0.04, shadow: 0.03 },
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 2,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Detailed notes on trap mechanisms, burial customs, and which walls sound hollow when tapped.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_ancient_waystone_rubbing',
    type: 'artifact',
    name: 'Ancient Waystone Rubbing',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 3,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#elder'],
      mechanicalSummary: '+0.06 Eye reach, grants ruin_seeker L3 (consumed on discovery)',
      reachBonus: { eye: 0.06 },
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 3,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Charcoal on vellum, taken from a stone older than the kingdom. The symbols shift when you look away.',
    } as PossessionNodeProperties,
  },
];
