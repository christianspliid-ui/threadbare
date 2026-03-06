/**
 * Rival Content Package — Name fragments and AI behavior weights for rival gods.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change rival names,
 * behavior probabilities, and action type lists.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { RivalBehavior, RivalAction } from '../types/rival';

/** Rival name prefixes — first part of procedurally generated rival god names */
export const RIVAL_NAME_PREFIXES = [
  'The Iron',
  'The Silent',
  'The Burning',
  'The Hollow',
  'The Crimson',
  'The Pale',
  'The Storm',
  'The Bone',
  'The Veiled',
  'The Shattered',
  'The Crowned',
  'The Blighted',
] as const;

/** Rival name suffixes — second part of procedurally generated rival god names */
export const RIVAL_NAME_SUFFIXES = [
  'Judge',
  'Weaver',
  'Tyrant',
  'Prophet',
  'Shepherd',
  'Warden',
  'Harvester',
  'Architect',
  'Wanderer',
  'Oracle',
  'Sentinel',
  'Sovereign',
] as const;

/** Behavior archetypes available to rival gods */
export const BEHAVIORS: RivalBehavior[] = [
  'aggressive',
  'subtle',
  'territorial',
  'expansionist',
];

/** Behavior-based action probability weights.
 *
 * Each behavior has a distribution over action types that sum to 1.0.
 * These weights are used to select rival god actions each tick, biased
 * by behavioral personality.
 *
 * Example: an aggressive rival has 45% chance to attack, only 10% to wait.
 * A subtle rival prefers intervention (35%) and recruitment (20%), rarely attacks (10%).
 */
export const BEHAVIOR_WEIGHTS: Record<
  RivalBehavior,
  Record<RivalAction['type'], number>
> = {
  aggressive: {
    recruit: 0.1,
    intervene: 0.25,
    expand: 0.1,
    attack: 0.45,
    wait: 0.1,
  },
  subtle: {
    recruit: 0.2,
    intervene: 0.35,
    expand: 0.15,
    attack: 0.1,
    wait: 0.2,
  },
  territorial: {
    recruit: 0.15,
    intervene: 0.2,
    expand: 0.3,
    attack: 0.2,
    wait: 0.15,
  },
  expansionist: {
    recruit: 0.3,
    intervene: 0.15,
    expand: 0.35,
    attack: 0.1,
    wait: 0.1,
  },
};

/** All possible action types a rival can choose.
 * Used for weighted selection during action resolution.
 */
export const ACTION_TYPES: RivalAction['type'][] = [
  'recruit',
  'intervene',
  'expand',
  'attack',
  'wait',
];
