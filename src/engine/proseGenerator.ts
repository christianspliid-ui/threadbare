/**
 * Graph-Walking Prose Generator — public API.
 *
 * Walks graph edges from any node and composes rich, unique descriptions
 * by layering content from the game's interconnected systems.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { WorldGraph } from './graph';
import type { SimulationRuntime } from './simulationRuntime';
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
  tradeRouteResolver,
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
  wealthResolver,
  guildIdentityResolver,
  guildFactionIdentityResolver,
  locationEncounterHistoryResolver,
  agentEncounterBiographyResolver,
  settlementGenomeResolver,
} from './proseResolvers';

// ─── Resolver Registry ──────────────────────────────────────────────

const LOCATION_RESOLVERS: ProseResolver[] = [
  subtypeResolver,
  biomeResolver,
  settlementGenomeResolver,
  resourcesResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  guildIdentityResolver,
  populationResolver,
  tradeRouteResolver,
  locationEncounterHistoryResolver,
];

const ACTOR_RESOLVERS: ProseResolver[] = [
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  wealthResolver,
  dispositionResolver,
  agentEncounterBiographyResolver,
];

const FACTION_RESOLVERS: ProseResolver[] = [
  guildFactionIdentityResolver,
];

const RESOLVER_REGISTRY: Record<string, ProseResolver[]> = {
  location: LOCATION_RESOLVERS,
  actor: ACTOR_RESOLVERS,
};

// ─── Prose Cache ────────────────────────────────────────────────────
//
// THR-577: cache ownership lives on `SimulationRuntime.proseCache` (per the
// load-bearing decision "engine caches must be owned per session, not stored at
// module scope"). Callers thread `runtime` through `generateEntityProse`; when it
// is absent (tests, isolated previews) prose is composed fresh without caching.
// Key format: "${nodeId}:${tick}:${mode}", auto-evicting when the tick advances.
// PERF-01: skips 20+ resolver calls on same-tick panel re-opens when a runtime is
// threaded. Session reset clears it via `resetRuntimeCaches()`.

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Generate prose for any graph entity by walking its edges and composing layers.
 *
 * Results are cached by (nodeId, tick, mode). Re-opening the same panel on the
 * same tick returns instantly from cache. Cache auto-evicts when tick advances.
 *
 * @param nodeId - The graph node to describe
 * @param graph - The world graph
 * @param seed - World seed for deterministic PRNG
 * @param mode - 'summary' (1 paragraph) or 'full' (multi-paragraph)
 * @param tick - Current game tick for cache invalidation (defaults to 0)
 * @param runtime - Session runtime owning the prose cache (THR-577). When present,
 *   same-tick re-calls hit the cache; when absent, prose is composed fresh.
 */
export function generateEntityProse(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
  mode: ProseMode,
  tick: number = 0,
  runtime?: SimulationRuntime | null,
): string {
  const cache = runtime?.proseCache ?? null;

  // Auto-evict all entries when tick advances. Runtime-owned — never bleeds across sessions.
  if (cache && runtime && tick !== runtime.proseCacheTick) {
    cache.clear();
    runtime.proseCacheTick = tick;
  }

  const cacheKey = `${nodeId}:${tick}:${mode}`;
  if (cache) {
    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;
  }

  const node = graph.getNode(nodeId);
  if (!node) return '';

  let resolvers: ProseResolver[] | undefined;

  if (node.type === 'actor') {
    const actorType = node.properties?.actorType as string | undefined;
    if (actorType === 'individual') {
      resolvers = RESOLVER_REGISTRY.actor;
    } else if (actorType === 'faction' && node.properties?.guildType) {
      resolvers = FACTION_RESOLVERS;
    }
  } else {
    resolvers = RESOLVER_REGISTRY[node.type];
  }

  if (!resolvers) return '';

  // Hash nodeId into a per-entity seed offset
  let idHash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    idHash = ((idHash << 5) - idHash + nodeId.charCodeAt(i)) | 0;
  }
  const entitySeed = seed + Math.abs(idHash);

  // Run all resolvers, collect layers (cache miss — actual computation)
  const allLayers = resolvers.flatMap(resolver => resolver(nodeId, graph, entitySeed));

  // Compose based on mode
  const result = mode === 'summary'
    ? composeSummary(allLayers)
    : composeProse(allLayers);

  // Trace on cache miss only — avoid noise on every panel re-open (pitfall #5)
  emitTrace({
    tick,
    category: 'narrative_generation',
    agentId: node.type === 'actor' ? nodeId : undefined,
    summary: `Prose [${mode}] for ${node.name}: cache miss — ${allLayers.length} layers → ${result.length} chars`,
    tier: 'notable',
    sphereWords: [],
    finalProse: result.slice(0, 120),
  });

  if (cache) cache.set(cacheKey, result);
  return result;
}
