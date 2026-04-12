// src/data/strategic-packs/courtStrategicPack.ts
//
// Court-political behavior pack: influence, office, patronage, dynasty-building.
// Ambitions: ambition_found_dynasty
// Six templates covering the arc from political assessment to maintaining authority.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const COURT_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Assess Political Landscape — gather intelligence on power structures
  {
    id: 'strategic_assess_politics',
    displayName: 'Assess Political Landscape',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'court-political',
    reachProfile: { eye: 0.5, heart: 0.3, shadow: 0.2 },
    activityProse: [
      'Mapping the alliances. Counting the enemies. Noting who sits where at table.',
      'Politics is a map drawn in whispers. She reads it fluently.',
    ],
    completionProse: [
      'The political landscape is clear. Every favor owed, every grudge held.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'castle', 'town'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'political_survey' },
  },

  // 2. Buy Influence — cultivate connections through gifts and favors
  {
    id: 'strategic_buy_influence',
    displayName: 'Buy Influence',
    verb: 'change',
    executionMode: 'instant',
    behaviorFamily: 'court-political',
    reachProfile: { gold: 0.5, heart: 0.3, shadow: 0.2 },
    activityProse: [
      'A gift here, a favor there. The currency of influence is attention.',
      'Every friendship at court has a price. The trick is paying it before the invoice arrives.',
    ],
    completionProse: [
      'Influence purchased. Not loyalty — but access, which is almost as useful.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'castle'] },
    resourceHint: { wealthCost: 30, reachFloor: { gold: 0.3 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'influence_purchased' },
  },

  // 3. Secure Office — gain a position of formal authority
  {
    id: 'strategic_secure_office',
    displayName: 'Secure Office',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { heart: 0.5, gold: 0.3, shadow: 0.2 },
    projectDuration: 8,
    activityProse: [
      'Campaigning. Calling in favors. Making promises that feel like truth.',
      'An office is a lever. The work now is positioning it correctly.',
    ],
    completionProse: [
      'The office is secured. A title, a seal, and the power they imply.',
    ],
    catalystEncounterIds: ['encounter_political_rival', 'encounter_court_intrigue'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'castle'] },
    resourceHint: { wealthCost: 60, reachFloor: { heart: 0.3, gold: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'office_secured' },
  },

  // 4. Organize Patronage Network — build a web of clients and dependents
  {
    id: 'strategic_organize_patronage',
    displayName: 'Organize Patronage Network',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { heart: 0.4, gold: 0.4, shadow: 0.2 },
    projectDuration: 9,
    activityProse: [
      'Matching needs to providers. Every favor creates a thread of obligation.',
      'A patronage network is a spider web — invisible until something struggles in it.',
    ],
    completionProse: [
      'The network is woven. Names that answer when called, hands that move when directed.',
    ],
    catalystEncounterIds: ['encounter_betrayal', 'encounter_loyalty_test'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital'] },
    resourceHint: { wealthCost: 80, reachFloor: { heart: 0.3, gold: 0.3 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'court', nameTemplate: "{actor}'s Court at {location}" },
  },

  // 5. Establish Dynasty Seat — found an estate or hall as a dynastic base
  {
    id: 'strategic_establish_dynasty_seat',
    displayName: 'Establish Dynasty Seat',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { gold: 0.4, stone: 0.3, heart: 0.2, star: 0.1 },
    projectDuration: 10,
    activityProse: [
      'Choosing the site. Raising the walls. A dynasty needs an address.',
      'The seat is more than a building — it is a declaration of permanence.',
    ],
    completionProse: [
      'The dynasty seat stands. A place for the name to live after the person is gone.',
    ],
    catalystEncounterIds: ['encounter_succession_crisis', 'encounter_rival_claim'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'town'] },
    resourceHint: { wealthCost: 100, reachFloor: { gold: 0.4, stone: 0.2 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'estate', nameTemplate: "House of {actor} at {location}" },
  },

  // 6. Maintain Authority — sustain political dominance
  {
    id: 'strategic_maintain_authority',
    displayName: 'Maintain Authority',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'court-political',
    reachProfile: { heart: 0.4, gold: 0.3, shadow: 0.3 },
    activityProse: [
      'Attending to the court. Reminding the ambitious who holds the reins.',
      'Authority rusts in neglect. Every day requires a fresh coat of attention.',
    ],
    completionProse: [
      'Authority maintained. The political order holds, for now.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'castle'] },
    resourceHint: { reachFloor: { heart: 0.3 } },
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a court strategic template by ID */
export function getCourtTemplate(id: string): StrategicActionTemplate | undefined {
  return COURT_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
