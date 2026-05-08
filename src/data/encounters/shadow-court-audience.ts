/**
 * Shadow Court Audience — reputation-gated encounter, Shadow reach, blocked-by-negative.
 *
 * Gate: blockedByTraits: ['trait.reputation.shadow.negative'] (any level).
 * Pattern: blocked-by-negative — encounter only surfaces for agents NOT carrying Infamous reputation.
 * The blocking is enforced via encounterGates.blocks in the shadow.negative trait definition.
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

const courtierSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'courtier',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['noble', 'courtier', 'diplomat', 'advisor'],
  supportRole: 'senior courtier',
  spawnNpcRole: 'noble',
  spawnName: 'the Courtier',
};

const chamberSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'audience_chamber',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'court',
  fallbackName: 'The Audience Chamber',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [courtierSpec, chamberSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheReception: ActionStep = {
  reach: 'shadow',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The audience chamber had the particular quality of rooms that exist to make people ' +
    'feel the weight of institutional attention: high ceilings, narrow windows admitting ' +
    'cold light in measured portions, marble floors that made every footstep audible to ' +
    'everyone who mattered. The court functionary who met the agent at the door was polished ' +
    'in the way that courts polish people — all surface, very little friction — and his welcome ' +
    'was measured and correct.\n\n' +
    'He did not say: we have heard nothing about you that would give us reason to be careful. ' +
    'He did not need to. The welcome itself said it: doors opening without hesitation, the ' +
    'small courtesies extended without calculation, the way the senior courtier rose slightly ' +
    'when the agent was announced. These were not performances. They were the court\'s natural ' +
    'behavior toward someone it had no reason to distrust, which was a rarer thing than most ' +
    'people realized.\n\n' +
    'The senior courtier — a woman of middle years with the hands of someone who had spent a ' +
    'long time writing important correspondence — gestured to the chair across the table from ' +
    'her own. She offered no refreshment. Courts at this level did not offer refreshments to ' +
    'strangers. They offered attention, which was more valuable, and harder to extend.',
  successAfterimage: 'The court received the agent with cautious openness. The door was ajar.',
  failureAfterimage: 'The court\'s welcome felt conditional, as though the opening had been hedged.',
};

const step1PresentHonestly: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 4 },
  difficulty: 0.40,
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
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god\'s touch was the simplest possible one: a settling of the agent into their own ' +
    'honesty. Not a revelation, not a confession — the court was not a confessional — but ' +
    'the particular alignment of saying what one means without excess and meaning what one ' +
    'says without apology. The courtier watched with professional attention as the agent ' +
    'spoke, and what she heard was someone who was not performing anything.\n\n' +
    'This was unusual enough to be interesting. Courts are fluent in performance. They run ' +
    'on it. But courts also develop, over time, a sensitivity to the absence of performance, ' +
    'the way any specialized environment develops receptors for the things it rarely encounters. ' +
    'The courtier\'s posture shifted almost imperceptibly — not relaxation exactly, but the small ' +
    'recalibration of someone who has met something they hadn\'t accounted for in their morning.\n\n' +
    'She asked three questions. They were good questions. The agent answered them all. By the ' +
    'third answer, the senior courtier had set down the pen she\'d been rolling between her ' +
    'fingers and was simply listening.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: -0.05 },
  successAfterimage: 'Honest in the court\'s hearing. The courtier listened — really listened — and found something worth the attention.',
  failureAfterimage: 'Honest, but the court\'s questions cut to something the agent could not answer cleanly.',
};

const step1VeiledThreat: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.20 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god folded something underneath the agent\'s words — not a threat in the way that ' +
    'courts recognize threats, with raised voices and explicit stakes, but the kind of ' +
    'pressure that professionals apply through implication. The weight of: I know more than ' +
    'I have said. The implication of: I have not yet decided what to do with what I know. ' +
    'Neither of these things was said. Both of them were present.\n\n' +
    'The senior courtier heard it. Of course she heard it. This was her room. She had been ' +
    'having versions of this conversation for fifteen years, and she recognized the particular ' +
    'register of politely framed leverage as fluently as she recognized her own name. Her ' +
    'expression changed in a way that was technically imperceptible but practically obvious ' +
    'to anyone who knew what to look for: a slight increase in stillness, a very small ' +
    'narrowing of the margins around her attention.\n\n' +
    'She did not rise. Courts don\'t rise for implicit pressure — that would be conceding the ' +
    'threat, which was not the same as navigating it. She finished the cup of water in front ' +
    'of her, took a moment to consider, and then offered a single favor: narrow, careful, ' +
    'reversible. The kind of concession that says: I have heard you. It does not say: I am afraid.',
  successMetadata: { reputationDelta: -0.05 },
  failureMetadata: { reputationDelta: -0.20 },
  successAfterimage: 'The veiled pressure landed. The court conceded a favor — carefully, correctly, without appearing to concede anything at all.',
  failureAfterimage: 'The courtier saw through the framing entirely. The meeting ended in formal courtesy and a closed door.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    present_honestly: step1PresentHonestly,
    drop_a_veiled_threat: step1VeiledThreat,
  },
  fallback: { ...step1PresentHonestly },
};

// ─── Aftermath ───────────────────────────────────────────────────

const HONEST_AFTERMATH = {
  overview:
    'The senior courtier sent a note to the agent\'s lodgings the following morning. It ' +
    'was written in a personal hand, not a court hand, which was a distinction that mattered ' +
    'in this place. The note said very little but said it specifically: there was a matter ' +
    'she had been uncertain how to address, and she thought the agent might be the kind of ' +
    'person who would not make the address more complicated than necessary. No signature. ' +
    'Only a small seal pressed into the bottom corner that anyone familiar with the court\'s ' +
    'internal hierarchy would recognize immediately. This was not an official communication. ' +
    'It was the kind of thing that happens when a professional decides to trust someone enough ' +
    'to attempt a thing slightly outside the normal channels.',
  changes: [
    {
      id: 'honest_courtier_trust',
      kind: 'reputation' as const,
      title: 'The Senior Courtier',
      detail: 'An ally inside the court\'s structure — cautious, but real.',
      polarity: 'gain' as const,
    },
    {
      id: 'honest_court_access',
      kind: 'future_hook' as const,
      title: 'The Courtier\'s Commission',
      detail: 'A matter outside normal channels. The courtier needs something only the agent can provide.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The court has opened a door. Choose whether to step through it.',
  reactions: [
    {
      id: 'honest_react_accept',
      label: 'Accept the commission.',
      intent: 'The god moves the agent toward the courtier\'s matter — whatever it is, the court\'s trust was worth earning.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The courtier\'s note is answered. Whatever the commission holds, it was offered honestly and accepted honestly.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          templateId: 'noble.commission',
          delayTicks: 20,
          priority: 1.1,
          seedLabel: 'The courtier\'s matter — what she needed and why she could not ask officially',
        },
      ],
    },
    {
      id: 'honest_react_hold',
      label: 'Hold the access without using it yet.',
      intent: 'The god lets the court\'s opening remain open — not walking through it, but not closing it either.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.3,
          label: 'The senior courtier sent a personal note — an alliance inside the court\'s structure, unclaimed',
          revealFamilies: ['court', 'shadow.intrigue', 'social'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The courtier\'s note waits. The god does not move the agent toward it yet — but the door stays open.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

const THREAT_AFTERMATH = {
  overview:
    'The favor the courtier had offered was delivered in two days, through proper channels, ' +
    'without acknowledgment that anything had been asked. Courts are excellent at transacting ' +
    'things that officially did not happen. The favor was useful. It was also, the agent ' +
    'understood, the exact price of having made the courtier\'s morning slightly more complicated ' +
    'than it needed to be — no more, no less, calibrated to the millimeter by a professional ' +
    'who had spent fifteen years deciding what things were worth.\n\n' +
    'There would not be a second commission. That was also understood.',
  changes: [
    {
      id: 'threat_favor_received',
      kind: 'reputation' as const,
      title: 'The Courtier',
      detail: 'One favor, correctly delivered. The account is settled. The relationship is closed.',
      polarity: 'mixed' as const,
    },
    {
      id: 'threat_court_wariness',
      kind: 'future_hook' as const,
      title: 'A Wary Court',
      detail: 'The senior courtier has noted the approach. The next audience — if there is one — will be different.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The favor is in hand. The door to this court is narrower now. Choose what to do with what was gained.',
  reactions: [
    {
      id: 'threat_react_use_favor',
      label: 'Use the favor immediately.',
      intent: 'Extract the value before it cools.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The courtier\'s favor is applied. The transaction is complete. The court will not forget how it was extracted.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'threat_react_hold',
      label: 'Hold the favor unused.',
      intent: 'A favor held is a threat maintained. Keep the courtier aware that the balance has not been spent.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.4,
          label: 'Holds an uncollected favor from the senior courtier — a veiled threat maintained in reserve',
          revealFamilies: ['court', 'shadow.intrigue', 'investigation'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The favor sits unclaimed. The courtier is aware of this. That awareness is its own kind of pressure.',
          significance: 0.55,
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

export const SHADOW_COURT_AUDIENCE_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.shadow.shadow_court_audience',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Shadow Court Audience',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheReception, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city', 'palace'],
  motivations: ['honesty_cunning', 'loyalty_ambition'],

  targetCategories: ['actor'],

  narrativeTemplates: {
    initiation:
      'A noble court opens its doors without hesitation — because it has no reason not to. ' +
      'The {title} is received with the measured courtesy reserved for people the court has ' +
      'nothing particular against, which is a rarer reception than it might seem.',
    success:
      'The audience concluded with the court\'s door standing slightly more open than before. ' +
      'Whether that opening is worth the approach taken remains to be seen.',
    failure:
      'The audience ended on the wrong note. The court\'s courtesy was intact, but its ' +
      'warmth had cooled, and both parties felt the temperature.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/shadow-court-audience.jpg',
  illustrationAlt: 'A marble audience chamber, narrow cold windows. Two figures face each other across a low table — a courtier seated, the agent standing, equal in frame.',

  authoredChoices: {
    0: [
      {
        id: 'present_honestly',
        label: 'Let them see what is actually there.',
        intent:
          'The god steadies the agent into their own honest register — not vulnerability, ' +
          'but the particular alignment of saying what one means. In a court where everyone ' +
          'performs, someone who is genuinely not performing is a rarity worth paying attention to.',
        essenceCost: 1,
        likelyBurden:
          'Honest reception is not automatic. The court will probe what it is given, and ' +
          'honest answers to good questions carry their own weight.',
        interventionType: 'supportive',
      },
      {
        id: 'drop_a_veiled_threat',
        label: 'Let the implication do the work.',
        intent:
          'The god loads the space beneath the agent\'s words with the particular pressure ' +
          'of: I know things I have not said. Not a declaration, not a demand — just the ' +
          'professional register of someone who is choosing, in this moment, to be polite. ' +
          'Courts understand this language. Whether they appreciate it depends on the day and ' +
          'the courtier.',
        essenceCost: 2,
        likelyBurden:
          'The courtier is a professional. Leverage that is recognized is leverage that ' +
          'has a cost, and she will set the cost herself, at the number that settles the account ' +
          'and no higher.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      present_honestly: HONEST_AFTERMATH,
      drop_a_veiled_threat: THREAT_AFTERMATH,
    },
    fallback: { ...HONEST_AFTERMATH },
  },
});

export const SHADOW_COURT_AUDIENCE_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(SHADOW_COURT_AUDIENCE_TEMPLATE);
