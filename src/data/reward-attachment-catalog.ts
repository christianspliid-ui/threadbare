/**
 * Reward Attachment Catalog — Template pool for encounter rewards.
 *
 * Exports three arrays of GraphNode objects used by the reward pool system
 * to assemble loot tables for encounter outcomes. Spread across tiers and
 * subcategories to give the assembler a rich sampling space.
 *
 * Design doc: Docs/plans/2026-03-26-encounter-reward-wiring-design.md
 */
/**
 * THR-800 — phantom grant keys (5 in this file).
 *
 * The `trait_grant` effects below name bare snake_case keys with no trait definition
 * behind them. This is deliberate and it *works*: `collectGrantedTraits` returns the
 * bare key, every consumer unions it into the bearer's ref set, and a gate naming the
 * same key passes (the THR-737 loop). What a phantom lacks is a definition — so it has
 * no display name, no visibility, and no `domainContributions`, and it cannot appear on
 * the bearer's sheet. That collides with the trait canon's "always visible once known"
 * rule, which is why `validateTraitRefs` reports them separately from dead refs rather
 * than treating them as satisfied.
 *
 * Kept as-is here: each backs a live gate today, and giving them definitions is only
 * half the job — see THR-808 for why minting without a producer is worse than the
 * current state. The count is pinned by `traitRefReconciliation.test.ts`, so a new
 * bare-key grant is a deliberate act rather than a drift.
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
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.03 Iron roll · Iron capability +0.25 while borne, +0.02 Iron in combat',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Pitted and green with age, but the point still bites.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 },
        // THR-745: a common pitted spear is a real weapon but barely lifts martial competence.
        // Minor band, low end.
        { type: 'stat_contribution', contributions: { iron: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_hunting_bow',
    type: 'artifact',
    name: 'Hunting Bow',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#ranged', '#combat'],
      mechanicalSummary: '+0.04 Iron roll · Iron capability +0.3 while borne, +0.01 Iron per combat success (max +0.03, decays 1/tick)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Sinew-strung and warped from damp, but deadly enough at close range.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
        // THR-745: a serviceable bow teaches its user to shoot. Minor band; the stacking
        // combat bonus already rewards use.
        { type: 'stat_contribution', contributions: { iron: 0.3 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_rusted_mace',
    type: 'artifact',
    name: 'Rusted Mace',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.04 Iron roll · Iron capability +0.25 / Heart −0.1 while borne, +0.02 Iron / -0.01 Heart (blunt instrument)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The rust is mostly cosmetic. Mostly.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'tradeoff', bonus: { reach: 'iron', value: 0.02 }, penalty: { reach: 'heart', value: 0.01 } },
        // THR-745: a blunt instrument makes its bearer effective and coarse. Minor band,
        // mirroring the authored Iron/Heart tradeoff at tier scale.
        { type: 'stat_contribution', contributions: { iron: 0.25, heart: -0.1 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_bone_knife',
    type: 'artifact',
    name: 'Bone Knife',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee', '#survival', '#combat', '#wilderness'],
      mechanicalSummary: '+0.03 Iron roll · Iron capability +0.2 while borne, 3 charges of +0.04 Iron burst (desperate strikes)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Carved from the rib of something large. It will not last.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'iron', value: 0.04 }, destroyOnEmpty: true },
        // THR-745: a wasting improvised blade, the lowest Iron lift in the catalog. Minor
        // band, floor: it destroys itself on empty.
        { type: 'stat_contribution', contributions: { iron: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Arms (T2 ×3) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_blackiron_blade',
    type: 'artifact',
    name: 'Blackiron Blade',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.08 Iron roll · Iron capability +0.5 while borne, +0.01 Iron per combat success (max +0.04, decays 1 stack/tick)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Forged in a dead forge-town. The metal remembers heat it should not.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success', decayPerTick: 1 },
        // THR-745: a properly forged blade is a genuine step up in martial capability. Notable
        // band, low-mid, since it already stacks on combat success.
        { type: 'stat_contribution', contributions: { iron: 0.5 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_crossbow_of_the_watch',
    type: 'artifact',
    name: 'Crossbow of the Watch',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#ranged', '#eye', '#combat'],
      mechanicalSummary: "+0.07 Iron roll · Iron capability +0.45 / Eye +0.2 while borne, +0.03 Eye, +1 awareness range (watchman's vigil)",
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Issued to border watchers. The sighting marks are worn smooth by anxious thumbs.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.07 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        // THR-745: a watchman's weapon: martial reach first, the sighting discipline second.
        // Notable band, low.
        { type: 'stat_contribution', contributions: { iron: 0.45, eye: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_gate_seal_case',
    type: 'artifact',
    name: 'Gate Seal Case',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#checkpoint', '#order', '#eye', '#gold'],
      mechanicalSummary: '+0.03 Eye roll · Eye capability +0.2 / Gold +0.2 while borne, +0.02 Gold, +0.02 Gold in social (official authority)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Wax seals, chalk, and a customs stamp wrapped in oilcloth. Boring to everyone except the people who know how power hides in paperwork.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'passive', reach: 'gold', value: 0.02 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
        // THR-745: paperwork as power: a little procedural sight, a little leverage. Minor
        // band, split evenly.
        { type: 'stat_contribution', contributions: { eye: 0.2, gold: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_thornwood_staff',
    type: 'artifact',
    name: 'Thornwood Staff',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#stone', '#combat'],
      mechanicalSummary: '+0.06 Iron roll · Iron capability +0.4 / Stone +0.2 while borne, +0.03 Stone, thorns emerge when attacked (+0.03 Iron for 6 ticks, 12-tick cooldown)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The wood is alive. It sprouts small leaves in spring, thorns in winter.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.06 },
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
        // THR-745: a living stave fights and endures. Notable band, low: the reactive thorns
        // already carry its bite.
        { type: 'stat_contribution', contributions: { iron: 0.4, stone: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Arms (T3 ×2) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_hollowfang',
    type: 'artifact',
    name: 'Hollowfang',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#weapon', '#melee', '#cursed', '#combat'],
      mechanicalSummary: '+0.12 Iron roll · Iron capability +0.8 / Heart −0.4 while borne, -0.05 Heart, when damaged: +0.05 Iron burst decaying over 5 ticks (12-tick cooldown), grants dark_ferocity trait',
      censusTag: { scale: 'local' },
      lossCondition: 'cursed',
      flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.12 },
        { type: 'passive', reach: 'heart', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'decay', reach: 'iron', startValue: 0.05, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
        }, cooldown: 12 },
        { type: 'trait_grant', grantedTrait: 'dark_ferocity' },
        // THR-745: a cursed blade that makes its bearer formidable and cruel. Notable band,
        // high; the Heart cost is the curse at tier scale.
        { type: 'stat_contribution', contributions: { iron: 0.8, heart: -0.4 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_starfall_longbow',
    type: 'artifact',
    name: 'Starfall Longbow',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#weapon', '#ranged', '#star', '#combat'],
      mechanicalSummary: '+0.10 Iron roll · Iron capability +0.7 / Star +0.35 while borne, +0.05 Star, stellar alignment: +0.03 Star for 6 ticks then dormant 12 ticks',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'The string hums a note too low to hear. Arrows fly straighter than physics allows.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.10 },
        { type: 'passive', reach: 'star', value: 0.05 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'star', value: 0.03 },
        // THR-745: a star-touched bow: martial mastery with a thread of the heavens. Notable
        // band, high.
        { type: 'stat_contribution', contributions: { iron: 0.7, star: 0.35 } },
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
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 4,
      tags: ['#iron', '#weapon', '#melee', '#shadow', '#ancient', '#combat'],
      mechanicalSummary: '+0.18 Iron roll · Iron capability +1.2 / Shadow +0.6 while borne, +0.08 Shadow, blocks fear/intimidation conditions, when attacked: 20% faster movement for 6 ticks (12-tick cooldown), shadow focus persists until combat ends (+0.02 Shadow)',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'It makes no sound when it cuts. Neither does the one it cuts.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.18 },
        { type: 'passive', reach: 'shadow', value: 0.08 },
        { type: 'until_event', event: 'leave_combat', reach: 'shadow', value: 0.02, destroyOnEvent: false },
        { type: 'reactive', trigger: 'attacked', effect: {
          type: 'range_modifier', movementCostMultiplier: 0.8
        }, duration: 6, cooldown: 12 },
        { type: 'tag_immunity', tags: ['#fear', '#intimidation'] },
        // THR-745: an ancient assassin's blade, legendary martial capability, shadowed.
        // Legendary band but held below the ceiling: its passive roll total already overruns
        // EFFECT_PER_ITEM_CAP (see the note above this entry).
        { type: 'stat_contribution', contributions: { iron: 1.2, shadow: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Diverse Arms (pipeline: 2026-04-07) ---
  {
    id: 'reward_arms_grave_robbers_stiletto',
    type: 'artifact',
    name: "Grave-Robber's Stiletto",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#shadow', '#weapon', '#melee', '#stealth', '#assassination'],
      mechanicalSummary: '+0.03 Shadow roll · Shadow capability +0.25 while borne, +0.02 Shadow when alone (ambush bonus)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Thin as a finger bone and just as cold. The grip is wrapped in linen from a burial shroud.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.03 },
        { type: 'conditional', condition: 'alone', reach: 'shadow', value: 0.02 },
        // THR-745: a thin blade for quiet work. Minor band: it teaches stealth, not
        // swordsmanship.
        { type: 'stat_contribution', contributions: { shadow: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_cracked_brass_horn',
    type: 'artifact',
    name: 'Cracked Brass Horn',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#heart', '#weapon', '#instrument', '#command', '#social'],
      mechanicalSummary: '+0.03 Heart roll · Heart capability +0.25 while borne, +0.02 Heart in social encounters, +0.3 cooperation with allies (rallying call)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Dented brass with a cracked bell. It still carries across a valley when the wind is right.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 },
        { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.3 },
        // THR-745: a rallying horn makes its bearer someone others follow. Minor band.
        { type: 'stat_contribution', contributions: { heart: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_spotters_marking_bolt',
    type: 'artifact',
    name: "Spotter's Marking Bolt",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#eye', '#weapon', '#ranged', '#precision', '#reconnaissance'],
      mechanicalSummary: '+0.03 Eye roll · Eye capability +0.25 while borne, +1 awareness range (surveyor sight), 4 charges of +0.03 Eye burst (mark target)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Crossbow quarrels with red-dyed fletching. The spotter who carried them marked enemy positions, not map edges.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        { type: 'consumable_charge', charges: 4, onUse: { reach: 'eye', value: 0.03 }, destroyOnEmpty: true },
        // THR-745: a spotter's tool sharpens the eye more than the arm. Minor band.
        { type: 'stat_contribution', contributions: { eye: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_basalt_maul',
    type: 'artifact',
    name: 'Basalt Maul',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 1,
      tags: ['#stone', '#weapon', '#melee', '#heavy', '#combat'],
      mechanicalSummary: '+0.04 Stone roll · Stone capability +0.3 / Eye −0.1 while borne, +0.02 Stone / -0.01 Eye (heavy and unwieldy), blocks bruise conditions',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A column of black stone lashed to a shaft of green oak. Whoever swings it does not swing it twice in quick succession.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.04 },
        { type: 'tradeoff', bonus: { reach: 'stone', value: 0.02 }, penalty: { reach: 'eye', value: 0.01 } },
        { type: 'tag_immunity', tags: ['#bruise'] },
        // THR-745: heavy stonework in weapon form: enduring, unsubtle. Minor band, mirroring
        // the authored Stone/Eye tradeoff.
        { type: 'stat_contribution', contributions: { stone: 0.3, eye: -0.1 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_stranglers_cord',
    type: 'artifact',
    name: "Strangler's Cord",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#shadow', '#weapon', '#melee', '#stealth', '#assassination'],
      mechanicalSummary: '+0.05 Shadow roll · Shadow capability +0.45 / Heart −0.2 while borne, +0.03 Shadow / -0.02 Heart (silent killer), +0.01 Shadow per combat success (max 3 stacks, decays 1/tick)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Braided from horsehair and treated with tallow. It leaves no mark on the throat if you know the twist.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'tradeoff', bonus: { reach: 'shadow', value: 0.03 }, penalty: { reach: 'heart', value: 0.02 } },
        { type: 'stacking', reach: 'shadow', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
        // THR-745: a silent killer's tool builds real stealth capability at a cost in warmth.
        // Notable band, low.
        { type: 'stat_contribution', contributions: { shadow: 0.45, heart: -0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_hazel_switch',
    type: 'artifact',
    name: 'Hazel Switch',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#veil', '#weapon', '#implement', '#mystical'],
      mechanicalSummary: '+0.04 Veil roll · Veil capability +0.4 while borne, +0.03 Veil in mystical encounters, when attacked: +0.03 Veil for 4 ticks (10-tick cooldown)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Hazel wood stripped white by moonlight. Someone carved a name into the base and then scraped it out.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 },
        { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 4, reach: 'veil', value: 0.03, destroyOnExpiry: true }, cooldown: 10 },
        // THR-745: a cut hazel rod is the beginner's implement of the Veil. Notable band, low
        // end.
        { type: 'stat_contribution', contributions: { veil: 0.4 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_banner_of_the_lost_company',
    type: 'artifact',
    name: 'Banner of the Lost Company',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#heart', '#iron', '#weapon', '#command', '#combat'],
      mechanicalSummary: '+0.05 Heart roll · Heart capability +0.45 / Iron +0.2 while borne, +0.03 Iron in combat, +0.5 cooperation with same-faction allies, drives wielder toward combat encounters (1.3x behavior weight)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'The pole is splintered and re-bound with wire. The cloth shows a sigil no living heraldist recognizes.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.05 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.03 },
        { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.5 },
        { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
        // THR-745: a company banner is a leadership object first, a weapon second. Notable
        // band, low.
        { type: 'stat_contribution', contributions: { heart: 0.45, iron: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_lens_sighted_arbalest',
    type: 'artifact',
    name: 'Lens-Sighted Arbalest',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#eye', '#iron', '#weapon', '#ranged', '#precision', '#combat'],
      mechanicalSummary: '+0.05 Eye roll · Eye capability +0.45 / Iron +0.2 while borne, +0.02 Iron, on near-miss Eye tests (within 2 margin): +1 step, +1 awareness range',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The lens is ground from quartz and sits in a brass cradle. The crossbow itself is unremarkable. The lens is everything.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'passive', reach: 'iron', value: 0.02 },
        { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 2 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        // THR-745: the lens is the point: marksmanship as perception. Notable band, low; its
        // near-miss shaper is narrow (margin 2).
        { type: 'stat_contribution', contributions: { eye: 0.45, iron: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_petrified_ironwood_glaive',
    type: 'artifact',
    name: 'Petrified Ironwood Glaive',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#stone', '#iron', '#weapon', '#melee', '#heavy', '#combat', '#ancient'],
      mechanicalSummary: '+0.05 Stone roll · Stone capability +0.45 / Iron +0.25 while borne, +0.03 Iron, when attacked: +0.03 Stone for 6 ticks (12-tick cooldown), 20% slower movement (weight penalty)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The wood turned to stone a thousand years ago. The blade edge is a geological accident. It cuts like a bad intention.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.05 },
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'stone', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
        { type: 'range_modifier', movementCostMultiplier: 1.2 },
        // THR-745: petrified wood: endurance embodied, with martial reach. Notable band, low.
        { type: 'stat_contribution', contributions: { stone: 0.45, iron: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_arms_assessors_weighted_scales',
    type: 'artifact',
    name: "Assessor's Weighted Scales",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#gold', '#weapon', '#melee', '#commercial', '#social'],
      mechanicalSummary: '+0.05 Gold roll · Gold capability +0.45 / Iron −0.15 while borne, +0.03 Gold in social encounters, -0.02 Iron (not a fighting weapon), -0.2 cooperation with enemies (economic intimidation)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Brass pans on a chain, with lead weights sewn into the handle. The Assessors Guild calls it a tool. The people they assess call it a weapon.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.05 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.03 },
        { type: 'passive', reach: 'iron', value: -0.02 },
        { type: 'social_modifier', targetFilter: 'enemy', cooperationBias: -0.2 },
        // THR-745: a coercive instrument of trade, explicitly not a fighting weapon. Notable
        // band, low; the Iron penalty mirrors its authored disclaimer.
        { type: 'stat_contribution', contributions: { gold: 0.45, iron: -0.15 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T1 ×3) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_padded_jerkin',
    type: 'artifact',
    name: 'Padded Jerkin',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 1,
      tags: ['#iron', '#armor', '#cloth', '#combat'],
      mechanicalSummary: '+0.03 Iron roll · Iron capability +0.2 while borne, blocks bruise conditions',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Quilted linen stuffed with horsehair. Better than bare skin.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'tag_immunity', tags: ['#bruise'] },
        // THR-745: the cheapest real armour. Minor band, floor: it lets its wearer take a hit,
        // nothing more.
        { type: 'stat_contribution', contributions: { iron: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_merchant_silks',
    type: 'artifact',
    name: 'Merchant Silks',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 1,
      tags: ['#gold', '#cloth', '#commercial', '#trade'],
      mechanicalSummary: '+0.04 Gold roll · Gold capability +0.3 while borne, +0.02 Gold in social encounters',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Dyed in the saffron of the eastern markets. Wealth worn on the sleeve.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
        // THR-745: dressing like money makes money answer. Minor band, top.
        { type: 'stat_contribution', contributions: { gold: 0.3 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_pilgrim_robe',
    type: 'artifact',
    name: "Pilgrim's Robe",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 1,
      tags: ['#star', '#cloth', '#divine'],
      mechanicalSummary: '+0.03 Star roll · Star capability +0.25 while borne, +0.02 Star in mystical encounters (pilgrim devotion)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Threadbare and sun-bleached. It smells of incense and long roads.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.03 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.02 },
        // THR-745: the robe marks its wearer as devout, and devotion is practised. Minor band.
        { type: 'stat_contribution', contributions: { star: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T2 ×2) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_chainmail_hauberk',
    type: 'artifact',
    name: 'Chainmail Hauberk',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 2,
      tags: ['#iron', '#armor', '#combat'],
      mechanicalSummary: '+0.08 Iron roll · Iron capability +0.45 while borne, when attacked: +0.03 Iron for 4 ticks (8-tick cooldown)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Each ring was closed by hand. Someone cared enough to do it right.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'reactive', trigger: 'attacked', effect: {
          type: 'duration', ticks: 4, reach: 'iron', value: 0.03, destroyOnExpiry: true
        }, cooldown: 8 },
        // THR-745: real mail changes how a body fights. Notable band, low.
        { type: 'stat_contribution', contributions: { iron: 0.45 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_vestments_shadowweave_cloak',
    type: 'artifact',
    name: 'Shadowweave Cloak',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 2,
      tags: ['#shadow', '#cloth', '#stealth'],
      // CAVEAT: 3 effects at T2 norm 1–2. All are utility (zero reach).
      // Accepted as-is — see systems audit.
      mechanicalSummary: '+0.07 Shadow roll · Shadow capability +0.5 while borne, +1 awareness range, blocks tracking conditions',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'The fabric drinks light. Corners seem deeper when you wear it.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.07 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        { type: 'tag_immunity', tags: ['#tracked', '#marked'] },
        // THR-745: a cloak woven to defeat tracking is stealth capability in cloth. Notable
        // band, mid.
        { type: 'stat_contribution', contributions: { shadow: 0.5 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T3 ×1) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_mantle_of_the_unremembered',
    type: 'artifact',
    name: 'Mantle of the Unremembered',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 3,
      tags: ['#shadow', '#cloth', '#veil', '#cursed', '#stealth'],
      mechanicalSummary: '+0.12 Shadow roll · Shadow capability +0.8 / Heart −0.35 while borne, -0.06 Heart, entering new hex: +0.04 Shadow burst decaying over 4 ticks (8-tick cooldown), amplifies shadow encounter desire x1.5',
      censusTag: { scale: 'local' },
      lossCondition: 'cursed',
      flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.12 },
        { type: 'passive', reach: 'heart', value: -0.06 },
        { type: 'reactive', trigger: 'entered_hex', effect: {
          type: 'decay', reach: 'shadow', startValue: 0.04, changePerTick: -0.01, limitValue: 0.0, destroyAtLimit: true
        }, cooldown: 8 },
        { type: 'behavior_weight', reach: 'shadow', multiplier: 1.5 },
        // THR-745: being forgotten is mastery of Shadow bought with connection. Notable band,
        // high; the Heart cost is its authored price.
        { type: 'stat_contribution', contributions: { shadow: 0.8, heart: -0.35 } },
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
      attachmentCategory: 'possession',
      subcategory: 'vestments',
      tier: 4,
      tags: ['#star', '#cloth', '#divine', '#ancient'],
      mechanicalSummary: '+0.15 Star roll · Star capability +1.2 / Veil +0.6 while borne, +0.08 Veil, in mystical contexts: +0.03 Star, blocks curse/corruption/blight conditions, when damaged: +0.04 Veil ward for 6 ticks (12-tick cooldown)',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'A robe of impossible blue, stitched with constellations that move. It weighs nothing.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.15 },
        { type: 'passive', reach: 'veil', value: 0.08 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 6, reach: 'veil', value: 0.04, destroyOnExpiry: true
        }, cooldown: 12 },
        { type: 'tag_immunity', tags: ['#curse', '#corruption', '#blight'] },
        // THR-745: a garment of sky: legendary celestial capability with a Veil undertow.
        // Legendary band.
        { type: 'stat_contribution', contributions: { star: 1.2, veil: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T1 ×3) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_field_journal',
    type: 'artifact',
    name: 'Field Journal',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#eye', '#tome', '#knowledge'],
      mechanicalSummary: '+0.03 Eye roll · Eye capability +0.25 while borne, +0.02 Eye in exploration',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A naturalist\'s notes. The handwriting degrades toward the end.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
        // THR-745: kept observations sharpen observation. Minor band.
        { type: 'stat_contribution', contributions: { eye: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_prayer_scroll',
    type: 'artifact',
    name: 'Prayer Scroll',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#star', '#scroll', '#divine'],
      mechanicalSummary: '+0.04 Star roll · Star capability +0.2 while borne, 2 charges of +0.04 Star burst (divine invocation)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'The words are old and the ink fading. One reading left, perhaps.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'consumable_charge', charges: 2, onUse: { reach: 'star', value: 0.04 }, destroyOnEmpty: true },
        // THR-745: a scroll of set prayers: real devotion, but it burns its charges and goes.
        // Minor band, floor.
        { type: 'stat_contribution', contributions: { star: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_merchants_ledger',
    type: 'artifact',
    name: "Merchant's Ledger",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#gold', '#tome', '#commercial'],
      mechanicalSummary: '+0.04 Gold roll · Gold capability +0.3 while borne, +0.02 Gold in social (trade leverage)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Columns of numbers, trade routes inked in margins. Knowledge is currency.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
        // THR-745: a kept ledger is the whole discipline of trade. Minor band, top.
        { type: 'stat_contribution', contributions: { gold: 0.3 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_letters_of_introduction',
    type: 'artifact',
    name: 'Letters of Introduction',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#gold', '#scroll', '#service', '#social', '#patronage'],
      mechanicalSummary: 'Service reward: immediately grants Patron\'s Backing.',
      censusTag: { reach: 'gold', scale: 'local' },
      rewardMode: 'service',
      effects: [
        {
          type: 'content_grant',
          templateIds: ['reward_bestowed_patrons_backing'],
          selection: 'first',
        },
        // THR-1169: exclusion from the stat_contribution migration CONFIRMED. Shown once and
        // spent (`rewardMode: 'service'`, `lossCondition: 'consumable'`); nothing is borne, so
        // there is no interval over which it could shape capability. The Backing it grants
        // carries whatever influence this is worth.
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
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#tome', '#knowledge'],
      mechanicalSummary: '+0.08 Eye roll · Eye capability +0.45 while borne, rescue near-miss Eye tests (+1 step, margin 5)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A history of empires that collapsed. The final chapter is blank.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 5 },
        // THR-745: a historian's record teaches its reader to read the world. Notable band,
        // low: its near-miss shaper is unusually wide (margin 5).
        { type: 'stat_contribution', contributions: { eye: 0.45 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_veilscript_fragment',
    type: 'artifact',
    name: 'Veilscript Fragment',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#veil', '#scroll', '#knowledge', '#arcane'],
      mechanicalSummary: '+0.06 Veil roll · Veil capability +0.45 / Eye +0.2 while borne, +0.03 Eye, +0.01 Veil per encounter (max +0.03, decays 1/tick)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The letters rearrange themselves when you look away.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'stacking', reach: 'veil', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 1 },
        // THR-745: a fragment of true script: partial Veil instruction, with the literacy to
        // parse it. Notable band, low.
        { type: 'stat_contribution', contributions: { veil: 0.45, eye: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T3 ×1) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_the_silent_testament',
    type: 'artifact',
    name: 'The Silent Testament',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 3,
      tags: ['#star', '#tome', '#knowledge', '#ancient', '#ruins'],
      mechanicalSummary: '+0.10 Star roll · Star capability +0.75 / Eye +0.35 while borne, +0.05 Eye, prevents 1 condition loss, +0.03 Star at low health',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'Written by a god who chose to die. Every page is a eulogy for a truth.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'prevent_loss', channel: 'condition', consumeOnPrevent: false },
        { type: 'conditional', condition: 'health_low', reach: 'star', value: 0.03 },
        // THR-745: a complete devotional testament: sustained Star capability with scholarly
        // Eye. Notable band, high.
        { type: 'stat_contribution', contributions: { star: 0.75, eye: 0.35 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls (T4 ×1) ────────────────────────────────────────
  {
    id: 'reward_tomes_scrolls_codex_of_unmaking',
    type: 'artifact',
    name: 'Codex of Unmaking',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 4,
      tags: ['#veil', '#tome', '#knowledge', '#ancient', '#cursed', '#arcane', '#ruins'],
      mechanicalSummary: '+0.15 Veil roll · Veil capability +1.3 / Heart −0.6 while borne, -0.08 Heart, blocks Heart actions (too detached to empathize), reveals all encounters, drifts toward ruthlessness',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'cursed',
      flavorText: 'The pages are blank until you bleed on them. Then they show you how everything ends.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.15 },
        { type: 'passive', reach: 'heart', value: -0.08 },
        { type: 'action_gate', mode: 'block', reach: 'heart' },
        { type: 'reveal', target: 'encounters', range: 'all' },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.008, limitValue: 0.50 },
        // THR-745: the Codex teaches unmaking and unteaches empathy. Legendary band; the Heart
        // cost is steep because the item already gates Heart actions outright.
        { type: 'stat_contribution', contributions: { veil: 1.3, heart: -0.6 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T1 ×3) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_iron_tongs',
    type: 'artifact',
    name: 'Iron Tongs',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#stone', '#tool', '#craft'],
      mechanicalSummary: '+0.03 Stone roll · Stone capability +0.25 while borne, +0.02 Stone at home territory (workshop access)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Blacksmith\'s tongs, well-used. The handles are polished smooth by grip.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.02 },
        // THR-745: the basic smith's grip. Minor band.
        { type: 'stat_contribution', contributions: { stone: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_herbalists_pouch',
    type: 'artifact',
    name: "Herbalist's Pouch",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#heart', '#tool', '#survival', '#craft', '#wilderness', '#healing'],
      mechanicalSummary: '+0.04 Heart roll · Heart capability +0.25 while borne, 3 charges of +0.03 Heart burst (field dressing)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Dried leaves, crushed roots, and a mortar small enough to carry. The smell is medicinal.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'heart', value: 0.03 }, destroyOnEmpty: true },
        // THR-745: field medicine is care made competent. Minor band.
        { type: 'stat_contribution', contributions: { heart: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_surveyors_glass',
    type: 'artifact',
    name: "Surveyor's Glass",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#eye', '#tool', '#craft'],
      mechanicalSummary: '+0.04 Eye roll · Eye capability +0.3 while borne, +1 awareness range',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A single cracked lens in a brass tube. It magnifies, but distorts at the edges.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        // THR-745: a glass that extends sight is the purest Eye tool at tier 1. Minor band,
        // top.
        { type: 'stat_contribution', contributions: { eye: 0.3 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T2 ×2) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_alchemists_crucible',
    type: 'artifact',
    name: "Alchemist's Crucible",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#veil', '#tool', '#knowledge', '#craft', '#arcane'],
      mechanicalSummary: '+0.07 Veil roll · Veil capability +0.45 / Eye +0.2 while borne, +0.03 Eye, +0.03 Veil for 6 ticks then dormant 12 ticks (distillation cycle)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Stained with substances that should not exist in nature. The inside glows faintly at dusk.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.07 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'veil', value: 0.03 },
        // THR-745: distillation is applied Veil with an observer's discipline. Notable band,
        // low.
        { type: 'stat_contribution', contributions: { veil: 0.45, eye: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_master_chisel',
    type: 'artifact',
    name: 'Master Chisel',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#stone', '#tool', '#craft', '#ruins'],
      mechanicalSummary: '+0.08 Stone roll · Stone capability +0.5 while borne, +0.01 Stone per encounter success (max +0.04)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'Engraved with the mark of a guild that no longer exists. The edge never dulls.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.08 },
        { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 4, stackOn: 'combat_success' },
        // THR-745: a master's chisel is the craft itself. Notable band, mid.
        { type: 'stat_contribution', contributions: { stone: 0.5 } },
      ],
    } as PossessionNodeProperties,
  },
  // --- Time-Manipulation Primitives (pipeline: 2026-04-07) ---
  {
    id: 'reward_tools_instruments_chronoscope',
    type: 'artifact',
    name: 'Chronoscope',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#eye', '#veil', '#temporal', '#tool'],
      mechanicalSummary: '+0.04 Eye roll · Eye capability +0.35 / Veil +0.25 while borne, +0.03 Veil, freezes divine/blessing buff countdowns for 6 ticks, +1 awareness range',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A lens ground from something that is not glass. When you look through it, moments stack upon each other like pages.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 6 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        // THR-745: an instrument that reads time: measured sight, lesser Veil. Held at the
        // minor/notable boundary because its power is utility, not competence.
        { type: 'stat_contribution', contributions: { eye: 0.35, veil: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tools & Instruments (T3 ×1) ────────────────────────────────────
  {
    id: 'reward_tools_instruments_the_astrolabe_of_yven',
    type: 'artifact',
    name: 'Astrolabe of Yven',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 3,
      tags: ['#star', '#tool', '#ancient', '#knowledge', '#craft'],
      mechanicalSummary: '+0.10 Star roll · Star capability +0.75 / Eye +0.35 while borne, +0.05 Eye, reveals agents within 3 hexes, +0.03 Star in mystical',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'The rings spin of their own accord. It does not measure the stars — it speaks with them.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'reveal', target: 'agent', range: 3 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
        // THR-745: a named astrolabe: celestial mastery through instrument. Notable band,
        // high.
        { type: 'stat_contribution', contributions: { star: 0.75, eye: 0.35 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T1 ×2) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_wayfarers_charm',
    type: 'artifact',
    name: "Wayfarer's Charm",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#heart', '#talisman', '#travel'],
      mechanicalSummary: '+0.03 Heart roll · Heart capability +0.25 while borne, +0.02 Heart in social encounters',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A knot of twine and feathers, blessed by a roadside saint. It smells of campfire.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 },
        // THR-745: a travelling charm opens doors socially. Minor band.
        { type: 'stat_contribution', contributions: { heart: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_bone_ward',
    type: 'artifact',
    name: 'Bone Ward',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#iron', '#talisman', '#survival'],
      mechanicalSummary: '+0.04 Iron roll · Iron capability +0.25 while borne, blocks poison conditions',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Carved from a knucklebone and hung on gut string. Old magic, close to the body.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.04 },
        { type: 'tag_immunity', tags: ['#poison'] },
        // THR-745: a ward against poison keeps its bearer standing. Minor band.
        { type: 'stat_contribution', contributions: { iron: 0.25 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_duelists_luck_token',
    type: 'artifact',
    name: "Duelist's Luck Token",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#iron', '#talisman', '#combat', '#precision'],
      mechanicalSummary: 'Upgrade one close Iron failure by 1 step during combat.',
      censusTag: { scale: 'local' },
      effects: [
        {
          type: 'test_shaper',
          reach: 'iron',
          condition: 'in_combat',
          trigger: 'near_miss',
          maxMargin: 8,
          steps: 1,
        },
        // THR-1169: exclusion CONFIRMED — the closest call of the three, so the reasoning is
        // recorded rather than left to be re-argued. Unlike the other two exclusions this one
        // IS borne (`stealable`, not consumable), so the consumable argument does not apply.
        // It is excluded on the other half of the predicate: its sole channel is a
        // `test_shaper`, and the predicate asks for design intent that includes Domain-
        // Capability influence. A token passed between duelists catches a near-miss; it does
        // not teach anyone to fight, and the flavor says so ("recover from bad footing a
        // heartbeat faster"). Granting it Iron capability would quietly turn a luck charm
        // into a competence item — a different object than the one that was authored.
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
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#relic', '#divine'],
      mechanicalSummary: '+0.06 Star roll · Star capability +0.45 / Heart +0.2 while borne, +0.03 Heart, when blessed: +0.03 Star for 6 ticks',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A disc of fired clay stamped with a burning eye. Warm to the touch, always.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'reactive', trigger: 'blessed', effect: {
          type: 'duration', ticks: 6, reach: 'star', value: 0.03, destroyOnExpiry: true
        }, cooldown: 12 },
        // THR-745: a blessed sigil: devotion warmed by fellowship. Notable band, low.
        { type: 'stat_contribution', contributions: { star: 0.45, heart: 0.2 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_shadowglass_pendant',
    type: 'artifact',
    name: 'Shadowglass Pendant',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#shadow', '#relic', '#stealth'],
      mechanicalSummary: '+0.07 Shadow roll · Shadow capability +0.5 while borne, reveals encounters within 2 hex range',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'The glass is black but not opaque. Something moves inside when no one watches.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.07 },
        { type: 'reveal', target: 'encounters', range: 2 },
        // THR-745: shadowglass reveals what hides, which is Shadow practice. Notable band,
        // mid.
        { type: 'stat_contribution', contributions: { shadow: 0.5 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_hearthglass_ward',
    type: 'artifact',
    name: 'Hearthglass Ward',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#relic', '#ward', '#quintessence', '#survival'],
      mechanicalSummary: 'Prevent up to 0.08 quintessence loss once, then shatter.',
      censusTag: { reach: 'star', scale: 'local' },
      effects: [
        {
          type: 'prevent_loss',
          channel: 'quintessence',
          amount: 0.08,
          consumeOnPrevent: true,
        },
        // THR-1169: exclusion CONFIRMED. `consumeOnPrevent` — it shatters the one time it
        // matters. A ward that spends itself absorbing a single blow never accompanies its
        // bearer long enough to make them more capable.
      ],
      lossCondition: 'consumable',
      flavorText: 'A bubble of furnace glass with a coal-dark core. It flashes warm once when disaster almost takes hold.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_stasis_pearl',
    type: 'artifact',
    name: 'Stasis Pearl',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#veil', '#temporal', '#relic', '#preservation'],
      mechanicalSummary: '+0.05 Veil roll · Veil capability +0.4 while borne, +0.02 Veil during active phase, freezes debuff countdowns for 6 ticks (active 6 ticks, dormant 18 ticks — cooldown cycle)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A pearl the color of frozen smoke. Hold it to your chest and feel time hesitate.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.05 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 18, reach: 'veil', value: 0.02 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 6 },
        // THR-745: a pearl that holds time still. Notable band, low: most of its power is the
        // freeze utility.
        { type: 'stat_contribution', contributions: { veil: 0.4 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T3 ×2) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_heart_of_the_barrow',
    type: 'artifact',
    name: 'Heart of the Barrow',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#stone', '#relic', '#ancient', '#ruins'],
      mechanicalSummary: '+0.12 Stone roll · Stone capability +0.8 / Shadow −0.3 while borne, -0.04 Shadow, 1-hex aura: +0.02 Stone to allies, +0.01 Stone per encounter (max +0.03)',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'A stone pulled from a king\'s grave. It pulses like a heartbeat when pressed to earth.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.12 },
        { type: 'passive', reach: 'shadow', value: -0.04 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
        { type: 'stacking', reach: 'stone', valuePerStack: 0.01, maxStacks: 3, stackOn: 'any_encounter' },
        // THR-745: barrow-stone roots its bearer deeply and drags them into the light. Notable
        // band, high.
        { type: 'stat_contribution', contributions: { stone: 0.8, shadow: -0.3 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_the_weeping_icon',
    type: 'artifact',
    name: 'The Weeping Icon',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#heart', '#relic', '#divine', '#cursed'],
      mechanicalSummary: '+0.10 Heart roll · Heart capability +0.75 / Eye −0.35 while borne, -0.05 Eye, when damaged: +0.04 Heart for 6 ticks (12-tick cd), drifts toward mercy',
      censusTag: { scale: 'regional' },
      lossCondition: 'cursed',
      flavorText: 'A small wooden saint that cries real tears. You feel what others feel, whether you wish to or not.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.10 },
        { type: 'passive', reach: 'eye', value: -0.05 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 6, reach: 'heart', value: 0.04, destroyOnExpiry: true
        }, cooldown: 12 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: -0.005, limitValue: 0.30 },
        // THR-745: an icon of mercy: profound Heart bought with clear sight. Notable band,
        // high; mirrors its authored mercy drift.
        { type: 'stat_contribution', contributions: { heart: 0.75, eye: -0.35 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_hourglass_of_the_unraveling',
    type: 'artifact',
    name: 'Hourglass of the Unraveling',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#veil', '#shadow', '#temporal', '#relic', '#ancient'],
      mechanicalSummary: '+0.08 Veil roll · Veil capability +0.7 / Shadow +0.3 / Heart −0.25 while borne, +0.04 Shadow, -0.03 Heart, slows one nearby enemy (skip actions for 3 ticks), freezes own condition countdowns for 6 ticks.',
      censusTag: { scale: 'regional' },
      lossCondition: 'cursed',
      flavorText: 'The sand flows upward. The glass is warm to the touch, as if something inside is still dying.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.08 },
        { type: 'passive', reach: 'shadow', value: 0.04 },
        { type: 'passive', reach: 'heart', value: -0.03 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'cooldown_multiplier', value: 1.5, ticks: 3 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'movement_cost_multiplier', value: 1.5, ticks: 3 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 6 },
        // THR-745: unravelling time: strong Veil, shadowed, at a cost in warmth. Notable band,
        // high.
        { type: 'stat_contribution', contributions: { veil: 0.7, shadow: 0.3, heart: -0.25 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans (T4 ×1) ─────────────────────────────────────
  {
    id: 'reward_relics_talismans_the_fulcrum',
    type: 'artifact',
    name: 'The Fulcrum',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 4,
      tags: ['#veil', '#relic', '#ancient', '#divine', '#arcane', '#ruins'],
      mechanicalSummary: '+0.15 Veil roll · Veil capability +1.2 / Star +0.6 while borne, +0.08 Star, 1-hex aura: +0.03 Veil to all, mystical encounter bonus +0.04 Veil, outcome shift in mystical (+1 step)',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'permanent',
      flavorText: 'A sphere of perfect obsidian that balances on any surface. Reality bends toward it.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.15 },
        { type: 'passive', reach: 'star', value: 0.08 },
        { type: 'aura', radius: 1, target: 'all', reach: 'veil', value: 0.03 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.04 },
        { type: 'test_shaper', reach: 'veil', condition: 'in_mystical', trigger: 'near_miss', steps: 1, maxMargin: 5 },
        // THR-745: the Fulcrum is a legendary instrument of the Veil with a celestial arm.
        // Legendary band.
        { type: 'stat_contribution', contributions: { veil: 1.2, star: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Mounts & Beasts (T1 ×3) ────────────────────────────────────────
  {
    id: 'reward_mounts_beasts_draft_pony',
    type: 'artifact',
    name: 'Draft Pony',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#mount', '#travel', '#wilderness'],
      mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack animal)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#eye', '#survival', '#wilderness'],
      mechanicalSummary: '+0.04 Eye, amplifies exploration encounters (1.3x)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#travel', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Stone, +1 consumable slot (pack carrier)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#iron', '#weapon', '#combat', '#wilderness'],
      mechanicalSummary: '+0.06 Iron, +0.03 Eye, +0.03 Iron in combat, cooperation bias toward enemies: -0.2 (the hound snarls)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#mount', '#travel', '#wilderness'],
      mechanicalSummary: '+0.05 Gold, +0.03 Iron, 20% reduced movement cost, flee on damage (+0.04 Gold for 4 ticks, 12-tick cd)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#mount', '#iron', '#combat', '#wilderness'],
      mechanicalSummary: '+0.10 Iron, +0.05 Gold, 20% reduced movement cost, grants cavalry_charge trait, amplifies combat encounters (1.4x)',
      censusTag: { scale: 'regional' },
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

  // --- Diverse Mounts (pipeline: 2026-04-07) ---
  {
    id: 'reward_mounts_beasts_dustwalker',
    type: 'artifact',
    name: 'Dustwalker',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#mount', '#shadow', '#stealth', '#wilderness'],
      mechanicalSummary: '+0.04 Shadow, 15% reduced movement cost, +0.03 Shadow in enemy territory (ambush positioning)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A gaunt grey thing with hooves wrapped in rags. It makes no sound on any surface and will not approach firelight.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.04 },
        { type: 'range_modifier', movementCostMultiplier: 0.85 },
        { type: 'conditional', condition: 'in_enemy_territory', reach: 'shadow', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_smoke_tooth',
    type: 'artifact',
    name: 'Smoke-Tooth',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#mount', '#shadow', '#combat', '#intimidation'],
      mechanicalSummary: '+0.07 Shadow, +0.03 Iron, 15% reduced movement cost, grants shadow_strike trait, enemies in 1 hex: -0.03 Eye (shroud aura)',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'A wolf the size of a yearling calf, black as wet charcoal. Smoke leaks from between its teeth when it breathes. It chose you. You did not choose it.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.07 },
        { type: 'passive', reach: 'iron', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.85 },
        { type: 'trait_grant', grantedTrait: 'shadow_strike' },
        { type: 'aura', radius: 1, target: 'enemies', reach: 'eye', value: -0.03 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_shimmer_hart',
    type: 'artifact',
    name: 'Shimmer Hart',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#mount', '#veil', '#mystical', '#exploration'],
      mechanicalSummary: '+0.04 Veil, 10% reduced movement cost, +1 awareness hex range, +0.03 Veil in mystical encounters',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A white hart with too many antler points. Its hooves leave no prints but the air shimmers where it stepped, as if heat were rising from snow.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'range_modifier', movementCostMultiplier: 0.9, awarenessRangeBonus: 1 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_glimmermoth',
    type: 'artifact',
    name: 'Glimmermoth',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#mount', '#veil', '#mystical', '#arcane'],
      mechanicalSummary: '+0.06 Veil, +0.03 Eye, 15% reduced movement cost, +2 awareness hex range, immune to fear/illusion tags, amplifies mystical encounters (1.3x)',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'Larger than any moth should be and luminous at the wing-edges. It navigates by ley-lines that no cartographer has mapped. When it lands on your shoulder the weight is barely there, but the world looks different.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.85, awarenessRangeBonus: 2 },
        { type: 'tag_immunity', tags: ['#fear', '#illusion'] },
        { type: 'behavior_weight', reach: 'veil', multiplier: 1.3 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_hearthbound_hound',
    type: 'artifact',
    name: 'Hearthbound Hound',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#heart', '#loyalty', '#social', '#companion'],
      mechanicalSummary: '+0.04 Heart, +0.02 Iron, cooperation +0.15 toward allies, when damaged: +0.04 Heart for 3 ticks (8-tick cooldown, protective instinct)',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'It followed a dead woman for nine days before it found you. Now it sleeps across your doorway and will not let strangers pass without your word.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.04 },
        { type: 'passive', reach: 'iron', value: 0.02 },
        { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 },
        { type: 'reactive', trigger: 'damaged', effect: {
          type: 'duration', ticks: 3, reach: 'heart', value: 0.04, destroyOnExpiry: true
        }, cooldown: 8 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_sorrowheart_mare',
    type: 'artifact',
    name: 'Sorrowheart Mare',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#mount', '#heart', '#empathy', '#social', '#healing'],
      mechanicalSummary: '+0.08 Heart, +0.03 Gold, 20% reduced movement cost, allies in 1 hex: +0.02 Heart (calming aura), grants empathic_bond trait',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'She carries grief the way other horses carry weight -- steadily, without stumbling. Wounded soldiers stop screaming when she walks through camp. No one knows why.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.08 },
        { type: 'passive', reach: 'gold', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.8 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
        { type: 'trait_grant', grantedTrait: 'empathic_bond' },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_dawnfeather_kestrel',
    type: 'artifact',
    name: 'Dawnfeather Kestrel',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 3,
      tags: ['#beast', '#star', '#prophecy', '#awareness', '#companion'],
      mechanicalSummary: '+0.06 Star, +0.04 Eye, +3 awareness hex range, amplifies exploration encounters (1.2x), when encounter starts: +0.03 Star for 4 ticks (6-tick cooldown, prescient warning)',
      censusTag: { scale: 'regional' },
      lossCondition: 'permanent',
      flavorText: 'It perches on your shoulder at dawn and screams at things that have not happened yet. By the time you understand its warning, you are already moving.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'range_modifier', awarenessRangeBonus: 3 },
        { type: 'behavior_weight', reach: 'eye', multiplier: 1.2 },
        { type: 'reactive', trigger: 'encounter_started', effect: {
          type: 'duration', ticks: 4, reach: 'star', value: 0.03, destroyOnExpiry: true
        }, cooldown: 6 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_mounts_beasts_pale_pilgrim',
    type: 'artifact',
    name: 'The Pale Pilgrim',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'mounts_beasts',
      tier: 4,
      tags: ['#beast', '#mount', '#star', '#veil', '#legendary', '#celestial'],
      mechanicalSummary: '+0.06 Star, +0.04 Veil, +0.03 Eye, 25% reduced movement cost, +2 awareness hex range, allies in 1 hex: +0.02 Star (fate-touched aura), grants starborne_rider trait',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'permanent',
      flavorText: 'No breed anyone can name. Coat like moonlight on still water. It appeared at the crossroads on the longest night and waited, as though it had always known you would come. The old woman at the wayshrine said it had been waiting for a century.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.75, awarenessRangeBonus: 2 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'star', value: 0.02 },
        { type: 'trait_grant', grantedTrait: 'starborne_rider' },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T1 ×4) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_hardtack_and_salt',
    type: 'artifact',
    name: 'Hardtack and Salt',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#food', '#provision', '#survival', '#wilderness', '#trade'],
      mechanicalSummary: '+0.03 Iron, +0.02 Iron in wilderness (trail sustenance)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#drink', '#provision', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Iron, decays -0.003/tick to 0 (water runs out)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#tool', '#provision', '#survival', '#wilderness'],
      mechanicalSummary: '+0.03 Stone, 3 charges of +0.03 Stone burst (fire-making)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#drink', '#provision', '#heart', '#trade'],
      mechanicalSummary: '+0.04 Heart, decays -0.005/tick to 0 (wine runs out)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Cheap and sour, but it loosens tongues and lightens burdens.',
      effects: [
        { type: 'decay', reach: 'heart', startValue: 0.04, changePerTick: -0.005, limitValue: 0, destroyAtLimit: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_berserker_draught',
    type: 'artifact',
    name: "Berserker's Draught",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#iron', '#consumable', '#combat', '#alchemy'],
      mechanicalSummary: 'Grants 1 extra action for 4 ticks, +0.02 Iron per use, but -0.03 Heart for 6 ticks (fades). Consumable, 2 charges, destroyed when empty.',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Thick as tar and smells worse. The old soldiers swear by it. The young ones vomit first, then swear by it.',
      effects: [
        { type: 'consumable_charge', charges: 2, onUse: { reach: 'iron', value: 0.02 }, destroyOnEmpty: true },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'cooldown_multiplier', value: 0.7, ticks: 4 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: 0.75, ticks: 4 },
        { type: 'decay', reach: 'heart', startValue: -0.03, changePerTick: 0.005, limitValue: 0.0, destroyAtLimit: true },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T2 ×2) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_healing_poultice',
    type: 'artifact',
    name: 'Healing Poultice',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 2,
      tags: ['#potion', '#provision', '#heart', '#healing', '#wilderness'],
      mechanicalSummary: '+0.07 Heart, decays -0.007/tick to 0 (poultice absorbed)',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 2,
      tags: ['#star', '#provision', '#divine', '#healing'],
      mechanicalSummary: '+0.06 Star, +0.03 Heart, lasts until rest (sanctuary ends when you move on)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'When burned, the smoke forms shapes that soothe the troubled spirit.',
      effects: [
        { type: 'until_event', event: 'rest', reach: 'star', value: 0.06, destroyOnEvent: true },
        { type: 'until_event', event: 'rest', reach: 'heart', value: 0.03, destroyOnEvent: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_timekeepers_last_vial',
    type: 'artifact',
    name: "Timekeeper's Last Vial",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 2,
      tags: ['#veil', '#consumable', '#temporal', '#alchemy'],
      mechanicalSummary: 'Freezes all buff countdowns for 8 ticks. 3 charges, destroyed when empty. +0.04 Veil passive while held.',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'The liquid inside does not slosh when shaken. It remembers where it was.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'veil', value: 0.01 }, destroyOnEmpty: true },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 8 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Intelligence (T2 ×2) ───────────────────────────────────────────
  {
    id: 'reward_intelligence_shrine_map',
    type: 'artifact',
    name: 'Vessen Shrine Map',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#shadow', '#intelligence', '#shrine_location', '#rival_god'],
      mechanicalSummary: '+0.03 Shadow, reveals encounters within 2 hexes, +0.02 Shadow in exploration',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText:
        'Six pages of careful hand — route notes, guardian schedules, a margin sketch ' +
        'of the approach from the river side. Seventeen years of trade route intelligence ' +
        'compressed into a map fragment that changes the regional balance of power.',
      intelligenceType: 'shrine_location',
      targetRegion: 'vessen_uplands',
      detailLevel: 'full',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.03 },
        { type: 'reveal', target: 'encounters', range: 2 },
        { type: 'conditional', condition: 'in_exploration', reach: 'shadow', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_intelligence_trade_route_dossier',
    type: 'artifact',
    name: 'Trade Route Dossier',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#shadow', '#intelligence', '#trade', '#economic'],
      mechanicalSummary: '+0.03 Shadow, +0.02 Gold, +1 awareness range, +0.02 Gold in social encounters',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText:
        'A broker\'s working file — commodity flows, caravan schedules, price spreads ' +
        'between settlements. The margins are annotated in a cipher that takes patience to read.',
      intelligenceType: 'trade_network',
      detailLevel: 'partial',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.03 },
        { type: 'passive', reach: 'gold', value: 0.02 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Provisions (T3 ×1) ─────────────────────────────────────────────
  {
    id: 'reward_provisions_veilwater_flask',
    type: 'artifact',
    name: 'Veilwater Flask',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 3,
      tags: ['#veil', '#potion', '#provision', '#arcane'],
      mechanicalSummary: '+0.10 Veil (decays -0.008/tick), +0.05 Eye (decays -0.004/tick), reveals all hexes while active',
      censusTag: { scale: 'regional' },
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
  //
  // THR-1169 — the proof/item split in this block, settled. Do not re-litigate per entry.
  //
  // THR-745 held the whole block back from the `stat_contribution` migration on one
  // rationale: an entry here exists to demonstrate exactly ONE effect primitive, and
  // bolting a second primitive onto a single-primitive proof weakens what it proves.
  // That rationale is sound, but it does not describe every entry that ended up here.
  //
  // PROOF (no `stat_contribution` — adding one would blunt the demonstration):
  //   an entry whose identity IS its primitive. Remove the primitive and nothing is left;
  //   the name describes the mechanic, not an object. Ember Edge (`conditional`), Moonstone
  //   Pendant (`cooldown`), Veteran's Shield (`stacking`), Fading Ward (`decay`),
  //   Double-Edged Blade (`tradeoff`, T3 — tier is not the test), Battle Salve
  //   (`consumable_charge`), Leather Bandolier / Scroll Case / Quartermaster's Harness
  //   (`slot_bonus`), Sealed Bounty Scroll / Tithe Box (`content_grant`), Pilgrim's
  //   Wayfinding Stone / Battle Spoils Talisman (`action_trigger`), and the T1/T2 entries
  //   that pair one passive with the single primitive under test (Hush Stone, Gambler's
  //   Last Copper, Wardwright's Compass, Book of Sealing, River Clay Bead, Tarnished
  //   Draw-Tube).
  //
  // ITEM (migrated): a composed artifact — several interacting effects expressing one
  //   design idea, borne rather than consumed, with flavor describing an object that has a
  //   history. Null Circlet, Fatesight Lens, The Sweating Vessel, Bag of Conveyance,
  //   The Trembling Needle, The Anvilbone, and the three T4 legendaries filed under
  //   `provisions` that are not consumables by any mechanical signal — The Quiet Cup,
  //   The Last Harvest, The Black Mead (`lossCondition` permanent/cursed, no charges, no
  //   `destroyOnEmpty`). The predicate excludes consumables; those three are borne, so it
  //   never reached them. That is an entry-level reading, NOT a revision of the predicate:
  //   `provisions` remains excluded as a category.
  //
  // Anything added to this block later inherits the same test: proof, or item?
  {
    id: 'reward_arms_ember_edge',
    type: 'artifact',
    name: 'Ember Edge',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#melee', '#combat', '#force'],
      mechanicalSummary: '+0.06 Iron in combat only, fades if unused',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#veil', '#relic', '#magic', '#spirit'],
      mechanicalSummary: '+0.08 Veil for 3 ticks, then dormant 7 ticks',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#shield', '#combat'],
      mechanicalSummary: '+0.015 Iron per combat survived, max 4 stacks',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#flesh', '#consumable', '#healing', '#life'],
      mechanicalSummary: '3 charges: +0.10 Stone per use, destroyed when empty',
      censusTag: { reach: 'stone', scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Smells of pine tar and something sharper. Three doses, no more.',
      // THR-1359: `onUse.reach` was `flesh`, the retired 9th Reach, so this item's
      // three charges granted nothing — the only catalog entry still doing that
      // (every peer in `anomaly-reward-catalog.ts` uses a live Reach). Remapped to
      // `stone`, which the item's own `censusTag` above already declares and which
      // is the canon migration target for body-and-endurance content
      // (`Docs/canon/cosmology.md`: body modification → Stone).
      effects: [
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'stone' as const, value: 0.10 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_fading_ward',
    type: 'artifact',
    name: 'Fading Ward',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#veil', '#scroll', '#magic', '#ward', '#entropy'],
      mechanicalSummary: '+0.10 Veil decaying 0.01/tick to floor of 0.03',
      censusTag: { scale: 'local' },
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
      attachmentCategory: 'possession',
      subcategory: 'arms',
      tier: 3,
      tags: ['#iron', '#shadow', '#weapon', '#melee', '#combat'],
      mechanicalSummary: '+0.08 Iron, -0.04 Heart (cuts both ways)',
      censusTag: { reach: 'iron', scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The grip is wrapped in black leather. It draws blood from the wielder as easily as the target.',
      effects: [
        { type: 'tradeoff', bonus: { reach: 'iron' as const, value: 0.08 }, penalty: { reach: 'heart' as const, value: -0.04 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Encounter-Altering Primitives (pipeline: 2026-04-07) ---

  // --- Relics & Talismans (T1 x1) ----------------------------------------
  {
    id: 'reward_relics_talismans_the_hush_stone',
    type: 'artifact',
    name: 'The Hush Stone',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#veil', '#talisman', '#ward', '#anti-magic'],
      mechanicalSummary: '+0.03 Veil, +0.02 Veil in mystical encounters, suppresses spells on self for 4 ticks',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A river stone worn smooth and cold. When sorcery gathers, it drinks the sound from the air.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.02 },
        { type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 4 },
      ],
    } as PossessionNodeProperties,
  },

  // --- Relics & Talismans (T2 x1) ----------------------------------------
  {
    id: 'reward_relics_talismans_gamblers_last_copper',
    type: 'artifact',
    name: "Gambler's Last Copper",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#talisman', '#luck', '#fate'],
      mechanicalSummary: '+0.04 Star, upgrades near-miss outcomes by 1 step',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A copper coin so old the face has worn away. The last thing a dead gambler held. It feels warm when odds turn.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'test_shaper', reach: 'star', trigger: 'near_miss', maxMargin: 6, steps: 1 },
      ],
    } as PossessionNodeProperties,
  },

  // --- Relics & Talismans (T3 x1) ----------------------------------------
  {
    id: 'reward_relics_talismans_null_circlet',
    type: 'artifact',
    name: 'Null Circlet',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#veil', '#shadow', '#relic', '#anti-magic', '#ancient'],
      mechanicalSummary: '+0.08 Veil roll · Veil capability +0.75 / Shadow +0.35 / Star −0.3 while borne, +0.04 Shadow, -0.04 Star, suppresses all effects in 1-hex radius for 6 ticks, shrouds its hex for 8 ticks',
      censusTag: { scale: 'regional' },
      lossCondition: 'cursed',
      flavorText: 'A band of grey iron that sits above the brow like a wound. Nothing magical survives within arm\'s reach. Including prayers.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.08 },
        { type: 'passive', reach: 'shadow', value: 0.04 },
        { type: 'passive', reach: 'star', value: -0.04 },
        { type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes: 1 }, ticks: 6 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'shrouded', ticks: 8 },
        // THR-1169: ITEM, not a primitive proof — a named T3 cursed relic composing five
        // effects into one anti-magic identity. Its suppress/barrier arms are utility, not
        // roll shapers, so it sits mid-high in the notable band. Star penalty mirrors the
        // authored -0.04 (half the Veil bonus): it silences prayer as readily as sorcery.
        { type: 'stat_contribution', contributions: { veil: 0.75, shadow: 0.35, star: -0.3 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Tools & Instruments (T2 x1) ----------------------------------------
  {
    id: 'reward_tools_instruments_wardwright_compass',
    type: 'artifact',
    name: "Wardwright's Compass",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#stone', '#tool', '#ward', '#craft', '#territorial'],
      mechanicalSummary: '+0.05 Stone, creates movement barrier between self hex and adjacent for 10 ticks, +0.03 Stone at home territory',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The needle does not point north. It points toward the boundary of what is yours and what is not.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.05 },
        { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks: 10 },
      ],
    } as PossessionNodeProperties,
  },

  // --- Tools & Instruments (T3 x1) ----------------------------------------
  {
    id: 'reward_tools_instruments_fatesight_lens',
    type: 'artifact',
    name: 'Fatesight Lens',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 3,
      tags: ['#eye', '#star', '#tool', '#divination', '#fate'],
      mechanicalSummary: '+0.06 Eye roll · Eye capability +0.7 / Star +0.3 / Shadow −0.25 while borne, +0.04 Star, -0.03 Shadow, upgrades near-miss outcomes by 1 step, reveals encounters within 2 hexes',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A lens of polished quartz set in brass so old it has turned green. Through it, the future is not one line but many, and some of them are kind.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.06 },
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'passive', reach: 'shadow', value: -0.03 },
        { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', maxMargin: 6, steps: 1 },
        { type: 'reveal', target: 'encounters', range: 2 },
        // THR-1169: ITEM, not a primitive proof — a named T3 divination lens composing five
        // effects. Low end of the notable band: four rerolls is a strong roll shaper
        // already, per THR-745's rule. Shadow penalty mirrors the authored -0.03 — seeing
        // every thread leaves nothing hidden to work behind.
        { type: 'stat_contribution', contributions: { eye: 0.7, star: 0.3, shadow: -0.25 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Provisions (T1 x1) ------------------------------------------------
  {
    id: 'reward_provisions_ward_incense',
    type: 'artifact',
    name: 'Ward Incense',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#stone', '#consumable', '#ward', '#territorial'],
      mechanicalSummary: '+0.02 Stone (always), 3 charges of +0.03 Stone burst, creates movement barrier on adjacent hexes for 6 ticks (while held)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Resinous sticks that burn with a bitter smoke. The old folk plant them at doorsteps and say nothing crosses the threshold while the ash is warm.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.02 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'stone', value: 0.03 }, destroyOnEmpty: true },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks: 6 },
      ],
    } as PossessionNodeProperties,
  },

  // --- Tomes & Scrolls (T2 x1) -------------------------------------------
  {
    id: 'reward_tomes_scrolls_book_of_sealing',
    type: 'artifact',
    name: 'Book of Sealing',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#veil', '#stone', '#tome', '#ward', '#ritual'],
      mechanicalSummary: '+0.04 Veil, +0.03 Stone, suppresses auras on self hex for 8 ticks, creates both-type barrier on adjacent hexes for 8 ticks',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'The pages are blank until held near something enchanted. Then the ink rises like veins beneath skin, spelling out how to cage it.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'passive', reach: 'stone', value: 0.03 },
        { type: 'suppress', target: 'aura', scope: { scope: 'hex', target: 'self' }, ticks: 8 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'shrouded', ticks: 8 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks: 8 },
      ],
    } as PossessionNodeProperties,
  },

  // --- Thin Primitives: Provisions (pipeline: 2026-04-07) ---
  {
    id: 'reward_provisions_spring_water_vial',
    type: 'artifact',
    name: 'Spring Water Vial',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#star', '#provision', '#divine', '#restoration'],
      mechanicalSummary: '+0.02 Star near water, restores 1 essence (one-shot)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Drawn from a spring that remembers its source. Drink it near somewhere holy and feel the world lean closer.',
      effects: [
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
        { type: 'conditional', condition: 'near_water', reach: 'star', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_meditation_stones',
    type: 'artifact',
    name: 'Meditation Stones',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 1,
      tags: ['#star', '#provision', '#divine', '#calm', '#restoration'],
      mechanicalSummary: '+0.03 Star, restores 1 essence (one-shot) when alone',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Five flat stones, each a different shade of grey. Arranged in the right order, they settle the mind like still water.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.03 },
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot', condition: 'alone' },
      ],
    } as PossessionNodeProperties,
  },

  // --- T4 Legendary Provisions (pipeline: 2026-04-07) ---
  {
    id: 'reward_provisions_the_quiet_cup',
    type: 'artifact',
    name: 'The Quiet Cup',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 4,
      tags: ['#star', '#heart', '#provision', '#divine', '#ancient', '#healing', '#celestial'],
      mechanicalSummary: '+0.08 Star roll · Star capability +1.2 / Heart +0.6 while borne, +0.06 Heart, restores 1 essence per tick (requires Star > 0.10), 1-hex aura: +0.02 Heart to allies, blocks Iron actions (too peaceful to fight)',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'permanent',
      flavorText: 'The cup is always full. It tastes like the first meal you remember — the last drink before sleep. Those who share it speak more softly afterward.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.08 },
        { type: 'passive', reach: 'heart', value: 0.06 },
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'reach_above:star:0.10' },
        { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
        { type: 'action_gate', mode: 'block', reach: 'iron' },
        // THR-1169: ITEM despite the `provisions` subcategory — `lossCondition: 'permanent'`,
        // no `consumable_charge`, no `destroyOnEmpty`. It is borne, never consumed, so the
        // predicate's consumable exclusion does not reach it. Legendary band.
        // No Iron penalty: `action_gate` already blocks Iron outright, and pricing the block
        // a second time as lost capability would double-count one authored cost.
        { type: 'stat_contribution', contributions: { star: 1.2, heart: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_the_last_harvest',
    type: 'artifact',
    name: 'The Last Harvest',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 4,
      tags: ['#iron', '#stone', '#provision', '#ancient', '#cursed', '#survival', '#fortification'],
      mechanicalSummary: '+0.07 Iron roll · Iron capability +1.2 / Stone +0.6 / Heart −0.6 while borne, +0.06 Stone, blocks poison/disease/blight conditions, -0.04 Heart (numbing), modifies death_prevented rule (cannot die while held)',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'cursed',
      flavorText: 'The grain is pale and heavy as lead. It tastes of nothing. After the third handful you stop noticing hunger, and after the tenth you stop noticing most things.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.07 },
        { type: 'passive', reach: 'stone', value: 0.06 },
        { type: 'tag_immunity', tags: ['#poison', '#disease', '#blight'] },
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'death_prevented', value: true, ticks: 'permanent' },
        // THR-1169: ITEM despite the `provisions` subcategory — `lossCondition: 'cursed'`,
        // no charges, never destroyed. Borne, so the consumable exclusion does not reach it.
        // Legendary band. Heart −0.6 mirrors the authored numbing at the shipped T4 penalty
        // rung: the grain keeps you alive by making you stop noticing anyone.
        { type: 'stat_contribution', contributions: { iron: 1.2, stone: 0.6, heart: -0.6 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_provisions_the_black_mead',
    type: 'artifact',
    name: 'The Black Mead',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'provisions',
      tier: 4,
      tags: ['#veil', '#shadow', '#provision', '#cursed', '#arcane', '#ancient', '#prophecy'],
      mechanicalSummary: '+0.09 Veil roll · Veil capability +1.3 / Shadow +0.6 / Star −0.3 while borne, +0.05 Shadow, reveals all encounters (unlimited range), +0.04 Veil / -0.02 Star tradeoff (clarity at the cost of faith), drifts toward ruthlessness',
      censusTag: { scale: 'cosmic' },
      lossCondition: 'cursed',
      flavorText: 'The mead is black and tastes of smoke and thyme. After the first draught the world looks thin — you can see the seams where it was stitched together. You pull at them.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.09 },
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'reveal', target: 'encounters', range: 'all' },
        { type: 'tradeoff', bonus: { reach: 'veil', value: 0.04 }, penalty: { reach: 'star', value: 0.02 } },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.006, limitValue: 0.45 },
        // THR-1169: ITEM despite the `provisions` subcategory — `lossCondition: 'cursed'`,
        // no charges, never destroyed. Borne, so the consumable exclusion does not reach it.
        // Top of the legendary band: seeing the seams of the world is the catalog's widest
        // Veil claim. Star −0.3 mirrors the authored tradeoff, which is small by design —
        // the mead does not take faith so much as make it look unnecessary.
        { type: 'stat_contribution', contributions: { veil: 1.3, shadow: 0.6, star: -0.3 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Thin Primitives: Relics (pipeline: 2026-04-07) ---
  {
    id: 'reward_relics_talismans_river_clay_bead',
    type: 'artifact',
    name: 'River Clay Bead',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#star', '#relic', '#divine', '#restoration', '#faith'],
      mechanicalSummary: '+0.04 Star, restores 1 essence per tick during mystical encounters',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A thumb-worn bead of river clay, shaped by a hundred thousand whispered prayers. It hums when the veil thins.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'in_mystical' },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_tarnished_draw_tube',
    type: 'artifact',
    name: 'Tarnished Draw-Tube',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#veil', '#relic', '#arcane', '#parasitic'],
      mechanicalSummary: '+0.06 Veil / -0.03 Star (tradeoff), drains 1 quintessence from other agent per tick',
      censusTag: { reach: 'veil', scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A glass tube bound in tarnished silver. It draws something out of the air near living things. They seem not to notice.',
      effects: [
        { type: 'tradeoff', bonus: { reach: 'veil', value: 0.06 }, penalty: { reach: 'star', value: 0.03 } },
        { type: 'resource_manipulate', resource: 'quintessence', target: 'other_agent', amount: -1, mode: 'per_tick' },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_the_sweating_vessel',
    type: 'artifact',
    name: 'The Sweating Vessel',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#veil', '#relic', '#arcane', '#ancient', '#restoration'],
      mechanicalSummary: 'Veil capability +0.7 / Star −0.3 while borne · Veil roll decays from +0.08 to +0.02 over ~20 ticks, -0.04 Star, restores 2 quintessence per tick',
      censusTag: { scale: 'regional' },
      lossCondition: 'cursed',
      flavorText: 'A vessel of fused obsidian, warm to the touch. It sweats a clear liquid that smells of lightning. The priests who made it did not survive the process.',
      effects: [
        { type: 'decay', reach: 'veil', startValue: 0.08, changePerTick: -0.003, limitValue: 0.02, destroyAtLimit: false },
        { type: 'passive', reach: 'star', value: -0.04 },
        { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: 2, mode: 'per_tick' },
        // THR-1169: ITEM, not a primitive proof — a named T3 cursed relic with authored
        // history (the priests who made it did not survive). Low end of the notable band:
        // its Veil *roll* wastes away, so competence outlives the bonus but should not
        // outstrip it. Star penalty mirrors the authored -0.04 cost of using the thing.
        { type: 'stat_contribution', contributions: { veil: 0.7, star: -0.3 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Thin Primitives: Tools (pipeline: 2026-04-07) ---
  {
    id: 'reward_tools_instruments_leather_bandolier',
    type: 'artifact',
    name: 'Leather Bandolier',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#iron', '#tool', '#equipment', '#carrying'],
      mechanicalSummary: '+0.02 Iron, +1 weapon slot',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Cracked leather and brass buckles, fitted to cross the chest. Room enough for one more blade.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.02 },
        { type: 'slot_bonus', slotTag: 'weapon', bonus: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_scroll_case',
    type: 'artifact',
    name: 'Scroll Case',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#veil', '#tool', '#equipment', '#carrying', '#scholarly'],
      mechanicalSummary: '+0.02 Veil, +1 tome slot',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Oiled leather, sealed with wax. Keeps the rain off what matters.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.02 },
        { type: 'slot_bonus', slotTag: 'tome', bonus: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_quartermasters_harness',
    type: 'artifact',
    name: "Quartermaster's Harness",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#stone', '#gold', '#tool', '#equipment', '#carrying', '#trade'],
      mechanicalSummary: '+0.04 Stone, +1 consumable slot, +1 utility slot, 20% slower movement',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Canvas and ironwork, distributing weight across shoulders and hips. You carry more. You carry it slower.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.04 },
        { type: 'slot_bonus', slotTag: 'consumable', bonus: 1 },
        { type: 'slot_bonus', slotTag: 'utility', bonus: 1 },
        { type: 'range_modifier', movementCostMultiplier: 1.2 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_salvage_kit',
    type: 'artifact',
    name: 'Salvage Kit',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#stone', '#tool', '#scavenging', '#discovery', '#wilderness'],
      mechanicalSummary: '+0.04 Stone, grants a random provision or tool on use, +0.02 Stone in wilderness',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Wire cutters, a pry bar, three sizes of bag. Everything you need to take apart what someone else put together.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.04 },
        { type: 'conditional', condition: 'in_wilderness', reach: 'stone', value: 0.02 },
        {
          type: 'content_grant',
          templateIds: [
            'reward_provisions_hardtack_and_salt',
            'reward_arms_bronze_spear',
            'reward_provisions_travelers_wine',
            'reward_relics_talismans_bone_ward',
          ],
          selection: 'random',
          narrativeTemplate: 'The kit finds purchase. Salvaged: {grantedName}.',
        },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_bag_of_conveyance',
    type: 'artifact',
    name: 'Bag of Conveyance',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      slotTag: 'utility',
      tier: 3,
      tags: ['#gold', '#veil', '#arcane', '#equipment', '#carrying', '#ancient'],
      mechanicalSummary: '+0.06 Gold roll · Gold capability +0.75 / Veil +0.35 while borne, +0.04 Veil, +2 consumable slots, +1 wealth slot, restores 1 essence (one-shot)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A leather satchel with seams that do not line up with its edges. You reach in past the elbow and your hand keeps going. The stitching hums when you find what you were looking for.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.06 },
        { type: 'passive', reach: 'veil', value: 0.04 },
        { type: 'slot_bonus', slotTag: 'consumable', bonus: 2 },
        { type: 'slot_bonus', slotTag: 'wealth', bonus: 1 },
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
        // THR-1169: ITEM, not a primitive proof — a named T3 arcane satchel with authored
        // history, well past the bare `slot_bonus` demos (Bandolier, Scroll Case) it shares
        // the block with. Mid-high notable band: no roll shaper competes with it, and a
        // merchant who can carry anything anywhere genuinely trades better.
        { type: 'stat_contribution', contributions: { gold: 0.75, veil: 0.35 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- T4 Legendary Tools (pipeline: 2026-04-07) ---
  {
    id: 'reward_tools_instruments_the_trembling_needle',
    type: 'artifact',
    name: 'The Trembling Needle',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 4,
      tags: ['#eye', '#veil', '#tool', '#divination', '#ancient', '#exploration'],
      mechanicalSummary: '+0.08 Eye roll · Eye capability +1.2 / Veil +0.6 while borne, +0.05 Veil, reveals all encounters within 3 hexes, +0.03 Eye in exploration, modifies awareness range +2 (permanent, self only)',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'It trembles when you face a direction no one has walked. Carved from the world\'s first boundary stone. It has never pointed north.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'passive', reach: 'veil', value: 0.05 },
        { type: 'reveal', target: 'encounters', range: 3 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: 2, ticks: 'permanent' },
        // THR-1169: ITEM, not a primitive proof — a named T4 legendary composing five
        // effects, including a permanent rule modification. Legendary band, matching the
        // shipped T4 rung (Quiet Blade, Fulcrum): an instrument that permanently widens
        // what its bearer can perceive is a competence artifact, not a demo.
        { type: 'stat_contribution', contributions: { eye: 1.2, veil: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_the_anvilbone',
    type: 'artifact',
    name: 'The Anvilbone',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tools_instruments',
      tier: 4,
      tags: ['#stone', '#star', '#tool', '#craft', '#ancient', '#divine', '#creation'],
      mechanicalSummary: '+0.10 Stone roll · Stone capability +1.3 / Star +0.6 while borne, +0.04 Star, +0.03 Stone at home territory, creates a shrine on the wielder\'s hex (permanent), drifts toward ambition',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'The bones hum when they touch raw stone. Where you set them down, the ground remembers how to hold weight. Cities begin where you rest.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.10 },
        { type: 'passive', reach: 'star', value: 0.04 },
        { type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 },
        { type: 'create_structure', what: 'landmark', subtype: 'shrine', onHex: 'self', permanent: true, properties: { name: 'Anvilbone Foundation' } },
        { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: 0.005, limitValue: 0.40 },
        // THR-1169: ITEM, not a primitive proof — a named T4 legendary that raises a
        // permanent shrine and bends its bearer toward ambition. Top of the legendary band:
        // its +0.10 Stone is the largest authored passive in the exerciser block, and
        // founding places is the purest expression of Stone the catalog has.
        { type: 'stat_contribution', contributions: { stone: 1.3, star: 0.6 } },
      ],
    } as PossessionNodeProperties,
  },

  // --- Thin Primitives: Tomes (pipeline: 2026-04-07) ---
  {
    id: 'reward_tomes_scrolls_sealed_bounty_scroll',
    type: 'artifact',
    name: 'Sealed Bounty Scroll',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#gold', '#scroll', '#reward', '#discovery'],
      mechanicalSummary: '+0.04 Gold, 2 charges — each use grants a random item from a curated pool',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Heavy parchment sealed with a merchant-guild stamp. Break the wax, and something of value falls out. Twice.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.04 },
        { type: 'consumable_charge', charges: 2, onUse: { reach: 'gold', value: 0.01 }, destroyOnEmpty: true },
        {
          type: 'content_grant',
          templateIds: [
            'reward_provisions_healing_poultice',
            'reward_provisions_travelers_wine',
            'reward_relics_talismans_bone_ward',
            'reward_relics_talismans_wayfarers_charm',
            'reward_provisions_hardtack_and_salt',
          ],
          selection: 'random',
          narrativeTemplate: 'The seal cracks. Inside: {grantedName}.',
        },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_tithe_box',
    type: 'artifact',
    name: 'Tithe Box',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      slotTag: 'utility',
      tier: 2,
      tags: ['#heart', '#star', '#offering', '#divine', '#discovery'],
      mechanicalSummary: '+0.03 Heart, restores 1 essence (one-shot), grants a random item: prayer scroll, healing poultice, or Fortune-Kissed blessing',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: "A wooden box carved with a saint's face, left at a crossroads shrine. Someone filled it. Someone always fills it.",
      effects: [
        { type: 'passive', reach: 'heart', value: 0.03 },
        { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'one_shot' },
        {
          type: 'content_grant',
          templateIds: [
            'reward_tomes_scrolls_prayer_scroll',
            'reward_provisions_healing_poultice',
            'reward_condition_fortune_kissed',
          ],
          selection: 'random',
          narrativeTemplate: 'The tithe box opens with a faint sigh. Within: {grantedName}.',
        },
      ],
    } as PossessionNodeProperties,
  },

  // ─── Content Primitive Proof Pack (TB-104 Phase 1B) ─────────────

  {
    id: 'reward_talisman_pilgrims_wayfinding_stone',
    type: 'artifact',
    name: "Pilgrim's Wayfinding Stone",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#quintessence', '#travel', '#mystical'],
      mechanicalSummary: '+3 quintessence on movement arrival (6-tick cooldown)',
      censusTag: { reach: 'star', scale: 'personal' },
      lossCondition: 'breakable',
      flavorText: 'The stone hums faintly when you arrive somewhere new, as though approving of the journey.',
      effects: [
        {
          type: 'action_trigger',
          on: 'movement_complete',
          payload: { kind: 'resource_delta', resource: 'quintessence', amount: 3 },
          cooldownTicks: 6,
        },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_charm_battle_spoils_talisman',
    type: 'artifact',
    name: 'Battle Spoils Talisman',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#essence', '#combat', '#consumable'],
      mechanicalSummary: '+5 essence on encounter success (10 uses total)',
      censusTag: { reach: 'iron', scale: 'personal' },
      lossCondition: 'consumable',
      flavorText: 'A leather pouch threaded with bone beads \u2014 each bead cracks and darkens after a victory, feeding you its stored warmth.',
      effects: [
        {
          type: 'action_trigger',
          on: 'encounter_success',
          payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
          maxFires: 10,
          cooldownTicks: 1,
        },
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
      tags: ['#wound', '#physical', '#iron', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#heart', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#iron', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#stone', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#iron', '#heart', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#iron', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#eye', '#combat', '#negative'],
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
      tags: ['#wound', '#physical', '#iron', '#flesh', '#combat', '#negative'],
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
      tags: ['#blessing', '#star', '#divine', '#healing', '#positive'],
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
      tags: ['#blessing', '#heart', '#stone', '#healing', '#positive'],
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
      tags: ['#blessing', '#gold', '#divine', '#trade', '#positive'],
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
      tags: ['#blessing', '#star', '#divine', '#heart', '#healing', '#positive'],
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
      tags: ['#blessing', '#stone', '#wilderness', '#positive'],
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
      tags: ['#blessing', '#star', '#divine', '#eye', '#ruins', '#positive'],
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
      tags: ['#curse', '#shadow', '#gold', '#negative'],
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
      tags: ['#curse', '#heart', '#veil', '#negative'],
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
      tags: ['#curse', '#heart', '#shadow', '#negative'],
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
      tags: ['#curse', '#gold', '#veil', '#negative'],
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
      tags: ['#checkpoint', '#curse', '#eye', '#shadow', '#negative'],
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
      tags: ['#curse', '#heart', '#shadow', '#veil', '#negative'],
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
      tags: ['#disease', '#flesh', '#wilderness', '#negative'],
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
      tags: ['#disease', '#flesh', '#wilderness', '#negative'],
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
      tags: ['#disease', '#flesh', '#stone', '#negative'],
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
      tags: ['#disease', '#flesh', '#veil', '#negative'],
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
      tags: ['#supernatural', '#veil', '#eye', '#positive'],
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
      tags: ['#supernatural', '#shadow', '#eye', '#positive'],
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
      tags: ['#supernatural', '#star', '#shadow', '#veil', '#positive'],
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

  // --- Time-Manipulation Conditions (pipeline: 2026-04-07) ---
  {
    id: 'reward_condition_gale_touched',
    type: 'trait',
    name: 'Gale-Touched',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#star', '#divine', '#combat', '#positive'],
      description: 'A divine gift of speed — the body moves before the mind decides.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.03 Star, grants 1 extra action for 6 ticks, fades naturally after blessing expires',
      flavorText: 'Your feet leave the ground a heartbeat before they should. Gods move in small mercies.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.03 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'cooldown_multiplier', value: 0.7, ticks: 6 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: 0.75, ticks: 6 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_temporal_anchor',
    type: 'trait',
    name: 'Temporal Anchor',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#veil', '#temporal', '#preservation', '#positive'],
      description: 'Time flows around you like water around a stone. Your blessings linger.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.05 Veil, freezes all buff countdowns for 10 ticks, +0.02 Star in mystical contexts',
      flavorText: 'The candle burns but does not shorten. The wound bleeds but does not deepen. Something holds.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.05 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 10 },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.02 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_leaden_limbs',
    type: 'trait',
    name: 'Leaden Limbs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#shadow', '#iron', '#combat', '#negative'],
      description: 'A sluggishness in the bones. Movement becomes a negotiation with gravity.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '-0.03 Iron, slowed (actions halved, not skipped) for 6 ticks, +30% movement cost',
      flavorText: 'The air thickens. Each step forward requires a step of will first.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.03 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'cooldown_multiplier', value: 1.25, ticks: 6 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'movement_cost_multiplier', value: 1.25, ticks: 6 },
        { type: 'range_modifier', movementCostMultiplier: 1.3 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_time_eaten',
    type: 'trait',
    name: 'Time-Eaten',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#curse', '#shadow', '#veil', '#temporal', '#negative'],
      description: 'Something has bitten a piece from your timeline. Moments vanish without memory.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '-0.05 Shadow, slowed (skip actions) for 4 ticks, freezes debuff countdowns for 8 ticks (curses last longer), drifts toward despair',
      flavorText: 'You blink and the sun has moved. Your companions look at you strangely, as if you were not there a moment ago.',
      effects: [
        { type: 'passive', reach: 'shadow', value: -0.05 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'cooldown_multiplier', value: 1.5, ticks: 4 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'movement_cost_multiplier', value: 1.5, ticks: 4 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.4, ticks: 8 },
        { type: 'axiological_drift', axis: 'hope_despair', ratePerTick: 0.002, limitValue: 0.2 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_the_red_divide',
    type: 'trait',
    name: 'The Red Divide',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#supernatural', '#iron', '#heart', '#combat', '#positive'],
      description: 'A berserker trance. The world slows, the body quickens, reason dims.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.10 Iron, grants 1 extra action for 8 ticks, -0.06 Heart, -0.04 Eye, slows enemies in combat for 3 ticks, blocks fear conditions, drifts toward ruthlessness',
      flavorText: 'The blood sings. Time splits in two: one half for killing, one half for forgetting.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.10 },
        { type: 'passive', reach: 'heart', value: -0.06 },
        { type: 'passive', reach: 'eye', value: -0.04 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'cooldown_multiplier', value: 0.7, ticks: 8 },
        { type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: 0.75, ticks: 8 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'cooldown_multiplier', value: 1.25, ticks: 3 },
        { type: 'modify_rules', scope: { scope: 'target' }, rule: 'movement_cost_multiplier', value: 1.25, ticks: 3 },
        { type: 'tag_immunity', tags: ['#fear', '#intimidation'] },
      ],
    } as TraitDefinitionProperties,
  },

  // --- Encounter-Altering Conditions (pipeline: 2026-04-07) ---

  // --- Blessings (T1 x1) -------------------------------------------------
  {
    id: 'reward_condition_fortune_kissed',
    type: 'trait',
    name: 'Fortune-Kissed',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#star', '#fate', '#luck', '#positive'],
      description: 'Fate bends gently toward the bearer. Misfortune slides past like rain off wax.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.03 Star, upgrades near-miss outcomes by 1 step',
      flavorText: 'You find coins in the road. Arrows miss by a finger-width. It will not last, but while it does, the world is gentle.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.03 },
        { type: 'test_shaper', reach: 'star', trigger: 'near_miss', maxMargin: 4, steps: 1 },
      ],
    } as TraitDefinitionProperties,
  },

  // --- Supernatural (T2 x1) -----------------------------------------------
  {
    id: 'reward_condition_null_touched',
    type: 'trait',
    name: 'Null-Touched',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#supernatural', '#shadow', '#veil', '#anti-magic', '#negative'],
      description: 'Something has scoured the magic from your blood. Spells slide off you. So do blessings.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.05 Shadow, -0.04 Star, suppresses spells on self for 8 ticks',
      flavorText: 'Candles gutter when you pass. Enchanted locks open at your touch, and then break. Healers look at you with pity.',
      effects: [
        { type: 'passive', reach: 'shadow', value: 0.05 },
        { type: 'passive', reach: 'star', value: -0.04 },
        { type: 'suppress', target: 'spell', scope: { scope: 'self' }, ticks: 8 },
      ],
    } as TraitDefinitionProperties,
  },

  // --- Supernatural (T3 x1) -----------------------------------------------
  {
    id: 'reward_condition_warded_ground',
    type: 'trait',
    name: 'Warded Ground',
    properties: {
      subcategory: 'condition',
      tier: 3,
      tags: ['#supernatural', '#stone', '#eye', '#territorial', '#ward', '#positive'],
      description: 'The earth itself remembers your claim. Trespassers feel the boundary in their bones.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0,
      domainContributions: {},
      mechanicalSummary: '+0.06 Stone, +0.04 Eye, creates both-type barrier on adjacent hexes for 12 ticks, allies within 1 hex gain +0.02 Stone, drifts toward mercy on the mercy-ruthlessness axis',
      flavorText: 'The grass grows shorter at the edge. Animals will not cross. Even the wind seems to hesitate at the line you have drawn.',
      effects: [
        { type: 'passive', reach: 'stone', value: 0.06 },
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'shrouded', ticks: 12 },
        { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks: 12 },
        { type: 'aura', radius: 1, target: 'allies', reach: 'stone', value: 0.02 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.003, limitValue: 0.25 },
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
        { type: 'tag_immunity', tags: ['#poison', '#disease'] },
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
      flavorText: 'A quiet nod from a captain. A gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder.',
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
      description: 'Hear the whispers of the recently dead. They offer counsel, sometimes unasked.',
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
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 1,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient'],
      mechanicalSummary: '+0.03 Eye, grants ruin_seeker, +0.02 Eye in exploration (consumed on discovery)',
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 1,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'The parchment is brittle and the ink barely legible, but the landmarks are unmistakable.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.03 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_smugglers_chart',
    type: 'artifact',
    name: "Smuggler's Chart",
    properties: {
      attachmentCategory: 'possession',
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
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#professional'],
      mechanicalSummary: '+0.05 Eye, grants ruin_seeker L2, reveals encounters within 1 hex (consumed on discovery)',
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 2,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Meticulous measurements and triangulations. Someone spent months on this.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'reveal', target: 'encounters', range: 1 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_tomb_raiders_journal',
    type: 'artifact',
    name: "Tomb Raider's Journal",
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#eye', '#shadow', '#map', '#ruin_seeker', '#ancient'],
      mechanicalSummary: '+0.04 Eye, +0.03 Shadow, grants ruin_seeker L2, +0.02 Eye in exploration (consumed on discovery)',
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 2,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Detailed notes on trap mechanisms, burial customs, and which walls sound hollow when tapped.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.04 },
        { type: 'passive', reach: 'shadow', value: 0.03 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tomes_scrolls_ancient_waystone_rubbing',
    type: 'artifact',
    name: 'Ancient Waystone Rubbing',
    properties: {
      attachmentCategory: 'possession',
      subcategory: 'tomes_scrolls',
      tier: 3,
      tags: ['#eye', '#map', '#ruin_seeker', '#ancient', '#elder'],
      mechanicalSummary: '+0.06 Eye, grants ruin_seeker L3, reveals hexes within 2, +0.03 Eye in exploration (consumed on discovery)',
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 3,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Charcoal on vellum, taken from a stone older than the kingdom. The symbols shift when you look away.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.06 },
        { type: 'reveal', target: 'hexes', range: 2 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
      ],
    } as PossessionNodeProperties,
  },
];
