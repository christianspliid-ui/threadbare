/**
 * The Blinded Oracle — reputation-gated encounter, Eye reach, required-negative + iron.positive blocked.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.eye.negative'] AND
 *       iron.positive has encounterGates.blocks: ['reputation.eye.the_blinded_oracle']
 *
 * Pattern: mixed-polarity — requires eye.negative AND rejects iron.positive holders.
 * The seer speaks only to those whose sight is already discredited, and refuses those
 * who come armed in martial renown. The proud cannot enter.
 *
 * THR-147: Final tranche of reputation-gated content (NOVEL gate pattern).
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const seerSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'blinded_seer',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['oracle', 'hermit', 'seer', 'civilian'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Blinded Seer',
};

const dyingGroveSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'dying_grove',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'wilderness',
  fallbackName: 'The Dying Grove',
};

const hermitHutSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'hermit_hut',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'hut',
  fallbackName: 'The Hermit\'s Hut',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [seerSpec, dyingGroveSpec, hermitHutSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheSeer: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The grove was dying in the specific way groves die when the soil beneath them ' +
    'has been changed by something that doesn\'t announce itself — thinning canopy, ' +
    'bark that had the wrong color in the wrong places, a quality of light through ' +
    'the remaining leaves that made everything underneath look like it was happening ' +
    'at the wrong time of day. The hut at its edge was the kind of structure that had ' +
    'been there long enough that nobody could remember when it hadn\'t been.\n\n' +
    'The seer was seated inside, facing the door. The eyes were open and the eyes ' +
    'were not there, in the way of eyes that have been gone long enough that the ' +
    'face has reorganized itself around their absence. She did not turn her head ' +
    'when the agent arrived, because she had already known they were coming in ' +
    'the way she knew most things — by means that the people who had taken her ' +
    'sight had been trying to address when they took it.\n\n' +
    '"I know who stands in the doorway," she said. Not a question. "{title}." ' +
    'She gestured toward the low bench against the wall without looking at it. ' +
    '"Sit. You can hear what I have to give. Others could not. I do not speak to ' +
    'the famed. I do not speak to the proud. You have come here because the world ' +
    'no longer believes your sight. That is why I will speak to you." ' +
    'She had a prophecy. She had been keeping it for some time.',
  successAfterimage: 'She knew who stood in the doorway. She gestured to the bench without turning.',
  failureAfterimage: 'She sensed the arrival but something in the threshold hadn\'t fully resolved — the acknowledgment partial.',
};

const step1TakeProphecy: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god settled the cost of receiving through the agent and let the prophecy ' +
    'arrive. Not gently — the seer had been keeping this for long enough that it ' +
    'had accumulated the particular density of words that have been held rather than ' +
    'spoken, and it arrived in the {title}\'s awareness with the weight of a thing ' +
    'that has been waited for.\n\n' +
    'The seer spoke for a long time. Not all of it was immediately comprehensible. ' +
    'This was expected — prophesied things tend to become clear around their edges ' +
    'before they become clear at their center, which is why prophets give them to ' +
    'people who have time rather than people who are accustomed to immediate results. ' +
    'The {title} paid the essence the encounter demanded and carried the prophecy ' +
    'out of the hut, into the dying grove, where the light was still doing that thing ' +
    'with the angle that made everything feel like the wrong time of day.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The prophecy given and received. The seer sat back. The grove outside unchanged.',
  failureAfterimage: 'The prophecy began to arrive but something in the reception was partial — not all of it landed.',
};

const step1AskAboutSight: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0.30,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god redirected the agent\'s attention from the prophecy to the seer — from ' +
    'what she was about to give to what had been taken from her. The {title} sat on ' +
    'the bench and did not ask for the prophecy. They asked the older question: ' +
    'how did you lose your sight?\n\n' +
    'She was quiet for a long time. The sitting-quiet of someone deciding whether ' +
    'the question was earned. It had been earned, she decided, which was why she ' +
    'had given the bench to someone whose sight the world had dismissed — because ' +
    'a person who knows what it is to have their seeing taken away has some claim ' +
    'on understanding how sight is taken.\n\n' +
    'She answered slowly, with the precision of someone relating events they have ' +
    'told themselves many times in private and are now telling aloud for the first ' +
    'or second time. There was an order. They had a name. The reason was institutional ' +
    'and also specific. The {title} left the hut knowing something about the shape ' +
    'of what had been done that the seer had been holding alone for a very long time.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The older question asked. She answered it. Something long held alone was shared.',
  failureAfterimage: 'The question was asked but she wasn\'t yet certain the asking was earned — the answer partial.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    take_the_prophecy: step1TakeProphecy,
    ask_how_she_lost_her_sight: step1AskAboutSight,
  },
  fallback: { ...step1TakeProphecy },
};

// ─── Aftermath ───────────────────────────────────────────────────

const PROPHECY_AFTERMATH = {
  overview:
    'The prophecy had conditions. The first condition was environmental — something about ' +
    'the state of the dying grove — and it became visible within the first few weeks. ' +
    'The second condition was about a person. The third was about a choice. The {title} ' +
    'had not yet arrived at the second or third condition, but the first one\'s becoming-visible ' +
    'was enough to confirm that the seer had been speaking about something real. ' +
    'This was simultaneously reassuring and not. The order that had taken her sight ' +
    'maintained watchers at specific places for exactly the reason that prophets were ' +
    'dangerous when they found recipients — someone would notice that a {title} had been ' +
    'to the hut at the dying grove, and would begin to ask why.',
  changes: [
    {
      id: 'prophecy_received',
      kind: 'reputation' as const,
      title: 'The Blinded Oracle\'s Prophecy',
      detail: 'Carried now by the one the world does not believe. Its first condition has already begun. The order that blinded her has watchers.',
      polarity: 'mixed' as const,
    },
    {
      id: 'prophecy_order_notices',
      kind: 'future_hook' as const,
      title: 'The Order\'s Watchers',
      detail: 'They see who visits the hut. A {title} with a discredited sight visiting a blinded seer is not a random event to the order that blinded her.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The prophecy is held. Its first condition is already becoming visible. The order that blinded her has noticed your visit. Choose how you carry what was given.',
  reactions: [
    {
      id: 'prophecy_react_hold',
      label: 'Hold the prophecy close and wait for its second condition.',
      intent: 'The first condition is visible. The second hasn\'t arrived yet. Wait without moving toward it — let it come.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'divine_favor' as const,
          severity: 0.55,
          label: 'carries the blinded oracle\'s prophecy — its conditions are beginning to unfold',
          revealFamilies: ['eye.prophecy', 'oracle', 'seer'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} received a prophecy from the blinded oracle. The world did not believe their sight — she gave the prophecy to them because of it. Its first condition is already visible.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.prophecy_reckoning',
          delayTicks: 45,
          priority: 0.85,
          seedLabel: 'The prophecy\'s first condition is fully resolved; the second begins',
        },
      ],
    },
    {
      id: 'prophecy_react_investigate_order',
      label: 'Investigate the order that blinded her.',
      intent: 'The prophecy is one thread. The order that took her sight is another. Follow the second before the first requires it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.negative',
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
          message: 'The {title} received the prophecy and then began investigating the order that blinded the seer. The order\'s watchers have noticed both movements.',
          significance: 0.7,
        },
        {
          kind: 'spawn_clue' as const,
          source: 'encounter_outcome' as const,
          precision: 'vague' as const,
          targetRuinId: '$nearest_ruin',
        },
      ],
    },
  ],
} as const;

const STORY_AFTERMATH = {
  overview:
    'The seer had told the story of her blinding twice before: once to herself, ' +
    'the night it happened, as a way of turning it into something she could hold ' +
    'without being destroyed by it; and once to a traveler who had asked the wrong ' +
    'question with the right quality of attention. The {title} made the third telling. ' +
    'Each telling had shaped the story slightly differently — not the facts, but the ' +
    'weight of the different parts, the way long-held things adjust themselves to fit ' +
    'the ear that receives them. The order had a name. The reason had a structure. ' +
    'The {title} left the hut having asked the older question and received the older answer. ' +
    'The prophecy was still in the seer\'s keeping. It would wait.',
  changes: [
    {
      id: 'story_told',
      kind: 'reputation' as const,
      title: 'The Older Question',
      detail: 'The story of her blinding told to someone who earned the asking. The order that did it now knows an outsider came to the hut.',
      polarity: 'gain' as const,
    },
    {
      id: 'story_order_movement',
      kind: 'future_hook' as const,
      title: 'The Order Investigates',
      detail: 'The order that blinded her has watchers. An outsider asking the older question is the kind of event they notice.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The older question was answered. The prophecy is still in the seer\'s keeping. The order that blinded her has noticed your visit. Choose what you do with what you now know.',
  reactions: [
    {
      id: 'story_react_investigate',
      label: 'Investigate the order.',
      intent: 'The seer gave a name and a structure. Act on what was told before the order can adjust for the telling.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'eye.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.order_investigates',
          delayTicks: 30,
          priority: 0.7,
          seedLabel: 'The order that blinded her notices an outsider asked',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} asked the blinded oracle how she lost her sight. She answered. The order that blinded her has noticed the visit.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'story_react_hold',
      label: 'Hold what you were told without acting on it yet.',
      intent: 'The older question has an older answer now. Let it settle before deciding what it asks of you.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sat with the blinded oracle and asked how she lost her sight. The story was told. The prophecy was not taken. It will wait.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_BLINDED_ORACLE_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.eye.the_blinded_oracle',
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Blinded Oracle',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheSeer, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['wilderness', 'ruin', 'settlement'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.eye.negative'],

  narrativeTemplates: {
    initiation:
      'In a hermit\'s hut at the edge of a dying grove, a blinded seer does not turn ' +
      'when {title} arrives at the doorway. She already knows who stands there. She ' +
      'speaks only to those the world no longer believes. She refuses the famed and ' +
      'the proud. She has a prophecy that has been waiting for the right ear.',
    success:
      'The hut was left changed — either the prophecy was received and carries its ' +
      'conditions forward, or the older question was asked and the older answer given.',
    failure:
      'The arrival was acknowledged but the exchange did not complete — the prophecy ' +
      'partially given or the question only partially answered.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-blinded-oracle.png',
  illustrationAlt: 'Wide shot: low hut interior, seated blinded figure in grey, visitor on a low bench, thin light from a single high window, a dying tree visible outside.',

  authoredChoices: {
    0: [
      {
        id: 'take_the_prophecy',
        label: 'Sit. Take the prophecy.',
        intent:
          'The god settles the cost of receiving through the agent and lets what has ' +
          'been kept arrive. The seer chose {title} specifically — the discredited sight ' +
          'is not a barrier to the prophecy but the condition for it. The famed cannot ' +
          'enter this hut. The proud are turned away. The {title} is here because they ' +
          'are neither, and the prophecy has conditions that require someone the world ' +
          'does not already believe will receive them.',
        essenceCost: 2,
        likelyBurden:
          'A prophecy with conditions binds both ways. Its first condition is already ' +
          'beginning. The order that blinded the seer maintains watchers. They will ' +
          'notice who visits the hut.',
        interventionType: 'supportive',
      },
      {
        id: 'ask_how_she_lost_her_sight',
        label: 'Refuse the prophecy. Ask how she lost her sight.',
        intent:
          'The god redirects the agent from the gift to the giver. The prophecy is not ' +
          'taken. Instead {title} asks the older question — the one that requires the ' +
          'asking to have been earned by a specific kind of experience. She answers slowly, ' +
          'with the precision of a story told aloud for perhaps the second or third time. ' +
          'The order has a name. The reason has a structure.',
        essenceCost: 0,
        likelyBurden:
          'The order that blinded her has watchers at specific locations. An outsider ' +
          'who asks the older question about a blinded oracle is exactly the kind of ' +
          'event they track.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      take_the_prophecy: PROPHECY_AFTERMATH,
      ask_how_she_lost_her_sight: STORY_AFTERMATH,
    },
    fallback: { ...PROPHECY_AFTERMATH },
  },
};
