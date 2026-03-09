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
} from '../data/prose-layer-content';

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
