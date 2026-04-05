/**
 * Builders Fellowship Encounter Content — quest, social, join, and promotion templates.
 *
 * The Builders Fellowship is a crafting and construction guild dedicated to great works.
 * Primarily stone/gold reaches with build/create/lead encounter types.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const BF_DIFFICULTY_BASE = 25;
const BF_DIFFICULTY_STEP = 10;
const BF_SENIOR_BASE = 40;
const BF_ELITE_BASE = 55;
const BF_JOIN_DIFFICULTY = 20;
const BF_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const BUILDERS_FELLOWSHIP_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['bf.join', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['bf.promotion', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['bf.quest.repair_wall', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.lay_foundation', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.forge_tools', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.survey_site', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['bf.quest.craft_commission', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['bf.senior.raise_bridge', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  ['bf.senior.design_fortification', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  ['bf.senior.master_craft', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['bf.elite.grand_monument', { factionDefId: 'builders_fellowship', minRank: 'master_builder', reputationReward: 0.08, questType: 'elite' }],
  ['bf.elite.engineer_wonder', { factionDefId: 'builders_fellowship', minRank: 'master_builder', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['bf.social.workshop_tour', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['bf.social.guild_feast', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['bf.social.material_trade', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Apprentice+) ──────────────────────────────

  {
    id: 'bf.quest.repair_wall',
    name: 'Repair the Wall',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.quest.repair_wall.1',
        name: 'Assess the Damage',
        narrative: 'A section of wall has crumbled. Evaluate what needs to be done.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Damage catalogued. Materials and labor estimated.' },
        onFailure: { narrative: 'You underestimate the damage. Rework will be needed.' },
      },
      {
        id: 'bf.quest.repair_wall.2',
        name: 'Complete the Repair',
        narrative: 'Mortar, stone, and sweat. Rebuild the section to code.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The wall stands strong again. Good craftsmanship.' },
        onFailure: { narrative: 'The repair is shoddy. It will need redoing.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 3.0,
  },

  {
    id: 'bf.quest.lay_foundation',
    name: 'Lay a Foundation',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.quest.lay_foundation.1',
        name: 'Prepare the Ground',
        narrative: 'A new building needs a foundation. Clear and level the site.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Ground prepared. Level and true.' },
        onFailure: { narrative: 'Uneven ground. The foundation will settle unevenly.' },
      },
      {
        id: 'bf.quest.lay_foundation.2',
        name: 'Pour the Foundation',
        narrative: 'Mix the mortar and set the stones. Precision matters.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'A solid foundation. This building will stand for generations.', tierPromotionEligible: true },
        onFailure: { narrative: 'Cracks appear before the building even rises.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 3.0,
  },

  {
    id: 'bf.quest.forge_tools',
    name: 'Forge New Tools',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.quest.forge_tools.1',
        name: 'Prepare Materials',
        narrative: 'The fellowship needs new tools. Select and prepare the metal.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Good ore refined. Ready for the forge.' },
        onFailure: { narrative: 'Impurities in the metal. The tools will be brittle.' },
      },
      {
        id: 'bf.quest.forge_tools.2',
        name: 'Work the Forge',
        narrative: 'Heat, hammer, quench. Craft tools that will endure hard use.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'Fine tools produced. The fellowship is well-equipped.',
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'Serviceable but nothing special. Average work.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 3.0,
  },

  {
    id: 'bf.quest.survey_site',
    name: 'Survey a Building Site',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.quest.survey_site.1',
        name: 'Measure and Map',
        narrative: 'A patron wants a new structure. Survey the proposed site.',
        reach: 'eye',
        difficulty: BF_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Accurate measurements. The site is suitable.' },
        onFailure: { narrative: 'Measurements are off. The plans will need adjustment.' },
      },
      {
        id: 'bf.quest.survey_site.2',
        name: 'Draft the Plans',
        narrative: 'Turn measurements into blueprints. Form follows function.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Clean blueprints delivered. The patron is impressed.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The plans have errors. Revision needed.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 3.0,
  },

  {
    id: 'bf.quest.craft_commission',
    name: 'Fulfill a Craft Commission',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.quest.craft_commission.1',
        name: 'Negotiate Terms',
        narrative: 'A merchant orders custom metalwork. Agree on price and timeline.',
        reach: 'gold',
        difficulty: BF_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Fair terms agreed. Deposit received.' },
        onFailure: { narrative: 'The merchant drives a hard bargain. Tight margins.' },
      },
      {
        id: 'bf.quest.craft_commission.2',
        name: 'Deliver the Work',
        narrative: 'Craft the commissioned piece to specification.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The work exceeds expectations. Repeat business guaranteed.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        onFailure: { narrative: 'The work is acceptable but uninspired. Payment only.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 3.0,
  },

  // ── Senior Quests (Journeyman+) ───────────────────────────────

  {
    id: 'bf.senior.raise_bridge',
    name: 'Raise a Bridge',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.senior.raise_bridge.1',
        name: 'Engineer the Design',
        narrative: 'A river crossing is needed. Design a bridge that will hold.',
        reach: 'stone',
        difficulty: BF_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'Sound engineering. The design accounts for flood and load.' },
        onFailure: { narrative: 'Structural weakness in the design. Back to the drawing board.' },
      },
      {
        id: 'bf.senior.raise_bridge.2',
        name: 'Build the Span',
        narrative: 'Coordinate the crews. Raise the bridge stone by stone.',
        reach: 'stone',
        difficulty: BF_SENIOR_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The bridge stands. Traffic flows. A lasting contribution.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        onFailure: { narrative: 'Delays and cost overruns. The bridge is passable but flawed.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 5.0,
  },

  {
    id: 'bf.senior.design_fortification',
    name: 'Design Fortifications',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'bf.senior.design_fortification.1',
        name: 'Study the Terrain',
        narrative: 'The city needs better defenses. Assess the terrain and existing walls.',
        reach: 'eye',
        difficulty: BF_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Weak points identified. Improvements designed.' },
        onFailure: { narrative: 'The terrain is more complex than expected.' },
      },
      {
        id: 'bf.senior.design_fortification.2',
        name: 'Oversee Construction',
        narrative: 'Direct the work crews. Every stone must be placed with precision.',
        reach: 'stone',
        difficulty: BF_SENIOR_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Fortifications complete. The city is safer.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'Construction issues. The work needs reinforcement.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 5.0,
  },

  {
    id: 'bf.senior.master_craft',
    name: 'Master Craft Challenge',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.senior.master_craft.1',
        name: 'Select the Medium',
        narrative: 'The fellowship issues a crafting challenge. Choose your material and concept.',
        reach: 'stone',
        difficulty: BF_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'A bold concept. The judges are intrigued.' },
        onFailure: { narrative: 'Uninspired choice. You start at a disadvantage.' },
      },
      {
        id: 'bf.senior.master_craft.2',
        name: 'Create the Masterwork',
        narrative: 'Three days to produce your finest piece. Everything you know goes into it.',
        reach: 'stone',
        difficulty: BF_SENIOR_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'A masterwork created. The fellowship speaks your name with respect.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
          },
        },
        onFailure: { narrative: 'Good work but not great. The competition is fierce.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 5.0,
  },

  // ── Elite Quests (Master Builder+) ────────────────────────────

  {
    id: 'bf.elite.grand_monument',
    name: 'Raise a Grand Monument',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'bf.elite.grand_monument.1',
        name: 'Design the Vision',
        narrative: 'The city commissions a monument. Create something that will endure centuries.',
        reach: 'stone',
        difficulty: BF_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'A breathtaking design. The council approves unanimously.' },
        onFailure: { narrative: 'The design is ambitious but flawed. Revisions needed.' },
      },
      {
        id: 'bf.elite.grand_monument.2',
        name: 'Source Rare Materials',
        narrative: 'The monument requires materials not found locally. Arrange procurement.',
        reach: 'gold',
        difficulty: BF_ELITE_BASE + BF_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Rare stone and metal secured. The work can proceed.' },
        onFailure: { narrative: 'Supply shortages. Substitutions weaken the vision.' },
      },
      {
        id: 'bf.elite.grand_monument.3',
        name: 'Complete the Monument',
        narrative: 'Months of work culminate in the final placement. Your legacy in stone.',
        reach: 'stone',
        difficulty: BF_ELITE_BASE + BF_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The monument stands. A masterpiece for the ages.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
          },
        },
        onFailure: { narrative: 'Structural compromise. The monument is lesser than envisioned.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 8.0,
  },

  {
    id: 'bf.elite.engineer_wonder',
    name: 'Engineer a Wonder',
    locationTypes: ['capital'],
    steps: [
      {
        id: 'bf.elite.engineer_wonder.1',
        name: 'Conceive the Impossible',
        narrative: 'The Grand Architect challenges you: build something never built before.',
        reach: 'eye',
        difficulty: BF_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'An innovation that defies conventional wisdom. It could work.' },
        onFailure: { narrative: 'Too conventional. The Grand Architect is unimpressed.' },
      },
      {
        id: 'bf.elite.engineer_wonder.2',
        name: 'Solve the Engineering',
        narrative: 'Theory must become practice. Solve the impossible problems.',
        reach: 'stone',
        difficulty: BF_ELITE_BASE + BF_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'Every calculation checks out. It will stand.' },
        onFailure: { narrative: 'A fundamental flaw. The wonder cannot be built as designed.' },
      },
      {
        id: 'bf.elite.engineer_wonder.3',
        name: 'Build the Wonder',
        narrative: 'Command an army of builders. Raise the impossible.',
        reach: 'stone',
        difficulty: BF_ELITE_BASE + BF_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'A wonder of the world stands where none stood before.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.10, condition: 0.30, bestowed_power: 0.60 },
          },
        },
        onFailure: { narrative: 'The wonder collapses during construction. A costly failure.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'bf.social.workshop_tour',
    name: 'Workshop Tour',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.social.workshop_tour.1',
        name: 'Tour the Workshop',
        narrative: 'Visit a master\'s workshop. Study their techniques and tools.',
        reach: 'stone',
        difficulty: BF_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'New techniques observed. Your craft improves.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        onFailure: { narrative: 'The master is busy. A brief tour only.' },
      },
    ],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
  },

  {
    id: 'bf.social.guild_feast',
    name: 'Guild Feast',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.social.guild_feast.1',
        name: 'Attend the Feast',
        narrative: 'The fellowship gathers to celebrate a completed project. Eat and socialize.',
        reach: 'heart',
        difficulty: BF_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Good food and better company. Connections strengthened.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: { narrative: 'You arrive late. The best seats and conversation are taken.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
  },

  {
    id: 'bf.social.material_trade',
    name: 'Material Trading',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'bf.social.material_trade.1',
        name: 'Trade Materials',
        narrative: 'Fellowship members exchange surplus materials. Find what you need.',
        reach: 'gold',
        difficulty: BF_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Good trade. Rare materials acquired at fair prices.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        onFailure: { narrative: 'Nothing you need is available today.' },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const BF_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'bf.join',
  name: 'Apply to the Fellowship',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'bf.join.1',
      name: 'Craft Test',
      narrative: 'The fellowship tests your basic skill. Build something from raw materials.',
      reach: 'stone',
      difficulty: BF_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Acceptable work. Welcome, apprentice.' },
      onFailure: { narrative: 'Clumsy hands. Practice more and return.' },
    },
  ],
  reachPrimary: 'stone',
  reachSecondary: 'gold',
  encounterType: 'build',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
  questPriority: 6.0,
};

export const BF_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'bf.promotion',
  name: 'Fellowship Advancement',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'bf.promotion.1',
      name: 'Present Your Work',
      narrative: 'Advancement requires a portfolio review. Present your best pieces.',
      reach: 'stone',
      difficulty: BF_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'The masters approve. Higher rank earned through craft.' },
      onFailure: { narrative: 'Not yet at the required level. Continue practicing.' },
    },
  ],
  reachPrimary: 'stone',
  reachSecondary: 'gold',
  encounterType: 'create',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
  questPriority: 7.0,
};

export const BF_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  BF_JOIN_TEMPLATE,
  BF_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a builders fellowship encounter template by ID.
 */
export function getBuildersFellowshipEncounterById(id: string): EncounterTemplate | undefined {
  return BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? BF_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES.find(t => t.id === id);
}
