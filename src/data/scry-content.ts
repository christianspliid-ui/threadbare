/**
 * Scry System Content Package
 *
 * Single source of truth for all content-managed data in the Divine Court (Scry) system.
 * Content managers should ONLY edit this file to adjust court structures, titles, bonuses,
 * and other game-facing definitions.
 *
 * Organized into 8 sections:
 * 1. Court Structures — the 4 archetypal court organization types
 * 2. Position Archetypes — thematic position labels per structure and rank
 * 3. Title Fragments — sphere-specific epithets and roles for title generation
 * 4. Title Templates — rank-specific generation patterns
 * 5. Bonus Rules — mechanical bonuses granted by positions
 * 6. Weakness Pool — drawbacks that can attach to titles
 * 7. Sacred Site Defaults — base costs and mechanics for consecration
 * 8. Artifact Defaults — base costs for divine artifact creation
 *
 * Also exports: DOMAIN_DISPLAY_NAMES for UI rendering.
 */

import type {
  CourtStructureDefinition,
  StructureBonus,
  PositionRank,
  TitleEffectType,
} from '../types/scry';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: COURT STRUCTURES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Complete definitions of the 4 divine court archetypes.
 *
 * Each structure defines:
 * - foundationAffinity: which Foundation sphere (Order, Light, Chaos, Darkness)
 * - positionCounts: slots per rank (always 1 apex, 3 inner, 6 outer)
 * - sacredSiteSlots: number of consecration slots
 * - artifactSlots: number of divine artifact slots
 * - structureBonus: the unique mechanical advantage
 */
