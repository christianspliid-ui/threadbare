/**
 * CMS Content Registry — the single source of truth for browsable content.
 *
 * NFP #1 (Tunability): Adding a new content type = adding one entry here.
 * No viewer changes, no layout changes, no routing changes.
 *
 * Each entry maps a data export to a viewer configuration.
 * Categories are derived from entries — no separate category list to maintain.
 */

import type { ContentRegistryEntry, ContentCategory, ConstantEntry } from './types';

// ── Data Imports ─────────────────────────────────────────────────
// World & Geography
import {
  TERRAIN_SETTLEMENT_WEIGHTS, LOCATION_NAMES,
  LOCATION_PREFIXES, LOCATION_SUFFIXES, TERRAIN_NAME_ROOTS, DEFAULT_ROOTS,
} from '../../engine/worldSeed';
import { TERRAIN_TRANSFORMATIONS } from '../../data/terrain-transformation-content';
import { TERRAIN_TAXES } from '../../data/movement-content';
import { REGION_NAME_FRAGMENTS } from '../../data/region-name-content';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { TERRAIN_MODIFIERS } from '../../data/terrain-modifiers';

// Locations & Sublocations
import { SUBTYPE_SUBLOCATION_MAP } from '../../engine/sublocation';

// NPCs
import {
  NPC_ROLES, LOCATION_ROLE_ROSTERS, FACTION_ROLE_ROSTERS,
  NPC_ROLE_SUBLOCATION_MAP, NPC_CONSTANTS, NPC_NAME_POOL,
  NPC_ROLE_REACH_MAP,
} from '../../types/npc';

// Encounters
import { ENCOUNTER_TEMPLATES, ENCOUNTER_DIFFICULTY_TIERS } from '../../data/encounter-content';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../../data/social-encounter-content';
import * as colocation from '../../data/colocation-content';

// Actions
import { ACTION_TEMPLATES } from '../../data/action-template-content';

// Agents & Archetypes
import { NARRATIVE_ARCHETYPES } from '../../data/archetype-content';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';

// Culture & Society
import { FOUNDATION_MODIFIERS, CREATION_SPHERE_MODIFIERS, BIOME_MODIFIERS, FORMATIVE_TRAIT_SEEDS, BEHAVIORAL_TRAIT_SEEDS } from '../../data/culture-content';
import { HISTORICAL_CULTURE_TEMPLATES } from '../../data/historical-culture-content';
import {
  SETTLEMENT_ROOTS_BY_FOUNDATION, SETTLEMENT_ROOTS_BY_SPHERE,
  SETTLEMENT_SUFFIXES_BY_FOUNDATION,
} from '../../data/culture-name-pools';
import {
  VOWEL_MASTER_LIST_BY_FOUNDATION,
  CONSONANT_MASTER_LIST_BY_SPHERE,
  FOUNDATION_CONSONANT_BIAS,
  NAME_SUFFIXES_BY_FOUNDATION,
  SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC,
  SYLLABLE_TEMPLATE_BIAS_BY_FOUNDATION,
} from '../../data/culture-phonetic-pools';

// Cosmology & Divine
import { ARCHETYPE_TITLES } from '../../data/ascendant-content';
import { COURT_STRUCTURES } from '../../data/scry-content';
import { TIER_NAMES, TIER_MAINTENANCE, TIER_PROMOTION_THRESHOLDS } from '../../data/influence-content';
import { AGENDA_TEMPLATES } from '../../data/agenda-content';
import { MANIPULATION_DEFINITIONS, INTERVENTION_DEFINITIONS } from '../../data/dream-content';
import { FUNDAMENT_DESCRIPTIONS, RESONANCE_FRAGMENT_PROSE } from '../../data/worldsoul-content';

// Rivals & Opposition
import { FOUNDATION_OPPOSITION_MATRIX, CREATION_SPHERE_TENSIONS, ARCHETYPE_FRICTION_PAIRS } from '../../data/opposition-content';

// Narrative & Prose
import { SPHERE_VOCABULARY, ROUTINE_TEMPLATES, NOTABLE_TEMPLATES } from '../../data/narrative-content';
import { CHRONICLER_VIGNETTES, SUBLOCATION_FLAVOR, ARTIFACT_LORE, LOCATION_TYPE_FLAVOR } from '../../data/chronicler-content';
import {
  BIOME_PROSE, SUBTYPE_ESTABLISHING_PROSE,
  ARCHETYPE_PROSE, AGENT_ENCOUNTER_BIOGRAPHY_PROSE, LOCATION_ENCOUNTER_HISTORY_PROSE,
  CULTURE_LOCATION_PROSE, SPHERE_LOCATION_PROSE, GUILD_IDENTITY_PROSE, FACTION_CONTROL_PROSE,
  DISPOSITION_PROSE, HISTORICAL_CULTURE_PROSE, GEOGRAPHIC_REGION_CLAIMED_PROSE,
  GEOGRAPHIC_REGION_WILDERNESS_PROSE, TRADE_ROUTE_CROSSROADS_PROSE, TRADE_ROUTE_GOODS_PROSE,
  TRADE_ROUTE_STATUS_PROSE, TRADE_ROUTE_VOLUME_PROSE, REGION_ETYMOLOGY_PROSE,
  POPULATION_PROSE_TEMPLATES, WEALTH_PROSE, PROSPERITY_PROSE, PROSPERITY_TERRAIN_PROSE,
} from '../../data/prose-layer-content';
import { TERRAIN_OPENINGS } from '../../data/hex-vignette-content';
import { VALUE_LABELS, FEAR_DESCRIPTIONS } from '../../data/strand-content';

// Configuration
import * as threat from '../../data/threat-content';
import * as agentVisual from '../../data/agent-visual-content';
import * as gameConfig from '../../data/game-config';
import * as influence from '../../data/influence-content';
import { TUNABLE_GROUPS } from './tunableConstants';

// Factions & Military
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-encounter-content';
import { MERCENARY_COMPANY_DEFINITION } from '../../data/mercenary-company-definition';
import { MERCENARY_ENCOUNTER_TEMPLATES } from '../../data/mercenary-encounter-content';
import { MONSTER_ENCOUNTER_TEMPLATES } from '../../data/monster-encounter-content';
import { MONSTER_FACTION_DEFINITIONS } from '../../data/monster-faction-definitions';
import { ARMY_ENCOUNTER_TEMPLATES } from '../../data/army-encounter-content';
import { SIEGE_SPOTLIGHT_TEMPLATES, SIEGE_REGIONAL_TEMPLATES } from '../../data/siege-encounter-content';
import { BATTLE_SPOTLIGHT_TEMPLATES } from '../../data/battle-spotlight-content';

// Mandates & Endgame
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import { DOOM_VOCABULARY, ARCHETYPE_STAGE_NAMES as DOOM_STAGE_NAMES, DEFAULT_THRESHOLDS as DOOM_THRESHOLDS } from '../../data/doom-content';

// Rivals (additional)
import { RIVAL_PERSONALITY_PROFILES, RIVAL_ACTION_TEMPLATES } from '../../data/rival-content';

// Agent Systems (additional)
import { ARCHETYPE_TONE_OVERLAYS } from '../../data/archetype-tone-content';
import { ARCHETYPE_STRATEGY_WEIGHTS } from '../../data/game-theory-content';

// Economy
import { ECONOMIC_TRAIT_DEFINITIONS } from '../../data/economic-trait-content';
import { ECONOMIC_CHRONICLE_TEMPLATES } from '../../data/economic-chronicle-content';

// Rewards & Starters
import { REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS } from '../../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../data/starter-attachments';
import * as attachmentTier from '../../data/attachment-tier-content';

// Divine Feedback (additional)
import { CONSEQUENCE_TEMPLATES as INTERVENTION_CONSEQUENCES } from '../../data/intervention-feedback-content';
import { AGENDA_CONSEQUENCE_TEMPLATES } from '../../data/agenda-consequence-templates';

// Backstory & Profile Prose
import * as backstory from '../../data/backstory-content';
import * as profileProse from '../../data/profile-content';

// Meeting/Choice
import { DILEMMA_TEMPLATES, GOD_GIVEN_TRAITS } from '../../data/meeting-content';

// Journey
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';

// Quintessence
import { QUINTESSENCE_LEXICON, QUINTESSENCE_TOOLTIPS } from '../../data/quintessence-content';

// Unified Actions
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

// Traits
import { LOS_TRAIT_DEFINITIONS } from '../../data/trait-modifiers';
import { NARRATIVE_LEXICON } from '../../types/traits';
import { CULTURAL_STRENGTH_THRESHOLDS } from '../../engine/culturalTraits';
import {
  ECON_TRAIT_TRADE_BARON_MIN_ROUTES,
  ECON_TRAIT_GUILD_SWORN_MIN_TICKS,
  ECON_TRAIT_BANKRUPT_WEALTH_FLOOR,
  ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS,
  ECON_TRAIT_DEBT_LADEN_MIN_DEBTS,
  ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS,
  ECON_TRAIT_COIN_CURSED_MIN_LOSSES,
} from '../../data/economic-trait-content';
import { TRAIT_BONUS_CAP, TRAIT_PER_BONUS_CAP } from '../../data/agent-behavior-constants';

// Hex & World Soul Prose
import { SOUL_PROSE, SOUL_SECONDARY_PROSE, SOUL_THREAT_PROSE } from '../../data/hexSoulProse';
import { WORLD_SOUL_PROSE } from '../../data/worldSoulProse';

// Domain Words
import { DOMAIN_WORD_SCALES } from '../../data/domain-words';

// World Model Taxonomy
import worldModel from '../../data/world-model.json';

// ── Reach domain badge colors (reused across viewers) ────────────
export const REACH_BADGE_COLORS: Record<string, string> = {
  iron:   '#b91c1c',  // Force (red)
  gold:   '#166534',  // Life (green, darkened for Threadbare)
  shadow: '#134e4a',  // Entropy (teal-dark)
  veil:   '#581c87',  // Spirit (purple)
  heart:  '#1e3a8a',  // Mind (blue)
  eye:    '#92400e',  // Energy (amber, darkened for Threadbare)
  stone:  '#57534e',  // Matter (brown)
  star:   '#7c2d12',  // Time (orange, darkened for Threadbare)
};

export const THREAT_BADGE_COLORS: Record<string, string> = {
  trivial: '#4ade80', easy: '#60a5fa', moderate: '#fbbf24', hard: '#f87171', deadly: '#d946ef',
};

export const POSSESSION_SUBCATEGORY_COLORS: Record<string, string> = {
  arms:              '#b91c1c', // red — Iron
  mounts_beasts:     '#166534', // green — Flesh/Life
  vestments:         '#1e3a8a', // blue — Heart
  tomes_scrolls:     '#581c87', // purple — Veil
  relics_talismans:  '#7c2d12', // orange — Star
  tools_instruments: '#57534e', // stone — Stone
  provisions:        '#92400e', // amber — Gold
};

