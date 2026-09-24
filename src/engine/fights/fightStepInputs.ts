/**
 * One function derives a fight step's inputs, for the roll and for the forecast
 * (THR-1537, plan doc `Docs/plans/2026-09-23-fight-block.md` §3–3b).
 *
 * A fight step is an ordinary step carrying `fightRole`. It differs from any other
 * step in exactly four inputs, and all four are decided here:
 *
 *  - **reach** — authored, then the card's override (a beast that must be read
 *    rather than struck), then the fighter's own `encounter_reach_override`. The
 *    swap is read *before* capability, which is the ordering the legacy road gets
 *    wrong (THR-1530 found it at `encounter.ts:402/409`).
 *  - **difficulty** — the card's Dread (nerve) or Might (clash), plus the
 *    opponent's own passive/conditional modifiers for that reach, so a monster's
 *    powers and gear price the step (THR-1530 §5).
 *  - **scale** — always `FIGHT_STEP_SCALE`. At `local` the 0.65 floor erases a
 *    monster's Might (THR-1531).
 *  - **modifiers** — the fighter's standing modifiers (items, conditions, the
 *    effect modifier family) as one named term, read in a **combat** context so
 *    an `in_combat` charm works on a clash the card moved to Eye. Ordinary steps
 *    read theirs through `computeStandingModifierTotal` (THR-1535). A fight step
 *    keeps this read because it differs in two ways that matter — the combat
 *    predicate context, and the reach swap applied before it — and the roll skips
 *    the ordinary read on fight steps, so every step is read exactly once.
 *
 * **Pure.** The attended forecast calls this from the UI (FB7), so it writes
 * nothing: no spend, no node write. Reading it ten times is reading it once.
 */

