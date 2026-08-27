/**
 * The undertaking bind pass — THE BINDER's consumer (THR-1296 §3, slice 4).
 *
 * This is the slice that first *uses* slices 1–3. The registry, the scored board and
 * the mint valve each shipped contract-tested and consumed by nothing; here they are
 * joined into one pass that runs at each checkpoint and answers: who is in this scene,
 * and where does it play?
 *
 * ## Decide in the binder, apply here
 *
 * `resolveBinding` is graph-read-only and returns an *intent*. This module is the only
 * place that acts on one — registering the ledger row, applying a modify's additive
 * fills, queuing a mint. That split is why the scorer can be tested against a fixture
 * graph with no writes to undo, and it is the same split `undertakingCheckpoints`
 * keeps (the checkpoint module reads the graph and returns a record; the lifecycle
 * writes).
 *
 * ## Per-step, not per-undertaking
 *
 * The recon (THR-1289) measured today's behaviour: binding runs **once per action at
 * one anchor**. This pass runs at every checkpoint, resolves the stage fresh each time
 * (`spec.anchor` → a location slot in the same bundle; otherwise the undertaking's
 * `targetNodeId`), and prefers cast already bound at an earlier step
 * (`BINDER_CARRY_FORWARD_BONUS`). Continuity is a weight, not a rule — a scene can
 * recast when the world has moved on, and usually will not.
 *
 * ## Loss becomes story, exactly once
 *
 * A must-persist binding that broke — by the `removeNode` hook, or by this pass's own
 * dual gone-test catching a soft death no hook can see — is reported to the caller as
 * a `BindPassLoss`. The lifecycle turns it into a named complication: an advance
 * downgrades to advance-at-cost, or halts outright when the lost role was singular
 * (`scarcity01 ≥ BINDER_SINGULAR_SCARCITY_THRESHOLD` — losing the only archmage is
 * not a setback). `lossReported` makes that fire once per breakage rather than at
 * every checkpoint until the slot re-binds.
 *
 * ## The empty case is the common case
 *
 * No shipped template declares `cast` in v1 — doc 2 authors those rows. The pass
 * therefore early-returns on an absent bundle *before* touching the registry, the
 * census or the graph, and `undertakingBindPass.test.ts` pins that neutrality so the
 * first authored row fails a test deliberately rather than landing on an unproven seam.
 */
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { AxiologicalProfile } from '../../types/agent';
import type {
  StrategicProjectRuntime,
  StrategicActionTemplate,
  StrategicRuntimeState,
  UndertakingBindingRecord,
  UndertakingCastSpec,
  UndertakingBindingBrokenCause,
} from '../../types/strategicAction';
import { isAgentGone } from '../groups/groupQueries';
import { emitTrace } from '../traceBuffer';
import { resolveBinding, type BindingRequest, type BindingModification } from './binder';
import {
  type BindingIndex,
  registerBinding,
  markBindingsBroken,
} from './bindingRegistry';
import { enqueueMint, isMintReady, mintNodeId, getMintQueue } from './mintInhabitant';
import { scarcity01, type RoleCensus } from './roleCensus';
import {
  BINDER_SINGULAR_SCARCITY_THRESHOLD,
  BINDER_MINT_QUEUE_MAX,
} from '../../data/binder-constants';

// ─── Shapes ─────────────────────────────────────────────────────────

export interface BindPassInput {
  readonly graph: WorldGraph;
  readonly strategicState: StrategicRuntimeState;
  readonly index: BindingIndex;
  readonly census: RoleCensus | null;
  readonly project: StrategicProjectRuntime;
  readonly template: StrategicActionTemplate | undefined;
  readonly tick: number;
}

/**
 * A must-persist cast member this undertaking lost — the complication's input.
 *
 * Carries the name rather than only the id because the moment says it out loud, and
 * a moment that reads "hits serious trouble" without naming who is gone is exactly
 * the generic beat this whole system exists to replace.
 */
export interface BindPassLoss {
  readonly castKey: string;
  readonly nodeId: string;
  readonly lostName: string;
  readonly cause: UndertakingBindingBrokenCause;
  /** Singular role ⇒ the checkpoint halts instead of downgrading to at-cost. */
  readonly singular: boolean;
}

export interface BindPassResult {
  /** The project with `rebindRequested` consumed. Unchanged when nothing bound. */
  readonly project: StrategicProjectRuntime;
  /** The worst loss since the last pass, or `null`. */
  readonly loss: BindPassLoss | null;
  /** A slot is waiting on a queued mint — the checkpoint defers rather than halting. */
  readonly awaitingMint: boolean;
  /** Slots newly bound this pass — inspection and tests. */
  readonly bound: number;
}

