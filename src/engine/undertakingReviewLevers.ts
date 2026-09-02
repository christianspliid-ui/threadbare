/**
 * Undertaking review levers (THR-1300 slice 2) — the `?spawn` / `?outcome` /
 * `?forceencounters` analogs for undertakings.
 *
 * Plan: `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Engine pillar.
 * `debugOutcomePin.ts` is the sibling and decided the shape: module state armed by
 * a URL flag or `__DEBUG`, inert otherwise, **not** gated on `import.meta.env.DEV`
 * because the Done-when names the deployed build.
 *
 * Three levers, and the rule that governs all three: **the lever is honest or it is
 * nothing.** A review start goes through the board's own candidate helpers and the
 * board's own start path — never a bespoke `projects.push` — bypassing only the
 * three named *generation* gates, each traced on the `strategic_action_started`
 * record so a census can tell a review start from an organic one. A destroy with
 * no owned target says so. A below-spotlight actor says so. The live proof (slice 3)
 * reads those flags and fails the corresponding claim.
 *
 *   1. `startUndertakingForReview` — the start lever.
 *   2. `setUndertakingBandPin` / `getUndertakingPinVerdict` — the band pin, read by
 *      `resolveUndertakingCheckpoint` at its one `resolveStepCore` call and passed as
 *      `bandOverride` (doc 1's seam, unused until now). Roll, floors and traces stay
 *      honest; only the band is substituted.
 *   3. `setForceMoments` — promotes the `started` class to interrupt tier for every
 *      followed mortal while set; read by `resolveMomentPresentation`.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type {
  StrategicActionCandidate,
  StrategicActionTemplate,
  StrategicRuntimeState,
  UndertakingMomentRecord,
} from '../types/strategicAction';
import type { StepOutcome } from '../types/unifiedAction';
import type { StrategicActionStartedTrace } from '../types/trace';
import {
  generateStrategicCandidates,
  getStrategicTemplate,
  type ReviewCandidateOptions,
  type ReviewBypassableGate,
} from './strategicActionCandidates';
import { executeStrategicAction } from './strategicActionLifecycle';
import { profiledAmbitionIdsFor } from './strategicActionCandidates';
import { isAutonomousDecisionActor } from './strategicKindReachability';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from './factionAmbitions';
import { REVIEWABLE_OUTCOME_BANDS, isReviewableOutcomeBand } from './debugOutcomePin';
import { CHECKPOINT_EFFECT_BY_BAND } from './undertakingCheckpoints';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/**
 * The only generation gates a review start may skip, closed on purpose. Everything
 * else — reach floors, the mentorship apprentice gate, the control gate, the remote
 * anchor, the duplicate window — still refuses, because a review of a template the
 * world could not run is not a review of the template.
 */
export const REVIEW_LEVER_BYPASSABLE_GATES: readonly ReviewBypassableGate[] = [
  'ambition_profile',
  'active_cap',
  'motive_gate',
];

/** Attempts the URL flag makes before giving up — the `?spawn` retry pattern. */
export const REVIEW_LEVER_MAX_ATTEMPTS = 30;

/** Seed offset for the lever's own PRNG stream, so a review start never shares draws with the tick. */
export const REVIEW_LEVER_SEED_OFFSET = 104729;

// ─── The start lever ─────────────────────────────────────────────

export type ReviewStartFailure =
  | 'unknown_template'
  | 'unknown_actor'
  | 'no_target'
  | 'refused';

export interface ReviewStartOptions {
  /** Pin the review to one target node; the lever otherwise prefers an owned target for a destroy. */
  readonly targetId?: string;
  /** Arm the band pin for this template in the same call. */
  readonly band?: string;
}

export interface ReviewStartResult {
  readonly ok: boolean;
  readonly reason?: ReviewStartFailure;
  /** Every refusal the generator recorded, when `reason` is `refused` or `no_target`. */
  readonly refusals?: readonly string[];
  readonly candidate?: StrategicActionCandidate;
  readonly projectId?: string;
  /** The gates that were bypassed to start it — always the closed list, named. */
  readonly bypassedGates?: readonly ReviewBypassableGate[];
  /**
   * `true` when the actor is not an autonomous decision actor: the undertaking was
   * started anyway (a review is a review) but its checkpoints roll only when the
   * phase visits this actor, and the live proof treats a claim on such a start as failed.
   */
  readonly belowSpotlight?: boolean;
  /** For a destroy: whether the chosen target has an owner to be harmed. */
  readonly targetOwned?: boolean;
  readonly strategicState?: StrategicRuntimeState;
  readonly moments?: readonly UndertakingMomentRecord[];
  readonly message: string;
}

