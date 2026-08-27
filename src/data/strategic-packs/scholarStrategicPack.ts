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
    checkpointDifficulty: 0.4,
    payoffValue: 0.5,
    motivations: ['revelation_discretion', 'tradition_novelty'],
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
    checkpointDifficulty: 0.45,
    payoffValue: 0.6,
    motivations: ['revelation_discretion', 'courage_prudence'],
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
    checkpointDifficulty: 0.5,
    payoffValue: 0.7,
    motivations: ['revelation_discretion', 'preservation_transformation', 'tradition_novelty'],
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
    checkpointDifficulty: 0.5,
    payoffValue: 0.75,
    motivations: ['courage_prudence', 'tradition_novelty', 'revelation_discretion'],
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

  // ── Folded from the retired initiative pipeline (THR-1292 §3) ──────
  // 7. Train Apprentice — the mentorship arc, now an undertaking
  //    The `mentors` edge is the durable relationship; checkpoints drive the arc
  //    and the terminal band picks one of five endings. See `mentorshipUndertaking.ts`.
  //    No `reachProfile` floor is authored: the mentor-tier requirement is per-Reach
  //    and dynamic, enforced by the pairing gate in `strategicActionCandidates`.
  {
    id: 'strategic_train_apprentice',
    displayName: 'Train Apprentice',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { heart: 0.4, eye: 0.3, star: 0.3 },
    projectDuration: 8,
    activityProse: [
      'Setting the same exercise again. Watching for the moment it stops being an exercise.',
      'Teaching is mostly waiting, and being there when the waiting ends.',
    ],
    completionProse: [
      'The apprentice does it without being asked, and does it right. Something has transferred.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'camp'] },
    // Mentorship advances through conversation and proximity, not at a fixed stage —
    // the separation check in the fold is the real spatial constraint.
    requiresLocation: false,
    mutationHint: { type: 'no_mutation' },
  },

  // ── The `intelligence_cache` kind's counter-play (THR-1297 §5, slice 5) ──
  //
  // What a scholar accumulates is a *hoard of knowing*, and until now nothing in the
  // world could take it back — decay was ambient and impersonal. Exposure is the
  // deliberate act: someone with a reason publishes what you were keeping, and a
  // known secret is not a cache any more.
  //
  // 8. Expose the Cache — destroy, motive-gated.
  {
    id: 'strategic_expose_cache',
    displayName: 'Expose the Cache',
    verb: 'destroy',
    executionMode: 'instant',
    behaviorFamily: 'scholar-seeker',
    reachProfile: { eye: 0.45, shadow: 0.3, heart: 0.25 },
    activityProse: [
      'Copying it out and handing it to people who will not keep it quiet.',
    ],
    completionProse: [
      'What was held closely is now simply known. Nobody owns it, which was exactly the intent.',
    ],
    catalystEncounterIds: ['encounter_academic_rivalry'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'temple', 'ruins'] },
    resourceHint: { reachFloor: { eye: 0.25 } },
    checkpointDifficulty: 0.45,
    payoffValue: 0.6,
    motivations: ['revelation_discretion', 'honesty_cunning'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a scholar strategic template by ID */
export function getScholarTemplate(id: string): StrategicActionTemplate | undefined {
  return SCHOLAR_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
