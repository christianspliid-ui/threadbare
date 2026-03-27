/**
 * Faction Encounter Content — Adventuring Guild quest templates.
 *
 * 10 quest templates across 4 tiers (standard, senior, elite, leadership).
 * Each template follows standard EncounterTemplate shape with additional
 * FactionEncounterMeta for faction-specific behavior (reputation rewards,
 * rank gating, quest type).
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 2
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const FACTION_DIFFICULTY_BASE = 25;
const FACTION_DIFFICULTY_STEP = 10;
const FACTION_SENIOR_BASE = 35;
const FACTION_ELITE_BASE = 45;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

/**
 * Maps template ID → faction-specific metadata.
 * Keyed separately from the template so EncounterTemplate stays standard.
 */
export const FACTION_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['ag.quest.ruin_delve', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.04, questType: 'standard' }],
  ['ag.quest.monster_hunt', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.04, questType: 'standard' }],
  ['ag.quest.wilderness_survey', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.04, questType: 'standard' }],
  ['ag.quest.escort_caravan', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.04, questType: 'standard' }],
  ['ag.quest.recover_artifact', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.05, questType: 'standard' }],
  ['ag.senior.deep_expedition', { factionDefId: 'adventuring_guild', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['ag.senior.bounty_hunt', { factionDefId: 'adventuring_guild', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['ag.senior.map_uncharted', { factionDefId: 'adventuring_guild', minRank: 'sergeant', reputationReward: 0.05, questType: 'senior' }],
  ['ag.elite.dragon_lair', { factionDefId: 'adventuring_guild', minRank: 'lieutenant', reputationReward: 0.08, questType: 'elite' }],
  ['ag.elite.lost_city', { factionDefId: 'adventuring_guild', minRank: 'lieutenant', reputationReward: 0.08, questType: 'elite' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const FACTION_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Journeyman+) ──────────────────────────────────

  {
    id: 'ag.quest.ruin_delve',
    name: 'Delve into Ruins',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.quest.ruin_delve.1',
        name: 'Prepare for the Descent',
        narrative: 'The guild board lists a ruin site that needs clearing. You gather supplies and study the entry.',
        reach: 'eye',
        difficulty: FACTION_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Your research reveals a promising entry point.' },
        onFailure: { narrative: 'The ruins prove harder to locate than expected.' },
      },
      {
        id: 'ag.quest.ruin_delve.2',
        name: 'Breach the Threshold',
        narrative: 'The entrance yawns before you, dust and danger in equal measure.',
        reach: 'iron',
        difficulty: FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'You push through crumbling passages into the heart of the ruin.', tierPromotionEligible: true },
        onFailure: { narrative: 'A collapse forces you to retreat. The ruin keeps its secrets.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 3.0,
  },

  {
    id: 'ag.quest.monster_hunt',
    name: 'Hunt the Beast',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.quest.monster_hunt.1',
        name: 'Track the Quarry',
        narrative: 'Reports of a dangerous beast. The guild needs it dealt with.',
        reach: 'eye',
        difficulty: FACTION_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Tracks lead deep into the wilds. The beast is close.' },
        onFailure: { narrative: 'The trail goes cold in rough terrain.' },
      },
      {
        id: 'ag.quest.monster_hunt.2',
        name: 'Confront the Beast',
        narrative: 'The creature emerges from its lair, fangs bared.',
        reach: 'iron',
        difficulty: FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Steel meets hide. The beast falls.', tierPromotionEligible: true },
        onFailure: { narrative: 'The beast proves too fierce. A tactical retreat is the wiser course.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'ag.quest.wilderness_survey',
    name: 'Survey the Wilds',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.quest.wilderness_survey.1',
        name: 'Chart the Terrain',
        narrative: 'The guild needs maps of uncharted territory beyond the settlement.',
        reach: 'eye',
        difficulty: FACTION_DIFFICULTY_BASE - 5,
        duration: 2,
        onSuccess: { narrative: 'Your keen eye captures the landscape in careful detail.' },
        onFailure: { narrative: 'Fog and rain obscure your observations.' },
      },
      {
        id: 'ag.quest.wilderness_survey.2',
        name: 'Document Findings',
        narrative: 'Return to the guild hall with your survey notes.',
        reach: 'eye',
        difficulty: FACTION_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'The cartographer accepts your work with approval.', tierPromotionEligible: true },
        onFailure: { narrative: 'Your notes are incomplete. The cartographer is disappointed.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'flesh',
    encounterType: 'explore',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 2.0,
  },

  {
    id: 'ag.quest.escort_caravan',
    name: 'Guard the Caravan',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.quest.escort_caravan.1',
        name: 'Join the Escort',
        narrative: 'A merchant caravan needs guards for a dangerous leg of their journey.',
        reach: 'heart',
        difficulty: FACTION_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: { narrative: 'The merchants welcome your sword arm.' },
        onFailure: { narrative: 'The caravan departed before you arrived.' },
      },
      {
        id: 'ag.quest.escort_caravan.2',
        name: 'Defend Against Ambush',
        narrative: 'Bandits strike at a narrow pass. The caravan depends on you.',
        reach: 'iron',
        difficulty: FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'The bandits scatter before your resolve. The merchants are grateful.', tierPromotionEligible: true },
        onFailure: { narrative: 'The bandits seize several crates. The merchants are displeased.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 2.5,
  },

  {
    id: 'ag.quest.recover_artifact',
    name: 'Recover Lost Artifact',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.quest.recover_artifact.1',
        name: 'Research the Location',
        narrative: 'A guild patron reports a family heirloom lost in dangerous territory.',
        reach: 'eye',
        difficulty: FACTION_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Old records point to a likely hiding place.' },
        onFailure: { narrative: 'The records are contradictory. Multiple sites are possible.' },
      },
      {
        id: 'ag.quest.recover_artifact.2',
        name: 'Navigate the Dangers',
        narrative: 'The path to the artifact is fraught with peril.',
        reach: 'shadow',
        difficulty: FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'You slip past the dangers and find the resting place.' },
        onFailure: { narrative: 'A trap springs. You escape with your life but not the prize.' },
      },
      {
        id: 'ag.quest.recover_artifact.3',
        name: 'Secure the Prize',
        narrative: 'The artifact lies within reach — but something guards it.',
        reach: 'iron',
        difficulty: FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: { narrative: 'The guardian falls. The artifact is recovered.', tierPromotionEligible: true },
        onFailure: { narrative: 'The guardian proves too strong. You retreat empty-handed.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    questPriority: 4.0,
  },

  // ── Senior Quests (Sergeant+) ──────────────────────────────────────

  {
    id: 'ag.senior.deep_expedition',
    name: 'Lead Deep Expedition',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.senior.deep_expedition.1',
        name: 'Assemble the Team',
        narrative: 'The guild entrusts you with leading an expedition into uncharted depths.',
        reach: 'heart',
        difficulty: FACTION_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'A capable team rallies to your banner.' },
        onFailure: { narrative: 'Few volunteers step forward. The expedition is undermanned.' },
      },
      {
        id: 'ag.senior.deep_expedition.2',
        name: 'Descend into the Deep',
        narrative: 'The tunnels narrow. Light fails. Only courage pushes forward.',
        reach: 'iron',
        difficulty: FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'Your leadership holds the team together through the worst of it.' },
        onFailure: { narrative: 'Morale breaks. The team refuses to go deeper.' },
      },
      {
        id: 'ag.senior.deep_expedition.3',
        name: 'Claim the Discovery',
        narrative: 'At the bottom of the deep, something remarkable awaits.',
        reach: 'eye',
        difficulty: FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: { narrative: 'A discovery that will echo in guild records for years.', tierPromotionEligible: true },
        onFailure: { narrative: 'The deep yields nothing. The expedition is a costly failure.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 5.0,
  },

  {
    id: 'ag.senior.bounty_hunt',
    name: 'Track Dangerous Quarry',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.senior.bounty_hunt.1',
        name: 'Study the Mark',
        narrative: 'A dangerous fugitive has evaded lesser hunters. The guild calls on its sergeants.',
        reach: 'shadow',
        difficulty: FACTION_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'You piece together the mark\'s pattern. A trap forms in your mind.' },
        onFailure: { narrative: 'The mark is clever. Their trail is full of false leads.' },
      },
      {
        id: 'ag.senior.bounty_hunt.2',
        name: 'Corner the Quarry',
        narrative: 'The hunt reaches its climax. No more running.',
        reach: 'iron',
        difficulty: FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP * 2,
        duration: 4,
        onSuccess: { narrative: 'The quarry is brought to justice. The guild\'s reputation soars.', tierPromotionEligible: true },
        onFailure: { narrative: 'The quarry slips away again. The bounty remains uncollected.' },
      },
    ],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
  },

  {
    id: 'ag.senior.map_uncharted',
    name: 'Map Uncharted Territory',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.senior.map_uncharted.1',
        name: 'Venture Beyond Known Lands',
        narrative: 'The guild\'s maps end here. What lies beyond is your commission.',
        reach: 'eye',
        difficulty: FACTION_SENIOR_BASE,
        duration: 3,
        onSuccess: { narrative: 'New terrain unfolds before you. Your charcoal flies across parchment.' },
        onFailure: { narrative: 'The terrain is hostile and featureless. Your maps are sparse.' },
      },
      {
        id: 'ag.senior.map_uncharted.2',
        name: 'Complete the Survey',
        narrative: 'The full circuit must be walked. Every hill, every stream, every danger.',
        reach: 'flesh',
        difficulty: FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'A complete and accurate survey. The cartographers will be pleased.', tierPromotionEligible: true },
        onFailure: { narrative: 'Gaps remain in the survey. Enough for partial credit, no more.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'flesh',
    encounterType: 'create',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    questPriority: 4.0,
  },

  // ── Elite Quests (Lieutenant+) ─────────────────────────────────────

  {
    id: 'ag.elite.dragon_lair',
    name: 'Breach the Dragon\'s Lair',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.elite.dragon_lair.1',
        name: 'Scout the Approach',
        narrative: 'A dragon\'s lair has been located in the mountains. The guild sends its best.',
        reach: 'eye',
        difficulty: FACTION_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'You identify a path through the dragon\'s defenses.' },
        onFailure: { narrative: 'The approach is treacherous. Your scouts report heavy losses.' },
      },
      {
        id: 'ag.elite.dragon_lair.2',
        name: 'Enter the Lair',
        narrative: 'Heat and sulfur. The ground trembles with each breath of the sleeping beast.',
        reach: 'iron',
        difficulty: FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP,
        duration: 4,
        onSuccess: { narrative: 'You navigate the lair\'s hazards with skill born of experience.' },
        onFailure: { narrative: 'A partial cave-in cuts off your retreat. You barely escape.' },
      },
      {
        id: 'ag.elite.dragon_lair.3',
        name: 'Face the Dragon',
        narrative: 'The beast awakens. There is no retreat now.',
        reach: 'stone',
        difficulty: FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP * 3,
        duration: 3,
        onSuccess: { narrative: 'Against all odds, the dragon yields. A legend is born.', tierPromotionEligible: true },
        onFailure: { narrative: 'The dragon\'s fury is beyond mortal reckoning. You flee with your life.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 8.0,
  },

  {
    id: 'ag.elite.lost_city',
    name: 'Expedition to Lost City',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'ag.elite.lost_city.1',
        name: 'Decipher the Route',
        narrative: 'Ancient texts hint at a city swallowed by the wilds. The guild commissions its recovery.',
        reach: 'eye',
        difficulty: FACTION_ELITE_BASE,
        duration: 3,
        onSuccess: { narrative: 'The old maps align. A route crystallizes.' },
        onFailure: { narrative: 'The texts are too damaged. Key passages remain illegible.' },
      },
      {
        id: 'ag.elite.lost_city.2',
        name: 'Navigate the Wilds',
        narrative: 'Weeks of travel through untamed wilderness, following half-remembered paths.',
        reach: 'flesh',
        difficulty: FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP,
        duration: 4,
        onSuccess: { narrative: 'Your expedition endures the wilds. The city\'s outline appears on the horizon.' },
        onFailure: { narrative: 'Disease and exhaustion thin your ranks. The expedition falters.' },
      },
      {
        id: 'ag.elite.lost_city.3',
        name: 'Explore the Ruins',
        narrative: 'The lost city stands in crumbling grandeur. What secrets does it hold?',
        reach: 'shadow',
        difficulty: FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP * 2,
        duration: 5,
        onSuccess: { narrative: 'The city yields treasures and knowledge beyond imagining.', tierPromotionEligible: true },
        onFailure: { narrative: 'Ancient guardians drive you from the inner sanctum. So close, yet so far.' },
      },
    ],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    questPriority: 8.0,
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────

/**
 * Look up a faction encounter template by ID.
 */
export function getFactionEncounterById(id: string): EncounterTemplate | undefined {
  return FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all faction template IDs for a given definition.
 */
export function getFactionTemplateIds(factionDefId: string): string[] {
  return [...FACTION_ENCOUNTER_META.entries()]
    .filter(([, meta]) => meta.factionDefId === factionDefId)
    .map(([id]) => id);
}