const NEUTRAL = (project: StrategicProjectRuntime): BindPassResult => ({
  project, loss: null, awaitingMint: false, bound: 0,
});

// ─── Spec helpers ───────────────────────────────────────────────────

/**
 * The role a binding is filled by, for the ledger's own memory.
 *
 * The bound node's stated `npcRole` when it has one; otherwise the slot's
 * `mintRole`, which is what a modify would have written and what a mint was born
 * into — so the answer is the role the scene actually cast, either way.
 */
function roleOf(
  graph: WorldGraph,
  nodeId: string,
  spec: UndertakingCastSpec,
): string | undefined {
  const stated = graph.getNode(nodeId)?.properties?.npcRole as string | undefined;
  return stated ?? spec.mintRole;
}

/** Is this slot wanted at this checkpoint? Absent `steps` ⇒ every step. */
function wantedAtStep(spec: UndertakingCastSpec, stepIndex: number): boolean {
  if (!spec.steps || spec.steps.length === 0) return true;
  return spec.steps.includes(stepIndex);
}

/**
 * Where this slot's scene plays.
 *
 * `spec.anchor` names a location slot in the same bundle; its bound node is the stage.
 * A self-reference is ignored rather than treated as an error — a location slot is its
 * own stage, so the answer is the same either way and refusing would be pedantry.
 * Everything else falls back to the undertaking's own target.
 */
function resolveStageId(
  spec: UndertakingCastSpec,
  project: StrategicProjectRuntime,
  liveByKey: ReadonlyMap<string, UndertakingBindingRecord>,
): string | undefined {
  if (spec.anchor && spec.anchor !== spec.key) {
    const anchored = liveByKey.get(spec.anchor);
    if (anchored) return anchored.nodeId;
    // The anchor slot has not bound yet. Fall through to the undertaking's target
    // rather than refusing: bundle order is authored, and a slot that names an
    // anchor bound later in the same pass would otherwise never bind at all.
  }
  return project.targetNodeId;
}

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Re-check this project's live bindings against the world, both shapes of gone.
 *
 * Scoped to one project rather than reusing `validateBindings` (which sweeps the whole
 * ledger): this runs per undertaking per checkpoint, and a whole-ledger scan per
 * project would be quadratic in undertakings for no gain. The dual test is the same —
 * `!getNode || isAgentGone` — and it is the *only* detector for a soft death, where no
 * node is removed and so no hook can fire.
 */
function validateProjectBindings(
  input: BindPassInput,
  live: readonly UndertakingBindingRecord[],
): void {
  const { graph, strategicState, index, tick } = input;
  const bindings = strategicState.bindings;
  if (!bindings) return;

  for (const record of live) {
    const node = graph.getNode(record.nodeId);
    if (!node) {
      markBindingsBroken(index, bindings, record.nodeId, 'node_removed', tick);
      continue;
    }
    if (record.kind === 'actor' && isAgentGone(node)) {
      markBindingsBroken(index, bindings, record.nodeId, 'deceased', tick);
    }
  }
}

// ─── Applying a decision ────────────────────────────────────────────

/**
 * Apply a modify's fills. Additive-only, re-checked at write time.
 *
 * The binder only *offers* a fill for something blank, so the guards here are
 * belt-and-braces — but the board is scored against the world as it was at the top of
 * the pass, and an earlier slot in the same pass can have written the very field this
 * one means to fill. Re-reading at write time is what keeps "modify never overwrites"
 * true under composition rather than only in isolation.
 */
function applyModifications(
  graph: WorldGraph,
  nodeId: string,
  modifications: readonly BindingModification[],
): void {
  const node = graph.getNode(nodeId);
  if (!node) return;

  const properties: Record<string, unknown> = {};
  let touched = false;

  for (const mod of modifications) {
    if (mod.kind === 'set_npc_role') {
      if (node.properties?.npcRole) continue; // already stated — never overwrite
      properties.npcRole = mod.role;
      touched = true;
    } else {
      const existing = node.properties?.axiologicalProfile as AxiologicalProfile | undefined;
      if (existing?.[mod.axis] !== undefined) continue; // stated — never overwrite
      properties.axiologicalProfile = {
        ...(existing ?? {}),
        ...(properties.axiologicalProfile as AxiologicalProfile | undefined),
        [mod.axis]: mod.signedValue,
      };
      touched = true;
    }
  }

  // `updateNode` merges `properties` shallowly and replaces the node object, so the
  // handle read above is stale afterwards — take the id, never the node (the
  // documented `updateNode` trap).
  if (touched) graph.updateNode(nodeId, { properties: { ...node.properties, ...properties } });
}

// ─── The pass ───────────────────────────────────────────────────────