export const COURT_STRUCTURES: CourtStructureDefinition[] = [
  {
    id: 'high_house',
    structureType: 'high_house',
    foundationAffinity: 'order',
    name: 'The High House',
    description:
      'A pyramid hierarchy of undisputed ranks, where authority flows downward from apex to foundation.',
    flavorText:
      'Every lord bows to the throne. Every throne stands upon pillars. Every pillar rests upon stone.',
    positionCounts: {
      apex: 1,
      inner: 3,
      outer: 6,
    },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'tier_cost',
      description: 'Apex position requires 1 less tier',
      appliesTo: 'apex_only',
      value: -1,
    },
  },
  {
    id: 'circle',
    structureType: 'circle',
    foundationAffinity: 'light',
    name: 'The Circle',
    description:
      'A mandala of equal voices where consensus and radiance bind together, no voice above another.',
    flavorText:
      'In the circle all are heard. In the light all are seen. In the center, the brightest burns.',
    positionCounts: {
      apex: 1,
      inner: 3,
      outer: 6,
    },
    sacredSiteSlots: 3,
    artifactSlots: 2,
    structureBonus: {
      type: 'sphere_influence',
      description: 'All positions radiate +0.1 sphere influence',
      appliesTo: 'all_positions',
      value: 0.1,
    },
  },
  {
    id: 'web',
    structureType: 'web',
    foundationAffinity: 'chaos',
    name: 'The Web',
    description:
      'A networked lattice of interconnected nodes where power flows through hidden threads and unexpected paths.',
    flavorText:
      'In the web, all are connected. In the web, all are hunters. In the web, none stand alone.',
    positionCounts: {
      apex: 1,
      inner: 3,
      outer: 6,
    },
    sacredSiteSlots: 2,
    artifactSlots: 4,
    structureBonus: {
      type: 'domain_bonus',
      description: 'Outer positions grant +1 to domain capability in their reach',
      appliesTo: 'inner_outer',
      value: 1,
    },
  },
  {
    id: 'abyss',
    structureType: 'abyss',
    foundationAffinity: 'darkness',
    name: 'The Abyss',
    description:
      'An inverse mirror where strength hides in shadow, and weakness becomes a form of power.',
    flavorText:
      'In the abyss, sight fails. In the abyss, reaching is falling. In the abyss, emptiness is fullness.',
    positionCounts: {
      apex: 1,
      inner: 3,
      outer: 6,
    },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'detection_penalty',
      description: 'All positions reduce incoming detection by 30%',
      appliesTo: 'all_positions',
      value: 0.7,
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: POSITION ARCHETYPES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Thematic position labels per court structure and rank.
 *
 * When a position is created, one of these archetypes is randomly selected
 * as the position's title context. Archetypes shape the flavor of generated
 * titles and influence narrative presentation.
 *
 * Structure: { [structureType]: { [rank]: [archetype labels...] } }
 */
export const POSITION_ARCHETYPES: Record<
  string,
  Record<PositionRank, string[]>
> = {
  high_house: {
    apex: ['The Sovereign'],
    inner: ['The Shield', 'The Voice', 'The Eye'],
    outer: [
      'The Blade',
      'The Coin',
      'The Shadow',
      'The Flame',
      'The Root',
      'The Tide',
    ],
  },
  circle: {
    apex: ['The Radiant'],
    inner: ['The Beacon', 'The Mirror', 'The Prism'],
    outer: [
      'The Dawn',
      'The Dusk',
      'The Zenith',
      'The Nadir',
      'The East',
      'The West',
    ],
  },
  web: {
    apex: ['The Spindle'],
    inner: ['The Strand', 'The Knot', 'The Junction'],
    outer: [
      'The Thread',
      'The Snare',
      'The Gossamer',
      'The Anchor',
      'The Weaver',
      'The Spider',
    ],
  },
  abyss: {
    apex: ['The Void'],
    inner: ['The Chasm', 'The Depth', 'The Scar'],
    outer: [
      'The Whisper',
      'The Echo',
      'The Shadow',
      'The Hunger',
      'The Silence',
      'The Fall',
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: TITLE FRAGMENTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Title fragment definitions for each Creation Sphere.
 *
 * Epithets: adjectives describing the sphere's essence
 * Roles: positions or functions that express the sphere's nature
 *
 * Generated titles combine: {role} {epithet} of {domain} or similar patterns.
 * Each sphere gets 5 epithets and 5 roles to ensure varied title generation.
 */

interface TitleFragments {
  epithets: string[];
  roles: string[];
}

export const TITLE_FRAGMENTS: Record<SphereName, TitleFragments> = {
  force: {
    epithets: [
      'Unbending',
      'Relentless',
      'Striking',
      'Shattering',
      'Unstoppable',
    ],
    roles: [
      'Hammer',
      'Warlord',
      'Breaker',
      'Striker',
      'Conqueror',
    ],
  },
  matter: {
    epithets: [
      'Steadfast',
      'Unyielding',
      'Grounded',
      'Weighty',
      'Enduring',
    ],
    roles: [
      'Keeper',
      'Guardian',
      'Anchor',
      'Bastion',
      'Foundation',
    ],
  },
  energy: {
    epithets: [
      'Brilliant',
      'Radiant',
      'Burning',
      'Luminous',
      'Consuming',
    ],
    roles: [
      'Flame',
      'Star',
      'Furnace',
      'Beacon',
      'Inferno',
    ],
  },
  life: {
    epithets: [
      'Verdant',
      'Vital',
      'Flourishing',
      'Fertile',
      'Teeming',
    ],
    roles: [
      'Bloom',
      'Nurture',
      'Harvest',
      'Growth',
      'Abundance',
    ],
  },
  mind: {
    epithets: [
      'Keen',
      'Luminous',
      'Sharp',
      'Knowing',
      'Insightful',
    ],
    roles: [
      'Oracle',
      'Sage',
      'Scholar',
      'Seer',
      'Archivist',
    ],
  },
  spirit: {
    epithets: [
      'Transcendent',
      'Ethereal',
      'Sacred',
      'Sublime',
      'Divine',
    ],
    roles: [
      'Pilgrim',
      'Devotee',
      'Sanctifier',
      'Witness',
      'Herald',
    ],
  },
  time: {
    epithets: [
      'Eternal',
      'Fleeting',
      'Ancient',
      'Timeless',
      'Cyclical',
    ],
    roles: [
      'Keeper of Hours',
      'Chronicler',
      'Sentinel',
      'Warden',
      'Echo',
    ],
  },
  entropy: {
    epithets: [
      'Dissolving',
      'Fading',
      'Crumbling',
      'Inevitable',
      'Final',
    ],
    roles: [
      'Rust',
      'Decay',
      'Entropy',
      'Unmaking',
      'Twilight',
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 4: TITLE TEMPLATES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generation patterns for title names per position rank.
 *
 * Placeholders:
 *   {epithet}  — from sphere's epithets
 *   {role}     — from sphere's roles
 *   {archetype} — from position's archetype
 *   {domain}   — from title's domain affinity
 *
 * Three templates per rank provide variety in generated titles.
 */
export const TITLE_TEMPLATES: Record<PositionRank, string[]> = {
  apex: [
    '{archetype} of the {role}',
    'The {epithet} {archetype}',
    '{archetype}, {role} of {domain}',
  ],
  inner: [
    '{role} of {domain}',
    'The {epithet} {archetype}',
    '{archetype} of {epithet} Counsel',
  ],
  outer: [
    'The {epithet} {role}',
    '{archetype} of {domain}',
    '{role} in {epithet} Service',
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 5: BONUS RULES
// ────────────────────────────────────────────────────────────────────────────

/**
 * A mechanical bonus rule that can be granted by a position.
 *
 * Fields:
 *   type: the mechanical effect category
 *   min, max: range of the bonus value
 *   weight: probability weight relative to other bonuses in same rank
 *           (higher = more likely to be selected)
 */
interface BonusRule {
  type: TitleEffectType;
  min: number;
  max: number;
  weight: number;
}

/**
 * Possible bonuses per position rank.
 *
 * Apex positions grant the most powerful and varied bonuses.
 * Inner positions grant moderate bonuses across domains and influence.
 * Outer positions grant small, focused bonuses.
 */
export const BONUS_RULES: Record<PositionRank, BonusRule[]> = {
  apex: [
    {
      type: 'reach_domain_bonus',
      min: 2,
      max: 4,
      weight: 3,
    },
    {
      type: 'essence_production',
      min: 0.3,
      max: 0.8,
      weight: 3,
    },
    {
      type: 'influence_multiplier',
      min: -2,
      max: -1,
      weight: 2,
    },
  ],
  inner: [
    {
      type: 'reach_domain_bonus',
      min: 1,
      max: 3,
      weight: 3,
    },
    {
      type: 'essence_production',
      min: 0.1,
      max: 0.4,
      weight: 3,
    },
    {
      type: 'influence_multiplier',
      min: 0.1,
      max: 0.3,
      weight: 2,
    },
  ],
  outer: [
    {
      type: 'reach_domain_bonus',
      min: 1,
      max: 2,
      weight: 3,
    },
    {
      type: 'influence_multiplier',
      min: 0.05,
      max: 0.15,
      weight: 2,
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 6: WEAKNESS POOL
// ────────────────────────────────────────────────────────────────────────────

/**
 * A mechanical weakness or drawback that can attach to a title.
 *
 * Weaknesses provide narrative texture and mechanical tension.
 * Some titles might be mechanically strong but come with drawbacks.
 *
 * Fields:
 *   type: the mechanical effect being weakened
 *   target: what aspect is weakened (e.g., 'shadow_domain', 'all_agents')
 *   min, max: range of the weakness penalty (usually negative)
 *   description: flavor text explaining the weakness
 *   sphereAssociations: which spheres are thematically connected
 */
interface WeaknessTemplate {
  type: TitleEffectType;
  target: string;
  min: number;
  max: number;
  description: string;
  sphereAssociations: SphereName[];
}

export const WEAKNESS_POOL: WeaknessTemplate[] = [
  {
    type: 'reach_domain_bonus',
    target: 'shadow',
    min: -2,
    max: -1,
    description: 'Weakness in shadow work; stealth operations suffer',
    sphereAssociations: ['entropy', 'mind'],
  },
  {
    type: 'reach_domain_bonus',
    target: 'iron',
    min: -3,
    max: -1,
    description: 'Fragile in conflict; martial efforts falter',
    sphereAssociations: ['entropy', 'energy'],
  },
  {
    type: 'influence_multiplier',
    target: 'all_agents',
    min: -0.2,
    max: -0.1,
    description: 'Agents chafe under this title; morale penalty',
    sphereAssociations: ['entropy', 'darkness'],
  },
  {
    type: 'essence_production',
    target: 'all_sources',
    min: -0.3,
    max: -0.1,
    description: 'Drains essence from court operations',
    sphereAssociations: ['entropy', 'chaos'],
  },
  {
    type: 'trait_synergy',
    target: 'light_spheres',
    min: -1,
    max: -0.5,
    description: 'Resists light magic and healing',
    sphereAssociations: ['darkness', 'entropy'],
  },
  {
    type: 'detection_penalty',
    target: 'all_detection',
    min: 1.5,
    max: 2.0,
    description: 'Leaves obvious traces; detection multiplier increases',
    sphereAssociations: ['light', 'mind'],
  },
  {
    type: 'narrative_override',
    target: 'story_role',
    min: 0,
    max: 0,
    description:
      'Agent becomes a focal point for disaster; narrative inevitability',
    sphereAssociations: ['entropy', 'time'],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SECTION 7: SACRED SITE DEFAULTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Base costs and mechanics for sacred site consecration.
 *
 * baseCost: essence required to consecrate a location as a sacred site
 * baseInfluenceStrength: how strongly the site radiates sphere influence
 * baseBonusEssence: essence per tick that the site generates
 */
export const SACRED_SITE_DEFAULTS = {
  baseCost: 20,
  baseInfluenceStrength: 0.3,
  baseBonusEssence: 0.2,
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 8: ARTIFACT DEFAULTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Base costs for divine artifact creation.
 *
 * baseCost: essence required to forge a divine artifact
 *
 * Artifacts are persistent magical items that can be held by court members.
 * They provide mechanical bonuses and narrative weight.
 */
export const ARTIFACT_DEFAULTS = {
  baseCost: 35,
};

// ────────────────────────────────────────────────────────────────────────────
// DOMAIN DISPLAY NAMES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable names for the Nine Reaches.
 * Used in UI for domain affinity display and title generation.
 */
export const DOMAIN_DISPLAY_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};
