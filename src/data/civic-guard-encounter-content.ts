/**
 * Civic Guard Encounter Content — quest, social, join, and promotion templates.
 *
 * The Civic Guard protects towns and cities, maintaining order and defending walls.
 * Primarily iron/stone reaches with duel/assist/lead encounter types.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const CG_DIFFICULTY_BASE = 25;
const CG_DIFFICULTY_STEP = 10;
const CG_SENIOR_BASE = 40;
const CG_ELITE_BASE = 55;
const CG_JOIN_DIFFICULTY = 20;
const CG_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const CIVIC_GUARD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['cg.join', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.0, questType: 'standard' }],
  ['cg.promotion', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['cg.quest.wall_patrol', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.gate_duty', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.break_up_brawl', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.escort_prisoner', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.05, questType: 'standard' }],
  ['cg.quest.investigate_disturbance', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['cg.senior.raid_hideout', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['cg.senior.defend_gate', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['cg.senior.command_watch', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['cg.elite.siege_defense', { factionDefId: 'civic_guard', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  ['cg.elite.purge_corruption', { factionDefId: 'civic_guard', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['cg.social.training_yard', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
  ['cg.social.barracks_meal', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
  ['cg.social.citizen_petition', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const CIVIC_GUARD_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Recruit+) ──────────────────────────────────

  {
    id: 'cg.quest.wall_patrol',
    name: 'Wall Patrol',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.quest.wall_patrol.1',
        name: 'Walk the Wall',
        narrative: 'The sergeant assigns a section of wall. Walk it and report anything unusual.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The wall is secure. Your diligence is noted.' },
        onFailure: { narrative: 'You miss a crumbling section. The sergeant is displeased.' },
      },
      {
        id: 'cg.quest.wall_patrol.2',
        name: 'Confront Intruders',
        narrative: 'Figures scaling the wall in the dark. Challenge them.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Intruders apprehended. The wall holds.', tierPromotionEligible: true },
        onFailure: { narrative: 'The intruders escape into the streets below.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'cg.quest.gate_duty',
    name: 'Gate Duty',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.quest.gate_duty.1',
        name: 'Check Papers',
        narrative: 'Merchants and travelers queue at the gate. Inspect their papers.',
        reach: 'eye',
        difficulty: CG_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'A smuggler caught. Contraband confiscated.' },
        onFailure: { narrative: 'Nothing suspicious found — or nothing noticed.' },
      },
      {
        id: 'cg.quest.gate_duty.2',
        name: 'Detain Suspect',
        narrative: 'A traveler resists inspection. Subdue them without harming bystanders.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'Suspect detained cleanly. The gate remains orderly.' },
        onFailure: { narrative: 'A scuffle at the gate draws unwanted attention.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  {
    id: 'cg.quest.break_up_brawl',
    name: 'Break Up a Brawl',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.quest.break_up_brawl.1',
        name: 'Arrive at the Scene',
        narrative: 'A tavern fight spills into the street. Restore order.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Combatants separated. Nobody badly hurt.' },
        onFailure: { narrative: 'The brawl grows. More guards needed.' },
      },
      {
        id: 'cg.quest.break_up_brawl.2',
        name: 'Take Statements',
        narrative: 'Sort out who started it. Someone must pay the damages.',
        reach: 'heart',
        difficulty: CG_DIFFICULTY_BASE + 5,
        duration: 1,
        onSuccess: { narrative: 'The instigator is fined. Peace restored.' },
        onFailure: { narrative: 'Both sides blame the other. No resolution.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'cg.quest.escort_prisoner',
    name: 'Escort Prisoner',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.quest.escort_prisoner.1',
        name: 'Secure the Prisoner',
        narrative: 'A convicted criminal must be moved to the garrison lockup.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Prisoner secured and compliant.' },
        onFailure: { narrative: 'The prisoner tests your grip. Trouble brewing.' },
      },
      {
        id: 'cg.quest.escort_prisoner.2',
        name: 'Fend Off Rescue Attempt',
        narrative: 'Allies of the prisoner ambush the escort.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Ambush repelled. Prisoner delivered safely.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The prisoner is freed in the chaos.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'cg.quest.investigate_disturbance',
    name: 'Investigate Disturbance',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.quest.investigate_disturbance.1',
        name: 'Canvas the Area',
        narrative: 'Reports of strange noises in the lower ward. Investigate.',
        reach: 'eye',
        difficulty: CG_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'You find the source. A collapsed cellar with something inside.' },
        onFailure: { narrative: 'Nothing turns up. The reports seem exaggerated.' },
      },
      {
        id: 'cg.quest.investigate_disturbance.2',
        name: 'Clear the Threat',
        narrative: 'Whatever lurks below must be dealt with before citizens are harmed.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Threat neutralized. The ward sleeps easier.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.40, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'You retreat. The threat remains.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  // ── Senior Quests (Sergeant+) ─────────────────────────────────

  {
    id: 'cg.senior.raid_hideout',
    name: 'Raid Criminal Hideout',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.senior.raid_hideout.1',
        name: 'Plan the Raid',
        narrative: 'Intelligence points to a smuggler den. Plan the entry.',
        reach: 'eye',
        difficulty: CG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Routes mapped. The element of surprise is yours.' },
        onFailure: { narrative: 'Bad intelligence. The layout is different than expected.' },
      },
      {
        id: 'cg.senior.raid_hideout.2',
        name: 'Execute the Raid',
        narrative: 'Kick the door. Subdue everyone inside.',
        reach: 'iron',
        difficulty: CG_SENIOR_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Hideout cleared. Contraband seized.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'They were ready. The raid turns into a fight for survival.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
  },

  {
    id: 'cg.senior.defend_gate',
    name: 'Defend the Gate',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'cg.senior.defend_gate.1',
        name: 'Organize Defenders',
        narrative: 'A hostile force approaches the gate. Muster the guard.',
        reach: 'iron',
        difficulty: CG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Defenders in position. The gate is reinforced.' },
        onFailure: { narrative: 'Disorganized. Defenders are scattered.' },
      },
      {
        id: 'cg.senior.defend_gate.2',
        name: 'Hold the Line',
        narrative: 'The assault hits. Hold until reinforcements arrive.',
        reach: 'iron',
        difficulty: CG_SENIOR_BASE + CG_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The gate holds. The attackers break against your defense.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'The gate buckles. You fall back to the inner ward.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 5.0,
  },

  {
    id: 'cg.senior.command_watch',
    name: 'Command the Night Watch',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.senior.command_watch.1',
        name: 'Assign Patrols',
        narrative: 'The night watch is yours to command. Assign routes and check-in times.',
        reach: 'eye',
        difficulty: CG_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Efficient routes. Full coverage of the district.' },
        onFailure: { narrative: 'Gaps in coverage. Blind spots remain.' },
      },
      {
        id: 'cg.senior.command_watch.2',
        name: 'Respond to Incident',
        narrative: 'A patrol signals trouble. Lead the response.',
        reach: 'iron',
        difficulty: CG_SENIOR_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Incident contained. Your watch passes without further trouble.', tierPromotionEligible: true },
        onFailure: { narrative: 'The situation escalates. Morning finds damage and complaints.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 5.0,
  },

  // ── Elite Quests (Captain+) ───────────────────────────────────

  {
    id: 'cg.elite.siege_defense',
    name: 'Siege Defense',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'cg.elite.siege_defense.1',
        name: 'Fortify Positions',
        narrative: 'Enemy forces encircle the city. Prepare defenses.',
        reach: 'stone',
        difficulty: CG_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Walls reinforced. Supply lines secured.' },
        onFailure: { narrative: 'Weak points remain. The enemy will find them.' },
      },
      {
        id: 'cg.elite.siege_defense.2',
        name: 'Coordinate the Guard',
        narrative: 'Multiple fronts demand attention. Allocate forces wisely.',
        reach: 'eye',
        difficulty: CG_ELITE_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Every section is covered. Morale holds.' },
        onFailure: { narrative: 'Stretched too thin. One section crumbles.' },
      },
      {
        id: 'cg.elite.siege_defense.3',
        name: 'Lead the Sortie',
        narrative: 'Break the siege with a decisive counter-attack.',
        reach: 'iron',
        difficulty: CG_ELITE_BASE + CG_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The siege breaks. The city stands because of you.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'The sortie fails. The siege tightens.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },

  {
    id: 'cg.elite.purge_corruption',
    name: 'Purge Corruption',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'cg.elite.purge_corruption.1',
        name: 'Gather Evidence',
        narrative: 'Corrupt officers undermine the guard. Build a case.',
        reach: 'eye',
        difficulty: CG_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Evidence collected. Names and dates confirmed.' },
        onFailure: { narrative: 'The corrupt officers catch wind. Evidence disappears.' },
      },
      {
        id: 'cg.elite.purge_corruption.2',
        name: 'Arrest the Corrupt',
        narrative: 'Move swiftly. Arrest the named officers before they flee.',
        reach: 'iron',
        difficulty: CG_ELITE_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Officers detained. The guard is cleaner for it.' },
        onFailure: { narrative: 'Some escape. The rot remains.' },
      },
      {
        id: 'cg.elite.purge_corruption.3',
        name: 'Rebuild Trust',
        narrative: 'The public trial must restore faith in the guard.',
        reach: 'heart',
        difficulty: CG_ELITE_BASE + CG_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Justice seen to be done. The guard\'s reputation recovers.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.40, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'Public cynicism deepens. The trial satisfies no one.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const CIVIC_GUARD_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'cg.social.training_yard',
    name: 'Training Yard',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.social.training_yard.1',
        name: 'Drill Practice',
        narrative: 'The training yard is open. Practice formations with fellow guards.',
        reach: 'iron',
        difficulty: CG_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Good form. The drill sergeant nods approval.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        onFailure: { narrative: 'Sloppy footwork. Extra drills assigned.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'cg.social.barracks_meal',
    name: 'Barracks Meal',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.social.barracks_meal.1',
        name: 'Share a Meal',
        narrative: 'The mess hall brings guards together. Sit and eat with your peers.',
        reach: 'heart',
        difficulty: CG_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Good company and warm food. Bonds strengthen.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: { narrative: 'You eat alone. The others have their own circles.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'cg.social.citizen_petition',
    name: 'Citizen Petition',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'cg.social.citizen_petition.1',
        name: 'Hear the Complaint',
        narrative: 'A citizen approaches with a grievance. Listen and advise.',
        reach: 'heart',
        difficulty: CG_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'The citizen leaves satisfied. Trust in the guard grows.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        onFailure: { narrative: 'The citizen storms off. Another complaint filed.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const CG_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'cg.join',
  name: 'Enlist in the Civic Guard',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'cg.join.1',
      name: 'Fitness Trial',
      narrative: 'The guard tests your strength and stamina. Run, lift, fight.',
      reach: 'iron',
      difficulty: CG_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'You pass the trial. A recruit\'s tabard is yours.' },
      onFailure: { narrative: 'Not fit enough. Train harder and return.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'stone',
  encounterType: 'duel',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  questPriority: 6.0,
};

export const CG_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'cg.promotion',
  name: 'Guard Promotion Review',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'cg.promotion.1',
      name: 'Review Board',
      narrative: 'Senior officers evaluate your service record and combat readiness.',
      reach: 'iron',
      difficulty: CG_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Promoted. New rank, new responsibilities.' },
      onFailure: { narrative: 'The board defers. More service needed.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'heart',
  encounterType: 'duel',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  questPriority: 7.0,
};

export const CG_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  CG_JOIN_TEMPLATE,
  CG_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a civic guard encounter template by ID.
 */
export function getCivicGuardEncounterById(id: string): EncounterTemplate | undefined {
  return CIVIC_GUARD_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? CG_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? CIVIC_GUARD_SOCIAL_TEMPLATES.find(t => t.id === id);
}
