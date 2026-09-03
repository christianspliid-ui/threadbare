/**
 * Undertaking checkpoints — dice in the strategic runtime (THR-1292 §2).
 *
 * This is the **second caller** of `stepResolutionCore`. An undertaking used to
 * advance because a tick elapsed; now it advances because a roll said so. The
 * expected duration is unchanged (three advancing checkpoints still finish the
 * default 18-tick undertaking) — what is new is that it can go wrong, halt, and
 * eventually force its owner to choose between abandoning and doubling down.
 *
 * ## What this module owns, and what it deliberately does not
 *
 * It owns the *verdict*: whether a checkpoint is due, whether it may resolve,
 * which band came up, what that band does to the record, and — when the ratchet
 * trips — which way the fork fell. It returns an updated
 * `StrategicProjectRuntime` plus the events and the verdict.
 *
 * It does **not** complete an undertaking. `verdict: 'completed'` is a report that
 * progress crossed the line; the world mutation, catalyst seeding and history
 * entry stay in `strategicActionLifecycle`, which already owns them. Splitting
 * differently would have dragged the whole graph-mutation surface in here for no
 * gain.
 *
 * ## Determinism (NFP #3)
 *
 * Each undertaking draws from its **own** stream,
 * `mulberry32(seed + tick*97 + hashString(projectId))`. Per-project rather than
 * per-phase is the load-bearing half: a single shared generator would make every
 * checkpoint's roll depend on how many undertakings happened to be iterated
 * before it, so adding an unrelated undertaking would silently re-roll all the
 * others. That is the encounter path's known order-coupling, and it is not
 * repeated here. Multiplier 97 is chosen because `seed + tick*59` already feeds
 * three phases and `*53` two; the checkpoint stream does not join that pile-up.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every lookup that can miss has a stated fallback and none of them throw: a
 * template with no usable `reachProfile` rolls on the first `REACH_DOMAINS`
 * entry, a vanished actor fails the undertaking cleanly the way the timeout path
 * already did, and a missing courage axis reads neutral so the fork's courage
 * term contributes zero rather than `NaN`.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import type {
  StrategicActionTemplate,
  StrategicProjectRuntime,
  UndertakingCheckpointEffect,
  UndertakingDivineInfluence,
  UndertakingMomentClass,
  UndertakingMomentPresentation,
  UndertakingMomentRecord,
} from '../types/strategicAction';
import type { AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { StepOutcome } from '../types/unifiedAction';
import type { TraceEntry } from '../types/trace';
import { REACH_DOMAINS } from '../types/traits';
import { signedToCanonical01 } from '../types/axisRegistry';
import { computeCapability } from './domainCapability';
import { resolveStepCore } from './stepResolutionCore';
import { mulberry32, hashString } from './factionAmbitions';
import { getAgentLocation } from './graphQueries';
import { resolveToParentLocation } from './sublocationShape';
import { resolveLocationToHex } from './encounterAwareness';
import { getStrategicTemplate } from './strategicActionCandidates';
import { ambitionNodeIdCandidates } from './ambitionShape';
import { emitTrace } from './traceBuffer';
import { isFollowed } from './followedAgents';
import { isForceMomentsOn, recordUndertakingPinLanding, undertakingBandPinFor } from './undertakingReviewLevers';
import {
  UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
  UNDERTAKING_PROGRESS_PER_ADVANCE,
  UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY,
  UNDERTAKING_CRIT_ADVANCE_MULTIPLIER,
  UNDERTAKING_HALT_RATCHET_N,
  UNDERTAKING_CRIT_FAIL_RATCHET_WEIGHT,
  UNDERTAKING_ESCALATE_BASE,
  UNDERTAKING_ESCALATE_AMBITION_TERM,
  UNDERTAKING_ESCALATE_COURAGE_WEIGHT,
  UNDERTAKING_ESCALATE_HALT_PRESSURE,
  UNDERTAKING_ESCALATE_THRESHOLD,
  UNDERTAKING_ESCALATE_DIFFICULTY_DELTA,
  UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER,
  UNDERTAKING_ABSENCE_DEFERRAL_LIMIT,
  UNDERTAKING_DEFAULT_REQUIRES_LOCATION,
  UNDERTAKING_DEFAULT_CAN_RUN_BESIDE,
  UNDERTAKING_INSPIRE_MODIFIER,
  UNDERTAKING_SABOTAGE_MODIFIER,
  MOMENT_INTERRUPT_SIGNIFICANCE,
  MOMENT_SETBACK_SIGNIFICANCE,
  MOMENT_BADGE_SIGNIFICANCE,
  UNDERTAKING_INSPIRE_FLAG,
  UNDERTAKING_SABOTAGE_FLAG,
  UNDERTAKING_VERB_DIFFICULTY,
} from '../data/strategic-action-constants';

// ─── Band → effect ──────────────────────────────────────────────────

/**
 * The fixed band→effect mapping (THR-1281 §5: crits are *intensifiers*, not extra
 * bands). Exported so the contract test can assert it is total over `StepOutcome`
 * rather than re-typing the table and agreeing with itself.
 *
 * `near_miss → halt` is the one row the plan flags as calibration: a near miss is
 * a soft halt (ratchet +1, no residue). Flip it only on CLI evidence that halts
 * overshoot.
 */
