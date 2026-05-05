import type { GraphOp } from '../types/graphOp';
import type { ValuePair } from '../types/agent';
import type { ActionStep, AuthoredChoiceCard, UnifiedActionTemplate } from '../types/unifiedAction';
import type {
  EncounterArchetypePole,
  EncounterChoiceContract,
  EncounterChoiceCost,
  EncounterChoiceReach,
  EncounterContract,
  EncounterContractPayload,
} from '../types/encounter-contract';
import {
  ENCOUNTER_DEFAULT_LOCATION_SUBTYPE,
  MORAL_AXIS_POLES_BY_REACH,
  QUINTESSENCE_POLES,
  type EncounterCategory,
} from '../types/encounter-contract';
import { parseEncounterContract } from '../data/encounter-contract-validators';

const ADAPTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
const DEFAULT_STEP_DIFFICULTY = 0.5;
const DEFAULT_STEP_DURATION_MIN = 1;
const DEFAULT_STEP_DURATION_MAX = 1;
const DEFAULT_SCALE = 'personal';
const DEFAULT_CRUD_TYPE = 'update';
const DEFAULT_MOTIVATIONS: readonly ValuePair[] = ['loyalty_ambition', 'courage_prudence'];
const DEFAULT_ACTOR_AFFINITIES = ['individual'] as const;
const QUINTESSENCE_REACH_FALLBACK = 'star' as const;

const COST_TO_ESSENCE_COST: Record<EncounterChoiceCost, number> = {
  small_breath: 1,
  fuller_breath: 2,
  deep_draught: 3,
};

const CATEGORY_TO_CRUD: Record<EncounterCategory, UnifiedActionTemplate['crudType']> = {
  guild: 'update',
  social: 'update',
  tavern: 'read',
  borderland: 'read',
  monster: 'delete',
  anomaly: 'update',
  army: 'update',
  branching: 'update',
};

const CATEGORY_TO_SCALE: Record<EncounterCategory, UnifiedActionTemplate['scale']> = {
  guild: 'local',
  social: 'personal',
  tavern: 'personal',
  borderland: 'local',
  monster: 'local',
  anomaly: 'regional',
  army: 'regional',
  branching: 'personal',
};

const COST_TO_INTERVENTION_TYPE: Record<EncounterChoiceCost, AuthoredChoiceCard['interventionType']> = {
  small_breath: 'supportive',
  fuller_breath: 'supportive',
  deep_draught: 'coercive',
};

const EMPTY_GRAPH_OPS: readonly GraphOp[] = [];
const EMPTY_STEPS: readonly ActionStep[] = [];

function cloneContract(contract: EncounterContract): EncounterContract {
  return parseEncounterContract(JSON.parse(JSON.stringify(contract)));
}

function encodeContractMetadata(contract: EncounterContract): string {
  return `${ADAPTER_CONTRACT_METADATA_KEY}:${JSON.stringify(contract)}`;
}

function decodeContractMetadata(value: string | undefined): EncounterContract | null {
  if (!value || !value.startsWith(`${ADAPTER_CONTRACT_METADATA_KEY}:`)) {
    return null;
  }
  const encoded = value.slice(ADAPTER_CONTRACT_METADATA_KEY.length + 1);
  try {
    return parseEncounterContract(JSON.parse(encoded));
  } catch {
    return null;
  }
}

function toUnifiedReach(reach: EncounterChoiceReach): UnifiedActionTemplate['reach'] {
  if (reach === 'quintessence') {
    return QUINTESSENCE_REACH_FALLBACK;
  }
  return reach;
}

function defaultPoleForReach(reach: EncounterChoiceReach): EncounterArchetypePole {
  if (reach === 'quintessence') {
    return QUINTESSENCE_POLES[0];
  }
  return MORAL_AXIS_POLES_BY_REACH[reach][0];
}

function makeChoiceId(beatIndex: number, choiceIndex: number): string {
  return `choice-${beatIndex + 1}-${choiceIndex + 1}`;
}

function toAuthoredChoice(choice: EncounterChoiceContract, beatIndex: number, choiceIndex: number): AuthoredChoiceCard {
  return {
    id: makeChoiceId(beatIndex, choiceIndex),
    label: choice.god_verb,
    intent: choice.agent_reaction,
    targetLabel: choice.tilts_toward,
    essenceCost: COST_TO_ESSENCE_COST[choice.cost],
    likelyBurden: choice.fail_forward,
    interventionType: COST_TO_INTERVENTION_TYPE[choice.cost],
  };
}

