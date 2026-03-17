/**
 * Prose Resolvers — graph-walking functions that produce ProseLayer fragments.
 *
 * Each resolver examines a location node and its connected graph to extract prose-layer
 * content from specialized tables. Resolvers are fail-soft: missing nodes, properties,
 * or content keys return empty arrays.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { ProseLayer } from '../types/prose';
import type { WorldGraph } from './graph';
import {
  BIOME_PROSE,
  CULTURE_LOCATION_PROSE,
  SPHERE_LOCATION_PROSE,
  SUBTYPE_ESTABLISHING_PROSE,
  FACTION_CONTROL_PROSE,
  POPULATION_PROSE_TEMPLATES,
  ARCHETYPE_PROSE,
  DISPOSITION_PROSE,
  HISTORICAL_CULTURE_PROSE,
  REGION_ETYMOLOGY_PROSE,
  PROSPERITY_PROSE,
  PROSPERITY_TERRAIN_PROSE,
  TERRAIN_PROSPERITY_CATEGORY,
  WEALTH_PROSE,
} from '../data/prose-layer-content';
import { getProsperityTier } from './phaseProsperity';
import { getWealthTier } from './wealth';
import { RESOURCE_PROSE } from '../data/resource-content';
import type { ResourceInstance } from '../types/resource';
import { getAbundanceLabel } from '../types/resource';

// ─── Seeded PRNG ─────────────────────────────────────────────────

/**
 * Mulberry32 seeded PRNG — deterministic, fast, used consistently across engine.
 * Same implementation as narrative.ts.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick a single template from a list using seeded PRNG.
 * Returns undefined if templates is empty.
 */
function pickTemplate(templates: string[], seed: number): string | undefined {
  if (templates.length === 0) return undefined;
  const rng = mulberry32(seed);
  return templates[Math.floor(rng() * templates.length)];
}

/**
 * Replace {placeholder} in text with value.
 */
function replacePlaceholder(text: string, placeholder: string, value: string): string {
  return text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
}

// ─── Resolvers ───────────────────────────────────────────────────

/**
 * subtypeResolver — location subtype establishing prose.
 * Priority: 100 (highest, defines what place this is)
 * Category: 'origin'
 */
export function subtypeResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const subtype = node.properties?.locationSubtype as string | undefined;
  if (!subtype) return [];

  const templates = SUBTYPE_ESTABLISHING_PROSE[subtype];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'name', node.name);

  return [
    {
      text,
      priority: 100,
      category: 'origin',
      source: 'subtypeResolver',
    },
  ];
}

/**
 * biomeResolver — location terrain/biome prose.
 * Priority: 90 (establishes atmosphere)
 * Category: 'atmosphere'
 */
export function biomeResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const terrain = node.properties?.terrain as string | undefined;
  if (!terrain) return [];

  const templates = BIOME_PROSE[terrain];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 90,
      category: 'atmosphere',
      source: 'biomeResolver',
    },
  ];
}

/**
 * cultureResolver — culture-affiliated location prose via belongs_to edge.
 * Priority: 80 (character)
 * Category: 'character'
 *
 * Location -> belongs_to -> Culture node
 * Reads cultureIdentity.foundationPair from culture.
 */
export function cultureResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Find outgoing belongs_to edges
  const edges = graph.getOutgoingEdges(nodeId, 'belongs_to');
  if (edges.length === 0) return [];

  // Get first culture edge (assume one belongs_to per location)
  const cultureEdge = edges[0];
  const cultureNode = graph.getNode(cultureEdge.target);
  if (!cultureNode) return [];

  // Extract foundationPair from cultureIdentity
  const cultureIdentity = cultureNode.properties?.cultureIdentity as
    | { foundationPair?: string }
    | undefined;
  if (!cultureIdentity?.foundationPair) return [];

  const templates = CULTURE_LOCATION_PROSE[cultureIdentity.foundationPair];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 80,
      category: 'character',
      source: 'cultureResolver',
    },
  ];
}

/**
 * sphereResolver — sphere influence prose.
 * Priority: 70 (atmosphere)
 * Category: 'atmosphere'
 *
 * Reads sphereInfluence from node, picks highest sphere above 0.3 threshold.
 */
export function sphereResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const sphereInfluence = node.properties?.sphereInfluence as Record<string, number> | undefined;
  if (!sphereInfluence) return [];

  const threshold = 0.3;

  // Find sphere with highest influence above threshold
  let topSphere: string | undefined;
  let topValue = threshold;

  for (const [sphere, value] of Object.entries(sphereInfluence)) {
    if (value > topValue) {
      topSphere = sphere;
      topValue = value;
    }
  }

  if (!topSphere) return [];

  const templates = SPHERE_LOCATION_PROSE[topSphere];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 70,
      category: 'atmosphere',
      source: 'sphereResolver',
    },
  ];
}