/**
 * Bind one undertaking's cast and stage for the step it is about to resolve.
 *
 * Fail-soft (NFP #4): every branch that could throw is inside the guard, and a throw
 * degrades to the neutral result — an undertaking whose binding failed resolves its
 * checkpoint uncast, exactly as every undertaking does today. The tick loop never sees
 * an exception from here.
 */
export function runBindPass(input: BindPassInput): BindPassResult {
  const { project, template, tick } = input;

  const specs = template?.cast;
  // The v1 case, and the reason this costs nothing: no shipped template declares cast,
  // so the pass returns before it touches the registry, the census or the graph.
  if (!specs || specs.length === 0) return NEUTRAL(project);

  try {
    return bindPassInner(input, specs);
  } catch (err) {
    emitTrace({
      category: 'binding_decision',
      tick,
      agentId: project.actorId,
      projectId: project.projectId,
      castKey: '$pass',
      stepIndex: project.checkpointIndex ?? 0,
      mode: 'refused',
      refusedReason: 'binder_error',
      rows: [],
      rowsConsidered: 0,
      summary:
        `bind pass failed for ${project.projectId}: ` +
        `${err instanceof Error ? err.message : String(err)}`,
    });
    return NEUTRAL(project);
  }
}

function bindPassInner(
  input: BindPassInput,
  specs: readonly UndertakingCastSpec[],
): BindPassResult {
  const { graph, strategicState, index, census, project, tick } = input;
  const stepIndex = project.checkpointIndex ?? 0;

  if (!strategicState.bindings) strategicState.bindings = [];
  const bindings = strategicState.bindings;

  const mine = bindings.filter(b => b.projectId === project.projectId);
  const liveBefore = mine.filter(b => b.status === 'live');

  // 1. Both shapes of gone, before anything reads the ledger as truth.
  validateProjectBindings(input, liveBefore);

  // 2. The loss report — once per breakage.
  const loss = reportLoss(graph, census, mine, tick);

  // 3. `rebindRequested` (THR-1292 §3 escalation seam). An escalation is a fresh
  //    attempt at the same undertaking, so it gets a fresh cast: release the live
  //    bindings and let every slot re-score below. The flag clears either way, so a
  //    template with no bindings to release does not carry it forever.
  let workingProject = project;
  if (project.rebindRequested) {
    let released = 0;
    for (const record of mine) {
      if (record.status !== 'live') continue;
      record.status = 'released';
      record.endedAtTick = tick;
      released++;
    }
    workingProject = { ...project, rebindRequested: false };
    emitTrace({
      category: 'binding_decision',
      tick,
      agentId: project.actorId,
      projectId: project.projectId,
      castKey: '$rebind',
      stepIndex,
      mode: 'refused',
      refusedReason: 'no_candidates',
      rows: [],
      rowsConsidered: 0,
      summary:
        `rebind requested for ${project.projectId} — released ${released} binding(s) ` +
        `at step ${stepIndex}`,
    });
  }

  // 4. Bind every slot this step wants that is not already held.
  const liveByKey = new Map<string, UndertakingBindingRecord>();
  for (const record of bindings) {
    if (record.projectId === project.projectId && record.status === 'live') {
      liveByKey.set(record.castKey, record);
    }
  }

  // Carry-forward: everyone this undertaking has ever held live. Continuity is scored,
  // not enforced — the bonus rides on the row and can still lose to a better scene.
  const carryForward = new Set<string>(
    bindings
      .filter(b => b.projectId === project.projectId && b.status !== 'broken')
      .map(b => b.nodeId),
  );

  let awaitingMint = false;
  let bound = 0;

  // Location slots first: an actor slot may anchor to one, and bundle order is the
  // author's business rather than a constraint the engine should impose on them.
  const ordered = [...specs].sort((a, b) =>
    a.kind === b.kind ? 0 : a.kind === 'location' ? -1 : 1,
  );

  for (const spec of ordered) {
    if (!wantedAtStep(spec, stepIndex)) continue;
    if (liveByKey.has(spec.key)) continue; // held from an earlier step — carry it

    const stageNodeId = resolveStageId(spec, workingProject, liveByKey);

    if (spec.kind === 'location') {
      // A stage is resolved, not scored: the undertaking already chose where it plays
      // (`targetNodeId`, itself the product of the candidate scorer). What this
      // registers is the *persistence* claim on it — which is the whole point, and
      // what makes a siege razing a bound stage loud instead of silent.
      if (!stageNodeId || !graph.getNode(stageNodeId)) continue;
      const record = registerBinding(index, bindings, {
        projectId: project.projectId,
        castKey: spec.key,
        nodeId: stageNodeId,
        kind: 'location',
        persistence: spec.persistence,
        boundAtTick: tick,
        stepIndex,
        status: 'live',
      });
      liveByKey.set(spec.key, record);
      carryForward.add(stageNodeId);
      bound++;
      continue;
    }

    // An actor slot already waiting on a mint: the person may have been born since.
    const pendingId = mintNodeId(project.projectId, spec.key);
    const queued = getMintQueue(strategicState).some(
      r => r.projectId === project.projectId && r.castKey === spec.key,
    );
    if (queued || graph.getNode(pendingId)) {
      if (isMintReady(graph, project.projectId, spec.key)) {
        const record = registerBinding(index, bindings, {
          projectId: project.projectId,
          castKey: spec.key,
          nodeId: pendingId,
          kind: 'actor',
          persistence: spec.persistence,
          boundRole: roleOf(graph, pendingId, spec),
          boundAtTick: tick,
          stepIndex,
          status: 'live',
        });
        liveByKey.set(spec.key, record);
        carryForward.add(pendingId);
        bound++;
      } else {
        awaitingMint = true;
      }
      continue;
    }

    const request: BindingRequest = {
      projectId: project.projectId,
      castKey: spec.key,
      stepIndex,
      actorId: project.actorId,
      acceptedRoles: spec.acceptedRoles,
      mintRole: spec.mintRole,
      stageNodeId,
      identityRequirement: spec.identityRequirement,
      carryForward,
    };

    const mintAvailable = getMintQueue(strategicState).length < BINDER_MINT_QUEUE_MAX;
    const decision = resolveBinding(request, { graph, census, tick, mintAvailable });

    if (decision.mode === 'refused') continue;

    if (decision.mode === 'mint') {
      if (!stageNodeId) continue; // nowhere to be born — refuse rather than invent
      const enqueued = enqueueMint(strategicState, {
        projectId: project.projectId,
        castKey: spec.key,
        stepIndex,
        role: decision.role,
        placementNodeId: stageNodeId,
        persistence: spec.persistence,
        spawnName: spec.spawnName,
        factionDefId: spec.factionDefId,
        identityRequirement: spec.identityRequirement,
        requestedAtTick: tick,
      }, tick);
      if (enqueued.queued) awaitingMint = true;
      continue;
    }

    if (decision.mode === 'modify') {
      applyModifications(graph, decision.nodeId, decision.modifications);
    }

    const record = registerBinding(index, bindings, {
      projectId: project.projectId,
      castKey: spec.key,
      nodeId: decision.nodeId,
      kind: 'actor',
      persistence: spec.persistence,
      boundRole: roleOf(graph, decision.nodeId, spec),
      boundAtTick: tick,
      stepIndex,
      status: 'live',
    });
    liveByKey.set(spec.key, record);
    carryForward.add(decision.nodeId);
    bound++;
  }

  return { project: workingProject, loss, awaitingMint, bound };
}

