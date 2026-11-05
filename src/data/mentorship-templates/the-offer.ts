/**
 * Mentorship: The Offer — branching encounter (THR-75)
 *
 * The mentor offers to take the apprentice on. A mortal stands at a threshold;
 * the god leans on that threshold, as one kind of presence or another.
 *
 * ─── The mortal decides (THR-2161, THR-866 pattern) ──────────────────
 *
 * Step 1 used to carry three player cards whose ids were the aftermath keys.
 * Now the **apprentice** answers on step 0, in route mode (THR-898), and the
 * god leans with a hand. Route keys are the old variant keys:
 *   - `steady_their_nerve` — Heart, `loyalty_ambition` +: they say yes, steadily.
 *   - `let_them_choose`    — Stone, `courage_prudence` −: they ask for time and answer slowly.
 *   - `whisper_the_cost`   — Eye, `revelation_discretion` +: they ask what it will cost first.
 * `aftermathConfig.branchOnStep` is 0, the deciding step (THR-979).
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

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import {
  MENTORSHIP_STEADY_SENTIMENT,
  MENTORSHIP_STEADY_TRUST,
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
    'The threshold is small and not small. {name}\'s teacher has spoken the words ' +
    'that change a life from one shape to another: come work under my hand. The room ' +
    'has gone quiet around them in the way rooms do when something is about to be ' +
    'agreed to or refused. The god feels the moment as a knot of possibility, ' +
    'tight in the throat — and the question that always precedes a god\'s breath: ' +
    'whose nerve, whose voice, whose hand will weigh on the scale now.',
  purposeLine: 'Answer the offer',
  // THR-2161 — one card per route, plus a Repertoire fill.
  nudges: [
    {
      id: 'mentorship.offer.a_steady_breath',
      name: 'A Steady Breath',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'steady_their_nerve' },
      effectLine: 'Calm the apprentice\'s nerves. A steady heart argues for saying yes.',
    },
    {
      id: 'mentorship.offer.a_long_pause',
      name: 'A Long Pause',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'let_them_choose' },
      effectLine: 'Let the silence stretch. Time to think argues for answering slowly.',
    },
    {
      id: 'mentorship.offer.the_years_owed',
      name: 'The Years Owed',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'whisper_the_cost' },
      effectLine: 'Bring the years of service to mind. The price argues for asking about it first.',
    },
  ],
  deal: { count: 2, tags: ['social', 'presence'] },
};

/** Route `steady_their_nerve` — the apprentice says yes. */
const step1SayYes: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} meets their teacher\'s eyes and says yes. Their voice does not shake. ' +
    'Now they have to prove they meant it.',
  purposeLine: 'Accept the offer',
  deal: { count: 4, tags: ['social', 'presence'] },
};

/** Route `let_them_choose` — the apprentice takes their time. */
const step1TakeTime: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} asks for a night to think. Their teacher agrees, but does not look pleased. ' +
    'In the morning, {name} gives their answer.',
  purposeLine: 'Answer in their own time',
  deal: { count: 4, tags: ['social', 'presence'] },
};

/** Route `whisper_the_cost` — the apprentice asks what it will cost. */
const step1AskTheCost: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.35,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} asks how many years they would owe, and what they would give up. ' +
    'Their teacher answers honestly. The answer is more than {name} expected.',
  purposeLine: 'Learn the price',
  deal: { count: 4, tags: ['social', 'presence'] },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2161 — the apprentice decides how to answer.
  decidedBy: {
    routes: [
      { key: 'steady_their_nerve', reach: 'heart', axis: 'loyalty_ambition', toward: 'positive' },
      { key: 'let_them_choose', reach: 'stone', axis: 'courage_prudence', toward: 'negative' },
      { key: 'whisper_the_cost', reach: 'eye', axis: 'revelation_discretion', toward: 'positive' },
    ],
  },
  variants: {
    steady_their_nerve: step1SayYes,
    let_them_choose: step1TakeTime,
    whisper_the_cost: step1AskTheCost,
  },
  fallback: { ...step1SayYes },
};

export const MENTORSHIP_THE_OFFER_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.the-offer',
  stakes: {
    goal: 'answer the teacher\'s offer of an apprenticeship',
    risk: 'let the offer slip and walk away unapprenticed',
    won: 'took up the apprenticeship under the teacher',
    lost: 'let the offer slip and walked away unapprenticed',
    arms: {
      let_them_choose: {
        won: 'took a night and took up the apprenticeship',
        lost: 'took a night, and the offer was gone by morning',
      },
      whisper_the_cost: {
        won: 'learned the price and took up the apprenticeship anyway',
        lost: 'learned the price and turned the offer down',
      },
    },
  },
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

  illustrationAlt: 'A small workshop or study at the moment of offered apprenticeship — two figures in conversation, one older and standing, one younger and seated.',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      steady_their_nerve: {
        overview:
          'The apprentice met the teacher\'s offer with a steady gaze and accepted. The bond ' +
          'begins on solid ground.',
        changes: [
          {
            id: 'reputation_tally_steady',
            kind: 'reputation_tally',
            title: 'A bond begins',
            detail: 'Took on a teacher; the settlement marks the apprenticeship.',
            polarity: 'gain',
          },
        ],
        reactions: [
          {
            id: 'mentorship.offer.steady',
            label: 'Let the bond settle',
            intent: 'The teaching begins on solid ground.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_STEADY_SENTIMENT,
                trustDelta: MENTORSHIP_STEADY_TRUST,
              },
            ],
          },
        ],
      },
      let_them_choose: {
        overview:
          '{name} took a night and answered on their own terms. Yes or no, the decision ' +
          'was theirs in full.',
        changes: [
          {
            id: 'reputation_tally_mortal',
            kind: 'reputation_tally',
            title: 'A mortal decision',
            detail: 'The apprenticeship was settled slowly, on the apprentice\'s own terms.',
            polarity: 'info',
          },
        ],
        reactions: [
          {
            id: 'mentorship.offer.mortal',
            label: 'Let it be theirs',
            intent: 'The settlement marks the apprenticeship, and nothing else.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
            ],
          },
        ],
      },
      whisper_the_cost: {
        overview:
          '{name} asked the price before answering. Whatever they chose, ' +
          'they chose knowing what it would cost.',
        changes: [
          {
            id: 'reputation_tally_whisper',
            kind: 'reputation_tally',
            title: 'A choice made sharper',
            detail: 'The cost was named; the answer carries that knowledge on its edge.',
            polarity: 'mixed',
          },
        ],
        reactions: [
          {
            id: 'mentorship.offer.whisper',
            label: 'Let the whisper stand',
            intent: 'They answered with their eyes open, and the edge of it stays.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              // Asking the price buys a truer answer at the cost of some warmth —
              // trust rises because the teacher did not lie, sentiment falls because
              // nobody enjoys being told the bill before they order.
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: -MENTORSHIP_STEADY_SENTIMENT,
                trustDelta: MENTORSHIP_STEADY_TRUST,
              },
            ],
          },
        ],
      },
    },
    fallback: {
      overview:
        'The offer was made and answered. The shape of the apprentice\'s life turned one way ' +
        'or the other.',
      changes: [],
    },
  },
};
