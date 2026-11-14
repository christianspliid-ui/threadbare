/**
 * THR-2211 — the forecast of a step before any card, in one place.
 *
 * Lifted out of `buildNudgePhaseModel` so the Stage and the step poster
 * (`encounterVisibility`'s Fated fuse) read the **same call** (Law 18: the odds
 * the player is shown are the odds the dice use). The Stage keeps every
 * intermediate it already used — capability, standing, the carryover line, the
 * fight inputs — so nothing about the rendered phase changes; the poster only
 * wants the tier.
 *
 * Pure: reads the graph and the state, spends nothing, draws nothing.
 */
import type { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { ResolutionInput } from '../../../types/resolution';
import type { ForecastTier } from '../../../types/traces/encounter-traces';
import type {
  ActionStep,
  StepCastRecord,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightStepInputs } from '../../../types/fight';
import { computeCapability } from '../../domainCapability';
import { computeResolutionModifiers } from '../../resolutionModifiers';
import { forecastActionAtScale, type ScaledForecast } from '../../scaledForecast';
import { resolveFightStepInputs } from '../../fights/fightStepInputs';
import { stepCastFor } from '../../unifiedActionResolution';
import { resolveStepDefinition } from '../../unifiedActionLifecycle';
import { FIGHT_ENCOUNTER_TYPE } from '../../../data/fight-constants';
import {
  collectHeldTraitIds,
  collectNudgeModifiers,
  priorStepOutcome,
  resolveCarryoverLine,
  resolveTraitVariants,
  sumModifiers,
  sumVariantDifficultyDelta,
} from '../../encounters/nudges';

type TraitVariants = ReturnType<typeof resolveTraitVariants>;

/** Everything the base forecast is built from, for the Stage's factor lines. */
export interface BaseStepForecastParts {
  stepCast: StepCastRecord | undefined;
  fightInputs: FightStepInputs | undefined;
  stepReach: ActionStep['reach'];
  capability: number;
  standing: ReturnType<typeof computeResolutionModifiers>;
  carryover: ReturnType<typeof resolveCarryoverLine>;
  traitModifierTotal: number;
  effectiveDifficulty: number;
  forecastInput: ResolutionInput;
  forecastScale: NonNullable<UnifiedActionTemplate['scale']>;
  baseSummary: ScaledForecast;
}

/**
 * THR-1543 — a fight step's inputs for the forecast, derived by the same pure
 * function the roll uses (fight block §3b). Undefined for an ordinary step, or
 * when there is no game state to read the opponent from (fail-soft: the step
 * then forecasts as an ordinary one, exactly as before FB7).
 */
export function fightInputsForForecast(
  gameState: GameState | undefined,
  activeAction: UnifiedAction,
  step: ActionStep,
  template: UnifiedActionTemplate,
  stepCast?: StepCastRecord,
): FightStepInputs | undefined {
  if (!step.fightRole || !gameState) return undefined;
  try {
    return resolveFightStepInputs(gameState, activeAction, step, template, stepCast);
  } catch {
    return undefined;
  }
}

/**
 * The base forecast and its parts. Moved verbatim from `buildNudgePhaseModel`
 * (THR-1535 / THR-1543 / THR-1670 / THR-892 comments live with the code below).
 */
export function computeBaseStepForecast(
  graph: WorldGraph,
  gameState: GameState | undefined,
  activeAction: UnifiedAction,
  template: UnifiedActionTemplate,
  step: ActionStep,
  variants: TraitVariants,
): BaseStepForecastParts {
  const actorId = activeAction.actorId;
  // THR-1670 — the step cast: the record the roll wrote, or the same pure decision
  // it will make (the decision reads no card, so toggling cards never changes it).
  let stepCast: StepCastRecord | undefined;
  try {
    stepCast = gameState ? stepCastFor(activeAction, template, gameState, step) : undefined;
  } catch {
    stepCast = undefined;
  }
  const fightInputs = fightInputsForForecast(gameState, activeAction, step, template, stepCast);
  const stepReach = fightInputs?.reach ?? step.reach;
  const capability = computeCapability(graph, actorId, stepReach);
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  const locationId = locEdges.length > 0 ? locEdges[0].target : '';
  const standing = fightInputs
    ? computeResolutionModifiers(
      graph,
      actorId,
      locationId,
      stepReach,
      template.sphereAffinity,
      gameState?.effectStates,
      undefined,
      FIGHT_ENCOUNTER_TYPE,
      stepCast,
    )
    : computeResolutionModifiers(
      graph,
      actorId,
      locationId,
      step.reach,
      template.sphereAffinity,
      // THR-1535 — the live effect states, as the roll reads them, so a timed
      // effect moves the shown odds exactly as it moves the dice.
      gameState?.effectStates,
      undefined,
      undefined,
      stepCast,
    );
  // THR-892 — the carryover line the prior step's band earned, if the author wrote
  // one. It contributes to the floor exactly as a trait variant does.
  const carryover = resolveCarryoverLine(step, priorStepOutcome(activeAction));
  const traitModifierTotal = sumModifiers(
    collectNudgeModifiers(step, undefined, variants, priorStepOutcome(activeAction)),
  );
  const variantDifficultyDelta = sumVariantDifficultyDelta(variants);
  const effectiveDifficulty = Math.max(
    0, Math.min(1, (fightInputs?.difficulty ?? step.difficulty) + variantDifficultyDelta),
  );

  const forecastInput: ResolutionInput = {
    actorId,
    domain: stepReach,
    capability,
    difficulty: effectiveDifficulty,
    sphereFactor: 0,
    // A fight step's standing modifiers already ride inside its named terms.
    actionModifiers: (fightInputs ? fightInputs.modifierTotal : standing.totalModifier) + traitModifierTotal,
    // `collectTestShapers` returns `ResolvedTestShaper` (attachment-centric
    // field names) while `ResolutionInput` wants `ResolutionTestShaper`. The
    // mapping is explicit rather than cast so a rename breaks here loudly.
    testShapers: (standing.testShapers ?? []).map((shaper) => ({
      sourceAttachmentId: shaper.attachmentId,
      sourceAttachmentName: shaper.attachmentName,
      trigger: shaper.trigger,
      steps: shaper.steps,
      maxMargin: shaper.maxMargin,
    })),
  };

  // THR-1543 / THR-1535 (addendum) — every step forecasts at the scale it rolls
  // at, with the core's scale step and post-roll floor (a `local` step never rolls
  // below 0.65). `undefined` resolves as `'regional'` in the core, so it is
  // spelled out here.
  const forecastScale = fightInputs?.scale ?? template.scale ?? 'regional';
  const baseSummary = forecastActionAtScale(forecastInput, forecastScale);

  return {
    stepCast,
    fightInputs,
    stepReach,
    capability,
    standing,
    carryover,
    traitModifierTotal,
    effectiveDifficulty,
    forecastInput,
    forecastScale,
    baseSummary,
  };
}

/**
 * The tier of a step's forecast before any card — the tier the Stage opens on.
 * `undefined` on any failure (fail-soft: no fuse, the step stops as today).
 */
export function baseStepForecastTier(
  graph: WorldGraph,
  gameState: GameState | undefined,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  stepIndex: number,
): ForecastTier | undefined {
  try {
    const step = resolveStepDefinition(template, stepIndex, action.choiceHistory);
    if (!step) return undefined;
    const atStep = action.currentStep === stepIndex ? action : { ...action, currentStep: stepIndex };
    const variants = resolveTraitVariants(template, collectHeldTraitIds(graph, action.actorId));
    return computeBaseStepForecast(graph, gameState, atStep, template, step, variants).baseSummary.forecastTier;
  } catch {
    return undefined;
  }
}
