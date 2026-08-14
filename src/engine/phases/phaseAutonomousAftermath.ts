/**
 * Phase: autonomous_aftermath (THR-530).
 *
 * The tick-loop caller for the autonomous in-encounter chooser. Today only the
 * player (and threaded/avatar agents, via encounter notifications) resolves
 * aftermath; ordinary non-hero agents resolve their encounter steps mechanically
 * and their authored aftermath reactions are then **never applied** — the world
 * shaping those reactions describe (intelligence, artifacts, reputation, seeds)
 * silently never happens. This phase closes that gap: each tick it finds resolved
 * encounters belonging to non-player, non-threaded agents, asks the profile-aligned
 * chooser which authored reaction the agent would take *in character*, applies it,
 * and (when the choice carries a clear moral lean) nudges the agent's drift the way
 * their choice points — so their choices visibly shape who they are becoming.
 *
 * ─── Slot (verify-the-noun) ─────────────────────────────────────────────────────
 * `post-resolution`: runs after `phaseUnifiedActionProgress` has assembled
 * `aftermathSummary` on resolved actions, and before the decay / threshold-emergence
 * phases (`post-economy`), so any drift this phase applies is visible to the
 * personality-trait-emergence phase the same tick.
 *
 * ─── Idempotency ────────────────────────────────────────────────────────────────
 * Non-hero agents receive no `encounterNotification` to mark resolved, so the CLI's
 * notification-based dedup does not apply here. Instead the resolved action is
 * flagged `autonomousAftermathApplied` once consumed — the scan skips flagged
 * actions on later ticks until the action is pruned by cleanup.
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────────────────
 * Candidate order is a stable sort (oldest startTick first, actionId tie-break);
 * the chooser is pure-deterministic; no PRNG. `PERSONALITY_AUTONOMOUS_AFTERMATH_MAX_PER_TICK`
 * bounds work per tick (the remainder carry to the next tick).
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────────────────
 * | Failure case                          | Fallback                              |
 * |---------------------------------------|---------------------------------------|
 * | No runtime in PhaseContext            | No-op (aftermath application needs it) |
 * | Agent missing axiologicalProfile      | Apply authored reactions[0] (no align) |
 * | No reaction carries a moral signal    | Apply authored reactions[0]            |
 * | applyEncounterAftermathReaction throws| Caught by runRegisteredPhases; skipped |
 */
import type { GameState } from '../../types/gameState';
import type { ActionStep, UnifiedAction } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import type { TraceEntry } from '../../types/trace';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { dispatchNudgeCommitments } from '../encounters/nudgeDispatch';
import { computeAxisLeans, chooseAlignedReaction } from '../encounters/reactionChooser';
import { reachToAxisId } from '../../types/axisRegistry';
import { applyDriftMagnitude } from '../encounters/driftAccumulator';
import { getThreadedAgents, getAvatarsOf } from '../graphQueries';
import { emitTrace } from '../traceBuffer';
import { touchWorld, touchStructure } from '../simulationRuntime';
import {
  PERSONALITY_REACTION_WEIGHT,
  PERSONALITY_REACTION_DRIFT_DELTA,
  PERSONALITY_AUTONOMOUS_AFTERMATH_MAX_PER_TICK,
} from '../../data/agent-behavior-constants';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

/**
 * The step whose nudge hand the action committed to (THR-885).
 *
 * `activeNudges` names cards on the action's *current* step, so the grants must be
 * read off that same step — reading step 0, or the template's whole nudge pool,
 * would dispatch cards the player never committed.
 *
 * Fail-soft: a retired template, a step index past the end, or a branch node
 * (which carries no nudges) all yield undefined and dispatch nothing.
 */
function templateStep(action: UnifiedAction): Pick<ActionStep, 'nudges'> | undefined {
  const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === action.templateId);
  const step = template?.steps?.[action.currentStep];
  if (!step || isActionStepBranch(step)) return undefined;
  return step;
}

/** Lazy reach-by-templateId index (templates are static; built once). */
let _templateReachById: Map<string, ReachDomain> | null = null;
function templateReach(templateId: string): ReachDomain | undefined {
  if (!_templateReachById) {
    _templateReachById = new Map(UNIFIED_ACTION_TEMPLATES.map((t) => [t.id, t.reach]));
  }
  return _templateReachById.get(templateId);
}

/** Set of agent ids the player holds a thread to, or that are the ascendant's avatars. */
function buildHeroSet(state: GameState): ReadonlySet<string> {
  const ids = new Set<string>();
  if (state.ascendantId) {
    for (const node of getThreadedAgents(state.graph, state.ascendantId)) ids.add(node.id);
    for (const node of getAvatarsOf(state.graph, state.ascendantId)) ids.add(node.id);
  }
  return ids;
}

/**
 * Mark a single action's aftermath as autonomously applied (idempotency).
 *
 * Records the tick alongside the flag (THR-1112) so the manual paths — CLI
 * `aftermath pick`, the debug bridge — can refuse a second application *and* name
 * when this phase already ran it. The flag alone was enough for this phase's own
 * re-scan; it was not enough for anyone downstream to explain the refusal.
 */
