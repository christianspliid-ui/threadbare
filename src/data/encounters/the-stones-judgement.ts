/**
 * The Stone's Judgement — reputation-gated encounter, Stone reach, tier-sensitive L3.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.stone.positive'] — Steadfast Builder.
 * Pattern: tier-sensitive — intended for L3 (Legendary) standing. The rarity and
 *          encounter weight reflect the prestige threshold; engine-level tier checking
 *          is a future enhancement (THR-32a onwards).
 *
 * THR-32: First tranche of reputation-gated content.
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

const elderSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'elder',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['elder', 'mayor', 'arbitrator', 'judge'],
  supportRole: 'settlement elder',
  spawnNpcRole: 'elder',
  spawnName: 'the Elder',
};

const marketSquareSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'market_square',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'market',
  fallbackName: 'The Market Square',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [elderSpec, marketSquareSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheDispute: ActionStep = {
  reach: 'stone',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The square had been prepared for it: the rough stone slab cleared of its usual market ' +
    'stalls, the crowds arranged in loose arcs on either side, the two parties positioned ' +
    'where they had always been positioned for these things — opposite each other, neither ' +
    'more than twelve feet from the other, close enough to feel the heat of the dispute but ' +
    'not so close that a word could become a blow before anyone intervened.\n\n' +
    'The elder was waiting. They had the posture of someone who had handled many difficult ' +
    'things in their years — not relaxed, not tense, but calibrated to the weight of what ' +
    'was required of them. When the agent arrived at the edge of the square, the elder looked ' +
    'up and said: "The {title}. I had hoped you would come." Not gratitude — a specific and ' +
    'considered form of relief. They had sent word three days ago. The fact that the agent ' +
    'had come at all was already an answer to the question the elder had not known how to ask.\n\n' +
    'The dispute had been building for two seasons. One party held a deed that predated the ' +
    'settlement\'s second wall. The other had built on the same ground and transformed it into ' +
    'something the settlement needed now. Both claims were real. Both could not be honored ' +
    'fully without dishonoring the other. The elder had tried three times and failed three ' +
    'times. The parties would accept a fourth ruling only if the one who ruled was beyond the ' +
    'usual reach of appeal.\n\n' +
    'That was why the elder had sent for the Steadfast Builder. Because only a word from ' +
    'someone who had built as much as the agent had built would carry enough weight to close ' +
    'this without reopening.',
  successAfterimage: 'The square, the stone slab, the two parties held apart by the distance of twelve feet and a long season of grievance. The elder waited.',
  failureAfterimage: 'The parties watched the agent arrive — measuring, uncertain whether the Steadfast Builder\'s word would carry the weight this dispute required.',
};

const step1RuleForOlderClaim: ActionStep = {
  reach: 'stone',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.10 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god drew the agent\'s authority toward what the stone remembered: the first deed, ' +
    'the older claim, the weight of what had been there before. Not sentiment — a technical ' +
    'reckoning with time. The older claim had been honored by every iteration of this ' +
    'settlement. To dishonor it now would be to say that time itself could be bought out, ' +
    'that prior commitment had a shelf life after which it became renegotiable. The agent ' +
    'stated this. The square was quiet enough that even the party with the newer claim could ' +
    'hear every word.\n\n' +
    'The {title}\'s ruling was this: the deed holds. The transformation built upon it holds ' +
    'also, but as a tenant of what came before — the newer party may remain, may continue, ' +
    'but the ground beneath them belongs to the older claim, and that accounting will need ' +
    'to be settled in money and time, not in precedent.\n\n' +
    'It was not the ruling either party had wanted, but it was the ruling both parties could ' +
    'recognize as fair in the architecture of its reasoning. The elder exhaled once, quietly. ' +
    'The party with the older deed stood still for a moment and then nodded — a very small ' +
    'motion, as though they were afraid the ruling would rescind if they acknowledged it too ' +
    'loudly. The party with the newer claim said nothing. Their silence was not agreement. ' +
    'It was the specific silence of people who intend to think about this for a long time.',
  successMetadata: { reputationDelta: 0.10 },
  failureMetadata: { reputationDelta: -0.05 },
  successAfterimage: 'The older claim affirmed. The square accepted it — not warmly, but correctly. The elder\'s exhale was the only sound.',
  failureAfterimage: 'The ruling did not land cleanly — one party found the gap in it before the agent finished speaking, and the square felt it.',
};

const step1RuleForTransformingClaim: ActionStep = {
  reach: 'stone',
  duration: { min: 3, max: 4 },
  difficulty: 0.50,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.05 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god oriented the agent toward the grain of the world as it was now running — what ' +
    'the settlement had become in the two seasons since the dispute began, what it needed ' +
    'to become in the two seasons ahead. The deed from before the second wall was a document ' +
    'of what had once been true. The thing the newer party had built was a fact about what ' +
    'was true now, and facts accumulated weight whether or not they held title.\n\n' +
    'The {title}\'s ruling was this: the transformation stands. The newer claim converts to ' +
    'ownership, because to unwind it now would cost the settlement more than the older deed ' +
    'was worth. Compensation to the older party was mandated — not what they asked for, but ' +
    'what the stone could bear without cracking. The ruling was not about what was right in ' +
    'the absolute sense. It was about what the settlement could carry.\n\n' +
    'The party with the older deed did not accept this. They did not say so — they were too ' +
    'experienced with the weight of rulings to say so in the square. But the agent had been ' +
    'watching people hold things in for a long time, and recognized the specific quality of ' +
    'contained refusal. This dispute was not over. The {title}\'s ruling had moved it — ' +
    'changed its shape, given it a new edge — but something in it was still open, and would ' +
    'remain open for a generation.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: -0.05 },
  successAfterimage: 'The transforming claim upheld. The settlement has what it needs. The older party is quiet in the particular way of people who have not yet decided what to do.',
  failureAfterimage: 'The ruling reached for the future but the past pulled back — the newer party\'s position looked weaker coming out than going in.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    rule_for_older_claim: step1RuleForOlderClaim,
    rule_for_transforming_claim: step1RuleForTransformingClaim,
  },
  fallback: { ...step1RuleForOlderClaim },
};

// ─── Aftermath ───────────────────────────────────────────────────

const OLDER_CLAIM_AFTERMATH = {
  overview:
    'The elder had the ruling written into the settlement\'s record by the following morning — ' +
    'a formal entry in the document ledger, witnessed by three of the council, bearing the ' +
    'agent\'s title as the issuing authority. The agent\'s name would appear in that ledger ' +
    'for as long as the ledger lasted. Both parties received formal copies.\n\n' +
    'The older deed\'s holder came to the elder\'s house three days later with a jar of something ' +
    'they had made themselves and a single question: had the Steadfast Builder stayed in the ' +
    'region? The elder said they did not know. The deed-holder nodded and left the jar on ' +
    'the table without explanation. Gratitude has a texture that does not always come with ' +
    'language.\n\n' +
    'The newer party\'s silence lasted eleven days. On the twelfth, they sent a letter to ' +
    'their factors in the next settlement over. The letter\'s contents were not disclosed.',
  changes: [
    {
      id: 'older_ruling_recorded',
      kind: 'reputation' as const,
      title: 'The Stone\'s Judgement',
      detail: 'The ruling is in the ledger. The {title}\'s word holds weight in this settlement for a generation.',
      polarity: 'gain' as const,
    },
    {
      id: 'older_losing_party_waits',
      kind: 'future_hook' as const,
      title: 'The Newer Party\'s Letter',
      detail: 'They sent word to their factors twelve days after the ruling. Something is being planned.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The older claim was honored. The stone holds — but so does the silence of the party that lost. Choose what to do with the ruling now that it has been given.',
  reactions: [
    {
      id: 'older_react_record',
      label: 'Have the judgement inscribed in the settlement\'s lore.',
      intent: 'The god seals the ruling in the settlement\'s living record — not just a legal document, but a story the settlement tells about itself from now on.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s judgement enters the settlement\'s cultural record. The stone endures. What was old is confirmed as the foundation of what comes next.',
          significance: 0.8,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.5,
          label: 'The losing party has been watching since the twelfth day — their silence carries intent',
          revealFamilies: ['stone.legacy', 'settlement', 'conflict'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 50,
          priority: 1.2,
          seedLabel: 'The losing party returns — a generation has passed and the deed is being contested again by different hands',
        },
      ],
    },
    {
      id: 'older_react_let_fade',
      label: 'Let the ruling stand without ceremony.',
      intent: 'What was decided is decided — the god holds the agent back from further inscription. The ruling exists in the ledger. Let the settlement carry it forward without additional weight.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s judgement holds without ceremony. The older claim was honored. The square has moved on.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 50,
          priority: 1.0,
          seedLabel: 'The losing party returns — a generation has passed and the deed is being contested again by different hands',
        },
      ],
    },
  ],
} as const;

const TRANSFORMING_CLAIM_AFTERMATH = {
  overview:
    'The ruling was recorded on the same day. The elder had it witnessed before the sun ' +
    'set, which was unusual — normally settlements let such things sit for three days in ' +
    'case of immediate challenge. That they didn\'t suggested the elder was afraid of what ' +
    'the night might bring if the ruling remained unofficial.\n\n' +
    'The older deed\'s holder left the settlement before the copy of the ruling reached ' +
    'their door. The message this sent was clear to everyone in the elder\'s council: the ' +
    'dispute was not over. It had been moved to a different forum, in a different place, ' +
    'with different instruments. Courts that could read old deeds across jurisdictions were ' +
    'expensive, but so was a two-season land dispute, and the older party had been patient ' +
    'before.\n\n' +
    'The {title} had ruled for what the settlement needed. Whether what the settlement ' +
    'needed and what the settlement deserved were the same question would take a generation ' +
    'to answer.',
  changes: [
    {
      id: 'transform_ruling_recorded',
      kind: 'reputation' as const,
      title: 'The Stone\'s Judgement',
      detail: 'The transforming claim was upheld. The settlement has what it needs. The older party has left.',
      polarity: 'mixed' as const,
    },
    {
      id: 'transform_older_party_departed',
      kind: 'future_hook' as const,
      title: 'The Older Party\'s Appeal',
      detail: 'They left before the copy reached them. They are seeking a court that can read old deeds. This is not over.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The transforming claim stands. The settlement has what it needs for now. The older party is already moving. Choose how to hold what the ruling cost.',
  reactions: [
    {
      id: 'transform_react_record',
      label: 'Have the judgement inscribed regardless.',
      intent: 'The god holds the agent to the ruling without apology — inscription is not arrogance, it is accountability. What was decided should be legible to whoever comes to contest it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: -1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s judgement is inscribed. The transforming claim is settled law. The cost of that settlement has been accepted, not avoided.',
          significance: 0.75,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.6,
          label: 'Ruled against the older claim — the past was set aside for the present, and the older party knows it',
          revealFamilies: ['stone.legacy', 'settlement', 'conflict'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 50,
          priority: 1.2,
          seedLabel: 'The older party returns — a generation has passed and the deed is being contested again by different hands, with better instruments',
        },
      ],
    },
    {
      id: 'transform_react_let_fade',
      label: 'Let the ruling stand without further weight.',
      intent: 'The god holds the agent back from inscription — what was decided is enough. Adding ceremony to a controversial ruling does not make it more right. Let it exist quietly.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: -1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s judgement holds quietly. The transforming claim was upheld. The older party has already left. The settlement moves on.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.legacy',
          delayTicks: 50,
          priority: 1.0,
          seedLabel: 'The older party returns — a generation has passed and the deed is being contested again by different hands, with better instruments',
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

export const THE_STONES_JUDGEMENT_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.stone.the_stones_judgement',
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Stone\'s Judgement',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheDispute, step1Branch],

  apCost: 2,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['town', 'city', 'capital'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.stone.positive'],

  narrativeTemplates: {
    initiation:
      'A settlement elder has been waiting with a dispute that only the {title}\'s word can close. ' +
      'Two parties, two claims on the same ground — one rooted in what came before, one in ' +
      'what must come next. The square is prepared. The stone slab is cleared.',
    success:
      'The judgement was given. The stone holds it now — in ledger, in memory, in the specific ' +
      'quality of silence that follows a ruling that everyone present knows cannot be easily undone.',
    failure:
      'The ruling did not close the dispute — it changed its shape, found a new edge, and left ' +
      'the parties with something harder to argue than what they came in with. The elder did not ' +
      'look at the agent on the way out.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-stones-judgement.jpg',
  illustrationAlt: 'Open market square, a rough stone slab between two crowds. The agent stands on the slab, elder behind them, the two disputing parties flanking. Wind-whipped banners in the background.',

  authoredChoices: {
    0: [
      {
        id: 'rule_for_older_claim',
        label: 'Settle the matter by what endures.',
        intent:
          'The god draws the agent\'s authority toward what the stone remembers — the first deed, ' +
          'the older claim, the weight of every iteration of this settlement that honored it before. ' +
          'The ruling will reinforce the Steadfast Builder\'s reputation as someone whose word does ' +
          'not revise history for convenience.',
        essenceCost: 1,
        likelyBurden:
          'The losing party will accept the ruling\'s legality and contest its justice. ' +
          'The older claim carries a long shadow — something in the newer party\'s silence ' +
          'will not fully settle.',
        interventionType: 'supportive',
      },
      {
        id: 'rule_for_transforming_claim',
        label: 'Settle the matter by what must become.',
        intent:
          'The god orients the agent\'s attention to the world\'s grain as it is now running — ' +
          'what the settlement has become, what it needs to continue becoming. The older deed is ' +
          'real. The thing built on it is also real. The {title} chooses the fact over the document.',
        essenceCost: 2,
        likelyBurden:
          'The Legendary standing earns the right to make this call. It does not erase the cost ' +
          'of making it. The older party will seek redress through instruments the agent cannot ' +
          'easily reach. This dispute has a long tail.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      rule_for_older_claim: OLDER_CLAIM_AFTERMATH,
      rule_for_transforming_claim: TRANSFORMING_CLAIM_AFTERMATH,
    },
    fallback: { ...OLDER_CLAIM_AFTERMATH },
  },
});

export const THE_STONES_JUDGEMENT_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_STONES_JUDGEMENT_TEMPLATE);
