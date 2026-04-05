/**
 * Arcane Circle Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the arcane circle.
 * Follows the same pattern as faction-encounter-content.ts.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const AC_DIFFICULTY_BASE = 30;
const AC_DIFFICULTY_STEP = 10;
const AC_SENIOR_BASE = 45;
const AC_ELITE_BASE = 60;
const AC_JOIN_DIFFICULTY = 25;
const AC_PROMOTION_DIFFICULTY = 40;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const ARCANE_CIRCLE_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['ac.join', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['ac.promotion', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['ac.quest.ley_survey', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.reagent_gather', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.ward_inspection', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.translate_tome', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['ac.quest.anomaly_report', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['ac.senior.planar_probe', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  ['ac.senior.enchant_artifact', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  ['ac.senior.ruin_expedition', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['ac.elite.arcane_thesis', { factionDefId: 'arcane_circle', minRank: 'archmage', reputationReward: 0.08, questType: 'elite' }],
  ['ac.elite.seal_the_breach', { factionDefId: 'arcane_circle', minRank: 'archmage', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['ac.social.lecture_hall', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['ac.social.spell_exchange', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['ac.social.library_browse', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const ARCANE_CIRCLE_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Apprentice+) ──────────────────────────────────

  {
    id: 'ac.quest.ley_survey',
    name: 'Ley Line Survey',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.quest.ley_survey.1',
        name: 'Attune the Instruments',
        narrative: 'The circle needs updated ley line readings. Calibrate your detection tools.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The instruments hum with resonance. Readings begin.' },
        onFailure: { narrative: 'Calibration drifts. The readings are unreliable.' },
      },
      {
        id: 'ac.quest.ley_survey.2',
        name: 'Map the Currents',
        narrative: 'Walk the survey route and record the ley line strengths.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'A detailed ley map produced. The circle updates its charts.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'Interference corrupts the data. An incomplete map at best.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'ac.quest.reagent_gather',
    name: 'Gather Arcane Reagents',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.quest.reagent_gather.1',
        name: 'Identify the Components',
        narrative: 'The circle needs specific reagents. Consult the formulary.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'The required components are identified. Sources located.' },
        onFailure: { narrative: 'The formulary is unclear. Several substitutions may be needed.' },
      },
      {
        id: 'ac.quest.reagent_gather.2',
        name: 'Procure the Reagents',
        narrative: 'Visit suppliers and wilderness sites to collect what is needed.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'All reagents acquired. The circle\'s stores are replenished.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'Key reagents are unavailable. The supply remains short.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  {
    id: 'ac.quest.ward_inspection',
    name: 'Ward Inspection',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.quest.ward_inspection.1',
        name: 'Test the Wards',
        narrative: 'The circle\'s protective wards need regular inspection.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'Weak points identified. Reinforcement is straightforward.' },
        onFailure: { narrative: 'The wards are complex. Some sections remain untested.' },
      },
      {
        id: 'ac.quest.ward_inspection.2',
        name: 'Reinforce the Defenses',
        narrative: 'Strengthen the weakened sections of the ward matrix.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Wards restored to full strength. The tower is secure.',
          tierPromotionEligible: true,
        },
        onFailure: { narrative: 'Patches hold but the underlying structure is fragile.' },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'ac.quest.translate_tome',
    name: 'Translate an Ancient Tome',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.quest.translate_tome.1',
        name: 'Decipher the Script',
        narrative: 'An ancient text in a dead language. Begin the translation.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE + 5,
        duration: 3,
        onSuccess: { narrative: 'The script yields its secrets. The language is clear.' },
        onFailure: { narrative: 'The text resists interpretation. Key passages remain obscure.' },
      },
      {
        id: 'ac.quest.translate_tome.2',
        name: 'Interpret the Contents',
        narrative: 'Translate the arcane concepts into modern understanding.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'A complete translation. The circle gains lost knowledge.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The translation is partial. Critical sections remain unclear.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 3.0,
  },

  {
    id: 'ac.quest.anomaly_report',
    name: 'Investigate Arcane Anomaly',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.quest.anomaly_report.1',
        name: 'Observe the Disturbance',
        narrative: 'Something unusual is happening to the local magical field. Investigate.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The anomaly is catalogued. Its nature becomes clearer.' },
        onFailure: { narrative: 'The disturbance is erratic. No clear pattern emerges.' },
      },
      {
        id: 'ac.quest.anomaly_report.2',
        name: 'File the Report',
        narrative: 'Document findings for the circle\'s records.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: {
          narrative: 'Thorough documentation. The magister commends your work.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: {
          narrative: 'The report lacks rigor. More data is needed.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  // ── Senior Quests (Magister+) ─────────────────────────────────

  {
    id: 'ac.senior.planar_probe',
    name: 'Planar Probe',
    locationTypes: ['capital', 'tower'],
    steps: [
      {
        id: 'ac.senior.planar_probe.1',
        name: 'Prepare the Ritual Circle',
        narrative: 'Probing another plane requires precise geometry and stable power.',
        reach: 'veil',
        difficulty: AC_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The circle is drawn. Energies stabilize at the focal point.' },
        onFailure: { narrative: 'The geometry is flawed. Energies leak unpredictably.' },
      },
      {
        id: 'ac.senior.planar_probe.2',
        name: 'Send the Probe',
        narrative: 'Project your awareness across the planar boundary.',
        reach: 'veil',
        difficulty: AC_SENIOR_BASE + AC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Contact made. Data streams back from beyond the veil.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The probe destabilizes. Something noticed you.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  {
    id: 'ac.senior.enchant_artifact',
    name: 'Enchant an Artifact',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.senior.enchant_artifact.1',
        name: 'Prepare the Vessel',
        narrative: 'The base object must be purified and attuned before enchantment.',
        reach: 'veil',
        difficulty: AC_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The vessel resonates cleanly. Ready for enchantment.' },
        onFailure: { narrative: 'Impurities remain. The enchantment may be unstable.' },
      },
      {
        id: 'ac.senior.enchant_artifact.2',
        name: 'Weave the Enchantment',
        narrative: 'Layer spell patterns into the vessel. Precision is everything.',
        reach: 'veil',
        difficulty: AC_SENIOR_BASE + AC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The enchantment takes hold. A new magical artifact is created.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The patterns collapse. The vessel cracks from the strain.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 5.0,
  },

  {
    id: 'ac.senior.ruin_expedition',
    name: 'Arcane Ruin Expedition',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.senior.ruin_expedition.1',
        name: 'Research the Site',
        narrative: 'An ancient arcane site has been located. Study the historical records.',
        reach: 'eye',
        difficulty: AC_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The site\'s history and dangers are understood.' },
        onFailure: { narrative: 'Records are sparse. You go in partially blind.' },
      },
      {
        id: 'ac.senior.ruin_expedition.2',
        name: 'Explore the Ruins',
        narrative: 'Navigate ancient wards and collapsed corridors for lost knowledge.',
        reach: 'veil',
        difficulty: AC_SENIOR_BASE + AC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Lost formulae recovered. The circle\'s knowledge expands.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'Ancient defenses activate. You retreat with minor injuries.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  // ── Elite Quests (Archmage+) ────────────────────────────────────

  {
    id: 'ac.elite.arcane_thesis',
    name: 'Present the Grand Thesis',
    locationTypes: ['capital', 'tower'],
    steps: [
      {
        id: 'ac.elite.arcane_thesis.1',
        name: 'Complete the Research',
        narrative: 'Years of study converge. Finalize your groundbreaking thesis.',
        reach: 'eye',
        difficulty: AC_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'The research is complete. A new theory takes shape.' },
        onFailure: { narrative: 'Critical experiments fail to replicate. Doubt creeps in.' },
      },
      {
        id: 'ac.elite.arcane_thesis.2',
        name: 'Defend Before the Council',
        narrative: 'Present your thesis to the assembled archmages.',
        reach: 'veil',
        difficulty: AC_ELITE_BASE + AC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Your arguments withstand scrutiny. The council is intrigued.' },
        onFailure: { narrative: 'The archmages find flaws in your methodology.' },
      },
      {
        id: 'ac.elite.arcane_thesis.3',
        name: 'Demonstrate the Theory',
        narrative: 'Theory must become practice. Perform the definitive experiment.',
        reach: 'veil',
        difficulty: AC_ELITE_BASE + AC_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The demonstration is flawless. Arcane understanding advances.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The experiment spirals out of control. Contained, but embarrassing.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 8.0,
  },

  {
    id: 'ac.elite.seal_the_breach',
    name: 'Seal the Planar Breach',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.elite.seal_the_breach.1',
        name: 'Analyze the Breach',
        narrative: 'A tear between planes threatens the region. Understand its nature.',
        reach: 'eye',
        difficulty: AC_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'The breach is mapped. Its weak points are identified.' },
        onFailure: { narrative: 'The breach is unstable and difficult to read.' },
      },
      {
        id: 'ac.elite.seal_the_breach.2',
        name: 'Prepare the Seal',
        narrative: 'Construct the magical framework that will close the breach.',
        reach: 'veil',
        difficulty: AC_ELITE_BASE + AC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The sealing framework holds. Ready for the final push.' },
        onFailure: { narrative: 'The framework cracks. Things leak through.' },
      },
      {
        id: 'ac.elite.seal_the_breach.3',
        name: 'Close the Breach',
        narrative: 'Channel everything into sealing the tear. Failure is not an option.',
        reach: 'veil',
        difficulty: AC_ELITE_BASE + AC_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The breach snaps shut. Reality heals. The circle celebrates.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The breach narrows but holds. A partial victory at best.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const ARCANE_CIRCLE_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'ac.social.lecture_hall',
    name: 'Attend a Lecture',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.social.lecture_hall.1',
        name: 'Listen and Learn',
        narrative: 'A senior mage delivers a lecture on arcane theory. Pay attention.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Key insights absorbed. Your understanding deepens.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: { narrative: 'The lecture goes over your head. Perhaps next time.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'ac.social.spell_exchange',
    name: 'Spell Exchange',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.social.spell_exchange.1',
        name: 'Trade Formulae',
        narrative: 'Mages meet to share lesser spell formulae. Knowledge for knowledge.',
        reach: 'veil',
        difficulty: AC_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'A useful formula acquired. Your repertoire grows.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: { narrative: 'Nothing of value offered in return. No trade made.' },
      },
    ],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },

  {
    id: 'ac.social.library_browse',
    name: 'Browse the Library',
    locationTypes: ['city', 'capital', 'tower'],
    steps: [
      {
        id: 'ac.social.library_browse.1',
        name: 'Search the Stacks',
        narrative: 'The circle\'s library holds thousands of volumes. Find something useful.',
        reach: 'eye',
        difficulty: AC_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'A forgotten text catches your eye. Interesting reading ahead.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#eye'],
          },
        },
        onFailure: { narrative: 'Nothing new. The shelves hold only familiar titles.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const AC_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'ac.join',
  name: 'Join the Arcane Circle',
  locationTypes: ['city', 'capital', 'tower'],
  steps: [
    {
      id: 'ac.join.1',
      name: 'The Aptitude Test',
      narrative: 'The circle tests your magical sensitivity. Demonstrate your potential.',
      reach: 'veil',
      difficulty: AC_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Talent detected. The circle accepts you as apprentice.' },
      onFailure: { narrative: 'Insufficient aptitude. The circle turns you away.' },
    },
  ],
  reachPrimary: 'veil',
  reachSecondary: 'eye',
  encounterType: 'explore',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  questPriority: 6.0,
};

export const AC_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'ac.promotion',
  name: 'Arcane Advancement',
  locationTypes: ['city', 'capital', 'tower'],
  steps: [
    {
      id: 'ac.promotion.1',
      name: 'The Practical Examination',
      narrative: 'Higher rank requires demonstrated mastery. Perform the prescribed workings.',
      reach: 'veil',
      difficulty: AC_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Mastery confirmed. Your new rank is inscribed in the registry.' },
      onFailure: { narrative: 'The workings falter. Continue your studies.' },
    },
  ],
  reachPrimary: 'veil',
  reachSecondary: 'eye',
  encounterType: 'explore',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  questPriority: 7.0,
};

export const AC_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  AC_JOIN_TEMPLATE,
  AC_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up an arcane circle encounter template by ID.
 */
export function getArcaneCircleEncounterById(id: string): EncounterTemplate | undefined {
  return ARCANE_CIRCLE_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? AC_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? ARCANE_CIRCLE_SOCIAL_TEMPLATES.find(t => t.id === id);
}