export const CHECKPOINT_EFFECT_BY_BAND: Readonly<Record<StepOutcome, UndertakingCheckpointEffect>> = {
  critical_success: 'advance',
  success: 'advance',
  success_at_cost: 'advance_at_cost',
  near_miss: 'halt',
  failure: 'halt',
  critical_failure: 'halt',
};

/** Ratchet points a halting band adds. Only a critical failure is worth more than one. */
function ratchetWeightFor(band: StepOutcome): number {
  return band === 'critical_failure' ? UNDERTAKING_CRIT_FAIL_RATCHET_WEIGHT : 1;
}

// ─── PRNG ───────────────────────────────────────────────────────────

/**
 * The per-undertaking checkpoint stream (NFP #3).
 *
 * Exported so tests can reproduce a run's exact draws without reaching into the
 * phase, and so the "resolution order cannot perturb draws" property is testable
 * directly rather than inferred from a whole-simulation diff.
 */
export function checkpointRng(seed: number, tick: number, projectId: string): () => number {
  return mulberry32(seed + tick * UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER + hashString(projectId));
}

// ─── Reach selection ────────────────────────────────────────────────

/**
 * The reach a checkpoint rolls on: the template's heaviest `reachProfile` weight,
 * ties broken by `REACH_DOMAINS` order so the answer never depends on key
 * insertion order.
 *
 * Fail-soft: a template with no profile, an empty one, or all-zero weights falls
 * back to the first `REACH_DOMAINS` entry rather than throwing. That is a real
 * authoring bug, so it is reported through the trace's `reach` field rather than
 * hidden — but it never stops the tick.
 */
export function pickPrimaryReach(template: StrategicActionTemplate | undefined): ReachDomain {
  const profile = template?.reachProfile;
  let best: ReachDomain = REACH_DOMAINS[0];
  let bestWeight = 0;
  if (profile) {
    for (const domain of REACH_DOMAINS) {
      const weight = profile[domain] ?? 0;
      if (weight > bestWeight) {
        best = domain;
        bestWeight = weight;
      }
    }
  }
  return best;
}

// ─── Moment presentation ────────────────────────────────────────────

/**
 * How a moment reaches the player (review ruling 2.1).
 *
 * Interrupts are reserved for **followed** agents — otherwise a world of 400
 * agents each running undertakings would interrupt continuously and the
 * affordance would mean nothing. Within a followed agent:
 *
 * - completions, abandonments, forks and complications always interrupt;
 * - only the **first** advance-at-cost per undertaking interrupts
 *   (`atCostMomentFired` gates the rest — the second setback on the same job is
 *   not news);
 * - foundings badge.
 *
 * Everything lands as a `TickEvent` and a trace regardless: badges and the
 * chronicle read the same stream, so presentation changes *salience*, never
 * whether something happened.
 */
export function resolveMomentPresentation(
  state: GameState,
  graph: WorldGraph,
  actorId: string,
  momentClass: UndertakingMomentClass,
  project: StrategicProjectRuntime,
): UndertakingMomentPresentation {
  if (!isFollowed(state, graph, actorId)) return 'badge';

  switch (momentClass) {
    case 'started':
      // Ruling 2.1: a founding is badge-tier. `?forcemoments` (THR-1300 slice 2)
      // promotes it to an interrupt for the flag's lifetime only — what
      // `?forceencounters` does for encounters, this does for moments: every
      // followed mortal's undertaking interrupts; unfollowed mortals stay invisible.
      return isForceMomentsOn() ? 'interrupt' : 'badge';
    case 'at_cost':
      return project.atCostMomentFired ? 'badge' : 'interrupt';
    case 'completion':
    case 'fork':
    case 'abandoned':
    case 'complication':
      return 'interrupt';
  }
}

/**
 * Follow now lives in `src/engine/followedAgents.ts` (THR-1299 slice 1).
 *
 * The local `isFollowedAgent` this module carried tested bare `thread`-edge
 * existence, while every attention predicate keyed on the edge's `courtPosition`
 * — so a player who cast `thread.dormant` silenced a mortal's encounters and kept
 * being interrupted by their undertaking news. The shared predicate closes that
 * divergence and adds the mute term this module's own comment asked doc 5 for.
 * Re-exported here so `gameInit`'s existing import site is untouched.
 */
export { defaultFollowedAgentIds } from './followedAgents';

// ─── Gates (§5 per-verb flags) ──────────────────────────────────────

/**
 * Whether the actor stands at the undertaking's stage.
 *
 * Resolves the actor upward through the three-tier position model — an actor in a
 * sublocation is at its parent location — then matches against whichever stage
 * the record carries. An undertaking with neither `targetNodeId` nor `targetHex`
 * has no stage to be absent from, so it is always present.
 *
 * **Resolution is recursive (THR-1296 §3).** `resolveToParentLocation` climbs exactly
 * one tier, which is correct for the canonical two-deep model and wrong for anything
 * nested deeper: an actor two sublocations down from their stage resolved to a node
 * that matched neither the stage nor its parent, and read as *absent* at every
 * checkpoint — a silent permanent deferral rather than a visible failure. Both sides
 * now compare through `resolveLocationToHex`, the recursive resolver the binder uses
 * everywhere, so the two modules agree on where a thing is. Behaviour change is
 * one-directional and small: deep-nested stages stop reading as absent, and nothing
 * that resolved before stops resolving.
 */
