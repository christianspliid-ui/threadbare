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
import type { PossessionNodeProperties } from '../types/attachments';
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
      mechanicalSummary: '+0.05 Iron roll · Iron capability +0.3 while borne, rescues near-miss combat rolls (+1 step, within 1 margin)',
      censusTag: { scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'A well-worn blade of folded steel, simple and reliable.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.05 },
        { type: 'test_shaper', reach: 'iron', trigger: 'near_miss', steps: 1, maxMargin: 1 },
        // THR-718: a reliable blade lifts Iron capability a little. Minor band, low
        // end — it already shapes rolls via the passive + test_shaper above.
        { type: 'stat_contribution', contributions: { iron: 0.3 } },
        // THR-719: ported from the retired `onUseTriggers` block. `critical_failure`
        // → the critical-failure band; `remove_possession` → `self_remove`.
        {
          type: 'action_trigger',
          on: 'encounter_critical_failure',
          payload: { kind: 'self_remove' },
          probability: 0.25,
          cooldownTicks: 0,
          narrativeTemplate: '{item_name} snaps against the blow.',
        },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'starter_ashenmane_fang',
    type: 'artifact_legendary',
    name: "Ashenmane's Fang",
    properties: {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon', '#legendary_beast'],
      mechanicalSummary: '+0.08 Iron roll · Iron capability +0.6 while borne, +0.04 Iron in combat (beast fury), grants intimidate trait',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText:
        'Pulled from the jaw of the beast that terrorized the Ashen Vale for three generations.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.04 },
        // THR-722: migrated off the dead `possesses`-edge `grants[]` property.
        { type: 'trait_grant', grantedTrait: 'intimidate' },
        // THR-718: a named legendary fang is a real step up in martial might.
        // Notable band (tier 2 legendary), low-mid — it already shapes rolls hard.
        { type: 'stat_contribution', contributions: { iron: 0.6 } },
      ],
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
      mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack carrier)',
      censusTag: { scale: 'local' },
      lossCondition: 'stealable',
      flavorText: 'A stubborn creature with strong legs and stronger opinions.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.03 },
        { type: 'range_modifier', movementCostMultiplier: 0.9 },
      ],
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
      mechanicalSummary:
        '20% reduced movement cost, grants cavalry_charge and rapid_retreat traits',
      censusTag: { reach: 'star', scale: 'local' },
      lossCondition: 'breakable',
      flavorText:
        'Bred in the western reaches, these horses run until their hearts give out.',
      effects: [
        { type: 'range_modifier', movementCostMultiplier: 0.8 },
        { type: 'trait_grant', grantedTrait: 'cavalry_charge' },
        // THR-722: migrated off the dead `possesses`-edge `grants[]` property.
        { type: 'trait_grant', grantedTrait: 'rapid_retreat' },
      ],
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
      mechanicalSummary: '10% reduced movement cost, blocks cold conditions',
      censusTag: { reach: 'star', scale: 'local' },
      lossCondition: 'breakable',
      flavorText: 'Dyed with muddy hues, designed to shed rain as much as attention.',
      effects: [
        { type: 'range_modifier', movementCostMultiplier: 0.9 },
        { type: 'tag_immunity', tags: ['cold', 'frostbite'] },
      ],
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
      mechanicalSummary: '+0.03 Iron, decays -0.003/tick to 0 (rations consumed)',
      censusTag: { scale: 'local' },
      lossCondition: 'consumable',
      flavorText: 'Dried meat, hard bread, and a waterskin. Simple sustenance for the road.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: 0.03, changePerTick: -0.003, limitValue: 0, destroyAtLimit: true },
      ],
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
      mechanicalSummary: '+0.08 Eye roll · Eye capability +0.7 / Heart −0.3 while borne, reveals attachments within 2 hexes, when cursed: -0.03 Heart for 6 ticks (12-tick cd)',
      censusTag: { scale: 'regional' },
      lossCondition: 'cursed',
      flavorText: 'It sees what you cannot. It shows what you must not know.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'passive', reach: 'heart', value: -0.04 },
        { type: 'reveal', target: 'attachments', range: 2 },
        // THR-718: the Eye sharpens perception (Eye) at the cost of the bearer's
        // warmth (Heart). Notable band (tier 3 relic); the Heart penalty is the
        // curse made mechanical.
        { type: 'stat_contribution', contributions: { eye: 0.7, heart: -0.3 } },
        { type: 'reactive', trigger: 'cursed', effect: {
          type: 'duration', ticks: 6, reach: 'heart', value: -0.03, destroyOnExpiry: true
        }, cooldown: 12 },
        // THR-719: ported from the retired `onUseTriggers` block. `any_use` →
        // `action_complete`; the inline `modifiers: { heart: -0.05 }` became a real
        // condition node (`starter_drained_resolve`) — conditions are graph nodes
        // here, not property bags. cooldownTicks:0 preserves the legacy semantic
        // that every use rolls independently.
        {
          type: 'action_trigger',
          on: 'action_complete',
          payload: { kind: 'condition_grant', conditionTraitId: 'starter_drained_resolve', durationTicks: 10 },
          probability: 0.15,
          cooldownTicks: 0,
          narrativeTemplate: "The Eye drinks deep of {actor}'s resolve.",
        },
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
      mechanicalSummary: '+0.06 Star roll · Star capability +0.6 while borne, +0.03 Eye in exploration (fragment research), on first use: revelation condition',
      censusTag: { scale: 'local' },
      lossCondition: 'permanent',
      flavorText: 'Half the pages are ash. The rest are worse.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.06 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 },
        // THR-718: a surviving codex of arcane lore raises Star capability. Notable
        // band (tier 2 tome), mid — knowledge is its whole purpose.
        { type: 'stat_contribution', contributions: { star: 0.6 } },
        // THR-719: ported from the retired `onUseTriggers` block. `first_use` →
        // `action_complete` + `maxFires: 1`. The inline `{ star: 0.15 }` modifier is
        // exactly the shipped `starter_revelation` condition node, so it binds there
        // rather than minting a duplicate.
        {
          type: 'action_trigger',
          on: 'action_complete',
          payload: { kind: 'condition_grant', conditionTraitId: 'starter_revelation', durationTicks: 20 },
          maxFires: 1,
          narrativeTemplate:
            "The pages of the Burned Codex whisper truths that burn behind {actor}'s eyes.",
        },
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
      mechanicalSummary: '-0.03 Iron (decays fast, gone in ~12 ticks), -0.02 Iron extra in combat',
      flavorText: 'Every breath is a reminder of the blow you survived.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.02 },
      ],
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
      tags: ['#disease', '#iron', '#contagious'],
      description: 'The sickness spreads from contact, patient zero unknown.',
      importance: 0,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: {},
      mechanicalSummary: '-0.10 Iron (decays slowly, ~40 ticks to clear), -0.3 cooperation bias (contagion avoidance), when damaged: -0.03 Iron for 6 ticks',
      flavorText: 'A fever that never quite breaks. Others wisely keep their distance.',
      effects: [
        { type: 'decay', reach: 'iron', startValue: -0.10, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
        { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
        { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
      ],
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
      importance: 0,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: {},
      mechanicalSummary: '+0.10 Star (fades slowly, ~40 ticks), +0.03 Star in mystical encounters',
      flavorText: 'Golden light seems to follow you, however briefly.',
      effects: [
        { type: 'decay', reach: 'star', startValue: 0.10, changePerTick: -0.0025, limitValue: 0, destroyAtLimit: true },
        { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.03 },
      ],
    } as TraitDefinitionProperties,
  },

  // ─── Curses ─────────────────────────────────────────────────────────
  {
    // THR-719: minted for the Whispering Eye's on-use drain, whose legacy trigger
    // carried an inline `{ heart: -0.05 }` modifier bag. Conditions are graph nodes
    // in this engine, so the drain gets a real node instead of an ad-hoc property.
    id: 'starter_drained_resolve',
    type: 'trait',
    name: 'Drained Resolve',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#curse', '#heart', '#supernatural'],
      description: 'Something took a swallow of your nerve and did not give it back.',
      importance: 0,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: {},
      mechanicalSummary: '-0.05 Heart while it lasts (~10 ticks)',
      flavorText: 'The warmth goes out of your voice before the words do.',
      effects: [
        { type: 'passive', reach: 'heart', value: -0.05 },
      ],
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
      importance: 0,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: {},
      mechanicalSummary: '+0.15 Star, +0.10 Eye [EXCEEDS CAP: legacy values preserved], drifts toward ruthlessness, 1.5x desire for Eye encounters (knowledge craving)',
      flavorText: 'The mind is expanded, the heart is diminished.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.15 },
        { type: 'passive', reach: 'eye', value: 0.10 },
        { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.002, limitValue: 0.3 },
        { type: 'behavior_weight', reach: 'eye', multiplier: 1.5 },
      ],
    } as TraitDefinitionProperties,
  },
];
