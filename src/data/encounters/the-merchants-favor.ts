/**
 * The Merchant's Favor — reputation-gated encounter, Gold reach, required-positive.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.gold.positive']
 * Pattern: required-positive — encounter surfaces only for agents with Gold positive reputation.
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

const merchantSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'merchant',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['merchant', 'trader', 'guild-member', 'civilian'],
  supportRole: 'merchant',
  spawnNpcRole: 'merchant',
  spawnName: 'the Merchant',
};

const guildhallSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'guildhall',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'guildhall',
  fallbackName: 'The Merchant\'s Guildhall',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [merchantSpec, guildhallSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheKneeling: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The merchant was not well. The caravan had been hit three days out — robbed clean, ' +
    'the driver left on the road with a broken wrist — and now the guildhall was talking ' +
    'about whose fault it was, which was not the same conversation as talking about what ' +
    'to do about it. He had borrowed travel money from his sister. The boards of the room ' +
    'he had taken were uneven. He had asked around about who might help, and enough people ' +
    'had said {title} that he was here.\n\n' +
    'He did not kneel exactly, but he inclined at a steeper angle than he had probably ' +
    'practiced. The pouch was empty and he showed it — upended, tapped twice. He was not ' +
    'asking for coin. He was asking for a word spoken in the right ear at the guildhall, ' +
    'at a moment when the guildhall was not listening to men with empty pouches.',
  successAfterimage: 'The empty pouch. The angle of the incline. A man who has run out of people to ask.',
  failureAfterimage: 'He looked up uncertain — as if the recognition he had been pointed toward was arriving sideways.',
};

const step1Intercede: ActionStep = {
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
    'The god set the agent in motion toward the guildhall with the particular quality of ' +
    'presence that makes doors open before a hand reaches them. The guildmaster was in the ' +
    'middle of something — ledgers, a heated exchange about a border tariff — and he stopped ' +
    'when {title} entered, the way men stop when they have learned that certain interruptions ' +
    'cost more to ignore than to hear.\n\n' +
    'The merchant\'s name was said. The loss was named. The guildmaster\'s expression did not ' +
    'move much, but the conversation about the tariff was ended, which meant something about ' +
    'where the guildmaster\'s real attention was. He said: let him come in tomorrow morning. ' +
    'He said it to his clerk, not to the agent, which was the correct form — as though the ' +
    'matter was already decided and only the paperwork remained.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The guildmaster\'s clerk wrote a name in the morning ledger. The merchant would come in.',
  failureAfterimage: 'The guildmaster listened, but something in the exchange did not resolve — the door opened, but not fully.',
};

const step1MarkRobbers: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: -0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god said nothing about the guildhall. The guildhall was a lobby of an argument ' +
    'that would resolve itself when it was ready. What was useful was the description of ' +
    'the road, the point where the caravan had stopped, the particular pattern of a robbery ' +
    'that left drivers alive — and the agent filed all of this in the part of awareness ' +
    'that tracks things for later.\n\n' +
    'The merchant left without a commitment and understood he was not getting one. What he ' +
    'got instead was a question about the driver\'s condition — asked with a precision that ' +
    'implied someone might look in on the driver, which no one else had mentioned. The ' +
    'merchant\'s expression shifted. Not hope exactly. But the recalculation of what kind ' +
    'of help was available.',
  successMetadata: { reputationDelta: -0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'A question about the driver. The merchant left without what he came for, and got something else.',
  failureAfterimage: 'The inquiry fell flat — the merchant left with nothing specific and felt the gap.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    intercede_personally: step1Intercede,
    mark_the_robbers: step1MarkRobbers,
  },
  fallback: { ...step1Intercede },
};

// ─── Aftermath ───────────────────────────────────────────────────

const INTERCEDE_AFTERMATH = {
  overview:
    'The merchant came in the next morning. The guildmaster\'s clerk had the file. An hour ' +
    'later the merchant was in front of the full committee with documentation of the robbery — ' +
    'documentation the guild then used to formally record the loss, which changed his status ' +
    'from defaulter to victim, which was not a small change. The merchant\'s sister got her ' +
    'money back six weeks later when the merchant settled a supply contract that the recorded ' +
    'loss had unlocked. He did not know how to say the sequence back to the {title}, so he ' +
    'sent a bolt of cloth instead, which arrived without a note, which was a kind of note.',
  changes: [
    {
      id: 'intercede_guild_standing',
      kind: 'reputation' as const,
      title: 'The Guildhall Door',
      detail: 'A word was spoken. The merchant came in the next morning. That sequence is now known.',
      polarity: 'gain' as const,
    },
    {
      id: 'intercede_merchant_thread',
      kind: 'future_hook' as const,
      title: 'The Cloth Without a Note',
      detail: 'The merchant found a way to repay without language. He has not finished.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The guildhall opened. The merchant\'s debt to you is real but unstated. Choose what to hold.',
  reactions: [
    {
      id: 'intercede_react_hold',
      label: 'Let the thread run.',
      intent: 'The merchant\'s future is not a settled account. Leave the connection open.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'gold.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} opened the guildhall door for a ruined merchant. The cloth arrived without a note.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.patronage',
          delayTicks: 30,
          priority: 0.8,
          seedLabel: 'The merchant\'s repayment',
        },
      ],
    },
    {
      id: 'intercede_react_close',
      label: 'Regard it as settled.',
      intent: 'The merchant got what he needed. The god does not hold open accounts on this scale.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'gold.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} interceded at the guildhall and did not wait for the accounting. Word of it moved anyway.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

const MARK_AFTERMATH = {
  overview:
    'Someone went to check on the driver, who had a name: Ossian, which had been in no ' +
    'documents because no one had written him one in some time. The driver was found in ' +
    'the next settlement, wrist splinted with someone else\'s wood. The robbery pattern the ' +
    'agent had noticed moved through three people before it reached someone who knew which ' +
    'stretch of road the bandits used as their base. The merchant did not know any of this. ' +
    'The driver eventually got home. None of the people who helped him knew why a road they ' +
    'had never walked had suddenly become visible to them.',
  changes: [
    {
      id: 'mark_shadow_trace',
      kind: 'reputation' as const,
      title: 'The Road Note',
      detail: 'Someone looked into the robbery from a direction no one had pointed at.',
      polarity: 'mixed' as const,
    },
    {
      id: 'mark_bandit_thread',
      kind: 'future_hook' as const,
      title: 'The Pattern',
      detail: 'The robbery pattern was noted. Someone now knows which road the bandits use.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'The score was noted. The robbers have a pattern now, and someone else holds it. Choose what moves.',
  reactions: [
    {
      id: 'mark_react_pursue',
      label: 'Follow the pattern through.',
      intent: 'The intelligence on the robbers is live. Let it move toward an outcome.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.35,
          label: 'spoke no favor but took the score — holds bandit pattern from the merchant\'s robbery',
          revealFamilies: ['gold.betrayal', 'shadow.retribution'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'shadow.retribution',
          delayTicks: 20,
          priority: 0.75,
          seedLabel: 'The bandits discover someone noticed',
        },
      ],
    },
    {
      id: 'mark_react_release',
      label: 'Let the pattern disperse.',
      intent: 'The information moves, but the god does not direct it.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'gold.positive', delta: -1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} did not open the guildhall door. A different kind of attention moved instead.',
          significance: 0.4,
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

export const THE_MERCHANTS_FAVOR_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.gold.the_merchants_favor',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Merchant\'s Favor',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheKneeling, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.gold.positive'],

  narrativeTemplates: {
    initiation:
      'A merchant with an empty pouch seeks {title} — not for coin, but for a word ' +
      'spoken at a guildhall where men with empty pouches are not currently being heard.',
    success:
      'What the merchant needed moved through the connection the {title} represents. ' +
      'Whether a door was opened or a road examined, something that was stuck is not stuck anymore.',
    failure:
      'The connection was there but did not translate cleanly into the form the merchant needed.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-merchants-favor.webp',
  illustrationAlt: 'Wide shot: a merchant on a counting-house floor, empty pouch upended on the boards before him, threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'intercede_personally',
        label: 'Walk to the guildhall and stake your reputation.',
        intent:
          'The god sets the agent in motion with the weight of the {title} behind them — ' +
          'not a request, not a favor asked, but a presence that shifts what the guildmaster ' +
          'is currently willing to hear. The merchant\'s name will be on the morning ledger.',
        essenceCost: 1,
        likelyBurden:
          'The guildmaster\'s obligation is to the agent now, not the merchant. Whatever ' +
          'the merchant does with the door that was opened becomes part of the agent\'s record.',
        interventionType: 'supportive',
      },
      {
        id: 'mark_the_robbers',
        label: 'Decline advocacy. Map the robbery\'s pattern instead.',
        intent:
          'The god does not open the guildhall door. Instead it maps the shape of the robbery — ' +
          'pattern, road, method — and sends that shape quietly through channels the merchant ' +
          'does not have access to. The merchant leaves without what he came for, but something ' +
          'else moves in the space his visit created.',
        essenceCost: 0,
        likelyBurden:
          'The merchant did not get his guildhall meeting. The patron reputation takes a small cost. ' +
          'Something shadow-inclined moves instead.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      intercede_personally: INTERCEDE_AFTERMATH,
      mark_the_robbers: MARK_AFTERMATH,
    },
    fallback: { ...INTERCEDE_AFTERMATH },
  },
});

export const THE_MERCHANTS_FAVOR_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_MERCHANTS_FAVOR_TEMPLATE);
