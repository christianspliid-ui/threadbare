/**
 * Underking Court Encounter Content — THR-98 Phase 2 migration.
 *
 * Voice bible (regal-shadow, compact-weighted, euphemistic-eternal):
 * The Court speaks as if every conversation has been happening for a hundred
 * years. Euphemism does work a direct word would spoil. "compact", "old word",
 * "what is owed", "long quiet", "throne beneath", "held in trust" are
 * load-bearing phrases. Short sentences for cost, long assured ones for power.
 *
 * Systemic signature:
 *   • Encounter seeds chain the quests into a ladder of escalating darkness.
 *     Small jobs plant bigger jobs; crimes plant cross-faction reprisals.
 *   • Hidden marks hold what the Court knows about its members — and what
 *     the city does not yet know it has lost.
 *   • heart.negative accrues on legitimately ugly work (blackmail, killing,
 *     displacement, coup). shadow.positive accrues on every job.
 *   • Intelligence records are the whisper-network's output — named assets,
 *     not "a rumor heard".
 *   • ActionStepBranch on eliminate_rival and seize_territory lets the
 *     consolidation step respond to how the prior step was resolved.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import { withEncounterContract } from './encounter-contract-builder';
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

  withEncounterContract({
    id: 'uk.quest.pickpocket_run',
    name: 'Pickpocket Run',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'eye',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'The market at {location} is a courtesy extended to the Court — all those purses moving through the press, the crowd too loud to notice {name} noting who carries what.',
        successAfterimage: 'Easy marks. Wealthy and distracted. The old word for this is opportunity.',
        failureAfterimage: 'Too many watchful eyes. A vigil {name} was not prepared for.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The Court has an old compact with the crowd — it does not notice, and {name} does not linger.{/has_faction}{?!has_faction}Quick fingers, steady nerve. {name} has been here before, in other markets, under other names.{/?!has_faction}',
        successAfterimage: 'Heavy purses. A clean haul. What is owed to the throne beneath is paid.',
        failureAfterimage: 'Caught reaching. The long quiet before a guard arrives.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court sends {name} into the press of {location}. What is held in trust by strangers will be held by the throne beneath before nightfall.',
      success: 'Clean work. The Court nods — the only courtesy it pays — and notes the compact is held.',
      failure: 'The mark held too tight. The Court does not say what this costs. The Court, when it speaks, does not speak of cost.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The market empties and {name} moves against the flow, pockets heavier or lighter by the margin the Court notes and does not speak.',
        changes: [
          {
            id: 'uk_pickpocket_standing',
            kind: 'reputation_tally',
            title: 'The Compact Ticks Forward',
            detail: 'Another quiet entry in the ledger the Court keeps of what is owed and by whom.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath make of the day?',
        reactions: [
          {
            id: 'uk.pickpocket.fence_tip',
            label: 'Leak the haul to a fence. Let the goods find their way.',
            intent: 'The purses are warm. The right fence will want them before the watch has finished the morning bell.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.quest.fence_goods',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 1.1,
                seedLabel: 'The day\'s take needs a buyer. The fence at the back of the shambles always has a buyer.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.pickpocket.banked',
            label: 'Bank the coin. The Court prefers patient earners.',
            intent: 'Small, regular, nothing flashy. The old compact rewards those who do not hurry.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.quest.fence_goods',
    name: 'Fence Stolen Goods',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'Stolen goods need a buyer. {name} assesses what the haul is worth — a courtesy to the fence, who will not say what they already know.',
        successAfterimage: 'Valuable. Buyers will compete for the privilege.',
        failureAfterimage: 'Mostly junk. The long quiet of a fence who has seen better.',
      },
      {
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The Court takes what is owed. {name} keeps the rest — a compact old enough that no one remembers who wrote its terms.{/has_faction}{?!has_faction}{name} meets the fence in the back alley. The old word for this arrangement is discretion.{/?!has_faction}',
        successAfterimage: 'Good price. The throne beneath has its share. The compact holds.',
        failureAfterimage: 'The fence lowballs. The long quiet after the price is named.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Goods that cannot pass through the gate watch must pass through {name}. What is held in trust by one party will be held by another before morning.',
      success: 'The deal is made. The Court\'s share is paid. The old compact between the throne beneath and those who work for it is honored once more.',
      failure: 'The fence walks. What is owed goes unpaid. The Court notes this, as the Court notes everything.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The goods move. Coin moves the other way. Both parties walk away remembering the price and not the objects.',
        changes: [
          {
            id: 'uk_fence_standing',
            kind: 'reputation_tally',
            title: 'The Fence Remembers',
            detail: 'The Court keeps a ledger of who fenced what. Tonight adds a line.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath make of the exchange?',
        reactions: [
          {
            id: 'uk.fence.extend_route',
            label: 'Introduce the fence to a district still untapped.',
            intent: 'A fence with new custom is a fence who owes the introducer. The compact widens.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.quest.protection_racket',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 1.0,
                seedLabel: 'The new district now knows the Court\'s face. It may as well know the Court\'s price.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.fence.banked',
            label: 'Take the cut and go. The Court rewards quiet months.',
            intent: 'Nothing showy. The compact, observed without incident, is the Court\'s preferred tempo.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.quest.protection_racket',
    name: 'Run the Racket',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'Collection day in {location}. {name} makes the rounds — a courtesy extended to the merchants who understand what is owed to the throne beneath.',
        successAfterimage: 'Everyone pays. The old compact, observed without incident.',
        failureAfterimage: 'A shopkeeper refuses. This is what courtesy denied looks like.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The holdout needs reminding of the compact. {name} explains what is held in trust — and what happens to those who deny the courtesy.{/has_faction}{?!has_faction}{name} delivers the message that the Court does not repeat.{/?!has_faction}',
        successAfterimage: 'The merchant reconsiders. Payment received. The compact is whole.',
        failureAfterimage: 'The guard is called. A long quiet walk out of {location}.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath expects its share of {location}\'s commerce. {name} collects what is owed.',
      success: 'The round closes clean. The Court\'s old compact with this district holds another season.',
      failure: 'Courtesy denied. The Court does not forget which merchants have short memories.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The round closes. Shopkeepers count what remains of the day\'s till. The Court\'s collector walks the long way home.',
        changes: [
          {
            id: 'uk_racket_standing',
            kind: 'reputation_tally',
            title: 'The District Learns',
            detail: 'Each round teaches the district a little more about how the compact is kept.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath make of the collection?',
        reactions: [
          {
            id: 'uk.racket.press_hard',
            label: 'Lean on the holdouts. Let the district feel the compact.',
            intent: 'Hard collection earns respect and heart-cost. The Court pays attention to both ledgers.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.quest.blackmail_mark',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 1.0,
                seedLabel: 'A merchant who paid under pressure has a secret the Court can also hold.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.racket.light_touch',
            label: 'Collect and go. The compact is long — the Court has time.',
            intent: 'A gentle round keeps the district quiet. Quiet is the Court\'s preferred weather.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.quest.smuggle_cargo',
    name: 'Smuggle Cargo',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'Contraband must move past the gate watch at {location}. {name} studies the patrol schedule — a long quiet observation before the move.',
        successAfterimage: 'A gap in the watch. The Court\'s old knowledge of every patrol in every city.',
        failureAfterimage: 'The watch has doubled. What is owed to the Court will be delayed.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}Through the routes the Court has used for a hundred years, {name} moves the cargo — the old word for this work is simply "courtesy to the throne beneath."{/has_faction}{?!has_faction}Through sewer and shadow, the cargo moves. {name} does not linger to see it delivered.{/?!has_faction}',
        successAfterimage: 'Delivered. What was held in transit is now held in trust elsewhere.',
        failureAfterimage: 'Intercepted. The cargo is lost. The compact requires a conversation about what is owed.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires certain goods to move without declaration. {name} understands the old word for such arrangements: necessary.',
      success: 'Cargo delivered. The Court profits. The long quiet after a job done properly.',
      failure: 'Intercepted. The compact between the Court and the watch was, this once, more fragile than expected.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The cargo travels. It arrives or it does not. The Court\'s ledger of routes updates itself either way.',
        changes: [
          {
            id: 'uk_smuggle_standing',
            kind: 'reputation_tally',
            title: 'Route Knowledge Deepens',
            detail: 'Every run, successful or not, tells the Court something about which watch captains are reliable.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath make of the run?',
        reactions: [
          {
            id: 'uk.smuggle.quiet_payout',
            label: 'Bank the run. Move on to the next.',
            intent: 'A route that worked is a route worth not talking about.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.smuggle.watch_sketch',
            label: 'Document what {name} saw of the gate watch. Sell the knowledge up the Court.',
            intent: 'Patrol patterns are the oldest currency the Court trades in. This one is fresh.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              {
                kind: 'intelligence' as const,
                category: 'military_position',
                label: 'Gate watch rotation at {location}',
                detail: 'Two-hour overlap at the west gate between second and third watches. The west sergeant trades shifts for coin.',
                reliability: 0.75,
              },
              {
                // Court-trained smuggler reads the watch through prior
                // military_position intel — the patrol pattern is currency here.
                kind: 'intel_referenced_prose' as const,
                category: 'military_position',
                prose: {
                  reliable: 'The garrison at {location} ran on the schedule {name} had memorized — sergeants where sergeants were said to be, the same blind angles where they were said.',
                  uncertain: 'The watch hours {name} had memorized had loosened — close enough to time the move, far enough off that the timing required a second look.',
                  dubious: 'What {name} carried as the watch schedule in {location} matched none of the watch — the column had reformed, and the intelligence had not.',
                },
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.quest.blackmail_mark',
    name: 'Blackmail a Mark',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'Every notable in {location} has something held in trust against their will. {name} finds it — a long quiet observation of the sort the Court has practiced for generations.',
        successAfterimage: 'A scandal worth having. Leverage well-acquired.',
        failureAfterimage: 'Clean as a kept promise. Or better at concealment than expected.',
      },
      {
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The Court does not threaten. The Court delivers what the old word calls "a reminder of what is owed." {name} delivers this reminder with the appropriate courtesy.{/has_faction}{?!has_faction}{name} lays out the compact: pay, or be exposed. The terms are the Court\'s.{/?!has_faction}',
        successAfterimage: 'The mark pays. A reliable income stream born from what was held in trust.',
        failureAfterimage: 'The mark calls the bluff. Courtesy denied — and now they know the Court\'s reach.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires a new source of revenue in {location}. {name} will find what is held in trust by those who cannot afford it to be known.',
      success: 'The compact is written in silence. The mark pays. The Court holds what it holds.',
      failure: 'The mark refuses. The old word for this outcome is embarrassment. The Court does not use it aloud.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The conversation ends. Whatever was exchanged — coin, silence, defiance — neither party will speak of again. The Court notes it for both of them.',
        changes: [
          {
            id: 'uk_blackmail_standing',
            kind: 'reputation_tally',
            title: 'Leverage Taken or Lost',
            detail: 'Blackmail is a ledger that does not forgive errors. The Court remembers which entries closed clean.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath keep from the arrangement?',
        reactions: [
          {
            id: 'uk.blackmail.hold_secret',
            label: 'Hold the mark\'s secret in reserve. The Court will ask for it again.',
            intent: 'A paid mark is a mark who can be asked again. The compact compounds.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Holds a notable\'s secret — leverage ready for the next ask',
                revealFamilies: ['investigation', 'underking_court'],
              },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.senior.corrupt_official',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2,
                priority: 1.1,
                seedLabel: 'The mark names another notable under pressure. The thread pulls toward the hall.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.blackmail.burn_it',
            label: 'Destroy the leverage. Some secrets are too hot to hold.',
            intent: 'A burned secret is a promise kept — and promises are rare enough in this work to have weight.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const UNDERKING_COURT_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.senior.heist_planning',
    name: 'Plan the Heist',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'eye',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'A wealthy estate near {location} holds something the throne beneath wants. {name} studies the defenses — the old long quiet of a Court enforcer on observation.',
        successAfterimage: 'Guard rotations mapped. Entry points known. What is held in trust by the estate is about to change hands.',
        failureAfterimage: 'Better guarded than expected. The compact must be renegotiated.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}In through the window that the Court has known about for thirty years, past guards who do not know what courtesy is being paid to the throne beneath. {name} works with the precision the Court demands.{/has_faction}{?!has_faction}In through the dark, past the guards, into the vault. {name} takes what was always owed.{/?!has_faction}',
        successAfterimage: 'Clean job. The old word for this is "collected." No one saw a thing.',
        failureAfterimage: 'Alarms triggered. The prize stays. The compact with the Court now includes a debt.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath wants what a wealthy family of {location} has been holding in trust — though they do not yet know it is held in trust.',
      success: 'A clean haul. The Court nods. The compact between the throne beneath and those who serve it holds.',
      failure: 'The prize remains. The Court logs the courtesy denied and sends another name next season.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'The estate\'s household rises to find a cabinet forced or undisturbed. The house watch writes what they can. The Court writes what they cannot.',
        changes: [
          {
            id: 'uk_heist_standing',
            kind: 'reputation_tally',
            title: 'The Estate Remembers',
            detail: 'The wealthy keep longer ledgers than the Court. A noticed theft is a warrant in waiting.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath do with the heat?',
        reactions: [
          {
            id: 'uk.heist.vanish',
            label: 'Vanish. Let the heat pass. The Court will call when it is safe.',
            intent: 'Discretion after a heist is the Court\'s second skill. Patience is the first.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Knows which estate lost what, and when',
                revealFamilies: ['investigation', 'civic_guard'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.heist.draw_watch',
            label: 'Draw the watch\'s attention toward a rival crew. Let the guards do the Court\'s pruning.',
            intent: 'A heist that the civic guard investigates against the wrong faction is a heist that pays twice.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              {
                kind: 'encounter_seed' as const,
                encounterFamily: 'civic_guard',
                templateId: 'cg.patrol.wall_walk',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 0.9,
                seedLabel: 'The guard gets a tip. The tip points away from the Court. Somewhere, a rival crew is about to have a hard month.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'uk.senior.eliminate_rival',
    name: 'Eliminate a Rival',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'shadow',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'A rival operator has ignored the old compact — their operations encroach on {location} without courtesy paid to the throne beneath. {name} finds them.',
        successAfterimage: 'Vulnerable at their safe house. What is owed the Court is about to be collected.',
        failureAfterimage: 'Cautious. Hard to pin down. The long quiet before a second attempt.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The Court does not explain. The Court removes what violates the compact. {name} delivers the old word for what happens when you operate in the throne beneath\'s territory without paying what is owed.{/has_faction}{?!has_faction}{name} removes the rival. Their operations fold into the Court\'s. The long quiet after.{/?!has_faction}',
        successAfterimage: 'The rival is gone. Their old holdings pass to the throne beneath. Courtesy, eventually, paid.',
        failureAfterimage: 'The rival escapes. They know the Court\'s face now. The compact is broken openly.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court does not tolerate operations in {location} that have not paid what is owed to the throne beneath. {name} will address this discourtesy.',
      success: 'The rival is removed. The Court\'s old compact with this district is restored.',
      failure: 'The rival escapes with knowledge of {name}. The Court notes the outcome without comment.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'A body is found, or a rival is vanished, or the rival is not found at all. In any case, a territory has changed tenants, and no one will write down why.',
        changes: [
          {
            id: 'uk_eliminate_standing',
            kind: 'reputation_tally',
            title: 'The District Shifts',
            detail: 'A removed rival reshapes the small map of who collects where. The Court redraws quietly.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath do after the work is done?',
        reactions: [
          {
            id: 'uk.eliminate.absorb_territory',
            label: 'Move Court operators into the rival\'s vacated ground.',
            intent: 'A seat empty invites a seat filled. The Court\'s enforcers do not leave ground un-held.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 2 },
              {
                kind: 'hidden_mark' as const,
                category: 'betrayal',
                severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY,
                label: 'Took a life on Court orders — the weight of that work sits on {name}\'s shoulders',
                revealFamilies: ['investigation', 'confession', 'civic_guard'],
              },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.elite.seize_territory',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2,
                priority: 1.2,
                seedLabel: 'The vacated ground wants a master. The Court considers who to send.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.eliminate.leave_quiet',
            label: 'Leave the ground fallow. Let the district think the rival simply left.',
            intent: 'Sometimes the Court prefers the shape of an absence to the shape of a claim.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
              {
                kind: 'hidden_mark' as const,
                category: 'betrayal',
                severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY,
                label: 'Carries the work of the rival\'s removal — unspoken, unwitnessed',
                revealFamilies: ['investigation', 'confession'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'uk.senior.corrupt_official',
    name: 'Corrupt an Official',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'eye',
        difficulty: UK_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'Every official in {location} holds something — ambition, debt, a secret — that makes them available. {name} finds the one who is most ready to learn what is owed to the throne beneath.',
        successAfterimage: 'Debts piling up. A vulnerable official found. The old word for this is a door opening.',
        failureAfterimage: 'Annoyingly honest. A long quiet reassessment of who else might be available.',
      },
      {
        reach: 'gold',
        difficulty: (UK_SENIOR_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}Gold, favors, or the old word the Court has used for centuries — "protection." {name} brings the official into the compact. The throne beneath gains an asset in the hall.{/has_faction}{?!has_faction}{name} makes the offer. The compact is simple: what is owed is owed, and the Court remembers both sides.{/?!has_faction}',
        successAfterimage: 'The official accepts. A useful door into the city hall. The compact, extended.',
        failureAfterimage: 'They refuse. The long quiet before {name} vanishes and a different approach is found.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath requires a friend inside the halls of {location}. {name} will find who holds something worth trading.',
      success: 'The official enters the compact. The Court holds what was held in trust. The long quiet of a done deal.',
      failure: 'The official reports the approach. The Court notes their name as one who has denied the courtesy.',
    },
    aftermathConfig: {
      branchOnStep: 1,
      variants: {},
      fallback: {
        overview: 'An official walks home with different coin in their purse or the same coin and a worse night\'s sleep. The Court will know which, before the week is out.',
        changes: [
          {
            id: 'uk_corrupt_standing',
            kind: 'reputation_tally',
            title: 'A Door in the Hall',
            detail: 'The Court\'s map of who can be reached by coin gains another mark.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath do with the new asset?',
        reactions: [
          {
            id: 'uk.corrupt.cultivate',
            label: 'Feed the official small wins. Build the leverage slowly.',
            intent: 'An official given three small favors is an official who cannot refuse the fourth. The compact grows teeth.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Holds a corrupted official in {location}\'s hall',
                revealFamilies: ['investigation', 'civic_guard'],
              },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.elite.shadow_coup',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 3,
                priority: 1.2,
                seedLabel: 'One corrupted official could be the seed of many. The Court begins thinking about the shape of a quiet takeover.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.corrupt.quiet_asset',
            label: 'Keep the asset in reserve. Only call when the need is high.',
            intent: 'A door used is a door noticed. The Court prefers doors unnoticed until the one moment they must open.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const UNDERKING_COURT_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'uk.elite.seize_territory',
    name: 'Seize Territory',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'shadow',
        difficulty: UK_ELITE_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'An entire district of {location} must pass to the throne beneath. {name} undermines those who currently hold what is owed to the Court — the old work before the old word.',
        successAfterimage: 'Their operations disrupted. Lieutenants bought. What was held in trust elsewhere is loosening.',
        failureAfterimage: 'The competition pushes back. The compact must be extended by force.',
      },
      {
        reach: 'gold',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{name} moves the Court\'s people into {location}. The old compact is posted — not written, never written — but understood by everyone who operates in the district.',
        successAfterimage: 'New territory secured. What was the other faction\'s revenue is now the Court\'s courtesy to collect.',
        failureAfterimage: 'The district resists. Local loyalty runs as deep as the Court\'s patience.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The throne beneath does not hold territory through force alone. {name} rewards the loyal and reminds the defiant of what is owed — the long quiet after makes the point better than anything said.{/has_faction}{?!has_faction}{name} holds the line. The Court\'s old word for this is simply: endurance.{/?!has_faction}',
        successAfterimage: 'The district is the Court\'s. The Underking approves. The compact expands.',
        failureAfterimage: 'Cracks form. Holding territory is harder than taking it. The old truth, rediscovered.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath intends to hold all of {location}\'s underworld. {name} is the instrument of that old compact being, at last, enforced.',
      success: 'The district belongs to the Court. The compact is written in shadow and collection receipts.',
      failure: 'Territory contested. The Court notes the outcome in its ledger of what is owed — and what is not yet collected.',
    },
    aftermathConfig: {
      branchOnStep: 2,
      variants: {},
      fallback: {
        overview: 'A district changes hands, or fails to, by inches. The watch notices something. The Court notices what the watch did not.',
        changes: [
          {
            id: 'uk_territory_standing',
            kind: 'reputation_tally',
            title: 'A District in the Ledger',
            detail: 'Territory taken or lost is written in the shape of who collects from whom. The page turns.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath do with the new ground?',
        reactions: [
          {
            id: 'uk.territory.hard_consolidate',
            label: 'Hold by force. Make the compact visible where the Court usually keeps it hidden.',
            intent: 'Force is a tool the Court prefers not to reach for — but when reached for, the Court reaches hard. The civic guard will notice. Let them.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 3 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Commanded a district takeover in {location}',
                revealFamilies: ['investigation', 'civic_guard'],
              },
              {
                kind: 'encounter_seed' as const,
                encounterFamily: 'civic_guard',
                templateId: 'cg.senior.inquisition',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2,
                priority: 1.1,
                seedLabel: 'The civic guard, asked pointed questions by its captains, begins a quiet inquiry into the {location} district.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.territory.soft_consolidate',
            label: 'Consolidate by compact. Let the district choose the Court the way the Court always prefers.',
            intent: 'Silence is the Court\'s native tongue. A district that bows without knowing it has bowed is the highest form of the compact.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'uk.elite.shadow_coup',
    name: 'Shadow Coup',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        difficulty: UK_ELITE_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: 'The throne beneath requires agents in every position that matters in {location}. {name} places them — a long quiet work of patience and old favors called in.',
        successAfterimage: 'Agents in place. The web is woven. The compact now reaches into the highest halls.',
        failureAfterimage: 'A double agent. The network is compromised. The long quiet of exposure.',
      },
      {
        reach: 'gold',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{name} activates the network. Key decisions in {location} now flow through what is held in trust by the throne beneath. The city\'s leadership does not know the order of speaking has changed.',
        successAfterimage: 'The city\'s choices are the Court\'s choices. The old compact, now at its fullest extension.',
        failureAfterimage: 'Counter-intelligence. Some agents exposed. The compact pulls back.',
      },
      {
        reach: 'shadow',
        difficulty: (UK_ELITE_BASE + UK_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The Underking demands what was always held in trust for the throne beneath. {name} completes the work. Total control. The city bows — without knowing it has bowed.{/has_faction}{?!has_faction}{name} pulls the final threads. The city belongs to the Court now. Courtesy received.{/?!has_faction}',
        successAfterimage: 'The city is the Court\'s. None are the wiser. The old word for this is: complete.',
        failureAfterimage: 'The coup unravels. Scapegoats are needed. The compact requires new terms.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath will hold {location} entirely — not by force, but by the old compact extended until there is nothing outside it.',
      success: 'The city is the Court\'s. The order of speaking has changed everywhere. No one announces this.',
      failure: 'The coup collapses. The Court retreats. What is owed is deferred — not forgiven.',
    },
    aftermathConfig: {
      branchOnStep: 2,
      variants: {},
      fallback: {
        overview: 'The city wakes with the same council, the same captains, the same halls — and a new shape to who truly decides. Or it does not. Either way, no one writes it down.',
        changes: [
          {
            id: 'uk_coup_standing',
            kind: 'reputation_tally',
            title: 'The Order of Speaking',
            detail: 'The Court keeps its own map of who actually rules. Tonight the map was either extended or rolled up again.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the throne beneath do with the completed (or failed) work?',
        reactions: [
          {
            id: 'uk.coup.seal_total',
            label: 'Seal the network. The Court holds the city. Silence is the only record.',
            intent: 'A coup finished is a coup forgotten. The compact\'s highest form is the one no one can prove happened.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 3 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 2 },
              {
                kind: 'hidden_mark' as const,
                category: 'betrayal',
                severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY,
                label: 'Holds the shape of {location}\'s quiet takeover — the deepest secret the Court carries',
                revealFamilies: ['investigation', 'civic_guard', 'holy_order'],
              },
              {
                kind: 'encounter_seed' as const,
                encounterFamily: 'civic_guard',
                templateId: 'cg.senior.inquisition',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 3,
                priority: 0.9,
                seedLabel: 'Somewhere in the civic guard, a captain senses the wrongness of the city\'s weather. They open a file.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.coup.burn_traces',
            label: 'Burn the exposed agents. Accept the retreat and the cost.',
            intent: 'A coup that can be traced is a coup that cannot hold. The Court prefers a clean exit to a slow unraveling.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              { kind: 'reputation_tally' as const, key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const UNDERKING_COURT_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'uk.social.gambling_den',
    name: 'The Gambling Den',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        difficulty: UK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}Dice and cards in a room the Court runs. {name} plays — the tables are a courtesy extended to those who understand what is held in trust by everyone at them.{/has_faction}{?!has_faction}{name} sits at the tables. Connections are made over games. The old word for this establishment is useful.{/?!has_faction}',
        successAfterimage: 'Lucky. Heavier pockets. New contacts who know what is owed goes both ways.',
        failureAfterimage: 'Bad luck. Lighter pockets. But now {name} knows who cheats — and who watches.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court\'s gambling den at {location} is where the old compact is observed in its simplest form: everyone pays to play.',
      success: 'A profitable evening. The old word for this is: what is owed, collected.',
      failure: 'A losing night. The Court\'s tables are patient creditors.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The tables close. The room empties. The Court\'s take, small or large, is the only constant.',
        changes: [
          {
            id: 'uk_gambling_standing',
            kind: 'reputation_tally',
            title: 'The Den Remembers',
            detail: 'Every table tells the Court something about who bluffs and who folds in the wider city.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the throne beneath take from the evening?',
        reactions: [
          {
            id: 'uk.gambling.network_tip',
            label: 'Pass what was overheard up the whisper chain.',
            intent: 'A drunk merchant is a merchant who spoke. The Court\'s ear is the Court\'s oldest asset.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.social.whisper_network',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 0.9,
                seedLabel: 'Something overheard at the tables will want trading in the whisper rooms tomorrow.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.gambling.walk_quiet',
            label: 'Keep the night private. The tables are the Court\'s and what happens at them is the Court\'s.',
            intent: 'Silence is the oldest house rule.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.social.black_market',
    name: 'Black Market Browse',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        difficulty: (UK_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}The underground market at {location} sells what is held in trust from every job in the district. {name} browses — a courtesy extended to those who know the old word for this commerce.{/has_faction}{?!has_faction}{name} moves through the market. What cannot pass the gate watch sells here at a different rate.{/?!has_faction}',
        successAfterimage: 'A rare find. What was held elsewhere is now held by {name}.',
        failureAfterimage: 'Nothing worth having today. The good stock is gone or hidden.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The throne beneath\'s black market in {location} has what the legitimate shops will not carry.',
      success: 'A good purchase. The compact between buyer and seller, honored.',
      failure: 'The market has nothing. The Court\'s inventory is, today, elsewhere.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The market closes its tarps for the day. What changed hands will not be declared. What didn\'t, will return tomorrow.',
        changes: [
          {
            id: 'uk_black_market_standing',
            kind: 'reputation_tally',
            title: 'The Market Knows You',
            detail: 'A buyer who returns is a buyer the stallkeepers shape their inventory for. Slowly.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the throne beneath note from the browse?',
        reactions: [
          {
            id: 'uk.black_market.spot_fence',
            label: 'Point a fresh haul\'s owner toward the right stall.',
            intent: 'An introduction made here is a commission to be collected later.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.quest.fence_goods',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 0.9,
                seedLabel: 'A stallkeeper will need a specific haul before the week is out. The Court knows who can provide it.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.black_market.walk_through',
            label: 'Browse and go. Build the face.',
            intent: 'A face seen often enough stops being noticed. That is the oldest discipline in this craft.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'uk.social.whisper_network',
    name: 'Whisper Network',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'shadow',
        difficulty: (UK_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate: '{?has_faction}Information is the old currency of the Court. {name} enters the whisper network at {location} — share one rumor, receive two. What is held in trust by one mouth is held by another by nightfall.{/has_faction}{?!has_faction}{name} trades in what the Court holds as its oldest stock: what people do not know they are telling.{/?!has_faction}',
        successAfterimage: 'Useful intelligence. Someone now owes {name} a favor the Court can collect.',
        failureAfterimage: 'More given than gained. A poor trade. The long quiet of an unfavorable exchange.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The Court\'s whisper network at {location} is where what is held in trust by everyone is traded at the old word\'s price: discretion.',
      success: 'Good intelligence gained. The compact between those who know and those who need to know, honored.',
      failure: 'More given than received. The old compact, this time, favored the other side.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The rooms empty. What was said is already halfway across the city. What was not said is already halfway across {name}\'s mind.',
        changes: [
          {
            id: 'uk_whisper_standing',
            kind: 'reputation_tally',
            title: 'The Whisper Chain Owes You',
            detail: 'An entry in the informal ledger the Court keeps of who has traded what, and for whom.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the throne beneath do with what {name} heard?',
        reactions: [
          {
            id: 'uk.whisper.bank_intel',
            label: 'Record the name and the asking. The Court keeps such ledgers for decades.',
            intent: 'Named intelligence is the Court\'s true wealth. Today\'s rumor is next year\'s leverage.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
              {
                kind: 'intelligence' as const,
                category: 'political_secret',
                label: 'A notable of {location} is asking questions about the grain stores',
                detail: 'The name circulated through three rooms before reaching {name}. The asking is recent, specific, and funded — someone is measuring something.',
                reliability: 0.7,
              },
              {
                kind: 'hidden_mark' as const,
                category: 'debt',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Owes a whisper-broker a return favor — the chain compounds',
                revealFamilies: ['investigation', 'underking_court'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'uk.whisper.trade_up',
            label: 'Trade the fresh rumor up the chain. Let the Court price it properly.',
            intent: 'A rumor that reaches the Court\'s ear before the city\'s is a rumor priced three times over.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
              {
                kind: 'encounter_seed' as const,
                templateId: 'uk.quest.blackmail_mark',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                priority: 1.0,
                seedLabel: 'What {name} heard tonight names a notable who should be asked for a contribution.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const UK_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'uk.join',
  name: 'Prove Your Worth to the Court',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  steps: [
    {
      reach: 'shadow',
      difficulty: UK_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: '{?has_faction}The Court demands proof of skill. Steal something valuable without being caught. The old word for this test is simply: the courtesy you pay to be allowed to pay the Court.{/has_faction}{?!has_faction}{name} proves their worth to the throne beneath. The compact begins with a clean job.{/?!has_faction}',
      successAfterimage: 'Clean work. {name} is a pawn of the Court now. What is owed begins today.',
      failureAfterimage: 'Too clumsy. The Court has no use for those who cannot hold what they take.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The throne beneath considers all applications at {location} in the old way: demonstrate, or leave.',
    success: 'The Court accepts {name}. The compact is signed in the only ink the Court uses: demonstrated competence.',
    failure: 'The Court does not say goodbye. The Court simply does not call again.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The test ends. The Court either extends the compact or does not. Either way, the silence that follows is intentional.',
      changes: [
        {
          id: 'uk_join_standing',
          kind: 'faction_reputation',
          title: 'The Compact Begins (or Doesn\'t)',
          detail: 'The Court\'s ledger either gains a new name or does not — and no one outside this room will know which.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the throne beneath take from this applicant?',
      reactions: [
        {
          id: 'uk.join.accepted',
          label: 'Seal the compact. {name} is a pawn now.',
          intent: 'A new name in the ledger. The Court will test again, in its way, at its pace.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'underking_court', amount: 0.05 },
            { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const UK_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'uk.promotion',
  name: 'Court Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  steps: [
    {
      reach: 'shadow',
      difficulty: UK_PROMOTION_DIFFICULTY / 100,
      duration: { min: 2, max: 2 },
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: '{?has_faction}Higher rank in the Court requires a demonstration of what the old word calls "cunning beyond what is owed." {name} is tested. The throne beneath watches without announcing it is watching.{/has_faction}{?!has_faction}{name} must prove themselves worthy of more of the Court\'s trust.{/?!has_faction}',
      successAfterimage: 'The Court elevates {name}. More power. More expectations. The compact deepens.',
      failureAfterimage: 'Not yet. Remain where you are. The long quiet of a held rank.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The throne beneath considers {name}\'s standing in the compact. The old word for promotion is: what is owed, re-negotiated.',
    success: 'New rank granted. The order of speaking shifts. The Court notes the change without ceremony.',
    failure: 'Not yet. The Court\'s patience is as long as its memory.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The proving ends. A rank either advances or does not. The Underking, somewhere, closes a ledger.',
      changes: [
        {
          id: 'uk_promotion_standing',
          kind: 'faction_reputation',
          title: 'The Order of Speaking',
          detail: 'Rank in the Court is not announced. It is simply the way a room reorders itself when {name} enters.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the throne beneath take from the proving?',
      reactions: [
        {
          id: 'uk.promotion.advanced',
          label: 'Seal the advancement.',
          intent: 'The compact is re-negotiated. {name} now has more of what the Court holds — and more of what the Court expects.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'underking_court', amount: 0.05 },
            { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 2 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
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
