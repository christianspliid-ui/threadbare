/**
 * Scry Content Package — All data-driven content for the divine court system.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change court structures,
 * title generation, sacred site rules, and artifact templates.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. COURT_STRUCTURES — the 4 geometry definitions (High House, Circle, Web, Abyss)
 * 2. POSITION_ARCHETYPES — thematic labels per structure that guide title generation
 * 3. TITLE_FRAGMENTS — sphere-keyed name parts (prefixes, suffixes, epithets)
 * 4. TITLE_TEMPLATES — rank-keyed name patterns
 * 5. BONUS_RULES — what bonuses each rank can grant
 * 6. WEAKNESS_POOL — possible negative effects
 * 7. SACRED_SITE_RULES — consecration costs, radius, decay (placeholder)
 * 8. ARTIFACT_TEMPLATES — name fragments, costs, loss consequences (placeholder)
 */

import type {
  CourtStructureDefinition,
  PositionRank,
  TitleEffectType,
} from '../types/scry';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';

// ═══════════════════════════════════════════════════════════════════
// 1. COURT STRUCTURES
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete definitions of the 4 divine court archetypes.
 *
 * Each structure defines:
 * - foundationAffinity: which Foundation sphere (Order, Light, Chaos, Darkness)
 * - positionCounts: slots per rank (always 1 apex, 3 inner, 6 outer)
 * - sacredSiteSlots / artifactSlots: holding slot counts
 * - structureBonus: the unique mechanical advantage
 */