/**
 * factionResolver — faction control prose via incoming controls edge.
 * Priority: 60 (character)
 * Category: 'character'
 *
 * Faction -> controls -> Location (incoming edge)
 */
export function factionResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Find incoming controls edges (faction controls this location)
  const edges = graph.getIncomingEdges(nodeId, 'controls');
  if (edges.length === 0) return [];

  // Get first controlling faction
  const controlEdge = edges[0];
  const factionNode = graph.getNode(controlEdge.source);
  if (!factionNode) return [];

  const templates = FACTION_CONTROL_PROSE;
  if (templates.length === 0) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'faction', factionNode.name);

  return [
    {
      text,
      priority: 60,
      category: 'character',
      source: 'factionResolver',
    },
  ];
}

/**
 * populationResolver — inhabitants/notable residents prose via incoming located_at edges.
 * Priority: 50 (character)
 * Category: 'character'
 *
 * Individual -> located_at -> Location (incoming edge)
 * Picks up to 2 individuals, uses their name and narrativeArchetype (default 'wanderer').
 * Combines all into a single prose layer.
 */
export function populationResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Find incoming located_at edges
  const edges = graph.getIncomingEdges(nodeId, 'located_at');
  if (edges.length === 0) return [];

  // Collect individuals (actorType === 'individual')
  const individuals = [];
  for (const edge of edges) {
    const sourceNode = graph.getNode(edge.source);
    if (sourceNode && sourceNode.properties?.actorType === 'individual') {
      individuals.push(sourceNode);
    }
  }

  if (individuals.length === 0) return [];

  // Take up to 2 individuals
  const selected = individuals.slice(0, 2);

  // Build prose fragments for each
  const rng = mulberry32(seed);
  const fragments = selected.map((individual) => {
    const agentName = individual.name;
    const archetype = (individual.properties?.narrativeArchetype as string) || 'wanderer';

    const templates = POPULATION_PROSE_TEMPLATES;
    const template = templates[Math.floor(rng() * templates.length)];

    let text = replacePlaceholder(template, 'agent', agentName);
    text = replacePlaceholder(text, 'archetype', archetype);

    return text;
  });

  // Combine into single prose layer
  const combinedText = fragments.join(' ');

  return [
    {
      text: combinedText,
      priority: 50,
      category: 'character',
      source: 'populationResolver',
    },
  ];
}

// ─── Agent Resolvers ──────────────────────────────────────────

/**
 * archetypeResolver — agent character prose by narrative archetype.
 * Priority: 100 (origin)
 * Category: 'origin'
 *
 * Reads narrativeArchetype from agent node properties.
 * Looks up ARCHETYPE_PROSE[archetype] and picks template via seeded PRNG.
 * Replaces {name} placeholder with agent name.
 */
export function archetypeResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const archetype = node.properties?.narrativeArchetype as string | undefined;
  if (!archetype) return [];

  const templates = ARCHETYPE_PROSE[archetype];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'name', node.name);

  return [
    {
      text,
      priority: 100,
      category: 'origin',
      source: 'archetypeResolver',
    },
  ];
}

/**
 * agentCultureResolver — agent culture-affiliated prose via belongs_to edge.
 * Priority: 90 (character)
 * Category: 'character'
 *
 * Agent -> belongs_to -> Culture node
 * Reads cultureIdentity.foundationPair from culture.
 * Looks up CULTURE_LOCATION_PROSE[foundationPair] and picks template via seeded PRNG.
 */
export function agentCultureResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Find outgoing belongs_to edges
  const edges = graph.getOutgoingEdges(nodeId, 'belongs_to');
  if (edges.length === 0) return [];

  // Get first culture edge
  const cultureEdge = edges[0];
  const cultureNode = graph.getNode(cultureEdge.target);
  if (!cultureNode) return [];

  // Extract foundationPair from cultureIdentity
  const cultureIdentity = cultureNode.properties?.cultureIdentity as
    | { foundationPair?: string }
    | undefined;
  if (!cultureIdentity?.foundationPair) return [];

  const templates = CULTURE_LOCATION_PROSE[cultureIdentity.foundationPair];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 90,
      category: 'character',
      source: 'agentCultureResolver',
    },
  ];
}

/**
 * agentFactionResolver — agent faction membership prose via member_of edge.
 * Priority: 70 (character)
 * Category: 'character'
 *
 * Agent -> member_of -> Faction node
 * Picks from FACTION_CONTROL_PROSE via seeded PRNG.
 * Replaces {faction} placeholder with faction name.
 */