export const LOSS_CONDITION_COLORS: Record<string, string> = {
  consumable: '#92400e', // amber
  breakable:  '#b91c1c', // red
  stealable:  '#134e4a', // teal
  cursed:     '#581c87', // purple
  permanent:  '#166534', // green
};

export const ATTACHMENT_SUBCATEGORY_COLORS: Record<string, string> = {
  condition: '#6b21a8',  // purple
  blessing:  '#166534',  // green
  curse:     '#991b1b',  // red
  bestowed:  '#4338ca',  // indigo
};

export const ACTION_SCALE_COLORS: Record<string, string> = {
  cosmic:   '#7c2d12', // orange-dark — divine/cosmic
  regional: '#1e3a8a', // blue — faction/settlement scale
  local:    '#166534', // green — location scale
  personal: '#57534e', // stone — individual scale
};

export const ENCOUNTER_TYPE_COLORS: Record<string, string> = {
  explore: '#60a5fa', acquire: '#fbbf24', create: '#4ade80', hire: '#a78bfa',
  duel: '#f87171', steal: '#f59e0b', trade: '#34d399', assist: '#818cf8',
  build: '#fb923c', lead: '#e879f9',
};

// ── Helper: convert standalone constants to ConstantEntry[] ──────
function constants(...entries: [string, unknown, string?][]): ConstantEntry[] {
  return entries.map(([name, value, description]) => ({ name, value, description }));
}

// ── Helper: record to array for table display ────────────────────
function recordToArray<V>(rec: Record<string, V>): Array<{ key: string; value: V }> {
  return Object.entries(rec).map(([key, value]) => ({ key, value }));
}

// ── Derived: world-model trait nodes for CMS table ────────────────
const WORLD_MODEL_TRAITS = worldModel.nodes
  .filter((n: { id: string }) => n.id.startsWith('trait.'))
  .map((n: { id: string; name: string; category?: string; description?: string; properties?: Record<string, unknown> }) => {
    const cat = n.id.split('.')[1] ?? 'unknown'; // innate, mastery, reputation, scar, condition, destiny
    const effects = n.properties?.effects as { actionModifiers?: Record<string, number> } | undefined;
    const domains = effects?.actionModifiers
      ? Object.keys(effects.actionModifiers).map(k => k.replace('reach.', '')).join(', ')
      : '';
    return {
      id: n.id,
      name: n.name,
      category: cat,
      description: n.description ?? '',
      visibility: (n.properties?.visibility as string) ?? 'public',
      maxLevel: (n.properties?.maxLevel as number) ?? 1,
      domains,
      acquisition: (n.properties?.acquisition as { method?: string })?.method ?? '',
    };
  });

// ── Derived: narrative lexicon as table rows ───────────────────────
const NARRATIVE_LEXICON_ROWS = Object.entries(NARRATIVE_LEXICON).map(([reach, tiers]) => ({
  reach,
  tier0: tiers[0], tier1: tiers[1], tier2: tiers[2], tier3: tiers[3], tier4: tiers[4],
  tier5: tiers[5], tier6: tiers[6], tier7: tiers[7], tier8: tiers[8], tier9: tiers[9],
}));

// ── Trait category badge colors ────────────────────────────────────
const TRAIT_CATEGORY_COLORS: Record<string, string> = {
  innate: '#1e40af',     // blue
  mastery: '#166534',    // green
  reputation: '#92400e', // amber
  scar: '#991b1b',       // red
  condition: '#6b21a8',  // purple
  destiny: '#7c2d12',    // orange
  cultural: '#115e59',   // teal
  bestowed: '#4338ca',   // indigo
};

// ── Derived: NPC role table rows ──────────────────────────────────
const NPC_ROLE_ROWS = NPC_ROLES.map(role => {
  const sublocationPref = NPC_ROLE_SUBLOCATION_MAP[role];
  const locationTypes = Object.entries(LOCATION_ROLE_ROSTERS)
    .filter(([, roster]) => roster.some(r => r.role === role))
    .map(([locType, roster]) => {
      const entry = roster.find(r => r.role === role)!;
      return `${locType} (${Math.round(entry.chance * 100)}%)`;
    });
  const factionTypes = Object.entries(FACTION_ROLE_ROSTERS)
    .filter(([, roster]) => roster.some(r => r.role === role))
    .map(([fType, roster]) => {
      const entry = roster.find(r => r.role === role)!;
      return `${fType} (${Math.round(entry.chance * 100)}%)`;
    });
  return {
    role,
    locations: locationTypes.join(', ') || '—',
    factions: factionTypes.join(', ') || '—',
    sublocation: sublocationPref?.replace('sublocation-type.', '') ?? '—',
  };
});

// ── Derived: NPC role reach affinity rows ─────────────────────────
const NPC_ROLE_REACH_ROWS = NPC_ROLES.map(role => {
  const aff = NPC_ROLE_REACH_MAP[role];
  return {
    role,
    primary: aff.primary,
    secondary: aff.secondary,
  };
});

// ── Derived: location role roster rows ───────────────────────────
const LOCATION_ROSTER_ROWS = Object.entries(LOCATION_ROLE_ROSTERS).flatMap(
  ([locType, roster]) => roster.map(r => ({
    locationType: locType,
    role: r.role,
    chance: r.chance,
  }))
);

// ── Derived: faction role roster rows ────────────────────────────
const FACTION_ROSTER_ROWS = Object.entries(FACTION_ROLE_ROSTERS).flatMap(
  ([fType, roster]) => roster.map(r => ({
    factionType: fType,
    role: r.role,
    chance: r.chance,
  }))
);

// ── Derived: location subtypes catalog ───────────────────────────
const LOCATION_SUBTYPE_CATALOG: Array<{ subtype: string; group: string; description: string }> = [
  // Settlements
  { subtype: 'hamlet', group: 'Settlement', description: 'Small rural settlement' },
  { subtype: 'town', group: 'Settlement', description: 'Medium-sized trading settlement' },
  { subtype: 'city', group: 'Settlement', description: 'Large urban center' },
  { subtype: 'capital', group: 'Settlement', description: 'Major seat of power' },
  // Infrastructure
  { subtype: 'camp', group: 'Infrastructure', description: 'Temporary or semi-permanent camp' },
  { subtype: 'farmland', group: 'Infrastructure', description: 'Agricultural land' },
  // Military
  { subtype: 'castle', group: 'Military', description: 'Fortified stronghold' },
  { subtype: 'fort', group: 'Military', description: 'Military fortification' },
  { subtype: 'tower', group: 'Military', description: 'Watchtower or wizard tower' },
  { subtype: 'military_outpost', group: 'Military', description: 'Frontier military outpost' },
  // Religious
  { subtype: 'shrine', group: 'Religious', description: 'Small place of worship' },
  { subtype: 'temple', group: 'Religious', description: 'Major place of worship' },
  // Resource
  { subtype: 'mining', group: 'Resource', description: 'Mining operation' },
  // Ruins
  { subtype: 'ruins', group: 'Ruins', description: 'Generic ruins' },
  { subtype: 'ruined_tower', group: 'Ruins', description: 'Collapsed tower' },
  { subtype: 'ruined_city', group: 'Ruins', description: 'Fallen city' },
  { subtype: 'ruined_village', group: 'Ruins', description: 'Abandoned village' },
  // Wilderness Interest
  { subtype: 'battleground', group: 'Wilderness Interest', description: 'Site of past conflict' },
  { subtype: 'oasis', group: 'Wilderness Interest', description: 'Water source in arid terrain' },
  { subtype: 'unexplored_poi', group: 'Wilderness Interest', description: 'Unknown point of interest' },
  { subtype: 'cavern', group: 'Wilderness Interest', description: 'Mountains/Hills cave system' },
  { subtype: 'grove', group: 'Wilderness Interest', description: 'Ancient or sacred forest grove' },
  { subtype: 'hot_spring', group: 'Wilderness Interest', description: 'Geothermal feature' },
  { subtype: 'shipwreck', group: 'Wilderness Interest', description: 'Wrecked vessel on coast' },
  { subtype: 'ancient_road', group: 'Wilderness Interest', description: 'Remnant infrastructure from historical cultures' },
  { subtype: 'monument', group: 'Wilderness Interest', description: 'Ancestral tomb, stone monolith, burial mound' },
  // Sphere-Resonant Wonders
  { subtype: 'healing_spring', group: 'Sphere Wonder', description: 'Life + Spirit — land itself mends what\'s broken' },
  { subtype: 'master_forge', group: 'Sphere Wonder', description: 'Matter + Force — craft reaching the sacred' },
  { subtype: 'living_archive', group: 'Sphere Wonder', description: 'Mind + Spirit — repository that curates itself' },
  { subtype: 'fey_crossing', group: 'Sphere Wonder', description: 'Spirit + Chaos — where the veil is thin' },
  { subtype: 'sacrifice_site', group: 'Sphere Wonder', description: 'Entropy + Darkness — blood-soaked ground of power' },
  { subtype: 'convergence', group: 'Sphere Wonder', description: 'Force + all — power accumulates, draws conflict' },
  { subtype: 'time_scar', group: 'Sphere Wonder', description: 'Time + Entropy — wound in time, echoes bleed through' },
  { subtype: 'standing_stones', group: 'Sphere Wonder', description: 'Order + Time — ancient megaliths' },
  { subtype: 'shadow_hollow', group: 'Sphere Wonder', description: 'Darkness + Entropy — where magic went wrong' },
  { subtype: 'ley_nexus', group: 'Sphere Wonder', description: 'Energy + Light — raw magical convergence' },
  // Natural Anomalies (economy/treasure)
  { subtype: 'gem_deposit', group: 'Natural Anomaly', description: 'Precious stones in hills/mountains' },
  { subtype: 'golden_grove', group: 'Natural Anomaly', description: 'Trees bearing amber/gold sap' },
  { subtype: 'crystal_cavern', group: 'Natural Anomaly', description: 'Resonant crystal formations' },
  { subtype: 'ancient_vault', group: 'Natural Anomaly', description: 'Sealed pre-collapse treasury' },
  { subtype: 'sunken_treasury', group: 'Natural Anomaly', description: 'Submerged wealth from lost civilization' },
  { subtype: 'herb_garden', group: 'Natural Anomaly', description: 'Wild medicinal plants' },
  { subtype: 'fossil_bed', group: 'Natural Anomaly', description: 'Ancient bones with residual magic' },
  { subtype: 'iron_seep', group: 'Natural Anomaly', description: 'Surface metal deposit' },
  { subtype: 'pearl_shoal', group: 'Natural Anomaly', description: 'Natural pearl beds' },
  { subtype: 'glowcap_hollow', group: 'Natural Anomaly', description: 'Bioluminescent fungi' },
  // Monster/Danger
  { subtype: 'nest', group: 'Monster/Danger', description: 'Ecosystem-scale creature hive' },
  { subtype: 'haunted_ground', group: 'Monster/Danger', description: 'Restless spirits' },
  { subtype: 'corruption_zone', group: 'Monster/Danger', description: 'Spreading wrongness' },
  { subtype: 'lair', group: 'Monster/Danger', description: 'Monster lair' },
  { subtype: 'cleared_lair', group: 'Monster/Danger', description: 'Lair cleared by a faction' },
  // Default
  { subtype: 'wilderness', group: 'Default', description: 'No overlay — open land' },
];

