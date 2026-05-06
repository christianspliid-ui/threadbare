import type { LocationSubtype, SphereName } from './index';
import type { ReachDomain } from './traits';
import type { AttentionTier } from './attention';
import type { RarityTier } from './rarity';

export type EncounterCategory =
  | 'guild'
  | 'social'
  | 'tavern'
  | 'borderland'
  | 'monster'
  | 'anomaly'
  | 'army'
  | 'branching';

export type EncounterAttentionPriority = 'primary' | 'background' | 'offstage';

export type EncounterCastRepresentation = 'cast_tile' | 'faction_chip';

export type EncounterThreadWeight = 'taut' | 'thin' | 'fraying';

export type EncounterChoiceCost = 'small_breath' | 'fuller_breath' | 'deep_draught';

export type EncounterChoiceReach = ReachDomain | 'quintessence';

export type EncounterArchetypePole =
  | 'protector'
  | 'conqueror'
  | 'mender'
  | 'magnate'
  | 'confessor'
  | 'puppeteer'
  | 'archivist'
  | 'heretic'
  | 'sworn'
  | 'renegade'
  | 'seeker'
  | 'sentinel'
  | 'guardian'
  | 'shaper'
  | 'martyr'
  | 'survivor'
  | 'vanguard'
  | 'watcher';

export type EncounterAftermathChangeKind =
  | 'intelligence'
  | 'faction_tilt'
  | 'archetype_drift_register'
  | string;

export interface EncounterAmbientState {
  readonly time_of_day?: string;
  readonly weather?: string;
  readonly special?: string;
}

export interface EncounterPlaceContract {
  readonly location: string;
  readonly sublocation?: string;
  readonly ambient_state: EncounterAmbientState;
  readonly painting: string;
}

export interface EncounterCastEntryContract {
  readonly actor: string;
  readonly role_in_scene: string;
  readonly attention_priority: EncounterAttentionPriority;
  readonly representation: EncounterCastRepresentation;
  readonly disposition_per_beat: Readonly<Record<number, string>>;
  readonly tags: readonly string[];
}

export interface EncounterSceneThreadContract {
  readonly name: string;
  readonly weight: EncounterThreadWeight;
  readonly sphere_color: SphereName;
}

export interface EncounterSceneStateContract {
  readonly threads_in_play: readonly EncounterSceneThreadContract[];
  readonly factions_here: readonly string[];
  readonly place_conditions: readonly string[];
  readonly conditions_on_protagonist: readonly string[];
}

export interface EncounterProtagonistViewContract {
  readonly capability_axes: readonly [ReachDomain, ReachDomain, ReachDomain];
  readonly items_relevant: readonly string[];
  readonly vows_active_per_beat: Readonly<Record<number, readonly string[]>>;
  readonly callback_candidates: readonly string[];
  readonly state_descriptor: string;
}

export interface EncounterChoiceContract {
  readonly reach: EncounterChoiceReach;
  readonly cost: EncounterChoiceCost;
  readonly god_verb: string;
  readonly agent_reaction: string;
  readonly tilts_toward: string;
  readonly moral_axis_pole: EncounterArchetypePole;
  readonly fail_forward: string;
  readonly consumes_item?: string;
}

export interface EncounterBeatContract {
  readonly title: string;
  readonly invokes?: string;
  readonly forecast_factors: readonly [string, ...string[]];
  readonly prose: string;
  readonly prose_tooltips: Readonly<Record<string, string>>;
  readonly encounter_choices: readonly EncounterChoiceContract[];
}

export interface EncounterAftermathChangeContract {
  readonly kind: EncounterAftermathChangeKind;
  readonly payload: unknown;
}

export interface EncounterAftermathChoiceOptionContract {
  readonly label: string;
  readonly consequences: string;
}

export interface EncounterAftermathChoiceContract {
  readonly prompt: string;
  readonly options: readonly EncounterAftermathChoiceOptionContract[];
}

