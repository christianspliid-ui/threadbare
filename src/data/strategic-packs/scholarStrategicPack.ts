// src/data/strategic-packs/scholarStrategicPack.ts
//
// Scholar-seeker behavior pack: research, discovery, knowledge control, expeditions.
// Ambitions: ambition_uncover_secrets, ambition_arcane_enlightenment
// Six templates covering the arc from research through discovery to knowledge monopoly.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const SCHOLAR_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Research Archive — gather knowledge at a library, temple, or ruin
  {
    id: 'strategic_research_archive',
    displayName: 'Research Archive',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.7, veil: 0.3 },
    activityProse: [
      'Turning pages that crumble at the edges. The knowledge is old but not dead.',
      'Cross-referencing, annotating, following threads between sources.',
    ],
    completionProse: [
      'The research yields a pattern — faint, but unmistakable.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'temple', 'ruins'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'archival_research' },
  },

  // 2. Investigate Anomaly — examine a site of unusual activity
  {
    id: 'strategic_investigate_anomaly',
    displayName: 'Investigate Anomaly',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.5, veil: 0.4, star: 0.1 },
    activityProse: [
      'Something here does not fit. The readings contradict, the locals contradict more.',
      'Measuring, sampling, recording. The anomaly does not care about being understood.',
    ],
    completionProse: [
      'The anomaly is documented. Whether that makes it less dangerous is another question.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['ruins', 'shrine', 'temple', 'oasis'] },
    resourceHint: { reachFloor: { eye: 0.3, veil: 0.2 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'anomaly_investigation' },
  },

  // 3. Write Treatise — compile knowledge into a lasting work
  {
    id: 'strategic_write_treatise',
    displayName: 'Write Treatise',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.6, veil: 0.3, heart: 0.1 },
    projectDuration: 8,
    activityProse: [
      'Ink and argument. The treatise takes shape through revision after revision.',
      'Writing is thinking made visible. The thoughts resist being pinned down.',
    ],
    completionProse: [
      'The treatise is complete. Knowledge that was scattered is now gathered.',
    ],
    catalystEncounterIds: ['encounter_academic_rivalry', 'encounter_forbidden_knowledge'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'temple'] },
    resourceHint: { wealthCost: 30, reachFloor: { eye: 0.4 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'treatise_published' },
  },

  // 4. Establish Research Circle — found a scholarly institution
  {
    id: 'strategic_establish_research_circle',
    displayName: 'Establish Research Circle',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.5, heart: 0.3, star: 0.2 },
    projectDuration: 10,
    activityProse: [
      'Recruiting minds. Finding space. Establishing protocols of inquiry.',
      'A research circle is a promise that the questions will outlast any single answer.',
    ],
    completionProse: [
      'The circle convenes for the first time. Scholarship has an address.',
    ],
    catalystEncounterIds: ['encounter_academic_rivalry', 'encounter_heretical_discovery'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital'] },
    resourceHint: { wealthCost: 80, reachFloor: { eye: 0.4, heart: 0.2 } },
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'research_circle', nameTemplate: "{actor}'s Research Circle at {location}" },
  },

  // 5. Mount Expedition — organize a scholarly expedition to a ruin or anomaly
  {
    id: 'strategic_mount_expedition',
    displayName: 'Mount Expedition',
    verb: 'gather_info',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.4, stone: 0.3, iron: 0.2, veil: 0.1 },
    projectDuration: 6,
    activityProse: [
      'Hiring guides. Packing supplies. The ruins do not welcome visitors.',
      'Expedition preparation is the art of expecting the unexpected.',
    ],
    completionProse: [
      'The expedition returns, loaded with notes and artifacts. The knowledge is hard-won.',
    ],
    catalystEncounterIds: ['encounter_ruin_trap', 'encounter_ancient_guardian'],
    targetRule: { type: 'location_subtype', subtypes: ['ruins', 'shrine', 'temple', 'oasis'] },
    resourceHint: { wealthCost: 50, reachFloor: { eye: 0.3 } },
    mutationHint: { type: 'record_intelligence', intelligenceType: 'expedition_findings' },
  },

  // 6. Guard Knowledge — maintain control over scholarly resources
  {
    id: 'strategic_guard_knowledge',
    displayName: 'Guard Knowledge',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.5, veil: 0.3, shadow: 0.2 },
    activityProse: [
      'Restricting access. Curating the collection. Knowledge is power only when controlled.',
      'The archive speaks only to those who are permitted to listen.',
    ],
    completionProse: [
      'The knowledge is secured. Access is granted, not assumed.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'temple', 'ruins'] },
    resourceHint: { reachFloor: { eye: 0.4 } },
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a scholar strategic template by ID */
export function getScholarTemplate(id: string): StrategicActionTemplate | undefined {
  return SCHOLAR_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
