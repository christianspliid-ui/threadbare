/**
 * The Unmarked Crossing — reputation-gated encounter, Gold reach, required-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.gold.negative'] — the smuggler needs
 *       a seal already discredited. A clean name would be caught on inspection.
 * Pattern: required-negative — encounter surfaces only when gold.negative is held.
 *
 * THR-147: Final tranche of reputation-gated content.
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

const smugglerSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'smuggler',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['smuggler', 'criminal', 'merchant', 'sailor'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Smuggler',
};

const wharfSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'wharf',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'wharf',
  fallbackName: 'The River Wharf',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [smugglerSpec, wharfSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheManifests: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The wharf had the particular quality of places that exist to move things across ' +
    'boundaries — the specific energy of transit, of cargo that has not yet been ' +
    'declared and may not be declared at all. A barge at the dock. A distant ' +
    'customs house, lit, watching the wrong direction.\n\n' +
    'The smuggler found the agent at the barrel-top near the barge\'s aft line and ' +
    'laid blank manifests and a wax stick on the wood without preamble. The cargo ' +
    'was not named. The wax stick was good quality — the kind you use when the ' +
    'impression matters more than the substance behind it. The smuggler had done ' +
    'their research about what kind of seal would pass on a false manifest: not an ' +
    'official seal, not a clean merchant\'s mark, but the mark of someone whose ' +
    'name on a document was already expected to mean something irregular.\n\n' +
    '"{title}," the smuggler said, which was not a greeting but a calculation made ' +
    'aloud. The ink was dry. The date was tonight. The barge would not be at this ' +
    'wharf by morning.',
  successAfterimage: 'Blank manifests. A wax stick. The barge still at the dock.',
  failureAfterimage: 'The smuggler laid out the offer but something in the approach didn\'t land as they\'d calculated.',
};

const step1SignThePapers: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0.30,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god settled a particular gravity through the agent\'s hands — the weight ' +
    'of commerce conducted in the space that legitimate commerce leaves behind, ' +
    'the recognition that the {title}\'s seal has value precisely because it is ' +
    'not worth authenticating. The smuggler had understood this correctly.\n\n' +
    'The seal pressed. The manifests folded. A percentage of the cargo\'s value ' +
    'was handed across the barrel-top in coin that had not been counted in front ' +
    'of any record. The barge\'s lines were cast off before the customs house ' +
    'changed its angle of attention. By the time the lanterns moved on the water, ' +
    'the manifest was already downriver and the agent was no longer at the wharf.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The seal pressed. The barge downriver before the customs house looked.',
  failureAfterimage: 'The papers signed, but the execution felt unclean — whether the crossing would hold was uncertain.',
};

const step1TakeToOwner: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0.30,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god redirected the agent\'s attention from the barrel-top to the cargo, ' +
    'and from the cargo to the name of the merchant the smuggler had intended to ' +
    'defraud with blank manifests and a borrowed seal. The {title} did not sign the ' +
    'papers. They carried the blank manifests to the merchant\'s factor before the ' +
    'smuggler\'s barge had time to move.\n\n' +
    'The smuggler, watching the barge from the dock, would realize what had happened ' +
    'when they saw the customs house lanterns change angle. They would not have a ' +
    'name for the person who had turned them in. They would have a description ' +
    'that matched the agent at the barrel-top, and a very specific grievance ' +
    'they could not file officially.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The blank manifests went to the merchant\'s factor. The smuggler\'s barge sat at dock too long.',
  failureAfterimage: 'The warning went, but arrived at an awkward angle — the merchant\'s factor wasn\'t certain what to make of it.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    sign_the_papers: step1SignThePapers,
    take_the_manifest_to_its_rightful_owner: step1TakeToOwner,
  },
  fallback: { ...step1SignThePapers },
};

// ─── Aftermath ───────────────────────────────────────────────────

const SIGN_AFTERMATH = {
  overview:
    'The cargo arrived wherever the barge was going. The {title}\'s seal on the ' +
    'manifests meant that any inspection that found them would find a name already ' +
    'associated with irregular commerce — which was either a problem or, for ' +
    'a customs officer with a flexible interpretation of their responsibilities, ' +
    'a pre-existing condition that required no further documentation. ' +
    'The percentage of the cargo was spent. The smuggler had not named the cargo. ' +
    'Somewhere, someone who owned goods they had not declared was now deciding ' +
    'whether what had crossed the river was worth the cost of the questions ' +
    'a careful customs officer would eventually ask.',
  changes: [
    {
      id: 'sign_cargo_crossed',
      kind: 'reputation' as const,
      title: 'The Crossing That Was Never Logged',
      detail: 'A cargo passed under the {title}\'s seal. The manifests are downriver. The customs house will find the discrepancy eventually.',
      polarity: 'mixed' as const,
    },
    {
      id: 'sign_customs_attention',
      kind: 'future_hook' as const,
      title: 'The Customs Officer\'s Questions',
      detail: 'A careful officer has noticed the manifest signature and begun to ask quiet questions.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The barge is downriver. The seal is on those manifests. The customs house will find the discrepancy. Choose what you do with the thread.',
  reactions: [
    {
      id: 'sign_react_let_it_move',
      label: 'Let the cargo keep moving.',
      intent: 'The commission is done. The percentage is held. Let the manifest travel wherever the barge is going.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'concealed_action' as const,
          severity: 0.45,
          label: 'the crossing that was never logged — {title}\'s seal on an unnamed cargo\'s manifests',
          revealFamilies: ['gold.customs', 'merchant', 'river'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s seal crossed a cargo under no name. The barge is downriver. The customs house lamp is moving.',
          significance: 0.55,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.customs_inquiry',
          delayTicks: 30,
          priority: 0.75,
          seedLabel: 'A customs officer begins asking quiet questions about the manifest',
        },
      ],
    },
    {
      id: 'sign_react_trace_the_cargo',
      label: 'Trace where the cargo is going.',
      intent: 'The seal is already on those papers. Learn what cargo was worth crossing under a borrowed reputation.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} signed the manifests and then traced the cargo. What was on that barge is now known.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const TURN_AFTERMATH = {
  overview:
    'The merchant\'s factor had been brisk about it — the blank manifests were evidence ' +
    'of an attempted fraud, which was a matter for the customs authority, not a private ' +
    'matter, which meant it would be handled officially, which meant the smuggler ' +
    'would find out through official channels that their operation at the wharf had ' +
    'been compromised. They did not know who had turned them in. They had a description ' +
    'that matched a specific shape of person at a specific barrel-top, and a ' +
    'grievance that they would carry for some time before they found an opportunity ' +
    'to act on it. The {title} had not, by any official record, been at the wharf at all.',
  changes: [
    {
      id: 'turn_merchant_protected',
      kind: 'reputation' as const,
      title: 'The Protected Merchant',
      detail: 'The fraud was stopped before it crossed. The merchant\'s factor has a record of what was attempted.',
      polarity: 'gain' as const,
    },
    {
      id: 'turn_smuggler_reprisal',
      kind: 'future_hook' as const,
      title: 'The Smuggler\'s Grievance',
      detail: 'The smuggler doesn\'t have a name, but they have a description and a very specific kind of anger.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The fraud is stopped. The merchant is protected. The smuggler is looking for the person at the barrel-top. Choose what you hold from this.',
  reactions: [
    {
      id: 'turn_react_let_stand',
      label: 'Let the record stand as is.',
      intent: 'The manifests are with the factor. The protection is real. Leave it there without adding to it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.smuggler_reprisal',
          delayTicks: 20,
          priority: 0.7,
          seedLabel: 'The smuggler\'s people look for the one who turned them in',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} turned the smuggler\'s blank manifests over to the merchant\'s factor. The smuggler has a description and no name.',
          significance: 0.55,
        },
      ],
    },
    {
      id: 'turn_react_shelter_merchant',
      label: 'Stay close to the merchant\'s factor for a while.',
      intent: 'The smuggler has a grievance and a description. The merchant\'s factor shouldn\'t be left exposed.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} stayed close to the merchant\'s factor after the wharf. The smuggler\'s grievance has a harder target now.',
          significance: 0.5,
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

export const THE_UNMARKED_CROSSING_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.gold.the_unmarked_crossing',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Unmarked Crossing',
  reach: 'gold',
  crudType: 'write',
  scale: 'local',

  steps: [step0TheManifests, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city', 'road'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.gold.negative'],

  narrativeTemplates: {
    initiation:
      'A smuggler at a river wharf lays blank manifests in front of {title}. The cargo ' +
      'is unnamed. The customs house is lit in the wrong direction. A clean seal ' +
      'would be caught on inspection — but a seal already known for irregular commerce ' +
      'is expected to appear on exactly this kind of manifest.',
    success:
      'The manifests moved one way or the other: either downriver with the barge or ' +
      'across town to the merchant\'s factor. The wharf will look different by morning.',
    failure:
      'The arrangement stalled at the barrel-top — the manifests neither signed nor ' +
      'delivered, the smuggler uncertain whether to cast off lines.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-unmarked-crossing.png',
  illustrationAlt: 'Wide shot: river wharf at dusk, barge at dock, two figures at a barrel with blank papers, distant customs house lit, Threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'sign_the_papers',
        label: 'Press the seal. Take the cut.',
        intent:
          'The god settles the agent into the particular gravity of commerce conducted ' +
          'in the space that legitimate commerce leaves behind. {title}\'s seal has ' +
          'value on this document precisely because it is expected to carry weight ' +
          'without scrutiny — the customs house has already learned to expect this ' +
          'name on manifests that don\'t bear close inspection. The barge gets clear. ' +
          'The percentage arrives that evening.',
        essenceCost: 1,
        likelyBurden:
          'A seal on an unnamed cargo is a record, even if it\'s the wrong kind of record. ' +
          'The customs house will find the manifest eventually, and it will have ' +
          'this name on it.',
        interventionType: 'coercive',
      },
      {
        id: 'take_the_manifest_to_its_rightful_owner',
        label: 'Take the blank manifests to the merchant they were meant to defraud.',
        intent:
          'The god turns the agent away from the barrel-top and toward the person the ' +
          'blank manifests were designed to harm. {title}\'s standing was being used ' +
          'as a tool for fraud. The merchant\'s factor gets the evidence before ' +
          'the barge casts off lines. The smuggler has a grievance they can\'t file.',
        essenceCost: 0,
        likelyBurden:
          'A smuggler who doesn\'t know your name but has a description and a specific ' +
          'kind of anger will eventually find an opportunity to act on it.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      sign_the_papers: SIGN_AFTERMATH,
      take_the_manifest_to_its_rightful_owner: TURN_AFTERMATH,
    },
    fallback: { ...SIGN_AFTERMATH },
  },
});

export const THE_UNMARKED_CROSSING_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_UNMARKED_CROSSING_TEMPLATE);
