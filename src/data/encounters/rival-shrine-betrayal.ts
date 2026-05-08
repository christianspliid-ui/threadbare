/**
 * The Broker's Ledger — first branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A faction broker named Tessaly offers the player a devil's bargain:
 * the location of a rival god's hidden shrine in exchange for a coastal
 * settlement's trade secret. The choice reveals what kind of god the
 * player is willing to be.
 *
 * Design doc: Docs/plans/encounters/rival-shrine-betrayal-revised.md
 * Systems audit: Docs/plans/encounters/rival-shrine-betrayal-systems.md
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

const tessalySpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'tessaly',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['informant', 'trader', 'fence'],
  supportRole: 'broker',
  spawnNpcRole: 'broker',
  spawnName: 'Tessaly',
};

const carinHarkenSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'carin_harken',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  preferredLocationKey: 'meeting_point',
  reuseNpcRoles: ['elder'],
  supportRole: 'elder',
  spawnNpcRole: 'elder',
  spawnName: 'Carin Harken',
};

const meetingPointSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'meeting_point',
  delivery: 'pre-seeded',
  persistence: 'scene-only',
  sublocationTypeId: 'caravanserai',
  fallbackName: 'Waystation on the Northern Routes',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  tessalySpec,
  carinHarkenSpec,
  meetingPointSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The Offer.
 * Tessaly presents the trade. Difficulty 0 because the choice is the
 * point, not the roll — the player always sees the offer. The agent
 * always succeeds at hearing the proposition.
 */
const step0TheOffer: ActionStep = {
  reach: 'shadow',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'Tessaly spread the ledger on the table and pressed it flat with both palms. ' +
    'She spoke at exactly the volume that carried no further than the table. ' +
    '"I know where the Pale Court keeps its shrine in the Vessen uplands. ' +
    'I have not sold this to anyone because I wanted to sell it to you, and because ' +
    'what I want in return is something only your people can give me." ' +
    'She turned the ledger to face the agent. The last debt was circled in red ink. ' +
    '"Brinewall. The curing technique. The Harken family\'s process — the tidal pools, ' +
    'the calcium-ite, the timing. I need a working description." ' +
    'She met the agent\'s eyes with the flat professional regard of someone who has ' +
    'calculated this conversation twelve times before having it.',
};

/**
 * Step 1 — Accept variant: The Extraction.
 * The agent must extract the salt-curing technique from Brinewall without
 * arousing suspicion. Shadow reach at moderate difficulty (0.45).
 */
const step1AcceptExtraction: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    // Create the intelligence attachment (shrine map artifact)
    {
      op: 'add_node',
      nodeId: 'reward_intelligence_shrine_map',
      nodeType: 'artifact' as const,
      properties: {
        name: 'Vessen Shrine Map',
        subcategory: 'intelligence',
        tier: 2,
        tags: ['#shadow', '#intelligence', '#shrine_location', '#rival_god'],
        mechanicalSummary: '+0.03 Shadow reach',
        reachBonus: { shadow: 0.03 },
        lossCondition: 'permanent',
        flavorText:
          'Six pages of careful hand — route notes, guardian schedules, a margin sketch ' +
          'of the approach from the river side. Seventeen years of trade route intelligence ' +
          'compressed into a map fragment that changes the regional balance of power.',
        intelligenceType: 'shrine_location',
        targetRegion: 'vessen_uplands',
        detailLevel: 'full',
      },
    },
    // Attach the intelligence to the actor
    {
      op: 'add_edge',
      source: '$actor',
      target: 'reward_intelligence_shrine_map',
      edgeType: 'owns' as const,
    },
  ],
  onFailure: [
    // Damaged Brinewall trust on failure — extraction was clumsy
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.15 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Carin Harken walked the agent through the second curing shed as though showing ' +
    'a friend a garden. She pointed out where the calcium-ite deposit surfaced through ' +
    'the floor stones — a pale vein of mineral that the family had chipped at for three ' +
    'generations. Her daughter Lenne brought tea and dried plums. Carin talked while she ' +
    'worked, her hands moving through the process the way a musician\'s hands move through ' +
    'a piece they have played ten thousand times. The agent listened. And the agent ' +
    'recorded — not the way a guest remembers a host\'s generosity, but the way a ' +
    'surveyor records a claim.',
  successMetadata: {
    reputationDelta: -0.10,
  },
  failureMetadata: {
    reputationDelta: -0.20,
  },
};

/**
 * Step 1 — Refuse variant: The Refusal.
 * The agent must handle the refusal diplomatically enough to redirect
 * Tessaly. Heart reach at lower difficulty (0.35).
 */
