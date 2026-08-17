/**
 * Mercenary Company Encounter Content — unified format (THR-31 Phase 2f).
 *
 * Voice bible: blunt, professional, darkly funny. Mercenaries do the work and want
 * to be paid. Plain declaratives. Humor in the noun choice, not in jokes.
 * Load-bearing lexicon: contract, clause, work, pay, split, captain, line, ground,
 * keeping it honest, keeping the word. Never: glory.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';
import {
  FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const MC_DIFFICULTY_BASE = 30;
const MC_DIFFICULTY_STEP = 10;
const MC_SENIOR_BASE = 40;
const MC_ELITE_BASE = 55;
const MC_JOIN_DIFFICULTY = 25;
const MC_PROMOTION_DIFFICULTY = 40;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const MERCENARY_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['mc.join', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.0, questType: 'standard' }],
  ['mc.promotion', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.0, questType: 'standard' }],
  ['mc.quest.patrol', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.04, questType: 'standard' }],
  ['mc.quest.guard_caravan', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.04, questType: 'standard' }],
  ['mc.quest.collect_bounty', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.05, questType: 'standard' }],
  ['mc.quest.siege_work', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.05, questType: 'standard' }],
  ['mc.quest.escort_prisoner', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.04, questType: 'standard' }],
  ['mc.senior.field_command', { factionDefId: 'mercenary_company', minRank: 'sergeant_at_arms', reputationReward: 0.06, questType: 'senior' }],
  ['mc.senior.hostile_negotiation', { factionDefId: 'mercenary_company', minRank: 'sergeant_at_arms', reputationReward: 0.06, questType: 'senior' }],
  ['mc.senior.extraction_op', { factionDefId: 'mercenary_company', minRank: 'sergeant_at_arms', reputationReward: 0.06, questType: 'senior' }],
  ['mc.elite.war_council', { factionDefId: 'mercenary_company', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  ['mc.elite.siege_contract', { factionDefId: 'mercenary_company', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  ['mc.social.sparring_ring', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.02, questType: 'standard' }],
  ['mc.social.war_stories', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.02, questType: 'standard' }],
  ['mc.social.contract_negotiation', { factionDefId: 'mercenary_company', minRank: 'sellsword', reputationReward: 0.03, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const MERCENARY_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'mc.quest.patrol',
    actorAffinities: ['individual'],
    name: 'Road Patrol',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.quest.patrol.1',
        name: 'March the Perimeter',
        narrativeTemplate: 'The captain assigns {name} a section of road. Walk it with blade ready. No talking.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The section is clear. Patrol completed per the contract.',
        failureAfterimage: 'A shape moves in the dark and is gone before {name} can close on it. Partial work.',
      },
      {
        id: 'mc.quest.patrol.2',
        name: 'Report Back',
        narrativeTemplate: 'The captain{?has_faction} of {faction}{/has_faction} wants the patrol count. Numbers only — no color commentary.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Report delivered. Numbers match the ground. Contract fulfilled.',
        failureAfterimage: 'The count is off. The captain reads it twice and lets the silence do the correcting.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The section is walked and the count is filed. The road is the same road it was yesterday, '
          + 'which is the result the contract pays for.',
        changes: [
          {
            id: 'mc_patrol_standing',
            kind: 'reputation',
            title: 'Company Standing',
            detail: 'A section walked in full is how the captain learns a name. A short count is how they forget it.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the road?',
        reactions: [
          {
            id: 'mc_patrol_clean_work',
            label: 'The work was done to the line.',
            intent: 'No commentary, no decoration. The section was walked and the numbers match the ground.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.6 },
              {
                kind: 'recent_event',
                message: '{name} walked a road section for the Company and filed a count that matched the ground.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_patrol_quiet_road',
            label: 'The road was too quiet.',
            intent:
              'Nothing on a stretch that should carry something. Quiet is a number too, and this one is off.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.4 },
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Traffic gone from the road out of {location}',
                detail:
                  'A section that should carry carts carried none. Someone is routing around this stretch, '
                  + 'or has stopped moving entirely.',
                reliability: 0.5,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.quest.guard_caravan',
    actorAffinities: ['individual'],
    name: 'Guard the Caravan',
    locationSubtypes: ['town', 'city', 'capital', 'border_crossing'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.quest.guard_caravan.1',
        name: 'Take Position',
        narrativeTemplate: '{name} draws flank position. The goods belong to someone who paid the contract price. Keep the contract.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'First day out, no contact. The line holds.',
        failureAfterimage: 'A gap in the line. Noted by the wagon master. Not by the captain yet.',
      },
      {
        id: 'mc.quest.guard_caravan.2',
        name: 'Arrival',
        narrativeTemplate: 'The caravan reaches {location}. The captain tallies the split{?has_faction} before settling with {faction}{/has_faction}.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Goods delivered intact. Pay issued per clause. Clean work.',
        failureAfterimage: 'Losses at the back of the caravan. Pay docked per clause. The word is kept, but it costs.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The caravan reached {location} and the split was tallied at the gate. '
          + 'What arrived intact is the whole of the argument.',
        changes: [
          {
            id: 'mc_caravan_standing',
            kind: 'reputation',
            title: 'Contract Kept',
            detail: 'Goods delivered against a signed clause. The wagon master will name the Company to the next client, or will not.',
            polarity: 'mixed',
          },
          {
            id: 'mc_caravan_split',
            kind: 'reputation_tally',
            title: 'The Split',
            detail: 'Pay issued per clause, losses docked per clause. The arithmetic is the relationship.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god take from the road to {location}?',
        reactions: [
          {
            id: 'mc_caravan_kept_the_word',
            label: 'The line held and the goods arrived.',
            intent: 'The contract said flank position and intact cargo. Both happened. That is the entire report.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.5 },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 0.3 },
              {
                kind: 'recent_event',
                message: '{name} guarded a caravan into {location} and the cargo arrived against the clause.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_caravan_read_the_cargo',
            label: 'Somebody paid a great deal to move that.',
            intent:
              'The contract price was above the goods. Whoever wrote it was buying discretion as much as blades.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 0.5 },
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Overpriced escort contract into {location}',
                detail:
                  'The pay exceeded the visible value of the cargo. Either the manifest is short, '
                  + 'or the client expected trouble they did not name in the clause.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.quest.collect_bounty',
    actorAffinities: ['individual'],
    name: 'Collect a Bounty',
    locationSubtypes: ['town', 'city', 'capital', 'crossroads'],
    rarityTier: 1,
    difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'mc.quest.collect_bounty.1',
        name: 'Track the Mark',
        narrativeTemplate: '{name} has a description, a last known direction, and a number. The number is what makes the work worth the walk.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The mark is located at {location}. The hard part is finding. The easy part is collecting.',
        failureAfterimage: 'No sign at {location}. The mark moved faster than the pay warranted.',
      },
      {
        id: 'mc.quest.collect_bounty.2',
        name: 'Bring Them In',
        narrativeTemplate: '{?has_faction}The contract with {faction} specifies condition on delivery.{/has_faction} A long box costs extra.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Delivered per contract, condition noted. Pay issued. Work done.',
        failureAfterimage: 'The mark is alive but argumentative. The captain takes the reduced clause without complaint.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The mark is delivered and the condition is noted against the clause. '
          + 'The number was the reason for the walk, and the number is paid.',
        changes: [
          {
            id: 'mc_bounty_standing',
            kind: 'reputation',
            title: 'Contract Record',
            detail: 'Another closed bounty on the Company ledger. The work follows {name} into rooms they have not entered yet.',
            polarity: 'mixed',
          },
          {
            id: 'mc_bounty_mark',
            kind: 'trait',
            title: 'Known for the Work',
            detail: 'People who collect people are remembered as such. The reputation arrives before the introduction.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the collection?',
        reactions: [
          {
            id: 'mc_bounty_professional',
            label: 'Delivered per contract, condition noted.',
            intent: 'The description matched, the number was correct, the box stayed empty. Clean work by the clause.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.7 },
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                label: 'bounty_hunter',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
              },
              {
                kind: 'recent_event',
                message: '{name} brought in a bounty for the Company and the condition held to the clause.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_bounty_heard_the_mark',
            label: 'The mark talked on the road back.',
            intent:
              'A long walk with someone in irons is a long conversation. Most of it is worthless. Some of it is not.',
            effects: [
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.4 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'What the bounty said between {location} and the gate',
                detail:
                  'Names, a grievance, and a claim about who actually posted the price. '
                  + 'A person in irons has reason to lie and reason not to.',
                reliability: 0.4,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_bounty_kept_the_arms',
            label: 'Whatever the mark was carrying.',
            intent:
              'The clause pays for the body, not the belt. What came in with them goes out with whoever walked them home.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 0.3 },
              // THR-1146 exemplar. The ending cannot know what the mark carried
              // — that is the point. It draws *some* weapon, and the outcome
              // band decides how good: a clean collection turns up better arms
              // than a botched one, off the same recipe and no extra tuning.
              //
              // `#weapon` is 24 templates across all four tiers. Tags carry
              // their `#`; `'weapon'` would match nothing, which is exactly
              // what `check:encounter` now refuses to let ship.
              {
                kind: 'reward_draw',
                pool: {
                  categoryWeights: { possession: 1 },
                  tagFilters: ['#weapon'],
                },
              },
              {
                kind: 'recent_event',
                message: '{name} kept the arms off a delivered bounty. The Company noted it and let it stand.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.quest.siege_work',
    actorAffinities: ['individual'],
    name: 'Siege Work',
    locationSubtypes: ['town', 'city', 'capital', 'fortress'],
    rarityTier: 1,
    difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'mc.quest.siege_work.1',
        name: 'Dig In',
        narrativeTemplate: 'The captain assigns {name} a section of the line outside {location}. The ground is wet. The contract covers wet ground.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The section holds. The line advances one length. Progress.',
        failureAfterimage: 'The ground is wrong and the section gives. Three names go on the stone. Work continues.',
      },
      {
        id: 'mc.quest.siege_work.2',
        name: 'The Breach',
        narrativeTemplate: '{?has_faction}The {faction} captain calls the push.{/has_faction} The split doubles if the gate opens before nightfall.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The gate opens. The pay doubles per clause. The captain smiles, which is alarming.',
        failureAfterimage: 'The gate holds. The captain pays the base rate. Keeping the word when the contract goes bad.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The line outside {location} moved, or it did not, and the pay follows the clause either way. '
          + 'The ground was wet the whole time. The contract covered wet ground.',
        changes: [
          {
            id: 'mc_siege_work_standing',
            kind: 'reputation',
            title: 'Time on the Line',
            detail: 'Siege work is counted in days held, not in ground taken. The captain counts it that way too.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the siege line?',
        reactions: [
          {
            id: 'mc_siege_work_held_section',
            label: 'The section held its length.',
            intent: 'Dig, wait, push when called. Three names went on the stone and the work continued, which is the job.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.8 },
              {
                kind: 'recent_event',
                message: '{name} worked a siege line outside {location} and the assigned section held its length.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_siege_work_read_the_walls',
            label: 'The defenders were rationing something.',
            intent:
              'Nobody on that wall was standing a full watch. A garrison that thin is counting stores, not arrows.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.5 },
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Garrison strength at {location} is short',
                detail:
                  'Watches doubled up and rotations stretched past what a full roster would need. '
                  + 'The wall is being held by fewer hands than the banners claim.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.quest.escort_prisoner',
    actorAffinities: ['individual'],
    name: 'Escort a Prisoner',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.quest.escort_prisoner.1',
        name: 'Take Custody',
        narrativeTemplate: 'The contract is simple: the long box stays empty. {name} takes custody of the prisoner at {location}.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Transfer completed cleanly. The prisoner walked without fuss.',
        failureAfterimage: 'The prisoner tested the chain early. Nothing broke, but {name} noted it for the walk.',
      },
      {
        id: 'mc.quest.escort_prisoner.2',
        name: 'Deliver',
        narrativeTemplate: 'The receiving party{?has_faction} from {faction}{/has_faction} checks the condition against the contract clause.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Delivered, condition met. Contract closed. Pay issued without argument.',
        failureAfterimage: 'The receiving party disputes the condition. The captain arbitrates. A clause is applied.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The prisoner is delivered and the receiving party checks the condition against the clause. '
          + 'The long box stayed empty, which was the whole of the contract.',
        changes: [
          {
            id: 'mc_escort_standing',
            kind: 'reputation',
            title: 'Condition Met',
            detail: 'A delivery that matches its clause is unremarkable, and unremarkable is what the Company sells.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the walk?',
        reactions: [
          {
            id: 'mc_escort_delivered_clean',
            label: 'Delivered whole, contract closed.',
            intent: 'The chain was tested early and held. Nothing else happened, and nothing else was supposed to.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.5 },
              {
                kind: 'recent_event',
                message: '{name} escorted a prisoner to {location} and the condition matched the clause on delivery.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_escort_who_wanted_them',
            label: 'The receiving party was too eager.',
            intent:
              'They checked the face before they checked the paperwork. That is not how a clerk takes custody.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.4 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Unusual interest in a prisoner at {location}',
                detail:
                  'The receiving party identified the prisoner on sight and hurried the transfer. '
                  + 'Somebody wanted this specific person, not this specific charge.',
                reliability: 0.55,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const MERCENARY_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mc.senior.field_command',
    actorAffinities: ['individual'],
    name: 'Field Command',
    locationSubtypes: ['fortress', 'battlefield', 'city'],
    rarityTier: 1,
    difficulty: MC_SENIOR_BASE / 100,
    steps: [
      {
        id: 'mc.senior.field_command.1',
        name: 'Read the Ground',
        narrativeTemplate: '{name} takes the elevated position above {location}. The captain wants the ground read before the contract starts.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Good read. The captain adjusts the line per {name}\'s ground report.',
        failureAfterimage: 'The read is off. The captain absorbs the bad data quietly, which is worse than being told.',
      },
      {
        id: 'mc.senior.field_command.2',
        name: 'Hold the Line',
        narrativeTemplate: 'The contract is three days. {?has_faction}The {faction} captain checks on the split daily.{/has_faction} Keeping the word means the line holds three days.',
        reach: 'iron',
        difficulty: (MC_SENIOR_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Three days, line held. Full pay. Two more names want in on the next contract.',
        failureAfterimage: 'Day two breaks. The captain pays per the clause. Keeping the word, with a minus.',
      },
      {
        id: 'mc.senior.field_command.3',
        name: 'Debrief',
        narrativeTemplate: 'The captain wants numbers — how many, what ground was taken, what it cost. Feeling is not a number.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Clean numbers. The captain files it. One more record on the stone outside barracks.',
        failureAfterimage: 'The count is unclear. The captain will reconstruct it himself. This is not preferred.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Three days of ground, held or not held, and a debrief in numbers. '
          + 'The captain files it and the stone outside the barracks gets whatever it gets.',
        changes: [
          {
            id: 'mc_field_command_standing',
            kind: 'reputation',
            title: 'Command Record',
            detail: 'Ground read, line held, count reported. Two more names want in on the next contract, or they do not.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the command?',
        reactions: [
          {
            id: 'mc_field_command_held_three_days',
            label: 'Three days, line held, clean numbers.',
            intent: 'The ground was read correctly and the contract was kept to its stated term. Feeling is not a number; this is.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.8 },
              {
                kind: 'recent_event',
                message: '{name} held a field command for the Company at {location} and reported the count clean.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_field_command_cost_of_the_ground',
            label: 'That ground cost more than it was worth.',
            intent:
              'The contract was kept and the arithmetic still does not close. Someone priced this line without walking it.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 0.5 },
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'The line at {location} is overpriced ground',
                detail:
                  'Held for its full term at a cost the terrain did not justify. '
                  + 'Whoever commissioned the hold either does not know the ground or is buying time for something else.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mc.senior.hostile_negotiation',
    actorAffinities: ['individual'],
    name: 'Hostile Negotiation',
    locationSubtypes: ['city', 'capital', 'fortress'],
    rarityTier: 1,
    difficulty: MC_SENIOR_BASE / 100,
    steps: [
      {
        id: 'mc.senior.hostile_negotiation.1',
        name: 'Read the Other Side',
        narrativeTemplate: 'The contract is negotiation, not violence — yet. {name} reads the numbers on the other side of {location}\'s gate.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The count is grim for them. {name} has a number to work from.',
        failureAfterimage: 'The count is unclear. The captain says walk in with a soft number, which is uncomfortable.',
      },
      {
        id: 'mc.senior.hostile_negotiation.2',
        name: 'Name the Terms',
        narrativeTemplate: 'The terms are direct{?has_faction} — the clause is fair by the Company\'s standards{/has_faction}. No decoration. What they owe and when.',
        reach: 'iron',
        difficulty: (MC_SENIOR_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Terms accepted. Contract signed with less blood than expected.',
        failureAfterimage: 'Terms refused. The captain shrugs and calls it preparation for the next step of the contract.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Terms were named without decoration and the other side either took them or did not. '
          + 'Less blood than expected, or preparation for the next step of the contract.',
        changes: [
          {
            id: 'mc_negotiation_standing',
            kind: 'reputation',
            title: 'Terms Named',
            detail: 'What they owe and when, stated plainly at the gate of {location}. Plain terms are harder to argue with later.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the parley?',
        reactions: [
          {
            id: 'mc_negotiation_held_the_number',
            label: 'The number was named and held.',
            intent: 'No decoration, no softening. The count on the other side was grim and both sides knew it.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.6 },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.3 },
              {
                kind: 'recent_event',
                message: '{name} named the Company\'s terms at {location} and did not move off the number.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_negotiation_who_they_answer_to',
            label: 'They were not the ones deciding.',
            intent:
              'Every term went to a room the negotiators kept leaving for. The authority is behind that door, not at this table.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.5 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Real authority at {location} sits behind the negotiators',
                detail:
                  'The party at the table carried no power to accept. Terms were relayed out and answers relayed back. '
                  + 'Whoever holds the decision did not want to be seen holding it.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mc.senior.extraction_op',
    actorAffinities: ['individual'],
    name: 'Extraction Operation',
    locationSubtypes: ['city', 'capital', 'fortress', 'dungeon'],
    rarityTier: 1,
    difficulty: (MC_SENIOR_BASE + MC_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'mc.senior.extraction_op.1',
        name: 'Locate the Asset',
        narrativeTemplate: 'The contract is bringing someone out alive from {location}. The captain does not use the word rescue. That is not a professional word.',
        reach: 'iron',
        difficulty: MC_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Asset located. Extraction window identified. Work begins.',
        failureAfterimage: 'Asset not at the expected position. The window is smaller now.',
      },
      {
        id: 'mc.senior.extraction_op.2',
        name: 'Move Fast',
        narrativeTemplate: '{name} leads the extraction{?has_faction} under {faction} contract terms{/has_faction}. Fast is cheaper than careful when the window is small.',
        reach: 'iron',
        difficulty: (MC_SENIOR_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Out clean. Asset intact. Full pay per contract.',
        failureAfterimage: 'Complications added names to the stone. Asset out, but the clause applies. The captain pays minus.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The asset is out of {location}. The captain still does not use the word rescue — '
          + 'the contract said bring someone out alive, and the window was the window.',
        changes: [
          {
            id: 'mc_extraction_standing',
            kind: 'reputation',
            title: 'Extraction Record',
            detail: 'Fast is cheaper than careful when the window is small. What that costs shows up on the stone, not the ledger.',
            polarity: 'mixed',
          },
          {
            id: 'mc_extraction_owed',
            kind: 'future_hook',
            title: 'Somebody Owes Somebody',
            detail: 'An asset out of a place they were being kept is a party that wanted them kept. That conversation is not finished.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god take from the extraction?',
        reactions: [
          {
            id: 'mc_extraction_out_clean',
            label: 'Out clean, asset intact.',
            intent: 'The window held long enough. Whoever wanted this person kept will want a word about it.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.7 },
              {
                kind: 'encounter_seed',
                templateId: 'mc.senior.hostile_negotiation',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                seedLabel: 'mc_extraction_reprisal_talks',
              },
              {
                kind: 'recent_event',
                message: '{name} brought an asset out of {location} inside the window and the Company closed the contract.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_extraction_who_was_holding_them',
            label: 'The asset was not a prisoner.',
            intent:
              'No irons, no cell, and they knew the route out better than the plan did. This was someone leaving, not someone taken.',
            effects: [
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.5 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'The asset at {location} left willingly',
                detail:
                  'Held without restraint and moved without hesitation on ground they already knew. '
                  + 'The contract described an extraction. What happened was a defection.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const MERCENARY_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mc.elite.war_council',
    actorAffinities: ['individual'],
    name: 'War Council',
    locationSubtypes: ['capital', 'fortress', 'city'],
    rarityTier: 1,
    difficulty: MC_ELITE_BASE / 100,
    steps: [
      {
        id: 'mc.elite.war_council.1',
        name: 'Lay Out the Contract',
        narrativeTemplate: '{name} presents the Company\'s terms to the council at {location}. Long contracts. Numbers. No room for decoration.',
        reach: 'iron',
        difficulty: MC_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The council reads the contract. Nobody flinches at the numbers, which is a good sign.',
        failureAfterimage: 'The numbers land badly. Somebody on the council objects to the clause on ground losses.',
      },
      {
        id: 'mc.elite.war_council.2',
        name: 'Hold the Line on Terms',
        narrativeTemplate: '{?has_faction}The {faction} delegates push for a softer clause.{/has_faction} The captain\'s rule: keep the word or lose the ground.',
        reach: 'iron',
        difficulty: (MC_ELITE_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Terms held. The council accepts. The captain will hear it was a good contract.',
        failureAfterimage: 'A clause bent. The captain will reconstruct the split from the remaining terms.',
      },
      {
        id: 'mc.elite.war_council.3',
        name: 'Sign and Seal',
        narrativeTemplate: 'The captain signs last. Keeping the word goes on both sides of the stone.',
        reach: 'iron',
        difficulty: MC_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Signed. The Company has a war contract. The stone will have more names before this one ends.',
        failureAfterimage: 'One delegate walks before signing. The captain notes the name. Next contract, that name adds a clause.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The council read the numbers and the captain signed last. '
          + 'The Company has a war contract, and the stone will have more names before it closes.',
        changes: [
          {
            id: 'mc_war_council_standing',
            kind: 'reputation',
            title: 'Terms Held',
            detail: 'A long contract signed at full rate. Keeping the word goes on both sides of the stone.',
            polarity: 'mixed',
          },
          {
            id: 'mc_war_council_commitment',
            kind: 'future_hook',
            title: 'The Company Is Committed',
            detail: 'A war contract is not a job. It is a season, and the siege work follows from it.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god take from the council table?',
        reactions: [
          {
            id: 'mc_war_council_signed_at_rate',
            label: 'Signed at the Company rate.',
            intent: 'Nobody flinched at the numbers and no clause bent. The captain will hear it was a good contract.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.9 },
              {
                kind: 'encounter_seed',
                templateId: 'mc.elite.siege_contract',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2,
                seedLabel: 'mc_war_council_first_contract',
              },
              {
                kind: 'recent_event',
                message: '{name} carried the Company\'s terms through a war council at {location} and the contract was signed.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_war_council_the_delegate_who_left',
            label: 'One of them is already planning to break it.',
            intent:
              'A delegate who objects to the clause on ground losses has counted the ground they expect to lose. Note the name.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.6 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'A council member at {location} expects to break the contract',
                detail:
                  'The objection was specific to ground losses, which is a clause you only price if you intend to trigger it. '
                  + 'Next contract, that name adds a clause of its own.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mc.elite.siege_contract',
    actorAffinities: ['individual'],
    name: 'Major Siege Contract',
    locationSubtypes: ['fortress', 'city', 'capital'],
    rarityTier: 1,
    difficulty: (MC_ELITE_BASE + MC_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'mc.elite.siege_contract.1',
        name: 'Position the Company',
        narrativeTemplate: '{name} positions the full Company around {location}. The ground says three weeks. The contract says two.',
        reach: 'iron',
        difficulty: MC_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Good ground. The captain adjusts the perimeter to the terrain.',
        failureAfterimage: 'Soft ground on the north face. The line there will cost extra names.',
      },
      {
        id: 'mc.elite.siege_contract.2',
        name: 'Hold Through the Long Week',
        narrativeTemplate: 'The defenders know{?has_faction} that {faction} hired the Company{/has_faction} and are waiting. Waiting is part of keeping the contract.',
        reach: 'iron',
        difficulty: (MC_ELITE_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The line holds. The defenders are running out of time. The contract will be kept.',
        failureAfterimage: 'A relief column was not in the intelligence. The captain reads the ground and adjusts — expensive adjustment.',
      },
      {
        id: 'mc.elite.siege_contract.3',
        name: 'Conclude the Contract',
        narrativeTemplate: 'The gate opens or doesn\'t. Either way the clause covers it. The pay is at the gate.',
        reach: 'iron',
        difficulty: (MC_ELITE_BASE + MC_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Full pay. The contract is closed. The stone gets a date and a number.',
        failureAfterimage: 'Partial. The captain pays out per the remaining clauses. Keeping the word on a failed contract — that is what the Company is for.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The gate opened or it did not, and the clause covered it either way. '
          + 'The stone gets a date and a number, and the Company moves to the next ground.',
        changes: [
          {
            id: 'mc_siege_contract_standing',
            kind: 'reputation',
            title: 'Contract Concluded',
            detail: 'Full pay or partial, paid out per the remaining clauses. Keeping the word on a failed contract is what the Company is for.',
            polarity: 'mixed',
          },
          {
            id: 'mc_siege_contract_veteran',
            kind: 'trait',
            title: 'Siege Veteran',
            detail: 'Two weeks on a line that the ground said would take three. That is carried afterwards whether or not it is mentioned.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the long week?',
        reactions: [
          {
            id: 'mc_siege_contract_full_term',
            label: 'The Company held its term.',
            intent: 'Positioned, waited, concluded. The waiting was the contract as much as the gate was.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1.0 },
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                label: 'siege_veteran',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
              },
              {
                kind: 'recent_event',
                message: '{name} took the full Company through a siege contract at {location} and closed it on the clause.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_siege_contract_relief_column',
            label: 'The relief column was not in the intelligence.',
            intent:
              'Somebody sold the Company a two-week contract on three-week ground and left out who was coming. That was not an error.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.7 },
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'The brief for {location} omitted a relief force',
                detail:
                  'A column arrived that the contract intelligence did not mention, on a timetable that says it was always coming. '
                  + 'The client either did not know their own theatre or priced the Company\'s losses into the split.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const MERCENARY_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'mc.social.sparring_ring',
    actorAffinities: ['individual'],
    name: 'The Sparring Ring',
    locationSubtypes: ['town', 'city', 'capital', 'fortress', 'barracks'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.social.sparring_ring.1',
        name: 'Step Into the Ring',
        narrativeTemplate: '{name} steps into the ring{?has_faction} in front of the full {faction} roster{/has_faction}. The ring has two rules: no long boxes and no hard feelings.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Good work in the ring. The Company noted how {name} handles ground pressure.',
        failureAfterimage: 'Down twice. The captain says nothing. The ring says it all.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ring has two rules and both were kept. '
          + 'The Company watched how {name} handles ground pressure, which was the entire point of the exercise.',
        changes: [
          {
            id: 'mc_sparring_standing',
            kind: 'reputation',
            title: 'Watched in the Ring',
            detail: 'The roster forms its opinion here, before any contract puts it to the test. The captain says nothing either way.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the ring?',
        reactions: [
          {
            id: 'mc_sparring_good_work',
            label: 'Good work under pressure.',
            intent: 'No long boxes, no hard feelings, and the roster saw what it needed to see.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.4 },
              {
                kind: 'recent_event',
                message: '{name} took the ring in front of the Company roster at {location}.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_sparring_read_the_room',
            label: 'The roster is short of good hands.',
            intent:
              'Half that ring could not hold a line for three days. The Company is thinner than its contracts assume.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 0.3 },
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Company roster at {location} is thin on experience',
                detail:
                  'The ring showed more new hands than seasoned ones. '
                  + 'The next long contract will be held by people who have not held one.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.social.war_stories',
    actorAffinities: ['individual'],
    name: 'War Stories by the Fire',
    locationSubtypes: ['town', 'city', 'capital', 'tavern', 'barracks'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.social.war_stories.1',
        name: 'Listen to the Sergeants',
        narrativeTemplate: 'The sergeant describes the siege at {location} with professional accuracy. {?has_faction}The {faction} veterans add clauses to every anecdote.{/has_faction} {name} listens — that is how contracts get kept.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Good listen. {name} learned which clauses the old hands watch for.',
        failureAfterimage: 'Distracted. A few names in the stone came up and {name} missed why.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The sergeants described the siege with professional accuracy and the veterans added clauses to every anecdote. '
          + 'Listening is how contracts get kept.',
        changes: [
          {
            id: 'mc_war_stories_standing',
            kind: 'reputation',
            title: 'Time by the Fire',
            detail: 'The old hands name the clauses they watch for. Whoever was listening will watch for them too.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the fire?',
        reactions: [
          {
            id: 'mc_war_stories_listened',
            label: 'Listened, and learned the clauses.',
            intent: 'Professional accuracy, no decoration. The stories are a contract manual told sideways.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.3 },
              {
                kind: 'recent_event',
                message: '{name} sat with the Company\'s veterans at {location} and listened to how the old contracts went.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_war_stories_the_names_omitted',
            label: 'They talked around one siege.',
            intent:
              'Every other contract got its full accounting. That one got a change of subject, from men who do not embarrass easily.',
            effects: [
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.3 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'The Company does not discuss one contract',
                detail:
                  'A siege the veterans will not describe, in a room where every other loss was counted aloud. '
                  + 'Whatever the clause said, it is not on the stone.',
                reliability: 0.45,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mc.social.contract_negotiation',
    actorAffinities: ['individual'],
    name: 'Contract Negotiation Practice',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    difficulty: MC_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'mc.social.contract_negotiation.1',
        name: 'Read the Draft',
        narrativeTemplate: 'A new client approaches {name} at {location} with a draft contract. The draft is optimistic on the split and soft on the clauses.',
        reach: 'iron',
        difficulty: MC_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: '{name} identifies three soft clauses and names the correct split. The client revises.',
        failureAfterimage: 'The draft reads well to {name}. The captain will annotate it later, in red.',
      },
      {
        id: 'mc.social.contract_negotiation.2',
        name: 'Hold Your Ground on Pay',
        narrativeTemplate: '{?has_faction}The client pushes back — they expect {faction} rates, not Company rates.{/has_faction} The Company rate is the Company rate. No decoration.',
        reach: 'iron',
        difficulty: (MC_DIFFICULTY_BASE + MC_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Pay agreed at correct terms. Keeping the word starts with setting the right word.',
        failureAfterimage: 'Pay came in soft. The captain adjusts the split. The word is kept but the clause cost something.',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The draft was optimistic on the split and soft on the clauses, and it was read as such. '
          + 'Keeping the word starts with setting the right word.',
        changes: [
          {
            id: 'mc_negotiation_practice_standing',
            kind: 'reputation',
            title: 'Rate Held',
            detail: 'The Company rate is the Company rate. What gets conceded at the draft stage gets paid for on the ground.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the draft?',
        reactions: [
          {
            id: 'mc_negotiation_practice_correct_split',
            label: 'Three soft clauses named, correct split set.',
            intent: 'The client revised. That is what a draft is for, and what the captain\'s red ink is otherwise for.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 0.5 },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 0.3 },
              {
                kind: 'recent_event',
                message: '{name} read a client\'s draft contract at {location} and set the terms at the Company rate.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mc_negotiation_practice_who_wrote_this',
            label: 'This draft was written to be refused.',
            intent:
              'Soft clauses in exactly the places a professional checks first. Somebody wanted the Company to walk and to be seen walking.',
            effects: [
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.4 },
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'A client at {location} drafted a contract meant to fail',
                detail:
                  'The weak clauses sit where any Company reader looks first. '
                  + 'The approach was the point; the contract was never the point.',
                reliability: 0.5,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const MC_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'mc.join',
  actorAffinities: ['individual'],
  name: 'Join the Mercenary Company',
  locationSubtypes: ['town', 'city', 'capital', 'fortress', 'barracks'],
  rarityTier: 1,
  difficulty: MC_JOIN_DIFFICULTY / 100,
  steps: [
    {
      id: 'mc.join.1',
      name: 'Present Yourself',
      narrativeTemplate: "{name} presents to the Company's recruiter at {location}. The recruiter checks hands first — callused or not. Then asks one question about the last contract.",
      reach: 'iron',
      difficulty: MC_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The recruiter writes the name down. No ceremony — that is how the Company does it.',
      failureAfterimage: 'The recruiter sets the ledger down. Not yet. Come back with more ground under the boots.',
    },
    {
      id: 'mc.join.2',
      name: 'Sign the Standard Contract',
      narrativeTemplate: 'The standard contract{?has_faction} of the {faction}{/has_faction}: pay per clause, split on delivery, name on the stone if the clause fails.',
      reach: 'iron',
      difficulty: (MC_JOIN_DIFFICULTY + MC_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'Signed. The Company keeps the word. Now {name} does too.',
      failureAfterimage: 'The captain reads the hesitation and asks {name} to return when the contract feels comfortable.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The recruiter wrote the name down and the standard contract was signed. No ceremony — '
        + 'pay per clause, split on delivery, name on the stone if the clause fails.',
      changes: [
        {
          id: 'mc_join_membership',
          kind: 'faction_reputation',
          title: 'Signed to the Company',
          detail: 'The Company keeps the word. Now {name} does too, at the standard rate and the standard risk.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god take from the signing?',
      reactions: [
        {
          id: 'mc_join_signed',
          label: 'Callused hands and one honest answer.',
          intent: 'The recruiter checks hands first and asks one question about the last contract. Both checked out.',
          effects: [
            // THR-1144 — the signing now *signs*. Until this landed, this ending's
            // "Signed to the Company" chip claimed a membership nothing wrote:
            // `mc.join` is not any definition's `joinEncounterTemplateId`, so the
            // quest-driven `processFactionJoinOutcome` path never fires here, and
            // the reputation gain below silently no-ops on a non-member. The chip
            // is now backed by the edge it always described (Law 56).
            { kind: 'membership_change', factionId: 'mercenary_company', op: 'join', chronicle: true },
            { kind: 'faction_reputation_gain', factionId: 'mercenary_company', amount: 0.1 },
            {
              kind: 'recent_event',
              message: '{name} signed the standard contract with the Mercenary Company at {location}.',
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'mc_join_read_the_stone',
          label: 'Read the stone before signing.',
          intent:
            'The names outside the barracks are the contract\'s other half, stated in the only terms that do not negotiate.',
          effects: [
            // Same signing, different way in — the membership follows the scene,
            // not which line the player picked.
            { kind: 'membership_change', factionId: 'mercenary_company', op: 'join', chronicle: true },
            { kind: 'faction_reputation_gain', factionId: 'mercenary_company', amount: 0.1 },
            { kind: 'reputation_tally', key: 'stone.positive', delta: 0.3 },
            {
              kind: 'recent_event',
              message: '{name} read the names on the barracks stone at {location}, then signed anyway.',
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const MC_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mc.promotion',
  actorAffinities: ['individual'],
  name: 'Promotion in the Mercenary Company',
  locationSubtypes: ['city', 'capital', 'fortress', 'barracks'],
  rarityTier: 1,
  difficulty: MC_PROMOTION_DIFFICULTY / 100,
  steps: [
    {
      id: 'mc.promotion.1',
      name: 'The Captain\'s Review',
      narrativeTemplate: 'The captain at {location} reviews {name}\'s contract record{?has_faction} under {faction} terms{/has_faction}. Numbers are read aloud. No commentary.',
      reach: 'iron',
      difficulty: MC_PROMOTION_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The numbers speak. The captain closes the ledger and names the new rank.',
      failureAfterimage: 'One contract is flagged. The captain says: come back after the next one.',
    },
    {
      id: 'mc.promotion.2',
      name: 'Accept the New Clause',
      narrativeTemplate: 'Promotion means new clauses and more ground to hold. The pay goes up. So does the weight on the line.',
      reach: 'iron',
      difficulty: (MC_PROMOTION_DIFFICULTY + MC_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'New rank. New contract. The stone outside the barracks has room for the number.',
      failureAfterimage: 'The new clause felt heavier than expected. The captain says: that feeling is the job now.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The captain read the numbers aloud, closed the ledger, and named the rank. '
        + 'New clauses, more ground to hold, and more weight on the line.',
      changes: [
        {
          id: 'mc_promotion_rank',
          kind: 'faction_reputation',
          title: 'New Rank, New Clause',
          detail: 'The pay goes up. So does what the contract can ask for. The stone outside the barracks has room for the number.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from the review?',
      reactions: [
        {
          id: 'mc_promotion_numbers_spoke',
          label: 'The record carried it.',
          intent: 'Contracts kept, ground held, counts filed clean. The captain does not add commentary and does not need to.',
          effects: [
            { kind: 'faction_reputation_gain', factionId: 'mercenary_company', amount: 0.2 },
            {
              kind: 'recent_event',
              message: 'The Company\'s captain at {location} closed the ledger and named {name} to a new rank.',
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'mc_promotion_weight_of_it',
          label: 'The new clause is heavier than the pay.',
          intent:
            'That feeling is the job now. Everyone above this rank already knows it and none of them said so during the review.',
          effects: [
            { kind: 'faction_reputation_gain', factionId: 'mercenary_company', amount: 0.2 },
            { kind: 'reputation_tally', key: 'stone.positive', delta: 0.4 },
            {
              kind: 'recent_event',
              message: '{name} took a rank in the Company at {location} and read the new clause twice before accepting it.',
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const MC_LIFECYCLE_TEMPLATES: UnifiedActionTemplate[] = [MC_JOIN_TEMPLATE, MC_PROMOTION_TEMPLATE];

// ─── Full Export ──────────────────────────────────────────────────────────

export const ALL_MC_TEMPLATES: UnifiedActionTemplate[] = [
  ...MERCENARY_ENCOUNTER_TEMPLATES,
  ...MERCENARY_SENIOR_TEMPLATES,
  ...MERCENARY_ELITE_TEMPLATES,
  ...MERCENARY_SOCIAL_TEMPLATES,
  ...MC_LIFECYCLE_TEMPLATES,
];

export function getMercenaryEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_MC_TEMPLATES.find(t => t.id === id);
}