/**
 * Start `templateId` on `actorId` through the board's own path.
 *
 * Pure with respect to `state` except for the graph mutations the start path itself
 * performs (an instant template mutates immediately, exactly as the phase would);
 * the caller applies the returned `strategicState` and `moments` — the same contract
 * `executeStrategicAction` has with `phaseAgentDecision`.
 */
export function startUndertakingForReview(
  state: GameState,
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  opts: ReviewStartOptions = {},
): ReviewStartResult {
  const template = getStrategicTemplate(templateId);
  if (!template) {
    return { ok: false, reason: 'unknown_template', message: `Unknown undertaking template '${templateId}'.` };
  }
  const actor = graph.getNode(actorId);
  if (!actor || actor.type !== 'actor') {
    return { ok: false, reason: 'unknown_actor', message: `No actor '${actorId}'.` };
  }
  const belowSpotlight = !isAutonomousDecisionActor(actor);
  const tick = state.tick;

  // The ambitions whose profiles name this template. Passing them keeps the
  // `ambition_profile` bypass honest: the candidate still carries a real ambition id,
  // it just does not require the actor to *hold* that ambition.
  const ambitionIds = profiledAmbitionIdsFor(templateId);
  const review: ReviewCandidateOptions = {
    templateId,
    targetId: opts.targetId,
    bypass: new Set(REVIEW_LEVER_BYPASSABLE_GATES),
    preferOwnedTarget: template.verb === 'destroy',
  };
  const rng = mulberry32(state.seed + tick + REVIEW_LEVER_SEED_OFFSET + actorId.length);
  const generated = generateStrategicCandidates(
    graph, actorId, ambitionIds, state.strategicState, tick, rng, review,
  );
  const candidate = generated.candidates[0];
  if (!candidate) {
    const refusals = generated.rejections.map(r => r.reason);
    const noTarget = refusals.every(r => r === 'no_valid_targets' || r.startsWith('no_valid_targets'));
    return {
      ok: false,
      reason: noTarget ? 'no_target' : 'refused',
      refusals,
      belowSpotlight,
      message: noTarget
        ? `${template.displayName}: no valid target for ${actor.name} where they stand.`
        : `${template.displayName}: refused at generation — ${refusals.join(', ') || 'no candidate'}.`,
    };
  }

  const result = executeStrategicAction(state, graph, candidate, tick, rng);
  const projectId = result.strategicState?.projects.find(
    p => p.actorId === actorId && p.templateId === templateId && p.startedTick === tick,
  )?.projectId;

  const trace: Omit<StrategicActionStartedTrace, 'id' | 'timestamp'> & { summary: string } = {
    category: 'strategic_action_started',
    tick,
    actorId,
    candidateId: candidate.candidateId,
    templateId,
    behaviorFamily: candidate.behaviorFamily,
    verb: candidate.verb,
    targetNodeId: candidate.targetNodeId,
    targetHex: candidate.targetHex,
    executionMode: candidate.executionMode,
    startedBy: 'review_lever',
    bypassedGates: [...REVIEW_LEVER_BYPASSABLE_GATES],
    summary: `${actor.name} begins ${template.displayName} under review (bypassed: ${REVIEW_LEVER_BYPASSABLE_GATES.join(', ')})`,
  };
  emitTrace(trace);

  if (opts.band !== undefined) setUndertakingBandPin(templateId, opts.band);

  const targetOwned = candidate.victimAgentId !== undefined;
  const notes: string[] = [];
  if (belowSpotlight) notes.push('actor is below the spotlight — checkpoints roll only when the phase visits them');
  if (template.verb === 'destroy' && !targetOwned) notes.push('destroy started on an unowned target — no victim, no harm');

  return {
    ok: true,
    candidate,
    projectId,
    bypassedGates: [...REVIEW_LEVER_BYPASSABLE_GATES],
    belowSpotlight,
    targetOwned: template.verb === 'destroy' ? targetOwned : undefined,
    strategicState: result.strategicState,
    moments: result.moments,
    message: `${actor.name} begins ${template.displayName}${candidate.targetNodeId ? ` at ${graph.getNode(candidate.targetNodeId)?.name ?? candidate.targetNodeId}` : ''}`
      + (notes.length ? ` — ${notes.join('; ')}` : ''),
  };
}

