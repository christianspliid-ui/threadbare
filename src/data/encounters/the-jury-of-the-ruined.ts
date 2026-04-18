/**
 * The Jury of the Ruined — reputation-gated encounter, Stone reach, required-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.stone.negative'] — the circle of the
 *       dispossessed will only hear testimony from a judge whose own name is broken.
 * Pattern: required-negative — encounter surfaces only when stone.negative is held.
 *
 * THR-147: Final tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const circleSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'circle_of_dispossessed',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['civilian', 'farmer', 'laborer', 'refugee'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Circle',
};

const ruinedGrangeSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'ruined_grange',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'ruin',
  fallbackName: 'The Ruined Grange',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [circleSpec, ruinedGrangeSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheCircle: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The grange had burned two winters ago. What remained was the stone walls and ' +
    'the sky. The roof was gone and the overcast light came in evenly, the way light ' +
    'comes in when there is nothing left to obstruct it — which had a particular ' +
    'flatness, a particular absence of shadow that made everything visible equally.\n\n' +
    'The circle sat on salvaged stones arranged around the approximate center of ' +
    'what had been the grange\'s floor. Seven people, maybe eight. The accused ' +
    'stood in the middle of the circle: two neighbors, both of them looking at ' +
    'the ground with the particular attention of people who have considered running ' +
    'and decided against it. The charge was water rights sold that were not theirs ' +
    'to sell — which was a precise kind of theft, the kind that takes from ' +
    'everyone downstream.\n\n' +
    'The circle looked at {title} when the agent entered. Not at the accused. ' +
    'At the agent. A circle like this one only calls for a judge whose own name ' +
    'is broken — they understand, because they live it, that the high seats are ' +
    'not always right, and they want a verdict from someone who has been on the ' +
    'wrong side of one. No record is being kept. The overcast light is impartial.',
  successAfterimage: 'The circle waiting. The accused in the center. No record being kept.',
  failureAfterimage: 'The circle acknowledged the arrival but something in the atmosphere hadn\'t settled into the shape of a proceeding yet.',
};

const step1DeliverVerdict: ActionStep = {
  reach: 'stone',
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
    'The god settled a current of rough legitimacy through the agent — not the ' +
    'legitimacy of the high seats, but the legitimacy of someone who has been ' +
    'disavowed by those seats and therefore has nothing left to protect by ' +
    'ruling in their favor. The {title} walked to the center of the circle ' +
    'and ruled against the accused.\n\n' +
    'The circle\'s justice was what it was: collective, rough, without appeal. ' +
    'The accused needed someone to validate what the circle had already decided, ' +
    'and they needed the validation to come from a name that had been broken by ' +
    'the same kind of official weight they were trying to escape. The ruling was ' +
    'given in the roofless grange, with the overcast sky as its only witness, ' +
    'and the circle received it with the specific gravity of people who had ' +
    'been waiting a long time for a verdict to mean something.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The ruling given. The circle received it. The accused were quiet.',
  failureAfterimage: 'The ruling was delivered but something in its weight didn\'t land as the circle had hoped.',
};

const step1RuleAgainstCircle: ActionStep = {
  reach: 'stone',
  duration: { min: 2, max: 3 },
  difficulty: 0.45,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god pressed for the harder thing: not the verdict the circle wanted, but ' +
    'the verdict that the evidence actually supported. The {title} examined what ' +
    'had been brought before the circle — the claims about the water rights, ' +
    'the records of what had been sold, the testimony of the accused themselves — ' +
    'and found the circle\'s case weaker than its grief. The ruling went the ' +
    'other direction.\n\n' +
    'The circle did not forgive it. They had not called for a judge whose name was ' +
    'broken in order to receive the same verdict they\'d have gotten from the high ' +
    'seats. They had called for one because they expected the brokenness to vote ' +
    'with them. The {title} had disappointed that expectation in exactly the way the ' +
    'law had disappointed the circle — which meant the circle now had a specific ' +
    'object for feelings that had previously been diffuse.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The circle expected solidarity. The ruling gave them the evidence instead.',
  failureAfterimage: 'The ruling was attempted but it felt incomplete — the circle wasn\'t certain they\'d been heard.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    deliver_the_verdict_the_circle_expects: step1DeliverVerdict,
    rule_against_the_circle: step1RuleAgainstCircle,
  },
  fallback: { ...step1DeliverVerdict },
};

// ─── Aftermath ───────────────────────────────────────────────────

const VERDICT_AFTERMATH = {
  overview:
    'The accused had left the grange before the circle dispersed. One of them ' +
    'had gone to find relatives in the next valley; the other had stayed in the ' +
    'settlement and begun to do the slow work of people who have been ruled against ' +
    'and intend to find allies who will remember it. The circle\'s justice was ' +
    'rough and collective and had no official weight, but it had the weight of ' +
    'the circle, which was the weight of everyone the accused had to walk past ' +
    'every morning. The {title} had given that weight a verdict, and the verdict ' +
    'would carry for as long as the circle\'s memory held.',
  changes: [
    {
      id: 'verdict_ruling_made',
      kind: 'reputation' as const,
      title: 'The Ruined Circle\'s Verdict',
      detail: 'The ruling stands in the circle\'s memory. The accused found allies. The {title}\'s name is on a verdict that no record will ever show.',
      polarity: 'mixed' as const,
    },
    {
      id: 'verdict_accused_moves',
      kind: 'future_hook' as const,
      title: 'The Accused\'s Allies',
      detail: 'One of the accused is looking for people who remember what the circle did. They have a name now.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The verdict is given. The circle has what they asked for. The accused have a grievance and a name. Choose what you carry from the grange.',
  reactions: [
    {
      id: 'verdict_react_hold',
      label: 'Hold the verdict as it is.',
      intent: 'The ruling was given in a roofless grange with no record. It was the right verdict for that court. Let it stand without addition.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'reputation_note' as const,
          severity: 0.4,
          label: 'signed onto the ruined circle\'s work — a verdict with the circle\'s weight and no official record',
          revealFamilies: ['stone.dispossessed', 'grange', 'water_rights'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} delivered the ruling the ruined circle asked for, in the open shell of a burned grange. The accused are finding allies. No record was kept.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.accused_vengeance',
          delayTicks: 30,
          priority: 0.75,
          seedLabel: 'One of the accused finds allies who remember the circle\'s sentence',
        },
      ],
    },
    {
      id: 'verdict_react_stay_visible',
      label: 'Stay visible to the circle after the ruling.',
      intent: 'The verdict is given. Let the {title} remain present in the circle\'s space for a while — the ruling is still settling.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} gave the ruined circle their verdict and stayed after. The circle is deciding what kind of judge they just had.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

const CIRCLE_CENSURE_AFTERMATH = {
  overview:
    'The circle had not expected to be ruled against. This was the particular failure ' +
    'mode of a court convened by grief: the people in it had been certain enough of ' +
    'their case that calling a judge felt like a formality, not a risk. They had ' +
    'wanted validation, and the {title} had given them the evidence instead. The ' +
    'circle\'s censure would find its way to the agent through whatever channels ' +
    'a circle of the dispossessed used — which was mainly word of mouth and the ' +
    'particular weight of every conversation in the settlement that began with a ' +
    'reference to what had happened at the ruined grange.',
  changes: [
    {
      id: 'ruled_against_law_held',
      kind: 'reputation' as const,
      title: 'The Law Held at the Grange',
      detail: 'The circle expected solidarity. The {title} gave them the evidence. The circle has passed their own censure.',
      polarity: 'mixed' as const,
    },
    {
      id: 'ruled_against_censure',
      kind: 'future_hook' as const,
      title: 'The Circle\'s Censure',
      detail: 'A circle of the dispossessed is deciding what to do about a {title} who ruled against them in their own court.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The evidence ruled. The circle censured you for it. The accused are cautiously relieved. Choose what you do with the circle\'s judgment.',
  reactions: [
    {
      id: 'ruled_react_hold',
      label: 'Let the censure stand.',
      intent: 'The ruling was right and the circle\'s displeasure is the cost of it being right. Carry the censure without response.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'stone.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'stone.circle_censure',
          delayTicks: 25,
          priority: 0.75,
          seedLabel: 'The ruined circle passes their own judgement on the {title}',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} ruled against the ruined circle on the evidence. The circle has passed their own censure. The accused are deciding whether to be grateful.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'ruled_react_explain',
      label: 'Return to the circle and explain the ruling.',
      intent: 'They asked for a judge and got one. They deserve to understand why the ruling went the way it did — not to reverse it, but to let them see how the evidence looked from outside their grief.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'stone.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} returned to the ruined circle after ruling against them and gave an explanation. The circle listened. Whether they accepted it is still uncertain.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_JURY_OF_THE_RUINED_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.stone.the_jury_of_the_ruined',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Jury of the Ruined',
  reach: 'stone',
  crudType: 'write',
  scale: 'local',

  steps: [step0TheCircle, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['ruin', 'settlement', 'hamlet', 'wilderness'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.stone.negative'],

  narrativeTemplates: {
    initiation:
      'In the roofless shell of a grange burned two winters ago, a circle of the ' +
      'dispossessed waits. They will only hear from a judge whose name is already ' +
      'broken — {title} is invited to the circle. Two neighbors stand accused of ' +
      'selling water rights that were not theirs to sell. No record is being kept.',
    success:
      'A verdict was rendered in the ruined grange, for better or against. The circle ' +
      'received what the judge gave. The overcast sky was the only witness.',
    failure:
      'The proceeding stalled — the verdict incomplete, or the circle uncertain ' +
      'whether what they had been given was what they had called for.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-jury-of-the-ruined.png',
  illustrationAlt: 'Wide shot: roofless burned-out grange, circle of seated figures on salvaged stones, two figures standing in the center, overcast sky above open walls.',

  authoredChoices: {
    0: [
      {
        id: 'deliver_the_verdict_the_circle_expects',
        label: 'Deliver the verdict the circle expects.',
        intent:
          'The god settles a current of rough legitimacy through the agent. The circle ' +
          'called for {title} because they needed the verdict to come from a name that ' +
          'had been broken by the same weight they are trying to escape. The ruling ' +
          'goes against the accused. The circle receives what they called the court for.',
        essenceCost: 1,
        likelyBurden:
          'The accused have a grievance and a name now. The verdict has no official ' +
          'weight, but it has the weight of the circle, and the accused will find ' +
          'allies who remember what happened at the grange.',
        interventionType: 'coercive',
      },
      {
        id: 'rule_against_the_circle',
        label: 'Rule against the circle — the evidence doesn\'t support the charge.',
        intent:
          'The god presses for the hard verdict. The circle called for a judge; ' +
          '{title} will be one. The evidence examined, the ruling given as the ' +
          'evidence demands. The circle expected solidarity. They get impartiality ' +
          'instead — from a name they thought would vote with them.',
        essenceCost: 0,
        likelyBurden:
          'The circle is going to pass their own censure. They had been waiting ' +
          'a long time for a verdict to mean something, and the ruling they got ' +
          'is not the one they wanted.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      deliver_the_verdict_the_circle_expects: VERDICT_AFTERMATH,
      rule_against_the_circle: CIRCLE_CENSURE_AFTERMATH,
    },
    fallback: { ...VERDICT_AFTERMATH },
  },
};
