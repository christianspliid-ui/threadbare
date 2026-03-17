/**
 * Graph-Walking Prose Generator — public API.
 *
 * Walks graph edges from any node and composes rich, unique descriptions
 * by layering content from the game's interconnected systems.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { WorldGraph } from './graph';
import type { ProseMode, ProseResolver } from '../types/prose';
import { composeProse, composeSummary } from './proseComposer';
import { emitTrace } from './traceBuffer';
import {
  subtypeResolver,
  biomeResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
  resourcesResolver,
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
  wealthResolver,
} from './proseResolvers';

// ─── Resolver Registry ──────────────────────────────────────────────

const LOCATION_RESOLVERS: ProseResolver[] = [
  subtypeResolver,
  biomeResolver,
  resourcesResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
];

const ACTOR_RESOLVERS: ProseResolver[] = [
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  wealthResolver,
  dispositionResolver,
];

const RESOLVER_REGISTRY: Record<string, ProseResolver[]> = {
  location: LOCATION_RESOLVERS,
  actor: ACTOR_RESOLVERS,
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Generate prose for any graph entity by walking its edges and composing layers.
 *
 * @param nodeId - The graph node to describe
 * @param graph - The world graph
 * @param seed - World seed for deterministic PRNG
 * @param mode - 'summary' (1 paragraph) or 'full' (multi-paragraph)
 */
export function generateEntityProse(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
  mode: ProseMode,
): string {
  const node = graph.getNode(nodeId);
  if (!node) return '';

  const resolvers = RESOLVER_REGISTRY[node.type];
  if (!resolvers) return '';

  // For actors, only resolve individuals (not factions, cultures, gods yet)
  if (node.type === 'actor') {
    const actorType = node.properties?.actorType as string | undefined;
    if (actorType !== 'individual') return '';
  }

  // Hash nodeId into a per-entity seed offset
  let idHash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    idHash = ((idHash << 5) - idHash + nodeId.charCodeAt(i)) | 0;
  }
  const entitySeed = seed + Math.abs(idHash);

  // Run all resolvers, collect layers
  const allLayers = resolvers.flatMap(resolver => resolver(nodeId, graph, entitySeed));

  // Compose based on mode
  const result = mode === 'summary'
    ? composeSummary(allLayers)
    : composeProse(allLayers);

  // Trace
  emitTrace({
    tick: 0,
    category: 'narrative_generation',
    agentId: node.type === 'actor' ? nodeId : undefined,
    summary: `Prose [${mode}] for ${node.name}: ${allLayers.length} layers → ${result.length} chars`,
    tier: 'notable',
    sphereWords: [],
    finalProse: result.slice(0, 120),
  });

  return result;
}