function isActorAtStage(graph: WorldGraph, project: StrategicProjectRuntime): boolean {
  if (!project.targetNodeId && !project.targetHex) return true;

  const raw = getAgentLocation(graph, project.actorId);
  const here = resolveToParentLocation(graph, raw) ?? raw;
  if (!here && !raw) return false;

  if (project.targetNodeId) {
    if (raw?.id === project.targetNodeId) return true;
    if (here?.id === project.targetNodeId) return true;
    // A stage that is itself a sublocation resolves to the same parent the actor did.
    const stage = graph.getNode(project.targetNodeId);
    const stageParent = resolveToParentLocation(graph, stage) ?? stage;
    if (here && stageParent && stageParent.id === here.id) return true;
    // Nested deeper than one tier on either side: compare the hexes both resolve to.
    // Same-hex is the codebase's own granularity for "here" (encounter awareness is
    // hex-granular by decision), so this is the established answer, not a looser one.
    if (raw && stage) {
      const actorHex = resolveLocationToHex(graph, raw.id);
      const stageHex = resolveLocationToHex(graph, stage.id);
      if (actorHex && stageHex
        && actorHex.col === stageHex.col && actorHex.row === stageHex.row) return true;
    }
  }

  if (project.targetHex) {
    const hex = raw ? resolveLocationToHex(graph, raw.id) : null;
    if (hex && hex.col === project.targetHex.col && hex.row === project.targetHex.row) return true;
    const col = here?.properties?.hexCol;
    const row = here?.properties?.hexRow;
    if (col === project.targetHex.col && row === project.targetHex.row) return true;
  }

  return false;
}

// ─── The fork ───────────────────────────────────────────────────────

export interface ForkInputs {
  readonly halts: number;
  readonly ambitionActive: boolean;
  readonly courage01: number;
}

export interface ForkVerdict {
  readonly decision: 'abandon' | 'escalate';
  readonly escalationWeight: number;
}

/**
 * The abandon-or-escalate weight (THR-1292 §2).
 *
 * Deterministic and rng-free by design: the fork is a *character* decision, and a
 * coin flip here would make the ratchet feel arbitrary rather than like the agent
 * running out of nerve. Every term is traced so the calibration the plan invites
 * can be done from a log.
 */
export function computeForkVerdict(inputs: ForkInputs): ForkVerdict {
  const escalationWeight =
    UNDERTAKING_ESCALATE_BASE +
    (inputs.ambitionActive ? UNDERTAKING_ESCALATE_AMBITION_TERM : 0) +
    (inputs.courage01 - 0.5) * UNDERTAKING_ESCALATE_COURAGE_WEIGHT -
    Math.max(0, inputs.halts - UNDERTAKING_HALT_RATCHET_N) * UNDERTAKING_ESCALATE_HALT_PRESSURE;

  return {
    escalationWeight,
    decision: escalationWeight >= UNDERTAKING_ESCALATE_THRESHOLD ? 'escalate' : 'abandon',
  };
}

/**
 * The agent's courage on the canonical 0–1 scale.
 *
 * Storage is signed ±1; the conversion goes through `signedToCanonical01` rather
 * than an open-coded `0.5 + 0.5*v`, which is the pole-inversion trap the review
 * flagged. A missing profile or axis reads neutral 0.5, so the courage term
 * contributes exactly zero rather than `NaN`.
 */
function readCourage01(graph: WorldGraph, actorId: string): number {
  const profile = graph.getNode(actorId)?.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  const signed = profile?.courage_prudence;
  if (typeof signed !== 'number' || !Number.isFinite(signed)) return 0.5;
  return signedToCanonical01(signed);
}

/**
 * Whether the ambition that drove this undertaking is still one the actor pursues.
 *
 * The comparison goes through `ambitionNodeIdCandidates` rather than matching
 * `project.ambitionId` against the edge target directly, because a project stores
 * a *template* id while the edge points at the *node* — and matching them
 * directly answers "no" for every agent in the world. Measured: with the naive
 * comparison, a 150-tick seed-42 run produced 55 abandonments and **zero**
 * escalations, because the ambition term was structurally unreachable.
 */
function isAmbitionActive(graph: WorldGraph, project: StrategicProjectRuntime): boolean {
  const candidates = ambitionNodeIdCandidates(project.ambitionId);
  return graph.getOutgoingEdges(project.actorId, 'pursues').some(e => candidates.includes(e.target));
}

// ─── The checkpoint ─────────────────────────────────────────────────

export type CheckpointVerdict =
  /** Not due this tick — the caller carries the record forward untouched */
  | 'not_due'
  /** Due but could not resolve (actor absent or busy); rescheduled */
  | 'deferred'
  /** Resolved and the undertaking continues (advanced, advanced at cost, or halted) */
  | 'continues'
  /** Progress crossed `progressRequired` — the caller completes it */
  | 'completed'
  /** The fork chose abandon, or the actor is gone — the caller fails it */
  | 'ended';

