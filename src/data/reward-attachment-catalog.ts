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
      mechanicalSummary: '+0.03 Iron reach',
      reachBonus: { iron: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Pitted and green with age, but the point still bites.',
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
      mechanicalSummary: '+0.04 Iron reach',
      reachBonus: { iron: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'Sinew-strung and warped from damp, but deadly enough at close range.',
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
      mechanicalSummary: '+0.04 Iron reach',
      reachBonus: { iron: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'The rust is mostly cosmetic. Mostly.',
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
      mechanicalSummary: '+0.03 Iron reach',
      reachBonus: { iron: 0.03 },
      lossCondition: 'consumable',
      flavorText: 'Carved from the rib of something large. It will not last.',
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
      mechanicalSummary: '+0.08 Iron reach',
      reachBonus: { iron: 0.08 },
      lossCondition: 'breakable',
      flavorText: 'Forged in a dead forge-town. The metal remembers heat it should not.',
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
      mechanicalSummary: '+0.07 Iron reach, +0.03 Eye reach',
      reachBonus: { iron: 0.07, eye: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'Issued to border watchers. The sighting marks are worn smooth by anxious thumbs.',
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
      mechanicalSummary: '+0.06 Iron reach, +0.03 Stone reach',
      reachBonus: { iron: 0.06, stone: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'The wood is alive. It sprouts small leaves in spring, thorns in winter.',
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
      mechanicalSummary: '+0.12 Iron reach, −0.05 Heart reach',
      reachBonus: { iron: 0.12, heart: -0.05 },
      lossCondition: 'cursed',
      flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
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
      mechanicalSummary: '+0.10 Iron reach, +0.05 Star reach',
      reachBonus: { iron: 0.10, star: 0.05 },
      lossCondition: 'permanent',
      flavorText: 'The string hums a note too low to hear. Arrows fly straighter than physics allows.',
    } as PossessionNodeProperties,
  },

  // ─── Arms (T4 ×1) ───────────────────────────────────────────────────
  {
    id: 'reward_arms_the_quiet_blade',
    type: 'artifact',
    name: 'The Quiet Blade',
    properties: {
      subcategory: 'arms',
      tier: 4,
      tags: ['#iron', '#weapon', '#melee', '#shadow', '#ancient', '#combat'],
      mechanicalSummary: '+0.18 Iron reach, +0.08 Shadow reach',
      reachBonus: { iron: 0.18, shadow: 0.08 },
      lossCondition: 'permanent',
      flavorText: 'It makes no sound when it cuts. Neither does the one it cuts.',
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
      mechanicalSummary: '+0.03 Iron reach',
      reachBonus: { iron: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Quilted linen stuffed with horsehair. Better than bare skin.',
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
      mechanicalSummary: '+0.04 Gold reach',
      reachBonus: { gold: 0.04 },
      lossCondition: 'stealable',
      flavorText: 'Dyed in the saffron of the eastern markets. Wealth worn on the sleeve.',
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
      mechanicalSummary: '+0.08 Iron reach',
      reachBonus: { iron: 0.08 },
      lossCondition: 'breakable',
      flavorText: 'Each ring was closed by hand. Someone cared enough to do it right.',
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
      mechanicalSummary: '+0.07 Shadow reach',
      reachBonus: { shadow: 0.07 },
      lossCondition: 'stealable',
      flavorText: 'The fabric drinks light. Corners seem deeper when you wear it.',
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
      mechanicalSummary: '+0.12 Shadow reach, −0.06 Heart reach',
      reachBonus: { shadow: 0.12, heart: -0.06 },
      lossCondition: 'cursed',
      flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
    } as PossessionNodeProperties,
  },

  // ─── Vestments (T4 ×1) ──────────────────────────────────────────────
  {
    id: 'reward_vestments_the_woven_sky',
    type: 'artifact',
    name: 'The Woven Sky',
    properties: {
      subcategory: 'vestments',
      tier: 4,
      tags: ['#star', '#cloth', '#divine', '#ancient'],
      mechanicalSummary: '+0.15 Star reach, +0.08 Veil reach',
      reachBonus: { star: 0.15, veil: 0.08 },
      lossCondition: 'permanent',
      flavorText: 'A robe of impossible blue, stitched with constellations that move. It weighs nothing.',
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
      mechanicalSummary: '+0.03 Eye reach',
      reachBonus: { eye: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'A naturalist\'s notes. The handwriting degrades toward the end.',
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
      mechanicalSummary: '+0.04 Star reach',
      reachBonus: { star: 0.04 },
      lossCondition: 'consumable',
      flavorText: 'The words are old and the ink fading. One reading left, perhaps.',
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
      mechanicalSummary: '+0.04 Gold reach',
      reachBonus: { gold: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'Columns of numbers, trade routes inked in margins. Knowledge is currency.',
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
      mechanicalSummary: '+0.08 Eye reach',
      reachBonus: { eye: 0.08 },
      lossCondition: 'stealable',
      flavorText: 'A history of empires that collapsed. The final chapter is blank.',
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
      mechanicalSummary: '+0.06 Veil reach, +0.03 Eye reach',
      reachBonus: { veil: 0.06, eye: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'The letters rearrange themselves when you look away.',
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
      mechanicalSummary: '+0.10 Star reach, +0.05 Eye reach',
      reachBonus: { star: 0.10, eye: 0.05 },
      lossCondition: 'permanent',
      flavorText: 'Written by a god who chose to die. Every page is a eulogy for a truth.',
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
      mechanicalSummary: '+0.18 Veil reach, −0.08 Heart reach',
      reachBonus: { veil: 0.18, heart: -0.08 },
      lossCondition: 'cursed',
      flavorText: 'The pages are blank until you bleed on them. Then they show you how everything ends.',
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
      mechanicalSummary: '+0.03 Stone reach',
      reachBonus: { stone: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Blacksmith\'s tongs, well-used. The handles are polished smooth by grip.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_tools_instruments_herbalists_pouch',
    type: 'artifact',
    name: "Herbalist's Pouch",
    properties: {
      subcategory: 'tools_instruments',
      tier: 1,
      tags: ['#flesh', '#tool', '#survival', '#craft', '#wilderness', '#healing'],
      mechanicalSummary: '+0.04 Flesh reach',
      reachBonus: { flesh: 0.04 },
      lossCondition: 'consumable',
      flavorText: 'Dried leaves, crushed roots, and a mortar small enough to carry. The smell is medicinal.',
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
      mechanicalSummary: '+0.04 Eye reach',
      reachBonus: { eye: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'A single cracked lens in a brass tube. It magnifies, but distorts at the edges.',
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
      mechanicalSummary: '+0.07 Veil reach, +0.03 Eye reach',
      reachBonus: { veil: 0.07, eye: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Stained with substances that should not exist in nature. The inside glows faintly at dusk.',
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
      mechanicalSummary: '+0.08 Stone reach',
      reachBonus: { stone: 0.08 },
      lossCondition: 'stealable',
      flavorText: 'Engraved with the mark of a guild that no longer exists. The edge never dulls.',
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
      mechanicalSummary: '+0.10 Star reach, +0.05 Eye reach',
      reachBonus: { star: 0.10, eye: 0.05 },
      lossCondition: 'permanent',
      flavorText: 'The rings spin of their own accord. It does not measure the stars — it speaks with them.',
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
      mechanicalSummary: '+0.03 Heart reach',
      reachBonus: { heart: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'A knot of twine and feathers, blessed by a roadside saint. It smells of campfire.',
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_relics_talismans_bone_ward',
    type: 'artifact',
    name: 'Bone Ward',
    properties: {
      subcategory: 'relics_talismans',
      tier: 1,
      tags: ['#flesh', '#talisman', '#survival'],
      mechanicalSummary: '+0.04 Flesh reach',
      reachBonus: { flesh: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'Carved from a knucklebone and hung on gut string. Old magic, close to the body.',
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
      mechanicalSummary: '+0.06 Star reach, +0.03 Heart reach',
      reachBonus: { star: 0.06, heart: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'A disc of fired clay stamped with a burning eye. Warm to the touch, always.',
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
      mechanicalSummary: '+0.07 Shadow reach',
      reachBonus: { shadow: 0.07 },
      lossCondition: 'stealable',
      flavorText: 'The glass is black but not opaque. Something moves inside when no one watches.',
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
      mechanicalSummary: '+0.12 Stone reach, −0.04 Shadow reach',
      reachBonus: { stone: 0.12, shadow: -0.04 },
      lossCondition: 'permanent',
      flavorText: 'A stone pulled from a king\'s grave. It pulses like a heartbeat when pressed to earth.',
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
      mechanicalSummary: '+0.10 Heart reach, −0.05 Eye reach',
      reachBonus: { heart: 0.10, eye: -0.05 },
      lossCondition: 'cursed',
      flavorText: 'A small wooden saint that cries real tears. You feel what others feel, whether you wish to or not.',
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
      mechanicalSummary: '+0.15 Veil reach, +0.08 Star reach',
      reachBonus: { veil: 0.15, star: 0.08 },
      lossCondition: 'permanent',
      flavorText: 'A sphere of perfect obsidian that balances on any surface. Reality bends toward it.',
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
      mechanicalSummary: '+0.03 Gold reach',
      reachBonus: { gold: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'Short-legged and ill-tempered, but carries twice its weight without complaint.',
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
      mechanicalSummary: '+0.04 Eye reach',
      reachBonus: { eye: 0.04 },
      lossCondition: 'breakable',
      flavorText: 'Scarred ears and a cold nose. It finds things you did not know were lost.',
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
      mechanicalSummary: '+0.03 Stone reach',
      reachBonus: { stone: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'It eats anything. It climbs anything. It judges you constantly.',
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
      mechanicalSummary: '+0.06 Iron reach, +0.03 Eye reach',
      reachBonus: { iron: 0.06, eye: 0.03 },
      lossCondition: 'breakable',
      flavorText: 'Bred for violence and trained to silence. Its loyalty is absolute and terrifying.',
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
      mechanicalSummary: '+0.05 Gold reach, +0.03 Iron reach',
      reachBonus: { gold: 0.05, iron: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'Long-legged and wind-quick. She runs like she remembers open grassland.',
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
      mechanicalSummary: '+0.10 Iron reach, +0.05 Gold reach',
      reachBonus: { iron: 0.10, gold: 0.05 },
      lossCondition: 'permanent',
      flavorText: 'Grey as smoke and fearless in battle. It was born on a battlefield and has never left one.',
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
      mechanicalSummary: '+0.03 Flesh reach',
      reachBonus: { flesh: 0.03 },
      lossCondition: 'consumable',
      flavorText: 'It will not spoil. It will also not taste like food.',
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
      mechanicalSummary: '+0.03 Flesh reach',
      reachBonus: { flesh: 0.03 },
      lossCondition: 'consumable',
      flavorText: 'Clean water. Worth more than gold in the dry places.',
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
      mechanicalSummary: '+0.03 Stone reach',
      reachBonus: { stone: 0.03 },
      lossCondition: 'consumable',
      flavorText: 'Flint, steel, and a bundle of tinder wrapped in oilcloth. The difference between living and dying.',
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
      mechanicalSummary: '+0.04 Heart reach',
      reachBonus: { heart: 0.04 },
      lossCondition: 'consumable',
      flavorText: 'Cheap and sour, but it loosens tongues and lightens burdens.',
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
      tags: ['#potion', '#provision', '#flesh', '#healing', '#wilderness'],
      mechanicalSummary: '+0.07 Flesh reach',
      reachBonus: { flesh: 0.07 },
      lossCondition: 'consumable',
      flavorText: 'Moss, spider silk, and something bitter. Applied to wounds, it numbs and knits.',
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
      mechanicalSummary: '+0.06 Star reach, +0.03 Heart reach',
      reachBonus: { star: 0.06, heart: 0.03 },
      lossCondition: 'consumable',
      flavorText: 'When burned, the smoke forms shapes that soothe the troubled spirit.',
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
      mechanicalSummary: '+0.10 Veil reach, +0.05 Eye reach',
      reachBonus: { veil: 0.10, eye: 0.05 },
      lossCondition: 'consumable',
      flavorText: 'The liquid is perfectly clear but casts no reflection. Those who drink it see the world peeled back.',
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
      domainContributions: { iron: -0.05 },
      flavorText: 'The bone set crooked. Every swing ends in a wince.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_gashed_leg',
    type: 'trait',
    name: 'Gashed Leg',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#flesh', '#combat'],
      description: 'Deep laceration impairs movement and endurance.',
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { flesh: -0.04 },
      flavorText: 'The bandage is soaked through again. Walking is a negotiation with pain.',
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
      domainContributions: { iron: -0.04 },
      flavorText: 'Each breath is shallow. Laughter is out of the question.',
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
      domainContributions: { stone: -0.03 },
      flavorText: 'Purple and fat, the fingers refuse to close properly.',
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
      tags: ['#wound', '#physical', '#iron', '#flesh', '#combat'],
      description: 'Internal damage that risks infection and limits exertion.',
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.07, flesh: -0.05 },
      flavorText: 'The blade went deep. Something inside is not where it should be.',
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
      domainContributions: { iron: -0.08 },
      flavorText: 'The bones ground together like millstones. The shield hangs useless.',
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
      domainContributions: { eye: -0.08 },
      flavorText: 'The world is flat now. Distance is a guess, and guesses get you killed.',
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
      domainContributions: { iron: -0.12, flesh: -0.08 },
      flavorText: 'The body remembers what the spine cannot. Every step is borrowed time.',
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
      domainContributions: { star: 0.04 },
      flavorText: 'The first light of morning seems to linger on your skin longer than it should.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_healers_touch',
    type: 'trait',
    name: "Healer's Touch",
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#heart', '#flesh', '#healing'],
      description: 'Hands carry a soothing warmth that eases pain.',
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { heart: 0.03, flesh: 0.03 },
      flavorText: 'Your palms tingle. The wounded lean toward you without knowing why.',
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
      domainContributions: { gold: 0.04 },
      flavorText: 'Coins turn up in pockets. Doors left ajar swing the right way.',
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
      domainContributions: { star: 0.06, heart: 0.04 },
      flavorText: 'Blades hesitate. Arrows veer. The faithful call it grace; the skeptical call it luck.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_condition_earthblood_vigor',
    type: 'trait',
    name: 'Earthblood Vigor',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#blessing', '#stone', '#flesh', '#wilderness'],
      description: 'Vitality drawn from the land itself. Wounds close faster, muscles ache less.',
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { stone: 0.05, flesh: 0.05 },
      flavorText: 'You sleep on bare earth and wake restored. The soil knows your name.',
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
      domainContributions: { star: 0.10, eye: 0.05 },
      flavorText: 'A smear of oil that will not wash away. You see the world as a god sees it — and it is not kind.',
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
      domainContributions: { gold: -0.04 },
      flavorText: 'Things break in your hands. Deals sour. People stop meeting your eyes.',
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
      domainContributions: { heart: -0.04 },
      flavorText: 'You wake gasping. The dreams fade but the dread does not.',
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
      domainContributions: { heart: -0.07, shadow: -0.03 },
      flavorText: 'The words form but the throat closes. Some truths have been locked away.',
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
      domainContributions: { gold: -0.08, veil: -0.03 },
      flavorText: 'A scar on the palm in the shape of a coin. Wealth slips through your fingers like water.',
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
      domainContributions: { heart: -0.12, shadow: 0.05 },
      flavorText: 'You feel nothing where feeling should be. Others sense the void and flinch.',
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
      domainContributions: { flesh: -0.04 },
      flavorText: 'The shivers come and go. Sweat and chill, sweat and chill.',
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
      domainContributions: { flesh: -0.05 },
      flavorText: 'The stomach rebels against everything, including emptiness.',
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
      domainContributions: { flesh: -0.08, heart: -0.04 },
      flavorText: 'The skin turns grey and stiff at the edges. People step back when they see it.',
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
      domainContributions: { flesh: -0.12, veil: 0.05 },
      flavorText: 'The body withers but the eyes brighten. Something feeds on the difference.',
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
      domainContributions: { veil: 0.03, eye: 0.03 },
      flavorText: 'Colors seem too vivid. Time moves strangely at the edges of the day.',
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
      domainContributions: { shadow: 0.06, eye: 0.04, heart: -0.04 },
      flavorText: 'Crows follow you. The dying look at you with recognition.',
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
      domainContributions: { star: 0.08, shadow: 0.05, heart: -0.08 },
      flavorText: 'The air shimmers where you stand. Small animals will not approach. Gods pay attention.',
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
      domainContributions: { stone: 0.04 },
      flavorText: 'Tinder catches at your touch. You have not felt cold since the gift was given.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_beast_tongue',
    type: 'trait',
    name: 'Beast-Tongue',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#heart', '#flesh', '#wilderness'],
      description: 'Animals understand your intent, if not your words.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { heart: 0.04 },
      flavorText: 'Horses calm at your voice. Wolves turn aside. You are kin to things that do not speak.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_iron_gut',
    type: 'trait',
    name: 'Iron Gut',
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#bestowed', '#flesh', '#survival', '#wilderness'],
      description: 'Immunity to common poisons and spoiled food.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { flesh: 0.05 },
      flavorText: 'You eat what would kill others and suffer nothing but a sour taste.',
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
      domainContributions: { eye: 0.05 },
      flavorText: 'The dark is merely dim. Your pupils are wider than they should be.',
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
      domainContributions: { eye: 0.07, veil: 0.03 },
      flavorText: 'The world peels back its skin for those who dare to look.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'reward_bestowed_bloodward',
    type: 'trait',
    name: 'Bloodward',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#bestowed', '#flesh', '#iron', '#combat', '#healing'],
      description: 'Wounds close faster than nature allows. Scars form in hours.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { flesh: 0.08, iron: 0.03 },
      flavorText: 'The blood knows what to do. Cut the skin and watch it knit like thread drawn tight.',
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
      domainContributions: { shadow: 0.06, heart: 0.04 },
      flavorText: 'The dead speak softly, but they never stop. You learn to listen selectively.',
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
      domainContributions: { star: 0.10, stone: 0.05 },
      flavorText: 'Thunder follows your anger. Rain follows your grief. The sky has learned your moods.',
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
      domainContributions: { veil: 0.10, shadow: 0.05 },
      flavorText: 'The wall is there, and then it is not. You pass through the space where it chose not to be.',
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
      tags: ['#bestowed', '#star', '#flesh', '#divine', '#ancient'],
      description: 'A spark of divine fire burns within. Death is delayed, not prevented.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { star: 0.12, flesh: 0.08 },
      flavorText: 'You burned once and did not die. The fire lives inside now, patient and eternal. It will outlast you.',
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
      mechanicalSummary: '+0.03 Shadow reach, grants ruin_seeker (consumed on discovery)',
      reachBonus: { shadow: 0.03 },
      lossCondition: 'consumable',
      grantsTraitWhileHeld: 'ruin_seeker',
      grantedTraitLevel: 1,
      consumeOnEvent: 'hidden_site_discovered',
      flavorText: 'Stained with sea-salt and cheap wine. The cross marks a cache beneath old foundations.',
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
