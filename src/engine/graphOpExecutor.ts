/**
 * GraphOp Executor — applies typed graph operations to the world graph.
 * Implements fail-soft semantics: individual operation failures don't crash
 * the entire batch. All operations are traced for inspectability.
 */
import type { WorldGraph } from './graph';
import type { GraphOp, GraphOpContext, GraphOpResult, GraphOpBatchResult } from '../types/graphOp';
import { resolveRef } from '../types/graphOp';
import { emitTrace } from './traceBuffer';

interface ExecuteOptions {
  tick?: number;
  emitTrace?: boolean;
}

let opCounter = 0;

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
  const id = `edge_${op.edgeType}_${++opCounter}`;

  graph.addEdge({
    id,
    source,
    target,
    type: op.edgeType,
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
