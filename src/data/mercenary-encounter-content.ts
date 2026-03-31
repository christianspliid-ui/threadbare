/**
 * Mercenary Company Encounter Content — TB-073 Phase 0.
 *
 * Quest, social, join, and promotion templates for the mercenary company.
 * Follows the same pattern as faction-encounter-content.ts.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const MC_DIFFICULTY_BASE = 30;
const MC_DIFFICULTY_STEP = 10;
const MC_SENIOR_BASE = 40;
const MC_ELITE_BASE = 50;
const MC_JOIN_DIFFICULTY = 25;
const MC_PROMOTION_DIFFICULTY = 40;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const MERCENARY_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['mc.join', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.0, questType: 'standard' }],
  ['mc.promotion', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['mc.quest.patrol', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.04, questType: 'standard' }],
  ['mc.quest.guard_caravan', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.04, questType: 'standard' }],
  ['mc.quest.collect_bounty', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.05, questType: 'standard' }],
  ['mc.quest.siege_work', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['mc.senior.field_command', { factionDefId: 'mercenary_company', minRank: 'sergeant_at_arms', reputationReward: 0.06, questType: 'senior' }],
  ['mc.senior.hostile_negotiation', { factionDefId: 'mercenary_company', minRank: 'sergeant_at_arms', reputationReward: 0.06, questType: 'senior' }],
  // Elite quest
  ['mc.elite.war_council', { factionDefId: 'mercenary_company', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['mc.social.sparring_ring', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.02, questType: 'standard' }],
  ['mc.social.war_stories', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.02, questType: 'standard' }],
  ['mc.social.contract_negotiation', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.03, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const MERCENARY_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── Standard Quests (Sellsword+) ──────────────────────────────────

  {
    id: 'mc.quest.patrol',
    name: 'Road Patrol',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.quest.patrol.1',
        name: 'March the Perimeter',
        narrative: 'The company assigns a section of road. You walk it with blade ready.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'The road is quiet under your watch. Merchants travel safely.' },
        onFailure: { narrative: 'You miss signs of trouble — bandits slip past your patrol.' },
      },
      {
        id: 'mc.quest.patrol.2',
        name: 'Clear the Threat',
        narrative: 'Movement in the tree line. Something is stalking the road.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'Steel settles the matter. The threat is ended.', tierPromotionEligible: true },
        onFailure: { narrative: 'The ambush catches you off-guard. You retreat to the settlement.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'mc.quest.guard_caravan',
    name: 'Guard the Caravan',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.quest.guard_caravan.1',
        name: 'Negotiate Terms',
        narrative: 'A merchant needs swords for the road. The pay depends on your bargaining.',
        reach: 'gold',
        difficulty: MC_DIFFICULTY_BASE - 5,
        duration: 1,
        onSuccess: { narrative: 'Good terms secured. The merchant pays upfront.' },
        onFailure: { narrative: 'The merchant drives a hard bargain. Thin coin for dangerous work.' },
      },
      {
        id: 'mc.quest.guard_caravan.2',
        name: 'Escort Through Danger',
        narrative: 'The road winds through contested territory. Every shadow could hide steel.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The caravan arrives intact. Gold well earned.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Losses on the road. The merchant is unhappy.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    questPriority: 3.0,
  },

  {
    id: 'mc.quest.collect_bounty',
    name: 'Collect the Bounty',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.quest.collect_bounty.1',
        name: 'Track the Target',
        narrative: 'A warrant with a face and a price. The company sends you hunting.',
        reach: 'shadow',
        difficulty: MC_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: { narrative: 'You find the trail. The quarry is close.' },
        onFailure: { narrative: 'The target has gone to ground. Cold trail.' },
      },
      {
        id: 'mc.quest.collect_bounty.2',
        name: 'Subdue the Quarry',
        narrative: 'Cornered, the target decides whether to fight or surrender.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP + 5,
        duration: 2,
        onSuccess: {
          narrative: 'Bound and delivered. The bounty is yours.',
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The target escapes. No coin for empty hands.',
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
  },

  {
    id: 'mc.quest.siege_work',
    name: 'Siege Labor',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.quest.siege_work.1',
        name: 'Dig the Earthworks',
        narrative: 'The company contributes to fortification work. Sweat before steel.',
        reach: 'stone',
        difficulty: MC_DIFFICULTY_BASE,
        duration: 3,
        onSuccess: { narrative: 'The earthworks hold. Good ground for the next fight.' },
        onFailure: { narrative: 'Shoddy work. The engineers are unimpressed.' },
      },
      {
        id: 'mc.quest.siege_work.2',
        name: 'Hold the Line',
        narrative: 'A sortie tests the fortifications. Your section bears the brunt.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The line holds. Respect is earned in dirt and blood.', tierPromotionEligible: true },
        onFailure: { narrative: 'The position buckles. You fall back to the second line.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    questPriority: 3.0,
  },

  // ── Senior Quests (Sergeant-at-Arms+) ─────────────────────────────

  {
    id: 'mc.senior.field_command',
    name: 'Field Command',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.senior.field_command.1',
        name: 'Plan the Operation',
        narrative: 'Command assigns you a squad. Plan the engagement.',
        reach: 'eye',
        difficulty: MC_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'Sound tactics. Your squad moves with purpose.' },
        onFailure: { narrative: 'The plan unravels before first contact.' },
      },
      {
        id: 'mc.senior.field_command.2',
        name: 'Lead the Assault',
        narrative: 'No plan survives contact. Adapt or die.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE + MC_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: { narrative: 'Your command carries the day. The company remembers.', tierPromotionEligible: true },
        onFailure: { narrative: 'Losses mount. The withdrawal is orderly but bitter.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 4.0,
  },

  {
    id: 'mc.senior.hostile_negotiation',
    name: 'Hostile Negotiation',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.senior.hostile_negotiation.1',
        name: 'Assess the Situation',
        narrative: 'A contract dispute with a rival company. Words before swords.',
        reach: 'heart',
        difficulty: MC_SENIOR_BASE,
        duration: 2,
        onSuccess: { narrative: 'You read the room. Their bluster hides weakness.' },
        onFailure: { narrative: 'Their captain is stone-faced. No weakness to exploit.' },
      },
      {
        id: 'mc.senior.hostile_negotiation.2',
        name: 'Force Terms',
        narrative: 'Negotiations break down. Implied violence becomes explicit.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE + MC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'They yield. The contract is yours.', tierPromotionEligible: true },
        onFailure: { narrative: 'A brawl erupts. No contract, only bruises.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 4.0,
  },

  // ── Elite Quest (Captain+) ────────────────────────────────────────

  {
    id: 'mc.elite.war_council',
    name: 'War Council',
    locationTypes: ['city', 'capital'],
    steps: [
      {
        id: 'mc.elite.war_council.1',
        name: 'Present the Campaign',
        narrative: 'The War Chief calls a council. Your proposal must be sound.',
        reach: 'eye',
        difficulty: MC_ELITE_BASE,
        duration: 2,
        onSuccess: { narrative: 'Your plan earns nods. Resources are allocated.' },
        onFailure: { narrative: 'The council finds flaws. Back to the drawing board.' },
      },
      {
        id: 'mc.elite.war_council.2',
        name: 'Secure the Contract',
        narrative: 'A patron offers a lucrative but dangerous contract. The company votes.',
        reach: 'gold',
        difficulty: MC_ELITE_BASE + MC_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: { narrative: 'The contract is sealed. Gold flows and steel prepares.' },
        onFailure: { narrative: 'The company declines. Too much risk for too little coin.' },
      },
      {
        id: 'mc.elite.war_council.3',
        name: 'Execute the Strategy',
        narrative: 'Weeks of preparation come down to this. Lead the campaign.',
        reach: 'iron',
        difficulty: MC_ELITE_BASE + MC_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: { narrative: 'A masterful campaign. The company\'s reputation soars.', tierPromotionEligible: true },
        onFailure: { narrative: 'The campaign falters. Costly in blood and reputation.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    questPriority: 5.0,
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const MERCENARY_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'mc.social.sparring_ring',
    name: 'The Sparring Ring',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.social.sparring_ring.1',
        name: 'Enter the Ring',
        narrative: 'The company ring is always open. Prove yourself or learn a lesson.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'You hold your own. Respect trickles in.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'Flat on your back. The laughter stings more than the bruises.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  },

  {
    id: 'mc.social.war_stories',
    name: 'War Stories',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.social.war_stories.1',
        name: 'Share a Tale',
        narrative: 'Around the fire, veterans trade stories. A good tale buys more than gold.',
        reach: 'heart',
        difficulty: MC_DIFFICULTY_BASE - 10,
        duration: 1,
        onSuccess: {
          narrative: 'Your story earns a round of drinks and a few nods.',
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: { narrative: 'The veterans have heard better. You drink in silence.' },
      },
    ],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'assist',
    threatRating: 'trivial',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  },

  {
    id: 'mc.social.contract_negotiation',
    name: 'Contract Negotiation',
    locationTypes: ['town', 'city', 'capital'],
    steps: [
      {
        id: 'mc.social.contract_negotiation.1',
        name: 'Read the Terms',
        narrative: 'A potential employer offers terms. Every clause matters.',
        reach: 'gold',
        difficulty: MC_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: 'You secure better terms. The company profits.',
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The employer is shrewd. Standard rates it is.',
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
        },
      },
    ],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const MC_JOIN_TEMPLATE: EncounterTemplate = {
  id: 'mc.join',
  name: 'Join the Free Company',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'mc.join.1',
      name: 'Trial by Combat',
      narrative: 'The company has a simple test. Fight, and fight well.',
      reach: 'iron',
      difficulty: MC_JOIN_DIFFICULTY,
      duration: 1,
      onSuccess: { narrative: 'Blood spilled. You are one of us now.' },
      onFailure: { narrative: 'Not good enough. Come back when you can hold a blade.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'heart',
  encounterType: 'duel',
  threatRating: 'easy',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
};

export const MC_PROMOTION_TEMPLATE: EncounterTemplate = {
  id: 'mc.promotion',
  name: 'Promotion Challenge',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'mc.promotion.1',
      name: 'The Challenge',
      narrative: 'Rank is earned. Prove your worth in front of the company.',
      reach: 'iron',
      difficulty: MC_PROMOTION_DIFFICULTY,
      duration: 2,
      onSuccess: { narrative: 'The company salutes. Higher rank, heavier responsibilities.' },
      onFailure: { narrative: 'Not yet. The company respects ambition, but demands results.' },
    },
  ],
  reachPrimary: 'iron',
  reachSecondary: 'heart',
  encounterType: 'duel',
  threatRating: 'moderate',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
};

export const MC_LIFECYCLE_TEMPLATES: readonly EncounterTemplate[] = [
  MC_JOIN_TEMPLATE,
  MC_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a mercenary encounter template by ID.
 */
export function getMercenaryEncounterById(id: string): EncounterTemplate | undefined {
  return MERCENARY_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? MC_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? MERCENARY_SOCIAL_TEMPLATES.find(t => t.id === id);
}