const LOCATION_GROUP_COLORS: Record<string, string> = {
  'Settlement':         '#166534',
  'Infrastructure':     '#92400e',
  'Military':           '#b91c1c',
  'Religious':          '#581c87',
  'Resource':           '#57534e',
  'Ruins':              '#78350f',
  'Wilderness Interest':'#134e4a',
  'Sphere Wonder':      '#4338ca',
  'Natural Anomaly':    '#0e7490',
  'Monster/Danger':     '#991b1b',
  'Default':            '#525252',
};

// ── The Registry ─────────────────────────────────────────────────

export const CONTENT_REGISTRY: ContentRegistryEntry[] = [
  // ─── World & Geography ──────────────────────────────────────
  {
    id: 'region-name-fragments',
    label: 'Region Name Fragments',
    category: 'World & Geography',
    description: 'Procedural name components (nouns, suffixes, adjectives) per region feature type.',
    data: REGION_NAME_FRAGMENTS,
    viewer: 'record',
    sourceFile: 'src/data/region-name-content.ts',
  },
  {
    id: 'resource-definitions',
    label: 'Resources',
    category: 'World & Geography',
    description: '11 resource types with terrain eligibility, base quantities, sphere affinities, and renewal rates.',
    data: recordToArray(RESOURCE_DEFINITIONS),
    viewer: 'table',
    columns: [
      { key: 'value.id', label: 'ID' },
      { key: 'value.name', label: 'Name' },
      { key: 'value.terrains', label: 'Terrains', render: 'tags' },
      { key: 'value.baseQuantity', label: 'Base Qty', render: 'json' },
      { key: 'value.sphereAffinities', label: 'Spheres', render: 'tags' },
      { key: 'value.renewable', label: 'Renewable', render: 'boolean' },
      { key: 'value.renewalRate', label: 'Rate', render: 'number' },
    ],
    searchFields: ['value.id', 'value.name'],
    sourceFile: 'src/data/resource-content.ts',
  },

  // ─── Terrain ───────────────────────────────────────────────
  {
    id: 'terrain-name-roots',
    label: 'Terrain Name Roots',
    category: 'Terrain',
    description: 'Core name root words by terrain type, used in procedural location naming. E.g. forest → "Wood/Thorn/Oak".',
    data: { ...TERRAIN_NAME_ROOTS, _default: DEFAULT_ROOTS },
    viewer: 'record',
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'terrain-settlement-weights',
    label: 'Settlement Spawn Weights',
    category: 'Terrain',
    description: 'Weighted probability of settlement subtypes spawning per terrain type during world generation.',
    data: TERRAIN_SETTLEMENT_WEIGHTS,
    viewer: 'record',
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'terrain-transformations',
    label: 'Terrain Transformations',
    category: 'Terrain',
    description: 'Corruption and divine influence terrain transformations (from → to).',
    data: TERRAIN_TRANSFORMATIONS,
    viewer: 'table',
    columns: [
      { key: 'from', label: 'From Terrain' },
      { key: 'to', label: 'To Terrain' },
      { key: 'trigger', label: 'Trigger', render: 'badge' },
    ],
    searchFields: ['from', 'to', 'trigger'],
    sourceFile: 'src/data/terrain-transformation-content.ts',
  },
  {
    id: 'terrain-movement-costs',
    label: 'Movement Costs',
    category: 'Terrain',
    description: 'Terrain movement tax multipliers (0=easy, Infinity=impassable).',
    data: TERRAIN_TAXES,
    viewer: 'record',
    sourceFile: 'src/data/movement-content.ts',
  },
  {
    id: 'terrain-modifiers',
    label: 'Terrain Modifiers',
    category: 'Terrain',
    description: 'Per-terrain modifiers for line-of-sight range, prosperity, defensibility.',
    data: TERRAIN_MODIFIERS,
    viewer: 'record',
    sourceFile: 'src/data/terrain-modifiers.ts',
  },
  // ─── Locations & Sublocations ───────────────────────────────
  {
    id: 'location-names',
    label: 'Location Name Pool',
    category: 'Locations & Sublocations',
    description: `${LOCATION_NAMES.length} handcrafted names used for the first locations during world seeding; later locations use procedural generation.`,
    data: LOCATION_NAMES.map((n, i) => ({ index: i, name: n })),
    viewer: 'table',
    columns: [
      { key: 'index', label: '#', render: 'number' },
      { key: 'name', label: 'Name' },
    ],
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'location-name-prefixes',
    label: 'Location Name Prefixes',
    category: 'Locations & Sublocations',
    description: 'Procedural name prefixes by location subtype (35% chance to appear). E.g. hamlet → "Little/Old", city → "Grand/Royal".',
    data: LOCATION_PREFIXES,
    viewer: 'record',
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'location-name-suffixes',
    label: 'Location Name Suffixes',
    category: 'Locations & Sublocations',
    description: 'Procedural name suffixes by location subtype. E.g. hamlet → "bury/ton/wick", city → "city/polis/haven".',
    data: LOCATION_SUFFIXES,
    viewer: 'record',
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'sublocation-map',
    label: 'Sublocation Map',
    category: 'Locations & Sublocations',
    description: '17 location subtypes → 12 sublocation types with motivational alignment weights.',
    data: SUBTYPE_SUBLOCATION_MAP,
    viewer: 'tree',
    sourceFile: 'src/engine/sublocation.ts',
  },

  // ─── Encounters ─────────────────────────────────────────────
  {
    id: 'encounter-templates',
    label: 'Exploration Encounters',
    category: 'Encounters',
    description: '64 encounter templates with multi-step sequences, reach requirements, and threat ratings.',
    data: ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
      { key: 'reachPrimary', label: 'Primary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'reachSecondary', label: 'Secondary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'locationTypes', label: 'Locations', render: 'tags' },
      { key: 'steps.length', label: 'Steps', render: 'number' },
      { key: 'questPriority', label: 'Priority', render: 'number' },
      { key: 'requiredTraits', label: 'Req. Traits', render: 'json' },
      { key: 'blockedByTraits', label: 'Blocked By', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'encounterType', 'threatRating'],
    sourceFile: 'src/data/encounter-content.ts',
  },
  {
    id: 'social-encounter-templates',
    label: 'Social Encounters',
    category: 'Encounters',
    description: '14 social encounter templates targeting settlements and factions.',
    data: SOCIAL_ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'crudType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'rarityTier', label: 'Rarity', render: 'number' },
      { key: 'reach', label: 'Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'locationSubtypes', label: 'Locations', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'crudType'],
    sourceFile: 'src/data/social-encounter-content.ts',
  },
  {
    id: 'encounter-difficulty-tiers',
    label: 'Difficulty Tiers',
    category: 'Encounters',
    description: 'Early/mid/late difficulty multipliers and tone adjectives.',
    data: ENCOUNTER_DIFFICULTY_TIERS,
    viewer: 'record',
    sourceFile: 'src/data/encounter-content.ts',
  },
  {
    id: 'colocation-constants',
    label: 'Colocation Detection',
    category: 'Encounters',
    description: 'Base detection chances and perception/stealth weights for encounter triggering.',
    data: constants(
      ['ENCOUNTER_BASE_CHANCE_HEX', colocation.ENCOUNTER_BASE_CHANCE_HEX, 'Base discovery chance per tick for agents in the same hex'],
      ['ENCOUNTER_BASE_CHANCE_LOCATION', colocation.ENCOUNTER_BASE_CHANCE_LOCATION, 'Base discovery chance at same location'],
      ['ENCOUNTER_BASE_CHANCE_SUBLOCATION', colocation.ENCOUNTER_BASE_CHANCE_SUBLOCATION, 'Base discovery chance at same sublocation'],
      ['EYE_PERCEPTION_WEIGHT', colocation.EYE_PERCEPTION_WEIGHT, 'Eye domain contribution to perception'],
      ['SHADOW_STEALTH_WEIGHT', colocation.SHADOW_STEALTH_WEIGHT, 'Shadow domain contribution to stealth'],
      ['DETECTION_CHANCE_FLOOR', colocation.DETECTION_CHANCE_FLOOR, 'Minimum detection probability'],
      ['DETECTION_CHANCE_CEILING', colocation.DETECTION_CHANCE_CEILING, 'Maximum detection probability'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/colocation-content.ts',
  },

  // ─── Actions ────────────────────────────────────────────────
  {
    id: 'action-templates',
    label: 'Action Templates',
    category: 'Actions',
    description: '36 action templates (4 per reach x 9 reaches) with CRUD types, motivations, and narrative.',
    data: ACTION_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'reach', label: 'Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'crudType', label: 'CRUD', render: 'badge' },
      { key: 'rarityTier', label: 'Rarity', render: 'number' },
      { key: 'difficulty', label: 'Difficulty', render: 'number' },
      { key: 'durationRange', label: 'Duration', render: 'json' },
      { key: 'sphereAffinity', label: 'Sphere', render: 'badge' },
      { key: 'motivations', label: 'Motivations', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'reach', 'crudType'],
    sourceFile: 'src/data/action-template-content.ts',
  },

  // ─── Agents & Archetypes ────────────────────────────────────
  {
    id: 'narrative-archetypes',
    label: 'Narrative Archetypes',
    category: 'Agents & Archetypes',
    description: '19 narrative archetypes with story shapes, tone keywords, and reach affinities.',
    data: NARRATIVE_ARCHETYPES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'storyShape', label: 'Story Shape' },
      { key: 'proseTone', label: 'Tone' },
      { key: 'reachAffinities', label: 'Reaches', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'storyShape'],
    sourceFile: 'src/data/archetype-content.ts',
  },
  {
    id: 'ambition-templates',
    label: 'Ambition Templates',
    category: 'Agents & Archetypes',
    description: '10 standard + 4 reactive ambition templates with milestones and completion criteria.',
    data: [...AMBITION_TEMPLATES],
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'displayName', label: 'Name' },
      { key: 'category', label: 'Category', render: 'badge' },
      { key: 'sphereAffinities', label: 'Spheres', render: 'tags' },
      { key: 'milestones.length', label: 'Milestones', render: 'number' },
    ],
    searchFields: ['id', 'displayName', 'category'],
    sourceFile: 'src/data/ambition-templates.ts',
  },

  // ─── Culture & Society ──────────────────────────────────────
  {
    id: 'foundation-modifiers',
    label: 'Foundation Modifiers',
    category: 'Culture & Society',
    description: '4 foundation sphere modifiers (Chaos/Order/Light/Darkness) — social structure, accountability, keywords.',
    data: FOUNDATION_MODIFIERS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'socialStructure', label: 'Social Structure' },
      { key: 'accountability', label: 'Accountability' },
      { key: 'behavioralKeywords', label: 'Keywords', render: 'tags' },
    ],
    searchFields: ['id', 'socialStructure'],
    sourceFile: 'src/data/culture-content.ts',
  },
  {
    id: 'creation-sphere-modifiers',
    label: 'Creation Sphere Modifiers',
    category: 'Culture & Society',
    description: '8 creation sphere modifiers — behavioral coloring, material vocabulary, trait seeds.',
    data: CREATION_SPHERE_MODIFIERS,
    viewer: 'table',
    columns: [
      { key: 'sphere', label: 'Sphere', render: 'badge' },
      { key: 'behavioralColoring', label: 'Behavioral Coloring' },
      { key: 'behavioralKeywords', label: 'Keywords', render: 'tags' },
      { key: 'materialVocabulary', label: 'Material Vocab', render: 'tags' },
    ],
    searchFields: ['sphere', 'behavioralColoring'],
    sourceFile: 'src/data/culture-content.ts',
  },
  {
    id: 'biome-modifiers',
    label: 'Biome Modifiers',
    category: 'Culture & Society',
    description: '22+ terrain-based culture modifiers — survival traits, material culture, metaphor palette.',
    data: BIOME_MODIFIERS,
    viewer: 'table',
    columns: [
      { key: 'terrain', label: 'Terrain' },
      { key: 'survivalTraitKeywords', label: 'Survival Traits', render: 'tags' },
      { key: 'materialCulture', label: 'Material Culture', render: 'tags' },
      { key: 'metaphorPalette', label: 'Metaphors', render: 'tags' },
    ],
    searchFields: ['terrain'],
    sourceFile: 'src/data/culture-content.ts',
  },
  {
    id: 'formative-trait-seeds',
    label: 'Formative Trait Seeds',
    category: 'Traits',
    description: 'Cultural formative trait templates that shape agent identity at birth.',
    data: FORMATIVE_TRAIT_SEEDS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/culture-content.ts',
  },
  {
    id: 'behavioral-trait-seeds',
    label: 'Behavioral Trait Seeds',
    category: 'Traits',
    description: 'Cultural behavioral trait templates that influence agent decisions.',
    data: BEHAVIORAL_TRAIT_SEEDS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/culture-content.ts',
  },
  {
    id: 'historical-culture-templates',
    label: 'Historical Cultures',
    category: 'Culture & Society',
    description: 'Historical culture templates that shape region naming and territorial identity.',
    data: HISTORICAL_CULTURE_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'foundationBias', label: 'Foundation Bias' },
      { key: 'sphereAffinities', label: 'Sphere Affinities', render: 'tags' },
      { key: 'biomePreference', label: 'Biome Pref', render: 'tags' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/historical-culture-content.ts',
  },
  {
    id: 'settlement-roots-foundation',
    label: 'Settlement Name Roots (Foundation)',
    category: 'Culture & Society',
    description: 'Culture-flavored name roots for settlements, keyed by foundation bias. ~40% chance to replace terrain root.',
    data: SETTLEMENT_ROOTS_BY_FOUNDATION,
    viewer: 'record',
    sourceFile: 'src/data/culture-name-pools.ts',
  },
  {
    id: 'settlement-roots-sphere',
    label: 'Settlement Name Roots (Sphere)',
    category: 'Culture & Society',
    description: 'Culture-flavored name roots for settlements, keyed by creation sphere. Combined with foundation roots.',
    data: SETTLEMENT_ROOTS_BY_SPHERE,
    viewer: 'record',
    sourceFile: 'src/data/culture-name-pools.ts',
  },
  {
    id: 'settlement-suffixes-foundation',
    label: 'Settlement Name Suffixes (Foundation)',
    category: 'Culture & Society',
    description: 'Culture-flavored name suffixes for settlements, keyed by foundation bias. ~30% chance to replace subtype suffix.',
    data: SETTLEMENT_SUFFIXES_BY_FOUNDATION,
    viewer: 'record',
    sourceFile: 'src/data/culture-name-pools.ts',
  },

  // Phonetic pools (THR-15)
  {
    id: 'phonetic-vowels-by-foundation',
    label: 'Phonetic Vowel Pools (Foundation)',
    category: 'Culture & Society',
    description: 'Master vowel inventory by foundation bias. Each culture draws 3–5 vowels from its foundation pool.',
    data: VOWEL_MASTER_LIST_BY_FOUNDATION,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },
  {
    id: 'phonetic-consonants-by-sphere',
    label: 'Phonetic Consonant Pools (Sphere)',
    category: 'Culture & Society',
    description: 'Master consonant inventory by creation sphere. Drives onset and coda selection for each culture.',
    data: CONSONANT_MASTER_LIST_BY_SPHERE,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },
  {
    id: 'phonetic-consonant-bias-foundation',
    label: 'Phonetic Consonant Bias (Foundation)',
    category: 'Culture & Society',
    description: 'Foundation-specific onset consonant bias injected on top of sphere consonants.',
    data: FOUNDATION_CONSONANT_BIAS,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },
  {
    id: 'phonetic-name-suffixes-foundation',
    label: 'Phonetic Name Suffixes (Foundation)',
    category: 'Culture & Society',
    description: 'Personal name morphological suffixes by foundation bias. Culture picks 3 at signature build time.',
    data: NAME_SUFFIXES_BY_FOUNDATION,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },
  {
    id: 'phonetic-settlement-suffixes-foundation',
    label: 'Phonetic Settlement Suffixes (Foundation)',
    category: 'Culture & Society',
    description: 'Settlement name suffixes for phonetic generator, by foundation. Culture picks 2 at build time.',
    data: SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },
  {
    id: 'phonetic-syllable-templates-foundation',
    label: 'Phonetic Syllable Templates (Foundation)',
    category: 'Culture & Society',
    description: 'Syllable template pools per foundation (CV/CVC/VC/CVV/CVVC). Culture picks 2–3 at signature build time.',
    data: SYLLABLE_TEMPLATE_BIAS_BY_FOUNDATION,
    viewer: 'record',
    sourceFile: 'src/data/culture-phonetic-pools.ts',
  },

  // ─── Cosmology & Divine ─────────────────────────────────────
  {
    id: 'ascendant-titles',
    label: 'Ascendant Titles',
    category: 'Cosmology & Divine',
    description: 'Archetype title variants per Creation Sphere (~8 titles per sphere).',
    data: ARCHETYPE_TITLES,
    viewer: 'record',
    sourceFile: 'src/data/ascendant-content.ts',
  },
  {
    id: 'court-structures',
    label: 'Court Structures',
    category: 'Cosmology & Divine',
    description: '4 divine court types (high_house, circle, web, abyss) with position counts and bonuses.',
    data: COURT_STRUCTURES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'structureType', label: 'Type', render: 'badge' },
      { key: 'name', label: 'Name' },
      { key: 'foundationAffinity', label: 'Foundation' },
      { key: 'description', label: 'Description' },
    ],
    searchFields: ['id', 'structureType', 'name'],
    sourceFile: 'src/data/scry-content.ts',
  },
  {
    id: 'influence-tiers',
    label: 'Influence Tiers',
    category: 'Cosmology & Divine',
    description: 'Tier names, maintenance costs, and promotion thresholds for divine influence.',
    data: constants(
      ...Object.entries(TIER_NAMES).map(([k, v]) => [`TIER_NAMES[${k}]`, v, `Tier ${k} display name`] as [string, unknown, string]),
      ...Object.entries(TIER_MAINTENANCE).map(([k, v]) => [`TIER_MAINTENANCE[${k}]`, v, `Tier ${k} maintenance cost/tick`] as [string, unknown, string]),
      ...Object.entries(TIER_PROMOTION_THRESHOLDS).map(([k, v]) => [`TIER_PROMOTION[${k}]`, v, `Ticks to promote to tier ${k}`] as [string, unknown, string]),
    ),
    viewer: 'constants',
    sourceFile: 'src/data/influence-content.ts',
  },
  {
    id: 'agenda-templates',
    label: 'Agenda Templates',
    category: 'Cosmology & Divine',
    description: 'Agenda templates per intervention type (~44 total) for divine personality shaping.',
    data: AGENDA_TEMPLATES,
    viewer: 'record',
    sourceFile: 'src/data/agenda-content.ts',
  },
  {
    id: 'manipulation-definitions',
    label: 'Manipulations',
    category: 'Cosmology & Divine',
    description: 'Dream manipulation types (whisper, inspire, suppress, reshape, etc.) with tier costs and probabilities.',
    data: MANIPULATION_DEFINITIONS,
    viewer: 'record',
    sourceFile: 'src/data/dream-content.ts',
  },
  {
    id: 'intervention-definitions',
    label: 'Interventions',
    category: 'Cosmology & Divine',
    description: 'Divine intervention types with costs, effects, and delivery ranges.',
    data: INTERVENTION_DEFINITIONS,
    viewer: 'record',
    sourceFile: 'src/data/dream-content.ts',
  },
  {
    id: 'fundament-descriptions',
    label: 'World-Soul Descriptions',
    category: 'Cosmology & Divine',
    description: 'High/low expression descriptions for all 12 spheres (4 Foundation + 8 Creation).',
    data: FUNDAMENT_DESCRIPTIONS,
    viewer: 'record',
    sourceFile: 'src/data/worldsoul-content.ts',
  },

  // ─── Rivals & Opposition ────────────────────────────────────
  {
    id: 'foundation-opposition-matrix',
    label: 'Foundation Opposition Matrix',
    category: 'Rivals & Opposition',
    description: '4x4 opposition scores for Chaos/Order/Light/Darkness combinations.',
    data: FOUNDATION_OPPOSITION_MATRIX,
    viewer: 'record',
    sourceFile: 'src/data/opposition-content.ts',
  },
  {
    id: 'creation-sphere-tensions',
    label: 'Sphere Tensions',
    category: 'Rivals & Opposition',
    description: 'Creation sphere tension pairs with scores and narrative reasons.',
    data: CREATION_SPHERE_TENSIONS,
    viewer: 'table',
    columns: [
      { key: 'sphereA', label: 'Sphere A', render: 'badge' },
      { key: 'sphereB', label: 'Sphere B', render: 'badge' },
      { key: 'score', label: 'Score', render: 'number' },
      { key: 'narrativeReason', label: 'Narrative Reason' },
    ],
    sourceFile: 'src/data/opposition-content.ts',
  },
  {
    id: 'archetype-friction-pairs',
    label: 'Archetype Friction',
    category: 'Rivals & Opposition',
    description: '9 archetype friction pairs with scores and narrative reasons.',
    data: ARCHETYPE_FRICTION_PAIRS,
    viewer: 'table',
    columns: [
      { key: 'archetypeA', label: 'Archetype A' },
      { key: 'archetypeB', label: 'Archetype B' },
      { key: 'score', label: 'Score', render: 'number' },
      { key: 'narrativeReason', label: 'Narrative Reason' },
    ],
    sourceFile: 'src/data/opposition-content.ts',
  },

  // ─── Narrative & Prose ──────────────────────────────────────
  {
    id: 'sphere-vocabulary',
    label: 'Sphere Vocabulary',
    category: 'Narrative & Prose',
    description: 'Adjectives, verbs, and nouns per Creation/Foundation Sphere for prose generation.',
    data: SPHERE_VOCABULARY,
    viewer: 'record',
    sourceFile: 'src/data/narrative-content.ts',
  },
  {
    id: 'routine-templates',
    label: 'Routine Event Templates',
    category: 'Narrative & Prose',
    description: 'Prose templates for routine tick events (~80+ templates across 23 event types).',
    data: ROUTINE_TEMPLATES,
    viewer: 'prose',
    sourceFile: 'src/data/narrative-content.ts',
  },
  {
    id: 'notable-templates',
    label: 'Notable Event Templates',
    category: 'Narrative & Prose',
    description: 'Prose templates for notable/high-impact events with personality modifiers.',
    data: NOTABLE_TEMPLATES,
    viewer: 'prose',
    sourceFile: 'src/data/narrative-content.ts',
  },
  {
    id: 'chronicler-vignettes',
    label: 'Chronicler Vignettes',
    category: 'Narrative & Prose',
    description: 'Context-specific prose vignettes (location, agent, faction, sphere_dominance, etc.).',
    data: CHRONICLER_VIGNETTES,
    viewer: 'prose',
    sourceFile: 'src/data/chronicler-content.ts',
  },
  {
    id: 'sublocation-flavor',
    label: 'Sublocation Flavor',
    category: 'Narrative & Prose',
    description: 'Atmospheric descriptions for 14 sublocation types.',
    data: SUBLOCATION_FLAVOR,
    viewer: 'prose',
    sourceFile: 'src/data/chronicler-content.ts',
  },
  {
    id: 'artifact-lore',
    label: 'Artifact Lore',
    category: 'Narrative & Prose',
    description: '30 artifacts (5 per sphere) with lore prose.',
    data: ARTIFACT_LORE,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'sphere', label: 'Sphere', render: 'badge' },
      { key: 'prose', label: 'Lore' },
    ],
    searchFields: ['id', 'name', 'sphere'],
    sourceFile: 'src/data/chronicler-content.ts',
  },
  {
    id: 'location-type-flavor',
    label: 'Location Type Flavor',
    category: 'Narrative & Prose',
    description: 'Establishing shot prose per location type.',
    data: LOCATION_TYPE_FLAVOR,
    viewer: 'prose',
    sourceFile: 'src/data/chronicler-content.ts',
  },
  {
    id: 'biome-prose',
    label: 'Biome Prose',
    category: 'Narrative & Prose',
    description: 'Descriptive prose fragments per terrain type for the prose layer.',
    data: BIOME_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'subtype-establishing-prose',
    label: 'Subtype Establishing Prose',
    category: 'Narrative & Prose',
    description: 'Establishing shot prose per location subtype.',
    data: SUBTYPE_ESTABLISHING_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'terrain-openings',
    label: 'Terrain Opening Lines',
    category: 'Narrative & Prose',
    description: 'Opening prose variants per terrain type for hex vignettes.',
    data: TERRAIN_OPENINGS,
    viewer: 'prose',
    sourceFile: 'src/data/hex-vignette-content.ts',
  },
  {
    id: 'value-labels',
    label: 'Value Pair Labels',
    category: 'Narrative & Prose',
    description: 'Display labels for the 10 axiological value pairs.',
    data: VALUE_LABELS,
    viewer: 'record',
    sourceFile: 'src/data/strand-content.ts',
  },
  {
    id: 'fear-descriptions',
    label: 'Fear Descriptions',
    category: 'Narrative & Prose',
    description: 'Evocative fear prose per value pair for agent psychology.',
    data: FEAR_DESCRIPTIONS,
    viewer: 'prose',
    sourceFile: 'src/data/strand-content.ts',
  },
  {
    id: 'resonance-fragments',
    label: 'Resonance Fragment Prose',
    category: 'Narrative & Prose',
    description: 'Memory fragment prose for World-Soul metaprogression.',
    data: { fragments: RESONANCE_FRAGMENT_PROSE },
    viewer: 'prose',
    sourceFile: 'src/data/worldsoul-content.ts',
  },

  // ─── Configuration ──────────────────────────────────────────
  {
    id: 'game-tuning',
    label: 'Game Tuning (All Constants)',
    category: 'Configuration',
    description: 'Browse and edit every tunable game-design constant. Grouped by system with ranges, descriptions, and save-to-source.',
    data: TUNABLE_GROUPS,
    viewer: 'config-manager',
    sourceFile: 'src/components/CMS/tunableConstants.ts',
  },
  {
    id: 'game-config',
    label: 'Game Configuration',
    category: 'Configuration',
    description: 'Core game constants — doom ticks, mandate weights, twilight duration.',
    data: constants(
      ['DEFAULT_DOOM_TICKS', gameConfig.DEFAULT_DOOM_TICKS, 'Total ticks for a standard game length'],
      ['TWILIGHT_TICKS', gameConfig.TWILIGHT_TICKS, 'Ticks of twilight phase before game end'],
      ['MANDATE_PRIMARY_WEIGHT', gameConfig.MANDATE_PRIMARY_WEIGHT, 'Score weight for primary mandate conditions'],
      ['MANDATE_SECONDARY_WEIGHT', gameConfig.MANDATE_SECONDARY_WEIGHT, 'Score weight for secondary mandate conditions'],
      ['MANDATE_BASE_WEIGHT', gameConfig.MANDATE_BASE_WEIGHT, 'Base score weight for all mandate conditions'],
      ['MANDATE_ACHIEVABLE_MULTIPLIER', gameConfig.MANDATE_ACHIEVABLE_MULTIPLIER, 'Multiplier for achievable mandate conditions'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/game-config.ts',
  },
  {
    id: 'threat-constants',
    label: 'Threat Weights',
    category: 'Configuration',
    description: 'Weights for threat level calculation components.',
    data: constants(
      ['THREAT_FACTION_WEIGHT', threat.THREAT_FACTION_WEIGHT, 'Faction hostility contribution'],
      ['THREAT_HOSTILE_AGENT_WEIGHT', threat.THREAT_HOSTILE_AGENT_WEIGHT, 'Hostile agent contribution'],
      ['THREAT_ENCOUNTER_WEIGHT', threat.THREAT_ENCOUNTER_WEIGHT, 'Active encounter contribution'],
      ['THREAT_CULTURE_WEIGHT', threat.THREAT_CULTURE_WEIGHT, 'Cultural tension contribution'],
      ['HOSTILE_STRATEGY_THRESHOLD', threat.HOSTILE_STRATEGY_THRESHOLD, 'Cooperation score below which an agent is hostile'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/threat-content.ts',
  },
  {
    id: 'influence-constants',
    label: 'Influence Economy',
    category: 'Configuration',
    description: 'Essence generation rates, tier costs, and recruit/discover/observe costs.',
    data: constants(
      ['BASE_ESSENCE_PER_TICK', influence.BASE_ESSENCE_PER_TICK, 'Base essence generated per tick'],
      ['ESSENCE_PER_WORSHIPPER', influence.ESSENCE_PER_WORSHIPPER, 'Additional essence per worshipper per tick'],
      ['ESSENCE_PER_PLACE_OF_POWER', influence.ESSENCE_PER_PLACE_OF_POWER, 'Essence from each place of power per tick'],
      ['BASE_MAX_ESSENCE', influence.BASE_MAX_ESSENCE, 'Starting max essence capacity'],
      ['MAX_ESSENCE_PER_WORSHIPPER', influence.MAX_ESSENCE_PER_WORSHIPPER, 'Max essence increase per worshipper'],
      ['RECRUIT_COST', influence.RECRUIT_COST, 'Essence cost to recruit a new worshipper'],
      ['DISCOVER_COST', influence.DISCOVER_COST, 'Essence cost to discover an agent'],
      ['OBSERVE_COST', influence.OBSERVE_COST, 'Essence cost to observe an agent'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/influence-content.ts',
  },
  {
    id: 'agent-visual-constants',
    label: 'Agent Visual Constants',
    category: 'Configuration',
    description: 'Rendering constants for agent tokens, rings, trails, and domain colors.',
    data: constants(
      ['ZOOM_TOKEN_THRESHOLD', agentVisual.ZOOM_TOKEN_THRESHOLD, 'Zoom level above which agent tokens are shown'],
      ['MAX_RING_AGENTS', agentVisual.MAX_RING_AGENTS, 'Max agents displayed in location ring'],
      ['AGENT_DOT_RADIUS', agentVisual.AGENT_DOT_RADIUS, 'Radius of agent dot at low zoom'],
      ['AGENT_TOKEN_RADIUS', agentVisual.AGENT_TOKEN_RADIUS, 'Radius of agent token at high zoom'],
      ['AGENT_RING_RADIUS', agentVisual.AGENT_RING_RADIUS, 'Radius of the ring agents are placed on'],
      ['DEFAULT_AGENT_COLOR', agentVisual.DEFAULT_AGENT_COLOR, 'Fallback color when no domain dominates'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/agent-visual-content.ts',
  },

  // ─── Factions & Military ───────────────────────────────────
  {
    id: 'faction-definitions',
    label: 'Faction Definitions',
    category: 'Factions & Military',
    description: 'Core faction type definitions with ranks, roles, and behaviors.',
    data: Array.from(FACTION_DEFINITIONS.values()),
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type', render: 'badge' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/faction-definitions.ts',
  },
  {
    id: 'mercenary-company',
    label: 'Mercenary Company',
    category: 'Factions & Military',
    description: 'Mercenary company faction definition with ranks and roles.',
    data: MERCENARY_COMPANY_DEFINITION,
    viewer: 'record',
    sourceFile: 'src/data/mercenary-company-definition.ts',
  },
  {
    id: 'monster-factions',
    label: 'Monster Factions',
    category: 'Factions & Military',
    description: 'Monster faction definitions per creation sphere.',
    data: MONSTER_FACTION_DEFINITIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/monster-faction-definitions.ts',
  },

  // ─── Additional Encounters ─────────────────────────────────
  {
    id: 'faction-encounter-templates',
    label: 'Faction Encounters',
    category: 'Encounters',
    description: 'Encounter templates for faction interactions (join, promotion, social).',
    data: FACTION_ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
      { key: 'reachPrimary', label: 'Primary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
    ],
    searchFields: ['id', 'name', 'encounterType'],
    sourceFile: 'src/data/faction-encounter-content.ts',
  },
  {
    id: 'mercenary-encounter-templates',
    label: 'Mercenary Encounters',
    category: 'Encounters',
    description: 'Encounter templates for mercenary company interactions.',
    data: MERCENARY_ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
      { key: 'reachPrimary', label: 'Primary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
    ],
    searchFields: ['id', 'name', 'encounterType'],
    sourceFile: 'src/data/mercenary-encounter-content.ts',
  },
  {
    id: 'monster-encounter-templates',
    label: 'Monster Encounters',
    category: 'Encounters',
    description: 'Encounter templates for monster faction interactions.',
    data: MONSTER_ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
      { key: 'reachPrimary', label: 'Primary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
    ],
    searchFields: ['id', 'name', 'encounterType'],
    sourceFile: 'src/data/monster-encounter-content.ts',
  },
  {
    id: 'army-encounter-templates',
    label: 'Army Encounters',
    category: 'Encounters',
    description: 'Encounter templates for military army interactions.',
    data: ARMY_ENCOUNTER_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/army-encounter-content.ts',
  },
  {
    id: 'siege-spotlight-templates',
    label: 'Siege Spotlights',
    category: 'Encounters',
    description: 'Spotlight narrative templates for siege encounters.',
    data: SIEGE_SPOTLIGHT_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/siege-encounter-content.ts',
  },
  {
    id: 'siege-regional-templates',
    label: 'Siege Regional',
    category: 'Encounters',
    description: 'Regional narrative templates for siege effects.',
    data: SIEGE_REGIONAL_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/siege-encounter-content.ts',
  },
  {
    id: 'battle-spotlight-templates',
    label: 'Battle Spotlights',
    category: 'Encounters',
    description: 'Spotlight narrative templates for battle encounters.',
    data: BATTLE_SPOTLIGHT_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/battle-spotlight-content.ts',
  },

  // ─── Additional Actions ────────────────────────────────────
  {
    id: 'unified-action-templates',
    label: 'Unified Action Templates',
    category: 'Actions',
    description: 'Unified action template system combining standard and encounter actions.',
    data: UNIFIED_ACTION_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'scale', label: 'Scale', render: 'badge', badgeColors: ACTION_SCALE_COLORS },
      { key: 'reach', label: 'Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'crudType', label: 'CRUD', render: 'badge' },
      { key: 'essenceCost', label: 'Essence', render: 'number' },
      { key: 'targetCategories', label: 'Targets', render: 'tags' },
      { key: 'narrativeLayer', label: 'Layer', render: 'badge' },
    ],
    searchFields: ['id', 'name', 'reach', 'scale'],
    sourceFile: 'src/data/unified-action-templates.ts',
  },

  // ─── Additional Agents & Archetypes ────────────────────────
  {
    id: 'archetype-tone-overlays',
    label: 'Archetype Tone Overlays',
    category: 'Agents & Archetypes',
    description: 'Per-reach tone overlays with adjectives, verbs, and atmosphere for prose generation.',
    data: ARCHETYPE_TONE_OVERLAYS,
    viewer: 'record',
    sourceFile: 'src/data/archetype-tone-content.ts',
  },
  {
    id: 'archetype-strategy-weights',
    label: 'Archetype Strategy Weights',
    category: 'Agents & Archetypes',
    description: 'Game-theory cooperation strategy weights per archetype (hawk, dove, tit-for-tat, etc.).',
    data: ARCHETYPE_STRATEGY_WEIGHTS,
    viewer: 'record',
    sourceFile: 'src/data/game-theory-content.ts',
  },
  {
    id: 'dilemma-templates',
    label: 'Dilemma Templates',
    category: 'Agents & Archetypes',
    description: 'Dilemma choice templates for agent meeting events.',
    data: DILEMMA_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/meeting-content.ts',
  },
  {
    id: 'god-given-traits',
    label: 'God-Given Traits',
    category: 'Traits',
    description: 'Divine trait options available during agent creation meetings — one per reach.',
    data: GOD_GIVEN_TRAITS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'reach', label: 'Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
    ],
    searchFields: ['id', 'name', 'description', 'reach'],
    sourceFile: 'src/data/meeting-content.ts',
  },

  // ─── Economy & Trade ───────────────────────────────────────
  {
    id: 'economic-trait-definitions',
    label: 'Economic Traits',
    category: 'Traits',
    description: 'Emergent traits from economic activity — mastery, reputation, scar, and condition types.',
    data: ECONOMIC_TRAIT_DEFINITIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.subcategory', label: 'Category', render: 'badge', badgeColors: TRAIT_CATEGORY_COLORS },
      { key: 'properties.domainContributions', label: 'Domain Effect', render: 'json' },
      { key: 'properties.description', label: 'Description' },
      { key: 'properties.visibility', label: 'Visibility', render: 'badge' },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.description'],
    sourceFile: 'src/data/economic-trait-content.ts',
  },
  {
    id: 'economic-chronicle-templates',
    label: 'Economic Chronicle Templates',
    category: 'Economy & Trade',
    description: 'Prose templates for economic events and guild/wealth milestones.',
    data: ECONOMIC_CHRONICLE_TEMPLATES,
    viewer: 'prose',
    sourceFile: 'src/data/economic-chronicle-content.ts',
  },

  // ─── Additional Cosmology & Divine ─────────────────────────
  {
    id: 'mandate-templates',
    label: 'Mandate Templates',
    category: 'Cosmology & Divine',
    description: 'Divine mandate definitions with conditions and scoring.',
    data: MANDATE_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type', render: 'badge' },
      { key: 'sphereAffinities', label: 'Spheres', render: 'tags' },
      { key: 'description', label: 'Description' },
    ],
    searchFields: ['id', 'name', 'description'],
    sourceFile: 'src/data/mandate-content.ts',
  },
  {
    id: 'doom-vocabulary',
    label: 'Doom Vocabulary',
    category: 'Cosmology & Divine',
    description: 'Archetype-specific doom narrative vocabulary (stages, escalation, metaphors).',
    data: DOOM_VOCABULARY,
    viewer: 'record',
    sourceFile: 'src/data/doom-content.ts',
  },
  {
    id: 'doom-stages',
    label: 'Doom Stage Names',
    category: 'Cosmology & Divine',
    description: 'Per-archetype stage names for doom progression.',
    data: DOOM_STAGE_NAMES,
    viewer: 'record',
    sourceFile: 'src/data/doom-content.ts',
  },
  {
    id: 'doom-thresholds',
    label: 'Doom Thresholds',
    category: 'Cosmology & Divine',
    description: 'Default doom progression thresholds.',
    data: DOOM_THRESHOLDS,
    viewer: 'record',
    sourceFile: 'src/data/doom-content.ts',
  },
  {
    id: 'agenda-consequence-templates',
    label: 'Agenda Consequences',
    category: 'Cosmology & Divine',
    description: 'Consequence message templates per intervention type and agenda category.',
    data: AGENDA_CONSEQUENCE_TEMPLATES,
    viewer: 'record',
    sourceFile: 'src/data/agenda-consequence-templates.ts',
  },
  {
    id: 'intervention-consequence-templates',
    label: 'Intervention Consequences',
    category: 'Cosmology & Divine',
    description: 'Consequence prose templates for divine intervention feedback.',
    data: INTERVENTION_CONSEQUENCES,
    viewer: 'prose',
    sourceFile: 'src/data/intervention-feedback-content.ts',
  },

  // ─── Additional Rivals & Opposition ────────────────────────
  {
    id: 'rival-personality-profiles',
    label: 'Rival Personality Profiles',
    category: 'Rivals & Opposition',
    description: 'Personality profiles defining rival god behavioral patterns.',
    data: RIVAL_PERSONALITY_PROFILES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/rival-content.ts',
  },
  {
    id: 'rival-action-templates',
    label: 'Rival Action Templates',
    category: 'Rivals & Opposition',
    description: 'Action prose templates per rival action type.',
    data: RIVAL_ACTION_TEMPLATES,
    viewer: 'prose',
    sourceFile: 'src/data/rival-content.ts',
  },

  // ─── Additional Narrative & Prose ──────────────────────────
  // Prose Layer (20 additional tables)
  {
    id: 'archetype-prose',
    label: 'Archetype Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments per archetype for the prose layer.',
    data: ARCHETYPE_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'agent-encounter-biography-prose',
    label: 'Agent Encounter Biography',
    category: 'Narrative & Prose',
    description: 'Biography prose fragments generated from agent encounter history.',
    data: AGENT_ENCOUNTER_BIOGRAPHY_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'location-encounter-history-prose',
    label: 'Location Encounter History',
    category: 'Narrative & Prose',
    description: 'Prose for locations based on their encounter history.',
    data: LOCATION_ENCOUNTER_HISTORY_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'culture-location-prose',
    label: 'Culture Location Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments for locations influenced by nearby cultures.',
    data: CULTURE_LOCATION_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'sphere-location-prose',
    label: 'Sphere Location Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments for locations influenced by creation spheres.',
    data: SPHERE_LOCATION_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'guild-identity-prose',
    label: 'Guild Identity Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments describing guild identity and culture.',
    data: GUILD_IDENTITY_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'faction-control-prose',
    label: 'Faction Control Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments for faction-controlled locations.',
    data: FACTION_CONTROL_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'disposition-prose',
    label: 'Disposition Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments describing agent dispositions and personality.',
    data: DISPOSITION_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'historical-culture-prose',
    label: 'Historical Culture Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments for historical culture influences on regions.',
    data: HISTORICAL_CULTURE_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'geographic-region-claimed-prose',
    label: 'Region Claimed Prose',
    category: 'Narrative & Prose',
    description: 'Prose for claimed/settled geographic regions.',
    data: GEOGRAPHIC_REGION_CLAIMED_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'geographic-region-wilderness-prose',
    label: 'Region Wilderness Prose',
    category: 'Narrative & Prose',
    description: 'Prose for unclaimed/wilderness geographic regions.',
    data: GEOGRAPHIC_REGION_WILDERNESS_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'trade-route-crossroads-prose',
    label: 'Trade Crossroads Prose',
    category: 'Narrative & Prose',
    description: 'Prose for trade route crossroads and junctions.',
    data: TRADE_ROUTE_CROSSROADS_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'trade-route-goods-prose',
    label: 'Trade Goods Prose',
    category: 'Narrative & Prose',
    description: 'Prose describing goods flowing through trade routes.',
    data: TRADE_ROUTE_GOODS_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'trade-route-status-prose',
    label: 'Trade Status Prose',
    category: 'Narrative & Prose',
    description: 'Prose for trade route operational status.',
    data: TRADE_ROUTE_STATUS_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'trade-route-volume-prose',
    label: 'Trade Volume Prose',
    category: 'Narrative & Prose',
    description: 'Prose describing trade route traffic volume.',
    data: TRADE_ROUTE_VOLUME_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'region-etymology-prose',
    label: 'Region Etymology Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments explaining the origins of region names.',
    data: REGION_ETYMOLOGY_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'population-prose',
    label: 'Population Prose',
    category: 'Narrative & Prose',
    description: 'Prose templates describing settlement population.',
    data: POPULATION_PROSE_TEMPLATES,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'wealth-prose',
    label: 'Wealth Prose',
    category: 'Narrative & Prose',
    description: 'Prose describing settlement wealth levels.',
    data: WEALTH_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'prosperity-prose',
    label: 'Prosperity Prose',
    category: 'Narrative & Prose',
    description: 'Prose templates for settlement prosperity descriptions.',
    data: PROSPERITY_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },
  {
    id: 'prosperity-terrain-prose',
    label: 'Prosperity Terrain Prose',
    category: 'Narrative & Prose',
    description: 'Terrain-specific prosperity prose fragments.',
    data: PROSPERITY_TERRAIN_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/prose-layer-content.ts',
  },

  // Backstory & Profile
  {
    id: 'backstory-prose',
    label: 'Backstory Prose',
    category: 'Narrative & Prose',
    description: '12 backstory prose tables (origins, bonds, fears, scars, arcs) for agent identity.',
    data: {
      surfaceOrigin: backstory.SURFACE_ORIGIN_PROSE,
      surfaceSphere: backstory.SURFACE_SPHERE_PROSE,
      traitOrigin: backstory.TRAIT_ORIGIN_PROSE,
      bondHistory: backstory.BOND_HISTORY_PROSE,
      bondHistoryNegative: backstory.BOND_HISTORY_NEGATIVE_PROSE,
      fear: backstory.FEAR_PROSE,
      hiddenMotive: backstory.HIDDEN_MOTIVE_PROSE,
      decisiveNature: backstory.DECISIVE_NATURE_PROSE,
      storyArc: backstory.STORY_ARC_PROSE,
      turningPoint: backstory.TURNING_POINT_PROSE,
      contradiction: backstory.CONTRADICTION_PROSE,
      divineTransformation: backstory.DIVINE_TRANSFORMATION_PROSE,
    },
    viewer: 'record',
    sourceFile: 'src/data/backstory-content.ts',
  },
  {
    id: 'profile-prose',
    label: 'Profile Prose',
    category: 'Narrative & Prose',
    description: 'Agent profile prose — origin, middle, closing templates and sphere flavor.',
    data: {
      originTemplates: profileProse.ORIGIN_TEMPLATES,
      middleTemplates: profileProse.MIDDLE_TEMPLATES,
      closingTemplates: profileProse.CLOSING_TEMPLATES,
      quoteTemplates: profileProse.QUOTE_TEMPLATES,
      sphereFlavor: profileProse.SPHERE_FLAVOR,
    },
    viewer: 'record',
    sourceFile: 'src/data/profile-content.ts',
  },

  // Journey
  {
    id: 'journey-beat-templates',
    label: 'Journey Beat Templates',
    category: 'Narrative & Prose',
    description: 'Narrative beat templates for agent journey events.',
    data: JOURNEY_BEAT_TEMPLATES,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    searchFields: ['id', 'name'],
    sourceFile: 'src/data/journey-content.ts',
  },

  // Hex & World Soul
  {
    id: 'hex-soul-prose',
    label: 'Hex Soul Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments per sphere for hex soul intensity levels.',
    data: { primary: SOUL_PROSE, secondary: SOUL_SECONDARY_PROSE, threat: SOUL_THREAT_PROSE },
    viewer: 'record',
    sourceFile: 'src/data/hexSoulProse.ts',
  },
  {
    id: 'world-soul-prose',
    label: 'World Soul Prose',
    category: 'Narrative & Prose',
    description: 'Prose fragments per sphere for World-Soul intensity levels.',
    data: WORLD_SOUL_PROSE,
    viewer: 'prose',
    sourceFile: 'src/data/worldSoulProse.ts',
  },

  // Domain Words & Quintessence
  {
    id: 'domain-word-scales',
    label: 'Domain Word Scales',
    category: 'Narrative & Prose',
    description: '5-tier word scales per reach domain for capability descriptions.',
    data: DOMAIN_WORD_SCALES,
    viewer: 'record',
    sourceFile: 'src/data/domain-words.ts',
  },
  {
    id: 'quintessence-lexicon',
    label: 'Quintessence Lexicon',
    category: 'Narrative & Prose',
    description: 'Vocabulary word pool for quintessence descriptions.',
    data: QUINTESSENCE_LEXICON.map((word: string, i: number) => ({ index: i, word })),
    viewer: 'table',
    columns: [
      { key: 'index', label: '#', render: 'number' },
      { key: 'word', label: 'Word' },
    ],
    searchFields: ['word'],
    sourceFile: 'src/data/quintessence-content.ts',
  },
  {
    id: 'quintessence-tooltips',
    label: 'Quintessence Tooltips',
    category: 'Narrative & Prose',
    description: 'Tooltip text for quintessence UI elements.',
    data: QUINTESSENCE_TOOLTIPS,
    viewer: 'record',
    sourceFile: 'src/data/quintessence-content.ts',
  },

  // ─── Additional Configuration ──────────────────────────────
  {
    id: 'attachment-tier-constants',
    label: 'Attachment Tier Constants',
    category: 'Attachments',
    description: 'Tier advancement costs, durations, and scaling factors.',
    data: constants(
      ['MAX_ATTACHMENT_TIER', attachmentTier.MAX_ATTACHMENT_TIER, 'Maximum attachment tier level'],
      ['TIER_MODIFIER_SCALE_FACTOR', attachmentTier.TIER_MODIFIER_SCALE_FACTOR, 'Modifier scaling per tier'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/attachment-tier-content.ts',
  },
  {
    id: 'trait-modifiers',
    label: 'LOS Trait Modifiers',
    category: 'Traits',
    description: 'Traits that modify line-of-sight range (eagle-eyed, night-blind, etc.).',
    data: LOS_TRAIT_DEFINITIONS,
    viewer: 'table',
    columns: [
      { key: 'traitId', label: 'Trait ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category', render: 'badge', badgeColors: TRAIT_CATEGORY_COLORS },
      { key: 'description', label: 'Description' },
      { key: 'modifiers', label: 'Modifiers', render: 'json' },
    ],
    searchFields: ['traitId', 'name', 'description'],
    sourceFile: 'src/data/trait-modifiers.ts',
  },
  {
    id: 'reward-bestowed-powers',
    label: 'Bestowed Powers',
    category: 'Attachments',
    description: 'Available bestowed power rewards for agents — divine gifts and supernatural abilities.',
    data: REWARD_BESTOWED_POWERS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.tier', label: 'Tier', render: 'number' },
      { key: 'properties.domainContributions', label: 'Domain Bonus', render: 'json' },
      { key: 'properties.description', label: 'Description' },
      { key: 'properties.visibility', label: 'Visibility', render: 'badge' },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.description'],
    sourceFile: 'src/data/reward-attachment-catalog.ts',
  },
  {
    id: 'reward-conditions',
    label: 'Reward Conditions',
    category: 'Attachments',
    description: 'Available condition rewards for agents — wounds, diseases, blessings, and curses.',
    data: REWARD_CONDITIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.subcategory', label: 'Type', render: 'badge', badgeColors: ATTACHMENT_SUBCATEGORY_COLORS },
      { key: 'properties.tier', label: 'Tier', render: 'number' },
      { key: 'properties.domainContributions', label: 'Domain Effect', render: 'json' },
      { key: 'properties.description', label: 'Description' },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.description'],
    sourceFile: 'src/data/reward-attachment-catalog.ts',
  },
  {
    id: 'reward-possessions',
    label: 'Reward Possessions',
    category: 'Attachments',
    description: 'Available possession rewards for agents — weapons, armor, relics, and gear.',
    data: REWARD_POSSESSIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.subcategory', label: 'Subcategory', render: 'badge', badgeColors: POSSESSION_SUBCATEGORY_COLORS },
      { key: 'properties.tier', label: 'Tier', render: 'number' },
      { key: 'properties.mechanicalSummary', label: 'Effect' },
      { key: 'properties.lossCondition', label: 'Loss', render: 'badge', badgeColors: LOSS_CONDITION_COLORS },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.mechanicalSummary'],
    sourceFile: 'src/data/reward-attachment-catalog.ts',
  },
  {
    id: 'starter-possessions',
    label: 'Starter Possessions',
    category: 'Attachments',
    description: 'Initial possessions available for agent starting equipment.',
    data: STARTER_POSSESSIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.subcategory', label: 'Subcategory', render: 'badge', badgeColors: POSSESSION_SUBCATEGORY_COLORS },
      { key: 'properties.tier', label: 'Tier', render: 'number' },
      { key: 'properties.mechanicalSummary', label: 'Effect' },
      { key: 'properties.lossCondition', label: 'Loss', render: 'badge', badgeColors: LOSS_CONDITION_COLORS },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.mechanicalSummary'],
    sourceFile: 'src/data/starter-attachments.ts',
  },
  {
    id: 'starter-conditions',
    label: 'Starter Conditions',
    category: 'Attachments',
    description: 'Initial conditions available for agent starting state.',
    data: STARTER_CONDITIONS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'properties.subcategory', label: 'Type', render: 'badge', badgeColors: ATTACHMENT_SUBCATEGORY_COLORS },
      { key: 'properties.tier', label: 'Tier', render: 'number' },
      { key: 'properties.domainContributions', label: 'Domain Effect', render: 'json' },
      { key: 'properties.description', label: 'Description' },
      { key: 'properties.tags', label: 'Tags', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'properties.description'],
    sourceFile: 'src/data/starter-attachments.ts',
  },

  // ─── World Model Taxonomy ──────────────────────────────────
  {
    id: 'world-model-nodes',
    label: 'Taxonomy Nodes',
    category: 'World & Geography',
    description: '253 taxonomy/ontology nodes from world-model.json (spheres, reaches, terrains, traits, etc.).',
    data: worldModel.nodes,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'category', label: 'Category', render: 'badge' },
      { key: 'properties.label', label: 'Label' },
    ],
    searchFields: ['id', 'category', 'properties.label'],
    sourceFile: 'src/data/world-model.json',
  },
  {
    id: 'world-model-edges',
    label: 'Taxonomy Edges',
    category: 'World & Geography',
    description: '371 taxonomy relationship edges from world-model.json.',
    data: worldModel.edges,
    viewer: 'table',
    columns: [
      { key: 'type', label: 'Type', render: 'badge' },
      { key: 'source', label: 'Source' },
      { key: 'target', label: 'Target' },
    ],
    searchFields: ['type', 'source', 'target'],
    sourceFile: 'src/data/world-model.json',
  },

  // ─── Traits (additional) ──────────────────────────────────────
  {
    id: 'world-model-traits',
    label: 'World-Model Traits',
    category: 'Traits',
    description: '44 trait definition nodes from world-model.json — innate, mastery, reputation, scar, condition, destiny.',
    data: WORLD_MODEL_TRAITS,
    viewer: 'table',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category', render: 'badge', badgeColors: TRAIT_CATEGORY_COLORS },
      { key: 'description', label: 'Description' },
      { key: 'visibility', label: 'Visibility', render: 'badge' },
      { key: 'domains', label: 'Domains' },
      { key: 'acquisition', label: 'Acquisition' },
    ],
    searchFields: ['id', 'name', 'category', 'description'],
    sourceFile: 'src/data/world-model.json',
  },
  {
    id: 'narrative-lexicon',
    label: 'Narrative Lexicon',
    category: 'Traits',
    description: '10-tier narrative expression scale per reach domain (Frail → Cataclysmic, Destitute → Imperial, etc.).',
    data: NARRATIVE_LEXICON_ROWS,
    viewer: 'table',
    columns: [
      { key: 'reach', label: 'Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'tier0', label: 'T0' },
      { key: 'tier1', label: 'T1' },
      { key: 'tier2', label: 'T2' },
      { key: 'tier3', label: 'T3' },
      { key: 'tier4', label: 'T4' },
      { key: 'tier5', label: 'T5' },
      { key: 'tier6', label: 'T6' },
      { key: 'tier7', label: 'T7' },
      { key: 'tier8', label: 'T8' },
      { key: 'tier9', label: 'T9' },
    ],
    searchFields: ['reach'],
    sourceFile: 'src/types/traits.ts',
  },
  {
    id: 'trait-constants',
    label: 'Trait Constants',
    category: 'Traits',
    description: 'Tunable thresholds for trait acquisition, resolution bonuses, cultural strength, and decay.',
    data: constants(
      ['TRAIT_BONUS_CAP', TRAIT_BONUS_CAP, 'Max total trait bonus in encounter resolution'],
      ['TRAIT_PER_BONUS_CAP', TRAIT_PER_BONUS_CAP, 'Max bonus from a single trait in resolution'],
      ['ECON_TRAIT_TRADE_BARON_MIN_ROUTES', ECON_TRAIT_TRADE_BARON_MIN_ROUTES, 'Min trade routes for Trade Baron trait'],
      ['ECON_TRAIT_GUILD_SWORN_MIN_TICKS', ECON_TRAIT_GUILD_SWORN_MIN_TICKS, 'Min ticks of guild membership for Guild-Sworn'],
      ['ECON_TRAIT_BANKRUPT_WEALTH_FLOOR', ECON_TRAIT_BANKRUPT_WEALTH_FLOOR, 'Wealth floor that triggers Bankrupt'],
      ['ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS', ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS, 'Min smuggling encounters for Smuggler trait'],
      ['ECON_TRAIT_DEBT_LADEN_MIN_DEBTS', ECON_TRAIT_DEBT_LADEN_MIN_DEBTS, 'Min active debts for Debt-Laden'],
      ['ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS', ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS, 'Min funded constructions for Patron'],
      ['ECON_TRAIT_COIN_CURSED_MIN_LOSSES', ECON_TRAIT_COIN_CURSED_MIN_LOSSES, 'Min wealth-loss events for Coin-Cursed'],
      ['CULTURAL_STRENGTH_FANATICAL', CULTURAL_STRENGTH_THRESHOLDS.fanatical, 'Cultural strength threshold: fanatical expression'],
      ['CULTURAL_STRENGTH_STRONG', CULTURAL_STRENGTH_THRESHOLDS.strong, 'Cultural strength threshold: strong expression'],
      ['CULTURAL_STRENGTH_FADING', CULTURAL_STRENGTH_THRESHOLDS.fading, 'Cultural strength threshold: fading expression'],
      ['CULTURAL_STRENGTH_SILENT', CULTURAL_STRENGTH_THRESHOLDS.silent, 'Cultural strength threshold: zero contributions'],
    ),
    viewer: 'constants',
    sourceFile: 'src/data/economic-trait-content.ts',
  },

  // ─── NPCs ──────────────────────────────────────────────────────
  {
    id: 'npc-roles',
    label: 'NPC Roles',
    category: 'NPCs',
    description: `${NPC_ROLES.length} NPC roles with location assignments, faction assignments, and sublocation preferences.`,
    data: NPC_ROLE_ROWS,
    viewer: 'table',
    columns: [
      { key: 'role', label: 'Role', render: 'badge' },
      { key: 'locations', label: 'Location Types' },
      { key: 'factions', label: 'Faction Types' },
      { key: 'sublocation', label: 'Preferred Sublocation' },
    ],
    searchFields: ['role', 'locations', 'factions', 'sublocation'],
    sourceFile: 'src/types/npc.ts',
  },
  {
    id: 'npc-role-reaches',
    label: 'NPC Role → Reaches',
    category: 'NPCs',
    description: `${NPC_ROLES.length} NPC roles mapped to primary and secondary reach domains (all 56 permutations of 8 reaches).`,
    data: NPC_ROLE_REACH_ROWS,
    viewer: 'table',
    columns: [
      { key: 'role', label: 'Role', render: 'badge' },
      { key: 'primary', label: 'Primary Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'secondary', label: 'Secondary Reach', render: 'badge', badgeColors: REACH_BADGE_COLORS },
    ],
    searchFields: ['role', 'primary', 'secondary'],
    sourceFile: 'src/types/npc.ts',
  },
  {
    id: 'location-role-rosters',
    label: 'Location → NPC Rosters',
    category: 'NPCs',
    description: 'Which NPC roles spawn at each location subtype, with probability (0–1).',
    data: LOCATION_ROSTER_ROWS,
    viewer: 'table',
    columns: [
      { key: 'locationType', label: 'Location Type', render: 'badge' },
      { key: 'role', label: 'NPC Role' },
      { key: 'chance', label: 'Spawn Chance', render: 'number' },
    ],
    searchFields: ['locationType', 'role'],
    sourceFile: 'src/types/npc.ts',
  },
  {
    id: 'faction-role-rosters',
    label: 'Faction → NPC Rosters',
    category: 'NPCs',
    description: 'Which NPC roles are assigned to each faction type, with probability (0–1).',
    data: FACTION_ROSTER_ROWS,
    viewer: 'table',
    columns: [
      { key: 'factionType', label: 'Faction Type', render: 'badge' },
      { key: 'role', label: 'NPC Role' },
      { key: 'chance', label: 'Spawn Chance', render: 'number' },
    ],
    searchFields: ['factionType', 'role'],
    sourceFile: 'src/types/npc.ts',
  },
  {
    id: 'npc-name-pool',
    label: 'NPC Name Pool',
    category: 'NPCs',
    description: `${NPC_NAME_POOL.length} fallback names for NPC generation.`,
    data: NPC_NAME_POOL.map((name, i) => ({ index: i, name })),
    viewer: 'table',
    columns: [
      { key: 'index', label: '#', render: 'number' },
      { key: 'name', label: 'Name' },
    ],
    sourceFile: 'src/types/npc.ts',
  },
  {
    id: 'npc-constants',
    label: 'NPC Constants',
    category: 'NPCs',
    description: 'Spotlight promotion thresholds, importance scoring increments, and population caps.',
    data: constants(
      ['NOTABLE_THRESHOLD', NPC_CONSTANTS.NOTABLE_THRESHOLD, 'Importance score for ambient → notable promotion'],
      ['SPOTLIGHT_THRESHOLD', NPC_CONSTANTS.SPOTLIGHT_THRESHOLD, 'Importance score for notable → spotlight promotion'],
      ['SPOTLIGHT_MIN_EDGES', NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES, 'Min graph edges for spotlight promotion'],
      ['PROMOTE_ESSENCE_BASE', NPC_CONSTANTS.PROMOTE_ESSENCE_BASE, 'Base essence cost for player-driven promotion'],
      ['PROMOTE_IMPORTANCE_DISCOUNT', NPC_CONSTANTS.PROMOTE_IMPORTANCE_DISCOUNT, 'Importance discount on promotion cost'],
      ['IMPORTANCE_PLAYER_ACTION', NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION, 'Importance added by player targeting this NPC'],
      ['IMPORTANCE_ENCOUNTER_REFERENCE', NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE, 'Importance from encounter narrative reference'],
      ['IMPORTANCE_EDGE_CREATED', NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED, 'Importance from new graph edge'],
      ['IMPORTANCE_TRAIT_GAINED', NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED, 'Importance from trait acquisition'],
      ['IMPORTANCE_LOCATION_CONTESTED', NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED, 'Importance when location becomes contested'],
      ['MAX_NPCS_HAMLET', NPC_CONSTANTS.MAX_NPCS_HAMLET, 'Max NPCs generated for a hamlet'],
      ['MAX_NPCS_TOWN', NPC_CONSTANTS.MAX_NPCS_TOWN, 'Max NPCs generated for a town'],
      ['MAX_NPCS_CITY', NPC_CONSTANTS.MAX_NPCS_CITY, 'Max NPCs generated for a city'],
      ['WILDERNESS_NPC_CHANCE', NPC_CONSTANTS.WILDERNESS_NPC_CHANCE, 'Probability of wilderness hex notable NPC'],
    ),
    viewer: 'constants',
    sourceFile: 'src/types/npc.ts',
  },

  // ─── Location Subtypes ──────────────────────────────────────────
  {
    id: 'location-subtypes',
    label: 'Location Subtypes',
    category: 'Locations & Sublocations',
    description: `${LOCATION_SUBTYPE_CATALOG.length} location subtypes grouped by category: settlements, military, religious, ruins, wonders, anomalies, and monster/danger.`,
    data: LOCATION_SUBTYPE_CATALOG,
    viewer: 'table',
    columns: [
      { key: 'subtype', label: 'Subtype' },
      { key: 'group', label: 'Group', render: 'badge', badgeColors: LOCATION_GROUP_COLORS },
      { key: 'description', label: 'Description' },
    ],
    searchFields: ['subtype', 'group', 'description'],
    sourceFile: 'src/types/index.ts',
  },
];

// ── Derived: categories grouped from registry ────────────────────

/** Category order for sidebar display */
const CATEGORY_ORDER = [
  'World & Geography', 'Terrain', 'Locations & Sublocations', 'NPCs', 'Encounters', 'Actions',
  'Agents & Archetypes', 'Traits', 'Culture & Society', 'Factions & Military',
  'Economy & Trade', 'Cosmology & Divine', 'Rivals & Opposition',
  'Narrative & Prose', 'Attachments', 'Configuration',
];

export function getCategories(): ContentCategory[] {
  const map = new Map<string, ContentRegistryEntry[]>();
  for (const entry of CONTENT_REGISTRY) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(cat => ({
      id: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: cat,
      entries: map.get(cat)!,
    }));
}

export function getEntryById(id: string): ContentRegistryEntry | undefined {
  return CONTENT_REGISTRY.find(e => e.id === id);
}

/** Total browsable items across all entries */
export function getTotalItemCount(): number {
  let total = 0;
  for (const entry of CONTENT_REGISTRY) {
    if (Array.isArray(entry.data)) total += entry.data.length;
    else if (entry.data && typeof entry.data === 'object') total += Object.keys(entry.data).length;
  }
  return total;
}
