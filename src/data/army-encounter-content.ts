/**
 * Army Encounter Content — TB-073 Phase 1.
 *
 * Encounter templates for army lifecycle events: threshold encounters
 * that fire when Quintessence degrades, and the army raise encounter.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 2
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Constants ───────────────────────────────────────────────────────────

const ARMY_DIFFICULTY_BASE = 35;
const ARMY_DIFFICULTY_STEP = 10;

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

// ─── All Army Templates ─────────────────────────────────────────────────

export const ARMY_ENCOUNTER_TEMPLATES: readonly EncounterTemplate[] = [
  ...ARMY_THRESHOLD_TEMPLATES,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

export function getArmyEncounterById(id: string): EncounterTemplate | undefined {
  return ARMY_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
