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
import {
  deriveSourceTier,
  SANCTITY_BUILD_PER_ACTION,
  SANCTITY_DEFEND_RESTORE,
  SOURCE_DISCOVERY_RANGE_HOPS,
} from '../data/essence-sources';

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
