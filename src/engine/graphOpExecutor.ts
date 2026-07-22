/**
 * GraphOp Executor — applies typed graph operations to the world graph.
 * Implements fail-soft semantics: individual operation failures don't crash
 * the entire batch. All operations are traced for inspectability.
 */
import type { WorldGraph } from './graph';
import type { GraphOp, GraphOpContext, GraphOpResult, GraphOpBatchResult } from '../types/graphOp';
import { resolveRef } from '../types/graphOp';
import { emitTrace } from './traceBuffer';
import { hydrateToTier } from './npcGraduation';
import type { SphereName } from '../types';
import type { EssenceSource, SourceKind } from '../types/essenceSource';
import { readEssenceSource, findLatentSourcesInRange } from './essenceSources';
import { resolveLocationToHex } from './encounterAwareness';
import { getFortificationModifier } from './siegeResolution';
import { FORTIFY_MULTIPLIER_BONUS, FORTIFY_MULTIPLIER_MAX } from '../types/battle';
import type { AttachmentEffect } from '../types/effects';
import { SPHERE_EFFECT_TABLE } from './ascendantPrimitives';
import { CURSE_QUINTESSENCE_DRAIN } from '../data/ascendant-expression-constants';
import {
  deriveSourceTier,
  SANCTITY_BUILD_PER_ACTION,
  SANCTITY_DEFEND_RESTORE,
  SOURCE_DISCOVERY_RANGE_HOPS,
} from '../data/essence-sources';
import { readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';
import type { ResourceInstance } from '../types/resource';
import {
  LOC_BLESS_HARVEST_STOCK_DELTA,
  LOC_BLIGHT_STOCK_DELTA,
  LOC_REVEAL_VEIN_QUANTITY,
  LOC_REVEAL_VEIN_BOOST,
  LOC_GUIDE_CARAVAN_VOLUME_DELTA,
  LOC_SOUR_MINE_STOCK_DELTA,
} from '../data/location-action-constants';
import { RESOURCE_DEFINITIONS } from '../data/resource-content';
import { TRADE_ROUTE_MAX_VOLUME } from './tradeRoute';

interface ExecuteOptions {
  tick?: number;
  emitTrace?: boolean;
}

let opCounter = 0;

function createDeterministicHydrationRng(seedInput: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedInput.length; i++) {
    seed = (Math.imul(31, seed) + seedInput.charCodeAt(i)) | 0;
  }

  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hydrateThreadedIndividual(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
): void {
  const targetNode = graph.getNode(targetId);
  if (!targetNode || targetNode.type !== 'actor') return;
  if (targetNode.properties.actorType !== 'individual') return;
  if (targetNode.properties.spotlightTier === 'spotlight') return;

  hydrateToTier(
    graph,
    targetId,
    'spotlight',
    createDeterministicHydrationRng(`${sourceId}->${targetId}`),
  );
}

/**
 * Reset the operation counter for testing.
 * Generated node/edge IDs use this counter to stay deterministic within test runs.
 */
export function resetOpCounter(): void {
  opCounter = 0;
}

/**
 * Execute a batch of graph operations with fail-soft semantics.
 * Returns a batch result with all individual results and a flag indicating
 * whether all operations succeeded.
 *
 * @param graph The world graph to mutate
 * @param ops Array of operations to execute in sequence
 * @param ctx Execution context mapping symbolic refs to actual node IDs
 * @param options Optional tracing and tick metadata
 * @returns Batch result with per-operation success/failure and created IDs
 */
export function executeGraphOps(
  graph: WorldGraph,
  ops: GraphOp[],
  ctx: GraphOpContext,
  options: ExecuteOptions = {},
): GraphOpBatchResult {
  const results: GraphOpResult[] = [];
  const createdIds: Record<string, string> = {};

  for (const op of ops) {
    const result = executeSingleOp(graph, op, ctx, createdIds);
    results.push(result);
  }

  const batchResult: GraphOpBatchResult = {
    results,
    allSucceeded: results.every((r) => r.success),
    createdIds,
  };

  if (options.emitTrace) {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    emitTrace({
      tick: options.tick ?? 0,
      category: 'graph_op_execution',
      summary: `Executed ${ops.length} ops: ${successCount} succeeded, ${failCount} failed`,
      ops: results.map((r) => ({
        op: r.op.op,
        success: r.success,
        error: r.error,
        createdId: r.createdId,
      })),
    });
  }

  return batchResult;
}

/**
 * Execute a single operation with try-catch wrapper.
 * Catches both validation errors (thrown by graph) and application errors.
 */
function executeSingleOp(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
  createdIds: Record<string, string>,
): GraphOpResult {
  try {
    switch (op.op) {
      case 'add_node':
        return executeAddNode(graph, op, createdIds);

      case 'remove_node':
        return executeRemoveNode(graph, op, ctx);

      case 'update_node':
        return executeUpdateNode(graph, op, ctx);

      case 'add_edge':
        return executeAddEdge(graph, op, ctx, createdIds);

      case 'remove_edge':
        return executeRemoveEdge(graph, op);

      case 'update_edge':
        return executeUpdateEdge(graph, op);

      case 'apply_influence':
        return executeApplyInfluence(graph, op, ctx);

      case 'set_thread_courtposition':
        return executeSetThreadCourtPosition(graph, op, ctx);

      case 'reveal_secret':
        return executeRevealSecret(graph, op, ctx);

      case 'call_in_favor':
        return executeCallInFavor(graph, op, ctx);

      case 'plant_secret':
        return executePlantSecret(graph, op, ctx);

      case 'consecrate_source':
        return executeConsecrateSource(graph, op, ctx);

      case 'sanctify_source':
        return executeSanctifySource(graph, op, ctx);

      case 'defend_source':
        return executeDefendSource(graph, op, ctx);

      case 'find_source':
        return executeFindSource(graph, op, ctx);

      case 'claim_source':
        return executeClaimSource(graph, op, ctx);

      case 'fortify_location':
        return executeFortifyLocation(graph, op, ctx);

      case 'attune_artifact':
        return executeAttuneArtifact(graph, op, ctx);

      case 'curse_artifact':
        return executeCurseArtifact(graph, op, ctx);

      case 'nullify_artifact':
        return executeNullifyArtifact(graph, op, ctx);

      case 'scry_sublocation':
        return executeScrySublocation(graph, op, ctx);

      case 'reveal_vein':
        return executeRevealVein(graph, op, ctx);

      case 'guide_caravan':
        return executeGuideCaravan(graph, op, ctx);

      case 'sour_mine':
        return executeSourMine(graph, op, ctx);
      case 'bless_harvest':
        return executeBlessHarvest(graph, op, ctx);

      case 'blight_harvest':
        return executeBlightHarvest(graph, op, ctx);

      default:
        return {
          op,
          success: false,
          error: `Unknown op type: ${(op as any).op}`,
        };
    }
  } catch (err) {
    return {
      op,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Add a new node to the graph.
 * Generated node IDs use a module-level counter to ensure uniqueness.
 */
function executeAddNode(
  graph: WorldGraph,
  op: GraphOp,
  createdIds: Record<string, string>,
): GraphOpResult {
  if (!op.nodeType) {
    return {
      op,
      success: false,
      error: 'add_node requires nodeType',
    };
  }

  const id = `gen_${op.nodeType}_${++opCounter}`;
  graph.addNode({
    id,
    type: op.nodeType,
    name: op.nodeName ?? id,
    properties: op.properties ?? {},
  });

  createdIds[id] = id;

  return {
    op,
    success: true,
    createdId: id,
  };
}

/**
 * Remove a node from the graph (and all its connected edges).
 */
function executeRemoveNode(graph: WorldGraph, op: GraphOp, ctx: GraphOpContext): GraphOpResult {
  if (!op.nodeId) {
    return {
      op,
      success: false,
      error: 'remove_node requires nodeId',
    };
  }

  const nodeId = resolveRef(op.nodeId, ctx);
  const node = graph.getNode(nodeId);

  if (!node) {
    return {
      op,
      success: false,
      error: `Node not found: ${nodeId}`,
    };
  }

  graph.removeNode(nodeId);

  return {
    op,
    success: true,
  };
}

/**
 * Update a node's properties.
 * Uses either 'changes' or 'properties' field (changes takes precedence).
 */
function executeUpdateNode(graph: WorldGraph, op: GraphOp, ctx: GraphOpContext): GraphOpResult {
  if (!op.nodeId) {
    return {
      op,
      success: false,
      error: 'update_node requires nodeId',
    };
  }

  const nodeId = resolveRef(op.nodeId, ctx);
  const node = graph.getNode(nodeId);

  if (!node) {
    return {
      op,
      success: false,
      error: `Node not found: ${nodeId}`,
    };
  }

  const updates = op.changes ?? op.properties;
  if (updates) {
    graph.updateNode(nodeId, { properties: applyNodeChanges(node.properties, updates) });
  }

  return {
    op,
    success: true,
  };
}

/**
 * Apply a changes object to existing node properties.
 *
 * Supports relative changes: string values starting with '+' or '-' are
 * parsed as numeric deltas and added to the current value.
 *   e.g. { unrest: '+20' } → adds 20 to current unrest
 *        { magicalSaturation: '+0.15' } → adds 0.15 to current saturation
 * All other values are direct replacements (existing behavior).
 *
 * Fail-soft: strings that parse as NaN are skipped with a console.warn.
 */
function applyNodeChanges(
  current: Record<string, unknown>,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...current };
  for (const [key, value] of Object.entries(changes)) {
    if (typeof value === 'string' && (value.startsWith('+') || value.startsWith('-'))) {
      const delta = parseFloat(value);
      if (isNaN(delta)) {
        console.warn(`[graphOpExecutor] applyNodeChanges: non-numeric relative change "${value}" for key "${key}" — skipped`);
        continue;
      }
      const prev = typeof result[key] === 'number' ? (result[key] as number) : 0;
      result[key] = prev + delta;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Add a new edge to the graph.
 * Source and target node IDs are resolved from context.
 * Throws if either source or target node doesn't exist (caught by wrapper).
 */
function executeAddEdge(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
  createdIds: Record<string, string>,
): GraphOpResult {
  if (!op.edgeType || !op.source || !op.target) {
    return {
      op,
      success: false,
      error: 'add_edge requires edgeType, source, and target',
    };
  }

  const source = resolveRef(op.source, ctx);
  const target = resolveRef(op.target, ctx);

  // Dedup guard: a given ascendant may only hold one thread edge to any target.
  // If a thread already exists from source → target, fail rather than create a duplicate.
  if (op.edgeType === 'thread') {
    const existing = graph.getOutgoingEdges(source, 'thread');
    const duplicate = existing.find(e => e.target === target);
    if (duplicate) {
      return {
        op,
        success: false,
        error: `Thread edge already exists from ${source} to ${target} (edge ${duplicate.id})`,
      };
    }
  }

  const id = `edge_${op.edgeType}_${++opCounter}`;

  graph.addEdge({
    id,
    source,
    target,
    type: op.edgeType,
    properties: op.properties ?? {},
  });

  if (op.edgeType === 'thread') {
    hydrateThreadedIndividual(graph, source, target);
  }

  createdIds[id] = id;

  return {
    op,
    success: true,
    createdId: id,
  };
}

/**
 * Remove an edge from the graph.
 * Gracefully succeeds even if the edge doesn't exist (fail-soft for idempotency).
 */
function executeRemoveEdge(graph: WorldGraph, op: GraphOp): GraphOpResult {
  if (!op.edgeId) {
    return {
      op,
      success: false,
      error: 'remove_edge requires edgeId',
    };
  }

  graph.removeEdge(op.edgeId);

  return {
    op,
    success: true,
  };
}

/**
 * Update an edge's properties.
 */
function executeUpdateEdge(graph: WorldGraph, op: GraphOp): GraphOpResult {
  if (!op.edgeId) {
    return {
      op,
      success: false,
      error: 'update_edge requires edgeId',
    };
  }

  const edge = graph.getEdge(op.edgeId);
  if (!edge) {
    return {
      op,
      success: false,
      error: `Edge not found: ${op.edgeId}`,
    };
  }

  const updates = op.changes ?? op.properties;
  if (updates) {
    graph.updateEdge(op.edgeId, { properties: updates });
  }

  return {
    op,
    success: true,
  };
}

/**
 * Apply a decaying divine influence entry to a target actor node.
 * Appends to any existing divineInfluences without replacing them.
 * Fail-soft: returns error result if target node doesn't exist.
 */
function executeApplyInfluence(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  if (!op.influence) {
    return { op, success: false, error: 'apply_influence op missing influence payload' };
  }

  const targetId = resolveRef(op.target ?? '$target', ctx);
  const node = graph.getNode(targetId);
  if (!node) {
    return { op, success: false, error: `Target node ${targetId} not found` };
  }

  const existing: unknown[] = (node.properties?.divineInfluences as unknown[]) ?? [];
  const entry = {
    id: `influence-${++opCounter}`,
    ...op.influence,
    tickApplied: ctx.tick ?? 0,
  };

  graph.updateNode(targetId, {
    properties: { divineInfluences: [...existing, entry] },
  });

  return { op, success: true };
}

/**
 * Set the courtPosition on the thread edge between actor and target.
 * Used by dormant/reactivate thread actions.
 *
 * Requires: op.source (actor, defaults to $actor) + op.target (agent, defaults to $target)
 *           op.changes.courtPosition — the new court position value (or null to clear)
 */
function executeSetThreadCourtPosition(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const actorId  = resolveRef(op.source ?? '$actor',  ctx);
  const targetId = resolveRef(op.target ?? '$target', ctx);

  const threadEdges = graph.getIncomingEdges(targetId, 'thread');
  const edge = threadEdges.find(e => e.source === actorId);
  if (!edge) {
    return { op, success: false, error: `No thread edge from ${actorId} to ${targetId}` };
  }

  const courtPosition = (op.changes ?? op.properties)?.courtPosition ?? null;
  graph.updateEdge(edge.id, { properties: { courtPosition } });

  return { op, success: true };
}

// ─── THR-30: Secrets & Favors divine ops ─────────────────────────────────────

function executeRevealSecret(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const actorId  = resolveRef(op.source ?? '$actor',  ctx);
  const targetId = resolveRef(op.target ?? '$target', ctx);

  // Reveal the best (highest magnitude) unrevealed secret the actor holds about the target
  const secretEdges = graph.getOutgoingEdges(actorId, 'knows_secret_of')
    .filter(e => e.target === targetId && !(e.properties.revealed as boolean));

  if (secretEdges.length === 0) {
    return { op, success: false, error: `No unrevealed secrets about ${targetId}` };
  }

  const best = secretEdges.reduce((a, b) =>
    ((b.properties.magnitude as number) ?? 0) > ((a.properties.magnitude as number) ?? 0) ? b : a
  );

  graph.updateEdge(best.id, { properties: { ...best.properties, revealed: true } });
  return { op, success: true, createdId: best.id };
}

function executeCallInFavor(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const actorId  = resolveRef(op.source ?? '$actor',  ctx);
  const targetId = resolveRef(op.target ?? '$target', ctx);

  // Redeem the target's best unredeemed/unbroken owes_favor edge directed TO the actor
  const favorEdges = graph.getOutgoingEdges(targetId, 'owes_favor')
    .filter(e =>
      e.target === actorId &&
      !(e.properties.redeemed as boolean) &&
      !(e.properties.broken as boolean)
    );

  if (favorEdges.length === 0) {
    return { op, success: false, error: `No redeemable favors owed by ${targetId}` };
  }

  const best = favorEdges.reduce((a, b) =>
    ((b.properties.magnitude as number) ?? 0) > ((a.properties.magnitude as number) ?? 0) ? b : a
  );

  graph.updateEdge(best.id, { properties: { ...best.properties, redeemed: true } });
  return { op, success: true, createdId: best.id };
}

function executePlantSecret(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const actorId  = resolveRef(op.source ?? '$actor',  ctx);
  const targetId = resolveRef(op.target ?? '$target', ctx);
  const tick = ctx.tick ?? 0;

  const magnitude = (op.properties?.magnitude as number) ?? 0.45;
  const secretType = (op.properties?.secretType as string) ?? 'hidden_weakness';
  const detail = (op.properties?.detail as string) ?? `A fabricated secret about ${targetId}.`;

  const edgeId = `secret_divine_${actorId}_${targetId}_${tick}`;
  try {
    graph.addEdge({
      id: edgeId,
      type: 'knows_secret_of',
      source: actorId,
      target: targetId,
      properties: {
        secretType,
        magnitude,
        discoveredTick: tick,
        source: 'divine_revelation',
        revealed: false,
        detail,
        planted: true,
      },
    });
    return { op, success: true, createdId: edgeId };
  } catch (err) {
    return { op, success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── THR-611 Essence-source ops (Divine Economy — Build / Defend loop) ────────
//
// These three ops mutate the `essenceSource` property bag on a host node the
// player acts on. They need only the graph + `GraphOpContext` (actor / target /
// tick), never full GameState, so they live here as graph-executor cases (the
// resolution split routes them through `graphOnlyOps` → executeGraphOps). Tier
// derivation is centralized in `data/essence-sources.ts` — the ops never hardcode
// a tier. Per the Slice-1 precedent (`phaseEssenceSources`), these do not call
// `touchWorld()`: the source tick phase re-derives tiers and income every tick and
// `worldVersion` bumps per tick during play, so UI reflects the change within one
// tick (an accepted, documented 1-tick lag). All three are fail-soft (NFP #4).

const SOURCE_KINDS: readonly SourceKind[] = [
  'placeOfPower',
  'shrine',
  'faithfulCommunity',
  'relic',
  'rite',
];

/** Read the acting ascendant's primary sphere (for untyped-source consecration). */
function readActorPrimarySphere(
  graph: WorldGraph,
  actorId: string,
): SphereName | undefined {
  const actor = graph.getNode(actorId);
  const alignment = actor?.properties?.sphereAlignment as
    | { primary?: SphereName }
    | undefined;
  return alignment?.primary;
}

/**
 * Consecrate the target host into a **typed** essence source (Build / Create leg).
 * Assigns a `sphereAffinity` (op-specified, else the ascendant's primary sphere)
 * so its income routes to that sphere, marks it discovered, and ensures a
 * `controls` edge so the income actually flows. Idempotent: re-consecrating an
 * already-typed source is a no-op success. A migrated, untyped place of power is
 * upgraded in place (sanctity / contested / desecrated state preserved).
 */
function executeConsecrateSource(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const host = graph.getNode(targetId);
  if (!host) return { op, success: false, error: `consecrate_source: host ${targetId} not found` };

  const existing = readEssenceSource(host.properties);
  // Already a typed source → idempotent success (don't clobber built sanctity).
  if (existing?.sphereAffinity) return { op, success: true };

  const sphere = (op.sourceSphere as SphereName | undefined)
    ?? readActorPrimarySphere(graph, ctx.actorId);
  if (!sphere) {
    return { op, success: false, error: 'consecrate_source: no sphere (op.sourceSphere absent and actor has no primary sphere alignment)' };
  }

  const kind: SourceKind = (SOURCE_KINDS as readonly string[]).includes(op.sourceKind ?? '')
    ? (op.sourceKind as SourceKind)
    : 'shrine';

  const sanctity = existing?.sanctity ?? 0;
  const contested = !!existing?.contestedBy;
  const desecrated = !!existing?.desecrated;
  const source: EssenceSource = {
    kind,
    sphereAffinity: sphere,
    sanctity,
    tier: deriveSourceTier(sanctity, { contested, desecrated }),
    discoveredBy: ctx.actorId,
    contestedBy: existing?.contestedBy,
    desecrated: existing?.desecrated,
    originTick: existing?.originTick ?? ctx.tick,
  };
  graph.updateNode(host.id, { properties: { ...host.properties, essenceSource: source } });

  // Ensure the ascendant controls the host so `computeSourceIncome` sees it.
  const alreadyControls = graph
    .getOutgoingEdges(ctx.actorId, 'controls')
    .some((e) => e.target === targetId);
  let createdId: string | undefined;
  if (!alreadyControls) {
    createdId = `edge_controls_${++opCounter}`;
    graph.addEdge({ id: createdId, source: ctx.actorId, target: targetId, type: 'controls', properties: {} });
  }

  return { op, success: true, createdId };
}

/**
 * Raise a typed source's sanctity toward flowering (Build leg). Requires a
 * pre-consecrated (typed) source — sanctifying an untyped host does nothing for
 * income, so it fail-softs with guidance to consecrate first. Re-derives the tier.
 */
function executeSanctifySource(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const host = graph.getNode(targetId);
  const src = readEssenceSource(host?.properties);
  if (!host || !src) return { op, success: false, error: `sanctify_source: no essence source on ${targetId}` };
  if (!src.sphereAffinity) return { op, success: false, error: 'sanctify_source: source is untyped — consecrate it first' };

  const sanctity = Math.min(1, src.sanctity + SANCTITY_BUILD_PER_ACTION);
  const tier = deriveSourceTier(sanctity, { contested: !!src.contestedBy, desecrated: !!src.desecrated });
  graph.updateNode(host.id, {
    properties: { ...host.properties, essenceSource: { ...src, sanctity, tier } },
  });
  return { op, success: true };
}

/**
 * Defend / ward a source (Defend leg): clear `contestedBy` and `desecrated`, and
 * restore a chunk of sanctity, then re-derive the (now uncontested) tier. Works
 * whether or not the source was under attack — reinforcing an unthreatened source
 * is a harmless sanctity top-up.
 */
function executeDefendSource(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const host = graph.getNode(targetId);
  const src = readEssenceSource(host?.properties);
  if (!host || !src) return { op, success: false, error: `defend_source: no essence source on ${targetId}` };

  const sanctity = Math.min(1, src.sanctity + SANCTITY_DEFEND_RESTORE);
  const restored: EssenceSource = {
    ...src,
    sanctity,
    contestedBy: undefined,
    desecrated: false,
    tier: deriveSourceTier(sanctity, { contested: false, desecrated: false }),
  };
  graph.updateNode(host.id, { properties: { ...host.properties, essenceSource: restored } });
  return { op, success: true };
}

/**
 * Find (reveal) latent essence sources near the target (Find leg, THR-611 Slice 4).
 * Resolves the target location to a hex, reveals every latent (undiscovered)
 * source within `op.discoveryRangeHops ?? SOURCE_DISCOVERY_RANGE_HOPS` hexes by
 * stamping `discoveredBy = actorId`. Fail-soft: an unplaceable target or an empty
 * neighbourhood is a no-op success (a Find that reveals nothing is not a failure).
 * `createdIds` is unused; the revealed count rides in the (no-op) result.
 */
function executeFindSource(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const center = resolveLocationToHex(graph, targetId);
  if (!center) return { op, success: true }; // unplaceable target → nothing to scan

  const range = typeof op.discoveryRangeHops === 'number'
    ? op.discoveryRangeHops
    : SOURCE_DISCOVERY_RANGE_HOPS;

  const latent = findLatentSourcesInRange(graph, center, range);
  for (const locId of latent) {
    const host = graph.getNode(locId);
    const src = readEssenceSource(host?.properties);
    if (!host || !src) continue;
    graph.updateNode(host.id, {
      properties: { ...host.properties, essenceSource: { ...src, discoveredBy: ctx.actorId } },
    });
  }
  return { op, success: true };
}

/**
 * Claim a discovered source (Claim leg, THR-611 Slice 4): establish the
 * `controls` edge actor→host so the source's typed income begins flowing.
 * Requires an already-**discovered** source (you cannot claim what you have not
 * found — the Find→Claim prerequisite). Fail-soft: no bag → error; undiscovered
 * → error; already-controlled → idempotent success.
 */
function executeClaimSource(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const host = graph.getNode(targetId);
  const src = readEssenceSource(host?.properties);
  if (!host || !src) return { op, success: false, error: `claim_source: no essence source on ${targetId}` };
  if (!src.discoveredBy) return { op, success: false, error: 'claim_source: source not yet discovered — Find it first' };

  const alreadyControls = graph
    .getOutgoingEdges(ctx.actorId, 'controls')
    .some((e) => e.target === targetId);
  if (alreadyControls) return { op, success: true }; // idempotent

  const createdId = `edge_controls_${++opCounter}`;
  graph.addEdge({ id: createdId, source: ctx.actorId, target: targetId, type: 'controls', properties: {} });
  return { op, success: true, createdId };
}

// ─── THR-605 Slice 1: fortify_location ───────────────────────────────────────
//
// Raise the target location's `fortificationMultiplier` property by
// `FORTIFY_MULTIPLIER_BONUS`, clamped to `FORTIFY_MULTIPLIER_MAX`. The property
// is read by `siegeResolution.ts` (initial-momentum calc + breach path), which
// falls back to the subtype base `getFortificationModifier(...)` when unset — so
// the first fortify seeds the base before bumping it. Needs only graph + ctx, so
// it lives here as a graph-executor case (auto-routed via `graphOnlyOps`), like
// the THR-611 essence-source ops. A relative `update_node` change could add but
// not cap; the clamp is why this is a composed op. Fail-soft: missing location →
// error result (fail-soft success at the action layer).

/**
 * Fortify a location: bump its `fortificationMultiplier` toward the grand-fortress
 * cap. Seeds from the subtype base on the first cast, then adds one wall tier per
 * cast up to `FORTIFY_MULTIPLIER_MAX`. Consumed by `siegeResolution.ts`.
 */
function executeFortifyLocation(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) return { op, success: false, error: `fortify_location: location ${targetId} not found` };

  const subtype = location.properties.locationSubtype as string | undefined;
  const current = typeof location.properties.fortificationMultiplier === 'number'
    ? (location.properties.fortificationMultiplier as number)
    : getFortificationModifier(subtype);

  const fortified = Math.min(FORTIFY_MULTIPLIER_MAX, current + FORTIFY_MULTIPLIER_BONUS);
  graph.updateNode(location.id, {
    properties: { ...location.properties, fortificationMultiplier: fortified },
  });
  return { op, success: true };
}

// ─── THR-605 Slice 2: artifact trio (attune / curse / nullify) ───────────────
//
// All three write the same `properties.effects: AttachmentEffect[]` array that
// `collectAttachmentEffects` (effectWalker.ts) reads off any possessed/bonded
// artifact — so each is genuinely consumed, no new consumer subsystem. They need
// only graph + ctx (the acting ascendant is `ctx.actorId`, resolved from
// `graphOnlyOps`), so they live here as graph-executor cases like fortify and the
// THR-611 essence ops. Attune reads the ascendant's primary sphere via the local
// `readActorPrimarySphere` helper. All fail-soft: a missing/non-artifact target
// returns an error result (fail-soft success at the action layer, per NFP #4).

/**
 * Attune an artifact to the ascendant's primary sphere. Appends the sphere's
 * canonical positive `AttachmentEffect` (`SPHERE_EFFECT_TABLE[sphere][0]` — the
 * deterministic, RNG-free counterpart to imbue's seeded pick) to the artifact's
 * `effects` array and stamps `attunedSphere`. Consumed by the effect walker for
 * whoever holds the artifact. Fail-soft: no ascendant sphere / no vocabulary for
 * the sphere → no-op success (nothing appended). No `aligned_with` edge: that edge
 * only admits actor/location sources and is read only for actor/location context,
 * so an artifact edge would be write-only theatre — the stamp + effect carry the
 * alignment.
 */
function executeAttuneArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact) return { op, success: false, error: `attune_artifact: artifact ${targetId} not found` };
  if (artifact.type !== 'artifact') return { op, success: false, error: `attune_artifact: ${targetId} is not an artifact` };

  const sphere = readActorPrimarySphere(graph, ctx.actorId);
  if (!sphere) return { op, success: true }; // fail-soft: unaligned ascendant → no-op success
  const effect = SPHERE_EFFECT_TABLE[sphere]?.[0];
  if (!effect) return { op, success: true }; // fail-soft: no vocab for sphere → no-op success

  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifact.id, {
    properties: { effects: [...existing, effect], attunedSphere: sphere },
  });
  return { op, success: true };
}

/**
 * Curse an artifact so misfortune travels with whoever carries it. Appends a
 * concealed per-tick quintessence drain (`CURSE_QUINTESSENCE_DRAIN`, applied as a
 * negative-amount `resource_manipulate` — the direct inverse of the bestow regen
 * boon) to the artifact's `effects` array and sets `cursed` / `curseConcealed`.
 * The drain is consumed each tick by `tickResourceManipulate` for the bearer;
 * the bearer is not told, matching the prose. Fail-soft: missing/non-artifact → error.
 */
function executeCurseArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact) return { op, success: false, error: `curse_artifact: artifact ${targetId} not found` };
  if (artifact.type !== 'artifact') return { op, success: false, error: `curse_artifact: ${targetId} is not an artifact` };

  const curse: AttachmentEffect = {
    type: 'resource_manipulate',
    resource: 'quintessence',
    target: 'self',
    amount: -CURSE_QUINTESSENCE_DRAIN,
    mode: 'per_tick',
  };
  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifact.id, {
    properties: { effects: [...existing, curse], cursed: true, curseConcealed: true },
  });
  return { op, success: true };
}

/**
 * Nullify an artifact: strip every applied `effects` entry (whatever imbue /
 * attune / curse wrote) and clear the attune/curse flags back to inert. The
 * inverse of imbue/attune/curse; the bearer loses all applied bonuses and curses
 * via the effect walker. Fail-soft: nullifying an already-inert artifact clears
 * nothing and still succeeds. Scoped to the `effects` array (the artifact-trio
 * substrate) — the separate `enchanted_by` spell-edge mechanic is untouched.
 */
function executeNullifyArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact) return { op, success: false, error: `nullify_artifact: artifact ${targetId} not found` };
  if (artifact.type !== 'artifact') return { op, success: false, error: `nullify_artifact: ${targetId} is not an artifact` };

  // updateNode merges properties, so overwrite (don't delete) the keys to inert.
  graph.updateNode(artifact.id, {
    properties: { effects: [], attunedSphere: undefined, cursed: false, curseConcealed: false },
  });
  return { op, success: true };
}

