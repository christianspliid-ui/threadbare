/**
 * Pilgrim's Offering — reputation-gated encounter, Heart reach, required + blocked.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.heart.positive'] at level 1+
 *       AND blocked when target has 'trait.reputation.heart.negative'.
 * Pattern: required + blocked — encounter surfaces only when Beloved reputation is held
 *          and disappears entirely when Manipulator reputation is present.
 *
 * The blocking (heart.negative) is enforced via encounterGates.blocks in the trait definition.
 * THR-32: First tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const pilgrimSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'pilgrim',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['pilgrim', 'devotee', 'traveler', 'civilian'],
  supportRole: 'pilgrim',
  spawnNpcRole: 'civilian',
  spawnName: 'the Pilgrim',
};

const shrineSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'shrine',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'shrine',
  fallbackName: 'The Roadside Shrine',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [pilgrimSpec, shrineSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0ThePilgrim: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The shrine was nothing elaborate: a cairn of white stones beside the road, cloth ' +
    'strips tied to the branches above them — faded saffron, rain-washed blue — and the ' +
    'particular quality of a place that people had been stopping at for long enough that ' +
    'stopping there had become something different from simply stopping. The ground ' +
    'around the cairn was worn smooth by knees and feet, which meant the stopping was ' +
    'regular and had been regular for some time.\n\n' +
    'The pilgrim was kneeling when the agent arrived, head down, both hands extended in ' +
    'the old form — palms up, fingers together, something balanced in the cup of the hands. ' +
    'A bundle of dried herbs tied with thread the color of old honey. Not a valuable thing. ' +
    'Very much a personal one.\n\n' +
    'The pilgrim heard the footsteps and looked up. The look that crossed their face was ' +
    'not fear, not surprise — it was the expression of someone who has prayed for something ' +
    'for a long time and is now uncertain whether what has arrived is the answer or coincidence. ' +
    'They remained kneeling. The bundle was still in their hands. "{title}," they said, ' +
    'which was all they said, and the word held more weight than most words of that length.',
  successAfterimage: 'The pilgrim looked up. Recognition. The offering still in their hands.',
  failureAfterimage: 'The pilgrim looked up, uncertain — as though the recognition they had hoped for was arriving at the wrong angle.',
};

const step1AcceptGraciously: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.30,
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
      changes: { reputationDelta: 0.00 },
    },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god lowered the agent toward the offering — not the gesture of someone receiving ' +
    'tribute, but the gesture of someone who understands what the bundle in the pilgrim\'s ' +
    'hands has cost them. The herbs had been carried a long distance. The thread had been ' +
    'tied by someone who did not have easy access to nice thread. These were not observations. ' +
    'They were weight, and the god knew how to let that weight arrive in the agent\'s bearing ' +
    'without language.\n\n' +
    'The agent accepted the bundle with both hands — the correct form, the one that says: ' +
    'I am receiving what you are giving, which is not the herbs but the intention behind them. ' +
    'The pilgrim\'s breath released in stages. Their hands did not shake exactly, but something ' +
    'that had been held very tight in them let go.\n\n' +
    '"I will carry this," the agent said. It was the right thing to say. The pilgrim heard ' +
    'the fullness of it and looked at the cairn and looked back at the {title} and did ' +
    'not say anything else, because there was nothing else that needed to be said.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The offering accepted. The pilgrim\'s hands were empty and their face was not.',
  failureAfterimage: 'The acceptance was real but something in the moment slipped — the pilgrim felt it too.',
};

const step1BlessInstead: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
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
      changes: { reputationDelta: 0.00 },
    },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did something gentle: it redirected the offering back toward the giver, ' +
    'not as refusal but as amplification. The agent\'s hands rested for a moment on the ' +
    'pilgrim\'s still-extended palms — not taking, but touching — and the bundle of herbs ' +
    'remained where it was while something else moved through the contact.\n\n' +
    'It was the kind of blessing that does not announce itself. No light, no formality, ' +
    'no declaration of what was being given. Just the quality of attention that makes a person ' +
    'feel that what they have done has been seen, not by someone passing through who happens ' +
    'to be important, but by something that has been watching for a long time and found ' +
    'what they were looking at worth watching.\n\n' +
    'The pilgrim went very still. Then they closed their hands around the herbs and held ' +
    'them against their chest instead of offering them outward. A different gesture: ' +
    'keeping rather than giving. As though what they had brought to leave at the shrine ' +
    'was now something to carry with them. The agent moved on. At the shrine behind them, ' +
    'a cloth strip tied to the branches above the cairn had loosened in the still air and ' +
    'wrapped itself once around the topmost stone.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'A blessing returned. The pilgrim kept the herbs — carried what they had meant to leave.',
  failureAfterimage: 'The gesture was real but diffuse — the pilgrim felt something pass through them without fully landing.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    accept_graciously: step1AcceptGraciously,
    bless_them_instead: step1BlessInstead,
  },
  fallback: { ...step1AcceptGraciously },
};

// ─── Aftermath ───────────────────────────────────────────────────

const ACCEPT_AFTERMATH = {
  overview:
    'The herbs were small enough to carry in a belt pouch. The agent carried them. Three ' +
    'days later, a child in a settlement the agent passed through recognized the bundle by ' +
    'its smell — her grandmother had made the same preparation, had tied it the same way — ' +
    'and asked, with the complete lack of social filtration that children have, where the ' +
    'agent had gotten it. The agent told the truth. The child went to find her grandmother. ' +
    'The grandmother, when the story was relayed to her, sat down heavily in her chair and ' +
    'was quiet for a time and then said: that pilgrim is my brother\'s youngest, who has ' +
    'been walking to every shrine on the road south for six years, looking for the answer ' +
    'to a question they have never told any of us. She did not say what the question was. ' +
    'She did not need to. Some questions announce themselves in the length of the search.',
  changes: [
    {
      id: 'accept_offering_carried',
      kind: 'reputation' as const,
      title: 'The Pilgrim\'s Offering',
      detail: 'Carried. Not set down. The pilgrim will hear of it.',
      polarity: 'gain' as const,
    },
    {
      id: 'accept_recognition_spreading',
      kind: 'future_hook' as const,
      title: 'The Grandmother\'s Recognition',
      detail: 'A family has learned that {title} carries something that belongs to one of theirs.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The offering is carried. Something it touched is moving through the world. Choose how to hold it.',
  reactions: [
    {
      id: 'accept_react_keep',
      label: 'Keep carrying the offering.',
      intent: 'Let the bundle remain in the agent\'s keeping — what the pilgrim gave is not finished yet.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} carries the pilgrim\'s offering. The family has heard. The pilgrim is still walking south.',
          significance: 0.65,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.3,
          label: 'Carries a pilgrim\'s offering — the family knows, and the pilgrim will eventually learn',
          revealFamilies: ['heart.devotion', 'pilgrim', 'shrine'],
        },
      ],
    },
    {
      id: 'accept_react_leave_shrine',
      label: 'Leave it at the next shrine.',
      intent: 'The offering was meant for a shrine. Let it complete its journey.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'star.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The pilgrim\'s herbs reach a shrine at last. The offering completes its arc — carried by the {title} to its destination.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const BLESS_AFTERMATH = {
  overview:
    'The pilgrim carried the herbs all the way to the next settlement and did not leave ' +
    'them at any shrine. They went instead to the elder\'s house and asked to speak privately, ' +
    'which was unusual for a pilgrim, and the elder, who had been doing this long enough to ' +
    'recognize when something has shifted in a person\'s posture, agreed. What was said in ' +
    'that room was not recorded. But the pilgrim\'s face afterward had the particular quality ' +
    'of someone who has resolved a question they had been carrying for a long time — not by ' +
    'finding the answer, but by finally saying the question aloud to someone who listened.',
  changes: [
    {
      id: 'bless_pilgrim_changed',
      kind: 'reputation' as const,
      title: 'The Pilgrim',
      detail: 'Something shifted in the pilgrim after the blessing. The search is different now.',
      polarity: 'gain' as const,
    },
    {
      id: 'bless_elder_consultation',
      kind: 'future_hook' as const,
      title: 'The Elder\'s Door',
      detail: 'A private conversation happened. Something that was carried for years is being spoken aloud.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The pilgrim has changed direction. The blessing moved something that was stuck. Choose what remains.',
  reactions: [
    {
      id: 'bless_react_follow',
      label: 'Keep a thread with the pilgrim.',
      intent: 'The blessing was not a transaction. Let the god stay loosely aware of where the pilgrim walks now.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s blessing travels with the pilgrim. The god watches where the changed walk leads.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'heart.devotion',
          delayTicks: 25,
          priority: 0.9,
          seedLabel: 'The pilgrim arrives somewhere with the blessing still in their hands',
        },
      ],
    },
    {
      id: 'bless_react_release',
      label: 'Release the thread.',
      intent: 'What was given was freely given. Let the pilgrim walk their changed road without the god behind them.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The blessing is given and released. What the pilgrim does with it is entirely their own.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const PILGRIMS_OFFERING_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.heart.pilgrims_offering',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'Pilgrim\'s Offering',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',

  steps: [step0ThePilgrim, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'hamlet', 'road', 'wilderness'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.heart.positive'],

  narrativeTemplates: {
    initiation:
      'A pilgrim at a roadside shrine sees {title} approaching and rises with something ' +
      'carried for a long time now in their hands, meant for this. The offering is small. ' +
      'The intention behind it is not.',
    success:
      'The offering changed hands, or the blessing moved from the shrine back to the giver. ' +
      'Either way, neither the pilgrim nor the agent is exactly the same person who arrived at this cairn.',
    failure:
      'The moment was real but did not land cleanly. The pilgrim left without the full ' +
      'weight of their intention finding its target.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/pilgrims-offering.jpg',
  illustrationAlt: 'A roadside shrine: white stone cairn, faded cloth in branches. A kneeling pilgrim offers a bundle in cupped hands; the agent\'s shadow falls across the cairn.',

  authoredChoices: {
    0: [
      {
        id: 'accept_graciously',
        label: 'Receive what is given.',
        intent:
          'The god settles the agent into the weight of what the pilgrim has carried here — ' +
          'not just the herbs but the years. The acceptance is real and its fullness is legible ' +
          'to the pilgrim because the god makes it legible: not performance, not kindness as ' +
          'a technique, but the actual act of receiving something that was meant to be received.',
        essenceCost: 1,
        likelyBurden:
          'What is received is now carried. The pilgrim will hear, eventually, where the ' +
          'offering ends up.',
        interventionType: 'supportive',
      },
      {
        id: 'bless_them_instead',
        label: 'Give the blessing back to the one who brought it.',
        intent:
          'The god turns the offering around: instead of taking what the pilgrim has carried, ' +
          'the agent becomes the channel through which something returns to them. The bundle ' +
          'stays in the pilgrim\'s hands but it is no longer the same weight — it has been ' +
          'touched by the answer to the question they carried it here to ask.',
        essenceCost: 2,
        likelyBurden:
          'What is redirected becomes the pilgrim\'s to carry forward. The god has answered ' +
          'a question that was not asked aloud, and the pilgrim will have to live with that answer.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      accept_graciously: ACCEPT_AFTERMATH,
      bless_them_instead: BLESS_AFTERMATH,
    },
    fallback: { ...ACCEPT_AFTERMATH },
  },
};