function toActionStep(beat: EncounterContractPayload['beats'][number]): ActionStep {
  const primaryChoice = beat.encounter_choices[0];
  return {
    reach: toUnifiedReach(primaryChoice.reach),
    duration: {
      min: DEFAULT_STEP_DURATION_MIN,
      max: DEFAULT_STEP_DURATION_MAX,
    },
    difficulty: DEFAULT_STEP_DIFFICULTY,
    onSuccess: EMPTY_GRAPH_OPS,
    onFailure: EMPTY_GRAPH_OPS,
    failBehavior: 'continue_weakened',
    narrativeTemplate: beat.prose,
    successAfterimage: primaryChoice.tilts_toward,
    failureAfterimage: primaryChoice.fail_forward,
  };
}

export function adaptEncounterContractToUnifiedActionTemplate(contract: EncounterContract): UnifiedActionTemplate {
  const parsed = parseEncounterContract(contract);
  const payload = parsed.encounter;
  const firstBeat = payload.beats[0];
  const firstChoice = firstBeat.encounter_choices[0];
  const steps = payload.beats.map((beat) => toActionStep(beat));
  const authoredChoices = Object.fromEntries(
    payload.beats.map((beat, beatIndex) => [
      beatIndex,
      beat.encounter_choices.map((choice, choiceIndex) => toAuthoredChoice(choice, beatIndex, choiceIndex)),
    ]),
  );

  const template: UnifiedActionTemplate = {
    id: payload.id,
    rarityTier: payload.rarity_tier,
    intrinsicTier: payload.intrinsic_tier,
    name: firstBeat.title,
    reach: toUnifiedReach(firstChoice.reach),
    crudType: CATEGORY_TO_CRUD[payload.category] ?? DEFAULT_CRUD_TYPE,
    scale: CATEGORY_TO_SCALE[payload.category] ?? DEFAULT_SCALE,
    steps,
    apCost: 1,
    essenceCost: COST_TO_ESSENCE_COST[firstChoice.cost],
    actorAffinities: DEFAULT_ACTOR_AFFINITIES,
    locationSubtypes: [ENCOUNTER_DEFAULT_LOCATION_SUBTYPE],
    motivations: DEFAULT_MOTIVATIONS,
    narrativeTemplates: {
      initiation: firstBeat.prose,
      success: payload.aftermath.receipt,
      failure: firstChoice.fail_forward,
    },
    description: payload.protagonist_view.state_descriptor,
    authoredChoices,
    illustrationUrl: payload.place.painting,
    illustrationAlt: encodeContractMetadata(parsed),
  };

  return template;
}