// ─── THR-605 Slice 3: scry_sublocation ───────────────────────────────────────
//
// A "read" action whose world change is a reveal: it flips every concealed
// `knows_secret_of` edge (`revealed: false` → `true`) held by any actor on the
// target sublocation's hex. That flip is genuinely consumed — `agentDetail.ts`
// filters to *unrevealed* secrets when it lists what an agent hides, so revealing
// surfaces those secrets in the agent panel, and `phaseSecretsFavors.ts` exempts
// revealed secrets from decay so they persist. Awareness is hex-granular (the
// load-bearing rule): resolving the sublocation up to its hex and scanning every
// actor on that hex mirrors the perceive-family `taste_the_wake` reveal, but this
// version actually flips the flag instead of only tracing. Needs only graph +
// ctx, so it lives here as a graph-executor case (auto-routed via `graphOnlyOps`)
// like fortify and the artifact trio. Deterministic — no PRNG, no magnitudes.
// Fail-soft: an unplaced target or a hex with nothing concealed returns success
// with nothing revealed (the place "keeps its silence", per the prose).

/**
 * Scry a sublocation: reveal concealed secrets on its hex. Resolves the target up
 * to its hex, then flips every unrevealed `knows_secret_of` edge held by any actor
 * on that hex to `revealed: true`. Consumed by `agentDetail.ts` (surfaces the
 * secret) + `phaseSecretsFavors.ts` (revealed secrets no longer decay). Fail-soft:
 * unplaced target or nothing concealed → no-op success.
 */
