// src/data/strategic-packs/builderStrategicPack.ts
//
// Builder-civic behavior pack: infrastructure, civic construction, fortification.
// Ambitions: ambition_great_work
// Six templates covering the arc from survey through construction to civic stewardship.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const BUILDER_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Survey Construction Site — assess a location for building potential
  {
    id: 'strategic_survey_site',
    displayName: 'Survey Construction Site',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'builder-civic',
    reachProfile: { eye: 0.5, stone: 0.5 },
    activityProse: [
      'Measuring the ground, testing the soil, counting the paces.',
      'A builder reads the land the way a merchant reads a ledger.',
    ],
    completionProse: [
      'The site speaks clearly now — its strengths and its limits.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'camp'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'construction_survey' },
  },

  // 2. Draft Building Plans — prepare designs for a major construction
  {
    id: 'strategic_draft_plans',
    displayName: 'Draft Building Plans',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.6, eye: 0.3, gold: 0.1 },
    activityProse: [
      'Charcoal on vellum. Angles checked twice. Load-bearing calculations.',
      'The plans take shape — not a dream, but an instruction.',
    ],
    completionProse: [
      'The plans are drawn. Now it needs hands, stone, and time.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'castle', 'fort'] },
    resourceHint: { reachFloor: { stone: 0.3 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'building_plans' },
  },

  // 3. Civic Construction — build a workshop, clinic, or public building
  {
    id: 'strategic_civic_construction',
    displayName: 'Civic Construction',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.7, gold: 0.2, heart: 0.1 },
    projectDuration: 8,
    activityProse: [
      'Stone on stone. The walls rise by the width of a hand each day.',
      'A civic building is a promise made in mortar.',
    ],
    completionProse: [
      'The building stands. The settlement has something it lacked before.',
    ],
    catalystEncounterIds: ['encounter_labor_dispute', 'encounter_building_collapse'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 60, reachFloor: { stone: 0.4, gold: 0.2 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'workshop', nameTemplate: "{actor}'s Workshop at {location}" },
  },

  // 4. Fortify Defenses — strengthen walls, gates, or watchtowers
  {
    id: 'strategic_fortify_defenses',
    displayName: 'Fortify Defenses',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.6, iron: 0.3, eye: 0.1 },
    projectDuration: 7,
    activityProse: [
      'Thickening the walls. Adding crenellations. Replacing rotten timbers.',
      'Defense is built in layers — stone, then iron, then habit.',
    ],
    completionProse: [
      'The defenses hold a new confidence. Attackers will find less welcome.',
    ],
    catalystEncounterIds: ['encounter_siege_preparation'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'castle', 'fort'] },
    resourceHint: { wealthCost: 50, reachFloor: { stone: 0.3, iron: 0.2 } },
    mutationHint: { type: 'modify_location_property', property: 'defense', delta: 15, clamp: [0, 100] },
  },

  // 5. Build Granary — food security infrastructure
  {
    id: 'strategic_build_granary',
    displayName: 'Build Granary',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.5, heart: 0.3, gold: 0.2 },
    projectDuration: 6,
    activityProse: [
      'Digging the foundations. Raising the beams. A granary is hope made practical.',
      'The grain will keep through winter. The people will remember who built this.',
    ],
    completionProse: [
      'The granary doors close on a full store. Hunger is a problem for somewhere else.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { wealthCost: 40, reachFloor: { stone: 0.3 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'granary', nameTemplate: "Granary at {location}" },
  },

  // 6. Maintain Civic Order — ongoing stewardship stance
  {
    id: 'strategic_maintain_civic_order',
    displayName: 'Maintain Civic Order',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'builder-civic',
    reachProfile: { heart: 0.5, stone: 0.3, gold: 0.2 },
    activityProse: [
      'Inspecting the infrastructure. Settling disputes. Keeping the machinery of civic life turning.',
      'Order is not a state. It is a practice.',
    ],
    completionProse: [
      'The settlement runs smoothly. For now.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { reachFloor: { heart: 0.3 } },
    mutationHint: { type: 'no_mutation' },
  },

  // ── The `masterwork_item` kind (THR-1297 §5, slice 5) ──────────────
  //
  // The T1 kind whose object is *already* an attachment: an artifact node plus a
  // `possesses` edge is exactly what the attachment layer reads, so this kind needed
  // no new carrying mechanism at all. Ownership rides `possesses`, not the `holding`
  // category — holdings are ground and organisations, and a hammer is neither.

  // 5. Craft Masterwork — create.
  {
    id: 'strategic_craft_masterwork',
    displayName: 'Craft Masterwork',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.5, iron: 0.3, star: 0.2 },
    projectDuration: 8,
    activityProse: [
      'The fourth attempt. The first three were competent, which is the problem.',
      'Working past the point where it is finished, toward the point where it is right.',
    ],
    completionProse: [
      'It is done, and it is better than the maker. That is the whole definition.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { wealthCost: 40, reachFloor: { stone: 0.35 } },
    checkpointDifficulty: 0.5,
    payoffValue: 0.8,
    motivations: ['preservation_transformation', 'tradition_novelty'],
    // The patron is optional in the design and therefore `scene-only`: a commission
    // shapes the work without owing the world another permanent person.
    cast: [
      {
        key: 'patron',
        kind: 'actor',
        persistence: 'scene-only',
        acceptedRoles: ['noble', 'merchant', 'faction_rep', 'elder'],
        mintRole: 'noble',
      },
    ],
    // Tier 2 = Storied. A masterwork is by definition not Mundane, and calling it
    // Mythic would put a smith's good year beside artifacts the world tells stories about.
    mutationHint: { type: 'mint_masterwork', craftTag: 'masterwork', tier: 2 },
  },

  // 6. Improve the Work — update. Re-forging what is already made.
  {
    id: 'strategic_improve_masterwork',
    displayName: 'Improve the Work',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { stone: 0.45, iron: 0.3, eye: 0.25 },
    projectDuration: 5,
    activityProse: [
      'Taking apart something that already worked, on the suspicion that it could work better.',
    ],
    completionProse: [
      'The improvement is small and the difference is not. Anyone who uses it will feel it.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { wealthCost: 20, reachFloor: { stone: 0.3 } },
    checkpointDifficulty: 0.45,
    payoffValue: 0.6,
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    mutationHint: { type: 'no_mutation' },
  },

  // 7. Break the Work — counter-play. Motive-gated: destroying what someone spent a
  //    season making is the paradigm case of an act that needs a reason behind it.
  {
    id: 'strategic_destroy_masterwork',
    displayName: 'Break the Work',
    verb: 'destroy',
    executionMode: 'instant',
    behaviorFamily: 'builder-civic',
    reachProfile: { iron: 0.5, shadow: 0.3, stone: 0.2 },
    activityProse: [
      'It takes a moment. That is the offensive part, and everyone present knows it.',
    ],
    completionProse: [
      'What took a season to make is scrap. The skill that made it still exists; the thing does not.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { reachFloor: { iron: 0.25 } },
    checkpointDifficulty: 0.45,
    payoffValue: 0.55,
    motivations: ['mercy_ruthlessness', 'preservation_transformation'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a builder strategic template by ID */
export function getBuilderTemplate(id: string): StrategicActionTemplate | undefined {
  return BUILDER_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