const step1RefuseRefusal: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  onSuccess: [
    // Brinewall trust boost on successful refusal
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.10 },
    },
  ],
  onFailure: [
    // Failed refusal — Tessaly becomes adversarial
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    '"No." The word sat between them on the table like a stone dropped into still ' +
    'water. Tessaly did not move for a moment. Then she nodded, once, and closed the ' +
    'ledger the way someone closes a book they will not need again. "I understand," ' +
    'she said. "You should know that my asking you was the clean version. I have other ' +
    'approaches." She was not threatening. She was informing, with the weary precision ' +
    'of someone who has already calculated the uglier paths. She left money on the table ' +
    'for the tea — exact change — and walked out into the ordinary northern light.',
  successMetadata: {
    reputationDelta: 0.10,
  },
  failureMetadata: {
    reputationDelta: -0.05,
  },
};

/**
 * Step 1: Branch point. Resolves based on the choice made at Step 0.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    accept_trade: step1AcceptExtraction,
    refuse_trade: step1RefuseRefusal,
  },
  fallback: { ...step1RefuseRefusal },
};

// ─── Aftermath Config ────────────────────────────────────────────

const ACCEPT_AFTERMATH = {
  overview:
    'The map arrived by courier three days after the technique left Brinewall. ' +
    'Tessaly was true to her word — the shrine\'s location was precise, annotated ' +
    'with route notes, guardian schedules, and a margin sketch of the approach from ' +
    'the river side. In Brinewall, nothing changed immediately. But in a warehouse ' +
    'in Greywater, a Guild curing master was already reading a description of the ' +
    'calcium-ite deposit and the timing of the tides. The god had gained a weapon ' +
    'and spent a friendship.',
  changes: [
    {
      id: 'accept_intelligence_gained',
      kind: 'item' as const,
      title: 'Intelligence Gained',
      detail: 'Rival shrine location in the Vessen uplands — map, routes, guardian schedules.',
      polarity: 'gain' as const,
    },
    {
      id: 'accept_alliance_strained',
      kind: 'reputation' as const,
      title: 'Alliance Strained',
      detail: 'Brinewall community trust reduced. The betrayal mark is active — the trail exists.',
      polarity: 'loss' as const,
    },
    {
      id: 'accept_broker_relationship',
      kind: 'reputation' as const,
      title: 'Broker Contact Established',
      detail: 'Tessaly\'s debt is cleared. She is available as a recurring intelligence contact.',
      polarity: 'gain' as const,
    },
    {
      id: 'accept_economic_countdown',
      kind: 'future_hook' as const,
      title: 'Economic Countdown',
      detail: 'Greywater Guild begins replication. Brinewall\'s monopoly has approximately two seasons.',
      polarity: 'loss' as const,
    },
    {
      id: 'accept_hidden_mark',
      kind: 'reputation_tally' as const,
      title: 'Betrayal Mark',
      detail: 'A hidden mark placed on the agent. When Brinewall investigates, this increases discovery chance.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The trade is done. The shrine\'s location is known. Brinewall\'s monopoly is ending. What comes next?',
  reactions: [
    {
      id: 'accept_react_prepare_brinewall',
      label: 'Prepare Brinewall for what is coming.',
      intent: 'Quietly help Brinewall diversify before the price crash. Soften the landing without undoing the betrayal.',
      effects: [
        {
          kind: 'reputation_score' as const,
          delta: 0.05,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'brinewall_preparation',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god who betrayed Brinewall now moves to soften the blow — diversifying their trade before the monopoly collapses.',
          significance: 0.7,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'broker.quest',
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'Brinewall economic diversification',
        },
        {
          kind: 'hidden_mark' as const,
          category: 'betrayal' as const,
          severity: 0.6,
          label: 'Betrayed Brinewall\'s salt-curing technique to Tessaly for rival shrine intelligence',
          revealFamilies: ['investigation', 'brinewall'],
        },
        {
          kind: 'intelligence' as const,
          category: 'shrine_location' as const,
          label: 'Location of the Pale Court shrine in the Vessen uplands',
          detail: 'Map fragment, route notes, guardian schedules, and approach path from the river side. Compiled by Tessaly from seventeen years of trade route intelligence.',
          targetRegion: 'vessen_uplands',
          reliability: 0.9,
        },
      ],
    },
    {
      id: 'accept_react_spend_intelligence',
      label: 'Spend the intelligence. The shrine is the prize.',
      intent: 'Turn full attention to the rival shrine. The cost to Brinewall is already paid.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shrine_intelligence_deployed',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The rival shrine\'s location is deployed immediately — agents move to contest the hidden valley in the Vessen uplands.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'broker.quest',
          delayTicks: 15,
          priority: 1.2,
          seedLabel: 'The rival shrine confrontation',
        },
        {
          kind: 'hidden_mark' as const,
          category: 'betrayal' as const,
          severity: 0.6,
          label: 'Betrayed Brinewall\'s salt-curing technique to Tessaly for rival shrine intelligence',
          revealFamilies: ['investigation', 'brinewall'],
        },
        {
          kind: 'intelligence' as const,
          category: 'shrine_location' as const,
          label: 'Location of the Pale Court shrine in the Vessen uplands',
          detail: 'Map fragment, route notes, guardian schedules, and approach path from the river side. Compiled by Tessaly from seventeen years of trade route intelligence.',
          targetRegion: 'vessen_uplands',
          reliability: 0.9,
        },
      ],
    },
  ],
} as const;

const REFUSE_AFTERMATH = {
  overview:
    'The shrine in the Vessen uplands continued to grow in its hidden valley, ' +
    'fed by prayers the player\'s agents could not hear. In Brinewall, the fish ' +
    'came in and the fish went out. Carin Harken walked the curing sheds with her ' +
    'daughter, and the monopoly held, and the settlement\'s small sovereignty ' +
    'continued for reasons no one in the settlement would ever fully understand. ' +
    'A god had refused to sell them and they would never know it.',
  changes: [
    {
      id: 'refuse_alliance_preserved',
      kind: 'reputation' as const,
      title: 'Alliance Preserved',
      detail: 'Brinewall community trust slightly increased. The agent\'s continued reliability registers.',
      polarity: 'gain' as const,
    },
    {
      id: 'refuse_intelligence_gap',
      kind: 'future_hook' as const,
      title: 'Intelligence Gap',
      detail: 'Rival shrine location remains unknown. The rival god continues to operate with an information advantage.',
      polarity: 'loss' as const,
    },
    {
      id: 'refuse_broker_relationship',
      kind: 'reputation' as const,
      title: 'Broker Relationship Neutral',
      detail: 'Tessaly is neutral to slightly hostile. She may approach again or become an adversary.',
      polarity: 'mixed' as const,
    },
    {
      id: 'refuse_threat_seeded',
      kind: 'future_hook' as const,
      title: 'Threat Seeded',
      detail: 'Tessaly will pursue the technique through other means — messier, less reliable, but driven by desperation.',
      polarity: 'loss' as const,
    },
    {
      id: 'refuse_principle_established',
      kind: 'reputation_tally' as const,
      title: 'Principle Established',
      detail: 'The agent network learns that alliances are not expendable. Future contacts assess the player as principled.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The offer is closed. The shrine remains hidden. Brinewall\'s sovereignty holds. What comes next?',
  reactions: [
    {
      id: 'refuse_react_find_shrine',
      label: 'Find the shrine another way.',
      intent: 'Begin independent intelligence work on the rival shrine. Slower, harder, but clean.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'independent_intelligence_pursuit',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'Agents are redirected to seek the rival shrine through independent intelligence channels — a longer road, but one that does not pass through betrayal.',
          significance: 0.7,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'shadow.quest',
          delayTicks: 20,
          priority: 1.0,
          seedLabel: 'Independent shrine intelligence gathering',
        },
      ],
    },
    {
      id: 'refuse_react_watch_tessaly',
      label: 'Watch Tessaly. She will lead us to trouble.',
      intent: 'Monitor Tessaly\'s movements. If she pursues the technique, intervene to protect Brinewall.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'tessaly_monitored',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'An agent is assigned to shadow Tessaly — if her desperation drives her toward Brinewall through dirtier channels, the player will know.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'shadow.quest',
          delayTicks: 12,
          priority: 1.1,
          seedLabel: 'Tessaly surveillance',
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

export const RIVAL_SHRINE_BETRAYAL_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'broker.quest.rival_shrine_betrayal',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: "The Broker's Ledger",
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheOffer, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'A faction broker with seventeen years on the northern trade routes offers ' +
      'the location of a rival god\'s hidden shrine — in exchange for a coastal ' +
      'settlement\'s most guarded trade secret.',
    success:
      'The bargain is struck or refused, and the world bends around the choice. ' +
      'Alliances shift, debts are cleared or compounded, and a god\'s character is ' +
      'revealed in the space between calculation and conscience.',
    failure:
      'The encounter resolves poorly — trust is damaged, intelligence is lost, ' +
      'and the broker\'s desperation deepens. The world remembers fumbled diplomacy.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      accept_trade: ACCEPT_AFTERMATH,
      refuse_trade: REFUSE_AFTERMATH,
    },
    fallback: { ...REFUSE_AFTERMATH },
  },
});

export const RIVAL_SHRINE_BETRAYAL_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(RIVAL_SHRINE_BETRAYAL_TEMPLATE);
