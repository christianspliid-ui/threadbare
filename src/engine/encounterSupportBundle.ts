import type { GameState } from '../types/gameState';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBinding,
  EncounterSupportLocationSpec,
  EncounterSupportSpec,
} from '../types/encounter';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { SublocationPersistence } from '../types/sublocation';
import type { UndertakingBindingRecord } from '../types/strategicAction';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { getAgentLocationId, getAllActorsAtLocation, getSublocationsAt } from './graphQueries';
import { resolveBinding } from './binding/binder';
import { applyModifications } from './binding/applyBinding';
import {
  getLiveBindingsForNode,
  registerBinding,
  type BindingIndex,
} from './binding/bindingRegistry';
import type { RoleCensus } from './binding/roleCensus';

const PERMANENT_SUBLOCATION_PERSISTENCE: SublocationPersistence = { type: 'permanent' };

function makeSupportNodeId(templateId: string, locationId: string, key: string): string {
  return `enc_support_${templateId}_${locationId}_${key}`;
}

function normalizeAnchorLocationId(state: GameState, locationId: string): string {
  const locationNode = state.graph.getNode(locationId);
  if (locationNode?.type === 'location') {
    const parentLocationId = locationNode.properties.parentLocationId as string | undefined;
    return parentLocationId ?? locationId;
  }
  return locationId;
}

function resolveAnchorLocationId(
  state: GameState,
  targetId: string,
  fallbackLocationId?: string,
): string {
  const targetNode = state.graph.getNode(targetId);
  if (targetNode?.type === 'location') {
    return normalizeAnchorLocationId(state, targetId);
  }
  if (targetNode?.type === 'actor') {
    const actorLocationId = getAgentLocationId(state.graph, targetId);
    if (actorLocationId) {
      return normalizeAnchorLocationId(state, actorLocationId);
    }
  }
  if (fallbackLocationId) {
    return normalizeAnchorLocationId(state, fallbackLocationId);
  }
  return targetId;
}

function getLocationCultureId(state: GameState, locationId: string): string | null {
  const cultureEdges = state.graph.getOutgoingEdges(locationId, 'belongs_to');
  for (const edge of cultureEdges) {
    if ((edge.properties.cultureLayer as string | undefined) === 'current') {
      return edge.target;
    }
  }
  return cultureEdges[0]?.target ?? null;
}

function findFactionNodeId(state: GameState, factionDefId: string | undefined): string | null {
  if (!factionDefId) return null;
  for (const node of state.graph.getNodesByType('actor')) {
    if (
      node.properties.actorType === 'faction'
      && node.properties.factionDefId === factionDefId
    ) {
      return node.id;
    }
  }
  return null;
}

