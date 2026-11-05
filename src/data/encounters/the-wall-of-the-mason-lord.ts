/**
 * The Wall of the Mason-Lord — regional-scale branching encounter (THR-466).
 *
 * A threaded mason-lord has the stone, the labor, and the will to raise a great
 * wall across the pass — a work of permanence that would seal one region safe
 * behind it and leave the lands beyond it to the famine, the raiders, and the
 * coming winter. The god can harden the mason-lord's resolve until the wall
 * rises, fixed and final; or stay its hand and let the doubt in, so that the
 * work is never finished and the region stays open — endangered, but with no one
 * sealed outside to die.
 *
 * Reach: stone (Keeper ↔ Destroyer). Scale: regional — the wall decides the fate
 * of a whole region and the lands beyond it.
 *
 * Player-as-god framing: both choices are god-actions. "Harden their resolve" is
 * active intervention (coercive). "Let the doubt in" is divine restraint — the
 * always-valid "let them handle it," which tilts Destroyer because a mason-lord
 * left to their own conscience cannot quite finish a wall that dooms the people
 * on the far side, and so the permanent thing is unmade by mercy.
 *
 * TODO(THR-498): repeatability: 'unique' — bespoke regional marquee, fire ≤1×/playthrough.
 * Field does not exist on UnifiedActionTemplate until THR-498 lands.
 *
 * Authored directly to the exemplar quality bar (rival-shrine-betrayal 10/10,
 * flawed-steel 9/10) rather than via the 4-pass encounter-pipeline, which is not
 * supervisable inside an automated single-issue run. Held to the editorial REVISE
 * triggers: approach prose at every step, scene-specific god-verbs, cool failure
 * at every branch, human consequences over mechanical labels.
 *
 * ─── The mortal decides (THR-2157, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 0 was two cards whose ids were the
 * aftermath keys, so the click picked the ending. Now the fork decides on
 * `mercy_ruthlessness`: a Protector (+1) cannot shut the far side out and
 * lets the doubt in; a Conqueror (−1) finishes the wall. The god argues with a
 * composed hand — two pole-leaning specials plus a Repertoire fill — and the
 * mason-lord answers.
 *
 * - Fork axis: `mercy_ruthlessness` — the one value the endings disagree on
 *   (who is worth shutting out). `positive` = Let the Doubt In,
 *   `negative` = Harden Their Resolve. Variants, aftermath and `stakes.arms`
 *   are keyed to the pole, because pole mode writes the bare key.
 * - `aftermathConfig.branchOnStep` stays 0, the deciding step (THR-979).
 * - Each arm deals an ordinary hand from the god's Repertoire.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';
import { DEAL_DEFAULT_COUNT } from '../nudge-constants';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Reckoning at the Pass. The mason-lord stands at the unfinished
 * wall and weighs permanence against mercy. Difficulty 0 — the choice is the point.
 */
const step0TheReckoning: ActionStep = {
  reach: 'stone',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // THR-2110: rewritten from scratch to Prose Doctrine v2 (the opening skeleton).
  narrativeTemplate:
    '{actor}, the mason-lord, has come back to the great wall in the pass above {location}.\n\n' +
    'The wall stands at half its height. Finished, it will keep raiders and hungry strangers out of the ' +
    'valley through the famine winter. It will also shut out the herders and towns on the far side, and ' +
    'leave them to the raiders.\n\n' +
    '{actor} has built the wall this far. Now {actor} must choose whether to finish it.',
  successAfterimage: 'The mason-lord weighed the valley against the far side, and made up their mind.',
  failureAfterimage: 'The mason-lord stood on the wall all day and could not make up their mind.',
  // THR-2110 decision 5: the rest of the ladder, each naming its cost.
  successAtCostAfterimage:
    'The mason-lord made up their mind, but the doubt cost a week, and the first snow has come.',
  criticalSuccessAfterimage: 'The mason-lord saw both costs plainly, and made up their mind without fear.',
  criticalFailureAfterimage:
    'The mason-lord argued with the crew for a whole day. Half of them put down their tools and went home.',
  purposeLine: 'Weigh the far side',
  // THR-2157 — the fork's argument. Two specials, one per pole of
  // `mercy_ruthlessness`; the Repertoire fills the rest of the hand.
  nudges: [
    {
      id: 'wall.show_the_far_side',
      name: 'Show The Far Side',
      sphere: 'spirit',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
      effectLine: 'Let them see the herders\' fires beyond the pass. Faces on the far side argue for leaving it open.',
      bandProse: {
        success: '{actor} looked west at the herders\' fires, and put the trowel down.',
        failure: '{actor} saw the fires in the west, and the wind blew the smoke away.',
      },
    },
    {
      id: 'wall.count_the_valley',
      name: 'Count The Valley',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
      effectLine: 'Put the valley\'s children in front of them, one by one. Every name argues for finishing the wall.',
      bandProse: {
        success: '{actor} counted the valley\'s children, and picked up the trowel.',
        failure: '{actor} began to count the valley\'s children, and lost the count.',
      },
    },
  ],
  deal: { count: 3, tags: ['craft', 'labor'] },
};