export function agentFactionResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Find outgoing member_of edges
  const edges = graph.getOutgoingEdges(nodeId, 'member_of');
  if (edges.length === 0) return [];

  // Get first faction edge
  const factionEdge = edges[0];
  const factionNode = graph.getNode(factionEdge.target);
  if (!factionNode) return [];

  const templates = FACTION_CONTROL_PROSE;
  if (templates.length === 0) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'faction', factionNode.name);

  return [
    {
      text,
      priority: 70,
      category: 'character',
      source: 'agentFactionResolver',
    },
  ];
}

/**
 * dispositionResolver — agent cooperation strategy prose.
 * Priority: 60 (character)
 * Category: 'character'
 *
 * Reads cooperationStrategy from agent node properties.
 * Looks up DISPOSITION_PROSE[strategy] and picks template via seeded PRNG.
 * Replaces {name} placeholder with agent name.
 * CRITICAL: Strategies use hyphens (tit-for-tat, always-cooperate, etc.), not underscores.
 */
export function dispositionResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const strategy = node.properties?.cooperationStrategy as string | undefined;
  if (!strategy) return [];

  const templates = DISPOSITION_PROSE[strategy];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'name', node.name);

  return [
    {
      text,
      priority: 60,
      category: 'character',
      source: 'dispositionResolver',
    },
  ];
}

// ─── Regional History Resolvers ────────────────────────────────────────────

/**
 * historicalCultureResolver — historical culture ruins prose for a region.
 * Priority: 30 (history layer)
 * Category: 'history'
 *
 * Takes a regionId and walks: region → belongs_to (historical) → culture
 * Extracts culture name and ruin descriptors from properties.
 * Picks template based on foundationBias from culture's cultureIdentity.
 *
 * Note: This resolver is called directly by HexChronicle with regionId,
 * not through the standard LOCATION_RESOLVERS pipeline.
 */
export function historicalCultureResolver(regionId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const regionNode = graph.getNode(regionId);
  if (!regionNode || regionNode.type !== 'region') return [];

  // Walk region → belongs_to edges looking for historical culture
  const outEdges = graph.getOutgoingEdges(regionId, 'belongs_to');
  const histEdge = outEdges.find((e) => e.properties?.cultureLayer === 'historical');
  if (!histEdge) return [];

  const histNode = graph.getNode(histEdge.target);
  if (!histNode) return [];

  // Extract culture identity to determine bias (order/chaos/light/darkness/unknown)
  const hProps = histNode.properties ?? {};
  const identity = hProps.cultureIdentity as { foundationBias?: string } | undefined;
  const bias = identity?.foundationBias ?? 'unknown';
  const ruinDescs = (hProps.ruinDescriptors as string[]) ?? [];

  // Pick template based on bias
  const templates = HISTORICAL_CULTURE_PROSE[bias] ?? HISTORICAL_CULTURE_PROSE.unknown;
  const template = pickTemplate(templates, seed);
  if (!template) return [];

  // Select a ruin descriptor if available
  const ruinDesc =
    ruinDescs.length > 0
      ? ruinDescs[Math.floor(mulberry32(seed + 1)() * ruinDescs.length)]
      : 'weathered ruins';

  // Replace placeholders
  let text = replacePlaceholder(template, 'histCulture', histNode.name);
  text = replacePlaceholder(text, 'ruinDescriptor', ruinDesc);

  return [
    {
      text,
      priority: 30,
      category: 'history',
      source: 'historicalCultureResolver',
    },
  ];
}

/**
 * regionEtymologyResolver — explains region name origin linked to historical culture.
 * Priority: 25 (history layer, after main culture prose)
 * Category: 'history'
 *
 * Takes a regionId and walks: region → belongs_to (historical) → culture
 * Picks template from REGION_ETYMOLOGY_PROSE and replaces {regionName} and {histCulture}.
 *
 * Note: This resolver is called directly by HexChronicle with regionId,
 * not through the standard LOCATION_RESOLVERS pipeline.
 */
export function regionEtymologyResolver(regionId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const regionNode = graph.getNode(regionId);
  if (!regionNode || regionNode.type !== 'region') return [];

  // Walk region → belongs_to edges looking for historical culture
  const outEdges = graph.getOutgoingEdges(regionId, 'belongs_to');
  const histEdge = outEdges.find((e) => e.properties?.cultureLayer === 'historical');
  if (!histEdge) return [];

  const histNode = graph.getNode(histEdge.target);
  if (!histNode) return [];

  // Pick template
  const template = pickTemplate(REGION_ETYMOLOGY_PROSE, seed + 7);
  if (!template) return [];

  // Replace placeholders
  let text = replacePlaceholder(template, 'regionName', regionNode.name);
  text = replacePlaceholder(text, 'histCulture', histNode.name);

  return [
    {
      text,
      priority: 25,
      category: 'history',
      source: 'regionEtymologyResolver',
    },
  ];
}