function executeScrySublocation(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const target = graph.getNode(targetId);
  if (!target) return { op, success: false, error: `scry_sublocation: target ${targetId} not found` };

  const hex = resolveLocationToHex(graph, targetId);
  if (!hex) return { op, success: true }; // fail-soft: unplaced target → nothing to reveal

  for (const actor of graph.getNodesByType('actor')) {
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    if (!locEdges.length) continue;
    const actorHex = resolveLocationToHex(graph, locEdges[0].target);
    if (!actorHex || actorHex.col !== hex.col || actorHex.row !== hex.row) continue;

    for (const secret of graph.getOutgoingEdges(actor.id, 'knows_secret_of')) {
      if (secret.properties.revealed) continue;
      graph.updateEdge(secret.id, {
        properties: { ...secret.properties, revealed: true },
      });
    }
  }
  return { op, success: true };
}


// ─── THR-618 P4: reveal_vein / guide_caravan / sour_mine ──────────────────────
//
// The remaining divine economic verbs, same shape as bless/blight: graph+ctx
// only, auto-routed via graphOnlyOps, deterministic, fail-soft, no touchWorld
// (the stock-tier phase touches on derived-tier change; route reads are live).

/**
 * Reveal the Vein: surface a terrain-appropriate non-staple deposit at the
 * target. If an eligible deposit already exists there, swell the poorest one
 * by LOC_REVEAL_VEIN_BOOST instead. Deterministic pick: first terrain-matching
 * absent resource id in sort order. Fail-soft: no eligible resource → no-op
 * success (the land holds nothing the god can call up).
 */