function fallbackContractFromTemplate(template: UnifiedActionTemplate): EncounterContract {
  const steps = template.steps as readonly ActionStep[];
  const mappedSteps = (steps.length > 0 ? steps : EMPTY_STEPS).map((step, stepIndex) => {
    const label = `choice-${stepIndex + 1}`;
    const fallbackReach: EncounterChoiceReach = step.reach === QUINTESSENCE_REACH_FALLBACK ? 'quintessence' : step.reach;
    const fallbackPole = defaultPoleForReach(fallbackReach);

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: ['threads shifting'],
      prose: step.narrativeTemplate ?? template.narrativeTemplates.initiation,
      prose_tooltips: {},
      encounter_choices: [{
        reach: fallbackReach,
        cost: 'small_breath',
        god_verb: label,
        agent_reaction: step.successAfterimage ?? template.narrativeTemplates.success,
        tilts_toward: step.successAfterimage ?? 'uncertain',
        moral_axis_pole: fallbackPole,
        fail_forward: step.failureAfterimage ?? template.narrativeTemplates.failure,
      }],
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
        capability_axes: [template.reach, template.reach, template.reach],
        items_relevant: [],
        vows_active_per_beat: {},
        callback_candidates: [],
        state_descriptor: template.description ?? 'no descriptor',
      },
      beats: mappedSteps.length > 0 ? mappedSteps : [{
        title: template.name,
        forecast_factors: ['threads shifting'],
        prose: template.narrativeTemplates.initiation,
        prose_tooltips: {},
        encounter_choices: [{
          reach: template.reach === QUINTESSENCE_REACH_FALLBACK ? 'quintessence' : template.reach,
          cost: 'small_breath',
          god_verb: template.name,
          agent_reaction: template.narrativeTemplates.success,
          tilts_toward: 'uncertain',
          moral_axis_pole: defaultPoleForReach(template.reach === QUINTESSENCE_REACH_FALLBACK ? 'quintessence' : template.reach),
          fail_forward: template.narrativeTemplates.failure,
        }],
      }],
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

export function adaptUnifiedActionTemplateToEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const fromMetadata = decodeContractMetadata(template.illustrationAlt);
  if (fromMetadata) {
    return cloneContract(fromMetadata);
  }
  return fallbackContractFromTemplate(template);
}

function buildWorkedExampleContract(
  id: string,
  title: string,
  category: EncounterCategory,
  reachA: EncounterChoiceReach,
  reachB: EncounterChoiceReach,
): EncounterContract {
  const firstPole = defaultPoleForReach(reachA);
  const secondPole = defaultPoleForReach(reachB);

  return parseEncounterContract({
    encounter: {
      id,
      protagonist: 'actor.eira_thornweaver',
      category,
      rarity_tier: 2,
      intrinsic_tier: 'shaping',
      place: {
        location: 'location.bren',
        ambient_state: { time_of_day: 'evening' },
        painting: `/concept-art/encounters/${id.replace('encounter.', '')}.jpg`,
      },
      cast: [{
        actor: 'actor.halren',
        role_in_scene: 'witness',
        attention_priority: 'primary',
        representation: 'cast_tile',
        disposition_per_beat: { 1: 'guarded' },
        tags: ['scene_tag'],
      }],
      scene_state: {
        threads_in_play: [{
          name: 'authority',
          weight: 'taut',
          sphere_color: 'force',
        }],
        factions_here: ['faction.civic_guard'],
        place_conditions: ['condition.narrow_gate'],
        conditions_on_protagonist: [],
      },
      protagonist_view: {
        capability_axes: ['iron', 'heart', 'eye'],
        items_relevant: ['item.captains_token'],
        vows_active_per_beat: { 1: ['vow.smallfolk'] },
        callback_candidates: ['event.gate_duty'],
        state_descriptor: 'she is weighing what kind of god to be',
      },
      beats: [{
        title,
        forecast_factors: ['the threads stand uncertain'],
        prose: `${title} prose`,
        prose_tooltips: {
          running: 'condition.about_to_bolt',
        },
        encounter_choices: [
          {
            reach: reachA,
            cost: 'small_breath',
            god_verb: 'stir her resolve',
            agent_reaction: 'she squares her shoulders',
            tilts_toward: 'protector path',
            moral_axis_pole: firstPole,
            fail_forward: 'the knot tightens',
          },
          {
            reach: reachB,
            cost: 'fuller_breath',
            god_verb: 'speak into the room',
            agent_reaction: 'the room stirs',
            tilts_toward: 'unsteady compromise',
            moral_axis_pole: secondPole,
            fail_forward: 'a new witness steps in',
          },
        ],
      }],
      aftermath: {
        receipt: `${title} aftermath`,
        changes: [{
          kind: 'recent_event',
          payload: { message: `${title} is now remembered` },
        }],
      },
      ascendant_hand_filter: {
        eligible: ['action.divine.omen'],
        rare_pulse: [],
      },
      graph_node: {
        spawns_from: ['location.bren'],
        gates_to: [],
        enables: [],
      },
    },
  });
}

export const ENCOUNTER_CONTRACT_WORKED_EXAMPLES: readonly EncounterContract[] = [
  buildWorkedExampleContract('encounter.eira_at_gate', 'Eira at the Gate', 'guild', 'iron', 'heart'),
  buildWorkedExampleContract('encounter.tavern_last_cup', "The Tavern's Last Cup", 'tavern', 'gold', 'shadow'),
  buildWorkedExampleContract('encounter.whisper_at_court', 'A Whisper at Court', 'social', 'eye', 'star'),
  buildWorkedExampleContract('encounter.ritual_of_threshold', 'The Ritual of the Threshold', 'anomaly', 'heart', 'quintessence'),
];

export interface EncounterContractRoundTripResult {
  readonly encounterId: string;
  readonly passed: boolean;
  readonly message: string;
}

export function runEncounterContractRoundTripExamples(): readonly EncounterContractRoundTripResult[] {
  return ENCOUNTER_CONTRACT_WORKED_EXAMPLES.map((contract) => {
    const template = adaptEncounterContractToUnifiedActionTemplate(contract);
    const roundTripped = adaptUnifiedActionTemplateToEncounterContract(template);
    const same = JSON.stringify(contract) === JSON.stringify(roundTripped);
    return {
      encounterId: contract.encounter.id,
      passed: same,
      message: same ? 'ok' : 'round-trip mismatch',
    };
  });
}
