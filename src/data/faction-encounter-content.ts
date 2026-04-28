/**
 * Faction Encounter Content — Adventuring Guild quest templates.
 *
 * 10 quest templates across 4 tiers (standard, senior, elite, leadership).
 * Migrated to UnifiedActionTemplate (THR-102).
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 2
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { MERCENARY_ENCOUNTER_META } from './mercenary-encounter-content';
import { THIEVES_GUILD_ENCOUNTER_META } from './thieves-guild-encounter-content';
import { MERCHANT_CONSORTIUM_ENCOUNTER_META } from './merchant-consortium-encounter-content';
import { TEMPLE_OF_SPHERES_ENCOUNTER_META } from './temple-of-spheres-encounter-content';
import { ARCANE_CIRCLE_ENCOUNTER_META } from './arcane-circle-encounter-content';
import { RANGERS_BROTHERHOOD_ENCOUNTER_META } from './rangers-brotherhood-encounter-content';
import { CIVIC_GUARD_ENCOUNTER_META } from './civic-guard-encounter-content';
import { UNDERKING_COURT_ENCOUNTER_META } from './underking-court-encounter-content';
import { HOLY_ORDER_DAWN_ENCOUNTER_META } from './holy-order-dawn-encounter-content';
import { BUILDERS_FELLOWSHIP_ENCOUNTER_META } from './builders-fellowship-encounter-content';
import { LOREKEEPERS_COVENANT_ENCOUNTER_META } from './lorekeepers-covenant-encounter-content';

// ─── Constants ───────────────────────────────────────────────────────────

const FACTION_DIFFICULTY_BASE = 25;
const FACTION_DIFFICULTY_STEP = 10;
const FACTION_SENIOR_BASE = 35;
const FACTION_ELITE_BASE = 45;
const FACTION_JOIN_DIFFICULTY = 20;
const FACTION_PROMOTION_DIFFICULTY = 35;
const FACTION_SOCIAL_DIFFICULTY_BASE = 25;
const FACTION_SOCIAL_DIFFICULTY_STEP = 10;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

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
  // Classical factions
  ...THIEVES_GUILD_ENCOUNTER_META,
  ...MERCHANT_CONSORTIUM_ENCOUNTER_META,
  ...TEMPLE_OF_SPHERES_ENCOUNTER_META,
  ...ARCANE_CIRCLE_ENCOUNTER_META,
  ...RANGERS_BROTHERHOOD_ENCOUNTER_META,
  ...CIVIC_GUARD_ENCOUNTER_META,
  ...UNDERKING_COURT_ENCOUNTER_META,
  ...HOLY_ORDER_DAWN_ENCOUNTER_META,
  ...BUILDERS_FELLOWSHIP_ENCOUNTER_META,
  ...LOREKEEPERS_COVENANT_ENCOUNTER_META,
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const FACTION_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Standard Quests (Journeyman+) ──────────────────────────────────

  {
    id: 'ag.quest.ruin_delve',
    name: 'Delve into Ruins',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild board lists a ruin site three hours from {location} — ' +
          'some previous expedition started the clearance work and stopped, for reasons ' +
          'the board posting does not specify. {name} spends the morning with old survey ' +
          'notes and a hand-drawn sketch of the entry passage. ' +
          '{?has_faction}A guildmate who ran a similar job last season left margin notes in ' +
          'the archive copy. {name} reads them twice.{/has_faction}' +
          '{?no_faction}No prior work to lean on. The sketch is what it is.{/no_faction}',
        successAfterimage: 'A promising entry point identified. The descent will be deliberate.',
        failureAfterimage: 'The survey notes are contradictory. The site has more than one entrance.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 4 },
        difficulty: (FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The threshold smells of old stone and something {name} cannot name. ' +
          'The passage narrows after the first chamber — tight enough that a pack ' +
          'must be shed and dragged behind. Whatever clearance work was started before ' +
          'ended at the third junction, where fresh rubble sits alongside old.',
        successAfterimage:
          '{name} pushes through the blocked passage and emerges into the heart of the ruin. ' +
          'What was sealed for generations opens under {their} hands.',
        failureAfterimage:
          'A secondary collapse — different from the first, fresher — cuts the forward route. ' +
          '{name} maps what {they} reach{es} before the ceiling settles again with a sound ' +
          'like patience running out. The ruin keeps the deeper chambers.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes a guild contract to clear and survey a ruin site outside {location}. ' +
        'The job has been on the board long enough to accumulate dust.',
      success:
        'The ruin yields what the board promised. {name} emerges with items and a survey ' +
        'the guild cartographer accepts without complaint.',
      failure:
        'The ruins hold their secrets. {name} returns with partial notes and the particular ' +
        'frustration of a job that was almost finished.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ruin sits in the hills outside {location}, neither opened nor closed, ' +
          'depending on how the descent went. The guild logs the contract result. ' +
          '{name} logs what {they} saw{s}.',
        changes: [
          {
            id: 'ruin_delve_guild_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'A completed delve builds the kind of standing that gets better contracts.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god take from the ruin?',
        reactions: [
          {
            id: 'ruin_delve_mark_discovery',
            label: 'Something down there was watching.',
            intent:
              'The ruin is old enough that its occupants — whatever they were — left ' +
              'more than stone and rubble. {name} carried something out without knowing it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.25,
                label: 'Entered a sealed ruin; may carry what was sealed with it',
                revealFamilies: ['ag.quest', 'arcane', 'investigation'],
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ruin_delve_file_work',
            label: 'Good work. File the survey.',
            intent:
              'The contract is complete. The guild records the clearance. ' +
              '{name} adds to {their} operational history and moves on.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.quest.monster_hunt',
    name: 'Hunt the Beast',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_DIFFICULTY_BASE) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The reports are consistent in the wrong way: whatever it is, it circles back. ' +
          'It knows the territory better than the people who sent the reports do. ' +
          '{name} starts from the last confirmed sighting and reads the land the way the ' +
          'guild teaches — not just tracks, but the pattern of tracks, what the creature ' +
          'avoids and what it doesn\'t. ' +
          '{?has_ally}Someone who knows this stretch of country would halve this work. ' +
          '{name} considers who {they} trust{s} with the information.{/has_ally}',
        successAfterimage: 'The trail coalesces into a pattern. The beast\'s range is mapped.',
        failureAfterimage:
          'Three possible dens, no clear primary. The creature moves more than expected.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 3 },
        difficulty: (FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The den is exactly where the pattern suggested. The creature is not surprised ' +
          'by {name}\'s arrival — it had time to prepare, and it chose this ground deliberately. ' +
          'That tells {name} something about what {they}\'re{s} dealing with.',
        successAfterimage:
          '{name} steps back from the scene and takes inventory: injured but functional, ' +
          'the creature down, the territory quieter than it was an hour ago. ' +
          'The villages along the road will sleep easier.',
        failureAfterimage:
          'The beast proves faster in its own den than in open ground. {name} withdraws — ' +
          'not in panic but in the specific calculation of someone who knows ' +
          'when a fight has turned irretrievably. The creature watches {them} go.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} picks up a monster hunt contract from the guild board. ' +
        'The posting is old enough that two other hunters have already declined it.',
      success:
        'The beast is dealt with. {name} delivers the required proof of kill to the guild ' +
        'and collects what the posting promised.',
      failure:
        'A tactical withdrawal is still a withdrawal. {name} returns to {location} with ' +
        'good intelligence and a reason to prepare differently next time.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The territory outside {location} is either quieter or unchanged, ' +
          'depending on the outcome. Either way, the guild notes the attempt.',
        changes: [
          {
            id: 'monster_hunt_contract_result',
            kind: 'reputation',
            title: 'Contract Result',
            detail: 'Hunts completed build a body of work the guild uses to assign harder contracts.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god carry away from the hunt?',
        reactions: [
          {
            id: 'monster_hunt_wound_mark',
            label: 'The creature left its mark.',
            intent:
              'Something from the encounter — a wound, a technique glimpsed, a sound that ' +
              'still echoes — stays with {name} into the next contract.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.2,
                label: 'Survived a beast hunt — carries the encounter forward',
                revealFamilies: ['ag.quest', 'ag.senior'],
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'monster_hunt_log_result',
            label: 'Contract complete. Move on.',
            intent:
              'The hunt is over and the result stands. The guild adds it to {name}\'s record.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.quest.wilderness_survey',
    name: 'Survey the Wilds',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild\'s maps end at the settlement boundary. What lies beyond is {name}\'s ' +
          'commission: a circuit of the adjacent wilderness, detailed enough for the ' +
          'cartographer to produce a working draft. The work requires patience more than ' +
          'courage — every ridge walked twice, every water source measured, every ' +
          'significant hazard noted with enough specificity to be useful. ' +
          '{?has_faction}The guild provides standard survey tools and a baseline from ' +
          'the nearest completed section.{/has_faction}' +
          '{?no_faction}Independent work means {name} sources {their} own materials — ' +
          'parchment, charcoal, and a reliable compass.{/no_faction}',
        successAfterimage: 'The terrain reveals itself in clean lines. The charcoal keeps pace.',
        failureAfterimage:
          'Fog and rain compress the horizons. The circuit is walked but the notes are thin.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: FACTION_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#survival'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#survival'],
          },
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          '{name} spreads the survey notes across the cartographer\'s table. ' +
          'The guild hall smells of lamp oil and old parchment. ' +
          'The cartographer reads without speaking, running a finger along each line, ' +
          'pausing at junctions where the detail is thin.',
        successAfterimage:
          'A nod. "This is usable." From the guild\'s cartographer, that counts as praise.',
        failureAfterimage:
          '"There are gaps." The cartographer sets the notes aside with the particular ' +
          'care of someone filing something they don\'t expect to retrieve. ' +
          'Partial credit, nothing more.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} accepts a wilderness survey commission from the guild — ' +
        'standard pay, standard tools, and the particular solitude of work ' +
        'that doesn\'t involve anyone else\'s schedule.',
      success:
        'The survey is accepted. {name}\'s notes become part of the guild\'s growing ' +
        'picture of the territory around {location}.',
      failure:
        'The survey is filed with reservations. Not useless, but not complete.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The wilderness beyond {location} is mapped or partially mapped, ' +
          'depending on conditions. The cartographer has what {name} brought back.',
        changes: [
          {
            id: 'wilderness_survey_intel',
            kind: 'item',
            title: 'Survey Intelligence',
            detail: 'Good maps are useful for a long time. So is the person who made them.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the god notice in the unmapped country?',
        reactions: [
          {
            id: 'wilderness_survey_terrain_knowledge',
            label: 'The land has memory.',
            intent:
              'The wilderness {name} walked is older than the settlement. ' +
              'What {they} mapped is what was permitted to be seen.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Terrain survey of wilderness outside {location}',
                detail: 'Routes, hazards, water sources, and notable features within half a day\'s travel.',
                reliability: 0.8,
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wilderness_survey_file_notes',
            label: 'The maps speak for themselves.',
            intent:
              'The survey is complete. The guild holds the knowledge. {name} moves on.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.quest.escort_caravan',
    name: 'Guard the Caravan',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The caravan is already loaded when {name} arrives — three wagons, two ' +
          'merchant families, and a driver who has made this run before and knows ' +
          'exactly which part of the road they\'re paying extra to survive. ' +
          '{name} reads the group: who gives orders, who follows them, who will freeze. ' +
          '{?has_faction}The guild has a standing arrangement with this merchant house. ' +
          '{name}\'s name was on the preferred list.{/has_faction}' +
          '{?no_faction}{name} was hired from a posting board. The merchants ' +
          'look {them} over without much warmth.{/no_faction}',
        successAfterimage: 'The arrangement is confirmed. {name} takes position on the lead wagon.',
        failureAfterimage:
          'The caravan departs before the details are settled. {name} catches up on foot ' +
          'and negotiates from a worse position.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 4 },
        difficulty: (FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The ambush comes at the narrowest part of the pass — exactly where it always comes, ' +
          'which means whoever set it was counting on the caravan not having someone who ' +
          'knew that. Four figures on the high ground, one blocking the road. ' +
          '{name} has perhaps twelve seconds before the merchants start making bad decisions.',
        successAfterimage:
          'The ambush breaks faster than it formed. The merchants rearrange their cargo ' +
          'in silence, and the driver doesn\'t look back. They arrived. That\'s what they paid for.',
        failureAfterimage:
          'Three crates are gone before the attackers scatter. The merchants count their losses ' +
          'with the particular quiet of people who will need to explain this to someone. ' +
          '{name} is part of that explanation.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} hires on as caravan guard for a merchant run out of {location}. ' +
        'Routine work, until the part that isn\'t.',
      success:
        'The caravan reaches its destination intact. The merchants pay what was agreed, ' +
        'which is the highest praise this kind of work offers.',
      failure:
        'The caravan arrives short of cargo. The merchants are unhappy. ' +
        'The guild notes the outcome.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The road between {location} and the next settlement is either a little safer ' +
          'or a little more expensive, depending on how the escort went.',
        changes: [
          {
            id: 'escort_caravan_reputation',
            kind: 'reputation',
            title: 'Merchant Reputation',
            detail: 'Successful escorts build the kind of word-of-mouth that brings better contracts.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What lingers from the road?',
        reactions: [
          {
            id: 'escort_caravan_intelligence',
            label: 'The merchants knew something about the road.',
            intent:
              'Three days in close quarters with experienced travelers. ' +
              'They didn\'t share everything, but they shared more than they meant to.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Road intelligence from caravan escort near {location}',
                detail: 'Ambush patterns, patrol schedules, road conditions, merchant traffic.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'escort_caravan_log_contract',
            label: 'Work completed. Next contract.',
            intent: 'The escort is finished. The guild records it.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.quest.recover_artifact',
    name: 'Recover Lost Artifact',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: FACTION_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A guild patron reports a family heirloom lost in dangerous territory — ' +
          'lost in the way that means someone else took it, not misplaced it. ' +
          'The patron knows roughly where and exactly what it looks like. ' +
          '{name} starts with the guild archive and works backward: ' +
          'who would want it, where things like it end up, which ' +
          'recovery jobs from this region have gone wrong and why. ' +
          '{?has_faction}A guild contact in the relevant district has current intelligence ' +
          'on who\'s been moving unusual items.{/has_faction}' +
          '{?no_faction}The research is slower without guild resources, ' +
          'but the conclusions are the same.{/no_faction}',
        successAfterimage: 'A likely location. The artifact has a trail.',
        failureAfterimage:
          'Multiple locations, none confirmed. The search will be wider than planned.',
      },
      {
        reach: 'shadow',
        duration: { min: 2, max: 3 },
        difficulty: (FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The path to the artifact runs through the kind of space that discourages witnesses — ' +
          'a locked secondary building, a guarded lower floor, a corridor that should be ' +
          'empty and isn\'t. {name} moves in the spaces between attention.',
        successAfterimage: '{name} reaches the artifact\'s resting place without incident.',
        failureAfterimage:
          'A trap springs — not a killing trap, but a watching one. ' +
          'Someone knows {name} is here. The next part of this job just became harder.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 3 },
        difficulty: (FACTION_DIFFICULTY_BASE + FACTION_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'The artifact is here. So is whatever kept it here. ' +
          'The last part of any recovery is the honest part — what it costs to take ' +
          'what someone else decided to keep.',
        successAfterimage:
          'The artifact is in {name}\'s hands. The patron will see their heirloom again. ' +
          'Whatever stood between {them} and that outcome no longer does.',
        failureAfterimage:
          'The guardian proves the stronger argument. {name} retreats with ' +
          'empty hands and a complete picture of why the artifact is still there. ' +
          'That knowledge is worth something, even if it\'s not what the patron hired for.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} accepts a recovery contract — a lost artifact, a patron with means, ' +
        'and a location that explains why no one has retrieved it yet.',
      success:
        'The artifact returns to its owner. The patron pays the full rate, ' +
        'which in this kind of work means things went right.',
      failure:
        'The artifact remains where it was. The guild logs the attempt; ' +
        'the patron will need to consider other options.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The artifact is either recovered or it isn\'t. ' +
          'Either way, {name} knows more about the territory around {location} ' +
          'than {they} did{s} before.',
        changes: [
          {
            id: 'recover_artifact_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'Recovery contracts test the full toolkit. Success here means better work later.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see in the recovery?',
        reactions: [
          {
            id: 'recover_artifact_seed_followup',
            label: 'The item carries more than history.',
            intent:
              'The patron\'s heirloom is not simply old. It belongs to a chain ' +
              'of ownership that does not end with this recovery.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'ag.quest',
                delayTicks: 15,
                priority: 2,
                seedLabel: 'Recovered artifact attracts attention from interested parties',
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'recover_artifact_log_contract',
            label: 'Contract filed. Nothing further.',
            intent: 'The recovery is complete. The guild records the outcome.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── Senior Quests (Sergeant+) ──────────────────────────────────────

  {
    id: 'ag.senior.deep_expedition',
    name: 'Lead Deep Expedition',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 2 },
        difficulty: FACTION_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild entrusts {name} with leading an expedition into a site the standard ' +
          'contractors declined — not because it\'s impossible, but because it requires ' +
          'someone who can hold a team together when things stop going right. ' +
          '{name} reads the assembled faces and makes the calculation: capable, willing, ' +
          'and exactly uncertain enough to take guidance. ' +
          '{?has_ally}One face {name} knows — someone who has been this deep before. ' +
          '{they} position{s} them where it matters.{/has_ally}',
        successAfterimage:
          'A team worth leading. They\'ll follow {name} into the dark if {they} give them{s} reason to.',
        failureAfterimage:
          'Thin attendance. The expedition will go short-handed into places that reward numbers.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 4 },
        difficulty: (FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The tunnels narrow at the third descent, and the team\'s breathing changes. ' +
          '{name} watches the shift — the way three of them start checking over their ' +
          'shoulders, the way one keeps moving forward like the closing walls aren\'t real. ' +
          'Leading means noticing all of it and deciding which parts to address aloud.',
        successAfterimage:
          '{name}\'s steadiness holds the team through the worst section. They emerge together.',
        failureAfterimage:
          'One member freezes at a difficult passage. The team\'s momentum breaks. ' +
          'They go on, but more carefully, and less far than planned.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 4 },
        difficulty: (FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'The deep chamber is exactly what the guild\'s fragmentary records suggested — ' +
          'which means it\'s also exactly what they didn\'t know about. ' +
          '{name} reads the space with {their} team\'s exhaustion factored in: ' +
          'how much time, how much strength, and what the cost of being wrong looks like.',
        successAfterimage:
          'A discovery that will echo in guild records for years. {name} led people ' +
          'to a place they couldn\'t have reached alone, and brought them back.',
        failureAfterimage:
          'The deep yields what it chooses. The expedition surfaces with partial findings ' +
          'and the kind of exhaustion that takes a week to clear. The guild logs it as ' +
          'incomplete but honest work.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads a guild expedition into deep territory outside {location} — ' +
        'a site that requires a sergeant\'s experience to manage and a team willing ' +
        'to follow into the unknown.',
      success:
        'The expedition returns with something worth the cost. ' +
        '{name}\'s name moves up the assignment list.',
      failure:
        'The expedition comes back short. Good work in difficult conditions, ' +
        'but the deep kept its prize.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The team is back in {location}. Whatever was found — or wasn\'t — ' +
          'sits in the guild\'s records. The people who went down know each other differently now.',
        changes: [
          {
            id: 'deep_expedition_leadership',
            kind: 'reputation',
            title: 'Leadership Standing',
            detail: 'Leading people into difficult places and bringing them back changes how the guild sees you.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god observe in the deep?',
        reactions: [
          {
            id: 'deep_expedition_knowledge',
            label: 'The deep remembered them.',
            intent:
              'The expedition went somewhere few have been. Whatever is down there ' +
              'now has a record of {name}\'s presence.',
            effects: [
              {
                kind: 'intelligence',
                category: 'shrine_location',
                label: 'Deep site survey from expedition led by {name}',
                detail: 'Layout, hazards, findings, and what was left unclaimed.',
                reliability: 0.75,
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deep_expedition_log',
            label: 'File the report. Move on.',
            intent: 'The expedition is complete. The guild has what it needs.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.senior.bounty_hunt',
    name: 'Track Dangerous Quarry',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 2 },
        difficulty: FACTION_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A dangerous fugitive has evaded guild contractors twice. The board now specifies ' +
          'sergeant-level assignment only — not because the target is physically overwhelming, ' +
          'but because {they} know{s} how hunters think. ' +
          '{name} starts from a different premise: not where the quarry has been, ' +
          'but where {they} believe{s} {they}\'re{s} safe, and why that belief is wrong. ' +
          '{?has_faction}The guild\'s network in this region has surveillance on three ' +
          'locations. {name} discards two of them immediately.{/has_faction}',
        successAfterimage: 'The pattern resolves. {name} knows where the quarry will be.',
        failureAfterimage:
          'A network of false trails, carefully maintained. The quarry anticipated this approach.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 5 },
        difficulty: (FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#shadow'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#shadow'],
          },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'The quarry knows {name} is coming — the same intelligence network that ' +
          'led {them} here carried {their} approach the other direction. ' +
          'This is not a surprise; it is a negotiation about who blinks first in a space ' +
          'where both parties have prepared.',
        successAfterimage:
          'The quarry is brought to account. The guild\'s reputation for finishing ' +
          'what others started rises by one demonstrable case.',
        failureAfterimage:
          'The quarry slips the closing perimeter at a gap {name} didn\'t know existed. ' +
          '{they} surface{s} later at another posting board, description updated. ' +
          'The hunt continues, but not today.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} picks up a senior bounty contract — a target who has survived two previous ' +
        'hunter teams and whose capture the guild now considers a reputation matter.',
      success:
        'The bounty is collected. The guild notes that the contract required a sergeant ' +
        'and a sergeant delivered.',
      failure:
        'The quarry escapes again. The posting will remain on the board. ' +
        '{name}\'s intelligence is filed and will inform the next attempt.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The bounty is resolved or it isn\'t. Either way, someone in {location} ' +
          'knows more about this hunt than they did before it started.',
        changes: [
          {
            id: 'bounty_hunt_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'Senior bounties test persistence, not just capability. Results compound.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god take from the hunt?',
        reactions: [
          {
            id: 'bounty_hunt_intelligence',
            label: 'The quarry taught something.',
            intent:
              'Whatever the outcome, the quarry operated in a network. ' +
              'Hunting them revealed the shape of that network.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Intelligence gathered tracking bounty target near {location}',
                detail: 'Safe houses, contacts, movement patterns, and cover identities used.',
                reliability: 0.7,
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bounty_hunt_log',
            label: 'Contract result filed.',
            intent: 'The hunt is over. The guild has the record.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.senior.map_uncharted',
    name: 'Map Uncharted Territory',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 4 },
        difficulty: FACTION_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild\'s maps end at the edge of what\'s been verified. ' +
          'What lies beyond is rumor and approximation — local knowledge that hasn\'t ' +
          'been tested against instruments and honest observation. ' +
          '{name}\'s commission is to change that: a full circuit of the uncharted ' +
          'territory, documented with enough rigor that the guild can build from it. ' +
          'The work is slow, physical, and largely solitary. ' +
          '{?has_faction}The guild provides a reference baseline and a validation contact ' +
          'at the nearest mapped boundary.{/has_faction}',
        successAfterimage: 'New terrain unfolds. The charcoal moves across parchment in long certain lines.',
        failureAfterimage: 'The territory resists easy reading. The circuit is walked but the notes are sparse.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_SENIOR_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#knowledge'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#knowledge'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          '{name} delivers the survey to the guild\'s senior cartographer, ' +
          'who receives it with the silence of professional evaluation. ' +
          'The process is thorough: every claim checked, every edge of the new map ' +
          'tested against the known boundary.',
        successAfterimage:
          '"This is complete." Three words from a cartographer who uses them rarely. ' +
          'The new territory is now territory.',
        failureAfterimage:
          '"There are gaps you\'d need to return for." {name} knows the gaps — ' +
          'the stretches that were too dangerous, too weathered, too uncertain. ' +
          'The survey is accepted at partial value and the outstanding work is noted.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes on a senior cartographic commission — mapping territory outside ' +
        '{location} that no guild instrument has verified.',
      success:
        'The map is complete and accepted. A piece of the world is now known. ' +
        '{name}\'s name is in the attribution.',
      failure:
        'A partial map. Better than nothing; less than the commission required.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The territory is mapped or partially mapped. Either way, the world is slightly ' +
          'more legible than it was before {name} took the commission.',
        changes: [
          {
            id: 'map_uncharted_knowledge',
            kind: 'item',
            title: 'Cartographic Record',
            detail: 'Maps made from direct observation have a longer useful life than maps made from rumor.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the god see in the unmapped places?',
        reactions: [
          {
            id: 'map_uncharted_terrain_intel',
            label: 'The blank spaces were not empty.',
            intent:
              'Unmapped territory is not unclaimed territory. ' +
              'What {name} found while mapping it has implications beyond cartography.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Verified survey of unmapped territory near {location}',
                detail: 'Terrain features, routes, hazards, and points of strategic interest.',
                reliability: 0.85,
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'map_uncharted_log',
            label: 'The map is done. File it.',
            intent: 'The cartographic work stands on its own merits.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── Elite Quests (Lieutenant+) ─────────────────────────────────────

  {
    id: 'ag.elite.dragon_lair',
    name: 'Breach the Dragon\'s Lair',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 3 },
        difficulty: FACTION_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A dragon\'s lair has been located in the mountains above {location}. ' +
          'The guild sends its lieutenants — not because they are likely to succeed, ' +
          'but because they are likely to survive long enough to learn something useful. ' +
          '{name} spends three days reading every prior record of dragon lair approaches: ' +
          'the ones that worked, the ones that almost worked, and the ones that produced ' +
          'the current vacancy in the lieutenant ranks. The pattern in the failures is ' +
          'not what to avoid — it\'s what to stop assuming. ' +
          '{?has_faction}The guild provides access to the last scout\'s full report, ' +
          'including the sections that were redacted for general distribution.{/has_faction}',
        successAfterimage: 'A path through the outer defenses that the lair\'s occupant hasn\'t accounted for.',
        failureAfterimage:
          'The scouts return with casualties. The approach is more heavily watched than the records suggested.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 5 },
        difficulty: (FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Heat radiates from the stone fifty meters before the main chamber. ' +
          'The air carries sulfur and the particular stillness of a space that is ' +
          'not unoccupied. Every surface has been worked by something large and patient. ' +
          '{name} moves through it the way you move through something sleeping — ' +
          'with the understanding that the distinction between sleeping and waiting is thinner than it looks.',
        successAfterimage:
          '{name} navigates the lair\'s hazards and reaches the inner chamber threshold.',
        failureAfterimage:
          'A partial cave-in triggers something. {name} exits at speed, ' +
          'carrying information about which passages don\'t hold weight ' +
          'and why the previous scouts didn\'t make it back.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 4 },
        difficulty: (FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP * 3) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.04,
        },
        narrativeTemplate:
          'The beast is awake. It was awake before {name} entered the mountain. ' +
          'It watched the approach, assessed the threat, and chose to wait — ' +
          'which means it didn\'t consider the approach worth moving for. ' +
          '{name} has perhaps one chance to revise that assessment.',
        successAfterimage:
          'Against the weight of every prior record on this lair, the outcome falls ' +
          'in {name}\'s favor. {they} emerge{s} into cold mountain air carrying something ' +
          'no lieutenant has carried before. The guild will tell this story for a generation.',
        failureAfterimage:
          'The dragon\'s fury is an argument that cannot be answered with anything ' +
          '{name} currently carries. {they} flee{s} — not in panic, in the exact ' +
          'calculation of someone who intends to come back when the calculation changes. ' +
          'The lair will still be there.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads a guild attempt on a dragon\'s lair in the mountains above {location}. ' +
        'This is the kind of contract that makes reputations or ends careers.',
      success:
        'The lair is breached. The guild speaks of this for years. ' +
        '{name}\'s name is associated with the kind of success that redefines ' +
        'what the guild considers possible.',
      failure:
        '{name} returns from the mountain alive, which the guild considers significant. ' +
        'The full report will inform the next attempt, whenever someone is ready to make it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The dragon\'s lair either has a new story attached to it or it doesn\'t. ' +
          'Either way, {name} has been somewhere most people haven\'t and come back with evidence.',
        changes: [
          {
            id: 'dragon_lair_legend',
            kind: 'reputation',
            title: 'Elite Standing',
            detail: 'Dragon lair attempts mark a lieutenant\'s career one way or another.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god observe in the mountain?',
        reactions: [
          {
            id: 'dragon_lair_mark_legend',
            label: 'This moment marks {name}.',
            intent:
              'The lair attempt is the kind of event that becomes part of how a person ' +
              'is known — by the guild, by {location}, and by whatever watched from the mountain.',
            effects: [
              {
                kind: 'recent_event',
                message: '{name} attempts a dragon\'s lair above {location}. The guild watches the outcome.',
                significance: 0.9,
              },
              { kind: 'reputation_tally', key: 'ag.elite_work', delta: 3 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'dragon_lair_log',
            label: 'File the report. The guild learns from this.',
            intent: 'The attempt is documented. Future lieutenants will read {name}\'s account.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.elite_work', delta: 2 },
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Dragon lair survey — full approach documentation',
                detail: 'Patrol patterns, structural hazards, the beast\'s known behavior, and what failed.',
                reliability: 0.9,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ag.elite.lost_city',
    name: 'Expedition to Lost City',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 3 },
        difficulty: FACTION_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Ancient texts hint at a city swallowed by the wilds — ' +
          'not destroyed but overgrown, its structures intact beneath a century of forest. ' +
          'The guild commissions its recovery: a verified location, a preliminary survey, ' +
          'and enough documentation to justify a full expedition. ' +
          '{name} starts with three conflicting accounts and works backward through ' +
          'the discrepancies to find what each account\'s author was trying not to say. ' +
          '{?has_faction}The guild\'s restricted archive holds a partial map from the last ' +
          'serious attempt, forty years prior. The reason it\'s restricted is in the margin notes.{/has_faction}',
        successAfterimage: 'The old maps align. A route crystallizes from three sets of contradictions.',
        failureAfterimage:
          'The texts are too damaged in the critical passages. The route is a range, not a line.',
      },
      {
        reach: 'gold',
        duration: { min: 3, max: 5 },
        difficulty: (FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Weeks of travel through unmapped wilderness on a route that looks different ' +
          'from the ground than it does on parchment. The expedition moves at the pace ' +
          'of the slowest necessary member — the scholar who must be present for the ' +
          'documentation to have credibility, the specialist whose expertise will either ' +
          'justify the cost or explain why the city resisted investigation for so long. ' +
          '{name} holds the group together through days when the route diverges from prediction.',
        successAfterimage:
          'The expedition endures. On the forty-third day, the city\'s outline appears through canopy — ' +
          'towers still upright, walls intact, utterly silent.',
        failureAfterimage:
          'Disease and exhaustion reduce the effective party to half. They reach what might be ' +
          'the outer boundary but cannot confirm it — the city, if it exists, is one difficult ' +
          'push further than the group can make.',
      },
      {
        reach: 'shadow',
        duration: { min: 3, max: 6 },
        difficulty: (FACTION_ELITE_BASE + FACTION_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.04,
        },
        narrativeTemplate:
          'The city is not abandoned in the way that word implies. ' +
          'It was sealed — deliberately, methodically, by someone who intended the sealing ' +
          'to last. What preserved it also preserved whatever it was sealed against. ' +
          '{name} reads the inner architecture for what it was designed to contain, ' +
          'not just to hold.',
        successAfterimage:
          'The city yields what it was willing to give. {name} brings back ' +
          'a documentation of the outer districts and a sealed record from the central archive — ' +
          'the kind of find that changes what the guild\'s scholars thought they knew.',
        failureAfterimage:
          'Ancient guardians drive the expedition from the inner sanctum — ' +
          'not with violence but with the particular authority of things that have been ' +
          'waiting a very long time to be left alone. {name} retreats with the outer survey ' +
          'and the knowledge that the inner city has active defenses that will need to be ' +
          'understood before any future attempt.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads a guild expedition to a lost city in the wilderness beyond {location}. ' +
        'The city was real. Whether it is still accessible is the commission\'s question.',
      success:
        'The lost city is documented. The guild\'s scholars have enough to argue about for a decade. ' +
        '{name}\'s expedition becomes the reference point for everyone who comes after.',
      failure:
        'The expedition returns with partial documentation and a comprehensive account ' +
        'of why the city resisted full investigation. Both are more valuable than they sound.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lost city is either less lost than it was or exactly as inaccessible as before, ' +
          'depending on the outcome. The guild has documentation either way.',
        changes: [
          {
            id: 'lost_city_discovery',
            kind: 'reputation',
            title: 'Exploratory Record',
            detail: 'Lost city expeditions define what the guild\'s best people consider possible.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see in the sealed city?',
        reactions: [
          {
            id: 'lost_city_seed_return',
            label: 'What was left behind requires a return.',
            intent:
              'The city did not give up everything. Something in the inner sanctum is still ' +
              'there, still waiting, and the god knows what it is.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'ag.elite',
                delayTicks: 30,
                priority: 3,
                seedLabel: 'Lost city inner sanctum — unfinished expedition, active guardians',
              },
              { kind: 'reputation_tally', key: 'ag.elite_work', delta: 3 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lost_city_document',
            label: 'The documentation is the achievement.',
            intent: 'What was found and recorded will outlast any single expedition.',
            effects: [
              {
                kind: 'intelligence',
                category: 'shrine_location',
                label: 'Lost city survey — location confirmed and outer district documented',
                detail: 'Layout of accessible areas, sealed sections, guardian types, and findings.',
                reliability: 0.85,
              },
              { kind: 'reputation_tally', key: 'ag.elite_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Join & Promotion Templates (TB-061) ────────────────────────────────

/**
 * Faction join encounter — appears at guild hall sublocations,
 * visible only to non-members (excludeIfMemberOf filter in questVisibility).
 */