function resolveLocationSupport(
  state: GameState,
  templateId: string,
  locationId: string,
  spec: EncounterSupportLocationSpec,
  options: { allowMaterializePreseeded?: boolean } = {},
): EncounterSupportBinding | null {
  const sublocation = getSublocationsAt(state.graph, locationId).find(
    loc => loc.properties.sublocationTypeId === spec.sublocationTypeId,
  );
  if (sublocation) {
    return {
      key: spec.key,
      nodeId: sublocation.id,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  if (spec.delivery !== 'lazy-materialize-on-trigger' && !(options.allowMaterializePreseeded && spec.delivery === 'pre-seeded')) {
    return null;
  }

  const supportId = makeSupportNodeId(templateId, locationId, spec.key);
  const existing = state.graph.getNode(supportId);
  if (existing) {
    return {
      key: spec.key,
      nodeId: existing.id,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  state.graph.addNode({
    id: supportId,
    type: 'location',
    name: spec.fallbackName ?? spec.sublocationTypeId,
    properties: {
      locationSubtype: 'encounter_support',
      sublocationTypeId: spec.sublocationTypeId,
      parentLocationId: locationId,
      persistence: PERMANENT_SUBLOCATION_PERSISTENCE,
      generatedBy: 'encounter_support_bundle',
      encounterSupportKey: spec.key,
      encounterTemplateId: templateId,
    },
  });
  state.graph.addEdge({
    id: `${supportId}_contained_by_${locationId}`,
    source: locationId,
    target: supportId,
    type: 'contains',
    properties: {},
  });

  return {
    key: spec.key,
    nodeId: supportId,
    kind: spec.kind,
    delivery: spec.delivery,
    persistence: spec.persistence,
    reused: false,
  };
}

function findExistingActorSupport(
  state: GameState,
  placementId: string,
  spec: EncounterSupportActorSpec,
): string | null {
  const candidates = getAllActorsAtLocation(state.graph, placementId)
    .filter(node => node.properties.actorType === 'individual');

  const supportMatch = candidates.find(
    node => node.properties.encounterSupportRole === spec.supportRole,
  );
  if (supportMatch) return supportMatch.id;

  const reusableRoles = new Set(spec.reuseNpcRoles ?? []);
  if (reusableRoles.size === 0) return null;

  const roleMatch = candidates.find(node => {
    if (node.properties.encounterSupportRole !== undefined) return false;
    const npcRole = node.properties.npcRole as string | undefined;
    return npcRole !== undefined && reusableRoles.has(npcRole);
  });
  return roleMatch?.id ?? null;
}

/** What a walk-on is made of — the parameters {@link materializeWalkOnActor} needs. */
export interface WalkOnSpec {
  /** The node id to write. The caller owns the naming scheme, and thus idempotency. */
  readonly nodeId: string;
  readonly name?: string;
  readonly npcRole?: string;
  /** Stamped as `encounterSupportRole`; also the faction membership role. */
  readonly supportRole?: string;
  readonly factionDefId?: string;
  /** Provenance — which system made this person, for the debug surfaces. */
  readonly generatedBy: string;
  /** Extra provenance properties, merged last. */
  readonly extraProperties?: Record<string, unknown>;
}

/**
 * Write one walk-on: a body at a place, with a culture and maybe a faction.
 *
 * This is the **legacy find-or-mint path's writer**, extracted (THR-1296 slice 5) so
 * the undertaking creation effects can spawn a `scene-only` face through the same
 * code rather than a second copy of this node shape. It deliberately stays thin —
 * no capabilities, no axiological profile, no ambitions. A walk-on is cardboard by
 * design; {@link import('./binding/mintInhabitant').mintInhabitant} is the born-real
 * path, and the split is what keeps the 1/tick birth budget spent on people the world
 * will keep.
 *
 * Idempotent on `nodeId` — a second call returns the existing node untouched.
 */
export function materializeWalkOnActor(
  state: GameState,
  anchorLocationId: string,
  placementId: string,
  spec: WalkOnSpec,
): string {
  const existing = state.graph.getNode(spec.nodeId);
  if (existing) return existing.id;

  state.graph.addNode({
    id: spec.nodeId,
    type: 'actor',
    // `GraphNode.name` is required. The encounter path always supplies one, so this
    // fallback never fires there and the extraction stays behaviour-identical; a
    // creation effect with no authored name falls back to its role rather than to
    // `undefined`, which would have written a nameless person into the world.
    name: spec.name ?? spec.npcRole ?? spec.nodeId,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      npcRole: spec.npcRole,
      encounterSupportRole: spec.supportRole,
      generatedBy: spec.generatedBy,
      importance: 0,
      sphereAffinity: null,
      reputationScore: DEFAULT_REPUTATION,
      ...(spec.extraProperties ?? {}),
    },
  });

  state.graph.addEdge({
    id: `${spec.nodeId}_located_at_${placementId}`,
    source: spec.nodeId,
    target: placementId,
    type: 'located_at',
    properties: {},
  });

  const cultureId = getLocationCultureId(state, anchorLocationId);
  if (cultureId) {
    state.graph.addEdge({
      id: `edge_culture_${spec.nodeId}_${cultureId}`,
      source: spec.nodeId,
      target: cultureId,
      type: 'belongs_to',
      properties: { culturalStrength: 1.0 },
    });
  }

  const factionId = findFactionNodeId(state, spec.factionDefId);
  if (factionId) {
    state.graph.addEdge({
      id: `${spec.nodeId}_member_of_${factionId}`,
      source: spec.nodeId,
      target: factionId,
      type: 'member_of',
      properties: {
        role: spec.supportRole,
        rank: 0.05,
        joinedTick: state.tick,
      },
    });
  }

  return spec.nodeId;
}

function materializeActorSupport(
  state: GameState,
  templateId: string,
  anchorLocationId: string,
  placementId: string,
  spec: EncounterSupportActorSpec,
): string {
  return materializeWalkOnActor(state, anchorLocationId, placementId, {
    nodeId: makeSupportNodeId(templateId, anchorLocationId, spec.key),
    name: spec.spawnName,
    npcRole: spec.spawnNpcRole,
    supportRole: spec.supportRole,
    factionDefId: spec.factionDefId,
    generatedBy: 'encounter_support_bundle',
    extraProperties: {
      encounterSupportKey: spec.key,
      encounterTemplateId: templateId,
    },
  });
}

function resolveActorSupport(
  state: GameState,
  templateId: string,
  anchorLocationId: string,
  bindings: Map<string, EncounterSupportBinding>,
  spec: EncounterSupportActorSpec,
  options: { allowMaterializePreseeded?: boolean } = {},
): EncounterSupportBinding | null {
  const placementId = spec.preferredLocationKey
    ? bindings.get(spec.preferredLocationKey)?.nodeId
    : anchorLocationId;

  if (!placementId) return null;

  const existingId = findExistingActorSupport(state, placementId, spec);
  if (existingId) {
    return {
      key: spec.key,
      nodeId: existingId,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  if (spec.delivery !== 'lazy-materialize-on-trigger' && !(options.allowMaterializePreseeded && spec.delivery === 'pre-seeded')) {
    return null;
  }

  const supportId = materializeActorSupport(state, templateId, anchorLocationId, placementId, spec);
  return {
    key: spec.key,
    nodeId: supportId,
    kind: spec.kind,
    delivery: spec.delivery,
    persistence: spec.persistence,
    reused: false,
  };
}

// ─── The scored-binder route (THR-1296 §7, slice 6) ──────────────────

/**
 * What the opt-in route needs, and nothing more.
 *
 * Deliberately a narrow struct rather than `SimulationRuntime`: the census and the
 * index both live on the runtime, but importing it here would drag the whole engine
 * session type into a module the content layer's tests construct by hand — and would
 * put `encounterSupportBundle` one edge away from an import cycle through
 * `binding/creationEffects`, which imports {@link materializeWalkOnActor} from here.
 *
 * The caller assembles it (`phaseAgentDecision` has all three to hand). Absent, every
 * template takes the legacy path regardless of its flag — see
 * {@link prepareEncounterSupportBundle}.
 */
export interface EncounterBinderContext {
  /** `npcRole` → holders, for the scarcity term. Null is legal; scarcity reads neutral. */
  readonly census: RoleCensus | null;
  /** The reverse index over `bindings`, so registration stays O(1) on the node. */
  readonly index: BindingIndex;
  /** The durable ledger — `state.strategicState.bindings`. */
  readonly bindings: UndertakingBindingRecord[];
  /**
   * The agent walking into this encounter — the far end of every story tie.
   *
   * Optional because two of the three call sites are debug tools with no agent in
   * hand. When absent the tie term reads 0 for every candidate, which does not skew
   * the board: it removes a term uniformly rather than favouring anyone.
   */
  readonly actorId?: string;
}

/**
 * What the scored route did with one spec — three outcomes, not two.
 *
 * The distinction that matters is between the two failures. `no_answer` means the
 * board could not run (nothing to score, or it threw), so the legacy resolver should
 * try; `unresolved` means the board ran and its answer was "make a new one", which
 * this spec's `delivery` forbids. Collapsing them into a nullable return makes the
 * second one fall through to the legacy matcher — which then binds the very candidate
 * the board declined, with no ledger row, and reads as a successful bind.
 */
type BinderRouteResult =
  | { readonly outcome: 'bound'; readonly binding: EncounterSupportBinding }
  | { readonly outcome: 'unresolved' }
  | { readonly outcome: 'no_answer' };

const UNRESOLVED: BinderRouteResult = { outcome: 'unresolved' };
const NO_ANSWER: BinderRouteResult = { outcome: 'no_answer' };

/**
 * The ledger's `projectId` for an encounter binding.
 *
 * Encounters are not undertakings and have no project, but the ledger is keyed by one.
 * Rather than widen the record, encounters synthesize a stable id from the template and
 * the anchor — stable being the load-bearing word: `prepareEncounterSupportBundle` runs
 * again every time the encounter is offered, so a per-call id would append a fresh
 * ledger row per offer and grow `strategicState.bindings` without bound over a long run.
 */
function encounterBindingProjectId(templateId: string, anchorLocationId: string): string {
  return `enc_${templateId}_${anchorLocationId}`;
}

/**
 * Write the ledger row for a `must-persist` encounter binding, at most once.
 *
 * `scene-only` specs are not registered at all — that is precisely what declaring
 * scene-only *means*, and a ledger row would make a walk-on defer housekeeping.
 *
 * Idempotency is checked through the node's own bucket rather than by scanning the
 * ledger, so re-offering an encounter a hundred times costs a hundred Map lookups
 * instead of a hundred scans of every binding in the world.
 */
function registerEncounterBinding(
  ctx: EncounterBinderContext,
  projectId: string,
  spec: EncounterSupportActorSpec,
  nodeId: string,
  boundRole: string | undefined,
  tick: number,
): void {
  if (spec.persistence !== 'must-persist') return;

  const already = getLiveBindingsForNode(ctx.index, ctx.bindings, nodeId).some(
    record => record.projectId === projectId && record.castKey === spec.key,
  );
  if (already) return;

  registerBinding(ctx.index, ctx.bindings, {
    projectId,
    castKey: spec.key,
    nodeId,
    kind: 'actor',
    persistence: spec.persistence,
    boundRole,
    boundAtTick: tick,
    stepIndex: 0,
    status: 'live',
  });
}

/**
 * Resolve one actor spec through the scored board.
 *
 * Mirrors the legacy resolver's contract exactly where the contract is not what this
 * slice is changing — same placement resolution, same `delivery` gate, same
 * `EncounterSupportBinding` shape — and differs only in *who gets chosen* and in the
 * ledger row that follows.
 *
 * Two deliberate limits:
 *
 * - **Location specs are not routed.** They stay on `resolveLocationSupport`, matching
 *   slice 4's undertaking rule that a stage is *resolved* rather than scored: the
 *   encounter already chose where it plays, so there is no board to score.
 * - **A mint decision materializes a walk-on synchronously**, not through the 1/tick
 *   mint valve. An encounter is being offered *now* and cannot defer a tick for a
 *   birth; the valve exists so undertakings can wait, and undertakings are the thing
 *   that can. So the binder decides *who*, while *what a new one is made of* is
 *   unchanged from today. Registering that walk-on as must-persist is the status quo
 *   plus enforcement, which is the whole claim of this slice — not born-real cast.
 *
 * The three outcomes are kept distinct on purpose — see {@link BinderRouteResult}. A
 * single nullable return conflated "the board had no answer" with "the board's answer
 * was no", and the second one silently became a fallback to the cruder legacy matcher,
 * overriding a decision that had already been made.
 *
 * @param options.allowMaterializePreseeded Mirrors the legacy resolver's flag; it feeds
 *   the binder's `mintAvailable` rather than being re-checked after the decision.
 */
function resolveActorSupportViaBinder(
  state: GameState,
  templateId: string,
  anchorLocationId: string,
  bindings: Map<string, EncounterSupportBinding>,
  spec: EncounterSupportActorSpec,
  binderCtx: EncounterBinderContext,
  options: { allowMaterializePreseeded?: boolean } = {},
): BinderRouteResult {
  const placementId = spec.preferredLocationKey
    ? bindings.get(spec.preferredLocationKey)?.nodeId
    : anchorLocationId;
  // Not the binder's rule to enforce — let the legacy resolver own it, in one place.
  if (!placementId) return NO_ANSWER;

  const projectId = encounterBindingProjectId(templateId, anchorLocationId);

  // The same gate the legacy resolver applies, computed *before* the board runs so it
  // can be handed to the binder rather than second-guessed after.
  const mayMaterialize = spec.delivery === 'lazy-materialize-on-trigger'
    || (options.allowMaterializePreseeded === true && spec.delivery === 'pre-seeded');

  const decision = resolveBinding(
    {
      projectId,
      castKey: spec.key,
      stepIndex: 0,
      actorId: binderCtx.actorId ?? anchorLocationId,
      acceptedRoles: spec.reuseNpcRoles,
      mintRole: spec.spawnNpcRole,
      stageNodeId: placementId,
    },
    {
      graph: state.graph,
      census: binderCtx.census,
      tick: state.tick,
      // This is what `mintAvailable` is for, and using it is what keeps the decision
      // in one place. A spec whose `delivery` forbids materializing must not merely
      // have its mint *rejected* after the fact — that would throw away a board that
      // held perfectly good reuse rows, because preferring the mint row is a
      // preference, not a veto (slice 4 measured commodity roles preferring mint
      // ~99.8% of the time even with a role-matched local standing at the stage).
      // Withholding the row instead makes the board return the best real candidate.
      mintAvailable: mayMaterialize,
    },
  );

  if (decision.mode === 'refused') {
    // Only a *broken* board falls back. A board that ran and answered "nobody" is
    // honored: `all_vetoed` means every candidate was rejected, and the legacy matcher
    // would bind one of exactly those, un-ledgered. `no_candidates` means the
    // enumeration — a superset of the legacy scan at this placement — was empty, so a
    // fallback would find nothing anyway.
    return decision.reason === 'binder_error' ? NO_ANSWER : UNRESOLVED;
  }

  if (decision.mode === 'mint') {
    // Unreachable while `mintAvailable` is honored; kept because the binder owns that
    // contract and a silent materialize past the delivery gate is the expensive way to
    // discover it changed.
    if (!mayMaterialize) return UNRESOLVED;

    const supportId = materializeActorSupport(state, templateId, anchorLocationId, placementId, spec);
    registerEncounterBinding(binderCtx, projectId, spec, supportId, spec.spawnNpcRole, state.tick);
    return {
      outcome: 'bound',
      binding: {
        key: spec.key,
        nodeId: supportId,
        kind: spec.kind,
        delivery: spec.delivery,
        persistence: spec.persistence,
        reused: false,
      },
    };
  }

  if (decision.mode === 'modify') {
    applyModifications(state.graph, decision.nodeId, decision.modifications);
  }

  const boundRole = state.graph.getNode(decision.nodeId)?.properties.npcRole as string | undefined;
  registerEncounterBinding(binderCtx, projectId, spec, decision.nodeId, boundRole, state.tick);

  return {
    outcome: 'bound',
    binding: {
      key: spec.key,
      nodeId: decision.nodeId,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      // `reuse` and `modify` both hand back somebody the world already had. That is
      // what `reused` has always reported, and a modify does not make a new person —
      // it fills a blank on an existing one.
      reused: true,
    },
  };
}

export interface PreparedEncounterSupportBundleResult {
  anchorLocationId: string;
  bindings: EncounterSupportBinding[];
  blocked: EncounterSupportSpec[];
  unresolved: EncounterSupportSpec[];
}

function prepareEncounterSupportBundleInternal(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
  options: { allowMaterializePreseeded?: boolean; binder?: EncounterBinderContext } = {},
): PreparedEncounterSupportBundleResult {
  if (!template.supportBundle || template.supportBundle.length === 0) {
    const anchorLocationId = resolveAnchorLocationId(state, targetId, fallbackLocationId);
    return {
      anchorLocationId,
      bindings: [],
      blocked: [],
      unresolved: [],
    };
  }

  const anchorLocationId = resolveAnchorLocationId(state, targetId, fallbackLocationId);
  const bindings = new Map<string, EncounterSupportBinding>();
  const unresolved: EncounterSupportSpec[] = [];
  const blocked: EncounterSupportSpec[] = [];

  for (const spec of template.supportBundle) {
    if (spec.delivery === 'blocked-primitive') {
      blocked.push(spec);
      continue;
    }
    if (spec.kind !== 'location') continue;
    const binding = resolveLocationSupport(state, template.id, anchorLocationId, spec, options);
    if (binding) bindings.set(spec.key, binding);
    else unresolved.push(spec);
  }

  // The opt-in gate. Both halves must hold: the template asks for the board, and the
  // caller supplied one. A template flagged in a context that has no binder (the debug
  // tools, a unit test constructing state by hand) takes the legacy path silently —
  // fail-soft, and the reason the golden test can assert byte-identity by simply
  // omitting the context.
  const useBinder = template.useScoredBinder === true && options.binder !== undefined;

  for (const spec of template.supportBundle) {
    if (spec.delivery === 'blocked-primitive') continue;
    if (spec.kind !== 'actor') continue;
    let binding: EncounterSupportBinding | null = null;
    if (useBinder) {
      const routed = resolveActorSupportViaBinder(
        state, template.id, anchorLocationId, bindings, spec, options.binder!, options,
      );
      if (routed.outcome === 'bound') binding = routed.binding;
      // `unresolved` is an answer and is honored as one. Only `no_answer` retries on
      // the legacy path, so an opted-in template never resolves *worse* than an
      // un-migrated one (NFP #4) without letting the fallback overrule a real verdict.
      else if (routed.outcome === 'no_answer') {
        binding = resolveActorSupport(state, template.id, anchorLocationId, bindings, spec, options);
      }
    } else {
      binding = resolveActorSupport(state, template.id, anchorLocationId, bindings, spec, options);
    }
    if (binding) bindings.set(spec.key, binding);
    else unresolved.push(spec);
  }

  return {
    anchorLocationId,
    bindings: template.supportBundle
      .map(spec => bindings.get(spec.key))
      .filter((binding): binding is EncounterSupportBinding => binding != null),
    blocked,
    unresolved,
  };
}

/**
 * @param binder Supply to enable the scored-binder route for templates that opt in
 *   with `useScoredBinder` (THR-1296 §7). Omitted, every template takes the legacy
 *   find-or-mint path regardless of its flag — which is what makes omission the
 *   golden test's control arm.
 */
export function prepareEncounterSupportBundle(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
  binder?: EncounterBinderContext,
): EncounterSupportBinding[] {
  return prepareEncounterSupportBundleInternal(
    state, template, targetId, fallbackLocationId, { binder },
  ).bindings;
}

/** @param binder See {@link prepareEncounterSupportBundle}. */
export function prepareEncounterSupportBundleForContext(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
  binder?: EncounterBinderContext,
): PreparedEncounterSupportBundleResult {
  return prepareEncounterSupportBundleInternal(state, template, targetId, fallbackLocationId, {
    allowMaterializePreseeded: true,
    binder,
  });
}
