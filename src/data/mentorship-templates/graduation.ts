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
 * ─── The mortal decides (THR-2161, THR-866 pattern) ──────────────────
 *
 * Step 1 used to carry three player cards whose ids were the aftermath keys.
 * Now the **apprentice** decides on step 0, in route mode (THR-898), and the
 * god leans with a hand. Route keys are the old variant keys:
 *   - `honor_the_bond`           — Heart, `loyalty_ambition` +: they thank their teacher as a peer.
 *   - `let_the_moment_be_theirs` — Veil, `tradition_novelty` +: they take leave the old way, by custom.
 *   - `name_the_rivalry`         — Iron, `loyalty_ambition` −: they say out loud they are the better.
 * `aftermathConfig.branchOnStep` is 0, the deciding step (THR-979).
 *
 * Reach: heart. Archetype axis: Sworn ↔ Renegade.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §5.1
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import {
  MENTORSHIP_HONORED_SENTIMENT,
  MENTORSHIP_HONORED_TRUST,
  MENTORSHIP_NEXT_MEETING_DELAY_TICKS,
  MENTORSHIP_RIVALRY_SENTIMENT,
  MENTORSHIP_TALLY_KEY,
} from './law56-backing';

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
  purposeLine: 'Close the apprenticeship',
  // THR-2161 — one card per route, plus a Repertoire fill.
  nudges: [
    {
      id: 'mentorship.graduation.a_debt_of_thanks',
      name: 'A Debt of Thanks',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'honor_the_bond' },
      effectLine: 'Remind the apprentice what their teacher gave them. Gratitude argues for parting as peers.',
    },
    {
      id: 'mentorship.graduation.the_old_words',
      name: 'The Old Words',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'let_the_moment_be_theirs' },
      effectLine: 'Bring the old leave-taking words of the craft to mind. Custom argues for a quiet parting.',
    },
    {
      id: 'mentorship.graduation.the_better_work',
      name: 'The Better Work',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'name_the_rivalry' },
      effectLine: 'Set their best work beside the work of their teacher. The difference argues for saying it out loud.',
    },
  ],
  deal: { count: 2, tags: ['social', 'presence'] },
};

/** Route `honor_the_bond` — the apprentice thanks their teacher as a peer. */
const step1HonorTheBond: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.2,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} thanks their teacher in front of everyone in the workshop. They speak as an equal now, ' +
    'not as a student. Their teacher has to find the words to answer.',
  purposeLine: 'Part as peers',
  deal: { count: 4, tags: ['social', 'presence'] },
};

/** Route `let_the_moment_be_theirs` — the apprentice takes leave by custom. */
const step1TakeLeave: ActionStep = {
  reach: 'veil',
  duration: { min: 1, max: 2 },
  difficulty: 0.2,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} takes leave the old way. They bow, return the borrowed tools, and say the words ' +
    'every apprentice of this craft has said before them. Nothing more is said.',
  purposeLine: 'Take leave by custom',
  deal: { count: 4, tags: ['social', 'presence'] },
};

/** Route `name_the_rivalry` — the apprentice says they are the better. */
const step1NameTheRivalry: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} says out loud what everyone in the workshop already knows: they have surpassed their teacher. ' +
    'Their teacher does not deny it. Neither of them smiles.',
  purposeLine: 'Claim the higher rank',
  deal: { count: 4, tags: ['social', 'presence'] },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2161 — the apprentice decides how the apprenticeship closes.
  decidedBy: {
    routes: [
      { key: 'honor_the_bond', reach: 'heart', axis: 'loyalty_ambition', toward: 'positive' },
      { key: 'let_the_moment_be_theirs', reach: 'veil', axis: 'tradition_novelty', toward: 'positive' },
      { key: 'name_the_rivalry', reach: 'iron', axis: 'loyalty_ambition', toward: 'negative' },
    ],
  },
  variants: {
    honor_the_bond: step1HonorTheBond,
    let_the_moment_be_theirs: step1TakeLeave,
    name_the_rivalry: step1NameTheRivalry,
  },
  fallback: { ...step1HonorTheBond },
};

export const MENTORSHIP_GRADUATION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.graduation',
  stakes: {
    goal: 'close the apprenticeship on good terms',
    risk: 'part with the teacher\'s last lesson unpassed',
    won: 'closed the apprenticeship on good terms',
    lost: 'parted with the teacher\'s last lesson unpassed',
    arms: {
      let_the_moment_be_theirs: {
        won: 'took leave by custom, and the lineage holds',
        lost: 'took leave by custom, and the last lesson went unsaid',
      },
      name_the_rivalry: {
        won: 'claimed the higher rank, and the teacher conceded it',
        lost: 'claimed the higher rank and lost the teacher\'s respect',
      },
    },
  },
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

  illustrationAlt: 'A workshop or study at the end of a long apprenticeship — tools laid down, the teacher watching the apprentice with a look of complicated pride.',

  aftermathConfig: {
    branchOnStep: 0,
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
        // Law 56 (THR-1141): "the settlement marks the lineage" is a tally, and
        // "carry each other forward as peers" is an edge. Both written.
        reactions: [
          {
            id: 'mentorship.graduation.honored',
            label: 'Let them part as peers',
            intent: 'The craft passes without rupture.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_HONORED_SENTIMENT,
                trustDelta: MENTORSHIP_HONORED_TRUST,
              },
            ],
          },
        ],
      },
      let_the_moment_be_theirs: {
        overview:
          '{name} took leave by custom. Whatever the two of them gave each other at the end was theirs to give. ' +
          'The apprenticeship closed on mortal terms.',
        changes: [
          {
            id: 'reputation_tally_quiet_graduation',
            kind: 'reputation_tally',
            title: 'A quiet ending',
            detail: 'Completed an apprenticeship with the old words of the craft, and nothing more.',
            polarity: 'info',
          },
        ],
        // The whole point of this variant is that nothing was added, so the
        // tally is the only write — the settlement still marks the completion.
        reactions: [
          {
            id: 'mentorship.graduation.quiet',
            label: 'Let the ending be theirs',
            intent: 'The apprenticeship closes on mortal terms.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
            ],
          },
        ],
      },
      name_the_rivalry: {
        overview:
          '{name} has outgrown their teacher, and said so in the open. What was a ' +
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
        // Law 56 (THR-1141): two chips, two writes. The rivalry is a live
        // negative edge rather than a closed one — hence a sentiment move with
        // no trust move, since neither has stopped believing the other competent.
        // And 'The next meeting' stops promising and starts scheduling:
        // `inheritContext` keeps the same two people in it.
        reactions: [
          {
            id: 'mentorship.graduation.rivalry',
            label: 'Let the rivalry stand',
            intent: 'Kin in craft, no longer kin in rank.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_RIVALRY_SENTIMENT,
              },
              {
                kind: 'encounter_seed',
                templateId: 'mentorship.the-falling-out',
                targetAgentId: '$actor',
                delayTicks: MENTORSHIP_NEXT_MEETING_DELAY_TICKS,
                seedLabel: 'Teacher and former apprentice cross paths, with the rank between them named.',
                inheritContext: true,
              },
            ],
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
