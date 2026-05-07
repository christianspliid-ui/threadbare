/**
 * The Letters of Introduction — two-beat social encounter.
 *
 * An agent needs access to a powerful patron. The path to that access
 * runs through an introduction: securing the letter, then using it to
 * make the case. Two branches — formal channels (Gold) or social maneuvering
 * (Heart) — converge on the same destination if successful: the patron's
 * backing, delivered as an attachment that changes what the agent can do.
 *
 * Seeds: Letters of Introduction (tomes_scrolls), which auto-grants Patron's Backing.
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

const patronSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'patron',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['official', 'elder', 'merchant', 'noble'],
  supportRole: 'potential_patron',
  spawnNpcRole: 'official',
  spawnName: 'Councilor Maevis Drent',
};

const gatekeeperSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'gatekeeper',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['official', 'steward', 'secretary'],
  supportRole: 'patron_gatekeeper',
  spawnNpcRole: 'official',
  spawnName: 'Steward Ferrick',
};

const referenceSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'reference_contact',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  reuseNpcRoles: ['merchant', 'official', 'guild_member'],
  supportRole: 'social_bridge',
  spawnNpcRole: 'merchant',
  spawnName: 'Lira Oss',
};

const chamberSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'audience_chamber',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  sublocationTypeId: 'sublocation-type.guildhall',
  fallbackName: 'The Audience Chamber',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  patronSpec,
  gatekeeperSpec,
  referenceSpec,
  chamberSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: Securing the Introduction.
 * The agent needs to get past the gatekeeper and into the room where
 * the patron will actually be present. Two paths: formal channels
 * (leverage existing standing and institutional procedure) vs. social
 * maneuvering (find the contact who can make the introduction directly).
 * Difficulty 0 — the choice is the point.
 */
const step0SecuringTheIntroduction: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'Maevis Drent was not difficult to find. Her position in the council structure was public information, her schedule was published on the board outside the civic hall on the first day of every month, and her gatekeeper — a man named Steward Ferrick who had held the role for nine years — was known in the surrounding settlements as efficient, courteous, and genuinely impenetrable to approaches that did not meet the established standard for what constituted a legitimate request for audience. This was not an accident of Ferrick\'s personality. It was a feature that Maevis Drent had cultivated carefully: a gatekeeper who could not be socially manipulated ensured that her time was spent on matters that had met a threshold of institutional credibility rather than merely persuasive energy.\n\nThe threshold was specific. Maevis Drent took audiences from parties who had standing in her institutional context (the council, the guild network, the trade routes she administered), parties who had been explicitly referred by someone who already had her confidence, or parties who had produced a formal petition through the civic hall\'s intake process, which took a minimum of three weeks and required supporting documentation. There were no exceptions to these categories. Ferrick\'s job was to determine which category a presented party fit and to turn away all parties that fit none of them without wasting Maevis Drent\'s time on the determination.\n\nThe god observed Ferrick from across the hall with the particular attention of someone identifying a mechanism rather than a person. Ferrick was not hostile and he was not susceptible to pressure; he was institutional, which meant he was a system rather than an individual, and systems have different leverage points than individuals. The question the god was considering was which of those leverage points was most efficient: the formal channel (which was real but slow and required documentation that did not yet exist), or the social bridge (which required finding someone in Maevis Drent\'s confidence network who was willing to make the introduction and whose willingness could be arrived at more quickly than three weeks of petition review).\n\nLira Oss was in the hall. She was there for unrelated reasons. She was in Maevis Drent\'s confidence network in the specific way that a merchant who has successfully delivered on three consecutive contracts occupies a particular tier of institutional trust — not close, not intimate, but present and verified. She was also, in this specific morning at this specific table with her ledger, accessible in a way she would not be for the next fourteen days, which was how long her current route would keep her moving between settlements. The god calculated the timing and found it instructive.',
  successAfterimage: 'The god identified the mechanism and the access point. The choice of path would determine how the introduction was secured.',
  failureAfterimage: 'The god read the mechanism but arrived at the moment without sufficient clarity to act on it.',
};

/**
 * Step 1 — Work the Formal Channel variant.
 * The god works through institutional leverage — ensuring documentation
 * appears, processes accelerate, or standing is recognized.
 * Gold reach at difficulty (0.45).
 */
