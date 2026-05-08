/**
 * The Healer at the Ward-Gate — a short, linear encounter.
 *
 * A wandering healer named Maret is blocked at the Thornwall Ward gate
 * by gate-warden Jorik. A sick child inside needs moonwort from the
 * shrine garden. The player-god nudges the social fabric to open the
 * gate — or fails, and the community's caution holds.
 *
 * Design doc: Docs/plans/encounters/wandering-healer-shrine-access-revised.md
 */

import type { UnifiedActionTemplate, ActionStep } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
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

const maretSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'maret',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['healer', 'herbalist', 'physician'],
  supportRole: 'healer',
  spawnNpcRole: 'healer',
  spawnName: 'Maret',
};

const jorikSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'jorik',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['guard', 'warden', 'gatekeeper'],
  supportRole: 'warden',
  spawnNpcRole: 'guard',
  spawnName: 'Jorik',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  maretSpec,
  jorikSpec,
];

// ─── Step Definition ────────────────────────────────────────────

/**
 * Step 0: The Nudge.
 * Single intervention pass — the player-god leans on the social fabric
 * around the ward-gate standoff. Moderate difficulty (0.35) because the
 * community's historical caution is a real force.
 */
const step0TheNudge: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  difficultyContext: 'intel_sensitive',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The healer had been sitting on the bench outside the Thornwall gate for three ' +
    'hours when the god noticed her. Her mule stood tethered to the bench\'s iron ring, ' +
    'its panniers half-open, bundles of dried comfrey and willow-bark visible in neat rolls. ' +
    'Above her, in a second-story window, a woman held a damp cloth to a child\'s forehead. ' +
    'The gate-warden stood at his post in the alcove beside the heavy oak doors, arms folded, ' +
    'jaw set. He was a man who had buried his mother nineteen years ago because someone from ' +
    'outside the ward had brought a sickness through these same doors. The god leaned into ' +
    'the moment the way wind leans into a flame — not enough to extinguish, just enough to bend.',
};

// ─── Aftermath Config ────────────────────────────────────────────

/**
 * Linear encounter — no branching. We use aftermathConfig with
 * branchOnStep: 0 and an empty variants map so the fallback is always
 * selected, giving us curated aftermath content without needing branches.
 */
const LINEAR_AFTERMATH = {
  overview:
    'By evening, the child\'s fever had broken. Maret had ground the moonwort into ' +
    'a paste with something from her own kit and applied it to the joints where the ' +
    'bone-fever settled. The child slept. Jorik waited at the gate. When she passed ' +
    'through on her way out, he pulled it shut behind her with more force than was ' +
    'necessary, and the bolt rang like a bell in the quiet street. In the ward, Jorik ' +
    'sat in his alcove and stared at the closed gate. His mother had been kind to ' +
    'strangers. His mother had died for it.',
  changes: [
    {
      id: 'healer_departs',
      kind: 'reputation' as const,
      title: 'Maret Departs',
      detail: 'The wandering healer leaves the settlement. Her disposition toward the agent is set by the outcome.',
      polarity: 'mixed' as const,
    },
    {
      id: 'ward_policy_tested',
      kind: 'reputation' as const,
      title: 'Ward Policy Tested',
      detail: 'Thornwall Ward\'s outsider ban was either bent or held. The community remembers.',
      polarity: 'mixed' as const,
    },
    {
      id: 'child_recovers',
      kind: 'future_hook' as const,
      title: 'The Sick Child',
      detail: 'The child recovers from bone-fever — quickly if the healer got through, slowly if not.',
      polarity: 'gain' as const,
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

export const WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'healer.quest.wandering_healer_shrine_access',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Healer at the Ward-Gate',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheNudge],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],

  narrativeTemplates: {
    initiation:
      'A wandering healer sits outside a locked ward-gate, waiting for something to change. ' +
      'Inside, a child is sick with bone-fever and the shrine garden holds the only moonwort ' +
      'that can treat it. The gate-warden enforces a nineteen-year-old outsider ban written ' +
      'in grief. The god notices.',
    success:
      'The social fabric bends just enough. A neighbor speaks, the warden\'s jaw works, ' +
      'the gate opens six inches. The healer gathers moonwort and treats the child. ' +
      'The ward remembers what happened.',
    failure:
      'The community\'s caution holds against the divine nudge. The healer is turned away. ' +
      'She will find moonwort elsewhere, but the child suffers longer. The ward remembers ' +
      'that a god tried to push their gate open and failed.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: { ...LINEAR_AFTERMATH },
  },
});

export const WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE);