function executeRevealVein(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) return { op, success: false, error: `reveal_vein: location ${targetId} not found` };

  const terrain = location.properties.terrain as string | undefined;
  const resources = readResources(location.properties);
  const candidates = Object.values(RESOURCE_DEFINITIONS)
    .filter((d) => getResourceClass(d.id).category !== 'staple')
    .filter((d) => !terrain || (d.terrains as readonly string[]).includes(terrain))
    .map((d) => d.id)
    .sort();

  const absent = candidates.find((id) => !resources[id]);
  const next = { ...resources };
  if (absent) {
    next[absent] = { resourceId: absent, quantity: LOC_REVEAL_VEIN_QUANTITY } as unknown as ResourceInstance;
  } else {
    const present = candidates.filter((id) => resources[id]);
    if (present.length === 0) return { op, success: true }; // nothing to call up — fail-soft no-op
    const poorest = present.sort((a, b) => (resources[a].quantity ?? 0) - (resources[b].quantity ?? 0))[0];
    next[poorest] = {
      ...resources[poorest],
      quantity: Math.min(100, (resources[poorest].quantity ?? 0) + LOC_REVEAL_VEIN_BOOST),
    };
  }
  graph.updateNode(location.id, { properties: { resources: next } });
  return { op, success: true };
}

