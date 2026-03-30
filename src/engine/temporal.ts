/**
 * Temporal Controller — the tick engine.
 *
 * Manages simulation time, advances in-progress actions, fires resolution
 * when actions complete, manages action points, and handles speed controls.
 */
import type { WorldGraph } from './graph';
import type { SimulationClock, ActionInProgress, TickResult } from '../types/temporal';
import type { ActorType } from '../types/graph';
import { BASE_AP } from '../types/temporal';

const TICKS_PER_SEASON = 90;

export class TemporalController {
  private clock: SimulationClock;
  private activeActions = new Map<string, ActionInProgress>(); // actionId → action
  private graph: WorldGraph;

  constructor(graph: WorldGraph) {
    this.graph = graph;
    this.clock = {
      currentTick: 0,
      ticksPerSeason: TICKS_PER_SEASON,
      season: 0,
      year: 0,
    };
  }

  getClock(): SimulationClock {
    return { ...this.clock };
  }

  /**
   * Advance one tick. Returns the tick result including completed action IDs.
   */
  tick(): TickResult {
    this.clock.currentTick++;

    // Check for season change
    const totalSeasons = Math.floor(this.clock.currentTick / TICKS_PER_SEASON);
    const newSeason = totalSeasons % 4;
    const newYear = Math.floor(totalSeasons / 4);
    const seasonChanged = newSeason !== this.clock.season || newYear !== this.clock.year;
    this.clock.season = newSeason;
    this.clock.year = newYear;

    // Advance all active actions
    const completedActions: string[] = [];
    for (const [actionId, action] of this.activeActions) {
      action.progress++;
      if (action.progress >= action.duration) {
        completedActions.push(actionId);
      }
    }

    // Remove completed actions
    for (const actionId of completedActions) {
      this.activeActions.delete(actionId);
    }

    return {
      tick: this.clock.currentTick,
      completedActions,
      newSeason: seasonChanged,
    };
  }

  /**
   * Start a new action for an actor. Validates AP budget.
   */
  startAction(action: ActionInProgress): void {
    const available = this.getAvailableAP(action.actorId);
    if (available <= 0) {
      throw new Error(`No AP available for ${action.actorId} — AP limit reached`);
    }
    this.activeActions.set(action.actionId, { ...action });
  }

  /**
   * Get all active actions for a specific actor.
   */
  getActionsForActor(actorId: string): ActionInProgress[] {
    const result: ActionInProgress[] = [];
    for (const action of this.activeActions.values()) {
      if (action.actorId === actorId) {
        result.push({ ...action });
      }
    }
    return result;
  }

  /**
   * Get available AP for an actor (base AP minus active action count).
   */
  getAvailableAP(actorId: string): number {
    const actorNode = this.graph.getNode(actorId);
    if (!actorNode) throw new Error(`Actor not found: ${actorId}`);

    const actorType = actorNode.properties.actorType as ActorType;
    const baseAP = BASE_AP[actorType] ?? 1;
    const activeCount = this.getActionsForActor(actorId).length;

    return baseAP - activeCount;
  }

  /**
   * Get a specific active action by ID.
   */
  getAction(actionId: string): ActionInProgress | undefined {
    const action = this.activeActions.get(actionId);
    return action ? { ...action } : undefined;
  }
}
