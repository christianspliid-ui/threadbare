/**
 * Army Encounter Content — TB-073 Phase 1.
 *
 * Encounter templates for army lifecycle events: the army raise encounter
 * (mc.army.raise) and threshold encounters that fire when Quintessence degrades.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 2
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Constants ───────────────────────────────────────────────────────────

const ARMY_DIFFICULTY_BASE = 35;
const ARMY_DIFFICULTY_STEP = 10;
const ARMY_RAISE_IRON_DIFFICULTY = 40;   // Muster test (Iron Tier 4+ gate)
const ARMY_RAISE_GOLD_DIFFICULTY = 45;   // Pay test (Gold Tier 3+ gate)

// ─── Army Encounter Metadata ─────────────────────────────────────────────

/**
 * Lightweight metadata for army encounter templates.
 * Describes the lifecycle event category and eligibility gate.
 */
export interface ArmyEncounterMeta {
  /** Lifecycle category: 'raise' | 'threshold' | 'aftermath' */
  category: 'raise' | 'threshold' | 'aftermath';
  /** Minimum Iron capability tier required (0 = no gate) */
  minIronTier: number;
  /** Minimum Gold capability tier required (0 = no gate) */
  minGoldTier: number;
}

export const ARMY_ENCOUNTER_META: ReadonlyMap<string, ArmyEncounterMeta> = new Map([
  ['mc.army.raise',                     { category: 'raise',     minIronTier: 4, minGoldTier: 3 }],
  ['army.threshold.supply_crisis',      { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.desertion',          { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.mutiny',             { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.disbandment',        { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.aftermath.refugees',           { category: 'aftermath', minIronTier: 0, minGoldTier: 0 }],
]);

// ─── Army Raise Encounter Template ──────────────────────────────────────

/**
 * mc.army.raise — spawned programmatically when a faction's ambition
 * requires military force and eligibility checks pass.
 *
 * Step 1: Muster the Troops (Iron test) — commander rallies soldiers.
 * Step 2: March Formation (Gold test) — faction pays to field the army.
 *
 * On full success: army spawns.
 * On any failure: recruitment fails (Gold spent, no army).
 */
export const ARMY_RAISE_TEMPLATE: EncounterTemplate = {
  id: 'mc.army.raise',
  name: 'Raise an Army',
  locationTypes: [],  // spawned programmatically
  steps: [
    {
      id: 'mc.army.raise.1',
      name: 'Muster the Troops',
      narrative: 'The call goes out across the land. Will soldiers answer?',
      reach: 'iron',
      difficulty: ARMY_RAISE_IRON_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Hardened veterans and eager recruits fill the muster ground.' },
      onFailure: { narrative: 'The response is thin. Too few answer the call.' },
    },
    {
      id: 'mc.army.raise.2',
      name: 'March Formation',
      narrative: 'Soldiers must be paid, equipped, and provisioned before they march.',
      reach: 'gold',
      difficulty: ARMY_RAISE_GOLD_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Coin flows. The army forms ranks and prepares to march.' },
      onFailure: { narrative: 'Without coin, even willing soldiers disperse. The army never forms.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'gold',
  encounterType: 'lead',
  threatRating: 'hard',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
};

// ─── Threshold Encounter Templates ──────────────────────────────────────

export const ARMY_THRESHOLD_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'army.threshold.supply_crisis',
    name: 'Supply Crisis',
    locationTypes: [],  // spawned programmatically, not at locations
    steps: [
      {
        id: 'army.threshold.supply_crisis.1',
        name: 'Assess the Stores',
        narrative: 'The quartermaster reports dwindling supplies. Rations grow thin.',
        reach: 'eye',
        difficulty: ARMY_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Your assessment reveals a resupply route still open.' },
        onFailure: { narrative: 'The situation is worse than reported. Men grow hungry.' },
      },
      {
        id: 'army.threshold.supply_crisis.2',
        name: 'Secure Resupply',
        narrative: 'Without fresh supplies, the army will weaken further.',
        reach: 'gold',
        difficulty: ARMY_DIFFICULTY_BASE + ARMY_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Gold secures a supply convoy. The army steadies.' },
        onFailure: { narrative: 'No gold, no supply. The army tightens its belt.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },

  {
    id: 'army.threshold.desertion',
    name: 'Desertion Wave',
    locationTypes: [],
    steps: [
      {
        id: 'army.threshold.desertion.1',
        name: 'Rally the Troops',
        narrative: 'Soldiers slip away in the night. Morale crumbles.',
        reach: 'heart',
        difficulty: ARMY_DIFFICULTY_BASE + ARMY_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'Your words rekindle their resolve. The desertions slow.' },
        onFailure: { narrative: 'The speeches fall flat. More tents are empty come dawn.' },
      },
      {
        id: 'army.threshold.desertion.2',
        name: 'Enforce Discipline',
        narrative: 'Those who remain look to the commander for strength.',
        reach: 'iron',
        difficulty: ARMY_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Steel discipline holds what inspiration could not.' },
        onFailure: { narrative: 'The army grows thinner. Those who stay are grim.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  },

  {
    id: 'army.threshold.mutiny',
    name: 'Mutiny',
    locationTypes: [],
    steps: [
      {
        id: 'army.threshold.mutiny.1',
        name: 'Face the Mutineers',
        narrative: 'A ring of armed soldiers blocks the command tent. They want answers.',
        reach: 'heart',
        difficulty: ARMY_DIFFICULTY_BASE + ARMY_DIFFICULTY_STEP * 2,
        duration: 1,
        onSuccess: { narrative: 'You meet their eyes. They waver. Leadership asserts itself.' },
        onFailure: { narrative: 'Words fail. Steel is drawn.' },
      },
      {
        id: 'army.threshold.mutiny.2',
        name: 'Resolve the Crisis',
        narrative: 'The army hangs by a thread. Commander must act.',
        reach: 'iron',
        difficulty: ARMY_DIFFICULTY_BASE + ARMY_DIFFICULTY_STEP * 2,
        duration: 1,
        onSuccess: { narrative: 'Order is restored. The ringleaders are dealt with.' },
        onFailure: { narrative: 'The commander is deposed. The army fractures.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  },

  {
    id: 'army.threshold.disbandment',
    name: 'Forced Disbandment',
    locationTypes: [],
    steps: [
      {
        id: 'army.threshold.disbandment.1',
        name: 'The End',
        narrative: 'The army dissolves. Men scatter to the winds, taking what they can carry.',
        reach: 'iron',
        difficulty: 100,  // Auto-fail — this is a narrative beat, not a test
        duration: 1,
        onSuccess: { narrative: 'Against all odds, a core holds together.' },
        onFailure: { narrative: 'The army is no more. The commander stands alone.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  },
];

// ─── Refugee Encounter Templates ──────────────────────────────────────────

const REFUGEE_HEART_DIFFICULTY = 35;
const REFUGEE_GOLD_DIFFICULTY = 40;

/**
 * army.aftermath.refugees — spawned at neighboring settlements after
 * major or total destruction. Displaced survivors arrive in waves.
 *
 * Step 1: Welcome the Survivors (Heart test) — community decides to help
 * Step 2: Resettle the Displaced (Gold test) — resources to house refugees
 *
 * On full success: refugees settled, slight prosperity gain from labor.
 * On failure: refugees strain existing resources, minor prosperity loss.
 */
export const REFUGEE_AFTERMATH_TEMPLATE: EncounterTemplate = {
  id: 'army.aftermath.refugees',
  name: 'Refugees at the Gates',
  locationTypes: [],  // spawned programmatically after battle aftermath
  steps: [
    {
      id: 'army.aftermath.refugees.1',
      name: 'Welcome the Survivors',
      narrative: 'Haggard figures arrive at the settlement walls — refugees fleeing war-torn lands. The settlement must decide how to respond.',
      reach: 'heart',
      difficulty: REFUGEE_HEART_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Compassion opens the gates. The survivors are welcomed with whatever shelter can be offered.' },
      onFailure: { narrative: 'Fear and scarcity harden hearts. The gates stay closed, but the refugees linger.' },
    },
    {
      id: 'army.aftermath.refugees.2',
      name: 'Resettle the Displaced',
      narrative: 'Feeding and housing the displaced requires coin and organization.',
      reach: 'gold',
      difficulty: REFUGEE_GOLD_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Resources are stretched but managed. The refugees begin rebuilding their lives, adding hands to the settlement\'s labor pool.' },
      onFailure: { narrative: 'Without enough coin, the refugees strain food stores and crowd shelters. Tensions rise.' },
    },
  ],
  reachPrimary: 'heart',
  reachSecondary: 'gold',
  encounterType: 'discovery',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.discovery,
};

// ─── All Army Templates ─────────────────────────────────────────────────

export const ARMY_ENCOUNTER_TEMPLATES: readonly EncounterTemplate[] = [
  ARMY_RAISE_TEMPLATE,
  ...ARMY_THRESHOLD_TEMPLATES,
  REFUGEE_AFTERMATH_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

export function getArmyEncounterById(id: string): EncounterTemplate | undefined {
  return ARMY_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
