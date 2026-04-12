// src/data/strategic-packs/zealotStrategicPack.ts
//
// Zealot-mission behavior pack: faith, conversion, consecration, doctrine enforcement.
// Ambitions: ambition_spread_faith
// Six templates covering the arc from surveying the faithful to policing doctrine.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const ZEALOT_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Survey the Faithful — assess local devotion and potential converts
  {
    id: 'strategic_survey_faithful',
    displayName: 'Survey the Faithful',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.5, eye: 0.3, heart: 0.2 },
    activityProse: [
      'Listening at doorways. Counting heads at prayer. Measuring devotion.',
      'The faithful are easy to count. The faithless hide better.',
    ],
    completionProse: [
      'The spiritual landscape is mapped. Fertile ground here, stony ground there.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'shrine', 'temple'] },
    resourceHint: { reachFloor: { star: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'faith_survey' },
  },

  // 2. Preach to the Masses — convert a settlement toward devotion
  {
    id: 'strategic_preach_masses',
    displayName: 'Preach to the Masses',
    verb: 'change',
    executionMode: 'instant',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.5, heart: 0.4, shadow: 0.1 },
    activityProse: [
      'Standing on the square, voice carrying over the market noise. The words land.',
      'Preaching is not persuasion. It is permission to believe what they already suspect.',
    ],
    completionProse: [
      'Some knelt. Some turned away. The seed is planted regardless.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { reachFloor: { star: 0.3, heart: 0.2 } },
    mutationHint: { type: 'modify_location_property', property: 'magicalSaturation', delta: 0.08, clamp: [0, 1] },
  },

  // 3. Found Shrine — establish a place of worship
  {
    id: 'strategic_found_shrine',
    displayName: 'Found Shrine',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.6, stone: 0.2, heart: 0.2 },
    projectDuration: 7,
    activityProse: [
      'Choosing the stone. Carving the altar. A shrine needs earth and intent.',
      'Every shrine begins as a clearing and a prayer.',
    ],
    completionProse: [
      'The shrine stands. Small, but the flame burns steadily.',
    ],
    catalystEncounterIds: ['encounter_shrine_desecration', 'encounter_pilgrimage'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'camp'] },
    resourceHint: { wealthCost: 40, reachFloor: { star: 0.3, stone: 0.2 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'shrine', nameTemplate: "Shrine of {actor} at {location}" },
  },

  // 4. Consecrate Site — infuse a location with divine energy
  {
    id: 'strategic_consecrate_site',
    displayName: 'Consecrate Site',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.7, veil: 0.2, heart: 0.1 },
    projectDuration: 5,
    activityProse: [
      'Ritual preparation. Salt circles. Words that echo longer than they should.',
      'The consecration is not a moment — it is a process of convincing the land itself.',
    ],
    completionProse: [
      'The site hums with sacred energy. The ground remembers the rite.',
    ],
    catalystEncounterIds: ['encounter_divine_manifestation'],
    targetRule: { type: 'location_subtype', subtypes: ['shrine', 'temple', 'town', 'city', 'ruins'] },
    resourceHint: { reachFloor: { star: 0.4, veil: 0.2 } },
    mutationHint: { type: 'modify_location_property', property: 'magicalSaturation', delta: 0.15, clamp: [0, 1] },
  },

  // 5. Establish Sacred Route — create a pilgrimage path between holy sites
  {
    id: 'strategic_establish_sacred_route',
    displayName: 'Establish Sacred Route',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.5, stone: 0.3, heart: 0.2 },
    projectDuration: 8,
    activityProse: [
      'Marking the way-stones. Blessing the crossroads. The path itself becomes prayer.',
      'A sacred route is a river of devotion — it flows where you dig the channel.',
    ],
    completionProse: [
      'The route is consecrated. Pilgrims will follow where the faithful walked first.',
    ],
    catalystEncounterIds: ['encounter_bandit_pilgrimage', 'encounter_sacred_vision'],
    targetRule: { type: 'location_subtype', subtypes: ['shrine', 'temple', 'town', 'city'] },
    resourceHint: { wealthCost: 30, reachFloor: { star: 0.3 } },
    mutationHint: { type: 'create_relation_edge', edgeType: 'sacred_route', direction: 'actor_to_target', properties: { routeType: 'pilgrimage' } },
  },

  // 6. Police Doctrine — maintain doctrinal purity and control
  {
    id: 'strategic_police_doctrine',
    displayName: 'Police Doctrine',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'zealot-mission',
    reachProfile: { star: 0.5, iron: 0.3, shadow: 0.2 },
    activityProse: [
      'Watching for heresy. Correcting the wayward. Doctrine is a garden that needs tending.',
      'Purity of faith requires vigilance. The alternative is drift.',
    ],
    completionProse: [
      'Doctrine holds. The faithful stay faithful, for now.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'shrine', 'temple'] },
    resourceHint: { reachFloor: { star: 0.4 } },
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a zealot strategic template by ID */
export function getZealotTemplate(id: string): StrategicActionTemplate | undefined {
  return ZEALOT_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
