/**
 * Mentorship: The Falling Out — branching encounter (THR-75)
 *
 * The bond breaks before or at completion. The structural reference is
 * `flawed-steel.ts` — a master/apprentice rupture that the god shapes,
 * does not solve.
 *
 * ─── The mortal decides (THR-2161, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 1 used to carry three player cards
 * ("Try to mend it" / "Let it break" / "Take a side") whose ids were the
 * aftermath keys. Now the **apprentice** decides on step 0, in route mode
 * (`decidedBy.routes`, THR-898), and the god leans with a hand:
 *   - `try_to_mend`  — Heart, `loyalty_ambition` +: they hold their tongue and look for terms.
 *   - `let_it_break` — Stone, `courage_prudence` −: they say nothing and let it go.
 *   - `take_a_side`  — Iron, `loyalty_ambition` −: they stand on their own grievance.
 * Route keys are the old variant keys, so the aftermath keeps its keys.
 * `aftermathConfig.branchOnStep` is 0, the deciding step (THR-979).
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §5.1
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import {
  MENTORSHIP_BREAK_SENTIMENT,
  MENTORSHIP_MENDED_SENTIMENT,
  MENTORSHIP_MENDED_TRUST,
  MENTORSHIP_NEXT_MEETING_DELAY_TICKS,
  MENTORSHIP_SIDED_SENTIMENT,
  MENTORSHIP_TALLY_KEY,
  MENTORSHIP_TALLY_KEY_ILL,
} from './law56-backing';

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
  purposeLine: 'Decide how it ends',
  // THR-2161 — the fork's argument: one card per route, so no course is
  // unsteerable, plus a Repertoire fill.
  nudges: [
    {
      id: 'mentorship.falling_out.the_first_lesson',
      name: 'The First Lesson',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'try_to_mend' },
      effectLine: 'Remind the apprentice of the first thing their teacher taught them. Old gratitude argues for mending it.',
    },
    {
      id: 'mentorship.falling_out.the_open_door',
      name: 'The Open Door',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'let_it_break' },
      effectLine: 'Show the apprentice the road out of the workshop. A quiet exit argues for letting it break.',
    },
    {
      id: 'mentorship.falling_out.the_old_grievance',
      name: 'The Old Grievance',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { route: 'take_a_side' },
      effectLine: 'Bring back the time their teacher wronged them. The old hurt argues for standing their ground.',
    },
  ],
  deal: { count: 2, tags: ['social', 'presence'] },
};

/** Route `try_to_mend` — the apprentice holds back the worst words. */
const step1TryToMend: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} holds back the worst words. They ask their teacher for terms they can both live with. ' +
    'The apprenticeship is over either way. They are trying to leave it without an enemy.',
  purposeLine: 'Part without an enemy',
  deal: { count: 4, tags: ['social', 'presence'] },
};

/** Route `let_it_break` — the apprentice says nothing and goes. */
const step1LetItBreak: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.3,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} does not argue. They pack their tools and leave the workshop without a word. ' +
    'Their teacher does not call after them.',
  purposeLine: 'Walk away',
  deal: { count: 4, tags: ['social', 'peril'] },
};

/** Route `take_a_side` — the apprentice stands on their own grievance. */
const step1TakeASide: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.45,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{name} says what they have held back for months. They name every wrong their teacher did them, ' +
    'in front of the whole workshop. One of the two will leave this room smaller.',
  purposeLine: 'Stand their ground',
  deal: { count: 4, tags: ['social', 'presence'] },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2161 — the apprentice decides which way the break goes.
  decidedBy: {
    routes: [
      { key: 'try_to_mend', reach: 'heart', axis: 'loyalty_ambition', toward: 'positive' },
      { key: 'let_it_break', reach: 'stone', axis: 'courage_prudence', toward: 'negative' },
      { key: 'take_a_side', reach: 'iron', axis: 'loyalty_ambition', toward: 'negative' },
    ],
  },
  variants: {
    try_to_mend: step1TryToMend,
    let_it_break: step1LetItBreak,
    take_a_side: step1TakeASide,
  },
  fallback: { ...step1TryToMend },
};

