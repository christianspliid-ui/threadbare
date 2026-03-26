/**
 * Meeting Encounter Types — "Meet The First" agent generation encounter.
 *
 * A player-initiated 4-step encounter that generates a bonded agent:
 *   Step 1: Intent + Candidate Selection (pick primary/secondary reach, sphere, flavor)
 *   Step 2: Defining Moment (2-3 dilemmas that shape axiological profile)
 *   Step 3: The Spark (reveal + god-given trait + ambition)
 *   Step 4: Confirmation (shape or surprise)
 *
 * The meeting encounter is a choice-point encounter — no resolution rolls,
 * only player decisions. It produces a new agent node with a 'the_first'
 * court position thread edge.
 */

import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { ValuePair, AxiologicalProfile } from './agent';
import type { CooperationStrategy } from './disposition';

// ─── Constants ────────────────────────────────────────────────────

/** Number of candidates shown in Step 1 */
export const MEETING_CANDIDATE_COUNT = 3;

/** Min dilemmas per meeting encounter */
export const MEETING_DILEMMA_COUNT_MIN = 2;

/** Max dilemmas per meeting encounter */
export const MEETING_DILEMMA_COUNT_MAX = 3;

/** Axiological shift magnitude per dilemma choice */
export const DILEMMA_SHIFT_MAGNITUDE = 0.15;

/** Essence cost for Step 3 investment */
export const SPARK_INVESTMENT_COST = 2;

/** Reach capability boost from spark investment */
export const SPARK_CAPABILITY_BOOST = 1.0;

/** Probability ascendant's affinities appear in Step 1 options */
export const ASCENDANT_REACH_BIAS = 0.6;

/** Base reach capability for the primary reach */
export const PRIMARY_REACH_BASE = 0.4;

/** Base reach capability for the secondary reach */
export const SECONDARY_REACH_BASE = 0.25;

/** Base reach capability for remaining reaches (randomized around this) */
export const OTHER_REACH_BASE = 0.1;

/** Variance for randomized reach capabilities */
export const REACH_VARIANCE = 0.08;

// ─── Choice-Point Step Type ───────────────────────────────────────

/**
 * A choice option within a choice-point step.
 * Used for both meeting encounter steps and general encounter choices.
 */
export interface ChoiceOption {
  /** Unique choice ID within the step */
  id: string;
  /** Display text for the choice */
  text: string;
  /** How the god perceives/enacts this choice (sphere-filtered) */
  godAction?: string;
  /** Effects applied when this choice is selected */
  effects?: ChoiceEffects;
}

/**
 * Effects produced by selecting a choice option.
 */
export interface ChoiceEffects {
  /** Axiological profile shifts */
  axiologicalShifts?: Partial<Record<ValuePair, number>>;
  /** Reach capability changes */
  reachChanges?: Partial<Record<ReachDomain, number>>;
  /** Founding gate tags accumulated for the Return */
  gateTags?: string[];
  /** Narrative traits seeded by this choice */
  traitSeeds?: string[];
  /** Graph additions (allies, equipment, faction membership) */
  graphAdditions?: MeetingGraphAddition[];
}

/**
 * A graph element added as a dilemma choice consequence.
 */
export interface MeetingGraphAddition {
  /** What kind of graph element to create */
  type: 'ally' | 'equipment' | 'faction_membership' | 'mount' | 'location_link';
  /** Template ID or descriptor for the element */
  templateId: string;
  /** Display name */
  name: string;
  /** Additional properties for the graph node/edge */
  properties?: Record<string, unknown>;
}

// ─── Meeting Encounter State Machine ──────────────────────────────

/** The four steps of the meeting encounter */
export type MeetingStep = 'seeking_threads' | 'defining_moment' | 'the_spark' | 'confirmation';

/** Ordered step sequence */
export const MEETING_STEP_ORDER: MeetingStep[] = [
  'seeking_threads',
  'defining_moment',
  'the_spark',
  'confirmation',
];

/**
 * Runtime state for an active meeting encounter.
 * Tracks progress through the 4-step flow and accumulates choices.
 */
export interface MeetingEncounterState {
  /** Unique encounter instance ID */
  id: string;
  /** Current step in the meeting flow */
  currentStep: MeetingStep;
  /** Location where the meeting is taking place */
  locationId: string;
  /** Ascendant initiating the meeting */
  ascendantId: string;
  /** Tick when the meeting started */
  startedTick: number;
  /** Whether the encounter is still active */
  status: 'active' | 'completed' | 'cancelled';

  // ── Step 1 results ──
  /** Player's chosen primary reach intent */
  intentPrimaryReach?: ReachDomain;
  /** Player's chosen secondary reach */
  intentSecondaryReach?: ReachDomain;
  /** Player's chosen sphere/domain */
  intentSphere?: SphereName;
  /** Generated candidates (3) */
  candidates?: MeetingCandidate[];
  /** Index of the selected candidate (0-2) */
  selectedCandidateIndex?: number;
  /** Flavor choices made by the player */
  flavorChoices?: FlavorChoices;