export interface CheckpointResult {
  readonly verdict: CheckpointVerdict;
  readonly project: StrategicProjectRuntime;
  readonly events: readonly TickEvent[];
  /**
   * The moment records this checkpoint produced (THR-1299 slice 2) — what the
   * player-facing surfaces consume. Absent on a deferral or a not-due pass, which
   * say nothing to anyone. A `completion` record rides here **without** its
   * TickEvent: the lifecycle emits that one, because only it knows the christened
   * name, and it re-labels the record to match before queueing it.
   */
  readonly moments?: readonly UndertakingMomentRecord[];
}

/**
 * What the bind pass observed before this checkpoint ran (THR-1296 §3).
 *
 * Passed *in* rather than looked up, which is what keeps this module graph-read-only
 * and free of any binder import: the bind pass writes the ledger, this module only
 * learns the verdict. Absent on every call that has no binder — every caller today.
 */
export interface CheckpointBindingInput {
  /** A must-persist cast member lost since the last checkpoint. */
  readonly loss?: {
    readonly castKey: string;
    readonly lostName: string;
    /** Singular role ⇒ halt rather than downgrade. Losing the only archmage is not a setback. */
    readonly singular: boolean;
  } | null;
  /** A slot is waiting on a queued mint — defer rather than resolve a scene short its cast. */
  readonly awaitingMint?: boolean;
}

/**
 * Resolve one undertaking's checkpoint for this tick.
 *
 * Pure with respect to the graph — it reads, never writes. The caller applies
 * completion and failure; traces are emitted here because the trace *is* the
 * record of a decision this module alone made.
 */
