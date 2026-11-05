import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { parseEncounterContract } from './encounter-contract-validators';
import {
  ENCOUNTER_CHOICE_REACH_VALUES,
  ENCOUNTER_CATEGORY_VALUES,
  MORAL_AXIS_POLES_BY_REACH,
  QUINTESSENCE_POLES,
  type EncounterCategory,
  type EncounterChoiceReach,
  type EncounterContract,
} from '../types/encounter-contract';

export const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
/**
 * THR-1725 — a beat with no authored factor lines carries none. The stock
 * "The threads are shifting." it used to carry reached the player as a factor
 * line ("makes no sense", Christian 2026-10-04); no line beats filler.
 */
export const DEFAULT_FORECAST_FACTORS = [] as const;
export const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
export const DEFAULT_TILTS_TOWARD = 'uncertain';
export const DEFAULT_ENCOUNTER_REACH: EncounterChoiceReach = 'iron';

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

/**
 * Inferred archetype-pole heuristic (legacy fallback, THR-318). Maps a choice's
 * `interventionType` to the reach's virtue/vice pole. Retired as the *primary*
 * path by THR-528 — prefer `resolveEncounterArchetypePole`, which honors an
 * authored `pole` on the card and only falls back here when none is declared.
 */
/**
 * Resolve a choice's display archetype pole, preferring the **authored** `pole`
 * declared on the card (THR-528) over the inferred `interventionType` heuristic.
 * Authored `'virtue'` → the reach's virtue pole, `'vice'` → its vice pole.
 */
export function encodeEncounterContractMetadata(contract: EncounterContract): string {
  return `${ENCOUNTER_CONTRACT_METADATA_KEY}:${JSON.stringify(contract)}`;
}

/**
 * THR-1725 — the contract's prose fields fall back to the template's own
 * authored text, never to stock "thread" filler. The template name is the last
 * resort only because the schema demands a non-empty string.
 */
function firstAuthored(template: UnifiedActionTemplate, ...candidates: readonly (string | undefined)[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
  }
  return template.name;
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
    agent_reaction: firstAuthored(
      template,
      step && 'successAfterimage' in step ? step.successAfterimage : undefined,
      template.narrativeTemplates?.success,
    ),
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward: firstAuthored(
      template,
      step && 'failureAfterimage' in step ? step.failureAfterimage : undefined,
      template.narrativeTemplates?.failure,
    ),
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

  return firstAuthored(template, template.description);
}

export function buildLiteEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const stepIndexes = template.steps.map((_, index) => index);
  const templateReach = toTemplateReach(template);
  const capabilityAxisReach = templateReach === 'quintessence' ? 'star' : templateReach;
  const initiationProse = getNarrativeText(template, 'initiation');
  const successProse = getNarrativeText(template, 'success');

  const beats = stepIndexes.map((stepIndex) => {
    const stepReach = toStepFallbackReach(template, stepIndex);
    const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: DEFAULT_FORECAST_FACTORS,
      prose:
        step && 'narrativeTemplate' in step
          ? (step.narrativeTemplate ?? initiationProse)
          : initiationProse,
      prose_tooltips: {},
      encounter_choices:
        [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
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