export const FACTION_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'ag.join',
  name: 'Petition the Adventurers Guild',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'heart',
  crudType: 'create',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: FACTION_JOIN_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The guild hall in {location} buzzes with the particular noise of a place that ' +
        'takes competence seriously and respects few other virtues. ' +
        'A clerk looks up from the ledger as {name} approaches — not hostile, ' +
        'just evaluating. The clerk has done this a thousand times and has a ' +
        'very specific sense of what capable looks like at first impression.',
      successAfterimage: 'The clerk nods. "Sign the charter." Two words and the door is open.',
      failureAfterimage:
        '"Come back when you have something to show for yourself." ' +
        'The clerk\'s eyes are already back on the ledger.',
    },
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: FACTION_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.05,
      },
      failureMetadata: {
        reputationDelta: -0.01,
      },
      narrativeTemplate:
        'The guild charter lists the rights and obligations of membership in terms that ' +
        'are deliberately plain — the guild is not interested in fine print arguments. ' +
        '{name}\'s quill hovers. The name will join a register that stretches back ' +
        'further than the current building.',
      successAfterimage:
        '{name}\'s name joins the register. The clerk stamps the copy and hands it over ' +
        'without ceremony. The guild does not celebrate beginnings. That is earned later.',
      failureAfterimage:
        'A veteran at the adjacent table raises an objection — not personal, procedural, ' +
        'a point of charter. The clerk withdraws the document. ' +
        'The process closes before it completes.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} seeks membership in the Adventurers Guild at {location}. ' +
      'The clerk is not unkind. The process is simply what it is.',
    success:
      '{name} is now a Journeyman of the Adventurers Guild. ' +
      'The register holds the record. What follows is up to {them}.',
    failure:
      'Not today. The guild\'s door remains closed. ' +
      'What was lacking can presumably be addressed.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name} either belongs to the guild or doesn\'t. ' +
        'The hall in {location} continues its work either way.',
      changes: [
        {
          id: 'ag_join_membership',
          kind: 'reputation',
          title: 'Guild Membership',
          detail: 'Membership means access to contracts, resources, and the institutional knowledge of a working guild.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god see in this beginning?',
      reactions: [
        {
          id: 'ag_join_mark_entry',
          label: 'This is where it starts.',
          intent:
            'Entry to the guild is a threshold. The god marks it — not with intervention, ' +
            'just with attention. {name}\'s path as a guild member begins here.',
          effects: [
            { kind: 'reputation_tally', key: 'ag.guild_membership', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name} joins the Adventurers Guild in {location}. A door opens.',
              significance: 0.5,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

/**
 * Faction promotion encounter — appears when reputation >= next tier threshold.
 * Partial success mechanic: roll within PROMOTION_PARTIAL_SUCCESS_MARGIN of threshold → promoted with complication.
 */
export const FACTION_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'ag.promotion',
  name: 'Guild Promotion Trial',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 2 },
      difficulty: FACTION_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The guild masters have reviewed {name}\'s record and summoned {them} for the ' +
        'promotion trial. The review is not ceremonial — the guild promotes from demonstrated ' +
        'competence, not seniority, and the trial is designed to find the gap between ' +
        'what a record suggests and what the person can actually do. ' +
        '{name} has seen the process before, from the other side.',
      successAfterimage: '{name}\'s blade work and judgment impress the judging panel.',
      failureAfterimage:
        'The trial reveals a gap the record didn\'t show. Not a disqualifying one, ' +
        'but real. The panel notes it.',
    },
    {
      reach: 'heart',
      duration: { min: 1, max: 2 },
      difficulty: (FACTION_PROMOTION_DIFFICULTY + FACTION_DIFFICULTY_STEP) / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.06,
      },
      failureMetadata: {
        reputationDelta: -0.02,
      },
      narrativeTemplate:
        'The second part of the trial is not a test of skill but of character — ' +
        'a scenario that has no correct answer, only a least-wrong one, ' +
        'and the guild masters watch not for the outcome but for how {name} thinks ' +
        'when the outcome is genuinely uncertain.',
      successAfterimage:
        'The guild masters rise. No speech, no ceremony — just recognition that ' +
        '{name} has become what the next rank requires. The roster is updated.',
      failureAfterimage:
        'The masters confer in whispers that are not meant to be inaudible. ' +
        '"Not this time. Continue to prove yourself." The door is not closed, ' +
        'but it is not open today.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} faces the guild promotion trial. The record speaks well. ' +
      'The trial will speak for itself.',
    success:
      '{name}\'s rank advances. The guild\'s confidence is a quantifiable thing, ' +
      'and it has just gone up.',
    failure:
      'The promotion is deferred. {name} knows what the panel saw. ' +
      'That knowledge is worth more than the rank, if used correctly.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The trial is complete. {name} is either promoted or is not, ' +
        'and the guild\'s assessment is now part of {their} record.',
      changes: [
        {
          id: 'ag_promotion_rank',
          kind: 'reputation',
          title: 'Guild Rank',
          detail: 'Promotion is the guild\'s formal recognition that {name} has become something more.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god mark about this moment?',
      reactions: [
        {
          id: 'ag_promotion_mark_advance',
          label: '{name} has earned this.',
          intent:
            'The promotion is the guild\'s judgment and it is accurate. ' +
            'The god notes the advancement and what it implies about who {name} is becoming.',
          effects: [
            { kind: 'reputation_tally', key: 'ag.guild_membership', delta: 3 },
            {
              kind: 'recent_event',
              message: '{name} advances in rank within the Adventurers Guild. The guild\'s confidence in {them} has a new number.',
              significance: 0.6,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── Faction Social Templates (TB-062) ──────────────────────────────────

/**
 * 6 faction-scoped social encounters — only visible between agents
 * who share faction membership. These model guild camaraderie,
 * mentorship, competition, and shared purpose.
 */
export const FACTION_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  // 1. Sparring Match — iron/gold, cooperative training
  {
    id: 'ag.social.sparring',
    name: 'Guild Sparring Match',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'In the guild yard, practice blades are drawn without ceremony. ' +
          'A fellow adventurer meets {name}\'s eye and nods — the guild\'s vocabulary ' +
          'for "I want to see what you can do." Both parties understand that the ' +
          'bout will be remembered by whoever watches it. ' +
          '{?has_ally}Someone {name} respects is in the yard today. ' +
          'That changes nothing about the approach, but changes something about the stakes.{/has_ally}',
        successAfterimage: 'Blades clash in a rhythm of give and take. Both fighters sharpen their edge.',
        failureAfterimage:
          'A practice blade taps {name}\'s shoulder at the moment {they} wasn\'t{s} watching. ' +
          'The lesson is noted.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The bout intensifies as guild members gather to watch. The audience changes the ' +
          'texture of the exchange — both fighters know that what happens now will be ' +
          'described at dinner, and described accurately.',
        successAfterimage:
          'A clean win. Both fighters bow — the guild\'s way of marking that this was ' +
          'competitive and professional in equal measure. Something between them settles.',
        failureAfterimage:
          'Exhaustion lands before the decisive exchange. The bout ends without resolution, ' +
          'which the guild yard reads as a draw and {name} reads as unfinished business.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} engages a guildmate in a practice bout in {location}\'s guild yard. ' +
        'The guild trains itself this way: not in formal sessions but in pairs that choose each other.',
      success:
        'A clean bout, mutual respect intact. The guild yard absorbs it into its ongoing catalog of who can do what.',
      failure: 'The bout ends inconclusively. Tomorrow the yard will offer another chance.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The sparring match is over. The guild yard has a new data point about {name}\'s form.',
        changes: [
          {
            id: 'sparring_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'How you perform in training is how you\'re assigned in field work.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see in the bout?',
        reactions: [
          {
            id: 'sparring_note_potential',
            label: 'There\'s something to work with here.',
            intent:
              'The bout revealed capability that didn\'t show in the record. ' +
              'The god notes it for future attention.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'sparring_pass',
            label: 'Good practice. Nothing more.',
            intent: 'The bout is filed with the rest of the yard\'s ordinary work.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // 2. Tavern Tales — heart/eye, sharing stories
  {
    id: 'ag.social.tavern_tales',
    name: 'Share Tavern Tales',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE - 10) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild common room in {location} is warm in the way of rooms that have ' +
          'absorbed years of fire and food and the noise of people who have had difficult days. ' +
          'A fellow adventurer waves {name} over — the invitation is casual but not empty; ' +
          'in the guild, sharing a table is a form of recognition. ' +
          '{?has_ally}Someone {name} has worked with is already at the table. ' +
          'The conversation has a foundation before it starts.{/has_ally}',
        successAfterimage: 'Drinks flow and the evening opens up. The stories start.',
        failureAfterimage:
          'The conversation doesn\'t catch. {name}\'s companion is thinking about something else.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
          reputationDelta: 0.04,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The tales grow and the embellishments multiply, but there is a kind of ' +
          'accuracy in the pattern of them — the moments where the story shifts, ' +
          'where someone trails off, where the laugh comes a half-beat too late. ' +
          '{name} listens with the particular attention of someone who knows the difference ' +
          'between performance and information.',
        successAfterimage:
          'A nugget of genuine intelligence surfaces — not in the story itself, ' +
          'but in what the storyteller didn\'t quite say.',
        failureAfterimage:
          'Nothing but tall tales tonight. Entertaining. Not useful.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} trades stories with a guildmate in {location}\'s common room. ' +
        'The guild runs on this: shared experience accumulated across a hundred evenings like this one.',
      success:
        'An evening worth having. {name} leaves knowing something {they} didn\'t when {they} arrived.',
      failure: 'Good company, thin intelligence. Sometimes that\'s all it is.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The evening is what it was. The common room continues its work of turning ' +
          'isolated experiences into collective knowledge.',
        changes: [
          {
            id: 'tavern_tales_network',
            kind: 'reputation',
            title: 'Guild Network',
            detail: 'Shared evenings are the guild\'s informal intelligence network.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the god notice in the stories?',
        reactions: [
          {
            id: 'tavern_tales_intelligence',
            label: 'Something worth remembering was said.',
            intent:
              'The story contained real information — about a location, a person, ' +
              'a pattern that {name}\'s companion didn\'t realize they were sharing.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Tavern intelligence from guild exchange in {location}',
                detail: 'Operational details disclosed in casual storytelling — reliable as to observed facts.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'tavern_tales_pass',
            label: 'Good evening. Nothing to file.',
            intent: 'The evening was pleasant and the guild is stronger for the habit. No action needed.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // 3. Mentor Session — eye/heart, knowledge transfer
  {
    id: 'ag.social.mentor',
    name: 'Guild Mentorship',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A guildmate is struggling with something {name} has already solved. ' +
          'This is the guild\'s logic: experience is not privately held, it circulates. ' +
          '{name} has obligations here that aren\'t written in the charter but are understood ' +
          'by anyone who has been a member long enough to have been taught by someone else. ' +
          '{?has_faction}The guild formalizes this with the mentorship register — ' +
          'a public record of who taught whom, consulted in promotion assessments.{/has_faction}',
        successAfterimage: '{name}\'s instruction lands. The student\'s form improves visibly.',
        failureAfterimage: 'The lesson doesn\'t take. A different approach is needed.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#knowledge'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#knowledge'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Knowledge passes between guild members — not in a single lesson but in the ' +
          'slower transfer of understanding how to apply what {name} knows ' +
          'to circumstances {they} hasn\'t{s} encountered yet. ' +
          'The student will not remember the session; {they}\'ll{s} remember the first ' +
          'time {they} use{s} what was passed along here.',
        successAfterimage:
          'The session ends with something shifted between them — a relationship of ' +
          'teacher and student that doesn\'t end when the lesson does.',
        failureAfterimage:
          'Frustration wins out from both sides. The session ends with both parties ' +
          'dissatisfied and the gap between what was needed and what was given still present.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} offers guidance to a guildmate in {location}. ' +
        'The guild\'s strength is accumulated this way, session by session.',
      success:
        'The knowledge is transferred. The guild grows stronger by one additional person ' +
        'who knows what {name} knows.',
      failure: 'The lesson didn\'t land. The student will find another path to the knowledge.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The mentorship session is over. The guild\'s knowledge base is either ' +
          'slightly richer or exactly the same, depending on the outcome.',
        changes: [
          {
            id: 'mentor_session_standing',
            kind: 'reputation',
            title: 'Teaching Standing',
            detail: 'Teaching is how experienced guild members create more experienced guild members.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see pass between them?',
        reactions: [
          {
            id: 'mentor_session_bond',
            label: 'A connection was made that will matter later.',
            intent:
              'Teacher and student are connected now in the guild\'s informal web. ' +
              'What was given here will come back in a form neither party can predict.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
              {
                kind: 'encounter_seed',
                encounterFamily: 'ag.social',
                delayTicks: 10,
                priority: 1,
                seedLabel: 'Mentorship bond — student may seek {name} again in future',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mentor_session_log',
            label: 'Good work. The register notes it.',
            intent: 'The mentorship is recorded. The guild counts this.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // 4. Bounty Planning — shadow/iron, tactical coordination
  {
    id: 'ag.social.bounty_plan',
    name: 'Plan a Guild Bounty',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The bounty board is thick with postings, some of them months old. ' +
          'A fellow guild member leans in and starts pulling specific sheets — ' +
          'not the biggest prizes, the ones that have a shared pattern. ' +
          'Two minds reading the same board see different things. ' +
          '{?has_faction}The guild\'s internal posting system shows which bounties have been ' +
          'attempted and what the attempts found.{/has_faction}' +
          '{?no_faction}{name} and {their} companion work from the public postings only, ' +
          'which tells half the story.{/no_faction}',
        successAfterimage:
          'The pattern comes together across four postings. Someone is operating in a corridor, not randomly.',
        failureAfterimage:
          'The postings contradict each other in ways that suggest bad source data. No clear plan emerges.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The plan takes shape on the table between them: approach routes, ' +
          'timing, who handles which contingency, where the meeting point is if things ' +
          'go wrong. The guild trains this out of people — not the plan itself, ' +
          'but the discipline of making one with someone else.',
        successAfterimage:
          'Both guild members know their role. The plan has enough flexibility to survive ' +
          'first contact with reality.',
        failureAfterimage:
          'Disagreement on the tactical approach — not about facts but about risk tolerance, ' +
          'which is harder to resolve. The planning session dissolves into a professional impasse.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} plans a guild bounty with a fellow member in {location}. ' +
        'The guild values this: two people thinking through the same problem see more of it.',
      success:
        'The plan is solid. Both members know what they\'re doing and why. ' +
        'The bounty is ahead of them.',
      failure:
        'The planning failed to produce agreement. The bounty remains uncoordinated.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The planning session produced either a working plan or a disagreement — ' +
          'both are information the guild can use.',
        changes: [
          {
            id: 'bounty_plan_coordination',
            kind: 'reputation',
            title: 'Coordination Standing',
            detail: 'Guild members who plan well together get assigned together.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see in the planning?',
        reactions: [
          {
            id: 'bounty_plan_seed_hunt',
            label: 'The target is worth pursuing.',
            intent:
              'The plan produced something actionable. The god marks the target as worth ' +
              'following into the next stage.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'ag.quest',
                delayTicks: 5,
                priority: 2,
                seedLabel: 'Coordinated bounty plan — target identified, approach ready',
              },
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bounty_plan_log',
            label: 'Useful session. File it.',
            intent: 'The planning work is logged. The guild benefits from the coordination.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // 5. Share Maps — eye/gold, information exchange
  {
    id: 'ag.social.share_maps',
    name: 'Exchange Guild Intelligence',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Two guild members spread their field notes across a table in {location} — ' +
          'maps, route observations, hazard markings, and the kind of marginalia that ' +
          'doesn\'t make it into the formal survey but is often more useful. ' +
          'The exchange works because each set of notes covers different ground. ' +
          '{name} reads {their} companion\'s work with the attention of someone ' +
          'who knows what to look for in another person\'s fieldwork.',
        successAfterimage: 'Gaps in each set of notes are filled by the other. Both improve.',
        failureAfterimage:
          'The maps cover different regions with minimal overlap. ' +
          'The exchange produces goodwill but little practical improvement.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: FACTION_SOCIAL_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#knowledge'],
          },
          reputationDelta: 0.04,
        },
        failureMetadata: {
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Good intelligence has value, and both parties know it. ' +
          'The terms of exchange are informal — the guild doesn\'t require symmetry, ' +
          'only good faith — but {name} reads whether {their} companion is giving ' +
          'value or extracting it.',
        successAfterimage:
          'A fair exchange. Both adventurers leave with better maps than they brought. ' +
          'The guild\'s collective knowledge improved by two contributions.',
        failureAfterimage:
          'One party feels the exchange was one-sided. ' +
          'The maps are traded but the goodwill isn\'t.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} exchanges field notes and maps with a guildmate in {location}. ' +
        'The guild\'s aggregate intelligence is better than any individual\'s.',
      success:
        'Both maps are improved. The guild\'s picture of the territory around {location} sharpens.',
      failure: 'The exchange ends awkwardly. The guild\'s picture doesn\'t change much.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The intelligence exchange is complete. The guild has marginally better ' +
          'information about the territory, and {name} has a clearer picture of {their} routes.',
        changes: [
          {
            id: 'share_maps_intel',
            kind: 'item',
            title: 'Updated Field Intelligence',
            detail: 'Combined field notes cover more ground than either set alone.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the maps reveal?',
        reactions: [
          {
            id: 'share_maps_intelligence',
            label: 'This changes the picture of the region.',
            intent:
              'What was exchanged contains information that shifts the strategic picture ' +
              'around {location} — routes, hazards, or activity patterns not previously known.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Combined field intelligence from guild map exchange in {location}',
                detail: 'Routes, hazards, and terrain features verified by two independent observers.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'share_maps_log',
            label: 'Good exchange. Nothing further.',
            intent: 'The maps are updated. The guild benefits quietly.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // 6. Guild Rivalry — iron/heart, competitive tension
  {
    id: 'ag.social.rivalry',
    name: 'Guild Rivalry',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Tension simmers between guild members — not the disorganized kind, ' +
          'but the specific friction of two capable people occupying the same space in ' +
          'the assignment hierarchy. A public challenge is issued: who performs better ' +
          'at the task the guild values most. The yard gathers without anyone announcing it. ' +
          '{?has_faction}The guild values rivalry the way it values sparring: ' +
          'it sharpens both parties if it stays professional.{/has_faction}',
        successAfterimage:
          '{name}\'s demonstration of skill makes the comparison unfavorable for the challenger.',
        failureAfterimage:
          '{name}\'s rival outperforms on the day. The crowd registers it.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 2 },
        difficulty: (FACTION_SOCIAL_DIFFICULTY_BASE + FACTION_SOCIAL_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.04,
        },
        narrativeTemplate:
          'The rivalry demands resolution — not a definitive answer about who is better, ' +
          'but an acknowledgment of what each person\'s performance means to the guild. ' +
          'The final stage is not another skill test but a public reckoning: ' +
          'how {name} handles the outcome, whatever it is.',
        successAfterimage:
          'Grudging respect replaces hostility. The rivalry becomes the kind of spur ' +
          'that makes both parties better. The guild values this outcome.',
        failureAfterimage:
          'The rivalry festers into something less useful. Both parties lose standing ' +
          'in the guild\'s eyes — not for losing, but for how the loss lands.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is drawn into a guild rivalry in {location} — the kind that ' +
        'the institution tolerates because it can produce excellence, and regrets when it doesn\'t.',
      success:
        'The rivalry resolves into mutual respect. The guild is better for it.',
      failure: 'The rivalry sours. The guild notes that it went the wrong direction.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The rivalry has resolved into something — respect, resentment, or simple conclusion. ' +
          'The guild takes the measure of how both parties handled it.',
        changes: [
          {
            id: 'rivalry_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'Rivalries test not just skill but character. The outcome tells the guild something important.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the god see in the rivalry\'s end?',
        reactions: [
          {
            id: 'rivalry_productive',
            label: 'The rivalry sharpened them both.',
            intent:
              'The competition produced exactly what the guild hopes rivalries produce: ' +
              'two people who push each other to be better.',
            effects: [
              { kind: 'reputation_tally', key: 'ag.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'rivalry_note_friction',
            label: 'This friction has a cost.',
            intent:
              'The rivalry is unresolved beneath its surface resolution. ' +
              'It will surface again, probably at a worse moment.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.2,
                label: 'Guild rivalry — competitive tension with a fellow member, not fully resolved',
                revealFamilies: ['ag.social', 'ag.quest'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────

/** All faction lifecycle templates (join, promotion) — separate from quest templates. */
export const FACTION_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  FACTION_JOIN_TEMPLATE,
  FACTION_PROMOTION_TEMPLATE,
];

/**
 * Look up a faction encounter template by ID (quests + lifecycle + social).
 * All AG templates are now UnifiedActionTemplate (migrated THR-102).
 */
export function getFactionEncounterById(id: string): UnifiedActionTemplate | undefined {
  return (
    FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? FACTION_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? FACTION_SOCIAL_TEMPLATES.find(t => t.id === id)
  );
}

/**
 * Get all faction template IDs for a given definition.
 */
export function getFactionTemplateIds(factionDefId: string): string[] {
  return [...FACTION_ENCOUNTER_META.entries()]
    .filter(([, meta]) => meta.factionDefId === factionDefId)
    .map(([id]) => id);
}
