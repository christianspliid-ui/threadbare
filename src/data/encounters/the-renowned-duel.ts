/**
 * The Renowned Duel — reputation-gated encounter, Iron reach, power.renown gate (novel trait gate).
 *
 * Gate: requiredTargetTraits: ['trait.reputation.power.renown']
 * Pattern: required-positive — first encounter gated on power.renown (non-reach reputation trait).
 *          Reach is iron (action domain), gate is renown (access condition).
 *
 * THR-146: Middle tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const contenderSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'contender',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['guard', 'mercenary', 'soldier', 'civilian'],
  supportRole: 'challenger',
  spawnNpcRole: 'civilian',
  spawnName: 'the Contender',
};

const courtyardSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'courtyard',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'courtyard',
  fallbackName: 'The Training Yard',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [contenderSpec, courtyardSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0ThePlant: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The contender planted themselves in the agent\'s path the way someone plants themselves ' +
    'when they have been rehearsing the moment and want the blocking to be legible. A wooden ' +
    'practice blade strapped to their back — not concealed, which was also a statement. ' +
    'The stance was technically correct and carried in it the particular quality of someone ' +
    'who has been technically correct for long enough to have developed their own variations.\n\n' +
    'Their hands were steady. People\'s hands are steady when they have made a decision and ' +
    'are past the point where the decision is reversible. They had made this decision some ' +
    'time ago; what they were doing now was executing it.\n\n' +
    '"I\'ve heard {title} called by this road before," they said. Not an address — a ' +
    'statement of research. They had verified the route. They had been waiting. ' +
    '"I\'m asking for recognition. A bout. The world sees who I am when you\'re standing ' +
    'on the other side of it."',
  successAfterimage: 'The practice blade. The steady hands. The research that had gone into this moment.',
  failureAfterimage: 'The plant in the road, and then a silence that didn\'t settle the way they had practiced.',
};

const step1GrantDuel: ActionStep = {
  reach: 'iron',
  duration: { min: 3, max: 4 },
  difficulty: 0.35,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god set the agent into the bout with the quality of someone for whom this is ' +
    'a real thing happening and not a performance of a real thing. The contender felt ' +
    'the difference immediately. They adjusted. Their form was good — better than the ' +
    'practice blade suggested — and they pressed, which was the point: they had not ' +
    'asked for a lesson, they had asked for recognition, and recognition requires a ' +
    'real exchange.\n\n' +
    'The bout lasted long enough for the contender to discover three things about ' +
    'themselves they had not known before. When it ended — on a disarm, clean, the ' +
    'practice blade in the yard dust — the contender stood with the particular ' +
    'expression of someone who has been fully met for the first time and understood ' +
    'what that costs and what it means. The {title} had fought them honestly. ' +
    'That was the recognition they had asked for, and they had received it.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The disarm. The practice blade in the dust. The expression of someone who has been fully met.',
  failureAfterimage: 'The bout ran, but the quality of full presence didn\'t arrive — the contender fought well and left uncertain what they had encountered.',
};

const step1DeclineWithDignity: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0.20,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not reach for the iron channel. It reached for something adjacent — ' +
    'the register that recognizes what someone is asking for underneath what they\'re ' +
    'asking for. The contender wanted the duel, yes. Underneath the duel they wanted ' +
    'to be seen.\n\n' +
    'The agent did not unsheath anything. They walked to where the contender was ' +
    'standing and looked at them for a moment the way someone looks when they are ' +
    'actually seeing the person in front of them rather than the role the person ' +
    'is playing. Then they said: not today. And then, because the {title} understood ' +
    'what was underneath the request: but I\'ve watched how you move. You\'ve been ' +
    'working on the left shoulder — that hesitation in the third position. Someone ' +
    'saw something there and you\'ve been overcorrecting for it.\n\n' +
    'The contender\'s expression did several things in rapid succession. They had ' +
    'not expected to be seen that specifically.',
  successMetadata: { reputationDelta: 0.00 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'Not today. And then the specific observation. The contender\'s expression doing several things.',
  failureAfterimage: 'The refusal was clean but the specific observation didn\'t land — the contender left with a declined invitation and not much else.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    grant_duel_honorably: step1GrantDuel,
    decline_with_dignity: step1DeclineWithDignity,
  },
  fallback: { ...step1GrantDuel },
};

// ─── Aftermath ───────────────────────────────────────────────────

const DUEL_AFTERMATH = {
  overview:
    'The contender left the yard and spent three days on the left shoulder. Not the ' +
    'overcorrection the {title} had noticed — they went back further, to where the ' +
    'problem had started, which required finding a teacher who knew where it started ' +
    'rather than what it looked like. They found one. Two months later, they sent a ' +
    'message to the yard — not to the agent, to the yard itself, which was a specific ' +
    'form of respect — saying they would return. The message said nothing about ' +
    'whether the return was for another bout or for something else. It did not need to.',
  changes: [
    {
      id: 'duel_challenger_named',
      kind: 'reputation' as const,
      title: 'The Contender',
      detail: 'The bout was real. The contender left knowing something about themselves. They are coming back.',
      polarity: 'gain' as const,
    },
    {
      id: 'duel_rivalry_forming',
      kind: 'future_hook' as const,
      title: 'The Return',
      detail: 'The message said they would return. The nature of the return is not yet determined.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The contender found their teacher. The message says they\'re returning. Choose how the god holds the rising challenger.',
  reactions: [
    {
      id: 'duel_react_watch',
      label: 'Watch what they become.',
      intent: 'The contender was real. Let the rivalry develop on its own terms — whoever they become is worth encountering.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'iron.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.3,
          label: 'named a still-rising challenger — recognized before they were fully formed',
          revealFamilies: ['power.rivalry', 'iron.alliance', 'martial'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} fought the challenger honestly and left them knowing three things they did not know before. The message from the yard says: returning.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.rivalry_arc',
          delayTicks: 40,
          priority: 0.8,
          seedLabel: 'The contender returns with stakes raised',
        },
      ],
    },
    {
      id: 'duel_react_close',
      label: 'Regard the bout as settled.',
      intent: 'The recognition was given. The challenger was met fully. What they do with it is theirs.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'iron.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} granted the duel and fought clean. The contender found their teacher. The message from the yard arrived and was read.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

const DECLINE_AFTERMATH = {
  overview:
    'The contender went back to the left shoulder that same afternoon. They did not find ' +
    'the problem in one session, or in three — but they found the teacher eventually, ' +
    'the one who knew where it started rather than what it looked like, because the ' +
    '{title} had named it specifically enough that they could describe what they were ' +
    'looking for. A year later someone asked the contender who they had trained with ' +
    'and the contender said: a lot of people, and then paused, and said: and once ' +
    'someone turned down a bout with me and named my left shoulder. I\'ve been looking ' +
    'for that answer ever since. They said it without bitterness. That was the part ' +
    'that would have been hard to predict.',
  changes: [
    {
      id: 'decline_specific_seeing',
      kind: 'reputation' as const,
      title: 'The Named Shoulder',
      detail: 'The refusal was specific. The contender took the observation seriously. A year later they named it as formative.',
      polarity: 'gain' as const,
    },
    {
      id: 'decline_mentor_thread',
      kind: 'future_hook' as const,
      title: 'The Teacher Found',
      detail: 'The contender found their teacher because the observation was specific enough to guide a search.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The refusal became formative. The contender found their teacher. Choose what the god does with a student it did not formally take.',
  reactions: [
    {
      id: 'decline_react_follow',
      label: 'Keep a loose awareness of their development.',
      intent: 'The observation was real. Let the thread stay open — the contender who found their teacher is someone worth returning to.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'heart.mentor_bond',
          delayTicks: 25,
          priority: 0.75,
          seedLabel: 'The contender seeks counsel again',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} declined the bout and named the left shoulder. The contender found the answer. They said it without bitterness.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'decline_react_release',
      label: 'Let the contender carry what was given.',
      intent: 'The observation was given and received. What they do with it is entirely their own.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} turned down the duel and named what they saw. The contender spent a year on the answer. The god released the thread.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_RENOWNED_DUEL_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.power.the_renowned_duel',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Renowned Duel',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',

  steps: [step0ThePlant, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city', 'fortress'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.power.renown'],

  narrativeTemplates: {
    initiation:
      'A young contender plants themselves in {title}\'s path, practice blade strapped to ' +
      'their back. They ask not for a fight but for recognition — a bout so the world sees them.',
    success:
      'Recognition was given — either through the blade itself, or through the specific ' +
      'quality of attention that names something truly. The contender left knowing something ' +
      'they did not know before.',
    failure:
      'The encounter was real but the recognition did not land with full weight — the ' +
      'contender left with something, but not quite the shape of what they had asked for.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-renowned-duel.webp',
  illustrationAlt: 'Wide shot: young duelist planted in road, practice blade visible, the agent approaching, distant spectators, Threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'grant_duel_honorably',
        label: 'Accept the bout. Fight clean.',
        intent:
          'The god sets the agent into the exchange as if it is a real thing, which it is. ' +
          'No lesson, no condescension, no holding back to make the contender feel the ' +
          'gap. A real bout, honestly concluded. The contender will discover three things ' +
          'about themselves they did not know. The disarm will be clean.',
        essenceCost: 1,
        likelyBurden:
          'A contender who has been fully met once tends to return. The rival arc ' +
          'this opens runs on the contender\'s timeline, not the god\'s.',
        interventionType: 'supportive',
      },
      {
        id: 'decline_with_dignity',
        label: 'Decline the blade. Name what you see instead.',
        intent:
          'The god does not draw. It looks. It names the specific technical observation — ' +
          'the left shoulder, the overcorrection, the place where someone told the contender ' +
          'something that wasn\'t quite right and the contender believed them. The refusal ' +
          'is a different kind of recognition than the bout would have been.',
        essenceCost: 0,
        likelyBurden:
          'The contender will spend real time on the named observation. What they find ' +
          'will be theirs. The thread stays open without the god holding it.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      grant_duel_honorably: DUEL_AFTERMATH,
      decline_with_dignity: DECLINE_AFTERMATH,
    },
    fallback: { ...DUEL_AFTERMATH },
  },
};
