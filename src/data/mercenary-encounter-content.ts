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
        failureAfterimage: 'Something moves in the dark and is gone before {name} can address it. Partial work.',
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
        failureAfterimage: 'The count is off. The captain says nothing, which is worse than words.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.6 },
        { kind: 'recent_event', label: 'road_patrol', delay: 0 },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.quest.guard_caravan',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.5 },
        { kind: 'reputation_tally', domain: 'gold.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'caravan_guard', delay: 0 },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.quest.collect_bounty',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.7 },
        { kind: 'hidden_mark', label: 'bounty_hunter', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'bounty_collected', delay: 2 },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.quest.siege_work',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.8 },
        { kind: 'recent_event', label: 'siege_participation', delay: 3 },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.quest.escort_prisoner',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.5 },
        { kind: 'recent_event', label: 'prisoner_escort', delay: 0 },
      ],
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const MERCENARY_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mc.senior.field_command',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.8 },
        { kind: 'recent_event', label: 'field_command', delay: 4 },
      ],
    },
  },

  {
    id: 'mc.senior.hostile_negotiation',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.6 },
        { kind: 'reputation_tally', domain: 'shadow.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'hostile_negotiation', delay: 2 },
      ],
    },
  },

  {
    id: 'mc.senior.extraction_op',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.7 },
        { kind: 'encounter_seed', templateId: 'mc.senior.hostile_negotiation', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
        { kind: 'recent_event', label: 'extraction_completed', delay: 3 },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const MERCENARY_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mc.elite.war_council',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.9 },
        { kind: 'encounter_seed', templateId: 'mc.elite.siege_contract', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2 },
        { kind: 'recent_event', label: 'war_council_concluded', delay: 5 },
      ],
    },
  },

  {
    id: 'mc.elite.siege_contract',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 1.0 },
        { kind: 'hidden_mark', label: 'siege_veteran', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'siege_concluded', delay: 7 },
      ],
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const MERCENARY_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'mc.social.sparring_ring',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'sparring_ring', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.social.war_stories',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'war_stories', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  }),

  withEncounterContract({
    id: 'mc.social.contract_negotiation',
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
      reactions: [
        { kind: 'reputation_tally', domain: 'iron.positive', weight: 0.5 },
        { kind: 'reputation_tally', domain: 'gold.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'contract_negotiated', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  }),
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const MC_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'mc.join',
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
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'mercenary_company', amount: 0.1 },
      { kind: 'recent_event', label: 'joined_mercenary_company', delay: 0 },
    ],
  },
};

export const MC_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mc.promotion',
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
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'mercenary_company', amount: 0.2 },
      { kind: 'recent_event', label: 'mercenary_promotion', delay: 1 },
    ],
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
