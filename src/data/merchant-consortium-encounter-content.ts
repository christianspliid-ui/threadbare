/**
 * Merchant Consortium Encounter Content — rewritten to UnifiedActionTemplate (THR-94).
 *
 * Quest, senior, elite, social, join, and promotion templates for the Merchant
 * Consortium, rewritten to UnifiedActionTemplate format with Threadbare-aesthetic
 * prose. Voice bible: calculating, civil, precise — business register with one
 * literary flourish per scene. "terms", "split", "margin", "book price",
 * "street price", "handshake", "ledger" carry the voice. Numbers never appear —
 * only their weight.
 *
 * Systemic affinities (per faction voice guide):
 *   • intelligence grants — trade routes, market conditions, counterparty reads
 *   • encounter seeds — follow-up contracts, summits, debts, broken promises
 *   • hidden marks — ledger manipulation, monopoly secrets, broken handshakes
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';

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

  withEncounterContract({
    id: 'mct.quest.market_survey',
    name: 'Market Survey',
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
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: MCT_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The stalls at {location} open an hour before the bells. {name} walk{s} the rows ' +
          'with nothing to buy, which is the point — a buyer looks at goods, a surveyor looks ' +
          'at how goods move. Who is nervous, who is bored, which merchant counts change twice. ' +
          '{?has_faction}The consortium\'s reports from last quarter are in {their} satchel for ' +
          'comparison. The northern cloth merchant\'s prices have slipped two points since then; ' +
          'no announcement, no explanation given.{/has_faction}' +
          '{?no_faction}No guild baseline to check against. {name} keep{s} {their} own notes, ' +
          'trusting that the same eye twice will catch what one eye will not.{/no_faction}',
        successAfterimage:
          'Six stalls, three price drifts, one signal — the fishmonger is selling yesterday\'s catch ' +
          'at today\'s price and the buyers are not noticing.',
        failureAfterimage:
          'The morning read like any other morning. Either the market is quiet or {name} missed ' +
          'what was under it.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} sit{s} with the notes in the back of the Coopered Rest and lets the numbers ' +
          'arrange themselves. The book price on salt is steady. The street price has fallen. ' +
          'That gap is where the margin lives for whoever moves first. ' +
          '{?has_ally}{ally:strongest} has a warehouse two streets over — a conversation before ' +
          'the evening bell could make this quiet move faster than the competition.{/has_ally}',
        successAfterimage:
          'The report goes to the factor by runner. By morning the consortium will have bought ' +
          'the salt the market has not yet noticed is cheap.',
        failureAfterimage:
          'Inconclusive notes. What is actually happening at {location} is close to the surface ' +
          'but {name} did not break through it today.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is sent to read the market at {location}. The consortium wants numbers, and ' +
        'the particular shape of what lies between them.',
      success:
        'The report is clean. The margin was there, and the consortium acted before it closed.',
      failure:
        'The survey is thin. What the market is doing at {location} will be someone else\'s report.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The market read at {location} is logged. What {name} saw will shape the consortium\'s ' +
          'moves this quarter — or will not, depending on how much of it was signal.',
        changes: [
          {
            id: 'survey_standing',
            kind: 'reputation',
            title: 'Market Record',
            detail: 'A clean read earns trust with the factors. A thin report is remembered too.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the market\'s signals?',
        reactions: [
          {
            id: 'survey_intel_route',
            label: 'The salt gap is real. Trace the supply back.',
            intent:
              'The book-to-street gap points to a disrupted supply line. Following it will reveal ' +
              'either an opportunity or a reason the gap exists.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Salt supply disruption traced from {location}',
                detail:
                  'Street price on salt at {location} has fallen below book price with no announcement. ' +
                  'Pattern suggests a disrupted upstream route — possibly a new entrant or a stalled caravan.',
                reliability: 0.7,
              },
              {
                // A consortium agent surveying a market reads the gap through
                // the lens of routes already mapped.
                kind: 'intel_referenced_prose',
                category: 'trade_route',
                prose: {
                  reliable: 'The route through {location} unfolded for {name} the way familiar trade does — predictable bottlenecks, predicted yields, the same hands at the same crossings.',
                  uncertain: '{name} approached the trade with notes that had been right last season — most still applied, with a few small errors that cost only the noticing.',
                  dubious: 'What {name} carried as the caravan\'s rhythm in {location} read as a fiction — the schedule had broken, and the rumor had not kept pace.',
                },
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'survey_tally',
            label: 'The report is filed. The consortium moves.',
            intent: 'A clean survey, properly logged. The consortium runs on this kind of quiet work.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.quest.negotiate_contract',
    name: 'Negotiate a Contract',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: MCT_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The supplier at {location} has brought two apprentices and a thick ledger {they} keep ' +
          'tilted so {name} cannot read it upside down. That is a choice. {name} note{s} it. ' +
          'The first quarter-hour is weather and the road and how trade has been — the business ' +
          'of learning what the man across the table wants before he names it. ' +
          '{?has_faction}The consortium\'s file on this supplier is in {name}\'s memory: his ' +
          'margins were thin last year, his brother-in-law is with a rival guild, he loses ' +
          'apprentices faster than he trains them. One of those is the lever.{/has_faction}',
        successAfterimage:
          'The apprentices is the lever. He is defensive about them. Training costs, turnover — ' +
          'he will sign for better terms in exchange for a stability clause.',
        failureAfterimage:
          'The supplier is harder to read than the file suggested. The lever is in the room; ' +
          '{name} did not find it before the tea went cold.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} put{s} the offer on the table in the order the consortium taught: the number ' +
          'first, the duration second, the exclusivity last. Silence after the number is not ' +
          'refusal; it is the other side doing arithmetic. {name} wait{s}. ' +
          '{?has_faction}The boilerplate is three pages the consortium has used a hundred times. ' +
          'The revisions {name} want{s} sit in the margin in {their} own hand.{/has_faction}' +
          '{?no_faction}Without standard terms to anchor on, the conversation circle{s} longer ' +
          'than it should. {name} carry the room with patience instead of precedent.{/no_faction}',
        successAfterimage:
          'Ink on both copies. The supplier looks relieved, which is the tell that {name} left ' +
          'a point or two on the table — intentionally, for the relationship. A clean handshake.',
        failureAfterimage:
          'The supplier signs a standard contract, the one he would have signed with anyone. ' +
          'No lever pulled. No extra margin captured.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A supplier at {location} wants terms. {name} is sent to find the margin he does not ' +
        'yet know he is leaving on the table.',
      success:
        'The contract closes at terms better than the opening offer. The consortium has what ' +
        'it came for.',
      failure:
        'A standard contract signed. The room did not give up its margin today.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The contract is signed — or it is not, in the way that still counts as a relationship ' +
          'recorded with this supplier at {location}.',
        changes: [
          {
            id: 'contract_relationship',
            kind: 'reputation',
            title: 'Supplier Relationship',
            detail: 'A contract is the beginning of a relationship, not the end of a negotiation.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the supplier and the way he signed?',
        reactions: [
          {
            id: 'contract_seed_followup',
            label: 'He will want to renegotiate within the year.',
            intent:
              'The supplier signed because he needed to, not because the terms flattered him. ' +
              'That tension will surface before the contract is out.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.negotiate_contract',
                delayTicks: 18,
                seedLabel: 'Supplier will seek renegotiation before contract term ends',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'contract_tally',
            label: 'The handshake is clean. File the work.',
            intent: 'A supplier on the ledger, a contract in the drawer. The consortium runs on these.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.quest.caravan_escort',
    name: 'Manage the Caravan',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: MCT_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Loading at the yard behind the consortium house in {location} begins before dawn. ' +
          '{name} walk{s} the wagons — axles, seals, the guard captain\'s breath (not on him; ' +
          'they had paid him to be sober today). The manifest in {their} hand has to match what ' +
          'leaves the yard, and what leaves the yard has to match what was paid for. ' +
          '{?has_artifact}The iron stamp the consortium issues for manifest seals sits in ' +
          '{name}\'s pocket. Breakage is tracked; replacement is expensive.{/has_artifact}',
        successAfterimage:
          'The last wagon rolls out on schedule. The manifest ticks even, down to the last crate. ' +
          'The captain nod{s} at {name} the way a man nod{s} when he know{s} he will be watched.',
        failureAfterimage:
          'Three crates short at the final count. Either a clerical error or a small theft, ' +
          'and the consortium will want to know which before the month turns.',
      },
      {
        reach: 'heart',
        duration: { min: 3, max: 3 },
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The road eats pace the way the road eats pace — faster than the goods can ride, the ' +
          'wheels come loose; slower than the schedule, the split shrinks. {name} ride{s} ahead ' +
          'of the column at the halfway stop to check the inn where the guards will bed. ' +
          'The innkeeper has their usual table saved, which is either loyalty or a warning. ' +
          '{?has_ally}{ally:strongest} ride{s} with the wagons as far as the county line — the ' +
          'consortium is not paying for the escort, but the consortium know{s} who rode.{/has_ally}',
        successAfterimage:
          'Delivery at the far end: every crate accounted for, the factor sign{s} in ink that ' +
          'has not been cut with water. The split on this run will be generous.',
        failureAfterimage:
          'Spoilage in two crates and a third that came loose on the switchback and spilled. ' +
          'The split holds, barely. The consortium will want an explanation in writing.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A consortium caravan leaves {location} within the week. {name} runs the terms of its ' +
        'passage from yard to far gate.',
      success:
        'Delivered intact. The split is clean. The factor\'s ledger has {name}\'s name in the ' +
        'column next to the word competent.',
      failure:
        'Losses on the road. Not ruinous — but the consortium counts every crate, and remembers ' +
        'who was running the caravan when the count was short.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The caravan is in from {location}. Whatever was learned on the road will affect the ' +
          'next run, if {name} write{s} it down.',
        changes: [
          {
            id: 'caravan_record',
            kind: 'reputation',
            title: 'Caravan Logistics',
            detail: 'A caravan either arrives, or it arrives short. The consortium tracks which.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the road between {location} and the far gate?',
        reactions: [
          {
            id: 'caravan_intel_route',
            label: 'The switchback before the county line is being watched.',
            intent:
              'Three runs out of five on this route have had incidents at the same bend. Someone ' +
              'is scouting — or someone is waiting.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Route from {location} is being surveilled at the switchback',
                detail:
                  'Repeat-loss pattern at a specific bend on the caravan route. Not random attrition. ' +
                  'Likely scouts or bandits with a schedule.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'caravan_tally',
            label: 'The run held together. File it.',
            intent: 'A clean caravan run. The kind of competence the consortium compounds quietly.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.quest.settle_dispute',
    name: 'Settle a Trade Dispute',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Two merchants at {location} each hold a copy of the same bill of lading, each signed, ' +
          'each with witnesses. That is not supposed to happen and it did. {name} sits them ' +
          'opposite each other in a room with one door, pour{s} tea {they} do not drink, and ' +
          'let{s} them talk for a quarter-hour before {they} ask{s} a question. ' +
          '{?has_faction}The consortium\'s file on the shipment names a third party — a clerk at ' +
          'the harbor office — who would have had both manifests across his desk the same morning. ' +
          'Neither merchant is lying. Both are wrong, and the clerk is why.{/has_faction}',
        successAfterimage:
          'The shape of it becomes visible around the second cup of tea. Both merchants were ' +
          'handed a document that said what they wanted it to say. The clerk took from both.',
        failureAfterimage:
          'Neither man will give ground. The dispute is older than the shipment; it is about a ' +
          'wedding twenty years ago. {name} did not find it in time.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} name{s} the terms: the goods split by volume, the harbor clerk named in both ' +
          'ledgers, the consortium\'s seal on the resolution so it cannot be reopened without ' +
          '{their} involvement. Neither merchant is happy, which is the sign that the judgment is ' +
          'fair. ' +
          '{?has_faction}The consortium\'s authority makes the seal stick; without it, the ' +
          'agreement would fall apart before the ink dried.{/has_faction}',
        successAfterimage:
          'Both sign. The clerk at the harbor will find his desk cleared by week\'s end. ' +
          'Commerce at {location} resumes in the way that the consortium prefers — quietly.',
        failureAfterimage:
          'The dispute does not close. It moves to the civil court, which {name} and the ' +
          'consortium both wanted to avoid. The story will follow.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A trade dispute in {location} has reached the consortium for arbitration. {name} reads ' +
        'the room and the room\'s history.',
      success:
        'The dispute is settled under consortium seal. Both men leave lighter and privately angry, ' +
        'which is the only honest outcome of a dispute.',
      failure:
        'No settlement reached. The matter passes to civil court, where it will become slower and ' +
        'more expensive for everyone.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The arbitration at {location} is closed — cleanly or incompletely — and either way, ' +
          'the consortium has a third party to account for.',
        changes: [
          {
            id: 'arbitration_standing',
            kind: 'reputation',
            title: 'Arbitration Record',
            detail: 'The consortium settles disputes when it is useful; the useful part is being remembered as fair.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god hold onto from the arbitration?',
        reactions: [
          {
            id: 'arbitration_mark_clerk',
            label: 'The harbor clerk is corrupt. The consortium owns that now.',
            intent:
              'A name and a pattern of misconduct. The consortium will use this when it is needed — ' +
              'to discipline, to leverage, or to protect.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.45,
                label: 'Harbor clerk at {location} runs double manifests for bribes',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'arbitration_tally',
            label: 'The seal is on the settlement. File it.',
            intent: 'A fair resolution under consortium authority. The kind of work the guild compounds.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.quest.appraise_goods',
    name: 'Appraise Rare Goods',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The shipment sits on the back counting-table of the consortium house at {location} ' +
          'under a lamp bright enough to hurt. Silks, three crates; ivory, one; something in the ' +
          'fourth crate that the manifest lists as "carved stone, various." {name} start{s} with ' +
          'the carved stone — the vague category is usually where the real work is. ' +
          '{?has_artifact}The jeweler\'s loupe {name} carries is old but precise; the comparison ' +
          'weights are consortium-issued and recently calibrated.{/has_artifact}' +
          '{?no_artifact}Without good instruments, the read is slower and more cautious — two ' +
          'looks at everything instead of one, and a mental note to buy a loupe.{/no_artifact}',
        successAfterimage:
          'Two pieces are genuine and rare. One is genuine and common. Two are clever forgeries ' +
          'by someone who know{s} what a good carving feels like. That pattern is itself worth knowing.',
        failureAfterimage:
          'The carvings are unfamiliar enough that {name} can only rule out the obvious fakes. ' +
          'The real call belongs to someone with deeper reference than {name} has today.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE + MCT_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.60, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} name{s} the valuations. Book price adjusted for the market at {location}, ' +
          'adjusted again for the specific scarcity of the genuine pieces, adjusted a third time ' +
          'for the reputational cost of the forgeries being on the manifest at all. ' +
          '{?has_faction}The consortium\'s standard is to undervalue on record and overvalue in ' +
          'memory — {name} write{s} the conservative numbers and carry{es} the real ones.{/has_faction}',
        successAfterimage:
          'The factor accepts the appraisal without argument, which is a kind of compliment. ' +
          'The forgeries will be handled separately and quietly.',
        failureAfterimage:
          'The numbers are off — not catastrophically, but enough that the factor recalculate{s} ' +
          'at his desk and make{s} a note {name} will not see.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Unusual goods have arrived at the consortium house in {location}. {name} is brought in ' +
        'to name what they are worth.',
      success:
        'The appraisal holds. The consortium trades on {name}\'s certainty, and the factor files ' +
        'the report as reliable.',
      failure:
        'The valuation was off. A bad appraisal is a story that travels faster than a good one.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The appraisal at {location} is recorded. What {name} found among the crates will shape ' +
          'the consortium\'s interest in this supplier — and in whoever made the forgeries.',
        changes: [
          {
            id: 'appraisal_record',
            kind: 'reputation',
            title: 'Appraisal Record',
            detail: 'The consortium trusts judgment that proves reliable and remembers judgment that does not.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the counting-table?',
        reactions: [
          {
            id: 'appraisal_intel_forger',
            label: 'The forger know{s} the craft. Find them.',
            intent:
              'A forgery good enough to pass a first look is worth tracing. The maker will have ' +
              'left other work in circulation — and future work will pass through the same channels.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Skilled stone-carving forger operating through {location}',
                detail:
                  'Forgeries in the consortium shipment show technical skill and reference knowledge. ' +
                  'Likely a working craftsman, not an amateur. Trace the intermediary first.',
                reliability: 0.75,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'appraisal_tally',
            label: 'The numbers are filed. Move on.',
            intent: 'A clean appraisal, properly logged. The consortium runs on reports that hold.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.senior.trade_monopoly',
    name: 'Establish Trade Monopoly',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: MCT_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The consortium has chosen a commodity in {location} — something unglamorous that every ' +
          'household needs, which is where a monopoly actually lives. {name} draft{s} the pricing ' +
          'schedule: a floor low enough that the independents cannot match it for more than two ' +
          'quarters, a ceiling high enough that the consortium\'s margin survives the campaign. ' +
          '{?has_faction}The consortium\'s reserves will absorb the loss. {name} sign{s} off on ' +
          'the draw from the house treasury the same morning {they} send{s} the price circular.{/has_faction}',
        successAfterimage:
          'The first week shows two independents matching the price. The second week, three. ' +
          'By the third week the smaller operators begin to cut quality — which is the tell that ' +
          'the pricing floor is working.',
        failureAfterimage:
          'The independents hold the floor longer than projected. Either the consortium misread ' +
          'their reserves, or someone is supplying them at cost. The campaign will need a second pass.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} visit{s} the three largest suppliers in person. The consortium\'s offer is ' +
          'exclusive terms, above-market rates, a five-year horizon. What the suppliers hear is ' +
          'the quieter part: the consortium is closing the door, and being inside is better than ' +
          'being outside. ' +
          '{?has_ally}{ally:strongest} is known to the second supplier — the introduction will ' +
          'happen over dinner instead of a contract table.{/has_ally}' +
          '{?no_ally}{name} goes in cold. Which means the first quarter-hour is spent on weather ' +
          'and reputation, and only then does the number go on the table.{/no_ally}',
        successAfterimage:
          'Two of three suppliers sign. The third takes a week and signs anyway. The door is closed; ' +
          'the consortium is inside. The independents will be starved of supply before the quarter.',
        failureAfterimage:
          'One supplier signs. Two decline — one out of family loyalty, one because the number ' +
          'was not quite enough. The monopoly is a majority, not a lock. The campaign is expensive ' +
          'and incomplete.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium intends to control the supply of a commodity in {location}. {name} is ' +
        'sent to close the door behind them.',
      success:
        'The supply runs through the consortium now. The market adjust{s} quietly, which is the ' +
        'mark of a monopoly done well.',
      failure:
        'The suppliers held their independence. The consortium retreats and writes down the cost.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The monopoly campaign at {location} is over — held together or shaken apart. The ' +
          'independents, the suppliers, and the customers will all adjust.',
        changes: [
          {
            id: 'monopoly_outcome',
            kind: 'faction_reputation',
            title: 'Monopoly Record',
            detail: 'A closed market is a permanent change to {location}. The consortium owns the consequences.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the monopoly campaign?',
        reactions: [
          {
            id: 'monopoly_mark',
            label: 'The consortium predated to win. That is on the ledger now.',
            intent:
              'Pricing below cost to starve competitors is within the consortium\'s charter, but ' +
              'barely. A rival guild or civic authority will find this eventually.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.55,
                label: 'Consortium used predatory pricing to close {location}\'s market',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'monopoly_seed_rivalry',
            label: 'An independent will organize against us.',
            intent:
              'Closing a market creates an organizing principle for everyone who was closed out. ' +
              'That pressure will surface as an encounter within the season.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.settle_dispute',
                delayTicks: 24,
                seedLabel: 'Displaced independents will organize a counter-movement',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mct.senior.foreign_deal',
    name: 'Foreign Trade Deal',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: MCT_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The foreign delegation at {location} arrived with three translators and a protocol ' +
          'schedule the consortium had to agree to before the meeting was confirmed. {name} spend{s} ' +
          'the first two days learning what not to do — which hand for the cup, which cup for the ' +
          'tea, which silences are polite and which are refusal. ' +
          '{?has_faction}The consortium has a file on this kingdom\'s customs that was compiled ' +
          'by a trader who married into the court forty years ago. {name} read{s} it twice.{/has_faction}' +
          '{?no_faction}Without guild reference, {name} work{s} from observation — watching the ' +
          'senior translator\'s reactions, treating them as a living protocol manual.{/no_faction}',
        successAfterimage:
          'The head of delegation smile{s} at a moment when smiling is culturally specific. ' +
          '{name} has passed an unstated test.',
        failureAfterimage:
          '{name} took tea with the wrong hand on the second day. The delegation is polite; the ' +
          'file on the meeting will note that the consortium\'s envoy was promising but unseasoned.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, bestowed_power: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The terms sit on the table in both languages: twelve articles, two currencies, three ' +
          'signatures required per side. {name} walk{s} through the numbers slowly because the ' +
          'head of delegation is checking their translator\'s work against {their} own reading. ' +
          '{?has_faction}The consortium seal go{es} on the cover page after the last signature. ' +
          'It is heavier than the page.{/has_faction}',
        successAfterimage:
          'A new route opens from {location} into kingdoms the consortium has been locked out of ' +
          'for a generation. The first shipment will be test cargo — but the door is now open.',
        failureAfterimage:
          'The delegation leaves politely. The pact is not signed; a counter-proposal will arrive ' +
          'by courier in three weeks, with terms less favorable than today\'s.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A foreign delegation at {location} has signaled interest in trade. {name} is sent to ' +
        'find terms that survive the distance between languages.',
      success:
        'The pact is signed. A route opens that was not there last season. The consortium has reach ' +
        'it has not had in a generation.',
      failure:
        'The delegation left without signing. The story follows — a near-miss is nearly as remembered ' +
        'as a close.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The foreign negotiation at {location} is closed. A new route either opens or does not, ' +
          'and the consortium will remember either way.',
        changes: [
          {
            id: 'foreign_deal_outcome',
            kind: 'faction_reputation',
            title: 'Foreign Relations',
            detail: 'The consortium\'s reach is measured in routes that persist, not negotiations that impressed.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the meeting across languages?',
        reactions: [
          {
            id: 'foreign_intel_route',
            label: 'The exotic goods market is the opening wedge.',
            intent:
              'The delegation\'s counter-offer pointed at luxury goods. That is the channel the ' +
              'consortium should scale first, before commodity trade.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'New foreign route from {location} — luxury goods as opening category',
                detail:
                  'Delegation signaled highest margin available on carved goods and fine textiles. ' +
                  'Commodity trade will follow if luxury trust is established first.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'foreign_seed_summit',
            label: 'This route wants a summit to formalize.',
            intent:
              'The bilateral pact is step one. A regional summit will invite other foreign partners ' +
              'and create the consortium-led framework the long game needs.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.elite.trade_summit',
                delayTicks: 30,
                seedLabel: 'Bilateral success invites a regional summit',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mct.senior.acquire_warehouse',
    name: 'Acquire a Warehouse',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: MCT_SENIOR_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The consortium needs storage closer to {location}\'s docks. {name} walk{s} four ' +
          'properties in two days — measuring the distance from each door to the nearest quay, ' +
          'noting the tax ward, checking the drainage. A warehouse with a wet floor is a warehouse ' +
          'full of spoiled goods by the second winter. ' +
          '{?has_artifact}The brass tape {name} carries is consortium-issue; accuracy to the inch ' +
          'changes how much grain actually fits.{/has_artifact}',
        successAfterimage:
          'The third property is the answer. Eighty paces from the nearest quay, on the dry side ' +
          'of the lane, taxed under a ward that a consortium member already sits on. {name} make{s} ' +
          'the shortlist official.',
        failureAfterimage:
          'The three candidates all have flaws the survey caught. The fourth is too far from the ' +
          'docks to be useful. The search has to widen — a cost the consortium had not budgeted.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_SENIOR_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.70, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The owner names a book price that includes a seller\'s hopefulness. {name} name{s} a ' +
          'street price that includes a buyer\'s realism. The real number sits somewhere between, ' +
          'and the next two hours are spent finding exactly where. ' +
          '{?has_faction}The consortium\'s reputation as a payer of promises speed{s} the ' +
          'negotiation — the owner know{s} the coin will arrive on time, which is a kind of ' +
          'discount built into the relationship.{/has_faction}',
        successAfterimage:
          'The keys pass across the table. The consortium has a warehouse eighty paces from the ' +
          'quay, and {name} has a handshake that means more than the keys.',
        failureAfterimage:
          'The owner would not move off his number. {name} walk{s} away — the right move, but ' +
          'expensive; the consortium will have to find another property and start over.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium wants warehouse space near {location}\'s docks. {name} goes to find the ' +
        'building and close the terms.',
      success:
        'Keys in hand, warehouse in the consortium\'s ledger. A dry floor, a short walk to the ' +
        'quay, a deal worth the coin.',
      failure:
        'No keys today. The owner held his price; the consortium will pay more later, or settle for less.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The warehouse search at {location} has resolved one way or the other, and the consortium ' +
          'now know{s} what the commercial property market near the docks will bear.',
        changes: [
          {
            id: 'warehouse_acquisition',
            kind: 'reputation',
            title: 'Property Acquisition',
            detail: 'A warehouse is not a contract — it is a fixed presence. The consortium adds one or it does not.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the acquisition?',
        reactions: [
          {
            id: 'warehouse_spawn',
            label: 'The consortium now has a fixed presence at {location}\'s docks.',
            intent:
              'A warehouse is a permanent node in the commercial graph of the city. Future caravan ' +
              'runs, storage deals, and expansions will pivot off this address.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'mundane',
                tier: 'shaping',
                nameOverride: 'Consortium Warehouse',
                tags: ['#warehouse', '#consortium', '#trade'],
                messageOverride:
                  'The consortium warehouse at {location} is in the ledger. ' +
                  'Eighty paces from the quay, a dry floor, a short walk to the counting-house.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'warehouse_tally',
            label: 'The handshake is clean. File the deed.',
            intent: 'A property recorded, a counterparty impressed. The consortium runs on these quiet acquisitions.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'mct.elite.trade_summit',
    name: 'Trade Summit',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'gold',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: MCT_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The invitations go out under consortium seal twelve weeks before the summit at {location}. ' +
          '{name} write{s} each one personally — not the text, which is boilerplate, but the ' +
          'ordering, which signals who the consortium regards as primary, secondary, and merely ' +
          'present. That ordering will determine the seating, and the seating will determine the ' +
          'room. ' +
          '{?has_faction}The consortium\'s diplomatic files are thirty years deep. {name} work{s} ' +
          'from them, cross-checking who has offended whom recently and who has whose daughter ' +
          'married into whose family.{/has_faction}',
        successAfterimage:
          'Every major guild and trade house send{s} a representative. Two send principals. The ' +
          'room will have weight — the kind that earns a charter signature even before the debate begins.',
        failureAfterimage:
          'Two key houses decline: one citing scheduling, one citing nothing. The summit will ' +
          'proceed, but the absences will be read by everyone attending.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} present{s} the charter on the second morning — a unified regional trade framework, ' +
          'three years of drafting reduced to twelve articles. The first hour is polite; the ' +
          'second is where the fight happens. Two clauses draw blood. ' +
          '{?has_faction}The consortium\'s fallback positions are in {name}\'s head, three levels ' +
          'deep. Nothing gets given until the third level; nothing below that survives.{/has_faction}',
        successAfterimage:
          'The charter find{s} enough support to begin signatures on the afternoon session. The ' +
          'two hostile clauses are redrafted in ways nobody loves but everyone can sign.',
        failureAfterimage:
          'A coalition forms against the third article. Deadlock by the evening bell; the summit ' +
          'will adjourn without a charter, and everyone will know it.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'Final negotiations on the third day are about signatures, not terms — the terms are ' +
          'set. {name} read{s} the room one last time: who wants to be seen signing first, who ' +
          'will wait for the third signature to sign, who needs a private concession to sign at ' +
          'all. A summit closes in the order of its handshakes.',
        successAfterimage:
          'The charter is sealed with seventeen signatures. The consortium is the organizing ' +
          'party of regional trade now, in a way that will last years if it lasts a season.',
        failureAfterimage:
          'Three houses decline to sign at the close. The charter stands but weakened — a ' +
          'compromise framework where the consortium wanted a consolidated one.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium convenes a regional trade summit at {location}. {name} is the organizing ' +
        'envoy and the charter\'s author.',
      success:
        'The accord is signed. The regional market runs through consortium-drafted terms for as ' +
        'long as the charter holds.',
      failure:
        'The summit adjourned without full agreement. The consortium leaves having organized, ' +
        'not led.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The summit at {location} is closed. What was signed — or not signed — will shape the ' +
          'next five years of regional commerce.',
        changes: [
          {
            id: 'summit_outcome',
            kind: 'faction_reputation',
            title: 'Regional Charter',
            detail: 'A summit produces either a framework or a story about a framework that failed.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the three days at the summit?',
        reactions: [
          {
            id: 'summit_mark_concession',
            label: 'A private concession bought the seventh signature.',
            intent:
              'The deal was made off the record. The recipient will expect it honored, and the ' +
              'consortium will expect silence in return.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.6,
                label: 'Private concession owed to signatory house at {location} summit',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'summit_seed_enforcement',
            label: 'The charter will need enforcement within the year.',
            intent:
              'A framework is only real if someone enforces it. The first violation will surface ' +
              'faster than anyone wants.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.settle_dispute',
                delayTicks: 36,
                seedLabel: 'Charter will face its first enforcement test',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'summit_tally',
            label: 'The consortium is the organizing party of the region.',
            intent: 'The summit was the point. The charter is evidence. The consortium\'s standing is changed.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'mct.elite.market_domination',
    name: 'Market Domination',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'gold',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: MCT_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} spend{s} three weeks building a map of {location}\'s commercial ecosystem — not ' +
          'the official one the civic clerks hold, but the actual one: which houses are actually ' +
          'owned by which families, which apparent competitors are silently in partnership, where ' +
          'the coin actually flows when the books say it flows somewhere else. ' +
          '{?has_faction}The consortium\'s shadow ledgers are thirty years deep and surprisingly ' +
          'honest about the places where the books lie.{/has_faction}',
        successAfterimage:
          'Every operation in {location} is mapped, along with the four clandestine partnerships ' +
          'the public record doesn\'t mention. The weaknesses are visible now. So are the alliances.',
        failureAfterimage:
          'The map has holes. Two or three mid-sized operations are obscured enough that {name} ' +
          'cannot tell whether they are independents or fronts for something larger. The campaign ' +
          'will be fought half-blind.',
      },
      {
        reach: 'gold',
        duration: { min: 3, max: 3 },
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} move{s} on three fronts in the same week: the smallest operations are offered ' +
          'buyouts with generous terms; the mid-tier are offered exclusive supply contracts that ' +
          'make alliance preferable to resistance; the largest are undercut in the two or three ' +
          'commodities that feed their margin. Simultaneity is the weapon — none of them can ' +
          'coordinate a response before the next move lands. ' +
          '{?has_ally}{ally:strongest} handle{s} the supply-contract front; the consortium\'s own ' +
          'people run the buyouts; {name} take{s} the undercutting personally.{/has_ally}',
        successAfterimage:
          'By the end of the fourth week, five smaller houses have sold, eight mid-tier have ' +
          'signed exclusive terms, and two of the three largest are visibly under pressure. The ' +
          'market is bending toward the consortium.',
        failureAfterimage:
          'The largest house organizes a counter-coalition on the tenth day. The consortium ' +
          'overreached; now the campaign is a public one, and public campaigns cost more than ' +
          'quiet ones.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: (MCT_ELITE_BASE + MCT_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.40, bestowed_power: 0.60 },
          },
        },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'With the competition weakened, {name} name{s} the new price structure {location}\'s ' +
          'market will operate under. The book price rise{s} by degrees nobody celebrates. The ' +
          'street price moves with it. The quiet part — the part no broadsheet prints — is that ' +
          'everyone in the city pays the consortium for permission to do business now, whether ' +
          'or not the ledger says so. ' +
          '{?has_faction}The consortium files the new structure as a sanctioned reorganization. ' +
          'Whoever reads those files a century from now will see only a successful guild.{/has_faction}',
        successAfterimage:
          'The market bends. Trade at {location} flows through the terms {name} named. No single ' +
          'competitor can challenge the structure; collectively they could, but they won\'t.',
        failureAfterimage:
          'The consolidation overextended. {name} retreat{s} to the core wins — the buyouts hold, ' +
          'the exclusive supply contracts hold, but the market is not the consortium\'s. The ' +
          'story of the failed finish will travel.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium intends to dominate {location}\'s market. {name} is sent to close it ' +
        'cleanly enough that the history books read only "consolidation."',
      success:
        'Total market control. Trade at {location} runs on consortium terms. The civic record ' +
        'calls it efficiency.',
      failure:
        'The consortium holds partial gains. The larger ambition is deferred, and the story of ' +
        'the retreat will precede the next attempt.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The domination campaign at {location} has ended. The market is restructured — fully or ' +
          'partially — and the consortium owns the consequences either way.',
        changes: [
          {
            id: 'domination_outcome',
            kind: 'faction_reputation',
            title: 'Market Consolidation',
            detail: 'A market dominated is a market that will organize against the dominator eventually.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god hold onto from the campaign?',
        reactions: [
          {
            id: 'domination_mark_predation',
            label: 'The undercutting was predatory. The record shows it.',
            intent:
              'The means of the campaign will be remembered by those who were closed out. A ' +
              'rival guild, civic authority, or organized resistance will surface the pattern.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.7,
                label: 'Consortium engineered market consolidation at {location} through predatory tactics',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'domination_seed_resistance',
            label: 'The displaced houses will coordinate.',
            intent:
              'Closing a market creates a shared enemy for everyone who was closed out. That ' +
              'coalition will surface as a problem for the consortium within the season.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.settle_dispute',
                delayTicks: 30,
                seedLabel: 'Displaced market houses will coordinate resistance',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'domination_tally',
            label: 'The market runs through the consortium now.',
            intent: 'The work is complete. The consortium\'s reach at {location} is measurably deeper.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'mct.social.wine_tasting',
    name: 'Wine Tasting Evening',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.50, bestowed_power: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The tasting at {location}\'s upper merchant quarter runs on the particular rhythm of ' +
          'commerce disguised as pleasure — the first glass is introductions, the second is ' +
          'weather and roads, the third is where the actual conversation begins. {name} move{s} ' +
          'through the room at the pace of a woman with nothing to prove. ' +
          '{?has_faction}The consortium has prepared a short list of names worth cultivating; ' +
          '{name} work{s} that list quietly, never in the order it was written.{/has_faction}' +
          '{?no_faction}Without a prepared list, {name} read{s} the room — who orbit{s} whom, ' +
          'which conversations cut off when {they} approach, which ones open.{/no_faction}',
        successAfterimage:
          'Three useful contacts by the fourth glass. Two of them come to {name} for the ' +
          'introduction rather than the other way around, which is the evening\'s quiet tell.',
        failureAfterimage:
          'A pleasant evening that yielded nothing. {name} spent too long with a man who had ' +
          'opinions about nothing useful and too much certainty about them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium\'s tasting evening at {location} draws the merchant quarter. {name} ' +
        'attend{s}.',
      success:
        'Useful connections on the ledger by morning. The evening paid for itself before the ' +
        'third glass.',
      failure:
        'The evening passed. Nothing to add to the ledger tomorrow.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The tasting at {location} is over. What {name} collected — contacts, impressions, ' +
          'overheard mentions — will either surface in the next quarter or will not.',
        changes: [
          {
            id: 'tasting_presence',
            kind: 'reputation',
            title: 'Social Standing',
            detail: 'The consortium runs on evenings like this. Showing up is how membership compounds.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the evening?',
        reactions: [
          {
            id: 'tasting_seed_contact',
            label: 'One of the contacts wants a follow-up conversation.',
            intent:
              'A useful evening produces at least one thread worth pulling. The consortium will ' +
              'see the follow-up on the calendar by week\'s end.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.negotiate_contract',
                delayTicks: 10,
                seedLabel: 'A tasting contact leads to a contract conversation',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'tasting_tally',
            label: 'The evening is logged. File the names.',
            intent: 'Presence among the merchant quarter, dutifully recorded.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.social.ledger_review',
    name: 'Quarterly Ledger Review',
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
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The counting-room at the consortium house in {location} is quiet in the way only ' +
          'counting-rooms are quiet — three clerks, four ledgers, the particular sound of graphite ' +
          'on ruled paper. {name} present{s} the quarter: the book price column, the street price ' +
          'column, the difference that matters. ' +
          '{?has_faction}The factors\' questions are informed — they have the shadow ledger from ' +
          'the other consortium houses open on their own tables. A discrepancy of two points in ' +
          'either direction is a conversation; ten is a problem.{/has_faction}',
        successAfterimage:
          'The factors nod, sign, and the lead factor mention{s} a cousin\'s project {they} think ' +
          '{name} might find interesting. That is the real approval.',
        failureAfterimage:
          'A discrepancy in the third column. Not a problem, but a question. The factors will ' +
          'want a written explanation by month\'s end.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium\'s quarterly review at {location}. {name} present{s} the numbers.',
      success:
        'Clean books, factor\'s approval, a side-conversation about a cousin\'s project. The ' +
        'quarter closes well.',
      failure:
        'A discrepancy flagged. The consortium is patient, but it is not forgetful.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The quarterly review at {location} is logged. Whatever the factors noted — approval ' +
          'or questions — will follow {name} into the next quarter.',
        changes: [
          {
            id: 'review_standing',
            kind: 'reputation',
            title: 'Quarterly Record',
            detail: 'The consortium remembers clean books. It remembers dirty ones longer.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the counting-room?',
        reactions: [
          {
            id: 'review_seed_commission',
            label: 'The lead factor mentioned a cousin\'s project.',
            intent:
              'A side-conversation mention is the consortium\'s version of a job offer. The ' +
              'follow-up will happen informally.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.quest.negotiate_contract',
                delayTicks: 12,
                seedLabel: 'Factor\'s informal mention may lead to a private commission',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'review_tally',
            label: 'Books filed, quarter closed.',
            intent: 'A clean ledger, dutifully presented. The consortium compounds on these quarters.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'mct.social.guild_feast',
    name: 'Consortium Feast',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (MCT_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.40, bestowed_power: 0.60 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The annual feast at {location}\'s consortium house is long — six courses, three toasts, ' +
          'the particular rhythm of a guild that wants its members to remember why they are members. ' +
          '{name} work{s} the long table the way {they} work a market: slowly, without appearing to. ' +
          'Every seat is a conversation worth having, in principle. In practice, three of them are. ' +
          '{?has_faction}The consortium\'s seating chart was drafted by a senior factor who has ' +
          'strong opinions about who should sit near whom; {name} either trust{s} it or quietly ' +
          'repositions before the first course.{/has_faction}' +
          '{?no_faction}Without the chart, {name} read{s} the room during the pre-feast mingling ' +
          'and take{s} a seat where the conversations will be better than average.{/no_faction}',
        successAfterimage:
          'By the third toast, {name} has made two introductions the consortium will remember and ' +
          'received one that will surface next quarter as an opportunity.',
        failureAfterimage:
          'A long evening in an unremarkable seat. The factor who should have been impressed was ' +
          'seated six chairs away and did not look up.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The consortium\'s annual feast at {location}. {name} attends.',
      success:
        'Introductions made, standing compounded, a future conversation seeded. A feast worth the long evening.',
      failure:
        'The evening was what it was. Nothing useful surfaced; the consortium will not remember ' +
        'this one either way.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The feast at {location} is over. Showing up is part of consortium membership, and the ' +
          'guild counts the attendees.',
        changes: [
          {
            id: 'feast_presence',
            kind: 'reputation',
            title: 'Consortium Presence',
            detail: 'Attendance is part of the contract. The consortium compounds on these evenings.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the long evening at the consortium house?',
        reactions: [
          {
            id: 'feast_seed_introduction',
            label: 'A seat-mate proposed an introduction worth following.',
            intent:
              'A conversation at the fourth course pointed at a specific opportunity. The ' +
              'follow-up will happen through formal channels next week.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'mct.senior.foreign_deal',
                delayTicks: 14,
                seedLabel: 'Feast introduction may lead to a foreign trade opening',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'feast_tally',
            label: 'Evening logged. Standing maintained.',
            intent: 'Presence dutifully recorded, relationships incrementally strengthened.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const MCT_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'mct.join',
  name: 'Join the Merchant Consortium',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  steps: [
    {
      reach: 'gold',
      duration: { min: 1, max: 1 },
      difficulty: MCT_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The consortium\'s entrance examination at {location} is conducted on a plain table with ' +
        'two senior factors watching. The format is simple: a commercial problem, stated in five ' +
        'sentences. {name} has two hours and a sheet of paper. The factors do not prompt. ' +
        '{?has_faction}{name} has read the consortium\'s public pedagogy and know{s} that the ' +
        'correct answer is not the most clever — it is the most defensible.{/has_faction}' +
        '{?no_faction}Without a sense of what the consortium values, {name} write{s} what ' +
        '{they} would actually do, which is either honest enough to pass or naive enough to fail.{/no_faction}',
      successAfterimage:
        'The senior factor read{s} the sheet through twice, then look{s} up. "Your reasoning on ' +
        'the exclusivity clause was the point. Welcome to the consortium."',
      failureAfterimage:
        '"Come back when you have thought longer about what the contract was actually protecting." ' +
        'A specific critique, which is the consortium\'s kindness.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} sit{s} the consortium\'s entrance examination at {location}. The terms of ' +
      'membership are not negotiable.',
    success:
      'Accepted. {name} enter{s} the consortium\'s ledger. A new name in the apprentice column.',
    failure:
      'The examination was not passed today. The consortium is patient; it suggests a specific ' +
      'area of study before the next attempt.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The entrance examination at {location} is complete. {name} either join{s} the consortium ' +
        'today or is given a specific note to work on.',
      changes: [
        {
          id: 'join_outcome',
          kind: 'faction_reputation',
          title: 'Consortium Application',
          detail: 'The examination measured judgment, not cleverness. The consortium remembers either way.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god note about {name}\'s first encounter with the consortium?',
      reactions: [
        {
          id: 'join_accepted',
          label: '{name} is in the ledger.',
          intent: 'The apprenticeship begins formally. The consortium records the admission.',
          effects: [
            { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const MCT_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'mct.promotion',
  name: 'Consortium Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  steps: [
    {
      reach: 'gold',
      duration: { min: 2, max: 2 },
      difficulty: MCT_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'Portfolio review at {location} is a table, a stack of {name}\'s closed contracts, and ' +
        'three masters reading in silence for two hours. The contracts speak for themselves — ' +
        'clean terms, margins that held, handshakes that did not break. What the masters are ' +
        'looking for is the pattern across them. ' +
        '{?has_faction}The consortium\'s promotion standard is not about individual deals — ' +
        'it is about whether a member can be trusted with decisions that affect the house\'s ' +
        'standing.{/has_faction}',
      successAfterimage:
        'The senior master close{s} the folder and slide{s} a new seal across the table. ' +
        '"The consortium is pleased." A clean handshake, which in this room is the point.',
      failureAfterimage:
        'The masters point to the third contract — the terms were favorable but the relationship ' +
        'broke within the year. "Work on the follow-through. Come back in six months."',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} present{s} the portfolio for review at {location}. Advancement requires demonstrated judgment.',
    success:
      'Promoted. The consortium acknowledges the record. A new seal, a new column in the ledger.',
    failure:
      'The portfolio was specific and the critique was specific. That is more useful than a general one.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The portfolio review at {location} is complete. The masters reached a decision — ' +
        'and named their reasons, which is how the consortium teaches.',
      changes: [
        {
          id: 'promotion_outcome',
          kind: 'faction_reputation',
          title: 'Advancement Review',
          detail: 'The masters measured the pattern across deals, not any single one.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from the masters\' reading?',
      reactions: [
        {
          id: 'promotion_advanced',
          label: 'The seal has changed.',
          intent:
            'The promotion is formal and recorded. The consortium treat{s} {name} differently now — ' +
            'not dramatically, but specifically.',
          effects: [
            { kind: 'reputation_tally', key: 'gold.positive', delta: 2 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'promotion_critique',
          label: 'The masters identified the weak contract.',
          intent: 'The critique was specific and correct — useful regardless of the outcome.',
          effects: [
            { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
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