export function resolveUndertakingCheckpoint(
  state: GameState,
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
  binding?: CheckpointBindingInput,
): CheckpointResult {
  const scheduled = project.nextCheckpointTick ?? project.startedTick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS;
  if (tick < scheduled) {
    // First sight of a pre-checkpoint record: stamp its schedule so it does not
    // recompute the same answer every tick.
    const stamped = project.nextCheckpointTick === undefined ? { ...project, nextCheckpointTick: scheduled } : project;
    return { verdict: 'not_due', project: stamped, events: [] };
  }

  const template = getStrategicTemplate(project.templateId);
  const reach = pickPrimaryReach(template);
  const halts = project.halts ?? 0;
  const checkpointIndex = project.checkpointIndex ?? 0;
  const events: TickEvent[] = [];

  // The actor is the one thing nothing here can substitute for.
  const actorNode = graph.getNode(project.actorId);
  if (!actorNode) {
    const ended: StrategicProjectRuntime = {
      ...project,
      status: 'failed',
      failureReason: 'actor_lost',
      lastProgressTick: tick,
    };
    emitCheckpointTrace({
      project: ended, tick, reach, checkpointIndex,
      ended: 'actor_lost', presentation: 'none', halts,
    });
    return { verdict: 'ended', project: ended, events };
  }

  // ─── Fork before dice ─────────────────────────────────────────────
  // The ratchet replaces the checkpoint it trips on; an agent out of nerve does
  // not get one more roll first.
  if (halts >= UNDERTAKING_HALT_RATCHET_N) {
    return resolveFork(state, graph, project, tick, halts, events);
  }

  // ─── Gates ────────────────────────────────────────────────────────
  const requiresLocation = template?.requiresLocation ?? UNDERTAKING_DEFAULT_REQUIRES_LOCATION;
  const canRunBeside = template?.canRunBeside ?? UNDERTAKING_DEFAULT_CAN_RUN_BESIDE;

  // Read of the busy set, never a write — the busy gate itself is untouched
  // (THR-1280 addendum; slice 2's contract test pins it).
  const actorIsBusy = state.unifiedActions.some(a => !a.resolved && a.actorId === project.actorId);

  if (!canRunBeside && actorIsBusy) {
    // Busy deferrals do NOT feed the absence counter: being mid-encounter is the
    // actor doing something, which is the opposite of the neglect that counter measures.
    const deferredProject: StrategicProjectRuntime = {
      ...project,
      nextCheckpointTick: tick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
    };
    emitCheckpointTrace({
      project: deferredProject, tick, reach, checkpointIndex,
      deferred: 'actor_busy', presentation: 'none', halts,
    });
    return { verdict: 'deferred', project: deferredProject, events };
  }

  if (requiresLocation && !isActorAtStage(graph, project)) {
    const deferrals = (project.deferrals ?? 0) + 1;
    const converts = deferrals >= UNDERTAKING_ABSENCE_DEFERRAL_LIMIT;
    const deferredProject: StrategicProjectRuntime = {
      ...project,
      nextCheckpointTick: tick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
      deferrals: converts ? 0 : deferrals,
      halts: converts ? halts + 1 : halts,
    };
    emitCheckpointTrace({
      project: deferredProject, tick, reach, checkpointIndex,
      deferred: 'actor_absent', presentation: 'none', halts: deferredProject.halts ?? 0,
    });
    return { verdict: 'deferred', project: deferredProject, events };
  }

  // ─── Awaiting a mint (THR-1296 §3/§5) ─────────────────────────────
  // A slot's person is queued but not yet born. Defer rather than resolve a scene
  // short its cast — and deliberately *without* touching the absence counter or the
  // halt ratchet: the actor is present and willing, the world simply has not caught
  // up. Charging a halt for the engine's own queue latency would make the mint budget
  // read as the actor's failure.
  if (binding?.awaitingMint) {
    const deferredProject: StrategicProjectRuntime = {
      ...project,
      nextCheckpointTick: tick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
    };
    emitCheckpointTrace({
      project: deferredProject, tick, reach, checkpointIndex,
      deferred: 'awaiting_mint', presentation: 'none', halts,
    });
    return { verdict: 'deferred', project: deferredProject, events };
  }

  // ─── The roll ─────────────────────────────────────────────────────
  const capability = computeCapability(graph, project.actorId, reach);
  // A cell's difficulty scales on the object's tier (THR-1392 slice 2); a template's is authored.
  const authored = template?.cellVariant && project.objectTier
    ? UNDERTAKING_VERB_DIFFICULTY[template.cellVariant][project.objectTier - 1]
    : template?.checkpointDifficulty ?? UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY;
  const difficulty = clamp01(authored + (project.checkpointDifficultyDelta ?? 0));

  // The Inspire/Sabotage rider (§3). Both divine actions stamp a one-shot flag on
  // the actor; it is consumed here, so a god's nudge lands on exactly one checkpoint
  // rather than tilting the whole undertaking. Escalation stakes are folded into
  // `difficulty` above and deliberately not double-counted here.
  const rider = consumeUndertakingRiders(graph, project.actorId);
  const modifiers = rider.modifier;
  // Scapegoat provenance (THR-1299 slice 2, THR-1282 §6): the moment this checkpoint
  // produces can name the god's hand in it. With both riders present the verb
  // follows the net sign — that is what actually moved the roll — and a dead-even
  // pair keeps the first one read, since "the god touched this" is still true.
  const divineInfluence: UndertakingDivineInfluence | undefined = rider.verbs.length > 0
    ? {
      verb: rider.modifier < 0 ? 'sabotage' : rider.modifier > 0 ? 'inspire' : rider.verbs[0],
      tick,
    }
    : undefined;

  const rng = checkpointRng(state.seed, tick, project.projectId);
  // The review pin (THR-1300 slice 2): doc 1's `bandOverride` seam, read at the one
  // place this module calls the resolver. The roll, floors and riders all run and
  // trace for real; only the band is substituted, so every downstream consequence —
  // creation effects, halts, forks, moments, the failure residue — fires as a real
  // resolution's would. Inert unless a URL flag or `__DEBUG` armed it.
  const bandPinned = undertakingBandPinFor(project.templateId);
  const core = resolveStepCore(
    {
      actorId: project.actorId,
      reach,
      capability,
      difficulty,
      actionModifiers: modifiers,
      testShapers: undefined,
      variancePolicy: 'agent',
      quintessencePolicy: 'none',
      tick,
      sourceLabel: 'undertaking',
      bandOverride: bandPinned,
    },
    rng,
  );

  const band = core.outcome;
  if (bandPinned) recordUndertakingPinLanding(template, band);
  const effect = CHECKPOINT_EFFECT_BY_BAND[band];

  // ─── Apply the effect ─────────────────────────────────────────────
  let progress = project.progress;
  let nextHalts = halts;
  let atCost = false;

  // A must-persist cast member is gone. The loss lands on this checkpoint as a named
  // complication rather than as a silent gap — the roll already happened and stands,
  // so what changes is the *consequence*, not the dice (THR-1296 §3).
  const bindingLoss = binding?.loss ?? null;

  if (effect === 'advance' || effect === 'advance_at_cost') {
    if (bindingLoss?.singular) {
      // The role was the world's only one. That is not a setback to press through —
      // the undertaking stops until the slot re-binds on the following pass.
      nextHalts = halts + ratchetWeightFor(band);
    } else {
      const step = band === 'critical_success'
        ? UNDERTAKING_PROGRESS_PER_ADVANCE * UNDERTAKING_CRIT_ADVANCE_MULTIPLIER
        : UNDERTAKING_PROGRESS_PER_ADVANCE;
      progress = Math.min(project.progress + step, project.progressRequired);
      // A plain advance is downgraded to advance-at-cost by the loss; an advance that
      // was already at-cost stays at-cost rather than compounding.
      atCost = effect === 'advance_at_cost' || bindingLoss !== null;
    }
  } else {
    nextHalts = halts + ratchetWeightFor(band);
  }

  const completing = progress >= project.progressRequired;
  const momentClass: UndertakingMomentClass | null =
    completing ? 'completion'
      // The widening (THR-1296 §3): `complication` used to be produced by critical
      // failure alone. A broken must-persist binding now reaches it too — additive,
      // and the only way the loss gets said out loud.
      : (band === 'critical_failure' || bindingLoss !== null) ? 'complication'
        : atCost ? 'at_cost'
          : null;

  const presentation: UndertakingMomentPresentation = momentClass
    ? resolveMomentPresentation(state, graph, project.actorId, momentClass, project)
    : 'none';

  const advanced: StrategicProjectRuntime = {
    ...project,
    progress,
    lastProgressTick: tick,
    checkpointIndex: checkpointIndex + 1,
    nextCheckpointTick: tick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
    halts: nextHalts,
    // A resolved checkpoint means the actor showed up; the absence streak resets.
    deferrals: 0,
    atCostMomentFired: project.atCostMomentFired || atCost,
    everInterrupted: project.everInterrupted || presentation === 'interrupt',
    lastCheckpoint: { band, effect, roll: core.roll, probability: core.probability, tick },
    ...(divineInfluence ? { divineInfluence } : {}),
  };

  emitCheckpointTrace({
    project: advanced, tick, reach, checkpointIndex,
    band, effect, roll: core.roll, probability: core.probability,
    capability, difficulty, modifiers, atCost,
    presentation, halts: nextHalts, bandPinned,
  });

  const moments: UndertakingMomentRecord[] = [];
  if (momentClass) {
    const moment = buildMoment({
      graph, project: advanced, momentClass, presentation, tick,
      displayName: template?.displayName, lostName: bindingLoss?.lostName, band, effect,
    });
    moments.push(moment.record);
    // The completion gate, kept for one reason only (THR-1299 slice 2): the
    // lifecycle already emits the completion TickEvent, with the *christened* name
    // this module cannot know. Emitting a second one here would put "completes
    // Establish Trade Network" beside "completes The Saltway Ring" in the same
    // chronicle. The record still rides `moments` — the lifecycle re-labels it.
    if (momentClass !== 'completion') events.push(moment.event);
  }

  return { verdict: completing ? 'completed' : 'continues', project: advanced, events, moments };
}

