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
import {
  MERCENARY_ENCOUNTER_META,
  getMercenaryEncounterById,
} from './mercenary-encounter-content';

// ─── Constants ───────────────────────────────────────────────────────────

const FACTION_DIFFICULTY_BASE = 25;
const FACTION_DIFFICULTY_STEP = 10;
const FACTION_SENIOR_BASE = 35;
const FACTION_ELITE_BASE = 45;
const FACTION_JOIN_DIFFICULTY = 20;
const FACTION_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

/**
 * Maps template ID → faction-specific metadata.
 * Keyed separately from the template so EncounterTemplate stays standard.
 */
export const FACTION_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion (TB-061)
  ['ag.join', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.0, questType: 'standard' }],
  ['ag.promotion', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
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
  // Social encounters (TB-062)
  ['ag.social.sparring', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.02, questType: 'standard' }],
  ['ag.social.tavern_tales', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.02, questType: 'standard' }],
  ['ag.social.mentor', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.02, questType: 'standard' }],
  ['ag.social.bounty_plan', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.02, questType: 'standard' }],
  ['ag.social.share_maps', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.02, questType: 'standard' }],
  ['ag.social.rivalry', { factionDefId: 'adventuring_guild', minRank: 'journeyman', reputationReward: 0.03, questType: 'standard' }],
  // Mercenary Company (TB-073)
  ...MERCENARY_ENCOUNTER_META,
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

// ─── Join & Promotion Templates (TB-061) ────────────────────────────────

/**
 * Faction join encounter — appears at guild hall sublocations,
 * visible only to non-members (excludeIfMemberOf filter in questVisibility).
 */
export const FACTION_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'ag.join',
  name: 'Petition the Adventurers Guild',
  locationTypes: ['town', 'city', 'capital'],
  sublocationTypes: ['sublocation-type.guild-hall'],
  steps: [
    {
      id: 'ag.join.1',
      name: 'Present Yourself',
      narrative: 'The guild hall buzzes with activity. A clerk looks up from the ledger as you approach.',
      reach: 'heart',
      difficulty: FACTION_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'The clerk nods. "You look capable enough. Sign the charter."' },
      onFailure: { narrative: 'The clerk shakes their head. "Come back when you have something to show for yourself."' },
    },
    {
      id: 'ag.join.2',
      name: 'Sign the Charter',
      narrative: 'The guild charter lists the rights and obligations of membership. Your quill hovers.',
      reach: 'eye',
      difficulty: FACTION_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Your name joins the register. You are now a Journeyman of the Adventurers Guild.' },
      onFailure: { narrative: 'A veteran objects to your admission. The clerk withdraws the charter.' },
    },
  ],
  reachPrimary: 'heart',
  reachSecondary: 'eye',
  encounterType: 'hire',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
  questPriority: 6.0, // High priority — joining a faction is an important life event
};

/**
 * Faction promotion encounter — appears when reputation >= next tier threshold.
 * Partial success mechanic: roll within PROMOTION_PARTIAL_SUCCESS_MARGIN of threshold → promoted with complication.
 */
