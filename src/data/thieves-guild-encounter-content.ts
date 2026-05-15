/**
 * Thieves Guild Encounter Content — migrated to UnifiedActionTemplate (THR-89).
 *
 * Quest, social, join, and promotion templates for the thieves guild.
 * All 15 legacy EncounterTemplate entries rewritten to UnifiedActionTemplate
 * format with Threadbare-aesthetic prose, enrichment placeholders, and
 * contextual aftermath (hidden marks for witnessed acts, intelligence grants
 * for reconnaissance, encounter seeds for consequences that echo forward).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';

// ─── Constants ───────────────────────────────────────────────────────────

const TG_DIFFICULTY_BASE = 25;
const TG_DIFFICULTY_STEP = 10;
const TG_SENIOR_BASE = 40;
const TG_ELITE_BASE = 55;
const TG_JOIN_DIFFICULTY = 20;
const TG_PROMOTION_DIFFICULTY = 35;
/** Social / background encounter difficulty: TG_DIFFICULTY_BASE − 5 */
const TG_SOCIAL_DIFFICULTY = TG_DIFFICULTY_BASE - 5;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const THIEVES_GUILD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['tg.join', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.0, questType: 'standard' }],
  ['tg.promotion', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['tg.quest.pocket_run', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.fence_goods', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.case_the_mark', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.04, questType: 'standard' }],
  ['tg.quest.warehouse_raid', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.05, questType: 'standard' }],
  ['tg.quest.blackmail_ledger', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['tg.senior.jewel_heist', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  ['tg.senior.smuggler_route', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  ['tg.senior.noble_con', { factionDefId: 'thieves_guild', minRank: 'shadowblade', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['tg.elite.vault_break', { factionDefId: 'thieves_guild', minRank: 'guildmaster', reputationReward: 0.08, questType: 'elite' }],
  ['tg.elite.shadow_war', { factionDefId: 'thieves_guild', minRank: 'guildmaster', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['tg.social.dice_game', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
  ['tg.social.fence_deal', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
  ['tg.social.rumor_trade', { factionDefId: 'thieves_guild', minRank: 'pickpocket', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const THIEVES_GUILD_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Standard Quests (Pickpocket+) ──────────────────────────────────

  withEncounterContract({
    id: 'tg.quest.pocket_run',
    name: 'Pocket Run',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} takes a post near the cloth-seller\'s stall where {location}\'s foot traffic crosses. ' +
          'The market moves in patterns if you know how to read them — the pause before a purse opens, ' +
          'the way a merchant\'s eyes track left when making change. ' +
          '{?has_faction}The guild marked this square as active. Three clean lifts this week, ' +
          'which means the merchants haven\'t adjusted yet.{/has_faction}' +
          '{?no_faction}No guild intelligence to lean on. Just eyes, timing, and ' +
          'the particular arithmetic of crowds.{/no_faction}',
        successAfterimage: '{name} identifies several viable marks in the crowd.',
        failureAfterimage: 'The crowd is thin and watchful. No easy marks today.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.25, bestowed_power: 0.15 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Wrist-turn, two fingers, gone before the mark\'s hand reaches the empty pocket. ' +
          '{name} keeps walking — not fast, not slow, just someone else in the current. ' +
          'Looking back is how you get remembered. In this trade, being forgotten is the highest skill.',
        successAfterimage: 'A clean lift. {name} clears the market without a second glance.',
        failureAfterimage:
          'The mark stiffens. {name} is already moving, already someone else — ' +
          'but the haul stays in the mark\'s pocket.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} works {location}\'s market crowd, reading the flow of coin and choosing {their} moment. ' +
        'The guild expects results. The crowd doesn\'t know it\'s a classroom.',
      success:
        'A clean haul. The guild nods. In their vocabulary, that\'s almost effusive.',
      failure:
        'The lift goes wrong. {name} walks away clean — no arrest, no pursuit — ' +
        'but the take stays in the mark\'s pocket.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The market continues its commerce, indifferent. Whatever passed in the crowd ' +
          'is now part of {location}\'s ordinary morning — filed away in the particular ledger ' +
          '{name} keeps of jobs done and lessons taken.',
        changes: [
          {
            id: 'pocket_run_guild_standing',
            kind: 'reputation',
            title: 'Guild Standing',
            detail: 'Clean work builds standing. A witnessed fumble costs it.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god keep from the market crowd?',
        reactions: [
          {
            id: 'pocket_run_let_pass',
            label: 'Let the moment pass.',
            intent:
              'The god observes and releases. The market absorbs the encounter into its ordinary noise. ' +
              '{name} carries the lesson forward unobserved.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'pocket_run_mark_witness',
            label: 'Someone saw.',
            intent:
              'A face in the crowd registered something. The mark, a stall-keeper, a guard leaning on a post. ' +
              'That memory sits in {location}\'s market until the right encounter asks about it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.3,
                label: 'Witnessed near a theft at market — face registered by bystander',
                revealFamilies: ['civic_guard', 'investigation', 'tg.quest'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.quest.fence_goods',
    name: 'Fence Stolen Goods',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: TG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The take is spread across a worn table in a back room that smells of tallow and old transactions. ' +
          '{name} picks up each piece and sets it down without comment. ' +
          '{?has_faction}Guild training covers this: never show excitement, never show disappointment, ' +
          'never let a fence read your face.{/has_faction}' +
          '{?no_faction}No guild backing {them} in this room — just {their} own judgment ' +
          'against the fence\'s practiced eye.{/no_faction}',
        successAfterimage: '{name} values the take accurately. Good leverage going in.',
        failureAfterimage: '{name} misjudges the value. The fence will smell weakness.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The fence in {location} names a price like it\'s the only price there is. It isn\'t. ' +
          '{name} waits. The silence does the rest — the unhurried calm of someone who doesn\'t ' +
          'need this deal to close today.',
        successAfterimage: 'A fair split. Both parties know their roles.',
        failureAfterimage: 'The fence takes the floor. {name} walks out with thin coin for risky work.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} arrives at the fence\'s back room with a sack of goods and a number in {their} head. ' +
        'The fence has a number too. One of them will be closer to right.',
      success:
        'Fair price, clean split. The guild is pleased with {their} returns.',
      failure:
        'The fence won the table. Thin coin for work that carried real risk.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The back room empties. The deal is done or it isn\'t. ' +
          'The fence is already thinking about the next transaction.',
        changes: [
          {
            id: 'fence_goods_relation',
            kind: 'reputation',
            title: 'Fence Relationship',
            detail: 'A good deal builds a standing arrangement. A bad one costs leverage.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What thread runs forward from this deal?',
        reactions: [
          {
            id: 'fence_goods_standing_arrangement',
            label: 'Build the connection.',
            intent:
              'A reliable fence is worth cultivating. The god notes this contact — someone who ' +
              'moves goods in {location} without asking where they came from.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Fence contact in {location}',
                detail: 'A reliable buyer for acquired goods — no questions, reasonable splits.',
                reliability: 0.75,
              },
              {
                // Returning thief building a fence relationship — reads the route's
                // ledger through the lens of who moves what through {location}.
                kind: 'intel_referenced_prose',
                category: 'trade_route',
                prose: {
                  reliable: '{name} read the caravan\'s rhythm exactly as the route notes had described — waystation timings held, the merchants\' debts owed in the directions remembered.',
                  uncertain: '{name} worked the caravan\'s pace partly from the marked schedule, partly from the dust on the road — the recognition was uneven but workable.',
                  dubious:
                    '{name} reached for the fence\'s known back-routes and found the trade had moved — different waystations, different prices, the rumor describing a season already over.',
                },
              },
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'fence_goods_release',
            label: 'A transaction, nothing more.',
            intent: 'Coin changes hands. The god lets the exchange be what it is.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.quest.case_the_mark',
    name: 'Case the Mark',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 3 },
        difficulty: TG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A wealthy merchant needs watching. {name} takes up a position across from {their} premises ' +
          'in {location} — unremarkable, patient, a figure that could be anyone waiting for anyone. ' +
          '{?has_ally}{ally:strongest} could cover the east approach while {name} watches the front, ' +
          'but {name} doesn\'t ask. Fewer witnesses means cleaner intelligence.{/has_ally}' +
          '{?no_ally}Alone means slower, but it also means the only eyes on this are {their} own.{/no_ally}',
        successAfterimage: '{name} maps the schedule — every guard shift, every delivery window.',
        failureAfterimage: 'The target moves erratically. No pattern emerges today.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'With the routine known, {name} moves on the approach — testing the back passage, ' +
          'timing the gap in the guard\'s circuit, checking which windows are latched and which ' +
          'are merely pulled closed. Every detail is a door.',
        successAfterimage: 'A back window, a guard\'s blind corner. The route is charted.',
        failureAfterimage:
          'Every entry is watched or warded. The job needs more time, or better tools, or both.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} puts {their} eyes on a wealthy merchant in {location}, learning the gaps ' +
        'in the routine before committing to a plan. Patient work. Invisible work.',
      success:
        'The schedule is mapped. The entry is found. The job exists now as a problem with a solution.',
      failure:
        'The target is careful, or lucky, or both. Every angle is covered.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The merchant goes about their day, unaware that their movements have been catalogued. ' +
          'The intelligence is complete or it isn\'t — but either way, {name} knows more about ' +
          'this mark than the mark would be comfortable with.',
        changes: [
          {
            id: 'case_mark_intel',
            kind: 'future_hook',
            title: 'Target Intelligence',
            detail: 'Schedule, entry points, guard rotation — this information has a window before it goes stale.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god do with what was learned?',
        reactions: [
          {
            id: 'case_mark_file_intel',
            label: 'File the intelligence.',
            intent:
              'The surveillance produced something usable. The god preserves the detail — ' +
              'layout, schedule gaps, the guard who spends too long at the east corner. ' +
              'This knowledge has a shelf life.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Mark target profile — schedule and entry vulnerability',
                detail: 'Guard rotation, delivery windows, structural weaknesses. Stale after ~15 ticks.',
                reliability: 0.8,
              },
              {
                // Casing a mark with prior agent_network intel — who in the social
                // geometry around the target is bargaining, who is pretending.
                kind: 'intel_referenced_prose',
                category: 'agent_network',
                prose: {
                  reliable: '{name} found the contacts where the dossier said they would be — names accurate, schedules accurate, the social geometry of {location} unchanged.',
                  uncertain: '{name} arrived with names that had been right once — most still were, and the introductions found their way through the gaps in the map.',
                  dubious: '{name} reached for the contacts the rumor had named, and reached past them — the network had reformed around different centers, and the old map ended in dead corners.',
                },
              },
              {
                kind: 'encounter_seed',
                templateId: 'tg.quest.warehouse_raid',
                delayTicks: 8,
                seedLabel: 'The casing job opens a window for the follow-up',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'case_mark_silent',
            label: 'The god watches and says nothing.',
            intent: 'The intelligence exists. The god releases the thread.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.quest.warehouse_raid',
    name: 'Warehouse Raid',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The warehouse at the edge of {location}\'s merchant quarter is sealed tight — ' +
          'iron padlocks, fresh ones, the kind that say someone has been burned before. ' +
          '{name} crouches at the side door with picks and the particular patience ' +
          'this kind of work demands. ' +
          '{?has_artifact}The tools {they} carry{s} are good ones — not guild-issue, better. ' +
          '{artifact:any} sits quiet in {their} pack, waiting for harder problems.{/has_artifact}',
        successAfterimage: 'The lock yields. {name} slips inside.',
        failureAfterimage: 'The lock resists. Better tools, or a different door.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#shadow', '#contraband'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Inside the warehouse. Stacked crates, the smell of sawdust and old oil, a lantern burning low ' +
          'somewhere in the back that shouldn\'t be lit at this hour. {name} takes what {they} can{s} carry ' +
          'and moves toward the door. Speed now, silence later.',
        successAfterimage: 'A clean job. The crates are lighter and the night stays quiet.',
        failureAfterimage:
          'A watchman rounds the corner with a lantern. {name} drops the goods and runs.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} moves on a {location} warehouse after dark — break the lock, take what fits, ' +
        'vanish before the night watch completes its circuit.',
      success: 'A clean job. Nobody knows. The guild takes its cut.',
      failure: 'The watchman\'s lantern catches the movement. {name} runs empty-handed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Whether the crates were lightened or the plan fell apart, the warehouse exists in ' +
          '{location}\'s commercial district with a new story attached to it — one that the ' +
          'merchant owners don\'t yet know how to read.',
        changes: [
          {
            id: 'warehouse_raid_exposure',
            kind: 'reputation',
            title: 'Exposure Risk',
            detail: 'A clean job leaves no evidence. A broken job leaves footprints.',
            polarity: 'mixed',
          },
          {
            id: 'warehouse_raid_witness',
            kind: 'future_hook',
            title: 'Watchman\'s Memory',
            detail: 'Whether the job succeeded or failed, someone may have seen something.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god mark in the aftermath of the warehouse?',
        reactions: [
          {
            id: 'warehouse_raid_clean_break',
            label: 'No trace, no thread.',
            intent:
              'The god covers the exit. Whatever happened in that warehouse stays there — ' +
              'no witness strong enough to name a face, no evidence specific enough to pursue.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'warehouse_raid_seed_pursuit',
            label: 'The watchman remembers a face.',
            intent:
              'The night watch saw enough. Not enough for an arrest — but enough for a report, ' +
              'and reports have a way of finding the right desk eventually.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.5,
                label: 'Warehouse break-in — watchman partial identification',
                revealFamilies: ['civic_guard', 'investigation', 'tg.quest'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'civic_guard',
                delayTicks: 12,
                seedLabel: 'The warehouse report reaches the guard post',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.quest.blackmail_ledger',
    name: 'Blackmail Ledger',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A noble in {location} keeps records that would ruin careers if they became public. ' +
          'The guild wants a copy. {name} enters through the servants\' passage — unhurried, ' +
          'carrying nothing that raises questions, wearing the expression of someone who belongs ' +
          'in this house and is mildly irritated at having to be here. ' +
          '{?has_faction}The guild briefed {them} on the household schedule. ' +
          'The cook takes her supper break at the seventh bell.{/has_faction}',
        successAfterimage: '{name} slips past the servants and finds the study.',
        failureAfterimage: 'A locked inner door. The route needs a different approach.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 3 },
        difficulty: (TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#shadow', '#blackmail_evidence'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The ledger is on the desk, spine cracked from use, ink bled through three pages. ' +
          '{name} copies the key entries by the window\'s light — names, dates, ' +
          'amounts that don\'t match any official accounting. ' +
          'Some of the figures are large enough to be interesting to people with the right kind of interest.',
        successAfterimage: 'Damning entries copied. The guild has leverage in {location}.',
        failureAfterimage:
          'Footsteps in the hall. {name} flees with only fragments — enough to be interesting, not enough to be decisive.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} infiltrates a {location} noble\'s study to copy a ledger that ' +
        'the guild has decided is worth knowing about. ' +
        'Damaging records are only leverage when someone has read them.',
      success:
        'The entries are copied. The guild holds something over someone powerful now.',
      failure:
        'The household stirred too early. {name} retreats with partial work.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The study is as it was. The ledger sits in its place on the desk. ' +
          'Whether the copy was completed or abandoned, the noble doesn\'t yet know ' +
          'that anyone has been reading their private arithmetic.',
        changes: [
          {
            id: 'blackmail_ledger_intel',
            kind: 'item',
            title: 'Ledger Contents',
            detail: 'Documented connections, payments, arrangements — someone\'s exposure.',
            polarity: 'gain',
          },
          {
            id: 'blackmail_ledger_footprint',
            kind: 'future_hook',
            title: 'Study Entry',
            detail: 'A break-in the noble hasn\'t discovered yet. Discovery is a matter of when, not if.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The guild holds a thread. How tightly does it pull?',
        reactions: [
          {
            id: 'blackmail_ledger_file_secrets',
            label: 'The ledger\'s secrets persist.',
            intent:
              'What was copied — or what {name} glimpsed — is politically alive. ' +
              'Names and figures that connect people who prefer not to be connected.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Noble ledger — undisclosed payments and connections in {location}',
                detail: 'Names, dates, amounts. Cross-references against official records would be illuminating.',
                reliability: 0.85,
              },
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.6,
                label: '{name} holds damaging information about a noble in {location}',
                revealFamilies: ['investigation', 'tg.quest', 'social'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'blackmail_ledger_silent',
            label: 'The guild keeps its own counsel.',
            intent: 'The leverage is noted and filed. No thread is extended — yet.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Senior Quests (Shadowblade+) ─────────────────────────────────

  withEncounterContract({
    id: 'tg.senior.jewel_heist',
    name: 'The Jewel Heist',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    description:
      'A master jeweler keeps a fortune behind wards and iron — the kind of security ' +
      'that announces itself. {name} reads the defenses, bypasses the magic, and ' +
      'reaches into the display case before anyone knows the case was open.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 3 },
        difficulty: TG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The jeweler\'s shop on {location}\'s commerce row has the particular stillness ' +
          'of a place that takes its security seriously. {name} passes it three times across ' +
          'two days — a browser, a delivery messenger, someone lost. ' +
          '{?has_faction}The guild has tried this address before and walked away. ' +
          '{name} is not walking away.{/has_faction}' +
          '{?no_faction}No guild briefing, no prior attempts on record. Just observation and inference.{/no_faction}',
        successAfterimage: '{name} finds the weak point — a window, a schedule gap, a ward that flickers at the hour change.',
        failureAfterimage: 'The security is thorough. Every angle is covered.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: (TG_SENIOR_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Magical wards protect the display case — the kind that don\'t alarm loudly, ' +
          'just record. {name} works at the ward geometry with patience and the specialized ' +
          'knowledge that separates guild-trained operatives from talented amateurs. ' +
          'Finesse, not force. Force trips the loud alarms.',
        successAfterimage: 'The wards go dark. The case is vulnerable.',
        failureAfterimage:
          'The ward shifts, not triggers — but the case is now counting down. Time is contracting.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: (TG_SENIOR_BASE + TG_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'The jewels catch the low light — cut stones that cost more than most people earn ' +
          'in a year, sitting in velvet trays as though they were waiting specifically for this moment. ' +
          '{name} doesn\'t linger. The professional appreciation for beautiful things ' +
          'and the professional need to be gone from them are the same muscle.',
        successAfterimage: 'A perfect heist. The gems are gone before the ward resets.',
        failureAfterimage: 'Guards close in. The gems stay. {name} exits without them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A master jeweler, a display case behind magical wards, and a fortune in cut stones. ' +
        '{name} has spent two days reading the security. Tonight, {they} test{s} the reading.',
      success:
        'Clean from start to finish. The guild celebrates the craft as much as the haul.',
      failure:
        'Close — but close is how you get caught. {name} surfaces empty-handed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The jeweler will discover the loss in the morning. Or maybe the afternoon — ' +
          'the ward reset may conceal the break-in for hours. However it reads, someone ' +
          'knows that someone else got through security that wasn\'t supposed to be passable.',
        changes: [
          {
            id: 'jewel_heist_reputation',
            kind: 'reputation',
            title: 'Craft Reputation',
            detail: 'A successful heist on a warded target elevates standing in the guild\'s hierarchy.',
            polarity: 'gain',
          },
          {
            id: 'jewel_heist_exposure',
            kind: 'future_hook',
            title: 'Guard Investigation',
            detail: 'Warded premises that get breached trigger formal investigations.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The heist is finished. What follows it?',
        reactions: [
          {
            id: 'jewel_heist_clean_vanish',
            label: 'Vanish completely.',
            intent:
              'The god smooths the exit — no threads, no witnesses who can say they saw ' +
              'anything specific. The heist becomes a mystery the jeweler will carry for years.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.master_thief', delta: 2 },
              {
                kind: 'recent_event',
                message: 'The jewel heist in {location} is discussed in guild circles. A clean job.',
                significance: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'jewel_heist_investigation_seeded',
            label: 'The investigation will ask questions.',
            intent:
              'The ward breach was documented before it went dark. A guard post received a report. ' +
              'Somewhere in {location}\'s civic machinery, a file is being opened.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.master_thief', delta: 2 },
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.6,
                label: 'Jewel heist — partial ward-breach record exists',
                revealFamilies: ['civic_guard', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'civic_guard',
                delayTicks: 15,
                seedLabel: 'The warded jeweler\'s report reaches the investigator\'s desk',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.senior.smuggler_route',
    name: 'Establish Smuggler Route',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 3 },
        difficulty: TG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The guild needs a new route past {location}\'s customs — the old one has been ' +
          'watched since last season. {name} identifies the right customs officer: not the most ' +
          'corrupt, which invites competition, but the one who has just enough debt and just enough ' +
          'discretion to be a reliable partner. ' +
          '{?has_faction}The guild has used this approach before in other cities. ' +
          'It works until it doesn\'t, and then it works again with different people.{/has_faction}',
        successAfterimage: 'A customs officer accepts the arrangement. The gate is open.',
        failureAfterimage: 'The official is principled, frightened, or already watched. Another approach is needed.',
      },
      {
        reach: 'shadow',
        duration: { min: 2, max: 4 },
        difficulty: (TG_SENIOR_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'A small test shipment goes through — nothing that would justify a serious ' +
          'investigation if seized, but enough to prove the route is real. ' +
          '{name} watches from a distance as the cart clears the checkpoint. ' +
          '{?has_ally}Somewhere in the flow of ordinary commerce, {ally:strongest} holds ' +
          'the second end of this arrangement.{/has_ally}',
        successAfterimage: 'The goods pass without inspection. Route established.',
        failureAfterimage: 'The shipment is seized. The route is compromised before it opened.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} bribes a customs official and runs a test shipment to prove the route works. ' +
        'Infrastructure, not adventure — but the guild pays well for reliable infrastructure.',
      success: 'The route is open. The guild has a new lane through {location}\'s customs.',
      failure: 'The shipment is seized. The investment in bribes is now a liability.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Whether the route opened or closed, the customs officer who was approached ' +
          'now carries a secret. Cooperative or refused, {they} know{s} someone tried.',
        changes: [
          {
            id: 'smuggler_route_open',
            kind: 'future_hook',
            title: 'Route Status',
            detail: 'An open route generates ongoing opportunity. A failed approach generates ongoing risk.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'How does the god read the route\'s future?',
        reactions: [
          {
            id: 'smuggler_route_establish',
            label: 'The route is a resource.',
            intent:
              'A working smuggler\'s route through {location} is not just one job — it\'s ' +
              'a recurring capability. The god marks it as a structural asset.',
            effects: [
              { kind: 'clearance_gate_tag', tag: 'tg.smuggler_route_open' },
              { kind: 'reputation_tally', key: 'tg.guild_infrastructure', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'smuggler_route_rivals_notice',
            label: 'Rivals will hear about this.',
            intent:
              'A new customs arrangement in {location} is not invisible to those who already ' +
              'profit from the existing arrangements. Someone will push back.',
            effects: [
              { kind: 'clearance_gate_tag', tag: 'tg.smuggler_route_open' },
              {
                kind: 'encounter_seed',
                encounterFamily: 'tg.quest',
                delayTicks: 20,
                seedLabel: 'A rival operation in {location} notices the new customs arrangement',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.senior.noble_con',
    name: 'The Noble Con',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    description:
      'To con a noble, you must become one — forged documents, borrowed manners, ' +
      'and the particular nerve required to sit at a table with people who know how ' +
      'everything should look and notice when it doesn\'t.',
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 3 },
        difficulty: TG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} constructs a noble identity from the outside in: the papers first, ' +
          'then the signet impression, then the story that connects them. ' +
          'The cover is a minor noble from a distant holding, specific enough to be convincing, ' +
          'obscure enough that nobody in {location} will have met them. ' +
          '{?has_faction}The guild has a forger who works fast and well. ' +
          '{name} pays above the standard rate for silence about the client.{/has_faction}' +
          '{?no_faction}{name} works alone — slower, more exposed, but no one else knows the face ' +
          'behind the papers.{/no_faction}',
        successAfterimage: 'Convincing documents. Even a herald would nod.',
        failureAfterimage: 'The forgery has flaws that a careful eye will catch.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 3 },
        difficulty: (TG_SENIOR_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
          reputationDelta: -0.03,
        },
        narrativeTemplate:
          'The noble\'s receiving room smells of candle wax and old money. ' +
          '{name} enters as someone else — posture, diction, the particular boredom of someone ' +
          'who has always had enough. The target talks. People with old money like having ' +
          'someone new to impress, and impressive things are often true things.',
        successAfterimage:
          '{name} extracts what was needed and exits before anyone compares the signet against a reference.',
        failureAfterimage:
          'A courtier\'s expression changes — not accusation yet, but the precise shade ' +
          'of suspicion that precedes it. {name} exits before it solidifies.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} builds a noble identity and walks it into a {location} court to extract ' +
        'what the guild needs. The performance must hold through the whole meeting.',
      success:
        '{name} leaves the court richer in coin and secrets. The target never suspected.',
      failure:
        'The cover frays at the wrong moment. {name} exits cleanly, but empty-handed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The noble\'s court continues its business. Whether the con succeeded or failed, ' +
          'a stranger passed through {location}\'s upper registers with forged papers, ' +
          'and someone in that room may be remembering the encounter with increasing clarity.',
        changes: [
          {
            id: 'noble_con_secrets',
            kind: 'item',
            title: 'Court Intelligence',
            detail: 'What a noble says to an apparent peer is less guarded than what they say to anyone else.',
            polarity: 'gain',
          },
          {
            id: 'noble_con_exposure',
            kind: 'future_hook',
            title: 'False Identity',
            detail: 'A court that was conned will investigate the gap eventually.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The con is complete or collapsed. What does the god keep?',
        reactions: [
          {
            id: 'noble_con_intelligence',
            label: 'The court conversation is worth recording.',
            intent:
              'What the noble said — names, arrangements, obligations — is politically live. ' +
              'Courts talk. The things said at these tables have consequences beyond the room.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Noble court session — disclosed connections and obligations',
                detail: 'Arrangements mentioned in passing that wouldn\'t appear in official correspondence.',
                reliability: 0.8,
              },
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.5,
                label: '{name} posed as a noble in {location} — forged documents in circulation',
                revealFamilies: ['investigation', 'social', 'civic_guard'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'noble_con_burn_cover',
            label: 'The identity is spent.',
            intent:
              'The forged papers and the noble persona are retired. That door closes. ' +
              'A clean exit — the con happened, it\'s over, the guild has what it needed.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Elite Quests (Guildmaster+) ────────────────────────────────────

  withEncounterContract({
    id: 'tg.elite.vault_break',
    name: 'The Vault Break',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    description:
      'The capital vault. Guards, wards, iron doors, and a fortune that nobody has ' +
      'ever successfully extracted. Three phases: map the defenses, assemble the crew, ' +
      'and crack the vault before dawn. Everything rides on this.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 4 },
        difficulty: TG_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The city vault in {location} holds a fortune that everyone knows about ' +
          'and no one has ever successfully touched. {name} spends three days cataloguing ' +
          'every guard rotation, every ward pulse, every maintenance window. ' +
          '{?has_faction}The guild\'s prior intelligence is a starting point, not a plan. ' +
          'What was true two seasons ago may not hold now.{/has_faction}' +
          '{?no_faction}No guild backing for this one — just {name}\'s eyes, {their} patience, ' +
          'and the particular arrogance of believing the vault is solvable.{/no_faction}',
        successAfterimage: 'Every defense is catalogued. The vault has a shape now.',
        failureAfterimage: 'The security is deeper than anticipated. The map is incomplete.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 3 },
        difficulty: (TG_ELITE_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The vault needs specialists. {name} spends the next day finding them — ' +
          'a lockpick who has worked warded mechanisms, a lookout who can read a guard\'s ' +
          'body language from forty paces, a tunneler who knows {location}\'s subterranean routes ' +
          'well enough to navigate blind. Every name is a risk. Every refusal is a leak.',
        successAfterimage: 'Lockpick, lookout, tunneler. The crew is assembled.',
        failureAfterimage: 'Key specialists decline. The risk calculation doesn\'t add up for them.',
      },
      {
        reach: 'shadow',
        duration: { min: 2, max: 4 },
        difficulty: (TG_ELITE_BASE + TG_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
          reputationDelta: -0.05,
        },
        narrativeTemplate:
          'Night falls over {location}. The crew moves. The vault door is everything ' +
          'they\'ve heard it is — and everything they\'ve prepared for. {name} works by ' +
          'feel and memory, trusting the plan exactly as far as the plan holds, ' +
          'and {their} instincts for the rest.',
        successAfterimage: 'The vault opens. A legend is born in the underworld tonight.',
        failureAfterimage: 'Alarms. The crew scatters. A costly failure that the guild will discuss for seasons.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} moves on {location}\'s capital vault — map the defenses, build the crew, ' +
        'crack the door before dawn. The kind of job that ends careers or defines them.',
      success:
        'The vault falls. {name}\'s name joins a short list of people who have done what everyone ' +
        'else said couldn\'t be done.',
      failure:
        'The alarms sound. The crew scatters. The vault stays closed, and the night ' +
        'becomes a lesson in what almost worked.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The vault break is over — complete or collapsed. Either way, {location}\'s ' +
          'authorities are asking questions that didn\'t exist before tonight. ' +
          'The guild\'s network is buzzing. A job at this scale leaves marks ' +
          'whether or not it succeeded.',
        changes: [
          {
            id: 'vault_break_legend',
            kind: 'reputation',
            title: 'Underworld Standing',
            detail: 'A successful vault break elevates {name} to legend. A failed attempt still earns respect for trying.',
            polarity: 'gain',
          },
          {
            id: 'vault_break_investigation',
            kind: 'future_hook',
            title: 'City Investigation',
            detail: 'A vault breach triggers serious official investigation regardless of what was taken.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The vault break is done. What thread does the god pull forward?',
        reactions: [
          {
            id: 'vault_break_silent_legend',
            label: 'Let the story spread quietly.',
            intent:
              'In the guild\'s circles, what happened tonight will be known. ' +
              'The god steps back and lets the word travel — {name}\'s reputation building ' +
              'without drawing official attention.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.master_thief', delta: 3 },
              {
                kind: 'recent_event',
                message: 'The vault break in {location} becomes the kind of story told in back rooms for years.',
                significance: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'vault_break_investigation_seeded',
            label: 'The investigation is already moving.',
            intent:
              'Something at the scene was logged. A guard who noticed the wrong face, ' +
              'a ward record that didn\'t erase cleanly. The city\'s investigative machinery ' +
              'is slow but thorough.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.master_thief', delta: 3 },
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.9,
                label: 'Capital vault break — partial evidence trail exists',
                revealFamilies: ['civic_guard', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'civic_guard',
                delayTicks: 25,
                priority: 1.5,
                seedLabel: 'The vault investigation reaches a named suspect',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'vault_break_plant_rumor',
            label: 'Let a rival\'s name circulate instead.',
            intent:
              'What if the investigation looked at someone else first? A name, carelessly dropped. ' +
              'Not evidence — just direction. The kind of misdirection that costs {name} nothing ' +
              'and costs someone else considerable inconvenience.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.master_thief', delta: 3 },
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.6,
                label: 'False lead planted in vault investigation — a name was used',
                revealFamilies: ['investigation', 'tg.quest'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.elite.shadow_war',
    name: 'Shadow War',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    description:
      'A rival guild is expanding into protected territory. ' +
      'Find their leaders, disrupt their operations, and end the incursion ' +
      'before it becomes permanent.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 3 },
        difficulty: TG_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A rival operation has moved into {location}\'s lower quarter — not loudly, ' +
          'but the guild\'s revenue reports show it clearly enough. {name} maps the competition: ' +
          'who runs the street corners, who handles the fencing, where the bosses sleep. ' +
          '{?has_faction}The guild wants {them} to solve this quietly. ' +
          'A visible war is bad for everyone\'s business.{/has_faction}' +
          '{?no_faction}No guild backing this — {name} was asked and accepted. ' +
          'Which means {they} own{s} the outcome either way.{/no_faction}',
        successAfterimage: 'The rival hideouts and lieutenants are mapped.',
        failureAfterimage: 'The rivals operate in cells. More time needed to find the center.',
      },
      {
        reach: 'shadow',
        duration: { min: 2, max: 4 },
        difficulty: (TG_ELITE_BASE + TG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Safe houses raided — not violently, but emptied before their occupants return. ' +
          'Fence contacts blocked at key intersections. Shipments misdirected or spoiled. ' +
          '{name} works through the rival operation\'s infrastructure the way water works ' +
          'through old mortar: patient, indirect, thorough.',
        successAfterimage: 'The rival operations crumble. Revenue dries up. The pressure is visible.',
        failureAfterimage:
          'They anticipated the strike. The disruption that should have collapsed them ' +
          'instead announced the war.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 3 },
        difficulty: (TG_ELITE_BASE + TG_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#shadow'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
          reputationDelta: -0.04,
        },
        narrativeTemplate:
          'The rival boss. Not a name that appears in any official record — but everyone in ' +
          '{location}\'s underworld knows who held the operation together, and everyone will know ' +
          'when that person stops being able to hold anything. {name} finishes it.',
        successAfterimage: 'The rival guild collapses. The territory is secured.',
        failureAfterimage:
          'The boss escapes with enough of the network intact to rebuild. The war drags on.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} dismantles a rival guild\'s expansion into protected territory — ' +
        'identify the leadership, disrupt the infrastructure, end the incursion.',
      success: 'The rival operation collapses. The territory is quiet again.',
      failure:
        'The rival boss escapes. The conflict continues at reduced intensity, ' +
        'which is how these things become permanent.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The shadow war ends or continues, depending on how the final move landed. ' +
          'Either way, {location}\'s criminal underworld has absorbed a significant disruption, ' +
          'and the survivors — on both sides — are adjusting their calculations accordingly.',
        changes: [
          {
            id: 'shadow_war_territory',
            kind: 'reputation',
            title: 'Territory Control',
            detail: 'A decisive victory secures the guild\'s position. A partial victory creates instability.',
            polarity: 'mixed',
          },
          {
            id: 'shadow_war_reprisal',
            kind: 'future_hook',
            title: 'Rival Remnants',
            detail: 'Defeated guilds rarely dissolve completely. Remnants remember.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The shadow war is over, or it isn\'t. What does the god see from here?',
        reactions: [
          {
            id: 'shadow_war_consolidate',
            label: 'Consolidate the win.',
            intent:
              'The territory is secured. The god marks the outcome in the guild\'s history — ' +
              'a decisive operation that removed a threat and defined the boundary.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_war', delta: 3 },
              {
                kind: 'recent_event',
                message: 'The rival guild\'s expansion into {location} is finished. Territory secured.',
                significance: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'shadow_war_remnants_watch',
            label: 'The survivors are watching.',
            intent:
              'Some of the rival operation scattered rather than collapsed. ' +
              'They\'ll rebuild somewhere, smaller and angrier. The god keeps a thread on them.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_war', delta: 3 },
              {
                kind: 'encounter_seed',
                encounterFamily: 'tg.quest',
                delayTicks: 30,
                priority: 1.2,
                seedLabel: 'Rival guild remnants resurface with a specific grievance',
              },
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.6,
                label: 'Rival guild dissolved — surviving members hold a specific grudge',
                revealFamilies: ['tg.quest', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const THIEVES_GUILD_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  withEncounterContract({
    id: 'tg.social.dice_game',
    name: 'Back-Alley Dice',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: TG_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
            tagFilters: ['#gold'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'A circle of guild folk throw dice in a dim alley behind {location}\'s market. ' +
          'Coin changes hands faster than any hand-count can track, which is precisely the point. ' +
          '{name} takes a position at the ring\'s edge and reads the rhythm of the game — ' +
          'who\'s hot, who\'s pressing, where the edges are. ' +
          '{?has_faction}The guild doesn\'t run this game, but everyone who plays it is guild.{/has_faction}',
        successAfterimage: 'Lucky throws. {name} walks away with heavier pockets.',
        failureAfterimage: 'Cold dice. {name} loses the stake.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} joins a dice circle in {location}\'s back alleys — guild currency, guild company, fast results.',
      success: '{name} reads the game and plays it right. Coin flows the right direction.',
      failure: 'The dice don\'t answer tonight.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The game breaks up before the watch comes through. This alley has seen a hundred of these. ' +
          'The money is gone or won, and nobody involved is going to file a report about it.',
        changes: [
          {
            id: 'dice_game_coin',
            kind: 'item',
            title: 'Coin',
            detail: 'Won or lost. The dice are honest in their way.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The dice are pocketed. What does the god observe?',
        reactions: [
          {
            id: 'dice_game_camaraderie',
            label: 'The company was worth the coin.',
            intent:
              'Guild bonds are built in back alleys as much as on jobs. ' +
              'The god notes the interaction — {name} among {their} own.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_camaraderie', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'dice_game_debt',
            label: 'A debt sits at the table.',
            intent:
              'Lost coin in a guild game is a small thing — until it isn\'t. ' +
              'The god marks the obligation, small as it is.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.2,
                label: 'Minor dice debt — owes coin in guild alley game',
                revealFamilies: ['tg.social', 'tg.quest'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.social.fence_deal',
    name: 'Meet the Fence',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'gold',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: TG_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'A fence evaluates {name}\'s latest acquisitions in the back room of a {location} establishment ' +
          'that officially sells secondhand furniture. The smell of sawdust and old varnish. ' +
          'The fence picks up each piece, sets it down, says nothing. ' +
          '{?has_faction}Guild-affiliated fences play fair — not generous, but fair, ' +
          'which is a distinction worth understanding.{/has_faction}' +
          '{?no_faction}An independent fence will move the goods but the margin won\'t be kind.{/no_faction}',
        successAfterimage: 'Good prices. The fence offers a standing arrangement.',
        failureAfterimage: 'The fence shakes {their} head. Not worth the risk tonight.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} brings recent acquisitions to a {location} fence for evaluation and sale. Routine commerce.',
      success: 'Good returns. The fence is interested in future arrangements.',
      failure: 'The fence passes. Wrong goods, wrong timing, or the wrong night.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The back room empties. Coin exchanged or not, the fence goes back to {their} ' +
          'furniture display and {name} steps back into {location}\'s ordinary street noise.',
        changes: [
          {
            id: 'fence_deal_contact',
            kind: 'reputation',
            title: 'Fence Relationship',
            detail: 'A reliable fence is a professional asset. A bad deal is a closed door.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does this fence represent going forward?',
        reactions: [
          {
            id: 'fence_deal_cultivate',
            label: 'Note this contact.',
            intent:
              'A fence who deals fairly and doesn\'t ask too many questions is worth maintaining. ' +
              'The god marks this as a reliable node in {location}\'s underground economy.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Reliable fence contact in {location}',
                detail: 'Handles acquired goods without questions. Fair margins.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'fence_deal_transactional',
            label: 'A transaction, nothing more.',
            intent: 'Done. The god releases the thread.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'tg.social.rumor_trade',
    name: 'Trade Rumors',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: TG_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Information is currency and {name} is here to trade. ' +
          'The exchange happens in {location}\'s habitual margins — a corner table, ' +
          'a quiet doorway, the pause between two unremarkable encounters. ' +
          '{name} gives something of moderate value and watches what comes back. ' +
          '{?has_faction}Guild intelligence networks run on exactly this — small trades ' +
          'that aggregate into pattern.{/has_faction}' +
          '{?no_faction}Independent, {name} trades with whoever has something useful and ' +
          'will accept what {they} offer{s}.{/no_faction}',
        successAfterimage: 'A useful tip surfaces. Opportunity is downstream.',
        failureAfterimage: 'Stale gossip and old news. Nothing worth the investment.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} exchanges information in {location}\'s back-channel network — what {they} know{s} ' +
        'for what someone else knows. The guild economy runs on this.',
      success: 'A tip about a wealthy traveler, a patrol gap, a careless merchant. Opportunity.',
      failure: 'The exchange produces nothing useful. Bad week for rumor.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The rumor trade is a small transaction in a large economy. ' +
          'What was exchanged is either useful or it isn\'t, ' +
          'and the network continues its circulation regardless.',
        changes: [
          {
            id: 'rumor_trade_intel',
            kind: 'item',
            title: 'Intelligence',
            detail: 'A tip with a shelf life. Information decays.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the god hear at the exchange?',
        reactions: [
          {
            id: 'rumor_trade_file_tip',
            label: 'The tip is worth remembering.',
            intent:
              'What was traded — a patrol pattern, a merchant\'s schedule, a wealthy visitor — ' +
              'is actionable within the right window.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Street intelligence from {location} rumor exchange',
                detail: 'Patrol gaps, wealthy targets, current movements — reliable for a few ticks.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'rumor_trade_noise',
            label: 'Noise, nothing more.',
            intent: 'The exchange is completed and released. The network moves on.',
            effects: [
              { kind: 'reputation_tally', key: 'tg.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const TG_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'tg.join',
  name: 'Join the Thieves Guild',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  steps: [
    {
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: TG_JOIN_DIFFICULTY / 100,
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
        'The guild tests prospects simply: lift a coin purse in the market, clean, ' +
        'witnessed by someone who knows what clean looks like. {name} takes the assignment. ' +
        'The evaluator is somewhere in the {location} crowd — watching, expressionless, ' +
        'already making the decision before the lift is half-complete.',
      successAfterimage: 'A clean lift. The guild opens its doors.',
      failureAfterimage: 'Clumsy. The evaluator moves on without a word. Come back when the hands are better.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} seeks entry to the Thieves Guild. The initiation is a single test, ' +
      'observed by someone whose judgment is the only credential that matters.',
    success: 'The guild opens. {name}\'s life acquires a new shape.',
    failure: 'Not yet. The hands, the patience, the specific nerve — not ready.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The test is over. {name} either belongs to the guild now, or doesn\'t, ' +
        'and the {location} market continues its commerce, indifferent to either outcome.',
      changes: [
        {
          id: 'tg_join_membership',
          kind: 'reputation',
          title: 'Guild Membership',
          detail: 'Entry means a network, a set of obligations, and a long education in how the city actually works.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god see in this beginning?',
      reactions: [
        {
          id: 'tg_join_mark_entry',
          label: 'This is where it starts.',
          intent:
            'Entry to the guild is a threshold. The god marks it — not with intervention, ' +
            'just with attention. The thread is picked up.',
          effects: [
            { kind: 'reputation_tally', key: 'tg.guild_membership', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name} joins the Thieves Guild in {location}. A door opens.',
              significance: 0.5,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const TG_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'tg.promotion',
  name: 'Shadow Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  steps: [
    {
      reach: 'shadow',
      duration: { min: 1, max: 3 },
      difficulty: TG_PROMOTION_DIFFICULTY / 100,
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
        'Higher rank requires a harder mark. The guild assigns a challenge calibrated ' +
        'to the new tier — something that would have been out of reach last month. ' +
        '{name} takes it without asking questions about the selection process. ' +
        '{?has_faction}The guild is watching. It always watches. But there\'s a specific ' +
        'quality to the attention tonight — it\'s evaluation, not supervision.{/has_faction}' +
        '{?no_faction}No safety net. The assignment\'s difficulty is the point.{/no_faction}',
      successAfterimage:
        'Clean work. The new rank is acknowledged through the network without ceremony.',
      failureAfterimage:
        'The guild respects ambition. It demands skill. Tonight, the gap between them was visible.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} takes on a challenge assignment to demonstrate readiness for the next guild rank. ' +
      'The guild assigns the test. The guild evaluates the result.',
    success: 'The new rank is {name}\'s. The network acknowledges it quietly.',
    failure: 'Not yet. The skill isn\'t there, or the nerve isn\'t, or the timing was wrong.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The advancement test is scored and filed. {name} either moved up or didn\'t, ' +
        'and the guild\'s hierarchy updates itself with the efficiency of an organization ' +
        'that has processed this result many times before.',
      changes: [
        {
          id: 'tg_promotion_rank',
          kind: 'reputation',
          title: 'Guild Rank',
          detail: 'Advancement opens new assignments, new contacts, and new obligations.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the promotion — or its failure — mean for what comes next?',
      reactions: [
        {
          id: 'tg_promotion_advance',
          label: 'The rank is acknowledged.',
          intent:
            'Advancement in the guild carries real weight — new territories, higher-grade assignments, ' +
            'different risks. The god marks the transition.',
          effects: [
            { kind: 'clearance_gate_tag', tag: 'tg.rank_advanced' },
            { kind: 'reputation_tally', key: 'tg.guild_rank', delta: 3 },
            {
              kind: 'recent_event',
              message: '{name} advances within the Thieves Guild. The network takes note.',
              significance: 0.6,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const TG_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  TG_JOIN_TEMPLATE,
  TG_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a thieves guild encounter template by ID.
 */
export function getThievesGuildEncounterById(id: string): UnifiedActionTemplate | undefined {
  return THIEVES_GUILD_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? TG_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? THIEVES_GUILD_SOCIAL_TEMPLATES.find(t => t.id === id);
}
