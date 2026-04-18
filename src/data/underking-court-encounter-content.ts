/**
 * Underking Court Encounter Content — unified format (THR-31 Phase 2b).
 *
 * Voice bible: regal, intrigue-laden, old. The Court speaks as if every
 * conversation has been happening for a hundred years. Euphemism does work
 * that a direct word would spoil. "compact", "old word", "what is owed",
 * "long quiet" are load-bearing phrases.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import {
  FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
  FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const UK_DIFFICULTY_BASE = 25;
const UK_DIFFICULTY_STEP = 10;
const UK_SENIOR_BASE = 40;
const UK_ELITE_BASE = 55;
const UK_JOIN_DIFFICULTY = 20;
const UK_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const UNDERKING_COURT_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['uk.join', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.0, questType: 'standard' }],
  ['uk.promotion', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.0, questType: 'standard' }],
  ['uk.quest.pickpocket_run', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.fence_goods', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.protection_racket', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.04, questType: 'standard' }],
  ['uk.quest.smuggle_cargo', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.05, questType: 'standard' }],
  ['uk.quest.blackmail_mark', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.05, questType: 'standard' }],
  ['uk.senior.heist_planning', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  ['uk.senior.eliminate_rival', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  ['uk.senior.corrupt_official', { factionDefId: 'underking_court', minRank: 'enforcer', reputationReward: 0.06, questType: 'senior' }],
  ['uk.elite.seize_territory', { factionDefId: 'underking_court', minRank: 'underboss', reputationReward: 0.08, questType: 'elite' }],
  ['uk.elite.shadow_coup', { factionDefId: 'underking_court', minRank: 'underboss', reputationReward: 0.08, questType: 'elite' }],
  ['uk.social.gambling_den', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
  ['uk.social.black_market', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
  ['uk.social.whisper_network', { factionDefId: 'underking_court', minRank: 'pawn', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const UNDERKING_COURT_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.quest.pickpocket_run',
    name: 'Pickpocket Run',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'uk.quest.pickpocket_run.1',
        name: 'Case the Crowd',
        narrativeTemplate: 'The market at {location} is a courtesy extended to the Court — all those purses moving through the press, the crowd too loud to notice {name} noting who carries what.',
        successAfterimage: 'Easy marks. Wealthy and distracted. The old word for this is opportunity.',
        failureAfterimage: 'Too many watchful eyes. A vigil {name} was not prepared for.',
        reach: 'eye',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.quest.pickpocket_run.2',
        name: 'Lift the Purses',
        narrativeTemplate: '{?has_faction}The Court has an old compact with the crowd — it does not notice, and {name} does not linger.{/has_faction}{?!has_faction}Quick fingers, steady nerve. {name} has been here before, in other markets, under other names.{/?!has_faction}',
        successAfterimage: 'Heavy purses. A clean haul. What is owed to the throne beneath is paid.',
        failureAfterimage: 'Caught reaching. The long quiet before a guard arrives.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court sends {name} into the press of {location}. What is held in trust by strangers will be held by the throne beneath before nightfall.',
      success: 'Clean work. The Court nods — the only courtesy it pays — and notes the compact is held.',
      failure: 'The mark held too tight. The Court does not say what this costs. The Court, when it speaks, does not speak of cost.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'uk_court_pawn_run' },
      ],
    },
  },

  {
    id: 'uk.quest.fence_goods',
    name: 'Fence Stolen Goods',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'uk.quest.fence_goods.1',
        name: 'Appraise the Haul',
        narrativeTemplate: 'Stolen goods need a buyer. {name} assesses what the haul is worth — a courtesy to the fence, who will not say what they already know.',
        successAfterimage: 'Valuable. Buyers will compete for the privilege.',
        failureAfterimage: 'Mostly junk. The long quiet of a fence who has seen better.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.quest.fence_goods.2',
        name: 'Make the Deal',
        narrativeTemplate: '{?has_faction}The Court takes what is owed. {name} keeps the rest — a compact old enough that no one remembers who wrote its terms.{/has_faction}{?!has_faction}{name} meets the fence in the back alley. The old word for this arrangement is discretion.{/?!has_faction}',
        successAfterimage: 'Good price. The throne beneath has its share. The compact holds.',
        failureAfterimage: 'The fence lowballs. The long quiet after the price is named.',
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Goods that cannot pass through the gate watch must pass through {name}. What is held in trust by one party will be held by another before morning.',
      success: 'The deal is made. The Court\'s share is paid. The old compact between the throne beneath and those who work for it is honored once more.',
      failure: 'The fence walks. What is owed goes unpaid. The Court notes this, as the Court notes everything.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'uk_court_fence_goods' },
      ],
    },
  },

  {
    id: 'uk.quest.protection_racket',
    name: 'Run the Racket',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'uk.quest.protection_racket.1',
        name: 'Visit the Shops',
        narrativeTemplate: 'Collection day in {location}. {name} makes the rounds — a courtesy extended to the merchants who understand what is owed to the throne beneath.',
        successAfterimage: 'Everyone pays. The old compact, observed without incident.',
        failureAfterimage: 'A shopkeeper refuses. This is what courtesy denied looks like.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.quest.protection_racket.2',
        name: 'Enforce Compliance',
        narrativeTemplate: '{?has_faction}The holdout needs reminding of the compact. {name} explains what is held in trust — and what happens to those who deny the courtesy.{/has_faction}{?!has_faction}{name} delivers the message that the Court does not repeat.{/?!has_faction}',
        successAfterimage: 'The merchant reconsiders. Payment received. The compact is whole.',
        failureAfterimage: 'The guard is called. A long quiet walk out of {location}.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath expects its share of {location}\'s commerce. {name} collects what is owed.',
      success: 'The round closes clean. The Court\'s old compact with this district holds another season.',
      failure: 'Courtesy denied. The Court does not forget which merchants have short memories.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'uk_court_collection' },
      ],
    },
  },

  {
    id: 'uk.quest.smuggle_cargo',
    name: 'Smuggle Cargo',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'uk.quest.smuggle_cargo.1',
        name: 'Prepare the Route',
        narrativeTemplate: 'Contraband must move past the gate watch at {location}. {name} studies the patrol schedule — a long quiet observation before the move.',
        successAfterimage: 'A gap in the watch. The Court\'s old knowledge of every patrol in every city.',
        failureAfterimage: 'The watch has doubled. What is owed to the Court will be delayed.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.quest.smuggle_cargo.2',
        name: 'Move the Goods',
        narrativeTemplate: '{?has_faction}Through the routes the Court has used for a hundred years, {name} moves the cargo — the old word for this work is simply "courtesy to the throne beneath."{/has_faction}{?!has_faction}Through sewer and shadow, the cargo moves. {name} does not linger to see it delivered.{/?!has_faction}',
        successAfterimage: 'Delivered. What was held in transit is now held in trust elsewhere.',
        failureAfterimage: 'Intercepted. The cargo is lost. The compact requires a conversation about what is owed.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires certain goods to move without declaration. {name} understands the old word for such arrangements: necessary.',
      success: 'Cargo delivered. The Court profits. The long quiet after a job done properly.',
      failure: 'Intercepted. The compact between the Court and the watch was, this once, more fragile than expected.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.05 },
        { kind: 'recent_event', tag: 'uk_court_smuggle' },
      ],
    },
  },

  {
    id: 'uk.quest.blackmail_mark',
    name: 'Blackmail a Mark',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'uk.quest.blackmail_mark.1',
        name: 'Gather Dirt',
        narrativeTemplate: 'Every notable in {location} has something held in trust against their will. {name} finds it — a long quiet observation of the sort the Court has practiced for generations.',
        successAfterimage: 'A scandal worth having. Leverage well-acquired.',
        failureAfterimage: 'Clean as a kept promise. Or better at concealment than expected.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.quest.blackmail_mark.2',
        name: 'Apply Pressure',
        narrativeTemplate: '{?has_faction}The Court does not threaten. The Court delivers what the old word calls "a reminder of what is owed." {name} delivers this reminder with the appropriate courtesy.{/has_faction}{?!has_faction}{name} lays out the compact: pay, or be exposed. The terms are the Court\'s.{/?!has_faction}',
        successAfterimage: 'The mark pays. A reliable income stream born from what was held in trust.',
        failureAfterimage: 'The mark calls the bluff. Courtesy denied — and now they know the Court\'s reach.',
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires a new source of revenue in {location}. {name} will find what is held in trust by those who cannot afford it to be known.',
      success: 'The compact is written in silence. The mark pays. The Court holds what it holds.',
      failure: 'The mark refuses. The old word for this outcome is embarrassment. The Court does not use it aloud.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.05 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'uk_court_blackmail' },
      ],
    },
  },
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const UNDERKING_COURT_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.senior.heist_planning',
    name: 'Plan the Heist',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'uk.senior.heist_planning.1',
        name: 'Case the Target',
        narrativeTemplate: 'A wealthy estate near {location} holds something the throne beneath wants. {name} studies the defenses — the old long quiet of a Court enforcer on observation.',
        successAfterimage: 'Guard rotations mapped. Entry points known. What is held in trust by the estate is about to change hands.',
        failureAfterimage: 'Better guarded than expected. The compact must be renegotiated.',
        reach: 'eye',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.senior.heist_planning.2',
        name: 'Execute the Job',
        narrativeTemplate: '{?has_faction}In through the window that the Court has known about for thirty years, past guards who do not know what courtesy is being paid to the throne beneath. {name} works with the precision the Court demands.{/has_faction}{?!has_faction}In through the dark, past the guards, into the vault. {name} takes what was always owed.{/?!has_faction}',
        successAfterimage: 'Clean job. The old word for this is "collected." No one saw a thing.',
        failureAfterimage: 'Alarms triggered. The prize stays. The compact with the Court now includes a debt.',
        reach: 'shadow',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath wants what a wealthy family of {location} has been holding in trust — though they do not yet know it is held in trust.',
      success: 'A clean haul. The Court nods. The compact between the throne beneath and those who serve it holds.',
      failure: 'The prize remains. The Court logs the courtesy denied and sends another name next season.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.06 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'uk_court_heist' },
      ],
    },
  },

  {
    id: 'uk.senior.eliminate_rival',
    name: 'Eliminate a Rival',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'lead',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'uk.senior.eliminate_rival.1',
        name: 'Track the Target',
        narrativeTemplate: 'A rival operator has ignored the old compact — their operations encroach on {location} without courtesy paid to the throne beneath. {name} finds them.',
        successAfterimage: 'Vulnerable at their safe house. What is owed the Court is about to be collected.',
        failureAfterimage: 'Cautious. Hard to pin down. The long quiet before a second attempt.',
        reach: 'shadow',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.senior.eliminate_rival.2',
        name: 'Send the Message',
        narrativeTemplate: '{?has_faction}The Court does not explain. The Court removes what violates the compact. {name} delivers the old word for what happens when you operate in the throne beneath\'s territory without paying what is owed.{/has_faction}{?!has_faction}{name} removes the rival. Their operations fold into the Court\'s. The long quiet after.{/?!has_faction}',
        successAfterimage: 'The rival is gone. Their old holdings pass to the throne beneath. Courtesy, eventually, paid.',
        failureAfterimage: 'The rival escapes. They know the Court\'s face now. The compact is broken openly.',
        reach: 'shadow',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court does not tolerate operations in {location} that have not paid what is owed to the throne beneath. {name} will address this discourtesy.',
      success: 'The rival is removed. The Court\'s old compact with this district is restored.',
      failure: 'The rival escapes with knowledge of {name}. The Court notes the outcome without comment.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.06 },
        { kind: 'hidden_mark', markType: 'betrayal' as const, severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY },
        { kind: 'encounter_seed', templateId: 'uk.elite.seize_territory', delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2 },
        { kind: 'recent_event', tag: 'uk_court_eliminate_rival' },
      ],
    },
  },

  {
    id: 'uk.senior.corrupt_official',
    name: 'Corrupt an Official',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'uk.senior.corrupt_official.1',
        name: 'Identify Weakness',
        narrativeTemplate: 'Every official in {location} holds something — ambition, debt, a secret — that makes them available. {name} finds the one who is most ready to learn what is owed to the throne beneath.',
        successAfterimage: 'Debts piling up. A vulnerable official found. The old word for this is a door opening.',
        failureAfterimage: 'Annoyingly honest. A long quiet reassessment of who else might be available.',
        reach: 'eye',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.senior.corrupt_official.2',
        name: 'Make the Offer',
        narrativeTemplate: '{?has_faction}Gold, favors, or the old word the Court has used for centuries — "protection." {name} brings the official into the compact. The throne beneath gains an asset in the hall.{/has_faction}{?!has_faction}{name} makes the offer. The compact is simple: what is owed is owed, and the Court remembers both sides.{/?!has_faction}',
        successAfterimage: 'The official accepts. A useful door into the city hall. The compact, extended.',
        failureAfterimage: 'They refuse. The long quiet before {name} vanishes and a different approach is found.',
        reach: 'gold',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires a friend inside the halls of {location}. {name} will find who holds something worth trading.',
      success: 'The official enters the compact. The Court holds what was held in trust. The long quiet of a done deal.',
      failure: 'The official reports the approach. The Court notes their name as one who has denied the courtesy.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.06 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'uk_court_corruption' },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const UNDERKING_COURT_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.elite.seize_territory',
    name: 'Seize Territory',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'lead',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'uk.elite.seize_territory.1',
        name: 'Weaken the Competition',
        narrativeTemplate: 'An entire district of {location} must pass to the throne beneath. {name} undermines those who currently hold what is owed to the Court — the old work before the old word.',
        successAfterimage: 'Their operations disrupted. Lieutenants bought. What was held in trust elsewhere is loosening.',
        failureAfterimage: 'The competition pushes back. The compact must be extended by force.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.elite.seize_territory.2',
        name: 'Install Operations',
        narrativeTemplate: '{name} moves the Court\'s people into {location}. The old compact is posted — not written, never written — but understood by everyone who operates in the district.',
        successAfterimage: 'New territory secured. What was the other faction\'s revenue is now the Court\'s courtesy to collect.',
        failureAfterimage: 'The district resists. Local loyalty runs as deep as the Court\'s patience.',
        reach: 'gold',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.elite.seize_territory.3',
        name: 'Consolidate Power',
        narrativeTemplate: '{?has_faction}The throne beneath does not hold territory through force alone. {name} rewards the loyal and reminds the defiant of what is owed — the long quiet after makes the point better than anything said.{/has_faction}{?!has_faction}{name} holds the line. The Court\'s old word for this is simply: endurance.{/?!has_faction}',
        successAfterimage: 'The district is the Court\'s. The Underking approves. The compact expands.',
        failureAfterimage: 'Cracks form. Holding territory is harder than taking it. The old truth, rediscovered.',
        reach: 'shadow',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath intends to hold all of {location}\'s underworld. {name} is the instrument of that old compact being, at last, enforced.',
      success: 'The district belongs to the Court. The compact is written in shadow and collection receipts.',
      failure: 'Territory contested. The Court notes the outcome in its ledger of what is owed — and what is not yet collected.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.08 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'uk_court_territory' },
      ],
    },
  },

  {
    id: 'uk.elite.shadow_coup',
    name: 'Shadow Coup',
    locationSubtypes: ['capital'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'uk.elite.shadow_coup.1',
        name: 'Build the Network',
        narrativeTemplate: 'The throne beneath requires agents in every position that matters in {location}. {name} places them — a long quiet work of patience and old favors called in.',
        successAfterimage: 'Agents in place. The web is woven. The compact now reaches into the highest halls.',
        failureAfterimage: 'A double agent. The network is compromised. The long quiet of exposure.',
        reach: 'shadow',
        difficulty: UK_ELITE_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.elite.shadow_coup.2',
        name: 'Pull the Strings',
        narrativeTemplate: '{name} activates the network. Key decisions in {location} now flow through what is held in trust by the throne beneath. The city\'s leadership does not know the order of speaking has changed.',
        successAfterimage: 'The city\'s choices are the Court\'s choices. The old compact, now at its fullest extension.',
        failureAfterimage: 'Counter-intelligence. Some agents exposed. The compact pulls back.',
        reach: 'gold',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'uk.elite.shadow_coup.3',
        name: 'Claim the Throne',
        narrativeTemplate: '{?has_faction}The Underking demands what was always held in trust for the throne beneath. {name} completes the work. Total control. The city bows — without knowing it has bowed.{/has_faction}{?!has_faction}{name} pulls the final threads. The city belongs to the Court now. Courtesy received.{/?!has_faction}',
        successAfterimage: 'The city is the Court\'s. None are the wiser. The old word for this is: complete.',
        failureAfterimage: 'The coup unravels. Scapegoats are needed. The compact requires new terms.',
        reach: 'shadow',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath will hold {location} entirely — not by force, but by the old compact extended until there is nothing outside it.',
      success: 'The city is the Court\'s. The order of speaking has changed everywhere. No one announces this.',
      failure: 'The coup collapses. The Court retreats. What is owed is deferred — not forgiven.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.08 },
        { kind: 'hidden_mark', markType: 'betrayal' as const, severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY },
        { kind: 'recent_event', tag: 'uk_court_coup' },
      ],
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const UNDERKING_COURT_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.social.gambling_den',
    name: 'The Gambling Den',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'uk.social.gambling_den.1',
        name: 'Play the Tables',
        narrativeTemplate: '{?has_faction}Dice and cards in a room the Court runs. {name} plays — the tables are a courtesy extended to those who understand what is held in trust by everyone at them.{/has_faction}{?!has_faction}{name} sits at the tables. Connections are made over games. The old word for this establishment is useful.{/?!has_faction}',
        successAfterimage: 'Lucky. Heavier pockets. New contacts who know what is owed goes both ways.',
        failureAfterimage: 'Bad luck. Lighter pockets. But now {name} knows who cheats — and who watches.',
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court\'s gambling den at {location} is where the old compact is observed in its simplest form: everyone pays to play.',
      success: 'A profitable evening. The old word for this is: what is owed, collected.',
      failure: 'A losing night. The Court\'s tables are patient creditors.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'uk_court_social' },
      ],
    },
  },

  {
    id: 'uk.social.black_market',
    name: 'Black Market Browse',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'uk.social.black_market.1',
        name: 'Browse the Wares',
        narrativeTemplate: '{?has_faction}The underground market at {location} sells what is held in trust from every job in the district. {name} browses — a courtesy extended to those who know the old word for this commerce.{/has_faction}{?!has_faction}{name} moves through the market. What cannot pass the gate watch sells here at a different rate.{/?!has_faction}',
        successAfterimage: 'A rare find. What was held elsewhere is now held by {name}.',
        failureAfterimage: 'Nothing worth having today. The good stock is gone or hidden.',
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath\'s black market in {location} has what the legitimate shops will not carry.',
      success: 'A good purchase. The compact between buyer and seller, honored.',
      failure: 'The market has nothing. The Court\'s inventory is, today, elsewhere.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'uk_court_social' },
      ],
    },
  },

  {
    id: 'uk.social.whisper_network',
    name: 'Whisper Network',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'uk.social.whisper_network.1',
        name: 'Trade Secrets',
        narrativeTemplate: '{?has_faction}Information is the old currency of the Court. {name} enters the whisper network at {location} — share one rumor, receive two. What is held in trust by one mouth is held by another by nightfall.{/has_faction}{?!has_faction}{name} trades in what the Court holds as its oldest stock: what people do not know they are telling.{/?!has_faction}',
        successAfterimage: 'Useful intelligence. Someone now owes {name} a favor the Court can collect.',
        failureAfterimage: 'More given than gained. A poor trade. The long quiet of an unfavorable exchange.',
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court\'s whisper network at {location} is where what is held in trust by everyone is traded at the old word\'s price: discretion.',
      success: 'Good intelligence gained. The compact between those who know and those who need to know, honored.',
      failure: 'More given than received. The old compact, this time, favored the other side.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'shadow.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'uk_court_social' },
      ],
    },
  },
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const UK_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'uk.join',
  name: 'Prove Your Worth to the Court',
  locationSubtypes: ['city', 'capital'],
  rarityTier: 1,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 6.0,
  steps: [
    {
      id: 'uk.join.1',
      name: 'The Test',
      narrativeTemplate: '{?has_faction}The Court demands proof of skill. Steal something valuable without being caught. The old word for this test is simply: the courtesy you pay to be allowed to pay the Court.{/has_faction}{?!has_faction}{name} proves their worth to the throne beneath. The compact begins with a clean job.{/?!has_faction}',
      successAfterimage: 'Clean work. {name} is a pawn of the Court now. What is owed begins today.',
      failureAfterimage: 'Too clumsy. The Court has no use for those who cannot hold what they take.',
      reach: 'shadow',
      difficulty: UK_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'The throne beneath considers all applications at {location} in the old way: demonstrate, or leave.',
    success: 'The Court accepts {name}. The compact is signed in the only ink the Court uses: demonstrated competence.',
    failure: 'The Court does not say goodbye. The Court simply does not call again.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'underking_court', delta: 0.05 },
      { kind: 'recent_event', tag: 'uk_court_join' },
    ],
  },
};

export const UK_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'uk.promotion',
  name: 'Court Advancement',
  locationSubtypes: ['city', 'capital'],
  rarityTier: 2,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'shadow',
  reachSecondary: 'gold',
  encounterType: 'steal',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 7.0,
  steps: [
    {
      id: 'uk.promotion.1',
      name: 'The Proving',
      narrativeTemplate: '{?has_faction}Higher rank in the Court requires a demonstration of what the old word calls "cunning beyond what is owed." {name} is tested. The throne beneath watches without announcing it is watching.{/has_faction}{?!has_faction}{name} must prove themselves worthy of more of the Court\'s trust.{/?!has_faction}',
      successAfterimage: 'The Court elevates {name}. More power. More expectations. The compact deepens.',
      failureAfterimage: 'Not yet. Remain where you are. The long quiet of a held rank.',
      reach: 'shadow',
      difficulty: UK_PROMOTION_DIFFICULTY / 100,
      duration: { min: 2, max: 2 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'The throne beneath considers {name}\'s standing in the compact. The old word for promotion is: what is owed, re-negotiated.',
    success: 'New rank granted. The order of speaking shifts. The Court notes the change without ceremony.',
    failure: 'Not yet. The Court\'s patience is as long as its memory.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'underking_court', delta: 0.05 },
      { kind: 'recent_event', tag: 'uk_court_promotion' },
    ],
  },
};

export const UK_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  UK_JOIN_TEMPLATE,
  UK_PROMOTION_TEMPLATE,
];

// ─── Combined Export ───────────────────────────────────────────────────────

export const ALL_UK_TEMPLATES: UnifiedActionTemplate[] = [
  ...UNDERKING_COURT_ENCOUNTER_TEMPLATES,
  ...UNDERKING_COURT_SENIOR_TEMPLATES,
  ...UNDERKING_COURT_ELITE_TEMPLATES,
  ...UNDERKING_COURT_SOCIAL_TEMPLATES,
  UK_JOIN_TEMPLATE,
  UK_PROMOTION_TEMPLATE,
];

// ─── Lookup ───────────────────────────────────────────────────────────────

export function getUnderkingCourtEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_UK_TEMPLATES.find(t => t.id === id);
}
