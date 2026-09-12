// src/data/strategic-packs/merchantStrategicPack.ts
//
// Merchant behavior-pack definitions: the first proving slice for strategic actions.
// Six templates covering the full merchant campaign arc from intelligence to monopoly.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const MERCHANT_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Survey Market — gather commercial intelligence
  {
    id: 'strategic_survey_market',
    displayName: 'Survey Market',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { eye: 0.6, gold: 0.4 },
    activityProse: [
      'Counting stalls, noting prices, measuring footfall.',
      'The market tells its secrets to those who listen with coin.',
    ],
    completionProse: [
      'The shape of commerce here is clear now — and the gaps in it.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
    motivations: ['revelation_discretion', 'asceticism_extravagance'],
    mutationHint: { type: 'record_intelligence', intelligenceType: 'market_survey' },
  },

  // 2. Negotiate Storage Rights — establish permission for future warehouse
  {
    id: 'strategic_negotiate_storage',
    displayName: 'Negotiate Storage Rights',
    verb: 'change',
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.5, heart: 0.4, shadow: 0.1 },
    activityProse: [
      'Coin on the table. Terms on the parchment. A handshake that means something.',
      'Negotiating access to storage — the kind of deal that starts empires.',
    ],
    completionProse: [
      'Storage rights secured. The first foothold in a larger plan.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 20, reachFloor: { gold: 0.3 } },
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    mutationHint: { type: 'record_intelligence', intelligenceType: 'storage_rights' },
  },

  // 3. Establish Trade Route — create a trades_with edge between locations
  {
    id: 'strategic_establish_trade_route',
    displayName: 'Establish Trade Route',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.7, eye: 0.3 },
    projectDuration: 6,
    activityProse: [
      'Mapping the route. Negotiating passage. Hiring guards for the first caravan.',
      'Trade routes are drawn in coin and confirmed in cargo.',
    ],
    completionProse: [
      'The route is open. Goods flow where none flowed before.',
    ],
    // THR-1488 — the catalyst names its follow-up by family instead of by a literal
    // id. Every id this pack used to spell was `encounter_<name>` where the corpus
    // spells encounters `encounter.<name>`, so not one of them ever resolved and
    // every catalyst seed this pack planted withered on arrival. The family chosen
    // for this pack: the Consortium sets the cargo, route and contract work an ambush or a toll dispute interrupts.
    catalystQuery: { kind: 'encounter_template', tags: ['#consortium_errand'] },
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 40, reachFloor: { gold: 0.4 } },
    // ── T2 seams (THR-1308) ──
    checkpointDifficulty: 0.5,
    // `false`, on THR-1310's evidence rather than on preference. Proximity landed and
    // presence still starves the checkpoint: nothing moves an agent to its stage until
    // doc 3's binder ships (TODO(THR-1294)), so `true` would make the whole route kind
    // inert the way it made the wanderer family inert. Re-measure when the binder lands.
    requiresLocation: false,
    payoffValue: 1.2,
    motivations: ['asceticism_extravagance', 'loyalty_ambition', 'tradition_novelty'],
    mutationHint: { type: 'create_trade_route' },
  },

  // 3b. Widen the Road — the route kind's update verb (THR-1308). A route that can
  //     only be founded and destroyed is a two-state flag; this is the middle of the
  //     arc, where the thing gets better and therefore worth taking.
  {
    id: 'strategic_extend_route',
    displayName: 'Widen the Road',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.6, stone: 0.2, eye: 0.2 },
    projectDuration: 5,
    activityProse: [
      'Second wagon, then a third. The road complains and then it widens.',
      'Bridges where there were fords. Wells where there were dry stretches. None of it is glamorous and all of it is the work.',
    ],
    completionProse: [
      'What was a track is a road. The cargo doubles and the season stops mattering so much.',
    ],
    catalystQuery: { kind: 'encounter_template', tags: ['#consortium_errand'] },
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 30, reachFloor: { gold: 0.35 } },
    checkpointDifficulty: 0.45,
    requiresLocation: false,
    payoffValue: 1.0,
    motivations: ['asceticism_extravagance', 'preservation_transformation'],
    mutationHint: { type: 'modify_location_property', property: 'prosperity', delta: 6, clamp: [0, 100] },
  },

  // 4. Build Warehouse — create a sublocation with constructed_by edge
  {
    id: 'strategic_build_warehouse',
    displayName: 'Build Warehouse',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.5, stone: 0.4, eye: 0.1 },
    projectDuration: 8,
    activityProse: [
      'Timber, stone, and hired hands. A warehouse rises from ambition.',
      'Building the bones of a commercial empire, one beam at a time.',
    ],
    completionProse: [
      'The warehouse stands. Goods have a home, and the merchant has a foothold.',
    ],
    catalystQuery: { kind: 'encounter_template', tags: ['#consortium_errand'] },
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 80, reachFloor: { gold: 0.4, stone: 0.2 } },
    motivations: ['asceticism_extravagance', 'preservation_transformation'],
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'warehouse', nameTemplate: "{actor}'s Warehouse at {location}" },
  },

  // 5. Found Guild Chapter — faction-linked institution
  {
    id: 'strategic_found_guild_chapter',
    displayName: 'Found Guild Chapter',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.5, heart: 0.3, star: 0.2 },
    projectDuration: 10,
    activityProse: [
      'Writing the charter. Gathering the founding members. Choosing a hall.',
      'A guild chapter is a promise made in public — that commerce here will have a voice.',
    ],
    completionProse: [
      'The guild chapter opens its doors. Merchants now have a seat at the table.',
    ],
    catalystQuery: { kind: 'encounter_template', tags: ['#consortium_errand'] },
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city'] },
    resourceHint: { wealthCost: 120, reachFloor: { gold: 0.5, heart: 0.3 } },
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'guild_chapter', nameTemplate: "{actor}'s Guild Chapter at {location}" },
  },

  // ── Folded from the retired initiative pipeline (THR-1292 §3) ──────
  // 7. Commission Quest — retired by THR-1403. Posting a work order is the faction
  //    phase's job, not a mortal's undertaking, so the fiction had no cell to land on.
];

/** Look up a merchant strategic template by ID */
export function getMerchantTemplate(id: string): StrategicActionTemplate | undefined {
  return MERCHANT_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