/**
 * Guide the Caravan: every trade route touching the guided settlement gains
 * volume, sheds its threatened mark, and counts as freshly traded — the god
 * walks the wagons through. Fail-soft: no routes → no-op success.
 */
function executeGuideCaravan(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) return { op, success: false, error: `guide_caravan: location ${targetId} not found` };

  const routes = [
    ...graph.getOutgoingEdges(targetId, 'trades_with'),
    ...graph.getIncomingEdges(targetId, 'trades_with'),
  ];
  for (const route of routes) {
    const volume = typeof route.properties.volume === 'number' ? route.properties.volume : 1;
    graph.updateEdge(route.id, {
      properties: {
        ...route.properties,
        volume: Math.min(TRADE_ROUTE_MAX_VOLUME, volume + LOC_GUIDE_CARAVAN_VOLUME_DELTA),
        threatened: false,
        threatenedSinceTick: undefined,
        lastTraded: ctx.tick ?? (route.properties.lastTraded as number | undefined) ?? 0,
      },
    });
  }
  return { op, success: true };
}

/**
 * Sour the Mine: drain every non-staple deposit at the target — the vein
 * pinches, the lode runs to rubble. The strategic/luxury inverse of blight.
 * Fail-soft: no non-staple deposits → no-op success.
 */