import type { GameState } from '../../types/gameState';
import type {
  ActionScale,
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type {
  FightNamedModifier,
  FightOpponentStatus,
  FightRole,
  FightStepInputs,
} from '../../types/fight';
import {
  FIGHT_BERSERK_MIGHT_DELTA,
  FIGHT_COURAGE_MODIFIER_NAME,
  FIGHT_ENCOUNTER_TYPE,
  FIGHT_MOMENTUM_MODIFIER_NAME,
  FIGHT_NERVE_COURAGE_WEIGHT,
  FIGHT_RATING_DIFFICULTY,
  FIGHT_STANDING_MODIFIER_NAME,
  FIGHT_STEP_SCALE,
} from '../../data/fight-constants';
import { resolveOpposedCastNodeId } from '../encounters/nudges';
import { isAgentGone } from '../groups/groupQueries';
import { buildPredicateContext, hasEffectsFormat, resolveEffectModifiers } from '../effectResolver';
import { computeResolutionModifiers } from '../resolutionModifiers';
import { readReachOverride } from '../effects/ruleOverrideConsumers';
import { resolveStepDefinition } from '../unifiedActionLifecycle';
import { readLiveAxisLean } from '../encounters/branchDecision';
import { defaultOpponentCard, readOpponentCard } from './opponentCard';
import { fightAdvantageModifiers, readFightAdvantages } from './fightAdvantages';

/**
 * A step's fight role, or undefined for an ordinary step. `difficultyContext:
 * 'opponent_rated'` without a role resolves as a clash — the context is what
 * `fightRole` implies, so carrying it alone asks for the same pricing.
 */
export function fightRoleOf(step: Pick<ActionStep, 'fightRole' | 'difficultyContext'> | undefined): FightRole | undefined {
  if (!step) return undefined;
  if (step.fightRole) return step.fightRole;
  return step.difficultyContext === 'opponent_rated' ? 'clash' : undefined;
}

/** The scale a step resolves at: `FIGHT_STEP_SCALE` for a fight step, the template's otherwise. */
export function stepScaleFor(
  template: Pick<UnifiedActionTemplate, 'scale'>,
  step: Pick<ActionStep, 'fightRole' | 'difficultyContext'> | undefined,
): ActionScale | undefined {
  return fightRoleOf(step) ? FIGHT_STEP_SCALE : template.scale;
}

/**
 * Whether the action's current step is a fight step. Band opposition reads it to
 * leave fight steps alone (plan doc § Substrate inventory): a fight is between its
 * fighter and its opponent, never a company contest.
 */
export function isActionOnFightStep(
  action: Pick<UnifiedAction, 'currentStep' | 'choiceHistory'>,
  template: UnifiedActionTemplate | undefined,
): boolean {
  if (!template) return false;
  try {
    return fightRoleOf(resolveStepDefinition(template, action.currentStep, action.choiceHistory)) !== undefined;
  } catch {
    return false;
  }
}

/**
 * Who this step fights (plan doc §1). An `opponentRef` must bind — it never falls
 * back to the target. Only a step without one fights the action's target.
 */
export function resolveFightOpponent(
  state: Pick<GameState, 'graph'>,
  action: Pick<UnifiedAction, 'actorId' | 'targetId' | 'supportBindings'>,
  step: Pick<ActionStep, 'opponentRef'>,
): { opponentId: string | null; status: FightOpponentStatus } {
  const opponentId = step.opponentRef
    ? resolveOpposedCastNodeId(step.opponentRef, action.supportBindings) ?? null
    : action.targetId || null;
  if (!opponentId) return { opponentId: null, status: 'unbound' };
  const node = state.graph.getNode(opponentId);
  if (!node) return { opponentId, status: 'unbound' };
  if (opponentId === action.actorId) return { opponentId, status: 'self' };
  if (isAgentGone(node)) return { opponentId, status: 'deceased' };
  return { opponentId, status: 'bound' };
}

/**
 * THR-1543 (plan doc §12) — the complication pool's view of a fight step: who the
 * fight is against, and whether that is a monster (it carries `monsterState`) or a
 * mortal. Scopes the pool to `inFight` events and fills `{opponent}`.
 */
export function fightComplicationScope(
  state: Pick<GameState, 'graph'>,
  action: Pick<UnifiedAction, 'actorId' | 'targetId' | 'supportBindings' | 'fightState'>,
  step: Pick<ActionStep, 'opponentRef' | 'fightComplications'>,
): NonNullable<import('../../types/complication').ComplicationContext['fight']> {
  const opponentId = action.fightState?.opponentId ?? (() => {
    const found = resolveFightOpponent(state, action, step);
    return found.status === 'bound' ? found.opponentId : null;
  })();
  const bag = opponentId ? state.graph.getNode(opponentId)?.properties.monsterState : undefined;
  return {
    opponentId,
    opponentKind: bag && typeof bag === 'object' ? 'monster' : 'mortal',
    ...(step.fightComplications?.length ? { authored: step.fightComplications } : {}),
  };
}

/**
 * Derive a fight step's inputs. Returns undefined for a step with no fight role.
 *
 * Until FB2 (THR-1538) routes a missing opponent through the no-roll end, an
 * opponent that is not `bound` fights as `FIGHT_DEFAULT_CARD` (fail-soft), and
 * `opponentStatus` records why.
 */
export function resolveFightStepInputs(
  state: GameState,
  action: UnifiedAction,
  step: ActionStep,
  template: Pick<UnifiedActionTemplate, 'sphereAffinity'>,
): FightStepInputs | undefined {
  const role = fightRoleOf(step);
  if (!role) return undefined;
  const graph = state.graph;

  const { opponentId, status } = resolveFightOpponent(state, action, step);
  const card = status === 'bound'
    ? readOpponentCard(graph, opponentId, state.tick)
    : defaultOpponentCard(null);

  // Reach: authored → card → the fighter's own swap, read before capability.
  const authoredReach = step.reach;
  let reach = (role === 'nerve' ? card.nerveReach : card.clashReach) ?? authoredReach;
  const swap = readReachOverride(
    { graph, effectStates: state.effectStates, persisted: state, tick: state.tick },
    action.actorId,
    'fightStepInputs',
  );
  if (swap && swap.from === reach) reach = swap.to;

  // Difficulty: the card's word, then the opponent's own modifiers for this reach.
  const baseDifficulty = FIGHT_RATING_DIFFICULTY[role === 'nerve' ? card.dread : card.might];
  let opponentModifierDelta = 0;
  // THR-1556 (duels plan doc §2): in a duel the opponent rolls for itself, so its
  // own modifiers ride *its* roll. Pricing them into this step as well would count
  // them twice — the kill criterion's first named cause.
  const duel = step.fightMode === 'agent' && card.source !== 'monsterState';
  if (!duel && status === 'bound' && opponentId && hasEffectsFormat(graph, opponentId)) {
    const opponentCtx = buildPredicateContext(graph, opponentId, reach, FIGHT_ENCOUNTER_TYPE);
    opponentModifierDelta = resolveEffectModifiers(
      graph, opponentId, reach, opponentCtx, state.effectStates,
    ).reachModifiers[reach] ?? 0;
  }
  // FB3: a berserk opponent hits harder on every clash after it turns (FB4 sets it).
  const berserkDelta = role === 'clash' && action.fightState?.berserk ? FIGHT_BERSERK_MIGHT_DELTA : 0;
  const difficulty = Math.max(0, Math.min(1, baseDifficulty + opponentModifierDelta + berserkDelta));

  // The fighter's standing modifiers, in a combat context. The swap is already
  // applied above, so no override context is passed: a second read would swap
  // twice.
  const locationEdges = graph.getOutgoingEdges(action.actorId, 'located_at');
  const locationId = locationEdges.length > 0 ? locationEdges[0].target : '';
  const standing = computeResolutionModifiers(
    graph,
    action.actorId,
    locationId,
    reach,
    template.sphereAffinity,
    state.effectStates,
    undefined,
    FIGHT_ENCOUNTER_TYPE,
  );

  const modifiers: FightNamedModifier[] = [];
  if (standing.totalModifier !== 0) {
    modifiers.push({ name: FIGHT_STANDING_MODIFIER_NAME, delta: standing.totalModifier });
  }
  // FB3 (plan doc §7): courage on the nerve step — the fighter's live lean, never
  // a hidden number; then the momentum the last fight step carried forward.
  if (role === 'nerve') {
    const courage = FIGHT_NERVE_COURAGE_WEIGHT * readLiveAxisLean(state, action.actorId, 'courage_prudence');
    if (courage !== 0) modifiers.push({ name: FIGHT_COURAGE_MODIFIER_NAME, delta: courage });
  }
  const momentum = action.fightState?.momentum ?? 0;
  if (momentum !== 0) modifiers.push({ name: FIGHT_MOMENTUM_MODIFIER_NAME, delta: momentum });
  // FB7 (plan doc §11): the advantages the world lent the fighter. Read once at
  // fight start and persisted on `fightState`; before it exists (the nerve step)
  // they are read directly — a pure read, so the forecast spends nothing.
  const advantages = action.fightState?.advantages
    ?? readFightAdvantages(state, action.actorId, status === 'bound' ? opponentId : null);
  modifiers.push(...fightAdvantageModifiers(advantages, role, action.fightState));
  const modifierTotal = modifiers.reduce((sum, m) => sum + m.delta, 0);

  return {
    role,
    opponentId: status === 'bound' ? opponentId : null,
    opponentStatus: status,
    card,
    reach,
    authoredReach,
    difficulty,
    opponentModifierDelta,
    scale: FIGHT_STEP_SCALE,
    modifiers,
    modifierTotal,
    advantages,
  };
}
