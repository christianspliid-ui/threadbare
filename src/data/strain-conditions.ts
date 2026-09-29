/**
 * Strain conditions — the price a strain spell charges (THR-1571, lane decision 4).
 *
 * A `reach_drain` cost used to subtract from `properties.domainCapability`, a property
 * nothing reads, so paying it cost nothing. It now lands one of these eight shared
 * condition definitions on the caster: a timed passive that thins the drained Reach.
 * One definition per Reach, never one per bearer (THR-1395); the bearing is the edge,
 * and `ticksRemaining` on the edge is what `decayConditions` counts down.
 *
 * UL: **Strained** (THR-1673).
 */

import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { STRAIN_PENALTY_SHARE } from './spell-casting-constants';

/** The id of the strain condition for one Reach. */
export function strainConditionId(reach: ReachDomain): string {
  return `condition.strained.${reach}`;
}

/** The game word per Reach, for the condition's name. */
const STRAIN_NAMES: Readonly<Record<ReachDomain, string>> = {
  iron: 'Strained Iron',
  heart: 'Strained Heart',
  gold: 'Strained Gold',
  eye: 'Strained Eye',
  veil: 'Strained Veil',
  shadow: 'Strained Shadow',
  stone: 'Strained Stone',
  star: 'Strained Star',
};

const REACH_WORD: Readonly<Record<ReachDomain, string>> = {
  iron: 'Iron', heart: 'Heart', gold: 'Gold', eye: 'Eye',
  veil: 'Veil', shadow: 'Shadow', stone: 'Stone', star: 'Star',
};

/** The definition node for one Reach's strain condition. */
export function strainConditionNode(reach: ReachDomain): {
  id: string;
  type: 'trait';
  name: string;
  properties: Record<string, unknown>;
} {
  return {
    id: strainConditionId(reach),
    type: 'trait',
    name: STRAIN_NAMES[reach],
    properties: {
      subcategory: 'condition',
      tier: 1,
      tags: ['#condition', '#strain', `#${reach}`, '#negative'],
      description: `Strained: their ${REACH_WORD[reach]} is thin for a while.`,
      mechanicalSummary: `The price of a strain spell: ${REACH_WORD[reach]} is thinner until it passes.`,
      flavorText: 'The working took something, and it has not come back yet.',
      maxLevel: 1,
      visibility: 'discoverable',
      importance: 0,
      domainContributions: {},
      effects: [{ type: 'passive', reach, value: -STRAIN_PENALTY_SHARE }],
    },
  };
}

/** All eight strain definitions, in Reach order. */
export function allStrainConditionNodes(): ReturnType<typeof strainConditionNode>[] {
  return REACH_DOMAINS.map(strainConditionNode);
}
