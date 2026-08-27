/**
 * The binding registry — THE BINDER's persistence ledger (THR-1296 §4).
 *
 * Two jobs, deliberately separated:
 *
 *   1. **The ledger** — `UndertakingBindingRecord[]` on `state.strategicState.bindings`.
 *      Serializable, additive, survives a save. This is the durable truth.
 *   2. **The reverse index** — `Map<nodeId, Set<recordKey>>`, rebuilt lazily from the
 *      ledger. Runtime-owned and never serialized, exactly like every other engine
 *      cache: a module-scope singleton would carry one playthrough's bindings into
 *      the next (the engine-caches-per-session rule).
 *
 * ## Why this exists
 *
 * `EncounterSupportBinding.persistence` has been written 60+ times across the shipped
 * corpus and read by **zero** engine consumers — the recon (THR-1289) measured it.
 * A template could declare a cast member must-persist and any reaper would take them
 * silently. The plan's two sentences — "never silently reaped" and "the world may
 * still kill them honestly" — coexist by splitting on the reaper's *nature*:
 *
 * - **Housekeeping** (sublocation dissolution) **defers**: it consults `isNodeBound`
 *   and skips a bound stage, traced. Dissolution resumes once released.
 * - **Narrative reapers** (death, a siege razing the stage, an authored `remove_node`)
 *   **proceed loudly**: the binding breaks, the severance is traced, and the next
 *   checkpoint turns the loss into a named complication rather than a silent gap.
 *
 * Detection is centralized at `WorldGraph.removeNode` — the sole funnel all ~25
 * deleting call sites pass through — because per-reaper enforcement would be routed
 * around by the unguarded generic deleter, and would miss every reaper not yet written.
 *
 * ## Broken is terminal
 *
 * `status: 'broken'` triggers a re-bind and is never a value a scorer reads. That is
 * the THR-1286 lesson (dead records poison scorers) answered by construction.
 */
import type { WorldGraph } from '../graph';
import type {
  StrategicRuntimeState,
  UndertakingBindingRecord,
  UndertakingBindingBrokenCause,
} from '../../types/strategicAction';
import { isAgentGone } from '../groups/groupQueries';
import { emitTrace } from '../traceBuffer';

/**
 * Runtime-owned reverse index. Not serialized — rebuilt from the ledger on demand.
 *
 * Keyed by node id so the `removeNode` hook is one Map lookup rather than a scan of
 * every binding in the world. Values are ledger positions rather than object
 * references so a re-hydrated ledger cannot leave the index pointing at stale copies.
 */
export interface BindingIndex {
  /** nodeId → indices into the ledger array. */
  readonly byNode: Map<string, Set<number>>;
  /** Ledger length the index was built from — the staleness key. */
  builtFromLength: number;
}

/** A fresh, empty index. */
export function createBindingIndex(): BindingIndex {
  return { byNode: new Map(), builtFromLength: -1 };
}

/** The ledger, tolerating every shape of absence (NFP #4/#6). */
export function getBindings(
  strategicState: StrategicRuntimeState | undefined,
): UndertakingBindingRecord[] {
  if (!strategicState) return [];
  if (!strategicState.bindings) strategicState.bindings = [];
  return strategicState.bindings;
}

/**
 * Rebuild the reverse index if the ledger has grown or shrunk since the last build.
 *
 * Length is a sufficient staleness key here and nowhere else: records are appended
 * and mutated in place, never reordered, and a *status* change does not move a record
 * between node buckets — a broken binding still concerns the same node id.
 */
export function ensureBindingIndex(
  index: BindingIndex,
  bindings: readonly UndertakingBindingRecord[],
): BindingIndex {
  if (index.builtFromLength === bindings.length) return index;

  index.byNode.clear();
  for (let i = 0; i < bindings.length; i++) {
    const nodeId = bindings[i].nodeId;
    let bucket = index.byNode.get(nodeId);
    if (!bucket) {
      bucket = new Set<number>();
      index.byNode.set(nodeId, bucket);
    }
    bucket.add(i);
  }
  index.builtFromLength = bindings.length;
  return index;
}

/**
 * Is this node held live by any binding?
 *
 * The question housekeeping asks before dissolving a stage. Only `'live'` counts:
 * a broken or released record is history, and history must not make a node immortal.
 */
export function isNodeBound(
  index: BindingIndex,
  bindings: readonly UndertakingBindingRecord[],
  nodeId: string,
): boolean {
  ensureBindingIndex(index, bindings);
  const bucket = index.byNode.get(nodeId);
  if (!bucket) return false;
  for (const i of bucket) {
    if (bindings[i]?.status === 'live') return true;
  }
  return false;
}

/** Every live binding on a node — what the severance path names in its traces. */
export function getLiveBindingsForNode(
  index: BindingIndex,
  bindings: readonly UndertakingBindingRecord[],
  nodeId: string,
): UndertakingBindingRecord[] {
  ensureBindingIndex(index, bindings);
  const bucket = index.byNode.get(nodeId);
  if (!bucket) return [];
  const out: UndertakingBindingRecord[] = [];
  for (const i of bucket) {
    const record = bindings[i];
    if (record?.status === 'live') out.push(record);
  }
  return out;
}

