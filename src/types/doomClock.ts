/** The 7 doom clock archetypes */
export type DoomClockArchetype =
  | 'breach'       // outside force breaking through reality
  | 'convergence'  // all forces drawn to a single point
  | 'changing'     // new cosmic order replacing the old
  | 'sundering'    // world itself breaking apart
  | 'failing'      // core force of creation weakening
  | 'ascension'    // something approaching godhood
  | 'reckoning';   // past debts coming due

export const DOOM_CLOCK_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering',
  'failing', 'ascension', 'reckoning',
];

/** 5-stage escalation (each archetype names them thematically) */
export const DOOM_STAGE_NAMES = [
  'Whispers', 'Signs', 'Tremors', 'Crisis', 'Culmination',
] as const;

/** An event fired at a doom clock stage transition */
export interface DoomEscalationEvent {
  id: string;
  description: string;
  /** Graph mutations to apply when this event fires */
  narrativeHook: string;
  /** Sphere this event is flavored by */
  sphere?: string;
}

/** A single escalation stage */
export interface DoomClockStage {
  stage: number;              // 1-5
  name: string;               // thematic name per archetype
  tickThreshold: number;      // 0.0-1.0 fraction of total ticks
  events: DoomEscalationEvent[];
}

/** Full doom clock definition for a run */
export interface DoomClockDefinition {
  archetype: DoomClockArchetype;
  totalTicks: number;         // total run length in ticks
  stages: [DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage];
}

/** Runtime doom clock state */
export interface DoomClockState {
  definitionArchetype: DoomClockArchetype;
  currentTick: number;
  totalTicks: number;
  currentStage: number;       // 1-5
  progress: number;           // 0.0-1.0 overall progress
  stageTransitions: number[]; // ticks at which each stage was entered
  expired: boolean;
  /** Accumulated acceleration/deceleration from player/rival actions */
  tickModifier: number;       // added to currentTick each real tick (default 1.0)
}
