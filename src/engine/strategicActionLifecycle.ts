// src/engine/strategicActionLifecycle.ts
//
// Start, advance, complete, fail, and manage multi-tick strategic projects
// and control stances. Handles instant execution and catalyst seeding.
//
// NFP #3 (Determinism): Uses seeded PRNG for catalyst seeding.
// NFP #4 (Fail-soft): Invalid targets → failure trace, no crash.

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type {
  StrategicActionCandidate,
  StrategicProjectRuntime,
  StrategicControlState,
  StrategicHistoryEntry,
  StrategicRuntimeState,
  UndertakingMomentRecord,
} from '../types/strategicAction';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import {
  LOCATION_BOOST_EXPIRY_SUFFIX,
  UNDERTAKING_TIMEOUT_TICKS,
  STRATEGIC_DEFAULT_PROJECT_WORK_TICKS,
  STRATEGIC_CATALYST_SEED_CHANCE,
  STRATEGIC_CATALYST_SEED_DELAY_TICKS,
  STRATEGIC_CATALYST_SEED_PRIORITY,
  STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS,
  STRATEGIC_CONTROL_DEGRADATION_RATE,
  STRATEGIC_HISTORY_WINDOW_TICKS,
  ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES,
  ROUTE_IDENTITY_SUBTYPE,
  WARBAND_RECRUIT_CAST_KEY,
  FOUNDED_SETTLEMENT_INITIAL_PROSPERITY,
  FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS,
  MOMENT_INTERRUPT_SIGNIFICANCE,
  MOMENT_COMPLETION_SIGNIFICANCE,
} from '../data/strategic-action-constants';
import {
  createTradeRoute,
  createLocation,
  blockadeRoute,
  createSublocation,
  claimControl,
  releaseControl,
  recordIntelligence,
  modifyLocationProperty,
  createRelationEdge,
  spawnClue,
  seedKnowsOf,
  mintTreasureMap,
  mintLeverageMark,
  pressTheMark,
  mintMasterwork,
  raiseWarband,
  reinforceWarband,
  disbandGroup,
  foundFaction,
  type GraphOpResult,
} from './strategicGraphOps';
import { resolveDurableActorLocation } from './tradeRouteOps';
import { resolveLocationToHex } from './encounterAwareness';
import { getAgentLocationId } from './graphQueries';
import { getPlaceTierLocations } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { getStrategicTemplate } from './strategicActionCandidates';
import { createUndertakingOutcomeNode } from './grievance/undertakingOutcomeNode';
import {
  findGrievanceForAmbitionTemplate,
  satisfyGrievance,
} from './grievance/grievanceLifecycle';
import {
  resolveUndertakingCheckpoint,
  buildResidueEvent,
  buildAbandonMintEvent,
  buildMoment,
  classifyFailureResidue,
  resolveMomentPresentation,
  type CheckpointBindingInput,
} from './undertakingCheckpoints';
import { runBindPass } from './binding/undertakingBindPass';
import { recomputeCalling } from './calling';
import { applyCreationEffects } from './binding/creationEffects';
import { getBindings, releaseBindingsForProject } from './binding/bindingRegistry';
import { ensureRoleCensus, type SimulationRuntime } from './simulationRuntime';
import {
  MENTORSHIP_TEMPLATE_ID,
  isMentorshipEnabled,
  applyPendingMentorshipSevers,
  bootstrapMentorship,
  advanceMentorshipCheckpoint,
  resolveMentorshipUndertaking,
} from './mentorshipUndertaking';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { possessive, generateWorkName, generateFailureScarName } from './naming/workNames';
import { getUndertakingKindForTemplate } from '../data/undertaking-kinds';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { refreshHoldingFaceNames } from './holdings';

// ─── Naming (THR-1297 §5) ───────────────────────────────────────────

/**
 * The shape both legacy hand-rolled name strings had. Kept as one constant so the
 * two arms that used to spell it out separately cannot drift apart again.
 */
const LEGACY_NAME_TEMPLATE = "{actor}'s {thing} at {location}";

/** What an unresolvable actor or location renders as. Never blank, never an id. */
const NAME_TEMPLATE_UNKNOWN = 'Unknown';

/**
 * Render a `mutationHint.nameTemplate`.
 *
 * **The possessive is resolved, not string-substituted.** Every authored template
 * spells the possessive inline (`"{actor}'s Workshop at {location}"`), and the old
 * renderer replaced `{actor}` with the raw name — so an actor named Silas got
 * "Silas's Workshop" where English wants "Silas' Workshop". Matching `{actor}'s` as
 * a *unit* and routing it through the one `possessive()` fixes every such template
 * at once, including ones not yet written, and needs no edit to the content files.
 *
 * Order matters: the possessive form is consumed before the bare `{actor}` pass, or
 * the bare pass would eat the token and leave a stray `'s`.
 */