/**
 * Step 1 — Harden Their Resolve (Keeper). The god steels the mason-lord's
 * certainty; the wall rises, fixed and final, and the region is sealed safe.
 */
const step1HardenTheirResolve: ActionStep = {
  reach: 'stone',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god hardens the mason-lord\'s resolve. {actor} stops weighing the far side and orders the crew ' +
    'back to work. The aim is to close the pass before the worst of the winter.',
  successAfterimage: 'The wall rose to its full height, and the valley was sealed safe.',
  failureAfterimage:
    'The wall rose, but one section settled badly in the frozen ground. It shuts out the far side, and it ' +
    'may fail the valley in a harder winter.',
  successAtCostAfterimage:
    'The wall rose to its full height, but a mason fell from the top course in the frost and died.',
  criticalSuccessAfterimage:
    'The wall rose with every course true. Masons will come from far away to study it, and the valley will ' +
    'not fear raiders again in the mason-lord\'s lifetime.',
  criticalFailureAfterimage:
    'The mason-lord pushed the work over a cracked footing and did not stop to fix it. The wall stands ' +
    'finished but unsound, and it will fall in the first hard winter.',
  purposeLine: 'Close the pass',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['craft', 'labor'] },
  successMetadata: { reputationDelta: 0.16 },
  failureMetadata: { reputationDelta: -0.1 },
};

/**
 * Step 1 — Let the Doubt In (Destroyer / divine restraint = "let them handle it").
 * The god stays its hand; the mason-lord's conscience wins; the wall is never
 * finished, and the region stays open — endangered, but with no one walled out.
 */
const step1LetTheDoubtIn: ActionStep = {
  reach: 'stone',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god holds back and lets the doubt work. {actor} thinks again about the herders and towns beyond ' +
    'the pass, which the raiders will reach first. {actor} tells the crew to stop work.',
  successAfterimage: 'The mason-lord walked away, and the half-built wall kept no one out.',
  failureAfterimage:
    'The mason-lord stopped the work but kept guards on the half-wall. The far side does not trust the ' +
    'open pass, and the valley gets no safety from it.',
  successAtCostAfterimage:
    'The mason-lord walked away, but the crew had been paid in grain. The valley lost that grain to a wall ' +
    'no one will finish.',
  criticalSuccessAfterimage:
    'The mason-lord walked away for good. Herders on the far side now speak well of the valley that would ' +
    'not wall them out.',
  criticalFailureAfterimage:
    'The mason-lord could neither finish the wall nor leave it, and kept guard on it all season. The ' +
    'valley lost a season of work and gained no safety.',
  purposeLine: 'Stand the crew down',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['presence', 'social'] },
  successMetadata: { reputationDelta: 0.08 },
  failureMetadata: { reputationDelta: -0.12 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2157 — the mortal decides; the fallback lets the doubt in, as it always did.
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: step1LetTheDoubtIn,
    negative: step1HardenTheirResolve,
  },
  fallback: { ...step1LetTheDoubtIn },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const WALL_RAISED_AFTERMATH = {
  overview:
    'The wall stands across the pass at its full height. For now, it keeps raiders and hungry strangers ' +
    'out of the valley. The lands to the west are shut out, and their people blame the valley and the god. ' +
    'A few of them plan to tear it down.',
  changes: [
    {
      id: 'wall_region_sealed',
      kind: 'future_hook' as const,
      title: 'The Pass Closed',
      detail: 'The wall stands at full height. For now, the valley is closed off from raiders.',
      polarity: 'gain' as const,
    },
    {
      id: 'wall_far_side_doomed',
      kind: 'future_hook' as const,
      title: 'The Lands Shut Outside',
      detail:
        'The herders and towns beyond the pass face the famine and the raiders alone. They blame the god ' +
        'for the wall.',
      polarity: 'loss' as const,
    },
    {
      id: 'wall_mason_marked',
      kind: 'reputation' as const,
      title: 'The Lord Who Closed the Pass',
      detail:
        'The valley honors the mason-lord as its protector. Beyond the wall, people call them the one who ' +
        'shut the gate.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The valley is safe, and the far side is angry. What does the god do next?',
  reactions: [
    {
      id: 'wall_react_consecrate_the_keep',
      label: 'Bless the wall.',
      intent:
        'Bless the wall and the people it guards. The stone becomes a holy boundary, and the mason-lord a ' +
        'founder.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god blesses the great wall. The valley treats it as a holy boundary and settles into its ' +
            'safety.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#fellowship_errand'] },
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The wall becomes a founding legend',
        },
      ],
    },
    {
      id: 'wall_react_tend_the_far_side',
      label: 'Help the lands beyond the wall.',
      intent:
        'Turn to the lands the wall shut out. Help the herders and towns beyond the pass through the winter.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'The god turns to the lands the wall shut out, and helps them through the winter.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.circle_censure',
          delayTicks: 14,
          priority: 1.15,
          seedLabel: 'The walled-out lands reckon with the god',
        },
      ],
    },
  ],
} as const;

