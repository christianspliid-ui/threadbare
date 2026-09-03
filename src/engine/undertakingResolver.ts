/**
 * The one undertaking resolver (THR-1392 slice 1).
 *
 * `resolveUndertakingCompletion` looks the object type up, picks the verb's variant
 * from what the object's ownership actually is (`control` → `claim` when nobody holds
 * it, `seize` when someone else does), dispatches to the semantic the type declared,
 * and emits one `strategic_world_change` naming the object. It replaces the
 * per-template switch in `strategicActionLifecycle.executeInstantMutation` — behind
 * `UNDERTAKING_MODEL`, which stays on `templates` until the census passes on cells.
 *
 * Ownership is read here and nowhere else on the cell path (`ownershipOf`), so the
 * motive gate, the target rule and the control variant all agree on who holds what.
 */
import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type {
  UndertakingObjectHandle,
  UndertakingObjectTypeId,
  UndertakingOwnership,
  UndertakingVerb,
  UndertakingVerbVariant,
} from '../types/strategicAction';
import type { SimulationRuntime } from './simulationRuntime';
import type { GraphOpResult } from './strategicGraphOps';
import {
  type ObjectVerbContext,
  type ObjectVerbEntry,
  type UndertakingObjectType,
  getUndertakingObjectType,
  isObjectOfType,
  objectIdOf,
  resolveObjectOwners,
  tierOfObject,
} from '../data/undertaking-objects';
import { STRATEGIC_VERB_OF_UNDERTAKING_VERB } from '../data/strategic-action-constants';
import { emitTrace } from './traceBuffer';

export type ObjectOwnership = 'own' | 'other' | 'unowned';

/** Whose the object is, from the actor's side. Co-owned with a stranger reads as `other`. */
export function ownershipOf(
  graph: WorldGraph,
  actorId: string,
  type: UndertakingObjectType,
  handle: UndertakingObjectHandle,
): ObjectOwnership {
  const owners = resolveObjectOwners(graph, type, handle);
  if (owners.length === 0) return 'unowned';
  return owners.every(o => o === actorId) ? 'own' : 'other';
}

export function ownershipSatisfies(rule: UndertakingOwnership, actual: ObjectOwnership): boolean {
  return rule === 'any' || rule === actual;
}

/**
 * The variant a verb resolves to against this object. `control` is the only verb
 * with variants: `claim` for the unheld, `seize` for another's; an object the actor
 * already holds cannot be controlled again, so that answers `null`.
 */
export function resolveVerbVariant(
  graph: WorldGraph,
  actorId: string,
  verb: UndertakingVerb,
  type: UndertakingObjectType,
  handle: UndertakingObjectHandle,
): UndertakingVerbVariant | null {
  if (verb !== 'control') return verb;
  const ownership = ownershipOf(graph, actorId, type, handle);
  if (ownership === 'unowned') return 'control:claim';
  if (ownership === 'other') return 'control:seize';
  return null;
}

/** The entry a type declares for a verb variant, if any. */
export function verbEntryOf(type: UndertakingObjectType, variant: UndertakingVerbVariant): ObjectVerbEntry | undefined {
  return type.verbs[variant];
}

