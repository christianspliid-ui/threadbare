/**
 * Starter Attachments Content Package — Exercise all attachment features.
 *
 * This package exports graph-node-shaped objects (artifact and trait definitions)
 * that exercise all features of the attachment system: multiple possession subcategories,
 * all loss conditions, tier 1–3, on-use triggers (breakage, drain, revelation), and
 * conditions across wound/disease/blessing categories.
 *
 * Each can be loaded via graph.addNode().
 *
 * Design doc: Docs/plans/2026-03-10-attachment-system-design.md
 */

import type { GraphNode } from '../types/graph';
import type { PossessionNodeProperties, OnUseTrigger } from '../types/attachments';
import type { TraitDefinitionProperties } from '../types/traits';

// ═══════════════════════════════════════════════════════════════════════
// STARTER_POSSESSIONS — Artifact nodes
// ═══════════════════════════════════════════════════════════════════════

export const STARTER_POSSESSIONS: GraphNode[] = [
  // ─── Arms (Melee/Ranged Weapons) ───────────────────────────────────
  {
    id: 'starter_iron_blade',
    type: 'artifact',
    name: 'Iron Blade',
    properties: {
      subcategory: 'arms',
      tier: 1,
      tags: ['#iron', '#weapon', '#melee'],
      mechanicalSummary: '+0.10 Iron reach',
      reachBonus: { iron: 0.05 },
      lossCondition: 'breakable',
      flavorText: 'A well-worn blade of folded steel, simple and reliable.',
      onUseTriggers: [
        {
          triggerCondition: 'critical_failure',
          probability: 0.25,
          effect: {
            type: 'remove_possession',
          },
          narrativeTemplate: '{item_name} snaps against the blow.',
        } as OnUseTrigger,
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'starter_ashenmane_fang',
    type: 'artifact',
    name: "Ashenmane's Fang",
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#legendary_beast'],
      mechanicalSummary: '+0.15 Iron, +0.05 Fang reach',
      reachBonus: { iron: 0.08 },
      lossCondition: 'permanent',
      flavorText:
        'Pulled from the jaw of the beast that terrorized the Ashen Vale for three generations.',
    } as PossessionNodeProperties,
  },

  // ─── Mounts & Beasts ───────────────────────────────────────────────
  {
    id: 'starter_road_worn_mule',
    type: 'artifact',
    name: 'Road-Worn Mule',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#mount', '#travel'],
      mechanicalSummary: '+movement_speed',
      reachBonus: { gold: 0.03 },
      lossCondition: 'stealable',
      flavorText: 'A stubborn creature with strong legs and stronger opinions.',
    } as PossessionNodeProperties,
  },
  {
    id: 'starter_ashenmane_horse',
    type: 'artifact',
    name: 'Ashenmane Horse',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 2,
      tags: ['#beast', '#mount', '#cavalry'],
      mechanicalSummary: '+movement_speed, grants cavalry_charge',
      lossCondition: 'breakable',
      flavorText:
        'Bred in the western reaches, these horses run until their hearts give out.',
    } as PossessionNodeProperties,
  },

  // ─── Vestments (Armor/Clothing) ────────────────────────────────────
  {
    id: 'starter_traveler_cloak',
    type: 'artifact',
    name: "Traveler's Cloak",
    properties: {
      subcategory: 'vestments',
      tier: 1,
      tags: ['#cloth', '#travel', '#weather'],
      mechanicalSummary: '+weather_resistance',
      lossCondition: 'breakable',
      flavorText: 'Dyed with muddy hues, designed to shed rain as much as attention.',
    } as PossessionNodeProperties,
  },

  // ─── Provisions (Food/Supplies) ────────────────────────────────────
  {
    id: 'starter_copper_market_rations',
    type: 'artifact',
    name: 'Copper Market Rations',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#food', '#consumable', '#travel'],
      mechanicalSummary: '+movement for 3 ticks',
      lossCondition: 'consumable',
      flavorText: 'Dried meat, hard bread, and a waterskin. Simple sustenance for the road.',
    } as PossessionNodeProperties,
  },

  // ─── Relics & Talismans ────────────────────────────────────────────
  {
    id: 'starter_whispering_eye',
    type: 'artifact',
    name: 'The Whispering Eye',
    properties: {
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#eye', '#cursed', '#supernatural'],
      mechanicalSummary: '+0.20 Eye reach, −0.10 Heart reach',
      reachBonus: { eye: 0.08, heart: -0.04 },
      lossCondition: 'cursed',
      flavorText: 'It sees what you cannot. It shows what you must not know.',
      onUseTriggers: [
        {
          triggerCondition: 'any_use',
          probability: 0.15,
          effect: {
            type: 'add_condition',
            modifiers: { heart: -0.05 },
            ticksRemaining: 10,
          },
          narrativeTemplate:
            "The Eye drinks deep of {actor}'s resolve.",
        } as OnUseTrigger,
      ],
    } as PossessionNodeProperties,
  },

  // ─── Tomes & Scrolls ───────────────────────────────────────────────
  {
    id: 'starter_burned_codex',
    type: 'artifact',
    name: 'Burned Codex',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 2,
      tags: ['#star', '#tome', '#knowledge'],
      mechanicalSummary: '+0.10 Star reach, grants dark_knowledge',
      lossCondition: 'permanent',
      flavorText: 'Half the pages are ash. The rest are worse.',
      onUseTriggers: [
        {
          triggerCondition: 'first_use',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            tags: ['#revelation'],
            modifiers: { star: 0.15 },
            ticksRemaining: 20,
          },
          narrativeTemplate:
            "The pages of the Burned Codex whisper truths that burn behind {actor}'s eyes.",
        } as OnUseTrigger,
      ],
    } as PossessionNodeProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// STARTER_CONDITIONS — Trait nodes (wound, disease, blessing)
// ═══════════════════════════════════════════════════════════════════════

export const STARTER_CONDITIONS: GraphNode[] = [
  // ─── Wounds ─────────────────────────────────────────────────────────
  {
    id: 'starter_bruised_ribs',
    type: 'trait',
    name: 'Bruised Ribs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#wound', '#physical', '#iron'],
      description: 'Cracked bones protest every swing.',
      maxLevel: 1,
      visibility: 'public',
      domainContributions: {},
      flavorText: 'Every breath is a reminder of the blow you survived.',
    } as TraitDefinitionProperties,
  },

  // ─── Diseases ───────────────────────────────────────────────────────
  {
    id: 'starter_plague_touched',
    type: 'trait',
    name: 'Plague-Touched',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#disease', '#flesh', '#contagious'],
      description: 'The sickness spreads from contact, patient zero unknown.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { flesh: -0.10 },
      flavorText: 'A fever that never quite breaks. Others wisely keep their distance.',
    } as TraitDefinitionProperties,
  },

  // ─── Blessings ──────────────────────────────────────────────────────
  {
    id: 'starter_sun_touched',
    type: 'trait',
    name: 'Sun-Touched',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#blessing', '#star', '#divine'],
      description: "The warmth of a god's gaze lingers on the skin.",
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { star: 0.10 },
      flavorText: 'Golden light seems to follow you, however briefly.',
    } as TraitDefinitionProperties,
  },

  // ─── Supernatural Condition ─────────────────────────────────────────
  {
    id: 'starter_revelation',
    type: 'trait',
    name: 'Revelation',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#magical', '#star', '#knowledge'],
      description: 'Forbidden knowledge burns behind the eyes, impossible to unlearn.',
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { star: 0.15, eye: 0.10 },
      flavorText: 'The mind is expanded, the heart is diminished.',
    } as TraitDefinitionProperties,
  },
];