// ─── Fork resolution ────────────────────────────────────────────────

function resolveFork(
  state: GameState,
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
  halts: number,
  events: TickEvent[],
): CheckpointResult {
  const ambitionActive = isAmbitionActive(graph, project);
  const courage01 = readCourage01(graph, project.actorId);

  // One escalation maximum: an agent who already doubled down and ran the ratchet
  // out again has made the decision the second time by having no move left.
  const forced = project.escalated === true;
  const verdict = forced
    ? { decision: 'abandon' as const, escalationWeight: computeForkVerdict({ halts, ambitionActive, courage01 }).escalationWeight }
    : computeForkVerdict({ halts, ambitionActive, courage01 });

  const template = getStrategicTemplate(project.templateId);
  const presentation = resolveMomentPresentation(
    state, graph, project.actorId,
    verdict.decision === 'abandon' ? 'abandoned' : 'fork',
    project,
  );

  emitTrace({
    category: 'undertaking_fork',
    tick,
    actorId: project.actorId,
    projectId: project.projectId,
    escalationWeight: verdict.escalationWeight,
    threshold: UNDERTAKING_ESCALATE_THRESHOLD,
    decision: verdict.decision,
    halts,
    ambitionActive,
    courage01,
    ...(verdict.decision === 'abandon'
      ? { visibleFailure: (project.everInterrupted || presentation === 'interrupt') === true }
      : {}),
    summary: forced
      ? `Undertaking ${project.templateId} abandoned — ratchet tripped again after escalating`
      : `Undertaking ${project.templateId} ${verdict.decision} at ${halts} halts (weight ${verdict.escalationWeight.toFixed(3)})`,
  } as TraceEntry);

  if (verdict.decision === 'escalate') {
    const escalated: StrategicProjectRuntime = {
      ...project,
      halts: 0,
      escalated: true,
      checkpointDifficultyDelta: (project.checkpointDifficultyDelta ?? 0) + UNDERTAKING_ESCALATE_DIFFICULTY_DELTA,
      // Doc 3's re-binding seam. Nothing reads it yet — the flag is the contract.
      rebindRequested: true,
      nextCheckpointTick: tick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
      everInterrupted: project.everInterrupted || presentation === 'interrupt',
      lastProgressTick: tick,
    };
    const fork = buildMoment({
      graph, project: escalated, momentClass: 'fork', presentation, tick,
      displayName: template?.displayName,
    });
    events.push(fork.event);
    return { verdict: 'continues', project: escalated, events, moments: [fork.record] };
  }

  const abandoned: StrategicProjectRuntime = {
    ...project,
    status: 'failed',
    failureReason: 'abandoned_after_halts',
    everInterrupted: project.everInterrupted || presentation === 'interrupt',
    lastProgressTick: tick,
  };
  const abandon = buildMoment({
    graph, project: abandoned, momentClass: 'abandoned', presentation, tick,
    displayName: template?.displayName,
  });
  events.push(abandon.event);
  return { verdict: 'ended', project: abandoned, events, moments: [abandon.record] };
}

// ─── Residue (§2.2 — failure residue follows visibility) ────────────

