/**
 * Mentorship: The Falling Out — branching encounter (THR-75)
 *
 * The bond breaks before or at completion. The structural reference is
 * `flawed-steel.ts` — a master/apprentice rupture that the god shapes,
 * does not solve.
 *
 * Three player choices:
 *   - Try to mend it     (supportive — uncertain shot at a Quiet Parting)
 *   - Let it break       (withdrawn)
 *   - Take a side        (coercive — picks one party; deepens rupture for the other,
 *                          can push past HOSTILE_THRESHOLD)
 *
 * Reach: heart (or shadow when the bond curdles). Archetype axis: Sworn ↔ Renegade.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §5.1
 */

import type { UnifiedActionTemplate, ActionStep } from '../../types/unifiedAction';

const step0Reckoning: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'Something has gone wrong in the bond between {name} and the one who took them on. ' +
    'It may be one large wound or a slow accumulation of small ones; either way the air ' +
    'around the two of them has the particular tension of a thing about to break. ' +
    'A word will land badly. A look will be taken the wrong way. The teacher\'s hand will ' +
    'reach out and not be met.\n\n' +
    'The god feels the rupture coming the way one feels weather. There is still time — ' +
    'a small window — to shape what happens next.',
};

const step1Branch: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The break, when it comes, takes the shape the god has given it. Words are said that ' +
    'cannot be taken back, or are not said that should have been. Whatever the apprentice has ' +
    'learned will travel with them now, alongside the wound of how it ended.',
};

export const MENTORSHIP_THE_FALLING_OUT_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.the-falling-out',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Falling Out',
  reach: 'heart',
  crudType: 'update',
  scale: 'personal',

  steps: [step0Reckoning, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'A mentor-apprentice bond is about to break. The god watches the seam tear or holds the seam together.',
    success:
      'The bond ends in the shape the god gave it — clean rupture, salvaged remnant, or open enmity.',
    failure:
      'The bond breaks worse than it had to. What the apprentice carries forward is more wound than craft.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',
  illustrationAlt: 'A confrontation in a workshop or training yard — teacher and former apprentice no longer facing each other in the old way.',

  authoredChoices: {
    1: [
      {
        id: 'try_to_mend',
        label: 'Try to mend it',
        intent:
          'The god reaches into the moment and pulls — not toward agreement, but toward enough composure ' +
          'on both sides that the worst words go unspoken. The bond will not become what it could have been ' +
          'if it had held; that is gone. But a quieter ending becomes possible. The two will part as people ' +
          'who once worked together, not as enemies.',
        targetLabel: 'teacher and apprentice',
        essenceCost: 2,
        likelyBurden:
          'Mending takes effort, and the seam may not hold. The god may steady the moment only to watch ' +
          'the bond tear later, in a private hour, without the divine current beneath it. A delayed break ' +
          'is sometimes a worse one.',
        interventionType: 'supportive',
      },
      {
        id: 'let_it_break',
        label: 'Let it break',
        intent:
          'The god watches without intervening. Whatever the two of them are about to say to each other ' +
          'will be said. Whatever the rupture costs will be borne in whatever shape it lands.',
        targetLabel: 'the rupture',
        essenceCost: 0,
        likelyBurden:
          'A break the god did not steady will leave both parties with the worst version of each other ' +
          'in memory. The apprentice will carry the wound into their next bond, and the teacher will carry ' +
          'a refusal into theirs.',
        interventionType: 'withdrawn',
      },
      {
        id: 'take_a_side',
        label: 'Take a side',
        intent:
          'The god chooses. The current of divine attention tilts toward one of them — the apprentice ' +
          'standing taller in their grievance, or the teacher\'s authority cracking like a whip in the room — ' +
          'and the other is left holding the cracked end of the bond. The rupture deepens past the point ' +
          'where ordinary time will close it. Whichever party the god has cut loose will carry that cutting ' +
          'as a story.',
        targetLabel: 'teacher or apprentice',
        essenceCost: 2,
        likelyBurden:
          'A god who takes a side leaves their fingerprint on a wound that will not heal. The party cut ' +
          'loose will remember — possibly as enmity, possibly as a debt. The next meeting of these two ' +
          'will not be ordinary.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 1,
    variants: {
      try_to_mend: {
        overview:
          'The god steadied the seam. The two will part as people who once worked together — not warmly, ' +
          'but not as enemies. What the apprentice has learned travels with them, alongside the lighter ' +
          'wound of an ending that was held.',
        changes: [
          {
            id: 'reputation_tally_mended',
            kind: 'reputation_tally',
            title: 'A quiet parting salvaged',
            detail: 'The break did not become a wound; the bond ended on terms both could live with.',
            polarity: 'mixed',
          },
        ],
      },
      let_it_break: {
        overview:
          'The bond broke without the god\'s hand on it. Both parties will carry the worst version of ' +
          'each other forward, and the lesson will sit alongside the wound for as long as the wound takes.',
        changes: [
          {
            id: 'reputation_tally_broken',
            kind: 'reputation_tally',
            title: 'A bond broken',
            detail: 'The apprenticeship ended badly; the settlement notes the rupture.',
            polarity: 'loss',
          },
        ],
      },
      take_a_side: {
        overview:
          'The god chose. One stands taller; the other carries the cut. The rupture is not the kind of ' +
          'thing time will close on its own — the next meeting between these two will carry weight the ' +
          'god placed there.',
        changes: [
          {
            id: 'reputation_tally_sided',
            kind: 'reputation_tally',
            title: 'A side taken',
            detail: 'Divine attention tipped the rupture; one party will carry that knowledge.',
            polarity: 'mixed',
          },
          {
            id: 'future_hook_rivalry',
            kind: 'future_hook',
            title: 'The next meeting',
            detail: 'Teacher and former apprentice will cross paths again; the god\'s choice will shape that meeting.',
            polarity: 'mixed',
          },
        ],
      },
    },
    fallback: {
      overview:
        'The bond ended. Whatever the apprentice has learned travels with them. Whatever the teacher ' +
        'has lost travels with them.',
      changes: [],
    },
  },
};