const step1WorkTheFormalChannel: ActionStep = {
  reach: 'gold',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.08 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.04 },
    },
  ],
  failBehavior: 'fail_action',
  successMetadata: {
    rewardPool: {
      categoryWeights: { tomes_scrolls: 1.0 },
      tagFilters: ['#patronage'],
    },
  },
  narrativeTemplate:
    'The formal channel moved the way formal channels move when a god is paying attention to the friction in them: not faster, exactly, but with fewer of the small delays that accumulate between a submitted request and an acknowledged one. Ferrick received the documentation — properly formatted, referencing the correct institutional codes, submitted through the civic hall intake as the procedure required — and found it difficult to identify a reason to return it for revision. He was the kind of gatekeeper who returned documents for revision on technical grounds when the substance of the request was borderline, and the documents before him had no technical grounds to return them on. He forwarded them to Maevis Drent\'s scheduling desk. Her scheduling desk found an opening in the calendar that was technically a maintenance window but was technically a window.\n\nThe god\'s work was in the technically. Institutions run on precedent and technical interpretation, and technical interpretations have a narrow field of legitimate discretion that can be influenced without being forced. The god had not forged the documents or invented the standing they referenced; it had ensured that the legitimate elements of the case were presented in the order and framing that gave Ferrick the least institutional cover for refusal. The result was an appointment: a specific day and time, written in ink, placed on the calendar with Ferrick\'s notation that the request had met the threshold for formal audience.\n\nThe meeting itself was brief and formal and conducted at the level of surface courtesies that serve as a first-contact protocol between parties who do not yet know whether they are going to be useful to each other. Maevis Drent asked precise questions. The answers were sufficient. At the end of the meeting she produced from her desk drawer three sheets of paper bearing her seal — folded, not formally bound, which was how she produced letters of introduction when she was satisfied with the first meeting but not yet certain — and set them on the table between the parties. They were not yet signed. She would sign them if the follow-up documentation met the standard of the initial presentation. The god could feel, in the economy of that gesture, that the follow-up documentation would meet the standard.',
  successAfterimage: 'The formal channel held. Maevis Drent placed three unsealed sheets on the table — introduction pending final review.',
  failureAfterimage: 'The documentation ran into a revision request that could not be resolved within the available window. The appointment was deferred.',
};

/**
 * Step 1 — Work the Social Bridge variant.
 * The god works through Lira Oss — the contact in the hall who can
 * make the introduction without the three-week process.
 * Heart reach at difficulty (0.40).
 */
const step1WorkTheSocialBridge: ActionStep = {
  reach: 'heart',
  duration: { min: 3, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.06 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.06 },
    },
  ],
  failBehavior: 'fail_action',
  successMetadata: {
    rewardPool: {
      categoryWeights: { tomes_scrolls: 1.0 },
      tagFilters: ['#patronage'],
    },
  },
  narrativeTemplate:
    'Lira Oss had not come to the hall to make introductions. She had come to close a routine ledger reconciliation that should have taken forty minutes and had taken, due to a discrepancy in one column that neither she nor the hall\'s accountant could trace, closer to two hours. She was tired, slightly frustrated, and in possession of a piece of information that was relevant to the current moment: she owed Maevis Drent a favor that had been sitting unresolved for eight months, and she had been looking for a suitable vehicle for its resolution without wanting to appear to be looking, which was the specific social difficulty of favors owed to people who are more powerful than you and who have not asked for repayment.\n\nThe god\'s touch was light in the way that Heart-reach influence is light when it is working correctly: not a push but a clarification. The relevance of the favor and the relevance of the party in the hall who needed an introduction to Maevis Drent became visible to Lira Oss in the same moment, the way two unrelated facts sometimes align in a single moment of recognition and produce a third fact that was implicit in the original two. She looked up from her reconciled ledger. She looked across the hall. The god held the alignment steady for the moment it needed to be held.\n\nLira Oss made the introduction herself. She walked to Ferrick\'s desk and named the favor she was owed — not calling it in formally, because the social register of favors between people at different institutional levels does not use formal language, but making it present as a context — and said that she was personally vouching for the party who had requested audience with Maevis Drent. Ferrick heard the name of the party and the name of Lira Oss and the register of the favor and wrote an immediate appointment in the morning schedule. Maevis Drent received the letter vouching for the introduction from Lira\'s hand and produced, in response, three folded sheets bearing her seal and a note that the follow-up meeting was already scheduled.\n\nLira Oss walked out of the hall with her ledger under her arm and the particular satisfaction of someone who has found a satisfying vehicle for a favor that had been sitting awkwardly for eight months. She did not attribute the alignment to anything other than good timing, which was an accurate description of the timing and an incomplete description of why the timing had been good.',
  successAfterimage: 'Lira made the introduction. The favor resolved itself into Maevis Drent\'s calendar and three folded sheets.',
  failureAfterimage: 'The alignment that would have connected Lira\'s favor to the introduction dissolved before it could be used.',
};

