/**
 * The Unmarked Crossing — reputation-gated encounter, Gold reach, required-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.gold.negative'] — the smuggler needs
 *       a seal already discredited. A clean name would be caught on inspection.
 * Pattern: required-negative — encounter surfaces only when gold.negative is held.
 *
 * THR-147: Final tranche of reputation-gated content.
 *
 * ─── The mortal decides (THR-2160, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 0 was two cards whose ids were the
 * aftermath keys, so the click picked the ending. Now the fork decides on
 * `asceticism_extravagance`: a Mender (+1) carries the blank manifests to the
 * merchant they were meant to defraud, a Magnate (−1) presses the seal and takes
 * the cut. The god argues with a composed hand — two pole-leaning specials plus
 * a Repertoire fill — and the mortal answers.
 *
 * - Fork axis: `asceticism_extravagance`. `positive` = Take the Manifest to its
 *   Rightful Owner, `negative` = Sign the Papers. Variants, aftermath and
 *   `stakes.arms` are keyed to the pole (`branchDecision.ts` →
 *   `recordDecidedChoice`). The fallback and the base stakes moved to the
 *   warning (the positive pole); signing is now the `negative` arm.
 * - `aftermathConfig.branchOnStep` stays 0, the deciding step (THR-979).
 * - The step-1 prose is re-voiced so the mortal does it, not the god.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';
import { parseEncounterContract } from '../encounter-contract-validators';
import type {
  EncounterChoiceReach,
  EncounterContract,
} from '../../types/encounter-contract';
import { MORAL_AXIS_POLES_BY_REACH, QUINTESSENCE_POLES } from '../../types/encounter-contract';
import { MEANS_STEP } from '../mortal-means-constants';

// ─── Support Bundle ──────────────────────────────────────────────

const smugglerSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'smuggler',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['smuggler', 'criminal', 'merchant', 'sailor'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Smuggler',
};

const wharfSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'wharf',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'wharf',
  fallbackName: 'The River Wharf',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [smugglerSpec, wharfSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheManifests: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The wharf had the quality of places that exist to move things across ' +
    'boundaries — the specific energy of transit, of cargo that has not yet been ' +
    'declared and may not be declared at all. A barge at the dock. A distant ' +
    'customs house, lit, watching the wrong direction.\n\n' +
    'The smuggler found the agent at the barrel-top near the barge\'s aft line and ' +
    'laid blank manifests and a wax stick on the wood without preamble. The cargo ' +
    'was not named. The wax stick was good quality — the kind you use when the ' +
    'impression matters more than the substance behind it. The smuggler had done ' +
    'their research about what kind of seal would pass on a false manifest: not an ' +
    'official seal, not a clean merchant\'s mark, but the mark of someone whose ' +
    'name on a document was already expected to mean something irregular.\n\n' +
    '"{title}," the smuggler said, which was not a greeting but a calculation made ' +
    'aloud. The ink was dry. The date was tonight. The barge would not be at this ' +
    'wharf by morning.',
  successAfterimage: 'Blank manifests. A wax stick. The barge still at the dock.',
  failureAfterimage: 'The smuggler laid out the offer but something in the approach didn\'t land as they\'d calculated.',
  successAtCostAfterimage: 'The offer was plain, and the smuggler had marked the agent\'s face.',
  criticalSuccessAfterimage: 'The cargo, the cut and the merchant it would rob all stood clear at once.',
  criticalFailureAfterimage: 'The wharf blurred into lantern-glare and river noise, and the agent chose half-blind.',
  purposeLine: 'Weigh the manifests',
  // THR-2160 — the fork's argument. Two specials, one per pole of
  // `asceticism_extravagance`; the Repertoire fills the rest of the hand.
  nudges: [
    {
      id: 'crossing.name_the_merchant',
      name: 'Name The Merchant',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'asceticism_extravagance', toward: 'positive' },
      effectLine: 'Show them whose ledger the blank papers will empty. A named victim argues for the factor.',
      bandProse: {
        success: '{actor} saw the merchant behind the papers, and set the wax down.',
        failure: '{actor} heard the merchant\'s name, and it stayed only a name.',
      },
    },
    {
      id: 'crossing.weigh_the_cut',
      name: 'Weigh The Cut',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'asceticism_extravagance', toward: 'negative' },
      effectLine: 'Let them feel the coin the seal is worth tonight. A cut this rich argues for pressing it.',
      bandProse: {
        success: '{actor} weighed the cut, and reached for the wax.',
        failure: '{actor} weighed the cut, and found it lighter than promised.',
      },
    },
  ],
  deal: { count: 3, tags: ['social', 'shadow'] },
};

const step1SignThePapers: ActionStep = {
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
    'The agent took up the wax, and felt in their hands the weight ' +
    'of commerce conducted in the space that legitimate commerce leaves behind, ' +
    'the recognition that the {title}\'s seal has value precisely because it is ' +
    'not worth authenticating. The smuggler had understood this correctly.\n\n' +
    'The seal pressed. The manifests folded. A percentage of the cargo\'s value ' +
    'was handed across the barrel-top in coin that had not been counted in front ' +
    'of any record. The barge\'s lines were cast off before the customs house ' +
    'changed its angle of attention. By the time the lanterns moved on the water, ' +
    'the manifest was already downriver and the agent was no longer at the wharf.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The seal pressed. The barge downriver before the customs house looked.',
  failureAfterimage: 'The papers signed, but the execution felt unclean — whether the crossing would hold was uncertain.',
};

const step1TakeToOwner: ActionStep = {
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
    'The agent turned their attention from the barrel-top to the cargo, ' +
    'and from the cargo to the name of the merchant the smuggler had intended to ' +
    'defraud with blank manifests and a borrowed seal. The {title} did not sign the ' +
    'papers. They carried the blank manifests to the merchant\'s factor before the ' +
    'smuggler\'s barge had time to move.\n\n' +
    'The smuggler, watching the barge from the dock, would realize what had happened ' +
    'when they saw the customs house lanterns change angle. They would not have a ' +
    'name for the person who had turned them in. They would have a description ' +
    'that matched the agent at the barrel-top, and a very specific grievance ' +
    'they could not file officially.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The blank manifests went to the merchant\'s factor. The smuggler\'s barge sat at dock too long.',
  failureAfterimage: 'The warning went, but arrived at an awkward angle — the merchant\'s factor wasn\'t certain what to make of it.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2160 — the mortal decides; the fallback is the positive pole.
  decidedBy: { axis: 'asceticism_extravagance' },
  variants: {
    positive: step1TakeToOwner,
    negative: step1SignThePapers,
  },
  fallback: { ...step1TakeToOwner },
};

// ─── Aftermath ───────────────────────────────────────────────────

const SIGN_AFTERMATH = {
  // THR-1952 S2 — the Means half of this row of the money-encounter outcome table (THR-1872).
  outcomeEffects: {
    critical_success: [{ kind: 'economy_shift', quantity: 'means', amount: MEANS_STEP }],
    success: [{ kind: 'economy_shift', quantity: 'means', amount: MEANS_STEP }],
  },
  overview:
    'The cargo arrived wherever the barge was going. The {title}\'s seal on the ' +
    'manifests meant that any inspection that found them would find a name already ' +
    'associated with irregular commerce — which was either a problem or, for ' +
    'a customs officer with a flexible interpretation of their responsibilities, ' +
    'a pre-existing condition that required no further documentation. ' +
    'The percentage of the cargo was spent. The smuggler had not named the cargo. ' +
    'Somewhere, someone who owned goods they had not declared was now deciding ' +
    'whether what had crossed the river was worth the cost of the questions ' +
    'a careful customs officer would eventually ask.',
  changes: [
    {
      id: 'sign_cargo_crossed',
      kind: 'reputation' as const,
      title: 'The Crossing That Was Never Logged',
      detail: 'A cargo passed under the {title}\'s seal. The manifests are downriver. The customs house will find the discrepancy eventually.',
      polarity: 'mixed' as const,
    },
    {
      id: 'sign_customs_attention',
      kind: 'future_hook' as const,
      title: 'The Customs Officer\'s Questions',
      detail: 'A careful officer has noticed the manifest signature and begun to ask quiet questions.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The barge is downriver. The seal is on those manifests. The customs house will find the discrepancy. Choose what you do with the thread.',
  reactions: [
    {
      id: 'sign_react_let_it_move',
      label: 'Let the cargo keep moving.',
      intent: 'The commission is done. The percentage is held. Let the manifest travel wherever the barge is going.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'concealed_action' as const,
          severity: 0.45,
          label: 'the crossing that was never logged — {title}\'s seal on an unnamed cargo\'s manifests',
          revealFamilies: ['gold.customs', 'merchant', 'river'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s seal crossed a cargo under no name. The barge is downriver. The customs house lamp is moving.',
          significance: 0.55,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.customs_inquiry',
          delayTicks: 30,
          priority: 0.75,
          seedLabel: 'A customs officer begins asking quiet questions about the manifest',
        },
      ],
    },
    {
      id: 'sign_react_trace_the_cargo',
      label: 'Trace where the cargo is going.',
      intent: 'The seal is already on those papers. Learn what cargo was worth crossing under a borrowed reputation.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} signed the manifests and then traced the cargo. What was on that barge is now known.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const TURN_AFTERMATH = {
  overview:
    'The merchant\'s factor had been brisk about it — the blank manifests were evidence ' +
    'of an attempted fraud, which was a matter for the customs authority, not a private ' +
    'matter, which meant it would be handled officially, which meant the smuggler ' +
    'would find out through official channels that their operation at the wharf had ' +
    'been compromised. They did not know who had turned them in. They had a description ' +
    'that matched a specific shape of person at a specific barrel-top, and a ' +
    'grievance that they would carry for some time before they found an opportunity ' +
    'to act on it. The {title} had not, by any official record, been at the wharf at all.',
  changes: [
    {
      id: 'turn_merchant_protected',
      kind: 'reputation' as const,
      title: 'The Protected Merchant',
      detail: 'The fraud was stopped before it crossed. The merchant\'s factor has a record of what was attempted.',
      polarity: 'gain' as const,
    },
    {
      id: 'turn_smuggler_reprisal',
      kind: 'future_hook' as const,
      title: 'The Smuggler\'s Grievance',
      detail: 'The smuggler doesn\'t have a name, but they have a description and a very specific kind of anger.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The fraud is stopped. The merchant is protected. The smuggler is looking for the person at the barrel-top. Choose what you hold from this.',
  reactions: [
    {
      id: 'turn_react_let_stand',
      label: 'Let the record stand as is.',
      intent: 'The manifests are with the factor. The protection is real. Leave it there without adding to it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'gold.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.smuggler_reprisal',
          delayTicks: 20,
          priority: 0.7,
          seedLabel: 'The smuggler\'s people look for the one who turned them in',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} turned the smuggler\'s blank manifests over to the merchant\'s factor. The smuggler has a description and no name.',
          significance: 0.55,
        },
      ],
    },
    {
      id: 'turn_react_shelter_merchant',
      label: 'Stay close to the merchant\'s factor for a while.',
      intent: 'The smuggler has a grievance and a description. The merchant\'s factor shouldn\'t be left exposed.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'gold.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} stayed close to the merchant\'s factor after the wharf. The smuggler\'s grievance has a harder target now.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;



const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
// THR-1725 — a beat with no authored factor lines carries none, never filler.
const DEFAULT_FORECAST_FACTORS = [] as const;
const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
const DEFAULT_TILTS_TOWARD = 'uncertain';

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
    agent_reaction: (step && 'successAfterimage' in step ? step.successAfterimage : undefined) || template.narrativeTemplates.success,
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward: (step && 'failureAfterimage' in step ? step.failureAfterimage : undefined) || template.narrativeTemplates.failure,
  };
}

function buildLiteEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const stepIndexes = template.steps.map((_, index) => index);
  const capabilityAxisReach = template.reach === 'quintessence' ? 'star' : template.reach;

  const beats = stepIndexes.map((stepIndex) => {
    const stepReach = toStepFallbackReach(template, stepIndex);
    const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: DEFAULT_FORECAST_FACTORS,
      prose: step && 'narrativeTemplate' in step ? (step.narrativeTemplate ?? template.narrativeTemplates.initiation) : template.narrativeTemplates.initiation,
      prose_tooltips: {},
      encounter_choices: [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
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

export const THE_UNMARKED_CROSSING_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.gold.the_unmarked_crossing',
  stakes: {
    goal: 'carry the smuggler\'s blank manifests to the merchant',
    risk: 'warn a factor who does not know what to make of it',
    won: 'carried the blank manifests to the merchant\'s factor',
    lost: 'warned the factor, who did not know what to make of it',
    arms: {
      negative: {
        won: 'sealed the manifests and saw the barge downriver',
        lost: 'sealed the papers on a crossing that may not hold',
      },
    },
  },
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Unmarked Crossing',
  reach: 'gold',
  crudType: 'write',
  scale: 'local',

  steps: [step0TheManifests, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  // THR-1515: `settlement` dropped — no location carries that subtype, so it gated nothing.
  locationSubtypes: ['town', 'city', 'road'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.gold.negative'],

  narrativeTemplates: {
    initiation:
      'A smuggler at a river wharf lays blank manifests in front of {title}. The cargo ' +
      'is unnamed. The customs house is lit in the wrong direction. A clean seal ' +
      'would be caught on inspection — but a seal already known for irregular commerce ' +
      'is expected to appear on exactly this kind of manifest.',
    success:
      'The manifests moved one way or the other: either downriver with the barge or ' +
      'across town to the merchant\'s factor. The wharf will look different by morning.',
    failure:
      'The arrangement stalled at the barrel-top — the manifests neither signed nor ' +
      'delivered, the smuggler uncertain whether to cast off lines.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-unmarked-crossing.png',
  illustrationAlt: 'Wide shot: river wharf at dusk, barge at dock, two figures at a barrel with blank papers, distant customs house lit, Threadbare palette.',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: TURN_AFTERMATH,
      negative: SIGN_AFTERMATH,
    },
    fallback: { ...TURN_AFTERMATH },
  },
});

export const THE_UNMARKED_CROSSING_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_UNMARKED_CROSSING_TEMPLATE);
