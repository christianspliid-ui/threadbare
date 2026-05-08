/**
 * The Star Pilgrim — reputation-gated encounter, Star reach, required-positive + blocked-by-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.star.positive']
 *       AND blocked when target has 'trait.reputation.star.negative'.
 * Pattern: required + blocked — the encounter requires genuine star-touched standing;
 *          those with tainted divine reputation cannot access it.
 *
 * THR-146: Middle tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';
import { parseEncounterContract } from '../encounter-contract-validators';
import type {
  EncounterArchetypePole,
  EncounterChoiceCost,
  EncounterChoiceReach,
  EncounterContract,
} from '../../types/encounter-contract';
import { MORAL_AXIS_POLES_BY_REACH, QUINTESSENCE_POLES } from '../../types/encounter-contract';

// ─── Support Bundle ──────────────────────────────────────────────

const fatherSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'father',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['civilian', 'traveler', 'pilgrim'],
  supportRole: 'pilgrim_father',
  spawnNpcRole: 'civilian',
  spawnName: 'the Father',
};

const childSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'child',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  reuseNpcRoles: ['civilian'],
  supportRole: 'pilgrim_child',
  spawnNpcRole: 'civilian',
  spawnName: 'the Child',
};

const shrineSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'shrine',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'shrine',
  fallbackName: 'The Roadside Shrine',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [fatherSpec, childSpec, shrineSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheChild: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The father had walked seven days with the child on his shoulders, which was visible ' +
    'in the set of his neck and the way he moved — not tired exactly, but past the point ' +
    'where tired was the word that applied. The child\'s breathing was shallow in the ' +
    'particular way that means the body is working at something the rest of the system ' +
    'is not being told about.\n\n' +
    'The father did not speak first. He stopped when the agent appeared and stood in the ' +
    'road and waited. Then he unwrapped the blanket from around the child\'s shoulders — ' +
    'slowly, the way people move when they are doing something they have been rehearsing ' +
    'for a long time and are now doing for the last time. He did not say {title}. ' +
    'He did not say anything. The unwrapping was the speech.',
  successAfterimage: 'The blanket folded back. The child\'s shallow breath. The father waiting.',
  failureAfterimage: 'The unwrapping, and then a silence that arrived at the wrong angle.',
};

const step1ChannelRadiance: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.08 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god reached through whatever it uses to reach through things — the channel that ' +
    'star-touch runs through when it runs — and set it moving toward the child. Not ' +
    'curative exactly. Not a repair of something broken. More like a realignment of the ' +
    'terms the child\'s body was operating under.\n\n' +
    'The father felt it before the child did. His hands tightened on the child\'s legs ' +
    'and then released, the way hands release when they recognize that what they are ' +
    'holding has changed. The child\'s breathing shifted — not dramatically, not suddenly, ' +
    'but in the way that a room shifts when someone opens a window: the air is the same ' +
    'air, but it is moving now. The child opened their eyes. They looked at the agent. ' +
    'They did not say anything. They looked at their father. The father said: {title}. ' +
    'It was the first word he had said since stopping.',
  successMetadata: { reputationDelta: 0.08 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The child\'s breathing shifted. The father\'s hands released. The first word said.',
  failureAfterimage: 'The reach moved, but what it arrived at was not quite the shape the child\'s body needed — partial, unresolved.',
};

const step1BlessAndSend: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0.25,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not call the full channel. What it gave instead was a direction and a ' +
    'blessing of the kind that does not guarantee outcomes but changes the quality of the ' +
    'road toward them. The agent laid hands on the child\'s forehead for a moment — the ' +
    'old form, which the father recognized from something his own grandmother had done, ' +
    'which was not coincidence — and then pointed northeast, toward the sister shrine ' +
    'the {title} knew was three hours\' travel on a flat road.\n\n' +
    'The father listened. He wrapped the child back in the blanket. He turned northeast. ' +
    'He had not said thank you yet, which some people read as ingratitude and the god ' +
    'read correctly as a man who had run out of the kind of emotional surplus that thanks ' +
    'requires and was saving everything remaining for the walk.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The father turned northeast. The walk had a direction now.',
  failureAfterimage: 'The direction was given, but something in the blessing did not land with full weight.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    channel_the_radiance: step1ChannelRadiance,
    bless_and_send_onward: step1BlessAndSend,
  },
  fallback: { ...step1BlessAndSend },
};

// ─── Aftermath ───────────────────────────────────────────────────

const RADIANCE_AFTERMATH = {
  overview:
    'The father carried the child the rest of the way to the nearest settlement — ' +
    'not because the child could not walk, but because the child was asleep, which was ' +
    'the first time they had slept without waking in eleven days. The village healer ' +
    'examined the child and said: I don\'t know what changed, but something did. ' +
    'The father said nothing. The healer was not asking for an answer. In the next ' +
    'settlement, and then the next, people began saying that a child who had been ' +
    'dying was not dying anymore, and they began saying the word {title} in the same ' +
    'breath, and the word traveled faster than the father did.',
  changes: [
    {
      id: 'radiance_miracle_witnessed',
      kind: 'reputation' as const,
      title: 'The Miracle',
      detail: 'A child who had been dying was not dying anymore. The word for what changed was the {title}\'s name.',
      polarity: 'gain' as const,
    },
    {
      id: 'radiance_pilgrimage_starting',
      kind: 'future_hook' as const,
      title: 'The Next Valley',
      detail: 'The story is moving faster than the father. The next valley is already expecting something.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'A miracle was witnessed. The story is moving. Choose what you do with what it is becoming.',
  reactions: [
    {
      id: 'radiance_react_let_spread',
      label: 'Let the story carry what it carries.',
      intent: 'The miracle is what happened. What the next valley makes of it is their question, not the god\'s.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.5,
          label: 'the pilgrim child who lived — miracle witnessed by the father and the village healer',
          revealFamilies: ['star.miracle', 'pilgrim', 'divine'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} reached through the star-channel and a child\'s breathing changed. The story is moving through the valley.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.wider_pilgrimage',
          delayTicks: 40,
          priority: 0.85,
          seedLabel: 'Word of the healing reaches the next valley',
        },
      ],
    },
    {
      id: 'radiance_react_quiet',
      label: 'Try to quiet the story.',
      intent: 'Not every miracle should become a pilgrimage route. Press for quieter witness.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} reached through the star-channel. The father was asked not to describe what he saw. He agreed. He does not know if he can keep that agreement.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const BLESS_AFTERMATH = {
  overview:
    'The father reached the sister shrine before evening. The keeper there — an old woman ' +
    'who had been tending that shrine for thirty years and had seen people arrive in many ' +
    'conditions — took one look at the child and said: sit, and began a different kind of ' +
    'care than the father had been able to provide alone. The child responded to it. ' +
    'Three days later the child was eating. Three days after that they were walking. ' +
    'The father sent a letter to no one in particular — addressed it to the shrine on the ' +
    'northeast road, to whoever had said: go there — saying that the child was walking ' +
    'and that he did not know how to name what had happened but was naming it anyway: ' +
    '{title}\'s mercy, which was as close as he could get.',
  changes: [
    {
      id: 'bless_referred_healing',
      kind: 'reputation' as const,
      title: 'The Shrine Keeper',
      detail: 'The direction was good. The keeper had what the father needed. The child walked.',
      polarity: 'gain' as const,
    },
    {
      id: 'bless_letter_sent',
      kind: 'future_hook' as const,
      title: 'The Letter to No One',
      detail: 'A letter was sent to the shrine. The father named what happened.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The child is walking. The letter arrived at the shrine. Choose what the direction\'s outcome means.',
  reactions: [
    {
      id: 'bless_react_acknowledge',
      label: 'Acknowledge the letter.',
      intent: 'The father named it. Let the god confirm what he named was real.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 1 },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.referred_pilgrim',
          delayTicks: 25,
          priority: 0.7,
          seedLabel: 'The father\'s journey continues with a different quality',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sent the father northeast. The child walked. The father named it mercy.',
          significance: 0.55,
        },
      ],
    },
    {
      id: 'bless_react_leave',
      label: 'Leave the letter unanswered.',
      intent: 'The blessing was real but does not need acknowledgment to have been what it was.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sent a father and child northeast. The child walked. The letter at the shrine waits.',
          significance: 0.45,
        },
      ],
    },
  ],
} as const;



const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
const DEFAULT_FORECAST_FACTORS = ['threads shifting'] as const;
const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
const DEFAULT_TILTS_TOWARD = 'uncertain';
const DEFAULT_FALL_FORWARD = 'the threads tighten';
const DEFAULT_AGENT_REACTION = 'the moment shifts';

const EFFECTIVE_INTERVENTION_TO_COST: Record<EncounterChoiceIntervention, EncounterChoiceCost> = {
  supportive: 'small_breath',
  coercive: 'deep_draught',
  withdrawn: 'small_breath',
};

type EncounterChoiceIntervention = NonNullable<
  NonNullable<UnifiedActionTemplate['authoredChoices']>[number][number]['interventionType']
>;

type EncounterAuthoredChoice = NonNullable<NonNullable<UnifiedActionTemplate['authoredChoices']>[number]>[number];

function toEncounterChoiceCost(choice: EncounterAuthoredChoice): EncounterChoiceCost {
  if (choice.interventionType) {
    return EFFECTIVE_INTERVENTION_TO_COST[choice.interventionType];
  }

  if (choice.essenceCost === undefined || choice.essenceCost <= 1) {
    return 'small_breath';
  }
  if (choice.essenceCost === 2) {
    return 'fuller_breath';
  }
  return 'deep_draught';
}

function toStepFallbackReach(template: UnifiedActionTemplate, stepIndex: number): EncounterChoiceReach {
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  if (step && 'reach' in step && typeof step.reach === 'string') {
    return step.reach;
  }

  if (step && 'fallback' in step && step.fallback && typeof step.fallback.reach === 'string') {
    return step.fallback.reach;
  }

  return template.reach;
}

function toEncounterChoiceReach(
  template: UnifiedActionTemplate,
  stepIndex: number,
  choice: EncounterAuthoredChoice,
): EncounterChoiceReach {
  const nextStep = template.steps[stepIndex + 1] as UnifiedActionTemplate['steps'][number] | undefined;
  if (
    nextStep &&
    'variants' in nextStep &&
    choice.id &&
    typeof nextStep.variants === 'object' &&
    nextStep.variants !== null
  ) {
    const matchingVariant = (nextStep.variants as Record<string, { reach?: string }>)[choice.id];
    if (matchingVariant && typeof matchingVariant.reach === 'string') {
      return matchingVariant.reach as EncounterChoiceReach;
    }
  }

  return toStepFallbackReach(template, stepIndex);
}

function toEncounterArchetypePole(reach: EncounterChoiceReach, choice: EncounterAuthoredChoice): EncounterArchetypePole {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  if (choice.interventionType === 'coercive') {
    return poles[1];
  }
  return poles[0];
}

function encodeEncounterContractMetadata(contract: EncounterContract): string {
  return `${ENCOUNTER_CONTRACT_METADATA_KEY}:${JSON.stringify(contract)}`;
}

function buildFallbackEncounterChoice(template: UnifiedActionTemplate, stepIndex: number, reach: EncounterChoiceReach) {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  return {
    reach,
    cost: 'small_breath' as const,
    god_verb: `choice-${stepIndex + 1}`,
    agent_reaction: step && 'successAfterimage' in step ? (step.successAfterimage ?? DEFAULT_AGENT_REACTION) : DEFAULT_AGENT_REACTION,
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward: step && 'failureAfterimage' in step ? (step.failureAfterimage ?? DEFAULT_FALL_FORWARD) : DEFAULT_FALL_FORWARD,
  };
}

function buildLiteEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const authoredChoices = template.authoredChoices ?? {};
  const rawStepIndexes = Object.keys(authoredChoices).map((key) => Number(key)).filter((value) => Number.isInteger(value));
  const stepIndexes = (rawStepIndexes.length > 0 ? rawStepIndexes : template.steps.map((_, index) => index)).sort((a, b) => a - b);
  const capabilityAxisReach = template.reach === 'quintessence' ? 'star' : template.reach;

  const beats = stepIndexes.map((stepIndex) => {
    const encounterChoices = (authoredChoices[stepIndex] ?? []) as readonly EncounterAuthoredChoice[];
    const stepReach = toStepFallbackReach(template, stepIndex);
    const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;

    const mappedChoices = encounterChoices.map((choice) => {
      const reach = toEncounterChoiceReach(template, stepIndex, choice);
      return {
        reach,
        cost: toEncounterChoiceCost(choice),
        god_verb: choice.label,
        agent_reaction: choice.intent ?? DEFAULT_AGENT_REACTION,
        tilts_toward: choice.targetLabel ?? DEFAULT_TILTS_TOWARD,
        moral_axis_pole: toEncounterArchetypePole(reach, choice),
        fail_forward: choice.likelyBurden ?? DEFAULT_FALL_FORWARD,
      };
    });

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: DEFAULT_FORECAST_FACTORS,
      prose: step && 'narrativeTemplate' in step ? (step.narrativeTemplate ?? template.narrativeTemplates.initiation) : template.narrativeTemplates.initiation,
      prose_tooltips: {},
      encounter_choices: mappedChoices.length > 0
        ? mappedChoices
        : [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
    };
  });

  return parseEncounterContract({
    encounter: {
      id: template.id,
      protagonist: 'actor.placeholder',
      category: 'branching',
      rarity_tier: template.rarityTier,
      intrinsic_tier: template.intrinsicTier,
      place: {
        location: 'location.placeholder',
        ambient_state: {},
        painting: template.illustrationUrl ?? '/concept-art/encounters/placeholder.jpg',
      },
      cast: [],
      scene_state: {
        threads_in_play: [],
        factions_here: [],
        place_conditions: [],
        conditions_on_protagonist: [],
      },
      protagonist_view: {
        capability_axes: [capabilityAxisReach, capabilityAxisReach, capabilityAxisReach],
        items_relevant: [],
        vows_active_per_beat: {},
        callback_candidates: [],
        state_descriptor: template.description ?? DEFAULT_STATE_DESCRIPTOR,
      },
      beats,
      aftermath: {
        receipt: template.narrativeTemplates.success,
        changes: [],
      },
      ascendant_hand_filter: {
        eligible: [],
        rare_pulse: [],
      },
    },
  });
}

function withEncounterContract(template: UnifiedActionTemplate): UnifiedActionTemplate {
  const contract = buildLiteEncounterContract(template);
  return {
    ...template,
    illustrationAlt: encodeEncounterContractMetadata(contract),
  };
}

// ─── Template ────────────────────────────────────────────────────

export const THE_STAR_PILGRIM_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.star.the_star_pilgrim',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Star Pilgrim',
  reach: 'star',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheChild, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'hamlet', 'road', 'wilderness'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.star.positive'],

  narrativeTemplates: {
    initiation:
      'A sick child carried on a father\'s shoulders reaches {title} — the parents walked ' +
      'seven days believing the star-touch of the target can cure what village healers could not.',
    success:
      'Something that was closed opened — through the star-channel directly, or through ' +
      'a direction that led to someone who could help. The child is breathing differently now.',
    failure:
      'The reach moved but did not arrive fully. The father left with a direction and something ' +
      'less certain than a miracle.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-star-pilgrim.webp',
  illustrationAlt: 'Wide shot: father holding cloth-wrapped child, shrine lintel behind them, dawn light, Threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'channel_the_radiance',
        label: 'Call the star-channel. Let the radiance through.',
        intent:
          'The god opens the full channel — the one that costs essence because it is not ' +
          'metaphor, it is actual reach through the medium the star-domain operates in. ' +
          'What arrives in the child is a realignment, not a cure. Whether that distinction ' +
          'matters to the father is not the god\'s to decide.',
        essenceCost: 2,
        likelyBurden:
          'What happens to the child will be described as a miracle. The story will move ' +
          'faster than the father. The next valley is already waiting for something.',
        interventionType: 'supportive',
      },
      {
        id: 'bless_and_send_onward',
        label: 'Lay hands. Give a direction. Point to the sister shrine.',
        intent:
          'The god does not call the full channel. It gives what it can give without ' +
          'the full essence cost: the old form, a direction, a blessing that changes ' +
          'the quality of the road rather than the road\'s destination. The shrine keeper ' +
          'there knows what to do with what arrives.',
        essenceCost: 1,
        likelyBurden:
          'The father will walk three more hours. What happens at the shrine is the ' +
          'keeper\'s work, not the god\'s. The outcome is less certain but not absent.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      channel_the_radiance: RADIANCE_AFTERMATH,
      bless_and_send_onward: BLESS_AFTERMATH,
    },
    fallback: { ...BLESS_AFTERMATH },
  },
});

export const THE_STAR_PILGRIM_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_STAR_PILGRIM_TEMPLATE);