export const COURT_STRUCTURES: CourtStructureDefinition[] = [
  {
    id: 'court.high_house',
    structureType: 'high_house',
    foundationAffinity: 'order',
    name: 'The High House',
    description: 'A rigid pyramid of divine hierarchy. Those at the top command absolute authority.',
    flavorText: 'Stone upon stone, tier upon tier — the cosmos demands structure.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'tier_cost',
      description: 'Top 3 positions cost 1 less essence for tier maintenance',
      appliesTo: 'apex',
      value: -1,
    },
  },
  {
    id: 'court.circle',
    structureType: 'circle',
    foundationAffinity: 'light',
    name: 'The Circle',
    description: 'A radiant mandala where all positions resonate with shared divine energy.',
    flavorText: 'Light finds its center, and the center holds.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 3,
    artifactSlots: 2,
    structureBonus: {
      type: 'sphere_influence',
      description: 'All positions share +0.1 sphere influence bonus',
      appliesTo: 'all',
      value: 0.1,
    },
  },
  {
    id: 'court.web',
    structureType: 'web',
    foundationAffinity: 'chaos',
    name: 'The Web',
    description: 'A shifting network where connections matter more than rank.',
    flavorText: 'Every strand vibrates with possibility. Pull one, and the pattern changes.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 4,
    structureBonus: {
      type: 'domain_bonus',
      description: 'Outer positions gain +1 to a random domain each tick',
      appliesTo: 'outer',
      value: 1,
    },
  },
  {
    id: 'court.abyss',
    structureType: 'abyss',
    foundationAffinity: 'darkness',
    name: 'The Abyss',
    description: 'An inverted pyramid where power flows downward into the deep.',
    flavorText: 'What rises must descend. The deepest truths lie at the bottom.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'weakness_reduction',
      description: 'Title weaknesses are reduced by 30%',
      appliesTo: 'all',
      value: 0.7,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// 2. POSITION ARCHETYPES — thematic labels per structure + rank
// ═══════════════════════════════════════════════════════════════════

/** Each structure has named archetypes for each slot. These guide title generation. */
export const POSITION_ARCHETYPES: Record<string, Record<PositionRank, string[]>> = {
  high_house: {
    apex: ['The Sovereign'],
    inner: ['The Shield', 'The Voice', 'The Eye'],
    outer: ['The Blade', 'The Coin', 'The Shadow', 'The Flame', 'The Root', 'The Tide'],
  },
  circle: {
    apex: ['The Center'],
    inner: ['The First Light', 'The Harmony', 'The Radiance'],
    outer: ['The Spark', 'The Echo', 'The Thread', 'The Bloom', 'The Mirror', 'The Wind'],
  },
  web: {
    apex: ['The Nexus'],
    inner: ['The Spinner', 'The Anchor', 'The Lurker'],
    outer: ['The Strand', 'The Knot', 'The Fly', 'The Signal', 'The Weave', 'The Trap'],
  },
  abyss: {
    apex: ['The Depth'],
    inner: ['The Descent', 'The Hunger', 'The Silence'],
    outer: ['The Crack', 'The Whisper', 'The Fossil', 'The Pressure', 'The Drift', 'The Void'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 3. TITLE FRAGMENTS — sphere-keyed name parts
// ═══════════════════════════════════════════════════════════════════

export interface TitleFragments {
  epithets: string[];   // adjective-like: "Storm", "Silent", "Burning"
  roles: string[];      // noun-like: "Marshal", "Keeper", "Herald"
}

export const TITLE_FRAGMENTS: Record<SphereName, TitleFragments> = {
  force: {
    epithets: ['Storm', 'Iron', 'War', 'Thunder', 'Crimson'],
    roles: ['Marshal', 'Warden', 'Champion', 'Destroyer', 'Sentinel'],
  },
  matter: {
    epithets: ['Stone', 'Earthen', 'Granite', 'Deep', 'Unbroken'],
    roles: ['Architect', 'Shaper', 'Foundation', 'Bulwark', 'Mason'],
  },
  energy: {
    epithets: ['Burning', 'Radiant', 'Lightning', 'Blazing', 'Bright'],
    roles: ['Herald', 'Conduit', 'Beacon', 'Igniter', 'Torch'],
  },
  life: {
    epithets: ['Verdant', 'Blooming', 'Evergreen', 'Vital', 'Fertile'],
    roles: ['Shepherd', 'Tender', 'Gardener', 'Lifebringer', 'Healer'],
  },
  mind: {
    epithets: ['Silent', 'Dreaming', 'Lucid', 'Keen', 'Piercing'],
    roles: ['Oracle', 'Seer', 'Weaver', 'Scholar', 'Whisperer'],
  },
  spirit: {
    epithets: ['Ethereal', 'Spectral', 'Veiled', 'Ghostly', 'Hollow'],
    roles: ['Walker', 'Guide', 'Medium', 'Watcher', 'Binder'],
  },
  time: {
    epithets: ['Ancient', 'Timeless', 'Fleeting', 'Cyclic', 'Enduring'],
    roles: ['Chronicler', 'Keeper', 'Turner', 'Witness', 'Tide'],
  },
  entropy: {
    epithets: ['Ashen', 'Withering', 'Hollow', 'Fading', 'Dark'],
    roles: ['Unraveler', 'Harbinger', 'Ender', 'Reaper', 'Void'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 4. TITLE TEMPLATES — rank-keyed patterns
// ═══════════════════════════════════════════════════════════════════

/**
 * {epithet} = from TITLE_FRAGMENTS[sphere].epithets
 * {role} = from TITLE_FRAGMENTS[sphere].roles
 * {archetype} = from POSITION_ARCHETYPES[structure][rank][slotIndex]
 * {domain} = ReachDomain display name
 */
export const TITLE_TEMPLATES: Record<PositionRank, string[]> = {
  apex: [
    'The {epithet} {role}',
    '{epithet} Sovereign of the {domain}',
    'The {epithet} One',
  ],
  inner: [
    '{epithet} {role}',
    '{role} of the {domain}',
    'The {epithet} {archetype}',
  ],
  outer: [
    '{epithet} of the {domain}',
    'The {role}',
    '{archetype} {role}',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 5. BONUS RULES — stat ranges per rank
// ═══════════════════════════════════════════════════════════════════

export interface BonusRule {
  type: TitleEffectType;
  target: 'primary_domain' | 'secondary_domain' | 'sphere' | 'tier' | 'detection';
  minValue: number;
  maxValue: number;
  /** Probability weight relative to other bonuses (higher = more likely) */
  weight: number;
}

export const BONUS_RULES: Record<PositionRank, BonusRule[]> = {
  apex: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 2, maxValue: 4, weight: 3 },
    { type: 'essence_gen', target: 'sphere', minValue: 0.3, maxValue: 0.8, weight: 2 },
    { type: 'tier_cost', target: 'tier', minValue: -2, maxValue: -1, weight: 1 },
  ],
  inner: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 1, maxValue: 3, weight: 3 },
    { type: 'essence_gen', target: 'sphere', minValue: 0.1, maxValue: 0.4, weight: 2 },
    { type: 'sphere_influence', target: 'sphere', minValue: 0.1, maxValue: 0.3, weight: 1 },
  ],
  outer: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 1, maxValue: 2, weight: 3 },
    { type: 'sphere_influence', target: 'sphere', minValue: 0.05, maxValue: 0.15, weight: 2 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 6. WEAKNESS POOL — possible negative effects
// ═══════════════════════════════════════════════════════════════════

export interface WeaknessTemplate {
  type: TitleEffectType;
  target: string;
  minValue: number;
  maxValue: number;
  description: string;
  /** Which spheres tend to produce this weakness */
  sphereAssociations: SphereName[];
}

export const WEAKNESS_POOL: WeaknessTemplate[] = [
  {
    type: 'domain_bonus',
    target: 'heart',
    minValue: -2,
    maxValue: -1,
    description: 'Diminished social grace',
    sphereAssociations: ['force', 'entropy', 'matter'],
  },
  {
    type: 'domain_bonus',
    target: 'shadow',
    minValue: -2,
    maxValue: -1,
    description: 'Conspicuous presence',
    sphereAssociations: ['energy', 'life', 'force'],
  },
  {
    type: 'detection_risk',
    target: 'detection',
    minValue: 0.05,
    maxValue: 0.20,
    description: 'Increased divine visibility',
    sphereAssociations: ['energy', 'spirit', 'mind'],
  },
  {
    type: 'domain_bonus',
    target: 'iron',
    minValue: -2,
    maxValue: -1,
    description: 'Weakened martial prowess',
    sphereAssociations: ['mind', 'spirit', 'time'],
  },
  {
    type: 'domain_bonus',
    target: 'eye',
    minValue: -2,
    maxValue: -1,
    description: 'Clouded perception',
    sphereAssociations: ['entropy', 'matter', 'force'],
  },
  {
    type: 'essence_gen',
    target: 'sphere',
    minValue: -0.3,
    maxValue: -0.1,
    description: 'Essence drain',
    sphereAssociations: ['entropy', 'time', 'spirit'],
  },
  {
    type: 'tier_cost',
    target: 'tier',
    minValue: 0.5,
    maxValue: 1.5,
    description: 'Increased maintenance burden',
    sphereAssociations: ['life', 'energy', 'mind'],
  },
  {
    type: 'domain_bonus',
    target: 'star',
    minValue: -2,
    maxValue: -1,
    description: 'Dulled sense of fate',
    sphereAssociations: ['matter', 'force', 'life'],
  },
  {
    type: 'domain_bonus',
    target: 'gold',
    minValue: -2,
    maxValue: -1,
    description: 'Diminished vitality',
    sphereAssociations: ['entropy', 'mind', 'spirit'],
  },
  {
    type: 'domain_bonus',
    target: 'stone',
    minValue: -2,
    maxValue: -1,
    description: 'Unsteady foundations',
    sphereAssociations: ['energy', 'entropy', 'time'],
  },
  {
    type: 'domain_bonus',
    target: 'gold',
    minValue: -2,
    maxValue: -1,
    description: 'Poor bargaining instinct',
    sphereAssociations: ['force', 'spirit', 'entropy'],
  },
  {
    type: 'domain_bonus',
    target: 'veil',
    minValue: -2,
    maxValue: -1,
    description: 'Thinned connection to the magical',
    sphereAssociations: ['matter', 'force', 'time'],
  },
  {
    type: 'detection_risk',
    target: 'detection',
    minValue: 0.10,
    maxValue: 0.30,
    description: 'Blazing divine signature',
    sphereAssociations: ['energy', 'force', 'life'],
  },
  {
    type: 'essence_gen',
    target: 'sphere',
    minValue: -0.5,
    maxValue: -0.2,
    description: 'Deep essence bleed',
    sphereAssociations: ['time', 'entropy', 'matter'],
  },
  {
    type: 'tier_cost',
    target: 'tier',
    minValue: 1.0,
    maxValue: 2.0,
    description: 'Crushing hierarchical burden',
    sphereAssociations: ['mind', 'spirit', 'time'],
  },
  {
    type: 'domain_bonus',
    target: 'veil',
    minValue: -3,
    maxValue: -1,
    description: 'Severed arcane resonance',
    sphereAssociations: ['entropy', 'spirit', 'time'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// 7. SACRED SITE RULES (placeholder — not mechanically active yet)
// ═══════════════════════════════════════════════════════════════════

export const SACRED_SITE_DEFAULTS = {
  /** Base consecration cost in primary sphere essence */
  baseCost: 20,
  /** Influence strength of a freshly consecrated site */
  baseInfluenceStrength: 0.3,
  /** Bonus essence per tick from a sacred site */
  baseBonusEssence: 0.2,
};

// ═══════════════════════════════════════════════════════════════════
// 8. ARTIFACT TEMPLATES (placeholder — not mechanically active yet)
// ═══════════════════════════════════════════════════════════════════

export const ARTIFACT_DEFAULTS = {
  /** Base creation cost in primary sphere essence */
  baseCost: 35,
};

// ═══════════════════════════════════════════════════════════════════
// DOMAIN DISPLAY NAMES
// ═══════════════════════════════════════════════════════════════════

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