/**
 * Step 1: Branch point.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    work_the_formal_channel: step1WorkTheFormalChannel,
    work_the_social_bridge: step1WorkTheSocialBridge,
  },
  fallback: { ...step1WorkTheFormalChannel },
};

// ─── Aftermath Config ────────────────────────────────────────────

const FORMAL_CHANNEL_AFTERMATH = {
  overview:
    'The follow-up documentation met the standard, which the god had ensured not by falsifying it but by ensuring that the legitimate elements of the case were assembled in the order and completeness that institutions reward. Maevis Drent signed the three sheets and had Ferrick apply her seal and fold them into the envelope that her office used for formal introductions. The envelope bore three wax seals. The seals were not decorative. Each one represented a different tier of institutional recognition within the network of people who made decisions about who was allowed to do things in this part of the world.\n\nFerrick delivered the envelope with the professional neutrality of someone who had processed thousands of exactly this kind of transaction and had never once confused delivery with endorsement. He told the recipient what the seals meant, in order, in the formal language of the letter of introduction, and then he went back to his desk and noted the completion in the appointments ledger. Maevis Drent, already in her next meeting, had no awareness of the moment the letters passed out of her office into the hands of the party who had requested them. This was by design. A patron who tracks every letter they write is a patron who has time for nothing else.',
  changes: [
    {
      id: 'formal_letters_secured',
      kind: 'item' as const,
      title: 'Letters of Introduction',
      detail: 'Three folded sheets, three wax seals. Show them once and doors open. The content_grant fires: Patron\'s Backing is active.',
      polarity: 'gain' as const,
    },
    {
      id: 'formal_maevis_committed',
      kind: 'reputation' as const,
      title: 'Maevis Drent',
      detail: 'A patron now, formally. Her backing is specific and limited and documented. She knows what she has extended and why.',
      polarity: 'gain' as const,
    },
    {
      id: 'formal_ferrick_noted',
      kind: 'reputation' as const,
      title: 'Steward Ferrick',
      detail: 'The introduction is in the appointments ledger. Ferrick noted the process as technically correct and within established thresholds.',
      polarity: 'info' as const,
    },
    {
      id: 'formal_institutional_standing',
      kind: 'future_hook' as const,
      title: 'Institutional Standing',
      detail: 'The formal channel leaves a record. Maevis Drent\'s network now has a documented basis for the relationship. Future requests will be measured against this one.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The letters are in hand. Patron\'s Backing is active. What does the god do with the standing that was bought through institutions?',
  reactions: [
    {
      id: 'formal_react_let_stand',
      label: 'Let the record stand.',
      intent: 'The process was followed, the documentation is correct, and the backing is now active through its proper channels. The god withdraws from the relationship and lets the formal record speak for itself. What was secured was secured honestly, and honest records tend to remain secure.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The Letters of Introduction are in hand. Patron\'s Backing is active through institutional channels.',
          significance: 0.5,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'formal_react_deepen_connection',
      label: 'Deepen the connection to Maevis Drent.',
      intent: 'The formal relationship is now documented. The god maintains attention on Maevis Drent — not the gatekeeper, but the patron herself — because a patron who has formally extended backing once is in a relationship that can be developed. The letters are the beginning of something, not the end of it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'patron_network_depth',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god maintains attention on Maevis Drent. The formal introduction becomes the opening of a relationship rather than a transaction.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'liminal.quest',
          delayTicks: 25,
          priority: 1.0,
          seedLabel: 'Maevis Drent — patron relationship deepens into ongoing thread',
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;

const SOCIAL_BRIDGE_AFTERMATH = {
  overview:
    'The letters arrived through Lira Oss\'s hands rather than through the formal process, which meant they arrived without the three-week lead time and with the particular quality of legitimacy that comes from personal vouching rather than institutional documentation. Three wax seals, same as the formal version. The content of what Maevis Drent\'s backing meant was identical: the network recognized the letters, the doors they were designed to open would open. The difference was in how the backing had been constituted and what Lira Oss now carried as a result.\n\nLira Oss had used her favor. The eight-month debt was resolved. She felt clean about it, the way you feel clean about a debt that has been discharged through a transaction that was mutually beneficial rather than extracted. This was accurate as far as it went. What it did not account for was that the alignment the god had arranged — the specific moment in which Lira\'s unresolved favor and the introduction requirement had become visible to her as connected — was not natural coincidence, even though it had felt like natural coincidence. Lira Oss had made her own choice. She had been given unusually clear visibility of the option before she made it. The god held the distinction between these two things and found it philosophically interesting and practically unimportant.',
  changes: [
    {
      id: 'social_letters_secured',
      kind: 'item' as const,
      title: 'Letters of Introduction',
      detail: 'Secured through Lira\'s vouching rather than formal process. Three wax seals. Patron\'s Backing is active.',
      polarity: 'gain' as const,
    },
    {
      id: 'social_maevis_engaged',
      kind: 'reputation' as const,
      title: 'Maevis Drent',
      detail: 'Extended backing on the basis of Lira\'s vouching. The relationship is real but constituted differently than the formal channel.',
      polarity: 'gain' as const,
    },
    {
      id: 'social_lira_discharged',
      kind: 'reputation' as const,
      title: 'Lira Oss',
      detail: 'Her eight-month debt to Maevis Drent is discharged. She feels clean about the transaction and will not trace the alignment that made it possible.',
      polarity: 'gain' as const,
    },
    {
      id: 'social_informal_standing',
      kind: 'future_hook' as const,
      title: 'Informally Constituted Backing',
      detail: 'The relationship exists but does not have the formal documentation of the institutional channel. If challenged, the backing rests on Lira\'s vouching rather than on procedure.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The letters are in hand. Patron\'s Backing is active. What does the god keep of the network that made this possible?',
  reactions: [
    {
      id: 'social_react_release_lira',
      label: 'Release Lira from the god\'s attention.',
      intent: 'Lira Oss did what she did with her own will and her own standing. The god\'s role was in the visibility of the option, not in the choice. She is owed nothing further. The god withdraws its attention from her and lets the discharged favor become the full story of the morning.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god releases Lira Oss from its attention. The Letters of Introduction are active through her vouching.',
          significance: 0.4,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'social_react_note_the_bridge',
      label: 'Note the bridge for future use.',
      intent: 'Lira Oss moves between contexts that are otherwise not in contact. A merchant who is trusted by institutional actors and is willing to vouch when the conditions are right is a more durable resource than any single introduction. The god keeps a light awareness of her position in the network.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.3,
          label: 'Lira Oss — social bridge, used once. Light thread maintained for future cross-context connection.',
          revealFamilies: ['liminal.quest', 'gold', 'heart'],
        },
      ],
      closeAfterSelection: true,
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

export const LETTERS_OF_INTRODUCTION_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'enc.letters_of_introduction',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Letters of Introduction',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',

  steps: [step0SecuringTheIntroduction, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['town', 'castle', 'guildhall', 'temple'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'A powerful patron\'s backing is available — but the path to it runs through an introduction ' +
      'that has not yet been made. Steward Ferrick guards the calendar. Lira Oss is in the hall ' +
      'with an unresolved favor. The god identifies the mechanism.',
    success:
      'The god works through formal channels or social bridges and the introduction is secured. ' +
      'Three wax-sealed sheets pass into the right hands. Patron\'s Backing activates.',
    failure:
      'The channel closes before the introduction can be made. The documentation falls short ' +
      'or the alignment dissolves. Maevis Drent\'s calendar remains closed.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/letters-of-introduction.jpg',
  illustrationAlt: 'A civic hall interior, morning light through tall windows — a gatekeeper at a desk reviewing documents, a merchant pausing mid-step with a ledger under her arm, and across the hall a closed door bearing the seal of a council patron',

  authoredChoices: {
    0: [
      {
        id: 'work_the_formal_channel',
        label: 'Work the Formal Channel',
        intent:
          'The god moves through the institution rather than around it. The civic intake process has a three-week floor, but the floor rests on the assumption of documentation that is incomplete or improperly assembled. Gold-reach attention flows into the preparation of the case: the right codes, the right formatting, the right order of the legitimate elements. Ferrick receives a submission that has no technical grounds for return. The scheduling desk finds a window that is technically a window. The god does not counterfeit institutional standing — it ensures that the actual standing is presented in the form that institutions can recognize.',
        targetLabel: 'Steward Ferrick',
        essenceCost: 1,
        likelyBurden:
          'Institutional channels are slower than alternatives even with divine attention reducing friction. If the documentation has a substantive gap rather than a presentational one, Gold-reach influence on format cannot fill it.',
        interventionType: 'supportive',
      },
      {
        id: 'work_the_social_bridge',
        label: 'Work the Social Bridge',
        intent:
          'The god identifies Lira Oss in the hall: a merchant in Maevis Drent\'s confidence network, present at a moment when her unresolved favor to the patron has been sitting for eight months. Heart-reach attention flows into the alignment between two unrelated facts — the favor and the introduction request — making their connection visible to Lira as natural recognition rather than divine prompting. She sees the option. She decides whether to use it. The god holds the alignment for exactly as long as it needs to be held. What Lira does with the clarity is her own.',
        targetLabel: 'Lira Oss',
        essenceCost: 1,
        likelyBurden:
          'The social bridge rests on Lira choosing to act on the alignment. If she calculates that using her favor this way is not worth it, or if the timing shifts before she acts, the bridge was readable and went unused.',
        interventionType: 'supportive',
      },
    ],
    1: [
      {
        id: 'clear_the_last_friction',
        label: 'Clear the Last Friction',
        intent:
          'The approach is in motion. The god works on the remaining small frictions — the ambiguity in the follow-up appointment, the question about one piece of documentation, the moment when Maevis Drent decides whether the first meeting was worth a second. Gold or Heart attention flows into exactly those points, clarifying without forcing, ensuring that each small decision that could go either way goes the right way. The introduction becomes nearly certain without any single point of the process feeling improbable.',
        essenceCost: 0,
        likelyBurden:
          'Light work on multiple small frictions is efficient if there are no structural problems. If the case itself has a substantive gap — something that Maevis Drent will actually object to rather than merely note — the small-friction approach does not address it.',
        interventionType: 'supportive',
      },
      {
        id: 'make_the_case_land',
        label: 'Make the Case Land',
        intent:
          'The god invests fully in the moment of the meeting itself: the words that land versus the words that inform, the hesitation that reads as honesty versus the hesitation that reads as evasion, the specific framing that makes Maevis Drent\'s decision obvious to her rather than a calculation she performs. Gold and Heart attention, combined at the meeting\'s pivot, ensure that the case is received the way it needs to be received. Three sealed sheets follow as the natural conclusion of a meeting that was always going to end this way.',
        essenceCost: 2,
        likelyBurden:
          'Full investment in the meeting\'s reception leaves a mark on how the backing is constituted. A patron who feels that their decision was obvious is sometimes one who later wonders why it felt so obvious. Maevis Drent is perceptive.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      work_the_formal_channel: FORMAL_CHANNEL_AFTERMATH,
      work_the_social_bridge: SOCIAL_BRIDGE_AFTERMATH,
    },
    fallback: { ...FORMAL_CHANNEL_AFTERMATH },
  },

  description:
    'An agent needs a powerful patron\'s backing. The path runs through an introduction secured either through institutional process ' +
    'or a social bridge with an unresolved favor. Success grants Letters of Introduction, which auto-activate Patron\'s Backing.',
});

export const LETTERS_OF_INTRODUCTION_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(LETTERS_OF_INTRODUCTION_TEMPLATE);
