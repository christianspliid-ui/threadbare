import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { parseEncounterContract } from './encounter-contract-validators';
import {
  ENCOUNTER_CHOICE_REACH_VALUES,
  ENCOUNTER_CATEGORY_VALUES,
  MORAL_AXIS_POLES_BY_REACH,
  QUINTESSENCE_POLES,
  type EncounterArchetypePole,
  type EncounterCategory,
  type EncounterChoiceCost,
  type EncounterChoiceReach,
  type EncounterContract,
} from '../types/encounter-contract';

export const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
export const DEFAULT_FORECAST_FACTORS = ['threads shifting'] as const;
export const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
export const DEFAULT_TILTS_TOWARD = 'uncertain';
export const DEFAULT_FALL_FORWARD = 'the threads tighten';
export const DEFAULT_AGENT_REACTION = 'the moment shifts';
export const DEFAULT_INITIATION_PROSE = 'The thread stirs and waits for a choice.';
export const DEFAULT_SUCCESS_PROSE = 'The thread bends, and the world remembers.';
export const DEFAULT_FAILURE_PROSE = 'The thread frays, but does not break.';
export const DEFAULT_ENCOUNTER_REACH: EncounterChoiceReach = 'iron';

export type EncounterChoiceIntervention = NonNullable<
  NonNullable<UnifiedActionTemplate['authoredChoices']>[number][number]['interventionType']
>;

export type EncounterAuthoredChoice = NonNullable<
  NonNullable<UnifiedActionTemplate['authoredChoices']>[number]
>[number];

export const EFFECTIVE_INTERVENTION_TO_COST: Record<EncounterChoiceIntervention, EncounterChoiceCost> = {
  supportive: 'small_breath',
  coercive: 'deep_draught',
  withdrawn: 'small_breath',
};