const WALL_UNFINISHED_AFTERMATH = {
  overview:
    'The wall stands half-built in the pass, and no more stone goes onto it. The valley faced the famine winter with the pass open, ' +
    'and it shared its grain with strangers from the west. Some of its own children went hungry. Beyond ' +
    'the pass, the herders and towns came through the bad year alive.',
  changes: [
    {
      id: 'wall_unfinished_pass_open',
      kind: 'future_hook' as const,
      title: 'The Pass Left Open',
      detail: 'The wall stands half-built. The valley is exposed, and the road west stays open both ways.',
      polarity: 'mixed' as const,
    },
    {
      id: 'wall_unfinished_valley_cost',
      kind: 'reputation' as const,
      title: 'The Hunger the Valley Chose',
      detail: 'The valley paid for the open pass in thin rations. Not everyone there forgives the mason-lord.',
      polarity: 'loss' as const,
    },
    {
      id: 'wall_unfinished_mercy',
      kind: 'reputation' as const,
      title: 'Lives Saved Beyond the Pass',
      detail: 'People beyond the pass lived who would have died outside the wall. Few of them know why.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The pass stays open, and the valley paid for it. What does the god do now?',
  reactions: [
    {
      id: 'wall_unfinished_react_carry_the_valley',
      label: 'Help the valley.',
      intent:
        'Help the valley through the lean year, so the people who gave up their grain do not carry the cost ' +
        'alone.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god turns to the valley that shared its grain, and helps it through the lean year.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#fellowship_errand'] },
          delayTicks: 16,
          priority: 1.05,
          seedLabel: 'The valley that shared its grain',
        },
      ],
    },
    {
      id: 'wall_unfinished_react_unmake_the_stone',
      label: 'Take the half-wall down.',
      intent:
        'Bless the work of taking the half-wall down. Its stone goes into the valley\'s houses and ' +
        'granaries, and the pass stays open.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god blesses the unmaking of the half-wall. Its stone goes into houses and granaries, and the ' +
            'pass stays open for good.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.circle_censure',
          delayTicks: 20,
          priority: 1.0,
          seedLabel: 'The unmaking of the wall draws notice',
        },
      ],
    },
  ],
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const WALL_OF_THE_MASON_LORD_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'stone.permanence.mason_lord_wall',
  stakes: {
    goal: 'finish the great wall across the pass',
    risk: 'raise a flawed wall that fails both sides',
    won: 'finished the wall and sealed the valley safe',
    lost: 'finished the wall over a weak section',
    lostBadly: 'built the wall on a cracked footing',
    arms: {
      positive: {
        won: 'walked away and left the pass open',
        lost: 'stopped the work but kept guards on it',
        lostBadly: 'stood on the half-wall all season',
      },
    },
  },
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  // THR-1982 — the premise casts a fixed job; a mortal whose trade is outside
  // this list does not draw it (a roleless mortal still does).
  protagonistRoles: ['mason', 'smith', 'noble', 'steward', 'quartermaster', 'commander'],
  name: 'The Wall of the Mason-Lord',
  reach: 'stone',
  crudType: 'create',
  scale: 'regional',

  steps: [step0TheReckoning, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'tradition_novelty'],

  // THR-1515: `settlement` dropped — no location carries that subtype, so it gated nothing.

  locationSubtypes: ['town', 'city', 'fortress'],

  narrativeTemplates: {
    initiation:
      'A mason-lord has built half a great wall across a mountain pass. Finished, it will keep one valley ' +
      'safe through the famine and shut the lands beyond it out. A god can harden the mason-lord\'s ' +
      'resolve, or let the doubt in.',
    success:
      'The mason-lord finishes the wall or walks away from it. If the wall is finished, the lands beyond ' +
      'it are shut out.',
    failure:
      'The work goes wrong. The valley gets a flawed wall, or a half-wall that guards nothing and still ' +
      'frightens the far side.',
  },


  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: WALL_UNFINISHED_AFTERMATH,
      negative: WALL_RAISED_AFTERMATH,
    },
    fallback: { ...WALL_UNFINISHED_AFTERMATH },
  },

  description:
    'A mason-lord can finish a great wall that keeps one valley safe and shuts the lands beyond it out. A '
    + 'god can harden the resolve, or let the doubt in.',
});

export default WALL_OF_THE_MASON_LORD_TEMPLATE;
