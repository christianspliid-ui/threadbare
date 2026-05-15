/**
 * Mentorship: The Offer — branching encounter (THR-75)
 *
 * The mentor offers to take the apprentice on. A mortal stands at a threshold;
 * the god decides what kind of presence to be in that moment.
 *
 * Three player choices (god actions, path-over-adjective):
 *   - Steady their nerve (supportive — raises acceptance odds, tilts Sworn)
 *   - Let them choose     (withdrawn — pure mortal agency, always-valid branch)
 *   - Whisper the cost    (coercive/cautionary — may tilt Renegade or refusal)
 *
 * Refusal is a real outcome. Acceptance continues the chain; refusal sets
 * the mentors edge to estranged quietly.
 *
 * Reach: heart. Archetype axis: Sworn ↔ Renegade.
 * Sphere-coloured prose: Life / Entropy / Force / Mind explicitly authored;
 * other 8 spheres fall through to neutral.
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
    'The threshold is small and not small. {name}\'s teacher has spoken the words ' +
    'that change a life from one shape to another: come work under my hand. The room ' +
    'has gone quiet around them in the way rooms do when something is about to be ' +
    'agreed to or refused. The god feels the moment as a knot of possibility, ' +
    'tight in the throat — and the question that always precedes a god\'s breath: ' +
    'whose nerve, whose voice, whose hand will weigh on the scale now.',
};

const step1Branch: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The apprentice gathers what they have — pride, fear, the shape of who they ' +
    'might become — and lets one or the other answer first. Whether the bond holds ' +
    'or breaks at this seam is now a thing the god has shaped, however lightly. ' +
    'Either path is its own life.',
};

export const MENTORSHIP_THE_OFFER_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.the-offer',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Offer',
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
      'A would-be apprentice stands at the threshold of a teacher\'s offer. The god watches ' +
      'a mortal life pivot on a single answered question.',
    success:
      'The apprenticeship begins. Whatever lives or dies in that bond from here will carry ' +
      'the god\'s fingerprint, lightly or heavily.',
    failure:
      'The offer is refused, or the moment slips. Both teacher and would-be apprentice walk ' +
      'away with the shape of a different life held briefly and set down again.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',
  illustrationAlt: 'A small workshop or study at the moment of offered apprenticeship — two figures in conversation, one older and standing, one younger and seated.',

  authoredChoices: {
    1: [
      {
        id: 'steady_their_nerve',
        label: 'Steady their nerve',
        intent:
          'A current of calm settles into the apprentice\'s chest — not certainty, but enough ' +
          'composure to hear the offer clearly and answer in their own voice. The god\'s touch ' +
          'is light: a breath held, a tremor smoothed. The teacher sees a steady gaze across ' +
          'the threshold and reads it as readiness. The bond, if it forms, will form on solid ground.',
        essenceCost: 1,
        likelyBurden:
          'Steady is not the same as honest. The apprentice may accept what their fear would have ' +
          'refused — and the god will have to carry the weight of having steadied them past their warning.',
        interventionType: 'supportive',
      },
      {
        id: 'let_them_choose',
        label: 'Let them choose',
        intent:
          'The god holds back. No nudge, no whisper — the offer hangs in the air, and the apprentice ' +
          'meets it with whatever mixture of nerve and dread they have. The teacher waits. The room ' +
          'waits. Whatever answer comes will be entirely theirs to own, for better or worse.',
        targetLabel: 'the apprentice',
        essenceCost: 0,
        likelyBurden:
          'The god keeps their strength but yields authorship of the moment. The apprentice may refuse ' +
          'out of pride, or accept out of fear. Either outcome will be theirs — and so will whatever it costs.',
        interventionType: 'withdrawn',
      },
      {
        id: 'whisper_the_cost',
        label: 'Whisper the cost',
        intent:
          'The god lets the weight of what an apprenticeship means settle into the apprentice\'s mind ' +
          'before they speak — the years owed, the obedience asked, the smaller life the bond would ' +
          'foreclose. It is not a lie. It is the truth made vivid at exactly the moment when a yes is easiest. ' +
          'The apprentice hesitates, or refuses, or chooses anyway and chooses sharper.',
        targetLabel: 'the apprentice',
        essenceCost: 1,
        likelyBurden:
          'A god who whispers the cost has not lied — but they have weighed in. The apprentice may ' +
          'refuse on the strength of that whisper, and the chance for the bond will not come again.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 1,
    variants: {
      steady_their_nerve: {
        overview:
          'The apprentice met the teacher\'s offer with a steady gaze and accepted. The bond ' +
          'begins on solid ground, with the god\'s steady hand quietly under it.',
        changes: [
          {
            id: 'reputation_tally_steady',
            kind: 'reputation_tally',
            title: 'A bond begins',
            detail: 'Took on a teacher; the settlement marks the apprenticeship.',
            polarity: 'gain',
          },
        ],
      },
      let_them_choose: {
        overview:
          'The god watched. The apprentice answered on their own terms — yes or no, the decision ' +
          'was theirs in full.',
        changes: [
          {
            id: 'reputation_tally_mortal',
            kind: 'reputation_tally',
            title: 'A mortal decision',
            detail: 'The apprenticeship was settled without divine weight on the scale.',
            polarity: 'info',
          },
        ],
      },
      whisper_the_cost: {
        overview:
          'The god whispered the weight of years owed before the answer formed. Whatever the ' +
          'apprentice chose, they chose with their eyes wider than they would have been.',
        changes: [
          {
            id: 'reputation_tally_whisper',
            kind: 'reputation_tally',
            title: 'A choice made sharper',
            detail: 'The cost was named; the answer carries the god\'s fingerprint on its edge.',
            polarity: 'mixed',
          },
        ],
      },
    },
    fallback: {
      overview:
        'The offer was made and answered. The shape of the apprentice\'s life turned one way ' +
        'or the other and the god\'s breath was on the air.',
      changes: [],
    },
  },
};
