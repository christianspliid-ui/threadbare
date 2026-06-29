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
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';

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
  narrativeTemplate:
    'The wall already stood half its height across the pass, and from the top of it the mason-lord could ' +
    'see both the things their choice would decide. Behind, to the east, the valley they had been born in: ' +
    'its terraced fields, its children, its long shelved grain — a whole region that would live out the ' +
    'famine winter in safety if the stone went up. Beyond, to the west, the lands the wall would shut out: ' +
    'the herders already thin, the towns the raiders would reach first once the pass was sealed, the ' +
    'thousands for whom this wall was a sentence written in granite. The mason-lord had laid every course ' +
    'with their own hands and knew exactly what each one cost. They were not a cruel person. They were a ' +
    'person standing on a wall in the wind, with a trowel in one hand and a region behind them, trying to ' +
    'decide whether permanence was the same thing as protection. The god stood at their shoulder, in the ' +
    'same wind, and could feel the weight of the stone and the weight of the far side both.',
  successAfterimage: 'The mason-lord stood on the half-built wall and weighed the region against the lands beyond.',
  failureAfterimage: 'The mason-lord swayed on the high stone, and for a moment could not weigh anything at all.',
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
    'The god set its will against the mason-lord\'s doubt the way a keystone is set against the thrust of ' +
    'an arch — not pushing them, but giving the part of them that wanted to finish something to lean on. ' +
    'And the mason-lord stopped looking west. They looked at the children behind them and at the grain that ' +
    'would feed those children, and the doubt went quiet, and the work went on. Stone by stone the pass ' +
    'closed. When the last course was laid the mason-lord stood back and did not weep — they had decided not ' +
    'to be the kind of person who weeps over a thing they chose on purpose — and the region behind the wall ' +
    'was safe, truly and permanently safe, for the first time in living memory. The wall would outlast the ' +
    'mason-lord. It would outlast the famine. It would outlast the names of everyone it had shut outside to ' +
    'die, and it would keep being a kindness to one valley and a grave-marker to the rest, in the same ' +
    'patient granite, for a very long time.',
  successAfterimage: 'The wall rose to its full height, and one region was sealed permanently safe.',
  failureAfterimage:
    'The resolve held but the work went wrong — a section settled badly in the frozen ground, and the wall ' +
    'rose finished but flawed, safe enough to doom the far side and weak enough to fail the near one some ' +
    'harder winter to come.',
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
    'The god gave the mason-lord nothing to lean on, and let the doubt do what doubt does to a person who ' +
    'is, underneath everything, decent. They stood on the wall and made themselves look west one more time ' +
    '— at the thin herders, at the towns the raiders would reach, at the thousands the granite would ' +
    'sentence — and they could not lay another course. They came down off the wall and they did not go ' +
    'back up. The work stopped at half its height, and a half-wall is no wall at all; it is only a long ' +
    'ridge of stone that a determined enemy walks around. The region stayed open. The famine winter came ' +
    'in over the unsealed pass and the valley shared its long-shelved grain with strangers because there ' +
    'was no wall to tell them not to, and some of the valley\'s children went hungry who would not have, ' +
    'and none of the far side\'s children were left to die behind a barrier with a god\'s blessing on it. ' +
    'The mason-lord never finished anything that grand again. They said, when asked, that they had run out ' +
    'of stone. They had not run out of stone.',
  successAfterimage: 'The wall stood half-built and abandoned, and the pass — and its mercy — stayed open.',
  failureAfterimage:
    'The mason-lord faltered without quite walking away; the wall stood half-built and undefended, and the ' +
    'region got neither the safety of the stone nor the clean conscience of refusing it.',
  successMetadata: { reputationDelta: 0.08 },
  failureMetadata: { reputationDelta: -0.12 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    harden_their_resolve: step1HardenTheirResolve,
    let_the_doubt_in: step1LetTheDoubtIn,
  },
  fallback: { ...step1LetTheDoubtIn },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const WALL_RAISED_AFTERMATH = {
  overview:
    'The wall changed the map and then it changed the people on either side of it. Behind the stone, the ' +
    'valley learned the particular ease of the protected — and the particular forgetting that comes with ' +
    'it, until within a generation the children could not say what was on the far side, only that the wall ' +
    'had always been there and had always been wise. Beyond the stone, the shut-out lands learned the wall ' +
    'as the herders learn weather: a fact, immovable, with a god\'s name behind it. Some of them cursed the ' +
    'valley. Some of them cursed the god. A few of them, the most dangerous, began to study how a permanent ' +
    'thing is unmade. The region was safe. The price of the safety was paid in full by people who never got ' +
    'a vote, and the granite would go on collecting that price, quietly, for as long as it stood.',
  changes: [
    {
      id: 'wall_region_sealed',
      kind: 'future_hook' as const,
      title: 'A Region Made Permanent',
      detail:
        'The wall stands at its full height. The valley behind it is sealed safe — through this famine ' +
        'and the next, and likely past the lifetime of anyone who chose it. Permanence has been bought.',
      polarity: 'gain' as const,
    },
    {
      id: 'wall_far_side_doomed',
      kind: 'future_hook' as const,
      title: 'The Lands Shut Outside',
      detail:
        'The herders, the towns, the thousands beyond the pass were sealed out to face the famine and the ' +
        'raiders alone — with a god\'s blessing on the stone that did it. They will not forget who walled ' +
        'them off.',
      polarity: 'loss' as const,
    },
    {
      id: 'wall_mason_marked',
      kind: 'reputation' as const,
      title: 'The Lord Who Closed the Pass',
      detail:
        'The mason-lord is the one who raised the wall and did not weep. Their region honors them as a ' +
        'protector; everything west of the stone knows them as the hand that turned the key.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The wall stands and the region is safe behind it. The far side is sealed out and beginning to seethe. ' +
    'What does the god do with the permanence it helped raise?',
  reactions: [
    {
      id: 'wall_react_consecrate_the_keep',
      label: 'Consecrate the keeping. Make the wall a blessing the valley lives by.',
      intent:
        'Commit to what was built. Bless the wall and the valley it shelters — make the stone a holy ' +
        'boundary, the protected region a place of order and continuity, the mason-lord a founder. Keeper ' +
        'to the bone, and let the far side fall where it falls.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'wall_consecrated_keeper',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god blesses the great wall and the valley it shelters; the stone becomes a holy boundary, ' +
            'and the region settles into the deep ease of the permanently protected.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The wall becomes a founding legend',
        },
      ],
    },
    {
      id: 'wall_react_tend_the_far_side',
      label: 'Tend the far side. Carry mercy around the stone you raised.',
      intent:
        'Refuse to let the wall be the whole story. The region is sealed, but the god is not bound by its ' +
        'own granite — move the divine attention to the shut-out lands, to the herders and the towns the ' +
        'wall condemned, and be present for the price even while the wall goes on collecting it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'wall_far_side_tended',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god who blessed the wall now walks the lands it shut out — carrying a hard, partial mercy ' +
            'around the very stone it helped raise.',
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
    'A wall that is never finished is the loudest kind of choice, because everyone can see the height it ' +
    'stopped at. The valley behind the half-wall went through the famine winter the hard way — open, ' +
    'frightened, sharing grain it could not spare with people who came over the unsealed pass — and some ' +
    'of its own went hungry for the mercy. They did not all forgive the mason-lord for it. But the far ' +
    'side lived. The herders drove their thin flocks east through a pass that was supposed to be closed to ' +
    'them, and the towns the raiders would have reached first had a valley at their backs instead of a ' +
    'wall in their faces, and the thousands who had been a sentence in granite became, instead, just ' +
    'people who made it through a bad year. No monument records it. The only evidence that a god chose ' +
    'mercy over permanence is a long ridge of dressed stone in a windy pass, going green at the base, ' +
    'finishing nothing, keeping no one out.',
  changes: [
    {
      id: 'wall_unfinished_pass_open',
      kind: 'future_hook' as const,
      title: 'The Pass Left Open',
      detail:
        'The wall stands half-built and abandoned. The region is unsealed and endangered — but the lands ' +
        'beyond the pass were never shut out, and the famine was met by two sides sharing one road.',
      polarity: 'mixed' as const,
    },
    {
      id: 'wall_unfinished_valley_cost',
      kind: 'reputation' as const,
      title: 'The Hunger the Valley Chose',
      detail:
        'The valley behind the half-wall paid for the open pass — grain shared too thin, a winter faced ' +
        'undefended, some of its own going hungry. Not all of them honor the mason-lord for the mercy.',
      polarity: 'loss' as const,
    },
    {
      id: 'wall_unfinished_mercy',
      kind: 'reputation' as const,
      title: 'The Mercy No One Records',
      detail:
        'Thousands beyond the pass lived who would have been walled out to die. None of them know it. ' +
        'There is no monument to a wall that was not built, only the god\'s knowledge of what mercy cost.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The wall stands unfinished and the pass stays open — mercy bought with the valley\'s own hunger. What ' +
    'does the god do with a permanence it chose not to raise?',
  reactions: [
    {
      id: 'wall_unfinished_react_carry_the_valley',
      label: 'Carry the valley. Honor the ones who paid for the mercy.',
      intent:
        'The far side lived because the valley went hungry; do not let that go unhonored. Move the god\'s ' +
        'attention to the people behind the half-wall who shared grain they could not spare — steady them ' +
        'through the lean year, and make sure the cost of an open pass is not paid by them alone.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'wall_unfinished_valley_carried',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god turns toward the valley that chose an open pass and paid for it in hunger — steadying ' +
            'the people whose mercy will never be recorded in any stone.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 16,
          priority: 1.05,
          seedLabel: 'The valley that shared its grain',
        },
      ],
    },
    {
      id: 'wall_unfinished_react_unmake_the_stone',
      label: 'Unmake the stone. Let the half-wall return to the pass.',
      intent:
        'Finish the refusal. A half-wall is still a scar and still a temptation for the next hard-hearted ' +
        'lord to complete; let it come down. Bless the slow work of dismantling it, give the dressed stone ' +
        'back to the valley\'s houses and granaries, and leave the pass as open as the god decided it ' +
        'should be. Destroyer to the bone, in the service of mercy.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'wall_unfinished_unmade',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god blesses the unmaking of the half-wall; the dressed stone goes back into houses and ' +
            'granaries, and the pass is left open on purpose, a refusal made permanent.',
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
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Wall of the Mason-Lord',
  reach: 'stone',
  crudType: 'create',
  scale: 'regional',

  steps: [step0TheReckoning, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'tradition_change'],

  locationSubtypes: ['settlement', 'town', 'city', 'fortress'],

  narrativeTemplates: {
    initiation:
      'A threaded mason-lord stands on a half-built wall across a mountain pass, weighing a permanence ' +
      'against a mercy: raise the stone and seal one region safe behind it, or leave it unfinished and ' +
      'keep the pass — and its danger, and its mercy — open. The god decides whether the doubt holds or breaks.',
    success:
      'The mason-lord makes the choice the god leans them toward — to finish the wall or to walk away from ' +
      'it — and a whole region, and the lands beyond it, are decided by where the stone stops.',
    failure:
      'The work goes wrong in the choosing — a flawed wall, or a faltering that walks away from neither ' +
      'safety nor mercy cleanly — and the region gets the worse of both the granite and the open pass.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'harden_their_resolve',
        label: 'Harden their resolve. Let the wall rise.',
        intent:
          'Give the part of them that wants to finish something to lean on, and let them stop looking west. ' +
          'The wall will go up, fixed and final, and the region behind it will be permanently safe — through ' +
          'this famine and past their own lifetime. The lands beyond the pass will be sealed out to face the ' +
          'winter and the raiders alone, with your blessing on the stone that did it. Permanence is protection ' +
          'for one valley and a sentence for the rest.',
        targetLabel: 'The mason-lord',
        interventionType: 'coercive',
      },
      {
        id: 'let_the_doubt_in',
        label: 'Stay your hand. Let the doubt in.',
        intent:
          'Give them nothing to lean on, and let the decent thing underneath them win. They will look west ' +
          'one more time and not be able to lay another course; the wall will stop at half its height and ' +
          'keep no one out. The region will stay open and endangered — its own children may go hungry sharing ' +
          'grain over an unsealed pass — but no one will be walled outside to die with a god\'s name on the ' +
          'granite. Mercy through impermanence, paid for by the people who chose it.',
        targetLabel: 'The mason-lord',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      harden_their_resolve: WALL_RAISED_AFTERMATH,
      let_the_doubt_in: WALL_UNFINISHED_AFTERMATH,
    },
    fallback: { ...WALL_UNFINISHED_AFTERMATH },
  },

  description:
    'A regional-scale permanence-versus-mercy encounter: a threaded mason-lord can raise a great wall that ' +
    'saves one region by dooming the lands beyond it, and the god decides whether the resolve holds or the ' +
    'doubt breaks it. Reach: stone (Keeper ↔ Destroyer).',
});

export default WALL_OF_THE_MASON_LORD_TEMPLATE;