/**
 * The residue class a finished-badly undertaking leaves behind.
 *
 * The rule the review ruled on: a failure the player *watched* leaves something
 * in the world — the half-built thing, under the failure-name register — and a
 * failure nobody watched leaves a chronicle line and no graph litter. Docs 2/3
 * mint the scar; this doc guarantees the classification and the event.
 */
export type UndertakingResidue = 'undertaking_failed_visible' | 'undertaking_failed_clean';

export function classifyFailureResidue(project: StrategicProjectRuntime): UndertakingResidue {
  return project.everInterrupted ? 'undertaking_failed_visible' : 'undertaking_failed_clean';
}

/**
 * The residue event. Carries the *possessive inputs* — who, what template, which
 * target — because that is what a minting rule needs and what a bare "X failed"
 * string would have thrown away. The minting rule itself is doc 4's.
 */
export function buildResidueEvent(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
  displayName?: string,
): TickEvent {
  const residue = classifyFailureResidue(project);
  const actorName = graph.getNode(project.actorId)?.name ?? project.actorId;
  const label = displayName ?? project.templateId;
  return {
    id: `${residue}_${project.projectId}_${tick}`,
    tick,
    type: 'agent_action',
    message: residue === 'undertaking_failed_visible'
      ? `${actorName} abandons ${label}, leaving it half-done`
      : `${actorName} quietly lets ${label} go`,
    significance: residue === 'undertaking_failed_visible' ? 0.55 : 0.25,
    actorId: project.actorId,
  };
}

/**
 * The abandon mint-event for the THR-726 world-minted-ambition lane.
 *
 * This doc guarantees only that the event fires carrying owner and undertaking
 * identity; doc 4 authors what an ambition minted from it looks like. Kept
 * separate from the residue event because they answer different questions —
 * residue is "what is left in the world", this is "what might someone now want".
 */
export function buildAbandonMintEvent(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
  displayName?: string,
): TickEvent {
  const actorName = graph.getNode(project.actorId)?.name ?? project.actorId;
  return {
    // `undertaking_mint_...`, not `undertaking_abandoned_...`: the latter is the
    // *moment* event's id, and the two fire on the same project in the same tick.
    // Sharing the string minted a duplicate TickEvent id, which the React event
    // list keys on — it renders duplicated or omitted rows. Caught by the
    // event-id uniqueness contract test, not by anything local.
    id: `undertaking_mint_abandoned_${project.projectId}_${tick}`,
    tick,
    type: 'agent_action',
    message: `${actorName} gives up on ${displayName ?? project.templateId}`,
    significance: 0.5,
    actorId: project.actorId,
  };
}

// ─── Event + trace helpers ──────────────────────────────────────────

export interface BuildMomentArgs {
  graph: WorldGraph;
  project: StrategicProjectRuntime;
  momentClass: UndertakingMomentClass;
  presentation: UndertakingMomentPresentation;
  tick: number;
  displayName?: string;
  /** The must-persist cast member this undertaking just lost (THR-1296 §3). */
  lostName?: string;
  band?: StepOutcome;
  effect?: UndertakingCheckpointEffect;
}

/**
 * One moment, as both halves the stream needs (THR-1299 slice 2): the TickEvent
 * the chronicle reads and the record the surfaces read. Built together so their
 * `id` and label can never disagree — a card reached from a chronicle line must be
 * the card that line describes.
 *
 * Significance follows presentation, not class: an interrupt-tier moment clears
 * the chronicle threshold (`MOMENT_INTERRUPT_SIGNIFICANCE`), because a moment loud
 * enough to stop the player is a chronicle line by definition; badge-tier keeps the
 * doc-1 sub-threshold values. That one constant is the whole "interrupts reach the
 * chronicle" mechanism — no orchestrator threshold moves.
 *
 * `divineInfluence` is claimed only when the rider landed on *this* checkpoint
 * (`tick` matches): the runtime remembers the god's latest touch for the arc panel,
 * but a moment three checkpoints later was not "because of" it.
 */
export function buildMoment(args: BuildMomentArgs): { event: TickEvent; record: UndertakingMomentRecord } {
  const { graph, project, momentClass, presentation, tick, displayName, lostName, band, effect } = args;
  const actorName = graph.getNode(project.actorId)?.name ?? project.actorId;
  const label = displayName ?? project.templateId;
  const message =
    // A named loss beats the generic line. "Hits serious trouble" without saying who
    // is gone is precisely the anonymous beat the binder exists to replace, and the
    // ledger is what remembers the name after the node itself is gone.
    lostName && momentClass === 'complication'
      ? `${actorName} loses ${lostName} — ${label} is thrown into disarray`
      : momentClass === 'at_cost' ? `${actorName} presses on with ${label}, but it costs them`
        : momentClass === 'complication' ? `${actorName} hits serious trouble with ${label}`
          : momentClass === 'fork' ? `${actorName} doubles down on ${label}`
            : momentClass === 'abandoned' ? `${actorName} abandons ${label}`
              : momentClass === 'completion' ? `${actorName} completes ${label}`
                : `${actorName} begins ${label}`;

  const significance = presentation === 'interrupt'
    ? MOMENT_INTERRUPT_SIGNIFICANCE
    : momentClass === 'complication' || momentClass === 'abandoned'
      ? MOMENT_SETBACK_SIGNIFICANCE
      : MOMENT_BADGE_SIGNIFICANCE;

  const id = `undertaking_${momentClass}_${project.projectId}_${tick}`;
  const influence = project.divineInfluence?.tick === tick ? project.divineInfluence : undefined;

  return {
    event: {
      id,
      tick,
      type: 'agent_action',
      message,
      significance,
      actorId: project.actorId,
    },
    record: {
      id,
      projectId: project.projectId,
      actorId: project.actorId,
      templateId: project.templateId,
      momentClass,
      presentation,
      tick,
      label: message,
      undertakingName: label,
      ...(band ? { band } : {}),
      ...(effect ? { effect } : {}),
      ...(lostName ? { lostCastName: lostName } : {}),
      ...(influence ? { divineInfluence: influence } : {}),
      acknowledged: false,
    },
  };
}