function markApplied(
  actions: readonly UnifiedAction[],
  actionId: string,
  tick: number,
): UnifiedAction[] {
  return actions.map((a) =>
    a.actionId === actionId
      ? { ...a, autonomousAftermathApplied: true, autonomousAftermathAppliedTick: tick }
      : a,
  );
}

export function processAutonomousAftermath(state: GameState, ctx: PhaseContext): PhaseResult {
  const runtime = ctx.runtime;
  if (!runtime) return {}; // aftermath application requires a runtime — no-op without one.

  const heroes = buildHeroSet(state);

  // Candidate actions: resolved, with authored reactions, not yet auto-applied, owned by a non-hero.
  const candidates = state.unifiedActions
    .filter(
      (a) =>
        a.resolved &&
        !a.autonomousAftermathApplied &&
        (a.aftermathSummary?.reactions?.length ?? 0) > 0 &&
        !heroes.has(a.actorId),
    )
    .sort((l, r) => (l.startTick !== r.startTick ? l.startTick - r.startTick : l.actionId.localeCompare(r.actionId)));

  if (candidates.length === 0) return {};

  let s = state;
  let applied = 0;

  for (const action of candidates) {
    if (applied >= PERSONALITY_AUTONOMOUS_AFTERMATH_MAX_PER_TICK) break;

    const reactions = action.aftermathSummary!.reactions!;
    const agentId = action.actorId;
    const primaryReach = templateReach(action.templateId);

    const leans = computeAxisLeans(s.graph, s.archetypeDrift, agentId);
    const choice = leans
      ? chooseAlignedReaction(reactions, leans, primaryReach, PERSONALITY_REACTION_WEIGHT)
      : null;
    const reaction = choice?.aligned ? choice.reaction : reactions[0];
    const chosenIndex = choice?.aligned ? choice.chosenIndex : 0;

    emitTrace({
      tick: s.tick,
      category: 'reaction_selected',
      agentId,
      encounterId: action.templateId,
      actionId: action.actionId,
      reactionId: reaction.id,
      chosenIndex,
      optionCount: reactions.length,
      aligned: Boolean(choice?.aligned),
      hadProfile: leans !== null,
      scores: choice?.scores ?? [],
      summary: `reaction_selected: ${agentId} → ${reaction.id} [${chosenIndex}/${reactions.length}] (${choice?.aligned ? 'aligned' : 'default'})`,
    } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);

    const { state: next, mutationSummary } = applyEncounterAftermathReaction(
      s,
      action,
      reaction,
      s.tick,
      runtime,
    );

    // Choices push leanings (THR-528 applicator): nudge drift toward the chosen pole.
    let nextDrift = next.archetypeDrift;
    if (choice?.aligned && choice.dominant && PERSONALITY_REACTION_DRIFT_DELTA > 0) {
      const signed =
        choice.dominant.pole === 'virtue'
          ? PERSONALITY_REACTION_DRIFT_DELTA
          : -PERSONALITY_REACTION_DRIFT_DELTA;
      const driftResult = applyDriftMagnitude(nextDrift, agentId, reachToAxisId(choice.dominant.reach), signed, s.tick);
      nextDrift = driftResult.drift;
      for (const driftTrace of driftResult.traces) {
        emitTrace({
          ...driftTrace,
          summary: `Drift threshold ${driftTrace.thresholdCrossed}: ${driftTrace.axisId} ${driftTrace.fromPosition.toFixed(2)} → ${driftTrace.toPosition.toFixed(2)} (${driftTrace.pole})`,
        } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
      }
    }

    s = {
      ...next,
      archetypeDrift: nextDrift,
      unifiedActions: markApplied(next.unifiedActions, action.actionId, s.tick),
    };

    if (mutationSummary.touchedStructure) touchStructure(runtime);
    else if (mutationSummary.touchedWorld) touchWorld(runtime);

    // THR-885 — the god's committed cards pay their non-essence costs and make
    // their world changes here, after the encounter's own aftermath, so a card's
    // grant lands on the world the encounter left behind rather than the one it
    // started from. A hand of plain forecast cards (the common case) returns the
    // state unchanged and costs one Map build.
    const committedStep = templateStep(action);
    if (committedStep && action.activeNudges?.length) {
      const dispatched = dispatchNudgeCommitments(
        s, action, committedStep, action.activeNudges, s.tick, runtime,
      );
      s = dispatched.state;
      if (dispatched.mutationSummary.touchedStructure) touchStructure(runtime);
      else if (dispatched.mutationSummary.touchedWorld) touchWorld(runtime);
    }

    applied += 1;
  }

  if (applied === 0) return {};
  return { ...s };
}

export const autonomousAftermathPhase: EnginePhase = {
  id: 'autonomous_aftermath',
  slot: 'post-resolution',
  label: 'Autonomous In-Encounter Choice',
  run: (state, ctx) => processAutonomousAftermath(state, ctx),
};
