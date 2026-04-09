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
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
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
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post', 'port'] },
    resourceHint: { wealthCost: 20, reachFloor: { gold: 0.3 } },
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
    catalystEncounterIds: ['encounter_route_ambush', 'encounter_toll_dispute'],
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post', 'port'] },
    resourceHint: { wealthCost: 40, reachFloor: { gold: 0.4 } },
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
    catalystEncounterIds: ['encounter_warehouse_sabotage', 'encounter_labor_dispute'],
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post', 'port'] },
    resourceHint: { wealthCost: 80, reachFloor: { gold: 0.4, stone: 0.2 } },
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
    catalystEncounterIds: ['encounter_guild_rivalry', 'encounter_charter_challenge'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city'] },
    resourceHint: { wealthCost: 120, reachFloor: { gold: 0.5, heart: 0.3 } },
  },

  // 6. Maintain Monopoly / Control — ongoing control stance
  {
    id: 'strategic_maintain_monopoly',
    displayName: 'Maintain Monopoly',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'merchant-expansion',
    reachProfile: { gold: 0.6, shadow: 0.2, heart: 0.2 },
    activityProse: [
      'Keeping rivals at bay. Maintaining the grip on supply and demand.',
      'Monopoly is not a state — it is an activity. Unattended, it evaporates.',
    ],
    completionProse: [
      'The market answers to one voice. For now.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post'] },
    resourceHint: { reachFloor: { gold: 0.5 } },
  },
];

/** Look up a merchant strategic template by ID */
export function getMerchantTemplate(id: string): StrategicActionTemplate | undefined {
  return MERCHANT_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
