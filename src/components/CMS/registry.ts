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
import { TERRAIN_SETTLEMENT_WEIGHTS, LOCATION_NAMES } from '../../engine/worldSeed';
import { TERRAIN_TRANSFORMATIONS } from '../../data/terrain-transformation-content';
import { TERRAIN_TAXES } from '../../data/movement-content';
import { REGION_NAME_FRAGMENTS } from '../../data/region-name-content';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { TERRAIN_MODIFIERS } from '../../data/terrain-modifiers';

// Locations & Sublocations
import { SUBTYPE_SUBLOCATION_MAP } from '../../engine/sublocation';

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
import { BIOME_PROSE, SUBTYPE_ESTABLISHING_PROSE } from '../../data/prose-layer-content';
import { TERRAIN_OPENINGS } from '../../data/hex-vignette-content';
import { VALUE_LABELS, FEAR_DESCRIPTIONS } from '../../data/strand-content';

// Configuration
import * as threat from '../../data/threat-content';
import * as agentVisual from '../../data/agent-visual-content';
import * as gameConfig from '../../data/game-config';
import * as influence from '../../data/influence-content';
import { TUNABLE_GROUPS } from './tunableConstants';

// ── Reach domain badge colors (reused across viewers) ────────────
export const REACH_BADGE_COLORS: Record<string, string> = {
  iron: '#b91c1c', gold: '#ca8a04', shadow: '#6b21a8', veil: '#7c3aed',
  heart: '#be185d', eye: '#0891b2', stone: '#78716c', star: '#eab308', flesh: '#dc2626',
};

export const THREAT_BADGE_COLORS: Record<string, string> = {
  trivial: '#4ade80', easy: '#60a5fa', moderate: '#fbbf24', hard: '#f87171', deadly: '#d946ef',
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

// ── The Registry ─────────────────────────────────────────────────

export const CONTENT_REGISTRY: ContentRegistryEntry[] = [
  // ─── World & Geography ──────────────────────────────────────
  {
    id: 'terrain-settlement-weights',
    label: 'Terrain → Settlement Weights',
    category: 'World & Geography',
    description: 'Weighted probability of settlement subtypes spawning per terrain type during world generation.',
    data: TERRAIN_SETTLEMENT_WEIGHTS,
    viewer: 'record',
    sourceFile: 'src/engine/worldSeed.ts',
  },
  {
    id: 'terrain-transformations',
    label: 'Terrain Transformations',
    category: 'World & Geography',
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
    category: 'World & Geography',
    description: 'Terrain movement tax multipliers (0=easy, Infinity=impassable).',
    data: TERRAIN_TAXES,
    viewer: 'record',
    sourceFile: 'src/data/movement-content.ts',
  },
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
  {
    id: 'terrain-modifiers',
    label: 'Terrain Modifiers',
    category: 'World & Geography',
    description: 'Per-terrain modifiers for prosperity, defensibility, and trade.',
    data: TERRAIN_MODIFIERS,
    viewer: 'record',
    sourceFile: 'src/data/terrain-modifiers.ts',
  },
  {
    id: 'location-names',
    label: 'Location Name Pool',
    category: 'World & Geography',
    description: 'Static name pool used during world seeding.',
    data: LOCATION_NAMES.map((n, i) => ({ index: i, name: n })),
    viewer: 'table',
    columns: [
      { key: 'index', label: '#', render: 'number' },
      { key: 'name', label: 'Name' },
    ],
    sourceFile: 'src/engine/worldSeed.ts',
  },

  // ─── Locations & Sublocations ───────────────────────────────
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
      { key: 'encounterType', label: 'Type', render: 'badge', badgeColors: ENCOUNTER_TYPE_COLORS },
      { key: 'threatRating', label: 'Threat', render: 'badge', badgeColors: THREAT_BADGE_COLORS },
      { key: 'reachPrimary', label: 'Primary', render: 'badge', badgeColors: REACH_BADGE_COLORS },
      { key: 'locationTypes', label: 'Locations', render: 'tags' },
    ],
    searchFields: ['id', 'name', 'encounterType'],
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
      { key: 'difficulty', label: 'Difficulty', render: 'number' },
      { key: 'durationRange', label: 'Duration', render: 'json' },
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
    category: 'Culture & Society',
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
    category: 'Culture & Society',
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
];

// ── Derived: categories grouped from registry ────────────────────

/** Category order for sidebar display */
const CATEGORY_ORDER = [
  'World & Geography', 'Locations & Sublocations', 'Encounters', 'Actions',
  'Agents & Archetypes', 'Culture & Society', 'Cosmology & Divine',
  'Rivals & Opposition', 'Narrative & Prose', 'Configuration',
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