export function toEncounterChoiceCost(choice: EncounterAuthoredChoice): EncounterChoiceCost {
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

function toTemplateReach(template: UnifiedActionTemplate): EncounterChoiceReach {
  const rawReach = (template as UnifiedActionTemplate & { reach?: string }).reach;
  if (rawReach && ENCOUNTER_CHOICE_REACH_VALUES.includes(rawReach as EncounterChoiceReach)) {
    return rawReach as EncounterChoiceReach;
  }
  return DEFAULT_ENCOUNTER_REACH;
}

export function toStepFallbackReach(template: UnifiedActionTemplate, stepIndex: number): EncounterChoiceReach {
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  if (step && 'reach' in step && typeof step.reach === 'string') {
    return step.reach;
  }

  if (step && 'fallback' in step && step.fallback && typeof step.fallback.reach === 'string') {
    return step.fallback.reach;
  }

  return toTemplateReach(template);
}

export function toEncounterChoiceReach(
  template: UnifiedActionTemplate,
  stepIndex: number,
  choice: EncounterAuthoredChoice,
): EncounterChoiceReach {
  const nextStep = template.steps[stepIndex + 1] as UnifiedActionTemplate['steps'][number] | undefined;
  if (
    nextStep
    && 'variants' in nextStep
    && choice.id
    && typeof nextStep.variants === 'object'
    && nextStep.variants !== null
  ) {
    const matchingVariant = (nextStep.variants as Record<string, { reach?: string }>)[choice.id];
    if (matchingVariant && typeof matchingVariant.reach === 'string') {
      return matchingVariant.reach as EncounterChoiceReach;
    }
  }

  return toStepFallbackReach(template, stepIndex);
}

export function toEncounterArchetypePole(
  reach: EncounterChoiceReach,
  choice: EncounterAuthoredChoice,
): EncounterArchetypePole {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  if (choice.interventionType === 'coercive') {
    return poles[1];
  }
  return poles[0];
}

export function encodeEncounterContractMetadata(contract: EncounterContract): string {
  return `${ENCOUNTER_CONTRACT_METADATA_KEY}:${JSON.stringify(contract)}`;
}

export function buildFallbackEncounterChoice(
  template: UnifiedActionTemplate,
  stepIndex: number,
  reach: EncounterChoiceReach,
) {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  return {
    reach,
    cost: 'small_breath' as const,
    god_verb: `choice-${stepIndex + 1}`,
    agent_reaction:
      step && 'successAfterimage' in step
        ? (step.successAfterimage ?? DEFAULT_AGENT_REACTION)
        : DEFAULT_AGENT_REACTION,
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward:
      step && 'failureAfterimage' in step
        ? (step.failureAfterimage ?? DEFAULT_FALL_FORWARD)
        : DEFAULT_FALL_FORWARD,
  };
}

function toEncounterCategory(template: UnifiedActionTemplate): EncounterCategory {
  const maybeKind = (template as UnifiedActionTemplate & { kind?: string }).kind;
  if (maybeKind && ENCOUNTER_CATEGORY_VALUES.includes(maybeKind as EncounterCategory)) {
    return maybeKind as EncounterCategory;
  }
  return 'social';
}

function getNarrativeText(
  template: UnifiedActionTemplate,
  key: 'initiation' | 'success' | 'failure',
): string {
  const narrativeTemplates = (template as UnifiedActionTemplate & {
    narrativeTemplates?: Partial<Record<'initiation' | 'success' | 'failure', string>>;
  }).narrativeTemplates;

  const fromNarrativeTemplates = narrativeTemplates?.[key];
  if (typeof fromNarrativeTemplates === 'string' && fromNarrativeTemplates.length > 0) {
    return fromNarrativeTemplates;
  }

  if (key === 'initiation') {
    const firstStep = template.steps[0] as UnifiedActionTemplate['steps'][number] | undefined;
    if (firstStep && 'narrativeTemplate' in firstStep && typeof firstStep.narrativeTemplate === 'string') {
      return firstStep.narrativeTemplate;
    }
  }

  if (key === 'success') {
    const finalStep = template.steps[template.steps.length - 1] as UnifiedActionTemplate['steps'][number] | undefined;
    if (finalStep && 'successAfterimage' in finalStep && typeof finalStep.successAfterimage === 'string') {
      return finalStep.successAfterimage;
    }
  }

  if (key === 'failure') {
    const finalStep = template.steps[template.steps.length - 1] as UnifiedActionTemplate['steps'][number] | undefined;
    if (finalStep && 'failureAfterimage' in finalStep && typeof finalStep.failureAfterimage === 'string') {
      return finalStep.failureAfterimage;
    }
  }

  if (key === 'success') {
    return DEFAULT_SUCCESS_PROSE;
  }
  if (key === 'failure') {
    return DEFAULT_FAILURE_PROSE;
  }
  return DEFAULT_INITIATION_PROSE;
}

export function buildLiteEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const authoredChoices = template.authoredChoices ?? {};
  const rawStepIndexes = Object.keys(authoredChoices)
    .map((key) => Number(key))
    .filter((value) => Number.isInteger(value));
  const stepIndexes = (rawStepIndexes.length > 0
    ? rawStepIndexes
    : template.steps.map((_, index) => index)).sort((a, b) => a - b);
  const templateReach = toTemplateReach(template);
  const capabilityAxisReach = templateReach === 'quintessence' ? 'star' : templateReach;
  const initiationProse = getNarrativeText(template, 'initiation');
  const successProse = getNarrativeText(template, 'success');

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
      prose:
        step && 'narrativeTemplate' in step
          ? (step.narrativeTemplate ?? initiationProse)
          : initiationProse,
      prose_tooltips: {},
      encounter_choices:
        mappedChoices.length > 0
          ? mappedChoices
          : [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
    };
  });

  return parseEncounterContract({
    encounter: {
      id: template.id,
      protagonist: 'actor.placeholder',
      category: toEncounterCategory(template),
      rarity_tier: template.rarityTier ?? 1,
      intrinsic_tier: template.intrinsicTier ?? 'shaping',
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
        receipt: successProse,
        changes: [],
      },
      ascendant_hand_filter: {
        eligible: [],
        rare_pulse: [],
      },
    },
  });
}

export function withEncounterContract(template: UnifiedActionTemplate): UnifiedActionTemplate {
  const contract = buildLiteEncounterContract(template);
  return {
    ...template,
    illustrationAlt: encodeEncounterContractMetadata(contract),
  };
}
