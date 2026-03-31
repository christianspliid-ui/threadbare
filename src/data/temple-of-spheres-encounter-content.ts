/**
 * Temple of Spheres Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the temple of spheres.
 * Follows the same pattern as faction-encounter-content.ts.
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const TS_DIFFICULTY_BASE = 25;
const TS_DIFFICULTY_STEP = 10;
const TS_SENIOR_BASE = 40;
const TS_ELITE_BASE = 55;
const TS_JOIN_DIFFICULTY = 20;
const TS_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const TEMPLE_OF_SPHERES_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['ts.join', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.0, questType: 'standard' }],
  ['ts.promotion', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['ts.quest.tend_shrine', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.heal_the_sick', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.meditate_on_spheres', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.consecrate_ground', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.05, questType: 'standard' }],
  ['ts.quest.copy_scriptures', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['ts.senior.sphere_communion', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  ['ts.senior.banish_corruption', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  ['ts.senior.craft_relic', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['ts.elite.sphere_convergence', { factionDefId: 'temple_of_spheres', minRank: 'pontifex', reputationReward: 0.08, questType: 'elite' }],
  ['ts.elite.found_cathedral', { factionDefId: 'temple_of_spheres', minRank: 'pontifex', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['ts.social.evening_prayer', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
  ['ts.social.alms_giving', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
  ['ts.social.theological_debate', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Acolyte+) ──────────────────────────────────

  {
    id: 'ts.quest.tend_shrine',
    name: 'Tend the Shrine',
    locationTypes: ['town', 'city', 'capital', 'temple', 'shrine'],
    steps: [
      {
        id: 'ts.quest.tend_shrine.1',
        name: 'Clean the Sacred Space',
        narrative: 'The shrine needs care. Sweep, polish, and arrange the offerings.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The shrine gleams. Visitors remark on its beauty.' },
        onFailure: { narrative: 'A clumsy moment. An offering vessel cracks.' },
      },
      {
        id: 'ts.quest.tend_shrine.2',
        name: 'Lead the Devotions',
        narrative: 'Pilgrims arrive. Guide them in proper observance.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The devotions bring peace. The faithful leave renewed.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'You stumble over the words. The pilgrims leave unmoved.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  {
    id: 'ts.quest.heal_the_sick',
    name: 'Heal the Sick',
    locationTypes: ['town', 'city', 'capital', 'temple'],
    steps: [
      {
        id: 'ts.quest.heal_the_sick.1',
        name: 'Diagnose the Affliction',
        narrative: 'A sick villager is brought to the temple. Determine the cause.',
        reach: 'eye',
        difficulty: TS_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'The illness is identified. Treatment can begin.' },
        onFailure: { narrative: 'The symptoms are unclear. More observation needed.' },
      },
      {
        id: 'ts.quest.heal_the_sick.2',
        name: 'Channel Healing',
        narrative: 'Draw upon the spheres to mend what is broken.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The sickness fades. The grateful family praises the temple.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The healing falters. The patient rests but does not improve.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 3.0,
  },

  {
    id: 'ts.quest.meditate_on_spheres',
    name: 'Meditate on the Spheres',
    locationTypes: ['temple', 'shrine'],
    steps: [
      {
        id: 'ts.quest.meditate_on_spheres.1',
        name: 'Enter the Meditation Chamber',
        narrative: 'The inner sanctum awaits. Quiet the mind and open to the spheres.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE + 5,
        duration: 3,
        onSuccess: { narrative: 'Visions of cosmic alignment flood your awareness.' },
        onFailure: { narrative: 'The mind wanders. Only silence greets you.' },
      },
      {
        id: 'ts.quest.meditate_on_spheres.2',
        name: 'Record the Vision',
        narrative: 'Transcribe what was seen before it fades from memory.',
        reach: 'eye',
        difficulty: TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP + 5,
        duration: 1,
        onSuccess: {
          narrative: 'The vision is preserved. The temple archives gain a new entry.',
          tierPromotionEligible: true,
        },
        onFailure: { narrative: 'The details blur. Only fragments remain on the page.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 3.0,
  },

  {
    id: 'ts.quest.consecrate_ground',
    name: 'Consecrate Holy Ground',
    locationTypes: ['town', 'city', 'shrine'],
    steps: [
      {
        id: 'ts.quest.consecrate_ground.1',
        name: 'Prepare the Ritual',
        narrative: 'A new shrine site must be blessed. Gather the components and align the markers.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE + 5,
        duration: 2,
        onSuccess: { narrative: 'The ritual components are ready. The alignment is true.' },
        onFailure: { narrative: 'A component is flawed. The ritual cannot proceed as planned.' },
      },
      {
        id: 'ts.quest.consecrate_ground.2',
        name: 'Perform the Consecration',
        narrative: 'Invoke the spheres. Channel their blessing into the earth.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'The ground hums with resonance. A sacred site is born.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The ritual fizzles. The ground remains mundane.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 3.0,
  },

  {
    id: 'ts.quest.copy_scriptures',
    name: 'Copy the Scriptures',
    locationTypes: ['city', 'capital', 'temple'],
    steps: [
      {
        id: 'ts.quest.copy_scriptures.1',
        name: 'Prepare the Materials',
        narrative: 'Fine vellum and special ink are needed for sacred texts.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Quality materials prepared. The work can begin.' },
        onFailure: { narrative: 'Substandard ink. The copy will not endure.' },
      },
      {
        id: 'ts.quest.copy_scriptures.2',
        name: 'Transcribe with Care',
        narrative: 'Every word matters. Copy the sacred texts without error.',
        reach: 'eye',
        difficulty: TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'A perfect copy. The temple library is enriched.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'Errors in the transcription. The copy must be started over.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 3.0,
  },

  // ── Senior Quests (High Priest+) ─────────────────────────────────

  {
    id: 'ts.senior.sphere_communion',
    name: 'Sphere Communion',
    locationTypes: ['temple', 'shrine'],
    steps: [
      {
        id: 'ts.senior.sphere_communion.1',
        name: 'Prepare the Alignment',
        narrative: 'A rare celestial alignment approaches. The temple must be ready.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The temple resonates with the alignment. Communion is possible.' },
        onFailure: { narrative: 'The alignment passes without contact. The window closes.' },
      },
      {
        id: 'ts.senior.sphere_communion.2',
        name: 'Channel the Spheres',
        narrative: 'Open yourself to the cosmic energies. Let the spheres speak.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE + TS_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The spheres respond. Wisdom flows like starlight.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The energies overwhelm you. You collapse, drained but alive.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 5.0,
  },

  {
    id: 'ts.senior.banish_corruption',
    name: 'Banish Corruption',
    locationTypes: ['town', 'city', 'temple', 'shrine'],
    steps: [
      {
        id: 'ts.senior.banish_corruption.1',
        name: 'Identify the Source',
        narrative: 'Something taints the local shrine. Find what corrupts it.',
        reach: 'eye',
        difficulty: TS_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'The corruption is traced to a buried artifact.' },
        onFailure: { narrative: 'The source remains hidden. The taint spreads.' },
      },
      {
        id: 'ts.senior.banish_corruption.2',
        name: 'Purify the Site',
        narrative: 'Channel the spheres to cleanse what has been defiled.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE + TS_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The corruption burns away. The shrine is pure once more.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The corruption resists. A deeper ritual is needed.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 5.0,
  },

  {
    id: 'ts.senior.craft_relic',
    name: 'Craft a Holy Relic',
    locationTypes: ['city', 'capital', 'temple'],
    steps: [
      {
        id: 'ts.senior.craft_relic.1',
        name: 'Gather Sacred Materials',
        narrative: 'A relic requires components touched by the spheres.',
        reach: 'heart',
        difficulty: TS_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Sphere-touched components assembled. The crafting can begin.' },
        onFailure: { narrative: 'The materials lack resonance. Unsuitable for a relic.' },
      },
      {
        id: 'ts.senior.craft_relic.2',
        name: 'Imbue with Power',
        narrative: 'Shape the materials while channeling sphere energy into the form.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE + TS_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The relic pulses with inner light. A sacred object is born.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The power dissipates. The object remains mundane.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 5.0,
  },

  // ── Elite Quests (Pontifex+) ────────────────────────────────────

  {
    id: 'ts.elite.sphere_convergence',
    name: 'Sphere Convergence Ritual',
    locationTypes: ['capital', 'temple'],
    steps: [
      {
        id: 'ts.elite.sphere_convergence.1',
        name: 'Gather the Clergy',
        narrative: 'The greatest ritual requires the temple\'s finest minds.',
        reach: 'heart',
        difficulty: TS_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'The inner circle assembles. Their faith is strong.' },
        onFailure: { narrative: 'Key clergy are absent. The circle is incomplete.' },
      },
      {
        id: 'ts.elite.sphere_convergence.2',
        name: 'Align the Spheres',
        narrative: 'Guide the ritual through complex celestial alignments.',
        reach: 'star',
        difficulty: TS_ELITE_BASE + TS_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The spheres align. Reality shimmers at the edges.' },
        onFailure: { narrative: 'The alignment slips. Energies scatter dangerously.' },
      },
      {
        id: 'ts.elite.sphere_convergence.3',
        name: 'Channel the Convergence',
        narrative: 'All spheres touch this point. Channel their combined power.',
        reach: 'star',
        difficulty: TS_ELITE_BASE + TS_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The convergence succeeds. The temple is forever changed.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.20, bestowed_power: 0.60 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The energies rebound. The clergy is shaken but survives.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 8.0,
  },

  {
    id: 'ts.elite.found_cathedral',
    name: 'Found a Cathedral',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'ts.elite.found_cathedral.1',
        name: 'Choose the Site',
        narrative: 'A great cathedral needs the right location. Survey the candidates.',
        reach: 'eye',
        difficulty: TS_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'A site of natural resonance found. Perfect for a cathedral.' },
        onFailure: { narrative: 'No site meets the requirements. Compromises must be made.' },
      },
      {
        id: 'ts.elite.found_cathedral.2',
        name: 'Organize the Construction',
        narrative: 'Coordinate builders, stonemasons, and artisans for the great work.',
        reach: 'heart',
        difficulty: TS_ELITE_BASE + TS_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The foundation is laid. Construction proceeds on schedule.' },
        onFailure: { narrative: 'Labor disputes and material shortages slow the work.' },
      },
      {
        id: 'ts.elite.found_cathedral.3',
        name: 'Consecrate the Cathedral',
        narrative: 'The structure is complete. Perform the grand consecration.',
        reach: 'star',
        difficulty: TS_ELITE_BASE + TS_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The cathedral shines with sphere-light. A beacon of faith.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#star'],
          },
        },
        onFailure: {
          narrative: 'The consecration is incomplete. The building stands but lacks blessing.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
          },
        },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 8.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'ts.social.evening_prayer',
    name: 'Evening Prayer Circle',
    locationTypes: ['town', 'city', 'capital', 'temple', 'shrine'],
    steps: [
      {
        id: 'ts.social.evening_prayer.1',
        name: 'Lead the Prayers',
        narrative: 'The faithful gather at dusk. Guide them in devotion.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Your words bring comfort. The community is strengthened.',
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
            tagFilters: ['#star'],
          },
        },
        onFailure: { narrative: 'Your voice falters. The prayers feel hollow tonight.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'ts.social.alms_giving',
    name: 'Give Alms to the Poor',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ts.social.alms_giving.1',
        name: 'Distribute the Offerings',
        narrative: 'The temple shares its surplus with those in need.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: {
          narrative: 'Grateful faces. The temple\'s reputation grows among the common folk.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: { narrative: 'Not enough to go around. Some leave empty-handed and bitter.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'ts.social.theological_debate',
    name: 'Theological Debate',
    locationTypes: ['city', 'capital', 'temple'],
    steps: [
      {
        id: 'ts.social.theological_debate.1',
        name: 'Present Your Thesis',
        narrative: 'Scholars of the spheres debate matters of doctrine.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'Your argument carries weight. Fellow clergy take note.',
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#star'],
          },
        },
        onFailure: { narrative: 'Your reasoning has gaps. The senior clergy remain unconvinced.' },
      },
    ],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const TS_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'ts.join',
  name: 'Join the Temple of Spheres',
  locationTypes: ['town', 'city', 'capital', 'temple', 'shrine'],
  steps: [
    {
      id: 'ts.join.1',
      name: 'The Initiation Rite',
      narrative: 'The temple tests your connection to the spheres. Open yourself to their light.',
      reach: 'star',
      difficulty: TS_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'The spheres respond to your presence. You are welcomed as acolyte.' },
      onFailure: { narrative: 'The light does not answer. Perhaps in time.' },
    },
  ],
  reachPrimary: 'star',
  reachSecondary: 'heart',
  encounterType: 'assist',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  questPriority: 6.0,
};

export const TS_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'ts.promotion',
  name: 'Temple Advancement',
  locationTypes: ['city', 'capital', 'temple'],
  steps: [
    {
      id: 'ts.promotion.1',
      name: 'The Trial of Faith',
      narrative: 'Higher rank demands deeper communion. The pontifex tests your devotion.',
      reach: 'star',
      difficulty: TS_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Your faith shines. The new vestments are placed upon your shoulders.' },
      onFailure: { narrative: 'The trial reveals doubt. Continue your studies.' },
    },
  ],
  reachPrimary: 'star',
  reachSecondary: 'heart',
  encounterType: 'assist',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  questPriority: 7.0,
};

export const TS_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  TS_JOIN_TEMPLATE,
  TS_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a temple of spheres encounter template by ID.
 */
export function getTempleOfSpheresEncounterById(id: string): EncounterTemplate | undefined {
  return TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? TS_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES.find(t => t.id === id);
}
