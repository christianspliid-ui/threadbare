/**
 * The Executioner's Commission — reputation-gated encounter, Iron reach, required-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.iron.negative'] — the magistrate seeks
 *       a hand already stained. A clean name would be caught on inspection.
 * Pattern: required-negative — encounter surfaces only when iron.negative is held.
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

const magistrateSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'magistrate',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['magistrate', 'official', 'judge', 'noble'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Magistrate',
};

const cloistersSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'courthouse_cloister',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'cloister',
  fallbackName: 'The Courthouse Cloister',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [magistrateSpec, cloistersSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheOffer: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The cloister was not a place people came unless they had already decided something. ' +
    'Stone arches, lamplight pooled on flagstones, the particular cold that courthouses ' +
    'hold even in summer — the kind of cold that is not weather but architecture, the ' +
    'accumulated chill of proceedings that had been conducted here for longer than anyone ' +
    'now living could remember.\n\n' +
    'The magistrate was seated at a writing desk near the far arch, which was a strange ' +
    'place to have a writing desk unless the magistrate had chosen it because it was not ' +
    'visible from the door. They looked up when the agent entered. Not surprised. The ' +
    'magistrate had arranged for this meeting to happen in the way people arrange for ' +
    'meetings when they cannot be seen to have arranged them.\n\n' +
    'The offer was wrapped in the particular language of plausible deniability: ' +
    'assistance with a civic matter, compensation for a service rendered, an arrangement ' +
    'that the law would not need to know about because the law had put the magistrate in ' +
    'a position where it could not know about it. A name was named. The date was ' +
    'tomorrow. "{title}," the magistrate said, and did not finish the sentence, because ' +
    'the sentence had already been finished by the lamplight and the desk and the ' +
    'choice of meeting place.',
  successAfterimage: 'A name. Tomorrow. The magistrate\'s hands stayed flat on the desk.',
  failureAfterimage: 'The offer was laid out, but something in the room hadn\'t settled into its full weight yet.',
};

const step1CarryOut: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 4 },
  difficulty: 0.35,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god pressed a current of grim purpose through the agent — not heat, not righteousness, ' +
    'but the cold specific gravity of work that has been accepted and must now be done. ' +
    'The magistrate had offered debt erasure and coin; the god understood that what the ' +
    'magistrate had actually offered was a mirror of the agent\'s standing: the work ' +
    'that only {title} could do.\n\n' +
    'The sentence was carried. The magistrate never thanked the agent by name — ' +
    'there was no name, in the official record, to thank. The debt was erased quietly, ' +
    'through channels the magistrate had not explained and did not need to explain. ' +
    'The coin arrived the following evening, counted, no note. The courthouse had ' +
    'the particular stillness of a building that has gotten what it needed.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'Carried. The debt erased. The magistrate did not look up when the agent left.',
  failureAfterimage: 'The work was attempted but something slipped in the execution — the magistrate\'s expression held a question.',
};

const step1WarnTheCondemned: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0.25,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not press for compliance. It pressed for the opposite: the particular ' +
    'kind of resolve that turns away from a clean exit and chooses the expensive one ' +
    'instead. The agent left the magistrate waiting in the cloister. Word went ' +
    'out by a different path — not official, not traceable — that the blade was coming ' +
    'and from which direction.\n\n' +
    'The condemned had time. Whether they used it was their own. The magistrate, ' +
    'who had remained at the writing desk in the cloister until it was too late for ' +
    'the arrangement to proceed, would eventually understand that {title} had refused ' +
    'a commission that had seemed, given the agent\'s reputation, like an obvious ' +
    'acceptance. The magistrate would file this understanding somewhere inconvenient.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'Word sent. The condemned had time. The magistrate sat in the cloister waiting for work that wasn\'t coming.',
  failureAfterimage: 'Word went out, but the route was imperfect — whether the warning arrived in time was unclear.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    carry_out_the_commission: step1CarryOut,
    refuse_and_warn_the_condemned: step1WarnTheCondemned,
  },
  fallback: { ...step1CarryOut },
};

// ─── Aftermath ───────────────────────────────────────────────────

const CARRY_AFTERMATH = {
  overview:
    'The magistrate\'s unnamed hand had done unnamed work. This was how the courthouse ' +
    'had always operated — not through corruption exactly, but through the quiet ' +
    'understanding that the law has two surfaces, and that someone must tend the underside. ' +
    'The name that had been named at the cloister desk was no longer a name that would ' +
    'cause problems for the magistrate. The agent\'s debt was gone. There were no records. ' +
    'There was, however, a family. Families, in the experience of anyone who had been ' +
    'doing this work long enough, always found out. The question was only when, and ' +
    'what they did with the finding.',
  changes: [
    {
      id: 'carry_commission_done',
      kind: 'reputation' as const,
      title: 'The Commission Carried',
      detail: 'The magistrate\'s unnamed work is done. The debt is cleared. The family will eventually ask questions.',
      polarity: 'mixed' as const,
    },
    {
      id: 'carry_kin_of_condemned',
      kind: 'future_hook' as const,
      title: 'The Kin of the Condemned',
      detail: 'A family learned that a sentence was carried by a name they could not find in any record.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The work is done. The coin is counted. The family is asking quiet questions. Choose what you hold from this.',
  reactions: [
    {
      id: 'carry_react_let_it_stand',
      label: 'Let the commission stand as it is.',
      intent: 'The work was accepted and done. Its weight is what it is — carry it without adjustment.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'reputation_note' as const,
          severity: 0.5,
          label: 'the magistrate\'s unnamed hand — a sentence carried without record',
          revealFamilies: ['iron.inquest', 'magistrate', 'courthouse'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} carried a sentence in the dark of the courthouse cloister. No record names them. The family is beginning to ask.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.kin_of_the_condemned',
          delayTicks: 30,
          priority: 0.8,
          seedLabel: 'The family of the executed seeks the hand that fell',
        },
      ],
    },
    {
      id: 'carry_react_distance',
      label: 'Put distance between yourself and the courthouse.',
      intent: 'The commission is done but the proximity is dangerous. Move the connection away from any record of the magistrate.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} carried the commission and then put ground between themselves and the cloister. The magistrate has no name to protect now.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

const WARN_AFTERMATH = {
  overview:
    'The magistrate had waited in the cloister for two hours before concluding the ' +
    'arrangement was not proceeding. This was not a conclusion the magistrate had ' +
    'expected to reach. They had done their research. They had understood what kind ' +
    'of agent {title} was and what such an agent would do with a plausible-deniable ' +
    'offer and a clean debt-erasure. The refusal was a data point the magistrate ' +
    'had not filed for. They would spend some time deciding what it meant, and the ' +
    'decision they arrived at would shape what they did in the quieter chambers ' +
    'of the courthouse. The condemned, for their part, had used the warning well.',
  changes: [
    {
      id: 'warn_commission_refused',
      kind: 'reputation' as const,
      title: 'The Refused Commission',
      detail: 'The magistrate expected compliance. The refusal is a data point they don\'t know what to do with yet.',
      polarity: 'gain' as const,
    },
    {
      id: 'warn_magistrate_vengeance',
      kind: 'future_hook' as const,
      title: 'The Magistrate\'s Quiet Decision',
      detail: 'A magistrate who expected an unnamed hand and got a refusal instead is now filing a different kind of response.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The commission was refused. The condemned had warning. The magistrate is deciding what to do with the refusal. Choose what you do next.',
  reactions: [
    {
      id: 'warn_react_hold',
      label: 'Hold still and let the magistrate decide.',
      intent: 'The refusal spoke for itself. Let the magistrate process it without further action.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'iron.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.magistrate_vengeance',
          delayTicks: 25,
          priority: 0.75,
          seedLabel: 'The magistrate moves against the {title} in quieter chambers',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} refused the commission and warned the condemned. The magistrate waited alone in the cloister.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'warn_react_expose',
      label: 'Take what you know about the commission to a rival of the magistrate.',
      intent: 'The refused commission is leverage. Move it through the court\'s other channels before the magistrate can.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} moved what they knew about the cloister meeting through a rival\'s hands. The magistrate has a new problem now.',
          significance: 0.65,
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

export const THE_EXECUTIONERS_COMMISSION_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.iron.the_executioners_commission',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Executioner\'s Commission',
  reach: 'iron',
  crudType: 'write',
  scale: 'local',

  steps: [step0TheOffer, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.iron.negative'],

  narrativeTemplates: {
    initiation:
      'A magistrate finds {title} in the courthouse cloister at night. The commission ' +
      'is wrapped in the language of plausible deniability: a civic matter, a ' +
      'sentence, a name. The law cannot afford a clean hand for this. The magistrate ' +
      'needs one that is already stained.',
    success:
      'The cloister meeting resolved itself into either work done in silence or a ' +
      'warning sent by a path the magistrate couldn\'t trace. Either way, the ' +
      'commission is no longer pending.',
    failure:
      'The meeting left the commission in an uncertain state — the magistrate unclear ' +
      'on whether the work would proceed, the agent unclear on the full terms of what ' +
      'had been offered.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-executioners-commission.png',
  illustrationAlt: 'Wide shot: two figures in a vaulted stone cloister at night, lamplight pooled on flagstones, one seated at a writing desk, the other standing in shadow.',

  authoredChoices: {
    0: [
      {
        id: 'carry_out_the_commission',
        label: 'Carry out the commission.',
        intent:
          'The god does not soften the weight. It settles the agent into the particular ' +
          'cold purpose of work accepted under the law\'s underside: the magistrate ' +
          'needs a hand already stained because the law cannot afford one that isn\'t, ' +
          'and {title} is the hand the courthouse found in the dark. The debt is ' +
          'erased. The work is done. No record names who did it.',
        essenceCost: 1,
        likelyBurden:
          'A commission carried without record is still a weight. The family of the ' +
          'condemned will find the shape of the hand even without the name.',
        interventionType: 'coercive',
      },
      {
        id: 'refuse_and_warn_the_condemned',
        label: 'Refuse. Warn the condemned instead.',
        intent:
          'The god turns the agent away from the clean exit and toward the expensive ' +
          'one. The commission was offered because {title}\'s standing made acceptance ' +
          'seem obvious. The refusal is a surprise the magistrate hasn\'t prepared for. ' +
          'The condemned gets time. The magistrate waits in the cloister.',
        essenceCost: 0,
        likelyBurden:
          'A magistrate whose commission was refused by someone they expected to comply ' +
          'is now deciding what to do about the refusal. The quieter chambers of the ' +
          'courthouse have a long memory.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      carry_out_the_commission: CARRY_AFTERMATH,
      refuse_and_warn_the_condemned: WARN_AFTERMATH,
    },
    fallback: { ...CARRY_AFTERMATH },
  },
});

export const THE_EXECUTIONERS_COMMISSION_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_EXECUTIONERS_COMMISSION_TEMPLATE);
