import type { SphereName } from './index';
import type { ValuePair } from './agent';

// ── Echo Types ──────────────────────────────────────────────────

export const ECHO_TYPES = ['legacy', 'monument', 'relic'] as const;
export type EchoType = typeof ECHO_TYPES[number];

/** How the echo was selected */
export type EchoSource = 'cosmic' | 'divine';

/** Per-cycle degradation amount */
export const ECHO_DEGRADATION_RATE = 0.15;

/** Degradation level at which an echo fades permanently */
export const ECHO_FADE_THRESHOLD = 0.9;

// ── Injection ───────────────────────────────────────────────────

/** How an echo injects content into the next world */
export type InjectionType =
  | 'cultural_template'
  | 'location_feature'
  | 'quest_seed';

export interface EchoInjection {
  injectionType: InjectionType;
  /** Human-readable description of what this echo seeds */
  description: string;
  /** Sphere weight biases to apply during world generation */
  sphereBiases?: Partial<Record<SphereName, number>>;
  /** Trait tendencies to seed in descendant actors/cultures */
  traitTendencies?: ValuePair[];
}

// ── Echo Definition ─────────────────────────────────────────────

/** The full definition of an echo, created at harvest time */
export interface EchoDefinition {
  id: string;
  echoType: EchoType;
  source: EchoSource;
  /** The graph node this echo was derived from */
  originNodeId: string;
  /** Which cycle this echo was created in */
  originCycle: number;
  name: string;
  summary: string;
  sphereAffinities: SphereName[];
  /** 0.0–1.0 how significant the source event/node was */
  significance: number;
  injection: EchoInjection;
}

// ── Echo Runtime State ──────────────────────────────────────────

/** Per-echo state tracked across cycles */
export interface EchoState {
  id: string;
  /** 0.0–1.0 how degraded this echo is */
  degradation: number;
  /** How many cycles this echo has been active */
  cyclesActive: number;
  /** True when degradation >= ECHO_FADE_THRESHOLD */
  faded: boolean;
}