/** Append a live binding and keep the index in step. */
export function registerBinding(
  index: BindingIndex,
  bindings: UndertakingBindingRecord[],
  record: UndertakingBindingRecord,
): UndertakingBindingRecord {
  bindings.push(record);
  // Incremental rather than invalidating: the append is the only mutation, so the
  // index stays exact and `ensureBindingIndex` has nothing to rebuild.
  let bucket = index.byNode.get(record.nodeId);
  if (!bucket) {
    bucket = new Set<number>();
    index.byNode.set(record.nodeId, bucket);
  }
  bucket.add(bindings.length - 1);
  index.builtFromLength = bindings.length;
  return record;
}

/**
 * Mark every live binding on a node broken, and trace each severance.
 *
 * This is what the `removeNode` hook calls. It is a no-op for an unbound node,
 * which is the overwhelmingly common case — removals of bound nodes are rare
 * events, which is why a hook on the funnel costs nothing measurable.
 */
export function markBindingsBroken(
  index: BindingIndex,
  bindings: UndertakingBindingRecord[],
  nodeId: string,
  cause: UndertakingBindingBrokenCause,
  tick: number,
): UndertakingBindingRecord[] {
  const affected = getLiveBindingsForNode(index, bindings, nodeId);
  for (const record of affected) {
    record.status = 'broken';
    record.brokenCause = cause;
    record.endedAtTick = tick;
    emitTrace({
      category: 'binding_severed',
      tick,
      projectId: record.projectId,
      castKey: record.castKey,
      nodeId: record.nodeId,
      cause,
      persistence: record.persistence,
      summary:
        `binding severed: ${record.castKey} of ${record.projectId} ` +
        `(${record.persistence}) — ${cause}`,
    });
  }
  return affected;
}

/** Release a binding deliberately — the undertaking is done with it, nothing broke. */
export function releaseBindingsForProject(
  bindings: UndertakingBindingRecord[],
  projectId: string,
  tick: number,
): number {
  let released = 0;
  for (const record of bindings) {
    if (record.projectId === projectId && record.status === 'live') {
      record.status = 'released';
      record.endedAtTick = tick;
      released++;
    }
  }
  return released;
}

/**
 * Lazy validation — the fallback that makes the hook an optimization of loudness
 * rather than a correctness requirement (plan § Kill criteria).
 *
 * **Both shapes of gone.** The recon confirmed the checkpoint's actor-loss check
 * reads node absence only, so a `deceased: true` echo or a band-slain member passes
 * it. Soft deaths (`aspects.ts`, `bandOpposition.ts`) never remove the node, so no
 * hook can fire for them — this dual test is their only detector.
 */
export function validateBindings(
  graph: WorldGraph,
  index: BindingIndex,
  bindings: UndertakingBindingRecord[],
  tick: number,
): UndertakingBindingRecord[] {
  const broken: UndertakingBindingRecord[] = [];
  for (const record of bindings) {
    if (record.status !== 'live') continue;
    const node = graph.getNode(record.nodeId);
    if (!node) {
      broken.push(...markBindingsBroken(index, bindings, record.nodeId, 'node_removed', tick));
      continue;
    }
    // Locations do not die; only actors carry the deceased/dead signals, and
    // asking `isAgentGone` of a settlement would be a category error, not a check.
    if (record.kind === 'actor' && isAgentGone(node)) {
      broken.push(...markBindingsBroken(index, bindings, record.nodeId, 'deceased', tick));
    }
  }
  return broken;
}

/**
 * Build the predicate housekeeping consults before dissolving a stage.
 *
 * Returns true when the node is held live, and traces the deferral as it does — so
 * the "why is this ruin still here?" question has an answer in the trace ring rather
 * than requiring someone to reason about it. Tracing lives here rather than in
 * `sublocation.ts` so the dissolution sweep never has to import binder types or know
 * a binding's shape; it asks one boolean question and gets one boolean answer.
 *
 * This is the *housekeeping* half of the split. Narrative reapers do not consult it —
 * a siege razing a bound stage proceeds and breaks the binding loudly, because that is
 * a story, not a chore.
 */
export function makeDissolutionHold(
  index: BindingIndex,
  getBindings_: () => UndertakingBindingRecord[],
  getTick: () => number,
): (nodeId: string) => boolean {
  return (nodeId: string) => {
    const bindings = getBindings_();
    if (bindings.length === 0) return false;
    const held = getLiveBindingsForNode(index, bindings, nodeId);
    if (held.length === 0) return false;
    const tick = getTick();
    for (const record of held) {
      emitTrace({
        category: 'binding_severed',
        tick,
        projectId: record.projectId,
        castKey: record.castKey,
        nodeId: record.nodeId,
        cause: 'dissolution_deferred',
        persistence: record.persistence,
        summary:
          `dissolution deferred: ${record.nodeId} is the bound stage of ` +
          `${record.castKey}@${record.projectId}`,
      });
    }
    return true;
  };
}

/**
 * Register the removal hook for a session.
 *
 * Deliberately takes accessors rather than a captured state object: `gameState` is
 * replaced by React on every tick, so a captured reference would observe a frozen
 * world from the tick the hook was installed. Accessors read the live one.
 */
export function installBindingRemovalHook(
  graph: WorldGraph,
  index: BindingIndex,
  getStrategicState: () => StrategicRuntimeState | undefined,
  getTick: () => number,
): void {
  graph.onNodeRemoved = (nodeId: string) => {
    const strategicState = getStrategicState();
    if (!strategicState?.bindings || strategicState.bindings.length === 0) return;
    markBindingsBroken(index, strategicState.bindings, nodeId, 'node_removed', getTick());
  };
}
