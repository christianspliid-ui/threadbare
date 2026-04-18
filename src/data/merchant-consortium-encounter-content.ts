/**
 * Merchant Consortium Encounter Content — unified format (THR-31 Phase 2e).
 *
 * Voice bible: calculating, civil, precise. Business register with one literary
 * flourish per scene. "terms", "split", "margin", "quiet price", "handshake",
 * "what the room will bear" carry the voice. Numbers never appear — only their weight.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import {
  FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const MCT_DIFFICULTY_BASE = 25;
const MCT_DIFFICULTY_STEP = 10;
const MCT_SENIOR_BASE = 40;
const MCT_ELITE_BASE = 55;
const MCT_JOIN_DIFFICULTY = 20;
const MCT_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const MERCHANT_CONSORTIUM_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['mct.join', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['mct.promotion', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['mct.quest.market_survey', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.negotiate_contract', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.caravan_escort', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['mct.quest.settle_dispute', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['mct.quest.appraise_goods', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['mct.senior.trade_monopoly', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  ['mct.senior.foreign_deal', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  ['mct.senior.acquire_warehouse', { factionDefId: 'merchant_consortium', minRank: 'guildsman', reputationReward: 0.06, questType: 'senior' }],
  ['mct.elite.trade_summit', { factionDefId: 'merchant_consortium', minRank: 'trade_prince', reputationReward: 0.08, questType: 'elite' }],
  ['mct.elite.market_domination', { factionDefId: 'merchant_consortium', minRank: 'trade_prince', reputationReward: 0.08, questType: 'elite' }],
  ['mct.social.wine_tasting', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['mct.social.ledger_review', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['mct.social.guild_feast', { factionDefId: 'merchant_consortium', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.quest.market_survey',
    name: 'Market Survey',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'mct.quest.market_survey.1',
        name: 'Canvas the Stalls',
        narrativeTemplate: 'The consortium needs price data from {location}. {name} walks the market — who is nervous, who is bored, who came alone. The margin is in the detail no one else noticed.',
        successAfterimage: 'Detailed price lists. Several merchants said more than they meant to.',
        failureAfterimage: 'Incomplete. Several merchants refused the quiet price of transparency.',
        reach: 'eye',
        difficulty: MCT_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.quest.market_survey.2',
        name: 'Analyze Trends',
        narrativeTemplate: '{?has_faction}The numbers tell a story only {name} knows how to read. A gap in what the room will bear — the consortium moves before anyone else sees it.{/has_faction}{?!has_faction}{name} reviews the data. A quiet price sits unclaimed in the market at {location}. Not for long.{/?!has_faction}',
        successAfterimage: 'A clear opportunity. The consortium will have terms drawn up by morning.',
        failureAfterimage: 'Inconclusive. The market at {location} is not yet ready to be read.',
        reach: 'gold',
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium sends {name} to read {location}\'s market. What the room will bear, reported precisely.',
      success: 'Good data. The consortium acts before the margin closes. {name} leaves with the handshake that matters.',
      failure: 'The survey found no clear terms. The room at {location} is not yet giving up its quiet price.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'mct_market_survey' },
      ],
    },
  },

  {
    id: 'mct.quest.negotiate_contract',
    name: 'Negotiate a Contract',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'mct.quest.negotiate_contract.1',
        name: 'Read the Counterparty',
        narrativeTemplate: 'A supplier offers terms at {location}. {name} watches — who is nervous, who is bored — and understands what they really want before they do.',
        successAfterimage: 'Their priorities read. The leverage is there, quiet and useful.',
        failureAfterimage: 'Their poker face holds. No advantage gained from the room.',
        reach: 'heart',
        difficulty: MCT_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.quest.negotiate_contract.2',
        name: 'Close the Deal',
        narrativeTemplate: '{?has_faction}The handshake, then the terms. {name} closes what the room at {location} was always going to bear — it just needed someone to name it first.{/has_faction}{?!has_faction}{name} puts ink to paper. The consortium gets what it came for.{/?!has_faction}',
        successAfterimage: 'Excellent terms. The consortium profits. A clean handshake.',
        failureAfterimage: 'Standard terms only. The room gave up less than the quiet price.',
        reach: 'gold',
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A supplier at {location} has offered terms. {name} goes to find the margin they did not know they were leaving.',
      success: 'Good terms. The consortium leaves with the split it wanted. The handshake is clean.',
      failure: 'The room did not give up what it would bear. The terms are standard. The consortium is disappointed.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'mct_contract' },
      ],
    },
  },

  {
    id: 'mct.quest.caravan_escort',
    name: 'Manage the Caravan',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'mct.quest.caravan_escort.1',
        name: 'Organize the Wagons',
        narrativeTemplate: 'A trade caravan leaves {location} soon. {name} ensures the terms of loading are observed — goods inventoried, guards on good terms with the work ahead.',
        successAfterimage: 'Well-organized. The caravan departs on schedule. The terms, honored.',
        failureAfterimage: 'Delays in loading. The caravan sets out late. The margin shrinks before it travels a mile.',
        reach: 'gold',
        difficulty: MCT_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.quest.caravan_escort.2',
        name: 'Deliver the Goods',
        narrativeTemplate: '{?has_faction}The road is long. {name} keeps the caravan at what the road will bear — not faster than the goods can take, not slower than the terms allow.{/has_faction}{?!has_faction}{name} moves the caravan. The quiet price of a good delivery: no surprises.{/?!has_faction}',
        successAfterimage: 'All goods intact. A profitable run. The split is generous.',
        failureAfterimage: 'Spoilage and losses. The margin barely held. The consortium expected more.',
        reach: 'heart',
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A trade caravan must move from {location}. {name} manages the terms of its passage.',
      success: 'Delivered intact. The split is clean. The consortium\'s terms, honored.',
      failure: 'Losses on the road. The margin was there — just not enough of it.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'mct_caravan' },
      ],
    },
  },

  {
    id: 'mct.quest.settle_dispute',
    name: 'Settle a Trade Dispute',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'mct.quest.settle_dispute.1',
        name: 'Hear Both Sides',
        narrativeTemplate: 'Two merchants at {location} claim the same shipment. {name} hears them — who is nervous, who is bored, what the room will bear from an arbitrator.',
        successAfterimage: 'Both sides understood. A fair ruling takes shape from the nuances.',
        failureAfterimage: 'Both sides are stubborn. No common ground yet. The room is not giving up its quiet price.',
        reach: 'heart',
        difficulty: (MCT_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.quest.settle_dispute.2',
        name: 'Broker the Agreement',
        narrativeTemplate: '{?has_faction}The consortium\'s terms: a split both parties can accept. {name} names the handshake, and the room — having heard what it will bear — agrees.{/has_faction}{?!has_faction}{name} crafts the compromise. Commerce requires it. Both parties sign.{/?!has_faction}',
        successAfterimage: 'Both parties sign. Commerce resumes. The terms hold.',
        failureAfterimage: 'The dispute festers. The consortium notes {name}\'s failure to read the room.',
        reach: 'gold',
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A trade dispute in {location} needs the consortium\'s arbitration. {name} reads the room.',
      success: 'Dispute settled. Both merchants leave lighter and satisfied, which is the only split the consortium permits.',
      failure: 'No agreement reached. The room did not bear what {name} offered.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.05 },
        { kind: 'recent_event', tag: 'mct_dispute' },
      ],
    },
  },

  {
    id: 'mct.quest.appraise_goods',
    name: 'Appraise Rare Goods',
    locationSubtypes: ['town', 'city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'mct.quest.appraise_goods.1',
        name: 'Examine the Merchandise',
        narrativeTemplate: 'A shipment of unusual goods arrives at {location}. {name} examines it — what the room will bear from a buyer who knows the book price and the street price and the quiet price.',
        successAfterimage: 'The genuine articles spotted among the fakes. The margin is there.',
        failureAfterimage: 'Unfamiliar goods. The estimate is uncertain. The consortium trades on uncertain terms.',
        reach: 'eye',
        difficulty: (MCT_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.quest.appraise_goods.2',
        name: 'Set the Price',
        narrativeTemplate: '{?has_faction}{name} names the valuation. The book price, adjusted for the street price, adjusted for what the room at {location} will bear. The consortium trades on {name}\'s word.{/has_faction}{?!has_faction}{name} names the price. The split that follows depends on this call.{/?!has_faction}',
        successAfterimage: 'Accurate appraisal. The consortium profits. A good call at the right margin.',
        failureAfterimage: 'The valuation was off. The consortium takes a loss. The handshake is less warm.',
        reach: 'gold',
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Unusual goods at {location} need the consortium\'s eye on them. {name} goes to name what the room will bear.',
      success: 'Good appraisal. The terms held. The consortium profited from {name}\'s quiet certainty.',
      failure: 'The call was wrong. A bad appraisal is a story that outruns the appraiser.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.05 },
        { kind: 'recent_event', tag: 'mct_appraise' },
      ],
    },
  },
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.senior.trade_monopoly',
    name: 'Establish Trade Monopoly',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'mct.senior.trade_monopoly.1',
        name: 'Undercut Competitors',
        narrativeTemplate: 'The consortium targets a specific commodity in {location}. {name} drives the book price down until competitors cannot hold their margin.',
        successAfterimage: 'Competitors struggling. Market share shifting. What the room will bear is now the consortium\'s floor.',
        failureAfterimage: 'The competitors match the price. A war of attrition — expensive for both sides.',
        reach: 'gold',
        difficulty: MCT_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.senior.trade_monopoly.2',
        name: 'Lock In Suppliers',
        narrativeTemplate: '{?has_faction}Exclusive terms with the key suppliers in {location}. {name} offers what the room will bear — and a little more — to close the door behind the consortium.{/has_faction}{?!has_faction}{name} secures the exclusive contracts. The supply is now the consortium\'s quiet price.{/?!has_faction}',
        successAfterimage: 'Exclusive rights secured. The consortium controls the supply. The split is entirely in its favor.',
        failureAfterimage: 'Suppliers demand too much. The monopoly plan stalls at the terms.',
        reach: 'heart',
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium intends to control the supply of a key commodity in {location}. {name} goes to set the terms.',
      success: 'The monopoly holds. The market at {location} moves through the consortium now.',
      failure: 'The suppliers held their terms. The monopoly is deferred. A bad deal will follow you.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.06 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'mct_monopoly' },
      ],
    },
  },

  {
    id: 'mct.senior.foreign_deal',
    name: 'Foreign Trade Deal',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'mct.senior.foreign_deal.1',
        name: 'Learn the Customs',
        narrativeTemplate: 'Foreign merchants arrive at {location} with exotic goods and unfamiliar terms. {name} watches — who is nervous, who is bored — and begins reading the room in a language the consortium has not yet learned.',
        successAfterimage: 'Cultural barriers navigated. Trust beginning. The terms are starting to show their edges.',
        failureAfterimage: 'A faux pas offends the delegation. Relations cool. The margin grows harder to find.',
        reach: 'heart',
        difficulty: MCT_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.senior.foreign_deal.2',
        name: 'Seal the Pact',
        narrativeTemplate: '{?has_faction}Terms that benefit both sides. {name} finds what the foreign room will bear and names the handshake that opens a new trade route from {location}.{/has_faction}{?!has_faction}{name} names the split. Long-term terms, if the room accepts them.{/?!has_faction}',
        successAfterimage: 'A new trade route opens. The consortium has the quiet price on exotic goods now.',
        failureAfterimage: 'The foreigners walked. The opportunity is lost. The story will follow the deal.',
        reach: 'gold',
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Foreign merchants at {location} want to establish a trade relationship. {name} finds the terms the room will bear.',
      success: 'New route established. Exotic goods flow. The handshake was clean.',
      failure: 'The delegation left. Being read follows them from room to room — the consortium hopes only for a year.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.06 },
        { kind: 'encounter_seed', templateId: 'mct.elite.trade_summit', delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 3 },
        { kind: 'recent_event', tag: 'mct_foreign_deal' },
      ],
    },
  },

  {
    id: 'mct.senior.acquire_warehouse',
    name: 'Acquire a Warehouse',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'mct.senior.acquire_warehouse.1',
        name: 'Survey Available Properties',
        narrativeTemplate: 'The consortium needs more storage in {location}. {name} surveys the available properties — what the room will bear from a building near the dock, near the market, near the terms.',
        successAfterimage: 'A suitable warehouse found near the docks. The quiet price is visible.',
        failureAfterimage: 'Nothing available in the right location. The margin is in the wrong district.',
        reach: 'eye',
        difficulty: MCT_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.senior.acquire_warehouse.2',
        name: 'Negotiate the Purchase',
        narrativeTemplate: '{?has_faction}The owner names a book price. {name} names a street price. What the room will bear is somewhere between them, and {name} finds it.{/has_faction}{?!has_faction}{name} haggles the warehouse down to what the consortium will pay.{/?!has_faction}',
        successAfterimage: 'Keys in hand. The consortium expands its terms in {location}.',
        failureAfterimage: 'The price was too high. The handshake was not extended.',
        reach: 'gold',
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium requires more storage in {location}. {name} finds the building and the terms.',
      success: 'The warehouse is the consortium\'s. The split was clean. The room agreed.',
      failure: 'The deal fell through. The book price was not what the room would bear.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.06 },
        { kind: 'recent_event', tag: 'mct_warehouse' },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.elite.trade_summit',
    name: 'Trade Summit',
    locationSubtypes: ['capital'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'mct.elite.trade_summit.1',
        name: 'Organize the Summit',
        narrativeTemplate: '{name} gathers the most powerful merchants in the region to {location}. Who comes, who does not — that is the first thing the room will bear from the consortium.',
        successAfterimage: 'All major interests send representatives. The summit has weight. The terms begin.',
        failureAfterimage: 'Key players decline. The summit lacks the standing to set what the room will bear.',
        reach: 'heart',
        difficulty: MCT_ELITE_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.elite.trade_summit.2',
        name: 'Propose the Charter',
        narrativeTemplate: '{name} presents the unified trade charter — terms that cement the consortium\'s position as what the room at {location} decides it will bear.',
        successAfterimage: 'The charter finds support. Signatures begin. The quiet price of dominance is being paid.',
        failureAfterimage: 'Opposition blocks key clauses. Deadlock. The room has not yet been read.',
        reach: 'gold',
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.elite.trade_summit.3',
        name: 'Seal the Accord',
        narrativeTemplate: '{?has_faction}Final negotiations. {name} reads the room one last time — who is nervous, who is bored, who came alone — and names the terms the summit will accept.{/has_faction}{?!has_faction}{name} closes the accord. The consortium shapes what the region\'s commerce will bear from this point forward.{/?!has_faction}',
        successAfterimage: 'The accord is signed. The consortium shapes regional commerce. A clean handshake at the highest level.',
        failureAfterimage: 'The summit collapses. Rival factions grow bolder. A bad deal follows.',
        reach: 'heart',
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium convenes a regional trade summit at {location}. {name} will set the terms the room will bear.',
      success: 'The accord is signed. Regional commerce moves through the consortium\'s terms now.',
      failure: 'The summit failed. The consortium leaves having been read. That story will follow them.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.08 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'mct_summit' },
      ],
    },
  },

  {
    id: 'mct.elite.market_domination',
    name: 'Market Domination',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'mct.elite.market_domination.1',
        name: 'Map the Competition',
        narrativeTemplate: '{name} catalogs every rival merchant operation in {location} — who is nervous, who is bored, who came alone. The margin exists in every gap between them.',
        successAfterimage: 'Every competitor mapped. Weaknesses noted. What the room will bear is becoming clear.',
        failureAfterimage: 'Some operations are hidden well. The picture is incomplete. The terms cannot be set yet.',
        reach: 'eye',
        difficulty: MCT_ELITE_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.elite.market_domination.2',
        name: 'Execute the Strategy',
        narrativeTemplate: '{name} moves simultaneously — undercut some, buy out others, offer the rest terms that make alliance preferable to resistance. What the room at {location} will bear, offered all at once.',
        successAfterMessage: 'Competitors fall in line. The consortium leads the market now.',
        failureAfterimage: 'A coalition forms against the consortium. The room resists what it is being asked to bear.',
        reach: 'gold',
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'mct.elite.market_domination.3',
        name: 'Consolidate Power',
        narrativeTemplate: '{?has_faction}With competitors weakened, {name} names the terms {location}\'s market will now operate under. The quiet price of dominance: everyone pays it, no one says it aloud.{/has_faction}{?!has_faction}{name} cements control. The split is total. The consortium sets what the room will bear.{/?!has_faction}',
        successAfterimage: 'The market bends to the consortium. Trade flows through the terms {name} named.',
        failureAfterimage: 'Overextended. The consortium retreats. A bad deal that will follow them from room to room.',
        reach: 'gold',
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium intends to dominate {location}\'s market entirely. {name} goes to set what the room will bear.',
      success: 'Total market control. The consortium now sets the terms for all of {location}\'s trade.',
      failure: 'Overextended. The consortium retreats to its core holdings. The story of a bad deal.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.08 },
        { kind: 'recent_event', tag: 'mct_domination' },
      ],
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.social.wine_tasting',
    name: 'Wine Tasting Evening',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'mct.social.wine_tasting.1',
        name: 'Sample the Vintages',
        narrativeTemplate: '{?has_faction}The consortium hosts a tasting at {location}. {name} works the room — who is nervous, who is bored, who came alone. Connections made over cups are the handshake before the handshake.{/has_faction}{?!has_faction}{name} circulates at the tasting. New contacts noted against the margin of the evening.{/?!has_faction}',
        successAfterimage: 'The right people charmed. New contacts added to the ledger. The quiet price of a good evening.',
        failureAfterimage: 'An awkward spill. {name} leaves before the story sets.',
        reach: 'heart',
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium\'s tasting at {location}. Connections over cups, terms over the second glass.',
      success: 'A productive evening. New names in the ledger. What the room bore, collected.',
      failure: 'An evening that cost more than it yielded. The consortium notes the split.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'mct_social' },
      ],
    },
  },

  {
    id: 'mct.social.ledger_review',
    name: 'Quarterly Ledger Review',
    locationSubtypes: ['town', 'city', 'capital'],
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
        id: 'mct.social.ledger_review.1',
        name: 'Present the Numbers',
        narrativeTemplate: '{?has_faction}The consortium meets to review accounts from {location}. {name} presents the quarter — book price, street price, what the room bore and what it did not. Clean books, or the story begins.{/has_faction}{?!has_faction}{name} shows the quarterly numbers. The factors nod, or they do not.{/?!has_faction}',
        successAfterimage: 'Clean books. The factors nod approval. The split is acceptable.',
        failureAfterimage: 'Discrepancies. Uncomfortable questions. The margin was not where it was reported.',
        reach: 'gold',
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium\'s quarterly review at {location}. The terms of the last season, accounted for.',
      success: 'Clean books. The consortium approves the split. A handshake for good numbers.',
      failure: 'Discrepancies noted. The consortium does not forget bad numbers — they follow a ledger for years.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'mct_social' },
      ],
    },
  },

  {
    id: 'mct.social.guild_feast',
    name: 'Consortium Feast',
    locationSubtypes: ['city', 'capital'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'mct.social.guild_feast.1',
        name: 'Work the Room',
        narrativeTemplate: '{?has_faction}The annual feast at {location} brings every consortium member together. {name} moves through it reading the room — handshakes and quiet prices, all at once.{/has_faction}{?!has_faction}{name} works the feast. Every conversation a potential split in the room.{/?!has_faction}',
        successAfterimage: 'Handshakes and promises. Standing in the consortium grows. The room was worth attending.',
        failureAfterimage: 'A forgettable evening. {name} left no impression. The margin was there and unused.',
        reach: 'heart',
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The consortium\'s annual feast at {location}. Every member present, every term in the air.',
      success: 'Good work in the room. Standing increased. New handshakes that will mean something next quarter.',
      failure: 'Forgettable. The consortium will not remember it. Neither will anyone {name} needed to impress.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'gold.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'mct_social' },
      ],
    },
  },
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const MCT_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'mct.join',
  name: 'Join the Merchant Consortium',
  locationSubtypes: ['town', 'city', 'capital'],
  rarityTier: 1,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'gold',
  reachSecondary: 'heart',
  encounterType: 'trade',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 6.0,
  steps: [
    {
      id: 'mct.join.1',
      name: 'The Entrance Examination',
      narrativeTemplate: '{?has_faction}The consortium at {location} tests {name}\'s commercial judgment. A trade problem named, a solution expected. The room will bear only correct answers.{/has_faction}{?!has_faction}{name} solves the consortium\'s entrance problem. The terms are clear.{/?!has_faction}',
      successAfterimage: 'Sound reasoning. The consortium accepts the application. A new apprentice in the terms.',
      failureAfterimage: 'The grasp of commerce is lacking. The consortium suggests further study before the next attempt.',
      reach: 'gold',
      difficulty: MCT_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'The consortium at {location} considers {name}\'s application. The terms of membership are not negotiable.',
    success: 'Accepted. {name} enters the consortium\'s terms. The ledger gains a new name.',
    failure: 'The examination was not passed. The consortium is patient. The market is not.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'merchant_consortium', delta: 0.05 },
      { kind: 'recent_event', tag: 'mct_join' },
    ],
  },
};

export const MCT_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mct.promotion',
  name: 'Consortium Advancement',
  locationSubtypes: ['town', 'city', 'capital'],
  rarityTier: 2,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'gold',
  reachSecondary: 'heart',
  encounterType: 'trade',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 7.0,
  steps: [
    {
      id: 'mct.promotion.1',
      name: 'The Profit Test',
      narrativeTemplate: '{?has_faction}Higher rank requires demonstrated profit. {name} presents the portfolio — book price, street price, the split the consortium achieved and whether what the room bore was enough.{/has_faction}{?!has_faction}{name} presents the returns. The consortium reviews what the room bore.{/?!has_faction}',
      successAfterimage: 'Impressive returns. The new title is announced at the next assembly. A clean handshake.',
      failureAfterimage: 'The numbers fall short. The consortium expects more. The terms are not yet met.',
      reach: 'gold',
      difficulty: MCT_PROMOTION_DIFFICULTY / 100,
      duration: { min: 2, max: 2 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'The consortium reviews {name}\'s record at {location}. Advancement requires demonstrating what the market bore.',
    success: 'Promoted. The consortium acknowledges the margin {name} delivered. A new title, new terms.',
    failure: 'Insufficient returns. The consortium is civil about it. The split was not right.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'merchant_consortium', delta: 0.05 },
      { kind: 'recent_event', tag: 'mct_promotion' },
    ],
  },
};

export const MCT_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  MCT_JOIN_TEMPLATE,
  MCT_PROMOTION_TEMPLATE,
];

// ─── Combined Export ───────────────────────────────────────────────────────

export const ALL_MCT_TEMPLATES: UnifiedActionTemplate[] = [
  ...MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES,
  ...MERCHANT_CONSORTIUM_SENIOR_TEMPLATES,
  ...MERCHANT_CONSORTIUM_ELITE_TEMPLATES,
  ...MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES,
  MCT_JOIN_TEMPLATE,
  MCT_PROMOTION_TEMPLATE,
];

// ─── Lookup ───────────────────────────────────────────────────────────────

export function getMerchantConsortiumEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_MCT_TEMPLATES.find(t => t.id === id);
}
