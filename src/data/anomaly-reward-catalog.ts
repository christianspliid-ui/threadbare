/**
 * Anomaly Reward Catalog — Signature artifacts, bestowed traits, and conditions
 * granted as rewards from anomaly discovery encounters.
 *
 * Each anomaly type has exactly 1 unique signature artifact. Bestowed powers and
 * conditions are shared across anomaly types via tag matching.
 *
 * Reward flow:
 *   - Success: rare resource seeded on location (handled in worldSeed)
 *   - Critical success: resource + ONE item from this catalog (artifact/trait/condition)
 *
 * NFP #1: All reach bonuses and probabilities are named values.
 * NFP #5: Every item has flavor text grounded in the anomaly narrative.
 *
 * Upgraded 2026-04-06: Migrated reachBonus/domainContributions to composable effects[].
 * Pipeline: content-catalog-manager/upgrade-anomaly-rewards
 */

import type { GraphNode } from '../types/graph';
import type { PossessionNodeProperties, OnUseTrigger } from '../types/attachments';
import type { TraitDefinitionProperties } from '../types/traits';

// ═══════════════════════════════════════════════════════════════════════
// ANOMALY_SIGNATURE_ARTIFACTS — 1 per anomaly type (10 total)
// ═══════════════════════════════════════════════════════════════════════