  // ── Step 2 results ──
  /** Dilemma templates selected for this encounter */
  dilemmas?: DilemmaInstance[];
  /** Index of the current dilemma being presented */
  currentDilemmaIndex?: number;
  /** Accumulated dilemma choice records */
  dilemmaChoiceRecords?: DilemmaChoiceRecord[];

  // ── Step 3 results ──
  /** God-given trait selected by the player */
  sparkTraitId?: string;
  /** Investment choice ID from Step 3 */
  investmentChoiceId?: string;

  // ── Step 4 results ──
  /** Whether the player chose to shape or accept */
  shapePath?: 'shape' | 'surprise';
  /** Player-edited name (only if shapePath = 'shape') */
  editedName?: string;

  // ── Accumulated state ──
  /** Running axiological profile built from dilemma choices */
  accumulatedProfile?: Partial<AxiologicalProfile>;
  /** Accumulated founding gate tags */
  accumulatedGateTags?: string[];
  /** Narrative traits accumulated from dilemma choices */
  accumulatedTraitSeeds?: string[];
}

// ─── Meeting Candidates (Step 1) ──────────────────────────────────

/**
 * A candidate generated for the player to choose from in Step 1.
 * Created from scratch based on player's intent choices.
 */
export interface MeetingCandidate {
  /** Temp ID for this candidate (not yet a graph node) */
  tempId: string;
  /** Generated name */
  name: string;
  /** Narrative archetype ID from the 81-archetype map */
  archetypeId: string;
  /** Culture ID from the meeting location */
  cultureId: string;
  /** Primary reach (from player intent) */
  primaryReach: ReachDomain;
  /** Secondary reach (from player intent) */
  secondaryReach: ReachDomain;
  /** Sphere alignment */
  sphere: SphereName;
  /** Rich prose vignette — a person in a specific moment */
  vignetteText: string;
  /** Personality hints shown to the player (not the raw numbers) */
  personalityHints: string[];
  /** Pre-seeded axiological profile (hidden from player) */
  axiologicalSeed: AxiologicalProfile;
  /** Pre-seeded reach capabilities */
  reachCapabilities: Record<ReachDomain, number>;
  /** Cooperation strategy (hidden from player) */
  cooperationStrategy: CooperationStrategy;
  /** PRNG seed for appearance generation */
  appearanceSeed: number;
}

/**
 * Player-selected flavor choices for appearance and manner.
 * Optional — skip and the game randomizes.
 */
export interface FlavorChoices {
  /** Gender presentation */
  gender?: string;
  /** Build/height descriptor */
  build?: string;
  /** Hair descriptor */
  hair?: string;
  /** Manner/bearing descriptor */
  manner?: string;
  /** Additional descriptors */
  extras?: string[];
}

// ─── Intent Options (Step 1) ──────────────────────────────────────

/**
 * An intent option shown to the player in Step 1.
 * Maps narrative text to a reach domain.
 */
export interface IntentOption {
  /** Reach domain this intent maps to */
  reach: ReachDomain;
  /** Narrative text displayed to the player */
  text: string;
  /** Short label */
  label: string;
}

/** All possible intent options for Step 1 primary reach selection */
export const INTENT_OPTIONS: IntentOption[] = [
  { reach: 'iron',   label: 'Iron',   text: 'A blade to carve your will into the world' },
  { reach: 'heart',  label: 'Heart',  text: 'A voice to move hearts and bend kingdoms' },
  { reach: 'eye',    label: 'Eye',    text: 'Eyes that see what others cannot' },
  { reach: 'shadow', label: 'Shadow', text: 'A shadow that moves where no one watches' },
  { reach: 'veil',   label: 'Veil',   text: 'A mind that touches the hidden world' },
  { reach: 'stone',  label: 'Stone',  text: 'Hands that shape the raw stuff of creation' },
  { reach: 'star',   label: 'Star',   text: 'A soul that burns bright enough to change fate' },
  { reach: 'gold',   label: 'Gold',   text: 'Gold, influence, the levers of mortal power' },
  { reach: 'flesh',  label: 'Flesh',  text: 'The pulse of living things, bent to your design' },
];

// ─── Dilemma Templates (Step 2) ──────────────────────────────────

/** Categories of dilemma templates */
export type DilemmaCategory = 'axiological' | 'reach_specific' | 'domain_specific' | 'general';

/**
 * A dilemma template — the authored content for a Step 2 choice scene.
 */
export interface DilemmaTemplate {
  /** Unique template ID */
  id: string;
  /** Dilemma category */
  category: DilemmaCategory;
  /** Which value pair this dilemma targets (axiological category) */
  targetValuePair?: ValuePair;
  /** Which reach this dilemma is keyed to (reach_specific category) */
  targetReach?: ReachDomain;
  /** Which sphere this dilemma is keyed to (domain_specific category) */
  targetSphere?: SphereName;
  /** Archetype IDs this dilemma works with (empty = universal) */
  archetypeIds?: string[];
  /** Location subtypes where this dilemma fits (empty = universal) */
  locationSubtypes?: string[];
  /** Rich prose setup — the situation the god has arranged (3-5 sentences) */
  setup: string;
  /** How the god perceives this moment (sphere-filtered, 1-2 sentences) */
  godVoice: string;
  /** 2-3 choices the player can make */
  choices: DilemmaChoiceTemplate[];
}

