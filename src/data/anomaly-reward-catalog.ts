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
      mechanicalSummary: '+0.15 Gold reach',
      reachBonus: { gold: 0.15 },
      lossCondition: 'stealable',
      flavorText: 'A stone the size of a fist, still warm from the earth. Its facets catch light that isn\'t there.',
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
      mechanicalSummary: '+0.20 Veil reach, +0.10 Eye reach',
      reachBonus: { veil: 0.20, eye: 0.10 },
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
      mechanicalSummary: '+0.10 Heart reach. First use: remove 1 wound.',
      reachBonus: { heart: 0.10 },
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
      mechanicalSummary: 'First use: remove 1 wound.',
      reachBonus: {},
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
      mechanicalSummary: '+0.20 Eye reach, +0.10 Star reach. First use: grant Vault Scholar trait.',
      reachBonus: { eye: 0.20, star: 0.10 },
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
      mechanicalSummary: '+0.20 Gold reach. 15% chance: Vault Curse on use.',
      reachBonus: { gold: 0.20 },
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
      mechanicalSummary: '+0.10 Eye reach, +0.05 Veil reach',
      reachBonus: { eye: 0.10, veil: 0.05 },
      lossCondition: 'permanent',
      flavorText: 'An ancient creature\'s eye, perfectly preserved in amber. It watches back. It always watches back.',
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
      mechanicalSummary: '+0.15 Iron reach, +0.10 Star reach',
      reachBonus: { iron: 0.15, star: 0.10 },
      lossCondition: 'permanent',
      flavorText: 'Dense, dark metal from a fallen star. It is colder than iron, harder than steel, and the air around it tastes of distant places.',
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
      mechanicalSummary: '+0.15 Spirit reach',
      reachBonus: { spirit: 0.15 },
      lossCondition: 'permanent',
      flavorText: 'A string of flawless pearls, moon-white and warm to the touch. Folk say they calm the sea and soothe the restless dead.',
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
      mechanicalSummary: '+0.10 Eye reach. 20% chance: Spore Visions on use.',
      reachBonus: { eye: 0.10 },
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
      domainContributions: { eye: 0.15 },
      flavorText: 'The earth has shown them its secret face. They will never look at stone the same way.',
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
      domainContributions: { veil: 0.15, eye: 0.10 },
      flavorText: 'The cavern\'s resonance lingers in their bones. They hear magic before they see it.',
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
      domainContributions: { heart: 0.10 },
      flavorText: 'There is golden light in their touch. Growing things lean toward them, and wounds close more easily in their presence.',
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
      domainContributions: { eye: 0.10 },
      flavorText: 'What others call weeds, they call a pharmacy. The wild apothecary taught them well.',
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
      domainContributions: { eye: 0.15, stone: 0.10 },
      flavorText: 'The sealed chamber opened their mind. They read the old script as if born to it, and the past speaks clearly.',
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
      domainContributions: { star: 0.15 },
      flavorText: 'The sea whispered its rhythms, and they listened. They know when the waters will part before the waters do.',
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
      domainContributions: { veil: 0.10, eye: 0.10 },
      flavorText: 'The dreaming light left traces in their sight. In deep shadow, they see colours no one else sees.',
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
      domainContributions: { iron: 0.10, star: 0.10 },
      flavorText: 'They drank the red water that flowed from the fallen star. Their blood runs darker now, and heavier, and it does not fear steel.',
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
      domainContributions: { mind: -0.10 },
      flavorText: 'The singing of the crystals follows them. Every thought echoes twice.',
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
      domainContributions: { heart: 0.15, iron: -0.10 },
      flavorText: 'Everything is warm and golden and slow. The urgency of the world seems very far away.',
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
      domainContributions: { star: -0.15 },
      flavorText: 'Things go wrong around them. Small things first — a dropped tool, a missed step. Then larger things.',
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
      domainContributions: { iron: -0.10 },
      flavorText: 'Every breath rattles. The salt is in their lungs and will take days to clear.',
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
      domainContributions: { eye: 0.20, heart: -0.15 },
      flavorText: 'They see things — patterns in the dark, faces in the grain of wood, futures in the fall of leaves. But they cannot explain what they see, and they have stopped trying.',
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
      domainContributions: { eye: 0.10, veil: 0.05 },
      flavorText: 'At night, when the world is still, they hear voices in a language no one has spoken for ten thousand years. They are beginning to understand.',
    } as TraitDefinitionProperties,
  },
];
