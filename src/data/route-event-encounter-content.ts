/**
 * Route Event Encounter Content — THR-669 (Mortal Economy P2b).
 *
 * The three route-event templates that cargo manifests materialize into:
 * banditry on a rich road, a toll dispute where hostile factions share a
 * route, and an embargo squeezing a staple lifeline. The ids
 * `encounter_route_ambush` / `encounter_toll_dispute` are the catalyst ids
 * `merchantStrategicPack.ts` has referenced since P1 — authored here at last.
 *
 * Seeded by the `route_events` phase (src/engine/phases/routeEvents.ts) for a
 * mortal at one of the route's endpoints. Caravans are route state, not
 * agents — the encounter IS the caravan's moment of attention (NFP #7).
 *
 * Register: baseline plain (THR-609).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import { withEncounterContract } from './encounter-contract-builder';

const ROUTE_EVENT_DIFFICULTY = 0.3;
const ROUTE_EVENT_STEP2_DIFFICULTY = 0.4;

export const ROUTE_EVENT_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Banditry: rich cargo drew exactly who rich cargo draws ─────────────
  withEncounterContract({
    id: 'encounter_route_ambush',
    name: 'Ambush on the Trade Road',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['village', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: ROUTE_EVENT_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The caravan out of {location} is late, and the road knows why before anyone says it. ' +
          'A drover came in at dusk leading a horse with an empty pack frame and a cut girth strap. ' +
          '{name} reads the signs the way road people learn to: where the wagons stopped, ' +
          'which way the wheel ruts swerved, how many boots stood waiting behind the rocks. ' +
          'Rich cargo moves on that road. Someone counted its worth and priced in the risk of taking it.',
        successAfterimage: '{name} finds the ambush site — and the ambushers\' trail, still fresh.',
        failureAfterimage: 'The trail is confused, deliberately. These were not amateurs.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 2 },
        difficulty: ROUTE_EVENT_STEP2_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.3, bestowed_power: 0.2 },
            tagFilters: ['#iron'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.8, possession: 0.2 } },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'They are where the trail says they are — a cold camp above the cut, ' +
          'still dividing what the wagons carried. {name} does not have the luxury of ' +
          'surprise for long. What happens next is the old arithmetic of the road: ' +
          'how many of them, how ready, and how much of the cargo is worth someone\'s blood.',
        successAfterimage:
          'The camp breaks. Some of the cargo comes back to {location}; the road\'s ' +
          'reputation comes back with it.',
        failureAfterimage:
          '{name} withdraws with less than {they} came for. The road stays theirs tonight, ' +
          'and the next caravan will pay for that.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A caravan out of {location} was taken on the road. {name} goes to find out by whom, ' +
        'and whether the road can be made honest again.',
      success: 'The ambushers are broken and the road breathes easier. Trade remembers who cleared it.',
      failure: 'The road stays dangerous. Merchants start pricing the detour.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Word of the ambush travels the route in both directions — faster than any wagon. ' +
          'What {name} did about it travels with it.',
        changes: [
          {
            id: 'route_ambush_road',
            kind: 'reputation',
            title: 'The Road\'s Reputation',
            detail: 'A road is only as good as its last safe crossing. Everyone on this route knows what happened.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The road has been contested. What does the god mark?',
        reactions: [
          {
            id: 'route_ambush_pattern',
            label: 'This was not the first. It will not be the last.',
            intent:
              'Banditry on a rich route is a pattern, not an event. The god marks the ' +
              'road itself — whoever priced this cargo will price the next one.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Organized banditry working the trade road near {location}',
                detail: 'The ambush was planned against a known manifest. Someone is selling route information.',
                reliability: 0.7,
              },
              {
                kind: 'encounter_seed',
                templateId: 'encounter_route_ambush',
                delayTicks: 30,
                seedLabel: 'The road\'s bandits reprice the risk and try again',
                inheritContext: true, // the SAME road, the same pattern
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'route_ambush_settled',
            label: 'The road is settled. Let it carry wagons.',
            intent: 'Handled. The god releases the thread and lets trade resume.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Toll dispute: two masters, one road ────────────────────────────────
  withEncounterContract({
    id: 'encounter_toll_dispute',
    name: 'The Toll Dispute',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['village', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 2 },
        difficulty: ROUTE_EVENT_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.2, bestowed_power: 0.2 },
            tagFilters: ['#gold'],
          },
          reputationDelta: 0.03,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'A new toll chain hangs across the road out of {location}, and the men holding it ' +
          'answer to a different banner than the men who cleared the road last season. ' +
          'Two factions, one route, and every wagon in between paying twice or not moving at all. ' +
          '{name} stands where the ledgers meet — someone has to say a number both sides can ' +
          'swallow, or the road dies of principle.',
        successAfterimage:
          'A rate is struck. Neither side loves it, which is how {name} knows it will hold.',
        failureAfterimage:
          'Neither banner yields. The chain stays up, and the wagons start looking at the long way around.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Two factions are strangling the road out of {location} over toll rights. ' +
        '{name} wades into the middle of it.',
      success: 'The toll war ends with a rate and a handshake nobody enjoys. Trade moves.',
      failure: 'The dispute hardens. The route bleeds wagons to the detour.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Toll disputes are never about the toll. They are about who owns the road\'s future — ' +
          'and everyone on it just learned where the line got drawn.',
        changes: [
          {
            id: 'toll_dispute_terms',
            kind: 'reputation',
            title: 'The Road\'s Terms',
            detail: 'The rate, the chain, and who backed down. Merchants will recite it for a season.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The chain has been tested. What does the god keep?',
        reactions: [
          {
            id: 'toll_dispute_leverage',
            label: 'The ledger behind the toll is worth holding.',
            intent:
              'Whoever set that toll showed what they think the road is worth — and how far ' +
              'they will go to hold it. The god files the number.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Toll politics on the {location} route — who set the rate, who blinked',
                detail: 'The dispute mapped both factions\' real leverage over the road.',
                reliability: 0.75,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'toll_dispute_done',
            label: 'A road quarrel, settled or not. Move on.',
            intent: 'The god releases the thread. Roads have quarrels the way rivers have stones.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Embargo: a staple lifeline, squeezed ───────────────────────────────
  withEncounterContract({
    id: 'encounter_route_embargo',
    name: 'The Grain Does Not Come',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['village', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: ROUTE_EVENT_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The granary ledger at {location} has a column that has read zero for six days: ' +
          'arrivals. The route that feeds this place still exists — the road is open, the wagons ' +
          'are loaded — but somewhere between here and the source, someone has decided the grain ' +
          'should wait. {name} traces the stoppage: a withheld seal, a warehouse that is suddenly ' +
          '"full", a schedule of fees that did not exist last month. Hunger as policy.',
        successAfterimage: '{name} finds where the grain is sitting, and whose hand is on it.',
        failureAfterimage: 'The stoppage hides behind paperwork. The column stays zero.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 2 },
        difficulty: ROUTE_EVENT_STEP2_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.3, bestowed_power: 0.2 },
            tagFilters: ['#gold'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.8, possession: 0.2 } },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Breaking an embargo is a negotiation conducted with every tool that is not a knife, ' +
          'and one or two that are. {name} works the chain from the warehouse door back to the ' +
          'desk where the decision lives. Somewhere in that chain is a person who can be paid, ' +
          'persuaded, embarrassed, or frightened — and behind them, the one who cannot.',
        successAfterimage:
          'The seals move. The first wagons roll before the week is out, and {location} eats.',
        failureAfterimage:
          'The embargo holds. What {location} does when the granary bottoms out is next season\'s problem — ' +
          'or next week\'s.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The staple route into {location} has been strangled — grain loaded, road open, nothing arriving. ' +
        '{name} goes to find the hand on the valve.',
      success: 'The embargo breaks. Grain moves, and {location} remembers who moved it.',
      failure: 'The stoppage holds. The granary math turns ugly.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'An embargo on staples is a siege without walls. Whether it broke or held, ' +
          '{location} now knows exactly how thin the thread it eats by really is.',
        changes: [
          {
            id: 'route_embargo_lifeline',
            kind: 'reputation',
            title: 'The Lifeline',
            detail: 'A route that can be squeezed once can be squeezed again. The town\'s planners are already talking about a second source.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The lifeline was tested. What does the god mark?',
        reactions: [
          {
            id: 'route_embargo_hand',
            label: 'Remember the hand on the valve.',
            intent:
              'Someone chose hunger as an instrument. That choice has an author, and authors ' +
              'repeat themselves. The god marks it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.5,
                label: 'Engineered a staple embargo against {location}',
                revealFamilies: ['mct', 'investigation', 'social'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'mct.quest',
                delayTicks: 20,
                seedLabel: 'The consortium moves to secure a second staple source for {location}',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'route_embargo_fed',
            label: 'The town eats. That is the whole of it.',
            intent: 'Outcomes over authors. The god releases the thread.',
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