export interface EncounterAftermathContract {
  readonly receipt: string;
  readonly changes: readonly EncounterAftermathChangeContract[];
  readonly choice?: EncounterAftermathChoiceContract;
}

export interface EncounterAscendantHandFilterContract {
  readonly eligible: readonly string[];
  readonly rare_pulse: readonly string[];
}

export interface EncounterGraphNodeContract {
  readonly spawns_from: readonly string[];
  readonly gates_to: readonly string[];
  readonly enables: readonly string[];
}

export interface EncounterContractPayload {
  readonly id: string;
  readonly protagonist: string;
  readonly category: EncounterCategory;
  readonly rarity_tier: RarityTier;
  readonly intrinsic_tier: AttentionTier;
  readonly place: EncounterPlaceContract;
  readonly cast: readonly EncounterCastEntryContract[];
  readonly scene_state: EncounterSceneStateContract;
  readonly protagonist_view: EncounterProtagonistViewContract;
  readonly beats: readonly EncounterBeatContract[];
  readonly aftermath: EncounterAftermathContract;
  readonly ascendant_hand_filter: EncounterAscendantHandFilterContract;
  readonly graph_node?: EncounterGraphNodeContract;
}

export interface EncounterContract {
  readonly encounter: EncounterContractPayload;
}

export const ENCOUNTER_CATEGORY_VALUES: readonly EncounterCategory[] = [
  'guild',
  'social',
  'tavern',
  'borderland',
  'monster',
  'anomaly',
  'army',
  'branching',
];

export const ENCOUNTER_ATTENTION_PRIORITY_VALUES: readonly EncounterAttentionPriority[] = [
  'primary',
  'background',
  'offstage',
];

export const ENCOUNTER_CAST_REPRESENTATION_VALUES: readonly EncounterCastRepresentation[] = [
  'cast_tile',
  'faction_chip',
];

export const ENCOUNTER_CHOICE_COST_VALUES: readonly EncounterChoiceCost[] = [
  'small_breath',
  'fuller_breath',
  'deep_draught',
];

export const ENCOUNTER_CHOICE_REACH_VALUES: readonly EncounterChoiceReach[] = [
  'iron',
  'gold',
  'shadow',
  'veil',
  'heart',
  'eye',
  'stone',
  'star',
  'quintessence',
];

export const ENCOUNTER_ARCHETYPE_POLE_VALUES: readonly EncounterArchetypePole[] = [
  'protector',
  'conqueror',
  'mender',
  'magnate',
  'confessor',
  'puppeteer',
  'archivist',
  'heretic',
  'sworn',
  'renegade',
  'seeker',
  'sentinel',
  'guardian',
  'shaper',
  'martyr',
  'survivor',
  'vanguard',
  'watcher',
];

export const MORAL_AXIS_POLES_BY_REACH: Record<ReachDomain, readonly [EncounterArchetypePole, EncounterArchetypePole]> = {
  iron: ['protector', 'conqueror'],
  gold: ['mender', 'magnate'],
  shadow: ['confessor', 'puppeteer'],
  veil: ['archivist', 'heretic'],
  heart: ['sworn', 'renegade'],
  eye: ['seeker', 'sentinel'],
  stone: ['guardian', 'shaper'],
  star: ['martyr', 'survivor'],
};

export const QUINTESSENCE_POLES: readonly [EncounterArchetypePole, EncounterArchetypePole] = ['vanguard', 'watcher'];

export const ENCOUNTER_FOUR_WORKED_EXAMPLE_IDS: readonly [string, string, string, string] = [
  'encounter.eira_at_gate',
  'encounter.tavern_last_cup',
  'encounter.whisper_at_court',
  'encounter.ritual_of_threshold',
];

export const ENCOUNTER_DEFAULT_LOCATION_SUBTYPE: LocationSubtype = 'town';
