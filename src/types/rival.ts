import type { CosmologyProfile, SphereName } from './index';
import type { AxiologicalProfile } from './agent';

/** Behavioral archetype for rival gods */
export type RivalBehavior =
  | 'aggressive'     // directly opposes player, attacks agents/places of power
  | 'subtle'         // undermines through deception, rarely detected
  | 'territorial'    // claims regions and defends them fiercely
  | 'expansionist';  // spreads influence widely, competes for worshippers

/** Full rival god definition (generated at run start) */
export interface RivalDefinition {
  id: string;
  name: string;
  sphereAlignment: CosmologyProfile;
  behavior: RivalBehavior;
  /** 0.0-1.0 how opposed this rival is to the player's goals */
  oppositionStrength: number;
  description: string;
  /** Generated axiological profile for decision-making */
  axiologicalProfile?: AxiologicalProfile;
  /** Primary and secondary sphere */
  primarySphere?: SphereName;
  secondarySphere?: SphereName;
}

/** Runtime state tracking for a rival god */
export interface RivalState {
  rivalId: string;
  active: boolean;
  interventionCount: number;
  agentsControlled: number;
  regionsInfluenced: string[];
  /** 0.0-1.0 how hostile this rival is toward the player currently */
  hostilityToPlayer: number;
  /** Ticks since last major action */
  ticksSinceAction?: number;
  /** Per-agent awareness 0.0-1.0 — how much attention this rival is paying to each agent */
  agentAwareness?: Partial<Record<string, number>>;
}

/** Rival archetype generation templates */
export type RivalArchetype = RivalBehavior;

// Name fragments for procedural rival naming (moved to data/rival-content.ts)
export { RIVAL_NAME_PREFIXES, RIVAL_NAME_SUFFIXES } from '../data/rival-content';

/** A rival god's chosen action for a tick */
export interface RivalAction {
  type: 'recruit' | 'intervene' | 'expand' | 'attack' | 'wait';
  target?: string;
}