export function renderNameTemplate(
  template: string,
  actorName: string | undefined,
  locationName: string | undefined,
  thing?: string,
): string {
  const actor = actorName ?? NAME_TEMPLATE_UNKNOWN;
  const location = locationName ?? NAME_TEMPLATE_UNKNOWN;
  return template
    .replace(/\{actor\}'s/g, possessive(actor))
    .replace(/\{actor\}/g, actor)
    .replace(/\{location\}/g, location)
    .replace(/\{thing\}/g, thing ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * An unclaimed hex to found a place-tier location on (THR-1308).
 *
 * Starts at `origin` and, if something already stands there, spirals outward through
 * whole rings up to `FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS`. Returns `null` when the
 * whole neighbourhood is built up — a refusal, not a fallback: founding a settlement
 * on top of one that exists is not founding anything, and the *right* answer when
 * there is no room is that the undertaking fails.
 *
 * Only **place-tier** locations occupy a hex. Sublocations sit inside a parent and
 * share its hex by construction, so counting them would make every settled hex look
 * doubly occupied and change nothing but the arithmetic (`sublocationShape.ts`,
 * THR-1183).
 *
 * NFP #3 (Determinism): candidates are ordered by ring distance, then by column, then
 * by row — no PRNG, so the same world founds on the same hex.
 */
export function findUnclaimedSite(
  graph: WorldGraph,
  origin: { col: number; row: number },
  radius: number = FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS,
): { col: number; row: number } | null {
  const occupied = new Set<string>();
  for (const node of getPlaceTierLocations(graph)) {
    const col = node.properties.hexCol;
    const row = node.properties.hexRow;
    if (typeof col === 'number' && typeof row === 'number') occupied.add(`${col},${row}`);
  }

  const candidates: { col: number; row: number }[] = [];
  for (let col = origin.col - radius; col <= origin.col + radius; col++) {
    for (let row = origin.row - radius; row <= origin.row + radius; row++) {
      const hex = { col, row };
      if (hexDistance(origin, hex) > radius) continue;
      if (occupied.has(`${col},${row}`)) continue;
      candidates.push(hex);
    }
  }

  candidates.sort((a, b) => {
    const da = hexDistance(origin, a);
    const db = hexDistance(origin, b);
    if (da !== db) return da - db;
    if (a.col !== b.col) return a.col - b.col;
    return a.row - b.row;
  });

  return candidates[0] ?? null;
}

/**
 * The founder's leading reach, read off the *template's* reach profile rather than
 * off the actor's capability sheet.
 *
 * Deliberate: a work is named for the manner of the thing that was done, and the
 * template is what knows that. It is also ~8 full capability walks cheaper than
 * `computeFullProfile` at a seam that fires on every completion. Ties break on
 * `REACH_DOMAINS` order so the choice is deterministic (NFP #3).
 */
function leadingReachOfTemplate(templateId: string): ReachDomain | undefined {
  const profile = getStrategicTemplate(templateId)?.reachProfile;
  if (!profile) return undefined;
  let best: ReachDomain | undefined;
  let bestValue = -Infinity;
  for (const domain of REACH_DOMAINS) {
    const value = profile[domain];
    if (typeof value === 'number' && value > bestValue) {
      bestValue = value;
      best = domain;
    }
  }
  return best;
}

/**
 * The created thing's own noun, humanised from its subtype — `research_circle`
 * becomes "Research Circle".
 *
 * Christening replaces the working name, so without this a specific place takes a
 * generic family noun and the player loses what it *is*: measured on seed 42,
 * "Rill's Research Circle at Ardenmor Keep" became "The Ardenmor Keep House".
 * Returns undefined when there is no subtype to read, in which case the family noun
 * is the right answer anyway.
 */
function nounForCreatedNode(created: { properties?: Record<string, unknown> }): string | undefined {
  // `sublocationTypeId` first: it is what `createSublocation` actually stamps, and
  // reading only the settlement-shaped `locationSubtype` silently returned undefined
  // for every strategic sublocation — the exact nodes this seam christens.
  const subtype = created.properties?.sublocationTypeId
    ?? created.properties?.locationSubtype
    ?? created.properties?.locationType;
  if (typeof subtype !== 'string' || subtype.trim().length === 0) return undefined;
  return subtype
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** The founder's culture foundation, for the "people" half of a work's name. */
function foundationOfActor(graph: WorldGraph, actorId: string): string | undefined {
  const belongsTo = graph.getOutgoingEdges(actorId, 'belongs_to')[0];
  const culture = belongsTo ? graph.getNode(belongsTo.target) : undefined;
  const bias = culture?.properties?.foundationBias;
  return typeof bias === 'string' && bias.length > 0 ? bias : undefined;
}

/**
 * The name of the ground this undertaking was done on — the anchor a work is named
 * after. Prefers a *bound* location (the binder knows what the undertaking actually
 * touched), then the target, then the origin.
 */
function resolveAnchorName(
  state: GameState,
  graph: WorldGraph,
  project: StrategicProjectRuntime,
): string | undefined {
  const bound = (state.strategicState?.bindings ?? [])
    .find(b => b.projectId === project.projectId && b.kind === 'location');
  const candidateIds = [bound?.nodeId, project.targetNodeId, project.originLocationId];
  for (const id of candidateIds) {
    if (!id) continue;
    const name = graph.getNode(id)?.name;
    if (typeof name === 'string' && name.trim().length > 0) return name;
  }
  return undefined;
}

/**
 * Christen a completed work, returning the name given — or undefined when this
 * undertaking produced nothing nameable.
 *
 * **Only nodes the undertaking *created* are renamed.** §5 says "renames the
 * created/target node", but renaming the *target* would rename a pre-existing
 * settlement because someone built a warehouse in it — a catastrophic, irreversible
 * edit to shared world state on a path that fires every completion. For every T1
 * kind the work IS the created node, so restricting to `createdId` loses nothing
 * real and cannot corrupt a town. A kind whose work is genuinely a pre-existing node
 * needs its own deliberate rule, not this one by default.
 *
 * Fail-soft (NFP #4): every failure to resolve leaves the created node's minted name
 * untouched and returns undefined. A christening that cannot happen is not an error.
 */
function christenCompletedWork(
  state: GameState,
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  ops: readonly GraphOpResult[],
  tick: number,
): { nodeId: string; name: string } | undefined {
  const createdId = ops.find(o => o.success && o.createdId)?.createdId;
  if (!createdId) return undefined;
  const created = graph.getNode(createdId);
  if (!created) return undefined;

  const name = generateWorkName({
    workId: createdId,
    kindId: getUndertakingKindForTemplate(project.templateId),
    reach: leadingReachOfTemplate(project.templateId),
    foundation: foundationOfActor(graph, project.actorId),
    anchorName: resolveAnchorName(state, graph, project),
    actorName: graph.getNode(project.actorId)?.name,
    nounOverride: nounForCreatedNode(created),
    tick,
  });

  try {
    graph.updateNode(createdId, { name });
  } catch {
    // `updateNode` throws on a missing node. The op said it created one, so this is
    // a race we do not expect — but a naming failure must never take down the tick.
    return undefined;
  }

  // If the mutation already granted this work as a holding, its bearer-side face was
  // minted from the pre-christening name a few lines ago. Refresh it here rather than
  // waiting for the next reconcile, so the character sheet and the world never
  // disagree about what a thing is called even for one tick.
  refreshHoldingFaceNames(graph, createdId);

  return { nodeId: createdId, name };
}

/**
 * Write a failure-name register entry onto the site of a *visible* failure.
 *
 * A register, not a name: the work earned nothing, but the ground remembers that
 * someone tried here and it went badly ("Corran's Folly"). Clean failures write
 * nothing — the caller gates on the residue class, per review ruling 2.2.
 *
 * Additive by construction: `failureScars` is a property array on an existing
 * location node, so nothing is minted and no reader that does not know about scars
 * is affected.
 */
export function recordFailureScar(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
): string | undefined {
  const siteId = project.targetNodeId ?? project.originLocationId;
  if (!siteId) return undefined;
  const site = graph.getNode(siteId);
  if (!site) return undefined;

  const scarId = `scar_${project.projectId}_${tick}`;
  const name = generateFailureScarName(scarId, graph.getNode(project.actorId)?.name);
  const existing = Array.isArray(site.properties?.failureScars)
    ? site.properties.failureScars as unknown[]
    : [];

  try {
    graph.updateNode(siteId, {
      properties: {
        failureScars: [...existing, {
          name,
          tick,
          actorId: project.actorId,
          templateId: project.templateId,
        }],
      },
    });
  } catch {
    return undefined;
  }
  return name;
}

// ─── Execute a Chosen Strategic Action ──────────────────────────────

export interface StrategicExecutionResult {
  strategicState: StrategicRuntimeState;
  graphOps: GraphOpResult[];
  catalystSeeded: boolean;
  /**
   * Locations whose encounter pool changed because this execution minted a
   * pool-invalidating edge (THR-1184). The caller owns the refresh — it holds the
   * `SimulationRuntime`, which this module deliberately does not.
   *
   * Optional and absent on every path that mints no such edge, so existing callers
   * are unaffected.
   */
  poolInvalidatedLocationIds?: string[];
  /**
   * Moment records this execution produced (THR-1299 slice 2) — today only the
   * `started` founding of a multi-tick project, at badge tier. The caller queues
   * them through `enqueueUndertakingMoments`; this module returns patches and does
   * not write GameState. Optional and absent on every other execution mode.
   */
  moments?: UndertakingMomentRecord[];
}

/**
 * Result of a hint-driven mutation: the graph ops, plus any location whose encounter
 * pool the mutation changed (THR-1184).
 */
interface InstantMutationResult {
  ops: GraphOpResult[];
  poolInvalidatedLocationIds: string[];
}

/**
 * Execute a strategic action candidate chosen by the unified decision pipeline.
 * Handles instant mutations, project starts, and control claims.
 */
export function executeStrategicAction(
  state: GameState,
  graph: WorldGraph,
  candidate: StrategicActionCandidate,
  tick: number,
  rng: () => number,
): StrategicExecutionResult {
  const currentState = state.strategicState ?? { projects: [], controls: [], history: [] };
  const graphOps: GraphOpResult[] = [];
  let catalystSeeded = false;

  switch (candidate.executionMode) {
    case 'instant': {
      // Execute the graph mutation immediately
      const { ops, poolInvalidatedLocationIds } = executeInstantMutation(state, graph, candidate, tick);
      graphOps.push(...ops);

      // Check for catalyst seeding
      catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);

      // Record history
      const historyEntry = createHistoryEntry(candidate, tick, ops, catalystSeeded);
      const updatedHistory = pruneHistory([...currentState.history, historyEntry], tick);

      return {
        strategicState: { ...currentState, history: updatedHistory },
        graphOps,
        catalystSeeded,
        poolInvalidatedLocationIds,
      };
    }

    case 'multi_tick_project': {
      const template = getStrategicTemplate(candidate.templateId);
      const duration = template?.projectDuration ?? STRATEGIC_DEFAULT_PROJECT_WORK_TICKS;

      const project: StrategicProjectRuntime = {
        projectId: `proj_${candidate.templateId}_${candidate.actorId}_${tick}`,
        originLocationId: resolveDurableActorLocation(graph, candidate.actorId),
        actorId: candidate.actorId,
        templateId: candidate.templateId,
        ambitionId: candidate.ambitionId,
        verb: candidate.verb,
        behaviorFamily: candidate.behaviorFamily,
        targetNodeId: candidate.targetNodeId,
        targetHex: candidate.targetHex,
        // Carried from the gate that approved this candidate (THR-1296 §6). Absent on
        // every local undertaking; the bind pass binds it as `$anchor` when set.
        anchorNodeId: candidate.anchorNodeId,
        // Who the undertaking is aimed at, carried from the motive gate (THR-1298).
        // Read at the terminal paths to attribute the harm to a victim.
        victimAgentId: candidate.victimAgentId,
        progress: 0,
        progressRequired: duration,
        startedTick: tick,
        lastProgressTick: tick,
        status: 'active',
      };

      // The founding moment (THR-1299 slice 2). `'started'` sat in the class union
      // with a presentation branch and no emitter — the dead branch the plan names.
      // Badge tier by ruling 2.1 ("foundings badge until nudge cards ship, so no
      // interrupt is ever card-less"); the decision phase's own TickEvent already
      // says it began, so only the record is minted here — no second chronicle line.
      const founding = buildMoment({
        graph, project, momentClass: 'started', tick,
        presentation: resolveMomentPresentation(state, graph, project.actorId, 'started', project),
        displayName: template?.displayName,
      });

      return {
        strategicState: {
          ...currentState,
          projects: [...currentState.projects, project],
        },
        graphOps,
        catalystSeeded: false,
        moments: [founding.record],
      };
    }

    case 'claim_control': {
      if (!candidate.targetNodeId) {
        return { strategicState: currentState, graphOps, catalystSeeded: false };
      }

      const controlResult = claimControl(graph, candidate.actorId, candidate.targetNodeId, tick);
      graphOps.push(controlResult);

      if (controlResult.success) {
        const control: StrategicControlState = {
          controlId: `ctrl_${candidate.templateId}_${candidate.actorId}_${tick}`,
          actorId: candidate.actorId,
          templateId: candidate.templateId,
          ambitionId: candidate.ambitionId,
          targetNodeId: candidate.targetNodeId,
          verb: 'control',
          behaviorFamily: candidate.behaviorFamily,
          establishedTick: tick,
          neglectTicks: 0,
          active: true,
          degradation: 0,
        };

        return {
          strategicState: {
            ...currentState,
            controls: [...currentState.controls, control],
          },
          graphOps,
          catalystSeeded: false,
        };
      }

      return { strategicState: currentState, graphOps, catalystSeeded: false };
    }

    case 'seed_encounter': {
      catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);
      const historyEntry = createHistoryEntry(candidate, tick, [], catalystSeeded);
      const updatedHistory = pruneHistory([...currentState.history, historyEntry], tick);

      return {
        strategicState: { ...currentState, history: updatedHistory },
        graphOps,
        catalystSeeded,
      };
    }

    case 'contest_control': {
      // v1: contest simply degrades existing control
      // Full contest mechanics can be expanded later
      return { strategicState: currentState, graphOps, catalystSeeded: false };
    }

    default:
      return { strategicState: currentState, graphOps, catalystSeeded: false };
  }
}

/**
 * Let go of every node an undertaking held (THR-1296 §4).
 *
 * Released, never broken: nothing went wrong, the undertaking is simply over. The
 * distinction is load-bearing — `broken` triggers a re-bind and a complication, and
 * a completing undertaking that marked its cast broken would fire a "loses X" moment
 * on the way out of the world.
 *
 * Called on every exit from `active`, which is what stops a bound stage from being
 * held against housekeeping forever by an undertaking that ended twenty ticks ago.
 */
function releaseUndertakingBindings(state: GameState, projectId: string, tick: number): void {
  const bindings = state.strategicState?.bindings;
  if (!bindings || bindings.length === 0) return;
  releaseBindingsForProject(bindings, projectId, tick);
}

// ─── Advance Active Projects ────────────────────────────────────────

/**
 * Advance all active strategic projects by one tick.
 * Called from phaseStrategicProjects in the orchestrator.
 */
export function advanceStrategicProjects(
  state: GameState,
  graph: WorldGraph,
  tick: number,
  rng: () => number,
  /**
   * Session-owned caches the bind pass needs (THR-1296 §3): the reverse binding
   * index and the role census. Optional — absent, the bind pass is skipped entirely
   * and undertakings resolve uncast exactly as they do today, which is what keeps
   * every existing caller and test unchanged.
   */
  runtime?: SimulationRuntime,
): {
  strategicState: StrategicRuntimeState;
  events: import('../types/gameState').TickEvent[];
  /** Locations whose encounter pool a completing project changed (THR-1184). */
  poolInvalidatedLocationIds: string[];
  /**
   * Encounter seeds planted by an undertaking's own arc (THR-1292 §3). Today the
   * mentorship fold is the only producer — its offer, three milestones and terminal
   * seeds used to be planted by the retired phase 2.33.
   */
  pendingEncounterSeeds: PendingEncounterSeed[];
  /**
   * Moment records the checkpoints produced this tick (THR-1299 slice 2), in
   * emission order. The phase queues them; this module returns patches.
   */
  moments: UndertakingMomentRecord[];
} {
  const currentState = state.strategicState ?? { projects: [], controls: [], history: [] };
  const updatedProjects: StrategicProjectRuntime[] = [];
  const completedOps: GraphOpResult[] = [];
  const poolInvalidatedLocationIds: string[] = [];
  const newHistory: StrategicHistoryEntry[] = [];
  const events: import('../types/gameState').TickEvent[] = [];
  const pendingEncounterSeeds: PendingEncounterSeed[] = [];
  const moments: UndertakingMomentRecord[] = [];

  // Divine `Sever the Bond` sets a flag on an agent; translating it onto the edge is
  // a once-per-tick sweep, not per-project work (rehomed from phase 2.33).
  if (isMentorshipEnabled()) applyPendingMentorshipSevers(graph);

  for (const project of currentState.projects) {
    if (project.status !== 'active') {
      updatedProjects.push(project);
      continue;
    }

    // ─── Mentorship bootstrap (THR-1292 §3) ───────────────────────────
    // Lazy rather than at start: the edge needs an apprentice who is present *now*,
    // and the pairing gate already refused the proposal when nobody was.
    const isMentorship = project.templateId === MENTORSHIP_TEMPLATE_ID;
    if (isMentorship && isMentorshipEnabled() && !hasMentorshipEdge(graph, project)) {
      const boot = bootstrapMentorship(graph, project, tick, rng);
      if (!boot) {
        // Nobody left to teach. End it cleanly — no status limbo, which is the
        // deadlock the retired `markInitiativeFailed` created (THR-1292 §3).
        releaseUndertakingBindings(state, project.projectId, tick);
        updatedProjects.push({ ...project, status: 'failed', failureReason: 'actor_lost' });
        newHistory.push(buildFailureHistory(project, tick, 'failed'));
        continue;
      }
      events.push(...boot.events);
      pendingEncounterSeeds.push(...boot.seeds);
    }

    // Timeout check — a fail-safe backstop only (THR-1292 §2). Halts now legitimately
    // extend an undertaking and the ratchet is the designed exit, so this catches
    // only the shapes the ratchet never reaches (a permanently absent actor, a
    // deferral loop). Tuned to `UNDERTAKING_TIMEOUT_TICKS`, not the old passive cadence.
    if (tick - project.startedTick > UNDERTAKING_TIMEOUT_TICKS) {
      releaseUndertakingBindings(state, project.projectId, tick);
      updatedProjects.push({ ...project, status: 'failed', failureReason: 'timeout' });
      newHistory.push({
        tick,
        actorId: project.actorId,
        templateId: project.templateId,
        ambitionId: project.ambitionId,
        verb: project.verb,
        behaviorFamily: project.behaviorFamily,
        displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
        targetNodeId: project.targetNodeId,
        outcome: 'failed',
        graphOps: [],
        catalystSeeded: false,
      });

      emitTrace({
        category: 'strategic_project_progress',
        tick,
        actorId: project.actorId,
        projectId: project.projectId,
        progress: project.progress,
        progressRequired: project.progressRequired,
        status: 'failed',
        summary: `Project ${project.templateId} timed out after ${tick - project.startedTick} ticks`,
      } as TraceEntry);

      continue;
    }

    // ─── The bind pass (THR-1296 §3) ──────────────────────────────────
    // Runs immediately before the checkpoint, in the same slot and shape as the
    // mentorship bootstrap above: decide in the binder, apply here. It returns the
    // project with `rebindRequested` consumed plus what the checkpoint needs to know
    // about the cast — a must-persist loss to name, or a mint still in the queue.
    //
    // Costs nothing on a template with no `cast` (every shipped template in v1): the
    // pass returns before it touches the registry, the census or the graph.
    let bindingInput: CheckpointBindingInput | undefined;
    let boundProject = project;
    if (runtime && state.strategicState) {
      const pass = runBindPass({
        graph,
        strategicState: state.strategicState,
        index: runtime.bindingIndex,
        census: ensureRoleCensus(runtime, graph),
        project,
        template: getStrategicTemplate(project.templateId),
        tick,
      });
      boundProject = pass.project;
      if (pass.loss || pass.awaitingMint) {
        bindingInput = { loss: pass.loss, awaitingMint: pass.awaitingMint };
      }
    }

    // ─── Checkpoint (THR-1292 §2) ─────────────────────────────────────
    // Progress is no longer a function of elapsed ticks. The checkpoint decides
    // whether this undertaking advances at all, and the record it returns carries
    // the halts, the deferrals and the fork state.
    const checkpoint = resolveUndertakingCheckpoint(state, graph, boundProject, tick, bindingInput);
    events.push(...checkpoint.events);
    const checked = checkpoint.project;
    // Every moment but the completion queues as the checkpoint built it. The
    // completion record is held back until the christening below has named the
    // work, so the card and the chronicle line agree on what got finished.
    const completionMoment = checkpoint.moments?.find(m => m.momentClass === 'completion');
    for (const moment of checkpoint.moments ?? []) {
      if (moment.momentClass !== 'completion') moments.push(moment);
    }

    // ─── Mentorship arc, driven by the band this checkpoint produced ──
    // The retired phase read a checkpoint array for a record stamped with the
    // current tick — a same-tick ordering contract between two phases. The effect
    // is read straight off the record here instead.
    // ─── Banded creation effects (THR-1296 §3, slice 5) ───────────────
    // What this checkpoint *made*. Fires on the band the checkpoint actually landed
    // on, once, only when the checkpoint resolved this tick — so a `not_due` pass and
    // a re-read of `lastCheckpoint` on a later tick both create nothing. Costs nothing
    // on a template with no `creationEffects`, which is every shipped template in v1.
    if (checked.lastCheckpoint?.tick === tick) {
      applyCreationEffects({
        state,
        graph,
        project: checked,
        template: getStrategicTemplate(checked.templateId),
        band: checked.lastCheckpoint.band,
        effect: checked.lastCheckpoint.effect,
        tick,
      });
    }

    let mentorshipForcedFailure = false;
    if (isMentorship && isMentorshipEnabled()) {
      const resolvedThisTick = checked.lastCheckpoint?.tick === tick;
      if (resolvedThisTick && checked.lastCheckpoint) {
        const arc = advanceMentorshipCheckpoint(graph, checked, checked.lastCheckpoint.effect, tick);
        events.push(...arc.events);
        pendingEncounterSeeds.push(...arc.seeds);
        if (arc.forceFailReason) {
          // Separation, a divine sever or a lost participant ends the undertaking.
          // The terminal arc runs on this *explicit* signal — never on absence.
          const terminal = resolveMentorshipUndertaking(graph, checked, 'failed', tick);
          events.push(...terminal.events);
          pendingEncounterSeeds.push(...terminal.seeds);
          releaseUndertakingBindings(state, checked.projectId, tick);
          updatedProjects.push({ ...checked, status: 'failed', failureReason: 'actor_lost' });
          newHistory.push(buildFailureHistory(checked, tick, 'failed'));
          mentorshipForcedFailure = true;
        }
      }
      if (!mentorshipForcedFailure
        && (checkpoint.verdict === 'ended' || checkpoint.verdict === 'completed')) {
        const terminal = resolveMentorshipUndertaking(
          graph, checked, checkpoint.verdict === 'completed' ? 'completed' : 'failed', tick,
        );
        events.push(...terminal.events);
        pendingEncounterSeeds.push(...terminal.seeds);
      }
    }
    if (mentorshipForcedFailure) continue;

    if (checkpoint.verdict === 'not_due' || checkpoint.verdict === 'deferred' || checkpoint.verdict === 'continues') {
      updatedProjects.push(checked);
      continue;
    }

    if (checkpoint.verdict === 'ended') {
      releaseUndertakingBindings(state, checked.projectId, tick);
      // Abandoned at the ratchet, or the actor is gone. The residue class follows
      // visibility (§2.2): what the player watched leaves something behind, what
      // they never saw leaves a chronicle line.
      const displayName = getStrategicTemplate(checked.templateId)?.displayName ?? checked.templateId;
      updatedProjects.push(checked);
      events.push(buildResidueEvent(graph, checked, tick, displayName));
      // The failure-name register (THR-1297 §5). Gated on the *visible* residue
      // class, which doc 1 already classifies: what the player watched leaves
      // something on the ground, what nobody saw leaves only a chronicle line.
      if (classifyFailureResidue(checked) === 'undertaking_failed_visible') {
        recordFailureScar(graph, checked, tick);
      }
      if (checked.failureReason === 'abandoned_after_halts') {
        // The THR-726 lane's candidate mint. Doc 4 authors the minting rule; this
        // doc guarantees only that the event fires with owner + undertaking identity.
        events.push(buildAbandonMintEvent(graph, checked, tick, displayName));
        // …and the graph node the mint lane can actually read (THR-1298). The
        // TickEvent above stays for the chronicle; a flat TickEvent is invisible to
        // `gatherMintTuples`, which walks event *nodes*. Self-facing: the owner is
        // both actor and victim, so `createUndertakingOutcomeNode` writes no culprit
        // edge opposite them and the drives this mints are all soft ones.
        createUndertakingOutcomeNode({
          graph,
          project: checked,
          harmClass: 'undertaking_abandoned',
          tick,
          victimAgentId: checked.actorId,
          ascendantId: state.ascendantId,
          selfFacing: true,
        });
      }
      newHistory.push({
        tick,
        actorId: checked.actorId,
        templateId: checked.templateId,
        ambitionId: checked.ambitionId,
        verb: checked.verb,
        behaviorFamily: checked.behaviorFamily,
        displayName,
        targetNodeId: checked.targetNodeId,
        outcome: 'failed',
        graphOps: [],
        catalystSeeded: false,
      });
      continue;
    }

    // verdict === 'completed'
    const newProgress = checked.progress;

    {
      // Project complete — execute the world mutation
      const candidate: StrategicActionCandidate = {
        candidateId: project.projectId,
        templateId: project.templateId,
        ambitionId: project.ambitionId,
        actorId: project.actorId,
        verb: project.verb,
        executionMode: 'multi_tick_project',
        behaviorFamily: project.behaviorFamily,
        displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
        originLocationId: project.originLocationId,
        targetNodeId: project.targetNodeId,
        targetHex: project.targetHex,
        scoreComponents: {
          ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0,
          catalystValue: 0, roleFit: 0, controlPressure: 0,
          travelPenalty: 0, varietyPenalty: 0,
        },
        finalScore: 0,
        generationReason: 'ambition_progression',
      };

      const mutation = executeInstantMutation(state, graph, candidate, tick);
      const ops = mutation.ops;
      completedOps.push(...ops);
      poolInvalidatedLocationIds.push(...mutation.poolInvalidatedLocationIds);

      const catalystSeeded = maybeSeedCatalyst(state, candidate, tick, rng);

      // Christening (THR-1291 §2): the work earns its proper name here, between the
      // mutation and the history write, because this is the one point where every
      // input is in scope — what was created, what was bound, who did it. Read the
      // bindings BEFORE releasing them: the ledger is what knows the ground this
      // undertaking actually stood on, and release is what forgets it.
      const christened = christenCompletedWork(state, graph, project, ops, tick);

      // The harm this completion did, if it did one (THR-1298). Emitted after the
      // mutation so the outcome node describes a world that has already changed, and
      // read from the template rather than the verb: `harmClass` is authored, so a
      // destroy that severs a network and one that razes a settlement mint different
      // drives instead of both reading as generic violence.
      //
      // The victim rides the runtime from the motive gate that licensed the verb —
      // re-deriving ownership here would read the graph *after* the razing, where the
      // owner's claim no longer exists.
      // ── Satisfaction door (THR-1298 slice 6) ──
      //
      // The first of the two: an undertaking pursued *under* a grievance completing is
      // the victim getting what they wanted. Read before the outcome node is written,
      // because the answer's own node has to carry the fact — that stamp is the whole
      // message the mint lane reads to suppress the counter-vendetta.
      //
      // Matched on `ambitionId`, not on the target: an agent who avenges themselves by
      // burning the culprit's charts rather than their hall has still answered the
      // grievance, and demanding the harm land on the original target would close only
      // the vendettas that happened to pick the symmetrical verb.
      const grievanceAnswered = findGrievanceForAmbitionTemplate(
        graph, checked.actorId, checked.ambitionId,
      );
      const answeredMagnitude = grievanceAnswered
        ? (grievanceAnswered.properties.harmMagnitude as number | undefined)
        : undefined;
      const answeredChainDepth = grievanceAnswered
        ? ((grievanceAnswered.properties.chainDepth as number | undefined) ?? 0)
        : 0;

      const completedTemplate = getStrategicTemplate(project.templateId);
      if (completedTemplate?.harmClass) {
        createUndertakingOutcomeNode({
          graph,
          project: checked,
          harmClass: completedTemplate.harmClass,
          tick,
          victimAgentId: checked.victimAgentId,
          ascendantId: state.ascendantId,
          // An answer sits one link further down the chain than the harm it answers,
          // so an overshoot that *does* re-open the account opens it at the right
          // depth and the cap can eventually stop it.
          ...(grievanceAnswered && {
            answersGrievance: true,
            answeredMagnitude,
            chainDepth: answeredChainDepth + 1,
          }),
        });
      }

      // Closed after the node is written: the node describes the world at the moment
      // the harm landed, and the grievance was still standing then.
      if (grievanceAnswered) {
        satisfyGrievance(
          graph, grievanceAnswered, checked.actorId, tick,
          `answered by ${checked.templateId}`,
        );
      }

      releaseUndertakingBindings(state, checked.projectId, tick);
      updatedProjects.push({ ...checked, progress: newProgress, status: 'completed', lastProgressTick: tick });
      newHistory.push(createHistoryEntry(candidate, tick, ops, catalystSeeded));

      // A finished work is a deed the calling reads (THR-1299 slice 5) — the
      // second of its three event sites.
      {
        const callingChange = recomputeCalling(graph, project.actorId, tick, 'undertaking_complete');
        if (callingChange?.event) events.push(callingChange.event);
      }

      const actorNode = graph.getNode(project.actorId);
      // The completion moment carries the christened name instead of the template's
      // display name — "Kael completes The Saltway Ring", not "…completes Establish
      // Trade Network". The name is the payoff; the template id never reaches a player.
      //
      // THR-1299 slice 2: this is the completion moment's one TickEvent. It takes the
      // record's id, so the card is reachable from the chronicle line, and its
      // significance follows the record's presentation — an interrupt-tier completion
      // is the chronicle moment the plan names, a badge-tier one keeps the old value.
      const finishedName = christened?.name ?? candidate.displayName;
      const completionMessage = `${actorNode?.name ?? project.actorId} completes: ${finishedName}`;
      if (completionMoment) {
        moments.push({ ...completionMoment, label: completionMessage, undertakingName: finishedName });
      }
      events.push({
        id: completionMoment?.id ?? `strategic_complete_${project.projectId}_${tick}`,
        tick,
        type: 'agent_action',
        message: completionMessage,
        significance: completionMoment?.presentation === 'interrupt'
          ? MOMENT_INTERRUPT_SIGNIFICANCE
          : MOMENT_COMPLETION_SIGNIFICANCE,
        actorId: project.actorId,
      });

      // The christened name rides the completion trace that already fires here,
      // rather than an emission of its own (THR-1297 § Tracing: "additive payload
      // extensions on an existing interface", "no new trace categories").
      //
      // This is not only style. `decisionBoardLiveness` drains the trace ring buffer
      // per tick precisely because a multi-tick run overflows it (impediment #822),
      // so every extra emission per tick can evict another category's entries from
      // the sample. A separate christening trace did exactly that: it reddened that
      // test's frozen-desire pin intermittently, on a diff that authored no
      // `motivations` at all — a real defect wearing a flake's clothes.
      emitTrace({
        category: 'strategic_project_progress',
        tick,
        actorId: project.actorId,
        projectId: project.projectId,
        progress: newProgress,
        progressRequired: project.progressRequired,
        status: 'completed',
        christenedName: christened?.name,
        christenedNodeId: christened?.nodeId,
        summary: christened
          ? `Project ${project.templateId} completed — christened "${christened.name}"`
          : `Project ${project.templateId} completed`,
      } as TraceEntry);
    }
  }

  // Update controls — tick neglect and degradation
  const updatedControls: StrategicControlState[] = [];
  for (const control of currentState.controls) {
    // A collapsed stance is retired, never carried (THR-1286). Records used to
    // accumulate here forever at `active: false, degradation: 1`, and a dead record
    // is not inert: `computeControlPressure` reads its frozen `neglectTicks` and pins
    // the re-claim score at maximum. This branch also drains dead records loaded from
    // a world saved before the fix.
    if (!control.active) {
      retireControl(graph, control, tick, newHistory, events);
      continue;
    }

    // A stance cannot outlive what it controls. Removing a node takes its edges with
    // it, so a deleted target leaves a live record with no edge — the one shape that
    // still broke "live `controls` edges equal active stances" after the retirement
    // work above (seed 99 at tick 150: one stance on `loc_2`, a location deleted after
    // the stance was established). Retiring it now rather than waiting out ~30 ticks of
    // neglect keeps the invariant exact and costs one lookup per live stance.
    if (!graph.getNode(control.targetNodeId)) {
      retireControl(graph, control, tick, newHistory, events);
      continue;
    }

    const newNeglect = control.neglectTicks + 1;

    if (newNeglect > STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS) {
      const newDegradation = Math.min(1, control.degradation + STRATEGIC_CONTROL_DEGRADATION_RATE);
      if (newDegradation >= 1) {
        // Control collapses — retired rather than kept as a dead record
        retireControl(graph, { ...control, neglectTicks: newNeglect, degradation: 1 }, tick, newHistory, events);
      } else {
        updatedControls.push({ ...control, neglectTicks: newNeglect, degradation: newDegradation });
      }
    } else {
      updatedControls.push({ ...control, neglectTicks: newNeglect });
    }
  }

  const updatedHistoryFull = pruneHistory([...currentState.history, ...newHistory], tick);

  return {
    strategicState: {
      // `...currentState` first, and it is load-bearing (THR-1321). This was a literal
      // naming only the three fields below, which silently dropped every *other* field
      // on `StrategicRuntimeState` once per tick — `bindings` and `mintQueue`, the two
      // the binder owns. Every sibling return in this module already spreads; this was
      // the one drifted writer.
      //
      // What that cost: the bind pass enqueues a mint in the `strategic_projects`
      // phase, and `phaseAgentLifecycle` drains it later in the same tick — but the
      // queue it pushed to was discarded with the old object before the valve ever saw
      // it. So a slot that needed a mint deferred on `awaiting_mint` forever, never
      // rolled, and timed out: `strategic_recruit_warband` measured 0 completions
      // against a no-cast baseline of 15. The dropped `bindings` is why the two
      // persistence modes measured identically — the ledger was wiped every tick, so
      // `must-persist` and `scene-only` were the same thing.
      //
      // A template whose slot binds to somebody already standing there was unaffected
      // and hid this: it binds within the pass and rolls the same tick, so it never
      // needs either field to survive the boundary.
      ...currentState,
      projects: updatedProjects,
      controls: updatedControls,
      history: updatedHistoryFull,
    },
    events,
    poolInvalidatedLocationIds,
    pendingEncounterSeeds,
    moments,
  };
}

// ─── Mentorship fold helpers (THR-1292 §3) ──────────────────────────

/** Whether this mentorship undertaking has already minted its `mentors` edge. */
function hasMentorshipEdge(graph: WorldGraph, project: StrategicProjectRuntime): boolean {
  return graph.getOutgoingEdges(project.actorId, 'mentors')
    .some(e => (e.properties.undertakingId as string | undefined) === project.projectId);
}

/** History row for an undertaking that ended without completing. */
function buildFailureHistory(
  project: StrategicProjectRuntime,
  tick: number,
  outcome: 'failed',
): StrategicHistoryEntry {
  return {
    tick,
    actorId: project.actorId,
    templateId: project.templateId,
    ambitionId: project.ambitionId,
    verb: project.verb,
    behaviorFamily: project.behaviorFamily,
    displayName: getStrategicTemplate(project.templateId)?.displayName ?? project.templateId,
    targetNodeId: project.targetNodeId,
    outcome,
    graphOps: [],
    catalystSeeded: false,
  };
}

// ─── Control Retirement ─────────────────────────────────────────────

/**
 * Retire a collapsed control stance (THR-1286): drop its `controls` edge, write the
 * collapse into history, announce it, and trace it.
 *
 * The history entry is the load-bearing part — it is what the re-claim cooldown in
 * `strategicActionCandidates` reads once the record itself is gone. `claim_control` is
 * the one strategic verb that never wrote history, which is why the existing
 * recent-duplicate variety guard was blind to control claims and the same target could
 * be re-proposed every tick (0 control history entries across a 150-tick seed-42 run).
 *
 * Mutates `history` and `events` in place — both are the caller's accumulators for this
 * tick, and the caller owns merging and pruning them.
 */
function retireControl(
  graph: WorldGraph,
  control: StrategicControlState,
  tick: number,
  history: StrategicHistoryEntry[],
  events: import('../types/gameState').TickEvent[],
): void {
  const released = releaseControl(graph, control.actorId, control.targetNodeId);
  const displayName = getStrategicTemplate(control.templateId)?.displayName ?? control.templateId;

  history.push({
    tick,
    actorId: control.actorId,
    templateId: control.templateId,
    ambitionId: control.ambitionId,
    verb: 'control',
    behaviorFamily: control.behaviorFamily,
    displayName,
    targetNodeId: control.targetNodeId,
    outcome: 'failed',
    graphOps: ['release_control'],
    catalystSeeded: false,
  });

  const actorNode = graph.getNode(control.actorId);
  events.push({
    id: `strategic_control_lost_${control.controlId}_${tick}`,
    tick,
    type: 'agent_action',
    message: `${actorNode?.name ?? control.actorId} loses control: ${displayName}`,
    significance: 0.5,
    actorId: control.actorId,
  });

  emitTrace({
    category: 'strategic_control_lifecycle',
    tick,
    actorId: control.actorId,
    targetNodeId: control.targetNodeId,
    event: 'collapsed',
    edgeReleased: released.success && released.createdId !== undefined,
    summary: `Control collapsed: ${displayName} (${control.actorId} → ${control.targetNodeId})`,
  } as TraceEntry);
}

// ─── Instant Mutation Dispatch ──────────────────────────────────────

// `resolveDurableActorLocation` moved to `tradeRouteOps.ts` (THR-1188) so the
// catalog trade verbs and this strategic pack cannot drift apart on what counts
// as a durable route endpoint. Behaviour is unchanged.

function executeInstantMutation(
  state: GameState,
  graph: WorldGraph,
  candidate: StrategicActionCandidate,
  tick: number,
): InstantMutationResult {
  const ops: GraphOpResult[] = [];
  const poolInvalidatedLocationIds: string[] = [];
  const targetId = candidate.targetNodeId;

  // ── Hint-driven dispatch: templates declare their mutation via mutationHint ──
  const template = getStrategicTemplate(candidate.templateId);
  const hint = template?.mutationHint;

  if (hint) {
    switch (hint.type) {
      case 'record_intelligence': {
        if (targetId) {
          ops.push(recordIntelligence(graph, candidate.actorId, targetId, hint.intelligenceType, tick));
        }
        break;
      }

      case 'create_sublocation': {
        if (targetId) {
          const actorNode = graph.getNode(candidate.actorId);
          const locNode = graph.getNode(targetId);
          const name = renderNameTemplate(hint.nameTemplate, actorNode?.name, locNode?.name);
          ops.push(createSublocation(graph, targetId, candidate.actorId, name, hint.sublocationTypeId, tick));
        }
        break;
      }

      case 'create_trade_route': {
        if (targetId) {
          // Anchor at the project's origin settlement when we have one — the
          // actor's completion-time location is often a transient transit hex
          // whose GC evaporates the route (THR-669).
          const sourceLocId =
            candidate.originLocationId ?? resolveDurableActorLocation(graph, candidate.actorId);
          if (!sourceLocId) {
            ops.push({ success: false, op: 'create_trade_route', error: 'no_durable_source_location' });
          } else if (sourceLocId !== targetId) {
            const routeResult = createTradeRoute(graph, sourceLocId, targetId, candidate.actorId, tick);
            ops.push(routeResult);

            // THR-1308: the route gains an identity face. The `trades_with` edge stays
            // the economic authority — every existing consumer reads it and none of
            // them changes — but an edge has nowhere to carry a name, an owner or a
            // blockade state, so the `trade_route` kind's object is this node. Minted
            // only when the edge actually landed: an identity for a route that does
            // not exist is exactly the orphan the kind registry exists to refuse.
            if (routeResult.success) {
              const originHex = resolveLocationToHex(graph, sourceLocId);
              if (originHex) {
                const originNode = graph.getNode(sourceLocId);
                const destNode = graph.getNode(targetId);
                ops.push(
                  createLocation(
                    graph,
                    originHex,
                    candidate.actorId,
                    // No article of our own: settlement names already carry one where
                    // they want one ("The Shattered Sanctum"), and prepending a second
                    // produced "The The Shattered Sanctum–Greycity Road" in the first
                    // 150-tick run this shipped against.
                    `${originNode?.name ?? 'Unknown'}–${destNode?.name ?? 'Unknown'} Road`,
                    ROUTE_IDENTITY_SUBTYPE,
                    tick,
                    {
                      routeSourceId: sourceLocId,
                      routeTargetId: targetId,
                      routeEdgeId: routeResult.createdId,
                    },
                  ),
                );
              }
            }
          }
        }
        break;
      }

      // ── The T2 tier: places, and taking them back (THR-1308) ────

      case 'create_location': {
        const anchorLocId =
          hint.anchor === 'target_hex'
            ? targetId
            : (candidate.originLocationId ?? getAgentLocationId(graph, candidate.actorId));
        const anchorHex = anchorLocId ? resolveLocationToHex(graph, anchorLocId) : null;

        if (!anchorHex) {
          ops.push({ success: false, op: 'create_location', error: 'no_anchor_hex' });
          break;
        }

        const site = findUnclaimedSite(graph, anchorHex);
        if (!site) {
          // Every hex in range is built up. A refusal, not a fallback — see
          // `findUnclaimedSite`.
          ops.push({ success: false, op: 'create_location', error: 'no_unclaimed_site' });
          break;
        }

        const actorNode = graph.getNode(candidate.actorId);
        const anchorNode = anchorLocId ? graph.getNode(anchorLocId) : undefined;
        ops.push(
          createLocation(
            graph,
            site,
            candidate.actorId,
            renderNameTemplate(hint.nameTemplate, actorNode?.name, anchorNode?.name),
            hint.locationSubtype,
            tick,
            { prosperity: hint.prosperity ?? FOUNDED_SETTLEMENT_INITIAL_PROSPERITY },
          ),
        );
        break;
      }

      case 'blockade_route': {
        if (targetId) {
          ops.push(blockadeRoute(graph, candidate.actorId, targetId, tick));
        }
        break;
      }

      case 'create_relation_edge': {
        if (targetId) {
          const [source, target] = hint.direction === 'actor_to_target'
            ? [candidate.actorId, targetId]
            : [targetId, candidate.actorId];
          const result = createRelationEdge(graph, source, target, hint.edgeType, tick, hint.properties);
          ops.push(result);
          // THR-1184: a minted `sacred_route` changes what its destination can host, and
          // the encounter cache is only rebuilt on structural invalidation — so without
          // this the new pool waits for an unrelated system to notice. Report the
          // location; the caller (which owns the runtime) does the refresh.
          if (result.success && ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES.has(hint.edgeType)) {
            const destination = graph.getNode(target);
            if (destination?.type === 'location') poolInvalidatedLocationIds.push(target);
          }
        }
        break;
      }

      case 'modify_location_property': {
        if (targetId) {
          ops.push(modifyLocationProperty(graph, targetId, hint.property, hint.delta, hint.clamp));
          // A timed boost stamps its own expiry; `phaseStrategicProjects` sweeps it
          // (THR-1292 §3 — rehomed from the retired `phaseInitiativeProgress`).
          if (hint.expiresAfterTicks != null) {
            const locNode = graph.getNode(targetId);
            if (locNode) {
              locNode.properties[`${hint.property}${LOCATION_BOOST_EXPIRY_SUFFIX}`] =
                tick + hint.expiresAfterTicks;
            }
          }
        }
        break;
      }

      // ── The explorer economy (THR-1297 §7) ──────────────────────
      // Each writes into a system that already has consumers, so a chart verb's
      // find becomes a lead the world acts on rather than a private score.

      case 'spawn_clue': {
        if (targetId) {
          ops.push(spawnClue(
            graph, candidate.actorId, targetId, tick,
            hint.magnitude, hint.precision, hint.detail,
          ));
        }
        break;
      }

      case 'seed_knows_of': {
        if (targetId) {
          ops.push(seedKnowsOf(graph, candidate.actorId, targetId, tick));
        }
        break;
      }

      case 'mint_treasure_map': {
        if (targetId) {
          ops.push(mintTreasureMap(graph, candidate.actorId, targetId, tick, hint.consumeOnEvent));
        }
        break;
      }

      case 'mint_leverage_mark': {
        if (targetId) {
          ops.push(mintLeverageMark(
            graph, candidate.actorId, targetId, hint.secretType, hint.magnitude, tick,
          ));
        }
        break;
      }

      case 'press_the_mark': {
        if (targetId) {
          ops.push(pressTheMark(
            graph, candidate.actorId, targetId, hint.favorMagnitude, hint.context, tick,
          ));
        }
        break;
      }

      // No `targetId` guard: a masterwork is made *by* someone, not *to* something.
      // Gating it on a target would make the one kind whose object belongs to its
      // maker silently unbuildable wherever the target rule came up empty.
      case 'mint_masterwork': {
        ops.push(mintMasterwork(graph, candidate.actorId, hint.craftTag, tick, hint.tier));
        break;
      }

      // ── The T3 tier: organisations, and breaking them (THR-1309) ──

      case 'create_group': {
        if (hint.groupKind === 'company') {
          // The bound `recruit` cast — the people this undertaking actually engaged,
          // minted by the bind pass when nobody suitable stood there. At completion
          // `candidate.candidateId` IS the projectId (see the synthesized candidate
          // above), which is what makes this ledger read possible at all.
          const boundRecruitIds = getBindings(state.strategicState)
            .filter(b =>
              b.projectId === candidate.candidateId &&
              b.castKey === WARBAND_RECRUIT_CAST_KEY &&
              b.kind === 'actor' &&
              b.status === 'live')
            .map(b => b.nodeId);
          const raised = raiseWarband(state, candidate.actorId, boundRecruitIds);
          ops.push(raised);
          // A raised band changes what the place can host — the same reason
          // `create_sublocation` invalidates (THR-1184). Anchor on the commander's
          // own location: the company node carries no `located_at` of its own.
          if (raised.success) {
            const locId = getAgentLocationId(graph, candidate.actorId);
            if (locId) poolInvalidatedLocationIds.push(locId);
          }
          break;
        }

        // ── faction ──
        if (!hint.factionSeed) {
          // Authoring error rather than a world state: a faction with no seed has no
          // content ids, and the op would mint an order whose encounters resolve to
          // nothing. Refuse loudly rather than found something inert.
          ops.push({ success: false, op: 'create_group', error: 'faction_seed_missing' });
          break;
        }
        if (!targetId) {
          ops.push({ success: false, op: 'create_group', error: 'no_target_location' });
          break;
        }

        const actorNode = graph.getNode(candidate.actorId);
        const locNode = graph.getNode(targetId);
        const orderName = renderNameTemplate(
          hint.nameTemplate ?? hint.factionSeed.nameTemplate,
          actorNode?.name,
          locNode?.name,
        );
        const founded = foundFaction(
          state,
          candidate.actorId,
          targetId,
          hint.factionSeed,
          // The order inherits the shape of the work that chartered it — see
          // `foundFaction`'s note on why this is the template's profile and not a
          // capability bag read off the founder.
          template?.reachProfile ?? {},
          orderName,
          tick,
        );
        ops.push(founded);
        if (founded.success) poolInvalidatedLocationIds.push(targetId);
        break;
      }

      case 'reinforce_group': {
        if (targetId) {
          const boundRecruitIds = getBindings(state.strategicState)
            .filter(b =>
              b.projectId === candidate.candidateId &&
              b.castKey === WARBAND_RECRUIT_CAST_KEY &&
              b.kind === 'actor' &&
              b.status === 'live')
            .map(b => b.nodeId);
          ops.push(reinforceWarband(state, candidate.actorId, targetId, boundRecruitIds));
        } else {
          ops.push({ success: false, op: 'reinforce_group', error: 'no_target_group' });
        }
        break;
      }

      case 'disband_group': {
        if (targetId) {
          ops.push(disbandGroup(state, targetId));
        } else {
          ops.push({ success: false, op: 'disband_group', error: 'no_target_group' });
        }
        break;
      }

      case 'no_mutation':
        // Intentional no-op (control stances, seed_encounter modes)
        break;
    }
  } else {
    // ── Legacy fallback for templates without mutationHint ──
    // (Kept temporarily for backward compatibility — remove once all templates have hints)
    switch (candidate.templateId) {
      case 'strategic_survey_market':
        if (targetId) ops.push(recordIntelligence(graph, candidate.actorId, targetId, 'market_survey', tick));
        break;
      case 'strategic_negotiate_storage':
        if (targetId) ops.push(recordIntelligence(graph, candidate.actorId, targetId, 'storage_rights', tick));
        break;
      case 'strategic_establish_trade_route': {
        if (targetId) {
          const actorEdges = graph.getOutgoingEdges(candidate.actorId, 'located_at');
          const actorLocId = actorEdges[0]?.target;
          if (actorLocId && actorLocId !== targetId) {
            ops.push(createTradeRoute(graph, actorLocId, targetId, candidate.actorId, tick));
          }
        }
        break;
      }
      // These two legacy arms predate `mutationHint` and duplicated the hint path's
      // name string by hand — including its trailing-s bug (THR-1297 §5 "fixes in
      // passing"). They now render through the same one renderer, so the possessive
      // rule cannot be right in one place and wrong in the other.
      case 'strategic_build_warehouse': {
        if (targetId) {
          ops.push(createSublocation(
            graph, targetId, candidate.actorId,
            renderNameTemplate(LEGACY_NAME_TEMPLATE, graph.getNode(candidate.actorId)?.name, graph.getNode(targetId)?.name, 'Warehouse'),
            'warehouse', tick,
          ));
        }
        break;
      }
      case 'strategic_found_guild_chapter': {
        if (targetId) {
          ops.push(createSublocation(
            graph, targetId, candidate.actorId,
            renderNameTemplate(LEGACY_NAME_TEMPLATE, graph.getNode(candidate.actorId)?.name, graph.getNode(targetId)?.name, 'Guild Chapter'),
            'guild_chapter', tick,
          ));
        }
        break;
      }
      default:
        break;
    }
  }

  if (ops.length > 0) {
    emitTrace({
      category: 'strategic_world_change',
      tick,
      actorId: candidate.actorId,
      verb: candidate.verb,
      graphOps: ops.map(o => `${o.op}:${o.success ? 'ok' : o.error}`),
      catalystSeeded: false,
      affectedNodeIds: ops.filter(o => o.createdId).map(o => o.createdId!),
      summary: `Strategic world change: ${ops.length} ops (${ops.filter(o => o.success).length} succeeded)`,
    } as TraceEntry);
  }

  return { ops, poolInvalidatedLocationIds };
}

// ─── Catalyst Seeding ───────────────────────────────────────────────

function maybeSeedCatalyst(
  state: GameState,
  candidate: StrategicActionCandidate,
  tick: number,
  rng: () => number,
): boolean {
  const template = getStrategicTemplate(candidate.templateId);
  if (!template?.catalystEncounterIds?.length) return false;

  if (rng() > STRATEGIC_CATALYST_SEED_CHANCE) return false;

  // Pick a random catalyst encounter from the template's list
  const catalystId = template.catalystEncounterIds[
    Math.floor(rng() * template.catalystEncounterIds.length)
  ];

  // Seed it through the existing pending encounter seed mechanism.
  //
  // THR-992: this literal used to write `id` / `sourceActionId` and omit five
  // required fields — a shape that is not a `PendingEncounterSeed` at all, and
  // which the red typecheck baseline (THR-489) hid. It reached the shared pool
  // live: seed 42 / medium held two such entries at tick 132. Every consumer
  // that reads `.seedId` inherited the hazard (`phaseRouteEvents` threw its
  // whole phase on one), and the seeds that did spawn carried `undefined` into
  // every trace and player-facing label. The actor is part of the id because
  // two agents can complete the same strategic template on the same tick.
  const seed: PendingEncounterSeed = {
    seedId: `catalyst_${candidate.templateId}_${candidate.actorId}_${tick}`,
    // The candidate id is what `sourceActionId` was carrying — kept, in the
    // field the shared shape actually defines for provenance.
    sourceEncounterId: candidate.candidateId,
    sourceReactionId: 'strategic_catalyst',
    templateId: catalystId,
    targetAgentId: candidate.actorId,
    eligibleAfterTick: tick + STRATEGIC_CATALYST_SEED_DELAY_TICKS,
    priority: STRATEGIC_CATALYST_SEED_PRIORITY,
    seedLabel: `the wake of ${candidate.displayName}`,
    plantedTick: tick,
  };

  // Append to pending seeds (mutable state update — consistent with existing pattern)
  const existingSeeds = state.pendingEncounterSeeds ?? [];
  state.pendingEncounterSeeds = [...existingSeeds, seed];

  return true;
}

// ─── History Helpers ────────────────────────────────────────────────

function createHistoryEntry(
  candidate: StrategicActionCandidate,
  tick: number,
  ops: GraphOpResult[],
  catalystSeeded: boolean,
): StrategicHistoryEntry {
  return {
    tick,
    actorId: candidate.actorId,
    templateId: candidate.templateId,
    ambitionId: candidate.ambitionId,
    verb: candidate.verb,
    behaviorFamily: candidate.behaviorFamily,
    displayName: candidate.displayName,
    targetNodeId: candidate.targetNodeId,
    outcome: 'completed',
    graphOps: ops.map(o => `${o.op}:${o.success ? 'ok' : o.error}`),
    catalystSeeded,
  };
}

function pruneHistory(
  history: StrategicHistoryEntry[],
  tick: number,
): StrategicHistoryEntry[] {
  const windowStart = tick - STRATEGIC_HISTORY_WINDOW_TICKS;
  return history.filter(h => h.tick >= windowStart);
}
