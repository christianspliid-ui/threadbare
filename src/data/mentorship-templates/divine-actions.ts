/**
 * Mentorship Divine Actions (THR-75)
 *
 * Two player-facing divine actions surfaced through Generalized Action Targeting:
 *   - Inspire Mentorship — sets `mentorshipInspireBonus` on a high-capability agent,
 *     biasing them toward selecting the train-apprentice initiative on their next
 *     decision tick.
 *   - Sever the Bond — sets `pendingMentorshipSever` on the target agent; phaseMentorship
 *     reads this on its next tick, sets severedByDivineWill on the active mentors edge,
 *     and resolves as Falling Out.
 *
 * Both follow the existing divine-action GraphOp pattern (`update_node` with `$target`
 * symbolic) mirroring `action.initiative.inspire` and `action.initiative.sabotage`.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.5, §6.4
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  INSPIRE_MENTORSHIP_ESSENCE_COST,
  INSPIRE_MENTORSHIP_SCORE_BONUS,
  SEVER_BOND_ESSENCE_COST,
} from '../mentorship-constants';

export const INSPIRE_MENTORSHIP_TEMPLATE: UnifiedActionTemplate = {
  id: 'action.mentorship.inspire',
  name: 'Inspire Mentorship',
  spellName: 'Pass It On',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  description:
    'Breathe a duty into a high-capability mortal: pass on what you know. Their next ' +
    'initiative scoring receives a one-time bonus toward Train Apprentice. Consumed on use.',
  reach: 'heart',
  crudType: 'update',
  scale: 'personal',

  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0,
      onSuccess: [
        {
          op: 'update_node',
          nodeId: '$target',
          changes: { mentorshipInspireBonus: INSPIRE_MENTORSHIP_SCORE_BONUS },
        },
      ],
      onFailure: [],
      failBehavior: 'fail_action',
    },
  ],

  apCost: 1,
  essenceCost: INSPIRE_MENTORSHIP_ESSENCE_COST,

  actorAffinities: ['individual'],
  targetCategories: ['actor'],
  bypassRevelationGate: true,
  motivations: ['loyalty_ambition', 'tradition_novelty'],

  narrativeTemplates: {
    initiation:
      'whispers a half-remembered duty into a mortal\'s mind — there is someone here whose hands are ready to learn',
    success:
      'the thought takes root; the mortal will feel the pull toward taking on an apprentice',
    failure: 'the whisper does not catch; the thought passes like weather',
  },
};

export const SEVER_THE_BOND_TEMPLATE: UnifiedActionTemplate = {
  id: 'action.mentorship.sever',
  name: 'Sever the Bond',
  spellName: 'Cut the Cord',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  description:
    'Force a dramatic break between a mortal and their teacher. The next tick will run a Falling Out arc, and the bond will end with the god\'s fingerprint on the wound.',
  reach: 'shadow',
  crudType: 'update',
  scale: 'personal',

  steps: [
    {
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: 0,
      onSuccess: [
        {
          op: 'update_node',
          nodeId: '$target',
          changes: { pendingMentorshipSever: true },
        },
      ],
      onFailure: [],
      failBehavior: 'fail_action',
    },
  ],

  apCost: 1,
  essenceCost: SEVER_BOND_ESSENCE_COST,

  actorAffinities: ['individual'],
  targetCategories: ['actor'],
  bypassRevelationGate: true,
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'reaches between a mentor and apprentice and places a charge under the bond',
    success:
      'the bond is flagged for rupture; by the next breath there will be a wound where it was',
    failure:
      'the sever fails to catch; the bond holds for now',
  },
};