// ─── Resource Resolver ────────────────────────────────────────────

/**
 * Resource Resolver — generates prose about a location's natural resources.
 *
 * Reads the `resources` property from the location node,
 * finds the most abundant resource, and picks a template
 * (abundant or scarce variant) from RESOURCE_PROSE.
 *
 * Priority 65 — between atmosphere and origin.
 * Category: 'resources'.
 */
export function resourcesResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node || node.type !== 'location') return [];

  const resources = node.properties?.resources as Record<string, ResourceInstance> | undefined;
  if (!resources) return [];

  // Find the most abundant resource
  const entries = Object.entries(resources)
    .filter(([, inst]) => inst.quantity > 0)
    .sort((a, b) => b[1].quantity - a[1].quantity);

  if (entries.length === 0) return [];

  const [topType, topInstance] = entries[0];
  const proseSet = RESOURCE_PROSE[topType];
  if (!proseSet) return [];

  // Pick abundance or scarcity variant
  const abundance = getAbundanceLabel(topInstance.quantity);
  const templates = abundance === 'abundant' || abundance === 'moderate'
    ? proseSet.abundant
    : proseSet.scarce;

  const template = pickTemplate([...templates], seed + 500);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 65,
      category: 'resources',
      source: 'resourcesResolver',
    },
  ];
}

/**
 * prosperityResolver — settlement economic vitality prose.
 * Priority: 70 (between culture at 80 and resources at 65)
 * Category: 'atmosphere' (economic mood of the place)
 *
 * Reads the `prosperity` property and maps it to a tier prose fragment.
 * Prefers terrain-specific fragments when the location has a recognized terrain;
 * falls back to generic PROSPERITY_PROSE for unknown or unmapped terrains.
 * Only fires for settlement-subtype locations that have a prosperity value.
 * Fail-soft: no prosperity property → returns empty (resolver silently skips).
 * PRNG: seed + 700, deterministic selection from terrain or generic pool.
 */
export function prosperityResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Only fire for settlement-type locations
  const subtype = node.properties?.locationSubtype as string | undefined;
  if (!subtype) return [];
  const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);
  if (!SETTLEMENT_SUBTYPES.has(subtype)) return [];

  // Fail-soft: no prosperity property → skip silently
  const prosperity = node.properties?.prosperity;
  if (typeof prosperity !== 'number') return [];

  const tier = getProsperityTier(prosperity);

  // Prefer terrain-specific fragments when available
  const terrain = node.properties?.terrain as string | undefined;
  const terrainCategory = terrain ? TERRAIN_PROSPERITY_CATEGORY[terrain] : undefined;
  const terrainTemplates = terrainCategory
    ? PROSPERITY_TERRAIN_PROSE[terrainCategory]?.[tier]
    : undefined;

  // Fall back to generic if no terrain-specific pool exists
  const templates = (terrainTemplates && terrainTemplates.length > 0)
    ? terrainTemplates
    : PROSPERITY_PROSE[tier];
  if (!templates || templates.length === 0) return [];

  const template = pickTemplate(templates, seed + 700);
  if (!template) return [];

  return [
    {
      text: template,
      priority: 70,
      category: 'atmosphere',
      source: 'prosperityResolver',
    },
  ];
}

/**
 * wealthResolver — agent economic standing prose.
 * Priority: 65 (after identity/culture at 90–100, before faction/disposition at 60–70)
 * Category: 'economic' (dedicated slot — won't compete with character layers)
 *
 * Reads the `wealth` property from agent nodes and maps it to a tier prose fragment.
 * Only fires for actors with a numeric wealth property.
 * Fail-soft: no wealth property → returns empty (resolver silently skips).
 */
export function wealthResolver(nodeId: string, graph: WorldGraph, seed: number): ProseLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  // Fail-soft: no wealth property → skip silently
  const wealth = node.properties?.wealth;
  if (typeof wealth !== 'number') return [];

  const tier = getWealthTier(wealth);
  const templates = WEALTH_PROSE[tier];
  if (!templates || templates.length === 0) return [];

  const template = pickTemplate(templates, seed + 800);
  if (!template) return [];

  const text = replacePlaceholder(template, 'name', node.name);

  return [
    {
      text,
      priority: 65,
      category: 'economic',
      source: 'wealthResolver',
    },
  ];
}
