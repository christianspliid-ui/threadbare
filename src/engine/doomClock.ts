/**
 * Doom Clock Engine — thematic run timer with escalation stages.
 *
 * The doom clock provides time pressure and narrative structure.
 * 7 archetypes each have themed 5-stage escalation tracks.
 */
import type {
  DoomClockArchetype,
  DoomClockDefinition,
  DoomClockStage,
  DoomClockState,
  DoomEscalationEvent,
} from '../types/doomClock';
import { DEFAULT_THRESHOLDS, ARCHETYPE_STAGE_NAMES } from '../data/doom-content';

// ─── Generator ───────────────────────────────────────────────────

export function generateDoomClock(
  archetype: DoomClockArchetype,
  totalTicks: number,
  _seed: number,
): DoomClockDefinition {
  const stageNames = ARCHETYPE_STAGE_NAMES[archetype];

  const stages = DEFAULT_THRESHOLDS.map((threshold, i) => ({
    stage: i + 1,
    name: stageNames[i],
    tickThreshold: threshold,
    events: [{
      id: `doom_${archetype}_stage_${i + 1}`,
      description: `${stageNames[i]} — the ${archetype} intensifies`,
      narrativeHook: `doom_${archetype}_${i + 1}`,
    }] as DoomEscalationEvent[],
  })) as [DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage];

  return {
    archetype,
    totalTicks,
    stages,
  };
}

// ─── State Machine ───────────────────────────────────────────────

export function createDoomClockState(
  archetype: DoomClockArchetype,
  totalTicks: number,
): DoomClockState {
  return {
    definitionArchetype: archetype,
    currentTick: 0,
    totalTicks,
    currentStage: 1,
    progress: 0,
    stageTransitions: [0],
    expired: false,
    tickModifier: 1.0,
  };
}

export function getDoomClockStage(progress: number): number {
  for (let i = 0; i < DEFAULT_THRESHOLDS.length; i++) {
    if (progress < DEFAULT_THRESHOLDS[i]) return i + 1;
  }
  return 5;
}

export function advanceDoomClock(state: DoomClockState): DoomClockState {
  if (state.expired) return state;

  const newTick = state.currentTick + state.tickModifier;
  const clampedTick = Math.min(newTick, state.totalTicks);
  const newProgress = clampedTick / state.totalTicks;
  const newStage = getDoomClockStage(newProgress);
  const expired = clampedTick >= state.totalTicks;

  const transitions = [...state.stageTransitions];
  if (newStage > state.currentStage) {
    transitions.push(clampedTick);
  }

  return {
    ...state,
    currentTick: clampedTick,
    progress: newProgress,
    currentStage: newStage,
    stageTransitions: transitions,
    expired,
  };
}

export function accelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: state.tickModifier + amount,
  };
}

export function decelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: Math.max(0.1, state.tickModifier - amount),
  };
}
