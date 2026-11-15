/**
 * THR-2227 (plan THR-2204 § Engine, slice 2) — the climax step's fit and earned hand.
 *
 * A step that carries `fitBareForecast` has its difficulty fitted, once, when it is
 * entered, so the bare (no-card) chance the Stage opens on is that target for this
 * mortal — the Apotheosis is always in doubt, and the god's hand always matters. A
 * step that carries `dealEarned: 'apotheosis'` deals extra cards for the First's
 * chapters the god paid into. Both are stored on the action (`climaxFit`) and read
 * by every derivation of the step through `resolveStepDefinition`, so the hand the
 * Stage shows, the forecast and the roll all read one value (Law 18, NFP #7).
 *
 * Pure and rng-free: the fit is a bisection over the same forecast the Stage and
 * the roll use (`computeBaseStepForecast` → `scaledStepProbability`); nothing here
 * draws from a stream or a marble bag.
 *
 * Fail-soft (NFP #4): a missing template, step or actor leaves the action as it
 * is; a fit that cannot bracket its target keeps the authored difficulty.
 */

import type { GameState } from '../types/gameState';
import type { ChapterRecord } from '../types/chapterRecord';
import type {
  ActionStep,
  ClimaxStepFit,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import {
  APOTHEOSIS_EARNED_SLOTS_MAX,
  APOTHEOSIS_PAID_CHAPTERS_PER_SLOT,
  FIT_ITERATIONS,
  NUDGE_ESSENCE_COST_SCALE,
} from '../data/nudge-constants';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { actionGodPaid, resolveStepDefinition } from './unifiedActionLifecycle';
import { computeBaseStepForecast } from './views/stage/baseStepForecast';
import { collectHeldTraitIds, resolveTraitVariants } from './encounters/nudges';
import { composeDealtStepFromState } from './encounters/dealHand';
import { fitDifficultyToForecast } from './scaledForecast';
import { emitTrace } from './traceBuffer';
import { APOTHEOSIS_ENCOUNTER_TEMPLATE_ID } from '../data/aspect-content';
import type { ThreadEdgeProperties } from '../types/influence';

/** Does this step ask for a stored climax fit? */
export function stepWantsClimaxFit(step: Pick<ActionStep, 'fitBareForecast' | 'dealEarned'> | undefined): boolean {
  return !!step && (step.fitBareForecast !== undefined || step.dealEarned !== undefined);
}

/**
 * The First's paid chapters → earned cards: one per `APOTHEOSIS_PAID_CHAPTERS_PER_SLOT`
 * archived chapters of `actorId` in which the god committed a card, capped at
 * `APOTHEOSIS_EARNED_SLOTS_MAX`. Records from before `godPaid` existed read as unpaid.
 */
export function apotheosisEarnedSlots(
  archive: readonly Pick<ChapterRecord, 'actorId' | 'godPaid' | 'resolved'>[] | undefined,
  actorId: string,
): number {
  if (!archive || !actorId) return 0;
  let paid = 0;
  for (const record of archive) {
    if (record.actorId === actorId && record.resolved !== false && record.godPaid === true) paid++;
  }
  const perSlot = Math.max(1, APOTHEOSIS_PAID_CHAPTERS_PER_SLOT);
  return Math.max(0, Math.min(APOTHEOSIS_EARNED_SLOTS_MAX, Math.floor(paid / perSlot)));
}

/**
 * Fit the action's current step, or `undefined` when it asks for none. Reads the
 * authored step (no stored fit), so a re-fit never compounds on itself.
 */
export function computeClimaxFit(
  state: GameState,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
): ClimaxStepFit | undefined {
  const stepIndex = action.currentStep;
  const step = resolveStepDefinition(template, stepIndex, action.choiceHistory);
  if (!stepWantsClimaxFit(step)) return undefined;

  const earnedSlots = step.dealEarned === 'apotheosis' && step.deal
    ? apotheosisEarnedSlots(state.chapterArchive, action.actorId)
    : 0;

  let fittedDifficulty = step.difficulty;
  let bareChance = Number.NaN;
  let fitted = false;
  if (step.fitBareForecast !== undefined) {
    try {
      const variants = resolveTraitVariants(template, collectHeldTraitIds(state.graph, action.actorId));
      const parts = computeBaseStepForecast(state.graph, state, action, template, step, variants);
      // The variant delta rides on top of the step's difficulty in the forecast and
      // the roll, so the fit solves for the effective difficulty and stores the base.
      const variantDelta = parts.effectiveDifficulty - Math.max(0, Math.min(1, step.difficulty));
      const fit = fitDifficultyToForecast(parts.capability, step.fitBareForecast, {
        scale: parts.forecastScale,
        actionModifiers: parts.forecastInput.actionModifiers ?? 0,
        fallbackDifficulty: parts.effectiveDifficulty,
        iterations: FIT_ITERATIONS,
      });
      bareChance = fit.bareChance;
      fitted = fit.fitted;
      if (fit.fitted) fittedDifficulty = Math.max(0, Math.min(1, fit.difficulty - variantDelta));
    } catch {
      fitted = false;
      fittedDifficulty = step.difficulty;
    }
  }

  return { stepIndex, fittedDifficulty, bareChance, fitted, earnedSlots };
}

/** The Apotheosis's hand on entry, for the `apotheosis.hand_built` trace. */
function traceHandBuilt(
  state: GameState,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  fit: ClimaxStepFit,
): void {
  try {
    const step = resolveStepDefinition(template, fit.stepIndex, action.choiceHistory, fit);
    const authored = step.nudges?.length ?? 0;
    const composed = composeDealtStepFromState(step, state).step.nudges ?? [];
    const dealtTotal = Math.max(0, composed.length - authored);
    // The step's deal count already carries the earned slots; whatever the dealer
    // could fill past the authored base request is the earned part.
    const baseRequest = step.deal ? Math.max(0, step.deal.count - fit.earnedSlots) : 0;
    const earned = Math.min(fit.earnedSlots, Math.max(0, dealtTotal - baseRequest));
    const pool = (state.essencePool ?? {}) as Readonly<Record<string, number>>;
    const primary = state.ascendantIdentity?.sphereAlignment?.primary;
    // A coarse "could pay for it": its own sphere's pool (or the primary's, for a
    // sphere-less card) covers its scaled price. The Stage's own gate is richer.
    const payable = composed.filter((n) => {
      const sphere = n.sphere ?? primary;
      const have = sphere ? (pool[sphere] ?? 0) : 0;
      return have >= n.essenceCost * NUDGE_ESSENCE_COST_SCALE;
    }).length;
    emitTrace({
      category: 'apotheosis.hand_built',
      tick: state.tick,
      agentId: action.actorId,
      actorId: action.actorId,
      actionId: action.actionId,
      stepIndex: fit.stepIndex,
      authored,
      dealt: dealtTotal - earned,
      earned,
      payable,
      fittedDifficulty: fit.fittedDifficulty,
      bareChance: fit.bareChance,
      fitted: fit.fitted,
      summary: `apotheosis.hand_built: ${action.actorId} step ${fit.stepIndex} — ${authored} authored + ${dealtTotal - earned} dealt + ${earned} earned; bare ${Number.isFinite(fit.bareChance) ? fit.bareChance.toFixed(2) : 'n/a'}`,
    });
  } catch {
    // A trace that cannot be built is skipped, never thrown (NFP #4).
  }
}

/**
 * Store a fit on every live action whose current step asks for one and has none
 * for that step yet. Returns the same array when nothing changed. Called by the
 * orchestrator after the step-advancing phase and after encounter seeding, so a
 * climax step carries its fit before it is posted and held.
 */
export function ensureClimaxFits(
  state: GameState,
  templates?: readonly UnifiedActionTemplate[],
): readonly UnifiedAction[] {
  const actions = state.unifiedActions ?? [];
  let changed = false;
  const next = actions.map((action) => {
    if (action.resolved) return action;
    if (action.climaxFit?.stepIndex === action.currentStep) return action;
    try {
      const template = templates?.find((t) => t.id === action.templateId) ?? getUnifiedTemplateById(action.templateId);
      if (!template) return action;
      const fit = computeClimaxFit(state, action, template);
      if (!fit) return action;
      changed = true;
      const updated = { ...action, climaxFit: fit };
      traceHandBuilt(state, updated, template, fit);
      return updated;
    } catch {
      return action;
    }
  });
  return changed ? next : actions;
}


/**
 * THR-2227 — write a finished Apotheosis onto the mortal's thread edge
 * (`apotheosisBand`, `apotheosisGodPaid`), once per action. Mutates the edge in
 * place (the graph is mutated in place); returns true when anything was written so
 * the caller can touch the world. Fail-soft: a missing edge writes nothing.
 */
export function recordApotheosisResults(state: GameState): boolean {
  let wrote = false;
  for (const action of state.unifiedActions ?? []) {
    if (!action.resolved || !action.outcome || action.templateId !== APOTHEOSIS_ENCOUNTER_TEMPLATE_ID) continue;
    try {
      const edge = state.graph.getIncomingEdges(action.actorId, 'thread')
        .find((e) => e.source === state.ascendantId);
      if (!edge) continue;
      const props = edge.properties as unknown as ThreadEdgeProperties;
      if (props.apotheosisResultActionId === action.actionId) continue;
      props.apotheosisBand = action.outcome;
      props.apotheosisGodPaid = actionGodPaid(action);
      props.apotheosisResultActionId = action.actionId;
      wrote = true;
    } catch {
      // NFP #4 — an unreadable edge is skipped.
    }
  }
  return wrote;
}
