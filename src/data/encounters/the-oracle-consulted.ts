/**
 * The Oracle Consulted — reputation-gated encounter, Eye reach, required-positive (standalone).
 *
 * Gate: requiredTargetTraits: ['trait.reputation.eye.positive']
 * Pattern: required-positive — Eye+ standalone (first tranche only used Eye in AND with Veil).
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

const scholarOneSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'scholar_one',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['scholar', 'priest', 'archivist', 'traveler'],
  supportRole: 'first_scholar',
  spawnNpcRole: 'civilian',
  spawnName: 'the First Scholar',
};

const scholarTwoSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'scholar_two',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  reuseNpcRoles: ['scholar', 'archivist', 'scribe'],
  supportRole: 'second_scholar',
  spawnNpcRole: 'civilian',
  spawnName: 'the Second Scholar',
};

const librarySpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'library',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'library',
  fallbackName: 'The Archive Hall',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [scholarOneSpec, scholarTwoSpec, librarySpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheTablet: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'They had carried it wrapped in oilcloth for three days, which was visible in the ' +
    'careful way they unwrapped it — slowly, with the corners first, the cloth folded ' +
    'back rather than peeled. A clay tablet, palm-sized, the kind made when something ' +
    'needs to last. The inscription was old enough that the scholars had not been able ' +
    'to find anyone who recognized the script, until enough people pointed them at {title}.\n\n' +
    'The glyphs were not magic. They were an ancestor script — a writing system the guild ' +
    'that trained these scholars had lost two hundred years ago, which meant the scholars ' +
    'knew the guild had once had it, and knew what its loss implied about what else had ' +
    'been lost in the same period. The tablet sat on the trestle table between them. ' +
    'Candlelight moved across it. The two scholars did not speak. They had said what ' +
    'they needed to say before the unwrapping.',
  successAfterimage: 'The tablet on the trestle table. The oilcloth folded back. The scholars waiting.',
  failureAfterimage: 'The tablet unwrapped, but the recognition it required arrived at an oblique angle.',
};

const step1ReadOpenly: ActionStep = {
  reach: 'eye',
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
    'The god leaned the agent\'s attention into the inscription and let it speak. The ' +
    'script was a survival-system — designed to be read under duress, by someone who ' +
    'knew the underlying grammar but not the surface forms. The agent read it aloud: ' +
    'a land-grant, a disputed border, and a name repeated three times that the scholars ' +
    'would spend the next year understanding the significance of.\n\n' +
    'The first scholar\'s hands moved to their satchel and back without reaching into it. ' +
    'The second scholar sat down, which they had not done before. The reading took twelve ' +
    'minutes. The silence after it took longer. The {title} had given them not an ' +
    'interpretation but the actual text, which was worse and better than an interpretation ' +
    'in all the ways that actual texts are worse and better.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The reading completed. The second scholar sat down. The name repeated three times.',
  failureAfterimage: 'The reading reached most of the text but not all — something in the resolution lost its edge.',
};

const step1GiveRiddle: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god read the tablet and gave back something true but not literal — a frame that ' +
    'pointed at the meaning without delivering it, so the scholars would have to close the ' +
    'remaining distance themselves. This was not cruelty. It was the difference between ' +
    'being told where the water is and learning to read the land for it.\n\n' +
    'The first scholar heard the frame and reached for paper. The second heard the same ' +
    'frame and said: that\'s a border claim, isn\'t it, and the first said: it is, but ' +
    'which border, and then they were talking to each other faster than they had been ' +
    'talking to the {title}, which meant the answer was arriving through them rather ' +
    'than at them. After three minutes of this the first scholar looked up and said: ' +
    'the name. What about the name. The agent left them with that.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The scholars talking faster than they had been. The name, hanging. The agent left.',
  failureAfterimage: 'The frame was offered but did not catch — the scholars looked at each other and then at their hands.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    read_it_openly: step1ReadOpenly,
    give_truth_as_riddle: step1GiveRiddle,
  },
  fallback: { ...step1ReadOpenly },
};

// ─── Aftermath ───────────────────────────────────────────────────

const READ_AFTERMATH = {
  overview:
    'The scholars transcribed the reading that same evening. The land-grant it described ' +
    'was for territory that three current settlements were built on, which the scholars ' +
    'spent two weeks deciding whether to publish. They published it. The reaction was, ' +
    'as the scholars had expected, complicated. A third scholar at a different institution ' +
    'heard about the reading and wrote a letter asking about the lost script — not the ' +
    'tablet\'s content but the script itself, how much of it remained readable, where ' +
    'else examples might be found. The letter was addressed to {title}.',
  changes: [
    {
      id: 'read_openly_transcript',
      kind: 'reputation' as const,
      title: 'The Lost Script',
      detail: 'The reading was given plain. The scholars published it. The complication followed.',
      polarity: 'gain' as const,
    },
    {
      id: 'read_third_scholar',
      kind: 'future_hook' as const,
      title: 'The Letter',
      detail: 'A third scholar wrote to ask about the script itself — not the content, the system.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The reading is out. The complication is live. The third scholar\'s letter is waiting.',
  reactions: [
    {
      id: 'read_react_answer',
      label: 'Answer the third scholar\'s letter.',
      intent: 'The lost script has a reader. Let that thread continue.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.4,
          label: 'holds the tablet\'s true reading — the lost script is partially recovered through this encounter',
          revealFamilies: ['eye.revelation', 'scholar', 'archive'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} read the lost script aloud. The scholars published it. A third scholar wrote.',
          significance: 0.55,
        },
      ],
    },
    {
      id: 'read_react_leave',
      label: 'Leave the scholars to the complication.',
      intent: 'The reading was given. What it sets in motion is theirs to manage.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} read the lost script and left. The scholars are managing the complication.',
          significance: 0.45,
        },
      ],
    },
  ],
} as const;

const RIDDLE_AFTERMATH = {
  overview:
    'The scholars worked out the answer themselves, which took four days and produced two ' +
    'competing interpretations that they then spent a week reconciling into one. The ' +
    'reconciled version was more accurate than either interpretation alone, which was the ' +
    'point. The name they had been stuck on turned out to be a title, not a person, which ' +
    'changed the nature of the land-grant substantially. A rival scholar at a different ' +
    'institution heard about the process and was bothered by the method — not the answer, ' +
    'the method — and wrote a document criticizing it that circulated in circles the ' +
    'two scholars had not previously been part of. The criticism made them known.',
  changes: [
    {
      id: 'riddle_scholars_arrived',
      kind: 'reputation' as const,
      title: 'The Earned Answer',
      detail: 'The scholars worked it out. The method became the story as much as the answer.',
      polarity: 'gain' as const,
    },
    {
      id: 'riddle_rival_attention',
      kind: 'future_hook' as const,
      title: 'The Rival\'s Notice',
      detail: 'A rival scholar is bothered by the method. Criticism that makes you known is not entirely loss.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The scholars earned their answer. A rival is now paying attention. Choose how to hold that.',
  reactions: [
    {
      id: 'riddle_react_let_echo',
      label: 'Let the riddle\'s echo reach where it will.',
      intent: 'The method was deliberate. What it attracted — including the rival — is part of the design.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.riddle_pursued',
          delayTicks: 35,
          priority: 0.7,
          seedLabel: 'The rival scholar follows the method\'s trail',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} gave the truth as a riddle. The scholars arrived. The rival noticed the method.',
          significance: 0.5,
        },
      ],
    },
    {
      id: 'riddle_react_quiet',
      label: 'Let the scholars have their answer quietly.',
      intent: 'The rival\'s attention is not invited. Let the work stand without amplification.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} spoke in riddle. The scholars worked it out themselves. The answer arrived earned.',
          significance: 0.45,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_ORACLE_CONSULTED_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.eye.the_oracle_consulted',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Oracle Consulted',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheTablet, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'hamlet', 'ruins', 'wilderness'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.eye.positive'],

  narrativeTemplates: {
    initiation:
      'Two scholars arrive with a sealed clay tablet whose inscription they cannot decipher. ' +
      'Word of {title} brought them across three days of road.',
    success:
      'The tablet gave up its meaning — either plainly, or in a form the scholars had to ' +
      'close the distance to themselves. Either way, what was sealed is not sealed anymore.',
    failure:
      'The reading reached most of the text but something in the resolution lost its edge — ' +
      'the scholars left with more than they arrived with, but not as much as the tablet held.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-oracle-consulted.webp',
  illustrationAlt: 'Wide shot: trestle table, candlelight, clay tablet centered between two scholars with oilcloth folded back, painterly, Threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'read_it_openly',
        label: 'Read the inscription aloud. Give the scholars the text itself.',
        intent:
          'The god leans the agent\'s full attention into the inscription and delivers what ' +
          'it says — not interpretation, not summary, but the actual reading. Twelve minutes ' +
          'of the lost script rendered into spoken language. The scholars will have to decide ' +
          'what to do with it.',
        essenceCost: 1,
        likelyBurden:
          'The scholars now have a text that touches three settlements\' territorial claims. ' +
          'What they do with it is theirs to carry.',
        interventionType: 'supportive',
      },
      {
        id: 'give_truth_as_riddle',
        label: 'Give the truth as a frame. Let them close the distance.',
        intent:
          'The god reads and gives back a frame that points at the meaning without ' +
          'delivering it — true but not literal, the way a teacher gives the next step ' +
          'rather than the destination. The scholars will have to work. The working is ' +
          'the instruction.',
        essenceCost: 1,
        likelyBurden:
          'The scholars will spend four days on what could have been twelve minutes. ' +
          'What they arrive at will be more theirs than anything given directly would have been.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      read_it_openly: READ_AFTERMATH,
      give_truth_as_riddle: RIDDLE_AFTERMATH,
    },
    fallback: { ...READ_AFTERMATH },
  },
};
