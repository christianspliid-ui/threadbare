import type { ActorType } from './graph';

export interface SimulationClock {
  currentTick: number;
  ticksPerSeason: number;      // ~90
  season: number;               // 0-3
  year: number;
}

export interface ActionInProgress {
  actionId: string;             // unique instance ID
  actorId: string;
  templateId: string;           // action template node ID
  targetId: string;             // target node ID
  domain: string;               // which Reach domain
  startTick: number;
  duration: number;             // total ticks to complete
  progress: number;             // current progress (0 to duration)
}

/** AP budgets by actor type (from design doc) */
export const BASE_AP: Record<ActorType, number> = {
  god: 1,
  ascendant: 2,
  faction: 3,
  culture: 2,
  group: 2,
  individual: 1,
};

export type SimulationSpeed = 0 | 1 | 2 | 3 | 5; // 0 = paused

export interface TickResult {
  tick: number;
  completedActions: string[];     // action IDs that resolved this tick
  newSeason: boolean;
}