interface CheckpointTraceArgs {
  project: StrategicProjectRuntime;
  tick: number;
  reach: ReachDomain;
  checkpointIndex: number;
  halts: number;
  presentation: UndertakingMomentPresentation;
  band?: StepOutcome;
  effect?: UndertakingCheckpointEffect;
  roll?: number;
  probability?: number;
  capability?: number;
  difficulty?: number;
  modifiers?: number;
  atCost?: boolean;
  deferred?: 'actor_absent' | 'actor_busy' | 'awaiting_mint';
  /** Terminal, not deferred: the actor is gone and no retry follows. */
  ended?: 'actor_lost';
  /** The review pin's band, when one substituted the roll (THR-1300 slice 2). */
  bandPinned?: StepOutcome;
}

function emitCheckpointTrace(args: CheckpointTraceArgs): void {
  const { project, tick, reach, checkpointIndex, halts, presentation } = args;
  emitTrace({
    category: 'undertaking_checkpoint',
    tick,
    actorId: project.actorId,
    projectId: project.projectId,
    templateId: project.templateId,
    checkpointIndex,
    reach,
    band: args.band,
    effect: args.effect,
    roll: args.roll,
    probability: args.probability,
    capability: args.capability,
    difficulty: args.difficulty,
    modifiers: args.modifiers,
    halts,
    atCost: args.atCost === true,
    progress: project.progress,
    progressRequired: project.progressRequired,
    deferred: args.deferred,
    ended: args.ended,
    bandPinned: args.bandPinned,
    presentation,
    summary: args.deferred
      ? `Checkpoint ${checkpointIndex} on ${project.templateId} deferred (${args.deferred})`
      : args.ended
        ? `Checkpoint ${checkpointIndex} on ${project.templateId} ended (${args.ended})`
        : `Checkpoint ${checkpointIndex} on ${project.templateId}: ${args.band} → ${args.effect} (${project.progress}/${project.progressRequired})`,
  } as TraceEntry);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ─── Divine riders (THR-1292 §3) ────────────────────────────────────

/**
 * Read and clear any pending Inspire/Sabotage rider on this actor.
 *
 * One-shot by construction: the flag is deleted as it is read, so a single divine
 * nudge lands on exactly one checkpoint. Both flags present cancel toward their
 * sum rather than one silently winning — a god who did both got what they asked for.
 *
 * Returns a signed modifier folded into `actionModifiers`, so it moves the roll the
 * same way an encounter's modifiers do rather than through a bespoke path.
 */
export function consumeUndertakingRider(graph: WorldGraph, actorId: string): number {
  return consumeUndertakingRiders(graph, actorId).modifier;
}

/** What `consumeUndertakingRiders` read: the folded modifier and which verbs it came from. */
export interface ConsumedRiders {
  readonly modifier: number;
  /** In read order — inspire before sabotage — so a caller can name the first when they cancel. */
  readonly verbs: readonly UndertakingDivineInfluence['verb'][];
}

/**
 * The structured form of `consumeUndertakingRider` (THR-1299 slice 2): the same
 * one-shot read, but it also says *which* divine verbs it consumed, so the
 * checkpoint can stamp `divineInfluence` for the moment's provenance chip. The
 * number-returning wrapper above stays for every existing caller.
 */
export function consumeUndertakingRiders(graph: WorldGraph, actorId: string): ConsumedRiders {
  const actor = graph.getNode(actorId);
  if (!actor) return { modifier: 0, verbs: [] };
  const props = actor.properties as Record<string, unknown>;

  let modifier = 0;
  const verbs: UndertakingDivineInfluence['verb'][] = [];

  const inspire = props[UNDERTAKING_INSPIRE_FLAG];
  if (inspire != null) {
    modifier += typeof inspire === 'number' ? inspire : UNDERTAKING_INSPIRE_MODIFIER;
    props[UNDERTAKING_INSPIRE_FLAG] = undefined;
    verbs.push('inspire');
  }

  if (props[UNDERTAKING_SABOTAGE_FLAG] === true) {
    modifier -= UNDERTAKING_SABOTAGE_MODIFIER;
    props[UNDERTAKING_SABOTAGE_FLAG] = undefined;
    verbs.push('sabotage');
  }

  return { modifier, verbs };
}