function executeSourMine(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) return { op, success: false, error: `sour_mine: location ${targetId} not found` };

  const resources = readResources(location.properties);
  const next = { ...resources };
  let changed = false;
  for (const [resourceId, instance] of Object.entries(resources)) {
    if (!instance || typeof instance.quantity !== 'number') continue;
    if (getResourceClass(resourceId).category === 'staple') continue;
    const adjusted = Math.max(0, instance.quantity - LOC_SOUR_MINE_STOCK_DELTA);
    if (adjusted === instance.quantity) continue;
    next[resourceId] = { ...instance, quantity: adjusted };
    changed = true;
  }
  if (changed) graph.updateNode(location.id, { properties: { resources: next } });
  return { op, success: true };
}

// ─── THR-616 P2: bless_harvest / blight_harvest ───────────────────────────────
//
// The two first divine *economic* verbs act on the P1 resource stock substrate
// (`resourceEconomy.ts`), not just the prosperity scalar THR-401's Bless the
// Harvest already moved. Each shifts the `quantity` of every *staple* resource
// (grain / grazing / fish / water — the famine drivers) at the target location by
// a named delta, clamped to the 0-100 abundance scale. The coarse tier
// (`scarce | adequate | surplus`) re-derives next tick in `phaseResourceStockTiers`,
// which is what prose, encounters, and the Livelihood UI read — so the god tilts
// the harvest toward Glut or Famine without ever touching a visible number.
//
// Both need only graph + ctx (the target location id), so they live here as
// graph-executor cases auto-routed via `graphOnlyOps`, exactly like fortify and
// the THR-605 artifact/scry ops. No `touchWorld()` here: the stock-tier phase
// already touches the world when a derived tier actually changes (the
// `locationSubtype` precedent), so touching on the raw quantity write would
// over-invalidate. Deterministic — no PRNG, no visible magnitudes.
//
// Fail-soft (NFP #4): a missing location returns an error result (fail-soft
// success at the action layer); a location with no staple resources returns a
// no-op success (the fields are simply not the kind the verb can reach).

