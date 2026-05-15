/**
 * Mentorship: Graduation — branching encounter (THR-75)
 *
 * The apprenticeship completes. Two authored sub-voices selected by seedLabel:
 *   - 'mentorship_graduation' → warm graduation: the apprentice becomes a peer.
 *   - 'mentorship_surpassing'  → bittersweet Surpassing: pride tangled with being eclipsed.
 *
 * The Mastery trait grant is already done by resolveMentorship() before this
 * encounter fires; this template *narrates* the moment, it does not re-grant.
 *
 * Three player choices:
 *   - Honor the bond     (supportive — strengthens relates_to, tilts Sworn)
 *   - Let the moment be theirs (withdrawn)
 *   - Name the rivalry   (coercive — only meaningful on Surpassing; seeds future story)
 *
 * Reach: heart. Archetype axis: Sworn ↔ Renegade.
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
    'The training has run its course. {name} stands in the workshop or the courtyard or ' +
    'the schoolroom where the last lesson was given, and the air between them and their ' +
    'teacher has changed. There is something in the teacher\'s face the apprentice has not ' +
    'seen before — pride, perhaps, or its quieter cousin: the look of someone watching their ' +
    'own work walk out into the world on legs that are no longer borrowed.\n\n' +
    'The god feels it as a hinge. The bond they have shaped through these months is about to ' +
    'become a different kind of bond, or end. Whatever happens in the next breath will be the ' +
    'story the settlement remembers when it tells this name.',
};

const step1Branch: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.2,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'Words pass between the two of them — not many, and not loud. The shape of what the apprenticeship ' +
    'has been settles into something the god can carry forward, and into something the apprentice ' +
    'will carry until they teach someone of their own.',
};

export const MENTORSHIP_GRADUATION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.graduation',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  name: 'Graduation',
  reach: 'heart',
  crudType: 'update',
  scale: 'personal',

  steps: [step0Reckoning, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'tradition_novelty'],

  narrativeTemplates: {
    initiation:
      'An apprenticeship comes to its close. The teacher\'s craft has lived through the apprentice\'s ' +
      'hands and now stands on its own.',
    success:
      'The bond between teacher and former apprentice becomes a different kind of bond — peer, ' +
      'rival, kin in craft. The mastery is theirs to carry now.',
    failure:
      'The graduation goes quietly or badly. Something the teacher meant to pass on remains in the ' +
      'air, unfinished.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',
  illustrationAlt: 'A workshop or study at the end of a long apprenticeship — tools laid down, the teacher watching the apprentice with a look of complicated pride.',

  authoredChoices: {
    1: [
      {
        id: 'honor_the_bond',
        label: 'Honor the bond',
        intent:
          'The god strengthens the moment with a current of warmth — the kind that makes the teacher\'s ' +
          'pride land cleanly in the apprentice\'s chest, and the apprentice\'s gratitude land cleanly in ' +
          'the teacher\'s. The bond closes its first chapter as a peer-bond, not a hierarchy. Whatever ' +
          'the apprentice does next will carry the teacher with it as something carried, not something escaped.',
        targetLabel: 'teacher and apprentice',
        essenceCost: 1,
        likelyBurden:
          'A bond honored at graduation can become a bond that pulls — the apprentice may shape their ' +
          'craft to their teacher\'s template rather than their own. The cost of warmth is sometimes that.',
        interventionType: 'supportive',
      },
      {
        id: 'let_the_moment_be_theirs',
        label: 'Let the moment be theirs',
        intent:
          'The god watches without weighing in. Whatever pride or grief or grudge passes between the two ' +
          'of them is theirs. The settlement will remember the graduation in whatever shape they give it.',
        targetLabel: 'the moment',
        essenceCost: 0,
        likelyBurden:
          'A god who stands aside at graduation accepts whatever shape the parting takes. Not all ' +
          'partings are clean. Some leave the apprentice without the closing words they needed.',
        interventionType: 'withdrawn',
      },
      {
        id: 'name_the_rivalry',
        label: 'Name the rivalry',
        intent:
          'The god lets the truth of what just happened sit visible in the air between them: the ' +
          'apprentice has equalled or exceeded the teacher, and pretending otherwise would be a kindness ' +
          'that costs both of them. The naming converts the pride into a live current — competitive, ' +
          'alive, dangerous in the way that all real rivalries are dangerous. The bond does not break. ' +
          'It changes shape.',
        targetLabel: 'teacher and apprentice',
        essenceCost: 2,
        likelyBurden:
          'A named rivalry is a live wire. It will draw both of them back into each other\'s orbit, ' +
          'and the next encounter between them will not be peaceful. The god\'s fingerprint is on this turn.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 1,
    variants: {
      honor_the_bond: {
        overview:
          'The graduation closed warm. Teacher and former apprentice will carry each other forward as ' +
          'peers, the craft passing from one set of hands to the next without rupture.',
        changes: [
          {
            id: 'reputation_tally_honored',
            kind: 'reputation_tally',
            title: 'A bond honored',
            detail: 'Graduated under their teacher; the settlement marks the lineage.',
            polarity: 'gain',
          },
        ],
      },
      let_the_moment_be_theirs: {
        overview:
          'The god watched. Whatever the two of them gave each other at the end was theirs to give. ' +
          'The apprenticeship closed on mortal terms.',
        changes: [
          {
            id: 'reputation_tally_quiet_graduation',
            kind: 'reputation_tally',
            title: 'A quiet ending',
            detail: 'Completed an apprenticeship without divine weight on the closing words.',
            polarity: 'info',
          },
        ],
      },
      name_the_rivalry: {
        overview:
          'The apprentice has outgrown their teacher, and the god named it in the open. What was a ' +
          'mentorship is now a live rivalry — kin in craft, but no longer kin in rank. They will meet ' +
          'again, and the meeting will not be soft.\n\n' +
          'The teacher\'s pride and loss arrive in the same breath. The apprentice carries a craft ' +
          'that is theirs now in a way it could never have been if the parting had been gentle. ' +
          'Bittersweet does not name half of it.',
        changes: [
          {
            id: 'reputation_tally_surpassed',
            kind: 'reputation_tally',
            title: 'A rivalry seeded',
            detail: 'Surpassed their teacher; the lineage carries a live edge into the future.',
            polarity: 'mixed',
          },
          {
            id: 'future_hook_surpassing',
            kind: 'future_hook',
            title: 'The next meeting',
            detail: 'Teacher and former apprentice will cross paths again, and the air between them will carry charge.',
            polarity: 'mixed',
          },
        ],
      },
    },
    fallback: {
      overview:
        'The apprenticeship completed. The craft has passed from one set of hands to the next, ' +
        'in the shape the bond was able to hold.',
      changes: [],
    },
  },
};