export const FACTION_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'ag.promotion',
  name: 'Guild Promotion Trial',
  locationTypes: ['town', 'city', 'capital'],
  sublocationTypes: ['sublocation-type.guild-hall'],
  steps: [
    {
      id: 'ag.promotion.1',
      name: 'The Trial Begins',
      narrative: 'The guild masters have summoned you. Your deeds speak well, but the trial must be passed.',
      reach: 'iron',
      difficulty: FACTION_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'Your blade and resolve impress the judges.' },
      onFailure: { narrative: 'The trial reveals gaps in your readiness. Not yet.' },
    },
    {
      id: 'ag.promotion.2',
      name: 'Prove Your Worth',
      narrative: 'A final test — not of skill alone, but of character.',
      reach: 'heart',
      difficulty: FACTION_PROMOTION_DIFFICULTY + FACTION_DIFFICULTY_STEP,
      duration: 2,
      onSuccess: { narrative: 'The guild masters rise. "You have earned this. Welcome to your new rank."', tierPromotionEligible: true },
      onFailure: { narrative: 'The masters confer in whispers. "Not this time. Continue to prove yourself."' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'heart',
  encounterType: 'lead',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  questPriority: 7.0, // Very high — promotion is a major milestone
};

// ─── Faction Social Templates (TB-062) ──────────────────────────────────

const FACTION_SOCIAL_DIFFICULTY_BASE = 25;
const FACTION_SOCIAL_DIFFICULTY_STEP = 10;

/**
 * 6 faction-scoped social encounters — only visible between agents
 * who share faction membership. These model guild camaraderie,
 * mentorship, competition, and shared purpose.
 */
export const FACTION_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  // 1. Sparring Match — iron/flesh, cooperative training
  {
    id: 'ag.social.sparring',
    name: 'Guild Sparring Match',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'iron',
    reachSecondary: 'flesh',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 2.0,
    steps: [
      {
        id: 'ag.social.sparring.1',
        name: 'Challenge a Guildmate',
        narrative: 'In the guild yard, practice blades are drawn. A fellow adventurer meets your eye and nods.',
        reach: 'iron',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Blades clash in a rhythm of give and take. Both fighters sharpen their edge.', reputationDelta: 0.03 },
        onFailure: { narrative: 'Your guard drops and a practice blade taps your shoulder. A lesson learned.', reputationDelta: -0.01 },
      },
      {
        id: 'ag.social.sparring.2',
        name: 'Test Your Mettle',
        narrative: 'The bout intensifies. Guild members gather to watch.',
        reach: 'flesh',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'A clean victory — both fighters bow, mutual respect deepened.', reputationDelta: 0.04, tierPromotionEligible: true },
        onFailure: { narrative: 'Exhaustion takes hold. The bout ends without a clear winner.', reputationDelta: -0.01 },
      },
    ],
  },

  // 2. Tavern Tales — heart/eye, sharing stories
  {
    id: 'ag.social.tavern_tales',
    name: 'Share Tavern Tales',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 1.5,
    steps: [
      {
        id: 'ag.social.tavern_tales.1',
        name: 'Buy a Round',
        narrative: 'The guild common room is warm and loud. A fellow adventurer waves you over.',
        reach: 'heart',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: { narrative: 'Drinks flow and tongues loosen. Stories of the road emerge.', reputationDelta: 0.03 },
        onFailure: { narrative: 'The conversation falters. Your companion seems preoccupied.', reputationDelta: -0.01 },
      },
      {
        id: 'ag.social.tavern_tales.2',
        name: 'Trade Stories',
        narrative: 'The tales grow taller with each telling. Useful details hide among the embellishments.',
        reach: 'eye',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'A nugget of genuine intelligence surfaces — a location, a weakness, a name.', reputationDelta: 0.04 },
        onFailure: { narrative: 'Nothing but tall tales tonight. Entertaining, but not useful.', reputationDelta: -0.01 },
      },
    ],
  },

  // 3. Mentor Session — eye/heart, knowledge transfer
  {
    id: 'ag.social.mentor',
    name: 'Guild Mentorship',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    questPriority: 2.5,
    steps: [
      {
        id: 'ag.social.mentor.1',
        name: 'Offer Guidance',
        narrative: 'A guildmate struggles with a technique. Experience has its obligations.',
        reach: 'eye',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'Your instruction lands. The student\'s form improves visibly.', reputationDelta: 0.04 },
        onFailure: { narrative: 'The lesson doesn\'t take. Perhaps a different approach is needed.', reputationDelta: -0.01 },
      },
      {
        id: 'ag.social.mentor.2',
        name: 'Forge Understanding',
        narrative: 'Knowledge passes between guild members — the living tradition of the adventurer\'s craft.',
        reach: 'heart',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'A bond of mentor and student forms. The guild grows stronger.', reputationDelta: 0.05, tierPromotionEligible: true },
        onFailure: { narrative: 'Frustration wins out. The session ends with both parties dissatisfied.', reputationDelta: -0.02 },
      },
    ],
  },

  // 4. Bounty Planning — shadow/iron, tactical coordination
  {
    id: 'ag.social.bounty_plan',
    name: 'Plan a Guild Bounty',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'lead',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 2.5,
    steps: [
      {
        id: 'ag.social.bounty_plan.1',
        name: 'Study the Board',
        narrative: 'The bounty board is thick with postings. A fellow guild member leans in to compare notes.',
        reach: 'shadow',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'Together you piece together a pattern the board alone doesn\'t show.', reputationDelta: 0.03 },
        onFailure: { narrative: 'The postings are contradictory. No clear plan emerges.', reputationDelta: -0.01 },
      },
      {
        id: 'ag.social.bounty_plan.2',
        name: 'Coordinate the Hunt',
        narrative: 'A plan takes shape — who approaches from where, who watches the escape routes.',
        reach: 'iron',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The plan is solid. Both guild members know their role for the hunt ahead.', reputationDelta: 0.05, tierPromotionEligible: true },
        onFailure: { narrative: 'Disagreement on tactics. The plan dissolves into argument.', reputationDelta: -0.02 },
      },
    ],
  },

  // 5. Share Maps — eye/gold, information exchange
  {
    id: 'ag.social.share_maps',
    name: 'Exchange Guild Intelligence',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 1.5,
    steps: [
      {
        id: 'ag.social.share_maps.1',
        name: 'Compare Notes',
        narrative: 'Two guild members spread their maps across a table, comparing routes and warnings.',
        reach: 'eye',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: { narrative: 'Gaps in each map are filled by the other. Both sets of notes improve.', reputationDelta: 0.03 },
        onFailure: { narrative: 'The maps cover different regions. Little overlap to exploit.', reputationDelta: 0.0 },
      },
      {
        id: 'ag.social.share_maps.2',
        name: 'Strike a Fair Trade',
        narrative: 'Good intelligence has value. The terms of exchange must satisfy both parties.',
        reach: 'gold',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: { narrative: 'A fair exchange — both adventurers leave better informed than they arrived.', reputationDelta: 0.04 },
        onFailure: { narrative: 'One party feels shortchanged. The exchange ends awkwardly.', reputationDelta: -0.02 },
      },
    ],
  },

  // 6. Guild Rivalry — iron/heart, competitive tension
  {
    id: 'ag.social.rivalry',
    name: 'Guild Rivalry',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
    steps: [
      {
        id: 'ag.social.rivalry.1',
        name: 'The Challenge',
        narrative: 'Tension simmers between guild members. A public challenge is issued — who is the better adventurer?',
        reach: 'iron',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        onSuccess: { narrative: 'Your demonstration of skill silences the doubters.', reputationDelta: 0.04 },
        onFailure: { narrative: 'Your rival\'s display outshines your own. The crowd murmurs.', reputationDelta: -0.03 },
      },
      {
        id: 'ag.social.rivalry.2',
        name: 'Settle the Score',
        narrative: 'The rivalry demands resolution. Only one can walk away with the guild\'s respect.',
        reach: 'heart',
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: { narrative: 'Grudging respect replaces hostility. The rivalry becomes a spur to excellence.', reputationDelta: 0.06, tierPromotionEligible: true },
        onFailure: { narrative: 'The rivalry festers. Both parties lose standing in the guild\'s eyes.', reputationDelta: -0.04 },
      },
    ],
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────

/** All faction lifecycle templates (join, promotion) — separate from quest templates. */
export const FACTION_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  FACTION_JOIN_TEMPLATE,
  FACTION_PROMOTION_TEMPLATE,
];

/**
 * Look up a faction encounter template by ID (quests + lifecycle).
 */
export function getFactionEncounterById(id: string): EncounterTemplate | undefined {
  return FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? FACTION_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? FACTION_SOCIAL_TEMPLATES.find(t => t.id === id)
    ?? getMercenaryEncounterById(id);
}

/**
 * Get all faction template IDs for a given definition.
 */
export function getFactionTemplateIds(factionDefId: string): string[] {
  return [...FACTION_ENCOUNTER_META.entries()]
    .filter(([, meta]) => meta.factionDefId === factionDefId)
    .map(([id]) => id);
}