export const ANOMALY_SIGNATURE_ARTIFACTS: GraphNode[] = [
  // gem_deposit → Uncut Ruby
  {
    id: 'anomaly_uncut_ruby',
    type: 'artifact',
    name: 'Uncut Ruby',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#gem', '#wealth', '#anomaly'],
      mechanicalSummary: '+0.10 Gold, +0.05 Gold while trading, 1.3x desire for Gold encounters',
      lossCondition: 'stealable',
      flavorText: 'A stone the size of a fist, still warm from the earth. Its facets catch light that isn\'t there.',
      effects: [
        { type: 'passive', reach: 'gold', value: 0.10 },
        { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.05 },
        { type: 'behavior_weight', reach: 'gold', multiplier: 1.3 },
      ],
    } as PossessionNodeProperties,
  },
  // crystal_cavern → Resonance Shard
  {
    id: 'anomaly_resonance_shard',
    type: 'artifact',
    name: 'Resonance Shard',
    properties: {
      subcategory: 'relics_talismans',
      tier: 3,
      tags: ['#crystal', '#arcane', '#anomaly'],
      mechanicalSummary: '+0.10 Veil, +0.05 Eye, +0.05 Veil in mystical contexts, shifts near-miss to success on Veil tests',
      lossCondition: 'breakable',
      flavorText: 'A finger-length crystal that hums when magic is near. Hold it too long and your teeth ache.',
      onUseTriggers: [
        {
          triggerCondition: 'any_use',
          probability: 0.10,
          effect: {
            type: 'add_condition',
            targetId: 'anomaly_crystal_headache',
            ticksRemaining: 15,
          },
          narrativeTemplate: 'The {item_name} pulses with dissonant harmonics. {actor}\'s vision blurs.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'passive', reach: 'veil', value: 0.10 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.05 },
        { type: 'test_shaper', reach: 'veil', trigger: 'near_miss', steps: 1 },
      ],
    } as PossessionNodeProperties,
  },
  // golden_grove → Amber Phial
  {
    id: 'anomaly_amber_phial',
    type: 'artifact',
    name: 'Amber Phial',
    properties: {
      subcategory: 'provisions',
      tier: 2,
      tags: ['#nature', '#healing', '#anomaly'],
      mechanicalSummary: '+0.05 Heart, 3 charges of +0.06 Heart burst (golden sap doses)',
      lossCondition: 'consumable',
      flavorText: 'Thick golden sap in a sealed clay vessel. One dose — warm, sweet, and potent enough to mend what should not mend.',
      onUseTriggers: [
        {
          triggerCondition: 'first_use',
          probability: 1.0,
          effect: {
            type: 'remove_condition',
            tags: ['#wound'],
          },
          narrativeTemplate: 'The golden sap burns going down, but the {actor}\'s wounds close like flowers at dusk.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'passive', reach: 'heart', value: 0.05 },
        { type: 'consumable_charge', charges: 3, onUse: { reach: 'heart', value: 0.06 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  // herb_garden → Herb Bundle
  {
    id: 'anomaly_herb_bundle',
    type: 'artifact',
    name: 'Herb Bundle',
    properties: {
      subcategory: 'provisions',
      tier: 1,
      tags: ['#herb', '#healing', '#anomaly'],
      mechanicalSummary: '+0.02 Heart in wilderness, 2 charges of +0.04 Heart burst',
      lossCondition: 'consumable',
      flavorText: 'Carefully dried rare medicinal plants, bound with twine. The scent alone eases pain.',
      onUseTriggers: [
        {
          triggerCondition: 'first_use',
          probability: 1.0,
          effect: {
            type: 'remove_condition',
            tags: ['#wound'],
          },
          narrativeTemplate: 'The herbs dissolve into a bitter tea. {actor}\'s breathing eases, and the wound fades to scar.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'conditional', condition: 'in_wilderness', reach: 'heart', value: 0.02 },
        { type: 'consumable_charge', charges: 2, onUse: { reach: 'heart', value: 0.04 }, destroyOnEmpty: true },
      ],
    } as PossessionNodeProperties,
  },
  // ancient_vault → Sealed Codex
  {
    id: 'anomaly_sealed_codex',
    type: 'artifact',
    name: 'Sealed Codex',
    properties: {
      subcategory: 'tomes_scrolls',
      tier: 3,
      tags: ['#ancient', '#relic', '#anomaly'],
      mechanicalSummary: '+0.10 Eye, +0.05 Star, +0.01 Eye per social success (max +0.05)',
      lossCondition: 'permanent',
      flavorText: 'Warded pages from before the fall — knowledge sealed in metal bindings that took centuries to corrode. The script is alien, but comprehensible.',
      onUseTriggers: [
        {
          triggerCondition: 'first_use',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            targetId: 'anomaly_vault_scholar',
            ticksRemaining: null, // permanent bestowed power
          },
          narrativeTemplate: 'The Codex opens and {actor}\'s mind fills with knowledge from a world that fell. Not all of it is comfortable.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'passive', reach: 'eye', value: 0.10 },
        { type: 'passive', reach: 'star', value: 0.05 },
        { type: 'stacking', reach: 'eye', valuePerStack: 0.01, maxStacks: 5, stackOn: 'social_success' },
      ],
    } as PossessionNodeProperties,
  },
  // sunken_treasury → Corroded Crown
  {
    id: 'anomaly_corroded_crown',
    type: 'artifact',
    name: 'Corroded Crown',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#gold', '#cursed', '#anomaly'],
      mechanicalSummary: '+0.10 Gold, +0.05 Gold / -0.03 Heart (drowned king\'s price)',
      lossCondition: 'cursed',
      flavorText: 'A barnacled circlet from a drowned treasury. The dead king it belonged to is not entirely gone.',
      onUseTriggers: [
        {
          triggerCondition: 'any_use',
          probability: 0.15,
          effect: {
            type: 'add_condition',
            targetId: 'anomaly_vault_curse',
            ticksRemaining: 25,
          },
          narrativeTemplate: 'The {item_name} grows cold against {actor}\'s brow. Something in the water remembers its owner.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'passive', reach: 'gold', value: 0.10 },
        { type: 'tradeoff', bonus: { reach: 'gold', value: 0.05 }, penalty: { reach: 'heart', value: 0.03 } },
      ],
    } as PossessionNodeProperties,
  },
  // fossil_bed → Fossilized Eye
  {
    id: 'anomaly_fossilized_eye',
    type: 'artifact',
    name: 'Fossilized Eye',
    properties: {
      subcategory: 'relics_talismans',
      tier: 2,
      tags: ['#ancient', '#bone', '#anomaly'],
      mechanicalSummary: '+0.05 Eye, +0.03 Veil, +1 awareness range',
      lossCondition: 'permanent',
      flavorText: 'An ancient creature\'s eye, perfectly preserved in amber. It watches back. It always watches back.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as PossessionNodeProperties,
  },
  // iron_seep → Star Metal Shard
  {
    id: 'anomaly_star_metal_shard',
    type: 'artifact',
    name: 'Star Metal Shard',
    properties: {
      subcategory: 'arms',
      tier: 3,
      tags: ['#star_metal', '#fate', '#anomaly'],
      mechanicalSummary: '+0.08 Iron, +0.05 Star, active 6 ticks / dormant 12 ticks: +0.05 Iron (star alignment)',
      lossCondition: 'permanent',
      flavorText: 'Dense, dark metal from a fallen star. It is colder than iron, harder than steel, and the air around it tastes of distant places.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.08 },
        { type: 'passive', reach: 'star', value: 0.05 },
        { type: 'cooldown', activeTicks: 6, cooldownTicks: 12, reach: 'iron', value: 0.05 },
      ],
    } as PossessionNodeProperties,
  },
  // pearl_shoal → Moonpearl Strand
  {
    id: 'anomaly_moonpearl_strand',
    type: 'artifact',
    name: 'Moonpearl Strand',
    properties: {
      subcategory: 'vestments',
      tier: 2,
      tags: ['#pearl', '#devotion', '#anomaly'],
      mechanicalSummary: '+0.08 Heart, +0.05 Heart in social contexts, cooperates more readily with allies',
      lossCondition: 'permanent',
      flavorText: 'A string of flawless pearls, moon-white and warm to the touch. Folk say they calm the sea and soothe the restless dead.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.08 },
        { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.05 },
        { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.15 },
      ],
    } as PossessionNodeProperties,
  },
  // glowcap_hollow → Spore Lantern
  {
    id: 'anomaly_spore_lantern',
    type: 'artifact',
    name: 'Spore Lantern',
    properties: {
      subcategory: 'tools_instruments',
      tier: 2,
      tags: ['#fungus', '#vision', '#anomaly'],
      mechanicalSummary: '+0.05 Eye, +0.05 Eye in exploration, +0.02 Veil / -0.02 Heart (spore haze)',
      lossCondition: 'permanent',
      flavorText: 'Glowcap spores sealed in a glass jar. It illuminates and hallucinates in equal measure. Handle with care.',
      onUseTriggers: [
        {
          triggerCondition: 'any_use',
          probability: 0.20,
          effect: {
            type: 'add_condition',
            targetId: 'anomaly_spore_visions',
            ticksRemaining: 20,
          },
          narrativeTemplate: 'The {item_name}\'s glow brightens. {actor}\'s vision fractures into colours that have no name.',
        } as OnUseTrigger,
      ],
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.05 },
        { type: 'tradeoff', bonus: { reach: 'veil', value: 0.02 }, penalty: { reach: 'heart', value: 0.02 } },
      ],
    } as PossessionNodeProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// ANOMALY_BESTOWED_POWERS — Permanent traits from critical discovery (8)
// ═══════════════════════════════════════════════════════════════════════

export const ANOMALY_BESTOWED_POWERS: GraphNode[] = [
  {
    id: 'anomaly_prospectors_eye',
    type: 'trait',
    name: "Prospector's Eye",
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#gem', '#wealth', '#anomaly'],
      description: 'Trained by the gleaming vein — sees mineral deposits others walk past.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.6,
      flavorText: 'The earth has shown them its secret face. They will never look at stone the same way.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.05 },
        { type: 'behavior_weight', reach: 'gold', multiplier: 1.2 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_crystal_attunement',
    type: 'trait',
    name: 'Crystal Attunement',
    properties: {
      subcategory: 'bestowed',
      tier: 3,
      tags: ['#crystal', '#arcane', '#anomaly'],
      description: 'The singing dark left its mark — heightened magical sensitivity.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.7,
      flavorText: 'The cavern\'s resonance lingers in their bones. They hear magic before they see it.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.08 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.05 },
        { type: 'tag_immunity', tags: ['#dissonance'] },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_sap_blessed',
    type: 'trait',
    name: 'Sap-Blessed',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#nature', '#healing', '#anomaly'],
      description: 'The golden trees accepted them — plants respond more readily.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.5,
      flavorText: 'There is golden light in their touch. Growing things lean toward them, and wounds close more easily in their presence.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.05 },
        { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.04 },
        { type: 'prevent_loss', channel: 'condition', tags: ['#wound'], consumeOnPrevent: false },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_herbalists_knowledge',
    type: 'trait',
    name: "Herbalist's Knowledge",
    properties: {
      subcategory: 'bestowed',
      tier: 1,
      tags: ['#healing', '#herb', '#anomaly'],
      description: 'Deep understanding of wild medicine — recognizes cures in common weeds.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.4,
      flavorText: 'What others call weeds, they call a pharmacy. The wild apothecary taught them well.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'conditional', condition: 'in_wilderness', reach: 'eye', value: 0.04 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_vault_scholar',
    type: 'trait',
    name: 'Vault Scholar',
    properties: {
      subcategory: 'bestowed',
      tier: 3,
      tags: ['#ancient', '#relic', '#anomaly'],
      description: 'Knowledge gleaned from pre-collapse artifacts — sees patterns in the past.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.7,
      flavorText: 'The sealed chamber opened their mind. They read the old script as if born to it, and the past speaks clearly.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.08 },
        { type: 'passive', reach: 'stone', value: 0.05 },
        { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.04 },
        { type: 'trait_grant', grantedTrait: 'ancient_reader' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_tide_reader',
    type: 'trait',
    name: 'Tide Reader',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#pearl', '#navigation', '#anomaly'],
      description: 'Reads water patterns with uncanny accuracy — navigates by current and tide.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.5,
      flavorText: 'The sea whispered its rhythms, and they listened. They know when the waters will part before the waters do.',
      effects: [
        { type: 'passive', reach: 'star', value: 0.08 },
        { type: 'conditional', condition: 'near_water', reach: 'star', value: 0.06 },
        { type: 'range_modifier', movementCostMultiplier: 0.9 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_spore_touched',
    type: 'trait',
    name: 'Spore-Touched',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#fungus', '#vision', '#anomaly'],
      description: 'Brief spore exposure opened perception — sees things others cannot.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.6,
      flavorText: 'The dreaming light left traces in their sight. In deep shadow, they see colours no one else sees.',
      effects: [
        { type: 'passive', reach: 'veil', value: 0.05 },
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'tradeoff', bonus: { reach: 'veil', value: 0.04 }, penalty: { reach: 'heart', value: 0.02 } },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_ironblood',
    type: 'trait',
    name: 'Ironblood',
    properties: {
      subcategory: 'bestowed',
      tier: 2,
      tags: ['#star_metal', '#fate', '#anomaly'],
      description: 'Star metal in the blood — the body remembers the sky.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.6,
      flavorText: 'They drank the red water that flowed from the fallen star. Their blood runs darker now, and heavier, and it does not fear steel.',
      effects: [
        { type: 'passive', reach: 'iron', value: 0.05 },
        { type: 'passive', reach: 'star', value: 0.05 },
        { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.05 },
      ],
    } as TraitDefinitionProperties,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// ANOMALY_CONDITIONS — Temporary mixed-blessing traits (6)
// ═══════════════════════════════════════════════════════════════════════

export const ANOMALY_CONDITIONS: GraphNode[] = [
  {
    id: 'anomaly_crystal_headache',
    type: 'trait',
    name: 'Crystal Headache',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#crystal', '#pain', '#anomaly'],
      description: 'The resonance was overwhelming — lingering disorientation.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.3,
      flavorText: 'The singing of the crystals follows them. Every thought echoes twice.',
      effects: [
        { type: 'passive', reach: 'eye', value: -0.05 },
        { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: -0.04 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_golden_euphoria',
    type: 'trait',
    name: 'Golden Euphoria',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#nature', '#blessing', '#anomaly'],
      description: 'The sap\'s perfume induces blissful calm — impairs combat readiness.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.3,
      flavorText: 'Everything is warm and golden and slow. The urgency of the world seems very far away.',
      effects: [
        { type: 'passive', reach: 'heart', value: 0.08 },
        { type: 'passive', reach: 'iron', value: -0.06 },
        { type: 'social_modifier', targetFilter: 'any', cooperationBias: 0.1 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_vault_curse',
    type: 'trait',
    name: 'Vault Curse',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#ancient', '#cursed', '#anomaly'],
      description: 'The ancient wards exact a toll — fate turns against the intruder.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.5,
      flavorText: 'Things go wrong around them. Small things first — a dropped tool, a missed step. Then larger things.',
      effects: [
        { type: 'passive', reach: 'star', value: -0.08 },
        { type: 'stacking', reach: 'star', valuePerStack: -0.01, maxStacks: 5, stackOn: 'any_encounter' },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_brine_lungs',
    type: 'trait',
    name: 'Brine Lungs',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#underwater', '#wound', '#anomaly'],
      description: 'Swallowed too much salt water — temporarily weakened.',
      maxLevel: 1,
      visibility: 'public',
      importance: 0.2,
      flavorText: 'Every breath rattles. The salt is in their lungs and will take days to clear.',
      effects: [
        { type: 'passive', reach: 'iron', value: -0.06 },
        { type: 'range_modifier', movementCostMultiplier: 1.2 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_spore_visions',
    type: 'trait',
    name: 'Spore Visions',
    properties: {
      subcategory: 'condition',
      tier: 2,
      tags: ['#fungus', '#vision', '#anomaly'],
      description: 'Inhaled spores — vivid visions but social withdrawal.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.4,
      flavorText: 'They see things — patterns in the dark, faces in the grain of wood, futures in the fall of leaves. But they cannot explain what they see, and they have stopped trying.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.10 },
        { type: 'passive', reach: 'heart', value: -0.08 },
        { type: 'range_modifier', awarenessRangeBonus: 1 },
      ],
    } as TraitDefinitionProperties,
  },
  {
    id: 'anomaly_fossil_whispers',
    type: 'trait',
    name: 'Fossil Whispers',
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#ancient', '#time', '#anomaly'],
      description: 'The old bones murmur fragments of lost knowledge.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0.3,
      flavorText: 'At night, when the world is still, they hear voices in a language no one has spoken for ten thousand years. They are beginning to understand.',
      effects: [
        { type: 'passive', reach: 'eye', value: 0.05 },
        { type: 'passive', reach: 'veil', value: 0.03 },
        { type: 'axiological_drift', axis: 'caution_curiosity', ratePerTick: 0.005, limitValue: 0.3 },
      ],
    } as TraitDefinitionProperties,
  },
];
