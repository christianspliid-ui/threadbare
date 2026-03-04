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
}

/** Rival archetype generation templates */
export type RivalArchetype = RivalBehavior;

/** Name fragments for procedural rival naming */
export const RIVAL_NAME_PREFIXES = [
  'The Iron', 'The Silent', 'The Burning', 'The Hollow',
  'The Crimson', 'The Pale', 'The Storm', 'The Bone',
  'The Veiled', 'The Shattered', 'The Crowned', 'The Blighted',
] as const;

export const RIVAL_NAME_SUFFIXES = [
  'Judge', 'Weaver', 'Tyrant', 'Prophet',
  'Shepherd', 'Warden', 'Harvester', 'Architect',
  'Wanderer', 'Oracle', 'Sentinel', 'Sovereign',
] as const;
