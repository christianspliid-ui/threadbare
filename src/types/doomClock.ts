import type { SphereName } from './index';

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

export type DoomCardEffectType =
  | 'hex_corruption'
  | 'hex_divine_drain'
  | 'location_unrest'
  | 'prosperity_shock'
  | 'location_pressure'
  | 'agent_pressure';

export type DoomCardTargetKind =
  | 'random_hexes'
  | 'settlements'
  | 'prosperous_settlements'
  | 'all_locations'
  | 'threaded_agents';

/** An event fired at a doom clock stage transition */
export interface DoomEscalationEvent {
  id: string;
  title?: string;
  description: string;
  /** Graph mutations to apply when this event fires */
  narrativeHook: string;
  /** Sphere this event is flavored by */
  sphere?: SphereName;
  /** Card-effect payload for systemic world changes. */
  effectType?: DoomCardEffectType;
  targetKind?: DoomCardTargetKind;
  targetCount?: number;
  magnitude?: number;
  /** Additional flavor shown in UI after the card resolves. */
  effectSummary?: string;
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
  /** Added severity for the next doom escalation, usually from missed mandate checkpoints. */
  nextEscalationSeverityModifier: number;
  /** Counter-omens banked from outperforming mandate checkpoints. */
  counterOmens: number;
  /** History of resolved doom cards for UI/debug visibility. */
  resolvedEvents: DoomResolvedEvent[];
}

export interface DoomResolvedEvent {
  id: string;
  stage: number;
  title: string;
  description: string;
  severity: number;
  resolvedTick: number;
  sphere?: SphereName;
  effectType?: DoomCardEffectType;
  effectSummary?: string;
}