export interface UndertakingResolutionInput {
  readonly state: GameState;
  readonly graph: WorldGraph;
  readonly actorId: string;
  readonly verb: UndertakingVerb;
  readonly objectTypeId: UndertakingObjectTypeId;
  readonly handle: UndertakingObjectHandle;
  readonly tick: number;
  readonly projectId?: string;
  readonly runtime?: SimulationRuntime;
  readonly originLocationId?: string;
  readonly targetNodeId?: string;
  readonly boundCastIds?: readonly string[];
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface UndertakingResolution {
  readonly ops: GraphOpResult[];
  /** The variant that ran, or `null` when nothing could. */
  readonly variant: UndertakingVerbVariant | null;
  /** Why nothing ran, when nothing did. */
  readonly refused?:
    | 'unknown_object_type'
    | 'object_gone'
    | 'not_applicable'
    | 'no_semantic_declared'
    | 'sustained_mode'
    | 'semantic_threw';
}

/**
 * Run the verb on the object. Never throws (NFP #4): a missing type, a vanished
 * object, an undeclared semantic and a throwing semantic each return a refusal with
 * a failed op, and the undeclared case traces `undertaking_cell_unreachable` so a
 * cell nobody can complete is a measurement.
 */
export function resolveUndertakingCompletion(input: UndertakingResolutionInput): UndertakingResolution {
  const { graph, actorId, verb, objectTypeId, handle, tick } = input;
  const type = getUndertakingObjectType(objectTypeId);
  if (!type) {
    return { ops: [{ success: false, op: 'resolve_undertaking', error: `unknown_object_type:${objectTypeId}` }], variant: null, refused: 'unknown_object_type' };
  }
  // `found` acts on a site the object does not exist at yet; every other verb needs the object.
  if (verb !== 'found' && !isObjectOfType(graph, type, handle)) {
    return { ops: [{ success: false, op: 'resolve_undertaking', error: `object_gone:${objectIdOf(handle)}` }], variant: null, refused: 'object_gone' };
  }

  const variant = resolveVerbVariant(graph, actorId, verb, type, handle);
  if (variant === null) {
    return { ops: [{ success: false, op: 'resolve_undertaking', error: 'control_over_own_object' }], variant: null, refused: 'not_applicable' };
  }

  const entry = verbEntryOf(type, variant);
  if (!entry) {
    emitTrace({
      category: 'undertaking_cell_unreachable',
      tick,
      verb,
      objectTypeId,
      reason: 'no_semantic_declared',
      summary: `${variant} × ${objectTypeId}: no semantic declared — nothing ran`,
    });
    return { ops: [{ success: false, op: 'resolve_undertaking', error: `no_semantic_declared:${objectTypeId}.${variant}` }], variant, refused: 'no_semantic_declared' };
  }
  if (typeof entry !== 'function') {
    // A sustained mode (`claim_control`) never reaches completion; the lifecycle
    // dispatches it before any mutation runs. Reaching here is a wiring defect.
    return { ops: [{ success: false, op: 'resolve_undertaking', error: `sustained_mode:${entry.mode}` }], variant, refused: 'sustained_mode' };
  }

  const ctx: ObjectVerbContext = {
    state: input.state, graph, actorId, handle, tick,
    projectId: input.projectId, runtime: input.runtime,
    originLocationId: input.originLocationId, targetNodeId: input.targetNodeId,
    boundCastIds: input.boundCastIds, params: input.params,
  };

  let result: GraphOpResult;
  try {
    result = entry(ctx);
  } catch (err) {
    result = { success: false, op: `${variant}:${objectTypeId}`, error: `semantic_threw:${err instanceof Error ? err.message : String(err)}` };
    return { ops: [result], variant, refused: 'semantic_threw' };
  }

  emitTrace({
    category: 'strategic_world_change',
    tick,
    actorId,
    projectId: input.projectId,
    verb: STRATEGIC_VERB_OF_UNDERTAKING_VERB[verb],
    undertakingVerb: variant,
    objectTypeId,
    objectId: objectIdOf(handle),
    succeeded: result.success,
    graphOps: [result.op],
    catalystSeeded: false,
    affectedNodeIds: [objectIdOf(handle), ...(result.createdId ? [result.createdId] : [])],
    summary: result.success
      ? `${actorId}: ${variant} × ${objectTypeId} on ${objectIdOf(handle)} (${result.op}${result.createdId ? ` → ${result.createdId}` : ''})`
      : `${actorId}: ${variant} × ${objectTypeId} on ${objectIdOf(handle)} failed (${result.error ?? result.op})`,
  });

  return { ops: [result], variant };
}

/** The object's tier for the board, tracing `undertaking_tier_defaulted` when its source is missing. */
export function readObjectTier(
  graph: WorldGraph,
  type: UndertakingObjectType,
  handle: UndertakingObjectHandle,
  tick: number,
): 1 | 2 | 3 {
  const { tier, defaulted } = tierOfObject(graph, type, handle);
  if (defaulted) {
    emitTrace({
      category: 'undertaking_tier_defaulted',
      tick,
      objectTypeId: type.id,
      objectId: objectIdOf(handle),
      tier,
      summary: `${type.id} ${objectIdOf(handle)}: no tier source, defaulted to T${tier}`,
    });
  }
  return tier;
}