export const MENTORSHIP_THE_FALLING_OUT_TEMPLATE: UnifiedActionTemplate = {
  id: 'mentorship.the-falling-out',
  stakes: {
    goal: 'part from their teacher without lasting enmity',
    risk: 'break with the teacher as open enemies',
    won: 'parted from their teacher without lasting enmity',
    lost: 'broke with the teacher, carrying more wound than craft',
    arms: {
      let_it_break: {
        won: 'walked away clean, with no words to regret',
        lost: 'walked away, and the silence hardened into a grudge',
      },
      take_a_side: {
        won: 'stood their ground and left the taller of the two',
        lost: 'named every wrong and made an enemy of the teacher',
      },
    },
  },
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
      'The bond ends in the shape the apprentice gave it — clean rupture, salvaged remnant, or open enmity.',
    failure:
      'The bond breaks worse than it had to. What the apprentice carries forward is more wound than craft.',
  },

  illustrationAlt: 'A confrontation in a workshop or training yard — teacher and former apprentice no longer facing each other in the old way.',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      try_to_mend: {
        overview:
          '{name} held back the worst words. The two will part as people who once worked together — not warmly, ' +
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
        // Law 56 (THR-1141): "ended on terms both could live with" is a real,
        // positive move on a bond that was breaking — smaller than a graduation
        // honored, because mending a seam is not the same as closing well.
        reactions: [
          {
            id: 'mentorship.falling_out.mend',
            label: 'Let the seam hold',
            intent: 'Not warmly, but not as enemies.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_MENDED_SENTIMENT,
                trustDelta: MENTORSHIP_MENDED_TRUST,
              },
            ],
          },
        ],
      },
      let_it_break: {
        overview:
          '{name} walked away without a word. Both parties will carry the worst version of ' +
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
        // "Both parties will carry the worst version of each other forward" —
        // the largest single sentiment move in the mentorship ladder.
        reactions: [
          {
            id: 'mentorship.falling_out.break',
            label: 'Let it break',
            intent: 'The rupture stands, and neither of them tried to mend it.',
            effects: [
              // The one band in the three mentorship templates whose chip is
              // authored `polarity: 'loss'` — a bond broken, not a bond marked.
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY_ILL, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_BREAK_SENTIMENT,
              },
            ],
          },
        ],
      },
      take_a_side: {
        overview:
          '{name} named every wrong in front of the workshop. One stands taller; the other carries the cut. The rupture is not the kind of ' +
          'thing time will close on its own — the next meeting between these two will carry it.',
        changes: [
          {
            id: 'reputation_tally_sided',
            kind: 'reputation_tally',
            title: 'A side taken',
            detail: 'The apprentice stood on their grievance; one party will carry that knowledge.',
            polarity: 'mixed',
          },
          {
            id: 'future_hook_rivalry',
            kind: 'future_hook',
            title: 'The next meeting',
            detail: 'Teacher and former apprentice will cross paths again, and this quarrel will shape that meeting.',
            polarity: 'mixed',
          },
        ],
        // Law 56 (THR-1141): taking a side is asymmetric by definition — "one
        // stands taller; the other carries the cut" — so the edge is written one
        // way only. `reciprocal: false` is what makes the sentence true rather
        // than merely evocative. And the hook is seeded, not promised.
        reactions: [
          {
            id: 'mentorship.falling_out.side',
            label: 'Let the choice stand',
            intent: 'One stands taller. The other carries the cut.',
            effects: [
              { kind: 'reputation_tally', key: MENTORSHIP_TALLY_KEY, delta: 1 },
              {
                kind: 'bond_change',
                withAgentId: '$target',
                sentimentDelta: MENTORSHIP_SIDED_SENTIMENT,
                reciprocal: false,
              },
              {
                kind: 'encounter_seed',
                templateId: 'mentorship.the-falling-out',
                targetAgentId: '$actor',
                delayTicks: MENTORSHIP_NEXT_MEETING_DELAY_TICKS,
                seedLabel: 'The two meet again, carrying the quarrel between them.',
                inheritContext: true,
              },
            ],
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