/**
 * Shift every staple resource's quantity at the target location by `delta`,
 * clamped to the [0, 100] abundance scale. Shared body of bless_harvest /
 * blight_harvest. Fail-soft: a missing location returns an error result; a
 * location with no staple resources returns a no-op success.
 */
function adjustStapleQuantities(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
  delta: number,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) return { op, success: false, error: `${op.op}: location ${targetId} not found` };

  const resources = readResources(location.properties);
  const next: Record<string, ResourceInstance> = { ...resources };
  let changed = false;
  for (const [resourceId, instance] of Object.entries(resources)) {
    if (!instance || typeof instance.quantity !== 'number') continue;
    if (getResourceClass(resourceId).category !== 'staple') continue;
    const adjusted = Math.max(0, Math.min(100, instance.quantity + delta));
    if (adjusted === instance.quantity) continue;
    next[resourceId] = { ...instance, quantity: adjusted };
    changed = true;
  }

  if (changed) {
    graph.updateNode(location.id, { properties: { resources: next } });
  }
  return { op, success: true };
}

/**
 * Bless the Harvest (economic leg): swell every staple resource at the target
 * toward Glut by `LOC_BLESS_HARVEST_STOCK_DELTA`. Consumed by the stock-tier
 * phase next tick. Fail-soft: no location → error; no staples → no-op success.
 */
function executeBlessHarvest(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  return adjustStapleQuantities(graph, op, ctx, LOC_BLESS_HARVEST_STOCK_DELTA);
}

/**
 * Blight (economic leg): draw every staple resource at the target toward Famine
 * by `LOC_BLIGHT_STOCK_DELTA`. The inverse of bless_harvest. Fail-soft: no
 * location → error; no staples → no-op success.
 */
function executeBlightHarvest(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  return adjustStapleQuantities(graph, op, ctx, -LOC_BLIGHT_STOCK_DELTA);
}