// ─── The band pin ────────────────────────────────────────────────

export interface UndertakingBandPin {
  readonly templateId: string;
  readonly band: StepOutcome;
}

export type UndertakingPinStatus =
  /** A checkpoint of the named template resolved on the pinned band. */
  | 'band_landed'
  /**
   * It landed, but the template authors no `creationEffects` entry for that band's
   * effect — the base checkpoint texture rendered, which a reviewer must not mistake
   * for authored content.
   */
  | 'no_effect_on_band'
  /** No checkpoint of that template has resolved since the pin was set. */
  | 'not_reached';

export interface UndertakingPinVerdict {
  readonly templateId: string;
  readonly requestedBand: StepOutcome;
  readonly status: UndertakingPinStatus;
  /** Checkpoints of the template resolved on the pinned band since it was set. */
  readonly landed: number;
  readonly message: string;
}

let activeBandPin: UndertakingBandPin | null = null;
let landedCount = 0;
let lastVerdict: UndertakingPinVerdict | null = null;

export function setUndertakingBandPin(templateId: string, band: string): boolean {
  if (!isReviewableOutcomeBand(band)) {
    console.warn(
      `[?outcome] "${band}" is not a reviewable band. Expected one of: `
      + `${REVIEWABLE_OUTCOME_BANDS.join(', ')}. Checkpoints resolve normally.`,
    );
    return false;
  }
  if (!getStrategicTemplate(templateId)) {
    console.warn(`[?outcome] no undertaking template '${templateId}' — nothing pinned.`);
    return false;
  }
  activeBandPin = { templateId, band };
  landedCount = 0;
  lastVerdict = null;
  return true;
}

export function clearUndertakingBandPin(): void {
  activeBandPin = null;
  landedCount = 0;
  lastVerdict = null;
}

export function getUndertakingBandPin(): UndertakingBandPin | null {
  return activeBandPin;
}

/** The band to force on a checkpoint of `templateId`, or `undefined` to roll normally. */
export function undertakingBandPinFor(templateId: string): StepOutcome | undefined {
  return activeBandPin?.templateId === templateId ? activeBandPin.band : undefined;
}

/**
 * Called by the checkpoint resolver after a pinned checkpoint resolves. Classifies
 * whether the band's authored content exists for this template, so the URL cannot
 * let a reviewer mistake the base texture for the band.
 */
export function recordUndertakingPinLanding(template: StrategicActionTemplate | undefined, band: StepOutcome): void {
  if (!activeBandPin || !template || template.id !== activeBandPin.templateId || band !== activeBandPin.band) return;
  landedCount += 1;
  const effect = CHECKPOINT_EFFECT_BY_BAND[band];
  const effectKey = effect === 'advance' ? 'onAdvance' : effect === 'advance_at_cost' ? 'onAtCost'
    : band === 'critical_failure' ? 'onCritFailure' : null;
  const authored = effectKey !== null && (template.creationEffects?.[effectKey]?.length ?? 0) > 0;
  const status: UndertakingPinStatus = authored ? 'band_landed' : 'no_effect_on_band';
  lastVerdict = {
    templateId: template.id,
    requestedBand: band,
    status,
    landed: landedCount,
    message: authored
      ? `${template.displayName}: checkpoint landed on ${band} with authored ${effectKey} effects (${landedCount} so far).`
      : `${template.displayName}: checkpoint landed on ${band}, but the template authors no creationEffects for that band — the base checkpoint texture is on screen.`,
  };
  if (status === 'band_landed') console.info(`[?outcome] ${lastVerdict.message}`);
  else console.warn(`[?outcome] ${lastVerdict.message}`);
}

export function getUndertakingPinVerdict(): UndertakingPinVerdict | null {
  if (!activeBandPin) return null;
  if (lastVerdict) return lastVerdict;
  return {
    templateId: activeBandPin.templateId,
    requestedBand: activeBandPin.band,
    status: 'not_reached',
    landed: 0,
    message: `${activeBandPin.templateId}: no checkpoint has resolved since the pin was set.`,
  };
}

// ─── Force-moments ───────────────────────────────────────────────

let forceMoments = false;

/** While set, a followed mortal's `started` moment interrupts instead of badging. */
export function setForceMoments(on: boolean): void {
  forceMoments = on;
}

export function isForceMomentsOn(): boolean {
  return forceMoments;
}