/**
 * A choice within a dilemma template.
 */
export interface DilemmaChoiceTemplate {
  /** Unique choice ID within the dilemma */
  id: string;
  /** What happens narratively (1-2 sentences) */
  text: string;
  /** How the god pulls the threads (1 sentence) */
  godAction: string;
  /** Axiological profile shifts */
  axiologicalShifts: Partial<Record<ValuePair, number>>;
  /** Reach capability changes */
  reachChanges?: Partial<Record<ReachDomain, number>>;
  /** Founding gate tags */
  gateTags: string[];
  /** Narrative trait seeds */
  traitSeeds?: string[];
  /** Graph additions (allies, equipment, etc.) */
  graphAdditions?: MeetingGraphAddition[];
}

/**
 * A dilemma instance in an active meeting encounter.
 * References a template but may have enriched prose.
 */
export interface DilemmaInstance {
  /** Template ID */
  templateId: string;
  /** Category (copied from template for convenience) */
  category: DilemmaCategory;
  /** Enriched setup prose (template + dynamic enrichment) */
  setup: string;
  /** Enriched god voice */
  godVoice: string;
  /** Choices with enriched text */
  choices: DilemmaChoiceTemplate[];
}

/**
 * Record of a single dilemma choice made during the meeting.
 */
export interface DilemmaChoiceRecord {
  /** Dilemma template ID */
  dilemmaId: string;
  /** Category of the dilemma */
  category: DilemmaCategory;
  /** Which choice was selected */
  choiceId: string;
  /** The founding gate tags from this choice */
  gateTags: string[];
  /** Axiological shifts applied */
  axiologicalShifts: Partial<Record<ValuePair, number>>;
  /** Reach changes applied */
  reachChanges?: Partial<Record<ReachDomain, number>>;
  /** Trait seeds from this choice */
  traitSeeds?: string[];
}

// ─── Meeting Choice Record (persisted on thread edge) ─────────────

/**
 * Full record of all meeting encounter choices.
 * Stored on the thread edge as `meetingChoiceRecord`.
 */
export interface MeetingChoiceRecord {
  /** Tick when the meeting encounter completed */
  encounterTick: number;
  /** Location where the meeting took place */
  locationId: string;
  /** Player's primary reach intent */
  intentPrimaryReach: ReachDomain;
  /** Player's secondary reach intent */
  intentSecondaryReach: ReachDomain;
  /** Player's sphere intent */
  intentSphere: SphereName;
  /** Which candidate was selected (0-based index) */
  candidateIndex: number;
  /** Archetype ID of the selected candidate */
  archetypeId: string;
  /** All dilemma choices with founding tags */
  dilemmaChoices: DilemmaChoiceRecord[];
  /** Step 3 investment choice ID */
  investmentChoice: string;
  /** Step 3 god-given trait ID */
  sparkTraitId: string;
  /** Step 4: shape or surprise */
  shapePath: 'shape' | 'surprise';
  /** Ascendant's sphere at time of meeting */
  ascendantSphere: SphereName;
  /** All accumulated founding gate tags */
  foundingGateTags: string[];
  /** Flavor choices */
  flavorChoices?: FlavorChoices;
}

// ─── Spark Investment Options (Step 3) ────────────────────────────

/**
 * An investment option shown in Step 3 — the god steers the mortal's path.
 */
export interface SparkInvestmentOption {
  /** Unique ID */
  id: string;
  /** Display text */
  text: string;
  /** Which reach this investment boosts */
  reach: ReachDomain;
  /** Trait seed from this investment */
  traitSeed?: string;
}

// ─── Output: Created Agent ────────────────────────────────────────

/**
 * The final output of a completed meeting encounter.
 * Used to create the agent node and thread edge.
 */
export interface MeetingEncounterResult {
  /** Generated agent name */
  name: string;
  /** Narrative archetype ID */
  archetypeId: string;
  /** Culture ID */
  cultureId: string;
  /** Final axiological profile */
  axiologicalProfile: AxiologicalProfile;
  /** Final reach capabilities */
  reachCapabilities: Record<ReachDomain, number>;
  /** Primary reach */
  primaryReach: ReachDomain;
  /** Secondary reach */
  secondaryReach: ReachDomain;
  /** Sphere alignment */
  sphere: SphereName;
  /** Cooperation strategy */
  cooperationStrategy: CooperationStrategy;
  /** All founding gate tags */
  foundingGateTags: string[];
  /** Narrative trait seeds (from dilemmas + spark) */
  traitSeeds: string[];
  /** Flavor choices */
  flavorChoices?: FlavorChoices;
  /** Appearance PRNG seed */
  appearanceSeed: number;
  /** The full meeting choice record (persisted on thread edge) */
  meetingChoiceRecord: MeetingChoiceRecord;
  /** Location ID where the agent was created */
  locationId: string;
}