/**
 * The worst unreported must-persist breakage, marked reported as it is returned.
 *
 * "Worst" is singular-first then oldest: a halt outranks a downgrade, and among equals
 * the loss that happened first is the one the story is about. Scene-only bindings break
 * silently on purpose — that is what declaring `scene-only` *means*, and reporting them
 * would make the persistence contract decorative.
 */
function reportLoss(
  graph: WorldGraph,
  census: RoleCensus | null,
  mine: readonly UndertakingBindingRecord[],
  tick: number,
): BindPassLoss | null {
  const candidates: BindPassLoss[] = [];

  for (const record of mine) {
    if (record.status !== 'broken') continue;
    if (record.lossReported) continue;
    if (record.persistence !== 'must-persist') {
      record.lossReported = true; // consumed silently — scene-only is allowed to vanish
      continue;
    }
    record.lossReported = true;

    const node: GraphNode | undefined = graph.getNode(record.nodeId);
    // `boundRole` first: the node is usually gone, and reading `npcRole` off nothing
    // scores as maximally scarce, which would make every honest death "singular" and
    // halt undertakings that should merely have been set back.
    const role = record.boundRole ?? (node?.properties?.npcRole as string | undefined);
    candidates.push({
      castKey: record.castKey,
      nodeId: record.nodeId,
      // The node is usually gone by now, which is the point — the ledger is what
      // remembers there was somebody there at all.
      lostName: node?.name ?? record.castKey,
      cause: record.brokenCause ?? 'severed',
      singular:
        record.kind === 'actor' &&
        scarcity01(census, role) >= BINDER_SINGULAR_SCARCITY_THRESHOLD,
    });
  }

  if (candidates.length === 0) return null;
  const singular = candidates.find(c => c.singular);
  const chosen = singular ?? candidates[0];
  void tick;
  return chosen;
}
