/**
 * Rangers Brotherhood Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the rangers brotherhood.
 * Follows the same pattern as faction-encounter-content.ts.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const RB_DIFFICULTY_BASE = 25;
const RB_DIFFICULTY_STEP = 10;
const RB_SENIOR_BASE = 40;
const RB_ELITE_BASE = 55;
const RB_JOIN_DIFFICULTY = 20;
const RB_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const RANGERS_BROTHERHOOD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['rb.join', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.0, questType: 'standard' }],
  ['rb.promotion', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['rb.quest.trail_patrol', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.track_beast', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.survey_border', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.clear_threat', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.05, questType: 'standard' }],
  ['rb.quest.wilderness_rescue', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['rb.senior.deep_scout', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  ['rb.senior.ambush_raiders', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  ['rb.senior.map_unknown', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['rb.elite.monster_hunt', { factionDefId: 'rangers_brotherhood', minRank: 'lord_ranger', reputationReward: 0.08, questType: 'elite' }],
  ['rb.elite.frontier_defense', { factionDefId: 'rangers_brotherhood', minRank: 'lord_ranger', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['rb.social.campfire_tales', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
  ['rb.social.tracking_lesson', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
  ['rb.social.equipment_trade', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Scout+) ──────────────────────────────────

  {
    id: 'rb.quest.trail_patrol',
    name: 'Trail Patrol',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.quest.trail_patrol.1',
        name: 'Walk the Trail',
        narrative: 'The brotherhood assigns a stretch of wilderness road. Watch for trouble.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The trail is clear. Signs of safe passage noted.' },
        onFailure: { narrative: 'You miss subtle signs. Something stirs in the woods.' },
      },
      {
        id: 'rb.quest.trail_patrol.2',
        name: 'Handle the Disturbance',
        narrative: 'Movement off the trail. Investigate and resolve.',
        reach: 'iron',
        difficulty: RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The threat is dealt with. Travelers will pass safely.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The threat slips away into the undergrowth. Report filed.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'rb.quest.track_beast',
    name: 'Track a Beast',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.quest.track_beast.1',
        name: 'Read the Signs',
        narrative: 'Livestock have gone missing. Find the predator\'s trail.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Tracks found. The beast is heading uphill.' },
        onFailure: { narrative: 'Rain washes the tracks away. The trail goes cold.' },
      },
      {
        id: 'rb.quest.track_beast.2',
        name: 'Confront the Beast',
        narrative: 'The lair is found. End the threat to the settlement.',
        reach: 'iron',
        difficulty: RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'The beast falls. The livestock are safe again.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The beast is fiercer than expected. You withdraw to regroup.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'rb.quest.survey_border',
    name: 'Border Survey',
    locationTypes: ['camp', 'fort'],
    steps: [
      {
        id: 'rb.quest.survey_border.1',
        name: 'Map the Terrain',
        narrative: 'The brotherhood needs current maps of the borderlands.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE + 5,
        duration: 3,
        onSuccess: { narrative: 'Accurate maps drawn. Every ridge and ravine noted.' },
        onFailure: { narrative: 'Dense terrain slows the survey. Coverage is partial.' },
      },
      {
        id: 'rb.quest.survey_border.2',
        name: 'Report Findings',
        narrative: 'Compile observations into a tactical report for the captains.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'A thorough report. The captains adjust their deployments.',
          tierPromotionEligible: true,
        },
        onFailure: { narrative: 'The report lacks detail. More fieldwork is needed.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'rb.quest.clear_threat',
    name: 'Clear the Threat',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.quest.clear_threat.1',
        name: 'Scout the Enemy',
        narrative: 'A bandit camp has been spotted. Assess their numbers and defenses.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Strength assessed. They are vulnerable at dawn.' },
        onFailure: { narrative: 'Their sentries are alert. Observation is difficult.' },
      },
      {
        id: 'rb.quest.clear_threat.2',
        name: 'Strike the Camp',
        narrative: 'Move in and eliminate the threat before they scatter.',
        reach: 'iron',
        difficulty: RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'The camp is cleared. The borderlands are safer.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The bandits scatter. Some escape to regroup elsewhere.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'rb.quest.wilderness_rescue',
    name: 'Wilderness Rescue',
    locationTypes: ['town', 'camp'],
    steps: [
      {
        id: 'rb.quest.wilderness_rescue.1',
        name: 'Find the Lost',
        narrative: 'Travelers are missing in the wilds. Track them before it is too late.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Traces found. They went off-trail near the ravine.' },
        onFailure: { narrative: 'The search area is too vast. No clear trail.' },
      },
      {
        id: 'rb.quest.wilderness_rescue.2',
        name: 'Bring Them Home',
        narrative: 'Reach the lost travelers and guide them to safety.',
        reach: 'iron',
        difficulty: RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Survivors found and returned. The brotherhood earns gratitude.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: {
          narrative: 'Too late. Only belongings remain. A grim report filed.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  // ── Senior Quests (Ranger Captain+) ─────────────────────────────────

  {
    id: 'rb.senior.deep_scout',
    name: 'Deep Scout Mission',
    locationTypes: ['camp', 'fort'],
    steps: [
      {
        id: 'rb.senior.deep_scout.1',
        name: 'Penetrate the Frontier',
        narrative: 'Go beyond the mapped borders. Report what lies past the known lands.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'New territory mapped. Unknown settlements discovered.' },
        onFailure: { narrative: 'Hostile terrain forces a retreat. Partial data only.' },
      },
      {
        id: 'rb.senior.deep_scout.2',
        name: 'Evade Hostiles',
        narrative: 'The frontier is not empty. Move unseen past its inhabitants.',
        reach: 'iron',
        difficulty: RB_SENIOR_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A clean extraction with valuable intelligence.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: {
          narrative: 'Spotted and pursued. You escape but the map is incomplete.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  {
    id: 'rb.senior.ambush_raiders',
    name: 'Ambush the Raiders',
    locationTypes: ['camp', 'fort'],
    steps: [
      {
        id: 'rb.senior.ambush_raiders.1',
        name: 'Set the Trap',
        narrative: 'Raiders prey on the roads. Lay an ambush on their path.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The ground is chosen. Positions set. Now you wait.' },
        onFailure: { narrative: 'The raiders change route. The ambush site is wasted.' },
      },
      {
        id: 'rb.senior.ambush_raiders.2',
        name: 'Spring the Ambush',
        narrative: 'The raiders walk into your trap. Strike hard and fast.',
        reach: 'iron',
        difficulty: RB_SENIOR_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Total surprise. The raiders are broken.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The raiders fight back fiercely. Losses on both sides.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
  },

  {
    id: 'rb.senior.map_unknown',
    name: 'Map the Unknown',
    locationTypes: ['camp', 'fort'],
    steps: [
      {
        id: 'rb.senior.map_unknown.1',
        name: 'Chart New Territory',
        narrative: 'The brotherhood requires maps of regions no ranger has visited.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'New lands charted. Rivers, passes, and landmarks recorded.' },
        onFailure: { narrative: 'Impassable terrain blocks the survey. Gaps remain.' },
      },
      {
        id: 'rb.senior.map_unknown.2',
        name: 'Catalog the Resources',
        narrative: 'Note water sources, game trails, and potential camp sites.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A comprehensive guide to the region. The brotherhood is enriched.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: {
          narrative: 'Useful but incomplete. Follow-up expeditions will be needed.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  // ── Elite Quests (Lord Ranger+) ────────────────────────────────────

  {
    id: 'rb.elite.monster_hunt',
    name: 'The Great Hunt',
    locationTypes: ['camp', 'fort'],
    steps: [
      {
        id: 'rb.elite.monster_hunt.1',
        name: 'Track the Beast',
        narrative: 'A legendary predator terrorizes the frontier. Find its lair.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'Days of tracking lead to the lair. The beast is massive.' },
        onFailure: { narrative: 'The beast is cunning. It doubles back on its trail.' },
      },
      {
        id: 'rb.elite.monster_hunt.2',
        name: 'Prepare the Kill',
        narrative: 'Study the creature. Find its weakness.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'A vulnerability identified. The plan is set.' },
        onFailure: { narrative: 'No obvious weakness. Brute force may be the only option.' },
      },
      {
        id: 'rb.elite.monster_hunt.3',
        name: 'Slay the Beast',
        narrative: 'Steel and nerve against fang and claw. End this.',
        reach: 'iron',
        difficulty: RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The beast falls. Songs will be sung of this hunt.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The beast escapes wounded. It will be more dangerous now.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 8.0,
  },

  {
    id: 'rb.elite.frontier_defense',
    name: 'Frontier Defense',
    locationTypes: ['fort'],
    steps: [
      {
        id: 'rb.elite.frontier_defense.1',
        name: 'Assess the Threat',
        narrative: 'A large hostile force approaches the frontier. Evaluate their strength.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'Numbers, routes, and timing assessed. A plan forms.' },
        onFailure: { narrative: 'The force moves unpredictably. Hard to get a count.' },
      },
      {
        id: 'rb.elite.frontier_defense.2',
        name: 'Coordinate the Rangers',
        narrative: 'Deploy ranger squads to key defensive positions.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE + RB_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Every chokepoint is covered. The defense is layered.' },
        onFailure: { narrative: 'Not enough rangers to cover every approach.' },
      },
      {
        id: 'rb.elite.frontier_defense.3',
        name: 'Hold the Line',
        narrative: 'The assault begins. Hold the frontier or see it fall.',
        reach: 'iron',
        difficulty: RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The frontier holds. The enemy breaks against ranger steel.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: {
          narrative: 'The defense buckles. Organized retreat to secondary positions.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'rb.social.campfire_tales',
    name: 'Campfire Tales',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.social.campfire_tales.1',
        name: 'Share a Story',
        narrative: 'Rangers gather around the fire. Each shares a tale from the trail.',
        reach: 'heart',
        difficulty: RB_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Your tale draws nods and laughter. Bonds strengthen.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: { narrative: 'Your tale falls flat. The fire crackles in silence.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'rb.social.tracking_lesson',
    name: 'Tracking Lesson',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.social.tracking_lesson.1',
        name: 'Teach or Learn',
        narrative: 'A veteran ranger demonstrates advanced tracking techniques.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Useful techniques absorbed. Your tracking skills improve.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: { narrative: 'The lesson is lost on you today. Try again tomorrow.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'rb.social.equipment_trade',
    name: 'Trade Equipment',
    locationTypes: ['town', 'camp', 'fort'],
    steps: [
      {
        id: 'rb.social.equipment_trade.1',
        name: 'Swap Gear',
        narrative: 'Rangers barter surplus equipment. Your old bow for a better knife.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'A good trade. Better equipped for the next patrol.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#iron'],
          },
        },
        onFailure: { narrative: 'Nothing worth trading today. You keep your gear.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const RB_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'rb.join',
  name: 'Join the Rangers Brotherhood',
  locationTypes: ['town', 'camp', 'fort'],
  steps: [
    {
      id: 'rb.join.1',
      name: 'The Tracking Trial',
      narrative: 'The brotherhood tests your wilderness skills. Track a quarry through rough country.',
      reach: 'eye',
      difficulty: RB_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Quarry found. The brotherhood welcomes a new scout.' },
      onFailure: { narrative: 'You lost the trail. The wilds are not yet yours.' },
    },
  ],
  reachPrimary: 'eye',
  reachSecondary: 'iron',
  encounterType: 'explore',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  questPriority: 6.0,
};

export const RB_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'rb.promotion',
  name: 'Ranger Advancement',
  locationTypes: ['town', 'camp', 'fort'],
  steps: [
    {
      id: 'rb.promotion.1',
      name: 'The Endurance Trial',
      narrative: 'Higher rank means harder trails. Survive alone in hostile territory.',
      reach: 'iron',
      difficulty: RB_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'You return hardened and proven. Your new rank is earned.' },
      onFailure: { narrative: 'The trial breaks you early. Return when you are ready.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'eye',
  encounterType: 'duel',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  questPriority: 7.0,
};

export const RB_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  RB_JOIN_TEMPLATE,
  RB_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a rangers brotherhood encounter template by ID.
 */
export function getRangersBrotherhoodEncounterById(id: string): EncounterTemplate | undefined {
  return RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? RB_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES.find(t => t.id === id);
}
