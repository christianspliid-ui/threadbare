import { z } from 'zod';
import {
  ENCOUNTER_ARCHETYPE_POLE_VALUES,
  ENCOUNTER_ATTENTION_PRIORITY_VALUES,
  ENCOUNTER_CAST_REPRESENTATION_VALUES,
  ENCOUNTER_CATEGORY_VALUES,
  ENCOUNTER_CHOICE_COST_VALUES,
  ENCOUNTER_CHOICE_REACH_VALUES,
  MORAL_AXIS_POLES_BY_REACH,
  QUINTESSENCE_POLES,
  type EncounterArchetypePole,
  type EncounterContract,
  type EncounterContractPayload,
} from '../types/encounter-contract';
import { SPHERE_NAMES } from '../types/index';
import { REACH_DOMAINS } from '../types/traits';

const PROTAGONIST_CAPABILITY_AXIS_COUNT = 3;
const FORECAST_FACTOR_SCHEMA = z.string().min(1);

const threadSchema = z.object({
  name: z.string().min(1),
  weight: z.enum(['taut', 'thin', 'fraying']),
  sphere_color: z.enum(SPHERE_NAMES),
});

const castSchema = z.object({
  actor: z.string().min(1),
  role_in_scene: z.string().min(1),
  attention_priority: z.enum(ENCOUNTER_ATTENTION_PRIORITY_VALUES),
  representation: z.enum(ENCOUNTER_CAST_REPRESENTATION_VALUES),
  disposition_per_beat: z.record(z.coerce.number().int().positive(), z.string().min(1)),
  tags: z.array(z.string().min(1)),
}).superRefine((entry, ctx) => {
  if (entry.representation === 'faction_chip' && entry.attention_priority !== 'offstage') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "representation 'faction_chip' is only valid when attention_priority is 'offstage'",
      path: ['representation'],
    });
  }
});

const choiceSchema = z.object({
  reach: z.enum(ENCOUNTER_CHOICE_REACH_VALUES),
  cost: z.enum(ENCOUNTER_CHOICE_COST_VALUES),
  god_verb: z.string().min(1),
  agent_reaction: z.string().min(1),
  tilts_toward: z.string().min(1),
  moral_axis_pole: z.enum(ENCOUNTER_ARCHETYPE_POLE_VALUES),
  fail_forward: z.string().min(1),
  consumes_item: z.string().min(1).optional(),
});

const beatSchema = z.object({
  title: z.string().min(1),
  invokes: z.string().min(1).optional(),
  forecast_factors: z.union([
    z.tuple([FORECAST_FACTOR_SCHEMA]),
    z.tuple([FORECAST_FACTOR_SCHEMA, FORECAST_FACTOR_SCHEMA]),
    z.tuple([FORECAST_FACTOR_SCHEMA, FORECAST_FACTOR_SCHEMA, FORECAST_FACTOR_SCHEMA]),
  ]),
  prose: z.string().min(1),
  prose_tooltips: z.record(z.string().min(1), z.string().min(1)),
  encounter_choices: z.array(choiceSchema).min(1),
});

const encounterPayloadSchemaBase = z.object({
  id: z.string().min(1),
  protagonist: z.string().min(1),
  category: z.enum(ENCOUNTER_CATEGORY_VALUES),
  rarity_tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  intrinsic_tier: z.enum(['background', 'shaping', 'story_beat']),
  place: z.object({
    location: z.string().min(1),
    sublocation: z.string().min(1).optional(),
    ambient_state: z.object({
      time_of_day: z.string().min(1).optional(),
      weather: z.string().min(1).optional(),
      special: z.string().min(1).optional(),
    }),
    painting: z.string().min(1),
  }),
  cast: z.array(castSchema),
  scene_state: z.object({
    threads_in_play: z.array(threadSchema),
    factions_here: z.array(z.string().min(1)),
    place_conditions: z.array(z.string().min(1)),
    conditions_on_protagonist: z.array(z.string().min(1)),
  }),
  protagonist_view: z.object({
    capability_axes: z.array(z.enum(REACH_DOMAINS)).length(PROTAGONIST_CAPABILITY_AXIS_COUNT),
    items_relevant: z.array(z.string().min(1)),
    vows_active_per_beat: z.record(z.coerce.number().int().positive(), z.array(z.string().min(1))),
    callback_candidates: z.array(z.string().min(1)),
    state_descriptor: z.string().min(1),
  }),
  beats: z.array(beatSchema).min(1),
  aftermath: z.object({
    receipt: z.string().min(1),
    changes: z.array(z.object({
      kind: z.string().min(1),
      payload: z.unknown(),
    })),
    choice: z.object({
      prompt: z.string().min(1),
      options: z.array(z.object({
        label: z.string().min(1),
        consequences: z.string().min(1),
      })).min(1),
    }).optional(),
  }),
  ascendant_hand_filter: z.object({
    eligible: z.array(z.string().min(1)),
    rare_pulse: z.array(z.string().min(1)),
  }),
  graph_node: z.object({
    spawns_from: z.array(z.string().min(1)),
    gates_to: z.array(z.string().min(1)),
    enables: z.array(z.string().min(1)),
  }).optional(),
});

function isPoleAllowedForReach(reach: string, pole: EncounterArchetypePole): boolean {
  if (reach === 'quintessence') {
    return QUINTESSENCE_POLES.includes(pole);
  }
  if (!Object.prototype.hasOwnProperty.call(MORAL_AXIS_POLES_BY_REACH, reach)) {
    return false;
  }
  const [poleA, poleB] = MORAL_AXIS_POLES_BY_REACH[reach as keyof typeof MORAL_AXIS_POLES_BY_REACH];
  return pole === poleA || pole === poleB;
}

const encounterPayloadSchema: z.ZodType<EncounterContractPayload> = encounterPayloadSchemaBase.superRefine((payload, ctx) => {
  payload.beats.forEach((beat, beatIndex) => {
    beat.encounter_choices.forEach((choice, choiceIndex) => {
      if (!isPoleAllowedForReach(choice.reach, choice.moral_axis_pole)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `moral_axis_pole '${choice.moral_axis_pole}' is invalid for reach '${choice.reach}'`,
          path: ['beats', beatIndex, 'encounter_choices', choiceIndex, 'moral_axis_pole'],
        });
      }
    });
  });
});

export const encounterContractSchema: z.ZodType<EncounterContract> = z.object({
  encounter: encounterPayloadSchema,
});

export function parseEncounterContract(contract: unknown): EncounterContract {
  return encounterContractSchema.parse(contract);
}

export function isEncounterContract(contract: unknown): contract is EncounterContract {
  return encounterContractSchema.safeParse(contract).success;
}
